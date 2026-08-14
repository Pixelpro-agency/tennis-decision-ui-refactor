# Tennis Decision UI — Evidence, provenance e confronti temporali

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-022…024
> **Parte precedente:** [Storage, documenti canonici e recovery](03-storage-recovery.md)
> **Parte successiva:** [Frontend, sessione live e polling](05-frontend-session-polling.md)

## 19. Evidence, provenance e confronti temporali

Questo documento raccoglie le proposte relative a provenance temporale, confronti cross-source, Market Reactions e identità temporale dei runner.

Tutte e tre le aree dispongono già di primitive implementate, ma i relativi contratti risultano ancora incompleti. `IMPL-022`, `IMPL-023` e `IMPL-024` sono quindi classificate come `PARZIALMENTE PRESENTE`.

---

### IMPL-022 — Evidence temporal provenance and alignment policy

**Classificazione:** `NECESSARIA`  
**Stato:** `PARZIALMENTE PRESENTE`  
**Priorità:** critica  
**Decisione:** approvata

### Stato corrente

Evidence possiede già una distinzione esplicita fra freshness delle singole fonti e distanza temporale fra i due tick correnti.

`backend/src/sofa/matchEvidence/alignment.js` costruisce oggi:

```txt
sofaSeq
betfairSeq
sofaTimestamp
betfairTimestamp
sofaAgeSec
betfairAgeSec
maxSourceAgeSec
crossSourceGapSec
pairwiseAvailable
freshnessQuality
maxTickGapSec
alignmentQuality
```

`maxTickGapSec` e `maxSourceAgeSec` rappresentano l'età massima delle fonti rispetto a `now`; `crossSourceGapSec` rappresenta invece la distanza assoluta fra timestamp SofaScore e Betfair quando entrambe le fonti sono disponibili.

La qualità `good | medium | poor` è però ancora determinata dalla freshness dei due tick:

```txt
good
→ SofaScore entro SOFA_RECENT_SEC
→ Betfair entro BETFAIR_RECENT_SEC

medium
→ entrambe le fonti entro MEDIUM_AGE_SEC

poor
→ una fonte manca
→ timestamp non utilizzabile
→ almeno una fonte oltre le soglie correnti
```

`crossSourceGapSec` viene esposto, ma non governa ancora `alignmentQuality` tramite una policy di source skew.

`backend/src/sofa/matchEvidence/time.js` possiede inoltre una tolleranza di clock skew corrente di 5 secondi:

```txt
future timestamp entro tolleranza
→ ageSec clampata a 0

future timestamp oltre tolleranza
→ ageSec null
→ timestampStatus = future
```

`backend/src/sofa/matchEvidence/dataQuality.js` traduce il caso futuro oltre tolleranza in reason esplicite e usa soglie distinte per la recency SofaScore e Betfair.

Esiste anche una seconda famiglia di primitive temporali in `backend/src/sofa/temporalAlignmentEvidence.js` e nei moduli sotto `backend/src/sofa/temporalAlignment/`:

```txt
latestScoreChange
latestRelevantSofaMarker
latestBetfairMove
reactionWindows
reliable
reliabilityReasons
warnings
```

La relation corrente delle reaction window è:

```txt
same_window
sofa_before_betfair
betfair_before_sofa
unknown
```

con `interpretation: temporal_proximity_only` e `causalityClaimed: false`.

### Confine con Source Identity e persistence integrity

`backend/src/sofa/matchEvidence/evidenceBuilder.js` consente i confronti cross-source soltanto quando:

```txt
Source Identity = aligned
AND
persistence integrity non è partial_persistence/recovery_failed
```

Se il gate non è soddisfatto, gli input Betfair cross-source e gli input Market Reactions vengono scoped a `null`/array vuoti prima della costruzione delle Evidence interessate.

Questo gating è comportamento corrente, ma non sostituisce una policy di temporal provenance.

### Gap rispetto al contratto approvato

Il dominio Evidence non espone ancora un owner contract unico che distingua esplicitamente:

```txt
acquiredAt
recordedAt
sourceTimestamp
pipelineDelaySec
futureSkewSec
freshnessAgeSec
validTimestamp
```

Evidence usa principalmente il timestamp canonico del tick e non possiede nel proprio contratto corrente la separazione completa fra acquisition time, persistence/recording time e source-native time.

Non è inoltre presente una policy versionata che faccia dipendere la qualità cross-source da soglie esplicite di skew e provenance:

```txt
alignmentPolicyVersion
freshnessThresholds
sourceSkewThresholds
futureSkewToleranceSec
baselineGapThresholdSec
```

Le soglie correnti sono costanti di modulo e il `crossSourceGapSec` corrente è informativo: non viene usato per classificare `alignmentQuality`.

Le reaction window correnti non espongono ancora in modo uniforme il contratto completo:

```txt
anchorAt
baselineAt
baselineGapSec
firstPostSourceAt
firstPostSourceGapSec
windowStartAt
windowEndAt
windowState
provisional
```

### Contratto approvato da completare

Per ogni source input il contratto target resta:

```txt
source
acquiredAt
recordedAt
sourceTimestamp opzionale
pipelineDelaySec
futureSkewSec
freshnessAgeSec
validTimestamp
```

Per i confronti cross-source:

```txt
sofaAcquiredAt
betfairAcquiredAt
sourceSkewSec
sourceOrder
alignmentQuality
alignmentReasons
```

Per ogni finestra:

```txt
anchorAt
baselineAt
baselineGapSec
firstPostSourceAt
firstPostSourceGapSec
windowStartAt
windowEndAt
windowState
provisional
```

Regole target:

```txt
acquiredAt valido
→ governa freshness e source skew

recordedAt
→ governa audit della pipeline
→ non sostituisce acquiredAt

sourceTimestamp
→ resta informativo finché la semantica della fonte non è verificata
```

Un timestamp futuro oltre la tolleranza della policy deve degradare esplicitamente la qualità e non può essere rappresentato come dato fresco.

Per l'allineamento cross-source il target resta:

```txt
good
→ entrambe le fonti presenti
→ timestamp validi
→ freshness entro soglia
→ sourceSkewSec entro soglia good

medium
→ entrambe presenti
→ freshness/skew entro soglie degraded

poor
→ fonte assente
→ timestamp invalido/futuro
→ skew oltre soglia
```

Una sola fonte non costituisce un allineamento cross-source `medium`.

### Compatibilità

`maxTickGapSec` è ancora presente nel payload corrente insieme a `maxSourceAgeSec`.

Il contratto target deve continuare a distinguere:

```txt
maxSourceAgeSec
→ freshness rispetto a now

crossSourceGapSec / sourceSkewSec
→ distanza fra le fonti
```

senza riutilizzare `maxTickGapSec` per due semantiche differenti.

### Osservabilità target

Lo snapshot deve poter spiegare in modo stabile:

```txt
perché una fonte è stale
perché un confronto è skewed
perché una baseline è troppo lontana
perché una finestra è provisional o incompleta
```

Le reason devono restare bounded e stabili.

### Test associati

I test correnti coprono primitive già presenti, fra cui:

- separazione tra `maxSourceAgeSec` e `crossSourceGapSec`;
- source mancante senza pairwise alignment;
- timestamp invalido;
- timestamp futuro oltre tolleranza degradato a `poor`;
- preservazione dei sequence number.

TEST-ID associati:

```txt
TEST-039
TEST-043
```

La presenza di questa copertura non implica, da sola, che questi TEST-ID o l'intero contratto IMPL-022 siano completati.

---

### IMPL-023 — Market Reaction eligibility e branch state

**Classificazione:** `NECESSARIA`  
**Stato:** `PARZIALMENTE PRESENTE`  
**Priorità:** critica  
**Decisione:** approvata

### Stato corrente

Market Reactions non è una struttura assente.

`backend/src/sofa/marketReactionEvidence.js` compone tre rami reali:

```txt
Significant Market Flow
→ sourceMarketEvent
→ Market-led Observation

Sofa field marker
→ Field-led Reaction
```

Il payload padre espone:

```txt
available
config
significantMarketFlow
marketLedObservation
fieldLedReaction
summary
```

Il summary aggrega, tra gli altri:

```txt
largeFlowDetected
marketLedAvailable
fieldLedAvailable
fieldLedMarketResponseObserved
fieldLedMarketResponseReliable
fieldLedDataQuality
flowAmbiguous
dataQuality
causalityClaimed
reasons
```

`causalityClaimed` è `false` nei builder e nei test correnti.

### Eligibility già presente, ma locale ai singoli rami

Significant Flow applica oggi controlli tecnici reali prima di considerare un candidate valido.

`backend/src/sofa/significantMarketFlow/candidates.js` richiede, per il runner candidato:

```txt
graphHealth.status = ok
ladder affidabile
selectionId disponibile
```

`backend/src/sofa/significantMarketFlow/runnerFlow.js` invalida inoltre il volume quando, fra gli altri casi:

```txt
moneyFlow non confirmed
runnerDelta < 0
marketDelta < 0
runnerMatchedDelta < 0
runnerMatchedDelta > marketDelta + tolerance
```

Queste condizioni impediscono a un candidate invalidato di diventare Significant Flow.

Il gating Source Identity/persistence non appartiene internamente a `marketReactionEvidence.js`: viene applicato a monte da `matchEvidence/evidenceBuilder.js`, che passa al dominio Market Reactions array vuoti quando il confronto cross-source non è consentito.

### Significant Flow corrente

`backend/src/sofa/significantMarketFlowEvidence.js` usa:

```txt
lookbackTicks
baselineLookbackTicks
absoluteThresholds
relativeThresholds
minimumAbsoluteAmount
minimumRelativeMultiplier
```

Le soglie sono configurabili ma non possiedono attualmente metadata come `thresholdVersion` o `calibrationStatus`.

La baseline relativa corrente è una mediana degli importi validi precedenti raccolti nel lookback. Non è ancora una baseline runner-specific vincolata allo stesso `selectionId`.

I cluster correnti:

- lavorano sui candidate validi;
- raggruppano per runner;
- usano una finestra massima in numero di tick (`maxClusterTicks`);
- richiedono tick consecutivi nel lookback;
- espongono `clusterStartAt`, `clusterEndAt`, `clusterSize`, `clusterSeqs` e importi aggregati.

Non esiste ancora il contratto target basato su `maxClusterGapSec`, `inputTickIds` univoci e policy esplicita di non sovrapposizione/doppio conteggio.

### Market → Field corrente

`backend/src/sofa/marketLedObservationEvidence.js` usa l'ultimo Significant Flow come source event e costruisce finestre SofaScore successive al timestamp della source.

Il ramo:

- richiede un source timestamp valido;
- rifiuta source future oltre il controllo locale;
- applica `maxSourceAgeSec`;
- ricerca una baseline SofaScore con timestamp `<=` source event;
- osserva cambi di score/point/game/set/server e marker nelle finestre;
- mantiene `causalityClaimed: false`.

La presenza di una baseline viene rilevata, ma non viene ancora esposto un contratto uniforme con `baselineGapSec`, stato finestra e reason policy condivisa con il ramo opposto.

### Field → Market corrente

`backend/src/sofa/fieldLedReactionEvidence.js` seleziona l'ultimo marker SofaScore rilevante e costruisce finestre Betfair successive all'anchor.

Per ogni finestra ricerca:

```txt
baseline Betfair <= anchor
primo/ultimo tick Betfair nella finestra
market.totalMatched delta
runner price changes
```

Il comportamento corrente considera:

```txt
priceChangeObserved
OR
matchedVolumeIncreaseObserved
→ marketResponseObserved
```

Quindi un aumento generico di `market.totalMatched` può ancora rendere `marketResponseObserved:true`; non esiste ancora la separazione target fra attività generica del mercato e osservazione runner-qualified.

`marketResponseReliable` viene distinto da `marketResponseObserved` e richiede qualità `good` più qualità tecnica Betfair affidabile.

### Gap rispetto al contratto approvato

Non esiste ancora un oggetto uniforme di tick eligibility condiviso da tutti i rami con la forma:

```txt
{
  eligible,
  status,
  reasons,
  policyVersion
}
```

Le verifiche sono distribuite fra Source Identity/persistence gating, Significant Flow candidate validation, data quality e logica dei singoli rami.

Non esiste inoltre uno stato uniforme dei branch con tutti i campi:

```txt
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
dataQuality
reasons
```

`available` è ancora usato con semantiche diverse nei diversi builder.

Non esiste una policy Market Reactions unica che rappresenti esplicitamente lo stato `status_only`. I tick canonici vengono mantenuti dalla pipeline Betfair se rispettano il contratto canonico di base; Significant Flow li degrada di fatto quando Graph/ladder/selectionId/volume non sono eleggibili, ma gli altri rami non consumano un medesimo `tickEligibility` centralizzato.

### Contratto target — eligibility del tick

Il target approvato resta:

```txt
{
  eligible: boolean,
  status:
    eligible |
    degraded |
    status_only |
    stale |
    identity_unavailable |
    persistence_unavailable |
    graph_unavailable |
    ladder_unavailable |
    volume_invalid |
    acquisition_skew |
    runner_identity_unavailable,
  reasons: string[],
  policyVersion: string
}
```

Per un input classificato `status_only` il contratto target deve garantire:

```txt
resta disponibile a health/diagnostica
non entra nella baseline algoritmica
non genera flow
non genera cluster
non diventa source event
non produce da solo apertura/chiusura di Market Reaction
```

### Contratto target — stato uniforme dei rami

Ogni ramo deve poter distinguere:

```txt
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
dataQuality
reasons
```

Un eventuale `available` di compatibilità deve derivare da una semantica unica e documentata.

### Contratto target — Field → Market

Separare:

```txt
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation
```

Il solo aumento di `market.totalMatched` deve poter produrre:

```txt
marketActivityObserved: true
qualifiedMarketObservation: false
```

senza usare una label di response qualificata come sinonimo di attività generica.

### Contratto target — Market → Field

Separare:

```txt
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource
```

Un marker persistente già presente nella baseline non deve essere promosso automaticamente a nuovo evento post-source.

### Coverage target

Integrare i conteggi prodotti dal contratto IMPL-024:

```txt
bookCoverage
ladderCoverage
flowCoverage
```

Le osservazioni che richiedono entrambi i runner devono distinguere almeno coverage completa, parziale e assente.

### Significant Flow target

Il contratto target deve distinguere almeno:

```txt
runnerRelativeMultiplier
marketRelativeMultiplier
```

La baseline runner-specific deve usare soltanto lo stesso `selectionId`.

Ogni flow deve poter esporre:

```txt
algorithmVersion
thresholdVersion
inputTickIds
tickEligibility
baselineType
baselineSampleCount
```

### Cluster target

Il contratto target resta:

```txt
selectionId obbligatorio
maxClusterGapSec
clusterStartAt
clusterEndAt
inputTickIds univoci
no status-only
no input degradati non ammessi
no doppio conteggio
```

Una policy deterministica deve assegnare i tick a cluster non sovrapposti.

### Soglie e calibrazione

Le soglie correnti sono reali e configurabili, ma non sono versionate né marcate come calibrate.

Fino alla disponibilità di una baseline di calibrazione devono essere trattate semanticamente come:

```txt
heuristic
provisional
not_calibrated
not_signal
```

Il target deve aggiungere metadata espliciti:

```txt
thresholdVersion
absoluteThresholds
relativeThresholds
calibrationStatus
```

### Finestre target

Market → Field e Field → Market devono convergere su un contratto uniforme:

```txt
windowState:
  open |
  closed |
  insufficient_data |
  stale_source

provisional
finalForWindow
```

Le strutture correnti possiedono già nozioni di window, chiusura/coverage e data quality, ma non questa forma comune.

### Confini invarianti

Il dominio Market Reactions corrente è evidence read-only e non deve essere promosso semanticamente a signal/strategy.

Il contratto continua a non:

- creare segnali operativi;
- produrre raccomandazioni di trade;
- attribuire intenzione ai trader;
- dichiarare causalità;
- modificare le timeline canoniche;
- avviare recovery;
- cambiare il Source Identity Gate.

Restano invarianti:

```txt
causalityClaimed: false
interpretation: temporal_proximity_only
```

### Estensione futura — journal derivato Market Reactions

Un eventuale journal storico resta una estensione futura e derivata. Non sostituisce timeline o replay e non va presentato come comportamento corrente.

Se implementato in una task dedicata, il requisito approvato resta quello di registrare soltanto cambiamenti materiali, con identità stabile e senza introdurre un secondo polling o ricalcolo implicito.

Identità minima proposta:

```txt
eventId
sourceType
sourceTimestamp / sequence
marketEpochSignature
```

Lifecycle proposto:

```txt
created → in_progress → completed | insufficient_data | not_available
```

### Test associati

La copertura corrente verifica, fra gli altri casi:

- pipeline parent Market Reactions con i tre rami;
- assenza di Significant Flow su Graph stale;
- assenza di Significant Flow con ladder non affidabile;
- assenza di Significant Flow senza `selectionId`;
- distinzione Field-led fra response osservata e response affidabile;
- finestre Field-led multiple;
- invarianti `causalityClaimed:false`;
- assenza di mutazione degli input nei builder coperti dai test.

TEST-ID associati:

```txt
TEST-031
TEST-032
TEST-034
TEST-035
TEST-038
TEST-040
TEST-041
TEST-042
TEST-043
```

La presenza dei test correnti non equivale automaticamente al completamento di questi TEST-ID o dell'intero contratto IMPL-023.

---

### IMPL-024 — Runner temporal identity e price comparability

**Classificazione:** `NECESSARIA`  
**Stato:** `PARZIALMENTE PRESENTE`  
**Priorità:** alta  
**Decisione:** approvata

### Stato corrente

Sono già presenti primitive che usano `selectionId` come identità runner.

In Significant Flow:

```txt
selectionId assente
→ candidate invalidato
→ nessun Significant Flow
```

I flow singoli e i cluster espongono `selectionId`; il ruolo prezzo del runner viene risolto tramite `selectionId` quando possibile.

Questa regola non è però ancora globale per tutti i confronti temporali Betfair.

### Confronto Field → Market corrente

`backend/src/sofa/fieldLedReactionEvidence.js` confronta baseline e latest runner con questa precedenza:

```txt
baseline selectionId presente
→ cerca stesso selectionId nel latest tick

baseline selectionId assente
→ può cercare per name fra runner latest con selectionId assente
```

Esiste quindi ancora un fallback sul nome nel confronto temporale quando entrambi i lati non possiedono `selectionId`.

### Price resolution corrente

Il confronto Field → Market risolve oggi il prezzo con questa precedenza:

```txt
lastTradedPrice
→ midpoint(bestBack, bestLay)
→ bestBack
→ bestLay
→ null
```

L'output `runnerPriceChanges` conserva:

```txt
selectionId
name
baselinePrice
latestPrice
priceDelta
priceDeltaPct
priceDirection
```

ma non conserva la source scelta per `baselinePrice` e `latestPrice`.

Di conseguenza il codice corrente può confrontare valori derivati da fonti prezzo differenti senza esporre un campo di comparabilità della source.

### Baseline Field → Market

La baseline Betfair Field → Market è l'ultimo tick con timestamp `<= anchor`.

Non è ancora applicato un contratto generale che richieda:

```txt
baselineGapSec <= threshold
selectionId identico senza fallback nome
price source policy valida
```

né vengono esposti in modo uniforme `baselineGapSec` e `firstPostSourceGapSec` per ogni confronto runner.

### Coverage corrente

Il dominio possiede controlli tecnici locali su ladder, tradability, graph health e presenza di `selectionId`, ma non espone ancora il set di conteggi runner previsto da IMPL-024:

```txt
expectedRunnerCount
identifiedRunnerCount
comparableRunnerCount
tradableRunnerCount
reliableLadderRunnerCount
reliableFlowRunnerCount
```

né i derivati:

```txt
bookCoverage
ladderCoverage
flowCoverage
priceComparisonCoverage
```

### Gap rispetto al contratto approvato

Restano quindi incompleti tre aspetti principali:

1. identità temporale globale basata esclusivamente su `selectionId` valido e stabile;
2. provenance della source prezzo e policy di comparabilità;
3. coverage runner esplicita e riusabile dagli altri rami Evidence.

### Contratto target — identità temporale runner

La regola approvata resta:

```txt
stesso runner fra tick Betfair
→ stesso selectionId valido e stabile
```

Nessun fallback sul nome nei confronti temporali che richiedono identità Exchange.

Il nome resta metadato presentazionale.

### Contratto target — confronto prezzo

```txt
{
  selectionId,
  baselineRunnerFound,
  latestRunnerFound,
  baselinePrice,
  baselinePriceSource,
  latestPrice,
  latestPriceSource,
  priceSourcesComparable,
  baselineAt,
  latestAt,
  baselineGapSec,
  firstPostSourceGapSec,
  comparisonStatus,
  reasons
}
```

`comparisonStatus` target:

```txt
comparable
degraded_source_change
baseline_too_old
runner_identity_unavailable
price_unavailable
invalid_timestamp
```

### Price source policy target

```txt
stessa source valida
→ comparable

source diversa ammessa
→ degraded_source_change
→ nessuna promozione automatica a osservazione qualificata

source non ammessa
→ price_unavailable
```

La policy deve essere versionata e condivisa almeno tra:

- Field → Market;
- temporal alignment quando effettua confronti runner;
- runner flow evidence;
- replay/backtesting che riutilizzano lo stesso contratto.

### Baseline policy target

La baseline deve soddisfare:

```txt
baselineAt <= anchorAt
baselineGapSec <= threshold
selectionId identico
price source policy valida
```

Altrimenti il confronto deve essere degraded/unavailable con reason esplicita.

### Coverage runner target

Calcolare:

```txt
expectedRunnerCount
identifiedRunnerCount
comparableRunnerCount
tradableRunnerCount
reliableLadderRunnerCount
reliableFlowRunnerCount
```

e derivare:

```txt
bookCoverage
ladderCoverage
flowCoverage
priceComparisonCoverage
```

### Compatibilità

Il completamento di IMPL-024 deve degradare soltanto i rami che richiedono il confronto runner.

Non deve:

- bloccare Start;
- riportare Source Identity a pending;
- fermare scraper o tracker;
- nascondere quote disponibili;
- cambiare il mapping Source Identity;
- rimuovere le altre Evidence non dipendenti dal confronto.

### Test associati

La copertura corrente conferma primitive come:

- `selectionId` obbligatorio per Significant Flow;
- Field-led price change basato su baseline e latest tick;
- comportamento delle finestre in assenza di tick successivi;
- distinzione fra observation e reliability.

La copertura corrente non dimostra il completamento dell'intero contratto target di source-price comparability e coverage runner.

TEST-ID associati:

```txt
TEST-033
TEST-036
TEST-037
TEST-038
```

Restano inoltre pertinenti i casi target:

- `selectionId` cambia tra baseline e latest;
- due runner con stesso nome ma ID diversi;
- source prezzo identica;
- source prezzo cambiata;
- baseline esattamente sulla soglia;
- baseline oltre soglia;
- coverage complete/partial/none.

La presenza di primitive o test correnti non equivale automaticamente al completamento di questi TEST-ID.

---

## 19.1 Estensioni di implementazioni esistenti

Le seguenti estensioni coordinano i contratti delle tre implementazioni con gli owner collegati, senza richiedere che vengano modificati insieme.

### Estensione di IMPL-012 — Fixture e replay

Fixture target da mantenere nel piano:

- status-only dopo flow reale;
- marker persistente prima/dopo source;
- timestamp futuro;
- source skew elevato;
- LTP → midpoint o altra variazione di source prezzo;
- runner senza `selectionId`;
- coverage parziale;
- cluster separati da gap temporale;
- finestre open/closed.

### Estensione di IMPL-013 — Baseline e calibrazione

La baseline target deve poter misurare:

- distribuzione source skew;
- pipeline delay;
- baseline gap reale;
- frequenza source-price changes;
- coverage runner;
- distribuzione flow per `selectionId` e mercato;
- durata reale dei cluster;
- falsi duplicati/status-only;
- percentuale finestre incomplete.

Le soglie Significant Flow correnti non devono essere descritte come calibrate sulla sola base della loro presenza nel codice.

### Coordinamento con IMPL-018 — Acquisition envelope

Il contratto IMPL-022 dipende semanticamente dalla disponibilità di provenance di acquisizione affidabile.

I campi richiesti al confine sono:

```txt
marketApiAcquiredAt
graphAcquiredAt per selectionId
recordedAt
maxGraphSkewMs
acquisitionComplete
```

Il comportamento Evidence corrente usa ancora i timestamp dei tick come input principale per freshness e pairwise gap. Il completo acquisition envelope sopra non risulta quindi ancora consumato dal dominio Evidence.

IMPL-022 deve interpretare la provenance prodotta dall'owner di acquisizione; non deve duplicare la raccolta o ricostruire artificialmente acquisition time dal persistence timestamp.

---

## 19.2 Ordine approvato

L'ordine delle dipendenze resta:

```txt
IMPL-018
→ IMPL-022
→ IMPL-024
→ IMPL-023
→ TEST-031…043
→ IMPL-012
→ IMPL-013
→ calibrazione threshold
```

Questo ordine descrive le dipendenze della proposta e non attesta il completamento dei singoli step.

---
