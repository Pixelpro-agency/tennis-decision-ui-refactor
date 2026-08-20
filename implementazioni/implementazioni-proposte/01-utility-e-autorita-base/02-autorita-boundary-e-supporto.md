> **Facade:** [01-utility-e-autorita-base.md](../01-utility-e-autorita-base.md)
> **Registro principale:** [06-implementazioni-proposte.md](../../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-006/007/008/009/011/015
> **Parte precedente:** [Utility e controlli](01-utility-e-controlli.md)
> **Parte successiva:** [Offline, replay, strategy e performance](03-offline-replay-strategy-performance.md)

# Tennis Decision UI — Authority, boundary e supporto

> Questo child possiede le schede `IMPL-006`, `IMPL-007`, `IMPL-008`, `IMPL-009`, `IMPL-011` e `IMPL-015`. Distingue il checkpoint D1–D18 dalle decisioni successive e dai closeout post-implementazione. L’ordine §14.1 è storico e non costituisce una priorità operativa corrente.

## 14. Strutture e procedure assenti emerse da D1–D18

Queste voci furono registrate durante il ricontrollo delle task completate. Al momento della registrazione non costituivano automaticamente feature approvate; le decisioni successive sono indicate nelle singole schede. Le descrizioni di problema, contratto e sequencing che seguono sono conservate come contesto storico e non devono essere lette automaticamente come descrizione dello stato corrente.

Dove esiste una materializzazione successiva, il registro la segnala separatamente senza trasformare la voce in completata in assenza di un closeout.

### IMPL-006 — Session authority end-to-end

**Classificazione storica:** `NECESSARIA`
**Stato del registro:** `APPROVATA, NON CHIUSA`
**Priorità storica:** critica
**Dipendenze storiche:** tracker backend, Source Identity Gate, lifecycle Python/Betfair e polling frontend

#### Stato attuale

Una parte sostanziale del concetto di session authority è oggi presente:

- `backend/src/sofa/matchTracker.js` assegna a ogni nuovo Start un `trackingSessionId` e lo conserva nel tracker e nel Source Identity Gate;
- gli update SofaScore e Betfair ricevono una guardia `isTrackingSessionCurrent` che confronta la sessione catturata con quella ancora registrata;
- `backend/src/routes/match/trackingResponses.js` restituisce `trackingSessionId` nella risposta di Start;
- `frontend/src/hooks/useLiveTrackingActions.js` considera fallito lo Start se la risposta non contiene una session authority e memorizza l’ID accettato;
- `frontend/src/App.jsx` mantiene `trackingSessionId` nello stato della sessione.

Il contratto storico completo, tuttavia, **non è implementato integralmente**:

- il `trackingSessionId` corrente è generato come `tracking-N`, non come UUID;
- il contratto di Start ispezionato non usa un `commandId`;
- Stop viene inviato per `eventId` e la risposta corrente non espone il contratto storico `status / logicalStop / physicalCleanup`;
- `buildUntrackMatchResponse` e `untrackMatch` sono ancora presenti;
- il nuovo Start crea la nuova sessione dopo aver rimosso altri tracker e pulito i gate, ma il comportamento corrente non implementa l’intera sequenza storica «invalidate → cleanup fisico verificato → nuova sessione»;
- questi elementi non giustificano quindi un closeout di `IMPL-006`.

#### Contratto storico approvato

```txt
trackingSessionId
→ UUID immutabile
→ nuovo per ogni Start
→ cambia anche con lo stesso eventId

commandId
→ identifica Start, Stop e Confirm

eventId
→ identità della partita
→ non identità della sessione
```

Backend e frontend dovevano riferirsi alla stessa `trackingSessionId` restituita da Start.

#### Sequenza Start storicamente richiesta

```txt
ricevi Start con commandId
→ invalida la sessione precedente
→ invalida generation tracking
→ cleanup completo precedente
→ verifica cleanup
→ crea trackingSessionId
→ crea gate e tracker associati
→ restituisce trackingSessionId
→ attiva poller frontend
```

#### Effect guard storicamente richiesta

La guardia doveva precedere gli effetti su Source Identity, health/runtime, `betfairFinished`, persistenza SofaScore/Betfair, bootstrap, mismatch, conferma, pubblicazione latest e `setState`.

#### Source Identity Gate

Il target storico richiedeva che ogni gate contenesse `eventId` e `trackingSessionId` e che una sessione stale non potesse produrre persistenza. Il tracker corrente conserva effettivamente `trackingSessionId` nel gate avviato dal tracker, ma il closeout end-to-end della task non risulta completato.

#### Lifecycle Python, Betfair e frontend

Restano come requisiti storici della voce:

- cleanup coordinato di tracker e processi;
- nessun riuso di effetti appartenenti a una sessione precedente;
- poller frontend protetti da autorità di sessione e cleanup;
- stato statico dopo Stop senza confondere il contenuto ultimo noto con una sessione ancora attiva.

#### Cleanup legacy

Il target storico prevedeva la rimozione, dopo controllo dei consumer, di:

```txt
POST /api/match/untrack
buildUntrackMatchResponse
untrackMatch
stopMatchTracker se esclusivo/duplicato
test esclusivi del passthrough legacy
```

Il progetto contiene ancora `buildUntrackMatchResponse` e `untrackMatch`; questa parte del target non è quindi chiusa.

### IMPL-007 — Boundary pubblico per diagnostica ed errori

**Classificazione storica:** `NECESSARIA`
**Stato del registro:** `NON COMPLETATA`

#### Problema storico

La voce richiedeva un boundary pubblico allow-list che impedisse a errori interni, path locali, URL complete, payload raw o dettagli Python di attraversare accidentalmente le route HTTP.

#### Stato attuale

Sono presenti boundary e hardening locali in più punti, ma non un «serializer pubblico unico» che consenta di chiudere la task:

- `backend/src/server.js` riduce alcuni campi di writer authority e tracker drain a token bounded prima di loggarli;
- `backend/src/routes/betfair/latestPayload.js` normalizza esplicitamente il blocco `integrity` verso status, source e documenti ammessi;
- il percorso storico `backend/src/routes/betfair/oddsResponse.js` non è presente; la superficie Betfair corrente pertinente è `latestPayload.js`.

Questi boundary locali non costituiscono un serializer pubblico unico e trasversale a tutte le route. Il closeout di `IMPL-007` resta quindi assente.

#### Responsabilità storica minima

```txt
errore interno
→ code pubblico stabile
→ messaggio pubblico bounded
→ dettagli completi soltanto nel log interno redatto

network_capture interna
→ contatori allow-list
→ nessun dump_dir
→ nessun path
→ nessun payload raw
```

Vincoli storici da preservare: nessun pass-through non controllato di oggetti interni, nessun path locale o URL completa nei payload pubblici e test route-level per i contratti esposti.

### IMPL-008 — Harness offline per persistence e recovery

**Classificazione storica:** `CONSIGLIATA`
**Stato del registro:** `NON COMPLETATA`

#### Problema storico

La proposta richiede una procedura isolata e ripetibile che costruisca fixture controllate per commit completo, partial history/timeline, target mancanti, journal invalido, recovery riuscita e `recovery_failed`, senza toccare `backend/match_history/` reale.

#### Stato attuale

`scripts/validation/test-manifest.json` rende esplicito lo stato corrente del profilo dedicato:

```txt
profile: persistence
enabled: false
status: planned
reason: Dipende da IMPL-008 e dalla sandbox persistence dedicata.
```

Il validation runner dichiara inoltre tra i propri limiti che i profili `live`, `persistence` e `benchmark` non sono abilitati dall’implementazione corrente.

Esistono test backend e integration test pertinenti alla persistence, ma la codice corrente stessa non li presenta come sostituto dell’harness isolato richiesto da `IMPL-008`. La voce resta quindi aperta.

#### Responsabilità storica minima

```txt
directory temporanea
→ writer fake controllati
→ journal isolato
→ bootstrap recovery reale
→ chiamate read-only reali
→ report JSON
→ zero accesso a dati runtime
```

L’harness non deve diventare un endpoint runtime.

### IMPL-009 — Adapter frontend per persistence integrity

**Classificazione storica:** `NECESSARIA`
**Stato del registro:** `NON CHIUSA; ADAPTER CENTRALE PRESENTE`

#### Problema storico

La voce nasceva quando gli hook esponevano frammenti di integrity senza un punto centrale capace di costruire uno stato frontend coerente.

#### Stato attuale

La descrizione storica «struttura assente» non è più corretta.

Il progetto contiene `frontend/src/utils/persistenceViewState.js`, usato direttamente da `frontend/src/App.jsx`. `buildPersistenceViewState()` riceve gli stati di integrity SofaScore, Betfair ed Evidence, `evidencePersistenceComplete` e gli errori delle tre superfici, e produce uno stato sintetico:

```txt
inactive
waiting
current
degraded
error
```

`partial_persistence`, `recovery_failed` e `degraded` vengono ricondotti allo stato frontend `degraded`; `evidencePersistenceComplete === false` produce lo stesso esito. `frontend/src/utils/persistenceViewState.test.mjs` copre i casi principali.

`App.jsx` passa poi `persistenceViewState` a `DashboardWorkspace` e `OverviewDashboard`.

Questa implementazione **materializza l’adapter centrale**, ma non coincide integralmente con il contratto storico sotto riportato: l’output corrente è centrato su `status`, `label` e `integrity`, non espone direttamente tutti i campi `affectedSources`, `affectedDocuments`, `reason` e `isBlockingCrossSource`. In assenza di un closeout storico della voce, il registro non la promuove automaticamente a `COMPLETATA`.

#### Contratto storico da preservare

Input previsto:

```txt
Sofa integrity
Betfair integrity
Evidence integrity
serverStatus
```

Output previsto:

```txt
status
affectedSources
affectedDocuments
reason
isBlockingCrossSource
```

Vincoli storici:

- non eseguire recovery nel frontend;
- non fondere persistence con health o Source Identity;
- non inventare source;
- non trasformare `409` in errore generico;
- non duplicare la logica backend.

## 14.1 Ordine aggiornato delle implementazioni di supporto — checkpoint storico

La sequenza è conservata come decisione del checkpoint. Non va interpretata come priorità corrente: `IMPL-005`, `IMPL-001` e `IMPL-004` hanno closeout, mentre altre voci presentano implementazioni parziali successive.

```txt
1. IMPL-005 — coerenza registri
2. IMPL-006 — autorità sessione live
3. IMPL-007 — boundary diagnostica pubblico
4. IMPL-009 — adapter persistence frontend
5. IMPL-003 — matrice test
6. IMPL-008 — harness persistence/recovery
7. IMPL-001 — controllo link documentali
8. IMPL-002 — inventario endpoint
9. IMPL-004 — separazione dei collaudi storici dagli owner
```

## 15. Decisioni successive pertinenti ad authority, boundary e supporto

### Estensione approvata di IMPL-009 — Persistence locale e pannello globale

La decisione storica prevedeva:

```txt
adapter persistence unico
→ stato locale per ogni card/settore
→ stato sintetico globale
→ indicatore in fondo alla sidebar
→ modale di controllo dettagliata
```

Il pannello non doveva sostituire i messaggi locali né fondere health, freshness, Source Identity, persistence integrity e runtime state.

#### Stato attuale

L’adapter unico e lo stato sintetico globale risultano materializzati tramite `buildPersistenceViewState()` e il wiring in `App.jsx`.

L’intero target storico dell’estensione non risulta chiuso, in particolare per l’insieme «indicatore in fondo alla sidebar + modale dettagliata». L’estensione resta quindi una decisione storica **parzialmente materializzata**, non un nuovo closeout autonomo.

### IMPL-011 — Authority di manutenzione per cleanup offline

**Stato del registro:** `NON COMPLETATA`
**Priorità storica:** prima di validare un apply reale

Il target storico richiede:

```txt
maintenance lock project-owned
+ manifest runtime
+ porte effettive
+ identità dei servizi
+ recheck metadata file
```

e, in particolare, un’autorità esclusiva condivisa con il launcher, fail-closed sui writer riconosciuti, nessun kill-by-port e confronto di identità/size/mtime immediatamente prima dell’unlink.

#### Stato attuale

Esiste già `scripts/cleanup_runtime_cache.py`, ma è una **primitiva di retention**, non la maintenance authority descritta dalla task.

Il comportamento corrente è:

- allow-list limitata a `backend/betfair_cache` e `backend/scraper_cache`;
- scansione non ricorsiva di file JSON regolari;
- modalità predefinita `dry-run`;
- `--apply` richiede conferma offline esplicita;
- l’apply viene bloccato se esiste `launcher/.runtime/launcher.lock` o se risultano occupate le porte loopback 3000/3001;
- prima della rimozione il path viene ricontrollato come file regolare e non symlink.

Non risultano invece implementati, in questa utility, il maintenance lock project-owned, un runtime manifest con identità dei servizi o il confronto completo dell’identità/size/mtime del candidato fra scan e unlink.

`IMPL-011` resta quindi aperta; l’esistenza della utility di retention non ne costituisce il closeout.

## 15.1 Backlog UI non prioritario

```txt
[ ] piccole correzioni e rimozioni UI
[ ] responsive form/sidebar/dashboard/card/modali
```

Il backlog UI resta separato dalle task di isolamento sessione, hardening e persistence.

---

## 16. Closeout storico pertinente

### IMPL-015 — Writer authority esclusiva per `match_history`

**Classificazione storica:** `NECESSARIA`
**Stato del registro:** `COMPLETATA`
**Priorità storica:** alta
**Dipendenze:** bootstrap backend, recovery e shutdown

#### Problema confermato

Il problema originario era la possibilità di avviare più backend distinti contro la stessa `backend/match_history`, perché il launcher lock proteggeva l’orchestrazione ma non costituiva un’autorità esclusiva sulla persistenza.

Decisione approvata:

```txt
un solo backend writer per repository
```

#### Stato attuale

Il closeout è compatibile con l’implementazione corrente.

`backend/src/runtime/matchHistoryWriterAuthority.js` implementa una writer authority project-owned sotto lo storage `match_history`, con record che includono:

```txt
schema
project marker
backendInstanceId UUID
pid
process start fingerprint
createdAt
repository identity
storage identity
```

La classificazione del record distingue owner vivo verificato, owner morto e identità non verificabile. I casi non verificabili sono trattati fail-closed; il reclaim è consentito soltanto quando l’owner risulta positivamente morto.

`backend/src/server.js` applica la sequenza:

```txt
create writer authority
→ acquire
→ pending commit recovery
→ listen e readiness
→ runtime
→ shutdown
→ tracker drain
→ release authority
```

In particolare:

- la recovery non parte se l’acquisizione non riesce;
- una recovery fatal rilascia l’authority acquisita prima di fallire lo startup;
- un failure di listen rilascia l’authority;
- lo shutdown chiude il listener, termina i processi Python e drena le operazioni tracker;
- l’authority viene rilasciata soltanto dopo un drain tracker riuscito;
- su drain failure l’authority viene trattenuta;
- `backend/src/sofa/matchTracker.js` espone una terminal tracker barrier e `stopAndDrainAllMatchTrackers()`.

Questi elementi descrivono il comportamento corrente.

#### Vincoli conservati

- launcher lock e writer authority restano concetti distinti;
- nessun controllo basato soltanto sulla porta;
- nessun kill del writer esistente;
- nessuna modalità multi-writer;
- recovery subordinata all’acquisizione dell’authority;
- release soltanto attraverso il lifecycle dell’owner.

#### Test e provenance

Sono presenti i test dedicati:

```txt
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.test.mjs
backend/src/sofa/matchTracker.test.mjs
```

Il registro storico conservava inoltre questa provenance di implementazione:

```txt
commit storici:
ac0361ef720831173619636b8ce0057348282fa4
f86ac267919ca13859c98db7015362f26176ba36

esito storico registrato:
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
falliti: 0

limite storico:
collaudo live multi-processo non eseguito
```

Questi conteggi sono mantenuti come **provenance storica del closeout** e non rappresentano un nuovo esito dei test.

---
