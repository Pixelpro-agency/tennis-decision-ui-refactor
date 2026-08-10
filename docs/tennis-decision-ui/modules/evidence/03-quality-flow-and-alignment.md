# Qualità, flow e allineamento

## Scopo

Questo modulo documenta come Evidence descrive disponibilità, freschezza, affidabilità tecnica e relazione temporale dei dati. Non genera segnali operativi e non deduce causalità fra campo e mercato.

La presenza di un dato non implica che sia fresco, affidabile o autorizzato per un confronto cross-source:

```txt
available ≠ fresh ≠ reliable ≠ cross-source allowed 
temporal proximity ≠ causality
```

Il layer è read-only: non esegue scraping, recovery o scritture su history, timeline e journal.

## Implementazione

```txt
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/matchEvidence/alignment.js
backend/src/sofa/matchEvidence/alignmentExtension.js
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
| `alignment.js`        | Età indipendente dei tick e qualità di freshness aggregata    |
| `marketFlowEvidence/` | Flow descrittivo, confronto prezzi e riepilogo runner         |
| `sofaEventMarkers.js` | Marker descrittivi del contesto SofaScore                     |
| `temporalAlignment/`  | Relazione temporale diagnostica sul lookback                  |
| `noTradeReasons.js`   | Motivi che impediscono l’uso operativo                        |

## Freshness e `alignmentQuality`

`buildAlignment()` separa l'età delle fonti dal gap pairwise. I campi canonici sono `freshnessQuality`, `maxSourceAgeSec`, `crossSourceGapSec` e `pairwiseAvailable`.

In particolare:

```txt
maxSourceAgeSec = max(sofaAgeSec, betfairAgeSec)
crossSourceGapSec = abs(sofaTimestamp - betfairTimestamp)
```

Se una fonte manca, `pairwiseAvailable` è false e la quality non viene promossa a `medium`. `alignmentQuality` e `maxTickGapSec` restano alias compatibili dei campi di freshness durante la transizione.

La policy comune tollera uno skew futuro massimo di 5 secondi. Oltre la tolleranza `ageSec()` restituisce `null`, la fonte non è recente e Data Quality aggiunge una reason bounded specifica per SofaScore o Betfair.

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

`ladderReliable` richiede almeno un runner con:

```txt
tick Betfair recente
Graph health ok
ladderSource affidabile
ladder array non vuota
```

`marketTradable` richiede nello stesso runner:

```txt
bestBack > 0
bestLay > 0
bestLay > bestBack
```

Money Flow è candidata reliable soltanto con `confidence: "confirmed"`, valori finiti e delta non negativi. Gli output `suppressed` restano diagnostici e non diventano reliable in base alla singola reason. Il predicate è condiviso e non mantiene una blacklist consumer separata dal producer.

## Flow dei runner

Il flow descrive book, prezzo, matched volume, delta, volume classificato, volume non classificato e volume soppresso. Il volume ambiguo o anomalo non deve diventare pressione direzionale certa.

Priorità del prezzo comparabile:

```txt
lastTradedPrice
→ mid(bestBack, bestLay)
→ bestBack
→ bestLay
```

Il lookback usa fino a dieci tick precedenti del solo epoch Betfair attivo.

La reliability locale di `runnerFlow` usa lo stesso predicate della quality: origine affidabile e ladder non vuota, sia per il tick corrente sia per le entry di lookback. Un Money Flow suppressed può restare available come diagnostica ma porta `flowEvidence.reliable:false` e non rende reliable il market summary.

Il predicate condiviso del book richiede back e lay positivi e `bestLay > bestBack`. È usato da Data Quality, runner flow, runner Evidence e Temporal Alignment.

## Marker SofaScore

La facade `backend/src/sofa/sofaEventMarkers.js` espone marker descrittivi:

```txt
DEUCE
THIRTY_ALL
BREAK_POINT
GAME_POINT
PRESSURE_POINT
```

I marker non sono trade trigger. `DEUCE` e `THIRTY_ALL` non assegnano automaticamente pressione a un giocatore.

## Tre contratti temporali distinti

Il payload usa oggi tre livelli che non devono essere confusi.

### Freshness aggregata

`alignmentQuality` e `maxTickGapSec` descrivono l'età dei tick rispetto a `now`, con i limiti indicati sopra.

### Ordine marker/mercato dello snapshot

`latestSnapshotMarkerOrder` confronta il marker corrente con il movimento del dominant runner e usa una finestra di 10 secondi:

```txt
same_window
market_after_sofa
market_before_sofa
```

### Relazione temporale sul lookback

`temporalLookbackReactionWindow` seleziona marker e movimento dal lookback e usa una finestra di 30 secondi:

```txt
same_window
sofa_before_betfair
betfair_before_sofa
```

I due ultimi contratti differiscono sia per input sia per soglia. Non sono due nomi equivalenti per la stessa misura.

Il temporal alignment distingue `available` da `reliable`. Il primo indica che marker, movimento e timestamp permettono una relazione diagnostica; il secondo richiede anche fonti recenti, Graph health `ok`, ladder reliable e book tradabile. `reliabilityReasons` spiega in modo bounded ogni degradazione.

Ogni output temporale mantiene `causalityClaimed: false`.

## Persistence integrity e scoping cross-source

Gli stati pubblici sono:

```txt
no_known_partial
partial_persistence
recovery_failed
```

`partial_persistence` e `recovery_failed` producono `persistenceComplete:false` e la reason:

```txt
Persistence incomplete: canonical cross-source evidence unavailable
```

Questo blocco non trasforma un tick fresco in stale e non modifica Graph health, ma impedisce al composer di passare tick e lookback Betfair a `marketEvidence`. Rimane osservabile la quality tecnica calcolata sul tick raw; il dettaglio flow non viene costruito come blocco diagnostico separato.

La stessa separazione vale quando Source Identity non autorizza il confronto. 

Una fonte tecnicamente valida non diventa automaticamente Evidence cross-source.

Reason e predicate della persistence integrity appartengono a `persistenceQuality.js`. `buildNoTradeReasons(dataQuality, alignment)` usa `dataQuality.persistenceComplete` come authority e non riceve parametri inutilizzati.

## Invarianti

Questo livello non deve:

- trattare Money Flow come intenzione certa;
- dedurre causalità da volume, prezzo o prossimità temporale;
- mescolare epoch Betfair diverse nello stesso confronto;
- promuovere dati cross-source quando Source Identity o persistence integrity li bloccano;
- descrivere `available` come sinonimo di `reliable`;
- trasformare un conflitto di persistenza in errore Graph o mismatch Source Identity;
- eseguire fetch, scraping, recovery o scritture;
- dipendere dalla UI.

## Riferimenti implementativi

| Responsabilità              | Implementazione                                                         |
| --------------------------- | ----------------------------------------------------------------------- |
| qualità e reason Evidence   | `backend/src/sofa/matchEvidence/dataQuality.js`, `noTradeReasons.js`    |
| allineamento dello snapshot | `backend/src/sofa/matchEvidence/alignment.js`, `alignmentExtension.js`  |
| flow per runner e mercato   | `backend/src/sofa/marketFlowEvidence/runnerFlow.js`, `marketSummary.js` |
| marker SofaScore            | `backend/src/sofa/sofaEventMarkers.js`                                  |
| allineamento temporale      | `backend/src/sofa/temporalAlignmentEvidence.js`, `temporalAlignment/`   |
| composizione Evidence       | `backend/src/sofa/matchEvidence/evidenceBuilder.js`                     |

Il percorso di costruzione resta:

```text
timeline canoniche + integrity + Source Identity
→ qualità tecnica per sorgente
→ flow per runner e riepilogo mercato
→ marker SofaScore
→ finestre temporali e alignment
→ reason aggregate
→ snapshot Evidence read-only
```

### Matrice delle authority

| Domanda                                          | Authority                                 |
| ------------------------------------------------ | ----------------------------------------- |
| Il campione Betfair è tecnicamente utilizzabile? | classificatore Betfair upstream           |
| La persistenza è completa?                       | integrity di journal/timeline             |
| Le sorgenti appartengono allo stesso match?      | Source Identity Gate                      |
| Il flow è affidabile?                            | builder Money Flow e qualità ladder       |
| L'evento è temporalmente allineato?              | temporal alignment, non la sola freshness |

Queste authority non sono intercambiabili. In particolare:

```text
fresh == true
≠ flow affidabile
≠ persistenza completa
≠ Source Identity confermata
≠ alignment disponibile
```

### Failure e suppression

Un dato mancante, ambiguo o soppresso conserva la propria reason. Il composer non converte suppression in affidabilità e non presenta una finestra temporale come disponibile quando freshness, integrity o Source Identity ne impediscono l'uso.

La verifica automatica usa almeno:

```text
backend/src/sofa/matchEvidence/dataQuality.test.mjs
backend/src/sofa/matchEvidence/alignment.test.mjs
backend/src/sofa/matchEvidence/noTradeReasons.test.mjs
backend/src/sofa/marketFlowEvidence/runnerFlow.test.mjs
backend/src/sofa/sofaEventMarkers/markerDetector.test.mjs
```

## Verifica

Test presenti:

```txt
node backend/src/sofa/matchEvidence/dataQuality.test.mjs
node backend/src/sofa/matchEvidence/alignment.test.mjs
node backend/src/sofa/matchEvidence/noTradeReasons.test.mjs
node backend/src/sofa/matchEvidence/marketEvidence.test.mjs
node backend/src/sofa/marketFlowEvidence/runnerFlow.test.mjs
node backend/src/sofa/sofaEventMarkers/markerDetector.test.mjs
node backend/src/sofa/temporalAlignmentEvidence.test.mjs
```

La matrice copre timestamp futuri entro e oltre tolleranza, principali reason Money Flow suppressed, ladder vuota, book zero/negativo/crossed/one-sided, reliability temporale e differenza intenzionale fra finestre 10s e 30s.

## Documenti collegati

- [Match Evidence Snapshot](./01-match-evidence-snapshot.md)
- [Source Identity](./02-source-identity.md)
- [Market Reactions](./04-market-reactions.md)
- [API Evidence](../../api/03-evidence.md)
- [Validità tecnica campioni Betfair](../betfair/02-technical-sample-validity.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
- [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
