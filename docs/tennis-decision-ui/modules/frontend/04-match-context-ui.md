# Market Reactions UI

## Scopo

Questo documento è l'owner tecnico della presentazione frontend di Market Reactions. Descrive:

- il recupero periodico dell'Evidence corrente;
- gli stati di lettura e di disponibilità mostrati dalla pagina;
- la presentazione separata delle osservazioni Exchange → Field e Field → Exchange;
- il mapping descrittivo applicato dal view model;
- il disclaimer di non causalità.

La costruzione dell'Evidence appartiene a [Market Reactions](../evidence/04-market-reactions.md). Il lifecycle Source Identity appartiene a [Sessione e shell frontend](./01-session-shell.md).

## Componenti e responsabilità

```txt
App.jsx
└─ useMarketReactionEvidence(eventId)
   └─ MarketReactionsPage.jsx
      ├─ MarketLedObservationCard.jsx
      └─ FieldLedReactionCard.jsx
```

| Elemento                       | Responsabilità                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `useMarketReactionEvidence.js` | Legge l'endpoint Evidence, normalizza il payload, gestisce polling, refresh e stato della lettura.          |
| `MarketReactionsPage.jsx`      | Presenta lo stato generale, l'eventuale degradazione persistence, le reasons di availability e le due card. |
| `marketReactionViewModel.js`   | Applica i mapping frontend minimi per availability, sorgente market-led, marker e disclaimer causale.       |
| `MarketLedObservationCard.jsx` | Presenta l'osservazione Exchange → Field.                                                                   |
| `FieldLedReactionCard.jsx`     | Presenta l'osservazione Field → Exchange.                                                                   |

La pagina non ricostruisce l'Evidence: riceve dall'hook il read model estratto dalla risposta backend e lo distribuisce alle card.

## Lettura e polling

Con una sessione attiva, `App.jsx` passa a `useMarketReactionEvidence()` il SofaScore `eventId`; senza sessione passa una stringa vuota.

L'hook legge:

```http
GET /api/evidence/:eventId/latest
```

Il polling usa per default un intervallo di 5 secondi. Il primo caricamento imposta `loading`; i poll automatici successivi non riattivano questo stato. `refresh()` avvia una lettura manuale usando la stessa pipeline.

Quando cambia `eventId`, l'hook:

- invalida la generazione di polling precedente;
- annulla l'eventuale richiesta attiva;
- azzera Evidence e metadati della lettura precedente;
- avvia una nuova lettura e il relativo ciclo di polling, se l'identificatore è presente.

Una sola richiesta della generazione corrente può rimanere attiva. Le risposte appartenenti a una generazione precedente non aggiornano lo stato corrente.

## Normalizzazione del payload

Per una risposta valida con `ok = true`, `normalizeEvidencePayload()` produce:

| Stato frontend                   | Origine nel payload                                |
| -------------------------------- | -------------------------------------------------- |
| `latest`                         | `payload.latest`                                   |
| `evidence`                       | `payload.latest.marketReactionEvidence`            |
| `sources`                        | `payload.sources`                                  |
| `integrity`                      | `payload.integrity`                                |
| `persistenceComplete`            | `payload.latest.dataQuality.persistenceComplete`   |
| `sourceUpdatedAt` / `lastUpdate` | data valida da `payload.latest.metadata.updatedAt` |
| `fetchedAt`                      | istante locale della lettura completata            |

Date mancanti o non valide diventano `null`. L'hook non deriva `integrity`, `sources`, `reasons` o `persistenceComplete` dai contenuti delle card.

## Stati di lettura

| Condizione                                                         | `readStatus` | Presentazione della pagina                                                               |
| ------------------------------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------- |
| `eventId` assente                                                  | `inactive`   | La pagina, se renderizzata senza match, mostra che nessun match è caricato.              |
| Lettura iniziale in corso                                          | `waiting`    | Con `loading` e senza Evidence mostra `Loading evidence data…`.                          |
| HTTP `404` senza `integrity`                                       | `waiting`    | Azzera l'Evidence e conserva eventuali `reasons` o `error` del payload.                  |
| HTTP `404` con `integrity`                                         | `degraded`   | Azzera l'Evidence, conserva `integrity` e mostra l'avviso persistence.                   |
| Risposta HTTP non riuscita diversa da `404`, oppure errore di rete | `error`      | Azzera l'Evidence e mostra `Unable to load evidence data.`.                              |
| Risposta riuscita con `ok` diverso da `true`                       | `waiting`    | Azzera l'Evidence e conserva eventuali reasons senza trattarle come errore di trasporto. |
| Payload valido con `persistenceComplete = false`                   | `degraded`   | Mantiene l'Evidence normalizzata e mostra l'avviso persistence.                          |
| Payload valido negli altri casi                                    | `current`    | Mostra l'Evidence corrente senza avviso persistence.                                     |

Se non sono presenti né errore, né Evidence, né caricamento, la pagina mostra `No snapshot available for this match.` e fino a tre reasons ricevute dall'hook.

## Presentazione della persistence integrity

La degradazione persistence è distinta dall'errore di caricamento e dall'availability delle singole osservazioni.

Quando:

```txt
readStatus = degraded
oppure
persistenceComplete = false
```

la pagina mostra l'avviso `Evidence persistence is incomplete.`. Se disponibile, aggiunge `integrity.reason`; la presenza di `sources` produce soltanto l'indicazione che la lettura Evidence corrente contiene diagnostiche sulle fonti.

La UI non espone path, journal, commit o dettagli del filesystem e non ricalcola lo stato di integrità.

## Availability e reasons

L'availability delle due card dipende esclusivamente da:

```js
evidence?.available === true
```

Ogni altro valore produce il badge `unavailable`. La pagina continua a renderizzare una card unavailable e non la nasconde.

Le reasons restano associate al livello ricevuto:

| Origine                                                 | Presentazione                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| `reasons` restituito dall'hook senza snapshot           | Fino a tre voci nel messaggio `No snapshot available`.         |
| `evidence.summary.reasons` del wrapper Market Reactions | Fino a cinque voci nel blocco generale `Availability reasons`. |
| `summary.reasons` di una singola branch                 | Fino a cinque voci nella card corrispondente.                  |
| `observationWindow.reasons`                             | Fino a tre voci nella finestra corrispondente.                 |

La UI presenta questi valori senza dedurre autonomamente una reason alternativa.

## Exchange → Field

`MarketLedObservationCard` riceve `evidence.marketLedObservation`.

La sorgente `sourceMarketEvent` viene trasformata da `buildMarketSourceView()`:

| Campo sorgente           | Campo di vista  | Presentazione      |
| ------------------------ | --------------- | ------------------ |
| `runner`                 | `runner`        | Runner             |
| `observedFlowAmount`     | `amount`        | Flow amount        |
| `absoluteFlowTier`       | `absoluteTier`  | Absolute tier      |
| `relativeFlowTier`       | `relativeTier`  | Relative tier      |
| `direction`              | `direction`     | Direction          |
| `flowAmbiguous === true` | `flowAmbiguous` | Booleano esplicito |

La card può inoltre mostrare timestamp e selection ID della sorgente. Nel summary presenta, quando disponibili, data quality, flow ambiguity e tipi di eventi SofaScore osservati.

Ogni observation window può mostrare:

- durata in secondi;
- esito `observed` / `not observed` per `fieldEventObservedAfterFlow`;
- data quality;
- numero di tick SofaScore osservati;
- numero di marker rilevanti;
- reasons della finestra.

Se la branch non è presente, la card segnala che non sono disponibili dati di attività Exchange per lo snapshot. Se esiste la branch ma manca `sourceMarketEvent`, segnala che non è disponibile un'attività Exchange significativa come evento sorgente.

## Field → Exchange

`FieldLedReactionCard` riceve `evidence.fieldLedReaction`.

Per `sourceFieldEvent` la card può mostrare:

- tipo dell'evento;
- istante `stateFirstSeenAt`;
- point state;
- game score.

Nel summary presenta, quando disponibili, data quality, presenza di una market response, affidabilità della response e prima finestra temporale nella quale è stata osservata.

Ogni observation window può mostrare:

- durata in secondi;
- esito `observed` / `not observed` per `marketResponseObserved`;
- classificazione `reliable` oppure `diagnostic` quando una response è osservata;
- data quality;
- numero di tick Betfair osservati;
- delta del matched volume;
- presenza di price change e volume increase;
- variazioni per runner: baseline price, latest price, delta percentuale e direction;
- reasons della finestra.

Se la branch non è presente, la card segnala che non sono disponibili dati di reazione del campo per lo snapshot. Se esiste la branch ma manca `sourceFieldEvent`, segnala che non è disponibile un evento di campo rilevante come evento sorgente.

## Regola di non causalità

Market Reactions presenta prossimità temporale tra osservazioni, non causalità. La pagina dichiara sempre nell'intestazione:

```txt
Temporal proximity only. Causality not established.
```

Ogni card mostra inoltre `Causality not established` quando `causalityClaimed` è `false` nel summary della branch oppure direttamente nella branch.

La presentazione non deve essere interpretata come:

- segnale di trading;
- raccomandazione;
- intenzione attribuita al mercato;
- previsione del vincitore;
- relazione causale certa.

## Confine Source Identity

Market Reactions usa l'Evidence resa disponibile nella sessione, ma non possiede il lifecycle UI Source Identity. Gate, waiting screen, modale, toast e conseguenze di navigazione restano responsabilità della shell descritta in [Sessione e shell frontend](./01-session-shell.md).

Questo documento non duplica gli stati `collecting`, `pending`, `recording` e `mismatch` né le relative transizioni.

## Riferimenti implementativi

```text
frontend/src/App.jsx
frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/marketReactions/marketReactionViewModel.js
frontend/src/components/marketReactions/MarketLedObservationCard.jsx
frontend/src/components/marketReactions/FieldLedReactionCard.jsx
frontend/src/hooks/useMarketReactionEvidence.js
```

## Verifica

```bash
npm.cmd run test:components
node src/components/marketReactions/marketReactionViewModel.test.mjs
node src/hooks/useMarketReactionEvidence.test.mjs
npm.cmd run build
```

| Verifica                             | Copertura pertinente                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `frontendComponents.test.jsx`        | Render separato della persistence degradation e della relativa reason.                            |
| `marketReactionViewModel.test.mjs`   | Availability stretta, mapping della sorgente Exchange, formattazione marker e disclaimer causale. |
| `useMarketReactionEvidence.test.mjs` | Estrazione di Evidence, persistence completeness, timestamp, integrity e sources dal payload.     |
| Build frontend                       | Integrità di compilazione del frontend.                                                           |

## Collegamenti

- [Facade UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md)
- [Sessione e shell frontend](./01-session-shell.md)
- [Polling e view model](./02-live-polling-and-view-model.md)
- [Market Reactions Evidence](../evidence/04-market-reactions.md)
- [API Evidence](../../api/03-evidence.md)
