# API Evidence — latest snapshot

## Endpoint

```txt
GET /api/evidence/:eventId/latest
```

Flusso pubblico:

```txt
eventId validato secondo il limite corrente
→ buildLatestMatchEvidence(eventId)
→ lettura timeline, integrity e conferma tramite adapter interni
→ costruzione snapshot
→ risposta HTTP
```

## Validazione corrente

Il validator condiviso accetta da 1 a 128 caratteri alfanumerici, `_` o `-`. Rifiuta separatori, traversal, caratteri di controllo, spazi interni e altri formati prima dei lookup filesystem. Lo storage timeline applica lo stesso guardrail.

## Status

| Caso                                 | HTTP  |
| ------------------------------------ | ----: |
| Event ID vuoto                       | `400` |
| Nessuna timeline con entry leggibili | `404` |
| Snapshot costruito                   | `200` |
| Eccezione del builder                | `500` |

Evidence non restituisce `409 persistence_integrity`: lo stato aggregato resta nel payload.

## Integrity aggregata

La priorità è `recovery_failed`, poi `partial_persistence`, poi `no_known_partial`.

```json
{
  "status": "partial_persistence",
  "reason": "pending_commit",
  "affectedSources": ["betfair"],
  "sources": {
    "sofa": {"status": "no_known_partial", "reason": null},
    "betfair": {"status": "partial_persistence", "reason": "pending_commit"}
  }
}
```

La reason aggregata è `pending_commit` per `partial_persistence` e `recovery_failed` per lo stato omonimo. Le reason specifiche restano nei blocchi delle fonti.

`persistenceComplete` è vero soltanto con `no_known_partial`. Una persistenza incompleta blocca l’uso cross-source canonico senza alterare freshness tecnica o stato Source Identity effective.

## Semantica `TimelineFound`

`sofaTimelineFound` e `betfairTimelineFound` significano che la timeline caricata contiene almeno una entry leggibile, non che il file esista fisicamente.

| Stato                                | `TimelineFound` |
| ------------------------------------ | --------------- |
| File assente                         | `false`         |
| Read failure o JSON invalido         | `false`         |
| Timeline mancante, non-array o vuota | `false`         |
| Almeno una entry                     | `true`          |

Il loader collassa missing, discovery failure, read failure e JSON invalido a `null`. La route non distingue ancora queste cause e può restituire `404` anche per un problema di lettura.

## Errori e confirmation store

Il `500` usa `code: evidence_build_failed` e non include `error.message` o `details`.

`sources.confirmationStoreStatus` rende osservabile la lettura della conferma senza esporre dettagli:

```txt
ok → store letto o conferma fornita esplicitamente
unavailable → store non leggibile; nessuna conferma applicata
not_applicable → identità automatica non pending
```

`unavailable` resta fail-closed: non abilita l’allineamento manuale.

## Documenti collegati

- [API Evidence](../03-evidence.md)
- [Snapshot Match Evidence](../../modules/evidence/01-match-evidence-snapshot.md)
- [Qualità, flow e allineamento](../../modules/evidence/03-quality-flow-and-alignment.md)
- [Market Reactions](../../modules/evidence/04-market-reactions.md)
