# Report documentale — `docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-024
Sequenza audit: 24/72
Documento analizzato: 01-entrypoints-and-runtime.md
Percorso documento: docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md
Percorso report: Report documentale/24 - 01-entrypoints-and-runtime.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 189ac387292026433422352d040e6f92f584fffc
Dimensione documento: 322 righe
Ruolo dichiarato: owner dei wrapper Python compatibili e dell'implementazione launcher locale
Stato report: completato
```

Il documento è stato confrontato con:

- `avvio.py`;
- `scraper.py`;
- `betfair_scraper.py`;
- `launcher/app.py`;
- `launcher/config.py`;
- `launcher/services.py`;
- `launcher/session.py`;
- `launcher/system.py`;
- `launcher/tests/test_launcher.py`;
- `scripts/start-cdp-dev.ps1`;
- `scripts/start-backend-dev.ps1`;
- `scrapers/sofa/cli.py`;
- `scrapers/sofa/config.py`;
- `scrapers/sofa/browser.py`;
- `scrapers/betfair/cli.py`;
- `scrapers/betfair/config.py`;
- `backend/src/sofa/directFetch.js`;
- `backend/src/sofa/directFetch.test.mjs`;
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`;
- `backend/src/routes/betfair.js`;
- `backend/src/routes/betfair/loginWindow.js`;
- `backend/src/routes/betfair/loginWindowLifecycle.js`;
- `backend/src/runtime/pythonProcessRegistry.js`;
- `backend/src/runtime/matchHistoryWriterAuthority.js`;
- `backend/src/server.js`;
- `backend/src/server.test.mjs`;
- `backend/src/sofa/matchTracker.js`;
- `docs/tennis-decision-ui/operations/01-local-runtime.md`;
- i finding runtime, Betfair lifecycle, architecture e writer authority già registrati nei report precedenti.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: ALTA
Wrapper root sottili: corretti
Launcher lock / writer authority separati: corretto
No kill by port: corretto
Ownership owned/reused: coerente
Backend identity reuse: coerente
Frontend identity reuse: coerente
CDP discovery bounded: coerente nel principio
Frontend bind 127.0.0.1: esplicito
Backend bootstrap authority→recovery→listen: corretto
Backend terminal tracker drain: corretto
Python process registry: separato dal launcher
Chrome/CDP non-owned dal launcher: coerente

CLI stdout contract: troppo generalizzato
Sofa stderr redaction: promessa non rispettata
Sofa directFetch stdout: accumulo non bounded
Betfair stdout: stesso gap già registrato in BETFAIR-LIFE-010
Launcher shutdown grace: 5s
Backend force-exit budget: 6s
Parent può force-killare il backend prima del suo budget interno
Manifest atomic write: errori I/O silenziati
_safe_write_manifest può dichiarare successo apparente dopo write fallita
CDP launch_requested non-ready: URL non vuota + status starting
CDP starting: nessuna riconciliazione successiva nel launcher
Backend bind loopback: non esplicito nel runtime corrente
BACKEND_SCRIPT: configurazione legacy/non usata dal launcher
Validazione live: duplicata con operations/01-local-runtime.md
Verification wrapper/output/shutdown integration: incompleta
Modifiche proposte: 10
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: CRITICA
```

Il documento possiede una struttura concettuale corretta.

Le authority sono realmente distinte:

```text
launcher lock
→ orchestrazione locale

writer authority
→ esclusività del writer backend sulla storage identity

launcher owned process list
→ backend/frontend avviati dal launcher

backend Python process registry
→ figli Python applicativi

wrapper root
→ entrypoint compatibili
```

Questa separazione deve essere preservata.

Le criticità emerse non richiedono una nuova architettura.

Richiedono invece di rendere più rigorosi:

```text
process shutdown budgets
manifest durability/observability
subprocess I/O
CLI mode contracts
CDP provisional state
local HTTP boundary
document ownership
verification
```

---

# 1. Il contratto stdout JSON non vale allo stesso modo per tutte le modalità CLI

## Esito: contratto troppo generalizzato

Il documento include tra i contratti da preservare:

```text
JSON prodotto su stdout
```

come proprietà generale dei wrapper scraper.

## SofaScore scrape

`scraper.py` chiama:

```text
asyncio.run(scrapers.sofa.cli.main())
```

e la CLI Sofa usa stdout per il risultato JSON.

Anche gli errori iniziali:

```text
No URLs provided
No valid URLs provided
```

vengono serializzati in JSON su stdout prima di `SystemExit(1)`.

Questa modalità è coerente con:

```text
stdout = machine-readable result
stderr = diagnostics
```

## Betfair scrape

`betfair_scraper.py` chiama:

```text
scrapers.betfair.cli.main()
```

e nello scrape normale produce:

```text
print(json.dumps(results))
```

su stdout.

Anche questa modalità è coerente.

## Betfair login-only

Il backend costruisce però:

```text
betfair_scraper.py
<url>
--login-only
--mode <...>
```

In questa modalità `scrapers.betfair.cli.main()`:

```text
asyncio.run(open_login_window(...))
→ return
```

senza emettere un JSON finale su stdout.

Il caller Node non aspetta un JSON di business.

Aspetta soltanto:

```text
spawnReady
```

e tratta il Python process come lifecycle login.

## Errori CLI

`argparse` e la validazione CDP possono inoltre terminare il processo con diagnostica stderr e exit code non-zero, non con un envelope JSON stdout.

## Finding `PY-RUNTIME-001` — definire il contratto CLI per modalità

**Priorità:** alta  
**Tipo:** entrypoint contract

### Modifica richiesta

Documentare separatamente:

```text
Sofa scrape
→ stdout JSON

Betfair scrape
→ stdout JSON

Betfair login-only
→ lifecycle process
→ nessun JSON finale richiesto
→ readiness = spawn/lifecycle contract

CLI validation failure
→ exit non-zero
→ diagnostica bounded
```

### Test

Aggiungere test espliciti per:

- scrape success;
- scrape input invalid;
- Betfair CDP invalid;
- login-only;
- separazione stdout/stderr.

---

# 2. Lo scraper SofaScore non applica la redazione promessa prima di stderr

## Esito: divergenza diretta documento/codice

Il documento afferma:

```text
I log diagnostici degli scraper devono usare stderr
e devono essere redatti prima della scrittura.
```

Il Betfair scraper possiede effettivamente:

```text
diagnostic_redaction.redact_text()
→ _runtime_text()
→ log_event()
→ stderr/file
```

con allow-list dei campi e bounded text.

## SofaScore

`scrapers/sofa/config.py` definisce invece:

```python
def log(message):
    sys.stderr.write(f"{message}\n")
```

senza redazione.

`scrapers/sofa/browser.py` gli passa anche contenuto dinamico:

```text
Navigating to: https://www.sofascore.com/event/<eventId>
Block detected! Title: <page title>, Status: <status>
Fatal: <raw exception>
```

Il punto più problematico è:

```text
Fatal: {error}
```

perché il testo di eccezione può dipendere da Playwright/browser/runtime.

## stdout error payload

In alcuni failure path SofaScore inserisce inoltre:

```text
"error": str(error)
```

nel JSON di stdout.

Il backend corrente non logga stdout raw, ma il contratto del wrapper rimane più permissivo di quello dichiarato.

## Finding `PY-RUNTIME-002` — introdurre redazione e bounded diagnostics anche per SofaScore

**Priorità:** alta  
**Tipo:** diagnostic redaction

### Target

Usare un logger SofaScore con proprietà equivalenti al contratto Betfair:

```text
stderr
bounded
redacted
static event/code
nessun path/token/header/URL raw non necessario
```

### Error payload stdout

Le failure del wrapper devono preferire:

```text
code
message statica/bounded
```

quando il dettaglio raw non è necessario al consumer.

### Non fare

Non duplicare regex divergenti se esiste la possibilità di un owner Python condiviso per la redazione.

---

# 3. `directFetch.js` accumula stdout SofaScore senza limite

## Esito: gap critico di subprocess I/O

Il percorso SofaScore Node:

```text
directFetch.js
→ spawnOwnedPython(...)
→ scraper.py
```

usa:

```js
let stdout = '';

proc.stdout.on('data', data => {
    stdout += data.toString();
});
```

Non esiste un:

```text
max bytes
max chars
overflow code
```

prima del parse JSON.

## stderr

Il child stderr viene soltanto drenato:

```js
proc.stderr.on('data', () => {});
```

quindi:

- non blocca la pipe;
- ma non produce una diagnostica bounded utile.

## Betfair

Il runner Betfair possiede lo stesso pattern di stdout non bounded.

Quel problema è già registrato come:

```text
BETFAIR-LIFE-010
```

e non va duplicato con una seconda implementazione.

## Rischio

Un child malfunzionante o un payload eccezionalmente grande può far crescere il buffer Node fino al termine del processo.

Il timeout limita la durata, non la memoria accumulata.

## Finding `PY-RUNTIME-003` — rendere bounded il subprocess I/O SofaScore

**Priorità:** critica  
**Tipo:** subprocess output boundedness

### Target Sofa

Definire un massimo esplicito.

Su overflow:

```text
terminate owned child
→ result bounded
→ code statico
→ nessun parse del buffer parziale
```

### stderr

Valutare una coda diagnostica:

```text
bounded
redacted
non pubblica raw
```

senza reintrodurre dati sensibili nei log.

### Coordinamento

Per Betfair riusare:

```text
BETFAIR-LIFE-010
```

La policy massima può essere condivisa, ma le task non devono duplicare lo stesso fix.

---

# 4. Il launcher può force-killare il backend prima del force-timeout interno del backend

## Esito: criticità cross-runtime

Il launcher usa:

```text
_SHUTDOWN_GRACE = 5 secondi
```

per un processo owned.

Dopo il clean signal:

```text
CTRL_BREAK su Windows
SIGTERM su Unix
```

attende al massimo 5 secondi.

Se il processo non è uscito:

```text
_force_kill_tree()
```

## Backend

`createShutdownHandler()` usa invece:

```text
forceExitMs = 6000
```

cioè:

```text
6 secondi
```

prima del proprio:

```text
shutdown_force_timeout
→ process.exit(0)
```

## Conseguenza

La gerarchia attuale è:

```text
launcher parent grace = 5s
backend child force budget = 6s
```

Quindi il launcher può arrivare a:

```text
taskkill /T /F
```

circa un secondo prima che il backend abbia terminato il proprio budget interno.

## Perché conta

Il backend, prima di release writer authority, aspetta:

```text
tracker drain verificato
+
listener close
```

Un force-kill esterno al secondo 5 può interrompere questa sequenza.

Il documento riconosce correttamente che una terminazione brutale può lasciare l'authority sidecar presente.

Il problema è che la configurazione dei timeout rende questa situazione più probabile del necessario anche durante un normale Ctrl+C lento.

## Finding `PY-RUNTIME-004` — rendere coerente la gerarchia dei timeout di shutdown

**Priorità:** critica  
**Tipo:** shutdown coordination

### Invariante

Il parent launcher non dovrebbe escalare prima che il child backend abbia esaurito il proprio shutdown budget.

### Target

Definire una gerarchia esplicita:

```text
backend graceful/force budget
<
launcher force-kill deadline
```

con margine.

La soglia finale deve essere scelta e testata nel codice, non inventata nella documentazione.

### Test

Serve un test cross-runtime deterministico che verifichi:

```text
backend ancora dentro il proprio budget
→ launcher non force-kill

backend oltre il budget parent
→ fallback solo su PID owned
```

---

# 5. Il manifest è scritto atomicamente, ma gli errori di scrittura vengono silenziati

## Esito: durability/observability incompleta

`write_manifest()` usa correttamente:

```text
temp file nella stessa directory
→ json.dump
→ Path.replace(manifest)
```

quindi il meccanismo di replace è atomico.

## Problema

Su `OSError`:

```python
except OSError:
    ...
```

esegue cleanup del temporary file ma:

```text
non rilancia
non restituisce failure
```

Il caller non può sapere che la scrittura è fallita.

## `_safe_write_manifest`

`launcher/app.py` definisce:

```python
try:
    write_manifest(manifest)
    return True
except Exception:
    return False
```

Ma `write_manifest()` ha già inghiottito l'`OSError`.

Quindi una write fisicamente fallita può apparire come:

```text
_safe_write_manifest() == True
```

## Main startup

Anche le chiamate dirette:

```text
write_manifest(manifest)
```

durante startup non verificano un esito strutturato.

Il runtime può quindi procedere pur senza aver persistito lo stato atteso.

## Sicurezza

Il launcher conserva comunque ownership in memoria e il lock è separato.

Quindi non significa automaticamente “killer esterno”.

È però una violazione del contratto di observability/durability del manifest.

## Finding `PY-RUNTIME-005` — rendere osservabile il risultato di `write_manifest`

**Priorità:** alta  
**Tipo:** manifest durability

### Target

`write_manifest()` deve:

```text
restituire risultato strutturato
oppure
rilanciare errore bounded
```

e i caller devono decidere esplicitamente se:

```text
continuare
fallire
degradare
```

### Stati critici

Almeno per:

```text
manifest iniziale
ownership ready
session ready
shutdown state
```

la failure non deve essere invisibile.

### Test

Simulare:

- mkstemp failure;
- replace failure;
- cleanup temporary failure;
- startup con manifest non persistibile.

---

# 6. `launch_requested` CDP può lasciare una URL non verificata nello stato `starting`

## Esito: contratto corretto nel principio ma semanticamente ambiguo

La discovery CDP prova al massimo:

```text
9222
9223
9224
9225
9226
```

e riusa soltanto un endpoint validato.

Questa parte è coerente.

## Helper

Quando una porta libera viene scelta, il PowerShell helper può rispondere:

```text
launch_requested
```

Il launcher esegue subito un singolo probe breve.

Se Chrome non è ancora pronto:

```text
ready = false
```

ma `_set_cdp_helper_result()` registra:

```text
status: starting
ownership: external
selectedPort: <port>
url: http://127.0.0.1:<port>
```

e restituisce comunque quella URL al frontend.

## Nessuna riconciliazione successiva

Nel percorso launcher non esiste poi un passaggio che aggiorni automaticamente:

```text
starting
→ ready
```

quando Chrome diventa disponibile.

La sessione può arrivare a:

```text
session.status = ready
```

con il service CDP ancora:

```text
starting
```

nel manifest.

## Contraddizione documentale interna

Il documento dice correttamente:

```text
può avviare Chrome dedicato
e passa subito al frontend l'URL candidato
```

ma più avanti afferma anche:

```text
Un CDP non disponibile resta vuoto
```

Serve distinguere:

```text
unavailable terminale
→ URL vuota

starting/provisional
→ URL candidata non ancora verificata ready
```

## Finding `PY-RUNTIME-006` — formalizzare e riconciliare lo stato CDP provisional

**Priorità:** alta  
**Tipo:** CDP readiness semantics

### Documento

Distinguere:

```text
ready
starting
unavailable
```

senza chiamare `starting` già disponibile.

### Runtime

Valutare una riconciliazione bounded:

```text
launch requested
→ probe bounded
→ ready oppure unavailable/provisional esplicito
```

oppure mantenere `starting` ma renderne chiaro il significato a manifest/frontend/preflight.

### Test

Aggiungere:

```text
launch_requested + immediate ready
launch_requested + delayed ready
launch_requested + never ready
```

---

# 7. Il backend avviato dal launcher non ha ancora un bind loopback esplicito

## Esito: current-vs-target da rendere visibile

Il frontend Vite viene avviato esplicitamente con:

```text
--host 127.0.0.1
```

Il launcher verifica backend attraverso:

```text
http://127.0.0.1:<port>/api/health
```

ma `_start_node_backend()` esegue soltanto:

```text
node server.js
```

con:

```text
PORT=<port>
```

## Backend

`startServer()` usa:

```text
app.listen(port)
```

senza un host esplicito.

Quindi:

```text
health probe loopback
```

non equivale a:

```text
listener bound solo a loopback
```

## Finding già approvato

Il problema è già presente nelle task:

```text
ARCH-BOUND-002
RUNTIME-HEALTH-001
IMPL-017
```

e non deve essere implementato due volte.

## Finding `PY-RUNTIME-007` — allineare questo owner al local HTTP boundary

**Priorità:** alta  
**Tipo:** local runtime boundary

### Modifica richiesta

Nel documento distinguere:

```text
stato corrente
→ launcher raggiunge backend via loopback
→ bind backend non ancora esplicitamente loopback

target approvato IMPL-017
→ bind loopback + Host/Origin locali
```

### Implementazione

Riusare esclusivamente la task owner `IMPL-017`.

Questo change ID serve all'allineamento del documento/runtime owner, non ad aprire un secondo refactor parallelo.

---

# 8. `BACKEND_SCRIPT` è rimasto in config ma il launcher non lo usa

## Esito: configurazione legacy

`launcher/config.py` definisce:

```text
CDP_SCRIPT
BACKEND_SCRIPT
FRONTEND_DIR
```

Il documento descrive `config.py` come owner di:

```text
script PowerShell
```

## Runtime corrente

`launcher/services.py` importa:

```text
CDP_SCRIPT
FRONTEND_DIR
ports
ROOT
```

ma non importa:

```text
BACKEND_SCRIPT
```

Il backend viene avviato direttamente tramite:

```text
subprocess.Popen(["node", "server.js"])
```

con cwd:

```text
backend/src
```

Esiste ancora:

```text
scripts/start-backend-dev.ps1
```

ma non è l'entrypoint usato dal launcher canonico.

## Finding `PY-RUNTIME-008` — rimuovere o classificare la configurazione backend PowerShell legacy

**Priorità:** bassa  
**Tipo:** launcher configuration cleanup

### Target

Scegliere una sola verità documentale:

```text
launcher canonico
→ direct Node backend start
```

Se `BACKEND_SCRIPT` non ha più consumer:

```text
rimuovere costante
```

e valutare separatamente il destino dello script.

Se lo script resta utile per sviluppo manuale:

```text
documentarlo come helper manuale
non come launcher runtime dependency
```

### Non fare

Non cambiare il launcher per usare PowerShell soltanto per rendere utile una costante legacy.

---

# 9. Il documento duplica gran parte del contratto operativo di `operations/01-local-runtime.md`

## Esito: ownership documentale sovrapposta

Entrambi i documenti descrivono in dettaglio:

- launcher lock;
- writer authority;
- porte;
- backend/frontend reuse;
- CDP;
- manifest;
- shutdown;
- force-kill;
- validation live.

`operations/01-local-runtime.md` è già l'owner naturale del comportamento operativo:

```text
come avviare
come diagnosticare
come interpretare il runtime
```

Questo documento dovrebbe invece possedere soprattutto:

```text
wrapper compatibili
entrypoint Python
struttura launcher
contratti CLI
confini implementativi launcher
```

## Rischio

Due owner completi dello stesso lifecycle possono divergere su:

- timeout;
- stato CDP;
- validation;
- writer authority;
- shutdown sequence.

## Finding `PY-RUNTIME-009` — ridurre la duplicazione con Local Runtime e validation history

**Priorità:** media  
**Tipo:** documentation ownership

### Target

Mantenere qui:

- wrapper root;
- CLI contract;
- launcher module ownership;
- process ownership implementation;
- invarianti Python;
- link agli owner.

Spostare/ridurre:

```text
storia del collaudo live
istruzioni operative duplicate
diagnostica operativa
descrizione completa della writer authority
```

verso:

```text
operations/01-local-runtime.md
validation/register owner
storage owner
```

### Stato

Non eliminare evidenze storiche.

Preservarle nell'owner corretto con metadata reali quando disponibili.

---

# 10. La verification matrix non copre i nuovi confini critici

## Esito: test launcher buoni, coverage cross-runtime incompleta

Il documento elenca correttamente:

```text
py_compile wrapper
compileall launcher/scrapers
launcher.tests.test_launcher
import smoke
server.test.mjs
writer authority test
matchTracker test
```

La suite launcher è ampia e verifica realmente:

- foreign listener no-kill;
- backend identity;
- frontend identity;
- stale lock;
- ownership;
- CDP bounded discovery;
- Vite direct launch;
- graceful/force kill;
- session reuse.

## Gap

Non verifica in modo unitario/integrato:

```text
wrapper stdout contract per modalità
Betfair login-only no-JSON
Sofa stderr redaction
Sofa stdout overflow
launcher 5s vs backend 6s timeout hierarchy
manifest write failure observability
CDP starting → delayed ready reconciliation
backend loopback bind target
```

`directFetch.test.mjs` verifica:

- generation;
- timeout;
- physical queue;
- safe structured logs;

ma non:

```text
stdout max size
stderr bounded diagnostics
```

Il Betfair stdout gap è già coperto dalla task di verifica:

```text
BETFAIR-LIFE-011
```

## Finding `PY-RUNTIME-010` — estendere la verifica entrypoint/runtime

**Priorità:** alta  
**Tipo:** verification contract

### Aggiungere

Test Python/Node deterministici per:

```text
CLI mode contracts
redaction Sofa
stdout overflow Sofa
manifest write failures
CDP provisional readiness
shutdown timeout hierarchy
local bind dopo IMPL-017
```

### Manuale

Il collaudo live deve restare complementare e non sostituire questi test.

---

# 11. Wrapper root

## Esito: corretti

I tre wrapper sono realmente sottili.

### `avvio.py`

Importa:

```text
launcher.app.main
```

e lo esegue soltanto come main module.

### `scraper.py`

Importa:

```text
scrapers.sofa.cli.main
```

e usa:

```text
asyncio.run(main())
```

### `betfair_scraper.py`

Importa:

```text
scrapers.betfair.cli.main
```

e non contiene logica di scraping.

Questa parte del documento è corretta.

---

# 12. Launcher lock

## Esito: modello conservativo corretto

Il lock schema 2 contiene:

```text
project
sessionId
pid
createdAt
processIdentity
```

La classification distingue:

```text
active
stale
unknown
absent
```

e recupera soltanto:

```text
positively stale
```

Un lock:

```text
active
unknown
busy
```

blocca l'acquisizione.

Questo è coerente con il documento.

## PID reuse

La classification usa:

```text
startFingerprint
```

e può classificare:

```text
pid_recycled
→ stale
```

senza fidarsi del solo PID.

Questa proprietà va preservata.

---

# 13. Session reuse

## Esito: coerente

Il main:

```text
legge manifest
→ crea nuova launcher identity
→ acquisisce/reclama lock
→ solo dopo verifica manifest reusable
```

Quindi una seconda invocazione con lock della prima ancora attivo:

```text
non arriva a session_reuse
non apre browser
```

La reuse dopo launcher morto richiede invece:

```text
lock reclaim positivo
+
manifest schema valido
+
backend identity coerente
+
frontend identity coerente
```

Questo contratto è corretto.

---

# 14. Backend reuse

## Esito: coerente

Il backend viene riusato soltanto quando:

```text
/api/health
→ ok:true
→ project tennis-decision-ui
→ pid valido
→ instanceId valido
```

Per un backend appena spawnato viene verificato anche:

```text
reported pid == proc.pid
```

Il launcher non considera un listener foreign come owned e non lo termina.

Questa parte deve restare.

---

# 15. Frontend reuse

## Esito: coerente

La identity frontend verifica:

- `project`;
- `service=frontend`;
- instanceId;
- pid;
- startedAt;
- frontendPort;
- backendTarget.

Il frontend viene riusato soltanto quando:

```text
backendTarget
```

corrisponde al backend scelto.

La CLI Vite locale viene invocata direttamente con:

```text
node <vite.js>
--host 127.0.0.1
--port <port>
--strictPort
```

e non tramite `npm`, `.cmd` o `.bat`.

Questa parte è corretta.

---

# 16. CDP ownership

## Esito: coerente nel principio

Il launcher non registra CDP come:

```text
owned
```

Neppure quando ha richiesto al helper di avviare Chrome.

Il manifest usa:

```text
reused
external
unknown
```

per CDP e impone:

```text
cdp owned
→ invalido
```

Quindi lo shutdown launcher non prova a chiudere Chrome/CDP.

Questa proprietà è coerente.

Il gap riguarda soltanto:

```text
starting/provisional readiness
```

trattato in `PY-RUNTIME-006`.

---

# 17. Launcher process ownership

## Esito: corretto

`launcher/services.py` possiede una lista in memoria di:

```text
backend
frontend
```

avviati dalla sessione corrente.

La terminazione:

```text
_stop_owned_entry()
```

richiede che l'entry sia ancora registrata e che:

```text
proc.pid == entry.pid
```

Il fallback Windows usa:

```text
taskkill /PID <owned pid> /T /F
```

non una porta.

Quindi il divieto:

```text
no kill by port
```

è realmente rispettato.

---

# 18. Backend Python process registry

## Esito: separazione corretta

Il registry Node possiede ruoli:

```text
sofa_tracking
betfair_tracking
betfair_login
```

con:

- execution ID;
- owner token;
- generation;
- PID;
- completion;
- graceful/force termination.

Non coincide con il launcher ownership registry.

Questa separazione è corretta.

## Limite già registrato

La Python generation:

```text
tracking/login
```

non è una tracking session authority end-to-end.

Il problema è già posseduto da:

```text
IMPL-006
SOURCE-ID-001
BETFAIR-LIFE-004/005
FRONT-POLL-009
```

Non viene duplicato in questo report.

---

# 19. Writer authority

## Esito: owner correttamente separato

`startServer()` segue:

```text
create writer authority
→ acquire
→ recovery
→ listener readiness
→ register shutdown
```

Se acquisition fallisce:

```text
no recovery
no listener
no shutdown runtime registration
```

Se recovery fatal/rejected:

```text
release authority
→ no listener
```

Questa parte del documento è coerente.

L'implementazione dettagliata della writer authority resta correttamente fuori da questo owner.

---

# 20. Shutdown backend

## Esito: ordine interno sostanzialmente corretto

Il backend:

```text
server.close requested
→ tracker drain avviato
   → terminalTrackerBarrier=true
   → tracker/scheduler stop
   → attesa active operations
→ Python cleanup
→ await tracker drain
→ await listener close
→ release authority soltanto se drain positivo
→ exit
```

Un drain fallito:

```text
→ authority retained
```

Questa è una proprietà fail-closed corretta.

La criticità è la deadline parent launcher più corta, non l'ordine interno.

---

# 21. Manifest

## Esito: schema e owner checks robusti, write result debole

Il manifest schema verifica:

- project;
- session identity;
- service statuses;
- ownership;
- URL/port coherence;
- backend/frontend identity;
- backend target.

`remove_manifest()` rimuove soltanto un manifest appartenente alla session identity corrente.

Questa parte è robusta.

Il gap riguarda esclusivamente:

```text
write failure observability
```

trattato in `PY-RUNTIME-005`.

---

# 22. Lunghezza, integrità del contesto e modularizzazione

## Valutazione

```text
Righe: 322
Responsabilità primaria: entrypoint Python + implementation facade launcher
Sottotemi:
- wrapper root
- CLI contract
- launcher modules
- lock/manifest
- service resolution
- shutdown
- collegamento writer/process registry

Owner operativi collegati: già esistenti
Duplicazione con operations/01-local-runtime.md: significativa
Necessità di nuovi documenti canonici: no
Necessità di split fisico: no
```

La soluzione non è dividere questo file in:

```text
wrappers.md
launcher-lock.md
launcher-shutdown.md
```

perché esistono già owner specialistici e un owner operativo.

La correzione è:

```text
rendere 01-entrypoints-and-runtime.md
un facade tecnico Python/launcher più compatto
```

e rinviare:

- comportamento operativo → `operations/01-local-runtime.md`;
- storage authority → storage owner;
- Betfair scraper lifecycle → Betfair owner;
- live validation → validation owner.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non deve essere creata una task di split.

La riduzione delle duplicazioni resta invece una task normale:

```text
PY-RUNTIME-009
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-024
Percorso report: Report documentale/24 - 01-entrypoints-and-runtime.md
Documento: docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md
Change ID: PY-RUNTIME-001
Change ID: PY-RUNTIME-002
Change ID: PY-RUNTIME-003
Change ID: PY-RUNTIME-004
Change ID: PY-RUNTIME-005
Change ID: PY-RUNTIME-006
Change ID: PY-RUNTIME-007
Change ID: PY-RUNTIME-008
Change ID: PY-RUNTIME-009
Change ID: PY-RUNTIME-010
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
BETFAIR-LIFE-004
BETFAIR-LIFE-005
BETFAIR-LIFE-010
BETFAIR-LIFE-011
ARCH-BOUND-002
RUNTIME-HEALTH-001
IMPL-006
IMPL-017
SOURCE-ID-001
FRONT-POLL-009
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 024
→ indice 24 ANALIZZATO
→ Divisione non necessaria
→ aggiungere PY-RUNTIME-001..010

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-024
→ appendere PY-RUNTIME-001..010
→ split_required:false
→ proposed_files:[]
→ preservare integralmente il ledger precedente
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `PY-RUNTIME-001` — CLI mode contract

**Priorità:** high

- distinguere Sofa scrape, Betfair scrape e Betfair login-only;
- stdout JSON soltanto dove è realmente il result channel;
- readiness login posseduta dal process lifecycle;
- documentare exit/error channel;
- aggiungere test wrapper/CLI.

## `PY-RUNTIME-002` — Sofa diagnostic redaction

**Priorità:** high

- logger Sofa bounded/redacted;
- niente raw exception diagnostiche non necessarie;
- mantenere stderr come diagnostic channel;
- valutare error payload stdout statici;
- riusare policy condivisa quando possibile.

## `PY-RUNTIME-003` — Sofa subprocess output boundedness

**Priorità:** critical

- limite stdout in `directFetch`;
- overflow → terminate owned child;
- code statico;
- stderr bounded/redacted se raccolto;
- coordinare Betfair con `BETFAIR-LIFE-010`.

## `PY-RUNTIME-004` — shutdown timeout hierarchy

**Priorità:** critical

- parent launcher non deve precedere il budget child;
- margine esplicito;
- test cross-runtime;
- force-kill soltanto PID owned;
- preservare fail-closed writer authority.

## `PY-RUNTIME-005` — manifest write observability

**Priorità:** high

- non inghiottire write/replace failure;
- risultato strutturato o exception bounded;
- caller startup/shutdown consapevoli dell'esito;
- test I/O failure.

## `PY-RUNTIME-006` — CDP provisional readiness

**Priorità:** high

- distinguere starting/ready/unavailable;
- documentare URL candidata;
- riconciliazione bounded o stato provisional esplicito;
- test delayed/never-ready.

## `PY-RUNTIME-007` — local backend boundary

**Priorità:** high

- dichiarare bind backend corrente non esplicito;
- applicare solo tramite IMPL-017;
- allineare Runtime Health/Architecture;
- non confondere loopback probe con loopback bind.

## `PY-RUNTIME-008` — legacy BACKEND_SCRIPT config

**Priorità:** low

- direct Node è launcher authority corrente;
- rimuovere costante se dead;
- oppure classificare PowerShell script come helper manuale;
- nessun refactor opportunistico del launcher.

## `PY-RUNTIME-009` — document ownership deduplication

**Priorità:** medium

- questo file = facade tecnico Python/launcher;
- local runtime operativo = operations owner;
- writer authority = storage owner;
- validation live = validation owner;
- ridurre testi duplicati senza perdere evidenze.

## `PY-RUNTIME-010` — verification contract

**Priorità:** high

- CLI mode tests;
- Sofa redaction;
- stdout overflow;
- manifest failure;
- CDP provisional;
- shutdown timeout hierarchy;
- bind local dopo IMPL-017;
- mantenere launcher suite esistente.

---

# Ordine consigliato di applicazione

```text
1. PY-RUNTIME-004 — shutdown timeout hierarchy
2. PY-RUNTIME-003 — Sofa stdout boundedness
3. BETFAIR-LIFE-010 — Betfair stdout boundedness
4. PY-RUNTIME-005 — manifest write observability
5. PY-RUNTIME-002 — Sofa diagnostic redaction
6. PY-RUNTIME-006 — CDP provisional readiness
7. IMPL-017 / PY-RUNTIME-007 — local backend boundary
8. PY-RUNTIME-001 — CLI mode contract
9. PY-RUNTIME-010 — verification
10. PY-RUNTIME-008 — legacy config cleanup
11. PY-RUNTIME-009 — document owner cleanup
12. revisione mirata 01-entrypoints-and-runtime.md
13. checker documentali
14. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

---

# Verifica prevista dopo un'eventuale modifica

## Wrapper

```text
python scraper.py <urls>
→ stdout JSON
→ diagnostics stderr

python betfair_scraper.py <url> ...
→ stdout JSON in scrape mode

python betfair_scraper.py <url> --login-only ...
→ lifecycle process
→ nessun JSON finale richiesto
```

## Redaction Sofa

Iniettare diagnostica con:

```text
URL
Windows path
Unix path
token
header/cookie
raw exception text
```

e verificare:

```text
stderr bounded
segreti/path redatti
```

## Sofa stdout

```text
payload sotto limite
→ parse normale

payload oltre limite
→ child termination
→ bounded error
→ nessuna crescita successiva
```

## Shutdown hierarchy

Simulare:

```text
backend completa al limite interno
→ launcher non lo force-killa prematuramente
```

e:

```text
backend non completa oltre deadline parent
→ fallback owned PID
```

## Writer authority

Verificare che il timeout parent non introduca:

```text
release anticipato
```

e che una kill brutale lasci il recovery al backend successivo.

## Manifest

Simulare:

```text
mkstemp failure
write failure
replace failure
```

e verificare che il caller non registri falso successo.

## CDP

```text
existing ready
→ reused

launch_requested + ready immediato
→ ready

launch_requested + delayed ready
→ stato finale deterministico

launch_requested + never ready
→ unavailable/provisional secondo contratto
```

## Local bind

Dopo IMPL-017:

```text
backend listener
→ loopback only

Host non locale
→ rifiutato secondo owner

Origin non locale
→ rifiutato secondo owner
```

## Regression

Mantenere:

```powershell
python -m py_compile .\avvio.py .\scraper.py .\betfair_scraper.py
python -m compileall launcher scrapers
python -m unittest launcher.tests.test_launcher
```

e:

```text
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.test.mjs
backend/src/sofa/matchTracker.test.mjs
backend/src/sofa/directFetch.test.mjs
```

oltre alle suite Betfair lifecycle owner.

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
01-entrypoints-and-runtime.md: ARCHITETTURA CORRETTA, BOUNDARY RUNTIME DA IRROBUSTIRE

wrapper root: corretti
launcher lock: corretto
stale lock reclaim: conservativo
writer authority separata: corretta
backend identity reuse: corretto
frontend identity reuse: corretto
no kill by port: corretto
frontend loopback bind: corretto
process ownership: corretto
Python registry separato: corretto
backend bootstrap order: corretto
backend drain/release order: corretto

CLI stdout JSON: non universale
Betfair login-only: lifecycle, non JSON result
Sofa stderr redaction: assente
Sofa stdout boundedness: assente
Betfair stdout boundedness: già finding aperto
launcher shutdown grace 5s < backend force budget 6s
manifest write failure: silenziata
_safe_write_manifest: può risultare true dopo write fallita
CDP starting: URL candidata non-ready
CDP starting→ready reconciliation: assente
backend loopback bind: target non ancora implementato
BACKEND_SCRIPT: legacy/non usato dal launcher
runtime document ownership: duplicato
cross-runtime verification: incompleta

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: critica
```

Il documento deve restare un singolo facade tecnico.

La correzione più urgente non riguarda la struttura dei wrapper.

Riguarda la relazione temporale fra:

```text
launcher parent
→ backend child
→ tracker drain
→ Python cleanup
→ writer authority release
→ force kill
```

Il parent non deve interrompere il child prima che il child abbia esaurito il proprio shutdown contract.

La seconda regola centrale è:

```text
subprocess output
→ machine-readable dove previsto
→ bounded
→ diagnostics redatte
→ mode contract esplicito
```

senza assumere che ogni modalità Python produca lo stesso tipo di stdout.

---

# Aggiornamento applicativo

Il documento canonico è stato riallineato al codice corrente senza modificare
launcher, scraper o test.

Completate:

```text
PY-RUNTIME-007
→ distinti probe e bind loopback
→ documentato il bind backend reale su 127.0.0.1

PY-RUNTIME-008
→ direct Node start confermato come authority launcher
→ script PowerShell classificato come helper manuale

PY-RUNTIME-009
→ separati owner tecnico, runbook operativo ed evidenze live
```

Il documento registra inoltre, senza presentarli come già risolti, i contratti
per modalità CLI, lo stato CDP provisional, la failure non osservabile del
manifest, la gerarchia 5s/6s dello shutdown e i gap della matrice di verifica.

Le task `PY-RUNTIME-001–006` e `PY-RUNTIME-010` sono state successivamente
applicate:

- contratti CLI separati e testati;
- diagnostica SofaScore bounded/redacted;
- stdout SofaScore limitato con terminazione owned su overflow;
- grace launcher superiore al budget backend;
- failure del manifest propagata e testata;
- CDP post-helper riconciliata con probe bounded;
- matrice di test runtime estesa.

Stato finale del report: `PY-RUNTIME-001–010` completate e verificate.

Operazioni Git di scrittura: nessuna.
