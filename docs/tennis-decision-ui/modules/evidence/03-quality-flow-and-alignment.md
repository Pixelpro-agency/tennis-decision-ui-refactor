# Qualità, flow e allineamento

## Scopo

Questo modulo documenta come Evidence descrive disponibilità, freschezza, affidabilità tecnica, tradabilità e relazione temporale dei dati. Non genera segnali operativi e non deduce causalità fra campo e mercato.

```txt
available ≠ fresh ≠ reliable ≠ cross-source allowed
temporal proximity ≠ causality
```

Il layer è read-only: non esegue fetch, scraping, recovery o scritture su history, timeline e journal.

## Implementazione

```txt
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/matchEvidence/alignment.js
backend/src/sofa/matchEvidence/alignmentExtension.js
backend/src/sofa/matchEvidence/qualityPredicates.js
backend/src/sofa/matchEvidence/persistenceQuality.js
backend/src/sofa/matchEvidence/noTradeReasons.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/marketFlowEvidence.js
backend/src/sofa/marketFlowEvidence/
backend/src/sofa/sofaEventMarkers.js
backend/src/sofa/temporalAlignmentEvidence.js
backend/src/sofa/temporalAlignment/
```

| Area                  | Responsabilità corrente                                       |
| --------------------- | ------------------------------------------------------------- |
| `dataQuality.js`      | Recency, Graph health, ladder, Money Flow, book e persistenza |
| `alignment.js`        | Età delle fonti, gap pairwise e freshness aggregata           |
| `marketFlowEvidence/` | Flow descrittivo, confronto prezzi e riepilogo runner         |
| `sofaEventMarkers.js` | Marker descrittivi del contesto SofaScore                     |
| `temporalAlignment/`  | Relazione temporale diagnostica sul lookback                  |
| `noTradeReasons.js`   | Motivi sintetici che impediscono l’uso operativo              |
| `evidenceBuilder.js`  | Scoping cross-source e composizione Evidence                  |

## Freshness e alignment

`buildAlignment()` calcola separatamente l’età di ciascuna fonte rispetto a `now` e il gap fra i timestamp delle due fonti.

```txt
maxSourceAgeSec = max(sofaAgeSec, betfairAgeSec)
crossSourceGapSec = abs(sofaTimestamp - betfairTimestamp)
```

L’output espone `sofaAgeSec`, `betfairAgeSec`, `maxSourceAgeSec`, `crossSourceGapSec`, `pairwiseAvailable`, `freshnessQuality`, `maxTickGapSec` e `alignmentQuality`.

`freshnessQuality` e `alignmentQuality` hanno lo stesso valore; `maxSourceAgeSec` e `maxTickGapSec` hanno lo stesso valore. Con entrambe le fonti valide, la qualità è `good` entro le soglie di recency specifiche e `medium` quando entrambe le età non superano 60 secondi; negli altri casi è `poor`.

Se Betfair manca, il massimo può essere calcolato dalla sola età SofaScore, ma `pairwiseAvailable` resta `false` e la qualità non viene promossa a `medium` o `good`.

La policy comune tollera uno skew futuro massimo di 5 secondi. Entro questa tolleranza l’età viene normalizzata a zero; oltre la tolleranza `ageSec()` restituisce `null`, la fonte non è recente e Data Quality aggiunge una reason specifica per SofaScore o Betfair.

## Data Quality

`buildDataQuality()` espone:

```txt
sofaLive
sofaRecent
betfairRecent
graphHealth
ladderReliable
moneyFlowReliable
marketTradable
persistenceComplete
reasons
```

Le soglie di recency correnti sono 20 secondi per SofaScore e 24 secondi per Betfair.

`ladderReliable` richiede un tick Betfair recente, Graph health `ok` e almeno un runner con `ladderSource` affidabile e ladder non vuota. Le sorgenti affidabili sono `graph`, `mixed` e `graph_url`.

`marketTradable` richiede almeno un runner del tick Betfair recente con:

```txt
bestBack > 0
bestLay > 0
bestLay > bestBack
```

`moneyFlowReliable` richiede una ladder reliable e almeno un runner con Money Flow `confidence: "confirmed"`, almeno uno tra `back` e `lay` finito e gli eventuali `runnerDelta` e `marketDelta` finiti non negativi. Il producer emette il contratto `confirmed`/`suppressed`; i consumer Evidence condividono `isConfirmedMoneyFlow()`, quindi gli output `suppressed` restano diagnostici e non diventano reliable.

`dataQuality.reasons` conserva le degradazioni tecniche dettagliate e include anche i placeholder correnti `Trade on Tennis unavailable` e `Sofa-only value model not calibrated`.

## Flow dei runner

Il flow descrive book, prezzo, matched volume, delta, volume classificato, non classificato e soppresso. Il volume ambiguo o anomalo non deve diventare pressione direzionale certa.

Priorità del prezzo comparabile:

```txt
lastTradedPrice
→ mid(bestBack, bestLay)
→ bestBack
→ bestLay
```

Il lookback considera fino a dieci tick precedenti. Il composer lo limita all’epoch Betfair attivo prima di costruire Evidence.

La reliability locale richiede Graph health `ok` e ladder reliable nel tick corrente. Per il confronto precedente, la ricerca procede a ritroso e accetta soltanto una entry con Graph health `ok`, runner corrispondente e ladder reliable.

Un Money Flow `suppressed` può restare `available:true` come diagnostica, ma porta `reliable:false`. Il market summary considera reliable soltanto i runner con `flowEvidence.reliable:true` e conserva le ambiguità osservabili.

Il predicate condiviso del book è usato da Data Quality, runner flow, runner Evidence e Temporal Alignment.

## Marker SofaScore

La facade `backend/src/sofa/sofaEventMarkers.js` espone:

```txt
DEUCE
THIRTY_ALL
BREAK_POINT
GAME_POINT
PRESSURE_POINT
```

I marker sono descrittivi e non sono trade trigger. `DEUCE` e `THIRTY_ALL` non assegnano automaticamente pressione a un giocatore.

## Tre contratti temporali distinti

### Freshness aggregata

`freshnessQuality`/`alignmentQuality` e `maxSourceAgeSec`/`maxTickGapSec` descrivono l’età delle fonti rispetto a `now`. `crossSourceGapSec` descrive la distanza pairwise fra i timestamp.

### Ordine marker/mercato dello snapshot

`latestSnapshotMarkerOrder` confronta il marker selezionato nello snapshot con il movimento del dominant runner e usa una finestra di 10 secondi:

```txt
same_window
market_after_sofa
market_before_sofa
unknown
```

### Relazione temporale sul lookback

`temporalLookbackReactionWindow` deriva da `buildTemporalAlignment()`, seleziona marker SofaScore e movimento Betfair dal lookback e usa una finestra di 30 secondi:

```txt
same_window
sofa_before_betfair
betfair_before_sofa
unknown
```

I due contratti differiscono per input, soglia e vocabolario dell’ordine.

Il temporal alignment distingue `available` da `reliable`. `available` richiede una relazione diversa da `unknown`; `reliable` richiede inoltre SofaScore e Betfair recenti, Graph health `ok`, ladder reliable e book tradabile. `reliabilityReasons` elenca le condizioni mancanti.

La reaction window mantiene `interpretation: "temporal_proximity_only"` e `causalityClaimed:false`; anche `latestSnapshotMarkerOrder` mantiene `causalityClaimed:false`.

## Persistence integrity e scoping cross-source

Gli stati pubblici considerati sono:

```txt
no_known_partial
partial_persistence
recovery_failed
```

`partial_persistence` e `recovery_failed` producono `persistenceComplete:false` e la reason:

```txt
Persistence incomplete: canonical cross-source evidence unavailable
```

`no_known_partial` produce `persistenceComplete:true`.

La persistence integrity non trasforma un tick fresco in stale e non modifica Graph health, ladder reliability o tradabilità. `buildDataQuality()` riceve il tick Betfair raw e continua a descriverne la qualità tecnica.

Il confronto cross-source è autorizzato soltanto quando Source Identity è `aligned` e non esiste un conflitto di persistenza. In caso contrario il composer applica questo scoping:

```txt
tick Betfair per marketEvidence → null
lookback Betfair per marketEvidence → []
timeline Betfair per temporal alignment → []
input SofaScore e Betfair per Market Reactions → []
```

Il dettaglio `marketEvidence` e l’allineamento cross-source non vengono quindi costruiti dai dati Betfair raw, mentre la qualità tecnica resta osservabile in `dataQuality`. `marketReactionEvidence.available` viene forzato a `false` e il summary mantiene `causalityClaimed:false` con le reason pertinenti.

Source Identity e persistence integrity sono assi separati:

```txt
Source Identity pending o mismatch
→ attribuzione cross-source non autorizzata

partial_persistence o recovery_failed
→ persistenza canonica incompleta
```

Una Source Identity `aligned` non supera una persistenza incompleta; una persistenza completa non supera Source Identity `pending` o `mismatch`.

Reason e predicate della persistence integrity appartengono a `persistenceQuality.js`. `buildNoTradeReasons(dataQuality, alignment)` usa `dataQuality.persistenceComplete` e non riceve direttamente `integrity`.

## `noTradeReasons`

| Condizione                          | Reason                                         |
| ----------------------------------- | ---------------------------------------------- |
| SofaScore non live                  | `Sofa market not live`                         |
| tick SofaScore non recente          | `SofaScore tick too old`                       |
| tick Betfair non recente o mancante | `Betfair tick too old or missing`              |
| book non tradabile                  | `Book is not two-sided`                        |
| ladder non reliable                 | `Ladder not reliable; skip moneyFlow analysis` |
| `alignmentQuality` poor             | `Poor alignment between Sofa and Betfair data` |
| persistenza incompleta              | `Persistence incomplete: canonical cross-source evidence unavailable` |

Il composer aggiunge la reason di Source Identity quando lo stato è `pending` o `mismatch`. Le reason vengono aggiunte senza duplicare quella standard di persistenza.

## Invarianti

Questo livello non deve:

- trattare Money Flow come intenzione certa;
- dedurre causalità da volume, prezzo o prossimità temporale;
- mescolare epoch Betfair diverse nello stesso confronto;
- promuovere dati cross-source quando Source Identity o persistence integrity li bloccano;
- descrivere `available` come sinonimo di `reliable`;
- trasformare un conflitto di persistenza in errore Graph, staleness o mismatch Source Identity;
- eseguire fetch, scraping, recovery o scritture;
- dipendere dalla UI.

## Riferimenti implementativi

| Responsabilità              | Implementazione                                                                |
| --------------------------- | ------------------------------------------------------------------------------ |
| qualità e reason Evidence   | `backend/src/sofa/matchEvidence/dataQuality.js`, `noTradeReasons.js`           |
| predicate condivisi         | `backend/src/sofa/matchEvidence/qualityPredicates.js`, `persistenceQuality.js` |
| allineamento dello snapshot | `backend/src/sofa/matchEvidence/alignment.js`, `alignmentExtension.js`         |
| flow per runner e mercato   | `backend/src/sofa/marketFlowEvidence/runnerFlow.js`, `marketSummary.js`        |
| marker SofaScore            | `backend/src/sofa/sofaEventMarkers.js`                                         |
| allineamento temporale      | `backend/src/sofa/temporalAlignmentEvidence.js`, `temporalAlignment/`          |
| composizione e gating       | `backend/src/sofa/matchEvidence/evidenceBuilder.js`                            |

```text
timeline canoniche + integrity + Source Identity
→ scoping degli input cross-source
→ qualità tecnica sui tick raw
→ flow e summary, quando autorizzati
→ marker SofaScore
→ finestre temporali e alignment, quando autorizzati
→ reason aggregate
→ snapshot Evidence read-only
```

### Matrice delle authority

| Domanda                                          | Authority                                               |
| ------------------------------------------------ | ------------------------------------------------------- |
| Il campione Betfair è tecnicamente utilizzabile? | classificazione Betfair upstream e predicate di qualità |
| La persistenza è completa?                       | integrity derivata da journal e documenti canonici      |
| Le sorgenti appartengono allo stesso match?      | Source Identity                                         |
| Il flow è affidabile?                            | contratto Money Flow e qualità ladder                   |
| La relazione temporale è disponibile e reliable? | temporal alignment, non la sola freshness               |

```text
fresh == true
≠ flow affidabile
≠ persistenza completa
≠ Source Identity aligned
≠ relazione temporale disponibile
```

## Verifica

Test pertinenti:

```txt
node backend/src/sofa/matchEvidence/dataQuality.test.mjs
node backend/src/sofa/matchEvidence/alignment.test.mjs
node backend/src/sofa/matchEvidence/time.test.mjs
node backend/src/sofa/matchEvidence/qualityPredicates.test.mjs
node backend/src/sofa/matchEvidence/noTradeReasons.test.mjs
node backend/src/sofa/matchEvidence/marketEvidence.test.mjs
node backend/src/sofa/marketFlowEvidence/runnerFlow.test.mjs
node backend/src/sofa/sofaEventMarkers/markerDetector.test.mjs
node backend/src/sofa/temporalAlignmentEvidence.test.mjs
```

Le suite coprono timestamp futuri entro e oltre la tolleranza, persistence integrity, ladder assente o non affidabile, Money Flow confirmed e suppressed, book zero/negativo/crossed/one-sided, flow con e senza confronto precedente, marker SofaScore, reliability temporale e distinzione fra le finestre di 10 e 30 secondi.

## Documenti collegati

- [Match Evidence Snapshot](./01-match-evidence-snapshot.md)
- [Source Identity](./02-source-identity.md)
- [Market Reactions](./04-market-reactions.md)
- [API Evidence](../../api/03-evidence.md)
- [Validità tecnica campioni Betfair](../betfair/02-technical-sample-validity.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
- [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
