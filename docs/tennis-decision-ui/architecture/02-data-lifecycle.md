# Ciclo di vita dei dati

## Scopo

Questa pagina descrive il percorso end-to-end dei dati: bootstrap, acquisizione, classificazione, Source Identity, persistenza, letture ed Evidence. Mantiene gli invarianti comuni e rinvia agli owner specialistici per algoritmi, payload e recovery.

Non definisce strategie, previsioni o causalità tra campo e mercato.

## Flusso corrente

```txt
writer authority
→ recovery dei commit pending
→ listener ready
→ registrazione shutdown handler
→ backend operativo
→ acquisizione SofaScore e Betfair indipendente
→ classificazione tecnica e normalizzazione
→ Source Identity Gate quando applicabile
→ commit journalizzato per fonte
→ history e timeline canoniche
→ integrity e letture
→ Evidence
→ frontend
```

Esiste un piccolo intervallo tra listener readiness e registrazione degli handler di shutdown. Il backend viene considerato operativo soltanto dopo entrambe; il codice non ha ancora eliminato strutturalmente questo intervallo.

La writer authority viene acquisita prima di recovery e listener. Un secondo backend sulla stessa storage identity viene bloccato prima di tracking e scritture.

## Stage, owner ed evidenza

| Stage                  | Owner principale                            | Evidenza automatica                                      |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Bootstrap e recovery   | `server.js`, writer authority, recovery     | `server.test.mjs`, test writer authority/recovery        |
| Acquisizione SofaScore | scraper Sofa e tracker update               | test scraper/config e tracker Sofa                       |
| Acquisizione Betfair   | scraper Betfair e `trackerUpdate.js`        | test scraper runner, classifier e runtime health         |
| Source Identity        | `sourceIdentityGate.js` e sottocartella     | test gate, conferma e rollback bootstrap                 |
| Persistenza            | `matchHistory.js`, timeline store e journal | test timeline, commit, recovery e integrity              |
| Letture                | response builder delle route                | test route e payload owner                               |
| Evidence               | `matchEvidence/`                            | test composer, qualità, epoch e confirmation store       |
| Polling frontend       | hook frontend                               | test polling, stale response e session state disponibili |
| Shutdown terminale     | server e tracker drain                      | test shutdown, barrier e writer authority                |

## Acquisizione e timestamp

SofaScore e Betfair hanno polling e failure mode indipendenti. Un errore Betfair non deve fermare la raccolta SofaScore.

Cache, dump di rete, log e profili browser non sono fonti canoniche.

### SofaScore

```txt
evento + statistiche + point-by-point
→ normalizeSnapshot
→ localContext descrittivo
→ campione SofaScore
```

Valori assenti restano `null` o indisponibili; non vengono inventati fallback numerici.

### Betfair

```txt
output scraper
→ classificazione tecnica
→ normalizzazione mercato e runner
→ osservazione Source Identity
→ eventuale commit canonico
```

`lastSuccessfulScrapeAt` viene aggiornato quando l'acquisizione produce un risultato utilizzabile o segnala mercato concluso. Nel percorso utilizzabile può precedere l'esito della persistenza: è quindi un timestamp di acquisizione/runtime, non una prova di commit canonico.

Distinzioni obbligatorie:

| Concetto                 | Significato                                           |
| ------------------------ | ----------------------------------------------------- |
| Scrape success           | Acquisizione Betfair tecnicamente riuscita            |
| Commit success           | Scrittura logica completata o recuperata              |
| Canonical tick           | Tick accettato dalle regole timeline                  |
| `lastSuccessfulScrapeAt` | Ultimo successo di acquisizione, non commit timestamp |

Il payload non possiede ancora una provenance temporale completa che distingua stabilmente `acquiredAt`, `recordedAt` e skew tra fonti. Questo è il target approvato `IMPL-018`, non lo stato corrente.

## Source Identity Gate

| Fase             | Effetto                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `collecting`     | Attende campioni confrontabili; nessun nuovo commit cross-source     |
| `pending`        | Identità plausibile non risolta; buffering                           |
| `recording`      | Bootstrap bufferizzato riuscito e persistenza successiva autorizzata |
| `mismatch`       | Nuove scritture causali bloccate e tracking coordinato fermato       |
| `not-applicable` | Percorso SofaScore senza Betfair                                     |

Un campione Betfair tecnicamente inutilizzabile non aggiorna candidate o phase.

### Conferma manuale e bootstrap

La conferma manuale valida viene applicata prima al bootstrap dei campioni bufferizzati. Soltanto dopo un esito positivo di `onOpenRecording` viene scritta nel confirmation store. Se il bootstrap fallisce, restituisce un esito non positivo o la stessa buffer generation è già stata tentata, il gate ripristina Source Identity e phase `pending` senza creare una confirmation persistita e restituisce:

```txt
bootstrap_persistence_failed
oppure
persistence_failed
```

Se l’upsert della confirmation fallisce dopo il bootstrap, il gate torna `pending` e non dichiara successo. La scrittura nel confirmation store e i commit cross-source non formano comunque una singola transazione filesystem: un bootstrap canonico già completato non viene annullato riscrivendo a ritroso history o timeline.

### Authority e limite di sessione

Lo Start crea e restituisce una `trackingSessionId`. Tracker, aggiornamenti SofaScore e Betfair, scraper lifecycle, Source Identity Gate, conferma manuale e bootstrap frontend verificano questa identity o la sessione corrente prima di applicare risultati. `bufferGeneration` continua a proteggere i tentativi interni del gate, ma non sostituisce la session authority.

Il confine non è ancora completamente end-to-end: timeline, history e diverse letture persistite restano indicizzate per `eventId` e non dimostrano da sole di appartenere allo Start corrente. Il residuo di `IMPL-006` riguarda la provenance persistita e gli altri consumer ancora eventId-based; non va descritto come assenza totale di `trackingSessionId`.

## Persistenza canonica

```txt
backend/match_history/
├─ dati canonici per evento
├─ .pending_commits/
└─ .writer_authority/
```

| Artefatto            | Ruolo                                            |
| -------------------- | ------------------------------------------------ |
| Timeline SofaScore   | Tick canonici di campo                           |
| Timeline Betfair     | Tick canonici di mercato e diagnostica associata |
| History aggregata    | Vista business compatta                          |
| `.pending_commits/`  | Journal sidecar globale dei commit incompleti    |
| `.writer_authority/` | Ownership esclusiva della storage identity       |

Il journal viene creato prima delle scritture, registra i documenti completati e rende recuperabile un commit incompleto. `partial_persistence` e `recovery_failed` descrivono la persistenza, non health Betfair, mismatch o freshness.

Un campione tecnico non utilizzabile può essere passato a `repairOnly`: può completare fisicamente i file già descritti da un journal pendente, ma non crea un nuovo tick, una nuova riga sample-derived o un nuovo commit ID.

## Status-only Graph

Quando un campione regressivo segnala esplicitamente logout Graph, non contiene nuove ladder valide ed esiste un tick algoritmico precedente, il sistema costruisce uno snapshot status-only:

```txt
ultimo tick canonico
+ graphLoginRequired
+ zero ladder Graph valide
→ nuovo tick timeline Betfair status-only
```

Il nuovo tick:

- riceve nuovi `seq` e `commitId` tramite il normale percorso timeline;
- clona mercato, runner, quote e ladder dal precedente tick algoritmico;
- non aggiorna il runtime `marketState`;
- non aggiunge una nuova riga business Betfair alla history;
- forza ladder summary non utilizzabile;
- sostituisce Money Flow con `confidence: suppressed` e `reason: graph_login_required`;
- aggiorna la diagnostica necessaria a mostrare `auth_suspected`;
- può diventare il successivo last algorithmic tick usato dalla timeline.

Non è quindi corretto descriverlo come “nessuna scrittura”: è una nuova osservazione canonica di stato tecnico senza adozione dei dati regressivi.

## Stop live e shutdown terminale

Lo Stop live:

- rimuove il tracking logico e gli scheduler;
- termina i processi Python nello scope tracking;
- non garantisce da solo il drain completo delle Promise già presenti in `activeTrackerOperations`.

Una Promise Node già avviata può continuare fisicamente dopo Stop, perché lo Stop ordinario non esegue il drain terminale. Gli update verificano però la sessione corrente in più checkpoint e rifiutano l’applicazione quando la `trackingSessionId` è diventata stale. Quiescenza fisica e rifiuto logico delle callback obsolete restano proprietà distinte.

Lo shutdown terminale applica invece una barrier globale:

```txt
blocca nuove operazioni
→ ferma tracker e scheduler
→ avvia tracker drain
→ termina figli Python
→ attende activeTrackerOperations vuoto
→ verifica listener chiuso
→ rilascia writer authority
```

Drain fallito, risultato invalido o force timeout non autorizzano il release anticipato. I dettagli procedurali appartengono a [Runtime locale](../operations/01-local-runtime.md) e [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md).

## Classi di lettura

| Classe            | Esempi                                  | Vincolo                                                   |
| ----------------- | --------------------------------------- | --------------------------------------------------------- |
| Persistita        | timeline, history, Evidence             | Nessuna recovery o scrittura                              |
| In memoria        | Source Identity status, runtime Betfair | Nessuna nuova authority                                   |
| Probe diagnostico | status CDP da Betfair latest            | Solo target loopback validato, timeout e risposta bounded |

`GET /api/betfair/:eventId/latest` può unire timeline persistita, runtime in memoria e probe CDP controllato. Un input CDP remoto o invalido non produce fetch.

Read-only significa assenza di mutazioni canoniche, non necessariamente assenza assoluta di network I/O diagnostico.

## Evidence

Evidence combina timeline, integrity e Source Identity applicabile. Può esporre qualità, health, allineamento, flow, ladder, no-trade reasons e Market Reactions descrittive.

Quando l'identità non è allineata o la persistenza è incompleta, i confronti cross-source vengono sospesi o degradati. Evidence non ricostruisce il passato dal gate live, non modifica timeline e non prova causalità.

## Poller frontend

I poller principali condividono ora protezioni di lifecycle, pur mantenendo stati e read model distinti:

| Poller                     | Protezione corrente                            |
| -------------------------- | ---------------------------------------------- |
| Match e Betfair principali | Generation hook-local, richiesta abortibile e scarto delle risposte stale |
| Market Reactions           | Generation hook-local, `AbortController` e scarto delle risposte stale     |
| Source Identity status     | Generation hook-local, `AbortController` e guard della richiesta corrente  |

Lo Stop imposta la sessione frontend come inattiva, azzera la `trackingSessionId` corrente e ferma esplicitamente il polling SofaScore; i consumer condizionati da `sessionActive` vengono disabilitati e le richieste attive sono invalidate o abortite dai rispettivi hook. La distinzione residua riguarda la provenance dei dati persistiti e `last-known`, non l’assenza delle protezioni generation/abort.

## Dati esclusi dal flusso canonico

Non sostituiscono timeline o history:

- dump browser e network capture;
- cache runtime e log;
- snapshot latest isolati;
- dati simulati presentati come live;
- URL come prova dell'identità;
- numeri inventati per colmare dati assenti.

## Documenti collegati

- [Confini del sistema](./01-system-boundaries.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
- [Tracking live](../modules/sofa/01-live-tracking.md)
- [Validità tecnica Betfair](../modules/betfair/02-technical-sample-validity.md)
- [Match Evidence Snapshot](../modules/evidence/01-match-evidence-snapshot.md)
- [Stato corrente](../roadmap/01-current-state.md)
