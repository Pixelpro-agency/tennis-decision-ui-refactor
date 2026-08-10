# Tracking live

## Scopo

Il tracking live coordina aggiornamenti SofaScore e Betfair, Source Identity Gate, processi Python e persistenza canonica. Il suo owner principale è `backend/src/sofa/matchTracker.js`; le route Start e Stop sono in `backend/src/routes/match/trackingResponses.js`.

## Autorità di sessione

Ogni Start valido crea un `trackingSessionId` monotono. L’autorità di una callback richiede contemporaneamente:

- appartenenza dell’evento a `trackedMatches`;
- uguaglianza del `trackingSessionId` catturato con quello corrente;
- generation Python ancora valida;
- sessione Source Identity Gate corrispondente.

Stop, nuovo Start dello stesso evento e cambio evento revocano l’autorità precedente. Gli update SofaScore e Betfair ricontrollano la sessione dopo l’I/O e immediatamente prima di osservazione e persistenza. Una callback stale restituisce `stale_tracking_session` e non scrive.

`bufferGeneration` appartiene al lifecycle interno del Source Identity Gate e non sostituisce `trackingSessionId` o la generation dei processi Python.

## Start

La route valida URL SofaScore, runtime Betfair e CDP prima di chiamare `trackMatch()`. Il successo HTTP è ammesso soltanto se il tracker restituisce l’evento attivato.

```text
trackMatch accettato
→ HTTP 200
→ ok=true
→ trackingSessionId

trackMatch rifiutato
→ HTTP 409
→ ok=false
→ code=tracking_start_rejected
```

Un nuovo Start elimina gli altri tracker logici e i gate precedenti prima di creare la nuova sessione.

## Scheduler

Lo scheduler controlla ogni secondo se una sorgente può ripartire. Le soglie sono:

```text
SofaScore: 5 secondi
Betfair:   6 secondi
```

Sono ritardi minimi dalla conclusione dell’update precedente, non una periodicità start-to-start garantita. Finché `updatingSofa` o `updatingBetfair` è vero non parte un secondo update della stessa sorgente.

Occorre distinguere:

- scheduling dell’operazione;
- tentativo di scrape;
- scrape riuscito;
- tick canonico prodotto;
- commit completato.

I timestamp runtime non sono intercambiabili con il timestamp del dato o del commit.

## Source Identity e persistenza

Durante il bootstrap, i campioni delle due sorgenti restano nel gate. Solo una decisione `persist-current` autorizza un nuovo commit ordinario. `bootstrapped`, `buffered`, `blocked` e `no-gate` non producono un nuovo tick canonico.

Un campione Betfair tecnicamente inutilizzabile non passa dal gate e non genera un nuovo sample-derived tick. Può tuttavia invocare la persistenza con `repairOnly:true` per completare un commit precedente già registrato. Un recupero viene propagato; una failure di repair resta failure.

## Finished

Il polling Betfair termina soltanto con `event_status.hasFinished === true`. Il producer Python riserva questo valore ai marker strutturali authoritative. `weakFinishedHint=true` resta diagnostico e non imposta `betfairFinished`.

## Mismatch

Un mismatch Source Identity:

1. ferma tutti i tracker logici preservando il gate mismatch per la diagnosi;
2. invalida la generation Python `tracking`;
3. termina gli scraper Betfair attivi;
4. termina tutti i processi Python owned dello scope `tracking`, inclusi i child SofaScore;
5. preserva processi `betfair_login` e Chrome/CDP.

Entrambi i cleanup vengono tentati anche se uno fallisce. Il risultato è bounded e rende osservabile l’eventuale incompletezza fisica.

## Stop

Lo Stop ordinario separa:

- stop logico dei tracker;
- cleanup fisico dei processi owned nello scope `tracking`.

La risposta resta bounded con HTTP 200, ma `body.ok` è vero soltanto se lo stop logico riesce, il cleanup fisico dichiara `ok=true` e `remaining=0`. `stopped` descrive il solo stop logico. Il summary `pythonCleanup` conserva contatori e codici statici.

Lo Stop non termina login-only, browser Chrome o endpoint CDP.

## Diagnostica Betfair runtime

Gli eventi del tracker usano il runtime logger strutturato. URL, profili, token e detail remoti non vengono inseriti nei campi pubblici.

`lastTechnicalErrorReason` è bounded e redatto. Le failure di processo usano codici statici come `fetch_failed`; i campioni JSON conservano soltanto detail già redatti e troncati. `/latest` può esporre lo stato tecnico, non segreti o path locali.

## Terminal barrier

Durante lo shutdown, `stopAndDrainAllMatchTrackers()` impedisce nuovi update, revoca i tracker e attende tutte le operazioni registrate prima del rilascio dell’autorità di scrittura. La terminal barrier completa l’autorità di sessione ma non sostituisce i controlli per callback stale.

## Riferimenti implementativi

| Responsabilità                   | Implementazione                              |
| -------------------------------- | -------------------------------------------- |
| tracker e registry               | `backend/src/sofa/matchTracker.js`           |
| ciclo update SofaScore           | `backend/src/sofa/trackerUpdate/`            |
| update e Source Identity routing | `backend/src/sofa/trackerUpdate.js`          |
| persistenza SofaScore            | `backend/src/sofa/matchHistory/sofaUpdates/` |
| processor Betfair                | `backend/src/sofa/betfair/processor/`        |
| terminal barrier                 | tracker e shutdown backend                   |

### Lifecycle della sessione

```text
POST /track
→ validazione input e session authority
→ creazione tracker univoco per eventId
→ scheduler SofaScore
→ osservazione Source Identity
→ gate recording
→ update SofaScore canonico
→ eventuale ciclo Betfair
→ finished/mismatch/stop
→ terminal barrier
→ rimozione registry
```

### Matrice del gate

| Stato Source Identity | SofaScore               | Betfair                    | Persistenza cross-source |
| --------------------- | ----------------------- | -------------------------- | ------------------------ |
| observing             | acquisizione consentita | secondo policy             | bloccata/degradata       |
| confirmation required | continua osservazione   | nessuna falsa associazione | bloccata                 |
| confirmed/recording   | commit autorizzato      | epoch attiva               | consentita con integrity |
| mismatch              | stop terminale          | terminazione scoped        | vietata                  |

### Autorità e idempotenza

Il registry backend è authority della sessione attiva. Chiamate duplicate non creano scheduler paralleli; Stop e shutdown condividono una barriera terminale che attende timer, update in-flight e processi Python posseduti.

```text
stop requested
→ impedire nuovi tick
→ attendere update in-flight
→ terminare child posseduti
→ completare/lasciare osservabile la persistenza
→ rimuovere tracker
```

La chiusura dell'evento e il mismatch non vengono trattati come semplici errori di polling. Producono una transizione terminale con reason strutturata.

### Failure model

| Failure              | Comportamento                                          |
| -------------------- | ------------------------------------------------------ |
| fetch SofaScore      | retry bounded, nessun documento sintetico              |
| gate non autorizzato | nessun commit cross-source                             |
| commit partial       | integrity osservabile, niente promotion                |
| child Betfair attivo | terminazione scoped alla sessione                      |
| drain timeout        | failure esplicita, niente release authority anticipata |

## Verifica automatica

```powershell
node backend/src/routes/match/trackingResponses.test.mjs
node backend/src/sofa/matchTracker.test.mjs
node backend/src/sofa/matchTracker.lifecycle.test.mjs
node backend/src/sofa/trackerUpdate/gateRouting.test.mjs
node backend/src/sofa/betfair/trackerUpdate/gateRouting.test.mjs
node backend/src/sofa/betfair/trackerUpdate/technicalRecovery.test.mjs
node backend/src/sofa/betfair/trackerUpdate/runtimeHealth.test.mjs
```

La verifica automatica copre Start rifiutato, Stop parziale, mismatch, event switch, callback stale, `repairOnly`, redazione, finished authoritative, weak hint e routing del gate. Le osservazioni live appartengono agli artefatti in `docs/validations/` e non sostituiscono questi test.

## Documenti collegati

- [Scraper Betfair](../python/03-betfair-scraper.md)
- [Validazione Graph URL](../python/04-betfair-graph-url-validation.md)
- [Contesto locale e point-by-point](./02-local-context-and-point-by-point.md)
- [Controllo operativo del tracking](../../operations/02-live-tracking-control.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
