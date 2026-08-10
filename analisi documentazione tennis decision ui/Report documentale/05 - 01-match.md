# Report documentale — `docs/tennis-decision-ui/api/01-match.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-005
Sequenza audit: 05/72
Documento analizzato: 01-match.md
Percorso documento: docs/tennis-decision-ui/api/01-match.md
Percorso report: Report documentale/05 - 01-match.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 583 righe
Ruolo dichiarato: contratto HTTP del router Match
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/server.js`;
- `backend/src/routes/match.js`;
- `backend/src/routes/match/readResponses.js`;
- `backend/src/routes/match/trackingResponses.js`;
- `backend/src/routes/match/analysisResponse.js`;
- `backend/src/routes/match/sourceIdentityStatusResponse.js`;
- `backend/src/sofa/matchHistory.js`;
- `backend/src/sofa/matchHistory/storage.js`;
- `backend/src/sofa/timelineStore.js`;
- `backend/src/sofa/matchHistory/commitJournal/integrity.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/historyDocument.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/timelineDocument.js`;
- `backend/src/sofa/matchTracker.js`;
- `backend/src/sofa/sourceIdentityGate.js`;
- `backend/src/sofa/sourceIdentityGate/status.js`;
- `backend/src/sofa/sourceIdentityGate/sessionFactory.js`;
- `backend/src/sofa/buildSofaAnalysis.js`;
- `backend/src/sofa/normalizeSnapshot.js`;
- `backend/src/sofa/localContext.js`;
- `backend/src/sofa/directFetch.js`;
- i test route e persistence citati dal documento;
- `implementazioni/99-decisioni-utente.md`.

I due file mappa non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale con il progetto: MEDIO-ALTA
Endpoint mancanti dalla tabella: 0
Endpoint documentati ma non presenti: 0
Contratti o esempi non coerenti col codice: 5
Omissioni rilevanti del contratto pubblico: 3
Comandi di verifica non esistenti: 1
Problemi di sicurezza o redazione non garantiti: 1
Modifiche proposte: 8
Necessità di riscrittura completa: SÌ
Necessità di modularizzazione: SÌ
```

Il documento individua correttamente tutti i nove endpoint del router e descrive in modo sostanzialmente corretto:

- montaggio sotto `/api/match`;
- letture history e timeline;
- `integrity` additiva;
- `409 persistence_integrity`;
- stato Source Identity Gate;
- tracking SofaScore/Betfair;
- stop globale;
- analisi SofaScore;
- separazione fra `persistence` live e `integrity` journal.

Il file non è però affidabile come contratto HTTP definitivo senza correzioni.

Le discrepanze principali sono:

1. `debug-last` è descritto come superficie capace di restituire l’ultimo debug, ma nel router non esiste alcun producer;
2. gli errori iniziali di `POST /track` non sono documentati;
3. gli esempi `integrity.reason` usano un valore non prodotto dal codice;
4. gli esempi history e timeline non rappresentano le shape correnti;
5. “risorsa assente” comprende in realtà anche file illeggibili o JSON non valido;
6. `POST /analyze` restituisce direttamente il messaggio dell’eccezione, quindi il confine di redazione dichiarato non è garantito;
7. la sezione di verifica contiene almeno un test path inesistente;
8. il documento concentra tre contratti API indipendenti e conviene dividerlo per responsabilità.

---

# 1. Montaggio e struttura del router

## Esito: coerente

Il router è montato dal backend con:

```text
app.use('/api/match', matchRouter)
```

La struttura indicata è corretta:

```text
backend/src/routes/match.js
backend/src/routes/match/readResponses.js
backend/src/routes/match/trackingResponses.js
backend/src/routes/match/analysisResponse.js
backend/src/routes/match/sourceIdentityStatusResponse.js
```

È corretto anche il riferimento alla facade:

```text
backend/src/sofa/matchHistory.js
```

La tabella degli endpoint comprende tutte le route registrate nel router:

```text
GET  /debug-last
GET  /:eventId/source-identity-status
GET  /:eventId/history
GET  /:eventId/json
POST /track
POST /untrack
POST /stop
POST /analyze
POST /snapshot
```

Con il mount del server diventano correttamente:

```text
/api/match/...
```

**Modifiche necessarie:** nessuna alla struttura generale.

---

# 2. `GET /api/match/debug-last`

## Esito: descrizione non coerente col comportamento reale

La tabella dichiara:

```text
Restituisce l’ultimo debug disponibile
```

Il router corrente contiene:

```js
let lastDebugData = null;

router.get('/debug-last', (_req, res) => {
    return res.json(buildDebugLastResponse(lastDebugData));
});
```

Nel file non esiste alcuna assegnazione successiva a `lastDebugData`.

Quindi il comportamento reale del router è stabilmente:

```http
HTTP 200
```

```json
{
  "error": "No data captured yet"
}
```

Il test di `buildDebugLastResponse` dimostra che l’helper saprebbe restituire un oggetto non nullo, ma il router non dispone di un producer che glielo fornisca.

La decisione utente `DEC-009` ha già approvato la rimozione di `debug-last`.

## Finding `MATCH-API-001` — superficie debug descritta come funzionale ma priva di producer

**Priorità:** alta  
**Tipo:** contratto pubblico e deprecazione

### Modifica documentale immediata

Sostituire nella tabella:

```text
Restituisce l’ultimo debug disponibile
```

con:

```text
Superficie deprecata senza producer corrente; restituisce HTTP 200 con
`{"error":"No data captured yet"}`.
```

Nella sezione delle superfici deprecate aggiungere:

```markdown
`GET /api/match/debug-last` non dispone di un producer nel router corrente.
La route resta presente soltanto come superficie legacy e non deve essere
interpretata come sorgente di diagnostica disponibile.
```

### Modifica strutturale già approvata

Una task dedicata può rimuovere:

```text
route /debug-last
lastDebugData
buildDebugLastResponse
test esclusivo della superficie
riferimenti documentali
```

La rimozione non deve essere eseguita durante una semplice correzione del documento senza la relativa task.

---

# 3. Letture history e timeline

## Esito: logica generale corretta

Le route:

```text
GET /api/match/:eventId/history
GET /api/match/:eventId/json
```

sono read-only nel percorso della richiesta:

- non avviano tracker;
- non avviano scraper;
- non eseguono recovery;
- non scrivono journal;
- leggono lo stato integrity;
- restituiscono `200`, `404` oppure `409`.

La normalizzazione pubblica consente correttamente:

```text
no_known_partial
partial_persistence
recovery_failed
```

e filtra:

```text
source → sofa | null
affectedDocuments → history | timeline
```

È corretta anche la regola:

```text
documento presente + partial noto
→ HTTP 200 con integrity additiva
```

e:

```text
documento non restituito dal loader + partial noto
→ HTTP 409 persistence_integrity
```

---

# 4. `integrity.reason`

## Esito: esempi non coerenti col producer canonico

Il documento usa più volte:

```json
{
  "status": "partial_persistence",
  "reason": "commit_incomplete"
}
```

Il producer canonico:

```text
backend/src/sofa/matchHistory/commitJournal/integrity.js
```

restituisce invece, per ogni record pending non marcato `recovery_failed`:

```js
{
    status: 'partial_persistence',
    reason: 'pending_commit'
}
```

Quindi:

```text
commit_incomplete
```

non è il valore prodotto dal codice corrente per `partial_persistence`.

## Finding `MATCH-API-002` — reason `commit_incomplete` inesistente nel contratto corrente

**Priorità:** alta  
**Tipo:** valore pubblico errato

### Modifica richiesta

Sostituire in tutti gli esempi relativi a `partial_persistence`:

```diff
-"reason": "commit_incomplete"
+"reason": "pending_commit"
```

Definire il contratto:

```text
partial_persistence
→ reason: pending_commit

recovery_failed
→ reason: recovery reason persistita
→ fallback: recovery_failed
```

Non trasformare `reason` in un enum chiuso per `recovery_failed` senza verificare l’elenco dei recovery reason ammessi.

---

# 5. Shape della history

## Esito: esempio obsoleto

Il documento mostra:

```json
{
  "eventId": "16305613",
  "updates": [],
  "integrity": {}
}
```

Il documento history canonico costruito da `historyDocument.js` usa invece:

```json
{
  "metadata": {
    "eventId": "<eventId>",
    "date": "<date>",
    "tournament": "<tournament>",
    "players": {
      "home": "<name>",
      "away": "<name>"
    },
    "sofaUrl": "<url>",
    "betfairUrl": "<url>"
  },
  "history": []
}
```

La route clona questo oggetto e aggiunge:

```json
{
  "integrity": {}
}
```

Non usa normalmente:

```text
updates
```

come array canonico della history corrente.

## Finding `MATCH-API-003` — esempio history non corrispondente allo schema persistito

**Priorità:** alta  
**Tipo:** payload pubblico errato

### Esempio sostitutivo

```json
{
  "metadata": {
    "eventId": "16305613",
    "date": "2026-08-06",
    "tournament": "Example Tournament",
    "players": {
      "home": "Player A",
      "away": "Player B"
    },
    "sofaUrl": "",
    "betfairUrl": ""
  },
  "history": [],
  "integrity": {
    "status": "no_known_partial",
    "reason": null,
    "source": "sofa",
    "commitId": null,
    "affectedDocuments": []
  }
}
```

L’esempio deve essere dichiarato schematico e non deve usare nomi o URL reali.

---

# 6. Shape della timeline HTTP

## Esito: descrizione incompleta

Il documento afferma che la risposta:

```text
mantiene la shape originale del documento letto
```

Questo non è completamente vero per la timeline.

`loadTimeline('sofa', eventId)`:

1. legge il documento;
2. se `timeline` non è un array, lo normalizza a `[]`;
3. aggiunge un campo derivato:

```js
latest: data.timeline[data.timeline.length - 1] || null
```

La route aggiunge poi:

```text
integrity
```

Quindi la risposta HTTP della timeline contiene normalmente:

```text
metadata
timeline
updatedAt quando presente
latest
integrity
```

Il campo `latest` non viene persistito nel documento canonico da `prepareTimelineDocument`; viene aggiunto in lettura.

## Finding `MATCH-API-004` — timeline descritta come clone puro ma arricchita dal loader

**Priorità:** alta  
**Tipo:** shape e semantica della lettura

### Modifica richiesta

Sostituire:

```text
mantiene la shape originale del documento letto
```

con una distinzione:

```markdown
La risposta history conserva il documento letto e aggiunge `integrity`.

La risposta timeline usa la vista restituita da `loadTimeline`:
- normalizza `timeline` a un array;
- aggiunge `latest`, derivato dall’ultima entry;
- aggiunge `integrity` nel response builder.

Il documento persistito non viene modificato dalla route.
```

### Esempio timeline sostitutivo

```json
{
  "metadata": {
    "eventId": "16305613",
    "source": "sofa",
    "players": {}
  },
  "timeline": [],
  "latest": null,
  "integrity": {
    "status": "partial_persistence",
    "reason": "pending_commit",
    "source": "sofa",
    "commitId": "sofa-<uuid>",
    "affectedDocuments": ["timeline"]
  }
}
```

---

# 7. Risorsa mancante, file illeggibile e JSON non valido

## Esito: stati tecnici differenti collassati nello stesso contratto

Il documento usa la formula:

```text
quando la risorsa richiesta non esiste
```

La route non riceve però un risultato strutturato capace di distinguere tutte le cause.

## History

`loadHistory(eventId)` restituisce `null` quando:

- il file non esiste;
- l’eventId non è valido;
- la discovery fallisce;
- la lettura fallisce;
- il JSON è invalido.

`loadHistoryResult` conosce la differenza, ma `readResponses.js` usa:

```text
loadHistory
```

e perde il motivo.

## Timeline

`loadTimeline(source, eventId)` restituisce `null` quando:

- il file non esiste;
- la discovery fallisce;
- la lettura fallisce;
- il JSON è invalido.

La route tratta tutti questi casi come assenza.

## Effetto HTTP corrente

```text
loader restituisce null + no_known_partial
→ HTTP 404

loader restituisce null + partial/recovery_failed
→ HTTP 409
```

Un file presente ma corrotto può quindi essere presentato come `404` o `409`, non come errore di lettura distinto.

## Finding `MATCH-API-005` — il documento confonde “missing” con “non leggibile”

**Priorità:** alta  
**Tipo:** semantica degli errori

### Correzione documentale minima

Sostituire:

```text
quando la risorsa richiesta non esiste
```

con:

```text
quando il loader non restituisce un documento leggibile
```

Aggiungere:

```markdown
Nel codice corrente missing, read failure e JSON non valido vengono
collassati a `null` prima della costruzione della risposta HTTP.
La route non espone un codice pubblico distinto per questi casi.
```

### Correzione tecnica consigliata

Introdurre in una task separata:

```text
loadHistoryResult
loadTimelineResult
```

con stati distinti:

```text
found
missing
invalid_json
read_failed
discovery_failed
```

Poi definire esplicitamente i relativi status HTTP.

Questa modifica cambierebbe il contratto pubblico e richiede:

- decisione;
- test;
- aggiornamento del documento;
- verifica frontend;
- compatibilità con `409 persistence_integrity`.

---

# 8. `POST /api/match/track`

## Esito: contratto di input incompleto

Il documento descrive correttamente:

- `cdp_url_required`;
- `cdp_url_invalid`;
- `scraper_runtime_conflict`;
- successo `{ok:true,eventId}`;
- CDP solo HTTP loopback con porta;
- assenza di fallback CDP;
- mancato avvio del tracker in caso di rifiuto.

Mancano però due errori esistenti prima della validazione CDP:

### Sofa URL mancante

```http
HTTP 400
```

```json
{
  "error": "URL SofaScore mancante"
}
```

### Event ID non ricavabile

```http
HTTP 400
```

```json
{
  "error": "URL non valido o eventId non trovato"
}
```

Manca inoltre la semantica effettiva di `betfairMode`.

Il codice usa:

```js
const mode = betfairMode === 'cdp' ? 'cdp' : 'persistent';
```

Quindi ogni valore diverso dall’esatta stringa:

```text
cdp
```

viene trattato come:

```text
persistent
```

Non esiste attualmente un errore:

```text
betfair_mode_invalid
```

## Finding `MATCH-API-006` — validazione track e fallback mode non documentati

**Priorità:** alta  
**Tipo:** input e status HTTP

### Modifica richiesta

Estendere la tabella:

| Caso | HTTP | `code` | Body |
| --- | ---: | --- | --- |
| `sofaUrl` assente | `400` | — | `URL SofaScore mancante` |
| Event ID non ricavabile | `400` | — | `URL non valido o eventId non trovato` |
| CDP assente | `400` | `cdp_url_required` | messaggio CDP |
| CDP non valida | `400` | `cdp_url_invalid` | messaggio CDP |
| Runtime incompatibile | `409` | `scraper_runtime_conflict` | messaggio conflitto |
| Richiesta valida | `200` | — | `{ok:true,eventId}` |

Aggiungere:

```markdown
Nel codice corrente `betfairMode` viene normalizzato a `cdp` soltanto
quando vale esattamente `"cdp"`; ogni altro valore usa `"persistent"`.
Non esiste un errore pubblico per mode sconosciuta.
```

### Decisione tecnica futura

Valutare se:

1. mantenere e documentare il fallback;
2. accettare soltanto `persistent | cdp` e restituire `400` per altri valori.

Non cambiare la validazione senza controllare frontend, launcher e test.

---

# 9. `POST /api/match/untrack`

## Esito: comportamento senza eventId non documentato

La route passa sempre:

```text
payload.eventId
```

a `untrackMatch`.

`untrackMatch(undefined)` non produce errore e la route restituisce comunque:

```http
HTTP 200
```

```json
{
  "ok": true
}
```

Quindi il comportamento corrente è:

```text
eventId valido
→ rimozione selettiva

eventId assente
→ no-op
→ HTTP 200
```

Il documento descrive soltanto il primo caso.

La superficie è deprecata e non ha consumer individuati nel repository.

### Modifica richiesta collegata a `MATCH-API-006`

Nella sezione Untrack aggiungere:

```markdown
Nel codice corrente l’assenza di `eventId` produce un no-op con
`HTTP 200 {"ok":true}`. La route non valida il payload.
```

Dato lo stato deprecato, è preferibile rimuovere l’endpoint nella task dedicata piuttosto che estenderlo con nuovi comportamenti non necessari.

---

# 10. Source Identity Gate status

## Esito: sostanzialmente coerente

Le fasi pubbliche indicate sono corrette:

```text
collecting
pending
recording
mismatch
not-applicable
```

La semantica di `persistence` è corretta:

```text
collecting/pending → buffering
recording/not-applicable → canonical
mismatch → blocked
```

Il payload pubblico esclude correttamente:

- normalized players;
- normalized pairs;
- URL;
- token;
- path;
- riferimenti mutabili.

È corretta la distinzione:

```text
persistence
≠
integrity
```

### Precisione consigliata

Aggiungere la semantica di `active`:

```text
collecting/pending/recording/not-applicable
→ active: true

mismatch
→ active: false
→ phase ancora leggibile

stopped
→ interno; normalmente sessione rimossa
```

Questa è una miglioria contenuta in `MATCH-API-008` e non richiede un change ID separato.

---

# 11. Stop globale

## Esito: coerente

Il documento descrive correttamente:

- body facoltativo;
- `eventId` informativo;
- scope globale;
- `HTTP 200`;
- cleanup Python bounded;
- mancata terminazione di `betfair_login`;
- preservazione di backend, frontend e Chrome;
- nessuna cancellazione di history, timeline o journal;
- idempotenza;
- top-level `ok:true` anche quando `pythonCleanup.ok:false`.

È corretta anche la distinzione del mismatch:

```text
handleSourceIdentityMismatch
→ stop globale con preserveGateEventId
→ gate terminale ancora leggibile
```

**Modifiche necessarie:** nessuna sostanziale.

---

# 12. `POST /api/match/analyze`

## Esito: flusso e payload principali coerenti

Il flusso è corretto:

```text
url
→ extractEventId
→ buildSofaAnalysis
→ addSofaUpdate best effort
→ snapshot + localContext
```

`snapshot` contiene effettivamente:

```text
eventId
fetchedAt
players
status
surface
score
serving
stats
pointByPoint
```

`localContext` contiene:

```text
version
source
purpose
available
match.pointShare
recent
comparison
dataQuality
```

È corretta la regola secondo cui un fallimento della scrittura history non annulla un’analisi già riuscita.

È corretto che `analyze` non restituisca `409 persistence_integrity`.

---

# 13. Errori di `POST /analyze`

## Esito: il confine di redazione dichiarato non è garantito

`analysisResponse.js` usa:

```js
const message = getErrorMessage(error);

return {
    httpStatus: getErrorStatus(message),
    body: {
        error: message
    }
};
```

Il messaggio dell’eccezione viene restituito direttamente al client.

Lo status viene determinato con ricerca testuale:

```text
message contiene "404" o "not found"
→ 404

message contiene "403" o "blocked"
→ 503

altro
→ 500
```

La ricerca è case-sensitive per:

```text
not found
blocked
```

Il documento afferma però, nei confini, che il router:

```text
non espone dati sensibili o dettagli interni del runtime
```

Questa garanzia non è implementata in modo generale: dipende dal contenuto di ogni eccezione generata a monte.

Gli errori attuali dei fetcher sono in gran parte bounded e statici, ma il response builder accetta e propaga qualsiasi messaggio.

## Finding `MATCH-API-007` — messaggio raw incompatibile con l’invariante di redazione

**Priorità:** alta  
**Tipo:** sicurezza del contratto pubblico

### Opzione consigliata

Implementare un mapping pubblico bounded:

```json
{
  "code": "sofa_event_not_found",
  "error": "Evento SofaScore non trovato."
}
```

```json
{
  "code": "sofa_access_blocked",
  "error": "SofaScore non disponibile."
}
```

```json
{
  "code": "sofa_analysis_failed",
  "error": "Analisi SofaScore non riuscita."
}
```

Il log interno può continuare a registrare un reason code redatto.

### Test richiesti

Aggiungere casi espliciti per:

```text
404
not found
403
blocked
500 generico
errore non-Error
messaggio con path o URL
```

### Alternativa minima

Se non si modifica il codice, il documento deve rimuovere la garanzia assoluta e dichiarare:

```text
l’endpoint propaga attualmente il messaggio dell’eccezione
```

La soluzione preferibile è correggere il codice, non indebolire il confine di sicurezza.

---

# 14. `POST /api/match/snapshot`

## Esito: coerente ma sintetico

La route usa:

```text
HTTP 307
Location: /api/match/analyze
```

Il redirect `307` conserva metodo e body secondo il comportamento HTTP del client.

La descrizione è sufficiente.

### Miglioria consigliata

Aggiungere:

```markdown
La route non costruisce uno snapshot direttamente. Il client deve seguire
il redirect `307`, preservando il body JSON destinato ad `/analyze`.
```

Questa precisazione può essere inclusa in `MATCH-API-008`.

---

# 15. Verifica e test

## Esito: un comando documentato non esiste

La lista contiene:

```text
node sofa/matchHistory/sofaUpdates.test.mjs
```

Il file non esiste al commit analizzato.

Sono invece presenti e verificati diversi test modulari, fra cui:

```text
routes/match/readResponses.test.mjs
routes/match/trackingResponses.test.mjs
routes/match/analysisResponse.test.mjs
routes/match/sourceIdentityStatusResponse.test.mjs
sofa/matchHistory/commitJournal/lifecycle.test.mjs
sofa/matchHistory/recovery/basicRecovery.integration.test.mjs
```

È confermata anche l’assenza dei due percorsi monolitici già dichiarati obsoleti:

```text
sofa/matchHistory/commitJournal.test.mjs
sofa/matchHistory/recovery.test.mjs
```

## Finding `MATCH-API-008` — sezione di verifica non interamente eseguibile

**Priorità:** media  
**Tipo:** comando obsoleto e modularizzazione documentale

### Modifica richiesta

Rimuovere:

```text
node sofa/matchHistory/sofaUpdates.test.mjs
```

Non inventare un test sostitutivo con nome non verificato.

Separare i controlli in due livelli:

### Controlli mirati dalla cartella `backend/src`

```text
node --check routes/match.js
node --check routes/match/readResponses.js
node --check routes/match/trackingResponses.js
node --check routes/match/analysisResponse.js
node --check routes/match/sourceIdentityStatusResponse.js

node routes/match/readResponses.test.mjs
node routes/match/trackingResponses.test.mjs
node routes/match/analysisResponse.test.mjs
node routes/match/sourceIdentityStatusResponse.test.mjs
```

### Gate registrato dalla root

```text
node scripts/validation/run.mjs backend
```

Il profilo backend non sostituisce automaticamente ogni controllo mirato non registrato nel manifest; entrambi i livelli devono essere verificati sullo stato corrente.

### Controlli persistence

Mantenere soltanto i percorsi la cui esistenza viene verificata nella stessa task di riscrittura.

---

# 16. Link e documenti collegati

## Esito: coerente

I collegamenti coprono correttamente:

- architettura;
- lifecycle dati;
- tracking live;
- local context e point-by-point;
- storage;
- recovery;
- Source Identity;
- polling frontend;
- validazione.

La descrizione:

```text
Selezione del contesto per API AI
```

punta al documento generale di selezione del contesto.

### Miglioria

Rinominare l’etichetta in:

```text
Selezione del contesto per AI
```

per allinearla al titolo reale del documento.

Questa modifica editoriale può essere inclusa in `MATCH-API-008`.

---

# 17. Lunghezza, compiti e integrità del contesto

## Valutazione

```text
Righe: 583
Endpoint descritti: 9
Helper route principali: 4
Responsabilità API principali: 3
Sezioni con contratti distinti: sì
Contesto minimo comune a tutte le sezioni: basso
Rischio di perdita del contesto: alto
Suddivisione per sola lunghezza: no
Modularizzazione per responsabilità: sì
```

Il documento rientra nell’eccezione prevista per contratti API con più endpoint, ma supera il semplice caso di più endpoint omogenei.

Contiene almeno tre responsabilità separabili.

## Responsabilità A — letture e integrity

```text
GET /debug-last
GET /:eventId/history
GET /:eventId/json
integrity
404/409
shape history
shape timeline
```

## Responsabilità B — tracking e gate

```text
GET /:eventId/source-identity-status
POST /track
POST /untrack
POST /stop
lifecycle gate
CDP
runtime conflict
cleanup Python
```

## Responsabilità C — analisi

```text
POST /analyze
POST /snapshot
snapshot
localContext
history best effort
error mapping
```

Questi gruppi:

- usano helper differenti;
- hanno payload differenti;
- hanno status differenti;
- coinvolgono test differenti;
- cambiano con task differenti;
- richiedono documenti module owner differenti.

---

# 18. Modularizzazione consigliata

## Struttura proposta

```text
docs/tennis-decision-ui/api/
├── 01-match.md
└── match/
    ├── 01-read-and-integrity.md
    ├── 02-tracking-and-source-identity.md
    └── 03-analysis-and-snapshot.md
```

## `api/01-match.md`

Deve restare come indice e facade del router:

- scopo;
- mount;
- struttura;
- tabella completa degli endpoint;
- superfici deprecate;
- principi comuni;
- link ai tre owner specifici;
- matrice sintetica dei test.

Target consigliato:

```text
circa 100–180 righe
```

## `api/match/01-read-and-integrity.md`

Owner di:

- `debug-last`;
- history;
- timeline;
- shape reali;
- `latest`;
- integrity;
- `pending_commit`;
- 404/409;
- limiti dei loader;
- test read-only.

## `api/match/02-tracking-and-source-identity.md`

Owner di:

- status gate;
- `track`;
- input e validazioni;
- CDP;
- mode;
- runtime conflict;
- `untrack`;
- `stop`;
- mismatch;
- cleanup;
- test tracking.

## `api/match/03-analysis-and-snapshot.md`

Owner di:

- `analyze`;
- `snapshot`;
- shape snapshot;
- shape localContext;
- scrittura best effort;
- mapping errori;
- redazione;
- test analisi.

## Vantaggi

```text
task integrity
→ carica solo read-and-integrity

task tracking/CDP
→ carica solo tracking-and-source-identity

task Sofa analysis
→ carica solo analysis-and-snapshot
```

La facade impedisce di perdere la visione completa del router.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-005
Percorso report: Report documentale/05 - 01-match.md
Documento: docs/tennis-decision-ui/api/01-match.md
Change ID: MATCH-API-001
Change ID: MATCH-API-002
Change ID: MATCH-API-003
Change ID: MATCH-API-004
Change ID: MATCH-API-005
Change ID: MATCH-API-006
Change ID: MATCH-API-007
Change ID: MATCH-API-008
Suddivisione richiesta: sì
Nuovi file proposti:
- docs/tennis-decision-ui/api/match/01-read-and-integrity.md
- docs/tennis-decision-ui/api/match/02-tracking-and-source-identity.md
- docs/tennis-decision-ui/api/match/03-analysis-and-snapshot.md
```

I due file mappa dovranno registrare in futuro:

- riferimento al report;
- otto task con checkbox;
- stato di modularizzazione;
- tre nuovi file proposti.

Non sono stati aggiornati durante questa analisi.

---

# Modifiche proposte

## `MATCH-API-001` — correggere o rimuovere `debug-last`

**Priorità:** alta

**Azione:**

- documentare il comportamento inert corrente;
- non descriverlo come sorgente di ultimo debug;
- applicare in task dedicata la rimozione già approvata da `DEC-009`.

**File potenzialmente coinvolti:**

```text
docs/tennis-decision-ui/api/01-match.md
backend/src/routes/match.js
backend/src/routes/match/readResponses.js
backend/src/routes/match/readResponses.test.mjs
```

---

## `MATCH-API-002` — correggere `integrity.reason`

**Priorità:** alta

**Azione:**

- sostituire `commit_incomplete` con `pending_commit`;
- spiegare la reason di `recovery_failed`;
- aggiornare tutti gli esempi.

**File principale:**

```text
docs/tennis-decision-ui/api/01-match.md
```

---

## `MATCH-API-003` — correggere la shape history

**Priorità:** alta

**Azione:**

- usare `metadata` e `history`;
- rimuovere l’esempio `eventId + updates`;
- mantenere `integrity` come campo additivo.

**File principale:**

```text
docs/tennis-decision-ui/api/01-match.md
```

---

## `MATCH-API-004` — documentare la vista timeline reale

**Priorità:** alta

**Azione:**

- documentare `latest`;
- documentare la normalizzazione dell’array timeline;
- distinguere vista HTTP e documento persistito;
- correggere l’esempio.

**File principale:**

```text
docs/tennis-decision-ui/api/01-match.md
```

---

## `MATCH-API-005` — distinguere missing e read failure

**Priorità:** alta

**Azione:**

- documentare il collasso corrente a `null`;
- decidere se introdurre read result strutturati;
- aggiornare status e consumer se il contratto cambia.

**File potenzialmente coinvolti:**

```text
docs/tennis-decision-ui/api/01-match.md
backend/src/routes/match/readResponses.js
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
frontend/src/hooks/useMatchPolling.js
test collegati
```

---

## `MATCH-API-006` — completare il contratto tracking e untrack

**Priorità:** alta

**Azione:**

- aggiungere i due errori SofaScore;
- documentare il fallback `betfairMode`;
- documentare il no-op Untrack senza eventId;
- decidere se validare mode sconosciute oppure preservare il fallback.

**File potenzialmente coinvolti:**

```text
docs/tennis-decision-ui/api/01-match.md
backend/src/routes/match/trackingResponses.js
backend/src/routes/match/trackingResponses.test.mjs
consumer frontend/launcher
```

---

## `MATCH-API-007` — rendere sicuro l’errore analyze

**Priorità:** alta

**Azione:**

- sostituire il messaggio raw con code e messaggi bounded;
- mantenere i dettagli nei log redatti;
- testare 404, 403, blocked, 500 e messaggi sensibili;
- aggiornare il contratto HTTP.

**File potenzialmente coinvolti:**

```text
docs/tennis-decision-ui/api/01-match.md
backend/src/routes/match/analysisResponse.js
backend/src/routes/match/analysisResponse.test.mjs
```

---

## `MATCH-API-008` — modularizzare e correggere la verifica

**Priorità:** alta

**Azione:**

- mantenere `01-match.md` come facade;
- creare tre owner sotto `api/match/`;
- rimuovere il test path inesistente;
- aggiornare indice, link e controlli;
- aggiungere le precisazioni su `active`, snapshot redirect e label del link AI.

**File coinvolti:**

```text
docs/tennis-decision-ui/api/01-match.md
docs/tennis-decision-ui/api/match/01-read-and-integrity.md
docs/tennis-decision-ui/api/match/02-tracking-and-source-identity.md
docs/tennis-decision-ui/api/match/03-analysis-and-snapshot.md
docs/tennis-decision-ui/index.md
documenti collegati
```

---

# Ordine consigliato di applicazione

```text
1. decidere se rimuovere subito debug-last;
2. decidere fallback o validazione di betfairMode;
3. decidere il nuovo contratto degli errori analyze;
4. decidere se distinguere missing e read failure nel codice;
5. creare la struttura api/match/;
6. riscrivere i tre documenti owner;
7. ridurre 01-match.md a facade;
8. correggere esempi history, timeline e integrity;
9. aggiornare test e sezione Verifica;
10. aggiornare indice e link;
11. eseguire checker e suite backend.
```

Le modifiche puramente documentali:

```text
MATCH-API-002
MATCH-API-003
MATCH-API-004
```

possono essere applicate senza cambiare il runtime.

Le modifiche:

```text
MATCH-API-001
MATCH-API-005
MATCH-API-006
MATCH-API-007
```

possono coinvolgere il codice e richiedono decisioni e test.

La modularizzazione:

```text
MATCH-API-008
```

deve essere coordinata con le altre correzioni per evitare di riscrivere due volte lo stesso contratto.

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
node --check routes/match.js
node --check routes/match/readResponses.js
node --check routes/match/trackingResponses.js
node --check routes/match/analysisResponse.js
node --check routes/match/sourceIdentityStatusResponse.js

node routes/match/readResponses.test.mjs
node routes/match/trackingResponses.test.mjs
node routes/match/analysisResponse.test.mjs
node routes/match/sourceIdentityStatusResponse.test.mjs
```

## Verifiche contrattuali minime

```text
debug-last
→ comportamento documentato o route rimossa

partial_persistence
→ reason pending_commit

history
→ metadata + history + integrity

timeline
→ timeline + latest + integrity

missing/read failure
→ comportamento deciso e testato

track
→ errori Sofa, CDP e conflict verificati

betfairMode
→ fallback o validazione esplicita

untrack senza eventId
→ contratto documentato o route rimossa

analyze
→ errori bounded
→ nessun dettaglio sensibile

link documentali
→ tutti risolti
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
01-match.md: CONTRATTO UTILE MA DA RISCRIVERE E MODULARIZZARE
Endpoint censiti: completi
Coerenza generale: medio-alta
Esempi payload: da correggere
Reason integrity: da correggere
Tracking input: incompleto
Errori analyze: confine di sicurezza non garantito
Verifica: contiene un path inesistente
Riscrittura completa: consigliata
Suddivisione: consigliata per responsabilità
Priorità documentale: alta
```

Il file non deve essere diviso soltanto perché ha 583 righe.

La divisione è giustificata perché contiene tre contratti API distinti:

```text
letture e integrity
tracking e Source Identity
analisi e snapshot
```

La soluzione consigliata mantiene `01-match.md` come facade e sposta i dettagli in tre documenti owner specifici.

Questo riduce il contesto necessario, rende i payload più verificabili e limita il rischio che una modifica al tracking renda obsoleta anche la documentazione delle letture o dell’analisi.
