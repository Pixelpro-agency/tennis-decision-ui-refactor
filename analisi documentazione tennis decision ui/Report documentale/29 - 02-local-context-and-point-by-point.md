# Report documentale — `docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-029
Sequenza audit: 29/72
Documento analizzato: 02-local-context-and-point-by-point.md
Percorso documento: docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md
Percorso report: Report documentale/29 - 02-local-context-and-point-by-point.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 54c10fcfe43469aa1b5a106cfd054ff5da56956d
Dimensione documento: 243 righe
Ruolo dichiarato: owner del contesto locale SofaScore e del decoder point-by-point
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/pointByPoint.js`;
- `backend/src/sofa/localContext.js`;
- `backend/src/sofa/normalizeSnapshot.js`;
- `backend/src/sofa/buildSofaAnalysis.js`;
- `backend/src/sofa/trackerUpdate.js`;
- `backend/src/sofa/matchTracker.js`;
- `backend/src/sofa/loadSofaAnalysis.js`;
- `backend/src/sofa/matchHistory.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/handler.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/historyDocument.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/timelineDocument.js`;
- `backend/src/routes/match.js`;
- `backend/src/routes/match/analysisResponse.js`;
- `frontend/src/components/MatchContextCard.jsx`;
- `frontend/src/components/matchContextViewModel.js`;
- `backend/src/sofa/pointByPoint.test.mjs`;
- `backend/src/sofa/normalizeSnapshot.test.mjs`;
- `backend/src/sofa/localContext.test.mjs`;
- `backend/src/sofa/buildSofaAnalysis.test.mjs`;
- `backend/src/routes/match/analysisResponse.test.mjs`;
- `backend/src/sofa/fixtures/pointByPoint.verified.fixture.mjs`;
- i finding già registrati nei report precedenti, soprattutto `MATCH-CONTEXT-*`, `MATCH-API-*`, `SOFA-LIVE-*` e `SOURCE-ID-*`.

La mappa Markdown di continuazione e il JSON incrementale di continuazione non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
normalizePointByPoint: implementato e conservativo
decoder regular game/deuce/advantage: implementato
tie-break numerici: fail-closed
finestra ultimi tre game: implementata
nessun fallback verso game più vecchi: implementato
pointsTotal ALL: usato come dichiarato
localContext match/recent/comparison/dataQuality: implementato
nessun 50/50 sintetico: corretto
localContext in timeline Sofa: implementato
localContext escluso dalla history aggregata: corretto
localContext escluso dal sample Source Identity: corretto
frontend consumer: presente

Assunzione "entry massima = game corrente": non verificata sul source contract
excludedCurrentGame=true: oggi è una dichiarazione più forte dell'evidenza disponibile
set/game: accettati numeri finiti anche frazionari/negativi e senza uniqueness
pointsTotal: accetta qualsiasi numero/stringa numerica finita non negativa, anche non intera
pointsTotal duplicati: il primo match viene accettato senza ambiguity handling
dataQuality.complete: descrive completezza derivativa, non freshness/coerenza live/provenance
bootstrap wording: documento non corrisponde al flusso reale del localContext precomputato
POST /api/match/analyze: può persistere localContext fuori dal gate live
POST /api/match/snapshot: redirect allo stesso writer
PBP real-source semantics: non archiviate con sufficiente evidence
reason unsupported/ambiguous: collassata nel window builder; finding già aperto
test path trackerUpdate.test.mjs: assente
test path matchHistory/sofaUpdates.test.mjs: assente

Modifiche nuove proposte: 8
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
Priorità complessiva: CRITICA
```

L'algoritmo segue correttamente la filosofia:

```text
dato verificabile
→ calcolo descrittivo

dato insufficiente / ambiguo
→ unavailable
```

Non sono stati trovati fallback 50/50, inferenze betting, pressure, momentum o segnali operativi.

Le criticità principali riguardano invece l'**authority degli input**: il codice considera verificati alcuni invarianti del payload che il repository non ha ancora dimostrato con un artifact reale sufficientemente forte.

---

# 1. L'esclusione del “game corrente” è una supposizione strutturale, non una proprietà verificata

## Esito: rischio di finestra recente silenziosamente spostata

`buildRecentCompletedGamesWindow()`:

```text
flatten games
→ sort set/game
→ games.slice(-4, -1)
```

Il codice quindi:

```text
considera sempre l'elemento massimo
come game corrente da escludere
```

Il documento dice:

```text
Il game con coppia set e game più alta viene sempre escluso
perché può essere ancora in corso.
```

La frase descrive correttamente il codice.

Non dimostra però che questa operazione produca sempre:

```text
gli ultimi tre game completati reali
```

## Caso sicuro

Se il provider garantisce:

```text
PBP include sempre il game corrente
→ highest(set, game) = current
```

allora:

```text
slice(-4, -1)
```

è coerente.

## Caso non dimostrato

Se in un istante il provider restituisce soltanto game già completati e il game corrente non è ancora presente:

```text
... game 7
... game 8
... game 9
... game 10 completato

current game 11 non ancora presente nel PBP
```

il codice costruisce:

```text
game 7
game 8
game 9
```

e scarta game 10, che era invece il più recente completato.

Il risultato resta:

```text
available:true
includedGames:3
excludedCurrentGame:true
```

quindi il problema non viene segnalato.

## Evidenza disponibile

Le fixture locali sono coerenti con l'assunzione:

```text
7
8
9
10
→ 10 trattato come corrente
→ recent = 7,8,9
```

ma una fixture progettata per il decoder non prova il contratto del provider live.

Le precedenti verifiche del progetto hanno già stabilito che la semantica raw del PBP richiede validazione specifica; il documento stesso mantiene correttamente lo stato:

```text
Implementato, da validare su match reale.
```

## Finding `LOCAL-PBP-001` — rendere evidence-based l'identificazione del game corrente

**Priorità:** high  
**Tipo:** current-game authority

### Target

`excludedCurrentGame:true` deve significare:

```text
game corrente effettivamente identificato
```

non:

```text
abbiamo escluso l'entry numericamente più alta
```

### Possibili authority

La decisione deve essere presa solo dopo aver validato il source contract reale.

Può usare:

- una proprietà provider verificata;
- coerenza con snapshot score/status;
- un marker esplicito disponibile nel raw payload;
- altra informazione già presente e realmente verificata.

Non va inventata una nuova euristica senza evidenza.

### Fail-closed

Se non è possibile stabilire quale sia il game corrente:

```text
recent.available = false
```

oppure il contratto deve dichiarare esplicitamente una finestra:

```text
last-observed-games-excluding-max
```

che non venga presentata come “ultimi 3 game completati”.

### Test

Aggiungere almeno:

```text
current game presente
current game assente
ultimo game completato ma current non ancora apparso
transizione fra set
solo tre game completati
quattro game completati senza current marker
```

---

# 2. `set` e `game` non hanno una identity validation sufficiente

## Esito: numeri finiti non equivalgono a game canonici

La normalizzazione richiede:

```js
Number.isFinite(rawSet.set)
Number.isFinite(rawGame.game)
```

Quindi sono tecnicamente ammessi anche valori come:

```text
set = -1
set = 1.5
game = -4
game = 7.25
```

Inoltre non viene verificata l'unicità della coppia:

```text
(set, game)
```

## Duplicate identity

Un payload del tipo:

```text
set 2 game 7
set 2 game 7
set 2 game 8
set 2 game 9
set 2 game 10
```

viene:

```text
normalizzato
→ ordinato
→ trattato come cinque game distinti
```

La finestra recente può quindi includere duplicati senza diventare unavailable.

## Perché conta

L'unità semantica del calcolo recente non è:

```text
array element
```

ma:

```text
un game identificato da set + game
```

Il producer deve quindi proteggere quella identity.

## Finding `LOCAL-PBP-002` — introdurre una identity validation canonica per set/game

**Priorità:** high  
**Tipo:** point-by-point structural identity

### Target

Prima del decoder:

```text
set/game devono rispettare il dominio verificato del provider
```

Almeno:

```text
integer semantics
identity (set, game) univoca
nessun duplicato ambiguo
nessuna collisione silenziosa
```

Il range esatto:

```text
0-based
oppure
1-based
```

non deve essere deciso per intuizione.

Va preso dalla validazione reale `LOCAL-PBP-007`.

### Duplicati

Se due entry con la stessa identity hanno contenuto diverso:

```text
fail-closed
```

Se il provider può legittimamente duplicare la stessa entry, serve una regola canonica provata e testata, non `sort()` + accettazione implicita.

---

# 3. `pointsTotal` accetta valori che non hanno ancora una semantica di conteggio verificata

## Esito: il validator è più permissivo del dominio “numero di punti”

`buildMatchPointShare()` usa:

```text
period === ALL
key === pointsTotal
```

come dichiarato.

La funzione `parseNonNegativeFiniteNumber()` accetta:

```text
qualsiasi number finito >= 0
qualsiasi stringa che Number(...) converte a numero finito >= 0
```

Quindi, per esempio, il codice accetterebbe:

```text
38.5
"38.5"
"1e2"
"0x10"
```

come conteggi di punti.

## Duplicati

`findPointsTotal()` usa:

```js
matchStats.find(...)
```

quindi se esistono due record:

```text
ALL / pointsTotal
```

con valori diversi, il primo vince senza ambiguity reason.

## Principio corretto da preservare

Lo zero per singolo lato è legittimo.

Il totale:

```text
home + away === 0
```

resta correttamente unavailable.

Non va introdotto alcun fallback numerico.

## Finding `LOCAL-PBP-003` — definire il domain contract canonico di `pointsTotal`

**Priorità:** high  
**Tipo:** statistics count validation

### Target

Stabilire dal producer reale:

```text
tipo ammesso
formato stringa eventualmente ammesso
integer semantics
unicità di ALL/pointsTotal
```

### Fail-closed

Valori:

```text
frazionari
formati numerici non prodotti realmente
duplicati confliggenti
non finiti
negativi
```

devono rendere `match.pointShare` unavailable.

### Test

Aggiungere:

```text
number integer
numeric string realmente supportata
zero su un lato
0 + 0
fractional
scientific notation
hex-like string
duplicate equal
duplicate conflicting
NaN / Infinity
```

Non ampliare i formati ammessi senza evidence provider.

---

# 4. `dataQuality.level === complete` è completezza del calcolo, non qualità completa della fonte

## Esito: naming semanticamente troppo forte

Oggi:

```text
matchPointShare.available
+
recent.available
→ dataQuality.level = complete
```

Questo dimostra:

```text
statistica match decodificabile
+
finestra recente decodificabile
```

Non dimostra:

```text
PBP fresco rispetto allo snapshot event
statistics e PBP temporalmente coerenti
current game realmente identificato
source contract live validato
assenza di payload stale
```

## Problema

Il documento dice:

```text
Per riconoscere un contesto completo:
dataQuality.level === complete
```

Senza qualificazione, un consumer può interpretare:

```text
complete
```

come una garanzia di qualità complessiva del dato.

Il codice possiede invece soltanto:

```text
derivation completeness
```

## Finding `LOCAL-PBP-004` — qualificare la data quality del localContext

**Priorità:** high  
**Tipo:** data quality semantics

### Opzione preferibile

Mantenere separati almeno:

```text
structural/derivation availability
source/provenance validation
temporal alignment/freshness
```

senza inventare valori non misurabili.

### Finché freshness/alignment non sono disponibili

Documentare esplicitamente:

```text
level=complete
= complete per il calcolo locale corrente
≠
source freshness verified
≠
cross-endpoint temporal alignment verified
```

### Coordinamento

Allineare con le task frontend già aperte:

```text
MATCH-CONTEXT-004
MATCH-CONTEXT-006
```

senza spostare il calcolo sportivo nel frontend.

---

# 5. `/api/match/analyze` è un secondo writer Sofa canonico fuori dal Source Identity Gate live

## Esito: confine di persistenza non esplicitato in questo owner

Il documento descrive principalmente:

```text
tracking
→ normalizeSnapshot
→ buildLocalContext
→ Source Identity Gate
→ persistence
```

Ma esiste anche:

```text
POST /api/match/analyze
```

che esegue:

```text
buildSofaAnalysis(eventId)
→ snapshot
→ localContext
→ addSofaUpdate(...)
```

senza passare da:

```text
observeSofaSourceIdentitySample
Source Identity Gate
tracking session lifecycle
```

La route:

```text
POST /api/match/snapshot
```

fa redirect 307 verso `/api/match/analyze`.

## Effetto

`addSofaUpdate()` è il writer canonico Sofa:

```text
history
+
timeline
+
journal
```

Il `localContext` dell'analisi viene inserito nel `timelineData`.

Quindi il sistema possiede almeno due percorsi capaci di produrre tick Sofa:

```text
live tracking
POST /analyze
```

con authority diverse.

## Perché conta

Se `/analyze` viene invocata durante o fra sessioni cross-source:

```text
può creare un tick Sofa canonico
senza la decisione del gate live
```

Questo non significa automaticamente che il calcolo `localContext` sia errato.

Significa che l'ownership della **scrittura canonica** non è uniforme.

## Finding `LOCAL-PBP-005` — classificare e mettere in sicurezza il writer `/analyze`

**Priorità:** critical  
**Tipo:** canonical writer authority

### Decisione richiesta

Stabilire se `/analyze` deve essere:

```text
A. compute-only
```

oppure:

```text
B. canonical writer
```

### Se compute-only

Rimuovere l'effetto:

```text
addSofaUpdate(...)
```

e restituire soltanto:

```text
snapshot
localContext
```

### Se canonical writer

Deve rispettare le stesse invarianti applicabili alla persistenza canonica:

- session/source authority;
- Source Identity quando pertinente;
- persistence integrity;
- writer sequencing;
- error/result contract;
- test di concorrenza con live tracking.

### Coordinamento

Usare il futuro owner API:

```text
docs/tennis-decision-ui/api/match/03-analysis-and-snapshot.md
```

già previsto da `MATCH-API-008`.

Non creare una seconda pipeline di persistenza.

---

# 6. La descrizione del bootstrap `localContext` non corrisponde al codice corrente

## Esito: incongruenza documentale precisa

Il documento afferma:

```text
Durante il bootstrap Source Identity,
matchTracker.js passa soltanto sofaSample.snapshot;
persistSofaTrackingSample(...) calcola quindi localContext
da quello snapshot
```

Il flusso reale è diverso.

## Runtime

`updateSofa()` calcola:

```text
snapshot
localContext
```

e passa al gate:

```js
observeFn(eventId, sample, { localContext })
```

Il gate conserva separatamente:

```text
sofaSample
sofaPersistenceData
```

Il callback `onOpenRecording` riceve:

```text
sofaSample
sofaPersistenceData
```

`persistBootstrapTrackingSamples()` passa a `persistSofaTrackingSample()`:

```text
snapshot: sofaSample.snapshot
localContext: sofaPersistenceData?.localContext ?? null
```

Quindi, nel percorso normale:

```text
localContext già calcolato
→ attraversa il gate come persistence data opaco
→ viene riutilizzato al bootstrap
```

`persistSofaTrackingSample()` ricalcola `localContext` soltanto come fallback quando non ne riceve uno.

## Finding `LOCAL-PBP-006` — correggere il contratto di propagazione bootstrap

**Priorità:** medium  
**Tipo:** documentation/runtime alignment

### Documento corretto

Descrivere:

```text
updateSofa
→ buildLocalContext(snapshot)
→ sample Source Identity senza localContext
→ persistenceData opaco con localContext
→ bootstrap
→ reuse dello stesso localContext
```

### Invariante da preservare

`localContext`:

```text
non partecipa al matching Source Identity
```

ma:

```text
può accompagnare il sample come persistenceData opaco
```

### Fallback

Documentare separatamente:

```text
persistSofaTrackingSample
→ ricalcola localContext solo se il caller non lo ha fornito
```

Non trasformare il fallback in comportamento canonico descritto.

---

# 7. Il source contract point-by-point non è ancora validato con un artifact reale sufficiente

## Esito: stato “da validare” corretto, ma manca la matrice delle assunzioni

Il documento è prudente:

```text
Implementato, da validare su match reale.
```

Questa frase deve restare finché le assunzioni di parsing non sono state verificate.

## Assunzioni che il codice oggi incorpora

Il decoder assume almeno che:

1. il payload sia una lista di set;
2. `set` e `game` identifichino cronologicamente i game;
3. `points` rappresenti stati dopo punto;
4. lo stato iniziale `0-0` sia implicito;
5. i token regular siano `0`, `15`, `30`, `40`;
6. il vantaggio sia rappresentabile dal token supportato dal decoder;
7. il winning point finale possa essere inferito dal penultimo score osservato;
8. l'entry massima sia il game corrente da scartare;
9. tie-break numerici debbano restare unsupported;
10. un game con `points:[]` possa essere considerato structural unavailable.

Le fixture verificano l'algoritmo rispetto a questi esempi.

Non dimostrano che il provider reale garantisca tutti i punti sopra.

## Finding `LOCAL-PBP-007` — creare una validazione riproducibile del source contract

**Priorità:** high  
**Tipo:** source validation provenance

### Artifact

Usare `docs/validations/` per registrare una verifica reale con:

```text
data
commit/SHA
eventId o riferimento riproducibile non sensibile
endpoint
shape osservata
casi coperti
limiti
```

### Minimo da osservare

Verificare esplicitamente:

```text
set/game type
ordering
duplicate behavior
current-game presence
points empty/nonempty
homePoint/awayPoint token set
advantage representation
deuce
winning-point representation
set transition
tie-break
match finished
PBP temporarily unavailable
```

### Regola

Qualunque semantica non osservata:

```text
resta unsupported/unavailable
```

Non va ampliato il decoder per intuizione.

---

# 8. La sezione Verifica contiene path assenti e non copre gli invarianti più rischiosi

## Esito: verification contract parzialmente stale

Il documento elenca:

```text
node sofa/pointByPoint.test.mjs
node sofa/normalizeSnapshot.test.mjs
node sofa/localContext.test.mjs
node sofa/buildSofaAnalysis.test.mjs
node sofa/trackerUpdate.test.mjs
node sofa/matchHistory/sofaUpdates.test.mjs
node routes/match/analysisResponse.test.mjs
```

Al commit auditato risultano presenti:

```text
sofa/pointByPoint.test.mjs
sofa/normalizeSnapshot.test.mjs
sofa/localContext.test.mjs
sofa/buildSofaAnalysis.test.mjs
routes/match/analysisResponse.test.mjs
```

Non risultano invece agli esatti path dichiarati:

```text
sofa/trackerUpdate.test.mjs
sofa/matchHistory/sofaUpdates.test.mjs
```

## Copertura esistente positiva

`pointByPoint.test.mjs` copre:

- normalizzazione immutabile;
- regular games;
- deuce/advantage;
- tie-break unsupported;
- transizione saltata;
- ultimi tre game;
- ordinamento set/game;
- meno di quattro game;
- structural invalid.

`localContext.test.mjs` copre:

- point share match;
- recent;
- comparison;
- `observedShift`;
- `dataQuality`;
- PBP unavailable;
- total points 0.

`buildSofaAnalysis.test.mjs` verifica l'integrazione:

```text
raw payload
→ snapshot
→ localContext
```

`analysisResponse.test.mjs` verifica che:

```text
snapshot + localContext
```

raggiungano `addSofaUpdate`.

## Gap importanti

Non risultano test dedicati a:

```text
current game assente dal PBP
duplicate set/game identity
fractional/negative set/game
pointsTotal fractional
pointsTotal duplicate/conflicting
PBP source contract reale
bootstrap opaque localContext propagation nello stesso owner
/analyze vs live tracking writer authority
```

## Reason già nota

Il frontend possiede una label per:

```text
unsupported_or_ambiguous_score_transition
```

ma `buildRecentCompletedGamesWindow()` converte una failure di `decodeCompletedGame()` in:

```text
insufficient_verified_completed_games
```

La correzione è già registrata in:

```text
MATCH-CONTEXT-003
```

e non viene duplicata con un nuovo change ID.

## Finding `LOCAL-PBP-008` — riallineare verification matrix e test ai veri invarianti

**Priorità:** high  
**Tipo:** verification contract

### Modifiche

- rimuovere/correggere i path test inesistenti;
- conservare i test realmente presenti;
- aggiungere i casi `LOCAL-PBP-001..007`;
- coordinare la reason propagation con `MATCH-CONTEXT-003`;
- aggiungere test di writer authority per `/analyze`;
- mantenere separata la validation live dall'unit test sintetico.

---

# 9. Match point share

## Esito: design corretto salvo il domain contract di input

La formula:

```text
homePct = homePoints / totalPoints
awayPct = 100 - homePct
```

è deterministica.

Non esistono:

- fallback 50/50;
- smoothing;
- peso arbitrario;
- normalizzazione betting;
- confidence score.

`leadingSide`:

```text
home
away
level
```

è descrittivo.

La correzione necessaria riguarda `LOCAL-PBP-003`, non la formula.

---

# 10. Recent point share

## Esito: principio fail-closed corretto

Il progetto non:

```text
salta un game ambiguo
per prendere un quarto game più vecchio
```

Questo è corretto.

Se uno dei tre candidate game non è decodificabile, la finestra diventa unavailable.

Va preservata questa scelta.

La correzione di `LOCAL-PBP-001` riguarda soltanto l'identificazione del game che deve essere escluso come current.

---

# 11. Decoder regular / deuce / advantage

## Esito: implementazione internamente coerente

Il decoder parte da:

```text
0-0 implicito
```

Per ogni stato osservato trova:

```text
esattamente una transizione compatibile
```

Una transizione:

```text
0-0
→ 15-0
→ 40-0
```

viene correttamente rifiutata perché manca uno stato intermedio.

Tie-break numerici vengono rifiutati.

`A-A` viene rifiutato.

Il winning point viene inferito soltanto quando dallo stato finale osservato esiste un unico outcome terminale.

Questa logica è conservativa.

Il limite è source-level:

```text
dobbiamo ancora dimostrare che il raw provider
usi proprio questa rappresentazione
```

gestito da `LOCAL-PBP-007`.

---

# 12. Reason propagation

## Esito: gap già censito, nessuna task duplicata

`decodeCompletedGame()` restituisce:

```text
unsupported_or_ambiguous_score_transition
```

ma `buildRecentCompletedGamesWindow()` se uno dei tre game fallisce ritorna il generic:

```text
insufficient_verified_completed_games
```

Quindi il reason specifico non raggiunge normalmente:

```text
localContext.recent.reason
```

Il frontend possiede però già una traduzione per entrambi.

Questo problema è già registrato come:

```text
MATCH-CONTEXT-003
```

che richiede precisamente di preservare la distinzione dal backend oppure rimuovere la reason non producibile.

Non viene aperto `LOCAL-PBP-009` per evitare duplicazione.

Questo owner deve essere considerato il punto tecnico in cui applicare la parte backend di quella task.

---

# 13. `localContext.available`

## Esito: contratto reale ma semantica da consumare per sezione

Il top-level:

```text
available
```

dipende soltanto da:

```text
match.pointShare.available
```

È quindi possibile:

```text
available:true
recent:false
comparison:false
```

oppure, nel codice:

```text
available:false
recent:true
```

se le statistiche match sono assenti ma il PBP recente è valido.

Il documento chiarisce correttamente che:

```text
localContext.available
```

non significa “tutto disponibile”.

La presentazione per sezione è già stata censita nel report frontend con:

```text
MATCH-CONTEXT-004
```

Nessuna nuova task.

---

# 14. `observedShift`

## Esito: semantics già censita nel frontend audit

Il producer imposta `observedShift:true` soltanto quando:

```text
match leader = home/away
recent leader = home/away
e i due leader sono differenti
```

Un passaggio:

```text
level → home
```

non produce `observedShift:true`.

La necessità di chiarire che si tratta di cambio del lato leader, non di generico delta percentuale, è già registrata come:

```text
MATCH-CONTEXT-005
```

Nessuna nuova task.

---

# 15. Version, source e purpose

## Esito: presenti nel producer, poco documentati nell'owner corrente

Il producer restituisce:

```json
{
  "version": 1,
  "source": "project-calculated",
  "purpose": "descriptive-match-context"
}
```

Il documento non definisce questi campi.

La policy di compatibilità è già stata aperta come:

```text
MATCH-CONTEXT-006
```

La revisione di questo documento deve coordinarsi con quella task senza creare un secondo version contract.

---

# 16. Persistenza

## Timeline

Il Sofa tick contiene realmente:

```text
snapshot
localContext
```

oltre ai campi derivati del tick.

## History

`appendHistoryRow()` salva sotto `sofa`:

```text
score
serving
stats
status
surface
```

Non salva `localContext`.

Quindi la frase:

```text
localContext appartiene al tick SofaScore
e non viene aggiunto alla history aggregata
```

è corretta.

## Journal

La persistenza timeline/history resta journalizzata dal writer Sofa canonico.

Il problema non è il formato della persistenza ma l'esistenza di `/analyze` come secondo percorso di chiamata del writer, coperto da `LOCAL-PBP-005`.

---

# 17. Source Identity

## Esito: separazione dei dati corretta

Il sample del gate contiene:

```text
snapshot
tournamentName
dateStr
```

`localContext` non viene inserito nel sample usato dal matching.

Questo è corretto.

Il dato viene invece passato separatamente come:

```text
persistenceData
```

affinché il bootstrap possa persistere lo stesso contesto derivato senza usarlo per l'identità.

Questa distinzione è buona e va documentata correttamente con `LOCAL-PBP-006`.

---

# 18. Frontend

## Esito: consumer presente, ma non authority del calcolo

`MatchContextCard` usa:

```text
localContext
```

e delega a:

```text
buildMatchContextViewModel()
```

Il view model verifica shape e valori prima della presentazione.

Non deve:

```text
ricalcolare point share
ricostruire i game
reinterpretare il PBP raw
```

Le task frontend già aperte restano owner della presentation.

La frase UI:

```text
Calcolato localmente dai dati disponibili
```

è già stata censita come ambigua in `MATCH-CONTEXT-001`.

Nessuna nuova task.

---

# 19. Lunghezza, integrità del contesto e modularizzazione

## Valutazione

```text
Righe: 243
Responsabilità primaria: una
Owner algoritmico: pointByPoint.js + localContext.js
Pipeline:
raw PBP
→ normalize
→ decode
→ recent window
→ localContext
```

La normalizzazione PBP e `localContext` sono separati in due moduli di codice ma costituiscono un unico contratto documentale:

```text
quali dati recenti sono verificabili
→ come vengono trasformati in contesto descrittivo
```

Dividerli in due documenti renderebbe più difficile verificare:

```text
input assumptions
→ unavailable reason
→ recent window
→ comparison/dataQuality
```

Il documento non è eccessivamente lungo.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non deve essere creata alcuna task di modularizzazione.

---

# Riferimenti per la mappa e il JSON incrementale di continuazione

```text
Report ID: TDUI-DOC-REPORT-029
Percorso report: Report documentale/29 - 02-local-context-and-point-by-point.md
Documento: docs/tennis-decision-ui/modules/sofa/02-local-context-and-point-by-point.md

Change ID: LOCAL-PBP-001
Change ID: LOCAL-PBP-002
Change ID: LOCAL-PBP-003
Change ID: LOCAL-PBP-004
Change ID: LOCAL-PBP-005
Change ID: LOCAL-PBP-006
Change ID: LOCAL-PBP-007
Change ID: LOCAL-PBP-008

Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Dipendenze già aperte da non duplicare:

```text
MATCH-CONTEXT-001
MATCH-CONTEXT-003
MATCH-CONTEXT-004
MATCH-CONTEXT-005
MATCH-CONTEXT-006
MATCH-CONTEXT-007
MATCH-API-007
MATCH-API-008
SOFA-LIVE-001
SOFA-LIVE-009
SOURCE-ID-001
SOURCE-ID-002
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository-continuazione-023.md
→ registrare report 029
→ indice 29 ANALIZZATO
→ Divisione non necessaria
→ aggiungere LOCAL-PBP-001..008

modifiche-audit-markdown-continuazione-023.json
→ appendere TDUI-DOC-REPORT-029
→ appendere LOCAL-PBP-001..008
→ split_required:false
→ proposed_files:[]
```

I file di mappa/ledger non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `LOCAL-PBP-001` — current-game authority

**Priorità:** high

- non equiparare automaticamente highest `(set,game)` al game corrente;
- validare la proprietà sul source contract;
- `excludedCurrentGame:true` soltanto con evidence;
- fail-closed se current game non identificabile;
- test game corrente presente/assente e set transition.

## `LOCAL-PBP-002` — point-by-point structural identity

**Priorità:** high

- definire integer semantics di `set`/`game` dal provider reale;
- verificare uniqueness `(set,game)`;
- rifiutare duplicati confliggenti;
- non trattare array entries duplicate come game distinti;
- testare valori frazionari/negativi/duplicati.

## `LOCAL-PBP-003` — `pointsTotal` domain contract

**Priorità:** high

- definire type/format realmente prodotto;
- conteggi con semantica intera;
- gestire duplicati ALL/pointsTotal;
- rifiutare formati numerici non verificati;
- preservare zero reale e `0+0 → unavailable`.

## `LOCAL-PBP-004` — local data-quality semantics

**Priorità:** high

- qualificare `complete` come completezza derivativa;
- non implicare freshness o temporal alignment non misurati;
- separare structural availability, provenance e freshness quando disponibili;
- coordinare frontend senza duplicare calcoli.

## `LOCAL-PBP-005` — `/analyze` canonical writer authority

**Priorità:** critical

- classificare `/analyze` e `/snapshot`;
- decidere compute-only vs canonical writer;
- se writer, applicare le authority canoniche rilevanti;
- impedire bypass non dichiarati di gate/session sequencing;
- coordinare con `MATCH-API-008`.

## `LOCAL-PBP-006` — bootstrap localContext propagation

**Priorità:** medium

- correggere la frase “passa soltanto snapshot”;
- documentare `sofaPersistenceData.localContext`;
- mantenere localContext fuori dal matching Source Identity;
- descrivere la recomputation soltanto come fallback.

## `LOCAL-PBP-007` — real PBP source validation

**Priorità:** high

- creare artifact riproducibile in `docs/validations/`;
- verificare token, advantage, final point, ordering, current game, duplicates, set transitions, tie-break e empty points;
- nessuna estensione decoder senza evidence.

## `LOCAL-PBP-008` — verification matrix

**Priorità:** high

- correggere i path test inesistenti;
- mantenere le suite realmente presenti;
- aggiungere edge case per 001–007;
- coordinare reason propagation con `MATCH-CONTEXT-003`;
- testare `/analyze` writer boundary;
- separare unit fixture e live validation.

---

# Ordine consigliato di applicazione

```text
1. LOCAL-PBP-007
2. LOCAL-PBP-001
3. LOCAL-PBP-002
4. LOCAL-PBP-003
5. LOCAL-PBP-004
6. LOCAL-PBP-005
7. MATCH-CONTEXT-003/004/006
8. LOCAL-PBP-006
9. LOCAL-PBP-008
10. revisione mirata 02-local-context-and-point-by-point.md
11. checker documentali
12. aggiornamento cumulativo mappa/ledger al checkpoint previsto
```

La validazione del source contract viene prima delle modifiche del decoder perché non bisogna cambiare l'algoritmo sulla base di ipotesi non osservate.

---

# Verifica prevista dopo un'eventuale modifica

## Current game

```text
PBP con current game verificato
→ esclusione current
→ ultimi tre completati corretti
```

```text
PBP senza current game verificabile
→ recent unavailable
```

mai:

```text
excludedCurrentGame:true
```

se l'identità current non è dimostrata.

## Identity

```text
duplicate set/game conflicting
→ unavailable
```

```text
fractional set/game
→ unavailable
```

secondo il domain contract verificato.

## pointsTotal

```text
38 / 52
→ disponibile
```

```text
0 / 12
→ disponibile
```

```text
0 / 0
→ unavailable
```

```text
38.5 / 52
→ unavailable
```

se i counts interi sono confermati come source contract.

Duplicati confliggenti:

```text
→ unavailable
```

## Data quality

Il consumer deve poter distinguere:

```text
derivation complete
```

da:

```text
freshness verified
source contract verified
temporal alignment verified
```

senza inferire proprietà mancanti.

## Analyze writer

### Se compute-only

```text
POST /analyze
→ snapshot + localContext
→ zero history/timeline write
```

### Se canonical writer

```text
POST /analyze
→ authority check
→ writer sequencing
→ persistence result osservabile
```

e nessun bypass implicito del lifecycle deciso.

## Bootstrap

```text
updateSofa calcola localContext X
→ gate riceve sample senza X
→ persistenceData conserva X
→ bootstrap persiste X
```

senza ricostruzione divergente.

## Source validation

Artifact reale deve rendere verificabili almeno:

```text
token
ordering
game identity
current-game policy
terminal-point representation
advantage/deuce
tie-break
```

## Test

```text
node sofa/pointByPoint.test.mjs
node sofa/normalizeSnapshot.test.mjs
node sofa/localContext.test.mjs
node sofa/buildSofaAnalysis.test.mjs
node routes/match/analysisResponse.test.mjs
```

più le suite corrette realmente presenti per tracking/persistence dopo l'inventario del repository.

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

Completato il 10 agosto 2026. Le task `LOCAL-PBP-001..008` sono state applicate: current game evidence-based e fail-closed, identità set/game canoniche e univoche, `pointsTotal` intero con duplicati rifiutati, qualità qualificata come derivativa, `/analyze` e `/snapshot` compute-only, bootstrap documentato correttamente, validation riproducibile archiviata e matrice di test riallineata.

Il decoder non è stato esteso oltre l'evidenza disponibile: tie-break e proprietà live non dimostrate restano unsupported o unknown.

```text
02-local-context-and-point-by-point.md:
OWNER CORRETTO, ALGORITMO CONSERVATIVO, SOURCE CONTRACT NON ANCORA SUFFICIENTEMENTE PROVATO

normalize PBP: corretto come boundary minimo
decoder regular/deuce/advantage: coerente internamente
tie-break: fail-closed
nessun fallback game vecchi: corretto
point share: deterministico
comparison: descrittiva
dataQuality: implementata
timeline localContext: corretto
history senza localContext: corretto
gate sample senza localContext: corretto

highest game = current: non provato
excludedCurrentGame=true: troppo forte
set/game uniqueness: non validata
set/game integer semantics: non validata
pointsTotal domain: troppo permissivo
pointsTotal duplicates: ambiguity non gestita
dataQuality complete: non equivale a freshness/provenance complete
/analyze: writer canonico fuori dal gate live
/snapshot: stesso percorso via redirect
bootstrap wording: stale
real PBP validation artifact: insufficiente
verification paths: parzialmente stale

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: critica
```

La regola da preservare è:

```text
nessun dato ambiguo
→ nessun contesto inventato
```

La regola da aggiungere è:

```text
nessuna assunzione sul payload provider
→ può essere promossa a "verificata"
→ finché non esiste evidence riproducibile
```

e, sul confine di persistenza:

```text
calcolare localContext
≠
avere automaticamente authority per scrivere un tick canonico
```
