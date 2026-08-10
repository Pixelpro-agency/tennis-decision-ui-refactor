# Report documentale — `docs/tennis-decision-ui/modules/python/03-betfair-scraper.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-026
Sequenza audit: 26/72
Documento analizzato: 03-betfair-scraper.md
Percorso documento: docs/tennis-decision-ui/modules/python/03-betfair-scraper.md
Percorso report: Report documentale/26 - 03-betfair-scraper.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: f9ff0f94d8e02ee96ed270bed6b574ed594332bf
Dimensione documento: 381 righe
Ruolo dichiarato: owner del package Python che acquisisce dati Betfair
Stato report: completato
```

Fonti principali confrontate:

- `scrapers/betfair/cli.py`
- `scrapers/betfair/config.py`
- `scrapers/betfair/cache.py`
- `scrapers/betfair/parsing.py`
- `scrapers/betfair/cdp_url.py`
- `scrapers/betfair/browser_session.py`
- `scrapers/betfair/scrape.py`
- `scrapers/betfair/market_api.py`
- `scrapers/betfair/ladder.py`
- `scrapers/betfair/graph_url.py`
- `scrapers/betfair/network_capture.py`
- `scrapers/betfair/diagnostic_redaction.py`
- `scrapers/betfair/config_test.py`
- `scrapers/betfair/cache_test.py`
- `scrapers/betfair/cdp_url_test.py`
- `scrapers/betfair/graph_url_test.py`
- `scrapers/betfair/diagnostic_redaction_test.py`
- `backend/src/sofa/betfairFetch.js`
- `backend/src/sofa/betfair/url.js`
- `backend/src/sofa/betfair/trackerUpdate.js`
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`
- `backend/src/routes/betfair/loginWindow.js`
- `backend/src/routes/betfair/loginWindowLifecycle.js`

Sono stati inoltre considerati i finding già aperti nei report 014, 015 e 024 per evitare task duplicate.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Modalità persistent/CDP: implementate
CDP local-only validation: robusta
Login-only distinto dal tracking: corretto
Login-only senza final JSON: corretto
Graph URL mapping: robusto e testato
Network capture live tracking disabilitata: corretto
Redazione diagnostica: robusta nelle primitive
Cache read/write redaction: implementata
APP_KEY rimossa dal sorgente: corretto

Main Betfair URL authority: troppo permissiva
Cache key: non collision-resistant
Cache identity: ignora runtime/config request
Cache hit: può bypassare ladder/capture nel CLI diretto
Cache eligibility: salva anche failure
Fresh/cached result: non identici sul piano diagnostico
network_capture.dump_dir: path locale raw nel fresh result
Network capture tasks: non tracciate/attese
Network collector: non bounded
Parent Node timeout: 90s
Child Python worst-case: può superare 90s
Finished detection: include visible-text euristico
hasFinished=true: ferma automaticamente Betfair
Graph login fallback: troppo permissivo
Security challenge ladder: può diventare no_ladder_rows
Persistent Chromium security flags: non documentati
Missing TotalMatched → zero sintetico: producer ancora presente
stdout Node unbounded: finding già aperto
Verification: incompleta
Modularizzazione: CONSIGLIATA
Modifiche nuove proposte: 10
Nuovi documenti canonici proposti: 1
Priorità complessiva: CRITICA
```

La struttura generale resta corretta:

```text
betfair_scraper.py
→ CLI
→ browser session
→ market API
→ Graph ladder opzionale
→ diagnostics
→ JSON result
→ Node processor
```

Lo scraper non possiede scheduler, persistence canonica, Evidence o UI.

---

# 1. Cache identity insufficiente

`get_cache_key(url)` deriva il nome file soltanto da:

```text
normalize_betfair_url(url)
→ sostituzione caratteri non alfanumerici
→ primi 100 caratteri
```

Non include:

```text
mode
profileDir
cdpUrl
ladderUrls
networkCapture
```

Quindi lo stesso market URL può riusare un payload prodotto da un runtime diverso.

Esempio:

```text
run A
→ persistent
→ no ladder
→ cache

run B
→ cdp
→ stessa URL
→ cache hit
→ nessuna verifica del runtime CDP richiesta
```

Nel CLI diretto:

```text
--ladder-urls
```

non forza automaticamente `--no-cache`.

Quindi una cache precedente senza ladder può impedire l'apertura delle Graph URL richieste.

Lo stesso vale per la network capture: con cache hit non viene eseguita una nuova capture anche se il CLI diretto ha capture abilitata.

La chiave regex+truncate è inoltre collision-prone e può incorporare query values leggibili nel filename.

## `BETFAIR-SCRAPER-001` — cache request identity

**Priorità:** critical

Target:

- cache key collision-resistant;
- filename opaco, senza query values leggibili;
- identity coerente con le dimensioni realmente cacheabili;
- nessun cache hit incompatibile tra mode/config differenti;
- direct CLI Graph/capture non bypassate da cache stale.

---

# 2. Cache eligibility implicita

Dopo ogni scrape:

```text
if not --no-cache
→ set_cached_result(url, results)
```

Non viene classificato il result.

Possono quindi essere cacheati:

```text
api_error
results.error
authSuspected
temporary_error
no_ladder_rows
browser failure
```

La redazione protegge i segreti ma non evita:

```text
failure transiente
→ cache
→ retry reale evitato per 4 secondi
```

Inoltre il fresh result viene stampato direttamente, mentre cache write/read applicano `redact_value()`.

Quindi fresh e cached possono differire semanticamente.

## `BETFAIR-SCRAPER-002` — cache eligibility e fresh/cached equivalence

**Priorità:** high

Definire esplicitamente:

- success cacheabile;
- partial result;
- auth failure;
- temporary error;
- finished;
- browser failure.

Fresh e cached devono mantenere lo stesso contratto pubblico.

---

# 3. `network_capture.dump_dir` espone un path locale nel fresh result

Con capture attiva, `summarize_network_capture()` restituisce:

```text
dump_dir
```

come path locale.

Il fresh result viene poi stampato direttamente dal CLI.

Questo contraddice la promessa documentale secondo cui i campi diagnostici restituiti vengono redatti prima dell'esposizione a Node.

La cache, al contrario, applica `redact_value()` e può redigere quel path.

Quindi:

```text
fresh result
≠ cached result
```

anche sotto il profilo privacy.

## `BETFAIR-SCRAPER-003` — public diagnostic envelope

**Priorità:** high

Rimuovere o redigere prima dell'output pubblico:

- dump directory;
- local paths;
- profile paths;
- log paths.

Usare una allow-list diagnostica Node-facing.

---

# 4. Network capture async lifecycle non deterministico

`install_network_capture()` usa:

```python
asyncio.create_task(handle_network_response(...))
```

ma le task non vengono:

- registrate;
- attese;
- drenate;
- bounded.

A fine scrape il codice costruisce il summary senza una barriera che garantisca la completion di tutti gli handler.

Possibili effetti:

```text
response_count incompleto
saved_count incompleto
json candidates mancanti
write ancora in corso
task cancellata alla chiusura di asyncio.run
```

Anche `responses`, `saved`, `json_payloads` ed `errors` non hanno un limite esplicito.

## `BETFAIR-SCRAPER-004` — network capture task ownership e bounds

**Priorità:** high

Introdurre:

```text
task registry
collector bounds
stop accepting new capture work
bounded drain
stable summary
```

prima del return.

---

# 5. Timeout Node/Python incoerenti

Il runner Node usa:

```text
90 secondi
```

come timeout globale del child.

Lo scraper Python può usare:

```text
main page.goto
→ fino a 60s

ogni Graph URL
→ page.goto fino a 45s
→ sleep 3s
```

Con due Graph URL:

```text
2 × 48s = 96s
```

senza contare:

- navigazione principale;
- API Betfair;
- browser setup;
- event/login detection;
- context close;
- eventuale capture drain.

Quindi il parent può terminare un child ancora dentro un timeout locale legittimo.

## `BETFAIR-SCRAPER-005` — Node/Python timeout hierarchy

**Priorità:** critical

Definire una deadline coerente per:

- main navigation;
- market API;
- Graph URL count;
- ladder navigation;
- capture drain;
- whole scrape.

Invariante:

```text
child expected worst-case
<
parent deadline
```

oppure usare una deadline condivisa.

---

# 6. `hasFinished` è troppo forte rispetto alla sua provenienza

`detect_betfair_event_status()` usa segnali forti come:

```text
span.match-finished
.tennis-header.finished
```

ma possiede anche un fallback:

```text
.sports-header
.tennis-header
.inplay-info
→ visible text contiene
finito / finished / terminato
```

Questo produce comunque:

```text
hasFinished = true
```

Il tracker Node tratta qualunque `hasFinished === true` come stop automatico del polling Betfair.

Non distingue la source.

Quindi un weak visible-text hint può diventare decisione terminale.

## `BETFAIR-SCRAPER-006` — authoritative finished detection

**Priorità:** critical

Distinguere:

```text
authoritative_finished
weak_finished_hint
unknown
```

oppure riservare `hasFinished:true` soltanto a prove approvate.

Il progetto deve continuare a fermare automaticamente Betfair soltanto per fine match reale.

---

# 7. Auth fallback e security challenge non sono distinti abbastanza

Il fallback login-required è vero quando:

```text
no rows
+
pagina breve
+
almeno una parola fra:
accesso / login / grafico / mercato
```

Una sola parola generica come:

```text
mercato
```

può quindi produrre `authSuspected`.

Lo scraper poi interrompe il loop delle Graph URL.

Inoltre `ladder.py` riconosce marker security/Cloudflare ma restituisce soltanto:

```text
ladder:[]
```

senza `error_reason`.

Il caller lo classifica quindi come:

```text
no_ladder_rows
```

anziché security challenge.

## `BETFAIR-SCRAPER-007` — auth/security/no-data classifier

**Priorità:** high

Separare:

```text
auth_required
security_challenge
no_ladder_rows
temporary_error
```

e rendere più forte il fallback login.

---

# 8. Browser persistent avviato con security flags non documentati

`browser_session.py` usa:

```text
--no-sandbox
--disable-setuid-sandbox
--ignore-certificate-errors
```

Il documento non spiega perché siano necessari.

In particolare:

```text
--ignore-certificate-errors
```

riduce la verifica TLS del browser che contiene login, cookie e site storage Betfair.

## `BETFAIR-SCRAPER-008` — browser security flags

**Priorità:** high

Per ogni flag:

```text
necessità reale
ambiente richiesto
test live
```

Rimuovere i default non necessari o renderli opt-in quando tecnicamente appropriato.

---

# 9. Verification matrix incompleta

Il documento esegue:

```text
config_test
diagnostic_redaction_test
cache_test
```

ma omette due suite esistenti importanti:

```text
cdp_url_test
graph_url_test
```

Non risultano invece suite dirette:

```text
scrape_test.py
browser_session_test.py
network_capture_test.py
```

Restano quindi scoperti direttamente:

- finished classifier;
- persistent browser flags;
- network capture task lifecycle;
- cache/runtime identity;
- fresh diagnostic path exposure;
- timeout hierarchy.

## `BETFAIR-SCRAPER-009` — verification matrix

**Priorità:** high

Includere sempre:

```text
config_test
diagnostic_redaction_test
cache_test
cdp_url_test
graph_url_test
```

e aggiungere test per scrape/browser/network capture.

Coordinare la parte Node con `BETFAIR-LIFE-011`.

---

# 10. Main Betfair URL validator

`normalize_betfair_url()` rimuove alcuni query parameter ma non valida:

- host;
- scheme;
- path.

`extract_event_id()` cerca la prima sequenza di almeno cinque cifre nella URL.

Il CLI Python non possiede quindi una strong authority autonoma sulla Betfair main URL.

Questo problema è già aperto in:

```text
BETFAIR-LIFE-007
```

e nei finding API/Preflight collegati.

Non viene creato un nuovo ID duplicato.

La futura shared validator deve essere usata anche da questo CLI.

---

# 11. Missing matched → zero già nel producer Python

`market_api.py` usa:

```text
marketTotal = 0
state.get("totalMatched", 0)
```

e formatta quei valori.

Quindi:

```text
dato assente
→ EUR 0.00
```

può nascere già nel producer Python.

Il problema è già aperto come:

```text
TECH-SAMPLE-003
DATA-001
```

La task esistente deve includere `scrapers/betfair/market_api.py`.

Nessun nuovo ID duplicato.

---

# 12. stdout unbounded già aperto

Il runner Node accumula stdout Python senza limite.

Il problema è già posseduto da:

```text
BETFAIR-LIFE-010
BETFAIR-LIFE-011
```

Non viene duplicato.

---

# 13. APP_KEY viene risolta anche per login-only

`cli.py` importa `cache`, che importa `config`.

`config.py` esegue a import time:

```text
APP_KEY = resolve_betfair_app_key()
```

Quindi anche `--login-only`, pur non usando `fetch_market_data_api()`, richiede una APP_KEY risolvibile.

`cdp_url_test.py` deve infatti impostare una key fittizia prima di importare il CLI.

Il documento non promette esplicitamente login-only senza APP_KEY, quindi non viene aperta una task autonoma.

Va però chiarito nel contratto CLI oppure reso lazy se si vuole indipendenza.

Coordinare con `PY-RUNTIME-001`.

---

# Elementi corretti da preservare

## CDP

La validazione accetta soltanto:

```text
http
127.0.0.1 / localhost / ::1
porta esplicita
nessuna credential
nessuna query
nessun fragment
```

Non esiste fallback implicito a 9222.

## CDP ownership

Il context CDP viene lasciato aperto.

Lo scraper possiede il Python child, non Chrome.

## Login-only

Usa ruolo processuale distinto `betfair_login`.

Stop tracking non lo termina; shutdown backend scope all sì.

## Graph URL

Il parser richiede:

```text
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

e controlla:

- market mismatch;
- selectionId;
- duplicate runner;
- unsupported runnerChartData.

La suite `graph_url_test.py` è coerente.

## Redazione

Le primitive coprono:

- app key;
- Authorization;
- Cookie;
- bearer;
- nested JSON;
- query sensitive;
- Windows/UNC/POSIX paths;
- control characters;
- bounded text.

I test usano marker fittizi.

---

# Modularizzazione

Il documento ha 381 righe, ma il motivo dello split non è la lunghezza.

Contiene due owner reali:

```text
A. core Betfair scraper
B. diagnostics/security capture
```

Il secondo owner comprende:

```text
network_capture.py
diagnostic_redaction.py
logger diagnostic contract
dump thresholds
capture lifecycle
sensitive-data policy
diagnostic tests
```

La network capture è inoltre disabilitata nel tracking live normale, quindi non è necessaria per capire il core acquisition path.

Il documento contiene anche due sezioni parzialmente duplicate:

```text
Hardening diagnostico
Redazione diagnostica
```

Struttura proposta:

```text
03-betfair-scraper.md
→ core scraper/facade

04-betfair-graph-url-validation.md
→ resta owner Graph URL

05-betfair-diagnostics-and-network-capture.md
→ nuovo owner diagnostics/capture
```

## `BETFAIR-SCRAPER-010` — modularizzazione diagnostics/capture

**Priorità:** medium

Task operativa:

- mantenere `03-*` core/facade;
- creare `docs/tennis-decision-ui/modules/python/05-betfair-diagnostics-and-network-capture.md`;
- spostare Network Capture, Hardening e Redazione;
- non duplicare Graph URL;
- ridurre lo storico `9B` a riferimento verso validation owner;
- aggiornare index/link/owner map;
- eseguire link checker.

```text
modularization_reviewed: true
split_required: true
split_recommended: true
proposed_files:
  - docs/tennis-decision-ui/modules/python/05-betfair-diagnostics-and-network-capture.md
```

La modularizzazione è una vera task da registrare nella mappa/ledger.

---

# Riferimenti per mappa e JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-026
Percorso report: Report documentale/26 - 03-betfair-scraper.md
Documento: docs/tennis-decision-ui/modules/python/03-betfair-scraper.md
Change ID: BETFAIR-SCRAPER-001
Change ID: BETFAIR-SCRAPER-002
Change ID: BETFAIR-SCRAPER-003
Change ID: BETFAIR-SCRAPER-004
Change ID: BETFAIR-SCRAPER-005
Change ID: BETFAIR-SCRAPER-006
Change ID: BETFAIR-SCRAPER-007
Change ID: BETFAIR-SCRAPER-008
Change ID: BETFAIR-SCRAPER-009
Change ID: BETFAIR-SCRAPER-010
Suddivisione richiesta/consigliata: sì
Nuovi file canonici proposti: 1
```

Dipendenze già aperte da non duplicare:

```text
BETFAIR-LIFE-003
BETFAIR-LIFE-004
BETFAIR-LIFE-005
BETFAIR-LIFE-007
BETFAIR-LIFE-010
BETFAIR-LIFE-011
TECH-SAMPLE-003
DATA-001
PY-RUNTIME-001
IMPL-006
```

Al prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ indice 26 ANALIZZATO
→ Divisione consigliata/richiesta
→ BETFAIR-SCRAPER-001..010
→ BETFAIR-SCRAPER-010 come task [ ] operativa
→ proposed file registrato ma non inserito nell'inventario finché non creato

modifiche-audit-markdown.json
→ append TDUI-DOC-REPORT-026
→ append BETFAIR-SCRAPER-001..010
→ split_required:true
→ proposed_files con il nuovo percorso
```

---

# Modifiche proposte

```text
BETFAIR-SCRAPER-001  critical  cache request identity
BETFAIR-SCRAPER-002  high      cache eligibility
BETFAIR-SCRAPER-003  high      public diagnostic envelope
BETFAIR-SCRAPER-004  high      network capture async ownership
BETFAIR-SCRAPER-005  critical  Node/Python timeout hierarchy
BETFAIR-SCRAPER-006  critical  authoritative finished detection
BETFAIR-SCRAPER-007  high      auth/security/no-data classifier
BETFAIR-SCRAPER-008  high      browser security flags
BETFAIR-SCRAPER-009  high      verification matrix
BETFAIR-SCRAPER-010  medium    modularizzazione diagnostics/capture
```

---

# Ordine consigliato

```text
1. BETFAIR-SCRAPER-006
2. BETFAIR-SCRAPER-005
3. BETFAIR-SCRAPER-001
4. BETFAIR-SCRAPER-002
5. BETFAIR-SCRAPER-004
6. BETFAIR-SCRAPER-003
7. BETFAIR-SCRAPER-007
8. BETFAIR-SCRAPER-008
9. BETFAIR-LIFE-007
10. TECH-SAMPLE-003 / DATA-001
11. BETFAIR-LIFE-010
12. BETFAIR-SCRAPER-009
13. BETFAIR-SCRAPER-010
14. revisione finale del documento core
15. checker documentali
16. aggiornamento cumulativo mappa/ledger
```

---

# Verifica prevista dopo le modifiche

## Cache

```text
same URL + stessa request identity
→ hit

same URL + ladder/config differente
→ no incompatible hit

query sensibile/lunga
→ filename opaco
```

## Capture

```text
response task lenta
→ bounded drain
→ summary stabile

fresh result
→ nessun local path

cached result
→ stessa privacy semantics
```

## Timeout

```text
child entro budget
→ parent non termina prematuramente

deadline reale
→ scraper_timeout bounded
→ owned child termination
→ physical completion
```

## Finished

```text
selector forte
→ finished

testo generico "set terminato"
→ non full-match finished

weak visible text
→ non automatic stop
```

## Auth / Graph

```text
primary login text
→ auth_required

solo "mercato" senza rows
→ evidenza insufficiente

Cloudflare/security
→ security_challenge

ladder realmente vuota
→ no_ladder_rows
```

## Test Python

Eseguire almeno:

```powershell
python -m unittest -v scrapers.betfair.config_test
python -m unittest -v scrapers.betfair.diagnostic_redaction_test
python -m unittest -v scrapers.betfair.cache_test
python -m unittest -v scrapers.betfair.cdp_url_test
python -m unittest -v scrapers.betfair.graph_url_test
```

Aggiungere suite owner per scrape/browser/network capture.

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

Completato il 10 agosto 2026. Le task `BETFAIR-SCRAPER-001..010` sono state applicate e verificate: cache SHA-256 legata all'identità della richiesta, eligibility esplicita, risultato pubblico senza path locali, capture bounded con drain, timeout Python/Node coordinati, finished authoritative, classificazione Graph distinta, flag Chromium indebolenti rimossi, matrice di test ampliata e documentazione diagnostica separata in `05-betfair-diagnostics-and-network-capture.md`.

Verifica automatica: 56 test Python Betfair, compilazione dei moduli modificati e suite Node `scraperLifecycle.test.mjs` superati. Il collaudo live del browser resta una verifica ambientale, non simulabile dalla suite locale.

```text
03-betfair-scraper.md: CORE SOLIDO, CACHE/FINISHED/CAPTURE/TIMEOUT DA IRROBUSTIRE

persistent mode: corretto
CDP mode: corretto
CDP validation: robusta
login-only separation: corretta
Graph mapping: robusto
live network capture disabled: corretto
redaction primitives: robuste
cache redaction: implementata
APP_KEY source secret removal: corretto

cache identity: insufficiente
cache filename secrecy: insufficiente
cache request dimensions: insufficienti
cache failure eligibility: implicita
capture direct CLI + cache: ambigua
dump_dir fresh result: path raw
capture task drain: assente
collector bounds: assenti
90s parent vs child worst-case: incoerente
finished visible-text fallback: troppo forte
auth fallback: troppo permissivo
security challenge: no_ladder_rows
browser security flags: non documentati
missing matched → zero: finding già aperto
stdout bound: finding già aperto
verification: incompleta

Riscrittura completa: no
Modularizzazione: sì, consigliata
Nuovi documenti canonici proposti: 1
Priorità complessiva: critica
```

Regole centrali:

```text
cache hit
→ semanticamente equivalente alla richiesta corrente
```

```text
automatic Betfair stop
→ soltanto su finished sufficientemente authoritative
```

```text
diagnostics
→ bounded
→ redacted
→ drained
→ nessun path locale nel result pubblico
```
