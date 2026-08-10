# Contesto locale e point-by-point

## Scopo

`normalizePointByPoint()` normalizza la sorgente SofaScore; `buildRecentCompletedGamesWindow()` costruisce una finestra fail-closed; `buildLocalContext()` confronta point share complessiva e recente senza produrre segnali prescrittivi.

## Stato

Il contratto è implementato e coperto da test automatici. La semantica osservata del payload upstream resta separata in una validazione datata: il codice non presume che l'ultimo game sia quello corrente quando l'identità non è dimostrabile.

## Responsabilità

Questo owner definisce:

- normalizzazione strutturale del point-by-point;
- identità canonica di set e game;
- decodifica dei game completati supportati;
- calcolo della point share complessiva e recente;
- classificazione della qualità della derivazione;
- propagazione di `localContext` verso analisi e persistenza.

Non è owner del polling, del Source Identity Gate, della scrittura canonica o della presentazione frontend.

## Contratto PBP normalizzato

Una struttura disponibile contiene set ordinati, game ordinati e coppie `(set, game)` univoche. Set e game devono essere interi positivi. Game vuoti, duplicati, ordine regressivo, valori frazionari o identità corrente incoerente rendono il PBP unavailable.

I token ordinari supportati sono:

```text
0 15 30 40 A
```

Il decoder gestisce gioco regolare, deuce e advantage. Tie-break numerici o transizioni ambigue restano unsupported: non vengono reinterpretati.

## Game corrente e finestra recente

La coppia più alta non è automaticamente il game corrente. L’esclusione è autorizzata soltanto quando il PBP normalizzato contiene un’identità `currentGame` valida e presente nell’elenco.

```text
currentGame verificato
→ tre game immediatamente precedenti
→ excludedCurrentGame=true

currentGame assente o non verificabile
→ recent unavailable
→ reason=current_game_identity_unavailable
→ excludedCurrentGame=false
```

I tre game precedenti devono essere decodificabili come completati. Una singola transizione ambigua rende indisponibile l’intera finestra.

### Identità strutturale

`set` e `game` devono essere interi positivi e la coppia deve essere univoca. Duplicati, regressioni d'ordine, valori frazionari e riferimenti a un `currentGame` non presente rendono indisponibile la derivazione. Non viene selezionato arbitrariamente uno dei record in conflitto.

### Transizioni supportate

Il decoder ricostruisce punti soltanto da transizioni deterministiche di game regolari, deuce e advantage. Tie-break numerici, sequenze tronche e cambi di stato incompatibili non vengono approssimati: la finestra recente fallisce nel suo insieme con una reason strutturata.

## `pointsTotal`

La point share complessiva usa una sola statistica con:

```text
period=ALL
key=pointsTotal
```

Home e away devono essere conteggi interi non negativi, numerici o stringhe decimali senza frazione. Due record `ALL/pointsTotal`, valori frazionari, negativi, non finiti o non numerici producono `points_total_unavailable`. La coppia `0/0` è strutturalmente valida ma non permette una percentuale e resta unavailable.

## Data quality

`dataQuality.level` qualifica la completezza del calcolo:

```text
derivation_complete
derivation_partial
derivation_insufficient
```

Gli assi distinti restano espliciti:

```text
freshness=unknown
provenance=normalized_provider_payload
temporalAlignment=unknown
```

`derivation_complete` non dimostra freschezza, provenienza live verificata o allineamento temporale.

`localContext.available` è un riepilogo della disponibilità complessiva, non autorizza i consumer a ignorare l'availability delle singole sezioni. `match`, `recent` e `observedShift` devono essere letti con i rispettivi stati e reason.

## Output del contesto locale

Il risultato mantiene versione, purpose e provenienza della derivazione. La point share complessiva deriva esclusivamente da `ALL/pointsTotal`; la finestra recente deriva esclusivamente dai game completati verificati. `observedShift` è una differenza descrittiva fra le due quote, non causalità, previsione o raccomandazione.

Quando uno dei due lati non è calcolabile, il producer conserva la reason specifica e non sostituisce dati mancanti con zero. Un risultato parziale non viene promosso a derivazione completa.

## Bootstrap e persistenza

`updateSofa()` calcola `localContext` prima dell’osservazione Source Identity e lo passa come `persistenceData` opaco. Il matching Source Identity usa snapshot e identità dei giocatori, non `localContext`. La persistenza usa il contesto già calcolato; il ricalcolo è solo fallback quando il chiamante non lo fornisce.

`POST /api/match/analyze` e `/api/match/snapshot` sono compute-only. Restituiscono `snapshot` e `localContext`, ma non scrivono history, timeline o journal. La persistenza canonica resta nel tracking autorizzato dal gate e dalla session authority.

Il bootstrap riusa il medesimo `localContext` calcolato per la risposta e per `persistenceData`; non esegue un secondo calcolo salvo fallback esplicito del writer. `localContext` non partecipa al matching Source Identity e non può trasformare una sessione non autorizzata in writer.

Nella persistenza SofaScore, una variazione materiale di point-by-point o `localContext` può produrre un tick timeline anche quando la history aggregata non cambia. La decisione e il commit appartengono all'owner della persistenza SofaScore.

## Validazione

Le proprietà confermate e quelle ancora sconosciute sono registrate in [Validazione source contract PBP 2026-08-10](../../../validations/sofascore-point-by-point-source-contract-2026-08-10.md).

## Riferimenti implementativi

| Responsabilità           | Implementazione                                               |
| ------------------------ | ------------------------------------------------------------- |
| normalizzazione snapshot | `backend/src/sofa/normalizeSnapshot.js`                       |
| point-by-point           | `backend/src/sofa/pointByPoint.js`                            |
| contesto locale          | `backend/src/sofa/localContext.js`                            |
| analisi SofaScore        | `backend/src/sofa/buildSofaAnalysis.js`                       |
| fixture verificata       | `backend/src/sofa/fixtures/pointByPoint.verified.fixture.mjs` |

### Shape concettuale

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
    "window": { "requestedGames": 3, "includedGames": 3 },
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

La struttura segue `buildLocalContext()`. I valori sono esemplificativi; reason, percentuali e availability dipendono dalla derivazione effettiva.

## Verifica

```powershell
node backend/src/sofa/pointByPoint.test.mjs
node backend/src/sofa/localContext.test.mjs
node backend/src/sofa/normalizeSnapshot.test.mjs
node backend/src/sofa/buildSofaAnalysis.test.mjs
node backend/src/sofa/trackerUpdate/gateRouting.test.mjs
node backend/src/routes/match/analysisResponse.test.mjs
```

La matrice copre current game presente e assente, ordine, identità duplicate, ordinali non canonici, transizioni regolari/deuce/advantage, tie-break unsupported, `pointsTotal`, bootstrap e assenza di scritture da `/analyze`.

## Confini

Questo documento non certifica la freschezza della sorgente SofaScore, non definisce l'UI, non autorizza persistenza fuori dal tracking e non interpreta `observedShift` come segnale. Le assunzioni sul payload reale appartengono alla validazione storica collegata.

## Documenti collegati

- [Tracking live](./01-live-tracking.md)
- [API analisi e snapshot](../../api/match/03-analysis-and-snapshot.md)
- [Timeline e history](../storage/01-timelines-and-history.md)
