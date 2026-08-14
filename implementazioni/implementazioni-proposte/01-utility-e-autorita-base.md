> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-001…015
> **Parte precedente:** [indice](../06-implementazioni-proposte.md)
> **Parte successiva:** [Runtime e acquisizione Betfair](02-runtime-betfair.md)

# Tennis Decision UI — Implementazioni utili da valutare

> **Nota sui checkpoint.** Questo registro conserva più momenti storici: classificazione B1–B6, strutture emerse da D1–D18, decisioni successive e closeout post-implementazione. Le descrizioni di problema e gli ordini valgono per il checkpoint indicato; lo stato corrente e gli eventuali closeout sono riportati nelle singole schede owner dei child. Questo file resta la facade stabile del perimetro `IMPL-001…015` e non costituisce una Todo operativa.

## Riepilogo corrente

```txt
COMPLETATE
IMPL-001
IMPL-004
IMPL-005
IMPL-015

APERTE / NON CHIUSE
IMPL-002
IMPL-003
IMPL-006
IMPL-007
IMPL-008
IMPL-009
IMPL-011
IMPL-012
IMPL-013

FUTURE
IMPL-010
IMPL-014
```

`IMPL-006` e `IMPL-009` presentano materializzazioni parziali descritte nei rispettivi owner senza essere promosse a completate. `IMPL-011` dispone di una primitiva di retention, ma la maintenance authority proposta resta non completata.

La Todo mantiene il riepilogo sintetico degli stati; questo registro conserva invece contesto storico, decisioni, stato corrente e closeout delle singole implementazioni.

## Registro modulare

| Responsibility boundary                    | Perimetro                      | Documento                                                                                                         |
| ------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Utility e controlli                        | `IMPL-001…005`                 | [01-utility-e-controlli.md](01-utility-e-autorita-base/01-utility-e-controlli.md)                                 |
| Authority, boundary e supporto cross-layer | `IMPL-006/007/008/009/011/015` | [02-autorita-boundary-e-supporto.md](01-utility-e-autorita-base/02-autorita-boundary-e-supporto.md)               |
| Offline, replay, strategy e performance    | `IMPL-010/012/013/014`         | [03-offline-replay-strategy-performance.md](01-utility-e-autorita-base/03-offline-replay-strategy-performance.md) |

Le schede owner complete risiedono esclusivamente nei tre child; la facade non duplica contratti, provenance o closeout.

---
