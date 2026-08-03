# ESEGUITO Report di verifica — Task 6.1: contratti writer e discovery history

## Esito

**Parzialmente confermata.**

La Task 6.1 è completata nel suo obiettivo principale: i writer espongono esiti strutturati, i failure path non vengono trattati come successi, la discovery della history è deterministica e i caller principali propagano i fallimenti.

Tuttavia, resta una correzione necessaria prima di dichiarare soddisfatto anche il requisito generale della Task 6 relativo alla lettura di history corrotte.

## Verifiche confermate

### Writer e persistenza atomica

Confermati:

* `saveHistory`, `saveTimeline` e `writeTimelineDocument` restituiscono risultati strutturati con `ok`, `operation`, `source`, `eventId`, `status`, `reason` e `file`.
* Gli esiti distinguono `written`, `unchanged` e `failed`.
* Event ID non valido e failure di scrittura non generano falsi successi.
* I test di failure injection su `rename` verificano che il file canonico resti invariato e che il `.tmp` venga rimosso.
* I test eseguiti passano: storage 15/15 e timeline store 30/30.

Questo è coerente con il contratto dichiarato nel brief della Task 6.1.

### Discovery della history

Confermati:

* esclusione dei file `sofa_*`, `betfair_*` e `.tmp`;
* selezione stabile anche con ordine variabile di `readdirSync`;
* nessuna confusione tra un event ID e un altro che ne contiene il prefisso;
* riuso del file history già esistente quando viene salvato un aggiornamento.

### Propagazione dei failure path

Confermati nei flussi Sofa e Betfair:

* se `saveHistory` fallisce, la timeline successiva non viene tentata;
* se la timeline fallisce, l’esito viene restituito come failure;
* un risultato `undefined` dagli updater viene trattato come fallimento nei livelli a valle;
* `persistSofaTrackingSample` non dichiara successo quando l’updater non restituisce un esito valido;
* il processor Betfair restituisce `history_write_failed` e non carica history né salva la timeline quando `addBetfairUpdate` restituisce `undefined`;
* il cleanup legacy Betfair registra `Cleanup failed` con event ID e motivo senza produrre un falso log `Cleanup completed`.

I test rieseguiti sono passati: updater Betfair 13/13, processor 15/15, tracker Betfair 9/9 più 13/13 runtime, lifecycle scraper 59/59, oltre ai test di tracker Sofa, analisi match e betfair fetch senza errori.

### Compatibilità dell’analisi match

Confermato che, se il salvataggio history fallisce:

* la risposta dell’analisi resta HTTP 200;
* il body resta esclusivamente `{ snapshot, localContext }`;
* l’errore di persistenza viene registrato con event ID e motivo.

Questo comportamento è espressamente previsto dal brief e non modifica il contratto HTTP esterno.

## Mancanza da correggere

### History JSON invalida non distinguibile da history assente

**Stato: correzione necessaria.**

L’attuale `loadHistory(eventId)` restituisce `null` in tutti questi casi:

* file history assente;
* JSON history malformato;
* errore di lettura del file;
* errore nella discovery della directory.

I test verificano che il JSON malformato non provochi crash e che venga scritto un log, ma il chiamante riceve lo stesso valore che riceverebbe in assenza legittima della history: `null`.

Questo non soddisfa il requisito generale che richiede un errore distinguibile tra file assente e JSON invalido.

### Rischio pratico

Gli updater usano una logica equivalente a:

```js
let historyObj = loadHistory(eventId);
if (!historyObj) {
  historyObj = nuovaHistoryVuota;
}
```

Di conseguenza, una history corrotta può essere scambiata per una history inesistente. Il flusso può creare una nuova history e salvare nuovamente sul file già individuato, sovrascrivendo il contenuto corrotto senza un errore strutturato verso il chiamante.

Questo è particolarmente rilevante prima di collegare journal e recovery: una corruzione non deve essere interpretata come autorizzazione a ricostruire dati business.

## Correzione consigliata

Introdurre una lettura strutturata, ad esempio una nuova funzione interna `loadHistoryResult(eventId)`, senza rompere subito tutti i consumer raw:

```js
{
  ok: true,
  status: "found" | "missing",
  history: object | null,
  file: string | null,
  reason: null
}
```

oppure:

```js
{
  ok: false,
  status: "failed",
  history: null,
  file: string | null,
  reason: "invalid_json" | "read_failed" | "discovery_failed"
}
```

I flussi che modificano la history devono:

* creare una nuova history solo quando lo stato è realmente `missing`;
* interrompersi con failure strutturata quando lo stato è `invalid_json`, `read_failed` o `discovery_failed`;
* non sovrascrivere automaticamente un file business illeggibile.

Test minimi da aggiungere:

1. history assente → nuova history consentita;
2. JSON invalido → updater restituisce failure e non chiama `saveHistory`;
3. errore lettura → updater restituisce failure e non chiama `saveHistory`;
4. file corrotto → contenuto invariato dopo il tentativo di update.

## Miglioramento di copertura non bloccante

Il codice degli updater gestisce già `undefined` dai writer tramite `!result?.ok`, ma i test diretti di `sofaUpdates.test.mjs` e `betfairUpdates.test.mjs` non esercitano esplicitamente quel ramo.

Esistono già test a valle per `undefined` nel tracker Sofa, nel processor Betfair e nell’handler di analisi. Aggiungere due test diretti agli updater renderebbe la protezione più resistente a regressioni, ma non segnala un bug attuale.

## Limiti della verifica

La verifica ha riguardato il codice e le suite mirate eseguite localmente. Non include:

* sessione live completa con browser;
* server HTTP reale;
* dati Betfair reali;
* verifica dell’intera suite del repository;
* conferma della versione Node effettivamente usata nell’esecuzione.

## Decisione operativa

La Task 6.1 può essere considerata **funzionalmente solida nel suo core**, ma va mantenuta come **non pienamente chiusa** fino alla distinzione strutturata tra history assente e history non leggibile.

La correzione è autonoma, piccola e consigliabile prima di integrare il journal della Task 6.2 nei flussi reali.


# ESEGUITO Report di verifica — Task 6.2: Journal dei commit e stato di integrità interno

## Esito

**Confermata nel perimetro previsto, con una incoerenza di specifica da correggere.**

Il modulo journal è isolato, non ancora integrato nei flussi Sofa/Betfair, usa esiti strutturati, persistenza temporanea con rename, validazione dei record e letture senza side effect. Questo è coerente con lo scope del Prompt 6.2.

## Verifiche confermate

* La factory richiesta `createCommitJournalStore(...)` esiste ed espone tutte le operazioni previste.
* I record validano `commitId`, `eventId`, source, documenti, payload JSON e chiavi sensibili annidate.
* La creazione iniziale forza entrambi i documenti a `completed: false`.
* Lo stesso commit equivalente restituisce `unchanged`; un commit diverso per lo stesso `eventId + source` viene bloccato nei flussi sequenziali.
* `markDocumentComplete` aggiorna un solo documento e preserva l’altro.
* I journal invalidi sono osservabili tramite `listPendingCommits` senza produrre uno stato di integrity inventato.
* La selezione integrity è indipendente dall’ordine di `readdirSync`.
* La sidecar `.pending_commits` non viene scoperta come history.
* Le API di lettura non creano directory né scrivono file.
* Non risulta alcuna integrazione del journal nel runtime reale: la ricerca mostra riferimenti soltanto nel modulo e nel suo test. Questo è corretto per il sotto-task 6.2.

I test rieseguiti sono tutti passati:

```txt
node --check backend/src/sofa/matchHistory/commitJournal.js
→ CHECK_OK

node backend/src/sofa/matchHistory/commitJournal.test.mjs
→ 40 passed, 0 failed

node backend/src/sofa/matchHistory/storage.test.mjs
→ 15 passed, 0 failed

node backend/src/sofa/timelineStore.test.mjs
→ 30 passed, 0 failed
```

L’assenza attuale della directory reale `.pending_commits` dentro `backend/match_history` è coerente con il fatto che il journal non è ancora usato dal runtime e che le letture non devono creare side effect.

## Incoerenza da correggere nella specifica

Il Prompt 6.2 dice che `removeCompletedCommit()` può rimuovere soltanto un journal con:

```txt
status === pending
history.completed === true
timeline.completed === true
```

e che un journal `recovery_failed` deve restituire `failed/not_completed`, anche se i due documenti risultano completi.

Il codice, il brief e il test `T29` implementano invece questa semantica:

```txt
recovery_failed
+ history completed
+ timeline completed
→ journal removibile
```

## Valutazione della discrepanza

Raccomando di **correggere il Prompt 6.2 e non il codice**.

La semantica implementata è più coerente con il ciclo di vita previsto:

```txt
recovery fallisce
→ journal recovery_failed

un tentativo successivo completa le due scritture canoniche
→ journal non è più parziale
→ cleanup del journal
```

Se invece un `recovery_failed` completato restasse permanentemente su disco, non sarebbe più esposto come integrità degradata, ma potrebbe continuare a bloccare un nuovo commit per lo stesso evento e source. Sarebbe un tombstone senza utilità operativa.

La formulazione consigliata per la specifica è:

```txt
removeCompletedCommit(commitId) può rimuovere un journal quando history.completed
e timeline.completed sono entrambe true, indipendentemente da status pending o
recovery_failed.

Un recovery_failed incompleto resta non rimovibile e restituisce not_completed.
```

## Questione aperta: concorrenza tra processi

Il blocco `pending_exists` è verificato per chiamate sequenziali nella stessa istanza del modulo.

Non è invece dimostrato come garanzia cross-process: la creazione fa una lettura, verifica i record esistenti e poi scrive. Due processi distinti potrebbero entrambi non vedere un journal e creare due file diversi per lo stesso `eventId + source`.

Per l’architettura attuale non è necessariamente un bug: se il backend opera come singolo processo, le chiamate sincrone sono serializzate. Va però mantenuto come questione aperta per la verifica finale della Task 6:

```txt
Il sistema avrà mai più processi backend che scrivono la stessa directory match_history?
```

Se la risposta è no, non servono lock aggiuntivi. Se la risposta è sì, servirà una strategia di creazione esclusiva o lock atomico.

## Miglioramenti minori non bloccanti

Nel codice sono presenti alcune proprietà duplicate negli object literal:

```txt
commitId ripetuto nella comparazione di equivalenza;
status ripetuto nel risultato di removeCompletedCommit;
```

JavaScript conserva l’ultima proprietà, quindi il comportamento attuale non risulta errato. È comunque opportuno rimuoverle nel prossimo intervento sul file.

## Limiti della verifica

* I test del journal usano filesystem fake, come permesso dal prompt.
* Non è stato eseguito un test del journal su filesystem reale con rename e cleanup.
* Non è stata verificata recovery runtime, perché è esplicitamente fuori scope della 6.2.
* Non sono state modificate API, server, Evidence, Source Identity o documenti business: questo è corretto per la task.

## Decisione operativa

La Task 6.2 può essere considerata **chiusa localmente**, a condizione di aggiornare il testo della specifica o il registro delle decisioni per allinearlo alla semantica realmente voluta del cleanup dopo recovery riuscita.

Questioni da mantenere aperte nel registro Task 6:

1. `loadHistory()` deve distinguere file assente da JSON corrotto o errore di lettura.
2. Definire se il backend resta certamente single-process rispetto a `match_history`.
3. Rimuovere le proprietà duplicate da `commitJournal.js` quando il file verrà toccato di nuovo.


# ESEGUITO Report di verifica — Task 6.3

**Esito:** non completato.

Il commit Sofa journalizzato è implementato nella struttura principale: crea il journal prima delle scritture canoniche, scrive history prima della timeline, lascia il journal pending in caso di failure, riprende dal payload journalizzato e non usa `localContext` nella history o nella Source Identity. Il Gate mantiene il comportamento `pending` quando il bootstrap fallisce e non apre recording su `ok:false` o `undefined`.

**Conforme e già presente**

* Deduplica Sofa stabile: nessun nuovo journal, history row o tick timeline quando snapshot e stato Betfair persistibile sono invariati.
* `localContext` arriva al tick timeline Sofa ma resta fuori dalla history e dal sample identitario.
* History failure: timeline non viene tentata.
* Timeline failure dopo history: journal pending, retry dal documento timeline già journalizzato, senza generare un tick nuovo.
* Journal `recovery_failed`: nessuna riscrittura automatica e risultato `recovery_required`.
* Journal completo residuo: viene tentata la rimozione prima di creare un nuovo commit per lo stesso evento e source.
* Resolver timeline stabile: prefisso e suffisso esatti, ordinamento lessicografico e rifiuto di target alternativi.

**Lacune bloccanti**

1. **`commitId` non è persistito nei documenti canonici.**

Il `commitId` viene creato e salvato nel journal, ma non entra né nella nuova riga history né nel tick Sofa della timeline. La Task 6 richiede un riferimento additivo al medesimo `commitId` nella riga history interessata e nel tick canonico.

Correzione richiesta:

* generare il `commitId` prima della costruzione di history e timeline;
* aggiungerlo alla nuova history row;
* aggiungerlo al tick Sofa;
* mantenere lo stesso valore nel retry dal journal.

Test obbligatori:

* `historyRow.commitId === timelineTick.commitId === journal.commitId === result.commitId`;
* retry dopo timeline failure: stesso `commitId`, nessuna history duplicata, nessun tick aggiuntivo.

2. **Fallback `undefined` non rispetta il contratto completo `sofa_commit`.**

`persistSofaTrackingSample(...)` trasforma `undefined` in:

`{ ok: false, reason: 'write_failed' }`

Il risultato non contiene `operation`, `source`, `eventId`, `commitId`, `status` e `failedDocument`, sebbene il Prompt 3 richieda sempre l’envelope completo del commit. Il test attuale consolida questo comportamento ridotto.

Correzione richiesta:

* sostituire il fallback ridotto con un commit result completo;
* applicare la stessa normalizzazione nel percorso `updateSofa(...)`;
* fissare una sola convenzione per `reason`: il Prompt parla di `write_failed`, mentre l’enum del commit result contiene `persistence_incomplete` ma non `write_failed`.

3. **Il bootstrap perde i dettagli del failure Sofa.**

`persistBootstrapTrackingSamples(...)` usa correttamente `sofaResult?.ok === true` per decidere se eseguire Betfair, ma restituisce soltanto:

`{ ok: sofaOk && betfairOk }`

Con un failure Sofa, vengono persi `reason`, `status`, `commitId`, `failedDocument` e source. Il test attuale richiede esplicitamente `{ ok:false }`.
Correzione richiesta:

* propagare il risultato Sofa fallito o inserirlo in un risultato bootstrap strutturato;
* preservare almeno `reason: 'persistence_incomplete'`, source, `commitId` e `failedDocument`;
* mantenere Betfair non eseguito quando Sofa fallisce.

**Lacune di test**

1. Manca il retry dopo failure di `markDocumentComplete('history')`.

Scenario richiesto:

* history write riuscita;
* marker history fallito;
* timeline non tentata;
* retry con lo stesso journal;
* history riscritta soltanto perché non confermata nel journal;
* marker history completato;
* timeline scritta una sola volta;
* journal rimosso al termine.

2. Manca il test del writer timeline che restituisce `ok:true` ma un file diverso dal target journalizzato.

Scenario richiesto:

* timeline non marcata completed;
* risultato partial;
* journal pending;
* retry dal payload timeline originale;
* nessun target alternativo accettato come canonico.

3. Manca il test di correlazione del `commitId` tra journal, history, tick timeline e commit result.

4. Il test `undefined` deve verificare l’envelope completo `sofa_commit`, non soltanto `{ ok:false, reason:'write_failed' }`.

5. Il test bootstrap deve verificare che il failure Sofa sia restituito in forma strutturata, oltre a confermare che Betfair non venga eseguito.

**Debiti di contratto della Task 6 da risolvere prima delle fasi successive**

* I writer di singolo documento restituiscono esiti strutturati, ma non includono `commitId`, richiesto dal contratto generale della Task 6.
* Il commit result Sofa usa `operation: 'sofa_commit'` e `failedDocument`, ma non include `documents.history`, `documents.timeline` e `warnings`, previsti dal contratto aggregato della Task 6. La differenza può essere transitoria, ma deve essere allineata prima di recovery, API ed Evidence.
* Il generatore predefinito del `commitId` usa `Date.now()` e un contatore in memoria. Dopo un restart il contatore riparte. Va sostituito o rafforzato con un identificatore standard resistente ai riavvii, senza nuove dipendenze.

**Verifiche locali obbligatorie dopo le correzioni**

* `node --check backend/src/sofa/matchHistory.js`
* `node --check backend/src/sofa/matchHistory/sofaUpdates.js`
* `node --check backend/src/sofa/matchHistory/commitJournal.js`
* `node --check backend/src/sofa/trackerUpdate.js`
* `node --check backend/src/sofa/sourceIdentityGate.js`
* `node --check backend/src/sofa/matchTracker.js`
* `node backend/src/sofa/matchHistory/sofaUpdates.test.mjs`
* `node backend/src/sofa/matchHistory/commitJournal.test.mjs`
* `node backend/src/sofa/trackerUpdate.test.mjs`
* `node backend/src/sofa/sourceIdentityGate.test.mjs`
* `node backend/src/sofa/matchTracker.test.mjs`
* `node backend/src/sofa/matchHistory/storage.test.mjs`
* `node backend/src/sofa/timelineStore.test.mjs`

Le verifiche devono essere eseguite nella repository completa con Node `v24.11.1`.

**Condizione di chiusura del Prompt 3**

Il Prompt 3 è chiudibile soltanto quando:

* il medesimo `commitId` è presente in journal, history row, tick timeline e commit result;
* `undefined` produce sempre un risultato completo `sofa_commit`;
* bootstrap Sofa fallito mantiene la reason strutturata e blocca Betfair;
* sono aggiunti i cinque test mancanti;
* tutte le suite obbligatorie terminano con exit code `0` su Node `v24.11.1`.

**Conclusione**

Il nucleo del commit Sofa journalizzato è vicino alla chiusura, ma non è ancora conforme alla Task 6 perché manca la correlazione persistita tramite `commitId`, il fallback `undefined` rompe il contratto strutturato e il bootstrap riduce un failure ricco a un semplice booleano.

# ESEGUITO Report di verifica — Task 6.4
## Commit Betfair journalizzato e repair duplicate-aware

**Data verifica:** 7 luglio 2026
**Tipo:** revisione statica della snapshot del codice consegnata
**Esito:** **implementazione parziale; non ancora accettabile come Prompt 4 chiuso**

## Perimetro effettivamente analizzato

File di progetto letti:

- `backend/src/sofa/matchHistory.js`
- `backend/src/sofa/matchHistory/betfairUpdates.js`
- `backend/src/sofa/betfair/processor.js`
- `backend/src/sofa/betfair/trackerUpdate.js`
- `backend/src/sofa/betfairFetch.js`
- `backend/src/sofa/betfair/timeline.js`
- `backend/src/sofa/betfair/timeline/state.js`
- `backend/src/sofa/matchHistory/storage.js`
- `backend/src/sofa/timelineStore.js`
- `backend/src/sofa/matchHistory/commitJournal.js`

Non inclusi nella snapshot e quindi non verificabili: le suite `.test.mjs` previste dal Prompt 4, `runnerProcessing.js`, `payload.js`, `history.js`, `scraperLifecycle.js`, Source Identity Gate e Match Tracker.

Tre file ricevuti con nome `processor (1).js`, `processor (2).js` e `processor (3).js` risultano codice di dipendenze CSS/PostCSS, non moduli del progetto Betfair; non sono stati considerati come evidenza del Prompt 4.

## Controlli eseguiti

Tutti i dieci file di progetto sopra elencati superano `node --check`.

Non sono stati eseguiti test unitari o failure-injection: le relative suite non sono state consegnate nella snapshot. Nessun risultato “test passed” è quindi attribuibile a questa verifica.

## Cosa risulta implementato correttamente

1. **Owner unico del commit canonico.**
   `matchHistory.js` espone soltanto le dipendenze di persistenza; `betfairUpdates.js` prepara il documento history; `processor.js` esegue il commit composto.

2. **Ordine del commit.**
   Il flusso nel processor è coerente con:
   `createPendingCommit → write history → mark history → write timeline → mark timeline → remove journal`.

3. **Repair prima di duplicate/regressione.**
   Il processor cerca un journal Betfair attivo prima di caricare timeline e applicare i controlli `regressive_tick` / `duplicate_tick`. Il repair usa `target`, `document` e `metadata` dal journal e invoca writer di documento completo, non `saveTimeline`.

4. **Controllo del target effettivamente scritto.**
   Il risultato writer viene accettato soltanto se `ok === true` e `file === target` journalizzato. Questo protegge dai target mismatch.

5. **Stato runtime principale.**
   `marketState` viene confermato soltanto per `complete` e `recovered`; per gli esiti non canonici viene invocato il discard dello stato pending.

6. **Legacy non invalidante.**
   Il cleanup legacy viene invocato soltanto dopo la rimozione del journal; un errore legacy è trasformato in `legacyWarning` senza cambiare `ok:true` / `status:complete|recovered`.

7. **Journal con whitelist di sicurezza.**
   Il journal rifiuta chiavi sensibili e consente soltanto la sintesi stretta `diagnostics.networkCaptureSummary`.

## Rilievi bloccanti o ad alta priorità

### T6-P4-01 — `commitId` non è scritto nei documenti business
**Priorità:** P0 — blocca la chiusura definitiva della Task 6

Il `commitId` viene generato, riportato nell’esito e nel journal, ma non è aggiunto:
- alla riga history Betfair appena preparata;
- al tick Betfair canonico appena creato.

Nella snapshot, `commitId` compare in `processor.js` e `commitJournal.js`, ma non viene propagato in `newRow` di `betfairUpdates.js` né nell’oggetto tick costruito da `timeline.js`.

**Impatto:** non esiste una correlazione persistita, controllabile e additiva tra le due mutazioni business e il journal. Questo contraddice un requisito esplicito della Task 6 e riduce la verificabilità post-crash.

**Correzione attesa:** generare il `commitId` prima di finalizzare i payload journalizzati e aggiungerlo, senza modificarne la semantica, alla nuova row history e al tick canonico.

### T6-P4-02 — Entry legacy entrano nel documento timeline journalizzato
**Priorità:** P0 — violazione del confine canonico/legacy

`createTimelineDocument(...)` clona l’intera timeline esistente e poi aggiunge il tick nuovo. Le entry legacy vengono filtrate soltanto successivamente da `cleanupLegacyBetfairTimeline(...)`, dopo il commit e dopo la rimozione del journal.

**Impatto:**
- il payload del journal può contenere entry legacy;
- il documento scritto come “canonico” può contenerle fino al cleanup;
- se il cleanup fallisce, il commit resta `complete` con warning ma la timeline business resta contaminata da entry non canoniche;
- `elapsedSeconds` del tick nuovo può essere calcolato rispetto alla prima entry legacy, poi rimossa.

Questo confligge con il vincolo: la timeline legacy non deve diventare parte del documento journalizzato né contribuire a recovery, sequenza o semantica canonica.

**Correzione attesa:** prima di costruire il documento timeline e prima di creare il journal, derivare una timeline composta soltanto da entry Betfair canoniche (source Betfair, `seq` numerico, runner array). Il cleanup legacy diventa un’operazione distinta e non parte del payload canonico.

### T6-P4-03 — Il cleanup legacy persiste `latest` derivato e potenzialmente legacy
**Priorità:** P1

`loadTimeline(...)` aggiunge una proprietà transitoria `latest`. Il cleanup carica la timeline, filtra `timeline`, poi riscrive l’oggetto senza eliminare né ricalcolare `latest`.

**Impatto:** se l’ultima entry prima del cleanup era legacy, il file JSON può contenere `latest` riferito a un’entry appena eliminata. Anche se il loader lo sovrascrive a runtime, il file canonico conserva ridondanza e può esporre un riferimento legacy ai reader raw.

**Correzione attesa:** prima della scrittura cleanup eliminare `timelineObj.latest` oppure ricostruirlo dal nuovo ultimo tick canonico; preferibile non persistere mai questo campo derivato.

### T6-P4-04 — Il restore di `marketState` non può conservare l’identità `selectionId`
**Priorità:** P1 — rischio di restart, da validare con i moduli mancanti

Il writer history prepara runner senza `selectionId`; anche `latestBetfairState.runners` salva soltanto `name` e `ladder`. Il restore in `betfairFetch.js` cerca invece proprio `selectionId` sia nel runner history sia nello stato salvato.

**Impatto:** dopo un restart, il restore visibile in questa snapshot tende a produrre runner con `selectionId:null`, senza un match affidabile per ladder, prezzi o volumi. Questo è un rischio diretto per continuità di `marketState`, Money Flow e deduplica dopo riavvio.

**Correzione attesa:** non modificare la semantica della strategia, ma assicurare che il formato persistito autorizzato contenga `selectionId` e i soli dati canonici necessari al restore; verificare il comportamento con `runnerProcessing.js` e test di restart.

## Rilievi medi da mettere nel backlog Task 6

### T6-P4-05 — Journal completo residuo non viene pulito dal retry duplicate/regressive
**Priorità:** P2

Dopo una failure di `removeCompletedCommit`, il journal ha entrambi i marker completati, quindi non è “attivo” per `findPendingCommit`. Un retry identico viene classificato duplicate/regressive prima della creazione di un nuovo commit e non ritenta il cleanup del journal residuo. La pulizia avverrà soltanto quando arriverà un sample non duplicato che tenta di creare un nuovo commit.

**Rimedio da valutare:** aggiungere un cleanup esplicito e idempotente dei journal completi residui prima di restituire `unchanged`, oppure renderlo responsabilità esplicita della recovery bootstrap del Prompt 5.

### T6-P4-06 — Validazione sicurezza del journal basata sulle chiavi, non sul contenuto stringa
**Priorità:** P2

Il journal vieta correttamente chiavi come `token`, `cookie`, `header`, `network` e `capture`, con l’eccezione stretta `networkCaptureSummary`. Tuttavia la validazione non sanitizza valori stringa. Campi ammessi come `graphLoginRequiredUrl` o metadati URL potrebbero contenere query parameter sensibili senza essere rilevati.

**Rimedio da valutare:** rimuovere URL completi dal payload journalizzato o normalizzarli/ridurre a identificatori prima della persistenza; aggiungere test con URL contenente un parametro sensibile.

### T6-P4-07 — Il repair richiede un sample tecnicamente valido
**Priorità:** P2, comportamento da rendere esplicito

`persistBetfairProcessedResult` restituisce `unchanged` per un sample tecnicamente non usabile prima di consultare il journal. Un commit pending viene quindi riparato soltanto quando arriva un sample tecnicamente valido o quando sarà disponibile la recovery bootstrap del Prompt 5.

**Valutazione:** non viola letteralmente il requisito duplicate/regressione del Prompt 4, ma deve essere coperto e documentato nel Prompt 5 per evitare l’aspettativa errata di autorepair su ogni polling.

## Esito rispetto ai criteri del Prompt 4

| Area | Stato | Nota |
|---|---|---|
| Owner unico del commit | Conforme | `processor.js` è il punto di commit |
| Journal prima delle write | Conforme | ordine osservato nel codice |
| Repair duplicate-aware | Conforme con limite | repair prima di duplicate/regressione |
| Repair solo da payload journalizzato | Conforme | usa target/document/metadata journalizzati |
| Verifica target writer | Conforme | richiede file uguale al target |
| Stato `marketState` dopo commit | Conforme staticamente | da testare con `runnerProcessing.js` |
| Warning legacy non invalidante | Conforme | warning separato |
| Legacy fuori dal documento canonico | **Non conforme** | clone della timeline include legacy |
| `commitId` in history e tick | **Non conforme** | presente solo in journal/esito |
| Cleanup legacy senza persistere stato derivato | **Non conforme** | `latest` può restare nel JSON |
| Restart/state restore | Non verificato e rischioso | selectionId assente nella snapshot |
| Test obbligatori Prompt 4 | Non verificati | file test non forniti |

## Priorità operativa raccomandata prima dei Prompt 5–9

1. Correggere T6-P4-01 e T6-P4-02 prima di considerare stabile il commit Betfair.
2. Correggere T6-P4-03 insieme alla separazione canonico/legacy.
3. Verificare T6-P4-04 con i moduli mancanti e un test restart reale/fake filesystem.
4. Aggiungere o eseguire le suite obbligatorie del Prompt 4, comprese failure injection e target mismatch.
5. Portare T6-P4-05 e T6-P4-07 nel disegno del Prompt 5, dove esiste la recovery bootstrap.
6. Portare T6-P4-06 nel controllo documentale e nei test di sicurezza del journal prima del Prompt 9.

## Evidenza disponibile

- Tutti i file JavaScript del perimetro consegnato: `node --check` superato.
- Nessuna prova disponibile di test standalone Node.
- Nessuna simulazione di failure filesystem, process restart o API.
- Nessuna modifica al codice eseguita in questa verifica.
