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

| Livello                                       | Responsabilità                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `matchTracker.js`                             | Avvia scheduler e Source Identity Gate, assegna la tracking session, gestisce bootstrap, stop e mismatch                                           |
| `betfair/trackerUpdate.js`                    | Richiede il campione, riconosce `event_status.hasFinished`, classifica l’utilizzabilità tecnica, aggiorna il runtime e delega a gate o persistenza |
| `betfairFetch.js`                             | Facade pubblica, chiave di deduplicazione, restore da history e collegamento tra lifecycle e processor                                             |
| Lifecycle runner                              | Spawn Python, deduplicazione, timeout, buffering stdout, drenaggio stderr, parsing JSON, cleanup e log strutturali sicuri                          |
| `betfair_scraper.py` / package Python Betfair | Browser, CDP, mercato, ladder e output JSON tecnico                                                                                                |
| Processor Betfair                             | Normalizzazione del risultato, stato runner pending/confermato e delega al contratto di persistenza                                                |
| Persistenza                                   | History, timeline, `commitId`, journal sidecar e recovery deterministica; i dettagli appartengono agli owner storage                               |
| Retention                                     | Policy per cache, dump, log e cleanup; i dettagli appartengono al runbook dedicato                                                                 |

Il runner non contiene logica di validità tecnica. Dopo il parsing JSON delega il risultato al processor tramite callback.

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
noCache
trackingSessionId
deferPersistence
```

| Modalità     | Comportamento                                         |
| ------------ | ----------------------------------------------------- |
| `persistent` | Avvia lo scraper con profilo browser persistente      |
| `cdp`        | Collega lo scraper a un Chrome già aperto tramite CDP |

In modalità `cdp`, `cdpUrl` viene classificata prima dell’avvio e deve risolvere a un endpoint HTTP loopback valido. In modalità `persistent`, `profileDir` viene trattato come stringa e normalizzato soltanto con `trim()`.

## Registry fisico e lifecycle logico

Il backend separa ownership fisica e deduplicazione logica:

```txt
backend/src/runtime/pythonProcessRegistry.js
→ possiede i child Python registrati

lifecycle Betfair
→ deduplica richieste per scraper key URL, runtime identity e tracking session
```

Ruoli fisici distinti:

```txt
sofa_tracking
betfair_tracking
betfair_login
```

Il login non appartiene al tracking ordinario: `scope=tracking` comprende `sofa_tracking` e `betfair_tracking`, ma preserva `betfair_login`.

Flusso tracking Betfair:

```txt
tracker update
→ fetchBetfairData
→ scraperKey(url)
→ eventuale restore stato da history
→ fetchScraperLifecycle
→ spawn betfair_scraper.py con ruolo betfair_tracking
→ buffering stdout per il parsing JSON e drenaggio stderr
→ delega al processor Betfair
→ risultato processato
→ eventuale gate/persistenza nel tracker
→ completion fisica e cleanup logico
```

Il runner non decide mercato concluso, utilizzabilità tecnica, Source Identity Gate o persistibilità canonica. Nel tracking, `trackerUpdate.js` considera concluso Betfair soltanto quando riceve:

```txt
event_status.hasFinished === true
```

Gli errori tecnici non impostano `betfairFinished=true`.

Il bridge Node/Python non registra URL complete, Graph URL complete, argomenti completi dello spawn, key derivate dall’URL, stdout raw o stderr raw.

## Runtime identity e deduplicazione

La runtime identity è costruita nel runner:

```txt
mode=cdp
→ { mode: "cdp", cdpUrl: <CDP canonica> }

mode=persistent
→ { mode: "persistent", profileDir: <trim soltanto> }
```

Per la modalità CDP, la normalizzazione elimina slash finali e accetta soltanto endpoint HTTP loopback con porta valida e senza credenziali, query o fragment.

Per la modalità Persistent, alias, forme relative o assolute, slash equivalenti e differenze di case su Windows non vengono ricondotti automaticamente alla stessa identità fisica.

La chiave logica è ottenuta da:

```txt
scraperKey(url)
```

`scraperKey()` rimuove dall’URL alcuni parametri transitori:

```txt
loginStatus
loginstatus
ott
m
ref
pid
```

Non valida protocollo o host e non costituisce una market authority canonica: due key diverse possono ancora riferirsi allo stesso mercato.

Contratto di riuso:

```txt
stessa scraper key URL
+ stessa runtime identity
+ stesso trackingSessionId
→ stessa promise
→ nessun secondo spawn
```

Con runtime incompatibile:

```txt
stessa scraper key URL
+ runtime identity diversa
→ scraper_runtime_conflict
→ nessun kill
→ nessun restart
→ nessun nuovo spawn
```

Con stessa key e stessa runtime identity ma sessione diversa:

```txt
trackingSessionId diverso
→ scraper_session_conflict
→ promise attiva non condivisa
→ nessun nuovo spawn
```

Dopo il fetch, `trackerUpdate.js` verifica inoltre che la tracking session sia ancora corrente prima di aggiornare runtime, gate o persistenza.

## Spawn, promise pubblica e completion fisica

Lo spawn passa dal registry Python condiviso:

```txt
captureGeneration("tracking")
→ spawnOwnedPython(role=betfair_tracking)
→ registrazione fisica
→ evento spawn
→ spawnReady
→ processo in stato running
```

La promise pubblica dello scraper e la completion fisica del processo sono contratti distinti.

Un errore sincrono di spawn rigetta la richiesta e non lascia una entry logica avvelenata. Dopo uno spawn fisico riuscito, invece, la chiusura logica resta conservativa:

```txt
errore post-spawn / timeout / terminazione richiesta
→ promise pubblica rigettata
→ il processo può essere ancora fisicamente presente
→ nessun secondo spawn sulla stessa entry finché la completion fisica non è confermata
```

Il cleanup logico avviene tramite `handle.completion` quando disponibile; in fallback viene agganciato a `close` e `exit`.

L’`executionToken` impedisce che il cleanup JavaScript di una completion tardiva elimini una nuova entry con la stessa key. La generation del registry protegge invece spawn e ownership dei processi Python rispetto alle invalidazioni del relativo scope.

Questi meccanismi non sostituiscono `trackingSessionId`: la session authority applicativa viene verificata separatamente dai tracker SofaScore e Betfair prima di produrre nuovi effetti.

Errori di processo, timeout, JSON assente o invalido, overflow dello stdout ed exit code non zero fanno fallire la promise pubblica. L’entry fisica viene rimossa soltanto dopo una completion confermata dal registry/processo.

## Timeout e terminazione del singolo scraper

Il runner usa un timeout Node di default pari a:

```txt
135000 ms
```

Al timeout:

```txt
promise → scraper_timeout
terminateExecution(executionId, ownerToken)
→ terminazione del solo child registrato
```

La CLI Python applica inoltre al normale `scrape_betfair()` un timeout interno di:

```txt
120 s
```

che produce un risultato tecnico con:

```txt
error: "scraper_timeout"
```

Il lifecycle Node e il timeout interno Python restano quindi due livelli distinti.

## Terminazione e scope

La terminazione fisica passa dal registry:

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

Scope disponibili nel registry:

```txt
tracking
→ sofa_tracking + betfair_tracking

login
→ betfair_login

all
→ sofa_tracking + betfair_tracking + betfair_login
```

`terminateActiveScraperLifecycle()` usa invece una terminazione mirata al solo ruolo `betfair_tracking`, con summary etichettata `scope=tracking` e senza invalidare nuovamente la generation.

L’evento `error` del processo non prova da solo l’uscita fisica dopo che lo spawn è avvenuto. Il registry attende `close`, `exit` o uno stato di uscita osservabile per confermare la completion.

Non vengono terminati Chrome/CDP, processi Python esterni o processi non presenti nel registry.

## Stop manuale del tracking

La route di stop esegue due operazioni distinte:

```txt
stopAllMatchTrackers()
→ ferma scheduler e tracker logici
→ pulisce i gate

terminatePythonProcesses("tracking")
→ invalida lo scope tracking
→ termina sofa_tracking e betfair_tracking registrati
→ preserva betfair_login
```

La risposta espone la summary `pythonCleanup`; il risultato complessivo è `ok` soltanto se lo stop logico riesce e la terminazione fisica non lascia processi `remaining`.

## Login-only

Il login usa un lifecycle separato da quello dello scraper tracking.

Runtime identity:

```txt
mode=cdp
→ cdpUrl canonica

mode=persistent
→ profileDir con trim soltanto
```

Contratto di apertura:

```txt
prima richiesta compatibile
→ started

richiesta compatibile successiva
→ attende l'eventuale start in corso
→ already_active
→ stesso processo logico
→ nessun secondo spawn

richiesta incompatibile
→ login_runtime_conflict
→ nessun kill
→ nessun restart
→ nessun nuovo spawn
```

Il figlio usa il ruolo:

```txt
betfair_login
```

La CLI viene avviata con `--login-only`. `open_login_window()` resta in esecuzione finché il contesto browser mantiene pagine aperte; in modalità Persistent chiude il contesto al termine, mentre in CDP non possiede il browser esterno.

Lo stop ordinario del tracking non include `betfair_login`. Lo shutdown che usa `scope=all` può invece terminare anche il processo login registrato.

## Restore stato e persistenza differita

Quando non esiste ancora stato in memoria per la key e viene fornito `sofaEventId`, `betfairFetch.js` tenta il restore dall’ultima history disponibile.

Il restore scorre la history dal record più recente verso il più vecchio e accetta una riga con runner Betfair disponibili.

L’associazione tra runner usa soltanto `selectionId` normalizzati:

```txt
selectionId identico
→ continuità dello stato

nome identico ma selectionId diverso o assente
→ nessun fallback
→ nessuna continuità automatica
```

Durante il tracking, `trackerUpdate.js` passa:

```txt
deferPersistence: true
```

Il processor può quindi preparare lo stato runner senza confermarlo immediatamente in `marketState`. La decisione di persistenza viene applicata successivamente dal tracker, dopo il Source Identity Gate.

Per il runtime dei runner, `betfairFetch.js` considera canonici soltanto risultati di persistenza con:

```txt
ok === true
status === "complete" | "recovered"
```

Con questi esiti:

```txt
commit canonico riuscito o recuperato
→ commit del pending runner state
→ stato runtime confermato
```

Per gli altri esiti del percorso ordinario:

```txt
unchanged
duplicate/regressione rappresentata come unchanged
partial
failed
risultato non canonico
→ pending runner state non confermato
```

Un sample tecnico non utilizzabile non viene inviato al Source Identity Gate come campione persistibile. `trackerUpdate.js` può però chiamare la persistenza con:

```txt
repairOnly: true
```

per tentare il recovery di un journal Betfair pending già esistente. In `repairOnly`, `persistBetfairTrackingSample()` restituisce l’esito senza eseguire commit o discard del pending runner state.

Il dettaglio di tick, regressioni, deduplicazione documentale, `commitId`, journal e scrittura canonica appartiene a:

[Timeline e history](../storage/01-timelines-and-history.md)

Il contratto multi-documento di journal e recovery appartiene a:

[Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)

## Persistence integrity e health

Uno stato di persistenza incompleta Betfair non è un errore dello scraper.

Gli stati read-only di integrità includono:

```txt
no_known_partial
partial_persistence
recovery_failed
```

`partial_persistence` e `recovery_failed` restano separati da segnali quali:

```txt
runtime scraper
CDP
Graph health
freshness
tick stale
ladder reliability
Money Flow
```

Le API Betfair possono esporre `integrity`, ma questo blocco non deve essere confuso con `health` e non conferma né invalida da solo lo stato runtime dei runner.

Le route:

```txt
GET /api/betfair/:eventId/json
GET /api/betfair/:eventId/latest
```

sono read-only rispetto a tracking, scraper, journal e `marketState`: non avviano uno scraper Betfair, non eseguono repair e non scrivono persistenza canonica.

`GET /api/betfair/:eventId/latest`, quando richiesto in modalità CDP con un endpoint presente, può però eseguire un probe diagnostico verso:

```txt
<cdpUrl>/json/version
```

Il target passa dallo stesso classificatore CDP loopback e il fetch usa un `AbortController` con timeout di 1500 ms quando disponibile.

Read-only significa quindi assenza di mutazioni del lifecycle/persistenza, non assenza assoluta di I/O diagnostico.

## Validazione degli URL Betfair

La validazione dell’URL Betfair e la normalizzazione della scraper key sono responsabilità distinte.

Le route correnti di Start e login classificano l’URL con il validator backend-owned:

```txt
classifyBetfairUrl(...)
```

Il validator accetta soltanto HTTPS verso:

```txt
betfair.it
www.betfair.it
betfair.com
www.betfair.com
```

ed esclude credenziali e porte esplicite.

Il percorso Start usa `allowEmpty: true`, perché il tracking può essere avviato senza Betfair. La route login usa anch’essa `allowEmpty: true` e traduce il target vuoto nello stato `no_target`.

Il runner Betfair riceve l’URL dal chiamante e usa `scraperKey()` per la deduplicazione. `scraperKey()` normalizza soltanto i parametri transitori descritti sopra e non deve essere interpretato come validator di protocollo/host.

## Cleanup legacy Betfair

`cleanupLegacyBetfairTimeline()` conserva soltanto entry timeline che rispettano contemporaneamente:

```txt
entry.data.source === "betfair"
Number.isFinite(entry.data.seq)
Array.isArray(entry.data.runners)
```

Se è necessario riscrivere il documento, elimina anche il campo top-level `latest` prima della scrittura.

Il cleanup viene invocato dal percorso di persistenza dopo un commit canonico riuscito o un recovery riuscito.

Un fallimento del cleanup legacy resta osservabile tramite `legacyWarning`; non trasforma un commit canonico già riuscito in un errore di commit.

## Terminazione da mismatch Source Identity

Il mismatch Source Identity è un evento applicativo che porta allo stop logico della sessione e alla terminazione fisica dei processi tracking registrati.

Sequenza corrente:

```txt
campione valido osservato dal gate
→ gate rileva mismatch
→ azione blocked
→ il campione causale non entra nel percorso persist-current
→ onMismatch del match tracker
→ stopAllMatchTrackers({ preserveGateEventId })
→ invalidatePythonGeneration("tracking")
→ avvio concorrente dei cleanup:
     terminateActiveBetfairScrapers()
     terminatePythonProcesses("tracking")
→ richiesta di terminazione dei ruoli tracking registrati
→ betfair_login preservato
→ nessun processo Chrome/CDP esterno viene selezionato dal registry
```

`terminateActiveBetfairScrapers()` chiude il lifecycle logico Betfair e richiede la terminazione del ruolo `betfair_tracking`; `terminatePythonProcesses("tracking")` opera invece sullo scope fisico completo, che comprende:

```txt
sofa_tracking
betfair_tracking
```

Di conseguenza un eventuale `sofa_tracking` già in flight non viene soltanto reso obsoleto: se è ancora registrato nello scope tracking, riceve anch’esso la richiesta di terminazione del registry.

La tracking session resta comunque una seconda barriera applicativa. Gli update SofaScore e Betfair verificano `isTrackingSessionCurrent()` prima di applicare nuovi effetti; una callback appartenente a una sessione non più corrente viene restituita come:

```txt
stale_tracking_session
```

Il mismatch preserva il gate dell’evento tramite `preserveGateEventId`, mentre i tracker vengono rimossi.

La terminazione non cancella cache, timeline, history o conferme Source Identity persistite.

## Cache

La cache Python Betfair è project-owned:

```txt
backend/betfair_cache/
```

La CLI la usa soltanto quando sono contemporaneamente vere le condizioni seguenti:

```txt
--no-cache assente
--login-only assente
nessuna ladder URL
network capture disattivata
```

La cache Python ha TTL breve e non sostituisce history o timeline canoniche.

Il tracking canonico passa esplicitamente `noCache: true`, quindi non dipende dalla cache Python per i campioni live.

La pulizia deve restare confinata alle directory dichiarate del progetto. Non deve essere confusa con la gestione di:

* profili Chrome;
* cookie;
* sessioni browser;
* cache browser;
* file esterni al progetto;
* asset statici della pagina.

La redazione del contenuto cache appartiene al package Python Betfair. Limiti di retention, rotazione e cleanup appartengono al runbook di retention e cleanup.

## Network capture e `--no-cache`

La network capture richiesta dal lifecycle Node è attiva soltanto quando:

```txt
options.networkCapture === true
```

Per ogni altro valore il runner aggiunge:

```txt
--no-network-capture
```

`betfairFetch.js` conserva due valori distinti nell’oggetto passato al runner:

```txt
networkCapture
→ booleano effettivo: options.networkCapture === true

networkCaptureInput
→ valore originale ricevuto dal chiamante
```

Il runner usa il valore originale insieme a `noCache` e alla presenza di ladder URL per decidere `--no-cache`.

### Matrice senza ladder URL e senza `options.noCache: true`

| Input originale `options.networkCapture` | Capture | `--no-network-capture` | `--no-cache` |
| ---------------------------------------- | ------: | ---------------------: | -----------: |
| Assente                                  | Off     | Presente               | Presente     |
| `false` booleano                         | Off     | Presente               | Assente      |
| `true` booleano                          | On      | Assente                | Presente     |
| Valore non booleano                      | Off     | Presente               | Presente     |

Con almeno una `ladderUrl`, `--no-cache` è sempre presente.

Con `options.noCache === true`, `--no-cache` è sempre presente indipendentemente dagli altri input.

Nel tracking canonico `trackerUpdate.js` passa:

```txt
networkCapture: false
noCache: true
```

quindi il child riceve sempre:

```txt
--no-network-capture
--no-cache
```

anche senza Graph URL.

La policy Node controlla soltanto gli argomenti passati alla CLI. La CLI Python mantiene una propria logica di `cache_allowed` basata sui flag ricevuti.

## Contratto output del processo figlio

Lo stdout viene accumulato in memoria per il parsing del risultato.

Alla chiusura con exit code zero il runner:

```txt
cerca il primo "{"
→ prende la sottostringa da quel punto in avanti
→ JSON.parse(...)
→ delega il risultato al processor
```

Se il JSON è assente o invalido, la promise fallisce con:

```txt
scraper_output_invalid
```

Lo stderr viene drenato e scartato dal runner Node: non viene accumulato come diagnostica del lifecycle e non viene esposto raw.

L’accumulo stdout è limitato per default a:

```txt
4 MiB
```

Al superamento:

```txt
scraper_output_too_large
→ rigetto della promise
→ terminateExecution(...) sul solo child registrato
```

Il contenuto eccedente non viene inserito nei log del lifecycle.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check sofa/betfairFetch.js
node --check sofa/betfair/scraperLifecycle/runner.js
node --check sofa/betfair/trackerUpdate.js
node --check sofa/matchTracker.js
node --check runtime/pythonProcessRegistry.js
node --check routes/match/trackingResponses.js
node --check routes/betfair.js
node --check routes/betfair/loginWindowLifecycle.js
node --check routes/betfair/latestPayload.js
node --check routes/betfair/cdpStatus.js
node --check sofa/betfair/processor.js
node --check sofa/betfair/processor/persistence.js

node sofa/betfair/scraperLifecycle.test.mjs
node sofa/betfair/trackerUpdate/technicalRecovery.test.mjs
node sofa/betfairFetch.test.mjs
node sofa/matchTracker.test.mjs
```

Per i dettagli di persistenza, usare inoltre le suite possedute dall’owner storage/processor; non sono ridefinite qui.

Verificare almeno:

```txt
deduplicazione per key/runtime/session
→ stessa promise soltanto con key, runtime identity e trackingSessionId compatibili
→ runtime incompatibile: scraper_runtime_conflict
→ sessione incompatibile: scraper_session_conflict

cleanup dopo completion fisica
→ nessun secondo spawn finché la vecchia entry non è fisicamente completata
→ cleanup tardivo non rimuove una nuova entry

runtime identity
→ CDP canonica tramite classificatore loopback
→ profileDir Persistent normalizzato soltanto con trim

log strutturali sicuri
→ nessun stdout raw, stderr raw, URL completa, ladder URL completa o argomento completo dello spawn nei log del lifecycle

errori child process
→ classificazioni statiche senza body raw

timeout
→ scraper_timeout
→ terminazione mirata del child registrato

stdout overflow
→ limite bounded
→ scraper_output_too_large
→ terminazione mirata del child registrato

terminazione esplicita
→ graceful bounded sui soli processi registrati
→ eventuale force-kill del solo PID registrato
→ error event post-spawn non equivale da solo a completion

stop manuale
→ tracker logici fermati
→ scope tracking fisico terminato
→ betfair_login preservato

login-only
→ richiesta compatibile riusata
→ runtime incompatibile: login_runtime_conflict
→ ruolo fisico betfair_login separato dal tracking

restore
→ continuità soltanto per selectionId normalizzato
→ nessun fallback sul nome

network capture
→ attiva solo con true booleano

cache tracking
→ tracker passa networkCapture:false e noCache:true
→ child riceve --no-network-capture e --no-cache

repairOnly
→ può recuperare journal pending
→ non conferma né scarta il pending runner state

persistence integrity
→ esposta read-only dalle route Betfair
→ partial_persistence/recovery_failed separati da health

latest CDP probe
→ classificazione loopback
→ /json/version
→ timeout bounded quando AbortController è disponibile

URL Betfair
→ Start e login usano classifyBetfairUrl
→ scraperKey resta deduplica, non validator

mismatch Source Identity
→ gate blocked e campione causale non persist-current
→ tracker logici fermati con gate evento preservato
→ generation tracking invalidata
→ terminazione fisica dello scope tracking, inclusi sofa_tracking e betfair_tracking registrati
→ betfair_login preservato; processi Chrome/CDP esterni fuori dallo scope del registry
→ callback stale ulteriormente bloccate da trackingSessionId
```

La verifica del lifecycle Betfair copre direttamente deduplica, runtime identity, output bounded e terminazione del ruolo Betfair. Il wiring completo del mismatch attraversa anche `matchTracker.js`, `sourceIdentityGate.js`, gli update SofaScore/Betfair e il registry Python e va quindi letto/verificato come contratto integrato, non come comportamento del solo runner Betfair.

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
