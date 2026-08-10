# Commit journal e recovery

Questo documento è l'owner del commit multi-documento e della recovery. La [writer authority](./05-writer-authority.md) possiede invece esclusività, acquisizione e rilascio del writer.

## Scopo

Definire intent persistito, marker, cleanup verificato, repair deterministico, integrity read-only e sicurezza del journal globale.

## Stato

Il journal coordina history e timeline senza renderne atomica la coppia a livello filesystem. Partial e failure restano osservabili e riparabili dal payload journalizzato.

## Responsabilità

Questo owner possiede lifecycle del record, marker, verifica dei target completati, repair, integrity e osservabilità bounded. Non decide la materialità dei documenti e non acquisisce la writer authority.

## Contratto

Il journal globale risiede in `backend/match_history/.pending_commits/`. Registra per `eventId + source` il `commitId`, i target, payload e metadata JSON-safe e i marker `completed` di history e timeline.

La sequenza è: pending journal, write history verificata, marker history, write timeline verificata, marker timeline, verifica semantica dei target e rimozione del journal.

## Lifecycle del commit

```text
pending
→ history completed
→ timeline completed
→ semantic target verification
→ cleanup
```

Una failure lascia il record disponibile per retry. Il marker descrive il passo completato, ma non sostituisce la verifica dell'artefatto sul filesystem.

```text
completed.history = true
completed.timeline = true
→ non basta per il cleanup
→ rilettura dei due target
→ validazione semantica contro i payload journalizzati
→ solo allora rimozione del record
```

```text
target assente o divergente
→ marker corrispondente riaperto
→ record conservato
→ recovery dal payload journalizzato
```

## Cleanup completed residual

Bootstrap, Sofa e Betfair usano la stessa primitive `verifyAndCleanupCompletedCommit()`. La rimozione è consentita soltanto se entrambi i target:

- sono leggibili e JSON validi;
- hanno la shape canonica prevista;
- corrispondono a `eventId`, source e tipo di documento;
- coincidono con l'artefatto journalizzato.

Un target mancante o divergente riapre il relativo marker e conserva il journal per repair. Un errore di riapertura o cleanup resta osservabile.

La verifica non si limita a `JSON.parse`: controlla tipo del documento, source, `eventId`, `commitId` e corrispondenza con payload e metadata journalizzati. La stessa primitive è usata da bootstrap, runtime SofaScore e runtime Betfair.

## Repair tipizzato

Prima di invocare un writer, `validateRepairPayload()` verifica documento, metadata, array `history`/`timeline`, `eventId` e source. Un payload JSON-safe ma semanticamente invalido non raggiunge la persistenza canonica.

Il repair usa esclusivamente payload, metadata, target e `commitId` journalizzati. Gli errori operativi restano retryable; `recovery_failed` è riservato a record strutturalmente identificabili ma non recuperabili senza intervento. Non viene resa permanente una singola failure transitoria.

Il writer result viene verificato prima di avanzare il marker: target e `commitId` devono coincidere con il record. Un writer non può deviare il repair verso un altro file.

## Integrity read-only

Gli stati sono `no_known_partial`, `partial_persistence`, `recovery_failed` e `integrity_unavailable`. Quest'ultimo copre scansione, directory o journal invalidi: una lettura fallita non può apparire come assenza di partial. La lettura non crea directory e non scrive record.

Record invalidi o non leggibili degradano l'integrity anche se nessun partial valido è stato enumerato. Le API possono esporre code e reason bounded, mai payload o path del journal.

## Recovery e retry

Il bootstrap esegue recovery soltanto dopo l'acquisizione della writer authority. Gli errori operativi mantengono il record retryable; `recovery_failed` richiede una classificazione deterministica e non viene assegnato dopo un singolo errore transitorio.

Il summary di bootstrap espone soltanto conteggi: scanned, recovered, cleaned, retryable pending, recovery failed e invalid journal. Severity e messaggio distinguono recupero completo, residui e degradazione.

```text
writer authority acquisita
→ scan journal
→ validazione record
→ cleanup verified oppure repair
→ summary bounded
→ avvio listener/tracking
```

## Commit ID

I nuovi ID sono canonici: `source-UUID`. Il recovery distingue `canonical`, `accepted_legacy` e `invalid`: gli ID storici filename-safe restano leggibili, ma non sono il formato generato per nuovi commit.

La compatibilità degli ID legacy è read/recovery-only: non autorizza nuovi producer a generarli.

## Sicurezza

Il payload deve essere JSON-safe e privo di chiavi sensibili, query parameter segreti, bearer token, JWT e private key in stringhe diagnostiche. Sono ammessi soltanto aggregati bounded come `diagnostics.networkCaptureSummary`.

I log di bootstrap espongono soltanto conteggi bounded: scanned, recovered, cleaned, retryablePending, recoveryFailed e invalidJournal. Non includono payload, target, path personali o commit details.

La sicurezza non dipende soltanto dal nome della chiave. Stringhe diagnostiche vengono controllate per URL con query sensibili, bearer token, JWT e blocchi private-key anche quando annidate sotto chiavi neutre.

## Riferimenti implementativi

| Responsabilità    | Implementazione                                                   |
| ----------------- | ----------------------------------------------------------------- |
| lifecycle journal | `backend/src/sofa/matchHistory/commitJournal/`                    |
| integrity         | `backend/src/sofa/matchHistory/commitJournal/integrity.js`        |
| recovery          | `backend/src/sofa/matchHistory/recovery/`                         |
| commit SofaScore  | `backend/src/sofa/matchHistory/sofaUpdates/journalWorkflow.js`    |
| commit Betfair    | `backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js` |

### Record logico

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

Questa è la shape iniziale prodotta da `makePersistedRecord()`. I consumer devono comunque usare factory e validator reali, non costruire record copiando l'esempio.

### Matrice recovery

| Record/target                   | Azione                                 |
| ------------------------------- | -------------------------------------- |
| entrambi verificati             | cleanup verified                       |
| un target mancante              | riapertura marker e repair             |
| target divergente               | record preservato, integrity degradata |
| payload semanticamente invalido | nessun writer invocato                 |
| errore operativo transitorio    | retryable                              |
| store non leggibile             | `integrity_unavailable`                |

## Verifica

Eseguire dalla cartella `backend/src` almeno:

```powershell
node sofa/matchHistory/commitJournal/lifecycle.test.mjs
node sofa/matchHistory/commitJournal/integrityStatus.test.mjs
node sofa/matchHistory/commitJournal/payloadSafety.test.mjs
node sofa/matchHistory/commitJournal/residualRecovery.test.mjs
node sofa/matchHistory/recovery/retryAndFailure.integration.test.mjs
```

Gli esiti di una run appartengono a un artifact di validazione datato; questo documento elenca il contratto, non conserva conteggi storici copiati.

## Confini

Il journal non è una fonte dati applicativa, non avvia recovery senza writer authority e non espone payload o target tramite API pubbliche. Retention e cleanup non eliminano pending commit.

## Documenti collegati

- [Timeline e history](./01-timelines-and-history.md)
- [Persistenza SofaScore](./03-sofa-persistence.md)
- [Persistenza Betfair](./04-betfair-persistence.md)
- [Writer authority](./05-writer-authority.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
- [Runtime locale](../../operations/01-local-runtime.md)
- [Retention e cleanup](../../operations/05-retention-and-cleanup.md)
- [Validazione commit journal](../../../validations/commit-journal-hardening-2026-08-10.md)
