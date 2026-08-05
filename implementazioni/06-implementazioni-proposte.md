# Tennis Decision UI — Implementazioni utili da valutare

> Queste voci non modificano il prodotto. Sono strumenti di controllo emersi dall’audit B1–B6 e diventano task soltanto dopo una decisione sul loro ordine.

## 13. Esito della classificazione dopo B6

Baseline:

```txt
SHA verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Audit documentazione/codice B1–B6: completato in lettura
```

### IMPL-001 — Controllo automatico dei link Markdown/MDX

**Classificazione:** `NECESSARIA PRIMA DELLA MIGRAZIONE DOCUMENTALE`
**Stato:** `CONFERMATO`

L’indice canonico corrente è stato percorso durante l’audit e non è stato confermato alcun target mancante fra i collegamenti elencati direttamente.

Manca però un controllo globale ripetibile per:

- link relativi tra documenti;
- link `.mdx` da convertire in `.md`;
- target rimossi o spostati;
- anchor locali;
- collegamenti dei registri modulari;
- esclusione controllata dei materiali legacy.

Vincoli:

```txt
read-only
→ nessuna riscrittura automatica
→ output con file sorgente, riga e target
→ supporto temporaneo .mdx e .md
→ errore distinto per target assente e anchor non verificabile
```

Dipendenza:

```txt
prima della rimozione dei vecchi .mdx
```

### IMPL-002 — Inventario automatico degli endpoint

**Classificazione:** `CONSIGLIATA`
**Stato:** `CONFERMATO`

Utilità:

- confrontare router montati ed endpoint documentati;
- rilevare route legacy ancora raggiungibili;
- rilevare documenti che citano route inesistenti;
- produrre una base per la riscrittura dei documenti API.

Non deve sostituire il controllo semantico di payload, status, side effect, persistenza, errori e redazione.

Priorità:

```txt
dopo le correzioni runtime/frontend ad alta priorità
→ prima della riscrittura finale dei documenti API
```

### IMPL-003 — Matrice test ↔ modulo ↔ documento

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO`

L’audit ha verificato che:

- backend e frontend non espongono un comando `test` canonico;
- i test sono eseguiti come file singoli;
- il runbook Validation copia manualmente elenchi molto lunghi;
- alcuni controlli statici puntano a facade e non all’implementazione reale;
- test presenti, test eseguiti e collaudi live devono restare distinti.

Output minimo:

| Area | Owner | Test automatici | Build/check | Live | Ultimo esito |
| --- | --- | --- | --- | --- | --- |

La matrice non deve dichiarare `PASS` senza un output corrente.

### IMPL-004 — Archivio separato dei collaudi storici

**Classificazione:** `CONSIGLIATA`
**Stato:** `CONFERMATO, STRUTTURA DA APPROVARE`

Motivo:

- roadmap e runbook contengono collaudi 9A-R2B, 9B e report live;
- procedure correnti e osservazioni storiche sono mescolate;
- un report storico non deve essere interpretato come prova corrente.

Struttura minima proposta:

```txt
docs/tennis-decision-ui/archive/validations/
└── YYYY-MM-DD-<area>.md
```

Ogni report deve indicare data, SHA, ambiente, passi, risultati, limiti e artefatti disponibili.

Rischio da evitare:

- creare un secondo sistema documentale troppo pesante.

### IMPL-005 — Controllo di coerenza Todo ↔ registri

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO`

B6 ha rilevato concretamente:

- `TEST-001` presente nei registri ma assente dalla Todo;
- numerosi rilievi B3/B4 assenti dal BLOCCO E;
- prefissi `SECURITY-` e `PYTHON-` usati ma non dichiarati nel metodo.

Il controllo deve verificare:

```txt
insieme degli ID
stati incompatibili
prefissi sconosciuti
ID duplicati
ID dettagliati senza riga sintetica
righe sintetiche senza scheda owner
```

Non deve cambiare automaticamente priorità, risolvere decisioni, rinumerare ID o modificare i registri senza revisione.

## 13.1 Ordine consigliato

```txt
1. IMPL-005 — coerenza registri
2. IMPL-003 — matrice test
3. IMPL-001 — link checker prima della migrazione docs
4. IMPL-002 — inventario endpoint prima della riscrittura API
5. IMPL-004 — archivio collaudi durante la nuova struttura docs
```

## 13.2 Cosa non fare adesso

Non trasformare queste utility in un framework generale.

Devono restare:

- locali al repository;
- senza side effect sul runtime;
- eseguibili offline;
- semplici da leggere;
- coperte da test mirati;
- separate dalle feature live.

---

---

## 14. Strutture e procedure assenti emerse da D1–D18

Queste voci sono state registrate su richiesta esplicita durante il ricontrollo delle task completate.

Non sono feature approvate e non devono essere implementate automaticamente.

### IMPL-006 — Session authority end-to-end

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** tracker backend, Source Identity Gate, lifecycle Python/Betfair e polling frontend

### Contratto approvato

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

Backend e frontend devono riferirsi alla stessa `trackingSessionId` restituita da Start.

### Sequenza Start

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

Un solo comando Start può essere corrente.

### Effect guard obbligatoria

Verifica immediatamente prima di:

- osservare Source Identity;
- aggiornare health/runtime;
- modificare `betfairFinished`;
- persistere SofaScore;
- persistere Betfair;
- eseguire bootstrap;
- gestire mismatch;
- applicare conferma;
- pubblicare latest;
- eseguire `setState`.

### Source Identity Gate

Ogni gate contiene `eventId` e `trackingSessionId`.

```txt
gate assente
oppure sessione diversa
→ stale_session
→ nessuna persistenza
```

Mismatch e bootstrap verificano l’autorità prima dell’effetto.

La conferma manuale include `trackingSessionId`; una conferma stale restituisce `409 stale_session`.

### Lifecycle Python e Betfair

- Stop e mismatch usano un cleanup tracking unico;
- il cleanup copre SofaScore e Betfair;
- la Promise Betfair è riutilizzabile soltanto nella stessa `trackingSessionId`;
- il nuovo Start non eredita scraper o Promise della sessione precedente;
- la sessione viene invalidata prima del cleanup fisico.

### Frontend

Tutti i poller live adottano:

- session token;
- request ID monotono;
- AbortController;
- flag disposed;
- controllo prima di ogni `setState`;
- nessuna riprogrammazione del loop dopo cleanup.

Il frontend distingue:

```txt
sessione richiesta
sessione accettata
sessione attiva
sessione statica dopo Stop
```

### Start fallito

Deve:

- invalidare il comando;
- cancellare la sessione confermata;
- fermare tutti i poller;
- resettare dati transitori;
- eseguire cleanup compensativo se la risposta backend è ambigua;
- tornare a uno stato realmente privo di sessione.

### Stop

```txt
status: complete | partial_failure
logicalStop: true
physicalCleanup: complete | partial
pythonCleanup: {...}
```

La UI non mostra Stop completo quando rimangono processi.

Dopo Stop completo:

- tutti i poller sono sospesi;
- gli ultimi dati restano visibili;
- la dashboard passa a modalità statica.

### Cleanup legacy

Rimuovere, dopo ultimo controllo consumer:

```txt
POST /api/match/untrack
buildUntrackMatchResponse
untrackMatch
stopMatchTracker se esclusivo/duplicato
test esclusivi del passthrough legacy
```

### Test obbligatori

```txt
TEST-002
TEST-005
TEST-006
TEST-007
TEST-008
TEST-009
```

### Rischi da evitare

- token backend e frontend non coordinati;
- session identity derivata dall’eventId;
- riuso Promise basato soltanto sulla chiave mercato;
- cleanup dopo la creazione della nuova sessione;
- `no-gate` interpretato come persistenza autorizzata nel tracker;
- top-level `ok:true` che nasconde cleanup parziale.


### IMPL-007 — Boundary pubblico per diagnostica ed errori

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO COME STRUTTURA ASSENTE`

### Problema

Esistono utility di redazione, ma non esiste un serializer pubblico unico e allow-list che delimiti ciò che può attraversare le route HTTP.

### Evidenza collegata

```txt
SECURITY-001
SECURITY-002
SECURITY-003
DOC-019
D17
```

### Responsabilità minima proposta

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

### Vincoli

- nessuna redazione regex come unica barriera;
- nessun pass-through di oggetti Python;
- nessun path locale;
- nessuna URL completa;
- test route-level obbligatori.

---

### IMPL-008 — Harness offline per persistence e recovery

**Classificazione:** `CONSIGLIATA`
**Stato:** `CONFERMATO COME PROCEDURA ASSENTE`

### Problema

Esistono test unitari e integration test, ma non una procedura unica e ripetibile che costruisca fixture controllate per:

```txt
commit completo
partial history
partial timeline
target completed mancante
journal invalido identificabile
recovery riuscita
recovery_failed
```

senza toccare `backend/match_history/` reale.

### Evidenza collegata

```txt
D13
D14
IMPL-003
DOC-021
```

### Responsabilità minima proposta

```txt
directory temporanea
→ writer fake controllati
→ journal isolato
→ bootstrap recovery reale
→ chiamate read-only reali
→ report JSON
→ zero accesso a dati runtime
```

### Utilità

- collaudo deterministico;
- regressioni journal/recovery;
- verifica `409`;
- Evidence degradation;
- preparazione della documentazione operativa.

Non deve diventare un endpoint runtime.

---

### IMPL-009 — Adapter frontend per persistence integrity

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO COME STRUTTURA ASSENTE`

### Problema

Gli hook raccolgono porzioni di integrity, ma non esiste un adapter centrale che costruisca uno stato frontend coerente.

### Evidenza collegata

```txt
FRONTEND-002
DOC-018
DOC-022
D14
```

### Responsabilità minima proposta

Input:

```txt
Sofa integrity
Betfair integrity
Evidence integrity
serverStatus
```

Output separato:

```txt
status
affectedSources
affectedDocuments
reason
isBlockingCrossSource
```

### Vincoli

Non deve:

- eseguire recovery;
- fondere persistence con health;
- fondere persistence con Source Identity;
- inventare una source;
- trasformare `409` in errore generico;
- duplicare la logica backend.

### Consumer minimi

```txt
TopBar o stato globale
BetfairDepthCard
MarketReactionsPage
eventuale pannello diagnostico
```

---

## 14.1 Ordine aggiornato delle implementazioni di supporto

```txt
1. IMPL-005 — coerenza registri
2. IMPL-006 — autorità sessione live
3. IMPL-007 — boundary diagnostica pubblico
4. IMPL-009 — adapter persistence frontend
5. IMPL-003 — matrice test
6. IMPL-008 — harness persistence/recovery
7. IMPL-001 — link checker prima migrazione docs
8. IMPL-002 — inventario endpoint
9. IMPL-004 — archivio collaudi
```

L’ordine definitivo dipende dal raggruppamento delle task e dalle decisioni dell’utente.

---

## 15. Implementazioni emerse dalle decisioni finali

### IMPL-009 — Estensione approvata: persistence locale e pannello globale

La struttura proposta deve produrre:

```txt
adapter persistence unico
→ stato locale per ogni card/settore
→ stato sintetico globale
→ indicatore in fondo alla sidebar
→ modale di controllo dettagliata
```

Il pannello non deve sostituire i messaggi locali e non deve fondere:

- health;
- freshness;
- Source Identity;
- persistence integrity;
- runtime state.

Stato:

```txt
NECESSARIA
DA PROGETTARE PRIMA DELLA TASK FRONTEND
```

### IMPL-010 — Toolkit autonomo per studio delle strategie

**Stato:** `FUTURO`
**Priorità:** dopo robustezza, replay e backtesting

Obiettivo:

creare funzioni e metodi per studiare strategie fuori dal runtime live principale.

Confini:

```txt
timeline canoniche / replay
→ input

analisi autonoma
→ output descrittivi e confrontabili

dashboard live
→ nessuna card Strategy attiva

Market Reactions
→ preservate come Evidence, non convertite in strategia
```

Il toolkit futuro può includere:

- dataset derivati versionati;
- replay deterministico;
- confronto fra ipotesi;
- pesi configurabili;
- metriche di performance;
- report offline;
- nessuna autorizzazione automatica al trade.

Non riusare direttamente la vecchia Strategy UI come base obbligatoria.

### Contratti da preservare dal backlog strategico

Il toolkit deve restare offline e versionato.

Ogni studio deve poter dichiarare:

```txt
studyId
version
conditionSetVersion
input provenance
reason code
status
```

Livelli consentiti inizialmente:

```txt
A — osservazione descrittiva
B — condizioni e motivi di blocco
```

Non introdurre nei primi livelli:

- probabilità;
- fair odds;
- raccomandazioni;
- automazione;
- interpretazioni certe del Money Flow.

La stessa fixture deve poter confrontare due versioni e produrre una differenza esplicita.

Una modalità shadow può calcolare una versione candidata senza mostrarla nella dashboard live e senza modificare la persistenza canonica.

### IMPL-011 — Authority di manutenzione per cleanup offline

**Stato:** `NECESSARIA`
**Priorità:** prima di validare un apply reale

Struttura proposta:

```txt
maintenance lock project-owned
+ manifest runtime
+ porte effettive
+ identità dei servizi
+ recheck metadata file
```

Requisiti:

1. lock esclusivo condiviso con il launcher;
2. fail-closed quando un writer riconosciuto è attivo;
3. controllo delle porte selezionate realmente;
4. nessun kill-by-port;
5. confronto di file identity, size e mtime prima di `unlink`;
6. reason strutturata quando il file cambia dopo lo scan.

Questa struttura non esiste oggi e non deve essere simulata con un controllo generico dei processi.

## 15.1 Backlog UI non prioritario

```txt
[ ] piccole correzioni e rimozioni UI
[ ] responsive form/sidebar/dashboard/card/modali
```

Il backlog UI resta separato dalle task di isolamento sessione, hardening e persistence.

---

## 16. Implementazioni assorbite dal backlog operativo storico

### IMPL-012 — Fixture versionate e replay offline deterministico

**Classificazione:** `NECESSARIA PRIMA DI BACKTESTING E STUDI STRATEGICI`
**Stato:** `STRUTTURA ASSENTE`
**Priorità:** dopo isolamento sessione e contratti pubblici prioritari

### Problema

Molti casi importanti dipendono ancora da una partita live, Chrome, CDP, login e disponibilità del mercato.

Manca una base comune per riprodurre:

- Source Identity pending/mismatch;
- epoch Betfair;
- tick fuori ordine;
- timestamp coincidenti;
- Graph invariati ma acquisiti nuovamente;
- un solo Graph aggiornato;
- Graph disallineati;
- response tardive;
- partial persistence;
- recovery failed;
- Evidence degradate.

### Responsabilità minima

```txt
schema fixture versionato
→ fixture corte e anonimizzate
→ validator

runner offline
→ ordine deterministico
→ tie-breaker esplicito
→ cursore storico
→ nessun dato futuro
→ epoch al cursore
→ policy Source Identity storica
→ freshness e Graph skew
→ Evidence e reason
```

Fonti consentite:

- fixture equivalenti alle timeline canoniche;
- copie anonimizzate e ridotte;
- timeline canoniche lette in sola lettura.

Fonti vietate:

- cache;
- dump;
- browser;
- fetch live;
- stato runtime corrente.

### Relazione con IMPL-008

`IMPL-008` resta specializzato su journal e recovery.

`IMPL-012` è più ampio e copre il dominio temporale, Source Identity, Graph e Evidence.

I due harness possono condividere utility pure, ma non devono diventare un unico mega-runner.

### Criterio di prontezza

- policy storica Source Identity decisa;
- tie-breaker temporale deciso;
- schema fixture definito;
- builder live riutilizzabili senza I/O;
- output reason stabile.

---

### IMPL-013 — Baseline end-to-end di prestazioni, freshness e osservabilità

**Classificazione:** `NECESSARIA PRIMA DI QUALUNQUE OTTIMIZZAZIONE BETFAIR`
**Stato:** `STRUTTURA ASSENTE`
**Priorità:** dopo IMPL-006 e IMPL-012

### Obiettivo

Misurare senza ottimizzare:

```txt
scheduler
→ Python
→ Playwright
→ CDP
→ pagina mercato
→ Graph 1 / Graph 2
→ parsing
→ bridge Node/Python
→ persistenza
→ API
→ frontend
```

### Metriche minime

Per fase:

- durata;
- stato;
- reason;
- righe;
- request count;
- acquisition timestamp;
- freshness;
- Graph skew;
- payload size.

Per sessione:

- p50/p95;
- tick validi/rifiutati;
- timeout/retry;
- partial/recovery;
- CPU/memoria;
- crescita file;
- processi e pagine residue.

### Vincoli

- log strutturali e redatti;
- nessun payload completo;
- nessuna URL sensibile;
- nessun aumento del traffico;
- nessuna modifica ai timeout;
- nessuna nuova cache;
- nessun worker persistente;
- nessuna ottimizzazione nello stesso task.

### Output

```txt
baseline locale
→ JSONL o report strutturato
→ cold start vs steady state
→ p50 / p95
→ colli di bottiglia osservati
→ nessuna conclusione inventata
```

---

### IMPL-014 — Ottimizzazione prudente e reversibile dello scraper Betfair

**Classificazione:** `FUTURA E CONDIZIONATA`
**Stato:** `NON PRONTA`
**Dipendenze:** IMPL-006, IMPL-012 e IMPL-013

### Regola

Ogni fase segue:

```txt
baseline
→ singola modifica
→ test
→ benchmark
→ traffico remoto
→ freshness
→ keep / rollback / needs_more_data
```

### Ordine candidato

1. parsing DOM aggregato;
2. attese basate su condizioni reali;
3. worker Python persistente backend-owned;
4. riuso verificato delle pagine Graph;
5. misurazione e classificazione Graph skew;
6. riduzione delle navigazioni della pagina principale;
7. persistenza più efficiente solo se collo di bottiglia;
8. concorrenza Graph limitata soltanto come ultima opzione.

### Invarianti

- un solo match;
- un solo comando Betfair mutante;
- Chrome non owned;
- Source Identity invariata;
- stessa timeline canonica;
- vecchio DOM non è una nuova acquisizione;
- un solo Graph aggiornato non si combina con il precedente;
- nessun retry aggressivo;
- nessun aumento automatico della frequenza;
- feature flag o rollback per ogni fase.

---

### IMPL-015 — Writer authority esclusiva per `match_history`

**Classificazione:** `NECESSARIA`
**Stato:** `COMPLETATA`
**Priorità:** alta
**Dipendenze:** bootstrap backend, recovery e shutdown

### Problema confermato

Il problema iniziale era che il launcher lock impediva due orchestratori, ma non impediva:

```txt
backend manuale A su 3001
backend manuale B su 3002
→ stessa backend/match_history
→ stesso journal
→ runtime e mappe in memoria distinti
```

Prima di IMPL-015 tutti i percorsi diretti di avvio backend entravano in `startServer()` senza autorità esclusiva sulla persistenza.

### Decisione approvata

```txt
un solo backend writer per repository
```

Ogni backend deve acquisire una writer authority project-owned:

```txt
prima di recovery
prima di listen
prima di qualunque tracking o scrittura canonica
```

### Identità minima

```txt
schema
project marker
backend instanceId
pid
process start fingerprint
createdAt
repository/storage identity
```

### Classificazione

```txt
lock assente
→ acquisibile

owner positivamente morto
→ stale
→ recuperabile

owner vivo e verificato
→ active
→ startup bloccato

identità non verificabile
→ unknown
→ fail-closed
```

### Sequenza

```txt
create backend identity
→ acquire writer authority
→ recovery
→ listen
→ tracking e scritture
→ shutdown
→ release authority
```

### Vincoli

- lock launcher e writer lock restano distinti;
- nessun controllo basato soltanto sulla porta;
- nessun kill del writer esistente;
- nessuna modalità multi-writer;
- nessun backend read-only introdotto ora;
- import di `server.js` senza side effect;
- release soltanto da parte dell’owner;
- recovery non deve partire se l’autorità non è acquisita.

### Test minimi

- secondo backend bloccato prima di recovery;
- owner morto recuperabile;
- owner non verificabile bloccante;
- recovery fatal rilascia l’autorità acquisita;
- failure di listen rilascia l’autorità;
- shutdown ripetuto non rilascia authority altrui;
- backend manuale e launcher rispettano lo stesso writer lock.

### Esito implementazione

File:

```txt
backend/src/runtime/matchHistoryWriterAuthority.js
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.js
backend/src/server.test.mjs
backend/src/sofa/matchTracker.js
backend/src/sofa/matchTracker.test.mjs
```

Comportamenti implementati:

```txt
writer authority project-owned
→ acquire prima della recovery
→ active e unknown bloccanti
→ reclaim soltanto con owner positivamente morto
→ listener readiness reale
→ release nei failure path
→ shutdown idempotente
→ terminal tracker barrier
→ tracker drain prima del release
→ authority retained su drain failure
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

Limite:

```txt
test automatici eseguiti
collaudo live multi-processo non eseguito
```

---

## 17. Implementazioni approvate dal Punto 3

### IMPL-016 — Betfair runtime command authority

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-006`, lifecycle Python, login-window, tracking Betfair

### Problema

Le autorità attuali sono separate:

```txt
loginWindowLifecycle.active
scraperLifecycle.activeScrapers per URL key
trackingSessionId futura
```

Non esiste un arbitro globale che stabilisca quale comando Betfair possa usare browser, profilo e mercato.

### Contratto minimo

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

### Regole

- un solo comando Betfair mutante globale;
- stessa URL key non è sufficiente come identità;
- mercato canonico distinto dalla URL testuale;
- login e tracking richiedono handoff esplicito;
- diagnostica futura sempre non persistente;
- nessun riuso di Promise fra sessioni;
- invalidazione logica prima del cleanup fisico;
- failure/unknown fail-closed;
- nessun kill-by-port.

### Relazione con IMPL-006

`IMPL-006` decide se una callback appartiene alla sessione live.

`IMPL-016` decide quale comando Betfair possiede il runtime browser/scraper.

Le due autorità sono coordinate ma non fuse.

### Test minimi

```txt
TEST-012
+ tracking A vs login concorrente
+ tracking A vs diagnostics
+ handoff login → tracking
+ command stale non rilascia owner nuovo
+ runtime unknown blocca
```

---

### IMPL-017 — Local control-plane boundary

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** bootstrap backend, launcher, inventario endpoint `IMPL-002`

### Problema

Il backend locale espone route mutanti e diagnostiche con CORS aperto e senza bind loopback esplicito nel codice.

### Contratto minimo

```txt
listen host: 127.0.0.1
allowed origins: frontend locale risolto dal launcher
allowed hosts: loopback e porta backend effettiva
mutations: POST JSON
reads: GET senza side effect
```

### Route da classificare

```txt
control plane
→ Start
→ Stop
→ login-window
→ confirm/revoke Source Identity
→ future maintenance/diagnostics

data plane read-only
→ latest
→ json
→ health
→ evidence read-only
```

### Vincoli

- nessuna mutazione tramite GET;
- CORS wildcard vietato per il control plane;
- Origin assente gestita esplicitamente per CLI/test locali;
- nessuna fiducia basata soltanto sul browser;
- nessun indirizzo non loopback;
- test con Host/Origin non ammessi;
- compatibilità con porte alternative del launcher.

### Test minimi

- bind loopback;
- origine frontend ammessa;
- origine esterna rifiutata;
- Host non locale rifiutato;
- GET mutante assente;
- porte alternative consentite tramite manifest/runtime.

---

### IMPL-018 — Betfair acquisition envelope e provenance

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** alta
**Dipendenze:** processor Betfair, timeline canonica, health, `IMPL-012`, `IMPL-013`

### Problema

API mercato e Graph runner vengono acquisiti in istanti diversi ma fusi in un tick con un solo timestamp di registrazione.

Il sistema non può distinguere:

- dato acquisito;
- dato registrato;
- dato sintetico;
- skew fra runner;
- scrape lento ma appena persistito.

### Envelope minimo

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

### Provenance runner

```txt
matchedTotal
matchedValueSource:
  api_runner
  graph_runner
  unavailable
```

È vietata la sorgente sintetica `market_total_divided_by_runner_count`.

### Freshness

```txt
acquiredAt
→ freshness del dato

recordedAt
→ osservabilità della pipeline
```

Un Graph skew oltre soglia produce:

```txt
Money Flow suppressed/degraded
reason: graph_acquisition_skew
```

### Relazioni

```txt
IMPL-012
→ fixture versionate con skew e dati mancanti

IMPL-013
→ durata per fase e ritardo acquired→recorded

IMPL-014
→ nessuna ottimizzazione prima della baseline
```

### Test minimi

```txt
TEST-016
TEST-017
```

---

## 18. Implementazioni approvate dal Punto 4

### IMPL-019 — Event persistence authority

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-015`, `IMPL-006`, journal SofaScore/Betfair

### Problema

La history aggregata appartiene all’evento, ma il journal autorizza i pending per source.

La combinazione permette a un payload journalizzato SofaScore di essere riprodotto dopo un commit Betfair più recente, o viceversa, sovrascrivendo lo shared history con una base obsoleta.

### Autorità minima

```txt
eventPersistenceId
repositoryWriterId
trackingSessionId o null
eventId
commitId
source: sofa | betfair
state: preparing | pending | writing | verifying | complete | failed
historyTarget
timelineTarget
expectedBaseRevision
createdAt
```

### Regole

- un solo commit canonico attivo per evento;
- il lock è event-scoped, non source-scoped;
- qualsiasi pending che coinvolge la shared history blocca entrambe le source;
- la base del documento viene verificata prima di preparare il nuovo payload;
- la source resta metadato del commit, non autorità esclusiva sul target aggregato;
- un callback stale non acquisisce l’autorità;
- una sessione nuova non bypassa un partial precedente;
- un commit non autorizzato non aggiorna mappe runtime;
- release soltanto da parte dell’owner corrente;
- unknown/failure fail-closed.

### Sequenza

```txt
session authority valida
→ acquire event persistence authority
→ resolve pending/recovery
→ read verified base revision
→ prepare documents
→ create journal
→ write e verify
→ publish committed runtime state
→ release event authority
```

### Relazioni

```txt
IMPL-015
→ esclusione fra backend processi

IMPL-019
→ esclusione fra commit dello stesso evento dentro il backend

IMPL-006
→ autorizzazione della callback/sessione

IMPL-016
→ ownership del runtime Betfair
```

### Test minimi

```txt
TEST-019
TEST-020
TEST-025
```

---

### IMPL-020 — Canonical document contract e verified recovery

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-019`, history/timeline store, commit journal

### Contratto documento

Ogni documento canonico dichiara:

```txt
documentType: match_history | sofa_timeline | betfair_timeline
schemaVersion
eventId
source: aggregate | sofa | betfair
revision
headCommitId
createdAt
updatedAt
metadata
```

### Contratto journal

Ogni target contiene:

```txt
target
payload
payloadDigest
expectedBaseRevision
completed
verifiedAt o null
```

Il digest usa un algoritmo stabile documentato e coperto da fixture; non deve dipendere dall’ordine accidentale delle chiavi.

### Read contract

```txt
found
missing
invalid_json
invalid_schema
read_failed
ambiguous
```

Ogni esito contiene almeno:

```txt
ok
status
reason
eventId
source
target
revision
headCommitId
```

### Verified recovery

Per ogni documento, anche quando `completed:true`:

```txt
resolve confined target
→ read
→ validate schema/identity
→ validate revision/head commit
→ validate digest
→ valid: preserve
→ invalid: mark incomplete e rewrite
```

Il journal viene rimosso soltanto quando entrambi i target sono verificati.

### Discovery e migrazione

Regola immediata:

```txt
0 target → missing
1 target → canonical
>1 target → ambiguous_storage
```

Target futuri deterministici:

```txt
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

Migrazione:

- scan read-only;
- manifest legacy → canonical;
- conflitti bloccanti;
- copia/rename atomico dopo verifica;
- nessuna eliminazione prima del confronto digest;
- rollback definito;
- metadata leggibili conservati dentro il documento.

### Security boundary

- eventId numerico e bounded;
- root confinement su ogni target;
- target del journal verificato nuovamente durante recovery;
- nessun path esterno anche se presente in un journal manipolato;
- writer raw non pubblici.

### Compatibilità

La prima task può introdurre reader compatibili con legacy e nuovo schema.

Non è autorizzato:

- riscrivere automaticamente tutti i file runtime durante il primo startup;
- scegliere uno dei duplicati;
- dichiarare sano un documento soltanto perché parseabile;
- trasformare subito lo shared history in un read model derivato.

### Test minimi

```txt
TEST-021
TEST-022
TEST-024
TEST-026
TEST-027
TEST-028
TEST-029
```

---

### IMPL-021 — Recovery control plane

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** alta
**Dipendenze:** `IMPL-015`, `IMPL-019`, `IMPL-020`, runtime logger, `IMPL-009`

### Problema

Il bootstrap distingue fatal/non-fatal ma non espone un’autorità persistente e interrogabile per:

- invalid journal non attribuibili;
- pending retryable;
- tentativi eseguiti;
- escalation;
- writer block;
- rearm.

### Stato globale minimo

```txt
status:
  healthy
  recovering
  partial
  recovery_failed
  integrity_unknown
writersAllowed
pendingCount
failedCount
invalidJournalCount
lastRecoveryAt
outcomes
```

Gli outcomes pubblici sono bounded e allow-list. Path e payload restano nei log interni redatti.

### Stato per record

```txt
attemptCount
lastAttemptAt
lastFailureReason
lastFailedDocument
recoveryState:
  pending
  retryable
  failed
  rearmed
```

### Policy

- recovery bootstrap prima del listen;
- invalid journal non attribuibile → `integrity_unknown`, writer globali bloccati;
- partial attribuibile → writer dell’evento bloccati;
- errore temporaneo → retry bounded;
- soglia o errore permanente → `recovery_failed`;
- nessun retry ad ogni tick;
- rearm soltanto tramite comando locale esplicito, dopo verifica del target o del journal;
- nessuna cancellazione automatica;
- summary bootstrap reale nel log;
- il backend può restare read-only quando la lettura è sicura.

### API/UI future

Il control plane locale potrà esporre una lettura:

```txt
GET /api/runtime/storage-integrity
```

La mutazione di rearm, se introdotta, sarà:

- POST JSON;
- protetta da `IMPL-017`;
- commandId obbligatorio;
- idempotente;
- non disponibile da origini esterne.

`IMPL-009` traduce lo stato in:

```txt
stato locale nel settore coinvolto
+ indicatore globale sidebar
+ modale di dettaglio
```

Non fondere storage integrity con Betfair health, Source Identity o freshness.

### Test minimi

```txt
TEST-023
TEST-030
```

---

## 18.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-008 — Harness persistence/recovery

Aggiungere fixture per:

- pending cross-source sullo shared history;
- target marked complete ma mancante;
- digest errato;
- journal non attribuibile;
- duplicati dello stesso evento;
- retry/escalation/rearm.

### Estensione di IMPL-009 — Adapter frontend persistence

Aggiungere:

```txt
integrity_unknown
writersAllowed
aggregateHistoryIntegrity
documentReadStatus
recovery attempt state
```

### Estensione di IMPL-013 — Baseline storage

Misurare:

- dimensione history/timeline;
- byte del journal;
- durata stringify/write/rename;
- byte totali per partita;
- differenza atomicità/durabilità;
- eventuale costo di fsync configurabile.

Nessuna evoluzione del formato prima di questa baseline.

## 18.2 Ordine approvato

```txt
IMPL-015
→ IMPL-019
→ IMPL-020
→ IMPL-021
→ TEST-019…030
→ IMPL-009
→ IMPL-013
→ evoluzione storage soltanto se misurata
```

---

## 19. Implementazioni approvate dal Punto 5 — Evidence e Market Reactions

### IMPL-022 — Evidence temporal provenance and alignment policy

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** critica

Owner di:

```txt
acquiredAt
recordedAt
sourceSkewSec
pipelineDelaySec
futureSkewSec
baselineGapSec
firstPostSourceGapSec
windowState
```

Regole:

- freshness e source skew restano separati;
- timestamp futuri degradano la qualità;
- una fonte assente produce qualità cross-source `poor`;
- le soglie temporali sono versionate;
- `maxTickGapSec`, se preservato, viene rinominato semanticamente.

Test collegati:

```txt
TEST-037
TEST-039
TEST-043
```

### IMPL-023 — Market Reaction eligibility e branch state

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** critica

Introduce:

```txt
technicalEligibility
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
windowState
```

Esclude dagli eventi algoritmici:

- tick status-only;
- tick stale;
- Graph health non utilizzabile;
- ladder/flow non affidabili;
- skew oltre soglia.

Separa attività matched, variazione runner, osservazione qualificata e marker transition.

Test collegati:

```txt
TEST-031
TEST-032
TEST-034
TEST-035
TEST-038
TEST-041
TEST-042
```

### IMPL-024 — Runner temporal identity e price comparability

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** alta

Contratto:

```txt
selectionId obbligatorio
nessun fallback sul nome
price source esplicita
comparabilità esplicita
baseline bounded
reason strutturate
```

Test collegati:

```txt
TEST-033
TEST-036
TEST-037
```

---

## 20. Implementazioni approvate dal Punto 6 — Frontend

### IMPL-025 — Frontend live-session controller

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** critica

State machine owner:

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

Conserva `trackingSessionId`, `commandId`, eventId restituito dal backend, configurazione richiesta/accettata, snapshot corrente/ultimo verificato, start error e stop result.

### IMPL-026 — Polling runtime session-scoped

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** critica

Primitiva condivisa:

```txt
enabled
sessionKey
requestId
AbortController
single active request
disposed
schedule-after-response
retain policy
HTTP classifier
```

Si applica a SofaScore, Betfair, Evidence e Source Identity Gate.

### IMPL-027 — Market Reactions frontend view model

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** alta

Produce esclusivamente stato presentazionale:

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

Non ricalcola Evidence.

Test collegati:

```txt
TEST-044…059
```

---

## 21. Implementazioni approvate dal Punto 7 — Validazione

### IMPL-028 — Manifest e runner canonico

**Stato:** `IMPLEMENTATA E VALIDATA LOCALMENTE`

Esegue i test legacy in child process separati, con preflight completo, timeout, profili offline e result artifact bounded.

Profili:

```txt
fast
backend
frontend
python
full-offline
```

Non include browser, credenziali, tracking o rete esterna nel profilo predefinito.

### IMPL-029 — Fixture catalog e sandbox condivisa

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** alta

Struttura:

```txt
test/
├── fixtures/
├── factories/
├── manifests/
└── schemas/
```

Ogni fixture persistita dichiara schema, kind, provenance, redaction e invarianti attese.

### IMPL-030 — Frontend interaction test harness

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** critica per il Punto 6

Tecnologie previste:

```txt
Vitest
jsdom
React Testing Library
fake timer
DOM assertions
```

### IMPL-031 — Validation result ledger

**Stato:** `CONFERMATA E APPROVATA`  
**Priorità:** alta

Artifact:

```txt
test-results/<timestamp>-<sha>-<profile>.json
```

Campi bounded: SHA, profilo, durata, comandi, conteggi, warning, limiti, risultati, build e working tree status.

Test collegati:

```txt
TEST-060…075
```

---

## 22. Estensioni delle implementazioni esistenti

### IMPL-003

La test map diventa machine-checkable e collega TEST-ID, area, owner, comando, tipo, profilo, timeout, serial group, fixture e ultimo result SHA.

### IMPL-008

Il profilo persistence include partial cross-source, target completed mancante, digest errato, journal non attribuibile, duplicati, retry, escalation e rearm.

### IMPL-009

L’adapter UI include `partial_persistence`, `recovery_failed`, `integrity_unknown`, `writersAllowed`, aggregate history integrity e stato document read.

### IMPL-012

Le fixture/replay includono provenance temporale, Graph skew, status-only, selectionId mancante e branch Market Reactions degradati.

### IMPL-013

Le baseline includono dimensioni storage, journal bytes, stringify/write/rename, acquisition→recorded delay, source skew, build e durata suite.

---

## 23. IMPL-032 — Manifest e pipeline di migrazione documentale

**Stato:** `IMPLEMENTATA E COMPLETATA`

Ogni batch documentale usa:

```txt
SHA base
file completi
mapping vecchio → nuovo
owner e stato
link da aggiornare
controlli
limiti
rollback
```

Controlli owner:

```txt
TEST-076
TEST-077
TEST-078
TEST-079
```

Il formato canonico è Markdown ordinario. I vecchi `.mdx` sono stati rimossi soltanto dopo sostituzione, verifica link strict e controllo dei duplicati.

---

## 24. Stato finale di IMPL-015

### Esito implementazione

File coinvolti:

```txt
backend/src/runtime/matchHistoryWriterAuthority.js
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.js
backend/src/server.test.mjs
backend/src/sofa/matchTracker.js
backend/src/sofa/matchTracker.test.mjs
```

Comportamenti:

```txt
authority project-owned
acquire prima della recovery
active e unknown bloccanti
reclaim solo su owner positivamente morto
listener readiness
release nei failure path
shutdown idempotente
tracker drain
release fail-closed
```

Commit:

```txt
ac0361ef720831173619636b8ce0057348282fa4
f86ac267919ca13859c98db7015362f26176ba36
```

Test:

```txt
26 authority
10 matchTracker
30 server
0 falliti
```

Limite:

```txt
test automatici eseguiti
collaudo live multi-processo non eseguito
```

**Stato:** `COMPLETATA`

Il riallineamento documentale non seleziona automaticamente IMPL-019, IMPL-006 o un’altra task. Il prossimo passo tecnico deve essere deciso separatamente.

