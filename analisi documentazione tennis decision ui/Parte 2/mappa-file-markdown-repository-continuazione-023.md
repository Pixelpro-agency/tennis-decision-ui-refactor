# Mappa e stato dell’audit dei file Markdown — Continuazione

**ID mappa:** `TDUI-MD-AUDIT-MAP-002`  
**Repository:** `Pixelpro-agency/tennis-decision-ui-refactor`  
**Branch:** `main`  
**Commit censito:** `4c5f43b007149f3210c27d7565357a447a3a6ef4`  
**Aggiornato:** `2026-08-09T23:09:00+02:00`  
**Continua da:** `mappa-file-markdown-repository.md` — segmento congelato al `TDUI-DOC-REPORT-022`.

Questo è il **secondo segmento** della mappa. Non duplica report, task e inventario storico `1–22`; da qui in avanti registra l’ordine residuo e le nuove modifiche.

## Significato di analizzare un documento

```text
analizzare un documento
→ verificarne la coerenza con il progetto
→ rilevare incongruenze e modifiche necessarie
→ valutarne lunghezza e integrità del contesto
→ distinguere compiti e argomenti diversi
→ stabilire se conviene modularizzarlo per responsabilità e owner
```

La valutazione della modularizzazione è obbligatoria per ogni documento. Un file non viene diviso soltanto perché è lungo: la divisione deve essere giustificata da compiti, argomenti, responsabilità, contratti, owner o contesti minimi differenti.

## Ordine canonico dell’audit

Il primo segmento conserva gli indici `1–22`. Questa continuazione è l’autorità per l’ordine residuo `23–72`.

- ultimo indice analizzato: **47**;
- prossimo indice: **48**;
- prossimo documento: **`implementazioni/04-task-completate.md`**.

## Struttura di archiviazione

```txt
analisi documentazione tennis decision ui/
├── mappa-file-markdown-repository.md                       # segmento 1 fino a 022
├── modifiche-audit-markdown.json                           # ledger segmento 1 fino a 022
├── mappa-file-markdown-repository-continuazione-023.md    # segmento 2
├── modifiche-audit-markdown-continuazione-023.json        # ledger segmento 2
└── Report documentale/
    ├── 23 - 04-match-context-ui.md
    ├── 24 - 01-entrypoints-and-runtime.md
    ├── 25 - 02-sofascore-scraper.md
    ├── 26 - 03-betfair-scraper.md
    ├── 27 - 04-betfair-graph-url-validation.md
    ├── 28 - 01-live-tracking.md
    ├── 29 - 02-local-context-and-point-by-point.md
    ├── 30 - 01-timelines-and-history.md
    ├── 31 - 02-commit-journal-and-recovery.md
    ├── 32 - 01-local-runtime.md
    ├── 33 - 02-live-tracking-control.md
    ├── 34 - 03-betfair-diagnostics.md
    ├── 35 - 04-validation-and-rollback.md
    ├── 36 - 05-retention-and-cleanup.md
    ├── 37 - 01-repository-map.md
    ├── 38 - 01-current-state.md
    ├── 39 - README-validations.md
    ├── 40 - betfair-live-validation-2026-07-04.md
    ├── 41 - documentation-migration-finalization-2026-08-03.md
    ├── 42 - source-identity-live-verification.md
    ├── 43 - implementazioni-tennis-decision-ui.md
    ├── 44 - 00-metodo-e-stati.md
    ├── 45 - 01-piano-generale-audit.md
    ├── 46 - 02-audit-documentazione.md
    └── 47 - 03-audit-codice.md
```

I file del segmento precedente restano congelati. Questa continuazione registra soltanto report e task dal 023 in avanti, mantenendo i contatori cumulativi dell’intero audit.

## Stato dell’analisi

- file Markdown totali: **72**;
- file analizzati: **47**;
- file ancora da analizzare: **25**;
- avanzamento: **65,28%**;
- ultimo file analizzato: **`implementazioni/03-audit-codice.md`**;
- ultimo report: **`TDUI-DOC-REPORT-047`**;
- percorso report: **`Report documentale/47 - 03-audit-codice.md`**;
- task di modifica complessive note: **320**;
- task completate: **130**;
- task contenute in questa continuazione: **139**;
- task precedenti non duplicate: **181**.

## Report disponibili in questa continuazione

| Sequenza | Documento | Report ID | Percorso | Modularizzazione |
| ---: | --- | --- | --- | --- |
| 23 | `docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md` | `TDUI-DOC-REPORT-023` | [`Report documentale/23 - 04-match-context-ui.md`](../Report%20documentale/23%20-%2004-match-context-ui.md) | Divisione non necessaria |
| 24 | `docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md` | `TDUI-DOC-REPORT-024` | [`Report documentale/24 - 01-entrypoints-and-runtime.md`](../Report%20documentale/24%20-%2001-entrypoints-and-runtime.md) | Divisione non necessaria |
| 25 | `docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md` | `TDUI-DOC-REPORT-025` | [`Report documentale/25 - 02-sofascore-scraper.md`](../Report%20documentale/25%20-%2002-sofascore-scraper.md) | Divisione non necessaria |
| 26 | `docs/tennis-decision-ui/modules/python/03-betfair-scraper.md` | `TDUI-DOC-REPORT-026` | [`Report documentale/26 - 03-betfair-scraper.md`](../Report%20documentale/26%20-%2003-betfair-scraper.md) | Divisione eseguita |
| 27 | `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md` | `TDUI-DOC-REPORT-027` | [`Report documentale/27 - 04-betfair-graph-url-validation.md`](../Report%20documentale/27%20-%2004-betfair-graph-url-validation.md) | Divisione non necessaria |
| 28 | `docs/tennis-decision-ui/modules/sofa/01-live-tracking.md` | `TDUI-DOC-REPORT-028` | [`Report documentale/28 - 01-live-tracking.md`](../Report%20documentale/28%20-%2001-live-tracking.md) | Divisione non necessaria |
| 29 | `docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md` | `TDUI-DOC-REPORT-029` | [`Report documentale/29 - 02-local-context-and-point-by-point.md`](../Report%20documentale/29%20-%2002-local-context-and-point-by-point.md) | Divisione non necessaria |
| 30 | `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md` | `TDUI-DOC-REPORT-030` | [`Report documentale/30 - 01-timelines-and-history.md`](../Report%20documentale/30%20-%2001-timelines-and-history.md) | Revisione mirata verificata; divisione eseguita |
| 31 | `docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md` | `TDUI-DOC-REPORT-031` | [`Report documentale/31 - 02-commit-journal-and-recovery.md`](../Report%20documentale/31%20-%2002-commit-journal-and-recovery.md) | Revisione mirata verificata; divisione eseguita |
| 32 | `docs/tennis-decision-ui/operations/01-local-runtime.md` | `TDUI-DOC-REPORT-032` | [`Report documentale/32 - 01-local-runtime.md`](../Report%20documentale/32%20-%2001-local-runtime.md) | Divisione non necessaria |
| 33 | `docs/tennis-decision-ui/operations/02-live-tracking-control.md` | `TDUI-DOC-REPORT-033` | [`Report documentale/33 - 02-live-tracking-control.md`](../Report%20documentale/33%20-%2002-live-tracking-control.md) | Divisione non necessaria |
| 34 | `docs/tennis-decision-ui/operations/03-betfair-diagnostics.md` | `TDUI-DOC-REPORT-034` | [`Report documentale/34 - 03-betfair-diagnostics.md`](../Report%20documentale/34%20-%2003-betfair-diagnostics.md) | Divisione non necessaria |
| 35 | `docs/tennis-decision-ui/operations/04-validation-and-rollback.md` | `TDUI-DOC-REPORT-035` | [`Report documentale/35 - 04-validation-and-rollback.md`](../Report%20documentale/35%20-%2004-validation-and-rollback.md) | Divisione non necessaria |
| 36 | `docs/tennis-decision-ui/operations/05-retention-and-cleanup.md` | `TDUI-DOC-REPORT-036` | [`Report documentale/36 - 05-retention-and-cleanup.md`](../Report%20documentale/36%20-%2005-retention-and-cleanup.md) | Divisione non necessaria |
| 37 | `docs/tennis-decision-ui/reference/01-repository-map.md` | `TDUI-DOC-REPORT-037` | [`Report documentale/37 - 01-repository-map.md`](../Report%20documentale/37%20-%2001-repository-map.md) | Divisione non necessaria |
| 38 | `docs/tennis-decision-ui/roadmap/01-current-state.md` | `TDUI-DOC-REPORT-038` | [`Report documentale/38 - 01-current-state.md`](../Report%20documentale/38%20-%2001-current-state.md) | Divisione non necessaria |
| 39 | `docs/validations/README.md` | `TDUI-DOC-REPORT-039` | [`Report documentale/39 - README-validations.md`](../Report%20documentale/39%20-%20README-validations.md) | Divisione non necessaria |
| 40 | `docs/validations/betfair-live-validation-2026-07-04.md` | `TDUI-DOC-REPORT-040` | [`Report documentale/40 - betfair-live-validation-2026-07-04.md`](../Report%20documentale/40%20-%20betfair-live-validation-2026-07-04.md) | Divisione non necessaria |
| 41 | `docs/validations/documentation-migration-finalization-2026-08-03.md` | `TDUI-DOC-REPORT-041` | [`Report documentale/41 - documentation-migration-finalization-2026-08-03.md`](../Report%20documentale/41%20-%20documentation-migration-finalization-2026-08-03.md) | Divisione non necessaria |
| 42 | `docs/validations/source-identity-live-verification.md` | `TDUI-DOC-REPORT-042` | [`Report documentale/42 - source-identity-live-verification.md`](../Report%20documentale/42%20-%20source-identity-live-verification.md) | Divisione non necessaria |
| 43 | `implementazioni-tennis-decision-ui.md` | `TDUI-DOC-REPORT-043` | [`Report documentale/43 - implementazioni-tennis-decision-ui.md`](../Report%20documentale/43%20-%20implementazioni-tennis-decision-ui.md) | Divisione non necessaria |
| 44 | `implementazioni/00-metodo-e-stati.md` | `TDUI-DOC-REPORT-044` | [`Report documentale/44 - 00-metodo-e-stati.md`](../Report%20documentale/44%20-%2000-metodo-e-stati.md) | Divisione non necessaria |
| 45 | `implementazioni/01-piano-generale-audit.md` | `TDUI-DOC-REPORT-045` | [`Report documentale/45 - 01-piano-generale-audit.md`](../Report%20documentale/45%20-%2001-piano-generale-audit.md) | Divisione non necessaria |
| 46 | `implementazioni/02-audit-documentazione.md` | `TDUI-DOC-REPORT-046` | [`Report documentale/46 - 02-audit-documentazione.md`](../Report%20documentale/46%20-%2002-audit-documentazione.md) | Divisione non necessaria |
| 47 | `implementazioni/03-audit-codice.md` | `TDUI-DOC-REPORT-047` | [`Report documentale/47 - 03-audit-codice.md`](../Report%20documentale/47%20-%2003-audit-codice.md) | Divisione non necessaria |

## Modifiche da applicare

### `docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md`

Report: [`Report documentale/23 - 04-match-context-ui.md`](../Report%20documentale/23%20-%2004-match-context-ui.md) — `TDUI-DOC-REPORT-023`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`MATCH-CONTEXT-001`** — priorità `medium` — Copy corretto: il contesto è calcolato dal backend sui dati SofaScore; il frontend valida e formatta senza nuovi calcoli sportivi.
- [x] **`MATCH-CONTEXT-002`** — priorità `high` — Validata la coerenza di percentuali, punti/totalPoints, recent window e comparison; ogni incoerenza degrada a unavailable senza clamp, fallback o ricalcolo visualizzato.
- [x] **`MATCH-CONTEXT-003`** — priorità `high` — Il backend preserva `unsupported_or_ambiguous_score_transition` dalla decodifica alla reason canonica, con test dedicati.
- [x] **`MATCH-CONTEXT-004`** — priorità `medium` — Documentate availability indipendenti per match, recent e comparison, oltre al ruolo di `dataQuality.level`; corretto il wording globale degli stati unavailable.
- [x] **`MATCH-CONTEXT-005`** — priorità `medium` — `observedShift` documentato come cambio del lato leader, distinto dai delta percentuali e senza semantica di trend.
- [x] **`MATCH-CONTEXT-006`** — priorità `medium` — Il consumer accetta soltanto il contratto canonico `version: 1`, `source: project-calculated`, `purpose: descriptive-match-context`; ogni contratto diverso degrada a unavailable.
- [x] **`MATCH-CONTEXT-007`** — priorità `high` — Aggiunti test component-level di MatchContextCard e test backend sulla propagazione della reason recent.

### `docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md`

Report: [`Report documentale/24 - 01-entrypoints-and-runtime.md`](../Report%20documentale/24%20-%2001-entrypoints-and-runtime.md) — `TDUI-DOC-REPORT-024`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`PY-RUNTIME-001`** — priorità `high` — Distinti e testati i contratti Sofa scrape, Betfair scrape e Betfair login-only; stdout JSON resta result channel soltanto nelle modalità scrape.
- [x] **`PY-RUNTIME-002`** — priorità `high` — Il logger SofaScore riusa la redazione bounded, mantenendo diagnostica su stderr e payload pubblici statici.
- [x] **`PY-RUNTIME-003`** — priorità `critical` — Stdout SofaScore limitato a 2 MiB; overflow azzera il buffer, termina il child owned e restituisce un errore statico.
- [x] **`PY-RUNTIME-004`** — priorità `critical` — Grace launcher portata a 8 secondi, oltre il budget backend di 6 secondi, con test dell'invariante.
- [x] **`PY-RUNTIME-005`** — priorità `high` — `write_manifest` propaga le failure I/O dopo il cleanup; testate creazione e replace fallite e conversione bounded nei percorsi safe.
- [x] **`PY-RUNTIME-006`** — priorità `high` — Formalizzati `starting/ready/unavailable`; aggiunti tre probe bounded post-helper e test delayed-ready/never-ready.
- [x] **`PY-RUNTIME-007`** — priorità `high` — Documentati separatamente probe e bind loopback; verificato il bind backend corrente su `127.0.0.1` introdotto dall'owner approvato.
- [x] **`PY-RUNTIME-008`** — priorità `low` — Direct Node start confermato come authority launcher; `start-backend-dev.ps1` classificato come helper manuale, non dipendenza runtime.
- [x] **`PY-RUNTIME-009`** — priorità `medium` — Definiti i confini: questo file possiede i contratti tecnici Python/launcher, Operations possiede il runbook e Validations le evidenze live.
- [x] **`PY-RUNTIME-010`** — priorità `high` — Estesa la matrice test a CLI mode, redazione Sofa, stdout overflow, manifest failure, CDP provisional, timeout shutdown e bind locale.

### `docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md`

Report: [`Report documentale/25 - 02-sofascore-scraper.md`](../Report%20documentale/25%20-%2002-sofascore-scraper.md) — `TDUI-DOC-REPORT-025`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`SOFA-SCRAPER-001`** — priorità `high` — Introdotta authority canonica HTTPS con host/path/eventId ammessi; input esterni o con componenti non autorizzati sono rifiutati prima del browser.
- [x] **`SOFA-SCRAPER-002`** — priorità `high` — Una invocazione accetta una match URL espandibile oppure endpoint API dello stesso eventId; mixed-event e multiple match URL sono rifiutati.
- [x] **`SOFA-SCRAPER-003`** — priorità `high` — Cache identity sostituita con SHA-256 della lista URL canonica serializzata deterministicamente.
- [x] **`SOFA-SCRAPER-004`** — priorità `high` — Cache limitata ai successi completi; failure e cache corrotte/non eleggibili diventano miss senza raw diagnostics persistite.
- [x] **`SOFA-SCRAPER-005`** — priorità `high` — Definita gerarchia 30s navigazione, 60s challenge, 15s endpoint, 105s Python e 120s parent Node.
- [x] **`SOFA-SCRAPER-006`** — priorità `high` — Allineato al runtime condiviso: stdout limitato a 2 MiB, stderr redatto/bounded e overflow con errore statico e terminazione owned.
- [x] **`SOFA-SCRAPER-007`** — priorità `medium` — Documentati persistenza, ownership locale, assenza di cleanup automatico, concorrenza manuale e privacy di `scraper_profile`, distinto dalla cache.
- [x] **`SOFA-SCRAPER-008`** — priorità `medium` — Challenge ancora presente dopo il budget produce `challenge_unresolved` e interrompe il fetch endpoint.
- [x] **`SOFA-SCRAPER-009`** — priorità `high` — Failure Python uniformate a `ok:false` con code/message bounded e status HTTP opzionale; nessuna raw exception nel result.
- [x] **`SOFA-SCRAPER-010`** — priorità `high` — Aggiunta matrice Python per URL, cache, output e timeout; mantenuti i test Node su overflow e lifecycle.

### `docs/tennis-decision-ui/modules/python/03-betfair-scraper.md`

Report: [`Report documentale/26 - 03-betfair-scraper.md`](../Report%20documentale/26%20-%2003-betfair-scraper.md) — `TDUI-DOC-REPORT-026`.

Modularizzazione: **eseguita**. File creati: `docs/tennis-decision-ui/modules/python/05-betfair-diagnostics-and-network-capture.md`.

- [x] **`BETFAIR-SCRAPER-001`** — priorità `critical` — Cache key collision-resistant, opaca e coerente con request/runtime; impedire hit incompatibili e bypass Graph/capture.
- [x] **`BETFAIR-SCRAPER-002`** — priorità `high` — Definire cache eligibility e equivalenza fresh/cached; evitare retry suppression implicita di failure transitorie.
- [x] **`BETFAIR-SCRAPER-003`** — priorità `high` — Rimuovere/redigere `network_capture.dump_dir` e path locali dal result pubblico; allow-list diagnostica.
- [x] **`BETFAIR-SCRAPER-004`** — priorità `high` — Tracciare task async capture, bounded collector e drain bounded prima del summary/return.
- [x] **`BETFAIR-SCRAPER-005`** — priorità `critical` — Coordinare timeout Node 90s con budget Python main/Graph/capture/cleanup; nessun kill prematuro del child.
- [x] **`BETFAIR-SCRAPER-006`** — priorità `critical` — Weak visible-text finished hint non deve produrre auto-stop; `hasFinished` solo da evidenza authoritative.
- [x] **`BETFAIR-SCRAPER-007`** — priorità `high` — Separare `auth_required`, `security_challenge`, `no_ladder_rows`, `temporary_error`; rafforzare fallback login/break policy.
- [x] **`BETFAIR-SCRAPER-008`** — priorità `high` — Verificare e minimizzare `--ignore-certificate-errors`, `--no-sandbox`, `--disable-setuid-sandbox`; test live prima di cambiare.
- [x] **`BETFAIR-SCRAPER-009`** — priorità `high` — Includere `cdp_url_test`/`graph_url_test` e aggiungere test scrape/browser/network capture, finished/login/cache/timeout.
- [x] **`BETFAIR-SCRAPER-010`** — priorità `medium` — Mantenere `03-*` core/facade e creare `05-betfair-diagnostics-and-network-capture.md`; spostare capture/redaction/logger/dump policy/test e aggiornare link.

### `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md`

Report: [`Report documentale/27 - 04-betfair-graph-url-validation.md`](../Report%20documentale/27%20-%2004-betfair-graph-url-validation.md) — `TDUI-DOC-REPORT-027`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`GRAPH-URL-001`** — priorità `high` — Distinguere market identity upstream assente/invalid da vero `bad_graph_url_market_mismatch`.
- [x] **`GRAPH-URL-002`** — priorità `high` — Rilevare selectionId duplicate nel payload API e fail-closed sull'identità ambigua; coordinare `TECH-SAMPLE-002`.
- [x] **`GRAPH-URL-003`** — priorità `medium` — Definire canonical Graph URL: reject query/fragment oppure canonical navigation URL usata dal browser.
- [x] **`GRAPH-URL-004`** — priorità `high` — Aggiungere test integration del Graph loop per page skip, contatori, assignment, empty/error, duplicate reservation e mixed list.
- [x] **`GRAPH-URL-005`** — priorità `medium` — Separare verification deterministica da live observation: parser/mapping offline, live solo browser/source-dependent.
- [x] **`GRAPH-URL-006`** — priorità `medium` — Linkare l'artifact storico effettivo e non dichiarare `mode=cdp reale` senza evidenza archiviata.
- [x] **`GRAPH-URL-007`** — priorità `medium` — Aggiornare insieme a `PREFLIGHT-API-004`: grammatica condivisa; market/runner/ladder mapping resta runtime Python.


### `docs/tennis-decision-ui/modules/sofa/01-live-tracking.md`

Report: [`Report documentale/28 - 01-live-tracking.md`](../Report%20documentale/28%20-%2001-live-tracking.md) — `TDUI-DOC-REPORT-028`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`SOFA-LIVE-001`** — priorità `critical` — Rendere esplicita la differenza fra trackedMatches membership, Python generation, Source Identity bufferGeneration e tracking session authority; applicare IMPL-006 e coprire Stop/new Start same-event ed event switch con callback in-flight.
- [x] **`SOFA-LIVE-002`** — priorità `critical` — Verificare il ritorno di trackMatch nella route Start: nessun HTTP 200 ok:true se il tracker rifiuta l'attivazione; introdurre esito bounded e test terminal barrier.
- [x] **`SOFA-LIVE-003`** — priorità `critical` — Distinguere stop logico da cleanup fisico; remaining process o cleanup failure non devono produrre un falso successo complessivo; preservare betfair_login e coordinare FRONT-SESSION-007.
- [x] **`SOFA-LIVE-004`** — priorità `critical` — Rendere il cleanup mismatch fisicamente completo e osservabile per i child tracking Sofa/Betfair, preservando login e Chrome/CDP; un nuovo Start non deve restare bloccato da un vecchio Sofa child.
- [x] **`SOFA-LIVE-005`** — priorità `high` — Correggere la semantica del technical sample: nessun nuovo sample-derived canonical tick, ma repairOnly di un commit precedente resta consentito; riallineare anche la frase su getBetfairTrackingKey e coordinare TECH-SAMPLE-004.
- [x] **`SOFA-LIVE-006`** — priorità `high` — Rendere bounded e redatta la diagnostica tecnica Betfair end-to-end, usare runtime logger strutturato al posto di detail raw/console.log e verificare che /latest health non esponga URL, path o token.
- [x] **`SOFA-LIVE-007`** — priorità `critical` — Qualificare l'auto-stop Betfair: hasFinished ricevuto non equivale a finished authoritative finché BETFAIR-SCRAPER-006 non irrobustisce il producer; weak hint non deve fermare il tracking.
- [x] **`SOFA-LIVE-008`** — priorità `medium` — Documentare 5s/6s come minimum delay dopo completion e distinguere scheduler completion da scrape attempt, successful scrape, canonical tick e commit timestamp.
- [x] **`SOFA-LIVE-009`** — priorità `high` — Correggere i path test stale, aggiungere coverage per Start/Stop/mismatch/session race/repairOnly/redaction/finished/scheduler e spostare le osservazioni live in artifact di validation con provenance.

### `docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md`

Report: [`Report documentale/29 - 02-local-context-and-point-by-point.md`](../Report%20documentale/29%20-%2002-local-context-and-point-by-point.md) — `TDUI-DOC-REPORT-029`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`LOCAL-PBP-001`** — priorità `high` — Non equiparare automaticamente highest (set,game) al game corrente: validare la proprietà sul source contract e usare excludedCurrentGame:true soltanto con evidence; fail-closed se il current game non è identificabile.
- [x] **`LOCAL-PBP-002`** — priorità `high` — Definire dal provider reale integer semantics e uniqueness della coppia (set,game); rifiutare duplicati confliggenti e valori strutturalmente non canonici.
- [x] **`LOCAL-PBP-003`** — priorità `high` — Definire il domain contract di ALL/pointsTotal: tipo/formato realmente prodotto, conteggi interi, gestione duplicati e distinzione zero reale da valore non valido.
- [x] **`LOCAL-PBP-004`** — priorità `high` — Qualificare localContext.dataQuality complete come completezza derivativa e non come freshness, provenance o temporal alignment verificati; mantenere separati gli assi di qualità.
- [x] **`LOCAL-PBP-005`** — priorità `critical` — Classificare POST /api/match/analyze e /snapshot come compute-only oppure canonical writer; se restano writer devono rispettare le authority canoniche senza bypass implicito di gate/session sequencing, coordinando MATCH-API-008.
- [x] **`LOCAL-PBP-006`** — priorità `medium` — Correggere il bootstrap localContext: updateSofa lo calcola prima del gate e lo passa come persistenceData opaco; il matching Source Identity non lo usa e la recomputation è soltanto fallback.
- [x] **`LOCAL-PBP-007`** — priorità `high` — Creare una validation riproducibile del contratto PBP reale per set/game, ordering, current game, token, advantage/deuce, winning point, tie-break, set transition e unavailable; nessuna estensione decoder senza evidence.
- [x] **`LOCAL-PBP-008`** — priorità `high` — Riallineare la verification matrix ai test realmente presenti e aggiungere edge case per current game, identity, pointsTotal, source contract e writer /analyze; coordinare la reason propagation con MATCH-CONTEXT-003.

### `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md`

Report: [`Report documentale/30 - 01-timelines-and-history.md`](../Report%20documentale/30%20-%2001-timelines-and-history.md) — `TDUI-DOC-REPORT-030`.

Modularizzazione: **eseguita**. File creati: `docs/tennis-decision-ui/modules/storage/03-sofa-persistence.md`, `docs/tennis-decision-ui/modules/storage/04-betfair-persistence.md`.

- [x] **`STORAGE-TH-001`** — priorità `critical` — Introdurre read result strutturati e fail-closed per timeline/history: missing distinto da discovery/read/invalid_json/invalid_shape; un documento canonico non leggibile non deve essere normalizzato a vuoto né sovrascritto.
- [x] **`STORAGE-TH-002`** — priorità `high` — Rendere univoca la canonical file discovery: zero candidati=missing, uno=found, più di uno=ambiguous_storage_target; nessun sort()[0] o cleanup automatico del candidato extra.
- [x] **`STORAGE-TH-003`** — priorità `critical` — Separare state observed/prepared da committed: la projection usata nella history cross-source deve provenire solo da commit complete/recovered; failure, partial e status-only regressivo non devono contaminare il writer successivo.
- [x] **`STORAGE-TH-004`** — priorità `high` — Separare materialità history e timeline Sofa: pointByPoint/localContext possono richiedere un nuovo tick anche se la projection history è invariata, senza creare righe history artificiali e preservando il journal.
- [x] **`STORAGE-TH-005`** — priorità `high` — Rendere la projection Betfair history identity-safe e missing-preserving: selectionId come identity, missing distinto da zero, confronto runner order-independent e nessun fallback zero-like/mojibake.
- [x] **`STORAGE-TH-006`** — priorità `medium` — Documentare latest come view derivata e non campo persistito; decidere e testare la semantica metadata-only quando il tick è duplicato.
- [x] **`STORAGE-TH-007`** — priorità `medium` — Riallineare la facade storage: documentare loadHistoryResult, firma saveHistory con commitId e addBetfairUpdate come compatibility prepare-only, indicando il vero owner del commit Betfair.
- [x] **`STORAGE-TH-008`** — priorità `high` — Ricostruire la verification matrix storage con corrupt/invalid-shape no-overwrite, ambiguous discovery, cross-source uncommitted leakage, status-only leakage, localContext-only materiality, selection identity e missing semantics.
- [x] **`STORAGE-TH-009`** — priorità `medium` — Mantenere 01-timelines-and-history.md come facade/core e 02-commit-journal-and-recovery.md come owner journal; creare 03-sofa-persistence.md e 04-betfair-persistence.md, aggiornando index, link e owner map senza aggiungere i file all'inventario finché non esistono.

### `docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md`

Report: [`Report documentale/31 - 02-commit-journal-and-recovery.md`](../Report%20documentale/31%20-%2002-commit-journal-and-recovery.md) — `TDUI-DOC-REPORT-031`.

Modularizzazione: **eseguita**. File creati: `docs/tennis-decision-ui/modules/storage/05-writer-authority.md`.

- [x] **`JOURNAL-REC-001`** — priorità `critical` — Eliminare i cleanup completed residual blind di Sofa/Betfair e centralizzare una primitive verify+cleanup che riapre marker non verificabili e rimuove il journal solo dopo target verification.
- [x] **`JOURNAL-REC-002`** — priorità `critical` — Rafforzare la completed-target verification: JSON parsabile non basta; verificare target canonico, shape, event/source e coerenza con il documento journalizzato o validator typed equivalente.
- [x] **`JOURNAL-REC-003`** — priorità `critical` — Separare JSON safety da business validity: prima del repair validare payload.document/metadata e binding event/source/target tramite gli stessi validator canonici di history/timeline.
- [x] **`JOURNAL-REC-004`** — priorità `critical` — Non trasformare journal unreadable/scan failure in no_known_partial; preservare uno stato integrity degraded/unknown fail-closed e coordinare il contratto pubblico con API ed Evidence senza side effect.
- [x] **`JOURNAL-REC-005`** — priorità `high` — Definire la lifecycle authority di recovery_failed distinguendo retryable operational failure, terminal/blocked recovery e invalid structure; uno stato failed identificabile deve restare osservabile dall'integrity event-scoped.
- [x] **`JOURNAL-REC-006`** — priorità `high` — Loggare un recovery summary bounded con counters aggregate e severity distinta quando esistono retryablePending/recoveryFailed/invalidJournal, senza target path, payload o detail raw.
- [x] **`JOURNAL-REC-007`** — priorità `medium` — Rafforzare la safety strutturale delle stringhe diagnostiche tramite allow-list e URL canonicalizzate/redatte, includendo userinfo e valori raw sotto key neutre senza introdurre secret detector euristici globali.
- [x] **`JOURNAL-REC-008`** — priorità `medium` — Distinguere canonical new commitId source-UUID dal più ampio schema eventualmente accettato in recovery/legacy; se la compatibilità non serve, legare validator persisted a source/prefix/UUID.
- [x] **`JOURNAL-REC-009`** — priorità `high` — Completare i test per residual runtime, semantic target mismatch, invalid repair payload, integrity unreadable, recovery state, safety e commit identity; spostare i pass-count storici in artifact di validation.
- [x] **`JOURNAL-REC-010`** — priorità `medium` — Mantenere 02-commit-journal-and-recovery.md come owner journal/recovery e creare 05-writer-authority.md per process identity, acquire/reclaim, bootstrap e shutdown release; aggiornare index/link senza aggiungere il file all'inventario finché non esiste.

### `docs/tennis-decision-ui/operations/01-local-runtime.md`

Report: [`Report documentale/32 - 01-local-runtime.md`](../Report%20documentale/32%20-%2001-local-runtime.md) — `TDUI-DOC-REPORT-032`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`LOCAL-RUNTIME-001`** — priorità `critical` — Rendere il riuso backend working-copy aware usando repository/storage identity opache e bounded condivise con la writer authority; same project ma working copy o storage diversa non deve essere riusato e nessun path raw deve essere esposto.
- [x] **`LOCAL-RUNTIME-002`** — priorità `high` — Separare bounded discovery/reuse da spawn: cercare prima un backend riusabile su tutte le candidate, avviare un child solo se necessario e interrompere la readiness appena il child owned è già terminato.
- [x] **`LOCAL-RUNTIME-003`** — priorità `high` — Definire un contratto CLI stabile per startup, reuse, blocked, backend/frontend failure e shutdown partial; i bootstrap failure reali non devono terminare implicitamente con exit code 0 e il caso launcher già attivo va deciso/testato separatamente.
- [x] **`LOCAL-RUNTIME-004`** — priorità `medium` — Documentare la catena reale della CDP URL: launcher → VITE_CDP_URL → frontend session state → request backend → scraper; non presentarla come configurazione backend globale e coordinare session reuse/provisional con PY-RUNTIME-006.
- [x] **`LOCAL-RUNTIME-005`** — priorità `medium` — Separare service readiness da browser convenience: webbrowser.open è best-effort, un failure deve essere osservabile senza teardown automatico e l'URL frontend effettivo deve restare disponibile.
- [x] **`LOCAL-RUNTIME-006`** — priorità `medium` — Separare contratto corrente e 'collaudo runtime finale': spostare risultati/pass-count in artifact docs/validations con metadata reali, usando 'non registrato' per dati storici mancanti e mantenendo nel runbook solo verification matrix e live-required.
- [x] **`LOCAL-RUNTIME-007`** — priorità `high` — Completare i test launcher con cross-working-copy identity, fallback reusable prima dello spawn, owned child early exit, CLI outcome e browser failure; coordinare i finding PY-RUNTIME esistenti e correggere la docstring app.py stale sull'ordine lock/reuse.

### `docs/tennis-decision-ui/operations/02-live-tracking-control.md`

Report: [`Report documentale/33 - 02-live-tracking-control.md`](../Report%20documentale/33%20-%2002-live-tracking-control.md) — `TDUI-DOC-REPORT-033`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`LIVE-CTRL-001`** — priorità `high` — Distinguere current live, persisted e last-known; non usare timeline/Evidence/dashboard come prova della sessione corrente, dichiarare il limite eventId-based finché manca `IMPL-006` e verificare la session identity quando disponibile.
- [x] **`LIVE-CTRL-002`** — priorità `high` — Distinguere stop logico da cleanup fisico: top-level `ok:true` non basta; per completion processi richiedere `pythonCleanup.ok:true` e `remaining:0`, coordinando `SOFA-LIVE-003` e `FRONT-SESSION-007`.
- [x] **`LIVE-CTRL-003`** — priorità `high` — Chiarire che `pythonProcesses` prova soltanto il lifecycle Python: `sofa_tracking=0` e `betfair_tracking=0` non dimostrano `activeTrackerOperations=0`; ordinary Stop non equivale a tracker drain.
- [ ] **`LIVE-CTRL-004`** — priorità `high` — Definire il recupero di uno Stop con `pythonCleanup.remaining > 0`; correggere la `terminationPromise` riusata che può impedire un nuovo tentativo fisico, scegliere reattempt owned o shutdown esplicito e testare first remaining → second Stop.
- [x] **`LIVE-CTRL-005`** — priorità `medium` — Documentare che Stop manuale rimuove il Source Identity Gate e lo status può 404, mentre Betfair/Evidence possono continuare a mostrare dati persistiti; presentarli come stopped/last-known e coordinare i poller frontend.
- [x] **`LIVE-CTRL-006`** — priorità `high` — Distinguere `new Start API permitted` da restart realmente session-safe, qualificare la promessa sui callback SofaScore in-flight durante mismatch e coordinare `SOFA-LIVE-001/004`, `SOURCE-ID-002` e `IMPL-006` senza delay empirici.
- [ ] **`LIVE-CTRL-007`** — priorità `medium` — Spostare la verifica 9B in un artifact di validation solo con provenance reale; usare `non registrato` per metadata storici mancanti e aggiungere test post-Stop gate 404, partial cleanup, remaining retry, Node in-flight, immediate restart e persisted-vs-current.

### `docs/tennis-decision-ui/operations/03-betfair-diagnostics.md`

Report: [`Report documentale/34 - 03-betfair-diagnostics.md`](../Report%20documentale/34%20-%2003-betfair-diagnostics.md) — `TDUI-DOC-REPORT-034`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`BETFAIR-DIAG-001`** — priorità `high` — Rendere truthful la tassonomia health: `yellow/STALE` non significa soltanto age stale; documentare tutte le cause yellow correnti e diagnosticare tramite `message/reasons/checks/metrics`, con test dedicati.
- [ ] **`BETFAIR-DIAG-002`** — priorità `high` — Rendere esplicita la finestra degli ultimi tre tick e definire una vera authority di auth recovery; un singolo tick sano non garantisce clear immediato del red. Testare status-only → healthy 1/2/3 e healthy singolo senza nuovi tick.
- [x] **`BETFAIR-DIAG-003`** — priorità `critical` — Non trattare `hasFinished` ricevuto come finished authoritative finché il producer non è hardenizzato; coordinare `BETFAIR-SCRAPER-006` e `SOFA-LIVE-007`, senza creare un secondo finished detector.
- [x] **`BETFAIR-DIAG-004`** — priorità `high` — Distinguere Node runtime log, Python Betfair log e capture artifacts; `/api/betfair/log` è un tail globale del log Python e una riga recente non prova la sessione corrente. Definire correlazione bounded con identificatori approvati.
- [x] **`BETFAIR-DIAG-005`** — priorità `high` — Documentare la network capture per entrypoint: tracking Node off di default; `/odds` off salvo `networkCapture=true`; CLI Python standalone on di default salvo `--no-network-capture`. Verificare matrice Node/CLI e dump creation.
- [x] **`BETFAIR-DIAG-006`** — priorità `critical` — Non presentare `/api/betfair/odds` come route read-only diagnostica: dichiararla legacy e potenzialmente mutante, coordinare `BETFAIR-LIFE-006`/`BETFAIR-API-007` e definire un replacement diagnostico safe prima dell'eventuale rimozione.
- [x] **`BETFAIR-DIAG-007`** — priorità `high` — Non trattare `no_known_partial` come prova di scan riuscito; coordinare `JOURNAL-REC-004/005`, qualificare `recovery_failed` e consumare la futura tassonomia storage fail-closed senza crearne una seconda.
- [x] **`BETFAIR-DIAG-008`** — priorità `high` — Ampliare la verification matrix a cause yellow, auth recovery, log planes, Node vs CLI capture, legacy `/odds`, integrity degraded, finished authority e redaction; usare suite modulari correnti e live artifact solo con provenance reale.

### `docs/tennis-decision-ui/operations/04-validation-and-rollback.md`

Report: [`Report documentale/35 - 04-validation-and-rollback.md`](../Report%20documentale/35%20-%2004-validation-and-rollback.md) — `TDUI-DOC-REPORT-035`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`VALID-ROLL-001`** — priorità `critical` — Distinguere HEAD SHA dal contenuto esatto della working tree; aggiungere provenance bounded pre/post run, qualificare state unavailable/unknown e collegare la provenance al rollback selettivo senza diff raw o path sensibili.
- [ ] **`VALID-ROLL-002`** — priorità `critical` — Trattare `requires` come dichiarativo: fast/full-offline non sono capability sandbox e i child ereditano `process.env`; minimizzare/sanitizzare l'environment offline, ridefinire ciò che `TEST-073` prova e verificare la policy effettiva.
- [ ] **`VALID-ROLL-003`** — priorità `high` — Rendere machine-checkable la closure di `full-offline`: una nuova entry offline non deve poter essere dimenticata; introdurre eligibility/exclusion reason esplicita e test di profile completeness.
- [x] **`VALID-ROLL-004`** — priorità `high` — Correggere la semantica dei risultati: `counts.passed` conta manifest entry, non assertion, e `perTestResults` include anche build/checker/compile; distinguere workflow state da runner status e coordinare `IMPL-031`.
- [ ] **`VALID-ROLL-005`** — priorità `high` — Estendere timeout/cleanup all'intero process tree owned con graceful/force bounded, incluso il caso parent exits ma descendant resta; nessun kill per porta/PID non owned e `termination_unconfirmed` se il drain non è dimostrato.
- [x] **`VALID-ROLL-006`** — priorità `medium` — Distinguere link checker, registry checker e controlli strutturali; mappare ogni requisito a automatic/manual/historical e non usare un link-check verde come validazione documentale globale. Valutare checker read-only separati per i requisiti mancanti.
- [x] **`VALID-ROLL-007`** — priorità `high` — Aggiungere `TEST-072` ai limiti correnti: non implicare che esista già un route HTTP harness riusabile completo; usare test HTTP specifici quando disponibili e mantenere porta dinamica e cleanup owned.

### `docs/tennis-decision-ui/operations/05-retention-and-cleanup.md`

Report: [`Report documentale/36 - 05-retention-and-cleanup.md`](../Report%20documentale/36%20-%2005-retention-and-cleanup.md) — `TDUI-DOC-REPORT-036`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`RETENTION-001`** — priorità `medium` — Documentare che `max-files` e `max-total-bytes` sono valutati per ciascuna cache selezionata; non trasformare la CLI in un global-cap senza decisione e migrazione esplicita.
- [x] **`RETENTION-002`** — priorità `high` — Documentare il best-effort per-file dell'apply: `exit 1` può coesistere con removals già eseguite; obbligare la lettura di `removed/errors/recoveredBytes` e valutare uno stato strutturato `partial`.
- [ ] **`RETENTION-003`** — priorità `high` — Definire una procedura project-owned per backup restore/audit con snapshot boundary coerente fra più artefatti; `IMPL-011` può essere un building block solo dopo decisione esplicita sullo scope.

### `docs/tennis-decision-ui/reference/01-repository-map.md`

Report: [`Report documentale/37 - 01-repository-map.md`](../Report%20documentale/37%20-%2001-repository-map.md) — `TDUI-DOC-REPORT-037`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`REPO-MAP-001`** — priorità `high` — Aggiungere `launcher/session.py` alla superficie launcher e distinguerne sinteticamente la responsabilità per lock, manifest e launcher session identity rispetto ad app/services/system/config.
- [x] **`REPO-MAP-002`** — priorità `high` — Aggiungere `backend/source_identity_confirmations.json` alla classificazione dei dati locali persistiti: non cache, non versionare, task-specific only e non cancellare automaticamente; rimandare agli owner Source Identity/Retention.
- [x] **`REPO-MAP-003`** — priorità `medium` — Correggere il riferimento a `IMPL-003`: non è una `mappa completa`, ma la matrice test ↔ modulo ↔ documento; non creare una seconda repository map.


### `docs/tennis-decision-ui/roadmap/01-current-state.md`

Report: [`Report documentale/38 - 01-current-state.md`](../Report%20documentale/38%20-%2001-current-state.md) — `TDUI-DOC-REPORT-038`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`CURRENT-STATE-001`** — priorità `high` — Separare code/runtime baseline da document/repository baseline e dichiarare quale SHA/content state supporta ogni claim del Current State.
- [x] **`CURRENT-STATE-002`** — priorità `medium` — Rimuovere o aggiornare il riferimento a `docs/archive/README.md` assente; identificare l’authority corrente della provenance senza ricreare automaticamente il file.
- [x] **`CURRENT-STATE-003`** — priorità `high` — Rendere artifact-backed l’inventario delle historical validations; launcher/Stop/lifecycle non vanno attribuiti a `docs/validations/` senza artifact o link verificabile.

### `docs/validations/README.md`

Report: [`Report documentale/39 - README-validations.md`](../Report%20documentale/39%20-%20README-validations.md) — `TDUI-DOC-REPORT-039`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`VALID-INDEX-001`** — priorità `high` — Definire la tassonomia historical evidence a livello documento/scenario (`live_observed`, `passed`, `failed`, `blocked`, `not_executed`, `not_applicable`, `historically_reported`) con qualificatori `not archived` e `not registered`.
- [x] **`VALID-INDEX-002`** — priorità `high` — Uniformare i metadata delle validation e le missing semantics (`known`, `non registrato`, `non archiviato`, `not applicable`); l’eventuale checker resta owner di `VALID-ROLL-006`.
- [x] **`VALID-INDEX-003`** — priorità `medium-high` — Definire run identity immutabile: una rerun produce un nuovo artifact/naming stabile e non sovrascrive retroattivamente l’evidenza precedente.

### `docs/validations/betfair-live-validation-2026-07-04.md`

Report: [`Report documentale/40 - betfair-live-validation-2026-07-04.md`](../Report%20documentale/40%20-%20betfair-live-validation-2026-07-04.md) — `TDUI-DOC-REPORT-040`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`BETFAIR-VAL-001`** — priorità `high` — Correggere `Sorgente migrata` self-reference usando il path storico `docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx`, senza inventare SHA o ambiente.
- [x] **`BETFAIR-VAL-002`** — priorità `high` — Confrontare source e artifact migrato; ripristinare o classificare l’osservazione unica `/api/match/:eventId/json = 200 → Sofa: Connected`, distinguendo safe wording/privacy da material evidence omission.
- [x] **`BETFAIR-VAL-003`** — priorità `medium` — Aggiungere `Mismatch marketId → non eseguito` alla tabella `Interpretazione` per non perdere uno scenario aperto già dichiarato nel body.

### `docs/validations/documentation-migration-finalization-2026-08-03.md`

Report: [`Report documentale/41 - documentation-migration-finalization-2026-08-03.md`](../Report%20documentale/41%20-%20documentation-migration-finalization-2026-08-03.md) — `TDUI-DOC-REPORT-041`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`MIGRATION-VAL-001`** — priorità `high` — Allineare il claim di content preservation alla prova: un dimension ratio `0,998–1,001` supporta `no substantial truncation`, non exact body identity; ridurre il wording oppure produrre un normalized diff per file con zero differenze non classificate.

### `docs/validations/source-identity-live-verification.md`

Report: [`Report documentale/42 - source-identity-live-verification.md`](../Report%20documentale/42%20-%20source-identity-live-verification.md) — `TDUI-DOC-REPORT-042`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`SOURCE-ID-VAL-001`** — priorità `high` — Correggere `Sorgente migrata` self-reference usando la fonte storica `docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx`, senza inventare SHA o ambiente.
- [x] **`SOURCE-ID-VAL-002`** — priorità `high` — Ripristinare la fidelity storica: `Sofa: In attesa` era soltanto historically reported; `no polling error` e il `404` erano unchecked; rendere inoltre esplicita la route osservata `/api/match/:eventId/json → 200` per `Sofa: Connected`.
- [x] **`SOURCE-ID-VAL-003`** — priorità `medium` — Completare `Interpretazione` con gli scenari live non eseguiti del body, inclusi plausible pending, mismatch/no-modal, modal privacy, single-toast e bootstrap failure, senza promuovere i test offline a live evidence.

### `implementazioni-tennis-decision-ui.md`

Report: [`Report documentale/43 - implementazioni-tennis-decision-ui.md`](../Report%20documentale/43%20-%20implementazioni-tennis-decision-ui.md) — `TDUI-DOC-REPORT-043`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`ROOT-REG-001`** — priorità `high` — Definire una decisione superseding univoca per la policy `docs/archive/`, riallineando `DEC-026`, `ARCHIVE-DEC-001`, metodo, root registry e Todo senza cancellare automaticamente materiali dichiarati utili.
- [ ] **`ROOT-REG-002`** — priorità `high` — Rendere espliciti baseline e provenance dell’ultimo controllo dei registri: distinguere SHA codice, base/commit di recupero documentale, registry baseline realmente validata, scope/comandi e artifact del controllo.
- [x] **`ROOT-REG-003`** — priorità `high` — Separare policy “docs canonici descrivono il reale”, completamento meccanico della migrazione `.mdx → .md` e stato semantico effettivo: i finding documentali ancora aperti devono restare visibili e non essere assorbiti da claim di riallineamento globale.

### `implementazioni/00-metodo-e-stati.md`

Report: [`Report documentale/44 - 00-metodo-e-stati.md`](../Report%20documentale/44%20-%2000-metodo-e-stati.md) — `TDUI-DOC-REPORT-044`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`METHOD-EVIDENCE-001`** — priorità `high` — Riformulare il modello di evidenza separando workflow lifecycle, implementation state, offline verification, live verification e provenance; preservare la gerarchia di affidabilità ma non comprimere dimensioni indipendenti in un solo stato.
- [x] **`METHOD-REG-001`** — priorità `high` — Allineare il contratto documentato del registry checker all’implementazione reale: discovery ricorsiva `implementazioni/**/*.md`, parity Block E+F, esclusione DEC, vocabolario status riconosciuto, controlli SHA/range/punto/prossimo-step e limiti; non attribuire controlli non implementati.
- [x] **`METHOD-LIFECYCLE-001`** — priorità `medium-high` — Convertire il metodo da istruzioni transitorie di migrazione/planning a steady-state: mantenere `.md`, separazione storico/corrente, artifact/link checks; marcare come storico o rimuovere dal flusso corrente coexistence MDX, mass conversion e cleanup di migrazione già conclusi.
- [x] **`METHOD-SCHEMA-001`** — priorità `medium` — Definire un minimum schema realistico per tipo di record (DOC/WORKFLOW, codice, IMPL, TEST, DEC) con grandfathering per le schede storiche; non imporre retroattivamente una card uniforme molto più ricca di quanto checker e registri correnti supportino.

### `implementazioni/01-piano-generale-audit.md`

Report: [`Report documentale/45 - 01-piano-generale-audit.md`](../Report%20documentale/45%20-%2001-piano-generale-audit.md) — `TDUI-DOC-REPORT-045`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`PLAN-AUDIT-001`** — priorità `high` — Dichiarare in testa che il file conserva piano originario e snapshot storici dell’audit; indirizzare lo stato operativo corrente verso Todo, audit tecnico e root registry, evitando che sezioni future/differite ormai completate sembrino ancora il piano attivo.
- [x] **`PLAN-AUDIT-002`** — priorità `medium-high` — Aggiungere provenance agli snapshot 8.3–8.4 solo quando dimostrabile: data, SHA realmente verificato, commit di registrazione e fonte locale/non-repository; se la baseline della verifica non è ricostruibile usare `non registrato` senza trasformare il commit che aggiunge il testo nello SHA verificato.
- [x] **`PLAN-AUDIT-003`** — priorità `medium-high` — Definire esplicitamente `activity completion` vs `exhaustive coverage`: “audit/Punto completato” deve significare attività eseguita nel perimetro dichiarato, non checklist tutte verdi, finding chiusi, test tutti eseguiti o collaudi live conclusi.

### `implementazioni/02-audit-documentazione.md`

Report: [`Report documentale/46 - 02-audit-documentazione.md`](../Report%20documentale/46%20-%2002-audit-documentazione.md) — `TDUI-DOC-REPORT-046`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`DOC-AUDIT-IDX-001`** — priorità `high` — Delimitare il facade ai moduli storici B1–B6 (`DOC-001…023`, `WORKFLOW-001…003`), indicare che i prefissi continuano nei registri tecnici successivi e chiarire che il prefisso non determina automaticamente la directory owner; Todo resta la vista sintetica globale.

### `implementazioni/03-audit-codice.md`

Report: [`Report documentale/47 - 03-audit-codice.md`](../Report%20documentale/47%20-%2003-audit-codice.md) — `TDUI-DOC-REPORT-047`.

Modularizzazione: **valutata, non necessaria**.

- Nessuna nuova task: il facade è coerente; eventuali rafforzamenti sulla semantica di completion sono già posseduti da `PLAN-AUDIT-003`.

## Inventario canonico di continuazione

Il primo segmento conserva gli indici `1–22`. Questa tabella mantiene l’ordine residuo `23–72`.

| Indice | Documento | Stato | Report | Modularizzazione |
| ---: | --- | --- | --- | --- |
| 23 | `docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md` | **COMPLETATO** | [`Report documentale/23 - 04-match-context-ui.md`](../Report%20documentale/23%20-%2004-match-context-ui.md) | Divisione non necessaria |
| 24 | `docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md` | **COMPLETATO** | [`Report documentale/24 - 01-entrypoints-and-runtime.md`](../Report%20documentale/24%20-%2001-entrypoints-and-runtime.md) | Divisione non necessaria |
| 25 | `docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md` | **COMPLETATO** | [`Report documentale/25 - 02-sofascore-scraper.md`](../Report%20documentale/25%20-%2002-sofascore-scraper.md) | Divisione non necessaria |
| 26 | `docs/tennis-decision-ui/modules/python/03-betfair-scraper.md` | **COMPLETATO** | [`Report documentale/26 - 03-betfair-scraper.md`](../Report%20documentale/26%20-%2003-betfair-scraper.md) | Divisione eseguita |
| 27 | `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md` | **COMPLETATO** | [`Report documentale/27 - 04-betfair-graph-url-validation.md`](../Report%20documentale/27%20-%2004-betfair-graph-url-validation.md) | Divisione non necessaria |
| 28 | `docs/tennis-decision-ui/modules/sofa/01-live-tracking.md` | **COMPLETATO** | [`Report documentale/28 - 01-live-tracking.md`](../Report%20documentale/28%20-%2001-live-tracking.md) | Divisione non necessaria |
| 29 | `docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md` | **COMPLETATO** | [`Report documentale/29 - 02-local-context-and-point-by-point.md`](../Report%20documentale/29%20-%2002-local-context-and-point-by-point.md) | Divisione non necessaria |
| 30 | `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md` | **COMPLETATO** | [`Report documentale/30 - 01-timelines-and-history.md`](../Report%20documentale/30%20-%2001-timelines-and-history.md) | Revisione mirata verificata; divisione eseguita |
| 31 | `docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md` | **COMPLETATO** | [`Report documentale/31 - 02-commit-journal-and-recovery.md`](../Report%20documentale/31%20-%2002-commit-journal-and-recovery.md) | Revisione mirata verificata; divisione eseguita |
| 32 | `docs/tennis-decision-ui/operations/01-local-runtime.md` | **COMPLETATO** | [`Report documentale/32 - 01-local-runtime.md`](../Report%20documentale/32%20-%2001-local-runtime.md) | Divisione non necessaria |
| 33 | `docs/tennis-decision-ui/operations/02-live-tracking-control.md` | **ANALIZZATO** | [`Report documentale/33 - 02-live-tracking-control.md`](../Report%20documentale/33%20-%2002-live-tracking-control.md) | Divisione non necessaria |
| 34 | `docs/tennis-decision-ui/operations/03-betfair-diagnostics.md` | **ANALIZZATO** | [`Report documentale/34 - 03-betfair-diagnostics.md`](../Report%20documentale/34%20-%2003-betfair-diagnostics.md) | Divisione non necessaria |
| 35 | `docs/tennis-decision-ui/operations/04-validation-and-rollback.md` | **ANALIZZATO** | [`Report documentale/35 - 04-validation-and-rollback.md`](../Report%20documentale/35%20-%2004-validation-and-rollback.md) | Divisione non necessaria |
| 36 | `docs/tennis-decision-ui/operations/05-retention-and-cleanup.md` | **ANALIZZATO** | [`Report documentale/36 - 05-retention-and-cleanup.md`](../Report%20documentale/36%20-%2005-retention-and-cleanup.md) | Divisione non necessaria |
| 37 | `docs/tennis-decision-ui/reference/01-repository-map.md` | **ANALIZZATO** | [`Report documentale/37 - 01-repository-map.md`](../Report%20documentale/37%20-%2001-repository-map.md) | Divisione non necessaria |
| 38 | `docs/tennis-decision-ui/roadmap/01-current-state.md` | **ANALIZZATO** | [`Report documentale/38 - 01-current-state.md`](../Report%20documentale/38%20-%2001-current-state.md) | Divisione non necessaria |
| 39 | `docs/validations/README.md` | **ANALIZZATO** | [`Report documentale/39 - README-validations.md`](../Report%20documentale/39%20-%20README-validations.md) | Divisione non necessaria |
| 40 | `docs/validations/betfair-live-validation-2026-07-04.md` | **ANALIZZATO** | [`Report documentale/40 - betfair-live-validation-2026-07-04.md`](../Report%20documentale/40%20-%20betfair-live-validation-2026-07-04.md) | Divisione non necessaria |
| 41 | `docs/validations/documentation-migration-finalization-2026-08-03.md` | **ANALIZZATO** | [`Report documentale/41 - documentation-migration-finalization-2026-08-03.md`](../Report%20documentale/41%20-%20documentation-migration-finalization-2026-08-03.md) | Divisione non necessaria |
| 42 | `docs/validations/source-identity-live-verification.md` | **ANALIZZATO** | [`Report documentale/42 - source-identity-live-verification.md`](../Report%20documentale/42%20-%20source-identity-live-verification.md) | Divisione non necessaria |
| 43 | `implementazioni-tennis-decision-ui.md` | **ANALIZZATO** | [`Report documentale/43 - implementazioni-tennis-decision-ui.md`](../Report%20documentale/43%20-%20implementazioni-tennis-decision-ui.md) | Divisione non necessaria |
| 44 | `implementazioni/00-metodo-e-stati.md` | **ANALIZZATO** | [`Report documentale/44 - 00-metodo-e-stati.md`](../Report%20documentale/44%20-%2000-metodo-e-stati.md) | Divisione non necessaria |
| 45 | `implementazioni/01-piano-generale-audit.md` | **ANALIZZATO** | [`Report documentale/45 - 01-piano-generale-audit.md`](../Report%20documentale/45%20-%2001-piano-generale-audit.md) | Divisione non necessaria |
| 46 | `implementazioni/02-audit-documentazione.md` | **ANALIZZATO** | [`Report documentale/46 - 02-audit-documentazione.md`](../Report%20documentale/46%20-%2002-audit-documentazione.md) | Divisione non necessaria |
| 47 | `implementazioni/03-audit-codice.md` | **ANALIZZATO** | [`Report documentale/47 - 03-audit-codice.md`](../Report%20documentale/47%20-%2003-audit-codice.md) | Divisione non necessaria |
| 48 | `implementazioni/04-task-completate.md` | **DA ANALIZZARE** | — | Da valutare |
| 49 | `implementazioni/05-audit-docs-planning.md` | **DA ANALIZZARE** | — | Da valutare |
| 50 | `implementazioni/06-implementazioni-proposte.md` | **DA ANALIZZARE** | — | Da valutare |
| 51 | `implementazioni/99-decisioni-utente.md` | **DA ANALIZZARE** | — | Da valutare |
| 52 | `implementazioni/README.md` | **DA ANALIZZARE** | — | Da valutare |
| 53 | `implementazioni/audit-codice/01-rilievi-iniziali.md` | **DA ANALIZZARE** | — | Da valutare |
| 54 | `implementazioni/audit-codice/02-runtime-sessioni-betfair.md` | **DA ANALIZZARE** | — | Da valutare |
| 55 | `implementazioni/audit-codice/03-storage-recovery.md` | **DA ANALIZZARE** | — | Da valutare |
| 56 | `implementazioni/audit-codice/04-evidence-market-reactions.md` | **DA ANALIZZARE** | — | Da valutare |
| 57 | `implementazioni/audit-codice/05-frontend-session-shell.md` | **DA ANALIZZARE** | — | Da valutare |
| 58 | `implementazioni/audit-codice/06-validazione-e-test.md` | **DA ANALIZZARE** | — | Da valutare |
| 59 | `implementazioni/audit-codice/07-post-audit-e-migrazione.md` | **DA ANALIZZARE** | — | Da valutare |
| 60 | `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md` | **DA ANALIZZARE** | — | Da valutare |
| 61 | `implementazioni/audit-documentazione/02-moduli-frontend-python.md` | **DA ANALIZZARE** | — | Da valutare |
| 62 | `implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md` | **DA ANALIZZARE** | — | Da valutare |
| 63 | `implementazioni/audit-documentazione/04-processo-e-materiali-storici.md` | **DA ANALIZZARE** | — | Da valutare |
| 64 | `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md` | **DA ANALIZZARE** | — | Da valutare |
| 65 | `implementazioni/implementazioni-proposte/02-runtime-betfair.md` | **DA ANALIZZARE** | — | Da valutare |
| 66 | `implementazioni/implementazioni-proposte/03-storage-recovery.md` | **DA ANALIZZARE** | — | Da valutare |
| 67 | `implementazioni/implementazioni-proposte/04-evidence-provenance.md` | **DA ANALIZZARE** | — | Da valutare |
| 68 | `implementazioni/implementazioni-proposte/05-frontend-session-polling.md` | **DA ANALIZZARE** | — | Da valutare |
| 69 | `implementazioni/implementazioni-proposte/06-validazione-e-fixture.md` | **DA ANALIZZARE** | — | Da valutare |
| 70 | `implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md` | **DA ANALIZZARE** | — | Da valutare |
| 71 | `scripts/validation/README.md` | **DA ANALIZZARE** | — | Da valutare |
| 72 | `todo-list-tennis-decision-ui.md` | **DA ANALIZZARE** | — | Da valutare |

## JSON incrementale delle modifiche — continuazione

Da questo segmento viene usato:

```text
modifiche-audit-markdown-continuazione-023.json
```

Regole:

- parte da `TDUI-DOC-REPORT-023`;
- contiene soltanto report e task dal report 023 in avanti;
- non duplica le **181 task** precedenti;
- non ricopia l’inventario storico `1–22`;
- conserva stato, priorità, checkbox, modularizzazione e riferimenti al report;
- mantiene contatori cumulativi;
- il segmento precedente resta congelato al report 022.

## Checkpoint 043–047

```text
043 → 3 task
044 → 4 task
045 → 3 task
046 → 1 task
047 → 0 task
totale blocco → 11 task
```

## Verifica del pacchetto

```text
file Markdown totali: 72
file analizzati: 47
file da analizzare: 25
report completi totali: 47
report in questa continuazione: 25
task complessive note: 320
task precedenti non duplicate: 181
task in questa continuazione: 139
task con checkbox: 139
task completate: 130
definizione di analizzare presente nella mappa: sì
definizione di analizzare presente nei report: no
modularizzazione valutata per 023–047: sì
ordine residuo 23–72 mantenuto: sì
duplicazioni storico in questo segmento: no
esito: PASS
```

## Regola per i prossimi aggiornamenti

L’analisi procede documento per documento, ma **mappa e JSON di continuazione vengono consolidati ogni 5 nuovi report**, salvo diversa istruzione esplicita dell’utente.

Per ogni documento:

1. applicare integralmente la definizione di “analizzare” riportata sopra;
2. creare il report completo dentro `Report documentale/`;
3. assegnare un `report_id` univoco;
4. registrare nel report la valutazione di modularizzazione;
5. non modificare lo stato `completed` delle task senza applicazione e verifica.

Al quinto report del blocco:

6. aggiornare **questa continuazione**, non i file del segmento precedente;
7. registrare tutte le modifiche nuove del blocco come task `- [ ]`;
8. aggiungere al JSON di continuazione soltanto i nuovi report e le nuove task del blocco;
9. mantenere `completed: false` finché la task non è applicata e verificata;
10. aggiornare contatori cumulativi, ultimo documento e prossimo indice;
11. aggiornare le righe dell’inventario relative ai documenti appena analizzati;
12. verificare che non siano state duplicate task già possedute da report precedenti;
13. quando questa continuazione diventerà troppo grande, congelarla e aprire un nuovo segmento senza ricopiare lo storico.


