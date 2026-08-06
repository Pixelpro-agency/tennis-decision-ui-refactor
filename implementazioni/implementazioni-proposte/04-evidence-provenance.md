# Tennis Decision UI — Evidence, provenance e confronti temporali

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-022…024
> **Righe originali:** 1778–2455
> **Parte precedente:** [Storage, documenti canonici e recovery](03-storage-recovery.md)
> **Parte successiva:** [Frontend, sessione live e polling](05-frontend-session-polling.md)

<!-- BEGIN ORIGINAL CONTENT -->
## 19. Implementazioni approvate dal Punto 5

### IMPL-022 — Evidence temporal provenance and alignment policy

**Classificazione:** `NECESSARIA`
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Priorità:** critica
**Decisione:** approvata

### Problema

Evidence usa oggi timestamp con semantiche diverse senza un contratto owner unico:

```txt
timestamp del tick
timestamp interno al payload
momento di costruzione Node
momento di acquisizione Market API
momento di acquisizione Graph
anchor del source event
baseline precedente
primo tick successivo
```

L’attuale `maxTickGapSec` rappresenta l’età massima rispetto a `now`, non il gap fra SofaScore e Betfair.

Timestamp futuri vengono clampati a età zero e possono apparire come dati freschi.

### Dipendenza da IMPL-018

`IMPL-018` introduce l’envelope di acquisizione Betfair.

`IMPL-022` ne definisce l’uso nel dominio Evidence:

```txt
IMPL-018
→ produce provenance temporale

IMPL-022
→ interpreta freshness, skew, anchor e finestre
```

Non duplicare l’acquisizione nei builder Evidence.

### Contratto minimo

Per ogni source input:

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

Per confronti cross-source:

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

### Regole timestamp

```txt
acquiredAt valido
→ governa freshness e source skew

recordedAt
→ governa audit della pipeline
→ non sostituisce acquiredAt

sourceTimestamp
→ informativo finché la semantica della fonte non è verificata
```

Timestamp futuro oltre una tolleranza versionata:

```txt
futureSkewSec > threshold
→ timestamp_degraded
→ freshness non “zero”
→ quality poor/degraded
```

### Regole alignment

```txt
good
→ entrambe le fonti presenti
→ timestamp validi
→ freshness entro soglia
→ sourceSkewSec entro soglia good

medium
→ entrambe presenti
→ freshness o skew entro soglia degraded

poor
→ fonte assente
→ timestamp invalido/futuro
→ skew oltre soglia
```

Una sola fonte non produce un allineamento cross-source `medium`.

### Compatibilità

Durante la migrazione:

```txt
maxTickGapSec legacy
→ mantenibile temporaneamente come alias deprecato
→ semantica documentata come maxSourceAgeSec
```

Nuovi consumer devono usare i campi espliciti.

### Versioning

Le soglie devono appartenere a una configurazione versionata:

```txt
alignmentPolicyVersion
freshnessThresholds
sourceSkewThresholds
futureSkewToleranceSec
baselineGapThresholdSec
```

Nessuna soglia nascosta o duplicata fra moduli.

### Osservabilità

Lo snapshot deve poter spiegare:

```txt
perché una fonte è stale
perché un confronto è skewed
perché una baseline è troppo lontana
perché una finestra è ancora provisional
```

Le reason devono essere bounded e stabili.

### Test minimi

```txt
TEST-039
TEST-043
```

Inoltre:

- timestamp invalido;
- timestamp futuro entro/fuori tolleranza;
- fonte assente;
- source skew esatto;
- recordedAt successivo ad acquiredAt;
- baseline gap esatto;
- nessuna mutazione degli input.

---

### IMPL-023 — Market Reaction eligibility e branch state

**Classificazione:** `NECESSARIA`
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Priorità:** critica
**Decisione:** approvata

### Problema

Market Reactions riceve oggi tick scoped per Source Identity e persistence, ma non possiede una classificazione uniforme della loro eligibility tecnica.

Un tick può essere:

```txt
canonico ma stale
status-only
Graph degradato
ladder non affidabile
volume invalidato
acquisition skewed
runner identity incompleta
```

senza che questa condizione impedisca sempre la creazione di Significant Flow o source event.

I rami usano inoltre `available` con significati differenti.

### Eligibility del tick

Contratto minimo:

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

### Regola `status-only`

```txt
statusOnlyGraphLogin:true
→ resta nella timeline
→ contribuisce a health e diagnostica
→ non contribuisce a baseline algoritmica
→ non genera flow
→ non genera cluster
→ non diventa source event
→ non chiude/apre una Market Reaction
```

### Stato uniforme dei rami

Ogni ramo espone:

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

`available` legacy può essere mantenuto temporaneamente come derivato, ma deve avere una semantica unica e documentata.

### Field → Market

Separare:

```txt
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation
```

Il solo aumento di `market.totalMatched`:

```txt
marketActivityObserved:true
qualifiedMarketObservation:false
```

Non usare la label “response” come sinonimo di attività generica.

### Market → Field

Separare:

```txt
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource
```

Un marker persistente già presente nella baseline non è un nuovo evento.

### Coverage

Integrare i conteggi prodotti da `IMPL-024`:

```txt
bookCoverage
ladderCoverage
flowCoverage
```

Le osservazioni che richiedono entrambi i runner accettano `complete`; `partial` degrada il ramo.

### Significant Flow

Separare:

```txt
runnerRelativeMultiplier
marketRelativeMultiplier
```

La baseline runner-specific usa soltanto lo stesso `selectionId`.

Ogni flow espone:

```txt
algorithmVersion
thresholdVersion
inputTickIds
tickEligibility
baselineType
baselineSampleCount
```

### Cluster

Contratto minimo:

```txt
selectionId obbligatorio
maxClusterGapSec
clusterStartAt
clusterEndAt
inputTickIds univoci
no status-only
no degraded input non ammesso
no doppio conteggio
```

Una policy deterministica decide l’assegnazione dei tick ai cluster non sovrapposti.

### Soglie

Le soglie correnti possono restare soltanto come:

```txt
heuristic
provisional
not_calibrated
not_signal
```

Devono avere:

```txt
thresholdVersion
absoluteThresholds
relativeThresholds
calibrationStatus
```

La calibrazione avviene dopo fixture e baseline del Punto 7.

### Finestre

Ogni finestra espone:

```txt
windowState:
  open |
  closed |
  insufficient_data |
  stale_source

provisional
finalForWindow
```

Market → Field e Field → Market devono usare lo stesso contratto.

### Confini

Questa struttura non:

- crea segnali;
- produce raccomandazioni;
- attribuisce intenzione ai trader;
- dichiara causalità;
- modifica timeline;
- avvia recovery;
- cambia Source Identity Gate.

Restano obbligatori:

```txt
causalityClaimed:false
interpretation:temporal_proximity_only
```

### Estensione futura — journal derivato Market Reactions

Un journal storico, se approvato in una task futura, resta derivato e non
sostituisce timeline o replay. Registra soltanto cambiamenti materiali:
creazione, aggiornamento finestra, chiusura, risultato o indisponibilità
Source Identity su una chiave già stabile.

Identità minima:

```txt
eventId
sourceType
sourceTimestamp / sequence
marketEpochSignature
```

Lifecycle ammesso:

```txt
created → in_progress → completed | insufficient_data | not_available
```

Polling invariati non creano record. La lettura storica è lazy/read-only, non
avvia tracking o ricalcolo e non introduce un secondo polling. Persistono
`interpretation:temporal_proximity_only` e `causalityClaimed:false`.

### Test minimi

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

---

### IMPL-024 — Runner temporal identity e price comparability

**Classificazione:** `NECESSARIA`
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Priorità:** alta
**Decisione:** approvata

### Problema

Più moduli confrontano runner fra tick Betfair usando:

```txt
selectionId quando presente
→ fallback sul nome quando assente
```

Il nome non è un’identità temporale Exchange sufficientemente forte.

I confronti prezzo possono inoltre mescolare:

```txt
LTP
mid book
best back
best lay
```

senza sempre conservare o valutare la source.

### Identità temporale runner

Regola globale approvata:

```txt
stesso runner fra tick Betfair
→ stesso selectionId valido e stabile
```

Nessun fallback sul nome nei confronti temporali.

Il nome resta metadato presentazionale.

### Contratto confronto

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

`comparisonStatus`:

```txt
comparable
degraded_source_change
baseline_too_old
runner_identity_unavailable
price_unavailable
invalid_timestamp
```

### Price source policy

```txt
stessa source valida
→ comparable

source diversa ammessa
→ degraded_source_change
→ nessuna promozione automatica a osservazione qualificata

source non ammessa
→ price_unavailable
```

La policy deve essere versionata e condivisa tra:

- Field → Market;
- temporal alignment;
- runner flow evidence;
- future replay/backtesting.

### Baseline policy

La baseline deve soddisfare:

```txt
baselineAt <= anchorAt
baselineGapSec <= threshold
selectionId identico
price source policy valida
```

Altrimenti il confronto è degraded/unavailable con reason esplicita.

### Coverage runner

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

La modifica degrada soltanto il ramo che richiede il confronto runner.

Non deve:

- bloccare Start;
- riportare Source Identity a pending;
- fermare scraper o tracker;
- nascondere quote disponibili;
- cambiare il mapping Source Identity;
- rimuovere le altre Evidence.

### Test minimi

```txt
TEST-033
TEST-036
TEST-037
TEST-038
```

Aggiungere anche:

- selectionId cambia tra baseline e latest;
- due runner con stesso nome ma ID diversi;
- source prezzo identica;
- source prezzo cambiata;
- baseline esattamente sulla soglia;
- baseline oltre soglia;
- coverage complete/partial/none.

---

## 19.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-012 — Fixture e replay

Aggiungere fixture versionate per:

- status-only dopo flow reale;
- marker persistente prima/dopo source;
- timestamp futuro;
- source skew elevato;
- LTP→mid;
- runner senza selectionId;
- coverage parziale;
- cluster separati da gap temporale;
- finestre open/closed.

### Estensione di IMPL-013 — Baseline e calibrazione

Misurare:

- distribuzione source skew;
- pipeline delay;
- baseline gap reale;
- frequenza source-price changes;
- coverage runner;
- distribuzione flow per selectionId e mercato;
- durata reale dei cluster;
- falsi duplicati status-only;
- percentuale finestre incomplete.

Le soglie Significant Flow non diventano calibrate finché questa baseline non esiste.

### Estensione di IMPL-018 — Acquisition envelope

Aggiungere o garantire:

```txt
marketApiAcquiredAt
graphAcquiredAt per selectionId
recordedAt
maxGraphSkewMs
acquisitionComplete
```

`IMPL-022` consuma questi campi; non deve ricostruirli dal timestamp di persistenza.

## 19.2 Ordine approvato

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



---

<!-- END ORIGINAL CONTENT -->
