# Market Reactions

## Scopo

Market Reactions descrive tre livelli distinti di osservazione:

```text
Significant Market Flow
→ attività Exchange isolata

Market → Field
→ osservazioni SofaScore successive a un flow sorgente

Field → Market
→ osservazioni Betfair successive a un marker SofaScore
```

Il dominio non genera segnali, raccomandazioni o previsioni, non attribuisce intenzioni ai trader e non identifica vincitori, favoriti, beneficiari o danneggiati.

I flow significativi usano `interpretation: exchange_activity_observed`; le finestre Market → Field e Field → Market usano `interpretation: temporal_proximity_only`. In entrambi i casi `causalityClaimed` è `false`: prossimità temporale e attività Exchange non dimostrano causalità, edge, strategia o indicazione operativa.

## Implementazione e composizione

```text
backend/src/sofa/marketReactionEvidence.js
backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/
backend/src/sofa/marketLedObservationEvidence.js
backend/src/sofa/marketLedObservationEvidence/
backend/src/sofa/fieldLedReactionEvidence.js
```

`buildMarketReactionEvidence()` compone:

```text
Betfair ticks
→ significantMarketFlow
→ latestSignificantFlow
→ marketLedObservation

SofaScore ticks + Betfair ticks
→ fieldLedReaction
```

Il parent espone `available`, la configurazione, i tre rami e un summary contenente:

```text
largeFlowDetected
marketLedAvailable
fieldLedAvailable
fieldLedMarketResponseObserved
fieldLedMarketResponseReliable
fieldLedDataQuality
flowAmbiguous
dataQuality
causalityClaimed: false
reasons
```

Le reason dei tre rami vengono unite, filtrate e deduplicate.

## Confini e ownership

Market Reactions è un dominio computazionale read-only: riceve tick già caricati e restituisce osservazioni derivate senza modificare gli input.

Non possiede né esegue:

- Source Identity Gate live;
- selezione dell’active Betfair epoch;
- persistence integrity;
- journal o recovery;
- scrittura di history o timeline;
- tracking o scraping;
- polling e stato applicativo frontend.

Source Identity, persistence integrity e active epoch sono dipendenze applicate dagli owner che costruiscono gli input Evidence. Il dominio non legge direttamente storage, journal o stato live.

## Gating cross-source

`buildEvidenceFromTicks()` consente l’elaborazione cross-source soltanto quando:

```text
sourceIdentity.status === aligned
AND
integrity non indica partial_persistence o recovery_failed
```

Quando il gate non è soddisfatto, Evidence Builder passa array cross-source vuoti e forza:

```text
marketReactionEvidence.available: false
marketReactionEvidence.summary.causalityClaimed: false
```

Il blocco Source Identity effective resta esposto. Le reason di Source Identity e persistence vengono aggiunte al summary senza duplicati e confluiscono anche nei `noTradeReasons`.

| Gate                                      | Effetto                                                             |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Source Identity `aligned`                 | Consente le osservazioni se non esiste un conflitto di persistenza  |
| Source Identity `pending`                 | Sospende le osservazioni cross-source                               |
| Source Identity `mismatch`                | Sospende le osservazioni cross-source                               |
| `partial_persistence` o `recovery_failed` | Sospende l’uso canonico cross-source senza cambiare Source Identity |
| active Betfair epoch                      | Limita a monte i tick Betfair utilizzabili dal loader Evidence      |

La reason canonica di persistenza è:

```text
Persistence incomplete: canonical cross-source evidence unavailable
```

Una persistenza incompleta non equivale a Source Identity mismatch, freshness stale, Graph health degradato, errore scraper o assenza osservata di una reazione.

## Significant Market Flow

Facade:

```text
backend/src/sofa/significantMarketFlowEvidence.js
```

Il ramo analizza gli ultimi `lookbackTicks` Betfair e può produrre flow single-tick e cluster.

Configurazione predefinita:

| Campo                       | Valore |
| --------------------------- | -----: |
| `lookbackTicks`             | 40     |
| `baselineLookbackTicks`     | 12     |
| `maxClusterTicks`           | 3      |
| `minimumAbsoluteAmount`     | 600    |
| `minimumRelativeMultiplier` | 6      |

| Tier assoluto | Soglia |
| ------------- | -----: |
| `notable`     | 600    |
| `strong`      | 1200   |
| `very_strong` | 2500   |
| `extreme`     | 5000   |

| Tier relativo | Moltiplicatore |
| ------------- | -------------: |
| `elevated`    | 3              |
| `unusual`     | 6              |
| `extreme`     | 10             |

Un candidato single-tick è significativo quando `absoluteFlowTier !== none` oppure il tier relativo è `unusual` o `extreme`. Il flow relativo usa la mediana dei flow validi nella porzione di baseline precedente agli ultimi `baselineLookbackTicks`; senza baseline il tier relativo resta `unknown`.

### Validità ed eleggibilità

Un candidato entra in `significantFlows` soltanto se:

- Money Flow ha `confidence: confirmed`;
- i delta runner e market, quando presenti, non sono negativi;
- `runnerMatchedDelta` non supera `marketDelta` oltre `max(1, 5% del marketDelta)`;
- Graph health del tick è `ok`;
- la ladder runner è affidabile;
- `selectionId` è disponibile.

I candidati non validi non possono diventare `latestSignificantFlow` e incrementano `invalidFlowCount`. Il summary li descrive come flow invalidati dal gate TotalMatched, anche quando le `validationReasons` comprendono ulteriori motivi tecnici.

Il volume osservato è il massimo valore non negativo fra volume classificato, non classificato, suppressed e delta matched del runner. Il volume suppressed contribuisce all’ambiguità direzionale; non costituisce da solo un’attribuzione back o lay.

Un flow espone, fra gli altri:

```text
sourceType
timestamp
runner
selectionId
observedFlowAmount
absoluteFlowTier
relativeFlowMultiplier
relativeFlowTier
direction
directionAttributed
flowAmbiguous
validVolume
graphHealth
ladderSource
bookTradable
interpretation: exchange_activity_observed
causalityClaimed: false
```

`available:true` significa che esistono tick da analizzare, non che sia stato rilevato un flow significativo. La rilevazione effettiva è descritta da `largeFlowDetected`, `significantFlows` e `latestSignificantFlow`.

Un flow può essere valido ma ambiguo. Direzione `mixed`, volume non classificato prevalente o volume suppressed impediscono di trattare la direzione come attribuzione certa.

## Market → Field

Facade:

```text
backend/src/sofa/marketLedObservationEvidence.js
```

Il ramo usa `latestSignificantFlow` come `sourceMarketEvent` e osserva soltanto tick SofaScore successivi.

Finestre predefinite:

```text
60s
120s
180s
240s
```

Il tick sorgente è escluso, il cutoff finale è incluso e la baseline è l’ultimo tick SofaScore con timestamp minore o uguale al source event. Le finestre configurabili vengono filtrate, deduplicate e ordinate.

Il ramo applica `maxSourceAgeSec: 240` e accetta al massimo 5 secondi di clock skew futuro. Un source event più vecchio o più avanti nel futuro rende il ramo non disponibile con reason esplicita.

Ogni finestra può esporre:

```text
windowSec
windowStart
windowEnd
sofaTicksObserved
firstSofaTickAt
lastSofaTickAt
firstScore
latestScore
latestServer
sofaEventsObserved
relevantMarkersObserved
fieldEventObservedAfterFlow
currentGameContext
dataQuality
reasons
interpretation: temporal_proximity_only
causalityClaimed: false
```

Il summary distingue cambiamenti di point, game, set, server e score, marker osservati e qualità locale. Se non esistono tick successivi espone `No SofaScore ticks found after source market event` e non deduce una risposta implicita.

```text
fieldEventObservedAfterFlow
≠
il flow ha causato l’evento di campo
```

## Field → Market

Facade:

```text
backend/src/sofa/fieldLedReactionEvidence.js
```

Il ramo seleziona il marker SofaScore rilevante più recente negli ultimi 60 tick e usa `sourceFieldEvent.stateFirstSeenAt` come anchor.

Marker eleggibili e priorità nello stesso tick:

```text
BREAK_POINT
→ DEUCE
→ THIRTY_ALL
→ GAME_POINT
→ PRESSURE_POINT
```

Configurazione predefinita:

```text
observationWindowsSec: [10, 30, 60, 120, 180, 240]
maxSourceAgeSec: 240
```

Per ogni finestra:

- la baseline è l’ultimo tick Betfair con timestamp minore o uguale all’anchor;
- i tick osservati sono strettamente successivi all’anchor;
- il cutoff finale è incluso;
- il confronto usa l’ultimo tick disponibile nella finestra.

L’output comprende variazioni prezzo, delta del totale matched, stato observed, stato reliable, quality e reason.

`marketResponseObserved` diventa `true` se viene osservata almeno una variazione di prezzo oppure un incremento del totale matched.

`marketResponseReliable` richiede contemporaneamente:

```text
marketResponseObserved === true
dataQuality === good
Graph health === ok sull’ultimo tick della finestra
almeno un runner con ladder affidabile e book tradable
```

Una risposta osservata ma non affidabile resta diagnostica; `reliabilityReasons` distingue coverage non buona e qualità tecnica Betfair non affidabile.

## Availability, osservazione, affidabilità e quality locale

| Campo                              | Significato                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `marketReactionEvidence.available` | Almeno un ramo figlio dispone di input elaborabili, salvo forzatura del gate Evidence |
| `largeFlowDetected`                | È presente almeno un flow sopra i criteri assoluti o relativi                         |
| `marketLedAvailable`               | Market → Field dispone di un source market event valido                               |
| `fieldLedAvailable`                | Field → Market dispone di un source field event valido e non troppo vecchio           |
| `fieldLedMarketResponseObserved`   | È stata osservata una variazione in almeno una finestra Field → Market                |
| `fieldLedMarketResponseReliable`   | Almeno una risposta osservata soddisfa coverage e qualità tecnica                     |
| `summary.dataQuality`              | Migliore quality locale delle finestre Market → Field                                 |
| `fieldLedDataQuality`              | Migliore quality locale delle finestre Field → Market                                 |

Per Field → Market:

| Condizione                                                    | `dataQuality` |
| ------------------------------------------------------------- | ------------- |
| Nessun tick Betfair successivo all’anchor                     | `poor`        |
| Tick presenti ma baseline assente o nessun prezzo comparabile | `medium`      |
| Baseline presente e almeno un prezzo comparabile              | `good`        |

`unknown` è usato nel summary di un ramo non disponibile o privo di finestre.

I campi non sono intercambiabili: `available` non significa reaction observed; observed non significa reliable; reliable non implica causalità. La quality locale non è la Data Quality globale dello snapshot e non sostituisce Source Identity, persistence integrity, Graph health, ladder reliability o freshness.

## Frontend

```text
frontend/src/hooks/useMarketReactionEvidence.js
frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/marketReactions/
```

`useMarketReactionEvidence()` interroga `GET /api/evidence/:eventId/latest` e conserva separatamente:

```text
latest
marketReactionEvidence
sources
integrity
persistenceComplete
timestamp sorgente e timestamp di fetch
readStatus
```

L’hook gestisce polling, refresh, richieste abortibili e gli stati `inactive`, `waiting`, `current`, `degraded` ed `error`. Espone anche helper per confermare o revocare Source Identity.

`MarketReactionsPage.jsx` è un consumer presentazionale: mostra stato di lettura e persistenza, reason backend e due card, `Exchange → Field` e `Field → Exchange`. Non ricostruisce Evidence, non legge journal e non esegue recovery.

Le card:

- determinano availability da `evidence.available` del ramo;
- mostrano il disclaimer quando `causalityClaimed` è `false`;
- usano runner, importo, tier, direzione e ambiguità del source market event;
- renderizzano array e marker senza dedurre valori assenti;
- distinguono risposta `reliable` da risposta soltanto `diagnostic`.

La UI visualizza le reason ricevute dallo snapshot e dalla risposta API; non ricostruisce reason di Source Identity o persistence leggendo storage.

## Invarianti

Market Reactions non deve:

- trasformare matched volume in intenzione certa;
- promuovere prossimità temporale a causalità;
- confrontare epoch Betfair differenti;
- bypassare Source Identity o persistence integrity;
- interpretare `available` come reazione osservata;
- interpretare `marketResponseObserved` come risposta affidabile;
- interpretare `marketResponseReliable` come risposta causale;
- confondere quality locale e Data Quality globale;
- modificare timeline, history o journal;
- avviare tracker, scraper o recovery.

## Riferimenti implementativi

| Area             | Implementazione                                                                     |
| ---------------- | ----------------------------------------------------------------------------------- |
| composer         | `backend/src/sofa/marketReactionEvidence.js`                                        |
| Significant Flow | `backend/src/sofa/significantMarketFlowEvidence.js`, `significantMarketFlow/`       |
| Market → Field   | `backend/src/sofa/marketLedObservationEvidence.js`, `marketLedObservationEvidence/` |
| Field → Market   | `backend/src/sofa/fieldLedReactionEvidence.js`                                      |
| marker SofaScore | `backend/src/sofa/temporalAlignment/sofaMarker.js`                                  |
| gate Evidence    | `backend/src/sofa/matchEvidence/evidenceBuilder.js`                                 |
| polling frontend | `frontend/src/hooks/useMarketReactionEvidence.js`                                   |
| pagina e card    | `frontend/src/components/MarketReactionsPage.jsx`, `components/marketReactions/`    |

## Verifica

```text
node backend/src/sofa/marketReactionEvidence.test.mjs
node backend/src/sofa/significantMarketFlowEvidence.test.mjs
node backend/src/sofa/marketLedObservationEvidence.test.mjs
node backend/src/sofa/fieldLedReactionEvidence.test.mjs
node backend/src/sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
node backend/src/sofa/matchEvidence/evidenceBuilder/persistenceIntegrity.test.mjs
node frontend/src/components/marketReactions/marketReactionViewModel.test.mjs
```

Le suite coprono composizione e reason, soglie e cluster, ambiguità e invalidazione, finestre e baseline, recency e timestamp futuro, marker Field → Market, distinzione observed/reliable, gate Source Identity e persistence e mapping del view model frontend.

## Documenti collegati

- [Match Evidence Snapshot](./01-match-evidence-snapshot.md)
- [Source Identity](./02-source-identity.md)
- [Qualità, flow e allineamento](./03-quality-flow-and-alignment.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
- [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
- [API Evidence](../../api/03-evidence.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
