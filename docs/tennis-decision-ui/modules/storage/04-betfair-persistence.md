# Persistenza Betfair

## Scopo

Documentare il writer canonico Betfair: decisione di persistenza, preparazione coordinata di history e timeline, commit journalizzato, gestione dello stato committed e riparazione Betfair da journal.

## Stato

Il processor Betfair è l’owner del commit canonico. `prepareBetfairHistory()` costruisce il candidato history senza promuovere lo stato condiviso; `addBetfairUpdate()` rimane la facade legacy prepare-only.

## Responsabilità

Questo owner governa:

- la classificazione dell’azione di persistenza dopo la validazione tecnica del sample;
- il caricamento e il filtraggio della timeline Betfair canonica;
- deduplicazione, controllo delle regressioni ed eccezione status-only per logout Graph;
- la preparazione dei documenti history e timeline con lo stesso `commitId`;
- il commit logico history → timeline coordinato dal journal;
- la promozione di `latestBetfairState` soltanto dopo un nuovo commit completo;
- il restore del risultato elaborato dagli artefatti journalizzati durante il recovery;
- il cleanup best-effort delle entry timeline legacy dopo un commit o recovery riuscito.

Non decide l’avvio dello scraper, il login, il polling, la Source Identity o la validità tecnica del campione: tali decisioni appartengono ai rispettivi owner a monte.

## Flusso di persistenza

```text
sample già elaborato
→ eventuale pending Betfair: repair dal journal e ritorno
→ eventuale repairOnly senza pending: unchanged
→ verifica e cleanup di un completed residual
→ classificazione tecnica
→ lettura e filtro della timeline canonica
→ decisione unchanged oppure commit
→ preparation history e timeline senza promotion
→ pending journal
→ write history e marker completed
→ write timeline e marker completed
→ rimozione journal completed
→ promotion latestBetfairState
→ cleanup legacy best-effort
```

Un pending commit ha precedenza sul sample corrente. Il repair usa documenti, metadata, target e `commitId` già registrati nel journal; non ricostruisce il commit dal nuovo sample.

## Decisione di persistenza

`evaluateBetfairPersistenceDecision()` restituisce una delle seguenti azioni logiche:

| Condizione                                                     | Azione      | Motivo osservabile   |
| -------------------------------------------------------------- | ----------- | -------------------- |
| sample tecnicamente inutilizzabile                             | `unchanged` | `null`               |
| lettura timeline fallita                                       | `failed`    | motivo della lettura |
| sample rifiutato da `timelineIntegrity`, senza eccezione Graph | `unchanged` | `regressive_tick`    |
| regressione rispetto all’ultimo tick algoritmico               | `unchanged` | `regressive_tick`    |
| duplicato dell’ultimo tick algoritmico                         | `unchanged` | `duplicate_tick`     |
| sample materiale oppure eccezione status-only valida           | `commit`    | —                    |

Gli esiti `unchanged` non creano journal e non scrivono history o timeline. La deduplicazione e la regressione operano sulla vista canonica filtrata, non sull’intero file letto.

## Timeline canonica

`toCanonicalTimelineView()` conserva esclusivamente le entry che hanno:

```text
data.source = betfair
data.seq finito
data.runners array
```

Le entry legacy, con sorgente diversa, shape non canonica o `seq` non finito sono escluse dalla vista impiegata per deduplica, regressione e costruzione del nuovo documento. Il campo top-level `latest` non viene riportato nella vista né nel documento ricostruito.

Il nuovo tick riceve:

- il prossimo `seq` canonico;
- lo stesso `commitId` usato per history, journal e writer;
- `elapsedSeconds` calcolato dal timestamp della prima entry canonica;
- metadata preservati e aggiornati con `eventId`, `source: betfair`, player e URL Betfair.

Se non esiste una timeline, il documento parte con metadata e array `timeline` vuoti. Se `loadTimelineResult()` restituisce `failed`, la persistenza non tratta l’errore come assenza e non esegue il bootstrap.

## History Betfair

`prepareBetfairHistory()` legge la history distinguendo `found`, `missing` e `failed`. Un risultato `failed` blocca la preparazione; `missing` consente la creazione del documento iniziale.

La preparation:

- clona il documento già letto prima di modificarlo;
- preserva e completa i metadata;
- costruisce una row con la projection Sofa più recente, se disponibile;
- costruisce la projection Betfair e lo stato candidato;
- aggiunge `commitId` soltanto alla nuova row effettivamente accodata;
- restituisce `committedState` senza aggiornare direttamente `latestBetfairState`.

La rappresentazione usata per deduplicare le row history comprende il totale matched del mercato e, per ogni runner ordinato deterministicamente per `selectionId`, nome, Money Flow back/lay e WOM. L’ordine in ingresso dell’array non determina quindi un cambiamento.

### Runner identity e campi persistiti

`selectionId` è l’identità primaria del runner. Un nome uguale non sostituisce l’identità e un cambio di nome non crea un’identità alternativa.

La row history Betfair conserva, per ciascun runner:

```json
{
  "name": "nome osservato",
  "selectionId": "identità primaria",
  "moneyFlow": "oggetto o fallback della preparation",
  "wom": "valore osservato",
  "ladder": "array",
  "ladderSource": "sorgente o null",
  "ladderStats": "oggetto o null",
  "matchedTotal": "numero o null",
  "totalMatchedOnSelection": "numero o null",
  "lastTradedPrice": "numero o null"
}
```

`matchedTotal` e `totalMatchedOnSelection` restano campi distinti. Se `matchedTotal` non è finito, la preparation usa `totalMatchedOnSelection` come fallback per il solo `matchedTotal`; l’assenza di `totalMatchedOnSelection` resta invece `null`.

Il totale del mercato appartiene a `market_info.total_matched` e alla projection `betfair.totalMatched`; non va confuso con i totali del singolo runner.

## Status-only per logout Graph

L’eccezione status-only è riconosciuta soltanto quando sono vere tutte le condizioni seguenti:

```text
esiste un ultimo tick algoritmico
diagnostics.graphLoginRequired = true
graph_diagnostics.graphRowsTotal = 0
timelineIntegrity.accepted = false
```

In questo caso il sample può arrivare al commit nonostante il rifiuto di `timelineIntegrity`. La history viene preparata con `append: false`: il documento partecipa comunque al commit logico, ma non riceve una nuova row raw. La timeline riceve invece il tick status-only canonico con nuovo `seq` e `commitId`.

Il tick status-only preserva la baseline canonica e segnala il logout Graph: la history non riceve una nuova row raw, mentre la timeline riceve il tick costruito a partire dall’ultimo tick algoritmico. Il commit completo segue comunque il normale percorso di promozione del `committedState` restituito dalla preparation. Fuori da questa eccezione, un sample regressivo produce `unchanged` e nessuna scrittura.

## Preparazione dei documenti

`prepareBetfairPersistenceDocuments()` prepara congiuntamente:

| Documento | Contenuto candidato                                        | Target                            |
| --------- | ---------------------------------------------------------- | --------------------------------- |
| history   | documento completo restituito da `prepareBetfairHistory()` | `resolveHistoryFile()`            |
| timeline  | vista canonica più il nuovo tick                           | `getTimelineFile('betfair', ...)` |

La preparation fallisce se il risultato history non è `ok`, oppure non contiene documento o metadata. Nessun writer viene invocato prima che entrambi i candidati e i rispettivi target siano disponibili.

## Commit journalizzato

Il commit Betfair usa un solo `commitId` canonico per journal, row history, tick timeline e risultati dei writer.

```text
createPendingCommit
→ rilettura del pending persistito
→ writeHistoryDocument
→ mark history completed
→ writeTimelineDocument
→ mark timeline completed
→ removeCompletedCommit
```

Un writer è considerato riuscito soltanto se il risultato è valido per il target e il `commitId` attesi. Un risultato assente, non-ok, riferito a un altro target o a un altro `commitId` è una failure di persistenza.

| Punto di failure                     | Stato restituito | Effetto                                         |
| ------------------------------------ | ---------------- | ----------------------------------------------- |
| creazione/rilettura journal          | `failed`         | nessun commit considerato valido                |
| write history                        | `failed`         | history e timeline restano pending              |
| marker history                       | `failed`         | timeline non viene scritta                      |
| write timeline dopo history completa | `partial`        | history resta completa, timeline pending        |
| marker timeline                      | `failed`         | journal non può essere completato correttamente |
| cleanup journal completed            | `failed`         | nessuna promotion dello stato candidato         |

Solo dopo il risultato `complete` il processor chiama `commitBetfairState(eventId, committedState)`, compila la history nel `processedResult` e avvia il cleanup legacy.

## Stato committed

La preparation non modifica `latestBetfairState`. Nel percorso di un nuovo commit, la promotion esplicita avviene esclusivamente dopo history, timeline e cleanup del journal completati con successo.

```text
nuovo sample
→ candidate prepared
→ complete
→ latestBetfairState promoted

nuovo sample
→ unchanged / failed / partial
→ latestBetfairState invariato
```

Lo status-only prepara comunque uno stato candidato e, dopo un commit completo, il processor lo promuove attraverso il normale `commitBetfairState()`. Separatamente, la costruzione del tick status-only conserva mercato e runner dell’ultimo tick algoritmico invece di adottare questi dati dal sample regressivo.

## Recovery e retry

Se esiste un pending Betfair, `repairPendingBetfairCommit()` viene eseguito prima della validazione del sample corrente. Per ciascun documento incompleto:

1. valida il payload di repair;
2. riscrive esattamente il documento journalizzato sul target registrato;
3. verifica il risultato del writer contro target e `commitId`;
4. marca il documento come completo;
5. rimuove il journal soltanto quando entrambi i documenti risultano completi.

Un record con stato `recovery_failed` blocca nuove scritture e restituisce `recovery_required`. Un retry può quindi riparare lo stesso commit mantenendo `commitId`, documento e `seq` originari anche quando il sample corrente è tecnicamente inutilizzabile.

Dopo un recovery riuscito, il processor:

- ricompila `processedResult.history` dal documento history journalizzato;
- applica al `processedResult` l’ultimo tick Betfair del documento timeline recuperato;
- esegue il cleanup legacy best-effort;
- restituisce `status: recovered`.

Questo ramo non chiama direttamente `commitBetfairState()`. Il restore dei runner associa il tick recuperato ai runner correnti tramite `selectionId` e ripristina, quando presenti, matched totals, last traded price, book, ladder, Money Flow, dati di mercato e stato evento.

Un completed residual viene verificato e rimosso prima di un nuovo commit. Se verifica o cleanup falliscono, il nuovo commit viene bloccato con `journal_cleanup_failed`.

## Cleanup legacy

Dopo un commit `complete` o un recovery riuscito, `cleanupLegacyBetfairTimeline()` viene eseguito come operazione best-effort. Un suo fallimento produce `legacyWarning`, ma non invalida il risultato canonico già completato o recuperato.

Il filtraggio della timeline canonica assicura inoltre che entry legacy o con `seq` non finito non vengano riportate nel successivo documento canonico.

## Confini

Questo documento non possiede:

- scraping, login, polling, browser o UI;
- classificazione tecnica interna del sample;
- Source Identity e autorizzazione del tracking;
- implementazione generale di file discovery, scrittura atomica e naming;
- schema, sicurezza e lifecycle generale del commit journal;
- recovery globale al bootstrap del server;
- runtime health e contratti API pubblici.

Il journal e la recovery generale restano nell’owner dedicato. Qui sono descritti soltanto il workflow Betfair che li invoca e il repair Betfair-specifico necessario a comprenderne il comportamento.

## Riferimenti implementativi

```text
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/processor/persistence.js
backend/src/sofa/betfair/processor/persistenceDecision.js
backend/src/sofa/betfair/processor/persistenceDocuments.js
backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js
backend/src/sofa/betfair/processor/persistenceDependencies.js
backend/src/sofa/betfair/processor/canonicalTimeline.js
backend/src/sofa/betfair/processor/journalRecovery.js
```

## Verifica

Dalla cartella `backend/src`:

```text
node sofa/matchHistory/betfairUpdates.test.mjs
node sofa/betfair/processor/persistenceCommit.test.mjs
node sofa/betfair/processor/persistenceRecovery.test.mjs
node sofa/betfair/processor/canonicalTimeline.test.mjs
node sofa/betfair/processor/runtimeOrchestration.test.mjs
```

Le suite coprono almeno:

- preparation history senza promotion e preservazione dei campi runner;
- separazione tra missing e failure di lettura history;
- deduplica history indipendente dall’ordine dei runner;
- propagazione dello stesso `commitId`;
- failure dei writer, mismatch di target/`commitId` e partial timeline;
- retry dal payload journalizzato senza ricostruzione dal sample;
- blocco su `recovery_failed`;
- esclusione di entry legacy e `seq` non finiti;
- deduplica, regressione ed eccezione status-only senza nuova row history;
- assenza di mutazioni runner runtime per sample tecnico recuperato o unchanged.

## Documenti collegati

- [Timeline e history](./01-timelines-and-history.md)
- [Commit journal e recovery](./02-commit-journal-and-recovery.md)
- [Persistenza SofaScore](./03-sofa-persistence.md)
- [Validità tecnica dei campioni Betfair](../betfair/02-technical-sample-validity.md)
- [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
- [Scraper Betfair Python](../python/03-betfair-scraper.md)
- [API Betfair](../../api/02-betfair.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
