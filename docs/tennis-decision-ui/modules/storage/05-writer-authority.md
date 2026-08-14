# Writer authority

## Scopo

Questo documento definisce il contratto process-level che garantisce un solo backend writer per la stessa repository identity e storage identity locale.

La writer authority è una precondizione del bootstrap del backend. Non è un journal di commit, una cache, una fonte dati, un lock di porta o un meccanismo di ownership dei processi avviati dal launcher.

## Stato

La writer authority è implementata nel backend e integrata nel bootstrap e nello shutdown.

```txt
backend/src/runtime/matchHistoryWriterAuthority.js
backend/src/server.js
backend/src/sofa/matchTracker.js
```

L'invariante applicata è:

```txt
una repository identity + una storage identity
→ un solo backend writer verificato
```

L'authority impedisce l'avvio concorrente di un secondo backend sulla stessa storage identity; non rende supportata una topologia multi-writer.

## Collocazione

Il record locale risiede sotto:

```txt
backend/match_history/.writer_authority/
```

La directory è risolta rispetto alla root canonica del repository, indipendentemente dalla current working directory del processo.

`.writer_authority/` non è history o timeline e non deve essere trattata come file business. I writer di dominio non la creano, non la verificano e non la rimuovono autonomamente.

## Identità e authority record

Ogni istanza della primitive genera un `backendInstanceId` UUID. Il relativo file usa il nome:

```txt
<backendInstanceId>.json
```

Il record ha schema bounded:

| Campo                     | Significato                                   |
| ------------------------- | --------------------------------------------- |
| `schema`                  | versione dello schema dell'authority record   |
| `project`                 | identificatore costante del progetto          |
| `backendInstanceId`       | identità UUID dell'istanza backend            |
| `pid`                     | PID del processo owner                        |
| `processStartFingerprint` | fingerprint dell'avvio del processo           |
| `createdAt`               | timestamp ISO di creazione                    |
| `repositoryIdentity`      | hash SHA-256 del path canonico del repository |
| `storageIdentity`         | hash SHA-256 del path canonico dello storage  |

`repositoryIdentity` e `storageIdentity` derivano dai path canonici risolti con `realpath`; su Windows la normalizzazione dell'identità è case-insensitive. Nei record vengono memorizzati gli hash, non i path in chiaro.

Il PID non è sufficiente a stabilire continuità dell'owner. Quando il processo risulta presente, l'authority verifica anche il fingerprint del suo avvio:

```txt
Linux
→ start ticks da /proc/<pid>/stat

Windows
→ StartTime UTC del processo tramite PowerShell

altre piattaforme
→ processo non verificabile
→ stato unknown
```

La porta HTTP non partecipa all'identità dell'authority. Writer authority, launcher lock e process ownership restano contratti distinti.

## Classificazione dell'owner esistente

Ogni entry presente nella directory viene validata e classificata prima dell'acquisizione.

| Stato          | Condizione                                          | Azione del nuovo backend     |
| -------------- | --------------------------------------------------- | ---------------------------- |
| record assente | nessuna authority esistente                         | tenta la creazione esclusiva |
| `active`       | processo vivo e fingerprint coerente                | startup bloccato             |
| `stale`        | PID morto oppure PID riciclato verificato           | record reclamabile           |
| `unknown`      | entry, record, identità o processo non verificabili | startup bloccato fail-closed |

Esempi che producono `unknown` includono entry inattese, JSON malformato, schema o progetto invalidi, mismatch delle identità canoniche, record illeggibile e impossibilità di verificare l'identità del processo.

Un record `unknown` non viene eliminato in modo aggressivo. Un record `stale` viene rimosso soltanto dopo una nuova lettura che conferma che il contenuto non è cambiato.

## Acquisizione

`createMatchHistoryWriterAuthority()` costruisce la primitive senza creare lo storage. Gli effetti sul filesystem iniziano con `acquire()`.

L'acquisizione:

1. risolve anticipatamente le identità canoniche, anche se lo storage non esiste ancora;
2. verifica il processo corrente e il suo start fingerprint;
3. crea la directory dell'authority, se necessaria;
4. ricalcola le identità e blocca l'acquisizione se sono cambiate;
5. scansiona e reclama soltanto record `stale` verificati;
6. blocca in presenza di record `active` o `unknown`;
7. crea il proprio record con scrittura esclusiva `wx` e permessi `0600`;
8. riesegue scansione e verifica dopo la creazione per chiudere le race concorrenti.

```txt
record assente
→ create esclusiva
→ verifica post-create
→ acquired

solo record stale verificati
→ reclaim conservativo
→ create esclusiva
→ verifica post-create
→ reclaimed

record active o unknown
→ acquisizione negata
→ startup bloccato

creazione concorrente o più owner attivi
→ contended
→ startup bloccato
```

Acquire e release sono serializzati nella singola istanza. Chiamate concorrenti duplicate dello stesso tipo condividono l'operazione in corso; un acquire ripetuto dall'owner già verificato restituisce `already_owned`.

Gli esiti pubblici sono strutturati e bounded. Un'acquisizione positiva richiede:

```txt
ok: true
acquired: true
state: acquired | reclaimed | already_owned
backendInstanceId: <UUID>
```

Ogni esito non positivo impedisce al bootstrap di proseguire.

## Ordine di bootstrap

`createApp()` costruisce applicazione, middleware e route senza acquisire authority, eseguire recovery o aprire il listener.

La sequenza di `startServer()` è:

```txt
createApp()
→ createMatchHistoryWriterAuthority()
→ acquire()
→ runPendingCommitRecovery(...)
→ apertura listener
→ attesa listener ready
→ registrazione shutdown
```

La recovery non viene eseguita se l'acquisizione non restituisce un risultato positivo e verificabile. Un secondo backend bloccato dall'authority non raggiunge recovery o listener e quindi non avvia tracking né scritture canoniche.

Dopo un'acquisizione positiva, il bootstrap tenta un release verificato nei failure path successivi:

```txt
recovery rigettata
recovery fatal
listen sincrono fallito
errore listener prima della readiness
registrazione shutdown fallita
```

Il fallimento del release viene registrato in forma bounded e non sostituisce l'errore primario del bootstrap.

La writer authority protegge l'esecuzione della recovery, ma non possiede il protocollo di journal, marker, target verification o repair. Quel contratto appartiene al documento [Commit journal e recovery](./02-commit-journal-and-recovery.md).

## Shutdown, drain e release

Il backend mantiene l'authority per l'intero runtime. Lo shutdown attiva una barrier terminale, ferma tracker e scheduler e attende tutte le operazioni di tracking registrate prima del release.

```txt
shutdown richiesto
→ server.close richiesto
→ terminal tracker barrier
→ stop tracker e scheduler
→ tracker drain avviato
→ cleanup processi Python
→ tracker drain completato
→ listener chiuso
→ release verificato
→ uscita processo
```

Il release è consentito soltanto se il drain restituisce:

```txt
ok: true
drained: true
activeOperations: 0
```

Se il drain rigetta o restituisce un risultato non positivo o invalido:

```txt
tracker_drain_failed
→ authority retained
→ nessun release
→ shutdown prosegue
```

Il force timeout provoca l'uscita senza rilasciare anticipatamente l'authority. Il record residuo viene classificato dal backend successivo mediante la verifica di PID e start fingerprint.

Segnali di shutdown ripetuti condividono la stessa Promise: drain, cleanup, release e uscita non vengono duplicati.

## Release verificato

`release()` rimuove soltanto il record dell'istanza chiamante. Prima della cancellazione verifica:

- schema e nome del record;
- `backendInstanceId` e PID;
- processo corrente ancora verificabile;
- `processStartFingerprint` ancora coerente;
- repository identity e storage identity correnti;
- contenuto del record invariato fra lettura e cancellazione.

Un'istanza non può cancellare il record di un altro owner né un record proprio sostituito o modificato. Se il record è già assente, il release è idempotente e restituisce `absent`.

Un release fallito dopo drain positivo viene loggato in forma bounded e non impedisce la conclusione dello shutdown.

## Invarianti e topologie non supportate

L'authority applica questi invarianti:

- una sola authority `active` per la stessa repository identity e storage identity;
- acquire prima di recovery, listener, tracking e scritture runtime;
- classificazione `unknown` fail-closed;
- reclaim limitato ai record `stale` verificati;
- release soltanto da parte dell'owner verificato;
- drain completo prima del release durante lo shutdown ordinario;
- nessun release anticipato su drain fallito o force timeout.

Non sono supportati più writer diretti sulla stessa directory, inclusi:

```txt
PM2 cluster con storage condiviso
repliche Docker con storage condiviso
worker separati che scrivono match_history
trading engine separato che scrive file canonici
backend manuale su porta alternativa con lo stesso storage
```

L'authority blocca queste concorrenze; non coordina commit distribuiti e non trasforma il filesystem locale in storage multi-writer.

## Confini e sicurezza

Questo documento non definisce:

- il protocollo interno del commit journal e della recovery;
- gli schema di timeline e history;
- i contratti HTTP Match, Betfair o Evidence;
- l'ownership dei processi Python;
- il lock del launcher;
- retention, cache o cleanup operativo;
- logiche Source Identity, Market Reactions o UI.

I risultati e i log dell'authority restano bounded. Non espongono path locali, stack, payload raw o dettagli non previsti; l'authority record conserva soltanto le identità necessarie al contratto process-level.

## Verifica

Eseguire dalla root del repository:

```powershell
node backend/src/runtime/matchHistoryWriterAuthority.test.mjs
node backend/src/server.test.mjs
```

La suite della primitive verifica, fra l'altro:

- import e factory senza side effect sullo storage;
- schema e identità del record;
- blocco del secondo writer vivo;
- reclaim di owner morto o PID riciclato;
- conservazione dei record `unknown`;
- release limitato al proprio record e idempotenza;
- indipendenza da current working directory e porta;
- contesa fra acquisizioni concorrenti;
- serializzazione di acquire e release.

La suite server verifica, fra l'altro:

- acquire prima di recovery e listener;
- release nei failure path del bootstrap;
- listener ready prima della registrazione shutdown;
- due bootstrap sullo stesso storage reale con il secondo bloccato;
- tracker drain prima del release;
- authority retained su drain fallito o risultato invalido;
- nessun release sul force timeout;
- idempotenza dei segnali ripetuti.

Questi test automatici non equivalgono a un collaudo operativo manuale con due backend reali concorrenti, riavvio del processo e filesystem non simulato.

## Documenti collegati

- [Commit journal e recovery](./02-commit-journal-and-recovery.md)
- [Timeline e history](./01-timelines-and-history.md)
- [Runtime locale](../../operations/01-local-runtime.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
- [Tracking live](../sofa/01-live-tracking.md)
