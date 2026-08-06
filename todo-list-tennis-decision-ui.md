# Tennis Decision UI — Todo list e stato operativo

## Scopo

Questa Todo è la vista sintetica unica della revisione di **Tennis Decision UI**.

Serve a:

- mostrare lo stato corrente del progetto;
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
SHA checkpoint registri: aefc0ba5894d8fca60e5811088fede3ebbfde98a
Data del checkpoint: 2026-08-06
```

- [x] Branch locale e `origin/main` allineati sul commit `aefc0ba`
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

# BLOCCO A — Stato corrente e fonti

## A1 — Fonti operative

- [x] [Indice root](./implementazioni-tennis-decision-ui.md)
- [x] [Indice dei registri](./implementazioni/README.md)
- [x] [Metodo e stati](./implementazioni/00-metodo-e-stati.md)
- [x] [Decisioni dell’utente](./implementazioni/99-decisioni-utente.md)
- [x] [Documentazione canonica](./docs/tennis-decision-ui/index.md)
- [x] [Validazioni correnti](./docs/validations/)

## A2 — Struttura dei registri

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 7 moduli
- [x] Percorsi root `02`, `03` e `06` mantenuti come indici stabili
- [x] Registry checker aggiornato a `implementazioni/**/*.md`
- [x] Test dedicato alla discovery annidata presente
- [x] Nessun secondo monolite canonico mantenuto

## A3 — Regole documentali correnti

- [x] Documenti tecnici in Markdown ordinario
- [x] Nessun nuovo documento `.mdx`
- [x] Nessun frontmatter obbligatorio
- [x] Documentazione canonica limitata al comportamento reale
- [x] Futuro, decisioni e implementazioni mancanti mantenuti nei registri
- [x] Storico affidato ai commit Git
- [x] Duplicati documentali e fonti assorbite rimossi

---

# BLOCCO B — Lavoro completato

## B1–B6 — Audit della documentazione

- [x] B1 — ingresso, indice, repository map, boundaries e lifecycle
- [x] B2 — API Match, Betfair, Evidence, Strategy, Preflight e Runtime Health
- [x] B3 — moduli SofaScore, Betfair, Storage ed Evidence
- [x] B4 — frontend, session shell, polling e package Python
- [x] B5 — operations, validation, cleanup e roadmap
- [x] B6 — owner, duplicazioni, link, test, legacy e coerenza registri

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

# BLOCCO C — Ricontrollo task D1–D18

- [x] D1 — Source Identity Task 1A — **CONFERMATA CON LIMITI**
- [x] D2 — Source Identity frontend Task 1B — **CONFERMATA CON LIMITI**
- [x] D3 — Money Flow 2A — **CONFERMATA**
- [x] D4 — Money Flow 2B — **CONFERMATA**
- [x] D5 — Money Flow 2C — **CONFERMATA**
- [x] D6 — Money Flow 2D — **CONFERMATA**
- [x] D7 — Money Flow 2E — **CONFERMATA**
- [x] D8 — Validazione live Betfair 2F — **CONFERMATA CON LIMITI**
- [x] D9 — Runtime launcher Task 2 — **CONFERMATA CON LIMITI; NON RIAPRIRE SENZA DISCREPANZA**
- [x] D10 — Stop globale Task 3a — **CONFERMATA**
- [x] D11 — Timeline store Task 4 — **CONFERMATA**
- [x] D12 — Commit journal Task 6 — **CONFERMATA**
- [x] D13 — Recovery — **CONFERMATA CON LIMITI**
- [-] D14 — Persistence integrity — **DA RIAPRIRE SOLO FRONTEND/CROSS-LAYER**
- [x] D15 — Evidence degradation — **CONFERMATA**
- [x] D16 — Context locale V1 — **CONFERMATA CON LIMITI**
- [-] D17 — Diagnostica Betfair — **DA RIAPRIRE SOLO HARDENING PUBBLICO/CAPTURE**
- [x] D18 — Retention cache runtime — **CONFERMATA CON LIMITI**

```txt
CONFERMATA: 9
CONFERMATA CON LIMITI: 7
DA RIAPRIRE: 2
```

Regola: riaprire soltanto il sotto-perimetro difettoso, senza annullare le parti già corrette.

---

# BLOCCO D — Priorità operative

## D1 — Priorità critica

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

## D2 — Priorità alta

- [ ] Betfair acquisition envelope e provenance (`IMPL-018`)
- [ ] Recovery control plane (`IMPL-021`)
- [ ] Runner temporal identity e price comparability (`IMPL-024`)
- [ ] Market Reactions frontend view model (`IMPL-027`)
- [ ] Fixture catalog e sandbox condivisa (`IMPL-029`)
- [ ] Validation result ledger (`IMPL-031`)
- [ ] Hardening diagnostico e network capture
- [ ] Retention e cleanup offline

## D3 — Futuro o condizionato

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
---

# BLOCCO G — Workflow operativo

## Ruoli

- [x] Chat Analisi — analisi, decisioni, priorità e prompt esecutivi
- [x] Chat Esecutore — modifica controllata con massimo tre tentativi
- [x] Desktop Esecutore — applicazione locale e raccolta output
- [x] Desktop Collaudatore — verifica separata quando necessaria

## Regole

- [x] Contesto minimo sufficiente
- [x] File modificabili e consultabili distinti
- [x] Nessun dato sensibile nei report
- [x] Massimo tre tentativi ragionati
- [x] Report finale obbligatorio
- [x] Commit e push riservati all’utente
- [x] Test e collaudi dichiarati soltanto con output verificabile

---

# BLOCCO H — Modularizzazione e pulizia

- [x] Soglia di modularizzazione raggiunta
- [x] Audit documentazione diviso per fase
- [x] Audit codice diviso per dominio
- [x] Implementazioni proposte divise per area
- [x] ID globali preservati
- [x] Link relativi verificati
- [x] Registry checker ricorsivo verificato
- [x] Nessun artefatto temporaneo di migrazione mantenuto
- [x] Nessuna copia puramente storica mantenuta fuori da Git

Dopo il completamento di una migrazione devono restare soltanto i file correnti e gli strumenti di controllo riutilizzabili.

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
- [x] Stato dei registri verificato sul commit pubblicato
- [ ] Prima serie di nuove task esecutive completata
- [ ] Test mancanti implementati
- [ ] Collaudi live residui conclusi
- [ ] Stato finale del prodotto dopo le prossime correzioni tecniche

## Verifiche dell’ultimo checkpoint

```txt
registry checker tests: 18 PASS
nested registry tests: 2 PASS
registry consistency: 240 owner ID, 214 righe Todo, 0 errori, 0 warning
documentation links: 73 file, 425 link, 0 errori, 0 warning
validation fast: 6 PASS, 0 failure, 0 timeout
git diff --check: PASS
```

Le decisioni più recenti sintetizzate sono `DEC-025` e `DEC-026`.

## Prossimo passo

Prossimo passo: DA SELEZIONARE.
