# Manifest di migrazione — Batch 0

**Base:** `eef267aab3c138395a5ca3d644a942190c5360e8`

## Legenda azioni

| Azione | Significato |
|---|---|
| `REWRITE_NOW` | Riscrivere nel batch strutturale corrente |
| `REWRITE_STABLE` | Riscrivere senza attendere una modifica funzionale |
| `REWRITE_WITH_CODE` | Riscrivere/finalizzare insieme alla task che cambia il contratto |
| `MOVE_TO_VALIDATIONS` | Spostare come evidenza storica non owner |
| `ARCHIVE_NON_CANONICAL` | Conservare fuori dall’indice attivo |
| `DEPRECATE_THEN_REMOVE` | Mantenere finché il codice esiste, poi eliminare |

## Mapping

| Vecchio percorso | Nuovo percorso previsto | Azione | Momento | Rimozione vecchio file |
|---|---|---|---|---|
| `README.md` | `README.md` | `REWRITE_NOW` | Batch 1 | dopo verifica del nuovo README |
| `docs/tennis-decision-ui/index.mdx` | `docs/tennis-decision-ui/index.md` | `REWRITE_NOW` | Batch 1 | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/reference/01-repository-map.mdx` | `docs/tennis-decision-ui/reference/01-repository-map.md` | `REWRITE_NOW` | Batch 1 | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/architecture/01-system-boundaries.mdx` | `docs/tennis-decision-ui/architecture/01-system-boundaries.md` | `REWRITE_STABLE` | Batch 2 | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/architecture/02-data-lifecycle.mdx` | `docs/tennis-decision-ui/architecture/02-data-lifecycle.md` | `REWRITE_STABLE` | Batch 2 | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/ai/01-context-selection.mdx` | `docs/tennis-decision-ui/ai/01-context-selection.md` | `REWRITE_NOW` | Batch 1 | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/ai/02-documentation-conventions.mdx` | `docs/tennis-decision-ui/ai/02-documentation-conventions.md` | `REWRITE_NOW` | Batch 1 | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/api/01-match.mdx` | `docs/tennis-decision-ui/api/01-match.md` | `REWRITE_WITH_CODE` | Con task sessione/cleanup | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/api/02-betfair.mdx` | `docs/tennis-decision-ui/api/02-betfair.md` | `REWRITE_WITH_CODE` | Con task Betfair | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/api/03-evidence.mdx` | `docs/tennis-decision-ui/api/03-evidence.md` | `REWRITE_WITH_CODE` | Con task Evidence/sessione | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/api/04-strategy.mdx` | `docs/tennis-decision-ui/api/04-strategy.md` | `DEPRECATE_THEN_REMOVE` | task cleanup Strategy | insieme alla rimozione del codice |
| `docs/tennis-decision-ui/api/05-preflight.mdx` | `docs/tennis-decision-ui/api/05-preflight.md` | `REWRITE_WITH_CODE` | Con task Preflight | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/api/06-runtime-health.mdx` | `docs/tennis-decision-ui/api/06-runtime-health.md` | `REWRITE_STABLE` | Batch stabile | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/sofa/01-live-tracking.mdx` | `docs/tennis-decision-ui/modules/sofa/01-live-tracking.md` | `REWRITE_WITH_CODE` | Con session authority | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.mdx` | `docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md` | `REWRITE_STABLE` | Batch stabile | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx` | `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md` | `REWRITE_WITH_CODE` | Con storage authority | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.mdx` | `docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.md` | `REWRITE_WITH_CODE` | Con storage authority | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.mdx` | `docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md` | `REWRITE_WITH_CODE` | Con Betfair authority | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.mdx` | `docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md` | `REWRITE_WITH_CODE` | Batch Betfair | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.mdx` | `docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md` | `REWRITE_WITH_CODE` | Con Evidence | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/evidence/02-source-identity.mdx` | `docs/tennis-decision-ui/modules/evidence/02-source-identity.md` | `REWRITE_WITH_CODE` | Con session authority | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.mdx` | `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.md` | `REWRITE_WITH_CODE` | Con Evidence | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/evidence/04-market-reactions.mdx` | `docs/tennis-decision-ui/modules/evidence/04-market-reactions.md` | `REWRITE_WITH_CODE` | Con Evidence | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/frontend/01-session-shell.mdx` | `docs/tennis-decision-ui/modules/frontend/01-session-shell.md` | `REWRITE_WITH_CODE` | Con frontend session controller | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.mdx` | `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md` | `REWRITE_WITH_CODE` | Con polling runtime | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.mdx` | `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md` | `REWRITE_WITH_CODE` | Con frontend/Evidence | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/frontend/04-match-context-ui.mdx` | `docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md` | `REWRITE_STABLE` | Batch stabile | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.mdx` | `docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md` | `REWRITE_STABLE` | Batch stabile | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/python/02-sofascore-scraper.mdx` | `docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md` | `REWRITE_STABLE` | Batch stabile | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/python/03-betfair-scraper.mdx` | `docs/tennis-decision-ui/modules/python/03-betfair-scraper.md` | `REWRITE_WITH_CODE` | Con Betfair hardening | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.mdx` | `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md` | `REWRITE_STABLE` | Batch stabile | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/operations/01-local-runtime.mdx` | `docs/tennis-decision-ui/operations/01-local-runtime.md` | `REWRITE_STABLE` | Batch stabile | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/operations/02-live-tracking-control.mdx` | `docs/tennis-decision-ui/operations/02-live-tracking-control.md` | `REWRITE_WITH_CODE` | Con session authority | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/operations/03-betfair-diagnostics.mdx` | `docs/tennis-decision-ui/operations/03-betfair-diagnostics.md` | `REWRITE_WITH_CODE` | Con hardening | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/operations/04-validation-and-rollback.mdx` | `docs/tennis-decision-ui/operations/04-validation-and-rollback.md` | `REWRITE_WITH_CODE` | Batch 2 + runner | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/operations/05-retention-and-cleanup.mdx` | `docs/tennis-decision-ui/operations/05-retention-and-cleanup.md` | `REWRITE_WITH_CODE` | Con maintenance authority | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx` | `docs/validations/source-identity-live-verification.md` | `MOVE_TO_VALIDATIONS` | Batch 2 | dopo verifica contenuto e link |
| `docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx` | `docs/validations/betfair-live-validation-2026-07-04.md` | `MOVE_TO_VALIDATIONS` | Batch 2 | dopo verifica contenuto e link |
| `docs/tennis-decision-ui/roadmap/01-current-state.mdx` | `docs/tennis-decision-ui/roadmap/01-current-state.md` | `REWRITE_STABLE` | Batch 2 | solo dopo TEST-077…079 |
| `docs/tennis-decision-ui/roadmap/02-replay-and-backtesting.mdx` | `docs/archive/planning/replay-and-backtesting.md` | `ARCHIVE_NON_CANONICAL` | Batch 2 | dopo assorbimento requisiti nei registri |
| `docs/tennis-decision-ui/roadmap/03-market-reactions-journal.mdx` | `docs/archive/planning/market-reactions-journal.md` | `ARCHIVE_NON_CANONICAL` | Batch 2 | dopo assorbimento requisiti nei registri |

## Regole di applicazione

- un file nuovo viene inserito completo;
- il vecchio file resta finché i link non sono verificati;
- durante la sovrapposizione temporanea soltanto uno dei due è indicato come canonico nel manifest;
- nessun documento `REWRITE_WITH_CODE` viene finalizzato anticipando contratti assenti;
- i documenti archiviati non compaiono nell’indice canonico finale.
