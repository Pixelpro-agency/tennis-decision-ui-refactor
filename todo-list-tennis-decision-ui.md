# Tennis Decision UI — Todo list e stato operativo

## Scopo

Questa Todo è la vista operativa unica della revisione di **Tennis Decision UI**.

Serve a:

- mostrare lo stato corrente del progetto;
- conservare gli inventari e le checklist dell’audit;
- distinguere lavoro completato, finding confermati, implementazioni approvate e attività mancanti;
- collegare ogni ID alla relativa scheda owner;
- indicare priorità, collaudi residui e prossimo passo;
- fornire la base per preparare task esecutive separate.

Le motivazioni e le evidenze complete vivono nei moduli sotto `implementazioni/`. La documentazione tecnica corrente vive sotto `docs/tennis-decision-ui/`.

## Baseline verificata

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch canonico: main
SHA codice verificato: aefc0ba5894d8fca60e5811088fede3ebbfde98a
SHA checkpoint registri: 8f936d1a3686b775e967e375576f52f19da461a5
Data del checkpoint: 2026-08-06
```

- [x] Branch locale e `origin/main` allineati sul commit documentale `8f936d1`
- [x] Il commit 8f936d1 modifica soltanto documentazione e registri; la baseline del codice resta aefc0ba
- [x] Documentazione e registri verificati dopo la modularizzazione
- [x] Working tree pulita al checkpoint pubblicato

## Legenda

```txt
[x] finding classificato, decisione approvata o attività completata
[ ] lavoro, implementazione, verifica o copertura ancora aperta
[-] parziale o limitato
[~] futuro o rinviato
```

Lo stato testuale in grassetto è l’autorità sintetica. Una checkbox `[x]` non equivale automaticamente a codice implementato.

---

# BLOCCO A — Stato corrente, fonti e inventario

## A1 — Fonti operative

- [x] [Indice root](./implementazioni-tennis-decision-ui.md)
- [x] [Indice dei registri](./implementazioni/README.md)
- [x] [Metodo e stati](./implementazioni/00-metodo-e-stati.md)
- [x] [Decisioni dell’utente](./implementazioni/99-decisioni-utente.md)
- [x] [Documentazione canonica](./docs/tennis-decision-ui/index.md)
- [x] [Validazioni correnti](./docs/validations/)
- [x] `docs/archive/` — materiali non canonici conservati intenzionalmente per uso successivo

## A2 — Inventario tecnico e copertura

- [x] A1 — Repository, branch e SHA
- [x] A2 — Entry point pubblico `avvio.py`
- [x] A3 — Orchestrazione reale in `launcher/app.py`
- [x] A4 — Router backend montati
- [x] A5 — Recovery prima di `listen`
- [x] A6 — Registry processi Python individuato
- [x] A7 — Composizione frontend iniziale individuata
- [ ] A8 — Inventario completo root
- [ ] A9 — Inventario completo directory backend
- [ ] A10 — Inventario completo directory frontend
- [ ] A11 — Inventario completo package Python
- [ ] A12 — Inventario script operativi
- [ ] A13 — Inventario test
- [x] A14 — Inventario documenti canonici — 40 documenti indicizzati verificati sullo SHA checkpoint
- [-] A15 — Inventario legacy e file generati — materiali locali classificati; riferimenti canonici `chapters/` e `sections/` verificati assenti
- [-] A16 — Matrice codice ↔ documentazione — owner matrix Batch 0 creata; completamento progressivo per i batch comportamentali

## A3 — Struttura dei registri

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 7 moduli
- [x] Percorsi root `02`, `03` e `06` mantenuti come indici stabili
- [x] Registry checker aggiornato a `implementazioni/**/*.md`
- [x] Test dedicato alla discovery annidata presente
- [x] Nessun secondo monolite canonico mantenuto

## A4 — Regole documentali correnti

- [x] Documenti tecnici in Markdown ordinario
- [x] Nessun nuovo documento `.mdx`
- [x] Nessun frontmatter obbligatorio
- [x] Documentazione canonica limitata al comportamento reale
- [x] Futuro, decisioni e implementazioni mancanti mantenuti nei registri
- [x] Cronologia delle revisioni affidata ai commit Git
- [x] Materiali storici o futuri non canonici dichiarati utili conservati in `docs/archive/`
- [x] Contenuti archive esclusi dagli owner tecnici e dalla prova di implementazione
- [x] Duplicati canonici e fonti assorbite rimossi soltanto quando non conservati intenzionalmente

---

# BLOCCO B0 — Regole documentali permanenti

- [x] Nuovi documenti tecnici soltanto in formato `.md`
- [x] Non creare nuovi documenti `.mdx`
- [x] Verificare il loader o generatore della documentazione — nessun loader MDX richiesto
- [x] Formato metadata deciso — Markdown ordinario, nessun frontmatter predefinito
- [x] Convertire eventuale sintassi MDX — metadata JavaScript rimossi
- [x] Aggiornare link `.mdx` → `.md`
- [x] Evitare duplicati canonici `.mdx` e `.md`
- [x] Eliminare i vecchi `.mdx` soltanto dopo verifica completa
- [x] Requisiti ancora validi collegati a rilievi e IMPL
- [x] Storico, futuro e stato corrente separati
- [x] La documentazione canonica descrive soltanto comportamento implementato e verificato nel codice corrente
- [x] Decisioni approvate ma non implementate restano nei registri
- [x] Funzionalità future non vengono presentate come stato corrente
- [x] La migrazione procede per batch piccoli e revisionabili
- [x] Nessuna cancellazione prima della sostituzione completa e della verifica dei link
- [x] Ogni batch include file completi, controlli, limiti e rollback
- [x] La cronologia delle revisioni resta nei commit Git; i requisiti utili restano nei registri o nelle validations
- [x] `docs/archive/` conserva materiali non canonici dichiarati utili per lavoro futuro e non viene eliminato automaticamente

---

# BLOCCO B — Audit documentazione e lavoro completato

> Le checklist B1–B6 descrivono il checkpoint dell’audit documentale. Gli stati owner correnti restano nei Blocchi E/F e nei registri analitici.

## B1 — Ingresso e orientamento

- [x] README root — verificato
- [x] Indice canonico — verificato; al checkpoint B1 il percorso era `docs/tennis-decision-ui/index.mdx`
- [x] Repository map — `DOC-002`, `DOC-006`
- [x] System boundaries — `DOC-006`
- [x] Data lifecycle — `DOC-006`
- [x] Link e frontmatter — formato verificato; inventario globale e scansione strict completati

## B2 — API

- [x] API Match — `DOC-009`, `CODE-003`
- [x] API Betfair — `DOC-010`, `DOC-011`
- [x] API Evidence — `DOC-003`, `DOC-011`
- [x] API Strategy — `DOC-012`, `CODE-001`, `CODE-004`
- [x] API Preflight — `DOC-013`, `CODE-002`
- [x] API Runtime Health — coerente con codice e test ispezionato

## B3 — Moduli

- [x] Tracking SofaScore — verificato; documento troppo esteso (`DOC-015`); race nuovo Start (`RUNTIME-002`)
- [x] Local context e point-by-point — contratto coerente; assunzione ultimo game da validare (`SOFA-001`)
- [x] Timeline e history — verificato; separare facade storage e journal (`DOC-015`, `DOC-016`)
- [x] Commit journal e recovery — contratto sostanzialmente coerente
- [x] Lifecycle Betfair — verificato; ridurre duplicazioni Runtime/Storage (`DOC-015`)
- [x] Validità tecnica Betfair — verificata; correggere ordine key/classificazione (`DOC-014`)
- [x] Match Evidence Snapshot — verificato; ridurre duplicazioni integrity/identity (`DOC-015`)
- [x] Source Identity — verificato; comportamento principale coerente
- [x] Qualità, flow e alignment — verificato; ownership coerente ma ripetitiva (`DOC-015`)
- [x] Market Reactions — verificato; `selectionId` obbligatorio solo Field → Market (`EVIDENCE-001`, `DEC-010`)

## B4 — Frontend e Python

- [x] Session shell — ownership verificata; Start fallito lascia poller nascosti (`FRONTEND-003`)
- [x] Polling e view model — race risposte tardive (`FRONTEND-001`) e integrity non propagata (`FRONTEND-002`, `DOC-018`)
- [x] UI Betfair e Market Reactions — rendering principale coerente; stato persistence promesso ma non collegato (`FRONTEND-002`)
- [x] Match Context UI — contratto coerente con mapping e view model
- [x] Entry point e runtime Python — wrapper sottili e proxy dinamico launcher verificati
- [x] Scraper SofaScore — CLI, cache e fallback browser coerenti; errori pubblici da irrobustire (`SECURITY-003`)
- [x] Scraper Betfair — lifecycle principale coerente; path pubblico, cache key e task capture da correggere (`SECURITY-001`, `SECURITY-002`, `PYTHON-001`)
- [x] Graph URL — parser, mapping, duplicati e skip coerenti con il codice

## B5 — Operations e roadmap

- [x] Runtime locale — contratto coerente; architettura e collaudi da separare dal runbook (`DOC-021`, `DOC-023`)
- [x] Controllo tracking — procedura operativa coerente con Stop globale e scope processi
- [x] Diagnostica Betfair — sequenza utile; correggere le garanzie di hardening pubblico (`DOC-019`, `SECURITY-001`, `SECURITY-003`)
- [x] Validation e rollback — contenuti validi ma documento monolitico e duplicato (`DOC-021`)
- [x] Retention e cleanup — allow-list corretta; path journal errato e verifica offline incompleta (`DOC-020`, `CLEANUP-002`)
- [x] Validazione live Source Identity — checklist utile; separare procedura e osservazioni storiche (`DOC-023`)
- [x] Validazione live Betfair — report storico valido con limiti espliciti; conservato nelle validations
- [x] Current State — storico, duplicato e non aggiornato rispetto a B4 (`DOC-001`, `DOC-007`, `DOC-022`)
- [x] Replay e backtesting — `FUTURA`, correttamente dichiarata non implementata
- [x] Market Reactions Journal — `FUTURA`, correttamente dichiarata non implementata

## B6 — Controlli trasversali

- [x] Documenti owner — API, moduli, frontend, Python, operations e roadmap verificati
- [x] Duplicazioni — classificate (`DOC-015`, `DOC-018`, `DOC-021`, `DOC-023`)
- [x] Contraddizioni — classificate (`DOC-020`, `DOC-022`)
- [x] Percorsi errati — journal e path pubblico registrati (`DOC-020`, `SECURITY-001`)
- [x] Link dell’indice canonico — scan globale strict completata
- [x] Test — gap classificati (`TEST-001`, `TEST-002`, `TEST-003`, `PYTHON-001`)
- [x] Funzioni implementate non documentate/legacy — candidate registrate (`CLEANUP-001`)
- [x] Funzioni future descritte come presenti — separate (`DOC-018`, `DOC-022`, `FRONTEND-002`)
- [x] Cronologia da separare dalla documentazione corrente (`DOC-001`, `DOC-007`, `DOC-023`, `IMPL-004`)
- [x] Materiale legacy — contenuti unici consolidati; copie duplicate rimosse; provenienza recuperabile dai commit Git
- [x] Coerenza Todo ↔ registri — riallineata (`WORKFLOW-002`)
- [x] Prefissi dei rilievi — aggiornati (`WORKFLOW-003`)

## Secondo audit del codice — Punti 1–7

- [x] Punto 1 — entry point, launcher, ownership e writer authority
- [x] Punto 2 — tracking, Start/Stop, generazioni e callback tardive
- [x] Punto 3 — Betfair lifecycle, Graph, diagnostica, concorrenza e cleanup
- [x] Punto 4 — storage, journal, documenti canonici e recovery
- [x] Punto 5 — Evidence, provenance, eligibility e Market Reactions
- [x] Punto 6 — frontend, session controller, polling e integrity UI
- [x] Punto 7 — runner, fixture, sandbox, harness, ledger e test map

## Documentazione e cleanup

- [x] Migrazione `.mdx` → `.md` completata
- [x] 40 file legacy sostituiti e rimossi
- [x] Documentazione canonica riallineata
- [x] Fonti duplicate consolidate e rimosse
- [x] Validations utili mantenute
- [x] `IMPL-001`, `IMPL-005`, `IMPL-032` completate
- [x] Modularizzazione dei tre registri completata e pubblicata

## Runtime e validazione

- [x] `IMPL-015` completata
- [x] Writer authority esclusiva implementata
- [x] Acquire prima della recovery
- [x] Secondo backend bloccato prima di recovery e listener
- [x] Terminal tracker barrier e tracker drain implementati
- [x] `IMPL-028` completata
- [ ] Collaudo manuale con due backend reali concorrenti non eseguito

---

# BLOCCO C — Audit codice per settori

> Le checklist C1–C13 conservano gli stati osservati durante l’audit. Le voci aperte o parziali non vengono promosse senza una nuova verifica.

## C1 — Root e launcher

- [x] Wrapper root — sottili e compatibili
- [x] Config launcher — porte preferite e percorsi verificati
- [x] Lock — schema e acquisizione conservativa verificati
- [x] Manifest — schema, identità e ownership verificati
- [x] Riuso servizi — identity check e no ownership sui reused verificati
- [-] Porte alternative — codice e test presenti; scenari reali ancora aperti
- [x] CDP — discovery bounded e nessun fallback implicito verificati
- [x] Ownership — owned/reused/external separati
- [x] Shutdown — solo processi owned; CDP preservato
- [-] Test launcher — file e runbook letti; suite non eseguita durante audit read-only

## C2 — Server e runtime backend

- [x] Bootstrap server
- [x] Recovery iniziale
- [x] Health — contratto e test HTTP verificati
- [x] Shutdown backend
- [ ] Registry Python
- [ ] Runtime logger
- [ ] Redazione dati
- [-] Test runtime — `server.test.mjs` letto; suite non eseguita

## C3 — Router Match

- [x] Endpoint inventariati
- [-] Tracking — contratto e test letti
- [-] Untrack — contratto e test letti
- [-] Stop globale — contratto e test letti
- [-] Analisi — contratto e helper letti
- [-] History — contratto integrity letto
- [-] Timeline — contratto integrity letto
- [-] Source Identity status — response builder letto
- [-] Integrity — normalizzazione e `409` letti
- [-] Test — file mirati letti, suite non eseguite

## C4 — Router Betfair

- [-] Latest — contratto, health e integrity letti
- [-] JSON — contratto e integrity letti
- [-] Odds — query e side effect letti
- [-] Login window — validazione e lifecycle letti
- [-] Log — contratto bounded letto
- [-] CDP — uso read-only in latest verificato
- [-] Runtime conflict — tracking e login verificati
- [-] Integrity — `DOC-010`
- [-] Test — file mirati presenti, suite non eseguite

## C5 — Router Evidence

- [x] Latest read-only
- [x] Conferma gate-aware
- [x] Fallback persistito
- [x] Revoca
- [x] Side effect — bootstrap possibile confermato
- [-] Errori — mapping principale verificato
- [-] Test — helper test letti, suite non eseguite
- [x] Allineamento documentale analizzato — correzione canonica ancora da eseguire al checkpoint dell'audit

## C6 — Strategy e Preflight

- [x] Strategy legacy identificata — rimozione approvata; Market Reactions escluse (`CODE-001`, `DEC-008`)
- [x] Consumer frontend Strategy — polling ogni 3 secondi al checkpoint dell'audit
- [-] Market Evidence — presenza nel view model verificata
- [x] Preflight CDP — contratto letto
- [x] Preflight Sofa URL — contratto letto
- [x] Preflight Betfair URL — `CODE-002`, `DOC-013`
- [x] Preflight Graph URL — validatore e test letti
- [-] Test — Strategy e Graph URL ispezionati; suite non eseguite

## C7 — SofaScore

- [ ] Scheduler
- [ ] Update Sofa
- [ ] Normalizzazione
- [ ] Point-by-point
- [ ] Local Context
- [ ] History
- [ ] Timeline
- [ ] Gate
- [ ] Stop e mismatch
- [ ] Test

## C8 — Betfair

- [ ] Fetch
- [ ] Scraper lifecycle
- [ ] Processor
- [ ] Timeline
- [ ] Ladder
- [ ] Graph health
- [ ] Matched volume
- [-] Cache — payload redatto; filename derivato dall’URL (`SECURITY-002`)
- [ ] Runtime health
- [ ] Login-only
- [ ] Test

## C9 — Storage e recovery

- [ ] History storage
- [ ] Timeline store
- [ ] Commit ID
- [ ] Journal store
- [ ] Atomic write
- [ ] Recovery bootstrap
- [ ] Repair Sofa
- [ ] Repair Betfair
- [ ] Integrity
- [ ] Failure mode
- [ ] Test

## C10 — Evidence e Source Identity

- [ ] Match Evidence builder
- [ ] Data quality
- [ ] No-trade reasons
- [ ] Name matching
- [ ] Confirmation store
- [ ] Effective identity
- [ ] Market Reactions
- [ ] Causality claim
- [ ] Degradazione persistence incomplete
- [ ] Test

## C11 — Frontend

- [x] App composition — ownership verificato; authority sessione frammentata (`IMPL-025`)
- [-] Session state — current/confirmed presenti ma non equivalgono a sessione accettata (`FRONTEND-003`, `IMPL-025`)
- [-] Preflight — risultati non input-bound e copy mojibake (`FRONTEND-011`, `FRONTEND-004`)
- [-] Start tracking — anticipa sessione, non serializza comandi e non gestisce failure completa (`FRONTEND-003`, `FRONTEND-006`)
- [-] Stop tracking — ferma solo Sofa e non espone cleanup parziale (`FRONTEND-007`, `RUNTIME-009`)
- [-] Bootstrap dashboard — conserva view model precedente e resta vulnerabile a response tardive (`FRONTEND-001`, `FRONTEND-002`)
- [-] Sofa polling — manca isolamento sessione e abort (`FRONTEND-001`, `FRONTEND-005`, `IMPL-026`)
- [-] Betfair polling — manca isolamento, parte anche senza Betfair e scarta integrity (`FRONTEND-001`, `FRONTEND-002`, `IMPL-026`)
- [-] Evidence polling — isolamento presente; da legare alla vista e ripulire authority legacy (`FRONTEND-007`, `CLEANUP-001`, `IMPL-026`)
- [-] Source Identity UI — polling robusto; pending key non context-scoped (`FRONTEND-010`)
- [x] Betfair health — transizioni, toast e audio verificati; enable/stop da collegare alla sessione
- [-] View model — non riceve integrity e non azzera/etichetta dati stale (`FRONTEND-002`, `IMPL-009`)
- [x] Money Flow — mapping `selectionId`, griglia e grafico neutro verificati
- [x] Match Context — mapping e validazione verificati
- [-] Market Reactions — availability/schema UI non coerenti (`FRONTEND-009`, `IMPL-027`)
- [x] Strategy UI — rimozione approvata senza correzione (`CODE-001`, `DEC-008`)
- [ ] Piccole correzioni/mojibake — task separata (`FRONTEND-004`)
- [ ] Responsive completo — task separata dopo robustezza (`FRONTEND-012`, `DEC-017`)
- [ ] Build — non eseguita durante audit read-only
- [-] Lint — script presente ma configurazione assente (`CODE-005`)
- [-] Test — lifecycle hook non coperto e nessun runner canonico (`TEST-044…059`, `TEST-003`)

## C12 — Python e script

- [x] SofaScore CLI — verificata
- [x] SofaScore browser — headless/headed e fetch pagina verificati
- [x] Betfair CLI — opzioni e validazione CDP verificate
- [x] Persistent profile — ownership context verificata
- [x] CDP mode — URL locale obbligatoria e context preservato
- [x] Graph URL — parser e mapping verificati
- [-] Network capture — path pubblico e task non attese (`SECURITY-001`, `PYTHON-001`)
- [-] Diagnostic redaction — contenuti redatti; confini pubblici ancora incompleti (`SECURITY-001`, `SECURITY-003`)
- [ ] Cache
- [ ] Wrapper root
- [ ] Cleanup runtime cache
- [ ] PowerShell
- [-] Test Python — file mirati letti; non eseguiti

## C13 — Cleanup

- [ ] File legacy
- [-] Codice morto — candidati Evidence/Source Identity (`CLEANUP-001`)
- [ ] File duplicati
- [ ] Test obsoleti
- [ ] Script non usati
- [ ] Documenti non canonici
- [ ] Import non usati
- [-] Componenti non raggiungibili — `SourceIdentityControls` già classificato legacy; verifica finale aperta
- [ ] Route non consumate
- [-] Log o debug superati — messaggi mojibake e dettagli HTTP raw da correggere (`FRONTEND-004`, `SECURITY-003`)

---

# BLOCCO D — Ricontrollo task completate e priorità

## Ricontrollo D1–D18

- [x] D1 — Source Identity Task 1A — **CONFERMATA CON LIMITI**
- [x] D2 — Source Identity frontend Task 1B — **CONFERMATA CON LIMITI**
- [x] D3 — Money Flow 2A — **CONFERMATA**
- [x] D4 — Money Flow 2B — **CONFERMATA**
- [x] D5 — Money Flow 2C — **CONFERMATA**
- [x] D6 — Money Flow 2D — **CONFERMATA**
- [x] D7 — Money Flow 2E — **CONFERMATA**
- [x] D8 — Validazione live Betfair 2F — **CONFERMATA CON LIMITI** (`TEST-001`, `IMPL-004`)
- [x] D9 — Runtime launcher Task 2 — **CONFERMATA CON LIMITI; NON RIAPRIRE SENZA DISCREPANZA** (`RUNTIME-001`)
- [x] D10 — Stop globale Task 3a — **CONFERMATA**
- [x] D11 — Timeline store Task 4 — **CONFERMATA**
- [x] D12 — Commit journal Task 6 — **CONFERMATA**
- [x] D13 — Recovery — **CONFERMATA CON LIMITI** (`IMPL-008`)
- [-] D14 — Persistence integrity — **DA RIAPRIRE SOLO FRONTEND/CROSS-LAYER** (`FRONTEND-002`, `DOC-018`, `DOC-022`, `IMPL-009`)
- [x] D15 — Evidence degradation — **CONFERMATA**
- [x] D16 — Context locale V1 — **CONFERMATA CON LIMITI** (`SOFA-001`)
- [-] D17 — Diagnostica Betfair — **DA RIAPRIRE SOLO HARDENING PUBBLICO/CAPTURE** (`SECURITY-001…003`, `PYTHON-001`, `IMPL-007`)
- [x] D18 — Retention cache runtime — **CONFERMATA CON LIMITI** (`CLEANUP-002`)

```txt
CONFERMATA: 9
CONFERMATA CON LIMITI: 7
DA RIAPRIRE: 2
```

Regola: riaprire soltanto il sotto-perimetro difettoso, senza annullare le parti già corrette.

## Priorità critica

- [ ] Session authority end-to-end (`IMPL-006`)
- [ ] Betfair runtime command authority (`IMPL-016`)
- [ ] Local control-plane boundary (`IMPL-017`)
- [ ] Event persistence authority (`IMPL-019`)
- [ ] Canonical document contract e verified recovery (`IMPL-020`)
- [ ] Evidence temporal provenance e alignment (`IMPL-022`)
- [ ] Market Reaction eligibility e branch state (`IMPL-023`)
- [ ] Frontend live-session controller (`IMPL-025`)
- [ ] Polling runtime session-scoped (`IMPL-026`)
- [ ] Frontend interaction test harness (`IMPL-030`)

## Priorità alta

- [ ] Betfair acquisition envelope e provenance (`IMPL-018`)
- [ ] Recovery control plane (`IMPL-021`)
- [ ] Runner temporal identity e price comparability (`IMPL-024`)
- [ ] Market Reactions frontend view model (`IMPL-027`)
- [ ] Fixture catalog e sandbox condivisa (`IMPL-029`)
- [ ] Validation result ledger (`IMPL-031`)
- [ ] Hardening diagnostico e network capture
- [ ] Retention e cleanup offline

## Futuro o condizionato

- [~] Toolkit strategie offline (`IMPL-010`)
- [~] Ottimizzazione Betfair misurata (`IMPL-014`)

Nessuna di queste voci è stata selezionata automaticamente come prossima task.

---

# BLOCCO E — Rilievi registrati

## Documentazione e struttura

- [x] `DOC-001` — Roadmap troppo storica — **CONFERMATO**
- [x] `DOC-002` — Repository map troppo estesa — **CONFERMATO**
- [x] `DOC-003` — Evidence read-only/mutante — **CONFERMATO**
- [x] `DOC-004` — Conversione `.mdx → .md` strutturale — **CONFERMATO**
- [x] `DOC-005` — Convenzioni precedenti imponevano `.mdx` — **CONFERMATO**
- [x] `DOC-006` — Duplicazione nei documenti di orientamento — **CONFERMATO**
- [x] `DOC-007` — Current State mescolava stato, storia e validazione — **CONFERMATO**
- [x] `DOC-008` — README da aggiornare durante la migrazione — **CONFERMATO**
- [x] `DOC-009` — Match `debug-last` senza producer — **CONFERMATO**
- [x] `DOC-010` — Adapter integrity Betfair citato con nome errato — **CONFERMATO**
- [x] `DOC-011` — API troppo estese rispetto ai moduli owner — **CONFERMATO**
- [x] `DOC-012` — Strategy legacy ma attiva — **CONFERMATO**
- [x] `DOC-013` — Preflight documentato più forte del controllo reale — **CONFERMATO**
- [x] `DOC-014` — Ordine tracking key/classificazione Betfair descritto male — **CONFERMATO**
- [x] `DOC-015` — Documenti owner duplicano contratti trasversali — **CONFERMATO**
- [x] `DOC-016` — Facade Storage/read-only descritte in modo troppo forte — **CONFERMATO**
- [x] `DOC-017` — Input Market Reactions descritto male — **CONFERMATO**
- [x] `DOC-018` — Pipeline integrity frontend descritta ma non collegata — **CONFERMATO**
- [x] `DOC-019` — Hardening Python descritto più forte del codice — **CONFERMATO**
- [x] `DOC-020` — Percorso `.pending_commits` errato in alcuni documenti — **CONFERMATO**
- [x] `DOC-021` — Validation/rollback e runbook troppo estesi — **CONFERMATO**
- [x] `DOC-022` — Current State non aggiornato — **CONFERMATO**
- [x] `DOC-023` — Collaudi storici mescolati ai runbook — **CONFERMATO**
- [x] `DOC-024` — Ownership processo distinta da writer authority — **COMPLETATO**
- [x] `DOC-025` — Generation Python distinta dalla session authority — **CONFERMATO**
- [x] `DOC-026` — Temporal provenance e policy di alignment non documentate — **CONFERMATO; CORREZIONE APPROVATA**
- [x] `DOC-027` — Availability, activity/response e threshold non documentati — **CONFERMATO; CORREZIONE APPROVATA**
- [x] `DOC-028` — Session shell contraddice la session authority approvata — **CONFERMATO; CORREZIONE APPROVATA**
- [x] `DOC-029` — Polling/view model descritti come più completi del codice — **CONFERMATO; CORREZIONE APPROVATA**
- [x] `DOC-030` — UI Betfair/Market Reactions descritta come integrity-aware senza wiring reale — **CONFERMATO; CORREZIONE APPROVATA**
- [x] `DOC-031` — Runbook Validation monolitico e non verificabile automaticamente — **CONFERMATO; REFACTOR APPROVATO**
- [x] `DOC-032` — Semantica di stato dei test non formalizzata — **CONFERMATO; CORREZIONE APPROVATA**
- [x] `DOC-033` — Documenti canonici possono anticipare contratti approvati ma non implementati — **CONFERMATO; POLICY APPROVATA**

## Workflow e regole

- [x] `WORKFLOW-001` — Context selection con troppe responsabilità — **CONFERMATO**
- [x] `WORKFLOW-002` — Todo e registro analitico divergenti — **COMPLETATO**
- [x] `WORKFLOW-003` — Prefissi `SECURITY-`/`PYTHON-` non dichiarati — **COMPLETATO**
- [x] `WORKFLOW-004` — SHA, range e stato sintetico dei registri possono divergere — **COMPLETATO**
- [x] `WORKFLOW-005` — Migrazione documentale per batch con controlli prima della consegna — **COMPLETATO**
- [x] `RUNTIME-001` — Non riaprire runtime Task 2 senza discrepanza — **REGOLA APPROVATA**

## Codice, runtime, sicurezza, dati, frontend e cleanup

- [x] `CODE-001` — Strategy legacy attiva — **RIMOZIONE APPROVATA; MARKET REACTIONS PRESERVATE**
- [ ] `CODE-002` — Validatore Betfair non condiviso tra Preflight/Start/Login — **CONFERMATO; VALIDATORE UNICO APPROVATO**
- [x] `CODE-003` — Match `debug-last` sempre vuoto — **RIMOZIONE APPROVATA**
- [x] `CODE-004` — Strategy usa `localhost:3001` hardcoded — **ASSORBITO DALLA RIMOZIONE CODE-001**
- [ ] `CODE-005` — Script lint frontend pubblicato ma non eseguibile — **CONFERMATO; CORREZIONE GRADUALE APPROVATA**
- [ ] `CODE-006` — Preflight Graph divergente dal runtime — **CONFERMATO; PARITÀ APPROVATA**
- [ ] `CODE-007` — Probe CDP di `/latest` guidato dalla query — **CONFERMATO; SESSION-OWNED APPROVATO**
- [ ] `RUNTIME-002` — Nuovo Start non invalida la sessione precedente — **CONFERMATO; PRIORITÀ CRITICA**
- [x] `RUNTIME-003` — Avvii manuali aggiravano l’autorità sulla persistenza — **COMPLETATO**
- [ ] `RUNTIME-004` — Riavvio dello stesso eventId contamina il gate nuovo — **CONFERMATO; PRIORITÀ CRITICA**
- [x] `RUNTIME-005` — `/untrack` legacy senza cleanup fisico — **RIMOZIONE APPROVATA**
- [ ] `RUNTIME-006` — Mismatch stale può fermare la sessione corrente — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `RUNTIME-007` — Promise Betfair riutilizzata tra sessioni logiche — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `RUNTIME-008` — Mismatch non termina fisicamente SofaScore — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `RUNTIME-009` — Stop pubblico nasconde cleanup parziale — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `RUNTIME-010` — Conferma Source Identity stale sul gate nuovo — **CONFERMATO; PRIORITÀ ALTA**
- [x] `RUNTIME-011` — `/api/betfair/odds` è un secondo ingresso mutante — **RIMOZIONE APPROVATA; PRIORITÀ CRITICA**
- [ ] `RUNTIME-012` — Manca autorità globale dei comandi Betfair — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `SECURITY-001` — Payload network capture oltrepassa il boundary pubblico — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `SECURITY-002` — Cache URL-derived e priva di runtime/Graph identity — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `SECURITY-003` — Dettagli raw degli errori HTTP — **CONFERMATO**
- [ ] `SECURITY-004` — Manca local control-plane boundary — **CONFERMATO; PRIORITÀ CRITICA**
- [x] `SECURITY-005` — Flag Chromium indebolenti nel default — **RIMOZIONE APPROVATA SALVO NECESSITÀ DIMOSTRATA**
- [ ] `DATA-001` — Volume runner sintetico `marketTotal/runnerCount` — **RIMOZIONE APPROVATA; PRIORITÀ CRITICA**
- [ ] `DATA-002` — API/Graph senza acquisition timestamp e skew — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `FRONTEND-001` — Response Sofa/Betfair tardive o fuori ordine attraversano la sessione — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `FRONTEND-002` — Integrity raccolta ma scartata prima della UI — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `FRONTEND-003` — Start fallito lascia sessione e polling nascosti — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `FRONTEND-004` — Copy mojibake visibile — **CONFERMATO; TASK SEPARATA**
- [ ] `FRONTEND-005` — Loop di polling orfani dopo cambio sessione/cleanup — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `FRONTEND-006` — Start/Stop concorrenti non serializzati — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `FRONTEND-007` — Stop Live lascia attivi Betfair/Evidence/Source Identity/audio — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `FRONTEND-008` — Indicatori live derivati dalla presenza del dato — **CONFERMATO; STATE MACHINE APPROVATA**
- [ ] `FRONTEND-009` — Market Reactions UI promuove unavailable e usa schema errato — **CONFERMATO; IMPL-027 APPROVATA**
- [ ] `FRONTEND-010` — Pending modal non legata a session/context identity — **CONFERMATO; CONTEXT ID OPACO APPROVATO**
- [ ] `FRONTEND-011` — Preflight results non legati agli input verificati — **CONFERMATO; FINGERPRINT APPROVATO**
- [ ] `FRONTEND-012` — Responsive strutturalmente assente — **LIMITE CONFERMATO; TASK SEPARATA**
- [ ] `PYTHON-001` — Task network capture non tracked/drained/cancelled — **CONFERMATO**
- [x] `CLEANUP-001` — Authority Source Identity legacy frontend — **RIMOZIONE APPROVATA; AUTHORITY GLOBALE UNICA**
- [ ] `CLEANUP-002` — Apply offline privo di maintenance authority e porte effettive — **CONFERMATO**
- [ ] `CLEANUP-003` — Log e network dump senza retention distinta — **CONFERMATO; PRIORITÀ MEDIO-ALTA**

## Storage, journal e recovery

- [ ] `STORAGE-001` — Journal source-scoped su shared history event-scoped — **CONFERMATO; IMPL-019 APPROVATA; PRIORITÀ CRITICA**
- [ ] `STORAGE-002` — Target marked complete non verificato nei record parziali — **CONFERMATO; CORREZIONE APPROVATA; PRIORITÀ CRITICA**
- [ ] `STORAGE-003` — Target verification limitata a JSON.parse — **CONFERMATO; IMPL-020 APPROVATA; PRIORITÀ CRITICA**
- [ ] `STORAGE-004` — Journal invalido non attribuibile nascosto dall’integrity — **CONFERMATO; READ-ONLY INTEGRITY_UNKNOWN APPROVATO**
- [ ] `SECURITY-006` — EventId e target non confinati dallo Storage — **CONFERMATO; VALIDAZIONE E ROOT CONFINEMENT APPROVATI**
- [ ] `STORAGE-005` — Shared history espone soltanto integrity SofaScore — **CONFERMATO; INTEGRITY AGGREGATA APPROVATA**
- [ ] `STORAGE-006` — Stato cross-source pubblicato prima del commit — **CONFERMATO; COMMITTED-ONLY APPROVATO**
- [ ] `STORAGE-007` — Missing, corruzione e I/O failure collassano in `null` — **CONFERMATO; READ CONTRACT STRUTTURATO APPROVATO**
- [ ] `STORAGE-008` — Duplicati evento risolti con `sort()[0]` — **CONFERMATO; AMBIGUITY BLOCCANTE APPROVATA**
- [ ] `STORAGE-009` — Nessuna policy persistita dei tentativi recovery — **CONFERMATO; IMPL-021 APPROVATA**
- [ ] `STORAGE-010` — Amplificazione full-document per ogni tick — **LIMITE CONFERMATO; MISURARE CON IMPL-013**
- [ ] `STORAGE-011` — Atomicità process-level non equivale a durabilità power-loss — **LIMITE CONFERMATO; DA MISURARE**
- [ ] `STORAGE-012` — Writer raw non journalizzati ancora esportati — **SUPERFICIE CONFERMATA; INVENTARIO E CHIUSURA APPROVATI**

## Evidence e verifiche di dominio

- [ ] `EVIDENCE-001` — Fallback nome nei confronti runner Field → Market — **DEC-010 APPROVATA; IMPLEMENTAZIONE MANCANTE**
- [ ] `EVIDENCE-002` — Tick degradati/status-only possono diventare nuovi eventi Market Reactions — **CONFERMATO; IMPL-023 APPROVATA; PRIORITÀ CRITICA**
- [ ] `EVIDENCE-003` — Attività matched generale classificata come market response — **CONFERMATO; SEMANTICA DA SEPARARE**
- [ ] `EVIDENCE-004` — Marker persistente confuso con nuova comparsa successiva — **CONFERMATO; TRANSITION GATE APPROVATO**
- [ ] `EVIDENCE-005` — `maxTickGapSec` non misura il source skew e timestamp futuri risultano freschi — **CONFERMATO; IMPL-022 APPROVATA**
- [ ] `EVIDENCE-006` — Confronti prezzo con source diverse e baseline non bounded — **CONFERMATO; IMPL-024 APPROVATA**
- [ ] `EVIDENCE-007` — Qualità globale positiva con un solo runner affidabile — **CONFERMATO; COVERAGE ESPLICITA APPROVATA**
- [ ] `EVIDENCE-008` — Baseline Significant Flow/cluster e threshold non sufficientemente definiti — **LIMITE CONFERMATO; POLICY APPROVATA**
- [ ] `EVIDENCE-009` — `available` e stato delle finestre hanno semantiche non uniformi — **CONFERMATO; BRANCH STATE APPROVATO**
- [ ] `SOFA-001` — Ultimo game PBP considerato aperto — **DA VERIFICARE LIVE**

## Test e coperture richieste

- [ ] `TEST-001` — Test dedicato tick Betfair `status-only` — **MANCANTE**
- [ ] `TEST-002` — Test lifecycle cambio sessione/Start fallito — **MANCANTE**
- [x] `TEST-003` — Inventario, manifest e comando test canonico — **RUNNER IMPLEMENTATO; MATRICE COMPLETA ANCORA APERTA**
- [x] `TEST-004` — Secondo bootstrap sulla stessa storage identity bloccato prima di recovery e listener — **IMPLEMENTATO E PASSATO**
- [ ] `TEST-005` — Matrice sostituzione sessione backend — **MANCANTE**
- [ ] `TEST-006` — Riuso Betfair session-safe — **MANCANTE**
- [ ] `TEST-007` — Cleanup mismatch completo SofaScore/Betfair — **MANCANTE**
- [ ] `TEST-008` — Stop partial failure backend/UI — **MANCANTE**
- [ ] `TEST-009` — Conferma Source Identity stale — **MANCANTE**
- [ ] `TEST-010` — Validatore Betfair condiviso — **MANCANTE**
- [ ] `TEST-011` — Parità Graph Preflight/runtime — **MANCANTE**
- [ ] `TEST-012` — Un solo comando Betfair globale — **MANCANTE**
- [ ] `TEST-013` — Endpoint `/odds` rimosso, letture preservate — **MANCANTE**
- [ ] `TEST-014` — Probe CDP session-owned — **MANCANTE**
- [ ] `TEST-015` — Network capture bounded e drained — **MANCANTE**
- [ ] `TEST-016` — Nessun volume runner sintetico — **MANCANTE**
- [ ] `TEST-017` — Acquisition timestamp e Graph skew — **MANCANTE**
- [ ] `TEST-018` — Retention log/dump e maintenance authority — **MANCANTE**
- [ ] `TEST-019` — Lost update cross-source shared history — **MANCANTE**
- [ ] `TEST-020` — Pending cross-source sullo shared target — **MANCANTE**
- [ ] `TEST-021` — Verifica target completed nei record parziali — **MANCANTE**
- [ ] `TEST-022` — Target JSON valido ma identity/digest errati — **MANCANTE**
- [ ] `TEST-023` — Journal invalido → read-only `integrity_unknown` — **MANCANTE**
- [ ] `TEST-024` — Aggregate integrity shared history — **MANCANTE**
- [ ] `TEST-025` — Stato cross-source soltanto committed — **MANCANTE**
- [ ] `TEST-026` — Read status Storage distinti — **MANCANTE**
- [ ] `TEST-027` — Duplicate event documents bloccanti — **MANCANTE**
- [ ] `TEST-028` — EventId e target confinement — **MANCANTE**
- [ ] `TEST-029` — Nessun consumer runtime dei writer raw — **MANCANTE**
- [ ] `TEST-030` — Retry, escalation e rearm recovery — **MANCANTE**
- [ ] `TEST-031` — Tick `status-only` non crea nuovo Significant Flow/source event — **MANCANTE**
- [ ] `TEST-032` — Eligibility tecnica Market Reactions su stale/Graph/ladder/skew — **MANCANTE**
- [ ] `TEST-033` — `selectionId` obbligatorio senza fallback nome — **MANCANTE**
- [ ] `TEST-034` — Market activity distinta da qualified observation — **MANCANTE**
- [ ] `TEST-035` — Marker presente distinto da marker transition — **MANCANTE**
- [ ] `TEST-036` — Price source change degradata/unavailable — **MANCANTE**
- [ ] `TEST-037` — Baseline gap oltre soglia — **MANCANTE**
- [ ] `TEST-038` — Coverage runner complete/partial/none — **MANCANTE**
- [ ] `TEST-039` — Acquisition timestamp, source skew e clock skew — **MANCANTE**
- [ ] `TEST-040` — Baseline Significant Flow per `selectionId` — **MANCANTE**
- [ ] `TEST-041` — Cluster temporali non sovrapposti — **MANCANTE**
- [ ] `TEST-042` — Semantica computed/available/observed — **MANCANTE**
- [ ] `TEST-043` — Finestre open/closed e provisional/final — **MANCANTE**
- [ ] `TEST-044` — Start A/B concorrenti e risposta tardiva — **MANCANTE**
- [ ] `TEST-045` — Start fallito/ambiguo e cleanup compensativo — **MANCANTE**
- [ ] `TEST-046` — Response Sofa/Betfair vecchie o fuori ordine — **MANCANTE**
- [ ] `TEST-047` — Cleanup durante fetch senza timeout ricreato — **MANCANTE**
- [ ] `TEST-048` — Stop completo: tutti i poller sospesi e snapshot frozen — **MANCANTE**
- [ ] `TEST-049` — Stop parziale visibile in UI — **MANCANTE**
- [ ] `TEST-050` — Persistence UI locale/globale e snapshot degraded — **MANCANTE**
- [ ] `TEST-051` — EventId/trackingSessionId dalla risposta Start — **MANCANTE**
- [ ] `TEST-052` — Nuovo Source Identity context con stessi nomi — **MANCANTE**
- [ ] `TEST-053` — Preflight input-bound e response stale — **MANCANTE**
- [ ] `TEST-054` — Market Reactions branch `available:false` — **MANCANTE**
- [ ] `TEST-055` — Mapping schema Market Reactions reale — **MANCANTE**
- [ ] `TEST-056` — Nessun falso stato live/connected/polling active — **MANCANTE**
- [ ] `TEST-057` — Sessione Sofa-only senza polling Betfair — **MANCANTE**
- [ ] `TEST-058` — StrictMode con una sola catena polling — **MANCANTE**
- [ ] `TEST-059` — Smoke responsive desktop/tablet/mobile — **MANCANTE**
- [x] `TEST-060` — Manifest enumera ogni comando una sola volta — **IMPLEMENTATO E PASSATO**
- [x] `TEST-061` — Path mancante nel manifest fallisce prima della suite — **IMPLEMENTATO E PASSATO**
- [x] `TEST-062` — Test legacy eseguiti in processi isolati — **IMPLEMENTATO E PASSATO**
- [x] `TEST-063` — Timeout termina il processo e produce failure bounded — **IMPLEMENTATO E PASSATO**
- [x] `TEST-064` — Moduli Python `*_test.py` inclusi esplicitamente — **IMPLEMENTATO E PASSATO**
- [ ] `TEST-065` — Sandbox rimossa su successo e fallimento — **MANCANTE**
- [ ] `TEST-066` — Nessun test accede alle directory runtime reali — **MANCANTE**
- [ ] `TEST-067` — Fixture schema, provenance e redaction validate — **MANCANTE**
- [x] `TEST-068` — TEST-ID dei registri coerenti con il manifest — **IMPLEMENTATO E PASSATO**
- [ ] `TEST-069` — Result JSON contiene SHA, profilo, conteggi e limiti — **COPERTURA PARZIALE; REQUIREMENT NON CHIUSO**
- [ ] `TEST-070` — Result JSON non contiene segreti, URL o path vietati — **COPERTURA PARZIALE; REQUIREMENT NON CHIUSO**
- [ ] `TEST-071` — Frontend harness monta hook in StrictMode con fake timer — **MANCANTE**
- [ ] `TEST-072` — Route harness verifica HTTP reale su porta dinamica — **MANCANTE**
- [x] `TEST-073` — Profilo `fast` non avvia browser, rete esterna o tracking — **IMPLEMENTATO E PASSATO**
- [ ] `TEST-074` — Benchmark registra mediana/p95 senza dati live — **MANCANTE**
- [ ] `TEST-075` — Comando lint eseguibile oppure rimosso dalla superficie ufficiale — **MANCANTE**
- [x] `TEST-076` — Tutti i documenti canonici indicizzati sono inventariati una sola volta — **COMPLETATO**
- [x] `TEST-077` — Ogni sostituzione `.mdx` → `.md` ha mapping univoco e nessun duplicato canonico — **COMPLETATO**
- [x] `TEST-078` — Tutti i link relativi dei file migrati risolvono e non puntano a percorsi rimossi — **COMPLETATO**
- [x] `TEST-079` — Stato corrente, deprecato, storico e futuro coerenti con codice e registri — **COMPLETATO**

---

# BLOCCO F — Implementazioni utili

- [x] `IMPL-001` — Link checker Markdown/MDX — **IMPLEMENTATA**
- [x] `IMPL-002` — Inventario endpoint — **CONSIGLIATA**
- [x] `IMPL-003` — Matrice test ↔ modulo ↔ documento — **NECESSARIA**
- [x] `IMPL-004` — Archivio collaudi storici — **COMPLETATA; EVIDENZE CORRENTI IN `docs/validations/`**
- [x] `IMPL-005` — Coerenza Todo ↔ registri — **IMPLEMENTATA E VERIFICATA**
- [x] `IMPL-006` — Session authority end-to-end — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-007` — Serializer pubblico diagnostica/errori — **NECESSARIA**
- [x] `IMPL-008` — Harness offline persistence/recovery — **CONSIGLIATA**
- [x] `IMPL-009` — Adapter persistence + stati locali + pannello sidebar — **NECESSARIA**
- [~] `IMPL-010` — Toolkit autonomo studio strategie offline — **FUTURO**
- [x] `IMPL-011` — Authority di manutenzione cleanup offline — **NECESSARIA**
- [x] `IMPL-012` — Fixture versionate e replay offline — **NECESSARIA PRIMA DEL BACKTESTING**
- [x] `IMPL-013` — Baseline end-to-end e freshness — **NECESSARIA PRIMA DI OTTIMIZZARE**
- [~] `IMPL-014` — Ottimizzazione Betfair misurata e reversibile — **FUTURO**
- [x] `IMPL-015` — Writer authority esclusiva `match_history` — **COMPLETATA**
- [x] `IMPL-016` — Betfair runtime command authority — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-017` — Local control-plane boundary — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-018` — Betfair acquisition envelope e provenance — **APPROVATA; PRIORITÀ ALTA**
- [x] `IMPL-019` — Event persistence authority — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-020` — Canonical document contract e verified recovery — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-021` — Recovery control plane — **APPROVATA; PRIORITÀ ALTA**
- [x] `IMPL-022` — Evidence temporal provenance and alignment policy — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-023` — Market Reaction eligibility e branch state — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-024` — Runner temporal identity e price comparability — **APPROVATA; PRIORITÀ ALTA**
- [x] `IMPL-025` — Frontend live-session controller — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-026` — Polling runtime session-scoped — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-027` — Market Reactions frontend view model — **APPROVATA; PRIORITÀ ALTA**
- [x] `IMPL-028` — Manifest e runner canonico di validazione — **IMPLEMENTATA E VALIDATA**
- [x] `IMPL-029` — Fixture catalog e sandbox condivisa — **APPROVATA; PRIORITÀ ALTA**
- [x] `IMPL-030` — Frontend interaction test harness — **APPROVATA; PRIORITÀ CRITICA**
- [x] `IMPL-031` — Validation result ledger e artefatti JSON — **APPROVATA; PRIORITÀ ALTA**
- [x] `IMPL-032` — Pipeline di migrazione documentale per batch — **COMPLETATA**

---

# BLOCCO G — Workflow operativo permanente

- [x] Ruoli permanenti: Chat Analisi, Chat Esecutore, Desktop Esecutore e Desktop Collaudatore
- [x] Esecutore e collaudatore separati
- [x] Massimo tre tentativi ragionati per prompt esecutivo
- [x] Report finale obbligatorio con file, comandi, test, esiti e limiti
- [x] `fileModificati.md` riservato ai flussi Desktop che lo richiedono
- [x] Commit e push riservati all’utente
- [x] Nessun PASS dichiarato senza output verificabile
- [x] Nessun dato sensibile nei report

---

# BLOCCO H — Modularizzazione e pulizia

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 7 moduli
- [x] ID globali mantenuti
- [x] Link relativi verificati
- [x] Registry checker ricorsivo verificato
- [x] Nessuna seconda copia canonica monolitica
- [x] Soglia di modularizzazione raggiunta
- [x] Soglie guida conservate: oltre 1.500–2.000 righe, oltre 100 rilievi o rilettura troppo costosa
- [x] Dopo una migrazione restano file correnti, strumenti di controllo riutilizzabili e materiali archive preservati intenzionalmente
- [x] Le pulizie automatiche o generiche non cancellano `docs/archive/`

---

# BLOCCO I — Preparazione delle task esecutive

Per ogni task selezionata devono essere definiti:

- [ ] problema dimostrato
- [ ] obiettivo
- [ ] comportamento da preservare
- [ ] file modificabili
- [ ] file consultabili
- [ ] fuori scope
- [ ] dipendenze
- [ ] test automatici
- [ ] eventuale collaudo live
- [ ] massimo tre tentativi
- [ ] report obbligatorio
- [ ] criteri di successo
- [ ] criteri di stop
- [ ] impatto documentale
- [ ] decisioni utente già risolte

---

# BLOCCO J — Stato di chiusura

- [x] Audit documentazione completato
- [x] Audit codice completato
- [x] Ricontrollo D1–D18 completato
- [x] Finding classificati
- [x] Decisioni utente registrate
- [x] Documentazione canonica aggiornata
- [x] Registri modularizzati
- [x] Checker e link verificati
- [x] Stato dei registri verificato sul commit documentale `8f936d1`
- [ ] Prima serie di nuove task esecutive completata
- [ ] Test mancanti implementati
- [ ] Collaudi live residui conclusi
- [ ] Stato finale del prodotto dopo le prossime correzioni tecniche

## Verifiche dell’ultimo checkpoint

```txt
checkpoint registri: 8f936d1
registry checker tests: 18 PASS
nested registry tests: 2 PASS
registry consistency: 240 owner ID, 214 righe Todo, 0 errori, 0 warning
documentation links: 72 file, 428 link, 0 errori, 0 warning
validation fast: 6 PASS, 0 failure, 0 timeout
git diff --check: PASS
```

Le decisioni più recenti sintetizzate sono `DEC-025` e `DEC-026`.

## Prossimo passo

Prossimo passo: DA SELEZIONARE.
