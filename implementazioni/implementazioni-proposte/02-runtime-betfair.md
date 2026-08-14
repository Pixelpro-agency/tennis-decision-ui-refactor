# Tennis Decision UI — Runtime e acquisizione Betfair

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)  
> **Perimetro:** `IMPL-016…018`  
> **Parte precedente:** [Utility e autorità di base](01-utility-e-autorita-base.md)  
> **Parte successiva:** [Storage, documenti canonici e recovery](03-storage-recovery.md)

## 17. Implementazioni approvate dal Punto 3

Questo documento mantiene il registro tecnico delle implementazioni `IMPL-016…018` relative al runtime Betfair, al boundary HTTP locale e alla provenance dell’acquisizione.

Le voci **Classificazione**, **Stato** e **Priorità** conservano il significato decisionale del registro e restano distinte dallo stato di copertura del contratto.

Le relazioni con altre implementazioni sono indicate senza attribuire automaticamente un verso di dipendenza quando il rapporto non è definito dal comportamento corrente.

---

### IMPL-016 — Betfair runtime command authority

**Classificazione:** `NECESSARIA`  
**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** critica  
**Copertura corrente:** `PARZIALE`  
**Relazioni documentali:** `IMPL-006`, lifecycle Python, login-window, tracking Betfair

### Contratto approvato

L’implementazione approvata richiede un’autorità globale dei comandi Betfair capace di distinguere almeno:

```txt
betfairCommandId
trackingSessionId o null
kind: login | tracking | diagnostics
state: requested | active | stopping | completed | failed
runtimeIdentity
canonicalMarketIdentity
owner
createdAt
```

Il contratto richiede inoltre che login, tracking e diagnostica non possano contendersi implicitamente lo stesso runtime browser/profilo/mercato e che un eventuale handoff sia esplicito.

### Autorità correnti effettivamente presenti

Non esiste ancora un singolo oggetto o registro equivalente al contratto globale precedente. Esistono invece autorità separate, ciascuna con un perimetro preciso:

```txt
trackingSessionId
→ identità della sessione di tracking

scraperLifecycle.activeScrapers
→ ownership logica dello scraper per scraper key

loginWindowLifecycle.active
→ ownership della finestra/processo di login

pythonProcessRegistry
→ ownership delle singole esecuzioni Python
```

#### Tracking session

`trackMatch()` assegna un nuovo `trackingSessionId` nel formato `tracking-N`.

Le callback di aggiornamento SofaScore e Betfair verificano che il `trackingSessionId` catturato sia ancora quello associato all’evento corrente. Un aggiornamento Betfair che ritorna dopo la sostituzione della sessione viene ignorato come `stale_tracking_session`.

Il `trackingSessionId` è quindi un’autorità di appartenenza alla sessione live, non un’autorità globale dei comandi Betfair.

#### Scraper lifecycle

Lo scraper Betfair mantiene una `Map` di esecuzioni attive indicizzata tramite la scraper key derivata dall’URL.

Per una stessa key:

- runtime identity e `trackingSessionId` uguali riusano la stessa Promise attiva;
- runtime identity uguale ma `trackingSessionId` diverso produce `scraper_session_conflict`;
- runtime identity diversa produce `scraper_runtime_conflict`.

La runtime identity corrente distingue:

```txt
cdp
→ mode + cdpUrl normalizzata

persistent
→ mode + profileDir normalizzata
```

La presenza di una entry per una key non costituisce però un lock globale su tutti i comandi Betfair. Due key diverse non sono coordinate da `activeScrapers`.

Ogni entry usa inoltre un `executionToken` locale. Il cleanup elimina l’entry soltanto se il token è ancora quello dell’esecuzione corrente; la chiusura tardiva di un processo precedente non può quindi rimuovere una nuova entry che abbia riutilizzato la stessa key.

#### Login lifecycle

La login window possiede un lifecycle separato con una singola variabile `active`.

Se è già presente una login window:

- una richiesta con la stessa runtime identity attende o riusa l’avvio esistente;
- una richiesta con runtime identity incompatibile produce `login_runtime_conflict`.

La compatibilità è valutata sulla runtime identity del browser, non sul target Betfair specifico della richiesta.

#### Python process ownership

Il registro Python distingue i ruoli:

```txt
sofa_tracking
betfair_tracking
betfair_login
```

e separa le generation scope:

```txt
tracking
login
```

Ogni processo è identificato da `executionId` e protetto da `ownerToken`. La terminazione di una singola esecuzione verifica l’owner prima di agire.

Tracking e login rimangono tuttavia scope distinti: il process registry non implementa una mutua esclusione globale fra `betfair_tracking` e `betfair_login`.

### Coordinamento login ↔ tracking

Non è presente un `betfairCommandId`, né un arbitro comune che serializzi login, tracking e diagnostica sotto una sola authority.

In particolare, il lifecycle della login window e quello dello scraper tracking mantengono ownership separate. La presenza di un login attivo non viene consultata dal lifecycle dello scraper e la presenza di uno scraper attivo non viene consultata dal lifecycle della login window.

Il contratto di handoff globale previsto da `IMPL-016` deve quindi essere distinto dalle protezioni già esistenti per:

- sessioni di tracking stale;
- conflitti di runtime sulla stessa scraper key;
- conflitti fra login window incompatibili;
- ownership dei processi Python.

### Cleanup e invalidazione

Lo stop o il cleanup del tracking opera sui processi posseduti dal registry e sui lifecycle applicativi.

La terminazione Python avviene per esecuzione o per ruolo/scope, con richiesta `SIGTERM` e fallback `SIGKILL` se la chiusura non viene confermata entro i timeout previsti. Non viene usata una procedura kill-by-port.

La separazione delle generation scope permette inoltre di invalidare il tracking senza implicare automaticamente l’invalidazione della login scope.

### Copertura del contratto approvato

| Aspetto                                                           | Stato corrente |
| ----------------------------------------------------------------- | -------------- |
| `trackingSessionId`                                               | presente       |
| runtime identity browser                                          | presente       |
| ownership scraper per key                                         | presente       |
| ownership login separata                                          | presente       |
| ownership esecuzioni Python                                       | presente       |
| protezione da cleanup stale                                       | presente       |
| `betfairCommandId` globale                                        | non presente   |
| `kind: login \| tracking \| diagnostics` sotto un’unica authority | non presente   |
| `canonicalMarketIdentity` nell’autorità del comando               | non presente   |
| handoff globale login → tracking                                  | non presente   |
| lock globale fra login, tracking e diagnostica                    | non presente   |

### Test correnti pertinenti

```txt
backend/src/sofa/betfair/scraperLifecycle.test.mjs
backend/src/routes/betfair/loginWindowLifecycle.test.mjs
```

I test coprono, fra l’altro, riuso compatibile, conflitti di sessione/runtime, cleanup stale, retry dopo spawn failure, ownership della login window e terminabilità dei processi posseduti. Non coprono l’autorità globale prevista dal contratto.

---

### IMPL-017 — Local control-plane boundary

**Classificazione:** `NECESSARIA`  
**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** critica  
**Copertura corrente:** `PARZIALE`  
**Relazioni documentali:** bootstrap backend, launcher, inventario endpoint `IMPL-002`

### Contratto approvato

Il contratto approvato richiede:

```txt
listen host: 127.0.0.1
allowed origins: frontend locale risolto dal launcher
allowed hosts: loopback e porta backend effettiva
mutations: POST JSON
reads: GET senza side effect
```

con un boundary locale verificabile prima dell’esecuzione delle route applicative.

### Boundary HTTP corrente

Il bootstrap server usa come bind host predefinito:

```txt
127.0.0.1
```

e passa esplicitamente il bind host a `app.listen()`.

L’applicazione installa inoltre `localHttpBoundary` prima del middleware CORS e prima dei router:

```txt
localHttpBoundary
→ cors({ origin: true })
→ express.json()
→ route applicative
```

Il boundary corrente accetta come hostname locali:

```txt
127.0.0.1
localhost
::1
```

#### Host

L’header `Host` deve contenere un hostname locale riconosciuto.

Sono rifiutati:

- Host mancante o non interpretabile;
- hostname esterni;
- indirizzi non appartenenti all’insieme loopback previsto.

Il controllo corrente valida l’hostname, ma non vincola la porta dell’header `Host` alla porta backend effettivamente in ascolto.

#### Origin

Un `Origin` assente è accettato esplicitamente, consentendo richieste locali non browser come CLI o test.

Quando `Origin` è presente:

- il protocollo deve essere `http:`;
- l’hostname deve essere `127.0.0.1`, `localhost` oppure `::1`;
- username e password nell’URL non sono ammessi.

Il boundary non limita però l’Origin a una specifica porta frontend risolta dal launcher. Qualunque Origin HTTP con hostname loopback ammesso supera questa classificazione.

Il middleware CORS usa `origin: true`, ma viene eseguito dopo `localHttpBoundary`: un Origin esterno viene quindi respinto prima di raggiungere CORS.

### Superficie HTTP pertinente

Le principali operazioni di controllo usano metodi non-GET:

| Operazione               | Metodo   | Route                                            |
| ------------------------ | -------- | ------------------------------------------------ |
| avvio tracking           | `POST`   | `/api/match/track`                               |
| rimozione tracking       | `POST`   | `/api/match/untrack`                             |
| stop tracking            | `POST`   | `/api/match/stop`                                |
| apertura login Betfair   | `POST`   | `/api/betfair/login-window`                      |
| conferma Source Identity | `POST`   | `/api/evidence/:eventId/source-identity/confirm` |
| revoca Source Identity   | `DELETE` | `/api/evidence/:eventId/source-identity/confirm` |

Le principali letture pertinenti rimangono `GET`:

| Lettura                      | Metodo | Route                                        |
| ---------------------------- | ------ | -------------------------------------------- |
| latest Betfair               | `GET`  | `/api/betfair/:eventId/latest`               |
| JSON Betfair                 | `GET`  | `/api/betfair/:eventId/json`                 |
| log runtime Betfair limitato | `GET`  | `/api/betfair/log`                           |
| health backend               | `GET`  | `/api/health`                                |
| latest Evidence              | `GET`  | `/api/evidence/:eventId/latest`              |
| Source Identity status       | `GET`  | `/api/match/:eventId/source-identity-status` |
| history match                | `GET`  | `/api/match/:eventId/history`                |
| JSON SofaScore               | `GET`  | `/api/match/:eventId/json`                   |

Le route elencate non espongono mutazioni tramite `GET`.

Il contratto storico “mutations: POST JSON” non coincide però integralmente con il comportamento corrente, perché la revoca della conferma Source Identity usa `DELETE`.

### Control plane e data plane

Lo stesso `localHttpBoundary` viene applicato a tutta l’applicazione. Non esistono due middleware di sicurezza distinti per control plane e data plane.

La separazione corrente deriva principalmente da:

- metodo HTTP;
- semantica della singola route;
- middleware locale comune a monte.

### Copertura del contratto approvato

| Aspetto                                                | Stato corrente                                     |
| ------------------------------------------------------ | -------------------------------------------------- |
| bind predefinito `127.0.0.1`                           | presente                                           |
| rifiuto Host non locale                                | presente                                           |
| rifiuto Origin esterno                                 | presente                                           |
| Origin assente gestito esplicitamente                  | presente                                           |
| route di lettura principali su `GET`                   | presente                                           |
| mutazioni tramite `GET` nelle route elencate           | non presenti                                       |
| Origin limitato al frontend/porta risolti dal launcher | non presente nel boundary                          |
| Host vincolato alla porta backend effettiva            | non presente nel boundary                          |
| tutte le mutazioni come `POST JSON`                    | non corrisponde integralmente: revoke usa `DELETE` |

### Test correnti pertinenti

```txt
backend/src/runtime/localHttpBoundary.test.mjs
backend/src/server.test.mjs
```

I test verificano Host/Origin loopback, rifiuto delle origini esterne e bind predefinito su `127.0.0.1`.

---

### IMPL-018 — Betfair acquisition envelope e provenance

**Classificazione:** `NECESSARIA`  
**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** alta  
**Copertura corrente:** `PARZIALE`  
**Relazioni documentali:** processor Betfair, timeline canonica, health, `IMPL-012`, `IMPL-013`

### Contratto approvato

Il contratto approvato distingue il momento in cui un dato viene acquisito dal momento in cui il relativo tick viene costruito e registrato.

L’envelope previsto è:

```txt
schemaVersion
scrapeId
trackingSessionId
commandId
startedAt
completedAt
marketApiAcquiredAt
graphAcquisitions:
  selectionId
  acquiredAt
  completedAt
  status
  rowCount
recordedAt
maxGraphSkewMs
```

Per i valori matched è inoltre prevista una provenance esplicita:

```txt
matchedTotal
matchedValueSource:
  api_runner
  graph_runner
  unavailable
```

### Sequenza di acquisizione corrente

Il percorso corrente è:

```txt
update Betfair
→ registra lastScrapeAttemptAt nel runtime tracking
→ avvia/riusa lo scraper Python
→ apre la pagina evento Betfair
→ acquisisce mercato e runner dalle API readonly byevent/bymarket
→ ricava marketId del mercato MATCH_ODDS
→ valida le Graph URL dirette contro marketId e selectionId API
→ acquisisce sequenzialmente le ladder Graph validate
→ associa ogni ladder al runner tramite selectionId
→ restituisce runners + market_info + diagnostica Graph
→ processor JavaScript normalizza runner e ladder
→ costruisce il tick canonico Betfair
→ persiste history/timeline tramite il workflow canonico
```

### Identità mercato e runner

L’acquisizione corrente possiede primitive di identità più forti della sola URL testuale.

L’API readonly individua il `marketId` del mercato `MATCH_ODDS`. Le Graph URL accettate devono avere la forma canonica:

```txt
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

La validazione Graph:

- rifiuta host, schema o formato non ammessi;
- rifiuta l’endpoint `runnerChartData`;
- richiede un `marketId` API disponibile;
- rifiuta un `marketId` Graph diverso da quello API;
- associa il runner tramite `selectionId`;
- rifiuta selection mancanti, duplicate o ambigue.

La ladder Graph viene quindi assegnata soltanto al runner API con identità compatibile.

### Metadata temporali correnti

Il sistema dispone di timestamp runtime e di registrazione del tick, ma non dell’envelope temporale completo previsto da `IMPL-018`.

| Informazione                                  | Stato corrente             | Semantica                                                                   |
| --------------------------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| `lastScrapeAttemptAt`                         | presente                   | istante runtime registrato subito prima della fetch Betfair                 |
| `lastSuccessfulScrapeAt`                      | presente                   | istante runtime registrato dopo una fetch utilizzabile o un evento concluso |
| `lastTechnicalErrorAt`                        | presente                   | istante runtime dell’ultimo errore tecnico classificato                     |
| tick `timestamp` / `ts`                       | presente                   | istante di costruzione del tick canonico JavaScript                         |
| Graph `lastOkAt` / `lastFailAt`               | presente                   | osservabilità Graph calcolata durante la costruzione del tick               |
| `scrapeId`                                    | non presente               | —                                                                           |
| `commandId`                                   | non presente               | —                                                                           |
| `startedAt` / `completedAt` dell’acquisizione | non presenti nell’envelope | —                                                                           |
| `marketApiAcquiredAt`                         | non presente               | —                                                                           |
| `graphAcquisitions[].acquiredAt`              | non presente               | —                                                                           |
| `graphAcquisitions[].completedAt`             | non presente               | —                                                                           |
| `recordedAt` esplicito                        | non presente               | —                                                                           |
| `maxGraphSkewMs`                              | non presente               | —                                                                           |

Il `timestamp` del tick non deve quindi essere interpretato come timestamp di acquisizione dell’API mercato o di una specifica Graph ladder.

Le Graph URL vengono elaborate una dopo l’altra, ma il risultato espone soltanto diagnostica aggregata come:

```txt
graphUrlsProvided
graphUrlsAttempted
graphUrlsSucceeded
graphUrlsFailed
graphRowsTotal
authSuspected
failures
```

Non viene conservato il momento individuale in cui ciascuna ladder è stata acquisita.

### Provenance dei matched value

L’API readonly `bymarket` espone per ogni runner `state.totalMatched`.

Il percorso Python copia questo valore sia nello stato del runner sia in:

```txt
market_graph.runnerMatchedVolume
```

Nonostante il nome `runnerMatchedVolume`, questo valore viene popolato dal dato API `state.totalMatched`; non è un totale ricavato dalla pagina Graph.

Durante la normalizzazione JavaScript:

- `runner.matchedTotal`, se non già finito, usa come prima sorgente `runner.state.totalMatched`;
- sono previsti fallback su `runner.tradedVolume` o `runner.exchange.tradedVolume` quando disponibili;
- `totalMatchedOnSelection` viene allineato a `matchedTotal` quando non è già finito;
- il valore finale del runner preferisce il valore normalizzato derivato da `market_graph.runnerMatchedVolume`, quindi il dato API corrente.

Il tick canonico conserva:

```txt
matchedTotal
totalMatchedOnSelection
```

ma non conserva un campo `matchedValueSource`.

Il percorso corrente non sintetizza il matched total dei runner con formule del tipo:

```txt
market_total / numero_runner
```

per costruire il matched total dei runner.

### Ladder Graph e volume traded

Le Graph ladder correnti contengono, per quota:

```txt
price
back_available
lay_available
traded
```

Il dato `traded` è quindi mantenuto separato dalla liquidità disponibile Back/Lay.

Il processor conserva inoltre la provenienza della ladder tramite `ladderSource`, con `graph_url` per le ladder acquisite dalle Graph URL validate.

### Money Flow corrente

Il backend possiede ancora un calcolo `moneyFlow` basato su due snapshot Graph consecutivi.

Il calcolo viene soppresso quando, fra gli altri casi:

- la ladder corrente o precedente non è Graph-compatible;
- manca un totale matched di mercato utilizzabile;
- manca il matched del runner;
- il totale matched regredisce;
- il runner non ha incremento matched;
- il delta runner supera il delta mercato oltre tolleranza;
- il delta `traded` della ladder non è coerente con il delta matched del runner.

Quando le verifiche passano, il delta `traded` per quota viene confrontato con un prezzo di riferimento derivato da `lastTradedPrice` o dal mid-price. I delta a quota minore o uguale al riferimento vengono accumulati nel campo `back`, quelli sopra il riferimento nel campo `lay`.

L’output corrente usa:

```txt
back
lay
trend: neutral | backing | laying
confidence: confirmed | suppressed
reason
marketDelta
runnerDelta
ladderTradedDelta
```

Questa è la semantica del codice corrente. Non equivale al modello futuro di attribuzione Stream API con stati `back_attributed | lay_attributed | ambiguous`.

### Graph health e skew

`graphHealth` classifica lo stato Graph usando esito delle URL, righe ottenute, login sospetto, presenza di ladder utilizzabili e stato del mercato.

Sono presenti stati come:

```txt
ok
stale
temporary_error
auth_suspected
bad_graph_url
unavailable
finished
unknown
```

La classificazione non riceve timestamp di acquisizione per runner e non calcola uno skew temporale fra Graph.

Di conseguenza il modello corrente non espone:

```txt
maxGraphSkewMs
```

e non usa `graph_acquisition_skew` come reason di soppressione del Money Flow.

### Freshness corrente

La freshness osservabile oggi è distribuita fra:

```txt
runtime tracking
→ lastScrapeAttemptAt
→ lastSuccessfulScrapeAt
→ lastTechnicalErrorAt

tick canonico
→ timestamp
→ ts

graphHealth
→ lastOkAt
→ lastFailAt
→ staleSeconds
```

Questi valori descrivono il ciclo runtime e il momento di costruzione/osservazione del tick. Non permettono di ricostruire in modo equivalente:

```txt
acquiredAt
→ età effettiva del singolo dato sorgente

recordedAt
→ momento separato di registrazione

maxGraphSkewMs
→ distanza temporale fra acquisizioni Graph
```

### Estensione futura — Stream API e attribuzione del volume

La Betfair Stream API non è integrata nel percorso di acquisizione corrente.

La sezione rimane quindi esplicitamente futura e non descrive comportamento corrente.

Il contratto storico dell’estensione prevede di conservare, per runner e update, dati quali:

```txt
selectionId
acquiredAt
EX_TRADED per quota
EX_ALL_OFFERS back/lay
lastTradedPrice
totalMatched / deltaTraded
```

e di distinguere il volume effettivamente scambiato dalle sole variazioni di liquidità disponibile.

L’attribuzione prevista dal contratto futuro usa stati espliciti:

```txt
back_attributed | lay_attributed | ambiguous
confidence: high | medium | low
policyVersion
reasons
```

Questi campi e stati non sono presenti nel percorso corrente e non devono essere interpretati come già implementati.

### Copertura del contratto approvato

| Aspetto                                  | Stato corrente |
| ---------------------------------------- | -------------- |
| `trackingSessionId` nel percorso runtime | presente       |
| identità `marketId` / `selectionId`      | presente       |
| validazione Graph contro identità API    | presente       |
| diagnostica Graph aggregata              | presente       |
| runner matched da sorgente API diretta   | presente       |
| ladder `traded` per quota                | presente       |
| timestamp runtime/tick                   | presenti       |
| `schemaVersion` acquisition envelope     | non presente   |
| `scrapeId`                               | non presente   |
| `commandId`                              | non presente   |
| timestamp API/Graph per fase             | non presenti   |
| `recordedAt` separato                    | non presente   |
| `maxGraphSkewMs`                         | non presente   |
| `matchedValueSource` esplicito           | non presente   |
| suppressione `graph_acquisition_skew`    | non presente   |
| Stream API                               | non presente   |

### Test correnti pertinenti

```txt
scrapers/betfair/graph_url_test.py
backend/src/sofa/betfairFetch.test.mjs
```

I test coprono in particolare la validazione fail-closed di `marketId`/`selectionId`, l’esclusione di URL Graph non ammesse, l’identità rigorosa dei runner nel restore e i contratti di persistenza Betfair pertinenti. Non coprono l’envelope temporale completo previsto dal contratto.

---
