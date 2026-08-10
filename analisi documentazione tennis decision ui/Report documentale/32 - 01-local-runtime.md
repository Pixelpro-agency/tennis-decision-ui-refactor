# Report documentale — `docs/tennis-decision-ui/operations/01-local-runtime.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-032
Sequenza audit: 32/72
Documento analizzato: 01-local-runtime.md
Percorso documento: docs/tennis-decision-ui/operations/01-local-runtime.md
Percorso report: Report documentale/32 - 01-local-runtime.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: b9810c6b75a40d561cc871a89b0a390d29eb40e9
Dimensione documento: 568 righe
Ruolo dichiarato: runbook/owner operativo dell'avvio, riuso e shutdown dello stack locale
Stato report: applicato e verificato
```

Il documento è stato confrontato con:

- `avvio.py`;
- `launcher/app.py`;
- `launcher/config.py`;
- `launcher/session.py`;
- `launcher/services.py`;
- `launcher/system.py`;
- `launcher/tests/test_launcher.py`;
- `scripts/start-cdp-dev.ps1`;
- `frontend/vite.config.js`;
- `frontend/src/App.jsx`;
- `frontend/src/hooks/useAnalysisSessionState.js`;
- `backend/src/server.js`;
- `backend/src/runtime/matchHistoryWriterAuthority.js`;
- `scripts/validation/test-manifest.json`;
- `docs/tennis-decision-ui/reference/01-repository-map.md`;
- `docs/validations/README.md`;
- i finding già registrati nei report precedenti, in particolare `PY-RUNTIME-*`, `RUNTIME-HEALTH-*`, `ARCH-BOUND-*`, `DATA-LIFE-*`, `SOFA-LIVE-*`, `STORAGE-TH-*` e `JOURNAL-REC-*`.

La mappa Markdown di continuazione e il JSON incrementale di continuazione vengono aggiornati separatamente al termine del checkpoint documentale; il presente report resta un artefatto autonomo e non contiene la logica del checkpoint.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA

avvio root tramite avvio.py: corretto
launcher lock prima del fast-path di riuso: corretto nel codice
lock active/unknown fail-closed: implementato
reclaim solo stale positivo: implementato
manifest schema 2: implementato
manifest write atomica: tentata
backend/frontend ownership: implementata
nessun kill per porta: implementato
process tree kill solo su PID owned: implementato
backend/frontend port fallback: implementato
frontend identity endpoint: implementato
CDP bounded discovery: implementata
CDP non-owned: implementato
Vite relative /api proxy: implementato
writer authority backend-owned: implementata
writer authority distinta dal launcher lock: corretta
shutdown backend drain-before-release: implementato
Chrome/CDP preservato dal launcher: implementato

backend reuse working-copy aware: ASSENTE
backend health identity: non contiene repository/storage identity
launcher backend identity check: project marker soltanto
backend di un'altra working copy: può essere riusato
frontend conseguente: può essere legato al backend della working copy sbagliata

backend bounded discovery: ordine subottimale
porta 3001 libera + backend riusabile su 3002
→ spawn nuovo backend su 3001 prima di cercare 3002
→ writer authority può rifiutare il child
→ attesa health prima del riuso esistente

launcher CLI failure contract: assente
lock blocked / backend failed / frontend failed
→ main() ritorna normalmente
→ avvio.py può terminare con exit code 0

manifest write failure: già censita in PY-RUNTIME-005
CDP provisional starting: già censito in PY-RUNTIME-006
launcher grace 5s vs backend force timeout 6s: già censito in PY-RUNTIME-004
loopback bind target: già censito in PY-RUNTIME-007
BACKEND_SCRIPT dead/legacy: già censito in PY-RUNTIME-008

CDP propagation descritta troppo direttamente:
launcher non configura il backend con VITE_CDP_URL
→ la URL entra nel frontend
→ diventa session state
→ viene inviata alle route/applicazioni che la consumano
session reuse non rivalida CDP

browser_open: best-effort ma documentato come fatto garantito
webbrowser.open result: ignorato
failure browser non degrada session ready

"collaudo runtime finale" inline:
artifact dedicato sotto docs/validations non individuato
pass storici non devono essere prova corrente

Modifiche nuove proposte: 7
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: CRITICA
```

Il documento ha l'owner corretto.

Deve restare il runbook operativo che risponde a:

```text
come parte lo stack?
quale servizio viene riusato?
quale processo è owned?
cosa può essere terminato?
come si distingue launcher lock da writer authority?
cosa succede su shutdown?
```

Non deve diventare il secondo owner tecnico di:

- writer authority;
- tracking drain;
- persistence recovery;
- Python registry;
- scraper lifecycle.

La revisione deve quindi rafforzare le authority di riuso e il contratto CLI, riducendo nel contempo le duplicazioni degli owner specialistici.

---

# 1. Il backend riusabile non è legato alla working copy corrente

## Esito: gap critico di runtime identity

Il documento afferma:

```text
Un backend esistente viene riusato soltanto dopo verifica health
e identità Tennis Decision UI.
```

Questo è formalmente vero, ma l'identità verificata è insufficiente.

## Backend health corrente

`GET /api/health` espone almeno:

```text
ok
service
project
instanceId
pid
startedAt
pythonProcesses
```

Non espone:

```text
repositoryIdentity
storageIdentity
workingCopyIdentity
```

## Launcher check

`check_backend_identity()` accetta come Tennis Decision UI un endpoint quando:

```text
ok === true
project === tennis-decision-ui
```

Durante il riuso `resolve_backend()` richiede inoltre:

```text
pid positivo
instanceId non vuoto
```

Questi dati identificano:

```text
un processo Tennis Decision UI
```

ma non:

```text
il processo Tennis Decision UI della working copy corrente
```

## Scenario concreto

Working copy A:

```text
C:\repo-A\
backend attivo su 3001
storage A
```

Working copy B:

```text
C:\repo-B\
utente esegue python avvio.py
```

Il launcher B trova 3001 occupata.

Se `/api/health` di A restituisce:

```text
project: tennis-decision-ui
instanceId valido
pid valido
```

`resolve_backend()` può classificarlo:

```text
ownership: reused
```

e configurare il frontend B con:

```text
VITE_BACKEND_TARGET=http://127.0.0.1:3001
```

A quel punto il frontend aperto dalla working copy B parla con il backend della working copy A.

## Perché la writer authority non risolve il problema

La writer authority protegge:

```text
repositoryIdentity
storageIdentity
```

del backend che la possiede.

Ma il launcher non consulta quelle identità quando decide il riuso.

Quindi:

```text
writer authority
→ impedisce due writer sulla stessa storage

non
→ impedisce al launcher di riusare la storage sbagliata
```

## Primitive già esistente

`matchHistoryWriterAuthority.js` calcola identità opache:

```text
sha256:<64 hex>
```

a partire dai path canonici normalizzati.

Questa proprietà è utile perché consente di confrontare working copy/storage senza esporre path personali.

## Finding `LOCAL-RUNTIME-001` — rendere il riuso backend working-copy aware

**Priorità:** critical  
**Tipo:** local runtime service identity

### Target

Il launcher deve riusare un backend soltanto quando prova:

```text
project
process identity
repository identity attesa
storage identity attesa
```

o un'identità runtime equivalente e opaca.

### Requisiti

Non esporre:

```text
path repository raw
path storage raw
username
profilo Windows
```

Usare identifier bounded/opachi.

### Possibile authority

Condividere la stessa funzione/semantica che genera:

```text
repositoryIdentity
storageIdentity
```

per la writer authority.

Non creare hash diversi con normalizzazioni diverse fra Python e Node senza test cross-runtime.

### Frontend

Il frontend non deve calcolare questa identity.

È il launcher a validare il backend prima di configurare:

```text
VITE_BACKEND_TARGET
```

### Test

Aggiungere almeno:

```text
same project + same working copy
→ reusable

same project + different repositoryIdentity
→ not reusable

same project + same repository + different storageIdentity
→ not reusable

health senza runtime identity
→ non reusable secondo il nuovo schema
```

---

# 2. `resolve_backend()` avvia un nuovo backend prima di cercare un backend riusabile sulle porte successive

## Esito: startup inefficiente e creazione evitabile di un writer concorrente

Il documento descrive le porte come:

```text
preferite, non riservate
```

e ammette il riuso di un backend valido.

## Algoritmo corrente

Per ogni candidate:

```text
3001
3002
3003
3004
3005
```

`resolve_backend()` fa:

```text
se porta libera
→ avvia immediatamente backend

se porta occupata
→ prova identità e riuso
```

Non esegue prima una discovery read-only dell'intero set bounded.

## Scenario

Esiste già il backend corretto su:

```text
3002
```

ma:

```text
3001 è libera
```

La nuova invocazione launcher:

1. vede 3001 libera;
2. avvia un nuovo Node backend su 3001;
3. il nuovo backend prova ad acquisire la writer authority;
4. l'authority della stessa working copy può rifiutarlo;
5. il launcher attende la readiness/timeout del child;
6. soltanto dopo passa a 3002;
7. scopre il backend già riusabile.

## Problema

Il sistema possiede già:

```text
backend corretto e riusabile
```

ma crea comunque:

```text
un processo concorrente destinato a fallire
```

prima di trovarlo.

La writer authority rende il fallimento sicuro lato storage, ma non rende l'orchestrazione efficiente o semanticamente corretta.

## Finding `LOCAL-RUNTIME-002` — discovery backend read-only prima dello spawn

**Priorità:** high  
**Tipo:** launcher backend resolution

### Target

Separare:

```text
fase 1: bounded discovery/reuse
fase 2: start
```

### Sequenza preferibile

Per le candidate bounded:

```text
probe porte occupate
→ valida backend TDUI + working-copy identity
→ se uno riusabile: reuse
```

Solo se nessun backend riusabile esiste:

```text
scegli una porta libera
→ avvia un solo backend
```

### Fail-fast child

Quando viene avviato un backend owned:

```text
process exit prima della health readiness
```

deve interrompere l'attesa il prima possibile.

Non attendere l'intero budget se il child è già terminato per:

```text
writer_authority_unavailable
recovery_fatal
bootstrap failure
```

Il dettaglio deve restare bounded/redatto.

### Non fare

Non aggirare la writer authority scegliendo una porta ulteriore.

Il port fallback non è un meccanismo per ottenere una seconda storage authority.

---

# 3. `python avvio.py` non possiede un contratto di exit status affidabile

## Esito: false success CLI possibile

`avvio.py`:

```text
main()
```

non traduce il risultato in un exit status esplicito.

## Lock bloccato

In `launcher/app.py`:

```text
acquire_or_recover_lock(...)
→ acquired:false
→ log
→ return
```

Il processo Python termina normalmente.

## Backend failure

Quando:

```text
resolve_backend()
→ ok:false
```

`main()`:

```text
marca manifest failed
→ return
```

e poi esegue il `finally`.

## Frontend failure

Stesso comportamento:

```text
manifest failed
→ return
```

## Risultato CLI

Per i failure path gestiti non viene sollevata una exception e non viene passato un codice a `SystemExit`.

Quindi un caller può osservare:

```text
process exit 0
```

pur avendo avuto:

```text
backend_failed
frontend_failed
lock blocked/busy/unknown
```

## Distinzione necessaria

Il lock active può essere considerato:

```text
already running / intentionally blocked
```

e non necessariamente lo stesso tipo di errore di:

```text
frontend failed
```

Ma oggi questa distinzione non esiste nel process exit contract.

## Finding `LOCAL-RUNTIME-003` — definire il contratto CLI di `avvio.py`

**Priorità:** high  
**Tipo:** launcher CLI outcome

### Target

Definire esiti machine-readable/stabili almeno per:

```text
startup complete
session reuse complete
launcher already active / blocked
backend startup failed
frontend startup failed
coordination failure
launcher exception
shutdown partial failure
```

### Exit status

Gli errori reali di bootstrap non devono terminare implicitamente come successo.

Il caso:

```text
second launcher blocked perché il primo è attivo
```

può avere una semantica dedicata, ma deve essere intenzionale e testata.

### Implementazione

Preferire:

```text
main() → outcome/code
avvio.py → SystemExit(code)
```

oppure equivalente.

Non stampare stack per failure attese.

### Test

Aggiungere test CLI/subprocess per i principali esiti.

Coordinare la copertura con:

```text
PY-RUNTIME-010
```

senza duplicare un secondo entrypoint.

---

# 4. La propagazione CDP nel documento attribuisce al launcher un collegamento diretto con backend e scraper che non esiste

## Esito: incongruenza documentale

Il documento afferma:

```text
La URL scelta viene propagata esattamente
a frontend, backend e scraper.
```

## Launcher reale

Quando avvia Vite, il launcher imposta:

```text
VITE_CDP_URL
```

nel processo frontend.

Quando avvia il backend, imposta:

```text
PORT
```

ma non passa:

```text
CDP_URL
VITE_CDP_URL
```

al processo Node.

## Frontend

`useAnalysisSessionState.js` inizializza:

```text
INITIAL_CDP_URL
← import.meta.env.VITE_CDP_URL
```

e successivamente mantiene:

```text
cdpUrl
confirmedCdpUrl
```

come stato di sessione modificabile.

## Propagazione effettiva

La catena reale è più vicina a:

```text
launcher resolve_cdp
→ VITE_CDP_URL all'avvio Vite
→ initial frontend session state
→ eventuale modifica/conferma sessione
→ request applicativa
→ backend
→ runner/scraper interessato
```

Non:

```text
launcher
→ backend startup CDP config
```

## Session reuse

`is_manifest_reusable()` rivalida:

```text
backend
frontend
backendTarget
```

ma non rivalida il servizio CDP registrato.

Questo secondo problema di readiness/reconciliation è già censito in:

```text
PY-RUNTIME-006
```

e non viene duplicato.

## Finding `LOCAL-RUNTIME-004` — documentare la catena reale della CDP URL

**Priorità:** medium  
**Tipo:** runtime configuration provenance

### Documento

Separare:

```text
launcher-discovered CDP
frontend initial CDP
confirmed session CDP
backend request CDP
scraper effective CDP
```

### Regola

Non chiamare la URL launcher una configurazione backend globale.

### Session reuse

Documentare che il riuso corrente non prova nuovamente CDP e collegare:

```text
PY-RUNTIME-006
```

come hardening già aperto.

### Test

Quando `PY-RUNTIME-006` verrà applicata, aggiungere scenari:

```text
manifest reusable + CDP ancora valido
manifest reusable + CDP stale
manifest reusable + CDP starting
```

senza creare una seconda logica di CDP nel frontend.

---

# 5. `browser_open` è best-effort, non parte della readiness verificata

## Esito: promessa operativa troppo forte

Il documento usa più volte formulazioni come:

```text
manifest pronto
→ apertura browser
```

e nella verifica:

```text
browser aperto sull'URL frontend effettivo
```

## Codice

`open_browser(url)`:

```text
log browser_open
→ webbrowser.open(url)
```

Il valore restituito da:

```text
webbrowser.open()
```

non viene verificato.

Non esiste un risultato:

```text
opened
failed
unsupported
```

## Effetto

La sessione può essere:

```text
ready
backend ok
frontend ok
```

anche se il browser non è stato effettivamente aperto.

Questo non deve causare rollback dei servizi.

Il browser è una convenience operativa, non una precondizione della readiness dello stack.

## Finding `LOCAL-RUNTIME-005` — separare service readiness da browser convenience

**Priorità:** medium  
**Tipo:** launcher user-interface handoff

### Target

Il documento deve dire:

```text
stack ready
→ launcher tenta apertura browser
```

non:

```text
stack ready
→ browser certamente aperto
```

### Runtime

Valutare un risultato bounded:

```text
browser_open_requested
browser_open_failed
```

senza trasformare un browser failure in teardown automatico del backend/frontend.

### Operatore

In caso di failure deve restare disponibile l'URL frontend effettivo.

### Test

Aggiungere:

```text
webbrowser.open returns false
→ servizi restano ready
→ outcome/log distinguibile
```

---

# 6. Il “collaudo runtime finale” non ha un artifact di validation collegato

## Esito: provenance storica insufficiente

Il documento apre con:

```text
Il collaudo runtime finale ha validato...
```

e riporta:

- avvio;
- blocco seconda invocazione;
- shutdown;
- riavvio;
- preservazione CDP.

Più avanti riporta anche pass count storici per:

```text
matchHistoryWriterAuthority
matchTracker
server
```

## `docs/validations/README.md`

La policy corrente richiede per ogni validazione:

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

Nel README validations risultano attualmente indicizzati artifact per:

- Source Identity;
- Betfair;
- migration documentale.

Non è stato individuato un artifact dedicato al “collaudo runtime finale” citato da questo owner.

## Problema

Una frase storica inline non consente di sapere:

```text
su quale SHA
quando
con quale Windows/Python/Node
quali passaggi
quali output
quali limiti
```

## Finding `LOCAL-RUNTIME-006` — separare contratto corrente e validation runtime storica

**Priorità:** medium  
**Tipo:** validation provenance

### Documento owner

Conservare:

```text
stato corrente supportato dal codice
verification matrix da eseguire
scenari ancora live-required
```

### Validation

Quando una validation runtime reale è disponibile, archiviarla sotto:

```text
docs/validations/
```

con metadata richiesti.

### Pass count

I conteggi:

```text
26 / 10 / 30
```

devono stare nell'artifact della run, non essere usati come prova permanente del contratto corrente.

### Regola

Non inventare retroattivamente data/SHA/ambiente del collaudo già citato.

Se non registrati:

```text
non registrato
```

---

# 7. La verification matrix non copre ancora le authority di riuso emerse

## Esito: test launcher ampi, ma manca la boundary più importante

`launcher/tests/test_launcher.py` copre già numerosi aspetti:

- port probing;
- backend project identity;
- servizio foreign;
- CDP endpoint;
- reusable manifest;
- stale lock;
- owned-only shutdown;
- no kill by port;
- backend start/reuse/failure;
- manifest ownership;
- launcher lifecycle.

`scripts/validation/test-manifest.json` registra inoltre:

```text
python -m unittest -v launcher.tests.test_launcher
```

come suite enabled.

## Gap specifici

La suite corrente non possiede ancora un concetto di:

```text
repositoryIdentity/storageIdentity del backend riusato
```

e quindi non può testare:

```text
same project / wrong working copy
```

Mancano inoltre scenari diretti per:

```text
backend riusabile su fallback
+ preferred libera
→ nessun spawn inutile

CLI exit status dei failure gestiti

browser open false

CDP reuse stale
→ già collegato PY-RUNTIME-006

manifest write failure
→ già collegato PY-RUNTIME-005

launcher/backend timeout hierarchy
→ già collegato PY-RUNTIME-004
```

## Incongruenza interna

Il docstring iniziale di `launcher/app.py` descrive ancora:

```text
1. Check reusable session
2. acquire lock
```

mentre il codice reale e il documento owner applicano:

```text
acquire/reclaim lock
→ solo dopo is_manifest_reusable()
```

Non cambia il runtime, ma è un commento tecnico stale che può confondere una manutenzione futura.

## Finding `LOCAL-RUNTIME-007` — completare la verification matrix del launcher

**Priorità:** high  
**Tipo:** verification contract

### Nuovi test

Coprire:

```text
working copy A vs B
repository identity mismatch
storage identity mismatch
discovery-before-spawn
backend existing su fallback
owned child exits during readiness
CLI success/failure codes
browser open failure
stale internal startup-order documentation
```

### Coordinamento

Riutilizzare le task già aperte per:

```text
PY-RUNTIME-004
PY-RUNTIME-005
PY-RUNTIME-006
PY-RUNTIME-007
PY-RUNTIME-010
```

senza creare implementazioni parallele.

---

# 8. Manifest write durability

## Esito: finding già censito, nessuna task duplicata

`write_manifest()`:

```text
mkstemp
→ json.dump
→ replace
```

ma in caso `OSError`:

```text
cleanup temp
→ nessuna exception
→ nessun risultato failure
```

`launcher/app.py` può quindi continuare come se il manifest fosse stato scritto.

Questo gap è già registrato come:

```text
PY-RUNTIME-005
```

Non viene creato un nuovo `LOCAL-RUNTIME-*`.

Il documento deve essere corretto insieme a quella task perché frasi come:

```text
manifest registra
manifest pronto
```

non sono oggi garantite in caso di I/O failure.

---

# 9. CDP provisional readiness

## Esito: finding già censito, nessuna task duplicata

Dopo:

```text
launch_requested
```

il launcher esegue una singola verifica molto breve.

Se Chrome non è ancora pronto:

```text
manifest CDP status=starting
url=candidate
```

e prosegue.

Non esiste una riconciliazione successiva nel launcher.

Questo comportamento è già posseduto da:

```text
PY-RUNTIME-006
```

Il presente documento deve soltanto linkarlo e non descrivere `cdpUrl` come definitivamente ready quando il servizio è ancora `starting`.

---

# 10. Shutdown launcher vs backend

## Esito: gap critico già censito, nessuna task duplicata

Il launcher concede al processo owned:

```text
_SHUTDOWN_GRACE = 5s
```

prima della force-kill escalation.

Il backend possiede:

```text
forceExitMs = 6000
```

per il proprio shutdown interno.

Quindi il parent può iniziare l'escalation prima del budget interno massimo del backend.

Questo è già:

```text
PY-RUNTIME-004
```

e non viene duplicato.

La parte positiva è che il launcher usa:

```text
PID owned registrato
```

e non:

```text
porta
```

per l'escalation.

---

# 11. Local HTTP boundary

## Esito: target approvato già censito

Il launcher avvia Vite con:

```text
--host 127.0.0.1
```

Il backend, invece, non possiede ancora nello stato auditato l'intero hardening locale approvato:

```text
loopback bind
Host policy
Origin policy
```

Questo è già registrato in:

```text
PY-RUNTIME-007
RUNTIME-HEALTH-001
ARCH-BOUND-002
IMPL-017
```

Nessuna nuova task.

---

# 12. Ownership di processo

## Esito: design corretto

Il launcher registra come owned soltanto i processi che ha avviato direttamente:

```text
backend
frontend
```

Gli entry contengono:

```text
role
proc
pid
started_at
```

Il cleanup verifica nuovamente la registration prima del segnale.

Su Windows:

```text
CTRL_BREAK_EVENT
→ grace
→ taskkill /PID <owned pid> /T /F
→ conferma exit
```

Su POSIX:

```text
SIGTERM al process group dedicato
→ grace
→ SIGKILL
→ conferma exit
```

Questo rispetta la regola:

```text
no kill by port
```

e va preservato.

---

# 13. Launcher lock

## Esito: design conservativo

Il lock schema 2 contiene:

```text
project
sessionId
pid
createdAt
processIdentity.startFingerprint
processIdentity.executable
```

La classificazione distingue:

```text
active
stale
unknown
```

e usa:

- PID;
- start fingerprint;
- executable quando disponibile;
- coerenza lock/manifest.

Un PID riciclato diventa stale.

Un owner non verificabile resta unknown e blocca il recovery aggressivo del lock.

Questa è una proprietà corretta.

---

# 14. Coordination guard

## Esito: corretta distinzione dal launcher lock persistente

`launcher.lock.guard` usa un lock advisory del sistema operativo.

Serve per serializzare:

```text
acquire
reclaim
release
```

del lock documentale.

Non è:

```text
storage writer authority
service ownership
business lock
```

Il documento rende correttamente questa distinzione a livello operativo.

---

# 15. Manifest schema

## Esito: implementazione sostanzialmente coerente

Lo schema 2 verifica:

```text
session identity
status/reason
backend
frontend
cdp
ownership
selectedPort
pid
URL
instanceId
backendTarget
```

Il frontend `ready` richiede:

```text
local HTTP URL
pid
instanceId
startedAt
backendTarget
```

Il backend `ready` richiede:

```text
pid
baseUrl
healthUrl
instanceId
```

Il limite rimane `LOCAL-RUNTIME-001`:

```text
nessuna working-copy identity
```

---

# 16. Session reuse

## Esito: lock ordering corretto nel codice, ma identity incompleta

Il codice reale esegue:

```text
read old manifest
→ create new launcher identity
→ acquire/reclaim lock
→ only then is_manifest_reusable(old manifest)
```

Questa è la sequenza corretta descritta dal documento.

La sessione riusata non trasferisce ownership sui servizi.

La nuova invocazione rilascia soltanto il proprio lock dopo aver aperto il frontend esistente.

Il gap è la scope identity del backend, non l'ordine del fast path.

---

# 17. Backend fallback

## Esito: nessun kill di occupant esterno

Quando una porta è occupata e il servizio non viene riconosciuto come backend valido:

```text
foreign occupant
→ non terminato
→ candidate successiva
```

Questo è corretto.

La task `LOCAL-RUNTIME-002` modifica soltanto l'ordine discovery/spawn, non la regola di non terminazione.

---

# 18. Frontend reuse

## Esito: più forte del backend reuse nel binding applicativo

Il frontend identity endpoint espone:

```text
project
service
instanceId
pid
startedAt
frontendPort
backendTarget
```

Il launcher richiede:

```text
backendTarget == backend scelto
```

Quindi non riusa una UI legata a un backend differente.

Il problema è a monte:

```text
se il backend scelto è la working copy sbagliata,
un frontend coerentemente legato a quel backend
resta comunque la scelta sbagliata.
```

Perciò non serve una seconda `frontendWorkingCopyIdentity` se il backend authority viene resa corretta, salvo futura esigenza esplicita.

---

# 19. CDP ownership

## Esito: corretto

Chrome/CDP non entra in `_owned_entries`.

Anche quando il launcher richiede l'avvio tramite PowerShell:

```text
ownership = external
```

non `owned`.

Lo shutdown launcher non termina Chrome.

Questo è coerente con il profilo persistente Betfair.

---

# 20. Persistenza e launcher

## Esito: confine corretto

Il launcher non:

- legge `.pending_commits`;
- modifica `.writer_authority`;
- esegue recovery;
- crea history;
- crea timeline;
- interpreta `partial_persistence`;
- interpreta Evidence come motivo di restart.

Queste separazioni sono corrette.

Dopo il report 031, il documento dovrà in futuro linkare il proposed owner:

```text
modules/storage/05-writer-authority.md
```

soltanto quando quel file verrà realmente creato.

Non va aggiunto oggi all'inventario o ai link canonici.

---

# 21. Lunghezza, integrità del contesto e modularizzazione

## Valutazione

```text
Righe: 568
Responsabilità primaria: una
Tipo documento: runbook operativo / facade locale
```

Il file contiene molti dettagli di:

- writer authority;
- tracker drain;
- persistence;
- process registry;
- CDP;
- manifest;
- launcher ownership.

Tuttavia quasi tutti i sottodomini possiedono già o avranno owner specialistici.

## Perché non dividerlo

Creare:

```text
operations/launcher-lock.md
operations/cdp-runtime.md
operations/shutdown-runtime.md
```

duplicherebbe:

```text
modules/python/01-entrypoints-and-runtime.md
modules/storage/02-commit-journal-and-recovery.md
proposed modules/storage/05-writer-authority.md
modules/sofa/01-live-tracking.md
api/06-runtime-health.md
```

La funzione utile del documento è precisamente tenere insieme, a livello operativo:

```text
Start
→ service resolution
→ ownership
→ ready
→ Ctrl+C
```

## Riduzione consigliata

Applicare la già aperta:

```text
PY-RUNTIME-009
```

in entrambe le direzioni:

- `modules/python/01-*` mantiene dettagli tecnici Python/launcher;
- `operations/01-*` mantiene runbook, invarianti, failure mode e link.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non deve essere creata alcuna task di modularizzazione.

---

# Riferimenti per la mappa e il JSON incrementale di continuazione

```text
Report ID: TDUI-DOC-REPORT-032
Percorso report: Report documentale/32 - 01-local-runtime.md
Documento: docs/tennis-decision-ui/operations/01-local-runtime.md

Change ID: LOCAL-RUNTIME-001
Change ID: LOCAL-RUNTIME-002
Change ID: LOCAL-RUNTIME-003
Change ID: LOCAL-RUNTIME-004
Change ID: LOCAL-RUNTIME-005
Change ID: LOCAL-RUNTIME-006
Change ID: LOCAL-RUNTIME-007

Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
PY-RUNTIME-004
PY-RUNTIME-005
PY-RUNTIME-006
PY-RUNTIME-007
PY-RUNTIME-008
PY-RUNTIME-009
PY-RUNTIME-010
RUNTIME-HEALTH-001
RUNTIME-HEALTH-003
RUNTIME-HEALTH-004
ARCH-BOUND-002
ARCH-BOUND-004
DATA-LIFE-001
JOURNAL-REC-006
JOURNAL-REC-010
```

---

# Modifiche proposte

## `LOCAL-RUNTIME-001` — working-copy-aware backend reuse

**Priorità:** critical

- introdurre runtime identity opaca per repository/storage;
- backend health espone soltanto identifier bounded, non path;
- launcher calcola/conosce l'identity attesa;
- same project ma wrong working copy → non reusable;
- frontend viene configurato solo dopo questa verifica;
- test A/B working copies e storage mismatch.

## `LOCAL-RUNTIME-002` — backend discovery before spawn

**Priorità:** high

- discovery read-only bounded su candidate;
- cercare prima backend riusabile;
- spawn solo se nessun reusable;
- un solo child necessario;
- fail-fast su child exit prima della health;
- writer authority resta authority, non va bypassata con altra porta.

## `LOCAL-RUNTIME-003` — launcher CLI outcome

**Priorità:** high

- definire esiti startup/reuse/blocked/failure;
- errori bootstrap reali non exit 0 implicito;
- decidere separatamente active-lock no-op;
- `main`/`avvio.py` contratto stabile;
- test subprocess/CLI.

## `LOCAL-RUNTIME-004` — CDP configuration provenance

**Priorità:** medium

- launcher → Vite env;
- frontend initial state;
- confirmed session;
- request backend;
- effective scraper;
- nessuna falsa backend startup CDP config;
- linkare `PY-RUNTIME-006` per provisional/reuse validation.

## `LOCAL-RUNTIME-005` — browser handoff semantics

**Priorità:** medium

- browser open = best-effort;
- service readiness indipendente;
- eventuale failure bounded/loggata;
- URL frontend resta disponibile;
- nessun teardown automatico;
- test `webbrowser.open=false`.

## `LOCAL-RUNTIME-006` — validation provenance

**Priorità:** medium

- togliere “collaudo finale” come prova permanente inline;
- creare/linkare artifact solo se i metadata reali sono disponibili;
- pass counts negli artifact di run;
- `non registrato` per metadata storici mancanti;
- live-required resta esplicito.

## `LOCAL-RUNTIME-007` — launcher verification matrix

**Priorità:** high

- cross-working-copy identity;
- fallback reusable before spawn;
- owned child early exit;
- CLI outcome;
- browser failure;
- integrare task PY-RUNTIME esistenti;
- correggere docstring `app.py` stale sull'ordine lock/reuse.

---

# Ordine consigliato di applicazione

```text
1. LOCAL-RUNTIME-001
2. LOCAL-RUNTIME-002
3. PY-RUNTIME-005
4. PY-RUNTIME-006
5. LOCAL-RUNTIME-003
6. PY-RUNTIME-004
7. PY-RUNTIME-007
8. LOCAL-RUNTIME-004
9. LOCAL-RUNTIME-005
10. LOCAL-RUNTIME-007
11. LOCAL-RUNTIME-006
12. PY-RUNTIME-009
13. revisione mirata operations/01-local-runtime.md
14. checker documentali
```

La working-copy identity viene prima perché il riuso di un servizio corretto dal punto di vista del `project` ma appartenente alla repository sbagliata è il failure mode più pericoloso del launcher locale.

---

# Verifica prevista dopo un'eventuale modifica

## Backend reuse identity

### Stessa working copy

```text
backend health
project corretto
repositoryIdentity corretta
storageIdentity corretta
pid/instance validi
→ reused
```

### Working copy diversa

```text
project corretto
pid valido
instanceId valido
repositoryIdentity diversa
→ non reusable
→ processo esterno non terminato
```

### Storage diversa

```text
repository identity coerente
storage identity diversa
→ non reusable
```

Nessun path raw deve apparire nel payload.

---

## Discovery order

Setup:

```text
3001 libera
3002 backend riusabile della working copy corrente
```

Atteso:

```text
probe 3002
→ reuse
→ zero spawn su 3001
```

Se nessun backend riusabile:

```text
prima porta libera scelta
→ un solo start
```

---

## Child bootstrap failure

```text
owned backend exits subito
→ readiness interrompe prima del timeout massimo
→ reason bounded
→ owned registry cleanup
→ candidate successiva solo secondo policy approvata
```

Non loggare stack/path raw.

---

## CLI

```text
startup ready
→ success exit
```

```text
session reuse
→ success exit
```

```text
backend failed
→ non-success exit
```

```text
frontend failed
→ non-success exit
```

Il caso:

```text
launcher active
→ blocked
```

deve avere un outcome intenzionale e documentato.

---

## CDP provenance

Verificare:

```text
resolve_cdp URL X
→ VITE_CDP_URL=X
→ INITIAL_CDP_URL=X
```

Poi:

```text
utente/sessione modifica CDP a Y
→ confirmedCdpUrl=Y
→ request backend usa Y
```

Non descrivere X come configurazione Node globale.

---

## Browser

```text
webbrowser.open=false
→ stack resta ready
→ browser failure osservabile
→ frontend URL disponibile
```

---

## Manifest

Applicando `PY-RUNTIME-005`:

```text
write/replace failure
→ outcome esplicito
→ launcher non presume manifest scritto
```

---

## CDP provisional

Applicando `PY-RUNTIME-006`:

```text
launch_requested + not ready
→ provisional state esplicito
→ bounded reconciliation
oppure policy finale approvata
```

Session reuse con CDP stale deve avere un contratto deterministico.

---

## Shutdown hierarchy

Applicando `PY-RUNTIME-004`:

```text
launcher clean signal
→ backend ha budget sufficiente per:
   tracker drain
   Python cleanup
   listener close
   writer authority release
→ parent force-kill soltanto dopo budget coerente
```

---

## Test canonici

Mantenere:

```text
python -m unittest -v launcher.tests.test_launcher
node backend/src/server.test.mjs
node backend/src/runtime/matchHistoryWriterAuthority.test.mjs
node backend/src/sofa/matchTracker.test.mjs
```

e il profilo registrato in:

```text
scripts/validation/test-manifest.json
```

Le eventuali validation manuali/live restano separate.

---

# Decisione finale

```text
01-local-runtime.md:
RUNBOOK CORRETTO, MA LA SERVICE IDENTITY DEL BACKEND È TROPPO DEBOLE

launcher lock: solido
stale reclaim: conservativo
manifest schema: robusto
service ownership: solida
no kill by port: rispettato
frontend backendTarget binding: corretto
CDP discovery: bounded
CDP ownership external/reused: corretta
writer authority separation: corretta
shutdown owned-only: corretto
backend drain/release: owner corretto altrove

backend reuse identity:
project/pid/instance
≠
working-copy identity

wrong working copy backend:
può essere riusato

backend fallback algorithm:
può spawnare un writer destinato a fallire
prima di scoprire un reusable backend successivo

CLI:
failure gestite possono terminare con exit 0

CDP propagation:
documentata più direttamente del runtime reale

browser open:
best-effort, non readiness guarantee

manifest I/O failure:
finding già aperto

CDP provisional:
finding già aperto

shutdown 5s vs 6s:
finding già aperto

local HTTP hardening:
finding già aperto

validation finale:
provenance non archiviata in artifact dedicato individuato

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: critica
```

Le due invarianti operative da aggiungere sono:

```text
un servizio è "Tennis Decision UI"
≠
è il servizio della mia working copy

reuse
→ richiede entrambe le prove
```

e:

```text
prima cercare un servizio già valido
→ poi, soltanto se serve, avviarne uno nuovo
```

Il launcher lock continua invece a governare l'orchestrazione della singola invocazione, mentre la writer authority continua a governare l'esclusione dei writer sulla storage identity.

---

# Applicazione 2026-08-10

Le task LOCAL-RUNTIME-001…007 sono state applicate e verificate. Implementati identity hash working-copy/storage, discovery-before-spawn, exit code CLI, browser best-effort osservabile e catena CDP documentata. Creato docs/validations/local-runtime-hardening-2026-08-10.md. Operazioni Git: nessuna.
