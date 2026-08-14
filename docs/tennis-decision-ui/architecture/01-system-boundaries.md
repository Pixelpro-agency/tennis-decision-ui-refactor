# Confini del sistema

## Scopo

Questa pagina assegna responsabilità e authority tra frontend, API Express, dominio Node, persistenza, processi Python, launcher e fonti esterne. Descrive lo stato corrente e distingue esplicitamente i target approvati ma non ancora implementati.

I dettagli procedurali appartengono ai documenti owner collegati; questa pagina conserva soltanto invarianti, ownership e direzioni delle dipendenze.

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
→ individua oppure richiede l'avvio di Chrome CDP senza assumerne ownership
→ individua o avvia backend e frontend
→ registra backend/frontend come owned oppure reused
```

## Ownership per livello

| Livello         | Owner corrente                                         | Responsabilità                                                                  | Non possiede                                              |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Frontend        | `frontend/`                                            | Input, stato UI, polling, bootstrap di sessione e rendering                     | Filesystem, journal, processi Python                      |
| Router HTTP     | `backend/src/routes/`                                  | Validazione, status, payload e delega                                           | Regole di dominio duplicate                               |
| Tracking        | `backend/src/sofa/matchTracker.js` e moduli update     | Scheduler, sessione live, match registrati, operazioni live, stop e drain       | Lifecycle interno del gate                                |
| Source Identity | `sourceIdentityGate.js` e `sourceIdentityGate/`        | Gate indicizzato per `eventId`, sessione runtime, campioni, phase e conferma    | Scheduler, rendering e persistenza canonica               |
| Dominio         | `backend/src/sofa/`                                    | Normalizzazione, health, Evidence, flow e allineamento                          | Contratti React o HTTP                                    |
| Persistenza     | `matchHistory.js`, `timelineStore.js`, `matchHistory/` | History, timeline, journal, integrity e recovery                                | Browser e scraper                                         |
| Runtime backend | `backend/src/runtime/`                                 | Figli Python, logging, confine HTTP locale e writer authority                   | Chrome esterno o processi non registrati                  |
| Scraper Python  | wrapper root e `scrapers/`                             | Acquisizione e diagnostica esterna                                              | Timeline, journal e decisioni UI                          |
| Launcher        | `avvio.py`, `launcher/`                                | Lock, discovery/avvio servizi locali e ownership di backend/frontend            | Dominio, recovery applicativa, writer authority e Chrome  |

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

| Tipo                  | Operazioni                                                                           |
| --------------------- | ------------------------------------------------------------------------------------ |
| Control plane mutante | Start, Stop, login, conferma e revoca Source Identity                                |
| Data plane read-only  | Match/Betfair Latest e JSON, history, Runtime Health, Evidence snapshot e stato gate |

Una route read-only non deve scrivere dati, aprire browser o avviare runtime mutante. Se il contratto prevede un probe diagnostico di rete, il target deve essere esplicitamente ammesso, validato e bounded.

`GET /api/betfair/:eventId/latest` può verificare lo stato CDP, ma usa soltanto un target HTTP loopback classificato e un probe bounded. Un input remoto o non valido non produce fetch.

La precedente route mutante `GET /api/betfair/odds` non appartiene più al router corrente: l'acquisizione Betfair è parte del tracking canonico.

## Ownership dei processi

L'ownership dei processi deriva dal componente che li crea e li registra, non dalla porta sulla quale vengono trovati.

| Area           | Ownership corrente                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launcher       | Può terminare soltanto backend e frontend avviati dalla sessione corrente e registrati come `owned`; i servizi `reused` non diventano terminabili dal launcher.                              |
| Chrome / CDP   | Il launcher può riutilizzare un endpoint CDP esistente o richiederne l'avvio tramite helper, ma Chrome resta `reused` o `external` e non entra nel registry dei processi owned del launcher. |
| Backend Python | `pythonProcessRegistry` possiede soltanto i processi Python avviati tramite il registry, distinti per ruolo e scope; non possiede Chrome né processi esterni non registrati.                 |

Questa separazione impedisce di usare la sola occupazione di una porta come prova di ownership.

## Authority Betfair correnti

Il runtime Betfair possiede due lifecycle distinti:

| Lifecycle        | Chiave e confronto                                                                                    | Portata                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Scraper tracking | scraper key + runtime identity (`mode` + `profileDir` oppure `mode` + `cdpUrl`) + `trackingSessionId` | Reuse soltanto nella stessa sessione; conflitto fra sessioni o runtime incompatibili |
| Login window     | singolo record active + runtime identity                                                              | Ownership della finestra di login; target URL escluso dal confronto                  |

Per lo scraper, la stessa key e la stessa runtime identity possono riusare l'esecuzione soltanto se coincidono anche nella `trackingSessionId`; una sessione diversa produce un conflitto di sessione. Per la login window, invece, il target URL non partecipa alla deduplica.

Scraper key, runtime identity e tracking session non costituiscono canonical market authority, e i due lifecycle non possiedono un handoff globale.

La Betfair command authority globale `IMPL-016`, destinata ad arbitrare login, tracking e diagnostica, resta un target approvato non implementato.

## Matrice delle authority

| Authority                  | Stato corrente                                                                                                                                                                                           | Target approvato                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Launcher lock              | Implementato; serializza gli orchestratori launcher                                                                                                                                                      | Invariato                                                                                                              |
| Ownership servizi launcher | Backend/frontend `owned` terminabili; `reused` non terminabili; Chrome/CDP non owned                                                                                                                     | Invariato                                                                                                              |
| Writer authority           | Implementata per repository e storage identity                                                                                                                                                           | Invariata                                                                                                              |
| Source Identity Gate       | Store indicizzato per `eventId`; la sessione interna conserva la `trackingSessionId` e, quando questa è presente nella sessione, accetta osservazioni e conferme soltanto con la stessa session identity | Propagare la stessa provenance oltre i boundary ancora eventId-based                                                   |
| Tracking session authority | `POST /api/match/track` restituisce `trackingSessionId`; tracker e callback la verificano e il frontend la usa per il bootstrap dashboard                                                                | Completare la provenance end-to-end sui boundary HTTP e sugli artefatti persistiti ancora privi della session identity |
| Betfair command authority  | Assente                                                                                                                                                                                                  | Arbitro globale `IMPL-016`                                                                                             |
| Local HTTP boundary        | Implementato con `IMPL-017`                                                                                                                                                                              | Invariato                                                                                                              |

Queste authority non sono intercambiabili:

```txt
launcher lock ≠ writer authority
writer authority ≠ Source Identity Gate
eventId persistito ≠ tracking session authority
scraper lifecycle ≠ Betfair command authority
```

La writer authority serializza i backend capaci di scrivere sulla stessa storage identity. Non è event-scoped e non dimostra che una callback appartenga alla sessione live corrente.

## Persistenza

History e timeline sono dati canonici distinti. Il commit journal coordina la scrittura logica; Evidence e frontend possono leggere `integrity`, ma non possiedono journal o recovery.

Invarianti:

- writer authority acquisita prima di recovery e listener;
- owner vivo o non verificabile blocca il secondo backend;
- record stale reclamabili soltanto dopo una verifica positiva di processo morto o PID riciclato;
- shutdown conserva l'authority fino a drain verificato e chiusura del listener;
- drain fallito o force timeout non autorizza release anticipato.

Sequenze, reason code e recovery appartengono a [Ciclo di vita dei dati](./02-data-lifecycle.md), [Runtime locale](../operations/01-local-runtime.md) e [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md).

## Source Identity

Il gate autorizza o blocca nuove scritture del tracking coordinato. Non riscrive lo storico, non usa gli input frontend come prova dell'identità e non trasforma un errore di persistenza in mismatch.

Il gate resta memorizzato per `eventId`, ma la sessione interna conserva anche la `trackingSessionId` creata dallo Start. Tracker SofaScore e Betfair verificano che la callback appartenga ancora alla sessione corrente prima di proseguire verso la persistenza; quando la sessione del gate possiede una `trackingSessionId`, osservazioni e conferme devono presentare la stessa session identity, altrimenti vengono rifiutate come stale.

Il boundary HTTP non è però interamente session-scoped. `POST /api/match/track` restituisce la `trackingSessionId` e il frontend la conserva per vincolare il bootstrap della dashboard alla sessione appena avviata. `GET /api/match/:eventId/source-identity-status`, invece, espone `eventId`, stato del gate, phase, persistence e Source Identity senza esporre la `trackingSessionId`; il polling di presentazione Source Identity rimane quindi eventId-based.

Timeline e history restano a loro volta indicizzate per evento. Una timeline già presente con lo stesso `eventId` non prova di essere stata prodotta dallo Start corrente. Il residuo end-to-end di `IMPL-006` riguarda la propagazione della provenance di sessione attraverso questi boundary HTTP e persistiti, non l'assenza di una session identity nel runtime del tracker e del gate.

## Evidence

Il Match Evidence Snapshot legge timeline, Source Identity applicabile e stato di integrità senza possederne la scrittura. Non è una strategia, previsione, fair odds, prova causale, recovery authority o writer.

Le evidenze cross-source vengono limitate quando Source Identity non è `aligned` o quando l'integrità della persistenza è in conflitto.

Market Reactions mantiene esplicitamente `causalityClaimed: false`. Nel ramo field-led, le finestre di osservazione e il risultato espongono inoltre:

```txt
interpretation: temporal_proximity_only
causalityClaimed: false
```

La prossimità temporale non viene quindi presentata come relazione causale.

## Aree rimosse e legacy

Le superfici Strategy non fanno parte dell'architettura corrente: il flusso canonico frontend/backend usa le superfici Match, Betfair, Evidence e Market Reactions, mantenute separate.

Gli endpoint di compatibilità o legacy ancora presenti devono essere descritti nei rispettivi owner API senza presentarli come architettura target.

## Verifica dei confini

| Confine                         | Evidenza automatica principale                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Bootstrap e writer authority    | `backend/src/server.test.mjs`, test writer authority                                                        |
| Local HTTP boundary             | `backend/src/runtime/localHttpBoundary.test.mjs`, test HTTP e bind in `backend/src/server.test.mjs`         |
| Processi Python                 | `backend/src/runtime/pythonProcessRegistry.test.mjs`                                                        |
| Source Identity                 | test `sourceIdentityGate/`, `backend/src/routes/match/sourceIdentityStatusResponse.test.mjs` e confirmation |
| Tracking session / Start        | test `matchTracker` e `backend/src/routes/match/trackingResponses.test.mjs`                                 |
| Tracker drain                   | test `matchTracker` e shutdown server                                                                       |
| Betfair scraper                 | `backend/src/sofa/betfair/scraperLifecycle.test.mjs`, test `betfairFetch`                                   |
| Login Betfair                   | `backend/src/routes/betfair/loginWindowLifecycle.test.mjs` e route login                                    |
| Probe read-only CDP             | test Betfair latest e classifier CDP                                                                        |
| API relative frontend           | build frontend e assenza consumer Strategy                                                                  |
| Launcher ownership e CDP        | `launcher/tests/test_launcher.py`                                                                           |

Checker documentali:

```txt
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
```

Gli esiti devono essere verificati nell'esecuzione corrente; questa tabella identifica le evidenze pertinenti ma non certifica risultati storici.

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
