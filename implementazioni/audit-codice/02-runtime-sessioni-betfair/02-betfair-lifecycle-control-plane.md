> **Parte 2 di 7 — Punto 3: Betfair Lifecycle / Control Plane**
> [Facade](../02-runtime-sessioni-betfair.md) · [Parte 1](../01-rilievi-iniziali.md) · [Punto 2](01-session-authority-start-stop.md) · [Parte 3](../03-storage-recovery.md)

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
**Stato corrente:** `RISOLTO`

La route e il response builder non sono più presenti. Restano le superfici di lettura `/:eventId/latest` e `/:eventId/json`, il log bounded e la login window tramite POST.

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
**Stato corrente:** `APERTO`

Gli scraper tracking sono coordinati per chiave e `trackingSessionId`; login e tracking mantengono però registri distinti e non condividono un arbitro globale.

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
**Stato corrente:** `PARZIALMENTE RISOLTO`

`localHttpBoundary` verifica Host e Origin locali e il server usa il bind loopback. Le mutazioni non usano GET; oltre alle route POST JSON resta però `DELETE /api/evidence/:eventId/source-identity/confirm` per la revoca, quindi il vincolo storico «route mutanti solo POST JSON» non è applicato integralmente.

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
**Stato corrente:** `PARZIALMENTE RISOLTO`

`classifyBetfairUrl(...)` è condiviso da Start, login window e preflight backend. Le superfici applicano però opzioni differenti: Start e login consentono l’input vuoto, mentre il preflight richiede un eventId estraibile. Il validatore è unico, ma il contratto di accettazione non è ancora identico.

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
**Stato corrente:** `APERTO`

Il preflight ora impone HTTPS, host esatto, assenza di porta e credenziali, path `/0` e selection uniche. Continua però a restituire `ok: true` quando `sameMarket` è falso; il runtime verifica invece il market ID contro il mercato API.

Nel checkpoint, il preflight Graph accettava casi che lo scraper rifiutava:

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
**Stato corrente:** `APERTO`

`GET /api/betfair/:eventId/latest` continua a leggere `mode` e `cdpUrl` dalla query e il frontend continua a costruire tali parametri dalla configurazione confermata.

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
**Stato corrente:** `RISOLTO`

Il fallback sintetico non è più presente. Il volume runner deriva dalle sorgenti runner osservate oppure resta `null`; Money Flow viene soppresso con `runner_matched_unavailable` quando il dato necessario manca.

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
**Stato corrente:** `APERTO`

Non risulta un acquisition envelope canonico con `scrapeId`, timestamp per fase, `graphAcquisitions[]` e `maxGraphSkewMs`.

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
**Stato corrente:** `PARZIALMENTE RISOLTO`

Le task vengono registrate e limitate, il drain è bounded e i residui vengono cancellati. Non risulta una rimozione esplicita del listener `response` nel percorso CDP, nel quale il context resta aperto.

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
**Stato corrente:** `RISOLTO` per le route correnti

La rimozione di `/odds` elimina la superficie che serializzava il payload capture. La route log restituisce soltanto righe bounded e uno stato; gli errori pubblici usano codici stabilizzati.

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
**Stato corrente:** `RISOLTO`

La chiave cache usa SHA-256 su URL normalizzata, request identity e versione schema. Il tracking canonico forza `noCache: true`.

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
**Stato corrente:** `RISOLTO`

I flag `--no-sandbox`, `--disable-setuid-sandbox` e `--ignore-certificate-errors` non sono presenti nel profilo Persistent; i test del contratto runtime ne verificano l’assenza.

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
**Stato corrente:** `APERTO`

L’utility resta allow-list, non ricorsiva, prudente sui symlink e dry-run per default. L’apply controlla ancora lock e porte locali fisse e non è integrato con una maintenance authority o con la writer authority del runtime.

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
**Stato corrente:** `APERTO`

`cleanup_runtime_cache.py` copre le cache JSON allow-list, non `betfair_scraper.log` e network dump.

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

**Stato corrente:** `PARZIALMENTE COPERTO`

Preflight, Start, login e future diagnostiche devono classificare la stessa URL nello stesso modo.

#### TEST-011 — Parità Graph preflight/runtime

**Stato corrente:** `PARZIALMENTE COPERTO`

I test confermano i vincoli di formato e selection, ma confermano anche `ok: true` per URL appartenenti a mercati differenti.

Copertura di host, HTTPS, path `/0`, stesso marketId, selection uniche e URL unsupported.

#### TEST-012 — Un solo comando Betfair globale

**Stato corrente:** `MANCANTE`

Login, tracking e diagnostica non possono usare contemporaneamente lo stesso runtime senza handoff autorizzato.

#### TEST-013 — Endpoint `/odds` rimosso

**Stato corrente:** `SUPERFICIE RIMOSSA`

La route, il response builder e i consumer/test esclusivi non devono restare raggiungibili; `/latest` e `/json` devono restare invariati.

#### TEST-014 — Probe CDP session-owned

**Stato corrente:** `MANCANTE`

`/latest` non deve eseguire fetch verso un `cdpUrl` arbitrario della query.

#### TEST-015 — Network capture bounded

**Stato corrente:** `PARZIALMENTE COPERTO`

Sono coperti task registry, limiti, drain e cancel; non risulta una verifica del detach esplicito del listener nel percorso CDP.

Task tracked, listener rimossi, drain/cancel bounded e summary stabile.

#### TEST-016 — Nessun volume runner sintetico

**Stato corrente:** `COPERTO`

Dato runner assente → `null/unavailable`; Money Flow soppresso; nessuna divisione del totale mercato.

#### TEST-017 — Acquisition timestamp e Graph skew

**Stato corrente:** `MANCANTE`

Freshness usa acquisizione; skew e reason risultano deterministici.

#### TEST-018 — Retention log/dump e maintenance authority

**Stato corrente:** `MANCANTE`

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
