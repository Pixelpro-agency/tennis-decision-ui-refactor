# Market Reactions

## Scopo

Market Reactions descrive osservazioni temporali tra attività Betfair Exchange e stato del match SofaScore.

Non produce:

* segnali operativi;
* raccomandazioni;
* previsioni;
* attribuzioni di intenzione ai trader;
* causalità dimostrata;
* indicazioni su vincitori, favoriti, beneficiari o danneggiati.

Ogni output mantiene:

```txt
interpretation: temporal_proximity_only
causalityClaimed: false
```

Il modulo consuma solo snapshot Evidence già costruiti. Non legge journal, non esegue recovery, non modifica history o timeline e non avvia tracker o scraper.

Quando la persistenza canonica cross-source è incompleta o non recuperabile, Market Reactions viene sospeso anche se Source Identity effective è `aligned`.

## Implementazione

```txt
backend/src/sofa/
├── marketReactionEvidence.js
├── significantMarketFlowEvidence.js
├── marketLedObservationEvidence.js
├── marketLedObservationEvidence.testFixtures.mjs
└── fieldLedReactionEvidence.js
```

Il parent compone:

```txt
significantMarketFlow
→ marketLedObservation

fieldLedReaction
→ summary aggregato
```

Il summary espone:

```txt
largeFlowDetected
marketLedAvailable
fieldLedAvailable
fieldLedMarketResponseObserved
fieldLedDataQuality
flowAmbiguous
dataQuality
causalityClaimed: false
reasons
```

Le ragioni dei tre rami vengono unite e deduplicate.

Market Reactions non è owner di:

```txt
Source Identity Gate live
persistence integrity
journal e recovery
history e timeline
builder Evidence
polling frontend
```

## Source Identity effective

Market Reactions riceve dal Match Evidence Snapshot input già scoped.

Le osservazioni cross-source sono abilitate soltanto quando:

```txt
sourceIdentity.status === aligned
dataQuality.persistenceComplete === true
```

`sourceIdentity` descrive qui l’identità effective dello snapshot, non lo stato live del Source Identity Gate. Il modulo non legge né ricostruisce il gate live.

| Stato identity | Effetto                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| `aligned`      | Osservazioni Market Reactions consentite solo se la persistenza è completa |
| `pending`      | Osservazioni cross-source sospese                                          |
| `mismatch`     | Osservazioni cross-source sospese                                          |

Quando l’identità effective non è `aligned`:

* i dati SofaScore restano disponibili nello snapshot;
* la qualità Betfair può restare disponibile;
* `marketReactionEvidence.available` è forzato a `false`;
* viene aggiunta una ragione esplicita;
* timeline raw e history non vengono modificate.

Le osservazioni usano solo tick Betfair dell’active market epoch. Tick di epoch storiche non vengono confrontati con il contesto corrente.

## Persistence completeness

Market Reactions consuma `persistenceComplete` dal blocco `dataQuality` dello snapshot Evidence.

Regole:

```txt
integrity.status = no_known_partial
→ persistenceComplete:true

integrity.status = partial_persistence
integrity.status = recovery_failed
→ persistenceComplete:false
```

Quando `persistenceComplete:false`, Market Reactions sospende l’uso cross-source canonico:

```txt
marketReactionEvidence.available
→ false

marketReactionEvidence.summary.causalityClaimed
→ false

marketLedAvailable
→ false

fieldLedAvailable
→ false

fieldLedMarketResponseObserved
→ false
```

La reason standard è:

```txt
Persistence incomplete: canonical cross-source evidence unavailable
```

La reason viene aggiunta una sola volta e può coesistere con reason Source Identity `pending` o `mismatch`, senza duplicati.

`partial_persistence` e `recovery_failed` non sono:

```txt
Source Identity mismatch
freshness stale
Graph health degradato
runtime scraper failed
Money Flow non valido
ladder reliability assente
segnale causale
```

Un tick Betfair può essere tecnicamente fresco e allo stesso tempo non utilizzabile da Market Reactions perché la persistenza canonica cross-source è incompleta.

## Significant Market Flow

Facade:

```txt
backend/src/sofa/significantMarketFlowEvidence.js
```

Questo ramo individua flow significativi dai tick Betfair disponibili nello snapshot attribuito.

Può distinguere:

```txt
single tick flow
cluster flow
valid flow
invalid flow
ambiguous flow
```

L’output include il flow più recente:

```txt
latestSignificantFlow
```

Un candidato di flow può essere invalidato dal gate TotalMatched: in quel caso non entra in `significantFlows`, ma il summary espone conteggio e reason.

Un flow significativo valido può restare ambiguo quanto alla direzione.

Un `totalMatched` incoerente o in diminuzione deve generare una ragione di qualità, non una direzione certa.

Quando `persistenceComplete:false`, questo ramo non deve ricevere tick Betfair attribuiti per uso cross-source canonico.

## Market → Field

Facade:

```txt
backend/src/sofa/marketLedObservationEvidence.js
```

Flusso:

```txt
significant market flow
→ sourceMarketEvent
→ finestre temporali SofaScore successive
→ osservazioni su score, marker e servizio
```

Le finestre predefinite sono:

```txt
60s
120s
180s
240s
```

Ogni finestra può includere:

```txt
windowSec
windowStart
windowEnd
tick count
score snapshots
latest server
marker osservati
data quality
reasons
```

Il ramo osserva soltanto eventi successivi al flow sorgente.

Se non esistono tick SofaScore successivi, restituisce una ragione esplicita. Non deduce un risultato o una reazione implicita.

Quando la persistenza è incompleta, il ramo resta non disponibile: non deve costruire un `sourceMarketEvent` da tick Betfair non utilizzabili in modo canonico.

## Field → Market

Facade:

```txt
backend/src/sofa/fieldLedReactionEvidence.js
```

Flusso:

```txt
marker SofaScore rilevante
→ sourceFieldEvent
→ anchor temporale
→ finestre Betfair successive
→ osservazioni prezzo e volume
```

Il source event usa:

```txt
sourceFieldEvent.stateFirstSeenAt
```

come anchor temporale.

Marker rilevanti includono quelli esposti dal dominio SofaScore, ad esempio:

```txt
BREAK_POINT
GAME_POINT
DEUCE
THIRTY_ALL
PRESSURE_POINT
```

Configurazione predefinita:

```txt
observationWindowsSec: [10, 30, 60, 120, 180, 240]
maxSourceAgeSec: 240
```

Per ogni finestra:

* baseline Betfair: ultimo tick con timestamp minore o uguale all’anchor;
* tick osservati: strettamente successivi all’anchor;
* cutoff: incluso nel limite della finestra;
* osservazione finale: ultimo tick della finestra.

Output tipico:

```txt
marketMatchedDelta
runnerPriceChanges
priceChangeObserved
matchedVolumeIncreaseObserved
marketResponseObserved
dataQuality
reasons
```

`marketResponseObserved` indica solo che sono stati osservati cambiamenti compatibili con la finestra. Non prova che l’evento SofaScore li abbia causati.

Quando la persistenza è incompleta, il ramo non deve calcolare finestre Betfair attribuite e `marketResponseObserved` resta non confermato.

## Qualità dati

Le finestre disponibili riportano qualità `good`, `medium` o `poor`. `unknown` è riservato al summary di un ramo non disponibile, ad esempio quando manca un source event utilizzabile.

| Condizione                                           | Qualità o motivo                                     |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Baseline disponibile e prezzi runner confrontabili   | `good`                                               |
| Tick presenti ma manca baseline o prezzo comparabile | `medium`                                             |
| Nessun tick successivo all’anchor                    | `poor`                                               |
| Source event assente, invalido o troppo vecchio      | ramo non disponibile; summary `dataQuality: unknown` |
| Source Identity effective non `aligned`              | ramo cross-source sospeso                            |
| `persistenceComplete:false`                          | ramo cross-source sospeso per persistenza incompleta |

Un marker assente o troppo vecchio non deve essere interpretato come “nessuna reazione di mercato”.

Una persistenza incompleta non deve essere interpretata come “nessuna reazione di mercato”: significa soltanto che l’osservazione cross-source non è canonicalmente utilizzabile.

## Frontend

La UI usa:

```txt
frontend/src/hooks/useMarketReactionEvidence.js
frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/marketReactions/
```

Ownership:

| Livello                        | Responsabilità                                                          |
| ------------------------------ | ----------------------------------------------------------------------- |
| `App.jsx`                      | Crea l’unica istanza del polling Evidence e gestisce Source Identity UI |
| `useMarketReactionEvidence.js` | Carica snapshot, refresh, conferma e revoca                             |
| `MarketReactionsPage.jsx`      | Consumer presentazionale dei dati già caricati                          |
| Card Market Reactions          | Visualizzano finestre, qualità, reasons e limiti interpretativi         |

`MarketReactionsPage.jsx` non deve:

* creare un secondo polling;
* gestire conferma o revoca Source Identity;
* montare la modale Source Identity;
* ricostruire Evidence;
* dedurre causalità;
* interpretare `partial_persistence` o `recovery_failed` come errore frontend;
* eseguire recovery o retry di persistenza.

La UI può mostrare la reason di persistenza incompleta ricevuta dallo snapshot, ma non deve ricostruirla leggendo journal o endpoint storage.

## Limiti attuali

Non esistono ancora:

```txt
persistenza storica osservazioni
export
replay Market Reactions
backtest dedicato
journal derivato
```

La vista live mostra soltanto le osservazioni dello snapshot corrente.

Il selector Field → Market usa gli ultimi 60 tick SofaScore. Se più marker sono presenti nel tick più recente, applica la priorità `BREAK_POINT → DEUCE → THIRTY_ALL → GAME_POINT → PRESSURE_POINT`; l’anchor resta `stateFirstSeenAt` dello stato selezionato.

Una modifica a lookback o priorità richiede test dedicati e non deve trasformare marker vecchi in eventi correnti.

## Verifica

```txt
node sofa/marketReactionEvidence.test.mjs
node sofa/significantMarketFlowEvidence.test.mjs
node sofa/marketLedObservationEvidence.test.mjs
node sofa/fieldLedReactionEvidence.test.mjs
node sofa/matchEvidence/evidenceBuilder.test.mjs
```

Controllare sempre:

```txt
Source Identity pending o mismatch sospende le osservazioni
→ causalityClaimed resta false
→ una finestra senza dati espone reasons
→ tick di epoch diverse non vengono confrontati
→ timeline raw non vengono modificate

persistenceComplete:false sospende Market Reactions
→ marketReactionEvidence.available false
→ marketLedAvailable false
→ fieldLedAvailable false
→ fieldLedMarketResponseObserved false
→ causalityClaimed resta false

partial_persistence o recovery_failed
→ non diventano Source Identity mismatch
→ non diventano freshness stale
→ non diventano Graph health degradato
→ non diventano errore runtime scraper

Persistence incomplete: canonical cross-source evidence unavailable
→ reason deduplicata
→ può coesistere con reason Source Identity

frontend
→ non crea polling secondario
→ non ricostruisce Evidence
→ non legge journal
→ non esegue recovery
```

## Documenti collegati

* [Match Evidence Snapshot](./01-match-evidence-snapshot.md)
* [Source Identity](./02-source-identity.md)
* [Qualità, flow e allineamento](./03-quality-flow-and-alignment.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
* [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
* [API Evidence](../../api/03-evidence.md)
* [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
