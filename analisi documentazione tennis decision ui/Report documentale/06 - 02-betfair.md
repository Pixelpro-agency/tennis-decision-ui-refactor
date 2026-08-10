# Report documentale — `docs/tennis-decision-ui/api/02-betfair.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-006
Sequenza audit: 06/72
Documento analizzato: 02-betfair.md
Percorso documento: docs/tennis-decision-ui/api/02-betfair.md
Percorso report: Report documentale/06 - 02-betfair.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 659 righe
Ruolo dichiarato: contratto HTTP del router Betfair
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/routes/betfair.js`;
- `backend/src/routes/betfair/latestPayload.js`;
- `backend/src/routes/betfair/cdpStatus.js`;
- `backend/src/routes/betfair/moneyFlowHistory.js`;
- `backend/src/routes/betfair/moneyFlowHistorySeries.js`;
- `backend/src/routes/betfair/oddsResponse.js`;
- `backend/src/routes/betfair/loginWindow.js`;
- `backend/src/routes/betfair/loginWindowLifecycle.js`;
- `backend/src/runtime/runtimeLogger.js`;
- `backend/src/sofa/betfairHealth.js`;
- `backend/src/sofa/betfairFetch.js`;
- `backend/src/sofa/betfair/url.js`;
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`;
- `backend/src/sofa/timelineStore.js`;
- `backend/src/sofa/matchHistory/commitJournal/integrity.js`;
- i test route, Money Flow, runtime logger e login disponibili nel commit.

I due file mappa non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale con il progetto: MEDIO-ALTA
Endpoint mancanti dalla tabella: 0
Endpoint documentati ma non presenti: 0
Contratti o esempi non coerenti col codice: 5
Omissioni rilevanti del contratto pubblico: 4
Rischi di sicurezza o redazione: 2
Modifiche proposte: 9
Necessità di riscrittura completa: SÌ
Necessità di modularizzazione: SÌ
```

Il documento censisce correttamente i cinque endpoint del router:

```text
GET  /api/betfair/:eventId/latest
GET  /api/betfair/:eventId/json
GET  /api/betfair/odds
GET  /api/betfair/log
POST /api/betfair/login-window
```

Sono sostanzialmente corretti:

- il mount e la struttura del router;
- la separazione fra `integrity` e health;
- il comportamento `200 / 404 / 409`;
- la derivazione di `latest`, health e Money Flow;
- la lettura bounded del log;
- la gestione del login-only;
- la deprecazione di `/odds`;
- il ruolo distinto di `betfair_login`.

Le criticità principali sono:

1. `/latest?mode=cdp` effettua una richiesta HTTP verso un `cdpUrl` fornito dal client senza usare la validazione loopback canonica;
2. gli esempi `integrity.reason` usano `commit_incomplete`, mentre il producer usa `pending_commit`;
3. la timeline HTTP non conserva esattamente la shape persistita perché `loadTimeline` aggiunge `latest` e normalizza `timeline`;
4. missing, read failure e JSON invalido vengono collassati allo stesso risultato;
5. una timeline presente ma priva di tick validi restituisce `HTTP 200` con `ok:false`, caso non documentato;
6. le tolleranze Money Flow sono descritte in modo incompleto;
7. `/odds` espone il messaggio raw dell’eccezione nel campo `details`;
8. login-window normalizza ogni mode diverso da `cdp` a `persistent` e riusa una sessione compatibile anche per target URL differenti;
9. il documento combina quattro contratti indipendenti e deve essere modularizzato.

---

# 1. Struttura e superficie HTTP

## Esito: coerente

La struttura del router descritta nel documento corrisponde al codice corrente.

Sono presenti:

```text
latestPayload.js
moneyFlowHistory.js
moneyFlowHistorySeries.js
oddsResponse.js
cdpStatus.js
loginWindow.js
loginWindowLifecycle.js
```

Il router usa inoltre:

```text
pythonProcessRegistry.js
runtimeLogger.js
matchHistory.js
```

La tabella degli endpoint è completa.

Non risultano endpoint documentati ma assenti nel router.

**Modifiche necessarie:** nessuna alla tabella generale.

---

# 2. Letture Betfair read-only

## Esito: definizione troppo assoluta

Il documento afferma che:

```text
latest e json
→ leggono solo timeline persistite e journal
→ non avviano fetch esterno
```

Questa descrizione è corretta per:

```text
GET /api/betfair/:eventId/json
```

Non è completamente corretta per:

```text
GET /api/betfair/:eventId/latest
```

`buildLatestBetfairPayload` esegue prima:

```js
const cdpStatus = await checkCdpStatus(mode, cdpUrl);
```

Quando:

```text
mode = cdp
cdpUrl valorizzata
```

`checkCdpStatus` costruisce:

```text
<cdpUrl>/json/version
```

ed esegue una richiesta HTTP con timeout di 1500 ms.

Quindi `/latest` può produrre traffico di rete durante una richiesta di lettura.

Il fetch non avvia browser o scraper e non modifica persistenza, ma non è una lettura puramente locale.

---

# 3. Validazione `cdpUrl` su `/latest`

## Esito: criticità di sicurezza

Gli altri percorsi CDP del progetto usano:

```text
classifyCdpBaseUrl
```

che accetta soltanto:

- protocollo HTTP;
- host loopback;
- porta esplicita;
- nessuna credenziale;
- nessuna query;
- nessun fragment;
- path `/`.

`checkCdpStatus` non usa questo helper.

Esegue invece:

```js
const normalized = cdpUrl.replace(/\/$/, '');
const url = `${normalized}/json/version`;
const response = await fetch(url);
```

Il valore arriva dalla query HTTP:

```text
/api/betfair/:eventId/latest?mode=cdp&cdpUrl=<valore>
```

Un client può quindi richiedere al backend di tentare un collegamento HTTP verso un host raggiungibile dal processo.

Questo costituisce un rischio SSRF e contraddice il confine dichiarato nel documento.

## Finding `BETFAIR-API-001` — CDP status non validato e lettura non puramente locale

**Priorità:** critica  
**Tipo:** sicurezza e contratto read-only

### Modifica tecnica consigliata

`checkCdpStatus` deve usare il contratto canonico:

```js
classifyCdpBaseUrl(cdpUrl)
```

Comportamento consigliato:

```text
mode diverso da cdp
→ null

mode cdp + URL assente
→ false oppure stato strutturato non disponibile

mode cdp + URL invalida/non-loopback
→ false senza eseguire fetch

mode cdp + URL valida
→ fetch verso <loopback>/json/version
```

Il documento deve sostituire:

```text
non avviano fetch esterno
```

con:

```text
`/json` è una lettura locale pura.

`/latest` non avvia browser o scraper, ma in modalità CDP può eseguire
un controllo HTTP bounded esclusivamente verso un endpoint loopback
validato.
```

### Test richiesti

Creare un test dedicato per `cdpStatus.js`:

```text
mode persistent
→ nessun fetch

mode cdp senza URL
→ nessun fetch

host esterno
→ rifiutato, nessun fetch

URL con credenziali
→ rifiutato

URL con query o fragment
→ rifiutato

loopback valido
→ /json/version

timeout o errore rete
→ false
```

---

# 4. Integrity Betfair

## Esito: struttura generale corretta, reason errata

La normalizzazione pubblica è corretta:

```text
status:
- no_known_partial
- partial_persistence
- recovery_failed

source:
- betfair
- null

affectedDocuments:
- history
- timeline
```

È corretta anche la precedenza della integrity calcolata rispetto a un eventuale campo già presente nel documento.

Il problema è negli esempi:

```json
{
  "status": "partial_persistence",
  "reason": "commit_incomplete"
}
```

Il producer canonico restituisce:

```js
{
    status: 'partial_persistence',
    reason: 'pending_commit'
}
```

## Finding `BETFAIR-API-002` — reason `commit_incomplete` non canonica

**Priorità:** alta  
**Tipo:** valore pubblico errato

### Modifica richiesta

Sostituire in tutti gli esempi:

```diff
-"reason": "commit_incomplete"
+"reason": "pending_commit"
```

Specificare:

```text
partial_persistence
→ reason: pending_commit

recovery_failed
→ reason: recovery reason persistita
→ fallback possibile: recovery_failed
```

Non introdurre un enum chiuso per tutte le recovery reason senza verificarne l’owner.

---

# 5. Shape della timeline `/json`

## Esito: descrizione incompleta

Il documento dichiara:

```text
la risposta mantiene la shape originale del documento letto
```

`buildBetfairJsonResponse` usa:

```js
loadTimeline('betfair', eventId)
```

`loadTimeline`:

1. legge il JSON persistito;
2. normalizza `timeline` a `[]` se non è un array;
3. aggiunge:

```js
latest: data.timeline[data.timeline.length - 1] || null
```

Successivamente `withIntegrity` clona questa vista e aggiunge `integrity`.

La risposta HTTP contiene quindi normalmente:

```text
metadata
timeline
updatedAt, quando presente
latest
integrity
```

`latest` è un campo derivato in lettura e non è necessariamente persistito.

## Finding `BETFAIR-API-003` — vista timeline HTTP descritta come documento originale

**Priorità:** alta  
**Tipo:** payload pubblico

### Modifica richiesta

Sostituire la descrizione con:

```markdown
La route usa la vista restituita da `loadTimeline`:

- normalizza `timeline` a un array;
- aggiunge `latest`, derivato dall’ultima entry;
- clona la vista;
- aggiunge `integrity`.

La route non modifica il documento persistito.
```

Correggere l’esempio `/json` includendo:

```json
{
  "metadata": {
    "eventId": "16305613",
    "source": "betfair"
  },
  "timeline": [],
  "latest": null,
  "integrity": {
    "status": "partial_persistence",
    "reason": "pending_commit",
    "source": "betfair",
    "commitId": "betfair-<uuid>",
    "affectedDocuments": ["timeline"]
  }
}
```

---

# 6. Missing, file illeggibile e JSON invalido

## Esito: semantiche collassate

`loadTimeline` restituisce `null` quando:

- il file non esiste;
- la discovery fallisce;
- la lettura fallisce;
- il JSON è invalido.

Le route non ricevono un read result strutturato e non distinguono le cause.

Comportamento corrente:

```text
loadTimeline → null
+ no_known_partial
→ HTTP 404

loadTimeline → null
+ partial_persistence/recovery_failed
→ HTTP 409
```

Un file presente ma non leggibile può quindi produrre lo stesso contratto di una risorsa assente.

## Finding `BETFAIR-API-004` — “timeline assente” non distingue gli errori di lettura

**Priorità:** alta  
**Tipo:** semantica degli errori

### Correzione documentale minima

Sostituire:

```text
timeline assente
```

con:

```text
il loader non restituisce una timeline leggibile
```

Aggiungere:

```markdown
Nel codice corrente missing, read failure e JSON invalido vengono
collassati a `null` prima della costruzione della risposta HTTP.
```

### Correzione tecnica futura

Introdurre:

```text
loadTimelineResult
```

con stati:

```text
found
missing
invalid_json
read_failed
discovery_failed
```

La modifica cambierebbe il contratto pubblico e richiede:

- decisione;
- test route;
- test frontend;
- compatibilità con `409 persistence_integrity`;
- aggiornamento coordinato con `MATCH-API-005`.

---

# 7. `/latest` con timeline priva di tick validi

## Esito: caso pubblico omesso

Quando la timeline esiste ma:

```text
getLatestValidBetfairTick
→ null
```

la route non restituisce `404`.

Restituisce:

```http
HTTP 200
```

con:

```json
{
  "ok": false,
  "latest": null,
  "latestTimestamp": null,
  "moneyFlowHistory": {
    "series": []
  }
}
```

Health, metadata e integrity restano presenti.

Il documento presenta `/latest` come endpoint che restituisce l’ultimo tick valido, ma non descrive questo stato.

Inoltre:

```text
metadata.updatedAt
```

usa, come ultimo fallback:

```js
now.toISOString()
```

Se timeline e metadata non contengono `updatedAt`, il campo può quindi rappresentare l’ora di costruzione della risposta, non l’ora di persistenza.

## Finding `BETFAIR-API-005` — stato `HTTP 200 / ok:false` non documentato

**Priorità:** media  
**Tipo:** completezza del payload

### Modifica richiesta

Aggiungere una matrice:

| Timeline | Tick valido | HTTP | `ok` | `latest` |
| --- | --- | ---: | --- | --- |
| assente/non leggibile | — | `404` o `409` | `false` | assente |
| presente | no | `200` | `false` | `null` |
| presente | sì | `200` | `true` | tick valido |

Aggiungere:

```markdown
`metadata.updatedAt` usa il valore persistito quando disponibile.
In sua assenza può usare l’ora di costruzione della risposta; non deve
essere interpretato come `latestTimestamp`.
```

---

# 8. Money Flow History

## Esito: principi corretti, tolleranze imprecise

Sono corretti:

- massimo venti tick validi;
- identità per `selectionId`;
- runner senza `selectionId` escluso;
- continuità con nome aggiornato;
- assenza di direzione, trend e confidence nel read model;
- soppressione delle anomalie;
- priorità raw runner delta → computed runner delta → zero.

La descrizione delle tolleranze non è esatta.

## Raw/computed

Il documento afferma:

```text
tolleranza del 10% quando entrambi positivi
```

Il codice usa:

```js
const tol = Math.max(1, base * 0.10);
```

Quindi la tolleranza è:

```text
massimo fra:
- 1 unità assoluta
- 10% del valore maggiore
```

Per valori piccoli non è una semplice tolleranza del 10%.

## Runner rispetto al mercato

Il codice non invalida ogni:

```text
runnerDelta > marketDelta
```

Usa:

```js
const tol = Math.max(1, Math.abs(effectiveMarketDelta) * 0.05);
```

e invalida soltanto quando:

```text
runnerDelta > marketDelta + tolleranza
```

## Finding `BETFAIR-API-006` — tolleranze Money Flow documentate in modo incompleto

**Priorità:** alta  
**Tipo:** contratto numerico

### Modifica richiesta

Documentare:

```text
raw/computed mismatch
→ tolleranza = max(1, 10% del valore maggiore)

runner oltre market
→ tolleranza = max(1, 5% del market delta)
```

Mantenere separati:

- delta negativi;
- zero-vs-positivo;
- divergenza raw/computed;
- runner oltre market;
- `matched_total_decreased`.

Non semplificare le tolleranze in formule descrittive che cambiano il risultato sui valori piccoli.

---

# 9. `/odds` deprecato

## Esito: deprecazione coerente, confine di sicurezza non garantito

Il documento descrive correttamente:

- URL obbligatoria;
- query supportate;
- parsing di `ladderUrls` e `graphUrls`;
- `networkCapture=true` come unico valore abilitante;
- fetch esplicito;
- assenza di un contratto integrity obbligatorio.

## Errore raw

In caso di eccezione, `oddsResponse.js` restituisce:

```json
{
  "error": "Failed to fetch Betfair data",
  "details": "<error.message>"
}
```

Il messaggio dell’eccezione viene quindi esposto direttamente.

Questo contraddice:

```text
il router non espone errori raw o dettagli interni
```

e può divulgare:

- path;
- URL;
- dettagli runtime;
- messaggi del processo o delle dipendenze.

## Validazione target

La route verifica soltanto:

```js
if (!url)
```

`normalizeBetfairUrl` rimuove alcuni parametri ma non limita il dominio a Betfair.

Il target viene poi passato come argomento al processo Python.

Il contratto HTTP non garantisce quindi che `/odds` accetti esclusivamente un URL Betfair.

## Finding `BETFAIR-API-007` — `/odds` espone dettagli raw e non valida il dominio

**Priorità:** alta  
**Tipo:** sicurezza della superficie deprecata

### Modifica tecnica consigliata

Prima del fetch:

- richiedere una stringa non vuota;
- validare protocollo HTTP/HTTPS;
- consentire soltanto host Betfair approvati;
- rifiutare credenziali nell’URL;
- valutare query e fragment consentiti;
- restituire errori pubblici bounded.

Errore consigliato:

```json
{
  "ok": false,
  "code": "betfair_fetch_failed",
  "error": "Unable to fetch Betfair data."
}
```

Il dettaglio interno deve essere trasformato in reason code redatto nel log.

### Compatibilità

La route è deprecata.

La modifica non deve:

- estenderne le funzionalità;
- crearne nuovi consumer;
- cambiare `/latest` o `/json`;
- trasformarla in una lettura canonica.

Se la rimozione di `/odds` è già autorizzata in una task separata, è preferibile rimuovere la superficie anziché investirvi un refactor esteso.

---

# 10. Log Betfair

## Esito: coerente

Il contratto documentato coincide con `runtimeLogger.js`:

```text
path fisso
massimo 200 linee
massimo 1000 caratteri
ultimi 512 KiB
redazione in lettura
Cache-Control: no-store
HTTP 200
status: ok | not_found | read_failed
```

Il router non espone il path nel body.

La richiesta non controlla limiti o file.

**Modifiche al contratto:** nessuna.

### Verifica mancante

La sezione Verifica dovrebbe includere:

```text
node runtime/runtimeLogger.test.mjs
```

perché il contratto bounded e la redazione sono verificati lì.

Questo aggiornamento rientra in `BETFAIR-API-009`.

---

# 11. Login window

## Esito: flusso principale coerente, fallback e deduplica non espliciti

Sono corretti:

- `no_target`;
- URL Betfair invalida;
- CDP richiesta e validata soltanto in modalità CDP;
- `scraper_not_found`;
- `started`;
- `already_active`;
- `login_runtime_conflict`;
- `login_spawn_failed`;
- attesa di `spawnReady`;
- nessun secondo spawn su sessione compatibile;
- ruolo `betfair_login`;
- `200` non equivale a login completato.

## Mode

Il codice usa:

```js
const mode = payload.mode === 'cdp' ? 'cdp' : 'persistent';
```

Quindi non si limita a usare `persistent` quando il campo manca.

Qualunque valore diverso dall’esatta stringa:

```text
cdp
```

viene normalizzato a:

```text
persistent
```

Non esiste un errore:

```text
mode_invalid
```

## Deduplica

La runtime identity è:

```text
persistent
→ mode + profileDir

cdp
→ mode + cdpUrl
```

L’URL target non partecipa all’identità.

Due richieste con URL Betfair differenti ma stessa runtime identity possono produrre:

```text
already_active
```

e non aprono il secondo target.

## Finding `BETFAIR-API-008` — fallback mode e deduplica target non documentati

**Priorità:** media  
**Tipo:** contratto login

### Modifica documentale

Aggiungere:

```markdown
Qualunque `mode` diverso dall’esatta stringa `"cdp"` viene trattato
come `"persistent"`.

La deduplica usa soltanto la runtime identity:
- persistent: `profileDir`;
- cdp: `cdpUrl`.

Il target URL non partecipa alla deduplica. Una richiesta compatibile
con target differente può ricevere `already_active` senza aprire una
seconda finestra.
```

### Decisione tecnica futura

Valutare se:

1. preservare il fallback per compatibilità;
2. accettare soltanto `persistent | cdp`;
3. includere il target nell’identità;
4. mantenere esplicitamente il riuso runtime-only.

La scelta modifica comportamento e test e richiede decisione dell’utente.

---

# 12. Verifica e test

## Esito: sezione incompleta

I comandi elencati coprono:

- latest;
- integrity;
- json;
- Money Flow;
- odds;
- journal;
- recovery.

La sezione usa soltanto:

```text
node --check routes/betfair/loginWindow.js
```

per il login, ma nel repository esistono test specifici:

```text
node routes/betfair/loginWindow.test.mjs
node routes/betfair/loginWindowLifecycle.test.mjs
```

Esiste anche:

```text
node runtime/runtimeLogger.test.mjs
```

per il contratto del log.

Non risulta un test dedicato a:

```text
routes/betfair/cdpStatus.js
```

che verifichi host loopback, path, query, credenziali e assenza di fetch sugli input rifiutati.

La sezione dovrebbe inoltre includere syntax check almeno per:

```text
routes/betfair.js
routes/betfair/latestPayload.js
routes/betfair/cdpStatus.js
routes/betfair/oddsResponse.js
routes/betfair/loginWindow.js
routes/betfair/loginWindowLifecycle.js
```

---

# 13. Lunghezza, compiti e integrità del contesto

## Valutazione

```text
Righe: 659
Endpoint documentati: 5
Responsabilità principali: 4
Helper principali: almeno 7
Contesto minimo comune: basso
Rischio di perdita del contesto: alto
Suddivisione per sola lunghezza: no
Modularizzazione per responsabilità: sì
```

Il file non è lungo soltanto perché documenta più endpoint.

Contiene quattro contratti autonomi.

## Responsabilità A — letture canoniche, integrity e health

```text
/latest
/json
integrity
404/409
health
runtime effimero
CDP status
status-only Graph logout
```

## Responsabilità B — Money Flow History

```text
selectionId
serie
point
priorità delta
tolleranze
anomalie
validForDisplay
```

## Responsabilità C — fetch deprecato e log

```text
/odds
query
network capture
redazione
/log
limiti bounded
```

## Responsabilità D — login window

```text
target
mode
profileDir
cdpUrl
runtime identity
spawnReady
already_active
conflict
ruolo Python
```

Questi blocchi:

- usano helper differenti;
- cambiano con task differenti;
- hanno rischi differenti;
- richiedono test differenti;
- possono avere owner specifici.

---

# 14. Modularizzazione consigliata

## Struttura proposta

```text
docs/tennis-decision-ui/api/
├── 02-betfair.md
└── betfair/
    ├── 01-read-integrity-and-health.md
    ├── 02-money-flow-history.md
    ├── 03-odds-and-log.md
    └── 04-login-window.md
```

## `api/02-betfair.md`

Deve restare come facade:

- scopo;
- mount;
- tabella completa degli endpoint;
- principi comuni;
- stato delle superfici deprecate;
- link ai quattro owner;
- matrice sintetica di status;
- matrice sintetica dei test.

Target consigliato:

```text
circa 100–180 righe
```

## `api/betfair/01-read-integrity-and-health.md`

Owner di:

- `/latest`;
- `/json`;
- CDP status;
- health;
- runtime effimero;
- integrity;
- `pending_commit`;
- `latest`;
- `latestTimestamp`;
- `latest: null`;
- status-only Graph logout;
- 404/409;
- limiti dei loader.

## `api/betfair/02-money-flow-history.md`

Owner di:

- shape delle serie;
- `selectionId`;
- shape dei point;
- raw/computed;
- tolleranze;
- anomalie;
- soppressione;
- limite dei venti tick;
- test numerici.

## `api/betfair/03-odds-and-log.md`

Owner di:

- stato deprecato di `/odds`;
- query;
- validazione target;
- network capture;
- error mapping;
- redazione;
- `/log`;
- limiti bounded;
- no-store.

## `api/betfair/04-login-window.md`

Owner di:

- payload;
- URL Betfair;
- mode;
- profileDir;
- cdpUrl;
- runtime identity;
- deduplica;
- spawnReady;
- status e conflitti;
- lifecycle del figlio Python.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-006
Percorso report: Report documentale/06 - 02-betfair.md
Documento: docs/tennis-decision-ui/api/02-betfair.md
Change ID: BETFAIR-API-001
Change ID: BETFAIR-API-002
Change ID: BETFAIR-API-003
Change ID: BETFAIR-API-004
Change ID: BETFAIR-API-005
Change ID: BETFAIR-API-006
Change ID: BETFAIR-API-007
Change ID: BETFAIR-API-008
Change ID: BETFAIR-API-009
Suddivisione richiesta: sì
Nuovi file proposti:
- docs/tennis-decision-ui/api/betfair/01-read-integrity-and-health.md
- docs/tennis-decision-ui/api/betfair/02-money-flow-history.md
- docs/tennis-decision-ui/api/betfair/03-odds-and-log.md
- docs/tennis-decision-ui/api/betfair/04-login-window.md
```

I due file mappa dovranno registrare in futuro:

- riferimento al report;
- nove task con checkbox;
- stato di modularizzazione;
- quattro nuovi file proposti.

Non sono stati aggiornati durante questa analisi.

---

# Modifiche proposte

## `BETFAIR-API-001` — validare e rendere bounded il CDP status

**Priorità:** critica

**Azione:**

- usare `classifyCdpBaseUrl`;
- rifiutare host non-loopback senza fetch;
- aggiornare il contratto read-only;
- aggiungere test dedicati;
- verificare timeout e comportamento sugli input malformati.

**File potenzialmente coinvolti:**

```text
backend/src/routes/betfair/cdpStatus.js
backend/src/routes/betfair/cdpStatus.test.mjs
backend/src/routes/betfair/latestPayload.js
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-002` — correggere `integrity.reason`

**Priorità:** alta

**Azione:**

- sostituire `commit_incomplete` con `pending_commit`;
- aggiornare gli esempi `json` e `409`;
- distinguere le reason di recovery.

**File principale:**

```text
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-003` — documentare la vista timeline reale

**Priorità:** alta

**Azione:**

- documentare `latest`;
- documentare la normalizzazione di `timeline`;
- distinguere vista HTTP e documento persistito;
- correggere gli esempi.

**File principale:**

```text
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-004` — distinguere missing e read failure

**Priorità:** alta

**Azione:**

- documentare il collasso corrente a `null`;
- valutare `loadTimelineResult`;
- decidere status HTTP distinti;
- coordinare la modifica con `MATCH-API-005`.

**File potenzialmente coinvolti:**

```text
backend/src/sofa/timelineStore.js
backend/src/routes/betfair/latestPayload.js
backend/src/routes/betfair/*.test.mjs
frontend/src/hooks/useBetfairJson.js
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-005` — documentare `/latest` senza tick valido

**Priorità:** media

**Azione:**

- aggiungere il caso `HTTP 200 / ok:false`;
- documentare `latest:null`;
- separare `latestTimestamp` e `metadata.updatedAt`;
- aggiungere test contrattuali se non già coperti.

**File principale:**

```text
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-006` — correggere le tolleranze Money Flow

**Priorità:** alta

**Azione:**

- documentare `max(1, 10%)` per raw/computed;
- documentare `max(1, 5%)` per runner rispetto al mercato;
- mantenere separati zero-vs-positivo e delta negativi;
- aggiornare esempi e test descrittivi.

**File principale:**

```text
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-007` — mettere in sicurezza `/odds`

**Priorità:** alta

**Azione:**

- rimuovere `details: error.message` dal body;
- usare code e messaggi bounded;
- validare protocollo e host Betfair;
- non creare nuovi consumer;
- coordinare la correzione con l’eventuale rimozione della route deprecata.

**File potenzialmente coinvolti:**

```text
backend/src/routes/betfair/oddsResponse.js
backend/src/routes/betfair/oddsResponse.test.mjs
backend/src/sofa/betfair/url.js
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-008` — completare il contratto login

**Priorità:** media

**Azione:**

- documentare il fallback di mode;
- documentare l’identità runtime;
- documentare che il target non partecipa alla deduplica;
- decidere se preservare o cambiare tali comportamenti.

**File principale:**

```text
docs/tennis-decision-ui/api/02-betfair.md
```

---

## `BETFAIR-API-009` — modularizzare e aggiornare la verifica

**Priorità:** alta

**Azione:**

- mantenere `02-betfair.md` come facade;
- creare quattro documenti owner;
- aggiungere test login, lifecycle e runtime logger;
- aggiungere il nuovo test CDP;
- aggiungere syntax check dei moduli route;
- aggiornare indice e link.

**File coinvolti:**

```text
docs/tennis-decision-ui/api/02-betfair.md
docs/tennis-decision-ui/api/betfair/01-read-integrity-and-health.md
docs/tennis-decision-ui/api/betfair/02-money-flow-history.md
docs/tennis-decision-ui/api/betfair/03-odds-and-log.md
docs/tennis-decision-ui/api/betfair/04-login-window.md
docs/tennis-decision-ui/index.md
documenti collegati
```

---

# Ordine consigliato di applicazione

```text
1. correggere subito la validazione CDP;
2. decidere il destino di /odds;
3. decidere il contratto missing/read failure;
4. decidere fallback e deduplica login;
5. creare la struttura api/betfair/;
6. riscrivere i quattro owner;
7. ridurre 02-betfair.md a facade;
8. correggere integrity, timeline, latest e Money Flow;
9. aggiornare test e sezione Verifica;
10. aggiornare indice e link;
11. eseguire checker e suite backend.
```

Le correzioni puramente documentali:

```text
BETFAIR-API-002
BETFAIR-API-003
BETFAIR-API-005
BETFAIR-API-006
BETFAIR-API-008
```

possono essere applicate senza cambiare immediatamente il runtime, purché descrivano fedelmente il comportamento corrente.

Le modifiche:

```text
BETFAIR-API-001
BETFAIR-API-004
BETFAIR-API-007
```

coinvolgono il codice e richiedono test.

La modularizzazione:

```text
BETFAIR-API-009
```

deve essere coordinata con le correzioni per evitare riscritture duplicate.

---

# Controlli previsti dopo un’eventuale modifica

## Dalla root

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs backend
git diff --check
git diff --name-status
```

## Dalla cartella `backend/src`

```bash
node --check routes/betfair.js
node --check routes/betfair/latestPayload.js
node --check routes/betfair/cdpStatus.js
node --check routes/betfair/moneyFlowHistory.js
node --check routes/betfair/moneyFlowHistorySeries.js
node --check routes/betfair/oddsResponse.js
node --check routes/betfair/loginWindow.js
node --check routes/betfair/loginWindowLifecycle.js

node routes/betfair/latestPayloadResponse.test.mjs
node routes/betfair/latestPayloadIntegrity.test.mjs
node routes/betfair/betfairJsonResponse.test.mjs
node routes/betfair/normalizeIntegrity.test.mjs
node routes/betfair/moneyFlowHistorySeries.test.mjs
node sofa/betfairMoneyFlowValidation.test.mjs
node routes/betfair/oddsResponse.test.mjs
node routes/betfair/loginWindow.test.mjs
node routes/betfair/loginWindowLifecycle.test.mjs
node runtime/runtimeLogger.test.mjs
```

Aggiungere, dopo implementazione:

```bash
node routes/betfair/cdpStatus.test.mjs
```

---

# Decisione finale

```text
02-betfair.md: CONTRATTO UTILE MA DA RISCRIVERE E MODULARIZZARE
Endpoint censiti: completi
Coerenza generale: medio-alta
CDP status: rischio di sicurezza da correggere
Integrity reason: da correggere
Timeline HTTP: da descrivere correttamente
Missing/read failure: da distinguere o documentare
Latest senza tick valido: da documentare
Money Flow: tolleranze da correggere
Odds: errori raw e target da mettere in sicurezza
Login: fallback e deduplica da esplicitare
Riscrittura completa: consigliata
Suddivisione: consigliata per responsabilità
Priorità documentale e tecnica: alta
```

Il file non deve essere diviso soltanto perché ha 659 righe.

La divisione è giustificata perché contiene quattro contratti indipendenti:

```text
letture, integrity e health
Money Flow History
odds e log
login window
```

La soluzione consigliata mantiene `02-betfair.md` come facade e sposta i dettagli in quattro documenti owner specifici.

La correzione più urgente non è editoriale: `/latest` deve smettere di effettuare un controllo HTTP verso un `cdpUrl` non validato come loopback.
