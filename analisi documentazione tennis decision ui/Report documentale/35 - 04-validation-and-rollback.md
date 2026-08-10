# Report documentale — `docs/tennis-decision-ui/operations/04-validation-and-rollback.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-035
Sequenza audit: 35/72
Documento analizzato: 04-validation-and-rollback.md
Percorso documento: docs/tennis-decision-ui/operations/04-validation-and-rollback.md
Percorso report: Report documentale/35 - 04-validation-and-rollback.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 98e6d795ad5a1b7587e89c3b1a46a4de8f705f19
Dimensione documento: 379 righe
Ruolo dichiarato: runbook operativo per validazione mirata, interpretazione degli esiti e rollback selettivo
Stato report: completato
```

Il documento è stato confrontato con:

- `scripts/validation/run.mjs`;
- `scripts/validation/run.test.mjs`;
- `scripts/validation/test-manifest.json`;
- `scripts/validation/manifest-schema.json`;
- `scripts/validation/result-schema.json`;
- `scripts/validation/README.md`;
- `scripts/validation/support/manifest.mjs`;
- `scripts/validation/support/process-runner.mjs`;
- `scripts/validation/support/result.mjs`;
- `scripts/validation/support/redaction.mjs`;
- `scripts/check_documentation_links.py`;
- `scripts/check_registry_consistency.py`;
- `scripts/tests/test_check_documentation_links.py`;
- `backend/src/server.test.mjs`;
- `frontend/src/App.jsx`;
- `docs/validations/README.md`;
- il registro delle implementazioni e dei TEST-ID già approvati;
- i finding già aperti nei report precedenti, in particolare quelli relativi a persistence, frontend, runtime, validation provenance e Betfair.

GitHub non è stato modificato.

La mappa Markdown di continuazione e il JSON incrementale non vengono aggiornati in questo report. Il checkpoint cumulativo resta dopo il report 037.

---

# Esito sintetico

```text
Coerenza generale: ALTA nei principi
Coerenza col runner v1: MEDIO-ALTA
Coerenza delle garanzie “offline”: PARZIALE
Coerenza provenance working tree: PARZIALE
Coerenza rollback selettivo: MEDIA
Coerenza result artifact: MEDIA
Coerenza timeout/process isolation: MEDIO-ALTA sul child diretto
Coerenza document validation: MEDIA
Coerenza persistence/recovery: BUONA come runbook, coverage canonica ancora incompleta
Coerenza frontend: BUONA e prudente
Coerenza live/manual validation: ALTA

Modifiche nuove proposte: 7
Riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: CRITICA
```

Il documento svolge il ruolo corretto.

Deve restare il runbook operativo che risponde a:

```text
quale controllo devo eseguire dopo una modifica?
che cosa prova davvero un PASS?
quando serve un test di confine?
quando serve una verifica live?
come distinguo build, test e osservazione manuale?
come annullo una modifica senza toccare dati runtime?
come documento ciò che non ho verificato?
```

Non deve diventare owner di:

```text
implementazione del runner
catalogo completo dei test
sandbox persistence
frontend interaction harness
result ledger
benchmark
replay
algoritmi di recovery
```

I problemi trovati riguardano soprattutto il confine fra:

```text
intenzione del runner
e
garanzia tecnicamente provata dal runner
```

---

# 1. L’artefatto non identifica in modo univoco la working tree realmente validata

## Esito: nuovo gap di provenance e rollback

Il documento definisce:

```text
executed
→ comando eseguito sulla working tree corrente
```

e richiede nel report:

```text
baseline o working tree verificata
```

Inoltre il rollback deve essere:

```text
selettivo
→ limitato ai file della task
```

La filosofia è corretta.

Il problema è la precisione dell’artefatto prodotto dal runner.

## Stato repository registrato

`repositoryState()` salva:

```text
git rev-parse HEAD
git status --short
```

ma riduce lo stato a:

```text
repositorySha
workingTreeStatus = clean | dirty | unavailable
changedPathCount
```

Non conserva:

```text
quali path erano modificati
quale contenuto avevano
un fingerprint della patch
un digest della working tree
la distinzione task-current vs modifiche preesistenti
```

Due working tree diverse possono quindi produrre:

```text
stesso HEAD SHA
workingTreeStatus=dirty
changedPathCount=3
```

ed essere indistinguibili nell’artefatto.

## Filename

Il nome predefinito è:

```text
<timestamp>-<short HEAD sha>-<profile>.json
```

Anche con working tree dirty.

Quindi il SHA nel nome identifica:

```text
HEAD
```

non:

```text
contenuto esatto validato
```

## Stato catturato soltanto prima della suite

In `run.mjs`:

```text
repoState = repositoryState(...)
→ poi vengono eseguite le entry
→ poi viene costruito l’artifact
```

Non viene raccolto un secondo stato repository dopo l’esecuzione.

Questo è importante perché il manifest possiede entry con:

```text
mutatesFilesystem: true
```

e il runner registra quel flag ma non verifica che la working tree sia rimasta invariata o che le mutazioni siano rimaste dentro una sandbox approvata.

## Conseguenza

È possibile avere:

```text
working tree iniziale clean
→ test modifica accidentalmente un file tracciato
→ test termina 0
→ artifact continua a dire workingTreeStatus=clean
→ profile status=passed
```

perché `clean` è lo stato osservato prima dell’esecuzione.

Il problema non richiede che ciò stia accadendo oggi: il contratto non lo rileva.

## Caso Git non disponibile

Se Git non è interrogabile:

```text
repositorySha = unknown
workingTreeStatus = unavailable
```

ma la suite può comunque terminare:

```text
status=passed
exit 0
```

Quindi:

```text
execution PASS
≠
execution commit-anchored
```

## Impatto sul rollback

Il runbook dice correttamente:

```text
non resettare modifiche preesistenti
```

ma l’artefatto non possiede abbastanza provenance per distinguere automaticamente:

```text
file già sporco prima della task
file modificato dalla task
file modificato dal test
file generato durante validation
```

La procedura continua quindi a dipendere dal report umano e dalla disciplina operativa.

## Finding `VALID-ROLL-001` — working-tree provenance e pre/post validation state

**Priorità:** critical  
**Tipo:** validation provenance / rollback safety

### Target

Registrare almeno:

```text
preRun:
  repositorySha
  workingTreeStatus
  workingTreeFingerprint o equivalente bounded
  changedPath metadata sicuri oppure digest

postRun:
  workingTreeStatus
  workingTreeFingerprint
  changed-during-run
```

La soluzione non deve inserire nell’artefatto:

```text
path sensibili esterni al repository
contenuti dei file
segreti
diff raw
```

È sufficiente una forma bounded e riproducibile.

### Rollback

Il runbook deve richiedere che il perimetro della task venga stabilito prima della patch quando la working tree è già dirty.

Non tentare di ricostruirlo dopo tramite:

```text
git status corrente
```

come se tutto ciò che appare fosse stato creato dalla task.

### Verification

Casi minimi:

```text
clean → test read-only → clean

dirty A → test read-only → dirty A

clean → test modifica tracked file → postRun changed

dirty A → task/test modifica B → pre/post distinguibili

Git unavailable
→ result può eseguire test
→ ma provenance non deve essere qualificata come commit-verified
```

---

# 2. `fast` e `full-offline` non sono una sandbox di capacità

## Esito: garanzia documentata più forte dell’enforcement reale

La tabella dei profili descrive:

```text
fast
→ nessun browser
→ nessuna credenziale
→ nessuna rete esterna
→ nessun tracking
```

Il registro storico indica inoltre `TEST-073` come:

```text
IMPLEMENTATO E PASSATO
```

con semantica:

```text
profilo fast
→ non avvia browser, rete esterna o tracking
```

Il test corrente però prova una proprietà più stretta.

## Cosa verifica realmente `TEST-073`

`run.test.mjs` crea una entry con:

```text
requires: ['external-network']
```

e verifica che:

```text
validateManifest(... selectedProfile='fast')
→ rifiuti la entry
```

Quindi il test prova:

```text
se una entry DICHIARA una capability vietata
→ il manifest fast la rifiuta
```

Non prova:

```text
una entry catalogata requires=[]
→ non possa aprire rete/browser/tracking
```

## `requires` è dichiarativo

`manifest.mjs` controlla soltanto i valori di:

```text
entry.requires
```

per le entry assegnate a `fast`.

Non analizza né limita la capacità effettiva del comando.

Un comando erroneamente catalogato come:

```text
requires: []
```

può tecnicamente:

```text
aprire socket
fare HTTP
avviare subprocess
aprire browser
leggere environment
toccare filesystem
```

se il test stesso lo fa.

## I child ereditano l’intero environment

`runEntry()` costruisce l’environment con:

```text
...process.env
```

e poi aggiunge:

```text
CI
NO_COLOR
TDUI_VALIDATION_RUNNER
TDUI_VALIDATION_PROFILE
```

Quindi il processo offline può ereditare eventuali:

```text
token
app key
proxy
credenziali
variabili locali
```

presenti nella shell che avvia il runner.

Il redactor agisce su:

```text
stdout/stderr catturati
```

ma non impedisce al child di leggere il valore.

## Distinzione necessaria

Oggi la formulazione tecnicamente corretta è:

```text
fast
→ profilo composto da entry dichiarate senza capability vietate
→ nessun test live intenzionalmente registrato
→ non è una security sandbox
```

e non:

```text
fast
→ impossibilità tecnica di rete/browser/credenziali
```

## `full-offline`

Per `full-offline` la verifica è ancora più limitata:

```text
entry inclusa nel profilo
+ liveRequired=true
→ errore
```

Non c’è un controllo equivalente su:

```text
external-network
browser
credentials
tracking
```

salvo corretta dichiarazione e composizione del manifest.

## Finding `VALID-ROLL-002` — offline capability isolation e revisione di `TEST-073`

**Priorità:** critical  
**Tipo:** validation isolation / credential boundary

### Documento

Correggere immediatamente il wording:

```text
offline intended / manifest-declared
```

vs:

```text
technically sandboxed
```

### Runner

Valutare un environment minimale per i profili offline:

```text
allow-list di variabili necessarie
nessuna credenziale applicativa
nessun token noto
nessuna chiave Betfair
```

preservando soltanto ciò che serve realmente a:

```text
Node
Python
npm
toolchain
Windows runtime
```

### `TEST-073`

Non cancellare il test corrente.

Ridefinirne correttamente la copertura:

```text
declaration guard
```

e aggiungere una verifica distinta per la capability isolation realmente approvata.

### Non fare

Non introdurre una pseudo-sandbox fragile basata soltanto sulla ricerca di stringhe nel comando.

La policy deve distinguere:

```text
metadata validation
environment sanitization
filesystem sandbox
network/browser guarantees
```

---

# 3. `full-offline = tutte le entry offline abilitate` non è un’invariante del manifest

## Esito: contratto vero oggi per convenzione, non garantito dal validator

Il documento definisce:

```text
full-offline
→ tutte le entry offline abilitate, in serie
```

Il manifest corrente è coerente con questa intenzione per la superficie attualmente registrata.

Ma `selectEntries()` seleziona semplicemente:

```text
entry.enabled
&&
entry.profiles.includes(profile)
```

Per `full-offline` il validator controlla soltanto che una entry già assegnata a `full-offline` non abbia:

```text
liveRequired=true
```

Non esiste la regola inversa:

```text
entry enabled
+ offline eligible
→ DEVE appartenere a full-offline
```

## Esempio

Una futura entry potrebbe essere:

```text
enabled=true
profiles=['backend']
liveRequired=false
```

senza:

```text
full-offline
```

Il manifest resterebbe valido.

Poi:

```text
node scripts/validation/run.mjs full-offline
→ PASS
```

senza eseguire quella entry.

Il label:

```text
tutte le entry offline abilitate
```

diventerebbe falso senza alcun errore di configurazione.

## Relazione con `IMPL-003`

`IMPL-003` possiede:

```text
completezza test ↔ owner ↔ documento
```

ma questo finding è più stretto.

Anche con una entry correttamente presente nel manifest, può esistere drift di membership del profilo.

## Profilo persistence/benchmark

Non è corretto imporre automaticamente:

```text
ogni liveRequired=false
→ full-offline
```

perché in futuro potrebbero esistere:

```text
benchmark
persistence pesante
controlli opzionali
```

che non devono essere gate ordinari.

Serve quindi un contratto esplicito, ad esempio:

```text
fullOfflineEligible: true|false
```

oppure:

```text
excludedFromFullOfflineReason
```

o equivalente.

## Finding `VALID-ROLL-003` — full-offline closure invariant

**Priorità:** high  
**Tipo:** profile completeness

### Target

Il manifest deve poter dimostrare:

```text
ogni entry ordinaria offline abilitata
→ inclusa in full-offline

oppure
→ esclusione esplicita, bounded e verificabile
```

### Verification

Casi:

```text
backend ordinary + no full-offline
→ config failure

frontend ordinary + no full-offline
→ config failure

live
→ esclusa correttamente

benchmark non-gate
→ esclusione esplicita

persistence non ancora abilitata
→ non falsamente conteggiata
```

### Report

Un PASS `full-offline` deve significare:

```text
tutte le entry del perimetro full-offline definito
```

non:

```text
tutto ciò che potrebbe teoricamente essere testato nel repository
```

---

# 4. I conteggi del runner sono conteggi di entry, non conteggi di test/assertion

## Esito: semantica dell’artefatto da rendere esplicita

Il runner stampa:

```text
summary: N passed, M failed, T timed out
```

e l’artefatto usa:

```text
counts.total
counts.passed
counts.failed
counts.timedOut

perTestResults
```

Ma il calcolo è:

```text
numero di entry del manifest con status ...
```

Non il numero di:

```text
assertion
test case
subtest
unittest method
```

## Una entry può essere

```text
un test Node con decine di assertion
una suite Python con molti unittest
un build Vite
compileall
un documentation checker
il self-test del runner
```

Quindi:

```text
full-offline:
17 passed
```

significa:

```text
17 manifest entries/comandi riusciti
```

non:

```text
17 test applicativi
```

## `perTestResults`

Anche il nome:

```text
perTestResults
```

è semanticamente più stretto del contenuto reale, perché include entry di tipo:

```text
build
compile-check
documentation-check
```

## Tabella degli stati

Il runbook elenca stati generali:

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

ma il result artifact v1 per singola entry espone soltanto:

```text
passed
failed
timeout
```

I profili pianificati:

```text
→ exit 2
→ nessun artifact
```

e le entry disabilitate:

```text
→ non vengono selezionate
→ non appaiono come blocked/skipped
```

Quindi occorre separare:

```text
workflow semantic state
runner execution status
profile configuration state
historical validation state
```

## Relazione con `IMPL-031`

`IMPL-031` possiede già il result ledger e il completamento dello schema.

Non serve una seconda implementazione concorrente.

Questo finding aggiunge la semantica necessaria per evitare che il ledger futuro erediti un nome ambiguo.

## Finding `VALID-ROLL-004` — entry-count e result-state semantics

**Priorità:** high  
**Tipo:** validation result semantics

### Documento

Usare formulazioni come:

```text
17 entry del profilo passate
```

quando il dato proviene da `counts.passed`.

Usare:

```text
N test/assertion passati
```

soltanto se tale conteggio proviene realmente dalla suite interna ed è distinguibile.

### Schema futuro

Valutare:

```text
counts.totalEntries
counts.passedEntries
perEntryResults
```

lasciando eventuali:

```text
testCaseCounts
assertionCounts
```

come dati separati e opzionali.

### Stati

Documentare una matrice esplicita:

```text
manifest/profile state
execution result
historical evidence state
```

senza fingere che il runner v1 serializzi tutti gli stati concettuali.

---

# 5. Il timeout prova la terminazione del child diretto, non necessariamente del suo process tree

## Esito: nuovo gap di process isolation

Il documento e i registri considerano implementato:

```text
TEST-063
→ timeout termina il processo
→ failure bounded
```

La suite corrente testa:

```text
script Node diretto
→ timer infinito
→ timeout
→ child termina
```

Questo prova correttamente il child diretto.

## Implementazione timeout

Alla scadenza:

```text
timedOut=true
→ child.kill(SIGTERM)
→ dopo grace forceTerminateProcess(child)
```

Su Windows la force path usa:

```text
taskkill /PID <pid> /T /F
```

ma soltanto se il child diretto risulta ancora attivo al momento dell’escalation.

Su sistemi non Windows:

```text
SIGKILL
```

viene inviato al child diretto.

## Caso descendant

Fixture:

```text
parent test process
→ spawn grandchild
→ grandchild resta attivo
```

Al timeout:

```text
parent riceve termination
→ parent esce rapidamente
```

Il callback di force termination vede il parent già terminato e può non avere più un processo diretto su cui effettuare l’escalation.

Il descendant non è provato terminato.

Questo vale particolarmente per entry che invocano tool capaci di creare subprocess:

```text
npm
build tool
Python subprocess
browser helper
```

## Conseguenza

```text
entry status=timeout
```

prova:

```text
comando principale non completato nel budget
```

ma non ancora:

```text
zero processi discendenti della entry rimasti attivi
```

## Relazione con runtime application

Non riusare:

```text
pythonProcessRegistry
```

del prodotto.

Il validation runner deve possedere il proprio process-tree lifecycle senza confondersi con i processi runtime Tennis Decision UI.

## Finding `VALID-ROLL-005` — owned validation process-tree termination

**Priorità:** high  
**Tipo:** validation process lifecycle

### Target

Su timeout:

```text
owned process tree
→ bounded graceful termination quando possibile
→ bounded force termination
→ completion soltanto dopo stato definito
```

La soluzione deve essere platform-aware e deve operare soltanto sul tree creato dalla specifica entry.

### Verification

Fixture:

```text
parent
→ child/grandchild long-lived
```

Casi:

```text
parent resta vivo
parent esce su SIGTERM ma descendant resta
grandchild ignora graceful signal
```

Atteso:

```text
entry timeout
→ nessun owned descendant residuo
```

oppure, se non dimostrabile:

```text
termination_unconfirmed
```

non un falso “fully terminated”.

---

# 6. La checklist documentale è più ampia dei checker canonici realmente eseguiti

## Esito: runbook corretto come checklist, ma automazione non esplicitamente mappata

La sezione Documentazione richiede:

```text
file previsti
UTF-8
un H1
fence bilanciate
link
no export const meta
no secrets/path personali
no future-as-current
no mdx
indice/manifest/owner coerenti
```

Queste sono regole corrette.

Il comando obbligatorio indicato è però:

```text
python scripts/check_documentation_links.py --forbid-mdx-links
```

## Cosa verifica il link checker

Il checker corrente è specializzato su:

```text
target relativi
anchor
anchor non verificabili
link .mdx
```

e ignora correttamente:

```text
link esterni
link dentro code fence
```

Non è un checker generale per:

```text
numero H1
fence bilanciate
export const meta
secret assignment
future/current semantics
inventario esatto
owner semantics
```

## Registry checker

`check_registry_consistency.py` copre una parte diversa:

```text
ID
registri
owner delle schede
stati stretti
checkpoint/range
```

ma non sostituisce il controllo strutturale Markdown.

## Controlli storici

Durante la migrazione documentale sono stati eseguiti controlli più estesi su:

```text
UTF-8
H1
fence
meta
mojibake
segreti
mapping
veridicità dello stato
```

Queste evidenze sono storiche.

Non sono automaticamente una garanzia per ogni nuovo batch futuro.

## TEST-076–079

Restano utili come contratti della migrazione completata:

```text
inventario
mapping
link
current/deprecated/historical/future
```

ma non costituiscono da soli un comando strutturale canonico eseguito a ogni modifica Markdown.

## Finding `VALID-ROLL-006` — documentation validation coverage matrix

**Priorità:** medium  
**Tipo:** documentation verification ownership

### Documento

Per ogni requisito indicare:

```text
automated current
manual current
historical-only
owner
command/test
```

### Possibile target

Se i controlli:

```text
H1
fence
meta
UTF-8
mojibake
secret-pattern bounded
```

sono richiesti sistematicamente, valutare un checker read-only dedicato o estendere in modo coerente l’harness documentale.

Non gonfiare il link checker con semantiche non correlate se ciò compromette ownership e manutenzione.

### Regola

Non dire:

```text
link checker verde
→ documentazione completamente validata
```

Il runbook oggi non lo dice esplicitamente, ma la distinzione deve essere resa impossibile da fraintendere.

---

# 7. Il runbook richiede HTTP reale per contratti Express critici, ma il route harness canonico è ancora aperto

## Esito: requisito corretto, infrastruttura incompleta

La matrice dice:

```text
Router Express
→ test response/route
→ per contratti critici HTTP reale su porta dinamica
```

Questa è una regola corretta.

Nel registro però:

```text
TEST-072
→ Route harness verifica HTTP reale su porta dinamica
→ MANCANTE
```

Il documento, nella sezione finale “Restano aperti”, elenca:

```text
IMPL-003
IMPL-008 / IMPL-029
journal/recovery manifest
IMPL-030
IMPL-031
persistence/benchmark/live
```

ma non rende esplicito:

```text
TEST-072
```

## Test esistenti

Esistono test route/response e server con dependency injection.

Alcune superfici possono possedere test HTTP reali specifici.

Il finding non significa:

```text
nessuna route ha mai avuto test HTTP
```

Significa:

```text
il reusable/canonical HTTP route harness richiesto da TEST-072
→ non è ancora una capacità generale disponibile
```

## Conseguenza

La tabella “Controllo minimo corrente” può essere letta come se il progetto possedesse già in modo uniforme quell’harness.

Va invece distinto:

```text
requisito per un contratto critico
vs
infrastruttura standard già disponibile
```

## Finding `VALID-ROLL-007` — allineare route-boundary validation a `TEST-072`

**Priorità:** high  
**Tipo:** HTTP boundary verification

### Documento

Aggiungere `TEST-072` ai limiti correnti.

### Esecuzione

Fino alla sua implementazione:

```text
se una route critica necessita HTTP reale
→ usare il test specifico realmente disponibile
oppure
→ creare un harness mirato della task
→ registrare che non è ancora il canonical shared harness
```

### Target

Quando `TEST-072` viene implementato:

```text
porta dinamica
server owned
status
headers
body
cleanup listener
timeout
nessuna collisione con runtime reale
```

### Non duplicare

L’implementazione del generic harness resta:

```text
TEST-072
```

Questo report non crea una seconda infrastructure task concorrente.

---

# Aspetti verificati e corretti da mantenere

## 1. Presenza ≠ esecuzione ≠ PASS

La distinzione iniziale è uno dei punti più solidi del documento.

Mantenere:

```text
file presente
≠ test eseguito

esecuzione storica
≠ PASS corrente

build verde
≠ UI verificata

live observation
≠ automatic test

HTTP status corretto
≠ recovery verificata
```

Queste regole devono restare centrali.

---

## 2. Il manifest non viene presentato come inventario completo

Il documento dichiara correttamente:

```text
manifest iniziale
≠ mappa completa di ogni test
```

e assegna la completezza a:

```text
IMPL-003
```

Questa prudenza è coerente con il codice e con il registro storico.

---

## 3. Profili pianificati non producono falso skip/PASS

Il runner corrente:

```text
profile disabled/planned
→ configuration error
→ exit 2
→ nessuna execution artifact ordinaria
```

Il self-test verifica esplicitamente che un profilo pianificato non venga presentato come:

```text
skipped
passed
```

Questa semantica è corretta.

---

## 4. Path missing è fail-closed prima dei child

Il preflight valida i path prima di avviare la suite.

La validazione storica reale ha già dimostrato che path journal/recovery obsoleti hanno causato:

```text
exit 2
→ zero child process avviati
```

e che le entry non comprovate sono state rimosse senza inventare path sostitutivi.

È una proprietà da preservare.

---

## 5. Command allow-list e `shell:false`

Il runner usa command array e:

```text
shell:false
```

con adattamento Windows per `.cmd/.bat`.

La command allow-list impedisce di trasformare il manifest in una superficie shell arbitraria.

Resta distinta dalla capability isolation di `VALID-ROLL-002`.

---

## 6. Output bounded e redacted

Il runner limita stdout/stderr e applica redaction a:

```text
repo root
home
temp
URL
Bearer
authorization
cookie
api/app key
token
password
path assoluti comuni
```

Il self-test verifica output lungo e marker sensibili.

Restano aperti `TEST-069/070` e `IMPL-031` per completare il contratto dell’artefatto.

Non duplicarli.

---

## 7. Persistence coverage è descritta correttamente come presente ma non orchestrata completamente

Il documento ha corretto il vecchio errore dei monoliti inesistenti:

```text
commitJournal.test.mjs
recovery.test.mjs
```

e riporta test modulari reali.

La formula è corretta:

```text
modular coverage present
≠ manifest inventory complete
≠ persistence profile implemented
≠ current PASS
```

Questo deve restare invariato.

---

## 8. Rollback distruttivi sono correttamente vietati

Mantenere il divieto di:

```text
blind match_history delete
manual .pending_commits delete
cache cleanup per nascondere persistence failure
kill by port
indiscriminate reset
test edits per “far verde” una regressione non compresa
```

Il rollback deve restare task-scoped e non trasformarsi in cleanup generale.

---

## 9. La sezione frontend è prudente

Il documento non confonde:

```text
utility test
build
React lifecycle
browser
```

e dichiara esplicitamente assente l’harness completo React.

Anche il wiring integrity viene descritto come incompleto invece di dichiararlo finito.

Questo è coerente con il codice corrente di `App.jsx`, che non destruttura né propaga tutta l’integrity conservata dagli hook.

---

## 10. Validazioni storiche hanno un owner corretto

`docs/validations/README.md` definisce già metadata forti:

```text
data
baseline/SHA
ambiente
scopo
comandi/azioni
risultati
scenari non osservati
artefatti
limiti
```

e impone:

```text
non registrato
```

quando il dato storico manca.

Questo documento deve linkare e riusare tale authority, non duplicare formati diversi.

I finding specifici già emersi:

```text
LIVE-CTRL-007
BETFAIR-DIAG-008
JOURNAL-REC-009
```

devono convergere su questa stessa policy.

---

# Dipendenze già aperte da non duplicare

```text
IMPL-003
→ test map completa

IMPL-008
→ persistence/recovery harness

IMPL-029
→ fixture catalog + sandbox + runtime directory protection

IMPL-030
→ frontend StrictMode interaction harness

IMPL-031
→ result ledger/schema/provenance storico

TEST-065
→ cleanup sandbox

TEST-066
→ runtime directories protette

TEST-067
→ fixture contract

TEST-069
→ result JSON schema/context

TEST-070
→ result artifact redaction

TEST-071
→ frontend StrictMode harness

TEST-072
→ HTTP route harness dinamico

TEST-074
→ benchmark contract

TEST-075
→ lint surface

TEST-076
TEST-077
TEST-078
TEST-079
→ controlli migrazione documentale già completati/confermati
```

Dipendenze comportamentali già emerse nei report precedenti:

```text
BETFAIR-DIAG-003
→ finished authority

BETFAIR-DIAG-008
→ verification/provenance diagnostica Betfair

LIVE-CTRL-007
→ validation provenance live tracking

JOURNAL-REC-009
→ verification/provenance persistence
```

Questo report non deve creare un secondo owner per tali contratti.

---

# Relazione dei nuovi finding con le task esistenti

## `VALID-ROLL-001`

Non sostituisce `IMPL-031`.

```text
IMPL-031
→ historical result ledger

VALID-ROLL-001
→ exact run provenance / pre-post working tree identity
```

Il ledger futuro dovrà consumare la provenance corretta.

## `VALID-ROLL-002`

Estende la comprensione di `TEST-073`.

```text
TEST-073 corrente
→ manifest declaration guard

VALID-ROLL-002
→ differenza declaration vs actual capability isolation
```

## `VALID-ROLL-003`

Non sostituisce `IMPL-003`.

```text
IMPL-003
→ quali test devono esistere nel manifest

VALID-ROLL-003
→ una entry già nel manifest appartiene davvero al profilo aggregate corretto?
```

## `VALID-ROLL-004`

Deve essere applicato insieme a `IMPL-031`.

Non serve un secondo result ledger.

## `VALID-ROLL-005`

Non usa il registry Python applicativo.

È lifecycle del runner di validazione.

## `VALID-ROLL-006`

Non sostituisce:

```text
check_documentation_links.py
check_registry_consistency.py
```

ma rende esplicita la loro coverage.

## `VALID-ROLL-007`

Non crea un secondo `TEST-072`.

Rende il runbook coerente con il fatto che `TEST-072` è ancora aperto.

---

# Lunghezza, integrità del contesto e modularizzazione

## Dimensione

```text
379 righe
```

Il documento contiene:

- semantica degli esiti;
- scelta dei test;
- runner;
- profili;
- persistence;
- Source Identity;
- Betfair;
- frontend;
- documentazione;
- report;
- rollback;
- validazioni storiche;
- stato infrastruttura.

## Responsabilità

Queste sezioni convergono tutte sullo stesso owner operativo:

```text
come verificare una modifica
e come annullarla in sicurezza
```

Non ci sono due owner indipendenti tali da giustificare uno split.

## Owner specialistici già esistenti

I dettagli tecnici restano in:

```text
scripts/validation/
implementazioni/ registri
docs/validations/
modules/storage/
operations/02-live-tracking-control.md
operations/03-betfair-diagnostics.md
modules/frontend/
```

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare task di modularizzazione.

## Miglioramento strutturale consigliato

Il documento può essere reso più efficace senza dividerlo:

```text
1. semantics
2. choose validation boundary
3. canonical runner profiles
4. domain-specific exceptions
5. report/provenance
6. rollback
7. current limitations
```

e spostare i dettagli molto specialistici verso gli owner già esistenti tramite link.

---

# Riferimenti per la futura mappa/ledger

```text
Report ID: TDUI-DOC-REPORT-035
Percorso report: Report documentale/35 - 04-validation-and-rollback.md
Documento: docs/tennis-decision-ui/operations/04-validation-and-rollback.md

Change ID: VALID-ROLL-001
Change ID: VALID-ROLL-002
Change ID: VALID-ROLL-003
Change ID: VALID-ROLL-004
Change ID: VALID-ROLL-005
Change ID: VALID-ROLL-006
Change ID: VALID-ROLL-007

Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Il report 035 è il terzo elemento del checkpoint:

```text
033
034
035
036
037
```

La mappa e il ledger restano invariati fino al completamento del report 037.

---

# Modifiche proposte

## `VALID-ROLL-001` — exact working-tree provenance e rollback scope

**Priorità:** critical

- distinguere HEAD SHA da contenuto esatto della working tree;
- aggiungere provenance bounded della working tree;
- rilevare pre/post run;
- non lasciare `clean` pre-run come descrizione implicita post-run;
- qualificare `repositorySha=unknown` / state unavailable;
- collegare la provenance al rollback selettivo;
- non serializzare diff raw o path sensibili.

---

## `VALID-ROLL-002` — offline capability isolation / `TEST-073`

**Priorità:** critical

- `requires` è dichiarativo;
- fast non è una security sandbox;
- full-offline non blocca tecnicamente rete/browser/credential access;
- i child ereditano oggi `process.env`;
- minimizzare/sanitizzare environment offline;
- ridefinire correttamente ciò che `TEST-073` prova;
- aggiungere verification della policy effettivamente approvata.

---

## `VALID-ROLL-003` — full-offline completeness invariant

**Priorità:** high

- current manifest coerente ma invariant non enforced;
- evitare che entry offline nuova venga dimenticata dal profilo aggregate;
- introdurre eligibility/exclusion reason esplicita;
- testare profile closure;
- full-offline PASS deve essere relativo a un perimetro machine-checkable.

---

## `VALID-ROLL-004` — result states e conteggi entry/test

**Priorità:** high

- `counts.passed` = manifest entries, non assertion;
- `perTestResults` contiene anche build/checker/compile;
- distinguere workflow states da runner statuses;
- coordinare schema futuro con `IMPL-031`;
- report umano deve usare unità di conteggio corretta.

---

## `VALID-ROLL-005` — timeout process tree

**Priorità:** high

- timeout corrente prova il child diretto;
- aggiungere ownership dei descendant;
- graceful/force bounded sull’intero tree owned;
- caso parent exits ma descendant resta;
- nessun kill per porta/PID non owned;
- stato `termination_unconfirmed` se il drain non è dimostrato.

---

## `VALID-ROLL-006` — documentation verification coverage

**Priorità:** medium

- distinguere link checker, registry checker e controlli strutturali;
- mappare ogni requisito a automatic/manual/historical;
- non usare checker link verde come document-validation globale;
- valutare checker read-only separato per H1/fence/meta/UTF-8 se richiesto ordinariamente;
- riusare TEST-076–079 senza trasformare evidenza storica in PASS corrente.

---

## `VALID-ROLL-007` — route HTTP boundary e `TEST-072`

**Priorità:** high

- matrice Express corretta come target;
- aggiungere TEST-072 ai limiti correnti;
- non implicare reusable route harness già completo;
- usare test HTTP specifico quando realmente disponibile;
- implementazione generic harness resta TEST-072;
- porta dinamica e cleanup owned.

---

# Ordine consigliato di applicazione

```text
1. VALID-ROLL-002
   → offline/credential boundary

2. VALID-ROLL-001
   → working-tree provenance e rollback safety

3. IMPL-029 / TEST-065 / TEST-066 / TEST-067
   → sandbox filesystem reale

4. VALID-ROLL-005
   → process-tree timeout ownership

5. VALID-ROLL-003
   → full-offline closure

6. IMPL-031 / TEST-069 / TEST-070
   → result artifact/ledger

7. VALID-ROLL-004
   → states/count semantics sopra il result contract

8. TEST-072
   → route HTTP harness

9. VALID-ROLL-007
   → allineamento runbook al route harness

10. IMPL-030 / TEST-071
    → frontend lifecycle harness

11. VALID-ROLL-006
    → documentation validation map

12. IMPL-003
    → inventario test completo

13. IMPL-008
    → persistence profile

14. revisione mirata operations/04-validation-and-rollback.md

15. checker documentali

16. aggiornamento cumulativo mappa/ledger dopo report 037
```

L’ordine può essere adattato in fase esecutiva, ma le due priorità iniziali devono restare:

```text
un profilo offline non deve ereditare capacità/credenziali per errore
```

e:

```text
un PASS deve poter essere ricondotto alla working tree realmente testata
```

---

# Verification matrix proposta

## A. Working tree clean

Setup:

```text
HEAD X
git status clean
```

Eseguire entry read-only.

Atteso:

```text
preRun clean
postRun clean
same fingerprint
profile result valido
```

---

## B. Working tree dirty preesistente

Setup:

```text
HEAD X
file A già modificato
```

Eseguire entry read-only.

Atteso:

```text
preRun dirty
postRun dirty
fingerprint invariato
artifact identifica lo stesso stato senza serializzare contenuto A
```

---

## C. Test modifica file tracciato

Setup:

```text
preRun clean
```

Entry sintetica:

```text
modifica file tracked
→ exit 0
```

Atteso target:

```text
postRun dirty
changedDuringRun=true
```

La suite non deve poter presentare:

```text
workingTreeStatus=clean
```

come se fosse lo stato finale.

---

## D. Git unavailable

Simulare:

```text
git rev-parse unavailable
git status unavailable
```

Atteso:

```text
test execution può essere separatamente eseguita
provenanceStatus degraded/unavailable
nessuna frase “validated on commit X”
```

---

## E. Fast con capability dichiarata

Entry:

```text
requires=['external-network']
profiles=['fast']
```

Atteso corrente:

```text
configuration error
```

Preservare.

---

## F. Fast con capability non dichiarata

Fixture sicura che dimostri il limite senza contattare rete reale.

Per esempio il child può verificare che:

```text
sensitive env canary
```

sia o non sia presente secondo il nuovo contratto.

Target:

```text
offline child
→ canary secret absent
```

La verification non deve richiedere una chiamata internet reale.

---

## G. Environment inheritance

Parent environment:

```text
BETFAIR_APP_KEY=CANARY_NOT_REAL
```

Entry offline.

Target dopo `VALID-ROLL-002`:

```text
child non vede la variabile
```

e l’artifact non contiene il valore.

Usare esclusivamente canary sintetiche.

---

## H. Full-offline membership drift

Manifest sintetico:

```text
entry enabled
ordinary offline
profiles=['backend']
```

senza `full-offline`.

Atteso dopo `VALID-ROLL-003`:

```text
configuration failure
```

oppure:

```text
explicit exclusion reason required
```

---

## I. Full-offline intentional exclusion

Entry:

```text
benchmark/non-gate
```

Atteso:

```text
esclusione esplicita valida
```

Non costringere benchmark nel gate ordinario.

---

## J. Entry counts

Profilo:

```text
1 Node suite con 25 assertion
1 build
1 checker
```

Atteso:

```text
passedEntries=3
```

Non:

```text
3 tests passed
```

Il conteggio 25 resta proprietà della suite interna se disponibile.

---

## K. Workflow state vs execution status

Casi:

```text
profile planned
entry disabled
entry selected passed
entry timeout
live observation storica
check not applicable
```

Verificare che il report non li comprima in una sola enum incoerente.

---

## L. Timeout child diretto

Preservare il test corrente:

```text
direct child long-lived
→ timeout
→ failed bounded
```

---

## M. Timeout descendant

Fixture:

```text
parent
→ spawn child long-lived
```

Al timeout:

```text
parent exits
```

Target:

```text
owned descendant terminated
```

oppure:

```text
termination_unconfirmed
```

---

## N. Documentation link checker

Fixture:

```text
missing relative target
missing anchor
legacy mdx
link in fence
external URL
```

Preservare il comportamento attuale.

---

## O. Documentation structural checks

Fixture separata:

```text
2 H1
unbalanced fence
export const meta
invalid UTF-8
mojibake marker
secret canary
```

Verificare con il controllo owner scelto.

Non fingere che `check_documentation_links.py` possieda queste semantiche se restano altrove.

---

## P. Critical Express contract

Harness target:

```text
listen su porta dinamica
request HTTP reale
verifica status
verifica headers
verifica body
close server
```

Nessuna porta fissa e nessun server runtime esistente riusato.

---

## Q. Planned profile

Preservare:

```text
persistence planned
→ exit 2
→ non passed
→ non skipped
```

---

## R. Disabled entry

Verificare:

```text
disabled
→ non eseguita
→ non conteggiata come PASS
```

Il report umano può indicarla come limitation.

---

## S. Result schema

Dopo `TEST-069`:

```text
artifact generato
→ validator schema
→ PASS
```

e casi malformed:

```text
missing repositorySha
invalid counts
invalid timestamp
```

Non creare una seconda schema authority.

---

## T. Result redaction

Dopo `TEST-070`, usare soltanto canary:

```text
fake token
fake URL
fake absolute path
fake Authorization
```

Controllare:

```text
stdout/stderr
command metadata
spawn error
future ledger fields
```

---

## U. Persistence profile

Quando `IMPL-008/029` sono disponibili:

```text
temporary sandbox
→ journal/recovery
→ cleanup success/failure
→ zero write runtime dirs
```

Non anticipare il PASS.

---

## V. Frontend StrictMode

Dopo `IMPL-030`:

```text
mount hook
fake timers
start/stop/remount
late response
session replacement
```

Non sostituire con build Vite.

---

## W. Live validation artifact

Ogni nuova osservazione reale deve usare l’authority di:

```text
docs/validations/README.md
```

con:

```text
data
SHA/baseline
ambiente
scopo
azioni
risultati
non osservato
artefatti
limiti
```

Dato mancante:

```text
non registrato
```

---

# Decisione finale

```text
04-validation-and-rollback.md:

RUNBOOK CON PRINCIPI MOLTO BUONI,
MA IL RUNNER V1 NON DEVE ESSERE PRESENTATO
COME PIÙ ISOLATO O PIÙ PROVENANCE-COMPLETE DI QUANTO SIA.

Punti solidi:
- presenza ≠ execution ≠ PASS
- historical ≠ current
- build ≠ UI
- live ≠ automated
- HTTP status ≠ recovery
- test boundary mirati
- planned profiles fail-closed
- path preflight fail-closed
- child process separati
- output bounded/redacted
- persistence coverage descritta con limiti
- frontend harness mancante dichiarato
- rollback distruttivo vietato
- validation storica separata

Gap principali:
- HEAD SHA non identifica la dirty working tree esatta
- repository state è pre-run, non post-run
- mutazioni test non vengono rilevate dal result artifact
- fast/full-offline non sono capability sandbox
- child offline ereditano process.env
- TEST-073 prova metadata declaration, non impossibilità di rete/browser
- full-offline completeness non è enforced
- counts = manifest entry, non test/assertion
- perTestResults include anche build/checker/compile
- timeout non prova il drain dei descendant
- checklist documentale supera la coverage del link checker
- TEST-072 route HTTP harness resta aperto

Modifiche nuove: 7
Riscrittura completa: no
Revisione mirata: sì
Modularizzazione: no
Nuovi file canonici: nessuno
Priorità complessiva: critica
```

Le cinque distinzioni più importanti da introdurre sono:

```text
HEAD SHA
≠
working tree esatta validata
```

```text
child process separato
≠
capability sandbox
```

```text
requires=[]
≠
prova tecnica di assenza rete/browser/credenziali
```

```text
17 passed nel runner
≠
17 test/assertion passati
```

```text
timeout del parent
≠
process tree drained
```

e per il rollback:

```text
file attualmente dirty
≠
file necessariamente modificato dalla task corrente
```

Il documento deve quindi restare un singolo owner operativo, ma rendere più rigorosi provenance, isolamento e unità di conteggio prima di usare il runner come prova forte di validazione.

---

# Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 35
Da analizzare: 37
Avanzamento: 48,61%

Blocco corrente 033–037:
[✓] 033 operations/02-live-tracking-control.md
[✓] 034 operations/03-betfair-diagnostics.md
[✓] 035 operations/04-validation-and-rollback.md
[ ] 036 operations/05-retention-and-cleanup.md
[ ] 037 reference/01-repository-map.md
```

Il prossimo documento canonico è:

```text
docs/tennis-decision-ui/operations/05-retention-and-cleanup.md
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `VALID-ROLL-004, 006, 007`.
- Task ancora aperte: `VALID-ROLL-001, 002, 003, 005`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
