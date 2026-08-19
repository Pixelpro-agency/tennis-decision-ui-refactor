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

### FRONTEND-005 — I vecchi loop possono ricrearsi dopo cleanup

**Stato:** `RISOLTO NEL FINDING SPECIFICO`
**Classificazione storica:** `BUG CONFERMATO`
**Priorità storica:** critica

**Problema originario**

Il cleanup dei poller poteva cancellare il timeout noto senza impedire a una fetch già in corso di completarsi e programmare una nuova iterazione. Il vecchio e il nuovo ciclo condividevano inoltre stato di polling, per cui un nuovo Start poteva riabilitare una closure appartenente al ciclo precedente.

**Stato ed evidenza corrente**

Il finding specifico è risolto: i reader live usano generation locale, `requestId`, `AbortController`, cleanup del timeout e guardie prima di aggiornare lo stato o riprogrammare il fetch. Una completion appartenente a una generation precedente non ricrea quindi il vecchio loop.

**Responsabilità tecnica collegata**

`IMPL-026 — Polling runtime session-scoped` resta una responsabilità più ampia e non viene dichiarata completata: i poller conservano lifecycle separati e non condividono ancora una primitive session-scoped unica.

**Criterio di chiusura**

FRONTEND-005 resta chiuso nel finding specifico finché cleanup o cambio sessione invalidano la catena precedente e una completion tardiva non può creare nuovi timer o fetch. La convergenza verso un'autorità comune dei poller resta separata in `IMPL-026`.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### FRONTEND-006 — Start e Stop concorrenti non serializzati

**Stato:** `CONFERMATO`
**Classificazione storica:** `BUG CONFERMATO`
**Priorità storica:** alta

**Problema originario**

Start e Stop potevano sovrapporsi senza un'autorità di comando dedicata. Lo stato frontend non costituiva un lock del comando e non esistevano command ID, generation del comando, deduplicazione o arbitraggio capace di rendere stale una risposta concorrente.

**Stato ed evidenza corrente**

Il finding resta confermato. Il frontend possiede `trackingSessionId` come identità della sessione accettata, ma non sono presenti `startCommandId`, `stopCommandId` o un arbitro Start/Stop equivalente. Una serializzazione dei comandi non viene quindi dichiarata come già implementata.

**Responsabilità tecnica collegata**

Il lifecycle della sessione è collegato a `IMPL-025 — Frontend live-session controller`, ma FRONTEND-006 resta un finding autonomo e non viene assorbito dall'IMPL.

**Criterio di chiusura**

Il finding potrà essere chiuso soltanto quando richieste Start/Stop concorrenti avranno un'autorità esplicita e una risposta appartenente a un comando superato non potrà modificare lo stato della sessione corrente.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### FRONTEND-007 — Stop Live Tracking non crea una modalità statica reale

**Stato:** `PARZIALMENTE RISOLTO`
**Classificazione storica:** `BUG CONFERMATO`
**Priorità storica:** critica

**Problema originario**

Lo Stop Live Tracking non rappresentava in modo coerente la cessazione di tutti i consumer live e non definiva una modalità statica esplicita capace di preservare uno snapshot verificato senza continuare a presentarlo come dato corrente.

**Stato ed evidenza corrente**

La parte relativa ai consumer live è stata corretta: quando `sessionActive` diventa `false`, `App.jsx` rimuove gli input attivi e SofaScore, Betfair, Evidence e Source Identity vengono disabilitati. Resta però assente una vera modalità `stopped_static` o equivalente con snapshot frozen preservato come stato esplicito.

**Responsabilità tecnica collegata**

Il lifecycle Stop e lo stato della sessione sono collegati a `IMPL-025`, senza trasformare FRONTEND-007 in un alias dell'IMPL.

**Criterio di chiusura**

Il finding resta parziale finché lo Stop non dispone di un contratto esplicito per lo stato statico post-Stop e per la distinzione fra snapshot frozen, dato current e consumer live disabilitati.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### FRONTEND-008 — Indicatori live derivati dalla presenza del dato

**Stato:** `CONFERMATO`
**Classificazione storica:** `BUG CONFERMATO`
**Priorità storica:** alta

**Problema originario**

Alcuni indicatori live potevano derivare lo stato dalla semplice presenza di dati o da segnali presentazionali, producendo una semantica più forte dell'autorità reale della sessione e dei reader.

**Stato ed evidenza corrente**

Una parte del frontend usa oggi `readStatus` e distingue `current`, `waiting`, `degraded` ed `error`. Restano però indicatori globali e componenti di shell che non derivano integralmente da una state machine di sessione autoritativa; la presenza di un dato non viene quindi trattata come prova generale di sessione live o polling attivo.

**Responsabilità tecnica collegata**

Il finding riguarda session state e presentazione. Questa card non crea una nuova IMPL e non dichiara completa una state machine globale che il progetto non possiede.

**Criterio di chiusura**

FRONTEND-008 resta aperto finché tutti gli indicatori che dichiarano stato live, connected o engine active non derivano da authority e read state espliciti, anziché dalla sola disponibilità di payload o da euristiche locali.

**Riferimenti essenziali**

- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`
- `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### FRONTEND-009 — Market Reactions UI promuove rami unavailable e usa campi errati

**Stato:** `PARZIALMENTE RISOLTO`
**Classificazione storica:** `BUG CONFERMATO`
**Priorità storica:** alta

**Problema originario**

La UI Market Reactions poteva presentare come osservabili rami non disponibili e consumare campi non coerenti con lo schema Evidence effettivo, confondendo availability, osservazione e interpretazione del risultato.

**Stato ed evidenza corrente**

La parte principale è stata corretta: il view model usa `available === true`, gestisce il source market e gli stati base di lettura e mantiene il disclaimer di non causalità. Resta però assente un contratto frontend unico per `provisional/final`, stato delle finestre e stato integrity/availability uniforme.

**Responsabilità tecnica collegata**

La responsabilità tecnica più ampia resta `IMPL-027 — Market Reactions frontend view model`, che non viene dichiarata completata da questa card.

**Criterio di chiusura**

Il finding resta parziale finché pagina e card non consumano un contratto frontend coerente per availability, window state, provisional/final e integrity senza ricostruire semantiche non presenti nel payload.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### FRONTEND-010 — Modale pending non legata al vero contesto Source Identity

**Stato:** `PARZIALMENTE RISOLTO`
**Classificazione storica:** `BUG CONFERMATO`
**Priorità storica:** alta

**Problema originario**

La modale pending poteva identificare il contesto tramite elementi presentazionali come evento e nomi, senza un'identità opaca sufficiente a distinguere revisioni o nuovi contesti Source Identity con gli stessi partecipanti.

**Stato ed evidenza corrente**

Conferma e refresh sono oggi vincolati al `trackingSessionId`, e la UI richiede che lo status riletto appartenga alla stessa sessione prima di considerare conclusa la conferma. La chiave locale usata per la pending modal resta però basata principalmente su `sofaEventId` e nomi; non esistono ancora `sourceIdentityContextId` o revision opachi.

**Responsabilità tecnica collegata**

Il finding resta nel confine session/context di Source Identity e usa gli owner già esistenti; non viene creata una nuova IMPL.

**Criterio di chiusura**

FRONTEND-010 resta parziale finché un nuovo contesto Source Identity con gli stessi nomi può essere distinto in modo autoritativo tramite identità o revisione opaca, senza affidarsi soltanto a event ID e label.

**Riferimenti essenziali**

- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `docs/tennis-decision-ui/modules/evidence/02-source-identity.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### FRONTEND-011 — Risultati Preflight non legati agli input verificati

**Stato:** `CONFERMATO`
**Classificazione storica:** `BUG CONFERMATO`
**Priorità storica:** medio-alta

**Problema originario**

Un risultato Preflight poteva restare visibile dopo la modifica dell'input a cui si riferiva, perché lo stato non conservava un fingerprint o una revisione dell'input verificato e le response asincrone non erano legate a una request authority sufficiente.

**Stato ed evidenza corrente**

Il finding resta confermato. I check conservano principalmente `status` e `message`; non possiedono una generation/request identity analoga ai poller, un fingerprint persistito dell'input verificato o invalidazione automatica completa quando l'input cambia.

**Responsabilità tecnica collegata**

Questa card non crea una nuova IMPL. Il finding resta autonomo nel confine Preflight e session configuration.

**Criterio di chiusura**

FRONTEND-011 potrà essere chiuso quando ogni risultato Preflight sarà associato allo snapshot/revisione degli input verificati e una response stale non potrà aggiornare o mantenere valido lo stato relativo a input ormai diversi.

**Riferimenti essenziali**

- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### FRONTEND-012 — Layout responsive strutturalmente assente

**Stato:** `LIMITE CONFERMATO`
**Classificazione storica:** `LIMITE NOTO + STRUTTURA ASSENTE`
**Priorità storica:** dopo la robustezza

**Problema originario**

La shell frontend non possedeva un contratto responsive strutturale end-to-end per layout, sidebar, TopBar e principali superfici applicative.

**Stato ed evidenza corrente**

Il limite resta confermato. Esistono breakpoint e adattamenti locali, ma non è documentata né implementata una strategia responsive completa che governi insieme shell, sidebar e TopBar sui principali viewport.

**Responsabilità tecnica collegata**

Il responsive resta una task separata. Questa owner card non introduce una nuova IMPL e non trasforma la presente micro-task in implementazione UI.

**Criterio di chiusura**

FRONTEND-012 resta aperto finché una task dedicata non definisce e verifica il comportamento responsive end-to-end almeno sui viewport previsti, senza dedurre completezza dalla sola presenza di breakpoint locali.

**Riferimenti essenziali**

- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-044 — Start concorrenti e risposta tardiva

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Due comandi Start concorrenti non devono permettere alla risposta più vecchia di diventare authority della sessione dopo che un nuovo Start ha sostituito la richiesta precedente.

Caso minimo:

```txt
Start A in flight
→ Start B
→ B diventa richiesta corrente
→ risposta A arriva dopo
→ A ignorata
→ soltanto B può diventare sessione accettata
```

**Evidenza/copertura corrente**

Il frontend separa già configurazione richiesta e configurazione confermata e attiva `sessionActive` soltanto dopo una risposta Start valida con `trackingSessionId`.

Questa protezione non equivale però alla regressione richiesta su due Start concorrenti con risposte invertite.

**Gap residuo**

Manca una regressione deterministica che dimostri che uno Start precedente, completato dopo quello corrente, non può:

- applicare una configurazione stale;
- sostituire `trackingSessionId`;
- riattivare una sessione superata;
- avviare bootstrap/poller della richiesta vecchia.

**Owner tecnico collegato**

`IMPL-025 — Frontend live-session controller`.

**Criterio di chiusura**

Chiudere soltanto quando una regressione Start A/Start B con response invertite dimostra che soltanto il comando corrente può acquisire l'authority frontend.

**Riferimenti essenziali**

- `frontend/src/hooks/useLiveTrackingActions.js`
- `frontend/src/hooks/useLiveTrackingActions.test.mjs`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-045 — Start fallito o ambiguo e cleanup compensativo

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Uno Start fallito o con esito ambiguo non deve lasciare una sessione frontend apparentemente attiva né consumer live associati a una configurazione non confermata.

Caso minimo:

```txt
sessione richiesta
→ Start fallisce oppure il client non può determinare con certezza l'esito
→ authority locale rimossa
→ poller fermi
→ eventuale cleanup compensativo
→ errore bounded visibile
```

**Evidenza/copertura corrente**

Il normale failure path di Start già:

- resetta il bootstrap;
- pulisce la configurazione confermata;
- rende `sessionActive=false`;
- azzera `trackingSessionId`;
- chiude la shell;
- conserva un errore frontend bounded.

Questa copertura non chiude il caso ambiguo in cui il backend potrebbe avere accettato la sessione ma il client non possiede una conferma affidabile dell'esito.

**Gap residuo**

Manca una regressione del caso ambiguo con eventuale cleanup compensativo della sessione backend e verifica che nessun poller resti attivo.

**Owner tecnico collegato**

`IMPL-025 — Frontend live-session controller`.

**Criterio di chiusura**

Chiudere soltanto quando failure certa ed esito ambiguo sono entrambi coperti e nessuna authority/poller può sopravvivere a una sessione non confermata.

**Riferimenti essenziali**

- `frontend/src/hooks/useLiveTrackingActions.js`
- `frontend/src/hooks/useLiveTrackingActions.test.mjs`
- `frontend/src/App.jsx`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-046 — Response Sofa/Betfair vecchie o fuori ordine

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Una response appartenente a una generation/evento/request precedente non deve poter aggiornare lo stato corrente dopo una riconfigurazione del poller.

Caso minimo:

```txt
request A
→ switch al contesto B
→ response B accettata
→ response A completa dopo
→ nessun setState corrente da A
```

Il contratto deve valere almeno per:

SofaScore
Betfair

**Evidenza/copertura corrente**

I poller possiedono già primitive reali di protezione:

- generation/version;
- `requestId`;
- `AbortController`;
- una request attiva per generation;
- verifica della generation prima degli update;
- cleanup delle request in flight.

Esiste inoltre copertura reale del lifecycle SofaScore contro una response vecchia dopo cambio evento.

Per Betfair esistono abort/invalidation e protezioni di generation, ma non è ancora dimostrato l'intero contratto con una regressione equivalente di delayed old response rispetto allo stato nuovo.

**Gap residuo**

Manca la regressione completa e simmetrica che dimostri per SofaScore e Betfair che una vecchia promise che completa dopo il cambio di contesto non possa sovrascrivere lo stato corrente.

**Owner tecnico collegato**

`IMPL-026 — Polling runtime session-scoped`.

**Criterio di chiusura**

Chiudere soltanto quando il caso response fuori ordine è verificato deterministicamente sui poller richiesti senza dipendere dal solo fatto che `AbortController.abort()` sia stato invocato.

**Riferimenti essenziali**

- `frontend/src/hooks/useMatchPolling.js`
- `frontend/src/hooks/useMatchPolling.test.mjs`
- `frontend/src/hooks/useBetfairJson.js`
- `frontend/src/hooks/useBetfairJson.test.mjs`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-047 — Cleanup durante fetch senza reschedule

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Il cleanup di un poller mentre una fetch è in flight deve impedire sia l'aggiornamento dello stato sia la riattivazione della vecchia catena di polling quando quella fetch completa successivamente.

Caso minimo:

```txt
fetch in flight
→ cleanup
→ vecchia fetch completa comunque
→ nessun setState
→ nessun nuovo timeout
→ nessuna nuova fetch della generation chiusa
```

**Evidenza/copertura corrente**

I poller possiedono già:

- generation invalidation;
- `AbortController`;
- cleanup delle request;
- cleanup dei timeout;
- verifica della generation prima del reschedule.

Queste primitive costituiscono copertura reale ma non equivalgono ancora alla regressione completa del contratto storico.

**Gap residuo**

Manca una regressione che completi deliberatamente una fetch vecchia dopo cleanup e verifichi contemporaneamente:

- nessun update;
- nessun timeout successivo;
- nessuna nuova request della catena disposta.

**Owner tecnico collegato**

`IMPL-026 — Polling runtime session-scoped`.

**Criterio di chiusura**

Chiudere quando il resolve tardivo dopo cleanup non produce alcun effetto osservabile né riattiva il loop.

**Riferimenti essenziali**

- `frontend/src/hooks/useMatchPolling.js`
- `frontend/src/hooks/useBetfairJson.js`
- `frontend/src/hooks/useMarketReactionEvidence.js`
- `frontend/src/hooks/useSourceIdentityGateStatus.js`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-048 — Stop completo: poller off, snapshot frozen e audio fermo

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Uno Stop completo deve produrre uno stato frontend statico e coerente.

Caso minimo:

```txt
Stop accettato
→ SofaScore polling off
→ Betfair polling off
→ Evidence polling off
→ Source Identity Gate polling off
→ ultimo snapshot verificato mantenuto/frozen
→ stato stopped_static
→ audio Betfair fermo
```

**Evidenza/copertura corrente**

Dopo uno Stop accettato il frontend già:

- ferma il polling Sofa esplicitamente;
- imposta `sessionActive=false`;
- azzera `trackingSessionId`;
- imposta `trackingStopped=true`;
- mantiene montata la shell.

Poiché gli input dei consumer dipendono da `sessionActive`, SofaScore, Betfair ed Evidence vengono riconfigurati come inattivi e Source Identity Gate viene disabilitato.

Il comportamento corrente non soddisfa però il contratto completo:

- i dati correnti vengono rimossi dagli hook;
- la dashboard operativa viene sostituita dalla waiting screen;
- non esiste ancora un vero snapshot frozen formalizzato come `stopped_static`;
- il lifecycle audio non è dimostrato come parte atomica dello Stop completo.

**Gap residuo**

Mancano il contratto integrato e la regressione:

```txt
all pollers off
+
snapshot frozen
+
stopped_static
+
audio off
```

**Owner tecnici collegati**

Owner principale dello stato sessione:

`IMPL-025 — Frontend live-session controller`.

Owner del lifecycle poller:

`IMPL-026 — Polling runtime session-scoped`.

**Criterio di chiusura**

Chiudere soltanto quando uno Stop completo lascia una shell statica esplicita con ultimo snapshot verificato, nessun poller attivo e nessun audio live residuo.

**Riferimenti essenziali**

- `frontend/src/App.jsx`
- `frontend/src/hooks/useLiveTrackingActions.js`
- `frontend/src/hooks/useBetfairHealthAlerts.js`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-049 — Stop parziale visibile in UI

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Uno Stop che non completa integralmente il proprio cleanup non deve essere presentato dal frontend come uno Stop completo indistinguibile dal successo.

Caso minimo:

```
Stop richiesto
→ backend restituisce esito incompleto/parziale
→ dettaglio Stop/cleanup resta distinguibile
→ frontend NON dichiara falsamente Stop completo
→ partial failure è rappresentato in modo bounded e osservabile

```

**Evidenza/copertura corrente**

Il backend possiede già un risultato Stop strutturato e il frontend distingue il normale success path dal failure path.

Il failure path frontend viene però ancora ridotto a un errore generico e non esiste una regressione interaction/UI sul cleanup parziale.

**Gap residuo**

Manca una verifica deterministica della rappresentazione UI del partial failure e della distinzione fra Stop completamente riuscito e cleanup incompleto.

**Owner tecnico collegato**

`IMPL-025 — Frontend live-session controller`.

Collegamento semantico anche con `FRONTEND-007`, senza trasformare TEST-049 in un duplicato del finding.

**Criterio di chiusura**

Chiudere soltanto quando un test interaction/UI dimostra che un partial Stop è visibile come tale e non può produrre una falsa rappresentazione di Stop completo.

**Riferimenti essenziali**

- `frontend/src/hooks/useLiveTrackingActions.js`
- `frontend/src/services/liveSessionApi.js`
- `frontend/src/App.jsx`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-050 — Persistence UI locale/globale e snapshot degraded

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Gli stati di persistence integrity devono essere presentati coerentemente in tutte le superfici UI che dichiarano l'affidabilità del dato.

Caso minimo:

```
integrity degraded
→ stato aggregato degraded
→ indicatore globale coerente
→ card locale coerente
→ eventuale superficie modale/sidebar coerente
→ snapshot non presentato come current affidabile

```

Il contratto deve distinguere almeno:

```
partial_persistence
recovery_failed

```

e deve poter mantenere bounded uno stato future/unknown senza promuoverlo arbitrariamente a healthy.

**Evidenza/copertura corrente**

La copertura già presente comprende:

- `persistenceViewState` gestisce `inactive`, `waiting`, `current`, `degraded`, `error`;
- Evidence propaga degraded/integrity;
- `App.jsx` aggrega gli stati;
- esiste una presentazione globale degraded/error;
- alcune card ricevono lo stato persistence.

**Gap residuo**

Non è ancora dimostrato il contratto interaction completo su tutte le superfici locali/globali e sulla semantica degraded/frozen dello snapshot.

**Owner tecnico collegato**

Gli owner frontend esistenti per persistence integrity e presentazione restano invariati; TEST-050 non introduce una nuova IMPL.

**Criterio di chiusura**

Chiudere quando una regressione integrata dimostra che lo stesso stato persistence produce una rappresentazione coerente in tutte le superfici previste e che un dato degraded/frozen non viene presentato come current healthy.

**Riferimenti essenziali**

- `frontend/src/App.jsx`
- `frontend/src/utils/persistenceViewState.js`
- `frontend/src/utils/persistenceViewState.test.mjs`
- `frontend/src/hooks/useMarketReactionEvidence.js`
- `frontend/src/components/DashboardWorkspace.jsx`
- `frontend/src/components/OverviewDashboard.jsx`
- `frontend/src/components/BetfairDepthCard.jsx`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-051 — EventId e trackingSessionId dalla risposta Start

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

L'identità della sessione accettata deve provenire dalla risposta Start autoritativa e deve essere usata coerentemente dai consumer downstream.

Caso minimo:

```
Start accettato
→ response contiene eventId
→ response contiene trackingSessionId
→ trackingSessionId diventa authority della sessione/bootstrap
→ eventId della response diventa authority del match downstream
→ valori derivati dalla request non possono sostituire l'authority restituita

```

**Evidenza/copertura corrente**

La copertura corrente dimostra che:

- `trackingSessionId` viene già letto dalla response Start;
- uno Start senza `trackingSessionId` viene rifiutato;
- il bootstrap usa quel `trackingSessionId`;
- esiste un test mirato di `readTrackingSessionAuthority(...)`.

Resta però il seguente residuo corrente:

```
sofaEventId
=
getSofaEventId(confirmedUrl)

```

quindi l'`eventId` consumato dal frontend non è ancora dimostrato come authority propagata direttamente dalla response Start.

**Gap residuo**

Manca la regressione end-to-end che dimostri entrambe le authority:

```
response.eventId
response.trackingSessionId

```

e il loro uso downstream.

**Owner tecnici collegati**

Owner sessione principale:

`IMPL-025 — Frontend live-session controller`.

Per il confine poller resta pertinente:

`IMPL-026 — Polling runtime session-scoped`.

**Criterio di chiusura**

Chiudere quando il test dimostra che l'identità downstream della sessione/match deriva dalla risposta Start accettata e non viene ricostruita autonomamente da URL o input della richiesta.

**Riferimenti essenziali**

- `frontend/src/hooks/useLiveTrackingActions.js`
- `frontend/src/hooks/useLiveTrackingActions.test.mjs`
- `frontend/src/App.jsx`
- `frontend/src/services/liveSessionApi.js`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-052 — Nuovo Source Identity context con stessi nomi

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un nuovo contesto Source Identity deve essere distinguibile da uno precedente anche quando event ID e nomi visualizzati coincidono.

Caso minimo:

```
context A pending
→ utente acknowledgement/conferma A
→ nasce context B
→ stessi nomi visibili
→ context B deve essere riconosciuto come nuovo
→ modal può riaprirsi
→ acknowledgement/conferma A non sopprime B

```

**Evidenza/copertura corrente**

La conferma corrente è già session-bound tramite `trackingSessionId` e il refresh verifica la stessa sessione.

La pending-key locale usa però ancora principalmente:

```
sofaEventId
nomi SofaScore
nomi Betfair

```

e non possiede un context ID/revision/epoch opaco.

**Gap residuo**

Manca una regressione che crei due contesti distinti con gli stessi nomi e dimostri che il secondo non viene considerato già acknowledged.

**Owner tecnico collegato**

`FRONTEND-010 — Modale pending non legata al vero contesto Source Identity`.

Il contratto resta nel confine degli owner esistenti e non introduce una nuova IMPL.

**Criterio di chiusura**

Chiudere soltanto quando un'identità/revisione autoritativa del contesto impedisce il riuso accidentale dello stato locale di acknowledgement e la regressione same-names/new-context passa.

**Riferimenti essenziali**

- `frontend/src/hooks/useSourceIdentityGateUi.js`
- `frontend/src/hooks/useSourceIdentityGateStatus.js`
- `frontend/src/App.jsx`
- `docs/tennis-decision-ui/modules/evidence/02-source-identity.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-053 — Preflight input-bound e response stale

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un risultato Preflight deve appartenere allo snapshot degli input che ha effettivamente verificato.

Caso minimo:

```
input A
→ parte Preflight A
→ prima della response l'utente passa a input B
→ response A arriva OK
→ A non può validare B
→ nessun falso stato Preflight current/valid per B

```

**Evidenza/copertura corrente**

Il Preflight conserva principalmente:

```
status
message

```

e non possiede ancora una identity completa della richiesta/input equivalente alle protezioni dei poller.

**Gap residuo**

Manca una regressione deterministica che ritardi la response A, cambi gli input e dimostri che il risultato precedente viene ignorato o invalidato.

**Owner tecnico collegato**

`FRONTEND-011 — Risultati Preflight non legati agli input verificati`.

Il contratto resta nel confine di questo finding e non introduce una nuova IMPL.

**Criterio di chiusura**

Chiudere quando ogni risultato Preflight è associato allo snapshot/revisione degli input verificati e una response stale non può rendere valido lo stato relativo a input differenti.

**Riferimenti essenziali**

- `frontend/src/hooks/usePreflightChecks.js`
- `frontend/src/hooks/usePreflightChecks.test.mjs`
- `frontend/src/App.jsx`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-054 — Market Reactions branch `available:false`

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un ramo Market Reaction Evidence non disponibile non deve essere promosso dalla UI come osservazione disponibile soltanto perché esiste un oggetto ramo.

Caso minimo:

```txt
ramo Evidence presente
+ available = false
→ branch non disponibile
→ nessuna promozione a osservazione/card disponibile
→ stato/reasons coerenti con l'indisponibilità
```

**Evidenza/copertura corrente**

`marketReactionViewModel.js` considera disponibile un ramo soltanto quando `available === true`.

`marketReactionViewModel.test.mjs` verifica esplicitamente:

```txt
available: false → false
available: true  → true
available assente → false
```

Questa è copertura mirata reale del criterio base di availability.

**Gap residuo**

Non è ancora dimostrato il contratto completo di branch state/availability attraverso l'intera Market Reactions UI, incluse pagina e card, né l'integrazione uniforme con gli altri stati previsti dal view model.

**Owner tecnici collegati**

`IMPL-027 — Market Reactions frontend view model`.

Il finding frontend collegato resta `FRONTEND-009 — Market Reactions UI promuove rami unavailable e usa campi errati`.

**Criterio di chiusura**

Chiudere quando una regressione integrata dimostra che un ramo con `available:false` resta non disponibile in tutte le superfici Market Reactions pertinenti e non viene promosso da presenza dell'oggetto, payload parziale o fallback presentazionali.

**Riferimenti essenziali**

- `frontend/src/components/marketReactions/marketReactionViewModel.js`
- `frontend/src/components/marketReactions/marketReactionViewModel.test.mjs`
- `frontend/src/components/MarketReactionsPage.jsx`
- `frontend/src/components/marketReactions/FieldLedReactionCard.jsx`
- `frontend/src/components/marketReactions/MarketLedObservationCard.jsx`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-055 — Mapping schema Market Reactions reale

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

La UI Market Reactions deve consumare i nomi campo effettivamente esposti dal contratto Evidence corrente, senza dipendere da alias storici o ricostruire uno schema differente.

Caso minimo per il market source:

```txt
runner
observedFlowAmount
absoluteFlowTier
relativeFlowTier
direction
flowAmbiguous
→ mapping presentazionale coerente
→ valori mostrati senza alias legacy
```

**Evidenza/copertura corrente**

`buildMarketSourceView(...)` legge già:

```txt
runner
observedFlowAmount
absoluteFlowTier
relativeFlowTier
direction
flowAmbiguous
```

e `marketReactionViewModel.test.mjs` verifica con un payload mirato che questi campi vengano mappati nel view model presentazionale.

**Gap residuo**

La copertura attuale verifica soltanto una parte dello schema reale. Il contratto più ampio di `IMPL-027` resta aperto per stato pagina, availability, provisional/final, quality, reasons, visualizzazione della sorgente evento e finestre.

**Owner tecnici collegati**

`IMPL-027 — Market Reactions frontend view model`.

Il finding frontend collegato resta `FRONTEND-009 — Market Reactions UI promuove rami unavailable e usa campi errati`.

**Criterio di chiusura**

Chiudere quando una regressione rappresentativa del payload Evidence reale dimostra che pagina e card consumano lo schema corrente end-to-end e non dipendono da nomi campo legacy o mapping incompleti.

**Riferimenti essenziali**

- `frontend/src/components/marketReactions/marketReactionViewModel.js`
- `frontend/src/components/marketReactions/marketReactionViewModel.test.mjs`
- `frontend/src/components/MarketReactionsPage.jsx`
- `frontend/src/components/marketReactions/FieldLedReactionCard.jsx`
- `frontend/src/components/marketReactions/MarketLedObservationCard.jsx`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-056 — Nessun falso stato live/connected/polling active

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Le superfici frontend non devono dichiarare uno stato live, connected o polling active quando l'autorità della sessione o lo stato reale dei reader non lo consentono.

Il contratto deve coprire almeno:

```txt
stopped
waiting
collecting/pending
polling off
read error
integrity degraded
stato unknown/inattivo
→ nessun falso green/connected/active
```

**Evidenza/copertura corrente**

`dashboardConnections.test.mjs` verifica già diversi casi negativi:

- server SofaScore in `waiting`;
- Source Identity in `collecting` o `pending`;
- assenza di dati;
- read state `error`;
- read state `degraded`.

In questi casi non viene prodotto un falso `connected` per SofaScore; anche Betfair richiede dati presenti e `readStatus === "current"` per risultare `ok`.

**Gap residuo**

Manca ancora una regressione integrata della shell che leghi insieme session authority, stato dei poller e tutte le superfici presentazionali. `Sidebar.jsx` e altri indicatori di shell non derivano ancora integralmente dalla stessa authority usata da `buildDashboardConnections(...)`.

**Owner tecnici collegati**

Il finding principale è `FRONTEND-008 — Indicatori live derivati dalla presenza del dato`.

Il completamento della state authority resta collegato a `IMPL-025 — Frontend live-session controller` e al lifecycle dei poller di `IMPL-026 — Polling runtime session-scoped`.

**Criterio di chiusura**

Chiudere quando una regressione integrata dimostra che TopBar, Sidebar e indicatori di connessione non possono mostrare live/connected/active quando sessione, polling o read state risultano stopped, waiting, degraded, error o inattivi.

**Riferimenti essenziali**

- `frontend/src/utils/dashboardConnections.js`
- `frontend/src/utils/dashboardConnections.test.mjs`
- `frontend/src/components/DashboardWorkspace.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/TopBar.jsx`
- `frontend/src/App.jsx`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-057 — Sessione Sofa-only senza polling Betfair

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Una sessione accettata senza configurazione Betfair deve poter operare come Sofa-only senza attivare il poller Betfair o produrre request verso gli endpoint Betfair.

Caso minimo:

```txt
sessione attiva
+ SofaScore configurato
+ Betfair URL assente
→ SofaScore può restare attivo
→ Betfair readStatus = inactive
→ Betfair polling = off
→ zero request /api/betfair/*
```

Il requisito storico comprende inoltre l'assenza di polling Source Identity non necessario nel percorso Sofa-only.

**Evidenza/copertura corrente**

`useBetfairJson(...)` disattiva il polling quando manca `url` oppure `sofaEventId`, imposta `isPolling=false` e `readStatus="inactive"`.

`App.jsx` passa al hook una URL Betfair vuota quando la sessione non possiede una `confirmedBetfairUrl`, per cui il runtime corrente ha già una protezione reale contro l'avvio normale del poller Betfair senza configurazione.

`App.jsx` abilita però `useSourceIdentityGateStatus(...)` tramite `sessionActive` senza subordinare direttamente `enabled` a `hasBetfairUrl`.

**Gap residuo**

Manca una regressione esplicita Sofa-only che misuri le request e dimostri deterministicamente:

```txt
nessuna configurazione Betfair
→ zero request Betfair
```

e il requisito più ampio di poll policy Sofa-only non è coperto end-to-end per il Gate.

**Owner tecnico collegato**

`IMPL-026 — Polling runtime session-scoped` è l'owner principale della poll enable policy.

La configurazione accettata della sessione resta collegata a `IMPL-025 — Frontend live-session controller`.

**Criterio di chiusura**

Chiudere quando una regressione Sofa-only dimostra che l'assenza di Betfair non avvia alcuna request Betfair e che i consumer non necessari alla configurazione accettata restano disabilitati secondo la poll policy prevista.

**Riferimenti essenziali**

- `frontend/src/App.jsx`
- `frontend/src/hooks/useBetfairJson.js`
- `frontend/src/hooks/useBetfairJson.test.mjs`
- `frontend/src/hooks/useSourceIdentityGateStatus.js`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-058 — StrictMode con una sola catena polling

**Stato corrente:** `PARZIALE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Il lifecycle React in `StrictMode` non deve creare più catene concorrenti per lo stesso poller dopo la sequenza mount → cleanup → remount.

Caso minimo:

```txt
StrictMode mount
→ cleanup
→ remount
→ una sola chain corrente
→ nessuna request duplicata concorrente
→ vecchia request abortita/invalida
→ nessun late write o reschedule della generation chiusa
```

**Evidenza/copertura corrente**

`pollingLifecycle.test.mjs` usa già `React.StrictMode` sul probe SofaScore e sul Source Identity Gate.

La regressione verifica request count, abort della request precedente e, per SofaScore, anche che una response tardiva del vecchio evento non sovrascriva lo stato corrente. Lo stesso file verifica inoltre che `resumePolling()` non avvii una seconda request quando il loop è già attivo.

Questa è copertura reale del lifecycle, ma non costituisce ancora un harness StrictMode completo e simmetrico per tutti i poller applicativi.

**Gap residuo**

Manca una regressione canonica che applichi lo stesso contratto almeno a SofaScore, Betfair, Evidence e Source Identity Gate e dimostri, per ciascuno, una sola catena attiva sotto mount/cleanup/remount.

**Owner tecnico collegato**

`IMPL-026 — Polling runtime session-scoped`.

**Criterio di chiusura**

Chiudere quando un harness deterministico StrictMode verifica per tutti i poller richiesti request/timer count, invalidazione o abort della chain precedente, assenza di late write e assenza di reschedule dopo cleanup.

**Riferimenti essenziali**

- `frontend/src/hooks/pollingLifecycle.test.mjs`
- `frontend/src/hooks/useMatchPolling.js`
- `frontend/src/hooks/useBetfairJson.js`
- `frontend/src/hooks/useMarketReactionEvidence.js`
- `frontend/src/hooks/useSourceIdentityGateStatus.js`
- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-059 — Smoke responsive desktop/tablet/mobile

**Stato corrente:** `MANCANTE`

**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

La session shell deve essere verificata sui principali profili di viewport previsti dal progetto senza dedurre la completezza responsive dalla sola presenza di breakpoint o adattamenti locali.

Caso minimo:

```txt
desktop
tablet
mobile
→ shell e navigazione strutturalmente utilizzabili
→ Sidebar e TopBar coerenti con il viewport
→ contenuto principale raggiungibile e leggibile
→ nessuna regressione strutturale evidente fra i tre profili
```

Lo smoke deve riguardare il comportamento end-to-end della shell e delle principali superfici applicative, non la sola presenza di classi responsive in singoli componenti.

**Evidenza/copertura corrente**

`FRONTEND-012` resta `LIMITE CONFERMATO`: esistono breakpoint e adattamenti locali, ma non una strategia responsive completa che governi insieme shell, Sidebar e TopBar sui principali viewport.

`Sidebar.jsx` mantiene una sidebar `w-64`, `h-screen` e `sticky`; `DashboardWorkspace.jsx` compone direttamente Sidebar, TopBar e contenuto principale. Questa struttura non costituisce di per sé una prova del comportamento responsive end-to-end.

La suite frontend espone test di componenti basati su `react-test-renderer`; `frontend/package.json` non definisce un harness browser/E2E dedicato al responsive e `frontendComponents.test.jsx` non esegue variazioni di viewport.

**Gap residuo**

Manca uno smoke responsive desktop/tablet/mobile che verifichi in modo ripetibile la shell e le superfici principali dopo la task responsive dedicata.

**Owner tecnico collegato**

`FRONTEND-012 — Layout responsive strutturalmente assente`.

La responsabilità responsive resta separata da `IMPL-025` e `IMPL-026`: session correctness e layout adaptation appartengono a confini distinti.

**Criterio di chiusura**

Chiudere quando il comportamento responsive end-to-end è definito e uno smoke ripetibile verifica desktop, tablet e mobile sulle superfici principali, con esito coerente per shell, navigazione, TopBar, Sidebar e contenuto operativo.

**Riferimenti essenziali**

- `frontend/src/App.jsx`
- `frontend/src/components/DashboardWorkspace.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/TopBar.jsx`
- `frontend/src/components/frontendComponents.test.jsx`
- `frontend/package.json`
- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### DOC-028 — Session shell contraddice la session authority approvata

**Stato:** `RISOLTO NEL DIFETTO ORIGINARIO`
**Classificazione:** `DOCUMENTAZIONE ERRATA`

**Problema originario**

La documentazione storica della session shell non distingueva correttamente input, configurazione accettata, authority della sessione, attivazione dei consumer live e bootstrap.

**Stato ed evidenza corrente**

Il difetto originario è risolto. La documentazione corrente distingue input correnti, configurazione confirmed, `trackingSessionId`, `sessionActive`, `sessionShellVisible` e bootstrap associato alla sessione accettata.

**Responsabilità tecnica collegata**

DOC-028 resta un finding documentale e non diventa owner tecnico del lifecycle frontend. Le responsabilità tecniche restano negli owner correnti, incluso `IMPL-025` dove pertinente.

**Criterio di chiusura**

Il finding resta risolto finché la documentazione mantiene distinti input, sessione accettata, `trackingSessionId`, `sessionActive` e bootstrap.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`
- provenance storica: commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`

---

### DOC-029 — Polling e view model descrivono funzioni non implementate

**Stato:** `PARZIALE / ANCORA PERTINENTE`
**Classificazione:** `DOCUMENTAZIONE PIÙ FORTE DEL CODICE`

**Problema originario**

Il finding storico rilevava che polling e view model erano descritti con un isolamento di sessione più forte di quello realmente implementato.

**Stato ed evidenza corrente**

Generation, `requestId`, `AbortController`, cleanup dei timeout e protezioni contro response stale sono reali.

Il residuo resta però pertinente: i poller non condividono necessariamente una `sessionKey` comune e non usano tutti `trackingSessionId` come dipendenza diretta dell'effect. Il loro scope deriva ancora da `sessionActive`, URL/eventId confermati e generation locale.

**Responsabilità tecnica collegata**

Il confine tecnico dei poller session-scoped resta collegato a `IMPL-026`.

**Criterio di chiusura**

DOC-029 resta `PARZIALE / ANCORA PERTINENTE` finché documentazione e implementazione non convergono sul medesimo confine di sessione.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`
- provenance storica: commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`

---

### DOC-030 — UI Betfair e Market Reactions descritta come integrity-aware

**Stato:** `RISOLTO NEL DIFETTO ORIGINARIO`
**Classificazione:** `DOCUMENTAZIONE PIÙ FORTE DEL CODICE`

**Problema originario**

La documentazione descriveva Betfair e Market Reactions come integrity-aware prima che il wiring runtime fosse realmente collegato.

**Stato ed evidenza corrente**

Il difetto originario è risolto: SofaScore, Betfair ed Evidence propagano integrity; `App.jsx` costruisce `persistenceViewState`; la shell espone degradazione ed errori; Betfair e Market Reactions ricevono le informazioni pertinenti.

Health, persistence, freshness e Source Identity restano assi distinti.

**Responsabilità tecnica collegata**

DOC-030 resta un finding documentale e non diventa owner tecnico della persistence UI. Le responsabilità tecniche restano negli owner frontend esistenti, incluso `IMPL-027` dove pertinente.

**Criterio di chiusura**

Il finding resta risolto finché la documentazione descrive soltanto il wiring integrity realmente presente e non attribuisce alla UI lettura del journal, recovery o ricostruzione autonoma dell'integrità.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`
- `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`
- `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`
- `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`
- provenance storica: commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`

---

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
