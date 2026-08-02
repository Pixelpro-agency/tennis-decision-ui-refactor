
# Tennis Decision UI — Ricontrollo delle task considerate completate

> Ogni task è stata ricontrollata sul repository corrente distinguendo implementazione, test automatici presenti, collaudi live documentati, limiti e discrepanze emerse durante l’audit B1–B6.

## 1. Baseline del ricontrollo

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
SHA verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Audit usato come base: B1–B6 completato in lettura
Test: file presenti letti, suite non rieseguite durante questo blocco
```

Il ricontrollo non modifica codice, test o documentazione canonica.

Per ogni task è stato applicato il flusso:

```txt
contratto dichiarato
→ file effettivi
→ test automatici presenti
→ eventuale collaudo live
→ documentazione owner
→ rilievi B1–B6 collegati
→ limiti ancora aperti
→ stato reale
```

## 2. Esiti consentiti

| Esito | Significato |
| --- | --- |
| `CONFERMATA` | Implementazione e prove disponibili coerenti con il contratto della task |
| `CONFERMATA CON LIMITI` | Nucleo corretto, ma restano validazioni o hardening separati |
| `DOCUMENTAZIONE DA CORREGGERE` | Codice corretto, testo non allineato |
| `TEST DA AGGIORNARE` | Implementazione plausibile, copertura insufficiente o obsoleta |
| `DA RIAPRIRE` | Esiste una discrepanza concreta nello scope dichiarato della task |
| `NON VERIFICABILE` | Mancano codice, ambiente o evidenze sufficienti |

Non usare `DA RIAPRIRE` per una semplice proposta futura.

Quando una task è `DA RIAPRIRE`, va riaperta soltanto la parte difettosa. Non si annullano automaticamente le sezioni già corrette e verificate.

---

## 3. Esito complessivo D1–D18

| ID | Task | Esito reale |
| --- | --- | --- |
| D1 | Source Identity Task 1A | `CONFERMATA CON LIMITI` |
| D2 | Source Identity frontend Task 1B | `CONFERMATA CON LIMITI` |
| D3 | Money Flow 2A | `CONFERMATA` |
| D4 | Money Flow 2B | `CONFERMATA` |
| D5 | Money Flow 2C | `CONFERMATA` |
| D6 | Money Flow 2D | `CONFERMATA` |
| D7 | Money Flow 2E | `CONFERMATA` |
| D8 | Validazione live Betfair 2F | `CONFERMATA CON LIMITI` |
| D9 | Runtime launcher Task 2 | `CONFERMATA CON LIMITI` |
| D10 | Stop globale Task 3a | `CONFERMATA` |
| D11 | Timeline store Task 4 | `CONFERMATA` |
| D12 | Commit journal Task 6 | `CONFERMATA` |
| D13 | Recovery | `CONFERMATA CON LIMITI` |
| D14 | Persistence integrity | `DA RIAPRIRE` — solo chiusura frontend/cross-layer |
| D15 | Evidence degradation | `CONFERMATA` |
| D16 | Context locale V1 | `CONFERMATA CON LIMITI` |
| D17 | Diagnostica Betfair | `DA RIAPRIRE` — solo hardening pubblico e capture |
| D18 | Retention cache runtime | `CONFERMATA CON LIMITI` |

Conteggio:

```txt
CONFERMATA
→ 9

CONFERMATA CON LIMITI
→ 7

DA RIAPRIRE
→ 2

DOCUMENTAZIONE DA CORREGGERE come esito primario
→ 0

TEST DA AGGIORNARE come esito primario
→ 0

NON VERIFICABILE
→ 0
```

La documentazione e i test da correggere restano indicati come azioni secondarie nelle singole schede.

---

## D1 — Source Identity Task 1A

**Esito:** `CONFERMATA CON LIMITI`

### Contratto riconfermato

Il backend implementa:

```txt
collecting
→ pending
→ recording
→ mismatch
→ not-applicable
```

Il gate separa buffering e persistenza canonica.

Sono presenti:

- matching automatico;
- epoch/fingerprint del contesto;
- confirmation store atomico;
- conferma manuale gate-aware;
- bootstrap SofaScore → Betfair;
- blocco del tick causale su mismatch;
- stop dei tracker sul mismatch;
- status route dedicata.

### Prove disponibili

Sono presenti test dedicati per:

- builder Source Identity;
- gate live;
- tracker SofaScore;
- tracker Betfair;
- status route;
- confirmation store;
- Evidence effective identity.

Sono documentati collaudi live per:

```txt
collecting → recording/aligned
mismatch
mismatch → correzione link → nuovo Start → aligned
```

### Limiti

Restano aperti:

- pending reale con fonti confrontabili;
- conferma manuale reale;
- decline reale;
- bootstrap cross-source non transazionale;
- race del nuovo Start descritta da `RUNTIME-002`.

`RUNTIME-002` non dimostra che il matching o il gate Task 1A siano errati. Dimostra però che una callback della sessione precedente può arrivare dopo la sostituzione del gate e ricevere `no-gate`.

### Decisione

Non riaprire tutta la Task 1A.

Aprire una task separata per l’autorità della sessione live, collegata a:

```txt
RUNTIME-002
FRONTEND-001
FRONTEND-003
IMPL-006
```

### Criterio per rimuovere i limiti

```txt
pending reale verificato
→ confirm e decline osservati

nuovo Start
→ nessuna callback precedente autorizzata a persistere
```

---

## D2 — Source Identity frontend Task 1B

**Esito:** `CONFERMATA CON LIMITI`

### Contratto riconfermato

Il frontend globale gestisce:

- shell immediata;
- semaforo Source Identity;
- waiting screen;
- modale pending;
- toast aligned e mismatch;
- ritorno al form su mismatch;
- preservazione dei campi;
- polling gate protetto da session ID, request ID e `AbortController`.

Il gate live backend resta l’autorità. Non esiste più una simulazione client-side del pending.

### Prove disponibili

Sono documentati collaudi live per:

```txt
collecting → aligned
mismatch
mismatch → nuovo Start corretto → aligned
```

### Limiti

Non sono ancora verificati live:

- pending reale;
- conferma manuale reale;
- decline reale;
- errore bootstrap dopo conferma;
- toast verde su tutti i percorsi pending reali.

Sono inoltre presenti candidati legacy:

```txt
useMarketReactionEvidence.confirmSourceIdentity
useMarketReactionEvidence.revokeSourceIdentityConfirmation
SourceIdentityControls.jsx
```

collegati a `CLEANUP-001`.

### Decisione

La Task 1B non viene riaperta come intero blocco.

Il cleanup dell’autorità legacy e le prove pending restano separati.

---

## D3 — Money Flow 2A

**Esito:** `CONFERMATA`

### Contratto riconfermato

Un campione tecnico non utilizzabile:

```txt
non equivale a finished
→ non ferma il tracking
→ non entra nel gate
→ non aggiorna la persistenza canonica
→ non aggiorna il baseline
```

Lo stop Betfair è legato a `hasFinished` esplicito o allo stop richiesto, non a un errore tecnico ordinario.

### Prove disponibili

Sono presenti test su:

- classificazione tecnica;
- trackerUpdate Betfair;
- processor;
- lifecycle scraper;
- runtime error state.

### Nota documentale

`DOC-014` corregge soltanto l’ordine dichiarato fra calcolo puro della tracking key e classificazione tecnica. Non dimostra un errore operativo della Task 2A.

---

## D4 — Money Flow 2B

**Esito:** `CONFERMATA`

### Contratto riconfermato

Il runtime Betfair distingue:

```txt
ultimo tentativo
ultimo successo
ultimo errore tecnico
reason tecnica
```

La health usa:

- freshness del tick canonico;
- ladder utilizzabile;
- errori runtime;
- Graph auth strutturata;
- stato finished separato.

Un errore tecnico non viene trasformato automaticamente in mercato concluso o alert login.

### Prove disponibili

Sono presenti test su:

- health;
- freshness;
- `404` ordinario;
- errore runtime;
- auth strutturata;
- latest payload;
- runtime snapshot.

### Limiti non bloccanti

Alcuni scenari reali restano parte dell’hardening operativo della validazione 2F, non una riapertura della 2B.

---

## D5 — Money Flow 2C

**Esito:** `CONFERMATA`

### Contratto riconfermato

Sono confermati:

- `selectionId` come identità primaria;
- `seq` finite;
- deduplicazione;
- blocco delle regressioni ordinarie;
- `commitId` Betfair generato una volta;
- separazione fra `matchedTotal` runner e totale mercato;
- baseline aggiornato soltanto dopo commit strutturato riuscito;
- cleanup dei dati legacy non finiti.

### Prove disponibili

Sono presenti test per:

- processor;
- canonical timeline;
- latest payload;
- history series;
- dedupe;
- regressioni;
- repair state;
- sequenze non finite.

### Gap separato

`TEST-001` riguarda l’eccezione completa Graph logout `status-only`, non il nucleo ordinario della Task 2C.

---

## D6 — Money Flow 2D

**Esito:** `CONFERMATA`

### Contratto riconfermato

Le Graph URL supportate sono dirette:

```txt
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

Sono confermati:

- protocollo HTTPS;
- host specifico;
- view `0`;
- parser di query, fragment e slash finale;
- rifiuto `runnerChartData`;
- coerenza `marketId`;
- mapping diretto `selectionId`;
- rifiuto di runner assente;
- duplicati;
- nessun fallback per nome;
- skip controllato delle URL successive.

### Prove disponibili

La suite Python dedicata contiene test unitari mirati al parser e al mapping.

### Nota

Gli scenari browser reali con URL malformate o login iniziale scaduto appartengono alla validazione 2F e all’hardening operativo, non riaprono la Task 2D.

---

## D7 — Money Flow 2E

**Esito:** `CONFERMATA`

### Contratto riconfermato

Il frontend mostra:

```txt
Volume abbinato nel tempo
```

come misura non direzionale.

Sono confermati:

- niente interpretazione raw Back/Lay come flusso direzionale;
- serie associate tramite `selectionId`;
- griglia comune a 20 slot;
- punti invalidi non rappresentati come volume valido;
- anomalie esposte tramite flag;
- scala tecnica minima;
- nessuna trasformazione in segnale operativo.

### Prove disponibili

Sono presenti test su:

- mapping history;
- serie Money Flow;
- `selectionId`;
- punti invalidi;
- latest response;
- build frontend.

Nessuna discrepanza B1–B6 richiede la riapertura della Task 2E.

---

## D8 — Validazione live Betfair 2F

**Esito:** `CONFERMATA CON LIMITI`

### Evidenze live registrate

Sono documentate tre sessioni:

```txt
A — Graph URL disponibili
B — senza Graph URL
C — logout Graph e recovery
```

Sono stati osservati:

- Source Identity aligned;
- health verde con Graph URL;
- health stale senza Graph URL;
- ladder `graph_url` e `book_depth`;
- `matchedVolume` positivo;
- anomaly protettiva;
- logout Graph;
- tick `status-only`;
- alert visivo e audio;
- recovery dopo login.

### Limiti dichiarati dal report

- sessioni A e B sullo stesso `eventId`;
- seq e scala non completamente isolate;
- nessun payload `/latest` post-fix archiviato;
- nessun test automatico PASS dedicato al tick `status-only`;
- non validati: login iniziale scaduto, URL malformate reali, errore rete/API reale, mercato realmente finished.

### Azioni residue

```txt
TEST-001
→ test automatico status-only

IMPL-004
→ archivio collaudi con SHA e artefatti
```

La validazione resta confermata, ma non deve essere presentata come copertura completa di tutti gli scenari Betfair.

---

## D9 — Runtime launcher Task 2

**Esito:** `CONFERMATA CON LIMITI`

### Contratto riconfermato

Sono confermati:

- lock prima del riuso;
- manifest project-owned;
- distinzione `owned`, `reused`, `external`;
- porte preferite e alternative;
- identità del servizio prima del riuso;
- discovery CDP bounded;
- Chrome/CDP fuori dall’ownership;
- registry backend-wide dei figli Python;
- scope `tracking`, `login`, `all`;
- shutdown bounded;
- terminazione dei soli processi owned;
- proxy Vite configurato sulla porta backend effettiva.

### Regola

Resta valida `RUNTIME-001`:

```txt
non riaprire la task senza una discrepanza concreta
```

### Limiti

Restano scenari live non osservati o non archiviati completamente:

- backend/frontend esterni sulle porte preferite;
- porte alternative reali;
- CDP alternativo reale;
- force-kill reale;
- conflitto login runtime reale;
- continuità login-only nella stessa sequenza Stop.

`CLEANUP-002` riguarda la utility retention, non il launcher.

### Decisione

Non riaprire il runtime launcher.

Le validazioni residue restano un runbook/archivio separato.

---

## D10 — Stop globale Task 3a

**Esito:** `CONFERMATA`

### Contratto riconfermato

Lo Stop globale:

- è idempotente;
- ferma il tracking SofaScore;
- ferma il tracking Betfair;
- invalida la generation tracking;
- termina i processi Python nello scope tracking;
- preserva il login-only quando lo scope richiesto è tracking;
- non chiude Chrome/CDP esterno;
- non cancella timeline, history o journal.

Il backend esegue cleanup anche su `SIGINT` e `SIGTERM`.

### Prove disponibili

Sono presenti test route/runtime e un collaudo live documentato.

`RUNTIME-002` riguarda un nuovo Start senza invalidazione della sessione precedente; non contraddice il percorso Stop globale.

---

## D11 — Timeline store Task 4

**Esito:** `CONFERMATA`

### Contratto riconfermato

La persistenza timeline è centralizzata.

`writeTimelineDocument(...)` esegue:

```txt
documento completo in memoria
→ file temporaneo nella stessa directory
→ rename sul file canonico
```

Sono preservati:

- schema JSON;
- naming;
- metadata;
- dedupe;
- sequence;
- history;
- contratti HTTP e frontend.

### Prove disponibili

Sono presenti test per:

- timeline store;
- update SofaScore;
- processor/update Betfair;
- lifecycle scraper.

È documentata una verifica live di continuità dopo Stop e nuovo Start senza `.tmp` residui.

### Nota documentale

`DOC-016` richiede di descrivere con precisione le directory inizializzate all’import e le facade prepare-only. Non riapre la Task 4.

---

## D12 — Commit journal Task 6

**Esito:** `CONFERMATA`

### Contratto riconfermato

Sono confermati:

- `commitId` source-UUID;
- record pending prima dei writer;
- marker history/timeline;
- target journalizzati;
- blocco su writer non-ok;
- blocco su commitId/target incoerenti;
- cleanup solo dopo target completati e verificati;
- `repairOnly` Betfair;
- nessun nuovo tick durante repair;
- payload sensibili rifiutati;
- directory globale `.pending_commits`.

### Prove disponibili

Sono presenti test specifici per:

- commit ID;
- journal store;
- validazione record;
- target verification;
- processor SofaScore;
- processor Betfair;
- integration persistence.

### Nota documentale

`DOC-020` corregge il percorso nei documenti. Il codice usa già `.pending_commits`.

---

## D13 — Recovery

**Esito:** `CONFERMATA CON LIMITI`

### Contratto riconfermato

Il server esegue la recovery prima di `app.listen`.

Sono confermati:

- scanner dei journal;
- retry/repair;
- target verification;
- riapertura dei marker completed con target assente o illeggibile;
- `markDocumentIncomplete`;
- gestione `recovery_failed`;
- errori per-file non fatali;
- fatalità globale che blocca il listener;
- nessun avvio tracking o scraper durante il bootstrap.

### Prove disponibili

Sono presenti test unitari e integration test.

### Limiti

Manca una procedura o utility dedicata per produrre in modo controllato e ripetibile:

```txt
partial persistence
recovery riuscita
recovery_failed
target completed mancante
```

senza toccare i dati reali.

La documentazione descrive gli scenari, ma non esiste un harness operativo unico.

### Struttura assente collegata

```txt
IMPL-008 — harness offline di fault injection persistence/recovery
```

### Decisione

La recovery non viene riaperta.

Il limite riguarda validazione controllata e riproducibilità operativa.

---

## D14 — Persistence integrity

**Esito:** `DA RIAPRIRE`

**Perimetro da riaprire:** soltanto integrazione frontend/cross-layer.

### Parti confermate

Backend e API implementano:

```txt
no_known_partial
partial_persistence
recovery_failed
```

Sono confermati:

- risposta `409 persistence_integrity`;
- source SofaScore/Betfair normalizzata;
- `affectedDocuments`;
- reason pubblica sicura nel contratto integrity;
- route read-only senza recovery;
- Evidence `persistenceComplete:false`;
- no-trade reason;
- blocco delle Market Reactions cross-source.

### Discrepanza concreta

Il frontend raccoglie parte dell’integrity negli hook, ma:

```txt
App.jsx
→ scarta integrity SofaScore

App.jsx
→ scarta integrity Betfair

useDashboardViewModel
→ non riceve integrity

BetfairDepthCard
→ non riceve persistence state

useMarketReactionEvidence
→ conserva solo marketReactionEvidence
→ non lo snapshot Evidence completo
```

La documentazione e il Current State dichiarano invece una pipeline UI completa.

### Perché è `DA RIAPRIRE`

La task cross-layer non può essere considerata conclusa quando:

- il backend espone lo stato;
- gli hook lo leggono;
- la composizione applicativa lo perde;
- i componenti non possono mostrarlo separatamente da health e Source Identity.

La sicurezza algoritmica backend resta presente, ma la chiusura UI dichiarata non esiste.

### Struttura assente collegata

```txt
IMPL-009 — adapter/stato frontend unico per persistence integrity
```

### Criterio di chiusura

```txt
hook
→ App
→ view model
→ componenti

partial_persistence/recovery_failed
→ visibili
→ separati da health e identity
→ nessuna recovery frontend
```

---

## D15 — Evidence degradation

**Esito:** `CONFERMATA`

### Contratto riconfermato

Quando una fonte canonica ha persistenza incompleta nota:

```txt
Evidence
→ persistenceComplete:false
→ noTradeReasons
→ Market Reactions non utilizzabili
→ causalityClaimed:false
```

Sono confermati:

- integrity SofaScore e Betfair nello snapshot;
- source scope;
- epoch Betfair;
- Source Identity effective;
- reason standard;
- nessuna promozione cross-source;
- nessuna recovery eseguita da Evidence.

### Prove disponibili

Sono presenti test unitari e integration test per:

- partial SofaScore;
- partial Betfair;
- mismatch;
- pending;
- no causalità.

### Distinzione da D14

D15 riguarda la degradazione algoritmica e descrittiva nello snapshot.

D14 riguarda la propagazione e presentazione cross-layer dell’integrity.

Per questo D15 resta confermata anche se D14 va riaperta nel frontend.

---

## D16 — Context locale V1

**Esito:** `CONFERMATA CON LIMITI`

### Contratto riconfermato

Sono confermati:

- `pointsTotal` da `statistics.ALL.pointsTotal`;
- token point-by-point supportati `0`, `15`, `30`, `40`, `A`;
- esclusione dell’ultimo game potenzialmente aperto;
- esatti tre game precedenti;
- nessun fallback a game più vecchi;
- `available` e `dataQuality` espliciti;
- comparison descrittiva;
- nessun trend, previsione o segnale.

Frontend e backend mantengono ruoli separati: il backend calcola, il frontend valida e presenta.

### Limiti

`SOFA-001` resta aperto:

```txt
il codice esclude sempre l’ultimo game
→ deve essere verificato che il payload reale contenga sempre il game corrente aperto
```

Mancano inoltre collaudi archiviati per:

- caso reale disponibile;
- caso reale indisponibile;
- passaggio immediatamente dopo la chiusura di un game;
- tie-break.

### Decisione

Non riaprire il Context locale V1.

Eseguire una validazione live mirata prima di dichiararlo completamente verificato.

---

## D17 — Diagnostica Betfair

**Esito:** `DA RIAPRIRE`

**Perimetro da riaprire:** hardening pubblico, cache key e completion della network capture.

### Parti confermate

Sono corretti:

- `BETFAIR_APP_KEY` da ambiente o `.env`;
- assenza di valore letterale nel codice Python;
- redazione dei contenuti diagnostici;
- output Python JSON;
- log bounded;
- cache allow-list;
- network capture disabilitata nel tracking ordinario;
- test configurazione/redazione/cache.

### Discrepanze concrete

`SECURITY-001`:

```txt
network_capture.dump_dir
→ può raggiungere /api/betfair/odds
→ path locale pubblico
```

`SECURITY-002`:

```txt
filename cache
→ derivato dalla URL normalizzata
→ query non deny-listed possono comparire nel nome
```

`SECURITY-003`:

```txt
route HTTP
→ restituiscono error.message o dettagli raw
```

`PYTHON-001`:

```txt
asyncio.create_task
→ task non tracciate
→ summary possibile prima della completion
```

### Perché è `DA RIAPRIRE`

Questi problemi ricadono direttamente nel contratto di hardening e redazione diagnostica dichiarato dalla task.

Non sono soltanto validazioni live mancanti.

### Struttura assente collegata

```txt
IMPL-007 — serializer pubblico allow-list per diagnostica ed errori
```

### Criterio di chiusura

- nessun path locale nelle risposte;
- nessun valore sensibile nel filename cache;
- error code pubblico stabile;
- dettagli completi solo nel log interno redatto;
- task capture attese in modo bounded;
- test pubblici e Python aggiornati.

---

## D18 — Retention cache runtime

**Esito:** `CONFERMATA CON LIMITI`

### Contratto riconfermato

La utility:

- è standalone;
- usa allow-list fissa;
- opera soltanto su `backend/betfair_cache` e `backend/scraper_cache`;
- non legge il contenuto;
- non ricorre in sottocartelle;
- accetta soltanto file JSON regolari;
- esclude symlink, directory e file non JSON;
- usa dry-run di default;
- richiede `--apply --offline-confirmed`;
- restituisce un report JSON strutturato;
- non viene eseguita automaticamente dal launcher.

### Prove disponibili

Sono presenti test su:

- policy age/count/bytes;
- dry-run;
- apply senza conferma;
- lock;
- porte 3000/3001;
- symlink;
- directory;
- file non JSON;
- errori di unlink;
- fail-closed sui probe.

### Limiti

`CLEANUP-002`:

```txt
offline check
→ lock
→ porte 3000 e 3001

ma il launcher può usare porte alternative
```

Inoltre il recheck prima di `unlink` non confronta mtime, dimensione o identità rispetto allo scan iniziale.

Il percorso reale `--apply --offline-confirmed` non è ancora validato su cache reali.

### Decisione

La utility core resta confermata.

Aprire un hardening separato prima di usare l’apply come procedura operativa ordinaria.

---

## 4. Task da riaprire

Soltanto due task ricevono lo stato primario `DA RIAPRIRE`.

### D14 — Persistence integrity

```txt
riaprire:
→ propagazione frontend
→ stato persistence unico
→ rendering separato
→ test lifecycle e componenti

non riaprire:
→ journal
→ recovery
→ integrity backend
→ Evidence degradation
```

### D17 — Diagnostica Betfair

```txt
riaprire:
→ serializer pubblico
→ cache key
→ error responses
→ completion network capture

non riaprire:
→ configurazione BETFAIR_APP_KEY
→ redazione contenuti già corretta
→ tracking ordinario con capture disabilitata
```

---

## 5. Strutture e procedure completamente assenti emerse dal ricontrollo

Il ricontrollo ha confermato quattro strutture non presenti come componente unico o procedura ripetibile.

Non sono task approvate. Sono registrate in `06-implementazioni-proposte.md`.

```txt
IMPL-006
→ autorità/token della sessione live condiviso dal lifecycle

IMPL-007
→ boundary serializer pubblico per diagnostica ed errori

IMPL-008
→ harness offline controllato per partial/recovery/recovery_failed

IMPL-009
→ adapter frontend unico per persistence integrity
```

Queste voci devono essere analizzate dopo il ricontrollo, insieme al raggruppamento delle task.

---

## 6. Ordine tecnico risultante

Ordine consigliato, ancora da trasformare in task esecutive:

```txt
1. isolamento sessione live
   RUNTIME-002
   FRONTEND-001
   FRONTEND-003
   TEST-002
   IMPL-006

2. hardening diagnostica pubblica
   SECURITY-001
   SECURITY-002
   SECURITY-003
   PYTHON-001
   IMPL-007

3. chiusura persistence integrity frontend
   FRONTEND-002
   DOC-018
   DOC-022
   IMPL-009

4. harness persistence/recovery
   IMPL-008
   D13
   D14

5. correzioni circoscritte
   CODE-002
   CODE-004
   FRONTEND-004
   CODE-005
   TEST-001

6. decisioni utente
   CODE-001
   CODE-003
   EVIDENCE-001
   CLEANUP-001
```

Questo ordine non autorizza ancora modifiche.

Prima delle task esecutive vanno risolte soltanto le decisioni che cambiano il perimetro.

---

## 7. Esito del blocco D

```txt
D1–D18
→ ricontrollate

task confermate
→ 9

task confermate con limiti
→ 7

task da riaprire in modo circoscritto
→ 2

nuove strutture/procedure assenti
→ 4

codice o docs modificati
→ nessuno

suite test eseguite
→ nessuna
```
