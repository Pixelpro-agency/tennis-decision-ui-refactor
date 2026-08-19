> **Parte 3 di 7 — Storage, journal e recovery**

> Secondo audit — Punto 4: history condivisa, timeline, commit journal, recovery, authority dei writer e contratti di lettura.
> [Indice](../03-audit-codice.md) · [Parte 2](02-runtime-sessioni-betfair.md) · [Parte 4](04-evidence-market-reactions.md)

## 19. Secondo audit del codice — Punto 4: storage, journal e recovery

Questo modulo conserva la catena unitaria del secondo audit del Punto 4:

```txt
documenti canonici
→ journal
→ recovery
→ integrity
→ reader API
→ authority dei writer
```

Le decisioni approvate distinguono il comportamento corrente dai target non ancora presenti.

### Quadro sintetico

| Area                  | Comportamento corrente                                                                     | Confine ancora presente                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Writer authority      | authority esclusiva acquisita prima della recovery e del `listen`                          | non equivale a un lock event-scoped cross-source                                          |
| Scrittura file        | file temporaneo, JSON completo, rename e cleanup best effort                               | nessun contratto dichiarato di `fsync` file + directory                                   |
| Commit Sofa/Betfair   | journal pending prima dei due target; avanzamento dei flag e cleanup finale                | il coordinamento dei pending resta source-scoped                                          |
| Recovery bootstrap    | eseguita prima dell’apertura della porta HTTP                                              | i residui non fatal non producono un control plane globale dei writer                     |
| Target `completed`    | nei residual con entrambi i documenti `completed` i target vengono verificati e possono essere riaperti/riscritti se mancanti, illeggibili o incoerenti con il payload atteso; nei record parziali il target già `completed` non riceve la stessa riverifica esplicita prima del repair del documento incompleto | restano assenti la verifica uniforme dei target già `completed` nei record parziali e il contratto canonico completo con schema versionato, revision/head commit e digest persistito |
| Read contract interno | history e timeline distinguono missing, JSON invalido, read failure e ambiguità            | le route principali usano ancora facade che riducono questi esiti a documento o `null`    |
| Discovery             | più target compatibili producono errore di ambiguità                                       | i filename canonici restano descrittivi, non deterministici per solo eventId              |
| Integrity             | espone `partial_persistence`, `recovery_failed`, `no_known_partial` e fallback unavailable | la history condivisa consulta ancora l’integrity SofaScore, non un aggregato cross-source |
| Source Identity store | archivio separato e scrittura atomica                                                      | non fa parte del journal history/timeline                                                 |

## Proprietà correnti

### Authority del processo backend

Il bootstrap costruisce e acquisisce `matchHistoryWriterAuthority` prima di avviare la recovery. Se l’authority non viene acquisita in modo verificabile, il server non procede all’ascolto.

L’ordine effettivo è:

```txt
acquire writer authority
→ runPendingCommitRecovery(...)
→ rifiuto del bootstrap se recovery fatal
→ app.listen(...)
→ registrazione shutdown con rilascio authority
```

Il record di authority lega il proprietario a processo, istanza backend, repository e storage. Un secondo writer vivo viene bloccato; record malformati o non verificabili non vengono rimossi silenziosamente. Questa proprietà realizza l’authority di processo associata storicamente a `IMPL-015`, ma non introduce da sola serializzazione event-scoped tra le due source.

### Scrittura atomica del singolo file

History, timeline, journal e archivio delle conferme Source Identity adottano il modello:

```txt
file temporaneo
→ scrittura JSON completa
→ rename sul target
→ cleanup del temporaneo in caso di errore
```

Il contratto dei writer history/timeline restituisce esiti strutturati con stato, ragione, target e commitId. Il rename protegge dall’esposizione ordinaria di un file scritto solo in parte dal processo; non risolve conflitti tra riscritture complete basate su snapshot differenti.

### Commit journalizzato dei documenti canonici

I flussi SofaScore e Betfair preparano history e timeline, creano un record pending che contiene entrambi i payload e quindi avanzano i documenti in sequenza:

```txt
prepare history + timeline
→ create pending journal
→ write history
→ mark history complete
→ write timeline
→ mark timeline complete
→ verify and remove completed journal
```

Il payload necessario al repair viene quindi persistito prima dei due target. I writer verificano anche coerenza del risultato di scrittura, target e commitId prima di marcare il documento come completato.

### Recovery dei target completati

Nei residual con `history.completed = true` e `timeline.completed = true` i target vengono verificati; nei percorsi riconoscibili il verificatore corrente controlla anche la coerenza con il documento/payload atteso, non il solo parsing JSON. Se validi segue il cleanup; se mancanti, illeggibili o incoerenti vengono riaperti e riparati dal journal.

Nei record parziali, con un documento `completed` e uno `incomplete`, il percorso corrente ripara il documento incompleto ma non applica la stessa riverifica esplicita al target già marked `completed`. Questo residuo resta aperto in `TEST-021` / `STORAGE-002`.

Schema, revision e digest canonici completi non sono dichiarati presenti.
### Discovery e read result interni

History e timeline non scelgono più arbitrariamente `sort()[0]` quando esistono più file compatibili. La discovery restituisce un errore di target ambiguo e i writer falliscono in chiusura.

I loader strutturati distinguono almeno:

```txt
found
missing
invalid_json
invalid_shape / invalid_schema
read_failed
ambiguous_storage_target
```

Le facade compatibili `loadHistory(...)` e `loadTimeline(...)` continuano però a restituire documento oppure `null`. Di conseguenza la distinzione interna non è ancora propagata integralmente alle route.

### Integrity dei pending riconosciuti

Per un journal valido attribuibile a evento e source, l’integrity distingue:

```txt
partial_persistence
recovery_failed
no_known_partial
integrity_unavailable
```

e normalizza i documenti coinvolti a `history` e `timeline`. Le response aggiungono l’integrity ai documenti trovati; quando il documento manca, `partial_persistence` o `recovery_failed` producono HTTP `409` con `error: persistence_integrity`, mentre `no_known_partial` mantiene il `404`.

Il significato resta limitato: `no_known_partial` segnala l’assenza di un partial noto nel journal interrogato e non certifica la salute del documento canonico.

## Findings

### STORAGE-001 — History event-scoped e pending source-scoped

**Stato corrente:** `ANCORA PRESENTE`  
**Area:** shared history, journal SofaScore/Betfair e recovery

La history aggregata resta un solo documento per evento. Entrambe le source leggono il documento, costruiscono una nuova copia e lo riscrivono integralmente.

Il journal ricerca e blocca i pending tramite:

```txt
eventId + source
```

La creazione del pending filtra infatti i record esistenti per stesso eventId e stessa source. Un pending SofaScore non costituisce automaticamente un pending Betfair dello stesso evento.

Resta quindi rappresentativo lo scenario storico:

```txt
history H0

Sofa prepara H0 + S1
→ journal Sofa pending
→ write history fallisce

Betfair non vede pending Betfair
→ legge H0
→ scrive H0 + B1

recovery Sofa
→ riproduce H0 + S1
→ B1 può essere perso
```

Il target approvato resta sintetizzato in `IMPL-019`: un pending che coinvolge la shared history deve coordinare entrambi i writer dello stesso evento. Questo coordinamento non è presente.

### STORAGE-002 — Verifica dei documenti marked complete

**Stato corrente:** `PARZIALMENTE CORRETTO`

Nei residual con entrambi i documenti `completed`, i target vengono verificati e quelli problematici possono essere riaperti e riscritti dal payload del journal. Nei record parziali, invece, il target già marked `completed` non riceve la stessa riverifica esplicita prima del repair del documento `incomplete`; `TEST-021` resta quindi aperto.

Per il contratto canonico ancora incompleto si rimanda a `STORAGE-003`.
### STORAGE-003 — Verifica target ancora priva del contratto canonico versionato

**Stato corrente:** `PARZIALMENTE CORRETTO`
**Area:** target verification

Nei completed residual riconoscibili la verifica è più forte del solo `JSON.parse`: confronta stabilmente il documento letto con il documento/payload atteso e controlla l’identità pertinente, incluso `eventId` e la source timeline dove applicabile. Un target parseabile ma differente può quindi risultare incoerente nei percorsi coperti.

Restano non implementati integralmente:

- `documentType` canonico;
- `schemaVersion`;
- `revision`;
- `headCommitId`;
- `payloadDigest` persistito;
- `expectedBaseRevision`;
- verifica canonica/versionata uniforme per tutti i percorsi;
- riverifica uniforme dei target già `completed` nei record parziali.

`TEST-022` resta `MANCANTE`: manca la regressione dedicata e manca il contratto completo di `IMPL-020`.
### STORAGE-004 — Journal invalido non attribuibile

**Stato corrente:** `ANCORA PRESENTE`  
**Area:** recovery scanner, bootstrap e integrity globale

Lo scanner separa record validi, record invalidi identificabili ed entry invalide non attribuibili. La summary bootstrap conta `invalidJournal`, ma l’integrity per partita può interrogare soltanto record associabili a eventId e source.

Il bootstrap fallisce soltanto quando la summary è `fatal`; residui invalidi non attribuibili possono quindi coesistere con un backend in ascolto. Non esiste ancora il control plane globale approvato:

```txt
storage status: integrity_unknown
writersAllowed: false
readersAllowed: true
```

Il sistema non cancella automaticamente questi residui, ma non applica nemmeno un blocco globale dei writer fino alla loro classificazione.

### SECURITY-006 — Validazione eventId e confinamento

**Stato corrente:** `PARZIALMENTE CORRETTO`

`backend/src/utils/eventId.js` limita gli eventId a caratteri alfanumerici, underscore e trattino, con lunghezza massima 128; `timelineStore` usa questa validazione e rifiuta target espliciti non coincidenti con il target canonico risolto.

Il contratto non coincide però con il target storico “eventId canonico numerico”: `storage.js` e lo schema journal continuano inoltre ad accettare qualunque stringa non vuota. Non risulta una singola regola condivisa che imponga per ogni history, timeline e journal sia la stessa validazione bounded sia un controllo esplicito `path.relative(storageRoot, target)`.

Il target completo di `SECURITY-006` non è quindi realizzato integralmente.

### STORAGE-005 — Integrity della shared history

**Stato corrente:** `ANCORA PRESENTE`

`buildMatchHistoryResponse` interroga:

```txt
getMatchPersistenceIntegrity(eventId, 'sofa')
```

La history è condivisa, ma un pending Betfair che coinvolge lo stesso documento non confluisce automaticamente nella response history. Non esiste ancora l’aggregazione:

```txt
Sofa journal
+ Betfair journal
+ invalid journal globale
+ document read status
→ aggregate history integrity
```

Le timeline mantengono correttamente la propria integrity source-specific.

### STORAGE-006 — Stato runtime pubblicato rispetto al commit

**Stato corrente:** `CORRETTO PER LA PUBBLICAZIONE; RESTANO ESTENSIONI NON PRESENTI`

Il flusso SofaScore aggiorna `latestSofaState` soltanto quando il repair/commit restituisce `ok: true` e `status: complete`. Il flusso Betfair espone la dipendenza `commitBetfairState(eventId, state)` e il processor la invoca soltanto dopo che `commitBetfairPersistenceDocuments(...)` ha completato con successo la persistenza journalizzata.

La regola:

```txt
prepare candidate
→ complete canonical commit
→ publish committed state
```

è quindi applicata a entrambe le source: uno stato candidato appartenente a un commit fallito non viene pubblicato nelle mappe cross-source.

Non è presente una ricostruzione bootstrap delle mappe `latestSofaState` e `latestBetfairState` dai documenti canonici verificati, né l’identificazione di ogni riga cross-source con `rowCommitId`, `sofaCommitId` e `betfairCommitId`.

### STORAGE-007 — Contratti di lettura e API

**Stato corrente:** `PARZIALMENTE CORRETTO`

I loader interni producono risultati strutturati e non confondono più ogni errore con la semplice assenza. La compatibilità pubblica mantiene però facade documento/`null`, e `readResponses.js` usa tali facade.

Le route distinguono `409` soltanto quando l’integrity del journal è `partial_persistence` o `recovery_failed`. Un file corrotto, con forma invalida, illeggibile o ambiguo può ancora collassare nel percorso `null` e produrre `404` se non esiste anche un partial noto.

Il contratto API approvato resta quindi incompleto:

```txt
404
→ documento realmente mancante

409 storage_integrity
→ invalid_json, invalid_schema, read_failed o ambiguous
```

### STORAGE-008 — Duplicati dello stesso evento

**Stato corrente:** `CORRETTO NELLA DISCOVERY`

History e timeline rilevano più filename compatibili con lo stesso eventId e restituiscono `ambiguous_storage_target`; i writer non proseguono sul primo target lessicografico.

Non è stata invece adottata la seconda fase storicamente proposta con filename deterministici:

```txt
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

La correzione del rischio di selezione arbitraria è presente; la migrazione del formato dei nomi non lo è.

### STORAGE-009 — Stato persistito dei tentativi di recovery

**Stato corrente:** `ANCORA PRESENTE`

La recovery classifica gli esiti nella summary, inclusi `retryablePending`, `recoveryFailed` e `invalidJournal`, ma il record journal non conserva una policy completa con:

```txt
attemptCount
lastAttemptAt
lastFailureReason
lastFailedDocument
recoveryState
```

Non risultano soglia deterministica di escalation, rearm manuale persistito o controllo dei retry basato su metadata del record. Il target appartiene a `IMPL-021` e non va descritto come corrente.

### STORAGE-010 — Riscrittura full-document

**Stato corrente:** `LIMITE STRUTTURALE PRESENTE`

Ogni aggiornamento prepara copie complete di timeline e history; il journal conserva i due payload completi e i target vengono riscritti integralmente. Il costo cresce con la dimensione dei documenti durante la partita.

Il sistema non usa NDJSON, segmenti o database e non espone una misurazione completa di byte serializzati, durata di stringify, journal write, target write, rename e byte totali per partita. Il limite resta da misurare negli owner dedicati.

### STORAGE-011 — Atomicità process-level e durabilità power-loss

**Stato corrente:** `LIMITE PRESENTE`

Le scritture atomiche usano rename, ma non è dichiarato un contratto di:

```txt
fsync file
fsync directory
```

La proprietà documentabile è quindi:

```txt
atomicità rispetto al processo
≠
durabilità garantita in caso di power loss o crash del sistema operativo
```

### STORAGE-012 — Writer raw esportati

**Stato corrente:** `ANCORA PRESENTE`

La facade continua a esportare writer diretti, tra cui:

```txt
saveHistory
saveTimeline
writeTimelineDocument
```

I flussi canonici verificati usano il journal, ma la superficie interna permette ancora consumer diretti. Non risulta completata la separazione tra writer canonico, repair writer e helper di test prevista dal target storico.

## Store delle conferme Source Identity

Lo store delle conferme resta separato dal journal history/timeline. Possiede schema e lifecycle propri e non costituisce persistenza canonica dei tick della partita.

Lo store opera sotto l’authority del processo backend e preserva la scrittura atomica del singolo file. La sua indisponibilità non viene fusa con un pending dei documenti canonici e non viene introdotto un secondo journal cross-documento.

## Sintesi delle implementazioni collegate

### Sintesi di IMPL-015 — Backend writer authority

**Esito:** `IMPLEMENTATA`

```txt
un solo backend writer verificabile per repository/storage
→ authority prima della recovery
→ recovery prima del listen
→ rilascio durante shutdown
```

### Sintesi di IMPL-019 — Event persistence authority

**Esito:** `NON IMPLEMENTATA INTEGRALMENTE`

Resta il target storico:

```txt
shared history event-scoped
→ un solo commit attivo per evento
→ pending cross-source bloccante
→ verifica della base prima del commit successivo
```

### Sintesi di IMPL-020 — Canonical document contract e verified recovery

**Esito:** `PARZIALMENTE IMPLEMENTATA`

Sono già presenti riapertura dei target `completed` problematici, read result strutturati, duplicate detection e confronto stabile/semantico con il documento atteso nei completed residual riconoscibili. Restano assenti contratto canonico versionato, `documentType`/`schemaVersion`, `revision`/`headCommitId`, digest persistito, `expectedBaseRevision`, verifica uniforme del target already-completed nei record parziali e verified recovery completo previsto da `IMPL-020`.
### Sintesi di IMPL-021 — Recovery control plane

**Esito:** `NON IMPLEMENTATA INTEGRALMENTE`

La summary bootstrap è strutturata e viene registrata, ma mancano uno stato globale persistito dell’integrità, `writersAllowed`, metadata dei tentativi, escalation deterministica e rearm esplicito.

### TEST-019 — Lost update cross-source shared history

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Pending Sofa con history fallita, commit Betfair successivo e retry/recovery Sofa non devono poter cancellare il commit Betfair gia canonico.

**Evidenza/copertura corrente**

La shared history resta event-scoped, mentre i pending sono coordinati per `eventId + source`.

**Gap residuo**

Mancano coordinamento event-scoped cross-source e regressione dedicata.

**Owner tecnico collegato**

`IMPL-019 — Event persistence authority`.

**Criterio di chiusura**

Chiudere quando una regressione dimostra che recovery/retry di una source non puo cancellare uno stato canonico piu recente dell'altra source.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-020 — Pending cross-source sullo shared target

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Due commit di source differenti sullo stesso evento non devono essere contemporaneamente attivi quando coinvolgono la shared history.

**Evidenza/copertura corrente**

I pending sono ancora cercati per `eventId + source`.

**Gap residuo**

Manca il lock event-scoped cross-source e la relativa regressione.

**Owner tecnico collegato**

`IMPL-019 — Event persistence authority`.

**Criterio di chiusura**

Chiudere quando il secondo commit viene bloccato o preceduto dalla recovery del primo sullo stesso evento.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-021 — Verifica target completed nei record parziali

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Con documento A `completed` e B incomplete, la recovery deve riverificare A e riaprirlo/ripararlo se mancante o incoerente.

**Evidenza/copertura corrente**

I test correnti coprono residual completed, non la regressione specifica del record parziale con un target gia completed.

**Gap residuo**

Manca `A completed + B incomplete → riverifica A → reopen/repair A`.

**Owner tecnico collegato**

`IMPL-020 — Canonical document contract e verified recovery`.

**Criterio di chiusura**

Chiudere soltanto quando la regressione specifica sul record parziale e presente.

**Riferimenti essenziali**

- `backend/src/sofa/matchHistory/recovery/completedTargetVerification.integration.test.mjs`
- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-022 — Target JSON valido ma identity/digest errati

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un target JSON valido ma semanticamente incoerente con identita o payload attesi non deve essere considerato verificato.

**Evidenza/copertura corrente**

La verifica corrente e piu forte del solo `JSON.parse` e usa confronto stabile/identity nei residual completed.

**Gap residuo**

Manca la regressione JSON valido semanticamente errato; digest/revision completi di IMPL-020 non esistono.

**Owner tecnico collegato**

`IMPL-020 — Canonical document contract e verified recovery`.

**Criterio di chiusura**

Chiudere quando la suite copre esplicitamente un target parseabile ma semanticamente incompatibile.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-023 — Journal invalido → read-only integrity_unknown

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un journal invalido non attribuibile deve consentire letture, bloccare i writer e pubblicare `integrity_unknown` senza cancellazione automatica.

**Evidenza/copertura corrente**

Journal invalido e parte del comportamento read-only / `integrity_unavailable` sono coperti.

**Gap residuo**

Mancano `integrity_unknown` pubblico, control plane globale e writer block globale.

**Owner tecnico collegato**

`IMPL-021 — Recovery control plane`.

**Criterio di chiusura**

Chiudere quando la regressione copre journal non attribuibile, read-only, `integrity_unknown` e writer block.

**Riferimenti essenziali**

- `backend/src/sofa/matchHistory/recovery/invalidJournal.integration.test.mjs`
- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-024 — Aggregate integrity shared history

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

La shared history deve esporre integrity aggregata cross-source mantenendo le timeline source-specific.

**Evidenza/copertura corrente**

Il contratto completo di integrity aggregata non e ancora presente.

**Gap residuo**

Mancano comportamento aggregato e regressione dedicata.

**Owner tecnico collegato**

`IMPL-021 — Recovery control plane`.

**Criterio di chiusura**

Chiudere quando un pending/failure Betfair pertinente compare nell'integrity history aggregata.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-025 — Stato cross-source soltanto committed

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Stati candidati failed o partial non devono essere pubblicati come cross-source committed.

**Evidenza/copertura corrente**

La pubblicazione avviene dopo commit riuscito e il prepare Betfair non viene promosso come committed.

**Gap residuo**

Manca una matrice esplicita `failed / partial / complete` sulle mappe cross-source.

**Owner tecnico collegato**

`IMPL-019 — Event persistence authority`.

**Criterio di chiusura**

Chiudere quando la suite dimostra esplicitamente che failed/partial non entrano nelle mappe committed.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-026 — Read status Storage distinti

**Stato corrente:** `COPERTURA IMPLEMENTATA`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

I loader Storage devono distinguere gli esiti di lettura rilevanti invece di collassarli nella semplice assenza.

**Evidenza/copertura corrente**

`storage/discoveryAndRead.test.mjs` verifica `missing`, `found`, `invalid_json`, `read_failed` e `discovery_failed`.

**Gap residuo**

Nessun gap residuo per TEST-026; eventuali collassi nelle route appartengono ad altri finding.

**Owner tecnico collegato**

`IMPL-020 — Canonical document contract e verified recovery`.

**Criterio di chiusura**

Mantenere la copertura distinta dei read result Storage.

**Riferimenti essenziali**

- `backend/src/sofa/matchHistory/storage/discoveryAndRead.test.mjs`
- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-027 — Duplicate event documents bloccanti

**Stato corrente:** `COPERTURA IMPLEMENTATA`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Piu documenti compatibili con lo stesso eventId devono produrre ambiguity fail-closed, non selezione arbitraria.

**Evidenza/copertura corrente**

La suite verifica `ambiguous_storage_target` indipendentemente dall'ordine di discovery.

**Gap residuo**

Nessun gap residuo per TEST-027.

**Owner tecnico collegato**

`IMPL-020 — Canonical document contract e verified recovery`.

**Criterio di chiusura**

Mantenere la discovery fail-closed sui target multipli.

**Riferimenti essenziali**

- `backend/src/sofa/matchHistory/storage/discoveryAndRead.test.mjs`
- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-028 — EventId e target confinement

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Storage e journal devono rifiutare eventId non ammessi, traversal e target esterni/non canonici con una regola uniforme.

**Evidenza/copertura corrente**

Sono coperti alcuni eventId invalidi, target timeline non canonici/ambigui e controlli bounded.

**Gap residuo**

Manca un contratto uniforme su history, timeline, journal e root confinement.

**Owner tecnico collegato**

`IMPL-020 — Canonical document contract e verified recovery`.

**Criterio di chiusura**

Chiudere quando validazione eventId e confinement sono verificati uniformemente sulle superfici Storage pertinenti.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-029 — Nessun consumer runtime dei writer raw

**Stato corrente:** `MANCANTE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Un controllo automatico repository-wide deve impedire che codice runtime/canonico introduca nuovi consumer diretti dei writer raw non journalizzati.

Il contratto protegge almeno l'uso diretto di:

- `saveHistory`
- `saveTimeline`
- `writeTimelineDocument`

fuori dai percorsi autorizzati di persistence/recovery/test.

**Evidenza/copertura corrente**

La facade Storage continua a esportare writer raw e `STORAGE-012` registra che non esiste ancora una separazione completa fra writer canonico, repair writer e helper di test.

Non risulta presente un controllo statico/architetturale repository-wide dedicato a TEST-029.

**Gap residuo**

Manca la regressione automatica che:

- inventari i consumer runtime rilevanti;
- fallisca quando viene introdotto un consumer diretto non autorizzato;
- impedisca ai writer raw di diventare un'autorità persistence alternativa.

**Owner tecnico collegato**

`IMPL-020 — Canonical document contract e verified recovery`.

Finding collegato:

`STORAGE-012 — Writer raw esportati`

**Criterio di chiusura**

Chiudere TEST-029 soltanto quando un controllo automatico repository-wide dimostra l'assenza di consumer runtime diretti non autorizzati e fallisce deterministicamente se ne viene introdotto uno.

**Riferimenti essenziali**

- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

### TEST-030 — Retry, escalation e rearm recovery

**Stato corrente:** `PARZIALE`
**Natura:** owner della verifica/regressione richiesta

**Contratto del test**

Retry, escalation a `recovery_failed`, writer control e rearm devono avere comportamento deterministico, bounded, persistibile dove previsto e idempotente.

La verifica target comprende il contratto residuo di IMPL-021 relativo almeno a:

- attempt metadata;
- retry bounded;
- escalation deterministica;
- stato `recovery_failed`;
- writer authorization/control plane;
- rearm manuale esplicito.

**Evidenza/copertura corrente**

La suite Recovery copre già primitive reali, fra cui:

- writer failure → pending retryable;
- `retryablePending`;
- record già `recovery_failed`;
- recovery consecutivo idempotente;
- retry/recovery dello stesso commit nei casi presenti.

Questa copertura rende TEST-030 PARZIALE, non completamente mancante.

**Gap residuo**

Restano assenti dal contratto completo:

- `attemptCount` persistito;
- `lastAttemptAt`;
- `lastFailureReason`;
- `lastFailedDocument`;
- `recoveryState` completo;
- soglia deterministicamente bounded dei retry;
- escalation automatica/persistita secondo policy;
- writer block/control plane globale previsto da IMPL-021;
- rearm manuale esplicito e verificato.

**Owner tecnico collegato**

`IMPL-021 — Recovery control plane`.

**Criterio di chiusura**

Chiudere soltanto quando la suite dimostra il lifecycle completo:

pending/retryable
→ tentativi bounded e metadata persistiti
→ eventuale escalation deterministica a recovery_failed
→ nessun retry incontrollato
→ rearm soltanto tramite percorso esplicito previsto dal contratto
→ comportamento idempotente.

**Riferimenti essenziali**

- `backend/src/sofa/matchHistory/recovery/retryAndFailure.integration.test.mjs`
- `implementazioni/implementazioni-proposte/03-storage-recovery.md`
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md`

**Provenance storica**

Commit `eef267aab3c138395a5ca3d644a942190c5360e8`, `implementazioni/03-audit-codice.md`.

---

## Matrice dei test storici

| Test storico                                      | Comportamento corrente                                                                                | Esito                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| TEST-019 — lost update cross-source               | nessun lock event-scoped cross-source verificato                                                      | non coperto dal target approvato                |
| TEST-020 — pending cross-source                   | `createPendingCommit` filtra per eventId + source                                                     | non implementato                                |
| TEST-021 — verifica completed nei record parziali | verifica/reopen disponibile per completed residual; manca la regressione sul target gia completed dentro un record parziale | mancante per il contratto specifico TEST-021 |
| TEST-022 — JSON valido con identity/digest errati | verifica piu forte del solo parse JSON con confronto stabile/identity nei residual completed; manca regressione JSON valido semanticamente errato e manca digest/revision completo | mancante |
| TEST-023 — journal invalido non attribuibile      | summary presente, nessun writer block globale                                                         | parziale                                        |
| TEST-024 — aggregate integrity history            | route history usa source `sofa`                                                                       | non implementato                                |
| TEST-025 — stato soltanto committed               | entrambe le source pubblicano post-commit; nessun rebuild bootstrap o provenance completa delle righe | parziale rispetto al target storico complessivo |
| TEST-026 — read status distinti | loader Storage distinguono e testano `missing`, `found`, `invalid_json`, `read_failed` e `discovery_failed` | copertura implementata |
| TEST-027 — duplicate event documents              | discovery fail-closed per history e timeline                                                          | implementato                                    |
| TEST-028 — eventId e target confinement           | validazione bounded in timeline; contratti non uniformi                                               | parziale                                        |
| TEST-029 — nessun consumer dei writer raw         | export raw ancora presenti                                                                            | non implementato                                |
| TEST-030 — retry ed escalation | retryable failure, record già `recovery_failed` e recovery consecutivo idempotente sono coperti; mancano attempt metadata persistiti, escalation deterministica e rearm manuale | parziale |

I nomi storici `TEST-019…030` non equivalgono a suite PASS in assenza di una corrispondenza nel codice e nei test correnti.

## Decisioni storiche ancora pertinenti

Le seguenti decisioni restano utili come confine tra comportamento corrente e target approvato:

1. la shared history richiede coordinamento event-scoped tra SofaScore e Betfair;
2. ogni target `completed` deve essere verificato anche nei record parziali — il requisito resta pertinente; la verifica esplicita è presente per i residual completamente `completed`, mentre il caso del target già `completed` dentro un record parziale resta aperto in `TEST-021`;
3. la verifica forte richiede schema, identità, revisione e digest — non presente;
4. un journal invalido non attribuibile non equivale a `no_known_partial` — control plane globale non presente;
5. la shared history richiede integrity aggregata — non presente;
6. gli stati cross-source candidati vengono pubblicati soltanto dopo commit completo; rebuild bootstrap e provenance completa delle righe non sono presenti;
7. missing, invalid JSON, invalid schema, I/O failure e ambiguity devono restare distinti fino alla response API — realizzato solo internamente;
8. più file dello stesso evento devono bloccare la discovery — comportamento presente;
9. eventId e target devono condividere una regola Storage confinata — realizzazione parziale;
10. il formato full-document resta invariato finché non esistono misurazioni sufficienti;
11. i writer raw devono essere separati dall’autorità persistence — non presente;
12. le conferme Source Identity restano separate dal journal canonico;
13. atomicità process-level e durabilità power-loss non sono sinonimi.

## Sequenza tecnica risultante

La parte iniziale della sequenza è presente:

```txt
IMPL-015 — backend writer authority          [presente]
→ recovery prima del listen                  [presente]
→ verifica target completed                  [presente]
→ duplicate discovery fail-closed            [presente]
```

Restano da implementare integralmente:

```txt
IMPL-019 — event persistence authority
→ IMPL-020 — canonical document contract completo
→ IMPL-021 — recovery control plane globale
```
