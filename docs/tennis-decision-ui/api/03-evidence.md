# API Evidence

## Scopo

Questa pagina è la facade del router montato sotto `/api/evidence`. I contratti HTTP completi sono divisi in:

- [Latest snapshot](./evidence/01-latest-snapshot.md);
- [Conferma e revoca Source Identity](./evidence/02-source-identity-confirmation.md).

Gli algoritmi e i lifecycle restano nei documenti owner sotto `modules/evidence/`.

## Endpoint

| Metodo   | Percorso                                         | Owner                                                              |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `GET`    | `/api/evidence/:eventId/latest`                  | [Latest snapshot](./evidence/01-latest-snapshot.md)                |
| `POST`   | `/api/evidence/:eventId/source-identity/confirm` | [Conferma e revoca](./evidence/02-source-identity-confirmation.md) |
| `DELETE` | `/api/evidence/:eventId/source-identity/confirm` | [Conferma e revoca](./evidence/02-source-identity-confirmation.md) |

## Confini comuni

- le route non creano tick e non modificano history, timeline o journal;
- non avviano tracking, browser, scraper o recovery;
- POST e DELETE possono modificare esclusivamente il confirmation store;
- `integrity` è osservabilità read-only della persistenza;
- Evidence non dichiara causalità;
- i limiti correnti di validazione, redazione e atomicità sono documentati senza anticipare fix non implementati.

## Verifica corrente

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
node sofa/matchEvidence/dataQuality.test.mjs
node sofa/matchEvidence/noTradeReasons.test.mjs
node sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
```

I test modulari coprono validazione dell’ID, envelope bounded, mapping del gate, store unavailable fail-closed, conferma manuale, bootstrap failure e rollback tramite le fixture del gate.

## Documenti collegati

- [Snapshot Match Evidence](../modules/evidence/01-match-evidence-snapshot.md)
- [Source Identity](../modules/evidence/02-source-identity.md)
- [Qualità, flow e allineamento](../modules/evidence/03-quality-flow-and-alignment.md)
- [Market Reactions](../modules/evidence/04-market-reactions.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
