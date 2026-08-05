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

| Area                 | Cosa osservare                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source Identity Gate | `phase`, `persistence`, `updatedAt`, eventuale errore sintetico                                                                                                                                                  |
| SofaScore            | Score, timestamp e timeline solo dopo persistenza autorizzata                                                                                                                                                    |
| Betfair              | Health, timestamp ultimo tick, ladder e runner                                                                                                                                                                   |
| Evidence             | Disponibile solo quando esistono timeline canoniche                                                                                                                                                              |
| Money Flow           | Nuovi timestamp, punti validi e anomalie                                                                                                                                                                         |
| Frontend             | Shell attiva, semaforo Source Identity coerente, waiting screen finché il bootstrap non ha prodotto `dashboardContentReady` e `dashboardData`; Source Identity ne determina testo e tono, non lo sblocco diretto |

Un valore visibile non dimostra automaticamente che sia recente, completo o tradabile.

## Verifica minima di una sessione

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

| Fase             | Cosa verificare                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collecting`     | Dati ancora incompleti; nessuna persistenza                                                                                                                                                          |
| `pending`        | Giocatori e runner presenti; conferma manuale ammessa                                                                                                                                                |
| `recording`      | Persistenza canonica attiva                                                                                                                                                                          |
| `mismatch`       | Tick causale bloccato; il callback ferma i tracker logici, preserva il gate mismatch, invalida la generation e termina il Betfair tracking attivo; un eventuale SofaScore in flight diventa obsoleto |
| `not-applicable` | Sessione SofaScore senza Betfair                                                                                                                                                                     |

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

Lo stop è globale e idempotente. L’eventuale `eventId` è informativo. Non cancella history, timeline, journal, writer authority, conferme Source Identity, dashboard, URL o profilo browser.

Dopo lo stop ordinario:

```txt
backend resta attivo
→ writer authority resta posseduta dal backend
→ terminal tracker barrier non viene attivata
→ un nuovo Start successivo è consentito
```

Il controllo Overview ferma esplicitamente il polling SofaScore frontend. Gli hook Betfair, Evidence e Source Identity possono restare montati e leggere dati persistiti, ma non riavviano il tracking backend.

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

Il drain viene avviato prima del cleanup Python; il release avviene soltanto dopo drain positivo e chiusura del listener.

Se il drain fallisce o non è verificabile:

```txt
tracker_drain_failed
→ writer authority retained
→ exit comunque
```

Il force timeout:

```txt
shutdown_force_timeout
→ exit
→ nessun release anticipato
```

Il record residuo può essere recuperato dal backend successivo soltanto dopo la verifica positiva che il vecchio owner sia morto.

Lo shutdown duplicato condivide una singola procedura. Segnali ripetuti non duplicano tracker drain, cleanup Python, release o exit. L’eventuale fallback launcher agisce soltanto sui PID owned registrati.

## Verifica live 9B

La verifica live è stata eseguita in due sequenze distinte:

```txt
sequenza Stop
→ ruoli tracking terminati
→ nessun respawn per 10 secondi

sequenza login-only successiva
→ started
→ already_active
→ un solo PID ed executionId
→ tracking ancora fermo
```

Non è stata esercitata direttamente nella stessa sequenza la condizione `login già attivo → Stop → login ancora attivo`. La preservazione del ruolo `betfair_login` da `scope=tracking` resta verificata dal contratto e dai test automatici.

IMPL-015 ha aggiunto test automatici per tracker drain, ordine shutdown, release fail-closed, segnali ripetuti e force timeout. Non è stato eseguito un collaudo manuale con due backend reali concorrenti.

Non sono riportati event ID, giocatori o dati reali della sessione.

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

* [API Runtime Health](../api/06-runtime-health.md)
* [Runtime locale](./01-local-runtime.md)
* [Diagnostica Betfair](./03-betfair-diagnostics.md)
* [API Match](../api/01-match.md)
* [API Evidence](../api/03-evidence.md)
* [Tracking live](../modules/sofa/01-live-tracking.md)
* [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
* [Verifica live Source Identity](../../validations/source-identity-live-verification.md)
