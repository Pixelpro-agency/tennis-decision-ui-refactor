> **Parte 2 di 7 — Runtime, sessioni e Betfair**
> Secondo audit — Punti 2 e 3: tracking, Start/Stop, generazioni, callback tardive, lifecycle Betfair, Graph, diagnostica, concorrenza e cleanup.
> [Indice](../03-audit-codice.md) · [Parte 1](01-rilievi-iniziali.md) · [Parte 3](03-storage-recovery.md)

## 17. Secondo audit del codice — Punto 2: tracking, Start/Stop, generazioni e callback tardive

**Baseline:** `dda406c4a07ae4a1debfcab39db346e47c33c419`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati route, tracker, registry Python, lifecycle SofaScore/Betfair, Source Identity Gate, conferma manuale, hook di sessione e polling, servizi frontend e test collegati.

### Parti confermate come solide

Il registry Python protegge correttamente il lifecycle fisico dei figli:

- generation separate per `tracking` e `login`;
- rifiuto degli spawn appartenenti a generation obsolete;
- ownership degli scraper;
- terminazione bounded;
- login preservato durante lo Stop del tracking.

`directFetch` SofaScore:

- serializza fisicamente i figli Python;
- ricontrolla la generation;
- riconosce cancellazione e terminazione;
- non avvia il figlio successivo prima dell’uscita del precedente.

Queste protezioni non equivalgono a un’autorità completa della sessione applicativa.

### Ampliamento collegato a RUNTIME-002 — Il nuovo Start non invalida la sessione precedente

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

`trackMatch(...)` sostituisce mappe e gate, ma non:

- invalida prima la sessione logica precedente;
- invalida la generation tracking;
- termina e attende tutti i figli precedenti;
- invalida Promise e callback JavaScript;
- verifica un token prima degli effetti.

Una callback precedente può trovare il gate assente e ricevere `action: no-gate`. SofaScore e Betfair trattano oggi `no-gate` come autorizzazione a persistere.

### RUNTIME-004 — Riavvio dello stesso eventId contamina il gate nuovo

**Stato:** `CONFERMATO`
**Priorità:** critica

Il gate è indicizzato soltanto per `eventId`.

```txt
Start A
→ callback vecchia in volo

nuovo Start A
→ nuovo gate con lo stesso eventId

callback vecchia
→ osserva il gate nuovo
→ può alimentarlo con campioni della sessione precedente
```

Rischi:

- bootstrap misto;
- pending falso;
- mismatch falso;
- stop della nuova sessione;
- contaminazione dopo cambio URL, Graph o modalità browser.

### RUNTIME-005 — `/untrack` è legacy, privo di cleanup fisico e va rimosso

**Stato:** `RIMOZIONE APPROVATA`
**Priorità:** media

Il frontend corrente usa `/track` e `/stop`, non `/untrack`.

`/untrack`:

- elimina soltanto tracker e gate;
- non invalida la generation;
- non termina SofaScore o Betfair;
- non attende completion;
- lascia possibile la persistenza tramite `no-gate`.

Decisione approvata:

```txt
rimuovere route /api/match/untrack
rimuovere buildUntrackMatchResponse
rimuovere untrackMatch e consumer/test esclusivi
```

La task esecutiva deve comunque effettuare un ultimo controllo dei consumer prima della rimozione.

### RUNTIME-006 — Un mismatch stale può fermare la sessione corrente

**Stato:** `CONFERMATO`
**Priorità:** critica

`onMismatch` cattura soltanto `eventId`. Prima di fermare tracker, invalidare generation e terminare Betfair non dimostra di appartenere alla sessione ancora attiva.

### RUNTIME-007 — La Promise Betfair può essere riutilizzata tra sessioni logiche

**Stato:** `CONFERMATO`
**Priorità:** critica

Il lifecycle Betfair riusa `active.promise` quando chiave mercato e runtime identity coincidono.

Non verifica:

- `trackingSessionId`;
- identità del tracker richiedente;
- command ID;
- appartenenza al nuovo Start.

Un nuovo Start può quindi ricevere il risultato dello scraper avviato dalla sessione precedente.

### RUNTIME-008 — Il mismatch invalida SofaScore ma non termina il processo fisico

**Stato:** `CONFERMATO`
**Priorità:** alta

Il percorso mismatch invalida la generation e termina Betfair, ma non termina esplicitamente il figlio SofaScore.

Il risultato sarà stale, ma la barriera fisica può restare occupata fino a uscita o timeout.

Decisione approvata:

```txt
mismatch e Stop usano un cleanup tracking unico
→ SofaScore
→ Betfair
→ callback logiche
```

Il mismatch preserva soltanto lo stato necessario alla UI.

### RUNTIME-009 — Stop pubblico nasconde un cleanup parziale

**Stato:** `CONFERMATO`
**Priorità:** alta

`buildStopMatchResponse()` restituisce top-level `ok: true` e `stopped: true` anche quando `pythonCleanup.ok` è falso o rimangono processi.

Decisione approvata:

```txt
status: complete | partial_failure
logicalStop: true
physicalCleanup: complete | partial
```

La UI non deve mostrare Stop completo quando il cleanup fisico è parziale.

### RUNTIME-010 — Conferma Source Identity stale sul gate nuovo

**Stato:** `CONFERMATO`
**Priorità:** alta

La conferma manuale contiene soltanto eventId, coppie e testo. Una conferma avviata dalla sessione precedente può arrivare dopo un nuovo Start dello stesso evento e colpire il gate nuovo.

Decisione approvata:

```txt
trackingSessionId obbligatoria nella conferma
→ mismatch della sessione
→ 409 stale_session
```

### Estensione intermedia collegata a FRONTEND-001 — Risposte SofaScore e Betfair attraversano il cambio sessione

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

`useMatchPolling` e `useBetfairJson` non possiedono:

- session counter;
- request ID;
- AbortController;
- verifica prima dei `setState`;
- flag disposed per ciclo.

Una risposta vecchia può modificare dati, health, Money Flow, integrity, timestamp, errori e serverStatus.

`useSourceIdentityGateStatus` e `useMarketReactionEvidence` costituiscono il modello locale corretto da uniformare.

### Estensione intermedia collegata a FRONTEND-003 — Start fallito lascia una sessione nascosta

**Stato:** `CONFERMATO`
**Priorità:** alta

Il frontend conferma URL e apre la session shell prima della risposta di `POST /track`.

In caso di failure non:

- cancella la sessione confermata;
- ferma tutti i poller;
- resetta Betfair/Evidence;
- invalida il comando Start;
- esegue cleanup compensativo quando necessario.

### Nota iniziale collegata a FRONTEND-005 — I vecchi loop di polling possono ricrearsi dopo il cleanup

**Stato:** `CONFERMATO`
**Priorità:** critica

I loop SofaScore e Betfair fanno:

```txt
await fetchData(...)
→ setTimeout(loop)
```

Il cleanup cancella il timeout noto, ma una fetch già in attesa può programmare un nuovo timeout dopo il cleanup.

Il ref `shouldPoll` è condiviso: un nuovo Start può riportarlo a `true` e riattivare anche il vecchio loop.

### Nota iniziale collegata a FRONTEND-006 — Start concorrenti non sono serializzati

**Stato:** `CONFERMATO`
**Priorità:** alta

Il pulsante Start usa `sofaLoading`, che appartiene al polling timeline e non al comando `POST /track`.

Mancano:

- `startPending`;
- command ID;
- deduplicazione;
- invalidazione esplicita del comando precedente.

### Nota iniziale collegata a FRONTEND-007 — Stop Live Tracking lascia attivi altri poller

**Stato:** `CONFERMATO`
**Priorità:** medio-alta

`handleStopLiveTracking()` ferma soltanto il polling SofaScore.

Restano attivi:

- Betfair;
- Evidence;
- Source Identity.

Decisione approvata:

```txt
Stop Live Tracking
→ ferma tutti i poller live
→ conserva gli ultimi dati
→ UI in modalità statica
```

### DOC-025 — La documentazione sovrastima la generation tracking

**Stato:** `CONFERMATO`

La generation protegge il figlio Python, non l’intera catena applicativa.

La futura documentazione deve distinguere:

```txt
process generation
≠
tracking session authority
≠
command/request identity
```

### Gap test

#### Requisiti aggiuntivi collegati a TEST-002 — Lifecycle frontend

**Stato:** `MANCANTE`

- cambio eventId con risposta tardiva;
- stesso eventId con nuova sessione;
- Start fallito;
- Start concorrenti;
- Stop durante fetch;
- loop orfano;
- reset di tutti i poller.

#### TEST-005 — Sostituzione sessione backend

**Stato:** `MANCANTE`

- Start A → Start B;
- Start A → nuovo Start A;
- callback A non osserva o persiste nella sessione B;
- mismatch A non ferma B;
- Stop invalida prima del cleanup.

#### TEST-006 — Riuso Betfair session-safe

**Stato:** `MANCANTE`

Stessa chiave e stessa runtime identity non bastano per riusare una Promise appartenente a un’altra `trackingSessionId`.

#### TEST-007 — Cleanup mismatch completo

**Stato:** `MANCANTE`

Mismatch deve terminare o rendere definitivamente stale sia SofaScore sia Betfair.

#### TEST-008 — Stop partial failure

**Stato:** `MANCANTE`

Backend e frontend devono distinguere Stop logico e cleanup fisico parziale.

#### TEST-009 — Conferma Source Identity stale

**Stato:** `MANCANTE`

Una conferma con session ID precedente deve essere rifiutata con `409 stale_session`.

### Decisioni approvate

1. `trackingSessionId` end-to-end, distinta da `eventId`;
2. ogni nuovo Start invalida atomicamente il precedente;
3. Stop e mismatch usano un cleanup tracking unico;
4. `/untrack` viene rimosso;
5. Stop parziale non viene mostrato come completato;
6. tutti i poller condividono la stessa autorità frontend;
7. Stop Live Tracking ferma tutti i poller e conserva una vista statica;
8. conferma Source Identity vincolata alla sessione;
9. un solo comando Start può essere corrente.

### Contratto tecnico risultante

```txt
trackingSessionId
→ UUID nuovo per ogni Start
→ cambia anche con lo stesso eventId

commandId
→ identifica Start, Stop e Confirm

eventId
→ identifica la partita
→ non identifica la sessione
```

Ogni effetto verifica l’autorità immediatamente prima di:

- aggiornare runtime;
- osservare il gate;
- persistere SofaScore;
- persistere Betfair;
- aprire recording;
- gestire mismatch;
- applicare conferma;
- modificare health o finished;
- eseguire `setState`.

### Sequenza Start approvata

```txt
ricevi Start con commandId
→ invalida la sessione precedente
→ invalida generation tracking
→ cleanup completo precedente
→ verifica cleanup
→ crea trackingSessionId
→ crea gate e tracker associati
→ restituisce trackingSessionId
→ frontend attiva i poller per quella sessione
```

La schermata può mostrare “avvio in corso”, ma la sessione richiesta non diventa attiva prima della risposta corrispondente.

### Regola `no-gate`

Nel percorso tracker:

```txt
gate assente
oppure trackingSessionId diversa
→ stale_session
→ nessuna persistenza
```

Il comportamento globale degli observer non va modificato senza verificare gli altri chiamanti.

---

## 18. Secondo audit del codice — Punto 3: lifecycle Betfair, Graph, diagnostica, concorrenza e cleanup

**Baseline:** `cf249ad669347fb06dc69d876d68af591a7f5639`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
backend/src/routes/betfair.js
backend/src/routes/betfair/oddsResponse.js
backend/src/routes/betfair/latestPayload.js
backend/src/routes/betfair/cdpStatus.js
backend/src/routes/betfair/loginWindowLifecycle.js
backend/src/routes/match/trackingResponses.js
backend/src/routes/test.js
backend/src/routes/test/graphUrlValidation.js
backend/src/server.js
backend/src/sofa/betfairFetch.js
backend/src/sofa/betfair/scraperLifecycle.js
backend/src/sofa/betfair/scraperLifecycle/runner.js
backend/src/sofa/betfair/trackerUpdate.js
backend/src/sofa/betfair/processor.js
backend/src/sofa/betfair/processor/technicalSample.js
backend/src/sofa/betfair/processor/persistence.js
backend/src/sofa/betfair/processor/persistenceDecision.js
backend/src/sofa/betfair/processor/canonicalTimeline.js
backend/src/sofa/betfair/processor/runnerProcessing.js
backend/src/sofa/betfair/timeline.js
backend/src/sofa/betfair/timeline/graphHealth.js
backend/src/sofa/betfair/timeline/runnerSnapshot.js
backend/src/sofa/betfair/moneyFlow.js
backend/src/sofa/betfairHealth.js
backend/src/runtime/runtimeLogger.js
scrapers/betfair/cli.py
scrapers/betfair/scrape.py
scrapers/betfair/graph_url.py
scrapers/betfair/ladder.py
scrapers/betfair/network_capture.py
scrapers/betfair/cache.py
scrapers/betfair/config.py
scrapers/betfair/browser_session.py
scrapers/betfair/market_api.py
scrapers/betfair/diagnostic_redaction.py
scrapers/betfair/parsing.py
scrapers/betfair/cdp_url.py
scripts/cleanup_runtime_cache.py
frontend/src/hooks/usePreflightChecks.js
test collegati
```

### Parti confermate come solide

#### Parser Graph runtime

Il parser usato dallo scraper impone:

- `https`;
- host esatto `graphs.betfair.it`;
- nessuna credenziale;
- nessuna porta esplicita;
- path `/<marketId>/<selectionId>/0`;
- rifiuto di `runnerChartData`;
- marketId coerente con l’API;
- selectionId presente nei runner API;
- selectionId duplicate rifiutate.

Questa semantica va preservata e riusata dal preflight.

#### Graph Health e status-only

La classificazione distingue correttamente:

```txt
ok
partial_graph_success
auth_suspected
bad_graph_url
temporary_error
unavailable
finished
```

Il percorso login Graph status-only conserva lo snapshot canonico precedente invece di sostituirlo con un campione vuoto.

#### Lifecycle fisico per singola chiave

Il lifecycle Betfair già protegge:

- riuso della Promise per stessa key e stessa runtime identity;
- conflitto fra runtime incompatibili;
- barriera fino alla chiusura fisica;
- cleanup che non elimina una nuova entry;
- timeout con terminazione;
- retry dopo spawn fallito.

Il limite è che la protezione è locale alla key e non costituisce un’autorità globale Betfair.

#### Redazione diagnostica

Gli helper Python redigono:

- chiavi e header sensibili;
- cookie e token;
- query string;
- URL e percorsi locali;
- testo libero;
- strutture annidate;
- output troppo lunghi.

La correzione richiesta riguarda il boundary HTTP allow-list e il lifecycle della capture, non la sostituzione degli helper.

#### Tracking live ordinario

Il percorso tracker principale:

- disabilita la network capture;
- usa `deferPersistence:true`;
- passa dal Source Identity Gate prima della persistenza.

Questo flusso va preservato e reso session-safe tramite il Punto 2.

### RUNTIME-011 — `/api/betfair/odds` è un secondo ingresso mutante

**Stato:** `RIMOZIONE APPROVATA`
**Priorità:** critica

La route `GET /api/betfair/odds` può:

- avviare Python e Playwright;
- collegarsi a Chrome;
- navigare Betfair e Graph;
- abilitare network capture;
- accettare `sofaEventId`;
- persistere history, timeline e journal senza `deferPersistence:true`.

Non passa attraverso:

- Start canonico;
- `trackingSessionId`;
- Source Identity Gate;
- sequencing Start/Stop;
- autorità della sessione.

Decisione approvata:

```txt
rimuovere /api/betfair/odds
rimuovere oddsResponse e consumer/test esclusivi
nessun endpoint diagnostico sostitutivo per ora
```

Preservare:

```txt
/api/betfair/:eventId/latest
/api/betfair/:eventId/json
quote e book raccolti dal tracking
ladder e Graph
Betfair health
Money Flow non direzionale validato
BetfairDepthCard
```

Un futuro aggiornamento quote ad alta frequenza verrà progettato con le Stream API Betfair, non mantenendo questo secondo scraper HTTP.

### RUNTIME-012 — Manca un’autorità globale dei comandi Betfair

**Stato:** `CONFERMATO`
**Priorità:** critica

`activeScrapers` è indicizzato per key URL. Una key diversa può avviare un altro scraper anche quando usa:

- lo stesso mercato;
- lo stesso profilo Persistent;
- lo stesso CDP;
- lo stesso contesto browser.

Login e tracking possiedono registri distinti e non condividono un arbitro.

Rischi:

- due scraper Betfair mutanti concorrenti;
- login e tracking sullo stesso profilo;
- più processi sullo stesso contesto CDP;
- conflitti non rappresentati dalla singola key;
- handoff implicito e non verificabile.

Decisione approvata:

```txt
IMPL-016 — Betfair runtime command authority
```

### SECURITY-004 — Manca un confine locale delle API di controllo

**Stato:** `CONFERMATO`
**Priorità:** critica

Il backend usa CORS aperto e non impone nel codice un bind esplicito al loopback.

Route di lettura e route mutanti condividono lo stesso confine pubblico.

Decisione approvata:

```txt
bind esplicito 127.0.0.1
CORS allow-list locale
Origin e Host verificati per il control plane
nessuna mutazione tramite GET
route mutanti solo POST JSON
```

La struttura è registrata come `IMPL-017`.

### Ampliamento collegato a CODE-002 — Validazione Betfair non condivisa

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta

Il preflight usa un controllo permissivo sul solo hostname.

Il vero Start non applica un validatore Betfair completo prima di passare la URL al tracker.

Login, preflight, Start e l’endpoint legacy non condividono la stessa semantica.

Decisione approvata:

```txt
un solo validatore Betfair backend-owned
→ preflight
→ Start
→ login-window
→ eventuali future diagnostiche
```

Contratto minimo:

- HTTP/HTTPS;
- host ufficiale ammesso;
- nessuna credenziale;
- eventId estraibile e coerente;
- normalizzazione canonica;
- stesso esito nelle diverse superfici.

Il preflight resta una UX; il backend è l’autorità.

### CODE-006 — Preflight Graph diverso dal contratto runtime

**Stato:** `CONFERMATO`
**Priorità:** alta

Il preflight Graph accetta oggi casi che lo scraper rifiuta:

- host `graphs.betfair.*` invece di `graphs.betfair.it`;
- path senza `/0`;
- mercati diversi nello stesso insieme;
- selectionId duplicate;
- combinazioni che calcolano `sameMarket:false` ma restituiscono `ok:true`.

Decisione approvata:

```txt
preflight e runtime condividono la stessa semantica
```

Il preflight deve imporre:

- HTTPS;
- `graphs.betfair.it`;
- path esatto;
- stesso marketId;
- selectionId uniche;
- nessuna credenziale o porta.

La verifica finale delle selection contro i runner API resta nello scraper.

### CODE-007 — `/latest` esegue il probe CDP da query invece che dalla sessione

**Stato:** `CONFERMATO`
**Priorità:** alta

`GET /api/betfair/:eventId/latest` accetta `mode` e `cdpUrl` dalla query.

`checkCdpStatus` costruisce la URL di probe senza usare l’autorità CDP condivisa.

Decisione approvata:

```txt
rimuovere cdpUrl dalla query operativa di /latest
leggere la runtime identity della trackingSessionId attiva
```

Come barriera minima, nessuna fetch deve partire se `buildCdpVersionUrl` rifiuta l’input.

### DATA-001 — Volume runner inventato da `marketTotal / runnerCount`

**Stato:** `RIMOZIONE APPROVATA`
**Priorità:** critica

Quando manca il volume matched del runner, il processor assegna:

```txt
marketTotalMatched / numeroRunner
```

In una partita a due giocatori questo crea artificialmente una divisione 50/50 non fornita da Betfair.

Il valore può poi:

- entrare nei controlli Money Flow;
- essere salvato come `matchedTotal`;
- essere confuso con un volume osservato.

Decisione approvata:

```txt
rimuovere completamente il fallback sintetico
```

Preservare:

- totale matched reale del mercato;
- volume runner reale da API/Graph;
- quote;
- book depth;
- ladder;
- last traded price.

Quando il volume runner manca:

```txt
matchedTotal: null
matchedValueSource: unavailable
Money Flow dipendente: suppressed
reason: runner_matched_unavailable
```

Zero non deve sostituire automaticamente un dato assente.

Questa correzione non rimuove la visualizzazione delle quote e non coincide con la vecchia euristica punta/banca: elimina esclusivamente un input sintetico privo di evidenza.

### DATA-002 — API e Graph vengono fusi senza identità temporale

**Stato:** `CONFERMATO`
**Priorità:** alta

Il flusso acquisisce in sequenza:

```txt
API mercato
→ Graph runner 1
→ Graph runner 2
→ output unico
```

L’output non conserva:

- inizio e fine scrape;
- timestamp dell’API;
- timestamp di ciascun Graph;
- skew fra runner;
- età del dato al momento della persistenza.

Il tick canonico usa l’ora di costruzione Node come freshness, anche quando lo scrape è durato diversi secondi.

Decisione approvata:

```txt
IMPL-018 — Betfair acquisition envelope e provenance
```

Freshness e validazione temporale devono derivare dall’acquisizione, non soltanto dalla registrazione.

Money Flow deve essere soppresso/degradato quando lo skew Graph supera una soglia documentata.

### Ampliamento collegato a PYTHON-001 — Network capture asincrona non controllata

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta

Ogni response Playwright crea una task con `asyncio.create_task(...)` che non viene:

- registrata;
- attesa;
- drenata;
- cancellata;
- collegata allo Stop o al timeout.

Il collector può mutare mentre viene costruito il summary.

Decisione approvata:

```txt
task registry per scrape
limiti response/body/file
detach listener
drain bounded
cancel residui
summary solo dopo drain
```

### SECURITY-001 e SECURITY-003 — Dati interni oltrepassano la route pubblica

**Stato:** `CONFERMATI E AMPLIATI`
**Priorità:** alta

Il risultato network capture contiene:

- `dump_dir`;
- URL diagnostiche;
- candidati;
- contatori e dettagli interni.

L’endpoint legacy serializza il payload quasi interamente e restituisce `error.message` nei dettagli HTTP.

Decisione approvata:

```txt
IMPL-007 resta il boundary pubblico unico
nessun path locale
nessuna URL completa
nessun payload raw
error code pubblico stabile
log interno redatto separato
```

### Ampliamento collegato a SECURITY-002 — Cache con filename e identità inadeguati

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta

La cache usa una versione sanitizzata e troncata della URL.

Problemi:

- frammenti URL nel filename;
- collisioni dopo il troncamento;
- key priva di mode/runtime;
- key priva della configurazione Graph;
- possibile riuso fra contesti diversi.

Decisione approvata:

```txt
tracking canonico → cache sempre disabilitata
```

Per eventuali future diagnostiche:

```txt
hash di identità canonica Betfair
+ runtime class
+ Graph fingerprint
+ schema version
```

Nessun frammento URL nel filename.

### SECURITY-005 — Flag Chromium indebolenti nel profilo Persistent

**Stato:** `RIMOZIONE APPROVATA SALVO NECESSITÀ DIMOSTRATA`
**Priorità:** media-alta

Il profilo Persistent abilita per default:

```txt
--no-sandbox
--disable-setuid-sandbox
--ignore-certificate-errors
```

Decisione approvata:

- rimuoverli dal default;
- reintrodurre un flag solo se indispensabile e documentato;
- rendere l’eccezione configurabile e collaudabile;
- non indebolire silenziosamente TLS o sandbox.

### Ampliamento collegato a CLEANUP-002 — Authority offline incompleta

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta

L’utility è prudente su allow-list, symlink, ricorsione e dry-run, ma l’`apply` controlla soltanto:

- launcher lock;
- porta 3000;
- porta 3001.

Non usa:

- porte effettivamente selezionate;
- writer authority;
- maintenance authority;
- identità positiva dei servizi;
- file identity/size/mtime originarie prima dell’unlink.

Decisione approvata:

```txt
implementare IMPL-011 prima di un apply reale validato
```

### CLEANUP-003 — Log e network dump senza retention distinta

**Stato:** `CONFERMATO`
**Priorità:** media-alta

Non esiste retention per:

```txt
backend/betfair_scraper.log
backend/betfair_network_dump
```

La cleanup utility copre soltanto le cache JSON allow-list.

Decisione approvata:

```txt
cache rigenerabile
→ retention ordinaria

network dump diagnostico
→ opt-in e retention breve

log runtime
→ rotazione per size/count
```

I dump non devono essere trattati come cache normali, ma non possono crescere senza limite.

### Strutture approvate

#### Sintesi IMPL-016 — Betfair runtime command authority

Coordina:

- login;
- tracking;
- future diagnostiche;
- runtime identity;
- canonical market identity;
- `trackingSessionId`;
- `commandId`;
- handoff login → tracking;
- un solo comando Betfair mutante globale.

#### Sintesi IMPL-017 — Local control-plane boundary

Impone:

- bind loopback;
- CORS/Origin/Host allow-list;
- route mutanti POST JSON;
- nessuna mutazione GET;
- validazione dei comandi locali.

#### Sintesi IMPL-018 — Betfair acquisition envelope e provenance

Introduce almeno:

```txt
scrapeId
startedAt
completedAt
marketApiAcquiredAt
graphAcquisitions[]
recordedAt
maxGraphSkewMs
matchedValueSource
```

### Estensioni approvate di strutture esistenti

```txt
IMPL-007
→ boundary pubblico Betfair

IMPL-011
→ maintenance authority e retention sicura

IMPL-012
→ fixture Graph skew, provenance e dati mancanti

IMPL-013
→ misure per fase e acquisition timestamps
```

### Test mancanti

#### TEST-010 — Validatore Betfair condiviso

Preflight, Start, login e future diagnostiche devono classificare la stessa URL nello stesso modo.

#### TEST-011 — Parità Graph preflight/runtime

Copertura di host, HTTPS, path `/0`, stesso marketId, selection uniche e URL unsupported.

#### TEST-012 — Un solo comando Betfair globale

Login, tracking e diagnostica non possono usare contemporaneamente lo stesso runtime senza handoff autorizzato.

#### TEST-013 — Endpoint `/odds` rimosso

La route, il response builder e i consumer/test esclusivi non devono restare raggiungibili; `/latest` e `/json` devono restare invariati.

#### TEST-014 — Probe CDP session-owned

`/latest` non deve eseguire fetch verso un `cdpUrl` arbitrario della query.

#### TEST-015 — Network capture bounded

Task tracked, listener rimossi, drain/cancel bounded e summary stabile.

#### TEST-016 — Nessun volume runner sintetico

Dato runner assente → `null/unavailable`; Money Flow soppresso; nessuna divisione del totale mercato.

#### TEST-017 — Acquisition timestamp e Graph skew

Freshness usa acquisizione; skew e reason risultano deterministici.

#### TEST-018 — Retention log/dump e maintenance authority

Porte effettive, authority, recheck metadata e policy separate.

### Decisioni approvate

1. rimozione completa di `/api/betfair/odds`, senza sostituto provvisorio;
2. `IMPL-016`, autorità globale dei comandi Betfair;
3. `IMPL-017`, confine locale delle API di controllo;
4. estensione `CODE-002`, validatore Betfair unico backend-owned;
5. `CODE-006`, parità obbligatoria fra preflight Graph e runtime;
6. CDP health derivata dalla sessione, non dalla query di `/latest`;
7. `IMPL-018`, acquisition envelope e provenance;
8. rimozione completa di `marketTotalMatched / runnerCount`;
9. network capture tracked, bounded e drenata;
10. cache sempre disabilitata nel tracking e hash/provenance nelle future diagnostiche;
11. rimozione dei flag Chromium indebolenti salvo necessità dimostrata;
12. applicazione di `IMPL-011` e retention separata per cache, log e network dump.

### Ordine tecnico risultante

```txt
IMPL-015 — writer authority
→ IMPL-006 — session authority
→ IMPL-017 — local control plane
→ rimozione /odds
→ IMPL-016 — Betfair command authority
→ validatori Betfair/Graph condivisi
→ DATA-001 — rimozione dato sintetico
→ IMPL-018 — provenance temporale
→ network capture e IMPL-007
→ IMPL-011 e retention
→ IMPL-012/013
→ ottimizzazioni future IMPL-014
```

---
