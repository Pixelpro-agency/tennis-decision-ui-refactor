# Validità tecnica dei campioni Betfair

## Scopo

Questo documento definisce quando un risultato Betfair può diventare un campione elaborabile e quale effetto può avere sul flusso canonico.

Distingue:

```txt
errore tecnico
≠
mercato concluso
≠
tick canonico persistibile
```

Un risultato tecnicamente incompleto non deve essere interpretato come fine mercato e non deve produrre nuovi dati canonici derivati dal sample corrente.

Un risultato tecnicamente utilizzabile non garantisce invece da solo la persistenza: Source Identity, regressioni, duplicati e commit journalizzato intervengono successivamente.

Un campione tecnico non utilizzabile può comunque innescare il tentativo di completare un commit Betfair già pendente tramite il percorso `repairOnly`. Questo repair non trasforma il sample corrente in un campione canonico e non conferma il baseline `marketState`.

## Implementazione

```txt
backend/src/sofa/betfair/processor.js
backend/src/sofa/betfair/trackerUpdate.js
backend/src/sofa/betfairFetch.js
backend/src/sofa/betfair/processor/technicalSample.js
backend/src/sofa/betfair/processor/runnerProcessing.js
backend/src/sofa/betfair/processor/persistence.js
backend/src/sofa/betfair/processor/persistenceDecision.js
backend/src/sofa/betfair/processor/persistenceDocuments.js
backend/src/sofa/betfair/processor/persistenceResultHelpers.js
backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js
backend/src/sofa/betfair/processor/canonicalTimeline.js
backend/src/sofa/betfair/processor/journalRecovery.js
backend/src/sofa/betfair/timeline.js
backend/src/sofa/betfair/timeline/state.js
backend/src/sofa/betfair/timeline/statusOnlySnapshot.js
backend/src/sofa/betfair/timeline/graphHealth.js
backend/src/sofa/matchHistory/commitJournal.js
```

Nel tracking live, `trackerUpdate.js` valuta prima `event_status.hasFinished`, quindi classifica la validità tecnica del risultato. Soltanto un campione tecnicamente utilizzabile prosegue verso l'osservazione del gate Source Identity.

Il processor applica la stessa classificazione prima di elaborare lo stato dei runner. Il livello di persistenza esegue inoltre un proprio backstop tramite `classifyBetfairTechnicalSample(...)` prima di decidere se il sample corrente possa produrre un nuovo commit.

Il journal non modifica la classificazione tecnica del campione: coordina commit e recovery dopo che il flusso ha stabilito se esistono nuovi dati candidati oppure se deve essere completato un commit già pendente.

## Classificazione tecnica

`classifyBetfairTechnicalSample(...)` restituisce:

```txt
usable
reason
totalMatched
```

Un campione non è utilizzabile quando:

```txt
raw assente, non oggetto o array
proprietà raw.error presente
proprietà raw.api_error presente
raw.runners non è un array
raw.runners è vuoto
un runner non è un oggetto oppure è un array
selectionId assente, vuoto o non normalizzabile
selectionId duplicato nel campione
raw.market_info assente, non oggetto oppure array
raw.market_info.total_matched assente
total_matched non numerico o non finito
total_matched minore o uguale a zero
```

Reason correnti:

```txt
invalid_raw
raw_error
api_error
runners_missing
runners_empty
runner_invalid
selection_id_invalid
selection_id_duplicate
total_matched_missing
total_matched_invalid
total_matched_non_positive
```

Ogni runner deve essere un oggetto non-array e deve possedere un `selectionId` costituito da una stringa non vuota dopo `trim()` oppure da un numero finito.

Per il controllo di unicità gli ID vengono normalizzati a stringa. Di conseguenza:

```txt
7
"7"
```

rappresentano la stessa identità tecnica e, se compaiono entrambi nello stesso sample, producono `selection_id_duplicate`.

La continuità del runner nel processing è basata sul `selectionId`: un rename con lo stesso ID può conservare il baseline precedente, mentre lo stesso nome con un ID diverso non viene trattato come la stessa identità.

Quando il processor riceve un campione non utilizzabile, costruisce un risultato normalizzato che conserva la shape disponibile e aggiunge:

```txt
technicalFailure: <technical reason>
```

La proprietà `technicalFailure` appartiene al risultato elaborato dal processor; non va confusa con il `reason` del risultato di persistenza.

### Normalizzazione di `total_matched`

`parseBetfairTotalMatched(...)` accetta numeri finiti e stringhe dalle quali può ricavare un numero finito.

Un formato esplicitamente coperto dai test è:

```txt
EUR 74,817
```

che viene accettato come totale positivo.

La validità del totale mercato non implica la disponibilità del volume matched del singolo runner.

### Volume matched del runner

Il processing prova a ricavare il matched del runner dai dati del runner stesso e, quando disponibile, dal volume Graph associato.

Se il volume del runner non è disponibile come numero finito:

```txt
matchedTotal = null
totalMatchedOnSelection = null
```

per il caso senza fallback valido.

Il sistema non distribuisce `marketTotalMatched` fra i runner per inventare un volume individuale. Quando il confronto Money Flow richiede un volume runner non disponibile, il Money Flow viene soppresso con:

```txt
confidence = suppressed
reason = runner_matched_unavailable
```

La validità tecnica del totale mercato, la disponibilità del matched runner e l'utilizzabilità del Money Flow sono quindi contratti distinti.

## Mercato concluso

Il polling Betfair può considerare concluso il mercato soltanto quando il risultato espone esplicitamente:

```txt
event_status.hasFinished === true
```

Questo controllo avviene prima della classificazione tecnica.

Il flusso è:

```txt
hasFinished esplicito
→ lastSuccessfulScrapeAt aggiornato
→ betfairFinished = true
→ nessun calcolo della tracking key
→ nessun passaggio al gate
→ nessuna persistenza del campione conclusivo
```

Per un errore di fetch:

```txt
fetch exception
→ betfairFinished = false
→ errore tecnico runtime registrato
→ polling non viene marcato finished
```

Per un risultato tecnicamente non utilizzabile:

```txt
campione tecnico non utilizzabile
→ betfairFinished = false
→ errore tecnico runtime registrato
→ nessun passaggio al gate
→ tentativo repairOnly
→ nessun nuovo dato canonico derivato dal sample corrente
```

Errore fetch, DNS, `raw.error`, `api_error`, runner mancanti, runner non validi, `selectionId` non valido o `total_matched` non valido non equivalgono a mercato concluso.

Un weak finished hint non sostituisce `event_status.hasFinished === true`.

Un logout Graph esplicitamente riconosciuto non equivale a mercato concluso. Se il sample resta tecnicamente utilizzabile ma viene classificato come regressivo, il flusso canonico può produrre la specifica transizione `status-only` descritta più avanti.

## Invarianti del campione tecnico non utilizzabile

Per i nuovi dati derivati dal sample corrente, un campione tecnicamente non utilizzabile:

```txt
non chiama processBetfairRunnerState
non chiama rebindPendingBetfairRunnerState
non chiama commitPendingBetfairRunnerState
non chiama discardPendingBetfairRunnerState
non aggiorna il baseline marketState
non passa al gate Source Identity
non genera un nuovo commitId dal sample corrente
non prepara una nuova row history dal sample corrente
non genera un nuovo tick canonico dal sample corrente
non marca betfairFinished = true
```

Il processor evita il processing dei runner quando la classificazione tecnica fallisce.

Il backstop di persistenza evita inoltre che un risultato tecnicamente non utilizzabile venga trasformato in un nuovo commit del sample corrente.

Quando non esiste un commit pending da recuperare, la decisione di persistenza per un risultato tecnico non utilizzabile è:

```txt
action: unchanged
reason: null
```

e il risultato strutturato di commit è:

```txt
ok: true
status: unchanged
reason: null
```

Il codice `reason` resta disponibile nella classificazione e in `technicalFailure` quando il processor costruisce il risultato tecnico. Nel tracking live, `betfairRuntime.lastTechnicalErrorReason` registra invece un diagnostico con prefisso `technical_sample`: per `raw_error` e `api_error` usa il dettaglio contenuto rispettivamente in `raw.error` o `raw.api_error`, mentre per gli altri errori tecnici usa il `reason` della classificazione.

Non esiste quindi, per questo percorso, un contratto di persistenza:

```txt
skipped: true
reason: <technical reason>
```

Lo `skipped: true` appartiene ad altri rami del tracker, per esempio azioni del gate o sessioni di tracking diventate stale, e non rappresenta la shape del commit result tecnico invariato.

### RepairOnly

Il tracking di un campione tecnico non utilizzabile può chiamare la persistenza con `{ repairOnly: true }`. Questo percorso non autorizza nuovi dati dal sample corrente e non modifica il relativo runner state.

Se esiste un commit Betfair pendente, la persistenza può tentare di completarlo usando esclusivamente i dati già journalizzati; in assenza di un pending commit restituisce `unchanged`. Un esito `recovered` o una failure strutturata possono essere propagati al tracker senza passare dal gate Source Identity.

Il contratto completo di pending journal, payload, target, scritture e recovery appartiene a [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md).

Un errore isolato nelle Graph URL non rende da solo tecnicamente inutilizzabile un campione che conserva runner validi e `total_matched` valido. La qualità delle Graph URL, delle ladder e della sessione Graph appartiene a controlli successivi.

## Campione utilizzabile e persistenza canonica

La classificazione tecnica è una condizione necessaria per il processing corrente, non una garanzia di persistenza.

Nel tracking live:

```txt
sample tecnico utilizzabile
→ lastSuccessfulScrapeAt aggiornato
→ osservazione Source Identity
```

Solo l'azione:

```txt
persist-current
```

porta il tracker a chiamare la persistenza del sample corrente.

Azioni del gate come:

```txt
bootstrapped
blocked
buffered
```

non persistono il sample Betfair corrente.

Il timestamp:

```txt
betfairRuntime.lastSuccessfulScrapeAt
```

è uno stato runtime di acquisizione, non una prova di persistenza canonica. Nel normale percorso di tracking viene aggiornato dopo che il sample è stato classificato come tecnicamente utilizzabile e prima della decisione del gate; viene aggiornato anche quando il risultato espone esplicitamente `event_status.hasFinished === true`. Non dimostra quindi che sia avvenuto un commit canonico `complete` o `recovered`.

### Regressione e duplicazione

Durante il processing dei runner viene calcolato:

```txt
timelineIntegrity.accepted
timelineIntegrity.reason
timelineIntegrity.reasons
```

Una regressione del baseline viene esposta come:

```txt
timelineIntegrity.accepted = false
timelineIntegrity.reason = regressive_sample
```

Fra i motivi concreti di regressione rientrano diminuzioni materiali, per la stessa identità runner, di:

```txt
market total matched
runner matchedTotal
runner totalMatchedOnSelection
ladder traded alla stessa quota
```

Il confronto runner usa `selectionId`. Un runner con un nuovo ID non eredita automaticamente la regressione dell'identità precedente.

Il livello di persistence decision usa un vocabolario distinto:

```txt
timelineIntegrity.reason = regressive_sample
persistence result reason = regressive_tick
duplicate persistence reason = duplicate_tick
```

Quando `timelineIntegrity.accepted === false` e non è applicabile l'eccezione status-only, il risultato è:

```txt
ok: true
status: unchanged
reason: regressive_tick
```

Quando il nuovo tick è equivalente al precedente secondo il confronto canonico, il risultato è:

```txt
ok: true
status: unchanged
reason: duplicate_tick
```

Per questi rami ordinari:

```txt
nessun nuovo commitId
nessuna nuova row history
nessuna nuova timeline canonica
nessun commit del baseline proposto
```

Il confronto di regressione del tick canonico controlla anche diminuzioni materiali del totale mercato, del matched runner, del `totalMatchedOnSelection` e del traded ladder alla stessa quota.

Il confronto di duplicazione considera, oltre al mercato e ai runner identificati per `selectionId`, anche lo stato Graph rilevante.

### Conferma del baseline `marketState`

Quando il processing avviene con un `sofaEventId`, l'aggiornamento del `marketState` runner viene differito.

Per un sample che supera i controlli di regressione del runner state, il processor prepara uno stato pending. Se invece rileva una regressione, espone `timelineIntegrity.accepted = false` e non registra quel nuovo stato come pending.

Quando uno stato pending esiste, il baseline viene confermato soltanto se la persistenza restituisce:

```txt
ok = true
status = complete
```

oppure:

```txt
ok = true
status = recovered
```

In questi casi viene chiamato:

```txt
commitPendingBetfairRunnerState(...)
```

Per un sample tecnicamente utilizzabile con esito diverso da `complete` o `recovered`, il pending state viene scartato.

Nel wrapper `persistBetfairTrackingSample(...)`, `complete` e `recovered` sono gli unici status riconosciuti come commit canonici ai fini del runner state.

Gli status:

```txt
unchanged
partial
failed
```

non confermano il baseline runner corrente.

Writer non riusciti, target non corrispondenti, `commitId` non corrispondenti e risultati writer mancanti possono impedire il completamento del commit. Il dettaglio multi-documento di journal, target e ordine delle scritture appartiene ai documenti storage.

## Eccezione stretta: logout Graph `status-only`

Un sample regressivo può produrre una transizione canonica `status-only` soltanto nel caso specifico di Graph login riconosciuto dal flusso. La transizione preserva l'ultimo snapshot canonico, non adotta i valori regressivi del sample corrente e non avanza il relativo baseline `marketState`.

L'eccezione evita il rifiuto basato direttamente su `timelineIntegrity.accepted === false`, ma il tick preservato deve comunque superare i controlli canonici successivi. Non rende equivalenti al logout Graph gli errori generici di rete/API o la semplice assenza di feed e non cambia l'authority del gate Source Identity.

Le shape complete di Money Flow, Graph health e diagnostics appartengono ai rispettivi owner. Le regole di `seq`, `commitId`, history e timeline appartengono a [Timeline e history](../storage/01-timelines-and-history.md); il contratto multi-documento appartiene a [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md).

## Confini

Questo documento possiede:

```txt
classificazione tecnica del sample Betfair
shape minima necessaria dei runner
normalizzazione tecnica del total matched mercato
confine tra errore tecnico e mercato concluso
effetto del sample tecnico sul processing runner
confine repairOnly
rapporto tra validità tecnica e persistenza canonica
vocabolario regressive_sample / regressive_tick / duplicate_tick
semantica status-only pertinente al sample
distinzione tra marketState e stato runtime di acquisizione
```

Può descrivere le interazioni necessarie con Source Identity, timeline, history, journal, Graph health e Money Flow, ma non possiede i relativi contratti completi.

Non deve:

```txt
dedurre Source Identity
decidere mapping giocatori o runner oltre all'identità tecnica selectionId
dedurre strategia o segnali operativi
scrivere contratti HTTP
trattare un errore tecnico come mercato concluso
creare nuovi commit da sample tecnici non utilizzabili
mutare marketState durante repairOnly
decidere retention di cache, dump o log
documentare payload raw o dati sensibili del journal
```

Il gate Source Identity autorizza o blocca il sample live soltanto dopo che il tracker lo ha classificato come tecnicamente utilizzabile.

Un repair `repairOnly` non passa dal gate perché non autorizza nuovi business data: completa, quando possibile, un commit già journalizzato.

## Verifica

I file di test pertinenti al contratto corrente includono:

```txt
backend/src/sofa/betfair/processor/technicalSample.test.mjs
backend/src/sofa/betfair/processor/runnerProcessing.test.mjs
backend/src/sofa/betfair/processor/persistenceCommit.test.mjs
backend/src/sofa/betfair/processor/persistenceRecovery.test.mjs
backend/src/sofa/betfair/processor/runtimeOrchestration.test.mjs
backend/src/sofa/betfair/processor/canonicalTimeline.test.mjs
backend/src/sofa/betfair/timeline/state.test.mjs
backend/src/sofa/betfair/trackerUpdate/gateRouting.test.mjs
backend/src/sofa/betfair/trackerUpdate/technicalRecovery.test.mjs
backend/src/sofa/betfairFetch.test.mjs
```

Dalla cartella `backend/src`, i controlli sintattici pertinenti sono:

```txt
node --check sofa/betfair/processor.js
node --check sofa/betfair/trackerUpdate.js
node --check sofa/betfairFetch.js
node --check sofa/betfair/processor/technicalSample.js
node --check sofa/betfair/processor/runnerProcessing.js
node --check sofa/betfair/processor/persistence.js
node --check sofa/betfair/processor/persistenceDecision.js
node --check sofa/betfair/processor/persistenceDocuments.js
node --check sofa/betfair/processor/persistenceResultHelpers.js
node --check sofa/betfair/processor/persistenceCommitWorkflow.js
node --check sofa/betfair/processor/canonicalTimeline.js
node --check sofa/betfair/processor/journalRecovery.js
node --check sofa/betfair/timeline.js
node --check sofa/betfair/timeline/state.js
node --check sofa/betfair/timeline/statusOnlySnapshot.js
node --check sofa/betfair/timeline/graphHealth.js
```

I test direttamente pertinenti possono essere eseguiti con:

```txt
node sofa/betfair/processor/technicalSample.test.mjs
node sofa/betfair/processor/runnerProcessing.test.mjs
node sofa/betfair/processor/persistenceCommit.test.mjs
node sofa/betfair/processor/persistenceRecovery.test.mjs
node sofa/betfair/processor/runtimeOrchestration.test.mjs
node sofa/betfair/processor/canonicalTimeline.test.mjs
node sofa/betfair/timeline/state.test.mjs
node sofa/betfair/trackerUpdate/gateRouting.test.mjs
node sofa/betfair/trackerUpdate/technicalRecovery.test.mjs
node sofa/betfairFetch.test.mjs
```

## Documenti collegati

* [Lifecycle scraper Betfair](./01-scraper-lifecycle.md)
* [Tracking live](../sofa/01-live-tracking.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
* [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
* [Source Identity](../evidence/02-source-identity.md)
* [API Betfair](../../api/02-betfair.md)
* [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
* [Validazione e rollback](../../operations/04-validation-and-rollback.md)
