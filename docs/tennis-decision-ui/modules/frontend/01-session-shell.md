# Sessione e shell frontend

## Scopo

Questo modulo descrive come il frontend gestisce input, sessione confermata, avvio tracking, shell dashboard e navigazione tra le viste.

```txt
frontend/src/
├── main.jsx
├── App.jsx
├── hooks/useAnalysisSessionState.js
├── hooks/useBetfairLoginAction.js
├── hooks/useDashboardBootstrapState.js
├── hooks/useLiveTrackingActions.js
├── hooks/useSourceIdentityGateStatus.js
├── hooks/useSourceIdentityGateUi.js
├── utils/analysisSessionState.js
├── utils/liveSessionRequests.js
├── utils/sourceIdentityGatePresentation.js
├── services/liveSessionApi.js
├── components/StartAnalysisPanel.jsx
├── components/DashboardWorkspace.jsx
├── components/Sidebar.jsx
├── components/SourceIdentityGateIndicator.jsx
├── components/SourceIdentityGateToast.jsx
├── components/SourceIdentityGateWaitingScreen.jsx
└── components/marketReactions/SourceIdentityConfirmationModal.jsx
```

## Ownership

| Area                                 | Proprietario                                       |
| ------------------------------------ | -------------------------------------------------- |
| Mount React e stili globali          | `main.jsx`                                         |
| Composizione sessione, shell e viste | `App.jsx`                                          |
| Stato input e stato confermato       | `useAnalysisSessionState.js`                       |
| Avvio, stop e ritorno al form        | `useLiveTrackingActions.js`                        |
| Bootstrap dashboard dopo Start       | `useDashboardBootstrapState.js`                    |
| Apertura login Betfair               | `useBetfairLoginAction.js`                         |
| Trasformazione pura stato sessione   | `utils/analysisSessionState.js`                    |
| Payload login e tracking             | `utils/liveSessionRequests.js`                     |
| Azioni HTTP esplicite                | `services/liveSessionApi.js`                       |
| Polling status gate live             | `useSourceIdentityGateStatus.js`                   |
| Stato UI Source Identity globale     | `useSourceIdentityGateUi.js`                       |
| Presentazione pura Source Identity   | `utils/sourceIdentityGatePresentation.js`          |
| Form iniziale                        | `StartAnalysisPanel.jsx`                           |
| Shell dashboard e TopBar             | `DashboardWorkspace.jsx`, `TopBar.jsx`             |
| UI globale Source Identity           | indicatore, toast, waiting screen e modale pending |

## Stato sessione

La sessione distingue input correnti e configurazione confermata.

```txt
input utente
→ stato corrente
→ applySearchSession(...)
→ stato confermato
→ polling e dashboard
```

Campi principali:

```txt
matchUrl
betfairUrl
betfairGraphUrls
betfairMode
chromeProfilePath
cdpUrl
```

Lo stato confermato usa:

```txt
confirmedUrl
confirmedBetfairUrl
confirmedBetfairGraphUrls
confirmedBetfairMode
confirmedChromeProfilePath
confirmedCdpUrl
```

`buildAnalysisSessionUpdate(...)` mantiene separati il profilo inserito nella UI e il percorso completo usato dal backend.

### URL CDP effettivo

`cdpUrl` e `confirmedCdpUrl` conservano l’endpoint effettivo della sessione.

Precedenza:

```txt
valore current definito
→ prevale anche quando è ""

altrimenti valore confirmed definito
→ prevale

altrimenti
→ ""
```

Un valore vuoto resta vuoto. Il frontend non introduce fallback a `http://127.0.0.1:9222`.

In modalità `cdp`, preflight, login e tracking usano lo stesso valore normalizzato; quando è vuoto, l’azione si ferma senza inventare un endpoint.

## Visibilità shell

`App.jsx` usa `sessionShellVisible` per separare il form iniziale dalla sessione live.

Dopo Start:

```txt
applySearchSession(...)
→ activeView = overview
→ sessionShellVisible = true
→ startMatchTracking(...)
```

La shell `DashboardWorkspace` appare subito dopo Start anche con:

```txt
dashboardData === null
```

Sidebar e TopBar restano renderizzate durante il bootstrap. `MatchOverviewBar` viene invece mostrata soltanto quando `dashboardData` è disponibile.

Il contenuto centrale usa:

```txt
dashboardContentReady
+ dashboardData disponibile
```

Dopo Start, `useDashboardBootstrapState.js` attende il reset del dato precedente e il primo `backendData` della nuova sessione. Fino a quel momento viene mostrata `SourceIdentityGateWaitingScreen`.

La presentazione Source Identity determina testo e tono della waiting screen, ma non sblocca direttamente la dashboard.

Durante `collecting` o `pending` la waiting screen resta normalmente visibile perché la timeline canonica SofaScore non ha ancora prodotto `backendData`. Se `dashboardData` diventa disponibile, il codice corrente mostra la dashboard senza un controllo diretto della phase.

`mismatch` chiude automaticamente la shell e riporta al form.

## Avvio tracking

Flusso corrente:

```txt
StartAnalysisPanel
→ preflight
→ buildProfilePath(...)
→ buildMatchTrackingRequest(...)
→ activeView = overview
→ applySearchSession(...)
→ startMatchTracking(...)
```

`buildMatchTrackingRequest(...)` centralizza:

```txt
sofaUrl
betfairUrl
betfairGraphUrls
betfairMode
chromeProfilePath
cdpUrl
```

`applySearchSession(...)` viene eseguito prima di attendere la risposta di `startMatchTracking(...)`.

Se Start fallisce:

```txt
sessionShellVisible = false
→ ritorno al form
→ input correnti preservati
→ configurazione confermata non cancellata
→ nessun toast mismatch
```

Non cambiare questo ordine senza aggiornare comportamento UX e test.

## Login Betfair

Il flusso UI resta `Link Accounts & Start`; non esiste un pulsante login-only separato.

`buildBetfairLoginRequest(...)` invia:

```txt
url
mode
profileDir
cdpUrl
```

`liveSessionApi.openBetfairLoginWindow(...)` riceve `no_target`, `started` e `already_active`. Errori come `login_runtime_conflict` vengono trasformati dal service in eccezioni statiche.

`useBetfairLoginAction(...)` restituisce il payload in caso di successo; in caso di errore registra `betfair_login_failed` e restituisce `null`. L’interfaccia corrente non propaga integralmente il `code` strutturato dell’errore come stato UI.

## Stop Live Tracking

Il controllo visibile nell’Overview è:

```txt
Stop Live Tracking
```

`useLiveTrackingActions.js` invia `POST /api/match/stop` con `eventId` informativo, coordina lo stato UI e ferma il polling SofaScore previsto.

```txt
richiesta
→ Stopping live tracking...

risposta con ok: true
→ Live tracking stopped
→ stopSofaPolling()
→ setTrackingStopped(true)
```

Il service restituisce il payload completo, incluso `pythonCleanup`. Gli handler UI usano soprattutto `ok` e non espongono integralmente la summary ai componenti.

Il backend usa `scope=tracking`: preserva `betfair_login`, backend, frontend e CDP.

Lo stop non svuota dashboard, URL, snapshot o dati persistiti. Gli hook Betfair, Evidence e Source Identity possono restare montati e leggere dati già persistiti o ricevere `404`, ma non riavviano il tracking backend.

## Logging runtime frontend

Il runtime log frontend usa soltanto campi allow-list. Non inoltra `Error` raw, URL operative complete, profili, command line o segreti.

## Viste

```txt
overview
lay
banca
superbreak
market-reactions
```

| View               | Componente                  | Stato                         |
| ------------------ | --------------------------- | ----------------------------- |
| `overview`         | `OverviewDashboard.jsx`     | corrente                      |
| `lay`              | `LayTheWinner.jsx`          | legacy Strategy, deprecata    |
| `banca`            | `BancaServizio.jsx`         | legacy Strategy, deprecata    |
| `superbreak`       | `Superbreak.jsx`            | legacy Strategy, deprecata    |
| `market-reactions` | `MarketReactionsPage.jsx`   | corrente, read-only Evidence  |

Le viste Strategy legacy restano presenti finché il codice non viene rimosso, ma non devono essere estese o usate come base per nuove strategie. La loro rimozione richiede una task dedicata. Match Evidence e Market Reactions restano fuori da tale rimozione.

Cambiare vista non deve:

- avviare scraper;
- reinizializzare la sessione;
- cancellare timeline;
- creare un secondo polling;
- modificare Source Identity.

## Source Identity UI

Il Source Identity globale non deriva dallo snapshot Evidence.

`App.jsx` legge lo stato live tramite:

```txt
useSourceIdentityGateStatus(eventId)
→ GET /api/match/:eventId/source-identity-status
```

Lo stato passato ai componenti è:

```txt
sourceIdentityStatusForUi
```

Non applica simulazioni o override client-side.

Tutti i consumer Source Identity usano questo valore:

```txt
sidebar
→ indicatore
→ waiting screen
→ apertura modale
→ toast transition detection
→ mismatch handling
```

Lo status gate è inoltrato alla shell solo come input di presentazione.

```txt
collecting/pending + persistence buffering
→ può contribuire a Sofa: In attesa
→ non cambia phase
→ non autorizza persistenza
→ non sostituisce il gate backend
```

Contratto visivo Sofa:

```txt
connected
→ Sofa: Connected
→ verde, check, timestamp disponibile

waiting
→ Sofa: In attesa
→ ambra, nessun check, tempo —

disconnected
→ Sofa: Disconnected
→ rosso
```

Il fallback legacy basato su `connections.sofa.ok` resta supportato.

La modale pending usa esclusivamente:

```txt
sofaPlayers
betfairRunners
reasons
```

Non mostra URL, marketId, selectionId, payload raw, token, cookie o path locali.

### Conferma reale

Quando il gate UI è pending reale, `useSourceIdentityGateUi.js` invia:

```txt
POST /api/evidence/:eventId/source-identity/confirm
```

Dopo successo:

```txt
refresh status gate
→ chiusura modale
→ recording/aligned
→ toast verde normale
```

La dashboard viene visualizzata soltanto quando il bootstrap ha prodotto `dashboardContentReady` e `dashboardData`.

### Mismatch

Quando lo status UI raggiunge `mismatch`:

```txt
toast rosso persistente
→ stop polling SofaScore
→ clearConfirmedSession()
→ chiusura shell
→ ritorno al form
```

`clearConfirmedSession()` pulisce soltanto la configurazione confermata. Gli input del form restano disponibili per correggere e riavviare.

## Persistence integrity nella shell

Le API Match e Betfair espongono `integrity`, ma la shell corrente non possiede ancora un controller completo e uniforme di persistence integrity.

Stato reale:

```txt
useMatchPolling
→ conserva integrity
→ usa serverStatus partial_persistence | recovery_failed

useBetfairJson
→ conserva integrity internamente

App.jsx
→ non destruttura né inoltra le integrity degli hook

useDashboardViewModel
→ non riceve integrity
→ non costruisce un persistence view state

componenti shell
→ non mostrano ancora uno stato persistence uniforme
```

Questa limitazione non autorizza la UI a ricostruire journal, history o timeline. L’eventuale completamento del wiring deve essere una task dedicata con test di lifecycle React.

## Confini

`App.jsx` deve comporre hook e viste, non assorbire logica visuale, chiamate HTTP o trasformazioni pure.

Non inserire in `App.jsx`:

- SVG complessi;
- rendering dettagliato ladder;
- calcoli Money Flow;
- mapping dashboard duplicato;
- chiamate fetch sparse nei componenti figli;
- logica Source Identity backend;
- parsing di timeline;
- lettura o repair di journal.

## Verifica

```bash
npm run build
node src/hooks/useMatchPolling.test.mjs
node src/utils/sourceIdentityGatePresentation.test.mjs
node src/utils/analysisSessionState.test.mjs
node src/utils/liveSessionRequests.test.mjs
node src/utils/sourceIdentityConfirmationState.test.mjs
node src/utils/sourceIdentityControlMode.test.mjs
node src/utils/dashboardConnections.test.mjs
node src/utils/dashboardMatchOverview.test.mjs
node src/utils/dashboardStats.test.mjs
node src/utils/betfairMoneyFlow.test.mjs
```

Non eseguire `npm run lint`: il repository non contiene una configurazione ESLint e il comando fallisce prima di analizzare il codice.

Verifica manuale completata:

```txt
Start
→ shell immediata
→ collecting grigio

recording/aligned
→ toast verde

bootstrap con dashboardContentReady + dashboardData
→ dashboard reale

mismatch
→ toast rosso
→ form
→ campi preservati

restart dopo mismatch
→ collecting
→ aligned
```

Restano aperti:

```txt
pending reale
→ conferma manuale
→ bootstrap

pending reale
→ decline/stop
→ ritorno al form

persistence integrity
→ wiring UI uniforme non implementato
```

## Documenti collegati

- [Polling e view model](./02-live-polling-and-view-model.md)
- [UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md)
- [Source Identity](../evidence/02-source-identity.md)
- [API Match](../../api/01-match.md)
- [API Evidence](../../api/03-evidence.md)
- [API Preflight](../../api/05-preflight.md)
- [Verifica live Source Identity](../../../validations/source-identity-live-verification.md)
