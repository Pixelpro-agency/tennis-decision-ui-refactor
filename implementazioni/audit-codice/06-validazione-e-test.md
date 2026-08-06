> **Parte 6 di 7 — Validazione e test**
> Secondo audit — Punto 7: runner, manifest, fixture, sandbox, harness frontend, result ledger e TEST-060…075.
> [Indice](../03-audit-codice.md) · [Parte 5](05-frontend-session-shell.md) · [Parte 7](07-post-audit-e-migrazione.md)

<!-- AUDIT-CODE-ORIGINAL-START source-lines=5358-6278 sha256=b41438bf84c85c4b90fa2502ea86e70d298357404bcb4c83b3f99f3d4459b144 -->
## 22. Secondo audit del codice — Punto 7: Test e strutture mancanti

**Baseline:** `275008a5cd6451f24c6895068639ee3055395986`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

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

docs/tennis-decision-ui/operations/04-validation-and-rollback.mdx

implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/06-implementazioni-proposte.md
implementazioni/99-decisioni-utente.md
```

Sono stati inoltre controllati sul commit corrente:

```txt
status check GitHub associati
workflow run associati
coerenza del diff del Punto 6
```

Esito:

```txt
nessun status check associato al commit
nessun workflow run associato al commit
suite non eseguite durante l’audit
```

L’assenza di status check non viene interpretata come failure del codice. Indica soltanto che la repository non possiede ancora una validazione automatica collegata al commit.

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

Il progetto possiede numerosi test utili, ma non possiede ancora un sistema unitario di validazione.

Esistono:

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

Mancano:

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

Non è quindi possibile dichiarare una percentuale di coverage attendibile o una suite completa passata allo SHA corrente.

### Parti solide — nessuna azione distruttiva necessaria

#### Test puri Node

Molti moduli sono già costruiti con:

```txt
node:assert/strict
dependency injection
fake writer
fake timer
fake logger
factory locali
```

`server.test.mjs` verifica, fra l’altro:

- import senza `listen`;
- recovery prima dell’apertura del listener;
- recovery fatale;
- shutdown idempotente;
- health HTTP su porta dinamica;
- redazione degli eventi runtime.

Questi test devono essere registrati dal runner, non riscritti in massa.

#### Isolamento corretto già presente

Diversi test usano:

```txt
os.tmpdir / tempfile
mkdtemp
finally cleanup
server HTTP in-process
porta 0 o ricerca di porta libera
mock subprocess
ripristino delle variabili globali
```

Queste tecniche diventano convenzioni da riutilizzare.

#### Python standard library

I moduli Python puri sono già verificabili con `unittest`.

Non è necessario migrare obbligatoriamente a pytest.

#### Collaudi live separati

Il runbook distingue già:

```txt
test automatico
build/check
smoke HTTP
verifica browser
collaudo live
```

La distinzione è corretta e deve restare esplicita.

Un collaudo storico non diventa automaticamente un PASS corrente.

### WORKFLOW-004 — I registri possono divergere durante gli aggiornamenti

**Classificazione:** `BUG DOCUMENTALE CONFERMATO`
**Stato:** `COMPLETATO`
**Priorità:** alta per l’affidabilità del registro

Dopo il Punto 6, i contenuti dettagliati erano presenti, ma nella Todo erano rimasti:

```txt
SHA corrente verificato del Punto 4
range IMPL-001…024
```

mentre erano già stati approvati e inseriti:

```txt
baseline Punto 6
IMPL-025…027
```

Questo non ha modificato il codice, ma dimostra che l’aggiornamento manuale dei cinque registri può lasciare intestazioni sintetiche incoerenti.

#### Decisione approvata

Estendere `IMPL-005` per controllare:

```txt
SHA baseline dei cinque registri
ultimo Punto completato
ultimo TEST-ID
ultimo IMPL-ID
ultima DEC
range sintetici
prossimo punto
stati incompatibili
```

Il controllo resta read-only e non modifica automaticamente i documenti.

Le due incoerenze sono corrette nel checkpoint del Punto 7. `IMPL-005` è stata implementata, la baseline è stata eseguita e i 29 owner duplicati sono stati normalizzati con esito finale verde.

### TEST-003 — Runner, manifest e comando test canonico; inventario completo ancora aperto

**Classificazione:** `STRUTTURA INIZIALMENTE ASSENTE; PRIMA VERSIONE IMPLEMENTATA`
**Stato:** `RUNNER, MANIFEST E COMANDO CANONICO IMPLEMENTATI E VALIDATI LOCALMENTE; INVENTARIO COMPLETO TEST ↔ OWNER ↔ DOCUMENTO ANCORA APERTO SOTTO IMPL-003`
**Priorità:** media-alta per il completamento dell’inventario

> La descrizione seguente conserva il finding storico del Punto 7. Lo stato
> corrente è quello indicato sopra e nell’addendum di `IMPL-028`: il runner,
> il manifest e i cinque profili offline esistono e sono stati validati; resta
> aperta la mappa completa test ↔ owner ↔ documento.

Al checkpoint originario, `backend/package.json` e `frontend/package.json` non esponevano uno script `test`.

Non esiste un package root che coordini:

- backend Node;
- frontend Node/build;
- launcher Python;
- scraper Python;
- test persistence;
- validazioni documentali.

I test Node usano mini-runner differenti:

```txt
funzione test custom
runTest custom
contatori passed/failed
process.exitCode
throw finale
console.log
```

Il runbook mantiene manualmente elenchi molto lunghi di file.

#### Impatto

- un test presente può non essere eseguito;
- una rinomina può lasciare un comando obsoleto;
- non esistono timeout uniformi;
- non esiste output JSON comune;
- non è possibile distinguere automaticamente suite minima, estesa, benchmark e live;
- un test che modifica global state può contaminare un altro se aggregato ingenuamente nello stesso processo.

#### Decisione approvata

Creare `IMPL-028`.

La prima versione del runner esegue ogni test legacy come child process separato, senza richiederne la riscrittura preventiva.

### Ampliamento collegato a CODE-005 — Comando lint pubblicato ma non eseguibile

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** media

`frontend/package.json` espone:

```txt
npm run lint
```

Il runbook ordina esplicitamente di non eseguirlo perché manca una configurazione ESLint utilizzabile.

Nei percorsi standard controllati non risultano configurazioni ESLint frontend.

#### Decisione approvata

Non rendere immediatamente il full lint un gate obbligatorio.

Sequenza:

```txt
configurazione minima realmente eseguibile
→ fotografia degli errori esistenti
→ lint mirato sui file modificati
→ full lint soltanto dopo baseline pulita
```

Se non si intende configurarlo nella fase corrente, lo script viene rimosso dalla superficie ufficiale anziché lasciato apparentemente supportato.

### Discovery Python non uniforme

**Classificazione:** `BUG DELLA DISCOVERY`
**Stato:** `CORREZIONE APPROVATA`

Diversi test Python seguono il formato:

```txt
graph_url_test.py
diagnostic_redaction_test.py
cdp_url_test.py
```

La discovery standard di `unittest` cerca normalmente file `test*.py`.

Il runner iniziale deve quindi enumerare esplicitamente i moduli correnti.

La standardizzazione a `test_*.py` può avvenire gradualmente quando i file vengono modificati per altri motivi.

Nessuna rinomina massiva è richiesta come prerequisito.

### Isolamento filesystem non uniforme

**Classificazione:** `BUG CONFERMATO IN ALMENO UN TEST`
**Stato:** `CORREZIONE APPROVATA`

`commitId.test.mjs` costruisce una directory sotto:

```txt
process.cwd()/virtual-commit-id-journal/
```

senza cleanup finale.

La directory è esclusa da Git, ma questo nasconde l’accumulo invece di garantire isolamento.

#### Regola approvata

Ogni test che scrive usa:

```txt
fs.mkdtemp(os.tmpdir())
oppure
sandbox assegnata dal runner
```

con cleanup obbligatorio su successo e failure.

Nessun test offline può usare:

```txt
backend/match_history
backend/source_identity_confirmations.json
cache runtime
journal runtime
profili Chrome
dump diagnostici reali
```

### Test route non sempre end-to-end HTTP

**Classificazione:** `LIMITE NOTO`
**Stato:** `MIGLIORIA APPROVATA`

Alcuni test estraggono direttamente gli handler da:

```txt
router.stack
route.stack
handler.handle
```

Questi test verificano bene il mapping locale, ma non coprono:

- mount path reale;
- middleware;
- parsing Express;
- content type;
- serializzazione HTTP;
- comportamento asincrono dell’app completa.

#### Decisione approvata

Preservare i test diretti come unit test.

Per le route critiche aggiungere un harness HTTP reale:

```txt
createApp
→ listen(0)
→ fetch 127.0.0.1
→ assert status/body/header
→ close
```

### Copertura reale non misurabile

**Classificazione:** `LIMITE NOTO E STRUTTURA ASSENTE`
**Stato:** `CONFERMATO`

Non esistono:

```txt
raccolta coverage
comando canonico
elenco completo dei test eseguiti
ultimo esito associato allo SHA
distinzione automatica test presente / test passato
```

I TEST-ID registrati rappresentano obblighi di verifica.

Non implicano automaticamente che il relativo test:

```txt
esista
sia stato eseguito
sia passato
sia stato osservato live
```

#### Stati approvati

```txt
planned
implemented
executed
passed
failed
blocked
live_observed
not_applicable
```

Esempio:

```txt
TEST-048
→ planned
→ non ancora implemented
→ non executed

server.test.mjs / T02
→ implemented
→ ultimo esito corrente non noto in questo audit
```

Nessuna percentuale di coverage viene inserita nei registri senza uno strumento che la produca.

### Frontend interaction harness assente

**Classificazione:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Stato:** `IMPL-030 APPROVATA`
**Priorità:** critica per le correzioni del Punto 6

Il frontend dispone di Vite, React e script Node puri, ma non dispone di:

```txt
Vitest
jsdom
React Testing Library
hook renderer
fake timer frontend
DOM assertions
```

I test correnti di hook verificano utility esportate e normalizzazioni, non montano realmente gli hook.

Senza un harness di interazione non è possibile coprire adeguatamente:

- StrictMode;
- AbortController;
- cambio sessione;
- Stop e snapshot frozen;
- response tardive;
- modali;
- indicatori;
- responsive smoke.

### Fixture non catalogate

**Classificazione:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Stato:** `IMPL-029 APPROVATA`
**Priorità:** alta

Le fixture sono prevalentemente inline e specifiche del file.

Questo è corretto per factory piccole, ma i contratti condivisi possono divergere fra test.

#### Struttura approvata

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

Ogni fixture persistita dichiara:

```txt
fixtureId
schemaVersion
kind
origin: constructed | sanitized_capture
redactionStatus
expectedInvariants
```

Non sono ammessi:

- cookie;
- token;
- profili;
- path locali;
- dump completi;
- dati personali non necessari.

Le factory piccole e locali restano accanto al test quando non rappresentano un contratto condiviso.

### Result artifact machine-readable assente

**Classificazione:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Stato:** `IMPL-031 APPROVATA`
**Priorità:** alta

Gli script stampano output umano, ma non producono un risultato uniforme associato allo SHA.

#### Contratto approvato

```txt
test-results/
└── <timestamp>-<sha>-<profile>.json
```

Campi minimi:

```txt
schemaVersion
repositorySha
profile
startedAt
durationMs
environment
commands
passed
failed
skipped
warnings
limits
perTestResults
buildResult
browserValidationStatus
workingTreeStatus
```

L’artefatto non contiene:

- stdout illimitato;
- URL operative;
- stack con segreti;
- path sensibili;
- payload reali.

Il result JSON non sostituisce il report umano dell’esecutore né `fileModificati.md`.

### Test map eseguibile

**Classificazione:** `MIGLIORIA NECESSARIA`
**Stato:** `ESTENSIONE IMPL-003 APPROVATA`

La matrice test ↔ modulo ↔ documento deve essere alimentata dal manifest.

Campi minimi:

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

Il controllo rileva:

- TEST-ID documentato ma assente dal manifest;
- path mancante;
- TEST-ID duplicato;
- test senza owner;
- PASS senza result artifact;
- path documentali obsoleti.

### Baseline e osservabilità

**Classificazione:** `MIGLIORIA NECESSARIA`
**Stato:** `ESTENSIONE IMPL-013 APPROVATA`

Le baseline non sono normali unit test.

Non devono fallire per una singola oscillazione di pochi millisecondi.

Ogni benchmark registra:

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

Aree previste:

```txt
history/timeline size
journal bytes
stringify
write
rename
recovery
acquired→recorded delay
source skew
pipeline delay
build frontend
durata suite
```

Le misurazioni usano fixture controllate e non una partita live dell’utente.

### DOC-031 — Runbook Validation monolitico e non verificabile

**Classificazione:** `DOCUMENTAZIONE DA RIFATTORIZZARE`
**Stato:** `CORREZIONE APPROVATA`

Il runbook contiene procedure utili, ma:

- copia numerosi comandi;
- mescola suite, smoke, live e storico;
- non può verificare che i path esistano;
- può diventare obsoleto dopo rinomine;
- non produce un risultato associato allo SHA.

Durante il controllo alcuni path documentati non risultano presenti nella posizione indicata.

Questo non dimostra che non esista una copertura equivalente altrove. Dimostra che il runbook non può essere l’inventario eseguibile canonico.

#### Correzione

Il documento conserva:

```txt
profili
criteri
interpretazione dei risultati
live/manuale
rollback
```

L’elenco eseguibile vive nel manifest di `IMPL-028`.

### DOC-032 — Semantica dello stato test assente

**Classificazione:** `DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`

Formalizzare:

```txt
file presente
≠ test eseguito

test eseguito in passato
≠ PASS corrente

build verde
≠ UI verificata

collaudo live storico
≠ scenario riprodotto sullo SHA corrente
```

### CI

**Classificazione:** `MIGLIORIA FUTURA, NON PRIMA STRUTTURA`
**Stato:** `RINVIATA DOPO IL RUNNER LOCALE`

Ordine approvato:

```txt
runner locale deterministico
→ manifest completo
→ suite offline verde
→ result artifact
→ eventuale CI
```

La CI iniziale, quando introdotta, può eseguire soltanto:

- test offline;
- build frontend;
- compile Python;
- controlli documentali.

Non può:

- avviare Chrome reale;
- effettuare login Betfair;
- usare credenziali;
- eseguire tracking live;
- modificare persistence reale.

Il runtime completo è Windows-oriented. Un job Linux può verificare moduli portabili, ma non sostituisce la validazione Windows.

### Strutture completamente assenti approvate

```txt
IMPL-028
→ manifest e runner canonico di validazione

IMPL-029
→ fixture catalog e sandbox condivisa

IMPL-030
→ frontend interaction test harness

IMPL-031
→ validation result ledger e artefatti JSON
```

### TEST-060…075 — Requisiti infrastrutturali individuati al checkpoint del Punto 7

#### TEST-060 — Manifest univoco

```txt
ogni comando previsto
→ una sola entry
```

#### TEST-061 — Path preflight

```txt
path inesistente
→ failure prima di avviare la suite
```

#### TEST-062 — Process isolation

```txt
ogni test legacy
→ child process separato
→ exit code normalizzato
```

#### TEST-063 — Timeout bounded

```txt
timeout superato
→ processo terminato
→ failure bounded nel report
```

#### TEST-064 — Discovery Python esplicita

```txt
moduli *_test.py correnti
→ inclusi nel manifest
```

#### TEST-065 — Cleanup sandbox

```txt
success/failure
→ sandbox rimossa
```

#### TEST-066 — Runtime directories protette

```txt
profilo offline
→ nessun accesso write alle directory runtime reali
```

#### TEST-067 — Fixture contract

```txt
schema + provenance + redaction
→ validi
```

#### TEST-068 — Coerenza TEST-ID

```txt
registri ↔ manifest
→ nessun missing/duplicate
```

#### TEST-069 — Result schema

```txt
SHA + profilo + conteggi + limiti
→ presenti
```

#### TEST-070 — Result redaction

```txt
segreti/URL/path vietati
→ assenti
```

#### TEST-071 — Frontend StrictMode harness

```txt
hook montato con fake timer
→ lifecycle osservabile
```

#### TEST-072 — Route HTTP harness

```txt
porta dinamica
→ status/body/header reali
```

#### TEST-073 — Profilo fast offline

```txt
nessun browser
nessuna rete esterna
nessun tracking
```

#### TEST-074 — Benchmark contract

```txt
mediana/p95
→ fixture controllata
→ nessun dato live
```

#### TEST-075 — Lint surface

```txt
npm run lint
→ realmente eseguibile
oppure
→ script rimosso
```

#### Stato successivo dopo IMPL-028

Il checkpoint del Punto 7 registrava requisiti mancanti. Dopo l’implementazione e la validazione locale di `IMPL-028`, lo stato è:

```txt
TEST-060, TEST-061, TEST-062, TEST-063, TEST-064, TEST-068, TEST-073
→ implementati e passati nel runner self-test

TEST-069, TEST-070
→ copertura parziale presente
→ requirement ID non ancora formalmente chiusi dal manifest
→ restano aperti

TEST-065, TEST-066, TEST-067, TEST-071, TEST-072, TEST-074, TEST-075
→ ancora aperti
```

Questo addendum non riscrive retroattivamente lo stato storico del Punto 7. Registra l’esito successivo e mantiene separati requisiti implementati, copertura parziale e requisiti ancora mancanti.

### Decisioni approvate

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
16. mantenere `fileModificati.md` e il report umano dell’esecutore;
17. non introdurre CI prima che il runner locale sia deterministico;
18. non rendere il full lint un gate prima di una baseline pulita;
19. correggere nel checkpoint del Punto 7 SHA e range obsoleti della Todo.

### Ordine tecnico risultante

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

<!-- AUDIT-CODE-ORIGINAL-END -->
