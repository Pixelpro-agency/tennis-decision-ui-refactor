# Report documentale — `todo-list-tennis-decision-ui.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-072
Sequenza audit: 72/72
Documento analizzato: todo-list-tennis-decision-ui.md
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
HEAD verificato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Confronto HEAD: main identico a 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 63e5982bea7ea50f5940074088a3af9210e2c863
Dimensione documento: 804 righe
Tipo: vista operativa sintetica centrale / Todo cumulativa
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
implementazioni/00-metodo-e-stati.md

implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
implementazioni/audit-documentazione/02-moduli-frontend-python.md
implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md
implementazioni/audit-documentazione/04-processo-e-materiali-storici.md

implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
implementazioni/implementazioni-proposte/02-runtime-betfair.md
implementazioni/implementazioni-proposte/03-storage-recovery.md
implementazioni/implementazioni-proposte/04-evidence-provenance.md
implementazioni/implementazioni-proposte/05-frontend-session-polling.md
implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md

docs/tennis-decision-ui/index.md
docs/tennis-decision-ui/roadmap/01-current-state.md
docs/tennis-decision-ui/operations/05-retention-and-cleanup.md
docs/validations/README.md
docs/validations/documentation-migration-finalization-2026-08-03.md

scripts/validation/README.md
```

Sono stati inoltre coordinati, senza duplicarli:

```text
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003

METHOD-EVIDENCE-001
METHOD-REG-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001

TASK-RECHECK-001
TASK-RECHECK-002

CURRENT-STATE-001
CURRENT-STATE-002
CURRENT-STATE-003

DOC-AUDIT-P12-001
DOC-AUDIT-B34-001
DOC-AUDIT-B56-001
DOC-AUDIT-PROC-001

IMPL-BASE-001
IMPL-BETFAIR-001
IMPL-STORAGE-001
IMPL-STORAGE-002
IMPL-EVIDENCE-001
IMPL-FRONTEND-001
IMPL-VALIDATION-001
IMPL-VALIDATION-002
IMPL-DOCNORM-001

VALID-RUNNER-001

WORKFLOW-002
WORKFLOW-004
WORKFLOW-005
```

GitHub non è stato modificato.

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento successivo: nessuno
```

---

# 1. Esito sintetico

```text
Ruolo Todo:
CORRETTO

Vista operativa unica:
SÌ

Baseline codice:
ANCORA COERENTE

Provenance recupero documentale:
STORICA E CHIARAMENTE ETICHETTATA

Struttura B/C:
CORRETTAMENTE PRESENTATA COME CHECKPOINT

Blocchi E/F:
CURRENT SYNTHETIC AUTHORITY

Stati IMPL principali:
SOSTANZIALMENTE COERENTI

Stati TEST:
SOSTANZIALMENTE COERENTI

Stati DOC:
NON PIÙ TUTTI CURRENT

docs/archive current source:
STALE / PATH ASSENTE

D1–D18 current overlay:
ANCORA DA RICONCILIARE

IMPL con primitive parziali:
SINTESI ANCORA TROPPO PIATTA

Verifiche finali in fondo:
CORRETTAMENTE ETICHETTATE COME RECUPERO PUBBLICATO

Prossimo passo:
CORRETTAMENTE NON AUTO-SELEZIONATO

Nuovi bug runtime:
0

Nuovi root finding:
0

Nuove task:
0

Correzioni da applicare alla Todo:
SÌ, MA GIÀ POSSEDUTE DA TASK ESISTENTI

Split:
NON necessario
```

Conclusione centrale:

```text
LA TODO NON È
UN NUOVO ROOT PROBLEM.

È UN CONSUMER CENTRALE
DI MOLTE CORREZIONI
GIÀ IDENTIFICATE.

IL DOCUMENTO DICHIARA:

“mostrare lo stato corrente”
+
“lo stato testuale in grassetto
è l’autorità sintetica”.

QUESTA REGOLA
NON È PIÙ SODDISFATTA
IN TUTTE LE RIGHE.

ESEMPI:

DOC-020
→ ancora CONFERMATO
→ path .pending_commits
  oggi corretto nei documenti correnti

DOC-023
→ ancora CONFERMATO
→ validations storiche
  oggi separate dai runbook

DOC-021
→ ancora CONFERMATO
→ owner current del refactor
  è DOC-031

DOC-018
→ ancora CONFERMATO
→ documentazione frontend
  è stata riallineata;
  il root code gap resta FRONTEND-002/IMPL-009

DOC-001/003/004/005/007/008/010/012
→ ancora CONFERMATO
→ già classificati nei report 060
  come resolved/absorbed lato documentazione.

INOLTRE:

docs/archive/
→ presentato come fonte current
→ repository current non contiene
  docs/archive/README.md
→ il cleanup ha rimosso
  le copie consolidate.

E:

D1–D18
→ richiedono ancora
  la current overlay
  di TASK-RECHECK-002.

MA NESSUNO DI QUESTI
RICHIEDE UN NUOVO ID.

LE ROOT ISSUE
SONO GIÀ POSSEDUTE DA:

DOC-AUDIT-P12-001
DOC-AUDIT-B34-001
DOC-AUDIT-B56-001
DOC-AUDIT-PROC-001
TASK-RECHECK-002
CURRENT-STATE-002
IMPL-*-001
VALID-RUNNER-001.

LA TODO DEVE ESSERE
AGGIORNATA COME
SYNTHETIC CONSUMER
NELLO STESSO CHANGE-SET
DELL'OWNER REALE.

APPLICARE UNA CORREZIONE
ALL'OWNER SENZA
AGGIORNARE LA TODO
DEVE FAR FALLIRE
IL REGISTRY CHECKER.

QUINDI:

NUOVO CHANGE ID:
NESSUNO.

QUESTA È UNA SCELTA
DI NON-DUPLICAZIONE,
NON L'ASSENZA
DI CORREZIONI NECESSARIE.
```

---

# 2. Ruolo dichiarato della Todo

Il documento dice:

```text
Questa Todo è
la vista operativa unica
della revisione.
```

Serve a:

```text
mostrare stato corrente
conservare inventari/checklist
distinguere completed/open/approved/missing
collegare ID agli owner
indicare priorità/collaudi/prossimo passo
preparare task separate.
```

Questo ruolo
è ancora appropriato.

---

# 3. Gerarchia Todo ↔ owner

La Todo dichiara:

```text
motivazioni/evidenze complete
→ implementazioni/

documentazione tecnica current
→ docs/tennis-decision-ui/.
```

Quindi la Todo
non deve duplicare
le schede complete.

Corretto.

---

# 4. Regola di stato più importante

Il documento stabilisce:

```text
Lo stato testuale in grassetto
è l'autorità sintetica.
```

Questa frase
ha conseguenze forti.

Una riga:

```text
DOC-020
→ CONFERMATO
```

non può essere letta
come semplice storico
se si trova
nel blocco current owner.

---

# 5. Checkbox ≠ implementazione

Il documento chiarisce:

```text
[x]
non equivale automaticamente
a codice implementato.
```

Questa regola
è corretta.

Per esempio:

```text
IMPL-006
[x]
APPROVATA
```

non significa:

```text
IMPLEMENTATA.
```

---

# 6. Baseline codice

Todo:

```text
SHA codice verificato:
aefc0ba5894d8fca60e5811088fede3ebbfde98a
```

Current main:

```text
4c5f43...
```

potrebbe sembrare
un mismatch.

---

# 7. Confronto aefc0ba → current main

Il confronto Git
mostra che i tre commit successivi
hanno modificato:

```text
README/documentazione
registri
Todo
docs/archive/README removal
```

e non backend/frontend/launcher/scraper.

Quindi:

```text
baseline del CODICE
aefc0ba
```

resta coerente.

Nessun finding.

---

# 8. Recovery provenance

La Todo registra:

```text
base recupero:
8f936d1

commit applicazione:
2ebe7e8

data:
2026-08-06.
```

Non dice:

```text
2ebe7e8 = current HEAD.
```

Quindi il wording
è temporalmente più corretto
della versione precedente.

---

# 9. Current HEAD non è confuso con code baseline

Il documento distingue:

```text
code SHA
recovery base
recovery application.
```

Questo è corretto.

---

# 10. CURRENT-STATE-001 resta owner della provenance più ampia

Non creare
una nuova task baseline
da questo file.

---

# 11. Blocco A — fonti operative

Elenca:

```text
root index
registry index
method
decisions
canonical docs
validations
docs/archive/.
```

Le prime sei
sono current sources valide.

---

# 12. `docs/archive/` è il punto stale

La Todo dice:

```text
[x] docs/archive/
— materiali non canonici
conservati intenzionalmente
per uso successivo.
```

Current repository:

```text
docs/archive/README.md
→ assente.
```

Search current:

```text
docs/archive
→ nessun file trovato.
```

---

# 13. Il cleanup dell'archive è stato intenzionale

La validation di migrazione
documenta:

```text
materiali inizialmente conservati
→ riletti
→ contenuto utile consolidato
→ copie separate rimosse.
```

Commit:

```text
3de08ca...
docs: remove consolidated legacy archive.
```

Quindi l'assenza
non è un errore
di Git.

---

# 14. Anche il compare Git conferma la rimozione

Nel range:

```text
aefc0ba → current main
```

compare:

```text
docs/archive/README.md
status: removed.
```

---

# 15. Todo A1 deve quindi essere riallineata

Non deve più presentare
una directory assente
come current source.

Possibili forme:

```text
archive storico consolidato e rimosso
→ provenance in Git + validation

oppure
archive ricreato soltanto
se l'utente decide
nuovi materiali da preservare.
```

La scelta corrente
è già documentata
dal cleanup.

---

# 16. Non nuovo finding — CURRENT-STATE-002

Questo problema
è già stato registrato
come stale archive path.

Quindi:

```text
Todo
→ affected consumer
di CURRENT-STATE-002
```

non nuovo owner.

---

# 17. Non nuovo finding — DOC-AUDIT-PROC-001

Il report 063
ha già aperto
la reconciliation:

```text
archive temporaneo
→ consolidamento
→ cleanup
```

La Todo
deve ricevere
lo stesso current outcome.

---

# 18. A4 ripete la policy archive

Todo:

```text
Materiali storici/futuri
dichiarati utili
conservati in docs/archive/.
```

Come policy astratta
può essere valida.

Come descrizione
dello stato current
è ambigua,
perché l'archive current
è assente.

---

# 19. Correzione A4

Distinguere:

```text
POLICY:
materiali futuri dichiarati utili
possono essere conservati
in archive

CURRENT:
le copie archive del ciclo
di migrazione sono state
consolidate e rimosse.
```

---

# 20. Blocco H ripete lo stesso stale current claim

Todo:

```text
docs/archive
non viene eliminato automaticamente.
```

La policy
non è sbagliata.

Ma deve essere
coerente con:

```text
cleanup intenzionale
già avvenuto.
```

---

# 21. Non serve un terzo finding archive

A1/A4/H
sono tre consumer
della stessa root issue.

---

# 22. Blocco A2 — inventario

Stati:

```text
A1…A7 completed
A8…A13 open
A14 completed
A15 partial
A16 partial.
```

Questa è
una struttura credibile.

---

# 23. A14 — 40 documenti canonici

La riga è riferita
allo SHA base
del recupero documentale.

Non viene presentata
come conteggio
dei 72 Markdown
dell'audit corrente.

Quindi:

```text
40 canonical docs
≠
72 audit inventory docs.
```

Nessuna contraddizione.

---

# 24. Blocco A3 — 4/7/7 moduli

Current repository
ha:

```text
4 audit-documentazione
7 audit-codice
7 implementazioni-proposte.
```

Le nuove divisioni proposte
nei report 064 e 069
non sono ancora applicate.

Quindi la Todo
descrive correttamente
la struttura current.

---

# 25. Non anticipare split non applicati

Non modificare A3
per dire:

```text
più di 7 moduli
```

finché:

```text
IMPL-BASE-002
IMPL-VALIDATION-002
```

non vengono eseguite.

---

# 26. Blocco B0 — regole permanenti

Le regole:

```text
.md only
no new .mdx
canonical=current
future in registries
small migration batches
Git history
```

sono coerenti.

---

# 27. Regola archive in B0

Anche qui:

```text
docs/archive conserva...
```

va letta
come policy,
non come prova
dell'esistenza current.

---

# 28. Blocco B è correttamente etichettato come checkpoint

Il file introduce:

```text
Le checklist B1–B6
descrivono il checkpoint
dell'audit documentale.

Gli stati owner correnti
restano nei Blocchi E/F.
```

Questa è
una boundary corretta.

---

# 29. Quindi B1–B6 possono conservare finding poi risolti

Esempio:

```text
B5 Retention
→ DOC-020
```

può restare,
perché è:

```text
evidence storica
del checkpoint.
```

Non va riscritta
come current.

---

# 30. Blocco C è anch'esso correttamente storico

Header:

```text
C1–C13 conservano
stati osservati
durante l'audit.
```

Quindi:

```text
suite non eseguite
tracking letto
...
```

sono checkpoint.

Corretto.

---

# 31. Il problema non è nei Blocchi B/C

Il problema
è nei Blocchi current:

```text
D
E
F
```

quando non incorporano
lifecycle successivo.

---

# 32. Blocco D — D1–D18

Todo presenta:

```text
CONFERMATA
CONFERMATA CON LIMITI
DA RIAPRIRE.
```

---

# 33. D1–D18 sono già oggetto di reconciliation separata

Report 048:

```text
TASK-RECHECK-001
TASK-RECHECK-002.
```

Il secondo
possiede precisamente:

```text
historical D1–D18 snapshot
vs current supersession/reconciliation.
```

---

# 34. Non aprire TODO-D1D18

Sarebbe duplicazione.

La Todo
è semplicemente
il synthetic consumer
di TASK-RECHECK-002.

---

# 35. Blocco E — documentazione

Qui compare
il drift più evidente.

Il blocco è:

```text
Rilievi registrati
```

e non è marcato
come historical-only.

Con la regola:

```text
bold state = current authority
```

le righe devono essere current.

---

# 36. DOC-001…013 — current reconciliation già determinata

Report 060
ha stabilito:

```text
RESOLVED / ABSORBED:
DOC-001
DOC-003
DOC-004
DOC-005
DOC-007
DOC-008
DOC-010
DOC-012

DOCUMENTATION RESOLVED;
ROOT CODE OPEN:
DOC-013 → CODE-002

STILL ACTIVE:
DOC-002
DOC-006
DOC-009
DOC-011
```

---

# 37. Todo invece mantiene tutti 001…013 come `CONFERMATO`

Quindi la vista sintetica
non rappresenta
il lifecycle attuale.

---

# 38. Root owner già esistente

Questa reconciliation
è posseduta da:

```text
DOC-AUDIT-P12-001.
```

Nessun nuovo Change ID.

---

# 39. DOC-014…019 — current reconciliation già determinata

Report 061:

```text
DOC-014
→ confirmed

DOC-015
→ confirmed / partially improved

DOC-016
→ confirmed / partially improved

DOC-017
→ confirmed

DOC-018
→ documentation resolved;
  FRONTEND-002 remains open

DOC-019
→ confirmed.
```

---

# 40. Todo conserva DOC-018 come `CONFERMATO`

Questo perde
la distinzione:

```text
document flaw resolved
vs code gap still open.
```

---

# 41. Root owner già esistente

```text
DOC-AUDIT-B34-001.
```

La Todo
deve essere aggiornata
nello stesso change-set.

---

# 42. DOC-020 — Todo current stale

Todo:

```text
DOC-020
Percorso .pending_commits errato
→ CONFERMATO.
```

---

# 43. Current retention doc usa il path corretto

Current:

```text
backend/match_history/.pending_commits/
```

e lo classifica
correttamente
come journal,
non cache.

Quindi il problema
documentale originario
è risolto.

---

# 44. Todo deve cessare di presentare DOC-020 come current open discrepancy

Il checkpoint storico
resta nei report.

La synthetic row
deve riflettere
la risoluzione.

---

# 45. DOC-021 — owner supersession

Todo:

```text
DOC-021
Validation/rollback e runbook troppo estesi
→ CONFERMATO.
```

---

# 46. Current owner del root refactor è DOC-031

Report 062:

```text
DOC-021
→ historical precursor
→ root issue still real
→ superseded/absorbed by DOC-031

DOC-031
→ current refactor owner.
```

---

# 47. Tenere entrambi come `CONFERMATO` senza relation è ambiguo

Può far sembrare
che esistano
due task concorrenti
sullo stesso root issue.

---

# 48. Todo deve rappresentare supersession

Non necessariamente
con una nuova vocabulary.

Può usare
una nota sintetica:

```text
historical precursor;
current owner DOC-031.
```

La forma finale
deve rispettare
METHOD-SCHEMA-001.

---

# 49. DOC-022 — ancora open ma migliorato

Todo:

```text
CONFERMATO.
```

Root issue
resta reale.

Ma current state
è migliorato
sul frontend
e ancora troppo forte
su diagnostica.

---

# 50. Sintesi possibile

```text
CONFERMATO;
PARZIALMENTE MIGLIORATO.
```

Questo dettaglio
è già ownerizzato
da DOC-AUDIT-B56-001.

---

# 51. DOC-023 — Todo stale

Todo:

```text
Collaudi storici
mescolati ai runbook
→ CONFERMATO.
```

---

# 52. Current validations sono separate

`docs/validations/README.md`
dice:

```text
validation historical
≠ current behavior owner
≠ automatic test
≠ runbook.
```

Questa separazione
è già implementata.

---

# 53. Quindi DOC-023 è risolto lato documentazione

Todo deve rifletterlo.

---

# 54. Root owner già esistente

```text
DOC-AUDIT-B56-001.
```

Nessun nuovo task.

---

# 55. DOC-024 completed

Todo:

```text
COMPLETATO.
```

Coerente.

---

# 56. DOC-025…033

Gli stati:

```text
confirmed
correction approved
policy approved
```

sono sostanzialmente
coerenti con
i registri correnti.

Non emergono
nuove false completion.

---

# 57. Workflow states

```text
WORKFLOW-002…005
→ COMPLETATO.
```

Coerenti
con i registri.

Non riaprire.

---

# 58. Blocco E — code/runtime/frontend/storage/evidence

La maggior parte
delle righe
sono ancora correttamente:

```text
open
confirmed
approved.
```

I report 053–057
non avevano aperto
nuovi lifecycle task
per questi owner.

---

# 59. Alcuni owner hanno primitive parziali ma root issue resta open

Esempi:

```text
STORAGE-002
Evidence alignment
frontend pollers
runner result artifact.
```

La Todo non deve
per forza elencare
tutti i sotto-step
se la root issue
resta current.

---

# 60. Ma quando il sotto-step cambia il significato operativo, va annotato

Questo è già posseduto da:

```text
IMPL-STORAGE-001
IMPL-EVIDENCE-001
IMPL-FRONTEND-001
IMPL-VALIDATION-001.
```

---

# 61. TEST-003 — sintesi corretta

Todo:

```text
[x]
RUNNER IMPLEMENTATO;
MATRICE COMPLETA ANCORA APERTA.
```

È un buon esempio
di stato sintetico bounded.

Non serve
nuovo finding.

---

# 62. TEST-060…064/068/073 — completion corretta

Questi requirement
sono stati implementati
dal runner.

Todo li marca:

```text
IMPLEMENTATO E PASSATO.
```

Coerente.

---

# 63. TEST-069/070 — parzialità corretta

Todo:

```text
COPERTURA PARZIALE;
REQUIREMENT NON CHIUSO.
```

Questa è
la sintesi corretta
emersa anche
dal report 069.

---

# 64. TEST-076…079 — completed

Questi sono
gate migrazione.

Todo:

```text
COMPLETATO.
```

Non riaprire.

---

# 65. Blocco F — IMPL-001…032

Gli stati globali
sono sostanzialmente corretti.

---

# 66. IMPL completate

```text
IMPL-001
IMPL-004
IMPL-005
IMPL-015
IMPL-028
IMPL-032
```

sono presentate
come implemented/completed.

Coerente.

---

# 67. IMPL future

```text
IMPL-010
IMPL-014.
```

Sono marcate:

```text
FUTURO.
```

Coerente.

---

# 68. IMPL approvate open

```text
006
016
017
018
019
020
021
022
023
024
025
026
027
029
030
031.
```

Todo
non le presenta
come completate.

Corretto.

---

# 69. IMPL necessarie/consigliate open

```text
002
003
007
008
009
011
012
013.
```

Stati globali
coerenti.

---

# 70. Però alcuni owner open hanno implementation primitives già presenti

Report recenti:

```text
IMPL-020/021
→ Task 6 primitives

IMPL-022/023/024
→ Evidence primitives

IMPL-025/026/027
→ frontend primitives

IMPL-031
→ v1 result artifact.
```

---

# 71. Todo non deve chiamarli `COMPLETATI`

Ma può migliorare
la sintesi con:

```text
APPROVATA;
NON COMPLETATA;
PRIMITIVE PARZIALI PRESENTI.
```

solo quando
l'owner task
viene aggiornato.

---

# 72. Root owner già esistenti

```text
IMPL-STORAGE-001
IMPL-EVIDENCE-001
IMPL-FRONTEND-001
IMPL-VALIDATION-001.
```

Non aprire
una Todo task parallela.

---

# 73. IMPL-028 completion vs VALID-RUNNER-001

Report 071
ha trovato
un follow-up hardening
del live/offline gate.

Questo non rende falsa
la completion storica
di IMPL-028.

---

# 74. Todo non contiene VALID-RUNNER-001

Questo non è
un difetto current
del repository.

Perché:

```text
VALID-RUNNER-001
```

è un finding
dell'audit 071
non ancora applicato
ai registri repository.

---

# 75. Regola per i nuovi finding 063–071

Non inserire
automaticamente nella Todo
gli ID prodotti
dall'audit esterno.

Prima:

```text
consolidamento audit
→ decisione/task registry
→ applicazione owner
→ synthetic Todo update.
```

---

# 76. Evitare contaminazione audit ↔ repository

La Todo repository
non deve fingere
di contenere
modifiche non ancora applicate.

Corretto
che i nuovi ID
non siano già presenti.

---

# 77. Blocco G — workflow

Ruoli,
tre tentativi,
report,
no PASS senza evidence,
no secrets.

Coerente
con il workflow corrente.

---

# 78. Blocco H — modularizzazione

Stati current:

```text
4 audit-doc
7 audit-code
7 implementations.
```

Corretti.

---

# 79. Nuovi split proposti non vanno anticipati

Report:

```text
064
069
```

propongono
ulteriore modularizzazione.

Finché non applicata:

```text
Todo H
resta current.
```

---

# 80. Soglia 1.500–2.000 righe

È una guida,
non una regola assoluta.

Non c'è contraddizione
con split proposti
sotto quella soglia,
perché l'audit usa
responsibility boundary
come criterio principale.

---

# 81. Blocco I — preparazione task

È un template
di campi richiesti.

Checkbox aperte
non significano
finding mancanti.

Corretto.

---

# 82. Blocco J — stato chiusura

Todo dice:

```text
audit documentazione completato
audit codice completato
ricontrollo D1–D18 completato.
```

Questi riferiscono
al ciclo di audit
che ha prodotto
i registri correnti.

---

# 83. Non confondere con l'audit 72-file di questa conversazione

Il fatto che
il nostro audit
si chiuda ora
non rende false
le righe del Blocco J.

Sono due layer
di processo diversi.

---

# 84. Stato tecnico finale correttamente aperto

Todo mantiene:

```text
prima serie task esecutive
→ open

test mancanti
→ open

collaudi live
→ open

stato finale prodotto
→ open.
```

Coerente.

---

# 85. Verifiche fondo file

Heading:

```text
Verifiche del recupero pubblicato.
```

Questo è importante.

Non dice:

```text
current validation PASS
sul HEAD di oggi.
```

---

# 86. Quindi i numeri possono restare snapshot storici

```text
registry checker tests 18 PASS
nested 2 PASS
registry 240/214
links 72/428
validation fast 6 PASS
diff check PASS.
```

Sono provenance
del recovery published checkpoint.

---

# 87. Non promuovere questi numeri a current PASS

Nessuna correzione
necessaria al testo
se resta chiaro
il checkpoint.

---

# 88. Prossimo passo

Todo:

```text
DA SELEZIONARE.
```

Questo è coerente
con la policy:

```text
nessuna task
selezionata automaticamente.
```

---

# 89. Non scegliere una task nel report 072

Audit:

```text
classifica
non esegue
non auto-prioritizza
oltre le priorità già registrate.
```

---

# 90. Problemi effettivi della Todo

Raggruppati:

```text
A.
current DOC lifecycle stale

B.
archive current path stale

C.
D1–D18 current overlay incompleta

D.
partial implementation state
non ancora propagato
per alcuni IMPL.
```

---

# 91. Verifica dedupe A

Current DOC lifecycle:

```text
DOC-AUDIT-P12-001
DOC-AUDIT-B34-001
DOC-AUDIT-B56-001.
```

Già owned.

---

# 92. Verifica dedupe B

Archive:

```text
CURRENT-STATE-002
DOC-AUDIT-PROC-001.
```

Già owned.

---

# 93. Verifica dedupe C

D1–D18:

```text
TASK-RECHECK-002.
```

Già owned.

---

# 94. Verifica dedupe D

Partial implementations:

```text
IMPL-STORAGE-001
IMPL-EVIDENCE-001
IMPL-FRONTEND-001
IMPL-VALIDATION-001.
```

Già owned.

---

# 95. Perché non aprire `TODO-STATE-001`

Creerebbe:

```text
secondo owner
della stessa reconciliation.
```

E costringerebbe
a coordinare:

```text
owner card task
+
Todo task
```

separatamente.

Questo è
esattamente ciò
che il registry checker
dovrebbe evitare.

---

# 96. Modello corretto di applicazione

Per esempio:

```text
DOC-AUDIT-B56-001
modifica:
- owner card B5/B6
- synthetic Todo row
- eventuali current pointers

poi:
registry checker
→ PASS.
```

Non:

```text
task A modifica owner

task B, giorni dopo,
aggiorna Todo.
```

---

# 97. Todo come required consumer

Ogni task
che cambia:

```text
owner state
priority
supersession
completion
```

deve verificare
se esiste
una synthetic row Todo.

Se sì:

```text
aggiornarla nello stesso change-set.
```

---

# 98. Questo principio è già WORKFLOW-002

WORKFLOW-002:

```text
Todo ↔ registry consistency
```

è completato
come infrastruttura/regola.

Il problema current
non richiede
un nuovo workflow owner.

---

# 99. Registry checker come gate

Dopo la reconciliation:

```text
python scripts/check_registry_consistency.py
```

deve impedire
owner/Todo contradiction.

---

# 100. Caveat

Il checker
può verificare
coerenza sintattica/stato
fra owner e synthetic row.

Non può decidere
da solo:

```text
se il codice
ha realmente risolto
il finding.
```

Quella decisione
viene dai task owner.

---

# 101. METHOD-EVIDENCE-001

Resta rilevante:

```text
current claim
richiede evidence current.
```

Non duplicarlo.

---

# 102. METHOD-LIFECYCLE-001

Resta rilevante
per:

```text
historical
current
superseded
completed.
```

Non duplicarlo.

---

# 103. METHOD-SCHEMA-001

Resta rilevante
se la current reconciliation
richiede nuovi token
di stato sintetico.

Non inventare
una nuova vocabulary
nel report 072.

---

# 104. Current source issue beyond Todo

Anche altri documenti
current parlano ancora
di:

```text
docs/archive/README.md.
```

Questo conferma
che la root
non è Todo-specific.

Quindi ancora più
importante non creare
un TODO-only owner.

---

# 105. Baseline issue beyond Todo

Anche la current-state doc
usa una propria
baseline tecnica.

CURRENT-STATE-001
ha già ownerizzato
la dual-baseline provenance.

Non duplicare.

---

# 106. Acceptance per l'aggiornamento Todo dentro i task esistenti

Quando i task owner
saranno applicati:

```text
[ ] DOC-001…013 synthetic rows riconciliate
[ ] DOC-014…019 synthetic rows riconciliate
[ ] DOC-020…023 synthetic rows riconciliate
[ ] DOC-021 non appare come owner concorrente di DOC-031
[ ] D1…D18 current overlay riconciliata
[ ] docs/archive non presentato come current source se assente
[ ] archive policy distinta da archive current existence
[ ] partial implementation notes aggiunte solo dove owner le registra
[ ] completed/future IMPL non cambiate senza evidence
[ ] TEST current statuses preservati
[ ] historical B/C checkpoints non riscritti
[ ] recovery verification snapshot preservato
[ ] code baseline aefc0ba preservata finché il code tree non cambia
[ ] no external audit IDs inseriti prima del registry application
[ ] registry checker PASS
[ ] documentation links PASS
[ ] validation fast PASS
[ ] git diff --check PASS
```

---

# 107. Nessun singolo change-set 072

Questo report
non crea
una task che modifichi
tutte queste righe insieme.

La modifica
deve seguire
gli owner.

---

# 108. Priorità

La Todo
è centrale.

Quindi la sua
consistency è importante.

Ma la priorità
è ereditata
dai task owner:

```text
HIGH / MEDIUM-HIGH
a seconda del root finding.
```

Non serve
un nuovo priority token.

---

# 109. Modularizzazione — valutazione obbligatoria

Dimensione:

```text
804 righe.
```

---

# 110. Il file ha molte sezioni

```text
A
B0
B
C
D
E
F
G
H
I
J.
```

Potrebbe sembrare
un candidato split.

---

# 111. Ma il ruolo dichiarato è deliberatamente sintetico e unico

La Todo deve consentire
in una sola lettura:

```text
inventory
checkpoint
current owners
priorities
tests
implementations
workflow
closure.
```

---

# 112. I dettagli sono già modularizzati altrove

Le schede complete
vivono in:

```text
implementazioni/**.
```

Quindi dividere la Todo
creerebbe:

```text
secondo sistema
di navigazione operativa
+
più rischio di drift.
```

---

# 113. Il problema non è la dimensione

804 righe
è gestibile
per una synthetic view.

Il costo
è accettabile
per il suo scopo.

---

# 114. Split non richiesto

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 115. Miglioria interna possibile senza split

Durante le task owner
si può mantenere:

```text
B/C = checkpoint
D/E/F = current
```

con label
ancora più esplicite.

Non richiede
nuovi file.

---

# 116. Aspetti corretti da preservare

```text
1. single operational view;
2. checkbox legend;
3. bold state authority;
4. code vs docs baseline separation;
5. B/C historical boundary;
6. canonical docs vs registries distinction;
7. no automatic task selection;
8. priorities critical/high/future;
9. TEST synthetic registry;
10. IMPL synthetic registry;
11. workflow permanent rules;
12. task preparation checklist;
13. closure checklist;
14. recovery verification provenance;
15. no current PASS inferred from historical validation.
```

---

# 117. Aspetti da correggere tramite owner esistenti

```text
1. archive current source claim;
2. DOC lifecycle statuses;
3. DOC supersession;
4. D1–D18 current overlay;
5. partial implementation synthetic notes
   where they materially alter executor interpretation.
```

---

# 118. Non-finding — 72 documentation links

Il fondo registra:

```text
documentation links:
72 file
428 link
```

Questo è
un result snapshot
del recovery publication.

Non coincide necessariamente
con:

```text
72 file dell'inventario audit.
```

La coincidenza numerica
non prova identità
dei due insiemi.

Nessun finding.

---

# 119. Non-finding — 240 owner / 214 Todo rows

È uno snapshot
del checker.

Non va reinterpretato
come numero
di task tecniche aperte.

---

# 120. Non-finding — `[x] IMPL-002`

La legenda
permette:

```text
[x] decisione/classificazione
```

non solo completion.

Lo stato bold:

```text
CONSIGLIATA
```

è l'authority.

Corretto.

---

# 121. Non-finding — `[x] IMPL-006`

Stesso principio:

```text
APPROVATA
≠
IMPLEMENTATA.
```

---

# 122. Non-finding — `[x] TEST-003`

Bold:

```text
runner implemented;
matrix open.
```

Rende il boundary
sufficientemente chiaro.

---

# 123. Non-finding — `CODE-001` con `[x]`

Stato:

```text
RIMOZIONE APPROVATA
```

non afferma
che removal
sia già eseguita.

---

# 124. Non-finding — `RUNTIME-011` con `[x]`

Stessa semantica:

```text
removal approved.
```

Non false completion.

---

# 125. Non-finding — current Strategy ancora presente

Todo
non dice
che sia già rimossa.

Coerente
col Current State.

---

# 126. Non-finding — Current State baseline diversa

La roadmap
ha una propria
baseline tecnica storica.

È un issue
già ownerizzato
da CURRENT-STATE-001,
non Todo-specific.

---

# 127. Non-finding — validation fast current vs historical

Todo
non dice:

```text
validation fast PASS
sul current HEAD.
```

Dice:

```text
Verifiche del recupero pubblicato.
```

Boundary sufficiente.

---

# 128. Non-finding — `Prossimo passo: DA SELEZIONARE`

Questo è
lo stato corretto
finché l'utente
non sceglie
una task esecutiva.

---

# 129. Nuovi finding

```text
NESSUNO
```

---

# 130. Nuove task runtime

```text
0
```

---

# 131. Nuove task registry/documentazione

```text
0
```

---

# 132. Existing tasks che devono toccare la Todo

Minimo:

```text
TASK-RECHECK-002

CURRENT-STATE-002

DOC-AUDIT-P12-001
DOC-AUDIT-B34-001
DOC-AUDIT-B56-001
DOC-AUDIT-PROC-001

IMPL-STORAGE-001
IMPL-EVIDENCE-001
IMPL-FRONTEND-001
IMPL-VALIDATION-001
```

A seconda
dell'esito finale
delle modifiche owner.

---

# 133. Existing infrastructure owner

```text
WORKFLOW-002
METHOD-REG-001
```

devono garantire
la consistency
dopo gli aggiornamenti.

---

# 134. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

Ma:

```text
targeted_revision
→ distribuita nei task owner
→ non nuovo task 072.
```

---

# 135. Decisione finale

```text
todo-list-tennis-decision-ui.md:

ROLE:
VISTA OPERATIVA SINTETICA CENTRALE

DIMENSIONE:
804 RIGHE

STRUTTURA:
VALIDA

BASELINE CODICE:
VALIDA

RECOVERY PROVENANCE:
VALIDA

CHECKPOINT B/C:
BOUNDARY CORRETTO

CURRENT DOC STATES:
PARZIALMENTE STALE

ARCHIVE CURRENT SOURCE:
STALE

D1-D18:
CURRENT OVERLAY GIÀ OWNERIZZATA

IMPL STATES:
GLOBALMENTE COERENTI

TEST STATES:
GLOBALMENTE COERENTI

NEW RUNTIME BUG:
0

NEW ROOT FINDING:
0

NEW CHANGE ID:
NESSUNO

MOTIVO:
TUTTI I PROBLEMI
SONO GIÀ POSSEDUTI
DA TASK ESISTENTI

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ,
COME CONSUMER
DEI TASK OWNER

MODULARIZZAZIONE:
NO
```

---

# 136. Stato audit dopo report 072

```text
Documenti Markdown totali: 72
Analizzati: 72
Da analizzare: 0
Avanzamento: 100,00%
```

Inventario completato:

```text
[✓] 068 implementazioni/implementazioni-proposte/05-frontend-session-polling.md
[✓] 069 implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
[✓] 070 implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md
[✓] 071 scripts/validation/README.md
[✓] 072 todo-list-tennis-decision-ui.md
```

---

# 137. Contatori task

Ultimo consolidamento richiesto:

```text
fino al report 067:
345
```

Dopo:

```text
068 → +1
069 → +2
070 → +1
071 → +1
072 → +0
```

Totale provvisorio:

```text
350
```

---

# 138. Change ID non ancora consolidati dopo report 067

```text
IMPL-FRONTEND-001
IMPL-VALIDATION-001
IMPL-VALIDATION-002
IMPL-DOCNORM-001
VALID-RUNNER-001
```

Report 072:

```text
nessun nuovo Change ID.
```

---

# 139. Audit application tasks

```text
completed:
0
```

Questo audit
ha costruito:

```text
backlog
evidence
ownership
modularization review.
```

Non ha applicato
le correzioni
al repository.

---

# 140. Stato mappa / JSON

```text
mappa Markdown
→ NON MODIFICATA

ledger JSON
→ NON MODIFICATO
```

L'ultimo consolidamento richiesto
resta:

```text
fino al report 067.
```

---

# 141. Audit Markdown — completato

```text
72/72
100,00%
```

Non esiste
un documento 073
nell'inventario corrente.

---

# 142. Prossima fase — non selezionata automaticamente

Il report
non sceglie:

```text
quale task eseguire per prima
quale batch applicare
quale executor usare.
```

Questa decisione
resta separata
dall'audit.

---

# 143. Stop operativo

```text
report 072:
COMPLETATO

nuovi Change ID:
0

audit Markdown:
72/72 COMPLETO

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento successivo:
NESSUNO
```
