> **Parte 5 di 7 — Frontend e session shell**
> Session controller, Start/Stop, polling, integrity UI, Source Identity, Market Reactions UI e stato statico.
> [Indice](../03-audit-codice.md) · [Parte 4](04-evidence-market-reactions.md) · [Parte 6](06-validazione-e-test.md)

## 21. Frontend e session shell

La frontend live session shell comprende configurazione della sessione, Start/Stop, bootstrap della dashboard, polling SofaScore e Betfair, polling Evidence e Source Identity, propagazione della persistence integrity, indicatori di connessione e health, Market Reactions UI e comportamento della shell quando il tracking non è attivo.

### Ambito

Il frontend agisce come consumer e coordinatore dei contratti live esposti dal backend. La session shell comprende:

- configurazione corrente e configurazione confermata della sessione;
- transizione locale fra pannello di avvio e session shell;
- comando Start e comando Stop consumati dal frontend;
- attivazione e disattivazione dei poller;
- protezione delle richieste asincrone rispetto al ciclo di vita dei poller;
- presentazione di Source Identity, persistence integrity e Betfair health;
- composizione del view model della dashboard;
- consumo e presentazione di Market Reactions.

L’implementazione interna di tracking, persistenza, recovery, Evidence e classificazione Betfair health resta lato backend; nella session shell entrano soltanto i contratti consumati e i relativi effetti sulla UI.

### Separazione dei domini di stato

Nel runtime frontend restano distinti quattro domini:

```txt
Source Identity live
Evidence read-only
persistence integrity
Betfair health
```

Questi domini arrivano da percorsi diversi e non vengono ricostruiti l’uno dall’altro.

| Dominio               | Sorgente frontend                                | Uso principale                                    |
| --------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Source Identity live  | `GET /api/match/:eventId/source-identity-status` | gate, waiting state, conferma manuale, mismatch   |
| Evidence              | `GET /api/evidence/:eventId/latest`              | Market Reactions e metadata associati             |
| Persistence integrity | payload SofaScore, Betfair ed Evidence           | stato aggregato di affidabilità della persistenza |
| Betfair health        | payload Betfair                                  | TopBar, toast, audio e Betfair card               |

### Configurazione della sessione

`useAnalysisSessionState(...)` mantiene due insiemi di valori:

```txt
input correnti
→ matchUrl
→ betfairUrl
→ betfairGraphUrls
→ betfairMode
→ chromeProfilePath
→ cdpUrl

configurazione confermata
→ confirmedUrl
→ confirmedBetfairUrl
→ confirmedBetfairGraphUrls
→ confirmedBetfairMode
→ confirmedChromeProfilePath
→ confirmedCdpUrl
```

La configurazione confermata non viene applicata all’inizio del click Start. Viene applicata soltanto dopo una risposta Start considerata valida da `useLiveTrackingActions(...)`.

`clearConfirmedSession()` svuota i riferimenti confermati alla sessione, senza cancellare gli input correnti del form.

### Start della live session

L’avvio passa attraverso:

```txt
StartAnalysisPanel
→ useLiveTrackingActions.handleSearch(...)
→ liveSessionApi.startMatchTracking(...)
→ POST /api/match/track
```

Prima della richiesta il frontend:

```txt
reset Source Identity UI
activeView = overview
sessionShellVisible = true
sessionActive = false
trackingSessionId = null
startTrackingError = null
trackingStopped = false
stopSofaStatus = ""
```

La shell può quindi essere visibile durante lo Start, ma la sessione non è ancora attiva e i poller live non ricevono ancora la configurazione confermata.

`startMatchTracking(...)` accetta la risposta soltanto quando:

```txt
HTTP response.ok = true
payload.ok = true
```

`useLiveTrackingActions(...)` richiede inoltre un `trackingSessionId` stringa non vuoto. Se manca, lo Start viene trattato come fallito.

Quando la risposta è accettata:

```txt
applySearchSession(...)
trackingSessionId = payload.trackingSessionId
sessionActive = true
beginDashboardBootstrap(trackingSessionId)
```

Il backend restituisce sia `eventId` sia `trackingSessionId`. Nel frontend, `trackingSessionId` viene letto dalla risposta Start, mentre l’`eventId` usato successivamente da `App.jsx` viene ricavato da `confirmedUrl` tramite `getSofaEventId(...)`.

In caso di errore Start:

```txt
resetDashboardBootstrap()
clearConfirmedSession()
sessionActive = false
trackingSessionId = null
sessionShellVisible = false
startTrackingError = <codice errore>
```

Il frontend torna quindi al pannello iniziale senza attivare i poller con la configurazione richiesta.

### Bootstrap della dashboard

`useDashboardBootstrapState(...)` separa l’accettazione della sessione dalla visualizzazione del contenuto dashboard.

Il bootstrap viene associato al `trackingSessionId` accettato. Il contenuto viene marcato pronto soltanto quando, per quella stessa sessione:

```txt
sessionActive = true
trackingSessionId presente
bootstrapSessionId === trackingSessionId
è stato osservato un reset del backendData
backendData è poi diventato disponibile
```

Questa sequenza evita di considerare pronto, per una nuova sessione, un dato dashboard rimasto dal ciclo precedente.

Finché `dashboardContentReady` non è vero o manca `dashboardData`, `App.jsx` mantiene la shell ma mostra `SourceIdentityGateWaitingScreen` al posto della dashboard operativa.

### Identità usata dai poller

In `App.jsx`:

```txt
sofaEventId = getSofaEventId(confirmedUrl)
```

e l’attivazione dei consumer live è subordinata principalmente a `sessionActive`.

La relazione effettiva è:

| Consumer             | Condizione fornita da `App.jsx`                                                 |
| -------------------- | ------------------------------------------------------------------------------- |
| SofaScore            | `sessionActive ? confirmedUrl : ""` e `sessionActive ? sofaEventId : ""`        |
| Betfair              | `sessionActive ? confirmedBetfairUrl : ""` e `sessionActive ? sofaEventId : ""` |
| Evidence             | `sessionActive ? sofaEventId : ""`                                              |
| Source Identity Gate | `sofaEventId`, con `enabled: sessionActive`                                     |

Betfair resta inattivo quando non esiste una URL Betfair confermata, perché `useBetfairJson(...)` richiede sia URL sia `sofaEventId`.

Evidence è montato a livello applicativo e riceve l’`eventId` per tutta la durata della sessione attiva; il suo polling non dipende dalla vista `market-reactions` selezionata.

Source Identity Gate è anch’esso applicativo. Il polling viene abilitato da `sessionActive`; la presentazione UI usa separatamente `hasBetfairUrl` per distinguere il caso in cui Source Identity non sia necessaria.

### Modello comune dei poller live

`useMatchPolling(...)`, `useBetfairJson(...)`, `useMarketReactionEvidence(...)` e `useSourceIdentityGateStatus(...)` implementano una protezione esplicita del ciclo asincrono mediante combinazioni dello stesso insieme di primitive:

```txt
generation/version della catena di polling
requestId monotono
AbortController
riferimento alla request attiva
una request attiva per generation
controllo generation prima degli update
cleanup di timeout e request in flight
```

Quando cambia l’identità che abilita un hook, o l’hook viene disabilitato, la generation corrente viene invalidata e la request attiva viene abortita.

Le nuove iterazioni vengono pianificate con `setTimeout`; prima di riattivare il ciclo viene verificato che la generation sia ancora quella corrente.

Questa protezione appartiene ai singoli hook. `App.jsx` coordina la loro attivazione attraverso `sessionActive` e gli identificatori/configurazioni confermati.

### Polling SofaScore

`useMatchPolling(...)` legge:

```txt
GET /api/match/:eventId/json
```

In `App.jsx` l’intervallo configurato è `2500 ms`.

Il payload viene normalizzato in:

```txt
snapshot
localContext
timeline
integrity
```

Lo stato esposto comprende:

```txt
data
lastKnownData
lastUpdate / sourceUpdatedAt
fetchedAt
isPolling
serverStatus
readStatus
integrity
error
```

Gli stati HTTP rilevanti sono trattati così:

| Risposta                          | Effetto frontend                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `200` valido                      | `readStatus = current`, `serverStatus = ok`                                                                    |
| `404`                             | `serverStatus = waiting`, `readStatus = waiting`, nessun errore utente                                         |
| `409` con `persistence_integrity` | `serverStatus = partial_persistence` oppure `recovery_failed`, `readStatus = degraded`, `integrity` conservata |
| altri errori                      | `serverStatus = error`, `readStatus = error`                                                                   |

Su una lettura non corrente `data` viene azzerato. `lastKnownData` viene aggiornato soltanto su letture riuscite, ma viene anch’esso azzerato quando cambia o scompare l’`eventId` del poller.

### Polling Betfair

`useBetfairJson(...)` prova prima:

```txt
GET /api/betfair/:eventId/latest
```

con gli eventuali parametri `mode` e `cdpUrl`.

Se `/latest` risponde `404`, lo stesso ciclo prova:

```txt
GET /api/betfair/:eventId/json
```

come fallback timeline.

In `App.jsx` l’intervallo configurato è `5000 ms`.

Il read model Betfair mantiene separati:

```txt
data
health
moneyFlowHistory
sourceUpdatedAt
fetchedAt
integrity
source
```

Quando la sorgente è `/latest`, health e Money Flow possono essere popolati dal relativo payload. Nel fallback timeline vengono invece impostati a `null`, evitando di associare al fallback health o history non provenienti da quella lettura.

Un `409` con body `persistence_integrity` porta il poller a:

```txt
data = null
health = null
moneyFlowHistory = null
integrity = payload.integrity
readStatus = degraded
```

Gli altri errori producono `waiting` per `404` oppure `error` per gli altri status.

`lastKnownData` e `lastKnownMoneyFlowHistory` consentono alla Betfair card di mostrare un fallback soltanto in condizioni `degraded` o `error` della lettura corrente. Questi valori vengono azzerati quando il poller viene riconfigurato con URL o `eventId` non attivi.

### Betfair health

Il frontend non riclassifica semanticamente il dominio health ricevuto dal backend. Il valore consumato è:

```txt
betfairData?.health
oppure
health esposta da useBetfairJson(...)
```

`useBetfairHealthAlerts(...)` gestisce transizioni, toast e audio. Il toast di alert dipende dalla transizione `to-red`; l'audio, quando abilitato, viene invece ripetuto finché resta attivo un alert Betfair `red` riconosciuto come scrape/login alert.

`TopBar.jsx` presenta gli stati health come:

```txt
green    → OK
yellow   → STALE
red      → BETFAIR ALERT
finished → FINISHED
altro    → UNKNOWN
```

e rende inoltre le transizioni `to-red` e `recovered`.

`BetfairDepthCard.jsx` usa lo stesso health per banner, dettagli diagnostici e stato del feed. L’associazione fra runner e serie Money Flow avviene tramite `selectionId` convertito a stringa; il nome del runner non è usato come chiave della serie.

### Evidence e Market Reactions data source

`App.jsx` monta una sola istanza di:

```txt
useMarketReactionEvidence(...)
```

Il risultato viene passato a `MarketReactionsPage`. La pagina non crea un secondo poller.

L’endpoint letto è:

```txt
GET /api/evidence/:eventId/latest
```

Il modello normalizzato conserva:

```txt
latest
evidence = latest.marketReactionEvidence
sources
integrity
persistenceComplete = latest.dataQuality.persistenceComplete
sourceUpdatedAt = latest.metadata.updatedAt
fetchedAt
```

Gli stati di lettura sono:

| Condizione                                            | `readStatus` |
| ----------------------------------------------------- | ------------ |
| nessun `eventId`                                      | `inactive`   |
| attesa / payload non ancora disponibile               | `waiting`    |
| payload valido con `persistenceComplete !== false`    | `current`    |
| `persistenceComplete === false` o `404` con integrity | `degraded`   |
| errore HTTP non gestito come attesa o errore fetch    | `error`      |

Il polling Evidence è un consumer read-only del Match Evidence Snapshot per il rendering. Nel percorso montato da `App.jsx`, la conferma Source Identity della UI non viene delegata a `MarketReactionsPage`.

`useMarketReactionEvidence(...)` esporta ancora anche metodi `confirmSourceIdentity` e `revokeSourceIdentityConfirmation`, ma `App.jsx` non li usa nella conferma globale.

### Market Reactions UI

`MarketReactionsPage.jsx` riceve dal livello applicativo:

```txt
evidence
loading
error
reasons
integrity
sources
persistenceComplete
readStatus
lastUpdate
isPolling
refresh
```

Le card presentazionali usano `marketReactionViewModel.js` per leggere il contratto Evidence.

La disponibilità di un ramo è vera soltanto quando:

```txt
evidence.available === true
```

Per il lato market source il view model usa:

```txt
runner
observedFlowAmount
absoluteFlowTier
relativeFlowTier
direction
flowAmbiguous
```

La presenza del disclaimer di causalità considera `summary.causalityClaimed === false` e anche `causalityClaimed === false` al livello del ramo.

Questa area presenta Evidence già costruita; non ricalcola la causalità o l’Evidence backend.

### Source Identity Gate

Lo stato globale Source Identity viene letto tramite:

```txt
GET /api/match/:eventId/source-identity-status
```

`useSourceIdentityGateStatus(...)` usa per default un intervallo di `1000 ms`, con generation, `requestId`, `AbortController`, una request attiva e cleanup della catena.

La presentazione distingue:

```txt
tracking stopped
errore bootstrap/status
nessuno status con Betfair configurato
nessuno status senza Betfair
collecting
pending
recording + aligned
not-applicable
mismatch
```

Nel caso `pending`, la conferma può essere aperta quando lo status contiene esattamente due nomi SofaScore e due runner Betfair e `sourceIdentity.status === "pending"`.

La chiave locale usata per stabilire se riaprire automaticamente la modale pending è composta da:

```txt
sofaEventId
nomi SofaScore
nomi Betfair
```

La conferma globale viene inviata da `useSourceIdentityGateUi(...)` tramite:

```txt
POST /api/evidence/:eventId/source-identity/confirm
```

con:

```txt
selectedPairs
confirmationText
trackingSessionId letto dallo status Source Identity corrente
```

Dopo la conferma il gate viene riletto. La UI considera conclusa la conferma soltanto se il nuovo status è:

```txt
phase = recording
sourceIdentity.status = aligned
status.trackingSessionId = trackingSessionId della conferma
```

Quando il gate entra in `mismatch`, la UI:

```txt
mostra il toast di mismatch
ferma il poller Sofa
svuota la configurazione confermata
sessionActive = false
trackingSessionId = null
chiude la modale
nasconde la session shell
torna a overview
resetta il bootstrap
```

Questo ramo esegue il teardown dello stato frontend; nel codice del hook non viene invocato `POST /api/match/stop`.

### Persistence integrity nel frontend

SofaScore, Betfair ed Evidence espongono separatamente la loro informazione `integrity`.

`App.jsx` le aggrega con:

```txt
buildPersistenceViewState({
    sessionActive,
    dashboardReady,
    sofaIntegrity,
    betfairIntegrity,
    evidenceIntegrity,
    evidencePersistenceComplete,
    sofaError,
    betfairError,
    evidenceError
})
```

Lo stato aggregato è:

| Condizione                                                                                                       | Stato      |
| ---------------------------------------------------------------------------------------------------------------- | ---------- |
| sessione non attiva                                                                                              | `inactive` |
| integrity `partial_persistence`, `recovery_failed` o `degraded`, oppure Evidence `persistenceComplete === false` | `degraded` |
| errore Sofa, Betfair o Evidence                                                                                  | `error`    |
| dashboard non pronta                                                                                             | `waiting`  |
| altrimenti                                                                                                       | `current`  |

`DashboardWorkspace.jsx` mostra un banner globale quando lo stato aggregato è `degraded` o `error`.

`OverviewDashboard.jsx` passa lo stesso stato a `BetfairDepthCard.jsx`, che lo combina con `readStatus`, stato del polling e `trackingStopped` per produrre le label locali della card.

L’aggregatore non modifica le strutture di integrity provenienti dalle sorgenti; le conserva nell’array `integrity` del risultato quando sono presenti.

### Dashboard view model e dati correnti

`useDashboardViewModel(...)` mappa `backendData` nel modello dashboard tramite `mapBackendDataToDashboard(...)`.

Quando esiste `backendData`:

```txt
dashboardData = mapped backend data
lastKnownDashboardData = stesso mapped data
```

Quando `backendData` diventa `null`:

```txt
dashboardData = null
```

`lastKnownDashboardData` resta nello stato del view model, ma `DashboardWorkspace` non lo usa come sostituto del `dashboardData` corrente.

La history Betfair esposta dal view model viene normalizzata alla forma:

```txt
{ series: [] }
```

quando non è disponibile una serie valida.

### Stop Live Tracking

Lo Stop operativo usa:

```txt
OverviewDashboard
→ useLiveTrackingActions.handleStopLiveTracking()
→ liveSessionApi.stopMatchTracking(...)
→ POST /api/match/stop
```

`stopMatchTracking(...)` considera riuscita la chiamata soltanto quando la risposta HTTP è `ok` e il payload contiene `ok: true`.

Il backend costruisce `ok` combinando:

```txt
stop dei tracker
cleanup fisico dei processi Python di tracking
remaining === 0
```

Il payload pubblico di Stop contiene inoltre:

```txt
eventId
stopped
scope = all-live-tracking
pythonCleanup
```

Dopo uno Stop accettato, il frontend:

```txt
stopSofaPolling()
sessionActive = false
trackingSessionId = null
trackingStopped = true
sessionShellVisible resta true
```

Poiché `App.jsx` passa URL/`eventId` vuoti ai poller quando `sessionActive` è falso, SofaScore, Betfair ed Evidence vengono riconfigurati come inattivi e Source Identity Gate viene disabilitato.

La shell resta montata. Quando i dati correnti vengono rimossi dagli hook e `dashboardData` non è più disponibile, `shouldShowDashboard` diventa falso e il contenuto operativo viene sostituito da `SourceIdentityGateWaitingScreen`. Nella sidebar, `SourceIdentityGateIndicator` deriva dalla presentazione lo stato `Tracking fermo`; la waiting screen centrale, nel ramo non-error e non-pending, mostra invece il testo generico `Verifico le fonti` / `Attendo i primi aggiornamenti di SofaScore e Betfair.`.

Lo Stop Live Tracking non chiude quindi automaticamente la shell né ritorna al form dei link.

### Stop e ritorno al pannello link

Il percorso usato per abbandonare la shell è separato:

```txt
stopAndReturnToLinks()
→ POST /api/match/stop
→ stopSofaPolling()
→ clearConfirmedSession()
→ sessionActive = false
→ trackingSessionId = null
→ sessionShellVisible = false
→ activeView = overview
→ trackingStopped = true
→ resetDashboardBootstrap()
```

Questo percorso viene usato, tra l’altro, dal ritorno ai link durante il waiting flow e dal rifiuto della conferma Source Identity.

### Indicatori di connessione

`DashboardWorkspace.jsx` costruisce le connessioni tramite `buildDashboardConnections(...)`.

Per SofaScore, la funzione considera:

```txt
sourceIdentityGateStatus
sofaReadStatus
sofaServerStatus
presenza di backendData
```

e può produrre `waiting`, `connected`, `degraded` o `disconnected`.

Per Betfair, il risultato include:

```txt
ok
status derivato da betfairReadStatus
lastUpdate
health
transition
audioAlertEnabled
onToggleAudioAlert
```

`TopBar.jsx` usa il modello `connections` per lo stato SofaScore e per Betfair health.

La card di stato in fondo a `Sidebar.jsx` è invece separata da `buildDashboardConnections(...)`: rende `Dashboard engine active` quando `betfairHealth.status === "red"` e `Live Engine Active` negli altri casi.

La TopBar mantiene inoltre un indicatore circolare verde accanto al proprio campo `Ultimo aggiornamento`; il valore di quel campo proviene dal `topBar` della dashboard quando disponibile e, nel fallback di `DashboardWorkspace`, da `sofaLastUpdate` oppure `—`. Questi elementi sono parte della presentazione corrente e non costituiscono una seconda authority di sessione.

### Preflight

`usePreflightChecks(...)` gestisce cinque famiglie di controllo:

```txt
backend
cdp
sofa
betfair
graphs
```

Gli stati memorizzati in `App.jsx` hanno la forma:

```txt
{
    status,
    message
}
```

I controlli possono essere eseguiti singolarmente oppure in sequenza tramite `runAllChecks()`.

La sequenza completa è:

```txt
backend
→ CDP solo se betfairMode === "cdp"
→ SofaScore URL
→ Betfair URL
→ graph URLs
```

In modalità persistent il check CDP viene riportato a `idle` con messaggio che ne indica la non necessità.

I risultati Preflight non sono usati come gate del comando Start: il pulsante `Link Accounts & Start` chiama direttamente `handleSearch(...)` ed è disabilitato soltanto quando manca `matchUrl` oppure `sofaLoading` è vero.

I preflight usano direttamente gli input catturati dalle closure dell’hook e aggiornano lo stato con `setChecks(...)`. Questi check non usano generation, `requestId`, `AbortController` o un fingerprint persistito dell’input verificato.

### Navigazione e ownership delle viste

La sidebar montata espone due viste:

```txt
Overview
Market Reactions
```

`App.jsx` mantiene `activeView` e decide quale contenuto renderizzare.

`Overview` contiene il contesto partita, le statistiche, la Betfair depth/Money Flow, il placeholder TOT e il comando Stop.

`Market Reactions` riceve il modello Evidence dall’unico hook applicativo.

La sidebar non monta voci Strategy separate.

### Invarianti del wiring

Il comportamento della session shell può essere riassunto nelle seguenti invarianti:

```txt
1. La shell può comparire durante Start, ma sessionActive resta false fino a Start accettato.

2. trackingSessionId deve provenire da una risposta Start valida e non vuota.

3. L’eventId consumato dal frontend viene ricavato dalla confirmedUrl SofaScore.

4. I poller live vengono alimentati soltanto quando sessionActive abilita i relativi input.

5. Betfair richiede anche una URL Betfair confermata.

6. Evidence ha ownership applicativa unica e polla per tutta la sessione attiva.

7. Source Identity live viene letto dal proprio endpoint e resta distinto da Evidence.

8. Le request dei quattro poller principali sono protette da generation e AbortController.

9. Persistence integrity viene mantenuta per sorgente e aggregata in uno stato UI comune.

10. Market Reactions presenta Evidence già costruita e usa available === true come criterio di disponibilità.

11. Lo Stop Live Tracking rende la sessione inattiva ma mantiene montata la shell.

12. Il ritorno al pannello link è un percorso distinto che chiude la shell e cancella la configurazione confermata.
```

### Confini con il backend

La session shell non implementa direttamente:

- come `matchTracker` raccoglie o persiste i dati;
- come vengono scritte timeline, history o journal;
- come funziona la recovery della persistence;
- come viene costruita semanticamente Market Reaction Evidence;
- come il backend decide Source Identity;
- come il backend classifica Betfair health;
- come vengono terminati internamente i processi Python.

La session shell consuma gli output pubblici del backend e li traduce in stato e presentazione frontend.
