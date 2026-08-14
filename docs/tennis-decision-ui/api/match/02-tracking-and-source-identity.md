# API Match — tracking e Source Identity

Questo documento definisce il contratto HTTP delle superfici del router Match dedicate all'avvio e all'arresto del tracking live e alla lettura dello stato del Source Identity Gate.

Non possiede le letture history/timeline e la relativa integrity, né le superfici di analysis/snapshot.

## Endpoint

| Metodo | Endpoint                                     | Effetto                                                                                         |
| ------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POST` | `/api/match/track`                           | Valida il contesto, avvia il tracking e crea la sessione Source Identity                        |
| `POST` | `/api/match/untrack`                         | Rimuove dal tracking l'`eventId` richiesto e il relativo gate                                   |
| `POST` | `/api/match/stop`                            | Ferma globalmente il tracking live e attende il cleanup dei processi Python di scope `tracking` |
| `GET`  | `/api/match/:eventId/source-identity-status` | Restituisce lo stato pubblico e sanitizzato del Source Identity Gate                            |

## Track

```txt
POST /api/match/track
```

### Payload e normalizzazione

Il payload può contenere:

```txt
sofaUrl
betfairUrl
betfairGraphUrls
chromeProfilePath
betfairMode
cdpUrl
```

| Campo               | Contratto corrente                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `sofaUrl`           | Obbligatorio. Deve permettere a `extractEventId(...)` di ricavare un `eventId`.                  |
| `betfairUrl`        | Facoltativo. Se vuoto è accettato; se presente deve superare la validazione Betfair URL.         |
| `betfairGraphUrls`  | Facoltativo. Viene inoltrato al tracker; se assente viene usata una stringa vuota.               |
| `chromeProfilePath` | Facoltativo. Viene convertito in stringa e sottoposto a `trim()`.                                |
| `betfairMode`       | Diventa `cdp` soltanto quando vale esattamente `"cdp"`; qualsiasi altro valore usa `persistent`. |
| `cdpUrl`            | È validata soltanto in mode `cdp`; in `persistent` viene inoltrata come stringa vuota.           |

Una `betfairUrl` non vuota è accettata soltanto se:

- è una stringa URL HTTPS valida;
- usa uno degli host `betfair.it`, `www.betfair.it`, `betfair.com`, `www.betfair.com`;
- non contiene username o password;
- non usa una porta esplicita.

Il router non richiede un Event ID Betfair nella URL usata da `track`.

In mode `cdp`, `cdpUrl` deve essere una base URL HTTP locale:

```txt
127.0.0.1
localhost
::1
```

con porta esplicita compresa fra `1` e `65535`, senza credenziali, query, fragment o path aggiuntivo. Gli slash finali vengono rimossi dalla forma normalizzata.

### Risposte e validazioni

Le validazioni avvengono prima dell'avvio del tracker. Il controllo di runtime conflict viene eseguito soltanto quando è presente una `betfairUrl` valida e non vuota.

| Caso                                     | HTTP  | Body / `code`                                                                        |
| ---------------------------------------- | ----: | ------------------------------------------------------------------------------------ |
| `sofaUrl` assente                        | `400` | `{ "error": "URL SofaScore mancante" }`                                              |
| Event ID SofaScore non ricavabile        | `400` | `{ "error": "URL non valido o eventId non trovato" }`                                |
| `betfairUrl` presente ma non valida      | `400` | `{ "code": "betfair_url_invalid", "error": "Invalid Betfair URL" }`                  |
| Mode `cdp` con `cdpUrl` assente o vuota  | `400` | `cdp_url_required`                                                                   |
| Mode `cdp` con `cdpUrl` non valida       | `400` | `cdp_url_invalid`                                                                    |
| Runtime Betfair incompatibile già attivo | `409` | `scraper_runtime_conflict`                                                           |
| Il tracker rifiuta lo Start              | `409` | `tracking_start_rejected`                                                            |
| Start accettato                          | `200` | `{ "ok": true, "eventId": "<eventId>", "trackingSessionId": "<trackingSessionId>" }` |

Body CDP mancante:

```json
{
  "code": "cdp_url_required",
  "error": "CDP non disponibile. Seleziona Profilo Persistent o attendi Chrome."
}
```

Body CDP non valida:

```json
{
  "code": "cdp_url_invalid",
  "error": "URL CDP non valido."
}
```

Body runtime conflict:

```json
{
  "code": "scraper_runtime_conflict",
  "error": "An incompatible Betfair scraper is already active."
}
```

Se il tracker rifiuta lo Start:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "code": "tracking_start_rejected"
}
```

Il rifiuto del tracker è distinto dagli errori di validazione. Nel comportamento corrente `trackMatch(...)` restituisce `null` quando è attiva la terminal tracker barrier; in questo caso la API non dichiara più lo Start come riuscito.

### Sessione di tracking e gate

Per ogni Start effettivamente accettato il tracker crea un nuovo identificatore:

```txt
tracking-<n>
```

La risposta `POST /track` espone questo valore come `trackingSessionId`.

Prima di creare la nuova sessione Source Identity, il tracker rimuove i gate precedenti. Di conseguenza un nuovo Start rende non più leggibile un eventuale gate terminale appartenente alla sessione precedente.

Il gate nasce:

```txt
betfairUrl presente
→ collecting

betfairUrl assente
→ not-applicable
```

L'avvio del tracking esegue inoltre un primo aggiornamento SofaScore immediato; gli aggiornamenti Betfair vengono schedulati soltanto quando è presente `betfairUrl`.

## Untrack

```txt
POST /api/match/untrack
```

La route inoltra `payload.eventId` a `untrackMatch(...)` e restituisce sempre:

```json
{
  "ok": true
}
```

con `HTTP 200`.

Quando `eventId` è presente, il tracker:

- rimuove quell'evento da `trackedMatches`;
- rimuove il Source Identity Gate relativo;
- arresta lo scheduler se non restano match tracciati.

Quando `eventId` è assente o falsy, `untrackMatch(...)` non esegue operazioni. La route non applica una validazione aggiuntiva del payload e continua comunque a restituire `HTTP 200 {"ok":true}`.

## Stop globale

```txt
POST /api/match/stop
```

Lo Stop è globale. Il body è facoltativo:

```json
{}
```

oppure:

```json
{
  "eventId": "<eventId>"
}
```

`eventId`, quando presente, è informativo e viene riportato nella risposta; non limita lo scope del cleanup.

Il flusso pubblico è:

```txt
stopAllMatchTrackers()
→ tracker, scheduler e gate ordinari rimossi

terminatePythonProcesses("tracking")
→ generation tracking invalidata
→ selezione dei ruoli sofa_tracking e betfair_tracking
→ richiesta di terminazione graceful
→ eventuale force kill dopo il timeout
→ attesa bounded della completion fisica
```

Il ruolo `betfair_login` non appartiene allo scope `tracking` e non viene terminato da questa route.

Risposta riuscita tipica:

```json
{
  "ok": true,
  "eventId": "<eventId|null>",
  "stopped": true,
  "scope": "all-live-tracking",
  "pythonCleanup": {
    "ok": true,
    "scope": "tracking",
    "requested": 0,
    "graceful": 0,
    "forceKilled": 0,
    "alreadyExited": 0,
    "remaining": 0,
    "errors": []
  }
}
```

Semantica dei campi principali:

| Campo | Significato                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------- |
| `stopped`                 | `true` se `stopAllMatchTrackers()` si completa senza eccezioni; `false` se il cleanup tracker fallisce. |
| `pythonCleanup.ok`        | Esito del cleanup dei processi Python di scope `tracking`.                                              |
| `pythonCleanup.remaining` | Numero di processi selezionati la cui uscita non è stata confermata entro i limiti previsti.            |
| `ok`                      | `true` soltanto se il cleanup tracker è riuscito e `pythonCleanup.ok === true` con `remaining === 0`.   |
| `scope`                   | Vale `all-live-tracking`.                                                                               |

La route restituisce `HTTP 200` anche quando il cleanup è stato gestito ma non completato con successo. In quel caso il fallimento resta osservabile nel body, per esempio con:

```txt
ok: false
stopped: false
pythonCleanup.ok: false
```

Se la terminazione Python genera un'eccezione, il router restituisce un `pythonCleanup` bounded con `ok:false` ed errore `cleanup_failed`.

Chiamare Stop quando non esistono tracker o processi di tracking attivi è valido: il cleanup può restituire contatori a zero e `ok:true`.

Lo Stop non termina backend, frontend o Chrome/CDP e non opera sulle letture persistite, sui documenti canonici o sul journal.

### Mismatch e Stop ordinario

Il percorso `mismatch` è distinto dallo Stop ordinario.

Quando il gate entra in `mismatch`, il tracker:

```txt
stopAllMatchTrackers({ preserveGateEventId: eventId })
→ preserva il gate mismatch dell'evento
→ invalida la generation tracking
→ avvia il cleanup dei scraper/processi di tracking
```

Questo permette a `GET /api/match/:eventId/source-identity-status` di continuare a esporre lo stato terminale `mismatch`.

Uno Stop globale successivo, un Untrack esplicito dello stesso evento o un nuovo Start rimuovono invece il gate preservato.

## Source Identity status

```txt
GET /api/match/:eventId/source-identity-status
```

### Status HTTP

| Condizione                                        | HTTP  | Risposta                                                                                                          |
| ------------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------- |
| `eventId` assente, vuoto o composto solo da spazi | `400` | `{ "ok": false, "error": "Missing or invalid eventId" }`                                                          |
| Nessuna sessione gate leggibile                   | `404` | `{ "ok": false, "eventId": "<eventId>", "error": "No active source identity gate session found for this event" }` |
| Gate presente                                     | `200` | Payload status sicuro                                                                                             |

Risposta riuscita tipica:

```json
{
  "ok": true,
  "eventId": "<eventId>",
  "active": true,
  "phase": "pending",
  "persistence": "buffering",
  "sourceIdentity": {
    "status": "pending",
    "sofaPlayers": [],
    "betfairRunners": [],
    "reasons": []
  },
  "updatedAt": "<iso-date>"
}
```

Il payload pubblico contiene soltanto:

```txt
ok
eventId
active
phase
persistence
sourceIdentity
updatedAt
error        // solo quando presente
```

Il `trackingSessionId` mantenuto internamente dal gate e restituito da `POST /track` non viene esposto da questo endpoint.

Quando `sourceIdentity` è presente, la risposta pubblica ne conserva soltanto:

```txt
status
sofaPlayers
betfairRunners
reasons
```

Il payload non espone le strutture normalizzate interne del gate, URL, token, cookie o percorsi locali.

### Fasi pubbliche

| `phase`          | `active` | `persistence` | Significato pubblico                                                                                                                                 |
| ---------------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collecting`     | `true`   | `buffering`   | Il gate con Betfair attiva non dispone ancora di entrambi i campioni validi necessari alla valutazione.                                              |
| `pending`        | `true`   | `buffering`   | La sessione non è ammessa a `recording`; può rappresentare identità non ancora allineata oppure un bootstrap della generazione corrente già fallito. |
| `recording`      | `true`   | `canonical`   | L'identità effettiva è allineata e il bootstrap della generazione corrente è riuscito.                                                               |
| `mismatch`       | `false`  | `blocked`     | L'identità effettiva è in mismatch; il tracking viene fermato e il gate può essere preservato per la lettura dello status.                           |
| `not-applicable` | `true`   | `canonical`   | La sessione non ha una Betfair URL e il confronto cross-source non è applicabile.                                                                    |

`sourceIdentity` è `null` durante `collecting` e `not-applicable`.

La fase non è strettamente monotona: una sessione in `recording` può tornare a `pending` se una valutazione successiva non mantiene lo stato allineato.

Se l'identità risulta allineata ma il bootstrap di persistenza restituisce un esito diverso da `ok:true`, il gate resta in `pending` e può esporre:

```json
{
  "error": "Bootstrap persistence failed"
}
```

`stopped` è una fase interna di cleanup. Nei percorsi ordinari il gate viene marcato come stopped e poi rimosso, per cui lo status successivo restituisce normalmente `404`.

### `persistence` del gate e `integrity`

Il campo `persistence` di questo endpoint descrive esclusivamente lo stato live del Source Identity Gate:

```txt
buffering
canonical
blocked
```

Non equivale al campo `integrity` delle letture Match. Le superfici history/timeline e il relativo stato journal appartengono all'owner separato delle letture e integrity.

## Confini

Questo documento non possiede:

- `GET /api/match/:eventId/history`;
- `GET /api/match/:eventId/json`;
- l'integrity read-only derivata dal journal;
- `POST /api/match/analyze`;
- `POST /api/match/snapshot`;
- l'implementazione interna della costruzione dell'identità o delle conferme Source Identity.

Può descrivere l'interazione pubblica del tracking con il gate senza duplicare l'implementazione interna degli owner collegati.

## Documenti collegati

- [API Match](../01-match.md)
- [Tracking live](../../modules/sofa/01-live-tracking.md)
- [Source Identity](../../modules/evidence/02-source-identity.md)
- [Runtime locale](../../operations/01-local-runtime.md)

## Verifica

Dalla cartella `backend/src`:

```txt
node --check routes/match.js
node --check routes/match/trackingResponses.js
node --check routes/match/sourceIdentityStatusResponse.js
node --check sofa/matchTracker.js

node routes/match/trackingResponses.test.mjs
node routes/match/sourceIdentityStatusResponse.test.mjs
node sofa/matchTracker.test.mjs
```

Verificare almeno:

```txt
Track senza sofaUrl
→ HTTP 400
→ nessun avvio tracker

Track con Betfair URL non valida
→ HTTP 400
→ code betfair_url_invalid

Track cdp senza cdpUrl valida
→ HTTP 400
→ cdp_url_required oppure cdp_url_invalid

Runtime Betfair incompatibile
→ HTTP 409
→ code scraper_runtime_conflict

trackMatch rifiuta lo Start
→ HTTP 409
→ ok false
→ code tracking_start_rejected

Start accettato
→ HTTP 200
→ eventId presente
→ trackingSessionId presente

Untrack con eventId
→ HTTP 200
→ eventId inoltrato a untrackMatch

Stop riuscito
→ HTTP 200
→ stopped true
→ pythonCleanup awaited
→ ok true soltanto con cleanup fisico completo

Stop con cleanup fallito
→ HTTP 200
→ errore bounded
→ ok false

Source Identity senza gate
→ HTTP 404

Gate collecting
→ active true
→ persistence buffering

Gate pending
→ active true
→ persistence buffering

Gate mismatch
→ active false
→ persistence blocked

bootstrap fallito
→ phase pending
→ error "Bootstrap persistence failed"
```
