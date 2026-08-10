# Report documentale — `docs/tennis-decision-ui/reference/01-repository-map.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-037
Sequenza audit: 37/72
Documento analizzato: 01-repository-map.md
Percorso documento: docs/tennis-decision-ui/reference/01-repository-map.md
Percorso report: Report documentale/37 - 01-repository-map.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 99de371d630ee586d4936b1e9cf9051bda01a8fc
Ruolo dichiarato: orientamento repository, entrypoint, responsabilità, owner e contesto minimo
Stato report: completato
```

Il documento è stato confrontato con il codice e con i registri correnti sullo stesso commit, in particolare:

```text
avvio.py
scraper.py
betfair_scraper.py

launcher/app.py
launcher/config.py
launcher/services.py
launcher/session.py

backend/src/server.js
backend/src/routes/match.js
backend/src/routes/betfair.js
backend/src/routes/evidence.js
backend/src/routes/test.js
backend/src/sofa/pointByPoint.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js

frontend/src/App.jsx

scripts/validation/test-manifest.json
scripts/validation/run.mjs
scripts/check_documentation_links.py
.gitignore

docs/tennis-decision-ui/index.md
docs/tennis-decision-ui/operations/01-local-runtime.md
docs/validations/README.md

todo-list-tennis-decision-ui.md
implementazioni/02-audit-documentazione.md
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md
implementazioni/06-implementazioni-proposte.md
implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
```

GitHub non è stato modificato.

Per istruzione dell’utente:

```text
questo report conclude soltanto l’analisi del documento 037

NON aggiornare ora:
- mappa cumulativa dell’audit
- JSON incrementale/cumulativo
- Todo
- registri
- documentazione canonica
- GitHub

Dopo la consegna del report:
FERMARSI
e attendere i file che l’utente fornirà per l’aggiornamento.
```

Il blocco documentale 033–037 raggiunge quindi il proprio quinto report, ma il relativo checkpoint cumulativo viene **intenzionalmente rinviato** fino alla consegna dei file da parte dell’utente.

---

# Esito sintetico

```text
Coerenza generale:                         ALTA
Funzione di orientamento:                   ALTA
Root entrypoint:                            ALTA
Wrapper scraper:                            ALTA
Launcher runtime ad alto livello:           ALTA
Mappa file launcher:                        INCOMPLETA
Porte preferite/fallback:                   COERENTE
Ownership launcher:                         COERENTE A LIVELLO GENERALE
Backend routing:                            ALTA
Storage/journal/authority:                  ALTA
Frontend orientation:                       ALTA
Dati runtime/sensibili:                     INCOMPLETA
Validation runner orientation:              MEDIO-ALTA
Riferimento IMPL-003:                       IMPRECISO
Separazione owner vs dettagli:              MIGLIORATA MA NON COMPLETA
Conteggi test nel documento reference:      DA RIDURRE / SPOSTARE
Modularizzazione:                           NON necessaria

Nuovi finding:                              3
Finding esistenti richiamati:               DOC-002, DOC-006
Riscrittura completa:                       NO
Revisione mirata:                           SÌ
Nuovi documenti canonici:                   nessuno
Priorità complessiva:                       MEDIO-ALTA
```

La versione corrente è nettamente più corretta e contenuta rispetto alla vecchia repository map.

La sua struttura principale è adatta allo scopo:

```text
root
→ runtime locale
→ data flow
→ backend
→ storage
→ Python/scraper
→ frontend
→ dati generati
→ controlli
→ validation
→ documentazione
→ orientamento per task
```

Il documento non deve essere trasformato in un inventario completo di ogni file.

La sua funzione corretta resta:

```text
task
→ dove iniziare
→ quale area possiede la responsabilità
→ quali file minimi aprire
→ quale documento owner consultare
```

Il problema principale è quindi di **precisione selettiva**:

```text
alcuni dettagli molto granulari sono ancora presenti
mentre
alcuni file/stati fondamentali per l’orientamento mancano.
```

---

# 1. Root entrypoint: corretti

## Esito: confermato

La mappa presenta:

```text
avvio.py
scraper.py
betfair_scraper.py
```

come wrapper pubblici.

Il codice reale conferma.

### `avvio.py`

È una facade sottile:

```python
from launcher.app import main
```

e chiama `main()` soltanto quando eseguito come modulo principale.

Quindi:

```text
avvio.py
→ wrapper pubblico launcher
→ launcher/app.py
```

è corretto.

### `scraper.py`

È una facade sottile verso:

```text
scrapers.sofa.cli.main
```

### `betfair_scraper.py`

È una facade sottile verso:

```text
scrapers.betfair.cli.main
```

La frase:

```text
I wrapper root restano facade compatibili.
Non spostare logica di dominio nei wrapper.
```

è coerente con l’implementazione corrente.

## Decisione

Preservare.

Non ampliare questi wrapper nella repository map con dettagli CLI già posseduti dai documenti Python.

---

# 2. Porte preferite e fallback: corretti

## Esito: confermato

`launcher/config.py` definisce:

```text
PREFERRED_BACKEND_PORT = 3001
PREFERRED_FRONTEND_PORT = 3000
PREFERRED_CDP_PORT = 9222
```

Il commento del codice chiarisce:

```text
preferred ports
→ actual chosen ports resolved at runtime
```

`launcher/services.py` conferma inoltre:

```text
No kill by port
Reuse only if identity validation succeeds
Own only what launcher starts
Max 5 port attempts per service
```

La repository map scrive correttamente:

```text
le porte non identificano da sole l'ownership
il launcher può riusare servizi validi
oppure scegliere porte alternative
non deve terminare processi esterni
in base alla sola porta
```

Questa parte non richiede un nuovo finding.

---

# 3. Chrome/CDP non owned dal launcher: corretto

## Esito: confermato

`launcher/services.py` tratta Chrome/CDP separatamente.

Il commento implementation-level è esplicito:

```text
launch Chrome for CDP
→ never owned
```

Il launcher:

```text
può riusare un endpoint CDP valido
oppure chiedere l’avvio tramite helper
```

ma non registra Chrome dentro `_owned_entries` come backend/frontend.

La repository map dice:

```text
Chrome/CDP
→ non owned dal launcher
```

ed è coerente.

Preservare il livello sintetico.

Non duplicare nella mappa tutta la state machine CDP.

---

# 4. `launcher/session.py` manca dalla mappa minima del launcher

## Esito: NUOVO FINDING

Questa è la discrepanza strutturale più importante del documento.

La mappa presenta:

```text
launcher/
├── app.py
├── config.py
├── services.py
└── system.py
```

Manca:

```text
launcher/session.py
```

Non è un helper marginale.

È un owner operativo centrale.

## Evidenza da `launcher/app.py`

`launcher/app.py` importa direttamente da `.session`:

```text
_empty_manifest
acquire_or_recover_lock
create_launcher_session_identity
is_manifest_reusable
manifest_set_session_status
read_manifest
release_lock
remove_manifest
write_manifest
```

Quindi una task su:

```text
launcher lock
manifest
session reuse
ownership persistita
recovery del lock
session identity
```

non può essere orientata correttamente leggendo soltanto:

```text
app.py
config.py
services.py
system.py
```

## Responsabilità reale di `session.py`

Il modulo dichiara:

```text
Session lock and manifest management.
```

e possiede:

```text
launcher/.runtime/
├── launcher.lock
├── launcher.lock.guard
└── manifest.json
```

Definisce inoltre:

```text
schema lock
schema manifest
sessionId
launcher PID
process identity
start fingerprint
service ownership values
service status
lock classification
stale recovery
lock acquire
lock release
manifest construction
```

Queste sono responsabilità strutturali, non semplici dettagli interni.

## Perché è un errore di repository map

Una repository map non deve elencare tutti i file.

Ma deve elencare i file che cambiano il punto di ingresso corretto per una task.

Esempio:

```text
task:
“seconda invocazione launcher non deve aprire un’altra sessione”

mappa corrente:
→ avvio.py
→ launcher/
→ app.py/services.py/system.py/config.py

realtà:
→ session.py è indispensabile
```

Altro esempio:

```text
task:
“manifest runtime non viene scritto/rimosso correttamente”

owner implementation:
→ launcher/session.py
```

## Finding `REPO-MAP-001` — `launcher/session.py` assente dalla superficie minima

**Priorità:** high  
**Tipo:** repository orientation / launcher ownership

### Correzione consigliata

La mappa minima dovrebbe diventare:

```text
launcher/
├── app.py
├── session.py
├── services.py
├── system.py
└── config.py
```

Con responsabilità sintetiche:

```text
app.py
→ orchestration della sessione launcher

session.py
→ lock, manifest e launcher session identity

services.py
→ discovery/start/reuse/shutdown dei servizi

system.py
→ probe, identity check, wait e utility runtime

config.py
→ percorsi e porte preferite
```

Non inserire nella repository map l’algoritmo completo di:

```text
coordination guard
PID recycling
lock schema
manifest schema
```

Questi dettagli appartengono al codice e al runbook Runtime.

### Verification

Una task classificata:

```text
Launcher / sessione / lock / manifest / riuso
```

deve orientare almeno verso:

```text
avvio.py
launcher/app.py
launcher/session.py
launcher/services.py
launcher/tests/test_launcher.py quando il test è coinvolto
operations/01-local-runtime.md
```

---

# 5. Ownership launcher: concetto corretto, implementazione troppo compressa

## Esito: collegato a `DOC-006`, NON nuovo finding

La mappa dice:

```text
launcher lock
→ impedisce launcher concorrenti
→ governa backend/frontend avviati o riusati
```

A livello operativo generale la frase è comprensibile e il runbook Runtime usa una formulazione simile.

Ma l’implementazione reale separa almeno tre responsabilità:

```text
session.py
→ lock + manifest + session identity

services.py
→ `_owned_entries`
→ processi backend/frontend realmente avviati dal launcher

manifest
→ rappresentazione di status/ownership/endpoint della sessione
```

Un servizio:

```text
reused
```

può essere registrato nel manifest ma non diventa:

```text
owned
```

Il launcher shutdown deve toccare soltanto i processi realmente owned.

## Decisione

Non creare un nuovo finding.

Questo rientra nel finding documentale esistente:

```text
DOC-006
→ repository map e documenti architetturali
   non devono duplicare contratti dettagliati di ownership
```

La correzione consigliata non è aggiungere più lifecycle.

È il contrario:

```text
launcher session
→ lock + manifest

service lifecycle
→ services.py

dettagli
→ operations/01-local-runtime.md
```

La mappa deve orientare, non diventare il secondo runbook launcher.

---

# 6. Sequenza backend writer authority → recovery → listener: corretta

## Esito: confermato

La mappa descrive:

```text
backend startServer()
→ acquire writer authority
→ recovery
→ listener readiness
→ tracking runtime
```

`backend/src/server.js` conferma.

`startServer()`:

```text
1. createMatchHistoryWriterAuthority()
2. acquire()
3. runPendingCommitRecovery(...)
4. blocca su recovery fatal
5. app.listen(...)
6. registra shutdown
```

La mappa è quindi corretta sul **flusso alto livello**.

## Attenzione documentale

La repository map aggiunge anche:

```text
lo shutdown rilascia l'authority
soltanto dopo tracker drain positivo
e listener chiuso
```

Questa frase è anch’essa coerente con il codice corrente.

Tuttavia è un contratto lifecycle dettagliato.

## Decisione

Non creare finding tecnico.

Classificarlo sotto:

```text
DOC-002
DOC-006
```

perché il dettaglio:

```text
esatta precondizione di release
```

appartiene al documento owner Runtime/Storage.

Nella repository map basta:

```text
server.js
→ bootstrap backend, recovery bootstrap e shutdown coordinato

writer authority
→ runtime/matchHistoryWriterAuthority.js
```

con link agli owner.

---

# 7. Router backend: la mappa è sostanzialmente corretta

## Esito: confermato

`backend/src/server.js` monta:

```text
/api/match
/api/strategy
/api/betfair
/api/test
/api/evidence
```

La mappa descrive correttamente le aree:

```text
API Match
API Betfair
API Evidence
API Preflight
```

e ricorda che Strategy è ancora presente ma deprecata.

## Match

La route reale contiene:

```text
GET  /debug-last
GET  /:eventId/source-identity-status
GET  /:eventId/history
GET  /:eventId/json
POST /track
POST /untrack
POST /stop
POST /analyze
POST /snapshot → redirect analyze
```

La responsabilità sintetica della mappa:

```text
tracking
stop
Source Identity status
history
timeline
analisi
```

è corretta.

## Betfair

La route reale contiene:

```text
GET  /:eventId/latest
GET  /:eventId/json
GET  /log
POST /login-window
GET  /odds
```

La mappa usa una descrizione volutamente generale:

```text
Latest, timeline, health, log, login e endpoint Betfair ancora presenti
```

Non presenta l’endpoint legacy come architettura da estendere.

Corretto.

## Evidence

La mappa dice:

```text
Snapshot Evidence e mutazioni Source Identity esplicite
```

È una formulazione migliore della vecchia ambiguità read-only.

Il router reale contiene:

```text
GET latest
POST confirm
DELETE confirm
```

quindi la responsabilità è coerente.

## Preflight

`routes/test.js` contiene:

```text
health
cdp
sofa-url
betfair-url
graph-urls
```

La descrizione:

```text
controlli leggeri prima dello Start
```

è adeguata a una repository map.

---

# 8. La mappa non deve trasformarsi in inventario endpoint

## Esito: conferma di una scelta corretta

Esiste già:

```text
IMPL-002 — Inventario automatico degli endpoint
```

La repository map non deve assorbirlo.

Quindi non aggiungere nella mappa:

```text
elenco completo GET/POST
status code
payload
error mapping
redirect
query param
```

Per una task endpoint la mappa deve continuare a dire:

```text
router
→ modulo response/puro
→ test vicino
→ documento API owner
```

Questa impostazione è corretta.

---

# 9. Storage, `.pending_commits` e `.writer_authority`: corretti

## Esito: confermato

La struttura concettuale:

```text
backend/match_history/
├── dati canonici
├── .pending_commits/
└── .writer_authority/
```

è corretta per orientamento.

La distinzione:

```text
.pending_commits
→ recovery multi-documento

.writer_authority
→ esclusione process-level
```

è importante e va preservata.

Anche le regole:

```text
non cancellare manualmente pending
non cancellare authority per sbloccare backend
API read-only non fanno recovery
health/freshness/integrity distinti
```

sono coerenti con gli owner correnti.

## Problema di granularità

La repository map entra poi in dettagli come:

```text
secondo backend bloccato prima della recovery
release solo dopo tracker drain positivo
```

Sono corretti, ma appartengono al contratto owner.

## Decisione

Non rimuovere il concetto di authority.

Ridurre eventualmente a:

```text
backend/match_history/
→ dati canonici + sidecar recovery/authority

owner:
→ Timeline e history
→ Commit journal e recovery
→ Runtime locale
```

e lasciare i dettagli ai documenti collegati.

Questo è già `DOC-006`.

---

# 10. Source Identity confirmations mancano dall’inventario dei dati locali

## Esito: NUOVO FINDING

La sezione:

```text
Dati generati, runtime e sensibili
```

ha una funzione operativa molto importante:

```text
cosa non mettere nel normale contesto
cosa non versionare
cosa non trattare come codice
```

Elenca:

```text
backend/match_history/
.pending_commits/
.writer_authority/
backend/scraper_cache/
backend/betfair_cache/
profili browser
backend/betfair_network_dump/
log runtime
launcher/.runtime/
node_modules/build
.env
```

Manca:

```text
backend/source_identity_confirmations.json
```

## Il file è reale

`sourceIdentityConfirmationStore.js` definisce:

```text
SOURCE_IDENTITY_CONFIRMATION_STORE_PATH
→ backend/source_identity_confirmations.json
```

Il file è letto e scritto dal confirmation store.

La scrittura è atomica tramite:

```text
temporary file
→ rename
```

e conserva record di conferma operatore.

## `.gitignore`

La root `.gitignore` esclude esplicitamente:

```text
backend/source_identity_confirmations.json
```

Quindi non è una semplice ipotesi documentale.

È uno stato locale persistito noto al progetto.

## Semantica

Non è:

```text
cache
dump
log
build
```

È:

```text
persistenza locale di conferme Source Identity
```

La retention owner già stabilisce:

```text
non cancellare automaticamente
```

## Perché deve comparire nella repository map

La repository map è il primo documento consigliato dall’indice canonico.

Se un task riguarda:

```text
Source Identity
backup locale
cleanup
privacy
migrazione working copy
debug persistence
```

l’assenza del confirmation store può portare a:

```text
contesto incompleto
backup incompleto
classificazione errata come file temporaneo
cleanup improprio
```

## Finding `REPO-MAP-002` — confirmation store assente dai dati locali

**Priorità:** high  
**Tipo:** repository orientation / local persisted state

### Correzione minima

Aggiungere:

```text
backend/source_identity_confirmations.json
→ conferme operatore Source Identity
→ stato locale persistito
→ non cache
→ non includere nel normale contesto
→ non versionare
→ non cancellare automaticamente
```

### Owner

Rimandare a:

```text
modules/evidence/02-source-identity.md
operations/05-retention-and-cleanup.md
```

Non spiegare nella repository map:

```text
fingerprint
epochSignature
selectionIds
pair validation
```

### Verification

Una task:

```text
backup / cleanup / Source Identity persistence
```

deve identificare il file senza dover scandire tutto `backend/`.

---

# 11. `backend/scraper_profile/`: non apro un finding separato

## Esito: copertura generica accettabile

`.gitignore` esclude:

```text
backend/scraper_profile/
```

La repository map usa però la categoria:

```text
profili browser
→ sensibili e non condivisibili
```

Questa categoria copre concettualmente:

```text
scraper_profile
profilo Chrome persistent
```

Il documento non è un inventario path-by-path.

Quindi non considero l’assenza del path esplicito:

```text
backend/scraper_profile/
```

un finding separato.

## Miglioria facoltativa

La futura revisione può rendere l’esempio più concreto:

```text
profili browser
(es. backend/scraper_profile/ e profilo Chrome locale)
```

senza creare una nuova policy.

---

# 12. Frontend: orientamento coerente

## Esito: confermato

La mappa presenta:

```text
frontend/src/
├── App.jsx
├── components/
├── hooks/
├── services/
├── utils/
└── types/
```

e classifica:

```text
Composizione
Sessione
Source Identity
Polling dati
View model
Contesto punti
API client
```

`App.jsx` corrente importa realmente:

```text
DashboardWorkspace
OverviewDashboard
StartAnalysisPanel

useAnalysisSessionState
useLiveTrackingActions
useMatchPolling
useBetfairJson
useMarketReactionEvidence
useSourceIdentityGateStatus
useDashboardViewModel

liveSessionApi
```

Quindi la mappa non sta inventando aree.

La frase:

```text
il frontend non legge filesystem
non legge journal/writer authority
non esegue recovery
```

è coerente con il confine architetturale.

## Dettaglio da non aggiungere

Non inserire nella repository map:

```text
tutti gli hook
tutti i state field
tutti i polling interval
tutte le prop
```

Questo rientrerebbe nel problema già registrato `DOC-006`.

---

# 13. `pointByPoint.js` e `localContext.js`: percorsi coerenti

## Esito: confermato

La mappa cita:

```text
sofa/normalizeSnapshot.js
pointByPoint.js
localContext.js
```

`backend/src/sofa/pointByPoint.js` esiste realmente.

Non è emersa una path divergence in questa area.

La descrizione:

```text
Snapshot e contesto descrittivo
```

è adatta a una reference map.

---

# 14. Validation runner: struttura corrente correttamente individuata

## Esito: confermato

La mappa indica:

```text
scripts/validation/
├── test-manifest.json
├── manifest-schema.json
├── result-schema.json
├── run.mjs
├── run.test.mjs
└── support/
```

`run.mjs` corrente:

```text
legge il manifest
valida configurazione
seleziona il profilo
risolve le entry
esegue entry in serie
applica timeout/output cap
costruisce risultato
scrive artifact in test-results/
```

Il manifest corrente distingue profili:

```text
fast
backend
frontend
python
full-offline
```

da:

```text
persistence
benchmark
live
```

ancora pianificati/disabilitati.

Quindi il concetto:

```text
runner canonico per profili offline registrati
```

è corretto.

Anche:

```text
test-results/
→ artefatto generato
→ escluso da Git
```

è confermato dalla `.gitignore`.

---

# 15. Il riferimento a `IMPL-003` è semanticamente impreciso

## Esito: NUOVO FINDING

La repository map dice:

```text
Il manifest iniziale ...
non sostituisce ancora la mappa completa IMPL-003
```

Il problema è il nome.

`IMPL-003` non è una repository map.

Il suo owner corrente è:

```text
IMPL-003 — Matrice test ↔ modulo ↔ documento
```

Output minimo previsto:

```text
Area
Owner
Test automatici
Build/check
Live
Ultimo esito
```

## Perché conta

La repository map stessa è già:

```text
reference/01-repository-map.md
```

Usare:

```text
mappa completa IMPL-003
```

può far credere che esista o sia prevista:

```text
una seconda repository map
```

quando invece la proposta riguarda:

```text
test coverage mapping
```

Questo contrasta anche con il principio:

```text
un owner unico per responsabilità
```

## Finding `REPO-MAP-003` — `IMPL-003` descritto come “mappa completa”

**Priorità:** medium  
**Tipo:** cross-reference semantics

### Correzione

Sostituire con una formulazione equivalente a:

```text
Il manifest non sostituisce ancora
la matrice test ↔ modulo ↔ documento prevista da IMPL-003.
```

Oppure, se la matrice verrà implementata:

```text
per copertura e ultimo esito dei test
→ vedere la matrice owner di IMPL-003
```

### Non fare

Non creare:

```text
reference/second-repository-map.md
```

per chiudere IMPL-003.

Non è la sua responsabilità.

---

# 16. I conteggi `26 / 10 / 30` non appartengono stabilmente a una repository map

## Esito: `DOC-002` / `DOC-006`, NON nuovo finding

La mappa contiene:

```text
matchHistoryWriterAuthority.test.mjs
→ 26 passati

matchTracker.test.mjs
→ 10 passati

server.test.mjs
→ 30 passati
```

e:

```text
Non è stato eseguito un collaudo manuale
con due backend reali concorrenti.
```

Queste informazioni possono essere state corrette al momento della pubblicazione.

Il problema non è la loro veridicità storica.

Il problema è il loro **owner**.

## Una repository map dovrebbe dire

```text
test launcher
→ launcher/tests/

test server
→ backend/src/server.test.mjs

test tracker
→ backend/src/sofa/matchTracker.test.mjs

runner
→ scripts/validation/run.mjs
```

Non dovrebbe diventare il ledger di:

```text
quanti test sono passati
quale collaudo manuale manca
ultimo risultato per SHA
```

## Perché

Il conteggio può cambiare quando:

```text
si aggiunge un test
si modularizza una suite
si modifica un harness
si cambia il manifest
```

senza che la struttura del repository sia cambiata.

Quindi crea una dipendenza inutile:

```text
modifica test
→ modifica repository map
```

È precisamente il rischio già descritto da:

```text
DOC-002
DOC-006
```

## Destinazione corretta

Lo stato di validazione appartiene a:

```text
roadmap/01-current-state.md
docs/validations/
scripts/validation artifacts
futura IMPL-003
futuro/previsto ledger IMPL-031
```

secondo il livello di prova.

## Decisione

Non aprire un nuovo finding.

Quando si aggiornerà il documento:

```text
rimuovere i conteggi hard-coded
oppure trasformarli in semplice rimando
```

Preservare invece:

```text
dove si trovano runner e test.
```

---

# 17. La frase sul collaudo manuale concorrente è valida ma collocata male

## Esito: collegato a `DOC-006`

Il runbook Runtime possiede già:

```text
writer authority implementata
test automatici passati
collaudo manuale con due backend reali
non eseguito
```

Quindi la repository map duplica uno stato operativo già posseduto.

## Decisione

Lasciare a:

```text
operations/01-local-runtime.md
roadmap/01-current-state.md
validation artifact
```

la distinzione:

```text
automaticamente verificato
vs
live/manuale non verificato
```

Nella map basta indicare:

```text
writer authority
→ backend/src/runtime/matchHistoryWriterAuthority.js
→ owner Runtime/Storage
```

---

# 18. `DOC-002` resta parzialmente applicabile

## Finding esistente, non duplicare

`DOC-002` dice:

```text
Repository map troppo estesa e potenzialmente duplicata
```

e stabilisce che la map deve mantenere:

```text
struttura root
aree principali
responsabilità generali
file owner
riferimenti
esclusioni per contesto AI
```

riducendo:

```text
payload
status HTTP
lifecycle completo
regole già possedute
descrizioni granulari
```

La versione corrente ha già compiuto una grossa riduzione rispetto alla versione MDX storica.

Quindi non va trattata come se `DOC-002` fosse completamente irrisolto.

## Stato osservato nel report 037

```text
DOC-002
→ migliorato sostanzialmente
→ residuo ancora presente
```

Residui principali:

```text
shutdown authority dettagliato
persistence lifecycle dettagliato
conteggi test hard-coded
stato collaudo manuale
```

Non serve una riscrittura completa.

Serve potatura mirata.

---

# 19. `DOC-006` resta parzialmente applicabile

## Finding esistente, non duplicare

`DOC-006` stabilisce:

```text
Repository map:
→ percorsi
→ responsabilità
→ entrypoint
→ owner
→ tipi di dati
→ link

System boundaries:
→ confini trasversali

Data lifecycle:
→ flusso generale
```

e sposta i dettagli specifici verso gli owner.

La repository map corrente segue già in buona parte questa impostazione.

I residui da ridurre sono soprattutto:

```text
condizione esatta release writer authority
regole precise secondo backend
dettaglio integrity/read-only
conteggi e stato validation
```

La soluzione corretta non è togliere:

```text
writer authority
.pending_commits
Source Identity
validation runner
```

dalla map.

Sono concetti utili per orientarsi.

Bisogna togliere soltanto:

```text
contratto dettagliato
```

quando può essere sostituito da:

```text
owner + link.
```

---

# 20. Dati generati e sensibili: struttura buona ma da completare

## Esito: medio-alto

La sezione è utile e deve restare.

È una delle poche parti in cui la repository map non serve soltanto a:

```text
trovare codice
```

ma anche a evitare che una task AI o una manutenzione includa:

```text
runtime data
segreti
dump
profile
cache
```

Questo è coerente con:

```text
ai/01-context-selection.md
```

e con la `.gitignore`.

## Elementi corretti

```text
match_history
pending journal
writer authority
runtime cache
browser profile
network dump
logs
launcher/.runtime
node_modules/build
.env
```

## Elemento da aggiungere

```text
source_identity_confirmations.json
```

come `REPO-MAP-002`.

## Non trasformare la sezione in `.gitignore`

Non aggiungere ogni:

```text
*.tmp
coverage
playwright-report
.vite
eslintcache
Desktop.ini
```

La `.gitignore` possiede l’elenco meccanico.

La repository map deve conservare soltanto le categorie che cambiano:

```text
privacy
canonicality
runtime ownership
AI context selection
cleanup safety
```

---

# 21. Documentation tree: coerente con la gerarchia corrente

## Esito: confermato

La map distingue:

```text
docs/tennis-decision-ui/
→ owner tecnici

docs/validations/
→ collaudi e osservazioni storiche

docs/archive/
→ materiale non canonico conservato
```

`docs/validations/README.md` conferma:

```text
validazioni storiche
→ non owner
→ non sostituiscono codice/test/runbook
```

`docs/tennis-decision-ui/index.md` conferma la stessa gerarchia.

Questa parte è coerente.

Preservare.

---

# 22. La repository map non deve elencare tutti i 40 documenti canonici

## Esito: scelta corretta

L’indice canonico già possiede la navigazione completa per:

```text
architecture
API
SofaScore
storage
Betfair
Evidence
frontend
Python
operations
validations
registri
```

La repository map usa soltanto collegamenti di orientamento.

È corretto.

Aggiungere un secondo elenco completo produrrebbe:

```text
duplicazione con index.md
```

e aggraverebbe `DOC-002`.

---

# 23. Orientamento per tipo di task: sezione valida

## Esito: confermato

La tabella finale:

```text
Endpoint HTTP
Tracking
Persistenza
Betfair
Frontend
Launcher
Documentazione
```

è perfettamente coerente con la funzione del documento.

Questa è una delle sezioni da preservare.

## Miglioria collegata a `REPO-MAP-001`

La riga Launcher può essere resa leggermente più precisa.

Attuale:

```text
wrapper avvio.py
package launcher/
runbook runtime
```

Proposta:

```text
avvio.py
launcher/app.py
session.py quando la task coinvolge lock/manifest/sessione
services.py quando coinvolge processi/porte/reuse
operations/01-local-runtime.md
```

Non serve inserire tutta questa granularità nella tabella se la sezione Python/launcher sopra la espone chiaramente.

---

# 24. Orientamento persistence: corretto

## Esito: confermato

La tabella dice:

```text
writer authority
facade
writer
journal
recovery
test storage
```

Questo evita il vecchio errore di partire soltanto da:

```text
matchHistory.js
```

come se possedesse tutta la persistence.

È coerente con la modularizzazione corrente.

Preservare.

---

# 25. Controlli documentali: corretti come orientamento

## Esito: confermato

La mappa cita:

```text
scripts/check_documentation_links.py
scripts/check_registry_consistency.py
```

e i rispettivi test.

Il link checker è esplicitamente:

```text
read-only
non riscrive file
```

e filtra:

```text
runtime
cache
match_history
network dump
launcher/.runtime
```

La descrizione generale della map:

```text
utility offline
nessun accesso runtime
nessuna modifica documenti
```

è coerente per il link checker.

Non è necessario duplicarne lo schema di output.

---

# 26. `IMPL-003` e runner devono restare distinti

## Esito: principio importante

La repository map tende a mettere nello stesso paragrafo:

```text
validation runner
+
IMPL-003
+
IMPL-008
+
IMPL-030
+
IMPL-031
```

La distinzione corretta è:

```text
run.mjs
→ executor manifest-driven corrente

IMPL-003
→ matrice test ↔ modulo ↔ documento

IMPL-008
→ persistence/recovery sandbox

IMPL-030
→ frontend interaction harness

IMPL-031
→ validation result ledger
```

Queste strutture non sono sinonimi.

Il nuovo finding `REPO-MAP-003` riguarda soltanto l’etichetta sbagliata data a `IMPL-003`.

Non serve riscrivere tutta la sezione.

---

# 27. Aree deprecate: formulazione corretta

## Esito: confermato

La map dice:

```text
Sono ancora presenti aree deprecate,
tra cui API/UI Strategy e alcuni endpoint legacy.
Non estenderle.
```

Il server monta ancora:

```text
/api/strategy
```

e il codice Betfair contiene ancora:

```text
GET /odds
```

Quindi la frase non inventa una rimozione già avvenuta.

È una buona formulazione reference-level.

Non serve enumerare tutte le future rimozioni.

---

# 28. Route Evidence: la mappa ha già corretto il vecchio `DOC-003`

## Esito: nota positiva

Un vecchio problema documentale era:

```text
router Evidence descritto in modo troppo read-only
```

La mappa corrente non commette quell’errore.

Scrive:

```text
API Evidence
→ Snapshot Evidence e mutazioni Source Identity esplicite
```

Questa formulazione distingue correttamente:

```text
Evidence snapshot read
vs
Source Identity mutation endpoints
```

Non creare un nuovo rilievo.

---

# 29. Path `backend/source_identity_confirmations.json`: importanza trasversale

## Approfondimento di `REPO-MAP-002`

L’omissione ha impatto su più task:

### Source Identity

```text
manual confirmation
→ persistent store
```

### Retention

```text
confirmation store
→ non cache
→ non cleanup automatico
```

### Backup

```text
se serve riprodurre una conferma applicabile
→ può essere un input rilevante
```

### Privacy

Il file contiene dati come:

```text
eventId
marketId
selectionIds
sofaPlayers
betfairRunners
selectedPairs
timestamps
```

La repository map non deve riportare questo schema.

Ma proprio per questo deve classificare il file come:

```text
local persisted operational state
```

e non lasciarlo invisibile.

---

# 30. Non aggiungere `source_identity_confirmations.json` al root tree

## Decisione

La correzione di `REPO-MAP-002` deve avvenire nella sezione:

```text
Dati generati, runtime e sensibili
```

non nel root tree principale.

Il root tree serve a codice e directory strutturali.

Il confirmation file è stato locale runtime/persistence.

Quindi:

```text
root tree
→ invariato

runtime/sensitive table
→ aggiungere confirmation store
```

---

# 31. Non aggiungere `.runtime` internals al root tree

## Decisione collegata a `REPO-MAP-001`

La mappa deve aggiungere:

```text
launcher/session.py
```

ma non serve espandere:

```text
launcher/.runtime/
├── launcher.lock
├── launcher.lock.guard
└── manifest.json
```

nel root diagram.

Basta una riga:

```text
launcher/.runtime/
→ lock/manifest effimeri
```

già presente nella sezione dati runtime.

La distinzione interna può restare nel runbook/code.

---

# 32. Root tree non deve diventare inventario A8–A13

## Esito: importante per non sovracorreggere

La Todo corrente mantiene aperti:

```text
A8  inventario completo root
A9  inventario completo backend
A10 inventario completo frontend
A11 inventario package Python
A12 inventario script
A13 inventario test
```

Questi inventari sono un’altra responsabilità.

La repository map non deve diventare la soluzione manuale di A8–A13.

Quindi:

```text
manca un file qualsiasi
≠
finding automatico
```

`session.py` è finding perché è un **owner indispensabile** per una classe di task.

`source_identity_confirmations.json` è finding perché è uno **stato locale persistito sensibile/non-cache** necessario alla classificazione.

Non bisogna aggiungere centinaia di file.

---

# 33. Il documento ha già una buona clausola di non-autorità

## Esito: preservare

In apertura dice:

```text
Non sostituisce:
- contratti API
- documenti moduli
- registri audit
```

Questa è una protezione importante contro `DOC-006`.

Va mantenuta.

Possibile rafforzamento:

```text
la repository map orienta;
il documento owner definisce il contratto.
```

Non serve molto altro.

---

# 34. Nuovi finding

## `REPO-MAP-001` — `launcher/session.py` assente dalla mappa minima

**Priorità:** high  
**Tipo:** launcher ownership / repository orientation

### Evidenza

```text
launcher/app.py
→ importa direttamente session primitives

launcher/session.py
→ lock
→ manifest
→ launcher session identity
→ process identity
→ lock recovery/release
```

### Azione

Aggiungere `session.py` alla superficie launcher e distinguere sinteticamente:

```text
app
session
services
system
config
```

### Dipendenze

```text
operations/01-local-runtime.md
PY-RUNTIME-* quando il dettaglio implementation-level è coinvolto
```

### Non duplicare

Non creare una nuova state machine documentale del launcher.

---

## `REPO-MAP-002` — Source Identity confirmation store assente dalla classificazione locale

**Priorità:** high  
**Tipo:** persisted local state / context safety

### Evidenza

```text
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js
→ backend/source_identity_confirmations.json

.gitignore
→ esclude backend/source_identity_confirmations.json
```

### Azione

Aggiungere alla tabella dati locali:

```text
backend/source_identity_confirmations.json
→ conferme Source Identity persistite
→ non cache
→ non versionare
→ task-specific only
→ non cancellare automaticamente
```

### Owner

```text
Source Identity
Retention
```

---

## `REPO-MAP-003` — `IMPL-003` chiamata impropriamente “mappa completa”

**Priorità:** medium  
**Tipo:** cross-reference semantics

### Evidenza

Owner corrente:

```text
IMPL-003
→ Matrice test ↔ modulo ↔ documento
```

### Azione

Sostituire:

```text
mappa completa IMPL-003
```

con:

```text
matrice test ↔ modulo ↔ documento prevista da IMPL-003
```

### Non fare

Non creare una seconda repository map.

---

# 35. Finding esistenti da NON duplicare

## `DOC-002`

```text
Repository map troppo estesa e potenzialmente duplicata
```

Stato report 037:

```text
fortemente migliorata
ma non completamente chiusa
```

Residui:

```text
test counts
validation status
shutdown detail
persistence detail
```

---

## `DOC-006`

```text
Repository map e documenti architetturali
duplicano contratti owner
```

Stato report 037:

```text
ancora applicabile
come criterio di potatura
```

Non creare nuovi ID per:

```text
writer authority release condition
second backend bootstrap details
integrity details
```

---

# 36. Finding di altri report da non riaprire qui

La repository map attraversa molti domini.

Non deve diventare il punto in cui riaprire ogni problema visto nei report precedenti.

Esempi:

```text
PY-RUNTIME-*
SOFA-SCRAPER-*
BETFAIR-SCRAPER-*
RETENTION-*
VALID-ROLL-*
FRONTEND-*
STORAGE-*
```

Se la map orienta correttamente verso l’owner, il problema resta nel suo finding originario.

La regola è:

```text
repository map error
→ path/responsibility/owner/context selection errato

domain behavior error
→ finding del dominio
```

---

# 37. Correzioni documentali consigliate

## Correzione 1 — launcher surface

Da:

```text
launcher/
├── app.py
├── config.py
├── services.py
└── system.py
```

A una forma equivalente a:

```text
launcher/
├── app.py
├── session.py
├── services.py
├── system.py
└── config.py
```

Con responsabilità brevi.

---

## Correzione 2 — local persisted Source Identity state

Aggiungere:

```text
backend/source_identity_confirmations.json
```

nella tabella:

```text
Dati generati, runtime e sensibili
```

Classificazione:

```text
stato locale persistito
non cache
non versionare
non cancellare automaticamente
```

---

## Correzione 3 — IMPL-003

Da:

```text
mappa completa IMPL-003
```

A:

```text
matrice test ↔ modulo ↔ documento di IMPL-003
```

---

## Correzione 4 — test counts

Rimuovere dalla reference map:

```text
26 passati
10 passati
30 passati
```

oppure sostituire con:

```text
test automatici registrati nel validation runner
→ vedere runner/current state/validation artifact
```

Questo chiude una parte residua di `DOC-002`/`DOC-006`.

---

## Correzione 5 — collaudo manuale

Rimuovere dalla map:

```text
Non è stato eseguito un collaudo manuale...
```

e lasciare lo stato a:

```text
operations/01-local-runtime.md
roadmap/01-current-state.md
validations
```

---

## Correzione 6 — persistence detail

Ridurre, senza perdere il concetto:

```text
authority
journal
canonical data
```

I dettagli esatti di:

```text
acquire
recovery
drain
release
```

devono restare negli owner.

---

# 38. Aspetti da preservare

```text
1. Scopo di orientamento chiaro
2. Gerarchia owner esplicita
3. Root wrapper corretti
4. Backend/frontend/launcher separati
5. Porte dichiarate preferite
6. No kill-by-port
7. Owned vs reused concettualmente distinti
8. Chrome/CDP non owned
9. Writer authority distinta dal launcher lock
10. Process registry distinto
11. High-level data flow corretto
12. Backend route areas corrette
13. Strategy indicata deprecata
14. Storage canonical vs sidecar distinto
15. pending_commits non cache
16. writer_authority non cache
17. Frontend senza filesystem/recovery
18. Runtime/sensitive data esclusi dal normale contesto
19. Cleanup utility non generica
20. Documentation checker indicati
21. Validation runner indicato
22. Validations separate dagli owner
23. Archive non canonico
24. Orientamento per tipo di task
25. Registri collegati senza farli diventare source of truth del codice
```

---

# 39. Modularizzazione

## Valutazione

Il documento contiene più sezioni ma una sola funzione:

```text
orientare una task nel repository
```

Le aree:

```text
root
runtime
backend
storage
Python
frontend
generated state
validation
docs
task orientation
```

sono tutte componenti naturali della stessa mappa.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
backend-map.md
frontend-map.md
launcher-map.md
storage-map.md
```

La repository map perderebbe la propria funzione trasversale.

Se un’area richiede dettagli, deve rimandare all’owner esistente.

---

# 40. Verification matrix proposta

## A. Root wrapper — launcher

Input:

```text
task startup launcher
```

Atteso:

```text
avvio.py
→ launcher/app.py
```

---

## B. Launcher lock

Input:

```text
task lock seconda invocazione
```

Atteso dopo correzione:

```text
launcher/session.py
```

deve essere individuabile direttamente dalla map.

---

## C. Manifest

Input:

```text
task manifest runtime
```

Atteso:

```text
launcher/session.py
```

non soltanto:

```text
launcher/services.py
```

---

## D. Process ownership

Input:

```text
task shutdown backend/frontend owned
```

Atteso:

```text
launcher/services.py
+ session/manifest context
+ operations/01-local-runtime.md
```

---

## E. Preferred ports

Verificare:

```text
9222
3001
3000
```

presentati come:

```text
preferred
```

non fixed/reserved.

---

## F. Backend bootstrap

Task:

```text
writer authority/recovery startup
```

Atteso:

```text
backend/src/server.js
runtime/matchHistoryWriterAuthority.js
storage owners
```

---

## G. Match API

Task:

```text
tracking/stop/history/json
```

Atteso:

```text
routes/match.js
routes/match/
api/01-match.md
```

---

## H. Betfair API

Task:

```text
latest/login/log
```

Atteso:

```text
routes/betfair.js
routes/betfair/
api/02-betfair.md
```

Non promuovere automaticamente `/odds` come surface nuova da estendere.

---

## I. Evidence API

Task:

```text
latest
```

Atteso:

```text
Evidence read path
```

Task:

```text
manual confirmation
```

Atteso:

```text
Evidence route
+ Source Identity owner
```

---

## J. Persistence

Task:

```text
partial persistence/recovery
```

Atteso:

```text
writer authority
facade
journal
recovery
integrity
storage tests
```

---

## K. Source Identity local store

Task:

```text
backup confirmation state
```

Atteso dopo `REPO-MAP-002`:

```text
backend/source_identity_confirmations.json
```

classificato correttamente.

---

## L. Cleanup

Task:

```text
pulizia runtime cache
```

Atteso:

```text
scripts/cleanup_runtime_cache.py
operations/05-retention-and-cleanup.md
```

e:

```text
source_identity_confirmations.json
→ escluso
```

---

## M. Frontend polling

Task:

```text
late responses / polling
```

Atteso:

```text
specific hook
consumer
frontend owner
```

non intero frontend.

---

## N. Validation runner

Task:

```text
eseguire profilo offline
```

Atteso:

```text
scripts/validation/run.mjs
test-manifest.json
validation README
```

---

## O. Test coverage matrix

Task:

```text
quale test copre quale modulo?
```

Atteso:

```text
IMPL-003
→ matrice test ↔ modulo ↔ documento
```

non:

```text
repository map
```

---

## P. Test pass count

Task:

```text
ultimo esito test
```

Atteso:

```text
validation artifact/current state/ledger
```

non repository map.

---

## Q. Historical validation

Task:

```text
cosa è stato osservato live il 4 luglio?
```

Atteso:

```text
docs/validations/
```

non owner corrente.

---

## R. AI context safety

Task:

```text
prepara contesto per Source Identity
```

Atteso:

```text
non includere automaticamente:
match_history
confirmation store
cache
dump
profiles
.env
launcher runtime
```

---

# 41. Priorità delle modifiche

```text
1. REPO-MAP-001
   → aggiungere launcher/session.py
   → HIGH

2. REPO-MAP-002
   → aggiungere source_identity_confirmations.json
   → HIGH

3. REPO-MAP-003
   → correggere semantica IMPL-003
   → MEDIUM

4. DOC-002 / DOC-006
   → rimuovere test counts e validation status
   → MEDIUM

5. DOC-002 / DOC-006
   → ridurre lifecycle storage/shutdown duplicato
   → MEDIUM
```

Non serve una task di refactor codice per i primi tre punti.

Sono principalmente correzioni di orientamento/documentazione.

---

# 42. Matrice area → stato

| Area | File principali | Stato della mappa | Gap | Azione |
| --- | --- | --- | --- | --- |
| Root launcher | `avvio.py`, `launcher/app.py` | coerente | `session.py` omesso | correggere |
| Launcher session | `launcher/session.py` | incompleto | owner non mostrato | `REPO-MAP-001` |
| Launcher services | `launcher/services.py` | coerente | nessuno nuovo | preservare |
| Porte | `launcher/config.py`, `services.py` | coerente | nessuno | preservare |
| Backend bootstrap | `backend/src/server.js` | coerente ma dettagliato | duplicazione owner | `DOC-006` |
| Match API | `routes/match.js` | coerente | nessuno | preservare |
| Betfair API | `routes/betfair.js` | coerente | nessuno nuovo | preservare |
| Evidence API | `routes/evidence.js` | coerente | nessuno | preservare |
| Preflight | `routes/test.js` | coerente | nessuno | preservare |
| Storage | matchHistory/journal/authority | coerente ma dettagliato | duplicazione | `DOC-006` |
| Frontend | `App.jsx`, hooks, utils | coerente | nessuno nuovo | preservare |
| Confirmation store | `sourceIdentityConfirmationStore.js` | mancante | persisted local state assente | `REPO-MAP-002` |
| Generated data | `.gitignore` + runbooks | quasi coerente | confirmation store | correggere |
| Validation runner | `scripts/validation/` | coerente | naming IMPL-003 | `REPO-MAP-003` |
| Validation outcomes | test artifacts/current state | troppo presenti | pass counts in map | `DOC-002/006` |
| Documentation hierarchy | index/validations/archive | coerente | nessuno | preservare |

---

# 43. Cosa NON deve essere fatto durante la futura modifica

```text
NON:
- trasformare la map in inventario completo del repository
- copiare tutte le route HTTP
- copiare tutti i test
- copiare tutti i field del manifest
- copiare il lock algorithm
- copiare journal recovery details
- copiare Source Identity schema
- creare una seconda test matrix manuale
- creare una seconda repository map per IMPL-003
- duplicare current-state validation counts
- inserire valori sensibili o path personali
- modificare codice per correggere un puro gap di orientamento
```

---

# 44. Cosa deve restare il criterio di successo

La repository map è corretta quando, dato un problema, consente di rispondere rapidamente:

```text
qual è l’entrypoint?
qual è l’area?
qual è il file owner implementation?
qual è il documento owner?
quali dati runtime devo evitare?
quale test/runner è vicino?
```

Non deve rispondere completamente a:

```text
come funziona ogni algoritmo?
quali payload esatti restituisce ogni API?
quali test sono passati oggi?
come funziona l’intero shutdown?
come funziona tutto il journal?
```

Quelle risposte appartengono agli owner.

---

# 45. Decisione finale

```text
01-repository-map.md:

DOCUMENTO COMPLESSIVAMENTE VALIDO
COME MAPPA DI ORIENTAMENTO.

NON RISCRIVERE COMPLETAMENTE.

NON MODULARIZZARE.

CORREGGERE IN MODO MIRATO.

Punti forti:
- root entrypoint corretti
- wrapper reali e sottili
- porte preferite corrette
- fallback/reuse/no-kill-by-port corretti
- Chrome/CDP non owned correttamente
- writer authority distinta dal launcher
- backend area map coerente
- route families coerenti
- storage canonical/sidecar distinto
- frontend orientation utile
- validation runner individuato
- gerarchia docs/validations/archive corretta
- task-orientation table utile
- registri separati dal codice

Nuovi gap:
REPO-MAP-001
→ launcher/session.py assente dalla superficie launcher

REPO-MAP-002
→ backend/source_identity_confirmations.json
   assente dalla classificazione dei dati locali

REPO-MAP-003
→ IMPL-003 descritta come “mappa completa”
   invece di matrice test ↔ modulo ↔ documento

Finding esistenti ancora rilevanti:
DOC-002
→ repository map ancora leggermente troppo vicina
   a stato/lifecycle

DOC-006
→ alcuni contratti dettagliati sono ancora duplicati

Non sono nuovi finding:
- exact writer authority release condition
- secondo backend prima di recovery
- test count 26/10/30
- collaudo manuale non eseguito

Questi sono residui di ownership documentale già coperti.

Riscrittura completa: NO
Revisione mirata: SÌ
Modularizzazione: NO
Nuovi file canonici: nessuno
Priorità: MEDIO-ALTA
```

---

# 46. Riferimenti per il futuro aggiornamento dei file

```text
Report ID:
TDUI-DOC-REPORT-037

Documento:
docs/tennis-decision-ui/reference/01-repository-map.md

Nuovi Change ID:
REPO-MAP-001
REPO-MAP-002
REPO-MAP-003

Finding esistenti richiamati:
DOC-002
DOC-006

Suddivisione richiesta:
no

Nuovi file canonici:
nessuno
```

Quando verranno forniti dall’utente i file cumulativi da aggiornare, il report dovrà essere integrato rispettando la struttura già usata in quei file, senza ricostruirla per supposizione.

---

# 47. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 37
Da analizzare: 35
Avanzamento: 51,39%
```

Blocco corrente:

```text
[✓] 033 operations/02-live-tracking-control.md
[✓] 034 operations/03-betfair-diagnostics.md
[✓] 035 operations/04-validation-and-rollback.md
[✓] 036 operations/05-retention-and-cleanup.md
[✓] 037 reference/01-repository-map.md
```

Il blocco 033–037 è quindi **analiticamente completato**.

Per istruzione dell’utente:

```text
NON eseguire ora il checkpoint cumulativo.
NON aggiornare mappa/JSON.
NON procedere al report successivo.

Fermarsi dopo la consegna del presente report
e attendere i file forniti dall’utente.
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `REPO-MAP-001…003`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
