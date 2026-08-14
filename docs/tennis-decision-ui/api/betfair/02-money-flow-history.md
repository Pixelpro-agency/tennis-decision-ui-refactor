# API Betfair — Money Flow History

## Scopo

`moneyFlowHistory` è il read model Money Flow incluso nella risposta di:

```txt
GET /api/betfair/:eventId/latest
```

Il suo perimetro è limitato alla costruzione delle serie storiche non direzionali per runner. Non possiede i contratti di `health`, `integrity`, `/json`, log o login-window.

Il payload `latest` seleziona i tick Betfair validi, conserva al massimo gli ultimi venti e passa quella finestra al builder delle serie:

```txt
timeline Betfair
→ tick validi
→ ultimi 20
→ moneyFlowHistory.series
```

La definizione di validità tecnica del campione appartiene al livello Betfair precedente al read model; `moneyFlowHistory` non la ricalcola.

## Finestra temporale

La finestra viene costruita con gli ultimi venti tick restituiti dalla selezione dei tick Betfair validi.

Il `previousTick` usato per i delta computed è il tick immediatamente precedente **dentro questa finestra**. Di conseguenza:

- il primo tick della finestra non ha un `previousTick`;
- per quel primo tick i delta computed non sono disponibili;
- un eventuale delta raw già presente nel tick può comunque essere usato;
- i tick validi più vecchi esclusi dalla finestra non vengono usati per calcolare il delta computed del primo tick incluso.

Ogni serie contiene un point soltanto per i tick della finestra nei quali compare un runner con `selectionId` valido. Il read model non aggiunge slot vuoti o padding.

## Shape del read model

La shape top-level è:

```json
{
  "series": [
    {
      "selectionId": "<selectionId>",
      "name": "<runner>",
      "points": []
    }
  ]
}
```

Ogni serie è identificata da `selectionId`; `name` è un'etichetta aggiornata e non partecipa all'identità.

## Identità delle serie

`selectionId` viene normalizzato prima di costruire o cercare una serie.

| Input                               | Normalizzazione                            |
| ----------------------------------- | ------------------------------------------ |
| numero finito                       | conversione a stringa                      |
| stringa                             | `trim()`; la stringa vuota viene rifiutata |
| numero non finito                   | rifiutato                                  |
| altri tipi, `null` o valore assente | rifiutati                                  |

Regole di continuità:

```txt
stesso selectionId normalizzato
→ stessa serie

stesso selectionId con nome aggiornato
→ stessa serie e name aggiornato

stesso nome con selectionId diverso
→ serie separate

runner senza selectionId valido
→ escluso dal read model
```

Alla prima apparizione della serie, un nome stringa non vuoto viene usato come `name`; in assenza di un nome utilizzabile il fallback è `Selection <selectionId>`. Una successiva apparizione dello stesso `selectionId` con un nome stringa non vuoto aggiorna il nome della serie.

## Shape dei point

Ogni point costruito dal read model contiene le stesse chiavi:

```js
{
  timestamp,
  matchedVolume,
  runnerMatchedDelta,
  marketMatchedDelta,
  ladderTradedDelta,
  reason,
  validationReasons,
  seq,
  graphHealth,
  ladderSource,
  volumeDetected,
  validForDisplay,
  invalidVolume,
  anomaly
}
```

| Campo                | Origine / significato                                                 |
| -------------------- | --------------------------------------------------------------------- |
| `timestamp`          | `tick.timestamp` quando è una stringa, altrimenti stringa vuota       |
| `matchedVolume`      | volume runner non direzionale esposto al consumer                     |
| `runnerMatchedDelta` | delta runner selezionato e arrotondato a due decimali, oppure `null`  |
| `marketMatchedDelta` | delta mercato selezionato e arrotondato a due decimali, oppure `null` |
| `ladderTradedDelta`  | `moneyFlow.ladderTradedDelta` se numero finito, altrimenti `null`     |
| `reason`             | reason conservata o reason canonica prodotta dalla validazione        |
| `validationReasons`  | dettagli testuali della condizione di validazione rilevata            |
| `seq`                | `data.seq` se numero finito, altrimenti `null`                        |
| `graphHealth`        | `data.graphHealth.status`, oppure `null`                              |
| `ladderSource`       | `runner.ladderSource`, oppure `null`                                  |
| `volumeDetected`     | `true` soltanto quando `matchedVolume > 0`                            |
| `validForDisplay`    | indica che il point può essere usato come volume dashboard            |
| `invalidVolume`      | indica un volume invalidato                                           |
| `anomaly`            | indica che la validazione ha rilevato un'anomalia                     |

## Delta raw e computed

Per runner e mercato il read model distingue il delta raw già presente nel tick dal delta computed ricavabile dai total matched.

| Delta           | Sorgente                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| raw runner      | `runner.moneyFlow.runnerDelta`, solo se numero finito                                                              |
| raw market      | `runner.moneyFlow.marketDelta`, solo se numero finito                                                              |
| computed runner | `runner.matchedTotal - previousRunner.matchedTotal`, se entrambi finiti e con lo stesso `selectionId` normalizzato |
| computed market | `tick.data.market.totalMatched - previousTick.data.market.totalMatched`, se entrambi finiti                        |

La selezione del delta effettivo avviene soltanto dopo la validazione:

```txt
raw non nullo e >= 0
→ usa raw

altrimenti computed non nullo e >= 0
→ usa computed

altrimenti
→ nessun delta selezionabile
```

La priorità è quindi raw → computed → assente. Il fallback computed non sostituisce un raw incoerente che sia già stato invalidato dal confronto raw/computed.

## Validazione

La validazione viene applicata prima di esporre `runnerMatchedDelta`, `marketMatchedDelta` e `matchedVolume`.

Le condizioni sono valutate nell'ordine seguente.

| Ordine | Condizione                                                                                   | Esito / reason                                             |
| ------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1      | `reason === matched_total_decreased`                                                         | invalido, `matched_total_decreased`                        |
| 2      | uno fra raw/computed runner/market è negativo                                                | invalido, reason corrente oppure `matched_total_decreased` |
| 3      | raw runner e computed runner sono entrambi presenti e uno vale `0` mentre l'altro è positivo | invalido, `runner_delta_raw_computed_mismatch`             |
| 4      | raw runner e computed runner sono entrambi presenti e divergono oltre la tolleranza          | invalido, `runner_delta_raw_computed_mismatch`             |
| 5      | raw market e computed market sono entrambi presenti e uno vale `0` mentre l'altro è positivo | invalido, `market_delta_raw_computed_mismatch`             |
| 6      | raw market e computed market sono entrambi presenti e divergono oltre la tolleranza          | invalido, `market_delta_raw_computed_mismatch`             |
| 7      | delta runner effettivo oltre delta mercato effettivo più tolleranza                          | invalido, `runner_delta_exceeds_market_delta`              |
| 8      | nessuna condizione precedente                                                                | valido                                                     |

La tolleranza raw/computed, applicata separatamente a runner e market quando entrambi i valori sono presenti, è:

```txt
max(1, 10% del maggiore valore assoluto fra raw e computed)
```

La divergenza invalida il point soltanto quando supera la tolleranza; una differenza uguale alla tolleranza resta accettata.

Il confronto runner/market usa i delta effettivi selezionati e, quando entrambi sono disponibili, applica:

```txt
max(1, 5% del valore assoluto del market delta effettivo)
```

Il point è invalido quando:

```txt
runner delta effettivo > market delta effettivo + tolleranza
```

La validazione termina alla prima condizione invalidante rilevata. `validationReasons` registra il dettaglio della condizione rilevata. Per i mismatch raw/computed e per `runner_delta_exceeds_market_delta`, `reason` usa la reason canonica della validazione; nel controllo dei delta negativi conserva invece una `reason` upstream già presente, se disponibile, e usa `matched_total_decreased` come fallback.

Una `reason` diversa da `matched_total_decreased` non rende da sola il point invalido.

## Output valido

Quando il point è valido:

```txt
runnerMatchedDelta
= delta runner selezionato, arrotondato a due decimali
  oppure null se nessun delta è disponibile

marketMatchedDelta
= delta market selezionato, arrotondato a due decimali
  oppure null se nessun delta è disponibile

matchedVolume
= runnerMatchedDelta se presente
  altrimenti 0

volumeDetected
= matchedVolume > 0
```

La validazione e le tolleranze operano sui valori non arrotondati; l'arrotondamento a due decimali viene applicato ai delta esposti soltanto dopo che il point è risultato valido.

Un point può quindi essere valido con `matchedVolume: 0` e `volumeDetected: false`.

## Output invalido

Quando una condizione invalidante viene rilevata:

```txt
runnerMatchedDelta: null
marketMatchedDelta: null
matchedVolume: 0
validForDisplay: false
invalidVolume: true
anomaly: true
```

`validationReasons` contiene il dettaglio diagnostico prodotto dalla validazione. `reason` contiene la reason canonica prodotta dai controlli che la assegnano esplicitamente; per un delta negativo può invece conservare una `reason` upstream già presente, con `matched_total_decreased` usato come fallback quando tale reason manca.

## Ladder, classificazione e direzione

La validità del volume dashboard non dipende direttamente da:

```txt
ladder assente
ladderSource non Graph
Back
Lay
classifiedVolume
```

Una ladder assente o non Graph può quindi accompagnare un `matchedVolume` valido quando i delta runner/market risultano coerenti secondo le regole del read model.

`ladderTradedDelta` e `ladderSource` restano campi osservativi del point, ma non determinano da soli `validForDisplay`.

Il read model è non direzionale e non espone:

```txt
back
lay
trend
confidence
classifiedVolume
unclassified
suppressedVolume
```

L'eventuale stato o reason di soppressione prodotto a monte non viene convertito in volume direzionale dal read model. Salvo le condizioni invalidanti descritte sopra, la sola presenza di una reason non forza l'invalidazione.

## Implementazione di riferimento

Il contratto è costruito principalmente da:

```txt
backend/src/routes/betfair/moneyFlowHistory.js
backend/src/routes/betfair/moneyFlowHistorySeries.js
```

La finestra degli ultimi venti tick validi e l'inclusione nel payload `/latest` sono definite in:

```txt
backend/src/routes/betfair/latestPayload.js
backend/src/routes/betfair.js
```

La normalizzazione di `selectionId` usata dalle serie è definita in:

```txt
backend/src/sofa/betfair/moneyFlow.js
```

Test di riferimento consultati per il contratto numerico e non direzionale:

```txt
backend/src/routes/betfair/moneyFlowHistorySeries.test.mjs
backend/src/sofa/betfairMoneyFlowValidation.test.mjs
```

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Letture, integrity e health](./01-read-integrity-and-health.md)
- [Validità tecnica dei campioni](../../modules/betfair/02-technical-sample-validity.md)
