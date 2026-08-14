# API Betfair

## Scopo

Questa pagina è la facade del router Betfair montato sotto `/api/betfair`. I contratti completi sono divisi per responsabilità:

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
| `GET`  | `/api/betfair/log`             | [Log diagnostico](./betfair/03-log.md)                                   |
| `POST` | `/api/betfair/login-window`    | [Login window](./betfair/04-login-window.md)                             |

## Stato della superficie `/odds`

La precedente route:

```txt
GET /api/betfair/odds
```

non è più registrata dal router corrente.

Nel namespace `/api/betfair` non esiste un endpoint HTTP sostitutivo per il fetch esplicito delle quote né un endpoint che avvii acquisizione o persistenza Betfair.

## Confini comuni

- `/json` legge la timeline Betfair e lo stato di persistence integrity tramite l'adapter read-only `getMatchPersistenceIntegrity(eventId, 'betfair')`;
- `/latest` legge timeline Betfair, timeline Sofa, runtime Betfair effimero e persistence integrity senza avviare browser o scraper;
- con `mode=cdp` e un `cdpUrl` valido, `/latest` può eseguire un probe HTTP diagnostico bounded verso `<cdpUrl>/json/version`;
- le route di lettura non avviano tracking, scraper, recovery o scritture di persistenza;
- `integrity` è calcolata separatamente dalla health; la freshness Betfair è una metrica della health e non sostituisce l'integrity;
- Money Flow usa `selectionId`, normalizzato, come identità della serie e `/latest` costruisce il read model sugli ultimi venti tick validi;
- il login usa il ruolo `betfair_login`, distinto dal tracking.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check routes/betfair.js
node --check routes/betfair/latestPayload.js
node --check routes/betfair/cdpStatus.js
node --check routes/betfair/moneyFlowHistorySeries.js
node --check routes/betfair/loginWindow.js
node --check routes/betfair/loginWindowLifecycle.js
node --check runtime/runtimeLogger.js
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
