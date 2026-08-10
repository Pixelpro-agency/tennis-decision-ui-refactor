# Betfair Depth e health UI

## Scopo

Questo documento è l'owner dettagliato delle superfici Betfair Depth, Money Flow, health e persistence presentation. La facade resta [UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md).

## Componenti

```txt
BetfairDepthCard.jsx
betfair/BetfairRunnerDepth.jsx
betfair/MoneyFlowChart.jsx
betfair/BetfairHealthDebugPanel.jsx
BetfairHealthToast.jsx
```

## Stato della card

`BetfairDepthCard` riceve:

```txt
data
lastKnownData
history
lastKnownHistory
health
healthTransition
persistenceViewState
readStatus
isPolling
trackingStopped
sourceUpdatedAt
```

Priorità presentazionale:

```txt
trackingStopped → Live tracking stopped
last-known visibile → Last known Betfair data — not current
degraded → Persistence incomplete
error → Unable to load current Betfair data
waiting → Waiting for Betfair Exchange data
polling corrente → Polling active
altro → Betfair polling inactive
```

Il last-known è mostrato soltanto con `readStatus=degraded|error` e con una label esplicita. Non viene presentato come live.

## Dati mancanti

Price, size e matched mantengono la differenza tra assenza e zero:

```txt
null | undefined | stringa vuota → —
zero osservato → 0 oppure 0.00
numero valido → valore formattato
```

`formatObservedPrice()`, `formatObservedAmount()` e `formatMarketTotalMatched()` applicano questo contratto.

## Money Flow

Il grafico mostra esclusivamente `matchedVolume` neutro.

`getMoneyFlowAxisMax()` produce un solo massimo normalizzato, usato sia dalle etichette dell'asse sia dall'altezza delle barre. La scala è condivisa tra runner.

`getMatchedVolumeObservation()` distingue:

```txt
zero reale e valido → osservazione disponibile, tooltip 0 EUR
emptySlot → non disponibile
invalidVolume → non disponibile
anomaly → non disponibile
validForDisplay=false → non disponibile
```

Gli stati non disponibili non producono tooltip numerici né barre sintetiche.

## Health e persistence

Health, persistence, freshness e Source Identity sono assi distinti.

- `health` governa alert e pannello diagnostico;
- `persistenceViewState` governa la degradazione della persistenza;
- `readStatus` dichiara se il dato è current, waiting, degraded o error;
- Source Identity non viene ricostruita dalla card.

La UI non mostra `commitId`, path o journal e non offre recovery client-side.

## Debug panel

`BetfairHealthDebugPanel` mostra soltanto campi approvati. `graphLoginRequiredUrl` è accettato esclusivamente come valore già redatto a monte. Non aggiungere cookie, token, header, target CDP o URL raw non approvati.

## Riferimenti implementativi

```text
frontend/src/components/BetfairDepthCard.jsx
frontend/src/components/betfair/BetfairRunnerDepth.jsx
frontend/src/components/betfair/MoneyFlowChart.jsx
frontend/src/components/betfair/BetfairHealthDebugPanel.jsx
frontend/src/components/BetfairHealthToast.jsx
frontend/src/utils/betfairMoneyFlow.js
```

```text
Betfair read model
→ current / last-known / unavailable
→ runner identity per selectionId
→ ladder e Money Flow
→ health e persistence separati
→ card + debug panel redatto
```

| Stato                 | Presentazione                         |
| --------------------- | ------------------------------------- |
| current valido        | valori correnti                       |
| last-known            | etichetta non corrente                |
| sample inutilizzabile | reason tecnica, nessun zero sintetico |
| integrity degradata   | warning separato dalla connessione    |
| dati assenti          | empty state, non quote `0`            |

## Test

```bash
npm.cmd run test:components
node src/utils/betfairMoneyFlow.test.mjs
node src/hooks/useBetfairJson.test.mjs
npm.cmd run build
```

La suite component-level copre scala, tooltip, null/zero, lifecycle della card, last-known e debug URL redatto.

## Collegamenti

- [Facade UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md)
- [Polling e view model](./02-live-polling-and-view-model.md)
- [API Betfair](../../api/02-betfair.md)
- [Validità tecnica dei campioni](../betfair/02-technical-sample-validity.md)
