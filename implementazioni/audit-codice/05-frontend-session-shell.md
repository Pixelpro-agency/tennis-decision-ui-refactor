> **Parte 5 di 7 — Frontend e session shell**
> Secondo audit — Punto 6: session controller, Start/Stop, polling, integrity UI, Source Identity, Market Reactions UI e stato statico.
> [Indice](../03-audit-codice.md) · [Parte 4](04-evidence-market-reactions.md) · [Parte 6](06-validazione-e-test.md)

## 21. Secondo audit del codice — Punto 6: Frontend

**Baseline:** `9205b5a789a40203c48ba19f8e3397fd0cec9707`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
frontend/src/App.jsx
frontend/src/main.jsx
frontend/src/index.css

frontend/src/hooks/useAnalysisSessionState.js
frontend/src/hooks/useLiveTrackingActions.js
frontend/src/hooks/useDashboardBootstrapState.js
frontend/src/hooks/useDashboardViewModel.js
frontend/src/hooks/useMatchPolling.js
frontend/src/hooks/useBetfairJson.js
frontend/src/hooks/useMarketReactionEvidence.js
frontend/src/hooks/useSourceIdentityGateStatus.js
frontend/src/hooks/useSourceIdentityGateUi.js
frontend/src/hooks/usePreflightChecks.js
frontend/src/hooks/useBetfairHealthAlerts.js
frontend/src/hooks/useBetfairLoginAction.js

frontend/src/services/liveSessionApi.js
frontend/src/utils/analysisSessionState.js
frontend/src/utils/liveSessionRequests.js
frontend/src/utils/preflight.js
frontend/src/utils/dashboardConnections.js
frontend/src/utils/sourceIdentityGatePresentation.js
frontend/src/types/dashboard.js

frontend/src/components/StartAnalysisPanel.jsx
frontend/src/components/DashboardWorkspace.jsx
frontend/src/components/Sidebar.jsx
frontend/src/components/TopBar.jsx
frontend/src/components/OverviewDashboard.jsx
frontend/src/components/BetfairDepthCard.jsx
frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/SourceIdentityGateIndicator.jsx
frontend/src/components/SourceIdentityGateToast.jsx
frontend/src/components/TotManualInputPlaceholder.jsx
frontend/src/components/LayTheWinner.jsx
frontend/src/components/BancaServizio.jsx
frontend/src/components/Superbreak.jsx
frontend/src/components/marketReactions/FieldLedReactionCard.jsx
frontend/src/components/marketReactions/MarketLedObservationCard.jsx
frontend/src/components/marketReactions/SourceIdentityConfirmationModal.jsx
frontend/src/components/marketReactions/SourceIdentityControls.jsx

frontend/src/hooks/useMatchPolling.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/utils/dashboardConnections.test.mjs
frontend/package.json

backend/src/routes/match.js
backend/src/routes/match/trackingResponses.js
backend/src/routes/match/sourceIdentityStatusResponse.js
backend/src/sofa/extractEventId.js
backend/src/sofa/betfairHealth/statusClassification.js

docs/tennis-decision-ui/modules/frontend/01-session-shell.mdx
docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.mdx
docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.mdx
```

L’analisi è statica. Build, test e collaudi responsive non sono stati eseguiti.

### Classificazione usata

Per ogni rilievo sono stati distinti:

```txt
bug confermato
limite noto
miglioria utile
documentazione mancante
struttura completamente assente
nessuna azione necessaria
decisione dell’utente richiesta
```

Le decisioni proposte sono state approvate integralmente dall’utente.

### Parti solide — nessuna azione necessaria

#### Ownership Evidence globale

`App.jsx` monta una sola istanza di `useMarketReactionEvidence(...)` e passa il risultato a `MarketReactionsPage`.

La pagina:

- non crea un secondo poller;
- non avvia tracking;
- non conferma Source Identity;
- non scrive timeline o journal.

Questo ownership deve essere preservato.

#### Polling Gate ed Evidence già protetti

`useSourceIdentityGateStatus(...)` e `useMarketReactionEvidence(...)` possiedono già gran parte del modello corretto:

```txt
session generation
requestId monotono
AbortController
una fetch attiva per sessione
controllo prima di setState
cleanup timeout
```

Questi hook diventano il riferimento da generalizzare, non un’eccezione isolata.

#### Source Identity globale distinta da Evidence

Lo stato Source Identity globale deriva da:

```txt
GET /api/match/:eventId/source-identity-status
```

Non viene ricostruito dal Match Evidence Snapshot.

La separazione tra:

```txt
Source Identity live
Evidence read-only
persistence integrity
Betfair health
```

è corretta e deve restare esplicita.

#### Health Betfair backend-owned

Il frontend riceve lo stato health già classificato dal backend.

`useBetfairHealthAlerts(...)` può gestire:

- transizioni;
- toast;
- audio;

ma non deve cambiare il significato di `green`, `yellow`, `red`, `finished` o `unknown`.

#### Money Flow associato tramite `selectionId`

`BetfairDepthCard.jsx` associa history e runner attraverso `selectionId` stringificato.

Il nome resta una label e non viene usato come identità temporale della serie.

### Ampliamento finale collegato a FRONTEND-001 — Response tardive e fuori ordine attraversano la sessione

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

`useMatchPolling(...)` e `useBetfairJson(...)` non possiedono:

```txt
trackingSessionId
session generation
requestId
AbortController
single-active-request lock
guard prima di ogni setState
```

Una richiesta della sessione A può completarsi dopo Start B e aggiornare:

- snapshot SofaScore;
- dati Betfair;
- health;
- Money Flow history;
- integrity;
- timestamp;
- errori;
- server status.

Due richieste della stessa sessione possono anche completarsi fuori ordine e permettere al payload più vecchio di sovrascrivere quello più recente.

#### Conferma Source Identity tardiva

La conferma usa una closure con `eventId`, ma non riceve né verifica `trackingSessionId`.

Una conferma A in flight può completarsi dopo Start B e avviare un refresh non più appartenente al contesto che l’ha generata.

#### EventId duplicato

Dopo Start, il frontend ricalcola `eventId` dalla URL confermata e ignora l’`eventId` restituito dal backend.

La sessione accettata deve usare soltanto l’identità restituita da Start.

### Ampliamento collegato a FRONTEND-002 — Persistence integrity raccolta ma scartata prima della UI

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

Gli hook SofaScore e Betfair conservano `integrity`, ma `App.jsx` non la estrae né la passa ai consumer.

`useMarketReactionEvidence(...)` conserva soltanto:

```txt
payload.latest.marketReactionEvidence
```

e perde:

```txt
integrity top-level
sources
dataQuality complessiva
metadata dello snapshot
```

`useDashboardViewModel(...)` non riceve le integrity e non produce uno stato persistence.

Mancano quindi:

- stato locale SofaScore;
- stato locale Betfair;
- stato locale Market Reactions;
- indicatore globale in fondo alla sidebar;
- modale persistence;
- rappresentazione distinta di `partial_persistence`, `recovery_failed` e futuro `integrity_unknown`.

#### Ultimo dato su `409`

Quando il polling SofaScore riceve `409`, azzera `backendData`, ma `dashboardData` resta invariato perché il view model aggiorna il proprio stato soltanto con un input truthy.

L’ultimo snapshot può restare visibile, ma deve essere marcato esplicitamente:

```txt
last_verified
frozen
degraded
```

Non deve sembrare un dato live corrente.

### Ampliamento finale collegato a FRONTEND-003 — Start fallito lascia sessione e poller nascosti

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

Il frontend esegue prima:

```txt
applySearchSession
sessionShellVisible = true
trackingStopped = false
beginDashboardBootstrap
```

poi attende `POST /api/match/track`.

Il cambio della configurazione confermata può quindi attivare i poller prima che il backend abbia accettato lo Start.

Se Start fallisce, il codice:

```txt
resetDashboardBootstrap
sessionShellVisible = false
```

ma non:

- cancella la sessione confermata;
- ferma Betfair ed Evidence;
- invalida il comando Start;
- abortisce le request in flight;
- resetta tutti i dati transitori;
- espone un errore Start specifico;
- esegue cleanup compensativo quando la risposta è ambigua.

`sofaError` appartiene al polling timeline e non rappresenta l’errore di `POST /track`.

### FRONTEND-005 — I vecchi loop possono ricrearsi dopo cleanup

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

I loop SofaScore e Betfair seguono:

```txt
await fetchData
→ setTimeout(loop)
```

Se cleanup o cambio sessione avvengono durante la fetch, il timeout noto viene cancellato, ma la vecchia closure può completare e programmarne uno nuovo.

Il ref `shouldPoll` è condiviso dal vecchio e dal nuovo loop. Un nuovo Start che lo riporta a `true` può riattivare anche una closure precedente.

`React.StrictMode` aumenta la necessità di una cleanup idempotente perché in sviluppo monta, pulisce e rimonta gli effect.

### FRONTEND-006 — Start e Stop concorrenti non serializzati

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta

Il pulsante Start è disabilitato tramite `sofaLoading`, che appartiene al polling SofaScore e non al comando Start.

Mancano:

```txt
startPending
commandId
single-flight Start
deduplicazione
invalidazione comando precedente
```

Anche Stop può essere richiamato più volte mentre la prima richiesta è ancora in corso.

### FRONTEND-007 — Stop Live Tracking non crea una modalità statica reale

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

Dopo Stop il frontend esegue soltanto:

```txt
stopSofaPolling
trackingStopped = true
```

Restano attivi:

- polling Betfair;
- polling Evidence;
- polling Source Identity Gate;
- refresh manuale Market Reactions;
- eventuale audio Betfair.

La modalità statica approvata deve significare:

```txt
tutti i poller sospesi
request in flight abortite
nessun nuovo setState live
ultimo snapshot verificato conservato
refresh live disabilitato
audio fermato
```

Inoltre la UI interpreta `ok:true` come Stop completo senza esporre cleanup parziale, `remaining` o errori Python.

### FRONTEND-008 — Indicatori live derivati dalla presenza del dato

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

`dashboardConnections.js` considera SofaScore connected quando esiste `backendData`, senza conoscere:

- stato della sessione;
- Stop;
- integrity;
- snapshot frozen;
- cleanup parziale.

La sidebar mostra quasi sempre `Live Engine Active` o `Dashboard engine active` usando principalmente la health Betfair.

La TopBar mantiene un pallino verde globale animato e assegna lo stile attivo anche a badge come:

```txt
BACKEND: ERR
POLLING: OFF
```

La card Betfair può mostrare `Polling active (5s)` senza ricevere `isPolling` o `trackingStopped`.

#### Decisione approvata

Ogni indicatore deriva dalla stessa state machine della sessione.

La semplice presenza dell’ultimo dato non autorizza le label:

```txt
live
connected
polling active
engine active
```

### FRONTEND-009 — Market Reactions UI promuove rami unavailable e usa campi errati

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

Le card usano:

```jsx
<AvailabilityBadge available={!!evidence} />
```

Il backend può però restituire un oggetto completo con:

```txt
available:false
```

L’oggetto viene quindi mostrato erroneamente come disponibile.

La card Exchange → Field cerca:

```txt
runnerName
amount
tier
flowClassification
```

mentre il contratto backend usa:

```txt
runner
observedFlowAmount
absoluteFlowTier
interpretation
```

Altri problemi:

- `causalityClaimed` cercato nel livello sbagliato;
- array eventi passato a formatter numerico;
- `not observed` usato anche per unavailable, insufficient data o finestra aperta;
- schema vecchio non compatibile con le decisioni del Punto 5.

### FRONTEND-010 — Modale pending non legata al vero contesto Source Identity

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

La pending key contiene soltanto:

```txt
eventId
nomi SofaScore
nomi Betfair
```

Non contiene:

```txt
trackingSessionId
marketId
epoch signature
selectionIds
context revision
```

Un nuovo epoch con gli stessi nomi può quindi non riaprire automaticamente la modale.

#### Decisione approvata

Lo status gate deve esporre un’identità opaca e pubblica del contesto:

```txt
trackingSessionId
sourceIdentityContextId
sourceIdentityRevision
```

La UI non ha bisogno di URL o payload sensibili.

### FRONTEND-011 — Risultati Preflight non legati agli input verificati

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** medio-alta

I check non possiedono:

```txt
input fingerprint
requestId
AbortController
invalidazione al cambio campo
```

Una risposta riferita alla URL A può diventare il risultato verde mostrato accanto alla URL B.

Anche modificare un input dopo un check completato non riporta il relativo stato a `idle` o `stale`.

#### Decisione approvata

Ogni risultato Preflight conserva:

```txt
inputFingerprint
checkedAt
requestId
status
```

Qualsiasi modifica dell’input invalida il risultato precedente.

### FRONTEND-012 — Layout responsive strutturalmente assente

**Classificazione:** `LIMITE NOTO + STRUTTURA ASSENTE`
**Stato:** `TASK SEPARATA CONFERMATA`
**Priorità:** dopo la robustezza

Sono presenti:

```txt
sidebar fissa w-64
root overflow-hidden
TopBar orizzontale non comprimibile
dashboardGrid sempre a due colonne
h-screen rigido
nessuna navigazione mobile
```

La correzione responsive resta separata secondo `DEC-017`.

Non deve essere inclusa nella stessa task di:

- session authority;
- polling;
- integrity;
- cleanup Strategy;
- Market Reactions contract.

### Cleanup legacy confermato

#### Strategy UI

Restano montate e raggiungibili:

```txt
Lay the Winner
Banca Servizio
Superbreak
```

`LayTheWinner` effettua polling verso `http://localhost:3001`.

Le altre due viste mostrano valori statici come:

```txt
Monitoring
Medium
High
92%
```

Non devono essere corrette. Devono essere rimosse secondo `CODE-001` e `DEC-008`, preservando Market Reactions.

#### Source Identity authority legacy

`useMarketReactionEvidence(...)` esporta ancora metodi di conferma/revoca.

`SourceIdentityControls.jsx` conserva una seconda UI legacy non montata.

Dopo ultimo inventario dei consumer vanno rimossi:

```txt
confirmSourceIdentity
revokeSourceIdentityConfirmation
SourceIdentityControls
utility e test esclusivi
```

L’autorità globale resta `useSourceIdentityGateUi(...)`.

#### Mojibake

Restano stringhe renderizzate come:

```txt
ModalitÃ
âEUR”
```

La correzione è circoscritta e resta separata dal refactor sessione/polling.

### Polling non necessario

L’abilitazione dei poller non è centralizzata.

Il polling Betfair può partire con un eventId anche quando Betfair non è configurato.

Evidence continua a essere interrogata anche quando la vista Market Reactions non è aperta.

Policy approvata:

```txt
Sofa
→ sessione accettata e live

Betfair
→ sessione accettata, live e Betfair configurato

Source Identity Gate
→ sessione live con Betfair configurato

Evidence
→ sessione live e vista Market Reactions attiva
→ fetch immediato all’ingresso

stopped_static
→ tutti disabilitati
```

### DOC-028 — Session shell contraddice la session authority approvata

**Classificazione:** `DOCUMENTAZIONE ERRATA`
**Stato:** `CORREZIONE APPROVATA`

`01-session-shell.mdx` descrive come comportamento da preservare:

```txt
applySearchSession prima della risposta Start
```

Documenta inoltre che Betfair, Evidence e Source Identity possono continuare a leggere dopo Stop.

Questi testi contraddicono `DEC-019`.

### DOC-029 — Polling e view model descrivono funzioni non implementate

**Classificazione:** `DOCUMENTAZIONE PIÙ FORTE DEL CODICE`
**Stato:** `CORREZIONE APPROVATA`

`02-live-polling-and-view-model.mdx` dichiara già esistenti:

- propagation Evidence completa;
- adapter persistence;
- view state integrity;
- cleanup session-safe di tutti i poller.

Il codice corrente non implementa questi contratti.

### DOC-030 — UI Betfair e Market Reactions descritta come integrity-aware

**Classificazione:** `DOCUMENTAZIONE PIÙ FORTE DEL CODICE`
**Stato:** `CORREZIONE APPROVATA`

`03-betfair-and-market-reactions-ui.mdx` assegna già a BetfairDepthCard e Market Reactions UI comportamenti integrity-aware che non sono collegati nel runtime attuale.

I documenti vanno aggiornati dopo l’implementazione e non usati come prova del comportamento corrente.

### Strutture completamente assenti

#### Riferimento audit a IMPL-025 — Frontend live-session controller

Owner unico di:

```txt
idle
starting
collecting
pending_confirmation
live
stopping
stopped_static
stop_partial
mismatch
integrity_degraded
error
```

Deve conservare:

```txt
trackingSessionId
commandId
eventId restituito dal backend
requestedConfig
acceptedConfig
currentSnapshot
lastVerifiedSnapshot
snapshotMode
startError
stopResult
```

#### Riferimento audit a IMPL-026 — Polling runtime session-scoped

Primitive condivisa da Sofa, Betfair, Evidence e Gate:

```txt
enabled
sessionKey
requestId
AbortController
single active request
disposed
schedule next after response
retain policy
expected HTTP classifier
```

#### Riferimento audit a IMPL-027 — Market Reactions frontend view model

Adapter presentazionale che produce:

```txt
pageState
marketLedCard
fieldLedCard
availability
provisional
quality
reasons
source event display
windows display
```

Non deve ricalcolare Evidence.

### Test mancanti

#### TEST-044 — Start concorrenti e risposta tardiva

```txt
Start A in flight
→ Start B
→ risposta A ignorata
→ soltanto B accettata
```

#### TEST-045 — Start fallito o ambiguo

```txt
sessione richiesta
→ Start fallisce o risposta incerta
→ sessione confermata rimossa
→ poller fermi
→ cleanup compensativo
→ errore visibile
```

#### TEST-046 — Response vecchie o fuori ordine

```txt
Sofa/Betfair response vecchia
→ nessun setState corrente
```

#### TEST-047 — Cleanup durante fetch

```txt
cleanup
→ resolve fetch precedente
→ nessun nuovo timeout
```

#### TEST-048 — Stop completo

```txt
Sofa/Betfair/Evidence/Gate sospesi
→ ultimo dato frozen
→ audio fermo
```

#### TEST-049 — Stop parziale

```txt
cleanup parziale
→ UI non mostra completato
→ detail pubblico bounded
```

#### TEST-050 — Persistence UI

```txt
partial/recovery_failed/integrity_unknown
→ card locale
→ indicatore globale
→ modale
→ ultimo dato degraded/frozen
```

#### TEST-051 — Identità sessione dalla risposta Start

```txt
eventId + trackingSessionId backend
→ uniche authority dei poller
```

#### TEST-052 — Nuovo contesto Source Identity con stessi nomi

```txt
contextId cambia
→ modale riaperta
→ conferma vecchia ignorata
```

#### TEST-053 — Preflight input-bound

```txt
input cambia durante richiesta
→ vecchio OK ignorato
→ stato stale/idle
```

#### TEST-054 — Market Reactions unavailable

```txt
branch object presente
+ available:false
→ card unavailable
```

#### TEST-055 — Mapping schema Market Reactions reale

```txt
runner
observedFlowAmount
absoluteFlowTier
interpretation
→ campi mostrati correttamente
```

#### TEST-056 — Nessun falso stato live

```txt
stopped/waiting/polling off/integrity/unknown
→ nessun verde o engine active falso
```

#### TEST-057 — Sessione Sofa-only

```txt
Betfair assente
→ nessun polling Betfair/Gate non necessario
```

#### TEST-058 — StrictMode

```txt
mount/cleanup/remount
→ una sola catena polling per sessione
```

#### TEST-059 — Responsive smoke

```txt
desktop/tablet/mobile
→ navigazione, Stop, modali e contenuto raggiungibili
```

### Decisioni approvate

1. implementare il lato frontend di `IMPL-006` attraverso `IMPL-025`;
2. usare soltanto `eventId` e `trackingSessionId` restituiti dallo Start accettato;
3. la shell può mostrare `starting`, ma i poller live partono soltanto dopo accettazione;
4. Start fallito o ambiguo invalida la sessione e usa cleanup compensativo;
5. tutti i poller adottano `IMPL-026`;
6. Stop completo sospende tutti i poller e conserva lo snapshot frozen;
7. Stop parziale resta visibile come parziale;
8. Betfair polling parte soltanto quando Betfair è configurato;
9. Evidence polling parte soltanto quando Market Reactions viene consumata;
10. implementare `IMPL-009` con stato locale e globale;
11. l’ultimo dato può restare visibile ma marcato `last_verified/frozen/degraded`;
12. tutti gli indicatori derivano dalla state machine;
13. Source Identity espone un context ID opaco e la UI pending è session/context scoped;
14. rimuovere l’authority Source Identity legacy da Market Reactions;
15. creare `IMPL-027` per il rendering Market Reactions;
16. legare Preflight al fingerprint dell’input;
17. rimuovere le tre viste Strategy senza correggerle;
18. mojibake e piccole correzioni restano una task autonoma;
19. responsive resta una task separata dopo la robustezza.

### Ordine tecnico risultante

```txt
IMPL-006
→ backend/session contract

IMPL-025
→ frontend live-session controller

IMPL-026
→ polling runtime session-scoped

IMPL-009
→ persistence UI

IMPL-027
→ Market Reactions frontend view model

TEST-044…058
→ cleanup Strategy
→ piccole correzioni/mojibake
→ responsive + TEST-059
→ Punto 7 test e strutture mancanti
```


---
