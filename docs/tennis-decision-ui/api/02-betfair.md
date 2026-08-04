# API Betfair

## Scopo

Questo documento definisce il contratto HTTP del router:

```txt
backend/src/routes/betfair.js
```

Il router espone:

* lettura della timeline Betfair;
* payload `latest`, health e Money Flow;
* stato additivo `integrity` sulle letture Betfair;
* fetch esplicito delle quote;
* lettura del log Betfair;
* apertura di una finestra di login separata.

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
| `matchHistory.js`           | Espone letture canoniche Betfair e adapter `getBetfairPersistenceIntegrity` |

## Endpoint

| Metodo | Endpoint                       | Effetto                                                             |
| ------ | ------------------------------ | ------------------------------------------------------------------- |
| `GET`  | `/api/betfair/:eventId/latest` | Restituisce ultimo tick valido, health, Money Flow e `integrity`    |
| `GET`  | `/api/betfair/:eventId/json`   | Restituisce la timeline Betfair persistita con `integrity` additiva |
| `GET`  | `/api/betfair/odds?url=<url>`  | Esegue un fetch Betfair esplicito                                   |
| `GET`  | `/api/betfair/log`             | Restituisce le righe più recenti del log Betfair                    |
| `POST` | `/api/betfair/login-window`    | Richiede l’apertura di una finestra di login Betfair                |

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

Per queste route il router può usare l’adapter read-only:

```txt
getBetfairPersistenceIntegrity(eventId, source = 'betfair')
```

Nel contratto Betfair questo adapter viene usato solo con:

```txt
source: 'betfair'
```

L’adapter:

* legge lo stato journal tramite `journalStore.getPersistenceIntegrityStatus(eventId, source)`;
* normalizza il risultato al contratto pubblico;
* non crea directory;
* non scrive journal;
* non esegue recovery;
* non accede a payload journalizzati;
* non espone target, path locali o dettagli filesystem.

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

Esempio di risposta `latest` riuscita:

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

Esempio di risposta `json` riuscita con persistenza incompleta nota:

```json
{
  "eventId": "16305613",
  "timeline": [],
  "integrity": {
    "status": "partial_persistence",
    "reason": "commit_incomplete",
    "source": "betfair",
    "commitId": "betfair-16305613-000001",
    "affectedDocuments": ["timeline"]
  }
}
```

Il documento letto viene clonato prima dell’aggiunta di `integrity`.

Se il documento persistito contiene già una proprietà `integrity`, la risposta HTTP usa l’integrity calcolata dall’adapter, senza mutare l’oggetto originale.

`integrity.status` usa solo questi valori pubblici:

```txt
no_known_partial
partial_persistence
recovery_failed
```

Input malformati, source incoerenti o risultati non canonici vengono normalizzati a un contratto pubblico sicuro. La API Betfair non propaga valori source diversi da:

```txt
betfair
null
```

`affectedDocuments` può contenere solo:

```txt
history
timeline
```

## Risorsa assente e `409 persistence_integrity`

Quando la timeline richiesta non esiste e non ci sono partial noti, il comportamento storico resta invariato.

```txt
integrity.status = no_known_partial
→ HTTP 404 invariato
→ messaggio esistente preservato
```

Quando la timeline richiesta non esiste ma il journal segnala persistenza incompleta nota, la risposta diventa `HTTP 409`.

```txt
integrity.status = partial_persistence
oppure
integrity.status = recovery_failed
→ HTTP 409
→ error: persistence_integrity
→ integrity nel body
```

Payload previsto:

```json
{
  "error": "persistence_integrity",
  "integrity": {
    "status": "partial_persistence",
    "reason": "commit_incomplete",
    "source": "betfair",
    "commitId": "betfair-16305613-000001",
    "affectedDocuments": ["history", "timeline"]
  }
}
```

La risposta `409 persistence_integrity` non espone path locali, payload journal, target, metadata journal, stack trace o dettagli filesystem.

Il router non tenta recovery prima di restituire `409`.

Per `GET /api/betfair/:eventId/latest`, il payload di errore può conservare informazioni `health` già calcolate quando sono disponibili e sicure, ma `health` resta distinta da `integrity`.

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

L’endpoint legge il tick Betfair canonico più recente dalle timeline già persistite.

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

`latestTimestamp` deriva esclusivamente dal tick Betfair canonico persistito più recente, incluso un eventuale tick canonico di sola transizione di stato (`status-only`).

Non deriva:

```txt
dall’ora della richiesta HTTP
dall’ultimo scrape riuscito
dal runtime effimero del tracker
```

### Runtime effimero e health

`health` combina:

```txt
timeline persistita
→ stato CDP
→ runtime Betfair effimero del tracker
```

Il runtime può essere letto internamente per calcolare la health anche quando non esiste ancora una timeline Betfair.

Non viene esposto come proprietà top-level `runtime` e non viene inserito in:

```txt
latest
timeline
history
integrity
```

Quando manca la timeline Betfair e non c’è persistenza incompleta nota, l’endpoint restituisce `404` mantenendo comunque un payload `health`.

```txt
nessuna timeline
+ integrity no_known_partial
+ nessun errore runtime attivo
→ 404
→ health unknown

nessuna timeline
+ integrity no_known_partial
+ errore tecnico runtime attivo
→ 404
→ health yellow / DEGRADED
```

Quando manca la timeline Betfair ma esiste persistenza incompleta nota, lo status HTTP è `409 persistence_integrity`, non `404`.

```txt
nessuna timeline
+ integrity partial_persistence
→ 409 persistence_integrity

nessuna timeline
+ integrity recovery_failed
→ 409 persistence_integrity
```

`health` può includere:

```txt
health.timestamps
→ attempt, successful scrape, tick canonico, ladder usabile,
  volume valido, errore tecnico, login Graph, computedAt

health.metrics
→ età tick canonico, età ladder usabile,
  motivo errore tecnico e technicalErrorActive

health.checks
→ freshness, CDP, login, Graph URL, ladder, mercato e Sofa live
```

Il runtime serve soltanto alla diagnostica. Non modifica tracker, timeline, history, journal o persistenza.

`integrity` non deve essere derivata dalla health e la health non deve essere degradata automaticamente per la sola presenza di `partial_persistence` o `recovery_failed`.

### Logout Graph: latest e health

Il contratto top-level di `GET /api/betfair/:eventId/latest` non cambia nel caso di logout Betfair rilevato dalla pagina Graph.

Quando il backend persiste un tick Betfair canonico `status-only` per un logout Graph esplicito, `latest` può riferirsi a quel nuovo tick di transizione. Il tick conserva mercato e runner dell’ultimo tick canonico precedente e non adotta quote, volumi, ladder o Money Flow regressivi del sample rilevato.

In questo caso la risposta può esporre:

```txt
latest.diagnostics.graphLoginRequired = true
latest.diagnostics.statusOnlyGraphLogin = true
latest.graphHealth.status = auth_suspected

health.status = red
health.alert = true
```

Il read model continua a usare lo schema esistente. Popup e audio frontend già presenti reagiscono allo stato `health` persistito e non richiedono un nuovo contratto frontend.

L’eccezione è limitata al logout Graph esplicito con tick canonico precedente, login richiesto rilevato, assenza di righe ladder Graph e sample regressivo. I sample regressivi ordinari restano esclusi dalla persistenza. Un errore rete/API non viene classificato come logout Betfair.

`integrity` resta indipendente dal logout Graph: un tick `status-only` riuscito può avere `integrity.status = no_known_partial`; un commit incompleto può avere `partial_persistence` anche se la health non è red.

### Money Flow History

`moneyFlowHistory` usa al massimo gli ultimi venti tick validi.

Schema:

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

`selectionId` è normalizzato a stringa ed è l’unica identità della serie.

```txt
selectionId identico
→ stessa serie

stesso selectionId con nome aggiornato
→ continuità della stessa serie

stesso nome con selectionId diverso
→ serie separate

runner senza selectionId
→ nessuna serie
```

I point mantengono il timestamp ISO originale.

Ogni point pubblico usa questo contratto:

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

`matchedVolume` segue questa priorità:

```txt
raw runner delta valido
→ matchedVolume = raw runner delta

raw runner delta assente
+ computed runner delta valido
→ matchedVolume = computed runner delta

entrambi assenti
→ matchedVolume = 0
→ volumeDetected = false
```

Un delta runner pari a zero resta valido, ma non produce una barra nel grafico.

Un point è invalido quando rileva almeno una di queste condizioni:

```txt
delta runner negativo
riduzione del total matched
runner delta oltre market delta oltre tolleranza
divergenza raw/computed non accettabile
zero-vs-positivo tra raw e computed
```

In quel caso:

```txt
matchedVolume = 0
validForDisplay = false
invalidVolume = true
anomaly = true
```

La divergenza raw/computed usa una tolleranza del 10% soltanto quando entrambi i valori sono positivi.

Sono sempre invalidi:

```txt
rawRunnerDelta = 0
computedRunnerDelta > 0

rawRunnerDelta > 0
computedRunnerDelta = 0

rawMarketDelta = 0
computedMarketDelta > 0

rawMarketDelta > 0
computedMarketDelta = 0
```

Ladder traded, `classifiedVolume`, Back e Lay non invalidano da soli il volume dashboard.

Una ladder assente o non Graph URL può accompagnare un `matchedVolume` valido quando runner delta e market delta sono coerenti.

Il read model dashboard non espone:

```txt
back
lay
trend
confidence
classifiedVolume
unclassified
suppressedVolume
```

`integrity` non modifica il calcolo Money Flow. Se `partial_persistence` o `recovery_failed` sono presenti, il consumer può degradare l’uso del dato, ma il read model non ricalcola o corregge i point.

## Timeline Betfair

```txt
GET /api/betfair/:eventId/json
```

L’endpoint restituisce la timeline Betfair già persistita.

| Condizione                                      | Status | Risposta                                         |
| ----------------------------------------------- | ------ | ------------------------------------------------ |
| Timeline disponibile                            | `200`  | Documento timeline completo con `integrity`      |
| Timeline assente e nessun partial noto          | `404`  | `Betfair JSON timeline not found for this event` |
| Timeline assente e persistenza incompleta nota  | `409`  | `persistence_integrity` con `integrity`          |

Non avvia scraper, browser, fetch esterno, recovery o repair.

## Fetch quote

```txt
GET /api/betfair/odds
```

La query richiede:

```txt
url
```

Query supportate:

```txt
url
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

La risposta può essere JSON oppure un body serializzato. Quando il modulo risposta fornisce un `content-type`, il router lo inoltra invariato.

`/odds` è un fetch esplicito richiesto dal chiamante. Non è una lettura canonica `latest/json` e non espone `integrity` come contratto obbligatorio.

Un fetch riuscito non implica che un commit canonico sia stato prodotto, completato o recuperato. La conferma dello stato runtime dei runner appartiene al processor Betfair e agli esiti di commit strutturati, non al router HTTP.

### Network capture

`networkCapture` è una diagnostica opt-in.

È abilitata soltanto con:

```txt
networkCapture=true
```

Query assente, `networkCapture=false` o qualsiasi valore diverso da `true` mantengono la capture disabilitata.

Il flusso normale non deve quindi creare nuovi dump diagnostici.

Quando la capture viene abilitata esplicitamente, la redazione dei contenuti avviene nel percorso diagnostico Python prima della scrittura dei dump.

Il contratto HTTP resta invariato: cambia solo il contenuto diagnostico persistito o propagato, che non deve contenere valori sensibili raw.

`networkCapture` non deve includere journal, payload journalizzati, target locali, commit metadata, cookie, token, header sensibili o dump raw non redatti.

## Log Betfair

```txt
GET /api/betfair/log
```

La route legge il path fisso `backend/betfair_scraper.log`; la richiesta non può scegliere il file o aumentare i limiti.

La risposta usa sempre HTTP `200`:

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
redazione applicata anche in lettura
Cache-Control: no-store
```

```txt
file disponibile
→ status: ok
→ righe non vuote nell'ordine originale

file assente
→ status: not_found
→ lines: []

errore di lettura
→ status: read_failed
→ lines: []
```

Non vengono esposti `error.message`, path locali, cookie, token, chiavi applicative, header sensibili, payload raw, dump diagnostici o payload journalizzati.

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

`mode` usa `persistent` come default. `profileDir` viene normalizzata soltanto in modalità `persistent`; `cdpUrl` è richiesta e validata soltanto in modalità `cdp`.

| Caso                         | HTTP  | Body pubblico                                                                                              |
| ---------------------------- | ----: | ---------------------------------------------------------------------------------------------------------- |
| Target vuoto                 | `200` | `{ ok: true, status: "no_target", opened: false, reused: false }`                                          |
| URL Betfair non valida       | `400` | `{ ok: false, code: "betfair_url_invalid", error: "Invalid Betfair URL" }`                                 |
| CDP assente in `mode=cdp`    | `400` | `{ ok: false, code: "cdp_url_required", error: "CDP URL required" }`                                       |
| CDP non valida               | `400` | `{ ok: false, code: "cdp_url_invalid", error: "Invalid CDP URL" }`                                         |
| Scraper assente              | `500` | `{ ok: false, code: "scraper_not_found", error: "Betfair scraper not available" }`                         |
| Primo avvio compatibile      | `200` | `{ ok: true, status: "started", opened: true, reused: false }`                                             |
| Login compatibile già attivo | `200` | `{ ok: true, status: "already_active", opened: true, reused: true }`                                       |
| Runtime incompatibile        | `409` | `{ ok: false, code: "login_runtime_conflict", error: "An incompatible login session is already active." }` |
| Spawn fallito                | `500` | `{ ok: false, code: "login_spawn_failed", error: "Unable to open Betfair login window." }`                 |

`started` viene restituito soltanto dopo `spawnReady` e registrazione fisica del processo. `already_active` riusa lo stesso processo logico e non esegue un secondo spawn. `login_runtime_conflict` non esegue kill, restart o nuovo spawn.

Il login usa il ruolo `betfair_login`, distinto dai ruoli tracking. `POST /api/match/stop` usa `scope=tracking` e non termina il login; lo shutdown backend usa `scope=all` e lo termina.

Un `200` non conferma che l’utente abbia completato l’autenticazione. La route non espone PID, `executionId`, runtime identity, URL complete o dettagli del processo.

## Confini

* `latest` e `json` non avviano scraper o browser.
* `latest` e `json` non eseguono recovery e non scrivono journal.
* `latest` può leggere runtime Betfair in memoria soltanto per calcolare `health`.
* La lettura runtime non avvia fetch, non modifica tracker, non persiste dati e non modifica timeline o history.
* `integrity` è letta dal journal store in modo read-only e non deriva da runtime, health, freshness o Money Flow.
* `odds` è l’unico endpoint del router che richiede un fetch esterno.
* Il router non conferma lo stato runtime dei runner: lo confermano solo esiti di commit Betfair `complete` o `recovered` nel processor.
* Il router non duplica parsing, normalizzazione, validazione Money Flow o calcolo health.
* Il router non espone cookie, token, profili browser, dump, payload raw, payload journalizzati, target locali o runtime interno completo.
* Il read model Money Flow non attribuisce direzione Back o Lay al volume abbinato.

## Verifica

Dalla cartella `backend/src`:

```txt
node routes/betfair/latestPayloadResponse.test.mjs && node routes/betfair/latestPayloadIntegrity.test.mjs && node routes/betfair/betfairJsonResponse.test.mjs && node routes/betfair/normalizeIntegrity.test.mjs
node routes/betfair/moneyFlowHistorySeries.test.mjs
node sofa/betfairMoneyFlowValidation.test.mjs
node routes/betfair/oddsResponse.test.mjs
node sofa/matchHistory/commitJournal.test.mjs
node sofa/matchHistory/recovery.test.mjs

node --check routes/betfair/loginWindow.js
```

Verificare almeno:

```txt
latestPayloadResponse.test.mjs, latestPayloadIntegrity.test.mjs, betfairJsonResponse.test.mjs, normalizeIntegrity.test.mjs
→ payload 200
→ payload 404 con health
→ payload 409 persistence_integrity
→ runtime passato alla health
→ assenza di body.runtime
→ schema moneyFlowHistory.series
→ integrity aggiunta senza mutare il documento persistito
→ source pubblica solo betfair o null

json timeline presente
→ HTTP 200
→ documento timeline preservato
→ integrity aggiunta

json timeline assente + no_known_partial
→ HTTP 404 invariato

json timeline assente + partial_persistence
→ HTTP 409
→ error persistence_integrity
→ integrity nel body

json timeline assente + recovery_failed
→ HTTP 409
→ error persistence_integrity
→ integrity nel body

integrity null, undefined o malformata
→ normalizzazione a no_known_partial sicuro

health degradata
→ non modifica integrity

partial_persistence o recovery_failed
→ non modifica automaticamente health, freshness, Graph health o Money Flow

moneyFlowHistorySeries.test.mjs
→ selectionId come identità della serie
→ nome aggiornato con stesso ID
→ ID diversi con stesso nome
→ runner senza selectionId senza serie
→ timestamp ISO preservati

betfairMoneyFlowValidation.test.mjs
→ raw runner delta valido
→ fallback computed valido
→ zero valido
→ delta negativo invalido
→ zero-vs-positivo invalido
→ divergenza raw/computed oltre tolleranza
→ ladder assente o non Graph URL con delta coerenti
- fixture condivise in sofa/betfairMoneyFlowValidation.testFixtures.mjs

oddsResponse.test.mjs
→ validazione query e delega fetch invariati
→ fetch riuscito non equivale a commit canonico riuscito

verifica manuale log
→ file assente: lines vuoto
→ file disponibile: massimo 200 linee non vuote
→ nessun payload journalizzato o segreto raw

verifica login-window
→ target vuoto: 200 con no_target, opened false e reused false
→ started: restituito soltanto dopo spawnReady
→ already_active: stesso processo logico e nessun secondo spawn
→ login_runtime_conflict: 409 senza kill, restart o nuovo spawn
→ HTTP 200 non equivale a login utente completato
```

Nota di evidenza logout Graph:

```txt
osservazione live manuale
→ logout Graph
→ health red con popup e audio osservati
→ login ripristinato
→ ritorno a Connected osservato
```

Non è archiviato un payload `/latest` post-fix e non esiste un test automatico PASS dedicato al tick `status-only`.

## Documenti collegati

* [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
* [Timeline e history](../modules/storage/01-timelines-and-history.md)
* [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
* [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
* [Validità tecnica campioni Betfair](../modules/betfair/02-technical-sample-validity.md)
* [API Match](./01-match.md)
* [API Evidence](./03-evidence.md)
* [Runtime locale](../operations/01-local-runtime.md)
* [Diagnostica Betfair](../operations/03-betfair-diagnostics.md)
* [Validazione e rollback](../operations/04-validation-and-rollback.md)
* [Scraper Betfair](../modules/python/03-betfair-scraper.md)
* [Polling e view model](../modules/frontend/02-live-polling-and-view-model.md)
* [UI Betfair e Market Reactions](../modules/frontend/03-betfair-and-market-reactions-ui.md)
* [Selezione del contesto per API AI](../ai/01-context-selection.md)
