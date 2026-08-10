# Report documentale — `docs/tennis-decision-ui/operations/03-betfair-diagnostics.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-034
Sequenza audit: 34/72
Documento analizzato: 03-betfair-diagnostics.md
Percorso documento: docs/tennis-decision-ui/operations/03-betfair-diagnostics.md
Percorso report: Report documentale/34 - 03-betfair-diagnostics.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: af1b0e949a0629a1ed2e6956a78815742050a30b
Dimensione documento: 828 righe
Ruolo dichiarato: runbook operativo per diagnosi Betfair
Stato report: completato
```

Il documento è stato confrontato con il runtime e con gli owner tecnici effettivi, in particolare:

- `backend/src/routes/betfair.js`;
- `backend/src/routes/betfair/cdpStatus.js`;
- `backend/src/routes/betfair/latestPayload.js`;
- `backend/src/routes/betfair/latestPayloadResponse.test.mjs`;
- `backend/src/routes/betfair/latestPayloadIntegrity.test.mjs`;
- `backend/src/routes/betfair/betfairJsonResponse.test.mjs`;
- `backend/src/routes/betfair/normalizeIntegrity.test.mjs`;
- `backend/src/routes/betfair/logReader.js`;
- `backend/src/routes/betfair/oddsResponse.js`;
- `backend/src/routes/betfair/oddsResponse.test.mjs`;
- `backend/src/runtime/runtimeLogger.js`;
- `backend/src/runtime/pythonProcessRegistry.js`;
- `backend/src/sofa/betfairFetch.js`;
- `backend/src/sofa/betfair/scraperLifecycle.js`;
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`;
- `backend/src/sofa/betfairHealth.js`;
- `backend/src/sofa/betfairHealth.test.mjs`;
- `backend/src/sofa/betfairHealth/statusClassification.js`;
- `backend/src/sofa/betfairHealth/statusClassification.test.mjs`;
- `backend/src/sofa/betfairHealth/tickQuality.js`;
- `backend/src/sofa/betfair/processor/persistenceDecision.js`;
- `backend/src/sofa/betfair/processor/canonicalTimeline.js`;
- `backend/src/sofa/betfair/timeline.js`;
- `backend/src/sofa/betfair/timeline/statusOnlySnapshot.js`;
- `scrapers/betfair/cli.py`;
- `scrapers/betfair/config.py`;
- `scrapers/betfair/network_capture.py`;
- `scrapers/betfair/scrape.py`;
- `scrapers/betfair/graph_url.py`;
- i report e task già censiti per API Betfair, lifecycle Betfair, technical sample, Python scraper, Graph URL, storage/recovery, frontend Betfair e live tracking.

GitHub non è stato modificato.

La mappa Markdown di continuazione e il JSON incrementale non vengono aggiornati in questo report. Il checkpoint cumulativo resta dopo il report 037.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA

Coerenza timeout / technical retry:
→ ALTA

Coerenza health/freshness:
→ MEDIA

Coerenza login/status-only:
→ MEDIO-ALTA sul detection
→ PARZIALE sul recovery/clear dell'alert

Coerenza Graph URL:
→ BUONA come runbook
→ dipende ancora dai finding GRAPH-URL già aperti

Coerenza persistence integrity:
→ PARZIALE finché JOURNAL-REC-004/005 non sono risolti

Coerenza network capture:
→ ALTA sul percorso Node normale
→ PARZIALE cross-entrypoint per la CLI Python standalone

Coerenza redazione:
→ BUONA come policy
→ restano task tecniche già aperte su envelope/capture/health reason

Nuove task proposte: 8

Riscrittura completa: NO
Revisione mirata: SÌ
Modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: CRITICA
```

Il documento ha il ruolo giusto: deve restare un **runbook operativo** per rispondere rapidamente a domande come:

```text
perché Betfair non aggiorna?
è un timeout, una freshness stale o un problema Graph?
serve davvero rifare login?
il problema è persistence integrity?
la ladder è assente o soltanto vecchia?
la network capture è realmente necessaria?
quale superficie devo leggere senza alterare lo stato?
```

Non deve diventare owner delle implementazioni di:

```text
health classifier
scraper lifecycle
Graph URL validator
capture lifecycle
recovery
timeline/history
Money Flow
Source Identity
```

Il problema principale non è quindi l'architettura generale del runbook, ma alcune equivalenze diagnostiche troppo forti rispetto al runtime reale.

---

# 1. `yellow/STALE` non significa soltanto “tick o ladder oltre 45 secondi”

## Esito: discrepanza operativa reale

Il documento presenta nella classificazione iniziale:

```text
yellow/STALE
→ tick canonico o ladder usabile oltre 45 secondi
→ senza segnale auth strutturato
```

Questa descrizione è incompleta.

La soglia temporale è corretta:

```text
45 secondi
→ ancora non stale per la sola età

> 45 secondi
→ stale per la sola età
```

Il problema è che il classifier usa `yellow` per un insieme molto più ampio di condizioni.

`classifyBetfairSessionHealth()` considera yellow quando non c'è red e almeno una delle seguenti condizioni è vera:

```text
technicalErrorActive
latest canonical tick stale
latest usable ladder stale
consecutiveNoLadderTicks >= 1
cdpStatus === false
marketOk === false
graphHealth.status === stale
graphHealth.status === temporary_error
graphHealth.status === bad_graph_url
graphHealth.status === unavailable
```

Il label viene poi scelto così:

```text
technicalErrorActive === true
→ DEGRADED

altrimenti
→ STALE
```

Quindi possono esistere casi reali:

```text
Graph URL bad
→ yellow / STALE

CDP non raggiungibile
→ yellow / STALE

market invalid/incomplete
→ yellow / STALE

un tick senza ladder usabile
→ yellow / STALE

Graph unavailable
→ yellow / STALE
```

anche con:

```text
latestBetfairAgeSec <= 45
latestUsableLadderAgeSec <= 45
```

oppure con età non determinabile.

## Perché è importante

Un runbook operativo non deve far usare il label come diagnosi causale.

La regola corretta è:

```text
status/label
→ severità sintetica

message + reasons + checks + metrics
→ diagnosi concreta
```

In particolare:

```text
STALE
≠
necessariamente “dato vecchio”
```

nel contratto corrente.

## Test correnti

La suite verifica già, tra gli altri:

```text
45s → non stale per age
46s → yellow/STALE
bad_graph_url → yellow
technical error → yellow/DEGRADED
auth_suspected → red
```

Ma non copre direttamente tutte le cause yellow con il loro label/messaggio:

```text
cdpStatus false
marketOk false
consecutiveNoLadderTicks >= 1
graph unavailable
graph temporary_error
```

## Finding `BETFAIR-DIAG-001` — rendere truthy la tassonomia health operativa

**Priorità:** high  
**Tipo:** diagnostic health semantics

### Modifica documentale

Sostituire la semplificazione:

```text
yellow/STALE
→ dato vecchio
```

con:

```text
yellow
→ stato warning non-auth

DEGRADED
→ technical error attivo

STALE
→ label residuale corrente per più condizioni non-auth
→ verificare sempre message/reasons/checks/metrics
```

### Target tecnico eventuale

Se si vuole rendere `STALE` semanticamente puro:

```text
STALE
→ solo freshness/age

DEGRADED
→ errore tecnico / CDP / Graph / ladder / market degradation
```

questa deve essere una decisione sull'owner `betfairHealth`, non una modifica inventata nel runbook.

### Verification

Aggiungere casi isolati per ogni causa yellow e verificare:

```text
status
label
message
reasons
checks
alert
```

---

# 2. L'alert auth può restare rosso anche dopo un nuovo scrape utilizzabile

## Esito: nuovo gap di recovery semantics

Il runbook descrive il recovery login in modo lineare:

```text
Graph login required
→ login nel browser
→ nuovo scrape utilizzabile
→ alert superato
→ UI Connected
```

Il runtime corrente possiede però una memoria implicita diversa.

`buildBetfairSessionHealth()` prende:

```text
validTicks.slice(-3)
```

e cerca, partendo dal più recente, un tick con:

```text
diagnostics.graphLoginRequired === true
```

Se ne trova uno:

```text
loginReqTick != null
→ graphAuthRequired = true
→ loginOk = false
→ classifier red/ALERT
```

anche quando il tick più recente ha:

```text
graphHealth.status = ok
```

e non richiede login.

## Esempio concreto

Timeline:

```text
tick 100
→ statusOnlyGraphLogin=true
→ graphLoginRequired=true
→ red

login completato

tick 101
→ graphHealth.status=ok
→ scrape utilizzabile
```

La finestra degli ultimi tre tick è ancora:

```text
100 auth
101 ok
```

quindi:

```text
loginReqTick = tick 100
→ red può restare attivo
```

Un singolo nuovo sample sano non è quindi, da solo, la condizione di clear dell'alert nel codice corrente.

In pratica il vecchio tick auth deve uscire dalla finestra degli ultimi tre tick canonici, salvo cambiamento del classifier.

## Caso ancora più delicato

Se dopo il login:

```text
arriva un solo tick sano
poi non arrivano altri tick canonici
```

il vecchio auth tick può restare nella finestra e quindi continuare ad influenzare la health.

Il runbook oggi non rende visibile questa proprietà.

## Perché non è `BETFAIR-SCRAPER-007`

`BETFAIR-SCRAPER-007` possiede la classificazione upstream:

```text
auth_required
security_challenge
no_ladder_rows
temporary_error
```

Questo finding riguarda invece:

```text
health memory
→ alert latch
→ recovery/clear semantics
```

È quindi distinto.

## Finding `BETFAIR-DIAG-002` — definire l'authority di clear dell'alert auth

**Priorità:** high  
**Tipo:** auth recovery hysteresis

### Decisione necessaria

Definire esplicitamente quando:

```text
red/ALERT
→ può tornare non-red
```

Possibili contratti da valutare sull'owner health:

```text
A. current authoritative Graph OK clears prior auth
B. N tick canonici sani consecutivi
C. finestra temporale bounded
D. altro stato esplicito di auth recovery
```

Non scegliere implicitamente “ultimi tre tick” solo perché è l'implementazione corrente.

### Documento

Fino alla decisione, il runbook deve dire:

```text
un nuovo scrape utilizzabile
≠
garanzia automatica di clear red
```

e richiedere la verifica effettiva del payload health.

### Verification

Sequenze minime:

```text
auth status-only
→ 1 healthy tick

auth status-only
→ 2 healthy tick

auth status-only
→ 3 healthy tick

auth status-only
→ 1 healthy tick
→ nessun altro tick

auth_suspected corrente
→ healthy corrente
```

Verificare precisamente quando:

```text
loginOk
status
alert
graphLoginRequiredRecent
```

cambiano.

---

# 3. `hasFinished === true` non è ancora un'autorità affidabile end-to-end

## Esito: implementazione già censita, correzione operativa nuova

Il runbook usa:

```text
event_status.hasFinished === true
→ mercato concluso
→ polling Betfair fermato
```

Il downstream effettivamente reagisce a quel booleano.

Il problema è l'authority del producer.

Nel report Python Betfair è già stato censito:

```text
BETFAIR-SCRAPER-006
```

con priorità critical:

```text
weak visible-text finished hint
→ non deve produrre auto-stop

hasFinished
→ solo da evidenza authoritative
```

Lo stesso problema è già collegato al tracking da:

```text
SOFA-LIVE-007
```

Quindi non serve una seconda implementazione tecnica.

## Conseguenza per il runbook

Finché il producer non viene hardenizzato, il runbook non deve equivalere:

```text
boolean ricevuto
=
mercato authoritative finished
```

Deve invece distinguere:

```text
runtime received hasFinished=true
→ downstream può fermarsi oggi

authoritative finished
→ garantito solo dopo hardening del producer
```

## Finding `BETFAIR-DIAG-003` — allineare finished diagnostics all'authority upstream

**Priorità:** critical  
**Tipo:** terminal-state diagnostic authority

### Azione

- mantenere visibile il comportamento runtime corrente;
- qualificare la conclusione “mercato finito”;
- collegare `BETFAIR-SCRAPER-006` e `SOFA-LIVE-007`;
- non introdurre un secondo detector `finished` nel runbook o nel backend diagnostico;
- aggiungere la verification operational dopo l'hardening producer.

### Verification

Separare:

```text
authoritative finished marker
weak visible text
market closure structurata
timeout
Graph error
auth error
```

e verificare che soltanto l'authority approvata produca auto-stop.

---

# 4. `/api/betfair/log` e i log Node non sono la stessa superficie diagnostica

## Esito: nuovo problema di provenance operativa

Il documento elenca eventi strutturati come:

```text
tracking_start
python_spawn_requested
recovery_complete
shutdown_requested
...
```

e usa inoltre:

```text
GET /api/betfair/log
```

come superficie di consultazione diagnostica.

Il rischio è far credere che esista un solo log Betfair.

Non è così.

## Piano Node

`backend/src/sofa/betfairFetch.js` usa:

```text
runtimeLog.debug(
  component = betfair_scraper,
  event = ...
)
```

Questo appartiene al runtime logger Node.

Il logger Node di default scrive sul proprio output runtime; la presenza di `createFileLogWriter()` non significa che tutti questi eventi confluiscano automaticamente nel file letto dalla route Betfair.

## Piano Python

La route:

```text
GET /api/betfair/log
```

legge invece il file dedicato:

```text
backend/betfair_scraper.log
```

prodotto dal logging Python Betfair.

Quindi:

```text
Node runtime structured events
≠
Python betfair_scraper.log
```

## Inoltre `/api/betfair/log` è globale

La route non riceve:

```text
eventId
trackingSessionId
executionId
```

come filtro canonico.

Restituisce un tail bounded del file globale.

Quindi:

```text
ultima riga log
≠
necessariamente evento del match che sto diagnosticando
```

soprattutto se:

```text
più invocazioni
login-only
scrape manuali
sessioni successive
```

sono avvenuti vicino nel tempo.

## Finding `BETFAIR-DIAG-004` — distinguere i log plane e la loro provenance

**Priorità:** high  
**Tipo:** diagnostic log provenance

### Documento

Definire almeno tre superfici:

```text
Node runtime structured log
Python Betfair runtime log
network-capture artifacts
```

e per ciascuna indicare:

```text
producer
scope
boundedness
redaction
event/session correlation
retention owner
```

### Regola

Non usare:

```text
/api/betfair/log
```

come prova autonoma che un evento Node:

```text
tracking_start
shutdown_requested
recovery_complete
```

sia avvenuto.

Non usare una riga del log globale come prova di:

```text
current event
current tracking session
```

senza correlazione disponibile.

### Target futuro

Se serve correlazione più forte, deve usare identificatori già approvati:

```text
eventId
executionId
trackingSessionId quando IMPL-006 esisterà
```

senza esporre URL/path/segreti.

---

# 5. La network capture è opt-in nel percorso Node, ma non nella CLI Python standalone

## Esito: contratto cross-entrypoint incompleto

Il runbook dice:

```text
network capture
→ non fa parte del tracking normale
→ non fa parte del fetch esplicito
→ resta disabilitata finché networkCapture=true
```

Questa è una descrizione corretta del **percorso Node** corrente.

## Route Node `/odds`

`oddsResponse.js` costruisce:

```text
networkCapture:
query.networkCapture === 'true'
```

Quindi:

```text
networkCapture=true
→ true

query assente
networkCapture=false
networkCapture=1
networkCapture=yes
→ false
```

Il runner Node traduce poi il booleano in:

```text
--no-network-capture
```

quando la capture non è richiesta.

## CLI Python standalone

La CLI Python invece possiede:

```text
--no-network-capture
```

come flag opt-out.

La logica è:

```text
network_capture = not args.no_network_capture
```

Quindi:

```text
python CLI senza flag
→ network capture ATTIVA

python CLI con --no-network-capture
→ network capture DISATTIVA
```

Questa differenza era stata intenzionalmente lasciata invariata quando il flusso Node è stato reso opt-in.

## Perché è importante

Un operatore che legge:

```text
la capture è disabilitata finché non viene richiesta
```

può eseguire la CLI Python direttamente aspettandosi zero dump, ottenendo invece il comportamento opposto.

## Finding `BETFAIR-DIAG-005` — esplicitare la capture activation per entrypoint

**Priorità:** high  
**Tipo:** network capture activation contract

### Documento

Separare:

```text
tracking Node
→ capture off di default

GET /api/betfair/odds
→ capture off di default
→ networkCapture=true esatto abilita

CLI Python diretta
→ capture on di default oggi
→ --no-network-capture disabilita
```

### Decisione futura

Valutare se uniformare le entrypoint, ma non cambiare la CLI incidentalmente dentro la revisione documentale.

### Verification

Testare:

```text
Node default
Node true
Node false
Node string diversa

CLI default
CLI --no-network-capture
```

e controllare anche:

```text
dump creation
summary
cache interaction
redaction
```

---

# 6. Il runbook usa `/api/betfair/odds` come strumento diagnostico, ma quella route è un ingresso legacy mutante

## Esito: criticità operativa

Il runbook presenta la network capture tramite:

```text
GET /api/betfair/odds?url=...&networkCapture=true
```

Questo è problematico perché `/odds` non è una semplice route diagnostica read-only.

È già stato censito in:

```text
BETFAIR-LIFE-006
```

come ingresso legacy che:

```text
usa fetchBetfairData()
fuori dal tracking canonico
senza deferPersistence:true
può spawnare Python
può eseguire Graph
può abilitare network capture
può persistere se riceve sofaEventId
bypassa il sequencing tracking/gate
```

Inoltre è già destinato alla rimozione/normalizzazione.

`BETFAIR-API-007` possiede anche i problemi di sicurezza della route:

```text
details: error.message
validator URL condiviso mancante
```

## Contraddizione col principio iniziale del runbook

Il documento apre con una regola corretta:

```text
la diagnostica Betfair osserva read-only
non scrive timeline/history/journal
non modifica marketState
```

ma poi propone come strumento di diagnosi una route che appartiene a un percorso legacy mutante.

Questa distinzione deve essere resa esplicita.

## Finding `BETFAIR-DIAG-006` — definire un diagnostic entrypoint sicuro e non usare `/odds` come falsa route read-only

**Priorità:** critical  
**Tipo:** diagnostic mutation boundary

### Stato corrente

Finché `/odds` esiste:

```text
classificarla come LEGACY MUTATING ENTRYPOINT
```

non come:

```text
read-only diagnostics
```

### Coordinamento

Non creare una seconda rimozione.

L'implementazione resta posseduta da:

```text
BETFAIR-LIFE-006
BETFAIR-API-007
```

### Prima della rimozione definitiva

Definire come verrà eseguita, se ancora necessaria, la network capture controllata:

```text
dedicated diagnostic command
oppure
safe diagnostic route
oppure
CLI esplicita
```

La scelta deve preservare:

```text
no canonical persistence
no Source Identity bypass
no marketState mutation
owned process
bounded output
redaction
explicit opt-in
```

### Regola operativa immediata

Il runbook non deve descrivere `/odds` come “lettura diagnostica”.

Se viene ancora usata nella baseline corrente, deve dichiarare:

```text
legacy
potentially mutating
non canonical
da usare soltanto in procedura controllata
```

---

# 7. `no_known_partial` può dare falsa rassicurazione se il journal non è stato leggibile

## Esito: problema tecnico già posseduto, correzione diagnostica necessaria

Il runbook usa correttamente il termine:

```text
no_known_partial
```

e non lo chiama formalmente:

```text
persistence guaranteed healthy
```

Tuttavia in un punto lo traduce operativamente così:

```text
404 + integrity no_known_partial
→ risorsa assente ordinaria
```

Questa conclusione è troppo forte rispetto al runtime corrente.

## Finding tecnico precedente

`JOURNAL-REC-004` ha già rilevato che:

```text
listJournalRecords()
→ può fallire nella lettura/scansione

getPersistenceIntegrityStatus()
→ può ignorare journal.reason

records=[]
→ no_known_partial
```

Quindi il sistema può oggi produrre:

```text
no_known_partial
```

non perché abbia dimostrato:

```text
nessun partial esiste
```

ma perché non è riuscito a osservare correttamente lo stato del journal.

## `recovery_failed` ha inoltre una lifecycle ancora incompleta

`JOURNAL-REC-005` possiede già la decisione su:

```text
retryable operational failure
terminal recovery failure
invalid structure
observability di record marcati failed
```

Perciò anche la frase:

```text
recovery_failed
→ bootstrap recovery ha tentato e fallito
```

va mantenuta prudente finché quella lifecycle non viene consolidata.

## Finding `BETFAIR-DIAG-007` — allineare la diagnostica integrity al fail-closed storage authority

**Priorità:** high  
**Tipo:** integrity diagnostic semantics

### Documento

Fino a `JOURNAL-REC-004`:

```text
no_known_partial
→ nessun partial noto al reader corrente
→ non equivale a scan sicuramente riuscita
```

Dopo l'implementazione fail-closed:

```text
scan/read degraded
→ stato distinto
→ non deve collassare a no_known_partial
```

### `404`

Non stabilire come regola definitiva:

```text
404 + no_known_partial
→ ordinary missing
```

finché la read authority non può distinguere:

```text
missing
read_failed
invalid_json
invalid_shape
journal_scan_degraded
```

### Coordinamento

L'implementazione resta negli owner:

```text
JOURNAL-REC-004
JOURNAL-REC-005
STORAGE-TH-001
BETFAIR-API-004
```

Il runbook deve soltanto consumare la tassonomia canonica.

---

# 8. La verification matrix non copre proprio i boundary diagnostici più delicati

## Esito: coverage da ampliare e provenance da rendere esplicita

Il progetto possiede test reali e utili su:

```text
health freshness
technical error
bad Graph URL
auth suspected
latest payload
integrity HTTP
Money Flow
runtime logger
scraper lifecycle
Graph URL
network capture redaction
```

Ma il runbook aggrega molte superfici e quindi richiede test di **diagnostic interpretation**, non soltanto test dei singoli moduli.

## Gap concreti

Non risultano coperti end-to-end o direttamente:

```text
yellow/STALE causato da CDP false
yellow/STALE causato da market invalid
yellow/STALE causato da no-ladder
yellow/STALE causato da graph unavailable/temp error

status-only auth
→ 1 healthy tick
→ quando si spegne red?

status-only auth
→ nessun ulteriore tick
→ alert resta?

Node runtime log
vs
/api/betfair/log Python
→ provenance corretta

Node capture default off
vs
CLI Python default on

legacy /odds
→ non trattato come read-only diagnostic path

integrity scan failure
→ nessun falso no_known_partial

finished weak hint
→ nessun auto-stop dopo hardening

public diagnostic fields
→ nessun URL/path/token raw

capture async drain
→ summary solo dopo task owned
```

## Test path da usare

La verification non deve reintrodurre i vecchi test monolitici già rimossi.

Per la route Betfair corrente usare le suite modulari reali, fra cui:

```text
backend/src/routes/betfair/latestPayloadResponse.test.mjs
backend/src/routes/betfair/latestPayloadIntegrity.test.mjs
backend/src/routes/betfair/betfairJsonResponse.test.mjs
backend/src/routes/betfair/normalizeIntegrity.test.mjs
```

oltre alle suite health, lifecycle, logger e Python pertinenti.

## Provenance live

Ogni osservazione manuale come:

```text
logout
popup/audio
login
Connected
```

deve essere archiviata soltanto se possiede:

```text
data
commit SHA
ambiente
azioni
endpoint osservati
risultato
scenari non esercitati
limiti
```

Se manca un dato storico:

```text
non registrato
```

non ricostruito retroattivamente.

## Finding `BETFAIR-DIAG-008` — verification/provenance matrix

**Priorità:** high  
**Tipo:** diagnostic verification

### Azione

- aggiungere test sulle cause yellow;
- aggiungere sequenze auth recovery;
- distinguere i log plane;
- testare Node vs CLI capture;
- verificare la boundary `/odds`;
- coordinare integrity degraded con `JOURNAL-REC-004/005`;
- verificare finished authority dopo `BETFAIR-SCRAPER-006`;
- usare current modular Betfair route tests;
- archiviare live validation con provenance reale;
- riusare le task già aperte per capture redaction/async drain senza duplicarle.

---

# Aspetti verificati e corretti da mantenere

## 1. Timeout tecnico non genera attività sintetica

Il documento è corretto quando distingue:

```text
scrape attempt
scrape success
canonical tick
history write
Money Flow advancement
```

Un timeout:

```text
aggiorna runtime attempt/error
non crea automaticamente tick
non duplica volume
non significa finished
non significa Source Identity error
```

Questa filosofia è coerente con il runtime health attuale.

## 2. `DEGRADED` tecnico non deve diventare auth

Il classifier mantiene:

```text
technicalErrorActive
→ yellow/DEGRADED
→ alert false
```

e:

```text
auth_suspected / loginReqTick
→ red/ALERT
```

La priorità red sull'errore tecnico è esplicita.

## 3. Stale age non rende `loginOk=false`

Questa distinzione è corretta e testata.

```text
freshness problem
≠
authentication problem
```

## 4. Il rosso non prova da solo `statusOnlyGraphLogin`

Il documento dice correttamente:

```text
red/ALERT
→ auth signal

statusOnlyGraphLogin === true
→ specifica transizione canonica status-only
```

La timeline implementa davvero un tick status-only che:

```text
preserva snapshot canonico precedente
sopprime Money Flow
azzera ladder del nuovo stato diagnostico
registra graphLoginRequired
marca statusOnlyGraphLogin
```

solo quando la condizione specifica è soddisfatta.

## 5. Exactly 45 secondi non è stale per age

La condizione corrente è:

```text
age > 45
```

non:

```text
age >= 45
```

Quindi il wording:

```text
45 secondi
→ ancora non stale

oltre 45
→ stale
```

è corretto.

## 6. Network capture redaction prima della write

`network_capture.py` applica realmente la redazione ai dati destinati al dump.

Il filename/hash usa l'URL già redatto, non l'URL raw.

Restano però già aperti:

```text
BETFAIR-SCRAPER-003
→ public diagnostic envelope / dump_dir

BETFAIR-SCRAPER-004
→ async capture ownership/drain
```

Non vengono duplicate in questo report.

## 7. Il runbook non tenta repair manuale della persistenza

È corretta la regola:

```text
no history edit
no timeline edit
no journal deletion
no synthetic tick
```

La diagnostica deve osservare e poi passare all'owner recovery/validation.

## 8. Money Flow non va “rianimato” con fallback

È corretta la filosofia:

```text
dato non avanza
→ diagnosticare
→ non duplicare l'ultimo punto
→ non creare volume sintetico
```

Gli aspetti numerici e di identity restano negli owner Money Flow già auditati.

---

# Dipendenze già aperte da non duplicare

```text
BETFAIR-API-001
BETFAIR-API-004
BETFAIR-API-006
BETFAIR-API-007
BETFAIR-API-009

BETFAIR-LIFE-006
BETFAIR-LIFE-008
BETFAIR-LIFE-010
BETFAIR-LIFE-011

BETFAIR-SCRAPER-003
BETFAIR-SCRAPER-004
BETFAIR-SCRAPER-006
BETFAIR-SCRAPER-007
BETFAIR-SCRAPER-009
BETFAIR-SCRAPER-010

GRAPH-URL-001
GRAPH-URL-002
GRAPH-URL-003
GRAPH-URL-004
GRAPH-URL-005
GRAPH-URL-006
GRAPH-URL-007

SOFA-LIVE-006
SOFA-LIVE-007
SOFA-LIVE-009

STORAGE-TH-001
STORAGE-TH-002
STORAGE-TH-008

JOURNAL-REC-004
JOURNAL-REC-005
JOURNAL-REC-006
JOURNAL-REC-007
JOURNAL-REC-009

FRONT-BETFAIR-007
FRONT-BETFAIR-008

PREFLIGHT-API-006
PREFLIGHT-API-007

LOCAL-RUNTIME-006
```

## Ownership specifica

- `BETFAIR-API-*` resta owner delle route pubbliche Betfair.
- `BETFAIR-LIFE-*` resta owner del lifecycle Node/Python e della route legacy `/odds`.
- `BETFAIR-SCRAPER-*` resta owner del Python scraper, capture, redaction e relativi test.
- `GRAPH-URL-*` resta owner della validazione e mappatura Graph URL.
- `JOURNAL-REC-*` resta owner della tassonomia integrity/recovery.
- `FRONT-BETFAIR-*` resta owner della presentazione health/debug.
- questo documento resta **runbook operativo**.

---

# Lunghezza, integrità del contesto e modularizzazione

## Dimensione

```text
828 righe
```

È un documento lungo.

La lunghezza da sola non giustifica però la divisione.

## Contenuti

Il runbook attraversa:

```text
timeout
health
freshness
integrity
CDP
Graph URL
login
status-only
runtime process
log
network capture
redaction
Money Flow
frontend symptom
recovery operativo
```

A prima vista sembrano owner differenti.

In realtà la responsabilità operativa è una sola:

```text
partire da un sintomo Betfair
→ classificare il dominio del problema
→ leggere la superficie giusta
→ evitare side effect
→ instradare verso l'owner tecnico corretto
```

## Owner specialistici già esistenti o già proposti

La parte tecnica è già separata altrove.

In particolare `BETFAIR-SCRAPER-010` ha già proposto:

```text
docs/tennis-decision-ui/modules/python/05-betfair-diagnostics-and-network-capture.md
```

come futuro owner tecnico di:

```text
capture
redaction
logger
dump policy
diagnostic tests
```

La diagnostica API appartiene agli owner Betfair API.

Graph URL ha il proprio documento.

Recovery ha il proprio owner storage.

Frontend health ha il proprio owner UI.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare un secondo split.

## Target documentale

Quando gli owner specialistici proposti saranno creati:

```text
03-betfair-diagnostics.md
→ deve accorciarsi
→ ma restare un singolo runbook operativo
```

riducendo spiegazioni tecniche duplicate e sostituendole con:

```text
decision tree
checklist
safe commands/endpoints
link agli owner
```

---

# Riferimenti per la futura mappa/ledger

```text
Report ID: TDUI-DOC-REPORT-034
Percorso report: Report documentale/34 - 03-betfair-diagnostics.md
Documento: docs/tennis-decision-ui/operations/03-betfair-diagnostics.md

Change ID: BETFAIR-DIAG-001
Change ID: BETFAIR-DIAG-002
Change ID: BETFAIR-DIAG-003
Change ID: BETFAIR-DIAG-004
Change ID: BETFAIR-DIAG-005
Change ID: BETFAIR-DIAG-006
Change ID: BETFAIR-DIAG-007
Change ID: BETFAIR-DIAG-008

Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

La mappa e il ledger non vengono modificati ora.

Il report 034 è il secondo elemento del checkpoint:

```text
033
034
035
036
037
```

Il consolidamento avverrà dopo il report 037.

---

# Modifiche proposte

## `BETFAIR-DIAG-001` — truthful health label taxonomy

**Priorità:** high

- `yellow/STALE` non deve essere descritto soltanto come age stale;
- documentare tutte le cause yellow correnti;
- diagnosi tramite `message/reasons/checks/metrics`, non dal label isolato;
- decidere separatamente se in futuro `STALE` debba significare soltanto freshness;
- aggiungere test per tutte le cause yellow.

---

## `BETFAIR-DIAG-002` — auth alert recovery/hysteresis

**Priorità:** high

- rendere esplicita la finestra degli ultimi tre tick;
- un nuovo tick sano non garantisce oggi clear immediato del red;
- definire una vera authority di auth recovery;
- aggiungere test status-only → healthy 1/2/3;
- aggiungere il caso healthy singolo senza ulteriori tick.

---

## `BETFAIR-DIAG-003` — finished authority alignment

**Priorità:** critical

- non trattare il booleano ricevuto come authoritative finished finché il producer non è hardenizzato;
- coordinare `BETFAIR-SCRAPER-006` e `SOFA-LIVE-007`;
- non creare un secondo finished detector;
- aggiornare la verification dopo la correzione upstream.

---

## `BETFAIR-DIAG-004` — diagnostic log plane/session provenance

**Priorità:** high

- distinguere Node runtime log, Python Betfair log e capture artifacts;
- `/api/betfair/log` è un tail del log Python, non del runtime Node;
- il log è globale, non event/session-scoped;
- non usare una riga recente come prova della sessione corrente;
- definire correlazione bounded con identificatori approvati.

---

## `BETFAIR-DIAG-005` — network capture activation contract

**Priorità:** high

- Node tracking: capture off di default;
- `/odds`: capture off di default, `networkCapture=true` esatto abilita;
- CLI Python standalone: capture on di default, `--no-network-capture` disabilita;
- non presentare una policy unica quando le entrypoint differiscono;
- verificare matrice Node/CLI e dump creation.

---

## `BETFAIR-DIAG-006` — legacy `/odds` diagnostic boundary

**Priorità:** critical

- non presentare `/api/betfair/odds` come route read-only di diagnostica;
- dichiararla legacy e potenzialmente mutante finché esiste;
- coordinare rimozione con `BETFAIR-LIFE-006` e hardening con `BETFAIR-API-007`;
- definire un replacement diagnostico safe prima della rimozione se la capture resta necessaria;
- nessuna persistence/gate bypass nel futuro diagnostic path.

---

## `BETFAIR-DIAG-007` — integrity diagnostic fail-closed alignment

**Priorità:** high

- `no_known_partial` non è oggi prova che lo scan sia riuscito;
- coordinare `JOURNAL-REC-004`;
- qualificare `recovery_failed` finché `JOURNAL-REC-005` è aperto;
- non fissare definitivamente `404 + no_known_partial = ordinary missing`;
- consumare la futura tassonomia storage canonica senza crearne una seconda.

---

## `BETFAIR-DIAG-008` — verification/provenance matrix

**Priorità:** high

- testare cause yellow complete;
- testare auth recovery;
- testare log planes;
- testare Node vs CLI capture;
- testare legacy `/odds` boundary;
- testare integrity degraded;
- testare finished authority;
- verificare redaction/allow-list delle superfici pubbliche;
- usare le suite Betfair modulari correnti;
- archiviare live validation soltanto con provenance reale.

---

# Ordine consigliato di applicazione

```text
1. BETFAIR-SCRAPER-006 / SOFA-LIVE-007
   → authoritative finished

2. JOURNAL-REC-004 / JOURNAL-REC-005
   → integrity fail-closed e recovery lifecycle

3. BETFAIR-LIFE-006 / BETFAIR-API-007
   → rimozione/hardening legacy /odds

4. BETFAIR-DIAG-006
   → diagnostic boundary coerente

5. BETFAIR-DIAG-005
   → capture activation per entrypoint

6. BETFAIR-DIAG-002
   → auth clear authority

7. BETFAIR-DIAG-001
   → health taxonomy operativa

8. BETFAIR-DIAG-004
   → log plane provenance

9. BETFAIR-SCRAPER-003/004
   → capture envelope + async ownership

10. SOFA-LIVE-006 / FRONT-BETFAIR-007
    → public diagnostic redaction/allow-list

11. BETFAIR-DIAG-007
    → integrity wording

12. BETFAIR-DIAG-008
    → verification/provenance

13. revisione mirata operations/03-betfair-diagnostics.md

14. checker documentali

15. aggiornamento cumulativo mappa/ledger dopo report 037
```

L'ordine può essere adattato durante l'esecuzione per rispettare le dipendenze, ma non deve creare owner tecnici duplicati.

---

# Verification matrix proposta

## A. Freshness esatta

```text
age = 45
→ non stale per la sola età

age = 46
→ yellow/STALE
```

Verificare sia:

```text
latestBetfairAgeSec
latestUsableLadderAgeSec
```

---

## B. Yellow non causato dall'età

### CDP

```text
recent tick
recent ladder
cdpStatus=false
```

Atteso:

```text
yellow
alert=false
reason CDP
```

Il runbook non deve diagnosticare “dato >45s”.

### Market

```text
recent tick
marketOk=false
```

Atteso:

```text
yellow
alert=false
market reason
```

### No ladder

```text
recent tick
consecutiveNoLadderTicks=1
```

Atteso:

```text
yellow
alert=false
```

### Graph unavailable

```text
graphHealth.status=unavailable
```

Atteso:

```text
yellow
alert=false
```

---

## C. Technical error

```text
lastTechnicalErrorAt > lastSuccessfulScrapeAt
```

Atteso:

```text
yellow
DEGRADED
alert=false
```

Un nuovo:

```text
lastSuccessfulScrapeAt > lastTechnicalErrorAt
```

deve disattivare `technicalErrorActive`.

---

## D. Auth status-only

Sequenza:

```text
canonical healthy
→ login required
→ status-only tick
```

Verificare:

```text
statusOnlyGraphLogin=true
graphLoginRequired=true
red/ALERT
Money Flow suppressed
snapshot precedente preservato secondo contratto
```

---

## E. Auth recovery

Dopo D:

```text
healthy tick 1
```

registrare risultato corrente.

Poi:

```text
healthy tick 2
healthy tick 3
```

registrare:

```text
quando sparisce loginReqTick
quando loginOk torna true
quando red/ALERT sparisce
```

Il comportamento deve coincidere con la policy approvata da `BETFAIR-DIAG-002`.

---

## F. Finished

Fixture distinte:

```text
weak visible text
authoritative provider state
market closure signal strutturato
timeout
```

Dopo `BETFAIR-SCRAPER-006`:

```text
solo authority approvata
→ hasFinished true
→ auto-stop
```

---

## G. Log planes

Generare:

```text
evento Node runtime
evento Python scraper
```

Verificare:

```text
/api/betfair/log
→ mostra soltanto la superficie prevista
→ non viene interpretato come log Node completo
```

Verificare inoltre che il runbook non attribuisca:

```text
eventId/sessionId
```

a righe globali che non li possiedono.

---

## H. Capture Node

### Default

```text
networkCapture assente
→ --no-network-capture
→ nessun nuovo dump
```

### True

```text
networkCapture=true
→ capture abilitata
```

### False/altro

```text
false
1
yes
TRUE
```

non devono essere interpretati come il booleano Node esplicito richiesto dalla route.

---

## I. Capture CLI

### Default

```text
CLI senza --no-network-capture
→ capture attiva
```

### Opt-out

```text
CLI --no-network-capture
→ capture disattiva
```

Il runbook deve mostrare questa differenza.

---

## J. Legacy `/odds`

Finché esiste:

```text
GET /api/betfair/odds
```

verificare e documentare che non è una read-only diagnostic surface.

Non deve essere usata come prova che:

```text
diagnostica
→ zero side effects
```

---

## K. Integrity scan failure

Dopo `JOURNAL-REC-004`, simulare:

```text
journal directory unreadable
```

Atteso:

```text
degraded/unknown/integrity unavailable secondo contratto scelto
```

Non:

```text
no_known_partial
```

---

## L. Recovery failed

Coprire separatamente:

```text
invalid journal
retryable I/O failure
terminal recovery state
alreadyRecoveryFailed
```

e verificare che l'API diagnostica mostri uno stato coerente con l'owner recovery.

---

## M. Redaction pubblica

Controllare che:

```text
/latest health
/api/betfair/log
runtime logger
capture summary
capture dump metadata
```

non espongano raw:

```text
token
cookie
authorization
app key
path locale
URL sensibile
userinfo
raw child message
```

Coordinare con le task già esistenti, senza introdurre un secondo sanitizer.

---

## N. Graph URL

Casi:

```text
market identity upstream assente
market mismatch vero
selectionId duplicato
selection non trovata
Graph URL bad
Graph temporary error
```

La diagnosi operativa deve seguire le future reason canoniche di `GRAPH-URL-*`.

---

## O. Current modular route tests

Usare le suite correnti:

```text
latestPayloadResponse.test.mjs
latestPayloadIntegrity.test.mjs
betfairJsonResponse.test.mjs
normalizeIntegrity.test.mjs
```

Non ricreare il vecchio monolite `latestPayload.test.mjs`.

---

## P. Live validation

Per logout/login reale, archiviare:

```text
date
commit SHA
browser/CDP mode
azioni
endpoint osservati
health prima
health durante auth
health dopo recovery
numero tick sani necessari
UI result
scenari non esercitati
limiti
```

Nessun payload sensibile.

---

# Decisione finale

```text
03-betfair-diagnostics.md:

BUON RUNBOOK OPERATIVO,
MA ALCUNE ETICHETTE SINTETICHE VENGONO INTERPRETATE
COME DIAGNOSI PIÙ PRECISE DI QUANTO IL RUNTIME GARANTISCA.

Punti solidi:
- timeout ≠ tick
- scrape success ≠ canonical persistence
- technical error ≠ auth
- stale ≠ finished
- red ≠ automaticamente status-only
- 45s non è stale per age
- no synthetic Money Flow
- no manual persistence repair
- capture Node opt-in
- redaction capture prima della write
- recovery instradata verso owner dedicato

Gap principali:
- STALE ha più cause dell'età
- alert auth usa memoria degli ultimi 3 tick
- un healthy tick non garantisce clear red
- hasFinished non è ancora authoritative end-to-end
- Node runtime log e /api/betfair/log sono piani diversi
- /api/betfair/log non è event/session scoped
- CLI Python ha capture default-on
- /odds è legacy e mutante, non read-only diagnostics
- no_known_partial può nascondere scan failure
- verification non copre questi boundary

Modifiche nuove: 8
Riscrittura completa: no
Revisione mirata: sì
Modularizzazione: no
Nuovi file canonici: nessuno
Priorità complessiva: critica
```

Le quattro distinzioni operative più importanti da introdurre sono:

```text
yellow/STALE
≠
necessariamente age stale
```

```text
un nuovo scrape sano
≠
necessariamente auth alert cleared
```

```text
/api/betfair/log
≠
intero runtime log Node della sessione corrente
```

```text
network capture Node opt-in
≠
network capture CLI Python opt-in
```

e, sul confine di sicurezza:

```text
diagnostica read-only
≠
legacy /api/betfair/odds
```

Il documento deve quindi restare un singolo **operational facade**, più preciso nelle authority e più dipendente dai documenti specialistici già esistenti/proposti, senza duplicarne l'implementazione.

---

# Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 34
Da analizzare: 38
Avanzamento: 47,22%

Blocco corrente 033–037:
[✓] 033 operations/02-live-tracking-control.md
[✓] 034 operations/03-betfair-diagnostics.md
[ ] 035 operations/04-validation-and-rollback.md
[ ] 036 operations/05-retention-and-cleanup.md
[ ] 037 reference/01-repository-map.md
```

Il prossimo documento canonico è:

```text
docs/tennis-decision-ui/operations/04-validation-and-rollback.md
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `BETFAIR-DIAG-001, 003…008`.
- Task ancora aperte: `BETFAIR-DIAG-002`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
