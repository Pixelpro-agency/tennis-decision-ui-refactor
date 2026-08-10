# Report documentale — `docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-021
Sequenza audit: 21/72
Documento analizzato: 02-live-polling-and-view-model.md
Percorso documento: docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md
Percorso report: Report documentale/21 - 02-live-polling-and-view-model.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: bc64d4565cfdcce5ee3976257af4833611aee2b1
Dimensione documento: 610 righe
Ruolo dichiarato: owner del polling frontend e del view model dashboard
Stato report: completato
```

Il documento è stato confrontato con:

- `frontend/src/App.jsx`;
- `frontend/src/hooks/useMatchPolling.js`;
- `frontend/src/hooks/useBetfairJson.js`;
- `frontend/src/hooks/useMarketReactionEvidence.js`;
- `frontend/src/hooks/useSourceIdentityGateStatus.js`;
- `frontend/src/hooks/useDashboardViewModel.js`;
- `frontend/src/hooks/useBetfairHealthAlerts.js`;
- `frontend/src/utils/dashboardConnections.js`;
- `frontend/src/types/dashboard.js`;
- `frontend/src/components/MarketReactionsPage.jsx`;
- `backend/src/routes/evidence.js`;
- test correnti `useMatchPolling.test.mjs`, `useBetfairJson.test.mjs`, `dashboardConnections.test.mjs`;
- i finding già registrati nei report Session Shell, Source Identity, Evidence Snapshot, Market Reactions e Data Lifecycle.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Polling Sofa HTTP classification: corretta
Polling Betfair timestamp server-side: corretto nel principio
Evidence stale-response guard: robusto
Source Identity stale-response guard: robusto
Match polling stale-response guard: assente
Betfair polling stale-response guard: assente
Abort su Match/Betfair cambio sessione: assente
Timer teardown Match/Betfair: non session-safe
Polling Betfair senza eventId: timer/no-op polling attivo
Session activation authority: non uniforme
Errore Match dopo dato valido: può lasciare backendData stale
dashboardConnections: può mostrare connected durante serverStatus error
View model: conserva dashboardData precedente quando backendData diventa null
Evidence integrity wrapper: scartato
Evidence lastUpdate: local fetch completion, non source timestamp
Evidence 404: integrity scartata e lastUpdate precedente non azzerato
Betfair fallback /json: può conservare health/history precedenti
Hook-local sessionId: non trackingSessionId backend
Test correnti Match/Betfair: testano helper, non il lifecycle React
Test diretti Evidence/Gate polling: assenti
Modifiche proposte: 10
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
```

Il documento è accurato nel descrivere molti contratti correnti:

- Sofa `404 → waiting`;
- Sofa `409 persistence_integrity → partial_persistence/recovery_failed`;
- Betfair usa timestamp server e non l'ora locale come freshness del dato;
- Evidence conserva soltanto `marketReactionEvidence`;
- Source Identity Gate ha polling separato da Evidence;
- frontend non legge journal e non esegue recovery;
- `useDashboardViewModel` non possiede ancora integrity;
- persistence integrity frontend è soltanto parzialmente implementata.

La criticità principale è però trasversale:

```text
i quattro poller non possiedono la stessa session-safety
```

Oggi:

```text
useMarketReactionEvidence
useSourceIdentityGateStatus
→ session generation locale
→ AbortController
→ active fetch lock
→ stale response guard
```

mentre:

```text
useMatchPolling
useBetfairJson
→ nessuna generation
→ nessun AbortController
→ nessun request ID
→ nessun stale response guard
```

Questa differenza è importante perché Match e Betfair alimentano direttamente:

- dashboard;
- connection state;
- health;
- Money Flow history;
- bootstrap UI.

---

# 1. `useMatchPolling` e `useBetfairJson` non sono session-safe

## Esito: gap critico

`useMatchPolling()` costruisce `fetchData()` sul corrente `eventId`, ma una fetch già partita non possiede:

```text
sessionId
requestId
AbortController
disposed guard
```

Quando:

```text
confirmedUrl / eventId cambia
```

React pulisce il timeout dell'effect precedente, ma non può annullare la fetch già in volo.

Scenario:

```text
sessione A
→ GET /api/match/A/json in flight

sessione B
→ effect nuovo
→ reset state
→ GET /api/match/B/json

risposta A arriva dopo
→ setData(A)
→ setLastUpdate(A)
→ setServerStatus(ok)
```

Quindi la risposta vecchia può sovrascrivere lo stato nuovo.

## Betfair

`useBetfairJson()` possiede la stessa vulnerabilità.

Le fetch:

```text
/latest
/json fallback
```

non sono cancellate e non verificano una generation catturata prima di fare `setData`, `setHealth`, `setIntegrity` o `setMoneyFlowHistory`.

La dipendenza `url` dell'effect provoca anche restart del polling, ma il valore `url` non viene usato come identity nelle richieste API; quindi un cambio config può creare un nuovo lifecycle mentre il vecchio fetch è ancora autorizzato a scrivere nello stesso hook state.

## Contrasto con Evidence/Gate

`useMarketReactionEvidence()` e `useSourceIdentityGateStatus()` possiedono già il pattern corretto:

```text
local session generation
+
AbortController
+
requestId
+
stale response guard
```

## Finding `FRONT-POLL-001` — uniformare la request/session safety dei poller Match e Betfair

**Priorità:** critica  
**Tipo:** stale response / session safety

### Modifica richiesta

Applicare a Match e Betfair un lifecycle equivalente a Evidence/Gate:

```text
local request generation
AbortController
request ID
active request ownership
stale response guard
cleanup su event/config change
```

### Coordinamento

La generation locale evita race React.

Non sostituisce:

```text
trackingSessionId
```

del target `IMPL-006`.

Le due authority hanno ruoli distinti.

---

# 2. Il teardown dei loop Match/Betfair può essere riattivato da una fetch già in corso

## Esito: cleanup incompleto

## Match

Il loop è:

```js
const loop = async () => {
    if (shouldPoll.current) {
        await fetchData(true);
    }

    pollTimeout.current = setTimeout(loop, pollingInterval);
};
```

Se il cleanup avviene mentre:

```text
await fetchData(true)
```

è ancora pendente:

```text
cleanup
→ clearTimeout(...)

fetch termina
→ vecchio loop riprende
→ setTimeout(loop, ...)
```

Quindi il vecchio lifecycle può rischedularsi **dopo** il cleanup.

Manca un:

```text
disposed
session generation check
```

prima di rischedulare.

## Stop

`stopPolling()` imposta:

```text
shouldPoll.current = false
```

ma il timer continua a svegliarsi e a rischedularsi.

Non esegue nuove fetch, ma il loop resta vivo finché l'effect non viene smontato.

## Betfair

Lo stesso pattern è presente.

In più, l'effect Betfair fa sempre:

```text
shouldPoll.current = true
setIsPolling(true)
```

anche se `sofaEventId` è vuoto.

`fetchData()` allora ritorna subito, ma il timer continua a girare a vuoto.

## Finding `FRONT-POLL-002` — rendere activation/teardown deterministici

**Priorità:** alta  
**Tipo:** polling scheduler lifecycle

### Target

Ogni poller deve avere:

```text
enabled/sessionActive
eventId valido
disposed/session guard
```

Il next timeout deve essere schedulato soltanto se:

```text
la stessa sessione è ancora attiva
```

### Stop

`stopPolling()` deve:

- impedire nuove fetch;
- cancellare il timeout;
- abortire la fetch corrente se il contratto lo richiede;
- lasciare `isPolling:false`.

### Coordinamento

Allineare con:

```text
FRONT-SESSION-003
```

che possiede l'authority di attivazione della sessione.

---

# 3. Errori Match possono lasciare dati vecchi come “correnti”

## Esito: current-vs-last-known non definito

Dopo una fetch Sofa riuscita:

```text
data = snapshot corrente
serverStatus = ok
```

Se la fetch successiva produce:

```text
HTTP 500
HTTP 400
network error
```

`useMatchPolling()`:

```text
setServerStatus(error)
```

ma non esegue:

```text
setData(null)
```

Quindi il vecchio `backendData` resta presente.

## `dashboardConnections`

Il resolver controlla prima:

```text
if (backendData) return connected
```

e soltanto dopo guarda `sofaServerStatus`.

Quindi:

```text
backendData vecchio
+
serverStatus error
→ connections.sofa.status = connected
```

Il TopBar/mapping può contemporaneamente vedere:

```text
serverStatus:error
```

mentre la connessione Sofa mostra:

```text
connected
```

## View model

Il vecchio `backendData` viene inoltre rimappato con il nuovo `serverStatus`.

Questo crea una UI ibrida:

```text
contenuto sportivo vecchio
+
status errore nuovo
+
connection connected
```

senza un contratto che distingua:

```text
current data
last-known data
```

## Betfair

Anche `useBetfairJson()` tende a conservare il dato precedente su errori non-integrity/non-404 durante auto polling.

## Finding `FRONT-POLL-003` — introdurre semantica current vs last-known

**Priorità:** critica  
**Tipo:** stale data presentation

### Decisione richiesta

Scegliere esplicitamente:

### A. fail-current

Su errore:

```text
current data → null
lastKnownData → eventuale campo separato
connection → not connected/current unavailable
```

### B. last-known visible

Il dato può restare visibile ma deve essere marcato:

```text
stale / last-known / unavailable-current
```

e non deve produrre:

```text
connected:true
```

### Invariante

```text
oggetto precedente ancora in state
≠ connessione corrente sana
```

---

# 4. `useDashboardViewModel` conserva `dashboardData` quando il backend corrente scompare

## Esito: limite documentato ma da risolvere

L'effect contiene soltanto:

```text
if (backendData) {
    setDashboardData(mapped)
}
```

Quando:

```text
backendData → null
```

non esegue:

```text
setDashboardData(null)
```

## Casi reali

Questo accade almeno per:

```text
404 waiting
409 partial_persistence
409 recovery_failed
```

perché `useMatchPolling()` imposta `data:null`.

La shell può quindi conservare il dashboard precedente.

## Relazione con bootstrap

`App.jsx` calcola:

```text
hasDashboardData
=
dashboardContentReady && Boolean(dashboardData)
```

Una volta che `dashboardContentReady` è true, il vecchio `dashboardData` può rimanere renderizzabile anche se il poller corrente non possiede più dati.

## Finding `FRONT-POLL-004` — reset/degrade del view model su perdita del dato corrente

**Priorità:** critica  
**Tipo:** view model integrity

### Target

Il view model deve ricevere abbastanza stato per distinguere:

```text
waiting
partial_persistence
recovery_failed
error
stopped
```

e decidere esplicitamente:

```text
clear
degrade
last-known
```

### Coordinamento

Allineare con:

```text
FRONT-SESSION-004
FRONT-SESSION-009
```

Non creare una seconda persistence authority separata.

---

# 5. Persistence integrity viene conservata dagli hook ma persa nel composition layer

## Esito: gap reale già riconosciuto dal documento

`useMatchPolling()` espone:

```text
integrity
```

`useBetfairJson()` espone:

```text
integrity
```

ma `App.jsx` non le destruttura.

`useMarketReactionEvidence()` invece scarta direttamente:

```text
payload.integrity
payload.sources
latest.dataQuality.persistenceComplete
```

e conserva soltanto:

```text
payload.latest.marketReactionEvidence
```

## 404 Evidence

Il backend `/latest` su `result.missing` restituisce anche:

```text
integrity
```

ma l'hook 404 conserva soltanto:

```text
reasons / error
```

e scarta integrity.

Quindi proprio un caso degradato può perdere l'informazione utile per spiegare il motivo.

## Finding `FRONT-POLL-005` — preservare e propagare l'integrity read model

**Priorità:** alta  
**Tipo:** persistence integrity propagation

### Target

Ogni hook deve mantenere il read model che gli serve senza ricostruire storage.

Per Evidence almeno:

```text
integrity
sources
persistenceComplete o equivalente backend-owned
```

quando presenti.

`App.jsx` deve poi produrre un'unica presentation authority frontend.

### Coordinamento

Riutilizzare:

```text
FRONT-SESSION-009
EVID-SNAPSHOT-003/004
MARKET-REACT-008
```

---

# 6. `lastUpdate` non ha la stessa semantica fra Sofa, Betfair ed Evidence

## Esito: collisione temporale

## Sofa

`lastUpdate` viene impostato con:

```text
new Date()
```

al completamento della fetch riuscita.

Quindi è:

```text
frontend fetch success time
```

non timestamp del tick Sofa.

## Betfair

`lastUpdate` usa invece:

```text
payload.latestTimestamp
oppure
timestamp reale della timeline
```

quindi rappresenta:

```text
server data time
```

## Evidence

`lastUpdate` torna a essere:

```text
new Date()
```

al completamento della fetch.

`MarketReactionsPage` visualizza:

```text
Updated HH:MM:SS
```

senza chiarire che si tratta del momento della fetch, non del timestamp dei dati Evidence.

## Stato stale dopo failure/404

Evidence non azzera `lastUpdate` quando:

```text
404
payload.ok !== true
network/500
```

nella stessa sessione.

Può quindi esistere:

```text
evidence:null
+
lastUpdate:<vecchio fetch success>
```

Sofa, su 404/409, conserva anch'esso il precedente `lastUpdate`.

## Finding `FRONT-POLL-006` — definire una semantica temporale uniforme

**Priorità:** alta  
**Tipo:** frontend time semantics

### Target

Distinguere campi come:

```text
fetchedAt
sourceUpdatedAt
lastDataTimestamp
lastSuccessfulReadAt
```

secondo ciò che ogni API può garantire.

### UI

Una label `Updated` deve dichiarare quale tempo sta mostrando.

Non usare un local fetch time come prova di freshness del dato.

### Coordinamento

Allineare con:

```text
EVID-SNAPSHOT-006
QUALITY-FLOW-001/002
```

---

# 7. Il fallback Betfair `/json` può combinarsi con health/history precedenti

## Esito: read model non atomicamente coerente

`useBetfairJson()` tenta prima:

```text
/latest
```

Se riceve `404`:

```text
/json fallback
```

`fetchJsonTimeline()` aggiorna:

```text
data
lastUpdate
integrity
error
```

ma non aggiorna/azzera:

```text
health
moneyFlowHistory
```

## Conseguenza

Se una sessione ha già avuto un `/latest` valido:

```text
health = H1
moneyFlowHistory = M1
```

e successivamente `/latest` passa a 404 ma `/json` restituisce un payload:

```text
data = J2
lastUpdate = J2 timestamp
```

l'hook può mantenere:

```text
health = H1
moneyFlowHistory = M1
```

accanto al nuovo `data` proveniente dal fallback.

Il documento definisce `/json`:

```text
diagnostico o di bootstrap
```

ma non specifica questa coerenza cross-field.

## Finding `FRONT-POLL-007` — definire un payload atomico per il fallback Betfair

**Priorità:** alta  
**Tipo:** Betfair read model consistency

### Possibili contratti

Se `/json` non possiede health/history correnti:

```text
fallback
→ data aggiornata
→ health/history null oppure marcate last-known
```

oppure il backend deve fornire un read model coerente.

### Invariante

Non presentare come appartenenti allo stesso aggiornamento:

```text
data nuova da /json
+
health/history vecchie da /latest
```

senza metadata espliciti.

---

# 8. `dashboardConnections` usa la presenza dell'oggetto come authority di connessione

## Esito: predicate troppo debole

## Sofa

Come visto:

```text
backendData truthy
→ connected
```

ha precedenza su:

```text
serverStatus
integrity
gate state
```

## Betfair

La connection usa:

```text
ok: Boolean(betfairData)
```

senza considerare:

```text
integrity
health
last read result
current polling/session state
```

Quindi un oggetto precedente può mantenere:

```text
ok:true
```

anche quando la lettura corrente è degradata, a seconda di come l'hook conserva state.

## Finding `FRONT-POLL-008` — rendere connection state derivato da uno stato corrente strutturato

**Priorità:** alta  
**Tipo:** dashboard connection semantics

### Target

Il connection state deve derivare da un read status esplicito:

```text
current read status
persistence status
session active
data availability
```

non dalla sola truthiness del payload.

### Stati

Valutare una tassonomia bounded come:

```text
connected
waiting
stale
persistence_error
disconnected
```

senza confondere:

- Source Identity;
- Graph health;
- persistence integrity;
- network connectivity.

---

# 9. Le `sessionId` degli hook protetti non sono una tracking session authority backend

## Esito: distinzione da rendere esplicita

`useMarketReactionEvidence()` e `useSourceIdentityGateStatus()` hanno variabili chiamate:

```text
sessionId
```

ma sono:

```text
contatori locali React
```

Servono soltanto a:

- invalidare async path precedenti;
- evitare stale state writes;
- abortire request frontend.

Non vengono inviate al backend.

Non provano:

```text
questo payload appartiene al tracking Start corrente
```

Quindi un endpoint che restituisce dati persistiti precedenti per lo stesso eventId può ancora essere tecnicamente accettato dal poller corrente.

## Finding `FRONT-POLL-009` — distinguere request generation frontend e trackingSessionId

**Priorità:** alta  
**Tipo:** session authority terminology

### Documento

Usare termini diversi:

```text
frontend request generation
trackingSessionId backend
```

### Runtime target

Con `IMPL-006`, il frontend deve poter correlare la sessione attiva con le response che richiedono isolamento session-scoped.

La request generation locale resta necessaria anche dopo IMPL-006.

---

# 10. I test elencati non verificano il lifecycle reale dei poller

## Esito: coverage sovrastimata se letta come hook coverage

`useMatchPolling.test.mjs` importa soltanto:

```text
classifySofaTimelineHttpStatus
normalizeSofaTimelinePayload
```

Non monta l'hook.

Non verifica:

- timer;
- `loadMatch`;
- `stopPolling`;
- fetch in flight;
- eventId change;
- stale response;
- unmount;
- StrictMode.

`useBetfairJson.test.mjs` verifica helper di:

- timestamp;
- normalization;
- integrity recognition.

Non monta il poller.

Non verifica:

- `/latest → /json` lifecycle;
- stale request;
- health/history coherence;
- timer cleanup;
- stop/resume;
- empty eventId.

## Evidence / Source Identity

Non risultano suite dirette:

```text
useMarketReactionEvidence.test.mjs
useSourceIdentityGateStatus.test.mjs
```

nonostante questi siano i due hook con il lifecycle async più sofisticato.

## Contrasto con il documento

La sezione finale richiede correttamente:

```text
test React con fake timer, AbortController e StrictMode
```

ma questi test non sono presenti.

## Finding `FRONT-POLL-010` — aggiungere test React/integration del lifecycle polling

**Priorità:** critica  
**Tipo:** verification contract

### Casi minimi

Per Match/Betfair:

```text
event A fetch lenta
→ switch event B
→ risposta A ignorata

cleanup durante fetch
→ nessun reschedule vecchio

stop
→ timeout cancellato
→ fetch abortita secondo contratto

empty eventId
→ no polling timer attivo

StrictMode mount/unmount/remount
→ nessun doppio loop
```

Per Betfair:

```text
/latest 404 → /json
→ stato atomico definito
```

Per Evidence/Gate:

```text
AbortController
request lock
event switch
refresh concorrente
404
500
unmount
```

### Test esistenti

Mantenere i test helper correnti come unit test, ma non descriverli come prova completa del lifecycle.

---

# 11. `useMarketReactionEvidence` è più robusto dei poller Match/Betfair

## Esito: comportamento positivo da preservare

Il hook possiede:

```text
sessionId locale
activeFetch lock
requestCounter
AbortController
cleanup
stale response guard
```

Una fetch della sessione precedente non può applicare state alla nuova sessione.

Questa architettura è un buon riferimento per:

```text
FRONT-POLL-001
```

## Limiti distinti

Restano:

- integrity wrapper non preservato;
- timestamp locale;
- local session ID non backend trackingSessionId.

Non va quindi usato come prova che l'intero frontend sia session-safe.

---

# 12. `useSourceIdentityGateStatus` è il poller più rigoroso

## Esito: coerente

Il hook:

- normalizza eventId;
- usa `enabled`;
- usa generation locale;
- abortisce active fetch;
- riusa la promise se una fetch della stessa sessione è già attiva;
- non schedula il next poll dopo disposal;
- tratta 404 come status null;
- espone errore statico;
- effettua refresh controllato.

Questa parte del documento è coerente con il codice.

## Limite

Come in `FRONT-POLL-009`, la sua `sessionIdRef` è soltanto frontend request authority.

---

# 13. Match `404` e persistence `409`

## Esito: classificazione corretta

`classifySofaTimelineHttpStatus()` applica:

```text
404
→ waiting

409 persistence_integrity + recovery_failed
→ recovery_failed

409 persistence_integrity
→ partial_persistence

altro
→ error
```

Il test unitario copre questi casi.

## Limite di state lifecycle

La classificazione è corretta.

Il problema è ciò che accade ai dati/view model precedenti dopo la classificazione, trattato in:

```text
FRONT-POLL-003
FRONT-POLL-004
```

---

# 14. Betfair timestamp

## Esito: principio corretto

`useBetfairJson()` evita di inventare:

```text
new Date()
```

come data del payload Betfair.

Usa:

```text
latestTimestamp
```

per `/latest` e timestamp reali della timeline per `/json`.

Questa scelta va preservata.

La semantica deve però essere resa uniforme a livello UI con:

```text
FRONT-POLL-006
```

---

# 15. Persistence integrity e Health restano concetti separati

## Esito: corretto nel principio

`useBetfairJson()` mantiene:

```text
integrity
health
```

come state distinti.

Su `409 persistence_integrity` da `/latest` può preservare la health sicura ricevuta nel payload.

Questo è coerente con la filosofia:

```text
persistence integrity
≠
Graph/runtime health
```

La criticità è la propagazione superiore e la coerenza del fallback `/json`, non la separazione concettuale.

---

# 16. `mapBackendDataToDashboard`

## Esito: mapping sportivo conservativo

Il mapper richiede:

```text
backendData.snapshot
```

e inoltra:

- player names;
- score;
- stats;
- localContext;
- Betfair status info.

Non ricostruisce Evidence, Source Identity o percentuali mancanti.

Questa proprietà è coerente.

## Nota

Il mapper costruisce i badge backend/polling dal `statusInfo` ricevuto.

La gestione del dato stale appartiene al view model/connection contract, non al mapper sportivo.

---

# 17. Betfair Health alerts

## Esito: documentazione accurata

L'hook riceve health già classificata dal backend.

Per l'audio usa:

```text
graphLoginRequired
graphLoginRequiredRecent
```

ma mantiene anche un fallback regex su:

```text
message
reasons
```

con termini login/logout/accesso/grafico.

Il documento registra correttamente questa dipendenza testuale.

## Raccomandazione non aperta come task autonoma

Durante il futuro refactor conviene eliminare progressivamente la dipendenza testuale a favore di flag/code strutturati.

Non viene aperto un change ID separato perché non è il problema principale dell'owner polling e il comportamento corrente è esplicitamente documentato.

---

# 18. Preflight

## Esito: coerente con il ruolo di questo documento

Gli endpoint sono relativi e `apiBase` è vuoto.

Preflight non legge integrity/journal.

Il fatto che Preflight non sia un gate di Start appartiene al report Session Shell:

```text
FRONT-SESSION-001
PREFLIGHT-API-005
```

e non viene duplicato qui.

---

# 19. Modularizzazione

## Valutazione

```text
Righe: 610
Responsabilità primaria: polling e read-model frontend
Sottotemi:
- Match polling
- Betfair polling
- Evidence polling
- Source Identity live polling
- dashboard mapping
- connection state
- health alerts
- integrity propagation

Owner di codice già separati: sì
Necessità di confrontare i poller nello stesso documento: alta
Rischio principale: contratti divergenti fra hook
Nuovi owner canonici necessari: no
Suddivisione richiesta: no
```

La lunghezza è elevata, ma dividere il documento per singolo hook nasconderebbe il problema più importante dell'audit:

```text
i poller non applicano lo stesso contratto di session safety,
freshness e current/last-known state
```

Il codice possiede già owner modulari.

Il documento deve restare il facade comparativo del read model frontend.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-021
Percorso report: Report documentale/21 - 02-live-polling-and-view-model.md
Documento: docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md
Change ID: FRONT-POLL-001
Change ID: FRONT-POLL-002
Change ID: FRONT-POLL-003
Change ID: FRONT-POLL-004
Change ID: FRONT-POLL-005
Change ID: FRONT-POLL-006
Change ID: FRONT-POLL-007
Change ID: FRONT-POLL-008
Change ID: FRONT-POLL-009
Change ID: FRONT-POLL-010
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 018–021 non ancora recepiti
→ indice 21 ANALIZZATO
→ Divisione non necessaria
→ aggiungere FRONT-POLL-001..010

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-021
→ appendere soltanto le nuove task
→ preservare integralmente il ledger precedente
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `FRONT-POLL-001` — request/session safety Match/Betfair

**Priorità:** critical

- AbortController;
- request generation;
- stale-response guard;
- active request ownership;
- cleanup su event/config change;
- mantenere distinta la futura trackingSessionId backend.

## `FRONT-POLL-002` — activation e teardown poller

**Priorità:** high

- introdurre `enabled/sessionActive`;
- nessun timer con eventId assente;
- nessun reschedule dopo cleanup;
- stop cancella timeout;
- coordinare `FRONT-SESSION-003`.

## `FRONT-POLL-003` — current vs last-known data

**Priorità:** critical

- non lasciare payload precedente implicitamente current dopo errori;
- distinguere last-known;
- connection non deve restare connected per sola truthiness;
- applicare lo stesso principio a Sofa e Betfair.

## `FRONT-POLL-004` — view model degradation/reset

**Priorità:** critical

- gestire `backendData:null`;
- gestire waiting/integrity/error;
- impedire dashboard precedente come current;
- coordinare FRONT-SESSION-004/009.

## `FRONT-POLL-005` — persistence integrity propagation

**Priorità:** high

- preservare Evidence integrity/sources;
- preservare integrity anche su 404;
- destrutturare Match/Betfair integrity in App;
- un solo persistence view state frontend.

## `FRONT-POLL-006` — time semantics

**Priorità:** high

- distinguere fetch time da source data time;
- non chiamare entrambi indiscriminatamente `lastUpdate`;
- gestire 404/error senza timestamp ambiguo;
- coordinare Evidence/Quality time semantics.

## `FRONT-POLL-007` — Betfair fallback atomicity

**Priorità:** high

- evitare nuova data `/json` accoppiata a health/history vecchie;
- azzerare o marcare last-known;
- definire il fallback come read model coerente;
- testare `/latest 404 → /json`.

## `FRONT-POLL-008` — connection state authority

**Priorità:** high

- non derivare connected/ok dalla sola presenza payload;
- includere current read status/session/integrity;
- mantenere health, Source Identity e persistence come assi distinti.

## `FRONT-POLL-009` — frontend generation vs trackingSessionId

**Priorità:** high

- rinominare/chiarire i contatori locali;
- non presentarli come session authority backend;
- coordinare IMPL-006;
- mantenere entrambi i livelli dopo il refactor.

## `FRONT-POLL-010` — lifecycle verification

**Priorità:** critical

- test React/fake timer/AbortController/StrictMode;
- event switch stale response;
- cleanup in-flight;
- stop/resume;
- empty event;
- Betfair fallback;
- Evidence/Gate direct lifecycle tests.

---

# Ordine consigliato di applicazione

```text
1. IMPL-006 / FRONT-SESSION-003 / FRONT-POLL-009
2. FRONT-POLL-001
3. FRONT-POLL-002
4. FRONT-POLL-003
5. FRONT-POLL-004
6. FRONT-POLL-005
7. FRONT-POLL-008
8. FRONT-POLL-007
9. FRONT-POLL-006
10. FRONT-POLL-010
11. revisione mirata 02-live-polling-and-view-model.md
12. checker documentali
13. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

---

# Verifica prevista dopo un'eventuale modifica

## Match session race

```text
event A fetch in flight
→ event B
→ response A
→ nessun setState della sessione B
```

## Betfair session race

```text
event/config A
→ /latest in flight
→ switch B
→ response A
→ nessun data/health/history overwrite
```

## Cleanup

```text
cleanup durante fetch
→ fetch abortita o ignorata
→ nessun timeout rischedulato
```

## Stop

```text
stopPolling
→ timeout cancellato
→ isPolling false
→ nessun nuovo network request
```

## Empty session

```text
eventId vuoto
→ isPolling false
→ nessun timer ricorrente
```

## Match current/last-known

```text
success
→ current data

success → 500
→ current unavailable
→ eventuale last-known esplicitamente separato
→ connection non connected
```

## Integrity

```text
404
partial_persistence
recovery_failed
```

devono attraversare:

```text
hook
→ App/controller
→ view state
→ view
```

senza journal read frontend.

## View model

```text
dashboardData valido
→ backendData null
→ comportamento clear/degrade definito
```

## Betfair fallback

```text
/latest success H1/M1
→ /latest 404
→ /json J2
```

deve produrre un read model atomico:

```text
data J2
health/history coerenti o esplicitamente last-known/null
```

## Time semantics

Verificare separatamente:

```text
sourceUpdatedAt
fetchedAt
lastSuccessfulReadAt
```

secondo i campi scelti.

## StrictMode

Montaggio:

```text
mount
unmount
remount
```

non deve creare:

- loop duplicati;
- active fetch orfane;
- state write stale.

## Test esistenti

Mantenere i test helper come unit test, ma aggiungere suite lifecycle reali.

## Documentazione

```bash
npm run build
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Non usare `npm run lint` finché il repository non possiede una configurazione ESLint effettiva.

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
02-live-polling-and-view-model.md: OWNER UTILE, MA I POLLER NON CONDIVIDONO ANCORA UN CONTRATTO DI SESSIONE

Sofa HTTP classification: corretta
Betfair server timestamp: corretto
Evidence session guard: robusto
Source Identity session guard: robusto
frontend no journal/recovery: corretto
persistence integrity partial wiring: correttamente documentato

Match stale response guard: assente
Betfair stale response guard: assente
Match/Betfair abort: assente
old loop reschedule after cleanup: possibile
Betfair polling con eventId vuoto: possibile
stale payload dopo error: possibile
Sofa connected con serverStatus error: possibile
dashboardData precedente dopo data null: presente
Evidence integrity wrapper: perso
Evidence 404 integrity: perso
lastUpdate semantics: non uniforme
Betfair fallback health/history: può restare old
local sessionId != backend trackingSessionId
hook lifecycle tests: insufficienti

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: critica
```

Il documento deve restare un singolo owner comparativo dei poller e del view model.

La correzione centrale è applicare in modo uniforme la catena:

```text
sessione attiva
→ richiesta autorizzata
→ risposta ancora appartenente alla sessione
→ dato corrente
→ integrity/freshness coerenti
→ view model corrente
```

e tenere separati:

```text
last-known data
frontend request generation
backend tracking session
source data timestamp
frontend fetch timestamp
persistence integrity
runtime/Graph health
```

che oggi, in alcuni hook e nelle connessioni dashboard, sono ancora parzialmente sovrapposti.

> Aggiornamento successivo: `FRONT-POLL-001`–`FRONT-POLL-010` sono state implementate e verificate. Match e Betfair sono session-safe, timer e richieste vengono cancellati, current e last-known sono distinti, Evidence preserva il wrapper integrity/sources, i timestamp sono separati, il fallback Betfair è atomico e le connessioni usano read status. Il contratto corrente è descritto nel documento canonico riscritto.

Verifica conclusiva: 24 file di test frontend superati, build production superata e profilo `fast` con 6/6 controlli superati. È stata aggiunta `react-test-renderer@18.2.0` come dipendenza di sviluppo per i test lifecycle. Nessuna operazione Git è stata eseguita.
