# Report documentale — `implementazioni/99-decisioni-utente.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-051
Sequenza audit: 51/72
Documento analizzato: implementazioni/99-decisioni-utente.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 2c0d9a630fca949609ea9702b4865f1b6ca4825d
Dimensione documento: 700 righe
Perimetro: DEC-001…DEC-026
Tipo: registro delle decisioni strutturali dell’utente
Stato report: completato
```

## Fonti confrontate

```text
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
implementazioni/00-metodo-e-stati.md
implementazioni/04-task-completate.md
implementazioni/05-audit-docs-planning.md
implementazioni/06-implementazioni-proposte.md

implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
implementazioni/implementazioni-proposte/02-runtime-betfair.md
implementazioni/implementazioni-proposte/03-storage-recovery.md
implementazioni/implementazioni-proposte/04-evidence-provenance.md
implementazioni/implementazioni-proposte/05-frontend-session-polling.md
implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md

docs/validations/README.md
```

Cronologia Git verificata:

```text
8f936d1a3686b775e967e375576f52f19da461a5
→ precedente stato dei registri

2ebe7e8ad0935bf0195679452d2e54e1de4d63dc
→ introduce la policy corrente di preservazione di docs/archive/

4c5f43b007149f3210c27d7565357a447a3a6ef4
→ HEAD corrente
```

Il confronto `8f936d1 → 2ebe7e8` mostra modifiche a:

```text
README.md
docs/tennis-decision-ui/index.md
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
```

ma non a:

```text
implementazioni/99-decisioni-utente.md
```

GitHub non è stato modificato.

---

# Esito sintetico

```text
Ruolo come decision authority:                   BUONO
Continuità DEC-001…026:                          COMPLETA
ID duplicati:                                    NESSUNO rilevato
Approval vs implementation:                      GENERALMENTE CORRETTO
Decisioni future/rinviate:                       DISTINTE
Supersession DEC-015 → DEC-026:                  CORRETTA
Confini/fuori scope DEC recenti:                 MOLTO BUONI
Relazioni DEC → IMPL:                            BUONE
Relazioni DEC → TEST:                            BUONE
No-strategy/no-signal/no-causality:              COERENTE
Git sotto controllo utente:                      COERENTE

Policy archive corrente vs DEC-026:              DIVERGENTE
Owner già esistente:                             ROOT-REG-001
Nuovo finding archive:                           NO

Status DEC eterogenei:                           SÌ
Owner già esistente:                             METHOD-SCHEMA-001
Nuovo finding schema:                            NO

Nuovi finding report 051:                        0
Nuove task runtime:                              0
Nuove task documentali:                          0
Riscrittura completa:                            NO
Modularizzazione ulteriore:                      NO
Nuovi file proposti:                             nessuno
```

---

# 1. Ruolo del registro

Il documento dichiara di conservare soltanto decisioni che influenzano più aree,
task o documenti.

La responsabilità è corretta:

```text
decision log dell’utente
→ scelta
→ confini
→ eventuale supersession
```

Non deve diventare:

```text
Todo
implementation ledger
validation ledger
changelog Git
```

---

# 2. Continuità degli ID

Il documento contiene:

```text
DEC-001
...
DEC-026
```

senza buchi nella numerazione.

Non risultano owner DEC duplicati.

---

# 3. Approval e implementation sono generalmente separate correttamente

Esempi positivi:

```text
DEC-008
→ Rimozione Strategy approvata

Todo:
CODE-001
→ rimozione approvata
```

```text
DEC-020
→ hardening Betfair approvato

Todo:
RUNTIME/DATA/CODE correlati
→ ancora aperti
```

```text
DEC-024
→ sistema di validazione approvato

Todo:
IMPL-029…031
→ ancora approvate, non completate
```

Quindi:

```text
decision approved
≠
implementation completed
```

resta visibile.

---

# 4. Non aggiornare le DEC applicate trasformandole in implementation ledger

Per esempio:

```text
DEC-018
→ un solo backend writer
→ Stato: approvata
```

può restare tale anche se:

```text
IMPL-015
→ completata
```

Il decision log registra la scelta;
Todo e owner registrano lo stato di esecuzione.

---

# 5. DEC-001 — Registro modulare

Coerente con la struttura corrente:

```text
Todo sintetica
+
registri tematici in implementazioni/
```

Nessun finding.

---

# 6. DEC-002 — Audit prima delle modifiche

Sequenza:

```text
documentazione e codice
→ classificazione
→ decisioni
→ task esecutive
```

Coerente con il workflow dell’audit.

Nessuna autorizzazione automatica alle modifiche.

---

# 7. DEC-003 — Git sotto controllo dell’utente

La decisione stabilisce:

```text
commit e push
→ materialmente eseguiti dall’utente
→ dopo revisione
```

Coerente con il workflow permanente.

---

# 8. DEC-004 e DEC-007 — Markdown

Regole:

```text
nuovi documenti: .md
nessun nuovo .mdx
nessun export const meta
nessun JSX/MDX
nessun frontmatter predefinito
```

Sono compatibili con la migrazione conclusa tramite `IMPL-032`.

Non serve cambiare lo stato DEC da `approvata` a `completata`.

---

# 9. DEC-005 — Planning come fonte separata

Stato corrente:

```text
approvata ed eseguita sui materiali accessibili
```

Qui vengono mescolate:

```text
decision state
+
application state
```

La cosa è reale ma non genera un nuovo finding:
rientra in `METHOD-SCHEMA-001`.

---

# 10. DEC-006 — Consegna con file completi

Regola coerente con il workflow:

```text
file completi / ZIP
oppure
patch / script / comandi
quando più adatti
```

Nessun problema.

---

# 11. DEC-008 — Rimozione Strategy

Decisione:

```text
rimuovere tre card Strategy
preservare Market Reactions
Field → Market
Market → Field
Evidence
Source Identity
```

La decisione non dice che la rimozione sia già completata.

Corretto.

---

# 12. DEC-009 — Rimozione debug-last

Stato:

```text
approvata come decisione tecnica
```

Todo:

```text
CODE-003
→ RIMOZIONE APPROVATA
```

Nessun overclaim.

---

# 13. DEC-010 — selectionId

Confine ben definito:

```text
selectionId obbligatorio
per confrontare lo stesso runner
nel ramo Field → Market
```

e non modifica:

```text
Source Identity
Start
pending/mismatch/recording
```

Buona separazione delle responsabilità.

---

# 14. DEC-011 — Una sola authority Source Identity

Approva:

```text
useSourceIdentityGateUi
→ unica authority globale frontend
```

Il cleanup legacy resta distinto.

Corretto.

---

# 15. DEC-012 — Visibilità persistence

Approva:

```text
stati locali
+
indicatore sidebar
+
modale globale
```

Non dichiara falsamente che il wiring frontend corrente sia completo.

Corretto.

---

# 16. DEC-013 — Collaudi separati

Decisione:

```text
collaudi approfonditi
→ separati dagli owner
→ docs/validations/
```

È ancora coerente con:

```text
IMPL-004
→ completata

docs/validations/
→ presente
→ non owner tecnico
```

Questo supporta il report 050 (`IMPL-IDX-001`), ma non genera una nuova task qui.

---

# 17. DEC-014 — Cleanup offline robusto

Stato:

```text
approvata come direzione tecnica
```

Vincoli:

```text
authority/lock project-owned
manifest e porte effettive
identificazione positiva
fail-closed
recheck metadata
nessun kill-by-port
```

Stato prudente e corretto.

---

# 18. DEC-015 — Supersession esplicita corretta

Stato:

```text
applicata durante l’audit iniziale;
superata da DEC-026 per la pulizia finale
```

Questo è il pattern migliore nel file per rappresentare una decisione storicamente valida
ma non più corrente.

Da preservare.

---

# 19. Non cancellare DEC-015

La decisione resta utile per sapere:

```text
quale perimetro era escluso
nell’audit iniziale
```

La supersession preserva la storia senza trasformarla in current policy.

---

# 20. DEC-016 — Quattro ruoli

Coerente con la Todo:

```text
Chat Analisi
Chat Esecutore
Desktop Esecutore
Desktop Collaudatore
```

Nessun finding.

---

# 21. DEC-017 — UI minore e responsive

Stato:

```text
rinviata
```

Todo mantiene UI minore e responsive come task separate.

Corretto.

---

# 22. DEC-018 — Un solo backend writer

Approva:

```text
un solo backend writer per repository
writer authority backend-owned
acquisizione prima di recovery/listen
secondo backend bloccato
```

e mantiene distinto il lock launcher.

Coerente con `IMPL-015`.

---

# 23. DEC-019 — Session authority end-to-end

Contiene un contratto ampio ma bounded:

```text
trackingSessionId
commandId
eventId
Start invalidation
Stop/mismatch cleanup
poller guards
Source Identity stale
frozen state dopo Stop
```

La Todo mantiene i finding runtime/frontend ancora aperti.

Quindi la DEC approva il target senza fingere che sia già implementato.

---

# 24. DEC-020 — Hardening Betfair

Approva:

```text
rimozione /odds
IMPL-016
IMPL-017
IMPL-018
validatore unico
Graph parity
CDP session-owned
acquisition provenance
network capture bounded
no synthetic runner volume
```

La Todo conserva i relativi finding aperti.

Corretto.

---

# 25. DEC-020 e volume runner

La decisione dice:

```text
marketTotalMatched / runnerCount
→ da eliminare

missing runner volume
→ null/unavailable
→ nessuna stima
```

Il report 048 ha verificato che il codice corrente contiene ancora la stima sintetica.

Questo NON invalida la DEC:

```text
decision approved
→ implementation still open
```

---

# 26. Non riscrivere DEC-020 per farla combaciare al codice corrente

Sarebbe scorretto.

La DEC è il target approvato.

È la documentazione canonica che non deve presentare il target come già implementato.

---

# 27. DEC-021 — Storage e recovery

Approva:

```text
event persistence authority
schema/revision/digest
integrity_unknown
aggregate integrity
read status distinti
ambiguous_storage
recovery attempts
```

Todo conserva le issue Storage aperte.

Decisione e implementation state restano separati correttamente.

---

# 28. DEC-021 conserva la shared history

Scelta bounded:

```text
shared history
→ preservata per ora
```

Non autorizza immediatamente:

```text
DB embedded
NDJSON
segmentazione
read model derivato
```

Da preservare.

---

# 29. DEC-022 — Evidence / Market Reactions

Confini forti:

```text
nessuna strategia
nessun segnale operativo
nessuna fair odds
nessun suggerimento di trade
nessuna intenzione attribuita ai trader
nessuna causalità dichiarata
```

Mantiene:

```text
causalityClaimed:false
interpretation: temporal_proximity_only
```

Coerente con la filosofia del progetto.

---

# 30. DEC-022 e threshold

Le soglie Significant Flow restano:

```text
provvisorie
versionate
non calibrate
non operative
```

Quindi non diventano segnali.

Corretto.

---

# 31. DEC-023 — Frontend session-scoped

Approva:

```text
session authority
polling scoped
Stop frozen
partial cleanup
persistence UI
Source Identity context
Market Reactions VM
preflight fingerprint
Strategy removal
```

e dichiara esplicitamente fuori scope:

```text
recovery client-side
timeline writes frontend
Evidence calculation browser
responsive dentro session task
```

Molto buona come decision card.

---

# 32. DEC-024 — Validation, fixture e baseline

Approva:

```text
manifest
child process
sandbox
Vitest/jsdom/RTL
profili separati
result artifact
no CI prematura
no coverage inventata
```

e soprattutto distingue:

```text
planned
implemented
executed
passed
failed
blocked
live_observed
```

Questo deve essere consumato da `METHOD-EVIDENCE-001`.

Nessuna nuova task.

---

# 33. DEC-024 non overclaim

`IMPL-029…031` restano approvate ma non completate.

Il fatto che `DEC-024` sia:

```text
approvata integralmente
```

significa che è approvato il piano,
non che tutte le strutture siano già implementate.

---

# 34. DEC-025 — Documentazione corrente

Principio corretto:

```text
documentazione canonica
→ solo comportamento realmente presente

decisione approvata non implementata
→ resta nei registri

futuro
→ non current canonical docs
```

Da preservare integralmente.

---

# 35. DEC-025 consente già materiale non canonico utile

Punto 4:

```text
contenuti futuri o storici utili
→ possono essere archiviati
  come non canonici
  con stato esplicito
```

Questa parte è compatibile con la policy archive successiva.

---

# 36. DEC-026 — Cleanup storico

Stato:

```text
approvata integralmente
```

Regole storiche:

```text
non conservare duplicati già consolidati
leggere prima di rimuovere
trasferire contenuto unico
docs/archive/README.md come provenance breve
validations utili in docs/validations/
IMPL-015 prossimo passo dopo cleanup
```

Al checkpoint del cleanup questa decisione è stata realmente applicata.

---

# 37. Il next step IMPL-015 in DEC-026 è storico

Oggi:

```text
IMPL-015
→ completata

next step
→ DA SELEZIONARE
```

Non va però riscritta DEC-026 con il next step di oggi.

La frase appartiene al checkpoint storico della decisione.

---

# 38. Divergenza reale: DEC-026 vs policy archive corrente

Il commit:

```text
2ebe7e8
```

introduce nei consumer correnti:

```text
docs/archive/
→ materiali storici/futuri non canonici
  conservati intenzionalmente

→ non owner tecnico
→ non prova implementazione
→ non eliminato automaticamente
  da pulizie generiche
```

Il decision log non viene aggiornato nello stesso commit.

---

# 39. Evidenza Git

Compare:

```text
8f936d1
→
2ebe7e8
```

modifica:

```text
README.md
docs/tennis-decision-ui/index.md
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
```

ma non:

```text
implementazioni/99-decisioni-utente.md
```

Quindi la current policy archive non possiede ancora una decisione superseding nel log DEC.

---

# 40. Nessun nuovo Change ID: esiste già ROOT-REG-001

Questo problema è già posseduto da:

```text
ROOT-REG-001
```

che richiede:

```text
registrare una decisione superseding
nel decision log corrente

preservare DEC-026 come storia

allineare metodo/root/Todo

non cancellare archive
non ricreare archive README
non spostare file
non eseguire cleanup
```

Non creare un owner parallelo.

---

# 41. Correzione corretta tramite ROOT-REG-001

La nuova decisione dovrà dire in sostanza:

```text
DEC-026 resta valida come record
del cleanup delle fonti allora consolidate.

La policy corrente consente
di preservare in docs/archive/
materiali storici o futuri non canonici
quando dichiarati utili.

docs/archive/
non è owner tecnico,
non prova implementazione,
non viene eliminato automaticamente
da cleanup generici.
```

---

# 42. Non riscrivere retroattivamente DEC-026

Da preservare:

```text
cleanup storico realmente eseguito
read-before-delete
no perdita contenuto unico
validation evidence separata
no destructive generic scan
```

Da supersedere soltanto:

```text
qualsiasi lettura per cui
docs/archive debba restare permanentemente
ridotto a una sola mappa/provenance
```

---

# 43. Non ricreare docs/archive/README.md

Il path è storico.

La policy corrente non richiede di ripristinarlo.

---

# 44. Gli status DEC sono eterogenei

Nel file compaiono:

```text
approvata
approvata integralmente
approvata come decisione tecnica
approvata come direzione tecnica
approvata ed eseguita
rinviata
applicata ... superata da ...
```

Questa eterogeneità è reale.

---

# 45. Nessun nuovo finding: METHOD-SCHEMA-001 è già owner

`METHOD-SCHEMA-001` deve definire campi minimi e type-specific anche per DEC.

Una direzione possibile:

```text
DecisionStatus:
approved | deferred | superseded

ApplicationState:
not_started | partial | applied | not_applicable

Supersedes:
DEC-xxx | none

SupersededBy:
DEC-xxx | none

RecordedAt:
data o non registrato

DecisionSource:
utente / riferimento, solo se noto
```

Questa è una proposta interna alla task già esistente, non un nuovo Change ID.

---

# 46. Non inventare provenance retroattiva

Per le decisioni storiche:

```text
dato non noto
→ non registrato
```

Non derivare automaticamente una data della decisione dalla data del commit.

---

# 47. Commit time ≠ decision time

Il commit può essere successivo alla conversazione o alla scelta.

Quindi:

```text
recorded in Git
```

e:

```text
decided by user
```

devono restare concetti separati.

---

# 48. Non trasformare il decision log in validation ledger

Le DEC non devono contenere:

```text
tutti i test eseguiti
tutti i PASS
tutti gli artifact
```

Devono contenere:

```text
scelta
confine
supersession
```

Gli esiti vivono negli owner e nelle validations.

---

# 49. Non trasformare il decision log in changelog Git

La cronologia tecnica resta in Git.

Il file deve rispondere:

```text
cosa è stato deciso?
quale decisione è effettiva?
quale è superseded?
quali confini ha?
```

---

# 50. Le DEC-019…025 sono un modello positivo

Struttura ricorrente:

```text
stato
regole numerate
confini
strutture
relazioni
ordine
```

Questa forma riduce lo scope creep.

Da preservare.

---

# 51. Non uniformare retroattivamente DEC-001…026 per estetica

Il nuovo schema deve essere applicato:

```text
alle nuove DEC
o
a DEC sostanzialmente modificate
```

Non serve un mass rewrite delle 26 decisioni storiche.

---

# 52. Non-finding importanti

Non è un problema che:

```text
DEC-018 = approvata
```

mentre:

```text
IMPL-015 = completata
```

Decision log ≠ implementation ledger.

---

Non è un problema che:

```text
DEC-024 = approvata integralmente
```

mentre:

```text
IMPL-029…031 = aperte
```

È approvato il progetto della soluzione, non dichiarata la sua esecuzione.

---

Non è un problema che:

```text
DEC-026
→ IMPL-015 come next step
```

perché è un ordine storico.

---

Non è un problema che:

```text
DEC-015
```

contenga un vecchio perimetro:
è esplicitamente superseded.

---

# 53. Finding esistenti da NON duplicare

## ROOT-REG-001

Possiede:

```text
policy archive corrente
+
decision authority superseding.
```

---

## METHOD-SCHEMA-001

Possiede:

```text
schema type-specific DEC
e separazione decision/application status.
```

---

## METHOD-EVIDENCE-001

Possiede:

```text
implementation
offline verification
live verification
provenance.
```

Il decision log non deve duplicare queste dimensioni.

---

## METHOD-REG-001

Possiede:

```text
contratto machine-checkable
del registry checker.
```

Non estendere automaticamente il checker alla semantica delle supersession DEC prima di avere uno schema stabile.

---

# 54. Verification matrix per ROOT-REG-001

```text
[ ] preservare DEC-026
[ ] preservare il cleanup storico
[ ] registrare una nuova decisione superseding
[ ] supersedere solo la policy retention futura incompatibile
[ ] preservare read-before-delete
[ ] preservare docs/validations come evidence area
[ ] preservare docs/archive come non-owner
[ ] preservare no implementation proof
[ ] preservare no generic destructive cleanup
[ ] allineare root
[ ] allineare Todo
[ ] allineare metodo
[ ] lasciare 05-audit-docs-planning come storico
[ ] registry checker verde
[ ] link checker verde
[ ] fast verde
[ ] git diff --check PASS
```

---

# 55. Verification matrix per METHOD-SCHEMA-001 sul tipo DEC

```text
[ ] minimum fields
[ ] decision status
[ ] application state separato
[ ] supersedes
[ ] supersededBy
[ ] optional provenance
[ ] unknown = non registrato
[ ] grandfather storico
[ ] nuovo schema applicato alle nuove DEC
```

---

# 56. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Motivo:

```text
700 righe
26 decisioni
1 responsabilità:
decision authority dell’utente
```

Dividerlo per dominio creerebbe più decision log e renderebbe più difficile seguire la catena di supersession.

---

# 57. Decisione finale

```text
implementazioni/99-decisioni-utente.md

ROLE:
CORRETTO

DEC RANGE:
001…026 COMPLETO

DUPLICATI:
NESSUNO

APPROVAL VS IMPLEMENTATION:
GENERALMENTE CORRETTO

BOUNDARIES:
FORTI, soprattutto DEC-019…025

SUPERSESSION:
DEC-015 → DEC-026
CORRETTAMENTE ESPLICITA

POLICY ARCHIVE CORRENTE:
NON ANCORA RAPPRESENTATA
NEL DECISION LOG

MA:
GIÀ OWNED DA ROOT-REG-001

STATUS SCHEMA:
ETEROGENEO

MA:
GIÀ OWNED DA METHOD-SCHEMA-001

NUOVI FINDING:
0

NUOVE TASK:
0

RISCRITTURA COMPLETA:
NO

MODULARIZZAZIONE:
NO

NUOVI FILE:
NO
```

---

# 58. Stato audit

```text
Documenti canonici totali: 72
Analizzati: 51
Da analizzare: 21
Avanzamento: 70,83%

Blocco 048–052:
[✓] 048 implementazioni/04-task-completate.md
[✓] 049 implementazioni/05-audit-docs-planning.md
[✓] 050 implementazioni/06-implementazioni-proposte.md
[✓] 051 implementazioni/99-decisioni-utente.md
[ ] 052 implementazioni/README.md
```

Nuove task nel blocco:

```text
048 → 2
049 → 2
050 → 1
051 → 0

Totale provvisorio blocco: 5
```

Contatori provvisori:

```text
task precedenti non duplicate: 181
task continuazione consolidate fino a 047: 139
task nuove 048–051: 5
task complessive note provvisorie: 325
```

La mappa e il ledger cumulativi restano invariati fino al report 052.

Il prossimo documento canonico è:

```text
implementazioni/README.md
```
