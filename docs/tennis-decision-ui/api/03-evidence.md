# API Evidence

## Scopo

Questa pagina è la facade del router:

```txt
backend/src/routes/evidence.js
```

Il router è montato sotto:

```txt
/api/evidence
```

La facade possiede il contratto HTTP comune: mount, indice endpoint, validazione `eventId`, status sintetici, confini degli effetti e mappa di verifica.

I contratti HTTP specifici sono separati in:

- [Latest snapshot](./evidence/01-latest-snapshot.md);
- [Conferma e revoca Source Identity](./evidence/02-source-identity-confirmation.md).

Gli algoritmi e i lifecycle restano nei documenti owner sotto `modules/evidence/`.

## Endpoint

| Metodo   | Percorso                                         | Owner HTTP                                                         | Sintesi                                                                                                                       |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/evidence/:eventId/latest`                  | [Latest snapshot](./evidence/01-latest-snapshot.md)                | Costruisce lo snapshot Evidence da timeline persistite e aggiunge osservabilità su persistence integrity e confirmation store |
| `POST`   | `/api/evidence/:eventId/source-identity/confirm` | [Conferma e revoca](./evidence/02-source-identity-confirmation.md) | Conferma la Source Identity sulla sessione gate corrente                                                                      |
| `DELETE` | `/api/evidence/:eventId/source-identity/confirm` | [Conferma e revoca](./evidence/02-source-identity-confirmation.md) | Revoca la confirmation applicabile al contesto persistito corrente                                                            |

## Validazione comune `eventId`

Le tre route usano:

```txt
normalizeEvidenceEventId(value)
→ normalizeEventId(value)
```

Per il router Evidence, un `eventId` valido è una stringa che, dopo `trim()`:

- contiene da 1 a 128 caratteri;
- rispetta `^[A-Za-z0-9_-]+$`.

Sono quindi rifiutati valori vuoti, non stringa, troppo lunghi, path/traversal, slash, backslash, caratteri di controllo, spazi interni e altri caratteri fuori pattern.

Risposta comune:

```json
{
  "ok": false,
  "error": "Missing or invalid eventId"
}
```

Status: `400`.

La validazione avviene prima delle operazioni specifiche della route.

Questo contratto è verificato per Evidence e non implica che l'intera repository utilizzi ovunque lo stesso validator.

## Latest snapshot — invarianti di facade

```txt
GET /api/evidence/:eventId/latest
```

La response riuscita mantiene il wrapper pubblico:

```txt
ok
eventId
latest
sources
integrity
```

`sources.sofaTimelineFound` e `sources.betfairTimelineFound` indicano la presenza di tick utilizzabili dopo caricamento e filtri canonici, non la sola esistenza fisica del file.

Il loader timeline restituisce `null` quando il risultato non è `found`; la route latest non distingue quindi pubblicamente file assente, discovery failure, read failure, JSON invalido e shape non valida come errori HTTP separati.

Quando la Source Identity automatica è `pending`, latest rende osservabile la lettura della confirmation applicabile tramite `confirmationStoreStatus` e `confirmationStoreReason`. Una failure del confirmation store resta fail-closed.

`integrity.status` usa gli stati:

```txt
no_known_partial
partial_persistence
recovery_failed
```

La persistence integrity resta nel payload e non introduce `409` sulla route latest.

Se nessuna fonte produce tick utilizzabili, latest restituisce `404` con `No timeline data found for this event` e include comunque `integrity`.

Una eccezione del builder restituisce `500` con il code pubblico `evidence_build_failed` e senza `details`, `error.message` o stack trace.

Shape complete, reason, normalizzazione integrity, data quality e degradazione cross-source appartengono al contratto [Latest snapshot](./evidence/01-latest-snapshot.md).

## Conferma Source Identity — invarianti di facade

```txt
POST /api/evidence/:eventId/source-identity/confirm
```

Al CODE AUTHORITY la route è gate-authoritative: passa prima attraverso `buildGateManualConfirmationResponse(...)`.

Se non esiste una sessione gate valida, la response corrente è `409` con `confirmation_session_changed`; il ramo successivo basato sulle timeline persistite presente in `evidence.js` non è quindi raggiungibile con il contratto corrente dell'helper gate-aware.

Una conferma valida in fase `pending` può aprire il bootstrap di recording della sessione corrente. Nel tracker reale questo bootstrap può persistere i campioni SofaScore e Betfair buffered; la confirmation viene persistita soltanto dopo un bootstrap riuscito.

Il POST non avvia una nuova sessione di tracking, browser o scraper e non esegue recovery.

Body, mapping dettagliato degli errori, response e limite di atomicità appartengono al contratto [Conferma e revoca Source Identity](./evidence/02-source-identity-confirmation.md).

## Revoca Source Identity — invarianti di facade

```txt
DELETE /api/evidence/:eventId/source-identity/confirm
```

La revoca non è gate-aware. Ricostruisce il contesto dalle timeline persistite, richiede sia il lato SofaScore sia il lato Betfair utilizzabile e opera sulla confirmation applicabile a quel contesto.

L'assenza del contesto necessario produce `404`; l'assenza di una confirmation applicabile produce `200` con `revoked:false`; una revoca riuscita produce `200` con `revoked:true`. Failure di lettura o revoca del confirmation store producono `500`.

La revoca non modifica timeline o history e non esegue recovery.

I dettagli della response appartengono al contratto [Conferma e revoca Source Identity](./evidence/02-source-identity-confirmation.md).

## Matrice HTTP sintetica

| Endpoint                                   | `200`                  | `400`                                 | `404`                               | `409`                   | `422`               | `500`                                |
| ------------------------------------------ | ---------------------- | ------------------------------------- | ----------------------------------- | ----------------------- | ------------------- | ------------------------------------ |
| `GET /:eventId/latest`                     | snapshot costruito     | `eventId` non valido                  | nessuna fonte con tick utilizzabili | —                       | —                   | failure builder                      |
| `POST /:eventId/source-identity/confirm`   | conferma gate riuscita | `eventId`, testo o mapping non validi | —                                   | sessione/fase/conflitto | contesto incompleto | bootstrap o persistenza confirmation |
| `DELETE /:eventId/source-identity/confirm` | `revoked:true/false`   | `eventId` non valido                  | contesto timeline insufficiente     | —                       | —                   | read/revoke failure store            |

La route latest non trasforma `partial_persistence` o `recovery_failed` in `409`.

## Confini comuni

| Route            | Letture                                                                     | Scritture / effetti                                                             |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `GET latest`     | timeline, persistence integrity, confirmation applicabile quando necessaria | nessuna scrittura del router                                                    |
| `POST confirm`   | stato e contesto del gate                                                   | può attivare bootstrap canonico della sessione e poi persistere la confirmation |
| `DELETE confirm` | timeline persistite e confirmation store                                    | può revocare la confirmation applicabile                                        |

Il router:

- non implementa l'algoritmo di Source Identity;
- non implementa data quality, alignment o Market Reactions;
- non avvia tracking, browser o scraper;
- non esegue recovery;
- non accede direttamente al commit journal dalla route latest;
- non trasforma persistence integrity, freshness e Source Identity nello stesso concetto;
- non dichiara causalità.

## Verifica al CODE AUTHORITY

Dalla cartella `backend/src`:

```txt
node --check routes/evidence.js
node --check routes/evidence/evidenceResponses.js
node routes/evidence/evidenceResponses.test.mjs
node routes/evidence/evidenceRoute.test.mjs
node sofa/matchEvidence/latestMatchEvidence/loadingAndEpochs.test.mjs
node sofa/matchEvidence/latestMatchEvidence/integrityNormalization.test.mjs
node sofa/matchEvidence/latestMatchEvidence/persistenceIntegrity.test.mjs
node sofa/matchEvidence/latestMatchEvidence/manualConfirmation.test.mjs
node sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
node sofa/sourceIdentityGate/bootstrapFailures.test.mjs
```

Mappa sintetica:

| Contratto                         | Codice / test di riferimento                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| mount e superficie route          | `server.js`, `routes/evidence.js`, `evidenceRoute.test.mjs`                                                                              |
| validazione `eventId`             | `routes/evidence/evidenceResponses.js`, `utils/eventId.js`, `evidenceResponses.test.mjs`                                                 |
| error envelope e mapping HTTP     | `routes/evidence.js`, `routes/evidence/evidenceResponses.js`, relativi test                                                              |
| loading latest e fonti            | `matchEvidence/latestMatchEvidence.js`, `latestMatchEvidence/loadingAndEpochs.test.mjs`                                                  |
| normalizzazione `integrity`       | `matchEvidence/latestMatchEvidence.js`, test `integrityNormalization` e `persistenceIntegrity`                                           |
| confirmation store durante latest | `matchEvidence/latestMatchEvidence.js`, `latestMatchEvidence/manualConfirmation.test.mjs`                                                |
| conferma e store                  | `matchEvidence/sourceIdentityConfirmation.js`, `matchEvidence/sourceIdentityConfirmationStore.js`, `sourceIdentityConfirmation.test.mjs` |
| gate POST e bootstrap             | `sourceIdentityGate.js`, `sourceIdentityGate/manualConfirmation.js`, `sourceIdentityGate/bootstrapFailures.test.mjs`, `matchTracker.js`  |

## Documenti collegati

Contratti HTTP:

- [Latest snapshot](./evidence/01-latest-snapshot.md)
- [Conferma e revoca Source Identity](./evidence/02-source-identity-confirmation.md)

Owner Evidence:

- [Snapshot Match Evidence](../modules/evidence/01-match-evidence-snapshot.md)
- [Source Identity](../modules/evidence/02-source-identity.md)
- [Qualità, flow e allineamento](../modules/evidence/03-quality-flow-and-alignment.md)
- [Market Reactions](../modules/evidence/04-market-reactions.md)

Persistenza:

- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
