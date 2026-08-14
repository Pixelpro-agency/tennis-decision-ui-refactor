# Polling e view model

## Scopo

Questo modulo descrive i lifecycle di lettura frontend per Match, Betfair, Evidence e Source Identity e il loro passaggio verso dashboard e superfici diagnostiche.

Gli hook leggono API; non avviano scraper o browser, non eseguono recovery e non leggono file o journal.

## Ownership

| Area                              | Owner                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------- |
| Timeline e snapshot SofaScore     | `frontend/src/hooks/useMatchPolling.js`                                          |
| Latest, timeline e health Betfair | `frontend/src/hooks/useBetfairJson.js`                                           |
| Market Reaction Evidence          | `frontend/src/hooks/useMarketReactionEvidence.js`                                |
| Gate Source Identity live         | `frontend/src/hooks/useSourceIdentityGateStatus.js`                              |
| Mapping dashboard                 | `frontend/src/hooks/useDashboardViewModel.js`, `frontend/src/types/dashboard.js` |
| Connessioni UI                    | `frontend/src/utils/dashboardConnections.js`                                     |
| Stato comune della persistenza    | `frontend/src/utils/persistenceViewState.js`                                     |

## Due livelli di autorità

Il frontend distingue:

```txt
trackingSessionId + sessionActive
→ autorizzano la sessione applicativa

pollGeneration + requestId
→ proteggono il lifecycle locale delle richieste React
```

`App.jsx` passa URL ed evento ai poller soltanto con `sessionActive=true`. Ogni hook usa poi una generation locale che cambia con evento, configurazione, Stop o cleanup.

I contatori locali non sono session ID backend.

## Contratto comune dei poller

Match, Betfair, Evidence e Source Identity applicano questi principi:

- nessun timer senza gli identificatori richiesti;
- `setTimeout` ricorsivo, non `setInterval`;
- una sola richiesta attiva per generation;
- `AbortController` su cambio lifecycle o unmount;
- `requestId` per rilasciare soltanto la richiesta proprietaria;
- controllo della generation prima di aggiornare lo stato;
- nessun reschedule dopo Stop o cleanup.

Match e Betfair espongono inoltre `stopPolling()` e `resumePolling()`. Stop cancella direttamente timeout e richiesta; Resume è idempotente e crea una sola nuova catena.

## Read status e last-known

La presenza di un payload non determina più da sola lo stato corrente. Gli hook espongono un `readStatus`:

```txt
inactive
waiting
current
degraded
error
```

Match e Betfair separano:

```txt
data
→ dato della lettura corrente

lastKnownData
→ ultimo dato valido, non implicitamente corrente
```

In caso di waiting, persistence integrity o errore, `data` viene azzerato. L'eventuale last-known resta disponibile soltanto come valore esplicitamente distinto.

## Polling Match

Firma:

```txt
useMatchPolling(url, pollingInterval, explicitEventId)
```

Endpoint:

```http
GET /api/match/:eventId/json
```

In `App.jsx` l'intervallo è `2500 ms`.

### Normalizzazione

`normalizeSofaTimelinePayload()` restituisce:

```txt
snapshot
localContext
timeline
integrity
```

L'hook non ricalcola punti, percentuali, trend o strategie.

### Classificazione

```txt
200 valido
→ data e lastKnownData aggiornati
→ readStatus current
→ serverStatus ok

404
→ data null
→ readStatus waiting
→ serverStatus waiting

409 persistence_integrity
→ data null
→ readStatus degraded
→ serverStatus partial_persistence | recovery_failed
→ integrity preservata

altro errore HTTP/rete
→ data null
→ readStatus error
→ messaggio tecnico statico
```

`sourceUpdatedAt` deriva dal timestamp della timeline quando disponibile; `fetchedAt` rappresenta separatamente il completamento della lettura. `lastUpdate` resta alias compatibile di `sourceUpdatedAt`.

## Polling Betfair

Firma:

```txt
useBetfairJson(url, sofaEventId, pollingInterval, options)
```

Flusso:

```http
GET /api/betfair/:eventId/latest
404 → GET /api/betfair/:eventId/json
```

In `App.jsx` l'intervallo è `5000 ms`.

### Read model atomico

Ogni ciclo produce un singolo read model:

```txt
data
health
moneyFlowHistory
sourceUpdatedAt
fetchedAt
integrity
source = latest | timeline
```

Lo stato viene aggiornato insieme. Il fallback `/json` imposta esplicitamente `health:null` e `moneyFlowHistory:null`; non combina più una timeline nuova con diagnostica rimasta dalla precedente risposta `/latest`.

Timestamp:

```txt
/latest → latestTimestamp
/json → ultimo timestamp timeline o latest.timestamp
timestamp assente/non valido → null
fetchedAt → ora di completamento HTTP separata
```

Un `409 persistence_integrity` azzera il dato corrente, conserva integrity e produce `readStatus:degraded`.

## Polling Evidence

Firma:

```txt
useMarketReactionEvidence(eventId, pollingInterval)
```

Endpoint:

```http
GET /api/evidence/:eventId/latest
```

L'hook conserva il wrapper canonico:

```txt
latest
evidence = latest.marketReactionEvidence
sources
integrity
persistenceComplete = latest.dataQuality.persistenceComplete
```

I timestamp sono distinti:

```txt
sourceUpdatedAt → latest.metadata.updatedAt
fetchedAt → completamento della richiesta
lastUpdate → alias compatibile di sourceUpdatedAt
```

Un `404` preserva `integrity` e `reasons`, azzera il dato corrente e produce `waiting` oppure `degraded` quando integrity è presente. Errori HTTP/rete producono un messaggio statico e `readStatus:error`.

`MarketReactionsPage` riceve integrity, sources, persistenceComplete e readStatus e mostra separatamente la degradazione della persistenza.

Le funzioni legacy di conferma/revoca Evidence non sono l'autorità globale Source Identity; la shell usa il gate live.

## Polling Source Identity

Firma:

```txt
useSourceIdentityGateStatus(eventId, { enabled, pollingInterval })
```

Endpoint:

```http
GET /api/match/:eventId/source-identity-status
```

L'hook usa `pollGenerationRef`, `requestIdRef`, AbortController e ownership della richiesta. `404` significa status assente; gli altri errori vengono sintetizzati. Non legge Evidence e non ricostruisce il gate.

## View model dashboard

`useDashboardViewModel()` mappa `backendData` tramite `mapBackendDataToDashboard()`.

Quando arriva un dato corrente:

```txt
dashboardData = mapping corrente
lastKnownDashboardData = stesso mapping
```

Quando `backendData` torna `null`:

```txt
dashboardData = null
lastKnownDashboardData resta separato
```

Waiting, errore o persistence degradata non lasciano quindi una dashboard precedente implicitamente current. Il bootstrap resta legato al `trackingSessionId` come descritto in [Sessione e shell frontend](./01-session-shell.md).

## Persistence view state

`App.jsx` combina integrity Match, Betfair ed Evidence, `persistenceComplete` ed errori attraverso `buildPersistenceViewState()`.

```txt
inactive
waiting
current
degraded
error
```

La shell mostra un avviso comune per `degraded` ed `error`. Market Reactions riceve inoltre i dettagli Evidence pertinenti. Health, Source Identity e persistence rimangono assi distinti.

Il frontend non legge storage o journal e non esegue repair.

## Connessioni

`buildDashboardConnections()` usa `sofaReadStatus` e `betfairReadStatus`.

```txt
payload + readStatus current
→ connected / ok true

payload precedente + readStatus error
→ non connected / ok false

readStatus degraded
→ degraded

waiting o persistence buffering
→ waiting
```

La sola truthiness del payload non è più sufficiente.

## Preflight e health

`usePreflightChecks()` usa endpoint relativi `/api/...` ed è diagnostica advisory. Non verifica journal o persistenza canonica.

`useBetfairHealthAlerts()` riceve la health backend. Non riclassifica persistence integrity, freshness o Source Identity come health.

## Riferimenti implementativi

| Poller/view     | Implementazione                                     |
| --------------- | --------------------------------------------------- |
| Match           | `frontend/src/hooks/useMatchPolling.js`             |
| Betfair         | `frontend/src/hooks/useBetfairJson.js`              |
| Evidence        | `frontend/src/hooks/useMarketReactionEvidence.js`   |
| Source Identity | `frontend/src/hooks/useSourceIdentityGateStatus.js` |
| view model      | `frontend/src/hooks/useDashboardViewModel.js`       |
| connessioni     | `frontend/src/utils/dashboardConnections.js`        |
| tipi            | `frontend/src/types/dashboard.js`                   |

### Lifecycle comune

```text
trackingSessionId valido
→ request con generation/session token
→ response ancora appartenente alla sessione?
   sì → classificazione HTTP → current/last-known/error
   no → discard
→ schedule successivo

cambio sessione o unmount
→ abort request
→ clear timer
→ impedire commit tardivi
```

### Matrice HTTP

| Classe             | Effetto sul poller                                      |
| ------------------ | ------------------------------------------------------- |
| `200` valido       | aggiorna current e timestamp della sorgente             |
| `404` atteso       | waiting/unavailable secondo endpoint                    |
| `409` integrity    | stato degradato, reason preservata                      |
| errore rete/server | current non presentato come nuovo; last-known esplicito |
| risposta stale     | scartata senza aggiornare UI                            |

I quattro poller applicano lo stesso confine di sessione. Nessun hook usa un identificatore locale indipendente come sostituto dell'authority backend.

### Current e last-known

```text
current
→ risposta valida della sessione corrente

lastKnown
→ ultimo dato valido conservato per continuità visiva
→ etichettato come non corrente

error/waiting
→ non può apparire connected soltanto perché lastKnown esiste
```

Il view model non conserva silenziosamente `dashboardData` quando `backendData` diventa indisponibile. Timestamp di fetch locale e timestamp della sorgente restano campi distinti.

## Test

```txt
frontend/src/hooks/pollingLifecycle.test.mjs
frontend/src/hooks/useMatchPolling.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/hooks/useMarketReactionEvidence.test.mjs
frontend/src/utils/dashboardConnections.test.mjs
frontend/src/utils/persistenceViewState.test.mjs
```

`pollingLifecycle.test.mjs` monta gli hook con `react-test-renderer` e copre:

- switch evento e abort Match;
- risposta Match tardiva ignorata;
- Stop e Resume idempotente;
- evento vuoto senza richieste;
- switch evento e abort Betfair;
- Evidence 404 con integrity;
- Source Identity sotto StrictMode.

I test Betfair coprono inoltre il fallback `/latest 404 → /json` e verificano che health/history precedenti non entrino nel nuovo read model.

Verifica:

```bash
node --test <tutti i file frontend/src/**/*.test.mjs>
npm.cmd run build
node scripts/validation/run.mjs fast
python scripts/check_documentation_links.py
python scripts/check_registry_consistency.py
```

`npm.cmd run lint` non è disponibile finché manca una configurazione ESLint.

## Documenti collegati

- [Sessione e shell frontend](./01-session-shell.md)
- [UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md)
- [Contesto punti UI](./04-match-context-ui.md)
- [API Match](../../api/01-match.md)
- [API Betfair](../../api/02-betfair.md)
- [API Evidence](../../api/03-evidence.md)
- [Source Identity](../evidence/02-source-identity.md)
- [Market Reactions](../evidence/04-market-reactions.md)
- [Validazione e rollback](../../operations/04-validation-and-rollback.md)
