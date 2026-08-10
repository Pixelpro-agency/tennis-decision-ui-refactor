# Report documentale — `docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-031
Sequenza audit: 31/72
Documento analizzato: 02-commit-journal-and-recovery.md
Percorso documento: docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md
Percorso report: Report documentale/31 - 02-commit-journal-and-recovery.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: fdeda46018be8372ba0943d8d4b006c8efdbfc66
Dimensione documento: 693 righe
Ruolo dichiarato: owner del commit journal, recovery deterministica e writer authority process-level
Stato report: applicato e verificato
```

Il documento è stato confrontato con:

- `backend/src/runtime/matchHistoryWriterAuthority.js`;
- `backend/src/server.js`;
- `backend/src/sofa/matchHistory.js`;
- `backend/src/sofa/matchHistory/commitId.js`;
- `backend/src/sofa/matchHistory/commitJournal.js`;
- `backend/src/sofa/matchHistory/commitJournal/store.js`;
- `backend/src/sofa/matchHistory/commitJournal/filesystemStore.js`;
- `backend/src/sofa/matchHistory/commitJournal/recordSchema.js`;
- `backend/src/sofa/matchHistory/commitJournal/recordValidation.js`;
- `backend/src/sofa/matchHistory/commitJournal/recordFactory.js`;
- `backend/src/sofa/matchHistory/commitJournal/recoveryScanner.js`;
- `backend/src/sofa/matchHistory/commitJournal/integrity.js`;
- `backend/src/sofa/matchHistory/commitJournal/results.js`;
- `backend/src/sofa/matchHistory/recovery.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/handler.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/journalWorkflow.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/recovery.js`;
- `backend/src/sofa/betfair/processor/persistence.js`;
- `backend/src/sofa/betfair/processor/journalRecovery.js`;
- `backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js`;
- `backend/src/sofa/matchHistory/commitId.test.mjs`;
- `backend/src/sofa/matchHistory/commitJournal/integrityStatus.test.mjs`;
- `backend/src/sofa/matchHistory/commitJournal/payloadSafety.test.mjs`;
- `backend/src/sofa/matchHistory/commitJournal/residualRecovery.test.mjs`;
- `backend/src/sofa/matchHistory/recovery/completedTargetVerification.integration.test.mjs`;
- `backend/src/sofa/matchHistory/recovery/invalidJournal.integration.test.mjs`;
- `backend/src/sofa/matchHistory/recovery/retryAndFailure.integration.test.mjs`;
- le task già registrate nei report precedenti, in particolare `STORAGE-TH-*`, `MATCH-API-*`, `BETFAIR-API-*`, `EVIDENCE-API-*`, `SOFA-LIVE-*` e `DATA-LIFE-*`.

La mappa Markdown di continuazione e il JSON incrementale di continuazione non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: ALTA sul design, MEDIO-ALTA sul contratto end-to-end

writer authority process-level: implementata e fail-closed
acquire prima della recovery: implementato
secondo writer active/unknown: bloccato
stale owner dead/PID recycled: reclaim implementato
shutdown release dopo tracker drain: implementato
force timeout senza release anticipato: implementato

journal per event/source: implementato
atomic journal write: implementato
pending → history → timeline → cleanup: implementato
target/commitId writer result validation: implementato
repair da payload/metadata/target journalizzati: implementato
invalidEntries: esclusi dal repair
invalidRecords: separati dagli entry non identificabili
payload JSON-safe: controllato
integrity read-only: nessun side effect di scrittura

runtime completed residual cleanup Sofa: rimozione senza target verification
runtime completed residual cleanup Betfair: rimozione senza target verification
createPendingCommit target verification: esiste ma viene bypassata dai due runtime path
bootstrap completed residual verification: solo esistenza + JSON parse
target verification: non prova documento, eventId/source o payload journalizzato
journal "valid record": non valida schema business di payload.document
repair: può tentare di scrivere payload semanticamente invalido
integrity read: ignora failure/invalid state della scansione journal
journal directory unreadable: può apparire no_known_partial
invalid structurally identifiable record marcato recovery_failed: resta invalid e può sparire dall'integrity event-scoped
operational repair failure: resta pending/retryable; nessuna escalation automatica a recovery_failed
recovery_failed runtime semantics: quindi incompleta
bootstrap production log: perde counts/categories del recovery summary
payload safety: forte sulle key/query note, non garantisce secret-free per stringhe sotto key neutre
commitId generator: source-UUID canonico
journal validator: accetta qualsiasi ID filename-safe e non lega prefix/source
test counts IMPL-015: riportati inline ma non collegati a un artifact di validation dedicato

Modifiche nuove proposte: 10
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: SÌ
Nuovi documenti canonici proposti: 1
Priorità complessiva: CRITICA
```

Il journal non va sostituito.

La sua architettura di base è corretta:

```text
commit intent persistito
→ write verificata
→ marker
→ recovery deterministica
```

I problemi sono concentrati nei punti in cui il sistema decide:

```text
posso cancellare definitivamente il journal?
posso fidarmi del target?
posso fidarmi del payload da riparare?
posso dichiarare no_known_partial?
quando una recovery diventa davvero recovery_failed?
```

---

# 1. I runtime Sofa e Betfair rimuovono completed residual senza target verification

## Esito: violazione critica della regola dichiarata

Il documento stabilisce:

```text
completed residual
→ verifica target canonici
→ solo se entrambi verificabili:
   remove journal
```

Questa regola esiste realmente dentro:

```text
createCommitJournalStore().createPendingCommit(...)
```

Quando lo store trova completed residual della stessa coppia:

```text
eventId + source
```

esegue:

```text
verify history target
verify timeline target
```

e, se un target fallisce:

```text
markDocumentIncomplete(...)
→ pending_exists
```

Questo è corretto.

## Runtime Sofa

Prima di costruire un nuovo update Sofa:

```text
findPendingCommit
→ cleanupCompletedResidual(...)
→ build history/timeline
→ createPendingCommit
```

`sofaUpdates/journalWorkflow.js` implementa `cleanupCompletedResidual()` così:

```text
findCompletedCommit
→ removeCompletedCommit
```

senza target verification.

## Runtime Betfair

`persistBetfairProcessedResult()` esegue:

```text
findPendingCommit
→ repairOnly
→ cleanupCompletedResidual(...)
→ persistence decision
→ createPendingCommit
```

Anche `betfair/processor/journalRecovery.js`:

```text
findCompletedCommit
→ removeCompletedCommit
```

senza verificare history/timeline.

## Conseguenza

Un residual:

```text
history.completed = true
timeline.completed = true
```

con target:

```text
mancante
corrotto
sostituito
```

può essere eliminato dal normale runtime **prima** che `createPendingCommit()` abbia la possibilità di applicare la propria verifica più forte.

Quindi la protezione implementata nello store non è universale.

## Scenario

```text
commit C1
→ history marked completed
→ timeline marked completed
→ journal cleanup fallisce
→ residual resta

successivamente timeline C1 viene cancellata/corrotta

nuovo Sofa/Betfair update
→ runtime cleanupCompletedResidual
→ removeCompletedCommit(C1)
→ journal C1 eliminato
→ payload di repair perso
```

Lo stato può tornare:

```text
no_known_partial
```

nonostante il target canonico di C1 non sia verificabile.

## Finding `JOURNAL-REC-001` — centralizzare il cleanup verified dei completed residual

**Priorità:** critical  
**Tipo:** completed residual lifecycle

### Target

Non devono esistere helper runtime che eseguono:

```text
findCompletedCommit
→ removeCompletedCommit
```

senza target verification.

### Soluzione

Centralizzare una sola primitive, per esempio concettualmente:

```text
verifyAndCleanupCompletedResidual(eventId, source)
```

che:

1. trova il residual;
2. verifica entrambi i target;
3. riapre i marker non verificabili;
4. conserva payload/target;
5. rimuove solo se entrambi verificati;
6. restituisce un risultato strutturato.

### Consumer

Usare la stessa primitive in:

```text
Sofa runtime
Betfair runtime
createPendingCommit
bootstrap recovery
```

evitando quattro implementazioni divergenti.

### Test

Aggiungere test runtime reali:

```text
completed residual + history missing
→ Sofa update non elimina journal

completed residual + timeline invalid
→ Betfair update non elimina journal
```

---

# 2. La target verification prova soltanto “file JSON parsabile”, non il commit atteso

## Esito: verifica troppo debole

Lo store e `runPendingCommitRecovery()` usano come default una verifica equivalente a:

```text
readFile(target)
JSON.parse(...)
→ ok:true
```

Non viene verificato:

```text
shape history/timeline
eventId
source
commitId
contenuto journalizzato
metadata
document identity
```

## Falso positivo possibile

Un target atteso può contenere:

```json
{}
```

e viene considerato verificato.

Anche:

```json
{
  "unrelated": true
}
```

viene considerato verificato.

## Effetto

Per un completed residual:

```text
history target → JSON arbitrario valido
timeline target → JSON arbitrario valido
```

la recovery può classificare:

```text
cleaned
```

e rimuovere definitivamente il journal.

## Perché il solo `commitId` non basta

Una verifica generica:

```text
il file contiene commitId
```

non è sufficiente per tutti i casi.

Il tick Betfair status-only, per esempio, può non aggiungere una nuova row history con quel commitId.

La fonte più forte già disponibile è:

```text
documents.<name>.payload.document
```

journalizzato prima della scrittura.

## Finding `JOURNAL-REC-002` — verificare target contro l'artefatto journalizzato

**Priorità:** critical  
**Tipo:** completed target verification

### Target

La verifica deve dimostrare che il target è il documento atteso dal journal.

### Strategia preferibile

Confrontare semanticamente il JSON target con:

```text
journal.documents.history.payload.document
journal.documents.timeline.payload.document
```

oppure usare validator typed equivalenti sufficientemente forti.

### Inoltre

Verificare:

```text
target path canonico atteso
eventId
source per timeline
shape documento
```

quando applicabile.

### Regola

```text
JSON parseable
≠
target verified
```

### Coordinamento

Coordinare con:

```text
STORAGE-TH-001
STORAGE-TH-002
```

per riusare i validator canonici di history/timeline anziché duplicarli nel journal.

---

# 3. Un journal “strutturalmente valido” può contenere un business document semanticamente invalido

## Esito: recovery payload validation insufficiente

`validateDocument()` verifica:

```text
target non-empty
payload plain object
payload JSON-safe
completed boolean
```

Non verifica che il payload possieda realmente:

```text
payload.document
payload.metadata
```

né che:

```text
history payload.document.history sia array
timeline payload.document.timeline sia array
eventId coerente
source coerente
commit payload coerente
```

## Record formalmente valido

Un record con:

```json
{
  "payload": {
    "foo": "bar"
  }
}
```

può superare il journal record validator se il resto dello schema è corretto.

## Repair Sofa

L'adapter passa:

```text
history.payload.document
history.payload.metadata
```

al writer.

Se mancano:

```text
undefined
```

arriva al writer.

## Repair Betfair

Anche l'adapter Betfair usa:

```text
payload.document
payload.metadata || {}
```

senza validare la business shape.

## Rischio maggiore

Un payload può essere JSON-safe e avere:

```text
document: {}
```

Il journal lo considera formalmente valido.

Se il writer canonico non applica ancora i validator fail-closed richiesti da `STORAGE-TH-001`, il recovery può scrivere un documento semanticamente invalido nel target canonico.

## Finding `JOURNAL-REC-003` — bind typed tra journal record, payload e canonical document

**Priorità:** critical  
**Tipo:** repair input validation

### Target

Prima di qualsiasi repair:

```text
source sofa
→ history payload schema Sofa/history
→ timeline payload schema Sofa

source betfair
→ history payload schema compatibile
→ timeline payload Betfair canonical
```

### Invarianti minime

```text
payload.document plain object
payload.metadata plain object
eventId coerente
target coerente
history array dove richiesto
timeline array dove richiesto
timeline source coerente
```

Le verifiche più specifiche devono essere condivise con gli owner storage.

### Regola

```text
safe JSON
≠
valid canonical document
```

La safety validation e la semantic validation sono due layer distinti.

---

# 4. `getPersistenceIntegrityStatus()` ignora il fatto che lo store possa non essere leggibile

## Esito: possibile falso `no_known_partial`

`listJournalRecords()` restituisce anche:

```text
reason
```

### Directory read failure

Se `readdirSync()` fallisce:

```text
records: []
invalid: [...]
reason: write_failed
```

### Invalid journal presente

Se esistono `.json` non validi:

```text
records: valid records
invalid: [...]
reason: invalid_journal
```

## Integrity

`getPersistenceIntegrityStatus()` fa:

```text
const journal = listJournalRecords();

return getPersistenceIntegrityStatusFromRecords(
    journal.records,
    eventId,
    source
);
```

`journal.reason` viene ignorata.

## Conseguenza più grave

Se la directory journal non è leggibile:

```text
records = []
```

l'integrity helper restituisce:

```text
no_known_partial
```

anche se il processo non ha potuto stabilire l'assenza di partial.

## Downstream

`getMatchPersistenceIntegrity()` e le API accettano questo risultato come canonico.

Evidence usa poi quello stato per valutare persistence completeness.

## Principio

```text
nessun partial trovato
```

è diverso da:

```text
impossibile ispezionare il journal
```

## Finding `JOURNAL-REC-004` — introdurre integrity read degradation fail-closed

**Priorità:** critical  
**Tipo:** integrity read authority

### Target

La lettura integrity deve preservare almeno tre concetti:

```text
known complete/no known partial
known partial/recovery failed
integrity store unreadable/unknown
```

### Contratto pubblico

Non è obbligatorio introdurre immediatamente un nome specifico senza coordinamento API.

Ma non deve essere possibile:

```text
journal scan failed
→ no_known_partial
```

### Invalid entries

Per `invalidEntries` non associabili a un eventId, decidere esplicitamente se:

- degradare un health globale;
- bloccare alcune letture in strict mode;
- aggiungere un `integrityReadStatus`;
- altra soluzione fail-closed.

Non inventare una correlazione evento che il journal non permette.

### Coordinamento

Allineare con:

```text
MATCH-API-005
BETFAIR-API-004
EVIDENCE-API-004
```

e con il futuro structured read contract di `STORAGE-TH-001`.

---

# 5. `recovery_failed` non ha ancora una produzione runtime coerente

## Esito: stato esposto ma lifecycle incompleto

Il documento espone:

```text
partial_persistence
recovery_failed
```

come due stati operativi distinti.

## Failure reale del repair

Quando il writer recovery fallisce, per esempio:

```text
disk_full
```

`runPendingCommitRecovery()` incrementa:

```text
retryablePending
```

e lascia il record:

```text
status: pending
```

Il test `T06-writer-failure-is-retryable` fissa esplicitamente questo comportamento.

Quindi un failure operativo reale:

```text
non produce recovery_failed
```

nemmeno dopo più bootstrap.

## `recovery_failed` automatico

La recovery chiama `markRecoveryFailed()` soprattutto per:

```text
invalidRecords
```

cioè record identificabili ma strutturalmente invalidi.

## Problema successivo

`markRecoveryFailed()` può modificare raw:

```text
status = recovery_failed
reason = invalid_journal_structure
```

ma non corregge la struttura che aveva reso il record invalido.

Quindi al successivo `listJournalRecords()`:

```text
validatePersistedRecord(record) === false
```

e il record resta nella categoria invalid.

La recovery scanner riesce a riconoscerlo come:

```text
alreadyRecoveryFailed
```

perché legge raw.

La normale integrity event-scoped invece usa soltanto:

```text
listJournalRecords().records
```

e può non vedere quel record.

## Contraddizione

Può quindi esistere su disco:

```text
status: recovery_failed
eventId valido
source valida
```

ma:

```text
getPersistenceIntegrityStatus(eventId, source)
→ no_known_partial
```

se la struttura resta invalida.

## Finding `JOURNAL-REC-005` — definire una lifecycle authority reale per `recovery_failed`

**Priorità:** high  
**Tipo:** recovery state semantics

### Decisioni necessarie

Separare:

```text
retryable operational failure
terminal/blocked recovery failure
invalid journal structure
```

### Operational retries

Definire se:

```text
retryablePending
```

resta indefinito per design oppure se esiste una soglia/condizione deterministica per:

```text
recovery_failed
```

Non introdurre retry count arbitrari senza decisione esplicita.

### Invalid records

Se un record identificabile deve diventare event-scoped `recovery_failed`, la sua rappresentazione read-only deve restare leggibile anche se il payload originale è invalido.

Possibili approcci:

```text
quarantine metadata sidecar
sanitized recovery failure descriptor
scanner-backed integrity
```

senza riscrivere payload unsafe.

### Invariante

```text
integrity dice recovery_failed
↔
esiste uno stato realmente osservabile e stabile
```

---

# 6. La recovery non fatale è quasi invisibile nel runtime di produzione

## Esito: summary restituito ma non operativamente esposto

`runPendingCommitRecovery()` produce un summary ricco:

```text
scanned
recovered
cleaned
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
outcomes
```

## `startServer()`

Il server conserva:

```text
recoverySummary
```

e lo restituisce al caller.

Ma nel percorso normale:

```text
startServer().catch(...)
```

il valore di ritorno non viene usato.

Il log dopo recovery è soltanto:

```text
recovery_complete
{ ok: true }
```

per ogni recovery non fatal.

Quindi:

```text
retryablePending = 12
invalidJournal = 3
recoveryFailed = 2
```

può produrre lo stesso log top-level di:

```text
tutto pulito
```

## Perché conta

Il design deliberatamente permette il listener con failure per-file non fatali.

Questa resilienza richiede però observability.

Altrimenti un journal problematico può restare per più riavvii senza un segnale operativo bounded sufficientemente evidente.

## Finding `JOURNAL-REC-006` — loggare un recovery summary bounded

**Priorità:** high  
**Tipo:** bootstrap observability

### Log ammesso

Esporre soltanto counters/category aggregate:

```text
scanned
recovered
cleaned
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
```

### Non loggare

```text
payload
target path
journal path
URL
stack
raw reason non allow-listed
```

### Severity

Un recovery:

```text
ok:true
ma anomaly count > 0
```

non deve essere indistinguibile da un recovery completamente clean.

---

# 7. La payload safety è forte sulle key note, ma non dimostra l'assenza di secret in stringhe neutre

## Esito: promessa documentale più forte del validator

`isSafeJsonValue()` rifiuta:

- key che contengono concetti come token/cookie/header/password/secret/browser/profile/network/capture;
- URL string che contengono query parameter sensibili noti;
- number non finiti;
- `undefined`;
- strutture non plain/cicliche.

È una buona protezione.

## Limite

Per una stringa sotto una key neutra:

```json
{
  "message": "Bearer VERY_SECRET_VALUE"
}
```

il validator vede:

```text
key message → consentita
string → nessun sensitive query parameter
→ safe
```

Analogamente, una URL con userinfo:

```text
https://user:password@example.test/path
```

non possiede necessariamente un query parameter sensibile.

Una stringa generica:

```text
"cookie=session-secret"
```

può passare se la key esterna è neutra.

## Non serve un “secret detector” euristico generale

Una scansione arbitraria del testo sarebbe fragile e potrebbe bloccare dati business legittimi.

La soluzione deve restare strutturale.

## Finding `JOURNAL-REC-007` — rafforzare la safety delle stringhe diagnostiche senza euristiche creative

**Priorità:** medium  
**Tipo:** journal payload safety

### Target

Per superfici diagnostiche persistibili:

```text
allow-list di campi
code/reason bounded
URL canonicalizzate/redatte
```

### URL

Rifiutare almeno in modo deterministico:

```text
URL credentials/userinfo
sensitive query params
eventuali fragment con credential material se previsti dal validator
```

### Producer

I producer devono continuare a essere responsabili della conversione:

```text
raw error
→ code/reason bounded
```

prima del journal.

### Test

Aggiungere casi:

```text
userinfo URL
Bearer-like diagnostic value
cookie-like diagnostic value
nested neutral key con raw error
```

e decidere il comportamento tramite schema, non semplice ricerca di parole in ogni stringa.

---

# 8. Il commitId canonico generato e quello accettato dal journal hanno due contratti diversi

## Esito: documentazione troppo assoluta

Il documento afferma:

```text
sofa-<uuid>
betfair-<uuid>
```

come formato del `commitId`.

`createCanonicalCommitId(source)` genera effettivamente:

```text
sofa-UUID
betfair-UUID
```

## Validator journal

`isValidCommitId()` accetta invece qualunque:

```text
[A-Za-z0-9][A-Za-z0-9_-]{0,127}
```

e non verifica:

```text
prefix coerente con source
UUID format
```

Quindi è formalmente valido un record:

```text
source: sofa
commitId: betfair-not-a-uuid
```

o:

```text
commitId: abc
```

## Possibile ragione

Il validator più ampio facilita:

- fixture;
- eventuali record legacy;
- test deterministici.

Ma questa distinzione non è documentata.

## Finding `JOURNAL-REC-008` — distinguere canonical new ID e accepted recovery ID

**Priorità:** medium  
**Tipo:** commit identity contract

### Contratto

Definire separatamente:

```text
nuovo commit prodotto dal runtime
→ source-UUID canonico

record legacy/recovery accettabile
→ eventuale subset più ampio filename-safe
```

### Se non serve compatibilità legacy

Rendere il persisted validator coerente con:

```text
source
prefix
UUID
```

### Se serve compatibilità

Documentare esplicitamente il motivo e non chiamare “formato del commitId” un vincolo che vale soltanto per il generator.

---

# 9. Verification e validation provenance

## Esito: test automatici numerosi, ma mancano proprio i boundary trovati

Il documento elenca suite reali e ben separate per:

- lifecycle journal;
- integrity;
- payload safety;
- residual;
- filesystem integration;
- recovery;
- writer authority;
- server/shutdown.

Questo è positivo.

## Mancano però test su

```text
Sofa runtime residual cleanup con target mancante
Betfair runtime residual cleanup con target mancante
completed target JSON valido ma semanticamente sbagliato
completed target contenuto diverso dal payload journalizzato
valid journal envelope + invalid payload.document
journal directory read failure → integrity non no_known_partial
invalidRecord marcato recovery_failed → event integrity
repeated operational recovery failure policy
server recovery summary anomaly logging
URL userinfo / neutral-key diagnostic secret
source/commitId mismatch
```

## Provenance inline

Il documento afferma:

```text
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
```

e precisa correttamente che non è stato eseguito un collaudo manuale con due backend reali concorrenti.

Tuttavia i risultati storici sono inline nel contratto owner.

Per mantenere il documento stabile, gli esiti di una run dovrebbero appartenere a:

```text
docs/validations/
```

con commit/data/comandi/esito.

## Finding `JOURNAL-REC-009` — completare verification matrix e spostare gli esiti run negli artifact

**Priorità:** high  
**Tipo:** verification and validation provenance

### Documento owner

Conservare:

```text
quali suite eseguire
quali invarianti devono passare
```

### Validation artifact

Conservare:

```text
quando sono state eseguite
commit
numero pass/fail
filesystem reale
test manuale due backend
failure injection
limiti
```

### Live/manual

Non dichiarare completata la validation di:

```text
due backend reali
disk full/permission reali
process restart reale
```

finché non esiste l'artifact corrispondente.

---

# 10. Modularizzazione: writer authority e commit recovery hanno owner distinti

## Valutazione

```text
Righe: 693
```

La divisione è giustificata non dalla lunghezza, ma da due responsabilità tecniche indipendenti.

### Owner A — commit journal e recovery

Codice:

```text
matchHistory/commitId.js
matchHistory/commitJournal.js
matchHistory/commitJournal/
matchHistory/recovery.js
Sofa/Betfair repair adapters
```

Invarianti:

```text
commit intent
document markers
repair
target verification
integrity
payload safety
```

### Owner B — writer authority process-level

Codice:

```text
runtime/matchHistoryWriterAuthority.js
server.js bootstrap/shutdown integration
```

Invarianti:

```text
repository/storage identity
process identity
active/stale/unknown
acquire
reclaim
release
drain-before-release
single writer
```

Sono due contesti minimi diversi.

Un lettore che deve modificare:

```text
journal scanner
```

non deve caricare l'intero protocollo Windows/Linux PID fingerprint.

Un lettore che deve modificare:

```text
writer authority
```

non deve caricare payload safety e repair history/timeline.

## Struttura proposta

Mantenere:

```text
docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md
```

come owner journal/recovery.

Creare:

```text
docs/tennis-decision-ui/modules/storage/05-writer-authority.md
```

come owner di:

- process identity;
- repository/storage identity;
- authority record;
- acquire/reclaim;
- bootstrap ordering relativo all'authority;
- shutdown drain/release;
- unsupported multi-writer topologies;
- test authority/server specifici.

Il numero `05` evita conflitto con i due file già proposti dal report 030:

```text
03-sofa-persistence.md
04-betfair-persistence.md
```

## Finding `JOURNAL-REC-010` — separare writer authority da commit journal/recovery

**Priorità:** medium  
**Tipo:** documentation modularization

### Task operativa

- mantenere `02-commit-journal-and-recovery.md` come facade specialistica del journal/recovery;
- creare `05-writer-authority.md`;
- spostare authority classification, bootstrap acquire, shutdown release e single-writer invariant;
- lasciare in `02-*` soltanto un link e la precondizione “recovery requires acquired writer authority”;
- aggiornare index/context-selection/repository map e link owner;
- non aggiungere `05-*` all'inventario canonico finché il file non esiste;
- eseguire link checker dopo la creazione.

## Decisione

```text
modularization_reviewed: true
split_required: true
split_recommended: true
proposed_files:
  - docs/tennis-decision-ui/modules/storage/05-writer-authority.md
```

---

# Elementi corretti da preservare

## 1. Writer authority fail-closed

La classification:

```text
active
stale
unknown
```

non si basa sulla sola esistenza del PID.

Su Windows/Linux viene usato anche un fingerprint di start process.

Un PID riciclato può quindi essere classificato stale.

Un owner non verificabile diventa:

```text
unknown
```

e blocca startup.

Questa è una scelta corretta.

## 2. Race di acquisizione

Ogni backend crea un file authority con UUID proprio e `flag:'wx'`.

Dopo la creazione esegue un nuovo scan.

In caso di concorrenza:

```text
più active owner
→ contended
→ rimozione del proprio record verificato
→ nessun writer promosso implicitamente
```

La logica resta conservativa.

## 3. Release ownership

Il release verifica nuovamente:

```text
record
pid
process fingerprint
repository identity
storage identity
second read
```

prima dell'unlink.

Questa proprietà va preservata.

## 4. Journal atomic write

Il journal:

```text
write temp
→ rename
```

e prova a rimuovere il temporaneo in failure.

Non scrive in place.

## 5. Record scanner

La distinzione:

```text
records
invalidRecords
invalidEntries
```

è utile e va preservata.

Il problema non è la classificazione in sé, ma il modo in cui gli stati invalidi vengono poi tradotti in integrity.

## 6. Repair deterministico

Il repair non:

- fa fetch;
- usa tracker state;
- ricostruisce dati da live;
- genera un nuovo commitId;
- genera nuovi tick arbitrari.

Riutilizza il payload journalizzato.

Questa è la corretta base deterministica.

## 7. Writer result verification

Gli adapter verificano:

```text
ok
file === target
commitId === expected
```

prima del marker `completed`.

Questa proprietà va preservata.

## 8. Read-only integrity senza creazione directory

La lettura integrity non crea `.pending_commits` quando la directory non esiste.

Questo comportamento è corretto.

La nuova task `JOURNAL-REC-004` deve aggiungere osservabilità degli errori di lettura senza introdurre write side effect.

---

# Dipendenze già aperte da non duplicare

```text
STORAGE-TH-001
STORAGE-TH-002
STORAGE-TH-003
STORAGE-TH-008
MATCH-API-002
MATCH-API-005
BETFAIR-API-002
BETFAIR-API-004
EVIDENCE-API-004
SOFA-LIVE-003
PY-RUNTIME-004
DATA-LIFE-001
```

In particolare:

- la validation generale di history/timeline canoniche resta `STORAGE-TH-001`;
- uniqueness dei canonical file resta `STORAGE-TH-002`;
- committed cross-source state resta `STORAGE-TH-003`;
- il presente report aggiunge i vincoli specifici del journal/recovery;
- shutdown parent timeout resta `PY-RUNTIME-004`;
- read HTTP deve consumare l'authority storage, non definire tassonomie indipendenti.

---

# Riferimenti per la mappa e il JSON incrementale di continuazione

```text
Report ID: TDUI-DOC-REPORT-031
Percorso report: Report documentale/31 - 02-commit-journal-and-recovery.md
Documento: docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md

Change ID: JOURNAL-REC-001
Change ID: JOURNAL-REC-002
Change ID: JOURNAL-REC-003
Change ID: JOURNAL-REC-004
Change ID: JOURNAL-REC-005
Change ID: JOURNAL-REC-006
Change ID: JOURNAL-REC-007
Change ID: JOURNAL-REC-008
Change ID: JOURNAL-REC-009
Change ID: JOURNAL-REC-010

Suddivisione richiesta: sì
Nuovi file canonici proposti: 1
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository-continuazione-023.md
→ registrare report 031
→ indice 31 ANALIZZATO
→ Divisione richiesta
→ aggiungere JOURNAL-REC-001..010
→ JOURNAL-REC-010 come task [ ] operativa
→ registrare il proposed file senza aggiungerlo all'inventario finché non creato

modifiche-audit-markdown-continuazione-023.json
→ appendere TDUI-DOC-REPORT-031
→ appendere JOURNAL-REC-001..010
→ split_required:true
→ proposed_files:
   - docs/tennis-decision-ui/modules/storage/05-writer-authority.md
```

I file di mappa/ledger non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `JOURNAL-REC-001` — verified residual cleanup universale

**Priorità:** critical

- eliminare cleanup Sofa/Betfair blind;
- centralizzare verifica+cleanup;
- target missing/invalid → reopen;
- nessun payload di repair perso;
- stessa primitive bootstrap/runtime/create.

## `JOURNAL-REC-002` — semantic completed-target verification

**Priorità:** critical

- JSON parse non basta;
- target canonico;
- shape corretta;
- coerenza event/source;
- confronto con payload journalizzato o validator equivalente;
- coprire status-only.

## `JOURNAL-REC-003` — typed repair payload binding

**Priorità:** critical

- safety JSON distinta da business validity;
- payload.document e metadata obbligatori secondo schema;
- event/source/target binding;
- nessuna write di `{}`/undefined semanticamente invalido;
- condividere validator con storage.

## `JOURNAL-REC-004` — integrity read degradation

**Priorità:** critical

- non ignorare `listJournalRecords.reason`;
- journal unreadable non diventa `no_known_partial`;
- invalid/unidentifiable entry con health globale;
- API/Evidence fail-closed secondo authority condivisa;
- nessun write side effect.

## `JOURNAL-REC-005` — recovery_failed lifecycle

**Priorità:** high

- distinguere retryable operational, terminal recovery e invalid structure;
- definire eventuale escalation deterministicamente;
- invalid record marcato failed deve restare osservabile;
- integrity e scanner devono concordare.

## `JOURNAL-REC-006` — bounded recovery bootstrap observability

**Priorità:** high

- log counters aggregate;
- severity differenziata se anomaly > 0;
- nessun target/path/payload;
- conservare recoverySummary per test/caller.

## `JOURNAL-REC-007` — structured payload string safety

**Priorità:** medium

- diagnostic allow-list;
- URL userinfo reject/redact;
- producer code/reason bounded;
- test neutral-key raw diagnostic;
- evitare secret detector euristico globale.

## `JOURNAL-REC-008` — canonical vs accepted commitId

**Priorità:** medium

- nuovo commit = source-UUID;
- definire eventuale recovery compatibility;
- source/prefix binding se legacy non serve;
- aggiornare test e documento.

## `JOURNAL-REC-009` — verification/provenance

**Priorità:** high

- test 001–008;
- runtime residual regression;
- semantic target mismatch;
- integrity unreadable;
- recovery state;
- safety;
- spostare pass-count storici in validation artifact;
- collaudo due backend/real failure solo quando realmente eseguito.

## `JOURNAL-REC-010` — modularizzazione writer authority

**Priorità:** medium

- mantenere `02-*` journal/recovery;
- creare `05-writer-authority.md`;
- spostare process ownership/bootstrap/shutdown;
- aggiornare owner links;
- link checker;
- proposed file fuori inventario finché non creato.

---

# Ordine consigliato di applicazione

```text
1. STORAGE-TH-001
2. JOURNAL-REC-001
3. JOURNAL-REC-002
4. JOURNAL-REC-003
5. JOURNAL-REC-004
6. JOURNAL-REC-005
7. JOURNAL-REC-006
8. JOURNAL-REC-007
9. JOURNAL-REC-008
10. JOURNAL-REC-009
11. JOURNAL-REC-010
12. revisione finale owner storage
13. checker documentali
14. aggiornamento cumulativo mappa/ledger
```

`STORAGE-TH-001` viene prima perché i validator canonici di history/timeline devono diventare la base condivisa anche per journal target e repair payload.

---

# Verifica prevista dopo un'eventuale modifica

## Residual runtime

### Sofa

```text
completed residual
history target missing
→ marker history reopened
→ journal retained
→ new commit blocked
```

### Betfair

```text
completed residual
timeline invalid JSON
→ marker timeline reopened
→ journal retained
→ new commit blocked
```

Mai:

```text
remove journal
prima della verifica
```

## Semantic target

```text
target contains {}
→ not verified
```

```text
target valid JSON
ma eventId/source/document wrong
→ not verified
```

```text
target semantically equal to journal payload
→ verified
```

## Repair payload

```text
payload={}
→ invalid repair record
→ zero canonical write
```

```text
payload.document={}
quando history/timeline schema richiede altro
→ zero canonical write
```

```text
payload eventId mismatch
→ zero canonical write
```

## Integrity

```text
journal dir missing
→ no_known_partial
```

perché l'assenza è verificata.

```text
journal dir unreadable
→ integrity unavailable/degraded
```

non `no_known_partial`.

```text
valid pending
→ partial_persistence
```

```text
valid recovery_failed
→ recovery_failed
```

```text
identifiable invalid record marcato recovery_failed
→ stato osservabile secondo il nuovo contract
```

## Recovery lifecycle

```text
disk_full una volta
→ retryable pending
```

Il comportamento dopo failure persistente deve essere stabilito esplicitamente e testato.

## Recovery observability

Clean:

```text
recovered=0
retryablePending=0
recoveryFailed=0
invalidJournal=0
```

Anomaly:

```text
retryablePending>0
oppure
recoveryFailed>0
oppure
invalidJournal>0
```

deve produrre log bounded distinguibile.

## Safety

Rifiutare o normalizzare secondo schema:

```text
https://user:password@example.test/
diagnostic raw bearer/cookie under neutral field
```

senza introdurre false positive sui nomi giocatore o dati business.

## Commit ID

Nuovi producer:

```text
sofa-<uuid>
betfair-<uuid>
```

sempre coerenti con source.

Eventuale legacy acceptance:

```text
esplicita
testata
documentata
```

## Writer authority

Mantenere invariati i test:

```text
active owner blocks
unknown blocks
dead/PID recycled reclaimed
concurrent acquire contended
release owner verification
drain before release
force timeout no early release
```

## Validation reale

Quando eseguita:

```text
due backend reali concorrenti
process kill + restart
file permission failure
target missing
target invalid JSON
```

registrare tutto in `docs/validations/` con commit e limiti.

---

# Decisione finale

```text
02-commit-journal-and-recovery.md:
DESIGN FORTE, MA LA GARANZIA "VERIFY BEFORE CLEANUP" NON È ANCORA END-TO-END

writer authority: forte
process identity: forte
acquire/reclaim: forte
shutdown release guard: forte
journal atomic write: forte
commit markers: forte
repair deterministico: forte
writer target/commitId result check: forte
scanner records/invalidRecords/invalidEntries: buona base
payload key/query safety: buona base

runtime Sofa residual cleanup: bypass verifica
runtime Betfair residual cleanup: bypass verifica
completed target verification: parse-only
semantic document identity: non verificata
repair payload business schema: non verificato
integrity read failure: può diventare no_known_partial
invalid-record recovery_failed: non sempre event-integrity-visible
operational recovery failure: resta pending indefinitamente
recovery_failed semantics: incompleta
nonfatal recovery summary: poco osservabile nel main runtime
string safety: non prova assenza di secret sotto neutral key
commitId accepted schema: più largo del canonical generator
validation results: troppo inline nel contratto owner

Riscrittura completa: no
Modularizzazione: sì
Nuovo documento canonico proposto: 1
Priorità complessiva: critica
```

La prima regola da rendere universale è:

```text
completed marker
≠
diritto a cancellare il journal

journal può essere cancellato
solo dopo verifica del target canonico atteso
```

La seconda è:

```text
JSON-safe journal
≠
business document valido

repair
→ richiede entrambi
```

La terza è:

```text
impossibile leggere lo stato di recovery
≠
no_known_partial
```

La writer authority process-level è invece sufficientemente distinta dal journal da meritare un owner documentale separato.

---

# Applicazione 2026-08-10

Le task JOURNAL-REC-001…010 sono state applicate e verificate. Centralizzati cleanup e target verification, aggiunti repair payload binding, integrity_unavailable, log bounded, string safety e classificazione commit ID. Creata la pagina owner 05-writer-authority.md e l'artifact docs/validations/commit-journal-hardening-2026-08-10.md. Operazioni Git: nessuna.

