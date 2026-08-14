# Tracking live

## Scopo

Il tracking live coordina scheduler, aggiornamenti SofaScore e Betfair, Source Identity Gate, processi Python owned e accesso alla persistenza canonica. Il coordinatore principale è `backend/src/sofa/matchTracker.js`; i contratti pubblici di Start, Untrack e Stop sono costruiti in `backend/src/routes/match/trackingResponses.js`.

Il tracker non possiede browser, parsing degli scraper, algoritmo Source Identity, writer o file storage, Evidence, point-by-point e frontend. Coordina quando gli update possono partire e quando un campione può raggiungere il relativo percorso di persistenza.

## Stato process-local

Il tracker mantiene due registri distinti:

```text
trackedMatches
→ sessioni logiche attive e relativo stato dello scheduler

activeTrackerOperations
→ Promise Node già avviate che possono ancora raggiungere la persistenza
```

Svuotare `trackedMatches`, fermare lo scheduler o rimuovere un gate non implica che un’operazione già avviata sia terminata. Il registro delle operazioni attive serve al drain terminale dello shutdown; non conserva payload o risultati e rimuove ogni Promise sia su fulfillment sia su rejection.

## Autorità della sessione

Ogni Start accettato crea un `trackingSessionId` process-local monotono nel formato `tracking-<n>`. Gli update catturano la sessione corrente e la ricontrollano:

- dopo l’I/O;
- prima dell’osservazione del gate;
- immediatamente prima della persistenza ordinaria.

L’autorità applicativa richiede che `trackedMatches` contenga ancora lo stesso `eventId` con lo stesso `trackingSessionId`. Il gate riceve a sua volta quel valore e rifiuta una sessione diversa con `stale_tracking_session`. Una callback riconosciuta come stale restituisce un risultato skipped e non effettua una nuova scrittura ordinaria.

La generation Python dello scope `tracking` protegge invece spawn e lifecycle fisico dei processi owned. Stop e mismatch la invalidano attraverso il registry Python. Non è equivalente al `trackingSessionId`, al `bufferGeneration` interno del gate o alla terminal tracker barrier.

## Start

La route Start:

1. richiede un URL SofaScore dal quale sia ricavabile l’event ID;
2. valida l’URL Betfair, se presente;
3. normalizza la modalità a `persistent` oppure `cdp`;
4. in modalità CDP richiede e valida la base URL CDP;
5. verifica che non esista uno scraper Betfair attivo con runtime incompatibile;
6. chiama `trackMatch(...)` e considera riuscito lo Start soltanto se il tracker restituisce l’event ID attivato.

```text
trackMatch accettato
→ HTTP 200
→ { ok: true, eventId, trackingSessionId }

trackMatch rifiutato
→ HTTP 409
→ { ok: false, eventId, code: "tracking_start_rejected" }
```

`trackMatch(...)` rifiuta lo Start se la barriera terminale è già attiva o se l’event ID non è valido. In caso di accettazione:

```text
event switch
→ rimozione degli altri tracker logici
→ pulizia di tutti i gate precedenti
→ nuova sessione Source Identity
→ nuova entry trackedMatches
→ avvio scheduler
→ primo update SofaScore immediato
```

Se sono presenti Graph URL viene pulita la cache Betfair prima della creazione della nuova entry. Il primo tentativo Betfair non è eseguito direttamente dal bootstrap: passa dalla prima iterazione utile dello scheduler.

Il tracking può operare con il solo SofaScore. Senza URL Betfair il gate è `not-applicable` e i campioni SofaScore validi seguono la persistenza ordinaria.

## Scheduler

Lo scheduler gira ogni secondo e usa flag di concorrenza separati:

| Sorgente  | Soglia minima dopo la completion precedente | Flag in-flight    |
| --------- | ------------------------------------------: | ----------------- |
| SofaScore | 5 secondi                                   | `updatingSofa`    |
| Betfair   | 6 secondi                                   | `updatingBetfair` |

Le soglie sono misurate da quando l’update precedente termina e aggiorna `lastSofaUpdate` o `lastBetfairUpdate`; non garantiscono una periodicità start-to-start. Un secondo update della stessa sorgente non parte mentre il relativo flag è attivo.

Occorre distinguere:

```text
scheduler eleggibile
→ update avviato
→ tentativo di scrape
→ acquisizione riuscita
→ campione canonico utilizzabile
→ decisione del gate
→ commit completo, recovery o failure
```

I timestamp dello scheduler e del runtime Betfair non sostituiscono il timestamp del dato canonico o del commit.

## Update SofaScore

Owner dell’update: `backend/src/sofa/trackerUpdate.js`.

```text
loadSofaPayload(eventId)
→ event + statistics + point-by-point
→ validazione evento
→ normalizeSnapshot
→ buildLocalContext(snapshot)
→ osservazione Source Identity
→ persistenza soltanto se autorizzata
```

Il sample consegnato al gate contiene `snapshot`, `tournamentName` e `dateStr`; `localContext` viaggia separatamente come dato opaco destinato all’eventuale persistenza bootstrap.

| Azione del gate   | Effetto dell’update SofaScore                                                            |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `persist-current` | esegue la persistenza ordinaria del campione corrente                                    |
| `bootstrapped`    | nessuna seconda scrittura: il callback di apertura recording ha già gestito il bootstrap |
| `buffered`        | nessuna scrittura                                                                        |
| `blocked`         | nessuna scrittura                                                                        |

Quando non scrive, l’update restituisce comunque un envelope `sofa_commit` valido con stato `unchanged`, `commitId: null` e warning `source_identity_gate:<azione>`. Il tracker normalizza inoltre risultati di persistenza non conformi in una failure `persistence_incomplete`; non promuove un esito ambiguo a successo.

## Update Betfair e runtime effimero

Owner dell’update: `backend/src/sofa/betfair/trackerUpdate.js`.

Ogni sessione tracciata conserva in memoria:

```text
lastScrapeAttemptAt
lastSuccessfulScrapeAt
lastTechnicalErrorAt
lastTechnicalErrorReason
```

Questi campi sono effimeri, scompaiono quando la entry del match viene rimossa e sono leggibili tramite `getBetfairTrackingRuntime(eventId)` come copia dei soli quattro valori. Non entrano in timeline, history, Source Identity o Evidence e non sostituiscono la freshness del tick canonico. Possono essere consumati dagli endpoint di health tramite gli owner dedicati.

Flusso dell’update:

```text
lastScrapeAttemptAt aggiornato
→ fetchBetfairData(..., deferPersistence: true)
→ controllo sessione dopo l’I/O
→ event_status.hasFinished === true?
   → sì: successful scrape, betfairFinished=true, nessun gate, nessuna persistenza
   → no: classificazione tecnica
→ campione utilizzabile?
   → no: errore tecnico, polling attivo, nessun gate
          → tentativo repairOnly sul journal preesistente
   → sì: successful scrape
          → osservazione del gate
          → persistenza soltanto su persist-current
```

Una fetch rejection aggiorna la diagnostica tecnica, lascia `betfairFinished=false` e non chiama key resolver, gate o persistenza. Un campione ricevuto ma tecnicamente inutilizzabile non entra nel gate e non genera un nuovo tick derivato dal sample; chiama però `persistBetfairTrackingSample(..., { repairOnly: true })` per tentare di completare un commit precedente. Solo uno stato `recovered` viene propagato come recovery; una risposta `ok:false` resta failure, mentre l’assenza di recovery non viene promossa a nuovo dato.

Un campione valido aggiorna `lastSuccessfulScrapeAt` prima della decisione del gate. `bootstrapped`, `buffered` e `blocked` non producono una seconda persistenza; `persist-current` invoca il percorso canonico Betfair.

## Source Identity Gate e bootstrap

Il gate possiede valutazione, conferma manuale e lifecycle Source Identity. Il tracker ne possiede soltanto l’integrazione nella sessione live.

Con entrambe le sorgenti, il lifecycle può attraversare:

```text
collecting → recording
     ↓           ↑
   pending ──────┘

collecting/pending → mismatch
```

Senza Betfair la sessione è `not-applicable`. Prima di `recording`, i campioni validi sono conservati dal gate e non vengono scritti come workaround.

Quando il gate apre `recording`, il callback bootstrap persiste in ordine:

```text
SofaScore
→ soltanto se il commit SofaScore è valido e ok
→ Betfair
```

Il bootstrap SofaScore include `localContext` già calcolato dall’update. Una failure o un envelope SofaScore non valido impedisce il bootstrap Betfair. Il tick che apre `recording` restituisce `bootstrapped` e non viene persistito una seconda volta dall’update chiamante.

| Fase/azione                                    | Acquisizione                       | Nuovo commit ordinario          |
| ---------------------------------------------- | ---------------------------------- | ------------------------------- |
| `collecting` / `buffered`                      | continua                           | no                              |
| `pending` / `buffered`                         | continua                           | no                              |
| apertura `recording` / `bootstrapped`          | continua                           | eseguito dal callback bootstrap |
| `recording` / `persist-current`                | continua                           | sì                              |
| `mismatch` / `blocked`                         | transizione terminale del tracking | no                              |
| `not-applicable` / `persist-current` SofaScore | continua                           | sì                              |

## Fine match Betfair

L’auto-stop del polling Betfair dipende esclusivamente da:

```text
result.event_status.hasFinished === true
```

In quel caso l’update registra lo scrape come riuscito, imposta `betfairFinished=true` e non inoltra il campione al gate o alla persistenza. Errori di fetch, logout, `api_error`, runner mancanti o vuoti e `total_matched` non valido non vengono trattati come fine evento. Eventuali hint deboli prodotti dallo scraper restano diagnostici e non acquisiscono autorità nel tracker.

## Mismatch

Il callback di mismatch avvia questa sequenza:

```text
tick causale non persistito
→ stopAllMatchTrackers({ preserveGateEventId: eventId })
→ generation Python tracking invalidata
→ terminateActiveBetfairScrapers()
→ terminatePythonProcesses("tracking")
```

Lo stop logico preserva soltanto il gate mismatch dell’evento, così lo status resta consultabile. I due cleanup fisici vengono entrambi tentati tramite `Promise.allSettled(...)`, anche se uno fallisce; il risultato aggregato espone `ok` e i relativi summary bounded.

Il cleanup scoped termina i processi owned `sofa_tracking` e `betfair_tracking`, ma preserva `betfair_login` e non chiude Chrome/CDP. Il mismatch non cancella timeline, history, journal o conferme già persistite e non attiva la barriera terminale irreversibile del processo backend.

## Stop ordinario

| Funzione                        | Effetto                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `untrackMatch(eventId)`         | rimuove un evento e il relativo gate, quindi ferma lo scheduler se la mappa è vuota                  |
| `stopMatchTracker(eventId)`     | rimuove un evento esistente e restituisce l’esito logico; non è il percorso della route Stop globale |
| `stopAllMatchTrackers(options)` | svuota i tracker, ferma lo scheduler e rimuove i gate, salvo quello esplicitamente preservato        |

La route globale esegue:

```text
POST /api/match/stop
→ stopAllMatchTrackers()
→ terminatePythonProcesses("tracking")
→ attesa del summary di cleanup
→ HTTP 200 bounded
```

La risposta distingue lo stop logico dal cleanup fisico:

- `stopped` descrive il successo di `stopAllMatchTrackers()`;
- `pythonCleanup` descrive processi richiesti, terminazioni, residui ed errori statici;
- `ok` è vero soltanto se lo stop logico riesce, `pythonCleanup.ok === true` e `remaining === 0`.

Lo Stop ordinario non attiva `terminalTrackerBarrier`, non esegue il drain delle Promise Node, non rilascia la writer authority e consente un nuovo Start. Non termina processi `betfair_login`, browser Chrome, CDP, backend o frontend e non cancella dati persistiti.

## Shutdown e terminal drain

Lo shutdown backend usa `stopAndDrainAllMatchTrackers()`:

1. imposta sincronicamente `terminalTrackerBarrier=true`;
2. blocca nuovi Start e nuovi update dello scheduler;
3. applica lo stop globale a tracker e gate;
4. attende tutte le Promise presenti in `activeTrackerOperations`;
5. ripete la verifica finché il registro è vuoto.

Risultato positivo:

```js
{
  ok: true,
  drained: true,
  activeOperations: 0
}
```

Una rejection di un update è assorbita dal normale handler e non impedisce di verificare il drain. La barriera non viene riaperta: appartiene esclusivamente alla terminazione del processo.

Nel server, tracker drain e cleanup Python vengono avviati prima del rilascio della writer authority. Il rilascio avviene soltanto dopo drain verificato (`ok`, `drained` e zero operazioni attive) e chiusura del listener; altrimenti l’authority resta trattenuta in modalità fail-closed.

## Diagnostica e confini pubblici

Gli eventi Start, Stop, update e mismatch usano il logger runtime strutturato. Le route non inseriscono URL Betfair, profili locali o dettagli remoti nei campi pubblici. `lastTechnicalErrorReason` è redatto e bounded; le failure di cleanup usano codici statici come `cleanup_failed`.

Il tracking coordina i sottosistemi, ma non deve:

- leggere o scrivere direttamente file JSON;
- acquisire o rilasciare direttamente la writer authority;
- implementare browser o parser Python;
- calcolare Source Identity internamente;
- costruire Evidence o componenti frontend;
- implementare la normalizzazione point-by-point o `localContext`;
- usare errori tecnici Betfair come prova di fine match;
- trattare polling read-only del frontend come meccanismo di acquisizione.

## Riferimenti implementativi

| Responsabilità                                  | Implementazione                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| registry sessioni, scheduler, bootstrap e drain | `backend/src/sofa/matchTracker.js`                                                |
| contratti Start, Untrack e Stop                 | `backend/src/routes/match/trackingResponses.js`                                   |
| update e persistenza SofaScore                  | `backend/src/sofa/trackerUpdate.js`                                               |
| lifecycle Source Identity                       | `backend/src/sofa/sourceIdentityGate.js` e `backend/src/sofa/sourceIdentityGate/` |
| update Betfair                                  | `backend/src/sofa/betfair/trackerUpdate.js`                                       |
| classificazione e processor Betfair             | `backend/src/sofa/betfair/processor.js` e `backend/src/sofa/betfair/processor/`   |
| acquisizione e persistenza Betfair              | `backend/src/sofa/betfairFetch.js`                                                |
| registry e generation Python                    | `backend/src/runtime/pythonProcessRegistry.js`                                    |
| shutdown e writer authority release             | `backend/src/server.js`                                                           |

## Verifica automatica

Dalla root del repository:

```powershell
node backend/src/routes/match/trackingResponses.test.mjs
node backend/src/sofa/matchTracker.test.mjs
node backend/src/sofa/matchTracker.lifecycle.test.mjs
node backend/src/sofa/sourceIdentityGate/lifecycle.test.mjs
node backend/src/sofa/trackerUpdate/gateRouting.test.mjs
node backend/src/sofa/betfair/trackerUpdate/gateRouting.test.mjs
node backend/src/sofa/betfair/trackerUpdate/technicalRecovery.test.mjs
node backend/src/sofa/betfair/trackerUpdate/runtimeHealth.test.mjs
```

Queste suite verificano i contratti Start/Stop, il nuovo Start dopo Stop, il drain delle operazioni in-flight, il blocco terminale dei nuovi Start, il cleanup mismatch, il lifecycle del gate, il routing senza doppia persistenza, `repairOnly` e il runtime tecnico Betfair. Gli artefatti live in `docs/validations/` conservano osservazioni storiche con una provenance propria e non sostituiscono la verifica del codice corrente.

## Documenti collegati

- [Scraper Betfair](../python/03-betfair-scraper.md)
- [Validazione Graph URL](../python/04-betfair-graph-url-validation.md)
- [Contesto locale e point-by-point](./02-local-context-and-point-by-point.md)
- [Controllo operativo del tracking](../../operations/02-live-tracking-control.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
