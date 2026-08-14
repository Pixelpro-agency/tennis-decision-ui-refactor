> **Parte 1 di 7 — Rilievi iniziali e Punto 1**
> Rilievi iniziali B3–B6, decisioni UI, priorità e secondo audit del codice — Punto 1 su entry point, launcher e autorità runtime.
> [Indice](../03-audit-codice.md) · [Parte 2](02-runtime-sessioni-betfair.md)

# Tennis Decision UI — Audit del codice

> Contiene i rilievi tecnici iniziali e la mappa di controllo settore per settore.

## Moduli della Parte 1

| Modulo                                                                                             | Contenuto                                                                                              |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Checkpoint B3–B6](01-rilievi-iniziali/01-checkpoint-b3-b6.md)                                     | Rilievi iniziali, mappa di controllo, checkpoint B3–B6, decisioni e priorità del primo audit           |
| [Punto 1 — Runtime e writer authority](01-rilievi-iniziali/02-punto-1-runtime-writer-authority.md) | Secondo audit del Punto 1 su entry point, launcher, autorità di scrittura ed esito storico di IMPL-015 |

Questa facade non possiede schede owner. Gli ID, gli stati e il testo storico restano nei due moduli specialistici; la Todo e gli owner collegati conservano l’autorità sullo stato operativo corrente.

---

## Autorità temporale e overlay corrente

Le sezioni B3–B6 sono snapshot storici; il secondo audit del Punto 1 è un checkpoint successivo e l'update `IMPL-015` è ancora successivo. `COMPLETATO E APPROVATO` qualifica l'attività di audit, non chiude automaticamente i finding. Lo stato operativo prevalente vive nella Todo e nelle schede owner.

Supersession da preservare nella lettura:

```txt
CODE-001 → decisione DEC-008
CODE-003 → decisione DEC-009
EVIDENCE-001 → decisione DEC-010
CLEANUP-001 → decisione DEC-011
CODE-004 → assorbito dagli owner successivi
IMPL-015 → implementata e verificata dopo il checkpoint originario
```
