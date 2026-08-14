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
| Target `completed`    | verificati anche nei record parziali; riaperti e riscritti se mancanti/illeggibili         | la verifica prova leggibilità JSON, non schema, identità, revisione o digest              |
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

La recovery bootstrap e la creazione di un nuovo pending non si limitano a fidarsi dei flag `completed`, ma verificano i target di un record completato. Se un target è mancante o non è leggibile come JSON:

```txt
completed:true
→ verify target
→ markDocumentIncomplete(...)
→ reload journal
→ rewrite dal payload journalizzato
→ completamento e cleanup
```

Lo stesso controllo viene applicato anche quando soltanto uno dei due documenti era ancora pending. Il comportamento descritto da `STORAGE-002` risulta quindi corretto.

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

**Stato corrente:** `CORRETTO`

La recovery verifica i target già marcati `completed`, inclusi quelli appartenenti a record parziali. Target mancanti o illeggibili vengono riaperti tramite `markDocumentIncomplete` e riscritti dal payload del journal prima del cleanup.

La verifica è tuttavia soltanto di esistenza, lettura e parsing JSON. Le garanzie più forti appartengono a `STORAGE-003`.

### STORAGE-003 — Verifica target limitata alla leggibilità JSON

**Stato corrente:** `ANCORA PRESENTE`  
**Area:** target verification

Il verificatore apre il target e applica `JSON.parse`. Non verifica:

- tipo del documento;
- schema versionato;
- eventId;
- source o natura aggregate;
- revisione;
- head commit;
- digest del payload atteso.

Un JSON leggibile ma semanticamente estraneo può quindi soddisfare la verifica. Il contratto proposto da `IMPL-020`, con `documentType`, `schemaVersion`, revisioni e digest, non è ancora presente.

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

### IMPL-015 — Backend writer authority

**Esito:** `IMPLEMENTATA`

```txt
un solo backend writer verificabile per repository/storage
→ authority prima della recovery
→ recovery prima del listen
→ rilascio durante shutdown
```

### IMPL-019 — Event persistence authority

**Esito:** `NON IMPLEMENTATA INTEGRALMENTE`

Resta il target storico:

```txt
shared history event-scoped
→ un solo commit attivo per evento
→ pending cross-source bloccante
→ verifica della base prima del commit successivo
```

### IMPL-020 — Canonical document contract e verified recovery

**Esito:** `PARZIALMENTE IMPLEMENTATA`

Sono presenti riapertura dei target completati, read result strutturati e duplicate detection. Non sono presenti un contratto canonico versionato con identity/revision/digest e una verifica semantica del target contro il payload journalizzato.

### IMPL-021 — Recovery control plane

**Esito:** `NON IMPLEMENTATA INTEGRALMENTE`

La summary bootstrap è strutturata e viene registrata, ma mancano uno stato globale persistito dell’integrità, `writersAllowed`, metadata dei tentativi, escalation deterministica e rearm esplicito.

## Matrice dei test storici

| Test storico                                      | Comportamento corrente                                                                                | Esito                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| TEST-019 — lost update cross-source               | nessun lock event-scoped cross-source verificato                                                      | non coperto dal target approvato                |
| TEST-020 — pending cross-source                   | `createPendingCommit` filtra per eventId + source                                                     | non implementato                                |
| TEST-021 — verifica completed nei record parziali | test di target completed mancanti + `markDocumentIncomplete`                                          | implementato                                    |
| TEST-022 — JSON valido con identity/digest errati | verifica limitata a parse JSON                                                                        | non implementato                                |
| TEST-023 — journal invalido non attribuibile      | summary presente, nessun writer block globale                                                         | parziale                                        |
| TEST-024 — aggregate integrity history            | route history usa source `sofa`                                                                       | non implementato                                |
| TEST-025 — stato soltanto committed               | entrambe le source pubblicano post-commit; nessun rebuild bootstrap o provenance completa delle righe | parziale rispetto al target storico complessivo |
| TEST-026 — read status distinti                   | loader strutturati; route ancora su facade                                                            | parziale                                        |
| TEST-027 — duplicate event documents              | discovery fail-closed per history e timeline                                                          | implementato                                    |
| TEST-028 — eventId e target confinement           | validazione bounded in timeline; contratti non uniformi                                               | parziale                                        |
| TEST-029 — nessun consumer dei writer raw         | export raw ancora presenti                                                                            | non implementato                                |
| TEST-030 — retry ed escalation                    | summary runtime senza metadata/policy persistita completa                                             | non implementato                                |

I nomi storici `TEST-019…030` non equivalgono a suite PASS in assenza di una corrispondenza nel codice e nei test correnti.

## Decisioni storiche ancora pertinenti

Le seguenti decisioni restano utili come confine tra comportamento corrente e target approvato:

1. la shared history richiede coordinamento event-scoped tra SofaScore e Betfair;
2. ogni target `completed` deve essere verificato anche nei record parziali — comportamento ora presente;
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
