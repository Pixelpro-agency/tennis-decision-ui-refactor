# Report documentale — `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-027
Sequenza audit: 27/72
Documento analizzato: 04-betfair-graph-url-validation.md
Percorso documento: docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md
Percorso report: Report documentale/27 - 04-betfair-graph-url-validation.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: da749cec471e1df60bf6d7b385ab0f7161f82b0f
Dimensione documento: 304 righe
Ruolo dichiarato: owner della grammatica e del mapping Graph URL Python Betfair
Stato report: completato
```

Il documento è stato confrontato con:

- `scrapers/betfair/graph_url.py`;
- `scrapers/betfair/graph_url_test.py`;
- `scrapers/betfair/scrape.py`;
- `scrapers/betfair/ladder.py`;
- `scrapers/betfair/market_api.py`;
- `backend/src/routes/test/graphUrlValidation.js`;
- `docs/tennis-decision-ui/api/05-preflight.md`;
- `docs/tennis-decision-ui/operations/04-validation-and-rollback.md`;
- `docs/validations/README.md`;
- `docs/validations/betfair-live-validation-2026-07-04.md`;
- i finding già registrati `PREFLIGHT-API-004`, `TECH-SAMPLE-002`, `BETFAIR-SCRAPER-006`, `BETFAIR-SCRAPER-007` e `BETFAIR-SCRAPER-009`.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: ALTA
Owner documentale: ben delimitato
Parser puro: implementato
HTTPS + host esatto graphs.betfair.it: verificati
Credential/port rejection: implementata
Path /marketId/selectionId/0: implementato
runnerChartData: rifiutato
marketId mapping: implementato
selectionId mapping: implementato
duplicate input selection: bloccato
fallback per nome/indice: assente
success counter dopo ladder assignment: corretto
diagnostic failure cap: implementato
redaction failure URL/text: implementata

Preflight backend: ancora semanticamente diverso, già PREFLIGHT-API-004
API market identity assente: classificata erroneamente come market mismatch
API duplicate selectionId: build_selection_map last-wins silenzioso
Query/fragment: ammessi ma ignorati dal mapping e passati raw al browser
Duplicate reservation: first-mapped wins anche se ladder fallisce
Pure tests: buoni ma non completi
Scrape integration graph loop: non coperto da test owner dedicato
Deterministic negative cases: impropriamente mantenuti nella matrice live aperta
Live validation claim "mode=cdp reale": non supportato dal record storico canonico disponibile
Live positive Graph/ladder/matched: supportato
Logout Graph → auth_suspected → Connected: supportato
Modifiche nuove proposte: 7
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: ALTA
```

Il documento è uno degli owner più coerenti auditati finora.

La pipeline descritta:

```text
Graph URL
→ parse sintattico
→ marketId check
→ selectionId → runner API
→ duplicate reservation
→ apertura pagina ladder
→ ladder assignment
```

corrisponde realmente al codice.

Le correzioni necessarie riguardano soprattutto i boundary:

```text
upstream market/runner identity
shared preflight syntax
canonical URL form
verification scope
validation history
```

e non richiedono un redesign del parser.

---

# 1. Market identity assente viene classificata come Graph URL market mismatch

## Esito: reason semanticamente errata

`validate_ladder_mapping(...)` confronta:

```text
parsed market_id
contro
str(expected_market_id)
```

Nel percorso `scrape.py`:

```text
expected_market_id
→ market_info.market_id
→ None quando market_info non contiene market_id
```

Se la market API fallisce o non produce una market identity:

```text
expected_market_id = None
```

una Graph URL sintatticamente valida viene confrontata con:

```text
"None"
```

e riceve:

```text
bad_graph_url_market_mismatch
```

## Perché è scorretto

Un vero mismatch significa:

```text
market API = 1.A
Graph URL = 1.B
```

Il caso:

```text
market API identity unavailable
```

è diverso.

La URL utente non è stata dimostrata errata.

## Effetto diagnostico

Più Graph URL valide possono diventare tutte:

```text
bad_graph_url_market_mismatch
```

quando la causa reale è upstream:

```text
market identity unavailable
```

## Finding `GRAPH-URL-001` — distinguere upstream market identity unavailable dal mismatch reale

**Priorità:** alta  
**Tipo:** diagnostic mapping authority

### Target

Prima del mapping per-URL, verificare:

```text
expected_market_id disponibile e valido
```

Se non disponibile:

```text
skip Graph mapping
→ reason bounded distinta
```

per esempio semanticamente:

```text
graph_market_identity_unavailable
```

La reason finale deve essere scelta secondo la tassonomia owner.

### Invariante

Usare:

```text
bad_graph_url_market_mismatch
```

soltanto quando esistono davvero due market ID confrontabili e differenti.

---

# 2. `build_selection_map()` non rileva selectionId duplicate nel payload API

## Esito: invariante documentale non garantita

Il documento dichiara:

```text
Una URL valida
→ runner API risolto
→ ladder assegnata soltanto a quel runner
```

e:

```text
Non esiste fallback per nome, indice o ordine.
```

Questa filosofia è corretta.

## Implementazione

`build_selection_map(runners)` costruisce:

```python
selection_map[str(selection_id)] = runner
```

Per due runner API con lo stesso `selectionId`:

```text
runner A selectionId=101
runner B selectionId=101
```

il secondo sovrascrive silenziosamente il primo.

Il mapping successivo vede:

```text
101 → runner B
```

come se l'identità fosse univoca.

## Problema

Quindi oggi non è garantito:

```text
selectionId
→ esattamente un runner API
```

È garantito soltanto:

```text
dict Python
→ al massimo una entry finale per chiave
```

che non è la stessa cosa.

## Coordinamento

Il downstream ha già una task:

```text
TECH-SAMPLE-002
→ selectionId presente, normalizzabile e univoco
```

Questo owner Graph deve applicare la stessa invariante prima dell'assegnazione ladder.

## Finding `GRAPH-URL-002` — fail-closed su API runner identity ambigua

**Priorità:** alta  
**Tipo:** runner identity

### Target

`build_selection_map()` o un nuovo builder strutturato deve poter distinguere:

```text
unique selectionId
missing selectionId
duplicate selectionId
```

Una selection API duplicata non deve diventare:

```text
last runner wins
```

### In caso di ambiguità

```text
nessuna ladder assegnata a quella identity
→ reason bounded
```

### Coordinamento

Allineare con `TECH-SAMPLE-002`, senza introdurre una seconda nozione incompatibile di runner identity.

---

# 3. Query string e fragment sono ammessi ma non appartengono al mapping canonico

## Esito: canonical form non definita

Il parser accetta:

```text
https://graphs.betfair.it/<market>/<selection>/0
```

ma anche:

```text
...?query=value
#fragment
slash finale
```

I test dichiarano esplicitamente query e fragment come validi.

## Mapping

`parse_direct_ladder_url()` usa soltanto:

```text
scheme
hostname
port
path
```

e ignora:

```text
query
fragment
```

## Browser

`scrape.py` però non naviga una URL ricostruita dal parser.

Passa a `extract_ladder_from_url()`:

```text
ladder_url raw originale
```

Quindi query e fragment:

```text
non partecipano all'identità di mapping
ma
partecipano alla navigazione browser
```

## Esempio semantico

```text
URL A
https://graphs.betfair.it/1.2/101/0?a=1

URL B
https://graphs.betfair.it/1.2/101/0?a=2
```

mappano entrambe:

```text
marketId 1.2
selectionId 101
```

ma il browser riceve target differenti.

La seconda diventa inoltre duplicata dopo la reservation della prima.

## Finding `GRAPH-URL-003` — definire una canonical direct Graph URL per la navigazione

**Priorità:** media  
**Tipo:** URL canonicalization

### Decisione richiesta

Scegliere esplicitamente uno dei due contratti:

### A. strict canonical

Accettare soltanto:

```text
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

con eventuale trailing slash definito, ma:

```text
no query
no fragment
```

### B. canonicalize

Il parser può accettare varianti compatibili ma deve produrre:

```text
canonical_navigation_url
```

e il browser deve navigare quella, non il raw input.

### Motivo

Il mapping authority e il navigation target devono riferirsi allo stesso oggetto canonico.

---

# 4. Il comportamento del Graph loop è documentato ma non verificato da un test integration owner

## Esito: gap di verification

`graph_url_test.py` verifica bene i pure helper:

- URL valida;
- query/fragment/trailing slash;
- scheme/host/path/view invalidi;
- `runnerChartData`;
- market mismatch;
- selection missing;
- duplicate selection;
- `None` escluso dalla selection map.

Non verifica però l'integrazione in `scrape.py`.

## Contratti non provati direttamente

Il documento afferma:

```text
mapping failure
→ nessuna context.new_page()
→ nessuna extract_ladder_from_url()
```

e:

```text
graphUrlsAttempted +1
graphUrlsFailed +1
```

e:

```text
graphUrlsSucceeded
→ incrementato soltanto dopo ladder assegnata
```

e ancora:

```text
selectionId riservata prima della ladder extraction
```

Questi sono comportamenti `scrape.py`, non `graph_url.py`.

La suite pura non può provarli.

## Duplicate reservation

Il comportamento:

```text
prima URL mappa bene
→ viene riservata
→ ladder fallisce
→ seconda URL stessa selection
→ duplicate
```

è descritto correttamente dal documento.

Ma non esiste un test owner che impedisca una regressione accidentale di questa policy.

## Finding `GRAPH-URL-004` — aggiungere test di integrazione del Graph loop

**Priorità:** alta  
**Tipo:** verification contract

### Casi minimi

Con context/page/ladder fake:

```text
invalid parser
→ no new_page
→ attempted 1
→ failed 1

market mismatch
→ no new_page

selection missing
→ no new_page

valid mapping + ladder rows
→ runner ladder assegnata
→ ladder_source graph_url
→ succeeded 1

valid mapping + empty ladder
→ failed 1
→ selection resta riservata secondo policy corrente

duplicate successivo
→ no seconda page

lista mixed valid/invalid
→ contatori completi
→ failures max 5
```

### Auth/finished

I test di classificazione auth/finished devono coordinarsi con:

```text
BETFAIR-SCRAPER-006
BETFAIR-SCRAPER-007
```

senza duplicare l'owner.

---

# 5. La matrice live aperta include casi che devono essere deterministici/offline

## Esito: verifica live sovra-estesa

Il documento mantiene come live ancora aperti:

```text
URL invalide
market mismatch reale
selection assente reale
duplicato reale
login inizialmente assente
ladder vuota o temporanea
lista mista di URL
```

## Runbook canonico

Il runbook di validazione stabilisce:

```text
verifica live soltanto se dipende da browser o fonte reale
```

Il parser e il mapping sono pure logic.

Quindi:

```text
URL invalida
market mismatch
selection assente
duplicate
lista mixed
```

non devono dipendere da una sessione Betfair reale per essere considerati verificati.

## Live realmente utile

Restano invece appropriati come `live_observed`:

```text
login Graph assente
security/auth behavior
ladder disponibile/vuota in condizioni reali
browser/CDP
recovery autenticazione
```

## Finding `GRAPH-URL-005` — separare deterministic verification da live observation

**Priorità:** media  
**Tipo:** validation semantics

### Documento

Sostituire la matrice live unica con due sezioni:

```text
offline deterministic contract
browser/source-dependent observation
```

### Obiettivo

Un caso pure:

```text
non eseguito live
```

non deve restare implicitamente “non validato” se esiste una suite deterministica completa.

---

# 6. Il claim `mode=cdp reale` non è supportato dal record storico canonico disponibile

## Esito: provenance storica incompleta

Il documento dichiara per il collaudo `9B`:

```text
mode=cdp reale
→ Graph URL valida
→ runner assegnato
→ ladder utilizzabile
→ matched volume aggiornato
```

## Validation archive corrente

`docs/validations/betfair-live-validation-2026-07-04.md` registra per Sessione A:

```text
2 Graph URL fornite, tentate e riuscite
ladderSource graph_url per entrambi i runner
selectionId stabile
matchedVolume positivo
```

Quindi sono supportati:

```text
Graph URL positiva
mapping/ladder effettivo
matched volume positivo
```

## Non registrato nello stesso artifact

Non viene indicato esplicitamente:

```text
mode=cdp
```

né viene usato l'identificatore:

```text
9B
```

come metadato canonico.

Il README validations vieta di ricostruire dati non registrati per inferenza.

## Logout/recovery

Lo stesso artifact supporta invece chiaramente:

```text
logout
→ auth_suspected
→ health alert
→ login ripristinato
→ Connected
```

## Finding `GRAPH-URL-006` — allineare i claim live all'artefatto archiviato

**Priorità:** media  
**Tipo:** validation provenance

### Target

Nel documento owner:

```text
citare il file di validation storico esatto
```

e riportare soltanto ciò che contiene.

### Per `mode=cdp reale`

Se esiste un altro artifact canonico che lo registra:

```text
linkarlo
```

altrimenti:

```text
rimuovere il dettaglio
oppure
marcarlo come non registrato nell'artifact disponibile
```

### Non fare

Non trasformare memoria o inferenza in evidenza storica.

---

# 7. La sezione Preflight descrive una divergenza che il target già approvato deve eliminare

## Esito: stato corrente corretto, target documentale da coordinare

Il documento dice:

```text
preflight backend
→ grammatica preliminare e distinta

parser Python
→ accettazione definitiva
```

Questo descrive il codice corrente.

## Backend corrente

`graphUrlValidation.js` accetta:

```text
graphs.betfair.<tld>
path con almeno marketId/selectionId
```

e non richiede:

- `https`;
- `graphs.betfair.it`;
- `/0`;
- credential/port constraints del parser Python;
- duplicate selection semantics runtime.

Quindi una URL può essere:

```text
preflight valid
Python invalid
```

## Task già aperta

Questo problema è già posseduto da:

```text
PREFLIGHT-API-004
```

che richiede di riallineare il preflight al parser runtime Python.

Non viene aperta una nuova implementazione duplicata.

## Finding `GRAPH-URL-007` — aggiornare l'owner Graph insieme a `PREFLIGHT-API-004`

**Priorità:** media  
**Tipo:** documentation authority alignment

### Dopo `PREFLIGHT-API-004`

Il documento dovrà distinguere:

```text
shared syntax authority
```

da:

```text
runtime mapping authority
```

Il preflight può condividere la grammatica canonica.

Python resta owner delle verifiche runtime che richiedono:

```text
market_info.market_id
runner API selectionId
seen selections
ladder assignment
```

### Non mantenere

Non lasciare una divergenza sintattica intenzionale fra:

```text
preflight green
e
runtime parser red
```

una volta applicato il target già approvato.

---

# 8. Duplicate reservation

## Esito: comportamento intenzionale e documentato

Il codice aggiunge la selection a:

```text
seen_selection_ids
```

subito dopo il mapping e prima dell'apertura ladder.

Quindi la policy corrente è:

```text
first successfully mapped URL wins
```

non:

```text
first successfully extracted ladder wins
```

Il documento lo dice esplicitamente.

## Valutazione

Non viene aperta una task autonoma per cambiarla.

È una scelta conservativa coerente con:

```text
una selection
→ una sola Graph URL per esecuzione
```

Il requisito è però che venga fissata dai test di `GRAPH-URL-004`, perché un refactor futuro non deve cambiarla accidentalmente.

Se in futuro si vorrà supportare retry di Graph URL alternative per la stessa selection:

```text
serve una decisione esplicita
```

e non una modifica opportunistica.

---

# 9. Failure diagnostics

## Esito: coerenti

`add_graph_failure()`:

- limita la lista alle prime 5 failure;
- redige la URL;
- redige il testo;
- tronca dopo la redazione.

I contatori:

```text
provided
attempted
succeeded
failed
rows
```

restano indipendenti dal limite di 5 record diagnostici.

Questa parte è corretta.

---

# 10. Login required

## Esito: integration behavior reale, classifier da correggere nell'owner scraper

Quando ladder restituisce:

```text
login_required
```

`scrape.py`:

```text
results.diagnostics
→ authSuspected true
→ failed++
→ auth_suspected failure
→ break
```

Il documento descrive correttamente questo comportamento.

La qualità del classifier login/fallback è però già stata aperta come:

```text
BETFAIR-SCRAPER-007
```

Non viene duplicata.

---

# 11. Finished skip

## Esito: integration behavior reale, authority da correggere nell'owner scraper

Se:

```text
event_status.hasFinished
```

lo scraper:

```text
skippedBecauseFinished = true
graphUrlsAttempted = 0
```

Il documento è corretto sul comportamento.

La qualità della detection `finished` è già stata aperta come:

```text
BETFAIR-SCRAPER-006
```

Quindi non viene creato un finding duplicato.

---

# 12. Graph URL grammar

## Esito: parser corrente robusto sul core

Il parser rifiuta:

```text
http
host differente
credential
porta esplicita
path non esatto
view != 0
marketId non numerico con punto
selectionId non numerica
runnerChartData
```

Questa parte è coerente.

La decisione su query/fragment appartiene a `GRAPH-URL-003`.

---

# 13. Mapping marketId

## Esito: corretto quando entrambe le identity esistono

Quando:

```text
expected_market_id = "1.123"
Graph market_id = "1.456"
```

il reason:

```text
bad_graph_url_market_mismatch
```

è appropriato.

Il problema è solo il caso:

```text
expected market unavailable
```

trattato in `GRAPH-URL-001`.

---

# 14. Mapping selectionId

## Esito: corretto per selection map non ambigua

Una selection Graph non presente nella map produce:

```text
bad_graph_url_selection_not_found
```

e non apre browser ladder.

Il problema upstream di duplicate API selectionId è trattato in `GRAPH-URL-002`.

---

# 15. Preflight `sameMarket`

## Esito: divergenza già nota, nessun nuovo task

Il backend corrente calcola:

```text
sameMarket
```

come diagnostica sui soli market ID validi.

Non determina `ok`.

Il parser Python invece confronta ogni Graph URL con:

```text
market_info.market_id
```

runtime.

La task già aperta `PREFLIGHT-API-004` richiede esplicitamente di riallineare anche la semantica `sameMarket` e duplicati.

Questo report non crea un nuovo change ID per lo stesso problema.

---

# 16. Modularizzazione

## Valutazione

```text
Righe: 304
Responsabilità primaria: una
Owner: Graph URL syntax + runtime mapping
Pure helper: stesso owner
Scrape integration: stesso owner di confine
Graph diagnostics specifiche: stesso owner
Network capture generale: fuori owner
CLI/cache: fuori owner
Contesti distinti da separare: nessuno
Nuovi documenti canonici necessari: no
```

Il file è già una modularizzazione corretta estratta dal più ampio scraper Betfair.

Dividerlo ulteriormente in:

```text
graph-url-syntax.md
graph-url-mapping.md
```

separerebbe due parti che devono essere lette insieme:

```text
URL identity
→ API identity
→ ladder assignment
```

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Nessuna task di modularizzazione.

---

# Riferimenti per mappa e JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-027
Percorso report: Report documentale/27 - 04-betfair-graph-url-validation.md
Documento: docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md
Change ID: GRAPH-URL-001
Change ID: GRAPH-URL-002
Change ID: GRAPH-URL-003
Change ID: GRAPH-URL-004
Change ID: GRAPH-URL-005
Change ID: GRAPH-URL-006
Change ID: GRAPH-URL-007
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
PREFLIGHT-API-004
TECH-SAMPLE-002
BETFAIR-SCRAPER-006
BETFAIR-SCRAPER-007
BETFAIR-SCRAPER-009
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 023–027
→ indice 27 ANALIZZATO
→ Divisione non necessaria
→ aggiungere GRAPH-URL-001..007

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-027
→ appendere GRAPH-URL-001..007
→ split_required:false
→ proposed_files:[]
→ preservare integralmente il ledger precedente
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `GRAPH-URL-001` — upstream market identity unavailable

**Priorità:** high

- distinguere missing market identity da mismatch;
- reason bounded separata;
- non attribuire al Graph input una failure upstream;
- test `expected_market_id=None`.

## `GRAPH-URL-002` — duplicate API selection identity

**Priorità:** high

- no silent last-wins;
- detect duplicate selectionId;
- fail closed per identity ambigua;
- coordinare `TECH-SAMPLE-002`;
- test runner API duplicati.

## `GRAPH-URL-003` — canonical navigation URL

**Priorità:** medium

- decidere query/fragment;
- strict reject oppure canonicalization;
- mapping target = navigation target;
- test varianti semanticamente equivalenti;
- mantenere eventuale trailing slash policy esplicita.

## `GRAPH-URL-004` — Graph loop integration tests

**Priorità:** high

- no page su parser/mapping failure;
- counters;
- success assignment;
- empty/error behavior;
- duplicate reservation;
- mixed list;
- failure cap.

## `GRAPH-URL-005` — deterministic vs live verification

**Priorità:** medium

- negative pure cases automatici;
- live solo per browser/source-dependent behavior;
- aggiornare status e matrice;
- non richiedere Betfair reale per provare un parser puro.

## `GRAPH-URL-006` — validation provenance

**Priorità:** medium

- linkare `docs/validations/betfair-live-validation-2026-07-04.md`;
- preservare i claim effettivamente registrati;
- non dichiarare `mode=cdp reale` senza artifact che lo attesti;
- niente ricostruzione storica per inferenza.

## `GRAPH-URL-007` — shared preflight syntax authority

**Priorità:** medium

- aggiornare il documento insieme a `PREFLIGHT-API-004`;
- syntax condivisa;
- mapping runtime resta Python;
- eliminare il target di divergenza sintattica preflight/runtime.

---

# Ordine consigliato di applicazione

```text
1. GRAPH-URL-001
2. GRAPH-URL-002
3. PREFLIGHT-API-004 + GRAPH-URL-007
4. GRAPH-URL-003
5. GRAPH-URL-004
6. BETFAIR-SCRAPER-006/007
7. GRAPH-URL-005
8. GRAPH-URL-006
9. revisione mirata 04-betfair-graph-url-validation.md
10. checker documentali
11. aggiornamento cumulativo mappa/ledger
```

---

# Verifica prevista dopo le modifiche

## Syntax

```text
https://graphs.betfair.it/1.234567/101/0
→ valid
```

```text
http
foreign host
credential
port
wrong path
wrong view
runnerChartData
→ invalid
```

Query/fragment devono seguire il contratto scelto da `GRAPH-URL-003`.

## Market identity

```text
expected market 1.100
Graph market 1.100
→ proceed
```

```text
expected market 1.100
Graph market 1.200
→ bad_graph_url_market_mismatch
```

```text
expected market missing
→ graph_market_identity_unavailable
```

o reason equivalente approvata.

## Runner identity

```text
selection 101 unica
→ runner risolto
```

```text
selection 101 assente
→ selection_not_found
```

```text
due runner API selection 101
→ ambiguity
→ nessuna ladder assignment
```

## Scrape integration

```text
mapping failure
→ no context.new_page
→ no ladder fetch
```

```text
valid mapping + ladder
→ ladder_source graph_url
→ success++
```

```text
valid mapping + empty ladder
→ failure
→ duplicate successivo gestito secondo first-mapped policy
```

## Preflight

Dopo `PREFLIGHT-API-004`:

```text
syntax accepted by preflight
→ syntax accepted by Python parser
```

senza implicare:

```text
runner mapping riuscito
ladder disponibile
login valido
```

## Validation

Offline:

```text
invalid URL
market mismatch
selection absent
duplicate
mixed list
```

Live:

```text
real Graph page
auth
security challenge
ladder availability
recovery
```

## Historical evidence

Il documento deve citare l'artifact effettivo e non aggiungere metadata non registrati.

## Test

Mantenere:

```bash
python -m unittest -v scrapers.betfair.graph_url_test
```

e aggiungere la suite integration Graph loop.

Dopo modifiche al preflight:

```text
backend/src/routes/test/graphUrlValidation.test.mjs
backend/src/routes/test/graphUrlValidationRoute.test.mjs
```

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

## Esito dell'intervento

Completato il 10 agosto 2026. Le task `GRAPH-URL-001..007` sono state applicate: reason distinta per market identity upstream assente, selection API duplicate fail-closed, URL canonica per la navigazione, test d'integrazione del Graph loop, separazione tra verifiche deterministiche e live, provenance storica corretta e autorità del preflight chiarita.

Verifica automatica: test unitari e d'integrazione Graph URL superati; il collaudo live resta limitato agli aspetti dipendenti da browser, autenticazione e sorgente reale.

```text
04-betfair-graph-url-validation.md: OWNER BEN DELIMITATO E CORE CORRETTO

https + host Graph .it: corretto
credential/port rejection: corretto
path /market/selection/0: corretto
runnerChartData rejected: corretto
market mismatch: corretto quando market identity esiste
selection mapping: corretto quando API identity è univoca
input duplicate selection: bloccato
name/index fallback: assente
success only after ladder: corretto
failure cap/redaction: corretti
positive live Graph/ladder/matched: supportato

market identity unavailable: misclassificata
duplicate API selectionId: silent last-wins
query/fragment: mapping-ignored ma navigation-active
Graph loop integration tests: assenti
pure negative cases: troppo legati alla matrice live
mode=cdp live claim: non supportato dall'artifact canonico disponibile
preflight syntax drift: reale ma già task aperta

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: alta
```

Il principio da preservare è:

```text
Graph URL syntax
→ non basta

Graph URL syntax
+ market identity certa
+ runner identity univoca
→ mapping autorizzato
```

e il browser deve aprire soltanto un target coerente con quella identity canonica.
