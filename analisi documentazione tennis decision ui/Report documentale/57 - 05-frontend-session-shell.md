# Report documentale — `implementazioni/audit-codice/05-frontend-session-shell.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-057
Sequenza audit: 57/72
Documento analizzato: 05-frontend-session-shell.md
Percorso documento: implementazioni/audit-codice/05-frontend-session-shell.md
Percorso report: Report documentale/57 - 05-frontend-session-shell.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: fce39f9da7796f29c17bd7f8c3715496afab97dd
Dimensione documento: 910 righe
Tipo: modulo owner dell’audit codice — secondo audit Punto 6 Frontend/session shell
Baseline dichiarata nel documento: 9205b5a789a40203c48ba19f8e3397fd0cec9707
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/implementazioni-proposte/05-frontend-session-polling.md
implementazioni/99-decisioni-utente.md

frontend/src/App.jsx
frontend/src/hooks/useLiveTrackingActions.js
frontend/src/hooks/useMatchPolling.js
frontend/src/hooks/useBetfairJson.js
frontend/src/hooks/useMarketReactionEvidence.js
frontend/src/hooks/useSourceIdentityGateStatus.js
frontend/src/hooks/useSourceIdentityGateUi.js
frontend/src/hooks/useDashboardViewModel.js
frontend/src/hooks/usePreflightChecks.js
frontend/src/hooks/useBetfairHealthAlerts.js
frontend/src/utils/dashboardConnections.js
frontend/src/components/marketReactions/MarketLedObservationCard.jsx
frontend/src/components/marketReactions/FieldLedReactionCard.jsx

backend/src/routes/match/trackingResponses.js
```

Sono stati inoltre coordinati, senza duplicarli:

```text
FRONTEND-001…012
RUNTIME-009
RUNTIME-010
CODE-001
CODE-004
CLEANUP-001
DOC-028
DOC-029
DOC-030
IMPL-006
IMPL-009
IMPL-025
IMPL-026
IMPL-027
TEST-044…059

SOFA-LIVE-001…009
LIVE-CTRL-001…007
METHOD-EVIDENCE-001
PLAN-AUDIT-003
```

GitHub non è stato modificato.

Per richiesta esplicita dell’utente:

```text
NON aggiornare la mappa Markdown
NON aggiornare il ledger JSON
FERMARSI dopo report 057 + ZIP
```

Questo report rispetta il vincolo.

---

# Esito sintetico

```text
Valore tecnico del modulo:                         ALTO
Baseline dichiarata:                               PRESENTE
Analisi statica dichiarata:                        SÌ
Build/test/responsive non eseguiti:                ESPLICITO

Ownership Evidence globale:                        COERENTE
Gate/Evidence async guards:                        REALI ma non tracking-session authority completa
Source Identity vs Evidence separation:            COERENTE
Betfair health backend-owned:                      COERENTE
Money Flow identity selectionId:                   COERENTE

FRONTEND-001…012:                                  COERENTI con Todo
DOC-028…030:                                       COERENTI
IMPL-025:                                          APPROVATA / struttura assente / critica
IMPL-026:                                          APPROVATA / struttura assente / critica
IMPL-027:                                          APPROVATA / struttura assente / alta
TEST-044…059:                                      ANCORA MANCANTI

Current code:
sessione applicata prima di Start accepted:        ancora presente
eventId ricalcolato da URL:                        ancora presente
trackingSessionId frontend:                        ancora assente
Start single-flight/commandId:                     ancora assenti
poller Sofa session-scoped:                        ancora assente
poller Betfair session-scoped:                     ancora assente
Stop tutti i poller:                               ancora assente
audio fermato dopo Stop:                           ancora non garantito
integrity passata al view model:                   ancora assente
snapshot frozen/degraded state:                    ancora assente
Market Reactions polling view-scoped:              ancora assente
Betfair polling config-scoped:                     ancora assente
Gate polling config/session-state scoped:          ancora incompleto
Source Identity context key opaca:                 ancora assente
Preflight fingerprint/requestId:                   ancora assenti
Strategy legacy raggiungibile:                     ancora presente
Market Reactions availability mapping:             ancora errato
Market Reactions backend schema mapping:           ancora errato
responsive structure:                              ancora assente

Contraddizioni interne di stato:                   NESSUNA significativa
Drift priorità vs Todo:                            NESSUNO significativo
False closure:                                     NESSUNA
Nuovo bug runtime:                                 NESSUNO
Nuovo finding documentale:                         NESSUNO
Nuove task:                                        0

Responsabilità del file:                           UNA — frontend live session shell
Dimensione:                                        910 righe
Split:                                             NON necessario
Riscrittura completa:                              NO
Revisione mirata autonoma:                         NO
Nuovi file proposti:                               nessuno
Priorità complessiva del documento:                ALTA come record tecnico
```

Conclusione:

```text
IL PUNTO 6 È ANCORA
UN RECORD TECNICO COERENTE
DELLO STATO FRONTEND.

I FINDING FRONTEND-001…012
NON SONO STATI FALSAMENTE CHIUSI.

IL CODICE CORRENTE
CONFERMA DIRETTAMENTE
LA GRAN PARTE DEI GAP DESCRITTI.

IMPL-025…027
RESTANO APPROVATE
MA NON IMPLEMENTATE.

NON EMERGE UNA NUOVA
ROOT ISSUE AUTONOMA.

NON SERVE UN NUOVO CHANGE ID.

NON SERVE DIVIDERE
IL DOCUMENTO:
SESSION CONTROLLER,
POLLING, INTEGRITY UI,
SOURCE IDENTITY UI
E MARKET REACTIONS UI
SONO CONSUMER DELLA STESSA
SESSION AUTHORITY FRONTEND.
```

---

# 1. Il ruolo del documento è chiaro

Header:

```text
Parte 5 di 7
— Frontend e session shell
```

Perimetro:

```text
session controller
Start/Stop
polling
integrity UI
Source Identity
Market Reactions UI
stato statico.
```

Questa è una responsabilità
frontend coerente.

---

# 2. Il documento contiene un solo audit point

Esiste:

```text
Punto 6 — Frontend
```

con una sola baseline:

```text
9205b5a789a40203c48ba19f8e3397fd0cec9707
```

Non esistono due baseline
o due audit distinti
come nel file 054.

---

# 3. Il tipo di verifica è dichiarato correttamente

Il documento dice:

```text
L’analisi è statica.
Build, test e collaudi responsive
non sono stati eseguiti.
```

Quindi:

```text
audit completed
≠
build PASS
≠
test PASS
≠
responsive validated.
```

Corretto.

---

# 4. `COMPLETATO E APPROVATO` non produce false closure locale

La formula è riferita a:

```text
Secondo audit
Punto 6.
```

Subito sotto il file mantiene:

```text
BUG CONFERMATO
CORREZIONE APPROVATA
STRUTTURA COMPLETAMENTE ASSENTE
TEST MANCANTI
TASK SEPARATA.
```

Quindi non afferma:

```text
frontend corretto.
```

Nessun finding autonomo.

---

# 5. Ownership Evidence globale — claim corretto

`App.jsx` monta:

```text
una sola useMarketReactionEvidence(...)
```

e passa l’evidence
a:

```text
MarketReactionsPage.
```

La pagina non crea
una seconda ownership
del polling Evidence.

Il claim del Punto 6
resta corretto.

---

# 6. Non creare un secondo poller Evidence nella page

Questa invariante
va preservata durante
`IMPL-027`.

Il view model frontend
deve trasformare
il payload già ricevuto,
non creare una nuova fetch authority.

---

# 7. Gate ed Evidence possiedono realmente guard async

`useMarketReactionEvidence(...)`
contiene:

```text
sessionId interno
requestId monotono
AbortController
active fetch lock
guard prima di setState
cleanup timeout.
```

`useSourceIdentityGateStatus(...)`
contiene:

```text
sessionIdRef
requestIdRef
AbortController
active fetch
disposed
schedule-after-response
cleanup.
```

Quindi il documento
non inventa questi meccanismi.

---

# 8. Il termine “session generation” non equivale però a trackingSessionId

La generation interna
di questi hook
è legata soprattutto
al lifecycle dell’effect/eventId.

Non possiede:

```text
trackingSessionId
```

restituito da Start.

Il documento usa però
la formula prudente:

```text
gran parte del modello corretto.
```

e più avanti impone:

```text
tutti i poller
→ IMPL-026.
```

Quindi non considero
questa frase un overclaim
sufficiente per un nuovo finding.

---

# 9. IMPL-026 risolve esplicitamente il limite residuo

Owner corrente:

```text
sessionKey
→ trackingSessionId
+ endpoint purpose.
```

Invarianti:

```text
sessionKey cambia
→ response vecchia ignorata

enabled:false
→ abort
→ clear timeout
→ no reschedule.
```

Quindi:

```text
Gate/Evidence async guards
≠
session authority completa
```

è già rappresentato.

---

# 10. Source Identity globale distinta da Evidence — claim corretto

`App.jsx` monta:

```text
useSourceIdentityGateStatus(...)
```

e separatamente:

```text
useMarketReactionEvidence(...).
```

Lo stato live
non viene ricostruito
dal Match Evidence Snapshot.

Da preservare.

---

# 11. Persistence integrity resta una terza dimensione

Gli hook Sofa e Betfair
conservano:

```text
integrity.
```

Evidence backend
possiede a sua volta
integrity top-level.

Questa informazione
non deve diventare
Source Identity.

Corretto.

---

# 12. Betfair health resta backend-owned

Il frontend consuma:

```text
betfairData.health
oppure
betfairHealthFromHook.
```

`useBetfairHealthAlerts(...)`
gestisce:

```text
transition
toast
audio.
```

Non riclassifica
la health semantica.

Claim corretto.

---

# 13. Il lifecycle dell’audio non è però session-scoped

`useBetfairHealthAlerts(...)`
attiva un interval ogni 10 s
quando:

```text
betfairAudioAlertEnabled
AND
isBetfairScrapeAlert.
```

Non riceve:

```text
trackingStopped
session state
polling enabled.
```

Questo conferma
il già registrato:

```text
FRONTEND-007.
```

Non è un nuovo finding.

---

# 14. Money Flow usa selectionId per l’associazione frontend

Il Punto 6
attribuisce a `BetfairDepthCard`
l’associazione tramite selectionId.

Questo è coerente
con la filosofia:

```text
nome = label
selectionId = identity.
```

Nessuna nuova task.

---

# 15. FRONTEND-001 — current code conferma la root issue

`useMatchPolling(...)`
non possiede:

```text
trackingSessionId
session generation
requestId
AbortController
single-active-request.
```

Il loop esegue:

```text
await fetchData
→ setTimeout(loop).
```

La response può quindi
arrivare dopo
un cambio logico di sessione.

---

# 16. `useBetfairJson(...)` ha lo stesso limite

Possiede:

```text
pollTimeout
shouldPoll
```

ma non:

```text
trackingSessionId
requestId
AbortController
disposed generation.
```

Il finding resta reale.

---

# 17. Response fuori ordine della stessa sessione non è protetta

Né Sofa né Betfair
usano un requestId
per accettare soltanto
la response più recente.

Quindi:

```text
request A
request B
B completa
A completa dopo
→ A può sovrascrivere B.
```

FRONTEND-001 resta corretto.

---

# 18. Non aprire un nuovo finding polling race

È già posseduto da:

```text
FRONTEND-001
IMPL-026
TEST-046.
```

---

# 19. EventId accettato dal backend non è ancora authority frontend

`App.jsx` calcola:

```text
sofaEventId =
getSofaEventId(confirmedUrl).
```

Non usa:

```text
eventId restituito da Start.
```

`useLiveTrackingActions`
fa:

```text
await startMatchTracking(...)
```

ma non conserva
la response accettata
come session authority.

Il Punto 6 è corretto.

---

# 20. Backend Start corrente non fornisce ancora trackingSessionId

Response:

```text
HTTP 200
{
  ok: true,
  eventId
}
```

Non contiene:

```text
trackingSessionId
commandId
acceptedConfig.
```

Quindi:

```text
IMPL-006
IMPL-025
```

restano necessarie.

---

# 21. Non duplicare SOFA-LIVE-002

La route corrente inoltre
ignora il valore di ritorno
di `trackMatch(...)`
prima di rispondere `ok:true`.

Questa issue è già:

```text
SOFA-LIVE-002.
```

Il report 057
non apre un frontend/backend
owner parallelo.

---

# 22. FRONTEND-002 — integrity raccolta ma non propagata

`useMatchPolling(...)`
restituisce:

```text
integrity.
```

`useBetfairJson(...)`
restituisce:

```text
integrity.
```

Ma `App.jsx`
destruttura soltanto
altri campi
e non prende
le due integrity.

Finding ancora reale.

---

# 23. `useDashboardViewModel(...)` non accetta integrity

Firma:

```text
backendData
isSofaPolling
sofaLastUpdate
serverStatus
betfairData
betfairMoneyFlowHistory
confirmedUrl
loadMatch.
```

Mancano:

```text
sofaIntegrity
betfairIntegrity
evidenceIntegrity
global persistence state.
```

Il Punto 6 è esatto.

---

# 24. Market Reactions perde l’integrity top-level

`useMarketReactionEvidence(...)`
su successo fa:

```text
setEvidence(
  payload.latest?.marketReactionEvidence
)
```

Non conserva:

```text
payload.integrity
sources
snapshot-level dataQuality
metadata.
```

Quindi `FRONTEND-002`
resta ancora più ampio
della sola dashboard Overview.

---

# 25. `409` Sofa azzera backendData

Nel polling Sofa:

```text
409 persistence
→ setData(null)
→ setIntegrity(...)
→ serverStatus partial/recovery_failed.
```

Corretto come hook state.

---

# 26. Il view model però conserva l’ultimo dashboardData

`useDashboardViewModel(...)`
aggiorna soltanto se:

```text
if (backendData) {
    setDashboardData(...)
}
```

Quando backendData diventa null:

```text
dashboardData precedente
→ resta.
```

Questo è intenzionalmente utile
solo se accompagnato
da:

```text
last_verified
frozen
degraded.
```

Tale state machine
non esiste ancora.

---

# 27. Non considerare il retain dell’ultimo snapshot un bug da solo

Il Punto 6
approva proprio:

```text
ultimo dato può restare visibile.
```

Il bug è:

```text
resta visibile
senza stato esplicito.
```

Già `FRONTEND-002`
e `IMPL-009/025`.

---

# 28. FRONTEND-003 — current Start order conferma il finding

`handleSearch(...)`
esegue prima:

```text
applySearchSession(...)
resetSourceIdentityUi()
setSessionShellVisible(true)
setTrackingStopped(false)
beginDashboardBootstrap()
```

poi:

```text
await startMatchTracking(...)
```

Quindi i consumer
della confirmed session
possono attivarsi
prima dell’accettazione backend.

---

# 29. In caso di Start failure non viene cancellata la confirmed session

Catch:

```text
resetDashboardBootstrap()
setSessionShellVisible(false)
```

Manca:

```text
clearConfirmedSession().
```

Il finding del documento
è confermato.

---

# 30. Manca un errore Start dedicato

Il catch
registra soltanto:

```text
frontendRuntimeLog(
  tracking_start_failed
)
```

Non crea:

```text
startError
```

consumabile dalla UI.

`sofaError`
resta un’altra semantica.

---

# 31. Non esiste cleanup compensativo di Start ambiguo

La funzione
non distingue:

```text
backend sicuramente non partito
vs
risposta persa dopo possibile start.
```

Nessuna Stop compensativa.

È già owner di:

```text
FRONTEND-003
IMPL-025
TEST-045.
```

---

# 32. FRONTEND-005 — loop che può rinascere

Sofa:

```text
await fetchData(true)
→ setTimeout(loop)
```

senza disposed guard.

Betfair:

```text
await fetchData(true)
→ setTimeout(loop)
```

senza disposed guard.

Se cleanup avviene
durante await:

```text
vecchia closure
→ può schedulare nuovo timeout.
```

Finding confermato.

---

# 33. `shouldPoll` condiviso può riattivare closure vecchie

Il ref:

```text
shouldPoll.current
```

non è per-generation.

Un nuovo Start:

```text
shouldPoll.current = true
```

può rendere vera
la condizione letta
da un loop vecchio.

Questo giustifica
`IMPL-026`.

---

# 34. StrictMode rende necessario un lifecycle idempotente

Il documento non afferma
che StrictMode crei il bug.

Dice correttamente
che:

```text
mount
cleanup
remount
```

aumentano la necessità
di idempotenza.

TEST-058 resta mancante.

---

# 35. FRONTEND-006 — Start non single-flight

`handleSearch(...)`
non possiede:

```text
startPending
commandId
active Start ref
dedupe.
```

Lo stato `sofaLoading`
non rappresenta
l’HTTP command Start.

Finding ancora reale.

---

# 36. Stop non è serializzato

`handleStopLiveTracking(...)`
può essere richiamato
nuovamente
mentre una Stop è in flight.

Non esiste:

```text
stopCommandId
stopping owner state.
```

Già incluso
in `IMPL-025`.

---

# 37. FRONTEND-007 — Stop ferma soltanto Sofa polling

Su successo:

```text
stopSofaPolling()
setTrackingStopped(true)
```

Non vengono chiamati:

```text
stopBetfairPolling
stopEvidencePolling
stopGatePolling.
```

Current code conferma il finding.

---

# 38. Betfair poller non riceve trackingStopped

`useBetfairJson(...)`
è montato sempre in App
e il suo effect dipende da:

```text
sofaEventId
url
fetchData
pollingInterval.
```

Non ha:

```text
enabled.
```

Quindi Stop UI
non lo disabilita.

---

# 39. Evidence poller non riceve trackingStopped

`useMarketReactionEvidence(...)`
riceve soltanto:

```text
sofaEventId.
```

Nessun:

```text
enabled
activeView
trackingStopped.
```

Continua dopo Stop
finché l’eventId resta presente.

---

# 40. Gate poller resta abilitato con shell visibile

App:

```text
useSourceIdentityGateStatus(
  sofaEventId,
  { enabled: sessionShellVisible }
)
```

Dopo:

```text
handleStopLiveTracking
```

la shell resta visibile.

Quindi:

```text
trackingStopped = true
```

non disabilita il Gate.

Già FRONTEND-007/IMPL-026.

---

# 41. Stop statico approvato non è ancora una modalità runtime reale

Target:

```text
Sofa poller off
Betfair poller off
Evidence poller off
Gate poller off
request abort
audio off
refresh live off
snapshot frozen.
```

Current:

```text
solo Sofa polling off
+ trackingStopped boolean.
```

Finding confermato.

---

# 42. Backend Stop continua a nascondere cleanup parziale

`buildStopMatchResponse(...)`
ritorna sempre:

```text
httpStatus: 200
body.ok: true
body.stopped: true
```

anche quando:

```text
pythonCleanup.ok === false.
```

Il frontend controlla:

```text
if (data.ok)
→ "Live tracking stopped".
```

La combinazione
conferma esattamente
il contratto problematico
descritto dal Punto 6.

---

# 43. Non duplicare RUNTIME-009 / SOFA-LIVE-003

La root backend
è già posseduta.

Il frontend consumer
è già:

```text
FRONTEND-007
TEST-049
IMPL-025.
```

Nessun nuovo ID.

---

# 44. Audio Betfair può continuare dopo Stop

L’audio dipende da:

```text
betfairHealth
betfairAudioAlertEnabled.
```

Non dipende da:

```text
trackingStopped.
```

Finché health resta red
l’interval può continuare.

Il Punto 6
lo include già esplicitamente.

---

# 45. FRONTEND-008 — state indicators ancora data-derived

`dashboardConnections.js`:

```text
backendData truthy
→ sofa connected.
```

Betfair:

```text
ok: Boolean(betfairData).
```

Nessun input:

```text
session state
trackingStopped
snapshotMode
integrity.
```

Finding ancora reale.

---

# 46. La presenza del dato non prova `live`

Questo principio
è centrale:

```text
last verified snapshot
≠
current live session.
```

IMPL-025
è l’owner corretto.

---

# 47. FRONTEND-009 — availability UI ancora errata

`MarketLedObservationCard`:

```jsx
<AvailabilityBadge available={!!evidence} />
```

`FieldLedReactionCard`:

```jsx
<AvailabilityBadge available={!!evidence} />
```

Un object:

```text
{ available:false, ... }
```

è truthy.

Quindi viene promosso
visivamente ad available.

Finding confermato.

---

# 48. Market→Field usa ancora campi backend errati

UI cerca:

```text
runnerName
amount
tier
flowClassification.
```

Il contratto backend
del source flow usa:

```text
runner
observedFlowAmount
absoluteFlowTier
interpretation.
```

Finding confermato.

---

# 49. `causalityClaimed` è letto al livello sbagliato

La card usa:

```text
evidence?.causalityClaimed
```

mentre parte della causalità
è disponibile anche nel:

```text
summary
source object
window.
```

Il view model approvato
deve produrre
una semantica UI unica.

Già IMPL-027.

---

# 50. `not observed` resta semanticamente troppo forte

Le card usano
ObservedBadge false per:

```text
false.
```

Ma il backend attuale
non distingue ancora uniformemente:

```text
unavailable
insufficient_data
window_open
final_not_observed.
```

Il problema è già:

```text
FRONTEND-009
EVIDENCE-009
IMPL-023
IMPL-027.
```

---

# 51. FRONTEND-010 — pending key ancora name/event scoped

`buildPendingIdentityKey(...)`
usa:

```text
sofaEventId
sofaPlayers
betfairRunners.
```

Mancano:

```text
trackingSessionId
marketId
epochSignature
selectionIds
context revision.
```

Finding ancora reale.

---

# 52. Nuovo epoch con stessi nomi può riusare la stessa pending key

Se:

```text
eventId uguale
nomi Sofa uguali
nomi Betfair uguali
```

la key resta identica.

Quindi:

```text
acknowledgedPendingKeyRef
```

può considerare
il nuovo contesto già gestito.

TEST-052 resta necessario.

---

# 53. Confirm live non è session-bound

`handleConfirmSourceIdentity(...)`
invia:

```text
sofaEventId
selectedPairs
confirmationText.
```

Non invia:

```text
trackingSessionId
contextId
revision
commandId.
```

Questo si coordina
anche con:

```text
RUNTIME-010.
```

Nessun nuovo finding.

---

# 54. FRONTEND-011 — Preflight non è input-bound

`usePreflightChecks(...)`
scrive:

```text
{status, message}
```

per ogni check.

Non conserva:

```text
inputFingerprint
requestId
checkedAt.
```

Current code conferma il finding.

---

# 55. Le response Preflight non hanno stale guard

Per esempio `testSofaUrl()`:

```text
usa matchUrl catturata
await fetch
setCheck('sofa', ...)
```

Se l’utente modifica
il campo durante la request:

```text
la vecchia response
può aggiornare il nuovo input.
```

Già FRONTEND-011.

---

# 56. Il codice contiene ancora mojibake Preflight

Esempi:

```text
âEUR”
ModalitÃ
```

Questo conferma:

```text
FRONTEND-004.
```

La task resta separata
dal refactor sessione.

---

# 57. FRONTEND-012 — responsive resta separato

Il Punto 6
non prova responsive.

Dice esplicitamente:

```text
task separata
dopo robustezza.
```

Todo mantiene:

```text
FRONTEND-012
→ limite confermato
→ task separata.
```

Coerente.

---

# 58. Non inglobare responsive in IMPL-025/026

Motivo:

```text
session correctness
≠
layout adaptation.
```

Il documento
mantiene correttamente
due responsabilità esecutive separate.

---

# 59. Strategy legacy è ancora montata

`App.jsx` importa e rende:

```text
LayTheWinner
BancaServizio
Superbreak.
```

Quindi:

```text
CODE-001
```

non è stata
falsamente chiusa.

---

# 60. Non correggere Strategy

La decisione corrente è:

```text
rimuovere
senza correggere.
```

Market Reactions
devono essere preservate.

Il Punto 6
è coerente.

---

# 61. Source Identity authority legacy è ancora presente nel hook Evidence

`useMarketReactionEvidence(...)`
esporta:

```text
confirmSourceIdentity
revokeSourceIdentityConfirmation.
```

App non li consuma
per l’autorità globale,
ma la superficie legacy
esiste ancora.

Questo conferma:

```text
CLEANUP-001.
```

---

# 62. `SourceIdentityControls` legacy non deve diventare una seconda authority

Il target resta:

```text
useSourceIdentityGateUi
→ unica authority UI globale.
```

Il cleanup
deve avvenire
dopo consumer inventory.

---

# 63. Polling Betfair non è ancora configurazione-scoped

`useBetfairJson(...)`
parte in base a:

```text
sofaEventId
```

e non possiede
un `enabled` legato a:

```text
Betfair configurato.
```

Anche se `url`
è vuota,
l’hook può entrare
nel proprio lifecycle
di polling con eventId.

Il Punto 6
lo descrive già
come polling non necessario.

---

# 64. Polling Gate non è Betfair-config scoped

App passa:

```text
enabled: sessionShellVisible
```

non:

```text
sessionShellVisible && hasBetfairUrl && live.
```

Questo è già incluso
nella policy approvata:

```text
Gate
→ live
+ Betfair configurato.
```

Non serve un nuovo FRONTEND ID.

---

# 65. Evidence polling non è view-scoped

App monta:

```text
useMarketReactionEvidence(sofaEventId)
```

indipendentemente da:

```text
activeView.
```

Quindi anche Overview
continua a interrogare Evidence.

Già incluso
nella policy del Punto 6.

---

# 66. IMPL-026 è l’owner corretto delle tre abilitazioni

Policy owner:

```text
Sofa
→ accepted + live/collecting

Betfair
→ accepted + configured + live

Gate
→ live + configured

Evidence
→ live + activeView market-reactions

stopped_static
→ none.
```

Nessun nuovo task.

---

# 67. DOC-028 — stato coerente

Il Punto 6 registra
che la vecchia session-shell canonica
anticipava:

```text
applySearchSession prima Start
```

come comportamento
da preservare
e consentiva read dopo Stop.

Todo mantiene:

```text
DOC-028
→ CONFERMATO
→ CORREZIONE APPROVATA.
```

Coerente.

---

# 68. I path `.mdx` sono provenance storica del checkpoint

Il file audit
indica i documenti:

```text
.../01-session-shell.mdx
.../02-live-polling-and-view-model.mdx
.../03-betfair-and-market-reactions-ui.mdx
```

come:

```text
perimetro letto
alla baseline del Punto 6.
```

La successiva migrazione `.mdx → .md`
non rende falsa
questa provenance storica.

Non aprire un broken-link finding
solo per quei path storici.

---

# 69. DOC-029 — stato coerente

Riguarda documentazione
che descriveva come esistenti:

```text
integrity propagation
persistence adapter
session-safe cleanup.
```

Current code
continua a non implementare
questi contratti.

Todo mantiene
il DOC aperto.

---

# 70. DOC-030 — stato coerente

Riguarda UI
descritta come integrity-aware
senza wiring reale.

Current App/view model
continua a scartare integrity
prima dei consumer.

Todo:

```text
DOC-030
→ CONFERMATO
→ CORREZIONE APPROVATA.
```

Coerente.

---

# 71. IMPL-025 — owner corrente conferma struttura assente

Owner:

```text
NECESSARIA
STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA
Priorità critica.
```

Target:

```text
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
error.
```

Current App
usa ancora booleani separati:

```text
confirmedUrl
sessionShellVisible
trackingStopped
dashboardContentReady
activeView
stop status.
```

Nessuna falsa implementazione.

---

# 72. IMPL-025 conserva requested vs accepted config

Questa distinzione
è importante:

```text
form input / requested
≠
backend accepted session.
```

Current code
usa `applySearchSession`
prima dell’accettazione.

Quindi owner ancora necessario.

---

# 73. IMPL-026 — owner corrente conferma struttura assente

Owner:

```text
NECESSARIA
STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA
Priorità critica.
```

Non esiste ancora
una primitive condivisa
con:

```text
enabled
sessionKey
requestId
AbortController
disposed
retain policy.
```

Nessuna falsa chiusura.

---

# 74. Gate/Evidence non equivalgono alla primitive comune

Hanno già
alcune primitive corrette,
ma non:

```text
trackingSessionId-based sessionKey
source-specific enabled policy
shared retain policy.
```

Quindi `IMPL-026`
resta necessaria.

---

# 75. IMPL-027 — owner corrente conferma struttura assente

Owner:

```text
NECESSARIA
STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA
Priorità alta.
```

Current card
leggono direttamente
il payload backend.

Non esiste un:

```text
Market Reactions frontend view model
```

intermedio.

---

# 76. Non spostare Evidence computation nel browser

IMPL-027
deve soltanto:

```text
mappare
classificare presentazione
preservare reasons/quality/state.
```

Non:

```text
ricalcolare Significant Flow
Market Reactions
causalità
runner identity.
```

Da preservare.

---

# 77. TEST-044…059 restano mancanti

Todo corrente
mantiene:

```text
TEST-044
...
TEST-059
→ MANCANTI.
```

Non c’è evidence
per promuoverli.

---

# 78. TEST-044/045 coprono Start authority

```text
Start A/B
response stale
Start failure
ambiguous result
cleanup.
```

Corretto mapping
con FRONTEND-003/006
e IMPL-025.

---

# 79. TEST-046/047 coprono polling race

```text
old/out-of-order response
cleanup during fetch
no new timeout.
```

Corretto mapping
con FRONTEND-001/005
e IMPL-026.

---

# 80. TEST-048/049 coprono Stop

```text
all pollers off
snapshot frozen
partial cleanup visible.
```

Corretto mapping.

---

# 81. TEST-050 copre persistence UI

Deve distinguere:

```text
partial_persistence
recovery_failed
future integrity_unknown
```

e:

```text
local card
global indicator
modal
snapshot degraded/frozen.
```

Coerente.

---

# 82. TEST-051 copre session identity dalla response Start

Target:

```text
eventId
trackingSessionId
→ uniche authority poller.
```

Backend corrente
non fornisce ancora
trackingSessionId.

Test resta futuro.

---

# 83. TEST-052 copre Source Identity context reuse

Nuovo context ID
con stessi nomi:

```text
→ modal reopen
→ old confirmation ignored.
```

Corretto.

---

# 84. TEST-053 copre Preflight stale response

```text
input change during request
→ old OK ignored.
```

Corretto.

---

# 85. TEST-054/055 coprono Market Reactions UI

```text
object + available:false
→ unavailable UI

real backend field names
→ correctly displayed.
```

Corretto.

---

# 86. TEST-056 copre false live indicators

Target:

```text
stopped
waiting
polling off
integrity degraded
unknown
→ no false green.
```

Coerente con FRONTEND-008.

---

# 87. TEST-057 copre Sofa-only poll policy

```text
Betfair assente
→ no Betfair poll
→ no unnecessary Gate.
```

Questo requisito
esiste già.

Non creare
un nuovo finding specifico
per il current Gate enabled
senza Betfair.

---

# 88. TEST-058 copre StrictMode

Target:

```text
mount
cleanup
remount
→ una sola chain.
```

Corretto.

---

# 89. TEST-059 resta responsive separato

Non deve bloccare
le correzioni session/polling.

Sequenza:

```text
robustezza
→ responsive
→ smoke.
```

Coerente con DEC-017.

---

# 90. Le decisioni approvate del Punto 6 restano coerenti

Le 19 decisioni
non sono state invalidate
da una scelta successiva.

In particolare:

```text
accepted Start identity
all pollers IMPL-026
stopped_static
partial Stop visible
integrity UI
state-machine indicators
context-scoped Source Identity
remove legacy Strategy
responsive later.
```

Sono ancora
le decisioni correnti.

---

# 91. DEC-023 formalizza queste decisioni senza promuoverle a implementation

Il decision log
mantiene il target frontend
come decisione approvata.

Todo/IMPL
mantengono le strutture
ancora aperte.

Coerente.

---

# 92. L’ordine tecnico risultante è una dependency chain

```text
IMPL-006
→ IMPL-025
→ IMPL-026
→ IMPL-009
→ IMPL-027
→ TEST-044…058
→ cleanup
→ responsive.
```

Questa sequenza
ha senso tecnico.

---

# 93. Non leggere l’ordine come next task automaticamente selezionata

Il root corrente
mantiene:

```text
DA SELEZIONARE.
```

Il Punto 6
descrive dipendenze,
non seleziona
automaticamente una task.

Nessun finding.

---

# 94. Non aprire un finding temporal-authority come report 054

Qui non emergono:

```text
priorità locali divergenti
dalla Todo
```

né:

```text
parti dichiarate solide
poi smentite
senza owner.
```

Le parti solide
sono ancora realmente solide
nel loro scope.

---

# 95. La protezione Gate/Evidence non è stata smentita

È stata solo
delimitata ulteriormente:

```text
async safety locale
≠
tracking session authority.
```

Il documento stesso
prevede IMPL-026
per colmare il secondo livello.

Nessuna contraddizione.

---

# 96. Non aprire un nuovo finding sul backend Start

`SOFA-LIVE-002`
possiede già:

```text
trackMatch refused
→ no false 200 ok.
```

Il Punto 6
possiede soltanto
il consumer frontend
della session response.

---

# 97. Non aprire un nuovo finding sul backend Stop

`RUNTIME-009`
e i finding successivi
possiedono:

```text
partial cleanup hidden.
```

Frontend:

```text
FRONTEND-007
```

possiede la presentazione/stop state.

---

# 98. Non aprire un nuovo finding Source Identity stale confirm

Backend/session ownership:

```text
RUNTIME-010.
```

Frontend pending/context:

```text
FRONTEND-010.
```

La divisione è già sufficiente.

---

# 99. Non aprire un nuovo finding Evidence integrity

La perdita
dell’integrity Evidence
prima della UI
è già parte di:

```text
FRONTEND-002
IMPL-009
IMPL-027
DOC-030.
```

---

# 100. Non aprire un nuovo finding per Betfair polling senza config

È già coperto da:

```text
polling non necessario
IMPL-026
TEST-057.
```

Non serve
un altro FRONTEND ID.

---

# 101. Non aprire un nuovo finding per Gate polling senza Betfair

Stessa root issue:

```text
poll enable policy
```

già owner di IMPL-026.

---

# 102. Non aprire un nuovo finding per Evidence sempre attiva

Stessa root issue:

```text
Evidence enabled
→ activeView market-reactions.
```

Già owner IMPL-026.

---

# 103. Non aprire un nuovo finding audio-after-stop

È una manifestazione
di:

```text
FRONTEND-007
stopped_static incompleto.
```

Nessun owner parallelo.

---

# 104. Non aprire un nuovo finding per dashboard retained snapshot

È una manifestazione
di:

```text
FRONTEND-002
IMPL-009
IMPL-025.
```

Il target retain è intenzionale.

---

# 105. Non aprire un nuovo finding per Strategy

Già:

```text
CODE-001
DEC-008.
```

Rimozione approvata,
non ancora applicata.

---

# 106. Non aprire un nuovo finding per SourceIdentityControls

Già:

```text
CLEANUP-001
DEC-011.
```

---

# 107. Non aprire un nuovo finding mojibake

Già:

```text
FRONTEND-004.
```

E il codice Preflight
continua a fornire
evidence diretta.

---

# 108. Non aprire un nuovo finding responsive

Già:

```text
FRONTEND-012
DEC-017
TEST-059.
```

---

# 109. Stato dei principali owner vs Todo

```text
FRONTEND-001
→ critical
→ allineato

FRONTEND-002
→ critical
→ allineato

FRONTEND-003
→ critical
→ allineato

FRONTEND-005
→ critical
→ allineato

FRONTEND-006
→ high
→ allineato

FRONTEND-007
→ critical
→ allineato

FRONTEND-008
→ state machine approved
→ allineato

FRONTEND-009
→ IMPL-027 approved
→ allineato

FRONTEND-010
→ opaque context approved
→ allineato

FRONTEND-011
→ fingerprint approved
→ allineato

FRONTEND-012
→ separate task
→ allineato.
```

Nessun metadata drift
come nel report 054.

---

# 110. Stato owner IMPL vs Todo

```text
IMPL-025
→ approved
→ critical
→ structure absent

IMPL-026
→ approved
→ critical
→ structure absent

IMPL-027
→ approved
→ high
→ structure absent.
```

Todo e owner
sono coerenti.

---

# 111. Nessuna false closure

Il documento non dice:

```text
session authority implementata
polling session-scoped implementato
persistence UI implementata
Market Reactions view model implementato.
```

Dice il contrario:

```text
strutture completamente assenti.
```

Corretto.

---

# 112. Nessuna false test claim

Il file dice:

```text
Build, test e responsive
non eseguiti.
```

e:

```text
TEST-044…059 mancanti.
```

Coerente.

---

# 113. I test hook già presenti non sono promossi a coverage completa

Il perimetro legge:

```text
useMatchPolling.test.mjs
useBetfairJson.test.mjs
dashboardConnections.test.mjs.
```

Ma il file non li usa
per dire:

```text
frontend lifecycle tested.
```

Corretto.

---

# 114. Modularizzazione — dimensione

Il file ha:

```text
910 righe.
```

La lunghezza
non richiede da sola
uno split.

---

# 115. Possibili sottogruppi esistono

Si potrebbero distinguere:

```text
A
session controller / Start Stop

B
polling / integrity

C
Source Identity / Market Reactions UI

D
preflight / cleanup / responsive.
```

Ma non sono owner indipendenti
nel record audit.

---

# 116. Tutti i gruppi consumano la stessa state machine

La root frontend
è:

```text
sessione accettata
→ abilita/disabilita consumer
→ determina snapshot mode
→ determina live/static/degraded
→ governa indicatori
→ governa polling
→ governa UI context.
```

Quindi lo split
renderebbe più difficile
seguire le dipendenze.

---

# 117. La modularizzazione esecutiva esiste già

Il lavoro futuro
è già separato in:

```text
IMPL-025
→ session controller

IMPL-026
→ poller primitive

IMPL-009
→ persistence UI

IMPL-027
→ Market Reactions view model

FRONTEND-004
→ copy

FRONTEND-012
→ responsive.
```

Non serve
duplicare la stessa separazione
nel record di audit.

---

# 118. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Motivo:

```text
una baseline
un audit point
una root authority frontend
dependency chain fortemente condivisa
modularizzazione esecutiva già esistente.
```

---

# 119. Aspetti corretti da preservare integralmente

```text
1. baseline 9205b5a;
2. audit statico dichiarato;
3. build/test/responsive non eseguiti dichiarato;
4. una sola Evidence ownership in App;
5. no second poller in page;
6. async guards Gate/Evidence;
7. Source Identity live separata da Evidence;
8. persistence separata da Source Identity;
9. Betfair health backend-owned;
10. selectionId Money Flow;
11. FRONTEND-001 late/out-of-order responses;
12. FRONTEND-002 integrity propagation gap;
13. retained snapshot only with explicit mode;
14. FRONTEND-003 Start-before-acceptance;
15. Start error dedicated target;
16. ambiguous Start cleanup target;
17. FRONTEND-005 no old-loop resurrection;
18. StrictMode lifecycle;
19. FRONTEND-006 command serialization;
20. FRONTEND-007 stopped_static;
21. partial Stop visible;
22. audio off on Stop;
23. FRONTEND-008 state-derived indicators;
24. FRONTEND-009 view model need;
25. unavailable != truthy object;
26. backend real field mapping;
27. FRONTEND-010 context identity;
28. FRONTEND-011 preflight fingerprint;
29. FRONTEND-012 separate responsive;
30. Strategy remove, do not fix;
31. Source Identity legacy cleanup;
32. mojibake separate;
33. source-specific polling enable policies;
34. DOC-028…030;
35. IMPL-025…027 references;
36. TEST-044…059;
37. accepted eventId/trackingSessionId authority;
38. no frontend Evidence recomputation;
39. no recovery in frontend;
40. no canonical timeline writes from browser.
```

---

# 120. Finding esistenti da NON duplicare

## FRONTEND-001…012

Possiedono
i difetti frontend
del Punto 6.

---

## RUNTIME-009

Possiede:

```text
backend Stop
che nasconde cleanup parziale.
```

---

## RUNTIME-010

Possiede:

```text
stale Source Identity confirm
a livello backend/session.
```

---

## CODE-001

Possiede:

```text
Strategy legacy removal.
```

---

## CLEANUP-001

Possiede:

```text
Source Identity frontend authority legacy.
```

---

## DOC-028…030

Possiedono:

```text
canonical docs
che anticipano contratti frontend.
```

---

## IMPL-006

Possiede:

```text
end-to-end session authority.
```

---

## IMPL-009

Possiede:

```text
persistence integrity UI.
```

---

## IMPL-025

Possiede:

```text
frontend live-session controller.
```

---

## IMPL-026

Possiede:

```text
session-scoped polling runtime.
```

---

## IMPL-027

Possiede:

```text
Market Reactions frontend view model.
```

---

## TEST-044…059

Possiedono:

```text
test requirements frontend.
```

---

# 121. Nuovi finding

```text
nessuno
```

---

# 122. Nuove task runtime

```text
0
```

---

# 123. Nuove task documentali

```text
0
```

---

# 124. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: false
```

Il documento
può restare invariato
come record del Punto 6
finché gli owner
non vengono implementati.

---

# 125. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 126. Verification matrix futura — IMPL-025

```text
[ ] owner unico sessione
[ ] idle
[ ] starting
[ ] collecting
[ ] pending_confirmation
[ ] live
[ ] stopping
[ ] stopped_static
[ ] stop_partial
[ ] mismatch
[ ] integrity_degraded
[ ] error
[ ] requestedConfig separata da acceptedConfig
[ ] eventId da Start response
[ ] trackingSessionId da Start response
[ ] commandId
[ ] Start stale ignored
[ ] Start failure cleanup
[ ] Stop partial visible
[ ] currentSnapshot
[ ] lastVerifiedSnapshot
[ ] snapshotMode
```

---

# 127. Verification matrix futura — IMPL-026

```text
[ ] shared polling primitive
[ ] enabled
[ ] sessionKey
[ ] trackingSessionId
[ ] requestId
[ ] AbortController
[ ] single active request
[ ] disposed
[ ] schedule-after-response
[ ] no reschedule after cleanup
[ ] clear_on_new_session
[ ] retain_last_verified_on_stop
[ ] mark_degraded_on_integrity
[ ] Sofa policy
[ ] Betfair config policy
[ ] Gate config policy
[ ] Evidence activeView policy
[ ] stopped_static none
[ ] StrictMode
```

---

# 128. Verification matrix futura — IMPL-009

```text
[ ] Sofa integrity propagated
[ ] Betfair integrity propagated
[ ] Evidence integrity propagated
[ ] local source status
[ ] global status
[ ] affectedSources
[ ] affectedDocuments
[ ] bounded reason
[ ] cross-source blocking state
[ ] frozen/degraded snapshot mode
[ ] sidebar indicator
[ ] modal
[ ] Betfair card consumer
[ ] Overview consumer
[ ] Market Reactions consumer
[ ] no filesystem internals.
```

---

# 129. Verification matrix futura — IMPL-027

```text
[ ] pageState
[ ] branch availability
[ ] source event availability
[ ] observation state
[ ] provisional/final
[ ] windowState
[ ] quality
[ ] reasons
[ ] correct backend names
[ ] runner
[ ] selectionId
[ ] observedFlowAmount
[ ] absoluteFlowTier
[ ] interpretation
[ ] unavailable != object truthiness
[ ] no Evidence recomputation
[ ] causality false preserved.
```

---

# 130. Verification matrix futura — Start/Stop integration

```text
[ ] backend Start returns bounded accepted identity
[ ] frontend waits before live polling
[ ] response stale ignored
[ ] same-event new session gets new identity
[ ] ambiguous Start compensated
[ ] all pollers disabled before/at Stop
[ ] in-flight fetch abort
[ ] backend partial cleanup not promoted
[ ] snapshot retained as frozen/degraded
[ ] Betfair audio stopped
[ ] refresh live disabled.
```

---

# 131. Current-code evidence summary

```text
App.jsx
→ sessionShellVisible/trackingStopped booleans
→ no central state machine

useLiveTrackingActions
→ apply session before Start
→ no commandId
→ no accepted response storage
→ Stop only Sofa poller

useMatchPolling
→ no abort/generation/requestId

useBetfairJson
→ no abort/generation/requestId
→ auto lifecycle not config/session scoped

useMarketReactionEvidence
→ good async guards
→ no trackingSessionId
→ always active by eventId
→ drops integrity top-level
→ legacy confirm/revoke remains

useSourceIdentityGateStatus
→ good async guards
→ enabled only by App boolean

useSourceIdentityGateUi
→ pending key eventId + names
→ no contextId/revision

useDashboardViewModel
→ no integrity
→ retains old mapped snapshot

usePreflightChecks
→ no fingerprint/requestId
→ mojibake remains

Market Reactions cards
→ truthy availability
→ old field names

trackingResponses
→ Start eventId only
→ Stop always top-level ok/stopped.
```

Questa evidence
conferma il Punto 6
senza creare
nuovi owner.

---

# 132. Non-finding: Gate/Evidence hanno già una migliore async discipline

Non bisogna
riscriverli da zero
ignorando:

```text
AbortController
generation
requestId
active fetch guard.
```

IMPL-026
deve riutilizzare
questi pattern.

---

# 133. Non-finding: retained dashboardData

Conservare l’ultimo snapshot
è una feature approvata
per stopped/degraded.

Il problema è solo
l’assenza di state label.

---

# 134. Non-finding: backend health classification

Non spostare
la semantica health
nel frontend.

---

# 135. Non-finding: responsive

Non deve ritardare
le correzioni session authority.

---

# 136. Non-finding: cleanup Strategy

Non va risolto
introducendo nuove logiche
nelle tre viste legacy.

Devono essere rimosse.

---

# 137. Non-finding: Evidence poller unico

Anche quando verrà reso
view-scoped,
l’ownership deve restare
a livello App/session controller,
non nelle singole card.

---

# 138. Non-finding: Source Identity presentation

Il frontend può ricevere
un context ID opaco
senza ricostruire
market identity internamente.

---

# 139. Non-finding: Preflight

Il fingerprint
deve legare
response e input,
ma non trasformare Preflight
in session authority.

La sessione nasce
soltanto dopo Start accepted.

---

# 140. Non-finding: Start form state

Gli input richiesti
possono essere preservati
dopo failure.

Quello che deve essere
cancellato è:

```text
accepted session state.
```

---

# 141. Non-finding: Stop button

Lo Stop può preservare
la shell e l’ultimo snapshot
in:

```text
stopped_static.
```

Non deve necessariamente
tornare al form.

---

# 142. `stopAndReturnToLinks` è un flusso differente

Questa funzione:

```text
Stop
→ clear confirmed session
→ hide shell
→ return form.
```

È diversa da:

```text
handleStopLiveTracking
→ stopped_static.
```

Il refactor futuro
deve preservare
la differenza intenzionale
fra:

```text
Stop e resta
vs
Stop e torna ai link.
```

---

# 143. Il current `stopAndReturnToLinks` condivide però il limite partial Stop

Controlla solo:

```text
data.ok.
```

Quindi,
finché backend Stop
nasconde partial cleanup,
anche questo flusso
può tornare al form
dopo una cleanup incompleta.

Root issue già owned.

---

# 144. Non serve un nuovo ID per questa variante

Perché:

```text
backend completion semantics
→ RUNTIME-009/SOFA-LIVE-003

frontend stop state
→ FRONTEND-007/IMPL-025.
```

---

# 145. Progressione storica del file

Alla modularizzazione
`aefc0ba`
il file aveva blob:

```text
9f1fb8189a70c79c1af006e6a759f16589338763
```

All’HEAD corrente:

```text
fce39f9da7796f29c17bd7f8c3715496afab97dd
```

Il compare `aefc0ba → 4c5f43b`
registra per questo file soltanto:

```text
0 additions
3 deletions.
```

Quindi il contenuto sostanziale
del Punto 6
è rimasto stabile
dopo la modularizzazione.

---

# 146. Questa stabilità non crea stale-status problem perché il codice non è avanzato su questi owner

Il confronto current code
mostra che:

```text
IMPL-025
IMPL-026
IMPL-027
```

non risultano implementate
silenziosamente.

Quindi non serve
una current overlay.

---

# 147. Contrasto con report 053

Nel report 053
esistevano:

```text
domande storiche
poi già decise
dentro lo stesso file.
```

Qui non accade.

---

# 148. Contrasto con report 054

Nel report 054
esistevano:

```text
priorità locali
divergenti dalla Todo.
```

Qui non accade.

---

# 149. Analogia con report 055–056

Come Storage/Recovery
ed Evidence:

```text
owner aperti
→ ancora confermati dal codice
→ nessuna falsa chiusura
→ nessun nuovo Change ID.
```

Il report 057
segue la stessa conclusione.

---

# 150. Decisione finale

```text
implementazioni/audit-codice/05-frontend-session-shell.md:

ROLE:
CORRETTO

BASELINE:
ESPLICITA

AUDIT STATICO:
ESPLICITO

BUILD/TEST/RESPONSIVE:
NON ESEGUITI
ED ESPLICITAMENTE DICHIARATI

FRONTEND-001…012:
COERENTI CON TODO
E ANCORA SUPPORTATI DAL CODICE

DOC-028…030:
COERENTI

TEST-044…059:
ANCORA MANCANTI

IMPL-025:
APPROVATA
STRUTTURA ASSENTE
CRITICA

IMPL-026:
APPROVATA
STRUTTURA ASSENTE
CRITICA

IMPL-027:
APPROVATA
STRUTTURA ASSENTE
ALTA

FALSE CLOSURE:
NESSUNA

METADATA DRIFT:
NESSUNO SIGNIFICATIVO

NUOVI BUG:
0

NUOVI FINDING:
0

NUOVE TASK:
0

RISCRITTURA:
NO

MODULARIZZAZIONE:
NO

NUOVI FILE:
NO
```

---

# 151. Mandatory modularization block

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 152. Stato audit dopo report 057

```text
Documenti Markdown totali: 72
Analizzati: 57
Da analizzare: 15
Avanzamento: 79,17%
```

Blocco 053–057:

```text
[✓] 053 implementazioni/audit-codice/01-rilievi-iniziali.md
[✓] 054 implementazioni/audit-codice/02-runtime-sessioni-betfair.md
[✓] 055 implementazioni/audit-codice/03-storage-recovery.md
[✓] 056 implementazioni/audit-codice/04-evidence-market-reactions.md
[✓] 057 implementazioni/audit-codice/05-frontend-session-shell.md
```

Nuove task del blocco:

```text
053
→ 2

054
→ 2

055
→ 0

056
→ 0

057
→ 0

totale blocco 053–057
→ 4
```

Contatori provvisori:

```text
task note fino al report 052:
326

task report 053:
2

task report 054:
2

task report 055:
0

task report 056:
0

task report 057:
0

task complessive note provvisorie:
330
```

---

# 153. Stato mappa / JSON

Per richiesta esplicita dell’utente:

```text
mappa-file-markdown-repository-continuazione-048.md
→ NON MODIFICATA

modifiche-audit-markdown-continuazione-048.json
→ NON MODIFICATO

report 053–057
→ NON ANCORA CONSOLIDATI
```

Il blocco è ora completo,
ma il consolidamento
deve attendere
un consenso separato dell’utente.

---

# 154. Prossimo documento — NON ANALIZZATO

Il prossimo documento canonico in sequenza è:

```text
058
implementazioni/audit-codice/06-validazione-e-test.md
```

In questa esecuzione:

```text
NON aperto
NON analizzato
NON anticipato.
```

---

# 155. Stop operativo di questa esecuzione

```text
report 057:
COMPLETATO

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 058:
NON ANALIZZATO

stato:
IN ATTESA DELLA PROSSIMA ISTRUZIONE DELL’UTENTE
```
