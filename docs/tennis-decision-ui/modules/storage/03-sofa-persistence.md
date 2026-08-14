# Persistenza SofaScore

## Scopo

Descrivere il writer SofaScore: lettura dello stato persistito, decisione di materialità della history e della timeline Sofa, costruzione dei documenti candidati, commit journalizzato e aggiornamento dello stato SofaScore condiviso in memoria.

Le primitive comuni di discovery, lettura e scrittura appartengono alla facade Storage. Il formato e il ciclo di vita del journal, l'integrity status e la recovery di bootstrap appartengono agli owner dedicati.

## Ingresso e risultato

La facade pubblica espone:

```text
addSofaUpdate(eventId, sofaData, tournamentName, date, timelineData = null)
```

`timelineData`, quando presente, separa il contenuto del tick dal payload usato dalla history:

```text
timelineData.snapshot     → snapshot del tick; fallback a sofaData
timelineData.localContext → contesto locale del tick; fallback a null
```

Il writer restituisce sempre un risultato `sofa_commit` strutturato con `ok`, `eventId`, `commitId`, `status`, `reason`, `failedDocument`, risultato dei documenti e warnings. Gli stati prodotti dal flusso ordinario sono:

| Stato       | Significato                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------- |
| `unchanged` | history e timeline non presentano cambiamenti materiali; non viene creato un commit         |
| `complete`  | il commit nuovo o ripreso ha completato entrambi i documenti ed è stato rimosso dal journal |
| `partial`   | una parte del commit è stata scritta o marcata, ma il workflow non è completo               |
| `failed`    | il commit non può iniziare o proseguire in modo valido                                      |

## Flusso

```text
sample autorizzato dal chiamante
→ ricerca di un pending Sofa per eventId
→ resume del pending, se presente
→ verifica e cleanup di un eventuale completed residual
→ lettura history e timeline
→ confronto separato di history e timeline
→ unchanged, se entrambi invariati
→ costruzione dei candidati con un unico commitId
→ creazione del pending journal con history e timeline
→ write/mark history
→ write/mark timeline
→ rimozione del journal completato
→ promozione di latestSofaState
```

Un pending preesistente ha precedenza sul sample corrente: viene ripreso dal payload, dai metadata, dai target e dal `commitId` conservati nel journal. Lo stato `recovery_failed` non viene riscritto dal writer ordinario e produce `failed` con reason `recovery_required`.

## Letture fail-closed

La history viene costruita da `loadHistoryResult(eventId)`:

* `found` clona il documento esistente;
* `missing` inizializza metadata e array `history`;
* `failed` interrompe il flusso prima di qualsiasi journal o write.

La timeline usa `loadTimelineResult('sofa', eventId)` quando disponibile. Uno stato `failed` interrompe il flusso prima della creazione del commit; `found` fornisce il documento esistente, mentre gli altri casi iniziano da una timeline vuota.

Il writer non decide i path canonici: richiede alla facade i target history e timeline e blocca il commit se uno dei due non è una stringa non vuota.

## Materialità

History e timeline hanno confronti distinti. Questa separazione decide se aggiungere una nuova riga history e se il poll è interamente invariato; non rende indipendenti i due file nel commit. Ogni commit Sofa nuovo contiene sempre i documenti candidati `history` e `timeline` sotto lo stesso `commitId`.

### History aggregata

Una nuova riga viene aggiunta quando cambia almeno una delle seguenti componenti rispetto all'ultima riga:

```text
sofa.score
sofa.serving
sofa.stats
sofa.status
sofa.surface
projection Betfair persistibile
```

La projection Betfair confrontata è limitata a:

```text
totalMatched
runners[].selectionId
runners[].name
runners[].wom
runners[].moneyFlow.back
runners[].moneyFlow.lay
```

I runner vengono ordinati per `selectionId` prima del confronto. `totalMatched` finito numerico viene reso confrontabile come stringa, quindi valori come `200` e `"200"`, incluso lo zero, sono equivalenti. Assenza e presenza della projection Betfair restano differenti.

Campi quali prezzi back/lay, ladder, ladder stats e matched total del runner non partecipano alla deduplica della riga Sofa. Quando una riga viene aggiunta, conserva tuttavia per ciascun runner `selectionId`, nome, WOM, primo prezzo back/lay e `moneyFlow`, oltre al `totalMatched` di mercato.

Ogni nuova riga contiene:

```text
timestamp
commitId
sofa { score, serving, stats, status, surface }
betfair | null
```

`localContext` non appartiene alla history aggregata.

### Timeline Sofa

La timeline considera invariato il poll soltanto quando l'ultimo tick contiene `snapshot` e `localContext` JSON-equivalenti ai valori candidati. Un cambiamento esclusivo di point-by-point incluso nello snapshot o di `localContext`, compresa la relativa `dataQuality`, rende quindi materiale la timeline anche a score invariato.

Quando il commit viene creato, il writer aggiunge sempre un tick, anche se il solo cambiamento rilevato appartiene alla projection Betfair della history. Il tick contiene:

```text
source = sofa
snapshot
localContext
timestamp e ts
seq
eventId
players, score, status, serving, stats
diagnostics
commitId
```

`seq` è pari al massimo `data.seq` numerico già presente più uno. Il wrapper della voce timeline contiene inoltre `timestamp` ed `elapsedSeconds`, calcolato dal timestamp della prima voce. Prima dell'append viene rimossa l'eventuale view derivata `latest`; metadata esistenti e player metadata vengono uniti con quelli del nuovo documento.

### Matrice effettiva

| History         | Timeline  | Riga history | Tick timeline | Documenti nel commit                         |
| --------------- | --------- | -----------: | ------------: | -------------------------------------------- |
| invariata       | invariata | no           | no            | nessuno; risultato `unchanged`               |
| cambiata        | cambiata  | sì           | sì            | history + timeline                           |
| invariata       | cambiata  | no           | sì            | history invariata + timeline aggiornata      |
| cambiata        | invariata | sì           | sì            | history aggiornata + timeline con nuovo tick |
| lettura fallita | qualunque | no           | no            | nessun commit e nessun overwrite             |

La quarta combinazione può verificarsi, per esempio, quando cambia la projection Betfair committed incorporata dalla history mentre snapshot e `localContext` Sofa restano uguali.

## Stato cross-source condiviso

La facade mantiene due mappe in memoria:

```text
latestSofaState
latestBetfairState
```

Il writer Sofa legge `latestBetfairState[eventId]` per costruire e confrontare la projection Betfair della nuova riga. Sul lato Betfair, la facade espone `commitBetfairState(eventId, state)`, usato per aggiornare quella mappa dopo il relativo commit.

`latestSofaState[eventId]` viene aggiornato soltanto quando il risultato restituito dal workflow è `ok: true` e `status: complete`. Il valore promosso è il parametro `sofaData` della chiamata che completa il workflow. Risultati `unchanged`, `partial` o `failed` non modificano la mappa.

## Source Identity

Il writer non calcola, verifica o modifica Source Identity. L'autorizzazione appartiene al tracking e deve avvenire prima della chiamata a `addSofaUpdate(...)`.

Di conseguenza, una chiamata diretta al writer non ricostruisce il gate. Gli outcome che non autorizzano la persistenza devono essere risolti dal chiamante senza affidarsi a un controllo interno di questo modulo.

## Commit journalizzato

Per un commit nuovo, lo stesso `commitId` viene inserito nel tick timeline, nel record journal, nel risultato finale e, quando viene aggiunta, nella nuova riga history. Il journal contiene entrambi i documenti candidati, inclusi payload, metadata e target.

```text
create pending
→ write history sul target registrato
→ verifica ok, target e commitId del writer
→ mark history complete
→ write timeline sul target registrato
→ verifica ok, target e commitId del writer
→ mark timeline complete
→ remove completed commit
```

Un risultato writer assente, non-ok, associato a un target diverso o a un `commitId` diverso non completa il documento. Se history non completa, timeline non viene scritta. Se history completa ma timeline non completa, il risultato è `partial` e il journal resta disponibile per il retry.

Il retry non ricostruisce i candidati dal nuovo sample:

* un documento già marcato complete non viene riscritto;
* un documento non marcato viene riscritto dal payload journalizzato;
* il `commitId`, i metadata e il target originali restano invariati;
* dopo il completamento di entrambi i documenti, il journal viene rimosso.

Un completed residual viene affidato a `verifyAndCleanupCompletedCommit(...)` quando disponibile; in caso contrario il writer usa la rimozione compatibile esposta dallo store. Un cleanup non riuscito blocca ogni nuovo write per quell'evento.

La recovery generale, la verifica semantica dei target completati e l'esposizione dell'integrity status sono descritte nell'owner del commit journal e della recovery.

## Confini

Il writer Sofa non:

* esegue discovery o implementa la scrittura atomica dei file;
* possiede schema, storage e recovery generale del commit journal;
* avvia tracking, polling, scraper o browser;
* costruisce payload HTTP;
* calcola runtime health o validità tecnica del sample;
* decide Source Identity;
* interpreta strategie o segnali operativi.

## Riferimenti implementativi

```text
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/sofaUpdates.js
backend/src/sofa/matchHistory/sofaUpdates/handler.js
backend/src/sofa/matchHistory/sofaUpdates/changeDetection.js
backend/src/sofa/matchHistory/sofaUpdates/historyDocument.js
backend/src/sofa/matchHistory/sofaUpdates/timelineDocument.js
backend/src/sofa/matchHistory/sofaUpdates/commitResult.js
backend/src/sofa/matchHistory/sofaUpdates/journalWorkflow.js
backend/src/sofa/matchHistory/sofaUpdates/recovery.js
```

## Verifica

Eseguire dalla cartella `backend/src`:

```powershell
node sofa/matchHistory/sofaUpdates/changeDetection.test.mjs
node sofa/matchHistory/sofaUpdates/commitLifecycle.test.mjs
node sofa/matchHistory/sofaUpdates/recoveryAndRetry.test.mjs
node sofa/matchHistory/sofaUpdates/writerContract.test.mjs
```

Le suite coprono deduplica, materialità history/timeline, propagazione del `commitId`, failure e partial commit, retry dal payload journalizzato, cleanup residual e validazione dell'esito dei writer.

## Documenti collegati

* [Timeline e history](./01-timelines-and-history.md)
* [Commit journal e recovery](./02-commit-journal-and-recovery.md)
* [Tracking live](../sofa/01-live-tracking.md)
* [Contesto locale e point-by-point](../sofa/02-local-context-and-point-by-point.md)
* [Source Identity](../evidence/02-source-identity.md)
* [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
