# Report documentale — `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-018
Sequenza audit: 18/72
Documento analizzato: 03-quality-flow-and-alignment.md
Percorso documento: docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md
Percorso report: Report documentale/18 - 03-quality-flow-and-alignment.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 936e8669cfa21d6920b5e43ee490561c0e1cbedd
Dimensione documento: 284 righe
Ruolo dichiarato: owner di qualità, flow e allineamento Evidence
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/matchEvidence/dataQuality.js`;
- `backend/src/sofa/matchEvidence/alignment.js`;
- `backend/src/sofa/matchEvidence/alignmentExtension.js`;
- `backend/src/sofa/matchEvidence/noTradeReasons.js`;
- `backend/src/sofa/matchEvidence/marketEvidence.js`;
- `backend/src/sofa/matchEvidence/runnerEvidence.js`;
- `backend/src/sofa/matchEvidence/time.js`;
- `backend/src/sofa/matchEvidence/ladder.js`;
- `backend/src/sofa/matchEvidence/evidenceBuilder.js`;
- `backend/src/sofa/matchEvidence/latestMatchEvidence.js`;
- `backend/src/sofa/marketFlowEvidence.js`;
- `backend/src/sofa/marketFlowEvidence/runnerFlow.js`;
- `backend/src/sofa/marketFlowEvidence/runnerFlow/primitives.js`;
- `backend/src/sofa/marketFlowEvidence/marketSummary.js`;
- `backend/src/sofa/marketFlowEvidence/alignment.js`;
- `backend/src/sofa/marketFlowEvidence/utilities.js`;
- `backend/src/sofa/betfair/moneyFlow.js`;
- `backend/src/sofa/sofaEventMarkers.js`;
- `backend/src/sofa/temporalAlignmentEvidence.js`;
- `backend/src/sofa/temporalAlignment/sofaMarker.js`;
- `backend/src/sofa/temporalAlignment/betfairMove.js`;
- `backend/src/sofa/temporalAlignment/betfairMove/candidateSelection.js`;
- `backend/src/sofa/temporalAlignment/betfairMove/primitives.js`;
- `backend/src/sofa/temporalAlignment/betfairMove/resultBuilders.js`;
- `backend/src/sofa/temporalAlignment/reactionWindows.js`;
- `backend/src/sofa/matchEvidence/dataQuality.test.mjs`;
- `backend/src/sofa/matchEvidence/alignment.test.mjs`;
- `backend/src/sofa/matchEvidence/noTradeReasons.test.mjs`;
- `backend/src/sofa/matchEvidence/marketEvidence.test.mjs`;
- `backend/src/sofa/marketFlowEvidence/runnerFlow.test.mjs`;
- `backend/src/sofa/sofaEventMarkers/markerDetector.test.mjs`;
- i finding già registrati nei report Betfair, Data Lifecycle, Match Evidence Snapshot e Technical Sample Validity.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Separazione qualità tecnica / persistence integrity: corretta nel principio
Source Identity vs qualità tecnica: corretta nel principio
Marker SofaScore: coerenti
Prezzo comparabile: priorità coerente
Flow ambiguity/suppression: filosofia corretta
Allineamento base: naming e semantica fuorvianti
Future timestamps: trattati come freschi
moneyFlowReliable: può diventare true su flow suppressed
Flow reliability locale: non allineata alla ladder reliability globale
Flow diagnostico sotto persistence conflict: documento e composer divergono
Reaction windows: due semantiche/threshold differenti nello stesso payload
Temporal alignment: può restare disponibile su dati stale/degradati
Persistence reason contract: duplicato e parametro integrity inutilizzato
Book tradability: predicati non uniformi
Verification: un test indicato manca e runnerFlow test è parzialmente stale
Modifiche proposte: 10
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
```

Il documento conserva una filosofia corretta:

```text
dato disponibile
≠
dato affidabile

dato fresco
≠
dato canonicalmente utilizzabile cross-source

volume matched
≠
intenzione certa

prossimità temporale
≠
causalità
```

Sono corretti inoltre:

- separazione Source Identity / persistence integrity;
- `persistenceComplete:false` come blocco cross-source e non come stale tecnico;
- Money Flow non promosso a intenzione certa;
- marker SofaScore descrittivi;
- DEUCE e THIRTY_ALL neutrali rispetto al giocatore sotto pressione;
- priorità prezzo `LTP → mid → back → lay`;
- lookback flow limitato all’epoch Betfair attivo dal composer;
- `causalityClaimed:false` nel layer temporale;
- nessuna recovery o scrittura nel layer Evidence.

Le criticità derivano soprattutto dal fatto che il termine:

```text
alignment
```

copre oggi tre contratti diversi:

```text
freshness delle source
ordine marker/market con finestra 10s
prossimità temporale estesa con finestra 30s
```

e che il termine:

```text
reliable
```

non usa criteri uniformi fra:

```text
dataQuality
runnerFlow
marketFlowSummary
temporal alignment
```

---

# 1. `alignmentQuality` misura freshness, non allineamento fra le source

## Esito: naming e contratto fuorvianti

`buildAlignment()` calcola:

```text
sofaAgeSec
betfairAgeSec
```

rispetto a:

```text
now
```

e classifica:

```text
good
medium
poor
```

principalmente sulla freschezza indipendente delle due source.

Il campo:

```text
maxTickGapSec
```

non è il gap temporale fra i due tick.

Con:

```text
Sofa age = 10s
Betfair age = 12s
```

restituisce:

```text
maxTickGapSec = 12
```

anche se il gap reale fra le source è:

```text
2s
```

Il test corrente conferma esplicitamente questa semantica.

## Caso ancora più problematico

Se Betfair manca:

```text
betfairAge = null
Sofa age <= 60s
```

il codice può restituire:

```text
alignmentQuality = medium
```

Il test corrente contiene proprio:

```text
Sofa age = 40s
Betfair = null
→ medium
```

Quindi una struttura chiamata:

```text
alignment between Sofa and Betfair
```

può essere `medium` senza avere alcun dato Betfair.

## Finding `QUALITY-FLOW-001` — separare freshness e pairwise alignment

**Priorità:** alta  
**Tipo:** temporal semantics

### Modifica richiesta

Distinguere almeno:

```text
source freshness
da
cross-source temporal gap
```

Opzione preferibile:

```text
alignmentQuality
→ rinominare/ridefinire come freshnessQuality

maxTickGapSec
→ rinominare come maxSourceAgeSec
```

oppure cambiare il calcolo affinché il campo rappresenti davvero:

```text
abs(sofaTimestamp - betfairTimestamp)
```

### Missing source

Quando una source necessaria al confronto manca:

```text
pairwise alignment
→ unavailable
```

non `medium`.

### Non duplicare

La vera relazione marker/market è già posseduta dai moduli temporali; evitare una seconda definizione incompatibile.

---

# 2. Timestamp futuri vengono trattati come freschi

## Esito: freshness fail-open sul clock skew

`ageSec()` usa:

```js
Math.max(0, now - timestamp)
```

Quindi un timestamp futuro viene trasformato in:

```text
ageSec = 0
```

e può diventare:

```text
sofaRecent:true
betfairRecent:true
alignmentQuality:good
```

anche se il dato è temporalmente incoerente.

Lo stesso pattern compare anche nei helper temporali di:

```text
Sofa marker
Betfair move
```

## Impatto

Un clock skew o timestamp corrotto nel futuro non viene distinto da:

```text
dato appena acquisito
```

Questo è incompatibile con la frase:

```text
l’allineamento usa soltanto timestamp validi
```

se per “validi” si intende anche temporalmente plausibili.

## Finding `QUALITY-FLOW-002` — introdurre una policy per future timestamp / clock skew

**Priorità:** alta  
**Tipo:** freshness validation

### Modifica richiesta

Distinguere:

```text
timestamp parseabile
da
timestamp temporalmente plausibile
```

Il progetto deve definire una tolleranza di clock skew approvata.

Non inventare la soglia nel documento.

Oltre la tolleranza:

```text
freshness
→ non recent / invalid

alignment
→ non affidabile

reason
→ bounded e specifica
```

### Test

Aggiungere:

```text
timestamp futuro lieve entro tolleranza
timestamp futuro oltre tolleranza
timestamp invalido
```

---

# 3. `dataQuality.moneyFlowReliable` può diventare `true` su Money Flow `suppressed`

## Esito: gap critico

`buildDataQuality()` considera affidabile il Money Flow di almeno un runner se:

```text
ladder source affidabile
ladder non vuota
moneyFlow object
back o lay numerico
reason non nella blacklist
delta non negativi
```

Non controlla:

```text
moneyFlow.confidence === "suppressed"
```

## Contratto del producer

`buildSuppressedMoneyFlow()` produce:

```text
back:0
lay:0
trend:neutral
confidence:suppressed
reason:<reason>
```

Quindi i campi `back` e `lay` sono comunque numeri.

## Blacklist non allineata

La blacklist `INVALID_MONEY_FLOW_REASONS_ME` contiene reason come:

```text
classified_volume_exceeds_runner_delta
runner_delta_raw_computed_mismatch
market_delta_raw_computed_mismatch
```

che non corrispondono al set corrente prodotto da `calculateValidatedMoneyFlow()`.

Il producer corrente usa, fra gli altri:

```text
current_ladder_not_graph
graph_recovered_after_non_graph
previous_ladder_not_graph
market_matched_unavailable
no_total_matched_delta
runner_matched_unavailable
runner_matched_unchanged
matched_total_decreased
runner_delta_exceeds_market_delta
flow_exceeds_runner_delta
```

In particolare:

```text
flow_exceeds_runner_delta
```

non è nella blacklist di `dataQuality`.

## Esempio

```text
Graph health ok
ladder Graph non vuota
moneyFlow:
  back:0
  lay:0
  confidence:suppressed
  reason:runner_matched_unavailable
```

può produrre:

```text
moneyFlowReliable:true
```

pur essendo esplicitamente suppressed dal producer.

## Finding `QUALITY-FLOW-003` — usare il contratto producer per la reliability Money Flow

**Priorità:** critica  
**Tipo:** data quality integrity

### Target

La quality non deve mantenere una tassonomia reason duplicata e stale.

Almeno:

```text
confidence === confirmed
→ candidato reliable

confidence === suppressed
→ moneyFlowReliable:false
```

eventuali reason aggiuntive devono provenire da un owner condiviso o da un predicate unico.

### Test

Aggiungere casi per tutte le principali suppression reason correnti.

---

# 4. `flowEvidence.reliable` non richiede una ladder realmente disponibile

## Esito: reliability incoerente fra layer

La quality globale considera ladder affidabile soltanto quando:

```text
Betfair recente
Graph health ok
ladderSource affidabile
ladder array non vuota
```

`runnerFlow`, invece, definisce `currentReliable` usando soltanto:

```text
graphHealthStatus === ok
ladderSource affidabile
```

senza verificare:

```text
ladder.length > 0
```

Anche `isReliableEntry()` per il lookback verifica:

```text
Graph health ok
runner presente
ladderSource affidabile
```

ma non richiede una ladder non vuota.

## Conseguenza

È possibile avere nello stesso snapshot:

```text
dataQuality.ladderReliable = false

runner.flowEvidence.reliable = true
marketFlowSummary.reliable = true
```

Per esempio con:

```text
ladderSource = graph
ladder = []
Graph health = ok
moneyFlow/delta presenti
```

## Effetto sull’allineamento

`marketFlowSummary` può selezionare un `dominantRunner` da flow localmente `reliable`.

Quel runner può poi alimentare:

```text
lastBetfairMove
eventMarketGapSec
marketReactionOrder
```

anche se la quality globale considera la ladder non affidabile.

## Finding `QUALITY-FLOW-004` — unificare il predicate di flow/ladder reliability

**Priorità:** alta  
**Tipo:** reliability contract

### Modifica richiesta

Definire un predicate condiviso per una entry flow utilizzabile.

Deve stabilire esplicitamente se servono:

```text
Graph health ok
ladderSource Graph-compatible
ladder non vuota
timestamp valido
runner identity valida
```

La decisione su `selectionId` va coordinata con:

```text
TECH-SAMPLE-002
```

### Obiettivo

Evitare che:

```text
global quality
e
flow summary
```

attribuiscano reliability opposta allo stesso tick.

---

# 5. Sotto persistence conflict il documento promette flow diagnostico che il composer non costruisce

## Esito: divergenza diretta documento/codice

Il documento afferma:

```text
Se persistenceComplete:false,
il flow può restare diagnosticamente calcolabile sul tick letto,
ma non deve essere promosso a Evidence canonica cross-source.
```

Il composer Evidence applica invece:

```text
crossSourceAllowed
=
sourceIdentity aligned
AND
nessun persistence conflict
```

e poi:

```text
scopedBetfairTick
→ null se crossSourceAllowed false

scopedLookbackEntries
→ []

buildMarketEvidence(scopedBetfairTick, ...)
```

Quindi, con:

```text
partial_persistence
recovery_failed
```

`marketEvidence` non calcola il flow sul raw Betfair tick.

Resta disponibile soltanto la quality tecnica costruita sul tick raw:

```text
betfairRecent
graphHealth
ladderReliable
moneyFlowReliable
marketTradable
```

ma non il dettaglio `marketEvidence.flowEvidence`.

La stessa cosa avviene con Source Identity `pending/mismatch`.

## Finding `QUALITY-FLOW-005` — decidere il contratto del flow diagnostico quando cross-source è bloccato

**Priorità:** alta  
**Tipo:** evidence scoping

### Opzione A — comportamento corrente

Documentare:

```text
raw Betfair technical quality
→ ancora osservabile

marketEvidence flow
→ non costruito quando cross-source non autorizzato
```

### Opzione B — diagnostica Betfair separata

Se si desidera mantenere flow field-independent:

```text
costruirlo in un blocco diagnostico esplicitamente non cross-source
```

senza renderlo:

- Market Reaction;
- attribuzione SofaScore;
- reason positiva di trade;
- Evidence canonica cross-source.

La decisione deve essere unica nel composer Evidence.

---

# 6. Esistono due reaction window differenti nello stesso `alignment`

## Esito: semantica potenzialmente contraddittoria

`alignmentExtension` aggiunge:

```text
eventMarketGapSec
marketReactionOrder
temporal
```

## Primo contratto

`computeMarketReactionOrder()` usa:

```text
SAME_WINDOW_SEC = 10
```

e produce:

```text
same_window
market_after_sofa
market_before_sofa
```

## Secondo contratto

`computeReactionWindows()` usa:

```text
REACTION_WINDOW_SEC = 30
```

e produce:

```text
same_window
sofa_before_betfair
betfair_before_sofa
```

## Input differenti

Il primo percorso parte da:

```text
latest marker nella Sofa Evidence corrente
+
move del dominant runner del market flow
```

Il secondo usa:

```text
latest relevant marker nel lookback Sofa fino a 60 tick
+
latest Betfair move nel lookback fino a 20 tick
```

Quindi non sono soltanto due threshold.

Sono due definizioni diverse di:

```text
quale evento Sofa
quale movimento Betfair
quale finestra temporale
```

## Conseguenza

Un gap di:

```text
20 secondi
```

può essere:

```text
market_after_sofa
```

nel primo contratto e:

```text
same_window
```

nel secondo.

Entrambi sono esposti dentro lo stesso blocco `alignment`.

## Finding `QUALITY-FLOW-006` — consolidare o nominare esplicitamente i due contratti temporali

**Priorità:** alta  
**Tipo:** temporal alignment contract

### Modifica richiesta

Scegliere una delle due strade:

### A. un solo contratto canonico

Unificare:

- input;
- threshold;
- nomenclatura.

### B. due contratti deliberatamente distinti

Rinominarli per rendere chiaro che non sono equivalenti.

Per esempio:

```text
latestSnapshotMarkerOrder
temporalLookbackReactionWindow
```

La soglia deve essere documentata dall’owner che la possiede.

---

# 7. Temporal alignment non applica freshness/Graph/ladder eligibility

## Esito: diagnostica più permissiva del testo

`buildTemporalAlignment()` riceve i tick soltanto dopo il gating:

```text
Source Identity aligned
persistence complete
```

ma non riceve:

```text
dataQuality
```

e non verifica globalmente:

```text
Betfair recent
Graph health ok
ladder reliable
market tradable
Sofa recent
```

`computeLatestBetfairMove()` può produrre:

```text
available:true
```

da un movimento nel lookback e restituisce `ageSec`, ma non rende automaticamente il move unavailable quando è stale.

La candidate selection non blocca il move sulla base di:

```text
graphHealth
ladderSource
```

Questi campi vengono soprattutto riportati nel risultato.

## Conseguenza

Può esistere:

```text
temporal.reactionWindows.relation != unknown
```

anche quando:

```text
dataQuality.betfairRecent = false
```

oppure Graph/ladder non sono affidabili.

`noTradeReasons` può comunque bloccare l’operatività, quindi non si tratta automaticamente di un trade signal.

Il problema è semantico:

```text
alignment disponibile
```

può significare soltanto:

```text
relazione diagnostica fra timestamp presenti
```

non:

```text
relazione cross-source tecnicamente affidabile
```

## Finding `QUALITY-FLOW-007` — distinguere temporal diagnostic availability da reliable alignment

**Priorità:** alta  
**Tipo:** temporal quality gating

### Modifica richiesta

Decidere se il temporal alignment debba:

### restare diagnostico

Allora documentare esplicitamente:

```text
available
≠ reliable
```

e aggiungere quality/reliability fields o reasons.

### diventare canonicalmente reliable

Allora applicare i predicate necessari prima di costruire la relazione.

Non usare una relazione stale/degradata come evidenza favorevole.

---

# 8. Persistence reason: parametro `integrity` inutilizzato e costante duplicata

## Esito: contract drift risk

`buildNoTradeReasons()` ha signature:

```text
buildNoTradeReasons(dataQuality, alignment, integrity)
```

ma non usa:

```text
integrity
```

La reason di persistenza dipende esclusivamente da:

```text
dataQuality.persistenceComplete === false
```

Il test conferma anche che, quando `persistenceComplete` è assente:

```text
nessuna reason di persistenza
```

viene aggiunta.

Nell’integrazione corrente `evidenceBuilder` chiama prima `buildDataQuality()`, quindi il percorso principale resta coerente.

## Duplicazione

La stringa:

```text
Persistence incomplete: canonical cross-source evidence unavailable
```

è duplicata in più moduli:

- dataQuality;
- noTradeReasons;
- evidenceBuilder.

Questo aumenta il rischio di drift fra:

```text
dataQuality.reasons
noTradeReasons
Market Reaction summary
```

## Finding `QUALITY-FLOW-008` — definire una sola authority per persistence blocking reasons

**Priorità:** media  
**Tipo:** reason ownership

### Modifica richiesta

Scegliere:

```text
noTradeReasons usa solo dataQuality
```

e rimuovere il parametro `integrity` inutilizzato,

oppure:

```text
integrity è un defensive backstop
```

e usarlo realmente.

Centralizzare inoltre reason/code in un owner condiviso o derivarla da un code stabile.

La deduplica deve restare deterministica.

---

# 9. Il contratto `bookTradable` non è uniforme

## Esito: predicate divergenti

`runnerEvidence` considera il book tradabile quando:

```text
bestBack > 0
bestLay > 0
bestLay > bestBack
```

La stessa regola è usata da:

```text
temporalAlignment.isBookTradable()
```

`runnerFlow`, invece, nel downgrade finale usa:

```text
bestBack !== null
bestLay !== null
bestLay > bestBack
```

senza richiedere:

```text
bestBack > 0
bestLay > 0
```

## Conseguenza

Un book come:

```text
bestBack = 0
bestLay = 1
```

è:

```text
non tradabile
```

per dataQuality/runnerEvidence/temporal alignment,

ma può risultare:

```text
tradabile
```

dentro `runnerFlow` quando decide se degradare una interpretazione direzionale.

## Finding `QUALITY-FLOW-009` — condividere il predicate book tradable

**Priorità:** alta  
**Tipo:** market quality consistency

### Modifica richiesta

Usare un solo helper canonico:

```text
bestBack > 0
bestLay > 0
bestLay > bestBack
```

in tutti i layer.

Aggiungere test su:

```text
zero
negativi
crossed book
one-sided
valid two-sided
```

---

# 10. Verification contract non allineato allo stato corrente

## Esito: coverage incompleta e un comando inesistente

Il documento elenca:

```text
node sofa/temporalAlignmentEvidence.test.mjs
```

ma il file non esiste al commit auditato.

Gli altri test principali elencati risultano presenti:

```text
dataQuality.test.mjs
alignment.test.mjs
marketEvidence.test.mjs
runnerFlow.test.mjs
markerDetector.test.mjs
```

## `runnerFlow.test.mjs`

Il test chiama:

```text
buildRunnerFlowEvidence(
  currentRunner,
  currentEntry,
  [previousEntry],
  [currentEntry, previousEntry],
  'ok'
)
```

ma il quarto parametro reale è:

```text
betfairRecent
```

booleano.

Il test passa invece un array, che funziona soltanto perché è truthy.

Inoltre usa:

```text
moneyFlow.trend = "back"
```

mentre il producer corrente usa:

```text
backing
laying
neutral
```

Il test verifica i numeri principali ma non riproduce fedelmente il contratto producer.

## Gap di test emersi

Non sono coperti in modo sufficiente:

```text
future timestamp
medium alignment con source mancante
pairwise gap vs max source age
moneyFlow confidence suppressed
flow_exceeds_runner_delta
ladderSource Graph con ladder vuota
marketFlowSummary reliable vs dataQuality ladderReliable
10s vs 30s reaction windows
stale temporal move
book bestBack/bestLay <= 0
```

## Finding `QUALITY-FLOW-010` — riallineare la verification matrix

**Priorità:** alta  
**Tipo:** test contract

### Modifica richiesta

- rimuovere il test path inesistente oppure creare realmente la suite temporal alignment;
- correggere la signature usata da `runnerFlow.test.mjs`;
- usare trend prodotti realmente dal runtime;
- aggiungere test cross-module sui predicate di reliability;
- testare esplicitamente le due finestre temporali se restano separate.

Non riportare PASS per suite non presenti o non eseguite.

---

# 11. Persistence integrity

## Esito: principio corretto

`buildDataQuality()` deriva:

```text
persistenceComplete = false
```

soltanto per:

```text
partial_persistence
recovery_failed
```

e non modifica:

```text
sofaRecent
betfairRecent
graphHealth
ladderReliable
marketTradable
```

Questa separazione è coerente con il documento.

## Limite già registrato altrove

Status integrity sconosciuti possono essere normalizzati verso:

```text
no_known_partial
```

in un layer precedente.

La forward compatibility di quel comportamento appartiene agli owner storage/Evidence composer e non viene duplicata qui.

---

# 12. Source Identity

## Esito: separazione corretta

`buildDataQuality()` non riceve Source Identity.

È quindi corretta l’idea:

```text
Source Identity
→ autorizza attribution/cross-source use

non
→ modifica la freschezza tecnica del tick
```

Il gating effettivo avviene nel composer:

```text
crossSourceAllowed
=
aligned
AND
persistence complete
```

Il documento può mantenere questa distinzione.

---

# 13. Prezzo comparabile

## Esito: coerente

Il flow usa:

```text
lastTradedPrice
→ mid(bestBack, bestLay)
→ bestBack
→ bestLay
```

e richiede valori positivi nel price extractor.

Questa parte del documento è corretta.

Il problema `bookTradable` separato è trattato in `QUALITY-FLOW-009`.

---

# 14. Lookback Betfair

## Esito: corretto nel percorso composer corrente

`latestMatchEvidence` costruisce prima:

```text
activeBetfairEpoch
```

poi passa all’estrazione del flow:

```text
activeBetfairTimeline
→ extractLookbackEntries()
```

che usa fino a:

```text
10 tick precedenti
```

escludendo il tick corrente.

Quindi la frase:

```text
fino a dieci tick precedenti del solo epoch attivo
```

è corretta nel percorso Evidence corrente.

## Dipendenza

La canonicalità dell’active epoch dipende dal boundary di input già registrato in:

```text
EVID-SNAPSHOT-001
```

Non creare un secondo fix in questo documento.

---

# 15. Marker SofaScore

## Esito: coerente

Sono implementati:

```text
BREAK_POINT
DEUCE
THIRTY_ALL
GAME_POINT
PRESSURE_POINT
```

I test confermano:

```text
DEUCE
→ playerUnderPressure:null

THIRTY_ALL
→ playerUnderPressure:null
```

e il break point richiede server identificabile.

Questa parte può restare.

---

# 16. Causalità

## Esito: corretta

`computeReactionWindows()` restituisce sempre:

```text
interpretation: temporal_proximity_only
causalityClaimed:false
```

Anche quando:

```text
Sofa marker precede Betfair
```

la reason esplicita:

```text
but causality not established
```

Questa proprietà va preservata.

Il finding riguarda soltanto:

- affidabilità;
- freshness;
- definizioni multiple della finestra.

---

# 17. Flow ambiguity

## Esito: filosofia corretta

`runnerFlow` e temporal alignment distinguono:

```text
classifiedVolume
unclassifiedVolume
suppressedVolume
directionAttributed
directionReliable
flowAmbiguous
invalidVolume
```

Un flow non attribuibile non diventa automaticamente pressione direzionale certa.

Questa parte è allineata alla filosofia del progetto.

## Precisione importante

La reliability globale deve però essere corretta tramite:

```text
QUALITY-FLOW-003
QUALITY-FLOW-004
```

altrimenti un flow suppressed può essere etichettato troppo positivamente da altri blocchi.

---

# 18. `noTradeReasons`

## Esito: separazione generale coerente

Le reason principali bloccano:

```text
Sofa non live
Sofa stale
Betfair stale/missing
book non two-sided
ladder non reliable
alignment poor
persistence incomplete
```

Flow invalidato resta prevalentemente in:

```text
dataQuality.reasons
```

come diagnostica.

Questa scelta coincide con il documento.

La correzione necessaria riguarda l’authority della reason persistence, trattata in `QUALITY-FLOW-008`.

---

# 19. Lunghezza, integrità del contesto e modularizzazione

## Valutazione

```text
Righe: 284
Responsabilità primaria: qualità e relazione dei dati Evidence
Sottotemi: data quality, flow, markers, alignment
Dipendenza reciproca fra sottotemi: alta
Owner specialistici sottostanti: già modularizzati nel codice
Duplicazione documentale: moderata
Necessità di nuovi owner canonici: no
Suddivisione richiesta: no
```

Il documento non deve essere diviso soltanto perché attraversa più moduli.

La responsabilità comune è:

```text
stabilire come un dato diventa:
disponibile
→ fresco
→ affidabile
→ confrontabile
→ temporalmente descrivibile
```

Creare:

```text
03a-quality.md
03b-flow.md
03c-alignment.md
```

rischierebbe di nascondere proprio le incoerenze cross-layer emerse nell’audit.

La soluzione è:

- mantenere un solo owner;
- distinguere esplicitamente i diversi livelli di reliability;
- rinviare gli algoritmi dettagliati ai moduli owner;
- definire una terminologia unica per freshness/alignment/reaction windows.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-018
Percorso report: Report documentale/18 - 03-quality-flow-and-alignment.md
Documento: docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md
Change ID: QUALITY-FLOW-001
Change ID: QUALITY-FLOW-002
Change ID: QUALITY-FLOW-003
Change ID: QUALITY-FLOW-004
Change ID: QUALITY-FLOW-005
Change ID: QUALITY-FLOW-006
Change ID: QUALITY-FLOW-007
Change ID: QUALITY-FLOW-008
Change ID: QUALITY-FLOW-009
Change ID: QUALITY-FLOW-010
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 018
→ indice 18 ANALIZZATO
→ Divisione non necessaria
→ aggiungere 10 task
→ preservare integralmente i report precedenti

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-018
→ appendere soltanto QUALITY-FLOW-001..010
→ preservare il ledger incrementale esistente
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `QUALITY-FLOW-001` — freshness vs alignment

**Priorità:** high

- separare age/freshness da pairwise temporal gap;
- correggere `maxTickGapSec`;
- non classificare come `medium` un cross-source alignment senza Betfair;
- evitare duplicazioni con il temporal alignment vero.

## `QUALITY-FLOW-002` — future timestamp

**Priorità:** high

- definire clock-skew policy;
- non trasformare automaticamente timestamp futuri in age 0;
- degradare freshness/alignment oltre la tolleranza approvata;
- aggiungere reason e test.

## `QUALITY-FLOW-003` — Money Flow reliability

**Priorità:** critical

- usare `confidence`/predicate del producer;
- `suppressed` non deve diventare reliable;
- eliminare blacklist reason stale;
- centralizzare il contratto Money Flow;
- testare tutte le suppression reason correnti.

## `QUALITY-FLOW-004` — flow/ladder reliability

**Priorità:** high

- unificare i predicate fra dataQuality e runnerFlow;
- decidere esplicitamente il requisito ladder non vuota;
- evitare marketFlowSummary reliable mentre ladderReliable è false;
- coordinare runner identity con `TECH-SAMPLE-002`.

## `QUALITY-FLOW-005` — flow diagnostico sotto cross-source block

**Priorità:** high

- riallineare testo e composer;
- scegliere se marketEvidence flow deve sparire o restare in un blocco diagnostico Betfair-only;
- non promuovere diagnostica raw a cross-source Evidence.

## `QUALITY-FLOW-006` — reaction window contract

**Priorità:** high

- gestire 10s vs 30s;
- gestire input marker/move differenti;
- consolidare oppure rinominare i due contratti;
- documentare una sola authority per ciascuna semantica.

## `QUALITY-FLOW-007` — temporal diagnostic reliability

**Priorità:** high

- distinguere `available` da `reliable`;
- decidere il ruolo di freshness/Graph/ladder/book;
- non usare relation stale/degradata come Evidence favorevole;
- aggiungere reason quality-specific.

## `QUALITY-FLOW-008` — persistence reason ownership

**Priorità:** medium

- eliminare o usare davvero il parametro `integrity` di `buildNoTradeReasons`;
- centralizzare reason/code persistence;
- mantenere deduplica deterministica.

## `QUALITY-FLOW-009` — book tradability predicate

**Priorità:** high

- condividere `bestBack > 0 && bestLay > 0 && bestLay > bestBack`;
- riallineare runnerFlow, runnerEvidence e temporal alignment;
- testare zero/negativi/crossed/one-sided.

## `QUALITY-FLOW-010` — verification contract

**Priorità:** high

- correggere il path test temporal inesistente;
- correggere la signature nel runnerFlow test;
- usare trend producer-compatible;
- coprire future timestamps, suppressed flow, empty ladder, dual windows e book predicate.

---

# Ordine consigliato di applicazione

```text
1. QUALITY-FLOW-003 — Money Flow reliability
2. QUALITY-FLOW-004 — flow/ladder predicate
3. QUALITY-FLOW-009 — book tradable predicate
4. QUALITY-FLOW-001 — freshness vs alignment
5. QUALITY-FLOW-002 — clock skew
6. QUALITY-FLOW-006 — reaction windows
7. QUALITY-FLOW-007 — temporal availability/reliability
8. QUALITY-FLOW-005 — diagnostic flow under cross-source block
9. QUALITY-FLOW-008 — persistence reason authority
10. QUALITY-FLOW-010 — complete verification
11. revisione mirata del documento
12. checker documentali
13. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

Le prime tre modifiche devono essere trattate come coerenza dei dati, non come nuova strategia o segnale.

---

# Verifica prevista dopo un’eventuale modifica

## Data Quality

Testare:

```text
Graph ok + ladder Graph + moneyFlow confirmed
→ moneyFlowReliable true

Graph ok + ladder Graph + moneyFlow suppressed
→ moneyFlowReliable false

reason flow_exceeds_runner_delta
→ non reliable

runner_matched_unavailable
→ non reliable

no_total_matched_delta
→ comportamento definito
```

## Ladder / Flow

```text
ladderSource graph + ladder []
→ flow reliability coerente con dataQuality

previous entry graph + ladder []
→ comportamento definito

marketFlowSummary.reliable
→ non contraddice global quality senza reason esplicita
```

## Book

```text
bestBack 0
bestLay 1
→ non tradable

bestBack -1
bestLay 1
→ non tradable

bestBack 2
bestLay 1.9
→ non tradable

bestBack 1.9
bestLay 2.0
→ tradable
```

Lo stesso risultato deve valere in tutti i moduli.

## Freshness

```text
timestamp valido passato
timestamp invalido
timestamp futuro entro tolleranza
timestamp futuro oltre tolleranza
```

## Alignment base

```text
Sofa age 10
Betfair age 12
→ pairwise gap 2s se il campo dichiara gap

Betfair missing
→ pairwise alignment unavailable
```

## Reaction windows

Se restano entrambi i contratti:

```text
gap 5s
gap 20s
gap 40s
```

deve essere evidente perché e dove le classificazioni differiscono.

## Temporal diagnostic

```text
move fresco + Graph ok
move stale
move Graph degraded
move con ladder unreliable
```

Verificare:

```text
available
reliable
warnings/reasons
```

secondo il contratto scelto.

## Persistence conflict

```text
partial_persistence
recovery_failed
```

Verificare esplicitamente se:

```text
marketEvidence flow
→ unavailable
```

oppure:

```text
diagnostic-only
```

secondo la decisione finale.

In entrambi i casi:

```text
no cross-source promotion
no causal claim
```

## Verification files

Il documento deve elencare soltanto test realmente presenti o creati nella stessa task.

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
03-quality-flow-and-alignment.md: FILOSOFIA CORRETTA, PREDICATI E SEMANTICA DA ALLINEARE

Persistence vs freshness: corretta
Source Identity vs technical quality: corretta
Marker SofaScore: corretti
Price priority: corretta
Flow ambiguity: corretta nel principio
Causality: non dichiarata, corretto

alignmentQuality: in realtà freshness quality
maxTickGapSec: non è pairwise gap
alignment medium senza Betfair: possibile
future timestamps: age 0 / fresh
moneyFlowReliable su suppressed: possibile
Money Flow reason taxonomy: stale/duplicata
flowEvidence reliable senza ladder non vuota: possibile
marketFlowSummary vs dataQuality reliability: può divergere
flow diagnostico con persistence conflict: promesso dal documento ma non costruito dal composer
reaction window: 10s e 30s nello stesso alignment
temporal alignment: non freshness/Graph gated
persistence reason: owner duplicato
bookTradable: predicate divergenti
temporalAlignmentEvidence.test.mjs: assente
runnerFlow test: signature e trend non fedeli al producer

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: alta
```

Il documento deve restare unico.

Il punto centrale da correggere è il significato di:

```text
available
fresh
reliable
aligned
canonicalmente utilizzabile
```

Questi termini oggi sono concettualmente corretti, ma non sono ancora applicati con predicate uniformi in tutti i moduli che compongono Evidence.
