# Tennis Decision UI — Storage, documenti canonici e recovery

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-019…021
> **Righe originali:** 1374–1777
> **Parte precedente:** [Runtime e acquisizione Betfair](02-runtime-betfair.md)
> **Parte successiva:** [Evidence, provenance e confronti temporali](04-evidence-provenance.md)

<!-- BEGIN ORIGINAL CONTENT -->
## 18. Implementazioni approvate dal Punto 4

### IMPL-019 — Event persistence authority

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-015`, `IMPL-006`, journal SofaScore/Betfair

### Problema

La history aggregata appartiene all’evento, ma il journal autorizza i pending per source.

La combinazione permette a un payload journalizzato SofaScore di essere riprodotto dopo un commit Betfair più recente, o viceversa, sovrascrivendo lo shared history con una base obsoleta.

### Autorità minima

```txt
eventPersistenceId
repositoryWriterId
trackingSessionId o null
eventId
commitId
source: sofa | betfair
state: preparing | pending | writing | verifying | complete | failed
historyTarget
timelineTarget
expectedBaseRevision
createdAt
```

### Regole

- un solo commit canonico attivo per evento;
- il lock è event-scoped, non source-scoped;
- qualsiasi pending che coinvolge la shared history blocca entrambe le source;
- la base del documento viene verificata prima di preparare il nuovo payload;
- la source resta metadato del commit, non autorità esclusiva sul target aggregato;
- un callback stale non acquisisce l’autorità;
- una sessione nuova non bypassa un partial precedente;
- un commit non autorizzato non aggiorna mappe runtime;
- release soltanto da parte dell’owner corrente;
- unknown/failure fail-closed.

### Sequenza

```txt
session authority valida
→ acquire event persistence authority
→ resolve pending/recovery
→ read verified base revision
→ prepare documents
→ create journal
→ write e verify
→ publish committed runtime state
→ release event authority
```

### Relazioni

```txt
IMPL-015
→ esclusione fra backend processi

IMPL-019
→ esclusione fra commit dello stesso evento dentro il backend

IMPL-006
→ autorizzazione della callback/sessione

IMPL-016
→ ownership del runtime Betfair
```

### Test minimi

```txt
TEST-019
TEST-020
TEST-025
```

---

### IMPL-020 — Canonical document contract e verified recovery

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-019`, history/timeline store, commit journal

### Contratto documento

Ogni documento canonico dichiara:

```txt
documentType: match_history | sofa_timeline | betfair_timeline
schemaVersion
eventId
source: aggregate | sofa | betfair
revision
headCommitId
createdAt
updatedAt
metadata
```

### Identità dei tick e compatibilità con dataset derivati

Il contratto canonico deve consentire a ogni tick di essere riferito senza dipendere dalla sua posizione corrente nell’array.

Identità minima richiesta:

```txt
sourceTickId
sourceSequence
source
eventId
acquiredAt
recordedAt
trackingSessionId o null
sourceEpoch o null
```

`sourceTickId` è immutabile nell’ambito di evento e source. `sourceSequence` ordina i tick della singola timeline e non viene riutilizzato.

Il contratto deve preservare informazioni sufficienti a:

* allineare SofaScore e Betfair senza fondere le timeline canoniche;
* distinguere tempo di acquisizione e tempo di registrazione;
* ricostruire un dataset cross-source con una policy versionata;
* riferire i tick originali da grafici, replay e dataset di backtesting;
* impedire l’uso di dati successivi al cursore storico.

`fieldStateId` e le relazioni cross-source restano dati derivati. Non diventano una foreign key scritta automaticamente dentro entrambe le timeline live.

### Contratto journal

Ogni target contiene:

```txt
target
payload
payloadDigest
expectedBaseRevision
completed
verifiedAt o null
```

Il digest usa un algoritmo stabile documentato e coperto da fixture; non deve dipendere dall’ordine accidentale delle chiavi.

### Read contract

```txt
found
missing
invalid_json
invalid_schema
read_failed
ambiguous
```

Ogni esito contiene almeno:

```txt
ok
status
reason
eventId
source
target
revision
headCommitId
```

### Verified recovery

Per ogni documento, anche quando `completed:true`:

```txt
resolve confined target
→ read
→ validate schema/identity
→ validate revision/head commit
→ validate digest
→ valid: preserve
→ invalid: mark incomplete e rewrite
```

Il journal viene rimosso soltanto quando entrambi i target sono verificati.

### Discovery e migrazione

Regola immediata:

```txt
0 target → missing
1 target → canonical
>1 target → ambiguous_storage
```

Target futuri deterministici:

```txt
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

Migrazione:

- scan read-only;
- manifest legacy → canonical;
- conflitti bloccanti;
- copia/rename atomico dopo verifica;
- nessuna eliminazione prima del confronto digest;
- rollback definito;
- metadata leggibili conservati dentro il documento.

### Security boundary

- eventId numerico e bounded;
- root confinement su ogni target;
- target del journal verificato nuovamente durante recovery;
- nessun path esterno anche se presente in un journal manipolato;
- writer raw non pubblici.

### Compatibilità

La prima task può introdurre reader compatibili con legacy e nuovo schema.

Non è autorizzato:

- riscrivere automaticamente tutti i file runtime durante il primo startup;
- scegliere uno dei duplicati;
- dichiarare sano un documento soltanto perché parseabile;
- trasformare subito lo shared history in un read model derivato.

### Test minimi

```txt
TEST-021
TEST-022
TEST-024
TEST-026
TEST-027
TEST-028
TEST-029
```

---

### IMPL-021 — Recovery control plane

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** alta
**Dipendenze:** `IMPL-015`, `IMPL-019`, `IMPL-020`, runtime logger, `IMPL-009`

### Problema

Il bootstrap distingue fatal/non-fatal ma non espone un’autorità persistente e interrogabile per:

- invalid journal non attribuibili;
- pending retryable;
- tentativi eseguiti;
- escalation;
- writer block;
- rearm.

### Stato globale minimo

```txt
status:
  healthy
  recovering
  partial
  recovery_failed
  integrity_unknown
writersAllowed
pendingCount
failedCount
invalidJournalCount
lastRecoveryAt
outcomes
```

Gli outcomes pubblici sono bounded e allow-list. Path e payload restano nei log interni redatti.

### Stato per record

```txt
attemptCount
lastAttemptAt
lastFailureReason
lastFailedDocument
recoveryState:
  pending
  retryable
  failed
  rearmed
```

### Policy

- recovery bootstrap prima del listen;
- invalid journal non attribuibile → `integrity_unknown`, writer globali bloccati;
- partial attribuibile → writer dell’evento bloccati;
- errore temporaneo → retry bounded;
- soglia o errore permanente → `recovery_failed`;
- nessun retry ad ogni tick;
- rearm soltanto tramite comando locale esplicito, dopo verifica del target o del journal;
- nessuna cancellazione automatica;
- summary bootstrap reale nel log;
- il backend può restare read-only quando la lettura è sicura.

### API/UI future

Il control plane locale potrà esporre una lettura:

```txt
GET /api/runtime/storage-integrity
```

La mutazione di rearm, se introdotta, sarà:

- POST JSON;
- protetta da `IMPL-017`;
- commandId obbligatorio;
- idempotente;
- non disponibile da origini esterne.

`IMPL-009` traduce lo stato in:

```txt
stato locale nel settore coinvolto
+ indicatore globale sidebar
+ modale di dettaglio
```

Non fondere storage integrity con Betfair health, Source Identity o freshness.

### Test minimi

```txt
TEST-023
TEST-030
```

---

## 18.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-008 — Harness persistence/recovery

Aggiungere fixture per:

- pending cross-source sullo shared history;
- target marked complete ma mancante;
- digest errato;
- journal non attribuibile;
- duplicati dello stesso evento;
- retry/escalation/rearm.

### Estensione di IMPL-009 — Adapter frontend persistence

Aggiungere:

```txt
integrity_unknown
writersAllowed
aggregateHistoryIntegrity
documentReadStatus
recovery attempt state
```

### Estensione di IMPL-013 — Baseline storage

Misurare:

- dimensione history/timeline;
- byte del journal;
- durata stringify/write/rename;
- byte totali per partita;
- differenza atomicità/durabilità;
- eventuale costo di fsync configurabile.

Nessuna evoluzione del formato prima di questa baseline.

## 18.2 Ordine approvato

```txt
IMPL-015
→ IMPL-019
→ IMPL-020
→ IMPL-021
→ TEST-019…030
→ IMPL-009
→ IMPL-013
→ evoluzione storage soltanto se misurata
```

---

<!-- END ORIGINAL CONTENT -->
