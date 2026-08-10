# API Match — tracking e Source Identity

## Endpoint

```txt
POST /api/match/track
POST /api/match/untrack
POST /api/match/stop
GET  /api/match/:eventId/source-identity-status
```

## Track

Il payload può contenere `sofaUrl`, `betfairUrl`, `betfairGraphUrls`, `chromeProfilePath`, `betfairMode` e `cdpUrl`.

| Caso                          | HTTP  | `code`                                                        |
| ----------------------------- | ----: | ------------------------------------------------------------- |
| `sofaUrl` assente             | `400` | non presente; `error: "URL SofaScore mancante"`               |
| Event ID non ricavabile       | `400` | non presente; `error: "URL non valido o eventId non trovato"` |
| CDP richiesta ma assente      | `400` | `cdp_url_required`                                            |
| CDP non valida                | `400` | `cdp_url_invalid`                                             |
| Runtime Betfair incompatibile | `409` | `scraper_runtime_conflict`                                    |
| Richiesta valida              | `200` | `{ "ok": true, "eventId": "<eventId>" }`                      |

`betfairMode` diventa `cdp` soltanto quando vale esattamente `"cdp"`; qualsiasi altro valore usa `persistent`. Non esiste un errore pubblico per mode sconosciuta.

## Untrack

La route deprecata passa `eventId` a `untrackMatch` e restituisce sempre `HTTP 200 {"ok":true}`. Senza `eventId` il comportamento corrente è un no-op, senza validazione del payload.

## Stop globale

`POST /api/match/stop` è globale e idempotente. `eventId`, se presente, è informativo. Ferma tracker e figli Python di scope `tracking`; non termina `betfair_login`, backend, frontend o Chrome e non cancella dati persistiti o journal. Il top-level resta `ok:true` anche se `pythonCleanup.ok` è falso.

## Source Identity status

| Condizione                 | HTTP  |
| -------------------------- | ----: |
| `eventId` vuoto            | `400` |
| Nessuna sessione leggibile | `404` |
| Gate presente              | `200` |

Le fasi pubbliche sono `collecting`, `pending`, `recording`, `mismatch` e `not-applicable`. `persistence` usa `buffering`, `canonical` o `blocked`.

`active` è vero per `collecting`, `pending`, `recording` e `not-applicable`; in `mismatch` è falso mentre la fase può restare leggibile. `stopped` è interno e la sessione viene normalmente rimossa.

Il payload esclude URL, token, cookie e percorsi locali. La `persistence` del gate non equivale alla `integrity` delle letture.

## Documenti collegati

- [API Match](../01-match.md)
- [Tracking live](../../modules/sofa/01-live-tracking.md)
- [Source Identity](../../modules/evidence/02-source-identity.md)
- [Runtime locale](../../operations/01-local-runtime.md)
