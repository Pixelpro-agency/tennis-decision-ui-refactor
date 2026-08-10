# API Betfair — login window

## Endpoint

`POST /api/betfair/login-window` accetta `url`, `mode`, `profileDir` e `cdpUrl`.

| Caso                        | HTTP  | Risultato                              |
| --------------------------- | ----: | -------------------------------------- |
| Target vuoto                | `200` | `no_target`                            |
| URL Betfair invalida        | `400` | `betfair_url_invalid`                  |
| CDP assente o invalida      | `400` | `cdp_url_required` o `cdp_url_invalid` |
| Scraper assente             | `500` | `scraper_not_found`                    |
| Primo avvio                 | `200` | `started`                              |
| Sessione compatibile attiva | `200` | `already_active`                       |
| Runtime incompatibile       | `409` | `login_runtime_conflict`               |
| Spawn fallito               | `500` | `login_spawn_failed`                   |

`started` viene restituito dopo `spawnReady`; non conferma che il login utente sia completato. `already_active` non esegue un secondo spawn.

## Mode e runtime identity

Qualunque `mode` diverso dall’esatta stringa `"cdp"` viene trattato come `"persistent"`; non esiste `mode_invalid`.

```txt
persistent → mode + profileDir
cdp → mode + cdpUrl
```

Il target URL non partecipa alla runtime identity. Richieste con target differenti ma stessa identità possono ricevere `already_active` senza aprire una seconda finestra.

Cambiare fallback o deduplica richiederebbe una decisione tecnica e test. Il processo usa il ruolo `betfair_login`, distinto dal tracking.

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Runtime locale](../../operations/01-local-runtime.md)
- [Lifecycle scraper Betfair](../../modules/betfair/01-scraper-lifecycle.md)
