# Tracking live

## Scopo

Il tracker coordina scheduler, update SofaScore e Betfair, Source Identity Gate live e drain terminale delle operazioni asincrone durante lo shutdown backend.

Il tracker non implementa browser, persistenza file o route HTTP, ma decide se i callback di persistenza possono essere invocati e mantiene il registro process-local delle operazioni capaci di raggiungere la persistenza.

```txt
backend/src/sofa/matchTracker.js
```

## Scheduler

Il tracker mantiene una sola mappa dei match attivi.

```txt
trackedMatches
→ scheduler ogni 1 secondo
→ controllo intervalli e concorrenza
→ update SofaScore e Betfair
```

Intervalli attuali:

| Flusso    | Intervallo |
| --------- | ---------- |
| SofaScore | 5 secondi  |
| Betfair   | 6 secondi  |

SofaScore e Betfair usano flag di concorrenza distinti:

```txt
updatingSofa
updatingBetfair
```

Un nuovo aggiornamento non parte finché l'aggiornamento precedente della stessa sorgente non è terminato.

`trackMatch(...)` avvia immediatamente un primo `updateSofa(...)`; non attende il primo intervallo di 5 secondi.

Betfair non riceve un fetch esplicito nel bootstrap. Il primo tentativo passa dallo scheduler, che trova `lastBetfairUpdate = 0` alla prima iterazione utile.

### Runtime Betfair effimero

Ogni match tracciato conserva in memoria il runtime Betfair della sessione corrente:

```txt
lastScrapeAttemptAt
lastSuccessfulScrapeAt
lastTechnicalErrorAt
lastTechnicalErrorReason
```

Questi dati:

```txt
appartengono soltanto alla sessione tracker corrente
→ non entrano in timeline, history, Evidence o Source Identity
→ spariscono quando il tracker del match viene rimosso
→ non sostituiscono il timestamp del tick canonico Betfair
```

Il runtime è leggibile tramite:

```txt
getBetfairTrackingRuntime(eventId)
```

La funzione restituisce una copia sicura dei soli quattro campi runtime. Non espone il match tracker completo, dati raw, cookie, token o dettagli del browser.

## Registro delle operazioni attive

Il tracker mantiene il registro process-local:

```txt
activeTrackerOperations
```

Il registro comprende almeno:

```txt
update SofaScore iniziale avviato da trackMatch()
update SofaScore avviato dallo scheduler
update Betfair avviato dallo scheduler
```

Ogni operazione viene registrata come Promise reale prima che possa completarsi. La Promise viene rimossa dal registro sia su fulfillment sia su rejection.

Il registro:

- non conserva risultati o payload;
- non conserva errori raw;
- non modifica il risultato delle funzioni update;
- gestisce le rejection senza produrre `unhandledRejection`;
- resta indipendente da `trackedMatches` e dallo scheduler.

Di conseguenza:

```txt
trackedMatches svuotata
oppure scheduler cancellato
oppure gate rimosso
≠
operazione già avviata completata
```

La rimozione dalla mappa non autorizza il release della writer authority.

## Avvio tracking

Funzione pubblica:

```txt
trackMatch(
  sofaUrl,
  betfairUrl,
  betfairGraphUrls,
  chromeProfilePath,
  betfairMode,
  cdpUrl,
  dependencies = {}
)
```

Il tracker:

1. verifica che la terminal tracker barrier non sia attiva;
2. ricava l'event ID dall'URL SofaScore;
3. elimina eventuali match diversi già tracciati;
4. salva il contesto del match;
5. pulisce la cache Betfair se sono presenti Graph URL;
6. avvia lo scheduler;
7. coordina e registra gli update periodici.

Il parametro opzionale `dependencies` consente test deterministici tramite:

```txt
updateSofaFn
updateBetfairFn
```

Senza dipendenze iniettate, il comportamento runtime usa i normali `updateSofa` e `updateBetfair`.

Il tracking può funzionare con solo SofaScore.

`betfairUrl` e `betfairGraphUrls` possono essere vuoti.

## Registry fisico, generation e barriera

Il ruolo fisico è:

```txt
sofa_tracking
```

```txt
scheduler
→ directFetch
→ capture della generation tracking corrente
→ spawn Python registrato
→ risposta pubblica
→ completion fisica
```

`Stop` invalida la generation tramite `terminatePythonProcesses("tracking")`. Il mismatch la invalida esplicitamente prima del cleanup Betfair. Un nuovo Start successivo usa la generation corrente già aggiornata; `trackMatch(...)` non incrementa autonomamente la generation.

Una callback appartenente a una generation precedente non può avviare un nuovo figlio o produrre un risultato valido per la sessione successiva.

```txt
risposta scraper disponibile
≠
processo fisicamente terminato
```

Retry e nuovo spawn rispettano la barriera di completion fisica precedente.

Questa generation protegge il lifecycle dei figli Python. Non equivale alla terminal tracker barrier di shutdown e non sostituisce una tracking session authority end-to-end.

## Source Identity Gate

Con URL SofaScore e Betfair, ogni nuova sessione crea un gate in memoria.

```txt
collecting
→ pending
→ recording
```

Oppure:

```txt
mismatch
not-applicable
```

Senza URL Betfair il gate è `not-applicable` e SofaScore persiste normalmente.

Con URL Betfair, prima di `recording` il tracker conserva soltanto l’ultimo campione valido per fonte. Non deve creare timeline o history come workaround.

## Update SofaScore

Modulo:

```txt
backend/src/sofa/trackerUpdate.js
```

```txt
loadSofaPayload(eventId)
→ event + statistics + point-by-point
→ validazione evento
→ normalizeSnapshot
→ snapshot con pointByPoint normalizzato
→ buildLocalContext(snapshot)
→ osservazione Source Identity
→ persistenza solo quando autorizzata
```

L’update SofaScore usa esclusivamente i tre endpoint canonici:

```txt
/api/v1/event/<eventId>
/api/v1/event/<eventId>/statistics
/api/v1/event/<eventId>/point-by-point
```

Il sample osservato dal Source Identity Gate resta limitato a:

```txt
snapshot
tournamentName
dateStr
```

`localContext` non viene aggiunto al sample del gate.

Durante il bootstrap Source Identity, `matchTracker.js` passa soltanto `sofaSample.snapshot`; `persistSofaTrackingSample(...)` calcola quindi `localContext` da quello snapshot prima della persistenza canonica.

Azioni possibili del gate:

```txt
buffered
persist-current
bootstrapped
blocked
no-gate
```

| Azione            | Effetto                                         |
| ----------------- | ----------------------------------------------- |
| `buffered`        | Nessuna scrittura                               |
| `blocked`         | Nessuna scrittura                               |
| `bootstrapped`    | Il callback ha già scritto il campione iniziale |
| `persist-current` | Persiste il tick corrente                       |
| `no-gate`         | Persiste normalmente                            |

## Update Betfair

Modulo:

```txt
backend/src/sofa/betfair/trackerUpdate.js
```

Flusso:

```txt
aggiornamento lastScrapeAttemptAt
→ fetchBetfairData
→ hasFinished esplicito?
  → sì: aggiornamento successful scrape, stop polling, nessun gate e nessuna persistenza
  → no: classificazione tecnica
→ campione tecnicamente utilizzabile?
  → no: aggiornamento errore tecnico, polling attivo, nessun gate e nessuna persistenza
  → sì: aggiornamento successful scrape
        → tracking key
        → Source Identity Gate observer
        → persistenza secondo l'azione del gate
```

Regole:

* `lastScrapeAttemptAt` viene aggiornato prima del fetch.
* Una fetch rejection aggiorna soltanto il runtime tecnico: errore e reason. Il polling resta attivo.
* Un campione tecnicamente non utilizzabile aggiorna soltanto il runtime tecnico: errore e reason. Non aggiorna il baseline, non entra nel gate e non crea dati canonici.
* Solo `event_status.hasFinished === true` può fermare automaticamente il polling Betfair.
* Con `hasFinished === true`, `lastSuccessfulScrapeAt` viene aggiornato, il polling viene fermato e il campione non passa al gate né alla persistenza.
* Errore fetch, DNS, logout, `api_error`, runner mancanti o vuoti e `total_matched` non valido non fermano il tracking.
* Un campione tecnico non deve chiamare `getBetfairTrackingKey`, l'observer del gate o la persistenza.
* Un campione valido aggiorna `lastSuccessfulScrapeAt` prima della decisione del gate.
* Un campione valido resta uno scrape riuscito anche quando il gate restituisce `buffered` o `blocked`.
* Un campione valido successivo a un errore tecnico riprende il normale passaggio verso gate e persistenza.

Il bootstrap cross-source persiste nell’ordine:

```txt
SofaScore
→ Betfair
```

Il tracker non deve persistere nuovamente il tick che ha aperto `recording`.

## Mismatch

In caso di `mismatch`:

```txt
tick causale non persistito
→ stopAllMatchTrackers({ preserveGateEventId: eventId })
→ generation tracking invalidata
→ terminateActiveBetfairScrapers()
→ betfair_tracking attivo terminato
→ eventuale sofa_tracking in flight reso obsoleto
→ betfair_login preservato
→ Chrome/CDP lasciato aperto
→ gate mismatch leggibile dallo status endpoint
```

Il mismatch usa lo stop ordinario del tracker, non la terminal tracker barrier di processo. Una callback della generation invalidata non può produrre effetti per la sessione successiva. Timeline, history e conferme già esistenti non vengono cancellate.

## Stop ordinario

| Funzione                    | Effetto                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `untrackMatch(eventId)`     | Rimuove un solo match e il relativo gate; è usata dal percorso `/untrack`               |
| `stopMatchTracker(eventId)` | Ferma un match quando presente; non è invocata dalla route HTTP globale                 |
| `stopAllMatchTrackers()`    | Svuota i match, ferma lo scheduler e rimuove i gate; non attiva la barriera terminale   |
| `stopSchedulerIfEmpty()`    | Ferma l'intervallo quando non restano match                                             |

Percorso globale corrente:

```txt
POST /api/match/stop
→ stopAllMatchTrackers()
→ terminatePythonProcesses("tracking")
→ generation tracking invalidata
→ sofa_tracking e betfair_tracking terminati
→ betfair_login preservato
```

`stopAllMatchTrackers()` è idempotente. Dopo lo stop, un nuovo `trackMatch(...)` può riavviare lo scheduler e usa la generation aggiornata dal registry.

Lo stop ordinario:

```txt
non attiva terminalTrackerBarrier
→ non esegue il tracker drain di shutdown
→ non rilascia la writer authority
→ mantiene il backend attivo
→ consente un nuovo Start successivo
```

La route non chiude backend, frontend o Chrome/CDP e non cancella timeline, history o journal.

## Terminal tracker barrier e drain

Lo shutdown backend usa:

```txt
stopAndDrainAllMatchTrackers()
```

La funzione:

1. imposta sincronicamente `terminalTrackerBarrier = true`;
2. blocca nuovi `trackMatch(...)`;
3. impedisce allo scheduler di avviare nuovi update;
4. svuota `trackedMatches`;
5. ferma lo scheduler;
6. cancella i gate come lo stop globale ordinario;
7. attende con `Promise.allSettled(...)` le operazioni registrate;
8. ripete la verifica finché `activeTrackerOperations` è realmente vuoto.

Risultato positivo:

```js
{
  ok: true,
  drained: true,
  activeOperations: 0
}
```

Una singola update che si conclude con rejection non rende fallito il drain: la rejection resta gestita dal normale handler dell'operazione.

Dopo l'attivazione della barriera:

```txt
trackMatch(...)
→ null
→ nessun gate
→ nessuna entry trackedMatches
→ nessuno scheduler
→ nessuna update
```

La barriera non viene riaperta. Dopo l'inizio dello shutdown il processo è destinato a terminare.

Il server avvia il drain prima del cleanup Python, così la barriera è già attiva. Il cleanup Python può terminare scraper che stanno bloccando una catena Betfair; il server attende poi il completamento delle Promise Node e la chiusura del listener prima di rilasciare la writer authority.

Se il drain fallisce o non è verificabile, il server non rilascia l'authority e termina in modalità fail-closed.

## Normalizzazione JSON-safe SofaScore

I campi statistici opzionali vengono normalizzati dal producer:

```txt
homeTotal assente
→ null

awayTotal assente
→ null
```

`null` indica dato assente, non equivale a zero, è serializzabile in JSON ed è compatibile con il journal. Non è un fallback numerico e non modifica la semantica statistica.

Validato live:

```txt
timeline SofaScore avanzata
commit completo
seq finita
integrity no_known_partial
```

## Confini

Il tracker non deve:

* creare route HTTP;
* leggere o scrivere direttamente file JSON;
* eseguire parsing browser;
* implementare il decoder point-by-point;
* comporre direttamente `snapshot` e `localContext`; la composizione è delegata ai moduli dedicati;
* costruire componenti frontend;
* costruire Evidence o calcolare internamente Source Identity; il tracker coordina soltanto il gate live;
* modificare Source Identity, deduplicazione, timeline, history o browser lifecycle per calcolare runtime health;
* trattare un errore tecnico come mercato concluso;
* acquisire o rilasciare direttamente la writer authority.

Il frontend può fare polling delle timeline, ma non deve avviare acquisizione tramite polling read-only.

La terminal tracker barrier protegge il rilascio della persistence writer authority durante lo shutdown. Non costituisce una tracking session authority end-to-end e non chiude IMPL-006.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check sofa/matchTracker.js
node --check sofa/trackerUpdate.js
node --check sofa/betfair/trackerUpdate.js
node --check sofa/betfair/processor.js
node --check sofa/sourceIdentityGate.js

node sofa/sourceIdentityGate/lifecycle.test.mjs
node sofa/sourceIdentityGate/epochRecovery.test.mjs
node sofa/sourceIdentityGate/bootstrapFailures.test.mjs
node sofa/sourceIdentityGate/mismatchAndIsolation.test.mjs
node sofa/trackerUpdate.test.mjs
node sofa/betfair/trackerUpdate.test.mjs
node sofa/betfair/processor.test.mjs
node sofa/matchTracker.test.mjs
node sofa/pointByPoint.test.mjs
node sofa/localContext.test.mjs
node sofa/matchHistory/sofaUpdates.test.mjs
```

I test IMPL-015 pubblicati includono:

```txt
stop ordinario consente un nuovo Start
→ PASS

drain attende un update SofaScore iniziale in corso
→ PASS

rejection update non blocca il drain e non produce unhandled rejection
→ PASS

terminal tracker barrier blocca nuovi Start
→ PASS
```

Esito del runner mirato:

```txt
matchTracker: 10 passati, 0 falliti
```

Verificare inoltre:

```txt
collecting e pending
→ non scrivono timeline o history

recording
→ bootstrap SofaScore → Betfair una sola volta

mismatch
→ non persiste il tick causale
→ ferma i tracker logici e preserva il gate terminale
→ invalida la generation tracking
→ termina il betfair_tracking attivo
→ rende obsoleto l'eventuale sofa_tracking in flight
→ lascia Chrome/CDP aperto

nuovo Start dopo stop ordinario
→ crea un nuovo gate

nuovo Start dopo terminal tracker barrier
→ restituisce null
→ non avvia update

tick SofaScore
→ costruisce localContext dopo la normalizzazione
→ non inserisce localContext nel sample Source Identity

bootstrap SofaScore
→ conserva o calcola localContext prima della prima persistenza canonica

fetch rejection
→ aggiorna attempt ed errore tecnico
→ polling attivo

tre campioni tecnici consecutivi
→ polling ancora attivo
→ nessun falso finished

campione tecnico
→ zero gate
→ zero persistenza
→ baseline invariato

campione valido dopo errore
→ successful scrape più recente
→ errore tecnico non più attivo
→ gate e persistenza riprendono

hasFinished esplicito
→ successful scrape valorizzato
→ polling fermato
→ nessun gate e nessuna persistenza
```

## Documenti collegati

* [Timeline e history](../storage/01-timelines-and-history.md)
* [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
* [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
* [Validità tecnica campioni Betfair](../betfair/02-technical-sample-validity.md)
* [API Match](../../api/01-match.md)
* [API Betfair](../../api/02-betfair.md)
* [Confini del sistema](../../architecture/01-system-boundaries.md)
* [Contesto locale e point-by-point](./02-local-context-and-point-by-point.md)
