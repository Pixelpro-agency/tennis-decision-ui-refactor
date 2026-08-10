# Report documentale — `docs/tennis-decision-ui/api/04-strategy.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-008
Sequenza audit: 08/72
Documento analizzato: 04-strategy.md
Percorso documento: docs/tennis-decision-ui/api/04-strategy.md
Percorso report: Report documentale/08 - 04-strategy.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 207 righe
Ruolo dichiarato: contratto HTTP della Strategy legacy
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/server.js`;
- `backend/src/routes/strategy.js`;
- `backend/src/routes/strategy/layTheWinnerResponse.js`;
- `backend/src/routes/strategy/layTheWinner.js`;
- `backend/src/routes/strategy/layTheWinner/context.js`;
- `backend/src/routes/strategy/helpers.js`;
- `backend/src/routes/strategy/marketEvidence.js`;
- `backend/src/routes/strategy/marketEvidence/targetContext.js`;
- `backend/src/routes/strategy/marketEvidence/targetSignals.js`;
- i test Strategy presenti nel commit;
- `backend/src/sofa/extractEventId.js`;
- `frontend/src/App.jsx`;
- `frontend/src/components/Sidebar.jsx`;
- `frontend/src/components/LayTheWinner.jsx`;
- `frontend/src/components/BancaServizio.jsx`;
- `frontend/src/components/Superbreak.jsx`;
- i componenti frontend sotto `frontend/src/components/strategy/`;
- `implementazioni/99-decisioni-utente.md`;
- `implementazioni/audit-codice/01-rilievi-iniziali.md`;
- `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md`;
- le decisioni correnti su Strategy, session authority, Source Identity, Evidence e Market Reactions.

I due file mappa non sono stati modificati.

---

# Esito sintetico

```text
Coerenza con lo stato deprecato: ALTA
Coerenza con il comportamento HTTP di base: MEDIO-ALTA
Descrizione dei rischi del runtime legacy: INSUFFICIENTE
Contratti o semantiche da correggere: 6
Rischi tecnici rilevanti: 5
Modifiche proposte: 9
Necessità di riscrittura completa: SÌ
Necessità di modularizzazione: NO
Destinazione finale consigliata: RIMOZIONE DOPO CODE-001
```

Il documento identifica correttamente che:

- esiste un solo endpoint Strategy;
- la superficie è ancora montata nel backend;
- il consumer frontend è ancora attivo;
- il segnale Lay The Winner è disabilitato;
- la probabilità TOT non è disponibile;
- la rimozione della Strategy è già approvata;
- Evidence e Market Reactions devono essere preservati.

Il documento non è però sufficiente come descrizione affidabile del runtime legacy.

In particolare, presenta `marketEvidence` come semplice contesto separato, mentre il codice:

- seleziona un target runner;
- calcola price delta e matched delta;
- calcola volume acceleration;
- calcola imbalance;
- interpreta money-flow trend;
- produce pressure side e pressure score;
- produce confidence level e confidence score;
- può usare un favorito Betfair non associato ai giocatori SofaScore;
- non applica Source Identity;
- non applica persistence integrity;
- non applica active market epoch;
- non applica i gate tecnici moderni di Money Flow ed Evidence.

Questa superficie non deve essere trasformata in un nuovo owner o modularizzata.

La direzione corretta è:

```text
documentare fedelmente il rischio legacy
→ applicare CODE-001
→ rimuovere backend, polling e UI Strategy esclusivi
→ eliminare 04-strategy.md
→ conservare decisione e storico nei registri
```

---

# 1. Stato della superficie

## Esito: corretto

La classificazione corrente è corretta:

```text
superficie implementata
+
consumer frontend attivo
+
strategia operativa disabilitata
+
rimozione approvata
```

Il router è ancora montato:

```text
app.use('/api/strategy', strategyRouter)
```

Il frontend continua a:

- importare `LayTheWinner`;
- renderizzarlo quando `activeView === 'lay'`;
- mostrare Lay The Winner nella sidebar;
- mostrare anche Banca Servizio e Superbreak;
- interrogare l’endpoint ogni tre secondi.

La strategia non è quindi codice morto.

È codice legacy ancora raggiungibile.

Il documento usa correttamente:

```text
Deprecato
```

e non deve essere cambiato in:

```text
Rimosso
```

finché CODE-001 non viene applicata.

---

# 2. Decisione di rimozione e ownership documentale

## Esito: direzione corretta, conseguenza documentale incompleta

`DEC-008` approva la rimozione di:

```text
tre card Strategy
runtime/polling Strategy
backend esclusivo
```

e prescrive di preservare:

```text
Match Evidence
Market Reactions
Field → Market
Market → Field
Source Identity
```

`CODE-001` conferma la stessa direzione e richiede un inventario dei consumer reali prima della cancellazione.

Il documento Strategy dichiara la rimozione approvata, ma continua ad avere la forma di un owner API destinato alla manutenzione ordinaria.

## Finding `STRATEGY-API-001` — trasformare il documento in contratto temporaneo di dismissione

**Priorità:** alta  
**Tipo:** stato e ownership documentale

### Modifica richiesta

Finché il codice resta presente, riscrivere `04-strategy.md` come documento transitorio breve:

```text
stato legacy attivo
decisione di rimozione
endpoint ancora raggiungibile
consumer ancora presenti
rischi noti
scope esatto della futura rimozione
elementi da preservare
verifica post-rimozione
```

Non presentarlo come base per nuove estensioni.

Dopo l’applicazione verificata di CODE-001:

```text
rimuovere docs/tennis-decision-ui/api/04-strategy.md
```

e aggiornare:

- indice canonico;
- repository map;
- link;
- riferimenti API;
- contatori documentali;
- mappa dell’audit quando la modifica viene applicata.

Lo storico deve restare in:

```text
DEC-008
CODE-001
DOC-012
commit Git
```

Non creare un archivio canonico duplicato del documento eliminato.

---

# 3. Flusso HTTP

## Esito: sostanzialmente corretto

Il flusso descritto corrisponde alla route:

```text
query url
→ normalizeLayTheWinnerRequest
→ extractEventId
→ buildSofaAnalysis
→ loadTimeline('betfair', eventId)
→ buildLayTheWinnerViewModel
→ risposta JSON
```

È corretto che:

- la route non avvii il tracking;
- la route non avvii scraper Betfair;
- la route non scriva timeline o history;
- la route esegua un’analisi SofaScore;
- la route legga la timeline Betfair persistita;
- la route costruisca un view model frontend.

### Precisione necessaria

La route non è read-only rispetto al sistema nel senso più ampio.

Produce effetti collaterali di logging:

```text
backend_debug.log
console
```

ed esegue una richiesta SofaScore tramite `buildSofaAnalysis`.

La definizione corretta è:

```text
non muta lo storage canonico
ma esegue I/O di rete e logging
```

Questa correzione deve essere inclusa in `STRATEGY-API-007`.

---

# 4. Market Evidence legacy

## Esito: incompatibile con le authority moderne

Il documento afferma:

```text
marketEvidence
→ resta disponibile come contesto separato
```

La frase è troppo rassicurante.

Il builder Strategy non usa il contratto Match Evidence corrente.

Legge direttamente:

```text
loadTimeline('betfair', eventId)
```

e costruisce un proprio modello parallelo.

## Gate e authority non applicati

Il percorso non consuma:

- Source Identity effective;
- Source Identity Gate;
- persistence integrity;
- `persistenceComplete`;
- active Betfair market epoch;
- eligibility di Market Reactions;
- validità tecnica moderna dei sample;
- provenance temporale;
- reason standard di persistenza incompleta;
- copertura runner completa;
- comparabilità del prezzo;
- baseline versionate di Evidence.

## Validazione tick debole

`getValidBetfairTicks` richiede soltanto:

```text
source === betfair
seq numerico
runners array
```

Non esclude esplicitamente:

- `technicalFailure`;
- Graph health non affidabile;
- tick `status-only`;
- market epoch precedente;
- money flow invalidato;
- volume negativo o incoerente;
- reason raw/computed mismatch;
- runner identity non stabile;
- `selectionId` non coerente nel tempo.

## Name matching parallelo

La Strategy usa un proprio `namesMatch` basato su token e cognome.

Non usa la Source Identity canonica.

## Finding `STRATEGY-API-002` — Market Evidence Strategy bypassa i gate canonici

**Priorità:** critica  
**Tipo:** authority e affidabilità del dato

### Modifica documentale immediata

Sostituire:

```text
marketEvidence resta disponibile come contesto separato
```

con:

```text
Il payload legacy contiene ancora un blocco `marketEvidence`, ma questo
blocco non usa le authority correnti di Evidence, Source Identity,
persistence integrity e active market epoch.

Non deve essere interpretato come evidenza canonica e non deve essere
riutilizzato in nuove superfici.
```

### Modifica tecnica

Applicare CODE-001 e rimuovere il percorso.

Non migrare automaticamente questo builder dentro Match Evidence.

Qualunque informazione utile deve essere già disponibile o ricostruita tramite gli owner canonici:

```text
API Betfair
Match Evidence
Market Reactions
Source Identity
```

La task di rimozione deve verificare che nessun componente Strategy esclusivo venga scambiato per un componente Market Reactions condiviso.

---

# 5. Output direzionali ancora esposti

## Esito: contraddizione con la descrizione “nessuna decisione operativa”

Il documento dichiara:

```text
il router non produce una decisione operativa
non assegna un’azione di trading
non attribuisce causalità
```

È vero che:

```text
strategy.available = false
decision.signal = UNAVAILABLE
decision.action = null
```

Il payload e la UI espongono però ancora interpretazioni direzionali.

## Campi prodotti

```text
targetRole
targetRunner
priceDelta
priceDeltaPct
matchedDelta
volumeAcceleration
liquidity imbalance
moneyFlow.trend
pressure.side
pressure.score
pressure.label
confidence.level
confidence.score
```

`pressure.label` può assumere:

```text
market backing runner
market laying runner
mixed market pressure
```

La UI mostra esplicitamente:

```text
Money Flow
Pressure
Pressure Score
Volume Accel.
Confidence
```

Quindi la superficie non produce un ordine di trade, ma produce ancora un’interpretazione direzionale del mercato.

## Finding `STRATEGY-API-003` — il view model legacy espone segnali direzionali

**Priorità:** alta  
**Tipo:** contratto semantico

### Modifica richiesta

Il documento deve distinguere:

```text
decisione operativa disabilitata
≠
assenza di output direzionali legacy
```

Formula consigliata:

```markdown
Il campo `decision` è disabilitato, ma il blocco legacy
`marketEvidence` continua a esporre indicatori direzionali non canonici
come pressure, money-flow trend e confidence.

Questi campi non sono calibrati, non sono autorizzati al trade e sono
destinati alla rimozione con la superficie Strategy.
```

### Divieto

Non rinominare `pressure` o `confidence` per conservarli sotto un’altra UI senza una nuova decisione e senza passare dagli owner Evidence.

---

# 6. Selezione del target e contesto sportivo

## Esito: logica legacy con casi non affidabili

## Vincitore del primo set

Il codice considera vincitore:

```text
home > away
e
home >= 6
```

oppure il contrario.

Questo classifica erroneamente:

```text
6-5
5-6
```

come set concluso, anche se il set può essere ancora in corso.

## Fallback favorito di mercato

Quando non rileva un vincitore del primo set:

1. ordina i runner per prezzo;
2. sceglie il favorito;
3. prova ad associarlo ai giocatori SofaScore;
4. se non trova un’associazione, usa direttamente il nome Betfair;
5. cerca lo stesso nome nei runner;
6. rende il target disponibile.

Quindi un runner non associato ai giocatori SofaScore può comunque diventare il target.

## Continuità temporale

La ricerca nei tick usa il nome.

Non richiede una continuità canonica per:

```text
selectionId
marketId
active epoch
```

## Finding `STRATEGY-API-004` — target runner non sufficientemente affidabile

**Priorità:** alta  
**Tipo:** correttezza algoritmica legacy

### Modifica richiesta

Poiché la rimozione è approvata, non preparare una nuova classificazione strategica completa.

Nel documento transitorio dichiarare:

- il winner detection è legacy;
- il fallback favorito non dimostra identità cross-source;
- il matching non usa Source Identity;
- la continuità temporale non è garantita dal contratto Evidence;
- il blocco è destinato alla rimozione.

### Test mancante rilevante

Il test del contesto copre:

```text
6-4
```

ma non:

```text
6-5
5-6
7-5
7-6
```

Il test target conferma esplicitamente che un favorito Betfair non associato ai giocatori SofaScore viene comunque accettato.

Non estendere la suite per evolvere la strategia.

Aggiungere test soltanto se necessari a rendere sicura una fase transitoria precedente alla rimozione.

---

# 7. Validazione della query URL

## Esito: il nome del contratto è più forte della validazione reale

Il documento usa:

```text
url=<sofascoreMatchUrl>
```

e parla di:

```text
URL non valido
```

`normalizeLayTheWinnerRequest`:

- verifica soltanto che l’input sia una stringa non vuota;
- delega a `extractEventId`.

`extractEventId` può estrarre un ID da:

- hash `#id`;
- segmenti `/event/`;
- percorsi `/match/`;
- qualunque sequenza di 7–9 cifre;
- fallback di almeno 6 cifre.

Non verifica:

- protocollo;
- hostname SofaScore;
- credenziali;
- query;
- fragment ammessi;
- lunghezza;
- caratteri di controllo.

Una stringa non SofaScore contenente una sequenza numerica può superare la normalizzazione.

Inoltre `extractEventId` scrive nel log console l’intero input ricevuto.

## Finding `STRATEGY-API-005` — “SofaScore URL” non realmente validata

**Priorità:** alta  
**Tipo:** input e logging

### Correzione documentale immediata

Finché la route esiste, dichiarare:

```text
Il codice corrente non valida il dominio SofaScore.
Accetta qualunque stringa da cui `extractEventId` ricavi un ID.
```

Non descrivere il `400` come prova di validità del dominio.

### Modifica tecnica preferita

Rimuovere la route con CODE-001.

Non creare un nuovo validatore esclusivo Strategy.

Se la superficie deve restare temporaneamente raggiungibile, riusare il validator SofaScore canonico e impedire il logging dell’input raw.

---

# 8. Mapping degli errori runtime

## Esito: comportamento documentato ma non sicuro come contratto pubblico

Il documento descrive correttamente il mapping corrente:

```text
404 o not found → 404
403 o blocked → 503
altro → 500
```

e la precedenza del ramo `403/blocked`.

Il response builder restituisce però:

```json
{
  "error": "<messaggio originale>"
}
```

Problemi:

- il messaggio interno diventa pubblico;
- il mapping dipende da substring;
- `not found` e `blocked` sono case-sensitive;
- errori non `Error` vengono convertiti integralmente in stringa;
- path, URL o dettagli di dipendenze possono essere esposti;
- il frontend scarta comunque il body e mostra soltanto `API Error: <status>`.

## Finding `STRATEGY-API-006` — errore raw e mapping fragile

**Priorità:** alta  
**Tipo:** redazione e stabilità HTTP

### Modifica richiesta

La soluzione preferita è rimuovere la route.

Se resta temporaneamente disponibile, usare payload bounded:

```json
{
  "ok": false,
  "code": "strategy_source_not_found",
  "error": "SofaScore event not found."
}
```

```json
{
  "ok": false,
  "code": "strategy_source_unavailable",
  "error": "SofaScore is temporarily unavailable."
}
```

```json
{
  "ok": false,
  "code": "strategy_build_failed",
  "error": "Unable to build the legacy Strategy view."
}
```

Il dettaglio deve restare nel logging redatto.

Non trasformare questo hardening in un’estensione permanente della Strategy.

---

# 9. Logging del router

## Esito: logging sincrono, non bounded e precedente alla validazione

Ogni richiesta esegue:

```js
logDebug('New lay-the-winner request received');
```

prima di validare la query.

`logDebug` usa:

```js
fs.appendFileSync(LOG_FILE, ...)
```

Non è racchiuso in un `try/catch` best-effort.

Se la scrittura fallisce:

- il percorso può interrompersi prima del `400`;
- il contratto di input non è più garantito;
- il test route non osserva il problema perché sostituisce `appendFileSync`.

Per una richiesta valida viene scritta una seconda riga con l’eventId.

Il frontend interroga l’endpoint ogni tre secondi.

Il file può quindi crescere continuamente.

Il percorso non usa il runtime logger bounded già presente nel progetto.

## Finding `STRATEGY-API-007` — logging può alterare il contratto e crescere senza limite

**Priorità:** alta  
**Tipo:** side effect e affidabilità

### Modifica documentale

Dichiarare:

```text
la route scrive sincronicamente in backend_debug.log
prima della validazione
```

e non limitarsi a dire che il logging non cambia il JSON.

### Modifica tecnica

Con CODE-001:

```text
rimuovere il logging esclusivo Strategy
```

Se la route resta temporaneamente:

- validare prima;
- usare logging best-effort;
- usare reason code;
- non scrivere input raw;
- applicare limiti e retention;
- non far fallire la risposta per un errore del log.

---

# 10. Polling frontend e session authority

## Esito: consumer incompatibile con il runtime corrente

`LayTheWinner.jsx`:

```text
fetch ogni 3000 ms
```

verso:

```text
http://localhost:3001/api/strategy/lay-the-winner
```

Il polling non usa:

- URL relativa;
- porta backend risolta dal launcher;
- AbortController;
- request ID;
- trackingSessionId;
- command ID;
- guard contro risposte tardive;
- protezione da overlap fra richieste;
- controller condiviso dei poller;
- logging frontend bounded.

Il cleanup elimina soltanto l’intervallo.

Non annulla una richiesta già in corso.

Una risposta partita prima dell’unmount può ancora completare il proprio `setData` o `setError`.

`CODE-004` ha già registrato la porta hardcoded ed è stato assorbito dalla rimozione Strategy.

`DEC-019` prescrive session authority, abort e guard per i poller live.

## Finding `STRATEGY-API-008` — polling Strategy fuori dalla session authority

**Priorità:** critica  
**Tipo:** frontend lifecycle

### Azione richiesta

Non correggere la porta con una task autonoma.

Applicare CODE-001 e rimuovere:

- import `LayTheWinner`;
- ramo `activeView === 'lay'`;
- componente `LayTheWinner.jsx`;
- polling ogni tre secondi;
- voce sidebar;
- componenti Strategy esclusivi;
- Banca Servizio;
- Superbreak;
- route e backend esclusivo;
- mount `/api/strategy`;
- test esclusivi;
- documento API.

### Componenti placeholder

Banca Servizio e Superbreak espongono testi sintetici come:

```text
Monitoring
Risk Level Medium
Intensity High
Confidence 92%
```

senza un runtime dimostrato.

La loro rimozione è parte del confine approvato.

### Preservare

La rimozione non deve toccare:

- Overview;
- Betfair dashboard;
- Money Flow canonico;
- Market Reactions;
- Source Identity;
- Match Evidence;
- polling canonici della sessione.

---

# 11. Schema della risposta

## Esito: schema utile ma semanticamente incompleto

La struttura generale mostrata è riconoscibile.

Sono però necessarie diverse precisazioni.

## `app.tabs`

Il documento mostra:

```json
{
  "tabs": []
}
```

Il codice restituisce sempre tre tab legacy:

```text
Lay the Winner
Banca Servizio
Super Break
```

## `header.competition`

Il nome suggerisce una competizione.

Il valore viene invece costruito da:

```text
snapshot.status.description
```

Quindi può rappresentare una descrizione dello stato, non il torneo.

## `marketEvidence`

Il campo è sempre presente, ma non è sempre disponibile.

Può restituire:

```text
BETFAIR_TIMELINE_NOT_AVAILABLE
NOT_ENOUGH_BETFAIR_TICKS
RUNNER_MATCH_NOT_FOUND
```

La formula:

```text
marketEvidence resta disponibile
```

deve diventare:

```text
il blocco resta presente; available è condizionale
```

## `footerHints.source`

Il backend restituisce:

```text
SofaScore APIs
```

anche quando il view model comprende dati Betfair.

La label è incompleta.

## Mojibake

Nei moduli Strategy sono presenti fallback:

```text
â€”
```

al posto del trattino lungo canonico.

## Finding `STRATEGY-API-009` — schema ed evidenze di verifica da riallineare

**Priorità:** media  
**Tipo:** payload, qualità testuale e verificabilità

### Modifica documentale

Se il documento viene mantenuto temporaneamente:

- mostrare i tre tab reali;
- spiegare la semantica reale di `header.competition`;
- distinguere presenza e disponibilità di `marketEvidence`;
- dichiarare l’origine mista SofaScore/Betfair;
- correggere il mojibake;
- dichiarare che `strategy.exitPlan` non viene prodotto e la UI nasconde la card;
- non descrivere confidence o pressure come segnali affidabili.

### Verifica corrente incompleta

La sezione elenca:

```text
layTheWinnerResponse.test.mjs
layTheWinnerRoute.test.mjs
```

Il route test verifica soltanto:

- URL mancante;
- URL senza eventId.

Non verifica:

- successo;
- chiamata SofaScore;
- lettura Betfair;
- view model;
- error mapping route-level;
- market evidence;
- log failure;
- polling;
- cleanup;
- porta alternativa;
- Source Identity;
- integrity;
- cambio market epoch.

Esistono inoltre test modulari non citati:

```text
layTheWinner/context.test.mjs
marketEvidence/targetContext.test.mjs
marketEvidence/targetSignals.test.mjs
```

### Direzione della verifica

Poiché la rimozione è approvata, non ampliare la suite per mantenere a lungo la feature.

La verifica principale deve diventare una verifica di rimozione completa e di non regressione delle superfici preservate.

---

# 12. Modularizzazione del documento

## Esito: non necessaria

```text
Righe: 207
Endpoint: 1
Responsabilità primaria: 1
Stato: deprecato
Rimozione approvata: sì
Contesti separabili che richiedono owner nuovi: no
Suddivisione consigliata: no
```

Il documento non è eccessivamente lungo.

Contiene:

- un endpoint;
- un solo consumer principale;
- una sola feature legacy;
- una sola decisione di lifecycle.

Dividerlo in:

```text
strategy/endpoint.md
strategy/market-evidence.md
strategy/frontend.md
```

creerebbe nuovi owner per una superficie già destinata alla cancellazione.

## Decisione di modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

La modifica consigliata è una riduzione temporanea, seguita dalla rimozione.

Non una divisione.

---

# 13. Struttura temporanea consigliata del documento

Finché CODE-001 non viene eseguita:

```text
# API Strategy legacy

## Stato
## Decisione di rimozione
## Superficie ancora attiva
## Endpoint
## Effetti collaterali
## Limiti e rischi noti
## Consumer da rimuovere
## Elementi da preservare
## Verifica della rimozione
```

Il documento non deve mantenere descrizioni approfondite di:

- pressure score;
- confidence;
- market favourite;
- money-flow trend;
- target runner;
- algoritmi legacy.

Questi dettagli non devono diventare owner permanenti.

Devono essere citati soltanto come motivazione della rimozione.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-008
Percorso report: Report documentale/08 - 04-strategy.md
Documento: docs/tennis-decision-ui/api/04-strategy.md
Change ID: STRATEGY-API-001
Change ID: STRATEGY-API-002
Change ID: STRATEGY-API-003
Change ID: STRATEGY-API-004
Change ID: STRATEGY-API-005
Change ID: STRATEGY-API-006
Change ID: STRATEGY-API-007
Change ID: STRATEGY-API-008
Change ID: STRATEGY-API-009
Suddivisione richiesta: no
Nuovi file proposti: nessuno
Destinazione finale: rimozione dopo CODE-001
```

I due file mappa dovranno registrare in futuro:

- riferimento al report;
- nove task con checkbox;
- modularizzazione valutata e non necessaria;
- nessun nuovo file proposto;
- destinazione finale di rimozione.

Non sono stati aggiornati durante questa analisi.

---

# Modifiche proposte

## `STRATEGY-API-001` — riscrivere come contratto temporaneo di dismissione

**Priorità:** alta

**Azione:**

- ridurre il documento;
- descrivere superficie ancora attiva;
- collegare DEC-008, CODE-001 e CODE-004;
- definire scope di rimozione e preservazione;
- eliminare il documento dopo rimozione verificata.

**File coinvolti:**

```text
docs/tennis-decision-ui/api/04-strategy.md
docs/tennis-decision-ui/index.md
documenti che collegano API Strategy
```

---

## `STRATEGY-API-002` — dichiarare non canonico il Market Evidence Strategy

**Priorità:** critica

**Azione:**

- correggere la descrizione;
- dichiarare i gate non applicati;
- vietare riuso ed estensione;
- rimuovere il builder con CODE-001;
- preservare Evidence e Market Reactions canonici.

**File potenzialmente coinvolti:**

```text
backend/src/routes/strategy/marketEvidence.js
backend/src/routes/strategy/marketEvidence/
backend/src/routes/strategy/helpers.js
frontend/src/components/strategy/MarketEvidenceCard.jsx
frontend/src/components/strategy/marketEvidence/
docs/tennis-decision-ui/api/04-strategy.md
```

---

## `STRATEGY-API-003` — correggere la descrizione degli output direzionali

**Priorità:** alta

**Azione:**

- distinguere decisione disabilitata e indicatori direzionali ancora esposti;
- non promuovere pressure, confidence o trend a Evidence canonica;
- rimuovere tali output con la superficie Strategy.

**File potenzialmente coinvolti:**

```text
backend/src/routes/strategy/marketEvidence.js
backend/src/routes/strategy/marketEvidence/targetSignals.js
frontend/src/components/strategy/marketEvidence/
docs/tennis-decision-ui/api/04-strategy.md
```

---

## `STRATEGY-API-004` — registrare i limiti del target context legacy

**Priorità:** alta

**Azione:**

- documentare il falso positivo 6-5;
- documentare il favorito non associato a SofaScore;
- documentare l’assenza di Source Identity e active epoch;
- non preparare un refactor strategico salvo necessità transitoria;
- rimuovere il percorso con CODE-001.

**File potenzialmente coinvolti:**

```text
backend/src/routes/strategy/layTheWinner/context.js
backend/src/routes/strategy/marketEvidence/targetContext.js
test collegati
docs/tennis-decision-ui/api/04-strategy.md
```

---

## `STRATEGY-API-005` — correggere il contratto della URL

**Priorità:** alta

**Azione:**

- non descrivere l’input come URL SofaScore validata;
- dichiarare il comportamento permissivo corrente;
- impedire logging raw;
- usare il validator canonico soltanto se la route resta temporaneamente;
- preferire la rimozione.

**File potenzialmente coinvolti:**

```text
backend/src/routes/strategy/layTheWinnerResponse.js
backend/src/sofa/extractEventId.js
test
docs/tennis-decision-ui/api/04-strategy.md
```

---

## `STRATEGY-API-006` — rimuovere errori raw

**Priorità:** alta

**Azione:**

- usare code bounded se la route resta;
- non esporre messaggi interni;
- testare path, URL e valori non Error;
- rimuovere il response builder con la route finale.

**File potenzialmente coinvolti:**

```text
backend/src/routes/strategy/layTheWinnerResponse.js
backend/src/routes/strategy/layTheWinnerResponse.test.mjs
docs/tennis-decision-ui/api/04-strategy.md
```

---

## `STRATEGY-API-007` — eliminare il logging sincrono esclusivo

**Priorità:** alta

**Azione:**

- dichiarare il side effect corrente;
- impedire che il log preceda e rompa la validazione;
- non mantenere `backend_debug.log` per la Strategy;
- rimuovere il logging con CODE-001.

**File coinvolti:**

```text
backend/src/routes/strategy.js
backend_debug.log, se generato localmente
docs/tennis-decision-ui/api/04-strategy.md
```

---

## `STRATEGY-API-008` — rimuovere polling e UI Strategy

**Priorità:** critica

**Azione:**

- applicare CODE-001;
- rimuovere route, mount, polling e componenti esclusivi;
- rimuovere le tre voci Strategy;
- non correggere separatamente la porta hardcoded;
- verificare l’assenza di richieste stale;
- preservare le superfici canoniche.

**File sicuramente o probabilmente coinvolti:**

```text
backend/src/server.js
backend/src/routes/strategy.js
backend/src/routes/strategy/
frontend/src/App.jsx
frontend/src/components/Sidebar.jsx
frontend/src/components/LayTheWinner.jsx
frontend/src/components/BancaServizio.jsx
frontend/src/components/Superbreak.jsx
frontend/src/components/strategy/
docs/tennis-decision-ui/api/04-strategy.md
docs/tennis-decision-ui/index.md
```

L’inventario finale dei consumer deve precedere la cancellazione.

---

## `STRATEGY-API-009` — riallineare schema e verifica

**Priorità:** media

**Azione:**

- correggere tab, competition, source e disponibilità;
- correggere mojibake;
- dichiarare i test realmente presenti;
- orientare la verifica alla rimozione;
- non ampliare la feature.

**File coinvolti:**

```text
docs/tennis-decision-ui/api/04-strategy.md
test Strategy
eventuali componenti temporaneamente mantenuti
```

---

# Ordine consigliato di applicazione

```text
1. inventariare tutti i consumer Strategy;
2. classificare ogni file come esclusivo o condiviso;
3. fissare la baseline di superfici da preservare;
4. rimuovere le tre voci Strategy dalla sidebar;
5. rimuovere i rami Strategy da App;
6. rimuovere polling e componenti esclusivi;
7. rimuovere route e moduli backend esclusivi;
8. rimuovere mount /api/strategy;
9. rimuovere test esclusivi non più utili;
10. eliminare 04-strategy.md;
11. aggiornare indice, mappe e link;
12. eseguire test backend/frontend e checker documentali.
```

Non è consigliato:

```text
correggere prima pressure, confidence e favourite fallback
→ poi rimuovere tutto
```

Le sole correzioni transitorie ammissibili sono quelle necessarie a evitare un rischio immediato prima della rimozione.

---

# Verifica prevista dopo la rimozione

## Ricerca dei riferimenti

```bash
git grep -n "/api/strategy"
git grep -n "lay-the-winner"
git grep -n "LayTheWinner"
git grep -n "BancaServizio"
git grep -n "Superbreak"
git grep -n "activeView === 'lay'"
git grep -n "http://localhost:3001/api/strategy"
```

Risultato atteso:

```text
nessun riferimento runtime
eventuali riferimenti soltanto nei registri storici approvati
```

## Backend

```bash
node --check backend/src/server.js
node scripts/validation/run.mjs backend
```

Verificare:

```text
/api/strategy non montata
server avviabile
Match invariato
Betfair invariato
Evidence invariata
health invariata
```

## Frontend

Eseguire i comandi registrati nel progetto per build e test frontend.

Verificare:

```text
sidebar senza tre Strategy
nessun import rimosso residuo
nessun polling Strategy
Overview funzionante
Market Reactions funzionante
Source Identity funzionante
Betfair dashboard funzionante
```

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

## Confini di non regressione

La task deve dimostrare che non sono stati rimossi:

```text
backend/src/routes/evidence.js
backend/src/sofa/matchEvidence/
frontend Market Reactions
Source Identity
Money Flow canonico
letture Betfair latest/json
tracking live
timeline/history
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
04-strategy.md: STATO DEPRECATO CORRETTO, CONTRATTO DA RISCRIVERE
Superficie runtime: ancora attiva
Consumer frontend: ancora attivo
Strategia operativa: disabilitata
Output direzionali legacy: ancora esposti
Authority Evidence moderne: non applicate
Polling session-scoped: non applicato
Rimozione: approvata
Riscrittura completa temporanea: consigliata
Modularizzazione: non necessaria
Nuovi documenti: nessuno
Destinazione finale: eliminazione dopo CODE-001
Priorità: alta
```

Il documento non deve essere diviso.

Ha un solo endpoint, una sola feature e una rimozione già approvata.

Il lavoro corretto è:

```text
ridurlo a contratto temporaneo di dismissione
→ rimuovere la superficie Strategy
→ eliminare il documento
```

La parte più importante è non confondere il `marketEvidence` legacy della Strategy con Match Evidence o Market Reactions canonici.
