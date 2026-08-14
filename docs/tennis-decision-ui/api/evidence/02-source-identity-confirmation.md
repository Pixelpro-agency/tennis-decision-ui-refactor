# API Evidence — conferma e revoca Source Identity

## Scopo

Questo documento definisce il contratto HTTP di conferma e revoca manuale della Source Identity esposto dal router Evidence:

```txt
POST   /api/evidence/:eventId/source-identity/confirm
DELETE /api/evidence/:eventId/source-identity/confirm
```

Il documento descrive input, response, status/code pubblici, comportamento gate-aware del `POST`, revoca contestuale del `DELETE` e confini del confirmation store.

Il lifecycle e l'algoritmo Source Identity restano nell'owner di modulo:

```txt
docs/tennis-decision-ui/modules/evidence/02-source-identity.md
```

La costruzione di `GET /api/evidence/:eventId/latest` appartiene al documento sibling:

```txt
docs/tennis-decision-ui/api/evidence/01-latest-snapshot.md
```

## Implementazione

```txt
backend/src/routes/evidence.js
backend/src/routes/evidence/evidenceResponses.js
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/sourceIdentityGate/manualConfirmation.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmation.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js
```

## Validazione comune di `eventId`

Entrambi gli endpoint usano la normalizzazione comune del router Evidence.

Un `eventId` non valido termina la richiesta con status `400` e risposta:

```json
{
  "ok": false,
  "error": "Missing or invalid eventId"
}
```

La definizione completa della validazione comune appartiene alla facade API Evidence.

## Conferma manuale

```txt
POST /api/evidence/:eventId/source-identity/confirm
```

### Body

Il percorso gate-aware usa:

```json
{
  "selectedPairs": [
    {
      "sofaPlayer": "<primo nome SofaScore>",
      "betfairRunner": "<primo runner Betfair>"
    },
    {
      "sofaPlayer": "<secondo nome SofaScore>",
      "betfairRunner": "<secondo runner Betfair>"
    }
  ],
  "confirmationText": "Confermo che questo mercato Betfair corrisponde alla partita SofaScore mostrata.",
  "trackingSessionId": "<trackingSessionId>"
}
```

Regole osservabili della conferma:

* `confirmationText` deve corrispondere esattamente alla frase richiesta dal backend;
* `selectedPairs` deve contenere esattamente due associazioni uno-a-uno;
* i due nomi SofaScore e i due runner Betfair devono appartenere al contesto corrente;
* l'identità automatica deve essere `pending`;
* il contesto deve essere completo e coerente con la Source Identity corrente;
* quando il gate possiede un `trackingSessionId`, il valore ricevuto deve corrispondere alla sessione corrente.

### Dispatch sul gate

Il router chiama prima:

```txt
buildGateManualConfirmationResponse(eventId, req.body)
```

Nel CODE AUTHORITY questo builder restituisce sempre una risposta HTTP, anche quando il gate non esiste o il suo status ha `ok:false`.

Di conseguenza il comportamento HTTP corrente del `POST` è fail-closed sul gate: un gate assente o non valido non attiva il ramo successivo basato sulle timeline, ma restituisce `409 confirmation_session_changed`.

### Fasi del gate

| Condizione gate                  | HTTP  | Code pubblico                     | Effetto                                                       |
| -------------------------------- | ----: | --------------------------------- | ------------------------------------------------------------- |
| gate assente o status `ok:false` | `409` | `confirmation_session_changed`    | conferma rifiutata                                            |
| `collecting`                     | `422` | `confirmation_context_incomplete` | contesto insufficiente                                        |
| `pending` e conferma valida      | `200` | —                                 | bootstrap, persistenza confirmation e ingresso in `recording` |
| `recording`                      | `409` | `automatic_identity_not_pending`  | conferma non ammessa                                          |
| `mismatch`                       | `409` | `automatic_identity_not_pending`  | conferma non ammessa                                          |
| altra fase                       | `409` | `confirmation_phase_invalid`      | fase non confermabile                                         |

Durante `pending`, gli errori di validazione, sessione, bootstrap o persistenza possono produrre gli status descritti nella sezione successiva.

### Mapping degli errori pubblici

| Condizione/codice interno                         | HTTP  | Code pubblico                     |
| ------------------------------------------------- | ----: | --------------------------------- |
| frase non valida                                  | `400` | `confirmation_text_invalid`       |
| coppie selezionate non valide                     | `400` | `selected_pairs_invalid`          |
| contesto incompleto                               | `422` | `confirmation_context_incomplete` |
| identità automatica non `pending`                 | `409` | `automatic_identity_not_pending`  |
| fase non valida                                   | `409` | `confirmation_phase_invalid`      |
| sessione assente o cambiata                       | `409` | `confirmation_session_changed`    |
| persistenza confirmation fallita                  | `500` | `confirmation_persistence_failed` |
| bootstrap persistence fallito                     | `500` | `confirmation_bootstrap_failed`   |
| rollback bootstrap fallito, se riportato dal gate | `500` | `confirmation_rollback_failed`    |
| altro codice non riconosciuto                     | `400` | `confirmation_invalid`            |

Le risposte di errore costruite dal response builder hanno forma:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "code": "<code pubblico>",
  "error": "Source identity confirmation is invalid"
}
```

### Risposta riuscita

Una conferma gate-aware riuscita restituisce:

```json
{
  "ok": true,
  "eventId": "<eventId>",
  "confirmed": true,
  "phase": "recording",
  "sourceIdentity": {}
}
```

`phase` e `sourceIdentity` sono quelli restituiti dal gate dopo il completamento della conferma.

## Sequenza gate-aware e limite di atomicità

Per una sessione `pending`, la sequenza corrente è:

```txt
validazione della frase, del contesto e delle coppie
→ costruzione/applicazione dell'identità manualmente confermata in memoria
→ bootstrap recording
→ upsert della confirmation persistita
→ fase recording
```

La persistenza della confirmation avviene quindi dopo il bootstrap.

Se il bootstrap fallisce:

```txt
nessun nuovo record di confirmation viene persistito
→ la Source Identity della sessione torna a quella automatica
→ il gate torna pending
→ la risposta non dichiara successo
```

Se il bootstrap riesce ma l'upsert della confirmation fallisce:

```txt
il gate torna pending
→ la risposta non dichiara successo
→ gli effetti canonici già completati dal bootstrap non vengono annullati dal confirmation store
```

Il confirmation store e il bootstrap non costituiscono una singola transazione atomica.

## Ramo basato sulle timeline presente nel router

Dopo il dispatch gate-aware, `evidence.js` contiene anche un ramo che:

```txt
legge il contesto dalle timeline persistite
→ richiede Source Identity automatica pending
→ valida frase e due coppie uno-a-uno
→ persiste la confirmation
→ restituisce confirmed:true
```

Alla baseline tecnica corrente questo ramo non è raggiunto dal normale `POST`, perché `buildGateManualConfirmationResponse(...)` restituisce una risposta anche quando il gate è assente o non valido.

Non deve quindi essere trattato come fallback HTTP attivo del contratto corrente.

## Revoca

```txt
DELETE /api/evidence/:eventId/source-identity/confirm
```

Il `DELETE` non usa il gate live. Ricostruisce il contesto persistito corrente, cerca una confirmation applicabile a quel contesto e, se presente, la revoca tramite fingerprint.

### Risposte

| Condizione                                                    | HTTP  | Risposta                                            |
| ------------------------------------------------------------- | ----: | --------------------------------------------------- |
| `eventId` non valido                                          | `400` | `Missing or invalid eventId`                        |
| errore nel caricamento dello stato Source Identity persistito | `500` | `Failed to load source identity confirmation state` |
| timeline SofaScore o Betfair necessaria assente               | `404` | `No timeline data found for this event`             |
| errore lettura confirmation store                             | `500` | `Failed to read source identity confirmation`       |
| nessuna confirmation applicabile                              | `200` | `{ ok: true, eventId, revoked: false }`             |
| revoca riuscita                                               | `200` | `{ ok: true, eventId, revoked: true }`              |
| errore durante la revoca                                      | `500` | `Failed to revoke source identity confirmation`     |

Quando il contesto timeline manca, il `404` può includere anche `reasons` provenienti dallo stato ricostruito.

L'assenza di una confirmation applicabile è idempotente dal punto di vista HTTP: restituisce successo con `revoked:false`.

La revoca:

* non è gate-aware;
* non modifica il gate live;
* non modifica timeline o history;
* non esegue recovery;
* non scrive journal.

## Confirmation store

Il contratto di persistenza è implementato da:

```txt
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js
```

Lo store usa un archivio JSON versione `1` con una lista di confirmation.

Ogni record normalizzato contiene:

```txt
fingerprint
eventId
epochSignature
marketId
selectionIds
sofaPlayers
betfairRunners
selectedPairs
createdAt
```

Proprietà rilevanti per questo contratto:

* un file store assente viene trattato come archivio vuoto;
* JSON o record non validi fanno fallire la lettura;
* l'upsert è idempotente per lo stesso `fingerprint`;
* per lo stesso contesto, un nuovo record sostituisce l'eventuale record precedente;
* la scrittura usa file temporaneo e rename;
* la ricerca restituisce soltanto una confirmation applicabile al contesto corrente;
* la revoca opera per `fingerprint`;
* una seconda revoca dello stesso fingerprint a livello store restituisce `revoked:false`.

La validità e l'applicabilità del record dipendono anche da epoch, market, selection id, nomi dei player/runner e mapping selezionato; l'algoritmo di Source Identity resta documentato nell'owner di modulo.

## Confini

Questo owner API descrive:

* endpoint, body, response e status/code pubblici;
* precondizioni della conferma manuale osservabili dall'API;
* dispatch gate-aware del `POST`;
* failure pubbliche di bootstrap e confirmation store;
* revoca contestuale del `DELETE`;
* confini di persistenza necessari a comprendere idempotenza e applicabilità.

Non possiede:

* algoritmo completo di matching Source Identity;
* lifecycle completo del gate;
* costruzione di `GET latest`;
* persistence integrity di Match Evidence;
* recovery o commit journal;
* tracking, scraper o browser;
* implementazione interna delle timeline e della history.

## Verifica

Test direttamente pertinenti:

```txt
backend/src/routes/evidence/evidenceResponses.test.mjs
backend/src/routes/evidence/evidenceRoute.test.mjs
backend/src/sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
backend/src/sofa/sourceIdentityGate/bootstrapFailures.test.mjs
```

Coprono, fra gli altri casi:

```txt
eventId non valido
→ 400

gate assente
→ 409 confirmation_session_changed

gate collecting
→ 422

gate mismatch
→ 409

gate pending confermabile
→ 200 con phase e sourceIdentity

frase/coppie non valide
→ 400 bounded

failure bootstrap
→ 500 confirmation_bootstrap_failed
→ gate pending
→ nessun upsert della confirmation

failure upsert dopo bootstrap
→ 500 confirmation_persistence_failed
→ gate pending

upsert ripetuto dello stesso record
→ idempotente

revoca store ripetuta
→ revoked:false
```

## Documenti collegati

- [API Evidence](../03-evidence.md)
- [Snapshot Evidence latest](./01-latest-snapshot.md)
- [Source Identity](../../modules/evidence/02-source-identity.md)
- [Snapshot Match Evidence](../../modules/evidence/01-match-evidence-snapshot.md)
