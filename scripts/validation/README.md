# Runner di validazione locale

## Scopo

Questa directory contiene il manifest eseguibile e il runner locale di validazione di Tennis Decision UI.

Il runner:

```txt
legge test-manifest.json
→ valida schema, ID, profili, path e comandi
→ seleziona un profilo
→ risolve cwd, path e comando di ogni entry selezionata
→ esegue ogni entry in un child process separato
→ applica timeout espliciti
→ limita e redige stdout/stderr
→ produce, salvo --no-write, un artefatto JSON sotto test-results/
```

La versione corrente è intenzionalmente seriale. Il runner non modifica direttamente codice sorgente, registri o documentazione come parte dell'orchestrazione e non avvia implicitamente browser, login o tracking.

Le singole entry possono però essere dichiarate con `mutatesFilesystem: true` e produrre effetti locali propri del test, della build o del compile check. Il runner registra questo metadata ma non lo usa come sandbox. In particolare, `--no-write` disabilita soltanto la scrittura dell'artefatto del runner: non impedisce eventuali scritture effettuate dalle entry selezionate.

## Comandi

Dalla root del repository:

```bash
node scripts/validation/run.mjs fast
node scripts/validation/run.mjs backend
node scripts/validation/run.mjs frontend
node scripts/validation/run.mjs python
node scripts/validation/run.mjs full-offline
```

Elenco di profili ed entry senza esecuzione:

```bash
node scripts/validation/run.mjs --list
```

`--list` valida comunque il manifest e i path dichiarati; un errore di configurazione restituisce exit code `2`.

Esecuzione senza artefatto del runner:

```bash
node scripts/validation/run.mjs fast --no-write
```

Output JSON completo anche sul terminale:

```bash
node scripts/validation/run.mjs fast --json
```

### Opzioni

| Opzione                  | Comportamento                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--manifest <path>`      | usa un manifest repository-relative diverso da `scripts/validation/test-manifest.json`                             |
| `--repo-root <path>`     | usa una root repository esplicita; è prevista soprattutto per esecuzioni isolate e self-test                       |
| `--output <path>`        | sceglie il path dell'artefatto, che deve restare sotto `test-results/`                                             |
| `--no-write`             | non scrive l'artefatto JSON del runner                                                                             |
| `--json`                 | stampa su stdout il risultato JSON completo oltre al riepilogo normale                                             |
| `--allow-live`           | consenso richiesto prima dell'esecuzione di un profilo live abilitato; non abilita da solo un profilo disabilitato |
| `--max-output-bytes <n>` | imposta il limite per ciascuno stream e comando; valore intero tra `1024` e `1048576`, default `65536`             |
| `--list`                 | elenca profili ed entry senza eseguirli                                                                            |
| `--help`                 | mostra l'help del runner                                                                                           |

## Profili

| Profilo        | Stato        | Contenuto                                                                               |
| -------------- | ------------ | --------------------------------------------------------------------------------------- |
| `fast`         | implementato | controlli puri e rapidi selezionati, inclusi checker documentali e self-test del runner |
| `backend`      | implementato | test backend offline registrati nel manifest                                            |
| `frontend`     | implementato | test Node frontend registrati e build Vite                                              |
| `python`       | implementato | compile check e moduli `unittest` Python enumerati esplicitamente                       |
| `full-offline` | implementato | tutte le entry offline abilitate registrate nel manifest                                |
| `persistence`  | pianificato  | dipende dalla sandbox/harness di persistence dedicata                                   |
| `benchmark`    | pianificato  | dipende da baseline ripetibili su fixture controllate                                   |
| `live`         | pianificato  | disabilitato e non incluso nei profili predefiniti                                      |

Un profilo disabilitato o pianificato restituisce exit code `2`; non viene contato come `skipped` o `passed` e non produce un normale risultato di suite.

### Confine live/offline corrente

Il manifest usa due metadata distinti:

- `liveRequired`, booleano che identifica un'entry come live;
- `requires`, array dichiarativo di capacità richieste.

Un'entry con `liveRequired: true` deve appartenere al profilo `live`.

Quando viene selezionato `fast`, la validazione rifiuta:

- entry `liveRequired`;
- entry che dichiarano in `requires` una delle capacità `browser`, `credentials`, `external-network` o `tracking`.

Quando viene selezionato `full-offline`, la validazione rifiuta entry `liveRequired`.

`requires` non è un sandbox di sicurezza generale. La verifica delle capacità vietate sopra elencate è applicata specificamente al profilo `fast`; i child process ereditano l'environment del processo padre, con l'aggiunta dei marker del validation runner. Il profilo `live` è attualmente disabilitato: `--allow-live` costituisce soltanto il consenso previsto per un profilo live già abilitato e non ne modifica lo stato.

## Exit code

| Codice | Significato                                                                                                                                                                                             |
| -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`    | tutte le entry selezionate sono passate                                                                                                                                                                 |
| `1`    | almeno una entry è fallita o ha superato il timeout                                                                                                                                                     |
| `2`    | errore d'uso oppure errore intercettato dal runner fuori dall'esito normalizzato delle entry, inclusi manifest/path non validi, profilo sconosciuto/disabilitato o errore nella gestione dell'artefatto |

I path dichiarati vengono verificati prima di avviare i child process. Un path mancante o che esce dalla root del repository è un errore di configurazione.

## Manifest

Il manifest predefinito è:

```txt
scripts/validation/test-manifest.json
```

La versione corrente usa `schemaVersion: "1.0.0"` e contiene due blocchi principali:

```txt
profiles
entries
```

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

Possono inoltre essere presenti:

```txt
pathChecks
requires
disabledReason
```

`disabledReason` è richiesto per le entry disabilitate.

Gli ID delle entry devono essere univoci. Anche la combinazione `cwd` + `command` deve essere univoca. I `requirementIds`, quando presenti, usano il formato `TEST-NNN` e non possono essere assegnati a più entry.

`command` è un array di argomenti. Il primo elemento deve appartenere all'allow-list degli eseguibili supportati dal runner. I placeholder portabili sono:

```txt
${NODE}
${PYTHON}
${NPM}
```

L'esecuzione usa `shell:false`. Su Windows, quando il comando risolto è un wrapper `.cmd` o `.bat`, il runner lo avvia tramite `ComSpec` con gli argomenti necessari, mantenendo `shell:false` nello `spawn`.

`cwd`, `pathChecks` e `fixtures` devono restare all'interno della root del repository. I path soggetti a preflight devono esistere prima dell'esecuzione.

`serialGroup` viene registrato come metadata dell'entry e dell'artefatto. La versione corrente esegue comunque tutte le entry serialmente, quindi non applica scheduling concorrente per gruppo.

### Inventario corrente della persistenza

I vecchi file monolitici:

```txt
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs
```

La copertura è suddivisa in suite modulari sotto:

```txt
backend/src/sofa/matchHistory/commitJournal/
backend/src/sofa/matchHistory/recovery/
```

Fra le suite presenti risultano, ad esempio:

```txt
backend/src/sofa/matchHistory/commitJournal/filesystem.integration.test.mjs
backend/src/sofa/matchHistory/commitJournal/integrityStatus.test.mjs
backend/src/sofa/matchHistory/commitJournal/lifecycle.test.mjs
backend/src/sofa/matchHistory/commitJournal/payloadSafety.test.mjs

backend/src/sofa/matchHistory/recovery/basicRecovery.integration.test.mjs
backend/src/sofa/matchHistory/recovery/completedTargetVerification.integration.test.mjs
backend/src/sofa/matchHistory/recovery/invalidJournal.integration.test.mjs
backend/src/sofa/matchHistory/recovery/retryAndFailure.integration.test.mjs
```

Il manifest corrente non registra queste suite modulari di journal/recovery.

È presente anche l'entry `backend-commit-id`, ma è disabilitata e quindi non viene selezionata dai profili cui è associata. Il motivo di disabilitazione è registrato nel manifest.

Non vanno dedotti path di test dai nomi storici dei moduli.

## Esecuzione dei child process

Ogni entry selezionata viene eseguita in un child process separato con:

- `cwd` risolta dentro la repository;
- stdin ignorato;
- stdout e stderr catturati separatamente;
- timeout derivato da `timeoutSec`;
- `shell:false`;
- environment del processo padre ereditato;
- `CI` mantiene il valore ereditato quando è valorizzato; altrimenti viene impostato a `1`;
- `NO_COLOR=1`;
- `TDUI_VALIDATION_RUNNER=1`;
- `TDUI_VALIDATION_PROFILE` impostato al profilo selezionato.

Allo scadere del timeout il runner tenta prima una terminazione normale e, dopo un intervallo bounded, applica una terminazione forzata se il child è ancora attivo. Il risultato dell'entry viene normalizzato come `passed`, `failed` o `timeout`.

## Artefatti

Il risultato predefinito viene scritto in:

```txt
test-results/<timestamp>-<sha>-<profile>.json
```

Un `--output` esplicito deve comunque risolvere sotto `test-results/`. Se `test-results/` esiste come symbolic link, il runner rifiuta la scrittura.

`test-results/` è ignorata da Git.

### Struttura del risultato

L'artefatto di esecuzione usa `schemaVersion: "1.0.0"` e contiene:

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

`environment` registra:

```txt
platform
architecture
nodeVersion
```

`counts` contiene:

```txt
total
passed
failed
timedOut
skipped
```

Nella versione corrente `skipped` è `0`: i profili bloccati vengono fermati prima di produrre un normale risultato di suite.

`counts.passed` conta entry del manifest concluse con stato `passed`, non le assertion interne ai singoli test. `perTestResults` contiene un record per ogni entry eseguita, inclusi test, build, checker e compile check.

Per ciascuna entry il record comprende il contesto operativo e l'esito, fra cui:

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

### Output e redaction

Ogni stream è limitato di default a `65.536` byte per comando. Il limite può essere modificato soltanto entro il range accettato da `--max-output-bytes`.

Prima di essere registrati nell'artefatto, stdout, stderr e gli errori di spawn vengono redatti. La redaction copre, fra l'altro:

- root del repository;
- home dell'utente;
- directory temporanea;
- URL HTTP/HTTPS;
- bearer token;
- valori associati a marker come authorization, cookie, set-cookie, API key, app key, token e password;
- path assoluti riconoscibili fuori dalla repository.

L'artefatto include lo SHA osservato e lo stato `clean`, `dirty` o `unavailable` della working tree, oltre al numero di path modificati quando disponibile. Una working tree `dirty` viene registrata come contesto e non produce da sola un failure.

SHA e stato `clean`/`dirty` non identificano byte per byte il contenuto di una working tree sporca.

## Limiti della versione corrente

- esecuzione interamente seriale;
- manifest limitato alle entry esplicitamente registrate;
- nessuna coverage;
- nessun browser reale o test live;
- profili `persistence`, `benchmark` e `live` non abilitati;
- nessun harness persistence generale;
- nessun benchmark runner abilitato;
- test React e lifecycle mirati presenti, ma nessun harness di interazione frontend generale;
- nessuna CI definita dal validation runner;
- `requires` è metadata dichiarativo e non isola l'environment dei child;
- `--no-write` non impedisce le scritture proprie delle entry.

L'espansione completa test ↔ owner ↔ documento non appartiene a questo README operativo. Allo stesso modo, l'artefatto di una singola esecuzione non è un ledger storico degli esiti.
