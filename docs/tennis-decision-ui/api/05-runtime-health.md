# API Runtime Health

## Scopo

Questo documento è owner del contratto read-only:

```txt
GET /api/health
```

L'endpoint espone l'identità effimera del processo backend e uno snapshot pubblico dei processi Python registrati. È l'unica authority Health: il precedente `/api/test/health` è stato rimosso.

## Semantica di `ok`

`ok: true` significa soltanto che il processo backend ha risposto alla richiesta HTTP. Non certifica:

- salute o attività del tracking;
- raggiungibilità di SofaScore, Betfair o Chrome CDP;
- correttezza della persistenza;
- disponibilità funzionale dei figli Python;
- completamento di recovery e bootstrap per l'intera durata del processo.

Il consumer Preflight accetta la risposta soltanto quando `ok`, `service: "backend"` e `project: "tennis-decision-ui"` identificano il servizio atteso.

## Risposta

```json
{
  "ok": true,
  "service": "backend",
  "project": "tennis-decision-ui",
  "instanceId": "<uuid>",
  "pid": 1234,
  "startedAt": "<ISO timestamp>",
  "timestamp": "<ISO timestamp>",
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

## Identità backend

| Campo        | Significato                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| `instanceId` | UUID effimero creato al caricamento del modulo server                         |
| `pid`        | PID del processo Node corrente                                                |
| `startedAt`  | Istante di caricamento del modulo, precedente a recovery e listener readiness |
| `timestamp`  | Istante in cui viene costruita la response                                    |

`instanceId` non è un tracking session ID, un token di writer authority, un'identità del launcher o una prova di ownership. `startedAt` non significa che il listener fosse già pronto in quell'istante.

## Snapshot dei processi Python

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

Semantica:

- `active` conta tutte le entry attualmente registrate, comprese quelle in arresto;
- `stopping` conta gli stati `stopping` e `force_stopping`;
- `byRole` conta le entry registrate per ciascuno dei tre ruoli pubblici;
- `pid` può essere `null` prima che il processo figlio renda disponibile un PID;
- `status` descrive il lifecycle del registry, non la salute funzionale dello scraper;
- `entries` espone `executionId`, `role`, `pid`, `status` e `startedAt`.

Lo snapshot prodotto normalmente da `pythonProcessRegistry.snapshot()` costruisce esplicitamente questi campi e non include URL, `cdpUrl`, profilo browser, argomenti, runtime identity, owner token, stdout, stderr o command line.

## Allow-list della response

`backend/src/routes/healthResponse.js` ricostruisce positivamente la shape HTTP. Accetta soltanto i tre ruoli pubblici e i cinque campi delle entry, normalizza `pid`, ignora entry non rappresentabili e ricalcola i contatori dalle entry filtrate. Campi sconosciuti o privati non attraversano il confine anche se presenti nello snapshot iniettato.

## Cache e confine locale

La response imposta `Cache-Control: no-store`, perché timestamp, PID e registry sono uno snapshot effimero.

`startServer()` esegue il bind predefinito su `127.0.0.1`. `localHttpBoundary` accetta Host `127.0.0.1`, `localhost` o `::1`; accetta gli stessi host per Origin HTTP e consente richieste locali senza Origin, usate da launcher e diagnostica. Host e Origin remoti ricevono HTTP `403` con reason code bounded. `IMPL-017` è quindi applicato all'intero backend, prima dei router.

## Effetti esclusi

`GET /api/health` non avvia o termina processi, non esegue tracking o recovery e non modifica timeline, history o authority. Stop, mismatch Source Identity e shutdown possiedono i percorsi di terminazione.

## Verifica corrente e mancante

Dalla cartella `backend/src`:

```txt
node server.test.mjs
node runtime/pythonProcessRegistry.test.mjs
```

La copertura verifica response builder con campi privati iniettati, `pid: null`, stati lifecycle, `no-store`, Host e Origin positivi e negativi, bind effettivo su loopback e riconoscimento frontend di `service` e `project`. La suite completa del launcher verifica inoltre avvio, probe, riuso e fallback delle porte.

## Documenti collegati

- [API Preflight](./04-preflight.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Confini del sistema](../architecture/01-system-boundaries.md)
- [Tracking live SofaScore](../modules/sofa/01-live-tracking.md)
- [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
