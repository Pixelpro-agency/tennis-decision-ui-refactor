> **Parte 4 di 7 — Evidence e Market Reactions**
> Secondo audit — Punto 5: provenance temporale, alignment, eligibility, Significant Flow, comparabilità prezzi e semantica Market Reactions.
> [Indice](../03-audit-codice.md) · [Parte 3](03-storage-recovery.md) · [Parte 5](05-frontend-session-shell.md)

<!-- AUDIT-CODE-ORIGINAL-START source-lines=3474-4450 sha256=b4034093c0a3a2ebe2fdf2e4db4fb12ab4ace7b41abcb3301c389a9585733f02 -->
## 20. Secondo audit del codice — Punto 5: Evidence e Market Reactions

**Baseline:** `2959fba5bc3e0480cc3ea03f4469361cbb629ae6`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
backend/src/routes/evidence.js
backend/src/sofa/matchEvidence.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/matchEvidence/alignment.js
backend/src/sofa/matchEvidence/alignmentExtension.js
backend/src/sofa/matchEvidence/time.js
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/matchEvidence/noTradeReasons.js
backend/src/sofa/matchEvidence/marketEvidence.js
backend/src/sofa/matchEvidence/runnerEvidence.js
backend/src/sofa/matchEvidence/sofaEvidence.js
backend/src/sofa/matchEvidence/sourceIdentity.js
backend/src/sofa/matchEvidence/sourceIdentity/marketEpoch.js
backend/src/sofa/matchEvidence/sourceIdentity/builder.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmation.js
backend/src/sofa/marketFlowEvidence.js
backend/src/sofa/marketFlowEvidence/runnerFlow.js
backend/src/sofa/marketFlowEvidence/runnerFlow/primitives.js
backend/src/sofa/marketFlowEvidence/alignment.js
backend/src/sofa/marketFlowEvidence/utilities.js
backend/src/sofa/marketReactionEvidence.js
backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/config.js
backend/src/sofa/significantMarketFlow/candidates.js
backend/src/sofa/significantMarketFlow/runnerFlow.js
backend/src/sofa/significantMarketFlow/singleTick.js
backend/src/sofa/significantMarketFlow/clusters.js
backend/src/sofa/marketLedObservationEvidence.js
backend/src/sofa/marketLedObservationEvidence/windowCollection.js
backend/src/sofa/marketLedObservationEvidence/observationWindow.js
backend/src/sofa/fieldLedReactionEvidence.js
backend/src/sofa/temporalAlignmentEvidence.js
backend/src/sofa/temporalAlignment/sofaMarker.js
backend/src/sofa/temporalAlignment/betfairMove.js
backend/src/sofa/temporalAlignment/betfairMove/candidateSelection.js
backend/src/sofa/temporalAlignment/betfairMove/primitives.js
backend/src/sofa/temporalAlignment/reactionWindows.js
backend/src/sofa/betfairHealth.js
backend/src/sofa/betfairHealth/tickQuality.js
backend/src/sofa/betfair/processor.js
backend/src/sofa/betfair/processor/persistenceDecision.js
backend/src/sofa/betfair/processor/canonicalTimeline.js
backend/src/sofa/betfair/timeline.js

docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.mdx
docs/tennis-decision-ui/modules/evidence/02-source-identity.mdx
docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.mdx
docs/tennis-decision-ui/modules/evidence/04-market-reactions.mdx

test Evidence, alignment, data quality e Market Reactions collegati
```

L’analisi è statica. Le suite presenti sono state lette ma non rieseguite.

### Classificazione usata

Per il Punto 5 ogni rilievo è stato distinto come:

```txt
bug confermato
limite noto
miglioria utile
documentazione mancante
struttura completamente assente
nessuna azione necessaria
decisione dell’utente richiesta
```

Le decisioni richieste sono state approvate integralmente dall’utente.

### Parti confermate come solide

#### Evidence resta read-only

Il Match Evidence Snapshot viene costruito da timeline già persistite e può leggere:

```txt
Source Identity effective
persistence integrity
active Betfair market epoch
```

Non deve:

- avviare scraper;
- fare fetch live;
- aprire browser;
- eseguire recovery;
- scrivere journal;
- aggiungere tick;
- modificare history o timeline;
- cambiare il gate live.

Questo confine è coerente nel codice letto e va preservato.

#### Gating cross-source conservativo

L’uso attribuito dei dati Betfair è consentito soltanto quando:

```txt
Source Identity effective = aligned
+
persistence integrity utilizzabile
```

Con `pending`, `mismatch`, `partial_persistence` o `recovery_failed`:

- i runner Betfair non vengono attribuiti;
- il lookback attribuito viene escluso;
- Market Reactions viene sospeso;
- le reason restano distinte;
- Source Identity non viene riscritta come errore storage.

Quando verrà implementato `integrity_unknown` del Punto 4, anche questo stato dovrà rendere `persistenceComplete:false`.

#### Active market epoch

L’epoch Betfair attivo è la porzione finale contigua con la stessa firma di mercato.

La firma preferisce:

```txt
marketId + selectionIds distinti
```

con fallback controllato su:

```txt
marketKey + runner normalizzati
```

Gli epoch storici non partecipano alle osservazioni del contesto corrente.

#### Conferma manuale contestuale

La conferma Source Identity è legata a:

```txt
eventId
marketId
epochSignature
due selectionId distinti
due giocatori SofaScore
due runner Betfair
mapping uno-a-uno selezionato
```

Un cambio di contesto rende non applicabile la conferma precedente.

#### Assenza esplicita di causalità

I moduli principali mantengono:

```txt
causalityClaimed: false
interpretation: temporal_proximity_only
```

anche quando rilevano prezzo, volume, marker o ordine temporale.

Questa invariante non deve essere rimossa né indebolita.

#### Immutabilità degli input

I builder principali lavorano su copie o viste derivate e i test esistenti verificano che timeline, tick e configurazioni non vengano mutati.

### EVIDENCE-001 — `selectionId` obbligatorio ancora non applicato

**Classificazione:** `BUG CONFERMATO RISPETTO A DECISIONE APPROVATA`
**Stato:** `APPROVATO; IMPLEMENTAZIONE MANCANTE`
**Priorità:** alta
**Area:** Field → Market e confronti runner temporali

`DEC-010` stabilisce già:

```txt
selectionId mancante
→ nessun fallback sul nome
→ runner non confrontabile
→ ramo degradato con reason
```

Nel ramo Field → Market il codice usa ancora il nome quando il runner baseline non possiede `selectionId`.

Il fallback non blocca Start, tracking, Source Identity o dashboard, ma può confrontare come stesso runner due entità identificate soltanto da una label testuale.

#### Decisione approvata nel Punto 5

La regola viene estesa a ogni confronto temporale dello stesso runner Betfair:

```txt
baseline runner ↔ latest runner
→ selectionId obbligatorio
```

Il nome resta consentito per:

- visualizzazione;
- reason diagnostiche;
- matching Source Identity nel proprio dominio;

ma non come identità temporale del runner Exchange.

Se manca l’ID:

```txt
comparisonStatus: runner_identity_unavailable
runnerPriceChanges: unavailable
reason: runner_selection_id_unavailable
```

Il resto dello snapshot resta disponibile secondo la propria qualità.

### EVIDENCE-002 — Tick degradati o `status-only` usati come nuovi eventi

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** Significant Flow, Market Reactions e tick Graph login

Il builder sospende Market Reactions per:

```txt
Source Identity non aligned
persistence incomplete
```

ma non applica un filtro equivalente per:

- Betfair stale;
- Graph health non `ok`;
- ladder non affidabile;
- flow non affidabile;
- book degradato;
- acquisition skew eccessivo;
- tick `statusOnlyGraphLogin`.

Il tick `status-only` conserva intenzionalmente market e runner dell’ultimo snapshot canonico per mostrare health e diagnostica dopo un problema Graph login.

Questa conservazione è corretta per la timeline, ma il nuovo tick possiede un nuovo timestamp e può ripresentare:

```txt
runner
prezzi
moneyFlow
matched data precedenti
```

come se fossero una nuova attività Exchange.

#### Scenario

```txt
tick reale con flow significativo
→ Graph login richiesto
→ tick status-only copia il precedente
→ nuovo timestamp
→ detector Significant Flow rilegge lo stesso flow
→ nuovo sourceMarketEvent possibile
```

#### Decisione approvata

I tick `status-only` restano nella timeline per health, ma:

```txt
status-only
→ non genera Significant Flow
→ non diventa sourceMarketEvent
→ non aggiorna baseline algoritmica
→ non crea Market Reaction nuova
```

Market Reactions deve usare una eligibility tecnica esplicita e non soltanto Source Identity/persistence.

### EVIDENCE-003 — Attività matched generica classificata come risposta del mercato

**Classificazione:** `BUG SEMANTICO CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** Field → Market

Il ramo usa oggi:

```txt
priceChangeObserved
oppure
market totalMatched aumentato
→ marketResponseObserved:true
```

Un aumento di `market.totalMatched` dimostra soltanto che sono avvenuti scambi nel mercato. Non dimostra:

- movimento del runner collegato;
- variazione significativa;
- attività sul runner identificato;
- risposta al marker;
- direzione;
- causalità.

#### Decisione approvata

Separare:

```txt
marketActivityObserved
→ attività matched generale successiva all’anchor

runnerPriceChangeObserved
→ prezzo comparabile dello stesso selectionId cambiato

runnerVolumeChangeObserved
→ volume reale dello stesso selectionId aumentato

qualifiedMarketObservation
→ osservazione che supera identity, temporal e quality gate
```

La label pubblica non deve chiamare “risposta del mercato” la sola attività matched generica.

`marketResponseObserved` può essere rimosso oppure mantenuto soltanto come alias compatibile, documentato come non causale e non qualificato finché non soddisfa i nuovi gate.

### EVIDENCE-004 — Presenza di un marker confusa con comparsa successiva

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** Market → Field

Il ramo considera osservato un field event quando, in una finestra successiva al flow:

```txt
esiste un marker rilevante
oppure
lo score differisce dalla baseline
```

Non verifica sempre che il marker sia comparso dopo il source market event.

#### Scenario

```txt
DEUCE già attivo prima del flow
→ tick successivo ancora DEUCE
→ nessuna transizione
→ marker trovato nella finestra
→ fieldEventObservedAfterFlow:true
```

La presenza successiva non è equivalente a una nuova comparsa.

#### Decisione approvata

Separare:

```txt
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource
```

Un nuovo field event richiede:

```txt
stateFirstSeenAt > sourceMarketEvent.timestamp
oppure
baseline state != primo stato post-source
```

La persistenza dello stesso marker resta un dato di contesto, non un nuovo evento.

### EVIDENCE-005 — Alignment e freshness non misurano il vero rapporto temporale

**Classificazione:** `BUG CONFERMATO + LIMITE NOTO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** alignment, timestamp e acquisition provenance

`buildAlignment()` calcola:

```txt
sofaAgeSec
betfairAgeSec
maxTickGapSec = max(sofaAgeSec, betfairAgeSec)
```

Il campo `maxTickGapSec` non misura la distanza fra le fonti.

Il vero source skew è:

```txt
abs(sofaTimestamp - betfairTimestamp)
```

Inoltre una sola fonte recente può oggi produrre `alignmentQuality:medium`, anche se non esiste un confronto cross-source.

#### Timestamp futuri

L’età viene clampata a zero:

```txt
Math.max(0, now - timestamp)
```

Un timestamp futuro può apparire come dato perfettamente fresco invece di produrre clock skew.

#### Timestamp di registrazione

Il tick Betfair canonico usa il momento di costruzione Node come timestamp principale. Non dimostra il momento effettivo in cui Market API e Graph sono stati acquisiti.

Questo limite si collega a `IMPL-018` del Punto 3.

#### Decisione approvata

Distinguere almeno:

```txt
acquiredAt
recordedAt
sofaAgeSec
betfairAgeSec
sourceSkewSec
pipelineDelaySec
futureSkewSec
baselineGapSec
firstPostSourceGapSec
```

Rinominare o rimuovere l’attuale `maxTickGapSec`; se mantenuto per compatibilità deve diventare chiaramente `maxSourceAgeSec`.

Qualità cross-source:

```txt
good
→ entrambe le fonti presenti
→ acquisition timestamp validi
→ freshness valida
→ source skew entro soglia

medium
→ entrambe presenti ma skew/freshness degradati

poor
→ fonte assente, timestamp invalido/futuro o skew eccessivo
```

### EVIDENCE-006 — Confronti prezzo con source diverse e baseline non bounded

**Classificazione:** `BUG DI QUALITÀ CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** price comparison e anchor temporale

Il prezzo comparabile può provenire da:

```txt
last traded price
mid book
best back
best lay
```

Nel ramo Field → Market viene mantenuto soltanto il numero, non la sorgente.

Scenario:

```txt
baseline LTP 1.80
latest senza LTP, mid book 1.86
→ delta +0.06
```

Il risultato mescola un movimento possibile con un cambio della fonte del prezzo.

Inoltre la baseline è l’ultimo tick `<= anchor`, senza un limite esplicito sulla sua distanza dall’anchor.

#### Decisione approvata

Ogni confronto espone:

```txt
baselinePrice
baselinePriceSource
latestPrice
latestPriceSource
priceSourcesComparable
baselineGapSec
firstPostSourceGapSec
comparisonStatus
reasons
```

Policy:

```txt
stessa source
→ confronto normale

source differente ma ammessa
→ degraded con reason

source non confrontabile
→ price change unavailable

baseline oltre soglia
→ comparison unavailable/degraded
```

### EVIDENCE-007 — Qualità globale positiva con copertura parziale dei runner

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** data quality e mercato tennis a due runner

La qualità globale usa oggi condizioni del tipo:

```txt
almeno un runner con ladder affidabile
→ ladderReliable:true

almeno un runner con flow affidabile
→ moneyFlowReliable:true

almeno un runner con book two-sided
→ marketTradable:true
```

In un mercato tennis a due runner, un solo runner completo può quindi rendere positivo un boolean globale mentre l’altro è assente o degradato.

#### Decisione approvata

Esporre copertura:

```txt
expectedRunnerCount
identifiedRunnerCount
tradableRunnerCount
reliableLadderRunnerCount
reliableFlowRunnerCount

bookCoverage: complete | partial | none
ladderCoverage: complete | partial | none
flowCoverage: complete | partial | none
```

Per osservazioni che richiedono entrambi i runner:

```txt
complete
→ utilizzabile

partial
→ degradata

none
→ unavailable
```

I boolean legacy possono essere mantenuti temporaneamente come derivati, senza nascondere la copertura.

### EVIDENCE-008 — Baseline Significant Flow e cluster non sufficientemente definiti

**Classificazione:** `LIMITE NOTO + MIGLIORIA UTILE`
**Stato:** `POLICY APPROVATA`
**Priorità:** medio-alta
**Area:** Significant Flow

#### Lookback effettivo incoerente

Il detector dichiara:

```txt
lookbackTicks: 40
```

ma il loader Evidence passa al massimo gli ultimi 21 tick dell’epoch attivo.

La configurazione esposta non corrisponde quindi sempre all’input realmente disponibile.

#### Baseline relativa mescolata fra runner

La mediana relativa viene calcolata su candidati precedenti di entrambi i runner, senza distinguere `selectionId`.

Un flow del runner A può quindi essere confrontato con una baseline composta anche dal runner B.

#### Cluster basati sui tick, non sul tempo

I cluster usano tick consecutivi e `maxClusterTicks`, ma non impongono un `maxClusterGapSec`.

Due tick consecutivi nel file ma lontani nel tempo possono essere uniti.

Finestre scorrevoli possono inoltre riutilizzare gli stessi tick in cluster sovrapposti.

#### Soglie non calibrate

Le soglie correnti:

```txt
600 / 1200 / 2500 / 5000
3x / 6x / 10x
```

sono euristiche hardcoded. Le label `notable`, `strong`, `very_strong`, `extreme` non derivano ancora da una calibrazione storica documentata.

#### Decisione approvata

Separare:

```txt
runnerRelativeMultiplier
→ baseline dello stesso selectionId

marketRelativeMultiplier
→ baseline aggregata del mercato
```

I cluster richiedono:

```txt
selectionId obbligatorio
maxClusterGapSec
no status-only
no tick degradati
no sovrapposizione o doppio conteggio degli stessi tick
provenance dei tick inclusi
```

Le soglie restano per ora:

```txt
heuristic
provisional
versioned
not calibrated
not a signal
```

La calibrazione appartiene al Punto 7 e a `IMPL-012/013`.

### EVIDENCE-009 — `available`, stato finestra e risultato osservato sono ambigui

**Classificazione:** `LIMITE SEMANTICO + DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** media
**Area:** parent Market Reactions e branch state

Significant Market Flow può restituire `available:true` quando i tick sono stati processati anche se:

- nessun flow significativo è stato trovato;
- non esiste source event;
- Market → Field non è disponibile;
- Field → Market non è disponibile.

Il parent è `available:true` quando almeno un child dichiara availability, ma i child usano il campo con significati diversi.

Anche le finestre non hanno uno stato uniforme:

- Field → Market espone `windowClosed`;
- Market → Field non espone lo stesso contratto;
- una finestra da 240 secondi può essere mostrata dopo pochi secondi senza una label uniforme di provisionalità.

#### Decisione approvata

Separare:

```txt
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
windowState: open | closed | insufficient_data | stale_source
```

Il top-level `available` deve avere un solo significato stabile, preferibilmente:

```txt
almeno un ramo possiede un’osservazione presentabile
```

Il summary deve distinguere:

```txt
provisional
final_for_window
```

### Riferimento audit a DOC-017 — Flusso di composizione Market Reactions

**Classificazione:** `DOCUMENTAZIONE MANCANTE GIÀ REGISTRATA`
**Stato:** `CONFERMATO; NON DUPLICARE`

La documentazione afferma che Market Reactions consuma uno snapshot Evidence già costruito.

Il flusso reale è:

```txt
Evidence builder
→ seleziona tick scoped
→ chiama Market Reactions
→ inserisce il risultato nello snapshot finale
```

Il rilievo resta `DOC-017`; non viene creato un nuovo ID duplicato.

### DOC-026 — Temporal provenance e policy di alignment non documentate

**Classificazione:** `DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

Il documento owner deve distinguere:

```txt
acquiredAt
recordedAt
freshness
source skew
pipeline delay
future clock skew
baseline gap
first post-source gap
observation window
window open/closed
```

Deve inoltre spiegare:

- quale timestamp governa la freshness;
- quale timestamp governa l’anchor;
- le soglie 10/30/60/120/180/240;
- il comportamento con una fonte assente;
- la differenza fra età del dato e gap fra le fonti.

### DOC-027 — Availability, activity, response e threshold non documentati

**Classificazione:** `DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** media-alta

Definire esplicitamente:

```txt
detector eseguito
input disponibile
source event disponibile
attività osservata
variazione runner osservata
osservazione qualificata
finestra provvisoria
finestra conclusa
```

Le soglie Significant Flow devono essere dichiarate:

```txt
provvisorie
euristiche
versionate
non calibrate
non operative
```

### Strutture risultanti

#### Riferimento audit a IMPL-022 — Evidence temporal provenance and alignment policy

Struttura owner di:

- acquisition e recorded timestamp;
- source skew;
- pipeline delay;
- future skew;
- baseline e first-post gap;
- stato finestre;
- soglie temporali versionate.

#### Riferimento audit a IMPL-023 — Market Reaction eligibility e branch state

Struttura owner di:

- eligibility tecnica dei tick;
- esclusione `status-only` dagli eventi algoritmici;
- stati uniformi dei rami;
- distinzione activity/observation/response;
- marker transition;
- coverage;
- Significant Flow e cluster policy.

#### Riferimento audit a IMPL-024 — Runner temporal identity e price comparability

Struttura owner di:

- `selectionId` obbligatorio;
- assenza di fallback nome;
- source del prezzo;
- comparabilità;
- baseline gap;
- reason e stato del confronto.

Le specifiche complete sono registrate in `06-implementazioni-proposte.md`.

### Test mancanti

#### TEST-031 — `status-only` non crea Market Reaction

```txt
tick reale con flow
→ status-only Graph login
→ health preservata
→ nessun nuovo Significant Flow/sourceMarketEvent
```

#### TEST-032 — Eligibility tecnica Market Reactions

```txt
Graph degradato / ladder non affidabile / tick stale / acquisition skew
→ timeline preservata
→ ramo degraded/unavailable
```

#### TEST-033 — `selectionId` obbligatorio

```txt
runner senza selectionId
→ nessun fallback nome
→ reason esplicita
→ resto snapshot invariato
```

#### TEST-034 — Attività matched distinta da response

```txt
solo market totalMatched aumenta
→ marketActivityObserved:true
→ runnerPriceChangeObserved:false
→ qualifiedMarketObservation:false
```

#### TEST-035 — Marker presente distinto da marker nuovo

```txt
stesso marker prima e dopo source flow
→ markerPresentAfterSource:true
→ markerTransitionObservedAfterSource:false
```

#### TEST-036 — Source prezzo non comparabile

```txt
LTP → mid o back → lay
→ confronto degraded/unavailable
→ source esposte
```

#### TEST-037 — Baseline troppo lontana

```txt
baseline gap oltre soglia
→ gap esposto
→ qualità degradata
→ nessun confronto affidabile
```

#### TEST-038 — Coverage parziale runner

```txt
un runner completo, uno degradato
→ coverage partial
→ nessun complete globale falso
```

#### TEST-039 — Timestamp, acquisition e clock skew

```txt
timestamp futuro
recordedAt diverso da acquiredAt
source skew elevato
→ freshness/alignment degradati correttamente
```

#### TEST-040 — Baseline Significant Flow per `selectionId`

```txt
runner A
→ non usa flow runner B nella baseline runner-specific
```

#### TEST-041 — Cluster temporali non sovrapposti

```txt
tick consecutivi ma distanti
→ non uniti

tick già assegnato
→ non doppio conteggio in cluster sovrapposti
```

#### TEST-042 — Availability semantica

```txt
detector computed
+ nessuna osservazione
→ computed:true
→ observationAvailable:false
→ top-level coerente
```

#### TEST-043 — Finestre open/closed

```txt
finestra non conclusa
→ provisional/open

finestra conclusa
→ final_for_window/closed
```

### Decisioni approvate

1. i tick `status-only` restano nella timeline per health ma non generano nuovi Significant Flow o source event;
2. Market Reactions usa una eligibility tecnica esplicita;
3. applicare `DEC-010` senza fallback nome nel ramo Field → Market;
4. estendere `selectionId` obbligatorio a tutti i confronti temporali dello stesso runner Betfair;
5. separare attività matched generale, variazione runner e osservazione qualificata;
6. un marker già presente prima del flow non è un nuovo evento successivo;
7. separare età delle fonti e source skew reale;
8. timestamp futuri producono degradazione clock-skew e non freshness zero;
9. conservare e confrontare la sorgente del prezzo;
10. introdurre un limite massimo baseline→anchor;
11. la qualità globale espone copertura esplicita dei due runner;
12. baseline Significant Flow per `selectionId`, con baseline mercato separata;
13. cluster con gap temporale massimo, provenance e nessun doppio conteggio;
14. soglie correnti provvisorie, versionate e non calibrate fino al Punto 7;
15. separare `computed`, `available`, `observed`, `provisional` e `stale`;
16. mantenere invariati `causalityClaimed:false` e `temporal_proximity_only`.

### Ordine tecnico risultante

```txt
IMPL-018
→ acquisition envelope Betfair

IMPL-022
→ temporal provenance e alignment policy

IMPL-024
→ runner identity e price comparability

IMPL-023
→ eligibility e branch state Market Reactions

TEST-031…043
→ fixture/replay IMPL-012
→ baseline e calibrazione IMPL-013
→ Punto 6 Frontend
→ Punto 7 test e strutture mancanti
```



---

<!-- AUDIT-CODE-ORIGINAL-END -->
