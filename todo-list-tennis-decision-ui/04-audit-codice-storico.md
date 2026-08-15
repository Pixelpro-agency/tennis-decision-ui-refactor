> [Todo operativa](../todo-list-tennis-decision-ui.md)

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


