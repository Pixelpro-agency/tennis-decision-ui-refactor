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
