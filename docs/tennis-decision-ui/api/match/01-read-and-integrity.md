# API Match — letture e integrity

## Scopo

Questo documento è l'owner specializzato delle superfici di lettura del router Match e del relativo contratto `integrity`.

Possiede:

```txt
GET /api/match/debug-last
GET /api/match/:eventId/history
GET /api/match/:eventId/json
```

Non possiede tracking, Source Identity, analisi o snapshot, che restano negli owner sibling del router Match.

Implementazione direttamente coinvolta:

```txt
backend/src/routes/match.js
backend/src/routes/match/readResponses.js
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
backend/src/sofa/matchHistory/commitJournal/integrity.js
```

Le letture `history` e `json` espongono dati già persistiti e aggiungono osservabilità read-only sullo stato di persistenza noto. Non avviano tracker o scraper, non scrivono journal e non eseguono recovery.

## Endpoint

| Metodo | Endpoint                      | Risultato corrente                                                                         |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------ |
| `GET`  | `/api/match/debug-last`       | `200`; nel runtime corrente restituisce `{"error":"No data captured yet"}`                 |
| `GET`  | `/api/match/:eventId/history` | `200` se la history è leggibile; altrimenti `404` o `409` in base a `integrity`            |
| `GET`  | `/api/match/:eventId/json`    | `200` se la timeline SofaScore è leggibile; altrimenti `404` o `409` in base a `integrity` |

## Contratto read-only

Per `history` e `json`, `match.js` delega la costruzione della risposta a `readResponses.js` e passa:

```txt
getMatchPersistenceIntegrity(eventId, "sofa")
```

Il flusso è:

```txt
eventId
→ loader del documento persistito
→ lettura dello stato integrity per source sofa
→ response builder
→ clone del documento leggibile
→ aggiunta o sostituzione del campo top-level integrity
```

Il response builder non richiama funzioni di scrittura e non tenta di riparare una persistenza incompleta.

L'assenza o la non leggibilità di un documento non provoca polling, acquisizione, creazione di dati sintetici o recovery.

## `debug-last`

Il router mantiene `debug-last` come superficie ancora presente.

Nel codice corrente `lastDebugData` è inizializzato a `null` e non ha un producer che lo valorizzi. La route usa `buildDebugLastResponse(lastDebugData)` e risponde con `HTTP 200`.

Risposta corrente:

```json
{
  "error": "No data captured yet"
}
```

`buildDebugLastResponse` restituirebbe un valore non nullo senza trasformarlo, ma il router corrente non assegna un nuovo valore a `lastDebugData`.

La route non deve quindi essere interpretata come una sorgente diagnostica popolata nel runtime corrente.

## History

```txt
GET /api/match/:eventId/history
```

Il response builder usa:

```txt
loadHistory(eventId)
getMatchPersistenceIntegrity(eventId, "sofa")
```

Se la history è leggibile, la risposta è `HTTP 200` e conserva il documento caricato, aggiungendo `integrity` a un clone.

La shape minima prodotta dal writer SofaScore per un nuovo documento è:

```json
{
  "metadata": {
    "eventId": "<eventId>",
    "date": "<date>",
    "tournament": "<tournament>",
    "players": {
      "home": "Player A",
      "away": "Player B"
    },
    "sofaUrl": "",
    "betfairUrl": ""
  },
  "history": []
}
```

Le entry di `history` vengono aggiunte separatamente dal writer. La route di lettura non ricostruisce né normalizza le entry: restituisce il documento caricato e aggiunge soltanto `integrity`.

Esempio di risposta leggibile:

```json
{
  "metadata": {
    "eventId": "<eventId>",
    "date": "<date>",
    "tournament": "<tournament>",
    "players": {
      "home": "Player A",
      "away": "Player B"
    },
    "sofaUrl": "",
    "betfairUrl": ""
  },
  "history": [],
  "integrity": {
    "status": "no_known_partial",
    "reason": null,
    "source": "sofa",
    "commitId": null,
    "affectedDocuments": []
  }
}
```

### Loader history

Il loader history:

- accetta come `eventId` una stringa non vuota;
- cerca un unico file `.json` con suffisso `_<eventId>.json`;
- esclude file temporanei e file con prefisso `sofa_` o `betfair_`;
- considera fallita la discovery se trova più di un target compatibile;
- richiede un oggetto JSON top-level;
- richiede `metadata` come oggetto;
- richiede `history` come array.

Missing, discovery fallita, target ambiguo, errore di lettura, JSON invalido e shape invalida non vengono distinti dalla route: `loadHistory(...)` restituisce `null` in tutti questi casi.

## Timeline SofaScore

```txt
GET /api/match/:eventId/json
```

Il response builder usa:

```txt
loadTimeline("sofa", eventId)
getMatchPersistenceIntegrity(eventId, "sofa")
```

Il loader richiede un documento persistito con almeno:

```json
{
  "metadata": {},
  "timeline": []
}
```

Quando il documento è leggibile, `loadTimelineResult` restituisce una vista che conserva il contenuto persistito e aggiunge:

```json
{
  "latest": null
}
```

`latest` è l'ultima entry di `timeline`, oppure `null` quando l'array è vuoto.

Il reader non normalizza una `timeline` malformata a un array vuoto: se `timeline` non è un array, la lettura fallisce.

Il response builder clona poi questa vista e aggiunge `integrity`.

Esempio:

```json
{
  "metadata": {
    "eventId": "<eventId>",
    "source": "sofa",
    "players": {}
  },
  "timeline": [],
  "latest": null,
  "integrity": {
    "status": "partial_persistence",
    "reason": "pending_commit",
    "source": "sofa",
    "commitId": "sofa-<uuid>",
    "affectedDocuments": ["timeline"]
  }
}
```

`latest` è un arricchimento della lettura. La route non lo persiste e non modifica il documento canonico durante la GET.

### Loader timeline

Per la timeline SofaScore il loader:

- valida `eventId` come stringa non vuota, lunga al massimo 128 caratteri e composta soltanto da lettere, numeri, `_` e `-`;
- cerca un unico file con prefisso `sofa_` e suffisso `_<eventId>.json`;
- esclude file temporanei;
- considera fallita la discovery se trova più di un target compatibile;
- richiede un oggetto JSON top-level;
- richiede `metadata` come oggetto;
- richiede `timeline` come array;
- aggiunge `latest` soltanto alla vista restituita dal loader.

Anche qui missing, eventId non valido, discovery fallita, target ambiguo, errore di lettura, JSON invalido e shape invalida diventano `null` per il response builder.

## Contratto `integrity`

Quando `history` o timeline SofaScore sono leggibili, la risposta riceve un campo top-level:

```json
{
  "integrity": {
    "status": "no_known_partial | partial_persistence | recovery_failed",
    "reason": null,
    "source": "sofa",
    "commitId": null,
    "affectedDocuments": []
  }
}
```

Campi pubblici:

| Campo               | Contratto                                                          |
| ------------------- | ------------------------------------------------------------------ |
| `status`            | `no_known_partial`, `partial_persistence` oppure `recovery_failed` |
| `reason`            | stringa oppure `null`; non è una enum pubblica chiusa              |
| `source`            | nel contratto Match viene esposto solo `sofa` oppure `null`        |
| `commitId`          | stringa oppure `null`                                              |
| `affectedDocuments` | array filtrato ai soli valori `history` e `timeline`               |

Quando la lettura del journal è disponibile, i record validi producono:

```txt
record attivo pending
→ status: partial_persistence
→ reason: pending_commit

record attivo recovery_failed
→ status: recovery_failed
→ reason: reason persistita, con fallback recovery_failed

nessun record attivo noto
→ status: no_known_partial
→ reason: null
```

Se la lettura del journal non è disponibile (`journal.reason !== null`), lo store può restituire internamente:

```txt
status: integrity_unavailable
reason: <reason del journal>
```

`integrity_unavailable` non appartiene al contratto pubblico della API Match. `getMatchPersistenceIntegrity` lo normalizza quindi a `no_known_partial`, mantenendo `reason` soltanto se è una stringa.

`getMatchPersistenceIntegrity` e `readResponses.js` applicano inoltre una normalizzazione difensiva:

- status non appartenenti al contratto pubblico diventano `no_known_partial`;
- `reason` viene mantenuta soltanto se è una stringa;
- `commitId` viene mantenuto soltanto se è una stringa;
- source diverse da `sofa` non vengono propagate dalla API Match;
- valori non ammessi in `affectedDocuments` vengono scartati;
- `affectedDocuments` non array diventa `[]`.

`no_known_partial` significa che la API non espone una persistenza parziale attiva nota per questa lettura. Non implica che il documento richiesto sia leggibile: la leggibilità viene determinata separatamente dal loader.

Il documento caricato viene clonato prima di aggiungere `integrity`. Se contiene già una proprietà `integrity`, la risposta usa il valore calcolato dal response builder senza mutare l'oggetto originale.

## Matrice HTTP `404/409`

La presenza del documento e lo stato `integrity` sono valutati separatamente.

| Documento richiesto | `integrity.status`    | HTTP  | Body                                           |
| ------------------- | --------------------- | ----: | ---------------------------------------------- |
| leggibile           | `no_known_partial`    | `200` | documento + `integrity`                        |
| leggibile           | `partial_persistence` | `200` | documento + `integrity`                        |
| leggibile           | `recovery_failed`     | `200` | documento + `integrity`                        |
| non leggibile       | `no_known_partial`    | `404` | messaggio storico della route                  |
| non leggibile       | `partial_persistence` | `409` | `error: "persistence_integrity"` + `integrity` |
| non leggibile       | `recovery_failed`     | `409` | `error: "persistence_integrity"` + `integrity` |

Il `404` history è:

```json
{
  "error": "History not found for this event"
}
```

Il `404` timeline SofaScore è:

```json
{
  "error": "SofaScore JSON timeline not found for this event"
}
```

Il `409` usa:

```json
{
  "error": "persistence_integrity",
  "integrity": {
    "status": "partial_persistence",
    "reason": "pending_commit",
    "source": "sofa",
    "commitId": "sofa-<uuid>",
    "affectedDocuments": ["history"]
  }
}
```

La route non espone nel `409` payload journalizzati, target di scrittura o path filesystem.

## Limiti pubblici dei loader

La API usa `loadHistory(...)` e `loadTimeline(...)`, non i rispettivi risultati strutturati `loadHistoryResult(...)` e `loadTimelineResult(...)`.

Di conseguenza le cause interne di mancata lettura vengono collassate prima del mapping HTTP.

Per il client non sono distinguibili, tramite queste route, casi come:

```txt
file assente
eventId non accettato dal loader timeline
discovery fallita
più target compatibili
read failure
invalid JSON
invalid shape
```

La distinzione pubblica disponibile è soltanto:

```txt
documento leggibile
oppure
documento non leggibile + stato integrity
```

Una maggiore granularità delle cause richiederebbe un diverso contratto applicativo; non è parte del comportamento corrente.

## Confini

Questo owner descrive soltanto letture e integrity del router Match.

Le route qui documentate:

- non avviano tracking;
- non avviano scraper;
- non eseguono recovery;
- non scrivono o completano journal;
- non persistono `latest`;
- non ricostruiscono Source Identity;
- non trasformano `integrity` in un comando di repair;
- non espongono payload journalizzati o target filesystem.

Tracking e Source Identity appartengono a `02-tracking-and-source-identity.md`.

Analisi e snapshot appartengono a `03-analysis-and-snapshot.md`.

La persistenza canonica di timeline/history e il lifecycle completo del commit journal appartengono agli owner storage collegati.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check routes/match.js
node --check routes/match/readResponses.js
node --check sofa/matchHistory.js
node --check sofa/matchHistory/storage.js
node --check sofa/timelineStore.js
node --check sofa/matchHistory/commitJournal/integrity.js

node routes/match/readResponses.test.mjs
node sofa/matchHistory/commitJournal/integrityStatus.test.mjs
```

Il test `readResponses.test.mjs` copre il mapping HTTP delle letture, l'aggiunta additiva di `integrity`, il clone del documento, la sostituzione di una proprietà `integrity` preesistente, la normalizzazione dei campi pubblici e l'uso della source SofaScore.

`integrityStatus.test.mjs` copre il mapping journal verso `no_known_partial`, `partial_persistence`/`pending_commit` e `recovery_failed`, oltre al comportamento read-only delle letture journal quando la directory non esiste.

## Documenti collegati

- [API Match](../01-match.md)
- [Tracking e Source Identity](./02-tracking-and-source-identity.md)
- [Analisi e snapshot](./03-analysis-and-snapshot.md)
- [Timeline e history](../../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../../modules/storage/02-commit-journal-and-recovery.md)
