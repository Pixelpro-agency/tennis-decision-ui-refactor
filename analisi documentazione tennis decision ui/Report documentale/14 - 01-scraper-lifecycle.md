# Report documentale — `docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-014
Sequenza audit: 14/72
Documento analizzato: 01-scraper-lifecycle.md
Percorso documento: docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md
Percorso report: Report documentale/14 - 01-scraper-lifecycle.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: dea94bdf7e8667d7f2df19233f807fd621569eda
Dimensione documento: 480 righe
Ruolo dichiarato: owner del lifecycle Node/Python dello scraper Betfair
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/betfairFetch.js`;
- `backend/src/sofa/betfair/url.js`;
- `backend/src/sofa/betfair/scraperLifecycle.js`;
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`;
- `backend/src/sofa/betfair/scraperLifecycle.test.mjs`;
- `backend/src/sofa/betfair/scraperLifecycle/facadeIntegration.test.mjs`;
- `backend/src/sofa/betfair/scraperLifecycle/scraperLifecycleTestFixtures.mjs`;
- `backend/src/sofa/betfair/trackerUpdate.js`;
- `backend/src/sofa/trackerUpdate.js`;
- `backend/src/sofa/matchTracker.js`;
- `backend/src/runtime/pythonProcessRegistry.js`;
- `backend/src/routes/betfair.js`;
- `backend/src/routes/betfair/oddsResponse.js`;
- `backend/src/routes/betfair/loginWindowLifecycle.js`;
- `backend/src/utils/cdpUrl.js`;
- `scrapers/betfair/cli.py`;
- `scrapers/betfair/cache.py`;
- `docs/tennis-decision-ui/ai/02-documentation-conventions.md`;
- `docs/validations/betfair-live-validation-2026-07-04.md`;
- `implementazioni/audit-codice/02-runtime-sessioni-betfair.md`;
- i finding già registrati nei report API/architecture precedenti.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Lifecycle fisico processi Python: ben descritto
Deduplica logica: descritta in modo troppo forte
Runtime identity: parzialmente corretta
Session authority: mancante e non sufficientemente evidenziata
Consumer legacy mutante: omesso
Cache tracking: comportamento corrente da evidenziare/correggere
Read-only network I/O: formulazione errata
Output child process: contratto da rendere bounded
Verifica automatica: da riallineare
Validazione storica dentro owner: da separare
Modifiche proposte: 10
Necessità di riscrittura completa: NO
Necessità di revisione strutturale mirata: SÌ
Necessità di modularizzazione canonica: NO
Nuovi owner canonici proposti: nessuno
```

Il documento contiene molta informazione corretta.

Sono solide soprattutto le sezioni relative a:

- registry fisico dei figli Python;
- separazione `betfair_tracking` / `betfair_login`;
- timeout;
- terminazione bounded;
- conservazione dell’entry logica fino a completion fisica;
- execution token;
- conflitto di runtime sulla stessa key;
- restore runner tramite `selectionId`;
- persistenza differita nel percorso tracking;
- commit del `marketState` soltanto su `complete` / `recovered`;
- `repairOnly`;
- separazione persistence integrity / health;
- network capture opt-in;
- cleanup legacy dopo commit riuscito;
- Chrome/CDP non terminato dal lifecycle tracking.

Le correzioni principali riguardano però il livello di authority.

Il documento oggi lascia intendere:

```text
stesso mercato
+ stessa runtime identity
→ un solo scraper sicuro
```

ma il codice implementa:

```text
stessa key URL
+ stessa runtime identity testuale
→ stessa promise
```

e non possiede ancora:

```text
canonical market authority
trackingSessionId
Betfair command authority globale
```

---

# 1. Deduplica: la key non è una market authority

## Esito: formulazione corrente troppo forte

Il documento usa ripetutamente:

```text
stesso mercato
+ stessa runtime identity
→ stessa promise
```

e:

```text
lifecycle Betfair
→ deduplica richieste per mercato e runtime identity
```

Il codice usa invece:

```js
const key = scraperKey(url)
```

e `scraperKey()` restituisce:

```text
normalizeBetfairUrl(url)
```

La normalizzazione rimuove soltanto alcuni query parameter:

```text
loginStatus
loginstatus
ott
m
ref
pid
```

Non estrae e non usa come key primaria un canonical `marketId`.

Quindi:

```text
key URL
≠
market identity canonica
```

Due URL differenti che rappresentano lo stesso mercato possono produrre key differenti.

Quando le key differiscono:

```text
activeScrapers.get(key)
→ nessuna entry
→ secondo spawn possibile
```

anche se:

- il mercato reale è lo stesso;
- il profilo browser è lo stesso;
- il CDP è lo stesso.

Questa limitazione è già registrata nell’audit tecnico come:

```text
RUNTIME-012
IMPL-016
```

## Finding `BETFAIR-LIFE-001` — correggere “mercato” in “key URL” e collegare l’autorità globale

**Priorità:** critica  
**Tipo:** logical authority

### Modifica documentale immediata

Usare:

```markdown
Il lifecycle corrente deduplica per `scraperKey(url)` e runtime identity.

La key è una URL Betfair normalizzata; non è una canonical market
authority.
```

Aggiungere:

```text
key diversa
→ può avviare un altro scraper
```

### Target approvato

Collegare:

```text
IMPL-016
→ canonical market identity
→ Betfair runtime command authority globale
```

senza descriverlo come già implementato.

---

# 2. Riuso della Promise fra sessioni logiche

## Esito: gap critico non dichiarato nel documento owner

Quando esiste una entry sulla stessa key:

```js
if (sameScraperRuntimeIdentity(...)) {
    return active.promise;
}
```

Il controllo non considera:

```text
trackingSessionId
commandId
identità del tracker richiedente
Start che ha originato lo scraper
```

Quindi:

```text
Start A
→ scraper attivo

Start B
→ stessa key
→ stessa runtime identity

Start B
→ può ricevere la Promise iniziata da A
```

Il nuovo Start corrente non invalida atomicamente la sessione precedente.

Questo limite è già registrato come:

```text
RUNTIME-007
TEST-006
IMPL-006
```

## Finding `BETFAIR-LIFE-002` — dichiarare il riuso non session-safe

**Priorità:** critica  
**Tipo:** tracking session authority

### Modifica richiesta

Aggiungere:

```text
same key + same runtime identity
→ riuso fisico/logico corrente
→ non prova appartenenza alla stessa tracking session
```

Collegare:

```text
IMPL-006
IMPL-016
```

### Non fare

Non aggiungere un token soltanto al documento.

La modifica reale deve attraversare:

- Start;
- tracker;
- lifecycle;
- gate;
- persistenza;
- frontend.

---

# 3. Runtime identity Persistent non è una physical profile authority

## Esito: normalizzazione descritta in modo troppo forte

Per CDP il lifecycle usa:

```text
classifyCdpBaseUrl
```

e ottiene una forma normalizzata e confinata al loopback.

Per Persistent usa invece:

```js
typeof value === 'string'
→ value.trim()
```

Quindi:

```text
profileDir normalizzato
```

nel documento significa in realtà soltanto:

```text
profileDir trimmed
```

Non viene applicato:

- `path.resolve`;
- canonicalizzazione di slash;
- case normalization Windows;
- realpath;
- equivalenza fra relativo e assoluto;
- equivalenza fra alias dello stesso profilo.

Possibili rappresentazioni differenti dello stesso profilo fisico possono quindi risultare runtime identity differenti.

## Finding `BETFAIR-LIFE-003` — precisare i limiti della runtime identity Persistent

**Priorità:** alta  
**Tipo:** runtime identity

### Modifica documentale

Sostituire:

```text
profileDir normalizzato
```

con:

```text
profileDir trimmed secondo il comportamento corrente
```

e dichiarare:

```text
non è una physical-profile authority canonica
```

### Coordinamento

La soluzione robusta appartiene a:

```text
IMPL-016
```

che deve arbitrare il runtime Betfair globale.

---

# 4. Python generation sovrastimata

## Esito: errore semantico importante

Il documento afferma:

```text
Execution token e generation
impediscono che una callback tardiva elimini una nuova entry.
```

Il cleanup dell’entry logica usa:

```js
current?.executionToken === executionToken
```

Non consulta la generation.

Quindi:

```text
executionToken
→ protegge activeScrapers da stale cleanup

Python generation
→ protegge spawn/ownership process-level
```

Sono proprietà diverse.

La generation del registry viene verificata al momento di:

```text
spawnOwnedPython
```

ma non costituisce una tracking session authority JavaScript.

L’audit tecnico ha già registrato:

```text
DOC-025
process generation
≠ tracking session authority
≠ command/request identity
```

## Finding `BETFAIR-LIFE-004` — separare execution token, process generation e session authority

**Priorità:** critica  
**Tipo:** process vs application authority

### Modifica richiesta

Documentare tre livelli distinti:

```text
executionToken
→ ownership della entry activeScrapers

Python generation
→ validità dello spawn/process ownership

trackingSessionId
→ authority applicativa end-to-end
→ assente oggi
```

Non attribuire alla generation proprietà possedute dall’execution token.

---

# 5. Mismatch Source Identity e SofaScore in flight

## Esito: il documento attribuisce alla generation un effetto che non possiede

Il documento afferma:

```text
eventuale sofa_tracking in flight
→ reso obsoleto dalla generation
```

e:

```text
l’eventuale processo SofaScore in corso
non può più produrre effetti della generation invalidata
```

Il mismatch corrente esegue:

```text
stopAllMatchTrackers({ preserveGateEventId })
invalidatePythonGeneration("tracking")
terminateActiveBetfairScrapers()
```

Non esegue un cleanup fisico completo `scope=tracking`.

Il processo SofaScore in flight non viene terminato esplicitamente dal callback mismatch.

Inoltre una callback JavaScript SofaScore non verifica la Python generation immediatamente prima di:

- osservare il gate;
- persistere.

Nel caso normale il gate mismatch preservato blocca il campione.

Ma la generation da sola **non** è la ragione per cui la callback applicativa diventa innocua.

Il problema emerge soprattutto dopo:

```text
nuovo Start
→ gate precedente sostituito
```

perché una callback vecchia può osservare il gate nuovo o `no-gate`.

Questo è già registrato come:

```text
RUNTIME-004
RUNTIME-006
RUNTIME-008
IMPL-006
```

## Finding `BETFAIR-LIFE-005` — correggere il lifecycle mismatch

**Priorità:** critica  
**Tipo:** stale callback semantics

### Modifica documentale

Usare una formula come:

```markdown
Il mismatch invalida la generation dei nuovi spawn tracking e termina
lo scraper Betfair attivo.

Il processo/callback SofaScore già in volo non è reso
session-safe dalla sola Python generation. Nel percorso corrente il
gate mismatch preservato blocca normalmente il campione, ma manca
ancora una session authority end-to-end.
```

### Target

Collegare `IMPL-006`.

Non dichiarare cleanup tracking unico già implementato.

---

# 6. Consumer legacy `/api/betfair/odds` omesso

## Esito: lifecycle incompleto rispetto ai caller reali

Il documento descrive bene:

```text
tracker
→ fetchBetfairData
→ deferPersistence:true
→ Source Identity Gate
```

ma lo stesso facade è raggiungibile anche da:

```text
GET /api/betfair/odds
```

La route costruisce:

```js
options = {
    ladderUrls,
    mode,
    profileDir,
    cdpUrl,
    networkCapture
}
```

senza:

```text
deferPersistence:true
```

e chiama direttamente:

```text
fetchBetfairData(url, sofaEventId, options)
```

Quindi il lifecycle ha ancora un secondo ingresso HTTP che può:

- spawnare Python;
- usare browser/CDP;
- navigare Betfair;
- usare Graph;
- abilitare network capture;
- persistere tramite il processor;
- bypassare lo Start canonico;
- bypassare Source Identity Gate;
- bypassare session sequencing.

È una mutazione esposta tramite `GET`.

La rimozione è già approvata:

```text
RUNTIME-011
BETFAIR-API-007
```

## Finding `BETFAIR-LIFE-006` — documentare il secondo ingresso mutante fino alla rimozione

**Priorità:** critica  
**Tipo:** lifecycle entrypoint

### Modifica richiesta

Aggiungere una sezione breve:

```text
Consumer legacy ancora presente
→ GET /api/betfair/odds
→ usa fetchBetfairData fuori dal tracking canonico
→ deprecato
→ rimozione approvata
```

Non presentarlo come percorso raccomandato.

### Dopo la rimozione

Eliminare la sezione insieme alla route e ai test esclusivi.

---

# 7. `fetchBetfairData` non valida ancora la Betfair URL con un’authority condivisa

## Esito: input pubblico incompleto

Il documento elenca:

```text
fetchBetfairData(url, sofaEventId, options)
```

ma non descrive la validazione di `url`.

Nel codice:

```text
scraperKey(url)
→ normalizeBetfairUrl
```

non equivale a una Betfair URL authority.

Il valore viene poi passato allo scraper Python.

Il vero Start non applica ancora un validator Betfair canonico equivalente al login.

Questa divergenza è già registrata come:

```text
CODE-002
PREFLIGHT-API-003
DEC-020
```

## Finding `BETFAIR-LIFE-007` — dichiarare la Betfair URL authority mancante

**Priorità:** alta  
**Tipo:** input validation

### Modifica richiesta

Aggiungere al contratto input:

```text
Stato corrente:
→ fetchBetfairData non possiede ancora il validator Betfair condiviso
→ la normalizzazione della key non equivale a validazione host/protocollo
```

### Target già approvato

Un solo validator backend-owned per:

```text
preflight
Start
login
future diagnostics
```

Non duplicare il validator nel lifecycle runner.

---

# 8. Read-only non significa “nessun fetch”

## Esito: affermazione falsa nel documento

Il documento afferma:

```text
Le route read-only
→ non avviano fetch
```

`GET /api/betfair/:eventId/latest` può invece eseguire:

```text
GET <cdpUrl>/json/version
```

come probe diagnostico CDP.

Il probe è separato dallo scraper Betfair e non modifica `marketState`, ma è comunque:

```text
network fetch
```

Il target della query ha inoltre un gap già registrato:

```text
BETFAIR-API-001
CODE-007
ARCH-BOUND-006
DATA-LIFE-006
```

## Finding `BETFAIR-LIFE-008` — correggere il confine read-only

**Priorità:** alta  
**Tipo:** read-only network I/O

### Formula corretta

```text
read-only
→ nessun tracking
→ nessun scraper Betfair
→ nessun repair/journal write
→ nessuna mutazione marketState

diagnostic network probe
→ possibile soltanto quando previsto
→ target validato
→ bounded
```

Registrare `/latest` come gap corrente fino alla correzione del target CDP.

---

# 9. Cache tracking: il percorso senza Graph può ancora usare cache

## Esito: comportamento corrente importante ma nascosto nella matrice

`trackerUpdate.js` passa sempre:

```js
networkCapture: false
```

Il runner aggiunge:

```text
--no-network-capture
```

ma aggiunge `--no-cache` soltanto quando:

```text
ladderUrls.length > 0
oppure
networkCaptureInput !== false
```

Nel tracking senza Graph:

```text
ladderUrls = []
networkCaptureInput = false
```

quindi:

```text
--no-cache
→ assente
```

La CLI Python, se `--no-cache` è assente:

```text
legge la cache
e
scrive la cache
```

La TTL corrente è:

```text
4 secondi
```

Il normale intervallo tracker Betfair è maggiore, quindi il problema non implica automaticamente cache hit ad ogni polling.

Resta però vero che:

```text
tracking canonico senza Graph
→ cache ancora consentita
```

L’audit tecnico ha già approvato il target:

```text
tracking canonico
→ cache sempre disabilitata
```

e ha registrato anche i limiti della key cache URL-derived/troncata.

## Finding `BETFAIR-LIFE-009` — rendere esplicita e correggere la cache nel tracking

**Priorità:** alta  
**Tipo:** acquisition/cache policy

### Modifica documentale immediata

Dopo la matrice aggiungere:

```text
Con il codice corrente, tracking + networkCapture:false + zero Graph URL
non passa --no-cache.
```

### Modifica runtime target

Nel percorso tracking canonico:

```text
--no-cache sempre
```

senza dipendere da `networkCapture`.

Le future diagnostiche possono avere policy cache separate e versionate.

---

# 10. Output child process

## Esito: descrizione e boundedness da correggere

Il documento dice:

```text
raccolta stdout JSON e stderr diagnostico
```

Il runner fa invece:

```js
proc.stdout.on('data', data => {
    stdoutData += data.toString();
});

proc.stderr.on('data', () => {});
```

Quindi:

```text
stdout
→ accumulato

stderr
→ drenato/scartato
```

Non viene raccolto come diagnostica.

## Buffer stdout

`stdoutData` cresce fino a chiusura del processo senza un limite esplicito.

Il timeout limita la durata, ma non la quantità di dati prodotti prima del timeout.

Il parser cerca inoltre:

```text
primo carattere "{"
→ JSON.parse(resto)
```

Questo è tollerante verso prefissi testuali semplici, ma non è un protocollo stdout framed.

## Finding `BETFAIR-LIFE-010` — rendere bounded e preciso il contratto stdout/stderr

**Priorità:** alta  
**Tipo:** process I/O boundary

### Modifica documentale

Correggere:

```text
stdout JSON
→ buffered per parsing

stderr
→ drenato senza esposizione raw
```

### Hardening consigliato

Definire:

- limite massimo stdout;
- errore statico `scraper_output_too_large`;
- terminazione del child al superamento;
- nessun body raw nel log;
- test del limite.

Valutare in seguito un framing stdout più deterministico.

---

# 11. Verifica: il test diretto del runner è omesso

## Esito: matrice incompleta

La sezione `Verifica` elenca:

```text
facadeIntegration.test.mjs
technicalRecovery.test.mjs
persistenceCommit.test.mjs
persistenceRecovery.test.mjs
runtimeOrchestration.test.mjs
betfairFetch.test.mjs
```

ma omette:

```text
backend/src/sofa/betfair/scraperLifecycle.test.mjs
```

Questo test diretto copre il runner corrente con un `processRegistry` fake e verifica, fra l’altro:

- riuso promise;
- runtime conflict;
- CDP normalized identity;
- terminazione;
- barriera fino alla physical close;
- timeout;
- redazione log;
- stale cleanup.

È quindi uno dei test più importanti del documento owner.

## Fixture facade stale

`facadeIntegration.test.mjs` importa:

```text
scraperLifecycleTestFixtures.mjs
```

Il fixture helper costruisce ancora lifecycle/runner con opzioni tipo:

```text
spawnProcess
killEscalationMs
```

mentre il runner corrente accetta:

```text
processRegistry
timeoutMs
setTimeoutFn
clearTimeoutFn
```

Quindi il fixture deve essere riallineato prima di essere trattato come prova affidabile dell’injection corrente.

## Finding `BETFAIR-LIFE-011` — riallineare la verifica al runner corrente

**Priorità:** alta  
**Tipo:** test contract

### Modifica richiesta

Aggiungere:

```bash
node sofa/betfair/scraperLifecycle.test.mjs
```

alla verifica owner.

Riallineare o rimuovere le fixture obsolete di `facadeIntegration`.

Aggiungere casi per:

```text
key diverse stesso marketId
sessione A → sessione B stessa key
profile path alias
stdout oltre limite
tracking senza Graph → --no-cache
legacy /odds rimosso
```

Non dichiarare PASS senza esecuzione corrente.

---

# 12. Collaudo storico dentro il documento owner

## Esito: responsabilità documentale non corretta

La sezione:

```text
## Stato Task 2
```

contiene risultati storici come:

```text
Validato live nel collaudo 9B
un solo PID
un solo executionId
stop senza respawn per 10 secondi
```

e distingue:

```text
validato live
validato soltanto da test automatici
non osservato direttamente
```

Questi sono risultati di una verifica passata.

Le convenzioni correnti prescrivono:

```text
un report di collaudo
→ docs/validations/
```

e:

```text
un report storico
≠ prova di PASS corrente
```

Il documento owner deve descrivere il contratto corrente, non conservare risultati storici inline.

## Finding `BETFAIR-LIFE-012` — separare il collaudo storico dall’owner

**Priorità:** media  
**Tipo:** document ownership

### Modifica richiesta

Rimuovere dal documento owner il blocco storico dettagliato.

Preservare l’evidenza in:

- una validation esistente, se già coperta;
- oppure nei registri/audit dove il collaudo è già tracciato;
- oppure in una nuova validation soltanto se data, SHA, ambiente e limiti possono essere ricostruiti senza inventarli.

Nel documento owner mantenere soltanto un link:

```text
Validazioni storiche collegate
→ ...
```

Non creare una validation con metadata inventati.

---

# 13. Persistenza differita

## Esito: sostanzialmente corretta

Questa è una delle sezioni più solide.

Nel tracking:

```text
deferPersistence:true
```

fa sì che il processor prepari lo stato runner senza confermarlo immediatamente.

`persistBetfairTrackingSample()` applica:

```text
complete
recovered
→ commitPendingBetfairRunnerState

altro
→ discardPendingBetfairRunnerState
```

`repairOnly` ritorna prima del commit/discard del runner state.

Quindi è corretta la distinzione:

```text
campione tecnico
→ stato proposto

commit canonico
→ stato confermato
```

## Precisione da mantenere

Non confondere questo stato runner con:

```text
betfairRuntime.lastSuccessfulScrapeAt
```

che, come rilevato in `DATA-LIFE-003`, viene aggiornato prima dell’esito di persistenza in alcuni percorsi.

Formula consigliata:

```text
marketState runner baseline
→ confermato soltanto dal commit canonico

betfairRuntime acquisition timestamps
→ contratto separato
```

Questa precisione può essere aggiunta nell’ambito di `BETFAIR-LIFE-011` o della revisione del documento senza creare un ulteriore change ID.

---

# 14. Cleanup legacy

## Esito: coerente

Il documento descrive correttamente che il cleanup legacy:

```text
→ avviene dopo commit canonico riuscito
→ può produrre legacyWarning
→ non invalida il commit già riuscito
```

`cleanupLegacyBetfairTimeline()` filtra entry che non hanno:

```text
source === betfair
seq finito
runners array
```

e riscrive il documento soltanto quando necessario.

Questa parte può restare.

---

# 15. Login-only

## Esito: sostanzialmente corretto

Il lifecycle login possiede:

```text
un solo active
runtime identity
already_active
login_runtime_conflict
```

e usa ruolo:

```text
betfair_login
```

`scope=tracking` non include questo ruolo.

Va però mantenuta la precisazione architetturale:

```text
login lifecycle
≠ tracking lifecycle
≠ command authority globale
```

come richiesto da `BETFAIR-LIFE-001..003`.

---

# 16. Network capture

## Esito: matrice Node corretta

Il runner considera capture attiva soltanto con:

```text
options.networkCapture === true
```

Per gli altri valori aggiunge:

```text
--no-network-capture
```

La matrice `--no-cache` riportata dal documento corrisponde al codice Node.

Il problema non è la tabella.

Il problema è l’implicazione per il tracking:

```text
false booleano + zero ladder
→ cache consentita
```

trattata in `BETFAIR-LIFE-009`.

---

# 17. Lunghezza, contesto e responsabilità

## Valutazione

```text
Righe: 480
Responsabilità primaria: lifecycle scraper Betfair
Sottotemi necessari: spawn, identity, dedup, termination, restore
Sottotemi confinanti: persistence, cache, network capture, health
Risultati storici inline: sì
Owner specialistici collegati: sì
Necessità di nuovi owner canonici: no
Suddivisione canonica richiesta: no
Pulizia di responsabilità: sì
```

Il documento è lungo, ma la lunghezza non giustifica da sola uno split.

Le sezioni core:

```text
spawn
dedup
runtime identity
termination
login
restore
deferred persistence boundary
```

appartengono allo stesso lifecycle.

Non conviene creare:

```text
betfair/01a-runtime-identity.md
betfair/01b-process-lifecycle.md
betfair/01c-cache-policy.md
```

perché frammenterebbe il percorso.

Occorre invece:

- ridurre dettagli di storage già posseduti dagli owner storage;
- rinviare cache/retention al runbook;
- rinviare validità tecnica a `02-technical-sample-validity.md`;
- togliere il collaudo storico dal documento owner.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

La separazione della validazione storica è una correzione di ownership, non la creazione di un nuovo owner canonico.

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-014
Percorso report: Report documentale/14 - 01-scraper-lifecycle.md
Documento: docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md
Change ID: BETFAIR-LIFE-001
Change ID: BETFAIR-LIFE-002
Change ID: BETFAIR-LIFE-003
Change ID: BETFAIR-LIFE-004
Change ID: BETFAIR-LIFE-005
Change ID: BETFAIR-LIFE-006
Change ID: BETFAIR-LIFE-007
Change ID: BETFAIR-LIFE-008
Change ID: BETFAIR-LIFE-009
Change ID: BETFAIR-LIFE-010
Change ID: BETFAIR-LIFE-011
Change ID: BETFAIR-LIFE-012
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Nel prossimo aggiornamento della mappa:

```text
mappa-file-markdown-repository.md
→ registrare report 014
→ indice 14 ANALIZZATO
→ Divisione non necessaria
→ 12 nuove task
→ prossimo indice 15

modifiche-audit-markdown.json
→ aggiungere soltanto report 014
→ aggiungere soltanto BETFAIR-LIFE-001..012
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `BETFAIR-LIFE-001` — key URL vs market authority

**Priorità:** critical

**Azione:**

- sostituire “stesso mercato” con “stessa scraper key”;
- dichiarare che la key è URL-based;
- collegare `IMPL-016`;
- non presentare la deduplica locale come authority globale.

---

## `BETFAIR-LIFE-002` — Promise cross-session

**Priorità:** critical

**Azione:**

- dichiarare il riuso non session-safe;
- collegare `IMPL-006` e `IMPL-016`;
- aggiungere test Start A → Start B stessa key;
- non usare key/runtime identity come tracking session identity.

---

## `BETFAIR-LIFE-003` — Persistent runtime identity

**Priorità:** high

**Azione:**

- documentare che `profileDir` è soltanto trimmed;
- non chiamarla physical profile authority;
- coprire alias/path equivalenti;
- coordinare la futura canonicalizzazione con command authority.

---

## `BETFAIR-LIFE-004` — process generation semantics

**Priorità:** critical

**Azione:**

- separare execution token, Python generation e tracking session;
- correggere le frasi sulla stale cleanup;
- collegare `DOC-025`;
- non attribuire alla generation un effect guard JavaScript.

---

## `BETFAIR-LIFE-005` — mismatch e Sofa in flight

**Priorità:** critical

**Azione:**

- correggere il ruolo della generation;
- dichiarare il gate mismatch come protezione corrente principale;
- dichiarare che Sofa non viene terminato esplicitamente dal callback mismatch;
- collegare `IMPL-006`.

---

## `BETFAIR-LIFE-006` — `/odds` legacy

**Priorità:** critical

**Azione:**

- documentare il consumer legacy finché esiste;
- dichiarare bypass di tracking/gate/defer;
- collegare la rimozione approvata;
- eliminare la sezione dopo la rimozione verificata.

---

## `BETFAIR-LIFE-007` — Betfair URL validation

**Priorità:** high

**Azione:**

- dichiarare il validator condiviso mancante;
- non confondere `scraperKey` con validazione URL;
- collegare `PREFLIGHT-API-003`/`DEC-020`;
- mantenere un solo owner del validator.

---

## `BETFAIR-LIFE-008` — read-only network probe

**Priorità:** high

**Azione:**

- rimuovere “non avviano fetch”;
- distinguere scraper fetch da diagnostic probe;
- richiedere probe validato e bounded;
- collegare `BETFAIR-API-001`.

---

## `BETFAIR-LIFE-009` — cache tracking

**Priorità:** high

**Azione:**

- rendere esplicita la cache attiva nel caso tracking senza Graph;
- applicare il target `--no-cache` sempre nel tracking canonico;
- mantenere policy future diagnostiche separate;
- testare la CLI args matrix del tracking reale.

---

## `BETFAIR-LIFE-010` — stdout/stderr bounded

**Priorità:** high

**Azione:**

- correggere “stderr raccolto”;
- aggiungere limite stdout;
- terminare child su overflow;
- usare error code statico;
- aggiungere test output troppo grande.

---

## `BETFAIR-LIFE-011` — verification contract

**Priorità:** high

**Azione:**

- aggiungere `scraperLifecycle.test.mjs`;
- riallineare `facadeIntegration` e fixture alla dependency injection corrente;
- aggiungere test session/key/profile/cache/output;
- non dichiarare PASS storico.

---

## `BETFAIR-LIFE-012` — historical validation ownership

**Priorità:** medium

**Azione:**

- togliere `Stato Task 2` dall’owner;
- preservare evidenza storica solo con metadata reali;
- usare validations/register;
- mantenere nell’owner soltanto contratto e link.

---

# Ordine consigliato di applicazione

```text
1. IMPL-006 — session authority
2. rimozione /api/betfair/odds
3. IMPL-016 — Betfair command authority
4. validator Betfair condiviso
5. correggere semantics generation/mismatch
6. disabilitare cache nel tracking canonico
7. bounded stdout
8. riallineare test lifecycle
9. separare collaudo storico
10. riscrivere in modo mirato 01-scraper-lifecycle.md
11. checker documentali
12. aggiornare mappa Markdown e JSON incrementale
```

Le modifiche documentali possono essere applicate anche prima del runtime, purché distinguano:

```text
stato corrente
da
target approvato
```

---

# Verifica prevista dopo un’eventuale modifica

## Syntax

Dalla root:

```bash
node --check backend/src/sofa/betfairFetch.js
node --check backend/src/sofa/betfair/scraperLifecycle/runner.js
node --check backend/src/sofa/betfair/trackerUpdate.js
node --check backend/src/sofa/matchTracker.js
```

## Lifecycle diretto

```bash
node backend/src/sofa/betfair/scraperLifecycle.test.mjs
```

Verificare:

```text
same key + same runtime
→ reuse

same key + incompatible runtime
→ conflict

different key + same physical runtime
→ comportamento esplicitamente definito

stale completion
→ non elimina nuova entry

timeout
→ promise rejected
→ terminateExecution richiesto

physical exit non confermata
→ nessun secondo spawn sulla stessa key
```

## Session authority

Dopo IMPL-006:

```text
Start A
→ scraper A

Start B stessa key
→ risultato A non autorizzato nella sessione B

Start A stesso eventId
→ nuovo Start A
→ callback precedente rifiutata
```

## Command authority

Dopo IMPL-016:

```text
login + tracking
→ handoff o conflict esplicito

key diverse stesso marketId
→ nessun doppio comando mutante non autorizzato

stesso profile/CDP
→ un solo owner globale
```

## Mismatch

```text
mismatch
→ campione causale non persistito
→ Betfair terminato
→ Sofa in flight non produce effetti stale
→ nessuna dipendenza implicita dalla sola Python generation
```

## Cache

Tracking senza Graph:

```text
networkCapture=false
ladderUrls=[]
→ --no-network-capture
→ --no-cache
```

Tracking con Graph:

```text
→ --no-cache
```

## Output

```text
stdout valido bounded
→ parsed

stdout troppo grande
→ static error
→ child termination

stderr
→ nessun raw exposure
```

## Legacy odds

Dopo rimozione:

```bash
git grep -n "/api/betfair/odds"
git grep -n "buildBetfairOddsResponse"
```

Atteso:

```text
nessun consumer runtime
```

Preservare:

```text
/latest
/json
/log
/login-window
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
01-scraper-lifecycle.md: OWNER UTILE, REVISIONE MIRATA AD ALTA PRIORITÀ

Process registry: corretto
Physical lifecycle: corretto
Timeout/termination: corretto
Execution token: corretto
Deduplica: URL-key, non market authority
Promise reuse: non session-safe
Persistent runtime identity: non canonicalizzata fisicamente
Python generation: sovrastimata nel documento
Mismatch Sofa: meccanismo descritto in modo errato
/odds legacy mutante: omesso
Betfair URL validator condiviso: mancante
Read-only “no fetch”: falso
Tracking cache: ancora possibile senza Graph
stdout: non bounded
stderr: drenato, non raccolto
Verification: test owner principale omesso + fixture da riallineare
Collaudo storico: da togliere dall’owner

Riscrittura completa: no
Modularizzazione canonica: no
Nuovi owner canonici: nessuno
Priorità complessiva: alta
```

Il documento deve restare un singolo owner del lifecycle Betfair.

La revisione deve però correggere tre equivalenze che oggi non sono vere:

```text
URL key
≠ market authority

Python generation
≠ tracking session authority

GET/read-only
≠ assenza assoluta di network I/O
```
