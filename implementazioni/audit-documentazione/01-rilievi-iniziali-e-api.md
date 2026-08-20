# Tennis Decision UI — Audit della documentazione — rilievi iniziali e API

Questo file è la facade del modulo storico B1/B2 dell’audit documentale.

Conserva la navigazione verso i due blocchi che in origine erano raccolti nello stesso documento; le schede owner, la checklist iniziale, il checkpoint API e la relativa riconciliazione sono mantenuti nei rispettivi child.

## Moduli

| Modulo                                                               | Perimetro                                                                 | Owner storici                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| [Rilievi iniziali](01-rilievi-iniziali-e-api/01-rilievi-iniziali.md) | checkpoint B1, sezioni 9–10, inclusa la checklist iniziale                | `DOC-001…003, DOC-006…007, WORKFLOW-001`    |
| [Checkpoint API](01-rilievi-iniziali-e-api/02-api.md)                | checkpoint B2, sezione 11, SHA `b277bd9b7373dfd8702e65446c88bab7a0f64dcc` | `DOC-009…013`; richiamo storico a `DOC-003` |

## Regole di lettura

- il modulo è un registro storico e non sostituisce gli owner tecnici correnti;
- gli stati correnti riportati nei child servono a distinguere il checkpoint storico dalla situazione successiva;
- gli ID owner restano unici e non vengono rinumerati;
- la checklist B1 resta evidenza storica e non è la Todo corrente;
- i test citati nel checkpoint B2 furono letti/ispezionati, non eseguiti, salvo indicazione esplicita diversa.

## Navigazione

- [Audit della documentazione](../02-audit-documentazione.md)
- [Rilievi iniziali](01-rilievi-iniziali-e-api/01-rilievi-iniziali.md)
- [Checkpoint API](01-rilievi-iniziali-e-api/02-api.md)
