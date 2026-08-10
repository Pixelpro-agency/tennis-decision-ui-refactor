# Report documentale — `docs/tennis-decision-ui/modules/evidence/04-market-reactions.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-019
Sequenza audit: 19/72
Documento analizzato: 04-market-reactions.md
Percorso documento: docs/tennis-decision-ui/modules/evidence/04-market-reactions.md
Percorso report: Report documentale/19 - 04-market-reactions.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: dfbf62517bcbef9229604a71da3dea9e49ff5690
Dimensione documento: 425 righe
Ruolo dichiarato: owner delle osservazioni temporali Market Reactions
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/marketReactionEvidence.js`;
- `backend/src/sofa/significantMarketFlowEvidence.js`;
- `backend/src/sofa/significantMarketFlow/config.js`;
- `backend/src/sofa/significantMarketFlow/candidates.js`;
- `backend/src/sofa/significantMarketFlow/runnerFlow.js`;
- `backend/src/sofa/significantMarketFlow/singleTick.js`;
- `backend/src/sofa/significantMarketFlow/clusters.js`;
- `backend/src/sofa/marketLedObservationEvidence.js`;
- `backend/src/sofa/marketLedObservationEvidence/windowCollection.js`;
- `backend/src/sofa/marketLedObservationEvidence/observationWindow.js`;
- `backend/src/sofa/fieldLedReactionEvidence.js`;
- `backend/src/sofa/temporalAlignmentEvidence.js`;
- `backend/src/sofa/temporalAlignment/sofaMarker.js`;
- `backend/src/sofa/matchEvidence/evidenceBuilder.js`;
- `backend/src/sofa/matchEvidence/latestMatchEvidence.js`;
- `backend/src/sofa/betfair/moneyFlow.js`;
- `backend/src/sofa/betfair/timeline/statusOnlySnapshot.js`;
- `backend/src/sofa/marketReactionEvidence.test.mjs`;
- `backend/src/sofa/marketLedObservationEvidence.test.mjs`;
- `backend/src/sofa/fieldLedReactionEvidence.test.mjs`;
- `backend/src/sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs`;
- `frontend/src/App.jsx`;
- `frontend/src/hooks/useMarketReactionEvidence.js`;
- `frontend/src/components/MarketReactionsPage.jsx`;
- `frontend/src/components/marketReactions/MarketLedObservationCard.jsx`;
- `frontend/src/components/marketReactions/FieldLedReactionCard.jsx`;
- i finding dei report `TDUI-DOC-REPORT-016`, `017` e `018`.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Causalità: correttamente non dichiarata
Source Identity / persistence gating nel composer: corretto
Active Betfair epoch: correttamente applicato dal loader
Market → Field windows: implementate
Field → Market windows: implementate
Timeline mutation: assente
Significant Flow validation: non allineata al producer Money Flow
Significant Flow recency/reliability: troppo permissiva
Field → Market response quality: descrittiva, non tecnica
Output causality/interpretation contract: sovradichiarato
Parent available semantics: ambigua
Frontend availability: errata
Frontend persistence/identity reasons: non mostrate
Frontend Market → Field field mapping: non allineato al backend
Verification: due comandi indicati non esistono
Modifiche proposte: 10
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
```

La filosofia di base è corretta:

```text
Market Reactions
→ osservazione temporale

non
→ strategia
→ segnale
→ previsione
→ intenzione trader certa
→ causalità
```

Il composer Evidence blocca correttamente gli input cross-source quando:

```text
Source Identity effective != aligned
oppure
persistenceComplete == false
```

e Market Reactions non legge journal, non esegue recovery e non modifica timeline/history.

Le criticità più importanti sono però a valle del gating:

1. il ramo `Significant Market Flow` possiede una propria validazione del Money Flow che non coincide più con il producer corrente;
2. un flow `suppressed` può essere trattato come volume valido/significativo;
3. i rami reaction non possiedono una policy uniforme di freshness/Graph/ladder reliability;
4. le quality `good/medium/poor` delle finestre descrivono soprattutto copertura/comparabilità, non la qualità tecnica globale;
5. la UI può mostrare un ramo bloccato come `available` e nascondere proprio la reason Source Identity/persistence che spiega il blocco.

---

# 1. Il contratto `interpretation/causalityClaimed` è sovradichiarato

## Esito: il principio è corretto, la shape dichiarata no

Il documento afferma:

```text
Ogni output mantiene:

interpretation: temporal_proximity_only
causalityClaimed: false
```

Il codice non applica questa shape a ogni livello.

## Parent `marketReactionEvidence`

Il top-level restituisce:

```text
available
config
significantMarketFlow
marketLedObservation
fieldLedReaction
summary
```

ma non contiene:

```text
interpretation
causalityClaimed
```

Il `summary` contiene:

```text
causalityClaimed:false
```

## Significant Market Flow

Il ramo top-level non espone:

```text
causalityClaimed
interpretation
```

I singoli flow espongono invece:

```text
interpretation: exchange_activity_observed
causalityClaimed:false
```

che è semanticamente corretto, perché un flow di mercato isolato non è ancora una relazione temporale cross-source.

## Market → Field

Il top-level `marketLedObservation` non espone:

```text
interpretation
causalityClaimed
```

ma:

- `summary.causalityClaimed:false`;
- ogni observation window usa `temporal_proximity_only`.

## Field → Market

Questo ramo possiede invece anche top-level:

```text
interpretation: temporal_proximity_only
causalityClaimed:false
```

## Effetto frontend

`MarketLedObservationCard.jsx` controlla:

```text
evidence?.causalityClaimed === false
```

per mostrare:

```text
Causality not established
```

ma quel campo non esiste sul top-level Market → Field.

Quindi proprio quella card può non mostrare il disclaimer.

## Finding `MARKET-REACT-001` — definire un contratto causality/interpretation coerente

**Priorità:** alta  
**Tipo:** public evidence contract

### Modifica richiesta

Distinguere:

```text
market activity isolated
→ exchange_activity_observed

cross-source observation
→ temporal_proximity_only
```

e rendere coerente la presenza di:

```text
causalityClaimed:false
```

al livello che la UI consuma.

### Possibile soluzione additiva

Aggiungere al top-level:

```text
marketReactionEvidence.causalityClaimed:false
marketLedObservation.causalityClaimed:false
marketLedObservation.interpretation:temporal_proximity_only
```

senza cambiare il significato del Significant Market Flow.

### Documento

Sostituire `Ogni output` con una descrizione precisa dei livelli.

---

# 2. Significant Market Flow usa una validazione Money Flow divergente dal producer

## Esito: gap critico

Il producer canonico `calculateValidatedMoneyFlow()` usa una tassonomia reason che include, fra le altre:

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

e rappresenta suppression con:

```text
confidence:suppressed
```

## Significant Market Flow

`significantMarketFlow/runnerFlow.js` mantiene invece una blacklist locale:

```text
matched_total_decreased
runner_delta_exceeds_market_delta
classified_volume_exceeds_runner_delta
runner_delta_raw_computed_mismatch
market_delta_raw_computed_mismatch
```

Alcune reason elencate non appartengono più al producer corrente.

Mancano invece reason correnti come:

```text
flow_exceeds_runner_delta
runner_matched_unavailable
graph_recovered_after_non_graph
```

e soprattutto non viene controllato:

```text
moneyFlow.confidence === suppressed
```

## Tolleranza differente

Il producer Money Flow usa una tolleranza:

```text
max(1, 5% del delta)
```

Significant Market Flow usa:

```text
cfg.tolerance
default = 0.01
```

per il controllo:

```text
runnerMatchedDelta > marketDelta + tolerance
```

Quindi un delta accettato dal producer può essere nuovamente invalidato dal consumer con una soglia molto più stretta.

## Conseguenza opposta

Una suppression non presente nella blacklist può invece essere accettata come:

```text
validation.valid = true
```

e diventare un candidato Significant Flow.

## Finding `MARKET-REACT-002` — riutilizzare una sola authority di validazione Money Flow

**Priorità:** critica  
**Tipo:** data integrity

### Coordinamento

Collegare e riusare i finding:

```text
QUALITY-FLOW-003
QUALITY-FLOW-004
```

Non creare una terza tassonomia locale.

### Target

Significant Market Flow deve derivare l’utilizzabilità da un predicate condiviso che consideri almeno:

```text
producer confidence
producer reason
delta validation
Graph/ladder requirements scelti
```

### Invariante

```text
producer suppressed
→ non può diventare valid significant flow
```

a meno di una distinta categoria diagnostica esplicitamente non valida.

---

# 3. Un flow suppressed può diventare `sourceMarketEvent`

## Esito: conseguenza concreta del finding precedente

`extractRunnerFlowAmount()` calcola:

```text
observedFlowAmount
=
max(
  classifiedVolume,
  unclassifiedVolume,
  suppressedVolume,
  runnerMatchedDelta
)
```

Il `moneyFlow` canonico suppressed può comunque contenere:

```text
runnerDelta
marketDelta
```

Per alcune reason.

Se la reason non appartiene alla blacklist locale, `validateVolume()` può restituire:

```text
valid:true
```

Il flow può quindi superare una soglia assoluta o relativa.

A quel punto:

```text
latestSignificantFlow
→ sourceMarketEvent
→ Market → Field
```

## Caso particolarmente rilevante

La reason corrente:

```text
flow_exceeds_runner_delta
```

non è presente nella blacklist Significant Flow.

Il producer la usa proprio quando il ladder traded delta supera in modo incoerente il runner delta.

Questa anomalia non deve diventare un evento sorgente affidabile.

## Finding `MARKET-REACT-003` — impedire source event da flow suppressed/incoerente

**Priorità:** critica  
**Tipo:** source event eligibility

### Modifica richiesta

Prima di assegnare:

```text
latestSignificantFlow
```

come source event Market → Field, richiedere un contratto di eligibility esplicito.

Almeno:

```text
validVolume === true
confidence non suppressed
nessuna reason invalidante condivisa
```

Se un flow è grande ma non affidabile:

```text
può restare diagnostica
→ non sourceMarketEvent canonico
```

---

# 4. Significant Flow / Market → Field non hanno un gate temporale esplicito

## Esito: source event potenzialmente stale

`buildSignificantMarketFlowEvidence()` seleziona gli ultimi:

```text
lookbackTicks
default 40
```

ma non applica un:

```text
maxSourceAgeSec
```

al `latestSignificantFlow`.

Il singolo flow espone:

```text
ageSec
```

ma l’età non impedisce la selezione.

`buildMarketLedObservationEvidence()` accetta poi qualunque `sourceMarketEvent` con timestamp parseabile.

Non verifica:

```text
source event age
Graph health
ladder reliability
book tradability
```

prima di costruire le finestre.

## Contrasto con Field → Market

Field → Market possiede invece:

```text
maxSourceAgeSec:240
```

e rifiuta un marker troppo vecchio.

Le due direzioni hanno quindi una policy di source-event age asimmetrica.

## Finding `MARKET-REACT-004` — definire la source-event reliability per Market → Field

**Priorità:** alta  
**Tipo:** temporal source eligibility

### Coordinamento

Collegare:

```text
QUALITY-FLOW-002
QUALITY-FLOW-007
```

### Decisione richiesta

Definire se Market → Field sia:

```text
diagnostica storica bounded
```

oppure:

```text
osservazione live/recent
```

Nel secondo caso serve una soglia source age esplicita e testata.

### Clock skew

Un timestamp futuro non deve diventare implicitamente current.

La tolleranza va definita nell’owner temporale comune, non inventata qui.

---

# 5. Field → Market `marketResponseObserved` non equivale a risposta tecnicamente affidabile

## Esito: semantica descrittiva corretta ma naming troppo forte

Per ogni finestra Field → Market:

```text
marketResponseObserved
=
priceChangeObserved
OR
matchedVolumeIncreaseObserved
```

## Prezzo

`priceChangeObserved` usa un prezzo risolto tramite:

```text
LTP
→ mid
→ back
→ lay
```

Non richiede:

```text
Graph health ok
ladder reliable
book tradable
Betfair freshness globale
```

## Volume

`matchedVolumeIncreaseObserved` usa:

```text
market.totalMatched finale - baseline
```

se il delta è non negativo.

Non usa:

```text
Money Flow confidence
runner delta validation
Graph ladder
direction reliability
```

Questo è coerente con una semplice osservazione:

```text
il mercato è cambiato
```

ma non equivale a:

```text
risposta di mercato affidabile/canonically confirmed
```

## Finding `MARKET-REACT-005` — distinguere observation da reliability

**Priorità:** alta  
**Tipo:** market response semantics

### Modifica richiesta

Mantenere:

```text
marketResponseObserved
```

come flag descrittivo se desiderato.

Aggiungere però una distinzione fra:

```text
observed
reliable
quality-limited
```

oppure reason sufficienti per impedire una lettura troppo forte.

### Coordinamento

Allineare con:

```text
QUALITY-FLOW-007
QUALITY-FLOW-009
```

e con la futura policy di freshness.

### Invariante

```text
marketResponseObserved:true
≠ causal response
≠ reliable response
```

---

# 6. `dataQuality` nei rami Market Reactions non è la stessa qualità di `evidence.dataQuality`

## Esito: collisione terminologica

Il documento chiama:

```text
data quality
```

sia il blocco globale Evidence sia la quality delle finestre Market Reactions.

Sono contratti diversi.

## Market → Field

Una window è:

```text
good
→ baseline Sofa disponibile + almeno 2 tick nella finestra

medium
→ almeno un tick
poor
→ nessun tick
```

Non considera direttamente:

- Sofa freshness globale;
- Source Identity;
- persistence integrity;
- qualità PBP;
- clock skew;
- runtime health.

## Field → Market

Una window è:

```text
good
→ baseline Betfair + prezzi runner confrontabili

medium
→ tick presenti ma baseline/prezzo incompleto

poor
→ nessun tick successivo
```

Non equivale alla quality tecnica globale Betfair.

## Parent

`marketReactionEvidence.summary.dataQuality` proviene soltanto da:

```text
marketLedObservation.summary.dataQuality
```

mentre il Field → Market usa un campo separato:

```text
fieldLedDataQuality
```

Quindi `summary.dataQuality` non è la qualità complessiva dei tre rami.

## Finding `MARKET-REACT-006` — rinominare/definire la quality locale delle observation windows

**Priorità:** media  
**Tipo:** quality semantics

### Opzione consigliata

Usare un nome più specifico, per esempio:

```text
observationCoverageQuality
windowDataQuality
```

e documentare i criteri.

### Se il nome resta `dataQuality`

Specificare chiaramente:

```text
Market Reactions local dataQuality
≠ Evidence top-level dataQuality
```

e che il summary parent non è un aggregato globale.

---

# 7. `available` del parent non significa “reaction disponibile”

## Esito: contratto ambiguo

Il parent calcola:

```text
available
=
significantMarketFlow.available
OR marketLedObservation.available
OR fieldLedReaction.available
```

`significantMarketFlow.available` diventa:

```text
true
```

quando esistono tick Betfair, anche se:

```text
significantFlows = []
latestSignificantFlow = null
largeFlowDetected = false
```

Il test parent verifica esplicitamente:

```text
Betfair ticks ma nessun flow significativo
→ parent available:true
```

Quindi:

```text
marketReactionEvidence.available:true
```

può significare soltanto:

```text
il pipeline branch ha dati da analizzare
```

e non:

```text
esiste una reaction observation
```

## Finding `MARKET-REACT-007` — definire l’availability del parent

**Priorità:** media  
**Tipo:** public availability contract

### Modifica richiesta

Scegliere una semantica esplicita.

Possibili campi separati:

```text
analysisAvailable
reactionObserved
marketLedAvailable
fieldLedAvailable
```

Non usare un solo boolean per significati differenti.

### Documento

Specificare che `largeFlowDetected`, `marketLedAvailable` e `fieldLedAvailable` sono i flag più specifici.

---

# 8. La UI mostra `available` anche quando il ramo backend è `available:false`

## Esito: bug frontend concreto

Entrambe le card usano:

```jsx
<AvailabilityBadge available={!!evidence} />
```

Il parent passa sempre oggetti ramo:

```text
evidence.marketLedObservation
evidence.fieldLedReaction
```

anche quando questi contengono:

```text
available:false
```

Quindi:

```text
oggetto presente
→ badge verde "available"
```

anche se il backend dichiara il ramo non disponibile.

## Caso Source Identity / persistence

Quando il composer sospende Market Reactions:

```text
marketReactionEvidence.available:false
```

ma i child object esistono comunque.

Le card possono quindi visualizzare:

```text
available
```

mentre il contratto backend dice:

```text
unavailable
```

## Reason parent non mostrata

Quando Source Identity/persistence blocca il cross-source, la reason esplicita viene aggiunta a:

```text
marketReactionEvidence.summary.reasons
```

`MarketReactionsPage.jsx` non rende però il summary parent.

Passa alle card solo:

```text
marketLedObservation
fieldLedReaction
```

Le card visualizzano soprattutto reason delle window o dei child summary.

Quindi la UI può non mostrare:

```text
Persistence incomplete: canonical cross-source evidence unavailable
```

oppure la reason Source Identity che ha effettivamente sospeso il ramo.

Questo contraddice la dichiarazione documentale:

```text
La UI può mostrare la reason di persistenza incompleta ricevuta dallo snapshot
```

nel flusso corrente delle card.

## Finding `MARKET-REACT-008` — correggere availability e blocking reasons frontend

**Priorità:** alta  
**Tipo:** frontend evidence contract

### Modifica richiesta

Le card devono usare:

```text
evidence?.available === true
```

non `!!evidence`.

La pagina deve inoltre rendere le reason parent cross-source:

```text
Source Identity pending/mismatch
persistence incomplete
```

senza ricostruirle lato UI.

### Invariante

Frontend:

```text
display only
→ non deriva nuove reason
→ mostra quelle del backend
```

---

# 9. La card Market → Field usa nomi di campi non prodotti dal backend

## Esito: mapping frontend stale

`MarketLedObservationCard.jsx` cerca nel `sourceMarketEvent`:

```text
runnerName
amount
tier
flowClassification
```

Il Significant Market Flow corrente produce invece campi come:

```text
runner
observedFlowAmount
absoluteFlowTier
relativeFlowTier
direction
flowAmbiguous
```

Quindi la card può omettere:

- runner;
- importo flow;
- tier;

pur avendoli ricevuti.

## `sofaEventsObserved`

Il summary Market → Field espone:

```text
sofaEventsObserved
→ array di marker type
```

La card usa:

```text
formatNum(summary.sofaEventsObserved, 0)
```

quindi un array non numerico viene visualizzato come:

```text
—
```

anziché come elenco marker.

## Causality warning

Come già rilevato, la card controlla un campo top-level assente:

```text
evidence.causalityClaimed
```

e può non mostrare il disclaimer.

## Finding `MARKET-REACT-009` — riallineare la card Market → Field al contratto backend

**Priorità:** alta  
**Tipo:** frontend mapping

### Modifica richiesta

Usare i nomi effettivi:

```text
runner
observedFlowAmount
absoluteFlowTier
relativeFlowTier
direction
flowAmbiguous
```

oppure introdurre un view-model esplicito.

Per:

```text
sofaEventsObserved
```

usare rendering array-safe.

### Test frontend

Aggiungere almeno fixture con:

```text
sourceMarketEvent reale
summary marker array
available false
causality false
persistence blocking reason
```

---

# 10. Verification contract non eseguibile integralmente

## Esito: due comandi indicati non esistono

Il documento elenca:

```text
node sofa/significantMarketFlowEvidence.test.mjs
node sofa/matchEvidence/evidenceBuilder.test.mjs
```

Entrambi i file risultano assenti sul commit auditato.

Sono invece presenti:

```text
marketReactionEvidence.test.mjs
marketLedObservationEvidence.test.mjs
fieldLedReactionEvidence.test.mjs
matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
```

Il test parent copre già alcuni Significant Flow scenario, ma non sostituisce una suite diretta completa.

## Gap importanti

La suite attuale/documentata non prova in modo sufficientemente esplicito:

```text
moneyFlow confidence suppressed
flow_exceeds_runner_delta
producer tolerance vs Significant Flow tolerance
stale sourceMarketEvent
future source timestamp
Graph degraded significant flow
ladder unreliable significant flow
parent availability senza reaction
frontend badge available false
parent blocking reason visualizzata
frontend sourceMarketEvent field mapping
```

## Finding `MARKET-REACT-010` — riallineare la verification matrix

**Priorità:** alta  
**Tipo:** test contract

### Modifica richiesta

- rimuovere i command path inesistenti oppure creare realmente le suite;
- aggiungere una suite diretta Significant Market Flow se il ramo resta un owner autonomo;
- usare i test modulari reali di `evidenceBuilder/`;
- aggiungere test del rendering frontend;
- coprire suppression/tolerance/freshness/reliability.

### Regola

Non dichiarare PASS per un comando:

```text
inesistente
oppure
non eseguito sul checkpoint corrente
```

---

# 11. Source Identity e persistence gating

## Esito: corretto nel composer

`buildEvidenceFromTicks()` stabilisce:

```text
crossSourceAllowed
=
sourceIdentity.status === aligned
AND
no persistence conflict
```

Quando falso:

```text
scopedBetfairTick = null
scopedLookbackEntries = []
scopedAllBetfairTicks = []
marketReactionSofaTicks = []
marketReactionBetfairTicks = []
```

Quindi Market Reactions riceve input vuoti.

Il parent viene successivamente forzato a:

```text
available:false
```

e il summary riceve le reason:

- identity;
- persistence.

Questa parte è coerente con il documento.

## Nota

La UI non rende correttamente tutte queste reason, ma il backend gating è presente.

---

# 12. Active Betfair epoch

## Esito: corretto nel percorso Evidence

`latestMatchEvidence` costruisce:

```text
activeBetfairTimeline
```

dall’active market epoch e passa a Market Reactions:

```text
marketReactionBetfairTicks
=
activeBetfairTimeline.timeline.slice()
```

Quindi il ramo non riceve intenzionalmente tick di epoch storiche.

Resta dipendente dalla canonical input boundary già registrata in:

```text
EVID-SNAPSHOT-001
```

Non viene creato un secondo fix qui.

---

# 13. Market → Field window boundaries

## Esito: coerente

Le finestre predefinite sono:

```text
60
120
180
240
```

`collectSofaEventsInWindow()` include tick con:

```text
timestamp > source event
timestamp <= cutoff
```

Quindi:

```text
evento sorgente
→ escluso

cutoff finale
→ incluso
```

Il documento è coerente.

---

# 14. Field → Market window boundaries

## Esito: coerente

La baseline è:

```text
ultimo tick Betfair <= anchor
```

I tick osservati sono:

```text
> anchor
<= window end
```

Il documento descrive correttamente questa semantica.

Le finestre default:

```text
10, 30, 60, 120, 180, 240
```

e `maxSourceAgeSec=240` coincidono con il codice.

---

# 15. Selector Field → Market

## Esito: coerente

`computeLatestRelevantSofaMarker()`:

- usa fino a 60 tick;
- cerca il marker più recente;
- applica priorità:
  - BREAK_POINT;
  - DEUCE;
  - THIRTY_ALL;
  - GAME_POINT;
  - PRESSURE_POINT;
- ricostruisce `stateFirstSeenAt` andando indietro finché lo stato resta uguale.

Il documento è allineato.

## Limite temporale

La policy sui timestamp futuri deve essere coordinata con:

```text
QUALITY-FLOW-002
MARKET-REACT-004
```

---

# 16. `marketResponseObserved`

## Esito: causalità correttamente esclusa

Anche quando:

```text
marketResponseObserved:true
```

ogni window Field → Market mantiene:

```text
interpretation:temporal_proximity_only
causalityClaimed:false
```

Questa proprietà è corretta.

Il finding riguarda la reliability tecnica, non il principio di causalità.

---

# 17. Significant Flow thresholding

## Esito: implementato ma non documentato in dettaglio

Le soglie assolute default sono:

```text
notable: 600
strong: 1200
very_strong: 2500
extreme: 5000
```

Le soglie relative:

```text
elevated: 3x
unusual: 6x
extreme: 10x
```

Il documento non le espone.

Questo non è automaticamente un errore: può essere corretto mantenere l’owner documentale a livello contrattuale e lasciare i tuning value al codice.

## Condizione

Se queste soglie diventano configurazione di prodotto o criterio decisionale stabile, devono avere un owner documentale esplicito.

Non viene aperto un change ID separato in questo audit.

---

# 18. Config Market → Field

## Esito: validazione configurazione meno robusta del ramo Field → Market

Field → Market:

- filtra valori non numerici;
- elimina duplicati;
- ordina;
- richiede valori positivi.

Market → Field usa invece:

```text
userConfig.observationWindowsSec
```

direttamente quando presente.

Quindi una configurazione interna malformata può produrre comportamento non deterministico o errore.

Al momento la configurazione è interna e non risulta una superficie utente pubblica.

Viene registrata come hardening consigliato nell’ambito di `MARKET-REACT-010`, senza change ID separato.

---

# 19. Frontend polling

## Esito: documentazione sostanzialmente corretta

`App.jsx` crea una sola istanza:

```text
useMarketReactionEvidence(sofaEventId)
```

e passa i risultati a `MarketReactionsPage`.

La pagina non crea un secondo hook.

L’hook possiede inoltre:

- session counter;
- AbortController;
- request counter;
- stale response guard;
- polling timer.

Quindi, per questo specifico hook, il documento è corretto nel dire che la pagina è consumer presentazionale.

## Helper confirmation

L’hook esporta ancora helper:

```text
confirmSourceIdentity
revokeSourceIdentityConfirmation
```

ma `App.jsx` non li usa come authority del gate UI corrente.

Anche questa precisazione documentale è coerente.

---

# 20. Read-only boundary

## Esito: corretto nel dominio Market Reactions

I moduli analizzati:

- consumano array/tick già ricevuti;
- non leggono journal;
- non scrivono persistence;
- non avviano tracker;
- non eseguono fetch;
- non mutano le timeline raw nei test principali.

Il polling frontend legge `/api/evidence/:eventId/latest`, ma questo appartiene al layer UI/API, non al dominio Market Reactions.

La frase domain-level può restare.

---

# 21. Modularizzazione

## Valutazione

```text
Righe: 425
Responsabilità primaria: 1
Dominio: Market Reactions
Sottorami: Significant Flow, Market→Field, Field→Market
Owner di codice sottostanti: già separati
Necessità di capire i rami insieme: alta
Duplicazione con Quality/Alignment: moderata
Duplicazione frontend: moderata
Necessità di nuovi owner canonici: no
Suddivisione richiesta: no
```

Il documento è lungo ma ha una responsabilità coerente:

```text
come si costruiscono e si interpretano
le osservazioni Market Reactions
```

Dividerlo in tre owner canonici:

```text
significant-flow.md
market-led.md
field-led.md
```

renderebbe più difficile verificare:

- simmetria delle due direzioni;
- causalità;
- quality semantics;
- gating Source Identity/persistence;
- contratto frontend.

Il codice è già modularizzato internamente.

Il documento deve quindi restare unico e diventare più preciso nei confini.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-019
Percorso report: Report documentale/19 - 04-market-reactions.md
Documento: docs/tennis-decision-ui/modules/evidence/04-market-reactions.md
Change ID: MARKET-REACT-001
Change ID: MARKET-REACT-002
Change ID: MARKET-REACT-003
Change ID: MARKET-REACT-004
Change ID: MARKET-REACT-005
Change ID: MARKET-REACT-006
Change ID: MARKET-REACT-007
Change ID: MARKET-REACT-008
Change ID: MARKET-REACT-009
Change ID: MARKET-REACT-010
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 018 e 019 se non ancora recepiti
→ indice 19 ANALIZZATO
→ Divisione non necessaria
→ aggiungere le task del report

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-019
→ appendere MARKET-REACT-001..010
→ preservare integralmente il ledger precedente
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `MARKET-REACT-001` — causality/interpretation contract

**Priorità:** high

- distinguere market activity isolata da temporal observation;
- rendere coerente `causalityClaimed:false` sui livelli consumati dalla UI;
- correggere la dichiarazione `Ogni output`;
- ripristinare il disclaimer Market → Field.

## `MARKET-REACT-002` — Money Flow validation authority

**Priorità:** critical

- eliminare blacklist reason locale stale;
- riusare producer confidence/reason;
- allineare le tolleranze TotalMatched;
- coordinare `QUALITY-FLOW-003/004`;
- impedire divergenze producer/consumer.

## `MARKET-REACT-003` — significant flow source eligibility

**Priorità:** critical

- non promuovere suppressed/incoherent flow a sourceMarketEvent;
- richiedere eligibility condivisa;
- mantenere eventuale large flow non affidabile come diagnostica;
- testare `flow_exceeds_runner_delta` e suppression.

## `MARKET-REACT-004` — Market → Field source recency/reliability

**Priorità:** high

- definire max source age o natura historical diagnostic;
- gestire future timestamp/clock skew;
- coordinare `QUALITY-FLOW-002/007`;
- non usare flow stale come fonte live senza reason.

## `MARKET-REACT-005` — Field → Market response reliability

**Priorità:** high

- distinguere `marketResponseObserved` da risposta affidabile;
- documentare cosa usa price/market total;
- aggiungere reliability/reasons se necessario;
- non confondere observed con causal/reliable.

## `MARKET-REACT-006` — local data quality semantics

**Priorità:** medium

- distinguere quality delle window da Evidence `dataQuality`;
- chiarire che parent `summary.dataQuality` è market-led;
- valutare naming `windowDataQuality` / `observationCoverageQuality`.

## `MARKET-REACT-007` — parent availability semantics

**Priorità:** medium

- distinguere pipeline/data available da reaction observed;
- non usare un solo boolean ambiguo;
- documentare `largeFlowDetected`, `marketLedAvailable`, `fieldLedAvailable`.

## `MARKET-REACT-008` — frontend availability/reasons

**Priorità:** high

- usare `evidence.available`, non `!!evidence`;
- mostrare parent blocking reasons;
- preservare Source Identity/persistence reason backend-owned;
- non ricostruire reason lato frontend.

## `MARKET-REACT-009` — frontend Market → Field mapping

**Priorità:** high

- riallineare runner/importo/tier ai campi backend reali;
- renderizzare marker array correttamente;
- mostrare disclaimer causality;
- aggiungere fixture frontend.

## `MARKET-REACT-010` — verification contract

**Priorità:** high

- correggere i due command path inesistenti;
- aggiungere/ristabilire suite Significant Flow;
- usare i test modulari reali Evidence;
- coprire suppression, tolerance, recency, availability e UI mapping.

---

# Ordine consigliato di applicazione

```text
1. MARKET-REACT-002 — shared Money Flow validation
2. MARKET-REACT-003 — source event eligibility
3. QUALITY-FLOW-003/004 — predicate condivisi
4. MARKET-REACT-004 — source event recency
5. MARKET-REACT-005 — response reliability
6. MARKET-REACT-001 — causality/interpretation shape
7. MARKET-REACT-008 — frontend availability + blocking reasons
8. MARKET-REACT-009 — frontend field mapping
9. MARKET-REACT-006/007 — naming quality/availability
10. MARKET-REACT-010 — verification
11. revisione mirata del documento
12. checker documentali
13. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

---

# Verifica prevista dopo un’eventuale modifica

## Significant Flow

Testare:

```text
confirmed large flow
→ significant

suppressed large runnerDelta
→ non sourceMarketEvent

flow_exceeds_runner_delta
→ invalid / diagnostic only

runner_delta_exceeds_market_delta
→ invalid

producer-valid delta entro tolleranza condivisa
→ consumer non lo invalida diversamente
```

## Source age

```text
flow recente
→ Market → Field eleggibile

flow stale
→ unavailable o diagnostic-only secondo policy

timestamp futuro oltre clock skew
→ non recent/eleggibile
```

## Field → Market

```text
price change con quality buona
→ observed

price change con quality degradata
→ observed ma reliability degradata

matched market volume increase
→ non interpretato come direzione trader

no post-anchor ticks
→ poor, response false
```

## Causalità

Ogni livello cross-source consumato dalla UI deve mantenere:

```text
causalityClaimed:false
```

e nessuna label deve suggerire causa dimostrata.

## Parent availability

Verificare separatamente:

```text
Betfair ticks, nessun significant flow
significant flow, nessun Sofa post-event
field marker, nessun Betfair response
reaction observation presente
```

con semantica `available` non ambigua.

## Frontend

Con fixture:

```text
branch available:false
→ badge unavailable

persistence conflict
→ reason backend mostrata

Source Identity pending
→ reason backend mostrata

Market → Field source
→ runner/importo/tier visibili

sofaEventsObserved array
→ marker leggibili

causality false
→ disclaimer visibile
```

## Gating

Preservare:

```text
pending/mismatch
→ Market Reactions suspended

partial_persistence/recovery_failed
→ suspended

technical Betfair freshness
→ non riscritta artificialmente

raw timelines
→ non mutate
```

## Test files

Il documento deve elencare soltanto suite realmente presenti o create nella stessa task.

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
04-market-reactions.md: OWNER COERENTE NELLA FILOSOFIA, VALIDATION E UI DA RAFFORZARE

No strategy/signal: corretto
Causality claimed: sempre false nei summary/window rilevanti
Source Identity gating: corretto
Persistence gating: corretto
Active epoch: corretto nel loader
Market→Field windows: corrette
Field→Market windows: corrette
Raw timeline mutation: assente

Ogni output temporal_proximity_only: falso come shape generale
Significant Flow reason taxonomy: stale
Significant Flow tolerance: diversa dal producer
suppressed flow → valid significant flow: possibile
suppressed flow → sourceMarketEvent: possibile
Market→Field source age gate: assente
Field→Market observed != reliable: non esplicitato abbastanza
window dataQuality != Evidence dataQuality
parent available: può essere true senza reaction
frontend branch available badge: errato
frontend blocking reason parent: non mostrata
frontend Market→Field mapping: stale
verification: due command path inesistenti

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: alta
```

Il documento deve restare un singolo owner.

La correzione principale è far sì che la catena:

```text
Money Flow
→ Significant Flow
→ sourceMarketEvent
→ Market Reaction
```

usi una sola authority di validazione.

La seconda è rendere inequivocabile la distinzione:

```text
osservato
≠ affidabile
≠ attribuibile causalmente
```

anche nella UI.
