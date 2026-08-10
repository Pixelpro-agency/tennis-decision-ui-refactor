# Report documentale — `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-068
Sequenza audit: 68/72
Documento analizzato: implementazioni/implementazioni-proposte/05-frontend-session-polling.md
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
Ultimo HEAD verificato nel ciclo: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 92d37210cf92f9b8a1a64cdcc50d5456e1c49b6c
Dimensione documento: 605 righe
Perimetro dichiarato: IMPL-025…027
Tipo: registro owner — frontend live-session, polling runtime e Market Reactions view model
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md

frontend/src/App.jsx
frontend/src/hooks/useAnalysisSessionState.js
frontend/src/hooks/useLiveTrackingActions.js
frontend/src/hooks/useMatchPolling.js
frontend/src/hooks/useBetfairJson.js
frontend/src/hooks/useMarketReactionEvidence.js
frontend/src/hooks/useSourceIdentityGateStatus.js

frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/marketReactions/MarketLedObservationCard.jsx
frontend/src/components/marketReactions/FieldLedReactionCard.jsx

backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/singleTick.js
```

Sono stati coordinati, senza duplicarli:

```text
IMPL-006
IMPL-009
IMPL-023
IMPL-024

FRONTEND-001…012
DOC-018
DOC-028…030

TEST-044…059

AUDIT-CODE-P7-001
IMPL-BASE-001
IMPL-EVIDENCE-001
```

GitHub non è stato modificato.

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 069: NON analizzato
```

---

# 1. Esito sintetico

```text
IMPL-025:
APPROVATA
PRIORITÀ CRITICA
NON COMPLETATA
MA STRUTTURA NON È “COMPLETAMENTE ASSENTE”

IMPL-026:
APPROVATA
PRIORITÀ CRITICA
NON COMPLETATA
MA STRUTTURA NON È “COMPLETAMENTE ASSENTE”

IMPL-027:
APPROVATA
PRIORITÀ ALTA
NON COMPLETATA
MA STRUTTURA NON È “COMPLETAMENTE ASSENTE”

Todo ↔ owner:
COERENTE

False completion:
NESSUNA

False total absence:
SÌ — 025, 026 e 027

Frontend session state primitives:
PRESENTI

Start/Stop action owner:
PRESENTE

Polling primitives:
PRESENTI MA NON UNIFORMI

Abort/session/request protection:
PRESENTE SOLO IN ALCUNI POLLER

Market Reactions UI:
PRESENTE

Market Reactions dedicated view model:
ASSENTE

Integrity propagation completa:
ASSENTE

Nuovi bug runtime/frontend:
0

Nuovi finding registry:
1

Nuove task:
1

Split:
NON necessario
```

Conclusione:

```text
IL REGISTRO 068
HA STATI GLOBALI CORRETTI:

025 OPEN
026 OPEN
027 OPEN.

NON ESISTE
UNA FALSE COMPLETION.

MA È TROPPO FORTE
LA FORMULA:

“STRUTTURA COMPLETAMENTE ASSENTE”.

PER 025 ESISTONO GIÀ:

- current/confirmed session inputs;
- session shell;
- Start/Stop action hook;
- dashboard bootstrap;
- trackingStopped;
- Source Identity UI state.

PER 026 ESISTONO GIÀ:

- timeout polling;
- endpoint-specific HTTP classification;
- integrity state;
- requestId/session counter;
- AbortController;
- single-active-fetch;
- schedule-after-response;

MA QUESTE PROTEZIONI
SONO DISTRIBUITE
E NON CONDIVISE.

PER 027 ESISTONO GIÀ:

- Evidence hook;
- MarketReactionsPage;
- Market-led card;
- Field-led card;
- loading/error/no-snapshot states;
- causality copy;

MA NON ESISTE
IL VIEW MODEL APPROVATO.

SERVE UNA SOLA TASK:

IMPL-FRONTEND-001
→ registrare le primitive correnti
  e il contratto residuo
  per 025/026/027.

NON VANNO CAMBIATI:

- approval;
- priority;
- ordine approvato;
- TEST-044…059;
- owner FRONTEND/DOC esistenti.

NESSUNO SPLIT.
```

---

# 2. Perimetro

Il documento contiene:

```text
IMPL-025
Frontend live-session controller

IMPL-026
Polling runtime session-scoped

IMPL-027
Market Reactions frontend view model
```

Range corretto.

---

# 3. Todo — stati correnti

La Todo registra:

```text
IMPL-025
→ APPROVATA
→ PRIORITÀ CRITICA

IMPL-026
→ APPROVATA
→ PRIORITÀ CRITICA

IMPL-027
→ APPROVATA
→ PRIORITÀ ALTA
```

Il registro è coerente
su approval e priority.

---

# 4. TEST-ID

La Todo mantiene:

```text
TEST-044…059
→ MANCANTI
```

per i requisiti frontend
del nuovo contratto.

Nessun TEST-ID
va promosso in questo audit.

---

# 5. Problema comune alle tre card

Tutte dichiarano:

```text
Stato:
STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA
```

La parte:

```text
APPROVATA
```

è corretta.

La parte:

```text
COMPLETAMENTE ASSENTE
```

non descrive più
il codice corrente.

---

# 6. IMPL-025 — current primitives

`App.jsx`
possiede già
una composizione session-oriented
con:

```text
confirmedUrl
confirmedBetfairUrl
sessionShellVisible
trackingStopped
dashboardContentReady
activeView
Source Identity state
stop status.
```

Sono proprio
gli stati distribuiti
che la card vuole consolidare.

---

# 7. `useAnalysisSessionState` è una primitive reale

Il hook distingue:

```text
input corrente
vs
valori confirmed.
```

Gestisce:

```text
matchUrl / confirmedUrl
Betfair URL
graph URLs
mode
Chrome profile
CDP URL.
```

Quindi non si parte da zero.

---

# 8. Ma `confirmed` non equivale a sessione backend accettata

`applySearchSession(...)`
scrive i valori confirmed
prima di conoscere
la risposta Start backend.

Questa è una distinzione
centrale di IMPL-025.

---

# 9. `useLiveTrackingActions` centralizza già Start e Stop

Current:

```text
handleSearch
stopAndReturnToLinks
handleStopLiveTracking.
```

È un owner operativo
parziale.

---

# 10. Start current anticipa la sessione

Sequenza corrente:

```text
applySearchSession(...)
reset Source Identity UI
activeView overview
sessionShellVisible = true
trackingStopped = false
beginDashboardBootstrap()
→ poi await startMatchTracking(...)
```

Quindi:

```text
UI/session state
precede l’accettazione backend.
```

---

# 11. Fallimento Start ha cleanup parziale

Current catch:

```text
resetDashboardBootstrap()
sessionShellVisible = false
runtime log.
```

Ma non esiste
un state machine:

```text
starting
error
accepted session
stale command
compensating cleanup.
```

---

# 12. trackingSessionId frontend assente

Il current state
non possiede:

```text
trackingSessionId
startCommandId
stopCommandId
confirmCommandId.
```

Quindi IMPL-025
resta realmente aperta.

---

# 13. eventId frontend non viene ancora assunto dalla risposta Start

`App.jsx`
deriva:

```text
sofaEventId
=
getSofaEventId(confirmedUrl).
```

Quindi il parser URL
resta authority pratica
dell’eventId frontend.

Il contratto IMPL-025
vuole invece:

```text
eventId
dalla response Start.
```

---

# 14. Stop current ha primitive reali

Current:

```text
stopMatchTracking(...)
stopSofaPolling()
trackingStopped=true
```

e in ritorno al form:

```text
clearConfirmedSession
sessionShellVisible=false
reset dashboard.
```

Quindi Stop
non è completamente assente.

---

# 15. Ma Stop non ha il nuovo state contract

Mancano:

```text
stopping
stopped_static
stop_partial
snapshotMode
lastVerifiedSnapshot
cleanup summary bounded.
```

---

# 16. Snapshot frozen non è ownerizzato

Il frontend può conservare
dati React già presenti,
ma non esiste
un contratto esplicito:

```text
currentSnapshot
lastVerifiedSnapshot
snapshotMode=frozen.
```

Quindi il comportamento
non va promosso a IMPL-025.

---

# 17. Current status corretto IMPL-025

```text
APPROVATA
NON COMPLETATA

Primitive correnti:
- current/confirmed session input;
- session shell;
- Start/Stop action hook;
- dashboard bootstrap;
- trackingStopped;
- Source Identity UI.

Manca:
- single live-session state machine;
- backend accepted identity;
- trackingSessionId;
- command identity;
- stale response rejection;
- canonical eventId from backend;
- stop_partial;
- frozen/degraded snapshot contract.
```

---

# 18. IMPL-026 — poller già esistenti

Current frontend
possiede almeno:

```text
useMatchPolling
useBetfairJson
useMarketReactionEvidence
useSourceIdentityGateStatus.
```

Quindi il polling runtime
non è una struttura assente.

---

# 19. `useMatchPolling` — primitive presenti

Ha:

```text
poll timeout
shouldPoll ref
isPolling
stopPolling
resumePolling
endpoint-specific HTTP classifier
integrity state.
```

---

# 20. Ma Sofa poller non ha session isolation approvata

Manca:

```text
trackingSessionId-based sessionKey
requestId
AbortController
single active request
disposed guard.
```

---

# 21. `useMatchPolling` scheduling

Il loop:

```text
if shouldPoll
→ await fetchData
→ setTimeout(loop)
```

ha almeno
schedule-after-response.

Questa è una primitive
da preservare.

---

# 22. `useBetfairJson` — primitive presenti

Ha:

```text
poll timeout
shouldPoll
stop/resume
HTTP 409 integrity handling
latest→JSON fallback
integrity state
reset on event/url change.
```

---

# 23. Betfair poller parte automaticamente

`useEffect(...)`
fa:

```text
shouldPoll = true
setIsPolling(true)
fetchData(false)
```

su:

```text
sofaEventId
url
fetchData
pollingInterval.
```

Non esiste
un `enabled`
derivato da:

```text
session accepted
+
Betfair configured
+
session live.
```

---

# 24. Sofa-only policy non è garantita dal poller Betfair

`fetchLatestCompact`
blocca soltanto se manca:

```text
sofaEventId.
```

Non se manca
la configurazione Betfair.

Quindi TEST-057
resta motivato.

---

# 25. `useMarketReactionEvidence` ha già molte primitive IMPL-026

Current:

```text
sessionId ref
requestId monotono
AbortController
single active fetch
old session rejection
clear timeout
schedule after response.
```

Questa è evidence
importante da preservare.

---

# 26. Evidence poller non usa la trackingSessionId reale

Il suo `sessionId`
è un contatore locale
incrementato su:

```text
eventId change / cleanup.
```

Non è:

```text
trackingSessionId backend.
```

Quindi non chiude IMPL-026.

---

# 27. `useSourceIdentityGateStatus` ha anch’esso primitive robuste

Current:

```text
sessionIdRef
requestIdRef
AbortController
single active promise
disposed flag
enabled
schedule-after-response
abort on cleanup.
```

---

# 28. Source Identity poller è il modello più vicino al nuovo runtime

È una buona primitive
da generalizzare.

Non deve essere
riscritta da zero
senza necessità.

---

# 29. Ma manca una primitive condivisa

Oggi la logica
è duplicata/differente
fra i quattro hook.

Non esiste:

```text
shared polling runtime
enabled
sessionKey
requestId
AbortController
single request
retain policy
HTTP classifier injection.
```

---

# 30. Market Reactions polling current non è active-view scoped

`App.jsx`
chiama sempre:

```text
useMarketReactionEvidence(sofaEventId)
```

indipendentemente da:

```text
activeView.
```

Il contratto IMPL-026
vuole:

```text
Evidence polling
solo quando
activeView = market-reactions.
```

---

# 31. Stop current non sospende esplicitamente tutti i poller

`useLiveTrackingActions`
riceve:

```text
stopSofaPolling
```

ma non:

```text
stopBetfairPolling
stopEvidencePolling
stopGatePolling.
```

Quindi TEST-048
resta aperto.

---

# 32. Gate polling dipende almeno da sessionShellVisible

Current:

```text
enabled: sessionShellVisible
```

È una primitive utile.

Ma:

```text
shell visible
≠
accepted live session.
```

---

# 33. Retain policy è ancora distribuita

Ogni hook
decide autonomamente:

```text
clear data
retain data
integrity behavior.
```

Non esiste
la policy dichiarativa:

```text
clear_on_new_session
retain_last_verified_on_stop
mark_degraded_on_integrity.
```

---

# 34. StrictMode owner comune assente

Alcuni hook
hanno buone guardie.

Ma non esiste
una primitive condivisa
che garantisca
una sola catena corrente
per tutti i poller.

TEST-058
resta aperto.

---

# 35. Current status corretto IMPL-026

```text
APPROVATA
NON COMPLETATA

Primitive correnti:
- timeout polling;
- schedule-after-response;
- endpoint HTTP classifiers;
- integrity state;
- Abort/session/request guard
  in Evidence e Source Identity.

Manca:
- shared polling primitive;
- trackingSessionId sessionKey;
- uniform AbortController;
- uniform single active request;
- active-view gate;
- Sofa-only Betfair disable;
- full Stop disable;
- declarative retain policy;
- uniform StrictMode guarantee.
```

---

# 36. IMPL-027 — UI Market Reactions esiste

Current:

```text
useMarketReactionEvidence
MarketReactionsPage
MarketLedObservationCard
FieldLedReactionCard.
```

Quindi:

```text
STRUTTURA COMPLETAMENTE ASSENTE
```

non è corretto.

---

# 37. Page states già presenti

`MarketReactionsPage`
gestisce:

```text
no eventId
loading
error
no snapshot
reasons
evidence present
refresh
last update.
```

Primitive da preservare.

---

# 38. Causalità copy già presente

La pagina mostra:

```text
Temporal proximity only.
Causality not established.
```

Questo boundary
è corretto.

---

# 39. Ma non esiste un view model dedicato

`App.jsx`
passa direttamente:

```text
marketReactionEvidence
loading
error
reasons
...
```

alla pagina.

La pagina
passa direttamente
i branch
alle card.

---

# 40. Hook Evidence perde il wrapper top-level

Current success:

```text
setEvidence(
  payload.latest?.marketReactionEvidence ?? null
)
```

Non conserva:

```text
latest.integrity
latest.sources
latest.persistenceComplete
snapshot completo.
```

Questo conferma
IMPL-027 + IMPL-009.

---

# 41. Card availability è ancora truthy-based

`MarketLedObservationCard`:

```text
<AvailabilityBadge available={!!evidence} />
```

`FieldLedReactionCard`
fa lo stesso.

Quindi:

```text
object present
→ available
```

anche se il branch
può dichiarare:

```text
available:false.
```

---

# 42. Questo è esattamente il problema owner

IMPL-027 vuole:

```text
available:false
non promosso
dalla presenza oggetto.
```

Il gap è current.

---

# 43. Market-led card legge campi non allineati al backend corrente

La card cerca:

```text
src.runnerName
src.amount
src.tier
src.flowClassification.
```

---

# 44. Significant Flow corrente produce altri nomi

Il source flow corrente
usa:

```text
runner
selectionId
observedFlowAmount
absoluteFlowTier
relativeFlowTier
interpretation.
```

Quindi il mismatch
documentato dalla card
è reale.

---

# 45. Field-led card usa ancora `marketResponseObserved`

Current branch/card
mostra:

```text
Market response
```

come observed/not observed.

Il nuovo contract
vuole distinguere:

```text
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation.
```

---

# 46. Provisional/final non è rappresentato

Le card
non possiedono:

```text
provisional
finalForWindow
windowState.
```

Quindi una window aperta
può essere resa
come semplice:

```text
not observed.
```

---

# 47. Integrity blocked state assente

La pagina
non riceve
un view model con:

```text
integrity_blocked
degraded
stale.
```

---

# 48. Current status corretto IMPL-027

```text
APPROVATA
NON COMPLETATA

Primitive correnti:
- Evidence hook;
- page;
- two cards;
- loading/error/reasons;
- refresh;
- causality copy.

Manca:
- dedicated view model;
- full Evidence wrapper;
- integrity context;
- branch availability semantics;
- real schema mapping;
- provisional/final;
- window state;
- degraded/stale/integrity-blocked states.
```

---

# 49. Cleanup Strategy — stato coerente

Il documento dice:

```text
Cleanup già approvato
→ task separata.
```

Current `App.jsx`
importa ancora:

```text
LayTheWinner
BancaServizio
Superbreak
```

e mantiene
le rispettive view.

Quindi cleanup
non è stato falsamente
presentato come completato.

---

# 50. Source Identity legacy cleanup resta reale

`useMarketReactionEvidence`
espone ancora:

```text
confirmSourceIdentity
revokeSourceIdentityConfirmation.
```

Il documento
li classifica correttamente
come cleanup separato.

---

# 51. Preflight extension resta separata

Il 068
non presenta
la fingerprint policy
come implementata.

Nessun overclaim.

---

# 52. IMPL-009 extension resta separata

Il registro
non confonde:

```text
session controller
con
persistence integrity adapter.
```

Ordine:

```text
026
→ 009
→ 027
```

è coerente.

---

# 53. Dependency graph

IMPL-025:

```text
depends on IMPL-006.
```

Coerente.

IMPL-026:

```text
depends on IMPL-006 + 025.
```

Coerente.

IMPL-027:

```text
depends on 023 + 024 + 009.
```

Coerente con il contratto dati.

---

# 54. Nessun dependency finding nuovo

Non emerge
una contraddizione certa
come nei report 065–066.

---

# 55. Ordine §20.2

```text
006
→ 025
→ 026
→ 009
→ 027
→ TEST-044…058
→ cleanup
→ FRONTEND-004
→ FRONTEND-012 + TEST-059.
```

È eseguibile
come sequenza locale
del blocco frontend.

---

# 56. IMPL-FRONTEND-001 — implementation coverage bounded

**Priorità:** HIGH  
**Tipo:** owner state granularity / preserve frontend primitives

## Problema

Le tre card
sono correttamente open,
ma dichiarano:

```text
STRUTTURA COMPLETAMENTE ASSENTE.
```

Questo non rappresenta
il codice corrente.

---

# 57. Azione — IMPL-025

Sostituire con:

```text
Stato:
APPROVATA, NON COMPLETATA

Primitive correnti:
- useAnalysisSessionState;
- current/confirmed config;
- useLiveTrackingActions;
- sessionShellVisible;
- trackingStopped;
- dashboard bootstrap;
- Source Identity UI.

Manca:
- single controller;
- trackingSessionId;
- command identity;
- accepted eventId/backend config;
- stale response guards;
- stopping/stop_partial;
- snapshot mode.
```

---

# 58. Azione — IMPL-026

Sostituire con:

```text
Stato:
APPROVATA, NON COMPLETATA

Primitive correnti:
- existing pollers;
- timeout lifecycle;
- HTTP classifiers;
- integrity state;
- Evidence/Gate AbortController;
- local session/request IDs;
- schedule-after-response.

Manca:
- shared runtime;
- backend trackingSessionId sessionKey;
- uniform abort/single request;
- uniform enabled policy;
- active-view Evidence gate;
- Sofa-only Betfair gate;
- all-poller Stop;
- retain policy;
- shared StrictMode guarantee.
```

---

# 59. Azione — IMPL-027

Sostituire con:

```text
Stato:
APPROVATA, NON COMPLETATA

Primitive correnti:
- Evidence hook;
- MarketReactionsPage;
- two current cards;
- loading/error/reasons/refresh;
- causality copy.

Manca:
- dedicated view model;
- top-level integrity/sources input;
- real schema mapper;
- availability semantics;
- provisional/final;
- window state;
- degraded/stale/integrity-blocked states.
```

---

# 60. Non promuovere le IMPL

Dopo la correzione:

```text
IMPL-025
→ OPEN / CRITICAL

IMPL-026
→ OPEN / CRITICAL

IMPL-027
→ OPEN / HIGH.
```

---

# 61. Non promuovere TEST-044…059

La presenza
di primitive e test legacy
non equivale
alla copertura
dei nuovi acceptance ID.

---

# 62. Primitive async da preservare espressamente

Una futura IMPL-026
non deve perdere:

```text
AbortController
requestId monotono
old-session rejection
single active fetch
disposed guard
schedule-after-response
endpoint-specific HTTP semantics.
```

Dove già presenti.

---

# 63. Non uniformare cancellando semantiche endpoint-specifiche

La primitive condivisa
gestisce lifecycle.

Deve preservare:

```text
Sofa 404 waiting
Sofa/Betfair 409 integrity
Evidence 404 neutral/reasons
Gate 404 no status.
```

---

# 64. Non reintrodurre generic interval polling

I poller più robusti
già usano:

```text
schedule after response.
```

Questa proprietà
va mantenuta.

---

# 65. Non usare local session counter come sostituto della session authority

`sessionId.current`
di un hook
è un guard locale.

Non è:

```text
trackingSessionId
backend-issued.
```

La nuova shared primitive
deve distinguerli.

---

# 66. Non usare `confirmedUrl` come accepted event authority

Il contratto 025
vuole:

```text
eventId
dalla response Start.
```

Questa boundary
va preservata.

---

# 67. Non cancellare la session shell funzionante senza migration plan

`DashboardWorkspace`,
waiting screen,
Source Identity UI
e bootstrap state
sono consumer reali.

Il controller nuovo
deve alimentarli,
non sostituirli
alla cieca.

---

# 68. Non cancellare le card prima del nuovo view model

Le card
sono consumer esistenti.

Il view model
può adattarne props/schema
prima di eventuale refactor visuale.

---

# 69. Dedupe con FRONTEND-001…012

`IMPL-FRONTEND-001`
non crea
nuovi bug frontend.

Le root concrete restano:

```text
FRONTEND-001…012.
```

Questa task
corregge la descrizione
dell’implementation coverage.

---

# 70. Dedupe con DOC-018

DOC-018
possiedeva il mismatch
documentale integrity.

IMPL-027/009
possiedono
la struttura futura.

Nessuna duplicazione.

---

# 71. Dedupe con IMPL-EVIDENCE-001

IMPL-EVIDENCE-001
possiede
primitive backend Evidence
022…024.

IMPL-FRONTEND-001
possiede
primitive frontend
025…027.

Confine netto.

---

# 72. Dedupe con AUDIT-CODE-P7-001

Punto 7
possiede runner/test infrastructure.

Qui:
session/polling/view model.

Non duplicati.

---

# 73. Acceptance criteria — IMPL-FRONTEND-001

```text
[ ] IMPL-025 non dice più “completamente assente”
[ ] IMPL-026 non dice più “completamente assente”
[ ] IMPL-027 non dice più “completamente assente”
[ ] approval/priority invariati
[ ] current primitive list 025 presente
[ ] current primitive list 026 presente
[ ] current primitive list 027 presente
[ ] missing-contract list 025 presente
[ ] missing-contract list 026 presente
[ ] missing-contract list 027 presente
[ ] Evidence/Gate async guards preservate
[ ] local session counter distinto da trackingSessionId
[ ] backend eventId authority preservata come target
[ ] direct-card schema mismatch esplicitato
[ ] TEST-044…059 non promossi
[ ] cleanup Strategy/Source Identity resta separato
[ ] FRONTEND-004/012 restano separati
```

---

# 74. Modularizzazione — valutazione

Dimensione:

```text
605 righe.
```

Non è piccola,
ma i tre owner
sono strettamente concatenati.

---

# 75. Responsibility chain

```text
accepted live session
→ enables/disables pollers
→ produces session-scoped data
→ feeds Market Reactions view model.
```

Separare i tre owner
ridurrebbe poco
il contesto necessario.

---

# 76. Cross-dependency molto alta

Per implementare 026
serve conoscere 025.

Per implementare 027
serve conoscere:

```text
session state
integrity state
polling state.
```

Quindi il modulo
ha una coesione reale.

---

# 77. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 78. Aspetti corretti da preservare — IMPL-025

```text
requested state != accepted state
backend eventId authority
stale command ignored
Stop invalidates live session
snapshot frozen/degraded semantics
components receive derived state
no strategy
no Evidence computation.
```

---

# 79. Aspetti corretti da preservare — IMPL-026

```text
session-scoped requests
requestId monotono
AbortController
one active request
schedule-after-response
endpoint HTTP semantics separate
no polling stopped_static
consumer-defined retain policy.
```

---

# 80. Aspetti corretti da preservare — IMPL-027

```text
available != object truthy
unavailable != not observed
provisional != final
integrity-aware states
causality false
temporal proximity only
no signal
no prediction
no recommendation.
```

---

# 81. Non-finding — hook Evidence già robusto

Questo non chiude IMPL-026.

La sua session identity
è locale,
non backend-issued.

---

# 82. Non-finding — Gate poller già robusto

Stesso principio.

È una buona implementation primitive,
non il runtime condiviso.

---

# 83. Non-finding — `useMatchPolling` ha stopPolling

Stop di un singolo poller
non equivale
a session-wide poller authority.

---

# 84. Non-finding — `useBetfairJson` resetta su event change

Reset locale
non equivale
a stale response rejection
con sessionKey/requestId.

---

# 85. Non-finding — page Market Reactions esiste

La UI esistente
non equivale
al view model approvato.

---

# 86. Non-finding — causality copy presente

È una invariant corretta
da preservare,
non prova di completion.

---

# 87. Non-finding — old Strategy views ancora presenti

Sono già cleanup approvato.

Non creare
un nuovo CODE/CLEANUP ID.

---

# 88. Verifica futura dopo sola correzione registry

```text
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
node scripts/validation/run.mjs fast
git diff --check
```

Non serve
live validation
per la sola correzione
della card owner.

---

# 89. Nuovi finding

```text
IMPL-FRONTEND-001
```

---

# 90. Nuove task runtime

```text
0
```

---

# 91. Nuove task registry/documentazione

```text
1
```

---

# 92. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

---

# 93. Decisione finale

```text
implementazioni/implementazioni-proposte/05-frontend-session-polling.md:

ROLE:
OWNER REGISTRY SOLIDO

PERIMETRO:
IMPL-025…027

DIMENSIONE:
605 RIGHE

IMPL-025:
OPEN
APPROVATA
CRITICA
PARTIAL FRONTEND PRIMITIVES EXIST

IMPL-026:
OPEN
APPROVATA
CRITICA
PARTIAL POLLING PRIMITIVES EXIST

IMPL-027:
OPEN
APPROVATA
ALTA
PARTIAL UI PRIMITIVES EXIST

FALSE COMPLETION:
NO

FALSE TOTAL ABSENCE:
YES

NEW FRONTEND BUG:
NO

PROBLEMA:
IMPLEMENTATION COVERAGE
NON RAPPRESENTATA

CHANGE ID:
IMPL-FRONTEND-001

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ

MODULARIZZAZIONE:
NO
```

---

# 94. Stato audit dopo report 068

```text
Documenti Markdown totali: 72
Analizzati: 68
Da analizzare: 4
Avanzamento: 94,44%
```

Sequenza:

```text
[✓] 066 implementazioni/implementazioni-proposte/03-storage-recovery.md
[✓] 067 implementazioni/implementazioni-proposte/04-evidence-provenance.md
[✓] 068 implementazioni/implementazioni-proposte/05-frontend-session-polling.md
[ ] 069 implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
```

---

# 95. Contatori task

Ultimo consolidamento richiesto:

```text
fino al report 067
→ 345 task note
```

Report 068:

```text
+1
```

Totale provvisorio:

```text
346
```

Non ancora consolidato dopo l’ultimo aggiornamento:

```text
IMPL-FRONTEND-001
```

---

# 96. Stato mappa / JSON

```text
mappa Markdown
→ NON MODIFICATA

ledger JSON
→ NON MODIFICATO
```

---

# 97. Prossimo documento — non analizzato

```text
069
implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
```

---

# 98. Stop operativo

```text
report 068:
COMPLETATO

nuovo Change ID:
IMPL-FRONTEND-001

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 069:
NON ANALIZZATO
```
