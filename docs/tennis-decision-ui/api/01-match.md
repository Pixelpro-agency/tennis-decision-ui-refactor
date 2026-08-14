# API Match

## Scopo

Questa pagina è la facade del router Match montato sotto `/api/match`.

Mantiene la mappa pubblica degli endpoint, la struttura del router e i confini comuni fra letture persistite, tracking live, Source Identity e analisi. I contratti completi sono divisi per responsabilità:

- [Letture e integrity](./match/01-read-and-integrity.md);
- [Tracking e Source Identity](./match/02-tracking-and-source-identity.md);
- [Analisi e snapshot](./match/03-analysis-and-snapshot.md).

Implementazione principale:

```txt
backend/src/server.js
backend/src/routes/match.js
backend/src/routes/match/
```

`server.js` monta `matchRouter` sotto `/api/match`; `match.js` registra le route e delega la costruzione delle risposte ai builder dedicati.

## Struttura del router

```txt
backend/src/routes/
├── match.js
└── match/
    ├── readResponses.js
    ├── trackingResponses.js
    ├── analysisResponse.js
    └── sourceIdentityStatusResponse.js
```

| Modulo                            | Responsabilità nella facade                                                     |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `match.js`                        | Registra gli endpoint e adatta i risultati dei builder alle risposte Express    |
| `readResponses.js`                | Costruisce le risposte per debug, history, timeline SofaScore e `integrity`     |
| `trackingResponses.js`            | Valida e costruisce le risposte per Track, Untrack e Stop                       |
| `analysisResponse.js`             | Valida la richiesta di analisi, delega a SofaScore e limita gli errori pubblici |
| `sourceIdentityStatusResponse.js` | Costruisce il payload pubblico dello stato live del Source Identity Gate        |

Le responsabilità applicative restano delegate ai moduli owner: persistenza e journal, tracker live, Source Identity Gate e costruzione dell'analisi SofaScore non vengono implementati nel router.

## Endpoint

| Metodo | Percorso                                     | Responsabilità                                         | Owner                                                                    |
| ------ | -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `GET`  | `/api/match/debug-last`                      | Superficie diagnostica deprecata                       | [Letture e integrity](./match/01-read-and-integrity.md)                  |
| `GET`  | `/api/match/:eventId/history`                | Lettura della history SofaScore con stato `integrity`  | [Letture e integrity](./match/01-read-and-integrity.md)                  |
| `GET`  | `/api/match/:eventId/json`                   | Lettura della timeline SofaScore con stato `integrity` | [Letture e integrity](./match/01-read-and-integrity.md)                  |
| `GET`  | `/api/match/:eventId/source-identity-status` | Stato live pubblico del Source Identity Gate           | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/track`                           | Avvio del tracking live                                | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/untrack`                         | Superficie deprecata per lo stop di un tracker         | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/stop`                            | Stop globale del live tracking                         | [Tracking e Source Identity](./match/02-tracking-and-source-identity.md) |
| `POST` | `/api/match/analyze`                         | Analisi SofaScore singola                              | [Analisi e snapshot](./match/03-analysis-and-snapshot.md)                |
| `POST` | `/api/match/snapshot`                        | Redirect `307` verso `/api/match/analyze`              | [Analisi e snapshot](./match/03-analysis-and-snapshot.md)                |

`debug-last` e `untrack` sono superfici deprecate ancora presenti. La loro eventuale rimozione richiede una modifica tecnica esplicita del contratto.

## Confini comuni

- le route `history` e `json` leggono dati persistiti e non avviano tracking, scraper o recovery;
- `integrity` descrive lo stato read-only della persistenza nota e non equivale allo stato live del Source Identity Gate;
- `source-identity-status` espone lo stato della sessione live del gate, separato dalle letture di persistenza;
- `analyze` è compute-only e non scrive history, timeline o journal; `snapshot` riusa lo stesso flusso tramite redirect;
- il router delega tracking, persistenza, analisi e cleanup ai rispettivi moduli;
- payload, status code, validazioni, errori e semantiche specifiche dei singoli endpoint appartengono ai tre documenti owner.

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

I controlli specifici di storage, journal e recovery sono elencati nell'owner [Letture e integrity](./match/01-read-and-integrity.md).

## Documenti collegati

- [Confini del sistema](../architecture/01-system-boundaries.md)
- [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
- [Tracking live](../modules/sofa/01-live-tracking.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Source Identity](../modules/evidence/02-source-identity.md)
