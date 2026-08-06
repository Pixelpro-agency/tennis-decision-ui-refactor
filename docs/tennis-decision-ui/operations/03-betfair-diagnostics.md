# Diagnostica Betfair

## Scopo

Questo runbook serve per diagnosticare:

```txt
timeout scraper
campioni Betfair tecnicamente non utilizzabili
health stale, degraded o alert
ladder ferma o degradata
Money Flow non aggiornato
login Betfair assente
Graph URL non utilizzabili
frontend Vite disconnesso
persistence integrity `partial_persistence` o `recovery_failed`
risposte `409 persistence_integrity`
```

Non usare questo documento per modificare algoritmi, timeline, history, journal, recovery o Source Identity.

La diagnostica Betfair osserva `integrity` solo come stato read-only della persistenza. Non esegue recovery, non scrive journal, non ricostruisce history o timeline e non modifica `marketState`.

## Timeout

Un errore simile a:

```txt
Scraper timed out after 90000ms
```

significa che il backend non ha ricevuto un risultato Betfair entro il timeout corrente.

Durante un timeout restano invariati i dati derivati dall’ultimo tick canonico:

```txt
total matched
ladder
history
Money Flow
ultimo timestamp Betfair
```

Il runtime registra però un nuovo `lastScrapeAttemptAt` e un errore tecnico.

Il payload `latest` può quindi cambiare in:

```txt
health.status = yellow
health.label = DEGRADED
```

pur senza creare un tick canonico, una riga history o nuovo volume.

Non duplicare l’ultimo tick e non creare valori sintetici per rendere il grafico “vivo”.

Un timeout non equivale a:

```txt
mercato concluso
campione canonico nuovo
errore Source Identity
```

## Classificazione iniziale

| Sintomo                                                                                 | Interpretazione iniziale                                                                          |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `event_status.hasFinished === true`                                                     | Mercato concluso; polling Betfair fermato                                                         |
| `404` + health `unknown`                                                                | Nessuna timeline e nessun errore runtime attivo                                                   |
| `404` + health `yellow/DEGRADED`                                                        | Nessuna timeline, ma retry tecnico attivo                                                         |
| `409 persistence_integrity`                                                             | Timeline assente o non leggibile per persistenza incompleta nota                                  |
| `integrity.status = partial_persistence`                                                | Commit canonico incompleto noto; non è health, freshness o runtime scraper                        |
| `integrity.status = recovery_failed`                                                    | Recovery bootstrap fallita; serve validazione controllata                                         |
| yellow/DEGRADED                                                                         | Errore tecnico runtime attivo; nessun alert login strutturato                                     |
| yellow/STALE                                                                            | Tick canonico o ladder usabile oltre 45 secondi, senza segnale auth strutturato                   |
| Tick recente + ladder stale                                                             | Dati mercato recenti, ladder degradata; non equivale a mercato fermo                              |
| red/ALERT                                                                               | Autenticazione Graph sospetta nel tick corrente o in un tick canonico recente; alert login attivo |
| `error`, `api_error`, runner mancanti o vuoti, `total_matched` assente, invalido o zero | Campione tecnico scartato; polling da ritentare                                                   |
| Timeout o DNS                                                                           | Fetch non riuscito; polling da ritentare                                                          |
| Errore Graph URL isolato con runner e volume affidabili                                 | Non rende da solo inutilizzabile il campione                                                      |
| Grafico fermo ma ladder visibile                                                        | History, timestamp o point validi non avanzano                                                    |
| Pagina non aggiornata                                                                   | Connessione Vite persa                                                                            |

Il solo stato `red/ALERT` non dimostra che il tick corrente sia una transizione `status-only`. La conferma richiede `latest.diagnostics.statusOnlyGraphLogin === true`; in sua assenza, il rosso indica comunque un segnale auth strutturato corrente o recente.

Soglia freshness:

```txt
45 secondi
→ ancora non stale

oltre 45 secondi
→ stale
```

I campioni tecnici scartati vengono diagnosticati tramite eventi strutturati e health; non producono un nuovo tick canonico.

## Persistence integrity diagnostica

`integrity` descrive lo stato read-only della persistenza canonica Betfair.

Valori pubblici:

```txt
no_known_partial
partial_persistence
recovery_failed
```

Interpretazione diagnostica:

| Stato                  | Significato operativo                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| `no_known_partial`     | Nessuna persistenza incompleta nota per la source Betfair                     |
| `partial_persistence`  | Esiste un commit incompleto noto su history, timeline o entrambi              |
| `recovery_failed`      | Il bootstrap recovery ha tentato il recupero e non lo ha completato           |

`integrity` non è un sinonimo di:

```txt
health
freshness
Graph health
runtime scraper
CDP status
Money Flow
ladder reliability
Source Identity mismatch
```

Quando una lettura Betfair risponde con:

```txt
409 persistence_integrity
```

il problema non va classificato come semplice `404`, timeout scraper, logout Graph, market finished o errore frontend.

Il payload deve essere usato solo per diagnosi sicura:

```txt
integrity.status
integrity.reason
integrity.source
integrity.commitId
integrity.affectedDocuments
```

Non devono essere esposti o copiati in diagnostica:

```txt
payload journalizzati
path locali
target filesystem
metadata journal interni
stack trace
contenuto raw di history o timeline parziali
```

La diagnostica non deve tentare repair. La recovery appartiene al bootstrap e il controllo operativo appartiene a Validazione e rollback.

## CDP runtime

La porta CDP si legge dal manifest runtime:

```txt
manifest
→ selectedPort e url del servizio cdp
→ <cdp-url>
→ stesso valore in preflight, login e tracking
```

`9222` è soltanto la porta preferita del launcher. Non assumere un endpoint fisso.

## Runtime Health

`GET /api/health` espone:

```txt
pythonProcesses.active
pythonProcesses.stopping
pythonProcesses.byRole
pythonProcesses.entries
```

```txt
betfair_login > 1
→ duplicazione anomala

più entry betfair_tracking contemporanee
→ non bastano da sole a provare una sovrapposizione
→ correlare le entry con gli eventi strutturati del flusso interessato

stopping > 0 temporaneo
→ cleanup in corso

pythonCleanup.remaining > 0 nella risposta Stop
→ cleanup incompleto
```

Non copiare dettagli privati delle entry.

## Eventi runtime strutturati

Eventi verificati nel codice:

```txt
login_spawn_requested
login_spawn_ready
login_already_active
login_runtime_conflict
tracking_start
tracking_stop
tracking_cleanup_complete
python_spawn_requested
python_spawn_ready
python_terminate_requested
python_terminate_complete
recovery_complete
recovery_fatal
shutdown_requested
python_cleanup_complete
shutdown_complete
```

`GET /api/betfair/log` usa lettura bounded, redazione, `Cache-Control: no-store` e path fisso non controllabile dalla richiesta.

## Sequenza diagnostica

### 1. Verificare backend e CDP

Leggere `backend.baseUrl` e `cdp.url` dal manifest runtime, quindi costruire:

```txt
<backend-url>
<cdp-url>
```

Usare lo stesso `<cdp-url>` in preflight, login e tracking.

```powershell
Invoke-RestMethod "<backend-url>/api/test/health"

Invoke-RestMethod `
  -Method Post `
  -Uri "<backend-url>/api/test/cdp" `
  -ContentType application/json `
  -Body '{"cdpUrl":"<cdp-url>"}'
```

Se CDP fallisce, non classificare il problema come Money Flow o Evidence. `9222` è soltanto la porta preferita del launcher.

### 2. Verificare il payload latest

Usare backend e CDP scelti dalla sessione:

```powershell
Invoke-RestMethod `
  "<backend-url>/api/betfair/<eventId>/latest?mode=cdp&cdpUrl=<cdp-url-encoded>"
```

Controllare:

```txt
ok
latestTimestamp
health.status
health.message
health.timestamps
health.metrics
health.checks
moneyFlowHistory
metadata.updatedAt
integrity
```

Controllare in particolare:

```txt
health.timestamps.lastScrapeAttemptAt
health.timestamps.lastSuccessfulScrapeAt
health.timestamps.lastCanonicalTickAt
health.timestamps.lastUsableLadderAt
health.timestamps.lastValidVolumeAt
health.timestamps.lastTechnicalErrorAt

health.metrics.latestBetfairAgeSec
health.metrics.latestUsableLadderAgeSec
health.metrics.technicalErrorActive
health.metrics.lastTechnicalErrorReason

integrity.status
integrity.reason
integrity.source
integrity.commitId
integrity.affectedDocuments
error = persistence_integrity
```

Se il payload espone `integrity`, interpretarlo prima di confrontare health e Money Flow.

```txt
integrity.status = no_known_partial
→ continuare la diagnostica ordinaria

integrity.status = partial_persistence
→ commit canonico incompleto noto
→ non classificare come health degraded
→ non forzare nuovi tick

integrity.status = recovery_failed
→ recovery bootstrap non riuscita
→ passare a validazione controllata
→ non cancellare journal manualmente
```

Controllare il contratto Money Flow:

```txt
moneyFlowHistory.series
series[].selectionId
series[].points[].timestamp ISO
assenza di serie per runner senza selectionId
```

Per ogni point utile, controllare:

```txt
matchedVolume
runnerMatchedDelta
marketMatchedDelta
validForDisplay
invalidVolume
anomaly
reason
validationReasons
```

Uno scrape riuscito non equivale a un tick canonico recente o a un commit completo.

### 3. Verificare timeline e log

```powershell
Invoke-RestMethod "<backend-url>/api/betfair/<eventId>/json"

Invoke-RestMethod "<backend-url>/api/betfair/log"
```

Se `/json` risponde con `409 persistence_integrity`, non trattare la risposta come timeline semplicemente assente.

```txt
409 persistence_integrity
→ persistenza incompleta nota
→ leggere solo integrity pubblica
→ non eseguire recovery dalla route
→ non modificare file canonici
```

Confrontare:

```txt
ultimo tick timeline
↔ latestTimestamp
↔ lastCanonicalTickAt
↔ lastUsableLadderAt
↔ lastSuccessfulScrapeAt
↔ ultimo log scraper
```

Regola operativa:

```txt
successful scrape recente
≠
tick canonico recente
≠
commit canonico completo
```

Uno scrape riuscito aggiorna il runtime del tracker, ma non rende fresco un tick canonico vecchio e non conferma da solo un commit incompleto.

Per un retry identico o un `regressive_sample` ordinario:

```txt
nessuna nuova history
→ nessuna nuova timeline
→ nessun update baseline
```

Eccezione stretta per logout Graph esplicitamente rilevato:

```txt
diagnostics.graphLoginRequired = true
+ nessuna riga ladder dalle Graph URL
+ regressive_sample
+ tick canonico precedente
→ tick status-only append alla timeline Betfair
→ latest aggiornato
→ baseline runner e mercato invariato
→ nessuna riga raw del sample regressivo nella history
```

Non modificare manualmente timeline, history o journal per “forzare” il recupero.

### 4. Verificare Graph URL

Eseguire la verifica su due livelli distinti.

```txt
1. Preflight backend
→ POST /api/test/graph-urls
→ controllo preliminare
→ non prova che lo scraper Python accetti la URL

2. Validazione scraper Python
→ URL diretta https://graphs.betfair.it/<marketId>/<selectionId>/0
→ marketId uguale a market_info.market_id
→ selectionId presente nei runner API
→ selectionId non duplicato nella stessa esecuzione
```

| Reason                               | Interpretazione                          | Azione                                        |
| ------------------------------------ | ---------------------------------------- | --------------------------------------------- |
| `bad_graph_url_invalid`              | Schema, host, path, view o ID non validi | Correggere la URL diretta                     |
| `bad_graph_url_unsupported_endpoint` | URL `runnerChartData`                    | Recuperare la URL diretta ladder              |
| `bad_graph_url_market_mismatch`      | URL di un altro mercato                  | Usare una Graph URL del mercato corrente      |
| `bad_graph_url_selection_not_found`  | Selezione assente nei runner API         | Verificare mapping e disponibilità API        |
| `bad_graph_url_duplicate_selection`  | Selezione già accettata                  | Rimuovere la URL duplicata                    |
| `no_ladder_rows`                     | Mapping valido ma nessuna riga estratta  | Verificare login, stato mercato e diagnostica |
| `auth_suspected`                     | Login richiesto                          | Usare la procedura Login Betfair              |

Le failure di parser o mapping:

```txt
non aprono una nuova pagina browser
→ non chiamano l’estrattore ladder
→ non fermano il ciclo sulle URL successive
```

`auth_suspected` è un caso diverso: avviene dopo l’apertura di una Graph URL valida, quando la pagina segnala login richiesto.

```txt
login richiesto
→ diagnostics nel risultato raw
→ graph_diagnostics.authSuspected = true
→ interruzione delle Graph URL rimanenti
```

Quando il logout Graph soddisfa anche le condizioni di persistenza, il backend aggiunge un tick canonico `status-only` che conserva runner e mercato dell’ultimo tick valido.

Nel payload `latest`, verificare:

```txt
latest.diagnostics.graphLoginRequired = true
latest.diagnostics.statusOnlyGraphLogin = true
latest.graphHealth.status = auth_suspected

health.status = red
health.alert = true
```

Questo caso è distinto sia da `yellow/STALE` sia da `yellow/DEGRADED`: il primo segnala freshness scaduta, il secondo un errore tecnico runtime. Un errore rete/API o un’assenza feed non deve essere classificato come logout Betfair.

Una Graph URL valida non garantisce login attivo, ladder aggiornata o Money Flow valido.

Una ladder assente o non Graph URL non invalida da sola un volume coerente quando runner delta e market delta sono validi.

### 5. Verificare frontend

Se Vite segnala disconnessione:

```txt
connessione Vite persa
→ pagina potenzialmente stale
→ attendere riconnessione o ricaricare
→ verificare di nuovo latest e timeline
```

Non classificare un grafico come difettoso prima di verificare che il frontend riceva nuovi timestamp server.

Per il Money Flow verificare:

```txt
matchedVolume positivo e validForDisplay
→ una barra neutra sopra lo zero

invalidVolume, anomaly o empty slot
→ nessuna barra

hover
→ VOLUME ABBINATO: <importo> EUR
```

Non devono comparire barre Back, Lay, WOM, pressure, trend o volume non attribuito.

## Redazione operativa

Non devono comparire URL complete, WebSocket completo, `profileDir`, command line, Authorization, Cookie, token, password, app key, stack raw o `Error` object raw.

Le verifiche usano fixture sintetiche o redatte, mai segreti reali.

## Persistenza incompleta e recovery

Quando compare:

```txt
integrity.status = partial_persistence
```

la diagnosi deve confermare se il problema riguarda history, timeline o entrambi tramite `affectedDocuments`.

```txt
affectedDocuments contiene history
→ possibile history incompleta

affectedDocuments contiene timeline
→ possibile timeline incompleta

affectedDocuments vuoto o non canonico
→ payload da trattare come diagnostica degradata
```

Quando compare:

```txt
integrity.status = recovery_failed
```

non ripetere manualmente la recovery dalla diagnostica Betfair. Il runbook deve limitarsi a raccogliere lo stato pubblico e passare al percorso di validazione controllata.

Non fare:

```txt
edit manuale di history
edit manuale di timeline
cancellazione manuale del journal
creazione di tick sintetici
avvio implicito dello scraper da una lettura read-only
mutazione di marketState
```

Se serve distinguere assenza reale da persistenza incompleta:

```txt
404 + integrity no_known_partial
→ risorsa assente ordinaria

409 persistence_integrity
→ persistenza incompleta nota
```

## Diagnostica login runtime

Distinguere:

```txt
started
already_active
login_runtime_conflict
```

Non terminare manualmente il processo login.

## Login Betfair

Una ladder stale, un tick stale o un errore tecnico non bastano per classificare login mancante.

L’azione di login è appropriata soltanto quando esistono segnali auth strutturati, ad esempio:

```txt
latest.graphHealth.status = auth_suspected
oppure
latest.diagnostics.graphLoginRequired = true
oppure
health red / ALERT
```

`latest.diagnostics.statusOnlyGraphLogin = true` identifica inoltre la specifica transizione canonica `status-only`, ma non è richiesto per classificare l’alert auth.

Quando Graph indica login mancante:

```txt
salvare o annotare lo stato diagnostico non sensibile
→ aprire login window
→ completare login nel browser
→ lasciare Chrome CDP aperto
→ ripetere preflight CDP e Graph URL
→ attendere un nuovo scrape utilizzabile
→ verificare latest, timeline e UI
```

Il recovery è confermato quando un nuovo stato utilizzabile supera l’alert auth e l’interfaccia torna `Connected`. Non forzare timeline, history o tick per simulare il recupero.

Evidenza disponibile:

```txt
osservazione live manuale
→ logout Graph
→ health red con popup e audio osservati
→ login Betfair ripristinato
→ ritorno a Connected osservato
```

Non è archiviato un payload `/latest` post-fix e non esiste un test automatico PASS dedicato al tick `status-only`.

## Network capture diagnostica

La network capture non fa parte del percorso normale di tracking live né del fetch esplicito.

Rimane disabilitata finché non viene richiesta espressamente:

```txt
GET /api/betfair/odds?url=<url-encoded>&networkCapture=true
```

La forma abilitante è soltanto:

```txt
networkCapture=true
```

Query assente, `networkCapture=false` o qualunque altro valore mantengono la capture disabilitata.

Usarla soltanto per isolare un problema specifico del fetch.

Quando la capture è attiva, i dump mantengono condizioni di attivazione, filtri, soglie e schema del summary, ma devono salvare solo contenuti redatti.

Devono essere redatti prima della scrittura:

```txt
URL
header
metadata sensibili
errori
body JSON
body testuali
dati inseriti nel collector
```

Gli hash dei dump vengono calcolati sull’URL redatto.

Non condividere dump, payload, cookie, token, header sensibili o chiavi applicative reali.

La retention e la pulizia degli artefatti diagnostici appartengono al runbook dedicato.

## Redazione diagnostica

La diagnostica Betfair deve preservare struttura e dati business non sensibili, rimuovendo valori segreti o derivabili da segreti.

La redazione copre almeno:

```txt
query parameter sensibili
header sensibili case-insensitive
payload JSON annidati
testo libero diagnostico
JSON serializzato o non parseabile
Bearer token
authorization
cookie
api_key
token
appKey
app_key
APP_KEY
BETFAIR_APP_KEY
x-application
x-application-key
```

I valori redatti devono usare placeholder sicuri, ad esempio:

```txt
<REDACTED>
```

Quando il testo intercettato è JSON quotato, il risultato deve restare JSON parseabile.

I dati business non sensibili devono rimanere leggibili per la diagnosi:

```txt
eventId
marketId
selectionId
runner
quote
volumi
reason tecniche
contatori Graph URL
```

Il bridge Node/Python non deve registrare stdout raw, stderr raw, argomenti completi dello spawn, URL complete, ladder URL complete o messaggi raw del child process.

Sono consentiti log strutturali non sensibili:

```txt
mode
numero Graph URL
networkCapture
pid
durata
byte stdout/stderr
exit code
signal code
killed
reason tecnica
```

La validazione su diagnostica runtime reale resta una procedura controllata: non allegare né condividere segreti, cookie, dump o payload reali.

## Ripristino controllato

Quando il problema persiste:

```txt
verificare CDP
→ verificare classificazione health
→ verificare login solo con segnali auth strutturati
→ verificare Graph URL
→ controllare log
→ correggere la causa
→ lasciare il polling ritentare o avviare una nuova sessione se necessario
```

Per logout Graph con `red / ALERT`:

```txt
verificare il segnale auth strutturato
→ quando presente, usare statusOnlyGraphLogin per distinguere la specifica transizione status-only
→ completare login Betfair nel browser CDP
→ attendere un nuovo scrape utilizzabile
→ verificare che l’alert auth non sia più attivo
→ verificare UI Connected
```

Non trattare `STALE`, `DEGRADED` o un errore rete/API come prova di logout Graph.

Per un campione tecnico, timeout o DNS:

```txt
non classificare il mercato come finished
→ non cancellare timeline, history, journal o conferme Source Identity
→ non terminare manualmente Chrome
→ non duplicare tick per simulare attività
```

Per `partial_persistence` o `recovery_failed`:

```txt
non classificare come timeout scraper
→ non classificare come Graph health
→ non classificare come freshness stale
→ non classificare come Money Flow difettoso
→ non riparare dalla route read-only
→ passare a validazione controllata
```

Dopo più campioni tecnici consecutivi il tracking deve continuare.

## Condizioni per grafico aggiornato

Per un Money Flow aggiornato serve una serie `moneyFlowHistory` derivata dai tick Betfair canonici validi, fino agli ultimi 20:

```txt
timeline Betfair canonica con tick validi
→ integrity.status diverso da partial_persistence o recovery_failed
→ selectionId presente e coerente
→ match strict per String(selectionId)
→ nessun fallback per nome o indice
→ timestamp ISO nuovi
→ point validi per display
→ frontend connesso
```

Stesso nome con `selectionId` diverso, oppure `selectionId` assente, non deve ereditare flow o baseline precedente.

È un comportamento protettivo, non un errore del grafico.

Per una health Betfair non degradata servono:

```txt
tick canonico e ladder usabile non stale
→ mercato valido
→ ladder usabile
→ nessun errore tecnico runtime attivo
→ nessun segnale auth red
→ CDP non fallito, quando usato
```

La sola presenza di `partial_persistence` o `recovery_failed` non deve degradare automaticamente la health Betfair. Health e integrity restano campi distinti.

`lastValidVolumeAt` resta un timestamp diagnostico. La sua assenza non forza da sola health `yellow` o `red`.

Il frontend connesso serve a visualizzare dati aggiornati, ma non modifica la classificazione health backend.

Regole volume:

```txt
delta runner zero
→ valido, senza barra

delta runner negativo
→ invalido

delta raw assente
+ delta computed valido
→ volume utilizzabile

nessun delta valido
→ nessun volume visualizzabile
```

La ladder è diagnostica: non è un requisito per mostrare `matchedVolume` quando il point è coerente e valido.

## Documenti collegati

* [Controllo tracking live](./02-live-tracking-control.md)
* [Validazione e rollback](./04-validation-and-rollback.md)
* [Retention e cleanup](./05-retention-and-cleanup.md)
* [API Betfair](../api/02-betfair.md)
* [API Evidence](../api/03-evidence.md)
* [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
* [Validità tecnica campioni Betfair](../modules/betfair/02-technical-sample-validity.md)
* [Timeline e history](../modules/storage/01-timelines-and-history.md)
* [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
* [Validazione Graph URL Betfair](../modules/python/04-betfair-graph-url-validation.md)
* [UI Betfair e Market Reactions](../modules/frontend/03-betfair-and-market-reactions-ui.md)
