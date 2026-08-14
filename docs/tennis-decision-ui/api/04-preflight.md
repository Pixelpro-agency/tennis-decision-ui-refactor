# API Preflight

## Scopo

Questo documento definisce il contratto HTTP del router:

```txt
backend/src/routes/test.js
```

Il router è montato sotto `/api/test` ed espone controlli diagnostici locali utilizzati prima di una sessione live.

I quattro endpoint del router non avviano tracking, scraper o browser e non scrivono timeline o altra persistenza applicativa.

Nel frontend i controlli Preflight sono **advisory**: possono essere eseguiti singolarmente oppure tramite `Run All Checks`, ma il loro stato non è usato come gate dal pulsante `Link Accounts & Start`.

Il check Backend mostrato insieme agli altri controlli usa `/api/health`, che non appartiene al router Preflight ed è documentato separatamente in [API Runtime Health](./05-runtime-health.md).

## Superficie HTTP

| Metodo | Endpoint                | Responsabilità corrente                       |
| ------ | ----------------------- | --------------------------------------------- |
| `POST` | `/api/test/cdp`         | Validazione locale e probe Chrome CDP         |
| `POST` | `/api/test/sofa-url`    | Validazione URL SofaScore ed estrazione event ID |
| `POST` | `/api/test/betfair-url` | Validazione URL Betfair ed estrazione event ID   |
| `POST` | `/api/test/graph-urls`  | Controllo preliminare delle Graph URL         |

Gli esiti di validazione gestiti di SofaScore, Betfair e Graph URL sono restituiti con HTTP `200`, anche quando il body contiene `ok: false`.

Il CDP usa HTTP `400` soltanto quando `cdpUrl` è assente, vuota o non ammessa. Dopo che la URL è stata accettata, gli esiti del probe restano HTTP `200` con `ok: true` oppure `ok: false`.

## Chrome CDP

```txt
POST /api/test/cdp
```

Payload:

```json
{
  "cdpUrl": "http://127.0.0.1:9222"
}
```

### Validazione della URL

`backend/src/utils/cdpUrl.js` possiede la normalizzazione e la classificazione della base URL CDP.

Sono ammesse soltanto URL con:

- protocollo `http`;
- host loopback `127.0.0.1`, `localhost` oppure `::1`;
- porta esplicita intera tra `1` e `65535`;
- nessuna username o password;
- nessuna query o fragment;
- nessun path applicativo oltre `/`.

Gli slash finali vengono rimossi dalla base URL normalizzata.

| Condizione | HTTP | Body |
| --- | ---: | --- |
| `cdpUrl` assente o vuota | `400` | `{ "ok": false, "code": "cdp_url_required", "error": "CDP URL required" }` |
| `cdpUrl` non valida | `400` | `{ "ok": false, "code": "cdp_url_invalid", "error": "Invalid CDP URL" }` |
| `cdpUrl` valida | probe gestito con `200` | richiesta a `<cdp-url-normalizzato>/json/version` |

Un input rifiutato dalla validazione non provoca alcun fetch.

La porta `9222` è un valore usato dal launcher e dagli esempi del progetto, non un fallback applicato dalla route: qualsiasi porta esplicita valida può essere accettata.

### Probe `/json/version`

Il probe usa `fetchWithTimeout` con timeout predefinito di quattro secondi e `AbortController`.

Risposta riuscita:

```json
{
  "ok": true,
  "cdpUrl": "<cdp-url-normalizzato>",
  "checkedUrl": "<cdp-url-normalizzato>/json/version",
  "webSocketDebuggerUrl": true,
  "browser": "<browser oppure null>"
}
```

Dopo la validazione della URL, i fallimenti del probe restano HTTP `200`:

| Condizione                                   | Campi rilevanti                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Body vuoto                                   | `ok: false`, `webSocketDebuggerUrl: false`, `error: "Empty response from CDP"`                    |
| Body non JSON                                | `ok: false`, `webSocketDebuggerUrl: false`, `error: "Invalid JSON from CDP"`                      |
| Risposta HTTP CDP non riuscita con body JSON | `ok: false`, `status`, `webSocketDebuggerUrl: false`, errore bounded con lo status HTTP           |
| `webSocketDebuggerUrl` assente               | `ok: false`, `browser`, `webSocketDebuggerUrl: false`, errore bounded                             |
| Timeout                                      | `ok: false`, `code: "cdp_timeout"`, `webSocketDebuggerUrl: false`, `error: "CDP unreachable"`     |
| Errore di fetch diverso dal timeout          | `ok: false`, `code: "cdp_unreachable"`, `webSocketDebuggerUrl: false`, `error: "CDP unreachable"` |

Le eccezioni raw del fetch non vengono propagate nel body della route.

## SofaScore event ID

```txt
POST /api/test/sofa-url
```

Payload:

```json
{
  "sofaUrl": "<sofascore-match-url>"
}
```

La route usa `classifySofaUrl` in `backend/src/utils/sofaUrl.js`.

La URL deve:

- essere una stringa non vuota;
- usare HTTPS;
- avere host `sofascore.com` oppure `www.sofascore.com`;
- non contenere credenziali;
- non usare una porta esplicita;
- consentire l'estrazione di un event ID tramite `backend/src/sofa/extractEventId.js`.

Risposta valida:

```json
{
  "ok": true,
  "eventId": "<eventId>"
}
```

Gli esiti non validi restituiscono HTTP `200`:

| Condizione                             | `code`                  | `error`                 |
| -------------------------------------- | ----------------------- | ----------------------- |
| Input assente o vuoto                  | `sofa_url_required`     | `Invalid SofaScore URL` |
| URL o tipo non ammessi                 | `sofa_url_invalid`      | `Invalid SofaScore URL` |
| URL ammessa ma event ID non estraibile | `sofa_event_id_missing` | `Invalid SofaScore URL` |

La route esegue soltanto validazione ed estrazione locali: non effettua fetch verso SofaScore e non avvia tracking.

## URL Betfair

```txt
POST /api/test/betfair-url
```

Payload:

```json
{
  "betfairUrl": "<betfair-market-url>"
}
```

La route usa `classifyBetfairUrl` in `backend/src/utils/betfairUrl.js` con `requireEventId: true`.

La URL deve:

- essere una stringa non vuota;
- usare HTTPS;
- non contenere credenziali;
- non usare una porta esplicita;
- usare uno degli host `betfair.it`, `www.betfair.it`, `betfair.com` o `www.betfair.com`;
- contenere nel path uno slug dal quale sia estraibile un event ID numerico di almeno sei cifre nella forma attesa dal validator.

Risposta valida:

```json
{
  "ok": true,
  "betfairUrl": "<url-normalizzata>",
  "domain": "<hostname>",
  "eventId": "<eventId>"
}
```

Gli esiti non validi restituiscono HTTP `200`:

| Condizione                             | `code`                     | `error`               |
| -------------------------------------- | -------------------------- | --------------------- |
| Input assente o vuoto                  | `betfair_url_required`     | `Invalid Betfair URL` |
| URL o tipo non ammessi                 | `betfair_url_invalid`      | `Invalid Betfair URL` |
| URL ammessa ma event ID non estraibile | `betfair_event_id_missing` | `Invalid Betfair URL` |

Il validator è condiviso anche da consumer runtime, ma con opzioni diverse: il Preflight richiede esplicitamente l'event ID, mentre tracking e apertura della finestra di login applicano il proprio contratto sopra lo stesso classificatore di base. Il risultato del Preflight non sostituisce quindi il contratto degli endpoint runtime.

La route non apre Betfair, non avvia lo scraper e non verifica disponibilità del mercato, identità del mercato o coerenza con SofaScore.

## Graph URL

```txt
POST /api/test/graph-urls
```

Payload con array:

```json
{
  "graphUrls": [
    "https://graphs.betfair.it/1.23456789/101/0",
    "https://graphs.betfair.it/1.23456789/202/0"
  ]
}
```

`graphUrls` può essere:

- un array;
- una stringa con valori separati da virgole;
- una stringa con valori separati da newline.

Il validatore puro è:

```txt
backend/src/routes/test/graphUrlValidation.js
```

Per le URL canoniche dirette, il controllo richiede:

- HTTPS;
- host esatto `graphs.betfair.it`;
- nessuna credenziale;
- nessuna porta esplicita;
- tre segmenti non vuoti interpretabili come `<marketId>/<selectionId>/0`;
- `marketId` nel formato numerico con punto, per esempio `1.23456789`;
- `selectionId` composto soltanto da cifre;
- nessuna `selectionId` duplicata tra le URL già accettate nella stessa richiesta.

Risposta valida:

```json
{
  "ok": true,
  "graphs": [
    {
      "url": "https://graphs.betfair.it/1.23456789/101/0",
      "marketId": "1.23456789",
      "selectionId": "101",
      "valid": true
    },
    {
      "url": "https://graphs.betfair.it/1.23456789/202/0",
      "marketId": "1.23456789",
      "selectionId": "202",
      "valid": true
    }
  ],
  "sameMarket": true,
  "count": 2,
  "validCount": 2,
  "invalidCount": 0
}
```

`ok` è `true` soltanto quando esiste almeno una URL e nessun elemento risulta non valido.

Ogni elemento di `graphs` conserva la URL ricevuta e riporta:

- `marketId`;
- `selectionId`;
- `valid`;
- `error`, quando l'elemento è rifiutato.

Gli errori individuali prodotti dal validatore sono:

| `error`                             | Significato nel Preflight                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `bad_graph_url_invalid`             | URL, host, protocollo, porta, path, `marketId` o `selectionId` non ammessi       |
| `bad_graph_url_duplicate_selection` | `selectionId` già incontrata in una URL valida precedente della stessa richiesta |

Per input assente o non interpretabile come lista non vuota:

```json
{
  "ok": false,
  "error": "No graph URLs provided"
}
```

`sameMarket` considera soltanto i `marketId` aggiunti dagli elementi validi. È un'informazione diagnostica e non determina `ok`: URL valide appartenenti a market diversi possono produrre `ok: true` e `sameMarket: false`.

### Confine con la validazione runtime Python

Il Preflight Graph verifica la forma preliminare delle URL e restituisce gli ID estratti, ma non stabilisce che una URL sia assegnabile a un runner nella sessione Betfair corrente.

`scrapers/betfair/graph_url.py` possiede i controlli runtime ulteriori, tra cui:

- validazione della market identity attesa;
- confronto tra `marketId` della URL e market corrente;
- risoluzione della `selectionId` verso un runner API;
- rilevazione di selection ID ambigue o non trovate;
- controllo dei duplicati nel mapping runtime.

Il parser Python gestisce inoltre il rifiuto esplicito dell'endpoint `runnerChartData`.

Le URL canoniche dirette condividono la forma:

```txt
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

Un `valid: true` del Preflight non equivale quindi a una ladder runtime già risolta o disponibile.

La route Graph non esegue fetch, non verifica autenticazione Betfair, non apre browser e non controlla la disponibilità della ladder.

## Consumer frontend

`frontend/src/hooks/usePreflightChecks.js` coordina i cinque controlli mostrati dal frontend.

| Check UI  | Endpoint o sorgente          | Comportamento rilevante                                                                                                                                    |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend   | `GET /api/health`            | È `ok` soltanto se il body contiene `ok: true`, `service: "backend"` e `project: "tennis-decision-ui"`. Il contratto completo appartiene a Runtime Health. |
| CDP       | `POST /api/test/cdp`         | In modalità `persistent`, `Run All Checks` non invia la richiesta e imposta il check a `idle`.                                                             |
| SofaScore | `POST /api/test/sofa-url`    | Se `matchUrl` è assente, il check passa a `error` senza richiesta HTTP.                                                                                    |
| Betfair   | `POST /api/test/betfair-url` | Se la URL è assente, il check resta `idle` senza richiesta HTTP.                                                                                           |
| Graph     | `POST /api/test/graph-urls`  | Se non risultano Graph URL dopo il parsing frontend, il check resta `idle` senza richiesta HTTP.                                                           |

`Run All Checks` esegue in sequenza:

```txt
Backend
→ CDP, solo in modalità cdp
→ SofaScore
→ Betfair
→ Graph URL
```

Gli errori tecnici di `safeFetchJson` non vengono copiati nei messaggi pubblici dei check: il hook usa messaggi bounded per backend non raggiungibile/non riconosciuto, CDP, SofaScore, Betfair e Graph URL.

### Rapporto con `Link Accounts & Start`

`frontend/src/components/StartAnalysisPanel.jsx` passa gli stati e le funzioni Preflight a `PreflightChecks`, ma il pulsante `Link Accounts & Start` non consulta `checks` per decidere se avviare.

Il pulsante è disabilitato quando manca `matchUrl` oppure mentre `sofaLoading` è attivo. Il click richiama `handleSearch(...)` con i valori correnti del form indipendentemente dall'esito dei check Preflight.

Il Preflight è quindi diagnostico e advisory rispetto all'avvio frontend corrente.

## Confini e ownership

Il router Preflight:

- non avvia tracking;
- non avvia scraper;
- non apre browser;
- non scrive timeline o persistenza applicativa;
- non esegue stop globali.

`/api/health` non appartiene a `backend/src/routes/test.js`: è montato separatamente dal server ed è soltanto consumato dal check Backend del frontend. Il suo contratto completo appartiene ad [API Runtime Health](./05-runtime-health.md).

La validazione SofaScore del Preflight è definita da `classifySofaUrl`; il contratto di avvio/tracking appartiene invece all'API Match e non deve essere dedotto da questo endpoint.

La validazione sintattica Betfair usa `classifyBetfairUrl`, condiviso con altri consumer, ma il Preflight applica `requireEventId: true` e conserva quindi un proprio contratto HTTP.

`graphUrlValidation.js` è una funzione pura: riceve `graphUrls` e costruisce il risultato senza dipendere da Express, fetch, tracker, scraper, browser o stato runtime. La route `/graph-urls` si limita a passargli il valore ricevuto e a restituire il JSON risultante.

I controlli Graph runtime di market identity e mapping runner appartengono al modulo Python e non sono duplicati in questo documento.

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

La copertura direttamente pertinente verifica:

| Test                                           | Contratto coperto                                                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `routes/test/preflightContracts.test.mjs`      | classificazione SofaScore e Betfair, rifiuto di input non ammessi, timeout CDP, unreachable CDP e assenza dell'errore raw nel body |
| `routes/test/graphUrlValidation.test.mjs`      | input Graph assente, parsing stringa, `sameMarket`, input misti, formato ID, path, protocollo/host/porta e `selectionId` duplicate |
| `routes/test/graphUrlValidationRoute.test.mjs` | presenza della route e restituzione del risultato del validatore Graph                                                             |
| `hooks/usePreflightChecks.test.mjs`            | CDP locale e normalizzato, skip in modalità Persistent, messaggi frontend bounded e riconoscimento dell'identità Backend           |

I test documentano il comportamento implementato; non introducono un gate Preflight per `Link Accounts & Start`.

## Documenti collegati

- [API Match](./01-match.md)
- [API Betfair](./02-betfair.md)
- [API Runtime Health](./05-runtime-health.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Validazione Graph URL Betfair](../modules/python/04-betfair-graph-url-validation.md)
- [Mappa del repository](../reference/01-repository-map.md)
