# Tennis Decision UI — Documentazione tecnica

Questo è l'indice canonico della documentazione tecnica corrente.

La migrazione da MDX a Markdown è completata. Tutti gli owner canonici usano `.md`; validazioni storiche e planning archiviato restano fuori dalla documentazione tecnica corrente.

## Authority dei fatti e dei target

Per stabilire ciò che **esiste correntemente**, usare nell'ordine:

1. stato locale autorizzato e test eseguiti sulla stessa baseline;
2. codice della baseline corrente;
3. documento owner del modulo;
4. registri di audit e implementazione;
5. validazioni e materiale storico, limitatamente al checkpoint dichiarato.

Per stabilire ciò che **deve essere realizzato**, la decisione esplicita più recente dell'utente è authority del target. Una decisione approvata non dimostra che il target sia già implementato: servono codice e verifiche sulla baseline corrente.

## Come orientarsi

1. Aprire la [mappa del repository](./reference/01-repository-map.md).
2. Leggere [confini del sistema](./architecture/01-system-boundaries.md) e [ciclo di vita dei dati](./architecture/02-data-lifecycle.md) soltanto quando la task attraversa più livelli.
3. Individuare il documento owner del modulo.
4. Aggiungere soltanto i contratti condivisi attraversati dalla modifica.
5. Usare il controllo più vicino al comportamento modificato.

## Fondazione e architettura

- [Mappa del repository](./reference/01-repository-map.md)
- [Confini del sistema](./architecture/01-system-boundaries.md)
- [Ciclo di vita dei dati](./architecture/02-data-lifecycle.md)
- [Selezione del contesto per AI](./ai/01-context-selection.md)
- [Diagnosi e modularizzazione](./ai/04-diagnosi-e-modularizzazione.md)
- [Artefatti esecutivi e revisione](./ai/05-artefatti-esecutivi.md)
- [Workflow esecutivo e criteri di chiusura](./ai/03-workflow-esecutivo.md)
- [Convenzioni della documentazione](./ai/02-documentation-conventions.md)
- [Stato corrente del progetto](./roadmap/01-current-state.md) — snapshot da leggere sulla baseline dichiarata nel documento

## API correnti

- [API Match](./api/01-match.md)
  - [Letture e integrity](./api/match/01-read-and-integrity.md)
  - [Tracking e Source Identity](./api/match/02-tracking-and-source-identity.md)
  - [Analisi e snapshot](./api/match/03-analysis-and-snapshot.md)
- [API Betfair](./api/02-betfair.md)
  - [Letture, integrity e health](./api/betfair/01-read-integrity-and-health.md)
  - [Money Flow History](./api/betfair/02-money-flow-history.md)
  - [Log diagnostico](./api/betfair/03-log.md)
  - [Login window](./api/betfair/04-login-window.md)
- [API Evidence](./api/03-evidence.md)
  - [Latest snapshot](./api/evidence/01-latest-snapshot.md)
  - [Conferma e revoca Source Identity](./api/evidence/02-source-identity-confirmation.md)
- [API Preflight](./api/04-preflight.md)
- [API Runtime Health](./api/05-runtime-health.md)

## SofaScore e persistenza

- [Tracking live](./modules/sofa/01-live-tracking.md)
- [Contesto locale e point-by-point](./modules/sofa/02-local-context-and-point-by-point.md)
- [Timeline e history](./modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](./modules/storage/02-commit-journal-and-recovery.md)
- [Persistenza SofaScore](./modules/storage/03-sofa-persistence.md)
- [Persistenza Betfair](./modules/storage/04-betfair-persistence.md)
- [Writer authority](./modules/storage/05-writer-authority.md)

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
- [Betfair Depth e health UI](./modules/frontend/05-betfair-depth-and-health-ui.md)
- [Market Reactions UI](./modules/frontend/06-market-reactions-ui.md)

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
- [Commit journal hardening — 10 agosto 2026](../validations/commit-journal-hardening-2026-08-10.md)
- [Local runtime hardening — 10 agosto 2026](../validations/local-runtime-hardening-2026-08-10.md)

Una validazione storica dimostra ciò che è stato osservato nello specifico ambiente; non equivale a un PASS corrente.

## Audit e registri

- [Registro sintetico delle implementazioni](../../implementazioni-tennis-decision-ui.md)
- [Todo cumulativa](../../todo-list-tennis-decision-ui.md)
- [Audit tecnico cumulativo](../../implementazioni/03-audit-codice.md)
- [Implementazioni proposte](../../implementazioni/06-implementazioni-proposte.md)
- [Decisioni dell'utente](../../implementazioni/99-decisioni-utente.md)

Essere presenti in questo indice significa essere un owner tecnico corrente, non essere privi di finding. Limiti, task aperte e implementazioni approvate appartengono alla roadmap e ai registri, non a note ad hoc accanto ai singoli gruppi.

## Materiale non canonico

Le specifiche future non fanno parte della documentazione tecnica corrente. I requisiti ancora utili sono conservati nei registri. `docs/archive/` è una radice non canonica per materiali esplicitamente preservati dall'utente: può essere vuota o assente, non è un owner tecnico, non dimostra implementazione e non è soggetta a cleanup generici. Non deve essere creata o popolata soltanto per soddisfare una descrizione documentale.

## Regola documentale corrente

```txt
owner tecnico corrente in .md
→ link relativi verificati
→ validazioni storiche separate
→ planning, brief e fonti non canoniche conservati in docs/archive quando dichiarati utili
```

## Manutenzione dell'indice

Aggiornare questo indice nella stessa modifica quando un owner canonico viene creato, rinominato, spostato, sostituito, diviso, deprecato o rimosso.

Non aggiungere link a file soltanto proposti. Dopo ogni modifica strutturale eseguire:

```txt
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
```
