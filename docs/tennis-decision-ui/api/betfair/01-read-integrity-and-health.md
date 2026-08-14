# API Betfair — letture, integrity e health

## Scopo

Questo documento è l'owner del contratto read-only delle letture Betfair:

```txt
GET /api/betfair/:eventId/latest
GET /api/betfair/:eventId/json
```

Possiede la semantica HTTP direttamente collegata a:

- lettura della timeline Betfair;
- `latest` e `latestTimestamp`;
- persistence `integrity`;
- `health`;
- runtime Betfair effimero usato dalla health;
- stato Graph/auth usato dalla health;
- probe CDP di `/latest`;
- mapping `200` / `404` / `409`;
- limiti del loader usato dalle route.

Non possiede il contratto dettagliato di Money Flow History, `/odds`, `/log` o `login-window`.

Le due route non avviano tracking, scraper, browser, recovery o nuove scritture canoniche. `/latest` può però eseguire un probe HTTP bounded verso CDP quando `mode=cdp` e `cdpUrl` è valorizzato.

## Endpoint

| Metodo | Endpoint                       | Letture principali                                                                               | Attività remota     |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------- |
| `GET`  | `/api/betfair/:eventId/latest` | timeline Betfair, timeline Sofa, journal integrity, runtime Betfair effimero, Money Flow History | probe CDP opzionale |
| `GET`  | `/api/betfair/:eventId/json`   | timeline Betfair, journal integrity                                                              | nessuna             |

## `/latest`

```txt
GET /api/betfair/:eventId/latest
```

Query opzionali:

```txt
mode
cdpUrl
```

Il router passa:

```txt
mode = req.query.mode || ""
cdpUrl = req.query.cdpUrl || ""
```

Il builder:

1. calcola `cdpStatus`;
2. legge la timeline Betfair;
3. legge la timeline Sofa;
4. legge il runtime Betfair effimero;
5. legge la persistence integrity Betfair;
6. se la timeline Betfair manca, costruisce comunque `health` e restituisce `404` o `409`;
7. se la timeline Betfair esiste, seleziona l'ultimo tick Betfair valido, costruisce `health` e delega la costruzione di `moneyFlowHistory`.

### Risposta `200`

Quando la timeline Betfair è disponibile, `/latest` restituisce `HTTP 200` anche se non esiste alcun tick Betfair valido.

Shape top-level:

```json
{
  "ok": true,
  "eventId": "<eventId>",
  "latest": {},
  "latestTimestamp": "<timestamp dell'entry latest>",
  "health": {},
  "moneyFlowHistory": {},
  "integrity": {},
  "metadata": {}
}
```

`ok` è `true` soltanto quando `getLatestValidBetfairTick()` restituisce un tick.

Se la timeline è disponibile ma non contiene tick validi:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "latest": null,
  "latestTimestamp": null
}
```

Gli altri campi della risposta `200` restano presenti.

### Semantica di `latest`

`getValidBetfairTicks()` considera valida un'entry quando:

- l'entry contiene `data`;
- `data.source === "betfair"`;
- `data.seq` è un numero finito;
- `data.runners` è un array;
- ogni elemento di `data.runners` è un oggetto e non un array.

`getLatestValidBetfairTick()` restituisce l'ultima entry valida nell'ordine della timeline.

Di conseguenza:

```txt
ultima entry della timeline
≠ necessariamente latest di /latest
```

Il payload espone:

```txt
latest = latestValidTick?.data || null
latestTimestamp = latestValidTick?.timestamp || null
```

La validità del tick non richiede la presenza di `entry.timestamp`: può quindi esistere un `latest` non-null con `latestTimestamp: null`.

`latestTimestamp` non deriva da `data.ts` né da `metadata.updatedAt`.

### Metadata

`metadata` viene costruito dal builder a partire dai metadata della timeline Betfair:

```txt
eventId    → metadata.eventId || eventId richiesto
source     → metadata.source || "betfair"
players    → metadata.players || {}
tournament → metadata.tournament || ""
updatedAt  → betfairTimeline.updatedAt || metadata.updatedAt || now.toISOString()
```

`metadata.updatedAt` può quindi essere sintetizzato con l'ora corrente quando né il documento né i metadata persistiti contengono un valore.

### Money Flow History

`/latest` seleziona i tick Betfair validi, prende gli ultimi venti e li passa al builder di Money Flow History.

Il contratto numerico delle serie e dei point appartiene all'owner dedicato Money Flow History e non viene duplicato qui.

## CDP status

`checkCdpStatus()` restituisce un valore interno usato nella costruzione di `health`:

```txt
true
false
null
```

Non esiste un campo top-level `cdpStatus` nella risposta `/latest`.

Il valore viene passato a `buildBetfairSessionHealth()` e compare nella health come:

```txt
health.checks.cdpOk
```

### Quando viene eseguito il probe

`checkCdpStatus()` non esegue traffico di rete quando:

- `mode !== "cdp"`;
- `cdpUrl` è assente.

In entrambi i casi restituisce:

```txt
null
```

Quando `mode=cdp` e `cdpUrl` è presente ma non valido, restituisce:

```txt
false
```

senza eseguire fetch.

Per una base URL valida viene interrogato:

```txt
<cdpUrl>/json/version
```

con timeout bounded di `1500 ms` quando `AbortController` è disponibile.

Il risultato è:

```txt
response.ok === true → true
HTTP non riuscito    → false
timeout/fetch error   → false
```

### Validazione di `cdpUrl`

La base URL è accettata soltanto quando:

- usa `http:`;
- non contiene username o password;
- usa uno degli host locali `127.0.0.1`, `localhost`, `::1`;
- contiene una porta esplicita valida fra `1` e `65535`;
- ha path `/`;
- non contiene query;
- non contiene fragment.

Le slash finali vengono normalizzate prima della validazione.

## `/json`

```txt
GET /api/betfair/:eventId/json
```

Il builder legge:

```txt
loadTimeline("betfair", eventId)
getMatchPersistenceIntegrity(eventId, "betfair")
```

Quando la timeline è disponibile, `withIntegrity()` clona il documento ricevuto e aggiunge il campo top-level `integrity`.

Il documento passato al response builder non viene mutato.

### Vista timeline

`loadTimelineResult(source, eventId)` richiede che il documento letto sia:

- un oggetto non-array;
- dotato di `metadata` oggetto non-array;
- dotato di `timeline` array.

Su lettura valida costruisce una vista:

```js
{
  ...data,
  latest: data.timeline[data.timeline.length - 1] || null
}
```

Il loader non riscrive `metadata.eventId` o `metadata.source` durante la lettura.

Perciò il campo `latest` di `/json` e quello di `/latest` hanno semantiche diverse:

```txt
/json
→ ultima entry dell'array timeline

/latest
→ data dell'ultima entry che soddisfa getValidBetfairTicks()
```

Una entry finale non valida per la health può quindi essere `latest` nella vista `/json` senza diventare `latest` nel payload `/latest`.

Esempio di risposta `/json`:

```json
{
  "metadata": {
    "eventId": "<persisted-eventId>",
    "source": "betfair"
  },
  "timeline": [],
  "latest": null,
  "integrity": {
    "status": "no_known_partial",
    "reason": null,
    "source": "betfair",
    "commitId": null,
    "affectedDocuments": []
  }
}
```

## Loader e cause non distinguibili via HTTP

`loadTimelineResult()` possiede stati interni più dettagliati rispetto a quelli esposti dalle route.

| Caso                                                  | Stato interno | Reason                     |
| ----------------------------------------------------- | ------------- | -------------------------- |
| `eventId` non valido                                  | `failed`      | `invalid_event_id`         |
| discovery filesystem fallita                          | `failed`      | `discovery_failed`         |
| più target compatibili                                | `failed`      | `ambiguous_storage_target` |
| target assente                                        | `missing`     | `null`                     |
| errore di lettura                                     | `failed`      | `read_failed`              |
| JSON invalido                                         | `failed`      | `invalid_json`             |
| documento, `metadata` o `timeline` con shape invalida | `failed`      | `invalid_shape`            |
| documento valido                                      | `found`       | `null`                     |

`loadTimeline()` restituisce la vista soltanto per:

```txt
status = found
```

Tutti gli altri stati vengono collassati a:

```txt
null
```

Le route `/latest` e `/json`, che usano `loadTimeline()`, non distinguono quindi nel contratto HTTP fra target assente, discovery failure, ambiguità, read failure, JSON invalido e shape invalida.

## Mapping HTTP quando la timeline Betfair manca

L'integrity viene usata per distinguere l'assenza ordinaria da una persistenza incompleta nota.

| Timeline Betfair      | `integrity.status`       | HTTP  |
| --------------------- | ------------------------ | ----: |
| assente/non leggibile | `no_known_partial`       | `404` |
| assente/non leggibile | `partial_persistence`    | `409` |
| assente/non leggibile | `recovery_failed`        | `409` |
| disponibile           | qualsiasi stato pubblico | `200` |

La presenza di `partial_persistence` o `recovery_failed` non trasforma da sola una timeline disponibile in errore HTTP.

### Missing `/latest`

Senza conflict di integrity:

```json
{
  "ok": false,
  "error": "Betfair JSON timeline not found for this event",
  "health": {}
}
```

Con `partial_persistence` o `recovery_failed`:

```json
{
  "ok": false,
  "error": "persistence_integrity",
  "health": {},
  "integrity": {}
}
```

La health viene quindi mantenuta anche nelle risposte missing di `/latest`.

### Missing `/json`

Senza conflict di integrity:

```json
{
  "error": "Betfair JSON timeline not found for this event"
}
```

Con `partial_persistence` o `recovery_failed`:

```json
{
  "error": "persistence_integrity",
  "integrity": {}
}
```

Il response builder non aggiunge `eventId` o `ok` ai body missing di `/json`.

## Persistence integrity

`integrity` è osservabilità read-only dello stato del commit journal Betfair.

È distinta da:

- freshness della timeline;
- `health`;
- stato Graph/auth;
- runtime Betfair;
- CDP status;
- Money Flow.

Shape pubblica:

```json
{
  "status": "no_known_partial",
  "reason": null,
  "source": "betfair",
  "commitId": null,
  "affectedDocuments": []
}
```

Valori pubblici di `status`:

```txt
no_known_partial
partial_persistence
recovery_failed
```

Nella normalizzazione delle route Betfair, `source` può essere soltanto:

```txt
betfair
null
```

`affectedDocuments` può contenere soltanto:

```txt
history
timeline
```

Input integrity non validi vengono normalizzati a valori pubblici bounded; una source diversa da `betfair` diventa `null`.

### Reason canonica

Per un record pending attivo:

```txt
status = partial_persistence
reason = pending_commit
```

Per un record di recovery fallita:

```txt
status = recovery_failed
reason = selected.reason || "recovery_failed"
```

### Selezione dei record

La lettura usata da queste route chiama:

```txt
getMatchPersistenceIntegrity(eventId, "betfair")
```

Il journal considera quindi soltanto record attivi dello stesso `eventId` e con source `betfair`.

Un record è attivo quando:

- ha `status` `pending` oppure `recovery_failed`;
- possiede almeno un documento non completato fra `history` e `timeline`.

Fra i candidati:

1. `recovery_failed` ha precedenza su `pending`;
2. a parità di priorità viene prima il `createdAt` più antico;
3. a ulteriore parità viene usato `commitId` come criterio deterministico.

Quando non esistono record attivi pertinenti, lo stato è `no_known_partial` con `source: "betfair"`.

## Health

`health` viene costruita sia quando la timeline Betfair esiste sia quando manca nella risposta `/latest`.

Usa:

- timeline Betfair;
- timeline Sofa;
- `cdpStatus`;
- runtime Betfair effimero;
- timestamp corrente.

La shape principale è:

```txt
status
severity
label
message
alert
reasons
checks
metrics
timestamps
```

Non esistono sottoviste pubbliche `health.timeline`, `health.sofa`, `health.runtime` o `health.graph`.

### Runtime effimero

Il runtime viene normalizzato ai campi:

```txt
lastScrapeAttemptAt
lastSuccessfulScrapeAt
lastTechnicalErrorAt
lastTechnicalErrorReason
```

Questi valori alimentano soprattutto `health.timestamps` e la rilevazione di un errore tecnico attivo.

Un errore tecnico è attivo quando `lastTechnicalErrorAt` esiste ed è successivo all'ultimo `lastSuccessfulScrapeAt`, oppure quando non esiste alcuno scrape riuscito successivo.

Il runtime non viene esposto come proprietà top-level della risposta `/latest`.

### Checks

`health.checks` contiene:

```txt
betfairUrlOk
cdpOk
loginOk
graphUrlsOk
ladderOk
marketOk
strategyDataOk
sofaLive
```

`sofaLive` viene inferito dalla timeline Sofa.

### Metrics

`health.metrics` include, fra gli altri:

```txt
latestBetfairAgeSec
latestUsableLadderAgeSec
consecutiveNoLadderTicks
ladderRows
usableRunnerCount
networkErrorsRecent
recentTickCount
validTickCount
lastSeq
graphLoginRequired
graphLoginRequiredRecent
graphHealthStatus
graphHealthReason
graphUrlsProvided
graphUrlsSucceeded
graphUrlsFailed
hasUsableGraphLadder
baseQuotesAvailable
graphConsecutiveFailures
lastTechnicalErrorReason
technicalErrorActive
```

### Timestamps

`health.timestamps` espone:

```txt
lastScrapeAttemptAt
lastSuccessfulScrapeAt
lastCanonicalTickAt
lastUsableLadderAt
lastValidVolumeAt
lastTechnicalErrorAt
latestBetfairAt
latestValidBetfairAt
graphLoginRequiredAt
computedAt
```

### Freshness

La soglia canonica di stale è:

```txt
45 secondi
```

La classificazione considera separatamente:

- età dell'ultimo tick Betfair valido;
- età dell'ultima ladder usabile.

Uno scrape riuscito recente non rende fresca una timeline canonica vecchia.

### Classificazione health

Gli stati principali prodotti dalla health sono:

```txt
unknown
red
yellow
green
finished
```

Corrispondono rispettivamente alle label:

```txt
UNKNOWN
ALERT
STALE oppure DEGRADED
OK
FINISHED
```

Regole rilevanti per questo contratto read:

- Graph `auth_suspected` o un recente tick con `diagnostics.graphLoginRequired === true` porta a `red` / `ALERT`, salvo mercato finished;
- nel ramo con almeno un tick valido, errore tecnico attivo, stale, assenza di ladder usabile, `cdpStatus === false`, mercato non valido o Graph degradato portano a `yellow` quando non prevale il red;
- `green` richiede ladder usabile, mercato valido, CDP non esplicitamente fallito e, quando `graphHealth` è presente, `graphHealth.status === "ok"`; l'assenza di `graphHealth` non impedisce da sola il `green`;
- un ultimo tick valido che indica mercato finished produce `finished`;
- senza tick validi e senza errore tecnico attivo la health è `unknown`, anche se `cdpStatus === false`;
- senza tick validi ma con errore tecnico attivo la classificazione può essere `yellow` con label `DEGRADED`.

`integrity` non viene derivata dalla health e una health degradata non crea automaticamente uno stato di persistence integrity.

## Status-only Graph logout

La pipeline Betfair ammette un caso status-only collegato a Graph login quando sono vere tutte queste condizioni:

```txt
esiste un precedente tick canonico
processedResult.diagnostics.graphLoginRequired === true
graphRowsTotal === 0
processedResult.timelineIntegrity.accepted === false
```

Questo caso viene riconosciuto come `graphLoginStatusOnly` e può essere committato nonostante `timelineIntegrity.accepted === false`.

Il nuovo tick:

- conserva il market del precedente tick;
- clona i runner canonici precedenti;
- conserva l'`event_status` precedente;
- azzera/sopprime il Money Flow dei runner clonati con reason `graph_login_required`;
- espone una summary senza ladder usabile;
- imposta `diagnostics.graphLoginRequired`;
- imposta `diagnostics.statusOnlyGraphLogin = true`;
- costruisce `graphHealth.status = "auth_suspected"` per il login Graph sospetto quando l'`event_status` conservato non è finished; `finished` ha precedenza nella classificazione Graph.

Prima della persistenza il tick riceve un `seq` canonico e un `commitId`.

Poiché mantiene `source: "betfair"`, un `seq` finito e un array di runner, il tick status-only soddisfa i requisiti di `getValidBetfairTicks()` e può quindi diventare il `latest` restituito da `/latest`.

In quel caso:

```txt
latestTimestamp = timestamp dell'entry status-only
```

La health può inoltre classificare la sessione come `red` / `ALERT` per `graphHealth.status = "auth_suspected"` o per `diagnostics.graphLoginRequired` nei tick recenti.

## Distinzione fra `integrity`, `health` e CDP

| Piano                 | Origine                                         | Significato |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| `integrity`           | commit journal Betfair                          | stato noto della persistenza                              |
| `health`              | timeline Betfair/Sofa + runtime + risultato CDP | disponibilità, freshness e qualità tecnica della sessione |
| `health.checks.cdpOk` | `checkCdpStatus()`                              | esito del probe CDP quando richiesto                      |

Non sono contratti equivalenti: l'integrity non viene derivata dalla health, mentre il risultato CDP è uno degli input della health.

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Money Flow History](./02-money-flow-history.md)
- [Timeline e history](../../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../../modules/storage/02-commit-journal-and-recovery.md)
- [Lifecycle scraper Betfair](../../modules/betfair/01-scraper-lifecycle.md)
