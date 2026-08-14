# API Evidence — latest snapshot

## Scopo

Questo documento definisce il contratto HTTP osservabile di:

```txt
GET /api/evidence/:eventId/latest
```

È l’owner del wrapper pubblico della risposta latest Evidence: validazione applicata all’endpoint, status HTTP, shape top-level `ok/eventId/latest/sources/integrity`, semantica dei flag esposti, stato aggregato di persistence integrity, stato osservabile del confirmation store e confini di redazione.

Non è l’owner degli algoritmi che costruiscono lo snapshot Evidence, calcolano Source Identity, data quality/alignment o Market Reactions. Tali dettagli restano nei documenti di modulo collegati.

Il contratto POST/DELETE di conferma e revoca Source Identity appartiene a `02-source-identity-confirmation.md`.

## Endpoint

```txt
GET /api/evidence/:eventId/latest
```

Flusso pubblico:

```txt
eventId normalizzato e validato
→ buildLatestMatchEvidence(eventId)
→ lettura delle timeline persistite SofaScore e Betfair
→ lettura read-only della persistence integrity per entrambe le fonti
→ eventuale lookup read-only della conferma Source Identity
→ costruzione dello snapshot
→ risposta HTTP
```

La route è read-only rispetto a timeline, history, journal e confirmation store: non crea tick, non esegue recovery e non persiste conferme.

## Validazione `eventId`

La route applica la validazione comune `eventId` definita dalla facade API Evidence. La validazione termina prima della costruzione dello snapshot.

Risposta per `eventId` assente o non valido:

```json
{
  "ok": false,
  "error": "Missing or invalid eventId"
}
```

Status: `400`.

Le regole complete del guardrail comune restano di competenza di [API Evidence](../03-evidence.md); questo documento ne registra soltanto l’effetto osservabile sul GET latest.

## Status HTTP

| Condizione                                                                     | HTTP  | Contratto                                                            |
| ------------------------------------------------------------------------------ | ----: | -------------------------------------------------------------------- |
| `eventId` assente o non valido                                                 | `400` | errore di validazione comune                                         |
| Nessuna delle due fonti fornisce almeno un tick canonico accettato dal builder | `404` | `No timeline data found for this event`, con `reasons` e `integrity` |
| Snapshot costruito da almeno una fonte disponibile                             | `200` | wrapper `ok/eventId/latest/sources/integrity`                        |
| Eccezione durante `buildLatestMatchEvidence(eventId)`                          | `500` | errore bounded `evidence_build_failed`                               |

Il GET latest non restituisce `409 persistence_integrity`. Gli stati `partial_persistence` e `recovery_failed` restano osservabili nel blocco `integrity` del payload.

## Risposta `200`

Shape top-level:

```json
{
  "ok": true,
  "eventId": "<eventId>",
  "latest": {},
  "sources": {
    "sofaTimelineFound": true,
    "betfairTimelineFound": true,
    "confirmationStoreStatus": "not_applicable",
    "confirmationStoreReason": null
  },
  "integrity": {
    "status": "no_known_partial",
    "reason": null,
    "affectedSources": [],
    "sources": {
      "sofa": {
        "status": "no_known_partial",
        "reason": null,
        "source": "sofa",
        "commitId": null,
        "affectedDocuments": []
      },
      "betfair": {
        "status": "no_known_partial",
        "reason": null,
        "source": "betfair",
        "commitId": null,
        "affectedDocuments": []
      }
    }
  }
}
```

`latest` contiene lo snapshot Match Evidence. La sua struttura algoritmica interna appartiene a [Snapshot Match Evidence](../../modules/evidence/01-match-evidence-snapshot.md).

Un solo source disponibile è sufficiente perché il builder possa restituire un risultato non `missing`; in quel caso la route può rispondere `200` con il relativo flag `*TimelineFound` a `false`.

## `sources`

### `sofaTimelineFound`

`sofaTimelineFound` è `true` soltanto quando la timeline caricata contiene almeno una entry canonica SofaScore accettata dal filtro Evidence:

```txt
entry
→ entry.data presente
→ entry.data.source = sofa
```

Non significa che esista semplicemente un file SofaScore sul filesystem.

### `betfairTimelineFound`

`betfairTimelineFound` è `true` soltanto quando esiste almeno una entry Betfair accettata dal filtro canonico usato dal builder. L’entry deve avere:

```txt
entry.data.source = betfair
seq finito
runners array
ogni runner presente e object non-array
```

Non significa che esista semplicemente un file Betfair né che il documento JSON sia soltanto leggibile.

### `confirmationStoreStatus`

Il lookup del confirmation store viene eseguito soltanto quando la Source Identity automatica è `pending`.

| Valore           | Significato osservabile                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `not_applicable` | Source Identity automatica non `pending`; il confirmation store non è necessario |
| `ok`             | lookup completato senza failure; può non esistere una conferma applicabile       |
| `unavailable`    | lettura/lookup non utilizzabile; nessuna conferma viene applicata                |

`unavailable` è fail-closed: non trasforma una Source Identity `pending` in `aligned`.

### `confirmationStoreReason`

`confirmationStoreReason` è una reason bounded associata al lookup:

| Status           | Reason osservabili nel flusso corrente                                                  |
| ---------------- | --------------------------------------------------------------------------------------- |
| `not_applicable` | `null`                                                                                  |
| `ok`             | `null` oppure `not_found`                                                               |
| `unavailable`    | `invalid_shape`, `invalid_record`, `invalid_json`, `read_failed` oppure `lookup_failed` |

`not_found` indica che il file del confirmation store non esiste: il lookup resta `ok` e viene trattato come archivio vuoto.

La route non espone il contenuto raw del confirmation store.

## Risposta `404`

Il builder restituisce `missing:true` quando né SofaScore né Betfair producono almeno un tick accettato dai rispettivi filtri.

La risposta HTTP ha questa shape. Nell'esempio seguente `integrity.status` è `no_known_partial`:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "error": "No timeline data found for this event",
  "reasons": [
    "SofaScore timeline missing",
    "Betfair timeline missing"
  ],
  "integrity": {
    "status": "no_known_partial",
    "reason": null,
    "affectedSources": [],
    "sources": {
      "sofa": {
        "status": "no_known_partial",
        "reason": null,
        "source": "sofa",
        "commitId": null,
        "affectedDocuments": []
      },
      "betfair": {
        "status": "no_known_partial",
        "reason": null,
        "source": "betfair",
        "commitId": null,
        "affectedDocuments": []
      }
    }
  }
}
```

Il blocco `integrity` conserva lo stato calcolato dal builder anche nel `404` e può quindi riportare `partial_persistence` o `recovery_failed` secondo lo stato corrente.

Il `404` non equivale necessariamente all’assenza fisica di entrambi i file.

`loadTimeline()` restituisce soltanto una timeline con stato interno `found`; gli altri esiti vengono esposti al builder come `null`. Di conseguenza il GET latest non distingue pubblicamente fra:

- file assente;
- discovery fallita;
- target di storage ambiguo;
- read failure;
- JSON invalido;
- shape del documento invalida.

Inoltre una timeline caricata ma priva di entry canoniche accettate dal filtro della fonte non rende `*TimelineFound` vero.

Se almeno una fonte contiene un tick canonico accettato, il risultato non è `missing` e la route può rispondere `200`.

## Persistence integrity

Il blocco top-level `integrity` ha questa forma:

```json
{
  "status": "no_known_partial",
  "reason": null,
  "affectedSources": [],
  "sources": {
    "sofa": {
      "status": "no_known_partial",
      "reason": null,
      "source": "sofa",
      "commitId": null,
      "affectedDocuments": []
    },
    "betfair": {
      "status": "no_known_partial",
      "reason": null,
      "source": "betfair",
      "commitId": null,
      "affectedDocuments": []
    }
  }
}
```

### Stato aggregato

Gli status ammessi sono:

```txt
no_known_partial
partial_persistence
recovery_failed
```

La priorità aggregata è:

```txt
recovery_failed
→ partial_persistence
→ no_known_partial
```

La reason top-level è deterministica:

| `integrity.status`    | `integrity.reason` |
| --------------------- | ------------------ |
| `no_known_partial`    | `null`             |
| `partial_persistence` | `pending_commit`   |
| `recovery_failed`     | `recovery_failed`  |

`affectedSources` contiene soltanto `sofa` e/o `betfair` quando il relativo stato è `partial_persistence` o `recovery_failed`.

Le reason specifiche delle singole fonti restano nei rispettivi blocchi `integrity.sources.sofa` e `integrity.sources.betfair` e non sostituiscono la reason aggregata.

### Blocchi per fonte

Ogni blocco source espone:

| Campo               | Contratto                                                     |
| ------------------- | ------------------------------------------------------------- |
| `status`            | `no_known_partial`, `partial_persistence` o `recovery_failed` |
| `reason`            | stringa o `null`                                              |
| `source`            | source attesa (`sofa`/`betfair`) oppure `null`                |
| `commitId`          | stringa oppure `null`                                         |
| `affectedDocuments` | array filtrato ai soli valori `history` e `timeline`          |

Input integrity assenti, non-object o con status non riconosciuto vengono normalizzati a `no_known_partial`. Un valore `source` non coerente con il ramo viene esposto come `null`; valori non ammessi in `affectedDocuments` vengono rimossi.

## Risposta `500`

Se `buildLatestMatchEvidence(eventId)` solleva un’eccezione, la route restituisce:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "code": "evidence_build_failed",
  "error": "Failed to build match evidence snapshot"
}
```

Status: `500`.

Il payload non include `error.message`, `details`, stack trace o dettagli filesystem.

Le failure del confirmation store gestite dal builder non diventano automaticamente `500`: quando il lookup fallisce in modo gestito, il risultato resta fail-closed tramite `sources.confirmationStoreStatus: "unavailable"`.

## Confini di esposizione

Il GET latest espone soltanto il contratto pubblico costruito dalla route e dal builder. Non espone:

- payload raw del journal;
- target o path filesystem interni;
- stack trace;
- messaggi raw delle eccezioni del builder;
- contenuto raw del confirmation store;
- cookie, token o payload browser raw.

Questo documento descrive gli effetti HTTP e i campi pubblici. Non replica:

- l’algoritmo completo dello snapshot;
- le regole complete di Source Identity e conferma manuale;
- il calcolo completo di data quality/alignment;
- l’algoritmo Market Reactions.

## Documenti collegati

- [API Evidence](../03-evidence.md)
- [Conferma e revoca Source Identity](02-source-identity-confirmation.md)
- [Snapshot Match Evidence](../../modules/evidence/01-match-evidence-snapshot.md)
- [Source Identity](../../modules/evidence/02-source-identity.md)
- [Qualità, flow e allineamento](../../modules/evidence/03-quality-flow-and-alignment.md)
- [Market Reactions](../../modules/evidence/04-market-reactions.md)
