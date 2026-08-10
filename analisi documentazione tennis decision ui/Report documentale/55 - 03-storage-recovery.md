# Report documentale — `implementazioni/audit-codice/03-storage-recovery.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-055
Sequenza audit: 55/72
Documento analizzato: 03-storage-recovery.md
Percorso documento: implementazioni/audit-codice/03-storage-recovery.md
Percorso report: Report documentale/55 - 03-storage-recovery.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 46f9fa7916fd9a46ee3a809493912764e1c1ec32
Dimensione documento: 809 righe
Tipo: modulo owner dell’audit codice — secondo audit Punto 4 Storage/Journal/Recovery
Baseline dichiarata nel documento: d797d0ee9ec70d4b2f85f6aa51b91af8f71227a1
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/implementazioni-proposte/03-storage-recovery.md
implementazioni/99-decisioni-utente.md

backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/matchHistory/sofaUpdates/recovery.js
backend/src/sofa/matchHistory.js
backend/src/routes/match/readResponses.js
```

Sono stati inoltre coordinati, senza duplicarli, i finding già emersi nei report documentali successivi:

```text
STORAGE-TH-001…009
JOURNAL-REC-001…010

METHOD-EVIDENCE-001
PLAN-AUDIT-003
TASK-RECHECK-002
```

GitHub non è stato modificato.

La mappa/JSON `continuazione-048` non viene aggiornata con questo singolo report.
Il consolidamento resta previsto alla chiusura del blocco 053–057, salvo diversa istruzione dell’utente.

---

# Esito sintetico

```text
Valore tecnico del modulo:                         ALTO
Baseline dichiarata:                               PRESENTE
Analisi statica dichiarata:                        SÌ
Suite non rieseguite dichiarato:                   SÌ
Owner STORAGE-001…012:                             COERENTI con Todo
SECURITY-006:                                      COERENTE
TEST-019…030:                                      COERENTI / ancora mancanti
IMPL-019…021:                                      APPROVATE, non completate
Shared history source/event mismatch:              ancora reale
Completed target verification:                     ancora incompleta
Target validation JSON.parse-only:                 ancora reale
Invalid journal globale:                           ancora non authority completa
History integrity source-specific:                 ancora reale
Raw writer exports:                                ancora presenti
Power-loss durability:                             correttamente trattata come limite
Performance full-document:                         correttamente da misurare

Contraddizioni interne di stato:                   NESSUNA significativa
Drift priorità vs Todo:                            NESSUNO significativo
False closure:                                     NESSUNA
Nuovo bug runtime:                                 NESSUNO
Nuovo finding documentale:                         NESSUNO
Nuove task:                                        0

Responsabilità del file:                           UNA
Dimensione:                                        809 righe
Split:                                             NON necessario
Riscrittura completa:                              NO
Revisione mirata autonoma:                         NO
Nuovi file proposti:                               nessuno
Priorità complessiva del documento:                ALTA come record tecnico
```

La conclusione centrale è:

```text
QUESTO MODULO È ANCORA COERENTE
CON LO STATO CORRENTE DEL BACKLOG STORAGE.

I PROBLEMI CHE DESCRIVE
NON SONO STATI FALSAMENTE CHIUSI.

IL CODICE CORRENTE CONFERMA
DIVERSE DELLE ROOT ISSUE PRINCIPALI:

- target verification ancora JSON.parse-only;
- partial repair ancora fiducioso dei flag completed;
- shared history API ancora source-specific lato integrity;
- raw writer ancora esportati.

GLI AUDIT SUCCESSIVI
HANNO TROVATO ULTERIORI PROBLEMI
PIÙ PROFONDI SU QUESTE SUPERFICI,
MA ESISTONO GIÀ OWNER DEDICATI:

STORAGE-TH-*
JOURNAL-REC-*.

NON È NECESSARIO APRIRE
UNA NUOVA FAMIGLIA DI TASK
DA QUESTO FILE.
```

---

# 1. Il ruolo del documento è chiaro

Header:

```text
Parte 3 di 7
— Storage, journal e recovery
```

Perimetro:

```text
history condivisa
timeline
commit journal
recovery
authority event-scoped
contratti documento
writer raw.
```

Questa è una responsabilità tecnica coerente.

---

# 2. Il documento contiene un solo audit point

A differenza del file 054,
qui esiste:

```text
un solo Punto 4
```

con:

```text
una sola baseline
d797d0ee...
```

e una sola famiglia tecnica:

```text
Persistence / Storage / Recovery.
```

Questo pesa contro uno split.

---

# 3. Il significato di `COMPLETATO E APPROVATO` è sufficientemente contestualizzato

Il file dichiara:

```text
Secondo audit del codice
Punto 4
```

e subito dopo:

```text
L’analisi è statica.
Le suite non sono state rieseguite
in questo checkpoint.
```

Inoltre ogni finding mantiene
il proprio stato:

```text
CONFERMATO
CORREZIONE APPROVATA
POLICY APPROVATA
STRUTTURA ASSENTE
LIMITE
SUPERFICIE DA CHIUDERE.
```

Quindi non risulta
una falsa affermazione:

```text
tutto implementato.
```

---

# 4. Non apro un finding tipo `AUDIT-CODE-P4-001` sulla parola “completato”

Il problema generale:

```text
audit activity complete
≠
all changes implemented
```

è già posseduto da:

```text
PLAN-AUDIT-003
METHOD-EVIDENCE-001.
```

Nel file 055
non esiste un’ulteriore
contraddizione locale sufficiente
a giustificare un nuovo owner.

---

# 5. Scrittura atomica del singolo file — claim corretto e bounded

Il file dichiara:

```text
tmp file
→ JSON completo
→ rename
→ cleanup tmp
```

e limita correttamente il claim a:

```text
normale scrittura parziale
del processo.
```

Non dice:

```text
durability power-loss garantita.
```

Più avanti `STORAGE-011`
esplicita proprio tale differenza.

---

# 6. La distinzione atomicità / durability è una buona proprietà del documento

Formula:

```text
atomicità process-level
≠
durabilità power-loss.
```

È corretta e prudente.

Non introduce:

```text
fsync su ogni tick
```

senza baseline.

Da preservare.

---

# 7. Ordine journalizzato — descrizione coerente

Sequenza:

```text
prepare history/timeline
→ journal pending
→ history
→ mark history
→ timeline
→ mark timeline
→ remove journal.
```

Il modulo usa questa base
per trovare problemi
di authority e recovery.

Non confonde:

```text
write ordering
```

con:

```text
cross-source serialization completa.
```

---

# 8. Recovery prima del listen — correttamente preservata

Il documento stabilisce:

```text
writer authority
→ recovery
→ listen
```

Questa relazione
rimane compatibile con
la chiusura di `IMPL-015`.

Nessun finding.

---

# 9. Schema journal — claim prudente

Il file attribuisce al journal
controlli su:

```text
source
eventId
commitId
structure
finite JSON
sensitive-key concepts
query sensitive
network capture allow-list.
```

Ma non usa questi controlli
per affermare:

```text
canonical target semantically verified.
```

Infatti `STORAGE-003`
denuncia proprio
la verifica target insufficiente.

Coerente.

---

# 10. Integrity pending validi — claim correttamente limitato

Il file dice:

```text
partial_persistence
recovery_failed
no_known_partial
```

ma aggiunge:

```text
questo non dimostra
la salute dei documenti canonici.
```

Questa è una distinzione
molto importante
e va preservata.

---

# 11. Il codice corrente conferma il limite dell’integrity

`getMatchPersistenceIntegrity(...)`
normalizza soltanto:

```text
no_known_partial
partial_persistence
recovery_failed
```

e, se il journal store
non restituisce una struttura utile:

```text
→ no_known_partial.
```

Quindi:

```text
no_known_partial
≠
document healthy.
```

Il modulo è corretto.

---

# 12. STORAGE-001 — shared history vs source-scoped authority

Stato nel modulo:

```text
CONFERMATO;
CORREZIONE APPROVATA
Priorità critica.
```

Todo corrente:

```text
STORAGE-001
→ CONFERMATO
→ IMPL-019 APPROVATA
→ priorità critica.
```

Coerente.

---

# 13. Il lost-update scenario resta logicamente valido

Scenario:

```text
Sofa prepara H0 + S1
→ pending Sofa

Betfair prepara da H0
→ H0 + B1

recovery Sofa
→ replay H0 + S1
→ B1 perso.
```

La scrittura atomica del file
non risolve:

```text
stale full-document base.
```

La root issue è corretta.

---

# 14. IMPL-019 conferma lo stesso modello

Owner corrente:

```text
un solo commit canonico attivo per evento
event-scoped
non source-scoped
pending shared history cross-source bloccante
expectedBaseRevision.
```

Quindi il modulo audit
e l’owner implementativo
sono allineati.

---

# 15. IMPL-019 non è completata

Owner:

```text
Classificazione:
NECESSARIA

Stato:
CONFERMATA E APPROVATA

Priorità:
critica.
```

Il modulo non la promuove
a implementata.

Nessun overclaim.

---

# 16. STORAGE-002 — current code conferma il problema nei record parziali

Il Punto 4 dice:

```text
history.completed = true
timeline.completed = false

→ repair si fida di history
→ tenta solo timeline.
```

Il codice corrente
`repairSofaCommitFromJournal(...)`:

```text
if (!historyCompleted) {
   write history
} else {
   documents.history = {
      ok: true,
      status: 'written',
      ...
   }
}
```

Quindi:

```text
completed:true
→ non implica verify target
nel repair parziale.
```

Finding ancora reale.

---

# 17. Il bootstrap ha una verifica solo quando entrambi risultano completed

`runPendingCommitRecovery(...)`:

```text
if (historyCompleted && timelineCompleted) {
   verify history
   verify timeline
   ...
}
```

Per un record parziale:

```text
non entra in quel blocco
→ va direttamente al repair.
```

Questo conferma
la distinzione del finding.

---

# 18. STORAGE-002 resta critical

Todo:

```text
STORAGE-002
→ target marked complete
  non verificato nei record parziali
→ CORREZIONE APPROVATA
→ priorità critica.
```

Nessun drift.

---

# 19. STORAGE-003 — current code conferma JSON.parse-only

Funzione:

```text
verifyDocumentTargetDefault(target)
```

fa:

```text
readFileSync
JSON.parse
→ ok:true
```

Non verifica:

```text
documentType
schemaVersion
eventId
source
revision
headCommitId
payloadDigest.
```

Il finding è ancora reale.

---

# 20. Non aprire un nuovo bug sulla verifica target

Questa root issue
è già:

```text
STORAGE-003
IMPL-020
```

e gli audit successivi
hanno aperto ulteriori dettagli
nella famiglia:

```text
JOURNAL-REC-*.
```

Nessun nuovo owner.

---

# 21. IMPL-020 mantiene la correzione corretta

Owner:

```text
Canonical document contract
e verified recovery
```

con:

```text
schema
identity
revision
digest
read contract
duplicate detection
path confinement.
```

Stato:

```text
CONFERMATA E APPROVATA
```

non:

```text
implementata.
```

Coerente.

---

# 22. STORAGE-004 — invalid journal non attribuibile

Il modulo distingue:

```text
valid record
invalid attributable
invalid non-attributable.
```

La policy approvata:

```text
integrity_unknown
writersAllowed:false
readersAllowed:true.
```

La Todo corrente
mantiene il finding aperto.

Nessun drift.

---

# 23. Il codice corrente conferma che invalidEntries sono soprattutto summary/outcome

`runPendingCommitRecovery(...)`:

```text
invalidEntries
→ summary.invalidJournal
→ outcome invalid_journal
```

ma non introduce
un authority globale persistente:

```text
writersAllowed:false.
```

Questo resta il gap
di `IMPL-021`.

---

# 24. IMPL-021 resta approvata ma non completata

Owner:

```text
Recovery control plane
Stato:
CONFERMATA E APPROVATA
Priorità:
alta.
```

Include:

```text
healthy
recovering
partial
recovery_failed
integrity_unknown
writersAllowed
pendingCount
failedCount
invalidJournalCount.
```

Coerente.

---

# 25. SECURITY-006 — current code supporta il finding

Nel recovery corrente:

```text
isValidEventId(eventId)
→ string non vuota
```

e:

```text
isValidTarget(target)
→ string non vuota.
```

Questo non costituisce:

```text
eventId numerico bounded
root confinement.
```

Quindi il finding resta tecnicamente plausibile e coerente.

---

# 26. Nessun nuovo security finding

Il modulo ha già:

```text
SECURITY-006.
```

L’audit successivo storage
può raffinare path/discovery,
ma non serve un secondo ID
per la stessa root issue.

---

# 27. STORAGE-005 — shared history usa integrity Sofa

Il modulo dice:

```text
buildMatchHistoryResponse
→ getMatchPersistenceIntegrity(eventId, 'sofa')
```

Il codice corrente
fa ancora:

```text
const integrity =
    getIntegrity(eventId, 'sofa');
```

Quindi il finding è ancora vero.

---

# 28. L’API history resta quindi source-specific sul controllo integrity

Questo è incompatibile
con il target approvato:

```text
shared history
→ aggregate integrity.
```

Ma è già owner di:

```text
STORAGE-005
IMPL-020/021
```

a seconda del livello.

Nessun nuovo Change ID.

---

# 29. STORAGE-006 — cross-source state pre-commit

Il modulo identifica
la differenza fra:

```text
candidate runtime state
```

e:

```text
committed canonical state.
```

La decisione:

```text
prepare
→ commit
→ publish committed state
```

è coerente.

Todo mantiene `STORAGE-006` aperto.

---

# 30. STORAGE-006 non deve essere fuso con session authority

La tracking session decide:

```text
chi è autorizzato ad agire.
```

La persistence authority decide:

```text
quale stato è canonico e commit-tato.
```

Sono contratti differenti.

Il modulo li mantiene separati.

---

# 31. STORAGE-007 — read result collapse

Il modulo distingue
il target desiderato:

```text
found
missing
invalid_json
invalid_schema
read_failed
ambiguous.
```

La Todo mantiene
la issue aperta.

Gli audit documentali successivi
hanno verificato ulteriori
collapse/ambiguity.

Nessuna nuova task.

---

# 32. STORAGE-008 — duplicate event documents

Il modulo rifiuta
la politica:

```text
sort()[0]
```

e approva:

```text
0 → missing
1 → canonical
>1 → ambiguous_storage
→ writer blocked.
```

Questa è ancora
la direzione corretta.

---

# 33. Non trasformare subito il naming target in una migrazione distruttiva

Il file dice:

```text
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

come target futuri,
ma specifica:

```text
migrazione non distruttiva
e separata.
```

Buon boundary.

---

# 34. STORAGE-009 — retry metadata

Il modulo identifica:

```text
attemptCount
lastAttemptAt
lastFailureReason
lastFailedDocument
recoveryState.
```

Todo:

```text
STORAGE-009
→ nessuna policy persistita
dei tentativi recovery
→ IMPL-021 approvata.
```

Coerente.

---

# 35. Il current recovery summary non costituisce ancora la policy persistita

Il codice ha counters runtime:

```text
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
outcomes.
```

Ma questi non equivalgono
a metadata persistiti nel record:

```text
attemptCount
lastAttemptAt
...
```

Quindi il finding resta corretto.

---

# 36. STORAGE-010 — full-document amplification

Il file lo tratta come:

```text
limite strutturale
da misurare.
```

Non come:

```text
bug certo
da correggere subito.
```

Decisione:

```text
prima baseline
poi eventuale formato nuovo.
```

Molto coerente con
la filosofia del progetto.

---

# 37. Non aprire una task di performance da questo audit

Esiste già:

```text
IMPL-013
```

come luogo per le misure.

Il modulo non autorizza:

```text
NDJSON
DB
segmentazione
```

senza dati.

Da preservare.

---

# 38. STORAGE-011 — durability

Stato:

```text
limite confermato
da documentare e misurare.
```

Non viene confuso
con data loss dimostrato.

Corretto.

---

# 39. Nessun `fsync` automatico va dedotto dal finding

Il modulo dice:

```text
non introdurre fsync
su ogni tick senza benchmark.
```

Questa prudenza
va mantenuta.

---

# 40. STORAGE-012 — raw writer exports

Il modulo elenca:

```text
saveHistory
saveTimeline
writeTimelineDocument.
```

Il codice corrente `matchHistory.js`
esporta ancora:

```text
saveHistory(...)
```

e usa internamente
`writeTimelineDocument`
come dependency.

La superficie
non risulta falsamente dichiarata chiusa.

---

# 41. Il commento compatibility façade non elimina STORAGE-012

`addBetfairUpdate(...)`
è correttamente degradato
a preparation-only.

Ma:

```text
saveHistory
```

resta pubblicamente esportato
dal modulo.

Quindi:

```text
writer raw surface
→ ancora reale.
```

---

# 42. Non rimuovere writer raw senza inventario

Il modulo impone:

```text
consumer inventory
→ classify runtime/test/recovery
→ explicit recovery adapters
→ remove/internalize.
```

Questo boundary è corretto.

---

# 43. Source Identity confirmation store separato — scelta coerente

Il modulo dice:

```text
non è persistence canonica
della partita
→ niente secondo journal.
```

Ma richiede:

```text
backend writer authority
atomic write
visible read failure.
```

Scelta coerente.

---

# 44. Non fondere Source Identity store con history/timeline journal

Non esiste evidenza
che serva un commit cross-documento
con le timeline canoniche.

Quindi nessun nuovo finding.

---

# 45. Le sintesi IMPL-019…021 non sono owner duplicate

Il documento usa:

```text
Sintesi IMPL-019
Sintesi IMPL-020
Sintesi IMPL-021.
```

Gli owner reali vivono in:

```text
implementazioni/implementazioni-proposte/03-storage-recovery.md.
```

Questa è la forma corretta.

---

# 46. Non trasformare le sintesi in owner card

Preservare:

```text
summary only.
```

Il registry checker
non deve trovare
una seconda owner card.

---

# 47. TEST-019…030 — stato coerente

Il modulo li presenta
come:

```text
Test mancanti.
```

La Todo corrente
mantiene l’intera famiglia
come mancante.

Nessun falso PASS.

---

# 48. TEST-019/020 sono coerenti con STORAGE-001

Coprono:

```text
lost update cross-source
pending shared-target cross-source.
```

Corretta relazione.

---

# 49. TEST-021/022 sono coerenti con STORAGE-002/003

Coprono:

```text
completed target missing/corrupt
JSON valid but wrong identity/digest.
```

Nessun gap di mapping.

---

# 50. TEST-023/024 sono coerenti con global/aggregate integrity

Coprono:

```text
invalid journal
→ integrity_unknown

shared history
→ aggregate integrity.
```

Coerenti.

---

# 51. TEST-025 copre committed-only state

Correlazione corretta
con `STORAGE-006`.

---

# 52. TEST-026/027 coprono read/ambiguity

Correlazione:

```text
STORAGE-007
→ read status

STORAGE-008
→ duplicate documents.
```

Corretta.

---

# 53. TEST-028 copre confinement

Correlazione
con `SECURITY-006`.

Corretta.

---

# 54. TEST-029 copre writer raw

Correlazione
con `STORAGE-012`.

Corretta.

---

# 55. TEST-030 copre recovery attempts

Correlazione
con `STORAGE-009`
e `IMPL-021`.

Corretta.

---

# 56. L’ordine tecnico risultante è storico ma non ingannevole nel contesto

Sequenza:

```text
IMPL-015
→ IMPL-019
→ IMPL-020
→ IMPL-021
→ TEST-019…030
→ IMPL-009
→ IMPL-013
→ eventuale evoluzione.
```

Oggi:

```text
IMPL-015
→ già completata.
```

Ma il blocco è chiaramente dentro:

```text
Punto 4
baseline d797...
```

e l’owner IMPL corrente
ripete ancora la stessa dipendenza
come ordine approvato.

Non serve una task specifica.

---

# 57. Non leggere l’ordine come current queue automatica

La Todo corrente
resta authority
della selezione del prossimo lavoro.

Il modulo non seleziona
automaticamente la prossima task.

Questo principio
è già stabilito globalmente.

---

# 58. Gli audit successivi hanno trovato nuove criticità nelle stesse superfici

I report successivi
su storage e journal
hanno raffinato:

```text
read/discovery
semantic target validation
completed residual cleanup
repair validity
integrity unknown
journal recovery semantics
writer/read authority.
```

Queste estensioni
non rendono il Punto 4
storicamente invalido.

---

# 59. Non duplicare STORAGE-TH-001…009

La famiglia `STORAGE-TH-*`
possiede i problemi più specifici
emersi nell’audit successivo
di timeline/history.

Il report 055
non deve creare:

```text
STORAGE-013...
```

solo per ricopiarli.

---

# 60. Non duplicare JOURNAL-REC-001…010

La famiglia `JOURNAL-REC-*`
possiede gli approfondimenti
sul commit journal/recovery
emersi dopo il Punto 4.

Questo file resta:

```text
audit origin / decision record.
```

---

# 61. Perché non apro una task di supersession

A differenza del report 053:

```text
non esistono domande
già risolte
presentate localmente
come ancora da decidere.
```

A differenza del report 054:

```text
non esistono priorità locali
chiaramente divergenti dalla Todo.
```

Inoltre:

```text
baseline
stato audit
analysis static
tests not rerun
```

sono tutti esplicitati.

Quindi il boundary storico
è sufficiente.

---

# 62. Perché non apro una task di current-state overlay

Il file non pretende
di essere:

```text
Todo corrente.
```

È:

```text
Secondo audit
Punto 4.
```

Gli stati owner correnti
vivono già nella Todo
e nelle schede IMPL.

Nessun duplicato necessario.

---

# 63. Perché non serve split

Il file ha:

```text
809 righe
```

ma tutta la materia
forma una catena tecnica unica:

```text
canonical documents
→ journal
→ recovery
→ integrity
→ readers
→ writer authority.
```

Separare artificialmente
history da recovery
rischierebbe di rompere
proprio le relazioni cross-documento
che il Punto 4 vuole analizzare.

---

# 64. Le sottosezioni sono già una modularizzazione interna sufficiente

Il documento distingue:

```text
STORAGE-001…012
SECURITY-006
Source Identity store
IMPL summaries
tests
decisions
order.
```

La navigazione per heading
è sufficiente
per questo livello.

---

# 65. Non creare una cartella child solo per ridurre la lunghezza

Una possibile divisione:

```text
history/timeline
journal/recovery
security/readers
```

creerebbe dipendenze circolari
perché:

```text
STORAGE-001
STORAGE-002
STORAGE-005
STORAGE-006
```

attraversano più gruppi.

Non raccomandata.

---

# 66. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Motivo:

```text
una baseline
un audit point
una responsibility chain
nessun context boundary
sufficientemente autonomo
da giustificare child owner.
```

---

# 67. Aspetti corretti da preservare integralmente

```text
1. baseline d797d0ee;
2. analisi statica dichiarata;
3. suite non rieseguite dichiarato;
4. atomic rename bounded;
5. process atomicity != power-loss durability;
6. journal-before-target ordering;
7. recovery before listen;
8. writer authority before recovery;
9. conservative journal schema;
10. no_known_partial != document health;
11. event-scoped persistence authority target;
12. cross-source lost update scenario;
13. verify completed targets;
14. canonical document identity;
15. payload digest;
16. invalid journal → integrity_unknown target;
17. readers/writers separation;
18. eventId/root confinement;
19. aggregate shared-history integrity;
20. committed-only cross-source state;
21. structured read results;
22. duplicate event ambiguity;
23. recovery attempt policy;
24. baseline before storage format change;
25. no immediate fsync;
26. raw writer inventory before removal;
27. Source Identity confirmation store separate;
28. IMPL-019…021 summaries only;
29. TEST-019…030 mapped to findings;
30. no automatic next task.
```

---

# 68. Current code evidence to preserve in future corrections

## Recovery verification

Current:

```text
verifyDocumentTargetDefault
→ read
→ JSON.parse
→ ok
```

Expected future:

```text
schema
identity
revision
headCommit
digest.
```

---

# 69. Current code evidence — partial completed target

Current:

```text
historyCompleted = true
→ repair treats history as written
→ no target read in that branch.
```

Expected future:

```text
completed:true
→ independently verify
→ reopen if invalid.
```

---

# 70. Current code evidence — invalid journal authority

Current:

```text
invalidEntries
→ summary/outcomes
```

Expected future:

```text
global storage authority
→ integrity_unknown
→ writersAllowed:false.
```

---

# 71. Current code evidence — shared history integrity

Current route:

```text
getIntegrity(eventId, 'sofa')
```

Expected future:

```text
aggregate event integrity
Sofa + Betfair + document health.
```

---

# 72. Current code evidence — raw writer

Current facade still exports:

```text
saveHistory(...)
```

Expected future:

```text
canonical writer authority only
repair adapters explicit
raw writer internalized/removed
after inventory.
```

---

# 73. Non-finding: `loadHistory` compatibility façade

Il fatto che esista
una facade compatibility
non è di per sé errore.

Il problema è semantico
solo quando:

```text
missing
invalid
read failure
```

vengono collassati
in un modo incompatibile
con il read contract approvato.

Questa root issue
è già STORAGE-007 / STORAGE-TH-*.

---

# 74. Non-finding: Source Identity confirmation store

Non deve entrare
automaticamente nel commit journal.

La separazione è intenzionale.

---

# 75. Non-finding: shared history mantenuta

Il Punto 4
non impone subito:

```text
derived read model.
```

La decisione è:

```text
preservare shared history per ora.
```

Coerente con DEC-021.

---

# 76. Non-finding: target futuri deterministici

I nomi:

```text
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

sono una direzione futura,
non un claim
sul naming corrente.

Il testo lo chiarisce
tramite la sezione migrazione.

---

# 77. Non-finding: recovery_failed non pienamente derivato da attempts

È già:

```text
STORAGE-009
```

non una contraddizione.

---

# 78. Non-finding: full-document storage cost

È un limite da misurare,
non una bug fix obbligatoria.

Il file è corretto
a non progettare subito
un database.

---

# 79. Non-finding: no fsync

Il file non promette
durability hardware-level.

Nessun overclaim.

---

# 80. Non-finding: `COMPLETATO E APPROVATO`

Nel contesto di questo file
la formula è sufficientemente
riferita al:

```text
Secondo audit — Punto 4.
```

I finding sotto
restano esplicitamente aperti.

Non creo un task locale.

---

# 81. Owner IMPL-019 — controllo finale

```text
Classificazione:
NECESSARIA

Stato:
CONFERMATA E APPROVATA

Priorità:
critica.
```

Coerente con audit e Todo.

---

# 82. Owner IMPL-020 — controllo finale

```text
Classificazione:
NECESSARIA

Stato:
CONFERMATA E APPROVATA

Priorità:
critica.
```

Coerente.

---

# 83. Owner IMPL-021 — controllo finale

```text
Classificazione:
NECESSARIA

Stato:
CONFERMATA E APPROVATA

Priorità:
alta.
```

Coerente.

---

# 84. Nessuna delle tre deve entrare tra le IMPL concluse

Il report 050
ha identificato come concluse:

```text
IMPL-001
IMPL-004
IMPL-005
IMPL-015
IMPL-028
IMPL-032.
```

Non:

```text
019
020
021.
```

Questa Parte 3
è quindi allineata.

---

# 85. Test state — nessuna promozione senza execution

`TEST-019…030`
sono:

```text
requirements
mancanti.
```

Il report 055
non dispone di evidence
per cambiarli.

Restano aperti.

---

# 86. Live validation

Il Punto 4
non richiede una
live validation Betfair/Sofa
per dimostrare tutti
i problemi di storage.

Molti sono verificabili
offline tramite:

```text
filesystem
journal fixture
failure injection
recovery harness.
```

Questo è coerente.

---

# 87. Tuttavia offline test ≠ current PASS

Il file dice:

```text
suite non rieseguite
nel checkpoint.
```

Quindi non attribuisce
un PASS automatico
alla baseline del Punto 4.

Corretto.

---

# 88. Evidence state

Il documento separa bene:

```text
analisi statica
decisione approvata
test mancante
limite da misurare.
```

Questa tassonomia
è sufficientemente leggibile
per il suo scopo storico.

---

# 89. Non serve aggiornare ogni finding con i report successivi

Aggiungere sotto
ogni STORAGE:

```text
vedi STORAGE-TH-...
vedi JOURNAL-REC-...
```

renderebbe il documento
molto più rumoroso
e creerebbe dipendenze inverse.

La mappa/Todo
restano migliori
come current navigation.

---

# 90. Possibile pointer generale — facoltativo, non task

Durante una futura revisione
si può aggiungere una riga informativa:

```text
Per gli approfondimenti successivi
su timeline/history e journal/recovery,
consultare la Todo corrente
e i report/owner successivi.
```

Ma non è necessario
per chiudere una criticità.

Quindi:

```text
nessun Change ID.
```

---

# 91. Finding esistenti da NON duplicare

## STORAGE-TH-001…009

Possiedono:

```text
timeline/history read/discovery
e storage contract approfondito.
```

---

## JOURNAL-REC-001…010

Possiedono:

```text
journal/recovery
target verification
cleanup
repair validity
integrity behavior
approfonditi.
```

---

## TASK-RECHECK-002

Possiede:

```text
revisione current status D11/D12/D13
rispetto al ricontrollo storico.
```

Non usare il file 055
per duplicare quella overlay.

---

## METHOD-EVIDENCE-001

Possiede:

```text
dimensioni evidence
implementation/offline/live.
```

---

## PLAN-AUDIT-003

Possiede:

```text
audit point completed
vs exhaustive coverage.
```

---

# 92. Nuovi finding

```text
nessuno
```

---

# 93. Nuove task runtime

```text
0
```

---

# 94. Nuove task documentali

```text
0
```

---

# 95. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: false
```

Il documento
può restare invariato
finché gli owner tecnici
non vengono implementati
o finché una futura policy
non richiede l’aggiornamento
dei checkpoint storici.

---

# 96. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 97. Verification matrix futura quando verranno implementate IMPL-019…021

```text
[ ] event-scoped persistence authority
[ ] cross-source pending blocking
[ ] expected base revision
[ ] completed target independent verification
[ ] schema/identity/revision validation
[ ] payload digest
[ ] invalid journal → integrity_unknown
[ ] writersAllowed policy
[ ] aggregate shared-history integrity
[ ] committed-only runtime state
[ ] structured read status
[ ] duplicate event blocking
[ ] eventId canonical validation
[ ] target root confinement
[ ] recovery attempt metadata
[ ] retry escalation
[ ] manual rearm
[ ] raw writer inventory
[ ] raw writer architecture guard
[ ] TEST-019…030
```

Questa matrice
è derivata dagli owner esistenti,
non costituisce
una nuova task.

---

# 98. Ordine di lavoro da non reinterpretare

Il file conserva:

```text
IMPL-015
→ IMPL-019
→ IMPL-020
→ IMPL-021
→ tests
→ IMPL-009
→ IMPL-013
→ storage evolution.
```

Dato che:

```text
IMPL-015
→ completata
```

la dipendenza iniziale
è soddisfatta.

Ma questo non seleziona
automaticamente:

```text
IMPL-019
```

come prossima task.

La selezione resta
nel workflow corrente.

---

# 99. Decisione finale

```text
implementazioni/audit-codice/03-storage-recovery.md:

ROLE:
CORRETTO

BASELINE:
ESPLICITA

AUDIT STATICO:
ESPLICITO

SUITE NON RIESEGUITE:
ESPLICITO

STORAGE-001…012:
COERENTI CON TODO

SECURITY-006:
COERENTE

TEST-019…030:
COERENTI E ANCORA APERTI

IMPL-019:
APPROVATA, NON COMPLETATA

IMPL-020:
APPROVATA, NON COMPLETATA

IMPL-021:
APPROVATA, NON COMPLETATA

CURRENT CODE:
CONFERMA MOLTE ROOT ISSUE

AUDIT SUCCESSIVI:
AGGIUNGONO APPROFONDIMENTI
GIÀ OWNED DA STORAGE-TH/JOURNAL-REC

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

# 100. Stato audit dopo report 055

```text
Documenti Markdown totali: 72
Analizzati: 55
Da analizzare: 17
Avanzamento: 76,39%

Blocco 053–057:
[✓] 053 implementazioni/audit-codice/01-rilievi-iniziali.md
[✓] 054 implementazioni/audit-codice/02-runtime-sessioni-betfair.md
[✓] 055 implementazioni/audit-codice/03-storage-recovery.md
[ ] 056 implementazioni/audit-codice/04-evidence-market-reactions.md
[ ] 057 implementazioni/audit-codice/05-frontend-session-shell.md
```

Nuove task non ancora consolidate:

```text
053
→ 2

054
→ 2

055
→ 0

blocco 053–055
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

task complessive note provvisorie:
330
```

La mappa/JSON `continuazione-048`
non viene aggiornata
fino alla chiusura del blocco 053–057,
salvo diversa istruzione.

---

# 101. Prossimo documento

```text
056
implementazioni/audit-codice/04-evidence-market-reactions.md
```

Non analizzato in questo report.
