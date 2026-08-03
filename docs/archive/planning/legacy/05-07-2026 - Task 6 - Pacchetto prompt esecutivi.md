# Pacchetto prompt esecutivi — Task 6

## Ordine obbligatorio

```txt
1. Contratti writer e discovery history
2. Journal dei commit e stato integrity
3. Commit SofaScore e propagazione fallimenti
4. Commit Betfair e repair duplicate-aware
5. Recovery bootstrap prima di app.listen
6. API Match: integrity additiva
7. API Betfair: integrity separata da health
8. Evidence: partial_persistence e no-trade reason
9. Allineamento documentazione canonica
```

Non inviare `backend/match_history`, `.env`, dump, cache, cookie, token, lockfile o repository completo.

---

# COMPLETATO Prompt 1 — Contratti writer e discovery history

## Contesto da allegare

**Codice**

* `backend/src/sofa/matchHistory/storage.js`
* `backend/src/sofa/matchHistory.js`
* `backend/src/sofa/timelineStore.js`
* `backend/src/sofa/matchHistory/sofaUpdates.js`
* `backend/src/sofa/matchHistory/betfairUpdates.js`
* `backend/src/sofa/betfair/processor.js`
* `backend/src/sofa/trackerUpdate.js`
* `backend/src/sofa/betfair/trackerUpdate.js`

**Test**

* `backend/src/sofa/matchHistory/storage.test.mjs`
* `backend/src/sofa/timelineStore.test.mjs`
* `backend/src/sofa/matchHistory/sofaUpdates.test.mjs`
* `backend/src/sofa/matchHistory/betfairUpdates.test.mjs`
* `backend/src/sofa/betfair/processor.test.mjs`
* `backend/src/sofa/trackerUpdate.test.mjs`
* `backend/src/sofa/betfair/trackerUpdate.test.mjs`

**Documentazione**

* `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx`
* `docs/tennis-decision-ui/modules/sofa/01-live-tracking.mdx`

## Prompt

Lavora sul progetto locale **Tennis Decision UI**.

La logica è già decisa. Devi rendere espliciti gli esiti delle scritture canoniche e correggere la selezione del file history. Non introdurre journal, recovery al riavvio, API HTTP, Evidence, frontend o nuove dipendenze.

Non fare analisi architetturale ampia. Non proporre alternative. Non cercare altri problemi. Se trovi un chiamante diretto di `saveHistory(...)` o `saveTimeline(...)` non incluso nei file autorizzati, fermati e riportalo senza modificarlo.

## Obiettivo

Migrare le scritture canoniche history e timeline a risultati strutturati, senza permettere a un caller di trattare un fallimento come successo.

Correggere inoltre `getHistoryFile(eventId)` affinché non possa selezionare accidentalmente `sofa_<eventId>.json`, `betfair_<eventId>.json` o il file di un eventId con semplice prefisso comune.

## File autorizzati

Puoi modificare solo:

* `backend/src/sofa/matchHistory/storage.js`
* `backend/src/sofa/matchHistory.js`
* `backend/src/sofa/timelineStore.js`
* `backend/src/sofa/matchHistory/sofaUpdates.js`
* `backend/src/sofa/matchHistory/betfairUpdates.js`
* `backend/src/sofa/betfair/processor.js`
* `backend/src/sofa/trackerUpdate.js`
* `backend/src/sofa/betfair/trackerUpdate.js`
* i test allegati direttamente collegati

Non creare altri moduli. Non modificare documentazione.

## Documentazione di riferimento

* `modules/storage/01-timelines-and-history.mdx`
* `modules/sofa/01-live-tracking.mdx`

## Contratti da preservare

* Ogni file canonico continua a usare write temporanea nella stessa directory e rename atomico.
* Un errore di rename lascia invariato il file canonico precedente.
* `loadHistory(...)` e `loadTimeline(...)` restano compatibili per i consumer read-only esistenti: continuano a restituire il documento oppure `null`.
* Source Identity Gate resta esterno alla persistenza.
* Tick duplicati e regressivi Betfair mantengono la loro semantica attuale.
* Non modificare campi business di history, tick Sofa o tick Betfair.
* Non modificare scraper, browser, runtime health, Money Flow, graph health o API.

## Implementazione richiesta

### A. Risultati writer

`saveHistory(...)` e `saveTimeline(...)` devono restituire oggetti strutturati.

Schema minimo:

```js
{
  ok: true | false,
  operation: 'history' | 'timeline',
  source: 'sofa' | 'betfair' | null,
  eventId,
  status: 'written' | 'unchanged' | 'failed',
  reason: null | 'invalid_event_id' | 'write_failed',
  file: null | '<path>'
}
```

Regole:

* Scrittura riuscita: `ok:true`, `status:'written'`.
* Tick identico realmente deduplicato: `ok:true`, `status:'unchanged'`.
* Event ID invalido: `ok:false`, reason non sensibile.
* Errore filesystem o rename: `ok:false`, `status:'failed'`.
* Non restituire `undefined`, `null` o un path semplice come esito writer.
* Mantieni stack trace e dettagli filesystem nei log locali, non nel campo pubblico `reason`.

Aggiorna tutti i caller autorizzati affinché controllino esplicitamente `result.ok`.

Un risultato `{ ok:false }` non deve essere trattato come valore truthy di successo.

### B. Propagazione

* `addSofaUpdate(...)` e `addBetfairUpdate(...)` devono propagare il fallimento writer.
* `persistSofaTrackingSample(...)` e `persistBetfairTrackingSample(...)` devono restituire l’esito reale di persistenza.
* Il processor Betfair non può continuare a salvare un tick canonico dopo un fallimento history.
* Il percorso Sofa non può dichiarare successo quando history o timeline falliscono.
* Non introdurre ancora commit journal o retry automatico: in questo task un fallimento deve essere esplicito.

### C. Discovery history

Rendi `getHistoryFile(eventId)` deterministica.

Deve:

* accettare soltanto il file history reale dell’evento;
* escludere esplicitamente file che iniziano con `sofa_` o `betfair_`;
* ignorare `.tmp`;
* richiedere una corrispondenza completa sul suffisso eventId, non `includes(eventId)`;
* non confondere `123` con `1234`;
* mantenere la compatibilità con i nomi history esistenti.

Aggiungi, se necessario, un helper read-only strutturato per distinguere:

```txt
found
missing
invalid_json
read_failed
```

Non cambiare il contratto legacy di `loadHistory(...)`.

## Non modificare

* `backend/src/server.js`
* route HTTP
* Evidence
* Source Identity Gate
* confirmation store
* frontend
* launcher
* scraper Python
* `backend/match_history/`
* documentazione

## Test richiesti

Esegui:

```bash
node --check backend/src/sofa/matchHistory/storage.js
node --check backend/src/sofa/timelineStore.js
node --check backend/src/sofa/matchHistory/sofaUpdates.js
node --check backend/src/sofa/matchHistory/betfairUpdates.js
node --check backend/src/sofa/betfair/processor.js
node --check backend/src/sofa/trackerUpdate.js
node --check backend/src/sofa/betfair/trackerUpdate.js

node backend/src/sofa/matchHistory/storage.test.mjs
node backend/src/sofa/timelineStore.test.mjs
node backend/src/sofa/matchHistory/sofaUpdates.test.mjs
node backend/src/sofa/matchHistory/betfairUpdates.test.mjs
node backend/src/sofa/betfair/processor.test.mjs
node backend/src/sofa/trackerUpdate.test.mjs
node backend/src/sofa/betfair/trackerUpdate.test.mjs
```

Aggiungi test per:

```txt
history write failure
→ risultato failed
→ nessun falso successo

timeline write failure
→ risultato failed
→ nessun falso successo

history + sofa_ + betfair_ dello stesso eventId
→ getHistoryFile seleziona history

ordine readdir differente
→ stesso file history

eventId prefisso di un altro
→ nessun match errato
```

## Output finale richiesto

Scrivi solo:

* file modificati;
* riepilogo modifiche;
* comandi eseguiti;
* esito test;
* eventuali limiti/non verificato;
* eventuali errori incontrati.

Massimo tre tentativi ragionati. Dopo il terzo tentativo fermati.

---

# COMPLETATO Prompt 2 — Journal dei commit e stato di integrità

## Contesto da allegare

**Codice**

```txt
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
```

**Test**

```txt
backend/src/sofa/matchHistory/storage.test.mjs
backend/src/sofa/timelineStore.test.mjs
```

**Documentazione di riferimento, sola lettura**

```txt
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
```

## Prompt

Lavora sul progetto locale **Tennis Decision UI**.

Esegui soltanto il sotto-task **Journal dei commit e stato di integrità interno**.

Devi creare un sidecar persistente e atomico per registrare commit multi-file pendenti o falliti e una query read-only dello stato di integrità noto.

Non collegare ancora il journal a SofaScore, Betfair, processor, tracker, server, route HTTP, Evidence o Source Identity. Non introdurre ancora `commitId` nei documenti business history o timeline. Non eseguire recovery. Non creare database, dipendenze, code generiche o nuovi processi.

## Obiettivo

Creare una base isolata e testabile che permetta in seguito di:

```txt
registrare un commit pendente prima delle scritture canoniche;
marcare history o timeline come completate;
bloccare la creazione di un commit sostitutivo per lo stesso evento e source;
registrare recovery_failed;
rimuovere soltanto un journal realmente completato;
calcolare uno stato interno di integrity noto.
```

## File autorizzati

Puoi creare o modificare solo:

```txt
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/commitJournal.test.mjs
```

Non modificare `storage.js`, `timelineStore.js` o altri file.

Se trovi già un modulo journal o integrity realmente usato nel progetto, fermati e riportalo senza creare un duplicato.

## Confini non modificabili

Non modificare:

```txt
backend/src/sofa/matchHistory/sofaUpdates.js
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/processor.js
backend/src/sofa/trackerUpdate.js
backend/src/sofa/betfair/trackerUpdate.js
backend/src/sofa/betfairFetch.js
backend/src/server.js
route HTTP
Evidence
Source Identity
frontend
documentazione
backend/match_history/ esistente
```

Non usare Git.

## Collocazione journal

Usa una directory sidecar sotto la directory canonica:

```txt
backend/match_history/.pending_commits/
```

Nei test non creare o modificare dati reali in `backend/match_history/`: usa filesystem fake o directory temporanee.

Il journal:

```txt
non è history;
non è timeline;
non deve essere letto da loadHistory o loadTimeline;
non deve essere esposto da API, Evidence, health o Strategy;
non deve modificare file business in questo sotto-task.
```

## Factory richiesta

Esporta una factory testabile:

```js
createCommitJournalStore({
  fs,
  path,
  journalDir,
  getNow,
  getNowMs,
  processId,
  logError
})
```

Le dipendenze devono essere iniettabili nei test. Il modulo può usare default sicuri per l’uso reale, ma i test non devono dipendere da `backend/match_history/`.

Esporre almeno:

```js
createPendingCommit(record)
getPendingCommit(commitId)
findPendingCommit({ eventId, source })
markDocumentComplete(commitId, documentName)
markRecoveryFailed(commitId, reason)
removeCompletedCommit(commitId)
listPendingCommits()
getPersistenceIntegrityStatus(eventId, source?)
```

## Record persistito

`createPendingCommit(record)` riceve:

```js
{
  commitId: string,
  eventId: string,
  source: 'sofa' | 'betfair',
  documents: {
    history: {
      target: string,
      payload: object,
      completed: false
    },
    timeline: {
      target: string,
      payload: object,
      completed: false
    }
  }
}
```

Il modulo crea e persiste:

```js
{
  version: 1,
  commitId,
  eventId,
  source,
  createdAt: string,
  status: 'pending',
  documents: {
    history: {
      target: string,
      payload: object,
      completed: boolean
    },
    timeline: {
      target: string,
      payload: object,
      completed: boolean
    }
  },
  reason: null
}
```

Regole:

```txt
commitId non vuoto e sicuro per un nome file;
eventId non vuoto;
source solo sofa o betfair;
target stringa non vuota;
payload object JSON-serializzabile;
completed boolean;
createdAt generato dal journal;
status iniziale sempre pending;
reason iniziale sempre null.
```

Il journal non può contenere, anche annidati:

```txt
cookie
token
header
authorization
credential
password
secret
browser profile
profile path
payload browser raw
network capture
network dump
```

La validazione deve controllare ricorsivamente le chiavi proibite in modo case-insensitive. Non loggare mai payload completi, target completi o dettagli sensibili.

## Risultato delle mutazioni

Ogni mutazione deve restituire:

```js
{
  ok: boolean,
  operation: 'journal',
  eventId: string | null,
  source: 'sofa' | 'betfair' | null,
  commitId: string | null,
  status: 'created' | 'updated' | 'removed' | 'unchanged' | 'failed',
  reason: string | null,
  file: string | null
}
```

Reason ammessi:

```txt
invalid_record
invalid_event_id
invalid_source
invalid_commit_id
invalid_document
pending_exists
not_found
not_completed
invalid_journal
write_failed
```

Non restituire `undefined`, `null` o un path semplice come esito mutazione.

## Atomicità

Ogni creazione o aggiornamento journal deve usare:

```txt
file temporaneo nella stessa directory
→ rename atomico
```

Se write o rename falliscono:

```txt
journal precedente invariato;
.tmp pulito quando possibile;
esito failed/write_failed;
nessun falso successo.
```

La rimozione usa unlink atomico del file journal. Non può cancellare file business.

## Semantica operativa

### createPendingCommit(record)

```txt
stesso commitId con record equivalente
→ ok:true
→ status: unchanged
→ nessuna riscrittura

stesso commitId con record differente
→ ok:false
→ reason: pending_exists

commit diverso ma stesso eventId + source con journal esistente
→ ok:false
→ reason: pending_exists

nessuna sovrascrittura di journal esistenti.
```

### markDocumentComplete(commitId, documentName)

Accetta soltanto:

```txt
history
timeline
```

Regole:

```txt
marca true soltanto documents[documentName].completed;
preserva integralmente l’altro documento;
seconda chiamata sul documento già completato
→ ok:true
→ status: unchanged;
documentName non valido
→ ok:false
→ reason: invalid_document.
```

### markRecoveryFailed(commitId, reason)

```txt
aggiorna solo status a recovery_failed;
reason deve essere un identificatore machine-readable non sensibile;
non altera payload, target o completed;
journal assente
→ ok:false
→ reason: not_found.
```

### removeCompletedCommit(commitId)

Può rimuovere soltanto quando:

```txt
status === pending
e
history.completed === true
e
timeline.completed === true
```

Regole:

```txt
journal incompleto
→ ok:false
→ reason: not_completed

journal recovery_failed
→ ok:false
→ reason: not_completed

journal assente
→ ok:true
→ status: unchanged

journal completo pending
→ ok:true
→ status: removed.
```

## Read API

### getPendingCommit(commitId)

Restituisce il record verificabile o `null`.

### findPendingCommit({ eventId, source })

Restituisce il journal attivo verificabile per quell’evento/source oppure `null`.

Un journal attivo è:

```txt
status pending o recovery_failed
e almeno un documento completed:false.
```

### listPendingCommits()

Restituisce una struttura read-only:

```js
{
  ok: boolean,
  records: [],
  invalid: [
    {
      file: string | null,
      reason: 'invalid_journal' | 'write_failed'
    }
  ],
  reason: string | null
}
```

Un JSON journal invalido non deve fare crash. Deve comparire in `invalid`, senza includere payload o contenuto del file nei log.

## Stato integrity interno

`getPersistenceIntegrityStatus(eventId, source?)` deve restituire sempre:

```js
{
  status:
    'no_known_partial' |
    'partial_persistence' |
    'recovery_failed',
  reason: string | null,
  source: 'sofa' | 'betfair' | null,
  commitId: string | null,
  affectedDocuments: []
}
```

In questo sotto-task non usare `recovery_pending`: quel valore potrà esistere solo quando la recovery bootstrap sarà implementata.

Regole:

```txt
nessun journal attivo verificabile
→ no_known_partial

journal pending con almeno un documento incompleto
→ partial_persistence
→ reason: pending_commit
→ affectedDocuments contiene soltanto i documenti completed:false

journal recovery_failed
→ recovery_failed
→ reason: recovery_failed oppure la reason machine-readable registrata
→ affectedDocuments contiene soltanto i documenti completed:false

journal pending con entrambi i documenti completed:true
→ no_known_partial
```

Se esistono più journal attivi per lo stesso eventId, con source opzionale assente:

```txt
recovery_failed ha precedenza su partial_persistence;
a parità, scegliere createdAt più vecchio;
a ulteriore parità, commitId in ordine lessicografico.
```

L’ordine non deve dipendere da `readdirSync`.

## Test obbligatori

Crea `backend/src/sofa/matchHistory/commitJournal.test.mjs` standalone, eseguibile direttamente con Node e senza dipendenze.

Copri almeno:

```txt
1. create pending commit
→ JSON valido
→ esito created
→ nessun .tmp

2. rename fallito
→ esito failed/write_failed
→ journal precedente invariato
→ .tmp pulito quando possibile

3. stesso commitId e stesso record
→ unchanged
→ nessun duplicato

4. commitId diverso ma stesso eventId + source
→ pending_exists
→ primo journal invariato

5. mark history complete
→ history true
→ timeline false

6. mark timeline complete
→ timeline true
→ history preservata

7. mark ripetuto
→ unchanged

8. documentName invalido
→ failed/invalid_document

9. remove troppo presto
→ failed/not_completed

10. entrambi completed
→ remove consentito

11. remove ripetuto dopo rimozione
→ unchanged

12. mark recovery_failed
→ record preservato
→ status recovery_failed
→ reason machine-readable preservata

13. integrity senza journal
→ no_known_partial

14. integrity pending con history incompleta
→ partial_persistence
→ affectedDocuments ['history']

15. integrity recovery_failed
→ recovery_failed
→ affectedDocuments corretti

16. JSON journal invalido
→ nessun crash
→ errore osservabile in listPendingCommits
→ nessuna integrity inventata

17. payload con chiave vietata
→ invalid_record
→ nessun journal scritto

18. readdir in ordini diversi
→ stessa selezione integrity

19. journal sidecar
→ non viene individuato da getHistoryFile(eventId)
```

Per il test 19, usa una directory temporanea o fake: il file journal deve restare nella sottodirectory `.pending_commits` e `getHistoryFile(...)` non deve trovarlo.

## Comandi obbligatori

Esegui uno alla volta:

```bash
node --check backend/src/sofa/matchHistory/commitJournal.js
node backend/src/sofa/matchHistory/commitJournal.test.mjs

node backend/src/sofa/matchHistory/storage.test.mjs
node backend/src/sofa/timelineStore.test.mjs
```

Non usare Git.

## Regola di stop

Massimo tre tentativi ragionati. Dopo il terzo, fermati.

## Output finale obbligatorio

Scrivi solo:

```txt
file verificati;
file modificati;
riepilogo modifiche;
comandi eseguiti;
esito completo di ogni test;
eventuali limiti/non verificato;
eventuali errori incontrati;
```

# COMPLETATO Prompt 3 — Commit SofaScore journalizzato e propagazione failure

## Contesto da allegare

**Codice**

```txt
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/sofaUpdates.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/trackerUpdate.js
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/matchTracker.js
```

**Test**

```txt
backend/src/sofa/matchHistory/sofaUpdates.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/trackerUpdate.test.mjs
backend/src/sofa/sourceIdentityGate.test.mjs
backend/src/sofa/matchTracker.test.mjs
backend/src/sofa/matchHistory/storage.test.mjs
backend/src/sofa/timelineStore.test.mjs
```

**Documentazione di riferimento, sola lettura**

```txt
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
docs/tennis-decision-ui/modules/sofa/01-live-tracking.mdx
docs/tennis-decision-ui/modules/evidence/02-source-identity.mdx
```

## Obiettivo

Rendere logicamente atomico il commit SofaScore composto da:

```txt
history aggregata Sofa
timeline canonica Sofa
```

usando il journal già implementato in:

```txt
backend/src/sofa/matchHistory/commitJournal.js
```

Un commit deve sapere con precisione se è:

```txt
completo
parziale
fallito prima della prima scrittura
bloccato da un journal precedente
```

Non implementare ancora recovery bootstrap server, route HTTP, Evidence, Source Identity API o commit Betfair.

## Confini rigorosi

Non modificare:

```txt
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/
backend/src/routes/
backend/src/server.js
Evidence
Source Identity algorithm
frontend
scraper
documentazione
dipendenze
backend/match_history/ esistente
```

Non usare Git.

Non creare database, queue, cron, retry scheduler o processi background.

## File autorizzati

Puoi modificare solo:

```txt
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/sofaUpdates.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/trackerUpdate.js
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/matchTracker.js

backend/src/sofa/matchHistory/sofaUpdates.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/trackerUpdate.test.mjs
backend/src/sofa/sourceIdentityGate.test.mjs
backend/src/sofa/matchTracker.test.mjs
backend/src/sofa/matchHistory/storage.test.mjs
backend/src/sofa/timelineStore.test.mjs
```

`storage.js` e `timelineStore.js` possono essere modificati solo se indispensabile per riscrivere un documento canonico già preparato nel journal, senza rigenerare timestamp, sequenze, tick o payload.

Non fare refactor generici.

## Contratti da preservare

```txt
- History e timeline restano documenti canonici separati.
- localContext resta soltanto nel tick timeline Sofa.
- localContext non entra nella history aggregata.
- Source Identity Gate resta owner della decisione di persistenza.
- L’algoritmo di Source Identity non deve leggere, confrontare o serializzare localContext.
- Prima di recording, nessuna history o timeline deve essere scritta.
- Bootstrap conserva l’ordine SofaScore → Betfair.
- Un bootstrap Sofa fallito non deve avviare la persistenza bootstrap Betfair.
- Il gate non deve ritentare automaticamente lo stesso bootstrap fallito.
- Nessun risultato undefined deve essere trattato come successo.
```

## Stato journal già disponibile

Il journal espone almeno:

```js
createPendingCommit(record)
getPendingCommit(commitId)
findPendingCommit({ eventId, source })
markDocumentComplete(commitId, documentName)
markRecoveryFailed(commitId, reason)
removeCompletedCommit(commitId)
listPendingCommits()
getPersistenceIntegrityStatus(eventId, source?)
```

Non cambiare il formato dei record journal salvo quanto richiesto qui per risolvere il cleanup dei record completati.

## Commit result Sofa

`addSofaUpdate(...)` e `persistSofaTrackingSample(...)` devono restituire sempre un risultato esplicito:

```js
{
  ok: boolean,
  operation: 'sofa_commit',
  source: 'sofa',
  eventId: string | null,
  commitId: string | null,
  status: 'complete' | 'unchanged' | 'partial' | 'failed',
  reason:
    | null
    | 'persistence_incomplete'
    | 'journal_write_failed'
    | 'journal_cleanup_failed'
    | 'recovery_required',
  failedDocument: 'history' | 'timeline' | 'journal' | null
}
```

Regole:

```txt
nessuna modifica materiale
→ ok:true
→ status: unchanged
→ commitId:null

commit completo
→ ok:true
→ status: complete

history fallisce prima di essere completata
→ ok:false
→ status: failed
→ reason:persistence_incomplete
→ failedDocument:history

history completa + timeline fallisce
→ ok:false
→ status: partial
→ reason:persistence_incomplete
→ failedDocument:timeline

errore journal create/update
→ ok:false
→ status: failed o partial secondo stato raggiunto
→ failedDocument:journal

errore remove journal dopo entrambi i documenti completati
→ ok:false
→ status: failed
→ reason:journal_cleanup_failed
→ failedDocument:journal
```

Non restituire `undefined`, boolean semplici o path come risultato commit.

## A. Preparazione deterministica del commit

Prima di qualsiasi scrittura canonica Sofa:

1. calcola deduplica e nessuna-modifica usando la logica esistente;
2. se non esiste modifica materiale, non creare journal;
3. prepara in memoria gli oggetti canonici completi per:

   * history aggregata;
   * documento timeline Sofa completo;
4. deriva i target con i resolver canonici esistenti, non costruendo path manualmente;
5. crea il journal con payload sufficienti a riscrivere il solo documento mancante senza ricalcolare:

   * score;
   * snapshot;
   * localContext;
   * timestamp;
   * elapsedSeconds;
   * sequence;
   * metadata;
   * stato runtime.

Il journal deve contenere payload con forma esplicita equivalente a:

```js
{
  documents: {
    history: {
      target: '<canonical history path>',
      payload: {
        document: '<history object completo>',
        metadata: '<history metadata necessaria>'
      },
      completed: false
    },
    timeline: {
      target: '<canonical timeline path>',
      payload: {
        document: '<timeline object completo>',
        metadata: '<timeline metadata necessaria>'
      },
      completed: false
    }
  }
}
```

Non inserire dati sensibili nel journal.

## B. Commit nuovo Sofa

Per un nuovo commit:

```txt
createPendingCommit
→ write history canonica
→ markDocumentComplete(history)
→ write timeline canonica
→ markDocumentComplete(timeline)
→ removeCompletedCommit
→ complete
```

Regole:

```txt
- Se history fallisce, non tentare timeline.
- Se history riesce e timeline fallisce, lascia il journal pending.
- Non fare rollback della history.
- Se markDocumentComplete fallisce dopo una scrittura riuscita,
  il journal resta incompleto e il commit deve risultare non-ok.
- Non aggiornare artificialmente il journal per simulare successo.
- Non creare tick aggiuntivi durante una ripresa.
```

## C. Ripresa esplicita di un commit pending

All’inizio di `addSofaUpdate(...)`:

1. cerca un journal attivo per `eventId + source:'sofa'`;
2. se esiste un record `pending`, riprendi quel record;
3. non generare un nuovo commitId;
4. non ricostruire history o timeline da snapshot correnti;
5. non rigenerare timestamp, sequence, elapsedSeconds o localContext;
6. scrivi soltanto i documenti con `completed:false`;
7. dopo ogni scrittura riuscita, marca soltanto quel documento completato;
8. rimuovi il journal solo quando entrambi sono completati.

Per il retry della timeline, non usare `saveTimeline(...)` in modo append-only se può rigenerare tick, timestamp o sequence.

Devi riusare il documento timeline completo contenuto nel journal e una primitiva di scrittura documento completo. `writeTimelineDocument(...)` è il percorso preferito se rispetta il target canonico memorizzato.

Per history, riusa l’oggetto completo nel journal. Aggiungi un helper diretto solo se `saveHistory(...)` non può riscrivere esattamente il documento già preparato.

Se il writer restituisce un file diverso dal target journal, non marcare il documento completato. Restituisci failure senza creare un secondo documento.

## D. Journal recovery_failed

Questo task non deve chiamare `markRecoveryFailed(...)`.

Se viene trovato un journal Sofa con:

```txt
status === recovery_failed
```

non sovrascriverlo, non riprenderlo automaticamente e non crearne uno sostitutivo.

Restituisci:

```js
{
  ok: false,
  status: 'failed',
  reason: 'recovery_required',
  failedDocument: 'journal'
}
```

La recovery effettiva sarà implementata in un task successivo.

## E. Cleanup di journal completato residuo

Correggi il journal soltanto se necessario per questo caso:

```txt
history completed
timeline completed
removeCompletedCommit fallisce
→ record completo resta su disco
→ un commit futuro per stesso eventId + source non deve restare bloccato in pending_exists senza possibilità di cleanup
```

Regola richiesta:

```txt
createPendingCommit per eventId + source:
- se esiste journal attivo incompleto
  → pending_exists;

- se esiste journal completato
  → tenta removeCompletedCommit in modo esplicito;
  → se remove riesce, crea il nuovo journal;
  → se remove fallisce, restituisce failure;
  → non sovrascrive mai il record completato.
```

Non ignorare o accumulare journal completati silenziosamente.

Aggiungi il test corrispondente in `commitJournal.test.mjs`.

## F. Propagazione tracker e bootstrap

### persistSofaTrackingSample

Deve propagare integralmente il commit result di `addSofaUpdate(...)`.

```txt
result?.ok === true
→ successo

ok:false oppure undefined
→ fallimento write_failed
```

Non convertire un risultato fallito in `{ ok:true }`.

### updateSofa e localContext

`updateSofa(...)` deve continuare a costruire `localContext`.

Quando deve essere usato per la persistenza bootstrap:

```txt
- localContext deve transitare come dato opaco di persistenza;
- non deve entrare nel sample/fingerprint usato dal Source Identity Gate;
- non deve alterare comparazioni, gating o decisioni Source Identity;
- deve arrivare a persistSofaTrackingSample e quindi soltanto al tick timeline Sofa.
```

Non inserirlo nella history.

### Source Identity Gate

Non modificare la logica di identificazione, le soglie, lo stato o il retry policy.

Deve restare vero:

```txt
callback bootstrap restituisce ok:false oppure undefined
→ gate resta pending
→ errore bootstrap sintetico
→ nessun retry automatico sul tick successivo
→ non entra recording
```

Usa `result?.ok === true` come unica condizione di successo.

### matchTracker bootstrap

Nel bootstrap:

```txt
persistenza Sofa deve completare prima di Betfair;
fallimento Sofa
→ non persistire/bootstrap Betfair;
→ gate resta pending;
→ errore Bootstrap persistence failed, o testo esistente equivalente;
→ undefined non è successo.
```

Il bootstrap deve inoltrare `localContext` alla persistenza Sofa senza inserirlo nell’identità della sorgente.

## Test obbligatori

Mantieni tutti i test esistenti e aggiungi copertura per:

```txt
1. history succeeds + timeline fails
→ journal pending
→ history marked completed
→ timeline incomplete
→ result ok:false / partial
→ no falso successo

2. retry stesso pending commit
→ stesso commitId
→ solo timeline riscritta
→ history non duplicata
→ nessun tick timeline aggiuntivo
→ journal rimosso dopo completamento

3. history fails
→ timeline non tentata
→ journal pending
→ result failed
→ history e timeline non dichiarate completed

4. markDocumentComplete fallisce dopo writer riuscito
→ risultato non-ok
→ journal resta incompleto
→ retry scrive soltanto il documento non confermato

5. commit completo
→ journal rimosso
→ result complete
→ nessun duplicate tick Sofa

6. remove journal fallisce dopo completamento
→ result journal_cleanup_failed
→ nessun nuovo journal sovrascrive quello esistente

7. commit futuro dopo journal completato residuo
→ cleanup esplicito del residuo
→ nuovo commit creato soltanto dopo cleanup riuscito

8. journal recovery_failed esistente
→ nessuna riscrittura
→ recovery_required
→ nessun nuovo commit

9. persistSofaTrackingSample riceve undefined
→ failure write_failed

10. bootstrap Sofa persistence ok:false
→ gate pending
→ Betfair bootstrap non eseguito
→ nessun retry automatico

11. bootstrap Sofa persistence undefined
→ stesso comportamento failure

12. localContext bootstrap
→ arriva al tick timeline Sofa
→ non compare nella history
→ non altera input o decisione Source Identity
```

Aggiungi o aggiorna test nel file corretto:

```txt
sofaUpdates.test.mjs
→ commit, retry, deduplica, journal

commitJournal.test.mjs
→ cleanup residuo completato

trackerUpdate.test.mjs
→ propagazione structured result e undefined

sourceIdentityGate.test.mjs
→ pending/no-retry su persistence failure

matchTracker.test.mjs
→ ordine Sofa → Betfair, localContext, undefined failure
```

Aggiorna `storage.test.mjs` o `timelineStore.test.mjs` soltanto se viene aggiunta una primitiva diretta per riscrivere documenti preparati.

## Comandi obbligatori

Esegui uno alla volta:

```bash
node --check backend/src/sofa/matchHistory.js
node --check backend/src/sofa/matchHistory/sofaUpdates.js
node --check backend/src/sofa/matchHistory/commitJournal.js
node --check backend/src/sofa/trackerUpdate.js
node --check backend/src/sofa/sourceIdentityGate.js
node --check backend/src/sofa/matchTracker.js

node backend/src/sofa/matchHistory/sofaUpdates.test.mjs
node backend/src/sofa/matchHistory/commitJournal.test.mjs
node backend/src/sofa/trackerUpdate.test.mjs
node backend/src/sofa/sourceIdentityGate.test.mjs
node backend/src/sofa/matchTracker.test.mjs
node backend/src/sofa/matchHistory/storage.test.mjs
node backend/src/sofa/timelineStore.test.mjs
```

Se un file test indicato non esiste, non crearne uno nuovo automaticamente: riportalo e fermati prima di modificare file fuori scope.

## Metodo

Apri prima i file reali. Non applicare patch con ancore non verificate.

Massimo tre tentativi ragionati. Se un test fallisce, continua con gli altri per produrre l’inventario completo.

## Output finale obbligatorio

Scrivi solo:

```txt
file verificati;
file modificati;
riepilogo modifiche;
comandi eseguiti;
esito completo di ogni test;
eventuali limiti/non verificato;
eventuali errori incontrati;
```

# COMPLETATO Prompt 4 — Commit Betfair journalizzato e repair duplicate-aware

## Contesto da allegare

### Codice da leggere

```txt
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/processor.js
backend/src/sofa/betfair/trackerUpdate.js
backend/src/sofa/betfairFetch.js

backend/src/sofa/betfair/timeline.js
backend/src/sofa/betfair/timeline/state.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
backend/src/sofa/matchHistory/commitJournal.js
```

### Test da leggere ed eseguire

```txt
backend/src/sofa/betfair/processor.test.mjs
backend/src/sofa/betfair/timeline/state.test.mjs
backend/src/sofa/matchHistory/betfairUpdates.test.mjs
backend/src/sofa/betfair/trackerUpdate.test.mjs
backend/src/sofa/betfairFetch.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/storage.test.mjs
backend/src/sofa/timelineStore.test.mjs
backend/src/sofa/scraperLifecycle.test.mjs
backend/src/sofa/matchTracker.test.mjs
```

### Documentazione di riferimento, sola lettura

```txt
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
docs/tennis-decision-ui/modules/sofa/01-live-tracking.mdx
```

## Obiettivo

Integrare il journal già disponibile in:

```txt
backend/src/sofa/matchHistory/commitJournal.js
```

nel commit Betfair canonico, composto da:

```txt
history aggregata
timeline Betfair canonica
```

e correggere il caso in cui un `duplicate_tick` o un `regressive_tick` nasconde un commit incompleto noto per:

```txt
eventId + source:'betfair'
```

Non implementare recovery bootstrap server, API HTTP, Evidence, Source Identity o modifiche Betfair UI.

## Confini rigorosi

Non modificare:

```txt
backend/src/routes/
backend/src/server.js
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/matchEvidence/
frontend
scraper Python
documentazione
dipendenze
backend/match_history/ esistente
```

Non usare Git.

Non introdurre database, queue, scheduler, retry background o nuovi moduli generici di persistence.

## File autorizzati per modifica

Puoi modificare solo:

```txt
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/processor.js
backend/src/sofa/betfair/trackerUpdate.js
backend/src/sofa/betfairFetch.js

backend/src/sofa/betfair/processor.test.mjs
backend/src/sofa/matchHistory/betfairUpdates.test.mjs
backend/src/sofa/betfair/trackerUpdate.test.mjs
backend/src/sofa/betfairFetch.test.mjs
```

Puoi modificare `commitJournal.test.mjs` solo se serve coprire un comportamento journal generico non già testato.

I seguenti file sono read-only: non modificarli salvo blocco tecnico dimostrato e riportato prima della modifica:

```txt
backend/src/sofa/betfair/timeline.js
backend/src/sofa/betfair/timeline/state.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
backend/src/sofa/matchHistory/commitJournal.js
```

Non creare test file nuovi se esiste già una suite pertinente.

## Contratti da preservare

```txt
- selectionId resta l’unica identità runner.
- Tick regressivo ordinario resta unchanged:
  nessuna history, timeline, journal o marketState nuovo.
- Tick duplicate ordinario resta unchanged quando non esiste journal attivo.
- Le regole status-only Graph logout restano invariate.
- La sequenza canonica Betfair è già determinata prima del journal.
- marketState viene commitato soltanto dopo successo canonico completo.
- La timeline legacy Betfair resta non canonica.
- Il cleanup legacy non può rendere fallito un commit canonico completato.
- Non usare saveTimeline(...) per la ripresa journalizzata.
- Non rigenerare seq, timestamp, tick, history o payload durante repair.
- Non modificare classificazione tecnica, deduplicazione, regressione,
  Money Flow, health o logiche selectionId.
```

## Risultato esplicito di persistenza

La persistenza Betfair deve restituire sempre un risultato esplicito:

```js
{
  ok: boolean,
  operation: 'betfair_commit',
  source: 'betfair',
  eventId: string | null,
  commitId: string | null,
  status: 'complete' | 'recovered' | 'unchanged' | 'partial' | 'failed',
  reason:
    | null
    | 'duplicate_tick'
    | 'regressive_tick'
    | 'persistence_incomplete'
    | 'journal_write_failed'
    | 'journal_cleanup_failed'
    | 'recovery_required',
  failedDocument: 'history' | 'timeline' | 'journal' | null,
  legacyWarning: null | {
    code: 'legacy_cleanup_failed' | 'legacy_write_failed'
  }
}
```

Regole:

```txt
commit canonico completo
→ ok:true
→ status:complete

repair journal pending completata
→ ok:true
→ status:recovered

duplicate senza journal attivo
→ ok:true
→ status:unchanged
→ reason:duplicate_tick

regressivo senza journal attivo
→ ok:true
→ status:unchanged
→ reason:regressive_tick

history fallita
→ ok:false
→ status:failed
→ reason:persistence_incomplete
→ failedDocument:history

history completata + timeline fallita
→ ok:false
→ status:partial
→ reason:persistence_incomplete
→ failedDocument:timeline

journal recovery_failed
→ ok:false
→ status:failed
→ reason:recovery_required
→ failedDocument:journal

cleanup journal fallito dopo entrambi i documenti
→ ok:false
→ status:failed
→ reason:journal_cleanup_failed
→ failedDocument:journal
```

Non restituire `undefined`, boolean semplici o un generico `skipped` per esiti di persistenza.

## A. Unico owner del commit canonico

Individua il punto applicativo che oggi persiste il sample Betfair accettato.

Quel punto deve diventare l’unico owner del commit logico:

```txt
history aggregata + timeline Betfair canonica
```

Non lasciare scritture canoniche duplicate tra:

```txt
processor.js
betfairUpdates.js
betfairFetch.js
trackerUpdate.js
```

`matchHistory.js` deve soltanto cablare al flusso Betfair i contratti già esistenti:

```js
resolveHistoryFile
writeHistoryDocument
getTimelineFile
writeTimelineDocument
journalStore
```

Non costruire path manualmente.

## B. Preparazione deterministica prima del journal

Per un sample Betfair già accettato e persistibile:

1. costruisci il tick canonico completo, con `seq` già deciso;
2. prepara la history aggregata completa che includerà il nuovo sample;
3. prepara il documento timeline Betfair completo che includerà il tick;
4. deriva target canonici tramite resolver esistenti;
5. crea il journal prima di ogni scrittura.

Il journal deve contenere:

```js
{
  documents: {
    history: {
      target: '<target history canonico>',
      payload: {
        document: '<history completa>',
        metadata: '<metadata history>'
      },
      completed: false
    },
    timeline: {
      target: '<target timeline Betfair canonico>',
      payload: {
        document: '<timeline completa con tick e seq già decisi>',
        metadata: '<metadata timeline>'
      },
      completed: false
    }
  }
}
```

Il payload deve essere sufficiente a riscrivere il solo documento mancante senza ricalcolare:

```txt
seq
timestamp
elapsedSeconds
tick
runner identity
money flow
stato tecnico
history row
```

Non inserire dati sensibili nel journal.

## C. Sequenza commit Betfair

Per un nuovo sample accettato:

```txt
createPendingCommit
→ writeHistoryDocument
→ markDocumentComplete(history)
→ writeTimelineDocument('betfair', ...)
→ markDocumentComplete(timeline)
→ removeCompletedCommit
→ complete
```

Regole:

```txt
- Se history fallisce, non tentare timeline canonica.
- Se history riesce e timeline fallisce, lascia il journal pending.
- Non fare rollback della history.
- Se markDocumentComplete fallisce dopo una write riuscita,
  ritorna failure e lascia journal incompleto.
- Se removeCompletedCommit fallisce, ritorna journal_cleanup_failed.
- Non aggiornare marketState in alcuno degli esiti non-ok.
- Non usare timeline legacy come prova del commit.
```

`writeTimelineDocument(...)` deve riscrivere il documento completo journalizzato. Non usare `saveTimeline(...)` nella sequenza di repair o retry.

## D. Repair prima di duplicate e regressione

Prima di restituire `duplicate_tick` o `regressive_tick`, verifica:

```js
journalStore.findPendingCommit({
  eventId,
  source: 'betfair'
})
```

### Journal pending

Se esiste un journal `pending`:

```txt
- non generare un nuovo tick;
- non generare un nuovo seq;
- non rigenerare history;
- non ricalcolare il payload;
- usa esclusivamente target, document e metadata già nel journal;
- scrivi soltanto documenti completed:false;
- marca solo i documenti effettivamente riscritti;
- rimuovi il journal solo dopo entrambi completati;
- ritorna recovered in caso di successo.
```

Se history è già completata:

```txt
→ non riscrivere history
→ scrivi soltanto timeline canonica
```

Se timeline è già completata:

```txt
→ non riscrivere timeline
→ scrivi soltanto history
```

Dopo recovery riuscita, commit `marketState` una sola volta e solo allo stato corrispondente al contenuto canonico ormai persistito.

### Journal recovery_failed

Se esiste un journal con:

```txt
status === 'recovery_failed'
```

non scrivere nulla, non creare un nuovo commit e non restituire `duplicate_tick` o `regressive_tick`.

Ritorna:

```js
{
  ok: false,
  status: 'failed',
  reason: 'recovery_required',
  failedDocument: 'journal'
}
```

### Nessun journal attivo

Solo in assenza di journal attivo:

```txt
duplicate_tick
→ unchanged normale

regressive_tick
→ unchanged normale
```

Nessuno dei due deve creare journal, history, timeline o marketState.

## E. marketState e stato runtime

Preserva la separazione tra stato candidato e stato committato.

Regole obbligatorie:

```txt
- Il processor può costruire un candidato/pending state.
- marketState definitivo viene aggiornato soltanto dopo
  complete o recovered.
- partial, failed, journal_cleanup_failed e recovery_required
  non devono aggiornare marketState.
- duplicate_tick e regressive_tick non devono produrre
  un nuovo marketState.
- Dopo repair riuscita, lo stato runtime deve essere coerente
  con il tick canonico recuperato e non con un tick rigenerato.
```

Non modificare algoritmi di classificazione o regressione per ottenere questo risultato.

## F. Timeline legacy e cleanup

La timeline legacy Betfair resta compatibile ma non canonica.

Esegui eventuale scrittura o cleanup legacy solo dopo:

```txt
commit canonico completo
+ journal rimosso con successo
```

Se la parte legacy fallisce:

```txt
- mantieni ok:true;
- mantieni status:complete oppure recovered;
- aggiungi legacyWarning strutturata;
- non creare o riaprire journal;
- non annullare marketState;
- non cambiare l’esito della history/timeline canonica.
```

Non trattare la timeline legacy come documento journalizzato e non usarla per dedurre `seq`, duplicate o recovery.

## Test obbligatori

Mantieni tutti i test esistenti e aggiungi copertura almeno per:

```txt
1. history writer fallisce
→ timeline canonica non tentata
→ journal pending con entrambi completed:false
→ result failed / persistence_incomplete / history
→ marketState non commitato
→ legacy non eseguita

2. history completa + timeline canonica fallisce
→ journal pending
→ history completed:true
→ timeline completed:false
→ result partial / persistence_incomplete / timeline
→ marketState non commitato

3. retry identico con journal pending
→ repair dal payload journalizzato
→ stesso commitId
→ stessa seq
→ history non duplicata
→ nessun nuovo tick rigenerato
→ journal rimosso
→ result recovered
→ marketState commitato una sola volta

4. duplicate_tick senza journal
→ unchanged / duplicate_tick
→ nessuna history
→ nessuna timeline
→ nessun journal
→ marketState invariato

5. regressive_tick senza journal
→ unchanged / regressive_tick
→ nessuna history
→ nessuna timeline
→ nessun journal
→ marketState invariato

6. journal recovery_failed
→ recovery_required
→ nessuna write
→ nessun nuovo commit
→ marketState invariato

7. markDocumentComplete fallisce dopo history write
→ result partial o failed coerente
→ timeline non tentata
→ marketState non commitato

8. removeCompletedCommit fallisce dopo history e timeline
→ journal_cleanup_failed
→ marketState non commitato
→ nessuna modifica legacy

9. legacy write o cleanup fallisce dopo commit canonico completo
→ ok:true
→ status complete o recovered
→ legacyWarning presente
→ journal assente
→ marketState commitato
→ history e timeline canonica restano integre

10. writer restituisce target diverso dal target journalizzato
→ failure
→ nessun falso completed marker
→ marketState non commitato
```

Aggiorna le suite pertinenti:

```txt
processor.test.mjs
→ classificazione invariata, state commit, duplicate/regressive repair ordering

betfairUpdates.test.mjs
→ history preparata, commit canonico, retry/recovery, no duplicate history

trackerUpdate.test.mjs
→ propagazione result?.ok === true come unico successo

betfairFetch.test.mjs
→ legacy warning senza annullare commit canonico

commitJournal.test.mjs
→ solo se serve un test generico aggiuntivo sul journal

timeline/state.test.mjs
→ regressione seq e duplicate invariati
```

## Comandi obbligatori

Esegui uno alla volta:

```bash
node --check backend/src/sofa/matchHistory.js
node --check backend/src/sofa/matchHistory/betfairUpdates.js
node --check backend/src/sofa/betfair/processor.js
node --check backend/src/sofa/betfair/trackerUpdate.js
node --check backend/src/sofa/betfairFetch.js

node backend/src/sofa/betfair/processor.test.mjs
node backend/src/sofa/betfair/timeline/state.test.mjs
node backend/src/sofa/matchHistory/betfairUpdates.test.mjs
node backend/src/sofa/betfair/trackerUpdate.test.mjs
node backend/src/sofa/betfairFetch.test.mjs
node backend/src/sofa/matchHistory/commitJournal.test.mjs
node backend/src/sofa/matchHistory/storage.test.mjs
node backend/src/sofa/timelineStore.test.mjs
node backend/src/sofa/scraperLifecycle.test.mjs
node backend/src/sofa/matchTracker.test.mjs
```

Se un file test indicato non esiste, non crearne uno automaticamente: riportalo e fermati prima di modificare file fuori scope.

## Metodo obbligatorio

Apri prima i file reali e individua il solo owner attuale della persistenza canonica Betfair.

Non applicare patch con ancore non verificate.

Massimo tre tentativi ragionati. Se una suite fallisce, esegui comunque le altre per produrre l’inventario completo.

## Output finale obbligatorio

Scrivi solo:

```txt
file verificati;
file modificati;
riepilogo modifiche;
comandi eseguiti;
esito completo di ogni test;
eventuali limiti/non verificato;
eventuali errori incontrati;
```

# COMPLETATO Backlog di consolidamento 1–4

## Criterio di priorità

* **P0**: blocca l’avvio affidabile del Prompt 5 o rende non verificabile il contratto fondamentale della Task 6.
* **P1**: va risolto o deciso prima della chiusura della Task 6.
* **P2**: hardening necessario prima della validazione finale.
* **P3**: pulizia o miglioramento non bloccante.

---

## P0 — Da correggere prima del Prompt 5

### P0-01 — Distinguere history assente da history corrotta o illeggibile

**Origine:** Task 6.1

`loadHistory(eventId)` non deve più restituire lo stesso `null` per history assente, JSON invalido, errore di lettura o errore di discovery. Oggi questo può indurre un updater a creare una nuova history e sovrascrivere un file corrotto come se non fosse mai esistito.

**Implementazione richiesta**

1. Aggiungere una lettura strutturata, ad esempio `loadHistoryResult(eventId)`.
2. Distinguere almeno `found`, `missing`, `invalid_json`, `read_failed`, `discovery_failed`.
3. Consentire la creazione di nuova history soltanto per `missing`.
4. Fermare i flussi mutanti con esito strutturato negli altri casi.
5. Non sovrascrivere mai automaticamente un file business non leggibile.

**Test obbligatori**

* history assente → nuova history ammessa;
* JSON invalido → failure, nessun `saveHistory`;
* errore di lettura → failure, nessun `saveHistory`;
* file corrotto → contenuto invariato dopo il tentativo.

---

### P0-02 — Persistire un unico `commitId` in journal, history, tick e risultati

**Origine:** Task 6.3 e 6.4

Il `commitId` viene creato e registrato nel journal, ma non viene aggiunto alla row history né al tick canonico Sofa o Betfair. Questo rompe la correlazione persistita tra le due scritture business e il commit logico.

**Implementazione richiesta**

1. Generare il `commitId` prima della costruzione dei payload canonici.
2. Inserire lo stesso valore nella nuova row history.
3. Inserire lo stesso valore nel tick Sofa e nel tick Betfair.
4. Conservarlo invariato nel journal e nei retry.
5. Restituirlo nell’envelope del commit.
6. Propagarlo anche nei writer journalizzati, dove richiesto dal contratto generale.

**Test obbligatori**

* `historyRow.commitId === timelineTick.commitId === journal.commitId === result.commitId`;
* retry dopo failure timeline → stesso `commitId`, nessuna row o tick duplicato;
* Sofa e Betfair devono rispettare lo stesso contratto.

---

### P0-03 — Rendere il `commitId` resistente ai restart

**Origine:** Task 6.3

Il generatore basato su `Date.now()` e contatore in memoria può ripartire dopo restart; il report richiede un identificatore più robusto senza nuove dipendenze.

**Implementazione richiesta**

* sostituire o rafforzare il generatore con un identificatore collision-resistant tra riavvii;
* mantenere il formato sicuro per file name previsto dal journal;
* testare generazioni con clock uguale e restart simulato.

---

### P0-04 — Uniformare il contratto dei risultati di commit Sofa

**Origine:** Task 6.3

Quando `persistSofaTrackingSample(...)` riceve `undefined`, restituisce un fallback ridotto che non contiene `operation`, `source`, `eventId`, `commitId`, `status` o `failedDocument`. Il commit deve invece avere sempre un envelope completo.

**Implementazione richiesta**

1. Normalizzare `undefined` e risultati invalidi in un `sofa_commit` completo.
2. Applicare la stessa normalizzazione lungo `updateSofa(...)`.
3. Definire un solo vocabolario di `reason`, evitando incongruenze tra `write_failed` e `persistence_incomplete`.
4. Allineare il risultato aggregato al contratto generale: includere lo stato dei documenti `history` e `timeline`, oltre alle warning quando applicabili.

---

### P0-05 — Non perdere i dettagli del failure Sofa nel bootstrap

**Origine:** Task 6.3

Il bootstrap usa correttamente `sofaResult?.ok === true` per bloccare Betfair, ma riduce il risultato a `{ ok:false }`, perdendo causa, source, `commitId` e documento fallito.

**Implementazione richiesta**

* propagare il risultato Sofa fallito o restituire un envelope bootstrap strutturato;
* preservare almeno `reason`, `source`, `commitId`, `status` e `failedDocument`;
* mantenere Betfair non eseguito quando Sofa fallisce.

---

### P0-06 — Escludere le entry legacy Betfair prima del journal e del commit canonico

**Origine:** Task 6.4

La timeline journalizzata viene costruita clonando l’intera timeline esistente; le entry legacy vengono rimosse solo dopo il commit. Questo può contaminare il journal, la timeline canonica e il calcolo di `elapsedSeconds`.

**Implementazione richiesta**

1. Costruire il documento Betfair canonico partendo soltanto da entry realmente canoniche: source Betfair, `seq` numerico e runner validi.
2. Calcolare tempi e sequenze solo su tale base canonica.
3. Creare il journal solo con payload canonici.
4. Lasciare il cleanup legacy come operazione separata e best-effort, mai come parte del commit canonico.

---

### P0-07 — Verificare e correggere la persistenza di `selectionId` per il restore Betfair

**Origine:** Task 6.4

Il report rileva che il restore di `marketState` cerca `selectionId`, ma la history e `latestBetfairState` visibili nella snapshot sembrano non conservarlo. Dopo restart ciò può produrre runner senza identità stabile e alterare continuità di ladder, Money Flow e deduplica.

**Implementazione richiesta**

1. Verificare il comportamento con `runnerProcessing.js` e gli altri moduli mancanti.
2. Se confermato, persistere `selectionId` e solo gli altri campi canonici indispensabili al restore.
3. Aggiungere test di restart con fake filesystem o directory temporanea.
4. Verificare che non cambi la semantica di Money Flow o della strategia.

---

### P0-08 — Eseguire e completare le suite mancanti prima di dichiarare chiuso il Prompt 4

**Origine:** Task 6.4

Per il Prompt 4 è disponibile solo verifica statica e `node --check`; non sono state fornite né eseguite le suite obbligatorie, i failure test o i moduli dipendenti rilevanti.

**Interventi richiesti**

* recuperare e leggere le suite previste dal Prompt 4;
* eseguire failure injection, retry, target mismatch, cleanup journal fallito, warning legacy e repair pending;
* eseguire test di restart per `selectionId`;
* rieseguire tutto con Node `v24.11.1`.

---

## P1 — Da risolvere o decidere prima della chiusura della Task 6

### P1-01 — Correggere la specifica del cleanup dopo `recovery_failed`

**Origine:** Task 6.2

Prompt, codice e test non sono allineati: la specifica dice che un journal `recovery_failed` non è rimovibile nemmeno se entrambi i documenti sono completati; codice e test permettono invece la rimozione. Il report raccomanda di correggere la specifica, non il codice.

**Decisione da formalizzare**

* un journal è rimovibile quando history e timeline sono entrambe completate, anche se il suo status era `recovery_failed`;
* un `recovery_failed` incompleto resta non rimovibile.

Questo va registrato nel Prompt 2 rivisto e nei prompt successivi che usano recovery.

---

### P1-02 — Gestire il journal completo residuo dopo failure di cleanup

**Origine:** Task 6.4

Se `removeCompletedCommit` fallisce dopo che entrambi i documenti sono completati, il journal non è più attivo. Un retry duplicate/regressive può fermarsi senza riprovare il cleanup; la pulizia resta rinviata a un futuro sample nuovo.

**Decisione e implementazione**

* tentare un cleanup idempotente dei journal completi residui prima di restituire `unchanged`; oppure
* assegnare esplicitamente questa responsabilità alla recovery bootstrap del Prompt 5.

La responsabilità deve essere una sola e coperta da test.

---

### P1-03 — Definire la recovery quando il sample Betfair è tecnicamente inutilizzabile

**Origine:** Task 6.4

Un commit pending viene riparato soltanto se arriva un sample tecnicamente valido; con un sample non utilizzabile il flusso può restituire `unchanged` senza consultare il journal.

**Decisione richiesta per il Prompt 5**

* la recovery bootstrap deve riparare sempre i journal verificabili, senza attendere un nuovo sample;
* definire chiaramente che il polling normale non esegue repair in presenza di input tecnico non valido;
* aggiungere test dedicato per pending journal + sample tecnico non usabile.

---

### P1-04 — Stabilire il modello di concorrenza su `match_history`

**Origine:** Task 6.2

Il blocco `pending_exists` è verificato solo nella stessa istanza/processo. Due processi distinti potrebbero creare journal diversi per lo stesso `eventId + source`.

**Decisione richiesta**

* dichiarare formalmente backend single-process rispetto a `match_history`; oppure
* introdurre una creazione esclusiva/lock atomico.

Non è necessario aggiungere lock senza una reale esigenza multi-process, ma la decisione deve essere esplicita prima della chiusura della Task 6.

---

### P1-05 — Test del journal su filesystem reale

**Origine:** Task 6.2

I test del journal usano filesystem fake e non verificano rename e cleanup su filesystem reale.

**Implementazione richiesta**

* aggiungere una suite con directory temporanea reale;
* coprire write, rename failure simulata quando possibile, cleanup `.tmp`, aggiornamento marker e rimozione journal;
* non toccare `backend/match_history` reale.

---

### P1-06 — Non persistere `latest` derivato nel cleanup legacy

**Origine:** Task 6.4

Il cleanup legacy può riscrivere il JSON con `latest` riferito a un’entry appena rimossa.

**Implementazione richiesta**

* eliminare `timelineObj.latest` prima della write; oppure
* ricalcolarlo dal nuovo ultimo tick canonico.

La soluzione preferibile è mantenere `latest` come campo solo runtime e non persistito.

---

## P2 — Hardening e copertura necessaria prima della validazione finale

### P2-01 — Sanitizzare anche i valori stringa del journal

**Origine:** Task 6.4

Il journal blocca chiavi sensibili, ma non ispeziona contenuti stringa. Un campo ammesso potrebbe contenere URL con query parameter sensibili.

**Implementazione richiesta**

* non salvare URL completi nei payload journalizzati quando non sono necessari;
* ridurre URL a identificatori o forme normalizzate;
* aggiungere test con valori contenenti parametri sensibili;
* mantenere la sola eccezione stretta per `diagnostics.networkCaptureSummary`.

---

### P2-02 — Aggiungere test diretti degli updater per writer `undefined`

**Origine:** Task 6.1

La protezione esiste nei livelli a valle, ma le suite dirette di Sofa e Betfair updater non testano esplicitamente il ramo `undefined`.

**Test richiesti**

* `saveHistory` o `saveTimeline` / writer equivalente restituisce `undefined`;
* updater ritorna failure strutturata;
* nessuna operazione successiva tratta il risultato come successo.

---

### P2-03 — Completare i cinque test mancanti del commit Sofa

**Origine:** Task 6.3

Mancano coperture per marker history fallito, target mismatch, correlazione `commitId`, fallback `undefined` con envelope completo e propagazione strutturata del failure bootstrap.

**Scenari richiesti**

1. `markDocumentComplete('history')` fallisce dopo write history.
2. Writer timeline restituisce `ok:true`, ma con file diverso dal target.
3. Correlazione completa del `commitId`.
4. `undefined` → `sofa_commit` completo.
5. Failure Sofa bootstrap → dettagli preservati e Betfair non eseguito.

---

### P2-04 — Validazione integrata non ancora eseguita

**Origine:** Task 6.1 e 6.4

I report non includono una sessione browser reale, server HTTP reale, dati Betfair reali, suite completa repository o conferma della versione Node effettivamente usata; per il Prompt 4 mancano anche le suite mirate.

**Uso corretto di questo punto**

* non è un difetto automaticamente da correggere nel codice;
* è una lista di evidenze da raccogliere prima di dichiarare l’intera Task 6 validata.

---

## P3 — Pulizia e allineamento non bloccanti

### P3-01 — Rimuovere proprietà duplicate in `commitJournal.js`

**Origine:** Task 6.2

Il report segnala `commitId` duplicato nella comparazione di equivalenza e `status` duplicato nel risultato di `removeCompletedCommit`. Il comportamento non risulta errato, ma il codice va ripulito quando il modulo verrà modificato.

---

### P3-02 — Aggiornare prompt, brief e registro decisionale

**Origine:** Task 6.2, 6.3 e 6.4

Prima dei Prompt 5–9 vanno aggiornati i testi per riflettere:

* semantica corretta di rimozione `recovery_failed` completo;
* contratto comune del `commitId`;
* envelope aggregati completi;
* distinzione assoluta tra timeline canonica e legacy;
* policy di recovery per journal completi residui e sample tecnicamente non utilizzabili.

---

## Sequenza operativa raccomandata

1. Risolvere P0-01: lettura history strutturata e non distruttiva.
2. Definire e implementare il contratto unico `commitId` per Sofa e Betfair.
3. Correggere i risultati Sofa incompleti e la propagazione bootstrap.
4. Separare definitivamente timeline Betfair canonica e legacy.
5. Verificare e, se necessario, correggere il restore `selectionId`.
6. Eseguire le suite mancanti e aggiungere i test P0/P2.
7. Formalizzare le decisioni P1 nel Prompt 5 rivisto.
8. Solo dopo, revisionare i Prompt 5–9 contro il contratto consolidato.

## Stato sintetico per Prompt

* **6.1:** core solido, ma non chiuso finché history assente e history corrotta non sono distinguibili.
* **6.2:** chiuso localmente, ma va allineata la specifica e va presa una decisione sul multi-process.
* **6.3:** non chiuso: mancano correlazione persistita, envelope failure completi, bootstrap strutturato e test mirati.
* **6.4:** non chiuso: mancano separazione canonico/legacy, `commitId` nei documenti, verifica restore e prove test reali.

# COMPLETATO Prompt 5 — Recovery bootstrap prima di `app.listen`

Lavora sul progetto locale **Tennis Decision UI**.

Non produrre piano, ragionamento esteso, todo, analisi architetturale o messaggi intermedi. Leggi i file autorizzati, applica una patch coerente, esegui il comando completo secondo la regola dei tre tentativi e scrivi solo il report finale.

## Obiettivo

Implementare la recovery dei journal persistenti al bootstrap backend, prima che Express inizi a servire richieste.

Flusso obbligatorio:

```txt
createApp()
→ scansione journal
→ recovery / cleanup residuale
→ summary serializzabile
→ app.listen(...)
```

La recovery deve usare esclusivamente dati già presenti nel journal. Non deve acquisire dati live, ricostruire sample, avviare tracker o inventare documenti business.

## Stato già implementato da preservare

```txt
- Journal sidecar persistente per commit correlati Sofa e Betfair.
- commitId comune fra journal, history row, timeline tick, writer result e result finale.
- Writer validi solo con ok:true, file target atteso e commitId atteso.
- Repair Sofa e Betfair già esistente per journal pending.
- Journal completed residual da rimuovere prima del normale flusso.
- Sample tecnico Betfair può tentare repairOnly ma non muta marketState.
- recovery_failed blocca nuovi commit normali.
```

## File modificabili

Puoi modificare o creare solo:

```txt
backend/src/server.js

backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/matchHistory/sofaUpdates.js
backend/src/sofa/betfair/processor.js

backend/src/server.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs
backend/src/sofa/matchHistory/sofaUpdates.test.mjs
backend/src/sofa/betfair/processor.test.mjs
```

## File read-only

Puoi leggerli solo per rispettare firme e contratti reali:

```txt
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
backend/src/sofa/betfairFetch.js
backend/src/sofa/betfair/trackerUpdate.js
backend/src/sofa/matchTracker.js
backend/src/sofa/sourceIdentityGate.js
backend/package.json

docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
docs/tennis-decision-ui/operations/01-local-runtime.mdx
```

Non creare o modificare file diversi da quelli autorizzati.

## Non modificare

```txt
route HTTP
frontend
launcher
avvio.py
scraper Python
tracking normale
Source Identity
Evidence
Money Flow
Graph URL
health API
porte
middleware Express
mount route
shutdown semantico SIGINT/SIGTERM
documentazione
```

## Contratti bootstrap

```txt
- npm start continua ad avviare Express su PORT oppure 3001.
- Importare server.js non deve eseguire app.listen().
- createApp() costruisce solo Express e route.
- startServer() esegue la recovery prima di listen.
- Shutdown SIGINT/SIGTERM esistente resta attivo una sola volta.
- Recovery non esegue fetch HTTP, GET HTTP, tracker, scraper, browser,
  Source Identity, Evidence o polling.
- Recovery non genera commitId.
- Recovery non calcola seq, non crea tick, non crea row history.
- Recovery non usa sample correnti o dati live.
```

## A. Ownership e dependency wiring

### `matchHistory.js`

Non creare un secondo journal store.

Aggiungi un adapter minimale, ad esempio:

```js
getCommitRecoveryDependencies()
```

Deve restituire esclusivamente le dipendenze già singleton e necessarie al repair da journal:

```txt
journalStore
writeHistoryDocument
writeTimelineDocument
eventuali logger sanitizzati già disponibili
```

Non restituire mappe runtime, latest state, dati live, fetcher, scraper o adapter di tracking.

Mantieni invariati gli adapter esistenti, incluso `getBetfairCommitDependencies()`.

### `sofaUpdates.js`

Esponi un adapter diretto e testabile, ad esempio:

```js
repairSofaCommitFromJournal(record, dependencies)
```

Deve delegare alla logica di repair già esistente oppure estrarla senza duplicarla.

### `betfair/processor.js`

Esponi un adapter diretto e testabile, ad esempio:

```js
repairBetfairCommitFromJournal(record, dependencies)
```

Deve delegare alla logica di repair già esistente oppure estrarla senza duplicarla.

Entrambi gli adapter devono:

```txt
- accettare solo record journal già persistiti;
- usare solo record.documents.*.payload, metadata e target;
- riscrivere soltanto documenti con completed !== true;
- usare il commitId già nel record;
- rispettare i controlli writer esistenti;
- non chiamare updateSofa, updateBetfair, addSofaUpdate,
  persistBetfairProcessedResult con sample inventato,
  processBetfairRunnerState, Source Identity o fetch;
- non creare row, tick, seq o commitId;
- restituire un risultato strutturato coerente con il source.
```

## B. Scanner journal read-only

In `commitJournal.js`, usa una funzione esistente di listing se già disponibile.

Se non esiste una funzione adatta, aggiungi solo questa API read-only:

```js
scanRecoveryCandidates()
```

Deve restituire una struttura serializzabile:

```js
{
  ok: true,
  fatal: false,
  records: [],
  invalidEntries: []
}
```

Regole:

```txt
- records contiene clone dei record JSON leggibili.
- invalidEntries contiene solo dati sanitizzati:
  file identificativo non sensibile, categoria e reason.
- Non includere payload, URL completi, query string, token,
  cookie, header, segreti o documenti business completi.
- Nessuna creazione directory.
- Nessuna scrittura.
- Nessuna modifica dello stato integrity.
```

Errore globale di scansione, ad esempio root journal non leggibile o directory non enumerabile:

```txt
ok:false
fatal:true
records:[]
invalidEntries:[]
```

Record JSON di singolo file non leggibile o non parsabile:

```txt
ok:true
fatal:false
invalidEntries include invalid_journal
```

Il bootstrap può partire dopo un `invalid_journal` per-file, ma non dopo una scansione globale fatale.

## C. Modulo recovery

Crea:

```txt
backend/src/sofa/matchHistory/recovery.js
```

Esponi:

```js
runPendingCommitRecovery(dependencies = {})
```

La funzione può essere `async`, anche se le dipendenze correnti sono sincrone.

### Summary obbligatorio

Restituisci esclusivamente dati serializzabili e sanitizzati:

```js
{
  ok: true,
  fatal: false,
  scanned: 0,
  recovered: 0,
  cleaned: 0,
  retryablePending: 0,
  recoveryFailed: 0,
  alreadyRecoveryFailed: 0,
  invalidJournal: 0,
  outcomes: [
    {
      source: "sofa" | "betfair" | null,
      eventId: "...",
      commitId: "...",
      category: "...",
      reason: "...",
      failedDocument: "history" | "timeline" | "journal" | null
    }
  ]
}
```

Non inserire in `outcomes`:

```txt
payload
metadata completa
URL completi
query string
token
cookie
secret
stack trace grezzo
```

### Ordine per ogni record valido

```txt
1. source o struttura non verificabile
   → markRecoveryFailed solo se commitId e record sono abbastanza validi
   → categoria recovery_failed

2. status recovery_failed già presente
   → nessun writer
   → categoria already_recovery_failed

3. history.completed === true e timeline.completed === true
   → solo removeCompletedCommit(commitId)
   → nessun writer
   → categoria cleaned oppure retryable_pending

4. pending Sofa
   → repairSofaCommitFromJournal(record, dependencies)

5. pending Betfair
   → repairBetfairCommitFromJournal(record, dependencies)
```

### Distinzione obbligatoria

#### Record strutturalmente irrecuperabile

Esempi:

```txt
source sconosciuto
commitId mancante o invalido
documents incompleti
target mancante
payload mancante
payload non oggetto
documento history/timeline non coerente
```

Comportamento:

```txt
- non scrivere history o timeline;
- chiamare markRecoveryFailed solo quando il record è leggibile
  e identificabile in modo sicuro;
- mantenere il record recovery_failed;
- incrementare recoveryFailed.
```

#### Errore transitorio di writer o cleanup

Esempi:

```txt
writer restituisce undefined
writer ok:false
writer target errato
writer commitId errato
rename/write temporaneamente fallito
removeCompletedCommit fallito
```

Comportamento:

```txt
- non marcare recovery_failed;
- lasciare il record pending invariato;
- non creare un nuovo commit;
- non duplicare history o timeline;
- incrementare retryablePending.
```

#### JSON journal fisicamente invalido

Comportamento:

```txt
- non scrivere history o timeline;
- non tentare markRecoveryFailed;
- incrementare invalidJournal;
- aggiungere outcome sanitizzato;
- consentire avvio backend se la scansione globale è completata.
```

### Recovery riuscita

Un repair riuscito deve:

```txt
- riscrivere solo i documenti completed !== true;
- marcare completato solo dopo writer valido;
- rimuovere il journal solo quando entrambi i documenti sono completed;
- restituire recovered oppure cleaned;
- non ricostruire dati business.
```

## D. Server bootstrap

In `server.js`:

### `createApp()`

Esporta una factory:

```js
createApp()
```

Deve:

```txt
- creare Express;
- applicare gli stessi middleware esistenti;
- montare le stesse route esistenti;
- non chiamare listen;
- non eseguire recovery;
- non registrare shutdown globale.
```

### `startServer()`

Esporta una funzione testabile:

```js
startServer(options = {})
```

Supporta override opzionali solo per test:

```js
{
  app,
  port,
  runRecoveryFn,
  listenFn,
  registerShutdownFn
}
```

Default di produzione:

```txt
app → createApp()
port → process.env.PORT || 3001
runRecoveryFn → runPendingCommitRecovery
listenFn → app.listen.bind(app)
registerShutdownFn → comportamento shutdown esistente
```

Flusso obbligatorio:

```txt
1. await runRecoveryFn(...)
2. se summary.fatal === true:
   - non chiamare listenFn;
   - restituire o lanciare un errore sanitizzato;
   - in avvio diretto impostare exit code non zero.

3. se summary.fatal === false:
   - chiamare listenFn una sola volta;
   - registrare shutdown una sola volta;
   - restituire { app, server, recoverySummary }.
```

Errori individuali recovery:

```txt
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
```

non bloccano `listen`, purché `fatal:false`.

### ESM direct entry guard

Usa una guardia ESM affidabile basata su `import.meta.url`, `fileURLToPath` e confronto con `process.argv[1]`.

Regola:

```txt
import server.js
→ non listen

esecuzione diretta node backend/src/server.js
→ startServer()
```

Non usare flag globali mutabili o workaround dipendenti dall’ambiente di test.

## E. Test obbligatori

Usa directory temporanee fuori da `backend/match_history/`.

Non usare browser, rete, scraper reale, porta reale o listener HTTP reale.

### `recovery.test.mjs`

Copri almeno:

```txt
1. Nessun journal
   → summary scanned:0
   → fatal:false.

2. Journal Sofa pending, un solo documento non completed
   → scrive solo quel documento;
   → usa payload e target journalizzati;
   → non genera commitId;
   → journal rimosso;
   → recovered.

3. Journal Betfair pending, un solo documento non completed
   → scrive solo quel documento;
   → payload timeline identico al journal;
   → seq invariato;
   → nessun tick duplicato;
   → journal rimosso;
   → recovered.

4. Journal pending con entrambi documenti completed
   → solo removeCompletedCommit;
   → zero writer;
   → cleaned.

5. Record strutturalmente invalido ma JSON leggibile
   → recovery_failed;
   → zero writer;
   → zero file business inventati.

6. Writer failure su record valido
   → pending invariato;
   → non recovery_failed;
   → retryablePending;
   → zero nuovo commit.

7. Cleanup failure su record completed residual
   → pending invariato;
   → retryablePending;
   → zero writer.

8. recovery_failed già presente
   → nessun writer;
   → alreadyRecoveryFailed;
   → reason preservata.

9. File journal JSON non parsabile
   → invalidJournal;
   → nessun writer;
   → scansione non fatale.

10. Due esecuzioni recovery consecutive
    → stesso stato finale;
    → nessuna history duplicata;
    → nessun tick duplicato;
    → nessun nuovo seq;
    → nessuna cancellazione di documenti business canonici.
```

### `server.test.mjs`

Copri almeno:

```txt
1. import server.js
   → nessun listen automatico.

2. startServer
   → recovery completata prima di listenFn.

3. recovery con retryablePending
   → listenFn chiamato.

4. recovery con recoveryFailed o invalidJournal per-file
   → listenFn chiamato.

5. recovery fatal
   → listenFn non chiamato.

6. shutdown registrar
   → chiamato una sola volta dopo listen.
```

### Regressioni

Mantieni e fai passare:

```txt
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/sofaUpdates.test.mjs
backend/src/sofa/betfair/processor.test.mjs
backend/src/sofa/trackerUpdate.test.mjs
backend/src/sofa/sourceIdentityGate.test.mjs
backend/src/sofa/matchTracker.test.mjs
backend/src/sofa/betfairFetch.test.mjs
backend/src/sofa/betfair/trackerUpdate.test.mjs
backend/src/sofa/betfair/timeline/state.test.mjs
backend/src/sofa/matchHistory/storage.test.mjs
backend/src/sofa/timelineStore.test.mjs
backend/src/sofa/matchHistory/commitId.test.mjs
```

## Regola tassativa: massimo tre tentativi ragionati

Prima del primo tentativo puoi leggere integralmente i file autorizzati e preparare una patch coerente. Non eseguire comandi di test parziali durante questa fase.

Un tentativo consiste esclusivamente in:

```txt
1. applicare una patch mirata ma completa;
2. eseguire una sola volta il comando di verifica completo;
3. leggere il risultato.
```

Un tentativo può contenere una correzione ampia e coerente; non limitarti a micro-patch arbitrarie.

Dopo un fallimento:

```txt
- correggi solo cause direttamente dimostrate dall’ultimo comando;
- non introdurre nuove feature;
- non ampliare scope;
- non eseguire test isolati aggiuntivi.
```

Dopo il terzo tentativo, anche se ritieni di poter correggere altro:

```txt
→ fermati;
→ non applicare altre patch;
→ non eseguire altri comandi;
→ non modificare test;
→ non cercare altri problemi;
→ genera Repomix dei file effettivamente modificati;
→ scrivi il report finale.
```

Se un tentativo passa, fermati subito.

## Comando di verifica

```bat
cmd /d /s /c "node --check backend/src/server.js && node --check backend/src/sofa/matchHistory.js && node --check backend/src/sofa/matchHistory/commitJournal.js && node --check backend/src/sofa/matchHistory/recovery.js && node --check backend/src/sofa/matchHistory/sofaUpdates.js && node --check backend/src/sofa/betfair/processor.js && node backend/src/server.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/sofaUpdates.test.mjs && node backend/src/sofa/trackerUpdate.test.mjs && node backend/src/sofa/sourceIdentityGate.test.mjs && node backend/src/sofa/matchTracker.test.mjs && node backend/src/sofa/betfair/processor.test.mjs && node backend/src/sofa/betfairFetch.test.mjs && node backend/src/sofa/betfair/trackerUpdate.test.mjs && node backend/src/sofa/betfair/timeline/state.test.mjs && node backend/src/sofa/matchHistory/storage.test.mjs && node backend/src/sofa/timelineStore.test.mjs && node backend/src/sofa/matchHistory/commitId.test.mjs"
```

## Repomix

Dopo il test finale, genera esclusivamente i file realmente modificati:

```powershell
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "<elenco-esatto-file-modificati-separati-da-virgola>"
```

Non aprire, leggere o incollare `fileModificati.md`.

## Report finale

Scrivi solo:

```txt
esito;
tentativi eseguiti;
file modificati;
riepilogo modifiche;
comando eseguito;
exit code;
test passati;
test falliti;
limiti o non verificato;
errori incontrati;
percorso fileModificati.md;
esito Repomix.
```

# COMPLETATO Prompt 6 — API Match: integrity additiva read-only

Lavora sul progetto locale **Tennis Decision UI**.

Non produrre piano, ragionamento esteso, todo, analisi architetturale o messaggi intermedi. Leggi i file autorizzati, applica una patch coerente, esegui il comando completo secondo la regola dei tre tentativi e scrivi solo il report finale.

## Obiettivo

Aggiungere un campo `integrity` additivo alle sole letture Match API di history e timeline SofaScore:

```txt id="unlqn1"
GET /api/match/:eventId/history
GET /api/match/:eventId/json
```

Lo scopo è distinguere:

```txt id="dnne8k"
404 reale
```

da:

```txt id="apnvho"
risorsa assente perché esiste un commit incompleto o recovery_failed noto
```

La modifica deve essere read-only.

Non modificare tracking, recovery, journal writing, Source Identity, API Betfair, Evidence, server, frontend o persistenza.

## Stato già implementato da preservare

```txt id="j1pxgk"
- commitJournal.js espone getPersistenceIntegrityStatus(eventId, source).
- Il journal usa i source canonici sofa e betfair.
- Prompt 5 ha aggiunto recovery bootstrap prima di app.listen.
- Prompt 5A ha irrigidito scanRecoveryCandidates e i test async.
- recovery_failed, partial_persistence e no_known_partial sono già
  contratti disponibili lato journal.
```

## File modificabili

Puoi modificare solo:

```txt id="ybg7yw"
backend/src/routes/match.js
backend/src/routes/match/readResponses.js
backend/src/routes/match/readResponses.test.mjs

backend/src/sofa/matchHistory.js

backend/src/routes/match.integrity.test.mjs
```

`backend/src/routes/match.integrity.test.mjs` può essere creato solo se serve un test route-level piccolo e mirato. Se `readResponses.test.mjs` copre già l’intero comportamento, non crearlo.

## File read-only

Puoi leggerli solo per rispettare firme e contratti reali:

```txt id="t9d10b"
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/timelineStore.js
backend/src/server.js

docs/tennis-decision-ui/api/01-match.mdx
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
```

Non modificare file diversi da quelli autorizzati.

## Non modificare

```txt id="gf0e6l"
endpoint track/untrack/stop/analyze
API Betfair
Evidence
Source Identity
server bootstrap
frontend
tracker
scraper Python
launcher
recovery bootstrap
commitJournal.js
storage.js
timelineStore.js
documentazione
```

## Contratti da preservare

```txt id="62lucn"
- Endpoint read-only: nessuna scrittura.
- Nessuna recovery viene eseguita dalla route.
- Nessun tracker, scraper, browser, fetch o GET HTTP.
- Risorsa esistente continua a restituire HTTP 200.
- History e timeline raw restano nel formato esistente.
- Non avvolgere documenti esistenti in { data: ... }.
- Non mutare l’oggetto letto da filesystem o timelineStore.
- 404 ordinario resta invariato quando non esiste partial persistence nota.
- Non esporre path locali, payload journal, target, metadata journal,
  stack trace o dettagli filesystem.
```

## A. Adapter read-only in `matchHistory.js`

Non importare `commitJournal.js` direttamente nelle route.

Aggiungi un adapter minimale, ad esempio:

```js id="zvyycn"
export function getMatchPersistenceIntegrity(eventId, source = 'sofa') {
    ...
}
```

Regole:

```txt id="tk5rb8"
- Deve chiamare solo journalStore.getPersistenceIntegrityStatus(eventId, source).
- Deve essere read-only.
- Non deve creare directory.
- Non deve eseguire recovery.
- Non deve scrivere journal, history o timeline.
- Non deve esporre il journalStore.
- Deve normalizzare input invalido a no_known_partial se il journal
  restituisce null/undefined o forma inattesa.
```

Source per questi endpoint:

```txt id="3t79pu"
GET /api/match/:eventId/history
→ source 'sofa'

GET /api/match/:eventId/json
→ source 'sofa'
```

Non interrogare Betfair in questo prompt. L’integrity additiva Match riguarda solo la persistenza SofaScore.

## B. Forma `integrity`

Usa la forma esistente del journal, normalizzata così:

```js id="3r832z"
{
  status: 'no_known_partial' | 'partial_persistence' | 'recovery_failed',
  reason: null | 'pending_commit' | 'recovery_failed' | string,
  source: null | 'sofa',
  commitId: null | string,
  affectedDocuments: ['history' | 'timeline']
}
```

Regole:

```txt id="km7ise"
- affectedDocuments deve essere sempre array.
- commitId deve essere stringa o null.
- source deve essere 'sofa' o null per questi endpoint.
- Non aggiungere betfair qui.
- Non aggiungere payload, target, file o documenti journal.
```

## C. Risorsa esistente

Quando il documento richiesto esiste:

```txt id="id1ggj"
HTTP 200
→ body = clone del documento originale + integrity
```

Non mutare il documento originale.

Non cambiare shape esistente oltre al nuovo campo top-level:

```txt id="yiu27d"
integrity
```

Non usare:

```js id="ox0ccx"
{ data: documento, integrity }
```

Se il documento originale contiene già una proprietà `integrity`, sovrascrivila solo nel clone di risposta, non nell’oggetto originale.

## D. Risorsa assente

Quando il documento richiesto non esiste:

### Nessun partial noto

Mantieni il comportamento 404 esistente.

```txt id="xzazuy"
status attuale
body attuale
```

Non cambiare messaggio, shape o nome campo del 404 ordinario se già esistono.

### Partial persistence o recovery failed noto

Se `integrity.status` è:

```txt id="t0u3xs"
partial_persistence
recovery_failed
```

restituisci:

```txt id="xrec20"
HTTP 409
```

Body:

```js id="xcxfo8"
{
  error: 'persistence_integrity',
  integrity
}
```

Non usare `404` in questo caso.

Non aggiungere path locali o dettagli journal.

## E. `readResponses.js`

Implementa la logica additiva nel modulo owner delle risposte di lettura, non duplicarla direttamente in `match.js`.

Se `match.js` oggi costruisce direttamente le risposte per `/history` o `/json`, sposta solo la minima logica necessaria dentro `readResponses.js` oppure aggiungi helper testabili.

Helper suggeriti:

```js id="pccwfw"
withIntegrity(document, integrity)
respondMissingWithIntegrity(res, integrity, notFoundHandler)
normalizeIntegrity(raw)
```

Nomi liberi, ma la logica deve restare testabile senza server reale.

## F. `match.js`

Modifica solo il necessario per:

```txt id="iibcrw"
- ottenere integrity read-only da matchHistory.js;
- passarla agli helper di readResponses.js;
- mantenere route, parametri e status esistenti.
```

Non toccare altri endpoint Match.

## G. Test obbligatori

### `readResponses.test.mjs`

Aggiungi o aggiorna test per:

```txt id="f1zs6a"
1. history presente + no_known_partial
   → 200
   → body originale clonato + integrity
   → input originale immutato

2. timeline Sofa presente + partial_persistence
   → 200
   → integrity additiva
   → input originale immutato

3. history assente + partial_persistence noto
   → 409
   → { error:'persistence_integrity', integrity }

4. timeline assente + recovery_failed noto
   → 409
   → { error:'persistence_integrity', integrity }

5. timeline assente + no_known_partial
   → 404 esistente invariato

6. integrity raw null/undefined/malata
   → normalizzata a no_known_partial

7. documento esistente con integrity preesistente
   → response usa integrity nuova
   → documento originale non mutato
```

### Eventuale `match.integrity.test.mjs`

Crealo solo se serve verificare il wiring della route.

Copri massimo:

```txt id="lyp3fo"
1. /api/match/:eventId/history usa source sofa.
2. /api/match/:eventId/json usa source sofa.
3. route non chiama writer/recovery/tracker.
```

Non creare un test server HTTP reale se il progetto non lo usa già. Preferisci dependency injection o handler diretto se disponibile.

## H. Regressioni da preservare

Mantieni verdi:

```txt id="6qtv9k"
backend/src/routes/match/readResponses.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs
backend/src/sofa/matchHistory/sofaUpdates.test.mjs
backend/src/sofa/betfair/processor.test.mjs
```

Non modificare questi test salvo regressione direttamente causata da questa patch.

## Regola tassativa: massimo tre tentativi ragionati

Prima del primo tentativo puoi leggere integralmente i file autorizzati e preparare una patch coerente. Non eseguire test parziali durante questa fase.

Un tentativo consiste esclusivamente in:

```txt id="zj0cyw"
1. applicare una patch mirata ma completa;
2. eseguire una sola volta il comando di verifica completo;
3. leggere il risultato.
```

Dopo un fallimento:

```txt id="vh2teo"
- correggi solo cause dimostrate dall’ultimo comando;
- non ampliare scope;
- non introdurre nuove feature;
- non eseguire test isolati.
```

Dopo il terzo tentativo, riuscito o fallito:

```txt id="m5xqzf"
→ fermati;
→ non applicare altre patch;
→ non eseguire altri comandi;
→ non modificare test;
→ genera Repomix dei file effettivamente modificati;
→ scrivi il report finale.
```

Se un tentativo passa, fermati subito.

## Comando di verifica

```bat id="4p3sb6"
cmd /d /s /c "node --check backend/src/routes/match.js && node --check backend/src/routes/match/readResponses.js && node --check backend/src/sofa/matchHistory.js && node backend/src/routes/match/readResponses.test.mjs && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs && node backend/src/sofa/matchHistory/sofaUpdates.test.mjs && node backend/src/sofa/betfair/processor.test.mjs"
```

Se hai creato `backend/src/routes/match.integrity.test.mjs`, usa invece questo comando:

```bat id="zgulxo"
cmd /d /s /c "node --check backend/src/routes/match.js && node --check backend/src/routes/match/readResponses.js && node --check backend/src/sofa/matchHistory.js && node --check backend/src/routes/match.integrity.test.mjs && node backend/src/routes/match/readResponses.test.mjs && node backend/src/routes/match.integrity.test.mjs && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs && node backend/src/sofa/matchHistory/sofaUpdates.test.mjs && node backend/src/sofa/betfair/processor.test.mjs"
```

Non eseguire entrambi. Scegli il comando coerente con i file realmente modificati o creati.

## Repomix

Dopo il test finale, genera esclusivamente i file realmente modificati:

```powershell id="y5g31o"
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "<elenco-esatto-file-modificati-separati-da-virgola>"
```

Non aprire, leggere o incollare `fileModificati.md`.

## Report finale

Scrivi solo:

```txt id="5r9gww"
esito;
tentativi eseguiti;
file modificati;
riepilogo modifiche;
comando eseguito;
exit code;
test passati;
test falliti;
limiti o non verificato;
errori incontrati;
percorso fileModificati.md;
esito Repomix.
```

# COMPLETATO Prompt 7 — API Betfair: integrity separata da health

Lavora sul progetto locale **Tennis Decision UI**.

Non produrre piano, ragionamento esteso, todo, analisi architetturale o messaggi intermedi. Leggi i file autorizzati, applica una patch coerente, esegui il comando completo secondo la regola dei tre tentativi e scrivi solo il report finale.

## Obiettivo

Aggiungere `integrity` read-only alle letture Betfair:

```txt id="o3cch4"
GET /api/betfair/:eventId/json
GET /api/betfair/:eventId/latest
```

La nuova `integrity` deve descrivere solo lo stato di persistenza journalizzata Betfair.

Deve restare separata da:

```txt id="2hgak4"
health
freshness
tick stale
runtime scraper
graph health
ladder reliability
Money Flow
```

Un commit Betfair incompleto non deve diventare artificialmente:

```txt id="aspvpr"
tick stale
runtime error
graph error
ladder non affidabile
```

## Stato già implementato da preservare

```txt id="3lt31e"
- Prompt 5/5A: recovery bootstrap prima di app.listen.
- Prompt 6: matchHistory.js espone getMatchPersistenceIntegrity(eventId, source).
- getMatchPersistenceIntegrity è read-only sopra journalStore.getPersistenceIntegrityStatus.
- La normalizzazione supporta gli stati:
  no_known_partial
  partial_persistence
  recovery_failed
```

Per questo Prompt 7 usa:

```txt id="qxee7z"
getMatchPersistenceIntegrity(eventId, 'betfair')
```

Non importare o modificare direttamente `commitJournal.js`.

## File modificabili

Puoi modificare solo:

```txt id="p40jfh"
backend/src/routes/betfair.js
backend/src/routes/betfair/latestPayload.js
backend/src/routes/betfair/latestPayloadResponse.test.mjs, backend/src/routes/betfair/latestPayloadIntegrity.test.mjs, backend/src/routes/betfair/betfairJsonResponse.test.mjs, backend/src/routes/betfair/normalizeIntegrity.test.mjs

backend/src/routes/betfair.integrity.test.mjs
```

`backend/src/routes/betfair.integrity.test.mjs` può essere creato solo se serve un test route-level piccolo e mirato. Se `latestPayloadResponse.test.mjs`, `latestPayloadIntegrity.test.mjs`, `betfairJsonResponse.test.mjs`, `normalizeIntegrity.test.mjs` copre già wiring e comportamento via dependency injection, non crearlo.

## File read-only

Puoi leggere solo per rispettare firme e contratti reali:

```txt id="z7o1dk"
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/timelineStore.js
backend/src/sofa/betfairHealth.js
backend/src/routes/match/readResponses.js

docs/tennis-decision-ui/api/02-betfair.mdx
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
```

Non modificare file diversi da quelli autorizzati.

## Non modificare

```txt id="uo8hd3"
backend/src/sofa/betfairHealth.js
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/timelineStore.js

Money Flow
health classification
freshness classification
graph health
runtime scraper state
tracker
fetchBetfairData
scraper Python
Evidence
Source Identity
frontend
server bootstrap
documentazione
```

Non modificare:

```txt id="sig7l1"
GET /api/betfair/:eventId/odds
GET /api/betfair/:eventId/log
GET /api/betfair/login-window
```

## Contratti da preservare

```txt id="mqmecc"
- /json e /latest restano read-only.
- Nessuna scrittura journal, history o timeline.
- Nessuna recovery viene eseguita dalla route.
- Nessun tracker, scraper, browser, fetch o GET HTTP.
- Health continua a usare i contratti esistenti.
- latestTimestamp deriva dal tick canonico come prima.
- moneyFlowHistory resta invariata.
- Non esporre runtime top-level.
- Non aggiungere persistenceOk dentro health.
- Non mutare timeline o latest payload letti da filesystem.
- Non esporre path locali, payload journal, target, metadata journal,
  stack trace o dettagli filesystem.
```

## A. Integrity Betfair

Usa l’adapter già esistente:

```js id="fop19f"
getMatchPersistenceIntegrity(eventId, 'betfair')
```

La forma pubblica deve essere:

```js id="te8mjy"
{
  status: 'no_known_partial' | 'partial_persistence' | 'recovery_failed',
  reason: string | null,
  source: 'betfair' | null,
  commitId: string | null,
  affectedDocuments: ['history' | 'timeline']
}
```

Regole:

```txt id="fumdf1"
- affectedDocuments sempre array.
- commitId stringa o null.
- source 'betfair' o null.
- Non includere payload, target, file, metadata journal o path.
```

Se l’integrity grezza è null, undefined o malformata:

```txt id="gqg4ee"
→ normalizzare a no_known_partial
```

## B. `GET /api/betfair/:eventId/json`

### Timeline presente

```txt id="mbpk18"
HTTP 200
→ body = clone della timeline Betfair + integrity
```

Non avvolgere in:

```js id="grkt6g"
{ data: timeline, integrity }
```

Aggiungi `integrity` come campo top-level nel clone.

Se la timeline originale contiene già `integrity`, sovrascrivila solo nel clone di risposta.

### Timeline assente + no_known_partial

Mantieni il 404 esistente:

```txt id="a5d6ge"
status attuale
body attuale
```

Non cambiare shape, messaggio o nome campo del 404 ordinario.

### Timeline assente + partial/recovery noto

Se:

```txt id="dxv76u"
integrity.status === 'partial_persistence'
oppure
integrity.status === 'recovery_failed'
```

restituisci:

```txt id="5dzlsf"
HTTP 409
```

Body:

```js id="vjzh57"
{
  error: 'persistence_integrity',
  integrity
}
```

## C. `GET /api/betfair/:eventId/latest`

### Timeline presente

Il comportamento `latest` esistente resta invariato.

Aggiungi soltanto un campo top-level:

```js id="u8gz10"
integrity
```

Regole:

```txt id="jloh8m"
- HTTP 200 resta 200.
- health resta identica rispetto al comportamento precedente.
- latestTimestamp resta derivato dal tick canonico.
- moneyFlowHistory resta invariata.
- Nessun campo persistenceOk dentro health.
- Nessun runtime top-level.
```

Esempio shape concettuale:

```js id="lycvuv"
{
  ...latestPayloadEsistente,
  health: healthEsistente,
  integrity
}
```

### Timeline assente + no_known_partial

Mantieni il comportamento 404 attuale di `/latest`.

Se il 404 attuale include `health`, conservarlo.

Non cambiare la classificazione health.

### Timeline assente + partial/recovery noto

Se:

```txt id="6i69wb"
integrity.status === 'partial_persistence'
oppure
integrity.status === 'recovery_failed'
```

restituisci:

```txt id="5t4pjg"
HTTP 409
```

Body minimo:

```js id="dw7ymt"
{
  error: 'persistence_integrity',
  health: healthEsistente,
  integrity
}
```

Regole:

```txt id="7kq77c"
- health deve essere prodotto con lo stesso percorso esistente
  usato dal 404/response attuale.
- Non trasformare partial_persistence in stale.
- Non modificare campi health.
- Non aggiungere runtime top-level.
```

## D. `latestPayload.js`

Implementa la logica nel modulo owner di `/latest` e delle risposte Betfair, non duplicarla direttamente in `betfair.js`.

Helper consigliati:

```js id="5tqg4v"
normalizeIntegrity(raw)
withIntegrity(document, integrity)
isMissingIntegrityConflict(integrity)
buildMissingBetfairResponse(...)
```

Nomi liberi, ma la logica deve essere testabile senza server reale.

Non importare helper da `routes/match/readResponses.js`, perché il modulo Match non deve diventare dependency owner della Betfair API.

## E. `betfair.js`

Modifica solo il necessario per:

```txt id="yfvhgi"
- ottenere getMatchPersistenceIntegrity da matchHistory.js;
- usarlo con source 'betfair';
- passarlo agli helper di latestPayload.js;
- mantenere route, status e contratti esistenti.
```

Non toccare `/odds`, `/log`, `/login-window` o altre route non coinvolte.

## F. Test obbligatori

### `latestPayloadResponse.test.mjs`, `latestPayloadIntegrity.test.mjs`, `betfairJsonResponse.test.mjs`, `normalizeIntegrity.test.mjs`

Aggiungi o aggiorna test per:

```txt id="io5hre"
1. /latest timeline presente + partial_persistence noto
   → HTTP 200
   → integrity presente
   → health invariata rispetto al baseline
   → latestTimestamp invariato
   → moneyFlowHistory invariata

2. /latest timeline presente + recovery_failed noto
   → HTTP 200
   → integrity presente
   → health invariata

3. /latest timeline assente + no_known_partial
   → 404 attuale conservato
   → se health era presente resta presente

4. /latest timeline assente + partial_persistence noto
   → HTTP 409
   → body.error === 'persistence_integrity'
   → health presente e invariata rispetto al comportamento missing esistente
   → integrity presente

5. /latest timeline assente + recovery_failed noto
   → HTTP 409
   → health presente
   → integrity presente

6. /json timeline presente + no_known_partial
   → HTTP 200
   → clone timeline + integrity
   → input originale non mutato

7. /json timeline presente + partial_persistence noto
   → HTTP 200
   → clone timeline + integrity

8. /json timeline assente + no_known_partial
   → 404 esistente invariato

9. /json timeline assente + partial_persistence noto
   → HTTP 409
   → { error:'persistence_integrity', integrity }

10. integrity raw null/undefined/malata
    → normalizzata a no_known_partial

11. documento/timeline con integrity preesistente
    → response usa integrity nuova
    → input originale non mutato

12. getMatchPersistenceIntegrity riceve source 'betfair'
    per /json e /latest.
```

### Eventuale `betfair.integrity.test.mjs`

Crealo solo se serve verificare il wiring route-level.

Copri massimo:

```txt id="1xhs2j"
1. /api/betfair/:eventId/json usa source betfair.
2. /api/betfair/:eventId/latest usa source betfair.
3. route non chiama writer/recovery/tracker.
```

Non creare server HTTP reale se il progetto non lo usa già. Preferisci dependency injection o handler diretto se disponibile.

## G. Regressioni da preservare

Mantieni verdi:

```txt id="c6qtrh"
backend/src/routes/betfair/latestPayloadResponse.test.mjs, backend/src/routes/betfair/latestPayloadIntegrity.test.mjs, backend/src/routes/betfair/betfairJsonResponse.test.mjs, backend/src/routes/betfair/normalizeIntegrity.test.mjs
backend/src/sofa/betfairHealth.test.mjs
backend/src/routes/match/readResponses.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs
```

Non modificare questi test salvo regressione direttamente causata da questa patch.

## Regola tassativa: massimo tre tentativi ragionati

Prima del primo tentativo puoi leggere integralmente i file autorizzati e preparare una patch coerente. Non eseguire test parziali durante questa fase.

Un tentativo consiste esclusivamente in:

```txt id="0vweuz"
1. applicare una patch mirata ma completa;
2. eseguire una sola volta il comando di verifica completo;
3. leggere il risultato.
```

Dopo un fallimento:

```txt id="6wjcrb"
- correggi solo cause dimostrate dall’ultimo comando;
- non ampliare scope;
- non introdurre nuove feature;
- non eseguire test isolati.
```

Dopo il terzo tentativo, riuscito o fallito:

```txt id="fsnolk"
→ fermati;
→ non applicare altre patch;
→ non eseguire altri comandi;
→ non modificare test;
→ genera Repomix dei file effettivamente modificati;
→ scrivi il report finale.
```

Se un tentativo passa, fermati subito.

## Comando di verifica

```bat id="mj35wn"
cmd /d /s /c "node --check backend/src/routes/betfair.js && node --check backend/src/routes/betfair/latestPayload.js && node backend/src/routes/betfair/latestPayloadResponse.test.mjs && node backend/src/routes/betfair/latestPayloadIntegrity.test.mjs && node backend/src/routes/betfair/betfairJsonResponse.test.mjs && node backend/src/routes/betfair/normalizeIntegrity.test.mjs && node backend/src/sofa/betfairHealth.test.mjs && node backend/src/routes/match/readResponses.test.mjs && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs"
```

Se hai creato `backend/src/routes/betfair.integrity.test.mjs`, usa invece questo comando:

```bat id="shmk3y"
cmd /d /s /c "node --check backend/src/routes/betfair.js && node --check backend/src/routes/betfair/latestPayload.js && node --check backend/src/routes/betfair.integrity.test.mjs && node backend/src/routes/betfair/latestPayloadResponse.test.mjs && node backend/src/routes/betfair/latestPayloadIntegrity.test.mjs && node backend/src/routes/betfair/betfairJsonResponse.test.mjs && node backend/src/routes/betfair/normalizeIntegrity.test.mjs && node backend/src/routes/betfair.integrity.test.mjs && node backend/src/sofa/betfairHealth.test.mjs && node backend/src/routes/match/readResponses.test.mjs && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs"
```

Non eseguire entrambi. Scegli il comando coerente con i file realmente modificati o creati.

## Repomix

Dopo il test finale, genera esclusivamente i file realmente modificati:

```powershell id="lc67pc"
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "<elenco-esatto-file-modificati-separati-da-virgola>"
```

Non aprire, leggere o incollare `fileModificati.md`.

## Report finale

Scrivi solo:

```txt id="snsfn3"
esito;
tentativi eseguiti;
file modificati;
riepilogo modifiche;
comando eseguito;
exit code;
test passati;
test falliti;
limiti o non verificato;
errori incontrati;
percorso fileModificati.md;
esito Repomix.
```

# COMPLETATO Prompt 8 — Evidence: persistence integrity e no-trade reason

Lavora sul progetto locale **Tennis Decision UI**.

Non produrre piano, ragionamento esteso, todo, analisi architetturale o messaggi intermedi. Leggi i file autorizzati, applica una patch coerente, esegui il comando completo secondo la regola dei tre tentativi e scrivi solo il report finale.

## Obiettivo

Far degradare Evidence in modo esplicito quando esiste uno stato di persistenza incompleta noto, senza cambiare:

```txt id="wl53we"
Source Identity effective
freshness tecnica dei tick
Market Reactions module
timeline
history
confirmation store
tracking
frontend
```

La persistenza incompleta deve bloccare l’evidence cross-source, ma non deve essere confusa con:

```txt id="k2z6ey"
tick missing
tick stale
Source Identity mismatch
runtime scraper error
graph health
ladder reliability
```

## Stato già implementato da preservare

```txt id="ljv9ae"
- Prompt 5/5A: recovery bootstrap prima di app.listen.
- Prompt 6: API Match espone integrity read-only per source sofa.
- Prompt 7: API Betfair espone integrity read-only per source betfair.
- matchHistory.js espone getMatchPersistenceIntegrity(eventId, source).
- getMatchPersistenceIntegrity è read-only sopra journalStore.getPersistenceIntegrityStatus.
```

In questo Prompt 8, Evidence deve usare:

```txt id="o0a87u"
getMatchPersistenceIntegrity(eventId, 'sofa')
getMatchPersistenceIntegrity(eventId, 'betfair')
```

Non importare o modificare direttamente `commitJournal.js`.

## File modificabili

Puoi modificare solo:

```txt id="bawffx"
backend/src/sofa/matchEvidence.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/matchEvidence/noTradeReasons.js
backend/src/routes/evidence.js

backend/src/sofa/matchEvidence/latestMatchEvidence.test.mjs
backend/src/sofa/matchEvidence/evidenceBuilder.test.mjs
backend/src/sofa/matchEvidence/dataQuality.test.mjs
backend/src/sofa/matchEvidence/noTradeReasons.test.mjs
backend/src/routes/evidence/evidenceRoute.test.mjs
```

`backend/src/routes/evidence/evidenceRoute.test.mjs` può essere creato solo se serve un test route-level piccolo e mirato. Se i test Evidence esistenti coprono già il passaggio del blocco `integrity`, non crearlo.

## File read-only

Puoi leggere solo per rispettare firme e contratti reali:

```txt id="px1t7h"
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/timelineStore.js
backend/src/routes/match/readResponses.js
backend/src/routes/betfair/latestPayload.js

docs/tennis-decision-ui/api/03-evidence.mdx
docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.mdx
docs/tennis-decision-ui/modules/evidence/02-source-identity.mdx
docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.mdx
docs/tennis-decision-ui/modules/evidence/04-market-reactions.mdx
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
```

Non modificare file diversi da quelli autorizzati.

## Non modificare

```txt id="e06kkj"
backend/src/sofa/matchHistory.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/timelineStore.js

algoritmi Source Identity
moduli Market Reactions
timeline/history persistence
confirmation store
tracker
route Match
route Betfair
frontend
server bootstrap
scraper Python
Lay The Winner
documentazione
```

## Contratti da preservare

```txt id="e2s3hq"
- Evidence è read-only.
- Nessuna scrittura journal, timeline, history o confirmation store.
- Nessuna recovery viene eseguita da Evidence.
- Nessun tracker, scraper, browser, fetch o GET HTTP.
- Source Identity effective resta calcolata dalle regole esistenti.
- Pending/mismatch Source Identity continuano a bloccare cross-source
  secondo il contratto esistente.
- Sofa-only legittimo non diventa partial_persistence se non esiste
  journal noto.
- Tick Betfair fresco resta tecnicamente fresco in dataQuality.
- partial_persistence non deve essere convertito in missing/stale.
- marketReactionEvidence.summary.causalityClaimed resta sempre false.
- Input timeline/history non devono essere mutati.
```

## A. Integrity input

In `latestMatchEvidence.js`, leggi l’integrity tramite adapter read-only:

```js id="d7mjcb"
getMatchPersistenceIntegrity(eventId, 'sofa')
getMatchPersistenceIntegrity(eventId, 'betfair')
```

L’adapter deve arrivare da:

```txt id="uam0dg"
backend/src/sofa/matchHistory.js
```

Non dal journal.

Supporta dependency injection nei test, ad esempio:

```js id="f9qcxn"
dependencies.getMatchPersistenceIntegrity
```

Il risultato Evidence top-level deve includere un blocco additivo:

```js id="o3euu0"
integrity: {
  status: 'no_known_partial' | 'partial_persistence' | 'recovery_failed',
  reason: string | null,
  affectedSources: ['sofa' | 'betfair'],
  sources: {
    sofa: {
      status,
      reason,
      source,
      commitId,
      affectedDocuments
    },
    betfair: {
      status,
      reason,
      source,
      commitId,
      affectedDocuments
    }
  }
}
```

Regole:

```txt id="mtcl3i"
- affectedSources contiene solo source con partial_persistence o recovery_failed.
- status top-level è:
  recovery_failed se almeno una source è recovery_failed;
  altrimenti partial_persistence se almeno una source è partial_persistence;
  altrimenti no_known_partial.
- reason top-level è:
  recovery_failed se status recovery_failed;
  pending_commit se status partial_persistence;
  null se no_known_partial.
- Non esporre payload, target, path locali, metadata journal,
  stack trace o dettagli filesystem.
```

Se una integrity grezza è null, undefined o malformata:

```txt id="q76n4b"
→ normalizzare quella source a no_known_partial
```

## B. Propagazione nel flusso Evidence

Propaga il blocco integrity lungo il flusso:

```txt id="xksnyx"
latestMatchEvidence
→ buildEvidenceFromTicks
→ buildDataQuality
→ buildNoTradeReasons
→ risposta API Evidence
```

Non passare direttamente journal store o record journal ai builder.

Passa solo il blocco normalizzato `integrity`.

## C. Data quality

In `dataQuality.js`, aggiungi al risultato:

```js id="d8dekt"
persistenceComplete: true | false | null
```

Regole:

```txt id="i8m5ej"
integrity.status === 'partial_persistence'
oppure
integrity.status === 'recovery_failed'
→ persistenceComplete:false

integrity.status === 'no_known_partial'
→ persistenceComplete:true oppure null
```

Scegli una semantica stabile e testala.

Consiglio operativo:

```txt id="z8gv89"
no_known_partial → persistenceComplete:true
```

Reason standard da usare quando `persistenceComplete:false`:

```txt id="wts2z1"
Persistence incomplete: canonical cross-source evidence unavailable
```

La persistence integrity non deve modificare:

```txt id="oedpl7"
betfairRecent
sofaRecent
latestTimestamp
freshness
staleness
technical freshness
```

Se il tick Betfair è fresco ma la persistenza è incompleta:

```txt id="nktcj6"
betfairRecent resta true
persistenceComplete diventa false
```

## D. No-trade reasons

In `noTradeReasons.js`, quando:

```txt id="rs3nvt"
dataQuality.persistenceComplete === false
```

aggiungi una sola volta la reason standard:

```txt id="hdktlu"
Persistence incomplete: canonical cross-source evidence unavailable
```

Regole:

```txt id="smccwu"
- Non duplicare la reason se già presente.
- Non sostituire reason esistenti di Source Identity pending.
- Non sostituire reason esistenti di Source Identity mismatch.
- Le reason possono coesistere.
```

## E. Evidence builder: blocco cross-source

In `evidenceBuilder.js`, quando:

```txt id="eqe7ho"
integrity.status === 'partial_persistence'
oppure
integrity.status === 'recovery_failed'
```

devi bloccare l’evidence cross-source canonica.

Regole richieste:

```txt id="qriwvb"
- marketEvidence runners attribuiti → []
- Betfair runners attribuiti a Sofa → []
- Non passare tick/lookback Betfair attribuiti a Market Reactions.
- marketReactionEvidence.available → false.
- marketReactionEvidence.summary.causalityClaimed → false.
- Source Identity effective resta invariata.
- Il tick Betfair grezzo può restare disponibile a dataQuality
  per freshness tecnica.
```

Non modificare il modulo Market Reactions se il blocco può essere ottenuto a monte nel builder tramite input vuoti o flag di disponibilità.

La persistence incomplete è un blocco di usabilità cross-source, non un errore tecnico del tick.

## F. Route Evidence

In `routes/evidence.js`, inoltra il blocco `integrity` in modo additivo nella risposta API.

Regole:

```txt id="x3hl5l"
- Non cambiare status HTTP esistenti.
- Non cambiare nomi endpoint.
- Non aggiungere recovery o scritture.
- Non esporre journal internals.
```

## G. Test obbligatori

### `latestMatchEvidence.test.mjs`

Aggiungi test per:

```txt id="x4hqoo"
1. legge getMatchPersistenceIntegrity(eventId, 'sofa')
   e getMatchPersistenceIntegrity(eventId, 'betfair').

2. no_known_partial su entrambe
   → integrity.status no_known_partial
   → affectedSources []
   → comportamento Evidence esistente invariato.

3. partial_persistence Betfair
   → integrity.status partial_persistence
   → affectedSources ['betfair']
   → blocco propagato al builder.

4. recovery_failed Sofa
   → integrity.status recovery_failed
   → affectedSources ['sofa'].

5. input integrity malformato
   → normalizzato a no_known_partial.
```

### `dataQuality.test.mjs`

Aggiungi test per:

```txt id="h3zpvw"
1. Betfair fresco + partial_persistence
   → betfairRecent true
   → persistenceComplete false
   → reason standard presente se il modulo espone reasons.

2. no_known_partial
   → persistenceComplete true oppure null secondo semantica scelta.

3. timeline assente senza journal noto
   → comportamento missing esistente conservato.
```

### `noTradeReasons.test.mjs`

Aggiungi test per:

```txt id="izvu4r"
1. persistenceComplete false
   → aggiunge reason standard una sola volta.

2. pending identity + persistenceComplete false
   → reason pending esistente preservata
   → reason persistence aggiunta
   → nessun duplicato.

3. mismatch identity + persistenceComplete false
   → reason mismatch esistente preservata
   → reason persistence aggiunta
   → nessun duplicato.

4. persistenceComplete true/null
   → nessuna reason persistence.
```

### `evidenceBuilder.test.mjs`

Aggiungi test per:

```txt id="vxnijn"
1. Betfair fresco + partial_persistence
   → betfairRecent true in dataQuality
   → persistenceComplete false
   → runner non attribuiti
   → marketReactionEvidence.available false
   → marketReactionEvidence.summary.causalityClaimed false
   → Source Identity effective invariata.

2. Sofa-only senza journal
   → comportamento esistente
   → non partial_persistence
   → no persistence no-trade reason.

3. pending identity + partial_persistence
   → entrambe le reason
   → cross-source bloccato
   → Source Identity effective pending preservato.

4. mismatch identity + partial_persistence
   → identity mismatch preservata
   → cross-source bloccato.

5. input timeline/tick
   → immutabili.
```

### Eventuale `evidenceRoute.test.mjs`

Crealo solo se serve verificare il wiring route-level.

Copri massimo:

```txt id="f94fs7"
1. la risposta API Evidence include integrity top-level;
2. la route non chiama writer/recovery/tracker.
```

## H. Regressioni da preservare

Mantieni verdi:

```txt id="o3l372"
backend/src/sofa/matchEvidence/latestMatchEvidence.test.mjs
backend/src/sofa/matchEvidence/evidenceBuilder.test.mjs
backend/src/sofa/matchEvidence/dataQuality.test.mjs
backend/src/sofa/matchEvidence/noTradeReasons.test.mjs
backend/src/routes/match/readResponses.test.mjs
backend/src/routes/betfair/latestPayloadResponse.test.mjs, backend/src/routes/betfair/latestPayloadIntegrity.test.mjs, backend/src/routes/betfair/betfairJsonResponse.test.mjs, backend/src/routes/betfair/normalizeIntegrity.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs
```

Non modificare questi test salvo regressione direttamente causata da questa patch.

## Regola tassativa: massimo tre tentativi ragionati

Prima del primo tentativo puoi leggere integralmente i file autorizzati e preparare una patch coerente. Non eseguire test parziali durante questa fase.

Un tentativo consiste esclusivamente in:

```txt id="djj7om"
1. applicare una patch mirata ma completa;
2. eseguire una sola volta il comando di verifica completo;
3. leggere il risultato.
```

Dopo un fallimento:

```txt id="mj5jdy"
- correggi solo cause dimostrate dall’ultimo comando;
- non ampliare scope;
- non introdurre nuove feature;
- non eseguire test isolati.
```

Dopo il terzo tentativo, riuscito o fallito:

```txt id="k0x0wq"
→ fermati;
→ non applicare altre patch;
→ non eseguire altri comandi;
→ non modificare test;
→ genera Repomix dei file effettivamente modificati;
→ scrivi il report finale.
```

Se un tentativo passa, fermati subito.

## Comando di verifica

```bat id="nqpblo"
cmd /d /s /c "node --check backend/src/sofa/matchEvidence.js && node --check backend/src/sofa/matchEvidence/latestMatchEvidence.js && node --check backend/src/sofa/matchEvidence/evidenceBuilder.js && node --check backend/src/sofa/matchEvidence/dataQuality.js && node --check backend/src/sofa/matchEvidence/noTradeReasons.js && node --check backend/src/routes/evidence.js && node backend/src/sofa/matchEvidence/latestMatchEvidence.test.mjs && node backend/src/sofa/matchEvidence/evidenceBuilder.test.mjs && node backend/src/sofa/matchEvidence/dataQuality.test.mjs && node backend/src/sofa/matchEvidence/noTradeReasons.test.mjs && node backend/src/routes/match/readResponses.test.mjs && node backend/src/routes/betfair/latestPayloadResponse.test.mjs && node backend/src/routes/betfair/latestPayloadIntegrity.test.mjs && node backend/src/routes/betfair/betfairJsonResponse.test.mjs && node backend/src/routes/betfair/normalizeIntegrity.test.mjs && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs"
```

Se hai creato `backend/src/routes/evidence/evidenceRoute.test.mjs`, usa invece questo comando:

```bat id="a94ith"
cmd /d /s /c "node --check backend/src/sofa/matchEvidence.js && node --check backend/src/sofa/matchEvidence/latestMatchEvidence.js && node --check backend/src/sofa/matchEvidence/evidenceBuilder.js && node --check backend/src/sofa/matchEvidence/dataQuality.js && node --check backend/src/sofa/matchEvidence/noTradeReasons.js && node --check backend/src/routes/evidence.js && node --check backend/src/routes/evidence/evidenceRoute.test.mjs && node backend/src/sofa/matchEvidence/latestMatchEvidence.test.mjs && node backend/src/sofa/matchEvidence/evidenceBuilder.test.mjs && node backend/src/sofa/matchEvidence/dataQuality.test.mjs && node backend/src/sofa/matchEvidence/noTradeReasons.test.mjs && node backend/src/routes/evidence/evidenceRoute.test.mjs && node backend/src/routes/match/readResponses.test.mjs && node backend/src/routes/betfair/latestPayloadResponse.test.mjs && node backend/src/routes/betfair/latestPayloadIntegrity.test.mjs && node backend/src/routes/betfair/betfairJsonResponse.test.mjs && node backend/src/routes/betfair/normalizeIntegrity.test.mjs && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs"
```

Non eseguire entrambi. Scegli il comando coerente con i file realmente modificati o creati.

## Repomix

Dopo il test finale, genera esclusivamente i file realmente modificati:

```powershell id="f0hfsy"
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "<elenco-esatto-file-modificati-separati-da-virgola>"
```

Non aprire, leggere o incollare `fileModificati.md`.

## Report finale

Scrivi solo:

```txt id="kr2knf"
esito;
tentativi eseguiti;
file modificati;
riepilogo modifiche;
comando eseguito;
exit code;
test passati;
test falliti;
limiti o non verificato;
errori incontrati;
percorso fileModificati.md;
esito Repomix.
```

# Backlog di consolidamento — 5–8

Da eseguire **dopo il Prompt 8** e **prima della chiusura ufficiale della Task 6**.

Questo backlog raccoglie solo ciò che è rimasto da correggere, consolidare o validare dopo i Prompt 5, 6, 7 e 8.

---

## 1. Prompt 5 — Recovery bootstrap journal

### P1 — Verificare i target canonici prima di pulire un journal completo residuo

**Stato:** da correggere.

La recovery oggi considera completo un journal con:

```txt
history.completed === true
timeline.completed === true
```

e tende a pulirlo come residuo completo.

Per una recovery più solida, questo non basta: se il journal è ancora presente, prima di cancellarlo bisogna verificare che i file canonici indicati dai target esistano davvero e siano leggibili.

**Comportamento richiesto:**

```txt
journal completo residuo
→ verifica target history
→ verifica target timeline

se entrambi i file canonici esistono e sono leggibili
→ rimuovi journal

se history manca
→ riscrivi solo history dal payload journalizzato

se timeline manca
→ riscrivi solo timeline dal payload journalizzato

se la riscrittura riesce
→ rimuovi journal

se verifica o riscrittura fallisce
→ lascia journal
→ recovery summary con retryablePending
```

**Vincoli:**

```txt
non usare runtime state
non usare sample live
non usare tracker
non usare scraper
non usare Source Identity
non usare Evidence
non generare nuovi commitId
non rigenerare tick, seq o history row
```

**Test da aggiungere:**

```txt
journal completo + entrambi i target presenti
→ cleanup senza rewrite

journal completo + history target mancante
→ rewrite solo history
→ cleanup

journal completo + timeline target mancante
→ rewrite solo timeline
→ cleanup

journal completo + entrambi i target mancanti
→ rewrite entrambi dal journal
→ cleanup

rewrite fallita
→ retryablePending
→ journal ancora presente

target non leggibile
→ retryablePending
→ nessun cleanup cieco
```

**Criterio di chiusura:**

Un journal completo residuo può essere cancellato solo se i file canonici sono presenti oppure sono stati ricostruiti con successo dal payload journalizzato.

---

### P2 — Osservabilità globale per invalidJournal non associabili a evento

**Stato:** hardening da valutare.

La decisione del Prompt 5 resta valida:

```txt
invalidJournal non identificabile
→ nessuna recovery inventata
→ nessuna integrity event-specific
→ nessuna scrittura business
```

Questa scelta è corretta perché non bisogna inventare `eventId`, `source` o `commitId`.

Resta però utile aggiungere osservabilità globale sicura.

**Hardening consigliato:**

```txt
log strutturato bootstrap
diagnostica interna
runbook operativo
eventuale health diagnostica non pubblica
```

Non devono essere esposti:

```txt
payload journal
target completi
path locali sensibili
URL con query string
token
cookie
header
segreti
```

---

### P3 — Strict recovery mode opzionale

**Stato:** opzionale, non default.

Il comportamento attuale resta:

```txt
fatal globale
→ blocca listen

retryablePending / recoveryFailed / invalidJournal
→ non bloccano listen
```

Eventuale feature futura:

```txt
RECOVERY_STRICT=1
```

Comportamento proposto:

```txt
retryablePending > 0
oppure
invalidJournal > 0
→ blocca app.listen
```

Questa feature non è obbligatoria per chiudere la Task 6, salvo cambio decisione operativa dopo le prove live/replay.

---

## 2. Prompt 6 — API Match integrity additiva

### P1 — Gestire HTTP 409 persistence_integrity in useMatchPolling.js

**Stato:** da correggere.

Il backend Match ora può restituire:

```txt
200 + integrity
404 ordinario
409 persistence_integrity
```

Il frontend Match chiama:

```txt
frontend/src/hooks/useMatchPolling.js
→ /api/match/:eventId/json
```

Oggi `useMatchPolling.js` tratta ogni risposta non `ok` come errore generico. Non legge il body JSON del 409 e quindi perde `integrity`.

**Effetto attuale:**

```txt
409 persistence_integrity
→ SofaScore JSON not found (409)
→ serverStatus: error
→ integrity persa
```

**Comportamento richiesto:**

```txt
200
→ data aggiornata
→ integrity conservata se presente
→ serverStatus: ok

404
→ serverStatus: waiting
→ error null

409 persistence_integrity
→ leggere body JSON
→ conservare integrity
→ serverStatus: partial_persistence oppure recovery_failed
→ non trattare come errore tecnico generico

altri status
→ serverStatus: error
→ errore tecnico
```

**Modifica consigliata:**

Aggiungere uno stato dedicato:

```js
const [integrity, setIntegrity] = useState(null);
```

e restituirlo dall’hook insieme a:

```txt
data
loading
error
lastUpdate
isPolling
serverStatus
```

**Test da aggiungere:**

```txt
404 resta waiting

409 partial_persistence
→ non diventa error tecnico
→ integrity conservata

409 recovery_failed
→ integrity conservata

500
→ resta error tecnico

200 con integrity
→ payload e integrity conservati
```

---

### P2 — Filtrare affectedDocuments nelle risposte Match

**Stato:** hardening da fare.

Il normalizer Match oggi accetta `affectedDocuments` se è un array, senza filtrare i valori.

Nel flusso reale il journal produce solo:

```txt
history
timeline
```

ma la risposta pubblica deve essere normalizzata in modo stretto.

**File da modificare:**

```txt
backend/src/routes/match/readResponses.js
```

**Comportamento richiesto:**

```js
affectedDocuments: Array.isArray(raw.affectedDocuments)
  ? raw.affectedDocuments.filter(name => name === 'history' || name === 'timeline')
  : []
```

**Test da aggiungere:**

```txt
affectedDocuments: ['history', 'timeline', 'secret', 'other']
→ affectedDocuments: ['history', 'timeline']
```

---

### P2 — Limitare source Match a sofa/null

**Stato:** hardening da fare.

La route Match passa correttamente `source: 'sofa'`, ma il normalizer Match accetta anche `source: 'betfair'`.

Per evitare ambiguità futura, le API Match devono esporre solo:

```txt
source: 'sofa'
source: null
```

**File da modificare:**

```txt
backend/src/routes/match/readResponses.js
```

**Comportamento richiesto:**

```js
source: raw.source === 'sofa' ? 'sofa' : null
```

**Test da aggiungere:**

```txt
raw.source === 'betfair'
→ response.integrity.source === null
```

---

## 3. Prompt 7 — API Betfair integrity separata da health

### P1 — Gestire HTTP 409 persistence_integrity in useBetfairJson.js

**Stato:** da correggere.

Il backend Betfair ora può restituire:

```txt
/api/betfair/:eventId/latest
→ 200 + integrity
→ 404 ordinario
→ 409 persistence_integrity

/api/betfair/:eventId/json
→ 200 + integrity
→ 404 ordinario
→ 409 persistence_integrity
```

Il frontend Betfair chiama entrambi tramite:

```txt
frontend/src/hooks/useBetfairJson.js
```

**Problema attuale su `/latest`:**

Il body JSON viene letto anche sui non-200 e `health` viene conservata se presente, ma su 409 l’hook lancia comunque errore generico. `integrity` non viene conservata né restituita.

**Problema attuale su `/json`:**

Se `res.ok === false`, il body non viene letto. Quindi su 409 si perde completamente `integrity`.

**Effetto attuale:**

```txt
409 persistence_integrity
→ Betfair latest not found (409)
oppure
→ Betfair JSON not found (409)

integrity non disponibile al frontend
```

**Comportamento richiesto:**

```txt
/latest 200
→ data aggiornata
→ health aggiornata
→ integrity conservata

/latest 409 persistence_integrity
→ leggere body
→ health conservata se presente
→ integrity conservata
→ non trattare come errore tecnico generico

/json 200
→ timeline letta
→ integrity conservata

/json 409 persistence_integrity
→ leggere body
→ integrity conservata
→ non perdere il motivo persistence_integrity

/latest 404
→ fallback a /json come oggi

/latest 500
→ errore tecnico
```

**Decisione sul fallback:**

Non fare fallback automatico da `/latest` a `/json` su `409`.

Motivo:

```txt
409 persistence_integrity non significa missing ordinario.
Significa persistenza incompleta nota.
```

Il fallback resta valido solo su `404`.

**Modifica consigliata:**

Aggiungere:

```js
const [integrity, setIntegrity] = useState(null);
```

e restituirlo dall’hook insieme a:

```txt
data
health
moneyFlowHistory
loading
error
lastUpdate
isPolling
```

**Test da aggiungere:**

```txt
/latest 200 + integrity
→ integrity conservata

/latest 409 partial_persistence
→ health conservata
→ integrity conservata
→ non errore generico

/latest 409 recovery_failed
→ integrity conservata

/json 409 partial_persistence
→ body letto
→ integrity conservata

/latest 404
→ fallback a /json invariato

/latest 500
→ resta errore tecnico
```

---

### P2 — Filtrare affectedDocuments nelle risposte Betfair

**Stato:** hardening da fare.

Il normalizer Betfair accetta `affectedDocuments` se è un array, senza filtrare i valori.

**File da modificare:**

```txt
backend/src/routes/betfair/latestPayload.js
```

**Comportamento richiesto:**

```js
affectedDocuments: Array.isArray(raw.affectedDocuments)
  ? raw.affectedDocuments.filter(name => name === 'history' || name === 'timeline')
  : []
```

**Test da aggiungere:**

```txt
affectedDocuments: ['history', 'timeline', 'secret', 'other']
→ affectedDocuments: ['history', 'timeline']
```

---

## 4. Prompt 8 — Evidence persistence integrity e no-trade reason

### P1 — Validare API Evidence reale con journal pending e recovery_failed

**Stato:** validazione obbligatoria prima della chiusura Task 6.

Il Prompt 8 è implementato nel core, ma resta da validare con stati journal reali o simulati dal filesystem.

Endpoint:

```txt
GET /api/evidence/:eventId/latest
```

**Scenari minimi:**

```txt
journal Sofa pending
→ Evidence integrity.status partial_persistence
→ affectedSources include sofa
→ dataQuality.persistenceComplete false
→ noTradeReason persistence presente

journal Betfair pending
→ Evidence integrity.status partial_persistence
→ affectedSources include betfair
→ dataQuality.persistenceComplete false
→ Market Reactions unavailable

journal Sofa recovery_failed
→ Evidence integrity.status recovery_failed
→ affectedSources include sofa
→ Source Identity effective invariata

journal Betfair recovery_failed
→ Evidence integrity.status recovery_failed
→ affectedSources include betfair
→ Source Identity effective invariata
```

**Criterio di accettazione:**

Evidence deve degradare cross-source senza trasformare il problema in:

```txt
tick stale
tick missing ordinario
Source Identity mismatch
runtime scraper error
graph health issue
ladder reliability issue
```

---

### P2 — Hardening integrity Evidence

**Stato:** hardening da fare.

Applicare anche a Evidence le stesse regole di normalizzazione strette previste per Match e Betfair.

**Regole richieste:**

```txt
affectedDocuments
→ solo history/timeline

sources.sofa.source
→ solo sofa/null

sources.betfair.source
→ solo betfair/null
```

**Motivo:**

Non è un bug attuale, ma rende il contratto pubblico Evidence coerente con gli altri endpoint integrity.

**Test da aggiungere:**

```txt
affectedDocuments: ['history', 'timeline', 'secret', 'other']
→ affectedDocuments: ['history', 'timeline']

integrity grezza per sofa con source:'betfair'
→ integrity.sources.sofa.source === null

integrity grezza per betfair con source:'sofa'
→ integrity.sources.betfair.source === null
```

---

### P2 — Verificare eventuali consumer UI di Evidence

**Stato:** verifica leggera, nessuna feature UI obbligatoria ora.

Decisione:

```txt
non fare UI Evidence ora,
salvo scoprire che esiste già un pannello che mostra noTradeReasons/dataQuality
```

Se esiste già un consumer UI di Evidence, verificare che non rompa con i nuovi campi additivi:

```txt
integrity
dataQuality.persistenceComplete
noTradeReasons
```

Se la UI ignora questi campi, nessun intervento obbligatorio.

**Comando consigliato:**

```bash
grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=.next \
  --include='*.js' \
  --include='*.jsx' \
  --include='*.ts' \
  --include='*.tsx' \
  -E '/api/evidence|persistenceComplete|noTradeReasons|dataQuality' frontend/src backend/src 2>/dev/null > evidence-usages.txt
```

---

## 5. Trasversale Prompt 6–8 — Adapter integrity pubblico

### P2 — Filtrare affectedDocuments anche in matchHistory.js

**Stato:** hardening da fare.

`getMatchPersistenceIntegrity(...)` normalizza lo stato journal prima che venga usato dalle API Match, Betfair ed Evidence.

Il filtro va applicato anche qui, non solo nei moduli route, per proteggere eventuali consumer futuri.

**File da modificare:**

```txt
backend/src/sofa/matchHistory.js
```

**Comportamento richiesto:**

```js
affectedDocuments: Array.isArray(raw.affectedDocuments)
  ? raw.affectedDocuments.filter(name => name === 'history' || name === 'timeline')
  : []
```

---

## 6. Trasversale Prompt 5–8 — Test integrati

### P1 — Test integrato recovery → API → Evidence

**Stato:** obbligatorio prima della chiusura Task 6.

I test attuali coprono bene i moduli separati, ma manca una verifica integrata che attraversi l’intero flusso:

```txt
journal
→ recovery/bootstrap
→ API Match/Betfair integrity
→ Evidence
→ dataQuality.persistenceComplete
→ noTradeReasons
```

**Scenari minimi:**

```txt
journal Sofa pending non recuperato
→ API Match segnala partial
→ Evidence segnala partial
→ persistenceComplete false
→ noTradeReason standard

journal Betfair pending non recuperato
→ API Betfair segnala partial
→ Evidence segnala partial
→ Market Reactions unavailable

journal recovery_failed
→ Evidence integrity.status recovery_failed
→ Source Identity effective invariata
→ persistenceComplete false

journal completo residuo + file canonico mancante
→ dopo fix Prompt 5, recovery riscrive il file mancante
→ API successiva non restituisce falso 404/no_known_partial
→ Evidence non produce falso no_known_partial
```

**Criterio di accettazione:**

Il comportamento osservato dai test modulari deve essere confermato almeno una volta a livello route/app/integrato.

---

## 7. Trasversale Prompt 5–8 — Validazione finale

### P1 — Simulazione con match_history già presente

**Stato:** da eseguire prima della chiusura Task 6.

**Scenario minimo:**

```txt
1. usare copia sicura di backend/match_history;
2. creare o produrre journal pending;
3. simulare restart backend;
4. verificare recovery prima di listen;
5. verificare nessuna duplicazione history;
6. verificare nessun tick canonico duplicato;
7. verificare API Match integrity;
8. verificare API Betfair integrity separata da health;
9. verificare Evidence integrity;
10. verificare dataQuality.persistenceComplete;
11. verificare no-trade reason persistence.
```

---

### P1 — Prova live/replay finale

**Stato:** da eseguire prima della chiusura Task 6.

**Scenario minimo:**

```txt
1. avvio backend;
2. tracking reale o replay controllato;
3. interruzione simulata tra history e timeline, se possibile;
4. restart;
5. recovery;
6. verifica API Match;
7. verifica API Betfair;
8. verifica API Evidence;
9. verifica no-trade reason;
10. verifica nessuna duplicazione history/timeline;
11. verifica nessun tick Betfair canonico duplicato;
12. verifica nessuna entry legacy usata come canonica;
13. verifica che partial_persistence non venga interpretato come stale, mismatch o runtime error.
```

---

## 8. Trasversale Prompt 5–8 — Documentazione

### P2 — Aggiornare documentazione canonica

**Stato:** da fare prima della chiusura Task 6.

**Documenti da aggiornare:**

```txt
docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.mdx
docs/tennis-decision-ui/api/01-match.mdx
docs/tennis-decision-ui/api/02-betfair.mdx
docs/tennis-decision-ui/api/03-evidence.mdx
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.mdx
docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.mdx
docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.mdx
docs/tennis-decision-ui/modules/evidence/04-market-reactions.mdx
docs/tennis-decision-ui/operations/03-betfair-diagnostics.mdx
docs/tennis-decision-ui/operations/04-validation-and-rollback.mdx
docs/tennis-decision-ui/architecture/02-data-lifecycle.mdx
docs/tennis-decision-ui/roadmap/01-current-state.mdx
```

**Contenuti minimi:**

```txt
commitId
journal sidecar
recovery bootstrap
records / invalidRecords / invalidEntries
default recovery non bloccante
invalidJournal globale
single-process invariant
lock cross-process rimandato
API Match integrity
API Betfair integrity separata da health
API Evidence integrity
HTTP 409 persistence_integrity
dataQuality.persistenceComplete
no-trade reason persistence
frontend consumer del 409
validazioni simulate/live finali
```

---

## Riepilogo operativo

### P1 obbligatori

```txt
1. Recovery: verificare target canonici prima del cleanup di journal completo residuo.
2. Frontend Match: gestire 409 persistence_integrity in useMatchPolling.js.
3. Frontend Betfair: gestire 409 persistence_integrity in useBetfairJson.js.
4. Evidence: validare /api/evidence/:eventId/latest con journal pending/recovery_failed.
5. Test integrato recovery → API → Evidence.
6. Simulazione con match_history già presente.
7. Prova live/replay finale.
```

### P2 hardening consigliati

```txt
1. Filtrare affectedDocuments in readResponses.js.
2. Filtrare affectedDocuments in latestPayload.js.
3. Filtrare affectedDocuments in matchHistory.js.
4. Filtrare affectedDocuments nel normalizer Evidence.
5. Limitare source Match a sofa/null.
6. Limitare source Evidence per ramo:
   - sources.sofa.source solo sofa/null
   - sources.betfair.source solo betfair/null
7. Verificare eventuali consumer UI Evidence.
8. Aggiornare documentazione canonica.
9. Aggiungere osservabilità globale sicura per invalidJournal.
```

### P3 opzionali

```txt
1. Strict recovery mode RECOVERY_STRICT=1.
2. Lock cross-process solo se cambia il modello operativo.
3. Diagnostica avanzata non pubblica per journal/recovery.
```

## Decisione operativa

I Prompt 5, 6, 7 e 8 risultano correttamente impostati nel loro core.

Prima della chiusura ufficiale della Task 6 servono però questi consolidamenti:

```txt
recovery più robusta sui journal completi residui;
frontend consapevole del nuovo 409 persistence_integrity;
hardening della normalizzazione integrity pubblica;
validazione Evidence con persistence integrity reale;
test integrato recovery/API/Evidence;
simulazione e live/replay finale;
documentazione canonica.
```

## Criterio di priorità

* Prompt C1 — Recovery: journal completo residuo + verifica target canonici
* Prompt C2 — Integrity hardening backend: affectedDocuments/source su Match, Betfair, Evidence, adapter
* Prompt C3 — Frontend Match: gestione 409 persistence_integrity in useMatchPolling
* Prompt C4 — Frontend Betfair: gestione 409 persistence_integrity in useBetfairJson
* Prompt C5 — Test integrato recovery → API → Evidence
* Prompt C6 — Documentazione canonica Task 6 integrity/recovery/evidence
---

# Prompt C1 — Recovery: verifica target canonici prima del cleanup di journal completo residuo

Lavora sul progetto locale **Tennis Decision UI**.

Non produrre piano, ragionamento esteso, todo, analisi architetturale o messaggi intermedi. Leggi i file autorizzati, applica una patch coerente, esegui il comando completo secondo la regola dei tre tentativi e scrivi solo il report finale.

## Obiettivo

Rendere più robusta la recovery bootstrap dei journal completi residui.

Quando un journal ha:

```txt id="jz6s5d"
history.completed === true
timeline.completed === true
```

la recovery non deve cancellarlo automaticamente senza prima verificare che i due file canonici indicati dai target esistano e siano leggibili come JSON.

Se uno dei file canonici manca o non è leggibile, la recovery deve riaprire quel documento come incompleto e ripararlo usando esclusivamente il payload già journalizzato.

## File autorizzati alla modifica

```txt id="p3hxzn"
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/recovery.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
```

Modifica `commitJournal.js` solo se serve una piccola API journal per riaprire un documento completato ma non verificabile, ad esempio `markDocumentIncomplete(...)` o equivalente minimo.

## File leggibili ma read-only

```txt id="a9u3g1"
backend/src/sofa/matchHistory/sofaUpdates.js
backend/src/sofa/betfair/processor.js
backend/src/sofa/matchHistory.js
backend/src/sofa/timelineStore.js
```

Usali solo per rispettare firme, contratti e comportamento degli adapter di repair. Non modificarli.

## Documentazione di riferimento

```txt id="tk48pd"
docs/tennis-decision-ui/modules/storage/02-commit-journal-and-recovery.mdx
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx
```

Se uno di questi documenti non esiste nel repository locale, non crearlo e non bloccare la task: prosegui usando i contratti già presenti nel codice e nei test.

## Contratti da preservare

La recovery deve restare:

```txt id="w29657"
read-only rispetto a runtime state;
basata solo sul journal;
idempotente;
senza rigenerare commitId;
senza rigenerare tick, seq o history row;
senza usare sample live;
senza usare tracker;
senza usare scraper;
senza usare Source Identity;
senza usare Evidence;
senza avviare HTTP, browser, fetch o scraper.
```

Il repair deve usare solo:

```txt id="fjvvqt"
record.documents.history.target
record.documents.history.payload.document
record.documents.history.payload.metadata

record.documents.timeline.target
record.documents.timeline.payload.document
record.documents.timeline.payload.metadata
```

Non cambiare:

```txt id="lu411a"
API Match;
API Betfair;
API Evidence;
frontend;
server bootstrap;
Source Identity;
Market Reactions;
timelineStore;
history storage;
scraper Python;
Lay The Winner.
```

## Comportamento richiesto

### Caso 1 — Journal completo e target presenti

```txt id="stzjji"
history.completed:true
timeline.completed:true
history target presente e leggibile
timeline target presente e leggibile
```

Risultato:

```txt id="55g9w9"
cleanup journal
nessuna rewrite history
nessuna rewrite timeline
summary.cleaned incrementato
```

### Caso 2 — Journal completo ma history target mancante o non leggibile

```txt id="w1ql15"
history.completed:true
timeline.completed:true
history target mancante o JSON non leggibile
timeline target presente e leggibile
```

Risultato:

```txt id="4c85zl"
history viene trattata come documento non verificato
history viene riscritta dal payload journalizzato
timeline non viene riscritta
journal viene rimosso solo dopo repair riuscito
```

### Caso 3 — Journal completo ma timeline target mancante o non leggibile

```txt id="bg6s5j"
history.completed:true
timeline.completed:true
history target presente e leggibile
timeline target mancante o JSON non leggibile
```

Risultato:

```txt id="vkfofh"
timeline viene trattata come documento non verificato
timeline viene riscritta dal payload journalizzato
history non viene riscritta
journal viene rimosso solo dopo repair riuscito
```

### Caso 4 — Entrambi i target mancanti o non leggibili

Risultato:

```txt id="v2auf3"
history riscritta dal payload journalizzato
timeline riscritta dal payload journalizzato
journal rimosso solo dopo repair riuscito
```

### Caso 5 — Repair fallisce

Se la riscrittura di un documento mancante/non leggibile fallisce:

```txt id="sxtk72"
non rimuovere il journal;
summary.retryablePending incrementato;
outcome category retryable_pending;
failedDocument corretto;
il documento non verificato resta osservabile come incompleto per il retry successivo.
```

Non lasciare un journal completo-residuo non riparato in uno stato che porta le API a vedere falsamente `no_known_partial`.

## Indicazioni implementative

Preferisci una soluzione piccola e locale.

Se serve modificare `commitJournal.js`, aggiungi solo l’operazione minima per riaprire un documento già marcato completed quando il target canonico non è verificabile.

Esempio accettabile:

```txt id="fp5wk2"
markDocumentIncomplete(commitId, 'history')
markDocumentIncomplete(commitId, 'timeline')
```

oppure nome equivalente, purché:

```txt id="7hzl09"
validi commitId;
validi documentName;
non alteri payload;
non alteri target;
non alteri source;
non alteri eventId;
mantenga reason compatibile con lo stato pending;
usi scrittura atomica come le altre operazioni journal;
restituisca esito strutturato operation:'journal'.
```

Dopo avere riaperto i marker incompleti, la recovery può riusare il normale percorso di repair da journal.

## Test obbligatori

Aggiorna o aggiungi test in:

```txt id="nwsmk6"
backend/src/sofa/matchHistory/recovery.test.mjs
backend/src/sofa/matchHistory/commitJournal.test.mjs
```

Scenari minimi:

```txt id="lhtxri"
1. journal completo + entrambi i target presenti
→ cleanup senza rewrite

2. journal completo + history target mancante
→ history riscritta dal payload journalizzato
→ timeline non riscritta
→ cleanup

3. journal completo + timeline target mancante
→ timeline riscritta dal payload journalizzato
→ history non riscritta
→ cleanup

4. journal completo + entrambi i target mancanti
→ history e timeline riscritte dal payload journalizzato
→ cleanup

5. journal completo + target presente ma JSON non leggibile
→ documento trattato come non verificato
→ repair dal payload journalizzato

6. repair fallita
→ retryablePending
→ journal non rimosso
→ documento non verificato resta incompleto o comunque osservabile per il retry successivo

7. eventuale nuova API journal markDocumentIncomplete
→ idempotente se il documento è già incompleto
→ fallisce su commitId invalido
→ fallisce su documentName invalido
→ non modifica payload, target, eventId o source
```

## Comando di test mirato

Esegui un solo comando completo per ogni tentativo:

```bat id="xux40v"
cmd /d /s /c "node --check backend/src/sofa/matchHistory/recovery.js && node --check backend/src/sofa/matchHistory/commitJournal.js && node backend/src/sofa/matchHistory/commitJournal.test.mjs && node backend/src/sofa/matchHistory/recovery.test.mjs && node backend/src/sofa/matchHistory/sofaUpdates.test.mjs && node backend/src/sofa/betfair/processor.test.mjs"
```

Non eseguire test parziali separati.

## Regola dei tre tentativi

Sono consentiti al massimo **tre tentativi ragionati**.

Ogni tentativo deve consistere solo in:

```txt id="or7mkk"
1. applicare una patch mirata;
2. eseguire il comando di test completo;
3. leggere l’output.
```

Se un tentativo fallisce:

```txt id="2ddcqt"
correggi solo cause dimostrate dall’output;
non allargare lo scope;
non modificare file fuori dai File autorizzati;
non generare fileModificati.md tra un tentativo e l’altro.
```

Se il terzo tentativo fallisce:

```txt id="qrbk5k"
fermati;
non fare un quarto tentativo;
genera fileModificati.md solo se sono stati modificati file;
scrivi il report finale con errore, exit code e limiti.
```

## File Repomix post-task

Dopo il test finale, se sono stati modificati file:

```txt id="oqw9cd"
1. individua solo i file effettivamente modificati o creati da questa task;
2. crea $repomixInclude con quei percorsi separati da virgola;
3. dalla root del repository, in Windows PowerShell, esegui:
```

```powershell id="l1s7pz"
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"
```

Regole:

```txt id="ji9h4i"
non usare repomix senza npx.cmd;
non installare Repomix globalmente;
non includere fileModificati.md nella generazione;
non includere file non modificati da questa task;
includi file di test solo se sono stati effettivamente modificati;
non modificare altro codice dopo la generazione di fileModificati.md.
```

Se nessun file è stato modificato:

```txt id="s9fco4"
non creare né aggiornare fileModificati.md.
```

## Report finale

Scrivi solo:

```txt id="nq4vza"
esito;
tentativi eseguiti;
file modificati;
riepilogo modifiche;
comando eseguito;
exit code;
test passati;
test falliti;
limiti o non verificato;
errori incontrati;
percorso fileModificati.md;
numero file inclusi in fileModificati.md;
esito Repomix.
```

Non incollare il contenuto di `fileModificati.md`.


# Prompt 9 — Allineamento documentazione canonica

## Contesto da allegare

**Documenti da modificare**

* `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.mdx`
* `docs/tennis-decision-ui/modules/sofa/01-live-tracking.mdx`
* `docs/tennis-decision-ui/operations/01-local-runtime.mdx`
* `docs/tennis-decision-ui/api/01-match.mdx`
* `docs/tennis-decision-ui/api/02-betfair.mdx`
* `docs/tennis-decision-ui/api/03-evidence.mdx`
* `docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.mdx`
* `docs/tennis-decision-ui/modules/evidence/02-source-identity.mdx`
* `docs/tennis-decision-ui/modules/evidence/03-quality-flow-and-alignment.mdx`
* `docs/tennis-decision-ui/modules/evidence/04-market-reactions.mdx`

**Contesto tecnico**

* report finali dei prompt 1–8
* elenco file modificati e test passati

## Prompt

Lavora sul progetto locale **Tennis Decision UI**.

Devi aggiornare esclusivamente la documentazione canonica dopo l’implementazione completata della Task 6.

Non modificare codice, test, configurazione, launcher, frontend, history, timeline, dump o file generati.

## Obiettivo

Allineare i documenti canonici ai contratti implementati per:

```txt
writer result strutturati
history discovery deterministica
journal commit multi-file
recovery prima di app.listen
integrity additiva API
partial_persistence in Evidence
distinzione da stale, missing e Source Identity
```

## File autorizzati

Puoi modificare solo i documenti allegati.

## Regole

* Documenta soltanto comportamento effettivamente implementato e verificato dai report.
* Non descrivere feature pianificate ma non implementate.
* Non cambiare naming di endpoint, payload o status HTTP diversi da quelli realmente implementati.
* Mantieni la distinzione:

```txt
missing
stale
technical runtime error
Source Identity pending/mismatch
partial_persistence
recovery_failed
```

* Chiarisci che journal e `.tmp` non sono dati business e non sono esposti dai reader.
* Chiarisci che recovery è bootstrap backend, non GET HTTP.
* Chiarisci che Evidence resta read-only e non modifica Source Identity.
* Non introdurre claim di causalità o segnali operativi.

## Verifica richiesta

* Controlla tutti gli snippet JS e JSON modificati per coerenza sintattica.
* Controlla riferimenti a path, endpoint, test e status HTTP.
* Verifica che nessun documento dichiari ancora `saveTimeline(...) → null` o `saveHistory(...) → undefined` se il contratto è stato effettivamente cambiato.
* Verifica che il documento runtime non implichi modifiche a `avvio.py` o launcher, se non sono state fatte.

## Output finale richiesto

Scrivi solo:

* documenti modificati;
* riepilogo delle correzioni;
* contratti aggiornati;
* incoerenze residue trovate;
* elementi non documentati perché non implementati.
