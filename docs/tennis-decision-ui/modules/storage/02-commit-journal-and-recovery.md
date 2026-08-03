# Commit journal e recovery

## Scopo

Questo documento definisce il coordinamento dei commit logici tra history e timeline.

History e timeline restano file canonici distinti e atomicamente riscritti per singolo file. Il journal non sostituisce questi file: registra lo stato temporaneo di un commit multi-documento e permette repair deterministico quando una scrittura resta incompleta.

```txt
backend/src/sofa/matchHistory/commitId.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/commitJournal/
backend/src/sofa/matchHistory/recovery.js
```

`commitJournal.js` resta la facade pubblica. I file sotto `commitJournal/` separano store, validazione record, adapter filesystem, scanner recovery, integrity read-only e helper di risultato.

## Stato

```txt
percorso ordinario live con commit completi
→ validato

partial_persistence reale controllata
→ da validare

recovery_failed reale
→ da validare

failure filesystem reale
→ da validare
```

Le regole di recovery, sicurezza e single-process restano invariate.

## Collocazione

I journal pending sono sidecar locali sotto:

```txt
backend/match_history/.pending_commits/
```

Non sono history, non sono timeline e non devono essere scoperti come file business.

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

Il bootstrap backend esegue la recovery prima dell’apertura del listener Express:

```txt
createApp()
→ runPendingCommitRecovery(...)
→ app.listen(...)
```

`createApp()` costruisce app, middleware e route senza avviare il listener.

`startServer(...)` esegue la recovery e apre il listener soltanto dopo il completamento del passaggio bootstrap.

Fatalità globale e failure per-file sono distinte:

```txt
fatal globale
→ blocca app.listen

errori per-file non fatali
→ non bloccano app.listen
```

Errori per-file non fatali includono:

```txt
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
```

Questa scelta mantiene il backend resiliente: un singolo journal problematico non impedisce l’avvio dell’intero backend.

## Invariant single-process

Il progetto assume un solo processo backend writer sulla stessa directory:

```txt
backend/match_history
```

Non sono supportati in questa fase:

```txt
due backend Node contemporanei sulla stessa match_history
PM2 cluster
repliche Docker sulla stessa directory
worker separati che scrivono direttamente match_history
trading engine separato che scrive file canonici
```

Il journal usa scritture atomiche per singolo file e controlli sui commit pendenti, ma non implementa ancora un lock cross-process.

Un lock cross-process sarà necessario solo se il progetto passerà a più writer sulla stessa `match_history`.

## Strict mode futura

Una modalità strict opzionale è un hardening futuro, non default.

Comportamento proposto:

```txt
RECOVERY_STRICT=1
```

oppure opzione equivalente in `startServer`.

Con strict mode:

```txt
retryablePending > 0
oppure invalidJournal > 0
→ blocca app.listen
```

Non abilitarla come comportamento ordinario senza una valutazione dedicata.

## Sicurezza del journal

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
```

Le timeline e le history canoniche restano owner del documento principale storage.

Le API documentano solo l’esposizione pubblica read-only di `integrity`.

Evidence documenta l’effetto di `persistenceComplete` e il blocco cross-source.

## Verifica

Comandi mirati:

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
single-process invariant preservato
```

La validazione locale non sostituisce una prova live/replay reale con failure operative, riavvio del processo e filesystem non simulato.

## Documenti collegati

* [Timeline e history](./01-timelines-and-history.md)
* [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
* [Tracking live](../sofa/01-live-tracking.md)
* [API Match](../../api/01-match.md)
* [API Betfair](../../api/02-betfair.md)
* [API Evidence](../../api/03-evidence.md)
* [Validazione e rollback](../../operations/04-validation-and-rollback.md)
* [Retention e cleanup](../../operations/05-retention-and-cleanup.md)
