# Matrice owner — Batch 0

## Regola

Un documento owner definisce il contratto del proprio modulo. I documenti di orientamento collegano gli owner senza copiarne i dettagli.

| Area | Documento owner finale previsto | Code owner principali | Stato della riscrittura |
|---|---|---|---|
| Navigazione | `docs/tennis-decision-ui/index.md` | struttura repository | Batch 1 |
| Convenzioni docs | `docs/tennis-decision-ui/ai/02-documentation-conventions.md` | workflow documentale | Batch 1 |
| Contesto AI | `docs/tennis-decision-ui/ai/01-context-selection.md` | `implementazioni/07-*`, `08-*` | Batch 1 |
| Mappa repository | `docs/tennis-decision-ui/reference/01-repository-map.md` | entrypoint e directory principali | Batch 1 |
| Confini sistema | `architecture/01-system-boundaries.md` | frontend, backend, Python, storage | Batch 2 |
| Ciclo dati | `architecture/02-data-lifecycle.md` | tracking, gate, storage, Evidence | Batch 2 |
| API Match | `api/01-match.md` | `backend/src/routes/match.js`, `routes/match/` | con session authority |
| API Betfair | `api/02-betfair.md` | `backend/src/routes/betfair.js`, `routes/betfair/` | con Betfair authority |
| API Evidence | `api/03-evidence.md` | `backend/src/routes/evidence.js`, `routes/evidence/` | con Evidence/sessione |
| API Strategy | `api/04-strategy.md` temporaneo | `backend/src/routes/strategy.js` | deprecata, poi rimozione |
| API Preflight | `api/05-preflight.md` | `backend/src/routes/test.js`, `routes/test/` | con fingerprint input |
| Runtime health | `api/06-runtime-health.md` | `backend/src/server.js`, process registry | stabile |
| Tracking live | `modules/sofa/01-live-tracking.md` | `matchTracker.js`, tracker update | con session authority |
| Contesto locale | `modules/sofa/02-local-context-and-point-by-point.md` | normalize/localContext/PBP | stabile |
| Storage | `modules/storage/01-timelines-and-history.md` | `matchHistory.js`, `timelineStore.js` | con storage authority |
| Journal/recovery | `modules/storage/02-commit-journal-and-recovery.md` | `matchHistory/commitJournal/`, `recovery.js` | con storage authority |
| Lifecycle Betfair | `modules/betfair/01-scraper-lifecycle.md` | `betfairFetch.js`, `scraperLifecycle/` | con Betfair authority |
| Validità Betfair | `modules/betfair/02-technical-sample-validity.md` | processor/tracker update | stabile con chiarimenti |
| Evidence snapshot | `modules/evidence/01-match-evidence-snapshot.md` | matchEvidence builder | con Evidence |
| Source Identity | `modules/evidence/02-source-identity.md` | sourceIdentityGate e confirmation | con session authority |
| Quality/alignment | `modules/evidence/03-quality-flow-and-alignment.md` | dataQuality/alignment/flow | con provenance |
| Market Reactions | `modules/evidence/04-market-reactions.md` | market reaction modules | con eligibility |
| Frontend shell | `modules/frontend/01-session-shell.md` | App e session hooks | con frontend controller |
| Frontend polling | `modules/frontend/02-live-polling-and-view-model.md` | polling hooks e view model | con polling runtime |
| UI Betfair/Evidence | `modules/frontend/03-betfair-and-market-reactions-ui.md` | cards e view model | con UI integrity/Evidence |
| UI contesto | `modules/frontend/04-match-context-ui.md` | MatchContextCard/view model | stabile |
| Python entrypoint | `modules/python/01-entrypoints-and-runtime.md` | wrapper root e launcher | stabile |
| Scraper Sofa | `modules/python/02-sofascore-scraper.md` | `scrapers/sofa/` | stabile |
| Scraper Betfair | `modules/python/03-betfair-scraper.md` | `scrapers/betfair/` | con hardening |
| Graph URL | `modules/python/04-betfair-graph-url-validation.md` | `graph_url.py` | stabile |
| Runtime locale | `operations/01-local-runtime.md` | launcher e server bootstrap | stabile |
| Controllo live | `operations/02-live-tracking-control.md` | session/stop contracts | con session authority |
| Diagnostica | `operations/03-betfair-diagnostics.md` | health/log/capture | con hardening |
| Validazione | `operations/04-validation-and-rollback.md` | manifest test e runbook | Batch 2 + runner |
| Cleanup | `operations/05-retention-and-cleanup.md` | cleanup utility/authority | con maintenance authority |
| Evidenze live | `docs/validations/*.md` | report con SHA e ambiente | Batch 2 |
| Stato corrente | `roadmap/01-current-state.md` | codice + registri | Batch 2 |
| Funzioni future | nessun owner canonico finché non implementate | registri/archivio | escluse dall’indice attivo |
