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

### Matrice delle verifiche associate

Questa matrice conserva il collegamento con i test previsti. La loro presenza non implica che siano implementati o superati.

| ID       | Contratto da verificare                               | Copertura specifica presente                                                         |
| -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| TEST-031 | status-only non crea nuovi flow/source event          | copertura specifica non presente                                                     |
| TEST-032 | eligibility tecnica uniforme                          | non identificata                                                                     |
| TEST-033 | `selectionId` obbligatorio senza fallback nome        | non identificata; il fallback esiste nel codice                                      |
| TEST-034 | attività matched distinta da osservazione qualificata | non identificata; il test corrente accetta `marketResponseObserved` su matched/price |
| TEST-035 | marker persistente distinto da transizione            | non identificata                                                                     |
| TEST-036 | source prezzo non comparabile                         | non identificata                                                                     |
| TEST-037 | baseline oltre soglia                                 | non identificata                                                                     |
| TEST-038 | coverage parziale dei runner                          | non identificata                                                                     |
| TEST-039 | acquisition, recording e clock skew                   | non identificata come contratto completo                                             |
| TEST-040 | baseline Significant Flow per `selectionId`           | non identificata come contratto completo                                             |
| TEST-041 | cluster temporali non sovrapposti                     | non identificata come contratto completo                                             |
| TEST-042 | availability semantica uniforme                       | non identificata                                                                     |
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
