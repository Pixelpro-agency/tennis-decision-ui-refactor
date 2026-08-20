> **Parte 6 di 7 — Validazione e test**
> Secondo audit — Punto 7: runner, manifest, fixture, sandbox, harness frontend, result ledger e TEST-060…075.
> [Indice](../03-audit-codice.md) · [Parte 5](05-frontend-session-shell.md) · [Parte 7](07-post-audit-e-riallineamenti-storici.md)

## 22. Secondo audit del codice — Punto 7: Test e strutture mancanti

**Baseline:** `275008a5cd6451f24c6895068639ee3055395986`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

#### Perimetro del checkpoint originario

Il record storico del Punto 7 era stato costruito verificando:

```txt
backend/package.json
frontend/package.json
README.md
.gitignore

backend/src/server.js
backend/src/server.test.mjs
backend/src/sofa/matchHistory/commitId.test.mjs
backend/src/sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
backend/src/routes/evidence/evidenceRoute.test.mjs

launcher/tests/test_launcher.py
scrapers/betfair/graph_url_test.py

frontend/src/hooks/useMatchPolling.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/utils/dashboardConnections.test.mjs


implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/06-implementazioni-proposte.md
implementazioni/99-decisioni-utente.md
```

Sul commit del checkpoint erano stati inoltre controllati status check, workflow run e coerenza del diff del Punto 6. L’esito storico era:

```txt
nessun status check associato al commit
nessun workflow run associato al commit
suite non eseguite durante l’audit
```

Queste affermazioni restano parte del record del checkpoint e non vengono proiettate automaticamente sul repository successivo.

### Classificazione usata

Per ogni rilievo sono stati distinti:

```txt
bug confermato
limite noto
miglioria utile
documentazione mancante
struttura completamente assente
nessuna azione necessaria
decisione dell’utente richiesta
```

Le decisioni del Punto 7 sono state approvate integralmente dall’utente.

### Esito generale

#### Snapshot del checkpoint originario

Al checkpoint del Punto 7 il progetto possedeva numerosi test utili, ma non ancora un sistema unitario di validazione.

Erano presenti:

```txt
test Node eseguiti come singoli file
test Python unittest
build frontend
node --check
py_compile / compileall
smoke HTTP locali
checklist manuali
collaudi live documentati
```

Mancavano allora:

```txt
runner canonico
manifest eseguibile
profili di esecuzione
test map machine-checkable
fixture catalogate
frontend interaction harness
timeout uniforme
risultati machine-readable
baseline ripetibili
stato corrente per ogni TEST-ID
```

Non era quindi possibile dichiarare una percentuale di coverage attendibile o una suite completa passata nel checkpoint.

#### Implementazione

La prima infrastruttura canonica di validazione è presente sotto `scripts/validation/`.

Il flusso corrente è:

```txt
test-manifest.json
→ validazione di profili, entry, ID, path e comandi
→ selezione del profilo
→ una entry per child process
→ timeout per entry
→ cattura bounded e redazione stdout/stderr
→ risultato aggregato
→ artifact JSON opzionale sotto test-results/
```

Sono dichiarati come `implemented`:

```txt
fast
backend
frontend
python
full-offline
```

Sono dichiarati come `planned` e disabilitati:

```txt
persistence
benchmark
live
```

Il manifest corrente è una **prima lista eseguibile**, non l’inventario totale dei test del repository. Lo stesso README del runner dichiara che le suite modulari di persistence non sono ancora tutte registrate e che l’espansione completa test ↔ owner ↔ documento resta fuori dalla prima versione.

La superficie presenta inoltre questi limiti:

```txt
nessuna raccolta coverage nel runner
nessun profilo persistence abilitato
nessun profilo benchmark abilitato
nessun profilo live abilitato
nessun fixture catalog condiviso sotto test/
nessun ledger storico completo degli esiti
nessuna CI configurata
full-offline non equivale all’inventario completo di ogni test offline esistente
```

Sono invece già presenti coperture parziali che il checkpoint non possedeva:

```txt
test React di componenti con react-test-renderer
test lifecycle di hook con StrictMode e AbortController
HTTP reale su porta dinamica in server.test.mjs
artifact JSON versionato e bounded per singola esecuzione
redazione di path, URL e marker sensibili nel runner
```

Queste presenze non vengono elevate automaticamente a chiusura dei relativi TEST-ID: il documento distingue sempre **implementazione presente**, **registrazione nel manifest**, **esecuzione** e **PASS di una specifica esecuzione**.

### Parti solide — osservazioni del checkpoint conservate

Questa sezione conserva le tecniche che il Punto 7 aveva già riconosciuto come utili e ne registra lo stato implementativo pertinente al documento.

#### Test Node e testability locale

Il checkpoint aveva rilevato l'uso ricorrente di:

```txt
node:assert/strict
dependency injection
fake writer
fake timer
fake logger
factory locali
```

La decisione associata era preservare i test locali utili e registrarli nel runner invece di riscriverli in massa.

`server.test.mjs` usa `node:assert/strict`, injection di dipendenze e server locali; copre, fra l'altro, import senza apertura del listener, recovery prima del listen, recovery fatale, shutdown e HTTP reale su porta dinamica.

#### Isolamento già presente in una parte dei test

Il checkpoint aveva osservato tecniche come:

```txt
os.tmpdir / tempfile
mkdtemp
finally cleanup
server HTTP in-process
porta 0 o ricerca di porta libera
mock subprocess
ripristino delle variabili globali
```

Queste tecniche restano coerenti con il runner corrente: i self-test di `scripts/validation/run.test.mjs` costruiscono repository temporanee con `mkdtemp` e cleanup in `finally`, mentre `server.test.mjs` usa porte dinamiche.

La presenza di questi casi corretti non implica che l'isolamento sia uniforme: il debito corrente di `commitId.test.mjs` è documentato separatamente sotto `TEST-065`.

#### Python standard library

La scelta storica di mantenere `unittest` resta coerente con l'implementazione: il manifest registra esplicitamente moduli `unittest` Python e non richiede una migrazione a pytest.

#### Offline, browser e live restano distinti

La distinzione storica fra:

```txt
test automatico
build/check
smoke HTTP
verifica browser
collaudo live
```

resta necessaria. Il runner corrente implementa profili offline e mantiene `live` separato, `planned` e disabilitato.

Un collaudo storico non diventa automaticamente un PASS di una specifica esecuzione e un profilo offline non dimostra una verifica browser/live.

### WORKFLOW-004 — I registri possono divergere durante gli aggiornamenti

**Classificazione storica:** `BUG DOCUMENTALE CONFERMATO`  
**Stato storico:** `COMPLETATO`  
**Priorità storica:** alta per l’affidabilità del registro

Dopo il Punto 6, i contenuti dettagliati erano presenti, ma nella Todo erano rimasti:

```txt
SHA registrato del Punto 4
range IMPL-001…024
```

mentre erano già stati approvati e inseriti:

```txt
baseline Punto 6
IMPL-025…027
```

Questo non modificava il codice, ma mostrava che l’aggiornamento manuale dei registri poteva lasciare intestazioni sintetiche incoerenti.

#### Decisione approvata al checkpoint

Estendere `IMPL-005` per controllare:

```txt
SHA baseline dei registri
ultimo Punto completato
ultimo TEST-ID
ultimo IMPL-ID
ultima DEC
range sintetici
prossimo punto
stati incompatibili
```

Il controllo doveva restare read-only.

#### Implementazione

`scripts/check_registry_consistency.py` esiste ed è registrato nel manifest come entry `documentation-registry-consistency`, inclusa nei profili `fast` e `full-offline`.

Il checker corrente confronta le righe sintetiche della Todo con le owner card sotto `implementazioni/`, controlla prefissi, duplicati, alcuni metadati di sintesi e contraddizioni di stato. Non è però la test map completa del repository e non sostituisce l’inventario test ↔ owner ↔ documento.

### TEST-003 — Runner, manifest e comando test canonico; inventario completo ancora aperto

**Classificazione storica:** `STRUTTURA INIZIALMENTE ASSENTE; PRIMA VERSIONE IMPLEMENTATA`  
**Stato:** `RUNNER E MANIFEST PRESENTI; INVENTARIO COMPLETO NON DIMOSTRATO`  
**Priorità storica:** media-alta per il completamento dell’inventario

Al checkpoint originario mancava un coordinatore unitario per backend Node, frontend, Python, persistence e validazioni documentali. I test legacy usavano mini-runner differenti e gli elenchi eseguibili erano mantenuti manualmente.

La decisione approvata fu introdurre `IMPL-028` senza riscrivere in massa i test esistenti.

#### Implementazione

La prima infrastruttura esiste ora sotto:

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

Il comando canonico è:

```txt
node scripts/validation/run.mjs <profile>
```

Sono inoltre supportati:

```txt
--list
--no-write
--json
--manifest <path>
--repo-root <path>
--output <path>
--max-output-bytes <n>
--allow-live
```

Il runner:

```txt
valida il manifest prima dell’esecuzione
seleziona soltanto entry enabled del profilo
risolve cwd, pathChecks e fixture dentro la root
espande placeholder NODE/PYTHON/NPM
esegue ogni entry in un child process separato
applica timeout per entry
normalizza passed / failed / timeout
scrive opzionalmente un artifact JSON
```

La versione corrente è seriale. `serialGroup` è registrato come metadata, ma non viene usato per parallelizzare la suite.

Il manifest contiene una superficie selezionata di backend, frontend, Python, build e checker documentali. Non va interpretato come inventario totale: il README segnala esplicitamente che le suite modulari di persistence non sono ancora tutte registrate.

`full-offline` significa quindi **tutte le entry offline abilitate nel manifest corrente**, non **tutti i test offline presenti nella repository**.

### Ampliamento collegato a CODE-005 — Superficie lint

**Classificazione storica:** `BUG CONFERMATO`  
**Stato al checkpoint:** script pubblicato ma configurazione non utilizzabile  
**Stato:** `NON CHIUDIBILE COME PASS DAL SOLO CODICE`

Al checkpoint `frontend/package.json` esponeva `npm run lint`, mentre nei percorsi standard controllati non risultava una configurazione ESLint utilizzabile.

#### Implementazione

Il package frontend corrente espone ancora:

```txt
"lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
```

e include dipendenze ESLint e plugin React.

Nella superficie implementata:

```txt
frontend/package.json
directory frontend/
root del repository
```

non è presente un file di configurazione ESLint e `package.json` non contiene una proprietà `eslintConfig`.

La sola presenza dello script e delle dipendenze non consente di marcare `TEST-075` come passato o chiuso.

#### Decisione storica conservata

La decisione del Punto 7 era di non rendere il full lint un gate obbligatorio prima di una baseline pulita e di non lasciare una superficie ufficiale apparentemente supportata senza configurazione realmente eseguibile.

### Discovery Python non uniforme

**Classificazione storica:** `BUG DELLA DISCOVERY`  
**Stato:** `ENUMERAZIONE ESPLICITA IMPLEMENTATA NEL MANIFEST`

I test Python continuano a usare anche nomi come:

```txt
graph_url_test.py
diagnostic_redaction_test.py
cdp_url_test.py
```

che non coincidono necessariamente con la discovery predefinita `test*.py` di `unittest`.

Il manifest corrente non dipende dalla discovery implicita: enumera esplicitamente i moduli:

```txt
launcher.tests.test_launcher
scrapers.betfair.graph_url_test
scrapers.betfair.diagnostic_redaction_test
scrapers.betfair.cdp_url_test
```

e registra separatamente `python-compileall`.

`run.test.mjs` contiene un controllo dedicato alla presenza di questi moduli nel manifest. La standardizzazione dei nomi non è un prerequisito del runner corrente.

### Isolamento filesystem non uniforme

**Classificazione storica:** `BUG CONFERMATO IN ALMENO UN TEST`  
**Stato:** `DEBITO ANCORA PRESENTE; SANDBOX GENERALE NON IMPLEMENTATA`

Il finding storico individuava `commitId.test.mjs`, che costruiva una directory sotto:

```txt
process.cwd()/virtual-commit-id-journal/
```

senza cleanup finale.

Questo comportamento è ancora presente. Per questo motivo l’entry `backend-commit-id` è presente nel manifest ma:

```txt
enabled: false
disabledReason:
Known test sandbox debt: writes virtual-commit-id-journal under process.cwd()
without guaranteed cleanup (TEST-065).
```

I self-test del runner usano correttamente `os.tmpdir()`, `mkdtemp` e cleanup in `finally`, ma questo dimostra l’isolamento dei self-test, non una sandbox generale applicata a ogni entry.

Il README del runner specifica inoltre che `requires` è metadata dichiarativo e **non** un sandbox di sicurezza: i child process ereditano ancora l’environment del processo padre.

La regola storicamente approvata resta quindi solo parzialmente realizzata:

```txt
test che scrive
→ sandbox temporanea o isolamento equivalente
→ cleanup su successo e failure
→ nessun write sulla persistence/runtime reale
```

Il profilo `persistence` rimane infatti `planned` e disabilitato.

### Test route non sempre end-to-end HTTP

**Classificazione storica:** `LIMITE NOTO`  
**Stato:** `COPERTURA HTTP REALE PRESENTE MA NON GENERALIZZATA`

Il finding storico osservava che alcuni test estraevano direttamente gli handler da:

```txt
router.stack
route.stack
handler.handle
```

`backend/src/routes/evidence/evidenceRoute.test.mjs` usa ancora questo approccio per le route Evidence.

Esiste però anche copertura HTTP reale in `backend/src/server.test.mjs`: l’app viene montata su una porta dinamica con `listen(0)` e viene interrogata via `fetch`/`http.request` per verificare status, body, header e boundary locale.

La situazione corrente è quindi:

```txt
unit test diretti degli handler
→ presenti

HTTP reale sull'app completa
→ presente per health e boundary locali

harness HTTP generalizzato per le route critiche
→ non dimostrato dalla superficie implementata
```

`TEST-072` non viene quindi marcato come integralmente chiuso.

### Copertura reale non misurabile

**Classificazione storica:** `LIMITE NOTO E STRUTTURA ASSENTE`  
**Stato:** `NESSUNA COVERAGE CANONICA`

Il runner corrente registra quali entry del manifest sono state eseguite e il loro esito, ma non raccoglie metriche di code coverage.

`coverage/`, `.coverage*` e `htmlcov/` sono trattati come output locali ignorati da Git; nella superficie `scripts/validation/` non esiste un comando di raccolta coverage né una percentuale associata allo SHA.

Resta quindi valida la distinzione:

```txt
file di test presente
≠ test eseguito

test registrato nel manifest
≠ test eseguito

test eseguito in passato
≠ PASS della suite

profilo passato
≠ coverage percentuale del codice

build verde
≠ UI verificata

collaudo live storico
≠ scenario riprodotto da un'esecuzione dedicata
```

`counts.passed` dell’artifact conta le **entry del manifest**, non le assertion interne dei singoli test.

Nessuna percentuale di coverage viene dichiarata in questo documento.

### Frontend interaction harness — copertura parziale presente

**Classificazione storica:** `STRUTTURA COMPLETAMENTE ASSENTE`  
**Stato:** `COPERTURA REACT/LIFECYCLE PARZIALE; HARNESS GENERALE NON CHIUSO`

Al checkpoint il frontend non disponeva di un harness capace di montare componenti e hook.

Sono presenti:

```txt
frontend/src/components/frontendComponents.test.jsx
frontend/src/hooks/pollingLifecycle.test.mjs
```

`frontendComponents.test.jsx` usa:

```txt
node:test
react-test-renderer
act()
```

e monta componenti reali per verificare rendering e interazioni mirate.

`pollingLifecycle.test.mjs` monta hook tramite componenti probe e verifica, fra l’altro:

```txt
StrictMode
cambio eventId
AbortController
rifiuto di response tardive
stop/resume polling
stato inactive senza eventId
integrity degradata
lifecycle del Source Identity gate
```

Il package frontend espone inoltre:

```txt
"test:components": "tsx --test src/components/frontendComponents.test.jsx"
```

Non risultano invece dipendenze Vitest, jsdom o React Testing Library nel `frontend/package.json`.

Soprattutto, i due file sopra **non sono registrati nel `test-manifest.json` corrente**. Il profilo frontend del runner registra test Node di utility/hook puri e la build, ma non questa copertura React/lifecycle aggiuntiva.

Perciò la condizione storica “harness completamente assente” non è più corretta come stato corrente, mentre la chiusura integrale di `IMPL-030`/`TEST-071` non è dimostrata.

### Fixture non catalogate

**Classificazione storica:** `STRUTTURA COMPLETAMENTE ASSENTE`  
**Stato:** `CATALOGO CONDIVISO NON PRESENTE`

La struttura approvata al Punto 7 era:

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

La directory root `test/` non è presente.

Le entry del manifest corrente espongono il campo `fixtures`, ma nella superficie registrata il campo è vuoto. Il runner verifica l’esistenza delle fixture dichiarate quando presenti; non definisce però un catalogo condiviso, provenance o redaction status delle fixture.

Resta valida la distinzione storica:

- factory locali piccole possono restare accanto al test;
- una fixture condivisa dovrebbe avere contratto e provenance espliciti;
- cookie, token, profili, path locali e dump completi non devono essere trattati come fixture persistibili.

`TEST-067` non viene marcato come implementato.

### Result artifact machine-readable — prima versione presente

**Classificazione storica:** `STRUTTURA COMPLETAMENTE ASSENTE`  
**Stato:** `ARTIFACT PER RUN IMPLEMENTATO; LEDGER STORICO COMPLETO NON PRESENTE`

Al checkpoint gli script stampavano output umano senza un risultato uniforme associato al commit.

Il runner corrente costruisce invece un artifact JSON sotto:

```txt
test-results/<timestamp>-<sha-breve>-<profile>.json
```

e `.gitignore` esclude `test-results/`.

Il contratto corrente `schemaVersion: 1.0.0` include almeno:

```txt
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

Ogni risultato per entry registra, fra l’altro:

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
startedAt
completedAt
durationMs
stdout
stderr
indicatori di troncamento
byte originari catturati
```

Il runner limita stdout/stderr per stream e comando; il default è `65.536` byte, modificabile soltanto entro limiti bounded. La redazione copre root repository, home, tmp, URL, header/marker sensibili e varie forme di path assoluti.

L’output viene scritto atomicamente e il path dell’artifact deve rimanere sotto `test-results/`.

Questa prima versione non equivale al ledger storico completo approvato sotto `IMPL-031`:

```txt
nessun lastResultSha per entry nel manifest
nessuna cronologia canonica degli ultimi esiti
nessuna semantica di promozione automatica planned → executed → passed
nessun browserValidationStatus separato
nessun buildResult separato
```

La presenza dell’implementazione prova il contratto dell’artifact per **una singola esecuzione**; non equivale a un PASS della suite.

### Test map eseguibile

**Classificazione storica:** `MIGLIORIA NECESSARIA`  
**Stato:** `METADATA DI MAPPA PRESENTE; PARITÀ COMPLETA NON IMPLEMENTATA`

Il manifest corrente registra per ogni entry campi come:

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

`manifest.mjs` verifica inoltre:

```txt
ID entry univoci
comandi non duplicati
formato TEST-ID
TEST-ID non assegnati a due entry diverse
profili esistenti
pathChecks/cwd/fixture dentro la root
comandi allow-listed
vincoli fast/full-offline dichiarativi
```

Questo è un sottoinsieme utile della test map, ma non realizza la matrice completa storicamente approvata.

In particolare, il manifest corrente non contiene campi canonici come:

```txt
status
lastResultSha
```

e il checker dei registri documentali non confronta il manifest con tutti i TEST-ID documentati.

Il README del runner dichiara esplicitamente che l’espansione completa test ↔ owner ↔ documento appartiene ancora a `IMPL-003`.

La coerenza interna del manifest non deve quindi essere confusa con la completezza dell’inventario repository-wide.

### Baseline e osservabilità

**Classificazione storica:** `MIGLIORIA NECESSARIA`  
**Stato:** `PROFILO BENCHMARK ANCORA PLANNED`

Le baseline prestazionali non sono normali unit test e non devono essere trasformate in failure sulla base di una singola oscillazione.

Il contratto storico prevedeva registrazioni controllate di:

```txt
SHA
ambiente
fixtureId
iterazioni
warmup
mediana
p95
dimensione input/output
tolleranza
```

per aree come history/timeline, journal, stringify/write/rename, recovery, latenze di pipeline, build frontend e durata suite.

Nel manifest corrente il profilo:

```txt
benchmark
```

è `enabled: false`, `status: planned` e dichiara dipendenza da `IMPL-013`.

Non esiste quindi, nella superficie implementata, una baseline benchmark canonica eseguibile dal runner. `TEST-074` resta non dimostrato.

### DOC-031 — Runbook Validation monolitico e inventario eseguibile

**Classificazione al checkpoint:** `DOCUMENTAZIONE DA RIFATTORIZZARE`
**Decisione storica:** separare l'inventario eseguibile dalle procedure e dall'interpretazione operativa.

Al checkpoint del Punto 7 il runbook conteneva procedure utili ma manteneva manualmente numerosi comandi e path, mescolando suite, smoke, live e storico. Il limite individuato era strutturale: un documento Markdown non può garantire da solo che ogni comando continui a esistere o che l'elenco dei test sia completo.

La parte eseguibile di quella decisione è presente sotto `scripts/validation/`:

```txt
test-manifest.json
→ lista delle entry conosciute dal runner

run.mjs
→ selezione del profilo
→ preflight del manifest e dei path
→ esecuzione
→ result artifact JSON

README.md
→ profili, semantica d'uso e limiti della prima versione
```

Il manifest è quindi la lista eseguibile canonica **per il runner corrente**, non l'inventario completo di ogni test presente nella repository. Il suo stesso README dichiara che l'espansione completa test ↔ owner ↔ documento resta separata sotto `IMPL-003`.

La distinzione documentale rimane:

```txt
manifest
→ cosa il runner sa eseguire

documentazione operativa
→ criteri, interpretazione, live/manuale e rollback

record di audit
→ provenienza delle decisioni e stato registrato nel checkpoint
```

Le procedure che appartengono ad altri runbook restano nei rispettivi owner e non vengono duplicate in questo documento.

### DOC-032 — Semantica dello stato test

**Classificazione al checkpoint:** `DOCUMENTAZIONE MANCANTE`
**Decisione storica:** distinguere presenza, esecuzione, PASS e osservazione live.

La distinzione resta necessaria anche con il runner implementato:

```txt
file presente
≠ test registrato nel manifest

test registrato nel manifest
≠ test eseguito

test eseguito in passato
≠ PASS della suite

result artifact di una singola esecuzione
≠ ledger storico degli esiti

build verde
≠ UI verificata

collaudo live storico
≠ scenario riprodotto da un'esecuzione dedicata
```

Il runner corrente produce per una singola esecuzione `status`, conteggi e `perTestResults`; questa struttura descrive l'esito di quel run, non autorizza a proiettare un PASS su uno SHA diverso o su test non inclusi nel profilo eseguito.

Le sezioni seguenti descrivono presenza e comportamento implementato, distinguendoli dagli esiti di esecuzione dei test.

### CI

**Classificazione al checkpoint:** `MIGLIORIA FUTURA, NON PRIMA STRUTTURA`
**Decisione storica:** rinviare la CI finché il runner locale non fosse deterministico.

La CI non è configurata:

```txt
.github/workflows/
→ non presente
```

La validazione automatizzata resta quindi locale. I profili del runner separano già la superficie offline dalle capacità browser, rete esterna, credenziali e tracking; il profilo `live` è ancora dichiarato `planned` e disabilitato.

L'ordine seguente appartiene alla decisione storica del Punto 7 e non introduce una nuova roadmap:

```txt
runner locale deterministico
→ manifest completo
→ suite offline verde
→ result artifact
→ eventuale CI
```

### Stato delle strutture storicamente approvate

Il checkpoint aveva associato quattro strutture principali alle implementazioni `IMPL-028…031`. La situazione delle quattro strutture è:

| Implementazione | Stato                                                                  | Confine                                                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IMPL-028`      | infrastruttura presente                                                | runner, manifest, schemi, support modules, cinque profili offline implementati e artifact JSON per run                                                                                       |
| `IMPL-029`      | struttura condivisa non presente                                       | non esiste il catalogo root `test/fixtures/`; le entry correnti dichiarano `fixtures: []`                                                                                                    |
| `IMPL-030`      | copertura mirata presente, harness generale non chiuso                 | esistono test React/lifecycle con `react-test-renderer`, inclusi casi `StrictMode`; non risultano Vitest, jsdom o React Testing Library e i due test mirati non sono registrati nel manifest |
| `IMPL-031`      | prima forma di artifact per run presente, ledger completo non presente | `test-results/<timestamp>-<sha>-<profile>.json` registra il singolo run; il README mantiene separato il ledger storico                                                                       |

Anche `IMPL-003` resta distinta da `IMPL-028`: il manifest valida le proprie entry e i `requirementIds`, ma non costituisce ancora la mappa completa di tutti i test e di tutti i TEST-ID documentati.

### TEST-060…075 — Requisiti infrastrutturali individuati al checkpoint del Punto 7

Gli ID seguenti restano il record dei requisiti individuati nel secondo audit. Lo **stato** descrive la struttura e il comportamento implementati; non equivale di per sé a un PASS delle suite.

#### TEST-060 — Manifest univoco

```txt
ogni comando previsto
→ una sola entry
```

**Stato:** implementazione presente nel perimetro del manifest. `validateManifest()` rifiuta ID di entry duplicati e comandi duplicati; il self-test contiene casi dedicati. Questo non dimostra che ogni comando esistente nella repository sia già inventariato.

#### TEST-061 — Path preflight

```txt
path inesistente
→ failure prima di avviare la suite
```

**Stato:** implementazione presente. Il manifest valida `cwd`, `pathChecks` e fixture contro la root prima dell'esecuzione; il runner risolve le entry solo dopo il preflight e il self-test copre path mancante ed escape dalla repository.

#### TEST-062 — Process isolation

```txt
ogni test legacy selezionato
→ child process separato
→ exit code normalizzato
```

**Stato:** implementazione presente per ogni entry selezionata dal runner. `runEntry()` usa un child process dedicato e il self-test verifica PID differenti e normalizzazione dell'exit code.

#### TEST-063 — Timeout bounded

```txt
timeout superato
→ processo terminato
→ failure bounded nel report
```

**Stato:** implementazione presente. Ogni entry dichiara `timeoutSec`; il process runner termina il child e registra `timeout`, con escalation bounded. Il self-test verifica un caso di timeout.

#### TEST-064 — Discovery Python esplicita

```txt
moduli Python correnti registrati
→ enumerazione esplicita nel manifest
```

**Stato:** implementazione presente per i moduli Python attualmente registrati: launcher unittest, `graph_url_test`, `diagnostic_redaction_test`, `cdp_url_test`, oltre a `compileall`. Il requisito non implica che il manifest contenga ogni test Python possibile della repository.

#### TEST-065 — Cleanup sandbox

```txt
success/failure
→ sandbox temporanea rimossa
```

**Stato:** non chiuso. I self-test del runner usano `mkdtemp` sotto la directory temporanea e cleanup in `finally`, ma `backend/src/sofa/matchHistory/commitId.test.mjs` continua a creare `virtual-commit-id-journal/...` sotto `process.cwd()` senza cleanup. La relativa entry del manifest è disabilitata esplicitamente per questo debito.

#### TEST-066 — Runtime directories protette

```txt
profilo offline
→ nessun accesso write alle directory runtime reali
```

**Stato:** copertura parziale, non equivalente a una sandbox. Il profilo `fast` rifiuta entry che **dichiarano** requisiti `browser`, `credentials`, `external-network` o `tracking`, ma `requires` è metadata dichiarativo e i child ereditano ancora l'environment del processo padre. Non è presente una protezione generale delle directory runtime.

#### TEST-067 — Fixture contract

```txt
schema + provenance + redaction
→ validi
```

**Stato:** non implementato. Non esiste la struttura root `test/fixtures/` proposta al checkpoint e le entry del manifest non dichiarano fixture condivise.

#### TEST-068 — Coerenza TEST-ID

```txt
registri ↔ manifest
→ nessun missing/duplicate
```

**Stato:** parziale. Il manifest impone formato `TEST-NNN`, unicità locale e un solo owner per ciascun `requirementId`; il self-test verifica queste regole. Non esiste però, nella validazione implementata, il confronto completo registri ↔ manifest che dimostri assenza di TEST-ID documentati ma mancanti dalla mappa.

#### TEST-069 — Result schema

```txt
SHA + profilo + conteggi + limiti
→ presenti
```

**Stato:** prima implementazione presente. `result-schema.json` e `buildRunResult()` definiscono SHA, profilo, tempi, ambiente, conteggi, stato, warning, limiti, stato della working tree e `perTestResults`. Questo non chiude il ledger storico e non costituisce di per sé un PASS del requisito.

#### TEST-070 — Result redaction

```txt
segreti/URL/path sensibili
→ redazione bounded dell'output registrato
```

**Stato:** implementazione tecnica presente per l'output catturato dal runner. `redaction.mjs` sostituisce path noti, URL e marker sensibili e `run.test.mjs` include un caso di redazione/troncamento. La presenza dell'implementazione non equivale da sola alla chiusura formale del requisito.

#### TEST-071 — Frontend StrictMode harness

```txt
hook montato
→ lifecycle osservabile sotto StrictMode
```

**Stato:** parziale. `pollingLifecycle.test.mjs` monta hook reali con `react-test-renderer`, include `StrictMode` e osserva abort, cambio evento e protezione dalle response tardive. Non usa fake timer, non costituisce un harness generale e non è registrato nel manifest corrente. Anche `frontendComponents.test.jsx` monta componenti reali ma vive fuori dal manifest.

#### TEST-072 — Route HTTP harness

```txt
porta dinamica
→ status/body/header reali
```

**Stato:** parziale. `server.test.mjs` apre l'app su porta dinamica e verifica via HTTP reale `/api/health`, header e boundary host/origin. `evidenceRoute.test.mjs`, invece, continua a estrarre direttamente handler da `router.stack` e usa request/response fittizi; non esiste quindi un harness HTTP uniforme per le route critiche.

#### TEST-073 — Profilo fast offline

```txt
nessun browser dichiarato
nessuna rete esterna dichiarata
nessun tracking dichiarato
```

**Stato:** implementazione presente come contratto del manifest. Le entry abilitate in `fast` vengono validate contro `liveRequired` e contro le capability dichiarate vietate. Questo controllo non è una sandbox di sicurezza e dipende dalla correttezza dei metadata `requires`.

#### TEST-074 — Benchmark contract

```txt
mediana/p95
→ fixture controllata
→ nessun dato live
```

**Stato:** non implementato. Il profilo `benchmark` è dichiarato `planned`, disabilitato e collegato alle baseline `IMPL-013`.

#### TEST-075 — Lint surface

```txt
npm run lint
→ realmente eseguibile
oppure
→ script rimosso
```

**Stato:** non chiuso. `frontend/package.json` espone ancora `npm run lint` con ESLint e dipendenze ESLint, ma nei percorsi standard del frontend e della root considerati dal Punto 7 non risulta una configurazione ESLint. La presenza della superficie dichiarata non consente quindi di attribuire un PASS al requisito.

#### Sintesi temporale

Il checkpoint originario registrava questi requisiti come mancanti o da costruire. L'addendum successivo a `IMPL-028` aveva registrato una validazione locale di una parte di essi. Molte delle implementazioni descritte dall'addendum sono presenti, mentre i PASS storici restano distinti dallo stato implementativo.

La sintesi è quindi:

```txt
implementazione presente nel runner/manifest:
TEST-060, TEST-061, TEST-062, TEST-063, TEST-064

implementazione o copertura presente ma con confine incompleto:
TEST-066, TEST-068, TEST-069, TEST-070, TEST-071, TEST-072, TEST-073

requisito non chiuso:
TEST-065, TEST-067, TEST-074, TEST-075

```

### Decisioni approvate al checkpoint — record storico

Le decisioni seguenti appartengono al Punto 7 e spiegano l'origine delle strutture e degli ID del documento. Restano un record storico e non sostituiscono lo stato effettivamente implementato.

1. creare `IMPL-028` come prima struttura del Punto 7;
2. non riscrivere in massa i test esistenti;
3. eseguire inizialmente ogni test legacy in un child process separato;
4. usare un manifest esplicito come unica lista eseguibile;
5. mantenere Node `assert` o `node:test` per backend e utility nuove;
6. mantenere Python `unittest` e standardizzare i nomi gradualmente;
7. introdurre Vitest, jsdom e React Testing Library per il frontend;
8. escludere qualunque test live dal profilo predefinito;
9. aggiungere timeout e serial group per filesystem, porte e global state;
10. obbligare ogni test che scrive a usare una sandbox temporanea;
11. estendere `IMPL-003` come test map machine-checkable;
12. distinguere sempre planned, implemented, executed, passed e live-observed;
13. creare fixture condivise soltanto per contratti riusati;
14. integrare `IMPL-008`, `IMPL-012` e `IMPL-013` senza fonderle in un mega-harness;
15. produrre un result artifact JSON per ogni profilo;
16. mantenere `fileModificati.md` e il report umano dell'esecutore;
17. non introdurre CI prima che il runner locale sia deterministico;
18. non rendere il full lint un gate prima di una baseline pulita;
19. correggere nel checkpoint del Punto 7 SHA e range obsoleti della Todo.

Delle decisioni sopra risultano implementati, fra gli altri elementi, runner/manifest, isolamento per child process, timeout, profili offline, result artifact e separazione del live. Altre decisioni restano solo parte del record storico oppure risultano realizzate solo parzialmente, come descritto nelle sezioni precedenti.

### Ordine tecnico risultante al checkpoint — record storico

La sequenza seguente è conservata perché appartiene alla struttura e alla provenienza del Punto 7. Non descrive lo stato corrente di completamento e non introduce una nuova roadmap.

```txt
IMPL-005 esteso
→ IMPL-028 runner e manifest
→ IMPL-029 fixture e sandbox
→ IMPL-030 frontend harness
→ IMPL-003 test map
→ IMPL-031 result ledger
→ IMPL-008 persistence profile
→ IMPL-012 replay profile
→ IMPL-013 benchmark profile
→ TEST-060…075
→ eventuale CI offline
→ raggruppamento delle task esecutive Punti 1–7
```

---
