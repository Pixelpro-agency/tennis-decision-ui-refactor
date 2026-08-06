# Polling e view model

## Scopo

Questo modulo descrive come il frontend legge timeline persistite, Evidence e dati Betfair, trasformandoli per la dashboard.

Il polling dello stato live del Source Identity Gate è separato dal polling Evidence.

Le API Match e Betfair espongono `integrity`, ma il wiring frontend corrente è solo parziale: gli hook SofaScore e Betfair conservano lo stato, mentre `App.jsx`, `useDashboardViewModel(...)` e le viste non lo propagano ancora in modo uniforme.

```txt
frontend/src/
├── hooks/useMatchPolling.js
├── hooks/useBetfairJson.js
├── hooks/useMarketReactionEvidence.js
├── hooks/useSourceIdentityGateStatus.js
├── hooks/useDashboardViewModel.js
├── hooks/useBetfairHealthAlerts.js
├── hooks/usePreflightChecks.js
├── types/dashboard.js
└── utils/
```

Gli hook leggono API. Non avviano scraper, browser, tracking backend, recovery o repair di journal.

Il frontend non legge file journal, non espone path locali, non ricostruisce history o timeline e non interpreta `commitId` come dato operativo.

## Polling SofaScore

Hook:

```txt
useMatchPolling(url, pollingInterval, explicitEventId)
```

In `App.jsx` viene usato con intervallo di `2500 ms`.

Legge:

```txt
GET /api/match/:eventId/json
```

Flusso:

```txt
timeline SofaScore
→ normalizeSofaTimelinePayload(...)
→ snapshot + localContext + timeline + integrity
```

Il valore restituito dall’hook contiene:

```txt
data
loading
error
lastUpdate
isPolling
serverStatus
integrity
loadMatch
stopPolling
resumePolling
```

`normalizeSofaTimelinePayload(...)` inoltra:

```txt
snapshot
localContext
timeline
integrity
```

`localContext` usa `null` quando il tick non lo contiene.

Il polling non ricalcola punti, percentuali, differenze o lato in vantaggio. L’assenza di dati resta esplicita: nessun fallback `50/50`, trend, previsione o strategia derivata lato client.

### Classificazione HTTP reale

Durante una sessione live con `eventId` valido:

```txt
GET /api/match/:eventId/json = 404
→ serverStatus: waiting
→ data: null
→ error: null
→ integrity: null
→ polling resta attivo
```

```txt
GET /api/match/:eventId/json = 409
+ error: persistence_integrity
+ integrity.status = partial_persistence
→ serverStatus: partial_persistence
→ data: null
→ error: null
→ integrity preservata
→ polling resta attivo
```

```txt
GET /api/match/:eventId/json = 409
+ error: persistence_integrity
+ integrity.status = recovery_failed
→ serverStatus: recovery_failed
→ data: null
→ error: null
→ integrity preservata
→ polling resta attivo
```

```txt
HTTP 400, HTTP 500 o errore rete
→ serverStatus: error
→ comportamento errore invariato
```

Il valore `serverStatus: persistence_integrity` non è usato dal codice corrente. Lo stato viene distinto direttamente in `partial_persistence` e `recovery_failed`.

Il `404` è interpretato come attesa solo in assenza di un `409 persistence_integrity` esplicito.

L’hook:

- usa `setTimeout`, non `setInterval`;
- evita polling dopo `stopPolling()`;
- espone `loadMatch()` e `resumePolling()`;
- preserva `integrity` ricevuta dal backend;
- resetta `data`, `lastUpdate`, `serverStatus` e `integrity` all’avvio di una nuova sessione.

Il polling non esegue recovery client-side e non modifica timeline, history, journal o gate.

## Polling Betfair

Hook:

```txt
useBetfairJson(url, sofaEventId, pollingInterval, options)
```

In `App.jsx` viene usato con intervallo di `5000 ms`.

Legge prima:

```txt
GET /api/betfair/:eventId/latest
```

Se riceve `404` senza persistence integrity nota, prova:

```txt
GET /api/betfair/:eventId/json
```

Espone:

```txt
data
health
moneyFlowHistory
loading
error
lastUpdate
isPolling
integrity
startPolling
stopPolling
resumePolling
```

`lastUpdate` usa soltanto timestamp server:

```txt
/latest
→ payload.latestTimestamp

/json fallback
→ ultimo timestamp reale della timeline
→ payload.latest.timestamp quando disponibile

timestamp assente o non valido
→ null

mai
→ ora locale della richiesta HTTP
```

Il fallback `/json` è diagnostico o di bootstrap. Non deve far apparire fresco un dato vecchio.

La risposta `/latest` può contenere `moneyFlowHistory` al livello root. L’hook lo espone separatamente e lo collega anche al dato latest quando presente.

### `409 persistence_integrity` Betfair

Quando `/latest` o `/json` rispondono:

```txt
HTTP 409
error: persistence_integrity
integrity.status: partial_persistence | recovery_failed
```

l’hook:

```txt
setData(null)
→ preserva integrity
→ preserva health sicura eventualmente ricevuta da /latest
→ error resta null
→ lastUpdate non viene costruito dall’ora locale
→ moneyFlowHistory non viene inventata
→ polling resta attivo salvo stop esplicito
```

`integrity` resta separata da health, freshness, Graph health, runtime scraper, Money Flow e ladder reliability.

Il limite corrente è nel wiring superiore:

```txt
useBetfairJson
→ espone integrity

App.jsx
→ non destruttura integrity
→ non la passa a useDashboardViewModel o BetfairDepthCard
```

Quindi il dato è conservato dall’hook ma non è ancora visualizzato in modo uniforme.

## Polling Evidence e Market Reactions

Hook:

```txt
useMarketReactionEvidence(eventId, pollingInterval)
```

Legge:

```txt
GET /api/evidence/:eventId/latest
```

### Contratto reale dell’hook

Il backend può restituire un wrapper completo con:

```txt
latest
sources
integrity
```

L’hook corrente non conserva il wrapper completo. In caso `200` salva soltanto:

```txt
payload.latest.marketReactionEvidence
```

come valore `evidence`.

Il valore restituito dall’hook contiene:

```txt
evidence
loading
error
reasons
lastUpdate
isPolling
refresh
confirmSourceIdentity
revokeSourceIdentityConfirmation
```

Non espone attualmente:

```txt
integrity top-level
sources.sofa
sources.betfair
latest.dataQuality.persistenceComplete
snapshot Evidence completo
```

Regole effettive:

```txt
404 Evidence
→ evidence: null
→ error: null
→ reasons = payload.reasons oppure payload.error oppure null
→ integrity top-level non preservata
```

```txt
200 con payload.ok === true
→ evidence = payload.latest.marketReactionEvidence oppure null
→ reasons: null
→ lastUpdate = ora locale di completamento della fetch
```

```txt
200 con payload.ok !== true
→ evidence: null
→ error: null
→ reasons preservate quando presenti
```

```txt
500 o errore rete
→ evidence: null
→ errore tecnico statico
```

Il backend Evidence resta responsabile della degradazione cross-source: quando persistence integrity è incompleta, `marketReactionEvidence` deve risultare non disponibile e mantenere `causalityClaimed:false` prima di raggiungere il frontend.

Il frontend corrente beneficia quindi della degradazione già applicata dal backend, ma non mostra ancora il blocco top-level `integrity` né `persistenceComplete`.

La conferma e la revoca Source Identity sono esposte dall’hook, ma lo stato globale Source Identity usa il gate live separato.

## Status live Source Identity

Hook:

```txt
useSourceIdentityGateStatus(eventId, {
  enabled,
  pollingInterval
})
```

Legge esclusivamente:

```txt
GET /api/match/:eventId/source-identity-status
```

Restituisce:

```txt
status
loading
error
isPolling
refresh
```

Regole:

```txt
setTimeout, non setInterval
→ una sola fetch attiva per sessione
→ AbortController su cambio eventId o unmount
→ risposte tardive ignorate
→ polling solo con eventId valido e enabled=true
→ 404 = status null, non errore visibile
→ errore rete o HTTP non previsto = errore sintetico
→ nessun POST
→ nessuna lettura Evidence
→ nessuna ricostruzione Source Identity nel frontend
```

`useSourceIdentityGateUi.js` costruisce:

```txt
sourceIdentityStatusForUi
```

Tutti i consumer Source Identity usano questo valore. Il frontend non altera `phase`, `persistence` o `sourceIdentity.status`.

Persistence integrity non modifica il gate live e non trasforma `pending` in `mismatch`.

## View model dashboard

Hook:

```txt
useDashboardViewModel({
  backendData,
  isSofaPolling,
  sofaLastUpdate,
  serverStatus,
  betfairData,
  betfairMoneyFlowHistory,
  confirmedUrl,
  loadMatch
})
```

Il codice corrente non riceve parametri dedicati a:

```txt
integrity SofaScore
integrity Betfair
integrity Evidence
```

Restituisce soltanto:

```txt
dashboardData
betfairHistory
```

Flusso:

```txt
backendData presente
→ mapBackendDataToDashboard(...)
→ setDashboardData(mapped)

backendData assente
→ dashboardData precedente non viene azzerato da questo effect
```

Questa è una limitazione reale da considerare quando SofaScore passa a `partial_persistence` o `recovery_failed`: l’hook di polling imposta `data:null`, ma il view model non possiede ancora una regola uniforme per eliminare o degradare il precedente `dashboardData`.

Il mapping principale appartiene a:

```txt
frontend/src/types/dashboard.js
```

`mapBackendDataToDashboard(...)` inoltra `localContext` e i nomi giocatori ricevuti dallo snapshot. Non ricostruisce dati sportivi, Evidence, Source Identity, punti o percentuali.

### Money Flow nel view model

```txt
betfairMoneyFlowHistory
→ verifica Array.isArray(history.series)
→ betfairHistory = history oppure { series: [] }
```

Le card ricevono dati pronti e non ricostruiscono fallback basati sul nome del runner.

Poiché integrity non è passata al view model, il codice corrente non crea uno stato persistence separato e non sopprime una serie esclusivamente sulla base di integrity. Restano validi i guard già applicati dal backend e dal read model dei point.

### Connessione Sofa

`dashboardConnections.js` costruisce:

```txt
connections.sofa = {
  status: connected | waiting | disconnected,
  ok,
  lastUpdate
}
```

Regole correnti:

```txt
backendData presente
→ connected
→ ok true

backendData assente
+ sofaServerStatus = waiting
→ waiting
→ ok false

backendData assente
+ Source Identity phase collecting/pending
+ persistence buffering
→ waiting
→ ok false

altri casi, inclusi partial_persistence e recovery_failed
→ disconnected
→ ok false
```

Non esiste ancora uno stato `persistence` separato dentro `connections.sofa`.

## Preflight

`usePreflightChecks(...)` esegue:

```txt
GET  /api/test/health
POST /api/test/cdp
POST /api/test/sofa-url
POST /api/test/betfair-url
POST /api/test/graph-urls
```

`App.jsx` passa `''` come `apiBase`; gli endpoint restano relativi `/api/...`, coerenti con il proxy Vite.

Preflight non controlla journal, non esegue recovery e non dichiara completa la persistenza canonica.

## Health Betfair

`useBetfairHealthAlerts(...)` deriva:

```txt
betfairHealthTransition
betfairAudioAlertEnabled
showBetfairAlertToast
dismissBetfairAlertToast
```

Hook e componenti ricevono `health` già classificata dal backend.

Non devono:

- ricalcolare lo status;
- trasformare un errore tecnico in uno stato diverso;
- trasformare tick o ladder stale in classificazioni nuove;
- trasformare `partial_persistence` o `recovery_failed` in Graph health;
- attivare polling autonomo.

L’avviso audio corrente combina flag strutturati con un controllo testuale su `message` e `reasons`; questa dipendenza non deve essere ignorata durante un refactor.

## Stato della persistence integrity frontend

```txt
API Match e Betfair
→ contratto implementato

useMatchPolling
→ integrity e serverStatus specifici implementati

useBetfairJson
→ integrity implementata nell’hook

useMarketReactionEvidence
→ wrapper integrity/sources non preservato

App.jsx
→ integrity non inoltrate

useDashboardViewModel
→ nessun persistence view state

BetfairDepthCard / MarketReactionsPage
→ nessuna prop integrity dedicata
```

La UI persistence integrity è quindi **parzialmente implementata**, non completa.

Un completamento corretto richiede:

- propagazione esplicita dagli hook;
- reset o degradazione del view model senza mantenere dati precedenti come correnti;
- rendering separato da health e Source Identity;
- preservazione di integrity nei `404` Evidence;
- test React con fake timer, AbortController e StrictMode.

Questa sezione descrive un limite corrente, non una specifica già disponibile.

## Test

```bash
npm run build
node src/hooks/useMatchPolling.test.mjs
node src/hooks/useBetfairJson.test.mjs
node src/utils/sourceIdentityGatePresentation.test.mjs
node src/utils/analysisSessionState.test.mjs
node src/utils/liveSessionRequests.test.mjs
node src/utils/sourceIdentityConfirmationState.test.mjs
node src/utils/sourceIdentityControlMode.test.mjs
node src/utils/dashboardConnections.test.mjs
node src/utils/dashboardMatchOverview.test.mjs
node src/utils/dashboardStats.test.mjs
node src/utils/betfairMoneyFlow.test.mjs
node src/types/dashboard.test.mjs
node src/components/matchContextViewModel.test.mjs
```

Casi coperti:

```txt
useMatchPolling.test.mjs
→ 404 = waiting
→ 409 partial_persistence
→ 409 recovery_failed
→ integrity preservata
→ 500 e 400 = error

useBetfairJson.test.mjs
→ timestamp server validi
→ timestamp assente = null
→ 409 preserva integrity
→ nessuna ora locale come lastUpdate
→ integrity separata da health

dashboardConnections.test.mjs
→ connected con backendData
→ waiting con serverStatus waiting
→ waiting con collecting/pending + buffering
→ disconnected negli altri casi
```

Non è presente un test dedicato che dimostri la propagazione top-level di Evidence integrity attraverso `useMarketReactionEvidence`, perché tale propagazione non è implementata.

`npm run lint` non è eseguibile finché manca una configurazione ESLint.

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
