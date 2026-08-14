# Tennis Decision UI — Storage, documenti canonici e recovery

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)  
> **Perimetro:** IMPL-019…021  
> **Parte precedente:** [Runtime e acquisizione Betfair](02-runtime-betfair.md)  
> **Parte successiva:** [Evidence, provenance e confronti temporali](04-evidence-provenance.md)  

Questo documento resta il registro owner unitario per tre responsabilità distinte ma concatenate:

1. autorità dei commit che possono modificare la persistenza dello stesso evento;
2. contratto dei documenti history/timeline e del journal che li rende recuperabili;
3. recovery bootstrap, stato di integrità e controllo dei writer in presenza di persistenza parziale.

Lo **stato del piano** riportato per `IMPL-019…021` indica che le implementazioni sono state confermate e approvate. Non equivale allo stato di implementazione nel codice. Le sezioni seguenti distinguono quindi esplicitamente il comportamento presente nell’implementazione corrente dal contratto ancora residuo.

## 18. Implementazioni approvate dal Punto 4

| Owner      | Stato nell’implementazione corrente         | Primitive già presenti                                                                                                                     | Contratto ancora residuo                                                                                                                                |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IMPL-019` | non implementata come autorità event-scoped | writer authority process-level; commit journalizzati per source; publish runtime dopo commit riuscito                                      | esclusione fra SofaScore e Betfair sullo stesso evento; base revision verificata; ownership/release event-scoped                                        |
| `IMPL-020` | parzialmente presente                       | writer atomici; discovery fail-closed sui duplicati; read result strutturati; journal persistente; verifica e repair dei target completati | schema canonico versionato; revision/head commit; digest persistito; identità tick uniforme; naming/migrazione canonica                                 |
| `IMPL-021` | parzialmente presente                       | recovery bootstrap prima del listen; summary di recovery; `partial_persistence` / `recovery_failed` per evento/source                      | control plane persistente globale; `integrity_unknown`; writer policy globale/event-scoped; retry bounded con tentativi persistiti; rearm; API dedicata |

---

### IMPL-019 — Event persistence authority

**Classificazione:** `NECESSARIA`  
**Stato del piano:** `CONFERMATA E APPROVATA`  
**Priorità:** critica  
**Dipendenze:** `IMPL-015`, `IMPL-006`, journal SofaScore/Betfair

#### Problema

La history aggregata appartiene all’evento ed è condivisa dai flussi SofaScore e Betfair, mentre il commit journal corrente autorizza e ricerca i pending per coppia:

```txt
eventId
+ source
```

La serializzazione è quindi source-scoped, non event-scoped.

Un pending SofaScore impedisce a un nuovo commit SofaScore dello stesso evento di partire prima della ripresa del pending. Lo stesso vale separatamente per Betfair. Non esiste però, nell’implementazione corrente, un’autorità di commit che impedisca in modo unitario a SofaScore e Betfair di avere contemporaneamente un record attivo sullo stesso evento.

Per questo il rischio che motivava `IMPL-019` non può essere considerato chiuso soltanto perché entrambi i writer usano il journal.

#### Comportamento corrente

A livello di processo esiste una writer authority sulla directory di persistenza. Il backend la acquisisce prima di eseguire il recovery bootstrap e la mantiene durante il proprio ciclo di vita. Questa autorità evita che un secondo backend considerato incompatibile acquisisca contemporaneamente la stessa authority di storage, ma non sostituisce una authority sul singolo evento.

Dentro il processo, SofaScore e Betfair applicano invece due pipeline journalizzate distinte.

SofaScore:

```txt
find pending(eventId, sofa)
→ se presente: resume
→ altrimenti: verifica/cleanup di un eventuale residual completato Sofa
→ leggi history e timeline Sofa
→ prepara history + timeline
→ crea commitId
→ crea journal source=sofa
→ scrivi i documenti incompleti
→ marca i documenti completati
→ rimuovi il journal quando entrambi risultano completati
→ pubblica latestSofaState solo dopo commit completo
```

Betfair:

```txt
find pending(eventId, betfair)
→ se presente: repair
→ altrimenti: verifica/cleanup di un eventuale residual completato Betfair
→ valuta il nuovo tick
→ prepara history + timeline Betfair
→ crea commitId
→ crea journal source=betfair
→ esegui il commit dei documenti
→ pubblica lo stato runtime Betfair solo dopo complete/recovered
```

Il journal corrente impedisce più record attivi **della stessa source** per lo stesso evento. La selezione e il blocco non sono estesi automaticamente all’altra source.

#### Autorità richiesta da questo owner

Il contratto di `IMPL-019` resta un’autorità event-scoped separata dalla writer authority process-level.

Identità minima prevista:

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

Questa struttura rappresenta il contratto da implementare, non il record journal corrente.

Il record journal corrente contiene invece, a livello principale:

```txt
version
commitId
eventId
source
createdAt
status
documents
reason
```

e ogni documento contiene:

```txt
target
payload
completed
```

Non contiene `eventPersistenceId`, `repositoryWriterId`, `trackingSessionId`, `expectedBaseRevision` o uno stato di ownership event-scoped.

#### Regole dell’autorità event-scoped

Restano necessarie le seguenti invarianti:

- un solo commit canonico attivo per evento;
- l’esclusione del commit è event-scoped, non source-scoped;
- qualsiasi pending che coinvolge la shared history blocca la preparazione di un nuovo commit dell’altra source sul medesimo evento;
- la base del documento deve essere verificata prima di preparare il nuovo payload;
- la source resta metadato del commit e non diventa autorità esclusiva sul target aggregato;
- una callback o sessione non più autorizzata non acquisisce la persistence authority;
- una sessione nuova non bypassa un partial precedente;
- un commit non autorizzato non pubblica nuovo stato runtime;
- la release appartiene all’owner corrente;
- stato sconosciuto o failure dell’autorità devono essere fail-closed.

Alcune proprietà sono già rispettate localmente dalle pipeline attuali — in particolare il publish del runtime solo dopo persistenza riuscita — ma non costituiscono da sole l’autorità event-scoped richiesta.

#### Sequenza richiesta

```txt
session authority valida
→ acquire event persistence authority
→ resolve pending/recovery di entrambe le source per l'evento
→ read verified base revision
→ prepare documents
→ create journal
→ write e verify
→ publish committed runtime state
→ release event persistence authority
```

Il punto discriminante rispetto alla pipeline corrente è che la verifica di pending e base deve avvenire sull’evento condiviso prima che una delle due source prepari un nuovo commit della shared history.

#### Relazioni

```txt
IMPL-015
→ esclusione fra backend processi sulla writer authority di storage

IMPL-019
→ esclusione fra commit dello stesso evento dentro il backend

IMPL-006
→ autorizzazione della callback/sessione

IMPL-016
→ ownership del runtime Betfair
```

`IMPL-015` è un prerequisito utile ma non chiude `IMPL-019`: protegge l’authority process-level, mentre `IMPL-019` deve arbitrare i commit concorrenti appartenenti allo stesso evento.

#### Verifica e test

Riferimenti storici del piano:

```txt
TEST-019
TEST-020
TEST-025
```

I test correnti del commit journal ammettono record SofaScore e Betfair pending sullo stesso `eventId` e ne selezionano deterministicamente lo stato di integrità. Questo comportamento è coerente con l’attuale journal source-scoped e costituisce la distinzione tecnica da eliminare prima di considerare `IMPL-019` completata.

---

### IMPL-020 — Canonical document contract e verified recovery

**Classificazione:** `NECESSARIA`  
**Stato del piano:** `CONFERMATA E APPROVATA`  
**Priorità:** critica  
**Dipendenze:** `IMPL-019`, history/timeline store, commit journal

#### Contratto dei documenti corrente

L’implementazione corrente non usa ancora il contratto canonico originariamente definito da `IMPL-020`.

La history aggregata viene letta come documento con forma minima:

```txt
{
  metadata: object,
  history: array
}
```

La timeline di ciascuna source viene letta come documento con forma minima:

```txt
{
  metadata: object,
  timeline: array
}
```

I metadata correnti contengono i dati necessari al runtime, fra cui `eventId`, informazioni su data/torneo/giocatori e, per le timeline, la source. Non esiste però un envelope obbligatorio comune con:

```txt
documentType
schemaVersion
revision
headCommitId
```

La history SofaScore aggiunge `commitId` alle nuove righe persistite. Le timeline possono contenere identificatori e sequenze pertinenti al rispettivo flusso, ma non esiste un contratto universale di tick condiviso da entrambe le source equivalente a quello definito più avanti in questo owner.

#### Discovery corrente

Quando non esiste ancora un target, lo storage costruisce nuovi nomi leggibili derivati da data, torneo, giocatori ed `eventId`.

History:

```txt
<date>_<tournament>_<home>_vs_<away>_<eventId>.json
```

Timeline:

```txt
sofa_<date>_<tournament>_<home>_vs_<away>_<eventId>.json
betfair_<date>_<tournament>_<home>_vs_<away>_<eventId>.json
```

La discovery dei file esistenti non richiede però l'intero pattern di creazione. Per la history considera i JSON che terminano con `_<eventId>.json`, escludendo temporanei e timeline `sofa_`/`betfair_`; per le timeline richiede il prefisso della source e il suffisso `_<eventId>.json`. La parte intermedia del nome non costituisce quindi l'identità canonica del target.

La discovery è fail-closed sui duplicati:

```txt
0 target compatibili
→ missing

1 target compatibile
→ found / target corrente

>1 target compatibili
→ failed
→ reason: ambiguous_storage_target
```

History e timeline ignorano i file temporanei durante la discovery.

Non risulta implementata, in questo owner, la migrazione ai nomi deterministici originariamente proposti:

```txt
history_<eventId>.json
sofa_<eventId>.json
betfair_<eventId>.json
```

#### Read contract corrente

History e timeline espongono reader strutturati con la distinzione principale:

```txt
found
missing
failed
```

Le cause di `failed` conservano il dettaglio necessario, fra cui:

```txt
invalid_json
invalid_shape
read_failed
ambiguous_storage_target
discovery_failed
```

Il contratto corrente è quindi più semplice del read contract originariamente proposto: gli errori di formato, lettura e ambiguità sono `reason` di un esito `failed`, non stati autonomi insieme a `found` e `missing`.

#### Write contract corrente

History e timeline scrivono JSON attraverso file temporaneo nella directory del target e successivo rename sul file definitivo.

Il risultato di write è strutturato e conserva almeno:

```txt
ok
operation
source
eventId
status
reason
file
commitId
```

Per un write journalizzato il target passato al writer deve coincidere con il target risolto dallo storage per quell’evento/source. Un target diverso non viene accettato come write valido.

Queste primitive danno atomicità al replace del singolo documento e permettono al workflow journalizzato di distinguere un write riuscito da un write fallito. Non introducono però revisioni documentali o compare-and-swap sulla base condivisa.

#### Contratto canonico richiesto

Il contratto residuo di `IMPL-020` richiede che ogni documento canonico dichiari:

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

Questi campi non devono essere descritti come correnti finché non diventano parte effettiva dello schema persistito e dei relativi reader/writer.

#### Identità dei tick e compatibilità con dataset derivati

Resta richiesto un identificatore dei tick che non dipenda dalla posizione corrente nell’array.

Contratto previsto:

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

`sourceTickId` deve essere immutabile nell’ambito di evento e source. `sourceSequence` deve ordinare i tick della singola timeline senza riuso.

Il contratto deve preservare informazioni sufficienti a:

- allineare SofaScore e Betfair senza fondere le timeline canoniche;
- distinguere tempo di acquisizione e tempo di registrazione;
- ricostruire dataset cross-source con una policy versionata;
- riferire i tick originali da grafici, replay e dataset di backtesting;
- impedire l’uso di dati successivi al cursore storico.

`fieldStateId` e le relazioni cross-source restano dati derivati. Non diventano una foreign key scritta automaticamente dentro entrambe le timeline live.

#### Contratto journal corrente

Il commit journal persistito usa `version: 1` e conserva:

```txt
version: 1
commitId
eventId
source
createdAt
status: pending | recovery_failed
reason
documents:
  history:
    target
    payload
    completed
  timeline:
    target
    payload
    completed
```

Il payload contiene una copia del documento necessario al repair e i metadata necessari al writer.

Il journal valida inoltre la sicurezza del JSON persistito: rifiuta forme non ammesse, valori non JSON-safe e concetti sensibili come credential, token, authorization, cookie o secret.

Non fanno parte del record corrente:

```txt
payloadDigest
expectedBaseRevision
verifiedAt
```

#### Contratto journal richiesto

L’evoluzione prevista da `IMPL-020` resta:

```txt
target
payload
payloadDigest
expectedBaseRevision
completed
verifiedAt o null
```

Il digest dovrà usare una rappresentazione stabile e documentata, coperta da fixture, e non dipendere dall’ordine accidentale delle chiavi.

L’implementazione corrente contiene già una serializzazione JSON stabile usata per confrontare semanticamente il target con il payload atteso durante la verifica dei residual completati. Questa primitiva non equivale a un `payloadDigest` persistito e non introduce `expectedBaseRevision`.

#### Recovery corrente

Il recovery corrente ha due casi distinti.

Per un record pending con uno o più documenti incompleti:

```txt
valida record e repair payload
→ per ogni documento incomplete:
     write sul target journalizzato
     verifica che write result punti allo stesso target e commitId
     mark document complete
→ quando entrambi completed:
     remove journal
```

Per un residual che nel journal risulta già `completed:true` su entrambi i documenti:

```txt
verifica i target esistenti
→ target coerenti con il payload atteso:
     cleanup del journal

→ target mancante / illeggibile / incoerente:
     mark document incomplete
     reload record
     rewrite soltanto i documenti riaperti
     completa il journal
```

La verifica dei residual utilizza, quando il payload è un documento history/timeline riconoscibile, il confronto stabile dell’intero documento atteso con quello letto, oltre alla coerenza di `eventId` e, per la timeline, della `source`.

Questo comportamento è già più forte del semplice controllo “il file esiste ed è JSON”, ma non è ancora il verified recovery completo definito dal contratto canonico originario, perché non valida `schemaVersion`, `revision`, `headCommitId` o un digest persistito.

#### Verified recovery richiesto

Il contratto completo resta:

```txt
resolve confined target
→ read
→ validate schema/identity
→ validate revision/head commit
→ validate digest
→ valid: preserve
→ invalid: mark incomplete e rewrite
```

Il journal può essere eliminato soltanto quando i target richiesti dal commit risultano completati secondo il contratto applicabile.

#### Migrazione e naming canonico

Il comportamento corrente già evita due scelte pericolose:

- non sceglie arbitrariamente uno dei duplicati dello stesso evento/source;
- non migra automaticamente tutti i file runtime durante lo startup.

Resta invece non implementato il piano di migrazione:

```txt
scan read-only
→ manifest legacy → canonical
→ conflitti bloccanti
→ copia/rename atomico dopo verifica
→ nessuna eliminazione prima del confronto
→ rollback definito
→ metadata leggibili conservati dentro il documento
```

L’introduzione di naming deterministico deve essere coordinata con i reader compatibili e non deve essere confusa con il recovery dei file correnti.

#### Security boundary

Primitive correnti pertinenti:

- il journal accetta soltanto source `sofa` o `betfair`;
- il commitId è validato e i commit canonici generati seguono il prefisso della source più UUID;
- i repair payload devono contenere la forma history/timeline prevista;
- `eventId` e `source` del payload vengono controllati quando presenti;
- la timeline usa il validator canonico di `eventId`, che accetta stringhe non vuote fino a 128 caratteri composte da lettere, numeri, `_` e `-`; history storage e commit journal applicano invece controlli locali meno restrittivi basati sulla stringa non vuota;
- il target passato ai writer journalizzati deve coincidere con quello risolto dallo storage;
- il journal rifiuta contenuti con categorie di chiavi o valori sensibili non ammessi.

Il contratto più ampio resta quindi più restrittivo nei punti non ancora uniformi:

- un unico contratto bounded di `eventId` applicato coerentemente a history, timeline e journal; il requisito non è limitato a identificatori numerici;
- root confinement formale per ogni target;
- verifica del target journalizzato contro l’identità canonica dello storage;
- nessun path esterno accettato da un journal manipolato;
- writer raw non esposti come autorità alternative.

#### Compatibilità

Non deve essere dichiarato sano un documento soltanto perché è parseabile.

La compatibilità deve continuare a essere fail-closed quando:

- la discovery trova più target;
- la forma minima history/timeline non è valida;
- un target journalizzato non coincide con il target che il writer risolve;
- un residual completato non corrisponde al documento atteso.

L’evoluzione verso schema canonico, revision e digest deve preservare la leggibilità controllata dei dati legacy finché una migrazione esplicita non viene introdotta.

#### Verifica e test

Riferimenti storici del piano:

```txt
TEST-021
TEST-022
TEST-024
TEST-026
TEST-027
TEST-028
TEST-029
```

I test correnti contengono già copertura dedicata per:

- lifecycle del journal su filesystem;
- record e payload safety;
- stato di integrità per record pending/recovery_failed;
- residual `completed:true` con target valido;
- history completata ma target mancante;
- timeline completata ma target mancante;
- entrambi i target mancanti;
- writer failure mantenuta come pending retryable;
- recovery consecutivo idempotente.

Questa copertura verifica le primitive correnti. Non dimostra l’esistenza dei campi e delle invarianti canoniche ancora assenti.

---

### IMPL-021 — Recovery control plane

**Classificazione:** `NECESSARIA`  
**Stato del piano:** `CONFERMATA E APPROVATA`  
**Priorità:** alta  
**Dipendenze:** `IMPL-015`, `IMPL-019`, `IMPL-020`, runtime logger, `IMPL-009`

#### Recovery bootstrap corrente

Il backend esegue la sequenza:

```txt
create/acquire match-history writer authority
→ runPendingCommitRecovery(...)
→ se recovery fatal:
     log recovery_fatal
     release writer authority
     startup fallisce

→ altrimenti:
     log recovery_complete
     bind/listen
```

Il recovery avviene quindi realmente prima del `listen`.

Il summary runtime corrente contiene:

```txt
ok
fatal
scanned
recovered
cleaned
retryablePending
recoveryFailed
alreadyRecoveryFailed
invalidJournal
outcomes
```

Gli outcome riportano campi bounded relativi al record quando disponibili:

```txt
source
eventId
commitId
category
reason
failedDocument
```

Questo summary è il risultato dell’esecuzione del bootstrap e viene usato per logging e decisione fatal/non-fatal. Non è un control plane persistente interrogabile come autorità globale di storage.

#### Stato per record corrente

Il journal persiste due stati principali:

```txt
pending
recovery_failed
```

La completezza resta separata per:

```txt
documents.history.completed
documents.timeline.completed
```

Un failure di write durante il recovery può lasciare il record `pending` con il documento non completato e viene riportato come `retryablePending` nel summary.

Un record già `recovery_failed` viene riconosciuto come tale dal bootstrap e non viene automaticamente riarmato.

Non sono persistiti nel record corrente:

```txt
attemptCount
lastAttemptAt
lastFailureReason
lastFailedDocument
recoveryState: pending | retryable | failed | rearmed
```

#### Integrità corrente per evento/source

Il commit journal espone uno stato di integrità derivato dai record attivi.

Stati nominali usati dal facade `matchHistory`:

```txt
no_known_partial
partial_persistence
recovery_failed
```

Con:

```txt
reason
source
commitId
affectedDocuments
```

Un pending attivo produce `partial_persistence` con reason `pending_commit`. Un record `recovery_failed` produce l’omonimo stato e conserva la reason persistita.

Il journal store può rilevare anche l’impossibilità di calcolare l’integrità quando la scansione dei journal è invalida, tramite uno stato interno `integrity_unavailable`. Il facade pubblico di `matchHistory` non espone però questo stato: normalizza soltanto i tre stati allow-list sopra elencati.

Non esiste quindi, nell’implementazione corrente, un equivalente persistente e globale di `integrity_unknown`.

#### Cosa il bootstrap recupera

Il bootstrap:

- scansiona i recovery candidate;
- distingue record validi, record strutturalmente invalidi ed entry journal non leggibili/attribuibili;
- ripara SofaScore e Betfair tramite i rispettivi repair path;
- preserva i documenti già completati quando non devono essere riscritti;
- verifica i residual completati prima della pulizia;
- riapre i documenti completati il cui target non è più valido;
- lascia retryable un failure di write o di cleanup che non può essere chiuso in quella esecuzione;
- riconosce i record già `recovery_failed`;
- produce un summary idempotente quando non restano journal da recuperare.

Il bootstrap non implementa un ciclo automatico di retry bounded basato su un contatore persistito. Una nuova invocazione del recovery può ritentare un pending ancora presente, ma non esiste nel record una soglia di tentativi che promuova automaticamente il record a `recovery_failed`.

#### Limite rispetto all’autorità dei writer

Il server blocca l’avvio quando il recovery summary è `fatal:true`.

Un risultato non-fatal con:

```txt
retryablePending > 0
recoveryFailed > 0
invalidJournal > 0
```

non introduce, da solo, un `writersAllowed:false` globale prima del listen.

Inoltre il journal continua a essere source-scoped. Un partial attribuibile a SofaScore non costituisce ancora l’event-scoped writer block richiesto da `IMPL-019` per entrambe le source che condividono la history.

Per questo il recovery bootstrap esistente non equivale al recovery control plane previsto da `IMPL-021`.

#### Stato globale richiesto

Il contratto residuo resta:

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

Gli outcome pubblici devono essere bounded e allow-list. Path completi e payload non devono diventare parte di una risposta pubblica.

#### Stato per record richiesto

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

Questi campi devono diventare stato persistente soltanto quando viene implementato il relativo contratto; non devono essere ricostruiti o inventati dal summary corrente.

#### Policy residua

Restano da chiudere, come parte del control plane:

- `integrity_unknown` per journal non attribuibile o integrità non determinabile;
- writer globali bloccati quando l’integrità globale non è conoscibile in sicurezza;
- writer dell’intero evento bloccati quando esiste un partial che coinvolge la shared history;
- retry bounded con tentativi persistiti;
- escalation deterministica a `recovery_failed`;
- assenza di retry ad ogni tick live;
- rearm soltanto tramite comando locale esplicito e verificato;
- esposizione di uno stato persistente/interrogabile separato dal semplice summary di bootstrap;
- possibilità esplicita di mantenere il backend in modalità read-only quando la lettura è sicura ma i writer non sono autorizzati.

Il recovery bootstrap prima del listen e il summary reale nel log sono invece già presenti.

#### API/UI

Non è presente una route:

```txt
GET /api/runtime/storage-integrity
```

L’eventuale endpoint resta parte del contratto di `IMPL-021` e deve leggere il control plane reale, non ricostruire uno stato ottimistico dai soli file disponibili.

La mutazione di rearm, se introdotta, resta subordinata a un contratto locale esplicito:

- POST JSON;
- protezione tramite `IMPL-017`;
- `commandId` obbligatorio;
- idempotenza;
- nessuna disponibilità da origini esterne.

`IMPL-009` potrà tradurre il control plane in UI soltanto quando lo stato backend corrispondente esiste realmente.

Non fondere storage integrity con Betfair health, Source Identity o freshness.

#### Verifica e test

Riferimenti storici del piano:

```txt
TEST-023
TEST-030
```

I test correnti verificano già recovery bootstrap, target verification, failure retryable, record `recovery_failed` e idempotenza. Restano fuori da questa copertura, perché non implementati come contratto corrente:

- attempt counter persistito;
- retry threshold/escalation bounded;
- rearm;
- `writersAllowed`;
- `integrity_unknown` globale;
- API del control plane;
- blocco event-scoped cross-source.

---

## 18.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-008 — Harness persistence/recovery

Il progetto possiede già fixture e test dedicati a una parte importante del dominio storage/recovery.

Copertura presente:

- commit journal persistente e lifecycle deterministico;
- payload safety;
- integrità `partial_persistence` e `recovery_failed`;
- invalid journal osservabile a livello di journal store;
- target `completed:true` ma mancante;
- riscrittura selettiva del solo documento mancante;
- entrambi i target mancanti;
- failure del writer lasciata retryable;
- cleanup failure lasciato retryable;
- recovery consecutivo idempotente;
- record `recovery_failed` già presente;
- coesistenza di pending SofaScore e Betfair sullo stesso evento nel modello source-scoped corrente.

Restano da aggiungere soltanto insieme ai contratti che oggi non esistono:

- blocco cross-source imposto da `IMPL-019`;
- conflitto su `expectedBaseRevision`;
- digest persistito errato;
- schema/revision/head commit non validi;
- retry bounded ed escalation basati su attempt state persistito;
- rearm;
- policy `integrity_unknown` / `writersAllowed`.

Le fixture correnti non devono essere reinterpretate come prova di questi contratti futuri.

### Estensione di IMPL-009 — Adapter frontend persistence

Questo documento mantiene soltanto la dipendenza.

Il backend corrente dispone di integrità per evento/source, ma non del control plane globale previsto da `IMPL-021`. Di conseguenza i seguenti campi restano dipendenti dall’implementazione del backend corrispondente:

```txt
integrity_unknown
writersAllowed
aggregateHistoryIntegrity
documentReadStatus
recovery attempt state
```

L’adapter frontend non deve inventare questi valori a partire dall’assenza di errori o da un semplice `no_known_partial`.

### Estensione di IMPL-013 — Baseline storage

Questo documento non è owner delle misure di baseline storage. Mantiene però la relazione di sequencing originaria perché l’evoluzione del formato non deve essere giustificata senza misure.

Misure previste dall’owner collegato:

- dimensione history/timeline;
- byte del journal;
- durata stringify/write/rename;
- byte totali per partita;
- differenza atomicità/durabilità;
- eventuale costo di fsync configurabile.

Lo stato di tali misure deve essere documentato nel relativo owner; non viene inferito da questo registro.

## 18.2 Ordine approvato

La relazione concettuale resta:

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

L’esistenza nell’implementazione corrente di primitive introdotte lungo questa catena non cambia il significato degli owner:

```txt
writer authority process-level presente
≠ event persistence authority completata

journal + atomic write + target verification presenti
≠ canonical document contract completato

recovery bootstrap + summary presenti
≠ recovery control plane completato
```

La chiusura di ciascun owner deve essere valutata sul relativo contratto, non sulla sola presenza di una sua primitiva.
