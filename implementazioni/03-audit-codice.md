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

**Stato:** `CONFERMATO E AMPLIATO`

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

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica
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

## Decisione iniziale collegata a EVIDENCE-001 — `selectionId` obbligatorio solo nel confronto runner Field → Market

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

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica
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

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica
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

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica
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

**Stato:** `CONFERMATO E AMPLIATO`
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

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta
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

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta
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

**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** media
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

## Nota iniziale collegata a TEST-003 — Nessun inventario o comando test canonico

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

**Stato:** `COMPLETATO SU f86ac26`
**Priorità:** alta
**Area:** backend bootstrap e persistenza canonica

Percorsi pubblici:

```txt
node backend/src/server.js
npm start
npm run dev
scripts/start-backend-dev.ps1
```

prima di IMPL-015 entravano in `startServer()` senza acquisire il lock launcher e senza acquisire una writer authority specifica.

Il rischio storico era che due backend potessero vivere su porte differenti e condividere:

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

**Stato:** `COMPLETATO DAL RIALLINEAMENTO DOCUMENTALE IMPL-015`

La documentazione runtime descrive correttamente:

```txt
launcher
→ ownership dei processi avviati
```

ma prima del riallineamento IMPL-015 non formalizzava:

```txt
backend writer authority
→ diritto esclusivo di recovery e scrittura canonica
```

Il riallineamento IMPL-015 esplicita ora che:

```txt
process ownership
≠
persistence authority
```

### TEST-004 — Esclusione tra due backend writer

**Stato:** `IMPLEMENTATO E PASSATO`

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

I test implementati coprono anche:

- lock stale positivamente verificato;
- lock non verificabile fail-closed;
- import del server senza acquisizione;
- failure durante recovery;
- shutdown e rilascio idempotente.

### Decisione implementata

```txt
un solo backend writer per repository/storage identity
→ writer authority esclusiva backend-owned
→ acquisita prima di recovery e listener readiness
→ secondo backend bloccato
→ launcher lock mantenuto separato
```

Non sono stati introdotti:

- multi-writer;
- backend secondario read-only;
- lock basato soltanto sulla porta;
- kill del writer esistente;
- riuso del launcher lock come writer authority.

### Esito implementazione IMPL-015

```txt
Prompt 1
→ modulo matchHistoryWriterAuthority
→ repository identity e storage identity
→ classificazione owner active / dead / unknown
→ acquire e release serializzati

Prompt 2
→ authority creata in startServer()
→ acquire prima della recovery
→ listener readiness reale
→ release nei failure path del bootstrap
→ integrazione nello shutdown

Fix 1
→ registro process-local delle operazioni tracker
→ terminal tracker barrier
→ tracker drain prima del release
→ authority retained su drain failure
→ force timeout senza release anticipato
```

File implementati e verificati:

```txt
backend/src/runtime/matchHistoryWriterAuthority.js
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.js
backend/src/server.test.mjs
backend/src/sofa/matchTracker.js
backend/src/sofa/matchTracker.test.mjs
```

Commit:

```txt
ac0361ef720831173619636b8ce0057348282fa4
f86ac267919ca13859c98db7015362f26176ba36
```

Test automatici:

```txt
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
falliti: 0
```

Limite verificato:

```txt
collaudo manuale con due backend reali concorrenti
→ non eseguito
```

RUNTIME-002 e gli altri finding della session authority restano invariati.

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

#### Riferimento audit a IMPL-016 — Betfair runtime command authority

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

#### Riferimento audit a IMPL-017 — Local control-plane boundary

Impone:

- bind loopback;
- CORS/Origin/Host allow-list;
- route mutanti POST JSON;
- nessuna mutazione GET;
- validazione dei comandi locali.

#### Riferimento audit a IMPL-018 — Betfair acquisition envelope e provenance

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

## 19. Secondo audit del codice — Punto 4: storage, journal e recovery

**Baseline:** `d797d0ee9ec70d4b2f85f6aa51b91af8f71227a1`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
backend/src/server.js
backend/src/sofa/matchHistory.js
backend/src/sofa/timelineStore.js
backend/src/sofa/matchTracker.js
backend/src/sofa/trackerUpdate.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/matchHistory/commitId.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/commitJournal/store.js
backend/src/sofa/matchHistory/commitJournal/filesystemStore.js
backend/src/sofa/matchHistory/commitJournal/recordSchema.js
backend/src/sofa/matchHistory/commitJournal/recordValidation.js
backend/src/sofa/matchHistory/commitJournal/recordFactory.js
backend/src/sofa/matchHistory/commitJournal/recoveryScanner.js
backend/src/sofa/matchHistory/commitJournal/integrity.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/matchHistory/sofaUpdates/handler.js
backend/src/sofa/matchHistory/sofaUpdates/journalWorkflow.js
backend/src/sofa/matchHistory/sofaUpdates/recovery.js
backend/src/sofa/matchHistory/sofaUpdates/historyDocument.js
backend/src/sofa/matchHistory/sofaUpdates/timelineDocument.js
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/processor/persistenceDocuments.js
backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js
backend/src/sofa/betfair/processor/journalRecovery.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js
backend/src/routes/match/readResponses.js
test collegati già presenti nel repository
```

L’analisi è statica. Le suite non sono state rieseguite in questo checkpoint.

### Parti confermate come solide

#### Scrittura atomica del singolo file

History, timeline, journal e archivio delle conferme Source Identity usano il modello:

```txt
file temporaneo
→ scrittura JSON completa
→ rename sul target
→ cleanup del temporaneo in caso di errore
```

Questa proprietà protegge il singolo file da una normale scrittura parziale del processo e va preservata.

#### Ordine journalizzato dei commit canonici

SofaScore e Betfair seguono entrambi:

```txt
preparazione history e timeline
→ journal pending con i due payload
→ write history
→ mark history complete
→ write timeline
→ mark timeline complete
→ remove journal
```

Il payload di riparazione viene quindi persistito prima dei due target canonici.

#### Recovery prima del listen

Il bootstrap esegue `runPendingCommitRecovery(...)` prima di aprire la porta HTTP.

Il Punto 1 aggiunge il vincolo ulteriore:

```txt
writer authority
→ recovery
→ listen
```

La recovery non deve essere spostata dopo il listen.

#### Schema journal conservativo

Il journal verifica:

- source ed eventId;
- commitId compatibile con filename;
- struttura history/timeline;
- valori JSON finiti;
- assenza di concetti sensibili nelle chiavi;
- query sensibili;
- network capture limitata a summary allow-list.

Queste difese restano valide e devono essere mantenute nella futura evoluzione dello schema.

#### Integrity dei pending validi

Quando esiste un record journal valido e attivo, il sistema distingue:

```txt
partial_persistence
recovery_failed
no_known_partial
```

ed espone source, commitId e documenti coinvolti.

Il limite è che questo stato descrive soltanto i partial riconosciuti dal journal valido e non dimostra da solo la salute dei documenti canonici.

### STORAGE-001 — Autorità source-scoped su una history event-scoped

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** shared history, journal SofaScore/Betfair e recovery

La history aggregata è un solo documento per evento.

SofaScore e Betfair:

- leggono l’intero documento;
- costruiscono una nuova copia;
- aggiungono la propria riga;
- riscrivono il documento completo.

Il journal blocca invece i pending per:

```txt
eventId + source
```

Un pending SofaScore non blocca quindi automaticamente un commit Betfair dello stesso evento e viceversa.

#### Scenario di lost update

```txt
history H0

Sofa prepara H0 + S1
→ journal Sofa pending
→ write history fallisce

Betfair non vede pending Betfair
→ legge H0
→ scrive H0 + B1

retry/recovery Sofa
→ riproduce payload H0 + S1
→ B1 viene perso
```

Il rename atomico non risolve questo scenario: il problema è la base obsoleta del documento completo.

#### Decisione approvata

```txt
qualsiasi pending che coinvolge la shared history
→ blocca nuovi commit SofaScore e Betfair dello stesso evento
```

Prima di preparare un nuovo documento:

```txt
find active event commit
→ recover/resolve
→ verify current revision
→ prepare next commit
```

La struttura è registrata come `IMPL-019`.

### STORAGE-002 — I flag completed dei record parziali vengono considerati sufficienti

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** bootstrap recovery e repair SofaScore/Betfair

La recovery verifica entrambi i target quando il record dichiara history e timeline complete.

Quando il record è parziale, per esempio:

```txt
history.completed = true
timeline.completed = false
```

il repair si fida del flag history, salta la verifica e tenta soltanto la timeline.

Scenario:

```txt
history marked complete
→ history cancellata o corrotta
→ timeline ancora pending
→ restart
→ timeline riparata
→ journal rimosso
→ history assente o invalida
```

#### Decisione approvata

Ogni documento marcato complete deve essere verificato indipendentemente dallo stato dell’altro.

```txt
completed:true
→ verify target
→ target non valido
→ mark incomplete
→ rewrite dal payload
→ verify nuovamente
```

### STORAGE-003 — La verifica target prova soltanto JSON.parse

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** target verification

Il controllo attuale accetta come sano qualsiasi file leggibile e parseabile come JSON.

Non dimostra:

- tipo del documento;
- schema;
- eventId;
- source o natura aggregate;
- revisione;
- head commit;
- corrispondenza con il payload journalizzato.

Un oggetto JSON valido ma estraneo può quindi soddisfare la verifica.

#### Decisione approvata

Il contratto minimo dei documenti canonici deve includere:

```txt
documentType
schemaVersion
eventId
source: sofa | betfair | aggregate
revision
headCommitId
createdAt
updatedAt
```

Il journal deve aggiungere:

```txt
payloadDigest
expectedBaseRevision
```

La recovery accetta il target soltanto dopo la verifica di identità, schema, revisione e digest.

La struttura è registrata come `IMPL-020`.

### STORAGE-004 — Journal invalido non attribuibile nascosto dall’integrity

**Stato:** `CONFERMATO; POLICY APPROVATA`
**Priorità:** critica
**Area:** journal scanner, bootstrap e integrity globale

Lo scanner distingue:

```txt
record valido
record invalido ma identificabile
entry invalida non attribuibile
```

Le entry non attribuibili:

- vengono contate nel summary;
- non possiedono eventId/source affidabili;
- non entrano nell’integrity della partita;
- non rendono necessariamente fatal il bootstrap;
- possono coesistere con `no_known_partial`.

Inoltre il bootstrap registra oggi `recovery_complete` con `ok:true` per ogni risultato non fatal, senza riportare nel log principale pending, invalid journal o recovery failure.

#### Decisione approvata

Un journal invalido non attribuibile produce:

```txt
storage status: integrity_unknown
writersAllowed: false
readersAllowed: true
```

Il backend può offrire letture già disponibili, ma nessun nuovo writer canonico parte finché il residuo non viene classificato o rimosso tramite procedura esplicita.

Non sono consentite:

- cancellazione automatica silenziosa;
- quarantena che riabilita subito i writer senza verifica;
- interpretazione come `no_known_partial`.

La struttura è registrata come `IMPL-021`.

### SECURITY-006 — EventId e target non sono confinati dallo Storage

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** filename, journal target e writer

Gli helper Storage e journal accettano come eventId qualsiasi stringa non vuota.

Il normale Start SofaScore produce un ID numerico, ma lo Storage non deve affidarsi soltanto alla route chiamante o all’endpoint legacy `/api/betfair/odds` destinato alla rimozione.

#### Decisione approvata

Lo Storage impone autonomamente:

```txt
eventId canonico numerico
→ regex condivisa e bounded
```

Ogni target viene verificato con:

```txt
storageRoot = path.resolve(root)
target = path.resolve(candidate)
path.relative(storageRoot, target)
→ target obbligatoriamente interno alla root
```

Sono rifiutati:

- path assoluti esterni;
- traversal;
- target appartenenti a root differenti;
- eventId non canonici.

### STORAGE-005 — L’endpoint shared history usa soltanto integrity SofaScore

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** `buildMatchHistoryResponse`

La history è condivisa, ma l’endpoint consulta soltanto:

```txt
getMatchPersistenceIntegrity(eventId, 'sofa')
```

Un pending Betfair può coinvolgere lo stesso documento senza apparire nello stato della response history.

#### Decisione approvata

La shared history usa un’integrity aggregata per evento:

```txt
Sofa journal
+ Betfair journal
+ invalid journal globale
+ document read status
→ aggregate history integrity
```

Lo stato aggregato non sostituisce le due integrity source-specific delle timeline.

### STORAGE-006 — Stato runtime cross-source pubblicato prima del commit

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** `latestSofaState`, `latestBetfairState` e history aggregata

SofaScore aggiorna `latestSofaState` prima di completare il commit.

Betfair aggiorna `latestBetfairState` durante la preparazione, prima della creazione e del completamento del journal.

Queste mappe vengono poi lette dall’altra source per creare righe aggregate.

Scenario:

```txt
campione Betfair pubblicato in memoria
→ commit Betfair fallisce
→ successivo commit Sofa usa quel Betfair
→ history contiene uno stato mai diventato canonico
```

#### Decisione approvata

```txt
prepare candidate state
→ complete canonical commit
→ publish committed state
```

Al bootstrap le mappe vengono ricostruite dai documenti canonici verificati.

Ogni riga cross-source deve poter dichiarare:

```txt
rowCommitId
sofaCommitId o null
betfairCommitId o null
```

Nessun dato non commit-tato può diventare input canonico dell’altra source.

### STORAGE-007 — Letture mancanti, corrotte e illeggibili collassano nello stesso null

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** history/timeline read contract e API

History possiede internamente alcuni stati strutturati, ma le route usano una facade che riduce l’esito a documento o `null`.

Timeline restituisce `null` sia per:

- file assente;
- JSON corrotto;
- errore I/O.

Una proprietà `timeline` non array viene trasformata silenziosamente in `[]`.

#### Decisione approvata

History e timeline condividono il contratto:

```txt
found
missing
invalid_json
invalid_schema
read_failed
ambiguous
```

Le API distinguono:

```txt
404
→ documento realmente mancante/non ancora creato

409 storage_integrity
→ corrotto, schema invalido, ambiguo o incoerente
```

`no_known_partial` significa soltanto assenza di partial journal conosciuti; non certifica la salute del file.

### STORAGE-008 — Duplicati dello stesso evento risolti con sort()[0]

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** discovery history/timeline

History e timeline filtrano i filename compatibili e selezionano il primo in ordine lessicografico.

Con più file dello stesso eventId:

- non viene segnalata ambiguità;
- un documento viene scelto arbitrariamente;
- gli altri diventano residui nascosti;
- future scritture possono proseguire sul target sbagliato.

#### Decisione approvata

```txt
0 match → missing/nuovo target
1 match → canonical
più match → ambiguous_storage
→ writer bloccati
```

A medio termine i target devono diventare deterministici:

```txt
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

Torneo, data e giocatori restano nei metadata.

La migrazione dei file legacy sarà non distruttiva e separata dalla prima correzione di authority.

### STORAGE-009 — Nessuna policy persistita dei tentativi di recovery

**Stato:** `CONFERMATO COME STRUTTURA ASSENTE; POLICY APPROVATA`
**Priorità:** medio-alta
**Area:** recovery state machine

I repair falliti vengono spesso classificati come `retryable_pending`, ma il record non conserva:

- numero dei tentativi;
- ultima data;
- reason dell’ultimo fallimento;
- documento coinvolto;
- soglia di escalation;
- stato di rearm.

`recovery_failed` non deriva oggi da una policy completa sui tentativi esauriti.

#### Decisione approvata

Il record conserva:

```txt
attemptCount
lastAttemptAt
lastFailureReason
lastFailedDocument
recoveryState
```

Policy:

```txt
errore classificato temporaneo
→ retry controllato al bootstrap o su comando esplicito

soglia esaurita / errore permanente
→ recovery_failed
→ writers bloccati per l’evento o globalmente quando non attribuibile

correzione esterna verificata
→ rearm manuale
→ nuovo tentativo tracciato
```

Nessun retry aggressivo ad ogni tick.

### STORAGE-010 — Amplificazione full-document per ogni tick

**Stato:** `CONFERMATO COME LIMITE STRUTTURALE`
**Priorità:** media, da misurare
**Area:** timeline/history e payload journal

Ogni aggiornamento:

- clona l’intera timeline;
- aggiunge un tick;
- prepara l’intera history;
- salva nel journal una copia completa dei due documenti;
- riscrive entrambi i target completi.

Il numero di byte serializzati e scritti cresce con la durata della partita.

#### Decisione approvata

Nessun cambio immediato verso NDJSON, segmenti o database.

Prima si estende `IMPL-013` con:

```txt
dimensione history/timeline
byte journal
stringify duration
journal write duration
target write duration
rename duration
tick count
byte totali scritti per partita
```

Solo dopo la baseline si valuteranno:

- segmenti append-only;
- checkpoint;
- manifest;
- compattazione offline;
- database embedded.

I dati canonici necessari al futuro backtesting non entrano in una retention distruttiva.

### STORAGE-011 — Atomicità del processo distinta dalla durabilità power-loss

**Stato:** `LIMITE CONFERMATO DA DOCUMENTARE E MISURARE`
**Priorità:** media
**Area:** filesystem durability

Le scritture usano rename atomico, ma non è dimostrato un contratto di:

```txt
fsync file
fsync directory
```

Il progetto può quindi dichiarare atomicità rispetto al processo, non durabilità garantita contro perdita improvvisa di alimentazione o crash del sistema operativo.

#### Decisione approvata

Non introdurre `fsync` su ogni tick senza benchmark.

La documentazione e la baseline devono distinguere:

```txt
atomicità process-level
≠
durabilità power-loss
```

Un eventuale livello durable sarà configurabile e misurato.

### STORAGE-012 — Writer diretti non journalizzati ancora esportati

**Stato:** `CONFERMATO COME SUPERFICIE DA CHIUDERE`
**Priorità:** medio-alta
**Area:** facade Storage e timeline

Restano esportati writer come:

```txt
saveHistory
saveTimeline
writeTimelineDocument
```

I percorsi runtime canonici analizzati usano il commit journalizzato, ma l’API interna lascia ancora possibile un consumer futuro o legacy non protetto.

#### Decisione approvata

Prima della rimozione:

```txt
inventario finale consumer
→ classificazione runtime/test/recovery
→ adapter espliciti per recovery
→ writer canonici accessibili soltanto dall’autorità persistence
```

Dopo l’inventario:

- rimuovere export inutilizzati;
- rendere interni i writer raw;
- separare chiaramente writer canonico, repair writer e helper test;
- impedire nuovi consumer non journalizzati.

### Store delle conferme Source Identity

Lo store delle conferme resta separato dal journal history/timeline.

Motivi:

- non è persistenza canonica della partita;
- possiede schema e lifecycle differenti;
- la corruzione non deve essere fusa con un commit cross-documento.

Deve però rispettare:

```txt
IMPL-015 backend writer authority
→ un solo processo writer

read failure
→ stato store_unavailable visibile

write
→ atomic rename preservato
```

Non viene introdotto un secondo journal per questo archivio.

### Implementazioni risultanti

#### Riferimento audit a IMPL-019 — Event persistence authority

```txt
shared history event-scoped
→ un solo commit attivo per evento
→ source dichiarata ma non usata come lock esclusivo
→ expected base revision
→ pending cross-source bloccante
```

#### Riferimento audit a IMPL-020 — Canonical document contract e verified recovery

```txt
schema + identity + revision + digest
→ letture strutturate
→ verifica completed
→ duplicate detection
→ path confinement
→ migrazione legacy non distruttiva
```

#### Riferimento audit a IMPL-021 — Recovery control plane

```txt
summary bootstrap reale
→ global journal health
→ writersAllowed
→ retry metadata
→ recovery_failed
→ integrity_unknown
→ rearm esplicito
```

### Relazioni con strutture già registrate

```txt
IMPL-015
→ un solo backend writer per repository

IMPL-006
→ callback autorizzata dalla trackingSessionId

IMPL-016
→ comando Betfair proprietario del runtime browser

IMPL-008
→ harness offline per partial/recovery

IMPL-009
→ UI persistence locale + globale

IMPL-013
→ baseline dimensioni, latenza e durabilità
```

### Test mancanti

#### TEST-019 — Lost update cross-source

Pending Sofa con history fallita, commit Betfair successivo e retry Sofa non devono poter cancellare il commit Betfair.

#### TEST-020 — Pending cross-source sullo shared target

Due commit di source differenti sullo stesso evento non possono diventare entrambi attivi; il secondo viene bloccato o preceduto dalla recovery del primo.

#### TEST-021 — Verifica completed nei record parziali

History marked complete ma target mancante/corrotto con timeline pending deve riaprire e riscrivere history prima del cleanup.

#### TEST-022 — Target JSON valido ma identità/digest errati

Il journal non viene rimosso e il target non viene considerato verificato.

#### TEST-023 — Journal invalido non attribuibile

Il backend offre letture, blocca i writer e pubblica `integrity_unknown` senza cancellazione automatica.

#### TEST-024 — Aggregate integrity dello shared history

Un pending Betfair deve comparire nell’endpoint history condiviso; le timeline conservano integrity source-specific.

#### TEST-025 — Stato cross-source soltanto committed

Commit fallito non aggiorna latest state; bootstrap/recovery ricostruiscono le mappe dai documenti verificati.

#### TEST-026 — Read status distinti

Missing, invalid JSON, invalid schema, I/O failure e documento valido producono esiti separati e route coerenti.

#### TEST-027 — Duplicate event documents

Due file compatibili con lo stesso eventId producono `ambiguous_storage` e bloccano le scritture.

#### TEST-028 — EventId e target confinement

EventId non canonico, traversal e target esterno alla root vengono rifiutati da Storage e journal.

#### TEST-029 — Nessun consumer runtime dei writer raw

Inventario e test architetturale impediscono nuovi import canonici di writer non journalizzati.

#### TEST-030 — Retry ed escalation recovery

Attempt metadata, soglia, `recovery_failed`, writer block e rearm manuale devono essere deterministici e idempotenti.

### Decisioni approvate

1. qualsiasi pending dello shared history blocca commit SofaScore e Betfair dello stesso evento;
2. preservare per ora la shared history, senza trasformarla immediatamente in read model derivato;
3. verificare ogni documento marked complete anche nei record parziali;
4. introdurre schema, revisione, head commit e digest;
5. journal invalido non attribuibile → read-only `integrity_unknown`;
6. shared history → integrity aggregata SofaScore + Betfair + document health;
7. stato runtime cross-source pubblicato soltanto dopo commit e ricostruito al bootstrap;
8. distinguere missing, invalid JSON, invalid schema, I/O failure e ambiguity;
9. eventId canonico e target confinement come regole Storage;
10. più file dello stesso evento bloccano i writer;
11. nessun cambio formato full-document prima della baseline;
12. writer raw rimossi o resi interni dopo inventario consumer;
13. conferme Source Identity separate, atomiche e sotto backend writer authority;
14. retry recovery persistiti, escalation esplicita e rearm manuale verificato.

### Ordine tecnico risultante

```txt
IMPL-015 — backend writer authority
→ IMPL-019 — event persistence authority
→ IMPL-020 — document contract e verified recovery
→ IMPL-021 — recovery control plane
→ TEST-019…030
→ IMPL-009 — persistence UI
→ IMPL-013 — baseline storage
→ eventuale evoluzione del formato
```

---

## 20. Secondo audit del codice — Punto 5: Evidence e Market Reactions

**Baseline:** `2959fba5bc3e0480cc3ea03f4469361cbb629ae6`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
backend/src/routes/evidence.js
backend/src/sofa/matchEvidence.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/matchEvidence/alignment.js
backend/src/sofa/matchEvidence/alignmentExtension.js
backend/src/sofa/matchEvidence/time.js
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/matchEvidence/noTradeReasons.js
backend/src/sofa/matchEvidence/marketEvidence.js
backend/src/sofa/matchEvidence/runnerEvidence.js
backend/src/sofa/matchEvidence/sofaEvidence.js
backend/src/sofa/matchEvidence/sourceIdentity.js
backend/src/sofa/matchEvidence/sourceIdentity/marketEpoch.js
backend/src/sofa/matchEvidence/sourceIdentity/builder.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmation.js
backend/src/sofa/marketFlowEvidence.js
backend/src/sofa/marketFlowEvidence/runnerFlow.js
backend/src/sofa/marketFlowEvidence/runnerFlow/primitives.js
backend/src/sofa/marketFlowEvidence/alignment.js
backend/src/sofa/marketFlowEvidence/utilities.js
backend/src/sofa/marketReactionEvidence.js
backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/config.js
backend/src/sofa/significantMarketFlow/candidates.js
backend/src/sofa/significantMarketFlow/runnerFlow.js
backend/src/sofa/significantMarketFlow/singleTick.js
backend/src/sofa/significantMarketFlow/clusters.js
backend/src/sofa/marketLedObservationEvidence.js
backend/src/sofa/marketLedObservationEvidence/windowCollection.js
backend/src/sofa/marketLedObservationEvidence/observationWindow.js
backend/src/sofa/fieldLedReactionEvidence.js
backend/src/sofa/temporalAlignmentEvidence.js
backend/src/sofa/temporalAlignment/sofaMarker.js
backend/src/sofa/temporalAlignment/betfairMove.js
backend/src/sofa/temporalAlignment/betfairMove/candidateSelection.js
backend/src/sofa/temporalAlignment/betfairMove/primitives.js
backend/src/sofa/temporalAlignment/reactionWindows.js
backend/src/sofa/betfairHealth.js
backend/src/sofa/betfairHealth/tickQuality.js
backend/src/sofa/betfair/processor.js
backend/src/sofa/betfair/processor/persistenceDecision.js
backend/src/sofa/betfair/processor/canonicalTimeline.js
backend/src/sofa/betfair/timeline.js

docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.mdx
docs/tennis-decision-ui/modules/evidence/02-source-identity.mdx
docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.mdx
docs/tennis-decision-ui/modules/evidence/04-market-reactions.mdx

test Evidence, alignment, data quality e Market Reactions collegati
```

L’analisi è statica. Le suite presenti sono state lette ma non rieseguite.

### Classificazione usata

Per il Punto 5 ogni rilievo è stato distinto come:

```txt
bug confermato
limite noto
miglioria utile
documentazione mancante
struttura completamente assente
nessuna azione necessaria
decisione dell’utente richiesta
```

Le decisioni richieste sono state approvate integralmente dall’utente.

### Parti confermate come solide

#### Evidence resta read-only

Il Match Evidence Snapshot viene costruito da timeline già persistite e può leggere:

```txt
Source Identity effective
persistence integrity
active Betfair market epoch
```

Non deve:

- avviare scraper;
- fare fetch live;
- aprire browser;
- eseguire recovery;
- scrivere journal;
- aggiungere tick;
- modificare history o timeline;
- cambiare il gate live.

Questo confine è coerente nel codice letto e va preservato.

#### Gating cross-source conservativo

L’uso attribuito dei dati Betfair è consentito soltanto quando:

```txt
Source Identity effective = aligned
+
persistence integrity utilizzabile
```

Con `pending`, `mismatch`, `partial_persistence` o `recovery_failed`:

- i runner Betfair non vengono attribuiti;
- il lookback attribuito viene escluso;
- Market Reactions viene sospeso;
- le reason restano distinte;
- Source Identity non viene riscritta come errore storage.

Quando verrà implementato `integrity_unknown` del Punto 4, anche questo stato dovrà rendere `persistenceComplete:false`.

#### Active market epoch

L’epoch Betfair attivo è la porzione finale contigua con la stessa firma di mercato.

La firma preferisce:

```txt
marketId + selectionIds distinti
```

con fallback controllato su:

```txt
marketKey + runner normalizzati
```

Gli epoch storici non partecipano alle osservazioni del contesto corrente.

#### Conferma manuale contestuale

La conferma Source Identity è legata a:

```txt
eventId
marketId
epochSignature
due selectionId distinti
due giocatori SofaScore
due runner Betfair
mapping uno-a-uno selezionato
```

Un cambio di contesto rende non applicabile la conferma precedente.

#### Assenza esplicita di causalità

I moduli principali mantengono:

```txt
causalityClaimed: false
interpretation: temporal_proximity_only
```

anche quando rilevano prezzo, volume, marker o ordine temporale.

Questa invariante non deve essere rimossa né indebolita.

#### Immutabilità degli input

I builder principali lavorano su copie o viste derivate e i test esistenti verificano che timeline, tick e configurazioni non vengano mutati.

### EVIDENCE-001 — `selectionId` obbligatorio ancora non applicato

**Classificazione:** `BUG CONFERMATO RISPETTO A DECISIONE APPROVATA`
**Stato:** `APPROVATO; IMPLEMENTAZIONE MANCANTE`
**Priorità:** alta
**Area:** Field → Market e confronti runner temporali

`DEC-010` stabilisce già:

```txt
selectionId mancante
→ nessun fallback sul nome
→ runner non confrontabile
→ ramo degradato con reason
```

Nel ramo Field → Market il codice usa ancora il nome quando il runner baseline non possiede `selectionId`.

Il fallback non blocca Start, tracking, Source Identity o dashboard, ma può confrontare come stesso runner due entità identificate soltanto da una label testuale.

#### Decisione approvata nel Punto 5

La regola viene estesa a ogni confronto temporale dello stesso runner Betfair:

```txt
baseline runner ↔ latest runner
→ selectionId obbligatorio
```

Il nome resta consentito per:

- visualizzazione;
- reason diagnostiche;
- matching Source Identity nel proprio dominio;

ma non come identità temporale del runner Exchange.

Se manca l’ID:

```txt
comparisonStatus: runner_identity_unavailable
runnerPriceChanges: unavailable
reason: runner_selection_id_unavailable
```

Il resto dello snapshot resta disponibile secondo la propria qualità.

### EVIDENCE-002 — Tick degradati o `status-only` usati come nuovi eventi

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** Significant Flow, Market Reactions e tick Graph login

Il builder sospende Market Reactions per:

```txt
Source Identity non aligned
persistence incomplete
```

ma non applica un filtro equivalente per:

- Betfair stale;
- Graph health non `ok`;
- ladder non affidabile;
- flow non affidabile;
- book degradato;
- acquisition skew eccessivo;
- tick `statusOnlyGraphLogin`.

Il tick `status-only` conserva intenzionalmente market e runner dell’ultimo snapshot canonico per mostrare health e diagnostica dopo un problema Graph login.

Questa conservazione è corretta per la timeline, ma il nuovo tick possiede un nuovo timestamp e può ripresentare:

```txt
runner
prezzi
moneyFlow
matched data precedenti
```

come se fossero una nuova attività Exchange.

#### Scenario

```txt
tick reale con flow significativo
→ Graph login richiesto
→ tick status-only copia il precedente
→ nuovo timestamp
→ detector Significant Flow rilegge lo stesso flow
→ nuovo sourceMarketEvent possibile
```

#### Decisione approvata

I tick `status-only` restano nella timeline per health, ma:

```txt
status-only
→ non genera Significant Flow
→ non diventa sourceMarketEvent
→ non aggiorna baseline algoritmica
→ non crea Market Reaction nuova
```

Market Reactions deve usare una eligibility tecnica esplicita e non soltanto Source Identity/persistence.

### EVIDENCE-003 — Attività matched generica classificata come risposta del mercato

**Classificazione:** `BUG SEMANTICO CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** Field → Market

Il ramo usa oggi:

```txt
priceChangeObserved
oppure
market totalMatched aumentato
→ marketResponseObserved:true
```

Un aumento di `market.totalMatched` dimostra soltanto che sono avvenuti scambi nel mercato. Non dimostra:

- movimento del runner collegato;
- variazione significativa;
- attività sul runner identificato;
- risposta al marker;
- direzione;
- causalità.

#### Decisione approvata

Separare:

```txt
marketActivityObserved
→ attività matched generale successiva all’anchor

runnerPriceChangeObserved
→ prezzo comparabile dello stesso selectionId cambiato

runnerVolumeChangeObserved
→ volume reale dello stesso selectionId aumentato

qualifiedMarketObservation
→ osservazione che supera identity, temporal e quality gate
```

La label pubblica non deve chiamare “risposta del mercato” la sola attività matched generica.

`marketResponseObserved` può essere rimosso oppure mantenuto soltanto come alias compatibile, documentato come non causale e non qualificato finché non soddisfa i nuovi gate.

### EVIDENCE-004 — Presenza di un marker confusa con comparsa successiva

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** Market → Field

Il ramo considera osservato un field event quando, in una finestra successiva al flow:

```txt
esiste un marker rilevante
oppure
lo score differisce dalla baseline
```

Non verifica sempre che il marker sia comparso dopo il source market event.

#### Scenario

```txt
DEUCE già attivo prima del flow
→ tick successivo ancora DEUCE
→ nessuna transizione
→ marker trovato nella finestra
→ fieldEventObservedAfterFlow:true
```

La presenza successiva non è equivalente a una nuova comparsa.

#### Decisione approvata

Separare:

```txt
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource
```

Un nuovo field event richiede:

```txt
stateFirstSeenAt > sourceMarketEvent.timestamp
oppure
baseline state != primo stato post-source
```

La persistenza dello stesso marker resta un dato di contesto, non un nuovo evento.

### EVIDENCE-005 — Alignment e freshness non misurano il vero rapporto temporale

**Classificazione:** `BUG CONFERMATO + LIMITE NOTO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** alignment, timestamp e acquisition provenance

`buildAlignment()` calcola:

```txt
sofaAgeSec
betfairAgeSec
maxTickGapSec = max(sofaAgeSec, betfairAgeSec)
```

Il campo `maxTickGapSec` non misura la distanza fra le fonti.

Il vero source skew è:

```txt
abs(sofaTimestamp - betfairTimestamp)
```

Inoltre una sola fonte recente può oggi produrre `alignmentQuality:medium`, anche se non esiste un confronto cross-source.

#### Timestamp futuri

L’età viene clampata a zero:

```txt
Math.max(0, now - timestamp)
```

Un timestamp futuro può apparire come dato perfettamente fresco invece di produrre clock skew.

#### Timestamp di registrazione

Il tick Betfair canonico usa il momento di costruzione Node come timestamp principale. Non dimostra il momento effettivo in cui Market API e Graph sono stati acquisiti.

Questo limite si collega a `IMPL-018` del Punto 3.

#### Decisione approvata

Distinguere almeno:

```txt
acquiredAt
recordedAt
sofaAgeSec
betfairAgeSec
sourceSkewSec
pipelineDelaySec
futureSkewSec
baselineGapSec
firstPostSourceGapSec
```

Rinominare o rimuovere l’attuale `maxTickGapSec`; se mantenuto per compatibilità deve diventare chiaramente `maxSourceAgeSec`.

Qualità cross-source:

```txt
good
→ entrambe le fonti presenti
→ acquisition timestamp validi
→ freshness valida
→ source skew entro soglia

medium
→ entrambe presenti ma skew/freshness degradati

poor
→ fonte assente, timestamp invalido/futuro o skew eccessivo
```

### EVIDENCE-006 — Confronti prezzo con source diverse e baseline non bounded

**Classificazione:** `BUG DI QUALITÀ CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** price comparison e anchor temporale

Il prezzo comparabile può provenire da:

```txt
last traded price
mid book
best back
best lay
```

Nel ramo Field → Market viene mantenuto soltanto il numero, non la sorgente.

Scenario:

```txt
baseline LTP 1.80
latest senza LTP, mid book 1.86
→ delta +0.06
```

Il risultato mescola un movimento possibile con un cambio della fonte del prezzo.

Inoltre la baseline è l’ultimo tick `<= anchor`, senza un limite esplicito sulla sua distanza dall’anchor.

#### Decisione approvata

Ogni confronto espone:

```txt
baselinePrice
baselinePriceSource
latestPrice
latestPriceSource
priceSourcesComparable
baselineGapSec
firstPostSourceGapSec
comparisonStatus
reasons
```

Policy:

```txt
stessa source
→ confronto normale

source differente ma ammessa
→ degraded con reason

source non confrontabile
→ price change unavailable

baseline oltre soglia
→ comparison unavailable/degraded
```

### EVIDENCE-007 — Qualità globale positiva con copertura parziale dei runner

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** data quality e mercato tennis a due runner

La qualità globale usa oggi condizioni del tipo:

```txt
almeno un runner con ladder affidabile
→ ladderReliable:true

almeno un runner con flow affidabile
→ moneyFlowReliable:true

almeno un runner con book two-sided
→ marketTradable:true
```

In un mercato tennis a due runner, un solo runner completo può quindi rendere positivo un boolean globale mentre l’altro è assente o degradato.

#### Decisione approvata

Esporre copertura:

```txt
expectedRunnerCount
identifiedRunnerCount
tradableRunnerCount
reliableLadderRunnerCount
reliableFlowRunnerCount

bookCoverage: complete | partial | none
ladderCoverage: complete | partial | none
flowCoverage: complete | partial | none
```

Per osservazioni che richiedono entrambi i runner:

```txt
complete
→ utilizzabile

partial
→ degradata

none
→ unavailable
```

I boolean legacy possono essere mantenuti temporaneamente come derivati, senza nascondere la copertura.

### EVIDENCE-008 — Baseline Significant Flow e cluster non sufficientemente definiti

**Classificazione:** `LIMITE NOTO + MIGLIORIA UTILE`
**Stato:** `POLICY APPROVATA`
**Priorità:** medio-alta
**Area:** Significant Flow

#### Lookback effettivo incoerente

Il detector dichiara:

```txt
lookbackTicks: 40
```

ma il loader Evidence passa al massimo gli ultimi 21 tick dell’epoch attivo.

La configurazione esposta non corrisponde quindi sempre all’input realmente disponibile.

#### Baseline relativa mescolata fra runner

La mediana relativa viene calcolata su candidati precedenti di entrambi i runner, senza distinguere `selectionId`.

Un flow del runner A può quindi essere confrontato con una baseline composta anche dal runner B.

#### Cluster basati sui tick, non sul tempo

I cluster usano tick consecutivi e `maxClusterTicks`, ma non impongono un `maxClusterGapSec`.

Due tick consecutivi nel file ma lontani nel tempo possono essere uniti.

Finestre scorrevoli possono inoltre riutilizzare gli stessi tick in cluster sovrapposti.

#### Soglie non calibrate

Le soglie correnti:

```txt
600 / 1200 / 2500 / 5000
3x / 6x / 10x
```

sono euristiche hardcoded. Le label `notable`, `strong`, `very_strong`, `extreme` non derivano ancora da una calibrazione storica documentata.

#### Decisione approvata

Separare:

```txt
runnerRelativeMultiplier
→ baseline dello stesso selectionId

marketRelativeMultiplier
→ baseline aggregata del mercato
```

I cluster richiedono:

```txt
selectionId obbligatorio
maxClusterGapSec
no status-only
no tick degradati
no sovrapposizione o doppio conteggio degli stessi tick
provenance dei tick inclusi
```

Le soglie restano per ora:

```txt
heuristic
provisional
versioned
not calibrated
not a signal
```

La calibrazione appartiene al Punto 7 e a `IMPL-012/013`.

### EVIDENCE-009 — `available`, stato finestra e risultato osservato sono ambigui

**Classificazione:** `LIMITE SEMANTICO + DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** media
**Area:** parent Market Reactions e branch state

Significant Market Flow può restituire `available:true` quando i tick sono stati processati anche se:

- nessun flow significativo è stato trovato;
- non esiste source event;
- Market → Field non è disponibile;
- Field → Market non è disponibile.

Il parent è `available:true` quando almeno un child dichiara availability, ma i child usano il campo con significati diversi.

Anche le finestre non hanno uno stato uniforme:

- Field → Market espone `windowClosed`;
- Market → Field non espone lo stesso contratto;
- una finestra da 240 secondi può essere mostrata dopo pochi secondi senza una label uniforme di provisionalità.

#### Decisione approvata

Separare:

```txt
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
windowState: open | closed | insufficient_data | stale_source
```

Il top-level `available` deve avere un solo significato stabile, preferibilmente:

```txt
almeno un ramo possiede un’osservazione presentabile
```

Il summary deve distinguere:

```txt
provisional
final_for_window
```

### Riferimento audit a DOC-017 — Flusso di composizione Market Reactions

**Classificazione:** `DOCUMENTAZIONE MANCANTE GIÀ REGISTRATA`
**Stato:** `CONFERMATO; NON DUPLICARE`

La documentazione afferma che Market Reactions consuma uno snapshot Evidence già costruito.

Il flusso reale è:

```txt
Evidence builder
→ seleziona tick scoped
→ chiama Market Reactions
→ inserisce il risultato nello snapshot finale
```

Il rilievo resta `DOC-017`; non viene creato un nuovo ID duplicato.

### DOC-026 — Temporal provenance e policy di alignment non documentate

**Classificazione:** `DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

Il documento owner deve distinguere:

```txt
acquiredAt
recordedAt
freshness
source skew
pipeline delay
future clock skew
baseline gap
first post-source gap
observation window
window open/closed
```

Deve inoltre spiegare:

- quale timestamp governa la freshness;
- quale timestamp governa l’anchor;
- le soglie 10/30/60/120/180/240;
- il comportamento con una fonte assente;
- la differenza fra età del dato e gap fra le fonti.

### DOC-027 — Availability, activity, response e threshold non documentati

**Classificazione:** `DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** media-alta

Definire esplicitamente:

```txt
detector eseguito
input disponibile
source event disponibile
attività osservata
variazione runner osservata
osservazione qualificata
finestra provvisoria
finestra conclusa
```

Le soglie Significant Flow devono essere dichiarate:

```txt
provvisorie
euristiche
versionate
non calibrate
non operative
```

### Strutture risultanti

#### Riferimento audit a IMPL-022 — Evidence temporal provenance and alignment policy

Struttura owner di:

- acquisition e recorded timestamp;
- source skew;
- pipeline delay;
- future skew;
- baseline e first-post gap;
- stato finestre;
- soglie temporali versionate.

#### Riferimento audit a IMPL-023 — Market Reaction eligibility e branch state

Struttura owner di:

- eligibility tecnica dei tick;
- esclusione `status-only` dagli eventi algoritmici;
- stati uniformi dei rami;
- distinzione activity/observation/response;
- marker transition;
- coverage;
- Significant Flow e cluster policy.

#### Riferimento audit a IMPL-024 — Runner temporal identity e price comparability

Struttura owner di:

- `selectionId` obbligatorio;
- assenza di fallback nome;
- source del prezzo;
- comparabilità;
- baseline gap;
- reason e stato del confronto.

Le specifiche complete sono registrate in `06-implementazioni-proposte.md`.

### Test mancanti

#### TEST-031 — `status-only` non crea Market Reaction

```txt
tick reale con flow
→ status-only Graph login
→ health preservata
→ nessun nuovo Significant Flow/sourceMarketEvent
```

#### TEST-032 — Eligibility tecnica Market Reactions

```txt
Graph degradato / ladder non affidabile / tick stale / acquisition skew
→ timeline preservata
→ ramo degraded/unavailable
```

#### TEST-033 — `selectionId` obbligatorio

```txt
runner senza selectionId
→ nessun fallback nome
→ reason esplicita
→ resto snapshot invariato
```

#### TEST-034 — Attività matched distinta da response

```txt
solo market totalMatched aumenta
→ marketActivityObserved:true
→ runnerPriceChangeObserved:false
→ qualifiedMarketObservation:false
```

#### TEST-035 — Marker presente distinto da marker nuovo

```txt
stesso marker prima e dopo source flow
→ markerPresentAfterSource:true
→ markerTransitionObservedAfterSource:false
```

#### TEST-036 — Source prezzo non comparabile

```txt
LTP → mid o back → lay
→ confronto degraded/unavailable
→ source esposte
```

#### TEST-037 — Baseline troppo lontana

```txt
baseline gap oltre soglia
→ gap esposto
→ qualità degradata
→ nessun confronto affidabile
```

#### TEST-038 — Coverage parziale runner

```txt
un runner completo, uno degradato
→ coverage partial
→ nessun complete globale falso
```

#### TEST-039 — Timestamp, acquisition e clock skew

```txt
timestamp futuro
recordedAt diverso da acquiredAt
source skew elevato
→ freshness/alignment degradati correttamente
```

#### TEST-040 — Baseline Significant Flow per `selectionId`

```txt
runner A
→ non usa flow runner B nella baseline runner-specific
```

#### TEST-041 — Cluster temporali non sovrapposti

```txt
tick consecutivi ma distanti
→ non uniti

tick già assegnato
→ non doppio conteggio in cluster sovrapposti
```

#### TEST-042 — Availability semantica

```txt
detector computed
+ nessuna osservazione
→ computed:true
→ observationAvailable:false
→ top-level coerente
```

#### TEST-043 — Finestre open/closed

```txt
finestra non conclusa
→ provisional/open

finestra conclusa
→ final_for_window/closed
```

### Decisioni approvate

1. i tick `status-only` restano nella timeline per health ma non generano nuovi Significant Flow o source event;
2. Market Reactions usa una eligibility tecnica esplicita;
3. applicare `DEC-010` senza fallback nome nel ramo Field → Market;
4. estendere `selectionId` obbligatorio a tutti i confronti temporali dello stesso runner Betfair;
5. separare attività matched generale, variazione runner e osservazione qualificata;
6. un marker già presente prima del flow non è un nuovo evento successivo;
7. separare età delle fonti e source skew reale;
8. timestamp futuri producono degradazione clock-skew e non freshness zero;
9. conservare e confrontare la sorgente del prezzo;
10. introdurre un limite massimo baseline→anchor;
11. la qualità globale espone copertura esplicita dei due runner;
12. baseline Significant Flow per `selectionId`, con baseline mercato separata;
13. cluster con gap temporale massimo, provenance e nessun doppio conteggio;
14. soglie correnti provvisorie, versionate e non calibrate fino al Punto 7;
15. separare `computed`, `available`, `observed`, `provisional` e `stale`;
16. mantenere invariati `causalityClaimed:false` e `temporal_proximity_only`.

### Ordine tecnico risultante

```txt
IMPL-018
→ acquisition envelope Betfair

IMPL-022
→ temporal provenance e alignment policy

IMPL-024
→ runner identity e price comparability

IMPL-023
→ eligibility e branch state Market Reactions

TEST-031…043
→ fixture/replay IMPL-012
→ baseline e calibrazione IMPL-013
→ Punto 6 Frontend
→ Punto 7 test e strutture mancanti
```



---

## 21. Secondo audit del codice — Punto 6: Frontend

**Baseline:** `9205b5a789a40203c48ba19f8e3397fd0cec9707`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
frontend/src/App.jsx
frontend/src/main.jsx
frontend/src/index.css

frontend/src/hooks/useAnalysisSessionState.js
frontend/src/hooks/useLiveTrackingActions.js
frontend/src/hooks/useDashboardBootstrapState.js
frontend/src/hooks/useDashboardViewModel.js
frontend/src/hooks/useMatchPolling.js
frontend/src/hooks/useBetfairJson.js
frontend/src/hooks/useMarketReactionEvidence.js
frontend/src/hooks/useSourceIdentityGateStatus.js
frontend/src/hooks/useSourceIdentityGateUi.js
frontend/src/hooks/usePreflightChecks.js
frontend/src/hooks/useBetfairHealthAlerts.js
frontend/src/hooks/useBetfairLoginAction.js

frontend/src/services/liveSessionApi.js
frontend/src/utils/analysisSessionState.js
frontend/src/utils/liveSessionRequests.js
frontend/src/utils/preflight.js
frontend/src/utils/dashboardConnections.js
frontend/src/utils/sourceIdentityGatePresentation.js
frontend/src/types/dashboard.js

frontend/src/components/StartAnalysisPanel.jsx
frontend/src/components/DashboardWorkspace.jsx
frontend/src/components/Sidebar.jsx
frontend/src/components/TopBar.jsx
frontend/src/components/OverviewDashboard.jsx
frontend/src/components/BetfairDepthCard.jsx
frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/SourceIdentityGateIndicator.jsx
frontend/src/components/SourceIdentityGateToast.jsx
frontend/src/components/TotManualInputPlaceholder.jsx
frontend/src/components/LayTheWinner.jsx
frontend/src/components/BancaServizio.jsx
frontend/src/components/Superbreak.jsx
frontend/src/components/marketReactions/FieldLedReactionCard.jsx
frontend/src/components/marketReactions/MarketLedObservationCard.jsx
frontend/src/components/marketReactions/SourceIdentityConfirmationModal.jsx
frontend/src/components/marketReactions/SourceIdentityControls.jsx

frontend/src/hooks/useMatchPolling.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/utils/dashboardConnections.test.mjs
frontend/package.json

backend/src/routes/match.js
backend/src/routes/match/trackingResponses.js
backend/src/routes/match/sourceIdentityStatusResponse.js
backend/src/sofa/extractEventId.js
backend/src/sofa/betfairHealth/statusClassification.js

docs/tennis-decision-ui/modules/frontend/01-session-shell.mdx
docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.mdx
docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.mdx
```

L’analisi è statica. Build, test e collaudi responsive non sono stati eseguiti.

### Classificazione usata

Per ogni rilievo sono stati distinti:

```txt
bug confermato
limite noto
miglioria utile
documentazione mancante
struttura completamente assente
nessuna azione necessaria
decisione dell’utente richiesta
```

Le decisioni proposte sono state approvate integralmente dall’utente.

### Parti solide — nessuna azione necessaria

#### Ownership Evidence globale

`App.jsx` monta una sola istanza di `useMarketReactionEvidence(...)` e passa il risultato a `MarketReactionsPage`.

La pagina:

- non crea un secondo poller;
- non avvia tracking;
- non conferma Source Identity;
- non scrive timeline o journal.

Questo ownership deve essere preservato.

#### Polling Gate ed Evidence già protetti

`useSourceIdentityGateStatus(...)` e `useMarketReactionEvidence(...)` possiedono già gran parte del modello corretto:

```txt
session generation
requestId monotono
AbortController
una fetch attiva per sessione
controllo prima di setState
cleanup timeout
```

Questi hook diventano il riferimento da generalizzare, non un’eccezione isolata.

#### Source Identity globale distinta da Evidence

Lo stato Source Identity globale deriva da:

```txt
GET /api/match/:eventId/source-identity-status
```

Non viene ricostruito dal Match Evidence Snapshot.

La separazione tra:

```txt
Source Identity live
Evidence read-only
persistence integrity
Betfair health
```

è corretta e deve restare esplicita.

#### Health Betfair backend-owned

Il frontend riceve lo stato health già classificato dal backend.

`useBetfairHealthAlerts(...)` può gestire:

- transizioni;
- toast;
- audio;

ma non deve cambiare il significato di `green`, `yellow`, `red`, `finished` o `unknown`.

#### Money Flow associato tramite `selectionId`

`BetfairDepthCard.jsx` associa history e runner attraverso `selectionId` stringificato.

Il nome resta una label e non viene usato come identità temporale della serie.

### Ampliamento finale collegato a FRONTEND-001 — Response tardive e fuori ordine attraversano la sessione

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

`useMatchPolling(...)` e `useBetfairJson(...)` non possiedono:

```txt
trackingSessionId
session generation
requestId
AbortController
single-active-request lock
guard prima di ogni setState
```

Una richiesta della sessione A può completarsi dopo Start B e aggiornare:

- snapshot SofaScore;
- dati Betfair;
- health;
- Money Flow history;
- integrity;
- timestamp;
- errori;
- server status.

Due richieste della stessa sessione possono anche completarsi fuori ordine e permettere al payload più vecchio di sovrascrivere quello più recente.

#### Conferma Source Identity tardiva

La conferma usa una closure con `eventId`, ma non riceve né verifica `trackingSessionId`.

Una conferma A in flight può completarsi dopo Start B e avviare un refresh non più appartenente al contesto che l’ha generata.

#### EventId duplicato

Dopo Start, il frontend ricalcola `eventId` dalla URL confermata e ignora l’`eventId` restituito dal backend.

La sessione accettata deve usare soltanto l’identità restituita da Start.

### Ampliamento collegato a FRONTEND-002 — Persistence integrity raccolta ma scartata prima della UI

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

Gli hook SofaScore e Betfair conservano `integrity`, ma `App.jsx` non la estrae né la passa ai consumer.

`useMarketReactionEvidence(...)` conserva soltanto:

```txt
payload.latest.marketReactionEvidence
```

e perde:

```txt
integrity top-level
sources
dataQuality complessiva
metadata dello snapshot
```

`useDashboardViewModel(...)` non riceve le integrity e non produce uno stato persistence.

Mancano quindi:

- stato locale SofaScore;
- stato locale Betfair;
- stato locale Market Reactions;
- indicatore globale in fondo alla sidebar;
- modale persistence;
- rappresentazione distinta di `partial_persistence`, `recovery_failed` e futuro `integrity_unknown`.

#### Ultimo dato su `409`

Quando il polling SofaScore riceve `409`, azzera `backendData`, ma `dashboardData` resta invariato perché il view model aggiorna il proprio stato soltanto con un input truthy.

L’ultimo snapshot può restare visibile, ma deve essere marcato esplicitamente:

```txt
last_verified
frozen
degraded
```

Non deve sembrare un dato live corrente.

### Ampliamento finale collegato a FRONTEND-003 — Start fallito lascia sessione e poller nascosti

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

Il frontend esegue prima:

```txt
applySearchSession
sessionShellVisible = true
trackingStopped = false
beginDashboardBootstrap
```

poi attende `POST /api/match/track`.

Il cambio della configurazione confermata può quindi attivare i poller prima che il backend abbia accettato lo Start.

Se Start fallisce, il codice:

```txt
resetDashboardBootstrap
sessionShellVisible = false
```

ma non:

- cancella la sessione confermata;
- ferma Betfair ed Evidence;
- invalida il comando Start;
- abortisce le request in flight;
- resetta tutti i dati transitori;
- espone un errore Start specifico;
- esegue cleanup compensativo quando la risposta è ambigua.

`sofaError` appartiene al polling timeline e non rappresenta l’errore di `POST /track`.

### FRONTEND-005 — I vecchi loop possono ricrearsi dopo cleanup

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

I loop SofaScore e Betfair seguono:

```txt
await fetchData
→ setTimeout(loop)
```

Se cleanup o cambio sessione avvengono durante la fetch, il timeout noto viene cancellato, ma la vecchia closure può completare e programmarne uno nuovo.

Il ref `shouldPoll` è condiviso dal vecchio e dal nuovo loop. Un nuovo Start che lo riporta a `true` può riattivare anche una closure precedente.

`React.StrictMode` aumenta la necessità di una cleanup idempotente perché in sviluppo monta, pulisce e rimonta gli effect.

### FRONTEND-006 — Start e Stop concorrenti non serializzati

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** alta

Il pulsante Start è disabilitato tramite `sofaLoading`, che appartiene al polling SofaScore e non al comando Start.

Mancano:

```txt
startPending
commandId
single-flight Start
deduplicazione
invalidazione comando precedente
```

Anche Stop può essere richiamato più volte mentre la prima richiesta è ancora in corso.

### FRONTEND-007 — Stop Live Tracking non crea una modalità statica reale

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

Dopo Stop il frontend esegue soltanto:

```txt
stopSofaPolling
trackingStopped = true
```

Restano attivi:

- polling Betfair;
- polling Evidence;
- polling Source Identity Gate;
- refresh manuale Market Reactions;
- eventuale audio Betfair.

La modalità statica approvata deve significare:

```txt
tutti i poller sospesi
request in flight abortite
nessun nuovo setState live
ultimo snapshot verificato conservato
refresh live disabilitato
audio fermato
```

Inoltre la UI interpreta `ok:true` come Stop completo senza esporre cleanup parziale, `remaining` o errori Python.

### FRONTEND-008 — Indicatori live derivati dalla presenza del dato

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

`dashboardConnections.js` considera SofaScore connected quando esiste `backendData`, senza conoscere:

- stato della sessione;
- Stop;
- integrity;
- snapshot frozen;
- cleanup parziale.

La sidebar mostra quasi sempre `Live Engine Active` o `Dashboard engine active` usando principalmente la health Betfair.

La TopBar mantiene un pallino verde globale animato e assegna lo stile attivo anche a badge come:

```txt
BACKEND: ERR
POLLING: OFF
```

La card Betfair può mostrare `Polling active (5s)` senza ricevere `isPolling` o `trackingStopped`.

#### Decisione approvata

Ogni indicatore deriva dalla stessa state machine della sessione.

La semplice presenza dell’ultimo dato non autorizza le label:

```txt
live
connected
polling active
engine active
```

### FRONTEND-009 — Market Reactions UI promuove rami unavailable e usa campi errati

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

Le card usano:

```jsx
<AvailabilityBadge available={!!evidence} />
```

Il backend può però restituire un oggetto completo con:

```txt
available:false
```

L’oggetto viene quindi mostrato erroneamente come disponibile.

La card Exchange → Field cerca:

```txt
runnerName
amount
tier
flowClassification
```

mentre il contratto backend usa:

```txt
runner
observedFlowAmount
absoluteFlowTier
interpretation
```

Altri problemi:

- `causalityClaimed` cercato nel livello sbagliato;
- array eventi passato a formatter numerico;
- `not observed` usato anche per unavailable, insufficient data o finestra aperta;
- schema vecchio non compatibile con le decisioni del Punto 5.

### FRONTEND-010 — Modale pending non legata al vero contesto Source Identity

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** alta

La pending key contiene soltanto:

```txt
eventId
nomi SofaScore
nomi Betfair
```

Non contiene:

```txt
trackingSessionId
marketId
epoch signature
selectionIds
context revision
```

Un nuovo epoch con gli stessi nomi può quindi non riaprire automaticamente la modale.

#### Decisione approvata

Lo status gate deve esporre un’identità opaca e pubblica del contesto:

```txt
trackingSessionId
sourceIdentityContextId
sourceIdentityRevision
```

La UI non ha bisogno di URL o payload sensibili.

### FRONTEND-011 — Risultati Preflight non legati agli input verificati

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CORREZIONE APPROVATA`
**Priorità:** medio-alta

I check non possiedono:

```txt
input fingerprint
requestId
AbortController
invalidazione al cambio campo
```

Una risposta riferita alla URL A può diventare il risultato verde mostrato accanto alla URL B.

Anche modificare un input dopo un check completato non riporta il relativo stato a `idle` o `stale`.

#### Decisione approvata

Ogni risultato Preflight conserva:

```txt
inputFingerprint
checkedAt
requestId
status
```

Qualsiasi modifica dell’input invalida il risultato precedente.

### FRONTEND-012 — Layout responsive strutturalmente assente

**Classificazione:** `LIMITE NOTO + STRUTTURA ASSENTE`
**Stato:** `TASK SEPARATA CONFERMATA`
**Priorità:** dopo la robustezza

Sono presenti:

```txt
sidebar fissa w-64
root overflow-hidden
TopBar orizzontale non comprimibile
dashboardGrid sempre a due colonne
h-screen rigido
nessuna navigazione mobile
```

La correzione responsive resta separata secondo `DEC-017`.

Non deve essere inclusa nella stessa task di:

- session authority;
- polling;
- integrity;
- cleanup Strategy;
- Market Reactions contract.

### Cleanup legacy confermato

#### Strategy UI

Restano montate e raggiungibili:

```txt
Lay the Winner
Banca Servizio
Superbreak
```

`LayTheWinner` effettua polling verso `http://localhost:3001`.

Le altre due viste mostrano valori statici come:

```txt
Monitoring
Medium
High
92%
```

Non devono essere corrette. Devono essere rimosse secondo `CODE-001` e `DEC-008`, preservando Market Reactions.

#### Source Identity authority legacy

`useMarketReactionEvidence(...)` esporta ancora metodi di conferma/revoca.

`SourceIdentityControls.jsx` conserva una seconda UI legacy non montata.

Dopo ultimo inventario dei consumer vanno rimossi:

```txt
confirmSourceIdentity
revokeSourceIdentityConfirmation
SourceIdentityControls
utility e test esclusivi
```

L’autorità globale resta `useSourceIdentityGateUi(...)`.

#### Mojibake

Restano stringhe renderizzate come:

```txt
ModalitÃ
âEUR”
```

La correzione è circoscritta e resta separata dal refactor sessione/polling.

### Polling non necessario

L’abilitazione dei poller non è centralizzata.

Il polling Betfair può partire con un eventId anche quando Betfair non è configurato.

Evidence continua a essere interrogata anche quando la vista Market Reactions non è aperta.

Policy approvata:

```txt
Sofa
→ sessione accettata e live

Betfair
→ sessione accettata, live e Betfair configurato

Source Identity Gate
→ sessione live con Betfair configurato

Evidence
→ sessione live e vista Market Reactions attiva
→ fetch immediato all’ingresso

stopped_static
→ tutti disabilitati
```

### DOC-028 — Session shell contraddice la session authority approvata

**Classificazione:** `DOCUMENTAZIONE ERRATA`
**Stato:** `CORREZIONE APPROVATA`

`01-session-shell.mdx` descrive come comportamento da preservare:

```txt
applySearchSession prima della risposta Start
```

Documenta inoltre che Betfair, Evidence e Source Identity possono continuare a leggere dopo Stop.

Questi testi contraddicono `DEC-019`.

### DOC-029 — Polling e view model descrivono funzioni non implementate

**Classificazione:** `DOCUMENTAZIONE PIÙ FORTE DEL CODICE`
**Stato:** `CORREZIONE APPROVATA`

`02-live-polling-and-view-model.mdx` dichiara già esistenti:

- propagation Evidence completa;
- adapter persistence;
- view state integrity;
- cleanup session-safe di tutti i poller.

Il codice corrente non implementa questi contratti.

### DOC-030 — UI Betfair e Market Reactions descritta come integrity-aware

**Classificazione:** `DOCUMENTAZIONE PIÙ FORTE DEL CODICE`
**Stato:** `CORREZIONE APPROVATA`

`03-betfair-and-market-reactions-ui.mdx` assegna già a BetfairDepthCard e Market Reactions UI comportamenti integrity-aware che non sono collegati nel runtime attuale.

I documenti vanno aggiornati dopo l’implementazione e non usati come prova del comportamento corrente.

### Strutture completamente assenti

#### Riferimento audit a IMPL-025 — Frontend live-session controller

Owner unico di:

```txt
idle
starting
collecting
pending_confirmation
live
stopping
stopped_static
stop_partial
mismatch
integrity_degraded
error
```

Deve conservare:

```txt
trackingSessionId
commandId
eventId restituito dal backend
requestedConfig
acceptedConfig
currentSnapshot
lastVerifiedSnapshot
snapshotMode
startError
stopResult
```

#### Riferimento audit a IMPL-026 — Polling runtime session-scoped

Primitive condivisa da Sofa, Betfair, Evidence e Gate:

```txt
enabled
sessionKey
requestId
AbortController
single active request
disposed
schedule next after response
retain policy
expected HTTP classifier
```

#### Riferimento audit a IMPL-027 — Market Reactions frontend view model

Adapter presentazionale che produce:

```txt
pageState
marketLedCard
fieldLedCard
availability
provisional
quality
reasons
source event display
windows display
```

Non deve ricalcolare Evidence.

### Test mancanti

#### TEST-044 — Start concorrenti e risposta tardiva

```txt
Start A in flight
→ Start B
→ risposta A ignorata
→ soltanto B accettata
```

#### TEST-045 — Start fallito o ambiguo

```txt
sessione richiesta
→ Start fallisce o risposta incerta
→ sessione confermata rimossa
→ poller fermi
→ cleanup compensativo
→ errore visibile
```

#### TEST-046 — Response vecchie o fuori ordine

```txt
Sofa/Betfair response vecchia
→ nessun setState corrente
```

#### TEST-047 — Cleanup durante fetch

```txt
cleanup
→ resolve fetch precedente
→ nessun nuovo timeout
```

#### TEST-048 — Stop completo

```txt
Sofa/Betfair/Evidence/Gate sospesi
→ ultimo dato frozen
→ audio fermo
```

#### TEST-049 — Stop parziale

```txt
cleanup parziale
→ UI non mostra completato
→ detail pubblico bounded
```

#### TEST-050 — Persistence UI

```txt
partial/recovery_failed/integrity_unknown
→ card locale
→ indicatore globale
→ modale
→ ultimo dato degraded/frozen
```

#### TEST-051 — Identità sessione dalla risposta Start

```txt
eventId + trackingSessionId backend
→ uniche authority dei poller
```

#### TEST-052 — Nuovo contesto Source Identity con stessi nomi

```txt
contextId cambia
→ modale riaperta
→ conferma vecchia ignorata
```

#### TEST-053 — Preflight input-bound

```txt
input cambia durante richiesta
→ vecchio OK ignorato
→ stato stale/idle
```

#### TEST-054 — Market Reactions unavailable

```txt
branch object presente
+ available:false
→ card unavailable
```

#### TEST-055 — Mapping schema Market Reactions reale

```txt
runner
observedFlowAmount
absoluteFlowTier
interpretation
→ campi mostrati correttamente
```

#### TEST-056 — Nessun falso stato live

```txt
stopped/waiting/polling off/integrity/unknown
→ nessun verde o engine active falso
```

#### TEST-057 — Sessione Sofa-only

```txt
Betfair assente
→ nessun polling Betfair/Gate non necessario
```

#### TEST-058 — StrictMode

```txt
mount/cleanup/remount
→ una sola catena polling per sessione
```

#### TEST-059 — Responsive smoke

```txt
desktop/tablet/mobile
→ navigazione, Stop, modali e contenuto raggiungibili
```

### Decisioni approvate

1. implementare il lato frontend di `IMPL-006` attraverso `IMPL-025`;
2. usare soltanto `eventId` e `trackingSessionId` restituiti dallo Start accettato;
3. la shell può mostrare `starting`, ma i poller live partono soltanto dopo accettazione;
4. Start fallito o ambiguo invalida la sessione e usa cleanup compensativo;
5. tutti i poller adottano `IMPL-026`;
6. Stop completo sospende tutti i poller e conserva lo snapshot frozen;
7. Stop parziale resta visibile come parziale;
8. Betfair polling parte soltanto quando Betfair è configurato;
9. Evidence polling parte soltanto quando Market Reactions viene consumata;
10. implementare `IMPL-009` con stato locale e globale;
11. l’ultimo dato può restare visibile ma marcato `last_verified/frozen/degraded`;
12. tutti gli indicatori derivano dalla state machine;
13. Source Identity espone un context ID opaco e la UI pending è session/context scoped;
14. rimuovere l’authority Source Identity legacy da Market Reactions;
15. creare `IMPL-027` per il rendering Market Reactions;
16. legare Preflight al fingerprint dell’input;
17. rimuovere le tre viste Strategy senza correggerle;
18. mojibake e piccole correzioni restano una task autonoma;
19. responsive resta una task separata dopo la robustezza.

### Ordine tecnico risultante

```txt
IMPL-006
→ backend/session contract

IMPL-025
→ frontend live-session controller

IMPL-026
→ polling runtime session-scoped

IMPL-009
→ persistence UI

IMPL-027
→ Market Reactions frontend view model

TEST-044…058
→ cleanup Strategy
→ piccole correzioni/mojibake
→ responsive + TEST-059
→ Punto 7 test e strutture mancanti
```


---

## 22. Secondo audit del codice — Punto 7: Test e strutture mancanti

**Baseline:** `275008a5cd6451f24c6895068639ee3055395986`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
backend/package.json
frontend/package.json
README.md
.gitignore

backend/src/server.js
backend/src/server.test.mjs
backend/src/sofa/matchHistory/commitId.test.mjs
backend/src/sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
backend/src/routes/evidence/evidenceRoute.test.mjs

launcher/tests/test_launcher.py
scrapers/betfair/graph_url_test.py

frontend/src/hooks/useMatchPolling.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/utils/dashboardConnections.test.mjs

docs/tennis-decision-ui/operations/04-validation-and-rollback.mdx

implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/06-implementazioni-proposte.md
implementazioni/99-decisioni-utente.md
```

Sono stati inoltre controllati sul commit corrente:

```txt
status check GitHub associati
workflow run associati
coerenza del diff del Punto 6
```

Esito:

```txt
nessun status check associato al commit
nessun workflow run associato al commit
suite non eseguite durante l’audit
```

L’assenza di status check non viene interpretata come failure del codice. Indica soltanto che la repository non possiede ancora una validazione automatica collegata al commit.

### Classificazione usata

Per ogni rilievo sono stati distinti:

```txt
bug confermato
limite noto
miglioria utile
documentazione mancante
struttura completamente assente
nessuna azione necessaria
decisione dell’utente richiesta
```

Le decisioni del Punto 7 sono state approvate integralmente dall’utente.

### Esito generale

Il progetto possiede numerosi test utili, ma non possiede ancora un sistema unitario di validazione.

Esistono:

```txt
test Node eseguiti come singoli file
test Python unittest
build frontend
node --check
py_compile / compileall
smoke HTTP locali
checklist manuali
collaudi live documentati
```

Mancano:

```txt
runner canonico
manifest eseguibile
profili di esecuzione
test map machine-checkable
fixture catalogate
frontend interaction harness
timeout uniforme
risultati machine-readable
baseline ripetibili
stato corrente per ogni TEST-ID
```

Non è quindi possibile dichiarare una percentuale di coverage attendibile o una suite completa passata allo SHA corrente.

### Parti solide — nessuna azione distruttiva necessaria

#### Test puri Node

Molti moduli sono già costruiti con:

```txt
node:assert/strict
dependency injection
fake writer
fake timer
fake logger
factory locali
```

`server.test.mjs` verifica, fra l’altro:

- import senza `listen`;
- recovery prima dell’apertura del listener;
- recovery fatale;
- shutdown idempotente;
- health HTTP su porta dinamica;
- redazione degli eventi runtime.

Questi test devono essere registrati dal runner, non riscritti in massa.

#### Isolamento corretto già presente

Diversi test usano:

```txt
os.tmpdir / tempfile
mkdtemp
finally cleanup
server HTTP in-process
porta 0 o ricerca di porta libera
mock subprocess
ripristino delle variabili globali
```

Queste tecniche diventano convenzioni da riutilizzare.

#### Python standard library

I moduli Python puri sono già verificabili con `unittest`.

Non è necessario migrare obbligatoriamente a pytest.

#### Collaudi live separati

Il runbook distingue già:

```txt
test automatico
build/check
smoke HTTP
verifica browser
collaudo live
```

La distinzione è corretta e deve restare esplicita.

Un collaudo storico non diventa automaticamente un PASS corrente.

### WORKFLOW-004 — I registri possono divergere durante gli aggiornamenti

**Classificazione:** `BUG DOCUMENTALE CONFERMATO`
**Stato:** `COMPLETATO`
**Priorità:** alta per l’affidabilità del registro

Dopo il Punto 6, i contenuti dettagliati erano presenti, ma nella Todo erano rimasti:

```txt
SHA corrente verificato del Punto 4
range IMPL-001…024
```

mentre erano già stati approvati e inseriti:

```txt
baseline Punto 6
IMPL-025…027
```

Questo non ha modificato il codice, ma dimostra che l’aggiornamento manuale dei cinque registri può lasciare intestazioni sintetiche incoerenti.

#### Decisione approvata

Estendere `IMPL-005` per controllare:

```txt
SHA baseline dei cinque registri
ultimo Punto completato
ultimo TEST-ID
ultimo IMPL-ID
ultima DEC
range sintetici
prossimo punto
stati incompatibili
```

Il controllo resta read-only e non modifica automaticamente i documenti.

Le due incoerenze sono corrette nel checkpoint del Punto 7. `IMPL-005` è stata implementata, la baseline è stata eseguita e i 29 owner duplicati sono stati normalizzati con esito finale verde.

### TEST-003 — Nessun inventario, manifest o comando test canonico

**Classificazione:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** critica

`backend/package.json` e `frontend/package.json` non espongono uno script `test`.

Non esiste un package root che coordini:

- backend Node;
- frontend Node/build;
- launcher Python;
- scraper Python;
- test persistence;
- validazioni documentali.

I test Node usano mini-runner differenti:

```txt
funzione test custom
runTest custom
contatori passed/failed
process.exitCode
throw finale
console.log
```

Il runbook mantiene manualmente elenchi molto lunghi di file.

#### Impatto

- un test presente può non essere eseguito;
- una rinomina può lasciare un comando obsoleto;
- non esistono timeout uniformi;
- non esiste output JSON comune;
- non è possibile distinguere automaticamente suite minima, estesa, benchmark e live;
- un test che modifica global state può contaminare un altro se aggregato ingenuamente nello stesso processo.

#### Decisione approvata

Creare `IMPL-028`.

La prima versione del runner esegue ogni test legacy come child process separato, senza richiederne la riscrittura preventiva.

### Ampliamento collegato a CODE-005 — Comando lint pubblicato ma non eseguibile

**Classificazione:** `BUG CONFERMATO`
**Stato:** `CONFERMATO E AMPLIATO`
**Priorità:** media

`frontend/package.json` espone:

```txt
npm run lint
```

Il runbook ordina esplicitamente di non eseguirlo perché manca una configurazione ESLint utilizzabile.

Nei percorsi standard controllati non risultano configurazioni ESLint frontend.

#### Decisione approvata

Non rendere immediatamente il full lint un gate obbligatorio.

Sequenza:

```txt
configurazione minima realmente eseguibile
→ fotografia degli errori esistenti
→ lint mirato sui file modificati
→ full lint soltanto dopo baseline pulita
```

Se non si intende configurarlo nella fase corrente, lo script viene rimosso dalla superficie ufficiale anziché lasciato apparentemente supportato.

### Discovery Python non uniforme

**Classificazione:** `BUG DELLA DISCOVERY`
**Stato:** `CORREZIONE APPROVATA`

Diversi test Python seguono il formato:

```txt
graph_url_test.py
diagnostic_redaction_test.py
cdp_url_test.py
```

La discovery standard di `unittest` cerca normalmente file `test*.py`.

Il runner iniziale deve quindi enumerare esplicitamente i moduli correnti.

La standardizzazione a `test_*.py` può avvenire gradualmente quando i file vengono modificati per altri motivi.

Nessuna rinomina massiva è richiesta come prerequisito.

### Isolamento filesystem non uniforme

**Classificazione:** `BUG CONFERMATO IN ALMENO UN TEST`
**Stato:** `CORREZIONE APPROVATA`

`commitId.test.mjs` costruisce una directory sotto:

```txt
process.cwd()/virtual-commit-id-journal/
```

senza cleanup finale.

La directory è esclusa da Git, ma questo nasconde l’accumulo invece di garantire isolamento.

#### Regola approvata

Ogni test che scrive usa:

```txt
fs.mkdtemp(os.tmpdir())
oppure
sandbox assegnata dal runner
```

con cleanup obbligatorio su successo e failure.

Nessun test offline può usare:

```txt
backend/match_history
backend/source_identity_confirmations.json
cache runtime
journal runtime
profili Chrome
dump diagnostici reali
```

### Test route non sempre end-to-end HTTP

**Classificazione:** `LIMITE NOTO`
**Stato:** `MIGLIORIA APPROVATA`

Alcuni test estraggono direttamente gli handler da:

```txt
router.stack
route.stack
handler.handle
```

Questi test verificano bene il mapping locale, ma non coprono:

- mount path reale;
- middleware;
- parsing Express;
- content type;
- serializzazione HTTP;
- comportamento asincrono dell’app completa.

#### Decisione approvata

Preservare i test diretti come unit test.

Per le route critiche aggiungere un harness HTTP reale:

```txt
createApp
→ listen(0)
→ fetch 127.0.0.1
→ assert status/body/header
→ close
```

### Copertura reale non misurabile

**Classificazione:** `LIMITE NOTO E STRUTTURA ASSENTE`
**Stato:** `CONFERMATO`

Non esistono:

```txt
raccolta coverage
comando canonico
elenco completo dei test eseguiti
ultimo esito associato allo SHA
distinzione automatica test presente / test passato
```

I TEST-ID registrati rappresentano obblighi di verifica.

Non implicano automaticamente che il relativo test:

```txt
esista
sia stato eseguito
sia passato
sia stato osservato live
```

#### Stati approvati

```txt
planned
implemented
executed
passed
failed
blocked
live_observed
not_applicable
```

Esempio:

```txt
TEST-048
→ planned
→ non ancora implemented
→ non executed

server.test.mjs / T02
→ implemented
→ ultimo esito corrente non noto in questo audit
```

Nessuna percentuale di coverage viene inserita nei registri senza uno strumento che la produca.

### Frontend interaction harness assente

**Classificazione:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Stato:** `IMPL-030 APPROVATA`
**Priorità:** critica per le correzioni del Punto 6

Il frontend dispone di Vite, React e script Node puri, ma non dispone di:

```txt
Vitest
jsdom
React Testing Library
hook renderer
fake timer frontend
DOM assertions
```

I test correnti di hook verificano utility esportate e normalizzazioni, non montano realmente gli hook.

Senza un harness di interazione non è possibile coprire adeguatamente:

- StrictMode;
- AbortController;
- cambio sessione;
- Stop e snapshot frozen;
- response tardive;
- modali;
- indicatori;
- responsive smoke.

### Fixture non catalogate

**Classificazione:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Stato:** `IMPL-029 APPROVATA`
**Priorità:** alta

Le fixture sono prevalentemente inline e specifiche del file.

Questo è corretto per factory piccole, ma i contratti condivisi possono divergere fra test.

#### Struttura approvata

```txt
test/
├── fixtures/
│   ├── sofa/
│   ├── betfair/
│   ├── evidence/
│   ├── persistence/
│   └── frontend/
├── factories/
├── manifests/
└── schemas/
```

Ogni fixture persistita dichiara:

```txt
fixtureId
schemaVersion
kind
origin: constructed | sanitized_capture
redactionStatus
expectedInvariants
```

Non sono ammessi:

- cookie;
- token;
- profili;
- path locali;
- dump completi;
- dati personali non necessari.

Le factory piccole e locali restano accanto al test quando non rappresentano un contratto condiviso.

### Result artifact machine-readable assente

**Classificazione:** `STRUTTURA COMPLETAMENTE ASSENTE`
**Stato:** `IMPL-031 APPROVATA`
**Priorità:** alta

Gli script stampano output umano, ma non producono un risultato uniforme associato allo SHA.

#### Contratto approvato

```txt
test-results/
└── <timestamp>-<sha>-<profile>.json
```

Campi minimi:

```txt
schemaVersion
repositorySha
profile
startedAt
durationMs
environment
commands
passed
failed
skipped
warnings
limits
perTestResults
buildResult
browserValidationStatus
workingTreeStatus
```

L’artefatto non contiene:

- stdout illimitato;
- URL operative;
- stack con segreti;
- path sensibili;
- payload reali.

Il result JSON non sostituisce il report umano dell’esecutore né `fileModificati.md`.

### Test map eseguibile

**Classificazione:** `MIGLIORIA NECESSARIA`
**Stato:** `ESTENSIONE IMPL-003 APPROVATA`

La matrice test ↔ modulo ↔ documento deve essere alimentata dal manifest.

Campi minimi:

```txt
testId
area
owner
requirementIds
command
type
profile
timeoutSec
serialGroup
fixtures
mutatesFilesystem
liveRequired
status
lastResultSha
```

Il controllo rileva:

- TEST-ID documentato ma assente dal manifest;
- path mancante;
- TEST-ID duplicato;
- test senza owner;
- PASS senza result artifact;
- path documentali obsoleti.

### Baseline e osservabilità

**Classificazione:** `MIGLIORIA NECESSARIA`
**Stato:** `ESTENSIONE IMPL-013 APPROVATA`

Le baseline non sono normali unit test.

Non devono fallire per una singola oscillazione di pochi millisecondi.

Ogni benchmark registra:

```txt
SHA
ambiente
fixtureId
iterazioni
warmup
mediana
p95
dimensione input/output
tolleranza
```

Aree previste:

```txt
history/timeline size
journal bytes
stringify
write
rename
recovery
acquired→recorded delay
source skew
pipeline delay
build frontend
durata suite
```

Le misurazioni usano fixture controllate e non una partita live dell’utente.

### DOC-031 — Runbook Validation monolitico e non verificabile

**Classificazione:** `DOCUMENTAZIONE DA RIFATTORIZZARE`
**Stato:** `CORREZIONE APPROVATA`

Il runbook contiene procedure utili, ma:

- copia numerosi comandi;
- mescola suite, smoke, live e storico;
- non può verificare che i path esistano;
- può diventare obsoleto dopo rinomine;
- non produce un risultato associato allo SHA.

Durante il controllo alcuni path documentati non risultano presenti nella posizione indicata.

Questo non dimostra che non esista una copertura equivalente altrove. Dimostra che il runbook non può essere l’inventario eseguibile canonico.

#### Correzione

Il documento conserva:

```txt
profili
criteri
interpretazione dei risultati
live/manuale
rollback
```

L’elenco eseguibile vive nel manifest di `IMPL-028`.

### DOC-032 — Semantica dello stato test assente

**Classificazione:** `DOCUMENTAZIONE MANCANTE`
**Stato:** `CORREZIONE APPROVATA`

Formalizzare:

```txt
file presente
≠ test eseguito

test eseguito in passato
≠ PASS corrente

build verde
≠ UI verificata

collaudo live storico
≠ scenario riprodotto sullo SHA corrente
```

### CI

**Classificazione:** `MIGLIORIA FUTURA, NON PRIMA STRUTTURA`
**Stato:** `RINVIATA DOPO IL RUNNER LOCALE`

Ordine approvato:

```txt
runner locale deterministico
→ manifest completo
→ suite offline verde
→ result artifact
→ eventuale CI
```

La CI iniziale, quando introdotta, può eseguire soltanto:

- test offline;
- build frontend;
- compile Python;
- controlli documentali.

Non può:

- avviare Chrome reale;
- effettuare login Betfair;
- usare credenziali;
- eseguire tracking live;
- modificare persistence reale.

Il runtime completo è Windows-oriented. Un job Linux può verificare moduli portabili, ma non sostituisce la validazione Windows.

### Strutture completamente assenti approvate

```txt
IMPL-028
→ manifest e runner canonico di validazione

IMPL-029
→ fixture catalog e sandbox condivisa

IMPL-030
→ frontend interaction test harness

IMPL-031
→ validation result ledger e artefatti JSON
```

### TEST-060…075 — Test infrastrutturali mancanti

#### TEST-060 — Manifest univoco

```txt
ogni comando previsto
→ una sola entry
```

#### TEST-061 — Path preflight

```txt
path inesistente
→ failure prima di avviare la suite
```

#### TEST-062 — Process isolation

```txt
ogni test legacy
→ child process separato
→ exit code normalizzato
```

#### TEST-063 — Timeout bounded

```txt
timeout superato
→ processo terminato
→ failure bounded nel report
```

#### TEST-064 — Discovery Python esplicita

```txt
moduli *_test.py correnti
→ inclusi nel manifest
```

#### TEST-065 — Cleanup sandbox

```txt
success/failure
→ sandbox rimossa
```

#### TEST-066 — Runtime directories protette

```txt
profilo offline
→ nessun accesso write alle directory runtime reali
```

#### TEST-067 — Fixture contract

```txt
schema + provenance + redaction
→ validi
```

#### TEST-068 — Coerenza TEST-ID

```txt
registri ↔ manifest
→ nessun missing/duplicate
```

#### TEST-069 — Result schema

```txt
SHA + profilo + conteggi + limiti
→ presenti
```

#### TEST-070 — Result redaction

```txt
segreti/URL/path vietati
→ assenti
```

#### TEST-071 — Frontend StrictMode harness

```txt
hook montato con fake timer
→ lifecycle osservabile
```

#### TEST-072 — Route HTTP harness

```txt
porta dinamica
→ status/body/header reali
```

#### TEST-073 — Profilo fast offline

```txt
nessun browser
nessuna rete esterna
nessun tracking
```

#### TEST-074 — Benchmark contract

```txt
mediana/p95
→ fixture controllata
→ nessun dato live
```

#### TEST-075 — Lint surface

```txt
npm run lint
→ realmente eseguibile
oppure
→ script rimosso
```

### Decisioni approvate

1. creare `IMPL-028` come prima struttura del Punto 7;
2. non riscrivere in massa i test esistenti;
3. eseguire inizialmente ogni test legacy in un child process separato;
4. usare un manifest esplicito come unica lista eseguibile;
5. mantenere Node `assert` o `node:test` per backend e utility nuove;
6. mantenere Python `unittest` e standardizzare i nomi gradualmente;
7. introdurre Vitest, jsdom e React Testing Library per il frontend;
8. escludere qualunque test live dal profilo predefinito;
9. aggiungere timeout e serial group per filesystem, porte e global state;
10. obbligare ogni test che scrive a usare una sandbox temporanea;
11. estendere `IMPL-003` come test map machine-checkable;
12. distinguere sempre planned, implemented, executed, passed e live-observed;
13. creare fixture condivise soltanto per contratti riusati;
14. integrare `IMPL-008`, `IMPL-012` e `IMPL-013` senza fonderle in un mega-harness;
15. produrre un result artifact JSON per ogni profilo;
16. mantenere `fileModificati.md` e il report umano dell’esecutore;
17. non introdurre CI prima che il runner locale sia deterministico;
18. non rendere il full lint un gate prima di una baseline pulita;
19. correggere nel checkpoint del Punto 7 SHA e range obsoleti della Todo.

### Ordine tecnico risultante

```txt
IMPL-005 esteso
→ IMPL-028 runner e manifest
→ IMPL-029 fixture e sandbox
→ IMPL-030 frontend harness
→ IMPL-003 test map
→ IMPL-031 result ledger
→ IMPL-008 persistence profile
→ IMPL-012 replay profile
→ IMPL-013 benchmark profile
→ TEST-060…075
→ eventuale CI offline
→ raggruppamento delle task esecutive Punti 1–7
```



---

## 23. Controllo finale post-audit e avvio della migrazione documentale

**Baseline del codice verificato:** `275008a5cd6451f24c6895068639ee3055395986`
**Checkpoint dei registri:** `eef267aab3c138395a5ca3d644a942190c5360e8`
**Stato:** `COMPLETATO E APPROVATO`

### Scopo

Dopo i Punti 1–7 è stato eseguito un controllo trasversale finale sul percorso:

```txt
acquisizione SofaScore / Betfair
→ scheduler e processi Python
→ Source Identity Gate
→ commit history/timeline
→ journal e recovery
→ API read-only
→ Evidence e Market Reactions
→ polling e presentazione frontend
→ test e documentazione
```

Il controllo non ha eseguito suite o collaudi live. Ha confrontato codice corrente, documenti owner, test presenti e decisioni approvate.

### Esito di completezza

Non è emersa una nuova area critica della raccolta dati dimenticata dai Punti 1–7.

Sono già registrati i gap principali relativi a:

```txt
writer authority
session authority
Betfair runtime authority
local control-plane
storage/recovery verificati
provenance temporale
eligibility Evidence
polling session-scoped
integrity UI
runner e fixture
```

La distinzione obbligatoria è:

```txt
decisione o contratto approvato nei registri
≠
comportamento già implementato nel prodotto
```

Esempi ancora non implementati al checkpoint:

- `trackingSessionId` e `commandId` end-to-end;
- writer lock backend-owned prima della recovery;
- scraper Betfair legato alla sessione logica;
- Stop con esito completo/parziale;
- canonical document contract con revision/head/digest;
- polling frontend con abort e generation guard uniformi;
- UI persistence locale e globale;
- eligibility e provenance complete delle Market Reactions;
- runner canonico di validazione.

### Decisione sulle nuove funzionalità

Non aprire nuove funzionalità prima della stabilizzazione del nucleo.

Ordine:

```txt
struttura documentale
→ validazione minima ripetibile
→ autorità runtime e storage
→ frontend ed Evidence
→ baseline e replay
→ nuova analisi funzionale
```

Le idee future possono restare nei registri o in archivio storico, ma non devono essere presentate come stato corrente della documentazione canonica.

### DOC-033 — Documentazione canonica che anticipa contratti non implementati

**Classificazione:** `BUG DOCUMENTALE CONFERMATO`
**Stato:** `POLICY DI CORREZIONE APPROVATA`
**Priorità:** critica per la riscrittura

Alcuni documenti owner descrivono come già collegati o completi comportamenti che il codice non possiede ancora, in particolare:

```txt
session authority frontend
polling protetto da response tardive
persistence integrity UI completa
Market Reactions eligibility e availability uniformi
storage contract verificato esteso
```

#### Policy approvata

La documentazione canonica nuova descrive soltanto:

```txt
implementato
implementato con limiti espliciti
validato
validazione aperta
deprecato ma ancora presente
```

Le voci soltanto approvate o pianificate restano nei registri fino alla relativa implementazione.

### WORKFLOW-005 — Migrazione documentale per batch

**Classificazione:** `WORKFLOW APPROVATO`
**Stato storico del checkpoint:** `BATCH 0 PREPARATO`; `IMPL-032` è stata completata nel checkpoint documentale successivo.

La migrazione non viene eseguita con una rinomina massiva.

Ogni batch deve includere:

```txt
SHA base
file completi
mapping vecchio → nuovo
owner e stato
link da aggiornare
controlli eseguiti
limiti
rollback
```

Prima della consegna verificare:

1. completezza dell’inventario;
2. assenza di informazioni tecniche uniche perse;
3. coerenza col codice corrente;
4. distinzione fra corrente, storico, deprecato e futuro;
5. link relativi;
6. assenza di duplicati canonici;
7. nessuna cancellazione anticipata.

### TEST-076…079 — Controlli della migrazione

```txt
TEST-076
→ tutti i documenti indicizzati inventariati una sola volta

TEST-077
→ mapping univoco .mdx → .md e nessun duplicato canonico

TEST-078
→ link dei file migrati validi e nessun riferimento a path rimossi

TEST-079
→ stato corrente/deprecato/storico/futuro coerente con codice e registri
```

`TEST-076` è stato eseguito nel Batch 0 sui quaranta documenti elencati dall’indice canonico.

`TEST-077…079` devono essere ripetuti per ogni batch e prima della rimozione finale dei `.mdx`.

### Confini del Batch 0

Il Batch 0 produce soltanto:

```txt
aggiornamento dei registri
inventario documenti
manifest di migrazione
owner matrix
link report
piano dei batch
checklist di validazione
```

Non sostituisce, rinomina o elimina alcun documento canonico.

---

## 24. Schede owner dei controlli di migrazione documentale

Le righe sintetiche `TEST-076…079` erano già presenti nella Todo e il controllo
di coerenza ha confermato l'assenza delle corrispondenti schede owner singole.
Le schede seguenti completano il registro senza rinumerare o cambiare il
significato dei test.

### TEST-076 — Inventario univoco dei documenti canonici

**Stato:** `COMPLETATO`
**Area:** migrazione documentale

Verifica che tutti i documenti indicizzati siano inventariati una sola volta.
Il controllo è stato eseguito nel Batch 0 sui quaranta documenti dell'indice
canonico allora corrente.

### TEST-077 — Mapping univoco MDX → Markdown

**Stato:** `CONFERMATO`
**Area:** migrazione documentale

Verifica, per ogni batch, che ogni sostituzione abbia un solo mapping, che il
nuovo owner sia identificato e che la sovrapposizione temporanea `.mdx`/`.md`
non venga presentata come doppia fonte canonica.

### TEST-078 — Link relativi dei file migrati

**Stato:** `CONFERMATO`
**Area:** migrazione documentale

Verifica che i link relativi risolvano sulla working tree combinata e distingue
target mancanti, anchor mancanti o non verificabili e riferimenti `.mdx` ancora
ammessi soltanto durante la transizione. `scripts/check_documentation_links.py`
fornisce ora il controllo ricorsivo read-only.

### TEST-079 — Coerenza fra corrente, deprecato, storico e futuro

**Stato:** `CONFERMATO`
**Area:** migrazione documentale

Verifica che gli owner canonici descrivano il codice corrente, che le
validazioni storiche non diventino prove correnti, che i componenti deprecati
restino espliciti finché esistono e che il planning futuro non sia presentato
come implementato.

---

## 24. Implementazione iniziale di IMPL-028

**Data:** `2026-08-03`
**Stato:** `IMPLEMENTATA, DA VALIDARE SULLA WORKING TREE LOCALE`

### Perimetro

È stata introdotta la prima versione del runner locale a manifest senza modificare runtime, tracker, scraper o contratti applicativi.

```txt
scripts/validation/test-manifest.json
scripts/validation/run.mjs
scripts/validation/support/
scripts/validation/run.test.mjs
manifest-schema.json
result-schema.json
```

### Comportamento implementato

```txt
profilo esplicito
→ preflight dell'intero manifest
→ selezione entry abilitate
→ esecuzione seriale in child process separati
→ timeout per entry
→ output redatto e bounded
→ exit code 0 / 1 / 2
→ result artifact atomico sotto test-results/
```

Il profilo `fast` rifiuta entry che dichiarano browser, credenziali, rete esterna o tracking. `full-offline` non accetta entry live.

### Manifest iniziale

Sono registrati:

- checker documentali;
- test del runner;
- test backend selezionati e verificati nel Punto 7;
- test frontend Node selezionati e build;
- compileall Python;
- moduli unittest Python enumerati esplicitamente.

`commitId.test.mjs` è catalogato ma disabilitato finché non usa una sandbox temporanea con cleanup garantito. Non viene nascosto come PASS o skip ordinario.

### Limiti dichiarati

- esecuzione interamente seriale;
- mappa dei test non ancora completa (`IMPL-003`);
- artifact corrente senza ledger storico (`IMPL-031`);
- nessun harness persistence (`IMPL-008`);
- nessun benchmark (`IMPL-013`);
- nessun frontend interaction harness (`IMPL-030`);
- nessun browser, login, tracking o test live;
- nessuna CI.

### Verifica del pacchetto

```txt
node --check sui file .mjs
JSON parse dei tre file JSON
17 test runner passati
0 falliti
```

Il manifest e i cinque profili offline sono stati inoltre eseguiti su una repository sintetica che riproduce path, comandi e package boundary senza contenere il codice applicativo:

```txt
fast → 6/6
backend → 6/6
frontend → 5/5
python → 5/5
full-offline → 19/19
```

Questa prova valida infrastruttura, selezione e artifact; non equivale all'esecuzione dei test applicativi reali. Non è stato possibile eseguire i profili backend/frontend/python completi sul codice reale nell'ambiente di preparazione perché non contiene la working tree applicativa. La validazione operativa deve essere eseguita sulla copia locale dell'utente e il risultato non va anticipato.

### Correzione post-validazione locale del manifest

Il preflight reale sulla working tree Windows ha rilevato due `pathChecks` inesistenti per journal e recovery. Tutti i profili hanno restituito exit code `2` prima di avviare child process, confermando il comportamento fail-closed del runner.

Le entry `backend-commit-journal` e `backend-recovery` sono state rimosse dal manifest. Non esiste evidenza di test sostitutivi con quei contratti nel percorso corrente; la copertura resta aperta e non viene conteggiata come PASS o skip. I conteggi corretti sono `backend 4` e `full-offline 17`.



## 25. Chiusura archive e completamento IMPL-015

**Baseline archive:** `2697f66ea8e17a9e35481299cb47ec402558df55`

Sono stati controllati tutti i 64 Markdown della superficie documentale pubblicata e, separatamente, i due ODT presenti in `docs/archive/planning/legacy/`.

Esito archive:

```txt
owner canonici → mantenuti
validations con evidenza → mantenute
registri e audit di lavoro → mantenuti
8 Markdown archive duplicati → consolidati e rimossi
2 ODT → letti, requisiti unici consolidati e rimossi
archive → solo registro fonte/destinazione
```

Sono state corrette anche due dichiarazioni obsolete: il runner canonico è disponibile e `IMPL-032` è completata. La pulizia non cambia codice runtime.

### Esito implementazione IMPL-015

```txt
Prompt 1 e Fix 1:
ac0361ef720831173619636b8ce0057348282fa4

Prompt 2 e Fix 1:
f86ac267919ca13859c98db7015362f26176ba36
```

Risultato:

```txt
writer authority backend-owned
→ acquisizione prima della recovery
→ active e unknown bloccanti
→ reclaim soltanto su owner positivamente morto
→ listener readiness
→ release nei failure path
→ terminal tracker barrier
→ tracker drain
→ authority retained se il drain fallisce
```

Test automatici:

```txt
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
falliti: 0
```

Limite:

```txt
collaudo manuale con due backend reali concorrenti
→ non eseguito
```

`RUNTIME-003`, `DOC-024` e `TEST-004` sono chiusi da IMPL-015. `RUNTIME-002` e gli altri finding della session authority restano aperti e non vengono assorbiti.

Nessuna task successiva viene selezionata da questo riallineamento.
