# Commit journal e recovery

Questo documento è l'owner del commit multi-documento tra history e timeline e della recovery deterministica. La [writer authority](./05-writer-authority.md) possiede invece l'esclusività process-level, l'acquisizione, il reclaim e il rilascio del writer.

## Scopo

Definire:

- l'intent persistito di un commit;
- i marker di completamento dei documenti;
- il cleanup ordinario e quello verificato dei completed residual;
- il repair fondato sui dati journalizzati;
- lo stato di persistence integrity in sola lettura;
- i vincoli di identità e sicurezza del journal globale.

## Stato e responsabilità

Il journal coordina history e timeline senza rendere atomica la coppia a livello filesystem. Ogni documento conserva il proprio writer canonico; il journal registra lo stato temporaneo necessario a rendere osservabile e recuperabile un commit rimasto incompleto.

Questo owner possiede lifecycle del record, marker, recovery scanner, verifica dei completed residual, repair, integrity e sicurezza del payload journalizzato. Non definisce gli schemi completi di history e timeline, non decide la materialità dei documenti e non acquisisce la writer authority.

## Collocazione e facade

Il journal globale risiede in:

```text
backend/match_history/.pending_commits/
```

`backend/src/sofa/matchHistory/commitJournal.js` è la facade pubblica. L'implementazione è suddivisa sotto `backend/src/sofa/matchHistory/commitJournal/` tra store, adapter filesystem, factory e validazione dei record, scanner recovery, integrity e helper di risultato.

Il journal registra, per `eventId` e `source`, il `commitId`, i target, i payload, i metadata e i marker `completed` di history e timeline. Le source ammesse sono `sofa` e `betfair`.

## Record persistito

La shape iniziale prodotta da `makePersistedRecord()` è:

```json
{
  "version": 1,
  "commitId": "sofa-<uuid>",
  "eventId": "<canonical event id>",
  "source": "sofa",
  "createdAt": "<ISO timestamp>",
  "status": "pending",
  "documents": {
    "history": {
      "target": "<bound target>",
      "payload": {},
      "completed": false
    },
    "timeline": {
      "target": "<bound target>",
      "payload": {},
      "completed": false
    }
  },
  "reason": null
}
```

L'esempio descrive la forma logica, ma i producer devono usare factory e validator reali. Un record `pending` ha `reason: null`; un record `recovery_failed` richiede una reason valida e bounded.

## Lifecycle del commit ordinario

Un nuovo commit segue questa sequenza:

```text
create pending journal
→ write history
→ verifica esito writer history
→ marker history completed
→ write timeline
→ verifica esito writer timeline
→ marker timeline completed
→ remove completed journal
```

Il writer result deve essere positivo e coerente con target e `commitId` attesi prima che il marker corrispondente avanzi. Un risultato assente, non positivo o riferito a un altro file o commit non equivale a successo.

Una failure prima del completamento di entrambi i documenti conserva il record. History completata e timeline fallita costituiscono una persistenza parziale osservabile. `removeCompletedCommit()` può rimuovere soltanto un record i cui due marker sono `true`; questa primitive non esegue da sola la verifica semantica dei target.

## Completed residual e cleanup verificato

Un record rimasto sul filesystem con entrambi i marker `completed: true` è un completed residual. Prima di eliminarlo in fase di riuso o recovery viene impiegata `verifyAndCleanupCompletedCommit()`.

La primitive verifica entrambi i descrittori e i rispettivi target. Con il verifier filesystem predefinito:

- il target deve essere leggibile e contenere JSON valido;
- se il payload journalizzato contiene un documento tipizzato, il documento effettivo deve avere metadata e array `history` o `timeline` coerenti;
- `eventId` e, per la timeline, `source` non possono divergere dal record;
- il documento riletto deve coincidere stabilmente con il documento journalizzato.

Un verifier iniettato può attestare direttamente il target restituendo un esito positivo; in questo caso il contratto della verifica appartiene alla dipendenza iniettata.

```text
completed.history = true
completed.timeline = true
→ verifica dei due target
→ entrambi verificati: cleanup
→ target non verificato: riapertura del marker corrispondente
→ record conservato per repair
```

Quando `createPendingCommit()` incontra un completed residual per la stessa coppia `eventId + source`, crea il nuovo record soltanto dopo il cleanup verificato del residuo. Se un target non è verificabile, riapre il marker pertinente, restituisce `pending_exists` e non avvia il nuovo commit.

I percorsi runtime SofaScore e Betfair cercano a loro volta completed residual e preferiscono `verifyAndCleanupCompletedCommit()` quando la primitive è disponibile.

## Recovery deterministica

La recovery usa esclusivamente informazioni già persistite nel journal:

```text
payload
metadata
target
commitId
marker completed
```

Non ricostruisce documenti da tracker, scraper, fetch live, Evidence, Source Identity o stato frontend. In base alla source delega a `repairSofaCommitFromJournal()` oppure `repairBetfairCommitFromJournal()`.

Per ogni documento con `completed !== true`, l'adapter:

1. valida il payload di repair;
2. invoca il writer canonico con `eventId`, documento, metadata, target e `commitId` journalizzati;
3. verifica il writer result rispetto a target e `commitId`;
4. marca il documento completed soltanto dopo una scrittura verificata;
5. rimuove il journal soltanto quando entrambi i marker sono completati.

`validateRepairPayload()` richiede un documento object con metadata object e l'array pertinente (`history` o `timeline`). Rifiuta inoltre un `metadata.eventId` divergente e, per la timeline, un `metadata.source` divergente. Un payload JSON-safe ma semanticamente inadatto al repair non raggiunge il writer.

## Recovery dei completed residual

Al bootstrap, un completed residual segue due percorsi equivalenti per obiettivo:

- senza verifier esterno, lo store esegue `verifyAndCleanupCompletedCommit()`; se la verifica fallisce, i marker non verificati vengono riaperti e il record ricaricato viene passato al repair;
- con `verifyDocumentTarget` iniettato nelle dipendenze di recovery, history e timeline vengono verificate tramite quella dipendenza; i marker dei target falliti vengono riaperti prima del repair.

Un target verificato non viene riscritto. Un target mancante o non valido viene riparato dal payload journalizzato. Una failure operativa del writer o del journal lascia il record retryable.

## Scanner e classificazione dei record

Lo scanner non tratta allo stesso modo ogni file `.json` presente nella directory.

### Record validi

Sono JSON parsabili, sicuri, coerenti con il filename e conformi allo schema persistito. I record `pending` sono candidati al cleanup verificato o al repair. I record già `recovery_failed` vengono conteggiati come tali e non vengono inviati nuovamente ai writer.

### Record invalidi identificabili

Sono record JSON sicuri con un `commitId` valido e filename coerente, ma non conformi allo schema persistito. Lo scanner li restituisce come `invalidRecords` con soli campi identificativi sanificati.

Se non sono già marcati, la recovery tenta:

```text
markRecoveryFailed(commitId, invalid_journal_structure)
```

Un esito positivo incrementa `recoveryFailed`; un fallimento della marcatura resta `retryablePending`. Nessun writer business viene invocato per questi record.

### Entry non identificabili

JSON non parsabile, record non sicuro, `commitId` non valido o filename incoerente producono `invalidEntries`. Non vengono modificati né passati al repair e incrementano `invalidJournal`. Possono non essere attribuibili in sicurezza a un evento o a una source.

## Retry, failure e summary di bootstrap

`runPendingCommitRecovery()` distingue una failure globale dello scanner dalle failure per record.

```text
scan assente o fatal
→ summary fatal

failure di repair, cleanup o journal su un singolo record
→ retryablePending
→ record conservato

record identificabile ma strutturalmente non recuperabile
→ recovery_failed con reason bounded, se la marcatura riesce
```

Una singola eccezione o failure operativa del repair non viene convertita automaticamente in `recovery_failed`: resta retryable. Il summary restituisce i conteggi `scanned`, `recovered`, `cleaned`, `retryablePending`, `recoveryFailed`, `alreadyRecoveryFailed` e `invalidJournal`, oltre a outcome interni sanificati.

Il bootstrap acquisisce la writer authority prima di eseguire la recovery. Una recovery `fatal` blocca il listener; gli esiti per-file non fatali vengono riepilogati e il bootstrap può proseguire.

```text
acquire writer authority
→ scan journal
→ classify records
→ verified cleanup oppure repair
→ bounded recovery summary
→ apertura listener
```

I log `recovery_complete` espongono soltanto campi bounded e conteggi; non includono payload, target o path del journal.

## Persistence integrity read-only

`getPersistenceIntegrityStatus(eventId, source)` legge il journal senza creare directory, scrivere record o avviare recovery.

Gli stati sono:

| Stato                   | Significato                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `no_known_partial`      | Nessun record attivo noto per l'evento e l'eventuale source richiesta.                                                             |
| `partial_persistence`   | È presente un record `pending` con almeno un documento incomplete.                                                                 |
| `recovery_failed`       | È presente un record attivo marcato `recovery_failed`.                                                                             |
| `integrity_unavailable` | La directory non è leggibile oppure almeno una entry del journal è invalida, quindi l'assenza di partial non può essere attestata. |

Per `partial_persistence`, la reason è `pending_commit`. Per `recovery_failed`, viene restituita la reason persistita. `affectedDocuments` contiene soltanto i marker ancora `false` tra `history` e `timeline`.

Se più record attivi corrispondono alla richiesta, la selezione è deterministica: prima i `recovery_failed`, poi `createdAt`, quindi `commitId`.

Un evento o una source di input non validi producono `no_known_partial` senza accesso mutativo. L'assenza della directory del journal equivale a nessun partial noto e non provoca la creazione della directory.

Questo owner definisce lo stato storage interno. API, Evidence e frontend possono adattarlo in sola lettura, ma i loro contratti pubblici appartengono ai rispettivi owner e non espongono payload o target journalizzati.

## Commit ID

`createCanonicalCommitId(source)` genera nuovi ID nel formato:

```text
sofa-<uuid>
betfair-<uuid>
```

La source deve essere `sofa` o `betfair`. Il risultato deve inoltre rispettare il vincolo filename-safe del journal.

In lettura e recovery, `classifyCommitId()` distingue:

| Classe            | Significato                                                    |
| ----------------- | -------------------------------------------------------------- |
| `canonical`       | ID `source-UUID` coerente con la source.                       |
| `accepted_legacy` | ID filename-safe valido, ma non nel formato canonico generato. |
| `invalid`         | ID non accettabile dal journal.                                |

La compatibilità legacy è limitata alla lettura e alla recovery; i nuovi producer devono usare il generatore canonico.

## Sicurezza e serializzabilità

Record, documenti e payload devono essere plain JSON, privi di cicli, valori non serializzabili e numeri non finiti. La validazione rifiuta inoltre chiavi riconducibili a cookie, token, header, authorization, credential, password, secret, browser, profile, network o capture.

Le stringhe vengono controllate anche quando annidate sotto chiavi neutre. Sono rifiutati:

- URL con query parameter sensibili;
- bearer token;
- stringhe con forma JWT;
- blocchi private-key.

L'eccezione consentita è `diagnostics.networkCaptureSummary`, ammessa soltanto sotto `diagnostics` e con schema esatto:

```text
enabled
response_count
json_count
errors_count
candidates_count
```

Il journal rifiuta il record: non redige e poi persiste valori sensibili. La JSON-safety non sostituisce la validazione semantica del documento né la verifica del target; sono tre livelli distinti.

## Riferimenti implementativi

| Responsabilità                    | Implementazione                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| facade journal                    | `backend/src/sofa/matchHistory/commitJournal.js`                                          |
| store e lifecycle                 | `backend/src/sofa/matchHistory/commitJournal/store.js`                                    |
| filesystem journal                | `backend/src/sofa/matchHistory/commitJournal/filesystemStore.js`                          |
| factory e schema                  | `backend/src/sofa/matchHistory/commitJournal/recordFactory.js`, `recordSchema.js`         |
| validazione record e repair       | `backend/src/sofa/matchHistory/commitJournal/recordValidation.js`                         |
| scanner recovery                  | `backend/src/sofa/matchHistory/commitJournal/recoveryScanner.js`                          |
| integrity                         | `backend/src/sofa/matchHistory/commitJournal/integrity.js`                                |
| orchestrazione bootstrap recovery | `backend/src/sofa/matchHistory/recovery.js`                                               |
| commit e repair SofaScore         | `backend/src/sofa/matchHistory/sofaUpdates/journalWorkflow.js`, `sofaUpdates/recovery.js` |
| commit e repair Betfair           | `backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js`, `journalRecovery.js`   |
| generazione commit ID             | `backend/src/sofa/matchHistory/commitId.js`                                               |

## Matrice recovery

| Record o target                                     | Azione corrente                                   |
| --------------------------------------------------- | ------------------------------------------------- |
| pending con documenti incomplete                    | repair dei soli documenti incomplete              |
| completed residual con entrambi i target verificati | cleanup                                           |
| completed residual con un target non verificato     | riapertura del marker e repair                    |
| writer result non coerente con target o `commitId`  | failure retryable, marker non avanzato            |
| payload di repair semanticamente invalido           | nessun writer invocato; failure retryable         |
| record invalido ma identificabile                   | tentativo di marcatura `recovery_failed`          |
| entry non identificabile                            | nessuna scrittura; conteggio `invalidJournal`     |
| directory journal non leggibile                     | recovery fatal; integrity `integrity_unavailable` |

## Verifica

Eseguire dalla root del repository:

```powershell
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

Gli esiti e i conteggi di una run appartengono a un artifact di validazione datato. Questo documento descrive il contratto corrente e non incorpora conteggi storici come garanzia permanente.

## Confini

Il journal non è una fonte dati applicativa, una cache o un sostituto di history e timeline. Non avvia autonomamente recovery senza la writer authority acquisita e non possiede il protocollo process-level della writer authority.

Questo documento non definisce:

- gli schemi completi dei documenti canonici;
- i contratti HTTP Match, Betfair o Evidence;
- il comportamento del frontend;
- gli algoritmi Source Identity o Market Reactions;
- scraper, network capture o retention delle cache runtime.

Retention e cleanup operativi non devono eliminare pending commit.

## Documenti collegati

- [Timeline e history](./01-timelines-and-history.md)
- [Persistenza SofaScore](./03-sofa-persistence.md)
- [Persistenza Betfair](./04-betfair-persistence.md)
- [Writer authority](./05-writer-authority.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
- [Runtime locale](../../operations/01-local-runtime.md)
- [Retention e cleanup](../../operations/05-retention-and-cleanup.md)
- [Validazione commit journal](../../../validations/commit-journal-hardening-2026-08-10.md)
