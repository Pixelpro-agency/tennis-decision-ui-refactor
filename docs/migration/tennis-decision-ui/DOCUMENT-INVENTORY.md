# Inventario documentale — Batch 0

**Base:** `eef267aab3c138395a5ca3d644a942190c5360e8`

## Metodo

I quaranta documenti elencati da `docs/tennis-decision-ui/index.mdx` sono stati verificati singolarmente sul commit base. È stato inoltre verificato il `README.md` root.

Stati usati: corrente, corrente con gap, non allineato, storico, deprecato, futuro non implementato.

## Inventario

| Percorso | Responsabilità | Stato | Trattamento | Nota |
|---|---|---|---|---|
| README.md | Orientamento root | ATTUALE, DA RISCRIVERE | Batch 1 | Punta a index.mdx; aggiornare installazione e navigazione senza cronologia |
| docs/tennis-decision-ui/index.mdx | Indice canonico | ATTUALE, DA SOSTITUIRE | Batch 1 | 40 target indicizzati verificati; rimuovere meta JS e riferimenti legacy inesistenti |
| docs/tennis-decision-ui/reference/01-repository-map.mdx | Mappa repository | ATTUALE, TROPPO ESTESA | Batch 1 | Ridurre a percorsi, responsabilità e owner; non duplicare contratti |
| docs/tennis-decision-ui/architecture/01-system-boundaries.mdx | Confini sistema | ATTUALE, DA RIDURRE | Batch 2 | Preservare invarianti trasversali; spostare dettagli agli owner |
| docs/tennis-decision-ui/architecture/02-data-lifecycle.mdx | Ciclo dati | ATTUALE, DA RIDURRE | Batch 2 | Descrivere flusso corrente; non anticipare session/storage/provenance non implementati |
| docs/tennis-decision-ui/ai/01-context-selection.mdx | Contesto AI | ATTUALE, DA RISCRIVERE | Batch 1 | Ridurre e allineare al workflow recente; rimuovere dipendenza MDX |
| docs/tennis-decision-ui/ai/02-documentation-conventions.mdx | Convenzioni docs | ATTUALE, BLOCCANTE | Batch 1 | Primo owner da sostituire: oggi impone .mdx e meta JS |
| docs/tennis-decision-ui/api/01-match.mdx | API Match | ATTUALE CON LEGACY | Con task sessione/cleanup | Documentare codice corrente; debug-last e untrack presenti ma destinati a rimozione |
| docs/tennis-decision-ui/api/02-betfair.mdx | API Betfair | ATTUALE CON LEGACY | Con task Betfair | /odds presente ma destinata a rimozione; correggere confini integrity |
| docs/tennis-decision-ui/api/03-evidence.mdx | API Evidence | ATTUALE, DA CORREGGERE | Con task Evidence/sessione | Separare GET read-only da confirm/revoke mutanti |
| docs/tennis-decision-ui/api/04-strategy.mdx | API Strategy | DEPRECATA MA PRESENTE | Con cleanup Strategy | Non investire in espansione; rimuovere insieme al codice |
| docs/tennis-decision-ui/api/05-preflight.mdx | API Preflight | ATTUALE CON LIMITI | Con task Preflight | Descrivere controllo reale e fingerprint assente |
| docs/tennis-decision-ui/api/06-runtime-health.mdx | API Runtime Health | ATTUALE | Batch stabile | Mantenere owner del contratto health; ridurre duplicazioni |
| docs/tennis-decision-ui/modules/sofa/01-live-tracking.mdx | Tracking Sofa/Betfair | ATTUALE CON GAP | Con session authority | Non descrivere trackingSessionId finché assente |
| docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.mdx | Contesto locale | ATTUALE | Batch stabile | Preservare stato implementato/da validare live |
| docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx | Storage canonico | ATTUALE CON GAP | Con storage authority | Riscrivere insieme a IMPL-019/020 |
| docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.mdx | Journal/recovery | ATTUALE CON GAP | Con storage authority | Non anticipare revision/head/digest/integrity_unknown |
| docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.mdx | Lifecycle Betfair | ATTUALE CON GAP | Con Betfair authority | Non anticipare binding alla sessione logica |
| docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.mdx | Validità campioni | ATTUALE | Batch Betfair | Preservare eccezioni e limiti live; status-only va chiarito |
| docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.mdx | Evidence snapshot | ATTUALE CON GAP | Con Evidence | Preservare read-only e no causalità; aggiornare integrity/eligibility |
| docs/tennis-decision-ui/modules/evidence/02-source-identity.mdx | Source Identity | ATTUALE CON GAP | Con session authority | Distinguere gate corrente da session authority non implementata |
| docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.mdx | Quality/alignment | ATTUALE CON GAP | Con Evidence | Aggiungere provenance solo dopo implementazione |
| docs/tennis-decision-ui/modules/evidence/04-market-reactions.mdx | Market Reactions | ATTUALE CON GAP | Con Evidence | Correggere composizione/availability senza anticipare IMPL-023 |
| docs/tennis-decision-ui/modules/frontend/01-session-shell.mdx | Shell frontend | NON ALLINEATA | Con frontend session controller | Descrive ordine Start da sostituire; riscrivere con codice |
| docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.mdx | Polling/view model | NON ALLINEATA | Con polling runtime | Non dichiarare wiring integrity o guard non presenti |
| docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.mdx | UI Betfair/Market Reactions | NON ALLINEATA | Con frontend/Evidence | Non dichiarare UI integrity completa finché assente |
| docs/tennis-decision-ui/modules/frontend/04-match-context-ui.mdx | UI contesto punti | ATTUALE | Batch stabile | Preservare stato implementato/da validare live |
| docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.mdx | Wrapper/runtime Python | ATTUALE | Batch stabile | Preservare facade e CLI |
| docs/tennis-decision-ui/modules/python/02-sofascore-scraper.mdx | Scraper Sofa | ATTUALE | Batch stabile | Mantenere separazione acquisizione/backend |
| docs/tennis-decision-ui/modules/python/03-betfair-scraper.mdx | Scraper Betfair | ATTUALE CON HARDENING APERTO | Con Betfair hardening | Descrivere capture e cache reali, non garanzie future |
| docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.mdx | Graph URL | ATTUALE | Batch stabile | Preservare parser/mapping e validazioni ancora aperte |
| docs/tennis-decision-ui/operations/01-local-runtime.mdx | Runbook runtime | ATTUALE | Batch stabile | Separare contratto da collaudi storici |
| docs/tennis-decision-ui/operations/02-live-tracking-control.mdx | Runbook tracking | ATTUALE CON GAP | Con session authority | Aggiornare Stop completo/parziale dopo implementazione |
| docs/tennis-decision-ui/operations/03-betfair-diagnostics.mdx | Runbook diagnostica | ATTUALE CON LIMITI | Con hardening | Non presentare boundary pubblico più forte del codice |
| docs/tennis-decision-ui/operations/04-validation-and-rollback.mdx | Runbook validazione | ATTUALE MA MONOLITICO | Batch 2 + runner | Riscrivere stato corrente; aggiornare ancora dopo IMPL-028 |
| docs/tennis-decision-ui/operations/05-retention-and-cleanup.mdx | Runbook cleanup | ATTUALE CON LIMITI | Con maintenance authority | Preservare allow-list; apply non validato |
| docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx | Validazione storica Source Identity | STORICA | Move validations | Spostare da operations a docs/validations con SHA/data/limiti |
| docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx | Validazione storica Betfair | STORICA | Move validations | Spostare da operations a docs/validations |
| docs/tennis-decision-ui/roadmap/01-current-state.mdx | Stato corrente | NON ALLINEATA | Batch 2 | Riscrivere dal codice, non come cronologia di task |
| docs/tennis-decision-ui/roadmap/02-replay-and-backtesting.mdx | Replay/backtesting | FUTURA NON IMPLEMENTATA | Archive | Rimuovere dall’indice attivo; requisiti restano nei registri/archivio |
| docs/tennis-decision-ui/roadmap/03-market-reactions-journal.mdx | Market Reactions Journal | FUTURA NON IMPLEMENTATA | Archive | Rimuovere dall’indice attivo; documentare di nuovo solo quando implementata |

## Conteggi

- documenti indicizzati verificati: **40**;
- README root verificato: **1**;
- target dell’indice mancanti: **0**;
- riferimenti legacy `chapters/` e `sections/`: **assenti sul commit base**;
- sostituzioni eseguite nel Batch 0: **0**;
- cancellazioni eseguite nel Batch 0: **0**.

## Limite dell’inventario

Il connettore usato non espone una lettura ricorsiva dell’albero. L’inventario canonico è quindi ancorato all’indice verificato, al README, ai registri dell’audit e ai percorsi owner già controllati. Prima della rimozione finale dei `.mdx`, `IMPL-001` dovrà eseguire una scansione locale ricorsiva dei link e dei file non indicizzati.
