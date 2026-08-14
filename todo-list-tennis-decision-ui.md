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

# BLOCCO A — Stato corrente, fonti e inventario

## A1 — Fonti operative

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

## A3 — Struttura dei registri

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 7 moduli
- [x] ID globali mantenuti nei registri
- [x] `scripts/check_registry_consistency.py` continua a usare i Blocchi E/F come righe sintetiche canoniche
- [x] La Todo resta un singolo documento operativo
- [x] Nessuno split aggiuntivo introdotto per sola dimensione

## A4 — Regole documentali correnti

- [x] Documentazione tecnica canonica in Markdown ordinario
- [x] Nessun nuovo documento `.mdx` richiesto dalla struttura corrente
- [x] Stato corrente, storico, futuro e validation devono restare distinti
- [x] La documentazione canonica deve descrivere soltanto comportamento supportato dal codice corrente
- [x] Decisioni approvate ma non implementate restano nei registri
- [x] Le validations sono evidenze datate e non sostituiscono l’autorità del codice
- [x] `docs/archive/` è non canonico e non costituisce prova di implementazione
- [x] Cronologia e provenance restano affidate a Git e alle validation datate, non a stati inventati nella Todo

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

> Le checklist B1–B6 sono un **checkpoint storico dell’audit documentale**. Per lo stato attuale fanno fede le sintesi correnti dei Blocchi D/E/F e le rispettive schede owner.

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

> Le checklist C1–C13 sono un **checkpoint storico dell’audit del codice**. Conservano ciò che fu osservato in quel ciclo e non vengono promosse automaticamente a stato corrente.

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

> Le righe D1–D18 sintetizzano lo stato corrente delle task storiche senza trasferire automaticamente gli stati del checkpoint precedente.

## D1 — Ricontrollo D1–D18 sul codice corrente

- [x] D1 — Source Identity Task 1A — **CONFERMATA CON LIMITI; CORE PRESENTE, NUOVA SESSION AUTHORITY NON COMPLETA**
- [x] D2 — Source Identity frontend Task 1B — **CONFERMATA CON LIMITI; POLLING/GATE MIGLIORATI, CONTEXT AUTHORITY COMPLETA ANCORA APERTA**
- [x] D3 — Money Flow 2A — **CONFERMATA**
- [x] D4 — Money Flow 2B — **CONFERMATA**
- [x] D5 — Money Flow 2C — **CONFERMATA; IDENTITÀ RUNNER CANONICA NEL MONEY FLOW**
- [x] D6 — Money Flow 2D — **CONFERMATA**
- [x] D7 — Money Flow 2E — **CONFERMATA**
- [-] D8 — Validazione live Betfair 2F — **VALIDAZIONE STORICA; RESTA DISTINTA DAI COLLAUDI LIVE CORRENTI**
- [x] D9 — Runtime launcher Task 2 — **CONFERMATA CON LIMITI; WRITER AUTHORITY RAFFORZATA**
- [-] D10 — Stop globale Task 3a — **BACKEND PRESENTE; I CONSUMER LIVE FRONTEND VENGONO DISABILITATI VIA `sessionActive`, MA LA MODALITÀ `stopped_static` / SNAPSHOT FROZEN NON È COMPLETA**
- [x] D11 — Timeline store Task 4 — **CONFERMATA**
- [x] D12 — Commit journal Task 6 — **CONFERMATA CON LIMITI; JOURNAL PRESENTE MA ANCORA SOURCE-SCOPED**
- [x] D13 — Recovery — **CONFERMATA CON LIMITI; VERIFICA TARGET RAFFORZATA, CONTROL PLANE COMPLETO ASSENTE**
- [-] D14 — Persistence integrity — **BACKEND PRESENTE; FRONTEND/CROSS-LAYER ANCORA DA CHIUDERE**
- [x] D15 — Evidence degradation — **CONFERMATA CON LIMITI; PROVENANCE/ELIGIBILITY TEMPORALE APPROVATE NON SONO COMPLETE**
- [x] D16 — Context locale V1 — **CONFERMATA CON LIMITE LIVE RESIDUO SUL PBP**
- [-] D17 — Diagnostica Betfair — **HARDENING PUBBLICO MIGLIORATO; CAPTURE/CACHE E BOUNDARY COMPLETO RESTANO DA CHIUDERE**
- [x] D18 — Retention cache runtime — **CONFERMATA CON LIMITI; MAINTENANCE AUTHORITY E RETENTION DISTINTA RESTANO APERTE**

Regola: una regressione o un limite riapre soltanto il sotto-perimetro interessato; non annulla le parti già presenti.

## D2 — Priorità correnti non completate

### Priorità critica

- [ ] Session authority end-to-end (`IMPL-006`) — **PARZIALMENTE PRESENTE**
- [ ] Betfair runtime command authority (`IMPL-016`) — **NON COMPLETA**
- [-] Local control-plane boundary (`IMPL-017`) — **BIND/Host/Origin LOOPBACK PRESENTI; CONTRATTO COMPLETO NON CHIUSO**
- [ ] Event persistence authority (`IMPL-019`) — **NON COMPLETA**
- [-] Canonical document contract e verified recovery (`IMPL-020`) — **PRIMITIVE DI VERIFICA PRESENTI; CONTRATTO COMPLETO ASSENTE**
- [ ] Evidence temporal provenance e alignment (`IMPL-022`) — **NON COMPLETA**
- [-] Market Reaction eligibility e branch state (`IMPL-023`) — **PRIMITIVE QUALITÀ PRESENTI; CONTRATTO UNIFORME NON COMPLETO**
- [-] Frontend live-session controller (`IMPL-025`) — **TRACKING SESSION ID PRESENTE; OWNER/STATE MACHINE UNICI ASSENTI**
- [-] Polling runtime session-scoped (`IMPL-026`) — **ABORT/GENERATION GUARD PRESENTI; CONTRATTO COMUNE SESSIONKEY NON COMPLETO**
- [-] Frontend interaction test harness (`IMPL-030`) — **TEST DI LIFECYCLE PRESENTI; HARNESS APPROVATO NON COMPLETO**

### Priorità alta

- [ ] Betfair acquisition envelope e provenance (`IMPL-018`)
- [ ] Recovery control plane (`IMPL-021`)
- [ ] Runner temporal identity e price comparability (`IMPL-024`) — **FALLBACK NOME ANCORA PRESENTE IN EVIDENCE**
- [-] Market Reactions frontend view model (`IMPL-027`) — **VIEW MODEL MINIMO PRESENTE; CONTRATTO COMPLETO NON CHIUSO**
- [-] Fixture catalog e sandbox condivisa (`IMPL-029`) — **FIXTURE/TEMP LOCALI PRESENTI, CATALOGO CONDIVISO NON COMPLETO**
- [-] Validation result ledger (`IMPL-031`) — **ARTEFATTI JSON DEL RUNNER PRESENTI; LEDGER COMPLETO NON CHIUSO**
- [ ] Hardening diagnostico/network capture residuo
- [ ] Retention e cleanup offline residui

### Futuro o condizionato

- [~] Toolkit strategie offline (`IMPL-010`)
- [~] Ottimizzazione Betfair misurata (`IMPL-014`)

Nessuna voce viene selezionata automaticamente come prossima task.

---

# BLOCCO E — Rilievi registrati

> Il Blocco E è la sintesi corrente delle schede owner. `RISOLTO` indica che il rilievo non è più presente nello stato corrente; `PARZIALE` non chiude la scheda owner.
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

- [x] `CODE-001` — Strategy legacy attiva — **RISOLTO; ROUTE STRATEGY NON MONTATA E SURFACE LEGACY RIMOSSA, MARKET REACTIONS PRESERVATE**
- [-] `CODE-002` — Validatore Betfair non condiviso tra Preflight/Start/Login — **PARZIALMENTE RISOLTO; `classifyBetfairUrl` È CONDIVISO DA ROUTE BETFAIR, PARITÀ COMPLETA DA VERIFICARE**
- [x] `CODE-003` — Match `debug-last` sempre vuoto — **RIMOZIONE APPROVATA**
- [x] `CODE-004` — Strategy usa `localhost:3001` hardcoded — **ASSORBITO DALLA RIMOZIONE DELLA SURFACE STRATEGY**
- [ ] `CODE-005` — Script lint frontend pubblicato ma non eseguibile — **CONFERMATO; CORREZIONE GRADUALE APPROVATA**
- [ ] `CODE-006` — Preflight Graph divergente dal runtime — **CONFERMATO; PARITÀ APPROVATA**
- [ ] `CODE-007` — Probe CDP di `/latest` guidato dalla query — **ANCORA PRESENTE NEL CONTRATTO `/latest`; SESSION-OWNED NON COMPLETO**
- [ ] `RUNTIME-002` — Nuovo Start non invalida la sessione precedente — **CONFERMATO; PRIORITÀ CRITICA**
- [x] `RUNTIME-003` — Avvii manuali aggiravano l’autorità sulla persistenza — **COMPLETATO**
- [ ] `RUNTIME-004` — Riavvio dello stesso eventId contamina il gate nuovo — **CONFERMATO; PRIORITÀ CRITICA**
- [x] `RUNTIME-005` — `/untrack` legacy senza cleanup fisico — **RIMOZIONE APPROVATA**
- [ ] `RUNTIME-006` — Mismatch stale può fermare la sessione corrente — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `RUNTIME-007` — Promise Betfair riutilizzata tra sessioni logiche — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `RUNTIME-008` — Mismatch non termina fisicamente SofaScore — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `RUNTIME-009` — Stop pubblico nasconde cleanup parziale — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `RUNTIME-010` — Conferma Source Identity stale sul gate nuovo — **CONFERMATO; PRIORITÀ ALTA**
- [x] `RUNTIME-011` — `/api/betfair/odds` è un secondo ingresso mutante — **RISOLTO; ENDPOINT NON PRESENTE NEL ROUTER BETFAIR**
- [ ] `RUNTIME-012` — Manca autorità globale dei comandi Betfair — **CONFERMATO; PRIORITÀ CRITICA**
- [ ] `SECURITY-001` — Payload network capture oltrepassa il boundary pubblico — **CONFERMATO; PRIORITÀ ALTA**
- [ ] `SECURITY-002` — Cache URL-derived e priva di runtime/Graph identity — **CONFERMATO; PRIORITÀ ALTA**
- [-] `SECURITY-003` — Dettagli raw degli errori HTTP — **HARDENING PARZIALE PRESENTE; ERRORI BETFAIR BOUNDED, SERIALIZER PUBBLICO UNICO ANCORA ASSENTE**
- [-] `SECURITY-004` — Manca local control-plane boundary — **PARZIALMENTE RISOLTO; BIND LOOPBACK E MIDDLEWARE Host/Origin LOCALI PRESENTI, CONTRATTO COMPLETO IMPL-017 APERTO**
- [x] `SECURITY-005` — Flag Chromium indebolenti nel default — **RIMOZIONE APPROVATA SALVO NECESSITÀ DIMOSTRATA**
- [x] `DATA-001` — Volume runner sintetico `marketTotal/runnerCount` — **RISOLTO; NESSUN FALLBACK SINTETICO NEL CALCOLO MONEY FLOW**
- [ ] `DATA-002` — API/Graph senza acquisition timestamp e skew — **CONFERMATO; PRIORITÀ ALTA**
- [-] `FRONTEND-001` — Response Sofa/Betfair tardive o fuori ordine attraversano la sessione — **MITIGATO NEI POLLER CON GENERATION/ABORT/REQUEST GUARD; SESSION AUTHORITY END-TO-END RESTA APERTA**
- [-] `FRONTEND-002` — Persistence integrity frontend — **PARZIALMENTE RISOLTO; `buildPersistenceViewState` PROPAGA GLI STATI ALLA WORKSPACE E ALLA CARD BETFAIR, MA SIDEBAR/MODALE E STATO COMPLETO PER SETTORE RESTANO ASSENTI**
- [-] `FRONTEND-003` — Start fallito lascia sessione e polling nascosti — **MITIGATO: SESSIONE CONFERMATA E SHELL VENGONO PULITE; CLEANUP COMPENSATIVO/CONTROLLER UNICO NON COMPLETI**
- [ ] `FRONTEND-004` — Copy mojibake visibile — **CONFERMATO; TASK SEPARATA**
- [-] `FRONTEND-005` — Loop di polling orfani dopo cambio sessione/cleanup — **MITIGATO CON ABORT E GENERATION GUARD; COORDINAMENTO SESSION-SCOPED COMUNE NON COMPLETO**
- [ ] `FRONTEND-006` — Start/Stop concorrenti non serializzati — **CONFERMATO; PRIORITÀ ALTA**
- [-] `FRONTEND-007` — Stop Live e modalità statica dopo Stop — **I CONSUMER LIVE SOFA/BETFAIR/EVIDENCE/SOURCE IDENTITY VENGONO DISABILITATI VIA `sessionActive`; RESTA INCOMPLETA LA MODALITÀ STATICA/FROZEN DOPO STOP**
- [ ] `FRONTEND-008` — Indicatori live derivati dalla presenza del dato — **CONFERMATO; STATE MACHINE APPROVATA**
- [-] `FRONTEND-009` — Market Reactions UI/view model — **PARZIALMENTE RISOLTO; `available` È VALUTATO SOLO CON `=== true` E IL SOURCE MARKET È MAPPATO ESPLICITAMENTE, MA IL CONTRATTO COMPLETO PROVISIONAL/FINAL/WINDOW STATE NON È PRESENTE**
- [-] `FRONTEND-010` — Pending modal e session/context identity — **PARZIALMENTE RISOLTO; LA CONFERMA INVIA `trackingSessionId` E VERIFICA IL REFRESH SULLA STESSA SESSIONE, MA `sourceIdentityContextId` / REVISION OPACHI NON SONO PRESENTI**
- [ ] `FRONTEND-011` — Preflight results non legati agli input verificati — **CONFERMATO; FINGERPRINT APPROVATO**
- [ ] `FRONTEND-012` — Responsive strutturalmente assente — **LIMITE CONFERMATO; TASK SEPARATA**
- [ ] `PYTHON-001` — Task network capture non tracked/drained/cancelled — **CONFERMATO**
- [-] `CLEANUP-001` — Authority Source Identity legacy frontend — **CLEANUP PARZIALE; SURFACE STRATEGY RIMOSSA, VERIFICA FINALE SOURCE IDENTITY LEGACY ANCORA NECESSARIA**
- [ ] `CLEANUP-002` — Apply offline privo di maintenance authority e porte effettive — **CONFERMATO**
- [ ] `CLEANUP-003` — Log e network dump senza retention distinta — **CONFERMATO; PRIORITÀ MEDIO-ALTA**

## Storage, journal e recovery

- [ ] `STORAGE-001` — Journal source-scoped su shared history event-scoped — **CONFERMATO; IMPL-019 APPROVATA; PRIORITÀ CRITICA**
- [x] `STORAGE-002` — Target marked complete non verificato nei record parziali — **RISOLTO: TARGET COMPLETED VIENE VERIFICATO E RIAPERTO SE NON VALIDO**
- [-] `STORAGE-003` — Target verification limitata a JSON.parse — **PARZIALMENTE RISOLTO; SHAPE/IDENTITY/CONTENUTO ATTESO VERIFICATI, CONTRATTO SCHEMA/REVISION/DIGEST DI IMPL-020 NON COMPLETO**
- [ ] `STORAGE-004` — Journal invalido non attribuibile nascosto dall’integrity — **CONFERMATO; READ-ONLY INTEGRITY_UNKNOWN APPROVATO**
- [-] `SECURITY-006` — EventId e target non confinati dallo Storage — **MITIGAZIONE PARZIALE; TARGET ESPLICITO DEVE COINCIDERE COL TARGET RISOLTO, VALIDAZIONE BOUNDED/ROOT CONFINEMENT COMPLETI NON DIMOSTRATI**
- [ ] `STORAGE-005` — Shared history espone soltanto integrity SofaScore — **CONFERMATO; INTEGRITY AGGREGATA APPROVATA**
- [ ] `STORAGE-006` — Stato cross-source pubblicato prima del commit — **CONFERMATO; COMMITTED-ONLY APPROVATO**
- [x] `STORAGE-007` — Missing, corruzione e I/O failure collassano in `null` — **RISOLTO PER IL READ CONTRACT HISTORY: FOUND/MISSING/FAILED CON REASON DISTINTE; WRAPPER LEGACY `loadHistory` RESTA COMPATIBILE**
- [x] `STORAGE-008` — Duplicati evento risolti con `sort()[0]` — **RISOLTO: TARGET MULTIPLI PRODUCONO `ambiguous_storage_target` E FAIL-CLOSED**
- [ ] `STORAGE-009` — Nessuna policy persistita dei tentativi recovery — **CONFERMATO; IMPL-021 APPROVATA**
- [ ] `STORAGE-010` — Amplificazione full-document per ogni tick — **LIMITE CONFERMATO; MISURARE CON IMPL-013**
- [ ] `STORAGE-011` — Atomicità process-level non equivale a durabilità power-loss — **LIMITE CONFERMATO; DA MISURARE**
- [ ] `STORAGE-012` — Writer raw non journalizzati ancora esportati — **SUPERFICIE CONFERMATA; INVENTARIO E CHIUSURA APPROVATI**

## Evidence e verifiche di dominio

- [ ] `EVIDENCE-001` — Fallback nome nei confronti runner Field → Market — **DEC-010 APPROVATA; IMPLEMENTAZIONE MANCANTE**
- [ ] `EVIDENCE-002` — Tick degradati/status-only possono diventare nuovi eventi Market Reactions — **CONFERMATO; IMPL-023 APPROVATA; PRIORITÀ CRITICA**
- [ ] `EVIDENCE-003` — Attività matched generale classificata come market response — **CONFERMATO; SEMANTICA DA SEPARARE**
- [ ] `EVIDENCE-004` — Marker persistente confuso con nuova comparsa successiva — **CONFERMATO; TRANSITION GATE APPROVATO**
- [ ] `EVIDENCE-005` — `maxTickGapSec` non misura il source skew e timestamp futuri risultano freschi — **CONFERMATO; TEMPORAL ALIGNMENT CORRENTE NON IMPLEMENTA IL CONTRATTO ACQUIRED/RECORDED/SOURCE-SKEW DI IMPL-022**
- [ ] `EVIDENCE-006` — Confronti prezzo con source diverse e baseline non bounded — **CONFERMATO; SOURCE DIVERSE SONO ANCORA COMBINATE IN UNA LABEL E NON DEGRADATE DAL CONTRATTO IMPL-024**
- [ ] `EVIDENCE-007` — Qualità globale positiva con un solo runner affidabile — **CONFERMATO; COVERAGE ESPLICITA APPROVATA**
- [ ] `EVIDENCE-008` — Baseline Significant Flow/cluster e threshold non sufficientemente definiti — **LIMITE CONFERMATO; POLICY APPROVATA**
- [ ] `EVIDENCE-009` — `available` e stato delle finestre hanno semantiche non uniformi — **CONFERMATO; BRANCH STATE APPROVATO**
- [ ] `SOFA-001` — Ultimo game PBP considerato aperto — **DA VERIFICARE LIVE**

## Test e coperture richieste

> Le diciture storiche “PASSATO/COMPLETATO” restano riferite ai cicli registrati. La presenza di un file test non equivale da sola a un PASS.
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
- [-] `TEST-013` — Endpoint `/odds` rimosso, letture preservate — **CONDIZIONE DI CODICE VERIFICATA; TEST-ID DEDICATO NON RICONCILIATO**
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
- [-] `TEST-026` — Read status Storage distinti — **COPERTURA MIRATA PRESENTE IN `storage/discoveryAndRead.test.mjs`; MAPPATURA TEST-ID CANONICA DA RICONCILIARE**
- [-] `TEST-027` — Duplicate event documents bloccanti — **COPERTURA MIRATA PRESENTE IN `storage/discoveryAndRead.test.mjs`; MAPPATURA TEST-ID CANONICA DA RICONCILIARE**
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
- [-] `TEST-046` — Response Sofa/Betfair vecchie o fuori ordine — **COPERTURA DI LIFECYCLE PRESENTE IN `pollingLifecycle.test.mjs`; CONTRATTO SESSIONE COMPLETO NON CHIUSO**
- [-] `TEST-047` — Cleanup durante fetch senza timeout ricreato — **COPERTURA PARZIALE PRESENTE NEL LIFECYCLE DEI POLLER; REQUIREMENT COMPLETO DA RICONCILIARE**
- [ ] `TEST-048` — Stop completo: tutti i poller sospesi e snapshot frozen — **MANCANTE**
- [ ] `TEST-049` — Stop parziale visibile in UI — **MANCANTE**
- [-] `TEST-050` — Persistence UI locale/globale e snapshot degraded — **COPERTURA PARZIALE PRESENTE IN `persistenceViewState.test.mjs`; IL REQUIREMENT UI COMPLETO NON È CHIUSO**
- [-] `TEST-051` — EventId/trackingSessionId dalla risposta Start — **COPERTURA PARZIALE: `useLiveTrackingActions.test.mjs` VERIFICA `trackingSessionId`; EVENT ID E RISPOSTA START END-TO-END NON SONO COPERTI**
- [ ] `TEST-052` — Nuovo Source Identity context con stessi nomi — **MANCANTE**
- [ ] `TEST-053` — Preflight input-bound e response stale — **MANCANTE**
- [-] `TEST-054` — Market Reactions branch `available:false` — **TEST MIRATO PRESENTE IN `marketReactionViewModel.test.mjs`; REQUIREMENT COMPLETO NON CHIUSO**
- [-] `TEST-055` — Mapping schema Market Reactions reale — **TEST MIRATO PRESENTE IN `marketReactionViewModel.test.mjs`; IL CONTRATTO COMPLETO IMPL-027 RESTA APERTO**
- [ ] `TEST-056` — Nessun falso stato live/connected/polling active — **MANCANTE**
- [ ] `TEST-057` — Sessione Sofa-only senza polling Betfair — **MANCANTE**
- [-] `TEST-058` — StrictMode con una sola catena polling — **COPERTURA PARZIALE PRESENTE CON `React.StrictMode`; HARNESS CANONICO IMPL-030 NON COMPLETO**
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
- [-] `TEST-071` — Frontend harness monta hook in StrictMode con fake timer — **STRICTMODE/LIFECYCLE PRESENTI CON `react-test-renderer`; STACK APPROVATO VITEST/JSDOM/RTL E FAKE TIMER NON COMPLETO**
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

> Stato sintetico corrente. Una IMPL può avere primitive già presenti senza essere completa nel contratto approvato.

- [x] `IMPL-001` — Link checker Markdown/MDX — **IMPLEMENTATA**
- [x] `IMPL-002` — Inventario endpoint — **CONSIGLIATA; NON PROMOSSA A COMPLETATA**
- [x] `IMPL-003` — Matrice test ↔ modulo ↔ documento — **NECESSARIA; PARZIALE**
- [x] `IMPL-004` — Archivio collaudi storici — **COMPLETATA; VALIDATIONS SEPARATE PRESENTI**
- [x] `IMPL-005` — Coerenza Todo ↔ registri — **IMPLEMENTATA; CHECKER READ-ONLY PRESENTE**
- [-] `IMPL-006` — Session authority end-to-end — **PARZIALMENTE PRESENTE; NON COMPLETA**
- [-] `IMPL-007` — Serializer pubblico diagnostica/errori — **HARDENING PARZIALE; SERIALIZER UNICO ASSENTE**
- [x] `IMPL-008` — Harness offline persistence/recovery — **CONSIGLIATA; PROCEDURA UNICA NON COMPLETA**
- [-] `IMPL-009` — Adapter persistence + stati locali + pannello sidebar — **PARZIALMENTE IMPLEMENTATA; ADAPTER CENTRALE, BANNER GLOBALE E STATO LOCALE BETFAIR SONO PRESENTI, SIDEBAR/MODALE E COPERTURA COMPLETA PER SETTORE NO**
- [~] `IMPL-010` — Toolkit autonomo studio strategie offline — **FUTURO**
- [x] `IMPL-011` — Authority di manutenzione cleanup offline — **NECESSARIA; APERTA**
- [-] `IMPL-012` — Fixture versionate e replay offline — **NECESSARIA; FIXTURE MIRATE PRESENTI, CATALOGO/REPLAY COMPLETI ASSENTI**
- [x] `IMPL-013` — Baseline end-to-end e freshness — **NECESSARIA PRIMA DI OTTIMIZZARE; APERTA**
- [~] `IMPL-014` — Ottimizzazione Betfair misurata e reversibile — **FUTURO**
- [x] `IMPL-015` — Writer authority esclusiva `match_history` — **COMPLETATA**
- [x] `IMPL-016` — Betfair runtime command authority — **APPROVATA; NON COMPLETA**
- [-] `IMPL-017` — Local control-plane boundary — **PARZIALMENTE IMPLEMENTATA; LOOPBACK + Host/Origin PRESENTI**
- [x] `IMPL-018` — Betfair acquisition envelope e provenance — **APPROVATA; NON ASSUNTA COMPLETA**
- [x] `IMPL-019` — Event persistence authority — **APPROVATA; NON COMPLETA, JOURNAL ANCORA SOURCE-SCOPED**
- [-] `IMPL-020` — Canonical document contract e verified recovery — **PARZIALMENTE PRESENTE; VERIFICA TARGET/READ CONTRACT RAFFORZATI, SCHEMA/REVISION/DIGEST COMPLETI ASSENTI**
- [x] `IMPL-021` — Recovery control plane — **APPROVATA; NON COMPLETA**
- [x] `IMPL-022` — Evidence temporal provenance and alignment policy — **APPROVATA; NON COMPLETA**
- [-] `IMPL-023` — Market Reaction eligibility e branch state — **PRIMITIVE QUALITÀ PRESENTI; CONTRATTO UNIFORME NON COMPLETO**
- [x] `IMPL-024` — Runner temporal identity e price comparability — **APPROVATA; NON COMPLETA, FALLBACK NOME ANCORA PRESENTE**
- [-] `IMPL-025` — Frontend live-session controller — **PARZIALMENTE PRESENTE; `trackingSessionId` USATO MA NESSUNA STATE MACHINE OWNER UNICA**
- [-] `IMPL-026` — Polling runtime session-scoped — **PARZIALMENTE PRESENTE; GENERATION/ABORT GUARD IMPLEMENTATE PER HOOK, PRIMITIVE COMUNE/SESSIONKEY NON COMPLETE**
- [-] `IMPL-027` — Market Reactions frontend view model — **PARZIALMENTE IMPLEMENTATA; STRICT AVAILABILITY E MAPPING MARKET SOURCE PRESENTI, PAGE/BRANCH STATE COMPLETO NON CHIUSO**
- [x] `IMPL-028` — Manifest e runner canonico di validazione — **IMPLEMENTATA; RUNNER, MANIFEST E SELF-TEST PRESENTI**
- [-] `IMPL-029` — Fixture catalog e sandbox condivisa — **PARZIALMENTE PRESENTE; TEMP/FIXTURE LOCALI, CATALOGO CONDIVISO NON COMPLETO**
- [-] `IMPL-030` — Frontend interaction test harness — **PARZIALMENTE PRESENTE; TEST LIFECYCLE/STRICTMODE ESISTONO, STACK APPROVATO NON COMPLETO**
- [-] `IMPL-031` — Validation result ledger e artefatti JSON — **PARZIALMENTE PRESENTE; RESULT JSON DEL RUNNER ESISTE, LEDGER COMPLETO NON CHIUSO**
- [x] `IMPL-032` — Pipeline di migrazione documentale per batch — **COMPLETATA NEL CICLO DOCUMENTALE**

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
- [x] Registry checker ricorsivo presente
- [x] I Blocchi E/F restano la superficie sintetica consumata dal checker
- [x] La Todo resta una vista unica: **nessuna modularizzazione aggiuntiva necessaria per questo documento**
- [x] Nessuno split della Todo introdotto per sola dimensione
- [x] `docs/archive/` resta separato dalla documentazione canonica
- [x] `docs/validations/` resta separato dai runbook e dagli owner tecnici
- [x] Pulizie o consolidamenti non devono cancellare automaticamente materiali dichiarati archive né promuoverli a stato corrente

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

- [x] Audit documentazione storico completato
- [x] Audit codice storico completato
- [x] Struttura B/C conservata come checkpoint storico
- [x] Stato corrente e checkpoint storici mantenuti distinti
- [x] Provenance del recupero documentale mantenuta distinta dallo stato tecnico corrente
- [x] Registri modulari e checker read-only individuati
- [-] Documentazione canonica corrente presente — **LA VALIDITÀ RESTA DISTRIBUITA TRA I RISPETTIVI OWNER**
- [-] Prima serie di correzioni tecniche successive all’audit — **ALCUNE PRIMITIVE SONO PRESENTI, LE MACRO-IMPL CRITICHE RESTANO IN PARTE APERTE**
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
