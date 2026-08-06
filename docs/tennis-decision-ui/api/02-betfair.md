# API Betfair

## Scopo

Questo documento definisce il contratto HTTP del router:

```txt
backend/src/routes/betfair.js
```

Il router espone:

- lettura della timeline Betfair;
- payload `latest`, health e Money Flow;
- stato additivo `integrity` sulle letture Betfair;
- fetch esplicito delle quote;
- lettura del log Betfair;
- apertura di una finestra di login separata.

Il router non deve trasformare un endpoint read-only in un punto di avvio implicito del tracking, dello scraper, della recovery o della persistenza.

## Struttura del router

```txt
backend/src/routes/
├── betfair.js
└── betfair/
    ├── cdpStatus.js
    ├── latestPayload.js
    ├── moneyFlowHistory.js
    ├── moneyFlowHistorySeries.js
    ├── oddsResponse.js
    ├── loginWindow.js
    └── loginWindowLifecycle.js

backend/src/runtime/
├── pythonProcessRegistry.js
└── runtimeLogger.js

backend/src/sofa/
└── matchHistory.js
```

| Modulo                      | Responsabilità                                                              |
| --------------------------- | --------------------------------------------------------------------------- |
| `latestPayload.js`          | Costruisce latest, health, metadata, Money Flow e `integrity` read-only     |
| `moneyFlowHistory.js`       | Costruisce e valida il point `matchedVolume` non direzionale                |
| `moneyFlowHistorySeries.js` | Deriva serie per `selectionId` dagli ultimi tick validi                     |
| `oddsResponse.js`           | Valida query e delega il fetch Betfair esplicito                            |
| `cdpStatus.js`              | Verifica CDP soltanto quando `mode=cdp`                                     |
| `loginWindow.js`            | Costruisce argomenti e runtime identity del login Python                    |
| `loginWindowLifecycle.js`   | Deduplica il login-only e coordina `spawnReady` e stato attivo              |
| `pythonProcessRegistry.js`  | Possiede fisicamente il figlio `betfair_login`                              |
| `runtimeLogger.js`          | Logging strutturato, lettura bounded e redazione                            |
| `matchHistory.js`           | Espone letture canoniche Betfair e adapter `getMatchPersistenceIntegrity` |

## Endpoint

| Metodo | Endpoint                       | Effetto                                                             |
| ------ | ------------------------------ | ------------------------------------------------------------------- |
| `GET`  | `/api/betfair/:eventId/latest` | Restituisce ultimo tick valido, health, Money Flow e `integrity`    |
| `GET`  | `/api/betfair/:eventId/json`   | Restituisce la timeline Betfair persistita con `integrity` additiva |
| `GET`  | `/api/betfair/odds?url=<url>`  | Esegue un fetch Betfair esplicito                                   |
| `GET`  | `/api/betfair/log`             | Restituisce le righe più recenti del log Betfair                    |
| `POST` | `/api/betfair/login-window`    | Richiede l’apertura di una finestra di login Betfair                |

## Stato della superficie `/odds`

```txt
GET /api/betfair/odds
```

è ancora presente e deve continuare a essere documentato finché il codice esiste, ma è **deprecato**.

Regole:

- non estendere `/odds` con nuovi comportamenti;
- non usarlo come base per nuove letture canoniche o nuovi consumer frontend;
- le letture canoniche restano `/latest` e `/json`;
- la rimozione futura richiede una task dedicata con aggiornamento di router, test, documentazione e consumer;
- la deprecazione non modifica il contratto HTTP corrente descritto più avanti.

## Letture Betfair read-only

Le route di lettura canonica Betfair sono:

```txt
GET /api/betfair/:eventId/latest
GET /api/betfair/:eventId/json
```

Queste route leggono solo timeline già persistite e stato journal già esistente.

Non devono:

```txt
avviare scraper
avviare browser
avviare fetch quote
scrivere journal
eseguire recovery
generare nuovi tick
generare nuove row history
modificare marketState
```

Per queste route il router usa l’adapter read-only:

```txt
getMatchPersistenceIntegrity(eventId, 'betfair')
```

Nel contratto Betfair questo adapter viene usato solo con:

```txt
source: 'betfair'
```

L’adapter:

- legge lo stato journal tramite `journalStore.getPersistenceIntegrityStatus(eventId, source)`;
- normalizza il risultato al contratto pubblico;
- non crea directory;
- non scrive journal;
- non esegue recovery;
- non accede a payload journalizzati;
- non espone target, path locali o dettagli filesystem.

## Integrity Betfair read-only

`integrity` è osservabilità read-only della persistenza Betfair.

Non è:

```txt
health
freshness
Graph health
runtime scraper
CDP status
Money Flow validation
ladder reliability
Source Identity mismatch
```

Quando la timeline Betfair esiste, la risposta resta `HTTP 200` e mantiene la shape originale del documento letto o del payload `latest`.

In più viene aggiunto un campo top-level:

```js
{
  "integrity": {
    "status": "no_known_partial | partial_persistence | recovery_failed",
    "reason": "<string|null>",
    "source": "betfair|null",
    "commitId": "<string|null>",
    "affectedDocuments": ["history", "timeline"]
  }
}
```

Esempio `latest`:

```json
{
  "ok": true,
  "eventId": "16305613",
  "latest": {},
  "latestTimestamp": "2026-07-10T20:00:00.000Z",
  "health": {},
  "moneyFlowHistory": {
    "series": []
  },
  "metadata": {},
  "integrity": {
    "status": "no_known_partial",
    "reason": null,
    "source": "betfair",
    "commitId": null,
    "affectedDocuments": []
  }
}
```

Esempio `json` con persistenza incompleta:

```json
{
  "eventId": "16305613",
  "timeline": [],
  "integrity": {
    "status": "partial_persistence",
    "reason": "commit_incomplete",
    "source": "betfair",
    "commitId": "betfair-550e8400-e29b-41d4-a716-446655440000",
    "affectedDocuments": ["timeline"]
  }
}
```

Il documento letto viene clonato prima dell’aggiunta di `integrity`.

Se il documento persistito contiene già una proprietà `integrity`, la risposta usa l’integrity calcolata dall’adapter senza mutare l’oggetto originale.

Valori pubblici:

```txt
no_known_partial
partial_persistence
recovery_failed
```

La source pubblica è limitata a:

```txt
betfair
null
```

`affectedDocuments` può contenere solo:

```txt
history
timeline
```

Input malformati o non canonici vengono normalizzati a un contratto pubblico sicuro.

## Risorsa assente e `409 persistence_integrity`

```txt
integrity.status = no_known_partial
+ timeline assente
→ HTTP 404 invariato
```

```txt
integrity.status = partial_persistence | recovery_failed
+ timeline assente
→ HTTP 409
→ error: persistence_integrity
→ integrity nel body
```

Esempio:

```json
{
  "error": "persistence_integrity",
  "integrity": {
    "status": "partial_persistence",
    "reason": "commit_incomplete",
    "source": "betfair",
    "commitId": "betfair-550e8400-e29b-41d4-a716-446655440000",
    "affectedDocuments": ["history", "timeline"]
  }
}
```

La risposta non espone path locali, payload journalizzati, target, metadata interni, stack trace o dettagli filesystem.

Il router non tenta recovery prima di rispondere.

Per `/latest`, il body di errore può conservare una `health` già calcolata quando è disponibile e sicura. `health` resta comunque distinta da `integrity`.

## Latest, health e Money Flow

```txt
GET /api/betfair/:eventId/latest
```

Query opzionali:

```txt
mode
cdpUrl
```

`mode=cdp` e `cdpUrl` sono usati soltanto per calcolare lo stato CDP nella health. Non avviano browser, scraper o fetch esterno.

La risposta contiene:

```txt
ok
eventId
latest
latestTimestamp
health
moneyFlowHistory
metadata
integrity
```

`latestTimestamp` deriva esclusivamente dal tick Betfair canonico più recente, incluso un eventuale tick `status-only`.

Non deriva dall’ora della richiesta HTTP, dall’ultimo scrape riuscito o dal runtime effimero del tracker.

### Runtime effimero e health

`health` combina:

```txt
timeline persistita
→ stato CDP
→ runtime Betfair effimero del tracker
```

Il runtime può essere letto internamente anche in assenza di timeline, ma non viene esposto come proprietà top-level `runtime` e non entra in `latest`, timeline, history o integrity.

Quando manca la timeline e non esiste un partial noto:

```txt
nessun errore runtime attivo
→ HTTP 404
→ health unknown

errore tecnico runtime attivo
→ HTTP 404
→ health yellow / DEGRADED
```

Quando manca la timeline e la persistenza è incompleta:

```txt
partial_persistence | recovery_failed
→ HTTP 409 persistence_integrity
```

`health` può includere timestamp, età del tick e della ladder, errori tecnici, stato login, Graph URL, mercato e stato Sofa live.

`integrity` non deriva dalla health e non la degrada automaticamente.

### Logout Graph e tick `status-only`

Quando il backend persiste un tick canonico di sola transizione per un logout Graph esplicito, `latest` può riferirsi a quel tick.

Il tick conserva mercato e runner dell’ultimo tick canonico e non adotta quote, volumi, ladder o Money Flow regressivi.

Può esporre:

```txt
latest.diagnostics.graphLoginRequired = true
latest.diagnostics.statusOnlyGraphLogin = true
latest.graphHealth.status = auth_suspected
health.status = red
health.alert = true
```

L’eccezione è limitata al logout Graph esplicito con tick precedente, login richiesto rilevato, assenza di righe ladder e sample regressivo. Errori rete/API e regressioni ordinarie non vengono classificati come logout.

`integrity` resta indipendente da questo stato.

### Money Flow History

`moneyFlowHistory` usa al massimo gli ultimi venti tick validi.

```txt
moneyFlowHistory = {
  series: [
    {
      selectionId,
      name,
      points
    }
  ]
}
```

`selectionId`, normalizzato a stringa, è l’unica identità della serie.

```txt
selectionId identico
→ stessa serie

stesso selectionId con nome aggiornato
→ continuità

stesso nome con selectionId diverso
→ serie separate

runner senza selectionId
→ nessuna serie
```

Ogni point pubblico usa:

```js
{
  timestamp,
  matchedVolume,
  runnerMatchedDelta,
  marketMatchedDelta,
  ladderTradedDelta,
  reason,
  validationReasons,
  seq,
  graphHealth,
  ladderSource,
  volumeDetected,
  validForDisplay,
  invalidVolume,
  anomaly
}
```

Priorità del volume:

```txt
raw runner delta valido
→ matchedVolume = raw runner delta

raw assente + computed valido
→ matchedVolume = computed runner delta

entrambi assenti
→ matchedVolume = 0
→ volumeDetected = false
```

Un point è invalido in presenza di delta negativo, riduzione del total matched, runner delta oltre il market delta, divergenza raw/computed non accettabile o zero-vs-positivo.

In caso invalido:

```txt
matchedVolume = 0
validForDisplay = false
invalidVolume = true
anomaly = true
```

La tolleranza raw/computed è del 10% soltanto quando entrambi i valori sono positivi.

Ladder traded, Back, Lay e `classifiedVolume` non invalidano da soli il volume dashboard. Una ladder assente può accompagnare un `matchedVolume` valido quando runner delta e market delta sono coerenti.

Il read model dashboard non espone direzione, trend o confidence.

`integrity` non ricalcola Money Flow.

## Timeline Betfair

```txt
GET /api/betfair/:eventId/json
```

| Condizione                                     | Status | Risposta                                         |
| ---------------------------------------------- | ------ | ------------------------------------------------ |
| Timeline disponibile                           | `200`  | Documento completo con `integrity`               |
| Timeline assente e nessun partial noto         | `404`  | `Betfair JSON timeline not found for this event` |
| Timeline assente e persistenza incompleta nota | `409`  | `persistence_integrity` con `integrity`           |

Non avvia scraper, browser, fetch esterno, recovery o repair.

## Fetch quote deprecato

```txt
GET /api/betfair/odds
```

La query richiede `url` e supporta anche:

```txt
sofaEventId
ladderUrls oppure graphUrls
mode
profileDir
cdpUrl
networkCapture
```

`ladderUrls` e `graphUrls` accettano valori separati da virgole o newline.

| Caso           | Status |
| -------------- | ------ |
| URL mancante   | `400`  |
| Fetch riuscito | `200`  |
| Errore fetch   | `500`  |

La risposta può essere JSON oppure un body serializzato. Quando il response builder fornisce un `content-type`, il router lo inoltra.

`/odds` è un fetch esplicito deprecato. Non è una lettura canonica `latest/json` e non espone `integrity` come contratto obbligatorio.

Un fetch riuscito non implica un commit canonico completo o recuperato.

### Network capture

La diagnostica è abilitata soltanto con:

```txt
networkCapture=true
```

Query assente, `false` o valori diversi da `true` mantengono la capture disabilitata.

La redazione avviene nel percorso Python prima della scrittura. Non devono essere inclusi journal, payload journalizzati, target locali, cookie, token, header sensibili o dump raw non redatti.

## Log Betfair

```txt
GET /api/betfair/log
```

La route legge il path fisso `backend/betfair_scraper.log`; la richiesta non può scegliere il file o aumentare i limiti.

Risposta HTTP `200`:

```json
{
  "status": "ok | not_found | read_failed",
  "lines": []
}
```

Contratto:

```txt
massimo 200 linee
massimo 1000 caratteri per linea
lettura bounded sugli ultimi 512 KiB
redazione anche in lettura
Cache-Control: no-store
```

Non vengono esposti errori raw, path locali, cookie, token, app key, payload o dump.

## Login Betfair

```txt
POST /api/betfair/login-window
```

Campi:

```txt
url
mode
profileDir
cdpUrl
```

`mode` usa `persistent` come default. `profileDir` viene normalizzata solo in modalità persistent; `cdpUrl` è richiesta e validata solo in modalità CDP.

| Caso                         | HTTP  | Body pubblico                                                                                              |
| ---------------------------- | ----: | ---------------------------------------------------------------------------------------------------------- |
| Target vuoto                 | `200` | `{ ok: true, status: "no_target", opened: false, reused: false }`                                          |
| URL Betfair non valida       | `400` | `{ ok: false, code: "betfair_url_invalid", error: "Invalid Betfair URL" }`                                 |
| CDP assente                  | `400` | `{ ok: false, code: "cdp_url_required", error: "CDP URL required" }`                                       |
| CDP non valida               | `400` | `{ ok: false, code: "cdp_url_invalid", error: "Invalid CDP URL" }`                                         |
| Scraper assente              | `500` | `{ ok: false, code: "scraper_not_found", error: "Betfair scraper not available" }`                         |
| Primo avvio compatibile      | `200` | `{ ok: true, status: "started", opened: true, reused: false }`                                             |
| Login compatibile già attivo | `200` | `{ ok: true, status: "already_active", opened: true, reused: true }`                                       |
| Runtime incompatibile        | `409` | `{ ok: false, code: "login_runtime_conflict", error: "An incompatible login session is already active." }` |
| Spawn fallito                | `500` | `{ ok: false, code: "login_spawn_failed", error: "Unable to open Betfair login window." }`                 |

`started` viene restituito soltanto dopo `spawnReady`; `already_active` non esegue un secondo spawn; il conflitto non esegue kill o restart.

Il ruolo `betfair_login` è distinto dai ruoli tracking. Stop usa `scope=tracking`; shutdown usa `scope=all`.

Un `200` non conferma che l’utente abbia completato il login.

## Confini

- `latest` e `json` non avviano scraper o browser;
- `latest` e `json` non eseguono recovery e non scrivono journal;
- `latest` può leggere runtime in memoria soltanto per la health;
- `integrity` deriva dal journal store in modo read-only;
- `/odds` è l’unico endpoint che richiede un fetch esterno ed è deprecato;
- il router non conferma il baseline runner;
- il router non duplica parsing, normalizzazione, Money Flow o health;
- il router non espone dati sensibili o runtime interno completo;
- Money Flow resta non direzionale.

## Verifica

Dalla cartella `backend/src`:

```txt
node routes/betfair/latestPayloadResponse.test.mjs
node routes/betfair/latestPayloadIntegrity.test.mjs
node routes/betfair/betfairJsonResponse.test.mjs
node routes/betfair/normalizeIntegrity.test.mjs
node routes/betfair/moneyFlowHistorySeries.test.mjs
node sofa/betfairMoneyFlowValidation.test.mjs
node routes/betfair/oddsResponse.test.mjs
node sofa/matchHistory/commitJournal/lifecycle.test.mjs
node sofa/matchHistory/commitJournal/integrityStatus.test.mjs
node sofa/matchHistory/commitJournal/residualRecovery.test.mjs
node sofa/matchHistory/recovery/basicRecovery.integration.test.mjs
node sofa/matchHistory/recovery/completedTargetVerification.integration.test.mjs
node --check routes/betfair/loginWindow.js
```

I vecchi percorsi monolitici seguenti non esistono nella tree corrente:

```txt
sofa/matchHistory/commitJournal.test.mjs
sofa/matchHistory/recovery.test.mjs
```

Verificare almeno:

```txt
latest e json
→ 200, 404 e 409 corretti
→ runtime non esposto
→ integrity senza mutare documenti persistiti
→ source pubblica solo betfair o null

health degradata
→ non modifica integrity

partial_persistence o recovery_failed
→ non modifica automaticamente health, freshness, Graph health o Money Flow

Money Flow
→ selectionId come identità
→ timestamp ISO preservati
→ anomalie soppresse

/odds
→ validazione query invariata
→ superficie deprecata non estesa
→ fetch riuscito non equivale a commit riuscito

log
→ lettura bounded e redatta

login-window
→ no_target, started, already_active e conflict coerenti
→ nessun secondo spawn per already_active
```

Nota logout Graph:

```txt
osservazione live manuale
→ logout Graph
→ health red con popup e audio
→ login ripristinato
→ ritorno a Connected
```

Non è archiviato un payload `/latest` post-fix e non esiste un test automatico PASS dedicato al tick `status-only`.

## Documenti collegati

- [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
- [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
- [Validità tecnica campioni Betfair](../modules/betfair/02-technical-sample-validity.md)
- [API Match](./01-match.md)
- [API Evidence](./03-evidence.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Diagnostica Betfair](../operations/03-betfair-diagnostics.md)
- [Validazione e rollback](../operations/04-validation-and-rollback.md)
- [Scraper Betfair](../modules/python/03-betfair-scraper.md)
- [Polling e view model](../modules/frontend/02-live-polling-and-view-model.md)
- [UI Betfair e Market Reactions](../modules/frontend/03-betfair-and-market-reactions-ui.md)
- [Selezione del contesto per API AI](../ai/01-context-selection.md)
