# Timeline e history: facade e contratti core

Questo documento è l’owner del boundary comune di persistenza canonica. Descrive gli artefatti timeline/history, la loro identità, le primitive comuni di discovery, lettura e scrittura e il confine fra facade e writer canonici.

I flussi specifici appartengono a [Persistenza SofaScore](./03-sofa-persistence.md) e [Persistenza Betfair](./04-betfair-persistence.md). Coordinamento multi-documento, integrità e recovery appartengono a [Commit journal e recovery](./02-commit-journal-and-recovery.md).

## Scopo

Timeline e history non sono equivalenti:

| Artefatto          | Ruolo                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Timeline SofaScore | Sequenza cronologica dei tick canonici SofaScore                                                 |
| Timeline Betfair   | Sequenza cronologica dei tick canonici Betfair                                                   |
| History aggregata  | Sequenza compatta di righe cross-source; non è una copia delle timeline e non conserva ogni poll |

Il runtime del tracker, le conferme Source Identity e il commit journal non sono timeline o history canoniche. Il journal è un sidecar tecnico: coordina la coppia di documenti, ma non la sostituisce.

## Boundary e ownership

Questa facade possiede:

- collocazione e identità dei file canonici;
- discovery univoca per `eventId` e sorgente;
- shape minima dei documenti;
- letture strutturate fail-closed;
- primitive di scrittura atomica per singolo file;
- API comuni e facade di compatibilità;
- distinzione fra stato preparato e stato cross-source committed.

Non possiede:

- materialità, deduplica e costruzione dei documenti SofaScore;
- validità tecnica, regressioni, status-only e costruzione dei documenti Betfair;
- lifecycle del journal, stato di integrità e recovery;
- acquisizione della writer authority;
- Source Identity, polling, scraper, API HTTP, Evidence o strategie.

## Collocazione e identità dei file

Gli artefatti sono collocati in:

```text
backend/match_history/
├── <date>_<tournament>_<home>_vs_<away>_<eventId>.json
├── sofa_<date>_<tournament>_<home>_vs_<away>_<eventId>.json
├── betfair_<date>_<tournament>_<home>_vs_<away>_<eventId>.json
├── .pending_commits/
└── .writer_authority/
```

I segmenti descrittivi vengono sanitizzati dagli helper di storage. Non costituiscono l’identità primaria e non devono essere usati dai consumer per ricostruire manualmente un path.

| Tipo               | Regola di discovery                                                                   |
| ------------------ | ------------------------------------------------------------------------------------- |
| History aggregata  | file JSON che termina in `_<eventId>.json` ed esclude i prefissi `sofa_` e `betfair_` |
| Timeline SofaScore | file JSON che inizia con `sofa_` e termina in `_<eventId>.json`                       |
| Timeline Betfair   | file JSON che inizia con `betfair_` e termina in `_<eventId>.json`                    |

I file temporanei contenenti `.tmp` sono esclusi. Per ciascuna identità, zero candidati significa `missing`, un candidato identifica il target, più candidati producono `ambiguous_storage_target`. Non viene selezionato automaticamente il primo file e non viene eseguito cleanup durante la discovery.

L’`eventId` deve essere valido prima della risoluzione. La timeline usa il validator condiviso `isValidEventId`; lo storage history richiede una stringa non vuota. Un’identità invalida non autorizza discovery, creazione o scrittura.

## Shape canoniche

La history persistita ha la forma minima:

```json
{
  "metadata": {},
  "history": []
}
```

La timeline persistita ha la forma minima:

```json
{
  "metadata": {},
  "timeline": []
}
```

Entrambi i documenti possono contenere altri campi top-level prodotti dai writer, per esempio `updatedAt`. La validazione del boundary richiede un documento oggetto, `metadata` oggetto e l’array coerente con il tipo.

`latest` non è un campo canonico persistito dalla primitive timeline. `loadTimelineResult()` lo deriva dall’ultimo elemento di `timeline`, oppure restituisce `null` per una timeline vuota.

## Timeline e history

### Timeline

Le timeline sono separate per sorgente. Conservano i tick canonici della singola sorgente secondo le regole di materialità del relativo owner.

La primitive generica `saveTimeline()`:

1. carica la timeline con il read result strutturato;
2. inizializza un documento soltanto se il risultato è `missing`;
3. unisce i metadata e prepara `updatedAt` in memoria;
4. confronta `entryData` con `lastEntry.data` tramite rappresentazione JSON;
5. se il dato è duplicato restituisce `unchanged` senza scrivere i metadata preparati;
6. altrimenti aggiunge un elemento con `timestamp`, `elapsedSeconds` e `data`;
7. delega la scrittura a `writeTimelineDocument()`.

`elapsedSeconds` è calcolato rispetto al timestamp del primo elemento; per il primo tick vale zero. I writer specifici possono costruire e scrivere documenti timeline completi tramite `writeTimelineDocument()` invece di usare la semantica legacy di `saveTimeline()`.

### History aggregata

La history contiene righe prodotte alternativamente dai writer SofaScore e Betfair. Una riga può includere la proiezione committed più recente della sorgente opposta. Non conserva ogni tick delle due timeline e non incorpora automaticamente lo snapshot SofaScore completo.

`saveHistory()` è una primitive di scrittura del documento completo; non decide la materialità e non costruisce le righe. Queste responsabilità restano nei writer specifici.

## Contratti di lettura

Le API autorevoli per i writer sono `loadHistoryResult()` e `loadTimelineResult()`.

| `status`  | `reason`                   | Significato                                      | Inizializzazione |
| --------- | -------------------------- | ------------------------------------------------ | ---------------- |
| `found`   | `null`                     | target unico, leggibile e con shape valida       | non necessaria   |
| `missing` | `null`                     | nessun target canonico                           | consentita       |
| `failed`  | `invalid_event_id`         | identità non valida                              | vietata          |
| `failed`  | `ambiguous_storage_target` | più target compatibili                           | vietata          |
| `failed`  | `discovery_failed`         | contenuto della directory non determinabile      | vietata          |
| `failed`  | `read_failed`              | target non leggibile                             | vietata          |
| `failed`  | `invalid_json`             | contenuto non parsabile                          | vietata          |
| `failed`  | `invalid_shape`            | JSON leggibile ma non conforme alla shape minima | vietata          |

Solo `missing` equivale ad assenza inizializzabile. Ogni failure è fail-closed: un file corrotto, illeggibile, ambiguo o non conforme non viene trasformato in un documento vuoto e non autorizza overwrite.

I read result includono l’operazione, l’`eventId`, lo stato, la reason, il documento quando presente e il file risolto quando noto. Per la timeline includono anche la sorgente.

Le facade `loadHistory()` e `loadTimeline()` restituiscono il documento soltanto per `found` e `null` negli altri casi. Questa compatibilità perde intenzionalmente il dettaglio fra `missing` e `failed`: i writer canonici devono quindi usare le API `*Result()`.

## Contratti di scrittura

Le primitive comuni sono:

```text
saveHistory(eventId, historyData, metadata = {}, commitId = null)
writeHistoryDocument(eventId, historyData, metadata = {}, target = null, commitId = null)

saveTimeline(source, eventId, entryData, metadata = {}, commitId = null)
writeTimelineDocument(source, eventId, timelineObj, metadata = {}, target = null, commitId = null)
```

I risultati di scrittura sono strutturati:

```json
{
  "ok": true,
  "operation": "history | timeline",
  "source": "sofa | betfair | null",
  "eventId": "...",
  "status": "written | unchanged | failed",
  "reason": null,
  "file": "...",
  "commitId": "... | null"
}
```

`unchanged` è prodotto dalla primitive `saveTimeline()` quando il dato dell’ultimo tick è identico. Le primitive di documento completo restituiscono `written` oppure `failed`. `ok` è falso soltanto per `failed`.

Quando viene fornito un target esplicito, il writer lo accetta soltanto se coincide con il target risolto per l’identità canonica. Un target assente, discordante o non risolvibile produce `write_failed`. Il `commitId` stringa viene propagato nel risultato; la primitive non ne determina il lifecycle.

## Atomicità per singolo file

History e timeline usano lo stesso schema:

```text
serializzazione JSON in memoria
→ scrittura di un file temporaneo nella directory del target
→ rename sul target canonico
```

Se write o rename falliscono, il writer tenta di rimuovere il temporaneo e restituisce `failed/write_failed`. L’atomicità riguarda un singolo file. Non rende atomica la coppia history/timeline: il commit logico recuperabile è responsabilità del journal.

`writeTimelineDocument()` è la primitive centralizzata per la riscrittura di un documento timeline completo. Anche i flussi specifici e il cleanup legacy Betfair devono attraversare questo boundary anziché scrivere direttamente il target canonico.

## API pubblica e facade

### `matchHistory.js`

| Export                              | Ruolo                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `getHistoryFile(eventId)`           | restituisce l’unico target history esistente o `null`; non distingue missing e failure |
| `loadHistory(eventId)`              | facade legacy di lettura                                                               |
| `loadHistoryResult(eventId)`        | lettura strutturata autorevole                                                         |
| `saveHistory(...)`                  | primitive di scrittura del documento history completo                                  |
| `addSofaUpdate(...)`                | ingresso pubblico del writer canonico SofaScore                                        |
| `prepareBetfairHistory(...)`        | prepara documento, riga e stato Betfair senza effettuare il commit canonico            |
| `addBetfairUpdate(...)`             | facade di compatibilità prepare-only                                                   |
| `getBetfairCommitDependencies()`    | wiring delle primitive necessarie al processor Betfair                                 |
| `getCommitRecoveryDependencies()`   | wiring delle primitive necessarie alla recovery                                        |
| `getMatchPersistenceIntegrity(...)` | vista normalizzata read-only dello stato esposto dal journal                           |

Il commit Betfair non appartiene ad `addBetfairUpdate()`: il processor di persistenza è l’unico owner della scrittura journalizzata di history e timeline Betfair.

### `timelineStore.js`

| Export                                       | Ruolo                                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `getTimelineFile(source, eventId, metadata)` | restituisce il target esistente oppure propone il target per una nuova timeline; `null` su failure di discovery |
| `loadTimeline(source, eventId)`              | facade legacy di lettura                                                                                        |
| `loadTimelineResult(source, eventId)`        | lettura strutturata autorevole e derivazione di `latest`                                                        |
| `saveTimeline(...)`                          | append generico con deduplica dell’ultimo `data`                                                                |
| `writeTimelineDocument(...)`                 | scrittura atomica del documento completo                                                                        |

## Stato cross-source committed

La facade `matchHistory.js` mantiene per processo `latestSofaState` e `latestBetfairState`. I writer possono usare la proiezione della sorgente opposta per costruire una riga history, ma preparazione e commit non sono sinonimi.

La preparazione Betfair restituisce un `committedState` candidato. La promozione nella mappa condivisa avviene attraverso la dependency `commitBetfairState()` soltanto dopo il successo del commit journalizzato, oppure nel percorso di recovery previsto dall’owner dedicato. Analogamente, il writer SofaScore gestisce la propria promozione in relazione all’esito del commit.

Di conseguenza, failure, partial commit e semplice preparation non devono diventare stato condiviso visibile alla sorgente opposta. I dettagli del momento di promozione appartengono agli owner SofaScore, Betfair e journal/recovery.

## Precondizioni esterne

### Writer authority

Il processo backend deve acquisire la writer authority esclusiva per repository e storage identity prima di recovery, listener e runtime. L’authority vive in:

```text
backend/match_history/.writer_authority/
```

È un sidecar process-level, non un artefatto canonico. Le primitive `saveHistory()`, `saveTimeline()` e i writer business non acquisiscono né verificano autonomamente l’authority: la protezione cross-process è una precondizione garantita dall’avvio del backend. Una chiamata diretta alle primitive non è automaticamente protetta da writer concorrenti.

### Source Identity

Nel live tracking con Betfair, Source Identity è una precondizione esterna alla persistenza. I call site del tracking decidono quando i writer possono essere invocati; le primitive storage non calcolano, modificano o ricostruiscono il gate.

Questo documento non possiede gli stati e il lifecycle del gate. Il contratto rilevante per il core storage è soltanto che l’autorizzazione deve essere stabilita prima della scrittura canonica.

## Failure semantics

```text
missing
→ inizializzazione consentita

invalid_event_id / ambiguous_storage_target / discovery_failed
→ target non affidabile
→ nessuna creazione o selezione automatica

read_failed / invalid_json / invalid_shape
→ contenuto non affidabile
→ nessun overwrite

write_failed
→ commit del documento non confermato
→ risultato strutturato failed
```

Una failure di lettura non equivale a `missing`, `unchanged` o not found. Un risultato preparato non equivale a un documento committed. Un esito di scrittura assente o incoerente non deve essere interpretato come successo dai writer coordinati.

## Mappa implementativa

| Boundary                                        | Implementazione                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| Timeline: discovery, read result e atomic write | `backend/src/sofa/timelineStore.js`                                    |
| Facade history e wiring cross-source            | `backend/src/sofa/matchHistory.js`                                     |
| History: discovery, read result e atomic write  | `backend/src/sofa/matchHistory/storage.js`                             |
| Writer SofaScore                                | `backend/src/sofa/matchHistory/sofaUpdates.js` e `sofaUpdates/`        |
| Preparazione history Betfair                    | `backend/src/sofa/matchHistory/betfairUpdates.js`                      |
| Commit canonico Betfair                         | `backend/src/sofa/betfair/processor/persistence.js` e moduli collegati |
| Writer authority                                | `backend/src/runtime/matchHistoryWriterAuthority.js`                   |
| Journal e recovery                              | `backend/src/sofa/matchHistory/commitJournal.js` e `recovery.js`       |

## Verifica

La verifica del core storage deve coprire almeno:

| Area             | Invariante                                                                     |
| ---------------- | ------------------------------------------------------------------------------ |
| Discovery        | zero/uno/più candidati restano distinti                                        |
| Lettura          | invalid JSON, invalid shape e read failure non autorizzano overwrite           |
| Timeline legacy  | duplicato dell’ultimo `data` produce `unchanged` senza metadata-only write     |
| Target           | un target esplicito discordante viene rifiutato                                |
| Atomic write     | failure del rename non conferma la scrittura e tenta il cleanup del temporaneo |
| Writer SofaScore | risultati history/timeline e stato condiviso rispettano il commit              |
| Writer Betfair   | preparation resta separata dal commit canonico e dalla promozione di stato     |
| Recovery         | una coppia parziale resta osservabile e riparabile dall’owner del journal      |

Le suite direttamente pertinenti sono quelle dedicate a timeline store, discovery/read storage, contratti dei writer SofaScore, preparazione history Betfair, commit/recovery Betfair e commit journal. I nomi concreti delle suite devono essere presi dalla baseline di codice, senza trasformare questo documento in un runbook esaustivo.

## Confini

La persistenza canonica non deve:

- avviare scraper, browser o polling;
- costruire payload HTTP;
- calcolare o modificare Source Identity;
- interpretare strategie o causalità;
- usare dump browser come dati canonici;
- trasformare runtime health in timeline/history;
- trattare un duplicate o una regressione come fine mercato;
- esporre path locali o payload journalizzati attraverso contratti pubblici.

## Documenti collegati

- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
- [Commit journal e recovery](./02-commit-journal-and-recovery.md)
- [Persistenza SofaScore](./03-sofa-persistence.md)
- [Persistenza Betfair](./04-betfair-persistence.md)
- [Tracking live](../sofa/01-live-tracking.md)
- [Contesto locale e point-by-point](../sofa/02-local-context-and-point-by-point.md)
- [Validità tecnica dei campioni Betfair](../betfair/02-technical-sample-validity.md)
- [API Match](../../api/01-match.md)
- [API Betfair](../../api/02-betfair.md)
- [API Evidence](../../api/03-evidence.md)
