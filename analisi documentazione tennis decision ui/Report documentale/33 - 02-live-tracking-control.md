# Report documentale — `docs/tennis-decision-ui/operations/02-live-tracking-control.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-033
Sequenza audit: 33/72
Documento analizzato: 02-live-tracking-control.md
Percorso documento: docs/tennis-decision-ui/operations/02-live-tracking-control.md
Percorso report: Report documentale/33 - 02-live-tracking-control.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 2c67739be73f88be9a61a454f273e4ea0aacaae6
Dimensione documento: 233 righe
Ruolo dichiarato: runbook operativo per sessione live, Stop Live Tracking e distinzione dallo shutdown backend
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/routes/match.js`;
- `backend/src/routes/match/trackingResponses.js`;
- `backend/src/routes/match/trackingResponses.test.mjs`;
- `backend/src/routes/match/sourceIdentityStatusResponse.js`;
- `backend/src/sofa/matchTracker.js`;
- `backend/src/sofa/sourceIdentityGate.js`;
- `backend/src/sofa/sourceIdentityGate/evaluator.js`;
- `backend/src/runtime/pythonProcessRegistry.js`;
- `backend/src/runtime/pythonProcessRegistry.test.mjs`;
- `backend/src/server.js`;
- `frontend/src/hooks/useLiveTrackingActions.js`;
- `frontend/src/services/liveSessionApi.js`;
- `frontend/src/hooks/useSourceIdentityGateStatus.js`;
- `frontend/src/hooks/useSourceIdentityGateUi.js`;
- `frontend/src/utils/sourceIdentityGatePresentation.js`;
- `frontend/src/hooks/useMatchPolling.js`;
- `frontend/src/hooks/useBetfairJson.js`;
- `frontend/src/hooks/useMarketReactionEvidence.js`;
- `docs/validations/source-identity-live-verification.md`;
- i finding già registrati nei report precedenti, in particolare:
  - `SOURCE-ID-001`;
  - `SOURCE-ID-002`;
  - `FRONT-SESSION-002`;
  - `FRONT-SESSION-003`;
  - `FRONT-SESSION-007`;
  - `FRONT-POLL-002`;
  - `FRONT-POLL-003`;
  - `FRONT-POLL-008`;
  - `FRONT-BETFAIR-006`;
  - `SOFA-LIVE-001`;
  - `SOFA-LIVE-003`;
  - `SOFA-LIVE-004`;
  - `SOFA-LIVE-007`;
  - `SOFA-LIVE-009`;
  - `PY-RUNTIME-004`;
  - `LOCAL-RUNTIME-006`.

GitHub non è stato modificato.

La mappa Markdown di continuazione e il JSON incrementale non vengono aggiornati in questo report.

---

# Esito sintetico

```text
Coerenza generale: ALTA sul confine Stop vs shutdown
Coerenza operativa dello Stop corrente: MEDIA
Coerenza post-Stop frontend: MEDIA
Coerenza sulla session authority: PARZIALE
Coerenza della validation storica: PARZIALE

Stop globale: implementato
Stop scheduler/trackedMatches: implementato
Source Identity Gate manual Stop: cancellato
tracking generation invalidata: implementata
sofa_tracking/betfair_tracking cleanup: implementato
betfair_login preservato: implementato
backend/frontend/CDP preservati: corretto
writer authority mantenuta nello Stop ordinario: corretto
terminal tracker barrier solo shutdown: corretto
shutdown drain: implementato
shutdown writer authority fail-closed: implementato

top-level Stop ok:true:
→ oggi non prova cleanup riuscito

pythonCleanup:
→ è la vera evidenza del cleanup processi Python
→ ma non prova drain delle operazioni Node

ordinary Stop:
→ non esegue stopAndDrainAllMatchTrackers()
→ activeTrackerOperations possono restare in flight

Runtime Health:
→ espone processi Python
→ non espone activeTrackerOperations
→ tracking roles = 0 non significa full Node quiescence

Source Identity dopo Stop:
→ gate cancellato
→ source-identity-status può tornare 404
→ non è una lettura persistita post-Stop

Betfair/Evidence dopo Stop:
→ possono continuare a leggere dati persistiti
→ devono essere distinti da current live data

nuovo Start dopo Stop:
→ API lo consente
→ session isolation completa non è ancora provata
→ resta dipendente da IMPL-006 / SOFA-LIVE-001 / SOURCE-ID-002

cleanup remaining:
→ ripetere Stop non garantisce un nuovo tentativo di terminazione
→ terminationPromise già completata viene riusata

mismatch:
→ ferma tracker logici
→ invalida generation
→ termina esplicitamente Betfair scraper attivi
→ non dimostra da solo che SofaScore in-flight sia fisicamente terminato
→ già censito in SOFA-LIVE-004

Verifica live 9B:
→ descritta inline
→ non individuata nel validation artifact Source Identity
→ provenance da normalizzare

Modifiche nuove proposte: 7
Riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: CRITICA
```

Il documento ha il ruolo corretto.

Deve restare il runbook operativo per rispondere a:

```text
come verifico una sessione live?
come distinguo current da persisted?
cosa significa Stop Live Tracking?
cosa resta attivo dopo Stop?
come verifico se i processi tracking sono davvero terminati?
quando devo usare shutdown completo?
```

Non deve diventare owner degli algoritmi dello scheduler, del registry Python, del Source Identity Gate o del server shutdown.

---

# 1. La verifica di una sessione corrente è ancora eventId-based e può confondere dati preesistenti con dati della sessione corrente

## Esito: finding operativo importante

Il documento riconosce correttamente:

```text
collecting oppure pending
→ nessuna nuova timeline/history della sessione corrente
→ eventuali file con lo stesso eventId possono essere preesistenti
```

Questa frase è importante.

Il problema è che il resto della verifica continua a usare superfici che non sono ancora session-scoped.

## Endpoint

Il runbook propone:

```text
GET /api/match/:eventId/source-identity-status
GET /api/match/:eventId/json
GET /api/betfair/:eventId/latest
GET /api/betfair/:eventId/json
GET /api/evidence/:eventId/latest
```

Timeline ed Evidence sono indicizzate principalmente da:

```text
eventId
```

e possono quindi rappresentare dati persistiti prima dello Start corrente.

## Gate live

Lo stato Source Identity è invece un gate in memoria del runtime.

`getSourceIdentityGateStatus(eventId)` legge:

```text
getGateSession(eventId)
```

e la route restituisce `404` se non esiste una sessione gate attiva.

Quindi:

```text
timeline/Evidence presenti
≠
sessione corrente recording

gate recording
+ session authority corrente
→ prova più forte
```

## Limite già censito

L'assenza di una tracking session authority end-to-end è già posseduta da:

```text
IMPL-006
SOFA-LIVE-001
SOURCE-ID-001
FRONT-SESSION-004
```

Non deve essere implementata una seconda authority dentro il runbook.

## Finding `LIVE-CTRL-001` — definire la prova operativa della sessione corrente

**Priorità:** high  
**Tipo:** operational session provenance

### Modifica documentale

Separare esplicitamente:

```text
current live state
persisted state
last-known frontend state
```

### Non usare come prova della sessione corrente

Da soli non bastano:

```text
timeline presente
Evidence presente
ultimo tick presente
dashboard visibile
```

### Stato corrente

Fino all'applicazione di `IMPL-006`, il documento deve dichiarare il limite.

Dopo `IMPL-006`, la verification matrix dovrà richiedere la tracking session identity dove prevista.

### Regola

Non cancellare o ignorare i file preesistenti per ottenere una falsa prova di sessione corrente.

---

# 2. `POST /api/match/stop` restituisce successo top-level anche quando il cleanup fisico fallisce

## Esito: il runbook è più prudente del frontend, ma deve rendere il contratto ancora più esplicito

`buildStopMatchResponse()` esegue:

```text
stopAllMatchTrackers()
→ terminatePythonProcesses("tracking")
```

Poi restituisce sempre:

```json
{
  "ok": true,
  "stopped": true,
  "scope": "all-live-tracking",
  "pythonCleanup": ...
}
```

anche quando:

```text
tracker cleanup throws
python cleanup throws
pythonCleanup.ok = false
```

## Test corrente

`trackingResponses.test.mjs` verifica esplicitamente:

```text
public stop contract stays successful
```

e verifica separatamente:

```text
pythonCleanup.ok === false
```

nel failure case.

Quindi il comportamento non è accidentale: è il contratto corrente testato.

## Frontend Overview

`handleStopLiveTracking()` usa:

```text
if (data.ok) {
  Live tracking stopped
  stopSofaPolling()
  setTrackingStopped(true)
}
```

Non controlla:

```text
pythonCleanup.ok
pythonCleanup.remaining
pythonCleanup.errors
```

## Conseguenza

Il frontend può mostrare:

```text
Live tracking stopped
```

mentre il payload contiene:

```text
pythonCleanup.ok = false
```

Questo è già censito tecnicamente in:

```text
SOFA-LIVE-003
FRONT-SESSION-007
```

## Finding `LIVE-CTRL-002` — rendere esplicita la Stop completion authority nel runbook

**Priorità:** high  
**Tipo:** operational stop completion semantics

### Il runbook deve distinguere

```text
logical stop requested/completed
Python cleanup completed
full ordinary-stop completion
```

### Finché il contratto HTTP resta quello corrente

Non trattare:

```text
body.ok === true
```

come prova sufficiente.

Verificare almeno:

```text
pythonCleanup.ok === true
pythonCleanup.remaining === 0
```

e, quando necessario:

```text
Runtime Health byRole
```

### Coordinamento

L'implementazione resta posseduta da:

```text
SOFA-LIVE-003
FRONT-SESSION-007
```

Questa task aggiorna il runbook e la verifica operativa, non crea una seconda logica Stop.

---

# 3. Runtime Health prova il cleanup Python, non la quiescenza completa del tracking Node

## Esito: distinzione mancante

Il runbook dice:

```text
Dopo una completion riuscita:
sofa_tracking = 0
betfair_tracking = 0
stopping = 0
```

Questa verifica è corretta per il registry Python.

Ma non prova:

```text
activeTrackerOperations = 0
```

## Ordinary Stop

`stopAllMatchTrackers()`:

```text
trackedMatches.clear()
schedulerInterval clear
Source Identity gates clear
```

ma non chiama:

```text
drainActiveTrackerOperations()
```

## Shutdown completo

Soltanto:

```text
stopAndDrainAllMatchTrackers()
```

attiva:

```text
terminalTrackerBarrier = true
stopAllMatchTrackers()
drainActiveTrackerOperations()
```

## Runtime Health

`GET /api/health` espone:

```text
pythonProcesses
```

Non espone:

```text
activeTrackerOperations
tracker drain state
```

## Conseguenza

Questo stato:

```text
sofa_tracking = 0
betfair_tracking = 0
stopping = 0
```

dimostra:

```text
nessun child Python tracking registrato
```

ma non necessariamente:

```text
nessuna Promise/update Node ancora in volo
```

## Rischio già noto

Il problema delle callback in-flight e del nuovo Start è già censito in:

```text
SOFA-LIVE-001
SOURCE-ID-002
IMPL-006
```

## Finding `LIVE-CTRL-003` — correggere la semantica Runtime Health post-Stop

**Priorità:** high  
**Tipo:** operational quiescence semantics

### Documento

Precisare:

```text
Runtime Health process cleanup
≠
tracker drain proof
```

### Ordinary Stop

Non dichiarare full quiescence delle operazioni Node sulla sola base del registry Python.

### Target

Dopo `IMPL-006`, scegliere una delle authority già progettate:

- session generation/identity fail-closed;
- stato esplicito del tracker;
- eventuale drain ordinario se approvato.

Non aggiungere un nuovo endpoint soltanto per duplicare l'authority.

### Verification

Aggiungere un test/fixture in cui:

```text
trackedMatches vuoto
Python registry vuoto
activeTrackerOperation ancora pending
```

e verificare che la documentazione non lo chiami “drained”.

---

# 4. Un cleanup `remaining` non è realmente ritentabile con una seconda chiamata Stop

## Esito: nuovo gap di lifecycle

Il runbook definisce lo Stop:

```text
globale e idempotente
```

Questo è vero per il percorso normale e per il caso empty.

Ma esiste una proprietà importante del failure path.

## Registry

`terminateEntry(entry)` inizia con:

```text
if (entry.terminationPromise)
→ return entry.terminationPromise
```

La Promise viene creata al primo tentativo di terminazione.

## Caso force kill non confermato

Se dopo:

```text
SIGTERM
→ timeout
→ SIGKILL
→ timeout
```

il processo non viene confermato come terminato:

```text
outcome = remaining
errors += exit_unconfirmed
```

L'entry rimane registrata.

La `terminationPromise`, però, resta già risolta.

## Seconda chiamata

Un nuovo:

```text
terminateScope("tracking")
```

seleziona ancora l'entry.

Ma:

```text
terminateEntry()
→ trova terminationPromise
→ restituisce lo stesso risultato
→ non invia un nuovo SIGTERM/SIGKILL
```

## Quindi

```text
Stop
→ remaining=1

Stop di nuovo
→ non è un nuovo tentativo fisico
```

salvo che il processo sia nel frattempo uscito autonomamente e il callback lo abbia unregisterato.

## Test correnti

La suite verifica:

- terminateScope concorrenti condividono la stessa terminazione;
- force kill;
- `remaining=1` quando l'exit non è provato;
- empty idempotent.

Non è presente un test:

```text
prima terminazione = remaining
→ seconda terminazione successiva
→ nuovo tentativo?
```

## Finding `LIVE-CTRL-004` — definire il recovery contract dello Stop incompleto

**Priorità:** high  
**Tipo:** failed process cleanup retry

### Decisione necessaria

Scegliere un comportamento esplicito.

#### Opzione A — reattempt owned entry

Dopo una termination conclusa come:

```text
remaining
```

consentire un nuovo tentativo scoped sull'esatta entry ancora registrata.

#### Opzione B — non ritentare via Stop

Dichiarare:

```text
Stop incomplete
→ non insistere con Stop
→ usare shutdown completo / procedura owner approvata
```

### Vincolo

In nessun caso:

```text
kill per porta
netstat → taskkill
processi non-owned
Chrome/CDP
```

### Test richiesti

```text
remaining
→ second Stop
```

e:

```text
remaining
→ process exits later
→ registry unregister
→ second Stop empty
```

### Runbook

L'operatore deve sapere cosa fare quando:

```text
pythonCleanup.remaining > 0
```

non soltanto che il cleanup è incompleto.

---

# 5. Dopo Stop, Source Identity non continua a leggere uno stato persistito

## Esito: incongruenza documentale precisa

Il documento afferma:

```text
Gli hook Betfair, Evidence e Source Identity possono restare montati
e leggere dati persistiti
```

La frase è corretta per alcune superfici, ma non per il Gate Source Identity.

## Stop backend

`stopAllMatchTrackers()` chiama:

```text
clearAllSourceIdentityGates()
```

salvo il caso speciale mismatch con `preserveGateEventId`.

Nel manual Stop ordinario non viene passato `preserveGateEventId`.

Quindi il gate viene cancellato.

## Status endpoint

`GET /api/match/:eventId/source-identity-status`:

```text
getSourceIdentityGateStatus(eventId)
```

Se il gate non esiste:

```text
HTTP 404
No active source identity gate session found
```

## Hook frontend

`useSourceIdentityGateStatus()` tratta `404` come:

```text
status = null
error = null
```

e continua a schedulare il polling finché resta enabled.

## Presentazione

Poiché:

```text
trackingStopped = true
```

`buildSourceIdentityGatePresentation()` mostra:

```text
Tracking fermo
```

indipendentemente dal gate null.

## Persisted confirmation

Il fatto che una conferma Source Identity persistita possa esistere non significa che:

```text
source-identity-status
```

la stia leggendo dopo Stop.

Quella route rappresenta:

```text
live gate
```

non:

```text
confirmation store
Evidence effective identity
```

## Finding `LIVE-CTRL-005` — separare le superfici post-Stop

**Priorità:** medium  
**Tipo:** post-stop frontend/source semantics

### Correggere il runbook

Dopo Stop:

```text
Sofa polling Overview
→ fermato esplicitamente

Source Identity Gate
→ gate backend cancellato
→ status endpoint può 404
→ UI usa trackingStopped

Betfair
→ può continuare a leggere timeline/health persistiti

Evidence / Market Reactions
→ possono continuare a leggere snapshot ricostruiti dai dati persistiti
```

### Regola di presentazione

Ogni dato rimasto visibile deve essere chiaramente:

```text
stopped
last-known
persisted
```

e non:

```text
current live
```

Il refactor di current-vs-last-known resta posseduto da:

```text
FRONT-POLL-003
FRONT-POLL-008
FRONT-BETFAIR-006
```

---

# 6. “Un nuovo Start successivo è consentito” è vero a livello API, ma troppo forte come garanzia di isolamento

## Esito: wording operativo da correggere

Il documento dice:

```text
Dopo lo stop ordinario:
backend resta attivo
writer authority resta posseduta
terminal tracker barrier non attivata
un nuovo Start successivo è consentito
```

Il codice effettivamente permette un nuovo `trackMatch()` perché:

```text
terminalTrackerBarrier === false
```

nello Stop ordinario.

Quindi:

```text
API permits new Start
```

è corretto.

## Ma non equivale a:

```text
old session fully isolated
```

Perché lo Stop ordinario non drena:

```text
activeTrackerOperations
```

e il progetto non possiede ancora una tracking session authority end-to-end.

## Ulteriore rischio già censito

`observeSofaSourceIdentitySample()` e `observeBetfairSourceIdentitySample()` in assenza di gate ritornano:

```text
action: no-gate
```

Il rischio che callback tardivi siano trattati come autorizzati è già censito in:

```text
SOURCE-ID-002
SOFA-LIVE-001
```

## Finding `LIVE-CTRL-006` — distinguere “Start permesso” da “restart session-safe”

**Priorità:** high  
**Tipo:** restart semantics

### Documento

Sostituire l'equivalenza implicita:

```text
Stop completato
→ nuovo Start sicuro
```

con:

```text
Stop ordinario non attiva la terminal barrier
→ API consente un nuovo Start
→ isolamento completo richiede la session authority approvata
```

### Dopo `IMPL-006`

Il runbook potrà richiedere:

```text
new trackingSessionId
old callbacks rejected
new gate/session clean
```

### Non fare

Non introdurre delay empirici come:

```text
attendi 5 secondi prima di Start
```

per mascherare una race.

La soluzione deve essere authority-based.

---

# 7. Il wording del mismatch promette più obsolescenza SofaScore di quanto il codice provi

## Esito: già noto tecnicamente, da correggere nel runbook

La tabella Source Identity dice:

```text
mismatch
→ callback ferma tracker logici
→ preserva gate mismatch
→ invalida generation
→ termina Betfair tracking attivo
→ eventuale SofaScore in flight diventa obsoleto
```

## Codice mismatch

`handleSourceIdentityMismatch()` esegue:

```text
stopAllMatchTrackers({ preserveGateEventId: eventId })
invalidatePythonGeneration("tracking")
terminateActiveBetfairScrapers()
```

Non chiama:

```text
terminatePythonProcesses("tracking")
```

e non chiama un equivalente esplicito per il child SofaScore in questa callback.

## Quindi

È corretto affermare:

```text
scheduler/tracker logico fermato
generation tracking invalidata
Betfair scraper attivi terminati
gate mismatch preservato
```

Non è ancora corretto promettere senza qualificazione:

```text
SofaScore in flight è definitivamente obsoleto e harmless
```

L'isolamento delle callback tardive dipende dai finding già aperti:

```text
SOFA-LIVE-001
SOFA-LIVE-004
SOURCE-ID-002
IMPL-006
```

## Nessuna nuova implementazione duplicata

Questo report non crea una seconda task tecnica per il mismatch.

La correzione viene inclusa nella task documentale:

```text
LIVE-CTRL-006
```

insieme alla semantica di restart/session isolation.

---

# 8. La verifica live 9B non possiede provenance sufficiente nell’artifact validation collegato

## Esito: finding documentale

Il runbook contiene:

```text
## Verifica live 9B
```

e dichiara osservati:

```text
Stop
→ tracking roles terminati
→ nessun respawn 10s

login-only
→ started
→ already_active
→ un solo PID/executionId
→ tracking fermo
```

## Documento collegato

Il runbook linka:

```text
docs/validations/source-identity-live-verification.md
```

Quel documento contiene:

- collecting → recording;
- mismatch;
- restart;
- timeline disponibile;
- pending non verificato;
- decline non verificato.

Non contiene la sequenza:

```text
Stop 9B
login-only
started/already_active
no respawn 10s
```

## Ricerca repository

Non è stato individuato, sulla baseline auditata, un artifact Markdown dedicato a quella sequenza 9B.

## Conseguenza

Il blocco 9B nel runbook è una dichiarazione storica inline senza:

```text
data
SHA
ambiente
azioni precise
artifact
limiti completi
```

## Finding `LIVE-CTRL-007` — normalizzare validation provenance e verification matrix

**Priorità:** medium  
**Tipo:** validation provenance and verification

### Validation storica

Se esiste materiale reale della 9B:

```text
creare o aggiornare un artifact sotto docs/validations/
```

con metadata reali.

Se i metadata non esistono:

```text
non registrato
```

senza ricostruzione.

### Runbook

Mantenere soltanto:

- scenari da verificare;
- stato corrente;
- link all'artifact storico.

### Test automatici da aggiungere/esplicitare

Coordinare la suite con:

```text
SOFA-LIVE-009
```

e coprire in particolare:

```text
partial Stop
post-Stop gate 404
Runtime Health senza tracker drain proof
remaining + second Stop
Stop → immediate new Start
mismatch + Sofa in-flight
post-Stop persisted reads vs current state
```

---

# 9. Stop globale e `eventId` informativo

## Esito: corretto

`buildStopMatchResponse()` legge:

```text
eventId = payload.eventId || null
```

ma il comportamento di stop è:

```text
stopAllMatchTrackers()
terminatePythonProcesses("tracking")
```

Quindi l'eventId non limita lo scope.

La risposta:

```text
scope = all-live-tracking
```

rappresenta correttamente il carattere globale.

Non devono essere implementati stop parziali per eventId senza una decisione esplicita.

---

# 10. Preservazione `betfair_login`

## Esito: corretta

`terminatePythonProcesses("tracking")` seleziona soltanto:

```text
sofa_tracking
betfair_tracking
```

Il ruolo:

```text
betfair_login
```

appartiene allo scope login.

Il test del registry verifica anche:

```text
tracking scope
→ login generation unchanged
```

e il test route verifica che il login non venga toccato.

La distinzione del runbook è corretta.

---

# 11. Invalidation generation

## Esito: corretta nel cleanup processi

`terminateScope("tracking")` chiama:

```text
terminateSelected(..., { invalidate: true })
```

che prima esegue:

```text
invalidateForScope("tracking")
```

e poi termina le entry selezionate.

Quindi il runbook può mantenere:

```text
tracking generation invalidata
```

come parte della Stop sequence.

Resta però distinto da:

```text
trackingSessionId
```

che non è ancora implementato end-to-end.

---

# 12. Gate Source Identity durante Stop

## Esito: comportamento corrente preciso

`stopAllMatchTrackers()`:

```text
trackedMatches.clear()
scheduler clear
clearAllSourceIdentityGates()
```

Manual Stop quindi rimuove il gate.

Mismatch usa invece:

```text
preserveGateEventId
```

per conservare lo stato mismatch.

Questa distinzione deve essere esplicitata meglio nel runbook:

```text
manual Stop
→ gate rimosso

mismatch callback
→ mismatch gate preservato
```

e non trattare le due condizioni come lo stesso tipo di stopped state.

---

# 13. `collecting` e `pending`

## Esito: semantica di gate corretta, garanzia session-scoped ancora dipendente dai finding esistenti

Nel gate:

```text
collecting
pending
```

i nuovi sample validi vengono bufferizzati.

Il bootstrap non viene aperto finché l'identità non è aligned/confirmed.

Questa è la semantica corretta.

Ma la promessa assoluta:

```text
nessuna nuova persistenza della sessione corrente
```

resta dipendente dall'assenza di callback stale/no-gate provenienti da sessioni precedenti.

Per questo `LIVE-CTRL-001` deve qualificare il runbook fino a `IMPL-006`.

---

# 14. `recording`

## Esito: bootstrap success richiesto

`openRecording()` chiama:

```text
session.onOpenRecording(...)
```

e passa a:

```text
recording
```

soltanto se:

```text
res?.ok === true
```

Altrimenti:

```text
phase = pending
error = Bootstrap persistence failed
```

Quindi il runbook è corretto nel considerare `recording` più forte del semplice aligned detector.

Resta aperto il problema della confirmation persistita prima del bootstrap, già censito altrove.

---

# 15. `not-applicable`

## Esito: corretto

Senza Betfair:

```text
session.hasBetfairUrl === false
→ phase = not-applicable
```

e la persistenza SofaScore può procedere.

Il runbook correttamente avverte di attendere il primo sample valido prima di aspettarsi la timeline.

---

# 16. Evidence in collecting/pending

## Esito: wording da mantenere prudente

Il documento dice:

```text
GET Evidence latest può 404
```

non:

```text
deve 404
```

Questa formulazione è corretta.

Se esistono timeline persistite preesistenti dello stesso eventId, Evidence può potenzialmente essere costruibile.

Per questo `LIVE-CTRL-001` deve mantenere separato:

```text
Evidence available
current session recording
```

---

# 17. Money Flow

## Esito: deve restare vincolato alla freshness

Il runbook contiene la regola:

```text
Un valore visibile non dimostra automaticamente che sia recente,
completo o tradabile.
```

È una formulazione corretta e importante.

Dopo Stop, gli hook Betfair possono continuare a leggere history/timeline.

Quindi grafico o ultimo punto visibile non devono essere presentati come:

```text
new live flow
```

senza freshness/current-state.

Le task owner restano:

```text
FRONT-POLL-003
FRONT-POLL-008
FRONT-BETFAIR-006
QUALITY-FLOW-*
```

Nessun nuovo calcolo viene proposto.

---

# 18. Stop frontend Overview

## Esito: comportamento reale documentato correttamente ma incompleto sul failure path

`handleStopLiveTracking()`:

1. mostra `Stopping live tracking...`;
2. chiama `/api/match/stop`;
3. se `data.ok`:
   - `Live tracking stopped`;
   - `stopSofaPolling()`;
   - `setTrackingStopped(true)`.

Non:

- nasconde la shell;
- cancella confirmed session;
- ferma esplicitamente Betfair polling;
- ferma Evidence polling;
- disabilita Source Identity polling.

Quindi il runbook descrive correttamente il comportamento corrente.

Il gap resta la falsa success condition basata sul solo top-level `ok`.

---

# 19. Stop e ritorno al form

## Esito: lifecycle diverso dal bottone Overview

`stopAndReturnToLinks()`:

```text
stop endpoint
→ stop Sofa polling
→ clear confirmed session
→ hide shell
→ set trackingStopped
→ reset bootstrap
```

Questo percorso è usato, per esempio, nel decline/return flow.

Va mantenuta la distinzione tra:

```text
Overview Stop
→ resta nella shell

Stop and return to links
→ chiude session shell
```

Il runbook oggi è principalmente centrato sul primo.

Una breve nota può evitare che i due controlli vengano considerati equivalenti lato UI.

La semantica backend resta globale in entrambi i casi.

---

# 20. Shutdown completo

## Esito: sostanzialmente corretto

Il backend:

```text
server.close()
→ force timer
→ start stopAndDrainTrackers
→ terminate all Python
→ await tracker drain
→ await listener close
→ release writer authority solo se tracker drain positivo
→ exit
```

Il documento rende correttamente:

- terminal barrier;
- drain;
- cleanup all;
- listener;
- release;
- fail-closed authority.

La differenza temporale parent-launcher/backend resta già censita in:

```text
PY-RUNTIME-004
```

e non viene duplicata.

---

# 21. Drain e cleanup Python in shutdown

## Esito: formulazione corretta

Il drain Node viene avviato prima del cleanup Python.

Il cleanup Python può quindi aiutare a sbloccare Promise che attendono il child.

Il server aspetta poi il drain prima del release.

Questo è coerente.

---

# 22. Writer authority retained su drain failure

## Esito: corretto

Quando:

```text
trackerDrainOk !== true
```

il backend costruisce:

```text
writerAuthorityRelease = {
  released: false,
  state: retained,
  reason: tracker_drain_failed
}
```

e non chiama il release.

Il runbook descrive correttamente il fail-closed.

---

# 23. Force timeout

## Esito: corretto come safety property

Il force timer:

```text
exit(0)
```

senza passare da release anticipato.

Quindi il record authority resta disponibile al successivo recovery process-level, che deve verificare che il vecchio owner sia morto.

Il problema del budget launcher/backend resta `PY-RUNTIME-004`.

---

# 24. Shutdown duplicato

## Esito: corretto

`createShutdownHandler()` mantiene:

```text
shutdownPromise
```

La seconda invocazione ritorna la stessa Promise.

Non duplica:

- drain;
- Python cleanup;
- writer release;
- exit scheduling ordinario.

La documentazione è coerente.

---

# 25. Validation automatica

## Stato attuale

Sono presenti test specifici per:

### trackingResponses

- track input;
- CDP;
- runtime conflict;
- stop;
- cleanup summary;
- login preservation;
- bounded cleanup failure;
- redacted logging.

### pythonProcessRegistry

- ownership;
- spawn;
- unregister;
- graceful stop;
- force kill;
- remaining;
- tracking/login scope;
- generation invalidation;
- output redaction.

### matchTracker / server

I report precedenti hanno già censito la loro copertura.

## Gap specifico del runbook

Mancano scenari operativi espliciti:

```text
post-Stop gate 404
Runtime Health zero Python + Node operation still pending
remaining + second Stop
immediate new Start after Stop
post-Stop Betfair/Evidence polling
```

Questi vengono registrati in `LIVE-CTRL-007`.

---

# 26. Regole operative

## Esito: buone e da preservare

Sono corrette:

```text
non usare Stop come smoke test
non usare Stop per release writer authority
non chiudere Chrome come normale procedura
non cancellare writer authority
non trattare last Betfair tick come current
non dedurre Source Identity dagli URL
non modificare history/timeline manualmente
non creare timeline per bypass gate
non dedurre Source Identity dalla sola Evidence
```

Aggiungere:

```text
non ripetere Stop assumendo che un remaining venga automaticamente ritentato
```

finché `LIVE-CTRL-004` non viene risolto.

E aggiungere:

```text
Runtime Health tracking roles zero
≠
tracker Node drained
```

finché il relativo contratto non cambia.

---

# 27. Lunghezza, integrità del contesto e modularizzazione

## Dimensione

```text
233 righe
```

Il documento contiene:

- preflight operativo;
- osservazione live;
- Source Identity;
- Stop;
- Runtime Health;
- shutdown;
- validation;
- regole operative.

## Responsabilità

Tutte queste sezioni servono allo stesso obiettivo:

```text
controllare una sessione live
e fermarla senza confondere Stop con shutdown
```

Non ci sono owner indipendenti sufficientemente forti per giustificare lo split.

## Documenti specialistici già esistenti

I dettagli rimangono altrove:

```text
modules/sofa/01-live-tracking.md
api/01-match.md
api/06-runtime-health.md
modules/evidence/02-source-identity.md
operations/01-local-runtime.md
modules/storage/02-commit-journal-and-recovery.md
```

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare task di modularizzazione.

---

# Riferimenti per la futura mappa/ledger

```text
Report ID: TDUI-DOC-REPORT-033
Percorso report: Report documentale/33 - 02-live-tracking-control.md
Documento: docs/tennis-decision-ui/operations/02-live-tracking-control.md

Change ID: LIVE-CTRL-001
Change ID: LIVE-CTRL-002
Change ID: LIVE-CTRL-003
Change ID: LIVE-CTRL-004
Change ID: LIVE-CTRL-005
Change ID: LIVE-CTRL-006
Change ID: LIVE-CTRL-007

Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
SOURCE-ID-001
SOURCE-ID-002
FRONT-SESSION-002
FRONT-SESSION-003
FRONT-SESSION-007
FRONT-POLL-002
FRONT-POLL-003
FRONT-POLL-008
FRONT-BETFAIR-006
SOFA-LIVE-001
SOFA-LIVE-003
SOFA-LIVE-004
SOFA-LIVE-007
SOFA-LIVE-009
IMPL-006
PY-RUNTIME-004
LOCAL-RUNTIME-006
```

---

# Modifiche proposte

## `LIVE-CTRL-001` — current-session verification authority

**Priorità:** high

- distinguere current live / persisted / last-known;
- non usare timeline, Evidence o dashboard presenti come prova della sessione corrente;
- dichiarare il limite eventId-based finché manca `IMPL-006`;
- dopo session authority, verificare la session identity corrente;
- nessuna cancellazione dati preesistenti per “pulire” la verifica.

---

## `LIVE-CTRL-002` — Stop completion semantics

**Priorità:** high

- top-level `ok:true` non è prova di cleanup fisico;
- distinguere logical stop e Python cleanup;
- richiedere `pythonCleanup.ok:true` + `remaining:0` per completion processi;
- coordinare `SOFA-LIVE-003` e `FRONT-SESSION-007`;
- aggiornare la verifica operativa del runbook.

---

## `LIVE-CTRL-003` — Runtime Health quiescence semantics

**Priorità:** high

- `pythonProcesses` prova soltanto process lifecycle;
- `sofa_tracking=0` e `betfair_tracking=0` non provano `activeTrackerOperations=0`;
- ordinary Stop non è tracker drain;
- evitare di chiamare “drained” uno stato solo Python-clean;
- coordinare con `IMPL-006`/`SOFA-LIVE-001`.

---

## `LIVE-CTRL-004` — retry/recovery dello Stop incompleto

**Priorità:** high

- definire cosa fare con `pythonCleanup.remaining > 0`;
- correggere il fatto che la `terminationPromise` risolta come remaining impedisce un nuovo tentativo fisico sulla stessa entry;
- scegliere reattempt owned oppure procedura shutdown esplicita;
- nessun kill per porta;
- test first remaining → second Stop.

---

## `LIVE-CTRL-005` — post-Stop Source Identity e persisted reads

**Priorità:** medium

- manual Stop cancella il gate;
- source-identity-status può 404;
- trackingStopped governa la presentazione UI;
- Betfair/Evidence possono continuare a leggere persisted data;
- dati post-Stop devono essere marcati stopped/last-known;
- coordinare `FRONT-POLL-003/008` e `FRONT-BETFAIR-006`.

---

## `LIVE-CTRL-006` — restart e mismatch semantics

**Priorità:** high

- distinguere “new Start API permitted” da “restart session-safe”;
- qualificare la promessa su SofaScore in-flight nel mismatch;
- coordinare `SOFA-LIVE-001`, `SOFA-LIVE-004`, `SOURCE-ID-002`, `IMPL-006`;
- non introdurre delay empirici come workaround.

---

## `LIVE-CTRL-007` — validation provenance e verification matrix

**Priorità:** medium

- spostare la 9B in artifact validation solo con metadata reali;
- se SHA/data/ambiente mancanti usare `non registrato`;
- non usare pass storici inline come prova corrente;
- aggiungere test post-Stop gate 404, partial cleanup, remaining retry, Node in-flight, immediate restart e persisted-vs-current.

---

# Ordine consigliato di applicazione

```text
1. SOFA-LIVE-003
2. LIVE-CTRL-002
3. LIVE-CTRL-004
4. IMPL-006 / SOFA-LIVE-001 / SOURCE-ID-002
5. LIVE-CTRL-001
6. LIVE-CTRL-003
7. LIVE-CTRL-006
8. FRONT-POLL-003 / FRONT-POLL-008 / FRONT-BETFAIR-006
9. LIVE-CTRL-005
10. SOFA-LIVE-009
11. LIVE-CTRL-007
12. revisione mirata operations/02-live-tracking-control.md
13. checker documentali
```

La priorità è:

```text
non dichiarare Stop riuscito
prima di sapere cosa è realmente stato fermato
```

e subito dopo:

```text
non dichiarare una sessione nuova/current
sulla sola base di dati persistiti dello stesso eventId
```

---

# Verification matrix proposta

## A. Stop normale riuscito

Setup:

```text
sofa_tracking attivo
betfair_tracking attivo
betfair_login attivo
```

Azione:

```text
POST /api/match/stop
```

Atteso:

```text
trackedMatches vuoto
scheduler fermato
Source Identity Gate manuale rimosso
tracking generation invalidata
sofa_tracking terminato
betfair_tracking terminato
betfair_login preservato
pythonCleanup.ok=true
pythonCleanup.remaining=0
backend attivo
writer authority mantenuta
CDP attivo
```

---

## B. Source Identity dopo Stop

Dopo Stop riuscito:

```text
GET /api/match/:eventId/source-identity-status
```

Atteso:

```text
404
```

salvo lifecycle esplicitamente differente.

Frontend:

```text
trackingStopped=true
→ Tracking fermo
```

Non:

```text
persisted gate state
```

---

## C. Betfair/Evidence dopo Stop

Dopo Stop:

```text
Betfair polling può restare attivo
Evidence polling può restare attivo
```

Ma il rendering deve distinguere:

```text
persisted/last-known
```

da:

```text
current live
```

---

## D. Stop partial

Fixture:

```text
python cleanup:
ok=false
remaining=1
errors=[exit_unconfirmed]
```

Atteso corrente:

```text
top-level ok può essere true
```

Target:

```text
frontend/runbook non dichiara full stop completion
```

---

## E. Second Stop dopo remaining

Primo Stop:

```text
remaining=1
```

Secondo Stop:

verificare il comportamento deciso da `LIVE-CTRL-004`.

Non lasciare questo caso implicito.

---

## F. Python clean, Node operation ancora in flight

Fixture:

```text
trackedMatches empty
python registry empty
activeTrackerOperations=1
```

Atteso:

```text
Runtime Health non viene interpretato come tracker drain completo
```

---

## G. Immediate restart

Sequenza:

```text
Start A
→ update in flight
→ Stop
→ Start B immediato
```

Target con `IMPL-006`:

```text
callback A rifiutata
callback B autorizzata solo dalla session authority B
nessuna persistenza stale A
```

---

## H. Mismatch

Sequenza:

```text
gate mismatch
```

Verificare:

```text
trackedMatches fermati
mismatch gate preservato
tracking generation invalidata
Betfair scraper termination
Sofa in-flight non dichiarato harmless senza session guard
```

---

## I. Shutdown completo

Verificare separatamente:

```text
terminal barrier
tracker drain
Python all cleanup
listener close
writer authority release soltanto con drain positivo
```

Stop e shutdown non devono condividere la stessa completion definition.

---

## J. Validation provenance

Ogni live validation nuova deve indicare:

```text
data
SHA
ambiente
azioni
risultati
scenari non esercitati
artifact
limiti
```

Nessuna ricostruzione retroattiva.

---

# Decisione finale

```text
02-live-tracking-control.md:
BUON RUNBOOK OPERATIVO, MA LA DEFINIZIONE DI "STOP COMPLETO"
DEVE ESSERE PIÙ FORTE E PIÙ PRECISA

Punti solidi:
- Stop ≠ shutdown
- tracking scope globale
- login preservato
- backend/CDP preservati
- writer authority mantenuta
- terminal barrier solo shutdown
- shutdown drain fail-closed
- no kill by port
- no manual storage repair
- freshness separata dalla mera visibilità

Gap principali:
- top-level Stop ok:true può coesistere con cleanup failure
- Runtime Health non prova Node tracker drain
- repeated Stop non reitera necessariamente un remaining
- Source Identity Gate non è persisted post-Stop: viene cancellato
- Betfair/Evidence possono continuare a mostrare persisted data
- nuovo Start è permesso ma non ancora pienamente session-safe
- mismatch Sofa in-flight wording troppo forte
- verification 9B senza artifact provenance individuato

Modifiche nuove: 7
Riscrittura completa: no
Modularizzazione: no
Nuovi file canonici: nessuno
Priorità complessiva: critica
```

Le tre distinzioni operative da rendere esplicite sono:

```text
Stop request accepted
≠
physical cleanup complete
```

```text
Python tracking roles = 0
≠
Node tracker operations drained
```

```text
persisted data dello stesso eventId
≠
dato della sessione live corrente
```

Queste distinzioni consentono di mantenere il runbook come owner operativo senza duplicare le authority tecniche già assegnate ai moduli specialistici.

---

# Stato di applicazione

```text
LIVE-CTRL-001 → completata
LIVE-CTRL-002 → completata
LIVE-CTRL-003 → completata
LIVE-CTRL-004 → aperta: il registry riusa ancora la terminationPromise dopo remaining
LIVE-CTRL-005 → completata
LIVE-CTRL-006 → completata
LIVE-CTRL-007 → aperta: artifact con provenance e matrice completa non ancora disponibili
```

Il runbook distingue ora sessione corrente, stato persistito e `last-known`; separa stop logico, cleanup Python e drain Node; descrive il `404` del Source Identity Gate dopo Stop e qualifica il nuovo Start tramite `trackingSessionId`. Nessuna modifica al codice è stata eseguita durante questa applicazione documentale.
