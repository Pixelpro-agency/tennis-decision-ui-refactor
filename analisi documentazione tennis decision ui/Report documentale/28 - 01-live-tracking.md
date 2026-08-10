# Report documentale — `docs/tennis-decision-ui/modules/sofa/01-live-tracking.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-028
Sequenza audit: 28/72
Documento analizzato: 01-live-tracking.md
Percorso documento: docs/tennis-decision-ui/modules/sofa/01-live-tracking.md
Percorso report: Report documentale/28 - 01-live-tracking.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 2f3bdf6f51958a5443a46082b022aa6cc44a4ac2
Dimensione documento: 556 righe
Ruolo dichiarato: owner del coordinamento live tracking SofaScore/Betfair, scheduler, gate e drain terminale
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/matchTracker.js`;
- `backend/src/sofa/trackerUpdate.js`;
- `backend/src/sofa/betfair/trackerUpdate.js`;
- `backend/src/sofa/betfairFetch.js`;
- `backend/src/sofa/betfair/processor.js`;
- `backend/src/sofa/betfair/processor/persistence.js`;
- `backend/src/sofa/betfair/processor/technicalSample.js`;
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`;
- `backend/src/sofa/directFetch.js`;
- `backend/src/sofa/sourceIdentityGate.js`;
- `backend/src/sofa/sourceIdentityGate/sessionFactory.js`;
- `backend/src/sofa/sourceIdentityGate/evaluator.js`;
- `backend/src/runtime/pythonProcessRegistry.js`;
- `backend/src/routes/match/trackingResponses.js`;
- `backend/src/routes/betfair/latestPayload.js`;
- `backend/src/sofa/betfairHealth.js`;
- `backend/src/sofa/betfairHealth/statusClassification.js`;
- `backend/src/sofa/extractEventId.js`;
- `backend/src/server.js`;
- `backend/src/sofa/matchTracker.test.mjs`;
- `backend/src/routes/match/trackingResponses.test.mjs`;
- le suite Source Identity presenti sotto `backend/src/sofa/sourceIdentityGate/`;
- `backend/src/sofa/pointByPoint.test.mjs`;
- `backend/src/sofa/localContext.test.mjs`;
- `docs/validations/source-identity-live-verification.md`;
- i finding già registrati nei report precedenti, in particolare `SOURCE-ID-*`, `BETFAIR-LIFE-*`, `TECH-SAMPLE-*`, `DATA-LIFE-*`, `PY-RUNTIME-*`, `BETFAIR-SCRAPER-*` e `PREFLIGHT-API-*`.

La mappa Markdown di continuazione e il JSON incrementale di continuazione non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Owner scheduler/stop/drain: corretto
trackedMatches + scheduler: implementati
Sofa 5s / Betfair 6s: implementati come soglie dopo completion
activeTrackerOperations: implementato
terminal tracker barrier: implementata
terminal drain: fail-closed rispetto alla writer authority
Source Identity gate integration: reale
bootstrap Sofa → Betfair: reale
Sofa-only not-applicable: reale
ordinary Stop ≠ shutdown: corretto
Python generation ≠ tracking session authority: riconosciuto nel documento

Tracking session authority end-to-end: ancora assente
ordinary Stop/untrack/new Start: non drenano le Promise Node in-flight
no-gate fail-open dopo gate removal: finding già aperto
Start route: ignora un `trackMatch()` rifiutato dalla terminal barrier
Stop route: top-level `ok:true/stopped:true` anche con cleanup fallita
Mismatch: invalida generation ma termina esplicitamente solo Betfair
Mismatch: eventuale Sofa child può restare fisicamente in esecuzione
Mismatch cleanup result: non governa il lifecycle logico
Technical Betfair sample: documentato come zero persistence, ma esegue `repairOnly`
Technical Betfair sample: documentato come zero getKey, ma key viene calcolata
lastSuccessfulScrapeAt: acquisition timestamp, non commit timestamp
Finished auto-stop: dipende da `hasFinished`, la cui authority upstream è ancora debole
lastTechnicalErrorReason: può contenere detail dinamico non redatto
lastTechnicalErrorReason: esposto via `/latest` health
Betfair trackerUpdate: usa ancora console.log con detail dinamico
Scheduler interval: soglia dalla completion, non periodicità start-to-start
Sofa URL extraction: non è validation canonica, finding già aperto
Verification section: contiene più path test assenti al commit
Validation live inline: provenance incompleta rispetto all'archive canonico
Modifiche nuove proposte: 9
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: CRITICA
```

Il documento possiede il corretto owner concettuale:

```text
Start
→ scheduler
→ update source
→ Source Identity Gate
→ persistence authorization
→ Stop / mismatch / shutdown coordination
```

Le criticità richiedono di distinguere con precisione:

```text
tracking logico
tracking session authority
Python process generation
Promise Node in-flight
physical process completion
gate lifetime
canonical persistence
runtime health
```

---

# 1. New Start / Stop / untrack non possiedono ancora una tracking session authority end-to-end

## Esito: gap critico già approvato, da rendere centrale in questo owner

Il documento dichiara correttamente:

```text
generation Python
≠
tracking session authority end-to-end
```

`matchTracker.js` possiede `trackedMatches`, `activeTrackerOperations` e `terminalTrackerBarrier`, ma non un `trackingSessionId` propagato attraverso Start, update, gate, bootstrap e persistence.

Il gate resta indicizzato per `eventId`; `bufferGeneration` appartiene al gate e non identifica una Start.

`stopAllMatchTrackers()` rimuove tracking logico e gate ma non attende `activeTrackerOperations`. `untrackMatch()` è ancora più locale: elimina entry/gate e non invalida o drena una sessione. Un nuovo `trackMatch()` pulisce gate precedenti e crea il nuovo gate senza una barriera session-scoped sulle continuazioni JavaScript della Start precedente.

Il problema del `no-gate` fail-open è già registrato in `SOURCE-ID-002` e non deve essere duplicato.

## Finding `SOFA-LIVE-001` — tracking session authority alignment

**Priorità:** critical

- rendere esplicita la differenza fra map membership, Python generation, gate generation e session authority;
- applicare `IMPL-006`, senza introdurre una seconda authority concorrente;
- coprire Stop → new Start sullo stesso eventId;
- coprire cambio event con callback in-flight;
- coordinare `SOURCE-ID-001/002/009`, `DATA-LIFE-002` e `BETFAIR-LIFE-004/005`.

---

# 2. La route Start restituisce successo anche se `trackMatch()` rifiuta realmente la Start

## Esito: false positive HTTP

`trackMatch()` contiene:

```js
if (terminalTrackerBarrier) return null;
```

La direct function quindi può rifiutare una nuova Start durante shutdown.

`buildTrackMatchResponse()` chiama però `trackMatch(...)` e ignora il ritorno; dopo la chiamata restituisce sempre:

```text
HTTP 200
{ ok:true, eventId }
```

Il risultato pubblico può quindi dire “Start riuscita” mentre non esistono nuova entry tracker, gate, scheduler o update.

`matchTracker.test.mjs` prova che la terminal barrier fa restituire `null` al tracker; `trackingResponses.test.mjs` non prova la propagazione di questo rifiuto.

## Finding `SOFA-LIVE-002` — Start acknowledgement contract

**Priorità:** critical

- verificare il risultato reale di `trackMatch()`;
- non restituire `HTTP 200 ok:true` se il tracker rifiuta;
- usare code/status bounded;
- aggiungere test `trackMatch → null`;
- coordinare `FRONT-SESSION-002/003` affinché una Start backend non riuscita non diventi sessione UI attiva.

---

# 3. Stop globale restituisce `ok:true` anche quando il cleanup fisico fallisce

## Esito: false success top-level

`buildStopMatchResponse()` prova lo stop logico e poi attende `terminatePythonProcesses("tracking")`. Le failure vengono trasformate in un summary bounded, ma la risposta finale conserva sempre:

```json
{
  "ok": true,
  "stopped": true,
  "scope": "all-live-tracking"
}
```

anche se:

```text
stopAllMatchTrackers() lancia
pythonCleanup.ok = false
pythonCleanup.remaining > 0
```

La suite `trackingResponses.test.mjs` fissa esplicitamente il comportamento corrente: cleanup fallita → HTTP 200, `body.ok === true`, nested `pythonCleanup.ok === false`.

## Finding `SOFA-LIVE-003` — Stop completion contract

**Priorità:** critical

- distinguere `logicalTrackingStopped` da `pythonCleanupCompleted`;
- rendere l'overall result coerente con processi remaining/errori;
- non presentare `ok:true/stopped:true` come prova di completion totale quando il cleanup è incompleto;
- preservare `betfair_login` nello Stop tracking ordinario;
- coordinare `FRONT-SESSION-007`.

---

# 4. Il mismatch invalida la generation ma non termina esplicitamente il child SofaScore in-flight

## Esito: cleanup fisico incompleto rispetto al lifecycle desiderato

Il mismatch esegue:

```text
stopAllMatchTrackers({ preserveGateEventId })
invalidatePythonGeneration("tracking")
terminateActiveBetfairScrapers()
```

`invalidatePythonGeneration()` incrementa la generation ma non termina i processi già esistenti.

`terminateActiveBetfairScrapers()` termina soltanto il ruolo `BETFAIR_TRACKING`.

Un child `SOFA_TRACKING` già avviato può quindi restare fisicamente vivo fino alla propria uscita o timeout. `directFetch.js` possiede inoltre una `currentBarrier` fisica: il nuovo child Sofa non parte finché la completion del precedente non è confermata.

La generation invalidata impedisce al vecchio processo di produrre un risultato valido quando termina, ma non garantisce una ripartenza immediata del path Sofa.

Il tracker mismatch ignora inoltre il summary di terminazione Betfair come decisione di lifecycle; la function assorbe la failure e ritorna `null` in caso di errore.

## Finding `SOFA-LIVE-004` — mismatch physical cleanup

**Priorità:** critical

- definire esplicitamente il destino di `SOFA_TRACKING`, `BETFAIR_TRACKING`, `BETFAIR_LOGIN` e Chrome/CDP;
- preservare login e Chrome/CDP;
- terminare/chiudere bounded i figli tracking che devono diventare fisicamente obsoleti;
- rendere osservabile il cleanup summary;
- impedire che un nuovo Start resti inutilmente dietro la physical barrier di un vecchio Sofa child;
- aggiungere test mismatch con Sofa in-flight e failure di cleanup.

---

# 5. Il percorso del campione Betfair tecnico è descritto in modo non conforme al codice

## Esito: due affermazioni false nel contratto

Il documento afferma che un campione tecnico comporta:

```text
zero gate
zero persistenza
```

e che non deve chiamare `getBetfairTrackingKey`.

Il codice fa invece:

```js
const key = getKeyFn(info.betfairUrl);
const technicalSample = classifyBetfairTechnicalSample(result);
```

quindi la key viene calcolata prima della classificazione.

Se il sample non è usable viene poi chiamato:

```js
persistFn(eventId, result, key, { repairOnly: true });
```

`repairOnly` non promuove il sample tecnico corrente a nuovo tick business. Può però completare fisicamente un pending commit precedente già descritto nel journal; se non esiste pending commit ritorna `unchanged`.

Questo confine tecnico è già posseduto da `TECH-SAMPLE-004`.

## Finding `SOFA-LIVE-005` — technical sample repair semantics

**Priorità:** high

- sostituire “nessuna persistenza” con “nessun nuovo sample-derived canonical tick”; 
- documentare che `repairOnly` può completare un commit precedente;
- correggere la frase falsa su `getBetfairTrackingKey`;
- aggiungere test `technical + no pending`, `technical + pending recovery`, zero gate observation e zero current sample-derived commit;
- coordinare `TECH-SAMPLE-004` senza aprire un secondo implementation owner.

---

# 6. `lastTechnicalErrorReason` può propagare detail dinamico non redatto fino alla API Betfair latest

## Esito: boundary diagnostico troppo permissivo

`updateBetfair()` costruisce `lastTechnicalErrorReason` tramite:

```text
String(detail)
→ whitespace normalize
→ slice(0,160)
```

Non applica `redactRuntimeText()` al detail.

Una fetch rejection usa:

```text
error?.message || error
```

come detail.

`getBetfairTrackingRuntime()` restituisce poi quel campo; `buildLatestBetfairPayload()` lo passa a `buildBetfairSessionHealth()`, che lo espone in:

```text
metrics.lastTechnicalErrorReason
```

e, se l'errore è attivo, anche nelle `reasons` pubbliche.

Lo stesso modulo usa inoltre `console.log(...)` con detail dinamico, bypassando il runtime logger strutturato/redatto.

## Finding `SOFA-LIVE-006` — technical diagnostics redaction

**Priorità:** high

- usare code stabile + detail redatto/bounded solo se necessario;
- valutare un public `lastTechnicalErrorCode` invece del messaggio raw;
- sostituire i log runtime rilevanti con `runtimeLog` e field allow-list;
- aggiungere test con URL, path Windows, token/cookie shaped text e control chars;
- verificare che runtime, `/latest` health e log non espongano il valore raw.

---

# 7. “hasFinished esplicito” non equivale ancora a “finished authoritative”

## Esito: downstream più forte dell'upstream producer

`updateBetfair()` ferma meccanicamente il polling solo quando:

```text
event_status.hasFinished === true
```

Questa parte è reale.

L'audit dello scraper Betfair ha però già rilevato che il producer Python può impostare `hasFinished:true` anche tramite un fallback visible-text troppo debole. Quindi un boolean esplicito nel payload non è ancora sinonimo di prova authoritative della fine match.

La correzione upstream è già `BETFAIR-SCRAPER-006`.

## Finding `SOFA-LIVE-007` — finished authority alignment

**Priorità:** critical

- qualificare il wording finché `BETFAIR-SCRAPER-006` non è applicata;
- dopo l'hardening, auto-stop soltanto per evidence di finished sufficientemente authoritative;
- mantenere logout, DNS, fetch failure, `api_error`, no ladder e technical sample come condizioni di retry/non-stop;
- aggiungere un test integrato: weak hint upstream non deve fermare il polling.

---

# 8. Gli intervalli 5s/6s sono soglie dopo completion, non una periodicità start-to-start

## Esito: semantica temporale da precisare

La configurazione 5s Sofa / 6s Betfair è corretta, ma `lastSofaUpdate` e `lastBetfairUpdate` vengono aggiornati nel `finally` dell'update, quindi alla completion.

Il successivo update parte quando:

```text
now - last*Update >= interval
```

Quindi, se uno scrape Sofa dura 20 secondi, il successivo parte circa:

```text
completion + 5 secondi
```

non cinque secondi dopo lo start precedente.

Questi marker sono timestamp dello scheduler e non equivalgono a `lastSuccessfulScrapeAt`, acquisition time, canonical tick time o commit time.

## Finding `SOFA-LIVE-008` — scheduler time semantics

**Priorità:** medium

- descrivere 5s/6s come minimum delay dopo completion;
- distinguere scheduler completion da acquisition/canonical/persistence timestamp;
- evitare la formula generica “last update” quando il significato non è univoco;
- non cambiare la cadence soltanto per semplificare la documentazione.

---

# 9. La sezione Verifica contiene path assenti e mescola test correnti con validation live storica

## Esito: verification contract da riparare

Il documento elenca gli esatti path:

```text
sofa/trackerUpdate.test.mjs
sofa/betfair/trackerUpdate.test.mjs
sofa/betfair/processor.test.mjs
sofa/matchHistory/sofaUpdates.test.mjs
```

Questi path non risultano presenti al commit auditato.

Sono invece verificati presenti almeno:

```text
sofa/matchTracker.test.mjs
sofa/pointByPoint.test.mjs
sofa/localContext.test.mjs
sofa/sourceIdentityGate/lifecycle.test.mjs
sofa/sourceIdentityGate/epochRecovery.test.mjs
sofa/sourceIdentityGate/bootstrapFailures.test.mjs
sofa/sourceIdentityGate/mismatchAndIsolation.test.mjs
routes/match/trackingResponses.test.mjs
```

`matchTracker.test.mjs` contiene effettivamente 10 test e copre stop ordinario, bootstrap, drain, rejection e terminal barrier, ma non copre i nuovi boundary di questo report.

Il documento contiene anche una frase inline “Validato live” con `timeline SofaScore avanzata / commit completo / seq finita / integrity no_known_partial`. L'artefatto `docs/validations/source-identity-live-verification.md` supporta collecting→recording, mismatch→form, correzione→new Start→aligned e timeline Sofa disponibile/TopBar Connected, ma non registra nello stesso artifact tutto quel bundle con metadata riproducibili.

## Finding `SOFA-LIVE-009` — verification/provenance owner cleanup

**Priorità:** high

- rimuovere o correggere test path assenti;
- usare suite realmente presenti;
- aggiungere coverage per Start refusal, Stop cleanup failure, mismatch Sofa child, stale session callbacks, repairOnly, technical redaction e finished authority;
- spostare/riferire le osservazioni live tramite `docs/validations/` con artifact e limiti espliciti;
- non usare PASS storico inline come prova corrente;
- durante la revisione ridurre duplicazioni con Source Identity, Betfair lifecycle, Technical Sample, Storage e Runtime mantenendo questo documento come coordinator/facade.

---

# 10. `lastSuccessfulScrapeAt`

## Esito: semantica già posseduta da task precedenti

Il Betfair tracker aggiorna `lastSuccessfulScrapeAt` quando un sample supera la classificazione tecnica e anche nel path `hasFinished`. L'aggiornamento precede gate e persistence.

Quindi:

```text
lastSuccessfulScrapeAt
≠
canonical commit success
```

La correzione è già registrata in `DATA-LIFE-003` e `TECH-SAMPLE-007`; nessun nuovo change ID viene creato.

---

# 11. SofaScore event ID extraction

## Esito: extraction non equivale a validation

`trackMatch()` usa `extractEventId(sofaUrl)`. L'helper possiede fallback numerici generici e logga la URL raw via `console.log`.

Il problema è già registrato da `PREFLIGHT-API-002`; nessun validator duplicato viene proposto qui.

Quando il validator canonico verrà introdotto, questo owner dovrà consumarlo e non attribuire authority alla sola estrazione regex.

---

# 12. Active operations e terminal drain

## Esito: design sostanzialmente solido

`registerTrackerOperation()` registra Promise reali e le rimuove sia su fulfillment sia su rejection.

`stopAndDrainAllMatchTrackers()`:

```text
terminal barrier true
→ stop logical trackers
→ loop while active operations > 0
→ Promise.allSettled
→ nuova verifica fino a zero
```

Il server rilascia la writer authority soltanto con:

```text
ok:true
drained:true
activeOperations:0
```

Questa parte è corretta e deve essere preservata.

---

# 13. Shutdown backend

## Esito: ordine interno corretto; timeout parent già auditato altrove

Il server avvia listener close, tracker drain e cleanup Python, attende drain e listener, poi rilascia la writer authority soltanto se il drain è verificato.

Il problema launcher grace 5s vs backend force timeout 6s è già `PY-RUNTIME-004` e non viene duplicato.

---

# 14. Source Identity bootstrap

## Esito: implementato ma recovery failure già aperta

`persistBootstrapTrackingSamples()` persiste Sofa prima di Betfair e blocca Betfair se Sofa fallisce.

Il gate resta pending con `Bootstrap persistence failed` e la suite `bootstrapFailures.test.mjs` conferma che non esiste retry automatico nella stessa `bufferGeneration`.

Questo limite è già `SOURCE-ID-005`.

---

# 15. Normalizzazione JSON-safe SofaScore

## Esito: principio corretto

La distinzione `null ≠ zero` per campi statistici opzionali è coerente con la filosofia del progetto. Il tracker non introduce fallback numerici.

I dettagli di `localContext` e point-by-point restano agli owner dedicati.

---

# 16. Runtime Betfair effimero

## Esito: ownership corretta, esposizione downstream da qualificare

I quattro campi runtime non entrano in timeline/history/Evidence. Vengono però consumati da `GET /api/betfair/:eventId/latest` per costruire health.

Quindi:

```text
effimero
≠
non esposto
```

Il documento deve precisarlo, soprattutto dopo `SOFA-LIVE-006`.

---

# 17. Confini

## Esito: corretti

Il tracker non implementa browser, file storage, Evidence, point-by-point, Source Identity algorithm o writer authority. È correttamente l'integratore live che coordina gli owner.

Questa proprietà deve essere preservata durante `IMPL-006`.

---

# 18. Lunghezza, integrità del contesto e modularizzazione

## Valutazione

```text
Righe: 556
Responsabilità primaria: una
Owner centrale: matchTracker / live tracking coordinator
Sottodomini descritti: scheduler, gate integration, source update, mismatch, stop, terminal drain, runtime metadata
Owner specialistici già esistenti: sì
Nuovi documenti canonici necessari: no
```

Il file è lungo, ma i dettagli specialistici possiedono già owner separati. Dividerlo ancora in scheduler/stop/drain creerebbe frammentazione del lifecycle coordinatore.

La soluzione corretta è accorciare le sezioni duplicate e mantenere qui soltanto gli invarianti di orchestrazione, con link agli owner specialistici.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Nessuna task di modularizzazione.

---

# Riferimenti per la mappa e il JSON incrementale di continuazione

```text
Report ID: TDUI-DOC-REPORT-028
Percorso report: Report documentale/28 - 01-live-tracking.md
Documento: docs/tennis-decision-ui/modules/sofa/01-live-tracking.md
Change ID: SOFA-LIVE-001
Change ID: SOFA-LIVE-002
Change ID: SOFA-LIVE-003
Change ID: SOFA-LIVE-004
Change ID: SOFA-LIVE-005
Change ID: SOFA-LIVE-006
Change ID: SOFA-LIVE-007
Change ID: SOFA-LIVE-008
Change ID: SOFA-LIVE-009
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
IMPL-006
SOURCE-ID-001
SOURCE-ID-002
SOURCE-ID-005
SOURCE-ID-009
DATA-LIFE-002
DATA-LIFE-003
TECH-SAMPLE-004
TECH-SAMPLE-007
BETFAIR-LIFE-002
BETFAIR-LIFE-004
BETFAIR-LIFE-005
BETFAIR-SCRAPER-006
PREFLIGHT-API-002
FRONT-SESSION-002
FRONT-SESSION-003
FRONT-SESSION-007
PY-RUNTIME-004
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository-continuazione-023.md
→ registrare report 028
→ indice 28 ANALIZZATO
→ Divisione non necessaria
→ aggiungere SOFA-LIVE-001..009

modifiche-audit-markdown-continuazione-023.json
→ appendere TDUI-DOC-REPORT-028
→ appendere SOFA-LIVE-001..009
→ split_required:false
→ proposed_files:[]
→ preservare integralmente il segmento precedente e il contenuto 023–027
```

I file di mappa/ledger non sono stati modificati durante questa analisi.

---

# Modifiche proposte

```text
SOFA-LIVE-001  critical  tracking session authority alignment
SOFA-LIVE-002  critical  Start acknowledgement contract
SOFA-LIVE-003  critical  Stop completion contract
SOFA-LIVE-004  critical  mismatch physical cleanup
SOFA-LIVE-005  high      technical sample repair semantics
SOFA-LIVE-006  high      technical diagnostics redaction
SOFA-LIVE-007  critical  finished authority alignment
SOFA-LIVE-008  medium    scheduler time semantics
SOFA-LIVE-009  high      verification/provenance owner cleanup
```

---

# Ordine consigliato di applicazione

```text
1. IMPL-006 + SOFA-LIVE-001
2. SOURCE-ID-002 / SOURCE-ID-009
3. SOFA-LIVE-002
4. SOFA-LIVE-003
5. SOFA-LIVE-004
6. BETFAIR-SCRAPER-006 + SOFA-LIVE-007
7. SOFA-LIVE-006
8. TECH-SAMPLE-004 + SOFA-LIVE-005
9. SOFA-LIVE-008
10. SOFA-LIVE-009
11. revisione mirata 01-live-tracking.md
12. checker documentali
13. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

---

# Verifica prevista dopo un'eventuale modifica

## Session authority

```text
Start A stesso event
→ update A in-flight
→ Stop
→ Start B
→ callback A non osserva/persiste nel gate B
```

```text
Start event A
→ update A in-flight
→ Start event B
→ callback A non diventa no-gate write
```

## Start route

```text
trackMatch returns eventId
→ HTTP success
```

```text
trackMatch returns null
→ bounded non-success
→ no false active session
```

## Stop

```text
logical stop ok
Python cleanup ok
remaining 0
→ overall success
```

```text
cleanup throws oppure remaining > 0
→ overall non-success/degraded secondo contract
```

`betfair_login` resta preservato.

## Mismatch

```text
Sofa child in-flight
Betfair child in-flight
→ mismatch
→ tracking children chiusi secondo policy
→ login/CDP preservati
→ cleanup result osservabile
```

## Technical sample

```text
technical sample
→ no gate
→ no current sample-derived commit
→ repairOnly consentito
```

Con pending journal può essere completato un commit precedente; senza pending journal → unchanged.

## Technical error redaction

Errore con URL/path/token deve restare bounded/redacted in runtime, health e log.

## Finished

```text
authoritative finished
→ stop Betfair polling

weak visible-text hint
→ non stop

logout/fetch error/no ladder/api_error
→ retry
```

## Scheduler

Con clock fake verificare che un update lungo sposti il successivo start a `completion + interval`.

## Verification owner

Usare suite realmente presenti e aggiungere test specifici per i boundary sopra.

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

## Esito dell'intervento

Completato il 10 agosto 2026. Le task `SOFA-LIVE-001..009` sono state applicate: autorità di sessione ricontrollata prima delle scritture, acknowledgement Start bounded, Stop coerente con il cleanup fisico, mismatch esteso a tutti i child tracking, semantica `repairOnly` consolidata, diagnostica strutturata e redatta, weak finished hint non terminale, scheduler documentato come minimum delay e matrice di verifica riallineata.

I test mirati di route, lifecycle, gate routing, technical recovery e runtime health risultano superati. Login-only e Chrome/CDP restano fuori dallo scope di terminazione tracking.

```text
01-live-tracking.md: OWNER CORRETTO, MA GARANZIE DI TRANSIZIONE E CLEANUP TROPPO FORTI

scheduler: implementato
active operations registry: implementato
terminal drain: solido
writer release guard: solido
Source Identity integration: reale
bootstrap order: reale
Sofa-only not-applicable: reale
ordinary Stop separato da shutdown: corretto

trackingSessionId: assente
ordinary Stop/untrack: non drenano update Node
no-gate fail-open: finding già aperto
Start route: può dichiarare successo dopo rifiuto tracker
Stop route: può dichiarare successo con cleanup fallita
mismatch: non termina esplicitamente Sofa child
mismatch cleanup outcome: non governa lifecycle
technical sample: chiama repairOnly
technical sample: key calcolata prima della classifier
lastSuccessfulScrapeAt: non commit timestamp
finished boolean: upstream authority ancora debole
technical error reason: detail non redatto e pubblico via health
console logging runtime: ancora presente
5s/6s: delay dopo completion, non periodicità start-to-start
Sofa URL extraction: non validator
verification paths: parzialmente stale
live validation inline: provenance insufficiente

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: critica
```

La regola centrale da rendere vera end-to-end è:

```text
una sessione tracking
→ possiede un'identità
→ solo operazioni appartenenti a quell'identità
  possono osservare gate e raggiungere persistence
```

La seconda è:

```text
Stop / mismatch
→ distinguono cleanup logico da completion fisica
→ non dichiarano successo totale se esistono processi o operazioni non chiusi
```

La terminal tracker barrier resta un meccanismo separato, corretto e specifico dello shutdown processo.
