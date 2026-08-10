# Report documentale — `implementazioni/implementazioni-proposte/02-runtime-betfair.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-065
Sequenza audit: 65/72
Documento analizzato: implementazioni/implementazioni-proposte/02-runtime-betfair.md
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
HEAD verificato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 24d12a120382fbf32cb6d0c653860aebf69ee83e
Dimensione documento: 251 righe
Perimetro dichiarato: IMPL-016…018
Tipo: registro owner — runtime Betfair e acquisition provenance
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md

backend/src/sofa/betfairFetch.js
backend/src/sofa/betfair/scraperLifecycle.js
backend/src/sofa/betfair/scraperLifecycle/runner.js

backend/src/routes/betfair.js
backend/src/routes/betfair/loginWindowLifecycle.js

backend/src/server.js

backend/src/sofa/betfair/processor.js
backend/src/sofa/betfair/processor/persistence.js
```

Sono stati inoltre coordinati, senza duplicarli:

```text
IMPL-002
IMPL-006
IMPL-012
IMPL-013
IMPL-014

RUNTIME-*
BETFAIR-SCRAPER-*
BETFAIR-DIAG-*
SECURITY-*
PYTHON-*
TEST-012
TEST-016
TEST-017

AUDIT-CODE-P23-001
AUDIT-CODE-P23-002
IMPL-BASE-001
IMPL-BASE-002
```

GitHub non è stato modificato.

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 066: NON analizzato
```

---

# 1. Esito sintetico

```text
IMPL-016:
APPROVATA
PRIORITÀ CRITICA
IMPLEMENTAZIONE COMPLETA ASSENTE

IMPL-017:
APPROVATA
PRIORITÀ CRITICA
IMPLEMENTAZIONE COMPLETA ASSENTE

IMPL-018:
APPROVATA
PRIORITÀ ALTA
IMPLEMENTAZIONE COMPLETA ASSENTE

Todo ↔ owner state:
COERENTE

False completion:
NESSUNA

Overclaim implementation:
NESSUNO

Primitive runtime già presenti:
SÌ

Arbitro globale Betfair:
ASSENTE

Control-plane boundary locale:
ASSENTE

Acquisition envelope completo:
ASSENTE

TEST-012:
MANCANTE

TEST-016:
MANCANTE

TEST-017:
MANCANTE

Nuovi bug runtime:
0

Nuovi finding owner/documentazione:
1

Nuove task:
1

Split:
NON necessario
```

Conclusione:

```text
IL MODULO 065 È
SOSTANZIALMENTE SOLIDO.

LE TRE IMPL
SONO ANCORA REALMENTE APERTE
E IL FILE NON LE PRESENTA
COME IMPLEMENTATE.

IL CODICE CORRENTE
HA GIÀ PRIMITIVE UTILI,
MA NON SODDISFA
I TRE CONTRATTI COMPLETI.

L'UNICO PROBLEMA
È IL GRAFO DELLE DIPENDENZE:

IMPL-017
→ elenca IMPL-002
  come "Dipendenza"
  anche se IMPL-002
  è soltanto consigliata;

IMPL-018
→ elenca IMPL-012 e IMPL-013
  come "Dipendenze"

MA NELLO STESSO CONTRATTO:

IMPL-012
→ deve usare fixture
  con skew/dati mancanti

IMPL-013
→ deve misurare
  durata per fase
  e acquired→recorded

E LA TODO
METTE IMPL-018
IN PRIORITÀ ALTA.

SERVE QUINDI
DISTINGUERE:

hard prerequisite
supporting tool
consumer/test dependency
follow-up dependency.

NESSUN NUOVO
BUG BETFAIR.
NESSUNO SPLIT.
```

---

# 2. Perimetro

Il file dichiara:

```text
IMPL-016…018
```

ed effettivamente contiene:

```text
IMPL-016
Betfair runtime command authority

IMPL-017
Local control-plane boundary

IMPL-018
Betfair acquisition envelope e provenance
```

Range corretto.

---

# 3. Dimensione e coesione

Dimensione:

```text
251 righe
```

I tre owner condividono
lo stesso dominio:

```text
Betfair runtime
→ ownership
→ local control plane
→ acquisition provenance.
```

Il modulo è coerente.

---

# 4. IMPL-016 — stato

Owner:

```text
Classificazione:
NECESSARIA

Stato:
CONFERMATA E APPROVATA

Priorità:
critica
```

Todo:

```text
APPROVATA
PRIORITÀ CRITICA.
```

Coerente.

---

# 5. Problema IMPL-016

Il file identifica
autorità separate:

```text
login lifecycle
scraper lifecycle
trackingSessionId futura
```

e l’assenza
di un arbitro globale.

Current code
conferma questa struttura.

---

# 6. Scraper lifecycle corrente

Current:

```text
createScraperLifecycle()
```

possiede internamente:

```text
activeScrapers = new Map()
```

indicizzata dalla:

```text
scraper key.
```

---

# 7. Riuso scraper corrente

Se esiste:

```text
activeScrapers.get(key)
```

e runtime identity coincide:

```text
return active.promise.
```

Quindi il riuso
è ancora locale
alla stessa scraper key.

---

# 8. Conflitto scraper corrente

Il lifecycle
può rilevare:

```text
scraper_runtime_conflict
```

quando per la stessa key
la runtime identity
è incompatibile.

Questa è una primitive utile.

---

# 9. Ma non è command authority globale

Non esiste
nella struttura verificata:

```text
betfairCommandId
kind
state
trackingSessionId
owner
canonicalMarketIdentity
```

come authority globale.

---

# 10. Login lifecycle è separato

`loginWindowLifecycle.js`
mantiene:

```text
let active = null
```

separatamente
da `activeScrapers`.

---

# 11. Login lifecycle possiede la propria runtime identity

Il login:

```text
sameLoginRuntimeIdentity(...)
```

può riusare
la stessa finestra
o generare:

```text
login_runtime_conflict.
```

Anche questa è
una primitive locale.

---

# 12. Login e tracking non condividono un unico owner

Il login lifecycle
non consulta:

```text
activeScrapers
```

e lo scraper lifecycle
non consulta:

```text
active login command.
```

La root issue
di IMPL-016
resta quindi reale.

---

# 13. IMPL-016 non è risolta da pythonProcessRegistry

Il process registry
può possedere:

```text
ruoli
generation
execution identity
cleanup.
```

Ma:

```text
process ownership
≠
Betfair command authority.
```

---

# 14. IMPL-016 — TEST-012

Il file richiede:

```text
TEST-012
```

più casi di:

```text
tracking vs login
tracking vs diagnostics
handoff
stale release
runtime unknown.
```

Todo corrente:

```text
TEST-012
→ MANCANTE.
```

Coerente.

---

# 15. Nessuna false closure IMPL-016

Current state:

```text
primitive lifecycle presenti
global command authority assente.
```

Owner corretto.

---

# 16. IMPL-017 — stato

Owner:

```text
NECESSARIA
CONFERMATA E APPROVATA
PRIORITÀ CRITICA.
```

Todo:

```text
APPROVATA
PRIORITÀ CRITICA.
```

Coerente.

---

# 17. IMPL-017 — problema corrente

Il file afferma:

```text
route mutanti/diagnostiche
CORS aperto
bind loopback non esplicito.
```

Current code
conferma entrambi
i problemi centrali.

---

# 18. CORS corrente

`createApp()` usa:

```text
app.use(cors())
```

senza:

```text
origin allow-list
host policy
control/data plane distinction.
```

Quindi il boundary
non è implementato.

---

# 19. Bind corrente

`startServer()`
risolve:

```text
port
```

e poi:

```text
listenFn(port, onReady)
```

senza host esplicito:

```text
127.0.0.1.
```

Quindi il contratto
di bind loopback
non è implementato.

---

# 20. Route mutanti — alcune primitive corrette

Per esempio:

```text
POST /api/betfair/login-window
```

è già POST.

Anche Start/Stop
sono route mutanti
separate dalle letture.

---

# 21. Ma questo non chiude IMPL-017

Mancano:

```text
bind loopback
Origin policy
Host validation
allowed frontend origin
porte runtime effettive
control-plane middleware.
```

---

# 22. IMPL-017 — niente overclaim

Il file
non dichiara
queste primitive
come contratto completo.

Stato corretto.

---

# 23. IMPL-018 — stato

Owner:

```text
NECESSARIA
CONFERMATA E APPROVATA
PRIORITÀ ALTA.
```

Todo:

```text
APPROVATA
PRIORITÀ ALTA.
```

Coerente.

---

# 24. IMPL-018 — problema

Il contratto vuole distinguere:

```text
dato acquisito
dato registrato
dato sintetico
Graph skew
scrape lento appena persistito.
```

La root issue
è ancora reale.

---

# 25. Processor corrente

`processBetfairResults(...)`
produce ancora:

```text
{
  ...raw,
  runners,
  network_capture,
  diagnostics,
  graph_diagnostics
}
```

Non costruisce
l’envelope completo
descritto da IMPL-018.

---

# 26. Campi envelope mancanti

Nel path verificato
non esiste un contratto unico
con:

```text
schemaVersion
scrapeId
trackingSessionId
commandId
startedAt
completedAt
marketApiAcquiredAt
graphAcquisitions[]
recordedAt
maxGraphSkewMs.
```

---

# 27. Persistence non crea quell’envelope

`persistBetfairProcessedResult`
lavora sul:

```text
processedResult
commitId
history document
timeline document.
```

Non aggiunge
l’acquisition envelope
richiesto dalla card.

---

# 28. IMPL-018 quindi resta aperta

La presenza di:

```text
graph_diagnostics
network_capture
runtime logs
recorded timeline ticks
```

non equivale
alla provenance temporale richiesta.

---

# 29. Provenance matched value

Il file stabilisce:

```text
matchedValueSource:
api_runner
graph_runner
unavailable
```

e vieta:

```text
market_total_divided_by_runner_count.
```

Questo è un requisito
ancora valido.

---

# 30. TEST-016/017

Todo:

```text
TEST-016
→ MANCANTE

TEST-017
→ MANCANTE.
```

Coerente con
lo stato aperto IMPL-018.

---

# 31. Stream API — correttamente futura

La sezione è esplicitamente:

```text
Estensione futura
```

Non presenta
streaming come current.

---

# 32. Nessun conflitto con policy attuale

Il progetto
non deve usare
Stream API ora.

La card
la conserva come futuro.

Corretto.

---

# 33. Attribuzione volume — bounded

Il file distingue:

```text
back_attributed
lay_attributed
ambiguous
```

e vieta
un punteggio non calibrato.

Questo è coerente
con la filosofia del progetto.

---

# 34. Nessun nuovo Money Flow finding

La sezione futura
non forza direzionalità
nel runtime corrente.

Non duplicare
i finding Money Flow.

---

# 35. Problema documentale trovato: dependency semantics

Le tre card usano:

```text
Dipendenze:
```

senza distinguere
tipi diversi di relazione.

Questo diventa problematico
in almeno due casi.

---

# 36. IMPL-017 ↔ IMPL-002

IMPL-017 dichiara:

```text
Dipendenze:
bootstrap backend
launcher
inventario endpoint IMPL-002.
```

Ma IMPL-002
nel registro base è:

```text
CONSIGLIATA.
```

---

# 37. Ambiguità IMPL-017

Se "Dipendenze"
significa:

```text
hard blocking prerequisite
```

allora una utility
soltanto consigliata
bloccherebbe una task
di sicurezza:

```text
CRITICA.
```

Questo grafo
non è coerente.

---

# 38. Interpretazione più probabile

IMPL-002 è utile come:

```text
supporting inventory
```

per classificare
tutte le route.

Ma il control-plane boundary
può essere progettato
anche da inventory manuale verificata.

---

# 39. Correzione consigliata IMPL-017

Separare:

```text
Hard prerequisites:
backend bootstrap
launcher/runtime port authority

Supporting tooling:
IMPL-002 endpoint inventory.
```

Oppure dichiarare esplicitamente
che IMPL-002
diventa prerequisite obbligatoria.

Non lasciare ambiguo.

---

# 40. IMPL-018 ↔ IMPL-012/013

IMPL-018 dichiara:

```text
Dipendenze:
processor Betfair
timeline canonica
health
IMPL-012
IMPL-013.
```

---

# 41. Ma la stessa card descrive relazioni downstream

Subito dopo:

```text
IMPL-012
→ fixture versionate
  con skew e dati mancanti

IMPL-013
→ durata per fase
  e ritardo acquired→recorded.
```

Queste formule
suonano come consumer
o validation dependencies
dell’envelope.

---

# 42. Priorità corrente rende l’ambiguità materiale

Todo:

```text
IMPL-018
→ PRIORITÀ ALTA.
```

Mentre:

```text
IMPL-012
→ necessaria prima backtesting

IMPL-013
→ necessaria prima ottimizzazione.
```

Se 012/013
sono hard prerequisites,
IMPL-018 non può partire
prima di strutture
che sembrano invece
consumare i suoi dati.

---

# 43. Possibile ciclo concettuale

Per esempio:

```text
IMPL-018
→ produce acquiredAt/skew

IMPL-012
→ deve creare fixture
  con acquiredAt/skew

IMPL-013
→ deve misurare
  acquired→recorded.
```

Quindi il grafo
potrebbe essere:

```text
018
→ 012/013 consumers
```

non:

```text
012/013
→ 018.
```

---

# 44. Non assumere unilateralmente il verso

Il report
non decide
la nuova architettura.

Segnala:

```text
dependency semantics
non sufficientemente definite.
```

Serve chiarire:

```text
hard prerequisite
test prerequisite
consumer dependency
follow-up.
```

---

# 45. IMPL-BETFAIR-001 — normalizzare il dependency graph

**Priorità:** HIGH  
**Tipo:** dependency metadata / implementation sequencing

## Problema

Le card IMPL-016…018
usano un unico campo:

```text
Dipendenze
```

per relazioni
di natura diversa.

Manifestazioni concrete:

```text
IMPL-017
→ IMPL-002
  consigliata
  ma indicata come dependency
  di task critica

IMPL-018
→ IMPL-012/013
  indicate come dependency

ma §Relazioni:
012 consuma skew
013 misura acquired→recorded
```

---

# 46. Azione IMPL-BETFAIR-001

Per ogni card
distinguere almeno:

```text
Hard prerequisites
Supporting tools
Validation/test dependencies
Downstream consumers
Future dependencies.
```

---

# 47. IMPL-016 dependency normalization

Current:

```text
IMPL-006
lifecycle Python
login-window
tracking Betfair.
```

Chiarire:

```text
IMPL-006
→ hard authority prerequisite
  o coordinated peer?

login/tracking lifecycle
→ implementation surfaces
  non "task dependency".
```

---

# 48. IMPL-017 dependency normalization

Current:

```text
bootstrap backend
launcher
IMPL-002.
```

Proposta da verificare:

```text
bootstrap/backend port authority
→ hard prerequisite

launcher runtime origin/port data
→ hard/supporting

IMPL-002
→ supporting inventory
  salvo decisione esplicita
  di renderla bloccante.
```

---

# 49. IMPL-018 dependency normalization

Current:

```text
processor
timeline
health
IMPL-012
IMPL-013.
```

Distinguere:

```text
processor/timeline
→ implementation surfaces

health
→ consumer/degraded-state integration

IMPL-012
→ fixture/test consumer
  o prerequisite da motivare

IMPL-013
→ measurement consumer
  o prerequisite da motivare.
```

---

# 50. Acceptance criteria — IMPL-BETFAIR-001

```text
[ ] IMPL-016 dependency types espliciti
[ ] IMPL-017 hard dependencies separate
[ ] IMPL-002 non implicitamente bloccante
    salvo decisione esplicita
[ ] IMPL-018 hard dependencies separate
[ ] IMPL-012 relation direction esplicita
[ ] IMPL-013 relation direction esplicita
[ ] nessun ciclo implicito
[ ] Todo priority order non contraddetto
[ ] nessun owner rinumerato
[ ] nessuna task tecnica nuova inventata
[ ] future Stream API resta future
[ ] TEST-012/016/017 restano mancanti
```

---

# 51. Non modificare lo stato delle IMPL

Questa task
non deve cambiare:

```text
IMPL-016
→ approved critical

IMPL-017
→ approved critical

IMPL-018
→ approved high.
```

---

# 52. Non implementare le IMPL durante il cleanup metadata

IMPL-BETFAIR-001
è una correzione
del task graph.

Non deve:

```text
aggiungere command authority
cambiare CORS
cambiare bind
aggiungere envelope.
```

---

# 53. Non duplicare AUDIT-CODE-P23-001

Quel finding
possiede:

```text
historical/current
nel report audit-codice Punto 2/3
e priority metadata drift frontend.
```

Questo finding possiede:

```text
dependency graph
del registry IMPL-016…018.
```

Confine diverso.

---

# 54. Non duplicare IMPL-BASE-001

IMPL-BASE-001
possiede:

```text
temporal authority
del modulo IMPL-001…015.
```

Il 065
non presenta
lo stesso problema temporale.

---

# 55. Nessuna temporal authority issue generale nel 065

Tutte le tre card:

```text
016
017
018
```

sono presentate
come approvate ma non completate.

Questo coincide
con il current project state.

---

# 56. Nessun owner status drift

Todo e card:

```text
016 critical approved
017 critical approved
018 high approved
```

sono coerenti.

---

# 57. Nessun test status drift

Todo:

```text
TEST-012 missing
TEST-016 missing
TEST-017 missing.
```

Il file li presenta
come test minimi futuri.

Coerente.

---

# 58. Nessuna falsa evidence live

Il documento
non dichiara:

```text
collaudi live passati.
```

Nessun problema.

---

# 59. Nessuna falsa Stream API implementation

La sezione
è esplicitamente futura.

Nessun problema.

---

# 60. Modularizzazione — valutazione

Dimensione:

```text
251 righe.
```

Responsabilità:

```text
runtime command authority
control-plane boundary
acquisition provenance.
```

Sono tre owner
ma un unico dominio
Betfair runtime/acquisition.

---

# 61. Perché non serve split

Per implementare
uno dei tre owner
serve comunque capire:

```text
runtime ownership
route boundary
acquisition identity.
```

La separazione
in micro-file
non ridurrebbe
significativamente il contesto.

---

# 62. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 63. Aspetti corretti da preservare

```text
1. IMPL-006 e IMPL-016 separate;
2. session authority ≠ command authority;
3. one mutating Betfair command;
4. market identity ≠ URL text;
5. logical invalidation before physical cleanup;
6. unknown fail-closed;
7. no kill-by-port;
8. loopback-only target;
9. CORS wildcard forbidden for control plane;
10. Origin absent explicitly handled;
11. no mutation via GET;
12. alternative launcher ports supported;
13. acquiredAt ≠ recordedAt;
14. Graph skew explicit;
15. synthetic runner volume forbidden;
16. Stream API future;
17. traded increase ≠ price movement;
18. volume attribution may remain ambiguous;
19. no uncalibrated score;
20. TEST-012/016/017 explicit.
```

---

# 64. Current evidence — IMPL-016

```text
login lifecycle:
separate active state

scraper lifecycle:
activeScrapers by key

global command owner:
absent.
```

Owner valid.

---

# 65. Current evidence — IMPL-017

```text
cors()
→ unrestricted default

listen(port)
→ no explicit 127.0.0.1 host

control-plane middleware:
absent.
```

Owner valid.

---

# 66. Current evidence — IMPL-018

```text
processor:
raw result + diagnostics

canonical acquisition envelope:
absent

per-runner acquisition time:
not represented by the contract requested

maxGraphSkewMs:
not represented by the contract requested.
```

Owner valid.

---

# 67. Risk if dependency metadata remains ambiguous

Executor could:

```text
block IMPL-017
waiting for optional IMPL-002

or

start IMPL-012/013
before defining acquisition envelope

or

create a circular implementation plan.
```

Questo è il motivo
per cui il finding
è HIGH
anche se documentale.

---

# 68. Verification after metadata correction

Comandi sufficienti:

```text
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
node scripts/validation/run.mjs fast
git diff --check
```

Non serve:

```text
Betfair live
Chrome
login
tracking
network capture.
```

---

# 69. Nuovi finding

```text
IMPL-BETFAIR-001
```

---

# 70. Nuove task runtime

```text
0
```

---

# 71. Nuove task documentali/registry

```text
1
```

---

# 72. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

---

# 73. Decisione finale

```text
implementazioni/implementazioni-proposte/02-runtime-betfair.md:

ROLE:
OWNER REGISTRY SOLIDO

PERIMETRO:
IMPL-016…018

DIMENSIONE:
251 RIGHE

IMPL-016:
OPEN
APPROVATA
CRITICA

IMPL-017:
OPEN
APPROVATA
CRITICA

IMPL-018:
OPEN
APPROVATA
ALTA

STATE DRIFT:
NO

FALSE COMPLETION:
NO

NEW RUNTIME BUG:
NO

PROBLEMA:
DEPENDENCY GRAPH AMBIGUO

CHANGE ID:
IMPL-BETFAIR-001

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ

MODULARIZZAZIONE:
NO
```

---

# 74. Stato audit dopo report 065

```text
Documenti Markdown totali: 72
Analizzati: 65
Da analizzare: 7
Avanzamento: 90,28%
```

Sequenza:

```text
[✓] 063 implementazioni/audit-documentazione/04-processo-e-materiali-storici.md
[✓] 064 implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
[✓] 065 implementazioni/implementazioni-proposte/02-runtime-betfair.md
[ ] 066 implementazioni/implementazioni-proposte/03-storage-recovery.md
```

---

# 75. Contatori task

Ultimo consolidamento:

```text
report 062
→ 338 task note
```

Dopo:

```text
063 → +1
064 → +2
065 → +1
```

Totale provvisorio:

```text
342
```

Non ancora consolidate:

```text
DOC-AUDIT-PROC-001
IMPL-BASE-001
IMPL-BASE-002
IMPL-BETFAIR-001
```

---

# 76. Stato mappa / JSON

```text
mappa-file-markdown-repository-continuazione-048.md
→ NON MODIFICATA

modifiche-audit-markdown-continuazione-048.json
→ NON MODIFICATO
```

---

# 77. Prossimo documento — non analizzato

```text
066
implementazioni/implementazioni-proposte/03-storage-recovery.md
```

---

# 78. Stop operativo

```text
report 065:
COMPLETATO

nuovo Change ID:
IMPL-BETFAIR-001

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 066:
NON ANALIZZATO
```
