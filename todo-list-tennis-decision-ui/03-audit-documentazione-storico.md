> [Todo operativa](../todo-list-tennis-decision-ui.md)

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


