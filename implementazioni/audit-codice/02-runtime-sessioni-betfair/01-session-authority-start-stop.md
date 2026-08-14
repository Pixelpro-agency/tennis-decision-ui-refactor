> **Parte 2 di 7 — Punto 2: Session Authority / Start-Stop**
> [Facade](../02-runtime-sessioni-betfair.md) · [Parte 1](../01-rilievi-iniziali.md) · [Punto 3](02-betfair-lifecycle-control-plane.md) · [Parte 3](../03-storage-recovery.md)

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
**Stato corrente:** `PARZIALMENTE RISOLTO`

Ogni Start crea una nuova `trackingSessionId`; le callback SofaScore e Betfair verificano che la sessione sia ancora corrente prima di osservare il gate e prima della persistenza. Il nuovo Start continua però a sostituire lo stato logico senza eseguire preventivamente un cleanup fisico completo e atteso della sessione precedente.

`trackMatch(...)` sostituisce mappe e gate, ma non:

- invalida prima la sessione logica precedente;
- invalida la generation tracking;
- termina e attende tutti i figli precedenti;
- invalida Promise e callback JavaScript;
- verifica un token prima degli effetti.

Una callback precedente può trovare il gate assente e ricevere `action: no-gate`. Nel checkpoint, SofaScore e Betfair trattavano `no-gate` come autorizzazione a persistere.

### RUNTIME-004 — Riavvio dello stesso eventId contamina il gate nuovo

**Stato:** `CONFERMATO`
**Priorità:** critica
**Stato corrente:** `RISOLTO`

Il gate conserva `trackingSessionId` e rifiuta con `stale_tracking_session` un campione appartenente a una sessione diversa. Anche i callback del tracker verificano l’ID corrente prima degli effetti persistenti.

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
**Stato corrente:** `APERTO`

`POST /api/match/untrack`, `buildUntrackMatchResponse(...)` e `untrackMatch(...)` sono ancora presenti. La route rimuove tracker e gate, ma non esegue il cleanup fisico di `/stop`.

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

Prima della rimozione va comunque verificata l’assenza di ulteriori consumer.

### RUNTIME-006 — Un mismatch stale può fermare la sessione corrente

**Stato:** `CONFERMATO`
**Priorità:** critica
**Stato corrente:** `RISOLTO` nel percorso osservazione-gate

Un campione stale viene scartato prima della valutazione del gate; non può quindi attivare il callback mismatch della sessione corrente.

`onMismatch` cattura soltanto `eventId`. Prima di fermare tracker, invalidare generation e terminare Betfair non dimostra di appartenere alla sessione ancora attiva.

### RUNTIME-007 — La Promise Betfair può essere riutilizzata tra sessioni logiche

**Stato:** `CONFERMATO`
**Priorità:** critica
**Stato corrente:** `RISOLTO`

Il lifecycle riusa una Promise soltanto quando coincidono chiave, runtime identity e `trackingSessionId`. A parità di chiave e runtime, una sessione diversa produce `scraper_session_conflict`.

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
**Stato corrente:** `PARZIALMENTE RISOLTO`

Il mismatch invalida la generation tracking e termina sia gli scraper Betfair sia i processi Python del ruolo tracking, includendo SofaScore. Il cleanup resta globale e asincrono, non una sequenza atomica posseduta dalla singola sessione.

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
**Stato corrente:** `PARZIALMENTE RISOLTO`

`buildStopMatchResponse(...)` restituisce `ok: false` quando lo stop logico fallisce oppure il cleanup Python non è completo e include il riepilogo `pythonCleanup`. Non espone però integralmente i campi `status`, `logicalStop` e `physicalCleanup` definiti dal target del checkpoint.

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
**Stato corrente:** `RISOLTO`

La conferma include `trackingSessionId`; il backend confronta l’ID con quello del gate attivo e risponde `409 stale_session` in caso di sessione diversa.

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
**Stato corrente:** `RISOLTO` per i poller verificati

`useMatchPolling`, `useBetfairJson`, `useMarketReactionEvidence` e `useSourceIdentityGateStatus` usano generation di polling, request ID e `AbortController` e verificano l’autorità prima degli aggiornamenti di stato.

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
**Stato corrente:** `RISOLTO` per lo stato frontend

La sessione diventa attiva soltanto dopo una risposta Start valida contenente `trackingSessionId`. In caso di errore il frontend azzera bootstrap, sessione confermata, stato attivo e ID e nasconde la session shell.

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
**Stato corrente:** `RISOLTO`

Il cleanup incrementa la generation, cancella il timeout e abortisce la request attiva; ogni ciclo verifica generation e flag corrente prima di riprogrammarsi.

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
**Stato corrente:** `PARZIALMENTE RISOLTO`

La risposta Start valida restituisce l’autorità della sessione risultante, ma non risulta un `commandId` end-to-end o un arbitro esplicito che determini quale risposta debba prevalere fra Start concorrenti.

Il pulsante Start usa `sofaLoading`, che appartiene al polling timeline e non al comando `POST /track`.

Mancano:

- `startPending`;
- command ID;
- deduplicazione;
- invalidazione esplicita del comando precedente.

### Nota iniziale collegata a FRONTEND-007 — Stop Live Tracking lascia attivi altri poller

**Stato:** `CONFERMATO`
**Priorità:** medio-alta
**Stato corrente:** `PARZIALMENTE RISOLTO`

Tutti i poller diventano inattivi quando `sessionActive` passa a falso. La conservazione statica Betfair non è completa perché `useBetfairJson` azzera `lastKnownData` e `lastKnownMoneyFlowHistory` quando URL ed eventId diventano inattivi.

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
**Stato corrente:** `RISOLTO NEL CODICE`

Generation Python, `trackingSessionId` e generation/request identity frontend sono autorità distinte nel comportamento corrente.

La generation protegge il figlio Python, non l’intera catena applicativa.

La distinzione documentale corretta è:

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
**Stato corrente:** `PARZIALMENTE COPERTO`

Sono coperti cambio evento, abort, risposta tardiva e stop/resume dei poller. Non risulta una copertura completa dell’arbitraggio fra Start concorrenti.

- cambio eventId con risposta tardiva;
- stesso eventId con nuova sessione;
- Start fallito;
- Start concorrenti;
- Stop durante fetch;
- loop orfano;
- reset di tutti i poller.

#### TEST-005 — Sostituzione sessione backend

**Stato:** `MANCANTE`
**Stato corrente:** `PARZIALMENTE COPERTO`

I test coprono lo scarto dei campioni SofaScore e Betfair stale e la race prima della persistenza. Non coprono una sostituzione Start atomica con cleanup preventivo e atteso.

- Start A → Start B;
- Start A → nuovo Start A;
- callback A non osserva o persiste nella sessione B;
- mismatch A non ferma B;
- Stop invalida prima del cleanup.

#### TEST-006 — Riuso Betfair session-safe

**Stato:** `MANCANTE`
**Stato corrente:** `COPERTO`

Stessa chiave e stessa runtime identity non bastano per riusare una Promise appartenente a un’altra `trackingSessionId`.

#### TEST-007 — Cleanup mismatch completo

**Stato:** `MANCANTE`
**Stato corrente:** `PARZIALMENTE COPERTO`

È coperta la terminazione dei processi tracking; il cleanup non è posseduto dalla singola sessione.

Mismatch deve terminare o rendere definitivamente stale sia SofaScore sia Betfair.

#### TEST-008 — Stop partial failure

**Stato:** `MANCANTE`
**Stato corrente:** `COPERTO` secondo il payload corrente

Backend e frontend devono distinguere Stop logico e cleanup fisico parziale.

#### TEST-009 — Conferma Source Identity stale

**Stato:** `MANCANTE`
**Stato corrente:** `COPERTO`

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
