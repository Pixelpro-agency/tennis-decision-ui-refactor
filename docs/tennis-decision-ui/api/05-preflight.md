# API Preflight

## Scopo

Questo documento definisce il contratto HTTP del router:

```txt
backend/src/routes/test.js
```

Il router esegue verifiche leggere prima dell’avvio di una sessione live.

Non avvia tracking, scraper, browser o scritture di timeline.

## Endpoint

| Metodo | Endpoint                | Scopo                                         |
| ------ | ----------------------- | --------------------------------------------- |
| `GET`  | `/api/test/health`      | Verifica minima del backend                   |
| `POST` | `/api/test/cdp`         | Verifica Chrome CDP                           |
| `POST` | `/api/test/sofa-url`    | Estrae event ID da URL SofaScore              |
| `POST` | `/api/test/betfair-url` | Valida sintatticamente URL e event ID Betfair |
| `POST` | `/api/test/graph-urls`  | Esegue il preflight backend delle Graph URL   |

## Health

```txt
GET /api/test/health
```

Risposta:

```json
{
  "ok": true,
  "service": "backend",
  "timestamp": "<ISO timestamp>"
}
```

## CDP

```txt
POST /api/test/cdp
```

Payload:

```json
{
  "cdpUrl": "<cdp-url>"
}
```

La URL deve rispettare tutti i vincoli:

```txt
protocollo http
host locale: 127.0.0.1 | localhost | ::1
porta esplicita fra 1 e 65535
nessuna username o password
path applicativo assente
query assente
fragment assente
```

Esiti di validazione:

| Condizione | HTTP | Body |
| --- | ---: | --- |
| Input assente o vuoto | `400` | `{ ok: false, code: "cdp_url_required", error: "CDP URL required" }` |
| Input non valido | `400` | `{ ok: false, code: "cdp_url_invalid", error: "Invalid CDP URL" }` |
| Input valido | `200` gestito | Verifica `<cdp-url>/json/version` |

Input vuoto o non valido non esegue alcun fetch.

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

Gli errori raggiunti dopo la validazione restano risposte JSON con HTTP `200` e `ok: false`:

| Condizione | Campi rilevanti |
| --- | --- |
| Risposta vuota | `webSocketDebuggerUrl: false`, `error: "Empty response from CDP"` |
| JSON non valido | `webSocketDebuggerUrl: false`, `error: "Invalid JSON from CDP"` |
| HTTP CDP non riuscito | `status`, `webSocketDebuggerUrl: false`, `error` statico |
| Endpoint senza WebSocket | `browser`, `webSocketDebuggerUrl: false`, `error` statico |
| Endpoint irraggiungibile | `webSocketDebuggerUrl: false`, `error: "CDP unreachable"` |

La route non apre Chrome, non avvia tracking e non modifica la sessione browser. `9222` è soltanto la porta preferita del launcher: non è un fallback della route.

## URL SofaScore

```txt
POST /api/test/sofa-url
```

Payload:

```json
{
  "sofaUrl": "<sofascore-match-url>"
}
```

Risposta valida:

```json
{
  "ok": true,
  "eventId": "<eventId>"
}
```

Risposta non valida:

```json
{
  "ok": false,
  "error": "Could not extract SofaScore eventId"
}
```

L’estrazione è locale. La route non esegue fetch SofaScore.

Gli esiti gestiti restituiscono status HTTP `200`.

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

La route verifica localmente:

```txt
URL parseabile
→ hostname compatibile con il controllo backend Betfair
→ event ID numerico nel path URL
```

L’event ID viene cercato nello slug del path con almeno sei cifre.

Risposta valida:

```json
{
  "ok": true,
  "betfairUrl": "<url>",
  "domain": "<hostname>",
  "eventId": "<eventId>"
}
```

| Condizione                         | Risposta                                           |
| ---------------------------------- | -------------------------------------------------- |
| URL assente o non stringa          | `Betfair URL missing`                              |
| URL non parseabile                 | `Invalid URL format`                               |
| Dominio non valido                 | `Not a Betfair domain`                             |
| Event ID non estraibile dallo slug | `Could not extract numeric event id from URL slug` |

Gli esiti gestiti restituiscono status HTTP `200`.

La route non apre Betfair, non avvia lo scraper e non verifica che il mercato sia disponibile o coerente con SofaScore.

## Preflight Graph URL backend

```txt
POST /api/test/graph-urls
```

Payload:

```json
{
  "graphUrls": [
    "https://graphs.betfair.com/1.23456789/101",
    "https://graphs.betfair.com/1.23456789/202"
  ]
}
```

`graphUrls` può essere:

* un array di URL;
* una stringa con valori separati da virgole;
* una stringa con valori separati da newline.

Il modulo puro è:

```txt
backend/src/routes/test/graphUrlValidation.js
```

Risposta valida:

```json
{
  "ok": true,
  "graphs": [
    {
      "url": "https://graphs.betfair.com/1.23456789/101",
      "marketId": "1.23456789",
      "selectionId": "101",
      "valid": true
    }
  ],
  "sameMarket": true,
  "count": 1,
  "validCount": 1,
  "invalidCount": 0
}
```

`ok` è `true` solo quando esiste almeno una URL e tutte le URL sono valide.

Ogni elemento di `graphs` conserva l’URL ricevuta e riporta:

```txt
marketId
selectionId
valid
error, quando non valido
```

Errori individuali possibili:

```txt
Not a graphs.betfair.* domain
Path too short
marketId or selectionId format invalid
Invalid URL
```

Per input assente o non interpretabile come lista di URL:

```json
{
  "ok": false,
  "error": "No graph URLs provided"
}
```

`sameMarket` è un’informazione diagnostica derivata soltanto dai `marketId` validi. Non determina `ok`.

Per esempio, una lista con una URL valida e una non valida può avere:

```txt
sameMarket = true
ok = false
```

Questo endpoint non verifica:

* l’accettazione della URL diretta da parte dello scraper Python;
* il confronto tra `marketId` e `market_info.market_id`;
* la risoluzione del runner API;
* duplicati di `selectionId` nella stessa esecuzione;
* disponibilità della ladder o del browser;
* autenticazione Betfair.

Un risultato `valid: true` non equivale a una ladder assegnabile dallo scraper Python.

Per la validazione di estrazione diretta consultare il documento Graph URL Python.

Per compatibilità, gli errori di validazione Graph URL restano risposte JSON con status HTTP `200`.

## Confini

`graphUrlValidation.js` deve restare puro.

Non deve dipendere da:

* Express;
* fetch;
* tracker;
* scraper;
* persistenza;
* Chrome;
* browser;
* timeline.

La route deve limitarsi a passare `graphUrls` al validatore e restituire il body JSON.

L’intero router Preflight non deve avviare tracking, scraper, browser o stop globale.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check routes/test.js
node --check routes/test/graphUrlValidation.js
node routes/test/graphUrlValidation.test.mjs
node routes/test/graphUrlValidationRoute.test.mjs
```

Smoke test sicuro:

```txt
POST /api/test/graph-urls
```

con Graph URL sintetiche.

Verificare almeno:

```txt
CDP senza cdpUrl
→ HTTP 400 cdp_url_required e nessun fetch

Sofa URL non valida
→ body ok false senza fetch

Betfair URL non valida
→ body ok false senza scraper

Graph URL valide nello stesso market
→ ok true e sameMarket true

Graph URL valide in market diversi
→ ok true e sameMarket false

Graph URL miste valide e non valide
→ ok false con dettagli per ogni URL
```

## Documenti collegati

* [API Match](./01-match.md)
* [API Betfair](./02-betfair.md)
* [Runtime locale](../operations/01-local-runtime.md)
* [Validazione Graph URL Betfair](../modules/python/04-betfair-graph-url-validation.md)
* [Mappa del repository](../reference/01-repository-map.md)
* [Selezione del contesto per API AI](../ai/01-context-selection.md)
