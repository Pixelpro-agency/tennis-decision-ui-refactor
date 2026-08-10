# Report documentale — `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-020
Sequenza audit: 20/72
Documento analizzato: 01-session-shell.md
Percorso documento: docs/tennis-decision-ui/modules/frontend/01-session-shell.md
Percorso report: Report documentale/20 - 01-session-shell.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 904d3e38d48f335f5540080d328e32718cf5f8ba
Dimensione documento: 464 righe
Ruolo dichiarato: owner della sessione frontend, shell dashboard e lifecycle UI di Start/Stop/Source Identity
Stato report: completato
```

Il documento è stato confrontato con:

- `frontend/src/App.jsx`;
- `frontend/src/hooks/useAnalysisSessionState.js`;
- `frontend/src/hooks/useLiveTrackingActions.js`;
- `frontend/src/hooks/useDashboardBootstrapState.js`;
- `frontend/src/hooks/useBetfairLoginAction.js`;
- `frontend/src/hooks/useSourceIdentityGateStatus.js`;
- `frontend/src/hooks/useSourceIdentityGateUi.js`;
- `frontend/src/hooks/useMatchPolling.js`;
- `frontend/src/hooks/useBetfairJson.js`;
- `frontend/src/hooks/useMarketReactionEvidence.js`;
- `frontend/src/hooks/useDashboardViewModel.js`;
- `frontend/src/utils/analysisSessionState.js`;
- `frontend/src/utils/liveSessionRequests.js`;
- `frontend/src/utils/sourceIdentityGatePresentation.js`;
- `frontend/src/utils/runtimeLog.js`;
- `frontend/src/services/liveSessionApi.js`;
- `frontend/src/components/StartAnalysisPanel.jsx`;
- `frontend/src/components/DashboardWorkspace.jsx`;
- `frontend/src/components/marketReactions/SourceIdentityConfirmationModal.jsx`;
- `frontend/src/utils/analysisSessionState.test.mjs`;
- `frontend/src/utils/liveSessionRequests.test.mjs`;
- test e utility Source Identity citati dal documento;
- i finding già registrati su Preflight, Source Identity, Strategy, session authority e persistence integrity.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Ownership file/componenti: sostanzialmente corretta
Separazione input current / confirmed: implementata
CDP empty/no-fallback: coerente
Shell immediata dopo Start click: implementata
Stop tracking senza cancellare dati persistiti: coerente
Source Identity live come authority UI: coerente
Mismatch → ritorno al form: implementato
Persistence integrity uniforme nella shell: realmente assente, come documentato

Preflight come gate di Start: non implementato
Sessione "confirmed": applicata prima del successo /track
Poller: possono partire prima del successo /track
Start failure: lascia confirmed session attiva
Start failure: può lasciare polling Sofa/Betfair/Evidence attivo a shell chiusa
Dashboard readiness: basata su reset+presenza backendData, non su session/gate authority
Vecchi dati persistiti: possono contribuire a sbloccare la dashboard
Start error: non ha stato UI dedicato
Login error code: perso dal hook
Confirmation success: non prova recording/aligned
Decline pending: modale chiusa prima di sapere se Stop è riuscito
Persistent profile "full path": non costruito dal caller corrente
chromeProfileName/confirmedChromeProfileName: stato legacy/dead
Verification lifecycle hooks: insufficiente
Validazione manuale inline: da separare
Modifiche proposte: 10
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
```

Il documento possiede una buona struttura di ownership e descrive correttamente molti confini:

```text
App.jsx
→ composizione

hook
→ lifecycle/state

utils
→ trasformazioni pure

service
→ HTTP

componenti
→ rendering
```

Sono inoltre corrette le seguenti proprietà:

- `cdpUrl` non inventa `127.0.0.1:9222`;
- `sessionShellVisible` separa form e shell;
- la shell può apparire prima dei dati dashboard;
- MatchOverviewBar richiede `dashboardData`;
- Source Identity UI legge il gate live e non lo ricostruisce da Evidence;
- mismatch pulisce la configurazione confermata e torna al form;
- Stop Live Tracking non cancella timeline/history;
- `frontendRuntimeLog()` usa allow-list;
- Strategy legacy è marcata come deprecata;
- la shell non deve leggere journal né fare recovery.

Le criticità principali riguardano però il significato della parola:

```text
confirmed
```

e chi autorizza realmente l'attivazione della sessione.

Oggi:

```text
applySearchSession()
```

avviene prima del successo del backend.

Il cambio di `confirmedUrl` attiva i consumer/poller frontend.

Quindi:

```text
confirmed session
```

significa oggi:

```text
configurazione scelta dall'utente e applicata al frontend
```

non:

```text
tracking backend avviato con successo
```

Questa distinzione deve diventare esplicita oppure il lifecycle deve essere reso transazionale.

---

# 1. Il Preflight non è un gate dello Start

## Esito: wording troppo forte

Il documento rappresenta il flusso come:

```text
StartAnalysisPanel
→ preflight
→ buildProfilePath(...)
→ buildMatchTrackingRequest(...)
→ ...
→ startMatchTracking(...)
```

Questa sequenza può far intendere:

```text
preflight riuscito
→ Start autorizzato
```

Il componente reale renderizza `PreflightChecks`, ma il bottone:

```text
Link Accounts & Start
```

è disabilitato soltanto da:

```text
!matchUrl
oppure
sofaLoading
```

Non verifica:

- backend check;
- CDP check;
- Sofa URL check;
- Betfair URL check;
- Graph URL check.

`handleSearch()` non riceve neppure lo stato `checks`.

Quindi il Preflight è oggi:

```text
diagnostica advisory
```

non:

```text
authorization gate
```

## Finding `FRONT-SESSION-001` — allineare il contratto Preflight della shell

**Priorità:** alta  
**Tipo:** session start contract

### Coordinamento

Riutilizzare il finding già registrato:

```text
PREFLIGHT-API-005
```

### Documento

Scrivere esplicitamente:

```text
Preflight
→ diagnostica separata
→ non blocca automaticamente Link Accounts & Start
```

### Se il target futuro è un gate reale

La decisione deve essere implementata in:

- UI;
- lifecycle Start;
- test.

Non basta cambiare il testo.

---

# 2. `applySearchSession()` precede il successo del tracking backend

## Esito: criticità principale del lifecycle

`handleSearch()` esegue nell'ordine:

```text
build request
→ applySearchSession(...)
→ reset Source Identity UI
→ activeView overview
→ sessionShellVisible true
→ trackingStopped false
→ beginDashboardBootstrap()
→ await startMatchTracking(...)
```

Quindi i campi:

```text
confirmedUrl
confirmedBetfairUrl
confirmedBetfairGraphUrls
confirmedBetfairMode
confirmedChromeProfilePath
confirmedCdpUrl
```

sono scritti **prima** che:

```text
POST /api/match/track
```

abbia risposto con successo.

## Effetto dei campi confirmed

`App.jsx` ricava:

```text
sofaEventId
```

da:

```text
confirmedUrl
```

e monta/attiva consumer basati su quel valore.

`useDashboardViewModel()` osserva:

```text
confirmedUrl
```

e chiama:

```text
loadMatch()
```

quindi il polling Sofa parte dopo l'applicazione della configurazione confermata, non dopo il successo backend.

`useBetfairJson()` e `useMarketReactionEvidence()` sono anch'essi guidati dall'eventId/configurazione confermata e non dal risultato della POST `/track`.

## Se Start fallisce

Il catch attuale esegue:

```text
resetDashboardBootstrap()
setSessionShellVisible(false)
frontendRuntimeLog(...)
```

ma non esegue:

```text
clearConfirmedSession()
stopSofaPolling()
stop Betfair polling
stop Evidence polling
```

Quindi la shell sparisce, ma la sessione confermata resta.

## Finding `FRONT-SESSION-002` — rendere transazionale l'attivazione della sessione frontend

**Priorità:** critica  
**Tipo:** session activation authority

### Target preferibile

Distinguere:

```text
draft/current config
pending-start config
active/confirmed config
```

e promuovere a:

```text
active/confirmed
```

solo dopo:

```text
startMatchTracking → ok:true
```

### Alternativa minima

Se si mantiene l'ordine attuale:

```text
Start failure
→ rollback completo confirmed state
→ stop/abort consumer attivati
→ reset bootstrap
→ ritorno al form
```

### Coordinamento

Allineare con:

```text
IMPL-006
SOURCE-ID-001
SOURCE-ID-002
```

perché la futura session authority backend/frontend non può poggiare su una configurazione chiamata “confirmed” prima dell'avvio reale.

---

# 3. Start fallito può lasciare poller attivi a shell chiusa

## Esito: conseguenza concreta di `FRONT-SESSION-002`

Il documento dice:

```text
Se Start fallisce:
sessionShellVisible = false
→ ritorno al form
→ input correnti preservati
→ configurazione confermata non cancellata
```

Questa frase descrive correttamente il codice, ma non espone l'effetto lifecycle.

## Sofa

`confirmedUrl` resta valorizzato.

`useDashboardViewModel()` ha già chiamato:

```text
loadMatch()
```

e `useMatchPolling.shouldPoll.current` resta:

```text
true
```

La chiusura della shell non disabilita il polling Sofa.

## Betfair

`useBetfairJson()` non dipende da:

```text
sessionShellVisible
```

Con `sofaEventId` confermato continua il proprio lifecycle di polling.

## Evidence

`useMarketReactionEvidence()` dipende dall'eventId, non dalla shell.

Quindi può continuare a leggere Evidence anche quando il form iniziale è di nuovo visibile.

## Source Identity

Questo hook è invece disabilitato da:

```text
enabled: sessionShellVisible
```

e si arresta quando la shell viene chiusa.

Le quattro superfici non condividono quindi lo stesso criterio di attivazione dopo uno Start fallito.

## Finding `FRONT-SESSION-003` — introdurre un unico `sessionActive` per gli effetti live/read

**Priorità:** critica  
**Tipo:** frontend lifecycle authority

### Contratto target

I consumer session-scoped devono dipendere da un'autorità comune:

```text
sessionActive
+
eventId/sessionId corrente
```

non soltanto dalla presenza di:

```text
confirmedUrl
```

### Start failure

Dopo failure:

```text
sessionActive:false
→ nessun polling residuo della sessione fallita
```

### Nota

I dettagli tecnici di AbortController, stale-response guard e scheduling appartengono al prossimo owner:

```text
02-live-polling-and-view-model.md
```

Qui va definita soltanto l'authority della sessione.

---

# 4. Dashboard readiness non è vincolata al gate Source Identity o alla sessione backend attiva

## Esito: old persisted data può contribuire allo sblocco

`useDashboardBootstrapState()` considera pronta la dashboard dopo:

```text
beginDashboardBootstrap()
→ osservazione di backendData null
→ successivo backendData non-null
```

Non verifica:

```text
tracking start ok
trackingSessionId
Source Identity phase recording
Source Identity aligned/not-applicable
commit appartenente alla nuova sessione
```

## Il documento lo ammette parzialmente

Scrive:

```text
Se dashboardData diventa disponibile,
il codice corrente mostra la dashboard
senza un controllo diretto della phase.
```

Questa non è soltanto una particolarità visuale.

L'endpoint Match può leggere dati persistiti già esistenti per lo stesso eventId.

Quindi un nuovo Start può:

```text
reset poller
→ leggere timeline preesistente
→ backendData non-null
→ dashboardContentReady true
```

anche prima che la nuova sessione abbia completato Source Identity/bootstrap.

## Effetto

La waiting screen è oggi garantita soprattutto indirettamente dal fatto che:

```text
normalmente
la nuova timeline non produce ancora dati
```

non da un'autorità esplicita.

## Finding `FRONT-SESSION-004` — legare il bootstrap dashboard alla session authority

**Priorità:** critica  
**Tipo:** dashboard session isolation

### Target

La dashboard deve sbloccarsi soltanto su dati attribuibili alla sessione corrente.

Possibili ingredienti della soluzione approvata:

```text
trackingSessionId
session generation
gate recording/not-applicable
commit/session marker
```

La scelta deve essere coordinata con:

```text
IMPL-006
```

e non inventata soltanto nel frontend.

### Invariante

```text
vecchio snapshot persistito
≠ prova che il nuovo Start sia pronto
```

---

# 5. Start/Login/Stop hanno error contract diversi e lo Start può fallire senza feedback dedicato

## Esito: osservabilità UX incompleta

## Start

`startMatchTracking()` converte qualunque errore HTTP/backend in:

```text
Unable to start match tracking.
```

`handleSearch()` cattura l'errore e:

- chiude la shell;
- scrive un log statico;

ma non mantiene uno:

```text
trackingStartError
```

da mostrare nel form.

`StartAnalysisPanel` mostra:

```text
sofaError
```

proveniente dal polling Match, non dalla POST Start.

Quindi una failure `/track` può riportare l'utente al form senza spiegazione visibile specifica.

## Login

`openBetfairLoginWindow()` costruisce un errore con:

```text
error.code
```

ma `useBetfairLoginAction()` lo sostituisce sempre nel log con:

```text
login_request_failed
```

e restituisce:

```text
null
```

La UI perde quindi il code bounded prodotto dal service.

## Stop

`stopMatchTracking()` esegue direttamente:

```text
res.json()
```

e non normalizza:

- HTTP non-ok;
- body non JSON;
- code bounded.

`handleStopLiveTracking()` può inoltre mostrare:

```text
data.error
```

oppure:

```text
error.message
```

direttamente nello stato UI.

## Finding `FRONT-SESSION-005` — unificare gli action result bounded

**Priorità:** alta  
**Tipo:** frontend action/error contract

### Target

Per Start, Login e Stop usare risultati coerenti:

```text
ok
code
message UI statica/bounded
optional safe details
```

### Start

Una failure deve produrre:

```text
form visibile
+
errore utente bounded
+
nessuna sessione active
```

### Login

Preservare il `code` strutturato per UI/log senza raw backend message.

### Stop

Usare parsing safe e mapping statico.

---

# 6. La conferma Source Identity non prova `recording/aligned`

## Esito: documento più forte del contratto API/UI

Il documento dice:

```text
Dopo successo:
refresh status gate
→ chiusura modale
→ recording/aligned
→ toast verde normale
```

`useSourceIdentityGateUi.handleConfirmSourceIdentity()` fa invece:

```text
POST confirmation
→ payload.ok === true
→ await sourceIdentityGate.refresh()
→ acknowledgedPendingKey = current key
→ close modal
→ return ok:true
```

Non controlla il risultato del refresh.

Quindi:

```text
refresh → null
refresh → pending
refresh → error
```

non impediscono la chiusura della modale.

## Contratto backend corrente

Come già emerso nell'audit Source Identity, l'endpoint confirmation possiede anche un fallback timeline-based senza gate live.

Una risposta:

```text
ok:true
```

può quindi significare:

```text
confirmation persistita
```

senza garantire:

```text
gate recording
bootstrap completed
```

## Finding `FRONT-SESSION-006` — verificare l'esito live prima di chiudere la confirmation UI

**Priorità:** alta  
**Tipo:** Source Identity frontend contract

### Coordinamento

Riutilizzare:

```text
SOURCE-ID-003
SOURCE-ID-004
SOURCE-ID-006
```

### Target

Dopo POST:

```text
refresh gate
→ phase recording + aligned
oppure
→ stato esplicito di bootstrap in corso/fallito
```

Solo l'esito previsto deve chiudere automaticamente la modale e produrre successo UI.

### Non fare

Non derivare il gate da Evidence.

La verifica deve restare sul live status endpoint.

---

# 7. Decline pending chiude la modale prima di sapere se Stop è riuscito

## Esito: failure UX persa

`App.jsx` definisce il decline handler come:

```text
closeSourceIdentityConfirmation()
→ await stopAndReturnToLinks()
```

Quindi la modale viene smontata immediatamente.

`SourceIdentityConfirmationModal` prova a gestire:

```text
result.ok === false
→ setRequestError(...)
```

ma, nel flusso parent corrente, il componente può essere già stato chiuso.

## Se Stop fallisce

`stopAndReturnToLinks()` non:

- ferma Sofa polling;
- pulisce confirmed session;
- chiude shell;

quando il backend non restituisce `ok:true`.

Quindi può restare:

```text
sessione attiva/pending
+
shell visibile
+
modale chiusa
+
errore decline non visibile nel componente che lo ha generato
```

L'utente può eventualmente riaprire la modale, ma il failure contract non è atomico.

## Finding `FRONT-SESSION-007` — rendere atomico decline → Stop → ritorno al form

**Priorità:** alta  
**Tipo:** Source Identity UX lifecycle

### Target

Ordine:

```text
utente decline
→ richiesta Stop
→ se ok:
   close modal
   clear confirmed
   close shell
→ se failure:
   modal resta aperta
   errore bounded visibile
```

Questo caso deve avere un test lifecycle dedicato.

---

# 8. Persistent profile: il “full path” non viene realmente costruito

## Esito: drift fra nomi, test utility e caller reale

Il documento afferma:

```text
buildAnalysisSessionUpdate(...)
mantiene separati
profilo inserito nella UI
e percorso completo usato dal backend
```

L'utility supporta effettivamente due input:

```text
chromeProfileInput
fullChromeProfilePath
```

e il relativo test usa un esempio:

```text
Tennis Profile
→ C:/Chrome/User Data/Tennis Profile
```

## Caller corrente

`useLiveTrackingActions()` fa:

```text
fullProfilePath = buildProfilePath(cProfile)
```

ma `buildProfilePath()` nel service esegue soltanto:

```text
(base || '').trim()
```

Quindi non costruisce:

- parent path;
- profile name;
- canonical absolute path.

La differenza fra:

```text
current.chromeProfilePath
confirmed.chromeProfilePath
```

è oggi sostanzialmente:

```text
input raw
vs
input trim
```

## Stato `chromeProfileName`

`useAnalysisSessionState()` mantiene:

```text
chromeProfileName
confirmedChromeProfileName
```

ma:

- `StartAnalysisPanel` non mostra un input per `chromeProfileName`;
- `handleSearch` riceve `_cProfileName` e lo ignora;
- `applySearchSession` non aggiorna `confirmedChromeProfileName`;
- `App.jsx` non usa `confirmedChromeProfileName`.

È quindi stato legacy/dead nel flusso corrente.

## Finding `FRONT-SESSION-008` — riallineare il modello Persistent profile

**Priorità:** media  
**Tipo:** session state cleanup

### Scelta A — path diretto

Se l'utente inserisce direttamente la cartella completa:

```text
rinominare il contratto
→ profileDir/path diretto
→ buildProfilePath = normalize/trim
```

e rimuovere:

```text
chromeProfileName
confirmedChromeProfileName
```

se non servono.

### Scelta B — base + profile name

Se il target vuole davvero costruire un full path:

```text
implementare composizione esplicita
→ testarla
→ usarla sia login sia tracking
```

### Coordinamento

Resta distinto dal problema di physical-profile authority registrato in:

```text
BETFAIR-LIFE-003
```

---

# 9. Persistence integrity è letta dagli hook ma non posseduta dalla shell

## Esito: limite reale correttamente dichiarato, ma va trasformato in task

Il documento descrive correttamente lo stato corrente:

```text
useMatchPolling
→ integrity disponibile

useBetfairJson
→ integrity disponibile

App.jsx
→ non destruttura integrity

useDashboardViewModel
→ non riceve integrity

shell
→ nessun persistence view state uniforme
```

Questa non è una falsità documentale.

È un gap funzionale reale.

## Perché è rilevante nella shell

Il frontend possiede già più superfici:

- Overview;
- TopBar;
- Betfair;
- Market Reactions;
- Source Identity.

Senza un controller uniforme, la stessa condizione:

```text
partial_persistence
recovery_failed
```

può essere visibile in una superficie e assente in un'altra.

Il frontend non deve però leggere direttamente:

- journal;
- history;
- timeline storage.

## Finding `FRONT-SESSION-009` — introdurre un persistence integrity view state unico

**Priorità:** alta  
**Tipo:** frontend integrity presentation

### Target

`App.jsx` o un hook owner dedicato deve ricevere gli status già normalizzati dagli hook/API e produrre un view state unico e read-only.

Il controller deve distinguere:

```text
partial_persistence
recovery_failed
no_known_partial
unknown/unavailable
```

senza:

- recovery;
- filesystem;
- journal parsing.

### Coordinamento

Allineare con gli owner API/Runtime già auditati.

---

# 10. Verification e validation history non coprono il lifecycle che il documento possiede

## Esito: matrice di verifica insufficiente

La sezione Verifica elenca test utili per:

- Match polling;
- Source Identity presentation;
- session-state utility;
- request builder;
- dashboard mapping;
- Money Flow frontend.

Ma i principali owner lifecycle del documento non hanno un test diretto nel path naturale:

```text
frontend/src/hooks/useLiveTrackingActions.test.mjs
→ assente

frontend/src/hooks/useDashboardBootstrapState.test.mjs
→ assente

frontend/src/hooks/useSourceIdentityGateUi.test.mjs
→ assente
```

## Casi critici non coperti direttamente

```text
applySearchSession prima di /track
/track failure
rollback confirmed state
polling residuo dopo Start failure
old persisted backendData durante bootstrap
dashboard unlock prima del gate
confirmation POST ok + refresh pending/null
decline Stop failure
profileName legacy state
persistence integrity wiring
```

## Validation history

Il documento contiene inoltre:

```text
Verifica manuale completata
```

con una sequenza live di:

- Start;
- recording/aligned;
- mismatch;
- restart.

Esiste già un owner validation Source Identity dedicato.

Lo storico di collaudo non deve diventare un secondo contratto permanente dentro il modulo frontend.

## Finding `FRONT-SESSION-010` — aggiungere test lifecycle e separare la validation storica

**Priorità:** alta  
**Tipo:** verification ownership

### Test da aggiungere

Almeno:

```text
useLiveTrackingActions
useDashboardBootstrapState
useSourceIdentityGateUi
```

oppure una suite React/integration equivalente che copra insieme il lifecycle.

### Validation

Nel documento owner mantenere:

```text
stato corrente
test automatici
limiti correnti
link alla validation
```

e spostare/ridurre il racconto dei collaudi storici.

### Non dichiarare

Non promuovere una validazione storica senza SHA/ambiente a PASS del checkpoint corrente.

---

# 11. CDP effective URL

## Esito: sostanzialmente coerente

`normalizeCdpStateValue()` viene usato dal session state.

`selectCdpUrl()` distingue:

```text
property current presente
→ current vince anche se empty

altrimenti confirmed
```

Quindi il principio:

```text
empty current
≠ fallback implicito a confirmed/default
```

è implementato per CDP.

`startMatchTracking()` richiede inoltre un CDP URL valido quando:

```text
betfairMode === cdp
```

e non introduce un endpoint di default.

Questa parte può restare.

## Nota

La validazione condivisa degli URL Betfair/CDP/Graph resta posseduta dai finding API/Preflight già registrati.

---

# 12. Session state current/confirmed

## Esito: struttura utile ma naming da leggere con `FRONT-SESSION-002`

La separazione è reale:

```text
current
confirmed
```

e `clearConfirmedSession()` non cancella gli input current.

Questo comportamento è utile per:

```text
mismatch
→ ritorno al form
→ campi preservati
```

La criticità non è la separazione.

È il momento in cui lo stato diventa:

```text
confirmed
```

La nomenclatura deve essere allineata alla session activation authority.

---

# 13. Mismatch

## Esito: frontend flow sostanzialmente coerente

Quando il live gate passa a:

```text
mismatch
```

`useSourceIdentityGateUi()`:

- crea toast danger;
- ferma Sofa polling;
- pulisce confirmed session;
- chiude la confirmation;
- chiude shell;
- riporta `activeView` a overview;
- resetta bootstrap.

La pulizia del confirmed eventId provoca anche il teardown dei consumer event-scoped.

Il backend mismatch ownership/process cleanup appartiene agli owner Source Identity/Betfair lifecycle e non viene duplicato qui.

---

# 14. Stop Live Tracking

## Esito: semantica corrente correttamente documentata

`handleStopLiveTracking()`:

```text
POST stop
→ se ok
→ Stop status success
→ stop Sofa polling
→ trackingStopped true
```

Non:

- chiude shell;
- cancella confirmed session;
- svuota dashboard;
- cancella snapshot persistiti.

Questo spiega perché Betfair/Evidence/Source Identity possono restare montati.

La semantica è deliberatamente diversa da:

```text
stopAndReturnToLinks()
```

che, dopo successo, torna invece al form e pulisce confirmed state.

Il documento può mantenere questa distinzione.

### Limite

Il contratto degli errori Stop va corretto tramite:

```text
FRONT-SESSION-005
```

---

# 15. Source Identity live come authority UI

## Esito: corretto

`App.jsx` usa:

```text
useSourceIdentityGateStatus(sofaEventId, {
  enabled: sessionShellVisible
})
```

La presentazione deriva dal live status.

Non usa:

```text
Evidence sourceIdentity
```

come authority del gate UI.

Questo è coerente con il documento e con la separazione definita negli owner Evidence.

---

# 16. Waiting screen

## Esito: rendering corretto, readiness authority da correggere

La shell viene renderizzata quando:

```text
sessionShellVisible
```

è true.

Il contenuto centrale mostra:

```text
renderContent()
```

solo se:

```text
dashboardContentReady
AND
dashboardData
```

altrimenti mostra:

```text
SourceIdentityGateWaitingScreen
```

Questa struttura è corretta.

La criticità non riguarda il rendering, ma la definizione di:

```text
dashboardContentReady
```

trattata in `FRONT-SESSION-004`.

---

# 17. Legacy Strategy views

## Esito: stato documentale corretto

Sono ancora presenti le view:

```text
lay
banca
superbreak
```

e il documento le marca:

```text
legacy Strategy, deprecata
```

Questo è coerente con l'audit Strategy precedente.

La loro rimozione è già posseduta da:

```text
CODE-001
STRATEGY-API-008
ARCH-BOUND-001
```

Non viene creato un nuovo change ID duplicato.

Quando la rimozione verrà applicata, questo documento dovrà essere aggiornato nella stessa task.

---

# 18. Logging runtime frontend

## Esito: coerente

`frontendRuntimeLog()`:

- accetta livelli allow-list;
- normalizza event code;
- consente soltanto:
  - `code`;
  - `status`;
  - `source`;
- richiede token statici;
- non serializza oggetti Error raw.

La descrizione del documento è coerente.

---

# 19. Mojibake nel form

## Esito: già registrato

`StartAnalysisPanel.jsx` contiene ancora:

```text
ModalitÃ  sessione Betfair
```

Il problema è già registrato in:

```text
PREFLIGHT-API-008
```

Non viene creato un change ID duplicato.

---

# 20. Lunghezza, integrità del contesto e modularizzazione

## Valutazione

```text
Righe: 464
Responsabilità primaria: session lifecycle e shell frontend
Sottotemi:
- state current/confirmed
- Start/Stop/Login
- shell readiness
- Source Identity UI
- navigation
- persistence presentation
- boundaries

Dipendenza reciproca: alta
Owner specialistici collegati: sì
Contesti realmente indipendenti da separare: no
Duplicazione storica: presente nella verifica manuale
Nuovi documenti canonici necessari: no
Suddivisione richiesta: no
```

Il documento è lungo, ma la sua responsabilità è chiara:

```text
come nasce, vive e termina una sessione frontend
e come la shell rappresenta tale lifecycle
```

Separare:

```text
start-stop.md
source-identity-ui.md
shell-navigation.md
```

rischierebbe di nascondere proprio le relazioni che oggi devono essere corrette:

```text
Start
→ confirmed state
→ poller activation
→ gate
→ bootstrap
→ dashboard
→ Stop/mismatch
```

Il codice è già distribuito in hook/componenti specialistici.

Il documento deve restare il facade del lifecycle frontend.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-020
Percorso report: Report documentale/20 - 01-session-shell.md
Documento: docs/tennis-decision-ui/modules/frontend/01-session-shell.md
Change ID: FRONT-SESSION-001
Change ID: FRONT-SESSION-002
Change ID: FRONT-SESSION-003
Change ID: FRONT-SESSION-004
Change ID: FRONT-SESSION-005
Change ID: FRONT-SESSION-006
Change ID: FRONT-SESSION-007
Change ID: FRONT-SESSION-008
Change ID: FRONT-SESSION-009
Change ID: FRONT-SESSION-010
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 018, 019 e 020 se non ancora recepiti
→ indice 20 ANALIZZATO
→ Divisione non necessaria
→ aggiungere FRONT-SESSION-001..010

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-020
→ appendere soltanto le nuove task
→ preservare integralmente il ledger precedente
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `FRONT-SESSION-001` — Preflight advisory semantics

**Priorità:** high

- dichiarare che il Preflight non è un gate;
- coordinare `PREFLIGHT-API-005`;
- se il target cambia, implementare il gate con test;
- evitare una sequenza documentale che suggerisca authorization inesistente.

## `FRONT-SESSION-002` — transactional session activation

**Priorità:** critical

- non promuovere la sessione a confirmed/active prima del successo `/track`;
- oppure rollback completo su failure;
- impedire che una failure lasci confirmed state;
- coordinare con `IMPL-006`.

## `FRONT-SESSION-003` — sessionActive authority for pollers

**Priorità:** critical

- introdurre una authority comune per gli effetti session-scoped;
- impedire polling residuo dopo Start failure;
- separare presenza URL da sessione attiva;
- lasciare i dettagli stale-response al prossimo owner polling.

## `FRONT-SESSION-004` — dashboard bootstrap authority

**Priorità:** critical

- non usare soltanto reset + `backendData` non-null;
- legare readiness alla sessione corrente;
- impedire che dati persistiti precedenti sblocchino un nuovo Start;
- coordinare con trackingSessionId/IMPL-006.

## `FRONT-SESSION-005` — action/error contract

**Priorità:** high

- risultati bounded comuni per Start/Login/Stop;
- stato UI dedicato per Start failure;
- preservare code login strutturato;
- parsing Stop safe;
- nessun raw error message non necessario.

## `FRONT-SESSION-006` — confirmation live outcome

**Priorità:** high

- non trattare `payload.ok` come sinonimo di recording;
- verificare live gate dopo POST;
- non chiudere modale su refresh null/pending/error;
- coordinare SOURCE-ID-003/004/006.

## `FRONT-SESSION-007` — decline/Stop atomicity

**Priorità:** high

- chiudere la modale soltanto dopo Stop riuscito;
- preservare errore se Stop fallisce;
- lasciare sessione/pending UI coerente;
- aggiungere test.

## `FRONT-SESSION-008` — Persistent profile model cleanup

**Priorità:** medium

- allineare `buildProfilePath` al significato reale;
- decidere path diretto vs base+profileName;
- rimuovere `chromeProfileName` legacy se inutilizzato;
- coordinare con BETFAIR-LIFE-003.

## `FRONT-SESSION-009` — persistence integrity shell state

**Priorità:** high

- introdurre un view state read-only uniforme;
- usare integrity già ricevuta dagli hook;
- non leggere journal/storage lato frontend;
- rendere coerente la presentation cross-view.

## `FRONT-SESSION-010` — lifecycle verification ownership

**Priorità:** high

- aggiungere test per live tracking actions;
- aggiungere test bootstrap state;
- aggiungere test Source Identity gate UI;
- coprire Start failure/rollback/confirmation/decline;
- spostare la validation manuale storica nell'owner validation.

---

# Ordine consigliato di applicazione

```text
1. IMPL-006 / FRONT-SESSION-002 — session activation authority
2. FRONT-SESSION-003 — poller/sessionActive
3. FRONT-SESSION-004 — dashboard bootstrap authority
4. FRONT-SESSION-006 — confirmation live outcome
5. FRONT-SESSION-007 — decline/Stop atomicity
6. FRONT-SESSION-005 — action/error contract
7. FRONT-SESSION-010 — lifecycle test coverage
8. FRONT-SESSION-009 — persistence integrity view state
9. FRONT-SESSION-008 — profile model cleanup

---

# Esito implementazione successiva

Le task `FRONT-SESSION-002`–`FRONT-SESSION-010` sono state applicate e verificate.

```text
Start transazionale: completato
authority sessionActive/trackingSessionId: completata
bootstrap session-bound: completato
contratti bounded Start/Login/Stop: completati
verifica live dopo conferma Source Identity: completata
decline subordinato allo Stop: completato
stato chromeProfileName legacy: rimosso
persistence view state read-only: completato
suite lifecycle dedicate: aggiunte
```

Verifiche eseguite:

```text
22 suite frontend: PASS
frontend production build: PASS
documentation links: PASS
registry consistency: PASS
```

`npm.cmd run lint` non ha analizzato i sorgenti perché il progetto non contiene una configurazione ESLint. Nessuna operazione Git è stata eseguita.
10. FRONT-SESSION-001 — Preflight wording/target
11. revisione mirata 01-session-shell.md
12. checker documentali
13. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

---

# Verifica prevista dopo un’eventuale modifica

## Start success

```text
current config
→ Start pending
→ /track ok
→ active/confirmed session
→ poller session-scoped
→ gate collecting
→ bootstrap
→ dashboard
```

## Start failure

```text
current config
→ /track failure
→ form visibile
→ error bounded visibile
→ sessionActive false
→ nessun confirmed state stale
→ nessun polling residuo
→ dashboard bootstrap reset
```

## Persisted old data

Con timeline già presente per lo stesso eventId:

```text
new Start
→ old /json leggibile
→ non deve da solo sbloccare la nuova dashboard
```

## Source Identity confirm

```text
pending
→ POST confirm
→ refresh recording/aligned
→ close modal
→ success
```

Failure:

```text
POST ok ma gate pending/null/error
→ no falso success
→ modale/stato coerente
```

## Decline

```text
pending
→ decline
→ Stop success
→ close modal
→ clear confirmed
→ form
```

Stop failure:

```text
→ modale resta disponibile
→ error bounded
→ nessun falso ritorno al form
```

## Persistent profile

Verificare il modello scelto:

```text
input path diretto
oppure
base + profile name
```

senza stato inutilizzato.

## Preflight

Testare esplicitamente:

```text
checks failing
→ Start consentito
```

se resta advisory,

oppure:

```text
checks failing
→ Start bloccato
```

se viene approvato il gate.

Non lasciare comportamento implicito.

## Persistence integrity

```text
no_known_partial
partial_persistence
recovery_failed
unknown
```

devono produrre un view state coerente senza storage read frontend.

## Verification

Aggiungere test lifecycle/integration per:

```text
useLiveTrackingActions
useDashboardBootstrapState
useSourceIdentityGateUi
```

oltre alle utility pure già esistenti.

## Documentazione

```bash
npm run build
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Non usare `npm run lint` finché il repository non possiede una configurazione ESLint effettiva.

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
01-session-shell.md: OWNER UTILE, MA "CONFIRMED SESSION" NON È ANCORA UNA SESSION AUTHORITY

Ownership hook/componenti: buona
current vs confirmed state: implementata
CDP empty semantics: corretta
shell immediate rendering: corretta
Source Identity live authority: corretta
mismatch → form: corretto
Stop keeps persisted data: corretto
frontend runtime log allow-list: corretto

Preflight gate: non esiste
confirmed state before /track success: presente
polling before /track success: possibile
polling after /track failure: possibile
Start failure rollback: incompleto
dashboard readiness session-bound: no
old persisted data bootstrap isolation: insufficiente
Start error user feedback: insufficiente
confirmation ok → recording: non garantito
decline modal closure: prematura
full profile path construction: non reale
chromeProfileName state: legacy/dead
uniform persistence state: non implementato
lifecycle tests: insufficienti
manual validation inline: da separare

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: critica
```

Il documento deve restare l'owner unico del lifecycle della shell.

La correzione centrale è distinguere in modo formale:

```text
configurazione inserita
≠ configurazione pending Start
≠ sessione backend attiva
≠ dati persistiti già disponibili
≠ dashboard della nuova sessione pronta
```

Finché queste cinque condizioni sono rappresentate indirettamente da URL confermati, presenza di `backendData` e visibilità della shell, il frontend resta vulnerabile a race di lifecycle e a riuso involontario dello stato di una sessione precedente.

> Aggiornamento successivo: le criticità operative elencate in questa decisione storica sono state risolte con l'implementazione e la verifica di `FRONT-SESSION-002`–`FRONT-SESSION-010`. Il contratto corrente è descritto nel documento canonico riscritto.
