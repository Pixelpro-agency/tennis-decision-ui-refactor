# Tennis Decision UI — Validazione, fixture e test harness

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-028…031
> **Righe originali:** 3055–3837
> **Parte precedente:** [Frontend, sessione live e polling](05-frontend-session-polling.md)
> **Parte successiva:** [Migrazione documentale e normalizzazione dei registri](07-documentazione-e-normalizzazione.md)

<!-- BEGIN ORIGINAL CONTENT -->
## 21. Implementazioni approvate dal Punto 7

**Baseline:** `275008a5cd6451f24c6895068639ee3055395986`
**Stato:** `APPROVATE`

### IMPL-028 — Manifest e runner canonico di validazione

**Classificazione:** `NECESSARIA`
**Stato:** `IMPLEMENTATA E VALIDATA LOCALMENTE`
**Priorità:** critica

### Problema

Il repository non possiede una lista eseguibile unica dei test e dei controlli.

Backend, frontend e Python espongono comandi diversi, mentre il runbook copia manualmente i path.

### Obiettivo

Creare un runner locale deterministico che:

```txt
legge un manifest
→ valida path e schema
→ seleziona un profilo
→ esegue i comandi in processi isolati
→ applica timeout e serial group
→ normalizza gli esiti
→ produce un result artifact bounded
```

### Struttura proposta

```txt
scripts/validation/
├── test-manifest.json
├── run.mjs
├── result-schema.json
└── support/
```

Non è richiesto un package root generale prima della prima versione.

Il comando canonico può essere:

```bash
node scripts/validation/run.mjs <profilo>
```

### Profili minimi

```txt
fast
→ test puri e rapidi
→ nessun browser
→ nessuna rete esterna
→ nessun tracking

backend
→ test backend offline

frontend
→ test frontend + build

python
→ unittest + compile check

persistence
→ harness IMPL-008

full-offline
→ tutte le verifiche deterministiche

benchmark
→ misure IMPL-013
→ mai gate ordinario

live
→ soltanto esplicito
→ mai incluso per default
```

### Manifest entry

Campi minimi:

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

### Strategia di migrazione

La prima versione non importa i test legacy nello stesso processo.

Ogni entry viene eseguita come child process separato:

```txt
cwd esplicita
command esplicito
timeout
stdout/stderr bounded
exit code
signal
startedAt/completedAt
durationMs
```

Vantaggi:

- nessuna contaminazione dei global state;
- `process.exitCode` resta isolato;
- i mini-runner esistenti continuano a funzionare;
- la migrazione non richiede una riscrittura massiva;
- il runner può essere introdotto prima delle correzioni funzionali.

### Preflight obbligatorio

Prima di avviare la suite:

```txt
manifest valido
path esistenti
ID univoci
profili validi
timeout finiti
cwd interna al repository
command allow-list
fixture esistenti
```

Un path mancante è un errore di configurazione, non un test fallito.

### Process isolation e serial group

Entry con risorse condivise dichiarano un `serialGroup`, per esempio:

```txt
filesystem-persistence
local-http-port
launcher-global-state
frontend-build
```

Il runner può parallelizzare soltanto entry che non condividono lo stesso gruppo.

La prima versione può essere interamente seriale per ridurre rischio e complessità.

### Timeout

Ogni entry possiede un timeout esplicito.

In caso di superamento:

```txt
terminate child
→ escalation bounded se necessario
→ stato timeout
→ nessun loop infinito
→ output bounded
```

### Stati normalizzati

```txt
planned
implemented
executed
passed
failed
blocked
skipped
live_observed
not_applicable
```

`planned` non è un esito di esecuzione.

### Vincoli

Il runner non deve:

- avviare implicitamente Chrome;
- usare credenziali;
- effettuare login;
- avviare tracking live;
- modificare persistence reale;
- inventare PASS per test assenti;
- correggere automaticamente documenti o manifest;
- inglobare fixture, replay e benchmark in un unico modulo monolitico.

### Dipendenze

```txt
IMPL-005
→ coerenza registri

IMPL-031
→ result artifact

IMPL-003
→ test map
```

### Test minimi

```txt
TEST-060
TEST-061
TEST-062
TEST-063
TEST-064
TEST-068
TEST-073
```

### Implementazione iniziale — 2026-08-03

File introdotti:

```txt
scripts/validation/test-manifest.json
scripts/validation/manifest-schema.json
scripts/validation/result-schema.json
scripts/validation/run.mjs
scripts/validation/run.test.mjs
scripts/validation/support/
scripts/validation/README.md
```

Profili eseguibili:

```txt
fast
backend
frontend
python
full-offline
```

Profili riconosciuti ma non eseguibili:

```txt
persistence → dipende da IMPL-008
benchmark → dipende da IMPL-013
live → non implementato e mai implicito
```

Contratti applicati:

```txt
manifest preflight completo
→ ID e comando univoci
→ cwd/path/fixture interne alla repository
→ command allow-list con shell:false
→ child process separato
→ timeout con escalation bounded
→ stdout/stderr redatti e limitati
→ artifact JSON sotto test-results/
```

Il manifest iniziale registra la superficie verificata nel Punto 7 e i checker documentali. Non viene dichiarato inventario completo di ogni test legacy: il completamento della mappa test ↔ owner ↔ documento resta `IMPL-003`.

Esito dei test isolati del runner nel pacchetto di consegna:

```txt
17 passati
0 falliti
```

È stata eseguita anche una prova strutturale dei cinque profili su repository sintetica: `fast 6/6`, `backend 6/6`, `frontend 5/5`, `python 5/5`, `full-offline 19/19`. La prova non contiene il codice applicativo e non viene registrata come PASS delle suite reali.

La chiusura operativa richiede ancora l'esecuzione dei profili sulla working tree Windows dell'utente. Nessun profilo live è stato eseguito o simulato.

#### Addendum post-validazione locale — 2026-08-03

Il primo preflight reale ha correttamente bloccato tutti i profili con exit code `2`, perché il manifest conteneva due percorsi storici inesistenti:

```txt
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs
```

La prova sintetica precedente aveva creato i path dichiarati dal manifest e quindi validava il runner, non la correttezza dell'inventario applicativo. Le due entry sono state rimosse; non sono state sostituite con percorsi dedotti.

Conteggi correnti delle entry abilitate:

```txt
fast → 6
backend → 4
frontend → 5
python → 5
full-offline → 17
```

Journal e recovery restano una lacuna esplicita da coprire con `IMPL-003` e `IMPL-008`.

#### Esito finale della validazione locale

Dopo la correzione del manifest e l'hotfix Windows per l'invocazione di `npm.cmd`, i profili eseguibili sono stati rieseguiti sulla working tree reale con esito positivo:

```txt
fast → PASS
backend → PASS
frontend → PASS
python → PASS
full-offline → PASS
```

La validazione locale di `IMPL-028` è quindi completata. I profili `persistence`, `benchmark` e `live` restano non implementati e non sono inclusi implicitamente in questo esito.

---

### IMPL-029 — Fixture catalog e sandbox condivisa

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** alta

### Problema

Le fixture sono prevalentemente inline e le directory temporanee non sono gestite in modo uniforme.

Alcuni contratti condivisi rischiano di divergere fra test, mentre almeno un test scrive sotto `process.cwd()` senza cleanup finale.

### Obiettivo

Fornire:

```txt
catalogo fixture versionate
factory condivise quando utili
schema e provenance
sandbox temporanea
cleanup garantito
protezione delle directory runtime
```

### Struttura proposta

```txt
test/
├── fixtures/
│   ├── sofa/
│   ├── betfair/
│   ├── evidence/
│   ├── persistence/
│   └── frontend/
├── factories/
├── manifests/
└── schemas/
```

### Metadata fixture

```txt
fixtureId
schemaVersion
kind
origin
redactionStatus
expectedInvariants
createdFor
```

Valori `origin`:

```txt
constructed
sanitized_capture
```

Una capture sanitizzata non viene accettata senza revisione redaction.

### Cosa resta locale

Factory piccole e specifiche del singolo modulo possono restare nello stesso file test.

Esempi:

```txt
oggetto da tre campi
fake logger locale
semplice response builder
```

Il catalogo condiviso serve soltanto quando il contratto viene riutilizzato o deve rappresentare una sequenza temporale stabile.

### Sandbox

Ogni test che scrive riceve una root temporanea:

```txt
os.tmpdir / tempfile
→ directory univoca
→ path interni derivati
→ cleanup in finally
```

Il runner registra soltanto un identificatore opaco della sandbox, non il path completo nel result pubblico.

### Directory vietate nei profili offline

```txt
backend/match_history
backend/source_identity_confirmations.json
backend/betfair_cache
backend/scraper_cache
backend/betfair_network_dump
profili Chrome
launcher/.runtime reale
```

### Relazioni

```txt
IMPL-008
→ fixture persistence/recovery

IMPL-012
→ fixture temporali e replay

IMPL-030
→ fixture frontend

IMPL-013
→ input benchmark controllati
```

Queste implementazioni condividono utility, ma non vengono fuse in un mega-harness.

### Test minimi

```txt
TEST-065
TEST-066
TEST-067
```

---

### IMPL-030 — Frontend interaction test harness

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica per il Punto 6

### Problema

I test frontend correnti verificano soprattutto utility pure.

Non esiste un ambiente DOM in cui montare hook e componenti e osservare lifecycle asincroni.

### Stack approvato

```txt
Vitest
jsdom
React Testing Library
@testing-library/user-event quando necessario
fake timer Vitest
```

L’introduzione deve essere minima e locale al frontend.

### Responsabilità

Il harness deve coprire:

```txt
StrictMode
mount/unmount
fake timer
AbortController
request in flight
session switching
Stop
snapshot frozen
modale Source Identity
indicatori live
persistence UI
Market Reactions presentation
```

### Network

Le request vengono intercettate con fake controllati o adapter iniettati.

Nessun test frontend offline chiama:

- backend locale reale;
- SofaScore;
- Betfair;
- internet.

### Time control

```txt
fake timer
→ avanzamento esplicito
→ flush Promise controllato
→ nessun sleep reale
```

### StrictMode

Il harness deve poter montare i componenti sotto `React.StrictMode` per verificare:

```txt
mount
cleanup
remount
→ una sola catena polling effettiva
```

### Cosa non sostituisce

Non sostituisce:

- build Vite;
- smoke browser reale;
- responsive visuale;
- collaudo live;
- classificazione backend degli stati.

### Test minimi

```txt
TEST-044…058
TEST-071
```

`TEST-059` conserva anche una componente manuale/visuale responsive.

---

### IMPL-031 — Validation result ledger e artefatti JSON

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** alta

### Problema

Gli output correnti sono umani e non consentono di collegare in modo affidabile un esito a:

```txt
SHA
profilo
ambiente
comando
durata
limiti
```

### Artefatto locale

```txt
test-results/
└── <timestamp>-<sha>-<profile>.json
```

La directory resta esclusa da Git salvo richiesta esplicita di archiviazione controllata.

### Schema minimo

```txt
schemaVersion
repositorySha
profile
startedAt
completedAt
durationMs
environment
workingTreeStatus
commands
passed
failed
skipped
blocked
warnings
limits
perTestResults
buildResult
browserValidationStatus
```

### Per-command result

```txt
id
commandLabel
status
exitCode
signal
timedOut
durationMs
stdoutSummary
stderrSummary
limits
```

`stdoutSummary` e `stderrSummary` sono bounded e redatti.

### Sicurezza

Il result non contiene:

- segreti;
- cookie;
- token;
- URL operative complete;
- profili;
- path locali sensibili;
- payload reali;
- stack illimitati.

### Relazione con il report umano

Il result JSON non sostituisce:

```txt
file modificati
comandi eseguiti
exit code
pass/fail/skip/warning
limiti
massimo tre tentativi
stato working tree
PRONTO PER LA REVISIONE DELLA CHAT ANALISI
```

`fileModificati.md` resta parte del workflow Desktop quando richiesto.

### Stato dei TEST-ID

Il ledger può registrare soltanto test realmente presenti nel manifest.

Un TEST-ID documentato ma non implementato resta:

```txt
planned
```

Non viene emesso come skipped/passato da una suite che non lo possiede.

### Test minimi

```txt
TEST-069
TEST-070
```

---

## 21.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-003 — Test map machine-checkable

La matrice test ↔ modulo ↔ documento viene alimentata dal manifest di `IMPL-028`.

Campi:

```txt
testId
area
owner
requirementIds
command
type
profile
timeoutSec
serialGroup
fixtures
mutatesFilesystem
liveRequired
status
lastResultSha
```

Il checker non dichiara PASS senza un result artifact coerente.

### Estensione di IMPL-005 — Coerenza completa dei registri

Verificare:

```txt
insieme ID
stati incompatibili
prefissi sconosciuti
SHA baseline
ultimo Punto
ultimo TEST-ID
ultimo IMPL-ID
ultima DEC
range sintetici
prossimo punto
```

Il controllo resta read-only.

### Estensione di IMPL-008 — Profilo persistence

Il harness persistence/recovery viene esposto come profilo del runner:

```txt
node scripts/validation/run.mjs persistence
```

Continua a usare directory temporanee e non tocca lo storage runtime.

### Estensione di IMPL-012 — Fixture e replay

Le fixture temporali e i replay vengono registrati nel catalogo di `IMPL-029`.

Il replay resta un modulo dedicato e non viene incorporato direttamente nel runner.

Il runner lo invoca come comando isolato.

### Estensione di IMPL-013 — Profilo benchmark

Il profilo benchmark registra:

```txt
SHA
ambiente
fixtureId
iterazioni
warmup
mediana
p95
dimensioni
tolleranza
```

Non è un gate ordinario e non usa dati live.

### Estensione di CODE-005 — Lint verificabile

Il comando lint deve essere:

```txt
realmente configurato e testato
oppure
rimosso dalla superficie ufficiale
```

Il full lint non diventa obbligatorio finché la baseline esistente non è stata classificata.

## 21.2 Ordine approvato

```txt
IMPL-005 esteso
→ IMPL-028 manifest e runner
→ IMPL-029 fixture e sandbox
→ IMPL-030 frontend harness
→ IMPL-003 test map
→ IMPL-031 result ledger
→ IMPL-008 persistence profile
→ IMPL-012 replay profile
→ IMPL-013 benchmark profile
→ TEST-060…075
→ eventuale CI offline
→ raggruppamento delle task Punti 1–7
```



---

<!-- END ORIGINAL CONTENT -->
