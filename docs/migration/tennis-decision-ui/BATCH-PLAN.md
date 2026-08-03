# Piano dei batch documentali

## Principio

Non riscrivere tutto insieme. Ogni batch deve essere leggibile, verificabile e reversibile.

## Batch 0 — Inventario e decisioni

**Contenuto:** registri, inventory, manifest, owner matrix, link report e checklist.
**Codice:** invariato.
**File canonici sostituiti:** nessuno.

## Batch 1 — Struttura e navigazione

File previsti:

```txt
README.md
docs/tennis-decision-ui/index.md
docs/tennis-decision-ui/ai/01-context-selection.md
docs/tennis-decision-ui/ai/02-documentation-conventions.md
docs/tennis-decision-ui/reference/01-repository-map.md
```

Obiettivo:

- stabilire definitivamente `.md` ordinario;
- rimuovere metadata JavaScript;
- definire owner e stati;
- creare un indice che distingua corrente, validation e archivio;
- non riscrivere ancora i contratti comportamentali destinati a cambiare.

## Batch 2 — Architettura, stato corrente e validations

File previsti:

```txt
architecture/01-system-boundaries.md
architecture/02-data-lifecycle.md
roadmap/01-current-state.md
docs/validations/source-identity-live-verification.md
docs/validations/betfair-live-validation-2026-07-04.md
operations/04-validation-and-rollback.md
```

In questo batch i due documenti futuri vengono rimossi dall’indice attivo e archiviati come non canonici.

## Pausa documentale e infrastruttura minima

Dopo i primi due batch:

```txt
IMPL-005 / IMPL-001
→ runner minimo IMPL-028
→ task di robustezza critiche
```

## Batch comportamentali

I documenti API e moduli vengono riscritti insieme al codice che modifica il relativo contratto:

1. writer/session/Betfair authority;
2. storage e recovery;
3. provenance ed Evidence;
4. frontend session-scoped e integrity UI;
5. cleanup Strategy, `/odds`, `/untrack`, `debug-last`.

## Batch stabile

I documenti non destinati a cambiamenti sostanziali possono essere convertiti in gruppi piccoli:

- contesto locale;
- wrapper e scraper Python;
- Graph URL;
- runtime locale;
- retention, con limiti correnti.

## Batch finale

```txt
scansione link globale
→ nessun export const meta
→ nessun link .mdx
→ nessun duplicato canonico
→ eliminazione vecchi .mdx
→ aggiornamento README e index finali
→ rimozione workspace migration
```
