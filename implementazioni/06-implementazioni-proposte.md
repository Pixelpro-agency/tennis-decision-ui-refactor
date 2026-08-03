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
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** alta
**Dipendenze:** bootstrap backend, recovery e shutdown

### Problema confermato

Il lock launcher impedisce due orchestratori, ma non impedisce:

```txt
backend manuale A su 3001
backend manuale B su 3002
→ stessa backend/match_history
→ stesso journal
→ runtime e mappe in memoria distinti
```

Tutti i percorsi diretti di avvio backend entrano in `startServer()` senza autorità esclusiva sulla persistenza.

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

## 19. Implementazioni approvate dal Punto 5

### IMPL-022 — Evidence temporal provenance and alignment policy

**Classificazione:** `NECESSARIA`  
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE`  
**Priorità:** critica  
**Decisione:** approvata

### Problema

Evidence usa oggi timestamp con semantiche diverse senza un contratto owner unico:

```txt
timestamp del tick
timestamp interno al payload
momento di costruzione Node
momento di acquisizione Market API
momento di acquisizione Graph
anchor del source event
baseline precedente
primo tick successivo
```

L’attuale `maxTickGapSec` rappresenta l’età massima rispetto a `now`, non il gap fra SofaScore e Betfair.

Timestamp futuri vengono clampati a età zero e possono apparire come dati freschi.

### Dipendenza da IMPL-018

`IMPL-018` introduce l’envelope di acquisizione Betfair.

`IMPL-022` ne definisce l’uso nel dominio Evidence:

```txt
IMPL-018
→ produce provenance temporale

IMPL-022
→ interpreta freshness, skew, anchor e finestre
```

Non duplicare l’acquisizione nei builder Evidence.

### Contratto minimo

Per ogni source input:

```txt
source
acquiredAt
recordedAt
sourceTimestamp opzionale
pipelineDelaySec
futureSkewSec
freshnessAgeSec
validTimestamp
```

Per confronti cross-source:

```txt
sofaAcquiredAt
betfairAcquiredAt
sourceSkewSec
sourceOrder
alignmentQuality
alignmentReasons
```

Per ogni finestra:

```txt
anchorAt
baselineAt
baselineGapSec
firstPostSourceAt
firstPostSourceGapSec
windowStartAt
windowEndAt
windowState
provisional
```

### Regole timestamp

```txt
acquiredAt valido
→ governa freshness e source skew

recordedAt
→ governa audit della pipeline
→ non sostituisce acquiredAt

sourceTimestamp
→ informativo finché la semantica della fonte non è verificata
```

Timestamp futuro oltre una tolleranza versionata:

```txt
futureSkewSec > threshold
→ timestamp_degraded
→ freshness non “zero”
→ quality poor/degraded
```

### Regole alignment

```txt
good
→ entrambe le fonti presenti
→ timestamp validi
→ freshness entro soglia
→ sourceSkewSec entro soglia good

medium
→ entrambe presenti
→ freshness o skew entro soglia degraded

poor
→ fonte assente
→ timestamp invalido/futuro
→ skew oltre soglia
```

Una sola fonte non produce un allineamento cross-source `medium`.

### Compatibilità

Durante la migrazione:

```txt
maxTickGapSec legacy
→ mantenibile temporaneamente come alias deprecato
→ semantica documentata come maxSourceAgeSec
```

Nuovi consumer devono usare i campi espliciti.

### Versioning

Le soglie devono appartenere a una configurazione versionata:

```txt
alignmentPolicyVersion
freshnessThresholds
sourceSkewThresholds
futureSkewToleranceSec
baselineGapThresholdSec
```

Nessuna soglia nascosta o duplicata fra moduli.

### Osservabilità

Lo snapshot deve poter spiegare:

```txt
perché una fonte è stale
perché un confronto è skewed
perché una baseline è troppo lontana
perché una finestra è ancora provisional
```

Le reason devono essere bounded e stabili.

### Test minimi

```txt
TEST-039
TEST-043
```

Inoltre:

- timestamp invalido;
- timestamp futuro entro/fuori tolleranza;
- fonte assente;
- source skew esatto;
- recordedAt successivo ad acquiredAt;
- baseline gap esatto;
- nessuna mutazione degli input.

---

### IMPL-023 — Market Reaction eligibility e branch state

**Classificazione:** `NECESSARIA`  
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE`  
**Priorità:** critica  
**Decisione:** approvata

### Problema

Market Reactions riceve oggi tick scoped per Source Identity e persistence, ma non possiede una classificazione uniforme della loro eligibility tecnica.

Un tick può essere:

```txt
canonico ma stale
status-only
Graph degradato
ladder non affidabile
volume invalidato
acquisition skewed
runner identity incompleta
```

senza che questa condizione impedisca sempre la creazione di Significant Flow o source event.

I rami usano inoltre `available` con significati differenti.

### Eligibility del tick

Contratto minimo:

```txt
{
  eligible: boolean,
  status:
    eligible |
    degraded |
    status_only |
    stale |
    identity_unavailable |
    persistence_unavailable |
    graph_unavailable |
    ladder_unavailable |
    volume_invalid |
    acquisition_skew |
    runner_identity_unavailable,
  reasons: string[],
  policyVersion: string
}
```

### Regola `status-only`

```txt
statusOnlyGraphLogin:true
→ resta nella timeline
→ contribuisce a health e diagnostica
→ non contribuisce a baseline algoritmica
→ non genera flow
→ non genera cluster
→ non diventa source event
→ non chiude/apre una Market Reaction
```

### Stato uniforme dei rami

Ogni ramo espone:

```txt
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
dataQuality
reasons
```

`available` legacy può essere mantenuto temporaneamente come derivato, ma deve avere una semantica unica e documentata.

### Field → Market

Separare:

```txt
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation
```

Il solo aumento di `market.totalMatched`:

```txt
marketActivityObserved:true
qualifiedMarketObservation:false
```

Non usare la label “response” come sinonimo di attività generica.

### Market → Field

Separare:

```txt
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource
```

Un marker persistente già presente nella baseline non è un nuovo evento.

### Coverage

Integrare i conteggi prodotti da `IMPL-024`:

```txt
bookCoverage
ladderCoverage
flowCoverage
```

Le osservazioni che richiedono entrambi i runner accettano `complete`; `partial` degrada il ramo.

### Significant Flow

Separare:

```txt
runnerRelativeMultiplier
marketRelativeMultiplier
```

La baseline runner-specific usa soltanto lo stesso `selectionId`.

Ogni flow espone:

```txt
algorithmVersion
thresholdVersion
inputTickIds
tickEligibility
baselineType
baselineSampleCount
```

### Cluster

Contratto minimo:

```txt
selectionId obbligatorio
maxClusterGapSec
clusterStartAt
clusterEndAt
inputTickIds univoci
no status-only
no degraded input non ammesso
no doppio conteggio
```

Una policy deterministica decide l’assegnazione dei tick ai cluster non sovrapposti.

### Soglie

Le soglie correnti possono restare soltanto come:

```txt
heuristic
provisional
not_calibrated
not_signal
```

Devono avere:

```txt
thresholdVersion
absoluteThresholds
relativeThresholds
calibrationStatus
```

La calibrazione avviene dopo fixture e baseline del Punto 7.

### Finestre

Ogni finestra espone:

```txt
windowState:
  open |
  closed |
  insufficient_data |
  stale_source

provisional
finalForWindow
```

Market → Field e Field → Market devono usare lo stesso contratto.

### Confini

Questa struttura non:

- crea segnali;
- produce raccomandazioni;
- attribuisce intenzione ai trader;
- dichiara causalità;
- modifica timeline;
- avvia recovery;
- cambia Source Identity Gate.

Restano obbligatori:

```txt
causalityClaimed:false
interpretation:temporal_proximity_only
```

### Test minimi

```txt
TEST-031
TEST-032
TEST-034
TEST-035
TEST-038
TEST-040
TEST-041
TEST-042
TEST-043
```

---

### IMPL-024 — Runner temporal identity e price comparability

**Classificazione:** `NECESSARIA`  
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE`  
**Priorità:** alta  
**Decisione:** approvata

### Problema

Più moduli confrontano runner fra tick Betfair usando:

```txt
selectionId quando presente
→ fallback sul nome quando assente
```

Il nome non è un’identità temporale Exchange sufficientemente forte.

I confronti prezzo possono inoltre mescolare:

```txt
LTP
mid book
best back
best lay
```

senza sempre conservare o valutare la source.

### Identità temporale runner

Regola globale approvata:

```txt
stesso runner fra tick Betfair
→ stesso selectionId valido e stabile
```

Nessun fallback sul nome nei confronti temporali.

Il nome resta metadato presentazionale.

### Contratto confronto

```txt
{
  selectionId,
  baselineRunnerFound,
  latestRunnerFound,
  baselinePrice,
  baselinePriceSource,
  latestPrice,
  latestPriceSource,
  priceSourcesComparable,
  baselineAt,
  latestAt,
  baselineGapSec,
  firstPostSourceGapSec,
  comparisonStatus,
  reasons
}
```

`comparisonStatus`:

```txt
comparable
degraded_source_change
baseline_too_old
runner_identity_unavailable
price_unavailable
invalid_timestamp
```

### Price source policy

```txt
stessa source valida
→ comparable

source diversa ammessa
→ degraded_source_change
→ nessuna promozione automatica a osservazione qualificata

source non ammessa
→ price_unavailable
```

La policy deve essere versionata e condivisa tra:

- Field → Market;
- temporal alignment;
- runner flow evidence;
- future replay/backtesting.

### Baseline policy

La baseline deve soddisfare:

```txt
baselineAt <= anchorAt
baselineGapSec <= threshold
selectionId identico
price source policy valida
```

Altrimenti il confronto è degraded/unavailable con reason esplicita.

### Coverage runner

Calcolare:

```txt
expectedRunnerCount
identifiedRunnerCount
comparableRunnerCount
tradableRunnerCount
reliableLadderRunnerCount
reliableFlowRunnerCount
```

e derivare:

```txt
bookCoverage
ladderCoverage
flowCoverage
priceComparisonCoverage
```

### Compatibilità

La modifica degrada soltanto il ramo che richiede il confronto runner.

Non deve:

- bloccare Start;
- riportare Source Identity a pending;
- fermare scraper o tracker;
- nascondere quote disponibili;
- cambiare il mapping Source Identity;
- rimuovere le altre Evidence.

### Test minimi

```txt
TEST-033
TEST-036
TEST-037
TEST-038
```

Aggiungere anche:

- selectionId cambia tra baseline e latest;
- due runner con stesso nome ma ID diversi;
- source prezzo identica;
- source prezzo cambiata;
- baseline esattamente sulla soglia;
- baseline oltre soglia;
- coverage complete/partial/none.

---

## 19.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-012 — Fixture e replay

Aggiungere fixture versionate per:

- status-only dopo flow reale;
- marker persistente prima/dopo source;
- timestamp futuro;
- source skew elevato;
- LTP→mid;
- runner senza selectionId;
- coverage parziale;
- cluster separati da gap temporale;
- finestre open/closed.

### Estensione di IMPL-013 — Baseline e calibrazione

Misurare:

- distribuzione source skew;
- pipeline delay;
- baseline gap reale;
- frequenza source-price changes;
- coverage runner;
- distribuzione flow per selectionId e mercato;
- durata reale dei cluster;
- falsi duplicati status-only;
- percentuale finestre incomplete.

Le soglie Significant Flow non diventano calibrate finché questa baseline non esiste.

### Estensione di IMPL-018 — Acquisition envelope

Aggiungere o garantire:

```txt
marketApiAcquiredAt
graphAcquiredAt per selectionId
recordedAt
maxGraphSkewMs
acquisitionComplete
```

`IMPL-022` consuma questi campi; non deve ricostruirli dal timestamp di persistenza.

## 19.2 Ordine approvato

```txt
IMPL-018
→ IMPL-022
→ IMPL-024
→ IMPL-023
→ TEST-031…043
→ IMPL-012
→ IMPL-013
→ calibrazione threshold
```



---

## 20. Implementazioni approvate dal Punto 6

### IMPL-025 — Frontend live-session controller

**Classificazione:** `NECESSARIA`  
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA`  
**Priorità:** critica  
**Dipendenze:** `IMPL-006`, contratti Start/Stop backend, Source Identity Gate

### Problema

Il frontend distribuisce l’autorità della sessione fra booleani e stati indipendenti:

```txt
confirmedUrl
sessionShellVisible
trackingStopped
dashboardContentReady
polling flags
activeView
stop status
Source Identity phase
```

Questi valori possono produrre combinazioni incompatibili.

### Responsabilità

Creare un owner unico della sessione frontend.

Stati minimi:

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

Dati minimi:

```txt
trackingSessionId
startCommandId
stopCommandId
confirmCommandId
eventId
requestedConfig
acceptedConfig
currentSnapshot
lastVerifiedSnapshot
snapshotMode
startError
stopResult
```

`snapshotMode` usa almeno:

```txt
none
live
frozen
degraded
```

### Start

```txt
utente invia Start
→ crea commandId
→ state = starting
→ nessun poller live
→ attende risposta backend
```

Risposta accettata:

```txt
eventId
trackingSessionId
accepted config
→ state = collecting/live secondo gate
→ abilita poller session-scoped
```

Risposta stale:

```txt
commandId non corrente
→ nessun effetto
```

Fallimento o risposta ambigua:

```txt
invalida command
→ abort poller/request transitorie
→ clear accepted session
→ cleanup compensativo se necessario
→ preserva input del form
→ errore Start visibile
```

### Stop

```txt
state = stopping
→ invalida logicamente la sessione live
→ disabilita tutti i poller
→ invia Stop con session/command identity
```

Stop completo:

```txt
state = stopped_static
snapshotMode = frozen
ultimo snapshot verificato preservato
```

Stop parziale:

```txt
state = stop_partial
snapshotMode = degraded o frozen
summary cleanup visibile
```

### EventId

Dopo Start, l’eventId canonico del frontend è quello restituito dal backend.

Il parser URL resta utile soltanto per:

- preflight;
- presentazione dell’input;
- diagnostica locale;

ma non diventa authority della sessione accettata.

### Consumer

```txt
App.jsx
StartAnalysisPanel.jsx
DashboardWorkspace.jsx
Sidebar.jsx
TopBar.jsx
OverviewDashboard.jsx
Source Identity UI
poller live
Betfair health alerts
```

I componenti ricevono uno stato già derivato e non ricostruiscono `live` dalla presenza dei dati.

### Test minimi

```txt
TEST-044
TEST-045
TEST-048
TEST-049
TEST-051
TEST-056
```

### Fuori scope

- responsive completo;
- redesign visuale;
- strategie;
- recovery frontend;
- calcoli Evidence;
- modifica delle timeline canoniche.

---

### IMPL-026 — Polling runtime session-scoped

**Classificazione:** `NECESSARIA`  
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA`  
**Priorità:** critica  
**Dipendenze:** `IMPL-006`, `IMPL-025`

### Problema

I poller SofaScore e Betfair implementano lifecycle differente da Gate ed Evidence e non proteggono:

- cambio sessione;
- response tardive;
- response fuori ordine;
- cleanup durante fetch;
- StrictMode;
- disabilitazione completa dopo Stop.

### Contratto comune

Ogni poller usa una primitive condivisa con:

```txt
enabled
sessionKey
requestId monotono
AbortController
single active request
disposed flag
poll timeout
schedule-after-response
retain policy
expected HTTP classifier
```

`sessionKey` deve includere almeno:

```txt
trackingSessionId
endpoint purpose
```

### Invarianti

```txt
enabled:false
→ abort request
→ clear timeout
→ nessuna riprogrammazione

sessionKey cambia
→ vecchia response ignorata

requestId non corrente
→ nessun setState

cleanup durante fetch
→ finally non programma nuovo timeout

StrictMode remount
→ una sola catena corrente
```

### Policy per source

#### SofaScore

Abilitato quando:

```txt
sessione accettata
+ stato live/collecting/pending compatibile
```

#### Betfair

Abilitato quando:

```txt
sessione accettata
+ Betfair configurato
+ sessione live
```

#### Source Identity Gate

Abilitato quando:

```txt
sessione live
+ Betfair configurato
```

#### Evidence

Abilitato quando:

```txt
sessione live
+ activeView = market-reactions
```

All’ingresso nella vista esegue un fetch immediato.

#### Stopped static

```txt
nessun poller abilitato
```

### Retain policy

La primitive non decide autonomamente se cancellare dati.

Ogni consumer dichiara:

```txt
clear_on_new_session
retain_last_verified_on_stop
mark_degraded_on_integrity
```

### Errori previsti

La classificazione HTTP resta endpoint-specifica:

- Sofa 404 waiting;
- Sofa/Betfair 409 persistence;
- Evidence 404 neutral con reasons;
- Gate 404 status assente;
- errori tecnici separati.

La primitive gestisce lifecycle, non semantica del payload.

### Test minimi

```txt
TEST-046
TEST-047
TEST-048
TEST-057
TEST-058
```

---

### IMPL-027 — Market Reactions frontend view model

**Classificazione:** `NECESSARIA`  
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA`  
**Priorità:** alta  
**Dipendenze:** `IMPL-023`, `IMPL-024`, `IMPL-009`

### Problema

Le card leggono direttamente un payload backend evolutivo e:

- considerano disponibile qualsiasi oggetto truthy;
- usano nomi campo non corrispondenti al contratto;
- confondono unavailable e not observed;
- non distinguono provisional e final;
- non ricevono il contesto integrity completo.

### Input

```txt
Match Evidence Snapshot
marketReactionEvidence
dataQuality
integrity
sources
branch state IMPL-023
```

### Output

```txt
pageState
marketLedCard
fieldLedCard
availability
sourceEventAvailability
observationDetected
provisional
windowState
quality
reasons
causalityLabel
```

### Mapping source event Market → Field

Consumare esplicitamente:

```txt
runner
selectionId
observedFlowAmount
absoluteFlowTier
interpretation
timestamp
```

### Mapping Field → Market

Consumare esplicitamente:

```txt
sourceFieldEvent
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation
price source comparability
coverage
```

### Stati UI distinti

```txt
unavailable
available_not_observed
observed_provisional
observed_final
degraded
stale
integrity_blocked
```

`available:false` non viene promosso in base alla presenza dell’oggetto.

Una finestra unavailable o aperta non usa la label `not observed` come se fosse una conclusione finale.

### Causalità

Il view model deve preservare:

```txt
causalityClaimed:false
interpretation: temporal_proximity_only
```

Non deve produrre:

- segnale;
- previsione;
- raccomandazione;
- causa certa;
- intenzione del mercato.

### Test minimi

```txt
TEST-054
TEST-055
```

---

## 20.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-006 — Session authority end-to-end

Aggiungere il contratto frontend definitivo:

```txt
Start response
→ eventId + trackingSessionId
→ unica identità accettata

Stop/Confirm
→ commandId + trackingSessionId

response stale
→ nessun effetto
```

Lo stato richiesto e lo stato accettato restano distinti.

### Estensione di IMPL-009 — Persistence integrity frontend

Input:

```txt
Sofa integrity
Betfair integrity
Evidence integrity
recovery control plane
session state
```

Output:

```txt
status globale
status locale per source/card
affectedSources
affectedDocuments
reason pubblica bounded
isBlockingCrossSource
snapshotMode
```

Consumer:

```txt
TopBar o stato globale
sidebar indicator
persistence modal
BetfairDepthCard
Overview/Match status
MarketReactionsPage
```

La UI non mostra:

- path;
- payload journal;
- commit internals;
- stack;
- target filesystem.

### Estensione Source Identity status pubblico

Aggiungere campi opachi:

```txt
trackingSessionId
sourceIdentityContextId
sourceIdentityRevision
```

Servono a legare modale e conferma al contesto reale senza esporre dettagli sensibili.

### Estensione Preflight

Ogni check conserva:

```txt
inputFingerprint
requestId
checkedAt
status
```

Cambio input:

```txt
risultato precedente → stale/idle
```

Response vecchia:

```txt
fingerprint/requestId non correnti
→ ignorata
```

### Cleanup già approvato

Rimuovere in task separata:

```txt
LayTheWinner
BancaServizio
Superbreak
menu Strategy
route/client esclusivi
SourceIdentityControls legacy
confirm/revoke legacy in useMarketReactionEvidence
```

Prima della rimozione inventariare i consumer condivisi e preservare integralmente Market Reactions.

### Correzioni separate

```txt
FRONTEND-004
→ mojibake e copy

FRONTEND-012
→ responsive completo
```

Non unirle alla task session/polling.

## 20.2 Ordine approvato

```txt
IMPL-006
→ contratto backend/session authority

IMPL-025
→ frontend live-session controller

IMPL-026
→ polling runtime session-scoped

IMPL-009
→ persistence integrity UI

IMPL-027
→ Market Reactions frontend view model

TEST-044…058
→ cleanup Strategy e Source Identity legacy
→ FRONTEND-004 piccole correzioni
→ FRONTEND-012 responsive + TEST-059
→ Punto 7 test e strutture mancanti
```
