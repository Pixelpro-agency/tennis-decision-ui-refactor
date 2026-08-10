# Lifecycle scraper Betfair

## Scopo

Questo documento definisce il lifecycle dei processi figli che eseguono:

```txt
betfair_scraper.py
```

Punti principali:

```txt
backend/src/sofa/betfairFetch.js
backend/src/sofa/betfair/scraperLifecycle.js
backend/src/sofa/betfair/scraperLifecycle/runner.js
```

Il documento governa spawn, deduplicazione, raccolta output, timeout, terminazione, restore dello stato e persistenza differita durante il tracking.

La classificazione tecnica del risultato appartiene a [Validità tecnica dei campioni Betfair](./02-technical-sample-validity.md).

## Responsabilità

| Livello                    | Responsabilità                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `matchTracker.js`          | Avvia scheduler e gate, gestisce bootstrap canonico e mismatch                                                                                     |
| `betfair/trackerUpdate.js` | Richiede il campione, riconosce `event_status.hasFinished`, classifica l’utilizzabilità tecnica, aggiorna il runtime e delega a gate o persistenza |
| `betfairFetch.js`          | Facade pubblica, chiave di deduplicazione, restore da history e collegamento tra lifecycle e processor                                             |
| Lifecycle runner           | Spawn Python, deduplicazione, timeout, buffering stdout, drenaggio stderr, parsing JSON, cleanup e log strutturali sicuri                          |
| `betfair_scraper.py`       | Browser, CDP, mercato, ladder e output JSON tecnico                                                                                                |
| Processor Betfair          | Normalizzazione del risultato, validità tecnica, baseline, esito di commit strutturato, integrità timeline e persistenza                           |
| Persistenza                | History, timeline, `commitId`, journal sidecar e recovery deterministica                                                                           |
| Retention                  | Policy per cache, dump, log e cleanup                                                                                                              |

Il runner non contiene logica di validità tecnica. Dopo il parsing JSON, delega il risultato al processor tramite callback.

## Input pubblico

```txt
fetchBetfairData(url, sofaEventId, options)
```

Opzioni principali:

```txt
mode
profileDir
cdpUrl
ladderUrls
networkCapture
deferPersistence
```

| Modalità     | Comportamento                                         |
| ------------ | ----------------------------------------------------- |
| `persistent` | Avvia lo scraper con profilo browser persistente      |
| `cdp`        | Collega lo scraper a un Chrome già aperto tramite CDP |

## Registry fisico e lifecycle logico

Il backend separa ownership fisica e deduplicazione logica:

```txt
backend/src/runtime/pythonProcessRegistry.js
→ possiede il child Python registrato

lifecycle Betfair
→ deduplica richieste per scraper key URL e runtime identity
```

Ruoli distinti:

```txt
betfair_tracking
betfair_login
```

Il login non appartiene al tracking e non viene terminato da `scope=tracking`.

Flusso tracking:

```txt
tracker update
→ fetchBetfairData
→ chiave di deduplicazione
→ eventuale restore stato da history
→ spawn betfair_scraper.py registrato
→ buffering stdout per il parsing JSON e drenaggio stderr
→ delega al processor Betfair
→ esito di commit strutturato
→ risultato pubblico
→ completion fisica e cleanup logico
```

Il runner non decide mercato concluso, utilizzabilità tecnica, Source Identity Gate o persistibilità canonica. Il polling viene fermato soltanto quando `trackerUpdate.js` riceve `event_status.hasFinished === true`.

Il bridge Node/Python non registra URL complete, Graph URL complete, argomenti completi, key derivate dall’URL, stdout o stderr raw.

## Runtime identity e deduplicazione

```txt
mode=cdp
→ identity con cdpUrl canonica

mode=persistent
→ identity con profileDir sottoposto soltanto a trim
```

I valori reali non vengono esposti nella documentazione o nello snapshot pubblico.

```txt
stessa scraper key URL
+ stessa runtime identity
→ stessa promise
→ nessun secondo spawn

stessa scraper key URL
+ runtime identity incompatibile
→ scraper_runtime_conflict
→ nessun kill
→ nessun restart
→ nessun nuovo spawn
```

`scraperKey()` rimuove alcuni parametri transitori dall'URL, ma non costituisce una market authority canonica: key diverse possono indicare lo stesso mercato.

Il riuso locale non sostituisce quindi la command authority globale prevista da `IMPL-016`.

In modalità `persistent`, alias, forme relative o assolute, slash equivalenti e differenze di case su Windows non vengono ricondotti alla stessa identità fisica. 

Anche questa identità locale non va interpretata come autorità canonica del profilo.

La promise viene riutilizzata soltanto quando coincidono key, runtime identity e `trackingSessionId`. 

Una sessione diversa riceve `scraper_session_conflict` e non condivide il risultato in corso. 

Dopo il fetch, `trackerUpdate.js` verifica inoltre che la sessione sia ancora corrente prima di aggiornare runtime, gate o persistenza.

## Spawn, promise pubblica e completion fisica

```txt
spawn richiesto
→ registrazione fisica nel registry
→ evento spawn
→ spawnReady
→ processo considerato avviato
```

La promise pubblica dello scraper e la completion fisica del processo sono contratti distinti.

```txt
errore post-spawn
→ promise pubblica rigettata
→ entry logica conservata in modo conservativo
→ nessun secondo spawn
→ cleanup soltanto dopo close, exit o completion fisica
```

L'`executionToken` impedisce che il cleanup JavaScript di una completion tardiva elimini una nuova entry con la stessa key. La generation del registry protegge invece spawn e ownership dei processi Python. 

Nessuno dei due meccanismi è una tracking session authority end-to-end. 

Errori di processo, timeout, JSON assente o invalido ed exit code non zero fanno fallire la promise, ma l’entry fisica viene rimossa soltanto dopo una terminazione confermata.

## Terminazione e scope

La terminazione passa dal registry fisico:

```txt
graceful
→ SIGTERM al solo processo registrato
→ attesa bounded
→ eventuale SIGKILL del solo PID registrato
→ summary strutturata
```

La summary espone:

```txt
ok
scope
requested
graceful
forceKilled
alreadyExited
remaining
errors
```

`scope=tracking` termina `sofa_tracking` e `betfair_tracking` e preserva `betfair_login`. `scope=all`, usato dallo shutdown backend, termina anche il login-only. 

L’evento `error` non prova da solo l’uscita del processo.

Non vengono terminati Chrome/CDP, processi Python esterni o processi non presenti nel registry.

## Login-only

```txt
prima richiesta compatibile
→ started

richiesta compatibile successiva
→ already_active
→ stesso processo logico
→ nessun secondo spawn

richiesta incompatibile
→ login_runtime_conflict
→ nessun kill
→ nessun restart
→ nessun nuovo spawn
```

Il figlio usa il ruolo `betfair_login`. Resta attivo finché l’utente chiude le pagine/browser oppure fino allo shutdown backend con `scope=all`.

## Restore stato e persistenza differita

Quando non esiste ancora stato in memoria per la chiave e viene fornito `sofaEventId`, `betfairFetch.js` può ripristinare lo stato dall’ultima history disponibile.

Il restore usa solo `selectionId` normalizzati:

```txt
selectionId identico
→ continuità dello stato

nome identico
→ nessun fallback
→ nessuna continuità automatica
```

Durante il tracking, `trackerUpdate.js` richiede `deferPersistence: true`.

Il processor prepara il baseline in memoria, ma non lo conferma subito.

Il processor Betfair restituisce un esito di commit strutturato.

Solo questi esiti possono confermare lo stato runtime dei runner:

```txt
complete
recovered
```

Con questi esiti:

```txt
commit canonico riuscito o recuperato
→ commit baseline in memoria
→ stato runtime confermato
```

Duplicate e regressione ordinaria senza journal non producono nuove scritture e non confermano un nuovo stato runtime:

```txt
duplicate
regressione ordinaria
→ nessuna nuova history
→ nessuna nuova timeline
→ baseline proposto scartato
```

Un errore di persistenza o un esito non completo mantiene il baseline proposto non confermato:

```txt
partial
failed
writer non-ok
writer undefined
target errato
commitId errato
→ baseline proposto scartato
```

Un sample tecnico non valido non crea nuovi commit, row history o tick timeline. Può però tentare il repair di un journal pending tramite percorso `repairOnly`, senza mutare `marketState`.

Il dettaglio di tick, regressioni, deduplicazione, `commitId`, journal e scrittura canonica appartiene a:

[Timeline e history](../storage/01-timelines-and-history.md)

Il contratto multi-documento di journal e recovery appartiene a:

[Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)

## Persistence integrity e health

Uno stato di persistenza incompleta Betfair non è un errore dello scraper.

```txt
partial_persistence
recovery_failed
```

sono separati da:

```txt
runtime scraper
CDP
Graph health
freshness
tick stale
ladder reliability
Money Flow
```

Le API Betfair possono esporre `integrity` come stato read-only, ma questo non deve essere confuso con `health` e non conferma né invalida da solo lo stato runtime dei runner.

Le route read-only non avviano tracking o scraper Betfair, non eseguono repair, non scrivono journal e non modificano `marketState`. 

`GET /api/betfair/:eventId/latest` può però effettuare un probe diagnostico verso `<cdpUrl>/json/version`: il target CDP viene validato come loopback e la lettura è bounded. 

Read-only significa quindi assenza di mutazioni, non assenza assoluta di I/O di rete diagnostico.

## Validazione degli URL Betfair

Le route Start e login usano il validator backend-owned condiviso. 

Il runner riceve invece un URL già accettato dal chiamante: `scraperKey()` normalizza la key di deduplicazione, ma non valida protocollo e host e non deve diventare un secondo validator. 

Ogni nuovo consumer deve passare dal validator condiviso definito da `PREFLIGHT-API-003` e `DEC-020`.

## Cleanup legacy Betfair

Il cleanup legacy Betfair viene eseguito solo dopo commit canonico riuscito e rimozione journal completata.

Un fallimento del cleanup legacy resta osservabile tramite `legacyWarning`. `legacyWarning` non invalida un commit canonico già riuscito e non è un errore del commit.

## Terminazione da mismatch Source Identity

Il gate rileva il mismatch, ferma i tracker logici e invalida la generation tracking prima della terminazione Betfair.

```txt
campione Betfair valido
→ gate rileva mismatch
→ azione blocked
→ tick causale non persistito
→ stopAllMatchTrackers({ preserveGateEventId })
→ invalidatePythonGeneration("tracking")
→ terminazione del betfair_tracking attivo
→ eventuale sofa_tracking già in flight non terminato esplicitamente
→ Chrome/CDP lasciato aperto
```

Il callback di mismatch non esegue il cleanup globale `scope=tracking`: termina il ruolo Betfair attivo, ma non il processo SofaScore già in corso. 

Il gate mismatch impedisce la persistenza del campione causale. La generation Python non interrompe fisicamente una Promise JavaScript già avviata, ma gli update SofaScore e Betfair verificano ora la `trackingSessionId` corrente prima di applicare gate, runtime e persistenza: una callback della sessione precedente viene scartata anche dopo un nuovo Start.

Il residuo end-to-end di `IMPL-006` riguarda gli artefatti e le letture persistite ancora indicizzati soltanto per `eventId`, non l’assenza della session authority nel lifecycle dello scraper.

La terminazione non cancella cache, timeline, history o conferme Source Identity.

## Cache

La cache Betfair è project-owned:

```txt
backend/betfair_cache/
```

La pulizia deve restare confinata a directory dichiarate del progetto.

Non deve raggiungere:

* profili Chrome;
* cookie;
* sessioni;
* cache browser;
* file esterni al progetto;
* asset statici della pagina.

La redazione del contenuto cache appartiene al package Python Betfair. Limiti di retention, rotazione e cleanup appartengono al runbook di retention e cleanup.

## Network capture: opt-in

La network capture è attiva soltanto quando:

```txt
options.networkCapture === true
```

Per ogni altro valore, inclusi opzione assente, `false` booleano e valori non booleani, il runner aggiunge:

```txt
--no-network-capture
```

La facade conserva sia il booleano effettivo sia il valore originale di `options.networkCapture`.

Il valore originale serve a preservare la decisione storica su `--no-cache`; non viene esposto via HTTP o CLI.

### Matrice senza ladder URL

| Input originale `options.networkCapture` | Capture | `--no-network-capture` | `--no-cache` |
| ---------------------------------------- | ------: | ---------------------: | -----------: |
| Assente                                  |     Off |               Presente |     Presente |
| `false` booleano                         |     Off |               Presente |      Assente |
| `true` booleano                          |      On |                Assente |     Presente |
| Valore non booleano                      |     Off |               Presente |     Presente |

Con `ladderUrls`, `--no-cache` resta sempre presente.

Nel tracking canonico `trackerUpdate.js` passa `networkCapture: false` e `noCache: true`; `--no-cache` è quindi sempre presente anche senza Graph URL.

Le chiamate non canoniche possono adottare una policy esplicita diversa senza modificare il contratto del tracking.

La policy Node controlla soltanto gli argomenti passati dal runner. Non modifica la semantica diretta della CLI Python.

## Contratto output del processo figlio

Lo stdout viene accumulato e, alla chiusura con exit code zero, il runner cerca il primo `{` e prova a interpretare il resto come JSON. 

Lo stderr viene drenato e scartato: non è raccolto come diagnostica e non viene esposto raw.

L'accumulo stdout è limitato per default a 4 MiB. Al superamento, il runner rigetta con l'errore statico `scraper_output_too_large`, richiede la terminazione del solo child registrato e non espone il body raw nei log.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check sofa/betfairFetch.js
node --check sofa/betfair/scraperLifecycle/runner.js
node --check sofa/matchTracker.js
node --check sofa/betfair/processor.js
node --check sofa/betfair/processor/persistence.js
node --check sofa/betfair/processor/persistenceDecision.js
node --check sofa/betfair/processor/persistenceDocuments.js
node --check sofa/betfair/processor/persistenceCommitWorkflow.js

node sofa/betfair/scraperLifecycle.test.mjs
node sofa/betfair/trackerUpdate/technicalRecovery.test.mjs
node sofa/betfair/processor/persistenceCommit.test.mjs
node sofa/betfair/processor/persistenceRecovery.test.mjs
node sofa/betfair/processor/runtimeOrchestration.test.mjs
node sofa/betfairFetch.test.mjs
```

Verificare almeno:

```txt
deduplicazione per chiave
→ stessa promise e un solo spawn

cleanup dopo completion fisica
→ entry rimossa soltanto dopo close, exit o completion confermata

log strutturali sicuri
→ nessun stdout raw, stderr raw, URL completa, ladder URL completa o argomento completo dello spawn nei log

errori child process
→ messaggi statici senza body raw

terminazione esplicita
→ graceful bounded sui soli processi registrati
→ eventuale force-kill del solo PID registrato

network capture
→ attiva solo con true booleano

matrice --no-cache
→ comportamento corrente verificato con e senza ladder URL
→ tracking canonico sempre no-cache

mismatch Source Identity
→ azione blocked
→ campione causale non persistito
→ tracker fermati
→ gate terminale preservato
→ Chrome/CDP lasciato aperto

commit Betfair strutturato
→ stato runtime confermato solo con complete o recovered

duplicate o regressione senza journal
→ nessuna nuova scrittura
→ nessun nuovo stato runtime confermato

sample tecnico con journal pending
→ repairOnly consentito
→ nessun nuovo tick
→ nessuna nuova row history
→ nessuna mutazione marketState

partial_persistence o recovery_failed
→ separati da health, freshness, runtime scraper, Graph health e Money Flow

cleanup legacy fallito
→ legacyWarning osservabile
→ commit canonico riuscito non invalidato
```

La verifica completa del wiring mismatch richiede un controllo integrato del tracker: il test del lifecycle copre la terminazione dei figli, mentre il tracker collega la callback `onMismatch`.

## Documenti collegati

* [Validità tecnica campioni Betfair](./02-technical-sample-validity.md)
* [Tracking live](../sofa/01-live-tracking.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
* [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
* [Source Identity](../evidence/02-source-identity.md)
* [API Betfair](../../api/02-betfair.md)
* [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
* [Validazione e rollback](../../operations/04-validation-and-rollback.md)
* [Runtime locale](../../operations/01-local-runtime.md)
* [Retention e cleanup](../../operations/05-retention-and-cleanup.md)
