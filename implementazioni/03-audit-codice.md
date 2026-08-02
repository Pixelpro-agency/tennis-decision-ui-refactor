# Tennis Decision UI — Audit del codice

> Contiene i rilievi tecnici iniziali e la mappa di controllo settore per settore.

### RUNTIME-001 — Non riaprire la Task 2 runtime senza una discrepanza concreta

**Stato:** `CONFERMATO`
**Priorità:** regola di controllo
**Area:** launcher e process lifecycle

**Codice già orientato:**

```txt
avvio.py
launcher/app.py
backend/src/server.js
backend/src/runtime/pythonProcessRegistry.js
```

**Osservazione**

La prima scansione conferma:

- lock prima del percorso di riuso;
- ownership distinta tra processi owned e reused;
- Chrome/CDP fuori dall’ownership;
- registry backend-wide dei figli Python;
- scope `tracking`, `login` e `all`;
- shutdown bounded;
- snapshot pubblico ridotto.

**Azione**

La task non deve essere riaperta soltanto perché esistono scenari live ancora non osservati.

**Cosa controllare ancora**

- test automatici;
- corrispondenza completa con i documenti owner;
- scenari live aperti;
- regressioni introdotte da modifiche successive.

**Criterio di riapertura**

Riaprire soltanto in presenza di:

- comportamento attuale contrario al contratto;
- test fallito significativo;
- documentazione che maschera un difetto reale;
- ownership o shutdown non sicuri;
- regressione riproducibile.

---

### CODE-001 — Rimozione della Strategy legacy dal runtime attivo

**Stato:** `APPROVATO`
**Priorità:** media
**Area:** Strategy

**Decisione dell’utente**

Rimuovere dal progetto attivo:

```txt
tre card Strategy
→ vista Lay The Winner
→ polling Strategy
→ route e moduli backend usati esclusivamente da quella superficie
```

Preservare integralmente:

```txt
Match Evidence
Market Reactions
Market → Field
Field → Market
Source Identity
```

Market Reactions non sono Strategy e non devono essere rimosse o inglobate nella task.

**Obiettivo della futura task**

Eliminare la superficie strategica prematura senza cambiare:

- tracking live;
- timeline;
- history;
- Evidence;
- Market Reactions;
- Money Flow;
- Source Identity;
- dashboard non Strategy.

**Regola di scope**

Prima della rimozione l’esecutore deve inventariare i consumer reali e distinguere:

```txt
componenti Strategy esclusivi
da
componenti Market Reactions o Market Evidence riutilizzati altrove
```

Non eliminare una cartella in base al nome se contiene consumer condivisi.

**Conseguenza per CODE-004**

Il problema della porta `localhost:3001` hardcoded viene assorbito dalla rimozione della superficie Strategy. Non preparare una correzione autonoma della porta se il relativo consumer viene eliminato.

**Evoluzione futura**

I concetti strategici restano registrati in `IMPL-010` come strumenti autonomi offline per studio, replay e backtesting, fuori dal runtime live principale.

---

### CODE-002 — Il preflight Betfair accetta host e protocolli non sufficientemente vincolati

**Stato:** `CONFERMATO`

**Priorità:** alta

**Area:** Preflight e coerenza URL Betfair

**Codice coinvolto:**

```txt
backend/src/routes/test.js
backend/src/routes/betfair.js
frontend/src/hooks/usePreflightChecks.js
```

**Osservazione**

`POST /api/test/betfair-url` usa:

```js
/betfair\.\w+$/i
```

sul solo hostname.

Il controllo non impone:

- confine di dominio prima di `betfair`;
- protocollo HTTP/HTTPS;
- lo stesso insieme di host ammesso da `login-window`.

Di conseguenza un host come:

```txt
fakebetfair.com
```

può essere classificato come Betfair, e un URL con protocollo non HTTP può superare la fase di dominio se lo slug contiene l’ID atteso.

`normalizeBetfairLoginTarget`, invece, accetta soltanto `betfair.it` o sottodomini e soltanto HTTP/HTTPS.

**Impatto**

Il frontend può mostrare:

```txt
Betfair URL OK
```

per una URL che il successivo flusso di login o acquisizione non considera valida.

**Azione proposta**

Creare o riusare un validatore condiviso per:

```txt
protocollo
hostname
eventId
normalizzazione
```

e definire esplicitamente i domini supportati.

**Test necessari**

- dominio ufficiale ammesso;
- sottodominio ufficiale ammesso;
- `fakebetfair.com` rifiutato;
- credenziali nella URL rifiutate;
- protocollo non HTTP rifiutato;
- slug senza event ID rifiutato;
- coerenza fra preflight e login-window.

**Criterio di chiusura**

La stessa URL deve ricevere una classificazione compatibile in Preflight, login e tracking.

---

### CODE-003 — Rimozione di `GET /api/match/debug-last`

**Stato:** `APPROVATO`
**Priorità:** media
**Area:** Router Match e debug legacy

**Decisione tecnica**

Rimuovere:

- route `debug-last`;
- stato `lastDebugData`;
- helper e test rimasti utili soltanto a quella route;
- riferimenti documentali.

**Motivo**

Il dato non possiede un producer reale e l’endpoint resta vuoto. Ripristinarlo richiederebbe un nuovo contratto di:

- ownership;
- redazione;
- retention;
- autorizzazione;
- formato pubblico.

Il progetto dispone già di superfici diagnostiche più specifiche.

**Vincoli**

La rimozione non deve modificare:

- Match Analyze;
- tracking;
- timeline/history;
- runtime logger;
- health;
- Evidence.

---

### CODE-004 — La Strategy frontend ignora la porta backend risolta dal launcher

**Stato:** `ASSORBITO DA CODE-001`

**Priorità:** nessuna task autonoma

**Area:** Strategy frontend e runtime locale

**Codice coinvolto:**

```txt
frontend/src/components/LayTheWinner.jsx
frontend/src/App.jsx
launcher/config.py
```

**Osservazione**

La maggior parte del frontend usa route relative:

```txt
/api/...
```

`LayTheWinner.jsx` usa invece:

```js
http://localhost:3001/api/strategy/lay-the-winner
```

Il launcher tratta `3001` come porta preferita e può selezionare una porta alternativa.

**Impatto**

Quando il backend viene avviato su una porta alternativa:

```txt
dashboard principale
→ può continuare a usare il proxy/origine corrente

vista Lay The Winner
→ continua a chiamare localhost:3001
→ errore isolato della Strategy
```

**Azione proposta**

Usare una route relativa:

```txt
/api/strategy/lay-the-winner
```

oppure l’unico meccanismo centralizzato già usato dal resto del frontend.

**Test necessari**

- URL della richiesta senza host hardcoded;
- comportamento con backend su porta alternativa;
- nessuna regressione del polling;
- cleanup dell’intervallo invariato.

**Criterio di chiusura**

Nessuna feature frontend deve dipendere direttamente dalla porta preferita del backend.


## 11. Aree da ricontrollare nel codice

### Root e runtime locale

- [ ] `avvio.py`;
- [ ] `scraper.py`;
- [ ] `betfair_scraper.py`;
- [ ] `launcher/`;
- [ ] `scripts/`;
- [ ] configurazione environment;
- [ ] compatibilità Windows;
- [ ] porte preferite e alternative;
- [ ] lock e manifest;
- [ ] ownership;
- [ ] shutdown.

### Backend

- [-] `server.js` — health e shutdown orientati; audit completo ancora aperto;
- [-] `routes/match.js` — contratto API verificato; `CODE-003`;
- [-] `routes/betfair.js` — contratto API verificato; naming documentale da correggere;
- [-] `routes/evidence.js` — side effect verificati; `DOC-003`;
- [-] `routes/strategy.js` — consumer attivo verificato; `CODE-001`;
- [-] `routes/test.js` — contratto verificato; `CODE-002`;
- [ ] moduli puri delle route;
- [ ] runtime registry;
- [ ] runtime logger;
- [ ] SofaScore;
- [ ] Betfair;
- [ ] Source Identity;
- [ ] history;
- [ ] timeline;
- [ ] journal;
- [ ] recovery;
- [ ] Evidence;
- [-] Market Reactions — core verificato; fallback runner (`EVIDENCE-001`);
- [ ] Strategy;
- [ ] test.

### Frontend

- [ ] `App.jsx`;
- [ ] session state;
- [ ] preflight;
- [ ] start e stop;
- [ ] bootstrap dashboard;
- [ ] polling SofaScore;
- [ ] polling Betfair;
- [ ] polling Evidence;
- [ ] Source Identity UI;
- [ ] Betfair health;
- [ ] dashboard view model;
- [ ] Money Flow;
- [ ] Match Context;
- [ ] Market Reactions;
- [-] Strategy UI — consumer attivo e porta hardcoded verificati; `CODE-004`;
- [ ] componenti placeholder;
- [ ] test puri;
- [ ] build e lint.

### Python e scraper

- [ ] package SofaScore;
- [ ] package Betfair;
- [ ] CLI;
- [ ] CDP;
- [ ] persistent profile;
- [ ] Graph URL;
- [ ] network capture;
- [ ] redazione diagnostica;
- [ ] cache;
- [ ] output JSON;
- [ ] wrapper root;
- [ ] test Python.

---

---

## 12. Rilievi del checkpoint B3

## RUNTIME-002 — Nuovo Start non invalida callback della sessione precedente

**Stato:** `CONFERMATO` tramite analisi statica
**Priorità:** alta
**Area:** tracking, generation, gate e persistenza

### Sequenza

```txt
event A in tracking
→ update A in flight
→ trackMatch(event B)
→ A rimosso da trackedMatches
→ tutti i gate cancellati
→ generation tracking non invalidata
→ update A termina
→ observer A non trova il gate
→ action: no-gate
→ update A persiste
```

### Evidenza

`trackMatch(...)` sostituisce il match e chiama `clearAllSourceIdentityGates()`, ma non invalida la generation e non attende le completion precedenti.

`directFetch` cancella un risultato soltanto quando la generation non è più corrente o viene richiesta la terminazione.

Gli observer senza sessione restituiscono `no-gate`.

`updateSofa` e `updateBetfair` persistono su:

```txt
persist-current
oppure
no-gate
```

### Impatto

Una callback tardiva può scrivere timeline/history del vecchio evento dopo che l’utente ha già avviato una nuova sessione.

### Test richiesto

```txt
Sofa A ritardato
→ Start B
→ resolve A
→ zero observer/persist A

Betfair A ritardato
→ Start B
→ resolve A
→ zero gate/persist A

B
→ continua a funzionare
```

### Alternative future

```txt
A. token di sessione verificato prima di observe/persist
B. invalidazione generation sul cambio sessione
C. stop fisico completo prima del nuovo Start
```

La soluzione va definita in una task separata.

---

## SOFA-001 — Ultimo game point-by-point sempre considerato aperto

**Stato:** `DA VERIFICARE`
**Priorità:** media

`buildRecentCompletedGamesWindow(...)` usa:

```txt
games.slice(-4, -1)
```

L’ultimo game viene escluso sempre, senza un campo esplicito che ne provi lo stato aperto.

Se un payload reale terminasse con un game già completato, il game più recente verrebbe scartato.

### Verifica live

```txt
durante game
subito dopo chiusura
tra due game
inizio set
tie-break
```

Chiudere il rilievo solo dopo aver verificato la forma reale del payload.

---

## TEST-001 — Test dedicato al tick Betfair `status-only`

**Stato:** `CONFERMATO` come gap
**Priorità:** media-alta

Comportamento da proteggere:

```txt
tick precedente
+ graphLoginRequired
+ zero righe Graph
+ regressione
→ tick status-only
```

Il test deve verificare:

- market e runner precedenti conservati;
- Money Flow soppresso;
- `auth_suspected`;
- `statusOnlyGraphLogin:true`;
- history senza sample regressivo;
- baseline invariato;
- regressioni ordinarie ancora `unchanged`.

Il test canonico ispezionato copre regressioni ordinarie, duplicati, cleanup legacy e seq finite, ma non l’intera eccezione logout Graph.

---

## EVIDENCE-001 — `selectionId` obbligatorio solo nel confronto runner Field → Market

**Stato:** `APPROVATO`
**Priorità:** media
**Area:** Market Reactions, ramo Field → Market

**Decisione tecnica**

Quando manca `selectionId`:

```txt
nessun fallback sul nome
→ runner non confrontabile
→ ramo prezzo indisponibile o degradato
→ reason esplicita
```

**Confine fondamentale**

Questa decisione non riguarda:

- il confronto fra URL SofaScore e URL Betfair;
- il Source Identity Gate;
- l’ingresso nella dashboard;
- `collecting`, `pending`, `recording` o `mismatch`;
- la conferma manuale della partita;
- il mapping iniziale dei due giocatori fra le fonti.

Si applica soltanto dopo che la sessione è stata accettata, dentro il confronto temporale dei runner Betfair usato da Field → Market.

**Requisito UX e runtime**

La futura modifica non deve:

- aggiungere un nuovo preflight;
- bloccare Start;
- impedire l’accesso al frontend;
- riportare la sessione a `pending`;
- fermare tracking o scraper;
- rendere indisponibili le altre card;
- modificare Market → Field.

Se manca l’ID, degrada esclusivamente l’osservazione che richiede l’identità runner certa.

**Test richiesti**

```txt
sessione Source Identity recording
+ selectionId mancante nel ramo Field → Market
→ dashboard e tracking restano attivi
→ Field → Market espone unavailable/reason
→ nessun fallback sul nome

selectionId presente
→ confronto invariato
```

---

## Rilievi chiusi senza azione

### `status-only` e regressione

L’helper usa `timelineIntegrity.accepted:false`, ma il processor produce questo stato per regressioni del baseline e la persistence decision applica il controllo Graph-login specifico. Il contratto documentato resta coerente.

### Tracking key

La key viene calcolata prima della classificazione, ma è una trasformazione pura. Il rilievo resta documentale (`DOC-014`).

---

## Stato dopo B3

```txt
SofaScore
→ owner analizzato
→ RUNTIME-002 confermato
→ SOFA-001 da validare

Betfair
→ lifecycle e validità analizzati
→ TEST-001 aperto

Storage/recovery
→ contratti principali coerenti

Evidence/Source Identity
→ contratti principali coerenti
→ EVIDENCE-001 da decidere
```

Prossimo audit:

```txt
B4 — Frontend e Python
```

---

## 13. Rilievi del checkpoint B4

## FRONTEND-001 — Risposte tardive SofaScore e Betfair attraversano il cambio sessione

**Stato:** `CONFERMATO` tramite analisi statica
**Priorità:** alta
**Area:** polling frontend e bootstrap dashboard

### Comportamento

`useMatchPolling(...)` e `useBetfairJson(...)` non possiedono:

```txt
sessionId
requestId
AbortController
controllo eventId prima di setState
```

Al cambio sessione il cleanup cancella il timeout successivo, ma non la richiesta HTTP già in corso.

Una risposta vecchia può quindi eseguire:

```txt
setData
setLastUpdate
setIntegrity
setServerStatus
```

dopo che la nuova sessione ha già azzerato lo stato.

### Interazione con il bootstrap

`useDashboardBootstrapState(...)` considera pronta la dashboard quando osserva:

```txt
reset backendData a null
→ successivo backendData non null
```

Una risposta tardiva del match precedente può diventare quel primo dato non nullo e sbloccare la dashboard con dati vecchi.

### Confronto interno

`useMarketReactionEvidence(...)` e `useSourceIdentityGateStatus(...)` implementano già correttamente:

```txt
session ID
request ID
AbortController
risposte tardive ignorate
```

### Test richiesti

```txt
Sofa A in flight
→ Start B
→ risposta A
→ stato B invariato
→ dashboard non pronta

Betfair A in flight
→ Start B
→ risposta A
→ stato B invariato

risposte B
→ applicate normalmente
```

### Criterio di chiusura

Nessuna richiesta appartenente a un vecchio `eventId` può modificare lo stato della sessione corrente.

---

## FRONTEND-002 — Persistence integrity raccolta dagli hook ma scartata prima della UI

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** App, view model, Betfair UI ed Evidence UI

### SofaScore

`useMatchPolling(...)` espone `integrity`.

`App.jsx` non la destruttura.

### Betfair

`useBetfairJson(...)` espone `integrity`.

`App.jsx` non la destruttura.

### View model

`useDashboardViewModel(...)` non accetta integrity e non produce un persistence view state.

### Betfair UI

`OverviewDashboard` e `BetfairDepthCard` non ricevono integrity o server status Betfair.

### Evidence

`useMarketReactionEvidence(...)` conserva soltanto:

```txt
payload.latest.marketReactionEvidence
```

Non conserva il payload Evidence completo.

### Impatto

La UI non può mostrare in modo generale:

- `partial_persistence`;
- `recovery_failed`;
- sorgente coinvolta;
- stato persistence separato da health;
- top-level integrity Evidence.

Il backend continua a bloccare Market Reactions non utilizzabili, ma il contratto informativo dichiarato non è disponibile.

### Criterio di chiusura

Una pipeline esplicita e testata deve portare integrity dagli hook ai consumer senza riclassificarla come health o Source Identity.

---

## FRONTEND-003 — Start fallito lascia una sessione confermata e polling nascosti

**Stato:** `CONFERMATO` tramite analisi statica
**Priorità:** medio-alta
**Area:** sessione e azioni Start

### Sequenza

`handleSearch(...)` esegue prima della richiesta:

```txt
applySearchSession
→ sessionShellVisible true
→ beginDashboardBootstrap
```

Se `startMatchTracking(...)` fallisce, il catch esegue soltanto:

```txt
resetDashboardBootstrap
→ sessionShellVisible false
```

Non esegue:

```txt
clearConfirmedSession
stopSofaPolling
disable Betfair polling
disable Evidence polling
```

### Effetto

Il form torna visibile, ma `confirmedUrl` e `sofaEventId` restano valorizzati.

Gli hook montati in `App.jsx` possono quindi continuare a interrogare:

```txt
/api/match/:eventId/json
/api/betfair/:eventId/latest
/api/evidence/:eventId/latest
```

anche se la sessione backend non è partita.

### Requisito UX

Gli input correnti devono essere preservati. Questo non richiede di mantenere anche la sessione confermata.

### Test richiesto

```txt
startMatchTracking rigetta
→ form visibile
→ input correnti preservati
→ confirmed session disattivata
→ nessun polling attivo
```

---

## FRONTEND-004 — Copy mojibake renderizzato nella UI

**Stato:** `CONFERMATO`
**Priorità:** media
**Area:** form e Preflight

File confermati:

```txt
frontend/src/hooks/usePreflightChecks.js
frontend/src/components/StartAnalysisPanel.jsx
```

Stringhe presenti:

```txt
âEUR”
ModalitÃ 
```

`PreflightChecks.jsx` stampa direttamente `checks[key].message`.

`StartAnalysisPanel.jsx` stampa direttamente l’etichetta corrotta.

### Correzione

Ripristinare caratteri UTF-8 corretti e aggiungere un controllo testuale mirato o una scansione repository per sequenze mojibake note.

---

## CLEANUP-001 — Una sola authority Source Identity globale

**Stato:** `APPROVATO`
**Priorità:** media-bassa
**Area:** cleanup frontend

**Decisione dell’utente**

L’unica authority UI deve essere:

```txt
useSourceIdentityGateUi
→ status globale
→ conferma gate-aware
→ mismatch
→ waiting screen
→ ritorno al form
```

Market Reactions può consumare l’esito Source Identity, ma non deve possedere una conferma o revoca concorrente.

**Rimozione futura**

Dopo la verifica finale dei consumer:

- rimuovere `confirmSourceIdentity` e `revokeSourceIdentityConfirmation` da `useMarketReactionEvidence`;
- rimuovere il componente legacy non montato;
- rimuovere test o documentazione esclusivi del flusso duplicato;
- conservare il polling Evidence read-only.

**Vincoli**

Non modificare:

- endpoint di conferma reale;
- confirmation store;
- gate backend;
- modale globale;
- comportamento mismatch;
- Market Reactions come osservazioni.

---

## SECURITY-001 — `network_capture.dump_dir` esposto da `/api/betfair/odds`

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** diagnostica Python e serializzazione HTTP

### Traccia

```txt
network_capture.py
→ summarize_network_capture
→ dump_dir: path locale

scrape_betfair
→ results.network_capture

processor.js
→ processedResult.network_capture invariato

oddsResponse.js
→ JSON.stringify(data)
→ risposta HTTP
```

Quando `networkCapture=true`, il client può ricevere un percorso filesystem locale.

### Correzione

Applicare un serializer pubblico allow-list oppure rimuovere `dump_dir` dal risultato pubblico.

Il path può restare disponibile soltanto in diagnostica interna redatta e non esposta.

### Test richiesto

```txt
fetch result contiene dump_dir locale
→ response pubblica non contiene il path
→ contatori diagnostici non sensibili preservati
```

---

## SECURITY-002 — Cache filename Betfair derivato dalla URL completa

**Stato:** `CONFERMATO` tramite analisi statica
**Priorità:** alta
**Area:** cache Python

### Traccia

```txt
normalize_betfair_url(url)
→ conserva query non incluse nella breve deny-list

get_cache_key(url)
→ sostituisce caratteri non alfanumerici
→ tronca a 100 caratteri
→ usa il risultato nel filename
```

Un token o identificatore sensibile composto da caratteri alfanumerici può quindi comparire nel nome del file, anche quando il contenuto JSON viene redatto.

Il test cache esistente verifica il contenuto, non il filename con query sensibile.

### Correzione

Usare:

```txt
identità business non sensibile
oppure
hash crittografico della URL normalizzata
```

Il test deve cercare il marker segreto sia nel contenuto sia nei nomi dei file.

---

## SECURITY-003 — Dettagli raw dell’errore ritornati dalle route HTTP

**Stato:** `CONFERMATO` come contratto permissivo
**Priorità:** media
**Area:** Match Analyze e Betfair Odds

`/api/betfair/odds` restituisce:

```txt
details: error.message
```

Il test corrente richiede esplicitamente la conservazione del dettaglio.

`/api/match/analyze` restituisce:

```txt
error: message
```

Il messaggio può provenire dal percorso SofaScore che usa anche `str(error)`.

### Rischio

Messaggi Playwright, filesystem, runtime o URL possono raggiungere il client.

Non è stato osservato un segreto reale nella repository; il problema è il contratto pubblico non limitato.

### Correzione

```txt
client
→ errore statico e code stabile

log interno
→ dettaglio redatto e bounded
```

---

## PYTHON-001 — Task della network capture non tracciate né attese

**Stato:** `CONFERMATO` tramite analisi statica
**Priorità:** media
**Area:** network capture Betfair

`install_network_capture(...)` crea task con:

```python
asyncio.create_task(handle_network_response(...))
```

senza conservarne il riferimento.

`scrape_betfair(...)` chiude il context e costruisce subito:

```txt
summarize_network_capture(collector)
```

Le task ancora pendenti possono:

- terminare dopo il summary;
- essere cancellate alla chiusura di `asyncio.run`;
- produrre conteggi incompleti;
- lasciare scritture diagnostiche non sincronizzate.

### Correzione

```txt
task set per collector
→ cleanup automatico task concluse
→ gather bounded prima del summary
→ errori raccolti nel collector
```

La capture live ordinaria è disabilitata, ma il percorso opt-in deve restare deterministico.

---

## TEST-002 — Copertura lifecycle hook e cambio sessione

**Stato:** `CONFERMATO` come gap
**Priorità:** alta

I test ispezionati di `useMatchPolling` e `useBetfairJson` verificano helper puri:

- classificazione status;
- timestamp;
- normalizzazione payload;
- recognition dell’errore integrity.

Non verificano:

```txt
eventId A → eventId B
response A tardiva
AbortController
unmount
polling stop
Start fallito
bootstrap dashboard
```

La futura task frontend deve introdurre un harness per gli hook o estrarre un controller di sessione testabile.

---

## Aree B4 coerenti da preservare

### Proxy dinamico

```txt
launcher
→ VITE_BACKEND_TARGET sulla porta reale
→ Vite proxy /api
→ client frontend relativi
```

### Source Identity UI

Il polling gate possiede già isolamento per sessione e richiesta.

### Money Flow

La UI associa history tramite `selectionId`, usa 20 slot e non rappresenta punti invalidi come volume.

### Match Context

La card valida il payload ricevuto e non ricalcola dati sportivi.

### Wrapper Python

`avvio.py`, `scraper.py` e `betfair_scraper.py` restano sottili.

### Graph URL

Parser, mapping, duplicati e assenza di fallback per nome risultano coerenti.

---

## Stato dopo B4

```txt
Frontend
→ quattro difetti confermati
→ un cleanup candidate
→ test lifecycle aperto

Python
→ runtime principale coerente
→ due gap di hardening
→ una race diagnostica
→ Graph URL coerente
```

Prossimo audit:

```txt
B5 — Operations e roadmap
```

---

## 14. Rilievi del checkpoint B5

## CLEANUP-002 — Offline check limitato a lock e porte preferite

**Stato:** `CONFERMATO` tramite analisi statica
**Priorità:** media
**Area:** retention cache runtime

`check_apply_session_safety(...)` blocca l’apply quando esiste il lock launcher, quando è occupata la porta 3000 o 3001, oppure quando un controllo fallisce.

Il launcher può usare porte alternative. La utility non legge manifest, `selectedPort`, health backend, identity frontend o registry processi.

Scenario residuo:

```txt
lock assente
+ backend/frontend manuale o residuo su porta alternativa
→ 3000 e 3001 libere
→ apply considerato offline
```

Prima di `unlink`, la utility ricontrolla soltanto che il path sia un file regolare non symlink. Non confronta mtime, dimensione o identità con lo scan iniziale.

Correzione proposta:

```txt
lock assente
+ manifest assente o positivamente stale
+ endpoint selezionati non raggiungibili
+ metadata invariati prima di unlink
```

Non introdurre kill-by-port o process discovery generica.

Test richiesti:

```txt
backend manuale su 3002
frontend manuale su 3003
manifest con selectedPort alternativo
file modificato dopo scan
```

In tutti i casi l’apply deve essere bloccato o il file cambiato deve essere saltato.

---

## Verifiche senza nuovo difetto di codice

Il journal usa correttamente `backend/match_history/.pending_commits/`; il problema è documentale.

Launcher, proxy dinamico, ownership selettiva e CDP senza fallback implicito restano coerenti.

Non sono state trovate implementazioni parziali canoniche di Replay o Market Reactions Journal.

---

## Stato dopo B5

```txt
Operations
→ cleanup offline incompleto registrato

Roadmap
→ Current State non affidabile
→ Replay futura
→ Market Reactions Journal futura

Codice
→ nessuna modifica
→ test non eseguiti
```

Prossimo audit:

```txt
B6 — Controlli trasversali
```

---

## 15. Rilievi del checkpoint B6

## CODE-005 — Script `lint` frontend esposto ma privo di configurazione utilizzabile

**Stato:** `CONFERMATO`
**Priorità:** bassa
**Area:** tooling frontend

`frontend/package.json` espone:

```txt
npm run lint
```

La documentazione operativa dichiara invece di non eseguirlo perché il repository non contiene una configurazione ESLint.

Nei percorsi standard controllati non risultano:

```txt
frontend/eslint.config.js
frontend/eslint.config.mjs
frontend/.eslintrc
frontend/.eslintrc.js
frontend/.eslintrc.cjs
frontend/.eslintrc.json
```

Impatto:

- comando apparentemente supportato ma non affidabile;
- task esecutive possono usarlo come controllo e ottenere un fallimento infrastrutturale;
- la Todo deve distinguere lint assente da lint fallito sul codice.

Alternative:

```txt
A. aggiungere una configurazione minima realmente usata
B. rimuovere script e dipendenze ESLint inutilizzate
```

---

## TEST-003 — Nessun inventario o comando test canonico

**Stato:** `CONFERMATO`
**Priorità:** media-alta
**Area:** infrastruttura test

`backend/package.json` non contiene uno script `test`.

`frontend/package.json` non contiene uno script `test`.

I test Node vengono eseguiti come file singoli e i test Python come moduli unittest separati.

Il runbook Validation mantiene manualmente elenchi molto lunghi di file.

Impatto:

- rinomine possono lasciare il runbook obsoleto;
- non esiste un comando unico che dimostri la suite prevista;
- un test presente può non essere incluso nella lista manuale;
- non è immediato distinguere suite minima, estesa e live;
- controlli statici possono fermarsi su una facade.

Azione:

```txt
IMPL-003
→ inventario verificabile
→ eventuali comandi offline aggregati
```

I comandi aggregati non devono includere browser reale, tracking live, endpoint distruttivi o credenziali.

---

## 15.1 Priorità tecniche dopo l’audit

### Priorità 1 — isolamento sessione e dati correnti

```txt
RUNTIME-002
FRONTEND-001
FRONTEND-003
TEST-002
```

Una callback o risposta tardiva può attraversare il cambio sessione e uno Start fallito può lasciare polling non visibili.

### Priorità 2 — superfici pubbliche e diagnostica

```txt
SECURITY-001
SECURITY-002
SECURITY-003
PYTHON-001
```

### Priorità 3 — persistence integrity frontend

```txt
FRONTEND-002
DOC-018
DOC-022
```

Prima definire il contratto UI, poi collegare hook, App, view model e componenti.

### Priorità 4 — difetti circoscritti

```txt
CODE-002
CODE-004
FRONTEND-004
CLEANUP-002
CODE-005
```

### Decisioni prima della task

```txt
CODE-001
→ Strategy resta o viene rimossa?

CODE-003
→ debug-last va ripristinato o eliminato?

EVIDENCE-001
→ selectionId obbligatorio o fallback nome degradato?

CLEANUP-001
→ authority frontend legacy da rimuovere?
```

### Validazioni separate

```txt
SOFA-001
TEST-001
```

Non promuovere `SOFA-001` a bug prima della verifica live.

---

## 15.2 Esito audit codice

```txt
analisi statica per settori
→ completata

bug confermati
→ registrati e prioritizzati

decisioni
→ separate dai bug

test gap
→ separati dalle validazioni live

codice modificato
→ nessuno

suite eseguite
→ nessuna nel checkpoint read-only
```

## 15. Decisione UI persistence

**Stato:** `APPROVATO`

La futura UI deve avere entrambi i livelli:

```txt
stato locale
→ nella card o settore coinvolto

stato globale
→ indicatore in fondo alla sidebar
→ click apre una modale di controllo complessivo
```

La TopBar resta dedicata principalmente a SofaScore e Betfair.

Il pannello globale deve mostrare separatamente almeno:

- SofaScore;
- Betfair;
- Source Identity;
- persistence SofaScore;
- persistence Betfair;
- Evidence;
- Market Reactions;
- runtime/scraper quando disponibili.

Colori:

```txt
verde  → coerente
giallo → degradato o incompleto
rosso  → bloccante
grigio → non inizializzato o non applicabile
```

Non fondere persistence, health, freshness e Source Identity in un unico stato semantico.

## 15.1 Backlog UI non prioritario

```txt
[ ] piccole correzioni e rimozioni UI residue
[ ] audit e implementazione responsive
```

Questi punti non devono ampliare le prime task di robustezza.

---

## 16. Secondo audit del codice — Punto 1: entry point, launcher e autorità runtime

**Baseline:** `dda406c4a07ae4a1debfcab39db346e47c33c419`

### Esito launcher

Restano confermati:

- wrapper `avvio.py` sottile;
- lock launcher prima del riuso;
- classificazione conservativa del lock;
- fingerprint del processo contro PID riciclati;
- massimo cinque porte candidate;
- riuso soltanto dopo verifica identità;
- ownership limitata a backend/frontend avviati;
- Chrome/CDP non owned;
- nessun kill-by-port;
- shutdown idempotente;
- recovery prima di `listen`.

Non è stata trovata una ragione per riaprire il lifecycle del launcher.

### RUNTIME-003 — Gli avvii manuali aggirano l’autorità del launcher

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** backend bootstrap e persistenza canonica

Percorsi pubblici:

```txt
node backend/src/server.js
npm start
npm run dev
scripts/start-backend-dev.ps1
```

entrano in `startServer()` senza acquisire il lock launcher e senza acquisire una writer authority specifica.

Due backend possono quindi vivere su porte differenti e condividere:

```txt
backend/match_history
backend/match_history/.pending_commits
```

Il problema non è il contenuto parziale del singolo file: le scritture atomiche lo proteggono. Il problema è la concorrenza logica tra due processi con:

- recovery separate;
- mappe runtime separate;
- journal osservati in momenti differenti;
- commit distinti;
- rinomina concorrente sullo stesso target;
- tracking e processi Python separati.

### DOC-024 — Ownership del processo e autorità sulla persistenza sono concetti distinti

**Stato:** `CONFERMATO`

La documentazione runtime descrive correttamente:

```txt
launcher
→ ownership dei processi avviati
```

ma non formalizza:

```txt
backend writer authority
→ diritto esclusivo di recovery e scrittura canonica
```

La futura riscrittura deve esplicitare che:

```txt
process ownership
≠
persistence authority
```

### TEST-004 — Manca il test di esclusione tra due backend writer

**Stato:** `CONFERMATO`

Scenario minimo:

```txt
backend A
→ acquisisce writer authority

backend B
→ tenta startup
→ non esegue recovery
→ non apre la porta
→ restituisce/logga reason strutturata

backend A termina
→ authority rilasciata

backend C
→ può acquisire authority e avviarsi
```

Devono essere coperti anche:

- lock stale positivamente verificato;
- lock non verificabile fail-closed;
- import del server senza acquisizione;
- failure durante recovery;
- shutdown e rilascio idempotente.

### Decisione approvata

```txt
un solo backend writer per repository
→ writer lock esclusivo backend-owned
→ acquisito prima di recovery e listen
→ secondo backend bloccato
→ launcher lock mantenuto separato
```

Non introdurre:

- multi-writer;
- backend secondario read-only;
- lock basato soltanto sulla porta;
- riuso automatico del lock launcher come writer authority.

### Ordine tecnico della futura task

```txt
create backend identity
→ acquire writer authority
→ recovery
→ listen
→ runtime attivo
→ shutdown
→ stop tracker/processi Python
→ close server
→ release writer authority
```

Un fallimento prima di `listen` deve rilasciare soltanto l’autorità posseduta dalla stessa identità.

---

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

### RUNTIME-002 — Il nuovo Start non invalida la sessione precedente

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

### FRONTEND-001 — Risposte SofaScore e Betfair attraversano il cambio sessione

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

### FRONTEND-003 — Start fallito lascia una sessione nascosta

**Stato:** `CONFERMATO`
**Priorità:** alta

Il frontend conferma URL e apre la session shell prima della risposta di `POST /track`.

In caso di failure non:

- cancella la sessione confermata;
- ferma tutti i poller;
- resetta Betfair/Evidence;
- invalida il comando Start;
- esegue cleanup compensativo quando necessario.

### FRONTEND-005 — I vecchi loop di polling possono ricrearsi dopo il cleanup

**Stato:** `CONFERMATO`
**Priorità:** critica

I loop SofaScore e Betfair fanno:

```txt
await fetchData(...)
→ setTimeout(loop)
```

Il cleanup cancella il timeout noto, ma una fetch già in attesa può programmare un nuovo timeout dopo il cleanup.

Il ref `shouldPoll` è condiviso: un nuovo Start può riportarlo a `true` e riattivare anche il vecchio loop.

### FRONTEND-006 — Start concorrenti non sono serializzati

**Stato:** `CONFERMATO`
**Priorità:** alta

Il pulsante Start usa `sofaLoading`, che appartiene al polling timeline e non al comando `POST /track`.

Mancano:

- `startPending`;
- command ID;
- deduplicazione;
- invalidazione esplicita del comando precedente.

### FRONTEND-007 — Stop Live Tracking lascia attivi altri poller

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

#### TEST-002 — Lifecycle frontend

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

### CODE-002 — Validazione Betfair non condivisa

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

### PYTHON-001 — Network capture asincrona non controllata

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

### SECURITY-002 — Cache con filename e identità inadeguati

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

### CLEANUP-002 — Authority offline incompleta

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta

L’utility è prudente su allow-list, symlink, ricorsione e dry-run, ma l’`apply` controlla soltanto:

- lock launcher;
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

#### IMPL-016 — Betfair runtime command authority

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

#### IMPL-017 — Local control-plane boundary

Impone:

- bind loopback;
- CORS/Origin/Host allow-list;
- route mutanti POST JSON;
- nessuna mutazione GET;
- validazione dei comandi locali.

#### IMPL-018 — Betfair acquisition envelope e provenance

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
