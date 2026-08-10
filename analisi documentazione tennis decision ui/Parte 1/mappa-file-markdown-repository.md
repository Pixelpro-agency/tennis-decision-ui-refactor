# Mappa e stato dell’audit dei file Markdown

**ID mappa:** `TDUI-MD-AUDIT-MAP-001`  
**Repository:** `Pixelpro-agency/tennis-decision-ui-refactor`  
**Branch:** `main`  
**Commit censito:** `4c5f43b007149f3210c27d7565357a447a3a6ef4`  
**Aggiornato:** `2026-08-08T15:42:00+02:00`

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

Da questo aggiornamento l’autorità dell’ordine è **l’inventario completo contenuto in questo file Markdown**.

Il precedente JSON completo non viene più esteso perché stava duplicando inventario, report e task. Il nuovo `modifiche-audit-markdown.json` è invece un **ledger incrementale delle modifiche**: parte dal report 008 e verrà esteso con i report successivi senza ricopiare i 72 file né le 44 task precedenti.

- ultimo indice analizzato: **22**;
- prossimo indice: **23**;
- prossimo documento: **`docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md`**.

## Struttura di archiviazione

```txt
analisi documentazione tennis decision ui/
├── mappa-file-markdown-repository.md
├── modifiche-audit-markdown.json
└── ../Report documentale/
    ├── 01 - Readme.md
    ├── 02 - 01-context-selection.md
    ├── 03 - 02-documentation-conventions.md
    ├── 04 - 03-workflow-esecutivo.md
    ├── 05 - 01-match.md
    ├── 06 - 02-betfair.md
    ├── 07 - 03-evidence.md
    ├── 08 - 04-strategy.md
    ├── 09 - 05-preflight.md
    ├── 10 - 06-runtime-health.md
    ├── 11 - 01-system-boundaries.md
    ├── 12 - 02-data-lifecycle.md
    ├── 13 - index.md
    ├── 14 - 01-scraper-lifecycle.md
    ├── 15 - 02-technical-sample-validity.md
    ├── 16 - 01-match-evidence-snapshot.md
    ├── 17 - 02-source-identity.md
    ├── 18 - 03-quality-flow-and-alignment.md
    ├── 19 - 04-market-reactions.md
    ├── 20 - 01-session-shell.md
    ├── 21 - 02-live-polling-and-view-model.md
    └── 22 - 03-betfair-and-market-reactions-ui.md
```

I report completi restano nella cartella `../Report documentale/`. Il Markdown conserva l’inventario completo, i riferimenti ai report, le task e lo stato della modularizzazione. Il nuovo JSON conserva soltanto le modifiche dal report 008 in avanti e verrà usato come ledger incrementale per le analisi future.

Il precedente JSON completo resta una fotografia storica della mappa fino al report 007 e **non deve più essere aggiornato**.

## Stato dell’analisi

- file Markdown totali: **72**;
- file analizzati: **22**;
- file ancora da analizzare: **50**;
- avanzamento: **30,56%**;
- ultimo file analizzato: **`docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`**;
- ultimo report: **`TDUI-DOC-REPORT-022`**;
- percorso report: **`../Report documentale/22 - 03-betfair-and-market-reactions-ui.md`**;
- task di modifica aperte: **28**;
- task di modifica completate: **153**.

## Report disponibili

| Sequenza | Documento                                                                        | Report ID             | Percorso                                                                                                                                     | Modularizzazione         |
| -------: | -------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 01       | `README.md`                                                                      | `TDUI-DOC-REPORT-001` | [`../Report documentale/01 - Readme.md`](../Report%20documentale/01%20-%20Readme.md)                                                         | Divisione non necessaria |
| 02       | `docs/tennis-decision-ui/ai/01-context-selection.md`                             | `TDUI-DOC-REPORT-002` | [`../Report documentale/02 - 01-context-selection.md`](../Report%20documentale/02%20-%2001-context-selection.md)                             | Divisione richiesta      |
| 03       | `docs/tennis-decision-ui/ai/02-documentation-conventions.md`                     | `TDUI-DOC-REPORT-003` | [`../Report documentale/03 - 02-documentation-conventions.md`](../Report%20documentale/03%20-%2002-documentation-conventions.md)             | Divisione non necessaria |
| 04       | `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`                            | `TDUI-DOC-REPORT-004` | [`../Report documentale/04 - 03-workflow-esecutivo.md`](../Report%20documentale/04%20-%2003-workflow-esecutivo.md)                           | Divisione richiesta      |
| 05       | `docs/tennis-decision-ui/api/01-match.md`                                        | `TDUI-DOC-REPORT-005` | [`../Report documentale/05 - 01-match.md`](../Report%20documentale/05%20-%2001-match.md)                                                     | Divisione richiesta      |
| 06       | `docs/tennis-decision-ui/api/02-betfair.md`                                      | `TDUI-DOC-REPORT-006` | [`../Report documentale/06 - 02-betfair.md`](../Report%20documentale/06%20-%2002-betfair.md)                                                 | Divisione richiesta      |
| 07       | `docs/tennis-decision-ui/api/03-evidence.md`                                     | `TDUI-DOC-REPORT-007` | [`../Report documentale/07 - 03-evidence.md`](../Report%20documentale/07%20-%2003-evidence.md)                                               | Divisione richiesta      |
| 08       | `docs/tennis-decision-ui/api/04-strategy.md` (rimosso con `CODE-001`)            | `TDUI-DOC-REPORT-008` | [`../Report documentale/08 - 04-strategy.md`](../Report%20documentale/08%20-%2004-strategy.md)                                               | Divisione non necessaria |
| 09       | `docs/tennis-decision-ui/api/04-preflight.md`                                    | `TDUI-DOC-REPORT-009` | [`../Report documentale/09 - 05-preflight.md`](../Report%20documentale/09%20-%2005-preflight.md)                                             | Divisione non necessaria |
| 10       | `docs/tennis-decision-ui/api/05-runtime-health.md`                               | `TDUI-DOC-REPORT-010` | [`../Report documentale/10 - 06-runtime-health.md`](../Report%20documentale/10%20-%2006-runtime-health.md)                                   | Divisione non necessaria |
| 11       | `docs/tennis-decision-ui/architecture/01-system-boundaries.md`                   | `TDUI-DOC-REPORT-011` | [`../Report documentale/11 - 01-system-boundaries.md`](../Report%20documentale/11%20-%2001-system-boundaries.md)                             | Divisione non necessaria |
| 12       | `docs/tennis-decision-ui/architecture/02-data-lifecycle.md`                      | `TDUI-DOC-REPORT-012` | [`../Report documentale/12 - 02-data-lifecycle.md`](../Report%20documentale/12%20-%2002-data-lifecycle.md)                                   | Divisione non necessaria |
| 13       | `docs/tennis-decision-ui/index.md`                                               | `TDUI-DOC-REPORT-013` | [`../Report documentale/13 - index.md`](../Report%20documentale/13%20-%20index.md)                                                           | Divisione non necessaria |
| 14       | `docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md`                | `TDUI-DOC-REPORT-014` | [`../Report documentale/14 - 01-scraper-lifecycle.md`](../Report%20documentale/14%20-%2001-scraper-lifecycle.md)                             | Divisione non necessaria |
| 15       | `docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md`        | `TDUI-DOC-REPORT-015` | [`../Report documentale/15 - 02-technical-sample-validity.md`](../Report%20documentale/15%20-%2002-technical-sample-validity.md)             | Divisione non necessaria |
| 16       | `docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md`         | `TDUI-DOC-REPORT-016` | [`../Report documentale/16 - 01-match-evidence-snapshot.md`](../Report%20documentale/16%20-%2001-match-evidence-snapshot.md)                 | Divisione non necessaria |
| 17       | `docs/tennis-decision-ui/modules/evidence/02-source-identity.md`                 | `TDUI-DOC-REPORT-017` | [`../Report documentale/17 - 02-source-identity.md`](../Report%20documentale/17%20-%2002-source-identity.md)                                 | Divisione non necessaria |
| 18       | `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md`      | `TDUI-DOC-REPORT-018` | [`../Report documentale/18 - 03-quality-flow-and-alignment.md`](../Report%20documentale/18%20-%2003-quality-flow-and-alignment.md)           | Divisione non necessaria |
| 19       | `docs/tennis-decision-ui/modules/evidence/04-market-reactions.md`                | `TDUI-DOC-REPORT-019` | [`../Report documentale/19 - 04-market-reactions.md`](../Report%20documentale/19%20-%2004-market-reactions.md)                               | Divisione non necessaria |
| 20       | `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`                   | `TDUI-DOC-REPORT-020` | [`../Report documentale/20 - 01-session-shell.md`](../Report%20documentale/20%20-%2001-session-shell.md)                                     | Divisione non necessaria |
| 21       | `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`     | `TDUI-DOC-REPORT-021` | [`../Report documentale/21 - 02-live-polling-and-view-model.md`](../Report%20documentale/21%20-%2002-live-polling-and-view-model.md)         | Divisione non necessaria |
| 22       | `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md` | `TDUI-DOC-REPORT-022` | [`../Report documentale/22 - 03-betfair-and-market-reactions-ui.md`](../Report%20documentale/22%20-%2003-betfair-and-market-reactions-ui.md) | Divisione richiesta      |

## Modifiche da applicare

### `README.md`

Report: [`../Report documentale/01 - Readme.md`](../Report%20documentale/01%20-%20Readme.md) — `TDUI-DOC-REPORT-001`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`README-001`** — priorità `low` — Sostituire il requisito generico «versione LTS recente» con una formulazione allineata ai manifest backend e frontend.
- [x] **`README-002`** — priorità `low` — Indicare che `.pending_commits/` e `.writer_authority/` sono sidecar interni a `backend/match_history/`.
- [x] **`README-STYLE-001`** — priorità `editorial` — Sostituire «JSON bounded» con «JSON con output limitato».

### `docs/tennis-decision-ui/ai/01-context-selection.md`

Report: [`../Report documentale/02 - 01-context-selection.md`](../Report%20documentale/02%20-%2001-context-selection.md) — `TDUI-DOC-REPORT-002`.

Modularizzazione: **richiesta**. File proposti: `docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md`.

- [x] **`CTX-001`** — priorità `medium` — Ridurre `01-context-selection.md` alla selezione del contesto e sostituire le sezioni che duplicano il workflow con un rinvio a `03-workflow-esecutivo.md`.
- [x] **`CTX-002`** — priorità `high` — Rendere condizionali `fileModificati.md`, metodo di consegna e report finale; dichiarare che i ruoli read-only non creano `fileModificati.md`.
- [x] **`CTX-003`** — priorità `medium` — Creare `docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md`, spostarvi la sezione di diagnosi e modularizzazione e aggiornare i collegamenti documentali.
- [x] **`CTX-004`** — priorità `medium` — Trasformare i «confini tecnici permanenti» in guardrail condizionali collegati ai rispettivi documenti owner.

### `docs/tennis-decision-ui/ai/02-documentation-conventions.md`

Report: [`../Report documentale/03 - 02-documentation-conventions.md`](../Report%20documentale/03%20-%2002-documentation-conventions.md) — `TDUI-DOC-REPORT-003`.

Modularizzazione: **valutata, non necessaria**.

- [x] **`DOC-CONV-001`** — priorità `high` — Aggiornare nella tabella delle radici il ruolo di `docs/archive/`, dichiarandolo non canonico, preservato, non owner e non prova di implementazione.
- [x] **`DOC-CONV-002`** — priorità `medium` — Eliminare la formula «owner non ancora migrato» e descrivere il caso corrente in cui non esiste ancora un owner canonico.
- [x] **`DOC-CONV-003`** — priorità `high` — Sostituire integralmente la precedente politica di rimozione dell’archive con la policy corrente di conservazione ed esclusione dalle pulizie automatiche o generiche.
- [x] **`DOC-CONV-004`** — priorità `medium` — Rinominare `Migrazione MDX → Markdown` in `Procedura per modifiche documentali`, dichiarare conclusa la migrazione e aggiungere il collegamento al workflow esecutivo.

### `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`

Report: [`../Report documentale/04 - 03-workflow-esecutivo.md`](../Report%20documentale/04%20-%2003-workflow-esecutivo.md) — `TDUI-DOC-REPORT-004`.

Modularizzazione: **richiesta**. File proposti: `docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md`, `docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md`.

- [x] **`WF-DOC-001`** — priorità `high` — Separare i requisiti comuni, quelli delle task che modificano file e quelli delle modalità read-only; aggiornare anche i criteri `PRONTO PER TASK`.
- [x] **`WF-DOC-002`** — priorità `high` — Eliminare `repomix@latest`: usare una versione approvata e dichiarata oppure introdurre, in una task separata, un generatore project-owned.
- [x] **`WF-DOC-003`** — priorità `high` — Definire un artefatto bounded e segmentabile con manifest, ordine, dimensioni e digest, senza inventare soglie prima della decisione dell’utente.
- [x] **`WF-DOC-004`** — priorità `medium` — Definire manifest e output Git richiesti per task di sola cancellazione, senza creare un falso `fileModificati.md`.
- [x] **`WF-DOC-005`** — priorità `high` — Mantenere lifecycle e ruoli in `03-workflow-esecutivo.md`, spostare la diagnosi in `04-diagnosi-e-modularizzazione.md` e gli artefatti esecutivi in `05-artefatti-esecutivi.md`, aggiornando indice e link.
- [x] **`WF-DOC-006`** — priorità `medium` — Rendere gli artefatti di revisione condizionali, distinguere le fasi di chiusura, completare i controlli Git e proteggere gli artefatti locali tramite `.gitignore` quando approvato.

### `docs/tennis-decision-ui/api/01-match.md`

Report: [`../Report documentale/05 - 01-match.md`](../Report%20documentale/05%20-%2001-match.md) — `TDUI-DOC-REPORT-005`.

Modularizzazione: **richiesta**. File proposti: `docs/tennis-decision-ui/api/match/01-read-and-integrity.md`, `docs/tennis-decision-ui/api/match/02-tracking-and-source-identity.md`, `docs/tennis-decision-ui/api/match/03-analysis-and-snapshot.md`.

- [x] **`MATCH-API-001`** — priorità `high` — Correggere la descrizione di `GET /api/match/debug-last`: documentare che non dispone di un producer corrente e restituisce stabilmente il payload legacy, oppure rimuoverlo con la task dedicata già approvata.
- [x] **`MATCH-API-002`** — priorità `high` — Sostituire negli esempi `integrity.reason: commit_incomplete` con il valore canonico `pending_commit` e descrivere separatamente la reason di `recovery_failed`.
- [x] **`MATCH-API-003`** — priorità `high` — Correggere l’esempio della history usando la shape corrente `metadata + history + integrity`, eliminando lo schema obsoleto `eventId + updates`.
- [x] **`MATCH-API-004`** — priorità `high` — Documentare la vista HTTP reale della timeline: normalizzazione di `timeline`, campo derivato `latest`, aggiunta di `integrity` e distinzione rispetto al documento persistito.
- [x] **`MATCH-API-005`** — priorità `high` — Precisare che il codice corrente collassa missing, read failure e JSON invalido a `null`; valutare in una task separata read result strutturati e status HTTP distinti.
- [x] **`MATCH-API-006`** — priorità `high` — Completare il contratto `track/untrack`: aggiungere i due errori SofaScore, documentare il fallback di `betfairMode` e il no-op Untrack senza `eventId`, decidendo se preservare o validare tali comportamenti.
- [x] **`MATCH-API-007`** — priorità `high` — Sostituire in `POST /analyze` la propagazione del messaggio raw con code e messaggi pubblici bounded, mantenendo i dettagli nei log redatti e aggiungendo i relativi test.
- [x] **`MATCH-API-008`** — priorità `high` — Mantenere `01-match.md` come facade, creare tre owner per letture e integrity, tracking e Source Identity, analisi e snapshot; rimuovere il test path inesistente e aggiornare indice, link e sezione di verifica.

### `docs/tennis-decision-ui/api/02-betfair.md`

Report: [`../Report documentale/06 - 02-betfair.md`](../Report%20documentale/06%20-%2002-betfair.md) — `TDUI-DOC-REPORT-006`.

Modularizzazione: **richiesta**. File proposti: `docs/tennis-decision-ui/api/betfair/01-read-integrity-and-health.md`, `docs/tennis-decision-ui/api/betfair/02-money-flow-history.md`, `docs/tennis-decision-ui/api/betfair/03-odds-and-log.md`, `docs/tennis-decision-ui/api/betfair/04-login-window.md`.

- [x] **`BETFAIR-API-001`** — priorità `critical` — Validare `cdpUrl` di `/latest` con `classifyCdpBaseUrl`, rifiutare host non-loopback senza eseguire fetch, aggiornare il contratto read-only e aggiungere test dedicati a input, timeout ed errori.
- [x] **`BETFAIR-API-002`** — priorità `high` — Sostituire negli esempi `integrity.reason: commit_incomplete` con il valore canonico `pending_commit` e distinguere le reason di `recovery_failed`.
- [x] **`BETFAIR-API-003`** — priorità `high` — Documentare la vista timeline HTTP reale: normalizzazione di `timeline`, campo derivato `latest`, aggiunta di `integrity` e distinzione rispetto al documento persistito.
- [x] **`BETFAIR-API-004`** — priorità `high` — Precisare che missing, read failure e JSON invalido vengono collassati a `null`; valutare `loadTimelineResult` e status HTTP distinti coordinando la decisione con `MATCH-API-005`.
- [x] **`BETFAIR-API-005`** — priorità `medium` — Documentare il caso `/latest` con timeline presente ma nessun tick valido: `HTTP 200`, `ok:false`, `latest:null`; distinguere inoltre `latestTimestamp` da `metadata.updatedAt`.
- [x] **`BETFAIR-API-006`** — priorità `high` — Correggere le tolleranze Money Flow: `max(1, 10%)` per il confronto raw/computed e `max(1, 5%)` per runner rispetto al market delta, mantenendo distinti delta negativi e zero-vs-positivo.
- [x] **`BETFAIR-API-007`** — priorità `high` — Mettere in sicurezza `/odds`: eliminare `details: error.message`, usare code e messaggi bounded, validare protocollo e host Betfair e coordinare la correzione con l’eventuale rimozione della route.
- [x] **`BETFAIR-API-008`** — priorità `medium` — Documentare il fallback di `mode`, l’identità runtime e il fatto che il target URL non partecipa alla deduplica; decidere se preservare o modificare tali comportamenti.
- [x] **`BETFAIR-API-009`** — priorità `high` — Mantenere `02-betfair.md` come facade, creare quattro owner per letture/integrity/health, Money Flow, odds/log e login-window; aggiornare indice, link, syntax check e test di verifica.

### `docs/tennis-decision-ui/api/03-evidence.md`

Report: [`../Report documentale/07 - 03-evidence.md`](../Report%20documentale/07%20-%2003-evidence.md) — `TDUI-DOC-REPORT-007`.

Modularizzazione: **richiesta**. File proposti: `docs/tennis-decision-ui/api/evidence/01-latest-snapshot.md`, `docs/tennis-decision-ui/api/evidence/02-source-identity-confirmation.md`.

- [ ] **`EVIDENCE-API-001`** — priorità `high` — Definire un validator `eventId` canonico e condiviso, rifiutando separatori, traversal, caratteri di controllo e lunghezze non ammesse; coordinare API, storage e test. **Riaperta:** API e writer principali usano `backend/src/utils/eventId.js`, ma recovery, `sofaUpdates/commitResult.js` e `commitJournal/recordSchema.js` mantengono validator locali più permissivi.
- [x] **`EVIDENCE-API-002`** — priorità `high` — Sostituire negli esempi `integrity.reason: commit_incomplete` con `pending_commit`, distinguendo la reason aggregata dalle reason specifiche delle due fonti.
- [x] **`EVIDENCE-API-003`** — priorità `medium` — Correggere la semantica di `sofaTimelineFound` e `betfairTimelineFound`: indicano almeno una entry leggibile, non la semplice esistenza del file; valutare una rinomina pubblica.
- [x] **`EVIDENCE-API-004`** — priorità `high` — Distinguere o documentare missing, discovery failure, read failure e JSON invalido; coordinare l’eventuale read result strutturato con `MATCH-API-005` e `BETFAIR-API-004`.
- [x] **`EVIDENCE-API-005`** — priorità `high` — Rimuovere `details: err.message` dal `500` latest, introdurre un code pubblico bounded e mantenere path, URL, token e stack soltanto nei log redatti.
- [x] **`EVIDENCE-API-006`** — priorità `medium` — Decidere come rendere osservabile un confirmation store corrotto o illeggibile nel latest, senza confonderlo silenziosamente con l’assenza di una conferma e senza esporre dettagli interni.
- [x] **`EVIDENCE-API-007`** — priorità `high` — Correggere il mapping degli errori gate: distinguere input, conflitto, race e failure server; mappare persistence e bootstrap failure a `500` con code bounded.
- [x] **`EVIDENCE-API-008`** — priorità `high` — Rendere coerenti conferma e bootstrap scegliendo transazione logica, rollback compensativo o stato esplicito; impedire che una conferma resti applicabile dopo bootstrap fallito.
- [x] **`EVIDENCE-API-009`** — priorità `high` — Rimuovere i percorsi test monolitici assenti, usare i test modulari reali e coprire tutti gli status delle tre route, inclusi latest, fallback, revoke e failure del gate.
- [x] **`EVIDENCE-API-010`** — priorità `high` — Mantenere `03-evidence.md` come facade, creare due owner API per latest e conferma/revoca, lasciare algoritmi e lifecycle ai moduli Evidence esistenti e aggiornare indice e link.

### `docs/tennis-decision-ui/api/04-strategy.md`

Report: [`../Report documentale/08 - 04-strategy.md`](../Report%20documentale/08%20-%2004-strategy.md) — `TDUI-DOC-REPORT-008`.

Modularizzazione: **valutata, non necessaria**. Il documento ha un solo endpoint e una sola feature legacy già approvata per la rimozione; non vengono proposti nuovi file. Destinazione finale: **eliminazione dopo l’applicazione verificata di `CODE-001`**.

- [x] **`STRATEGY-API-001`** — priorità `high` — Riscrivere temporaneamente `04-strategy.md` come contratto di dismissione: superficie ancora attiva, decisione di rimozione, consumer presenti, rischi noti, scope da rimuovere e superfici da preservare; eliminare il documento dopo `CODE-001`.
- [x] **`STRATEGY-API-002`** — priorità `critical` — Dichiarare non canonico il `marketEvidence` della Strategy: il builder bypassa Source Identity, persistence integrity, active market epoch ed eligibility Evidence; non riutilizzarlo e rimuoverlo con la superficie Strategy.
- [x] **`STRATEGY-API-003`** — priorità `high` — Correggere la descrizione semantica: `decision.signal` è disabilitato, ma il payload legacy espone ancora indicatori direzionali come pressure, confidence, money-flow trend, price delta e volume acceleration; non presentarli come Evidence canonica.
- [x] **`STRATEGY-API-004`** — priorità `high` — Registrare i limiti del target context legacy: possibile falso positivo del vincitore del set sul `6-5`, favorito Betfair non necessariamente associato a SofaScore, matching non basato su Source Identity e continuità temporale non garantita da `selectionId`/market epoch.
- [x] **`STRATEGY-API-005`** — priorità `high` — Assorbita da `CODE-001`: la route Strategy e la query `url` sono state rimosse, quindi non esiste più un input Strategy da validare o loggare.
- [x] **`STRATEGY-API-006`** — priorità `high` — Assorbita da `CODE-001`: la route Strategy e la relativa superficie di errori pubblici sono state rimosse.
- [x] **`STRATEGY-API-007`** — priorità `high` — Assorbita da `CODE-001`: eliminato il logging sincrono esclusivo Strategy su `backend_debug.log` insieme alla route.
- [x] **`STRATEGY-API-008`** — priorità `critical` — Applicato `CODE-001`: rimossi route e mount backend, polling e viste Strategy, componenti e moduli esclusivi; preservati Evidence, Market Reactions, Source Identity, Money Flow canonico, tracking e letture Betfair.
- [x] **`STRATEGY-API-009`** — priorità `medium` — Riallineare temporaneamente schema e verifica: tre tab reali, semantica di `header.competition`, disponibilità condizionale di `marketEvidence`, origine mista SofaScore/Betfair, mojibake e test realmente presenti; orientare poi la verifica alla rimozione completa.

### `docs/tennis-decision-ui/api/04-preflight.md`

Report: [`../Report documentale/09 - 05-preflight.md`](../Report%20documentale/09%20-%2005-preflight.md) — `TDUI-DOC-REPORT-009`.

Modularizzazione: **valutata, non necessaria**. I cinque endpoint appartengono alla stessa responsabilità di preflight locale e diagnostico; il documento deve essere accorciato e riallineato agli owner esistenti, senza creare nuovi file.

- [x] **`PREFLIGHT-API-001`** — priorità `high` — Probe CDP bounded con utility condivisa, timeout, abort e reason code distinti per timeout e unreachable; test dedicati aggiunti.
- [x] **`PREFLIGHT-API-002`** — priorità `high` — Introdotto validator SofaScore canonico con HTTPS, host consentiti, event ID e reason bounded; rimosso il logging dell’input raw.
- [x] **`PREFLIGHT-API-003`** — priorità `critical` — Applicato `DEC-020`: validator Betfair unico usato da Preflight, Start, login e `/odds`, con protocollo, host, credenziali, porta, normalizzazione ed event ID coerenti.
- [x] **`PREFLIGHT-API-004`** — priorità `critical` — Applicato `DEC-020`: preflight Graph allineato al parser Python per HTTPS, host, credenziali, porta, path `/0`, `sameMarket` e duplicati.
- [x] **`PREFLIGHT-API-005`** — priorità `high` — Dichiarato esplicitamente che i check Preflight frontend sono advisory e non costituiscono un gate obbligatorio di `Link Accounts & Start`; un gate futuro richiede una decisione dedicata.
- [x] **`PREFLIGHT-API-006`** — priorità `medium` — Inventariati i consumer, rimosso `/api/test/health` e aggiornati i riferimenti correnti a `/api/health`, unica authority Health.
- [x] **`PREFLIGHT-API-007`** — priorità `high` — Completata la contract coverage per CDP, SofaScore, Betfair, Graph, consumer Betfair e comportamento frontend Persistent/CDP advisory.
- [x] **`PREFLIGHT-API-008`** — priorità `medium` — Corretto il mojibake Preflight e sostituita l’esposizione di errori, URL e snippet raw con messaggi bounded.
- [x] **`PREFLIGHT-API-009`** — priorità `medium` — Riscritto e rinominato `04-preflight.md` in forma più compatta, mantenendolo unico owner API, riducendo duplicazioni Graph/Health e documentando authority, limiti correnti, boundedness, stato advisory e verifica effettiva.

### `docs/tennis-decision-ui/api/05-runtime-health.md`

Report: [`../Report documentale/10 - 06-runtime-health.md`](../Report%20documentale/10%20-%2006-runtime-health.md) — `TDUI-DOC-REPORT-010`.

Modularizzazione: **valutata, non necessaria**. Il documento ha un solo endpoint, un solo owner e una shape compatta; richiede una revisione mirata senza nuovi documenti.

- [x] **`RUNTIME-HEALTH-001`** — priorità `high` — Applicato `IMPL-017`: bind backend su loopback e policy positiva Host/Origin locale, con richieste senza Origin preservate e test HTTP reali.
- [x] **`RUNTIME-HEALTH-002`** — priorità `high` — Introdotto response builder puro con allow-list HTTP positiva, normalizzazione e test con campi privati iniettati.
- [x] **`RUNTIME-HEALTH-003`** — priorità `high` — Definito `ok:true` come reachability del backend e allineato il consumer Preflight a `service` e `project`, con messaggi bounded.
- [x] **`RUNTIME-HEALTH-004`** — priorità `medium` — Precisato che `instanceId` è l’ID effimero del processo backend e non tracking session, writer authority o launcher ownership; chiarito che `startedAt` precede recovery e listener readiness.
- [x] **`RUNTIME-HEALTH-005`** — priorità `medium` — Documentata la semantica completa di `pythonProcesses`: conteggio delle entry registrate, `pid` nullable e status come lifecycle del registry, non health funzionale.
- [x] **`RUNTIME-HEALTH-006`** — priorità `medium` — Aggiunto e testato `Cache-Control: no-store` sulla response Health.
- [x] **`RUNTIME-HEALTH-007`** — priorità `medium` — Coordinata `PREFLIGHT-API-006`: rimosso `/api/test/health` e mantenuto `/api/health` come authority canonica.
- [x] **`RUNTIME-HEALTH-008`** — priorità `medium` — Completata la verifica con test di server, registry, response builder, local boundary, `pid:null`, lifecycle, identità frontend e suite launcher.

### `docs/tennis-decision-ui/architecture/01-system-boundaries.md`

Report: [`../Report documentale/11 - 01-system-boundaries.md`](../Report%20documentale/11%20-%2001-system-boundaries.md) — `TDUI-DOC-REPORT-011`.

Modularizzazione: **valutata, non necessaria**. Il documento è già l’owner corretto della mappa dei confini; richiede una revisione mirata per distinguere stato corrente, target approvati e legacy, senza creare nuovi documenti.

- [x] **`ARCH-BOUND-001`** — priorità `high` — Ripristinato l’invariante frontend `/api`: rimosso con `CODE-001` il consumer Strategy con URL backend hard-coded e aggiornata la mappa dei confini allo stato corrente.
- [x] **`ARCH-BOUND-002`** — priorità `critical` — Applicato e documentato `IMPL-017`: bind loopback, Host e Origin locali, richieste diagnostiche senza Origin e rifiuto bounded dei target remoti.
- [x] **`ARCH-BOUND-003`** — priorità `high` — Separate le authority Betfair scraper e login con key/runtime identity, portata e limiti; `IMPL-016` resta approvata ma non implementata.
- [x] **`ARCH-BOUND-004`** — priorità `high` — Aggiunta la matrice corrente/approvato per launcher, writer authority, Source Identity, tracking session, Betfair command authority e confine HTTP locale.
- [x] **`ARCH-BOUND-005`** — priorità `medium` — Separati gli owner Tracking e Source Identity, mantenendo `matchTracker.js` come integratore del gate nel lifecycle live.
- [x] **`ARCH-BOUND-006`** — priorità `high` — Definito il guardrail per probe diagnostici read-only e documentato Betfair latest come probe CDP loopback validato e bounded.
- [x] **`ARCH-BOUND-007`** — priorità `medium` — Ridotte le sequenze operative duplicate a invarianti, con rinvii agli owner Data Lifecycle, Runtime locale e Storage.
- [x] **`ARCH-BOUND-008`** — priorità `medium` — Aggiunta la matrice confine/evidenza automatica con test owner e checker documentali, senza certificare esiti storici.

### `docs/tennis-decision-ui/architecture/02-data-lifecycle.md`

Report: [`../Report documentale/12 - 02-data-lifecycle.md`](../Report%20documentale/12%20-%2002-data-lifecycle.md) — `TDUI-DOC-REPORT-012`.

Modularizzazione: **valutata, non necessaria**. Il documento deve restare un unico lifecycle end-to-end; richiede una revisione mirata che riduca le duplicazioni con gli owner specialistici e renda espliciti i gap di authority e consistenza, senza creare nuovi file.

- [x] **`DATA-LIFE-001`** — priorità `medium` — Documentato l’ordine esatto bootstrap e il piccolo intervallo tra listener readiness e registrazione degli handler, senza dichiarare hardening inesistente.
- [x] **`DATA-LIFE-002`** — priorità `critical` — Distinti Stop live e shutdown terminale, registrando callback Node in-flight e target `IMPL-006`.
- [x] **`DATA-LIFE-003`** — priorità `high` — Separati scrape success, commit success, canonical tick e semantica di `lastSuccessfulScrapeAt`.
- [x] **`DATA-LIFE-004`** — priorità `critical` — Documentata la persistenza pre-bootstrap e la rollback compensativa ora applicata quando il bootstrap fallisce.
- [x] **`DATA-LIFE-005`** — priorità `high` — Precisato lo status-only Graph come nuovo tick timeline con `seq`/`commitId`, history senza append e dati regressivi non adottati.
- [x] **`DATA-LIFE-006`** — priorità `high` — Distinte letture persistite, in memoria e probe diagnostici bounded verso target ammessi.
- [x] **`DATA-LIFE-007`** — priorità `high` — Registrato il gap di provenance temporale e mantenuto `IMPL-018` come target non implementato.
- [x] **`DATA-LIFE-008`** — priorità `high` — Descritte le protezioni differenti dei poller e l’assenza di uno Stop frontend coordinato, collegando `IMPL-006`.
- [x] **`DATA-LIFE-009`** — priorità `medium` — Mantenuto un solo documento, ridotte duplicazioni e aggiunta la matrice stage/owner/evidenza.

### `docs/tennis-decision-ui/index.md`

Report: [`../Report documentale/13 - index.md`](../Report%20documentale/13%20-%20index.md) — `TDUI-DOC-REPORT-013`.

Modularizzazione: **valutata, non necessaria**. L’indice deve restare un unico punto di ingresso della documentazione canonica; la revisione deve correggere authority e manutenzione senza frammentarlo.

- [x] **`INDEX-001`** — priorità `high` — Separate authority dei fatti correnti e authority dei target approvati, richiedendo codice e verifiche per dichiarare implementazione.
- [x] **`INDEX-002`** — priorità `high` — Riallineata `docs/archive/` come radice non canonica, facoltativa, preservata esplicitamente e non soggetta a cleanup generici.
- [x] **`INDEX-003`** — priorità `medium` — Rimosse le note ad hoc sui gap e introdotta una regola unica per owner correnti, finding e registri.
- [x] **`INDEX-004`** — priorità `medium` — Qualificata la roadmap come snapshot legato alla baseline dichiarata internamente.
- [x] **`INDEX-005`** — priorità `low` — Rinominato l’heading permanente in `Fondazione e architettura`, lasciando la migrazione alla validation storica.
- [x] **`INDEX-006`** — priorità `medium` — Aggiunto il contratto di manutenzione dell’indice e i checker obbligatori dopo modifiche strutturali.

### `docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md`

Report: [`../Report documentale/14 - 01-scraper-lifecycle.md`](../Report%20documentale/14%20-%2001-scraper-lifecycle.md) — `TDUI-DOC-REPORT-014`.

Modularizzazione: **valutata, non necessaria**. Spawn, deduplica, runtime identity, terminazione, restore e confine di persistenza appartengono allo stesso lifecycle; va invece rimosso lo storico di collaudo inline e ridotta la duplicazione con gli owner specialistici.

- [x] **`BETFAIR-LIFE-001`** — priorità `critical` — Documentata la deduplica reale per scraper key URL e runtime identity, distinta dalla market authority globale prevista da `IMPL-016`.
- [x] **`BETFAIR-LIFE-002`** — priorità `critical` — Introdotto `trackingSessionId`: la Promise non viene condivisa tra sessioni e una callback stale viene scartata prima di runtime, gate e persistenza; aggiunti i test dedicati.
- [x] **`BETFAIR-LIFE-003`** — priorità `high` — Precisato che `profileDir` è soltanto sottoposto a trim e non rappresenta una physical-profile authority canonica.
- [x] **`BETFAIR-LIFE-004`** — priorità `critical` — Separati nel contratto `executionToken`, Python generation e tracking session authority, senza attribuire alla generation effetti JavaScript.
- [x] **`BETFAIR-LIFE-005`** — priorità `critical` — Corretto il lifecycle mismatch: il gate blocca normalmente il campione causale, ma generation e terminazione Betfair non rendono session-safe SofaScore già in volo.
- [x] **`BETFAIR-LIFE-006`** — priorità `critical` — Rimossi `/api/betfair/odds`, helper e test dedicati; riallineati indice, owner API e documenti collegati.
- [x] **`BETFAIR-LIFE-007`** — priorità `high` — Distinta la normalizzazione di `scraperKey()` dalla validazione backend-owned condivisa di protocollo e host.
- [x] **`BETFAIR-LIFE-008`** — priorità `high` — Corretto il confine read-only e documentato il probe CDP validato loopback e bounded di `/latest`.
- [x] **`BETFAIR-LIFE-009`** — priorità `high` — Il tracking canonico passa sempre `noCache:true` e il runner aggiunge `--no-cache`; copertura aggiornata.
- [x] **`BETFAIR-LIFE-010`** — priorità `high` — Limitato stdout a 4 MiB per default, con errore statico, terminazione del child e test overflow senza esposizione raw.
- [x] **`BETFAIR-LIFE-011`** — priorità `high` — Rimosse le fixture obsolete e concentrata la verifica sul runner corrente, includendo sessione, cache e output bounded.
- [x] **`BETFAIR-LIFE-012`** — priorità `medium` — Rimosso dall’owner il blocco storico `Stato Task 2`, mantenendo il documento sul contratto corrente senza inventare metadata di collaudo.

### `docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md`

Report: [`../Report documentale/15 - 02-technical-sample-validity.md`](../Report%20documentale/15%20-%2002-technical-sample-validity.md) — `TDUI-DOC-REPORT-015`.

Modularizzazione: **valutata, non necessaria**. Classifier, eligibility, repair boundary e status-only formano un unico contratto di validità; va ridotta la duplicazione con storage e separato lo storico di collaudo.

- [x] **`TECH-SAMPLE-001`** — priorità `critical` — Il classifier rifiuta runner non-object/non-array con `runner_invalid`; coperti `null`, primitive e array annidati prima di gate e commit.
- [x] **`TECH-SAMPLE-002`** — priorità `high` — Richiesto `selectionId` presente, normalizzabile e univoco; coperti missing, duplicati e rename con stesso ID.
- [x] **`TECH-SAMPLE-003`** — priorità `critical` — Rimosso il fallback `marketTotalMatched / runnerCount`; il volume assente resta `null` e Money Flow è suppressed.
- [x] **`TECH-SAMPLE-004`** — priorità `high` — Distinto il repair fisico di un commit journalizzato dalla creazione di nuovi dati derivati dal sample tecnico.
- [x] **`TECH-SAMPLE-005`** — priorità `medium` — Documentato il vocabolario reale `regressive_sample`, `regressive_tick` e `duplicate_tick` ai rispettivi livelli.
- [x] **`TECH-SAMPLE-006`** — priorità `high` — Precisato lo status-only con nuovo `seq`/`commitId`, timeline append, history invariata, `marketState` invariato e Money Flow suppressed.
- [x] **`TECH-SAMPLE-007`** — priorità `high` — Distinto il baseline `marketState` dal timestamp di acquisizione `lastSuccessfulScrapeAt`.
- [x] **`TECH-SAMPLE-008`** — priorità `high` — Completata la matrice per classifier, identity, volume unavailable e status-only canonico con `seq`/`commitId`, timeline append e history invariata.
- [x] **`TECH-SAMPLE-009`** — priorità `medium` — Rimossi dall’owner risultati live e dettagli di script storici; le evidenze storiche sono rinviate alle validation.

### `docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md`

Report: [`../Report documentale/16 - 01-match-evidence-snapshot.md`](../Report%20documentale/16%20-%2001-match-evidence-snapshot.md) — `TDUI-DOC-REPORT-016`.

Modularizzazione: **valutata, non necessaria**. Il documento deve restare il composer/facade unico di Evidence; va rafforzato il boundary degli input/errori e ridotta la duplicazione con Source Identity, storage e Market Reactions.

- [x] **`EVID-SNAPSHOT-001`** — priorità `high` — Introdotte viste canoniche Sofa e Betfair; eliminato il fallback wrong-source e filtrati legacy, `seq` non finiti e runner malformed.
- [x] **`EVID-SNAPSHOT-002`** — priorità `high` — Documentato il contratto Betfair-only degradato con Source Identity pending e nessun uso cross-source.
- [x] **`EVID-SNAPSHOT-003`** — priorità `high` — Chiarito che `*TimelineFound` indica almeno una entry caricata, non esistenza del file, e documentata l'assenza di recovery e read-result strutturata.
- [x] **`EVID-SNAPSHOT-004`** — priorità `high` — Il confirmation store resta fail-closed ed espone reason bounded per assenza, JSON/shape/record invalidi, read e lookup failure.
- [x] **`EVID-SNAPSHOT-005`** — priorità `critical` — La confirmation viene persistita dopo bootstrap riuscito; bootstrap o persistenza falliti lasciano il gate pending senza confirmation stale applicabile.
- [x] **`EVID-SNAPSHOT-006`** — priorità `medium` — Definito `metadata.updatedAt` come momento di costruzione, distinto dalla freshness delle fonti.
- [x] **`EVID-SNAPSHOT-007`** — priorità `high` — Sostituiti i path monolitici inesistenti con le suite modulari reali del composer, builder e route.
- [x] **`EVID-SNAPSHOT-008`** — priorità `high` — Documentata e verificata la separazione tra domain snapshot ed envelope HTTP statico e bounded, senza error message raw.
- [x] **`EVID-SNAPSHOT-009`** — priorità `medium` — Definita l'ownership del composer e rinviati algoritmo Source Identity, Graph/Money Flow, Market Reactions e recovery agli owner specialistici.

### `docs/tennis-decision-ui/modules/evidence/02-source-identity.md`

Report: [`../Report documentale/17 - 02-source-identity.md`](../Report%20documentale/17%20-%2002-source-identity.md) — `TDUI-DOC-REPORT-017`.

Modularizzazione: **valutata, non necessaria**. Matching, gate, confirmation ed effective identity appartengono allo stesso dominio; va aggiunta chiarezza sulle authority e separata la validation live storica.

- [x] **`SOURCE-ID-001`** — priorità `critical` — `trackingSessionId` propagata a tracker, gate, observer, Start API e conferma; callback SofaScore e Betfair stale bloccate prima della persistenza.
- [x] **`SOURCE-ID-002`** — priorità `critical` — Gate assente fail-closed nel tracking canonico; Sofa-only esplicitamente `not-applicable`.
- [x] **`SOURCE-ID-003`** — priorità `critical` — La confirmation viene persistita dopo bootstrap riuscito; bootstrap o upsert falliti lasciano il gate pending senza confirmation stale.
- [x] **`SOURCE-ID-004`** — priorità `high` — Il POST di conferma senza gate è rifiutato; conferme persistite disponibili solo per lettura/revoca diagnostica e non come autorità live.
- [x] **`SOURCE-ID-005`** — priorità `high` — Definita e testata la retry policy: nessun retry automatico nella stessa buffer generation, nuovo tentativo dopo cambio contesto e pending manuale ritentabile.
- [x] **`SOURCE-ID-006`** — priorità `high` — Separati input/context e failure infrastrutturali con status e code HTTP bounded.
- [x] **`SOURCE-ID-007`** — priorità `medium` — Documentata la terminazione mismatch scoped e bounded tramite process registry, con escalation sul solo PID registrato e Chrome/CDP preservati.
- [x] **`SOURCE-ID-008`** — priorità `medium` — Rimossa la duplicazione della validation live dall'owner e mantenuto il link alla validation storica.
- [x] **`SOURCE-ID-009`** — priorità `high` — Aggiunta matrice per session authority, gate assente, Sofa-only, callback stale e conferma stale/senza gate; mantenuti i test store/bootstrap/recovery.


### `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md`

Report: [`../Report documentale/18 - 03-quality-flow-and-alignment.md`](../Report%20documentale/18%20-%2003-quality-flow-and-alignment.md) — `TDUI-DOC-REPORT-018`.

Modularizzazione: **valutata, non necessaria**. Qualità, flow e alignment devono restare leggibili insieme per rendere visibili le differenze fra `available`, `fresh`, `reliable`, `aligned` e utilizzabilità cross-source.

- [x] **`QUALITY-FLOW-001`** — priorità `high` — Separati freshness, massima età delle fonti e gap pairwise; fonte mancante non produce più alignment medio.
- [x] **`QUALITY-FLOW-002`** — priorità `high` — Policy clock skew comune a 5 secondi; timestamp futuri oltre tolleranza degradati con reason bounded e test.
- [x] **`QUALITY-FLOW-003`** — priorità `critical` — Predicate Money Flow condiviso basato su `confidence:confirmed`; output suppressed mai reliable e blacklist locale rimossa.
- [x] **`QUALITY-FLOW-004`** — priorità `high` — Predicate ladder condiviso con origine affidabile e ladder non vuota per quality, runner corrente e lookback.
- [x] **`QUALITY-FLOW-005`** — priorità `high` — Documentato il contratto corrente: sotto blocco cross-source resta la quality tecnica raw, mentre `marketEvidence` flow non viene costruito né promosso come diagnostica separata.
- [x] **`QUALITY-FLOW-006`** — priorità `high` — Contratti distinti e nominati: snapshot order 10s e temporal lookback window 30s, con input e semantiche separate.
- [x] **`QUALITY-FLOW-007`** — priorità `high` — Temporal alignment espone `available`, `reliable` e reason basate su freshness, Graph, ladder e book.
- [x] **`QUALITY-FLOW-008`** — priorità `medium` — Centralizzati reason e predicate persistence; rimosso il parametro `integrity` inutilizzato da `buildNoTradeReasons`.
- [x] **`QUALITY-FLOW-009`** — priorità `high` — Predicate book condiviso tra quality, runner flow, runner Evidence e temporal; matrice zero/negativi/crossed/one-sided.
- [x] **`QUALITY-FLOW-010`** — priorità `high` — Creato il test temporal canonico, corretti fixture/signature runnerFlow e aggiunta la matrice completa di regressione.

### `docs/tennis-decision-ui/modules/evidence/04-market-reactions.md`

Report: [`../Report documentale/19 - 04-market-reactions.md`](../Report%20documentale/19%20-%2004-market-reactions.md) — `TDUI-DOC-REPORT-019`.

Modularizzazione: **valutata, non necessaria**. Significant Flow, Market → Field e Field → Market appartengono allo stesso owner Market Reactions e devono restare confrontabili nello stesso documento.

- [x] **`MARKET-REACT-001`** — priorità `high` — Distinte attività Exchange isolata e osservazione temporale; documentati i livelli che possiedono `causalityClaimed:false` e ripristinato il disclaimer Market → Field.
- [x] **`MARKET-REACT-002`** — priorità `critical` — Significant Flow usa confidence condivisa e tolleranza producer-compatible; rimossa la blacklist locale come authority.
- [x] **`MARKET-REACT-003`** — priorità `critical` — Flow suppressed o senza Graph, ladder reale o selection ID resta invalidato e non diventa sourceMarketEvent.
- [x] **`MARKET-REACT-004`** — priorità `high` — Market → Field applica max age 240s, clock skew 5s e configurazione window normalizzata con reason bounded.
- [x] **`MARKET-REACT-005`** — priorità `high` — Separati `marketResponseObserved`, `marketResponseReliable` e `reliabilityReasons` fino al summary parent.
- [x] **`MARKET-REACT-006`** — priorità `medium` — Chiarito che quality di window e summary sono coverage quality locali e non la Data Quality globale dello snapshot.
- [x] **`MARKET-REACT-007`** — priorità `medium` — Documentate separatamente pipeline available, large flow, disponibilità dei due rami e response observed.
- [x] **`MARKET-REACT-008`** — priorità `high` — Card basate su `evidence.available`; reason parent backend-owned rese visibili senza ricostruzione frontend.
- [x] **`MARKET-REACT-009`** — priorità `high` — Mapping frontend riallineato ai campi backend, marker array-safe e disclaimer causality verificato dal view model.
- [x] **`MARKET-REACT-010`** — priorità `high` — Aggiunte suite Significant Flow e view model, corretti i command path e coperti suppression, tolerance, recency, reliability e UI mapping.

### `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`

Report: [`../Report documentale/20 - 01-session-shell.md`](../Report%20documentale/20%20-%2001-session-shell.md) — `TDUI-DOC-REPORT-020`.

Modularizzazione: **valutata, non necessaria**. Start, stato confirmed/active, poller activation, Source Identity, bootstrap, dashboard e Stop formano un unico lifecycle frontend.

- [x] **`FRONT-SESSION-001`** — priorità `high` — Dichiarato nel lifecycle frontend che il Preflight è opzionale e advisory e non autorizza né blocca Start; sequenza documentale corretta.
- [x] **`FRONT-SESSION-002`** — priorità `critical` — Sessione promoted soltanto dopo `/track` riuscito con rollback completo su failure.
- [x] **`FRONT-SESSION-003`** — priorità `critical` — Introdotta `sessionActive` come authority comune; poller disabilitati senza sessione attiva.
- [x] **`FRONT-SESSION-004`** — priorità `critical` — Bootstrap legato al `trackingSessionId` corrente e completabile soltanto dopo reset e nuovi dati.
- [x] **`FRONT-SESSION-005`** — priorità `high` — Risultati bounded per Start/Login/Stop, stato Start failure e parsing Stop safe.
- [x] **`FRONT-SESSION-006`** — priorità `high` — Conferma chiusa soltanto dopo refresh live `recording/aligned` della stessa sessione.
- [x] **`FRONT-SESSION-007`** — priorità `high` — Decline attende Stop e conserva modale/errore in caso di fallimento.
- [x] **`FRONT-SESSION-008`** — priorità `medium` — Confermato il modello full path e rimossi gli stati `chromeProfileName` legacy.
- [x] **`FRONT-SESSION-009`** — priorità `high` — Aggiunto persistence view state read-only uniforme senza accesso frontend allo storage.
- [x] **`FRONT-SESSION-010`** — priorità `high` — Aggiunte suite lifecycle per Start authority, bootstrap, Source Identity e persistence view state.

### `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`

Report: [`../Report documentale/21 - 02-live-polling-and-view-model.md`](../Report%20documentale/21%20-%2002-live-polling-and-view-model.md) — `TDUI-DOC-REPORT-021`.

Modularizzazione: **valutata, non necessaria**. Match, Betfair, Evidence e Source Identity devono restare nello stesso facade comparativo per verificare session safety, freshness e current-vs-last-known.

- [x] **`FRONT-POLL-001`** — priorità `critical` — Match e Betfair usano AbortController, poll generation, request ID, ownership e stale-response guard distinti dal trackingSessionId backend.
- [x] **`FRONT-POLL-002`** — priorità `high` — Timer e richieste vengono cancellati su Stop/cleanup; nessun reschedule residuo e Resume idempotente.
- [x] **`FRONT-POLL-003`** — priorità `critical` — Dati current azzerati su waiting/degraded/error e ultimi valori conservati soltanto come lastKnownData esplicito.
- [x] **`FRONT-POLL-004`** — priorità `critical` — `dashboardData` viene azzerato con `backendData` null; il mapping precedente resta separato come last-known.
- [x] **`FRONT-POLL-005`** — priorità `high` — Evidence preserva latest, integrity, sources e persistenceComplete anche nei 404 e li propaga al view state e a Market Reactions.
- [x] **`FRONT-POLL-006`** — priorità `high` — Separati `sourceUpdatedAt` e `fetchedAt`; `lastUpdate` è soltanto alias compatibile del source time.
- [x] **`FRONT-POLL-007`** — priorità `high` — Fallback Betfair reso atomico senza riuso di health/history precedenti e coperto da test.
- [x] **`FRONT-POLL-008`** — priorità `high` — Connessioni basate su read status corrente; payload stale non produce connected o ok.
- [x] **`FRONT-POLL-009`** — priorità `high` — Contatori locali rinominati `pollGeneration` e distinti formalmente dall'autorità backend.
- [x] **`FRONT-POLL-010`** — priorità `critical` — Aggiunti test lifecycle React e StrictMode per abort, stale response, Stop/Resume, evento vuoto, fallback Betfair, Evidence e Gate.

### `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`

Report: [`../Report documentale/22 - 03-betfair-and-market-reactions-ui.md`](../Report%20documentale/22%20-%2003-betfair-and-market-reactions-ui.md) — `TDUI-DOC-REPORT-022`.

Modularizzazione: **completata**. `03-betfair-and-market-reactions-ui.md` resta la facade; sono stati creati `docs/tennis-decision-ui/modules/frontend/05-betfair-depth-and-health-ui.md` e `docs/tennis-decision-ui/modules/frontend/06-market-reactions-ui.md`; il lifecycle Source Identity resta owner di `01-session-shell.md`.

- [x] **`FRONT-BETFAIR-001`** — priorità `high` — Persistence/read status collegati a BetfairDepthCard e MarketReactionsPage mantenendo health e Source Identity separati e senza storage details.
- [x] **`FRONT-BETFAIR-002`** — priorità `high` — Asse e barre usano lo stesso massimo normalizzato e la scala condivisa tra runner.
- [x] **`FRONT-BETFAIR-003`** — priorità `high` — Tooltip assente per empty/invalid/anomaly e zero reale preservato come osservazione distinta.
- [x] **`FRONT-BETFAIR-004`** — priorità `high` — Price, size e matched mancanti resi come `—`; zero reale non confuso con null.
- [x] **`FRONT-BETFAIR-005`** — priorità `high` — Rimossa la label hard-coded; card collegata a polling, Stop, waiting, error e persistence reali.
- [x] **`FRONT-BETFAIR-006`** — priorità `high` — Read status, last-known data/history e source timestamp inoltrati alla card con label non-current.
- [x] **`FRONT-BETFAIR-007`** — priorità `medium` — Documento allineato ai campi reali; `graphLoginRequiredUrl` mantenuto come diagnostica redatta e vietata l'introduzione di campi raw non approvati.
- [x] **`FRONT-BETFAIR-008`** — priorità `high` — Aggiunta suite JSX per MoneyFlowChart, runner, card, Health Debug e Market Reactions con integrity/current-vs-stale.
- [x] **`FRONT-BETFAIR-009`** — priorità `medium` — Facade mantenuta, creati i due owner derivati e aggiornati index, context selection, repository owner map e link senza duplicare Source Identity.

## Riepilogo task di modifica

| Stato                        | Numero  |
| ---------------------------- | ------: |
| Da applicare `[ ]`           | 0       |
| Applicate e verificate `[x]` | 180     |
| Riaperta dopo verifica semantica `[ ]` | 1 |
| **Totale**                   | **181** |

## Riepilogo per area

| Area                      | File `.md` |
| ------------------------- | ---------: |
| `.`                       | 3          |
| `docs/tennis-decision-ui` | 37         |
| `docs/validations`        | 4          |
| `docs/archive`            | 0          |
| `implementazioni`         | 27         |
| `scripts/validation`      | 1          |
| **Totale**                | **72**     |

## Riepilogo per directory

| Directory                                  | File `.md` |
| ------------------------------------------ | ---------: |
| `.`                                        | 3          |
| `docs/tennis-decision-ui`                  | 1          |
| `docs/tennis-decision-ui/ai`               | 3          |
| `docs/tennis-decision-ui/api`              | 6          |
| `docs/tennis-decision-ui/architecture`     | 2          |
| `docs/tennis-decision-ui/modules/betfair`  | 2          |
| `docs/tennis-decision-ui/modules/evidence` | 4          |
| `docs/tennis-decision-ui/modules/frontend` | 4          |
| `docs/tennis-decision-ui/modules/python`   | 4          |
| `docs/tennis-decision-ui/modules/sofa`     | 2          |
| `docs/tennis-decision-ui/modules/storage`  | 2          |
| `docs/tennis-decision-ui/operations`       | 5          |
| `docs/tennis-decision-ui/reference`        | 1          |
| `docs/tennis-decision-ui/roadmap`          | 1          |
| `docs/validations`                         | 4          |
| `implementazioni`                          | 9          |
| `implementazioni/audit-codice`             | 7          |
| `implementazioni/audit-documentazione`     | 4          |
| `implementazioni/implementazioni-proposte` | 7          |
| `scripts/validation`                       | 1          |

# Inventario completo in ordine di audit

| Indice | Documento                                                                          | Stato             | Report                                                                                                                                       | Modularizzazione         |
| -----: | ---------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1      | `README.md`                                                                        | **ANALIZZATO**    | [`../Report documentale/01 - Readme.md`](../Report%20documentale/01%20-%20Readme.md)                                                         | Divisione non necessaria |
| 2      | `docs/tennis-decision-ui/ai/01-context-selection.md`                               | **ANALIZZATO**    | [`../Report documentale/02 - 01-context-selection.md`](../Report%20documentale/02%20-%2001-context-selection.md)                             | Divisione richiesta      |
| 3      | `docs/tennis-decision-ui/ai/02-documentation-conventions.md`                       | **ANALIZZATO**    | [`../Report documentale/03 - 02-documentation-conventions.md`](../Report%20documentale/03%20-%2002-documentation-conventions.md)             | Divisione non necessaria |
| 4      | `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`                              | **ANALIZZATO**    | [`../Report documentale/04 - 03-workflow-esecutivo.md`](../Report%20documentale/04%20-%2003-workflow-esecutivo.md)                           | Divisione richiesta      |
| 5      | `docs/tennis-decision-ui/api/01-match.md`                                          | **ANALIZZATO**    | [`../Report documentale/05 - 01-match.md`](../Report%20documentale/05%20-%2001-match.md)                                                     | Divisione richiesta      |
| 6      | `docs/tennis-decision-ui/api/02-betfair.md`                                        | **ANALIZZATO**    | [`../Report documentale/06 - 02-betfair.md`](../Report%20documentale/06%20-%2002-betfair.md)                                                 | Divisione richiesta      |
| 7      | `docs/tennis-decision-ui/api/03-evidence.md`                                       | **ANALIZZATO**    | [`../Report documentale/07 - 03-evidence.md`](../Report%20documentale/07%20-%2003-evidence.md)                                               | Divisione richiesta      |
| 8      | `docs/tennis-decision-ui/api/04-strategy.md`                                       | **ANALIZZATO**    | [`../Report documentale/08 - 04-strategy.md`](../Report%20documentale/08%20-%2004-strategy.md)                                               | Divisione non necessaria |
| 9      | `docs/tennis-decision-ui/api/04-preflight.md`                                      | **ANALIZZATO**    | [`../Report documentale/09 - 05-preflight.md`](../Report%20documentale/09%20-%2005-preflight.md)                                             | Divisione non necessaria |
| 10     | `docs/tennis-decision-ui/api/05-runtime-health.md`                                 | **ANALIZZATO**    | [`../Report documentale/10 - 06-runtime-health.md`](../Report%20documentale/10%20-%2006-runtime-health.md)                                   | Divisione non necessaria |
| 11     | `docs/tennis-decision-ui/architecture/01-system-boundaries.md`                     | **ANALIZZATO**    | [`../Report documentale/11 - 01-system-boundaries.md`](../Report%20documentale/11%20-%2001-system-boundaries.md)                             | Divisione non necessaria |
| 12     | `docs/tennis-decision-ui/architecture/02-data-lifecycle.md`                        | **ANALIZZATO**    | [`../Report documentale/12 - 02-data-lifecycle.md`](../Report%20documentale/12%20-%2002-data-lifecycle.md)                                   | Divisione non necessaria |
| 13     | `docs/tennis-decision-ui/index.md`                                                 | **ANALIZZATO**    | [`../Report documentale/13 - index.md`](../Report%20documentale/13%20-%20index.md)                                                           | Divisione non necessaria |
| 14     | `docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md`                  | **ANALIZZATO**    | [`../Report documentale/14 - 01-scraper-lifecycle.md`](../Report%20documentale/14%20-%2001-scraper-lifecycle.md)                             | Divisione non necessaria |
| 15     | `docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md`          | **ANALIZZATO**    | [`../Report documentale/15 - 02-technical-sample-validity.md`](../Report%20documentale/15%20-%2002-technical-sample-validity.md)             | Divisione non necessaria |
| 16     | `docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md`           | **ANALIZZATO**    | [`../Report documentale/16 - 01-match-evidence-snapshot.md`](../Report%20documentale/16%20-%2001-match-evidence-snapshot.md)                 | Divisione non necessaria |
| 17     | `docs/tennis-decision-ui/modules/evidence/02-source-identity.md`                   | **ANALIZZATO**    | [`../Report documentale/17 - 02-source-identity.md`](../Report%20documentale/17%20-%2002-source-identity.md)                                 | Divisione non necessaria |
| 18     | `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md`        | **ANALIZZATO**    | [`../Report documentale/18 - 03-quality-flow-and-alignment.md`](../Report%20documentale/18%20-%2003-quality-flow-and-alignment.md)           | Divisione non necessaria |
| 19     | `docs/tennis-decision-ui/modules/evidence/04-market-reactions.md`                  | **ANALIZZATO**    | [`../Report documentale/19 - 04-market-reactions.md`](../Report%20documentale/19%20-%2004-market-reactions.md)                               | Divisione non necessaria |
| 20     | `docs/tennis-decision-ui/modules/frontend/01-session-shell.md`                     | **ANALIZZATO**    | [`../Report documentale/20 - 01-session-shell.md`](../Report%20documentale/20%20-%2001-session-shell.md)                                     | Divisione non necessaria |
| 21     | `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`       | **ANALIZZATO**    | [`../Report documentale/21 - 02-live-polling-and-view-model.md`](../Report%20documentale/21%20-%2002-live-polling-and-view-model.md)         | Divisione non necessaria |
| 22     | `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`   | **ANALIZZATO**    | [`../Report documentale/22 - 03-betfair-and-market-reactions-ui.md`](../Report%20documentale/22%20-%2003-betfair-and-market-reactions-ui.md) | Divisione richiesta      |
| 23     | `docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md`                  | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 24     | `docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md`             | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 25     | `docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md`                   | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 26     | `docs/tennis-decision-ui/modules/python/03-betfair-scraper.md`                     | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 27     | `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md`        | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 28     | `docs/tennis-decision-ui/modules/sofa/01-live-tracking.md`                         | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 29     | `docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md`      | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 30     | `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md`              | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 31     | `docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md`        | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 32     | `docs/tennis-decision-ui/operations/01-local-runtime.md`                           | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 33     | `docs/tennis-decision-ui/operations/02-live-tracking-control.md`                   | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 34     | `docs/tennis-decision-ui/operations/03-betfair-diagnostics.md`                     | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 35     | `docs/tennis-decision-ui/operations/04-validation-and-rollback.md`                 | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 36     | `docs/tennis-decision-ui/operations/05-retention-and-cleanup.md`                   | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 37     | `docs/tennis-decision-ui/reference/01-repository-map.md`                           | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 38     | `docs/tennis-decision-ui/roadmap/01-current-state.md`                              | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 39     | `docs/validations/README.md`                                                       | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 40     | `docs/validations/betfair-live-validation-2026-07-04.md`                           | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 41     | `docs/validations/documentation-migration-finalization-2026-08-03.md`              | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 42     | `docs/validations/source-identity-live-verification.md`                            | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 43     | `implementazioni-tennis-decision-ui.md`                                            | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 44     | `implementazioni/00-metodo-e-stati.md`                                             | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 45     | `implementazioni/01-piano-generale-audit.md`                                       | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 46     | `implementazioni/02-audit-documentazione.md`                                       | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 47     | `implementazioni/03-audit-codice.md`                                               | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 48     | `implementazioni/04-task-completate.md`                                            | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 49     | `implementazioni/05-audit-docs-planning.md`                                        | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 50     | `implementazioni/06-implementazioni-proposte.md`                                   | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 51     | `implementazioni/99-decisioni-utente.md`                                           | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 52     | `implementazioni/README.md`                                                        | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 53     | `implementazioni/audit-codice/01-rilievi-iniziali.md`                              | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 54     | `implementazioni/audit-codice/02-runtime-sessioni-betfair.md`                      | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 55     | `implementazioni/audit-codice/03-storage-recovery.md`                              | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 56     | `implementazioni/audit-codice/04-evidence-market-reactions.md`                     | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 57     | `implementazioni/audit-codice/05-frontend-session-shell.md`                        | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 58     | `implementazioni/audit-codice/06-validazione-e-test.md`                            | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 59     | `implementazioni/audit-codice/07-post-audit-e-migrazione.md`                       | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 60     | `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md`                | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 61     | `implementazioni/audit-documentazione/02-moduli-frontend-python.md`                | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 62     | `implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md`        | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 63     | `implementazioni/audit-documentazione/04-processo-e-materiali-storici.md`          | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 64     | `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md`           | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 65     | `implementazioni/implementazioni-proposte/02-runtime-betfair.md`                   | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 66     | `implementazioni/implementazioni-proposte/03-storage-recovery.md`                  | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 67     | `implementazioni/implementazioni-proposte/04-evidence-provenance.md`               | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 68     | `implementazioni/implementazioni-proposte/05-frontend-session-polling.md`          | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 69     | `implementazioni/implementazioni-proposte/06-validazione-e-fixture.md`             | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 70     | `implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md`  | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 71     | `scripts/validation/README.md`                                                     | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
| 72     | `todo-list-tennis-decision-ui.md`                                                  | **DA ANALIZZARE** | —                                                                                                                                            | Da valutare              |
 
## Nuovo JSON incrementale delle modifiche

Da questo report viene usato:

```text
modifiche-audit-markdown.json
```

Regole:

- parte da `TDUI-DOC-REPORT-008`;
- contiene soltanto report e task dal report 008 in avanti;
- non duplica le 44 task dei report 001–007;
- non contiene l’inventario completo dei 72 file;
- conserva stato, priorità, checkbox, modularizzazione e riferimenti al report;
- viene esteso dopo ogni futura analisi;
- il Markdown resta l’autorità dell’inventario e dell’ordine di audit.

## Verifica del pacchetto

```text
file Markdown totali: 72
file analizzati: 22
file da analizzare: 50
report completi salvati: 22
task di modifica totali: 181
task con checkbox: 181
task completate: 180
definizione di analizzare presente nella mappa Markdown: sì
definizione di analizzare presente nei report: no
valutazione modularizzazione completata sui file analizzati: sì
ordine canonico mantenuto nell’inventario Markdown: sì
nuovo JSON limitato alle modifiche dal report 008 in avanti: sì
report completi duplicati nella mappa o nel JSON: no
esito: PASS
```

## Regola per i prossimi aggiornamenti

Dopo ogni nuova analisi:

1. applicare integralmente la definizione di “analizzare” riportata sopra;
2. creare il report completo dentro `../Report documentale/`;
3. assegnare un `report_id` univoco;
4. registrare la valutazione di modularizzazione;
5. aggiornare questo Markdown completo con report, task, contatori e inventario;
6. registrare ogni modifica proposta come task con checkbox `- [ ]`;
7. aggiungere al solo `modifiche-audit-markdown.json` il nuovo report e le nuove task, senza ricopiare l’inventario dei 72 file né le task precedenti al report 008;
8. impostare nel JSON `completed: false` finché la task non è applicata e verificata;
9. aggiornare contatori, ultimo documento, prossimo indice e prossimo documento;
10. aggiornare nell’inventario completo la riga del documento appena analizzato con stato, report e modularizzazione;
11. non aggiornare più il precedente JSON completo: resta una fotografia storica fino al report 007.
