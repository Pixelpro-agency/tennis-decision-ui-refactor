# Contesto locale e point-by-point

## Scopo

Questo modulo documenta il contesto descrittivo locale calcolato dai dati SofaScore e il decoder point-by-point che alimenta la finestra recente.

```text
payload SofaScore
→ normalizeSnapshot()
→ pointByPoint normalizzato
→ buildRecentCompletedGamesWindow()
→ buildLocalContext()
→ localContext
→ risposta di analisi o tick timeline SofaScore autorizzato
```

`localContext` confronta la point share complessiva del match con quella degli ultimi tre game completati verificabili. Non è un segnale operativo, una previsione, una strategia, una fair odds o un'autorizzazione al trade.

## Stato

Il contratto è implementato e coperto da test automatici. Le proprietà riproducibili del payload point-by-point sono separate in una validazione datata e basata su fixture sanitizzata.

Il runtime non presume che l'ultima coppia `(set, game)` identifichi il game corrente. Senza un'identità corrente esplicita e valida, la finestra recente resta indisponibile.

## Responsabilità

Questo owner definisce:

- la normalizzazione strutturale del point-by-point;
- l'identità canonica di set e game;
- la decodifica dei game completati supportati;
- la finestra degli ultimi tre game completati verificati;
- la point share complessiva ricavata da `ALL/pointsTotal`;
- il confronto descrittivo fra contesto match e finestra recente;
- la classificazione della qualità della derivazione;
- la propagazione di `localContext` verso analisi e persistenza SofaScore.

Non è owner del polling, del Source Identity Gate, della scrittura canonica, della session authority o della presentazione frontend.

Il modulo non deve:

- inventare percentuali o fallback `50/50`;
- usare game parziali;
- saltare game ambigui per sostituirli con game più vecchi;
- interpretare tie-break numerici come score ordinario;
- calcolare break, pressure, momentum, trend, volatilità o confidence sintetiche;
- produrre segnali betting o raccomandazioni.

## Normalizzazione point-by-point

`normalizePointByPoint(rawPointByPoint)` accetta:

- un array di set; oppure
- un oggetto con `sets` e, facoltativamente, `currentGame`.

La struttura minima dei record è:

```text
set
games[]
game
points[]
homePoint
awayPoint
```

Una normalizzazione disponibile espone:

```json
{
  "available": true,
  "reason": null,
  "semantics": {
    "source": "home-away-point-transitions",
    "representation": "after-point"
  },
  "sets": [],
  "currentGame": null
}
```

Ogni punto conserva `homePoint` e `awayPoint` come stringhe. Lo stato registrato rappresenta il punteggio dopo il punto; lo stato iniziale `0-0` è implicito nel decoder.

### Identità e ordine

Gli ordinali `set` e `game` devono essere interi positivi. I set devono arrivare in ordine strettamente crescente e, all'interno di ogni set, anche i game devono essere strettamente crescenti. Ogni coppia `(set, game)` deve essere univoca nell'intera struttura.

Rendono il point-by-point indisponibile:

- set o game non canonici, inclusi zero, valori negativi e frazionari;
- regressioni o duplicati nell'ordine di set e game;
- `games` o `points` non rappresentati come array;
- game con `points` vuoto;
- punti privi di `homePoint` o `awayPoint` stringa;
- `currentGame` non canonico o non presente fra le coppie normalizzate.

In questi casi il risultato fail-closed è:

```json
{
  "available": false,
  "reason": "point_by_point_unavailable",
  "semantics": null,
  "sets": []
}
```

La normalizzazione verifica forma, identità e ordine, ma non decodifica ancora la semantica di ogni transizione. I token non supportati vengono rifiutati dal decoder quando il game deve essere ricostruito.

### Identità del game corrente

Quando l'input è il solo array di set, `currentGame` è `null`. Quando l'input è un oggetto, l'identità corrente viene conservata soltanto se `set` e `game` sono interi positivi e la coppia esiste nella struttura normalizzata.

La coppia massima non viene promossa automaticamente a game corrente.

## Decoder dei game completati

`decodeCompletedGame(game)` ricostruisce il vincitore di ogni punto a partire dallo stato implicito `0-0` e dalle transizioni osservate dopo ciascun punto.

I token ordinari supportati sono:

```text
0 15 30 40 A
```

Sono supportati gioco regolare, deuce, advantage e ritorno a deuce. Ogni stato osservato deve corrispondere a una sola transizione possibile dallo stato precedente.

Il winning point non è presente come nuovo stato nel game: viene inferito soltanto quando, dopo l'ultimo stato osservato, esiste un unico esito terminale possibile. Il decoder restituisce quindi anche il winning point nella sequenza `winners` e nei conteggi finali.

Il game resta indisponibile con reason `unsupported_or_ambiguous_score_transition` quando incontra, fra gli altri casi:

- token non supportati;
- `A-A`;
- salti di punteggio;
- stati incompatibili con la transizione precedente;
- sequenze tronche;
- chiusura non deducibile in modo univoco;
- tie-break con score numerico.

Non vengono effettuate approssimazioni o correzioni del payload.

## Finestra degli ultimi tre game completati

`buildRecentCompletedGamesWindow(pointByPoint)` lavora esclusivamente su un point-by-point disponibile e su una `currentGame` verificata.

```text
flatten dei game
→ ordinamento per set crescente e game crescente
→ ricerca della currentGame verificata
→ selezione dei tre game immediatamente precedenti
→ decodifica completa di tutti e tre
→ aggregazione di punti e percentuali
```

La coppia più alta non è automaticamente esclusa. L'esclusione del game corrente è autorizzata soltanto dall'identità esplicita presente nel PBP normalizzato.

```text
currentGame verificata e almeno tre predecessori
→ tre game immediatamente precedenti
→ includedGames=3
→ excludedCurrentGame=true

currentGame assente
→ available=false
→ reason=current_game_identity_unavailable
→ excludedCurrentGame=false
```

Se esistono meno di tre predecessori, la reason è `insufficient_verified_completed_games`. Se uno dei tre game selezionati non è decodificabile, l'intera finestra fallisce con la reason del decoder; game più vecchi non vengono usati come sostituti.

Una finestra disponibile espone:

- le identità `{ set, game }` dei tre game inclusi;
- `homePoints`, `awayPoints` e `totalPoints`;
- `homePct` e `awayPct`, arrotondate a una cifra decimale;
- `leadingSide` con valore `home`, `away` o `level`.

## Point share complessiva: `ALL/pointsTotal`

La sezione `match.pointShare` usa esclusivamente una singola statistica normalizzata con:

```text
period=ALL
key=pointsTotal
```

`homeValue` e `awayValue` devono essere interi non negativi rappresentati come numeri safe integer o stringhe decimali composte soltanto da cifre. Valori frazionari, negativi, non finiti, non numerici o più record `ALL/pointsTotal` producono `points_total_unavailable`.

La coppia `0/0` supera la validazione dei conteggi, ma non permette il calcolo di percentuali: `match.pointShare` resta indisponibile con la stessa reason.

Quando disponibile, la sezione espone:

```text
basis=statistics.ALL.pointsTotal
homePoints
awayPoints
totalPoints
homePct
awayPct
leadingSide
```

## Contratto `localContext`

`buildLocalContext(snapshot)` restituisce sempre una struttura versionata:

```json
{
  "version": 1,
  "source": "project-calculated",
  "purpose": "descriptive-match-context",
  "available": true,
  "match": {
    "pointShare": { "available": true }
  },
  "recent": {
    "available": true,
    "window": {
      "kind": "completed-games",
      "requestedGames": 3,
      "includedGames": 3,
      "excludedCurrentGame": true,
      "games": []
    },
    "pointShare": { "available": true }
  },
  "comparison": {
    "available": true,
    "observedShift": false
  },
  "dataQuality": {
    "level": "derivation_complete",
    "freshness": "unknown",
    "provenance": "normalized_provider_payload",
    "temporalAlignment": "unknown"
  }
}
```

La shape è concettuale: percentuali, conteggi, reason, identità dei game e stati di availability dipendono dalla derivazione effettiva.

### Availability

`localContext.available` coincide esclusivamente con `match.pointShare.available`. Può quindi essere `true` anche quando `recent` e `comparison` sono indisponibili.

I consumer devono leggere separatamente:

- `match.pointShare.available`;
- `recent.available`;
- `comparison.available`;
- `dataQuality.level` e le relative reason.

I dati mancanti restano `null`; non vengono sostituiti con zero o percentuali sintetiche.

### Match

`match.pointShare` rappresenta la distribuzione dei punti complessivi del match sulla sola base `statistics.ALL.pointsTotal`.

### Recent

`recent` rappresenta esclusivamente i punti dei tre game immediatamente precedenti la `currentGame` verificata. Se la finestra non è disponibile, `window` e `pointShare` sono `null` e la reason resta esplicita.

### Comparison

`comparison` è disponibile soltanto quando lo sono sia `match.pointShare` sia `recent.pointShare`. Espone:

- `homeDeltaPctPoints`;
- `awayDeltaPctPoints`;
- `observedShift`.

I delta sono differenze, in punti percentuali, fra point share recente e complessiva. `observedShift` è `true` soltanto quando il leader complessivo e quello recente sono entrambi `home` o `away` e risultano diversi. Un pareggio non viene trattato come cambio di leader.

Questi valori descrivono una differenza osservata; non stabiliscono causalità, trend, previsione o raccomandazione.

### Data quality

`dataQuality.level` qualifica la completezza della derivazione:

| Livello                   | Statistica match | Finestra PBP recente        |
| ------------------------- | ---------------- | --------------------------- |
| `derivation_complete`     | disponibile      | disponibile                 |
| `derivation_partial`      | disponibile      | indisponibile               |
| `derivation_insufficient` | indisponibile    | disponibile o indisponibile |

Gli assi separati restano sempre espliciti:

```text
freshness=unknown
provenance=normalized_provider_payload
temporalAlignment=unknown
```

`dataQuality.sources.statistics` riflette la disponibilità della point share match. `dataQuality.sources.pointByPoint` riflette la disponibilità della finestra recente verificata, non la sola presenza del payload PBP raw. `dataQuality.reasons` conserva le cause della derivazione parziale o insufficiente.

Anche `derivation_complete` non dimostra freschezza, provenienza live verificata o allineamento temporale fra endpoint.

## Analisi, tracking e persistenza

### Analisi compute-only

`buildSofaAnalysis()` carica event, statistics e point-by-point, costruisce lo snapshot normalizzato e calcola `localContext` una sola volta per il risultato dell'analisi.

`POST /api/match/analyze` restituisce:

```json
{
  "snapshot": {},
  "localContext": {}
}
```

`POST /api/match/snapshot` effettua un redirect `307` verso `/api/match/analyze`. Entrambe le route sono compute-only: non scrivono history, timeline o journal.

### Tracking e Source Identity

Nel tracking, `updateSofa()` normalizza lo snapshot e calcola `localContext` prima di osservare il Source Identity Gate.

Il sample usato dal gate contiene soltanto:

```text
snapshot
tournamentName
dateStr
```

`localContext` viene passato separatamente come persistence data:

```json
{
  "localContext": {}
}
```

Non partecipa quindi al matching Source Identity e non può autorizzare una scrittura. Se l'azione del gate non è `persist-current`, `updateSofa()` non invoca il writer e restituisce un envelope `sofa_commit` con stato `unchanged` e warning `source_identity_gate:<action>`.

### Bootstrap e writer

Quando il gate apre la registrazione, `persistBootstrapTrackingSamples()` passa alla persistenza SofaScore:

```json
{
  "snapshot": {},
  "localContext": {}
}
```

`persistSofaTrackingSample()` usa il `localContext` ricevuto. Lo ricalcola da `snapshot` soltanto come fallback quando il chiamante non lo fornisce.

La persistenza canonica appartiene al tracking autorizzato dal gate e dalla session authority. Il tick timeline SofaScore contiene `snapshot` e `localContext`; `localContext` non viene invece aggiunto alle righe della history aggregata. La decisione di scrittura e il commit appartengono all'owner della persistenza SofaScore. `localContext` non viene aggiunto al sample Source Identity.

## Validazione del source contract

Le proprietà confermate dalla fixture e quelle non dimostrate sono registrate in [Validazione source contract PBP 2026-08-10](../../../validations/sofascore-point-by-point-source-contract-2026-08-10.md).

La validazione conferma la rappresentazione after-point, i token ordinari, deuce e advantage, e il carattere unsupported del tie-break numerico osservato. Non certifica che il game corrente sia sempre presente, che l'ordine e l'unicità siano garantiti dal provider, né freshness o allineamento temporale live.

## Riferimenti implementativi

| Responsabilità                | Implementazione                                               |
| ----------------------------- | ------------------------------------------------------------- |
| normalizzazione snapshot      | `backend/src/sofa/normalizeSnapshot.js`                       |
| normalizzazione e decoder PBP | `backend/src/sofa/pointByPoint.js`                            |
| contesto locale               | `backend/src/sofa/localContext.js`                            |
| analisi SofaScore             | `backend/src/sofa/buildSofaAnalysis.js`                       |
| tracking e propagazione       | `backend/src/sofa/trackerUpdate.js`                           |
| bootstrap                     | `backend/src/sofa/matchTracker.js`                            |
| risposta compute-only         | `backend/src/routes/match/analysisResponse.js`                |
| routing analisi/snapshot      | `backend/src/routes/match.js`                                 |
| fixture verificata            | `backend/src/sofa/fixtures/pointByPoint.verified.fixture.mjs` |

## Verifica

```powershell
node backend/src/sofa/pointByPoint.test.mjs
node backend/src/sofa/localContext.test.mjs
node backend/src/sofa/normalizeSnapshot.test.mjs
node backend/src/sofa/buildSofaAnalysis.test.mjs
node backend/src/sofa/trackerUpdate/gateRouting.test.mjs
node backend/src/routes/match/analysisResponse.test.mjs
```

La matrice copre:

- current game presente, assente o invalido;
- ordine canonico e identità duplicate;
- ordinali non canonici;
- transizioni regolari, deuce e advantage;
- tie-break numerico unsupported;
- finestra completa, insufficiente o ambigua;
- unicità e dominio di `ALL/pointsTotal`;
- livelli di data quality;
- propagazione separata del `localContext` nel gate e nel bootstrap;
- assenza di scritture canoniche da `/analyze`.

## Confini e limiti intenzionali

Questo documento non certifica:

```text
freshness della sorgente SofaScore
allineamento temporale fra endpoint
presenza costante del game corrente
semantiche live non archiviate nella fixture
tie-break numerici
token point-by-point non osservati
transizioni point-by-point ambigue
```

Non definisce l'interfaccia frontend, non autorizza persistenza fuori dal tracking e non interpreta `comparison` o `observedShift` come segnali.

## Documenti collegati

- [Tracking live](./01-live-tracking.md)
- [API analisi e snapshot](../../api/match/03-analysis-and-snapshot.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
