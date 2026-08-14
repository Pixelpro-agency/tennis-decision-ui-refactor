# Tennis Decision UI — Runner e result ledger

> **Facade:** [Validazione, fixture e test harness](../06-validazione-e-fixture.md)  
> **Owner:** `IMPL-028`, `IMPL-031`  
> **Parte successiva:** [Fixture e sandbox](02-fixture-e-sandbox.md)

## IMPL-028 — Manifest e runner canonico di validazione

**Classificazione:** `NECESSARIA`  
**Stato:** `IMPLEMENTATA E VALIDATA LOCALMENTE`

`IMPL-028` possiede la superficie eseguibile comune della validazione locale:

```txt
manifest
→ preflight
→ selezione profilo
→ process isolation
→ timeout
→ normalizzazione esiti
→ output bounded/redatto
→ run artifact JSON v1
```

Il run artifact JSON v1 fa parte del closeout di `IMPL-028`.

Non è demandato a una futura implementazione di `IMPL-031`.

### Struttura corrente

```txt
scripts/validation/
├── README.md
├── manifest-schema.json
├── result-schema.json
├── run.mjs
├── run.test.mjs
├── test-manifest.json
└── support/
    ├── manifest.mjs
    ├── paths.mjs
    ├── process-runner.mjs
    ├── redaction.mjs
    └── result.mjs
```

### Flusso corrente

```txt
test-manifest.json
→ loadManifest()
→ validateManifest()
→ selezione profilo
→ selezione entry abilitate
→ risoluzione cwd / command
→ esecuzione seriale dei child
→ normalizzazione del risultato per entry
→ buildRunResult()
→ artifact JSON opzionale sotto test-results/
```

Il comando canonico dalla root della repository è:

```bash
node scripts/validation/run.mjs <profile>
```

Sono inoltre disponibili:

```bash
node scripts/validation/run.mjs --list
node scripts/validation/run.mjs <profile> --no-write
node scripts/validation/run.mjs <profile> --json
```

Opzioni riconosciute:

```txt
--manifest
--repo-root
--output
--no-write
--json
--allow-live
--max-output-bytes
--list
--help
```

### Profili

| Profilo        | Stato         | Operatività  |
| -------------- | ------------- | ------------ |
| `fast`         | `implemented` | eseguibile   |
| `backend`      | `implemented` | eseguibile   |
| `frontend`     | `implemented` | eseguibile   |
| `python`       | `implemented` | eseguibile   |
| `full-offline` | `implemented` | eseguibile   |
| `persistence`  | `planned`     | disabilitato |
| `benchmark`    | `planned`     | disabilitato |
| `live`         | `planned`     | disabilitato |

Un profilo pianificato viene bloccato come configurazione non eseguibile.

Non viene contato come `skipped` o `passed`.

`live` è inoltre marcato `liveRequired`; il guardrail `--allow-live` esiste, ma il profilo resta disabilitato finché non viene implementato esplicitamente.

### Inventario corrente del manifest

La superficie registrata comprende:

```txt
validation
→ validation-runner-self-test

documentation
→ documentation-registry-consistency
→ documentation-link-check

backend
→ backend-server
→ backend-match-tracker
→ backend-evidence-route
→ backend-source-identity-confirmation

frontend
→ frontend-use-match-polling
→ frontend-use-betfair-json
→ frontend-dashboard-connections
→ frontend-source-identity-presentation
→ frontend-build

python
→ python-compileall
→ python-launcher-unittest
→ python-betfair-graph-url
→ python-betfair-diagnostic-redaction
→ python-betfair-cdp-url
```

È inoltre presente una entry disabilitata:

```txt
backend-commit-id
```

La motivazione registrata è il debito di sandbox del relativo test, che scrive sotto `process.cwd()` senza cleanup garantito.

Il manifest non rappresenta un inventario completo di ogni test legacy della repository.

### Contratto delle entry

Ogni entry dichiara almeno:

```txt
id
label
area
owner
requirementIds
command
cwd
type
profiles
timeoutSec
serialGroup
fixtures
mutatesFilesystem
liveRequired
enabled
```

Sono inoltre riconosciuti:

```txt
disabledReason
pathChecks
requires
```

Tipi ammessi:

```txt
node-test
python-unittest
compile-check
build
documentation-check
runner-self-test
```

Il primo token di `command` deve appartenere all'allow-list prevista dal runner.

I placeholder portabili sono:

```txt
${NODE}
${PYTHON}
${NPM}
```

con espansione differenziata per piattaforma.

### Preflight

Prima di avviare qualunque child process vengono controllati almeno:

```txt
manifest object
profiles object
entries array

profilo noto
reason per profili disabilitati

campi obbligatori
ID entry univoci
formato ID entry
requirementIds nel formato TEST-NNN
ownership univoca dei TEST-ID
command non vuoto
command allow-listed
command + cwd non duplicati
cwd valido
type ammesso
profili referenziati esistenti
timeoutSec valido
serialGroup valido
fixtures array
mutatesFilesystem boolean
liveRequired boolean
enabled boolean
disabledReason per entry disabilitata
pathChecks array
requires array
```

Quando una root repository è disponibile vengono verificati anche:

```txt
cwd esistente e interno alla repository
pathChecks esistenti e interni alla repository
fixtures esistenti e interne alla repository
```

Un path mancante è un errore di configurazione e blocca il run prima dei child.

La risoluzione dei path impedisce l'uscita dalla root consentita anche quando il target esistente viene risolto tramite real path.

### Profili offline

Nel profilo `fast` non sono ammesse entry abilitate che dichiarino in `requires`:

```txt
browser
credentials
external-network
tracking
```

Una entry `liveRequired` non può appartenere a `fast`.

Una entry abilitata `liveRequired` non può appartenere a `full-offline`.

Questi controlli validano il manifest; non trasformano i child process in un sandbox di sicurezza.

### Process isolation

Ogni entry viene eseguita in un child process separato.

La prima versione resta seriale:

```txt
entry 1
→ completamento
→ entry 2
→ completamento
→ ...
```

`serialGroup` è già parte del contratto e del risultato, ma non governa ancora uno scheduler concorrente.

L'esecuzione Node usa:

```txt
shell: false
```

Su Windows i wrapper `.cmd` e `.bat` vengono instradati tramite `ComSpec` con argomenti espliciti, permettendo l'esecuzione di `npm.cmd` senza cambiare il modello generale di process isolation.

### Environment dei child

I child ricevono l'environment del processo padre e i marker:

```txt
CI
NO_COLOR=1
TDUI_VALIDATION_RUNNER=1
TDUI_VALIDATION_PROFILE=<profile>
```

I metadata `requires` non rimuovono automaticamente variabili dall'environment.

La minimizzazione dell'environment non appartiene al closeout corrente di `IMPL-028`.

### Timeout

Ogni entry dichiara un `timeoutSec`.

Al superamento:

```txt
timeout
→ richiesta di terminazione
→ grace period bounded
→ escalation forzata se necessaria
→ status timeout
```

Il run complessivo diventa `failed` se almeno una entry fallisce o va in timeout.

### Output bounded e redaction

`stdout` e `stderr` vengono raccolti con un limite per stream e comando.

Default:

```txt
65.536 byte
```

Il runner consente un override bounded.

Prima di entrare nel result, gli stream vengono redatti per ridurre l'esposizione di:

```txt
repository root
home directory
temporary directory
path locali noti
Bearer token
Authorization
Cookie / Set-Cookie
api key / app key
token
password
URL HTTP/HTTPS
path assoluti locali comuni
```

Il result registra anche metadata di troncamento e byte originali.

La redaction non sostituisce la regola che manifest e comandi non devono contenere segreti.

### Stati normalizzati delle entry

Il runner v1 produce:

```txt
passed
failed
timeout
```

Il run-level contiene anche:

```txt
skipped: 0
```

ma non esiste uno stato per-entry `skipped` nel contratto v1.

### Exit code

| Exit code | Significato                                                                    |
| --------: | ------------------------------------------------------------------------------ |
| `0`       | tutte le entry selezionate sono passate                                        |
| `1`       | almeno una entry è fallita o è andata in timeout                               |
| `2`       | errore d'uso/configurazione, manifest/path non valido o profilo non eseguibile |

### Closeout locale

La validazione locale di `IMPL-028` resta chiusa.

I profili eseguibili del runner sono stati portati al closeout locale:

```txt
fast
backend
frontend
python
full-offline
```

I profili:

```txt
persistence
benchmark
live
```

non fanno parte di quel closeout e restano separatamente pianificati.

Il closeout non dichiara copertura completa di tutti i test legacy.

### TEST-ID di IMPL-028

Il self-test del runner possiede la copertura dei requirement:

```txt
TEST-060
TEST-061
TEST-062
TEST-063
TEST-064
TEST-068
TEST-073
```

I contratti verificati includono:

```txt
validazione manifest
preflight path prima dell'esecuzione
process isolation
normalizzazione exit code
timeout bounded
enumerazione esplicita delle suite Python
ownership univoca dei TEST-ID
fast senza browser/rete/credenziali/tracking
output bounded/redatto
path artifact confinato a test-results/
run artifact normalizzato
```

`IMPL-028` non viene riaperta per completare il ledger storico.

---

## IMPL-031 — Validation result contract e ledger

**Classificazione:** `NECESSARIA`  
**Stato:** `CONFERMATA E APPROVATA — NON COMPLETATA — COPERTURA PARZIALE`

`IMPL-031` non parte da zero.

Il runner di `IMPL-028` produce già il run artifact JSON v1 necessario all'esecuzione della suite.

La responsabilità residua di `IMPL-031` è completare il result contract e introdurre il ledger storico/consultabile.

### Boundary con IMPL-028

```txt
IMPL-028
→ possiede esecuzione
→ possiede normalizzazione
→ possiede v1 run artifact

IMPL-031
→ estende il result contract
→ possiede ledger storico
→ possiede latest-result authority
→ possiede semantiche di coverage non ancora rappresentate
```

`IMPL-031` non è una dipendenza hard del runner già completato.

Il boundary evita il ciclo:

```txt
028 richiede 031 per produrre artifact
↔
031 richiede artifact di 028 per costruire il ledger
```

Il modello corretto è invece:

```txt
028
→ produce run artifact v1

031
→ consuma/estende quel contratto
→ costruisce ledger e stato storico
```

### Run artifact v1 già implementato

Il path predefinito è:

```txt
test-results/<timestamp>-<short-sha>-<profile>.json
```

`test-results/` resta esclusa da Git.

La scrittura è opzionale:

```txt
default
→ artifact scritto

--no-write
→ nessun artifact
```

Il path richiesto deve essere repository-relative e sotto `test-results/`.

La scrittura usa un file temporaneo seguito da rename.

### Campi già presenti

Il run result v1 contiene:

```txt
schemaVersion
repositorySha
profile
startedAt
completedAt
durationMs
environment
manifestPath
artifactPath
counts
status
warnings
limits
workingTreeStatus
changedPathCount
perTestResults
```

`environment` contiene:

```txt
platform
architecture
nodeVersion
```

`workingTreeStatus` è normalizzato in:

```txt
clean
dirty
unavailable
```

Una working tree `dirty` viene registrata come contesto e non viene trasformata automaticamente in failure.

### Counts correnti

```txt
total
passed
failed
timedOut
skipped
```

Nella versione v1:

```txt
skipped = 0
```

`passed`, `failed` e `timedOut` contano entry del manifest eseguite, non assertion interne dei singoli test.

### Per-command result già presente

Ogni entry eseguita produce metadata come:

```txt
id
label
area
owner
requirementIds
type
serialGroup
mutatesFilesystem
liveRequired
command
cwd
status
exitCode
signal
timedOut
spawnError
startedAt
completedAt
durationMs
stdout
stderr
stdoutTruncated
stderrTruncated
stdoutOriginalBytes
stderrOriginalBytes
```

Gli stati per-entry correnti sono:

```txt
passed
failed
timeout
```

### Result schema già presente

`result-schema.json` descrive il nucleo del result v1.

La presenza dello schema non implica che il runner validi automaticamente il JSON generato contro quel file prima della scrittura.

### Sicurezza già presente

Gli stream runtime sono:

```txt
bounded
redacted
```

Il result conserva comunque metadata dichiarativi provenienti dal manifest, tra cui `command` e `cwd`.

Il result v1 non deve quindi essere descritto come garanzia assoluta contro qualunque valore sensibile arbitrariamente inserito nei metadata.

### Parti ancora mancanti

`IMPL-031` resta aperta perché non risulta implementata una superficie che:

```txt
indicizzi run storici
mantenga latest result per profilo
esponga query degli ultimi esiti
colleghi stabilmente TEST-ID a ultimo risultato
mantenga una history consultabile come ledger
rappresenti in modo completo planned/blocked/skipped/not_applicable/live_observed
promuova una authority stabile dell'ultimo risultato
```

Restano inoltre non presenti come contratto top-level completo:

```txt
commands
blocked
buildResult
browserValidationStatus
```

La build frontend corrente è una normale entry dentro `perTestResults`; non esiste un blocco top-level `buildResult`.

Non esiste un `browserValidationStatus` perché il profilo browser/live non è implementato.

### Semantiche da completare

Il ledger deve distinguere un requirement documentato ma non eseguito da un requirement realmente passato.

Un TEST-ID pianificato non può diventare `passed` soltanto perché non è presente nella suite selezionata.

Le semantiche avanzate devono poter distinguere almeno, quando applicabili:

```txt
planned
blocked
skipped
live_observed
not_applicable
passed
failed
timeout
```

senza alterare retroattivamente il significato del run artifact v1.

### TEST-069 e TEST-070

```txt
TEST-069
→ copertura parziale
→ requirement non chiuso

TEST-070
→ copertura parziale
→ requirement non chiuso
```

La copertura parziale deriva dal fatto che il run artifact contiene già:

```txt
SHA
profile
counts
limits
environment
workingTreeStatus
per-command result
stdout/stderr bounded e redatti
```

I due requirement non diventano PASS finché il contratto complessivo previsto per `IMPL-031` non viene chiuso.

### Human report

Il result JSON non sostituisce il resoconto umano quando il workflow lo richiede.

Restano concetti distinti:

```txt
machine-readable run artifact
≠ human execution report
≠ historical result ledger
```

### Dipendenze e relazioni

La relazione primaria è:

```txt
IMPL-028
→ produce il run artifact v1

IMPL-031
→ lo estende e lo storicizza
```

Le estensioni condivise verso `IMPL-003`, `IMPL-005`, `IMPL-008`, `IMPL-012`, `IMPL-013` e `CODE-005` restano centralizzate nella [facade](../06-validazione-e-fixture.md).

---

## Invarianti del child

```txt
IMPL-028 resta completata

v1 run artifact appartiene a IMPL-028

IMPL-031 resta aperta

v1 run artifact
≠ historical ledger

TEST-069
≠ PASS completo

TEST-070
≠ PASS completo

profilo planned
≠ skipped
≠ passed

per-command build entry
≠ buildResult top-level

nessun browser/live artifact viene inventato
```
