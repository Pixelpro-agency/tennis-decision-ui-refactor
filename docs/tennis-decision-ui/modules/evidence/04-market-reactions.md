# Market Reactions

## Scopo

Market Reactions raccoglie tre livelli distinti:

```txt
Significant Market Flow
→ attività Exchange isolata

Market → Field
→ osservazioni SofaScore successive a un flow sorgente

Field → Market
→ osservazioni Betfair successive a un marker SofaScore
```

Il modulo non genera segnali, raccomandazioni o previsioni e non attribuisce intenzioni ai trader. I summary e le finestre temporali mantengono `causalityClaimed:false`; gli oggetti interni puramente tecnici non sono tenuti ad avere tutti la stessa shape.

`exchange_activity_observed` descrive attività di mercato isolata. `temporal_proximity_only` descrive soltanto una relazione temporale. Nessuna delle due interpretazioni dimostra causalità.

## Implementazione

```txt
backend/src/sofa/marketReactionEvidence.js
backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/
backend/src/sofa/marketLedObservationEvidence.js
backend/src/sofa/marketLedObservationEvidence/
backend/src/sofa/fieldLedReactionEvidence.js
backend/src/sofa/fieldLedReactionEvidence/
```

Il parent restituisce i tre rami e un summary con:

```txt
largeFlowDetected
marketLedAvailable
fieldLedAvailable
fieldLedMarketResponseObserved
fieldLedDataQuality
flowAmbiguous
dataQuality
causalityClaimed:false
reasons
```

Le reason dei rami vengono unite e deduplicate.

## Gating cross-source

Il composer Evidence passa input utilizzabili soltanto quando:

```txt
Source Identity effective aligned
AND
persistenceComplete true
```

Se una condizione manca, gli array cross-source vengono svuotati, `marketReactionEvidence.available` viene forzato a false e il summary conserva le reason backend-owned di Source Identity o persistence integrity.

Il dominio Market Reactions non legge il gate live, journal o storage e non esegue recovery. Riceve inoltre soltanto il Betfair active market epoch scelto dal loader Evidence.

## Significant Market Flow

Questo ramo individua attività di volume significativa nel lookback Betfair e può produrre flow single-tick o cluster.

Un candidato espone, fra gli altri:

```txt
runner
selectionId
observedFlowAmount
absoluteFlowTier
relativeFlowTier
direction
flowAmbiguous
validVolume
graphHealth
ladderSource
bookTradable
interpretation: exchange_activity_observed
causalityClaimed: false
```

`available:true` significa che la pipeline dispone di tick da analizzare, non che sia stato trovato un flow significativo. La presenza effettiva è indicata da `largeFlowDetected`, `significantFlows` e `latestSignificantFlow`.

Il ramo usa il predicate Money Flow condiviso: solo `confidence:confirmed` può diventare significativo. Richiede inoltre Graph health `ok`, ladder affidabile e non vuota e `selectionId`. Le tolleranze TotalMatched seguono il producer (`max(1, 5% del market delta)`). I candidati suppressed o tecnicamente ineligibili incrementano il conteggio diagnostico degli invalidati ma non diventano `latestSignificantFlow` o `sourceMarketEvent`.

## Market → Field

`marketLedObservationEvidence` usa `latestSignificantFlow` come `sourceMarketEvent` e osserva esclusivamente tick SofaScore successivi.

Finestre predefinite:

```txt
60s
120s
180s
240s
```

Il tick sorgente è escluso; il cutoff finale è incluso. Ogni finestra può riportare score, servizio, marker, coverage quality e reason.

Il ramo applica `maxSourceAgeSec:240` e tollera al massimo 5 secondi di clock skew futuro. Eventi più vecchi o futuri oltre tolleranza vengono rifiutati con reason bounded. Le observation window configurabili vengono filtrate, deduplicate e ordinate.

Il disclaimer resta obbligatorio:

```txt
fieldEventObservedAfterFlow
≠
il flow ha causato l'evento di campo
```

## Field → Market

`fieldLedReactionEvidence` seleziona un marker SofaScore e osserva tick Betfair successivi all'anchor `sourceFieldEvent.stateFirstSeenAt`.

Configurazione predefinita:

```txt
observationWindowsSec: [10, 30, 60, 120, 180, 240]
maxSourceAgeSec: 240
```

La baseline è l'ultimo tick Betfair con timestamp minore o uguale all'anchor; i tick osservati sono successivi all'anchor e inclusi fino al cutoff.

`marketResponseObserved` diventa true in presenza di variazioni prezzo o di un incremento del totale matched. `marketResponseReliable` richiede inoltre coverage `good`, Graph health `ok` e almeno un runner con ladder e book affidabili. `reliabilityReasons` spiega una risposta soltanto diagnostica. La quality locale della finestra può essere `good`, `medium` o `poor`, ma non è la `dataQuality` globale dello snapshot.

## Quality locale e availability

I nomi hanno scope differenti:

| Campo                              | Significato                                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| `marketReactionEvidence.available` | Almeno una pipeline figlia ha dati elaborabili               |
| `largeFlowDetected`                | È presente un flow sopra soglia                              |
| `marketLedAvailable`               | Il ramo Market → Field ha un source event e dati elaborabili |
| `fieldLedAvailable`                | Il ramo Field → Market ha un marker e dati elaborabili       |
| `fieldLedMarketResponseObserved`   | Una variazione è stata osservata dopo il marker              |
| `summary.dataQuality`              | Coverage quality locale del ramo Market → Field              |
| `fieldLedDataQuality`              | Coverage quality locale del ramo Field → Market              |

Questi campi non sono intercambiabili. In particolare `available` non significa “reaction observed” e una quality locale buona non sostituisce freshness, Graph, ladder, Source Identity o persistence integrity dello snapshot.

## Frontend

```txt
frontend/src/hooks/useMarketReactionEvidence.js
frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/marketReactions/
```

`App.jsx` crea una sola istanza del polling; la pagina è un consumer presentazionale.

Le card usano `evidence.available`, mostrano le blocking reason backend-owned e il disclaimer di causalità. Il mapping Market → Field usa runner, importo, tier, direzione e ambiguità reali; `sofaEventsObserved` è renderizzato come array. Il view model puro è coperto da fixture frontend.

La UI non deve ricostruire reason di Source Identity o persistence: deve renderizzare quelle ricevute dal backend.

## Invarianti

Market Reactions non deve:

- trasformare matched volume in intenzione certa;
- promuovere una relazione temporale a causalità;
- confrontare epoch Betfair differenti;
- bypassare Source Identity o persistence integrity;
- interpretare `available` come reazione osservata;
- interpretare `marketResponseObserved` come risposta affidabile o causale;
- modificare timeline, history o journal;
- avviare tracker, scraper o recovery.

## Riferimenti implementativi

| Area                    | Implementazione                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------- |
| composer principale     | `backend/src/sofa/marketReactionEvidence.js`                                            |
| flow significativo      | `backend/src/sofa/significantMarketFlowEvidence.js`, `significantMarketFlow/`           |
| osservazione market-led | `backend/src/sofa/marketLedObservationEvidence.js`                                      |
| reazione field-led      | `backend/src/sofa/fieldLedReactionEvidence.js`                                          |
| marker e finestre       | `backend/src/sofa/temporalAlignment/`                                                   |
| consumer frontend       | `frontend/src/hooks/useMarketReactionEvidence.js`, `components/MarketReactionsPage.jsx` |

Le due direzioni non condividono la stessa domanda:

```text
Market → Field
movimento mercato qualificato
→ finestra SofaScore successiva
→ osservazione descrittiva

Field → Market
marker SofaScore qualificato
→ finestra Betfair successiva
→ osservazione descrittiva
```

### Gate di disponibilità

| Gate                  | Se fallisce                              |
| --------------------- | ---------------------------------------- |
| Source Identity       | nessuna correlazione cross-source        |
| active Betfair epoch  | tick di epoch precedenti esclusi         |
| persistence integrity | output degradato o indisponibile         |
| qualità/freshness     | reason esplicita, nessun fallback a zero |
| flow significativo    | nessuna finestra market-led aperta       |

Il parent `available` non sostituisce gli stati delle singole sezioni. I consumer leggono separatamente market-led e field-led, con reason, quality e intervallo osservato.

### Contratto interpretativo

Il producer imposta sempre `causalityClaimed: false`. Nelle finestre temporali market-led e field-led il valore letterale di `interpretation` è:

```json
{
  "causalityClaimed": false,
  "interpretation": "temporal_proximity_only"
}
```

Il summary aggregato espone `causalityClaimed`, ma non va documentato come se possedesse necessariamente lo stesso campo `interpretation` delle finestre.

La vicinanza temporale non dimostra causalità, edge, strategia o indicazione operativa. Nessuna parte di Market Reactions scrive timeline, modifica journal o apre automaticamente una posizione.

### Verifica automatica

```text
backend/src/sofa/marketReactionEvidence.test.mjs
backend/src/sofa/marketLedObservationEvidence.test.mjs
backend/src/sofa/fieldLedReactionEvidence.test.mjs
backend/src/sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
```

## Verifica

Suite backend presenti:

```txt
node backend/src/sofa/marketReactionEvidence.test.mjs
node backend/src/sofa/significantMarketFlowEvidence.test.mjs
node backend/src/sofa/marketLedObservationEvidence.test.mjs
node backend/src/sofa/fieldLedReactionEvidence.test.mjs
node backend/src/sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
node backend/src/sofa/matchEvidence/evidenceBuilder/persistenceIntegrity.test.mjs
node frontend/src/components/marketReactions/marketReactionViewModel.test.mjs
```

La matrice copre suppression, `flow_exceeds_runner_delta`, eligibility tecnica, recency e timestamp futuro del source event, distinzione observed/reliable, semantica availability e mapping delle card frontend. Evidence Builder resta verificato tramite le suite modulari realmente presenti.

## Documenti collegati

- [Match Evidence Snapshot](./01-match-evidence-snapshot.md)
- [Source Identity](./02-source-identity.md)
- [Qualità, flow e allineamento](./03-quality-flow-and-alignment.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
- [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
- [API Evidence](../../api/03-evidence.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
