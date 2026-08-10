# Report documentale — `docs/tennis-decision-ui/api/05-preflight.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-009
Sequenza audit: 09/72
Documento analizzato: 05-preflight.md
Percorso documento: docs/tennis-decision-ui/api/05-preflight.md
Percorso report: Report documentale/09 - 05-preflight.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 352 righe
Ruolo dichiarato: contratto HTTP del router Preflight
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/routes/test.js`;
- `backend/src/routes/test/graphUrlValidation.js`;
- `backend/src/routes/test/graphUrlValidation.test.mjs`;
- `backend/src/routes/test/graphUrlValidationRoute.test.mjs`;
- `backend/src/utils/cdpUrl.js`;
- `backend/src/sofa/extractEventId.js`;
- `backend/src/routes/match/trackingResponses.js`;
- `backend/src/routes/betfair.js`;
- `backend/src/routes/betfair/loginWindow.js`;
- `backend/src/server.js`;
- `scrapers/betfair/graph_url.py`;
- `frontend/src/App.jsx`;
- `frontend/src/hooks/usePreflightChecks.js`;
- `frontend/src/utils/preflight.js`;
- `frontend/src/utils/liveSessionRequests.js`;
- `frontend/src/hooks/useLiveTrackingActions.js`;
- `frontend/src/components/PreflightChecks.jsx`;
- `frontend/src/components/StartAnalysisPanel.jsx`;
- `docs/tennis-decision-ui/api/06-runtime-health.md`;
- `docs/tennis-decision-ui/modules/python/04-betfair-graph-url-validation.md`;
- `implementazioni/99-decisioni-utente.md`, in particolare `DEC-019` e `DEC-020`.

La mappa Markdown e il nuovo JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale con il codice: MEDIO-ALTA
Endpoint censiti: completi
Endpoint documentati ma assenti: 0
Endpoint presenti ma non documentati: 0
Contratti da correggere: 6
Gap di validazione o boundedness: 5
Modifiche proposte: 9
Necessità di riscrittura completa: SÌ
Necessità di modularizzazione: NO
Nuovi documenti proposti: nessuno
```

Il documento è corretto nel descrivere:

- i cinque endpoint del router;
- la validazione CDP locale;
- gli status `400` per CDP assente o invalido;
- l’assenza di fetch per SofaScore e Betfair URL;
- la natura preliminare del preflight Graph;
- la forma di `sameMarket`;
- l’assenza di tracking, scraper, browser o persistenza avviati dal router.

Le discrepanze rilevanti sono:

1. la validazione Betfair è troppo permissiva rispetto a login e alla decisione di usare un unico validator;
2. il preflight Graph non è identico al parser Python runtime, nonostante questa convergenza sia già approvata;
3. SofaScore non viene realmente validato come dominio: viene soltanto estratto un event ID;
4. i check frontend sono advisory e non impediscono `Link Accounts & Start`;
5. `/api/test/health` non è il check backend usato dal frontend, che chiama `/api/health`;
6. il probe CDP non ha un timeout bounded;
7. la sezione Verifica esegue test automatici soltanto per Graph URL;
8. il frontend Preflight contiene stringhe mojibake e può mostrare errori tecnici provenienti da `safeFetchJson`;
9. il documento è più lungo del necessario perché replica dettagli che appartengono al validator/runtime Graph, ma non richiede una divisione in nuovi owner.

---

# 1. Superficie HTTP

## Esito: completa

Il router espone correttamente:

```text
GET  /api/test/health
POST /api/test/cdp
POST /api/test/sofa-url
POST /api/test/betfair-url
POST /api/test/graph-urls
```

Il mount è:

```text
app.use('/api/test', testRouter)
```

Non risultano endpoint mancanti dalla tabella.

Non risultano endpoint documentati ma assenti.

---

# 2. CDP URL

## Esito: validazione sintattica corretta

Il documento corrisponde a `classifyCdpBaseUrl`.

Sono effettivamente richiesti:

```text
protocollo: http
host:
- 127.0.0.1
- localhost
- ::1

porta esplicita 1..65535
nessuna username
nessuna password
nessuna query
nessun fragment
path /
```

Input:

```text
undefined
null
stringa vuota
```

produce:

```text
cdp_url_required
```

Input sintatticamente non valido produce:

```text
cdp_url_invalid
```

Il fetch:

```text
<cdp-base>/json/version
```

viene costruito soltanto dopo la classificazione positiva.

Questa parte del documento è affidabile.

---

# 3. Probe CDP non bounded nel tempo

## Esito: limite non documentato e non implementato

`handleCdpTestRequest` usa:

```js
await fetchFn(checkedUrl)
```

senza:

- `AbortController`;
- `AbortSignal.timeout`;
- timeout applicativo;
- race bounded;
- cancellation token.

Il target è confinato al loopback, quindi non è il problema SSRF individuato nel precedente audit Betfair.

Il problema è la boundedness.

Un servizio locale che accetta la connessione ma non completa la risposta può trattenere la richiesta oltre il tempo ragionevole di un preflight.

Il documento definisce queste route come:

```text
verifiche leggere
```

ma non dichiara che il tempo di completamento non è bounded.

## Finding `PREFLIGHT-API-001` — rendere bounded il probe CDP

**Priorità:** alta  
**Tipo:** affidabilità e timeout

### Modifica tecnica consigliata

Usare un probe condiviso con:

```text
target già validato
timeout esplicito
abort
risposta pubblica bounded
nessun throw raw
```

Non duplicare logica timeout in più router.

Il timeout deve essere definito a livello di progetto o utility condivisa.

Non inventare una soglia diversa in ogni endpoint.

### Modifica documentale

Documentare:

```text
CDP syntax valid
→ probe loopback bounded
→ timeout/unreachable
→ HTTP 200, ok:false
```

---

# 4. SofaScore URL

## Esito: estrazione event ID, non vera validazione URL

La route usa:

```js
extractEventId(sofaUrl)
```

`extractEventId` non verifica:

- protocollo;
- dominio SofaScore;
- credenziali;
- query consentite;
- fragment consentiti;
- lunghezza;
- struttura completa della match URL.

Può estrarre un ID da:

```text
#id=<digits>
/event/<digits>
percorsi /match/
sequenze generiche di 7-9 cifre
fallback di almeno 6 cifre
```

Quindi una stringa non appartenente a SofaScore può produrre:

```json
{
  "ok": true,
  "eventId": "..."
}
```

Il documento usa correttamente il verbo:

```text
Estrae event ID
```

nella tabella, ma il payload e la terminologia:

```text
<sofascore-match-url>
URL SofaScore
Risposta non valida
```

possono far interpretare l’esito come validazione del target.

## Logging raw

`extractEventId` esegue anche:

```js
console.log(`[ID Extraction] Testing URL: ${url}`);
```

quindi l’intero input viene scritto in console prima della classificazione.

Il documento afferma che l’estrazione è locale, ma non dichiara questo side effect.

## Duplicazione frontend

`frontend/src/utils/preflight.js` contiene un secondo estrattore:

```text
getSofaEventId
```

con logica molto simile.

Questo crea due authority per l’interpretazione dell’event ID.

## Finding `PREFLIGHT-API-002` — chiarire e consolidare il contratto SofaScore

**Priorità:** alta  
**Tipo:** input validation e logging

### Modifica documentale immediata

Dichiarare:

```text
il comportamento corrente estrae un event ID;
non dimostra che l'host sia SofaScore
```

Non chiamarlo validazione affidabile del dominio.

### Modifica tecnica da valutare

Creare o riusare un contratto canonico per:

```text
Sofa URL
→ parse
→ host supportato
→ event ID
→ normalizzazione
```

con consumer condivisi fra:

- preflight;
- Start;
- analisi;
- frontend, dove possibile.

### Logging

Rimuovere il logging dell’input completo.

Usare:

```text
event_id_extracted
event_id_not_found
```

con campi bounded e senza URL raw.

---

# 5. Betfair URL

## Esito: validazione troppo permissiva

Il router usa:

```js
/betfair\.\w+$/i.test(parsed.hostname)
```

Questo controllo non impone un boundary prima di `betfair`.

Per esempio un host:

```text
fakebetfair.com
```

termina con:

```text
betfair.com
```

e può superare il controllo.

La route inoltre non richiede:

```text
http:
https:
```

e non rifiuta:

- username/password;
- porta esplicita;
- protocolli non web;
- host non appartenenti all’insieme supportato dal runtime.

Il controllo login usa invece:

```text
betfair.it
*.betfair.it
http/https
no credentials
```

Il tracking Start non applica un validator Betfair equivalente prima di passare la URL al runtime.

Quindi oggi possono esistere tre interpretazioni differenti:

```text
preflight
login
tracking
```

## Decisione già approvata

`DEC-020` prescrive:

```text
usare un validatore Betfair unico
in preflight, Start, login e future diagnostiche
```

Non è quindi necessaria una nuova decisione sulla direzione.

## Finding `PREFLIGHT-API-003` — applicare il validator Betfair unico già approvato

**Priorità:** critica  
**Tipo:** authority URL Betfair

### Modifica richiesta

Creare o consolidare un solo validator owner per:

```text
protocollo
hostname
credenziali
normalizzazione
event ID
```

e usarlo in:

```text
POST /api/test/betfair-url
POST /api/betfair/login-window
POST /api/match/track
future diagnostiche
```

### Contratto pubblico

Gli errori devono diventare code bounded, per esempio:

```text
betfair_url_required
betfair_url_invalid
betfair_event_id_missing
```

senza dipendere da testi diversi per ogni route.

### Compatibilità

La modifica deve essere testata sui domini Betfair realmente supportati dal progetto.

Non ampliare automaticamente l’allow-list a tutti i TLD Betfair.

---

# 6. Graph URL backend vs parser Python

## Esito: contratti incompatibili

Il documento riconosce che:

```text
valid:true
≠
ladder assegnabile
```

Questo è corretto.

Il problema è più forte: il preflight backend accetta una grammatica diversa da quella runtime.

## Backend

`graphUrlValidation.js` accetta:

```text
hostname /^graphs\.betfair\.\w+$/
almeno due segmenti:
marketId
selectionId
```

Non verifica:

- protocollo HTTPS;
- host esatto `graphs.betfair.it`;
- username/password;
- porta;
- terzo segmento `/0`;
- numero esatto di segmenti;
- duplicati di `selectionId`;
- coerenza con market runtime.

I test backend considerano valide URL come:

```text
https://graphs.betfair.com/1.23456789/101
```

## Runtime Python

`parse_direct_ladder_url` accetta soltanto:

```text
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

con:

```text
https obbligatorio
host esatto
no credentials
no port
path esatto
view = 0
```

Il mapping runtime verifica inoltre:

```text
expected_market_id
selectionId presente nella selection map
selectionId non duplicata
```

## Decisione già approvata

`DEC-020` prescrive:

```text
rendere il preflight Graph identico al contratto runtime
```

## Finding `PREFLIGHT-API-004` — allineare Graph preflight al runtime

**Priorità:** critica  
**Tipo:** falsa validazione positiva

### Modifica richiesta

Il validator backend deve adottare la stessa grammatica statica del parser Python:

```text
https
graphs.betfair.it
no credentials
no explicit port
marketId
selectionId
/0
```

Per i controlli che richiedono contesto runtime:

```text
market mismatch
selection missing
duplicate selection
```

occorre decidere quali possano essere verificati già nel preflight frontend/backend con i dati disponibili.

### `sameMarket`

Lo stato corrente permette:

```text
sameMarket = false
ok = true
```

Per una lista destinata allo stesso mercato questo è incompatibile con il runtime: almeno una URL fallirà il confronto con `expected_market_id`.

La semantica di `ok` deve quindi essere riallineata alla destinazione reale delle Graph URL.

### Test

Sostituire gli esempi `.com` con URL conformi al runtime.

Aggiungere casi:

```text
http
ftp
graphs.betfair.com
credentials
port
missing /0
extra segments
duplicate selectionId
market diversi
runnerChartData
```

---

# 7. Echo delle URL Graph

## Esito: input raw restituito dal validator

Ogni entry conserva:

```text
url
```

esattamente come ricevuta.

Poiché il validator backend non rifiuta username/password, una URL come:

```text
https://user:password@graphs.betfair.com/...
```

può essere interpretata sintatticamente e riflessa nel body.

La route non effettua fetch, quindi non è SSRF.

Resta però un confine pubblico poco robusto.

La stessa correzione del validator Graph deve:

- rifiutare credenziali;
- normalizzare prima dell’esposizione;
- evitare di riflettere informazioni non necessarie.

Questa correzione è parte di `PREFLIGHT-API-004` e non richiede un ID separato.

---

# 8. I check frontend non bloccano Start

## Esito: preflight advisory

Il frontend rende disponibili:

```text
Test Backend
Test CDP
Test Sofa URL
Test Betfair URL
Test Graph URLs
Run All Checks
```

ma:

```text
Link Accounts & Start
```

è disabilitato soltanto quando:

```text
!matchUrl
oppure
sofaLoading
```

Non dipende dallo stato:

```text
checks.backend
checks.cdp
checks.sofa
checks.betfair
checks.graphs
```

`runAllChecks`:

- esegue i check in sequenza;
- non costruisce un risultato aggregato;
- non abilita un gate;
- non viene invocato automaticamente da `handleSearch`.

`handleSearch` costruisce direttamente la richiesta di tracking e la invia.

Quindi il preflight corrente è:

```text
diagnostica manuale/advisory
```

non:

```text
precondizione obbligatoria di Start
```

## Finding `PREFLIGHT-API-005` — dichiarare esplicitamente che il preflight è advisory

**Priorità:** alta  
**Tipo:** semantica operativa

### Modifica documentale necessaria

Aggiungere nello scopo:

```markdown
I check Preflight sono diagnostici e non costituiscono attualmente un
gate obbligatorio di `Link Accounts & Start`.

Il runtime Start applica le proprie validazioni indipendenti.
```

### Decisione separata

Se si vuole in futuro:

```text
preflight PASS
→ requisito per Start
```

serve una decisione esplicita su:

- quali check sono obbligatori;
- quali sono facoltativi;
- Betfair assente;
- Graph assenti;
- persistent vs CDP;
- staleness del risultato;
- modifica degli input dopo il check;
- race fra check e Start.

Non introdurre questo gate come effetto collaterale di una correzione documentale.

---

# 9. Health duplicata

## Esito: endpoint presente, ma il frontend Preflight usa un altro owner

Il router documenta:

```text
GET /api/test/health
```

con shape minima:

```json
{
  "ok": true,
  "service": "backend",
  "timestamp": "..."
}
```

Il frontend `testBackend` usa invece:

```text
GET /api/health
```

L’endpoint `/api/health` è già posseduto da:

```text
docs/tennis-decision-ui/api/06-runtime-health.md
```

e restituisce anche:

- project;
- instanceId;
- pid;
- startedAt;
- pythonProcesses.

Quindi nel flusso frontend corrente:

```text
Preflight Backend
→ /api/health
```

non:

```text
/api/test/health
```

## Finding `PREFLIGHT-API-006` — chiarire o rimuovere `/api/test/health`

**Priorità:** media  
**Tipo:** superficie duplicata

### Modifica richiesta

Prima della rimozione eseguire un inventario consumer.

Se non esistono consumer reali:

```text
rimuovere /api/test/health
```

e lasciare:

```text
/api/health
```

come unica authority health.

Se viene mantenuto per compatibilità, il documento deve dichiarare:

```text
endpoint minimo separato
non usato dal Preflight frontend corrente
non authority dell'identità backend
```

Non duplicare nel documento Preflight il contratto completo di Runtime Health.

---

# 10. Input e output non bounded

## Esito: router leggero ma senza limiti espliciti

Il validator Graph:

- accetta array arbitrariamente lunghi;
- accetta stringhe arbitrariamente lunghe;
- restituisce un elemento per ogni input;
- conserva la URL originale.

Le route Sofa e Betfair non applicano una lunghezza massima all’input.

Il router usa:

```text
express.json()
```

che fornisce un limite globale del body, ma non sostituisce limiti semantici per numero e dimensione delle URL.

Per un control plane locale la superficie dovrebbe essere bounded per contratto.

Questo punto deve essere risolto insieme ai validator canonici di:

```text
PREFLIGHT-API-002
PREFLIGHT-API-003
PREFLIGHT-API-004
```

Non serve creare un ulteriore change ID separato se le utility condivise definiscono limiti coerenti.

---

# 11. Verifica automatica documentata

## Esito: incompleta

La sezione `Verifica` esegue:

```text
node --check routes/test.js
node --check routes/test/graphUrlValidation.js
node routes/test/graphUrlValidation.test.mjs
node routes/test/graphUrlValidationRoute.test.mjs
```

Questi comandi verificano bene Graph URL.

Non eseguono automaticamente il contratto documentato di:

```text
GET /health
POST /cdp
POST /sofa-url
POST /betfair-url
```

La checklist testuale successiva menziona CDP, Sofa e Betfair, ma non fornisce un test automatico specifico.

In particolare va provato:

```text
CDP invalido
→ nessun fetch

CDP loopback valido
→ checkedUrl corretto

CDP timeout
→ bounded failure

Sofa input non SofaScore con cifre
→ comportamento deciso

Betfair fakebetfair.com
→ rifiutato

Betfair protocollo non web
→ rifiutato

Graph runtime grammar
→ parità col parser Python
```

## Finding `PREFLIGHT-API-007` — completare la contract coverage

**Priorità:** alta  
**Tipo:** test e verificabilità

### Modifica richiesta

Aggiungere test route/helper dedicati per:

```text
health
cdp
sofa-url
betfair-url
graph-urls
```

I validator condivisi devono avere test puri separati dalle route.

La verifica frontend deve coprire almeno:

```text
persistent
→ CDP idle

cdp
→ CDP richiesto

Betfair assente
→ idle

Graph assenti
→ idle

Run All Checks
→ stati aggiornati

Start
→ comportamento advisory documentato
```

---

# 12. Consumer frontend e qualità dei messaggi

## Esito: integrazione funzionale ma testo corrotto

`usePreflightChecks.js` e `StartAnalysisPanel.jsx` contengono stringhe come:

```text
âEUR”
ModalitÃ
```

Questi valori sono visibili nella UI.

Inoltre `safeFetchJson` costruisce, per risposte non JSON:

```text
Risposta non JSON da <url>:
<snippet dei primi 120 caratteri>
```

e i catch del Preflight possono mostrare direttamente:

```text
e.message
```

Quindi un body inatteso del backend può diventare testo UI.

Nel contesto locale questo non è un problema di autorità dati, ma è una pratica diversa dal modello di errori bounded adottato nelle altre superfici.

## Finding `PREFLIGHT-API-008` — correggere consumer e messaggi frontend

**Priorità:** media  
**Tipo:** UI e redazione

### Modifica richiesta

- correggere il mojibake;
- usare messaggi pubblici bounded;
- loggare reason code invece di mostrare snippet tecnici;
- non mostrare body HTML o testo server inatteso;
- mantenere dettagli diagnostici nei log redatti.

La utility `safeFetchJson` può continuare a essere generica, ma il consumer Preflight deve decidere cosa è sicuro mostrare.

---

# 13. Ownership e duplicazione Graph

## Esito: il documento API contiene troppo dettaglio, ma non serve dividerlo

La sezione Graph è corretta nel rinviare al modulo Python per la validazione runtime.

Allo stesso tempo contiene una lunga spiegazione di:

- grammar;
- validità;
- sameMarket;
- mapping non eseguito;
- ladder;
- browser;
- autenticazione;
- duplicati.

Il documento owner Python già descrive:

```text
parser
mapping
duplicate selection
market mismatch
ladder assignment
failure reason
live validation
```

Il documento API deve possedere soltanto:

```text
metodo
path
input
shape output
status
effetti collaterali
limiti del preflight
link al runtime owner
```

La grammatica definitiva deve appartenere a un validator condiviso e al documento owner appropriato, non essere riscritta in più punti.

## Finding `PREFLIGHT-API-009` — riscrivere e accorciare senza modularizzare

**Priorità:** media  
**Tipo:** ownership documentale

### Modifica richiesta

Mantenere:

```text
docs/tennis-decision-ui/api/05-preflight.md
```

come unico owner API.

Ridurre:

- dettagli Python;
- descrizioni duplicate di Graph runtime;
- spiegazioni già possedute da Runtime Health.

Aggiungere:

- advisory vs gate;
- validator authority;
- timeout/boundedness;
- matrice endpoint compatta;
- test essenziali.

Non creare:

```text
api/preflight/cdp.md
api/preflight/graph.md
api/preflight/urls.md
```

perché aumenterebbe la frammentazione senza separare vere responsabilità operative.

---

# 14. Modularizzazione

## Valutazione

```text
Righe: 352
Endpoint: 5
Responsabilità primaria: una — preflight locale
Validator differenti: sì
Owner esterni già esistenti: sì
Contesti indipendenti che richiedono nuovi documenti: no
Rischio di duplicazione: medio
Suddivisione per sola lunghezza: no
Modularizzazione richiesta: no
```

Il documento è più lungo del necessario, ma i cinque endpoint rispondono tutti alla stessa domanda:

```text
l'input/runtime minimo è plausibile prima di Start?
```

La soluzione corretta è ridurre la duplicazione, non creare cinque documenti.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il nuovo JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-009
Percorso report: Report documentale/09 - 05-preflight.md
Documento: docs/tennis-decision-ui/api/05-preflight.md
Change ID: PREFLIGHT-API-001
Change ID: PREFLIGHT-API-002
Change ID: PREFLIGHT-API-003
Change ID: PREFLIGHT-API-004
Change ID: PREFLIGHT-API-005
Change ID: PREFLIGHT-API-006
Change ID: PREFLIGHT-API-007
Change ID: PREFLIGHT-API-008
Change ID: PREFLIGHT-API-009
Suddivisione richiesta: no
Nuovi file proposti: nessuno
```

Nel prossimo aggiornamento:

```text
mappa-file-markdown-repository.md
→ registrare report 009
→ indice 9 ANALIZZATO
→ Divisione non necessaria
→ 9 nuove task
→ prossimo indice 10

modifiche-audit-markdown.json
→ aggiungere soltanto report 009
→ aggiungere soltanto PREFLIGHT-API-001..009
→ non ricopiare i report precedenti al nuovo ledger
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `PREFLIGHT-API-001` — probe CDP bounded

**Priorità:** alta

**Azione:**

- aggiungere timeout e abort;
- usare utility condivisa;
- mantenere loopback validation;
- aggiungere test timeout;
- documentare il failure bounded.

---

## `PREFLIGHT-API-002` — contratto SofaScore

**Priorità:** alta

**Azione:**

- distinguere estrazione event ID da validazione dominio;
- valutare validator SofaScore condiviso;
- rimuovere logging raw dell’URL;
- evitare authority duplicate backend/frontend.

---

## `PREFLIGHT-API-003` — validator Betfair unico

**Priorità:** critica

**Azione:**

- applicare `DEC-020`;
- condividere validator fra preflight, Start e login;
- definire allow-list e protocollo;
- rifiutare credenziali;
- normalizzare event ID e reason.

---

## `PREFLIGHT-API-004` — parità Graph con runtime

**Priorità:** critica

**Azione:**

- applicare `DEC-020`;
- rendere grammar backend uguale al parser Python;
- riallineare `sameMarket`;
- gestire duplicati coerentemente;
- correggere test e esempi `.com`.

---

## `PREFLIGHT-API-005` — dichiarare il preflight advisory

**Priorità:** alta

**Azione:**

- documentare che i check non bloccano Start;
- non introdurre un gate senza decisione;
- se verrà approvato un gate, definire freshness e check obbligatori.

---

## `PREFLIGHT-API-006` — health duplicata

**Priorità:** media

**Azione:**

- inventariare consumer di `/api/test/health`;
- rimuoverla se inutilizzata;
- mantenere `/api/health` come authority corrente;
- evitare duplicazione con il documento Runtime Health.

---

## `PREFLIGHT-API-007` — copertura test completa

**Priorità:** alta

**Azione:**

- aggiungere test CDP, Sofa e Betfair;
- mantenere test Graph;
- testare i validator condivisi;
- testare frontend advisory state;
- inserire i comandi reali nel documento.

---

## `PREFLIGHT-API-008` — frontend bounded e testo corretto

**Priorità:** media

**Azione:**

- correggere mojibake;
- evitare error snippet raw nella UI;
- usare messaggi bounded e reason code;
- preservare logging redatto.

---

## `PREFLIGHT-API-009` — riscrittura senza split

**Priorità:** media

**Azione:**

- mantenere un solo `05-preflight.md`;
- accorciare Graph e Health;
- collegare gli owner;
- aggiungere validator authority, advisory status e boundedness;
- nessun nuovo documento.

---

# Ordine consigliato di applicazione

```text
1. applicare il validator Betfair unico già approvato;
2. allineare Graph preflight al parser runtime;
3. rendere bounded il probe CDP;
4. decidere il validator SofaScore condiviso;
5. chiarire advisory vs gate;
6. inventariare /api/test/health;
7. completare i test;
8. correggere messaggi frontend;
9. riscrivere 05-preflight.md in forma più compatta;
10. aggiornare indice, mappa Markdown e JSON incrementale.
```

---

# Controlli previsti dopo un’eventuale modifica

## Backend

```bash
node --check backend/src/routes/test.js
node --check backend/src/routes/test/graphUrlValidation.js
node --check backend/src/utils/cdpUrl.js

node backend/src/routes/test/graphUrlValidation.test.mjs
node backend/src/routes/test/graphUrlValidationRoute.test.mjs
```

Aggiungere i nuovi test owner dei validator e delle route prima di considerarli gate documentati.

## Python Graph

```bash
python -m py_compile \
  scrapers/betfair/graph_url.py \
  scrapers/betfair/graph_url_test.py

python -m unittest -v scrapers.betfair.graph_url_test
```

## Test minimi del contratto

```text
CDP
→ loopback valido
→ URL invalida
→ credenziali
→ path/query/fragment
→ timeout
→ unreachable

Sofa
→ URL canonica
→ stringa non SofaScore con ID
→ URL senza event ID
→ nessun URL raw nei log

Betfair
→ dominio ufficiale
→ sottodominio ammesso
→ fakebetfair.com
→ protocollo non web
→ credenziali
→ event ID assente

Graph
→ URL runtime valida
→ .com
→ http
→ credenziali
→ porta
→ /0 mancante
→ market diversi
→ duplicato selectionId
→ runnerChartData

Frontend
→ persistent con CDP idle
→ CDP mode
→ Betfair assente
→ Graph assenti
→ Run All Checks
→ Start ancora advisory finché non viene approvato un gate
```

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
05-preflight.md: CONTRATTO UTILE MA DA RISCRIVERE
Endpoint censiti: completi
CDP syntax validation: corretta
CDP timeout: mancante
SofaScore: estrazione, non validazione dominio
Betfair validator: troppo permissivo
Graph validator: non allineato al runtime
Preflight frontend: advisory, non gate
Health /api/test: duplicata rispetto al flusso frontend
Verifica: troppo concentrata su Graph
Frontend: mojibake e messaggi tecnici
Riscrittura completa: consigliata
Modularizzazione: non necessaria
Nuovi documenti: nessuno
Priorità tecnica: alta
```

Il documento non deve essere diviso.

I cinque endpoint appartengono a una sola responsabilità coerente:

```text
preflight locale e diagnostico
```

La correzione più importante è applicare le authority già approvate:

```text
un solo validator Betfair
+
Graph preflight identico al runtime
```

e descrivere senza ambiguità che il preflight corrente non è un gate obbligatorio di Start.
