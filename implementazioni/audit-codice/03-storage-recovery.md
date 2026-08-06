> **Parte 3 di 7 — Storage, journal e recovery**
> Secondo audit — Punto 4: history condivisa, timeline, commit journal, recovery, authority event-scoped, contratti documento e writer raw.
> [Indice](../03-audit-codice.md) · [Parte 2](02-runtime-sessioni-betfair.md) · [Parte 4](04-evidence-market-reactions.md)

## 19. Secondo audit del codice — Punto 4: storage, journal e recovery

**Baseline:** `d797d0ee9ec70d4b2f85f6aa51b91af8f71227a1`
**Stato:** `COMPLETATO E APPROVATO`

### Perimetro letto

Sono stati verificati:

```txt
backend/src/server.js
backend/src/sofa/matchHistory.js
backend/src/sofa/timelineStore.js
backend/src/sofa/matchTracker.js
backend/src/sofa/trackerUpdate.js
backend/src/sofa/matchHistory/storage.js
backend/src/sofa/matchHistory/commitId.js
backend/src/sofa/matchHistory/commitJournal.js
backend/src/sofa/matchHistory/commitJournal/store.js
backend/src/sofa/matchHistory/commitJournal/filesystemStore.js
backend/src/sofa/matchHistory/commitJournal/recordSchema.js
backend/src/sofa/matchHistory/commitJournal/recordValidation.js
backend/src/sofa/matchHistory/commitJournal/recordFactory.js
backend/src/sofa/matchHistory/commitJournal/recoveryScanner.js
backend/src/sofa/matchHistory/commitJournal/integrity.js
backend/src/sofa/matchHistory/recovery.js
backend/src/sofa/matchHistory/sofaUpdates/handler.js
backend/src/sofa/matchHistory/sofaUpdates/journalWorkflow.js
backend/src/sofa/matchHistory/sofaUpdates/recovery.js
backend/src/sofa/matchHistory/sofaUpdates/historyDocument.js
backend/src/sofa/matchHistory/sofaUpdates/timelineDocument.js
backend/src/sofa/matchHistory/betfairUpdates.js
backend/src/sofa/betfair/processor/persistenceDocuments.js
backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js
backend/src/sofa/betfair/processor/journalRecovery.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js
backend/src/routes/match/readResponses.js
test collegati già presenti nel repository
```

L’analisi è statica. Le suite non sono state rieseguite in questo checkpoint.

### Parti confermate come solide

#### Scrittura atomica del singolo file

History, timeline, journal e archivio delle conferme Source Identity usano il modello:

```txt
file temporaneo
→ scrittura JSON completa
→ rename sul target
→ cleanup del temporaneo in caso di errore
```

Questa proprietà protegge il singolo file da una normale scrittura parziale del processo e va preservata.

#### Ordine journalizzato dei commit canonici

SofaScore e Betfair seguono entrambi:

```txt
preparazione history e timeline
→ journal pending con i due payload
→ write history
→ mark history complete
→ write timeline
→ mark timeline complete
→ remove journal
```

Il payload di riparazione viene quindi persistito prima dei due target canonici.

#### Recovery prima del listen

Il bootstrap esegue `runPendingCommitRecovery(...)` prima di aprire la porta HTTP.

Il Punto 1 aggiunge il vincolo ulteriore:

```txt
writer authority
→ recovery
→ listen
```

La recovery non deve essere spostata dopo il listen.

#### Schema journal conservativo

Il journal verifica:

- source ed eventId;
- commitId compatibile con filename;
- struttura history/timeline;
- valori JSON finiti;
- assenza di concetti sensibili nelle chiavi;
- query sensibili;
- network capture limitata a summary allow-list.

Queste difese restano valide e devono essere mantenute nella futura evoluzione dello schema.

#### Integrity dei pending validi

Quando esiste un record journal valido e attivo, il sistema distingue:

```txt
partial_persistence
recovery_failed
no_known_partial
```

ed espone source, commitId e documenti coinvolti.

Il limite è che questo stato descrive soltanto i partial riconosciuti dal journal valido e non dimostra da solo la salute dei documenti canonici.

### STORAGE-001 — Autorità source-scoped su una history event-scoped

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** shared history, journal SofaScore/Betfair e recovery

La history aggregata è un solo documento per evento.

SofaScore e Betfair:

- leggono l’intero documento;
- costruiscono una nuova copia;
- aggiungono la propria riga;
- riscrivono il documento completo.

Il journal blocca invece i pending per:

```txt
eventId + source
```

Un pending SofaScore non blocca quindi automaticamente un commit Betfair dello stesso evento e viceversa.

#### Scenario di lost update

```txt
history H0

Sofa prepara H0 + S1
→ journal Sofa pending
→ write history fallisce

Betfair non vede pending Betfair
→ legge H0
→ scrive H0 + B1

retry/recovery Sofa
→ riproduce payload H0 + S1
→ B1 viene perso
```

Il rename atomico non risolve questo scenario: il problema è la base obsoleta del documento completo.

#### Decisione approvata

```txt
qualsiasi pending che coinvolge la shared history
→ blocca nuovi commit SofaScore e Betfair dello stesso evento
```

Prima di preparare un nuovo documento:

```txt
find active event commit
→ recover/resolve
→ verify current revision
→ prepare next commit
```

La struttura è registrata come `IMPL-019`.

### STORAGE-002 — I flag completed dei record parziali vengono considerati sufficienti

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** bootstrap recovery e repair SofaScore/Betfair

La recovery verifica entrambi i target quando il record dichiara history e timeline complete.

Quando il record è parziale, per esempio:

```txt
history.completed = true
timeline.completed = false
```

il repair si fida del flag history, salta la verifica e tenta soltanto la timeline.

Scenario:

```txt
history marked complete
→ history cancellata o corrotta
→ timeline ancora pending
→ restart
→ timeline riparata
→ journal rimosso
→ history assente o invalida
```

#### Decisione approvata

Ogni documento marcato complete deve essere verificato indipendentemente dallo stato dell’altro.

```txt
completed:true
→ verify target
→ target non valido
→ mark incomplete
→ rewrite dal payload
→ verify nuovamente
```

### STORAGE-003 — La verifica target prova soltanto JSON.parse

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** critica
**Area:** target verification

Il controllo attuale accetta come sano qualsiasi file leggibile e parseabile come JSON.

Non dimostra:

- tipo del documento;
- schema;
- eventId;
- source o natura aggregate;
- revisione;
- head commit;
- corrispondenza con il payload journalizzato.

Un oggetto JSON valido ma estraneo può quindi soddisfare la verifica.

#### Decisione approvata

Il contratto minimo dei documenti canonici deve includere:

```txt
documentType
schemaVersion
eventId
source: sofa | betfair | aggregate
revision
headCommitId
createdAt
updatedAt
```

Il journal deve aggiungere:

```txt
payloadDigest
expectedBaseRevision
```

La recovery accetta il target soltanto dopo la verifica di identità, schema, revisione e digest.

La struttura è registrata come `IMPL-020`.

### STORAGE-004 — Journal invalido non attribuibile nascosto dall’integrity

**Stato:** `CONFERMATO; POLICY APPROVATA`
**Priorità:** critica
**Area:** journal scanner, bootstrap e integrity globale

Lo scanner distingue:

```txt
record valido
record invalido ma identificabile
entry invalida non attribuibile
```

Le entry non attribuibili:

- vengono contate nel summary;
- non possiedono eventId/source affidabili;
- non entrano nell’integrity della partita;
- non rendono necessariamente fatal il bootstrap;
- possono coesistere con `no_known_partial`.

Inoltre il bootstrap registra oggi `recovery_complete` con `ok:true` per ogni risultato non fatal, senza riportare nel log principale pending, invalid journal o recovery failure.

#### Decisione approvata

Un journal invalido non attribuibile produce:

```txt
storage status: integrity_unknown
writersAllowed: false
readersAllowed: true
```

Il backend può offrire letture già disponibili, ma nessun nuovo writer canonico parte finché il residuo non viene classificato o rimosso tramite procedura esplicita.

Non sono consentite:

- cancellazione automatica silenziosa;
- quarantena che riabilita subito i writer senza verifica;
- interpretazione come `no_known_partial`.

La struttura è registrata come `IMPL-021`.

### SECURITY-006 — EventId e target non sono confinati dallo Storage

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** filename, journal target e writer

Gli helper Storage e journal accettano come eventId qualsiasi stringa non vuota.

Il normale Start SofaScore produce un ID numerico, ma lo Storage non deve affidarsi soltanto alla route chiamante o all’endpoint legacy `/api/betfair/odds` destinato alla rimozione.

#### Decisione approvata

Lo Storage impone autonomamente:

```txt
eventId canonico numerico
→ regex condivisa e bounded
```

Ogni target viene verificato con:

```txt
storageRoot = path.resolve(root)
target = path.resolve(candidate)
path.relative(storageRoot, target)
→ target obbligatoriamente interno alla root
```

Sono rifiutati:

- path assoluti esterni;
- traversal;
- target appartenenti a root differenti;
- eventId non canonici.

### STORAGE-005 — L’endpoint shared history usa soltanto integrity SofaScore

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** `buildMatchHistoryResponse`

La history è condivisa, ma l’endpoint consulta soltanto:

```txt
getMatchPersistenceIntegrity(eventId, 'sofa')
```

Un pending Betfair può coinvolgere lo stesso documento senza apparire nello stato della response history.

#### Decisione approvata

La shared history usa un’integrity aggregata per evento:

```txt
Sofa journal
+ Betfair journal
+ invalid journal globale
+ document read status
→ aggregate history integrity
```

Lo stato aggregato non sostituisce le due integrity source-specific delle timeline.

### STORAGE-006 — Stato runtime cross-source pubblicato prima del commit

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** `latestSofaState`, `latestBetfairState` e history aggregata

SofaScore aggiorna `latestSofaState` prima di completare il commit.

Betfair aggiorna `latestBetfairState` durante la preparazione, prima della creazione e del completamento del journal.

Queste mappe vengono poi lette dall’altra source per creare righe aggregate.

Scenario:

```txt
campione Betfair pubblicato in memoria
→ commit Betfair fallisce
→ successivo commit Sofa usa quel Betfair
→ history contiene uno stato mai diventato canonico
```

#### Decisione approvata

```txt
prepare candidate state
→ complete canonical commit
→ publish committed state
```

Al bootstrap le mappe vengono ricostruite dai documenti canonici verificati.

Ogni riga cross-source deve poter dichiarare:

```txt
rowCommitId
sofaCommitId o null
betfairCommitId o null
```

Nessun dato non commit-tato può diventare input canonico dell’altra source.

### STORAGE-007 — Letture mancanti, corrotte e illeggibili collassano nello stesso null

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** history/timeline read contract e API

History possiede internamente alcuni stati strutturati, ma le route usano una facade che riduce l’esito a documento o `null`.

Timeline restituisce `null` sia per:

- file assente;
- JSON corrotto;
- errore I/O.

Una proprietà `timeline` non array viene trasformata silenziosamente in `[]`.

#### Decisione approvata

History e timeline condividono il contratto:

```txt
found
missing
invalid_json
invalid_schema
read_failed
ambiguous
```

Le API distinguono:

```txt
404
→ documento realmente mancante/non ancora creato

409 storage_integrity
→ corrotto, schema invalido, ambiguo o incoerente
```

`no_known_partial` significa soltanto assenza di partial journal conosciuti; non certifica la salute del file.

### STORAGE-008 — Duplicati dello stesso evento risolti con sort()[0]

**Stato:** `CONFERMATO; CORREZIONE APPROVATA`
**Priorità:** alta
**Area:** discovery history/timeline

History e timeline filtrano i filename compatibili e selezionano il primo in ordine lessicografico.

Con più file dello stesso eventId:

- non viene segnalata ambiguità;
- un documento viene scelto arbitrariamente;
- gli altri diventano residui nascosti;
- future scritture possono proseguire sul target sbagliato.

#### Decisione approvata

```txt
0 match → missing/nuovo target
1 match → canonical
più match → ambiguous_storage
→ writer bloccati
```

A medio termine i target devono diventare deterministici:

```txt
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

Torneo, data e giocatori restano nei metadata.

La migrazione dei file legacy sarà non distruttiva e separata dalla prima correzione di authority.

### STORAGE-009 — Nessuna policy persistita dei tentativi di recovery

**Stato:** `CONFERMATO COME STRUTTURA ASSENTE; POLICY APPROVATA`
**Priorità:** medio-alta
**Area:** recovery state machine

I repair falliti vengono spesso classificati come `retryable_pending`, ma il record non conserva:

- numero dei tentativi;
- ultima data;
- reason dell’ultimo fallimento;
- documento coinvolto;
- soglia di escalation;
- stato di rearm.

`recovery_failed` non deriva oggi da una policy completa sui tentativi esauriti.

#### Decisione approvata

Il record conserva:

```txt
attemptCount
lastAttemptAt
lastFailureReason
lastFailedDocument
recoveryState
```

Policy:

```txt
errore classificato temporaneo
→ retry controllato al bootstrap o su comando esplicito

soglia esaurita / errore permanente
→ recovery_failed
→ writers bloccati per l’evento o globalmente quando non attribuibile

correzione esterna verificata
→ rearm manuale
→ nuovo tentativo tracciato
```

Nessun retry aggressivo ad ogni tick.

### STORAGE-010 — Amplificazione full-document per ogni tick

**Stato:** `CONFERMATO COME LIMITE STRUTTURALE`
**Priorità:** media, da misurare
**Area:** timeline/history e payload journal

Ogni aggiornamento:

- clona l’intera timeline;
- aggiunge un tick;
- prepara l’intera history;
- salva nel journal una copia completa dei due documenti;
- riscrive entrambi i target completi.

Il numero di byte serializzati e scritti cresce con la durata della partita.

#### Decisione approvata

Nessun cambio immediato verso NDJSON, segmenti o database.

Prima si estende `IMPL-013` con:

```txt
dimensione history/timeline
byte journal
stringify duration
journal write duration
target write duration
rename duration
tick count
byte totali scritti per partita
```

Solo dopo la baseline si valuteranno:

- segmenti append-only;
- checkpoint;
- manifest;
- compattazione offline;
- database embedded.

I dati canonici necessari al futuro backtesting non entrano in una retention distruttiva.

### STORAGE-011 — Atomicità del processo distinta dalla durabilità power-loss

**Stato:** `LIMITE CONFERMATO DA DOCUMENTARE E MISURARE`
**Priorità:** media
**Area:** filesystem durability

Le scritture usano rename atomico, ma non è dimostrato un contratto di:

```txt
fsync file
fsync directory
```

Il progetto può quindi dichiarare atomicità rispetto al processo, non durabilità garantita contro perdita improvvisa di alimentazione o crash del sistema operativo.

#### Decisione approvata

Non introdurre `fsync` su ogni tick senza benchmark.

La documentazione e la baseline devono distinguere:

```txt
atomicità process-level
≠
durabilità power-loss
```

Un eventuale livello durable sarà configurabile e misurato.

### STORAGE-012 — Writer diretti non journalizzati ancora esportati

**Stato:** `CONFERMATO COME SUPERFICIE DA CHIUDERE`
**Priorità:** medio-alta
**Area:** facade Storage e timeline

Restano esportati writer come:

```txt
saveHistory
saveTimeline
writeTimelineDocument
```

I percorsi runtime canonici analizzati usano il commit journalizzato, ma l’API interna lascia ancora possibile un consumer futuro o legacy non protetto.

#### Decisione approvata

Prima della rimozione:

```txt
inventario finale consumer
→ classificazione runtime/test/recovery
→ adapter espliciti per recovery
→ writer canonici accessibili soltanto dall’autorità persistence
```

Dopo l’inventario:

- rimuovere export inutilizzati;
- rendere interni i writer raw;
- separare chiaramente writer canonico, repair writer e helper test;
- impedire nuovi consumer non journalizzati.

### Store delle conferme Source Identity

Lo store delle conferme resta separato dal journal history/timeline.

Motivi:

- non è persistenza canonica della partita;
- possiede schema e lifecycle differenti;
- la corruzione non deve essere fusa con un commit cross-documento.

Deve però rispettare:

```txt
IMPL-015 backend writer authority
→ un solo processo writer

read failure
→ stato store_unavailable visibile

write
→ atomic rename preservato
```

Non viene introdotto un secondo journal per questo archivio.

### Implementazioni risultanti

#### Sintesi IMPL-019 — Event persistence authority

```txt
shared history event-scoped
→ un solo commit attivo per evento
→ source dichiarata ma non usata come lock esclusivo
→ expected base revision
→ pending cross-source bloccante
```

#### Sintesi IMPL-020 — Canonical document contract e verified recovery

```txt
schema + identity + revision + digest
→ letture strutturate
→ verifica completed
→ duplicate detection
→ path confinement
→ migrazione legacy non distruttiva
```

#### Sintesi IMPL-021 — Recovery control plane

```txt
summary bootstrap reale
→ global journal health
→ writersAllowed
→ retry metadata
→ recovery_failed
→ integrity_unknown
→ rearm esplicito
```

### Relazioni con strutture già registrate

```txt
IMPL-015
→ un solo backend writer per repository

IMPL-006
→ callback autorizzata dalla trackingSessionId

IMPL-016
→ comando Betfair proprietario del runtime browser

IMPL-008
→ harness offline per partial/recovery

IMPL-009
→ UI persistence locale + globale

IMPL-013
→ baseline dimensioni, latenza e durabilità
```

### Test mancanti

#### TEST-019 — Lost update cross-source

Pending Sofa con history fallita, commit Betfair successivo e retry Sofa non devono poter cancellare il commit Betfair.

#### TEST-020 — Pending cross-source sullo shared target

Due commit di source differenti sullo stesso evento non possono diventare entrambi attivi; il secondo viene bloccato o preceduto dalla recovery del primo.

#### TEST-021 — Verifica completed nei record parziali

History marked complete ma target mancante/corrotto con timeline pending deve riaprire e riscrivere history prima del cleanup.

#### TEST-022 — Target JSON valido ma identità/digest errati

Il journal non viene rimosso e il target non viene considerato verificato.

#### TEST-023 — Journal invalido non attribuibile

Il backend offre letture, blocca i writer e pubblica `integrity_unknown` senza cancellazione automatica.

#### TEST-024 — Aggregate integrity dello shared history

Un pending Betfair deve comparire nell’endpoint history condiviso; le timeline conservano integrity source-specific.

#### TEST-025 — Stato cross-source soltanto committed

Commit fallito non aggiorna latest state; bootstrap/recovery ricostruiscono le mappe dai documenti verificati.

#### TEST-026 — Read status distinti

Missing, invalid JSON, invalid schema, I/O failure e documento valido producono esiti separati e route coerenti.

#### TEST-027 — Duplicate event documents

Due file compatibili con lo stesso eventId producono `ambiguous_storage` e bloccano le scritture.

#### TEST-028 — EventId e target confinement

EventId non canonico, traversal e target esterno alla root vengono rifiutati da Storage e journal.

#### TEST-029 — Nessun consumer runtime dei writer raw

Inventario e test architetturale impediscono nuovi import canonici di writer non journalizzati.

#### TEST-030 — Retry ed escalation recovery

Attempt metadata, soglia, `recovery_failed`, writer block e rearm manuale devono essere deterministici e idempotenti.

### Decisioni approvate

1. qualsiasi pending dello shared history blocca commit SofaScore e Betfair dello stesso evento;
2. preservare per ora la shared history, senza trasformarla immediatamente in read model derivato;
3. verificare ogni documento marked complete anche nei record parziali;
4. introdurre schema, revisione, head commit e digest;
5. journal invalido non attribuibile → read-only `integrity_unknown`;
6. shared history → integrity aggregata SofaScore + Betfair + document health;
7. stato runtime cross-source pubblicato soltanto dopo commit e ricostruito al bootstrap;
8. distinguere missing, invalid JSON, invalid schema, I/O failure e ambiguity;
9. eventId canonico e target confinement come regole Storage;
10. più file dello stesso evento bloccano i writer;
11. nessun cambio formato full-document prima della baseline;
12. writer raw rimossi o resi interni dopo inventario consumer;
13. conferme Source Identity separate, atomiche e sotto backend writer authority;
14. retry recovery persistiti, escalation esplicita e rearm manuale verificato.

### Ordine tecnico risultante

```txt
IMPL-015 — backend writer authority
→ IMPL-019 — event persistence authority
→ IMPL-020 — document contract e verified recovery
→ IMPL-021 — recovery control plane
→ TEST-019…030
→ IMPL-009 — persistence UI
→ IMPL-013 — baseline storage
→ eventuale evoluzione del formato
```

---
