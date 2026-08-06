> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-001…015
> **Righe originali:** 1–1128
> **Parte precedente:** [indice](../06-implementazioni-proposte.md)
> **Parte successiva:** [Runtime e acquisizione Betfair](02-runtime-betfair.md)

<!-- BEGIN ORIGINAL CONTENT -->
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
**Stato:** `IMPLEMENTATA E VERIFICATA`

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
**Stato:** `IMPLEMENTATA E COMPLETATA TRAMITE DEC-013`

La separazione fra documenti owner e collaudi storici è implementata nella struttura corrente:

```txt
docs/validations/
├── README.md
└── report di validazione datati
```

`DEC-013` stabilisce che i collaudi approfonditi restino separati dai documenti owner e confluiscano in `docs/validations/`.

La proposta storica:

```txt
docs/tennis-decision-ui/archive/validations/
```

è superata e non deve essere ricreata.

Ogni nuova validazione deve indicare data, SHA o baseline, ambiente, scopo, azioni o comandi, risultati osservati, scenari non osservati, artefatti disponibili e limiti.

Il rischio di creare un secondo sistema documentale viene evitato mantenendo un solo indice in `docs/validations/README.md`.

### IMPL-005 — Controllo di coerenza Todo ↔ registri

**Classificazione:** `NECESSARIA`
**Stato:** `IMPLEMENTATA E VERIFICATA`

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
5. IMPL-004 — archivio collaudi completato in `docs/validations/`
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
9. IMPL-004 — archivio collaudi già completato in `docs/validations/`
```

L’ordine definitivo dipende dal raggruppamento delle task e dalle decisioni dell’utente.

---

## 15. Implementazioni emerse dalle decisioni finali

### Estensione approvata di IMPL-009 — Persistence locale e pannello globale

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

### Requisiti futuri consolidati dalle fonti rimosse

Strategy Lab resta un'estensione offline di `IMPL-010` e dipende da
`IMPL-012`. Input ammessi: timeline canoniche persistite, metadata e qualità,
Source Identity storicamente applicabile, Evidence ricostruita e configurazione
versionata. Sono vietati fetch live, browser, scraper, cache, dump, credenziali
e informazione successiva al cursore.

Output minimo futuro:

```txt
eventId
algorithmVersion
configuration
inputRange
processedTicks / skippedTicks
dataQualitySummary
sourceIdentitySummary
evidenceSnapshots
strategyResult
reasons
startedAt / completedAt
```

`valueHypothesis` ed `externalEvidence` restano disabilitati finché non esistono
baseline riproducibile, modello o contratto sorgente versionato, validazione su
dati separati, timestamp e policy stale. Fonte assente o invalida produce
`null` e reason: nessun fallback inventato, nessuna fair odds certa e nessuna
raccomandazione.

Le viste future di attività runner recente/cumulativa, rotazione, price drift,
compressione, marker Sofa v2, snapshot derivati e grafico campo/mercato restano
descrittive. Devono usare dati confrontabili, conservare volume ambiguo,
mostrare qualità/reason e mantenere `causalityClaimed:false`.

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

### Output minimo consolidato

```txt
eventId
algorithmVersion / configuration
inputRange
processedTicks / skippedTicks
dataQualitySummary
sourceIdentitySummary
evidenceSnapshots
reasons
startedAt / completedAt
```

Una conferma Source Identity corrente non valida retroattivamente tick storici
incompatibili. Il replay usa la policy applicabile a fingerprint, epoch e
intervallo, non lo stato runtime presente.

### Criterio di prontezza

- policy storica Source Identity decisa;
- tie-breaker temporale deciso;
- schema fixture definito;
- builder live riutilizzabili senza I/O;
- output reason stabile.

---

### Estensione approvata — pipeline cross-source e dataset derivati

La seconda fase del progetto utilizzerà le timeline canoniche prodotte durante il live per costruire una rappresentazione allineata di campo e mercato.

La pipeline approvata è:

```txt
timeline SofaScore canonica
+
timeline Betfair canonica
→ allineamento cross-source deterministico
→ dataset combinato versionato
├─ grafico campo/mercato
└─ dataset filtrato per replay e backtesting
```

Il grafico è un consumer del dataset combinato. Non è una fonte dati e non deve essere usato come autorità per produrre l’export destinato al backtesting.

Il dataset cross-source deve conservare almeno:

```txt
datasetId
schemaVersion
eventId
source timeline revision/digest
source tick ID e sequence
acquiredAt e recordedAt
tracking session/epoch, quando disponibili
Source Identity applicabile
selectionId Betfair
fieldStateId derivato
alignmentPolicyVersion
skew temporale
alignment status
data quality
reason
generatedAt
```

L’allineamento temporale deve essere causale:

```txt
tick Betfair
→ ultimo stato SofaScore disponibile in precedenza
→ nessuna informazione successiva al cursore
```

Stati minimi dell’allineamento:

```txt
exact
bounded_previous
stale
unmatched
```

Il dataset filtrato per backtesting deve dichiarare:

```txt
datasetVersion
featureSetVersion
transformVersion
filter configuration
input range
input digests
processed / skipped / unmatched
quality summary
reasons
```

Le timeline live restano la fonte primaria. Il dataset combinato e quello di backtesting sono artefatti derivati e non modificano i documenti canonici di origine.

La cancellazione dei file live non è autorizzata come comportamento ordinario. Una futura procedura di archiviazione o eliminazione potrà essere valutata soltanto dopo:

```txt
export deterministico completato
→ digest e provenance registrati
→ schema e trasformazione versionati
→ dataset validato
→ assenza di integrity pending o recovery failure
→ policy di retention esplicitamente approvata
```

Nella prima fase operativa è preferibile conservare o comprimere le timeline originali, perché la loro eliminazione impedisce di derivare nuove feature o verificare trasformazioni precedenti.

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
record writer authority assente
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

- launcher lock e writer authority restano distinti;
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
- backend manuale e launcher rispettano la stessa writer authority.

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

<!-- END ORIGINAL CONTENT -->
