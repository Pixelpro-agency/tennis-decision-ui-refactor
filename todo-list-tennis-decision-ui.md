# Tennis Decision UI — Todo list e stato operativo

## Scopo

Questa Todo è la vista operativa unica e sintetica della revisione di **Tennis Decision UI**.

Serve a:

- mostrare lo stato corrente verificabile senza duplicare le schede owner;
- conservare inventari e checkpoint storici dell’audit quando restano utili;
- distinguere comportamento presente, mitigazioni parziali, lavoro approvato ma non completato, futuro e verifiche mancanti;
- collegare gli ID sintetici alle relative schede owner;
- mantenere separati stato tecnico corrente, provenance storica e risultati di validation;
- fornire una base per preparare task esecutive separate senza selezionare automaticamente la prossima task.

Le motivazioni, le decisioni e le evidenze analitiche complete vivono nei moduli sotto `implementazioni/`. La documentazione tecnica corrente vive sotto `docs/tennis-decision-ui/`. Questa Todo non sostituisce nessuno dei due livelli.


### Provenance storica del recupero documentale

```txt
SHA base del recupero documentale: 8f936d1a3686b775e967e375576f52f19da461a5
Commit di applicazione del recupero: 2ebe7e8ad0935bf0195679452d2e54e1de4d63dc
Data del recupero documentale: 2026-08-06
```

Questi riferimenti restano esclusivamente provenance storica del recupero documentale.

## Legenda

```txt
[x] classificazione/decisione/attività completata oppure condizione verificata indicata dal testo
[ ] lavoro, implementazione, verifica o copertura ancora aperta
[-] parziale, mitigato, coperto solo in parte o con limite residuo
[~] futuro o rinviato
```

Lo stato testuale in **grassetto** è l’autorità sintetica della riga. Una checkbox `[x]` non equivale automaticamente a “codice implementato”.

---

# BLOCCO A — Stato corrente, fonti e inventario **3/4 COMPLETA**

## A1 — Fonti operative **COMPLETA**

- [x] [Indice root](./implementazioni-tennis-decision-ui.md)
- [x] [Indice dei registri](./implementazioni/README.md)
- [x] [Metodo e stati](./implementazioni/00-metodo-e-stati.md)
- [x] [Decisioni dell’utente](./implementazioni/99-decisioni-utente.md)
- [x] [Documentazione canonica](./docs/tennis-decision-ui/index.md)
- [x] [Validazioni](./docs/validations/)
- [x] `docs/archive/` — **PRESENTE; materiale non canonico, da non usare come prova di implementazione**

## A2 — Inventario tecnico e copertura

- [x] A1 — Repository e branch canonico identificati
- [x] A2 — Entry point pubblico `avvio.py` già inventariato nel checkpoint
- [x] A3 — Orchestrazione `launcher/app.py` già inventariata nel checkpoint
- [x] A4 — Router backend correnti verificati nel bootstrap: Match, Betfair, Test/Preflight, Evidence
- [x] A5 — Bootstrap corrente: writer authority acquisita prima della recovery; recovery prima del listener
- [x] A6 — Registry processi Python già individuato
- [x] A7 — Composizione frontend e hook live individuati
- [ ] A8 — Inventario completo root — **NON COMPLETO**
- [ ] A9 — Inventario completo directory backend — **NON RICOSTRUITO**
- [ ] A10 — Inventario completo directory frontend — **NON RICOSTRUITO**
- [ ] A11 — Inventario completo package Python — **NON RICOSTRUITO**
- [ ] A12 — Inventario completo script operativi — **NON RICOSTRUITO**
- [-] A13 — Inventario test — **MANIFEST CANONICO PRESENTE, MA LA MATRICE COMPLETA TEST ↔ OWNER ↔ DOCUMENTO RESTA APERTA**
- [-] A14 — Inventario documenti canonici — **INDICE E STRUTTURA CORRENTI PRESENTI; IL VECCHIO CONTEGGIO “40” NON VIENE RIUTILIZZATO COME DATO CORRENTE**
- [-] A15 — Legacy e file generati — **SEPARAZIONE CORRENTE FRA `docs/tennis-decision-ui/`, `docs/validations/` E `docs/archive/` VERIFICATA**
- [-] A16 — Matrice codice ↔ documentazione — **PARZIALE; NON COMPLETA**

## A3 — Struttura dei registri **COMPLETA**

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 7 moduli
- [x] ID globali mantenuti nei registri
- [x] `scripts/check_registry_consistency.py` continua a usare i Blocchi E/F come righe sintetiche canoniche
- [x] La Todo resta un singolo documento operativo
- [x] Nessuno split aggiuntivo introdotto per sola dimensione

## A4 — Regole documentali correnti **COMPLETA**

- [x] Documentazione tecnica canonica in Markdown ordinario
- [x] Nessun nuovo documento `.mdx` richiesto dalla struttura corrente
- [x] Stato corrente, storico, futuro e validation devono restare distinti
- [x] La documentazione canonica deve descrivere soltanto comportamento supportato dal codice corrente
- [x] Decisioni approvate ma non implementate restano nei registri
- [x] Le validations sono evidenze datate e non sostituiscono l’autorità del codice
- [x] `docs/archive/` è non canonico e non costituisce prova di implementazione
- [x] Cronologia e provenance restano affidate a Git e alle validation datate, non a stati inventati nella Todo

---


# BLOCCO B0 — Regole documentali permanenti **COMPLETA**

- [x] Nuovi documenti tecnici soltanto in formato `.md`
- [x] Non creare nuovi documenti `.mdx`
- [x] Loader/generatore verificato nel closeout della migrazione — nessun loader MDX richiesto
- [x] Formato metadata corrente — Markdown ordinario, nessun frontmatter predefinito
- [x] Migrazione MDX completata — metadata JavaScript rimossi dai documenti canonici
- [x] Migrazione MDX completata — link `.mdx` → `.md` aggiornati
- [x] Nessun duplicato canonico `.mdx` e `.md`
- [x] Vecchi `.mdx` eliminati soltanto dopo la verifica completa prevista dalla migrazione
- [x] Requisiti ancora validi collegati a rilievi e IMPL
- [x] Storico, futuro e stato corrente separati
- [x] La documentazione canonica descrive soltanto comportamento implementato e verificato nel codice corrente
- [x] Decisioni approvate ma non implementate restano nei registri
- [x] Funzionalità future non vengono presentate come stato corrente
- [x] Migrazione MDX eseguita per batch piccoli e revisionabili — fase conclusa
- [x] Durante la migrazione nessuna cancellazione è avvenuta prima della sostituzione completa e della verifica dei link
- [x] I batch della migrazione hanno incluso file completi, controlli, limiti e rollback
- [x] La cronologia delle revisioni resta nei commit Git; i requisiti utili restano nei registri o nelle validations
- [x] `docs/archive/` conserva materiali non canonici dichiarati utili per lavoro futuro e non viene eliminato automaticamente

---


# BLOCCO B — Audit documentazione e lavoro completato **8/9 COMPLETA**

> Le checklist B1–B6 sono un **checkpoint storico dell’audit documentale**. Per lo stato attuale fanno fede le sintesi correnti dei Blocchi D/E/F e le rispettive schede owner.

## B1 — Ingresso e orientamento **COMPLETA**

- [x] README root — verificato
- [x] Indice canonico — verificato; al checkpoint B1 il percorso era `docs/tennis-decision-ui/index.mdx`
- [x] Repository map — `DOC-002`, `DOC-006`
- [x] System boundaries — `DOC-006`
- [x] Data lifecycle — `DOC-006`
- [x] Link e frontmatter — formato verificato; inventario globale e scansione strict completati

## B2 — API **COMPLETA**

- [x] API Match — `DOC-009`, `CODE-003`
- [x] API Betfair — `DOC-010`, `DOC-011`
- [x] API Evidence — `DOC-003`, `DOC-011`
- [x] API Strategy — `DOC-012`, `CODE-001`, `CODE-004`
- [x] API Preflight — `DOC-013`, `CODE-002`
- [x] API Runtime Health — coerente con codice e test ispezionato

## B3 — Moduli **COMPLETA**

- [x] Tracking SofaScore — verificato; documento troppo esteso (`DOC-015`); race nuovo Start (`RUNTIME-002`)
- [x] Local context e point-by-point — contratto coerente; assunzione ultimo game da validare (`SOFA-001`)
- [x] Timeline e history — verificato; separare facade storage e journal (`DOC-015`, `DOC-016`)
- [x] Commit journal e recovery — contratto sostanzialmente coerente
- [x] Lifecycle Betfair — verificato; ridurre duplicazioni Runtime/Storage (`DOC-015`)
- [x] Validità tecnica Betfair — verificata; correggere ordine key/classificazione (`DOC-014`)
- [x] Match Evidence Snapshot — verificato; ridurre duplicazioni integrity/identity (`DOC-015`)
- [x] Source Identity — verificato; comportamento principale coerente
- [x] Qualità, flow e alignment — verificato; ownership coerente ma ripetitiva (`DOC-015`)
- [x] Market Reactions — verificato; `selectionId` obbligatorio per il confronto dello stesso runner nel ramo Field → Market (`EVIDENCE-001`, `DEC-010`)

## B4 — Frontend e Python **COMPLETA**

- [x] Session shell — ownership verificata; Start fallito lascia poller nascosti (`FRONTEND-003`)
- [x] Polling e view model — race risposte tardive (`FRONTEND-001`) e integrity non propagata (`FRONTEND-002`, `DOC-018`)
- [x] UI Betfair e Market Reactions — rendering principale coerente; stato persistence promesso ma non collegato (`FRONTEND-002`)
- [x] Match Context UI — contratto coerente con mapping e view model
- [x] Entry point e runtime Python — wrapper sottili e proxy dinamico launcher verificati
- [x] Scraper SofaScore — CLI, cache e fallback browser coerenti; errori pubblici da irrobustire (`SECURITY-003`)
- [x] Scraper Betfair — lifecycle principale coerente; path pubblico, cache key e task capture da correggere (`SECURITY-001`, `SECURITY-002`, `PYTHON-001`)
- [x] Graph URL — parser, mapping, duplicati e skip coerenti con il codice

## B5 — Operations e roadmap **COMPLETA**

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

## B6 — Controlli trasversali **COMPLETA**

- [x] Documenti owner — API, moduli, frontend, Python, operations e roadmap verificati
- [x] Duplicazioni — classificate (`DOC-015`, `DOC-018`, `DOC-021`, `DOC-023`)
- [x] Contraddizioni — classificate (`DOC-020`, `DOC-022`)
- [x] Percorsi errati — journal e path pubblico registrati (`DOC-020`, `SECURITY-001`)
- [x] Link dell’indice canonico — target verificati nel checkpoint B6; scan globale strict completata successivamente durante la migrazione documentale
- [x] Test — gap classificati (`TEST-001`, `TEST-002`, `TEST-003`, `PYTHON-001`)
- [x] Funzioni implementate non documentate/legacy — candidate registrate (`CLEANUP-001`)
- [x] Funzioni future descritte come presenti — separate (`DOC-018`, `DOC-022`, `FRONTEND-002`)
- [x] Cronologia da separare dalla documentazione corrente (`DOC-001`, `DOC-007`, `DOC-023`, `IMPL-004`)
- [x] Materiale legacy — classificato nel checkpoint B6; contenuti unici consolidati e copie duplicate rimosse successivamente, con provenienza recuperabile dai commit Git
- [x] Coerenza Todo ↔ registri — riallineata (`WORKFLOW-002`)
- [x] Prefissi dei rilievi — aggiornati (`WORKFLOW-003`)

## Secondo audit del codice — Punti 1–7 **COMPLETA**

- [x] Punto 1 — entry point, launcher, ownership e writer authority
- [x] Punto 2 — tracking, Start/Stop, generazioni e callback tardive
- [x] Punto 3 — Betfair lifecycle, Graph, diagnostica, concorrenza e cleanup
- [x] Punto 4 — storage, journal, documenti canonici e recovery
- [x] Punto 5 — Evidence, provenance, eligibility e Market Reactions
- [x] Punto 6 — frontend, session controller, polling e integrity UI
- [x] Punto 7 — runner, fixture, sandbox, harness, ledger e test map

## Documentazione e cleanup **COMPLETA**

- [x] Migrazione `.mdx` → `.md` completata
- [x] 40 file `.mdx` rimossi dalla documentazione canonica; contenuti sostituiti, mantenuti o consolidati nelle destinazioni approvate
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


# BLOCCO C — Audit codice per settori **1/13 COMPLETA**

> Le checklist C1–C13 sono un **checkpoint storico dell’audit del codice**. Conservano ciò che fu osservato in quel ciclo e non vengono promosse automaticamente a stato corrente.

## C1 — Root e launcher **COMPLETA**

- [x] Wrapper root — sottili e compatibili
- [x] Config launcher — porte preferite e percorsi verificati
- [x] Lock — schema e acquisizione conservativa verificati
- [x] Manifest — schema, identità e ownership verificati
- [x] Riuso servizi — identity check e no ownership sui reused verificati
- [x] Porte alternative — fallback bounded implementato e coperto da test
- [x] CDP — discovery bounded e nessun fallback implicito verificati
- [x] Ownership — owned/reused/external separati
- [x] Shutdown — solo processi owned; CDP preservato
- [x] Test launcher — suite eseguita; 237 test passati, 1 skipped nella validation del 10 agosto 2026

## C2 — Server e runtime backend

- [x] Bootstrap server
- [x] Recovery iniziale
- [x] Health — contratto e test HTTP verificati
- [x] Shutdown backend
- [x] Registry Python
- [x] Runtime logger
- [x] Redazione dati
- [-] Test runtime — copertura dedicata presente e alcune suite runtime validate; registrazione nel manifest canonico ancora non completa

## C3 — Router Match

- [x] Endpoint inventariati
- [-] Tracking — implementato; resta il limite dell’autorità globale tracking ↔ login Betfair
- [x] Untrack — contratto idempotente/deprecato implementato
- [x] Stop globale — stop logico e cleanup Python tracking implementati
- [x] Analisi — compute-only, Local Context ed error mapping implementati
- [-] History — lettura implementata; integrity limitata alla source Sofa sulla history condivisa
- [x] Timeline — lettura SofaScore e integrity implementate
- [-] Source Identity status — implementato, ma `trackingSessionId` non viene esposto al frontend
- [-] Integrity — normalizzazione e `409` implementati; restano limiti sulla shared history e sulle failure journal
- [-] Test — copertura ampia presente; manca copertura del contratto end-to-end `trackingSessionId`

## C4 — Router Betfair

- [x] Latest — read model, health, Money Flow e integrity implementati
- [x] JSON — timeline read-only e integrity implementate
- [x] Odds — endpoint legacy rimosso; nessun endpoint Betfair HTTP con side effect di acquisizione
- [x] Login window — validazione, login-only, lifecycle, reuse e cleanup implementati
- [x] Log — lettura bounded, redatta e no-store implementata
- [x] CDP — probe diagnostico read-only e bounded in latest
- [-] Runtime conflict — controlli tracking e login presenti; manca ancora un’autorità globale comune fra i due lifecycle
- [x] Integrity — contratto Betfair implementato; `DOC-010` non è più un limite corrente
- [-] Test — copertura mirata ampia; registrazione canonica non esaustiva e gap residuo sul conflitto globale tracking/login

## C5 — Router Evidence

- [x] Latest read-only
- [x] Conferma gate-aware
- [x] Fallback persistito
- [x] Revoca
- [x] Side effect — bootstrap possibile confermato
- [x] Errori — mapping HTTP pubblico implementato per latest, conferma e revoca
- [-] Test — copertura specifica presente; route test non completamente end-to-end HTTP e registrazione nel manifest canonico non esaustiva
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

- [x] Scheduler
- [x] Update Sofa
- [x] Normalizzazione
- [x] Point-by-point
- [x] Local Context
- [x] History
- [x] Timeline
- [x] Gate
- [-] Stop e mismatch — implementati; resta un limite nel cleanup atomico/session-owned e nella rappresentazione completa del cleanup parziale
- [-] Test — copertura ampia presente; sostituzione sessione backend e cleanup mismatch completo restano parzialmente coperti

## C8 — Betfair

- [-] Fetch — implementato; manca ancora acquisition envelope con provenance temporale API/Graph e controllo dello skew
- [-] Scraper lifecycle — lifecycle per-key implementato; manca autorità globale fra tracking, login e runtime Betfair concorrenti
- [x] Processor
- [x] Timeline
- [x] Ladder
- [x] Graph health
- [x] Matched volume
- [x] Cache — payload redatto e filename SHA-256; `SECURITY-002` risolto
- [-] Runtime health — implementato; freshness ancora limitata dall’assenza di timestamp di acquisizione API/Graph
- [x] Login-only
- [-] Test — copertura ampia presente; restano gap collegati ai limiti runtime/acquisition ancora aperti

## C9 — Storage e recovery

- [x] History storage
- [x] Timeline store
- [x] Commit ID
- [x] Journal store
- [x] Atomic write — implementato come tmp + rename; atomicità process-level
- [x] Recovery bootstrap
- [x] Repair Sofa
- [x] Repair Betfair
- [-] Integrity — implementata, ma con limiti residui sulla shared history e sui failure di lettura
- [-] Failure mode — gestione strutturata presente, ma non completa end-to-end
- [-] Test — copertura unit/integration presente; profilo persistence canonico ancora incompleto/disabilitato

## C10 — Evidence e Source Identity

- [x] Match Evidence builder
- [-] Data quality — implementata; resta incompleta la copertura esplicita dei due runner e l'eligibility tecnica uniforme dei detector
- [x] No-trade reasons
- [x] Name matching
- [x] Confirmation store
- [x] Effective identity
- [-] Market Reactions — implementate; restano limiti su runner identity, eligibility, semantica delle osservazioni, provenance e availability
- [x] Causality claim — `causalityClaimed:false` mantenuto esplicitamente
- [x] Degradazione persistence incomplete — cross-source Evidence e Market Reactions vengono bloccate su `partial_persistence`/`recovery_failed`
- [-] Test — copertura ampia presente; restano test mancanti collegati ai gap Market Reactions ancora aperti

## C11 — Frontend

- [x] App composition — composizione modulare corrente verificata; i residui di authority appartengono al controller di sessione
- [-] Session state — sessione accettata e `trackingSessionId` presenti, ma stato ancora distribuito; manca una authority frontend unica con command identity e `eventId` backend-authoritative
- [-] Preflight — controlli e test presenti, ma i risultati non sono ancora legati a generation/fingerprint degli input e possono diventare stale
- [-] Start tracking — attivazione della sessione posticipata correttamente al successo backend e failure cleanup implementato; restano command serialization/identity e authority completa della risposta Start
- [-] Stop tracking — Stop globale backend implementato e poller disattivati; frontend non usa ancora session/command identity nello Stop e non espone completamente il cleanup parziale
- [x] Bootstrap dashboard — bootstrap legato alla `trackingSessionId`, reset della sessione precedente e protezione dai dati tardivi implementati
- [x] Sofa polling — generation, request ID, `AbortController`, cleanup, session switching e protezione dalle response tardive implementati
- [x] Betfair polling — isolamento lifecycle implementato; non parte senza configurazione Betfair e conserva correttamente persistence integrity
- [-] Evidence polling — lifecycle isolato; continua però a pollare fuori dalla vista Market Reactions e conserva authority legacy di confirm/revoke
- [-] Source Identity UI — polling e conferma session-aware implementati; chiave pending ancora non context/epoch-scoped
- [-] Betfair health — transizioni, toast e audio implementati; memoria di health/transition non completamente session-scoped
- [-] View model — dati current e last-known ora separati e persistence state propagata; `IMPL-009` resta incompleta come superficie globale/sidebar/modal
- [x] Money Flow — mapping `selectionId`, griglia condivisa, valori null/invalid e grafico neutro verificati
- [x] Match Context — mapping, contratto versionato e validazione di coerenza verificati
- [-] Market Reactions — availability, persistence e stati base UI gestiti; view model `IMPL-027` ancora parziale e mapping distribuito
- [x] Strategy UI — superficie Strategy rimossa; Market Reactions preservate
- [ ] Piccole correzioni/mojibake — ancora presente almeno `ModalitÃ  sessione Betfair`
- [ ] Responsive completo — ancora rinviato/non implementato come contratto completo
- [x] Build — `vite build` registrata nel profilo frontend e inclusa nel closeout locale della validation canonica
- [-] Lint — script e dipendenze presenti, ma configurazione ESLint utilizzabile ancora assente
- [-] Test — runner canonico e copertura lifecycle/StrictMode presenti; interaction harness generale e registrazione completa della superficie frontend restano parziali

## C12 — Python e script

- [x] SofaScore CLI — CLI modulare, validazione input, JSON stdout, cache e failure contract implementati
- [x] SofaScore browser — persistent browser, headless/headed fallback, fetch dal page context e timeout bounded implementati
- [x] Betfair CLI — modalità persistent/CDP, validazione CDP, Graph URL, network capture, cache e login-only implementati
- [x] Persistent profile — persistent context owned e chiuso dal percorso che lo crea
- [x] CDP mode — endpoint locale validato, context esistente riutilizzato e non chiuso dal scraper
- [x] Graph URL — parser canonico, market/selection identity, mapping e duplicati verificati
- [x] Network capture — collector bounded, task possedute e drenate, dump redatti e summary pubblico senza path locali
- [x] Diagnostic redaction — URL, header, payload, testo, token e path redatti; logger e output finale bounded/redatti
- [x] Cache — cache SofaScore e Betfair implementate con TTL breve e chiavi SHA-256; Betfair applica anche request identity e redazione
- [x] Wrapper root — `scraper.py` e `betfair_scraper.py` sono wrapper sottili dei CLI modulari
- [x] Cleanup runtime cache — utility allow-list, dry-run/apply, policy di retention, controlli offline e test dedicati implementati
- [x] PowerShell — helper CDP con contratto JSON/exit code integrato e validato dal launcher; helper backend mantenuto per sviluppo manuale
- [-] Test Python — profilo canonico e ampia copertura presenti; manifest ancora non esaustivo rispetto a tutti i test Python esistenti

## C13 — Cleanup

- [-] File legacy — molto legacy già rimosso; restano residui concreti, incluso `scripts/sofa-pipeline-smoke.mjs` ormai incompatibile con la pipeline corrente
- [-] Codice morto — `SourceIdentityControls` e vecchi service rimossi; restano helper legacy confirm/revoke dentro `useMarketReactionEvidence`
- [ ] File duplicati — inventario e bonifica repository-wide non ancora verificati
- [ ] Test obsoleti — bonifica globale non ancora verificata; manifest canonico non esaustivo
- [ ] Script non usati — resta almeno `scripts/sofa-pipeline-smoke.mjs`, che dipende da codice Momentum rimosso
- [-] Documenti non canonici — separazione canonical/validations/archive implementata; verifica globale e coerenza dell'indice ancora incomplete
- [ ] Import non usati — bonifica non completata; presente almeno `urlsplit` inutilizzato in `scrapers/betfair/browser_session.py`
- [-] Componenti non raggiungibili — `SourceIdentityControls` è stato rimosso; resta da completare la verifica generale di reachability
- [-] Route non consumate — restano superfici legacy/compatibilità come `/untrack`, `/snapshot` e `/debug-last`
- [-] Log o debug superati — hardening/redazione diagnostica sostanzialmente risolti; restano mojibake frontend e superfici debug legacy

---


# BLOCCO D — Ricontrollo task completate e priorità **0/2 COMPLETA**

> Le righe D1–D18 sintetizzano lo stato corrente delle task storiche senza trasferire automaticamente gli stati del checkpoint precedente.

## D1 — Ricontrollo D1–D18 sul codice corrente

- [x] D1 — Source Identity Task 1A — **CONFERMATA CON LIMITI; CORE PRESENTE, NUOVA SESSION AUTHORITY NON COMPLETA**
- [x] D2 — Source Identity frontend Task 1B — **CONFERMATA CON LIMITI; POLLING/GATE MIGLIORATI, CONTEXT AUTHORITY COMPLETA ANCORA APERTA**
- [x] D3 — Money Flow 2A — **CONFERMATA**
- [x] D4 — Money Flow 2B — **CONFERMATA**
- [x] D5 — Money Flow 2C — **CONFERMATA; IDENTITÀ RUNNER CANONICA NEL MONEY FLOW**
- [x] D6 — Money Flow 2D — **CONFERMATA**
- [x] D7 — Money Flow 2E — **CONFERMATA**
- [-] D8 — Validazione live Betfair 2F — **VALIDAZIONE STORICA; RESTA DISTINTA DAI COLLAUDI LIVE DEL CODICE CORRENTE**
- [x] D9 — Runtime launcher Task 2 — **CONFERMATA CON LIMITI; WRITER AUTHORITY RAFFORZATA, COLLAUDO REALE MULTI-BACKEND RESTA UNA VERIFICA SEPARATA**
- [-] D10 — Stop globale Task 3a — **BACKEND PRESENTE E CONSUMER LIVE DISABILITATI VIA `sessionActive`; MODALITÀ FORMALE `stopped_static` / SNAPSHOT FROZEN NON IMPLEMENTATA**
- [x] D11 — Timeline store Task 4 — **CONFERMATA**
- [x] D12 — Commit journal Task 6 — **CONFERMATA CON LIMITI; JOURNAL PRESENTE E TARGET VERIFICATI, MA SERIALIZZAZIONE ANCORA SOURCE-SCOPED**
- [x] D13 — Recovery — **CONFERMATA CON LIMITI; VERIFICA/REOPEN TARGET E REPAIR PRESENTI, CONTROL PLANE COMPLETO ANCORA ASSENTE**
- [-] D14 — Persistence integrity — **BACKEND E ADAPTER FRONTEND CENTRALE PRESENTI; CONTRATTO CROSS-LAYER E SUPERFICIE GLOBALE COMPLETA ANCORA PARZIALI**
- [x] D15 — Evidence degradation — **CONFERMATA CON LIMITI; PROVENANCE TEMPORALE ED ELIGIBILITY UNIFORME APPROVATE NON SONO COMPLETE**
- [x] D16 — Context locale V1 — **CONFERMATA CON LIMITE LIVE RESIDUO SUL CONTRATTO PBP**
- [-] D17 — Diagnostica Betfair — **NETWORK CAPTURE, CACHE E REDAZIONE HARDENED; RESTA INCOMPLETO IL BOUNDARY PUBBLICO TRASVERSALE DELLE DIAGNOSTICHE/ERRORI**
- [x] D18 — Retention cache runtime — **CONFERMATA CON LIMITI; MAINTENANCE AUTHORITY COMPLETA E RETENTION DI ALTRE CLASSI RUNTIME RESTANO APERTE**

Regola: una regressione o un limite riapre soltanto il sotto-perimetro interessato; non annulla le parti già presenti.

## D2 — Priorità correnti non completate

### Priorità critica

- [-] Session authority end-to-end (`IMPL-006`) — **PARZIALMENTE PRESENTE; `trackingSessionId` E GUARDIE SESSIONE IMPLEMENTATI, MA COMMAND AUTHORITY/STOP/LEGACY CLEANUP NON COMPLETI**
- [-] Betfair runtime command authority (`IMPL-016`) — **AUTHORITY SEPARATE PER TRACKING, LOGIN E PROCESSI PRESENTI; AUTHORITY GLOBALE/HANDOFF NON IMPLEMENTATI**
- [-] Local control-plane boundary (`IMPL-017`) — **BIND E HOST/ORIGIN LOOPBACK PRESENTI; PORTA BACKEND/FRONTEND E CONTRATTO COMPLETO NON CHIUSI**
- [ ] Event persistence authority (`IMPL-019`) — **AUTHORITY EVENT-SCOPED NON IMPLEMENTATA; WRITER AUTHORITY PROCESS-LEVEL E JOURNAL SOURCE-SCOPED NON LA SOSTITUISCONO**
- [-] Canonical document contract e verified recovery (`IMPL-020`) — **READER/WRITER STRUTTURATI E VERIFICA/REPAIR TARGET PRESENTI; SCHEMA VERSIONATO, REVISIONI E DIGEST ANCORA ASSENTI**
- [-] Evidence temporal provenance e alignment (`IMPL-022`) — **FRESHNESS, TIMESTAMP E CROSS-SOURCE GAP PRESENTI; ACQUISITION/RECORDING PROVENANCE E POLICY VERSIONATA DI SKEW NON COMPLETE**
- [-] Market Reaction eligibility e branch state (`IMPL-023`) — **PRIMITIVE REALI DI QUALITÀ/REACTION PRESENTI; ELIGIBILITY E BRANCH STATE UNIFORMI NON COMPLETI**
- [-] Frontend live-session controller (`IMPL-025`) — **TRACKING SESSION ID E START POST-SUCCESS PRESENTI; OWNER/STATE MACHINE/COMMAND ID ED EVENT AUTHORITY UNICI ASSENTI**
- [-] Polling runtime session-scoped (`IMPL-026`) — **ABORT, GENERATION GUARD E LIFECYCLE TEST PRESENTI; `trackingSessionId/sessionKey` COMUNE AI POLLER NON IMPLEMENTATA**
- [-] Frontend interaction test harness (`IMPL-030`) — **LIFECYCLE/STRICTMODE TEST PRESENTI CON `react-test-renderer`; HARNESS DOM APPROVATO VITEST/JSDOM/RTL NON IMPLEMENTATO**

### Priorità alta

- [-] Betfair acquisition envelope e provenance (`IMPL-018`) — **TIMESTAMP RUNTIME, TRACKING SESSION E IDENTITÀ MARKET/RUNNER PRESENTI; ENVELOPE DI ACQUISIZIONE, GRAPH SKEW E `matchedValueSource` NON COMPLETI**
- [-] Recovery control plane (`IMPL-021`) — **BOOTSTRAP, SUMMARY, REPAIR E INTEGRITY PER RECORD PRESENTI; CONTROL PLANE PERSISTENTE GLOBALE, RETRY BOUNDED, REARM E API DEDICATA ASSENTI**
- [-] Runner temporal identity e price comparability (`IMPL-024`) — **`selectionId` GIÀ USATO COME IDENTITÀ IN PIÙ PERCORSI; FALLBACK NOME, PRICE PROVENANCE E COVERAGE UNIFORME ANCORA APERTI**
- [-] Market Reactions frontend view model (`IMPL-027`) — **HELPER DI VIEW MODEL PRESENTE; MAPPING ANCORA DISTRIBUITO E CONTRATTO COMPLETO NON CHIUSO**
- [-] Fixture catalog e sandbox condivisa (`IMPL-029`) — **FIXTURE LOCALI E METADATA MANIFEST PRESENTI; CATALOGO CONDIVISO E SANDBOX COMUNE NON IMPLEMENTATI**
- [-] Validation result ledger (`IMPL-031`) — **RUN ARTIFACT JSON V1 REALE E ATOMICO PRESENTE; LEDGER STORICO, LATEST-RESULT AUTHORITY E SEMANTICHE COMPLETE NON IMPLEMENTATI**
- [-] Hardening diagnostico/network capture residuo — **REDAZIONE, TASK BOUNDED, DRAIN/CANCEL E SUMMARY HARDENED IMPLEMENTATI; DETACH ESPLICITO DEL LISTENER NEL PERCORSO CDP ANCORA APERTO**
- [-] Retention e cleanup offline residui — **RETENTION CACHE IMPLEMENTATA; MAINTENANCE AUTHORITY COMPLETA E RETENTION SEPARATA DI LOG/NETWORK DUMP ANCORA APERTE**

### Futuro o condizionato

- [~] Toolkit strategie offline (`IMPL-010`) — **FUTURO; NESSUN TOOLKIT STRATEGICO OFFLINE AUTONOMO IMPLEMENTATO**
- [~] Ottimizzazione Betfair misurata (`IMPL-014`) — **FUTURA E CONDIZIONATA; BASELINE/BENCHMARK `IMPL-013` NON ANCORA DISPONIBILE**

Nessuna voce viene selezionata automaticamente come prossima task.

---

# BLOCCO E — Rilievi registrati **2/6 COMPLETA**

> Il Blocco E è la sintesi corrente delle schede owner. `RISOLTO` indica che il rilievo non è più presente nello stato corrente; `PARZIALE` non chiude la scheda owner.

## Documentazione e struttura **COMPLETA**

- [x] `DOC-001` — Roadmap troppo storica — **RISOLTO LATO DOCUMENTAZIONE; LA ROADMAP CORRENTE È UNA VISTA DELLO STATO REALE E SEPARA LA CRONOLOGIA**
- [x] `DOC-002` — Repository map troppo estesa — **CONFERMATO / ANCORA PERTINENTE; LA MAPPA RESTA PIÙ DETTAGLIATA DEL SOLO ORIENTAMENTO E DUPLICA PARTE DEI CONTRATTI OWNER**
- [x] `DOC-003` — Evidence read-only/mutante — **RISOLTO; GET READ-ONLY E POST/DELETE MUTANTI SONO ORA DISTINTI ESPLICITAMENTE, INCLUSO IL BOOTSTRAP GATE-AWARE**
- [x] `DOC-004` — Conversione `.mdx → .md` strutturale — **RISOLTO; MIGRAZIONE CANONICA COMPLETATA**
- [x] `DOC-005` — Convenzioni precedenti imponevano `.mdx` — **RISOLTO; LE CONVENZIONI CORRENTI IMPONGONO `.md`, VIETANO `export const meta` E NON RICHIEDONO FRONTMATTER**
- [x] `DOC-006` — Duplicazione nei documenti di orientamento — **CONFERMATO / ANCORA PERTINENTE; REPOSITORY MAP E DOCUMENTI ARCHITETTURALI DUPLICANO ANCORA PARTE DEI CONTRATTI OWNER**
- [x] `DOC-007` — Current State mescolava stato, storia e validazione — **RISOLTO; STATO CORRENTE, LIMITI, VALIDAZIONI STORICHE E FUNZIONI NON PRESENTI SONO ORA DISTINTI**
- [x] `DOC-008` — README da aggiornare durante la migrazione — **RISOLTO; README PUNTA ALL'INDICE CANONICO `.md` E ALLO STATO CORRENTE**
- [x] `DOC-009` — Match `debug-last` senza producer — **PARZIALE; DOCUMENTAZIONE CORRETTA, MA LA ROUTE LEGACY RESTA NEL CODICE SENZA PRODUCER REALE**
- [x] `DOC-010` — Adapter integrity Betfair citato con nome errato — **RISOLTO; LA DOCUMENTAZIONE CORRENTE USA `getMatchPersistenceIntegrity(eventId, 'betfair')`**
- [x] `DOC-011` — API troppo estese rispetto ai moduli owner — **SOSTANZIALMENTE RISOLTO; LE API CORRENTI SONO FACADE/CHILD HTTP E DELEGANO ALGORITMI E LIFECYCLE AGLI OWNER DI MODULO**
- [x] `DOC-012` — Strategy legacy ma attiva — **RISOLTO / SUPERATO DAL CODICE; ROUTER E UI STRATEGY NON SONO PIÙ NEL RUNTIME ATTIVO**
- [x] `DOC-013` — Preflight documentato più forte del controllo reale — **RISOLTO LATO CODICE E DOCUMENTAZIONE; VALIDATORE BETFAIR CONDIVISO E CONTRATTO ADVISORY ESPLICITO**
- [x] `DOC-014` — Ordine tracking key/classificazione Betfair descritto male — **RISOLTO COME DISCREPANZA DOCUMENTALE; LA VECCHIA SEQUENZA ERRATA NON È PIÙ PRESENTE NEGLI OWNER CORRENTI**
- [x] `DOC-015` — Documenti owner duplicano contratti trasversali — **SOSTANZIALMENTE RISOLTO; GLI OWNER CORRENTI ESPONGONO PRECONDIZIONI/CONFINI E DELEGANO IL CONTRATTO COMPLETO ALL'OWNER SPECIFICO**
- [x] `DOC-016` — Facade Storage/read-only descritte in modo troppo forte — **RISOLTO; PREPARE-ONLY, WRITER CANONICI, JOURNAL E INIZIALIZZAZIONE STORAGE SONO ORA DISTINTI**
- [x] `DOC-017` — Input Market Reactions descritto male — **RISOLTO; MARKET REACTIONS RICEVE TICK GIÀ SCOPED E VIENE COMPOSTO DURANTE LA COSTRUZIONE DELLO SNAPSHOT EVIDENCE**
- [x] `DOC-018` — Pipeline integrity frontend descritta ma non collegata — **RISOLTO NEL DIFETTO ORIGINARIO; INTEGRITY È ORA PROPAGATA END-TO-END E AGGREGATA IN UN PERSISTENCE VIEW STATE SEPARATO**
- [x] `DOC-019` — Hardening Python descritto più forte del codice — **RISOLTO NEL PERIMETRO DEL FINDING; PATH PUBBLICI, CACHE KEY E REDAZIONE SONO STATI HARDENED, RESTA SEPARATO IL DEBITO `IMPL-007`**
- [x] `DOC-020` — Percorso `.pending_commits` errato in alcuni documenti — **RISOLTO; GLI OWNER CANONICI CORRENTI USANO `backend/match_history/.pending_commits/`**
- [x] `DOC-021` — Validation/rollback e runbook troppo estesi — **PARZIALE / ANCORA PERTINENTE; RUNNER E VALIDAZIONI STORICHE SONO STATI SEPARATI, MA IL RUNBOOK GENERALE RESTA MOLTO AMPIO E CROSS-DOMAIN**
- [x] `DOC-022` — Current State non aggiornato — **RISOLTO NEL DIFETTO ORIGINARIO; IL DOCUMENTO CORRENTE DISTINGUE IMPLEMENTAZIONE, LIMITI, VALIDAZIONI STORICHE E FUNZIONI NON PRESENTI**
- [x] `DOC-023` — Collaudi storici mescolati ai runbook — **RISOLTO; COLLAUDI E OSSERVAZIONI LIVE SONO ORA SEPARATI SOTTO `docs/validations/`**
- [x] `DOC-024` — Ownership processo distinta da writer authority — **COMPLETATO E CONFERMATO; LA DISTINZIONE È ESPLICITA NEGLI OWNER RUNTIME/STORAGE**
- [x] `DOC-025` — Generation Python distinta dalla session authority — **RISOLTO; LA DOCUMENTAZIONE CORRENTE DISTINGUE ESPLICITAMENTE GENERATION PYTHON, `trackingSessionId`, GATE GENERATION E TERMINAL BARRIER**
- [x] `DOC-026` — Temporal provenance e policy di alignment non documentate — **RISOLTO LATO DOCUMENTAZIONE; IL CONTRATTO CORRENTE È DOCUMENTATO, MENTRE LA PROVENANCE COMPLETA RESTA UN DEBITO TECNICO `IMPL-022`**
- [x] `DOC-027` — Availability, activity/response e threshold non documentati — **RISOLTO LATO DOCUMENTAZIONE; SOGLIE E SEMANTICHE CORRENTI SONO ESPLICITE, IL CONTRATTO UNIFORME FUTURO RESTA `IMPL-023`**
- [x] `DOC-028` — Session shell contraddice la session authority approvata — **RISOLTO NEL DIFETTO ORIGINARIO; INPUT, SESSIONE ACCETTATA, `trackingSessionId`, `sessionActive` E BOOTSTRAP SONO ORA DISTINTI**
- [x] `DOC-029` — Polling/view model descritti come più completi del codice — **PARZIALE / ANCORA PERTINENTE; ABORT E GENERATION SONO REALI, MA IL DOCUMENTO CANONICO ANTICIPA ANCORA UN `trackingSessionId/sessionKey` COMUNE NON IMPLEMENTATO**
- [x] `DOC-030` — UI Betfair/Market Reactions descritta come integrity-aware senza wiring reale — **RISOLTO NEL DIFETTO ORIGINARIO; WIRING INTEGRITY E PERSISTENCE VIEW STATE SONO ORA REALMENTE COLLEGATI**
- [x] `DOC-031` — Runbook Validation monolitico e non verificabile automaticamente — **PARZIALE; MANIFEST/RUNNER/ARTIFACT MACHINE-READABLE IMPLEMENTATI, MA IL RUNBOOK GENERALE RESTA ANCORA MOLTO AMPIO E CROSS-DOMAIN**
- [x] `DOC-032` — Semantica di stato dei test non formalizzata — **RISOLTO; PRESENZA, ESECUZIONE, PASS, FAILURE, BLOCKED E LIVE OBSERVATION SONO ORA FORMALMENTE DISTINTI**
- [x] `DOC-033` — Documenti canonici possono anticipare contratti approvati ma non implementati — **PARZIALE; POLICY CORRENTE CORRETTA E FORMALIZZATA, MA L'ENFORCEMENT NON È COMPLETO COME DIMOSTRA IL RESIDUO `DOC-029`**

## Workflow e regole **COMPLETA**

- [x] `WORKFLOW-001` — Context selection con troppe responsabilità — **RISOLTO; CONTEXT SELECTION ORA POSSIEDE SOLO LA SELEZIONE DEL CONTESTO E DELEGA WORKFLOW, ARTEFATTI E MODULARIZZAZIONE A OWNER DISTINTI**
- [x] `WORKFLOW-002` — Todo e registro analitico divergenti — **COMPLETATO; PARITÀ OWNER ↔ RIGHE SINTETICHE E DUPLICAZIONI SONO CONTROLLATE DAL REGISTRY CHECKER**
- [x] `WORKFLOW-003` — Prefissi `SECURITY-`/`PYTHON-` non dichiarati — **COMPLETATO; ENTRAMBI I PREFISSI SONO DICHIARATI NEL METODO E VERIFICATI DAL CHECKER**
- [x] `WORKFLOW-004` — SHA, range e stato sintetico dei registri possono divergere — **COMPLETATO; CHECK AUTOMATICI PRESENTI PER SHA, RANGE, ULTIMI ID, PUNTO, NEXT STEP E STATI**
- [x] `WORKFLOW-005` — Migrazione documentale per batch con controlli prima della consegna — **COMPLETATO; `IMPL-032` CHIUSA E WORKFLOW DI MIGRAZIONE CONSERVATO COME PROVENANCE STORICA**
- [x] `RUNTIME-001` — Non riaprire runtime Task 2 senza discrepanza — **REGOLA APPROVATA E ANCORA VALIDA; RIAPERTURA SOLO SU DISCREPANZA TECNICA O REGRESSIONE CONCRETA**

## Codice, runtime, sicurezza, dati, frontend e cleanup

- [x] `CODE-001` — Strategy legacy attiva — **RISOLTO; ROUTE E SURFACE STRATEGY RIMOSSE DAL RUNTIME ATTIVO, MARKET REACTIONS PRESERVATE**
- [-] `CODE-002` — Validatore Betfair non condiviso tra Preflight/Start/Login — **PARZIALMENTE RISOLTO; `classifyBetfairUrl` È CONDIVISO, MA LE SUPERFICI USANO OPZIONI DIVERSE E LA PARITÀ DI ACCETTAZIONE/EVENT ID NON È COMPLETA**
- [x] `CODE-003` — Match `debug-last` sempre vuoto — **CONFERMATO; RIMOZIONE APPROVATA MA NON ANCORA ESEGUITA, ROUTE E STATO SENZA PRODUCER RESTANO NEL CODICE**
- [x] `CODE-004` — Strategy usa `localhost:3001` hardcoded — **ASSORBITO E RISOLTO DALLA RIMOZIONE DELLA SURFACE STRATEGY**
- [ ] `CODE-005` — Script lint frontend pubblicato ma non eseguibile — **CONFERMATO; SCRIPT E DIPENDENZE PRESENTI, CONFIGURAZIONE ESLINT REPOSITORY-OWNED ANCORA ASSENTE**
- [-] `CODE-006` — Preflight Graph divergente dal runtime — **PARZIALMENTE RISOLTO; VINCOLI URL E DUPLICATI ALLINEATI, MA `sameMarket:false` NON RENDE ANCORA IL PREFLIGHT FALLITO E LA VERIFICA API RESTA RUNTIME-ONLY**
- [ ] `CODE-007` — Probe CDP di `/latest` guidato dalla query — **CONFERMATO; `/latest` E IL FRONTEND CONTINUANO A USARE `mode`/`cdpUrl` DA QUERY, IDENTITÀ CDP SESSION-OWNED NON IMPLEMENTATA**
- [-] `RUNTIME-002` — Nuovo Start non invalida la sessione precedente — **PARZIALMENTE RISOLTO; `trackingSessionId` E GUARDIE STALE IMPEDISCONO EFFETTI DELLA VECCHIA SESSIONE, MA HANDOFF/CLEANUP FISICO ATOMICO PRIMA DEL NUOVO START NON È IMPLEMENTATO**
- [x] `RUNTIME-003` — Avvii manuali aggiravano l’autorità sulla persistenza — **COMPLETATO; WRITER AUTHORITY ACQUISITA DAL BACKEND PRIMA DI RECOVERY E LISTENER INDIPENDENTEMENTE DAL LAUNCHER**
- [x] `RUNTIME-004` — Riavvio dello stesso eventId contamina il gate nuovo — **RISOLTO; IL GATE È VINCOLATO AL `trackingSessionId` E RIFIUTA I CAMPIONI DELLA SESSIONE PRECEDENTE**
- [x] `RUNTIME-005` — `/untrack` legacy senza cleanup fisico — **RIMOZIONE APPROVATA MA NON ANCORA ESEGUITA; ROUTE, RESPONSE BUILDER E `untrackMatch()` RESTANO NEL CODICE**
- [x] `RUNTIME-006` — Mismatch stale può fermare la sessione corrente — **RISOLTO; I CAMPIONI STALE VENGONO BLOCCATI DAL CONFRONTO `trackingSessionId` PRIMA DELLA VALUTAZIONE DEL GATE**
- [x] `RUNTIME-007` — Promise Betfair riutilizzata tra sessioni logiche — **RISOLTO; IL RIUSO RICHIEDE ANCHE LO STESSO `trackingSessionId`, ALTRIMENTI È `scraper_session_conflict`**
- [x] `RUNTIME-008` — Mismatch non termina fisicamente SofaScore — **RISOLTO NEL DIFETTO ORIGINARIO; IL CLEANUP `tracking` INCLUDE ORA SIA `sofa_tracking` SIA `betfair_tracking`**
- [x] `RUNTIME-009` — Stop pubblico nasconde cleanup parziale — **RISOLTO NEL COMPORTAMENTO CORRENTE; `ok` DIVENTA FALSE SU CLEANUP INCOMPLETO, `pythonCleanup` È PUBBLICO E IL FRONTEND NON PROMUOVE IL FAILURE A STOP COMPLETO**
- [x] `RUNTIME-010` — Conferma Source Identity stale sul gate nuovo — **RISOLTO; `trackingSessionId` È VERIFICATO DAL GATE E UNA SESSIONE STALE PRODUCE 409**
- [x] `RUNTIME-011` — `/api/betfair/odds` è un secondo ingresso mutante — **RISOLTO; ENDPOINT NON PRESENTE NEL ROUTER BETFAIR**
- [ ] `RUNTIME-012` — Manca autorità globale dei comandi Betfair — **CONFERMATO; TRACKING E LOGIN HANNO AUTHORITY LOCALI SEPARATE, MA NON ESISTE ANCORA UN ARBITRO BETFAIR GLOBALE**
- [x] `SECURITY-001` — Payload network capture oltrepassa il boundary pubblico — **RISOLTO NEL DIFETTO ORIGINARIO; IL SUMMARY PUBBLICABILE ESCLUDE PATH/RAW COLLECTOR E LA ROUTE `/api/betfair/odds` CHE ESPONEVA IL PAYLOAD È STATA RIMOSSA**
- [x] `SECURITY-002` — Cache URL-derived e priva di runtime/Graph identity — **RISOLTO; CACHE KEY SHA-256 SU URL NORMALIZZATA + REQUEST IDENTITY + SCHEMA, CACHE DISABILITATA NEI PERCORSI TRACKING/GRAPH**
- [x] `SECURITY-003` — Dettagli raw degli errori HTTP — **RISOLTO NEL FINDING SPECIFICO; LE ROUTE CORRENTI ESPONGONO ERRORI STATICI/BOUNDED, MENTRE IL SERIALIZER PUBBLICO TRASVERSALE UNICO RESTA UN DEBITO SEPARATO `IMPL-007`**
- [-] `SECURITY-004` — Manca local control-plane boundary — **PARZIALMENTE RISOLTO; BIND LOOPBACK E MIDDLEWARE HOST/ORIGIN LOCALI PRESENTI, MA PORTE AUTHORITATIVE/CORS/CONTRATTO COMPLETO `IMPL-017` NON SONO CHIUSI**
- [x] `SECURITY-005` — Flag Chromium indebolenti nel default — **RISOLTO; `--no-sandbox`, `--disable-setuid-sandbox` E `--ignore-certificate-errors` NON SONO PRESENTI NEL PROFILO PERSISTENT CORRENTE**
- [x] `DATA-001` — Volume runner sintetico `marketTotal/runnerCount` — **RISOLTO; NESSUN FALLBACK SINTETICO, IL MATCHED RUNNER ASSENTE RESTA `null` E MONEY FLOW VIENE SOPPRESSO**
- [ ] `DATA-002` — API/Graph senza acquisition timestamp e skew — **CONFERMATO; MANCA ANCORA UN ACQUISITION ENVELOPE CON TIMESTAMP API/GRAPH, SKEW FRA RUNNER E PROVENANCE DI REGISTRAZIONE**
- [x] `FRONTEND-001` — Response Sofa/Betfair tardive o fuori ordine attraversano la sessione — **RISOLTO NEL FINDING SPECIFICO; SOFA/BETFAIR/EVIDENCE/SOURCE IDENTITY USANO GENERATION, ABORT E REQUEST GUARD CONTRO RESPONSE STALE, MENTRE LA SESSION AUTHORITY COMUNE END-TO-END RESTA APERTA IN `IMPL-026`**
- [-] `FRONTEND-002` — Persistence integrity frontend — **PARZIALMENTE RISOLTO; `buildPersistenceViewState` PROPAGA E AGGREGA GLI STATI NELLA WORKSPACE E NELLA BETFAIR CARD, MA SIDEBAR/MODALE E DETTAGLIO GLOBALE PER SETTORE RESTANO ASSENTI**
- [-] `FRONTEND-003` — Start fallito lascia sessione e polling nascosti — **PARZIALMENTE RISOLTO; FAILURE FRONTEND PULISCE SESSIONE CONFERMATA, SHELL, BOOTSTRAP E POLLER, MA CLEANUP COMPENSATIVO E COMMAND/SESSION CONTROLLER UNICO NON SONO IMPLEMENTATI**
- [ ] `FRONTEND-004` — Copy mojibake visibile — **CONFERMATO; È ANCORA PRESENTE `ModalitÃ  sessione Betfair`**
- [x] `FRONTEND-005` — Loop di polling orfani dopo cambio sessione/cleanup — **RISOLTO NEL FINDING SPECIFICO; GENERATION, ABORT, TIMER CLEANUP E GUARDIE DI RIPROGRAMMAZIONE IMPEDISCONO AI VECCHI LOOP DI RICREARSI, MENTRE RESTA SEPARATAMENTE APERTO IL CONTRATTO SESSION-SCOPED COMUNE `IMPL-026`**
- [ ] `FRONTEND-006` — Start/Stop concorrenti non serializzati — **CONFERMATO; NESSUN COMMAND ID, LOCK/GENERATION DEL COMANDO O ARBITRO START/STOP È PRESENTE**
- [-] `FRONTEND-007` — Stop Live e modalità statica dopo Stop — **PARZIALMENTE RISOLTO; TUTTI I CONSUMER LIVE VENGONO DISABILITATI VIA `sessionActive`, MA NON ESISTE ANCORA UNA MODALITÀ `stopped_static` CON SNAPSHOT FROZEN PRESERVATO**
- [ ] `FRONTEND-008` — Indicatori live derivati dalla presenza del dato — **CONFERMATO; ALCUNI STATUS USANO ORA `readStatus`, MA SIDEBAR E INDICATORI GLOBALI NON DERIVANO ANCORA DA UNA STATE MACHINE DI SESSIONE AUTORITATIVA**
- [-] `FRONTEND-009` — Market Reactions UI/view model — **PARZIALMENTE RISOLTO; `available === true`, SOURCE MARKET E STATI BASE DI LETTURA SONO GESTITI, MA IL CONTRATTO UNICO PROVISIONAL/FINAL/WINDOW/INTEGRITY STATE NON È PRESENTE**
- [-] `FRONTEND-010` — Pending modal e session/context identity — **PARZIALMENTE RISOLTO; CONFERMA E REFRESH SONO VINCOLATI AL `trackingSessionId`, MA LA PENDING KEY RESTA BASATA SU EVENT ID + NOMI E MANCANO `sourceIdentityContextId`/REVISION OPAQUE**
- [ ] `FRONTEND-011` — Preflight results non legati agli input verificati — **CONFERMATO; I CHECK CONSERVANO SOLO STATUS/MESSAGE E NON POSSEGGONO FINGERPRINT, INPUT REVISION O INVALIDAZIONE AUTOMATICA AL CAMBIO INPUT**
- [ ] `FRONTEND-012` — Responsive strutturalmente assente — **LIMITE CONFERMATO; ESISTONO BREAKPOINT LOCALI, MA SHELL, SIDEBAR E TOPBAR NON HANNO ANCORA UN CONTRATTO RESPONSIVE END-TO-END**
- [ ] `PYTHON-001` — Task network capture non tracked/drained/cancelled — **CONFERMATO**
- [-] `CLEANUP-001` — Authority Source Identity legacy frontend — **CLEANUP PARZIALE; LA VECCHIA SURFACE/AUTHORITY UI È STATA RIMOSSA E LA CONFERMA CORRENTE PASSA DA `useSourceIdentityGateUi`, MA `useMarketReactionEvidence` ESPORTA ANCORA HELPER MUTANTI LEGACY DI CONFIRM/REVOKE NON USATI DALLA COMPOSIZIONE ATTIVA**
- [ ] `CLEANUP-002` — Apply offline privo di maintenance authority e porte effettive — **CONFERMATO; L'UTILITY È ALLOW-LIST/DRY-RUN E CONTROLLA LOCK + PORTE FISSE 3000/3001, MA NON POSSIEDE MAINTENANCE AUTHORITY, NON SI COORDINA CON LA WRITER AUTHORITY E NON USA LE PORTE RUNTIME EFFETTIVE**
- [ ] `CLEANUP-003` — Log e network dump senza retention distinta — **CONFERMATO; LA RETENTION COPRE SOLO LE CACHE JSON ALLOW-LIST, NON `backend/betfair_scraper.log` NÉ `backend/betfair_network_dump`**

## Storage, journal e recovery

- [ ] `STORAGE-001` — Journal source-scoped su shared history event-scoped — **CONFERMATO; LA SERIALIZZAZIONE RESTA `eventId + source` E MANCA L'AUTHORITY EVENT-SCOPED CROSS-SOURCE DI `IMPL-019`**
- [-] `STORAGE-002` — Target marked complete non verificato nei record parziali — **PARZIALMENTE RISOLTO; I TARGET VENGONO VERIFICATI E RIAPERTI QUANDO IL RECORD RISULTA COMPLETAMENTE `completed`, MA NEI RECORD PARZIALI IL TARGET GIÀ MARCATO COMPLETE NON VIENE ANCORA RIVERIFICATO PRIMA DEL REPAIR**
- [-] `STORAGE-003` — Target verification limitata a JSON.parse — **PARZIALMENTE RISOLTO; SHAPE, IDENTITY E CONTENUTO ATTESO SONO ORA VERIFICATI ANCHE CON CONFRONTO STABILE, MA SCHEMA VERSIONATO/REVISION/DIGEST DI `IMPL-020` RESTANO ASSENTI**
- [-] `STORAGE-004` — Journal invalido non attribuibile nascosto dall’integrity — **PARZIALMENTE RISOLTO; IL JOURNAL STORE ESPONE `integrity_unavailable`, MA `getMatchPersistenceIntegrity` E LE RESPONSE PUBBLICHE LO COLLASSANO ANCORA A `no_known_partial` E MANCA IL CONTROL PLANE GLOBALE `integrity_unknown`**
- [-] `SECURITY-006` — EventId e target non confinati dallo Storage — **MITIGAZIONE PARZIALE; TIMELINE USA EVENT ID BOUNDED E I TARGET ESPLICITI DEVONO COINCIDERE COL TARGET RISOLTO, MA HISTORY/JOURNAL NON USANO ANCORA LA STESSA VALIDAZIONE E MANCA ROOT CONFINEMENT UNIFORME**
- [ ] `STORAGE-005` — Shared history espone soltanto integrity SofaScore — **CONFERMATO; `/history` INTERROGA ANCORA `getMatchPersistenceIntegrity(eventId, 'sofa')` E MANCA L'INTEGRITY AGGREGATA CROSS-SOURCE**
- [x] `STORAGE-006` — Stato cross-source pubblicato prima del commit — **RISOLTO; `latestSofaState` E `latestBetfairState` VENGONO PUBBLICATI SOLTANTO DOPO COMMIT CANONICO COMPLETO**
- [-] `STORAGE-007` — Missing, corruzione e I/O failure collassano in `null` — **PARZIALMENTE RISOLTO; I LOADER INTERNI DISTINGUONO FOUND/MISSING/INVALID/READ FAILED/AMBIGUOUS, MA LA ROUTE HISTORY USA ANCORA LA FACADE DOCUMENTO/`null` E PUÒ COLLASSARE ERRORI STORAGE IN 404**
- [x] `STORAGE-008` — Duplicati evento risolti con `sort()[0]` — **RISOLTO; TARGET MULTIPLI PRODUCONO `ambiguous_storage_target` E FAIL-CLOSED**
- [ ] `STORAGE-009` — Nessuna policy persistita dei tentativi recovery — **CONFERMATO; ESISTE UNA SUMMARY RUNTIME MA NON `attemptCount`, `lastAttemptAt`, ESCALATION O REARM PERSISTITI DI `IMPL-021`**
- [ ] `STORAGE-010` — Amplificazione full-document per ogni aggiornamento persistito — **LIMITE CONFERMATO; HISTORY, TIMELINE E PAYLOAD JOURNAL VENGONO RISCRITTI COME DOCUMENTI COMPLETI, MISURAZIONE `IMPL-013` ANCORA ASSENTE**
- [ ] `STORAGE-011` — Atomicità process-level non equivale a durabilità power-loss — **LIMITE CONFERMATO; TEMP + RENAME PRESENTI, MA NESSUN CONTRATTO `fsync` FILE + DIRECTORY**
- [ ] `STORAGE-012` — Writer raw non journalizzati ancora esportati — **CONFERMATO; `saveHistory`, `saveTimeline` E `writeTimelineDocument` RESTANO SUPERFICI DIRETTE ESPORTATE**

## Evidence e verifiche di dominio

- [ ] `EVIDENCE-001` — Fallback nome nei confronti runner Field → Market — **CONFERMATO; `selectionId` È PREFERITO MA IL CONFRONTO RICADE ANCORA SUL NOME NORMALIZZATO QUANDO L'IDENTITÀ CANONICA NON È DISPONIBILE, DEC-010 NON COMPLETATA**
- [-] `EVIDENCE-002` — Tick degradati/status-only possono diventare nuovi eventi Market Reactions — **PARZIALMENTE RISOLTO; SIGNIFICANT FLOW FILTRA `selectionId`, TECHNICAL STATUS, GRAPH HEALTH E LADDER, MA MANCA ANCORA UN ELIGIBILITY GATE UNIFORME PER TUTTI I BRANCH MARKET REACTIONS**
- [ ] `EVIDENCE-003` — Attività matched generale classificata come market response — **CONFERMATO; `marketResponseObserved` È ANCORA `priceChangeObserved || matchedVolumeIncreaseObserved`, LA SEMANTICA APPROVATA NON È STATA SEPARATA**
- [ ] `EVIDENCE-004` — Marker persistente confuso con nuova comparsa successiva — **CONFERMATO; MARKET → FIELD PUÒ ANCORA OSSERVARE UN MARKER PRESENTE NELLA FINESTRA SENZA RICHIEDERE UNA TRANSIZIONE `false → true` SUCCESSIVA AL FLOW**
- [-] `EVIDENCE-005` — Temporal alignment e source skew incompleti — **PARZIALMENTE RISOLTO; `crossSourceGapSec`, ETÀ DELLE SOURCE E TOLLERANZA DEI TIMESTAMP FUTURI SONO PRESENTI, MA ACQUISITION/RECORDING PROVENANCE E POLICY VERSIONATA DI `IMPL-022` RESTANO ASSENTI**
- [ ] `EVIDENCE-006` — Confronti prezzo con source diverse e baseline non bounded — **CONFERMATO; LA PROVENIENZA DEL PREZZO NON GOVERNA ANCORA LA COMPARABILITÀ E LA BASELINE FIELD → MARKET NON HA UN MAX AGE ESPLICITO**
- [ ] `EVIDENCE-007` — Qualità globale positiva con un solo runner affidabile — **CONFERMATO; I PREDICATI GLOBALI USANO ANCORA `.some()` E NON ESPONGONO COVERAGE ESPLICITA DEI DUE RUNNER**
- [-] `EVIDENCE-008` — Baseline Significant Flow/cluster e threshold non sufficientemente definiti — **PARZIALMENTE RISOLTO; WINDOWS, GAP DI CLUSTER E SOGLIE ASSOLUTE/RELATIVE SONO IMPLEMENTATI, MA POLICY COMPLETA, PROVENANCE, LOOKBACK COERENTE E VERSIONING RESTANO APERTI**
- [-] `EVIDENCE-009` — `available` e stato delle finestre hanno semantiche non uniformi — **PARZIALMENTE RISOLTO; ESISTONO `available`, REASON, RELIABILITY E PRIMITIVE DI WINDOW STATE, MA MANCA UN BRANCH STATE UNIFORME E AUTORITATIVO**
- [ ] `SOFA-001` — Identità del game PBP corrente — **VALIDAZIONE LIVE ANCORA NECESSARIA; IL CODICE NON ASSUME PIÙ CHE L'ULTIMO GAME SIA APERTO E FALLISCE CLOSED SENZA `currentGame`, MA VA VERIFICATO LIVE CHE SOFASCORE FORNISCA `currentGame` CON LA SEMANTICA ATTESA**

## Test e coperture richieste

> Le diciture storiche “PASSATO/COMPLETATO” restano riferite ai cicli registrati. La presenza di un file test non equivale da sola a un PASS.

- [x] `TEST-001` — Test dedicato tick Betfair `status-only` — **COPERTURA IMPLEMENTATA; `canonicalTimeline.test.mjs` VERIFICA UN TICK `status-only` GRAPH-LOGIN CANONICO, FLOW SOPPRESSO E ASSENZA DI HISTORY ROW**
- [-] `TEST-002` — Test lifecycle cambio sessione/Start fallito — **PARZIALE; CAMBIO EVENTO/SESSIONE, ABORT E RISPOSTE TARDIVE SONO COPERTI, MA MANCA IL TEST FRONTEND COMPLETO DEL PERCORSO START FALLITO**
- [x] `TEST-003` — Inventario, manifest e comando test canonico — **RUNNER IMPLEMENTATO; MATRICE COMPLETA ANCORA APERTA E MANIFEST NON ESAUSTIVO**
- [x] `TEST-004` — Secondo bootstrap sulla stessa storage identity bloccato prima di recovery e listener — **IMPLEMENTATO E COPERTO; IL PASS RESTA QUELLO DEL CICLO STORICO REGISTRATO**
- [-] `TEST-005` — Matrice sostituzione sessione backend — **PARZIALE; NUOVA SESSIONE, STALE SOFA E STALE SOURCE IDENTITY SONO COPERTI, MA MANCA UNA MATRICE BACKEND COMPLETA DI SOSTITUZIONE E OPERAZIONI IN FLIGHT**
- [x] `TEST-006` — Riuso Betfair session-safe — **COPERTURA IMPLEMENTATA; RIUSO CONSENTITO NELLA STESSA SESSIONE E `scraper_session_conflict` VERIFICATO TRA SESSIONI DIFFERENTI**
- [x] `TEST-007` — Cleanup mismatch completo SofaScore/Betfair — **COPERTURA IMPLEMENTATA; ORDERING DEL CLEANUP, INVALIDAZIONE GENERATION, TERMINAZIONE BETFAIR/TRACKING E CANCELLAZIONE DELLE RICHIESTE SOFA IN CODA SONO VERIFICATI**
- [-] `TEST-008` — Stop partial failure backend/UI — **PARZIALE; FAILURE E CLEANUP INCOMPLETO SONO COPERTI DAL BACKEND, MA MANCA LA CORRISPONDENTE COPERTURA UI/INTERACTION COMPLETA**
- [x] `TEST-009` — Conferma Source Identity stale — **COPERTURA IMPLEMENTATA; UNA CONFERMA CON `trackingSessionId` OBSOLETO VIENE VERIFICATA COME `stale_session`**
- [x] `TEST-010` — Validatore Betfair condiviso — **IMPLEMENTATO E COPERTO; `classifyBetfairUrl` È CONDIVISO FRA PREFLIGHT E START TRACKING ED È ESERCITATO DAI TEST DI CONTRATTO**
- [-] `TEST-011` — Parità Graph Preflight/runtime — **PARZIALE; HTTPS, HOST, PORTA/CREDENZIALI, PATH E DUPLICATI SONO ALLINEATI, MA IL PREFLIGHT ACCETTA ANCORA GRAPH DI MARKET DIVERSI CON `sameMarket:false`**
- [ ] `TEST-012` — Un solo comando Betfair globale — **MANCANTE; ESISTONO PROTEZIONI PER-KEY/SESSIONE E REGISTRI SEPARATI, MA NON UN'AUTHORITY GLOBALE BETFAIR**
- [-] `TEST-013` — Endpoint `/odds` rimosso, letture preservate — **CONDIZIONE DI CODICE VERIFICATA E LETTURE TESTATE; MANCA ANCORA UNA REGRESSIONE DEDICATA CHE ASSERTISCA ESPLICITAMENTE L'ASSENZA DI `/odds`**
- [ ] `TEST-014` — Probe CDP session-owned — **MANCANTE; `/latest` CONTINUA A RICEVERE `mode` E `cdpUrl` DALLA QUERY ANZICHÉ DALLA RUNTIME IDENTITY DELLA SESSIONE ATTIVA**
- [x] `TEST-015` — Network capture bounded e drained — **COPERTURA IMPLEMENTATA; COLLECTOR BOUNDED E DRAIN DELLE TASK POSSEDUTE SONO TESTATI ESPLICITAMENTE**
- [x] `TEST-016` — Nessun volume runner sintetico — **COPERTURA IMPLEMENTATA; VOLUME RUNNER ASSENTE RESTA `null` E MONEY FLOW VIENE SOPPRESSO CON `runner_matched_unavailable`**
- [ ] `TEST-017` — Acquisition timestamp e Graph skew — **MANCANTE; ACQUISITION ENVELOPE, TIMESTAMP PER API/GRAPH E `maxGraphSkewMs` NON SONO ANCORA IMPLEMENTATI**
- [ ] `TEST-018` — Retention log/dump e maintenance authority — **MANCANTE; RETENTION DISTINTA DI LOG/NETWORK DUMP E MAINTENANCE AUTHORITY COMPLETA NON SONO IMPLEMENTATE**
- [ ] `TEST-019` — Lost update cross-source shared history — **MANCANTE; LA SHARED HISTORY RESTA ESPOSTA A COORDINAMENTO SOURCE-SCOPED E IL RISCHIO CROSS-SOURCE NON È RISOLTO**
- [ ] `TEST-020` — Pending cross-source sullo shared target — **MANCANTE; I PENDING SONO ANCORA CERCATI PER `eventId + source`, NON COME LOCK EVENT-SCOPED DELLA SHARED HISTORY**
- [ ] `TEST-021` — Verifica target completed nei record parziali — **MANCANTE; LA RECOVERY VERIFICA I TARGET QUANDO ENTRAMBI SONO `completed`, MA NEI RECORD PARZIALI PASSA DIRETTAMENTE AL REPAIR E NON TESTA/RIPARA IL TARGET GIÀ MARCATO COMPLETE**
- [ ] `TEST-022` — Target JSON valido ma identity/digest errati — **MANCANTE; ESISTONO TEST PER TARGET MANCANTE E JSON INVALIDO E IL VERIFICATORE CORRENTE CONFRONTA ANCHE IDENTITY/CONTENUTO, MA MANCA LA REGRESSIONE SU JSON VALIDO SEMANTICAMENTE ERRATO E IL DIGEST DI `IMPL-020` NON ESISTE**
- [-] `TEST-023` — Journal invalido → read-only `integrity_unknown` — **PARZIALE; JOURNAL INVALIDO → `integrity_unavailable` E COMPORTAMENTO READ-ONLY SONO TESTATI, MA `integrity_unknown`/CONTROL PLANE PUBBLICO NON È IMPLEMENTATO**
- [ ] `TEST-024` — Aggregate integrity shared history — **MANCANTE; IL CONTRATTO AGGREGATO CROSS-SOURCE DELLA SHARED HISTORY NON È ANCORA IMPLEMENTATO**
- [-] `TEST-025` — Stato cross-source soltanto committed — **PARZIALE; BETFAIR PREPARE È TESTATO COME NON PROMOTING E IL CODICE PUBBLICA SOFA/BETFAIR SOLO DOPO COMMIT, MA MANCA UNA MATRICE ESPLICITA FAILED/PARTIAL/COMPLETE SULLE MAPPE CROSS-SOURCE**
- [x] `TEST-026` — Read status Storage distinti — **COPERTURA IMPLEMENTATA; `missing`, `found`, `invalid_json`, `read_failed` E `discovery_failed` SONO ASSERTITI SEPARATAMENTE IN `storage/discoveryAndRead.test.mjs`**
- [x] `TEST-027` — Duplicate event documents bloccanti — **COPERTURA IMPLEMENTATA; DOCUMENTI EVENTO AMBIGUI PRODUCONO `ambiguous_storage_target` E FAIL-CLOSED INDIPENDENTEMENTE DALL'ORDINE DI DISCOVERY**
- [-] `TEST-028` — EventId e target confinement — **PARZIALE; TARGET TIMELINE NON CANONICI/AMBIGUI E ALCUNI EVENT ID INVALIDI SONO TESTATI, MA IL CONTRATTO UNIFORME HISTORY/TIMELINE/JOURNAL + ROOT CONFINEMENT RESTA ASSENTE**
- [ ] `TEST-029` — Nessun consumer runtime dei writer raw — **MANCANTE; NON ESISTE UN CONTROLLO STATICO/DI REGRESSIONE REPOSITORY-WIDE CHE IMPEDISCA NUOVI CONSUMER DIRETTI DI `saveHistory`/`saveTimeline`/`writeTimelineDocument`**
- [-] `TEST-030` — Retry, escalation e rearm recovery — **PARZIALE; RETRY, RETRYABLE FAILURE, IDEMPOTENZA E RECOVERY DELLO STESSO COMMIT SONO COPERTI, MA POLICY PERSISTITA DI ATTEMPT COUNT, ESCALATION E REARM DI `IMPL-021` NON È IMPLEMENTATA**
- [-] `TEST-031` — Tick `status-only` non crea nuovo Significant Flow/source event — **PARZIALE; IL TICK GRAPH-LOGIN `status-only` È TESTATO COME MONEY FLOW `suppressed`, I FLOW SOPPRESSI SONO TESTATI COME NON SIGNIFICATIVI E L'ASSENZA DI FLOW DISABILITA IL SOURCE MARKET EVENT, MA MANCA UNA REGRESSIONE END-TO-END DEDICATA `status-only → no flow → no source event`**
- [-] `TEST-032` — Eligibility tecnica Market Reactions su stale/Graph/ladder/skew — **PARZIALE; SIGNIFICANT FLOW TESTA GRAPH STALE, LADDER ASSENTE, `selectionId` MANCANTE E FLOW SUPPRESSED, E L'ALIGNMENT TESTA SOURCE GAP/CLOCK SKEW, MA MANCA UN ELIGIBILITY GATE UNIFORME TESTATO SU TUTTI I BRANCH**
- [ ] `TEST-033` — `selectionId` obbligatorio senza fallback nome — **MANCANTE; FIELD → MARKET CONSENTE ANCORA IL FALLBACK SUL NOME QUANDO LA BASELINE NON HA `selectionId`**
- [ ] `TEST-034` — Market activity distinta da qualified observation — **MANCANTE; `marketResponseObserved` CONTINUA A INCLUDERE DIRETTAMENTE `matchedVolumeIncreaseObserved`, NON ESISTE ANCORA LA SEMANTICA QUALIFICATA APPROVATA**
- [ ] `TEST-035` — Marker presente distinto da marker transition — **MANCANTE; I TEST CORRENTI VALIDANO LA PRESENZA DEL MARKER NELLA FINESTRA, NON UNA NUOVA TRANSIZIONE `false → true` DOPO IL FLOW**
- [ ] `TEST-036` — Price source change degradata/unavailable — **MANCANTE; LA SOURCE DEL PREZZO NON È ANCORA PARTE DEL CONTRATTO DI COMPARABILITÀ**
- [ ] `TEST-037` — Baseline gap oltre soglia — **MANCANTE; FIELD → MARKET USA L'ULTIMO TICK PRE-ANCHOR SENZA `maxBaselineGapSec`**
- [ ] `TEST-038` — Coverage runner complete/partial/none — **MANCANTE; IL CONTRATTO DI COVERAGE ESPLICITA DEI DUE RUNNER NON È IMPLEMENTATO**
- [-] `TEST-039` — Acquisition timestamp, source skew e clock skew — **PARZIALE; `crossSourceGapSec`, SOURCE AGE E TIMESTAMP FUTURI SONO TESTATI, MA ACQUISITION/RECORDING TIMESTAMP E GRAPH/API SKEW NON ESISTONO ANCORA**
- [ ] `TEST-040` — Baseline Significant Flow per `selectionId` — **MANCANTE; LA BASELINE CORRENTE AGGREGA GLI IMPORTI VALIDI SENZA SEPARARLI PER `selectionId`**
- [ ] `TEST-041` — Cluster temporali non sovrapposti — **MANCANTE; IL CLUSTERING È IMPLEMENTATO, MA MANCA UNA REGRESSIONE DEDICATA SU CLUSTER SEPARATI/NON SOVRAPPOSTI**
- [-] `TEST-042` — Semantica computed/available/observed — **PARZIALE; `available`, OBSERVATION E RELIABILITY SONO GIÀ TESTATI COME CONCETTI DISTINTI, MA MANCA UNO STATO `computed`/BRANCH STATE UNIFORME**
- [ ] `TEST-043` — Finestre open/closed e provisional/final — **MANCANTE; `windowClosed` ESISTE NEL CODICE MA NON È COPERTO DAL TEST DEDICATO E LA SEMANTICA `provisional/final` NON È IMPLEMENTATA**
- [ ] `TEST-044` — Start A/B concorrenti e risposta tardiva — **MANCANTE; NESSUN TEST DI DUE START CONCORRENTI, RESPONSE INVERTITE E COMMAND AUTHORITY**
- [ ] `TEST-045` — Start fallito/ambiguo e cleanup compensativo — **MANCANTE; LA SUITE `useLiveTrackingActions` NON ESERCITA IL WORKFLOW E IL CLEANUP COMPENSATIVO DELLO START AMBIGUO NON È IMPLEMENTATO**
- [-] `TEST-046` — Response Sofa/Betfair vecchie o fuori ordine — **COPERTURA PARZIALE; SOFA È TESTATO ANCHE CON RESPONSE VECCHIA RISOLTA DOPO LA NUOVA, BETFAIR TESTA ABORT SU CAMBIO EVENTO MA NON LA STESSA LATE-RESPONSE REGRESSION**
- [-] `TEST-047` — Cleanup durante fetch senza timeout ricreato — **COPERTURA PARZIALE; ABORT, UNMOUNT E LIFECYCLE SONO TESTATI, MA MANCA L'ASSERZIONE ESPLICITA `LATE COMPLETION DOPO CLEANUP → NESSUN NUOVO TIMER/FETCH`**
- [ ] `TEST-048` — Stop completo: tutti i poller sospesi e snapshot frozen — **MANCANTE; NON ESISTE TEST INTEGRATO DI STOP SU TUTTI I POLLER E IL CONTRATTO `stopped_static`/SNAPSHOT FROZEN NON È ANCORA COMPLETO**
- [ ] `TEST-049` — Stop parziale visibile in UI — **MANCANTE; IL PARTIAL FAILURE BACKEND È COPERTO, MA NON LA SUA RAPPRESENTAZIONE INTERACTION/UI**
- [-] `TEST-050` — Persistence UI locale/globale e snapshot degraded — **COPERTURA PARZIALE; `persistenceViewState` TESTA INACTIVE/WAITING/CURRENT/DEGRADED/ERROR E IL POLLER EVIDENCE TESTA INTEGRITY DEGRADED, MA SIDEBAR/MODALE E UI GLOBALE COMPLETA NON SONO COPERTE**- [-] `TEST-051` — EventId/trackingSessionId dalla risposta Start — **COPERTURA PARZIALE: `useLiveTrackingActions.test.mjs` VERIFICA `trackingSessionId`; EVENT ID E RISPOSTA START END-TO-END NON SONO COPERTI**
- [ ] `TEST-052` — Nuovo Source Identity context con stessi nomi — **MANCANTE; LA CHIAVE LOCALE DISTINGUE EVENT ID, STATO E NOMI MA NON INCLUDE `trackingSessionId` O UNA GENERATION/EPOCH DEL NUOVO CONTESTO**
- [ ] `TEST-053` — Preflight input-bound e response stale — **MANCANTE; IL PREFLIGHT NON HA GENERATION/REQUEST ID/ABORT O VERIFICA DELLO SNAPSHOT INPUT PRIMA DI APPLICARE RESPONSE ASINCRONE**
- [-] `TEST-054` — Market Reactions branch `available:false` — **COPERTURA MIRATA PRESENTE; `marketReactionViewModel.test.mjs` VERIFICA ESPLICITAMENTE `available:false`, MA IL BRANCH STATE/AVAILABILITY COMPLETO NON È ANCORA CHIUSO**
- [-] `TEST-055` — Mapping schema Market Reactions reale — **COPERTURA MIRATA PRESENTE; IL VIEW MODEL TESTA UNA PARTE DELLO SCHEMA REALE, MA IL CONTRATTO COMPLETO `IMPL-027` RESTA APERTO**
- [-] `TEST-056` — Nessun falso stato live/connected/polling active — **COPERTURA PARZIALE; `dashboardConnections.test.mjs` ESCLUDE FALSI `connected` SU WAITING, COLLECTING/PENDING, ASSENZA DATI, ERROR E DEGRADED, MA MANCA L'INVARIANTE INTEGRATO LIVE/CONNECTED/POLLING**
- [ ] `TEST-057` — Sessione Sofa-only senza polling Betfair — **MANCANTE COME REGRESSIONE; IL RUNTIME BETFAIR RESTA INATTIVO SENZA URL/EVENT ID, MA NON ESISTE IL TEST ESPLICITO SOFA-ONLY → ZERO REQUEST BETFAIR**
- [-] `TEST-058` — StrictMode con una sola catena polling — **COPERTURA PARZIALE PRESENTE CON `React.StrictMode`, REQUEST COUNT, ABORT E LATE-RESPONSE GUARD; CONTROLLER/HARNESS CANONICO COMPLETO NON IMPLEMENTATO**
- [ ] `TEST-059` — Smoke responsive desktop/tablet/mobile — **MANCANTE**
- [x] `TEST-060` — Manifest enumera ogni comando una sola volta — **IMPLEMENTATO; IL SELF-TEST RIFIUTA ENTRY ID E COMANDI DUPLICATI, CON PASS STORICO REGISTRATO**
- [x] `TEST-061` — Path mancante nel manifest fallisce prima della suite — **IMPLEMENTATO; IL SELF-TEST VERIFICA FAILURE PRE-ESECUZIONE SU PATH MANCANTE E CWD FUORI ROOT, CON PASS STORICO REGISTRATO**
- [x] `TEST-062` — Test legacy eseguiti in processi isolati — **IMPLEMENTATO; ENTRY DISTINTE SONO ESEGUITE IN CHILD PROCESS CON PID DISTINTI, CON PASS STORICO REGISTRATO**
- [x] `TEST-063` — Timeout termina il processo e produce failure bounded — **IMPLEMENTATO; TIMEOUT, TERMINAZIONE E STATO `timeout` SONO ASSERTITI DAL SELF-TEST, CON PASS STORICO REGISTRATO**
- [x] `TEST-064` — Moduli Python `*_test.py` inclusi esplicitamente — **IMPLEMENTATO; I MODULI PYTHON NON STANDARD SONO ENUMERATI ESPLICITAMENTE E VERIFICATI DAL SELF-TEST, CON PASS STORICO REGISTRATO**
- [ ] `TEST-065` — Sandbox rimossa su successo e fallimento — **MANCANTE COME CONTRATTO GENERALE; ALCUNI SELF-TEST USANO TEMP DIR E CLEANUP, MA `commitId.test.mjs` SCRIVE ANCORA SOTTO `process.cwd()` SENZA CLEANUP GARANTITO**
- [ ] `TEST-066` — Nessun test accede alle directory runtime reali — **MANCANTE COME ENFORCEMENT; NON ESISTE UNA SANDBOX GENERALE CHE IMPEDISCA AI CHILD PROCESS DI RAGGIUNGERE DIRECTORY RUNTIME REALI**
- [ ] `TEST-067` — Fixture schema, provenance e redaction validate — **MANCANTE; `fixtures` È PRESENTE COME METADATA/PATH DEL MANIFEST, MA CATALOGO, SCHEMA, PROVENANCE E REDACTION CONDIVISI NON SONO IMPLEMENTATI**
- [-] `TEST-068` — TEST-ID dei registri coerenti con il manifest — **PARZIALE; IL MANIFEST VALIDA FORMATO/UNICITÀ DEI `requirementIds` E IL REGISTRY CHECKER VALIDA TODO ↔ OWNER, MA MANCA IL CONFRONTO DIRETTO E COMPLETO REGISTRI TEST-ID ↔ VALIDATION MANIFEST**
- [-] `TEST-069` — Result JSON contiene SHA, profilo, conteggi e limiti — **PARZIALE; `repositorySha`, `profile`, `counts` E `limits` SONO REALMENTE PRODOTTI E RICHIESTI DAL RESULT SCHEMA, MA LA REGRESSIONE DEDICATA NON ASSERISCE ANCORA INTEGRALMENTE IL CONTRATTO**
- [-] `TEST-070` — Result JSON non contiene segreti, URL o path vietati — **PARZIALE; IL SELF-TEST VERIFICA REDACTION DI PATH, URL E BEARER SECRET NEL CHILD OUTPUT, MA NON VALIDA ANCORA L'INTERO ARTIFACT JSON CONTRO TUTTE LE CLASSI VIETATE**
- [-] `TEST-071` — Frontend harness monta hook in StrictMode con fake timer — **PARZIALE; HOOK REALI SONO MONTATI IN `React.StrictMode` CON `react-test-renderer`, MA FAKE TIMER E STACK CANONICO VITEST/JSDOM/RTL NON SONO IMPLEMENTATI**
- [-] `TEST-072` — Route harness verifica HTTP reale su porta dinamica — **PARZIALE; `server.test.mjs` USA HTTP REALE SU `listen(0)`, MA L'HARNESS NON È GENERALIZZATO E ALCUNE ROUTE RESTANO TESTATE DIRETTAMENTE TRAMITE HANDLER**
- [-] `TEST-073` — Profilo `fast` non avvia browser, rete esterna o tracking — **PARZIALE; IL MANIFEST VIETA CAPABILITY DICHIARATE `browser`, `credentials`, `external-network` E `tracking`, MA NON ESISTE UN SANDBOX PROCESS-LEVEL CHE IMPEDISCA USI NON DICHIARATI E IL SELF-TEST ESERCITA DIRETTAMENTE SOLO `external-network`**
- [ ] `TEST-074` — Benchmark registra mediana/p95 senza dati live — **MANCANTE; IL PROFILO `benchmark` RESTA `planned` E DISABILITATO**
- [ ] `TEST-075` — Comando lint eseguibile oppure rimosso dalla superficie ufficiale — **MANCANTE; `npm run lint` RESTA PUBBLICATO MA LA CONFIGURAZIONE ESLINT REPOSITORY-OWNED UTILIZZABILE NON È PRESENTE**
- [x] `TEST-076` — Tutti i documenti canonici indicizzati sono inventariati una sola volta — **COMPLETATO COME CHECKPOINT STORICO DELLA MIGRAZIONE DOCUMENTALE**
- [x] `TEST-077` — Ogni sostituzione `.mdx` → `.md` ha mapping univoco e nessun duplicato canonico — **COMPLETATO COME CHECKPOINT STORICO DELLA MIGRAZIONE DOCUMENTALE**
- [x] `TEST-078` — Tutti i link relativi dei file migrati risolvono e non puntano a percorsi rimossi — **COMPLETATO COME CHECKPOINT STORICO; IL CLOSEOUT REGISTRA STRICT LINK CHECK SENZA ERRORI/WARNING E IL CHECKER RESTA PRESENTE**
- [x] `TEST-079` — Stato corrente, deprecato, storico e futuro coerenti con codice e registri — **COMPLETATO COME CHECKPOINT STORICO DELLA MIGRAZIONE; NON COSTITUISCE UNA CERTIFICAZIONE CONTINUA DELLA COERENZA DOCUMENTALE CORRENTE**

---


# BLOCCO F — Implementazioni utili **0/1 COMPLETA**

> Stato sintetico corrente. Una IMPL può avere primitive già presenti senza essere completa nel contratto approvato.

- [x] `IMPL-001` — Link checker Markdown/MDX — **IMPLEMENTATA E VERIFICATA; CHECKER READ-ONLY PRESENTE E REGISTRATO NEL VALIDATION MANIFEST**
- [ ] `IMPL-002` — Inventario endpoint — **NON COMPLETATA; MANCA ANCORA UN INVENTARIO AUTOMATICO CHE CONFRONTI ROUTER MONTATI, ENDPOINT E DOCUMENTAZIONE API**
- [-] `IMPL-003` — Matrice test ↔ modulo ↔ documento — **PARZIALMENTE IMPLEMENTATA; VALIDATION MANIFEST E RESULT STRUTTURATI FORNISCONO UNA BASE MACHINE-READABLE, MA MATRICE COMPLETA, INVENTARIO TOTALE E ULTIMO ESITO PER AREA NON SONO CHIUSI**
- [x] `IMPL-004` — Archivio collaudi storici — **COMPLETATA; `docs/validations/` È SEPARATA DAGLI OWNER CANONICI E CONTIENE LE EVIDENZE STORICHE**
- [x] `IMPL-005` — Coerenza Todo ↔ registri — **IMPLEMENTATA E VERIFICATA; CHECKER READ-ONLY PRESENTE E REGISTRATO NEL VALIDATION MANIFEST**
- [-] `IMPL-006` — Session authority end-to-end — **PARZIALMENTE IMPLEMENTATA; `trackingSessionId` E GUARDIE DI SESSIONE SONO PRESENTI, MA COMMAND AUTHORITY, HANDOFF/CLEANUP ATOMICO, STOP COMPLETO E RIMOZIONE LEGACY NON SONO CHIUSI**
- [-] `IMPL-007` — Serializer pubblico diagnostica/errori — **HARDENING SOSTANZIALE PRESENTE CON REDACTION, BOUNDING E BOUNDARY LOCALI; SERIALIZER PUBBLICO UNICO TRASVERSALE ANCORA ASSENTE**
- [-] `IMPL-008` — Harness offline persistence/recovery — **PARZIALMENTE IMPLEMENTATA; FIXTURE TEMPORANEE, JOURNAL ISOLATO E INTEGRATION TEST DI RECOVERY REALI SONO PRESENTI, MA IL PROFILO `persistence`, LA SANDBOX DEDICATA E LA PROCEDURA CANONICA UNITARIA RESTANO NON IMPLEMENTATI**
- [-] `IMPL-009` — Adapter persistence + stati locali + pannello sidebar — **PARZIALMENTE IMPLEMENTATA; ADAPTER CENTRALE, TEST, BANNER GLOBALE DASHBOARD E STATO LOCALE BETFAIR SONO PRESENTI, MA INDICATORE SIDEBAR, MODALE DETTAGLIATA, CAMPI COMPLETI DEL CONTRATTO E COPERTURA LOCALE UNIFORME PER SETTORE NON SONO CHIUSI**
- [~] `IMPL-010` — Toolkit autonomo studio strategie offline — **FUTURO; NON IMPLEMENTATO E CONDIZIONATO A REPLAY/BACKTESTING E ROBUSTEZZA DEL NUCLEO**
- [ ] `IMPL-011` — Authority di manutenzione cleanup offline — **NON IMPLEMENTATA COME AUTHORITY; ESISTE UNA UTILITY DI RETENTION CON DRY-RUN, ALLOW-LIST E SAFETY CHECK, MA MAINTENANCE LOCK, RUNTIME MANIFEST, PORTE EFFETTIVE E IDENTITÀ DEI SERVIZI RESTANO ASSENTI**
- [ ] `IMPL-012` — Fixture versionate e replay offline — **NON IMPLEMENTATA COME INFRASTRUTTURA CANONICA; ESISTONO FIXTURE MIRATE NEI TEST, MA SCHEMA/CATALOGO VERSIONATO, VALIDATOR E REPLAY DETERMINISTICO CON CURSORE STORICO SONO ASSENTI**
- [ ] `IMPL-013` — Baseline end-to-end e freshness — **NON IMPLEMENTATA COME BASELINE CANONICA; ESISTONO METRICHE/FRESHNESS LOCALI, MA PROFILO BENCHMARK, RACCOLTA END-TO-END, P50/P95 E REPORT STRUTTURATO RESTANO ASSENTI**
- [~] `IMPL-014` — Ottimizzazione Betfair misurata e reversibile — **FUTURA E CONDIZIONATA A `IMPL-013` E AGLI ALTRI PREREQUISITI**
- [x] `IMPL-015` — Writer authority esclusiva `match_history` — **COMPLETATA; AUTHORITY PROJECT-OWNED ACQUISITA PRIMA DI RECOVERY/LISTEN E MANTENUTA PER IL LIFECYCLE DEL BACKEND**
- [-] `IMPL-016` — Betfair runtime command authority — **PARZIALMENTE IMPLEMENTATA; SESSION IDENTITY, SCRAPER/LOGIN LIFECYCLE E PROCESS OWNERSHIP SONO PRESENTI, MA `betfairCommandId`, ARBITRO GLOBALE E HANDOFF LOGIN/TRACKING/DIAGNOSTICS RESTANO ASSENTI**
- [-] `IMPL-017` — Local control-plane boundary — **PARZIALMENTE IMPLEMENTATA; LOOPBACK BIND E BOUNDARY HOST/ORIGIN SONO PRESENTI, MA PORTE BACKEND/FRONTEND AUTHORITATIVE E CONTRATTO COMPLETO RESTANO APERTI**
- [-] `IMPL-018` — Betfair acquisition envelope e provenance — **PARZIALMENTE IMPLEMENTATA; TRACKING SESSION E IDENTITÀ MARKET/RUNNER SONO PRESENTI, MA ACQUISITION ENVELOPE, TIMESTAMP API/GRAPH, `maxGraphSkewMs`, `recordedAt` SEPARATO E `matchedValueSource` SONO ASSENTI**
- [ ] `IMPL-019` — Event persistence authority — **NON IMPLEMENTATA COME AUTHORITY EVENT-SCOPED; ESISTONO WRITER AUTHORITY PROCESS-LEVEL E JOURNAL SOURCE-SCOPED, MA SOFA E BETFAIR NON SONO ANCORA SERIALIZZATI SULLA SHARED HISTORY DELLO STESSO EVENTO**
- [-] `IMPL-020` — Canonical document contract e verified recovery — **PARZIALMENTE IMPLEMENTATA; WRITER ATOMICI, READ RESULT STRUTTURATI, DISCOVERY FAIL-CLOSED E VERIFICA DEI RESIDUAL COMPLETATI SONO PRESENTI, MA SCHEMA/REVISION/HEAD/DIGEST E VERIFICA DEL TARGET GIÀ COMPLETE NEI RECORD PARZIALI RESTANO INCOMPLETI**
- [-] `IMPL-021` — Recovery control plane — **PARZIALMENTE IMPLEMENTATA; BOOTSTRAP PRE-LISTEN, SUMMARY, REPAIR E INTEGRITY PER RECORD SONO REALI, MA STATO GLOBALE PERSISTENTE, `integrity_unknown`, WRITER POLICY, RETRY BOUNDED/ESCALATION, REARM E API DEDICATA RESTANO ASSENTI**
- [-] `IMPL-022` — Evidence temporal provenance and alignment policy — **PARZIALMENTE IMPLEMENTATA; FRESHNESS PER SOURCE, `crossSourceGapSec`, CLOCK-SKEW HANDLING E PRIMITIVE DI ALIGNMENT SONO PRESENTI, MA ACQUISITION/RECORDING PROVENANCE E POLICY VERSIONATA DI SOURCE SKEW/WINDOW STATE RESTANO INCOMPLETE**
- [-] `IMPL-023` — Market Reaction eligibility e branch state — **PARZIALMENTE IMPLEMENTATA; SIGNIFICANT FLOW POSSIEDE ELIGIBILITY TECNICA REALE E I BRANCH MARKET REACTIONS ESISTONO, MA TICK ELIGIBILITY E BRANCH STATE UNIFORMI/POLICY-VERSIONED NON SONO COMPLETI**
- [-] `IMPL-024` — Runner temporal identity e price comparability — **PARZIALMENTE IMPLEMENTATA; `selectionId` È GIÀ USATO COME IDENTITÀ IN PIÙ PERCORSI, MA FIELD → MARKET CONSENTE ANCORA FALLBACK NOME E MANCANO PRICE-SOURCE COMPARABILITY, BASELINE GAP BOUNDED E RUNNER COVERAGE UNIFORME**
- [-] `IMPL-025` — Frontend live-session controller — **PARZIALMENTE IMPLEMENTATA; `trackingSessionId`, START/STOP, CONFIG CONFERMATA E SESSION ACTIVATION SONO COORDINATI, MA MANCA UNA STATE MACHINE OWNER UNICA CON COMMAND ID, STOP SESSION-SCOPED E `stopped_static`**
- [-] `IMPL-026` — Polling runtime session-scoped — **PARZIALMENTE IMPLEMENTATA; GENERATION, REQUEST ID, ABORT, TIMER CLEANUP E LATE-RESPONSE GUARD SONO PRESENTI NEI POLLER, MA MANCA UNA `trackingSessionId/sessionKey` COMUNE END-TO-END**
- [-] `IMPL-027` — Market Reactions frontend view model — **PARZIALMENTE IMPLEMENTATA; HELPER DI VIEW MODEL, STRICT AVAILABILITY E MAPPING MARKET SOURCE SONO PRESENTI, MA PAGE/BRANCH STATE E CONTRATTO PROVISIONAL/FINAL/WINDOW/INTEGRITY COMPLETI NON SONO CHIUSI**
- [x] `IMPL-028` — Manifest e runner canonico di validazione — **IMPLEMENTATA E VALIDATA LOCALMENTE; RUNNER, MANIFEST, PREFLIGHT, PROCESS ISOLATION, TIMEOUT, REDACTION E RUN ARTIFACT JSON V1 APPARTENGONO AL CLOSEOUT**
- [ ] `IMPL-029` — Fixture catalog e sandbox condivisa — **NON IMPLEMENTATA COME SUPERFICIE CONDIVISA; ESISTONO METADATA `fixtures` E TEMP/FIXTURE LOCALI, MA CATALOGO VERSIONATO, PROVENANCE, SANDBOX COMUNE, PROTEZIONE RUNTIME E CLEANUP GARANTITO NON SONO IMPLEMENTATI**
- [-] `IMPL-030` — Frontend interaction test harness — **PARZIALMENTE IMPLEMENTATA; ESISTONO LIFECYCLE/STRICTMODE TEST CON `react-test-renderer`, MA HARNESS DOM CON VITEST/JSDOM/RTL, FAKE TIMER E INTERACTION COVERAGE GENERALE NON È COMPLETO**
- [-] `IMPL-031` — Validation result ledger e artefatti JSON — **PARZIALMENTE IMPLEMENTATA; RUN ARTIFACT JSON V1 STRUTTURATO, ATOMICO, BOUNDED E REDATTO È PRESENTE, MA LEDGER STORICO, LATEST-RESULT AUTHORITY E SEMANTICHE COMPLETE DI COVERAGE RESTANO ASSENTI**
- [x] `IMPL-032` — Pipeline di migrazione documentale per batch — **IMPLEMENTATA E COMPLETATA NEL CICLO DOCUMENTALE; MIGRAZIONE `.mdx` → `.md`, NORMALIZZAZIONE E CLOSEOUT RESTANO PROVENANCE STORICA**

---

# BLOCCO G — Workflow operativo permanente **COMPLETA**

- [x] Ruoli permanenti: Chat Analisi, Chat Esecutore, Desktop Esecutore e Desktop Collaudatore
- [x] Esecutore e collaudatore separati
- [x] Massimo tre tentativi ragionati per prompt esecutivo
- [x] Report finale obbligatorio con file, comandi, test, esiti e limiti
- [x] `fileModificati.md` riservato ai flussi Desktop che lo richiedono
- [x] Commit e push riservati all’utente
- [x] Nessun PASS dichiarato senza output verificabile
- [x] Nessun dato sensibile nei report

---


# BLOCCO H — Modularizzazione e pulizia **COMPLETA**

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 7 moduli
- [x] ID globali mantenuti
- [x] Registry checker ricorsivo presente
- [x] I Blocchi E/F restano la superficie sintetica consumata dal checker
- [x] La Todo resta una vista unica: **nessuna modularizzazione aggiuntiva necessaria per questo documento**
- [x] Nessuno split della Todo introdotto per sola dimensione
- [x] `docs/archive/` resta separato dalla documentazione canonica — **PRESENTE NEL REPOSITORY CORRENTE COME MATERIALE NON CANONICO**
- [x] `docs/validations/` resta separato dai runbook e dagli owner tecnici
- [x] Pulizie o consolidamenti dei materiali archive richiedono lettura/classificazione preventiva e assorbimento dei contenuti unici; **nessuna cancellazione automatica e nessuna promozione implicita a stato corrente**

---

# BLOCCO I — Preparazione delle task esecutive

> Checklist riutilizzabile per ogni nuova task esecutiva.  
> Le caselle non rappresentano lo stato globale del progetto: vengono spuntate soltanto durante la preparazione della singola task selezionata e si considerano nuovamente vuote per la task successiva.

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

- [x] Audit documentazione storico completato
- [x] Audit codice storico completato
- [x] Struttura B/C conservata come checkpoint storico
- [x] Stato corrente e checkpoint storici mantenuti distinti
- [x] Provenance del recupero documentale mantenuta distinta dallo stato tecnico corrente
- [x] Registri modulari e checker read-only individuati
- [-] Documentazione canonica corrente presente — **STRUTTURA E OWNER CANONICI PRESENTI, MA RESTANO ALCUNI DRIFT DA RIALLINEARE ALLA BASELINE CORRENTE**
- [-] Prima serie di correzioni tecniche successive all’audit — **CORREZIONI SOSTANZIALI GIÀ IMPLEMENTATE, MA DIVERSE MACRO-IMPL CRITICHE RESTANO APERTE O PARZIALI**
- [ ] Copertura TEST-ID mancante/partial da completare e riallineare al manifest
- [ ] Collaudi live residui da eseguire quando richiesti dalle task owner
- [ ] Chiusura delle macro-implementazioni critiche ancora aperte
- [ ] Stato finale del prodotto dopo le correzioni tecniche residue

## Provenance storica del recupero pubblicato

```txt
base del recupero documentale: 8f936d1
commit di applicazione del recupero: 2ebe7e8
data: 2026-08-06
```

Gli eventuali conteggi PASS associati a quel ciclo restano **snapshot storici** e non costituiscono validation corrente.

## Prossimo passo

Prossimo passo: **DA SELEZIONARE**.
