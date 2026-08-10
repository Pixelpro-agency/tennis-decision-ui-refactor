# Persistenza Betfair

## Scopo

Definire decisione, preparation, commit e stato condiviso del writer Betfair canonico.

## Stato

Il processor Betfair è l'owner del commit canonico. `prepareBetfairHistory()` costruisce il candidato; `addBetfairUpdate()` resta una facade legacy prepare-only.

## Responsabilità

Questo owner governa la decisione di append, la rappresentazione persistibile Betfair, la costruzione dei candidati history/timeline e la promozione dello stato committed. Non decide se uno scraper debba partire e non ridefinisce la validità tecnica del campione.

## Flusso di persistenza

```text
sample tecnicamente classificato
→ canonical timeline filtrata
→ decisione append/status-only/unchanged/repair
→ preparation senza promozione
→ pending journal
→ history e timeline
→ verifica e complete
→ promozione latestBetfairState committed
```

## Decisione e rappresentazione

I campioni tecnicamente inutilizzabili non avviano scritture, salvo repair pendente. Deduplicazione e regressione operano sulla timeline canonica filtrata.

Nella history `selectionId` identifica il runner, l'ordinamento è deterministico, missing e zero restano distinti, `matchedTotal` e `totalMatchedOnSelection` restano separati e Money Flow assente non diventa un valore zero sintetico.

La comparazione è indipendente dall'ordine dell'array. Un cambio di nome non sostituisce l'identità `selectionId`; runner omonimi o riordinati non vengono fusi. Valori assenti restano assenti anche nella representation usata per la deduplica.

### Campioni status-only

Un campione regressivo usato soltanto per aggiornare lo stato tecnico non viene aggiunto alla timeline canonica e non sostituisce la projection Betfair committed che una futura riga SofaScore può incorporare.

## Stato committed

La preparation restituisce una projection candidata ma non aggiorna `latestBetfairState`. La promotion avviene soltanto dopo il commit completo. Failure, partial e status-only regressivo non contaminano future row SofaScore.

```text
sample observed
→ decision
→ candidate prepared
→ commit complete
→ latestBetfairState promoted

sample observed
→ failure / partial / status-only regressivo
→ latestBetfairState invariato
```

## Letture e commit

La timeline usa `loadTimelineResult()`. Solo `missing` consente il bootstrap; invalid JSON/shape, errori di discovery/read e target multipli impediscono la ricostruzione da zero.

Il flusso è: decisione, preparation, pending journal, history, timeline, completamento journal e infine promotion dello stato committed. Recovery e retry usano il payload journalizzato.

## Failure e recovery

Failure e partial commit non modificano `latestBetfairState` condiviso. La recovery completa può promuovere lo stato soltanto dopo aver verificato gli artefatti journalizzati. Un completed residual non viene eliminato sulla sola presenza di JSON parsabile.

La canonical timeline usata per deduplica esclude campioni tecnicamente inutilizzabili e preserva il confine fra market total e totale del singolo runner.

## Confini

Questo owner non governa scraping, login, polling o UI. La validità tecnica del sample viene decisa a monte; journal e recovery mantengono owner separato.

## Riferimenti implementativi

```text
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/processor/persistence.js
backend/src/sofa/betfair/processor/persistenceDecision.js
backend/src/sofa/betfair/processor/persistenceDocuments.js
backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js
backend/src/sofa/betfair/processor/canonicalTimeline.js
```

### Decision matrix

| Sample                      | Repair | Azione                               |
| --------------------------- | ------ | ------------------------------------ |
| utilizzabile e materiale    | no     | prepare e commit                     |
| utilizzabile ma duplicato   | no     | `unchanged`                          |
| tecnicamente inutilizzabile | no     | nessuna scrittura canonica           |
| status-only regressivo      | no     | health/status, nessuna promotion     |
| qualunque                   | sì     | recovery dal journal, non dal sample |

### Runner representation

```json
{
  "selectionId": "identity primaria",
  "matchedTotal": "valore matched del runner conservato dal pipeline",
  "totalMatchedOnSelection": "totale matched associato alla selection",
  "moneyFlow": "missing distinto da zero"
}
```

Il totale complessivo del mercato appartiene a `market_info.total_matched`/alla relativa projection di mercato: non va confuso con i due campi del runner.

## Verifica

Eseguire `betfairUpdates.test.mjs` e le suite processor `persistenceCommit`, `persistenceRecovery` e `canonicalTimeline`.

## Documenti collegati

- [Timeline e history](./01-timelines-and-history.md)
- [Commit journal e recovery](./02-commit-journal-and-recovery.md)
- [Validità tecnica dei campioni Betfair](../betfair/02-technical-sample-validity.md)
- [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
- [Scraper Betfair Python](../python/03-betfair-scraper.md)
- [API Betfair](../../api/02-betfair.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
