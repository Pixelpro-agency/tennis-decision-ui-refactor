# Confini del sistema

## Scopo

Questa pagina assegna responsabilità e authority tra frontend, API Express, dominio Node, persistenza, processi Python, launcher e fonti esterne. Descrive lo stato corrente e distingue esplicitamente i target approvati ma non ancora implementati.

I dettagli procedurali appartengono ai documenti owner collegati; questa pagina conserva soltanto invarianti e direzioni delle dipendenze.

## Struttura corrente

```txt
utente
→ frontend React / Vite
→ HTTP relativo /api
→ backend Express su loopback
  ├─ router HTTP
  ├─ tracking e dominio tennis
  ├─ Source Identity Gate
  ├─ Evidence read-only
  ├─ persistenza canonica
  └─ registry dei processi Python
     → wrapper Python root
     → scrapers/sofa e scrapers/betfair
     → SofaScore, Betfair e Chrome CDP
```

Il launcher è un livello di orchestrazione separato:

```txt
avvio.py → launcher/
→ lock della sessione launcher
→ individua o avvia Chrome CDP
→ individua o avvia backend e frontend
→ registra ownership owned/reused
```

## Ownership per livello

| Livello         | Owner corrente                                         | Responsabilità                                                       | Non possiede                                     |
| --------------- | ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------ |
| Frontend        | `frontend/`                                            | Input, stato UI, polling e rendering                                 | Filesystem, journal, processi Python             |
| Router HTTP     | `backend/src/routes/`                                  | Validazione, status, payload e delega                                | Regole di dominio duplicate                      |
| Tracking        | `backend/src/sofa/matchTracker.js` e moduli update     | Scheduler, match registrati, operazioni live, stop e drain           | Lifecycle interno del gate                       |
| Source Identity | `sourceIdentityGate.js` e `sourceIdentityGate/`        | Sessione eventId-based, candidate sample, phase, conferma e mismatch | Scheduler e rendering                            |
| Dominio         | `backend/src/sofa/`                                    | Normalizzazione, health, Evidence, flow e allineamento               | Contratti React o HTTP                           |
| Persistenza     | `matchHistory.js`, `timelineStore.js`, `matchHistory/` | History, timeline, journal e recovery                                | Browser e scraper                                |
| Runtime backend | `backend/src/runtime/`                                 | Figli Python, logging, HTTP locale e writer authority                | Chrome esterno o processi non registrati         |
| Scraper Python  | wrapper root e `scrapers/`                             | Acquisizione e diagnostica esterna                                   | Timeline, journal e decisioni UI                 |
| Launcher        | `avvio.py`, `launcher/`                                | Servizi locali identificati e ownership della sessione launcher      | Dominio, recovery applicativa e writer authority |

`matchTracker.js` integra il Source Identity Gate nel lifecycle live, ma non ne sostituisce gli owner.

## Confine HTTP locale

Il frontend usa URL relativi sotto `/api`; non restano consumer Strategy con backend hard-coded.

Il backend applica `IMPL-017`:

- bind predefinito su `127.0.0.1`;
- Host ammessi: `127.0.0.1`, `localhost`, `::1`;
- Origin ammessi: HTTP sugli stessi host;
- richieste senza Origin ammesse per launcher e diagnostica locale;
- Host e Origin remoti rifiutati con HTTP `403` e reason code bounded.

Le porte alternative scelte dal launcher restano compatibili perché la policy classifica l'host, non impone una porta fissa.

### Control plane e data plane

| Tipo                  | Operazioni                                            |
| --------------------- | ----------------------------------------------------- |
| Control plane mutante | Start, Stop, login, conferma e revoca Source Identity |
| Data plane read-only  | Latest, JSON, Runtime Health, Evidence e stato gate   |

Una route read-only non deve scrivere dati, aprire browser o avviare runtime mutante. Se il contratto prevede un probe diagnostico di rete, il target deve essere esplicitamente ammesso, validato e bounded.

`GET /api/betfair/:eventId/latest` può verificare lo stato CDP, ma usa soltanto un target loopback classificato e un probe bounded. Un input remoto o non valido non produce fetch.

La precedente route mutante `GET /api/betfair/odds` è stata rimossa: l'acquisizione Betfair appartiene al tracking canonico.

## Authority Betfair correnti

Il runtime Betfair possiede due lifecycle distinti:

| Lifecycle        | Chiave e confronto                                            | Portata                                       |
| ---------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Scraper tracking | scraper key + runtime identity (`profileDir` oppure `cdpUrl`) | Deduplica e ownership dell'esecuzione scraper |
| Login window     | singolo record active + runtime identity                      | Ownership della finestra di login             |

Il target URL non partecipa alla deduplica della login window. Key e runtime identity non costituiscono canonical market authority e i due lifecycle non possiedono un handoff globale.

La Betfair command authority globale `IMPL-016`, destinata ad arbitrare login, tracking e diagnostica, è approvata ma non implementata.

## Matrice delle authority

| Authority                  | Stato corrente                                      | Target approvato                   |
| -------------------------- | --------------------------------------------------- | ---------------------------------- |
| Launcher lock              | Implementato; serializza gli orchestratori launcher | Invariato                          |
| Ownership servizi launcher | `owned` terminabile; `reused` non terminabile       | Invariato                          |
| Writer authority           | Implementata per repository e storage identity      | Invariata                          |
| Source Identity Gate       | Identificato da `eventId` e vincolato alla `trackingSessionId` corrente | Estendere la stessa provenance agli artefatti persistiti |
| Tracking session authority | Implementata fra Start, tracker, callback, gate e bootstrap frontend | Completare la provenance end-to-end oltre i confini ancora eventId-based |
| Betfair command authority  | Assente                                             | Arbitro globale `IMPL-016`         |
| Local HTTP boundary        | Implementato con `IMPL-017`                         | Invariato                          |

Queste authority non sono intercambiabili:

```txt
launcher lock ≠ writer authority
writer authority ≠ Source Identity Gate
eventId persistito ≠ tracking session authority
scraper deduplica ≠ Betfair command authority
```

La writer authority serializza i backend capaci di scrivere sulla stessa storage identity. Non è event-scoped e non dimostra che una callback appartenga alla sessione live corrente.

## Persistenza

History e timeline sono dati canonici distinti. Il commit journal coordina la scrittura logica; Evidence e frontend possono leggere `integrity`, ma non possiedono journal o recovery.

Invarianti:

- writer authority acquisita prima di recovery e listener;
- owner vivo o non verificabile blocca il secondo backend;
- recovery stale consentita soltanto dopo morte positiva dell'owner precedente;
- shutdown conserva l'authority fino a drain verificato e chiusura del listener;
- drain fallito o force timeout non autorizza release anticipato.

Sequenze, reason code e recovery appartengono a [Ciclo di vita dei dati](./02-data-lifecycle.md), [Runtime locale](../operations/01-local-runtime.md) e [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md).

## Source Identity

Il gate autorizza o blocca nuove scritture del tracking coordinato. Non riscrive lo storico, non usa gli input frontend come prova dell'identità e non trasforma un errore di persistenza in mismatch.

Il gate resta indicizzato per `eventId`, ma la sessione conserva anche la `trackingSessionId` restituita dallo Start. Tracker SofaScore e Betfair verificano che la callback appartenga ancora alla sessione corrente; il gate rifiuta osservazioni e conferme con session identity diversa, mentre il frontend usa la stessa authority per bootstrap e presentazione Source Identity.

La propagazione non rende automaticamente session-scoped timeline e history, che restano indicizzate per evento. Una timeline già presente con lo stesso `eventId` non prova quindi di essere stata prodotta dallo Start corrente. Il residuo end-to-end di `IMPL-006` riguarda questa provenance persistita e gli altri confini ancora eventId-based, non l’assenza completa di una session identity runtime.

## Evidence

Il Match Evidence Snapshot legge timeline e stato applicabile senza modificarli. Non è una strategia, previsione, fair odds, prova causale, recovery authority o writer.

Market Reactions mantiene:

```txt
causalityClaimed: false
interpretation: temporal_proximity_only
```

## Aree rimosse e legacy

Router, polling, viste e componenti Strategy sono stati rimossi tramite `CODE-001` e `STRATEGY-API-008`. Le superfici canoniche Match, Betfair, Evidence e Market Reactions restano separate.

Gli endpoint legacy ancora presenti devono essere descritti nei rispettivi owner API senza presentarli come architettura target.

## Verifica dei confini

| Confine                      | Evidenza automatica principale                                              |
| ---------------------------- | --------------------------------------------------------------------------- |
| Bootstrap e writer authority | `backend/src/server.test.mjs`, test writer authority                        |
| Local HTTP boundary          | `runtime/localHttpBoundary.test.mjs`, test HTTP e bind in `server.test.mjs` |
| Processi Python              | `runtime/pythonProcessRegistry.test.mjs`                                    |
| Source Identity              | test `sourceIdentityGate/` e confirmation                                   |
| Tracker drain                | test `matchTracker` e shutdown server                                       |
| Betfair scraper              | test `betfairFetch`, scraper runner e runtime identity                      |
| Login Betfair                | test `loginWindowLifecycle` e route login                                   |
| Probe read-only CDP          | test Betfair latest e classifier CDP                                        |
| API relative frontend        | build frontend e assenza consumer Strategy                                  |
| Launcher ownership           | `launcher/tests/test_launcher.py`                                           |

Checker documentali:

```txt
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
```

Gli esiti devono essere verificati nell'esecuzione corrente; questa tabella non certifica risultati storici.

## Regole durante un refactor

1. Identificare owner del codice e owner documentale.
2. Classificare il cambiamento come control plane, data plane o adattatore esterno.
3. Verificare contratti in ingresso, uscita e authority attraversate.
4. Non saltare livelli o introdurre una seconda authority implicita.
5. Non descrivere come implementato un target presente soltanto nei registri.
6. Aggiornare documento owner e test del confine nella stessa modifica.

## Documenti collegati

- [Ciclo di vita dei dati](./02-data-lifecycle.md)
- [Mappa del repository](../reference/01-repository-map.md)
- [Selezione del contesto per AI](../ai/01-context-selection.md)
- [API Runtime Health](../api/05-runtime-health.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Stato corrente](../roadmap/01-current-state.md)
