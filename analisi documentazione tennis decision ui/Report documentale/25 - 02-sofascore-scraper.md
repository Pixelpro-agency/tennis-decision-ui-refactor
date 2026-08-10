# Report documentale — `docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-025
Sequenza audit: 25/72
Documento analizzato: 02-sofascore-scraper.md
Percorso documento: docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md
Percorso report: Report documentale/25 - 02-sofascore-scraper.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 9a35049539cef0b5827a53e503ce8abaebe2cd15
Dimensione documento: 158 righe
Ruolo dichiarato: owner dell'acquisizione Python SofaScore
Stato report: completato
```

## Fonti confrontate

- `scraper.py`
- `scrapers/sofa/cli.py`
- `scrapers/sofa/urls.py`
- `scrapers/sofa/browser.py`
- `scrapers/sofa/cache.py`
- `scrapers/sofa/config.py`
- `backend/src/sofa/loadSofaAnalysis.js`
- `backend/src/sofa/directFetch.js`
- `backend/src/sofa/directFetch.test.mjs`
- `backend/src/sofa/trackerUpdate.js`
- `backend/src/sofa/matchTracker.js`
- `docs/tennis-decision-ui/modules/sofa/01-live-tracking.md`
- `TDUI-DOC-REPORT-024` per i finding condivisi su redazione, bounded output e lifecycle Python.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Wrapper root sottile: corretto
Responsabilità package: corretta
Canonical backend input: 3 endpoint SofaScore dello stesso eventId
Python match-URL expansion: convenience CLI, non usata dal backend canonico
stdout JSON: corretto nel percorso scrape
stderr diagnostics: presente ma non redatto
Browser persistent profile: reale
Headless → headed fallback: reale
Challenge wait: bounded a 60 secondi
Challenge resolution: non certificata, come documentato
Node directFetch generation/barrier: robusta
Node global scraper timeout: 120 secondi

URL authority Python: troppo permissiva
Multiple match URLs: non realmente supportate come il documento può far intendere
Mixed-event API list: non rifiutata
Arbitrary/non-Sofa URL: non rifiutata prima del browser fetch
Cache key: non collision-resistant
Cache error eligibility: non definita
Failure/raw diagnostic payloads possono essere messi in cache
Browser page fetch: nessun timeout per endpoint
Standalone CLI: nessun outer timeout
Parent/child time budget: non formalizzato
Persistent profile lifecycle/ownership: incompleto
Sofa logger redaction: assente
Sofa stdout size bound nel caller Node: assente
Error envelope: non uniforme
Verification matrix: insufficiente
Modifiche proposte: 10
Riscrittura completa: NO
Revisione mirata: SÌ
Modularizzazione: NON necessaria
Nuovi documenti canonici: nessuno
Priorità complessiva: ALTA
```

Il documento descrive correttamente la pipeline:

```text
scraper.py
→ scrapers.sofa.cli
→ normalizzazione input
→ cache breve
→ browser SofaScore
→ fetch API nel page context
→ JSON stdout
```

Il problema principale è che il contratto Python accetta più input di quelli necessari al backend canonico. Il backend live costruisce già, da un singolo `eventId`, esclusivamente:

```text
https://www.sofascore.com/api/v1/event/<eventId>
https://www.sofascore.com/api/v1/event/<eventId>/statistics
https://www.sofascore.com/api/v1/event/<eventId>/point-by-point
```

Il package Python dovrebbe rendere esplicita e verificabile questa authority.

---

# 1. URL authority Python troppo permissiva

`normalize_input_urls()` pulisce le stringhe ma, salvo il caso di una singola match URL espandibile, restituisce la lista senza verificare:

- scheme;
- hostname;
- porta;
- path;
- endpoint ammesso;
- event ID comune;
- mixed-event batch.

`is_sofascore_api_url()` controlla soltanto la substring:

```text
/api/v1/event/
```

e non l'host.

`browser.py` usa il primo event ID estraibile per aprire:

```text
https://www.sofascore.com/event/<eventId>
```

poi esegue `fetch(url)` per tutte le URL ricevute.

Il fatto verificato è quindi:

```text
l'input non viene confinato al dominio dichiarato dal modulo
```

anche se il backend canonico gli passa già URL corrette.

## `SOFA-SCRAPER-001` — canonical URL authority

**Priorità:** alta

Introdurre una validazione canonica prima di cache/browser:

```text
https
→ host SofaScore ammesso
→ path endpoint ammesso
→ eventId numerico
→ query/fragment/credentials secondo contratto esplicito
```

Una singola match URL può restare una convenience manuale, ma deve essere validata e trasformata nei tre endpoint canonici.

---

# 2. “Una o più URL” non equivale a multiple match URL

L'espansione avviene soltanto quando:

```python
len(cleaned) == 1
```

Con due match URL:

```text
nessuna espansione
→ entrambe passate a browser.py
→ prima URL decide il page context
→ fetch delle URL match come se fossero endpoint JSON
```

Anche una lista di endpoint appartenenti a event ID diversi non viene rifiutata.

Il backend live non soffre di questo problema perché `loadSofaPayload(eventId)` costruisce sempre i tre endpoint dello stesso evento.

## `SOFA-SCRAPER-002` — single-event batch contract

**Priorità:** alta

Definire:

```text
una invocazione scrape = un eventId
```

Input ammessi:

```text
A. una match URL canonica
   → espansione 3 endpoint

B. uno o più endpoint API canonici
   → tutti dello stesso eventId
```

Rifiutare mixed-event e multiple match URL salvo requisito futuro esplicito e testato.

---

# 3. Cache key non collision-resistant

`get_cache_key(urls)` usa:

```text
join delle URL
→ ogni non-alfanumerico diventa "_"
→ truncation a 100 caratteri
```

Input diversi possono quindi produrre la stessa chiave per:

- normalizzazione lossy dei separatori;
- differenze dopo il carattere 100;
- prefissi molto simili.

Per 5 secondi una collisione può far servire il risultato di A alla richiesta B.

La cache non è canonica, ma il suo contenuto entra nel producer live; l'identità deve quindi essere corretta.

## `SOFA-SCRAPER-003` — collision-resistant cache identity

**Priorità:** alta

Usare una rappresentazione canonica completa dell'input, per esempio:

```text
ordered canonical URL list
→ serialization deterministica
→ SHA-256
```

Testare prefissi lunghi, separatori differenti, event ID distinti e collision candidates.

---

# 4. Cache eligibility implicita e failure payload cacheabili

`cli.py` salva cache quando:

```python
if results:
    set_cached_result(urls, results)
```

Quindi un dict di errore è eleggibile quanto un successo.

`browser.py` può produrre:

```text
HTTP error
error.message JavaScript
str(error) Python
```

e questi valori possono finire in `backend/scraper_cache/`.

Effetti:

```text
failure transiente
→ cache hit successivo
→ nuovo browser attempt evitato
```

e raw diagnostic text può essere persistito.

## `SOFA-SCRAPER-004` — cache eligibility

**Priorità:** alta

Definire esplicitamente la cacheability di:

- successo completo;
- successo parziale;
- HTTP error;
- challenge unresolved;
- browser exception;
- input error.

Non persistere raw exception non redatte.

Se alcune failure devono essere cacheate, usare code/reason bounded e una policy esplicita.

---

# 5. Browser fetch senza timeout per endpoint

`page.goto()` usa 30 secondi e il loop challenge headed è limitato a 60 secondi.

Il JavaScript API fetch invece usa:

```javascript
await fetch(url)
```

senza timeout o `AbortController`.

Nel percorso backend l'intero child è limitato da `directFetch.js` a:

```text
120000 ms
```

ma il CLI manuale documentato non ha un outer timeout Node.

Inoltre il budget complessivo:

```text
headless
→ headed relaunch
→ goto
→ manual solve
→ fetch multipli
```

non è formalmente coordinato con i 120 secondi del parent.

## `SOFA-SCRAPER-005` — bounded browser time budget

**Priorità:** alta

Definire:

```text
navigation timeout
challenge timeout
per-endpoint fetch timeout
whole Python scrape budget
Node parent timeout
```

con gerarchia coerente. Il CLI standalone deve essere bounded anche senza Node.

---

# 6. Redazione e bounded output restano incompleti

`scrapers/sofa/config.py` scrive direttamente su stderr:

```python
sys.stderr.write(...)
```

senza redazione.

`browser.py` può loggare:

- match URL;
- page title;
- raw exception.

Può inoltre inserire `str(error)` nel JSON stdout.

Nel caller Node:

```js
let stdout = '';
stdout += data.toString();
```

senza max-size.

Questi punti sono già posseduti dal report 024:

```text
PY-RUNTIME-002
→ Sofa diagnostic redaction

PY-RUNTIME-003
→ Sofa subprocess output boundedness
```

## `SOFA-SCRAPER-006` — owner alignment con runtime condiviso

**Priorità:** alta

Questo owner deve dichiarare e testare:

```text
stdout
→ JSON machine-readable
→ bounded dal runtime

stderr
→ diagnostic-only
→ bounded
→ redacted

error payload
→ code/message bounded
```

L'implementazione deve coordinarsi con `PY-RUNTIME-002/003`, non duplicarle.

---

# 7. Persistent profile lifecycle incompleto

`config.py` distingue:

```text
backend/scraper_cache/
backend/scraper_profile/
```

e `browser.py` usa `scraper_profile` come `user_data_dir` di un persistent context.

Quindi:

```text
scraper_profile ≠ cache
```

Il documento però non definisce:

- cleanup policy;
- sharing;
- concurrency;
- privacy/site storage;
- ownership.

`directFetch.js` serializza fisicamente i child Sofa tramite `currentBarrier`, riducendo la concorrenza nel backend canonico, ma non impedisce un `scraper.py` manuale concorrente.

## `SOFA-SCRAPER-007` — profile lifecycle

**Priorità:** media

Documentare e, se necessario, rendere verificabile:

```text
persistenza
cleanup
sharing
concurrency
privacy
```

Non trattare `scraper_profile` come semplice cache.

---

# 8. Challenge unresolved non ha una reason specifica

Il documento è corretto nel dire che i 60 secondi non certificano la risoluzione.

Il codice, scaduto il loop, prosegue comunque:

```text
sleep 2s
→ fetch API
```

anche se la challenge è ancora presente.

La causa reale può quindi diventare un generico:

```text
HTTP error
browser error
JS error
```

## `SOFA-SCRAPER-008` — bounded challenge state

**Priorità:** media

Alla scadenza:

```text
challenge ancora presente
→ reason challenge_unresolved
```

oppure, se si decide comunque di tentare il fetch, mantenere provenance esplicita:

```text
challenge unresolved + fetch attempted
```

senza confondere la causa con endpoint assente.

---

# 9. Error envelope non uniforme

Le forme correnti includono:

```json
{"error":"No URLs provided"}
```

```json
{"<url>":{"error":"No event ID"}}
```

```json
{"<url>":{"error":"HTTP 403","status":403}}
```

```json
{"<url>":{"error":"<raw exception>"}}
```

e, dal bridge Node:

```json
{"<url>":{"error":{"code":504,"message":"scraper_timeout"}}}
```

`trackerUpdate.js` tollera oggi queste forme perché verifica soprattutto la truthiness di `error`, ma questo non costituisce un machine-readable contract stabile.

## `SOFA-SCRAPER-009` — stable result/error schema

**Priorità:** alta

Definire:

```text
success payload
error code
bounded reason/message
optional HTTP status
```

senza raw exception necessaria al consumer.

Coordinare la migrazione con `directFetch.js`, `trackerUpdate.js` e relativi test.

---

# 10. Verification matrix insufficiente

Il documento verifica soltanto:

```text
py_compile
import
builder produce 3 endpoint
assenza tennis-power-rankings
```

Mancano test owner per:

- URL authority;
- foreign host;
- mixed-event;
- multiple match URL;
- cache collision;
- cache eligibility;
- challenge fallback;
- challenge unresolved;
- stdout purity;
- stderr redaction;
- output size;
- endpoint timeout;
- parent/child budget;
- persistent profile lifecycle;
- result schema.

`directFetch.test.mjs` copre bene generation, cancellation, physical barrier, timeout caller e safe structured logs, ma non le semantiche Python sopra.

## `SOFA-SCRAPER-010` — verification matrix

**Priorità:** alta

Aggiungere test Python per URL/cache/browser/output e ampliare i test Node per stdout overflow e timeout hierarchy.

---

# Elementi corretti da preservare

## Cache TTL

```text
CACHE_TTL_SECONDS = 5
```

Il documento è corretto: la cache è un'ottimizzazione runtime, non history/timeline/Evidence.

Una cache corrotta viene trattata come miss e non promossa a dato.

## Persistent browser

Il browser usa realmente:

```text
playwright.chromium.launch_persistent_context
```

con `backend/scraper_profile/`.

## Headless → headed

La detection usa:

```text
Just a moment
Attention Required
HTTP 403
```

e in headless chiude il context prima di rilanciare una nuova esecuzione headed.

## Canonical downstream

`loadSofaPayload(eventId)` usa esattamente i tre endpoint attesi.

`trackerUpdate.js`:

- richiede l'evento;
- tollera stats/PBP assenti come opzionali;
- normalizza snapshot e localContext downstream;
- coordina Source Identity e persistenza.

Lo scraper non costruisce:

- snapshot finale;
- localContext;
- Source Identity;
- history;
- timeline;
- Evidence.

## Node physical barrier

`directFetch.js` mantiene un `currentBarrier` e non avvia un nuovo child Sofa prima della completion fisica del precedente.

Generation stale/termination/timeout sono gestiti e i test correnti coprono bene questa parte.

---

# Modularizzazione

```text
Righe: 158
Responsabilità primaria: una
Owner: acquisizione Python SofaScore
Sottotemi: CLI/input, cache, browser/fallback, output/logging
Contesti necessari insieme: sì
Nuovi documenti canonici necessari: no
```

Separare CLI, cache e browser in documenti diversi frammenterebbe una pipeline piccola che deve essere letta insieme:

```text
input
→ cache
→ browser
→ output
```

Decisione:

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Nessuna task di modularizzazione.

---

# Riferimenti per mappa e JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-025
Percorso report: Report documentale/25 - 02-sofascore-scraper.md
Documento: docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md
Change ID: SOFA-SCRAPER-001
Change ID: SOFA-SCRAPER-002
Change ID: SOFA-SCRAPER-003
Change ID: SOFA-SCRAPER-004
Change ID: SOFA-SCRAPER-005
Change ID: SOFA-SCRAPER-006
Change ID: SOFA-SCRAPER-007
Change ID: SOFA-SCRAPER-008
Change ID: SOFA-SCRAPER-009
Change ID: SOFA-SCRAPER-010
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
PY-RUNTIME-002
PY-RUNTIME-003
IMPL-006
SOURCE-ID-001
```

Al prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 025
→ indice 25 ANALIZZATO
→ Divisione non necessaria
→ aggiungere SOFA-SCRAPER-001..010

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-025
→ appendere SOFA-SCRAPER-001..010
→ split_required:false
→ proposed_files:[]
→ preservare integralmente il ledger precedente
```

---

# Modifiche proposte

```text
SOFA-SCRAPER-001  high    canonical URL authority
SOFA-SCRAPER-002  high    single-event batch contract
SOFA-SCRAPER-003  high    collision-resistant cache identity
SOFA-SCRAPER-004  high    cache eligibility
SOFA-SCRAPER-005  high    bounded browser time budget
SOFA-SCRAPER-006  high    runtime redaction/bounded-output alignment
SOFA-SCRAPER-007  medium  persistent profile lifecycle
SOFA-SCRAPER-008  medium  challenge unresolved state
SOFA-SCRAPER-009  high    stable result/error schema
SOFA-SCRAPER-010  high    verification matrix
```

---

# Ordine consigliato

```text
1. SOFA-SCRAPER-001
2. SOFA-SCRAPER-002
3. SOFA-SCRAPER-003
4. SOFA-SCRAPER-004
5. SOFA-SCRAPER-005
6. PY-RUNTIME-002 + SOFA-SCRAPER-006
7. PY-RUNTIME-003 + SOFA-SCRAPER-006
8. SOFA-SCRAPER-009
9. SOFA-SCRAPER-008
10. SOFA-SCRAPER-007
11. SOFA-SCRAPER-010
12. revisione mirata 02-sofascore-scraper.md
13. checker documentali
14. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

---

# Verifica prevista dopo modifica

## URL

```text
single match URL canonica
→ 3 endpoint stesso eventId

canonical API URL
→ accepted

foreign host con path Sofa-like
→ rejected
→ nessun browser fetch

mixed event IDs
→ rejected
```

## Cache

```text
input distinti
→ chiavi distinte

<5s
→ hit se eleggibile

>=5s
→ miss

corrupt file
→ miss

failure payload
→ policy esplicita
```

## Browser

```text
headless success
→ JSON

headless challenge
→ new headed context

headed solved
→ fetch

headed unresolved
→ bounded reason

endpoint hang
→ timeout
```

## Output

```text
stdout
→ solo JSON machine-readable
→ bounded

stderr
→ diagnostic-only
→ redacted
→ bounded
```

## Node bridge

Mantenere i test su:

```text
generation
physical barrier
timeout 504
spawn failure
safe runtime logs
```

e aggiungere:

```text
stdout overflow
stderr bound
child/parent timeout hierarchy
```

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante questa analisi.

---

# Decisione finale

```text
02-sofascore-scraper.md: PIPELINE CORRETTA, INPUT/CACHE/TIMEOUT DA IRROBUSTIRE

package responsibility: corretta
wrapper: sottile
canonical backend endpoints: corretti
cache TTL: corretto
persistent browser: reale
headless→headed: reale
manual wait: bounded
stdout result channel: corretto
Node generation/barrier: robusta
downstream boundaries: corretti

URL allow-list: assente
single-event invariant: implicita ma non validata
multiple match URL: non realmente espanse
mixed-event batch: accettato
cache key collision-resistant: no
cache eligibility: implicita
failure/raw error cache: possibile
per-endpoint fetch timeout: assente
standalone outer timeout: assente
time budget parent/child: non formalizzato
stderr redaction: assente
stdout size bound Node: assente
profile lifecycle: incompleto
challenge unresolved reason: assente
error schema: non uniforme
verification matrix: insufficiente

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: alta
```

Regola centrale da introdurre:

```text
SofaScore scraper
→ soltanto input SofaScore autorizzati
→ un solo evento per batch
→ cache con identity corretta
→ browser work bounded
→ result JSON stabile e bounded
```

senza spostare nello scraper Python responsabilità di snapshot, tracking, Source Identity o persistenza.

---

# Aggiornamento applicativo

Il documento canonico è stato riallineato al codice corrente senza ulteriori
modifiche allo scraper.

Completate:

```text
SOFA-SCRAPER-006
→ stderr SofaScore bounded/redacted
→ stdout Node limitato a 2 MiB
→ overflow con errore statico e terminazione owned

SOFA-SCRAPER-007
→ scraper_profile distinto dalla cache
→ documentati persistenza, privacy, cleanup e concorrenza
```

Il documento registra esplicitamente come limiti correnti URL authority, mixed
event, cache key/eligibility, timeout browser/CLI, challenge reason ed envelope
degli errori.

Le task `SOFA-SCRAPER-001–005` e `SOFA-SCRAPER-008–010` sono state
successivamente applicate:

- URL authority HTTPS e single-event fail-closed;
- cache SHA-256 limitata ai successi completi;
- timeout endpoint/Python coordinati con il parent Node;
- `challenge_unresolved` distinto dagli errori endpoint;
- envelope errori bounded e senza raw exception;
- matrice test Python aggiunta.

Stato finale del report: `SOFA-SCRAPER-001–010` completate e verificate.

Operazioni Git di scrittura: nessuna.
