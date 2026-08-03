# API Runtime Health

## Scopo

Questo documento è owner del contratto:

```txt
GET /api/health
```

L’endpoint descrive identità del backend e snapshot pubblico dei figli Python registrati. È read-only.

## Risposta

```json
{
  "ok": true,
  "service": "backend",
  "project": "tennis-decision-ui",
  "instanceId": "<instance-id>",
  "pid": 1234,
  "startedAt": "<iso-date>",
  "timestamp": "<iso-date>",
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

`instanceId` e `pid` identificano l’istanza backend corrente; `startedAt` indica l’avvio e `timestamp` l’istante dello snapshot. Questi campi non attribuiscono ownership al chiamante.

## Snapshot processi Python

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
    {
      executionId,
      role,
      pid,
      status,
      startedAt
    }
  ]
}
```

`active` conta le entry registrate. `stopping` conta gli stati `stopping` e `force_stopping`. `byRole` contiene sempre i tre ruoli pubblici.

Le entry espongono soltanto:

```txt
executionId
role
pid
status
startedAt
```

## Dati esclusi

La risposta non espone:

```txt
URL
cdpUrl
profileDir
args
runtimeIdentity
ownerToken
stdout
stderr
command line
segreti
```

## Confini

`GET /api/health`:

```txt
non avvia processi
non termina processi
non esegue tracking
non esegue recovery
non modifica persistenza
```

Lo snapshot è diagnostico. La terminazione resta nei percorsi Stop, mismatch Source Identity e shutdown backend.

## Verifica

```txt
GET /api/health
→ HTTP 200
→ identità backend presente
→ pythonProcesses con shape pubblica
→ nessun campo privato
```

## Documenti collegati

* [Runtime locale](../operations/01-local-runtime.md)
* [Confini del sistema](../architecture/01-system-boundaries.md)
* [Tracking live SofaScore](../modules/sofa/01-live-tracking.md)
* [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
