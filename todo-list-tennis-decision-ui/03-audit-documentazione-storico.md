> [Todo operativa](../todo-list-tennis-decision-ui.md)

# BLOCCO B — Audit documentazione e lavoro completato **1/8 COMPLETA**

> Le checklist B1–B6 sono un **checkpoint storico dell’audit documentale**. Per lo stato attuale fanno fede le sintesi correnti dei Blocchi D/E/F e le rispettive schede owner.

## B1 — Ingresso e orientamento — **AUDIT COMPLETATO; FOLLOW-UP APERTI**

- [x] README root — verificato sulla struttura corrente; punta all'indice canonico `.md` e allo stato corrente
- [x] Indice canonico — verificato; percorso corrente `docs/tennis-decision-ui/index.md`
- [ ] Repository map — `DOC-002`, `DOC-006` — ancora troppo estesa rispetto alla funzione di orientamento e con duplicazioni rispetto agli owner specialistici
- [ ] System boundaries — `DOC-006` — contiene ancora dettagli tecnici che si sovrappongono ai documenti owner
- [ ] Data lifecycle — `DOC-006` — conserva ancora dettagli di lifecycle e contratti specialistici da razionalizzare rispetto agli owner

## B2 — API — **AUDIT COMPLETATO; FOLLOW-UP APERTI**

- [-] API Match — `DOC-009`, `CODE-003` — documentazione riallineata e superficie dichiarata deprecata, ma `debug-last` e `lastDebugData` restano nel codice senza producer; rimozione ancora da eseguire
- [-] API Betfair — `DOC-010`, `DOC-011` — adapter integrity corretto; struttura facade/child sostanzialmente riallineata agli owner, con solo cleanup documentale residuo
- [x] API Evidence — `DOC-003`, `DOC-011` — distinzione GET read-only / POST-DELETE mutanti e sequenza gate-aware riallineate al codice; struttura facade/child implementata
- [x] API Strategy — `DOC-012`, `CODE-001`, `CODE-004` — superficie Strategy rimossa dal runtime attivo; problema della porta hardcoded eliminato per assorbimento
- [-] API Preflight — `DOC-013`, `CODE-002` — documentazione corretta e validator Betfair condiviso introdotto, ma la policy non è ancora completamente uniforme fra Preflight, Start e Login
- [x] API Runtime Health — contratto corrente riallineato a codice e documentazione; `repositoryIdentity` e `storageIdentity` sono presenti sia nella response builder sia nell'owner canonico

## B3 — Moduli — **AUDIT COMPLETATO; FOLLOW-UP APERTI**

- [-] Tracking SofaScore — contratto corrente verificato; `DOC-015` sostanzialmente risolto con duplicazioni documentali residue; `RUNTIME-002` **PARZIALMENTE RISOLTO**, con `trackingSessionId` e guardie stale presenti ma handoff/cleanup fisico atomico della sessione precedente ancora assente
- [-] Local context e point-by-point — decoder e fallback fail-closed coerenti; `SOFA-001` **ANCORA APERTO COME VALIDAZIONE LIVE**, perché il source contract disponibile non dimostra in modo generale l’identità del game corrente
- [-] Timeline e history — contratto storage verificato; `DOC-016` **RISOLTO**; resta soltanto il residuo documentale trasversale di `DOC-015`
- [x] Commit journal e recovery — contratto corrente verificato e coerente nel perimetro B3; journal, marker, recovery, repair e integrity hanno owner distinti
- [-] Lifecycle Betfair — contratto corrente verificato; separazione fra tracking, fetch, processor e storage sostanzialmente corretta; resta soltanto il cleanup documentale trasversale di `DOC-015`
- [x] Validità tecnica Betfair — `DOC-014` **RISOLTO**; la precedente discrepanza sull’ordine tracking key/classificazione non è più presente nella documentazione corrente
- [-] Match Evidence Snapshot — contratto read-only e confini con Source Identity, integrity e storage verificati; resta soltanto il cleanup documentale trasversale di `DOC-015`
- [x] Source Identity — comportamento principale e separazione fra gate live e Source Identity effective verificati e coerenti nel perimetro B3
- [-] Qualità, flow e alignment — ownership corrente verificata e sostanzialmente separata; resta soltanto il cleanup documentale trasversale di `DOC-015`; gli ulteriori finding Evidence appartengono al successivo audit del codice
- [-] Market Reactions — implementazione presente e comportamento principale verificato; `EVIDENCE-001` **APERTO** e `DEC-010` **NON ANCORA IMPLEMENTATA INTEGRALMENTE**, perché Field → Market consente ancora il fallback sul nome quando manca `selectionId`

## B4 — Frontend e Python — **AUDIT COMPLETATO; FOLLOW-UP APERTI**

- [-] Session shell — il difetto originario dello Start fallito con sessione/poller nascosti è stato corretto; `FRONTEND-003` resta **PARZIALMENTE RISOLTO** perché manca ancora un controller unico con command authority e cleanup compensativo per Start ambiguo
- [-] Polling e view model — `FRONTEND-001` **RISOLTO** con generation, request guard, abort e cleanup dei poller; `DOC-018` **RISOLTO** perché integrity è ora propagata end-to-end; `FRONTEND-002` resta **PARZIALMENTE RISOLTO** per sidebar, modale e dettaglio persistence globale ancora incompleti
- [-] UI Betfair e Market Reactions — wiring persistence e rendering delle degradazioni ora presenti; resta il completamento della superficie globale prevista da `FRONTEND-002`
- [x] Match Context UI — contratto, mapping e view model verificati; input incoerenti o incompleti restano unavailable senza fallback numerici inventati
- [x] Entry point e runtime Python — wrapper root sottili e launcher con backend/frontend dinamici verificati
- [x] Scraper SofaScore — CLI, cache e fallback browser coerenti; `SECURITY-003` **RISOLTO NEL FINDING SPECIFICO** con errori pubblici statici/bounded
- [-] Scraper Betfair — lifecycle principale coerente; `SECURITY-001` e `SECURITY-002` **RISOLTI**; `PYTHON-001` **PARZIALMENTE RISOLTO** perché le task network capture sono tracked, bounded, drained e cancellate al timeout, ma manca il detach esplicito del listener response nel percorso CDP
- [x] Graph URL — parser runtime, mapping `marketId`/`selectionId`, gestione duplicati e skip verificati e coerenti nel perimetro B4

## B5 — Operations e roadmap — **AUDIT COMPLETATO; FOLLOW-UP APERTI**

- [-] Runtime locale — contratto operativo corrente coerente; i collaudi storici sono stati separati (`DOC-023` risolto), ma il runbook resta molto esteso e conserva sovrapposizioni con contenuti architetturali (`DOC-021` parziale)
- [x] Controllo tracking — procedura corrente verificata e coerente con Stop globale, `scope=tracking`, cleanup dei processi Python owned e distinzione fra Stop Live Tracking e shutdown backend
- [x] Diagnostica Betfair — `DOC-019`, `SECURITY-001` e `SECURITY-003` risolti nel rispettivo finding; health, persistence integrity, Graph, runtime e output pubblico sono ora distinti e bounded; il serializer pubblico trasversale di `IMPL-007` resta un debito separato
- [-] Validation e rollback — runner, manifest e validazioni storiche sono stati separati, ma `DOC-021` resta **PARZIALE / ANCORA PERTINENTE** perché il runbook generale contiene ancora molti domini e responsabilità
- [-] Retention e cleanup — allow-list e percorso journal corretti (`DOC-020` risolto); `CLEANUP-002` **APERTO** perché l'apply non possiede maintenance authority, non si coordina con la writer authority e controlla ancora le porte fisse `3000/3001` invece delle porte runtime effettive
- [x] Validazione live Source Identity — `DOC-023` risolto; procedura corrente separata dal record storico, conservato sotto `docs/validations/` con scenari osservati, non eseguiti e limiti espliciti
- [x] Validazione live Betfair — report storico correttamente conservato sotto `docs/validations/` con osservazioni e limiti espliciti; non costituisce PASS corrente
- [x] Current State — `DOC-001`, `DOC-007` e `DOC-022` risolti; il documento corrente distingue base implementata, limiti, validazioni storiche, legacy e funzioni non presenti
- [~] Replay e backtesting — **FUTURA / NON IMPLEMENTATA**; classificazione ancora corretta e specifiche mantenute nei registri
- [~] Market Reactions Journal — **FUTURA / NON IMPLEMENTATA**; classificazione ancora corretta e nessun journal persistito presente nel sistema corrente

## B6 — Controlli trasversali — **AUDIT COMPLETATO; FOLLOW-UP APERTI**

- [x] Documenti owner — audit trasversale completato su API, moduli, frontend, Python, operations e roadmap; i finding ancora aperti restano registrati separatamente e la conclusione dell’audit non equivale alla loro risoluzione
- [-] Duplicazioni — classificazione completata; `DOC-018` e `DOC-023` sono **RISOLTI**, mentre `DOC-015` è **SOSTANZIALMENTE RISOLTO CON DUPLICAZIONI RESIDUE** e `DOC-021` resta **PARZIALMENTE RISOLTO / ANCORA PERTINENTE**
- [x] Contraddizioni — `DOC-020` e `DOC-022` **RISOLTI**; percorso del journal e separazione fra stato corrente, limiti, storico e funzioni non presenti sono ora coerenti negli owner correnti
- [x] Percorsi errati — `DOC-020` e `SECURITY-001` **RISOLTI NEL DIFETTO ORIGINARIO**; il journal usa `backend/match_history/.pending_commits/` e il boundary pubblico non espone più path/raw collector della network capture
- [-] Link documentali — checker corrente presente; PASS sulla HEAD attuale non rieseguito in questo ricontrollo
- [-] Test — gap originari ricontrollati: `TEST-001` **RISOLTO** con test dedicato al tick Betfair `status-only`; `TEST-002` **PARZIALMENTE RISOLTO** con lifecycle/abort/stale-response coverage ma senza copertura completa dello Start ambiguo; `TEST-003` **PARZIALMENTE RISOLTO** perché runner e manifest canonici esistono ma non costituiscono ancora l’inventario totale; `PYTHON-001` **PARZIALMENTE RISOLTO** perché le task network capture sono tracked/bounded/drained/cancelled ma manca il detach esplicito del listener CDP
- [-] Funzioni implementate non documentate/legacy — `CLEANUP-001` **PARZIALMENTE RISOLTO**; l’authority Source Identity frontend corrente è stata consolidata, ma restano helper mutanti legacy in `useMarketReactionEvidence()` da eliminare o riallineare
- [-] Coerenza Todo ↔ registri — `WORKFLOW-002` **RISOLTO COME MECCANISMO** tramite registry checker read-only con controlli di parità, duplicazioni, prefissi, stati e metadata; il checker è registrato nel validation manifest, ma un PASS sulla HEAD corrente non è stato rieseguito durante questo ricontrollo
- [x] Prefissi dei rilievi — `WORKFLOW-003` **RISOLTO**; `SECURITY-`, `PYTHON-` e gli altri prefissi correnti sono dichiarati nel metodo e verificabili dal registry checker

## Secondo audit del codice — Punti 1–7 — **AUDIT COMPLETATO; FOLLOW-UP APERTI**

- [x] Punto 1 — entry point, launcher, ownership e writer authority — audit completato; writer authority esclusiva implementata e coperta automaticamente (`IMPL-015`), con collaudo manuale multiprocesso ancora separatamente non eseguito
- [x] Punto 2 — tracking, Start/Stop, generazioni e callback tardive — audit completato; diverse protezioni di sessione sono state implementate, ma restano follow-up su handoff atomico del nuovo Start, command authority, cleanup/session controller e relativa copertura
- [x] Punto 3 — Betfair lifecycle, Graph, diagnostica, concorrenza e cleanup — audit completato; diversi finding sono stati risolti, ma restano aperti o parziali control plane Betfair globale, parità Preflight/runtime, CDP session-owned, acquisition provenance e alcuni lifecycle/cleanup
- [x] Punto 4 — storage, journal, documenti canonici e recovery — audit completato; writer authority, journal, recovery e varie protezioni sono presenti, ma restano follow-up su authority event-scoped cross-source, verifica canonica dei target, integrity aggregata, contratti di lettura e recovery control plane
- [x] Punto 5 — Evidence, provenance, eligibility e Market Reactions — audit completato; confini read-only, Source Identity e persistence gate sono verificati, ma restano aperti o parziali runner identity, eligibility tecnica, provenance temporale, comparabilità prezzi, coverage, Significant Flow e semantica uniforme delle finestre
- [x] Punto 6 — frontend, session controller, polling e integrity UI — audit completato; late-response protection e parte del wiring persistence sono implementati, ma restano follow-up su command/session authority, Start ambiguo, modalità statica dopo Stop, persistence UI completa, preflight input-bound e altri contratti frontend
- [x] Punto 7 — runner, fixture, sandbox, harness, ledger e test map — audit completato; runner e manifest canonici sono implementati, ma fixture catalog, sandbox condivisa, interaction harness completo, result ledger e inventario/test map esaustivi restano incompleti

## Runtime e validazione — **FOLLOW-UP DI VERIFICA PENDENTE**

- [x] `IMPL-015` — **COMPLETATA; WRITER AUTHORITY, ORDINE `ACQUIRE → RECOVERY → LISTEN` E DRAIN PRIMA DEL RELEASE SONO IMPLEMENTATI E COPERTI AUTOMATICAMENTE**
- [x] `IMPL-028` — **COMPLETATA; RUNNER E MANIFEST CANONICI DI VALIDAZIONE SONO IMPLEMENTATI**
- [ ] Collaudo manuale multiprocesso — **DA ESEGUIRE CON DUE BACKEND REALI CONCORRENTI SULLA STESSA STORAGE IDENTITY; IL TEST AUTOMATICO CON DUE AUTHORITY NON SOSTITUISCE QUESTO COLLAUDO**