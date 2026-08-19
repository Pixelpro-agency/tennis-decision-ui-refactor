> **Parte 4 di 7 — Evidence e Market Reactions**
> Secondo audit — Punto 5: provenance temporale, alignment, eligibility, Significant Flow, comparabilità dei prezzi e semantica Market Reactions.
> [Indice](../03-audit-codice.md) · [Parte 3](03-storage-recovery.md) · [Parte 5](05-frontend-session-shell.md)

## 20. Secondo audit del codice — Punto 5: Evidence e Market Reactions

### Perimetro

```txt
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/matchEvidence/alignment.js
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/fieldLedReactionEvidence.js
backend/src/sofa/marketReactionEvidence.js
backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/config.js
backend/src/sofa/significantMarketFlow/candidates.js
backend/src/sofa/significantMarketFlow/runnerFlow.js
backend/src/sofa/significantMarketFlow/singleTick.js
backend/src/sofa/significantMarketFlow/clusters.js
backend/src/sofa/marketLedObservationEvidence.js
backend/src/sofa/marketLedObservationEvidence/observationWindow.js
backend/src/sofa/temporalAlignmentEvidence.js

backend/src/sofa/marketReactionEvidence.test.mjs
backend/src/sofa/fieldLedReactionEvidence.test.mjs
backend/src/sofa/marketLedObservationEvidence/observationWindow.test.mjs
```

### Confine della pipeline Evidence

Il Match Evidence Snapshot è costruito da timeline già persistite. Il loader:

1. legge le timeline SofaScore e Betfair;
2. legge lo stato di persistence integrity per entrambe le fonti;
3. seleziona l’epoch Betfair attivo;
4. costruisce o applica Source Identity;
5. limita i dati attribuiti al contesto corrente;
6. compone Evidence e Market Reactions nello snapshot restituito.

Il percorso è read-only rispetto alle timeline. Non avvia scraper o browser, non acquisisce dati live, non aggiunge tick, non esegue recovery e non modifica history, timeline o gate di tracking.

### Gate cross-source correnti

L’attribuzione cross-source è consentita soltanto quando:

```txt
Source Identity effective = aligned
+
persistence integrity senza partial_persistence o recovery_failed
```

Con Source Identity `pending` o `mismatch`, oppure con persistence integrity in conflitto:

- il tick Betfair attribuito viene escluso dai builder cross-source;
- il lookback attribuito viene svuotato;
- le timeline passate a Market Reactions vengono svuotate;
- `marketReactionEvidence.available` viene forzato a `false`;
- le reason di identity e persistenza restano distinte;
- la Source Identity non viene convertita in un errore storage.

Il riepilogo di integrità riconosce `no_known_partial`, `partial_persistence` e `recovery_failed`. Nel comportamento corrente, input di integrità assente o non riconosciuto viene normalizzato a `no_known_partial`; non esiste uno stato operativo separato `integrity_unknown` in questa pipeline.

### Invarianti confermate

#### Epoch Betfair attivo

Le osservazioni attribuite usano la porzione finale contigua della timeline appartenente allo stesso contesto di mercato. Gli epoch precedenti non partecipano al contesto corrente.

#### Conferma manuale contestuale

La conferma manuale viene cercata soltanto quando l’identità automatica è `pending` e viene applicata al contesto costruito per evento ed epoch correnti. Un contesto non applicabile non rende automaticamente aligned la Source Identity.

#### Assenza di causalità

I builder di Market Reactions mantengono l’invariante:

```txt
causalityClaimed: false
interpretation: temporal_proximity_only
```

Una sequenza temporale, un cambiamento di prezzo, un incremento matched o un marker SofaScore non sono presentati dal backend come prova di causalità, fair odds, segnale o autorizzazione operativa.

#### Immutabilità degli input

I builder lavorano su viste o copie derivate. I test associati verificano, nei casi coperti, che array di tick e configurazioni non siano mutati.

### Matrice del comportamento corrente

| Ambito                      | Comportamento corrente                                                                                                                                                   | Stato rispetto alla decisione approvata                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Identità temporale runner   | `selectionId` è preferito, ma se manca su entrambi i lati Field → Market può ancora usare il nome                                                                        | decisione `EVIDENCE-001` non applicata integralmente                 |
| Tick tecnicamente degradati | il gate top-level usa Source Identity e persistence integrity; non esiste un eligibility gate uniforme che escluda ogni tick stale, degradato o status-only dai detector | decisione `EVIDENCE-002` non applicata integralmente                 |
| Field → Market              | `marketResponseObserved` è vero per variazione di prezzo oppure incremento di `market.totalMatched`                                                                      | distinzione di `EVIDENCE-003` non introdotta                         |
| Market → Field              | la presenza di marker rilevanti nella finestra oppure una differenza di score può rendere vero `fieldEventObservedAfterFlow`                                             | distinzione transizione/persistenza di `EVIDENCE-004` non introdotta |
| Alignment                   | espone età delle fonti, `maxSourceAgeSec`, `crossSourceGapSec` e `pairwiseAvailable`; conserva anche `maxTickGapSec` come alias dell’età massima                         | source gap aggiunto, provenance completa di `EVIDENCE-005` assente   |
| Timestamp futuri            | `dataQuality` aggiunge reason future; `ageSec` resta clampato e l’alignment non espone `futureSkewSec`                                                                   | decisione `EVIDENCE-005` parziale                                    |
| Prezzi runner               | risoluzione in ordine LTP, midpoint, best back, best lay; il risultato conserva il numero ma non la source                                                               | decisione `EVIDENCE-006` non applicata                               |
| Baseline Field → Market     | ultimo tick Betfair con timestamp `<= anchor`, senza gap massimo esposto o applicato                                                                                     | decisione `EVIDENCE-006` non applicata                               |
| Copertura runner            | `ladderReliable`, `moneyFlowReliable` e `marketTradable` diventano veri se almeno un runner soddisfa il predicato                                                        | coverage esplicita di `EVIDENCE-007` assente                         |
| Significant Flow            | soglie e configurazione restano euristiche; il lookback disponibile al loader è limitato rispetto al valore configurabile del detector                                   | policy di `EVIDENCE-008` non applicata integralmente                 |
| Cluster                     | costruzione basata sui candidati/tick; non è esposto il contratto completo con gap temporale massimo, provenance e non sovrapposizione                                   | decisione `EVIDENCE-008` non applicata integralmente                 |
| Availability                | parent e child usano ancora `available` insieme a flag specifici; non esiste il contratto uniforme `computed/inputAvailable/observationAvailable/windowState`            | decisione `EVIDENCE-009` non applicata                               |
| Finestre                    | Field → Market espone `windowClosed`; Market → Field non espone lo stesso stato uniforme                                                                                 | decisione `EVIDENCE-009` non applicata                               |

### EVIDENCE-001 — Identità temporale del runner

**Classificazione storica:** bug confermato rispetto alla decisione approvata  
**Stato:** implementazione mancante

Nel ramo Field → Market, il confronto baseline/latest usa `selectionId` quando disponibile. Se il runner baseline non possiede `selectionId`, il codice può ancora cercare un runner latest privo di ID con lo stesso nome.

La regola approvata resta distinta dal comportamento corrente:

```txt
confronto temporale dello stesso runner Betfair
→ selectionId obbligatorio
→ nessun fallback sul nome
```

Il nome continua a essere adatto a visualizzazione e diagnostica, ma non è ancora escluso da tutti i confronti temporali.

### EVIDENCE-002 — Eligibility tecnica dei tick

**Classificazione storica:** bug confermato  
**Stato:** correzione non implementata

`evidenceBuilder.js` sospende l’attribuzione cross-source per Source Identity non aligned e persistence conflict. La qualità tecnica viene calcolata separatamente in `dataQuality.js`, ma non governa in modo uniforme l’ingresso dei tick in tutti i detector Market Reactions.

Di conseguenza, la timeline può essere conservata correttamente per health e diagnostica senza che esista, nello stesso punto, un contratto generale che impedisca a ogni tick stale, Graph degradato o status-only di essere trattato come nuova osservazione algoritmica.

### EVIDENCE-003 — Attività matched e risposta di mercato

**Classificazione storica:** bug semantico confermato  
**Stato:** correzione non implementata

Nel ramo Field → Market:

```txt
priceChangeObserved
oppure
matchedVolumeIncreaseObserved
→ marketResponseObserved
```

`matchedVolumeIncreaseObserved` deriva dall’aumento di `market.totalMatched` fra baseline e ultimo tick della finestra. Il contratto corrente non separa ancora in campi autonomi attività matched generale, variazione di volume del runner e osservazione qualificata.

`marketResponseReliable` aggiunge un gate successivo: richiede risposta osservata, qualità `good` e qualità tecnica Betfair affidabile. Questa distinzione migliora la lettura del risultato, ma non cambia la semantica ampia di `marketResponseObserved`.

### EVIDENCE-004 — Persistenza e transizione dei marker

**Classificazione storica:** bug confermato  
**Stato:** correzione non implementata

In una finestra Market → Field, `fieldEventObservedAfterFlow` è vero quando è presente almeno un marker rilevante oppure quando lo snapshot di score differisce dalla baseline.

Il risultato non espone ancora separatamente:

```txt
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource
```

La persistenza di un marker già attivo può quindi contribuire al booleano osservato anche senza una transizione nuova successiva al source market event.

### EVIDENCE-005 — Provenance temporale e alignment

**Classificazione storica:** bug confermato e limite noto  
**Stato:** implementazione parziale

`buildAlignment()` espone oggi:

```txt
sofaAgeSec
betfairAgeSec
maxSourceAgeSec
crossSourceGapSec
pairwiseAvailable
freshnessQuality
```

`crossSourceGapSec` misura la distanza assoluta fra i timestamp delle due fonti. `maxTickGapSec` è ancora restituito come alias compatibile dell’età massima, non come distanza fra le fonti.

La qualità `good` o `medium` richiede entrambe le fonti. Una fonte assente produce qualità `poor`.

Restano fuori dal contratto corrente la distinzione completa fra acquisition e recording, `pipelineDelaySec`, `futureSkewSec`, `baselineGapSec` e `firstPostSourceGapSec`. `dataQuality` segnala timestamp futuri nelle reason, mentre il calcolo dell’età resta clampato a zero.

### EVIDENCE-006 — Provenienza e comparabilità dei prezzi

**Classificazione storica:** bug di qualità confermato  
**Stato:** correzione non implementata

La funzione di risoluzione del prezzo preferisce:

```txt
lastTradedPrice
→ midpoint bestBack/bestLay
→ bestBack
→ bestLay
```

Il confronto Field → Market conserva `baselinePrice` e `latestPrice`, ma non la source usata per ciascun valore. Un passaggio da LTP a midpoint o a un solo lato del book può quindi apparire nello stesso delta numerico.

La baseline resta l’ultimo tick antecedente o coincidente con l’anchor; non è applicata una soglia massima del gap baseline→anchor.

### EVIDENCE-007 — Copertura del mercato a due runner

**Classificazione storica:** bug confermato  
**Stato:** correzione non implementata

I boolean globali di `dataQuality` sono basati sull’esistenza di almeno un runner idoneo:

```txt
almeno un runner con ladder affidabile → ladderReliable
almeno un runner con flow confermato → moneyFlowReliable
almeno un runner con book tradable → marketTradable
```

Non sono esposti conteggi o stati `complete | partial | none` per book, ladder e flow. I boolean correnti non attestano quindi la copertura completa dei due runner del mercato tennis.

### EVIDENCE-008 — Significant Flow, baseline e cluster

**Classificazione storica:** limite noto e miglioria utile  
**Stato:** policy non implementata integralmente

Il loader Evidence passa alla pipeline una coda limitata dell’epoch attivo; il detector mantiene una propria configurazione di lookback. Il numero dichiarato dalla configurazione può quindi eccedere l’input realmente disponibile.

Le soglie assolute e relative di Significant Flow restano euristiche di configurazione. Il risultato mantiene `causalityClaimed:false`; le classi di intensità non costituiscono calibrazione storica né segnale operativo.

Il contratto corrente non espone ancora congiuntamente:

- baseline relativa distinta per `selectionId` e baseline aggregata del mercato;
- gap temporale massimo dei cluster;
- garanzia pubblica di non sovrapposizione o doppio conteggio;
- provenance completa dei tick inclusi nel cluster.

### EVIDENCE-009 — Availability e stato delle finestre

**Classificazione storica:** limite semantico e documentazione mancante  
**Stato:** correzione non implementata

Il parent Market Reactions aggrega i risultati di Significant Flow, Market → Field e Field → Market. `available` indica che almeno un child è disponibile, ma i child non attribuiscono tutti lo stesso significato al campo.

Sono presenti flag più specifici, fra cui source event disponibile, flow rilevato, field event osservato, market response osservata e market response affidabile. Non è però disponibile il contratto uniforme approvato:

```txt
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
windowState
```

Field → Market espone `windowClosed`; Market → Field restituisce finestre temporali e qualità senza lo stesso stato esplicito open/closed/final.

### DOC-026 — Temporal provenance e policy di alignment non documentate

**Stato:** `RISOLTO LATO DOCUMENTAZIONE`
**Classificazione:** `DOCUMENTAZIONE MANCANTE`

**Problema originario**

Il finding storico rilevava che provenance temporale e policy di alignment non erano documentate con sufficiente precisione. Il contratto doveva distinguere `acquiredAt`, `recordedAt`, freshness, source skew, pipeline delay, future clock skew, baseline gap, first post-source gap, observation window e stato open/closed della finestra, mantenendo distinta l'età del dato dal gap fra le fonti.

**Stato ed evidenza corrente**

Il difetto documentale originario è risolto: gli owner correnti documentano freshness delle fonti, `crossSourceGapSec`, disponibilità pairwise, timestamp futuri e comportamento corrente delle finestre. La provenance tecnica completa resta però incompleta.

**Responsabilità tecnica collegata**

Il debito tecnico residuo appartiene a `IMPL-022 — Evidence temporal provenance and alignment policy`. DOC-026 non dichiara completata `IMPL-022`.

**Criterio di chiusura**

DOC-026 resta risolto lato documentazione perché il comportamento corrente e i limiti ancora aperti sono documentati. Il completamento tecnico della provenance resta responsabilità autonoma di `IMPL-022`.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md`
- `docs/tennis-decision-ui/modules/evidence/04-market-reactions.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`
- provenance storica: commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`

---

### DOC-027 — Availability, activity, response e threshold non documentati

**Stato:** `RISOLTO LATO DOCUMENTAZIONE`
**Classificazione:** `DOCUMENTAZIONE MANCANTE`

**Problema originario**

Il finding storico rilevava che detector eseguito, input availability, source event, activity, runner variation, qualified observation, provisional/final e natura delle threshold non erano distinti con sufficiente precisione.

**Stato ed evidenza corrente**

Il difetto documentale originario è risolto: gli owner correnti distinguono availability, flow, source event, observation, reliability e qualità e documentano le soglie correnti senza presentarle come segnali calibrati.

Non esiste ancora un contratto tecnico uniforme con `computed`, `inputAvailable`, `sourceEventAvailable`, `observationAvailable`, `observationDetected`, `provisional`, `stale` e `windowState`.

**Responsabilità tecnica collegata**

Il contratto tecnico uniforme residuo appartiene a `IMPL-023 — Market Reaction eligibility e branch state`. DOC-027 non dichiara completata `IMPL-023`.

**Criterio di chiusura**

DOC-027 resta risolto lato documentazione; l'uniformazione tecnica futura resta responsabilità di `IMPL-023`.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md`
- `docs/tennis-decision-ui/modules/evidence/04-market-reactions.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`
- provenance storica: commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`

---

### TEST-031 — Tick `status-only` non crea nuovo Significant Flow/source event

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un tick Betfair classificato tecnicamente `status-only` deve restare utilizzabile per health/diagnostica ma non deve:

- creare nuovo Significant Flow;
- entrare come nuova osservazione algoritmica qualificata;
- diventare `sourceMarketEvent`.

**Evidenza/copertura corrente**

Sono già presenti primitive collegate:

- flow con confidence `suppressed` non viene promosso a Significant Flow;
- Significant Flow invalido/assente non produce un source flow valido;
- il comportamento tecnico `status-only` viene degradato nelle primitive Betfair pertinenti.

Questa copertura non equivale ancora alla regressione end-to-end dedicata.

**Gap residuo**

Manca la regressione esplicita:

```txt
status-only
→ no Significant Flow
→ no sourceMarketEvent
```

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

**Criterio di chiusura**

Chiudere soltanto quando una regressione end-to-end dimostra che un tick `status-only` non genera flow/source event pur restando disponibile alla diagnostica.

**Riferimenti essenziali**

- `backend/src/sofa/significantMarketFlowEvidence.test.mjs`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-032 — Eligibility tecnica Market Reactions su stale/Graph/ladder/skew

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Gli input tecnicamente non eleggibili devono poter restare nelle timeline/diagnostica senza essere promossi automaticamente a osservazioni Market Reactions affidabili.

Il contratto comprende almeno:

- Graph degradato/stale;
- ladder non affidabile/assente;
- flow `suppressed`;
- runner identity insufficiente dove richiesta;
- source gap / clock skew / provenance temporale dove applicabile.

**Evidenza/copertura corrente**

Significant Flow possiede già controlli reali e test mirati che rifiutano almeno:

- Graph stale;
- ladder assente/non affidabile;
- `selectionId` mancante;
- money flow `suppressed`.

Esistono inoltre primitive di alignment/data quality per source gap e timestamp futuri.

**Gap residuo**

Manca un eligibility gate uniforme e condiviso da tutti i branch Market Reactions con stato/reason coerenti.

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

Collegamento tecnico secondario per provenance temporale: `IMPL-022 — Evidence temporal provenance and alignment policy`.

**Criterio di chiusura**

Chiudere soltanto quando tutti i branch usano un contratto uniforme di eligibility e la suite copre sistematicamente gli input tecnicamente degradati previsti.

**Riferimenti essenziali**

- `backend/src/sofa/significantMarketFlowEvidence.test.mjs`
- `backend/src/sofa/matchEvidence/alignment.js`
- `backend/src/sofa/matchEvidence/dataQuality.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-033 — `selectionId` obbligatorio senza fallback nome

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Nei confronti temporali Betfair che richiedono identità certa del runner:

```txt
stesso runner
→ stesso `selectionId` valido/stabile
```

Nessun fallback sul nome.

**Evidenza/copertura corrente**

Significant Flow richiede già `selectionId`, ma Field → Market può ancora usare il nome quando baseline e latest sono entrambi privi di ID.

**Gap residuo**

Manca la regressione che impedisca il fallback nominale nel confronto runner Field → Market e verifichi una reason esplicita di indisponibilità/degrado.

**Owner tecnico collegato**

`IMPL-024 — Runner temporal identity e price comparability`.

**Criterio di chiusura**

Chiudere quando runner senza `selectionId` non viene mai associato temporalmente tramite nome nei confronti Exchange che richiedono identità certa.

**Riferimenti essenziali**

- `backend/src/sofa/fieldLedReactionEvidence.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-034 — Market activity distinta da qualified observation

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Il solo incremento generale di `market.totalMatched` deve poter indicare market activity presente senza diventare automaticamente qualified market observation / response runner-specific.

Contratto target minimo:

```txt
market activity
≠ runner variation
≠ qualified observation
```

**Evidenza/copertura corrente**

Field → Market continua a considerare:

```txt
priceChangeObserved
OR
matchedVolumeIncreaseObserved
→ marketResponseObserved
```

Il test corrente accetta ancora questa semantica ampia.

**Gap residuo**

Manca la distinzione contrattuale e la regressione:

```txt
solo market totalMatched aumenta
→ marketActivityObserved:true
→ qualifiedMarketObservation:false
```

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

**Criterio di chiusura**

Chiudere soltanto quando attività generica e osservazione qualificata sono campi/semantiche distinte e la regressione impedisce falsi qualified observation.

**Riferimenti essenziali**

- `backend/src/sofa/fieldLedReactionEvidence.js`
- `backend/src/sofa/fieldLedReactionEvidence.test.mjs`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-035 — Marker presente distinto da marker transition

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un marker già presente prima del source market event e ancora presente dopo non deve essere automaticamente promosso a nuova transizione post-source.

Target:

```txt
markerPresentAfterSource
≠ markerTransitionObservedAfterSource
```

**Evidenza/copertura corrente**

Market → Field può ancora considerare la presenza di marker rilevanti nella finestra come parte di `fieldEventObservedAfterFlow`.

Non esiste la distinzione completa fra presenza e nuova transizione.

**Gap residuo**

Manca la regressione:

```txt
stesso marker prima e dopo source flow
→ markerPresentAfterSource:true
→ markerTransitionObservedAfterSource:false
```

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

**Criterio di chiusura**

Chiudere quando persistenza e transizione sono distinte nel contratto e testate separatamente.

**Riferimenti essenziali**

- `backend/src/sofa/marketLedObservationEvidence.js`
- `backend/src/sofa/marketLedObservationEvidence/observationWindow.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-036 — Price source change degradata/unavailable

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un confronto di prezzo deve conoscere la source di `baselinePrice` e `latestPrice` e distinguere un cambio di source, per esempio:

```txt
LTP
→ midpoint
→ bestBack
→ bestLay
```

da un confronto pienamente comparabile.

**Evidenza/copertura corrente**

Field → Market risolve il prezzo con precedenza:

```txt
lastTradedPrice
→ midpoint
→ bestBack
→ bestLay
```

ma conserva il valore numerico senza esporre la source usata per baseline/latest.

**Gap residuo**

Mancano:

- `baselinePriceSource`;
- `latestPriceSource`;
- `priceSourcesComparable`;
- reason/status di source change;
- regressione dedicata.

**Owner tecnico collegato**

`IMPL-024 — Runner temporal identity e price comparability`.

**Criterio di chiusura**

Chiudere quando un cambio di source produce stato degraded/unavailable secondo policy esplicita e la source dei due prezzi è verificabile.

**Riferimenti essenziali**

- `backend/src/sofa/fieldLedReactionEvidence.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-037 — Baseline gap oltre soglia

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Una baseline Betfair troppo distante temporalmente dall'anchor non deve essere trattata come confronto affidabile.

Target:

```txt
baselineAt <= anchorAt
+ baselineGapSec calcolato
+ baselineGapSec <= soglia
```

Se oltre soglia:

```txt
→ degraded/unavailable
→ reason esplicita
→ nessun confronto affidabile
```

**Evidenza/copertura corrente**

Field → Market usa ancora l'ultimo tick Betfair con timestamp `<= anchor` senza applicare `maxBaselineGapSec` o contratto equivalente.

**Gap residuo**

Mancano soglia, gap esposto uniformemente e regressione oltre-soglia.

**Owner tecnico collegato**

`IMPL-024 — Runner temporal identity e price comparability`.

Collegamento di provenance: `IMPL-022 — Evidence temporal provenance and alignment policy`.

**Criterio di chiusura**

Chiudere quando baseline esattamente in soglia e oltre soglia sono testate deterministicamente e il secondo caso degrada il confronto.

**Riferimenti essenziali**

- `backend/src/sofa/fieldLedReactionEvidence.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-038 — Coverage runner complete/partial/none

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Per un mercato tennis a due runner deve essere possibile distinguere esplicitamente coverage:

```txt
complete
partial
none
```

almeno per gli aspetti pertinenti:

```txt
book
ladder
flow
price comparison
```

Un solo runner valido non deve produrre un falso stato globale di coverage completa.

**Evidenza/copertura corrente**

I boolean globali correnti diventano veri se almeno un runner soddisfa il predicato rilevante.

Non sono ancora esposti i conteggi/stati completi previsti dal contratto target.

**Gap residuo**

Mancano conteggi runner e regressioni:

- entrambi completi → `complete`;
- uno completo / uno degradato → `partial`;
- nessuno valido → `none`.

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

Collegamento tecnico aggiuntivo: `IMPL-024 — Runner temporal identity e price comparability`.

**Criterio di chiusura**

Chiudere quando coverage `complete/partial/none` è esplicita e nessun boolean aggregato può essere interpretato come copertura completa basandosi su un solo runner.

**Riferimenti essenziali**

- `backend/src/sofa/matchEvidence/dataQuality.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-039 — Acquisition timestamp, source skew e clock skew

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

La provenance temporale deve distinguere almeno timestamp della sorgente, acquisition e recording, e deve degradare esplicitamente freshness/alignment quando i timestamp non sono validi o lo skew fra le fonti supera la policy ammessa.

Il caso minimo storico comprende:

```txt
timestamp futuro
recordedAt diverso da acquiredAt
source skew elevato
→ freshness/alignment degradati correttamente
```

**Evidenza/copertura corrente**

Sono già presenti e testate primitive reali:

- `sofaAgeSec` e `betfairAgeSec`;
- `crossSourceGapSec`;
- `pairwiseAvailable`;
- timestamp invalido;
- timestamp futuro oltre la tolleranza corrente degradato a qualità `poor`.

**Gap residuo**

Mancano ancora:

- distinzione completa `acquiredAt` / `recordedAt`;
- `pipelineDelaySec`;
- policy versionata di `sourceSkewSec`;
- uso uniforme dello skew di acquisizione nella classificazione cross-source.

**Owner tecnico collegato**

`IMPL-022 — Evidence temporal provenance and alignment policy`.

**Criterio di chiusura**

Chiudere soltanto quando acquisition, recording, future clock skew e source skew sono rappresentati dal contratto Evidence e coperti da regressioni deterministiche sulla qualità temporale.

**Riferimenti essenziali**

- `backend/src/sofa/matchEvidence/alignment.js`
- `backend/src/sofa/matchEvidence/alignment.test.mjs`
- `backend/src/sofa/matchEvidence/time.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-040 — Baseline Significant Flow per `selectionId`

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

La baseline relativa usata per Significant Flow deve essere runner-specific: il flow storico del runner A non può contribuire alla baseline del runner B.

Il caso minimo richiesto è:

```txt
runner A
→ baseline costruita solo da campioni con lo stesso selectionId
→ nessun flow del runner B nella baseline di A
```

**Evidenza/copertura corrente**

La baseline corrente calcola una mediana su una sequenza di importi numerici validi. L'identità `selectionId` non appartiene al contratto del calcolo della baseline.

**Gap residuo**

Manca una baseline runner-specific vincolata allo stesso `selectionId`, con relativo test di regressione cross-runner.

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

**Criterio di chiusura**

Chiudere quando la baseline relativa di ogni runner usa esclusivamente campioni dello stesso `selectionId` e una regressione dimostra che i campioni dell'altro runner non possono contaminarla.

**Riferimenti essenziali**

- `backend/src/sofa/significantMarketFlow/baseline.js`
- `backend/src/sofa/significantMarketFlowEvidence.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-041 — Cluster temporali non sovrapposti

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

I cluster Significant Flow devono rispettare una policy temporale deterministica e non devono riutilizzare lo stesso tick in cluster sovrapposti o produrre doppio conteggio.

Il caso minimo storico comprende:

```txt
tick consecutivi ma temporalmente distanti
→ non uniti

tick già assegnato
→ non doppio conteggio in cluster sovrapposti
```

**Evidenza/copertura corrente**

Il clustering corrente:

- raggruppa i candidate per runner;
- richiede consecutività dei `tickIndex`;
- limita la finestra con `maxClusterTicks`;
- produce una deduplicazione finale.

Non usa però una policy `maxClusterGapSec` e non implementa il contratto target esplicito di assegnazione non sovrapposta dei tick.

**Gap residuo**

Mancano:

- gap temporale massimo esplicito;
- `inputTickIds` univoci;
- policy deterministica di non sovrapposizione;
- regressione dedicata contro il doppio conteggio.

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

**Criterio di chiusura**

Chiudere quando i cluster sono temporalmente bounded, non sovrapposti secondo una policy deterministica e nessun tick può contribuire due volte alla stessa interpretazione aggregata.

**Riferimenti essenziali**

- `backend/src/sofa/significantMarketFlow/clusters.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-042 — Semantica computed/available/observed

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Il fatto che un detector sia stato calcolato deve restare distinto dalla disponibilità dell'input, dalla disponibilità dell'osservazione e dal fatto che un'osservazione sia stata effettivamente rilevata.

Il caso minimo storico richiede almeno:

```txt
detector computed
+ nessuna osservazione
→ computed:true
→ observationAvailable:false
→ top-level coerente
```

**Evidenza/copertura corrente**

Esistono già distinzioni reali e testate fra:

- `available`;
- presenza/assenza di osservazioni;
- `marketResponseObserved`;
- `marketResponseReliable`;
- Significant Flow disponibile ma senza `largeFlowDetected`.

Queste primitive non formano però un branch state uniforme.

**Gap residuo**

Manca un contratto condiviso che distingua in modo coerente almeno:

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

**Owner tecnico collegato**

`IMPL-023 — Market Reaction eligibility e branch state`.

**Criterio di chiusura**

Chiudere quando tutti i branch Market Reactions espongono la stessa semantica di stato e i test distinguono esplicitamente detector calcolato, input disponibile, osservazione disponibile e osservazione rilevata.

**Riferimenti essenziali**

- `backend/src/sofa/marketReactionEvidence.js`
- `backend/src/sofa/marketReactionEvidence.test.mjs`
- `backend/src/sofa/fieldLedReactionEvidence.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-043 — Finestre open/closed e provisional/final

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Market → Field e Field → Market devono usare una semantica uniforme per distinguere finestre ancora aperte da finestre concluse e risultati provvisori da risultati finali per quella finestra.

Il caso minimo storico richiede:

```txt
finestra non conclusa
→ provisional/open

finestra conclusa
→ closed/final per quella finestra
```

**Evidenza/copertura corrente**

Field → Market espone già `windowClosed`.

Market → Field espone finestre temporali e qualità, ma non lo stesso contratto uniforme. Non esiste ancora una semantica cross-branch completa `open/closed` e `provisional/final`.

**Gap residuo**

Mancano:

- `windowState` uniforme;
- `provisional`;
- `finalForWindow`;
- regressione dedicata che distingua finestra aperta e finestra conclusa nei branch pertinenti.

**Owner tecnico collegato**

Owner primario: `IMPL-022 — Evidence temporal provenance and alignment policy`.

Collegamento tecnico per il branch state uniforme: `IMPL-023 — Market Reaction eligibility e branch state`.

**Criterio di chiusura**

Chiudere quando entrambi i rami usano lo stesso contratto di lifecycle della finestra e la suite verifica esplicitamente gli stati open/provisional e closed/final senza confonderli con la sola availability.

**Riferimenti essenziali**

- `backend/src/sofa/fieldLedReactionEvidence.js`
- `backend/src/sofa/marketLedObservationEvidence/observationWindow.js`
- `implementazioni/implementazioni-proposte/04-evidence-provenance.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### Matrice delle verifiche associate

Questa matrice conserva il collegamento con i test previsti. La loro presenza non implica che siano implementati o superati.

| ID       | Contratto da verificare                               | Copertura specifica presente                                                         |
| -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| TEST-031 | status-only non crea nuovi flow/source event          | copertura parziale delle primitive: flow `suppressed` non diventa Significant Flow e senza flow non esiste source event valido; manca la regressione end-to-end dedicata `status-only → no flow → no source event` |
| TEST-032 | eligibility tecnica uniforme                          | copertura parziale: Significant Flow rifiuta Graph stale, ladder assente/non affidabile, `selectionId` mancante e flow `suppressed`; alignment/data quality coprono primitive temporali, ma manca un eligibility gate uniforme su tutti i branch |
| TEST-033 | `selectionId` obbligatorio senza fallback nome        | non identificata; il fallback esiste nel codice                                      |
| TEST-034 | attività matched distinta da osservazione qualificata | non identificata; il test corrente accetta `marketResponseObserved` su matched/price |
| TEST-035 | marker persistente distinto da transizione            | non identificata                                                                     |
| TEST-036 | source prezzo non comparabile                         | non identificata                                                                     |
| TEST-037 | baseline oltre soglia                                 | non identificata                                                                     |
| TEST-038 | coverage parziale dei runner                          | non identificata                                                                     |
| TEST-039 | acquisition, recording e clock skew                   | copertura parziale: source age, `crossSourceGapSec`, pairwise availability e timestamp futuri sono coperti; mancano `acquiredAt`/`recordedAt` e policy completa di source skew |
| TEST-040 | baseline Significant Flow per `selectionId`           | non identificata come contratto completo                                             |
| TEST-041 | cluster temporali non sovrapposti                     | non identificata come contratto completo                                             |
| TEST-042 | availability semantica uniforme                       | copertura parziale: `available`, observation e reliability sono già distinti/testati; manca il branch state uniforme con `computed`, input/source/observation availability e detection |
| TEST-043 | finestre open/closed uniformi                         | non identificata                                                                     |

I test associati coprono, nei rispettivi fixture:

- forma dei risultati con input vuoto;
- finestre configurabili;
- propagazione dei summary;
- assenza di mutazione degli input;
- invariante `causalityClaimed:false`;
- rilevamento Field → Market con marker e tick Betfair successivi;
- distinzione fra `marketResponseObserved` e `marketResponseReliable`.

### Collegamenti agli owner

Le specifiche complete delle decisioni approvate restano di competenza degli owner storici:

| Owner      | Ambito                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| `IMPL-022` | temporal provenance, source skew, delay, future skew, gap e stato delle finestre                           |
| `IMPL-023` | eligibility tecnica, branch state, activity/observation, transizioni, coverage, Significant Flow e cluster |
| `IMPL-024` | identità temporale del runner, source e comparabilità dei prezzi, baseline gap                             |
| `DOC-017`  | flusso di composizione fra Evidence builder e Market Reactions                                             |
| `DOC-026`  | terminologia e policy temporale                                                                            |
| `DOC-027`  | availability, activity, observation, response e soglie                                                     |

Il completamento di questo audit non equivale al completamento di tali owner o dei test associati.

### Esito consolidato del Punto 5

La pipeline conserva quattro proprietà strutturali solide:

1. costruzione read-only da timeline persistite;
2. attribuzione cross-source bloccata da Source Identity non aligned e persistence conflict;
3. selezione del contesto Betfair attivo;
4. assenza esplicita di causalità e di autorizzazione operativa.

Restano correnti i limiti registrati da `EVIDENCE-001…009`: eligibility tecnica non uniforme, fallback nominale nel confronto runner, semantica ampia di response, mancata distinzione fra presenza e transizione del marker, provenance temporale incompleta, source del prezzo non esposta, coverage runner aggregata per esistenza, policy Significant Flow/cluster non completa e availability non uniformata.

Il record resta unitario: la pipeline Evidence e Market Reactions è un dominio cross-source unico, mentre implementazione, documentazione di prodotto, frontend e validazione mantengono owner separati.
