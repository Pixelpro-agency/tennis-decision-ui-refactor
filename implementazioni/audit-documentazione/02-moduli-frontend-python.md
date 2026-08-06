## 12. Checkpoint B3 — documenti owner dei moduli

### Perimetro

Verificati sullo SHA:

```txt
b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

Documenti:

```txt
modules/sofa/01-live-tracking.mdx
modules/sofa/02-local-context-and-point-by-point.mdx

modules/betfair/01-scraper-lifecycle.mdx
modules/betfair/02-technical-sample-validity.mdx

modules/storage/01-timelines-and-history.mdx
modules/storage/02-commit-journal-and-recovery.mdx

modules/evidence/01-match-evidence-snapshot.mdx
modules/evidence/02-source-identity.mdx
modules/evidence/03-quality-flow-and-alignment.mdx
modules/evidence/04-market-reactions.mdx
```

Sono stati confrontati con tracking, gate, point-by-point, local context, processor Betfair, timeline, history, journal, recovery, Evidence e Market Reactions.

I test sono stati letti, ma non eseguiti.

### Esito sintetico

| Documento | Esito | Intervento futuro |
| --- | --- | --- |
| Tracking live | Contratto principale coerente, file troppo esteso | Limitare a scheduler e orchestrazione |
| Local context/PBP | Coerente con il codice | Preservare; validare live l’ultimo game |
| Lifecycle Betfair | Coerente, sovrapposto a Runtime e Storage | Ridurre e collegare gli owner |
| Validità tecnica | Coerente nel dominio | Correggere l’ordine key/classificazione |
| Timeline/history | Sostanzialmente coerente | Separare facade e journal |
| Journal/recovery | Coerente e vicino a un owner valido | Pulizia e conversione `.md` |
| Match Evidence | Coerente | Ridurre ripetizioni integrity/identity |
| Source Identity | Coerente | Preservare gate live/effective snapshot |
| Qualità/flow/alignment | Coerente | Ridurre ripetizioni |
| Market Reactions | Filosofia coerente, input descritto male | Correggere composizione e confini |

---

## DOC-014 — Tracking key Betfair calcolata prima della classificazione

**Stato:** `CONFERMATO`
**Priorità:** media documentale, bassa operativa

I documenti dichiarano:

```txt
fetch
→ classificazione tecnica
→ tracking key
→ gate
→ persistenza
```

e affermano che un campione tecnico non utilizzabile non chiama `getBetfairTrackingKey`.

Il codice di `backend/src/sofa/betfair/trackerUpdate.js` esegue invece:

```txt
fetch
→ hasFinished
→ getBetfairTrackingKey
→ classifyBetfairTechnicalSample
```

`getBetfairTrackingKey` è una trasformazione pura basata su `scraperKey`; non modifica gate, baseline o persistenza. La discrepanza è quindi documentale, non un bug operativo dimostrato.

### Azione

Durante la riscrittura scegliere:

```txt
A. correggere il documento
oppure
B. spostare il calcolo dopo la classificazione
```

La soluzione A è la modifica minima.

---

## DOC-015 — I documenti owner B3 duplicano contratti trasversali

**Stato:** `CONFERMATO`
**Priorità:** alta

Esempi:

```txt
Tracking live
→ registry, generation, Betfair validity, Source Identity, storage

Lifecycle Betfair
→ registry, tracker, processor, storage, integrity, retention

Timeline/history
→ gate, validità Betfair, journal, recovery, logout Graph

tutti i documenti Evidence
→ integrity, persistenceComplete, Source Identity, no-causality
```

La stessa regola compare quindi in più file e può divergere.

### Ownership finale proposta

```txt
Tracking live
→ scheduler e orchestrazione

Runtime
→ generation, processi e terminazione

Validità tecnica Betfair
→ classificazione del sample

Source Identity
→ gate, effective identity e conferma

Timeline/history
→ documenti canonici e writer

Journal/recovery
→ commit multi-documento, integrity e repair

Match Evidence
→ composizione snapshot

Qualità/flow/alignment
→ qualità e osservazioni descrittive

Market Reactions
→ Market→Field e Field→Market
```

Gli altri file devono contenere soltanto una breve precondizione e un link all’owner.

---

## DOC-016 — Facade Storage e formule read-only troppo forti

**Stato:** `CONFERMATO`
**Priorità:** media

### `addBetfairUpdate`

Il documento la elenca fra le API della history, ma nel codice è una facade di compatibilità:

```txt
addBetfairUpdate
→ prepareBetfairHistory
→ prepara soltanto il documento
```

Il processor Betfair è l’owner dell’unico commit canonico journalizzato.

### Inizializzazione delle directory

`timelineStore.js` crea `backend/match_history/` al caricamento quando manca.

`createHistoryStorage(...)` inizializza anch’esso la directory ricevuta.

Quindi:

```txt
la route read-only non scrive history/timeline/journal
```

è corretto, mentre:

```txt
l’intero modulo non crea mai directory
```

non lo è.

### Correzione

```txt
addBetfairUpdate
→ facade legacy prepare-only

request read-only
→ nessuna scrittura canonica

inizializzazione storage
→ può assicurare le directory project-owned
```

---

## DOC-017 — Market Reactions non riceve uno snapshot già costruito

**Stato:** `CONFERMATO`
**Priorità:** media

Il documento dichiara:

```txt
Market Reactions consuma solo snapshot Evidence già costruiti
```

Il flusso reale è:

```txt
buildLatestMatchEvidenceFromTimelines
→ selezione epoch e tick
→ buildEvidenceFromTicks
→ scoping per Source Identity e integrity
→ buildMarketReactionEvidence({ sofaTicks, betfairTicks, now })
→ snapshot Evidence finale
```

Market Reactions viene quindi composto durante il builder e riceve array di tick già scoped, non uno snapshot completo.

### Formula corretta

```txt
Evidence builder
→ seleziona tick attribuibili
→ passa array scoped
→ Market Reactions costruisce i rami
→ risultato inserito nello snapshot
```

Il modulo resta puro rispetto a I/O, journal, tracking e persistenza.

---

## Verifiche senza discrepanze funzionali confermate

### Local context e point-by-point

Il codice conferma:

```txt
token: 0, 15, 30, 40, A
→ ultimo game escluso come potenzialmente aperto
→ esatti tre game precedenti
→ nessun fallback a game più vecchi
→ available basato su pointsTotal
→ qualità complete solo con finestra recente valida
```

Resta la validazione live `SOFA-001`.

### Journal e recovery

Confermati:

```txt
commitId source-UUID
→ pending prima dei writer
→ marker history/timeline
→ verifica target completed residual
→ riapertura marker mancanti
→ recovery prima di listen
→ fatal globale separato dalle failure per-file
```

### Source Identity

Confermati lifecycle e azioni:

```txt
collecting / pending / recording / mismatch / not-applicable

buffered / persist-current / bootstrapped / blocked / no-gate
```

Confermati anche confirmation store atomico e separazione fra gate live ed effective identity.

### Logout Graph `status-only`

Il processor produce `timelineIntegrity.accepted:false` per regressioni e la persistence decision applica il controllo Graph-login specifico. La limitazione documentata al `regressive_sample` è coerente.

Resta aperto `TEST-001`.

---

## Decisione differita — EVIDENCE-001

Field → Market confronta i runner così:

```txt
selectionId presente
→ match per selectionId

selectionId assente
→ fallback su nome identico e selectionId assente
```

Il resto del dominio Betfair usa normalmente `selectionId` come identità unica.

Alternative:

```txt
A. selectionId obbligatorio
→ nessun confronto senza ID

B. fallback esatto per nome
→ qualità degradata
→ reason esplicita
→ test dedicato
```

Non modificare questa scelta durante la sola riscrittura documentale.

---

## Esito B3

```txt
documenti owner verificati
→ duplicazioni classificate
→ discrepanze documentali registrate
→ problemi di codice separati
→ nessuna modifica a docs/ o al codice
```

Prossima fase:

```txt
B4 — Frontend e Python
```

---

## 13. Checkpoint B4 — Frontend e Python

### 13.1 Perimetro verificato

Documenti frontend:

```txt
modules/frontend/01-session-shell.mdx
modules/frontend/02-live-polling-and-view-model.mdx
modules/frontend/03-betfair-and-market-reactions-ui.mdx
modules/frontend/04-match-context-ui.mdx
```

Documenti Python:

```txt
modules/python/01-entrypoints-and-runtime.mdx
modules/python/02-sofascore-scraper.mdx
modules/python/03-betfair-scraper.mdx
modules/python/04-betfair-graph-url-validation.mdx
```

Confrontati con:

```txt
App.jsx
hook sessione, polling, bootstrap, Source Identity e health
view model e componenti principali
vite.config.js
launcher/app.py e launcher/services.py
wrapper root Python
package scrapers/sofa
package scrapers/betfair
route /api/betfair/odds
processor Node Betfair
test frontend e Python mirati
```

I test sono stati letti, ma non eseguiti.

### 13.2 Esito sintetico

| Area | Esito |
| --- | --- |
| Session shell | Ownership coerente; failure Start lascia poller nascosti |
| Polling | Evidence e Source Identity protetti; SofaScore e Betfair non isolano le sessioni |
| View model | Mapping sportivo coerente; pipeline persistence descritta ma assente |
| Betfair UI | Money Flow e health coerenti; stato integrity non arriva ai componenti |
| Market Reactions UI | Rendering puro coerente; riceve solo il sottoblocco Market Reactions |
| Match Context | Coerente con il backend e senza fallback inventati |
| Launcher | Porte dinamiche e proxy Vite realmente collegati |
| Wrapper Python | Sottili e compatibili |
| SofaScore scraper | Contratto principale coerente |
| Betfair scraper | Contratto principale coerente con gap di hardening pubblico |
| Graph URL | Parser e mapping coerenti |

---

## DOC-018 — Pipeline `integrity` frontend descritta ma non implementata end-to-end

**Stato:** `CONFERMATO`
**Priorità:** alta

### Contratto documentato

`02-live-polling-and-view-model.mdx` descrive:

```txt
integrity SofaScore
+ integrity Betfair
+ integrity Evidence
→ useDashboardViewModel
→ persistence view state
→ componenti UI
```

Lo stesso documento afferma che il `409` SofaScore produce:

```txt
serverStatus: persistence_integrity
```

`03-betfair-and-market-reactions-ui.mdx` descrive inoltre label e stati degradati separati in BetfairDepthCard e Market Reactions.

### Comportamento reale

`useMatchPolling(...)` conserva una `integrity` separata, ma `App.jsx` non la destruttura.

`useBetfairJson(...)` conserva una `integrity` separata, ma `App.jsx` non la destruttura.

`useDashboardViewModel(...)` non accetta:

```txt
sofaIntegrity
betfairIntegrity
evidenceIntegrity
```

e restituisce soltanto:

```txt
dashboardData
betfairHistory
```

`BetfairDepthCard.jsx` non riceve alcuna prop di persistence integrity.

`useMarketReactionEvidence(...)` conserva soltanto:

```txt
payload.latest.marketReactionEvidence
```

Non conserva lo snapshot Evidence completo, la top-level `integrity`, le source integrity o `dataQuality.persistenceComplete` come stato separato.

`MarketReactionsPage.jsx` riceve quindi il solo sottoblocco Market Reactions.

### Nomi reali di `serverStatus`

Per il `409` SofaScore il codice e il test restituiscono:

```txt
partial_persistence
oppure
recovery_failed
```

Non:

```txt
persistence_integrity
```

### Valutazione

Il backend blocca già l’uso cross-source e inserisce reason dentro Market Reactions, quindi non è dimostrato che la pagina promuova evidenza proibita.

È però falsa la descrizione di una pipeline frontend generale capace di:

- mostrare l’integrity per sorgente;
- costruire un persistence view state;
- distinguere la degradazione nelle card;
- consumare lo snapshot Evidence completo.

### Azione futura

Definire un solo contratto UI:

```txt
hook
→ integrity normalizzata

App
→ inoltro esplicito

view model
→ persistence state separato

componenti
→ rendering informativo
→ nessun merge con health o Source Identity
```

Oppure ridurre la documentazione al comportamento realmente presente, se non si vuole introdurre questa UI.

---

## DOC-019 — Hardening Python descritto in modo più forte del comportamento pubblico

**Stato:** `CONFERMATO`
**Priorità:** alta

I documenti Python dichiarano che diagnostica e superfici pubbliche non espongono path locali o dati sensibili derivati dagli URL.

Sono emersi tre confini non rispettati completamente.

### Path della network capture

`summarize_network_capture(...)` include:

```txt
dump_dir
```

come percorso locale.

Il risultato passa attraverso:

```txt
scrape_betfair
→ processor Node
→ /api/betfair/odds
```

senza un serializer pubblico che rimuova il campo.

### Filename della cache

La cache redige il contenuto JSON, ma la chiave del file deriva dalla URL normalizzata:

```txt
URL
→ sostituzione caratteri non alfanumerici
→ filename
```

`normalize_betfair_url(...)` rimuove soltanto alcune query note. Altri valori di query possono quindi essere leggibili nel filename.

### Errori pubblici

Le route Match Analyze e Betfair Odds possono restituire:

```txt
error.message
```

direttamente al client.

Lo scraper SofaScore costruisce alcuni errori tramite `str(error)`.

### Correzione documentale

Finché il codice non viene irrobustito, il documento deve distinguere:

```txt
contenuti diagnostici redatti
≠
tutte le superfici pubbliche prive di path o dettagli runtime
```

Dopo la correzione del codice, il contratto forte potrà essere ripristinato.

---

## 13.3 Frontend — rilievi documentali collegati

### Sessione e Start fallito

Il documento dichiara intenzionalmente che, in caso di Start fallito:

```txt
shell nascosta
→ input preservati
→ configurazione confermata non cancellata
```

Non descrive però l’effetto derivato:

```txt
confirmedUrl ancora valorizzato
→ useDashboardViewModel mantiene loadMatch
→ useBetfairJson resta attivo
→ useMarketReactionEvidence resta attivo
```

La nuova documentazione dovrà separare:

```txt
input correnti da preservare
≠
sessione confermata che autorizza polling
```

### Polling e lifecycle

Il documento descrive correttamente `setTimeout`, ma non documenta l’assenza di cancellazione delle richieste in flight per SofaScore e Betfair.

Evidence e Source Identity possiedono già:

```txt
sessionId
requestId
AbortController
stale response guard
```

e devono essere usati come modello del contratto desiderato.

### Metodi Source Identity legacy

`useMarketReactionEvidence(...)` esporta ancora:

```txt
confirmSourceIdentity
revokeSourceIdentityConfirmation
```

Il flusso globale usa invece `useSourceIdentityGateUi(...)`.

`SourceIdentityControls.jsx` è già indicato come legacy non montato.

La documentazione deve evitare di presentare due authority concorrenti e classificare esplicitamente questi metodi durante il cleanup.

### Copy mojibake

Le stringhe:

```txt
ModalitÃ 
âEUR”
```

sono presenti nel sorgente e vengono renderizzate direttamente.

Non sono un problema di terminale o visualizzazione GitHub: appartengono ai file frontend correnti.

---

## 13.4 Aree coerenti da preservare

### Porte dinamiche frontend/backend

Il contratto relativo `/api` è corretto:

```txt
launcher seleziona backend
→ VITE_BACKEND_TARGET usa la porta scelta
→ Vite proxy /api inoltra al backend effettivo
```

Non introdurre host assoluti nei client frontend.

### Source Identity UI

Il polling gate usa:

```txt
session ID
request ID
AbortController
una sola fetch per sessione
```

La conferma e il mismatch sono posseduti da `useSourceIdentityGateUi(...)`.

Questo confine è coerente e costituisce un riferimento per gli altri hook.

### Money Flow UI

Sono coerenti:

```txt
selectionId come identità
→ 20 slot condivisi
→ volume abbinato neutro
→ nessuna barra per punti invalidi
→ base tecnica minima 100
```

### Match Context

Il frontend:

- inoltra `localContext`;
- valida numeri e finestra;
- non decodifica point-by-point;
- non crea fallback numerici;
- non trasforma differenze in segnali.

### Wrapper e launcher

I tre wrapper root sono sottili.

Il launcher:

- seleziona porte senza kill-by-port;
- configura Vite con backend effettivo;
- preserva CDP esterno;
- termina soltanto processi owned.

### Graph URL

Sono coerenti:

```txt
https obbligatorio
graphs.betfair.it
marketId / selectionId / 0
no credenziali o porta
no fallback per nome
duplicato riservato dopo mapping
skip delle URL successive salvo auth_suspected terminale
```

---

## Esito B4

```txt
frontend e Python verificati
→ contratti coerenti preservati
→ pipeline integrity falsa classificata
→ race sessione e failure Start registrate
→ hardening diagnostico incompleto registrato
→ nessuna modifica a docs/ o al codice
```

Prossima fase:

```txt
B5 — Operations e roadmap
```

---
