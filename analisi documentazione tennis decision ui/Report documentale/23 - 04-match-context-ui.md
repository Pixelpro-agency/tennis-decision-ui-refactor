# Report documentale — `docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-023
Sequenza audit: 23/72
Documento analizzato: 04-match-context-ui.md
Percorso documento: docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md
Percorso report: Report documentale/23 - 04-match-context-ui.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 383fc79ab40be81f97be04486374850af88048df
Dimensione documento: 163 righe
Ruolo dichiarato: owner della presentazione frontend del localContext SofaScore
Stato report: completato
```

Il documento è stato confrontato con:

- `frontend/src/components/MatchContextCard.jsx`;
- `frontend/src/components/matchContextViewModel.js`;
- `frontend/src/components/matchContextViewModel.test.mjs`;
- `frontend/src/hooks/useDashboardViewModel.js`;
- `frontend/src/hooks/useMatchPolling.js`;
- `frontend/src/types/dashboard.js`;
- `frontend/src/types/dashboard.test.mjs`;
- `backend/src/sofa/localContext.js`;
- `backend/src/sofa/localContext.test.mjs`;
- `backend/src/sofa/pointByPoint.js`;
- `backend/src/sofa/pointByPoint.test.mjs`;
- `backend/src/sofa/normalizeSnapshot.js`;
- `backend/src/sofa/trackerUpdate.js`;
- il documento owner backend `modules/sofa/02-local-context-and-point-by-point.md`;
- i finding già registrati nei report Session Shell e Live Polling/View Model.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: ALTA
Data flow backend → frontend: corretto
Nessun fallback 50/50: corretto
Percentuali visualizzate: non ricalcolate dal frontend
Recent window: gated su 3 game + current excluded
Comparison: descrittiva e non operativa
Raw timeline/storage dependency frontend: assente
Provenance copy UI: fuorviante
Validazione point share: troppo permissiva
Validazione comparison/window: parziale
Reason unsupported/ambiguous: documentata ma non propagata dal producer canonico
localContext.available: semantica più stretta di quanto suggerisce la sezione "stati non disponibili"
dataQuality backend: non usata né spiegata dal frontend owner
observedShift: significa cambio del lato leader, non generica differenza
localContext version/source/purpose: ignorati dal consumer
Stale/last-known Match Context: rischio già aperto nel report polling
Component-level render tests: assenti
Modifiche proposte: 7
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: ALTA
```

Il documento è complessivamente solido e molto più vicino allo stato reale del codice rispetto a diversi owner auditati in precedenza.

La filosofia principale è corretta:

```text
backend SofaScore
→ normalizzazione
→ localContext project-calculated
→ persistenza nel tick Sofa
→ polling frontend
→ mapping dashboard
→ view model di presentazione
→ MatchContextCard
```

La card non implementa:

- strategia;
- previsione;
- fair odds;
- Money Flow;
- Source Identity;
- ricostruzione point-by-point;
- fallback 50/50;
- percentuali sintetiche.

Le correzioni necessarie riguardano soprattutto:

```text
provenienza del calcolo
coerenza interna dei valori ricevuti
semantica delle reason
availability parziale
contratto di compatibilità
test del rendering reale
```

---

# 1. La UI dichiara “Calcolato localmente”, ma `localContext` è calcolato dal backend

## Esito: provenance copy fuorviante

`MatchContextCard.jsx` mostra:

```text
Calcolato localmente dai dati disponibili
```

Il documento, nello stesso tempo, descrive correttamente il flusso:

```text
timeline SofaScore
→ useMatchPolling
→ dashboard view model
→ MatchContextCard
```

e afferma:

```text
I termometri usano esclusivamente percentuali già calcolate dal backend.
```

## Runtime reale

`trackerUpdate.js` esegue:

```text
normalizeSnapshot(...)
→ buildLocalContext(snapshot)
→ persistSofaTrackingSample(...)
```

Il tick Sofa contiene:

```text
snapshot
localContext
```

`useMatchPolling()` recupera:

```text
data.localContext
```

e `mapBackendDataToDashboard()` lo inoltra senza ricalcolo.

`matchContextViewModel.js`:

- valida shape/numero;
- formatta percentuali;
- formatta punti;
- costruisce copy.

Non ricalcola i valori sportivi.

## Problema

Per un utente che legge la card, la frase:

```text
Calcolato localmente
```

può significare:

```text
calcolato nel browser/frontend
```

mentre l'authority numerica è il backend.

Questo è particolarmente importante perché il documento vieta esplicitamente al frontend di calcolare percentuali e differenze sportive.

## Finding `MATCH-CONTEXT-001` — rendere esplicita la provenienza backend

**Priorità:** media  
**Tipo:** data provenance presentation

### Modifica richiesta

Sostituire il copy con una frase che non attribuisca il calcolo al componente.

Per esempio, semanticamente:

```text
Contesto descrittivo dai dati SofaScore disponibili
```

oppure:

```text
Valori calcolati dal backend sui dati SofaScore disponibili
```

La formulazione finale può restare compatta.

### Documento

Distinguere:

```text
backend
→ calcola i valori

frontend
→ valida il contratto e formatta
```

---

# 2. `validPointShare()` accetta point share internamente incoerenti

## Esito: validazione numerica insufficiente

Il view model controlla:

```text
pointShare.available === true

homePoints
→ finite
→ >= 0

awayPoints
→ finite
→ >= 0

homePct
→ finite
→ 0..100

awayPct
→ finite
→ 0..100
```

Non verifica però la coerenza della coppia.

## Caso 1 — percentuali impossibili

Questo payload passa:

```text
homePoints = 10
awayPoints = 10
homePct = 80
awayPct = 80
```

Il termometro riceve:

```text
80%
80%
```

Le due width sommano:

```text
160%
```

Il contenitore ha `overflow-hidden`, quindi il problema viene mascherato visivamente invece di essere rifiutato.

## Caso 2 — percentuali che non coprono la scala

Passa anche:

```text
homePct = 40
awayPct = 40
```

che lascia implicitamente il 20% della barra senza significato.

## Caso 3 — punti e percentuali contraddittori

Passa:

```text
homePoints = 90
awayPoints = 10
homePct = 10
awayPct = 90
```

Il frontend mostra contemporaneamente:

```text
90 punti
10%

10 punti
90%
```

senza degradare la sezione.

## `totalPoints`

Il backend canonico produce:

```text
totalPoints
```

ma il frontend non lo usa per validare la coerenza del payload.

## Recent window

Il frontend richiede correttamente:

```text
includedGames === 3
excludedCurrentGame === true
```

ma non verifica altri metadata canonici disponibili:

```text
requestedGames === 3
kind === completed-games
games.length === 3
```

## Comparison

`comparison` viene mostrato quando:

```text
comparison.available === true
+
delta finite
```

senza verificare che:

```text
match view sia disponibile
recent view sia disponibile
```

o che i due delta siano coerenti con un confronto percentuale a due lati.

Nel producer canonico queste incoerenze non vengono generate.

Il problema riguarda il boundary frontend:

```text
il documento dice che il view model valida i numeri ricevuti
```

ma quella validazione è oggi soltanto locale ai singoli campi.

## Finding `MATCH-CONTEXT-002` — validare la coerenza del contratto senza ricalcolare l'output

**Priorità:** alta  
**Tipo:** frontend contract validation

### Target

Il frontend non deve ricalcolare le percentuali da mostrare.

Può però verificare che i valori ricevuti siano coerenti.

Almeno:

```text
homePct + awayPct
→ circa 100 secondo la tolleranza del contratto

homePoints + awayPoints
→ totalPoints quando totalPoints è presente

point share percentuale
→ compatibile con i punti entro la tolleranza approvata

recent window
→ esattamente la shape canonica richiesta

comparison
→ mostrabile soltanto con match/recent coerenti
```

### Regola

In caso di incoerenza:

```text
sezione unavailable
```

non:

```text
correzione automatica
clamp
fallback 50/50
ricalcolo visualizzato
```

---

# 3. La reason `unsupported_or_ambiguous_score_transition` non raggiunge il canonical `recent.reason`

## Esito: documentazione e UI prevedono una reason attualmente irraggiungibile

Il documento afferma che vengono tradotte:

```text
point_by_point_unavailable
insufficient_verified_completed_games
unsupported_or_ambiguous_score_transition
```

`matchContextViewModel.js` possiede effettivamente un copy per tutte e tre.

## Decoder

`decodeCompletedGame()` restituisce correttamente:

```text
reason:
unsupported_or_ambiguous_score_transition
```

per:

- tie-break non supportato;
- token/transizione ambigua;
- sequenze non decodificabili.

I test verificano questo comportamento.

## Window builder

`buildRecentCompletedGamesWindow()` però esegue:

```text
decodedGames.some(game => !game.available)
→ createUnavailableWindow()
```

e `createUnavailableWindow()` usa sempre:

```text
reason:
insufficient_verified_completed_games
```

La reason specifica del decoder viene quindi persa.

## `buildLocalContext`

Riceve la window già collassata e propaga:

```text
recent.reason
=
insufficient_verified_completed_games
```

Quindi il percorso canonico:

```text
backend localContext
→ frontend Match Context
```

non produce attualmente:

```text
unsupported_or_ambiguous_score_transition
```

anche quando il vero motivo è proprio una transizione non supportata.

## Conseguenza

La UI mostra:

```text
Non ci sono ancora tre game completati verificabili.
```

anche quando esistono tre game candidati ma uno non è decodificabile.

Sono due diagnosi diverse.

## Finding `MATCH-CONTEXT-003` — preservare o eliminare esplicitamente la reason di ambiguità

**Priorità:** alta  
**Tipo:** diagnostic reason contract

### Opzione preferibile

Preservare dal window builder una reason bounded che distingua:

```text
numero insufficiente di game verificabili
da
game presente ma transizione unsupported/ambiguous
```

e lasciare il copy frontend già predisposto.

### Alternativa

Se il contratto desiderato è intenzionalmente aggregato:

```text
rimuovere dal documento e dalla UI
la reason non producibile
```

### Non fare

Non dedurre la reason nel frontend analizzando il point-by-point.

L'authority deve restare backend.

---

# 4. Availability è per sezione; `localContext.available` non significa “tutta la card disponibile”

## Esito: wording documentale troppo globale

L'owner backend definisce:

```text
localContext.available
→ disponibilità di match.pointShare
```

Non rappresenta la completezza dell'intero contesto.

Per la completezza esiste:

```text
dataQuality.level === complete
```

## Caso valido

Può esistere:

```text
match.pointShare unavailable
recent.available true
comparison unavailable
dataQuality.level insufficient
dataQuality.sources.pointByPoint true
```

Il frontend non legge:

```text
localContext.available
dataQuality.level
```

come gate globale.

Valuta ogni sezione separatamente.

In tale scenario può quindi mostrare:

```text
Punti nel match non disponibili
+
Ultimi 3 game completati disponibili
+
termometro recent
```

## Documento corrente

La sezione:

```text
Stati non disponibili
```

dice in forma generale:

```text
Quando i dati non sono disponibili,
la card non mostra barre, punti, percentuali, differenze, quote.
```

Questa frase può essere letta come una regola top-level.

Non è il comportamento reale.

La regola reale è:

```text
una sezione unavailable
→ quella sezione non mostra numeri/barre

un'altra sezione indipendentemente available
→ può continuare a essere mostrata
```

## Finding `MATCH-CONTEXT-004` — documentare availability parziale e dataQuality

**Priorità:** media  
**Tipo:** availability semantics

### Modifica richiesta

Definire esplicitamente:

```text
localContext.available
→ match point share

recent.available
→ recent section

comparison.available
→ comparison section

dataQuality.level
→ complete / partial / insufficient context quality
```

### UI

Non è obbligatorio introdurre un nuovo badge quality.

È sufficiente che il consumer e il documento non trattino:

```text
localContext.available
```

come master switch dell'intera card.

---

# 5. `observedShift` significa cambio del lato leader, non una generica differenza di distribuzione

## Esito: semantica troppo vaga

Il backend calcola:

```text
matchLeader
recentLeader
```

e imposta:

```text
observedShift = true
```

soltanto quando:

```text
match leader = home/away
recent leader = home/away
e i due lati sono diversi
```

Quindi:

```text
observedShift
```

significa concretamente:

```text
il lato con più punti nel recent window
è diverso dal lato con più punti nel match
```

Non significa:

```text
le percentuali sono cambiate
```

perché le percentuali possono cambiare anche con `observedShift:false`.

## Frontend

Quando `observedShift:true`, il copy dice:

```text
La distribuzione punti recente differisce da quella dell’intero match.
```

La frase è vera, ma non rappresenta la specificità del flag.

Quando le percentuali differiscono molto ma il leader resta lo stesso:

```text
observedShift:false
```

il testo non compare.

I delta percentuali vengono comunque mostrati.

## Finding `MATCH-CONTEXT-005` — definire con precisione `observedShift`

**Priorità:** media  
**Tipo:** semantic naming

### Modifica richiesta

Nel documento dichiarare che:

```text
homeDeltaPctPoints / awayDeltaPctPoints
→ descrivono la differenza percentuale

observedShift
→ indica il cambio del lato leader
```

### Valutare

Un nome più preciso nel contratto futuro, per esempio semanticamente:

```text
leadingSideChanged
```

Se il campo viene rinominato:

- backend;
- frontend;
- test;
- documentazione

devono cambiare insieme.

Non trasformarlo in trend o momentum.

---

# 6. `version`, `source` e `purpose` del `localContext` sono ignorati dal consumer

## Esito: compatibility boundary non definito

Il backend restituisce:

```text
version: 1
source: project-calculated
purpose: descriptive-match-context
```

Questi campi dichiarano chiaramente che `localContext` è un contratto versionato e descrittivo.

Il frontend però usa direttamente:

```text
localContext.match
localContext.recent
localContext.comparison
```

senza verificare:

```text
version
source
purpose
```

## Conseguenza futura

Se una versione successiva modifica semantica mantenendo campi con nomi compatibili:

```text
frontend vecchio
→ potrebbe renderizzare la nuova shape
→ senza sapere di interpretare un contratto non supportato
```

Non è un bug sui payload correnti.

È un confine di compatibilità non dichiarato.

## Finding `MATCH-CONTEXT-006` — definire la policy di compatibilità del localContext

**Priorità:** media  
**Tipo:** schema compatibility

### Possibili contratti

### Contratto stretto

```text
version !== 1
→ unavailable
```

con reason UI bounded.

### Contratto backward-compatible

Documentare esplicitamente quali campi vengono usati e quali versioni sono ammesse.

### Regola

Non usare:

```text
source/purpose
```

per ricostruire logiche sportive.

Servono soltanto come metadata di contratto/provenienza se mantenuti.

---

# 7. La sezione Verifica non prova il rendering reale della card

## Esito: coverage incompleta

Il documento elenca:

```text
node src/components/matchContextViewModel.test.mjs
node src/types/dashboard.test.mjs
npm run build
```

I due test esistono.

## `matchContextViewModel.test.mjs`

Verifica correttamente:

- percent labels;
- points labels;
- recent window 3 game;
- unavailable reason mapping;
- comparison labels;
- fallback Home/Away;
- immutabilità del context.

Non monta:

```text
MatchContextCard
```

## `dashboard.test.mjs`

Verifica:

```text
localContext inoltrato per reference
players inoltrati
leftCard metadata
```

Non verifica il DOM della card.

## Build

`npm run build` verifica che il frontend compili.

Non verifica:

```text
nessuna barra quando section unavailable
nessun valore numerico fittizio
aria-label termometro
width delle due metà
assenza comparison section
copy provenance
```

## Finding `MATCH-CONTEXT-007` — aggiungere test component-level

**Priorità:** alta  
**Tipo:** verification contract

### Test minimi

Montare/renderizzare `MatchContextCard` con fixture per:

```text
match + recent available
match unavailable
recent unavailable
comparison unavailable
comparison observedShift true/false
percentuali incoerenti
localContext unsupported version
```

Verificare:

```text
barre presenti soltanto per section available
nessun 50/50
nessun valore sintetico
copy unavailable corretto
aria label coerente
provenance copy corretta
```

### Test backend

Coordinare `MATCH-CONTEXT-003` con:

```text
pointByPoint.test.mjs
localContext.test.mjs
```

per verificare la reason effettivamente propagata.

---

# 8. Stale / last-known Match Context

## Esito: rischio reale, già posseduto da task precedenti

Il componente riceve:

```text
dashboardData.localContext
```

Il report polling ha già rilevato che:

```text
useDashboardViewModel
```

non azzera `dashboardData` quando:

```text
backendData → null
```

e che il polling può mantenere dati precedenti in alcuni failure path.

Quindi Match Context può continuare a mostrare:

```text
localContext precedente
```

quando la lettura corrente è:

- waiting;
- persistence conflict;
- error.

## Ownership

Non viene creato un nuovo change ID.

La correzione è già posseduta da:

```text
FRONT-POLL-003
FRONT-POLL-004
FRONT-SESSION-004
```

Quando quelle task saranno applicate, questo documento dovrà dichiarare se la card riceve:

```text
current
last-known
unavailable
```

e come viene presentato lo stato.

---

# 9. Mapping dashboard

## Esito: corretto

`mapBackendDataToDashboard()`:

```text
localContext: backendData?.localContext ?? null
players: snapshot.players ?? null
```

Non:

- ricalcola point share;
- inventa localContext;
- legge point-by-point;
- costruisce differenze;
- crea 50/50.

Il test verifica che:

```text
dashboard.localContext === localContext
```

per reference.

Questa parte del documento è corretta.

---

# 10. Backend point share

## Esito: authority coerente

Il backend usa soltanto:

```text
stats.match
period === ALL
key === pointsTotal
```

Accetta:

```text
numero finito non negativo
stringa numerica finita non negativa
```

e rifiuta:

```text
totalPoints <= 0
```

Le percentuali sono calcolate nel backend.

`awayPct` viene derivata da:

```text
100 - homePct
```

dopo rounding a una cifra.

Il producer canonico garantisce quindi:

```text
homePct + awayPct = 100
```

entro la rappresentazione prevista.

Questo rafforza il finding `MATCH-CONTEXT-002`:

```text
il frontend può validare l'invariante
senza inventare nuovi valori
```

---

# 11. Recent window

## Esito: gate frontend coerente ma reason meno precisa del documento

Il frontend richiede:

```text
recent.available === true
includedGames === 3
excludedCurrentGame === true
valid pointShare
```

e non usa game più vecchi.

La regola principale del documento è quindi corretta.

Il problema diagnostico è soltanto la reason collassata nel producer.

---

# 12. Comparison

## Esito: descrittiva e non operativa

I delta:

```text
recent.homePct - match.homePct
recent.awayPct - match.awayPct
```

sono calcolati dal backend.

Il frontend formatta:

```text
+/- N,N punti percentuali
```

e non produce:

- segnale;
- edge;
- momentum;
- previsione;
- indicazione di betting.

Questa proprietà deve essere preservata.

La semantica precisa di `observedShift` è trattata in `MATCH-CONTEXT-005`.

---

# 13. Confini

## Esito: corretti

`MatchContextCard` e il view model non dipendono direttamente da:

- scraper Python;
- browser;
- filesystem;
- timeline store;
- Source Identity store;
- Match Evidence;
- decoder point-by-point.

Il decoder e il calcolo sportivo restano backend.

Il frontend consuma soltanto il read model.

---

# 14. Modularizzazione

## Valutazione

```text
Righe: 163
Responsabilità primaria: una
Owner: Match Context frontend
Algoritmi sportivi: esterni al documento
View model presentation: stesso owner
Component rendering: stesso owner
Contesti distinti da separare: nessuno
Nuovi documenti canonici necessari: no
Suddivisione richiesta: no
```

Questo è un caso in cui la modularizzazione sarebbe controproducente.

Separare:

```text
match-context-view-model.md
match-context-card.md
```

creerebbe due documenti per un contratto molto piccolo che deve essere letto insieme:

```text
localContext backend
→ validation/format
→ card
```

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non deve essere creata alcuna task di modularizzazione.

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-023
Percorso report: Report documentale/23 - 04-match-context-ui.md
Documento: docs/tennis-decision-ui/modules/frontend/04-match-context-ui.md
Change ID: MATCH-CONTEXT-001
Change ID: MATCH-CONTEXT-002
Change ID: MATCH-CONTEXT-003
Change ID: MATCH-CONTEXT-004
Change ID: MATCH-CONTEXT-005
Change ID: MATCH-CONTEXT-006
Change ID: MATCH-CONTEXT-007
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
FRONT-POLL-003
FRONT-POLL-004
FRONT-SESSION-004
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare report 023
→ indice 23 ANALIZZATO
→ Divisione non necessaria
→ aggiungere MATCH-CONTEXT-001..007

modifiche-audit-markdown.json
→ appendere TDUI-DOC-REPORT-023
→ appendere MATCH-CONTEXT-001..007
→ split_required:false
→ proposed_files:[]
→ preservare integralmente il ledger precedente
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `MATCH-CONTEXT-001` — provenance backend

**Priorità:** medium

- rimuovere il copy ambiguo `Calcolato localmente`;
- dichiarare backend/project-calculated come authority numerica;
- frontend = validazione e formatting;
- nessun nuovo calcolo sportivo frontend.

## `MATCH-CONTEXT-002` — contract coherence validation

**Priorità:** high

- validare somma percentuali;
- validare punti/totalPoints;
- validare point share internamente coerente;
- rafforzare window metadata;
- impedire comparison incoerente;
- degradare a unavailable, mai correggere automaticamente.

## `MATCH-CONTEXT-003` — recent reason propagation

**Priorità:** high

- distinguere game insufficienti da transizione unsupported/ambiguous;
- preservare reason backend;
- oppure eliminare la reason non producibile da UI/doc;
- nessuna diagnosi point-by-point frontend.

## `MATCH-CONTEXT-004` — per-section availability

**Priorità:** medium

- documentare `localContext.available`;
- documentare `recent.available`;
- documentare `comparison.available`;
- documentare `dataQuality.level`;
- correggere il wording globale degli stati unavailable.

## `MATCH-CONTEXT-005` — observedShift semantics

**Priorità:** medium

- definire come cambio del lato leader;
- distinguere dal semplice delta percentuale;
- valutare naming più preciso;
- mantenere natura descrittiva.

## `MATCH-CONTEXT-006` — localContext compatibility

**Priorità:** medium

- definire uso di `version`;
- definire compatibilità;
- chiarire ruolo di `source` e `purpose`;
- unsupported contract → unavailable, non interpretazione opportunistica.

## `MATCH-CONTEXT-007` — component verification

**Priorità:** high

- test DOM/component;
- test barre;
- test unavailable;
- test malformed percentage;
- test comparison;
- test accessibility/provenance;
- integrare test reason backend.

---

# Ordine consigliato di applicazione

```text
1. MATCH-CONTEXT-003 — reason backend
2. MATCH-CONTEXT-002 — validation contract
3. MATCH-CONTEXT-006 — version compatibility
4. MATCH-CONTEXT-004 — availability semantics
5. MATCH-CONTEXT-005 — observedShift semantics
6. MATCH-CONTEXT-001 — provenance copy
7. FRONT-POLL-003/004 + FRONT-SESSION-004 — stale/current authority
8. MATCH-CONTEXT-007 — verification completa
9. revisione mirata 04-match-context-ui.md
10. checker documentali
11. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

---

# Verifica prevista dopo un'eventuale modifica

## Point share valido

```text
38 / 52
42.2% / 57.8%
total 90
→ available
```

## Percentuali incoerenti

```text
80 / 80
→ unavailable

40 / 40
→ unavailable
```

Nessun clamp.

Nessun 50/50.

## Punti vs percentuali incoerenti

```text
90 / 10
10% / 90%
→ unavailable
```

## Recent

```text
3 completed
current excluded
canonical window metadata
→ available
```

```text
2 completed
→ unavailable
```

```text
3 candidati
uno unsupported/ambiguous
→ reason specifica secondo contratto scelto
```

## Comparison

```text
match disponibile
recent disponibile
deltas coerenti
→ comparison disponibile
```

Se una dipendenza è invalida:

```text
comparison
→ unavailable
```

## observedShift

```text
match leader away
recent leader home
→ observedShift true
```

```text
percentuali cambiano
leader resta away
→ observedShift false
```

Il copy deve rendere chiara questa distinzione.

## Schema

```text
version 1
→ interpretato

version unsupported
→ comportamento deterministico
```

## Component

Verificare DOM:

```text
unavailable section
→ no thermometer
→ no percentage
→ no points

available section
→ thermometer
→ aria-label coerente
```

## Stale/current

Dopo l'applicazione delle task polling:

```text
current localContext
→ backend current unavailable
→ card non deve sembrare current usando il vecchio context
```

## Test

Mantenere:

```bash
node src/components/matchContextViewModel.test.mjs
node src/types/dashboard.test.mjs
```

Aggiungere la suite component-level.

Per il backend:

```bash
node sofa/pointByPoint.test.mjs
node sofa/localContext.test.mjs
```

## Build e documentazione

```bash
npm run build
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
04-match-context-ui.md: OWNER COMPATTO E SOLIDO, MA IL BOUNDARY DI VALIDAZIONE VA RAFFORZATO

Data flow: corretto
frontend no sport calculation: corretto
no 50/50: corretto
recent 3-game gate: corretto
comparison descriptive: corretto
no storage/decoder frontend: corretto

"Calcolato localmente": provenance ambigua
point share pair consistency: non verificata
percentage sum: non verificata
point/percentage consistency: non verificata
window contract: verificato solo parzialmente
comparison dependencies: non verificate
unsupported/ambiguous reason: persa dal producer window
availability top-level: non equivale a tutta la card
dataQuality semantics: non spiegata dal frontend owner
observedShift: leader switch, non generic shift
version/source/purpose: ignorati
stale context: dipendenza già aperta nel polling
component render tests: assenti

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: alta
```

Il documento deve restare unico.

La regola centrale da preservare è:

```text
backend
→ calcola

frontend
→ verifica che il contratto sia coerente
→ formatta
→ se incoerente mostra unavailable
```

senza trasformare la validazione in un secondo motore di calcolo sportivo.

---

# Aggiornamento applicativo

La revisione documentale del documento canonico è stata applicata senza modificare
codice o test.

Completate:

```text
MATCH-CONTEXT-004
→ availability documentata per singola sezione
→ chiarito il ruolo di dataQuality.level

MATCH-CONTEXT-005
→ observedShift definito come cambio del lato leader
→ distinto dai delta percentuali e da qualunque trend
```

Il documento ora registra inoltre in modo esplicito i limiti del codice corrente:

- copy `Calcolato localmente` ancora ambiguo nella card;
- validazione delle invarianti numeriche ancora incompleta;
- reason unsupported/ambiguous ancora aggregata dal producer;
- `version`, `source` e `purpose` non ancora usati come gate;
- test component-level ancora assenti.

Le task `MATCH-CONTEXT-001`, `002`, `003`, `006` e `007` sono state
successivamente applicate:

- copy UI riallineato all'authority backend;
- validazione fail-closed delle invarianti numeriche e della finestra recent;
- comparison ammessa soltanto con dipendenze e delta coerenti;
- reason unsupported/ambiguous preservata dal backend;
- contratto `version/source/purpose` verificato dal consumer;
- test component-level e test backend aggiunti.

Stato finale del report: `MATCH-CONTEXT-001–007` completate e verificate.

Operazioni Git di scrittura: nessuna.
