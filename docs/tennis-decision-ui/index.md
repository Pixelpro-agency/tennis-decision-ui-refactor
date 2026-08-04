# Tennis Decision UI — Documentazione tecnica

Questo è l'indice canonico della documentazione tecnica corrente.

La migrazione da MDX a Markdown è completata. Tutti gli owner canonici usano `.md`; validazioni storiche e planning archiviato restano fuori dalla documentazione tecnica corrente.

## Gerarchia delle fonti

Quando due fonti divergono, usare questo ordine:

1. decisione esplicita più recente dell'utente;
2. stato locale autorizzato e test eseguiti sullo stesso stato;
3. codice sul branch canonico;
4. documento owner del modulo;
5. registri di audit, implementazioni e decisioni;
6. planning, validazioni e materiale storico.

Un documento non rende implementata una funzione che il codice non contiene.

## Come orientarsi

1. Aprire la [mappa del repository](./reference/01-repository-map.md).
2. Leggere [confini del sistema](./architecture/01-system-boundaries.md) e [ciclo di vita dei dati](./architecture/02-data-lifecycle.md) soltanto quando la task attraversa più livelli.
3. Individuare il documento owner del modulo.
4. Aggiungere soltanto i contratti condivisi attraversati dalla modifica.
5. Usare il controllo più vicino al comportamento modificato.

## Fondazione e architettura migrate

- [Mappa del repository](./reference/01-repository-map.md)
- [Confini del sistema](./architecture/01-system-boundaries.md)
- [Ciclo di vita dei dati](./architecture/02-data-lifecycle.md)
- [Selezione del contesto per AI](./ai/01-context-selection.md)
- [Convenzioni della documentazione](./ai/02-documentation-conventions.md)
- [Stato corrente del progetto](./roadmap/01-current-state.md)

## API correnti

- [API Match](./api/01-match.md)
- [API Betfair](./api/02-betfair.md)
- [API Evidence](./api/03-evidence.md)
- [API Preflight](./api/05-preflight.md)
- [API Runtime Health](./api/06-runtime-health.md)

[API Strategy](./api/04-strategy.md) descrive codice ancora presente ma deprecato. Non deve essere estesa.

## SofaScore e persistenza

- [Tracking live](./modules/sofa/01-live-tracking.md)
- [Contesto locale e point-by-point](./modules/sofa/02-local-context-and-point-by-point.md)
- [Timeline e history](./modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](./modules/storage/02-commit-journal-and-recovery.md)

I documenti di tracking e storage hanno limiti già registrati. Non devono essere letti come prova dell'esistenza di autorità o contratti non presenti nel codice.

## Betfair

- [Lifecycle scraper Betfair](./modules/betfair/01-scraper-lifecycle.md)
- [Validità tecnica dei campioni Betfair](./modules/betfair/02-technical-sample-validity.md)
- [Scraper Betfair Python](./modules/python/03-betfair-scraper.md)
- [Validazione Graph URL](./modules/python/04-betfair-graph-url-validation.md)

## Evidence e Source Identity

- [Match Evidence Snapshot](./modules/evidence/01-match-evidence-snapshot.md)
- [Source Identity](./modules/evidence/02-source-identity.md)
- [Qualità, flow e allineamento](./modules/evidence/03-quality-flow-and-alignment.md)
- [Market Reactions](./modules/evidence/04-market-reactions.md)

Evidence resta read-only rispetto a timeline e journal. Market Reactions mantiene `causalityClaimed:false` e non è un segnale operativo.

## Frontend

- [Sessione e shell frontend](./modules/frontend/01-session-shell.md)
- [Polling e view model](./modules/frontend/02-live-polling-and-view-model.md)
- [UI Betfair e Market Reactions](./modules/frontend/03-betfair-and-market-reactions-ui.md)
- [Contesto punti UI](./modules/frontend/04-match-context-ui.md)

I primi tre documenti hanno gap registrati. Per ordine dello Start, lifecycle dei poller e presentazione dell'integrity prevale il codice corrente.

## Python e runtime locale

- [Entry point e runtime Python](./modules/python/01-entrypoints-and-runtime.md)
- [Scraper SofaScore](./modules/python/02-sofascore-scraper.md)
- [Runtime locale](./operations/01-local-runtime.md)

## Operatività

- [Controllo tracking live](./operations/02-live-tracking-control.md)
- [Diagnostica Betfair](./operations/03-betfair-diagnostics.md)
- [Validazione e rollback](./operations/04-validation-and-rollback.md)
- [Runner locale di validazione](../../scripts/validation/README.md)
- [Retention e pulizia dati](./operations/05-retention-and-cleanup.md)

Le procedure descrivono strumenti e comportamenti realmente disponibili. I risultati di collaudo sono separati dagli owner.

## Validazioni storiche

- [Indice delle validazioni](../validations/README.md)
- [Verifica live Source Identity](../validations/source-identity-live-verification.md)
- [Validazione live Betfair — 4 luglio 2026](../validations/betfair-live-validation-2026-07-04.md)
- [Chiusura della migrazione documentale — 3 agosto 2026](../validations/documentation-migration-finalization-2026-08-03.md)

Una validazione storica dimostra ciò che è stato osservato nello specifico ambiente; non equivale a un PASS corrente.

## Audit e registri

- [Registro sintetico delle implementazioni](../../implementazioni-tennis-decision-ui.md)
- [Todo cumulativa](../../todo-list-tennis-decision-ui.md)
- [Audit tecnico cumulativo](../../implementazioni/03-audit-codice.md)
- [Implementazioni proposte](../../implementazioni/06-implementazioni-proposte.md)
- [Decisioni dell'utente](../../implementazioni/99-decisioni-utente.md)

## Materiale non canonico

Le specifiche future non fanno parte della documentazione tecnica corrente. I requisiti utili sono conservati nei registri; [docs/archive](../archive/README.md) mantiene soltanto la mappa delle fonti storiche consolidate.

## Regola documentale corrente

```txt
owner tecnico corrente in .md
→ link relativi verificati
→ validazioni storiche separate
→ planning e brief non canonici archiviati
```

Non creare nuovi documenti `.mdx` e non reintrodurre un secondo indice canonico.
