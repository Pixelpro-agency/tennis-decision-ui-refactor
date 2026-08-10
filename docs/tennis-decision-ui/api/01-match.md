# API Match

## Scopo

Questa pagina è la facade del router montato sotto `/api/match`. I contratti completi sono divisi per responsabilità:

- [Letture e integrity](./match/01-read-and-integrity.md);
- [Tracking e Source Identity](./match/02-tracking-and-source-identity.md);
- [Analisi e snapshot](./match/03-analysis-and-snapshot.md).

Implementazione:

```txt
backend/src/routes/match.js
backend/src/routes/match/
```

## Endpoint

| Metodo | Percorso                                     | Owner                                                                    |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------ |
| `GET`  | `/api/match/debug-last`                      | [Letture e integrity](./match/01-read-and-integrity.md)                  |
| `GET`  | `/api/match/:eventId/history`                | [Letture e integrity](./match/01-read-and-integrity.md)                  |
| `GET`  | `/api/match/:eventId/json`                   | [Letture e integrity](./match/01-read-and-integrity.md)                  |
| `GET`  | `/api/match/:eventId/source-identity-status` | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/track`                           | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/untrack`                         | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/stop`                            | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/analyze`                         | [Analisi e snapshot](./match/03-analysis-and-snapshot.md)                |
| `POST` | `/api/match/snapshot`                        | [Analisi e snapshot](./match/03-analysis-and-snapshot.md)                |

`debug-last` e `untrack` sono superfici deprecate ancora presenti. Non estenderle; la loro rimozione richiede una task tecnica dedicata.

## Confini comuni

- le route di lettura non avviano acquisizione, recovery o scritture;
- `integrity` descrive la persistenza nota e non equivale allo stato live del Source Identity Gate;
- il router delega tracking, persistenza, analisi e cleanup ai rispettivi moduli;
- lo stato corrente, inclusi i limiti pubblici, va documentato senza anticipare correzioni non implementate.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check routes/match.js
node --check routes/match/readResponses.js
node --check routes/match/trackingResponses.js
node --check routes/match/analysisResponse.js
node --check routes/match/sourceIdentityStatusResponse.js

node routes/match/readResponses.test.mjs
node routes/match/trackingResponses.test.mjs
node routes/match/analysisResponse.test.mjs
node routes/match/sourceIdentityStatusResponse.test.mjs
```

I controlli storage aggiuntivi sono elencati nell’owner [Letture e integrity](./match/01-read-and-integrity.md).

## Documenti collegati

- [Confini del sistema](../architecture/01-system-boundaries.md)
- [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
- [Tracking live](../modules/sofa/01-live-tracking.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Source Identity](../modules/evidence/02-source-identity.md)
