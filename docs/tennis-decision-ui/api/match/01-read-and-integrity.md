# API Match — letture e integrity

## Endpoint

```txt
GET /api/match/debug-last
GET /api/match/:eventId/history
GET /api/match/:eventId/json
```

Le letture history e timeline non avviano tracker o scraper, non scrivono journal e non eseguono recovery.

## `debug-last`

La superficie è deprecata e non dispone di un producer corrente: `lastDebugData` resta `null`. Il comportamento stabile è `HTTP 200`:

```json
{"error":"No data captured yet"}
```

Non interpretare questa route come sorgente diagnostica disponibile.

## Contratto `integrity`

Le risposte leggibili ricevono un campo top-level:

```json
{
  "status": "no_known_partial | partial_persistence | recovery_failed",
  "reason": null,
  "source": "sofa",
  "commitId": null,
  "affectedDocuments": []
}
```

Per `partial_persistence`, la reason prodotta dal journal corrente è `pending_commit`. Per `recovery_failed`, la reason è quella persistita dal recovery, con fallback `recovery_failed`; non è documentata come enum chiusa.

## History

La route conserva il documento history leggibile e aggiunge `integrity` a un clone:

```json
{
  "metadata": {
    "eventId": "<eventId>",
    "date": "<date>",
    "tournament": "<tournament>",
    "players": {"home": "Player A", "away": "Player B"},
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

## Timeline HTTP

`loadTimeline` normalizza `timeline` a un array e aggiunge `latest`, derivato dall’ultima entry. Il response builder aggiunge poi `integrity`. `latest` non viene scritto nel documento persistito dalla route.

```json
{
  "metadata": {"eventId": "<eventId>", "source": "sofa", "players": {}},
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

## Documento non leggibile

Nel codice corrente missing, discovery failure, read failure e JSON invalido vengono collassati a `null` prima della risposta HTTP. La route non espone cause distinte:

```txt
null + no_known_partial → HTTP 404
null + partial_persistence o recovery_failed → HTTP 409
```

Il `409` usa `error: "persistence_integrity"` e include `integrity`. Distinguere le cause richiederebbe una futura modifica di codice e contratto.

## Verifica storage

```txt
node sofa/matchHistory/commitJournal/lifecycle.test.mjs
node sofa/matchHistory/commitJournal/integrityStatus.test.mjs
node sofa/matchHistory/commitJournal/residualRecovery.test.mjs
node sofa/matchHistory/recovery/basicRecovery.integration.test.mjs
node sofa/matchHistory/recovery/completedTargetVerification.integration.test.mjs
node sofa/matchHistory/sofaUpdates/commitLifecycle.test.mjs
```

## Documenti collegati

- [API Match](../01-match.md)
- [Timeline e history](../../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../../modules/storage/02-commit-journal-and-recovery.md)
