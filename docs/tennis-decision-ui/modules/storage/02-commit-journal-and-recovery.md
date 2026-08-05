# Commit journal e recovery

## Scopo

Questo documento definisce il coordinamento dei commit logici tra history e timeline e il contratto process-level che garantisce un solo backend writer per repository e storage identity.

History e timeline restano file canonici distinti e atomicamente riscritti per singolo file. Il journal non sostituisce questi file: registra lo stato temporaneo di un commit multi-documento e permette repair deterministico quando una scrittura resta incompleta.

```txt
backend/src/runtime/matchHistoryWriterAuthority.js
backend/src/sofa/matchHistory/commitId.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/commitJournal/
backend/src/sofa/matchHistory/recovery.js
```

`commitJournal.js` resta la facade pubblica. I file sotto `commitJournal/` separano store, validazione record, adapter filesystem, scanner recovery, integrity read-only e helper di risultato.

## Stato

```txt
writer authority backend-owned
→ implementata e integrata nel bootstrap e nello shutdown

percorso ordinario live con commit completi
→ validato

partial_persistence reale controllata
→ da validare

recovery_failed reale
→ da validare

failure filesystem reale
→ da validare
```

I test automatici IMPL-015 sono stati eseguiti sul codice pubblicato:

```txt
writer authority: 26 passati, 0 falliti
matchTracker: 10 passati, 0 falliti
server: 30 passati, 0 falliti
```

Non è stato eseguito un collaudo manuale con due backend reali concorrenti.

## Collocazione

I sidecar locali vivono sotto:

```txt
backend/match_history/.pending_commits/
backend/match_history/.writer_authority/
```

La distinzione è obbligatoria:

```txt
.pending_commits
→ stato di un commit logico incompleto per evento/source

.writer_authority
→ ownership esclusiva process-level della repository/storage identity
```

Nessuno dei due è history o timeline. Non devono essere scoperti come file business.

`.writer_authority/` non è un journal di commit, una fonte dati, una cache o un artefatto API. I writer business non lo creano, non lo verificano e non lo rimuovono autonomamente.

Il `commitId` correla:

```txt
journal
history row
timeline tick
writer history
writer timeline
risultato di commit
```

Le source ammesse sono:

```txt
sofa
betfair
```

Il formato del `commitId` è filename-safe:

```txt
sofa-<uuid>
betfair-<uuid>
```

## Writer authority

La writer authority è creata soltanto dentro `startServer()` tramite:

```txt
createMatchHistoryWriterAuthority()
```

`createApp()` resta priva di side effect: costruisce app, middleware e route, ma non acquisisce authority, non esegue recovery e non apre listener.

La writer authority identifica in forma bounded almeno:

```txt
schema
project
backendInstanceId
pid
processStartFingerprint
createdAt
repositoryIdentity
storageIdentity
```

La documentazione non riporta path personali o record reali.

### Classificazione dell'authority

```txt
record assente
→ acquired

record appartenente alla stessa identità owner
→ already_owned

owner positivamente morto o PID riciclato verificato
→ reclaimed

owner vivo e identità verificata
→ active
→ startup bloccato

owner o identità non verificabili
→ unknown
→ startup bloccato fail-closed
```

La classificazione non usa la sola porta. Launcher lock, process ownership e persistence writer authority restano concetti separati.

## Bootstrap corretto

La sequenza backend corrente è:

```txt
createApp()
→ createMatchHistoryWriterAuthority()
→ acquire()
→ runPendingCommitRecovery(...)
→ start listener
→ wait listener readiness
→ register shutdown
```

La recovery non inizia se l'acquisizione non restituisce un risultato positivo e verificabile. Un secondo backend sulla stessa storage identity non raggiunge recovery, listener, tracking o scritture canoniche.

Dopo un'acquisizione positiva, il backend tenta il release nei failure path del bootstrap:

```txt
recovery fatal
recovery rejection
listen throw sincrono
startup error prima della listener readiness
failure nella registrazione dello shutdown
```

Il failure del release viene loggato in forma bounded e non deve mascherare l'errore primario del bootstrap.

## Sequenza di commit

Un nuovo commit canonico segue questa sequenza logica:

```txt
pending journal
→ history
→ marker history completed
→ timeline
→ marker timeline completed
→ remove journal
```

Il journal viene rimosso solo quando entrambi i documenti risultano completati.

I writer coinvolti devono restituire un esito strutturato. Un risultato assente, `undefined`, non-ok, con file diverso dal target atteso o con `commitId` diverso dal commit atteso deve essere trattato come failure, non come successo implicito.

Esiti writer minimi:

```txt
written
unchanged
failed
```

Esiti di commit osservabili:

```txt
complete
recovered
unchanged
partial
failed
```

## Precondizione JSON-safe dei producer

```txt
producer
→ payload completamente JSON-safe
→ createPendingCommit
```

Il journal non converte `undefined` in `null`, non elimina campi `undefined`, non corregge semanticamente il payload e non allenta la validazione.

Il producer decide esplicitamente se un dato assente diventa `null`, viene omesso o usa un altro valore canonico previsto.

```txt
SofaScore
homeTotal / awayTotal assenti
→ null

Betfair diagnostics
graphLoginRequiredUrl
graphLoginRequiredReason
graphLoginRequiredText
→ null quando assenti
```

```txt
null
→ assenza serializzabile

undefined
→ payload non JSON-safe
→ record rifiutato
```

Non esiste ancora un test automatico dedicato che costruisca statistiche senza `homeTotal`/`awayTotal` e verifichi l'assenza di `undefined`.

## Recovery e repair

La recovery usa solo informazioni già journalizzate:

```txt
payload
metadata
target
commitId
stato completed dei documenti
```

Non ricostruisce dati business da:

```txt
runtime state
sample live
tracker
scraper
fetch live
Source Identity
Evidence
frontend
```

Per ogni journal valido `pending`:

```txt
source sofa
→ repairSofaCommitFromJournal(...)

source betfair
→ repairBetfairCommitFromJournal(...)
```

Gli adapter di repair:

```txt
leggono solo il journal
non generano nuovo commitId
non generano nuovi tick
non generano nuove history row
non rigenerano seq
scrivono solo documenti completed !== true
marcano completed solo dopo write verificata
rimuovono il journal solo quando history e timeline sono completate
```

Un journal già completo viene rimosso solo dopo verifica dei target canonici.

## Completed residual e target verification

Un journal con:

```txt
documents.history.completed === true
documents.timeline.completed === true
```

non viene rimosso ciecamente.

Prima del cleanup, recovery e runtime verificano che i target canonici indicati dal journal siano presenti e leggibili come JSON.

Se un target è assente o non leggibile:

```txt
il journal non viene rimosso
il documento non verificabile viene riaperto come incomplete
il payload journalizzato resta disponibile per retry
getPersistenceIntegrityStatus non restituisce un falso no_known_partial
```

Quando `createPendingCommit(...)` trova un completed residual per la stessa coppia `eventId + source`, può rimuoverlo solo se i target canonici sono verificabili. Se non lo sono, non crea il nuovo commit e lascia lo stato osservabile come persistenza incompleta.

## Classificazione recovery scanner

Lo scanner distingue tre classi.

### records

Record validi e candidati al repair.

Devono essere:

```txt
JSON parsabili
sicuri
filename coerente con commitId
version valida
commitId valido
eventId valido
source sofa o betfair
status pending con reason null
oppure recovery_failed con reason valida
documents.history valido
documents.timeline valido
payload sicuro
completed boolean
```

Solo i record `pending` con `reason:null` vengono passati agli adapter di repair.

### invalidRecords

Record JSON leggibili, sicuri e identificabili, ma strutturalmente non conformi.

Comportamento:

```txt
markRecoveryFailed(commitId, invalid_journal_structure)
nessun writer business
nessun adapter repair
bootstrap successivo: alreadyRecoveryFailed
```

### invalidEntries

Record non recuperabili in sicurezza.

Esempi:

```txt
JSON non parsabile
JSON non sicuro
commitId assente
commitId invalido
filename incoerente con commitId
query string sensibile
payload con chiavi vietate
```

Comportamento:

```txt
nessuna scrittura
nessun markRecoveryFailed automatico
nessun adapter repair
segnalazione come invalidJournal
```

Questi casi possono non essere associabili a un `eventId`; la loro osservabilità è quindi globale o di bootstrap.

## Stato di integrità

Lo stato interno di persistenza espone:

```txt
no_known_partial
partial_persistence
recovery_failed
```

Significato:

| Stato                 | Significato                                                    |
| --------------------- | -------------------------------------------------------------- |
| `no_known_partial`    | Non esiste un partial noto per `eventId` e source richiesti    |
| `partial_persistence` | Esiste un commit incompleto o retryable                        |
| `recovery_failed`     | Esiste un journal identificabile marcato come recovery fallita |

Le API, Evidence e frontend possono leggere questo stato tramite adapter read-only. La lettura non deve creare directory, scrivere journal, eseguire recovery o accedere a payload journalizzati.

Le superfici pubbliche devono filtrare `affectedDocuments` ai soli valori:

```txt
history
timeline
```

Le source pubbliche devono essere ristrette al consumer:

```txt
Match API
→ sofa o null

Betfair API
→ betfair o null

Evidence
→ sources.sofa.source sofa o null
→ sources.betfair.source betfair o null
```

## Bootstrap recovery

La recovery backend è protetta dalla writer authority e precede l'apertura del listener Express:

```txt
createApp()
→ acquire writer authority
→ runPendingCommitRecovery(...)
→ wait listener readiness
→ register shutdown
```

Fatalità globale e failure per-file sono distinte:

```txt
fatal globale
→ release authority
→ blocca listener

errori per-file non fatali
→ non bloccano il listener
```

Errori per-file non fatali includono:

```txt
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
```

Questa scelta mantiene il backend resiliente: un singolo journal problematico non impedisce l'avvio dell'intero backend, purché il risultato non sia classificato come fatal globale.

## Shutdown e release

Il processo backend mantiene la writer authority durante l'intero runtime.

Sequenza corrente:

```txt
shutdown richiesto
→ server.close richiesto
→ terminal tracker barrier attivata
→ stop tracker e scheduler
→ avvio tracker drain
→ terminazione processi Python
→ completamento tracker drain
→ completamento chiusura listener
→ release writer authority
→ exit
```

Il registro process-local include almeno le operazioni SofaScore iniziali e gli update SofaScore/Betfair dello scheduler. Le Promise vengono rimosse sia su fulfillment sia su rejection; una rejection gestita dell'update non rende da sola fallito il drain.

Il release avviene soltanto quando il drain restituisce:

```txt
ok: true
drained: true
activeOperations: 0
```

Se il drain rigetta, lancia o restituisce un risultato non positivo o invalido:

```txt
tracker_drain_failed
→ authority retained
→ nessun secondo tentativo di release
→ exit comunque
```

Un force timeout esegue l'uscita senza rilasciare anticipatamente l'authority. Il record residuo viene valutato dal backend successivo attraverso la verifica alive/dead/unknown dell'owner.

Un release fallito dopo drain positivo viene loggato in forma bounded e non blocca l'uscita.

## Invariant single-process

Il progetto enforce un solo processo backend writer per repository e storage identity:

```txt
backend/match_history
```

L'invariante viene applicata dal bootstrap backend, non dal launcher e non dai singoli writer.

Non sono supportati:

```txt
PM2 cluster con writer sulla stessa directory
repliche Docker sulla stessa directory
worker separati che scrivono direttamente match_history
trading engine separato che scrive file canonici
multi-writer
```

Un backend manuale su una porta alternativa non può acquisire la stessa storage identity mentre l'owner corrente è `active` o `unknown`.

L'authority non rende supportati più writer: impedisce che partano contemporaneamente.

## Strict mode futura

Una modalità strict opzionale per gli esiti non fatali della recovery è un hardening futuro, non default.

Comportamento proposto:

```txt
RECOVERY_STRICT=1
```

oppure opzione equivalente in `startServer`.

Con strict mode:

```txt
retryablePending > 0
oppure invalidJournal > 0
→ blocca listener
```

Non abilitarla come comportamento ordinario senza una valutazione dedicata. Questa opzione è distinta dalla writer authority, che è già una precondizione obbligatoria del bootstrap.

## Sicurezza del journal e dell'authority

Il journal non deve conservare:

```txt
cookie
token
authorization
header
credenziali
password
secret
browser
profile
network dump
payload raw
path locali da esporre pubblicamente
stack trace pubblici
dettagli filesystem pubblici
```

Il journal rifiuta record contenenti URL con query parameter sensibili, inclusi:

```txt
token
access_token
id_token
api_key
apikey
authorization
cookie
session
sessionid
password
secret
credential
signature
sig
```

Il valore non viene redatto e salvato: il record viene rifiutato come invalido.

È consentito soltanto lo schema aggregato e non sensibile:

```txt
diagnostics.networkCaptureSummary
```

I log pubblici dell'authority devono restare bounded e non devono esporre owner token, path personali, stack, URL, payload o dettagli raw degli errori.

## Confini

Questo documento non definisce:

```txt
schema completo delle timeline canoniche
schema completo delle history aggregate
contratti HTTP Match, Betfair o Evidence
comportamento UI
algoritmi Source Identity
algoritmi Market Reactions
validità tecnica dei campioni Betfair
scraper Python
network capture diagnostica
retention cache runtime
tracking session authority end-to-end
```

Le timeline e le history canoniche restano owner del documento principale storage.

Le API documentano solo l'esposizione pubblica read-only di `integrity`.

Evidence documenta l'effetto di `persistenceComplete` e il blocco cross-source.

## Verifica

Comandi mirati storage:

```txt
node --check backend/src/sofa/matchHistory/commitId.js
node --check backend/src/sofa/matchHistory/commitJournal.js
node --check backend/src/sofa/matchHistory/commitJournal/store.js
node --check backend/src/sofa/matchHistory/recovery.js

node backend/src/sofa/matchHistory/commitId.test.mjs
node backend/src/sofa/matchHistory/commitJournal/lifecycle.test.mjs
node backend/src/sofa/matchHistory/commitJournal/integrityStatus.test.mjs
node backend/src/sofa/matchHistory/commitJournal/payloadSafety.test.mjs
node backend/src/sofa/matchHistory/commitJournal/residualRecovery.test.mjs
node backend/src/sofa/matchHistory/commitJournal/filesystem.integration.test.mjs
node backend/src/sofa/matchHistory/recovery/basicRecovery.integration.test.mjs
node backend/src/sofa/matchHistory/recovery/completedTargetVerification.integration.test.mjs
node backend/src/sofa/matchHistory/recovery/invalidJournal.integration.test.mjs
node backend/src/sofa/matchHistory/recovery/retryAndFailure.integration.test.mjs
```

Controlli IMPL-015 eseguiti sul codice pubblicato:

```txt
node backend/src/runtime/matchHistoryWriterAuthority.test.mjs
→ 26 passati, 0 falliti

node backend/src/sofa/matchTracker.test.mjs
→ 10 passati, 0 falliti

node backend/src/server.test.mjs
→ 30 passati, 0 falliti
```

Verificare almeno:

```txt
commitId filename-safe
pending commit creato prima delle scritture canoniche
conflitto eventId/source bloccato
writer non-ok trattato come failure
history completata e timeline fallita resta partial
repair usa payload e target journalizzati
completed residual con target mancante riapre marker
invalidRecords diventano recovery_failed
invalidEntries non eseguono scritture
fixture residue condivise in commitJournalTestFixtures.mjs
removeCompletedCommit solo dopo documenti completati
payload sensibili rifiutati
read-only integrity senza side effect
acquire prima della recovery
secondo bootstrap bloccato prima di recovery e listener
release nei failure path del bootstrap
listener readiness prima della registrazione shutdown
tracker drain prima del release
segnali ripetuti idempotenti
force timeout senza release anticipato
drain fallito con authority retained
```

La validazione automatica non sostituisce una prova live/replay reale con failure operative, due processi backend reali concorrenti, riavvio del processo e filesystem non simulato.

## Documenti collegati

* [Timeline e history](./01-timelines-and-history.md)
* [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
* [Tracking live](../sofa/01-live-tracking.md)
* [API Match](../../api/01-match.md)
* [API Betfair](../../api/02-betfair.md)
* [API Evidence](../../api/03-evidence.md)
* [Validazione e rollback](../../operations/04-validation-and-rollback.md)
* [Retention e cleanup](../../operations/05-retention-and-cleanup.md)
