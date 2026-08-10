# API Betfair — letture, integrity e health

## Endpoint

```txt
GET /api/betfair/:eventId/latest
GET /api/betfair/:eventId/json
```

`/json` è una lettura locale della timeline e del journal. `/latest` non avvia browser o scraper, ma con `mode=cdp` e `cdpUrl` valorizzata esegue un probe HTTP bounded verso `<cdpUrl>/json/version`.

## Validazione del probe CDP

`cdpStatus.js` applica `classifyCdpBaseUrl` prima del fetch. Accetta soltanto HTTP, host loopback, porta esplicita, path `/` e nessuna credenziale, query o fragment. Input assente o invalido non produce traffico di rete. Solo un valore valido viene interrogato tramite `<cdpUrl>/json/version`; timeout ed errori restituiscono stato non disponibile senza propagare dettagli.

## Integrity

Valori pubblici:

```txt
status: no_known_partial | partial_persistence | recovery_failed
source: betfair | null
affectedDocuments: history | timeline
```

Per `partial_persistence`, `reason` vale `pending_commit`. Per `recovery_failed`, usa la reason persistita dal recovery con possibile fallback `recovery_failed`.

## Vista HTTP `/json`

La route usa la vista di `loadTimeline`, che normalizza `timeline` a un array e aggiunge `latest` dall’ultima entry. Il response builder clona la vista e aggiunge `integrity`; il documento persistito non viene modificato.

```json
{
  "metadata": {"eventId": "<eventId>", "source": "betfair"},
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

## Timeline non leggibile

Missing, discovery failure, read failure e JSON invalido vengono collassati dal loader a `null`:

```txt
null + no_known_partial → HTTP 404
null + partial_persistence o recovery_failed → HTTP 409 persistence_integrity
```

La route non distingue oggi queste cause. Uno stato strutturato richiederebbe una modifica coordinata del codice e del contratto.

## `/latest`

La risposta comprende `ok`, `eventId`, `latest`, `latestTimestamp`, `health`, `moneyFlowHistory`, `metadata` e `integrity`.

| Timeline leggibile | Tick valido | HTTP          | `ok`    | `latest`    |
| ------------------ | ----------- | ------------: | ------- | ----------- |
| No                 | —           | `404` o `409` | `false` | assente     |
| Sì                 | No          | `200`         | `false` | `null`      |
| Sì                 | Sì          | `200`         | `true`  | tick valido |

`latestTimestamp` deriva dal tick canonico più recente. `metadata.updatedAt` usa il valore persistito quando disponibile, ma in sua assenza può rappresentare l’ora di costruzione della risposta: non sono timestamp equivalenti.

Health può combinare timeline, stato CDP e runtime effimero. Non modifica automaticamente `integrity`, e il runtime completo non viene esposto top-level.

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Timeline e history](../../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../../modules/storage/02-commit-journal-and-recovery.md)
- [Lifecycle scraper Betfair](../../modules/betfair/01-scraper-lifecycle.md)
