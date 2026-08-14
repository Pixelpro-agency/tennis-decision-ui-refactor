# Controllo tracking live

## Scopo

Questo runbook descrive cosa verificare durante una sessione live, come fermare il tracking mantenendo attivo il backend e come distinguere lo stop ordinario dallo shutdown completo del processo.

Non descrive il funzionamento interno dello scheduler, del lifecycle scraper o della persistenza.

## Prima dell’avvio

Prima di avviare una sessione verificare:

```txt
backend disponibile
→ Chrome CDP disponibile quando si usa modalità CDP
→ URL SofaScore valido
→ URL Betfair valido se previsto
→ Graph URL valide se previste
→ configurazione sessione coerente
```

Il tracking può funzionare con solo SofaScore.

Con URL Betfair, il gate Source Identity parte normalmente in `collecting`.

## Sessione attiva

Durante il tracking controllare separatamente:

| Area                 | Cosa osservare                                                  |
| -------------------- | --------------------------------------------------------------- |
| Source Identity Gate | `phase`, `persistence`, `updatedAt`, eventuale errore sintetico |
| SofaScore            | Score, timestamp e timeline solo dopo persistenza autorizzata   |
| Betfair              | Health, timestamp ultimo tick, ladder e runner                  |
| Evidence             | Disponibile solo quando esistono timeline canoniche             |
| Money Flow           | Nuovi timestamp, punti validi e anomalie                        |
| Frontend             | Shell attiva, semaforo Source Identity coerente, waiting screen finché il bootstrap non ha prodotto `dashboardContentReady` e `dashboardData`; Source Identity ne determina testo e tono, non lo sblocco diretto |

Un valore visibile non dimostra automaticamente che sia recente, completo o tradabile.

## Verifica minima di una sessione

La verifica deve distinguere tre piani che possono coesistere senza rappresentare lo stesso stato:

| Piano                      | Authority corrente                                               | Limite operativo                                                                          |
| -------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Sessione live corrente     | `trackingSessionId` e Source Identity Gate della sessione attiva | Una timeline con lo stesso `eventId` può essere precedente allo Start corrente            |
| Stato persistito           | Timeline, history ed Evidence ricostruita                        | Dimostra che esistono dati canonici, non che il tracker corrente li abbia appena prodotti |
| Ultimo stato frontend noto | View model conservato dal frontend                               | Deve essere presentato come `last-known` o fermo, non come aggiornamento live             |

Ordine consigliato:

```txt
event ID SofaScore corretto
→ GET source-identity-status
→ collecting oppure pending: nessuna nuova timeline/history della sessione corrente; eventuali file con lo stesso eventId possono essere preesistenti
→ recording: bootstrap canonico completato e timeline disponibili
→ not-applicable: persistenza SofaScore consentita; attendere il primo campione valido prima di richiedere la timeline
→ health Betfair coerente, quando previsto
→ Evidence disponibile dopo persistenza canonica
→ aggiornamento grafici Money Flow
```

Endpoint utili:

```txt
GET /api/match/:eventId/source-identity-status
GET /api/match/:eventId/json
GET /api/betfair/:eventId/latest
GET /api/betfair/:eventId/json
GET /api/evidence/:eventId/latest
GET /api/betfair/log
```

## Source Identity durante il live

Lo stato live autoritativo è:

```txt
GET /api/match/:eventId/source-identity-status
```

| Fase             | Cosa verificare                                                                                                                                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collecting`     | Dati ancora incompleti; nessuna persistenza                                                                                                                                                                                                                                                     |
| `pending`        | Giocatori e runner presenti; conferma manuale ammessa                                                                                                                                                                                                                                           |
| `recording`      | Persistenza canonica attiva                                                                                                                                                                                                                                                                     |
| `mismatch`       | Tick causale bloccato; il callback ferma i tracker logici, preserva il gate mismatch, invalida la generation e termina il Betfair tracking attivo. Le operazioni SofaScore già in volo restano protette dalla verifica della `trackingSessionId`; il solo stop logico non prova un drain fisico |
| `not-applicable` | Sessione SofaScore senza Betfair                                                                                                                                                                                                                                                                |

La conferma manuale è ammessa solo in `pending`.

```txt
POST /api/evidence/:eventId/source-identity/confirm
```

`GET /api/evidence/:eventId/latest` può restituire `404` durante `collecting` o `pending`: non è un errore del gate.

## Stop Live Tracking

Per fermare il live usare il controllo Overview o:

```txt
POST /api/match/stop
```

Flusso backend ordinario:

```txt
stopAllMatchTrackers()
→ tracker e scheduler fermati
→ terminatePythonProcesses("tracking")
→ generation tracking invalidata
→ sofa_tracking terminato
→ betfair_tracking terminato
→ attesa bounded
→ betfair_login preservato
→ backend, frontend e CDP preservati
→ writer authority mantenuta
```

La risposta include `pythonCleanup`; lo schema completo resta nell’owner [API Match](../api/01-match.md).

Lo stop logico e il completamento fisico sono osservabili separatamente, mentre `body.ok` riassume entrambi:

```txt
stopped = true
→ stopAllMatchTrackers() completato

pythonCleanup.ok = true
+ pythonCleanup.remaining = 0
→ cleanup dei processi Python tracking completato

body.ok = true
→ stop logico completato e cleanup Python completato

activeTrackerOperations = 0 oppure drain esplicito
→ quiescenza delle operazioni Node
```

Lo Stop ordinario non esegue il drain terminale usato dallo shutdown. Di conseguenza, `body.ok: true` non dimostra da solo che ogni operazione Node già avviata sia terminata.

Lo stop dei tracker è globale e idempotente. L’eventuale `eventId` è informativo. Non cancella history, timeline, journal, writer authority, conferme Source Identity persistite, URL o profilo browser.

Dopo lo stop ordinario:

```txt
backend resta attivo
→ writer authority resta posseduta dal backend
→ terminal tracker barrier non viene attivata
→ l’API consente un nuovo Start
→ il nuovo Start riceve una nuova trackingSessionId
→ le callback della sessione precedente vengono rifiutate quando non corrispondono alla sessione corrente
```

Quando la risposta API ha `ok: true`, il controllo Stop nell’Overview ferma il polling SofaScore, imposta la sessione come inattiva e mantiene visibile la shell con lo stato di tracking fermo. Poiché `sessionActive` diventa falso, anche i poller Betfair, Evidence e Source Identity vengono disattivati; i loro dati correnti non costituiscono quindi una superficie live post-Stop. Il view model può conservare l’ultimo dashboard noto, che deve essere trattato come `last-known`.

Se la risposta non ha `ok: true`, per esempio perché il cleanup Python è incompleto, il client tratta lo Stop come fallito: mostra lo stato di errore e non applica la transizione frontend appena descritta. I campi `stopped` e `pythonCleanup` della risposta restano necessari per distinguere ciò che il backend ha comunque completato.

Quando lo Stop backend ha esito positivo, il percorso di ritorno al form cancella inoltre la sessione confermata, nasconde la shell e reimposta il bootstrap. È quindi distinto dal controllo Stop dell’Overview.

Il Source Identity Gate è uno stato live in memoria: lo Stop lo rimuove e `GET /api/match/:eventId/source-identity-status` può quindi restituire `404`. Timeline ed Evidence persistite restano leggibili dai rispettivi endpoint, ma non provano l’esistenza di una sessione corrente.

Questa distinzione è obbligatoria:

```txt
Stop Live Tracking
≠
shutdown backend
```

## Controllo tramite Runtime Health

Usare `GET /api/health`.

Prima dello stop possono essere presenti ruoli tracking. Dopo una completion riuscita (`pythonCleanup.ok: true` e `pythonCleanup.remaining: 0`):

```txt
sofa_tracking = 0
betfair_tracking = 0
stopping = 0
```

`scope=tracking` non termina `betfair_login`; il conteggio può comunque cambiare per il lifecycle autonomo del login. Se `pythonCleanup.remaining > 0`, il cleanup è incompleto e i contatori possono non essere ancora a zero.

I contatori del registry descrivono soltanto il lifecycle dei processi Python:

```txt
sofa_tracking = 0
+ betfair_tracking = 0
≠ prova di activeTrackerOperations = 0
```

Se `pythonCleanup.remaining > 0`, una seconda chiamata Stop non garantisce un nuovo tentativo fisico: per la stessa entry il registry riutilizza la `terminationPromise` già conclusa. Non usare terminazioni per porta o PID non owned; eseguire lo shutdown controllato oppure applicare la procedura prevista dall’owner operativo.

## Shutdown completo

Lo shutdown completo avviene tramite `Ctrl+C` o un segnale del processo backend.

```txt
Ctrl+C / segnale backend
→ server non accetta nuove richieste
→ terminal tracker barrier attivata
→ nessun nuovo tracker o update ammesso
→ stop tracker e scheduler
→ tracker drain delle operazioni SofaScore e Betfair già avviate
→ cleanup scope=all dei processi Python
→ listener chiuso
→ release writer authority
→ processo terminato
```

Il drain dei tracker viene avviato prima del cleanup Python; le due attività possono procedere nello stesso shutdown. Il rilascio della writer authority avviene soltanto dopo esito positivo del drain e chiusura del listener.

Se il drain fallisce o non è verificabile:

```txt
tracker_drain_failed
→ writer authority retained
→ processo comunque terminato
```

Il force timeout termina il processo senza rilascio anticipato della writer authority.

Il record residuo può essere recuperato dal backend successivo soltanto dopo la verifica positiva che il vecchio owner sia morto.

Lo shutdown duplicato condivide una singola procedura. Segnali ripetuti non duplicano tracker drain, cleanup Python, release o terminazione del processo. L’eventuale fallback launcher agisce soltanto sui PID owned registrati.

## Verifica automatica pertinente

I test associati verificano:

* risposta Stop con cleanup atteso e preservazione del ruolo login;
* esito top-level negativo quando lo stop dei tracker o il cleanup Python falliscono;
* idempotenza dello Stop senza processi tracking attivi;
* esposizione sicura dei contatori Python tramite Runtime Health;
* condivisione della prima procedura in caso di segnali di shutdown ripetuti;
* drain dei tracker, ordine dello shutdown e rilascio fail-closed della writer authority.

Queste verifiche automatiche non equivalgono a un collaudo manuale end-to-end con processi e browser reali.

## Regole operative

* Non usare `POST /api/match/stop` come smoke test.
* Non usare Stop Live Tracking per tentare di rilasciare la writer authority.
* Non chiudere Chrome dal Task Manager come procedura normale.
* Non cancellare manualmente `.writer_authority/` per risolvere un avvio bloccato.
* Non trattare l’ultimo tick Betfair come aggiornamento corrente dopo timeout o health stale.
* Non dedurre Source Identity dagli URL inseriti.
* Non modificare history o timeline per “sistemare” una sessione.
* Non creare manualmente timeline o history per aggirare `collecting`, `pending` o `mismatch`.
* Non dedurre lo stato Source Identity dalla sola disponibilità di Evidence.

## Documenti collegati

* [API Runtime Health](../api/05-runtime-health.md)
* [Runtime locale](./01-local-runtime.md)
* [Diagnostica Betfair](./03-betfair-diagnostics.md)
* [API Match](../api/01-match.md)
* [API Evidence](../api/03-evidence.md)
* [Tracking live](../modules/sofa/01-live-tracking.md)
* [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
* [Verifica live Source Identity](../../validations/source-identity-live-verification.md)
