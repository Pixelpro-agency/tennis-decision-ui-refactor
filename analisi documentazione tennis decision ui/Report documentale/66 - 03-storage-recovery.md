# Report documentale — `implementazioni/implementazioni-proposte/03-storage-recovery.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-066
Sequenza audit: 66/72
Documento analizzato: implementazioni/implementazioni-proposte/03-storage-recovery.md
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
Ultimo HEAD separatamente verificato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento corrente: 741d845eb982eb68ef09ebce3944582fde1d01e9
Dimensione documento: 410 righe
Perimetro dichiarato: IMPL-019…021
Tipo: registro owner — persistence authority, canonical document contract e recovery control plane
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md

backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js

backend/src/sofa/matchHistory/commitJournal/store.js
backend/src/sofa/matchHistory/commitJournal/recordSchema.js
backend/src/sofa/matchHistory/commitJournal/recordFactory.js
backend/src/sofa/matchHistory/recovery.js

backend/src/server.js
scripts/validation/test-manifest.json
```

Sono stati inoltre coordinati, senza duplicarli:

```text
IMPL-006
IMPL-008
IMPL-009
IMPL-013
IMPL-015
IMPL-016

STORAGE-001…012
JOURNAL-REC-001…010
VALID-ROLL-*
METHOD-EVIDENCE-001

TEST-019…030

AUDIT-CODE-P23-001
AUDIT-CODE-P7-001
IMPL-BASE-001
IMPL-BETFAIR-001
```

GitHub non è stato modificato.

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 067: NON analizzato
```

---

# 1. Esito sintetico

```text
IMPL-019:
APPROVATA
PRIORITÀ CRITICA
EVENT-SCOPED AUTHORITY COMPLETA ASSENTE

IMPL-020:
APPROVATA
PRIORITÀ CRITICA
CONTRATTO COMPLETO ASSENTE
MA PRIMITIVE VERIFIED-RECOVERY GIÀ PRESENTI

IMPL-021:
APPROVATA
PRIORITÀ ALTA
CONTROL PLANE COMPLETO ASSENTE
MA BOOTSTRAP/SUMMARY/RECOVERY STATE GIÀ PARZIALMENTE PRESENTI

Todo ↔ owner state:
COERENTE

False completion:
NESSUNA

Task 6 già implementata:
SÌ, da preservare

TEST-019…030:
tutti ancora MANCANTI come requirement owner

Nuovi bug runtime:
0

Nuovi finding registry:
2

Nuove task:
2

Split:
NON necessario
```

Conclusione:

```text
IL MODULO 066 È
TECNICAMENTE COERENTE
NELLO STATO GLOBALE
DELLE TRE IMPL.

019
020
021

SONO ANCORA DAVVERO
NON COMPLETATE.

MA IL REGISTRO
NON MOSTRA ABBASTANZA
CHE LA TASK 6 HA GIÀ
IMPLEMENTATO UNA PARTE
IMPORTANTE DEL TERRENO
DI 020 E 021.

ESEMPIO:

OGGI ESISTONO GIÀ:

- journal pending/recovery_failed;
- verify target prima del cleanup;
- reopen completed→incomplete;
- recovery bootstrap prima del listen;
- recovery summary bounded;
- 409 persistence_integrity;
- per-source partial/recovery_failed.

NON ESISTONO ANCORA:

- event persistence authority;
- revision/headCommitId;
- digest/expectedBaseRevision;
- schema/identity validation completa;
- ambiguous storage;
- immutable sourceTickId;
- persistent recovery control-plane;
- writersAllowed globale;
- retry counter/escalation;
- rearm locale;
- storage-integrity API.

QUESTO BOUNDARY
DEVE ESSERE SCRITTO
NEL REGISTRO.

INOLTRE ESISTONO
DUE CONTRADDIZIONI
DI SEQUENCING:

1.
IMPL-021
DICHIARA IMPL-009
COME DIPENDENZA,

MA §18.2 ORDINA:

IMPL-021
→ TEST
→ IMPL-009.

2.
L'ESTENSIONE IMPL-013 DICE:

"Nessuna evoluzione del formato
prima di questa baseline"

MA §18.2 ORDINA:

IMPL-020
→ ...
→ IMPL-013

E IMPL-020 INTRODUCE
PROPRIO IL NUOVO
CANONICAL DOCUMENT CONTRACT.

SERVONO DUE TASK:

IMPL-STORAGE-001
→ implementation coverage boundary;

IMPL-STORAGE-002
→ dependency/sequencing normalization.

NESSUN NUOVO BUG STORAGE.
NESSUNO SPLIT.
```

---

# 2. Perimetro

Il documento dichiara:

```text
IMPL-019…021
```

e contiene esattamente:

```text
IMPL-019
Event persistence authority

IMPL-020
Canonical document contract
e verified recovery

IMPL-021
Recovery control plane
```

Perimetro corretto.

---

# 3. Coesione

I tre owner formano una catena naturale:

```text
chi può committare
→ quale documento/commit è canonico
→ come recovery e operator control
  gestiscono anomalie.
```

Questa è una responsabilità unica
di storage/recovery authority.

---

# 4. IMPL-019 — stato owner

```text
Classificazione:
NECESSARIA

Stato:
CONFERMATA E APPROVATA

Priorità:
critica
```

Todo corrente:

```text
APPROVATA
PRIORITÀ CRITICA.
```

Coerente.

---

# 5. IMPL-019 — writer authority process-level già presente

`IMPL-015`
ha già introdotto:

```text
writer authority esclusiva
fra backend processi.
```

Questo è un prerequisito
reale e completato.

---

# 6. Ma IMPL-015 non è event authority

IMPL-015 decide:

```text
quale backend process
può scrivere match_history.
```

IMPL-019 decide:

```text
quale commit
può modificare
lo stesso evento
dentro il backend.
```

Le due authority
non sono equivalenti.

---

# 7. Journal corrente resta source-scoped

`createPendingCommit(...)`
cerca pending con:

```text
record.eventId === candidate.eventId
&&
record.source === candidate.source
```

Quindi il lock corrente
è ancora:

```text
event + source
```

non:

```text
event.
```

---

# 8. Cross-source pending non blocca automaticamente l'altra source

Un pending:

```text
Sofa event X
```

non viene rilevato
dalla ricerca:

```text
Betfair event X
```

se la source differisce.

Questo è precisamente
il gap di IMPL-019.

---

# 9. Shared history resta target aggregato

Sofa e Betfair
possono entrambi
contribuire alla:

```text
history aggregata.
```

Quindi l’authority
event-scoped
resta motivata.

---

# 10. IMPL-019 — base revision assente

Il journal corrente
non possiede:

```text
expectedBaseRevision.
```

Il record persistito
contiene:

```text
version
commitId
eventId
source
createdAt
status
documents
reason.
```

---

# 11. IMPL-019 — eventPersistenceId assente

Non esiste
nel contratto corrente:

```text
eventPersistenceId
repositoryWriterId
trackingSessionId
state preparing/writing/verifying
expectedBaseRevision.
```

---

# 12. IMPL-019 resta quindi realmente aperta

Nessuna false closure.

---

# 13. TEST-019/020/025

Todo corrente:

```text
TEST-019
Lost update cross-source shared history
→ MANCANTE

TEST-020
Pending cross-source shared target
→ MANCANTE

TEST-025
Stato cross-source soltanto committed
→ MANCANTE.
```

Coerente con IMPL-019.

---

# 14. Non promuovere IMPL-019 per la Task 6

Task 6
ha migliorato:

```text
journal
recovery
commitId
target verification.
```

Ma non ha introdotto
l’event-scoped authority.

---

# 15. IMPL-020 — stato owner

```text
NECESSARIA
CONFERMATA E APPROVATA
PRIORITÀ CRITICA.
```

Todo coerente.

---

# 16. IMPL-020 — canonical document contract richiesto

Richiede:

```text
documentType
schemaVersion
eventId
source
revision
headCommitId
createdAt
updatedAt
metadata.
```

---

# 17. History corrente non implementa questo schema

`storage.js`
scrive ancora
l’oggetto ricevuto
con atomic rename.

Non impone:

```text
schemaVersion
revision
headCommitId
documentType.
```

---

# 18. Timeline corrente non implementa questo schema

`timelineStore.js`
possiede:

```text
metadata
timeline[]
updatedAt
```

ma non:

```text
revision
headCommitId
schemaVersion
documentType.
```

---

# 19. Tick identity richiesta da IMPL-020 assente

Il contratto vuole:

```text
sourceTickId
sourceSequence
source
eventId
acquiredAt
recordedAt
trackingSessionId
sourceEpoch.
```

Current timeline wrapper usa:

```text
timestamp
elapsedSeconds
data.
```

Non esiste
un sourceTickId canonico
immutabile nel wrapper.

---

# 20. Journal contract richiesto da IMPL-020

Ogni target dovrebbe avere:

```text
payloadDigest
expectedBaseRevision
verifiedAt.
```

---

# 21. Journal corrente non li possiede

`recordFactory.js`
crea:

```text
target
payload
completed.
```

Non:

```text
payloadDigest
expectedBaseRevision
verifiedAt.
```

---

# 22. Stable JSON primitive esiste già

`recordSchema.js`
contiene:

```text
stableJson(...)
```

che ordina le chiavi.

È una primitive utile
per un digest stabile futuro.

---

# 23. Ma digest contract non è implementato

Non esiste
nel record persistito:

```text
payloadDigest.
```

Quindi non promuovere
IMPL-020.

---

# 24. Read contract corrente — parziale

History ha già:

```text
found
missing
failed

reason:
invalid_json
read_failed
discovery_failed.
```

Questa è una base reale.

---

# 25. Read contract IMPL-020 è più ampio

Richiede:

```text
found
missing
invalid_json
invalid_schema
read_failed
ambiguous
```

più:

```text
revision
headCommitId
source
target.
```

---

# 26. `ambiguous` oggi non è implementato

Discovery History:

```text
filter(...)
.sort()[0]
```

sceglie il primo
match compatibile.

Non blocca:

```text
>1 target
→ ambiguous_storage.
```

---

# 27. Timeline discovery fa anch'essa `sort()[0]`

Quindi la duplicate ambiguity
non è risolta.

---

# 28. Verified recovery — parte già implementata

Qui il boundary
è importante.

Current recovery
per un record:

```text
history completed
+
timeline completed
```

chiama:

```text
verifyDocumentTarget(...)
```

su entrambi.

---

# 29. Completed target non viene più cancellato alla cieca

Se entrambi
sono verificati:

```text
removeCompletedCommit.
```

Se uno fallisce:

```text
markDocumentIncomplete(...)
```

e poi recovery.

Questa è una parte reale
del target B / Task 6.

---

# 30. `createPendingCommit` fa una verifica simile sui residual completed

Anche durante
nuovo commit:

```text
completed residual
→ verify history
→ verify timeline
→ cleanup se entrambi ok

altrimenti:
→ reopen incomplete
→ pending_exists.
```

Questa protezione
è già implementata.

---

# 31. Ma la verification corrente è debole rispetto a IMPL-020

Default:

```text
read file
JSON.parse
→ ok.
```

Non verifica:

```text
schema
identity
revision
headCommitId
digest.
```

---

# 32. Quindi current verified recovery è PARZIALE rispetto alla nuova IMPL

Formula corretta:

```text
IMPLEMENTED primitive:
target presence/parse check
+ reopen/rewrite

MISSING:
full canonical verification.
```

---

# 33. Questo boundary deve essere esplicito nel registro

Altrimenti una task futura
potrebbe:

```text
riscrivere markDocumentIncomplete
riscrivere residual verification
riscrivere bootstrap recovery
```

invece di estenderli.

---

# 34. TEST-021 non va automaticamente promosso

Todo:

```text
TEST-021
Verifica target completed
nei record parziali
→ MANCANTE.
```

Il codice ha
una primitive comportamentale simile.

Ma il TEST-ID
richiede il nuovo contract owner
e non è registrato come chiuso.

Quindi:

```text
existing behavior coverage
≠
TEST-021 completed.
```

---

# 35. TEST-022 resta chiaramente mancante

Richiede:

```text
JSON valido
ma identity/digest errati.
```

Current verifier
accetta un JSON parseabile.

Quindi manca.

---

# 36. TEST-024 aggregate integrity resta mancante

Current integrity API
è source-scoped.

Non esiste
l’aggregate shared-history authority
richiesta.

---

# 37. TEST-026 read statuses resta mancante

Current statuses
non includono:

```text
invalid_schema
ambiguous
revision/headCommit.
```

---

# 38. TEST-027 duplicate event documents resta mancante

Current storage
sceglie ancora:

```text
sort()[0].
```

---

# 39. TEST-028 confinement — copertura parziale, requirement ancora open

Writer corrente
rifiuta target
se non coincide
con il resolved target.

Questo è
un guardrail utile.

Ma IMPL-020 richiede
anche:

```text
bounded numeric eventId
root confinement
journal target revalidation.
```

Quindi TEST-028
non va promosso.

---

# 40. TEST-029 writer raw — ancora open

Writer raw
sono ancora
surface esportate.

Todo lo mantiene
mancante.

---

# 41. IMPL-021 — stato owner

```text
NECESSARIA
CONFERMATA E APPROVATA
PRIORITÀ ALTA.
```

Todo coerente.

---

# 42. Recovery bootstrap pre-listen è già implementato

`server.js`:

```text
acquire writer authority
→ runPendingCommitRecovery(...)
→ fatal check
→ listen.
```

Quindi questa policy
non è più futura.

---

# 43. Recovery summary è già una struttura reale

`runPendingCommitRecovery`
produce:

```text
ok
fatal
scanned
recovered
cleaned
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
outcomes.
```

Questa è
una primitive significativa.

---

# 44. Recovery record può già diventare `recovery_failed`

Journal store:

```text
markRecoveryFailed(...)
```

persistisce:

```text
status = recovery_failed
reason.
```

Quindi anche questa
non è più solo proposta.

---

# 45. Per-source integrity read model esiste

`getMatchPersistenceIntegrity(...)`
normalizza:

```text
no_known_partial
partial_persistence
recovery_failed
```

con:

```text
commitId
affectedDocuments.
```

---

# 46. Ma non è il Recovery Control Plane di IMPL-021

Manca:

```text
healthy
recovering
partial
recovery_failed
integrity_unknown

writersAllowed
pendingCount
failedCount
invalidJournalCount
lastRecoveryAt
outcomes persisted/interrogable.
```

---

# 47. Nessun global writersAllowed persistente

La search current
non trova:

```text
writersAllowed.
```

---

# 48. Nessun `integrity_unknown` globale persistente

Recovery summary
può contare:

```text
invalidJournal
```

ma il backend
non crea
un authority state persistente
`integrity_unknown`.

---

# 49. Invalid journal non attribuibile non implementa il policy target completo

La recovery
aggiunge outcome:

```text
invalid_journal
```

ma non risulta
una global writer blockade
interrogabile
come `writersAllowed:false`.

---

# 50. Retry bounded/escalation non implementati come control plane

Recovery ha categorie:

```text
retryable_pending
recovery_failed.
```

Ma non persiste:

```text
attemptCount
lastAttemptAt
threshold
retry policy.
```

---

# 51. Rearm esplicito assente

Non esiste:

```text
rearm API
local command
commandId
idempotent rearm.
```

---

# 52. Storage-integrity endpoint futuro assente

La search corrente
non trova:

```text
GET /api/runtime/storage-integrity.
```

Corretto
che resti future.

---

# 53. Bootstrap summary logging è solo parziale

Il recovery
produce un summary ricco.

Il server,
nel percorso verificato,
registra:

```text
recovery_complete
{ ok: true }
```

non l’intero
summary bounded.

Quindi il requisito:

```text
summary bootstrap reale nel log
```

non è pienamente realizzato.

---

# 54. TEST-023 resta open

Richiede:

```text
invalid journal
→ read-only integrity_unknown.
```

Current behavior
non implementa
quel control-plane state completo.

---

# 55. TEST-030 resta open

Richiede:

```text
retry
escalation
rearm.
```

Manca.

---

# 56. IMPL-STORAGE-001 — current implementation coverage boundary

**Priorità:** HIGH  
**Tipo:** implementation-state granularity / protect existing recovery

## Problema

Le card 020/021
sono correttamente
non completate,
ma il registro
non rende visibile
quale sotto-perimetro
è già implementato
dalla Task 6.

Questo crea rischio
di duplicazione/regressione.

---

# 57. Coverage da registrare per IMPL-019

```text
CURRENT IMPLEMENTED PRIMITIVES:
IMPL-015 process writer authority

MISSING IMPL-019:
event-scoped commit authority
cross-source blocking
base revision
eventPersistenceId
session-aware stale callback protection.
```

---

# 58. Coverage da registrare per IMPL-020

```text
ALREADY IMPLEMENTED:
atomic write/rename
commitId propagation
pending journal
completed target verification
reopen incomplete
repair/rewrite
basic history read result
stableJson primitive

MISSING:
canonical document schema
revision
headCommitId
sourceTickId
payloadDigest
expectedBaseRevision
verifiedAt
schema/identity/digest verification
ambiguous storage
deterministic migration contract.
```

---

# 59. Coverage da registrare per IMPL-021

```text
ALREADY IMPLEMENTED:
recovery before listen
fatal summary
bounded recovery outcomes
retryable/recovery_failed categories
persisted recovery_failed record
source-level integrity state

MISSING:
persistent global control plane
integrity_unknown authority
writersAllowed
attemptCount
bounded retry thresholds
escalation policy
rearm
runtime storage-integrity API
UI integration
full bootstrap summary logging.
```

---

# 60. Non cambiare lo stato globale delle IMPL

Dopo la correzione:

```text
IMPL-019
→ APPROVATA / OPEN

IMPL-020
→ APPROVATA / OPEN
  with existing primitives

IMPL-021
→ APPROVATA / OPEN
  with existing primitives.
```

Non usare:

```text
COMPLETATA
```

per nessuna delle tre.

---

# 61. Non promuovere TEST-019…030

Todo corrente
li marca tutti:

```text
MANCANTI.
```

La presenza
di primitive legacy
non chiude
il nuovo requirement ID.

---

# 62. Acceptance criteria — IMPL-STORAGE-001

```text
[ ] IMPL-019 current coverage esplicita
[ ] IMPL-020 current coverage esplicita
[ ] IMPL-021 current coverage esplicita
[ ] Task 6 target verification preservata
[ ] markDocumentIncomplete preservata
[ ] recovery bootstrap pre-listen preservato
[ ] partial_persistence/recovery_failed preservati
[ ] missing canonical schema esplicito
[ ] missing digest/revision esplicito
[ ] missing global control plane esplicito
[ ] TEST-019…030 non promossi
[ ] nessun existing primitive reimplementato
[ ] nessun current PASS inventato
```

---

# 63. Secondo problema: dependency/sequencing metadata

Il file contiene
un ordine approvato:

```text
IMPL-015
→ IMPL-019
→ IMPL-020
→ IMPL-021
→ TEST-019…030
→ IMPL-009
→ IMPL-013
→ evoluzione storage soltanto se misurata.
```

---

# 64. Contraddizione 1 — IMPL-021 ↔ IMPL-009

Card IMPL-021:

```text
Dipendenze:
IMPL-015
IMPL-019
IMPL-020
runtime logger
IMPL-009.
```

Ma ordine approvato:

```text
IMPL-021
→ TEST
→ IMPL-009.
```

---

# 65. Le due cose non possono valere entrambe se `Dipendenze` significa hard prerequisite

Se 009 è prerequisite:

```text
009
→ 021.
```

Se ordine §18.2 è autorevole:

```text
021
→ 009.
```

Serve classificazione.

---

# 66. La relazione semantica suggerita dalla stessa card

IMPL-021 dice:

```text
IMPL-009 traduce lo stato
in UI locale/globale.
```

Questo descrive
un downstream consumer.

---

# 67. Quindi IMPL-009 sembra integrazione successiva, non hard prerequisite

Proposta:

```text
Hard prerequisites:
015
019
020

Runtime dependency:
logger

Downstream UI consumer:
009.
```

Salvo diversa decisione esplicita.

---

# 68. Contraddizione 2 — IMPL-020 ↔ IMPL-013

Estensione IMPL-013:

```text
Nessuna evoluzione del formato
prima di questa baseline.
```

---

# 69. Ma ordine approvato mette IMPL-013 dopo IMPL-020

```text
019
→ 020
→ 021
→ tests
→ 009
→ 013.
```

---

# 70. IMPL-020 introduce una evoluzione significativa del formato

Richiede:

```text
documentType
schemaVersion
revision
headCommitId
sourceTickId
payloadDigest
expectedBaseRevision
deterministic targets
migration legacy→canonical.
```

Quindi è
un format-contract evolution.

---

# 71. Ambiguità da risolvere

Possibili interpretazioni:

A:

```text
la baseline IMPL-013
deve precedere
anche IMPL-020.
```

B:

```text
la frase "nessuna evoluzione"
si riferisce soltanto
a ottimizzazioni successive
al canonical contract,
non alla migrazione IMPL-020.
```

Il file oggi
non lo dice.

---

# 72. Non scegliere arbitrariamente A o B

Serve una decisione
del dependency graph.

Il report
non deve riscrivere
la sequenza da solo.

---

# 73. Estensione IMPL-008 è anch'essa relazione di test, non hard dependency owner

Il file aggiunge
fixture persistence/recovery
per:

```text
cross-source pending
digest
invalid journal
duplicates
retry/rearm.
```

Questa è:

```text
validation infrastructure
```

da coordinare,
non necessariamente
prerequisito di implementazione.

---

# 74. IMPL-STORAGE-002 — normalizzare dependency graph e sequencing

**Priorità:** HIGH  
**Tipo:** dependency metadata / sequencing contradiction

## Azione

Distinguere per 019–021:

```text
Hard prerequisites
Existing prerequisites already completed
Validation dependencies
Downstream consumers
Measurement gates
Future integrations.
```

---

# 75. IMPL-019 graph

Chiarire:

```text
IMPL-015
→ completed hard prerequisite

IMPL-006
→ coordinated session authority
  o hard prerequisite da motivare

journal Sofa/Betfair
→ existing implementation surface.
```

---

# 76. IMPL-020 graph

Chiarire:

```text
IMPL-019
→ hard prerequisite?

history/timeline store
→ implementation surfaces

commit journal
→ implementation surface

IMPL-013 baseline
→ deve precedere il format change?
  oppure misura solo evoluzioni successive?
```

---

# 77. IMPL-021 graph

Chiarire:

```text
015/019/020
→ hard prerequisites

runtime logger
→ implementation dependency

IMPL-009
→ downstream UI consumer
  oppure prerequisite,
  ma deve essere coerente con §18.2.
```

---

# 78. §18.2 dopo normalizzazione

Deve essere
un ordine eseguibile
senza cicli.

Esempio solo concettuale:

```text
prerequisites
→ implementation
→ tests
→ UI consumers
→ measurement
→ optional future evolution.
```

La sequenza concreta
va decisa nel task.

---

# 79. Acceptance criteria — IMPL-STORAGE-002

```text
[ ] no hard dependency contraddice §18.2
[ ] IMPL-009 relation esplicita
[ ] IMPL-013 measurement gate esplicito
[ ] "no format evolution before baseline" chiarita
[ ] IMPL-008 classified as validation support
[ ] IMPL-015 acknowledged completed prerequisite
[ ] no dependency cycle
[ ] Todo priority metadata unchanged unless decision requires update
[ ] owner IDs unchanged
[ ] no implementation performed
```

---

# 80. Dedupe con IMPL-BETFAIR-001

Report 065
ha aperto:

```text
IMPL-BETFAIR-001
```

per dependency semantics
di IMPL-016…018.

Questo report apre:

```text
IMPL-STORAGE-002
```

per IMPL-019…021.

Sono sibling findings,
non duplicati,
perché hanno owner
e contraddizioni diverse.

---

# 81. Dedupe con report 055

Report 055
ha confermato
che STORAGE-001…012
e IMPL-019…021
restano current.

Non aveva aperto
un task di modifica
del registry owner.

IMPL-STORAGE-001/002
sono quindi:

```text
registry-specific
```

e non riaprono
i bug storage sottostanti.

---

# 82. Dedupe con JOURNAL-REC-*

Non creare
nuovi bug per:

```text
journal
recovery
target check
integrity.
```

Le root implementation
sono già nei finding
e nelle IMPL.

---

# 83. Dedupe con TEST-019…030

Non creare nuovi TEST-ID.

Usare
quelli già registrati.

---

# 84. Modularizzazione

Dimensione:

```text
410 righe.
```

---

# 85. Responsabilità unica

La catena è:

```text
event commit authority
→ canonical storage identity
→ verified recovery
→ recovery operator state.
```

Splittare 019/020/021
in tre file
renderebbe più difficile
vedere il dependency graph
che proprio qui
deve essere corretto.

---

# 86. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 87. Aspetti corretti da preservare — IMPL-019

```text
event-scoped lock
cross-source shared-history blocking
source not exclusive owner
stale callback blocked
partial not bypassed
runtime state only after commit
fail-closed
```

---

# 88. Aspetti corretti da preservare — IMPL-020

```text
schema version
revision/head commit
immutable sourceTickId
acquiredAt vs recordedAt
cross-source derived state stays derived
stable digest
ambiguous storage blocking
root confinement
legacy-compatible migration
no arbitrary duplicate selection
```

---

# 89. Aspetti corretti da preservare — IMPL-021

```text
global recovery state
writersAllowed
bounded outcomes
attempt state
retry bounded
recovery_failed
rearm explicit
read-only mode where safe
local-only future API
separate from Betfair health/identity/freshness
```

---

# 90. Non-finding — Task 6 target verification

È una parte utile
già presente.

Non è una ragione
per chiudere IMPL-020.

---

# 91. Non-finding — recovery bootstrap

È già presente.

Non è una ragione
per chiudere IMPL-021.

---

# 92. Non-finding — source-level 409 integrity

È un current guardrail.

Non equivale
a global recovery control plane.

---

# 93. Non-finding — stableJson

Primitive utile.

Non equivale
a payloadDigest persistito.

---

# 94. Non-finding — atomic rename

Process-level atomicity
non equivale:

```text
revision control
digest validation
durability guarantee.
```

---

# 95. Non-finding — `sort()[0]`

È precisamente
un gap ancora owner
da STORAGE-008/IMPL-020.

Non creare nuovo finding.

---

# 96. Non-finding — TEST-021 behavior overlap

Anche se esiste
una primitive target verification,
il requirement ID
resta ufficialmente:

```text
MANCANTE.
```

Non promuoverlo
senza mapping/test evidence.

---

# 97. Verifica tecnica futura dei soli cambi registry

```text
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
node scripts/validation/run.mjs fast
git diff --check
```

Non serve:

```text
live tracking
Betfair login
Chrome
recovery su dati runtime reali
```

per correggere il registro.

---

# 98. Nuovi finding

```text
IMPL-STORAGE-001
IMPL-STORAGE-002
```

---

# 99. Nuove task runtime

```text
0
```

---

# 100. Nuove task registry/documentazione

```text
2
```

---

# 101. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

---

# 102. Decisione finale

```text
implementazioni/implementazioni-proposte/03-storage-recovery.md:

ROLE:
OWNER REGISTRY SOLIDO

PERIMETRO:
IMPL-019…021

DIMENSIONE:
410 RIGHE

IMPL-019:
OPEN
APPROVATA
CRITICA

IMPL-020:
OPEN
APPROVATA
CRITICA
PARTIAL PRIMITIVES EXIST

IMPL-021:
OPEN
APPROVATA
ALTA
PARTIAL PRIMITIVES EXIST

FALSE COMPLETION:
NO

NEW STORAGE BUG:
NO

PROBLEMA 1:
CURRENT IMPLEMENTATION COVERAGE
NON ESPLICITA

PROBLEMA 2:
DEPENDENCY/SEQUENCING
CONTRADDITTORIO

CHANGE ID:
IMPL-STORAGE-001
IMPL-STORAGE-002

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ

MODULARIZZAZIONE:
NO
```

---

# 103. Stato audit dopo report 066

```text
Documenti Markdown totali: 72
Analizzati: 66
Da analizzare: 6
Avanzamento: 91,67%
```

Sequenza:

```text
[✓] 064 implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
[✓] 065 implementazioni/implementazioni-proposte/02-runtime-betfair.md
[✓] 066 implementazioni/implementazioni-proposte/03-storage-recovery.md
[ ] 067 implementazioni/implementazioni-proposte/04-evidence-provenance.md
```

---

# 104. Contatori task

Ultimo consolidamento:

```text
report 062
→ 338 task note
```

Dopo:

```text
063 → +1
064 → +2
065 → +1
066 → +2
```

Totale provvisorio:

```text
344
```

Non ancora consolidate:

```text
DOC-AUDIT-PROC-001
IMPL-BASE-001
IMPL-BASE-002
IMPL-BETFAIR-001
IMPL-STORAGE-001
IMPL-STORAGE-002
```

---

# 105. Stato mappa / JSON

```text
mappa-file-markdown-repository-continuazione-048.md
→ NON MODIFICATA

modifiche-audit-markdown-continuazione-048.json
→ NON MODIFICATO
```

---

# 106. Prossimo documento — non analizzato

```text
067
implementazioni/implementazioni-proposte/04-evidence-provenance.md
```

---

# 107. Stop operativo

```text
report 066:
COMPLETATO

nuovi Change ID:
IMPL-STORAGE-001
IMPL-STORAGE-002

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 067:
NON ANALIZZATO
```
