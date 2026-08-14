# API Runtime Health

## Scopo

Questo documento è owner del contratto read-only:

```txt
GET /api/health
```

L'endpoint espone l'identità del backend corrente, due identità locali derivate dai percorsi canonici di repository e storage e uno snapshot pubblico dei processi Python registrati.

`GET /api/health` è l'authority Health del backend. Il precedente `/api/test/health` non è presente nel router `/api/test` corrente.

## Semantica di `ok`

`ok: true` indica che la richiesta ha raggiunto con successo l'endpoint Health del backend. Non certifica:

- salute o attività del tracking;
- raggiungibilità di SofaScore, Betfair o Chrome CDP;
- correttezza della persistenza;
- disponibilità funzionale dei processi Python registrati;
- uno stato separato o corrente di recovery, bootstrap o writer authority.

Nel percorso standard `startServer()`, l'acquisizione della writer authority e la recovery precedono l'apertura del listener; questa è una precondizione del bootstrap del server, non uno stato esposto dalla response Health.

Il consumer Preflight considera riconosciuto il backend soltanto quando la response contiene contemporaneamente:

```txt
ok === true
service === "backend"
project === "tennis-decision-ui"
```

`repositoryIdentity` e `storageIdentity` non partecipano al riconoscimento frontend eseguito da `usePreflightChecks.js`.

## Risposta

Per una richiesta accettata dal confine HTTP locale, la response ha questa shape:

```json
{
  "ok": true,
  "service": "backend",
  "project": "tennis-decision-ui",
  "instanceId": "<uuid>",
  "pid": 1234,
  "startedAt": "<ISO timestamp>",
  "timestamp": "<ISO timestamp>",
  "repositoryIdentity": "sha256:<hex>",
  "storageIdentity": "sha256:<hex>",
  "pythonProcesses": {
    "active": 0,
    "stopping": 0,
    "byRole": {
      "sofa_tracking": 0,
      "betfair_tracking": 0,
      "betfair_login": 0
    },
    "entries": []
  }
}
```

## Identità backend e timestamp

| Campo                | Significato                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `service`            | Valore costante `backend`                                               |
| `project`            | Valore costante `tennis-decision-ui`                                    |
| `instanceId`         | UUID effimero creato al caricamento del modulo server                   |
| `pid`                | PID del processo Node corrente                                          |
| `startedAt`          | Istante di caricamento del modulo server                                |
| `timestamp`          | Istante in cui viene costruita la response                              |
| `repositoryIdentity` | SHA-256 del percorso canonico normalizzato della root repository locale |
| `storageIdentity`    | SHA-256 del percorso canonico normalizzato di `backend/match_history`   |

`instanceId` non è un tracking session ID, un token di writer authority o un'identità del launcher.

`startedAt` viene valorizzato al caricamento del modulo e può quindi precedere acquisizione della writer authority, recovery e readiness del listener.

`repositoryIdentity` e `storageIdentity` sono identità di percorso locale: non sono hash dei contenuti, commit Git, token di ownership o prove dello stato funzionale di repository e persistenza. Il percorso canonico non viene esposto direttamente nella response.

## Snapshot dei processi Python

La parte pubblica ha questa forma:

```js
pythonProcesses = {
  active,
  stopping,
  byRole: {
    sofa_tracking,
    betfair_tracking,
    betfair_login
  },
  entries: [
    { executionId, role, pid, status, startedAt }
  ]
}
```

I tre ruoli pubblici sono:

```txt
sofa_tracking
betfair_tracking
betfair_login
```

Semantica:

- `active` è il numero delle entry pubbliche accettate dalla normalizzazione, incluse quelle in arresto;
- `stopping` conta le entry il cui `status` è `stopping` o `force_stopping`;
- `byRole` contiene sempre i tre ruoli pubblici e conta le entry accettate per ruolo;
- `pid` è un intero positivo quando disponibile, altrimenti viene esposto come `null`;
- `status` descrive il lifecycle del registry, non la salute funzionale dello scraper;
- `startedAt` è il timestamp associato alla registrazione del processo Python;
- `entries` espone soltanto `executionId`, `role`, `pid`, `status` e `startedAt`.

Il registry usa stati di lifecycle come `spawn_pending`, `running`, `stopping` e `force_stopping`. Le entry vengono rimosse dal registry quando la loro uscita o chiusura viene completata; lo snapshot Health non è quindi uno storico dei processi terminati.

## Allow-list e dati esclusi

`backend/src/routes/healthResponse.js` ricostruisce positivamente la shape pubblica di `pythonProcesses`.

Per ogni entry:

- il `role` deve appartenere ai tre ruoli pubblici;
- `executionId` e `status` devono essere token rappresentabili dal contratto pubblico;
- `pid` viene normalizzato a intero positivo oppure `null`;
- `startedAt` viene mantenuto soltanto se è una stringa, altrimenti diventa `null`;
- entry non rappresentabili vengono ignorate.

Dopo il filtro, `active`, `stopping` e `byRole` vengono ricalcolati dalle entry pubbliche; i contatori eventualmente presenti nello snapshot sorgente non sono copiati come authority.

Campi sconosciuti o privati non attraversano il confine. Tra gli esempi esclusi rientrano `ownerToken`, `cdpUrl`, `profileDir`, `args`, `metadata`, `generation`, riferimenti al processo, stdout, stderr e command line.

## Cache e confine locale

La response di `GET /api/health` imposta:

```txt
Cache-Control: no-store
```

perché PID, timestamp, identità di processo e registry rappresentano uno snapshot runtime.

`startServer()` usa per default:

```txt
127.0.0.1
```

come host di bind.

Prima dei router, `localHttpBoundary` applica il confine HTTP locale all'intero backend:

- Host accettati: `127.0.0.1`, `localhost`, `::1`;
- una richiesta senza `Origin` è accettata quando l'Host è locale;
- un `Origin` presente deve usare protocollo `http:` e uno degli host locali;
- Origin con credenziali, protocollo diverso da HTTP, host remoto o sintassi non valida viene rifiutato;
- Host non locale o non valido riceve HTTP `403` con `code: "host_not_allowed"`;
- Origin non consentito riceve HTTP `403` con `code: "origin_not_allowed"`.

Il confine locale viene applicato prima dell'handler Health.

## Effetti esclusi

Una chiamata a `GET /api/health`:

```txt
non avvia processi
non termina processi
non avvia tracking
non esegue recovery
non modifica timeline o history
non acquisisce o rilascia writer authority
```

L'endpoint legge lo snapshot corrente del registry e costruisce una response pubblica normalizzata.

## Verifica

Test direttamente associati al contratto:

Dalla cartella `backend/src`:

```txt
node routes/healthResponse.test.mjs
node runtime/localHttpBoundary.test.mjs
node runtime/pythonProcessRegistry.test.mjs
node server.test.mjs
```

Dalla cartella `frontend/src`:

```txt
node hooks/usePreflightChecks.test.mjs
```

La copertura consultata verifica:

- allow-list delle entry Python e rimozione di campi privati;
- ricalcolo di `active`, `stopping` e `byRole`;
- `pid: null`;
- lifecycle e rimozione delle entry dal registry;
- `Cache-Control: no-store`;
- rifiuto di Host e Origin non locali;
- accettazione dei principali Host e Origin locali;
- bind predefinito su `127.0.0.1`;
- riconoscimento Preflight tramite `ok`, `service` e `project`;
- ordine di bootstrap con recovery prima del listener.

Nei test direttamente associati consultati non è presente un'asserzione specifica sui valori di `repositoryIdentity` e `storageIdentity`; la loro presenza nella response corrente deriva dal wiring di `server.js` e da `buildHealthResponse()`.

## Documenti collegati

- [API Preflight](./04-preflight.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Confini del sistema](../architecture/01-system-boundaries.md)
- [Tracking live SofaScore](../modules/sofa/01-live-tracking.md)
- [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
