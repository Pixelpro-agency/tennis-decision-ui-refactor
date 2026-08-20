# Tennis Decision UI — Audit della documentazione — checkpoint API

Questo modulo conserva il checkpoint storico B2 dell’audit delle API, incluso lo SHA `b277bd9b7373dfd8702e65446c88bab7a0f64dcc`, gli owner `DOC-009…013`, il riepilogo API e la distinzione tra test letti/ispezionati e test eseguiti.

Il riferimento a `DOC-003` collega B2 a una scheda owner nata nel blocco B1; non costituisce una seconda scheda owner.

## 11. Checkpoint B2 — audit API — SHA `b277bd9b7373dfd8702e65446c88bab7a0f64dcc`

### Perimetro verificato

Il perimetro seguente è quello del checkpoint B2:

```txt
API Match
API Betfair
API Evidence
API Strategy
API Preflight
API Runtime Health
```

Confronto eseguito con:

```txt
backend/src/server.js
backend/src/routes/match.js
backend/src/routes/match/
backend/src/routes/betfair.js
backend/src/routes/betfair/
backend/src/routes/evidence.js
backend/src/routes/evidence/
backend/src/routes/strategy.js
backend/src/routes/strategy/
backend/src/routes/test.js
backend/src/routes/test/
backend/src/runtime/pythonProcessRegistry.js
frontend/src/App.jsx
frontend/src/components/LayTheWinner.jsx
frontend/src/services/liveSessionApi.js
frontend/src/hooks/usePreflightChecks.js
```

Sono stati letti anche i test mirati disponibili per Match, Evidence, Strategy, Betfair, Graph URL e server health.

Nel checkpoint B2 questa verifica provava la presenza e il contenuto dei test sul repository. Non equivaleva alla loro esecuzione sullo SHA di quel checkpoint.

---

### Esito sintetico per API

| API            | Esito audit                                                                          | Rilievi principali                        |
| -------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| Match          | contratto prevalentemente coerente                                                   | `DOC-009`, `CODE-003` sul debug legacy    |
| Betfair        | contratto prevalentemente coerente ma sovradocumentato                               | `DOC-010`, `DOC-011`                      |
| Evidence       | contratto dettagliato e quasi coerente                                               | `DOC-003`, `DOC-011`                      |
| Strategy       | contratto coerente con una superficie legacy ancora attiva                           | `DOC-012`, `CODE-001`, `CODE-004`         |
| Preflight      | documento coerente con il codice, ma il codice valida troppo permissivamente Betfair | `DOC-013`, `CODE-002`                     |
| Runtime Health | contratto coerente con codice e test ispezionato                                     | nessuna correzione funzionale individuata |

---

### DOC-009 — `debug-last` è documentato come dato disponibile ma non ha un producer reale

**Stato corrente:** `RISOLTO LATO DOCUMENTAZIONE; RESIDUO LEGACY NEL CODICE`. `lastDebugData` resta inizializzato a `null` e non riceve assegnazioni nel router, ma l'owner API corrente descrive esplicitamente `debug-last` come superficie deprecata priva di producer.

**Stato nel checkpoint:** `CONFERMATO`

**Priorità nel checkpoint:** media

**Area:** API Match

**Documento coinvolto nel checkpoint:** documentazione API Match.

**Codice coinvolto:**

```txt
backend/src/routes/match.js
backend/src/routes/match/readResponses.js
backend/src/routes/match/readResponses.test.mjs
```

**Osservazione**

Il documento descrive:

```txt
GET /api/match/debug-last
→ restituisce l’ultimo debug disponibile
```

Nel router, però:

```txt
let lastDebugData = null
```

e non esiste alcuna assegnazione successiva. Anche `logDebug(...)` non aggiorna quel valore: emette soltanto un evento statico nel runtime logger.

Il test di `buildDebugLastResponse` dimostra che l’helper saprebbe restituire un oggetto ricevuto, ma non prova che il router ne produca o ne conservi uno.

**Comportamento effettivo**

```txt
GET /api/match/debug-last
→ sempre { error: "No data captured yet" }
```

finché il codice resta invariato.

**Azione proposta nel checkpoint**

Prima della riscrittura scegliere una delle due opzioni:

1. rimuovere endpoint e documentazione se il debug è legacy;
2. definire un producer esplicito, bounded e redatto se il debug serve ancora.

Non reintrodurre payload raw o dati sensibili soltanto per rendere vivo l’endpoint.

**Criterio di chiusura del finding storico**

Il contratto documentato deve corrispondere a un comportamento realmente raggiungibile.

---

### DOC-010 — L’API Betfair cita un adapter con nome non esistente

**Stato corrente:** `RISOLTO`. Router e response builder usano `getMatchPersistenceIntegrity(eventId, 'betfair')`; l'alias Betfair inesistente non è necessario nel contratto corrente.

**Stato nel checkpoint:** `CONFERMATO`

**Priorità nel checkpoint:** media

**Area:** API Betfair e persistence integrity

**Documento coinvolto nel checkpoint:** documentazione API Betfair.

**Osservazione**

Il documento usa il nome:

```txt
getBetfairPersistenceIntegrity(eventId, source = 'betfair')
```

Il router e `latestPayload.js` usano invece:

```txt
getMatchPersistenceIntegrity(eventId, 'betfair')
```

importato da:

```txt
backend/src/sofa/matchHistory.js
```

**Impatto**

Il comportamento documentato è sostanzialmente corretto, ma il nome dell’adapter può portare a:

- cercare una funzione inesistente;
- creare un duplicato non necessario;
- preparare prompt con file o simboli sbagliati.

**Azione proposta nel checkpoint**

Usare ovunque il nome reale oppure descrivere genericamente l’adapter pubblico di persistence integrity senza inventare un alias Betfair.

**Criterio di chiusura del finding storico**

Tutti i simboli citati nel documento devono esistere sul repository.

---

### DOC-011 — I documenti API incorporano troppa logica dei moduli owner

**Stato corrente:** `SOSTANZIALMENTE RISOLTO LATO STRUTTURA API`. Match, Betfair ed Evidence sono oggi facades che rimandano a child per i contratti HTTP e agli owner di modulo per algoritmi e lifecycle. Il rilievo specifico `DOC-003` resta separatamente pertinente.

**Stato nel checkpoint:** `CONFERMATO`

**Priorità nel checkpoint:** alta

**Area:** API Match, Betfair ed Evidence

**Documenti coinvolti nel checkpoint:**

```txt
- documentazione API Match;
- documentazione API Betfair;
- documentazione API Evidence.
```

**Osservazione**

I documenti non si limitano al contratto HTTP. Ripetono in modo esteso:

- algoritmi Money Flow;
- regole di validazione raw/computed;
- logout Graph e tick `status-only`;
- lifecycle e ownership dei processi;
- journal, recovery e normalizzazione integrity;
- fasi Source Identity;
- bootstrap;
- degradazione cross-source;
- cronologia di collaudi e assenza di specifiche prove post-fix;
- lunghe matrici di test appartenenti ai moduli.

**Motivo**

Una API deve possedere principalmente:

```txt
metodo
path
input
output
status
side effect
sicurezza
owner delegati
```

Le regole algoritmiche e di lifecycle devono avere owner nei documenti Betfair, Storage, Source Identity, Evidence e Runtime.

**Cosa mantenere nelle API**

- shape pubbliche;
- status HTTP;
- effetti collaterali osservabili;
- errori pubblici;
- differenza read-only/mutante;
- link ai documenti owner;
- smoke test e test di contratto essenziali.

**Cosa spostare**

- algoritmi Money Flow → modulo Betfair/Money Flow;
- journal e recovery dettagliati → Storage;
- gate e bootstrap → Source Identity;
- health e process lifecycle → Runtime/Betfair;
- validazioni storiche e prove live → registro separato delle validazioni.

**Criterio di chiusura del finding storico**

Il contratto HTTP deve restare completo senza diventare una seconda copia dei moduli interni.

---

### DOC-012 — Strategy è legacy ma ancora parte del runtime corrente

**Stato corrente:** `SUPERATO DAL CODICE CORRENTE`. `createApp()` non monta più un router Strategy, l'API canonica corrente non contiene un documento Strategy e `frontend/src/App.jsx` non importa né rende `LayTheWinner`. La descrizione seguente resta valida soltanto per il checkpoint storico.

**Stato nel checkpoint:** `CONFERMATO`

**Priorità nel checkpoint:** media

**Area:** API Strategy

**Documento coinvolto nel checkpoint:** documentazione API Strategy.

**Codice verificato:**

```txt
backend/src/routes/strategy.js
backend/src/routes/strategy/layTheWinner.js
frontend/src/App.jsx
frontend/src/components/LayTheWinner.jsx
```

**Osservazione**

La Strategy non è codice morto:

```txt
App.jsx
→ importa LayTheWinner
→ rende la vista quando activeView = lay

LayTheWinner.jsx
→ chiama GET /api/strategy/lay-the-winner
→ polling ogni 3 secondi
```

Il backend continua a:

- eseguire `buildSofaAnalysis(eventId)`;
- leggere la timeline Betfair;
- costruire il view model;
- restituire Market Evidence;
- dichiarare il segnale legacy non disponibile.

**Conclusione**

La classificazione corretta è:

```txt
superficie implementata
+ consumer frontend attivo
+ strategia operativa disabilitata/legacy
```

Non deve essere eliminata come codice morto durante un cleanup generico.

**Azione proposta nel checkpoint**

Il documento futuro deve distinguere:

- endpoint e UI ancora attivi;
- segnale e probabilità non disponibili;
- Market Evidence ancora resa;
- decisione futura dell’utente su mantenimento, isolamento o rimozione.

**Criterio di chiusura del finding storico**

Strategy deve essere descritta come legacy attiva, non come funzione completa né come codice inutilizzato.

---

### DOC-013 — Il documento Preflight non può promettere una vera validazione Betfair finché il controllo resta permissivo

**Stato corrente:** `RISOLTO LATO CODICE E DOCUMENTAZIONE`. `POST /api/test/betfair-url` usa `classifyBetfairUrl(..., { requireEventId: true })`; il validator canonico richiede HTTPS, host Betfair in allow-list, nessuna credenziale o porta esplicita e un event ID valido.

**Stato nel checkpoint:** `CONFERMATO`

**Priorità nel checkpoint:** alta

**Area:** API Preflight

**Documento coinvolto nel checkpoint:** documentazione API Preflight.

**Codice coinvolto:**

```txt
backend/src/routes/test.js
frontend/src/hooks/usePreflightChecks.js
```

**Osservazione**

Il documento presenta:

```txt
POST /api/test/betfair-url
→ valida sintatticamente URL e event ID Betfair
```

Il codice usa:

```js
/betfair\.\w+$/i
```

sul solo hostname e non limita il protocollo.

Questo controllo può accettare host che terminano testualmente in `betfair.<tld>` senza essere domini Betfair effettivi e può accettare protocolli diversi da HTTP/HTTPS.

La validazione `login-window`, invece, usa un controllo più stretto su `betfair.it` e sottodomini con protocollo HTTP/HTTPS.

**Impatto documentale**

Finché `CODE-002` non viene risolto, il documento deve parlare di:

```txt
controllo sintattico permissivo attuale
```

e non di validazione affidabile del dominio Betfair.

**Azione proposta nel checkpoint**

Allineare prima il codice su un validatore condiviso; poi documentare il contratto definitivo.

**Criterio di chiusura del finding storico**

Preflight e login non devono applicare nozioni incompatibili di URL Betfair valida.

---

### API Runtime Health — nessuna discrepanza funzionale confermata nel checkpoint

**Stato corrente:** il verdetto “nessuna discrepanza” appartiene esclusivamente a B2 e non descrive più il contratto documentato corrente. Nel codice corrente `buildHealthResponse(...)` include `repositoryIdentity` e `storageIdentity`, mentre la documentazione API Runtime Health corrente non include questi due campi né nell'esempio della response né nella tabella dell'identità backend. La discrepanza corrente è quindi documentale e distinta dall'esito storico del checkpoint.

Il contratto di:

```txt
GET /api/health
```

corrisponde a `createApp()` e allo snapshot pubblico del process registry.

Sono stati verificati:

- identità backend;
- `instanceId`, `pid`, `startedAt`, `timestamp`;
- shape `pythonProcesses`;
- tre ruoli pubblici;
- esclusione di `ownerToken`, `cdpUrl` e `profileDir`;
- test HTTP dedicato in `backend/src/server.test.mjs`.

Non è richiesta una riscrittura funzionale del contratto. Resta da valutare soltanto l’eventuale riduzione delle duplicazioni con Runtime locale.

---

### Stato del blocco API nel checkpoint B2

```txt
audit dei sei documenti API
→ COMPLETATO

correzione dei documenti canonici
→ NON ANCORA ESEGUITA

test automatici
→ LETTI, NON ESEGUITI IN QUESTA FASE

prossimo blocco
→ moduli SofaScore, Betfair, Storage ed Evidence
```

---

### Riconciliazione corrente del blocco API

Il checkpoint B2 resta conservato come evidenza storica, ma il suo stato operativo non descrive il repository corrente.

```txt
DOC-003
→ ancora pertinente nell'owner API Evidence
→ la facade attribuisce POST/DELETE al solo confirmation store
→ il child documenta il bootstrap ma contiene una sequenza interna contraddittoria
→ il codice esegue onOpenRecording prima dell'upsert della conferma

DOC-009
→ problema documentale risolto
→ endpoint legacy ancora presente
→ nessun producer corrente per lastDebugData

DOC-010
→ risolto
→ adapter reale: getMatchPersistenceIntegrity(eventId, 'betfair')

DOC-011
→ sostanzialmente assorbito dalla nuova struttura facade + child API
→ gli algoritmi e i lifecycle sono rimandati agli owner di modulo

DOC-012
→ superato dalla rimozione di Strategy dal runtime corrente

DOC-013
→ risolto
→ validator Betfair canonico condiviso e non più permissivo come nel checkpoint

Runtime Health
→ il giudizio storico di coerenza non certifica il payload corrente
→ buildHealthResponse espone repositoryIdentity e storageIdentity
→ l'owner API corrente omette entrambi i campi dalla response documentata
```

La frase storica «correzione dei documenti canonici → NON ANCORA ESEGUITA» appartiene quindi al checkpoint B2. Non deve essere interpretata come stato corrente generale.

I test citati nelle sezioni storiche furono **letti/ispezionati, non eseguiti** nel checkpoint, salvo indicazione esplicita diversa.


## Navigazione

- [Facade rilievi iniziali e API](../01-rilievi-iniziali-e-api.md)
- [Rilievi iniziali](./01-rilievi-iniziali.md)
- [Audit della documentazione](../../02-audit-documentazione.md)
