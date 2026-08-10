# Report documentale — `docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-022
Sequenza audit: 22/72
Documento analizzato: 03-betfair-and-market-reactions-ui.md
Percorso documento: docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md
Percorso report: Report documentale/22 - 03-betfair-and-market-reactions-ui.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: f57e96d7b5520973cd150230bd0a544fa326bc25
Dimensione documento: 519 righe
Ruolo dichiarato: owner della UI Betfair e Market Reactions
Stato report: completato
```

Il documento è stato confrontato con:

- `frontend/src/App.jsx`;
- `frontend/src/components/OverviewDashboard.jsx`;
- `frontend/src/components/BetfairDepthCard.jsx`;
- `frontend/src/components/BetfairHealthToast.jsx`;
- `frontend/src/components/betfair/BetfairRunnerDepth.jsx`;
- `frontend/src/components/betfair/MoneyFlowChart.jsx`;
- `frontend/src/components/betfair/BetfairHealthDebugPanel.jsx`;
- `frontend/src/components/MarketReactionsPage.jsx`;
- `frontend/src/components/marketReactions/MarketLedObservationCard.jsx`;
- `frontend/src/components/marketReactions/FieldLedReactionCard.jsx`;
- `frontend/src/components/marketReactions/SourceIdentityConfirmationModal.jsx`;
- `frontend/src/components/SourceIdentityGateIndicator.jsx`;
- `frontend/src/hooks/useBetfairJson.js`;
- `frontend/src/hooks/useMarketReactionEvidence.js`;
- `frontend/src/hooks/useBetfairHealthAlerts.js`;
- `frontend/src/utils/betfairMoneyFlow.js`;
- `backend/src/routes/betfair/latestPayload.js`;
- `backend/src/routes/betfair/moneyFlowHistorySeries.js`;
- `backend/src/routes/betfair/moneyFlowHistory.js`;
- `backend/src/sofa/betfair/moneyFlow.js`;
- `backend/src/sofa/betfairHealth.js`;
- `scrapers/betfair/scrape.py`;
- `scrapers/betfair/ladder.py`;
- `scrapers/betfair/diagnostic_redaction.py`;
- `frontend/src/utils/betfairMoneyFlow.test.mjs`;
- `frontend/src/hooks/useBetfairJson.test.mjs`;
- i finding già registrati nei report `TDUI-DOC-REPORT-019`, `020` e `021`.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Money Flow neutro/non direzionale: implementato
History runner via selectionId: coerente
Shared 20-slot grid: implementata
Invalid/anomaly bar suppression: implementata
Health e persistence concettualmente separati: corretto
Source Identity live UI authority: corretta
Market Reactions come temporal proximity: filosofia corretta

Persistence integrity UI: ancora non cablata
Money Flow Y-axis labels vs bar scale: incoerenti
Hover empty/invalid: mostra 0 EUR come se fosse dato osservato
Null Betfair values: in più punti diventano 0/0.00
Runner matched unavailable: UI lo presenta come 0 EUR
Empty Betfair card: dichiara sempre "Polling active (5s)"
Last-known vs current Betfair: UI non possiede distinzione esplicita
Health debug contract: documento incompleto
graphLoginRequiredUrl: visualizzata ma non dichiarata nel documento
Market Reactions availability/reasons: bug già aperti in report 019
Market → Field mapping: bug già aperto in report 019
Component-level UI tests: insufficienti
Modifiche nuove proposte: 9
Modularizzazione: CONSIGLIATA
Nuovi documenti canonici proposti: 2
Riscrittura completa: NO
Revisione mirata: SÌ
Priorità complessiva: ALTA
```

Il documento è corretto nel principio fondamentale:

```text
frontend
→ visualizza read model già classificati

non
→ ricostruisce Evidence
→ inventa Money Flow
→ attribuisce causalità
→ legge journal
→ esegue recovery
```

È inoltre corretta la scelta già implementata per il grafico:

```text
matchedVolume neutro
→ nessuna direzione Back/Lay
→ nessun WOM
→ nessuna pressure
→ nessuna intenzione trader
```

Le criticità principali sono di **accuratezza della presentazione** e di **ownership documentale**.

---

# 1. Persistence integrity è nota agli hook ma non arriva alle superfici UI

## Esito: limite già documentato, implementazione downstream ancora necessaria

Il documento descrive correttamente lo stato corrente:

```text
useBetfairJson
→ integrity preservata

App.jsx
→ non destruttura integrity

BetfairDepthCard
→ nessuna prop integrity
```

e per Evidence:

```text
useMarketReactionEvidence
→ wrapper integrity/sources scartato

MarketReactionsPage
→ nessuna prop integrity
```

Questa non è una falsità del documento.

È però una task operativa ancora necessaria nel livello UI.

## Effetto Betfair

Su:

```text
409 partial_persistence
409 recovery_failed
```

l'hook può avere:

```text
data:null
integrity:<conflict>
health:<safe health eventuale>
```

ma `BetfairDepthCard` vede soltanto:

```text
data
history
health
healthTransition
```

Quindi può mostrare:

```text
Waiting for Betfair Exchange data...
```

oppure un alert health, senza poter rappresentare separatamente:

```text
Persistence incomplete
```

## Effetto Market Reactions

Il backend degrada correttamente il ramo cross-source.

La pagina però non possiede ancora:

```text
integrity
sources
persistenceComplete
```

come read model strutturato.

## Finding `FRONT-BETFAIR-001` — completare il rendering persistence nelle superfici UI

**Priorità:** alta  
**Tipo:** persistence integrity presentation

### Coordinamento

Questa è la parte UI delle task già registrate:

```text
FRONT-SESSION-009
FRONT-POLL-005
MARKET-REACT-008
```

### Target

`BetfairDepthCard` e `MarketReactionsPage` devono ricevere un view state backend-owned/normalizzato.

Devono distinguere:

```text
health
persistence integrity
Source Identity
current data availability
```

senza fonderli.

### Non mostrare

- `commitId`;
- path locali;
- journal payload;
- target filesystem.

---

# 2. Money Flow: asse Y e altezza delle barre usano due scale diverse

## Esito: bug di accuratezza visiva

`MoneyFlowChart.jsx` calcola:

```js
const calculatedMax = Math.max(
    100,
    toNumber(sharedMaxVal),
    ...displayVolumes
);

const axisMax = Math.ceil(calculatedMax / 100) * 100;
```

L'etichetta superiore usa:

```text
axisMax
```

ma l'altezza delle barre usa:

```js
(matchedVolume / calculatedMax) * maxBarHeight
```

## Esempio

Se il massimo reale è:

```text
125 EUR
```

allora:

```text
calculatedMax = 125
axisMax = 200
```

La barra da:

```text
125
```

raggiunge il 100% dell'altezza del grafico.

L'etichetta superiore del medesimo punto verticale dice però:

```text
200
```

Visivamente il grafico rappresenta quindi:

```text
125
come se fosse
200
```

La scala condivisa fra runner non corregge questo problema: entrambi usano la stessa incongruenza.

## Finding `FRONT-BETFAIR-002` — usare una sola scala grafica

**Priorità:** alta  
**Tipo:** chart accuracy

### Target

Se l'asse è:

```text
0 → axisMax
```

anche le barre devono usare:

```text
matchedVolume / axisMax
```

oppure l'asse deve mostrare esattamente `calculatedMax`.

### Test

Coprire almeno:

```text
max 100
max 125
max 199
max 200
max 201
```

e verificare matematicamente altezza vs etichette.

---

# 3. Hover su slot vuoto o invalido mostra `VOLUME ABBINATO: 0 EUR`

## Esito: assenza dati trasformata in zero apparente

Il grafico costruisce slot vuoti con:

```text
emptySlot:true
matchedVolume:0
validForDisplay:false
```

`getDisplayMatchedVolume()` restituisce correttamente:

```text
0
```

e quindi non viene disegnata alcuna barra.

Il problema è l'hover.

Ogni slot, incluso quello vuoto o invalido, possiede un `<g>` interattivo.

Quando viene selezionato:

```text
hovered = slots[index]
hoveredVolume = getDisplayMatchedVolume(hovered)
```

e l'header mostra:

```text
VOLUME ABBINATO: 0 EUR
```

## Perché è scorretto

Per:

```text
emptySlot
invalidVolume
anomaly
validForDisplay:false
```

zero non significa necessariamente:

```text
volume osservato pari a zero
```

Significa spesso:

```text
nessun dato visualizzabile
```

Questa distinzione è particolarmente importante dopo la decisione di non inventare dati.

## Finding `FRONT-BETFAIR-003` — distinguere zero reale da unavailable nel tooltip

**Priorità:** alta  
**Tipo:** missing data semantics

### Target

Per slot non visualizzabile:

```text
nessun tooltip volume
```

oppure:

```text
VOLUME ABBINATO: n/d
```

con eventuale reason diagnostica non sensibile.

Per uno zero realmente osservato e valido, se il backend lo distingue, mantenere una semantica specifica.

---

# 4. Null/missing Betfair values vengono convertiti in zero nella runner card

## Esito: gap importante rispetto alla filosofia no-synthetic-data

`formatPrice(value)` usa:

```js
const numberValue = Number(value);
```

In JavaScript:

```text
Number(null) = 0
Number("") = 0
```

Quindi:

```text
bestBack:null
→ 0.00

bestLay:null
→ 0.00
```

anziché:

```text
—
```

## Size

Le size usano:

```text
toNumber(...)
```

che trasforma valori non numerici/mancanti in:

```text
0
```

e può mostrare:

```text
0 €
```

## Runner total matched

La card calcola:

```text
totalMatched =
toNumber(runner.totalMatchedOnSelection ?? runner.matchedTotal)
```

e mostra sempre:

```text
TOTAL MATCHED: <numero> EUR
```

Se entrambi i dati sono assenti:

```text
TOTAL MATCHED: 0 EUR
```

## Relazione con il backend

È già approvata la rimozione del fallback sintetico runner matched:

```text
TECH-SAMPLE-003
DATA-001
```

Dopo quella correzione, il frontend deve essere capace di rappresentare:

```text
runner matched unavailable
```

senza trasformarlo in zero.

## Finding `FRONT-BETFAIR-004` — preservare null/unavailable nei valori Betfair

**Priorità:** alta  
**Tipo:** raw value presentation

### Target

I formatter devono distinguere:

```text
null/undefined/invalid
→ —

numero 0 realmente osservato
→ 0
```

Applicare almeno a:

- Best Back;
- Best Lay;
- quote size;
- runner total matched;
- market total matched dove applicabile.

### Coordinamento

Applicare insieme a:

```text
TECH-SAMPLE-003
```

per evitare che il frontend annulli la semantica `unavailable` introdotta dal backend.

---

# 5. La card vuota dichiara sempre `Polling active (5s)`

## Esito: stato UI hard-coded

Quando:

```text
!data || !data.runners
```

e health non è rossa, `BetfairDepthCard` mostra:

```text
Waiting for Betfair Exchange data...
Polling active (5s)
```

La card non riceve:

```text
isPolling
sessionActive
trackingStopped
```

e non può sapere se il polling sia realmente attivo.

## Casi in cui la label può essere falsa

- Stop Live Tracking;
- session lifecycle fallito;
- poller disabilitato;
- eventId assente;
- futuro `sessionActive:false`;
- persistence conflict con `data:null`.

## Finding `FRONT-BETFAIR-005` — rendere il polling status data-driven

**Priorità:** alta  
**Tipo:** UI runtime status

### Coordinamento

Dipende da:

```text
FRONT-SESSION-003
FRONT-POLL-002
FRONT-POLL-005
```

### Target

La card deve ricevere uno stato strutturato e mostrare, per esempio:

```text
Polling active
Polling stopped
Waiting for first data
Persistence unavailable
```

senza dedurlo dalla sola assenza di `data`.

Non hardcodare `5s` se la prop `pollingInterval` può cambiare.

---

# 6. Dato Betfair precedente e health corrente non sono marcati come update differenti

## Esito: UI non distingue current da last-known

I report precedenti hanno già rilevato che:

```text
useBetfairJson
```

può mantenere dati/health/history di cicli differenti in alcuni failure/fallback path.

`BetfairDepthCard` riceve:

```text
data
history
health
```

ma non riceve metadata che dicano:

```text
current
last-known
source timestamp
read status
```

## Conseguenza

Una ladder o history precedente può restare graficamente identica a un dato corrente.

Un banner health non è sufficiente a dichiarare la provenienza temporale di ogni blocco.

## Finding `FRONT-BETFAIR-006` — distinguere current e last-known nella card

**Priorità:** alta  
**Tipo:** stale presentation

### Coordinamento

Applicare dopo:

```text
FRONT-POLL-003
FRONT-POLL-007
FRONT-POLL-008
```

### Target

Il view model Betfair deve fornire metadata sufficienti per visualizzare:

```text
current
stale/last-known
unavailable
```

L'utente non deve interpretare una ladder vecchia come feed corrente soltanto perché l'oggetto è ancora presente.

---

# 7. Il pannello Health espone più campi di quelli dichiarati dal documento

## Esito: contract drift

Il documento elenca come campi del debug panel:

```text
lastScrapeAttemptAt
lastSuccessfulScrapeAt
lastCanonicalTickAt
lastUsableLadderAt
lastValidVolumeAt
lastTechnicalErrorAt
graphLoginRequiredAt
computedAt
technicalErrorActive
lastTechnicalErrorReason
latestBetfairAgeSec
latestUsableLadderAgeSec
betfairUrlOk
```

Il componente reale espone inoltre:

```text
status
message
reasons
consecutiveNoLadderTicks
validTickCount
lastSeq
graphLoginRequired
graphLoginRequiredRecent
graphLoginRequiredText
graphLoginRequiredUrl
cdpOk
graphUrlsOk
ladderOk
marketOk
loginOk
sofaLive
```

## `graphLoginRequiredUrl`

Questo campo viene costruito dal percorso diagnostico Graph.

Lo scraper applica `redact_value()` prima di propagare la diagnostica.

La redazione:

- rimuove valori sensibili di query/header/token;
- non elimina necessariamente host/path/marketId/selectionId da una URL Graph legittima.

Quindi non è corretto trattare il campo come un segreto raw non redatto.

Ma è comunque una superficie diagnostica che il documento non dichiara.

## Finding `FRONT-BETFAIR-007` — definire l'allow-list diagnostica Health UI

**Priorità:** media  
**Tipo:** diagnostic surface contract

### Decisione richiesta

Per ogni campo decidere se è:

```text
user-facing diagnostic
oppure
internal-only
```

Se `graphLoginRequiredUrl` resta visibile:

```text
→ documentarlo esplicitamente
→ dichiararlo redatto
→ non aggiungere query/body/cookie/token raw
```

Se non è necessario all'operatore:

```text
→ rimuoverlo dal panel
```

### Invariante

La UI deve mantenere una allow-list esplicita.

Non esporre automaticamente nuovi campi del backend health.

---

# 8. Market Reactions: il documento descrive un comportamento che il frontend corrente non rispetta

## Esito: finding già aperti, nessun nuovo ID duplicato

Il documento afferma:

```text
Quando il backend dichiara il ramo non disponibile,
la UI mostra assenza o reasons,
non osservazioni valide.
```

Il codice corrente non rispetta pienamente questa regola.

## Availability badge

Entrambe le card usano:

```text
available={!!evidence}
```

Quindi un branch object:

```text
{ available:false, ... }
```

viene visualizzato come:

```text
available
```

## Parent reasons

Le reason Source Identity/persistence possono essere nel:

```text
marketReactionEvidence.summary
```

ma `MarketReactionsPage` non visualizza il summary parent.

## Market → Field mapping

La card legge campi legacy/non corrispondenti alla shape backend:

```text
runnerName
amount
tier
flowClassification
```

e tratta `sofaEventsObserved` come numero.

## Ownership

Questi problemi sono già registrati come:

```text
MARKET-REACT-008
MARKET-REACT-009
```

e il causality contract come:

```text
MARKET-REACT-001
```

Non vengono creati change ID duplicati.

## Azione documentale

Quando tali task verranno applicate, questo documento deve essere aggiornato nella stessa modifica.

---

# 9. Source Identity UI: boundary corretto, lifecycle già coperto da task precedenti

## Esito: nessun nuovo change ID

Il documento dice correttamente che l'authority globale è:

```text
source-identity-status
→ useSourceIdentityGateStatus
→ useSourceIdentityGateUi
```

La modale riceve:

```text
sofaPlayers
betfairRunners
reasons
```

e costruisce soltanto il mapping manuale.

Non riceve:

- market ID;
- selection ID;
- URL;
- cookie;
- token;
- journal path.

Questo boundary è coerente.

## Limiti lifecycle già registrati

Sono già aperti:

```text
FRONT-SESSION-006
→ POST confirmation ok non prova recording

FRONT-SESSION-007
→ decline chiude modale prima di Stop riuscito
```

Non vengono duplicati in questo report.

---

# 10. Il test `betfairMoneyFlow.test.mjs` non verifica il rendering del grafico

## Esito: coverage insufficiente per il contratto UI

La suite corrente verifica utility pure:

- grid 20 slot;
- ordine timestamp;
- align;
- valid display volume;
- invalid/anomaly suppression;
- `computeFlowWom`.

Non monta:

```text
MoneyFlowChart
BetfairRunnerDepth
BetfairDepthCard
BetfairHealthDebugPanel
```

Quindi non può rilevare:

```text
axisMax/calculatedMax mismatch
hover 0 su slot invalid
null → 0.00
TOTAL MATCHED unavailable → 0
Polling active hard-coded
debug URL exposure
integrity rendering
last-known rendering
```

## Market Reactions

Non risultano test component-level dedicati per:

```text
MarketLedObservationCard
FieldLedReactionCard
```

che avrebbero rilevato:

- `!!evidence`;
- field mapping stale;
- array formatting;
- causality disclaimer.

## Finding `FRONT-BETFAIR-008` — aggiungere test component-level della UI Betfair/Evidence

**Priorità:** alta  
**Tipo:** verification contract

### Test minimi Betfair

```text
MoneyFlowChart:
→ axis labels coerenti con bar height
→ invalid/empty hover non mostra zero osservato

BetfairRunnerDepth:
→ null price = —
→ null matched = —

BetfairDepthCard:
→ polling false non mostra Polling active
→ persistence state separata da health
→ last-known state marcato
```

### Test Health

```text
debug allow-list
→ soltanto campi approvati
→ URL diagnostica redatta o assente secondo policy
```

### Test Market Reactions

Coordinare con:

```text
MARKET-REACT-008/009/010
```

e coprire:

```text
available:false
parent blocking reasons
source event field mapping
causality disclaimer
```

---

# 11. `computeFlowWom` resta nell'utility attiva ma non è usato dal grafico corrente

## Esito: legacy da non riattivare accidentalmente

`betfairMoneyFlow.js` esporta ancora:

```text
computeFlowWom(...)
```

che calcola:

```text
backSum
laySum
wom
unclassifiedSum
```

Il test corrente continua a testarlo.

Il grafico corrente:

```text
MoneyFlowChart
```

non lo usa.

Il documento dichiara correttamente:

```text
MoneyFlowChart
→ non deve usare computeFlowWom
→ non deve attribuire direzione
```

## Valutazione

Non viene aperta una task autonoma di rimozione in questo audit perché:

- il comportamento UI corrente è già neutro;
- una rimozione va fatta solo dopo verifica completa dei consumer;
- non va introdotto un refactor opportunistico.

## Regola

Durante le task future:

```text
computeFlowWom
```

non deve essere reintrodotto nel percorso di rendering Money Flow.

Se una verifica repository-wide confermerà che è dead code, potrà essere rimosso nella task owner appropriata.

---

# 12. Runner identity via `selectionId`

## Esito: coerente nel percorso corrente

Il backend history normalizza:

```text
selectionId → String(...)
```

e `BetfairDepthCard` normalizza allo stesso modo il runner corrente.

Quindi:

```text
stesso selectionId + nome cambiato
→ stessa serie

stesso nome + selectionId diverso
→ nessuna continuità
```

è coerente.

Runner senza selectionId:

```text
→ history []
```

come dichiara il documento.

## Dipendenza

L'affidabilità upstream di `selectionId` resta oggetto di:

```text
TECH-SAMPLE-002
```

---

# 13. Volume abbinato neutro

## Esito: contratto centrale corretto

`getDisplayMatchedVolume()` esclude:

```text
emptySlot
invalidVolume
anomaly
validForDisplay:false
non-finite
<= 0
```

e il grafico disegna una barra soltanto quando:

```text
matchedVolume > 0
```

Non esistono barre:

- Back;
- Lay;
- positive/negative;
- directional.

Questa parte deve essere preservata.

I due bug sono soltanto:

```text
scala visiva
hover unavailable
```

non la filosofia del grafico.

---

# 14. Health Betfair

## Esito: separazione concettuale corretta

Il componente non ricalcola lo status.

Riceve:

```text
health
healthTransition
```

e presenta:

- red;
- yellow;
- finished;
- recovered.

`useBetfairHealthAlerts()` usa anche un fallback testuale per decidere l'audio login-related.

Il documento registra correttamente questa dipendenza.

## Nota

L'audio può continuare a dipendere dal lifecycle polling/sessione.

Questo problema è già coperto da:

```text
FRONT-SESSION-003
FRONT-POLL-002
```

e non viene duplicato.

---

# 15. Persistence e health non devono essere fuse

## Esito: principio corretto

La UI attuale non trasforma:

```text
partial_persistence
recovery_failed
```

in:

```text
health red/yellow
```

Il limite è che non visualizza ancora persistence come asse separato.

La correzione deve quindi essere additiva:

```text
health
+
persistence
```

non:

```text
persistence → health
```

---

# 16. Viste Strategy deprecate

## Esito: coerente

Il documento registra:

```text
lay
banca
superbreak
```

come legacy/deprecate e non le include nel dominio Market Reactions.

La rimozione è già posseduta da task Strategy/architecture precedenti.

Nessun nuovo change ID.

---

# 17. Modularizzazione

## Esito: divisione consigliata

```text
Righe: 519
Responsabilità presenti: almeno 2 owner UI realmente distinti
```

Il documento contiene contemporaneamente:

### Owner A — Betfair read/display UI

```text
BetfairDepthCard
BetfairRunnerDepth
MoneyFlowChart
BetfairHealthDebugPanel
BetfairHealthToast
persistence Betfair UI
```

### Owner B — Evidence / Market Reactions UI

```text
MarketReactionsPage
MarketLedObservationCard
FieldLedReactionCard
persistence Evidence UI
causality presentation
```

### Source Identity

Il contenuto Source Identity UI è invece già posseduto dal lifecycle:

```text
01-session-shell.md
```

ed è qui in parte duplicato.

## Perché conviene dividere

Le modifiche a:

```text
MoneyFlowChart / ladder / Betfair health
```

non richiedono normalmente:

```text
Market Reactions / temporal observations
```

e viceversa.

Hanno:

- backend owner differenti;
- test differenti;
- read model differenti;
- failure mode differenti;
- minimal context differenti.

Il motivo della divisione non è quindi la lunghezza.

È la responsabilità.

## Struttura proposta

Mantenere:

```text
03-betfair-and-market-reactions-ui.md
```

come facade breve con:

- confini comuni;
- no causalità;
- separazione health/integrity;
- link ai due owner.

Creare:

```text
docs/tennis-decision-ui/modules/frontend/05-betfair-depth-and-health-ui.md
docs/tennis-decision-ui/modules/frontend/06-market-reactions-ui.md
```

### `05-betfair-depth-and-health-ui.md`

Owner di:

- Depth;
- runner ladder;
- Money Flow chart;
- Betfair health;
- Betfair persistence presentation.

### `06-market-reactions-ui.md`

Owner di:

- MarketReactionsPage;
- Market → Field;
- Field → Market;
- Evidence integrity presentation;
- availability/reasons;
- causal disclaimer.

### Source Identity

Non creare un terzo file.

Ridurre qui il contenuto a un link verso:

```text
01-session-shell.md
```

che resta owner del lifecycle UI Source Identity.

## Finding `FRONT-BETFAIR-009` — modularizzare il documento per owner UI

**Priorità:** media  
**Tipo:** documentation modularization

### Task operativa

- mantenere `03-betfair-and-market-reactions-ui.md` come facade;
- creare `05-betfair-depth-and-health-ui.md`;
- creare `06-market-reactions-ui.md`;
- spostare i contenuti senza duplicarli;
- lasciare Source Identity lifecycle a `01-session-shell.md`;
- aggiornare `index.md`;
- aggiornare context-selection/owner map se richiesto;
- aggiornare link reciproci;
- eseguire link checker;
- non aggiungere i nuovi file all'indice prima che esistano.

## Decisione

```text
modularization_reviewed: true
split_required: true
split_recommended: true
proposed_files:
  - docs/tennis-decision-ui/modules/frontend/05-betfair-depth-and-health-ui.md
  - docs/tennis-decision-ui/modules/frontend/06-market-reactions-ui.md
```

Questa modularizzazione deve essere registrata come **task da eseguire** nella mappa e nel ledger al prossimo aggiornamento cumulativo.

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-022
Percorso report: Report documentale/22 - 03-betfair-and-market-reactions-ui.md
Documento: docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md
Change ID: FRONT-BETFAIR-001
Change ID: FRONT-BETFAIR-002
Change ID: FRONT-BETFAIR-003
Change ID: FRONT-BETFAIR-004
Change ID: FRONT-BETFAIR-005
Change ID: FRONT-BETFAIR-006
Change ID: FRONT-BETFAIR-007
Change ID: FRONT-BETFAIR-008
Change ID: FRONT-BETFAIR-009
Suddivisione richiesta/consigliata: sì
Nuovi file canonici proposti: 2
```

Dipendenze già registrate da non duplicare:

```text
MARKET-REACT-001
MARKET-REACT-008
MARKET-REACT-009
MARKET-REACT-010
FRONT-SESSION-006
FRONT-SESSION-007
FRONT-SESSION-009
FRONT-POLL-002
FRONT-POLL-003
FRONT-POLL-005
FRONT-POLL-007
FRONT-POLL-008
TECH-SAMPLE-002
TECH-SAMPLE-003
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 018–022 non ancora recepiti
→ indice 22 ANALIZZATO
→ Divisione consigliata/richiesta
→ aggiungere FRONT-BETFAIR-001..009
→ FRONT-BETFAIR-009 deve apparire come task [ ] operativa di modularizzazione
→ registrare i due proposed_files senza inserirli nell'inventario canonico corrente finché non creati

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-022
→ appendere FRONT-BETFAIR-001..009
→ split_required:true
→ proposed_files con i due percorsi
→ preservare integralmente il ledger precedente
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `FRONT-BETFAIR-001` — persistence integrity presentation

**Priorità:** high

- passare il view state persistence alle superfici;
- BetfairDepthCard e MarketReactionsPage;
- health/persistence/Source Identity separati;
- no journal/commit/path UI;
- coordinare le task upstream già aperte.

## `FRONT-BETFAIR-002` — Money Flow axis scale

**Priorità:** high

- usare la stessa scala per asse e barre;
- correggere rounding vs normalization;
- testare valori fra centinaia;
- preservare shared scale fra runner.

## `FRONT-BETFAIR-003` — hover unavailable

**Priorità:** high

- empty/invalid/anomaly non devono apparire come zero osservato;
- tooltip assente o n/d;
- preservare zero reale se distinguibile;
- nessun dato sintetico.

## `FRONT-BETFAIR-004` — null/unavailable Betfair values

**Priorità:** high

- `null` price → `—`, non `0.00`;
- missing size → `—` secondo contratto;
- runner matched unavailable → `—`, non `0 EUR`;
- coordinare `TECH-SAMPLE-003`.

## `FRONT-BETFAIR-005` — truthful polling state

**Priorità:** high

- rimuovere `Polling active (5s)` hard-coded;
- ricevere stato reale;
- distinguere stopped/waiting/persistence;
- coordinare session/poller lifecycle.

## `FRONT-BETFAIR-006` — current vs last-known rendering

**Priorità:** high

- ricevere metadata di read status;
- marcare stale/last-known;
- non presentare vecchia ladder/history come current;
- coordinare `FRONT-POLL-003/007/008`.

## `FRONT-BETFAIR-007` — Health debug allow-list

**Priorità:** medium

- allineare documento e campi reali;
- decidere il destino di `graphLoginRequiredUrl`;
- mantenere redazione;
- vietare campi diagnostici raw futuri non approvati.

## `FRONT-BETFAIR-008` — component verification

**Priorità:** high

- test MoneyFlowChart;
- test BetfairRunnerDepth;
- test BetfairDepthCard;
- test Health Debug;
- coordinare test Market Reactions già richiesti;
- includere integrity/current-vs-stale.

## `FRONT-BETFAIR-009` — modularizzazione per owner

**Priorità:** medium

- mantenere `03-*` come facade;
- creare `05-betfair-depth-and-health-ui.md`;
- creare `06-market-reactions-ui.md`;
- rimuovere duplicazione Source Identity;
- aggiornare index/link/owner map;
- task con checkbox obbligatoria.

---

# Ordine consigliato di applicazione

```text
1. FRONT-POLL-003/005/007/008 — read model upstream
2. FRONT-SESSION-009 — persistence view state
3. FRONT-BETFAIR-001 — UI persistence
4. FRONT-BETFAIR-004 — unavailable semantics
5. FRONT-BETFAIR-002 — chart scale
6. FRONT-BETFAIR-003 — chart hover
7. FRONT-BETFAIR-005 — polling status
8. FRONT-BETFAIR-006 — current/last-known rendering
9. MARKET-REACT-001/008/009 — UI Market Reactions già aperta
10. FRONT-BETFAIR-007 — health diagnostic contract
11. FRONT-BETFAIR-008 — component tests
12. FRONT-BETFAIR-009 — modularizzazione documentale
13. revisione finale del facade
14. checker documentali
15. aggiornamento cumulativo mappa/ledger
```

---

# Verifica prevista dopo un'eventuale modifica

## Money Flow axis

```text
matched max = 125
axis top = 200
→ barra 125 deve occupare 62,5% della scala
```

e non 100%.

Testare:

```text
100
125
199
200
201
```

## Tooltip

```text
emptySlot
→ n/d / nessun tooltip volume

invalidVolume
→ n/d

anomaly
→ n/d

valid 0
→ semantica definita

valid 25
→ 25 EUR
```

## Raw values

```text
bestBack null
→ —

bestLay null
→ —

runner matched null
→ —

bestBack 0 reale
→ comportamento esplicito
```

## Persistence

```text
partial_persistence
recovery_failed
```

devono essere visibili come persistence state separato da:

```text
health
Source Identity
```

## Polling label

```text
active
stopped
eventId assente
persistence conflict
```

non devono produrre la stessa stringa hard-coded.

## Last-known

```text
current valid
→ failure/fallback
```

deve rendere evidente se la ladder/history è:

```text
current
last-known
unavailable
```

## Health Debug

Verificare la allow-list completa.

Se URL diagnostica resta:

```text
token/query sensibili → redatti
path/local filesystem → assenti
cookie/header → assenti
```

## Market Reactions

Applicare i test già richiesti da:

```text
MARKET-REACT-008
MARKET-REACT-009
MARKET-REACT-010
```

in particolare:

```text
available:false
→ badge unavailable

parent blocking reason
→ visibile

Market → Field source
→ campi backend corretti

causality false
→ disclaimer
```

## Modularizzazione

Dopo creazione dei due owner:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
```

e verificare:

```text
03 facade
→ nessuna duplicazione sostanziale

05
→ solo Betfair Depth/Health

06
→ solo Market Reactions UI

01-session-shell
→ Source Identity lifecycle owner
```

## Build

```bash
npm run build
node src/utils/betfairMoneyFlow.test.mjs
node src/hooks/useBetfairJson.test.mjs
```

Aggiungere inoltre le nuove suite component-level.

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
03-betfair-and-market-reactions-ui.md: FILOSOFIA CORRETTA, PRESENTAZIONE E OWNERSHIP DA RAFFORZARE

Money Flow neutro: corretto
selectionId history mapping: corretto
20-slot grid: corretto
invalid/anomaly no-bar: corretto
health vs persistence: separazione concettuale corretta
Source Identity live authority: corretta
no journal/recovery frontend: corretto

persistence UI: non cablata
chart axis/bar scale: incoerente
empty/invalid hover: mostra 0 EUR
null best price: può diventare 0.00
missing runner matched: diventa 0 EUR
polling label: hard-coded
current vs last-known: non rappresentato
health debug fields: documentazione incompleta
graphLoginRequiredUrl: esposta ma non dichiarata
Market Reactions availability/reasons: bug già registrati
Market → Field mapping: bug già registrato
component UI tests: insufficienti

Riscrittura completa: no
Modularizzazione: sì, consigliata
Nuovi documenti canonici proposti: 2
Priorità complessiva: alta
```

La parte Betfair deve preservare una regola semplice:

```text
assenza
≠ zero

last-known
≠ current

health
≠ persistence

volume neutro
≠ direzione
```

La parte Market Reactions deve preservare:

```text
available
≠ oggetto presente

observed
≠ causal

blocking reason backend
→ deve arrivare visibile all'utente
```

La divisione documentale è consigliata perché queste due superfici hanno owner, test e minimal context differenti; la modularizzazione è quindi una vera task operativa e non soltanto una nota di audit.

> Aggiornamento successivo: `FRONT-BETFAIR-001`–`FRONT-BETFAIR-009` sono state completate. La card riceve persistence/read state e last-known, la scala Money Flow è unica, null e zero sono distinti, lo stato polling è reale, i componenti hanno test JSX e la facade è stata divisa nei due owner derivati `05-betfair-depth-and-health-ui.md` e `06-market-reactions-ui.md` senza modificare la sequenza originale dei 72 documenti.

Dipendenze di test aggiunte: `react-test-renderer@18.2.0` e `tsx@4.20.3`. Nessuna operazione Git è stata eseguita.
