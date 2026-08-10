# Report documentale — `docs/tennis-decision-ui/architecture/02-data-lifecycle.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-012
Sequenza audit: 12/72
Documento analizzato: 02-data-lifecycle.md
Percorso documento: docs/tennis-decision-ui/architecture/02-data-lifecycle.md
Percorso report: Report documentale/12 - 02-data-lifecycle.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 6be90fb03a32979dd6a5e28f6834ae56d7a74847
Dimensione documento: 260 righe
Ruolo dichiarato: owner del ciclo di vita end-to-end dei dati
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/server.js`;
- `backend/src/sofa/matchTracker.js`;
- `backend/src/sofa/trackerUpdate.js`;
- `backend/src/sofa/betfair/trackerUpdate.js`;
- `backend/src/sofa/betfair/processor.js`;
- `backend/src/sofa/betfair/processor/persistence.js`;
- `backend/src/sofa/betfair/processor/persistenceDecision.js`;
- `backend/src/sofa/betfair/processor/persistenceDocuments.js`;
- `backend/src/sofa/betfair/processor/canonicalTimeline.js`;
- `backend/src/sofa/betfair/timeline.js`;
- `backend/src/sofa/betfair/timeline/state.js`;
- `backend/src/sofa/sourceIdentityGate.js`;
- `backend/src/sofa/sourceIdentityGate/manualConfirmation.js`;
- `backend/src/sofa/matchEvidence/latestMatchEvidence.js`;
- `backend/src/sofa/betfairHealth.js`;
- `backend/src/routes/match/trackingResponses.js`;
- `backend/src/routes/betfair/cdpStatus.js`;
- `frontend/src/App.jsx`;
- `frontend/src/hooks/useLiveTrackingActions.js`;
- `frontend/src/hooks/useMatchPolling.js`;
- `frontend/src/hooks/useBetfairJson.js`;
- `frontend/src/hooks/useMarketReactionEvidence.js`;
- `frontend/src/hooks/useSourceIdentityGateStatus.js`;
- `docs/tennis-decision-ui/architecture/01-system-boundaries.md`;
- `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md`;
- `implementazioni/implementazioni-proposte/02-runtime-betfair.md`;
- le correzioni già registrate nei report API 006, 007, 009, 010 e 011.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale del lifecycle: ALTA
Bootstrap/writer authority: sostanzialmente corretto
Source Identity Gate automatico: sostanzialmente corretto
Persistenza journalizzata: corretta ad alto livello
Shutdown terminale: correttamente descritto
Discrepanze lifecycle rilevanti: 7
Gap documentali/ownership: 2
Modifiche proposte: 9
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti proposti: nessuno
```

Il documento svolge bene il proprio ruolo di vista end-to-end.

Sono corretti:

- writer authority prima di recovery e listener;
- recovery bootstrap;
- separazione SofaScore/Betfair;
- Source Identity Gate automatico;
- bootstrap SofaScore → Betfair non transazionale;
- journal per fonte;
- timeline + history;
- stati pubblici di integrity;
- drain terminale durante shutdown;
- separazione fra health, integrity e Source Identity;
- Evidence ricostruita da persistenza e confirmation store, non dal gate live;
- assenza corrente di una tracking session authority end-to-end;
- assenza di fallback numerici inventati.

Le correzioni più importanti riguardano però il significato effettivo di:

```text
Stop
nuovo Start
Betfair runtime success
manual confirmation
status-only Graph
read-only
frontend polling
```

Il documento deve distinguere meglio:

```text
scrape riuscito
≠ commit riuscito

Stop logico
≠ drain delle operazioni Node già avviate

conferma persistita
≠ bootstrap riuscito

status-only
≠ nessun nuovo tick

read-only
≠ nessun network I/O
```

---

# 1. Flusso bootstrap

## Esito: quasi corretto, ordine da rendere esatto

Il documento mostra:

```text
bootstrap backend
→ writer authority
→ recovery
→ listener readiness e registrazione shutdown
```

Il codice corrente esegue:

```text
create writer authority
→ acquire
→ recovery
→ listen
→ attesa listener ready
→ log backend_ready
→ registrazione handler shutdown
```

Quindi gli handler:

```text
SIGINT
SIGTERM
SIGBREAK su Windows
```

vengono registrati **dopo** che il listener è già risultato ready.

Esiste pertanto una piccola finestra fra:

```text
listener ready
e
shutdown handlers registrati
```

durante la quale un segnale di terminazione non attraversa il normale percorso:

```text
tracker drain
python cleanup
listener close
writer authority release
```

L’authority resta comunque recuperabile al riavvio se il precedente owner è verificato morto, ma il percorso non è il graceful shutdown documentato.

## Finding `DATA-LIFE-001` — rendere esatto il bootstrap e valutare il gap di registrazione shutdown

**Priorità:** media  
**Tipo:** bootstrap lifecycle

### Modifica documentale immediata

Usare:

```text
writer authority acquire
→ recovery
→ listener ready
→ shutdown handlers registered
→ backend operativo
```

### Modifica tecnica da valutare

Valutare se registrare il shutdown handler non appena esiste il server handle, senza attendere la readiness completa, preservando:

- gestione errori di bind;
- close su bootstrap failure;
- release authority;
- test del bootstrap.

Non dichiarare la modifica implementata senza test.

---

# 2. Stop e nuovo Start non equivalgono al drain terminale

## Esito: limite importante non espresso nel lifecycle principale

Il documento spiega correttamente che:

```text
trackedMatches delete
o
scheduler cancel
≠
operazione già avviata completata
```

ma colloca questa proprietà quasi esclusivamente nella sezione shutdown.

Il problema riguarda anche:

```text
POST /api/match/stop
nuovo Start
untrack legacy
```

## Stop manuale

`buildStopMatchResponse` esegue:

```text
stopAllMatchTrackers()
→ terminatePythonProcesses('tracking')
```

ma **non** chiama:

```text
stopAndDrainAllMatchTrackers()
```

Quindi non attende `activeTrackerOperations`.

## Nuovo Start

`trackMatch`:

- elimina gli altri eventId da `trackedMatches`;
- cancella i gate precedenti;
- crea il nuovo gate;
- crea il nuovo tracking state.

Non attende le Promise Node già partite per la sessione precedente.

## Conseguenza

Un `updateSofa()` già partito può:

```text
await loadPayload
→ normalizzare
→ osservare gate
→ persistere
```

dopo che Stop o un nuovo Start hanno già cambiato lo stato logico.

Senza:

```text
trackingSessionId
effect guard
```

la callback non prova di appartenere alla sessione ancora corrente.

Per Betfair, terminare i processi Python riduce la superficie, ma non sostituisce una authority applicata immediatamente prima degli effetti Node.

Questo è precisamente il problema coperto da:

```text
IMPL-006 — Session authority end-to-end
```

già approvata.

## Finding `DATA-LIFE-002` — esplicitare la differenza fra Stop e terminal drain

**Priorità:** critica  
**Tipo:** session authority e stale effects

### Modifica richiesta

Aggiungere una sezione:

```text
Stop corrente
→ rimuove tracking logico
→ termina processi Python tracking
→ non drena necessariamente tutte le Promise Node già avviate

Shutdown terminale
→ attiva terminal barrier
→ stop
→ drain activeTrackerOperations
→ release writer authority
```

### Target approvato

Collegare `IMPL-006`:

```text
nuovo Start
→ invalida sessione precedente
→ cleanup
→ crea trackingSessionId
→ ogni effetto verifica session authority
```

Non descrivere `trackingSessionId` come già implementato.

---

# 3. Betfair runtime: “success” non dipende dal commit

## Esito: frase corrente errata

Il documento afferma:

```text
Lo stato runtime Betfair viene confermato soltanto dopo un commit
canonico riuscito o recuperato.
```

Il codice corrente non applica questa regola.

## Campione tecnicamente usabile

`updateBetfair` esegue:

```text
technical sample usable
→ runtime.lastSuccessfulScrapeAt = now
→ Source Identity observation
→ eventuale persistenza
```

Quindi:

```text
lastSuccessfulScrapeAt
```

viene aggiornato **prima** di sapere se:

- il gate bufferizza;
- la persistenza riesce;
- il commit è `complete`;
- il commit fallisce.

## Mercato finished

Quando:

```text
result.event_status.hasFinished === true
```

il codice esegue:

```text
lastSuccessfulScrapeAt = now
betfairFinished = true
return
```

senza nuovo commit canonico.

## Repair di campione tecnico

Nel ramo:

```text
technical sample unusable
→ repairOnly
```

un journal può essere recuperato, ma `lastSuccessfulScrapeAt` non viene impostato dal ramo recovery.

Quindi il significato reale è più vicino a:

```text
lastSuccessfulScrapeAt
→ scrape tecnicamente riuscito / risultato classificato come successo runtime
```

non:

```text
commit canonico confermato
```

La health Betfair usa questo timestamp anche per decidere se un technical error precedente è ancora attivo.

## Finding `DATA-LIFE-003` — correggere la semantica dello stato runtime Betfair

**Priorità:** alta  
**Tipo:** runtime vs persistence

### Decisione richiesta

Scegliere se:

### A. mantenere il codice corrente

Documentare chiaramente:

```text
scrape success
≠ persistence success

lastSuccessfulScrapeAt
→ runtime acquisition success
```

e usare separatamente:

```text
lastCanonicalTickAt
integrity
commit result
```

per la persistenza.

### B. cambiare semantica runtime

Spostare gli aggiornamenti solo dopo il commit, rinominando o separando i timestamp.

La soluzione B avrebbe impatto sulla health e richiede una decisione esplicita.

Non correggere soltanto il testo se il prodotto desidera davvero commit-confirmed runtime state.

---

# 4. Manual confirmation: persistenza precedente al bootstrap

## Esito: lifecycle incompleto

Il documento descrive il bootstrap cross-source automatico e afferma correttamente che non è una singola transazione filesystem.

Manca però un secondo problema lifecycle, relativo alla conferma manuale.

`confirmGateSession` esegue:

```text
validate
→ upsertSourceIdentityConfirmation
→ apply confirmation
→ onOpenRecording bootstrap
```

Quindi il record di conferma è già persistito prima di conoscere l’esito del bootstrap.

Se:

```text
onOpenRecording
→ failure
```

il gate torna:

```text
pending
```

ma il record persistito non viene rollbackato.

`buildLatestMatchEvidenceFromTimelines`, quando l’identità automatica è `pending`, può leggere:

```text
findApplicableSourceIdentityConfirmation()
```

e applicare il record persistito senza leggere il gate live.

È quindi possibile una divergenza:

```text
gate live
→ pending per bootstrap failed

confirmation store
→ record applicabile presente

Evidence
→ effective Source Identity aligned
```

quando il fingerprint del record resta applicabile.

Questo problema è già registrato da:

```text
EVIDENCE-API-008
```

## Finding `DATA-LIFE-004` — registrare la non atomicità confirmation → bootstrap

**Priorità:** critica  
**Tipo:** consistenza cross-layer

### Modifica richiesta

Aggiungere ai limiti correnti:

```text
manual confirmation persistence
→ precede bootstrap
→ nessun rollback corrente
→ possibile divergenza gate live / Evidence effective
```

### Target

Collegare la decisione da prendere fra:

- persist after bootstrap;
- rollback compensativo;
- confirmation state `pending_bootstrap | active | failed`.

Il documento architetturale non deve scegliere autonomamente la soluzione.

---

# 5. Graph status-only

## Esito: principio corretto, descrizione troppo forte

Il documento afferma:

```text
status-only
→ non aggiorna il baseline canonico
```

La logica corrente è più precisa.

## Cosa succede realmente

Quando:

```text
previous canonical tick esiste
graphLoginRequired = true
graphRowsTotal = 0
timelineIntegrity.accepted = false
```

il sistema può classificare:

```text
graphLoginStatusOnly = true
```

Il nuovo tick:

- clona `market` dal precedente tick;
- clona i `runners` precedenti;
- conserva event status precedente;
- aggiorna graph health e diagnostica;
- riceve un nuovo `seq`;
- riceve un nuovo `commitId`;
- viene aggiunto alla timeline Betfair.

La history viene preparata con:

```text
append: false
```

quindi non viene aggiunta una nuova riga history Betfair.

## Effetto sui confronti successivi

`findLastAlgorithmicTick()` non esclude:

```text
diagnostics.statusOnlyGraphLogin === true
```

Di conseguenza il tick status-only appena aggiunto diventa il `lastTick` usato dai confronti successivi.

Poiché market e runner sono copie del precedente stato canonico, i valori algoritmici non vengono sostituiti da regressioni.

Ma tecnicamente:

```text
un nuovo tick canonico viene aggiunto
e diventa il riferimento timeline successivo
```

## Finding `DATA-LIFE-005` — correggere la semantica status-only

**Priorità:** alta  
**Tipo:** baseline e timeline

### Formula consigliata

```markdown
Il tick status-only non adotta quote, volumi, ladder o Money Flow
regressivi.

Copia market e runner dall’ultimo tick canonico, aggiorna soltanto la
diagnostica Graph, non aggiunge una nuova riga Betfair alla history,
ma aggiunge un nuovo tick alla timeline con seq e commitId propri.
```

Evitare la formula generica:

```text
non aggiorna il baseline canonico
```

senza spiegare quale baseline.

---

# 6. Letture: read-only non significa solo persistenza + memoria

## Esito: eccezione di rete mancante

Il documento afferma che le API di lettura consumano:

```text
dati persistiti
```

e registra due eccezioni:

```text
Betfair latest
→ runtime Betfair in memoria

Source Identity status
→ gate in memoria
```

Manca una terza caratteristica.

`GET /api/betfair/:eventId/latest` chiama il controllo CDP che può eseguire:

```text
fetch(<cdpUrl>/json/version)
```

Quindi la lettura può produrre:

```text
network I/O diagnostico
```

Il probe ha un timeout di 1500 ms tramite `AbortController`, ma il target corrente non è classificato con:

```text
classifyCdpBaseUrl
```

e questo è già registrato come:

```text
BETFAIR-API-001
ARCH-BOUND-006
```

## Finding `DATA-LIFE-006` — distinguere local read, memory read e diagnostic network read

**Priorità:** alta  
**Tipo:** read lifecycle

### Modifica richiesta

Descrivere tre categorie:

```text
persisted read
memory read
bounded diagnostic network read
```

Una GET read-only può avere I/O diagnostico soltanto quando:

- il target è ammesso;
- validato;
- bounded;
- non produce mutazioni.

Registrare l’eccezione corrente Betfair latest come gap da correggere.

---

# 7. Acquisition provenance e timestamp

## Esito: limite importante non registrato

Il lifecycle descrive:

```text
acquisizione
→ normalizzazione
→ tick
→ persistenza
```

ma non evidenzia che il Betfair tick corrente fonde dati acquisiti in momenti diversi.

Il runtime combina:

- market/API data;
- Graph dei runner;
- ladder;
- matched values;

in un tick che possiede un timestamp di registrazione.

Non esistono ancora nel contratto canonico completo:

```text
scrapeId
startedAt
completedAt
marketApiAcquiredAt
graph acquiredAt per selectionId
recordedAt
maxGraphSkewMs
```

Questa assenza è già coperta da:

```text
IMPL-018 — Betfair acquisition envelope e provenance
```

**confermata e approvata**, ma non implementata.

## Conseguenza

Il sistema non può distinguere in modo completo:

```text
dato acquisito ora
da
dato registrato ora

Graph runner A
da
Graph runner B acquisito più tardi

pipeline lenta
da
dato realmente fresco
```

## Finding `DATA-LIFE-007` — aggiungere il limite di provenance temporale

**Priorità:** alta  
**Tipo:** acquisition lifecycle

### Modifica richiesta

Aggiungere ai limiti correnti:

```text
il tick Betfair non possiede ancora provenance temporale completa
per ogni fase e runner
```

Collegare `IMPL-018` come target approvato.

Non descrivere l’envelope come già disponibile.

---

# 8. Frontend polling

## Esito: direzione corretta, stato corrente da rendere più preciso

Il documento afferma:

```text
non esistono AbortController e generation guard uniformi
né uno stop frontend coordinato di tutti i poller
```

La frase è corretta, ma troppo generale.

Alcuni poller hanno già protezioni.

## Poller con session/request guard locale

`useMarketReactionEvidence` usa:

- `sessionId` locale;
- request ID;
- `AbortController`;
- active fetch lock;
- guard prima di `setState`.

`useSourceIdentityGateStatus` usa:

- session ID locale;
- request ID;
- `AbortController`;
- fetch lock;
- cleanup.

## Poller senza la stessa protezione

`useMatchPolling`:

- non usa AbortController;
- non ha request ID;
- non ha session token.

`useBetfairJson`:

- non usa AbortController;
- non ha request ID;
- non ha session token.

## Stop Live Tracking

`handleStopLiveTracking` esegue:

```text
backend Stop
→ stopSofaPolling()
→ trackingStopped = true
```

ma non riceve né chiama:

```text
stopBetfairPolling
stopEvidencePolling
stopSourceIdentityPolling
```

Inoltre non cancella la confirmed session.

Quindi alcuni poller possono continuare a leggere dopo Stop.

Questo è coerente con la necessità di:

```text
IMPL-006
```

ma il documento dovrebbe indicare quali protezioni esistono già e quali mancano.

## Finding `DATA-LIFE-008` — rendere esplicito il lifecycle dei poller frontend

**Priorità:** alta  
**Tipo:** frontend session lifecycle

### Modifica richiesta

Aggiungere una matrice sintetica:

| Poller | Abort | request/session guard locale | Stop coordinato |
| --- | --- | --- | --- |
| Match | no | no | Sofa stop only |
| Betfair | no | no | no |
| Market Reactions | sì | sì | non coordinato dallo Stop corrente |
| Source Identity status | sì | sì | dipende da `sessionShellVisible` |

Collegare il target `IMPL-006`.

Non presentare i guard locali come `trackingSessionId`: sono soltanto meccanismi hook-local.

---

# 9. Ownership documentale e verificabilità

## Esito: documento coerente, ma troppo vicino agli owner specialistici

Il documento replica dettagli significativi di:

- writer authority;
- recovery;
- Source Identity;
- status-only Graph;
- shutdown;
- frontend polling.

Questi dettagli sono utili per capire il flusso, ma rischiano di diventare un secondo owner.

Il documento deve possedere:

```text
ordine end-to-end
handoff fra layer
invarianti
punti di degradazione
stato current vs approved
```

Gli algoritmi devono restare negli owner specialistici.

## Finding `DATA-LIFE-009` — ridurre duplicazioni e aggiungere matrice stage → owner → test

**Priorità:** media  
**Tipo:** ownership documentale

### Modifica richiesta

Mantenere un solo:

```text
02-data-lifecycle.md
```

ma ridurre dettagli duplicati.

Aggiungere una tabella:

| Stage | Owner principale | Evidenza |
| --- | --- | --- |
| bootstrap | `server.js` | server tests |
| writer authority | runtime authority module | authority tests |
| Sofa acquisition | tracking/Sofa modules | tracker/Sofa tests |
| Betfair acquisition | Betfair lifecycle | scraper/processor tests |
| Source Identity | gate modules | gate tests |
| persistence | storage modules | journal/recovery tests |
| read integrity | Match/Betfair/Evidence API | integration tests |
| frontend | polling hooks | hook/frontend tests |
| shutdown | server + tracker + registry | shutdown/drain tests |

Non duplicare liste complete di test.

---

# 10. Source Identity automatico

## Esito: sostanzialmente corretto

Le fasi documentate:

```text
collecting
pending
recording
mismatch
not-applicable
```

corrispondono al gate.

È corretto che:

```text
payload Betfair tecnicamente inutilizzabile
→ non aggiorna candidate o fase
```

È corretto che:

```text
mismatch
→ tracking bloccato
→ cleanup coordinato
```

Il mismatch attuale usa un cleanup globale tracking:

- `stopAllMatchTrackers`;
- invalidazione generation tracking;
- terminazione scraper Betfair.

Il progetto corrente gestisce di fatto un match tracked principale alla volta, ma il documento può precisare che il cleanup è scope tracking globale, non una transazione event-scoped.

Questa precisione può essere inserita in `DATA-LIFE-002`.

---

# 11. Bootstrap cross-source

## Esito: corretto

`persistBootstrapTrackingSamples` esegue:

```text
SofaScore
→ se ok Betfair
```

e non esegue rollback della prima scrittura se la seconda fallisce.

Quindi è corretta la frase:

```text
non è una transazione filesystem unica
```

Il problema separato della manual confirmation è trattato in `DATA-LIFE-004`.

---

# 12. Persistenza canonica

## Esito: corretta ad alto livello

Sono corretti:

```text
backend/match_history/
timeline SofaScore
timeline Betfair
history aggregata
.pending_commits/
.writer_authority/
```

È corretta la distinzione:

```text
writer authority
≠ dato canonico
≠ journal
```

Sono corretti gli stati pubblici:

```text
no_known_partial
partial_persistence
recovery_failed
```

Sono inoltre corretti i limiti già registrati:

- event authority incompleta;
- journal senza revision/head/digest;
- eventId permissivo;
- nessuna transazione cross-source;
- riscrittura documento completo.

Aggiungere ai limiti:

- stale Node operations dopo Stop/Start;
- confirmation-before-bootstrap;
- acquisition provenance;
- read failure collapsing, con rinvio ai report API se utile.

---

# 13. Shutdown terminale

## Esito: sostanzialmente corretto

Il percorso corrente è:

```text
server.close requested
→ timer force exit
→ stopAndDrainTrackers in parallelo
→ terminate Python
→ await tracker drain
→ await listener close
→ release authority se drain valid
→ exit
```

La descrizione del documento è corretta nel principio:

```text
authority release
→ soltanto dopo drain verificato + listener closed
```

È corretto anche:

```text
force timeout
→ non prova drain
→ non rilascia authority anticipatamente
```

La distinzione importante da aggiungere è:

```text
shutdown terminale
≠ Stop live
```

come in `DATA-LIFE-002`.

---

# 14. Evidence

## Esito: corretto, con precisazione necessaria

Evidence non legge il gate live.

Ricostruisce:

- latest Sofa tick;
- active Betfair epoch;
- automatic Source Identity;
- persisted confirmation applicabile;
- persistence integrity;
- quality e Market Reactions.

Quindi la formula più precisa è:

```text
timelines
+ automatic Source Identity ricostruita
+ confirmation store applicabile
+ integrity
→ Evidence
```

e non semplicemente:

```text
timeline + Source Identity
```

Aggiungere inoltre il limite `DATA-LIFE-004`.

---

# 15. Modularizzazione

## Valutazione

```text
Righe: 260
Responsabilità primaria: 1
Ruolo: lifecycle end-to-end
Stage distinti: sì
Owner specialistici esterni: sì
Necessità di separarli in nuovi documenti: no
Rischio maggiore: duplicazione, non lunghezza
Suddivisione richiesta: no
```

Il documento deve restare un unico percorso end-to-end.

Dividerlo in:

```text
bootstrap-lifecycle.md
tracking-lifecycle.md
persistence-lifecycle.md
read-lifecycle.md
```

creerebbe un secondo sistema documentale parallelo agli owner già esistenti.

La soluzione corretta è:

```text
mantenere lifecycle unico
→ ridurre algoritmi duplicati
→ collegare owner
→ registrare handoff e gap
```

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-012
Percorso report: Report documentale/12 - 02-data-lifecycle.md
Documento: docs/tennis-decision-ui/architecture/02-data-lifecycle.md
Change ID: DATA-LIFE-001
Change ID: DATA-LIFE-002
Change ID: DATA-LIFE-003
Change ID: DATA-LIFE-004
Change ID: DATA-LIFE-005
Change ID: DATA-LIFE-006
Change ID: DATA-LIFE-007
Change ID: DATA-LIFE-008
Change ID: DATA-LIFE-009
Suddivisione richiesta: no
Nuovi file proposti: nessuno
```

Nel prossimo aggiornamento:

```text
mappa-file-markdown-repository.md
→ registrare report 012
→ indice 12 ANALIZZATO
→ Divisione non necessaria
→ 9 nuove task
→ prossimo indice 13

modifiche-audit-markdown.json
→ aggiungere soltanto report 012
→ aggiungere soltanto DATA-LIFE-001..009
→ preservare report 008..011 già presenti
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `DATA-LIFE-001` — bootstrap readiness e shutdown registration

**Priorità:** media

**Azione:**

- documentare l’ordine reale;
- distinguere listener ready e handler registration;
- valutare hardening della piccola finestra;
- aggiornare test bootstrap se il runtime cambia.

---

## `DATA-LIFE-002` — Stop, Start e stale Node operations

**Priorità:** critica

**Azione:**

- distinguere Stop live e terminal drain;
- registrare che `activeTrackerOperations` non viene drenato dallo Stop corrente;
- registrare il rischio di callback stale;
- collegare `IMPL-006`;
- non dichiarare session authority già implementata.

---

## `DATA-LIFE-003` — Betfair runtime vs commit

**Priorità:** alta

**Azione:**

- correggere la frase sul runtime confermato dopo commit;
- decidere la semantica di `lastSuccessfulScrapeAt`;
- distinguere scrape, commit e canonical tick;
- aggiornare health/test se il codice cambia.

---

## `DATA-LIFE-004` — manual confirmation e bootstrap

**Priorità:** critica

**Azione:**

- registrare persistenza-before-bootstrap;
- collegare `EVIDENCE-API-008`;
- documentare possibile divergenza gate/Evidence;
- applicare in futuro la soluzione scelta senza duplicare la task owner.

---

## `DATA-LIFE-005` — Graph status-only

**Priorità:** alta

**Azione:**

- correggere la nozione di baseline;
- dichiarare il nuovo tick timeline;
- dichiarare `history append:false`;
- dichiarare market/runner clonati;
- mantenere separate diagnostica e dati algoritmici.

---

## `DATA-LIFE-006` — read-only network diagnostics

**Priorità:** alta

**Azione:**

- distinguere persisted, memory e network reads;
- collegare `BETFAIR-API-001` e `ARCH-BOUND-006`;
- permettere solo probe target-validated e bounded.

---

## `DATA-LIFE-007` — acquisition provenance

**Priorità:** alta

**Azione:**

- registrare l’assenza corrente di provenance temporale completa;
- collegare `IMPL-018`;
- distinguere acquiredAt e recordedAt come target, non stato corrente.

---

## `DATA-LIFE-008` — frontend polling lifecycle

**Priorità:** alta

**Azione:**

- documentare poller già protetti e poller ancora privi di guard uniformi;
- dichiarare che Stop corrente non sospende tutti i poller;
- collegare `IMPL-006`;
- non confondere sessionId hook-local con trackingSessionId.

---

## `DATA-LIFE-009` — ownership e verifica

**Priorità:** media

**Azione:**

- mantenere un unico lifecycle;
- ridurre algoritmi duplicati;
- aggiungere stage → owner → test;
- rinviare agli owner specialistici;
- nessun nuovo documento.

---

# Ordine consigliato di applicazione

```text
1. applicare IMPL-006 o definire il relativo piano esecutivo;
2. risolvere EVIDENCE-API-008;
3. decidere la semantica Betfair runtime success;
4. correggere BETFAIR-API-001;
5. applicare/implementare provenance IMPL-018 quando pianificata;
6. correggere status-only documentation;
7. coordinare tutti i poller frontend;
8. valutare l’ordine shutdown registration;
9. riscrivere in modo mirato 02-data-lifecycle.md;
10. aggiornare mappa Markdown e JSON incrementale.
```

Le task che descrivono principalmente stato corrente sono:

```text
DATA-LIFE-001
DATA-LIFE-003
DATA-LIFE-005
DATA-LIFE-009
```

Le task che dipendono da interventi runtime più ampi già registrati sono:

```text
DATA-LIFE-002
DATA-LIFE-004
DATA-LIFE-006
DATA-LIFE-007
DATA-LIFE-008
```

Non duplicare implementazioni già possedute da:

```text
IMPL-006
IMPL-018
BETFAIR-API-001
EVIDENCE-API-008
```

---

# Controlli previsti dopo un’eventuale modifica

## Bootstrap / shutdown

```bash
node --check backend/src/server.js
node backend/src/server.test.mjs
```

Verificare:

```text
authority prima della recovery
recovery prima del listener
shutdown registration ordering
listener close
drain
release fail-closed
force timeout
```

## Tracking e session lifecycle

```bash
node --check backend/src/sofa/matchTracker.js
node --check backend/src/sofa/trackerUpdate.js
node --check backend/src/sofa/betfair/trackerUpdate.js
```

Test necessari dopo IMPL-006:

```text
Start A
→ update Sofa in flight
→ Start B
→ callback A non persiste

Stop
→ update in flight
→ nessun effetto stale autorizzato

stesso eventId
→ nuova sessione
→ vecchia callback rifiutata
```

## Source Identity

Verificare:

```text
manual confirmation
→ bootstrap fail
→ confirmation non applicabile a Evidence

retry
→ comportamento definito
```

## Betfair runtime

Verificare separatamente:

```text
scrape success
commit success
commit failure
gate buffered
market finished
repair recovered
```

e controllare i timestamp health.

## Status-only Graph

Verificare:

```text
history non append
timeline append
new seq
new commitId
market/runners copiati
graph health aggiornata
futuro tick confrontato senza regressione algoritmica
```

## Read-only

Dopo `BETFAIR-API-001`:

```text
cdpUrl esterna
→ nessun fetch

cdpUrl loopback valida
→ probe bounded
```

## Frontend

Verificare tutti i poller:

```text
Match
Betfair
Market Reactions
Source Identity
```

per:

- Start;
- Stop;
- cambio sessione;
- unmount;
- risposta tardiva;
- abort;
- nessuna riprogrammazione stale.

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
02-data-lifecycle.md: LIFECYCLE SOLIDO, REVISIONE MIRATA NECESSARIA
Writer authority: corretta
Recovery bootstrap: corretta
Source Identity automatico: corretto
Cross-source bootstrap non transazionale: corretto
Persistenza journalizzata: corretta ad alto livello
Terminal shutdown drain: corretto
Stop live vs drain: da distinguere
Stale Node operations: da registrare
Betfair runtime success: descrizione errata
Manual confirmation before bootstrap: limite mancante
Status-only Graph: semantica da correggere
Read-only network probe: eccezione mancante
Acquisition provenance: limite approvato ma non implementato da registrare
Frontend poller lifecycle: da rendere preciso
Riscrittura completa: no
Modularizzazione: no
Nuovi documenti: nessuno
Priorità: alta
```

Il documento non deve essere diviso.

Il suo valore è precisamente mostrare il percorso end-to-end:

```text
acquisizione
→ autorizzazione
→ persistenza
→ lettura
→ Evidence
→ frontend
```

La revisione deve soprattutto rendere espliciti i punti nei quali il lifecycle corrente non possiede ancora una singola authority end-to-end.
