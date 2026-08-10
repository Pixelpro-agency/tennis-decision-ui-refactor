# Mappa e stato dell’audit dei file Markdown — Continuazione 048

**ID mappa:** `TDUI-MD-AUDIT-MAP-003`  
**Repository:** `Pixelpro-agency/tennis-decision-ui-refactor`  
**Branch:** `main`  
**Commit censito:** `4c5f43b007149f3210c27d7565357a447a3a6ef4`  
**Aggiornato:** `2026-08-10T14:47:00+02:00`  
**Continua da:** `mappa-file-markdown-repository-continuazione-023.md` — secondo segmento congelato al `TDUI-DOC-REPORT-047`.

Questo è il **terzo segmento** della mappa. Non duplica report, task e inventario storico `1–47`; registra da qui in avanti i report `48+` e le sole nuove modifiche.

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

I segmenti precedenti conservano gli indici `1–47`. Questa continuazione è l’autorità per l’ordine residuo `48–72`.

- ultimo indice analizzato: **72**;
- prossimo indice: **nessuno**;
- prossimo documento: **nessuno — inventario `72/72` completato**.

## Struttura di archiviazione

```txt
analisi documentazione tennis decision ui/
├── mappa-file-markdown-repository.md                         # segmento 1 fino a 022
├── modifiche-audit-markdown.json                             # ledger segmento 1 fino a 022
├── mappa-file-markdown-repository-continuazione-023.md      # segmento 2, report 023–047
├── modifiche-audit-markdown-continuazione-023.json          # ledger segmento 2, report 023–047
├── mappa-file-markdown-repository-continuazione-048.md      # segmento 3, da report 048
├── modifiche-audit-markdown-continuazione-048.json          # ledger segmento 3, da report 048
└── Report documentale/
    ├── 48 - 04-task-completate.md
    ├── 49 - 05-audit-docs-planning.md
    ├── 50 - 06-implementazioni-proposte.md
    ├── 51 - 99-decisioni-utente.md
    ├── 52 - README-implementazioni.md
    ├── 53 - 01-rilievi-iniziali.md
    ├── 54 - 02-runtime-sessioni-betfair.md
    ├── 55 - 03-storage-recovery.md
    ├── 56 - 04-evidence-market-reactions.md
    ├── 57 - 05-frontend-session-shell.md
    ├── 58 - 06-validazione-e-test.md
    ├── 59 - 07-post-audit-e-migrazione.md
    ├── 60 - 01-rilievi-iniziali-e-api.md
    ├── 61 - 02-moduli-frontend-python.md
    ├── 62 - 03-operations-roadmap-e-controlli.md
    ├── 63 - 04-processo-e-materiali-storici.md
    ├── 64 - 01-utility-e-autorita-base.md
    ├── 65 - 02-runtime-betfair.md
    ├── 66 - 03-storage-recovery.md
    ├── 67 - 04-evidence-provenance.md
    ├── 68 - 05-frontend-session-polling.md
    ├── 69 - 06-validazione-e-fixture.md
    ├── 70 - 07-documentazione-e-normalizzazione.md
    ├── 71 - scripts-validation-README.md
    └── 72 - todo-list-tennis-decision-ui.md
```

I segmenti precedenti restano congelati. Questa continuazione registra soltanto report e task dal 048 in avanti, mantenendo i contatori cumulativi dell’intero audit.

## Stato dell’analisi

- file Markdown totali: **72**;
- file analizzati: **72**;
- file ancora da analizzare: **0**;
- avanzamento: **100,00%**;
- ultimo file analizzato: **`todo-list-tennis-decision-ui.md`**;
- ultimo report: **`TDUI-DOC-REPORT-072`**;
- percorso report: **`Report documentale/72 - todo-list-tennis-decision-ui.md`**;
- task di modifica complessive note: **350**;
- task completate in questa continuazione: **13**;
- task contenute in questa continuazione: **30**;
- task precedenti non duplicate: **320**.

## Report disponibili in questa continuazione

| Sequenza | Documento | Report ID | Percorso | Modularizzazione |
| ---: | --- | --- | --- | --- |
| 48 | `implementazioni/04-task-completate.md` | `TDUI-DOC-REPORT-048` | [`Report documentale/48 - 04-task-completate.md`](../Report%20documentale/48%20-%2004-task-completate.md) | Divisione non necessaria |
| 49 | `implementazioni/05-audit-docs-planning.md` | `TDUI-DOC-REPORT-049` | [`Report documentale/49 - 05-audit-docs-planning.md`](../Report%20documentale/49%20-%2005-audit-docs-planning.md) | Divisione non necessaria |
| 50 | `implementazioni/06-implementazioni-proposte.md` | `TDUI-DOC-REPORT-050` | [`Report documentale/50 - 06-implementazioni-proposte.md`](../Report%20documentale/50%20-%2006-implementazioni-proposte.md) | Divisione non necessaria |
| 51 | `implementazioni/99-decisioni-utente.md` | `TDUI-DOC-REPORT-051` | [`Report documentale/51 - 99-decisioni-utente.md`](../Report%20documentale/51%20-%2099-decisioni-utente.md) | Divisione non necessaria |
| 52 | `implementazioni/README.md` | `TDUI-DOC-REPORT-052` | [`Report documentale/52 - README-implementazioni.md`](../Report%20documentale/52%20-%20README-implementazioni.md) | Divisione non necessaria |
| 53 | `implementazioni/audit-codice/01-rilievi-iniziali.md` | `TDUI-DOC-REPORT-053` | [`Report documentale/53 - 01-rilievi-iniziali.md`](../Report%20documentale/53%20-%2001-rilievi-iniziali.md) | **Divisione necessaria** — facade + 2 child |
| 54 | `implementazioni/audit-codice/02-runtime-sessioni-betfair.md` | `TDUI-DOC-REPORT-054` | [`Report documentale/54 - 02-runtime-sessioni-betfair.md`](../Report%20documentale/54%20-%2002-runtime-sessioni-betfair.md) | **Divisione necessaria** — facade + 2 child |
| 55 | `implementazioni/audit-codice/03-storage-recovery.md` | `TDUI-DOC-REPORT-055` | [`Report documentale/55 - 03-storage-recovery.md`](../Report%20documentale/55%20-%2003-storage-recovery.md) | Divisione non necessaria |
| 56 | `implementazioni/audit-codice/04-evidence-market-reactions.md` | `TDUI-DOC-REPORT-056` | [`Report documentale/56 - 04-evidence-market-reactions.md`](../Report%20documentale/56%20-%2004-evidence-market-reactions.md) | Divisione non necessaria |
| 57 | `implementazioni/audit-codice/05-frontend-session-shell.md` | `TDUI-DOC-REPORT-057` | [`Report documentale/57 - 05-frontend-session-shell.md`](../Report%20documentale/57%20-%2005-frontend-session-shell.md) | Divisione non necessaria |
| 58 | `implementazioni/audit-codice/06-validazione-e-test.md` | `TDUI-DOC-REPORT-058` | [`Report documentale/58 - 06-validazione-e-test.md`](../Report%20documentale/58%20-%2006-validazione-e-test.md) | Divisione non necessaria |
| 59 | `implementazioni/audit-codice/07-post-audit-e-migrazione.md` | `TDUI-DOC-REPORT-059` | [`Report documentale/59 - 07-post-audit-e-migrazione.md`](../Report%20documentale/59%20-%2007-post-audit-e-migrazione.md) | Divisione non necessaria |
| 60 | `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md` | `TDUI-DOC-REPORT-060` | [`Report documentale/60 - 01-rilievi-iniziali-e-api.md`](../Report%20documentale/60%20-%2001-rilievi-iniziali-e-api.md) | **Divisione necessaria** — facade + 2 child |
| 61 | `implementazioni/audit-documentazione/02-moduli-frontend-python.md` | `TDUI-DOC-REPORT-061` | [`Report documentale/61 - 02-moduli-frontend-python.md`](../Report%20documentale/61%20-%2002-moduli-frontend-python.md) | **Divisione necessaria** — facade + 2 child |
| 62 | `implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md` | `TDUI-DOC-REPORT-062` | [`Report documentale/62 - 03-operations-roadmap-e-controlli.md`](../Report%20documentale/62%20-%2003-operations-roadmap-e-controlli.md) | **Divisione necessaria** — facade + 2 child |
| 63 | `implementazioni/audit-documentazione/04-processo-e-materiali-storici.md` | `TDUI-DOC-REPORT-063` | [`Report documentale/63 - 04-processo-e-materiali-storici.md`](../Report%20documentale/63%20-%2004-processo-e-materiali-storici.md) | Divisione non necessaria |
| 64 | `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md` | `TDUI-DOC-REPORT-064` | [`Report documentale/64 - 01-utility-e-autorita-base.md`](../Report%20documentale/64%20-%2001-utility-e-autorita-base.md) | **Divisione necessaria** — facade + 3 child |
| 65 | `implementazioni/implementazioni-proposte/02-runtime-betfair.md` | `TDUI-DOC-REPORT-065` | [`Report documentale/65 - 02-runtime-betfair.md`](../Report%20documentale/65%20-%2002-runtime-betfair.md) | Divisione non necessaria |
| 66 | `implementazioni/implementazioni-proposte/03-storage-recovery.md` | `TDUI-DOC-REPORT-066` | [`Report documentale/66 - 03-storage-recovery.md`](../Report%20documentale/66%20-%2003-storage-recovery.md) | Divisione non necessaria |
| 67 | `implementazioni/implementazioni-proposte/04-evidence-provenance.md` | `TDUI-DOC-REPORT-067` | [`Report documentale/67 - 04-evidence-provenance.md`](../Report%20documentale/67%20-%2004-evidence-provenance.md) | Divisione non necessaria |
| 68 | `implementazioni/implementazioni-proposte/05-frontend-session-polling.md` | `TDUI-DOC-REPORT-068` | [`Report documentale/68 - 05-frontend-session-polling.md`](../Report%20documentale/68%20-%2005-frontend-session-polling.md) | Divisione non necessaria |
| 69 | `implementazioni/implementazioni-proposte/06-validazione-e-fixture.md` | `TDUI-DOC-REPORT-069` | [`Report documentale/69 - 06-validazione-e-fixture.md`](../Report%20documentale/69%20-%2006-validazione-e-fixture.md) | **Divisione necessaria** — facade + 3 child |
| 70 | `implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md` | `TDUI-DOC-REPORT-070` | [`Report documentale/70 - 07-documentazione-e-normalizzazione.md`](../Report%20documentale/70%20-%2007-documentazione-e-normalizzazione.md) | Divisione non necessaria |
| 71 | `scripts/validation/README.md` | `TDUI-DOC-REPORT-071` | [`Report documentale/71 - scripts-validation-README.md`](../Report%20documentale/71%20-%20scripts-validation-README.md) | Divisione non necessaria |
| 72 | `todo-list-tennis-decision-ui.md` | `TDUI-DOC-REPORT-072` | [`Report documentale/72 - todo-list-tennis-decision-ui.md`](../Report%20documentale/72%20-%20todo-list-tennis-decision-ui.md) | Divisione non necessaria |


## Modifiche da applicare

### `implementazioni/04-task-completate.md`

Report: [`Report documentale/48 - 04-task-completate.md`](../Report%20documentale/48%20-%2004-task-completate.md) — `TDUI-DOC-REPORT-048`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`TASK-RECHECK-001`** — **HIGH** — Rendere esplicito che il ricontrollo D1–D18 è uno snapshot storico sulla baseline `b277bd9`; preservare gli esiti storici, aggiungere un pointer allo stato corrente/overlay e impedire che `Esito reale @ b277bd9` venga letto come stato corrente a HEAD.
- [x] **`TASK-RECHECK-002`** — **CRITICAL** — Riconciliare lo stato corrente D1–D18 con le evidenze degli audit successivi senza riscrivere il checkpoint storico: riesaminare almeno D5, D6, D9, D10, D11, D12, D13, D16 e D18, mantenere D14/D17 riaperte, collegare gli owner tecnici esistenti e aggiornare Todo/current counts con una overlay esplicita.

### `implementazioni/05-audit-docs-planning.md`

Report: [`Report documentale/49 - 05-audit-docs-planning.md`](../Report%20documentale/49%20-%2005-audit-docs-planning.md) — `TDUI-DOC-REPORT-049`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`PLANNING-AUDIT-001`** — **HIGH** — Separare la baseline usata per il confronto finale (`2697f66...`) dal commit che applica e registra la pulizia (`3de08ca...`); non sostituire una provenance con l’altra e registrare eventuale riallineamento archive successivo solo come metadata aggiuntivo dimostrabile.
- [x] **`PLANNING-AUDIT-002`** — **HIGH** — Etichettare il file come closeout storico del checkpoint di cleanup, qualificare `docs/archive/README.md` e `IMPL-015` come stato/next-step del checkpoint e indirizzare policy archive, stato IMPL e prossimo passo correnti verso i relativi owner senza riscrivere la storia.

### `implementazioni/06-implementazioni-proposte.md`

Report: [`Report documentale/50 - 06-implementazioni-proposte.md`](../Report%20documentale/50%20-%2006-implementazioni-proposte.md) — `TDUI-DOC-REPORT-050`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`IMPL-IDX-001`** — **HIGH** — Riallineare le summary delle implementazioni concluse a owner e Todo aggiungendo `IMPL-004` nel facade e nel root registry; mantenere invariati owner, Todo e `DEC-013`, non promuovere le IMPL ancora aperte e preservare il next step `DA SELEZIONARE`.

### `implementazioni/99-decisioni-utente.md`

Report: [`Report documentale/51 - 99-decisioni-utente.md`](../Report%20documentale/51%20-%2099-decisioni-utente.md) — `TDUI-DOC-REPORT-051`.

Modularizzazione: **valutata, non necessaria**.

- Nessuna nuova task: la divergenza archive è già posseduta da `ROOT-REG-001` e lo schema DEC da `METHOD-SCHEMA-001`.

### `implementazioni/README.md`

Report: [`Report documentale/52 - README-implementazioni.md`](../Report%20documentale/52%20-%20README-implementazioni.md) — `TDUI-DOC-REPORT-052`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`REGISTRY-README-001`** — **MEDIUM** — Riallineare `implementazioni/README.md` alla struttura modulare corrente usando una convenzione uniforme per i facade 02/03/06, preferibilmente esponendo i 4+7+7 moduli con descrizioni brevi; aggiornare le descrizioni di 05 e 06 come consumer dei rispettivi owner senza duplicare stati o schede.


### `implementazioni/audit-codice/01-rilievi-iniziali.md`

Report: [`Report documentale/53 - 01-rilievi-iniziali.md`](../Report%20documentale/53%20-%2001-rilievi-iniziali.md) — `TDUI-DOC-REPORT-053`.

Modularizzazione: **valutata, necessaria**.

File proposti:

```text
implementazioni/audit-codice/01-rilievi-iniziali/01-checkpoint-b3-b6.md
implementazioni/audit-codice/01-rilievi-iniziali/02-punto-1-runtime-writer-authority.md
```

Il file `implementazioni/audit-codice/01-rilievi-iniziali.md` resta come facade stabile.

- [x] **`AUDIT-CODE-P1-001`** — **HIGH** — Esplicitare la temporal authority interna del modulo: dichiarare B3–B6 come snapshot storico, distinguere il secondo audit Punto 1 e l’update successivo IMPL-015, aggiungere pointer allo stato corrente in Todo/owner e annotare le sezioni storiche ormai superseded (`CODE-001→DEC-008`, `CODE-003→DEC-009`, `EVIDENCE-001→DEC-010`, `CLEANUP-001→DEC-011`, `CODE-004` assorbito), senza riscrivere retroattivamente la storia.
- [ ] **`AUDIT-CODE-P1-002`** — **MEDIUM-HIGH** — Trasformare `01-rilievi-iniziali.md` in facade breve e separare le due macro-responsabilità in `01-checkpoint-b3-b6.md` e `02-punto-1-runtime-writer-authority.md`, preservando tutti gli ID, il testo storico, gli stati, la navigazione e l’unicità degli owner; verificare registry checker, link checker, fast e `git diff --check`.

### `implementazioni/audit-codice/02-runtime-sessioni-betfair.md`

Report: [`Report documentale/54 - 02-runtime-sessioni-betfair.md`](../Report%20documentale/54%20-%2002-runtime-sessioni-betfair.md) — `TDUI-DOC-REPORT-054`.

Modularizzazione: **valutata, necessaria**.

File proposti:

```text
implementazioni/audit-codice/02-runtime-sessioni-betfair/01-session-authority-start-stop.md
implementazioni/audit-codice/02-runtime-sessioni-betfair/02-betfair-lifecycle-control-plane.md
```

Il file `implementazioni/audit-codice/02-runtime-sessioni-betfair.md` resta come facade stabile.

- [x] **`AUDIT-CODE-P23-001`** — **HIGH** — Riallineare temporal authority, supersession e metadata del modulo: chiarire che Punto 2 e Punto 3 sono audit snapshot sulle rispettive baseline e che `COMPLETATO E APPROVATO` non significa implementazione completata; collegare le evidenze successive già owned (`SOFA-LIVE-*`, `LIVE-CTRL-*`, `GRAPH-URL-*`, `BETFAIR-SCRAPER-*`, `BETFAIR-DIAG-*`, `RETENTION-*`), qualificare l’ordine tecnico come storico e riconciliare `FRONTEND-003` e `FRONTEND-007` con la priorità corrente **critica** della Todo oppure separare `priority_at_checkpoint` da `current_priority`.
- [ ] **`AUDIT-CODE-P23-002`** — **MEDIUM-HIGH** — Mantenere `02-runtime-sessioni-betfair.md` come facade stabile e separare Punto 2 Session Authority e Punto 3 Betfair Lifecycle/Control Plane nei due child proposti, preservando le due baseline, tutti gli owner ID, le sintesi IMPL, la navigazione Parte 1/Parte 3 e l’intero contenuto senza duplicazioni; verificare registry checker, link checker, fast e `git diff --check`.

### `implementazioni/audit-codice/03-storage-recovery.md`

Report: [`Report documentale/55 - 03-storage-recovery.md`](../Report%20documentale/55%20-%2003-storage-recovery.md) — `TDUI-DOC-REPORT-055`.

Modularizzazione: **valutata, non necessaria**.

- Nessuna nuova task: gli approfondimenti successivi su timeline/history e journal/recovery sono già posseduti dalle famiglie `STORAGE-TH-*` e `JOURNAL-REC-*`; il modulo resta coerente con `STORAGE-001…012`, `SECURITY-006`, `IMPL-019…021` e `TEST-019…030`.

### `implementazioni/audit-codice/04-evidence-market-reactions.md`

Report: [`Report documentale/56 - 04-evidence-market-reactions.md`](../Report%20documentale/56%20-%2004-evidence-market-reactions.md) — `TDUI-DOC-REPORT-056`.

Modularizzazione: **valutata, non necessaria**.

- Nessuna nuova task: `EVIDENCE-001…009`, `DOC-026/027`, `IMPL-022…024` e `TEST-031…043` restano coerenti con Todo e codice corrente; i finding principali sono ancora attivi e già posseduti dagli owner esistenti.

### `implementazioni/audit-codice/05-frontend-session-shell.md`

Report: [`Report documentale/57 - 05-frontend-session-shell.md`](../Report%20documentale/57%20-%2005-frontend-session-shell.md) — `TDUI-DOC-REPORT-057`.

Modularizzazione: **valutata, non necessaria**.

- Nessuna nuova task: `FRONTEND-001…012`, `DOC-028…030`, `IMPL-025…027` e `TEST-044…059` restano coerenti con Todo e codice corrente; le strutture session controller, polling session-scoped e Market Reactions view model risultano ancora aperte e già correttamente owned.


### `implementazioni/audit-codice/06-validazione-e-test.md`

Report: [`Report documentale/58 - 06-validazione-e-test.md`](../Report%20documentale/58%20-%2006-validazione-e-test.md) — `TDUI-DOC-REPORT-058`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`AUDIT-CODE-P7-001`** — **HIGH** — Rendere esplicito il boundary temporale fra il checkpoint originario del Punto 7 e lo stato successivo a `IMPL-028`: preservare il finding storico, ma aggiornare le sintesi che indicano ancora runner, manifest, profili, comando canonico e result artifact come assenti; registrare come implementati runner, manifest, cinque profili offline, process isolation, timeout e artifact JSON bounded, mantenendo aperti `IMPL-003`, `IMPL-029…031`, persistence/benchmark/live, coverage e i TEST-ID ancora mancanti o parziali.

### `implementazioni/audit-codice/07-post-audit-e-migrazione.md`

Report: [`Report documentale/59 - 07-post-audit-e-migrazione.md`](../Report%20documentale/59%20-%2007-post-audit-e-migrazione.md) — `TDUI-DOC-REPORT-059`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`AUDIT-CODE-POST-001`** — **HIGH** — Riallineare le owner card post-completion senza cancellare la cronologia: `TEST-077`, `TEST-078` e `TEST-079` devono esporre lo stato corrente `COMPLETATO` preservando il precedente stato Batch 0 come storico; in §24.1 `IMPL-028` distinguere lo stato iniziale “da validare” dallo stato finale “implementata e validata localmente”, mantenendo i cinque profili PASS come evidence storica locale e senza riaprire `IMPL-028`, `IMPL-032` o i TEST già chiusi.

### `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md`

Report: [`Report documentale/60 - 01-rilievi-iniziali-e-api.md`](../Report%20documentale/60%20-%2001-rilievi-iniziali-e-api.md) — `TDUI-DOC-REPORT-060`.

Modularizzazione: **valutata, necessaria**.

File proposti:

```text
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api/01-rilievi-iniziali.md
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api/02-api.md
```

Il file `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md` resta come facade stabile.

- [x] **`DOC-AUDIT-P12-001`** — **HIGH** — Riconciliare il checkpoint storico B1/B2 con lo stato corrente post-migrazione: aggiungere un banner storico/current, preservare gli owner originali e registrare come risolti o assorbiti `DOC-001`, `DOC-003`, `DOC-004`, `DOC-005`, `DOC-007`, `DOC-008`, `DOC-010`, `DOC-012`; per `DOC-013` distinguere documentazione sostanzialmente risolta da `CODE-002` ancora aperto; mantenere attivi `DOC-002`, `DOC-006`, `DOC-009`, `DOC-011` e `WORKFLOW-001` e aggiornare la coda API che dice ancora che la correzione canonica non è stata eseguita.
- [ ] **`DOC-AUDIT-P12-002`** — **MEDIUM-HIGH** — Trasformare `01-rilievi-iniziali-e-api.md` in facade breve e separare le due responsabilità in `01-rilievi-iniziali.md` e `02-api.md`, preservando tutti gli owner ID, la checklist iniziale, il checkpoint API `b277...`, il qualifier test-letti/non-eseguiti, la navigazione e la reconciliation introdotta da `DOC-AUDIT-P12-001`; verificare registry checker, link checker, fast e `git diff --check`.

### `implementazioni/audit-documentazione/02-moduli-frontend-python.md`

Report: [`Report documentale/61 - 02-moduli-frontend-python.md`](../Report%20documentale/61%20-%2002-moduli-frontend-python.md) — `TDUI-DOC-REPORT-061`.

Modularizzazione: **valutata, necessaria**.

File proposti:

```text
implementazioni/audit-documentazione/02-moduli-frontend-python/01-moduli-owner-b3.md
implementazioni/audit-documentazione/02-moduli-frontend-python/02-frontend-python-b4.md
```

Il file `implementazioni/audit-documentazione/02-moduli-frontend-python.md` resta come facade stabile.

- [x] **`DOC-AUDIT-B34-001`** — **HIGH** — Aggiungere una reconciliation esplicita dei checkpoint storici B3/B4 con lo stato corrente: mantenere `DOC-014`, `DOC-015`, `DOC-016`, `DOC-017` e `DOC-019` aperti secondo il codice/documentazione corrente, registrare `DOC-018` come risolto lato documentazione con `FRONTEND-002` ancora aperto lato implementazione, e qualificare gli esiti “nessuna modifica a docs/ o codice” come outcome del checkpoint anziché current state.
- [ ] **`DOC-AUDIT-B34-002`** — **MEDIUM-HIGH** — Mantenere `02-moduli-frontend-python.md` come facade stabile e separare B3 (Sofa/Betfair/Storage/Evidence) da B4 (Frontend/Python) nei due child proposti, preservando baseline, test-letti/non-eseguiti, tutti gli owner ID, note `EVIDENCE-001`/`SOFA-001`/`TEST-001`, current overlay e navigazione; verificare registry checker, link checker, fast e `git diff --check`.

### `implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md`

Report: [`Report documentale/62 - 03-operations-roadmap-e-controlli.md`](../Report%20documentale/62%20-%2003-operations-roadmap-e-controlli.md) — `TDUI-DOC-REPORT-062`.

Modularizzazione: **valutata, necessaria**.

File proposti:

```text
implementazioni/audit-documentazione/03-operations-roadmap-e-controlli/01-operations-roadmap-b5.md
implementazioni/audit-documentazione/03-operations-roadmap-e-controlli/02-controlli-trasversali-b6.md
```

Il file `implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md` resta come facade stabile.

- [x] **`DOC-AUDIT-B56-001`** — **HIGH** — Riconciliare B5/B6 come checkpoint storici con lo stato post-migrazione: `DOC-020` e `DOC-023` diventano risolti, `DOC-021` resta root storicamente valida ma viene superseded da `DOC-031` come owner corrente, `DOC-022` resta aperto/parzialmente migliorato; preservare `WORKFLOW-002/003` completati e aggiungere pointer current per `IMPL-001`, `IMPL-005`, `TEST-003`, README `index.mdx`, roadmap future rimosse dal canonico, §15.5 e gli esiti B5/B6 senza riscrivere il checkpoint.
- [ ] **`DOC-AUDIT-B56-002`** — **MEDIUM-HIGH** — Trasformare `03-operations-roadmap-e-controlli.md` in facade breve e separare B5 Operations/Roadmap da B6 Controlli trasversali nei due child proposti, preservando `DOC-020…023`, `WORKFLOW-002/003`, baseline B6, test-letti/non-eseguiti, path storici e current overlay; verificare registry checker, link checker, fast e `git diff --check`.

### `implementazioni/audit-documentazione/04-processo-e-materiali-storici.md`

Report: [`Report documentale/63 - 04-processo-e-materiali-storici.md`](../Report%20documentale/63%20-%2004-processo-e-materiali-storici.md) — `TDUI-DOC-REPORT-063`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`DOC-AUDIT-PROC-001`** — **HIGH** — Aggiungere una overlay post-migrazione alle sezioni 16–17 senza riscrivere il checkpoint storico: marcare i path `implementazioni/07-workflow-esecutivo.md` e `implementazioni/08-linee-guida-chat-e-ai.md` come proposta superseded dai documenti AI canonici correnti; registrare `docs/validations/` come implementata, `_work` e `percorsi.txt` come rimossi, i materiali legacy come temporaneamente archiviati, consolidati e poi rimossi; qualificare §17.6 come stato al checkpoint e rimandare lo stato corrente a Todo/owner.

### `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md`

Report: [`Report documentale/64 - 01-utility-e-autorita-base.md`](../Report%20documentale/64%20-%2001-utility-e-autorita-base.md) — `TDUI-DOC-REPORT-064`.

Modularizzazione: **valutata, necessaria**.

File proposti:

```text
implementazioni/implementazioni-proposte/01-utility-e-autorita-base/01-utility-e-controlli.md
implementazioni/implementazioni-proposte/01-utility-e-autorita-base/02-autorita-boundary-e-supporto.md
implementazioni/implementazioni-proposte/01-utility-e-autorita-base/03-offline-replay-strategy-performance.md
```

Il file `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md` resta come facade stabile.

- [ ] **`IMPL-BASE-001`** — **HIGH** — Riallineare la temporal authority del registro `IMPL-001…015`: distinguere problema originario, checkpoint, decisione successiva, stato corrente e closeout; marcare la frase `Manca però un controllo globale ripetibile` di `IMPL-001` come problema originario, qualificare §13.1 e §14.1 come ordini storici e impedire che l’introduzione di §14 contraddica l’approvazione successiva di `IMPL-006`, senza cambiare gli stati tecnici correnti.
- [ ] **`IMPL-BASE-002`** — **MEDIUM-HIGH** — Mantenere `01-utility-e-autorita-base.md` come facade stabile e separare il registro in tre child per responsabilità: utility/controlli (`IMPL-001…005`), authority/boundary/supporto (`IMPL-006/007/008/009/011/015`) e offline/replay/strategy/performance (`IMPL-010/012/013/014`), preservando owner, provenance e closeout `IMPL-015`.

### `implementazioni/implementazioni-proposte/02-runtime-betfair.md`

Report: [`Report documentale/65 - 02-runtime-betfair.md`](../Report%20documentale/65%20-%2002-runtime-betfair.md) — `TDUI-DOC-REPORT-065`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`IMPL-BETFAIR-001`** — **HIGH** — Normalizzare il dependency graph di `IMPL-016…018` distinguendo hard prerequisites, supporting tools, validation/test dependencies, downstream consumers e future dependencies; chiarire in particolare che `IMPL-002` non è implicitamente bloccante per `IMPL-017` salvo decisione esplicita e definire il verso delle relazioni `IMPL-018↔IMPL-012/013` senza introdurre cicli.

### `implementazioni/implementazioni-proposte/03-storage-recovery.md`

Report: [`Report documentale/66 - 03-storage-recovery.md`](../Report%20documentale/66%20-%2003-storage-recovery.md) — `TDUI-DOC-REPORT-066`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`IMPL-STORAGE-001`** — **HIGH** — Registrare per `IMPL-019…021` il boundary fra primitive già implementate dalla Task 6 e contratto residuo: preservare journal/recovery, target verification, reopen incomplete, recovery bootstrap, summary bounded e stati `partial_persistence`/`recovery_failed`; esplicitare invece come mancanti event-scoped authority, revision/headCommitId, digest/base revision, schema/identity verification, ambiguous storage e recovery control-plane persistente.
- [ ] **`IMPL-STORAGE-002`** — **HIGH** — Normalizzare dependency graph e sequencing di `IMPL-019…021`: rendere coerente la relazione `IMPL-021↔IMPL-009` con l’ordine §18.2, chiarire il ruolo della baseline `IMPL-013` rispetto all’evoluzione del formato introdotta da `IMPL-020`, classificare `IMPL-008` come supporto di validazione e rimuovere ogni ciclo implicito senza eseguire implementazioni.

### `implementazioni/implementazioni-proposte/04-evidence-provenance.md`

Report: [`Report documentale/67 - 04-evidence-provenance.md`](../Report%20documentale/67%20-%2004-evidence-provenance.md) — `TDUI-DOC-REPORT-067`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`IMPL-EVIDENCE-001`** — **HIGH** — Sostituire per `IMPL-022/023/024` la formula `STRUTTURA COMPLETAMENTE ASSENTE` con uno stato bounded `APPROVATA, NON COMPLETATA` che elenchi le primitive legacy/current già presenti e i contratti owner ancora mancanti; preservare temporal alignment, Market Reactions, `causalityClaimed:false` e comparazioni runner esistenti, esplicitando i limiti da sostituire come future timestamp clamp, name fallback e price-source comparability incompleta.

### `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`

Report: [`Report documentale/68 - 05-frontend-session-polling.md`](../Report%20documentale/68%20-%2005-frontend-session-polling.md) — `TDUI-DOC-REPORT-068`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`IMPL-FRONTEND-001`** — **HIGH** — Riallineare `IMPL-025/026/027` sostituendo `STRUTTURA COMPLETAMENTE ASSENTE` con uno stato bounded `APPROVATA, NON COMPLETATA`: registrare le primitive frontend già presenti (session input/confirmed state, Start/Stop actions, shell/bootstrap, poller esistenti, async guards Evidence/Source Identity, Market Reactions UI) e separarle dai contratti ancora mancanti (single live-session controller, `trackingSessionId`/command authority, shared session-scoped polling runtime, Stop di tutti i poller, retain policy e dedicated Market Reactions view model). Preservare le protezioni async già robuste e non promuovere `TEST-044…059`.

### `implementazioni/implementazioni-proposte/06-validazione-e-fixture.md`

Report: [`Report documentale/69 - 06-validazione-e-fixture.md`](../Report%20documentale/69%20-%2006-validazione-e-fixture.md) — `TDUI-DOC-REPORT-069`.

Modularizzazione: **valutata, necessaria**.

File proposti:

```text
implementazioni/implementazioni-proposte/06-validazione-e-fixture/01-runner-e-result-ledger.md
implementazioni/implementazioni-proposte/06-validazione-e-fixture/02-fixture-e-sandbox.md
implementazioni/implementazioni-proposte/06-validazione-e-fixture/03-frontend-interaction-harness.md
```

Il file `implementazioni/implementazioni-proposte/06-validazione-e-fixture.md` resta come facade stabile.

- [ ] **`IMPL-VALIDATION-001`** — **HIGH** — Riconciliare il boundary `IMPL-028↔IMPL-031`: mantenere `IMPL-028` completata e attribuirle runner, manifest e v1 run artifact già implementati; mantenere `IMPL-031` aperta come estensione del result contract/ledger storico, distinguendo i campi già presenti da quelli ancora mancanti e rendendo non ciclica la dependency `028↔031`. `TEST-069/070` restano parziali e non chiusi.
- [ ] **`IMPL-VALIDATION-002`** — **MEDIUM-HIGH** — Mantenere `06-validazione-e-fixture.md` come facade stabile e separare runner + result ledger (`IMPL-028/031`), fixture + sandbox (`IMPL-029`) e frontend interaction harness (`IMPL-030`) nei tre child proposti, preservando closeout `IMPL-028`, `TEST-060…075`, estensioni condivise e ordine approvato senza duplicare owner.

### `implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md`

Report: [`Report documentale/70 - 07-documentazione-e-normalizzazione.md`](../Report%20documentale/70%20-%2007-documentazione-e-normalizzazione.md) — `TDUI-DOC-REPORT-070`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`IMPL-DOCNORM-001`** — **HIGH** — Preservare la matrice owner della §24 come checkpoint pre-modularizzazione e aggiungere una overlay dei current owner path dopo lo split dei registri. I facade `02-audit-documentazione.md`, `03-audit-codice.md` e `06-implementazioni-proposte.md` non devono essere presentati come owner current quando le schede vivono nei child; risolvere ogni ID tramite la card owner reale, senza promuovere addenda, rinumerare ID, rifare il dedupe o riaprire `IMPL-032`/`TEST-076…079`.

### `scripts/validation/README.md`

Report: [`Report documentale/71 - scripts-validation-README.md`](../Report%20documentale/71%20-%20scripts-validation-README.md) — `TDUI-DOC-REPORT-071`.

Modularizzazione: **valutata, non necessaria**.

- [ ] **`VALID-RUNNER-001`** — **HIGH** — Rendere fail-closed il boundary live/offline del validation runner a livello di entry/capability selezionata: una entry `liveRequired:true` non deve poter essere eseguita senza consenso esplicito indipendentemente dal profilo che la seleziona; `full-offline` deve rifiutare `browser`, `credentials`, `external-network` e `tracking`, e `backend/frontend/python` devono avere una policy esplicita. Aggiungere self-test sintetici senza browser/rete reali e riallineare il README; `TEST-073` resta completato perché copre correttamente il solo profilo `fast`.

### `todo-list-tennis-decision-ui.md`

Report: [`Report documentale/72 - todo-list-tennis-decision-ui.md`](../Report%20documentale/72%20-%20todo-list-tennis-decision-ui.md) — `TDUI-DOC-REPORT-072`.

Modularizzazione: **valutata, non necessaria**.

- Nessuna nuova task: la Todo richiede revisioni mirate come consumer degli owner già esistenti (`TASK-RECHECK-002`, `CURRENT-STATE-002`, `DOC-AUDIT-P12-001`, `DOC-AUDIT-B34-001`, `DOC-AUDIT-B56-001`, `DOC-AUDIT-PROC-001`, `IMPL-STORAGE-001`, `IMPL-EVIDENCE-001`, `IMPL-FRONTEND-001`, `IMPL-VALIDATION-001`). Aprire un nuovo `TODO-*` duplichererebbe le stesse root issue.

## Inventario canonico di continuazione

I segmenti precedenti conservano gli indici `1–47`. Questa tabella mantiene l’ordine residuo `48–72`.

| Indice | Documento | Stato | Report | Modularizzazione |
| ---: | --- | --- | --- | --- |
| 48 | `implementazioni/04-task-completate.md` | **ANALIZZATO** | [`Report documentale/48 - 04-task-completate.md`](../Report%20documentale/48%20-%2004-task-completate.md) | Divisione non necessaria |
| 49 | `implementazioni/05-audit-docs-planning.md` | **ANALIZZATO** | [`Report documentale/49 - 05-audit-docs-planning.md`](../Report%20documentale/49%20-%2005-audit-docs-planning.md) | Divisione non necessaria |
| 50 | `implementazioni/06-implementazioni-proposte.md` | **ANALIZZATO** | [`Report documentale/50 - 06-implementazioni-proposte.md`](../Report%20documentale/50%20-%2006-implementazioni-proposte.md) | Divisione non necessaria |
| 51 | `implementazioni/99-decisioni-utente.md` | **ANALIZZATO** | [`Report documentale/51 - 99-decisioni-utente.md`](../Report%20documentale/51%20-%2099-decisioni-utente.md) | Divisione non necessaria |
| 52 | `implementazioni/README.md` | **ANALIZZATO** | [`Report documentale/52 - README-implementazioni.md`](../Report%20documentale/52%20-%20README-implementazioni.md) | Divisione non necessaria |
| 53 | `implementazioni/audit-codice/01-rilievi-iniziali.md` | **ANALIZZATO** | [`Report documentale/53 - 01-rilievi-iniziali.md`](../Report%20documentale/53%20-%2001-rilievi-iniziali.md) | **Divisione necessaria** — facade + 2 child |
| 54 | `implementazioni/audit-codice/02-runtime-sessioni-betfair.md` | **ANALIZZATO** | [`Report documentale/54 - 02-runtime-sessioni-betfair.md`](../Report%20documentale/54%20-%2002-runtime-sessioni-betfair.md) | **Divisione necessaria** — facade + 2 child |
| 55 | `implementazioni/audit-codice/03-storage-recovery.md` | **ANALIZZATO** | [`Report documentale/55 - 03-storage-recovery.md`](../Report%20documentale/55%20-%2003-storage-recovery.md) | Divisione non necessaria |
| 56 | `implementazioni/audit-codice/04-evidence-market-reactions.md` | **ANALIZZATO** | [`Report documentale/56 - 04-evidence-market-reactions.md`](../Report%20documentale/56%20-%2004-evidence-market-reactions.md) | Divisione non necessaria |
| 57 | `implementazioni/audit-codice/05-frontend-session-shell.md` | **ANALIZZATO** | [`Report documentale/57 - 05-frontend-session-shell.md`](../Report%20documentale/57%20-%2005-frontend-session-shell.md) | Divisione non necessaria |
| 58 | `implementazioni/audit-codice/06-validazione-e-test.md` | **ANALIZZATO** | [`Report documentale/58 - 06-validazione-e-test.md`](../Report%20documentale/58%20-%2006-validazione-e-test.md) | Divisione non necessaria |
| 59 | `implementazioni/audit-codice/07-post-audit-e-migrazione.md` | **ANALIZZATO** | [`Report documentale/59 - 07-post-audit-e-migrazione.md`](../Report%20documentale/59%20-%2007-post-audit-e-migrazione.md) | Divisione non necessaria |
| 60 | `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md` | **ANALIZZATO** | [`Report documentale/60 - 01-rilievi-iniziali-e-api.md`](../Report%20documentale/60%20-%2001-rilievi-iniziali-e-api.md) | **Divisione necessaria** — facade + 2 child |
| 61 | `implementazioni/audit-documentazione/02-moduli-frontend-python.md` | **ANALIZZATO** | [`Report documentale/61 - 02-moduli-frontend-python.md`](../Report%20documentale/61%20-%2002-moduli-frontend-python.md) | **Divisione necessaria** — facade + 2 child |
| 62 | `implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md` | **ANALIZZATO** | [`Report documentale/62 - 03-operations-roadmap-e-controlli.md`](../Report%20documentale/62%20-%2003-operations-roadmap-e-controlli.md) | **Divisione necessaria** — facade + 2 child |
| 63 | `implementazioni/audit-documentazione/04-processo-e-materiali-storici.md` | **ANALIZZATO** | [`Report documentale/63 - 04-processo-e-materiali-storici.md`](../Report%20documentale/63%20-%2004-processo-e-materiali-storici.md) | Divisione non necessaria |
| 64 | `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md` | **ANALIZZATO** | [`Report documentale/64 - 01-utility-e-autorita-base.md`](../Report%20documentale/64%20-%2001-utility-e-autorita-base.md) | **Divisione necessaria** — facade + 3 child |
| 65 | `implementazioni/implementazioni-proposte/02-runtime-betfair.md` | **ANALIZZATO** | [`Report documentale/65 - 02-runtime-betfair.md`](../Report%20documentale/65%20-%2002-runtime-betfair.md) | Divisione non necessaria |
| 66 | `implementazioni/implementazioni-proposte/03-storage-recovery.md` | **ANALIZZATO** | [`Report documentale/66 - 03-storage-recovery.md`](../Report%20documentale/66%20-%2003-storage-recovery.md) | Divisione non necessaria |
| 67 | `implementazioni/implementazioni-proposte/04-evidence-provenance.md` | **ANALIZZATO** | [`Report documentale/67 - 04-evidence-provenance.md`](../Report%20documentale/67%20-%2004-evidence-provenance.md) | Divisione non necessaria |
| 68 | `implementazioni/implementazioni-proposte/05-frontend-session-polling.md` | **ANALIZZATO** | [`Report documentale/68 - 05-frontend-session-polling.md`](../Report%20documentale/68%20-%2005-frontend-session-polling.md) | Divisione non necessaria |
| 69 | `implementazioni/implementazioni-proposte/06-validazione-e-fixture.md` | **ANALIZZATO** | [`Report documentale/69 - 06-validazione-e-fixture.md`](../Report%20documentale/69%20-%2006-validazione-e-fixture.md) | **Divisione necessaria** — facade + 3 child |
| 70 | `implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md` | **ANALIZZATO** | [`Report documentale/70 - 07-documentazione-e-normalizzazione.md`](../Report%20documentale/70%20-%2007-documentazione-e-normalizzazione.md) | Divisione non necessaria |
| 71 | `scripts/validation/README.md` | **ANALIZZATO** | [`Report documentale/71 - scripts-validation-README.md`](../Report%20documentale/71%20-%20scripts-validation-README.md) | Divisione non necessaria |
| 72 | `todo-list-tennis-decision-ui.md` | **ANALIZZATO** | [`Report documentale/72 - todo-list-tennis-decision-ui.md`](../Report%20documentale/72%20-%20todo-list-tennis-decision-ui.md) | Divisione non necessaria |

## JSON incrementale delle modifiche — continuazione

Da questo segmento viene usato:

```text
modifiche-audit-markdown-continuazione-048.json
```

Regole:

- parte da `TDUI-DOC-REPORT-048`;
- contiene soltanto report e task dal report 048 in avanti;
- non duplica le **320 task** precedenti;
- non ricopia l’inventario storico `1–47`;
- conserva stato, priorità, checkbox, modularizzazione e riferimenti al report;
- mantiene contatori cumulativi;
- i segmenti precedenti restano congelati.

## Checkpoint 048–052

```text
048 → 2 task
049 → 2 task
050 → 1 task
051 → 0 task
052 → 1 task
totale blocco → 6 task
```

## Checkpoint 053–057

```text
053 → 2 task
054 → 2 task
055 → 0 task
056 → 0 task
057 → 0 task
totale blocco → 4 task
```

Finding aggiunti nel blocco:

```text
AUDIT-CODE-P1-001
AUDIT-CODE-P1-002
AUDIT-CODE-P23-001
AUDIT-CODE-P23-002
```

I report `055`, `056` e `057` sono registrati con `change_ids` vuoti perché non hanno aperto nuove root issue.

## Checkpoint 058–062

```text
058 → 1 task
059 → 1 task
060 → 2 task
061 → 2 task
062 → 2 task
totale blocco → 8 task
```

Finding aggiunti nel blocco:

```text
AUDIT-CODE-P7-001
AUDIT-CODE-POST-001
DOC-AUDIT-P12-001
DOC-AUDIT-P12-002
DOC-AUDIT-B34-001
DOC-AUDIT-B34-002
DOC-AUDIT-B56-001
DOC-AUDIT-B56-002
```

Tutti gli otto Change ID restano con checkbox `[ ]`: l’audit ha identificato le modifiche, ma non le ha ancora applicate ai documenti owner.

## Checkpoint 063–067

```text
063 → 1 task
064 → 2 task
065 → 1 task
066 → 2 task
067 → 1 task
totale blocco → 7 task
```

Finding aggiunti nel blocco:

```text
DOC-AUDIT-PROC-001
IMPL-BASE-001
IMPL-BASE-002
IMPL-BETFAIR-001
IMPL-STORAGE-001
IMPL-STORAGE-002
IMPL-EVIDENCE-001
```

Tutti i sette Change ID sono registrati con checkbox `[ ]`: l’audit ha identificato le modifiche, ma non le ha ancora applicate ai documenti owner.

## Checkpoint 068–072

```text
068 → 1 task
069 → 2 task
070 → 1 task
071 → 1 task
072 → 0 task
totale blocco → 5 task
```

Finding aggiunti nel blocco:

```text
IMPL-FRONTEND-001
IMPL-VALIDATION-001
IMPL-VALIDATION-002
IMPL-DOCNORM-001
VALID-RUNNER-001
```

I cinque Change ID sono registrati con checkbox `[ ]`: sono finding/task di audit ancora da applicare. Il report `072` ha `change_ids` vuoto perché le correzioni della Todo sono già possedute dagli owner esistenti e non va creato un secondo owner duplicato.

## Chiusura dell’inventario Markdown

```text
file Markdown totali: 72
file analizzati: 72
file da analizzare: 0
avanzamento: 100,00%
ultimo report: TDUI-DOC-REPORT-072
prossimo documento: nessuno
```

L’audit dell’inventario Markdown è completo. Le task registrate restano backlog/evidence fino alla loro applicazione e verifica; il completamento dell’analisi non equivale al completamento delle modifiche.

## Verifica del pacchetto

```text
file Markdown totali: 72
file analizzati: 72
file da analizzare: 0
report completi totali: 72
report in questa continuazione: 25
task complessive note: 350
task precedenti non duplicate: 320
task in questa continuazione: 30
task con checkbox: 30
task completate in questa continuazione: 13
report con change_ids vuoto: 051, 055, 056, 057, 072
change_id univoci nel nuovo ledger: sì
definizione di analizzare presente nella mappa: sì
modularizzazione valutata per 048–072: sì
split richiesto per 053, 054, 060, 061, 062, 064 e 069: sì
ordine residuo 48–72 mantenuto: sì
audit Markdown 72/72: completato
duplicazioni dei segmenti precedenti: no
esito: PASS
```

## Regola per gli aggiornamenti successivi alla chiusura

L’analisi documento-per-documento dell’inventario corrente è conclusa. Questa terza continuazione è consolidata fino al report 072. L’inventario Markdown `72/72` è completo; non esiste un documento successivo nell’ordine canonico corrente. Eventuali aggiornamenti futuri riguarderanno applicazione/verifica delle task oppure un nuovo inventario esplicitamente deciso, senza riscrivere retroattivamente i segmenti congelati.

Per ogni documento:

1. applicare integralmente la definizione di “analizzare” riportata sopra;
2. creare il report completo dentro `Report documentale/`;
3. assegnare un `report_id` univoco;
4. registrare nel report la valutazione di modularizzazione;
5. non modificare lo stato `completed` delle task senza applicazione e verifica.

Quando si consolida un nuovo blocco:

6. aggiornare **questa continuazione 048** finché resta di dimensione gestibile; quando diventa troppo lunga, congelarla e aprire una nuova continuazione senza ricopiare lo storico;
7. registrare soltanto le nuove task del blocco come `- [ ]`;
8. aggiungere al JSON soltanto i nuovi report e le nuove task successive all’ultimo checkpoint consolidato;
9. mantenere `completed: false` finché la task non è applicata e verificata;
10. aggiornare contatori cumulativi, ultimo documento e prossimo indice;
11. aggiornare soltanto le righe dell’inventario coinvolte;
12. verificare che non siano state duplicate task già possedute dai segmenti precedenti;
13. quando anche questa continuazione diventerà troppo grande, congelarla e aprire un nuovo segmento senza ricopiare lo storico.
