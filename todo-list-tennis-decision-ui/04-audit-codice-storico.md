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
- [x] Test launcher — **validation automatica offline storica del 10 agosto 2026: 237 test passati, 1 skipped; esito non proiettato automaticamente sulla HEAD corrente**

## C2 — Server e runtime backend **PARZIALE**

- [x] Bootstrap server — writer authority → recovery → listener implementati e coperti
- [x] Recovery iniziale — eseguita prima del listener; recovery fatal blocca il bootstrap
- [x] Health — contratto e test HTTP reale verificati
- [x] Shutdown backend — drain tracker, cleanup Python e release condizionato della writer authority implementati
- [x] Registry Python — ruoli, generation, ownership, termination bounded e snapshot implementati
- [x] Runtime logger — logging strutturato, bounded e allow-listed implementato
- [x] Redazione runtime — URL, credenziali/token, header sensibili e path redatti nel boundary del runtime logger
- [-] Test runtime — copertura dedicata presente per server e moduli runtime, ma il validation manifest canonico registra soltanto una parte della superficie e resta non esaustivo

## C3 — Router Match **PARZIALE**

- [x] Endpoint inventariati — superficie corrente del router identificata
- [-] Tracking — implementato con `trackingSessionId` e guardie stale; restano l'handoff fisico atomico fra Start successivi e l'autorità globale tracking ↔ login/runtime Betfair
- [-] Untrack — endpoint deprecato e logicamente idempotente ancora presente; rimuove tracker/gate ma non esegue il cleanup fisico di `/stop`; `RUNTIME-005` resta aperto
- [-] Stop globale — stop logico e cleanup Python tracking implementati e il partial cleanup produce `ok:false`, ma il contratto pubblico completo `status` / `logicalStop` / `physicalCleanup` resta parziale
- [x] Analisi — compute-only, Local Context ed error mapping pubblico implementati
- [-] History — lettura implementata; integrity ancora limitata alla source Sofa sulla history condivisa
- [x] Timeline — lettura SofaScore e integrity Sofa implementate
- [-] Source Identity status — endpoint implementato, ma la response status non espone `trackingSessionId` e il polling relativo resta eventId-scoped; il frontend riceve comunque `trackingSessionId` dalla risposta Start
- [-] Integrity — normalizzazione e `409` su `partial_persistence`/`recovery_failed` implementati; restano shared-history cross-source e collasso degli stati journal non supportati
- [ ] Debug-last — `/debug-last` e `lastDebugData` restano presenti senza un producer reale; rimozione ancora aperta in `CODE-003`
- [-] Test — copertura dedicata ampia presente, ma il validation manifest non registra ancora l'intera superficie Match e restano gap end-to-end su session/command authority

## C4 — Router Betfair **PARZIALE**

- [x] Latest — read model, health, Money Flow e integrity Betfair implementati
- [x] JSON — timeline Betfair read-only e integrity implementate
- [x] Odds — endpoint legacy rimosso; nessun endpoint Betfair HTTP corrente esegue acquisizione odds come side effect
- [x] Login window — validazione, login-only, lifecycle, reuse session-safe e cleanup implementati
- [x] Log — lettura bounded, redatta e `no-store` implementata
- [x] CDP — probe diagnostico read-only e bounded in `/latest`; la session-owned CDP identity resta separatamente aperta in `CODE-007` / `TEST-014`
- [-] Runtime conflict — controlli locali presenti sia per tracking sia per login, ma manca ancora un'autorità Betfair globale comune che arbitri i due lifecycle
- [x] Integrity — contratto Betfair source-specific implementato con `getMatchPersistenceIntegrity(eventId, 'betfair')`; `DOC-010` è risolto, mentre i limiti globali sui journal invalidi restano separati in `STORAGE-004`
- [-] Test — copertura mirata ampia presente, ma registrazione nel validation manifest non esaustiva e manca ancora la copertura del conflitto globale tracking ↔ login

## C5 — Router Evidence **PARZIALE**

- [x] Latest — read-only su timeline persistite, confirmation state e persistence integrity
- [x] Conferma — gate-authoritative e vincolata alla sessione corrente
- [x] Fallback persistito — ramo legacy ancora presente nel codice ma non raggiungibile nel contratto gate-authoritative corrente
- [x] Revoca — operazione sul confirmation store applicabile al contesto persistito
- [x] Side effect — una conferma `pending` valida può attivare il bootstrap canonico e la persistenza dei campioni buffered
- [x] Errori — mapping HTTP pubblico e bounded implementato per latest, conferma e revoca
- [-] Test — copertura specifica presente e `evidenceRoute.test.mjs` registrato nel manifest, ma il route test usa handler diretti invece di HTTP reale e la superficie Evidence completa non è registrata esaustivamente
- [x] Allineamento documentale — contratto canonico Evidence riallineato al comportamento corrente; `DOC-003` risolto

## C6 — Strategy e Preflight **PARZIALE**

- [x] Strategy — superficie Strategy rimossa dal runtime e dal frontend attivi; Market Reactions preservate (`CODE-001`, `DEC-008`)
- [x] Market Reactions / Evidence — superficie corrente preservata e alimentata dal Match Evidence Snapshot
- [x] Preflight CDP — validazione locale e probe bounded implementati
- [x] Preflight Sofa URL — classificazione URL ed estrazione event ID implementate
- [-] Preflight Betfair URL — classificatore condiviso implementato e `DOC-013` risolto, ma il Preflight richiede `eventId` mentre Start/Login applicano contratti diversi; `CODE-002` resta parziale
- [-] Preflight Graph URL — validazione e test presenti, ma Graph appartenenti a market differenti possono ancora produrre `ok:true` con `sameMarket:false`; `CODE-006` resta parziale
- [-] Test — copertura Preflight/Graph dedicata presente, ma registrazione nel validation manifest non esaustiva; i gap `CODE-002` e `CODE-006` impediscono una chiusura completa

## C7 — SofaScore **PARZIALE**

- [x] Scheduler — scheduling e protezione dagli update concorrenti implementati
- [x] Update Sofa — caricamento, session guard, normalizzazione, gate e persistenza implementati
- [x] Normalizzazione — snapshot canonico e PBP normalizzato implementati
- [x] Point-by-point — decoder fail-closed e finestra degli ultimi 3 game completati implementati; `SOFA-001` resta separatamente aperto come validazione live della semantica `currentGame`
- [x] Local Context — contratto v1, point share, recent window, comparison e degradazioni implementati
- [x] History — writer Sofa canonico e journalizzato implementato
- [x] Timeline — timeline SofaScore canonica integrata nello stesso commit
- [x] Gate — `trackingSessionId`, buffering, bootstrap, recording, mismatch e stale-session guard implementati
- [-] Stop e mismatch — cleanup fisico SofaScore/Betfair presente, ma resta globale e asincrono anziché atomico/session-owned; anche la rappresentazione pubblica del cleanup parziale non espone ancora integralmente il contratto target
- [-] Test — copertura ampia presente; sostituzione atomica della sessione backend (`TEST-005`) e cleanup mismatch session-owned (`TEST-007`) restano parzialmente coperti

## C8 — Betfair **PARZIALE**

- [-] Fetch — pipeline API/Graph e session identity implementate; manca ancora un acquisition envelope canonico con provenance temporale per API e Graph, timestamp per fase e controllo dello skew (`DATA-002`)
- [-] Scraper lifecycle — lifecycle per-key e `trackingSessionId` implementati; manca ancora un'autorità Betfair globale comune fra tracking e login (`RUNTIME-012`), mentre il detach esplicito del listener network capture CDP resta separatamente parziale in `PYTHON-001`
- [x] Processor — classificazione tecnica, runner state pending e promozione soltanto dopo persistence canonica implementati
- [x] Timeline — snapshot Betfair canonico e persistence journalizzata implementati
- [x] Ladder — ladder, source identity e book depth preservati nel runner snapshot canonico
- [x] Graph health — classificazione, diagnostica, failure counters e stato ladder implementati
- [x] Matched volume — volume runner osservato preservato; fallback sintetico `marketTotal / runnerCount` rimosso (`DATA-001`)
- [x] Cache — chiave SHA-256 su URL normalizzata + request identity + schema e payload redatto; `SECURITY-002` risolto
- [-] Runtime health — health, runtime timestamps e freshness del tick canonico implementati, ma la freshness resta limitata dall'assenza dei timestamp di acquisizione API/Graph di `DATA-002`
- [x] Login-only — percorso dedicato implementato senza eseguire lo scrape ordinario
- [-] Test — copertura Betfair ampia presente, ma restano gap legati ad acquisition provenance, global Betfair authority e lifecycle ancora aperti; registrazione canonica della superficie test non esaustiva

## C9 — Storage e recovery **PARZIALE**

- [x] History storage — read result strutturati, discovery ambigua fail-closed e writer canonico implementati
- [x] Timeline store — read result strutturati, discovery source-specific e writer canonico implementati
- [x] Commit ID — ID canonico source-prefixed e bounded implementato
- [x] Journal store — pending journal, stato per documento, verifica e cleanup implementati
- [x] Atomic write — implementato come file temporaneo + rename; atomicità process-level, senza contratto di durabilità `fsync`
- [x] Recovery bootstrap — eseguita prima del listener backend
- [x] Repair Sofa — repair journalizzato SofaScore implementato
- [x] Repair Betfair — repair journalizzato Betfair implementato
- [-] Integrity — source-specific integrity implementata, ma la shared history non possiede ancora un aggregato Sofa + Betfair + read status e i journal invalidi non attribuibili non producono un control plane globale
- [-] Failure mode — esiti strutturati presenti per journal, recovery e loader interni, ma invalid/read/ambiguous storage failure non sono ancora propagati end-to-end in modo uniforme alle API e ai writer
- [-] Test — copertura unit/integration ampia presente, ma il profilo canonico `persistence` resta incompleto/disabilitato e la superficie persistence non è ancora integralmente chiusa nel validation runner

## C10 — Evidence e Source Identity **PARZIALE**

- [x] Match Evidence builder — pipeline read-only da timeline persistite, active Betfair epoch, Source Identity e integrity implementata
- [-] Data quality — freshness, Graph Health, ladder, Money Flow e tradability implementati; resta incompleta la coverage esplicita dei due runner e manca un eligibility gate tecnico uniforme per tutti i detector
- [x] No-trade reasons — degradazioni su live/freshness/book/ladder/alignment/persistence implementate
- [x] Name matching — normalizzazione e matching Source Identity implementati; il distinto fallback nome nei confronti temporali Market Reactions resta aperto in `EVIDENCE-001`
- [x] Confirmation store — archivio contestuale, validazione, lookup/revoca e scrittura atomica implementati
- [x] Effective identity — identità automatica, active epoch e confirmation persistita vengono composte nel contesto corrente
- [-] Market Reactions — implementate, ma restano limiti su runner identity, eligibility tecnica, semantica delle osservazioni, temporal provenance, comparabilità dei prezzi, coverage e availability/window state
- [x] Causality claim — `causalityClaimed:false` e interpretazione di sola prossimità temporale preservati
- [x] Degradazione persistence incomplete — Evidence cross-source e Market Reactions vengono bloccate quando l'integrity è `partial_persistence` o `recovery_failed`
- [-] Test — copertura ampia presente, ma restano test mancanti/parziali direttamente collegati ai finding Market Reactions e ai contratti ancora non implementati

## C11 — Frontend **PARZIALE**

- [x] App composition — composizione modulare corrente verificata; i residui di authority appartengono al controller della sessione e non alla struttura dei componenti
- [-] Session state — sessione accettata e `trackingSessionId` presenti, ma lo stato resta distribuito; manca una frontend session authority unica con command identity e l'`eventId` downstream continua a essere derivato da `confirmedUrl` anziché dalla risposta Start
- [-] Preflight — controlli presenti, ma le response non sono legate a generation/request identity o fingerprint/revision degli input e possono diventare stale
- [-] Start tracking — `sessionActive` viene attivata soltanto dopo una risposta backend valida e il failure cleanup frontend ordinario è implementato; restano command serialization/identity, cleanup compensativo dello Start ambiguo e uso autoritativo di `response.eventId`
- [-] Stop tracking — Stop backend globale e disattivazione dei poller tramite `sessionActive` implementati, ma il comando frontend invia soltanto `eventId`, senza session/command identity, e il dettaglio del cleanup parziale non viene rappresentato integralmente in UI
- [x] Bootstrap dashboard — bootstrap vincolato alla `trackingSessionId` accettata e protezione dall'utilizzo dei dati della sessione precedente implementati
- [x] Sofa polling — generation, request ID, `AbortController`, cleanup, session switching e protezione dalle response tardive implementati
- [x] Betfair polling — lifecycle isolato implementato; non parte senza configurazione Betfair attiva e conserva separatamente persistence integrity/read state
- [-] Evidence polling — lifecycle asincrono isolato implementato, ma il poller resta attivo per tutta la sessione indipendentemente dalla vista Market Reactions e il hook conserva ancora metodi legacy di confirm/revoke Source Identity non usati dalla authority globale corrente
- [-] Source Identity UI — polling e conferma `trackingSessionId`-aware implementati; la pending key locale resta basata su eventId e nomi e non include session/context/epoch identity
- [-] Betfair health — transizioni, toast e audio implementati; memoria di health, transizioni e alert non è ancora esplicitamente session-scoped
- [-] View model — current/last-known separati e `persistenceViewState` propagato alla dashboard, ma la superficie globale resta incompleta: Sidebar/modal non consumano ancora uniformemente persistence/session state (`IMPL-009`)
- [x] Money Flow — mapping `selectionId`, griglia condivisa, valori null/invalid e grafico neutro verificati
- [x] Match Context — mapping, contratto versionato e validazione di coerenza verificati
- [-] Market Reactions — availability, persistence e stati base UI gestiti; il view model `IMPL-027` resta parziale e parte del mapping/branch state non è ancora uniforme
- [x] Strategy UI — superficie Strategy rimossa; Market Reactions preservate
- [ ] Piccole correzioni/mojibake — ancora presente almeno `ModalitÃ  sessione Betfair`
- [ ] Responsive completo — contratto responsive desktop/tablet/mobile e relativo smoke test ancora non implementati
- [x] Build — `vite build` pubblicata e registrata come entry abilitata nei profili `frontend` e `full-offline` del validation manifest
- [-] Lint — script e dipendenze ESLint presenti, ma configurazione repository-owned utilizzabile ancora assente
- [-] Test — runner canonico e copertura polling/lifecycle/StrictMode presenti, ma interaction harness generale e registrazione esaustiva della superficie frontend restano incompleti

## C12 — Python e script **PARZIALE**

- [x] SofaScore CLI — CLI modulare, validazione input, stdout JSON, cache e failure contract implementati
- [x] SofaScore browser — persistent browser, fallback headless → headed, fetch dal page context e timeout bounded implementati
- [x] Betfair CLI — modalità persistent/CDP, validazione CDP, Graph URL, network capture, cache e login-only implementati
- [x] Persistent profile — persistent context owned e chiuso dal percorso che lo crea
- [x] CDP mode — endpoint locale validato, context esistente riutilizzato e non chiuso dal percorso scraper
- [x] Graph URL — parser canonico, market/selection identity, mapping e duplicati verificati
- [-] Network capture — collector bounded, task possedute/drenate/cancellate e summary pubblico redatto implementati; resta assente il detach esplicito del listener `response`, in particolare rilevante nel percorso CDP che lascia il context aperto (`PYTHON-001`)
- [x] Diagnostic redaction — URL, header, payload, testo, token e path redatti; output diagnostici bounded/redatti
- [x] Cache — cache SofaScore e Betfair con TTL breve e chiavi SHA-256; Betfair include request identity e redazione
- [x] Wrapper root — `scraper.py` e `betfair_scraper.py` sono wrapper sottili dei CLI modulari
- [-] Cleanup runtime cache — utility allow-list, dry-run/apply, retention e test dedicati presenti, ma l'apply non possiede maintenance authority né coordinamento con writer authority e controlla ancora le porte fisse 3000/3001; log e network dump restano fuori dalla retention (`CLEANUP-002`, `CLEANUP-003`)
- [x] PowerShell — helper CDP con contratto JSON/exit code stabile e helper backend di sviluppo presenti
- [-] Test Python — profilo canonico presente e più suite registrate, ma il manifest non enumera ancora tutti i test Python esistenti

## C13 — Cleanup **PARZIALE**

- [-] File legacy — molto legacy è già stato rimosso, ma restano residui concreti; `scripts/sofa-pipeline-smoke.mjs` è incompatibile con la pipeline corrente
- [-] Codice morto — la vecchia surface `SourceIdentityControls` e i service esclusivi sono stati rimossi; `useMarketReactionEvidence` conserva ancora helper mutanti legacy di confirm/revoke non usati dalla composizione attiva (`CLEANUP-001`)
- [ ] File duplicati — inventario e bonifica repository-wide non ancora verificati
- [ ] Test obsoleti — bonifica globale non ancora verificata e validation manifest non esaustivo
- [ ] Script non usati — resta almeno `scripts/sofa-pipeline-smoke.mjs`, che dipende da path e codice Momentum non più appartenenti alla pipeline corrente
- [ ] Import non usati — bonifica non completata; presente almeno `urlsplit` inutilizzato in `scrapers/betfair/browser_session.py`
- [-] Componenti non raggiungibili — `SourceIdentityControls` è stato rimosso; la verifica generale della reachability frontend non è ancora completa
- [-] Route non consumate — restano superfici legacy/compatibilità come `/untrack`, `/snapshot` e `/debug-last`
- [-] Log o debug superati — hardening e redazione diagnostica sono sostanzialmente implementati, ma resta almeno la superficie legacy `/debug-last`; retention di log e network dump resta separatamente aperta in `CLEANUP-003`