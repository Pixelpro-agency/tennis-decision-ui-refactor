# API Preflight

## Scopo e stato

Il router `backend/src/routes/test.js` espone controlli diagnostici locali prima di una sessione live. I check non avviano tracking, scraper o browser e non scrivono timeline.

Nel frontend sono **advisory**: l'utente può eseguirli singolarmente o insieme, ma il pulsante `Link Accounts & Start` non usa il loro esito come gate. Un eventuale gate obbligatorio richiede una decisione e un contratto dedicati.

## Endpoint

| Metodo | Endpoint                | Responsabilità corrente                       |
| ------ | ----------------------- | --------------------------------------------- |
| `POST` | `/api/test/cdp`         | Validazione locale e probe Chrome CDP         |
| `POST` | `/api/test/sofa-url`    | Estrazione locale di un event ID              |
| `POST` | `/api/test/betfair-url` | Controllo sintattico locale della URL Betfair |
| `POST` | `/api/test/graph-urls`  | Controllo preliminare delle Graph URL         |

Gli endpoint SofaScore, Betfair e Graph restituiscono gli esiti di validazione gestiti con HTTP `200` e `ok: false`. Il CDP usa HTTP `400` soltanto per input assente o non ammesso; gli errori del probe restano HTTP `200` con `ok: false`.

## Chrome CDP

```txt
POST /api/test/cdp
{ "cdpUrl": "http://127.0.0.1:9222" }
```

`classifyCdpBaseUrl` e `buildCdpVersionUrl`, in `backend/src/utils/cdpUrl.js`, sono gli owner della validazione e della costruzione di `/json/version`. Sono ammessi soltanto:

- protocollo HTTP;
- host loopback `127.0.0.1`, `localhost` o `::1`;
- porta esplicita tra 1 e 65535;
- nessuna credenziale, query, fragment o path applicativo.

Input assente e input non valido producono rispettivamente `cdp_url_required` e `cdp_url_invalid`, HTTP `400`, senza fetch. Un input valido viene normalizzato e interrogato su `<cdp-url>/json/version`.

Il probe usa `fetchWithTimeout` con timeout di quattro secondi e `AbortController`. Timeout e destinazione irraggiungibile espongono rispettivamente `cdp_timeout` e `cdp_unreachable`; empty body, JSON non valido, HTTP non riuscito e WebSocket assente restano risposte bounded. Nessun errore raw viene propagato. La porta `9222` è una preferenza del launcher, non un fallback della route.

## SofaScore event ID

```txt
POST /api/test/sofa-url
{ "sofaUrl": "<valore>" }
```

La route usa il validator canonico `backend/src/utils/sofaUrl.js` e restituisce `{ "ok": true, "eventId": "..." }` oppure un reason code bounded.

Sono ammessi HTTPS, `sofascore.com` e `www.sofascore.com`, senza credenziali o porta esplicita; dopo la validazione viene estratto l'event ID. L'input raw non viene registrato e non viene eseguito alcun fetch.

## URL Betfair

```txt
POST /api/test/betfair-url
{ "betfairUrl": "<valore>" }
```

Il validator canonico `backend/src/utils/betfairUrl.js`, condiviso da Preflight, Start e login:

1. richiede una stringa non vuota;
2. richiede HTTPS e vieta credenziali e porte esplicite;
3. accetta soltanto gli host canonici Betfair `.it` e `.com`, con o senza `www`;
4. cerca nello slug un event ID numerico di almeno sei cifre.

La response riuscita contiene `ok`, URL normalizzata, `domain` ed `eventId`. Gli errori usano reason code bounded. Il controllo non apre Betfair e non verifica disponibilità o coerenza del mercato.

## Graph URL

```txt
POST /api/test/graph-urls
{ "graphUrls": ["https://graphs.betfair.com/1.23456789/101"] }
```

`backend/src/routes/test/graphUrlValidation.js` è il validatore puro. Accetta un array oppure una stringa separata da virgole o newline. Per ogni valore restituisce URL originale, `marketId`, `selectionId`, `valid` ed eventuale `error`; il riepilogo contiene `sameMarket`, `count`, `validCount` e `invalidCount`.

`ok` è vero soltanto se esiste almeno una URL e tutte sono valide. `sameMarket` considera solo i market ID validi e non determina `ok`.

La grammatica è allineata al parser runtime Python: HTTPS, host esatto `graphs.betfair.it`, nessuna credenziale o porta, path `<marketId>/<selectionId>/0` e selection ID non duplicato. I reason code bounded coincidono con il dominio `bad_graph_url_*`. La risoluzione del runner e il confronto con il market ID API restano responsabilità runtime documentate in [Validazione Graph URL Betfair](../modules/python/04-betfair-graph-url-validation.md).

## Consumer frontend

`frontend/src/hooks/usePreflightChecks.js` coordina i cinque check mostrati da `PreflightChecks.jsx`:

- Backend usa l'authority unica `/api/health`;
- CDP viene saltato in modalità `persistent`;
- URL Betfair e Graph assenti restano in stato `idle`;
- `Run All Checks` esegue i controlli in sequenza;
- gli esiti aggiornano soltanto la UI e non autorizzano l'avvio.

La UI converte gli errori tecnici in messaggi bounded: non mostra `Error.message`, URL del target o snippet della risposta. I messaggi Preflight non contengono mojibake.

## Confini

Il router Preflight non deve avviare tracking, scraper, browser, persistenza o stop globali. `graphUrlValidation.js` deve restare puro e non dipendere da Express, fetch o stato runtime.

Le validazioni SofaScore, Betfair e Graph sono oggi authority parziali e duplicate. Non vanno descritte come convalida definitiva finché non vengono unificate con gli owner runtime.

## Verifica corrente

Dalla cartella `backend/src`:

```txt
node --check routes/test.js
node --check routes/test/graphUrlValidation.js
node routes/test/graphUrlValidation.test.mjs
node routes/test/graphUrlValidationRoute.test.mjs
node routes/test/preflightContracts.test.mjs
```

Dalla cartella `frontend/src`:

```txt
node hooks/usePreflightChecks.test.mjs
```

La copertura automatica verifica timeout e unreachable CDP, validator e route SofaScore/Betfair, parità Graph e duplicati, modalità frontend Persistent/CDP, sequenza advisory e redazione dei messaggi pubblici. I test dei consumer Betfair coprono inoltre Start e login; la precedente route `/odds` è stata rimossa e non è più un consumer corrente.

## Documenti collegati

- [API Match](./01-match.md)
- [API Betfair](./02-betfair.md)
- [API Runtime Health](./05-runtime-health.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Validazione Graph URL Betfair](../modules/python/04-betfair-graph-url-validation.md)
- [Mappa del repository](../reference/01-repository-map.md)
