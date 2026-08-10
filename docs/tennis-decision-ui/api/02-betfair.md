# API Betfair

## Scopo

Questa pagina è la facade del router montato sotto `/api/betfair`. I contratti completi sono divisi per responsabilità:

- [Letture, integrity e health](./betfair/01-read-integrity-and-health.md);
- [Money Flow History](./betfair/02-money-flow-history.md);
- [Log diagnostico](./betfair/03-log.md);
- [Login window](./betfair/04-login-window.md).

Implementazione principale: `backend/src/routes/betfair.js` e `backend/src/routes/betfair/`.

## Endpoint

| Metodo | Percorso                       | Owner                                                                    |
| ------ | ------------------------------ | ------------------------------------------------------------------------ |
| `GET`  | `/api/betfair/:eventId/latest` | [Letture, integrity e health](./betfair/01-read-integrity-and-health.md) |
| `GET`  | `/api/betfair/:eventId/json`   | [Letture, integrity e health](./betfair/01-read-integrity-and-health.md) |
| `GET`  | `/api/betfair/log`             | [Log diagnostico](./betfair/03-log.md)                                  |
| `POST` | `/api/betfair/login-window`    | [Login window](./betfair/04-login-window.md)                             |

La precedente route mutante `GET /api/betfair/odds` è stata rimossa. Non esiste un endpoint HTTP sostitutivo che avvii acquisizione o persistenza Betfair: queste responsabilità appartengono al tracking canonico.

## Confini comuni

- `/json` legge timeline e journal senza avviare acquisizione;
- `/latest` non avvia browser o scraper, ma in modalità CDP può effettuare un probe HTTP diagnostico;
- health, freshness e persistence integrity restano contratti distinti;
- Money Flow usa `selectionId` come identità;
- il login usa il ruolo `betfair_login`, distinto dal tracking;
- i limiti di sicurezza correnti sono documentati senza presentarli come già corretti.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check routes/betfair.js
node --check routes/betfair/latestPayload.js
node --check routes/betfair/cdpStatus.js
node --check routes/betfair/loginWindow.js
node --check routes/betfair/loginWindowLifecycle.js
node routes/betfair/latestPayloadResponse.test.mjs
node routes/betfair/latestPayloadIntegrity.test.mjs
node routes/betfair/betfairJsonResponse.test.mjs
node routes/betfair/normalizeIntegrity.test.mjs
node routes/betfair/cdpStatus.test.mjs
node routes/betfair/moneyFlowHistorySeries.test.mjs
node sofa/betfairMoneyFlowValidation.test.mjs
node routes/betfair/loginWindow.test.mjs
node routes/betfair/loginWindowLifecycle.test.mjs
node runtime/runtimeLogger.test.mjs
```

## Documenti collegati

- [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
- [Validità tecnica dei campioni](../modules/betfair/02-technical-sample-validity.md)
- [Diagnostica Betfair](../operations/03-betfair-diagnostics.md)
