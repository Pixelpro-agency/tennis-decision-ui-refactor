# Mappa del repository

## Scopo

Questa mappa serve a individuare il punto di ingresso, l'owner e il contesto minimo di una task.

Non sostituisce i contratti API, i documenti dei moduli o i registri dell'audit. I gap e le implementazioni approvate restano nei registri finché il codice non viene aggiornato.

## Root

```txt
Tennis Decision UI refactor/
├── avvio.py
├── scraper.py
├── betfair_scraper.py
├── backend/
├── frontend/
├── launcher/
├── scrapers/
├── scripts/
├── docs/
├── implementazioni/
└── legacy/
```

| Percorso                   | Responsabilità                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `avvio.py`                 | Wrapper pubblico del launcher locale                                                   |
| `scraper.py`               | Wrapper pubblico dello scraper SofaScore                                               |
| `betfair_scraper.py`       | Wrapper pubblico dello scraper Betfair                                                 |
| `backend/`                 | API, tracking, normalizzazione, writer authority, persistenza, recovery ed Evidence   |
| `frontend/`                | Dashboard React, polling e presentazione                                               |
| `launcher/`                | Avvio e shutdown coordinato dei servizi locali                                         |
| `scrapers/`                | Implementazione Python di SofaScore e Betfair                                          |
| `scripts/`                 | Utility operative, manutenzione, controlli documentali e runner di validazione offline |
| `docs/tennis-decision-ui/` | Documentazione tecnica canonica                                                        |
| `implementazioni/`         | Audit, proposte e decisioni                                                            |
| `legacy/`                  | Materiale non canonico; non usarlo come fonte primaria                                 |

## Avvio locale

```txt
python avvio.py
  ↓
launcher/
  ├─ Chrome CDP
  ├─ backend Express
  └─ frontend Vite
```

Porte preferite:

| Servizio   | Porta  |
| ---------- | -----: |
| Chrome CDP | `9222` |
| Backend    | `3001` |
| Frontend   | `3000` |

Le porte non identificano da sole l'ownership. Il launcher può riusare servizi validi o scegliere porte alternative; non deve terminare processi esterni in base alla sola porta.

Autorità e ownership correnti:

```txt
launcher lock
→ impedisce launcher concorrenti
→ governa backend/frontend avviati o riusati

backend writer authority
→ protegge la storage identity di match_history
→ viene acquisita dentro startServer()

backend process registry
→ governa i processi Python registrati

Chrome/CDP
→ non owned dal launcher
```

Il launcher non è owner di history, timeline, journal o recovery e non crea o interpreta la writer authority.

Documento owner: `../operations/01-local-runtime.md`.

## Flusso dei dati

```txt
backend startServer()
→ acquire writer authority
→ recovery
→ listener readiness
→ tracking runtime

SofaScore e Betfair
→ scraper Python
→ backend Node
→ normalizzazione e Source Identity Gate
→ commit canonici history/timeline
→ integrity read-only
→ Evidence
→ frontend
```

SofaScore e Betfair hanno acquisizione e failure mode indipendenti. Gli scraper producono campioni e diagnostica; il backend decide gate, persistenza, repair, integrity ed Evidence.

## Backend

Radice:

```txt
backend/src/
├── server.js
├── routes/
├── runtime/
├── utils/
└── sofa/
```

| Area             | Percorsi principali                                                 | Responsabilità                                                                      |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Server           | `server.js`                                                         | Express, writer authority, recovery bootstrap, listener readiness, shutdown e release |
| API Match        | `routes/match.js`, `routes/match/`                                  | Tracking, stop, status Source Identity, history, timeline e analisi                 |
| API Betfair      | `routes/betfair.js`, `routes/betfair/`                              | Latest, timeline, health, log, login e endpoint Betfair ancora presenti             |
| API Evidence     | `routes/evidence.js`, `routes/evidence/`                            | Snapshot Evidence e mutazioni Source Identity esplicite                             |
| API Preflight    | `routes/test.js`, `routes/test/`                                    | Controlli leggeri prima dello Start                                                 |
| Runtime          | `runtime/`                                                          | Process registry, runtime logger e matchHistory writer authority                    |
| Tracking         | `sofa/matchTracker.js`, `trackerUpdate.js`, `sourceIdentityGate.js` | Scheduler, gate, registro operazioni, stop ordinario e tracker drain                |
| SofaScore        | `sofa/normalizeSnapshot.js`, `pointByPoint.js`, `localContext.js`   | Snapshot e contesto descrittivo                                                     |
| Betfair          | `sofa/betfairFetch.js`, `sofa/betfair/`                             | Lifecycle scraper, validazione, normalizzazione, Money Flow e commit                |
| Storage          | `sofa/matchHistory.js`, `timelineStore.js`, `matchHistory/`         | History, timeline, journal, integrity e recovery                                    |
| Evidence         | `sofa/matchEvidence.js`, `sofa/matchEvidence/`                      | Snapshot read-only, qualità, identity e no-trade reasons                            |
| Market Reactions | `sofa/marketReactionEvidence.js` e moduli collegati                 | Osservazioni temporali senza causalità dichiarata                                   |

Modulo runtime authority:

```txt
backend/src/runtime/matchHistoryWriterAuthority.js
```

Sono ancora presenti aree deprecate, tra cui API/UI Strategy e alcuni endpoint legacy. Non estenderle e verificare sempre il relativo documento owner prima di modificarle.

## Persistenza e recovery

Dati e sidecar:

```txt
backend/match_history/
├── dati canonici
│   ├── history aggregata
│   ├── timeline SofaScore
│   └── timeline Betfair
├── .pending_commits/
└── .writer_authority/
```

Distinzione:

```txt
.pending_commits
→ recovery multi-documento per commit logici incompleti

.writer_authority
→ esclusione process-level dei backend writer sulla stessa storage identity
```

Regole:

- history e timeline non si modificano manualmente;
- `.pending_commits/` non è cache e non viene cancellata per forzare uno stato pulito;
- `.writer_authority/` non è cache e non viene cancellata per sbloccare manualmente un backend;
- le API read-only possono esporre integrity, ma non eseguono repair o recovery;
- health, freshness e persistence integrity restano concetti distinti;
- il backend acquisisce la writer authority prima della recovery e del listener;
- il secondo backend sulla stessa storage identity viene bloccato prima della recovery;
- lo shutdown rilascia l'authority soltanto dopo tracker drain positivo e listener chiuso.

Owner correnti:

- `../modules/storage/01-timelines-and-history.md`;
- `../modules/storage/02-commit-journal-and-recovery.md`.

## Python e scraper

```txt
scrapers/
├── sofa/
└── betfair/

launcher/
├── app.py
├── config.py
├── services.py
└── system.py
```

| Area                | Responsabilità                                                     |
| ------------------- | ------------------------------------------------------------------ |
| `scrapers/sofa/`    | URL, cache, browser e JSON SofaScore                               |
| `scrapers/betfair/` | Browser, mercato, Graph URL, ladder, cache e diagnostica           |
| `launcher/`         | Configurazione, processi, attese HTTP, apertura browser e shutdown |

I wrapper root restano facade compatibili. Non spostare logica di dominio nei wrapper.

## Frontend

Radice:

```txt
frontend/src/
├── App.jsx
├── components/
├── hooks/
├── services/
├── utils/
└── types/
```

| Area            | Percorsi principali                                                       | Responsabilità                           |
| --------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| Composizione    | `App.jsx`, `DashboardWorkspace.jsx`, `Sidebar.jsx`                        | Shell, viste e orchestrazione UI         |
| Sessione        | `useAnalysisSessionState.js`, `useLiveTrackingActions.js`                 | Input, sessione confermata, Start e Stop |
| Source Identity | hook e componenti `SourceIdentity*`                                       | Polling gate e presentazione             |
| Polling dati    | `useMatchPolling.js`, `useBetfairJson.js`, `useMarketReactionEvidence.js` | Letture Match, Betfair ed Evidence       |
| View model      | `useDashboardViewModel.js`, `utils/dashboard*`                            | Adattamento dei payload per i componenti |
| Contesto punti  | `MatchContextCard.jsx`, `matchContextViewModel.js`                        | Rendering descrittivo di `localContext`  |
| API client      | `services/liveSessionApi.js` e utility richieste                          | Chiamate HTTP della sessione live        |

Il frontend non legge filesystem, journal o writer authority, non esegue recovery e non ricostruisce Evidence o Source Identity dai link inseriti dall'utente.

Owner correnti: documenti sotto `modules/frontend/`. Questi documenti contengono gap già registrati; per sessione, polling e integrity prevale il codice corrente.

## Dati generati, runtime e sensibili

Escludere dal normale contesto e dai commit:

| Percorso o categoria                               | Regola                                              |
| -------------------------------------------------- | --------------------------------------------------- |
| `backend/match_history/`                           | Dati canonici locali; usare solo per task esplicite |
| `.pending_commits/`                                | Journal di recovery; non cancellare manualmente     |
| `.writer_authority/`                               | Sidecar authority; non cancellare o modificare manualmente |
| `backend/scraper_cache/`, `backend/betfair_cache/` | Cache non canoniche                                 |
| profili browser                                    | Sensibili e non condivisibili                       |
| `backend/betfair_network_dump/`                    | Diagnostica potenzialmente sensibile                |
| log runtime                                        | Diagnostica, non fonte canonica                     |
| `launcher/.runtime/`                               | Launcher lock e manifest effimeri                   |
| `node_modules/`, build                             | Artefatti generati                                  |
| `.env`                                             | Credenziali locali                                  |

La utility `scripts/cleanup_runtime_cache.py` opera soltanto sulle cache allow-list e non deve essere usata come cleanup generico o per manipolare `.writer_authority/`.

## Controlli documentali

```txt
scripts/check_documentation_links.py
scripts/check_registry_consistency.py
scripts/tests/test_check_documentation_links.py
scripts/tests/test_check_registry_consistency.py
```

Le utility operano offline, non accedono ai dati runtime e non modificano i file. Il link checker verifica target e anchor; il registry checker confronta Todo, schede owner, prefissi e metadata sintetici.

## Validazione locale

```txt
scripts/validation/
├── test-manifest.json
├── manifest-schema.json
├── result-schema.json
├── run.mjs
├── run.test.mjs
└── support/
```

`run.mjs` è il comando canonico per i profili offline registrati. Valida prima l'intero manifest, poi esegue ogni entry in un processo separato, in serie, con timeout e output bounded. Gli artefatti locali vengono scritti sotto `test-results/`, già esclusa da Git.

Il manifest iniziale copre la superficie verificata durante il Punto 7 e i checker documentali. Non sostituisce ancora la mappa completa `IMPL-003`, il sandbox persistence `IMPL-008`, il frontend interaction harness `IMPL-030` o il ledger `IMPL-031`.

I test automatici IMPL-015 pubblicati sono:

```txt
matchHistoryWriterAuthority.test.mjs
→ 26 passati

matchTracker.test.mjs
→ 10 passati

server.test.mjs
→ 30 passati
```

Non è stato eseguito un collaudo manuale con due backend reali concorrenti.

## Documentazione

```txt
docs/
├── tennis-decision-ui/   # owner tecnici correnti
├── validations/          # collaudi e osservazioni storiche
└── archive/              # planning, brief e materiale non canonico
```

Per convenzioni e gerarchia:

- [Indice](../index.md)
- [Convenzioni documentazione](../ai/02-documentation-conventions.md)
- [Selezione del contesto per AI](../ai/01-context-selection.md)
- [Confini del sistema](../architecture/01-system-boundaries.md)
- [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
- [Stato corrente](../roadmap/01-current-state.md)
- [Validazioni storiche](../../validations/README.md)

## Orientamento per tipo di task

| Task           | Punto di partenza                                                     |
| -------------- | --------------------------------------------------------------------- |
| Endpoint HTTP  | router, modulo response, test vicino e documento API owner            |
| Tracking       | `matchTracker.js`, update interessato e Source Identity Gate          |
| Persistenza    | writer authority, facade, writer, journal, recovery e test storage   |
| Betfair        | `betfairFetch.js`, sottoprogetto Betfair e scraper Python coinvolto   |
| Frontend       | hook o componente target, consumer diretto e documento frontend owner |
| Launcher       | wrapper `avvio.py`, package `launcher/` e runbook runtime             |
| Documentazione | indice, convenzioni, owner target e manifest della consegna           |

Non partire dall'intero repository quando il confine è già noto.

## Registri collegati

I finding, le decisioni e le strutture non ancora implementate sono mantenuti in:

- [Todo cumulativa](../../../todo-list-tennis-decision-ui.md)
- [Audit tecnico](../../../implementazioni/03-audit-codice.md)
- [Implementazioni proposte](../../../implementazioni/06-implementazioni-proposte.md)
- [Decisioni dell'utente](../../../implementazioni/99-decisioni-utente.md)

Questi registri orientano le task, ma non sostituiscono il codice o il documento owner corrente.
