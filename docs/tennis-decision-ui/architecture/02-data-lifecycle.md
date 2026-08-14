# Ciclo di vita dei dati

## Scopo

Questa pagina descrive il ciclo di vita end-to-end dei dati del sistema: bootstrap del backend, acquisizione, normalizzazione e classificazione tecnica, Source Identity, persistenza canonica, integrity, letture, Evidence e consumo frontend.

Mantiene gli invarianti che attraversano più layer e rinvia agli owner specialistici per algoritmi, formati interni, recovery di dettaglio e logica dei singoli payload.

Non definisce strategie, segnali operativi, previsioni o causalità fra eventi di campo e mercato.

## Flusso corrente

```txt
acquisizione writer authority
→ recovery dei commit pending
→ listener HTTP ready
→ registrazione shutdown handler
→ bootstrap backend completato
→ Start live con trackingSessionId
→ acquisizione SofaScore e Betfair indipendente
→ normalizzazione / classificazione tecnica
→ Source Identity Gate quando Betfair è presente
→ bootstrap dei campioni autorizzati
→ commit journalizzato per fonte
→ history aggregata + timeline canoniche
→ integrity e read model
→ Evidence
→ poller e viste frontend
```

La writer authority viene acquisita prima della recovery e prima dell'apertura del listener. Se l'authority non può essere acquisita, oppure la recovery restituisce un esito fatale, il listener non viene avviato.

Dopo la recovery il backend apre il listener e ne attende la readiness; soltanto dopo registra gli handler di shutdown. Esiste quindi un breve intervallo in cui il listener è già pronto ma gli handler di shutdown non sono ancora registrati. `startServer()` completa il bootstrap soltanto dopo la registrazione degli handler.

La writer authority appartiene alla storage identity del backend, non al singolo match. Un secondo backend che non può acquisire la stessa authority viene bloccato prima di recovery, tracking e nuove scritture canoniche.

## Stage, owner ed evidenza

| Stage                                  | Owner principale                                                      | Evidenza automatica                                                  |
| -------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Bootstrap, writer authority e recovery | `backend/src/server.js`, writer authority, recovery                   | `backend/src/server.test.mjs` e test writer authority/recovery       |
| Acquisizione SofaScore                 | `scraper.py`, `scrapers/sofa/`, `trackerUpdate.js`                    | test scraper/config e tracker SofaScore                              |
| Acquisizione Betfair                   | `betfair_scraper.py`, `scrapers/betfair/`, `betfair/trackerUpdate.js` | test scraper lifecycle, classifier e runtime health                  |
| Source Identity                        | `sourceIdentityGate.js` e sottocartella                               | test lifecycle, bootstrap failure, conferma e session authority      |
| Persistenza canonica                   | `matchHistory.js`, timeline store, commit journal e processor Betfair | test commit, timeline, recovery e integrity                          |
| Letture Match/Betfair                  | response builder delle route                                          | test route, payload e integrity                                      |
| Evidence                               | `matchEvidence/`                                                      | test Evidence, Source Identity, qualità e integrity                  |
| Polling frontend                       | hook frontend                                                         | `frontend/src/hooks/pollingLifecycle.test.mjs` e test dei read model |
| Stop live                              | route Match, tracker e registry Python                                | test tracking/cleanup                                                |
| Shutdown terminale                     | `server.js`, tracker drain e writer authority                         | test shutdown, drain e writer authority                              |

La matrice indica gli owner del passaggio end-to-end. I dettagli interni dei singoli moduli restano nei documenti specialistici.

## Acquisizione e timestamp

SofaScore e Betfair hanno percorsi, polling e failure mode indipendenti. Un errore Betfair non deve trasformarsi automaticamente in un errore SofaScore né fermarne la raccolta.

| Fonte     | Entry point          | Percorso principale                             | Dati destinati al lifecycle canonico                                      |
| --------- | -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| SofaScore | `scraper.py`         | `scrapers/sofa/` → backend SofaScore            | evento, punteggio, statistiche e point-by-point disponibili               |
| Betfair   | `betfair_scraper.py` | `scrapers/betfair/` → processor/tracker Betfair | mercato, runner, quote, ladder, volumi e diagnostica tecnica normalizzata |

Cache, dump di rete, log e profili browser non sono fonti canoniche.

### SofaScore

```txt
evento + statistiche + point-by-point
→ normalizeSnapshot
→ localContext descrittivo
→ osservazione Source Identity
→ eventuale persistenza
```

Gli endpoint disponibili vengono combinati nello snapshot corrente. Dati assenti o non disponibili restano `null` o indisponibili; non vengono introdotti fallback numerici inventati.

Prima che un risultato possa essere applicato, l'update verifica che la `trackingSessionId` ricevuta appartenga ancora alla sessione corrente. La verifica viene ripetuta dopo l'osservazione del gate, prima dell'eventuale persistenza.

### Betfair

```txt
output scraper
→ classificazione tecnica
→ normalizzazione mercato e runner
→ osservazione Source Identity
→ eventuale persistenza
→ adozione del market state solo dopo commit canonico
```

`lastScrapeAttemptAt` viene aggiornato quando parte un tentativo di acquisizione.

`lastSuccessfulScrapeAt` viene aggiornato quando l'acquisizione produce un campione tecnicamente utilizzabile oppure segnala esplicitamente mercato concluso. Nel percorso utilizzabile questo timestamp viene aggiornato prima dell'esito della persistenza: descrive quindi il successo di acquisizione/runtime e non prova un commit canonico.

Distinzioni obbligatorie:

| Concetto                      | Significato                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Scrape success                | Acquisizione Betfair tecnicamente riuscita                                                    |
| Commit success                | Commit logico completato o recuperato                                                         |
| Canonical tick                | Tick accettato dalle regole della timeline                                                    |
| `lastSuccessfulScrapeAt`      | Ultimo successo di acquisizione, non timestamp di commit                                      |
| Market state Betfair adottato | Stato di mercato in memoria aggiornato soltanto dopo commit canonico `complete` o `recovered` |

Il lifecycle non possiede una provenance temporale persistita completa che distingua stabilmente, per ogni osservazione, tempo di acquisizione, tempo di registrazione e skew fra fonti. I timestamp runtime e i timestamp dei tick hanno ruoli distinti e non vanno fusi in un'unica nozione di “ultimo aggiornamento”.

## Source Identity Gate

Quando lo Start include Betfair, i campioni validi delle due fonti passano attraverso il Source Identity Gate prima delle nuove scritture cross-source.

| Fase             | Effetto                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `collecting`     | Attende campioni validi confrontabili; i campioni restano bufferizzati                               |
| `pending`        | Identità plausibile ma non risolta, oppure bootstrap non completato; i campioni restano bufferizzati |
| `recording`      | Bootstrap bufferizzato riuscito; le osservazioni successive autorizzate possono essere persistite    |
| `mismatch`       | Nuove applicazioni cross-source vengono bloccate e il tracking coordinato viene fermato              |
| `not-applicable` | Percorso SofaScore senza Betfair; il campione SofaScore può essere persistito                        |

Un campione Betfair tecnicamente inutilizzabile non aggiorna candidate o fase del gate. Può tuttavia entrare nel percorso di repair della persistenza già pendente, senza diventare una nuova osservazione canonica.

### Bootstrap automatico

Quando l'identità effettiva diventa `aligned`, il gate invoca il bootstrap dei campioni bufferizzati. Il bootstrap viene eseguito nell'ordine SofaScore → Betfair: il commit Betfair viene tentato soltanto se quello SofaScore ha avuto esito positivo.

Il bootstrap cross-source non è una singola transazione filesystem. Se il commit SofaScore è già completato e il successivo commit Betfair fallisce, il commit SofaScore non viene riscritto a ritroso per annullarlo. Il gate resta o torna `pending` e non apre `recording`.

La stessa `bufferGeneration` non viene ritentata automaticamente dopo un bootstrap fallito.

### Conferma manuale

La conferma manuale è ammessa soltanto quando il gate corrente è `pending` e la session authority corrisponde.

Una conferma valida non viene persistita immediatamente. Il percorso è:

```txt
validazione conferma
→ applicazione identity effettiva in memoria
→ bootstrap dei campioni bufferizzati
→ se bootstrap riuscito: upsert nel confirmation store
→ recording
```

Se il bootstrap fallisce, restituisce un esito non positivo oppure la stessa `bufferGeneration` è già stata tentata, il gate torna `pending`, non crea una nuova confirmation persistita e segnala `bootstrap_persistence_failed`.

Se l'upsert nel confirmation store fallisce dopo un bootstrap riuscito, il gate torna `pending` e segnala `persistence_failed`. Le scritture canoniche già completate dal bootstrap non vengono però annullate: confirmation store e commit cross-source non costituiscono una singola transazione filesystem.

## Session authority

Ogni nuovo Start crea una `trackingSessionId`, la restituisce al frontend e la associa al tracker e al Source Identity Gate correnti.

La session authority è usata in più punti del percorso live:

- gli update SofaScore e Betfair verificano che la sessione sia ancora corrente prima di applicare i risultati e prima dell'eventuale persistenza;
- il gate rifiuta osservazioni e conferme con `trackingSessionId` stale;
- il lifecycle dello scraper Betfair distingue le esecuzioni anche per `trackingSessionId`, evitando il riuso silenzioso di uno scraper appartenente a uno Start diverso;
- il frontend conserva la `trackingSessionId` restituita dallo Start e la usa per il bootstrap della dashboard e per la conferma manuale;
- dopo una conferma manuale il frontend considera completato il passaggio soltanto se il gate torna `recording` e `aligned` per la stessa sessione.

`bufferGeneration` protegge i tentativi interni del gate, ma non sostituisce la `trackingSessionId`.

Il confine di sessione non è però persistito end-to-end: history, timeline e diverse letture canoniche restano indicizzate principalmente per `eventId` e non dimostrano da sole a quale Start apparteneva il dato. La protezione delle callback live e la provenance dei dati già persistiti sono quindi proprietà distinte.

## Persistenza canonica

Percorso locale principale:

```txt
backend/match_history/
├─ dati canonici per evento
├─ .pending_commits/
└─ .writer_authority/
```

| Artefatto            | Ruolo                                                               |
| -------------------- | ------------------------------------------------------------------- |
| Timeline SofaScore   | Sequenza dei tick canonici di campo                                 |
| Timeline Betfair     | Sequenza dei tick canonici di mercato e della diagnostica associata |
| History aggregata    | Vista business compatta                                             |
| `.pending_commits/`  | Journal sidecar dei commit logici incompleti                        |
| `.writer_authority/` | Ownership esclusiva della storage identity                          |

### Commit per fonte

SofaScore e Betfair usano commit logici journalizzati che coordinano history e timeline della stessa fonte.

Il journal viene creato prima delle scritture, contiene i target e i payload necessari al repair e marca i documenti completati. Se esiste già un commit pending per la stessa coppia evento/fonte, il percorso di persistenza tenta prima di completarlo anziché creare un nuovo commit concorrente.

Ogni nuovo commit canonico assegna un `commitId` condiviso fra i documenti del commit. I tick Betfair canonici ricevono inoltre un `seq` finito e crescente rispetto alla vista canonica della timeline.

Gli stati pubblici di integrity sono:

```txt
no_known_partial
partial_persistence
recovery_failed
```

`partial_persistence` e `recovery_failed` descrivono la persistenza. Non sono sinonimi di health Betfair, Source Identity mismatch, freshness stale o errore frontend.

### Recovery

La recovery dei journal pending viene eseguita durante il bootstrap del backend, dopo l'acquisizione della writer authority e prima dell'apertura del listener.

Per un journal che dichiara entrambi i documenti completati, la recovery verifica anche che i target esistano e siano leggibili come JSON. Se un target completato è mancante o invalido, il relativo documento viene riaperto come incompleto e il commit viene riparato dal payload journalizzato.

La recovery è separata dalle route di lettura: le API non devono trasformare una GET in un'operazione di repair.

### `repairOnly`

Un campione Betfair tecnicamente inutilizzabile può essere passato alla persistenza con `repairOnly`.

`repairOnly` può completare un commit Betfair già pendente. Se non esiste un pending da riparare, restituisce un esito invariato: non crea un nuovo `commitId`, non aggiunge un nuovo tick e non aggiunge una nuova riga sample-derived alla history.

### Confini della transazione

Il journal rende recuperabile il commit history + timeline della singola fonte, ma non crea una transazione unica fra:

- commit SofaScore e commit Betfair;
- bootstrap cross-source e confirmation store;
- session authority live e provenance persistita del dato.

Questi confini spiegano perché integrity, Source Identity e session authority restano concetti separati nel lifecycle.

## Status-only Graph

Un campione regressivo viene normalmente escluso dal nuovo commit canonico. Esiste un'eccezione stretta quando:

- esiste un precedente tick Betfair canonico;
- il campione segnala esplicitamente `graphLoginRequired`;
- non contiene nuove righe Graph valide;
- la timeline integrity del campione lo considera regressivo/non accettato.

In questo caso viene costruita una nuova osservazione status-only:

```txt
ultimo tick Betfair canonico
+ graphLoginRequired
+ zero righe Graph valide
→ nuovo tick timeline Betfair status-only
```

Il nuovo tick:

- riceve nuovi `seq` e `commitId` tramite il normale percorso di commit;
- conserva mercato, runner, quote e ladder dal precedente tick canonico;
- non adotta i valori regressivi del nuovo campione;
- non aggiunge una nuova riga business Betfair alla history;
- espone la ladder come non utilizzabile per lo stato corrente;
- sostituisce Money Flow con `confidence: suppressed` e `reason: graph_login_required`;
- conserva la diagnostica necessaria a classificare il problema Graph come possibile autenticazione richiesta;
- può diventare il precedente tick canonico usato dalla valutazione del tick successivo.

Non è quindi corretto descrivere questo caso come “nessuna scrittura”: è un nuovo tick canonico di stato tecnico senza adozione dei valori regressivi.

## Stop live e shutdown terminale

Stop live e shutdown terminale hanno scopi diversi.

### Stop live

La route di Stop live:

- svuota il tracking logico e ferma gli scheduler;
- rimuove i gate correnti;
- termina i processi Python nello scope `tracking`;
- non esegue il drain terminale di `activeTrackerOperations`.

Le Promise Node già registrate in `activeTrackerOperations` possono quindi continuare fisicamente dopo lo Stop ordinario. Gli update SofaScore e Betfair verificano però la sessione corrente in checkpoint successivi: quando lo Stop ha rimosso la sessione, un risultato tardivo viene scartato come stale prima di una nuova applicazione autorizzata.

Quiescenza fisica delle operazioni già avviate e rifiuto logico dei risultati stale sono proprietà distinte.

Sul frontend lo Stop disattiva la sessione, azzera la `trackingSessionId` corrente e ferma esplicitamente il polling SofaScore; gli altri consumer condizionati da `sessionActive` vengono disabilitati e i rispettivi hook invalidano o abortiscono le richieste attive.

### Shutdown terminale

Lo shutdown del processo applica invece una barrier globale:

```txt
server.close richiesto
→ terminal tracker barrier
→ stop tracker e scheduler
├─ drain di activeTrackerOperations
└─ cleanup dei processi Python
→ attesa completamento drain e chiusura listener
→ verifica drain: ok && drained && activeOperations == 0
→ release writer authority solo se il drain è verificato
→ chiusura processo
```

Il drain tracker e il cleanup Python possono procedere in parallelo; il release della writer authority avviene soltanto dopo la chiusura del listener e dopo la verifica positiva del drain.

Se il drain fallisce, restituisce un risultato invalido oppure lascia operazioni attive, la writer authority viene mantenuta. Anche il force timeout non autorizza un release anticipato dell'authority.

I dettagli operativi appartengono a [Runtime locale](../operations/01-local-runtime.md) e [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md).

## Classi di lettura

| Classe | Esempi | Vincolo |
| ----------------- | --------------------------------------- | ----------------------------------------------------------------- |
| Persistita        | timeline, history, Evidence             | Nessuna recovery o scrittura canonica                             |
| In memoria        | Source Identity status, runtime Betfair | Nessuna nuova authority di persistenza                            |
| Probe diagnostico | status CDP usato da Betfair latest      | Solo target loopback validato e richiesta temporaneamente bounded |

Le route Match e Betfair possono aggiungere `integrity` alle letture canoniche. Se il dato richiesto manca ma il journal segnala `partial_persistence` o `recovery_failed`, le relative route possono rispondere con conflitto di persistenza invece di trattare il caso come un semplice “not found”.

`GET /api/betfair/:eventId/latest` compone più classi di lettura: timeline Betfair e SofaScore persistite, runtime Betfair in memoria, integrity e, in modalità CDP, un probe a `/json/version`. Il probe è ammesso soltanto verso una base URL HTTP loopback validata e usa un timeout tramite `AbortController`.

Read-only significa assenza di mutazioni canoniche; non significa necessariamente assenza assoluta di I/O diagnostico di rete.

## Evidence

Evidence viene costruita a partire dalle timeline persistite, dall'integrity delle due fonti e, quando applicabile, dalla confirmation persistita di Source Identity.

```txt
timeline SofaScore + timeline Betfair
→ selezione tick / epoch
→ Source Identity automatica
→ eventuale confirmation persistita
→ integrity
→ Evidence
```

Evidence può esporre qualità, health, allineamento, flow, ladder, no-trade reasons e Market Reactions descrittive.

Quando l'identità non è allineata o la persistenza è incompleta, i confronti cross-source vengono sospesi o degradati. Evidence non usa lo stato live del gate per ricostruire retroattivamente la timeline, non esegue recovery, non modifica i dati canonici e non prova causalità fra campo e mercato.

## Poller frontend

I poller principali mantengono read model distinti, ma condividono protezioni di lifecycle locali al singolo hook.

| Poller                 | Protezione corrente                                                      |
| ---------------------- | ------------------------------------------------------------------------ |
| Match                  | generation hook-local, `AbortController`, scarto delle risposte stale    |
| Betfair                | generation hook-local, `AbortController`, scarto delle risposte stale    |
| Market Reactions       | generation hook-local, `AbortController`, scarto delle risposte stale    |
| Source Identity status | generation hook-local, `AbortController`, guard della richiesta corrente |

Le generation non costituiscono una authority globale: servono a invalidare il ciclo precedente del singolo hook.

Lo Start frontend diventa attivo soltanto dopo avere ricevuto una `trackingSessionId` valida dal backend. Il bootstrap della dashboard è legato alla stessa sessione e richiede anche che il read model SofaScore abbia attraversato il reset previsto prima di rendere il contenuto pronto.

Lo Stop imposta la sessione frontend come inattiva e azzera la `trackingSessionId`. I poller che ricevono input condizionati da `sessionActive` vengono disabilitati, mentre cleanup e cambi di generation invalidano o abortiscono le richieste in-flight.

Gli hook possono mantenere dati `lastKnown` separati dal read model corrente. Un dato `lastKnown` non dimostra di appartenere allo Start corrente e non sostituisce la provenance persistita mancante.

## Dati esclusi dal flusso canonico

Non sostituiscono timeline o history:

- dump browser e network capture;
- cache runtime e log;
- profili browser;
- snapshot latest isolati;
- dati simulati presentati come live;
- URL come prova dell'identità;
- numeri inventati per colmare dati assenti.

Questi elementi possono avere ruolo operativo o diagnostico, ma non diventano per questo authority canonica del dato.

## Documenti collegati

- [Confini del sistema](./01-system-boundaries.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
- [Tracking live](../modules/sofa/01-live-tracking.md)
- [Validità tecnica Betfair](../modules/betfair/02-technical-sample-validity.md)
- [Match Evidence Snapshot](../modules/evidence/01-match-evidence-snapshot.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Stato corrente](../roadmap/01-current-state.md)
