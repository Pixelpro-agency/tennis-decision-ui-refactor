# Report documentale — `docs/tennis-decision-ui/modules/evidence/02-source-identity.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-017
Sequenza audit: 17/72
Documento analizzato: 02-source-identity.md
Percorso documento: docs/tennis-decision-ui/modules/evidence/02-source-identity.md
Percorso report: Report documentale/17 - 02-source-identity.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 47b0ce95c56ab1107b8b0c5ecdc58a11b8074b1d
Dimensione documento: 457 righe
Ruolo dichiarato: owner del Source Identity Gate live e del contratto di identità effective
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/sourceIdentityGate.js`;
- `backend/src/sofa/sourceIdentityGate/sessionFactory.js`;
- `backend/src/sofa/sourceIdentityGate/evaluator.js`;
- `backend/src/sofa/sourceIdentityGate/manualConfirmation.js`;
- `backend/src/sofa/sourceIdentityGate/sampleValidation.js`;
- `backend/src/sofa/sourceIdentityGate/status.js`;
- `backend/src/sofa/matchTracker.js`;
- `backend/src/sofa/trackerUpdate.js`;
- `backend/src/sofa/betfair/trackerUpdate.js`;
- `backend/src/sofa/betfairFetch.js`;
- `backend/src/sofa/betfair/scraperLifecycle.js`;
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`;
- `backend/src/routes/match.js`;
- `backend/src/routes/match/sourceIdentityStatusResponse.js`;
- `backend/src/routes/evidence.js`;
- `backend/src/routes/evidence/evidenceResponses.js`;
- `backend/src/sofa/matchEvidence/sourceIdentity/builder.js`;
- `backend/src/sofa/matchEvidence/sourceIdentity/marketEpoch.js`;
- `backend/src/sofa/matchEvidence/sourceIdentityConfirmation.js`;
- `backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js`;
- test correnti del gate, matching, epoch, confirmation ed endpoint status;
- `docs/validations/source-identity-live-verification.md`;
- i finding già registrati nei report Evidence, Data Lifecycle e Betfair lifecycle.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Matching automatico: ben coperto e coerente
Market epoch/fingerprint confirmation: robusti
Gate phase model: coerente
Status endpoint redatto: sostanzialmente corretto
Session authority end-to-end: assente
Gate identity: solo eventId-based
no-gate persistence: fail-open nel tracking corrente
Manual confirmation: persiste prima del bootstrap
Confirmation endpoint: possiede anche un fallback senza gate live
Bootstrap failure recovery: più rigida di quanto il documento descriva
Confirmation-store failures: poco osservabili
Mismatch cleanup wording: da aggiornare
Validazione live inline: da separare
Verification gap: stale callbacks e no-gate non coperti
Modifiche proposte: 9
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
```

Il documento descrive correttamente molti aspetti importanti:

- distinzione `phase` / `sourceIdentity.status`;
- `collecting`, `pending`, `recording`, `mismatch`, `not-applicable`;
- buffering prima di recording;
- bootstrap SofaScore → Betfair;
- matching biunivoco;
- mismatch per runner estraneo;
- pending per ambiguità reale;
- market epoch;
- fingerprint manuale;
- binding a event/epoch/market/selectionIds/runner mapping;
- mismatch terminale;
- redazione dello status endpoint;
- separazione gate live / effective identity Evidence.

La correzione più importante riguarda però una proprietà che il documento non espone:

```text
eventId
≠
tracking session authority
```

Il gate è memorizzato per `eventId`.

Le callback live chiamano gli observer usando soltanto `eventId`.

Non esiste ancora un `trackingSessionId` propagato fino al punto in cui una callback decide se:

- osservare il gate;
- persistere;
- bootstrap;
- produrre effetti.

Inoltre:

```text
no-gate
```

non è fail-closed.

Nel tracking corrente significa:

```text
persist-current compatibility path
```

perché sia SofaScore sia Betfair persistono quando l'observer ritorna `no-gate`.

Questo rende il gap di session authority concretamente rilevante dopo Stop, untrack e nuovo Start.

---

# 1. Gate indicizzato soltanto per `eventId`

## Esito: manca una session authority reale

`startSourceIdentityGate(eventId, ...)` memorizza la sessione nello store per:

```text
eventId
```

La sessione contiene:

```text
eventId
phase
bufferGeneration
attemptedBootstrapGeneration
recordingGeneration
...
```

ma non contiene:

```text
trackingSessionId
session token
request generation end-to-end
```

Gli observer:

```text
observeSofaSourceIdentitySample(eventId, ...)
observeBetfairSourceIdentitySample(eventId, ...)
```

recuperano sempre:

```text
getGateSession(eventId)
```

al momento della callback.

## Conseguenza sullo stesso eventId

Scenario:

```text
Start A
→ update Sofa A in flight

nuovo Start sullo stesso eventId
→ gate A cancellato
→ gate B creato

callback A termina dopo
→ observe(eventId)
→ trova gate B
```

La callback A non possiede informazioni per dimostrare:

```text
appartengo alla sessione B
```

e può quindi contaminare il buffering/evaluator del nuovo gate.

## `bufferGeneration` non risolve il problema

`bufferGeneration`:

- nasce a `0`;
- incrementa quando una sessione `recording` torna `pending`;
- impedisce bootstrap ripetuti nella stessa generation.

Non viene:

- assegnata alle richieste live;
- catturata prima del fetch;
- verificata alla fine del fetch;
- confrontata prima della persistenza.

Quindi:

```text
bufferGeneration
≠
trackingSessionId
```

## Finding `SOURCE-ID-001` — introdurre una session authority end-to-end

**Priorità:** critica  
**Tipo:** session authority

### Coordinamento

La soluzione è già approvata come:

```text
IMPL-006
```

Non creare un secondo sistema parallelo.

### Contratto target

Ogni Start deve produrre:

```text
trackingSessionId
```

e ogni effetto live deve verificare:

```text
eventId
+
trackingSessionId
```

immediatamente prima di:

- osservare Source Identity;
- bootstrap;
- persist-current;
- modificare runtime;
- aggiornare stato frontend session-scoped.

### Documento

Aggiungere chiaramente:

```text
Stato corrente:
→ gate eventId-based
→ non ancora session-safe end-to-end
```

---

# 2. `no-gate` è fail-open verso la persistenza

## Esito: gap critico e non documentato

La tabella azioni descrive:

```text
no-gate
→ Non esiste una sessione gate per l'evento
```

ma non dice cosa fa il tracker.

## SofaScore

`updateSofa()` esegue:

```js
const action = observation?.action || 'no-gate';

if (action === 'persist-current' || action === 'no-gate') {
    persistFn(...)
}
```

Quindi:

```text
no-gate
→ persistenza canonica
```

## Betfair

`updateBetfair()` applica lo stesso schema:

```text
action === persist-current
OR
action === no-gate
→ persist
```

## Scenario dopo Stop/cambio evento

```text
Start evento A
→ update in flight

Stop oppure Start evento B
→ gate A rimosso

callback evento A termina
→ observe(A)
→ no-gate

tracker update
→ persiste il campione A
```

La rimozione del gate non rende quindi automaticamente innocua una callback tardiva.

Questo è il caso più forte che dimostra perché:

```text
clear gate
≠
invalidate in-flight effect
```

## `not-applicable` è già il percorso esplicito senza Betfair

Non serve usare `no-gate` come sinonimo di:

```text
nessun controllo necessario
```

Quando non esiste una Betfair URL, il gate viene creato in:

```text
not-applicable
```

e l'observer valido restituisce:

```text
persist-current
```

Quindi il tracking canonico possiede già un percorso esplicito e sicuro per Sofa-only.

## Finding `SOURCE-ID-002` — rendere `no-gate` fail-closed nel tracking canonico

**Priorità:** critica  
**Tipo:** persistence authorization

### Target

Nel tracking live canonico:

```text
no-gate
→ nessuna persistenza
→ reason bounded
```

salvo un eventuale percorso legacy esplicitamente separato e non confondibile con il tracking.

### Coordinamento

Applicare insieme a:

```text
IMPL-006
DATA-LIFE-002
BETFAIR-LIFE-002
```

### Test obbligatorio

```text
Start A
→ update in flight
→ Stop
→ callback A
→ no canonical write
```

e:

```text
Start A
→ update in flight
→ Start B
→ callback A
→ no canonical write
```

---

# 3. Conferma manuale persistita prima del bootstrap

## Esito: gap cross-layer critico confermato

`confirmGateSession()` esegue:

```text
validate
→ upsert confirmation
→ apply confirmation
→ onOpenRecording
```

Quindi la confirmation è già persistita prima di conoscere l'esito del bootstrap.

Se:

```text
onOpenRecording
→ ok:false
```

il gate ritorna:

```text
phase:pending
error:"Bootstrap persistence failed"
```

ma il record resta nel confirmation store.

## Effetto

Evidence può in seguito applicare il record persistito al medesimo contesto.

Anche il gate stesso, quando rivaluta il contesto, legge automaticamente confirmation applicabili dal store.

Quindi può esistere:

```text
confirmation persistita
+
bootstrap non riuscito
```

senza un flag che distingua:

```text
confirmation autorizzata e attiva
da
confirmation salvata ma bootstrap non completato
```

## Finding `SOURCE-ID-003` — rendere atomico il passaggio confirmation → recording

**Priorità:** critica  
**Tipo:** confirmation lifecycle consistency

### Coordinamento obbligatorio

Usare come owner runtime le task già registrate:

```text
EVIDENCE-API-008
DATA-LIFE-004
EVID-SNAPSHOT-005
```

### Possibili pattern

La soluzione deve essere unica, per esempio:

```text
persist-after-bootstrap
```

oppure:

```text
pending_bootstrap
→ active
→ failed
```

oppure rollback compensativo.

Il documento Source Identity non deve introdurre una quarta implementazione.

---

# 4. Il POST confirmation possiede due modalità, non una

## Esito: contratto incompleto

Il documento afferma:

```text
Il POST è valido soltanto per un pending reale comunicato dal backend.
```

Questo è vero in senso generico, ma nasconde due percorsi molto diversi.

## Con gate live attivo

`buildGateManualConfirmationResponse()`:

```text
gate collecting
→ 422

gate mismatch/recording
→ 409

gate pending
→ confirmActiveSourceIdentityGate()
→ bootstrap
→ recording oppure failure
```

## Senza gate live

Se:

```text
getSourceIdentityGateStatus(eventId)
→ no active gate
```

la funzione ritorna:

```text
null
```

e la route Evidence esegue il fallback:

```text
load timeline state
→ automatic Source Identity
→ validate confirmation
→ upsert confirmation store
→ 200 confirmed:true
```

senza:

- gate live;
- bootstrap;
- transizione recording.

Quindi il sistema supporta oggi anche una:

```text
timeline-based confirmation
```

persistita fuori dal lifecycle live.

## Conseguenza semantica

Una risposta:

```text
confirmed:true
```

non significa necessariamente:

```text
gate live recording
```

Nel fallback significa soltanto:

```text
confirmation record persisted
```

## Finding `SOURCE-ID-004` — decidere il contratto del fallback senza gate

**Priorità:** alta  
**Tipo:** confirmation API semantics

### Opzione A — live-only

Se la conferma deve esistere soltanto durante un pending gate reale:

```text
nessun gate
→ 404/409
→ nessun upsert fallback
```

### Opzione B — persisted timeline confirmation supportata

Se il fallback è intenzionale, documentare esplicitamente:

```text
confirmed:true
≠ recording
```

e distinguere il response contract, per esempio con uno stato:

```text
confirmationPersisted
gateApplied
bootstrapCompleted
```

### Coordinamento

Allineare con:

```text
EVIDENCE-API-006
EVIDENCE-API-007
EVIDENCE-API-008
```

---

# 5. Bootstrap fallito: la generation corrente resta bloccata

## Esito: il documento descrive soltanto una parte del comportamento

Il documento dice:

```text
bootstrap fallisce
→ pending
→ nessun retry automatico dello stesso bootstrap
```

Questo è corretto, ma incompleto.

## Meccanismo

Prima del bootstrap:

```text
attemptedBootstrapGeneration
=
bufferGeneration
```

Se il bootstrap fallisce:

```text
phase
→ pending
```

ma:

```text
bufferGeneration
```

non cambia.

Nelle valutazioni successive:

```text
attemptedBootstrapGeneration === bufferGeneration
→ phase resta pending
→ openRecording non richiamato
```

## Quando cambia `bufferGeneration`

Il contatore viene incrementato soltanto quando:

```text
session.phase === recording
+
nuova identity pending
```

Dopo un bootstrap iniziale fallito, la sessione è già:

```text
pending
```

Quindi un nuovo contesto pending non incrementa automaticamente la generation.

Anche una conferma manuale successiva controlla:

```text
attemptedBootstrapGeneration === bufferGeneration
```

e può restituire:

```text
bootstrap_persistence_failed
```

senza nuovo tentativo.

## Conseguenza

Dopo un bootstrap fallito, il gate può richiedere:

```text
clear/new Start
```

per ottenere una nuova sessione realmente retryable.

Il documento non lo dice.

## Finding `SOURCE-ID-005` — definire la recovery dopo bootstrap fallito

**Priorità:** alta  
**Tipo:** gate recovery semantics

### Decisione richiesta

Stabilire se il comportamento desiderato è:

```text
bootstrap fail
→ sessione bloccata fino a nuovo Start
```

oppure:

```text
nuovo contesto valido
→ nuova bootstrap generation
→ nuovo tentativo ammesso
```

### Test mancante

Aggiungere:

```text
bootstrap iniziale fallisce
→ nuovo market/selectionIds
→ nuova pending identity
→ conferma
→ comportamento definito
```

Non chiamare `bufferGeneration` una session generation.

---

# 6. Errori del confirmation store poco osservabili e mapping HTTP non corretto

## Esito: fail-closed ma diagnosi insufficiente

## Lettura automatica nel gate

`buildEffectiveIdentity()`:

```text
findApplicableSourceIdentityConfirmation(context)
```

Se il lookup ritorna:

```text
ok:false
```

la confirmation viene semplicemente ignorata.

Il gate resta pending/automatico senza una reason:

```text
confirmation store unavailable
```

## Conferma manuale

Se l'upsert fallisce:

```text
confirmGateSession
→ code:persistence_failed
```

Se il bootstrap fallisce:

```text
→ code:bootstrap_persistence_failed
```

`buildManualConfirmationValidationResponse()` però assegna status speciali soltanto a:

```text
confirmation_context_incomplete → 422
automatic_identity_not_pending → 409
```

tutti gli altri code diventano:

```text
HTTP 400
"Source identity confirmation is invalid"
```

Quindi un errore di storage/backend viene presentato come errore dell'input utente.

## Finding `SOURCE-ID-006` — separare validation failure da infrastructure failure

**Priorità:** alta  
**Tipo:** confirmation error contract

### Coordinamento

Riutilizzare:

```text
EVIDENCE-API-006
EVIDENCE-API-007
```

### Target

Separare almeno:

```text
input invalid
context incomplete
automatic identity not pending
confirmation store unavailable
confirmation persist failed
bootstrap persistence failed
```

con HTTP/code coerenti.

### Status live

Quando il confirmation store è il motivo per cui una confirmation automatica non può essere applicata, rendere disponibile una reason bounded senza:

- path;
- stack;
- archive raw;
- fingerprint sensibile non necessario.

---

# 7. Mismatch cleanup: non è semplicemente “SIGTERM”

## Esito: wording runtime superato

Il documento descrive:

```text
SIGTERM ai soli scraper Betfair figli del progetto
```

Il percorso corrente passa da:

```text
terminateActiveBetfairScrapers()
→ terminateActiveScraperLifecycle()
→ processRegistry.terminateRoles([BETFAIR_TRACKING], ...)
```

Il registry applica il lifecycle di terminazione posseduto dal progetto.

Il risultato espone:

```text
graceful
forceKilled
alreadyExited
remaining
errors
```

Quindi la semantica corretta è:

```text
terminazione scoped e bounded dei processi Betfair tracking posseduti
```

non una promessa che il cleanup consista soltanto in un singolo `SIGTERM`.

## Finding `SOURCE-ID-007` — aggiornare il contratto di cleanup mismatch

**Priorità:** media  
**Tipo:** runtime ownership

### Modifica richiesta

Usare:

```markdown
→ terminazione scoped dei figli Python con ruolo Betfair tracking
  tramite il Python process registry
→ eventuale escalation secondo il lifecycle runtime
→ Chrome/CDP non terminati
```

Preservare:

- nessun kill di processi esterni;
- Chrome/CDP aperti;
- gate mismatch preservato;
- campione causale non persistito.

---

# 8. Validazione live duplicata nel documento owner

## Esito: ownership documentale da pulire

Il documento apre con:

```text
Implementato, da validare live
```

e subito dopo elenca:

```text
Sono già verificati live:
collecting → recording
mismatch → form
mismatch → nuovo Start → aligned
```

Esiste già un documento specifico:

```text
docs/validations/source-identity-live-verification.md
```

che registra:

- osservazioni consolidate;
- casi non verificati;
- limiti;
- assenza dello SHA originale.

Quindi il documento owner sta duplicando una validation storica.

## Formula più corretta dello stato

```text
Implementato.
Validazione live: parziale.
```

con link alla validation.

Questo evita che un'osservazione storica senza SHA venga interpretata come:

```text
PASS corrente sul commit auditato
```

## Finding `SOURCE-ID-008` — separare contratto e validazione live

**Priorità:** media  
**Tipo:** document ownership

### Modifica richiesta

Nel documento owner mantenere soltanto:

```text
stato implementazione
casi ancora da verificare
link alla validation storica
```

Togliere il dettaglio narrativo dei casi già osservati.

Non inventare uno SHA per la validation esistente.

---

# 9. La verification matrix non copre il gap di session authority

## Esito: suite utile ma manca il rischio principale

Il documento elenca numerosi test reali e pertinenti.

Sono effettivamente presenti, fra gli altri:

```text
sourceIdentityGate/lifecycle.test.mjs
sourceIdentityGate/epochRecovery.test.mjs
sourceIdentityGate/bootstrapFailures.test.mjs
sourceIdentityGate/mismatchAndIsolation.test.mjs
routes/match/sourceIdentityStatusResponse.test.mjs
matchEvidence/latestMatchEvidence/manualConfirmation.test.mjs
matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
```

I test coprono bene:

- aligned;
- pending;
- mismatch;
- confirmation;
- new epoch after recording;
- bootstrap failure;
- status response;
- input immutability;
- confirmation applicability.

## Gap non coperti

Non risultano nel contratto di verifica del documento casi come:

```text
Stop mentre update Sofa è in flight
→ callback tardiva
→ no-gate
→ nessuna persistenza

Start A → Start B stesso eventId
→ callback A non entra nel gate B

Start A evento A → Start B evento B
→ callback A non persiste via no-gate

confirmation store read failure
→ reason bounded

manual confirmation persistence failure
→ non HTTP 400 input error

bootstrap iniziale fail
→ nuovo contesto
→ retry policy definita

POST confirmation senza gate
→ comportamento live-only o fallback esplicitamente testato
```

## Finding `SOURCE-ID-009` — aggiungere test di authority e failure mapping

**Priorità:** alta  
**Tipo:** verification contract

### Target

La suite deve provare non soltanto:

```text
matching corretto
```

ma anche:

```text
chi ha il diritto di produrre effetti
```

prima e dopo Stop/new Start.

---

# 10. Matching automatico

## Esito: coerente

Il builder applica una logica fail-closed ragionevole.

Sono verificati:

```text
Sonego / Kecmanovic
→ aligned

runner completamente differenti
→ mismatch

un runner compatibile + uno estraneo
→ mismatch

ambiguità surname + estraneo
→ mismatch

due runner ambigui
→ pending

evidenza parziale biunivoca
→ pending

compound surname deterministico
→ aligned

given-name-only parziale
→ pending
```

Gli esempi principali del documento sono coerenti con i test.

Non sono necessarie correzioni alla filosofia del matching.

---

# 11. Apostrofi e forme compatte

## Esito: coerente ma delicato

I test distinguono:

```text
O'Connell
→ OConnell
→ aligned

O Connell
→ OConnell
→ pending manual confirmation
```

e casi analoghi:

```text
O Smith / OSmith
D Smith / DSmith
L Smith / LSmith
→ pending
```

Questa distinzione è intenzionale.

Il documento può mantenere l'affermazione generale che apostrofi/normalizzazione contribuiscono al matching, ma non deve riassumerla in una regola più permissiva del codice.

---

# 12. Betfair sample validation per il gate

## Esito: più stretta del classifier tecnico generale

`isValidBetfairSample()` richiede:

```text
esattamente 2 runner
nomi non vuoti
selectionId presenti
selectionId distinti
firma market valida
```

Quindi il gate non usa qualunque sample che il classifier tecnico top-level considera `usable`.

Questa è una proprietà positiva.

Il documento può mantenerla come boundary Source Identity.

### Nota

Il problema del classifier tecnico permissivo resta nell'owner Betfair e non va duplicato qui.

---

# 13. Sofa sample validation

## Esito: minima e coerente con lo scopo identity

Il gate Sofa richiede:

```text
players.home name/fullName
players.away name/fullName
```

Non usa score, stats o PBP per l'identità.

Questo è coerente.

La sicurezza cross-session non viene però da questa validazione; dipende da `SOURCE-ID-001/002`.

---

# 14. Active market epoch e confirmation fingerprint

## Esito: robusti

La firma epoch usa:

```text
marketId + selectionIds
```

quando disponibili.

Fallback:

```text
marketKey + normalized runners
```

La confirmation context richiede inoltre:

```text
eventId
epochSignature
marketId
2 selectionIds
2 Sofa players
2 Betfair runners
```

Il fingerprint include anche il mapping selezionato.

I test confermano che modifiche a:

- epoch;
- market;
- selection IDs;
- runner;
- mapping;

rendono la confirmation precedente non applicabile.

Questa parte può restare.

---

# 15. Gate live ed Evidence effective

## Esito: distinzione concettuale corretta

Il documento chiarisce che:

```text
gate live
→ autorizza nuova persistenza

effective identity Evidence
→ autorizza uso cross-source di dati persistiti
```

Questo è corretto.

La distinzione deve però essere accompagnata dal gap:

```text
confirmation persistita prima del bootstrap
```

perché altrimenti il lettore può assumere che le due authority divergano soltanto per ragioni fisiologiche e non anche per un limite transazionale corrente.

---

# 16. Status endpoint

## Esito: payload redatto correttamente

La route restituisce:

```text
ok
eventId
active
phase
persistence
sourceIdentity
updatedAt
error opzionale
```

e filtra `sourceIdentity` a:

```text
status
sofaPlayers
betfairRunners
reasons
```

Non espone:

- URL;
- marketId;
- selectionId;
- normalizedPairs;
- token;
- path;
- raw payload.

La parte di redazione è corretta.

## Limite eventId

La validazione corrente considera invalido soltanto:

```text
vuoto
whitespace-only
```

Una stringa arbitraria non vuota viene trattata come eventId e normalmente produce 404 gate assente.

Il tema della validazione eventId canonica è già registrato negli audit API e non viene duplicato qui come change ID autonomo.

---

# 17. Nuovo Start e cleanup gate

## Esito: descrizione da rendere più precisa

`trackMatch()` esegue:

```text
clearAllSourceIdentityGates()
→ startSourceIdentityGate(eventId)
```

Quindi un nuovo Start non pulisce soltanto:

```text
il gate precedente dello stesso evento
```

ma tutti i gate correnti.

Questo è coerente con il modello applicativo a singolo match tracked principale.

La criticità non è il cleanup in sé.

È che il cleanup non invalida le callback già in volo.

Correggere questa parte tramite `SOURCE-ID-001/002`.

---

# 18. Mismatch

## Esito: blocco logico corretto

Quando l'effective identity diventa mismatch:

```text
phase → mismatch
sample buffer → cleared
onMismatch → una sola volta
```

Gli observer successivi ritornano:

```text
blocked
```

Il campione causale non passa a `persist-current`.

Questa parte è corretta.

Il limite riguarda soltanto le callback concorrenti/stale fuori dalla sessione corrente.

---

# 19. Modularizzazione

## Valutazione

```text
Righe: 457
Responsabilità primaria: Source Identity
Due viste: gate live + effective identity
Algoritmo matching: stesso dominio
Confirmation: stesso dominio
Status: superficie dello stesso owner
Sottotemi indipendenti da separare: no
Duplicazione validation history: sì
Necessità di nuovi owner: no
Suddivisione richiesta: no
```

La lunghezza non giustifica uno split.

Separare in:

```text
gate-live.md
matching.md
confirmation.md
```

renderebbe più difficile comprendere:

```text
classificazione
→ authorization
→ bootstrap
→ Evidence effective
```

La soluzione corretta è:

- mantenere un owner unico;
- ridurre il collaudo storico inline;
- collegare i documenti frontend/API;
- aggiungere una sezione esplicita sulle authority correnti e mancanti.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-017
Percorso report: Report documentale/17 - 02-source-identity.md
Documento: docs/tennis-decision-ui/modules/evidence/02-source-identity.md
Change ID: SOURCE-ID-001
Change ID: SOURCE-ID-002
Change ID: SOURCE-ID-003
Change ID: SOURCE-ID-004
Change ID: SOURCE-ID-005
Change ID: SOURCE-ID-006
Change ID: SOURCE-ID-007
Change ID: SOURCE-ID-008
Change ID: SOURCE-ID-009
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `SOURCE-ID-001` — session authority end-to-end

**Priorità:** critical

- dichiarare il gate eventId-based;
- distinguere `bufferGeneration` da tracking session;
- applicare `IMPL-006`;
- rifiutare callback appartenenti a Start precedenti.

## `SOURCE-ID-002` — `no-gate` fail-open

**Priorità:** critical

- non persistere `no-gate` nel tracking canonico;
- usare `not-applicable` come percorso esplicito Sofa-only;
- coprire Stop/new Start con callback in flight;
- coordinare con session authority.

## `SOURCE-ID-003` — confirmation before bootstrap

**Priorità:** critical

- coordinare con `EVIDENCE-API-008`, `DATA-LIFE-004`, `EVID-SNAPSHOT-005`;
- impedire confirmation attiva senza bootstrap riuscito;
- scegliere una sola soluzione owner.

## `SOURCE-ID-004` — confirmation API senza gate

**Priorità:** high

- decidere se il fallback timeline-based è supportato;
- se live-only, rimuoverlo;
- se supportato, distinguere `confirmed` da `recording`;
- testare esplicitamente entrambe le modalità.

## `SOURCE-ID-005` — bootstrap failure recovery

**Priorità:** high

- definire se dopo bootstrap fallito serve nuovo Start;
- oppure consentire nuova generation su nuovo contesto;
- aggiungere test initial failure → context change;
- non chiamare `bufferGeneration` session generation.

## `SOURCE-ID-006` — confirmation error mapping

**Priorità:** high

- rendere osservabili lookup/store failures;
- non mappare persistence failure come HTTP 400 input error;
- mantenere reason bounded;
- coordinare con `EVIDENCE-API-006/007`.

## `SOURCE-ID-007` — mismatch cleanup wording

**Priorità:** medium

- sostituire il riferimento stretto a SIGTERM;
- documentare process registry scoped termination;
- includere eventuale escalation;
- mantenere Chrome/CDP fuori scope.

## `SOURCE-ID-008` — validation ownership

**Priorità:** medium

- usare stato `Implementato; validazione live parziale`;
- rinviare al documento validation;
- rimuovere duplicazione dei risultati live;
- non trasformare osservazioni senza SHA in PASS corrente.

## `SOURCE-ID-009` — verification authority

**Priorità:** high

- aggiungere stale callback tests;
- aggiungere no-gate fail-closed tests;
- aggiungere fallback confirmation test;
- aggiungere store failure HTTP mapping;
- aggiungere bootstrap failure → new context test.

---

# Ordine consigliato di applicazione

```text
1. IMPL-006 / SOURCE-ID-001
2. SOURCE-ID-002
3. SOURCE-ID-003
4. SOURCE-ID-004
5. SOURCE-ID-006
6. SOURCE-ID-005
7. SOURCE-ID-009
8. SOURCE-ID-007
9. SOURCE-ID-008
10. revisione mirata 02-source-identity.md
11. checker documentali
12. aggiornamento cumulativo mappa/JSON
```

---

# Verifica prevista dopo un’eventuale modifica

## Session authority

```text
Start A
→ Sofa A in flight
→ Start B stesso eventId
→ callback A non osserva gate B
→ callback A non persiste
```

```text
Start A eventId A
→ update in flight
→ Start B eventId B
→ callback A
→ no canonical write
```

```text
Stop
→ update in flight
→ callback tardiva
→ no canonical write
```

## No-gate

Nel tracking canonico:

```text
observer → no-gate
→ fail-closed
```

Sofa-only:

```text
gate not-applicable
→ persist-current
```

## Confirmation

```text
pending live
→ confirm
→ bootstrap success
→ confirmation active
→ recording
```

```text
pending live
→ confirm
→ bootstrap fail
→ confirmation non deve diventare effective active nel target
```

```text
no live gate
→ comportamento esplicitamente scelto
```

## Bootstrap failure

```text
initial bootstrap fail
→ new market context
→ pending
→ confirmation
→ retry policy deterministica
```

## Confirmation store

```text
store missing
→ empty/no confirmation

store corrupt
→ bounded unavailable reason

write fail
→ server/infrastructure error
→ non generic 400 input invalid
```

## Mismatch

```text
mismatch causale
→ sample non persistito
→ gate terminale leggibile
→ Betfair tracking children terminati via registry
→ Chrome/CDP lasciati aperti
```

## Status

```text
collecting
pending
recording
mismatch
not-applicable
```

con payload senza dati sensibili.

## Matching

Preservare i test correnti:

```text
aligned deterministico
mismatch runner estraneo
pending ambiguità
apostrophe compact rules
compound surname
market epoch
confirmation fingerprint
```

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
02-source-identity.md: OWNER SOLIDO SUL MATCHING, AUTHORITY LIVE DA RAFFORZARE

Matching automatico: coerente
Pending/mismatch distinction: coerente
Market epoch: coerente
Confirmation fingerprint: robusto
Gate phases: coerenti
Status redaction: corretta
Gate key: solo eventId
trackingSessionId: assente
bufferGeneration: non session authority
no-gate: fail-open verso persistence
Stop/new Start: non invalidano da soli callback in flight
manual confirmation: persist-before-bootstrap
confirmation API: possiede fallback senza gate live
bootstrap failure: generation può restare bloccata
confirmation store failure: poco osservabile
failure HTTP mapping: da correggere
mismatch process cleanup: concetto corretto, wording da aggiornare
live validation: da lasciare al documento validation
verification: manca la concorrenza/session authority

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: critica
```

Il documento deve restare un unico owner Source Identity.

La revisione deve soprattutto rendere esplicite tre distinzioni:

```text
eventId
≠ tracking session identity

bufferGeneration
≠ session authority end-to-end

confirmation persisted
≠ bootstrap/recording successfully completed
```

e trasformare il tracking live da:

```text
no-gate
→ persist
```

a un comportamento fail-closed coerente con il ruolo stesso del gate.
