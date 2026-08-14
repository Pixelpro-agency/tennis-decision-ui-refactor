# Tennis Decision UI — Frontend, sessione live e polling

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-025…027
> **Parte precedente:** [Evidence, provenance e confronti temporali](04-evidence-provenance.md)
> **Parte successiva:** [Validazione, fixture e test harness](06-validazione-e-fixture.md)

## 20. Frontend, sessione live e polling

Questo documento registra il comportamento frontend relativo a tre responsabilità collegate:

- ciclo di vita della sessione live;
- polling dei dati runtime e isolamento delle richieste asincrone;
- presentazione di Market Reactions e mapping dei dati Evidence verso le card.

Il coordinamento principale avviene in `App.jsx`, mentre stato, chiamate HTTP e trasformazioni sono distribuiti fra hook e helper dedicati. Le tre aree condividono l'identità dell'evento e lo stato di sessione, ma mantengono lifecycle e semantiche di lettura distinti.

---

### IMPL-025 — Frontend live-session controller

**Copertura corrente:** `PARZIALE — identità di tracking presente, stato della sessione distribuito`

#### Stato della sessione

Il frontend non usa un singolo enum di sessione. La rappresentazione corrente è composta da gruppi di stato separati.

| Area                         | Stato corrente                                                                                                                              | Modulo principale                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| input modificabili           | `matchUrl`, `betfairUrl`, graph URL, modalità Betfair, profilo Chrome, CDP URL                                                              | `useAnalysisSessionState.js`                                   |
| valori confermati dopo Start | `confirmedUrl`, `confirmedBetfairUrl`, `confirmedBetfairGraphUrls`, `confirmedBetfairMode`, `confirmedChromeProfilePath`, `confirmedCdpUrl` | `useAnalysisSessionState.js`                                   |
| stato runtime                | `sessionShellVisible`, `sessionActive`, `trackingSessionId`, `trackingStopped`, `startTrackingError`, `stopSofaStatus`, `activeView`        | `App.jsx`                                                      |
| bootstrap dashboard          | `dashboardContentReady` più riferimenti interni alla sessione di bootstrap                                                                  | `useDashboardBootstrapState.js`                                |
| Source Identity UI           | status del gate, presentazione, toast e modale di conferma                                                                                  | `useSourceIdentityGateStatus.js`, `useSourceIdentityGateUi.js` |

La distinzione principale è fra input correnti e valori `confirmed*`. Questi ultimi vengono aggiornati soltanto dopo una risposta Start valida. Non rappresentano però una configurazione restituita dal backend: dopo il successo vengono copiati dai valori inviati nella richiesta.

#### Sequenza Start

La sequenza corrente è:

```txt
utente invia Start
→ costruzione richiesta di tracking
→ reset della Source Identity UI
→ activeView = overview
→ sessionShellVisible = true
→ sessionActive = false
→ trackingSessionId = null
→ azzeramento errori/stato Stop
→ POST /api/match/track
```

La risposta viene accettata dal frontend soltanto se contiene un `trackingSessionId` stringa non vuoto.

```txt
risposta Start valida
→ applica i valori inviati ai campi confirmed*
→ trackingSessionId = valore restituito
→ sessionActive = true
→ avvia il bootstrap dashboard per quel trackingSessionId
```

Se il `trackingSessionId` manca, la risposta viene trattata come fallimento dello Start.

Il fallimento dello Start produce:

```txt
reset bootstrap
→ clear dei valori confirmed*
→ sessionActive = false
→ trackingSessionId = null
→ sessionShellVisible = false
→ startTrackingError valorizzato
```

Non sono presenti `startCommandId`, `stopCommandId` o `confirmCommandId` nello stato frontend corrente.

#### Event ID

L'`eventId` usato dal frontend viene ricavato da `confirmedUrl` tramite `getSofaEventId()`:

```txt
confirmedUrl
→ parsing URL SofaScore
→ sofaEventId
```

Lo Start non sostituisce questo valore con un `eventId` letto dalla propria risposta.

`sofaEventId` viene poi usato per:

- polling SofaScore;
- polling Betfair;
- polling Evidence;
- polling Source Identity Gate;
- Stop del tracking;
- conferma Source Identity.

#### Tracking session ID

`trackingSessionId` è usato in tre punti rilevanti.

1. **Accettazione dello Start** — uno Start senza `trackingSessionId` viene rifiutato dal frontend.
2. **Bootstrap dashboard** — `useDashboardBootstrapState` completa il bootstrap soltanto quando la sessione attiva e la sessione di bootstrap hanno lo stesso `trackingSessionId`, è stato osservato il reset dei dati precedenti ed esiste nuovo `backendData`.
3. **Conferma Source Identity** — la conferma invia il `trackingSessionId` esposto dallo status del gate e, dopo il refresh, considera riuscita la verifica soltanto con `phase = recording`, Source Identity `aligned` e lo stesso `trackingSessionId`.

I poller non ricevono direttamente `trackingSessionId` come chiave. Il loro scope operativo deriva invece da `sessionActive`, URL confermati ed `eventId`.

#### Shell e sessione attiva

`sessionShellVisible` e `sessionActive` hanno significati distinti.

```txt
sessionShellVisible
→ decide se mostrare il workspace o il pannello iniziale

sessionActive
→ abilita lo scope live dei reader/poller
```

Durante lo Start la shell può quindi essere già visibile mentre `sessionActive` è ancora `false`. In questa fase i poller live non ricevono un `eventId` attivo da `App.jsx`.

Il contenuto dashboard viene mostrato soltanto quando `dashboardContentReady` è vero e `dashboardData` esiste. Prima di quel momento il workspace usa la schermata di attesa del Source Identity Gate.

#### Stop

Sono presenti due percorsi frontend distinti.

##### Stop live mantenendo la shell

`handleStopLiveTracking()`:

```txt
stopSofaStatus = "Stopping live tracking..."
→ POST /api/match/stop con eventId
→ stop immediato del polling SofaScore
→ sessionActive = false
→ trackingSessionId = null
→ trackingStopped = true
```

In caso di successo la shell resta visibile e `stopSofaStatus` passa a `Live tracking stopped`.

Con `sessionActive = false`, `App.jsx` passa valori vuoti ai reader session-scoped; i rispettivi effect disattivano quindi anche Betfair, Evidence e Source Identity Gate.

##### Stop e ritorno al pannello link

`stopAndReturnToLinks()`:

```txt
POST /api/match/stop con eventId
→ stop polling SofaScore
→ clear valori confirmed*
→ sessionActive = false
→ trackingSessionId = null
→ sessionShellVisible = false
→ activeView = overview
→ trackingStopped = true
→ reset bootstrap dashboard
```

Questo percorso è usato quando la UI deve chiudere la sessione e tornare al pannello iniziale.

La richiesta Stop invia attualmente:

```json
{
  "eventId": "<event id oppure null>"
}
```

Non invia `trackingSessionId` o un identificatore di comando.

Non esistono uno stato `stopped_static` o un campo `snapshotMode`. `useDashboardViewModel` conserva separatamente `lastKnownDashboardData`, mentre il dato dashboard corrente viene azzerato quando `backendData` non è più disponibile.

#### Source Identity durante la sessione

Il polling dello status Source Identity è attivo quando la sessione è attiva e dispone di un `sofaEventId`.

Per una situazione confermabile, `useSourceIdentityGateUi` apre automaticamente la modale una volta per la combinazione corrente di:

```txt
sofaEventId
+ giocatori SofaScore
+ runner Betfair
```

La conferma richiede `selectedPairs` e testo di conferma, invia anche il `trackingSessionId` dello status corrente e verifica nuovamente lo stato dopo la chiamata.

Se il gate entra in `mismatch`, il frontend:

```txt
ferma il polling SofaScore
→ clear valori confirmed*
→ sessionActive = false
→ trackingSessionId = null
→ chiude la modale
→ sessionShellVisible = false
→ activeView = overview
→ trackingStopped = false
→ reset bootstrap dashboard
```

La UI torna quindi al pannello iniziale per una nuova configurazione.

#### Consumer principali

```txt
App.jsx
StartAnalysisPanel.jsx
DashboardWorkspace.jsx
OverviewDashboard.jsx
Source Identity UI
useMatchPolling.js
useBetfairJson.js
useMarketReactionEvidence.js
useSourceIdentityGateStatus.js
```

---

### IMPL-026 — Polling runtime session-scoped

**Copertura corrente:** `PRESENTE IN HOOK SEPARATI — lifecycle protetto, nessuna primitive unica condivisa`

I quattro reader periodici implementano indipendentemente protezioni molto simili. Il lifecycle comune non è centralizzato in un singolo hook generico.

#### Reader attivi

| Reader                      | Attivazione da `App.jsx`                                | Intervallo | Endpoint principale                          |
| --------------------------- | ------------------------------------------------------- | ---------: | -------------------------------------------- |
| SofaScore                   | `sessionActive` + `confirmedUrl` + `sofaEventId`        | 2500 ms    | `/api/match/:eventId/json`                   |
| Betfair                     | `sessionActive` + `confirmedBetfairUrl` + `sofaEventId` | 5000 ms    | `/api/betfair/:eventId/latest`               |
| Evidence / Market Reactions | `sessionActive` + `sofaEventId`                         | 5000 ms    | `/api/evidence/:eventId/latest`              |
| Source Identity Gate        | `sessionActive` + `sofaEventId`                         | 1000 ms    | `/api/match/:eventId/source-identity-status` |

Il reader Evidence non dipende da `activeView`: durante una sessione attiva continua a leggere Evidence anche quando la vista corrente non è `market-reactions`.

#### Lifecycle comune effettivo

I quattro hook usano, con variazioni locali, gli stessi elementi di protezione:

```txt
generation corrente
requestId incrementale
AbortController
riferimento alla richiesta attiva
un solo fetch attivo per generation
timeout di polling
cleanup dell'effect
```

La sequenza tipica è:

```txt
cambio scope/sessione
→ incrementa generation
→ cancella timeout precedente
→ abortisce la richiesta precedente
→ resetta lo stato corrente
→ esegue un fetch immediato
→ programma il fetch successivo
```

Una risposta appartenente a una `generation` precedente non può aggiornare lo stato corrente.

Quando una richiesta è già attiva per la stessa `generation`, i reader riutilizzano la promise in corso invece di avviare una seconda richiesta concorrente.

Il cleanup invalida la `generation`, cancella il timer e abortisce la richiesta ancora attiva. Questo impedisce a una risposta tardiva della sessione precedente di sovrascrivere i dati della sessione nuova.

#### SofaScore

`useMatchPolling()` legge la timeline SofaScore e normalizza:

```txt
snapshot
localContext
timeline latest
integrity
```

Stati HTTP rilevanti:

| Risposta                    | Stato frontend                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `200`                       | `serverStatus = ok`, `readStatus = current`                                            |
| `404`                       | `serverStatus = waiting`, `readStatus = waiting`, nessun errore UI tecnico             |
| `409 persistence_integrity` | `serverStatus = partial_persistence` oppure `recovery_failed`, `readStatus = degraded` |
| altri errori                | `serverStatus = error`, `readStatus = error`                                           |

Su lettura valida vengono aggiornati sia `data` sia `lastKnownData`.

Quando cambia lo scope dell'evento, l'hook azzera anche `lastKnownData`. `stopPolling()` interrompe timer e richiesta attiva senza cancellare immediatamente i dati; quando `App.jsx` rimuove l'`eventId` a seguito della disattivazione della sessione, l'effect esegue il reset completo.

Sono disponibili sia `stopPolling()` sia `resumePolling()`.

#### Betfair

`useBetfairJson()` prova prima:

```txt
/api/betfair/:eventId/latest
```

Se e solo se il `latest` risponde `404`, esegue fallback su:

```txt
/api/betfair/:eventId/json
```

Il modello prodotto dal `latest` può includere:

```txt
data
health
moneyFlowHistory
sourceUpdatedAt
integrity
source = latest
```

Il fallback timeline produce invece un modello atomico con:

```txt
data = ultimo elemento timeline normalizzato
health = null
moneyFlowHistory = null
source = timeline
```

In questo modo health e history di una precedente lettura `latest` non vengono mantenuti quando il ciclo corrente usa il fallback timeline.

Un `409` con `persistence_integrity` porta `readStatus = degraded`, conserva il blocco `integrity` e non viene presentato come errore tecnico generico.

Quando URL o `eventId` escono dallo scope attivo, l'hook azzera dati correnti, dati last-known, health, money-flow history e stato di integrità.

Sono disponibili `stopPolling()` e `resumePolling()`.

#### Evidence / Market Reactions

`useMarketReactionEvidence()` normalizza la risposta in:

```txt
latest
marketReactionEvidence
sources
integrity
persistenceComplete
sourceUpdatedAt
fetchedAt
```

La distinzione temporale è esplicita:

```txt
sourceUpdatedAt
→ timestamp del contenuto Evidence

fetchedAt
→ momento della lettura frontend
```

Comportamento principale:

| Risposta/condizione            | Stato frontend                                                  |
| ------------------------------ | --------------------------------------------------------------- |
| `200` con `ok: true`           | `current`, oppure `degraded` se `persistenceComplete === false` |
| `404` senza integrity          | evidence azzerata, reasons conservate, `waiting`                |
| `404` con integrity            | evidence azzerata, integrity/reasons conservate, `degraded`     |
| risposta non OK diversa da 404 | evidence azzerata, `error`                                      |
| `200` con `ok !== true`        | evidence azzerata, reasons conservate, `waiting`                |

Il reader espone anche `refresh()` per la lettura manuale immediata.

Le funzioni legacy `confirmSourceIdentity()` e `revokeSourceIdentityConfirmation()` sono ancora esportate dall'hook, anche se il percorso principale della UI usa `useSourceIdentityGateUi` e i servizi dedicati per la conferma.

#### Source Identity Gate

`useSourceIdentityGateStatus()` esegue un fetch immediato all'attivazione e poi continua tramite timeout.

Comportamento principale:

| Risposta                          | Stato frontend                     |
| --------------------------------- | ---------------------------------- |
| `200` con `ok: true`              | `status = payload`, nessun errore  |
| `404`                             | `status = null`, nessun errore     |
| altri status o payload non valido | `status = null`, errore UI statico |
| abort/cambio generation           | nessun aggiornamento stale         |

L'hook espone `refresh()` e `isPolling`.

#### Isolamento fra sessioni

La separazione corrente deriva dalla combinazione di:

```txt
sessionActive
+ eventId/URL passati agli hook
+ generation interna del singolo reader
+ AbortController
+ bootstrap legato a trackingSessionId
```

I poller non condividono una `sessionKey` comune e non usano `trackingSessionId` come dipendenza diretta del proprio effect.

#### Retention corrente

La retention non è espressa tramite policy nominali come `clear_on_new_session` o `retain_last_verified_on_stop`.

Il comportamento effettivo è distribuito:

- `useMatchPolling` e `useBetfairJson` mantengono valori last-known durante lo stesso scope, ma li azzerano quando lo scope viene ricreato senza evento/URL;
- `useMarketReactionEvidence` azzera il contenuto Evidence quando la lettura corrente non è disponibile, mantenendo separatamente reasons/integrity quando previsti dalla risposta;
- `useDashboardViewModel` conserva `lastKnownDashboardData` separatamente dal `dashboardData` corrente;
- la disattivazione della sessione rimuove gli input attivi dei reader da `App.jsx` e provoca il cleanup dei rispettivi effect.

---

### IMPL-027 — Market Reactions frontend view model

**Copertura corrente:** `PARZIALE — helper di view model presente, mapping ancora distribuito fra pagina e card`

#### Pipeline frontend

La catena corrente è:

```txt
/api/evidence/:eventId/latest
→ useMarketReactionEvidence
→ evidence + sources + integrity + persistenceComplete + readStatus
→ MarketReactionsPage
→ MarketLedObservationCard / FieldLedReactionCard
→ helper marketReactionViewModel.js
```

`useMarketReactionEvidence` estrae `latest.marketReactionEvidence` e mantiene separati i metadati di lettura. `MarketReactionsPage` decide gli stati principali della pagina. Le due card interpretano poi i rami `marketLedObservation` e `fieldLedReaction`.

Non esiste un singolo oggetto frontend che contenga `pageState`, i due card model completi e tutte le classificazioni di disponibilità. Il mapping è ancora diviso fra:

```txt
MarketReactionsPage.jsx
marketReactionViewModel.js
MarketLedObservationCard.jsx
FieldLedReactionCard.jsx
```

#### Stato pagina

`MarketReactionsPage` rappresenta direttamente queste condizioni:

| Condizione                                                | Presentazione                                 |
| --------------------------------------------------------- | --------------------------------------------- |
| nessun `eventId`                                          | messaggio `No match loaded`                   |
| `readStatus = degraded` o `persistenceComplete === false` | banner di persistenza incompleta              |
| `loading` senza evidence                                  | stato loading                                 |
| errore tecnico                                            | pannello errore                               |
| nessuna evidence, nessun errore e non loading             | `No snapshot available` più reasons eventuali |
| evidence disponibile                                      | rendering delle due card                      |

Non sono presenti enum frontend espliciti per `observed_provisional`, `observed_final`, `stale` o `integrity_blocked`.

#### Disponibilità branch

La disponibilità è valutata tramite:

```js
isBranchAvailable(evidence)
→ evidence?.available === true
```

Un oggetto branch presente ma senza `available: true` non viene quindi promosso a disponibile.

Le card mostrano il badge `available`/`unavailable` usando questa regola.

#### Exchange → Field

`MarketLedObservationCard` riceve:

```txt
evidence.marketLedObservation
```

Il source event è `sourceMarketEvent`.

`buildMarketSourceView()` mappa esplicitamente:

```txt
runner
observedFlowAmount → amount
absoluteFlowTier → absoluteTier
relativeFlowTier → relativeTier
direction
flowAmbiguous
```

La card legge inoltre direttamente dal source event:

```txt
timestamp
selectionId
```

Le finestre di osservazione usano:

```txt
windowSec
fieldEventObservedAfterFlow
dataQuality
sofaTicksObserved
relevantMarkersObserved
reasons
```

Il summary può mostrare:

```txt
dataQuality
flowAmbiguous
sofaEventsObserved
reasons
causalityClaimed
```

Quando `fieldEventObservedAfterFlow` è falso, la finestra mostra `not observed`. Non esiste una classificazione frontend separata che distingua una finestra provisional da una finestra final.

#### Field → Exchange

`FieldLedReactionCard` riceve:

```txt
evidence.fieldLedReaction
```

Il source event è `sourceFieldEvent` e la card legge:

```txt
type
stateFirstSeenAt
pointState
gameScore
```

Il summary usa:

```txt
dataQuality
marketResponseObserved
marketResponseReliable
firstObservedResponseWindowSec
reasons
causalityClaimed
```

Le finestre di osservazione usano:

```txt
windowSec
marketResponseObserved
marketResponseReliable
dataQuality
betfairTicksObserved
marketMatchedDelta
priceChangeObserved
matchedVolumeIncreaseObserved
runnerPriceChanges
reasons
```

Per ogni runner possono essere mostrati:

```txt
name / selectionId
baselinePrice
latestPrice
priceDeltaPct
priceDirection
```

Quando `marketResponseObserved` è falso, la finestra mostra `not observed`. Anche in questo ramo non esiste una classificazione frontend separata provisional/final.

#### Causalità

La pagina mostra sempre il contesto:

```txt
Temporal proximity only. Causality not established.
```

Le card mostrano inoltre `Causality not established` quando:

```txt
evidence.summary.causalityClaimed === false
oppure
evidence.causalityClaimed === false
```

Il view model frontend non genera segnali, previsioni o raccomandazioni operative.

#### Integrità e qualità

`useMarketReactionEvidence` mantiene separati:

```txt
integrity
persistenceComplete
sources
reasons
readStatus
```

`MarketReactionsPage` usa `readStatus`, `persistenceComplete` e `integrity` per il banner di degradazione. `sources` viene usato a livello pagina per indicare che sono disponibili diagnostiche della lettura corrente, ma non viene inoltrato alle singole card.

La qualità del singolo ramo o della singola finestra viene invece letta direttamente dai payload `summary.dataQuality` e `window.dataQuality`.

---

## 20.1 Stato di persistenza condiviso con il workspace

`App.jsx` costruisce anche uno stato di persistenza globale tramite `buildPersistenceViewState()` combinando:

```txt
sessionActive
dashboardReady
sofaIntegrity
betfairIntegrity
evidenceIntegrity
evidencePersistenceComplete
sofaError
betfairError
evidenceError
```

Gli stati prodotti sono:

| Stato      | Condizione principale                                           |
| ---------- | --------------------------------------------------------------- |
| `inactive` | sessione non attiva                                             |
| `degraded` | integrity degradata oppure Evidence persistence incompleta      |
| `error`    | errore di uno dei reader senza degradazione già classificata    |
| `waiting`  | sessione attiva ma dashboard non pronta                         |
| `current`  | sessione attiva, nessuna degradazione/errore e dashboard pronta |

Questo stato viene passato al workspace e alla Overview. `MarketReactionsPage` riceve invece direttamente lo stato Evidence specifico (`integrity`, `persistenceComplete`, `readStatus`, `sources`, `reasons`).

---

## 20.2 Matrice delle responsabilità correnti

| Responsabilità                           | Modulo                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| input e valori confermati                | `frontend/src/hooks/useAnalysisSessionState.js`                        |
| Start/Stop tracking frontend             | `frontend/src/hooks/useLiveTrackingActions.js`                         |
| chiamate HTTP Start/Stop/Gate            | `frontend/src/services/liveSessionApi.js`                              |
| parsing `sofaEventId`                    | `frontend/src/utils/preflight.js`                                      |
| bootstrap session-scoped della dashboard | `frontend/src/hooks/useDashboardBootstrapState.js`                     |
| polling SofaScore                        | `frontend/src/hooks/useMatchPolling.js`                                |
| polling Betfair                          | `frontend/src/hooks/useBetfairJson.js`                                 |
| polling Evidence                         | `frontend/src/hooks/useMarketReactionEvidence.js`                      |
| polling Source Identity                  | `frontend/src/hooks/useSourceIdentityGateStatus.js`                    |
| comportamento UI Source Identity         | `frontend/src/hooks/useSourceIdentityGateUi.js`                        |
| composizione principale                  | `frontend/src/App.jsx`                                                 |
| stato persistenza globale                | `frontend/src/utils/persistenceViewState.js`                           |
| pagina Market Reactions                  | `frontend/src/components/MarketReactionsPage.jsx`                      |
| helper Market Reactions                  | `frontend/src/components/marketReactions/marketReactionViewModel.js`   |
| card Exchange → Field                    | `frontend/src/components/marketReactions/MarketLedObservationCard.jsx` |
| card Field → Exchange                    | `frontend/src/components/marketReactions/FieldLedReactionCard.jsx`     |

---

## 20.3 Superficie di verifica esistente

I test direttamente collegati a questo perimetro includono:

```txt
frontend/src/hooks/useLiveTrackingActions.test.mjs
frontend/src/hooks/useDashboardBootstrapState.test.mjs
frontend/src/hooks/useMatchPolling.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/hooks/useMarketReactionEvidence.test.mjs
frontend/src/hooks/pollingLifecycle.test.mjs
frontend/src/hooks/useSourceIdentityGateUi.test.mjs
frontend/src/components/marketReactions/marketReactionViewModel.test.mjs
```

La superficie copre in particolare:

- requisito del `trackingSessionId` nello Start;
- isolamento del bootstrap rispetto a una sessione precedente;
- classificazione SofaScore di `404` e `409 persistence_integrity`;
- timestamp e fallback `latest → timeline` di Betfair;
- normalizzazione di Evidence con `persistenceComplete`, `sources` e `integrity`;
- abort della richiesta precedente al cambio evento;
- rifiuto di una risposta tardiva appartenente alla sessione precedente;
- stop/resume del polling SofaScore senza duplicare la catena corrente;
- comportamento Source Identity sotto cambio evento e StrictMode;
- verifica della conferma Source Identity rispetto al `trackingSessionId`;
- disponibilità branch Market Reactions basata strettamente su `available === true`;
- mapping del source event Market e disclaimer di non causalità.

---

## 20.4 Confini del documento

Questo registro descrive il comportamento frontend corrente di sessione, polling e presentazione Market Reactions.

Restano fuori dal suo perimetro:

- implementazione interna del tracking backend;
- writer e recovery delle timeline persistite;
- costruzione server-side di Match Evidence e Market Reaction Evidence;
- calcoli di strategia, segnali, edge o raccomandazioni;
- interpretazioni causali degli eventi osservati;
- redesign visuale generale e responsive completo;
- dettagli interni di journal, filesystem e persistenza non necessari alla rappresentazione frontend.

---
