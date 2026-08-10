# Report documentale — `docs/validations/README.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-039
Sequenza audit: 39/72
Documento analizzato: README.md
Percorso documento: docs/validations/README.md
Percorso report: Report documentale/39 - README-validations.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: b2d116a194dac276ea9947c0d20f8eabf9d47c68
Dimensione documento: 57 righe
Ruolo dichiarato: policy e indice delle validazioni storiche
Stato report: completato
```

Il documento è stato confrontato con:

```text
docs/validations/source-identity-live-verification.md
docs/validations/betfair-live-validation-2026-07-04.md
docs/validations/documentation-migration-finalization-2026-08-03.md

docs/tennis-decision-ui/operations/04-validation-and-rollback.md
docs/tennis-decision-ui/roadmap/01-current-state.md

report 032 — local runtime
report 033 — live tracking control
report 035 — validation and rollback
report 038 — current state

IMPL-031
VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006
LOCAL-RUNTIME-006
LIVE-CTRL-007
CURRENT-STATE-003
```

GitHub non è stato modificato.

La mappa cumulativa e il JSON dell’audit non vengono aggiornati con questo report.

Il checkpoint corrente resta:

```text
038–042
```

e verrà consolidato soltanto dopo il report 042.

---

# Esito sintetico

```text
Coerenza generale:                         ALTA
Separazione validation vs owner:            ALTA
Separazione storico vs current PASS:        ALTA
Regola “non inventare metadata”:            ALTA
Privacy/redaction policy:                   BUONA
Catalogo corrente:                          SOSTANZIALMENTE CORRETTO
Tassonomia historical evidence:             INCOMPLETA
Conformità metadata artifact esistenti:     PARZIALE
Run identity / immutability contract:        ASSENTE
Automazione schema/conformance:             ASSENTE, già collegata a VALID-ROLL-006
Modularizzazione:                           NON necessaria

Nuovi finding:                              3
Finding esistenti richiamati:               6+
Nuove implementazioni concorrenti:          0
Riscrittura completa:                       NO
Revisione mirata:                           SÌ
Nuovi documenti canonici proposti:          nessuno
Priorità complessiva:                       ALTA
```

Il documento contiene una regola fondamentale corretta:

```text
validazione storica
≠
owner del comportamento corrente
≠
test automatico corrente
≠
prova automatica sul commit corrente
```

Questa distinzione deve restare invariata.

La criticità non è quindi filosofica.

La criticità è che il README dichiara una governance corretta ma non definisce ancora in modo sufficientemente rigoroso:

```text
1. quali stati può assumere una prova storica;
2. come si rappresentano metadata mancanti;
3. come una nuova run ottiene una propria identità immutabile.
```

Questi tre punti diventano importanti perché gli artifact già presenti mostrano casi reali che eccedono il vocabolario e la struttura minima del README.

---

# 1. Il confine validation vs owner è corretto

## Esito: confermato

Il README dice:

```text
I file qui presenti
non sono documenti owner del comportamento corrente
e non sostituiscono:
- codice
- test automatici
- runbook operativi
```

È la policy corretta.

Questo evita tre errori frequenti:

```text
historical live observation
→ presentata come contratto corrente

vecchio PASS
→ presentato come PASS sul commit corrente

report di sessione
→ usato come source of truth dell’algoritmo
```

Il documento inoltre afferma:

```text
Non dimostra automaticamente
che lo stesso comportamento sia ancora valido
sul commit corrente.
```

Questa formulazione deve essere preservata.

---

# 2. La regola sui metadata mancanti è corretta

## Esito: confermato

Il README stabilisce:

```text
quando il documento sorgente non registrava un dato
→ scrivere `non registrato`
→ non ricostruirlo per inferenza
```

Questa è una regola documentale molto importante.

È coerente con:

```text
LOCAL-RUNTIME-006
LIVE-CTRL-007
CURRENT-STATE-003
```

che vietano di ricostruire retroattivamente:

```text
data
SHA
ambiente
azioni
artifact
limiti
```

da ricordi o deduzioni.

## Preservare

```text
unknown historical fact
→ non registrato
```

non:

```text
unknown historical fact
→ valore “probabile”
```

---

# 3. La lista metadata minima è concettualmente buona

Il README richiede:

```text
data
baseline o SHA
ambiente
scopo
comandi o azioni
risultati osservati
scenari non osservati
artefatti disponibili
limiti
```

È una base adatta per distinguere una vera validation artifact da una semplice nota.

In particolare sono corretti:

```text
scenari non osservati
```

e:

```text
limiti
```

perché impediscono che una singola sessione venga generalizzata oltre il proprio perimetro.

---

# 4. `baseline o SHA` deve consumare il contratto più forte di `VALID-ROLL-001`

## Esito: finding esistente, NON nuovo

Il README consente:

```text
baseline o SHA
```

come metadata minimo.

Dopo il report 035 sappiamo però che:

```text
HEAD SHA
≠
identità completa di una working tree dirty
```

e che il runner corrente registra:

```text
repositorySha
workingTreeStatus
changedPathCount
```

ma non identifica ancora in modo sufficiente il contenuto esatto della working tree pre/post run.

Questo è già:

```text
VALID-ROLL-001
```

## Decisione

Non creare:

```text
VALID-INDEX-xxx working tree provenance
```

Il README deve semplicemente essere aggiornato, quando `VALID-ROLL-001` verrà applicato, a un wording equivalente a:

```text
repository SHA / baseline
+
working-tree provenance richiesta dal validation contract corrente
```

senza duplicare la stessa implementazione.

---

# 5. Il README elenca soltanto quattro stati, ma gli artifact reali ne richiedono altri

## Esito: gap reale

La regola corrente dice:

```text
mantenere distinti:
passed
live_observed
blocked
not executed
```

Il problema è che questi quattro valori non coprono neppure gli artifact già presenti.

## Source Identity

Il documento contiene casi classificati come:

```text
live_observed
non eseguito
osservazione riferita, artefatto non archiviato
```

e uno stato documento:

```text
Parziale:
alcuni flussi osservati,
pending reale non verificato
```

## Betfair

Il documento usa:

```text
live_observed
non eseguito
Completata con limiti documentati
```

## Validation runner / runbook

Il contratto generale distingue:

```text
planned
implemented
executed
passed
failed
blocked
live_observed
not_applicable
```

mentre il runner v1 espone per le entry:

```text
passed
failed
timeout
```

Questo è già stato analizzato in:

```text
VALID-ROLL-004
```

che richiede di separare:

```text
workflow semantic state
runner execution status
profile configuration state
historical validation state
```

## Problema specifico dell’indice storico

`docs/validations/README.md` è il luogo naturale in cui definire almeno il sottospazio:

```text
historical evidence state
```

Oggi invece mescola:

```text
runner-like `passed`
manual `live_observed`
operational `blocked`
free-text `not executed`
```

senza dire:

```text
quali sono enum
quali sono descrizioni
quali sono document-level status
quali sono scenario-level status
```

---

# 6. `VALID-INDEX-001` — definire la tassonomia delle historical evidence

**Priorità:** high  
**Tipo:** historical evidence state taxonomy

## Obiettivo

Definire un vocabolario stabile per gli artifact sotto:

```text
docs/validations/
```

senza fingere che sia lo stesso schema del validation runner.

## Tassonomia minima da valutare

Il naming finale va coordinato con `VALID-ROLL-004` e `IMPL-031`, ma deve rappresentare almeno:

```text
live_observed
passed
failed
blocked
not_executed
not_applicable
historically_reported
```

e, quando necessario:

```text
evidence_not_archived
metadata_not_registered
```

come proprietà/qualificatori, non necessariamente come stati principali.

## Distinzione necessaria

Esempio:

```text
document_status:
partial

scenario_status:
live_observed
```

oppure:

```text
document_status:
completed_with_limits

scenario_status:
not_executed
```

Non usare lo stesso campo per entrambe le cose.

## Coordinamento con `VALID-ROLL-004`

`VALID-ROLL-004` possiede:

```text
separazione runner state / workflow state / historical state
```

`VALID-INDEX-001` non crea un nuovo schema runner.

Possiede soltanto:

```text
vocabolario storico documentale
```

che il futuro ledger potrà consumare.

## Coordinamento con `CURRENT-STATE-003`

`CURRENT-STATE-003` richiede:

```text
live_observed
→ artifact reale

historically reported
→ provenance incompleta dichiarata

not executed
→ esplicito
```

Quindi il finding corrente rende quella regola utilizzabile anche a livello dell’indice validation.

## Verification

Casi minimi:

```text
sessione osservata
→ live_observed

scenario tentato e fallito
→ failed

dipendenza ambiente assente
→ blocked

scenario mai tentato
→ not_executed

caso non pertinente
→ not_applicable

affermazione storica riportata
senza artifact sufficiente
→ historically_reported
```

Nessuno di questi deve essere convertito automaticamente in `passed`.

---

# 7. `not executed` ha già una forma non canonica rispetto agli altri stati

## Esito: parte di `VALID-INDEX-001`

Il README usa:

```text
not executed
```

con spazio.

Altri documenti usano:

```text
not_applicable
live_observed
```

e gli artifact in italiano scrivono:

```text
non eseguito
```

Per testo umano va bene.

Per un contratto stabile o un ledger futuro no.

## Decisione

Definire:

```text
machine-readable state
```

separato dal:

```text
human label
```

Esempio:

```text
not_executed
→ “non eseguito”
```

Non introdurre questa normalizzazione direttamente nel result schema v1 senza coordinamento con `IMPL-031`.

---

# 8. Gli artifact presenti non rispettano in modo uniforme il metadata contract del README

## Esito: gap reale dell’indice/policy

Il README dice:

```text
Ogni nuova validazione deve indicare:
data
baseline o SHA
ambiente
scopo
comandi o azioni
risultati osservati
scenari non osservati
artefatti disponibili
limiti
```

La cartella corrente contiene però artifact con strutture differenti.

---

# 9. Source Identity: metadata parziale

Il file:

```text
source-identity-live-verification.md
```

ha nella tabella:

```text
Tipo
Periodo
SHA
Sorgente migrata
Stato
```

e successivamente:

```text
Scopo
Osservazioni confermate
Scenari non verificati
Limite noto osservabile
Interpretazione
```

Quindi molte informazioni esistono semanticamente.

Ma non sono presenti in forma uniforme:

```text
ambiente
artefatti disponibili
comandi o azioni
```

come campi espliciti.

Per alcuni elementi il documento dichiara:

```text
non sono stati archiviati screenshot/payload/log sufficienti
```

ma non esiste una sezione generale:

```text
Artefatti disponibili
```

che distingua:

```text
presenti
assenti
non registrati
```

---

# 10. Betfair: metadata parziale

Il file:

```text
betfair-live-validation-2026-07-04.md
```

ha:

```text
Data
Tipo
SHA
Sorgente migrata
Stato
Scopo
sessioni
limiti
interpretazione
```

ma non espone uniformemente:

```text
ambiente
artefatti disponibili
comandi o azioni
```

Il documento contiene informazioni utili, ma il lettore deve ricostruire quali elementi soddisfano il metadata contract.

## Importante

Non bisogna inventare retroattivamente:

```text
browser version
Windows version
Node version
SHA
screenshot path
payload path
```

se non erano stati registrati.

La correzione è:

```text
campo presente
→ valore reale

campo storicamente mancante
→ non registrato
```

---

# 11. Migration finalization: struttura ancora diversa

Il file:

```text
documentation-migration-finalization-2026-08-03.md
```

contiene:

```text
Scopo
Risultato
follow-up 4 agosto
controlli
limite
gate post-applicazione
commit pubblicati
```

e possiede molta provenance concreta.

Ma non segue la stessa struttura metadata dichiarata dal README.

Questo rende la policy:

```text
“Ogni nuova validazione deve indicare...”
```

più una linea guida umana che un contratto verificabile.

---

# 12. `VALID-INDEX-002` — metadata conformance e missing-field semantics

**Priorità:** high  
**Tipo:** validation artifact metadata contract

## Problema

Il README elenca campi obbligatori, ma non definisce:

```text
forma minima
campo obbligatorio
valore mancante
campo ricavabile dal body
schema per artifact migrato
```

e gli artifact presenti risultano eterogenei.

## Target

Definire una testata minima uniforme, per esempio:

```text
Data / periodo
Tipo
Repository SHA / baseline
Working-tree provenance quando applicabile
Ambiente
Scopo
Azioni/comandi
Risultato complessivo
Scenari osservati
Scenari non osservati
Artefatti disponibili
Limiti
Sorgente storica, se migrata
```

Il formato può restare Markdown.

Non è necessario introdurre YAML/frontmatter.

## Missing field

Contratto obbligatorio:

```text
dato richiesto noto
→ valore reale

dato richiesto non conservato
→ non registrato

artifact non creato
→ non archiviato

scenario non tentato
→ not_executed

dato non pertinente
→ not_applicable
```

Queste condizioni non sono sinonimi.

## Artifact migrati

Una validation migrata non deve essere “completata” inventando metadata.

Deve avere:

```text
Sorgente migrata
+
campi mancanti = non registrato
```

## Tooling

L’eventuale checker automatico appartiene alla governance già aperta:

```text
VALID-ROLL-006
```

che deve distinguere:

```text
automated current
manual current
historical-only
```

Non creare un secondo mega-checker.

`VALID-INDEX-002` definisce il contratto.

`VALID-ROLL-006` può decidere come verificarlo.

---

# 13. La regola “non modificare il risultato storico” è corretta ma manca l’identità della run

## Esito: gap reale

Il README dice:

```text
non modificare il risultato storico
per allinearlo al codice nuovo
```

e:

```text
aggiungere una nuova validazione
quando il comportamento viene rieseguito
```

Queste due regole sono entrambe corrette.

Manca però il meccanismo documentale che le rende applicabili.

## Caso Source Identity

Il file corrente è:

```text
source-identity-live-verification.md
```

Non contiene:

```text
data
run ID
sequence
version
```

nel filename.

Una futura riesecuzione Source Identity potrebbe quindi portare accidentalmente a:

```text
A.
modificare lo stesso file
→ perdita dell’immutabilità storica

B.
aggiungere una seconda sessione nello stesso file
→ artifact multi-run

C.
creare un nuovo nome ad hoc
→ naming non uniforme
```

## Caso migration finalization

Il filename è:

```text
documentation-migration-finalization-2026-08-03.md
```

ma il documento incorpora anche:

```text
Follow-up di pulizia — 4 agosto 2026
```

La cronologia è dichiarata correttamente, quindi non è falso.

Ma dimostra che:

```text
data nel filename
```

non identifica necessariamente una singola execution boundary.

---

# 14. `VALID-INDEX-003` — run identity, naming e immutabilità

**Priorità:** medium-high  
**Tipo:** validation artifact lifecycle / immutable evidence

## Obiettivo

Ogni nuova esecuzione deve avere un’identità che consenta di dire:

```text
questa è la run X
e non una modifica retroattiva della run precedente
```

## Contratto minimo da definire

Per nuove validation:

```text
topic
date
run/execution identity quando necessario
```

in filename o metadata stabile.

Possibile convenzione:

```text
YYYY-MM-DD-<topic>.md
```

quando esiste una sola run significativa nella giornata.

Se esistono più run:

```text
YYYY-MM-DD-<topic>-<run-id-bounded>.md
```

o equivalente.

Non è obbligatorio usare questa sintassi esatta.

## Regola importante

```text
rerun
→ nuovo artifact
```

non:

```text
rerun
→ sovrascrivi i risultati precedenti
```

## Follow-up

Un follow-up può restare nello stesso artifact soltanto se è chiaramente:

```text
stessa validation campaign
stessa responsibility
cronologia esplicita
```

Se è una nuova verifica indipendente:

```text
nuovo artifact
```

## Existing Source Identity

Non rinominare retroattivamente senza necessità.

Il file storico può restare:

```text
source-identity-live-verification.md
```

purché venga marcato come:

```text
artifact storico consolidato/migrato
```

e le future run adottino la nuova convention.

## Relazione con `IMPL-031`

`IMPL-031` possiede il futuro result ledger.

`VALID-INDEX-003` possiede soltanto:

```text
identità e lifecycle dei Markdown historical artifacts
```

Non c’è duplicazione.

---

# 15. La sezione “Documenti migrati” è coerente con gli artifact domain correnti

## Esito: confermato

Il README indicizza:

```text
Source Identity
Betfair
```

come:

```text
Documenti migrati
```

e separa:

```text
Migrazione documentale
```

come artifact diverso.

Questa distinzione è semanticamente sensata.

Non è necessario spostare la migration finalization sotto “Documenti migrati”.

---

# 16. L’assenza di un artifact launcher/Stop non è un errore dell’indice

## Esito: importante per evitare un finding duplicato

Il report 038 ha verificato che non esiste attualmente nell’indice:

```text
launcher live validation
Stop 9B validation
runtime lifecycle validation
```

Il Current State aveva invece aggregato tali osservazioni come se appartenessero a `docs/validations/`.

Questo è:

```text
CURRENT-STATE-003
```

ed è coordinato con:

```text
LOCAL-RUNTIME-006
LIVE-CTRL-007
```

## Non creare

Non aprire nel README:

```text
VALID-INDEX-xxx missing launcher validation
```

perché l’indice non deve inventare un artifact che non esiste.

Il comportamento corretto è:

```text
artifact assente
→ non indicizzarlo
```

Quando verrà creata una validation reale con metadata sufficienti:

```text
→ aggiungerla all’indice
```

---

# 17. Il README non deve diventare un ledger storico completo

## Esito: principio da preservare

Il futuro:

```text
IMPL-031
```

possiede:

```text
validation result ledger
schema
history
```

Il README deve rimanere:

```text
policy
+
indice navigabile degli artifact Markdown
```

Non deve contenere:

```text
ogni run
ogni pass-count
ogni SHA
ogni test entry
```

in forma duplicata.

## Forma consigliata dell’indice

Per ogni artifact può bastare:

```text
titolo/link
tipo
data/periodo
stato sintetico
```

mentre i dettagli restano nel file.

---

# 18. La privacy policy è buona ma può consumare gli owner di redaction esistenti

## Esito: nessun nuovo finding

Il README vieta:

```text
URL
cookie
token
nomi sensibili
payload completi non necessari
```

È corretto.

I report precedenti hanno però ampliato i rischi a:

```text
path locali
diagnostic details raw
capture dump_dir
header authorization
userinfo URL
```

Owner già esistenti:

```text
BETFAIR-SCRAPER-003
SOFA-LIVE-006
BETFAIR-DIAG-008
VALID-ROLL-001/002
```

## Correzione documentale possibile

Aggiornare il wording con una categoria più generale:

```text
segreti, identificatori sensibili,
path locali e diagnostica raw non necessaria
```

senza duplicare le allow-list tecniche degli owner.

---

# 19. La distinzione `live_observed ≠ passed` è corretta

## Esito: confermato

Anche se la tassonomia va formalizzata, il principio:

```text
manual live observation
≠
automated PASS
```

è corretto e fondamentale.

Non deve essere rimosso durante la revisione.

---

# 20. `blocked ≠ not_executed`

## Esito: da rendere esplicito in `VALID-INDEX-001`

Il README cita entrambi ma non spiega la differenza.

La differenza corretta è:

```text
blocked
→ scenario previsto/tentabile
→ esecuzione impedita da dipendenza o ambiente

not_executed
→ scenario non tentato
```

Esempio:

```text
login scaduto all’avvio
→ non provato
→ not_executed
```

non:

```text
blocked
```

salvo che il tentativo sia stato realmente impedito da un requisito mancante.

---

# 21. `historically_reported` è necessario per i casi senza artifact sufficiente

## Esito: da rendere esplicito in `VALID-INDEX-001`

I report 032, 033 e 038 hanno incontrato dichiarazioni storiche come:

```text
collaudo runtime finale
verifica 9B
launcher/Stop lifecycle
```

senza artifact completo.

Non devono essere:

```text
live_observed
```

se manca l’evidenza sufficiente.

Non devono però essere cancellate se rappresentano informazione storica utile.

Serve quindi una categoria equivalente a:

```text
historically_reported
```

con:

```text
metadata missing = non registrato
artifact = non archiviato / non disponibile
```

Questo consente di conservare memoria senza promuoverla a prova.

---

# 22. Metadati: campo “ambiente” deve essere bounded e non sensibile

## Esito: precisazione del contratto, nessun finding separato

Il README richiede:

```text
ambiente
```

Corretto.

Non significa che ogni artifact debba dumpare:

```text
username
home path
full PATH
env vars
cookie
profile path sensibile
```

L’ambiente deve essere sufficiente a interpretare la prova.

Esempi:

```text
Windows
Node major/minor quando rilevante
Python major/minor quando rilevante
browser/Chrome quando rilevante
local/live
```

con valori bounded.

---

# 23. Artefatti disponibili: distinguere “nessuno” da “non registrato”

## Esito: parte di `VALID-INDEX-002`

Tre casi diversi:

```text
A.
la run non produceva artifact
→ none / non applicable

B.
la run produceva artifact
ma non sono stati conservati
→ not archived

C.
non sappiamo se esistessero
→ non registrato
```

Queste condizioni hanno peso probatorio diverso.

Il README oggi usa un singolo campo:

```text
artefatti disponibili
```

ma non spiega questa distinzione.

Va aggiunta.

---

# 24. Scenari non osservati: non basta una frase generica “resta da testare”

## Esito: criterio utile da preservare

Gli artifact Betfair e Source Identity elencano scenari concreti non eseguiti.

È corretto.

Esempi:

```text
login già scaduto all’avvio
Graph URL malformate
errore rete/API reale
mercato realmente finished
pending reale → confirm
pending reale → decline
```

Questo è molto più utile di:

```text
restano altri test
```

Il README deve continuare a richiedere scenari specifici quando noti.

---

# 25. Nuovi finding

## `VALID-INDEX-001`

```text
Historical evidence state taxonomy
```

**Priorità:** high

Definire stato document-level e scenario-level; includere almeno la distinzione fra:

```text
live_observed
passed
failed
blocked
not_executed
not_applicable
historically_reported
```

e qualificatori per:

```text
not archived
not registered
```

Coordinare `VALID-ROLL-004` e `CURRENT-STATE-003`.

---

## `VALID-INDEX-002`

```text
Validation metadata conformance
```

**Priorità:** high

Rendere uniforme il contratto metadata e distinguere:

```text
known
non registrato
non archiviato
not applicable
```

per gli artifact migrati e nuovi.

L’eventuale checker appartiene a `VALID-ROLL-006`.

---

## `VALID-INDEX-003`

```text
Run identity / immutable historical artifacts
```

**Priorità:** medium-high

Definire:

```text
rerun → nuovo artifact
```

con naming/identity stabile.

Non sovrascrivere retroattivamente l’evidenza precedente.

---

# 26. Finding esistenti da NON duplicare

## `VALID-ROLL-001`

Possiede:

```text
exact run provenance
working tree pre/post
repository identity
```

Il README consuma il contratto.

---

## `VALID-ROLL-004`

Possiede:

```text
runner state
workflow state
historical state separation
entry counts
```

`VALID-INDEX-001` definisce soltanto la tassonomia storica Markdown.

---

## `VALID-ROLL-006`

Possiede:

```text
documentation validation coverage matrix
eventuale checker strutturale
```

`VALID-INDEX-002` definisce il contratto da verificare.

---

## `IMPL-031`

Possiede:

```text
result ledger
schema/history automation
```

Il README non diventa un ledger concorrente.

---

## `LOCAL-RUNTIME-006`

Possiede:

```text
runtime live-validation provenance
```

---

## `LIVE-CTRL-007`

Possiede:

```text
Stop/9B validation provenance
```

---

## `CURRENT-STATE-003`

Possiede:

```text
Current State historical validation inventory
artifact-backed
```

---

# 27. Correzioni documentali consigliate

## Correzione 1 — ruolo

Mantenere:

```text
historical evidence only
not owner
not current PASS
```

---

## Correzione 2 — metadata

Convertire la lista in un contratto più esplicito.

Esempio:

```text
Per ogni nuova validation registrare:

- data/periodo;
- tipo;
- repository SHA/baseline;
- working-tree provenance quando richiesta;
- ambiente bounded;
- scopo;
- azioni/comandi;
- risultato complessivo;
- scenari osservati;
- scenari non osservati;
- artefatti disponibili;
- limiti;
- sorgente storica, quando migrata.

Dato storico mancante:
→ non registrato.
```

---

## Correzione 3 — evidence states

Aggiungere una tabella distinta dal runner.

Esempio:

```text
live_observed
failed
blocked
not_executed
not_applicable
historically_reported
```

con definizioni.

`passed` va usato soltanto quando esiste un controllo/test con esito positivo reale.

---

## Correzione 4 — artifact lifecycle

Aggiungere:

```text
Una riesecuzione produce un nuovo artifact.
Non sovrascrivere il risultato storico precedente.
```

e una naming convention per i nuovi file.

---

## Correzione 5 — artifacts

Distinguere:

```text
available
not archived
not registered
not applicable
```

---

## Correzione 6 — privacy

Estendere sinteticamente:

```text
non includere segreti,
URL completi non necessari,
path locali sensibili,
cookie/token/header,
payload raw e diagnostica non bounded.
```

---

## Correzione 7 — indice

Mantenere link ai tre artifact correnti.

Quando verrà creato un nuovo artifact reale:

```text
aggiungerlo all’indice
```

Non creare placeholder per validation non eseguite.

---

# 28. Modularizzazione

## Valutazione

Il documento ha 57 righe e una sola responsabilità:

```text
governance + indice
delle validazioni storiche
```

Le sezioni:

```text
interpretazione
metadata
documenti
regole
link
```

sono tutte coese.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
validation-statuses.md
validation-metadata.md
validation-naming.md
```

La policy può restare in un unico README breve.

---

# 29. Verification matrix proposta

## A. Owner boundary

Ogni artifact deve dichiarare o rispettare:

```text
historical evidence
≠
current owner
```

---

## B. Current PASS

Una validation storica non deve essere interpretata come:

```text
PASS sul commit corrente
```

senza nuova esecuzione.

---

## C. Metadata complete — new artifact

Nuova run:

```text
tutti i campi richiesti presenti
```

---

## D. Metadata incomplete — historical migrated

Campo non noto:

```text
non registrato
```

non inventato.

---

## E. Artifact availability

Distinguere:

```text
available
not archived
not registered
not applicable
```

---

## F. Scenario state

Verificare:

```text
live_observed
failed
blocked
not_executed
not_applicable
historically_reported
```

---

## G. Runner status

Un:

```text
timeout
```

del runner non deve essere riscritto come:

```text
blocked
```

senza regola esplicita.

---

## H. Live observation

`live_observed` richiede:

```text
sessione realmente osservata
+
artifact con provenance sufficiente
```

---

## I. Historical report

Dichiarazione inline senza artifact sufficiente:

```text
historically_reported
```

non `live_observed`.

---

## J. Rerun

Prima run:

```text
artifact A
```

Seconda run:

```text
artifact B
```

A non viene sovrascritto.

---

## K. Same-day rerun

Due run nello stesso giorno devono avere:

```text
identity distinta
```

---

## L. Source Identity legacy artifact

Il file dateless storico:

```text
source-identity-live-verification.md
```

può restare immutato.

Nuove run non devono esservi accodate in modo ambiguo.

---

## M. Migration campaign

Follow-up nello stesso artifact:

```text
consentito
```

soltanto se chiaramente parte della stessa campagna e datato.

---

## N. Privacy

Artifact non deve contenere:

```text
token
cookie
Authorization
URL completa non necessaria
local path sensibile
payload raw
```

---

## O. Environment

Deve essere:

```text
sufficiente per interpretare la prova
ma bounded
```

---

## P. Current State consumption

`CURRENT-STATE-003` può qualificare una validazione come archiviata soltanto se:

```text
artifact esiste
+
indice o link stabile
```

---

## Q. Missing runtime artifact

Finché non esiste:

```text
launcher/Stop validation
```

il README non deve creare un link placeholder.

---

## R. Automated conformance

Se introdotta:

```text
VALID-ROLL-006
```

resta owner del checker.

---

# 30. Ordine consigliato

```text
1. VALID-INDEX-001
   → historical evidence taxonomy

2. VALID-INDEX-002
   → metadata contract + missing semantics

3. VALID-INDEX-003
   → immutable run identity/naming

4. allineare operations/04 tramite VALID-ROLL-004

5. allineare Current State tramite CURRENT-STATE-003

6. audit individuale artifact 040–042
   → non duplicare i finding dell’indice

7. decidere eventuale enforcement in VALID-ROLL-006

8. checker/link validation

9. aggiornamento cumulativo mappa/ledger dopo report 042
```

---

# 31. Decisione finale

```text
docs/validations/README.md:

DOCUMENTO CONCETTUALMENTE CORRETTO
E IMPORTANTE COME BOUNDARY DI PROVENANCE.

NON RISCRIVERE COMPLETAMENTE.
NON DIVIDERE.

PRESERVARE:
historical evidence ≠ owner
historical run ≠ current PASS
live observation ≠ automatic test
metadata mancanti = non registrato
no future spec from historical validation
privacy/redaction

MIGLIORARE:
historical evidence taxonomy
metadata conformance
missing/not-archived semantics
rerun identity
immutable artifact lifecycle

Nuovi finding:
VALID-INDEX-001 — high
VALID-INDEX-002 — high
VALID-INDEX-003 — medium-high

Non duplicare:
VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006
IMPL-031
LOCAL-RUNTIME-006
LIVE-CTRL-007
CURRENT-STATE-003

Riscrittura completa:
NO

Modularizzazione:
NO

Nuovi file canonici:
nessuno

Priorità:
ALTA
```

La regola operativa da rendere inequívoca è:

```text
una validazione storica
deve poter essere identificata,
interpretata e confrontata
senza:
- inventare metadata;
- confonderla con il runner;
- sovrascrivere run precedenti;
- promuovere osservazioni riferite a live_observed.
```

---

# 32. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-039

Documento:
docs/validations/README.md

Nuovi Change ID:
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003

Finding esistenti richiamati:
VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006
IMPL-031
LOCAL-RUNTIME-006
LIVE-CTRL-007
CURRENT-STATE-003

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 33. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 39
Da analizzare: 33
Avanzamento: 54,17%

Blocco 038–042:
[✓] 038 roadmap/01-current-state.md
[✓] 039 docs/validations/README.md
[ ] 040 docs/validations/betfair-live-validation-2026-07-04.md
[ ] 041 docs/validations/documentation-migration-finalization-2026-08-03.md
[ ] 042 docs/validations/source-identity-live-verification.md
```

Il prossimo documento canonico è:

```text
docs/validations/betfair-live-validation-2026-07-04.md
```

La mappa e il ledger cumulativi non vengono aggiornati prima del report 042.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `VALID-INDEX-001…003`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
