# Report documentale — `docs/tennis-decision-ui/api/06-runtime-health.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-010
Sequenza audit: 10/72
Documento analizzato: 06-runtime-health.md
Percorso documento: docs/tennis-decision-ui/api/06-runtime-health.md
Percorso report: Report documentale/10 - 06-runtime-health.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 120 righe
Ruolo dichiarato: contratto HTTP di GET /api/health
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/server.js`;
- `backend/src/server.test.mjs`;
- `backend/src/runtime/pythonProcessRegistry.js`;
- `backend/src/runtime/pythonProcessRegistry.test.mjs`;
- `frontend/src/hooks/usePreflightChecks.js`;
- `docs/tennis-decision-ui/operations/01-local-runtime.md`;
- `docs/tennis-decision-ui/architecture/01-system-boundaries.md`;
- `docs/tennis-decision-ui/api/05-preflight.md`;
- `implementazioni/99-decisioni-utente.md`;
- `implementazioni/implementazioni-proposte/02-runtime-betfair.md`, in particolare `IMPL-017`.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale con il codice: ALTA
Shape principale: corretta
Ruoli Python: corretti
Campi pubblici: corretti
Campi privati correntemente esclusi: corretti
Contratti da chiarire o rafforzare: 7
Modifiche proposte: 8
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti proposti: nessuno
```

Il documento è uno dei contratti API più coerenti analizzati finora.

Sono corretti:

- endpoint e metodo;
- `HTTP 200`;
- identità pubblica del backend;
- `instanceId`;
- PID del backend;
- `startedAt`;
- `timestamp`;
- snapshot Python;
- conteggio `active`;
- conteggio `stopping`;
- tre ruoli pubblici;
- shape delle entry;
- esclusione corrente di argomenti, URL, runtime identity e owner token;
- natura read-only;
- separazione rispetto a Stop e shutdown.

Le criticità non richiedono una riscrittura totale.

La principale riguarda il confine locale del servizio:

```text
server.js
→ cors() senza allow-list
→ app.listen(port) senza host esplicito
```

mentre `IMPL-017`, già approvata, richiede:

```text
listen host: 127.0.0.1
allowed origins locali
allowed hosts loopback
```

La seconda criticità riguarda il confine di redazione:

```text
/api/health
→ espone getPythonProcessSnapshot() senza normalizzazione propria
```

Il registry corrente restituisce una shape sicura, ma la route non difende autonomamente il contratto pubblico.

---

# 1. Endpoint e response principale

## Esito: coerente

Il server espone:

```text
GET /api/health
```

direttamente in `createApp()`.

Il payload corrente contiene:

```json
{
  "ok": true,
  "service": "backend",
  "project": "tennis-decision-ui",
  "instanceId": "<uuid>",
  "pid": 1234,
  "startedAt": "<iso-date>",
  "timestamp": "<iso-date>",
  "pythonProcesses": {}
}
```

La documentazione coincide con il codice.

`server.test.mjs` verifica esplicitamente:

```text
ok
service
project
instanceId
pid
startedAt
timestamp
pythonProcesses.active
```

La route non modifica persistenza e non avvia processi.

---

# 2. Snapshot Python

## Esito: coerente

`pythonProcessRegistry.snapshot()` restituisce:

```text
active
stopping
byRole
entries
```

con:

```text
sofa_tracking
betfair_tracking
betfair_login
```

Le entry pubbliche contengono soltanto:

```text
executionId
role
pid
status
startedAt
```

Il test del registry verifica che lo snapshot non contenga:

```text
args
ownerToken
generation
```

Il test di `/api/health` verifica inoltre l’assenza di:

```text
ownerToken
cdpUrl
profileDir
```

Questa parte del documento è corretta.

---

# 3. Confine locale non ancora implementato

## Esito: contratto di sicurezza incompleto

Il documento presenta l’endpoint come diagnostica del runtime locale.

Il backend corrente però usa:

```js
app.use(cors());
```

senza allow-list.

Il bootstrap usa:

```js
app.listen(port)
```

senza specificare:

```text
127.0.0.1
```

Il launcher e il documento Runtime locale usano URL loopback, ma il listener Node non è esplicitamente confinato a loopback nel codice.

`IMPL-017 — Local control-plane boundary` è già:

```text
CONFERMATA E APPROVATA
Priorità critica
```

e prescrive:

```text
listen host: 127.0.0.1
allowed origins: frontend locale
allowed hosts: loopback
nessun indirizzo non loopback
```

La stessa proposta classifica:

```text
health
```

come:

```text
data plane read-only
```

Quindi `/api/health` non è una mutazione, ma resta parte del backend locale che deve essere raggiungibile soltanto nel confine previsto.

## Finding `RUNTIME-HEALTH-001` — allineare il contratto al local boundary approvato

**Priorità:** alta  
**Tipo:** network boundary

### Modifica tecnica

Applicare `IMPL-017` a livello server:

```text
bind 127.0.0.1
Host locale
Origin policy locale
porte alternative del launcher supportate
```

### Modifica documentale

Aggiungere:

```markdown
`GET /api/health` è una lettura del data plane locale.

Il contratto target richiede che il backend sia esposto soltanto sul
confine loopback definito da IMPL-017. Il bind e la policy CORS/Host
appartengono al bootstrap/server, non alla route Health.
```

Finché `IMPL-017` non è applicata, distinguere:

```text
contratto target approvato
≠
stato runtime già implementato
```

---

# 4. Allow-list non applicata al confine HTTP

## Esito: il contratto sicuro dipende interamente dal registry

Il server restituisce:

```js
pythonProcesses: getSnapshot()
```

senza filtrare o normalizzare il risultato.

Il registry corrente è progettato bene e restituisce soltanto la shape pubblica.

Il problema è architetturale:

```text
se snapshot() acquisisse in futuro un nuovo campo interno
→ /api/health lo esporrebbe automaticamente
```

Il test corrente inietta uno snapshot già sicuro.

Non verifica:

```text
snapshot con ownerToken
→ ownerToken rimosso dalla route
```

perché la route non lo rimuove.

Il documento afferma che il confine pubblico esclude campi privati.

Questa proprietà oggi appartiene al producer, non al confine HTTP.

## Finding `RUNTIME-HEALTH-002` — normalizzare la response Health con allow-list pubblica

**Priorità:** alta  
**Tipo:** redazione e stabilità del contratto

### Modifica consigliata

Introdurre un builder puro, per esempio:

```text
buildRuntimeHealthResponse
normalizePublicPythonProcessSnapshot
```

che ammetta soltanto:

```text
active
stopping
byRole.sofa_tracking
byRole.betfair_tracking
byRole.betfair_login
entries[].executionId
entries[].role
entries[].pid
entries[].status
entries[].startedAt
```

### Test indispensabile

Iniettare deliberatamente:

```text
ownerToken
args
cdpUrl
profileDir
metadata
logicalKey
generation
processErrorCode
```

e verificare che il body HTTP non li contenga.

Il registry deve continuare a produrre una shape sicura, ma il router/server deve difendere autonomamente il proprio contratto.

---

# 5. Significato di `ok`

## Esito: semanticamente ambiguo

La route restituisce sempre:

```json
{
  "ok": true
}
```

quando l’handler viene eseguito normalmente.

`ok:true` non dimostra:

- tracking attivo;
- tracker sano;
- Betfair autenticato;
- SofaScore raggiungibile;
- recovery completa;
- persistenza integra;
- processi Python `running`;
- assenza di processi in `stopping`;
- writer authority sana;
- Source Identity allineata.

È una prova di:

```text
backend raggiungibile
+
health response costruita
```

Il documento usa correttamente il termine `Health`, ma non definisce la semantica precisa di `ok`.

Il frontend Preflight attuale usa soltanto:

```js
if (data.ok)
```

per dichiarare:

```text
Backend OK
```

senza verificare:

```text
project
instanceId
```

## Finding `RUNTIME-HEALTH-003` — definire `ok:true` come liveness del backend

**Priorità:** alta  
**Tipo:** semantica pubblica

### Modifica documentale

Aggiungere:

```markdown
`ok:true` significa che il processo backend ha risposto tramite il
contratto Health.

Non rappresenta la salute complessiva della sessione live, della
persistenza, delle fonti esterne o dei figli Python.
```

### Consumer frontend

Il Preflight deve almeno distinguere:

```text
endpoint raggiungibile
da
identità Tennis Decision UI confermata
```

`project === "tennis-decision-ui"` è disponibile precisamente per questa distinzione.

`instanceId` può essere usato soltanto quando il consumer possiede un valore atteso con cui confrontarlo.

Coordinare la modifica con:

```text
PREFLIGHT-API-006
PREFLIGHT-API-007
```

---

# 6. Semantica di `instanceId` e `startedAt`

## Esito: corretta ma da precisare

Nel codice:

```js
const INSTANCE_ID = randomUUID();
const STARTED_AT = new Date().toISOString();
```

sono definiti a livello modulo.

Quindi rappresentano, in condizioni normali:

```text
istanza del processo Node / modulo server caricato
```

non:

- tracking session ID;
- event ID;
- command ID;
- launcher lock ID;
- writer authority ID;
- timestamp di `listen`;
- timestamp di listener readiness.

In particolare:

```text
STARTED_AT
```

viene creato prima di:

```text
writer authority acquire
recovery
listen
listener readiness
```

La frase:

```text
startedAt indica l’avvio
```

è quindi troppo generica.

## Finding `RUNTIME-HEALTH-004` — precisare identità e timestamp

**Priorità:** media  
**Tipo:** semantica identità

### Modifica richiesta

Dichiarare:

```text
instanceId
→ identificatore effimero del processo backend corrente
→ non trackingSessionId
→ non writer authority
→ non launcher ownership

startedAt
→ timestamp di inizializzazione del modulo backend
→ può precedere listener readiness e fine recovery
```

Se in futuro serve distinguere:

```text
processStartedAt
listenerReadyAt
```

aggiungere un campo nuovo con contratto esplicito, non reinterpretare retroattivamente `startedAt`.

---

# 7. Semantica di `pythonProcesses`

## Esito: corretta ma incompleta

Il documento specifica già:

```text
active conta le entry registrate
stopping conta stopping + force_stopping
```

Mancano alcune precisazioni utili.

## `active`

Non significa:

```text
numero di processi running
```

Comprende qualunque entry ancora registrata, incluso potenzialmente:

```text
spawn_pending
stopping
force_stopping
```

## `byRole`

Conta le entry registrate per ruolo, non soltanto quelle `running`.

## `pid`

Può essere:

```text
null
```

prima che il processo abbia un PID valido.

`safePid()` restituisce infatti `null` quando il valore non è un intero positivo.

## `status`

Gli stati osservabili dal registry includono almeno:

```text
spawn_pending
running
stopping
force_stopping
```

`spawn_failed` è uno stato transitorio che normalmente viene seguito dalla rimozione della entry.

## Process error post-spawn

Un evento:

```text
proc.on('error')
```

dopo lo spawn imposta internamente:

```text
processErrorCode = process_error
```

ma il campo non viene esposto.

La entry può quindi restare con:

```text
status: running
```

finché non termina o viene fermata.

Quindi:

```text
status
```

è uno stato lifecycle del registry, non una diagnosi completa della salute funzionale del processo.

## Finding `RUNTIME-HEALTH-005` — completare la semantica dello snapshot

**Priorità:** media  
**Tipo:** precisione del payload

### Modifica richiesta

Aggiungere una tabella:

| Campo | Significato |
| --- | --- |
| `active` | entry ancora registrate |
| `stopping` | entry `stopping` o `force_stopping` |
| `byRole` | entry registrate per ruolo |
| `pid` | PID positivo oppure `null` |
| `status` | lifecycle pubblico del registry |
| `executionId` | ID opaco dell’esecuzione Python |

Specificare:

```text
status != health funzionale dello scraper
```

Per la salute Betfair/SofaScore usare gli owner specifici.

---

# 8. Caching della response

## Esito: nessuna policy esplicita

La route non imposta:

```text
Cache-Control: no-store
```

Il payload contiene dati effimeri:

```text
timestamp
active
stopping
entries
status
```

Una response Health cached può quindi essere semanticamente obsoleta.

Il progetto usa già:

```text
Cache-Control: no-store
```

per il log runtime Betfair.

## Finding `RUNTIME-HEALTH-006` — aggiungere `Cache-Control: no-store`

**Priorità:** media  
**Tipo:** freshness HTTP

### Modifica consigliata

Prima del body:

```text
Cache-Control: no-store
```

Aggiungere un test HTTP che verifichi l’header.

Non usare il caching del browser o del proxy come parte della semantica Health.

---

# 9. Duplicazione `/api/test/health`

## Esito: authority API duplicata

Esiste anche:

```text
GET /api/test/health
```

nel router Preflight.

La shape è più povera:

```text
ok
service
timestamp
```

Il frontend Preflight corrente non la usa.

Usa:

```text
GET /api/health
```

`06-runtime-health.md` è l’owner corretto dell’health canonica.

## Finding `RUNTIME-HEALTH-007` — mantenere una sola authority Health

**Priorità:** media  
**Tipo:** duplicazione endpoint

### Modifica richiesta

Coordinare con:

```text
PREFLIGHT-API-006
```

ed eseguire un inventario consumer.

Se `/api/test/health` non ha consumer:

```text
rimuoverla
```

Se deve restare temporaneamente:

```text
dichiararla legacy/minimal
non duplicare il contratto
non usarla come identità backend
```

L’endpoint canonico resta:

```text
GET /api/health
```

---

# 10. Verifica

## Esito: troppo sintetica rispetto ai test reali

Il documento mostra soltanto:

```text
GET /api/health
→ HTTP 200
→ identità backend presente
→ pythonProcesses con shape pubblica
→ nessun campo privato
```

Nel repository esiste già:

```text
backend/src/server.test.mjs
```

con il test:

```text
L47-health-exposes-safe-python-snapshot
```

che verifica il payload HTTP.

Esiste anche:

```text
backend/src/runtime/pythonProcessRegistry.test.mjs
```

che verifica:

- lifecycle delle entry;
- shape dello snapshot;
- assenza args;
- assenza ownerToken;
- assenza generation;
- scope tracking/login/all;
- stop graceful/force;
- cleanup.

La documentazione dovrebbe indicare questi test.

Mancano invece test per:

```text
allow-list route con campi privati iniettati
Cache-Control no-store
local bind/Host/Origin dopo IMPL-017
semantica frontend identity vs reachability
pid null
status spawn_pending/stopping
```

## Finding `RUNTIME-HEALTH-008` — aggiornare la matrice di verifica

**Priorità:** media  
**Tipo:** verificabilità

### Modifica richiesta

Aggiungere:

```bash
node backend/src/server.test.mjs
node backend/src/runtime/pythonProcessRegistry.test.mjs
```

oppure i comandi corretti dalla working directory indicata dal runbook.

Dopo le modifiche introdurre verifiche specifiche per:

```text
no-store
allow-list
loopback boundary
Host/Origin
campi privati
pid null
status lifecycle
```

Non dichiarare `PASS` live senza output corrente.

---

# 11. Dati esclusi

## Esito: corretto, ma può essere più esplicito

La lista documentata comprende:

```text
URL
cdpUrl
profileDir
args
runtimeIdentity
ownerToken
stdout
stderr
command line
segreti
```

Il registry contiene anche campi interni non pubblici come:

```text
generation
generationScope
spawnState
processErrorCode
metadata.eventId
metadata.logicalKey
completion
terminationPromise
ownerToken
proc
```

Questi non sono esposti nello snapshot corrente.

Dopo `RUNTIME-HEALTH-002`, il documento dovrebbe descrivere il contratto come:

```text
allow-list positiva
```

invece di affidarsi soltanto a una lista crescente di dati esclusi.

Formula consigliata:

```text
Le entry pubbliche contengono esclusivamente:
executionId, role, pid, status, startedAt.

Qualunque altro campo del registry è interno per default.
```

---

# 12. Relazione con writer authority e tracking session

## Esito: da chiarire

Il documento dice correttamente:

```text
instanceId e pid non attribuiscono ownership al chiamante
```

Va aggiunta una distinzione più forte.

`/api/health` non espone:

```text
stato writer authority
trackingSessionId
commandId
launcher ownership
storage identity
```

Il fatto che il backend risponda non prova:

```text
writer authority valida
sessione live corrente
ownership launcher
```

Il launcher può usare `instanceId` per riconoscere una specifica istanza già osservata, ma questo non trasforma `instanceId` in un token di autorizzazione.

Questa precisazione può essere incorporata in `RUNTIME-HEALTH-004` senza un ulteriore change ID.

---

# 13. Modularizzazione

## Valutazione

```text
Righe: 120
Endpoint: 1
Responsabilità primaria: 1
Shape compatta: sì
Owner runtime esterno: pythonProcessRegistry
Owner API chiaro: sì
Contesti distinti da separare: no
Suddivisione richiesta: no
```

Il documento è già corto e focalizzato.

Non conviene creare:

```text
api/runtime-health/backend-identity.md
api/runtime-health/python-processes.md
```

perché frammenterebbe un contratto HTTP semplice.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Serve una revisione mirata, non una riscrittura strutturale.

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-010
Percorso report: Report documentale/10 - 06-runtime-health.md
Documento: docs/tennis-decision-ui/api/06-runtime-health.md
Change ID: RUNTIME-HEALTH-001
Change ID: RUNTIME-HEALTH-002
Change ID: RUNTIME-HEALTH-003
Change ID: RUNTIME-HEALTH-004
Change ID: RUNTIME-HEALTH-005
Change ID: RUNTIME-HEALTH-006
Change ID: RUNTIME-HEALTH-007
Change ID: RUNTIME-HEALTH-008
Suddivisione richiesta: no
Nuovi file proposti: nessuno
```

Nel prossimo aggiornamento:

```text
mappa-file-markdown-repository.md
→ registrare report 010
→ indice 10 ANALIZZATO
→ Divisione non necessaria
→ 8 nuove task
→ prossimo indice 11

modifiche-audit-markdown.json
→ aggiungere soltanto report 010
→ aggiungere soltanto RUNTIME-HEALTH-001..008
→ preservare report 008 e 009 già presenti
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `RUNTIME-HEALTH-001` — local boundary

**Priorità:** alta

**Azione:**

- applicare `IMPL-017`;
- bind backend a loopback;
- applicare Host/Origin locali;
- documentare health come data plane read-only locale;
- non dichiarare già implementato il target prima della modifica.

---

## `RUNTIME-HEALTH-002` — allow-list HTTP

**Priorità:** alta

**Azione:**

- introdurre response builder puro;
- normalizzare lo snapshot;
- ammettere soltanto campi pubblici;
- testare input con campi privati iniettati.

---

## `RUNTIME-HEALTH-003` — semantica di `ok`

**Priorità:** alta

**Azione:**

- definire `ok:true` come liveness/reachability;
- non presentarlo come salute complessiva;
- allineare il consumer Preflight all’identità `project`.

---

## `RUNTIME-HEALTH-004` — identità backend

**Priorità:** media

**Azione:**

- definire `instanceId` come ID effimero del processo backend;
- distinguere writer authority, tracking session e launcher ownership;
- precisare che `startedAt` precede listener readiness.

---

## `RUNTIME-HEALTH-005` — semantica snapshot

**Priorità:** media

**Azione:**

- documentare `active`, `byRole`, `pid:null`, `status`;
- chiarire che `status` è lifecycle del registry e non health funzionale;
- mantenere health specifica negli owner Sofa/Betfair.

---

## `RUNTIME-HEALTH-006` — no-store

**Priorità:** media

**Azione:**

- aggiungere `Cache-Control: no-store`;
- testare l’header;
- evitare snapshot cached.

---

## `RUNTIME-HEALTH-007` — authority Health unica

**Priorità:** media

**Azione:**

- coordinare con `PREFLIGHT-API-006`;
- inventariare `/api/test/health`;
- rimuoverla se inutilizzata;
- mantenere `/api/health` come owner canonico.

---

## `RUNTIME-HEALTH-008` — verifica

**Priorità:** media

**Azione:**

- citare `server.test.mjs`;
- citare `pythonProcessRegistry.test.mjs`;
- aggiungere test allow-list, no-store e local boundary;
- non dichiarare live validation senza evidenza corrente.

---

# Ordine consigliato di applicazione

```text
1. applicare local boundary IMPL-017;
2. introdurre allow-list della response;
3. aggiungere no-store;
4. chiarire semantica ok/identity/snapshot;
5. inventariare e rimuovere /api/test/health se inutile;
6. ampliare i test;
7. aggiornare 06-runtime-health.md;
8. aggiornare mappa Markdown e JSON incrementale.
```

Le modifiche:

```text
RUNTIME-HEALTH-003
RUNTIME-HEALTH-004
RUNTIME-HEALTH-005
```

sono principalmente documentali.

Le modifiche:

```text
RUNTIME-HEALTH-001
RUNTIME-HEALTH-002
RUNTIME-HEALTH-006
RUNTIME-HEALTH-007
```

coinvolgono il runtime.

---

# Controlli previsti dopo un’eventuale modifica

## Backend

```bash
node --check backend/src/server.js
node --check backend/src/runtime/pythonProcessRegistry.js
node backend/src/server.test.mjs
node backend/src/runtime/pythonProcessRegistry.test.mjs
```

## Contratto Health

Verificare:

```text
GET /api/health
→ HTTP 200
→ Cache-Control no-store
→ project corretto
→ instanceId presente
→ timestamp presente
→ pid backend presente
→ pythonProcesses normalizzato
→ nessun campo privato
```

## Snapshot

Testare:

```text
zero processi
spawn_pending
running
stopping
force_stopping
pid null
più ruoli
campo privato iniettato
→ campo rimosso
```

## Boundary locale

Dopo `IMPL-017`:

```text
listener su 127.0.0.1
Host locale ammesso
Host esterno rifiutato
Origin frontend locale ammessa
Origin esterna rifiutata
porta alternativa launcher ammessa
```

## Regressioni

Verificare che non cambino:

```text
Stop
shutdown
python cleanup
tracking
login Betfair
writer authority
recovery
Evidence
```

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
06-runtime-health.md: CONTRATTO SOLIDO, REVISIONE MIRATA NECESSARIA
Endpoint: corretto
Shape principale: corretta
Snapshot Python: corretto
Redazione corrente del registry: corretta
Difesa HTTP allow-list: assente
Local boundary: approvato ma non ancora applicato
ok:true: da definire meglio
instanceId/startedAt: da precisare
Snapshot status/pid: da precisare
Cache-Control: da aggiungere
Health duplicata nel preflight: da consolidare
Test esistenti: più completi del documento
Riscrittura completa: non necessaria
Modularizzazione: non necessaria
Nuovi documenti: nessuno
Priorità: medio-alta
```

Il documento non deve essere diviso.

Ha un solo endpoint, un solo owner e una shape compatta.

La correzione più importante è rafforzare il confine:

```text
registry sicuro
+
allow-list HTTP
+
local boundary IMPL-017
```

senza trasformare `/api/health` in un indicatore della salute complessiva della sessione live.
