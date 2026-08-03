# Contesto locale e point-by-point

## Scopo

Questo modulo documenta il contesto descrittivo locale calcolato dai dati SofaScore.

```txt
payload SofaScore
→ normalizeSnapshot
→ snapshot con pointByPoint normalizzato
→ buildLocalContext
→ localContext
→ tick timeline SofaScore
```

`localContext` non è un segnale operativo, una previsione, una strategia o una fair odds.

## Stato

**Implementato, da validare su match reale.**

La copertura locale verifica normalizzazione, decoder point-by-point, finestra degli ultimi tre game, integrazione con analisi, tracking, bootstrap Source Identity e frontend.

Restano da validare live dati point-by-point reali, inclusi casi di indisponibilità o transizioni non supportate.

## Responsabilità

Il modulo:

* normalizza il payload point-by-point minimo;
* decodifica un game soltanto quando tutte le transizioni sono univoche;
* costruisce la finestra degli ultimi tre game completati;
* costruisce il contesto match, recente, comparativo e di qualità;
* mantiene indisponibili i dati non verificabili.

Non deve:

* inventare percentuali o fallback `50/50`;
* usare game parziali;
* saltare game ambigui per usare game più vecchi;
* calcolare break, pressure, trend, volatilità o segnali betting;
* modificare timeline, history, Source Identity o dati raw.

## Normalizzazione point-by-point

Il payload point-by-point ammesso contiene i campi minimi:

```txt
set
game
points
homePoint
awayPoint
```

Ogni record rappresenta lo stato dopo un punto.

Lo stato iniziale del game è implicito:

```txt
0-0
```

La normalizzazione verifica la struttura minima e conserva i token point-by-point come stringhe.

Il decoder supporta soltanto:

```txt
0
15
30
40
A
```

Deuce, vantaggio e ritorno a deuce sono decodificati soltanto quando ogni transizione osservata è univoca.

Tie-break numerici, token non supportati e transizioni ambigue non vengono decodificati. Se ricadono in uno dei tre game richiesti dalla finestra recente, recent resta indisponibile senza usare game più vecchi come sostituzione.

La normalizzazione strutturale non convalida subito la semantica dei token: il rifiuto avviene nel decoder del game.

## Decoder dei game

Il decoder considera concluso un game soltanto quando il suo ultimo stato consente di dedurre un vincitore senza ambiguità.

Il game con coppia `set` e `game` più alta viene sempre escluso perché può essere ancora in corso.

Tie-break numerici, token non osservati e transizioni ambigue restano indisponibili.

## Finestra ultimi tre game completati

La finestra recente segue queste regole:

```txt
ordinamento per set crescente, poi game crescente
→ esclusione del game corrente potenzialmente aperto
→ selezione degli esatti tre game immediatamente precedenti
→ validazione completa di tutti e tre i game
```

La sezione `recent` è disponibile soltanto quando:

```txt
includedGames === 3
excludedCurrentGame === true
```

Se uno dei tre game non è decodificabile, la finestra resta indisponibile.

Non vengono usati game più vecchi come sostituzione.

## Contratto localContext

`buildLocalContext(snapshot)` restituisce un contesto descrittivo che può contenere:

```txt
match
recent
comparison
dataQuality
```

`localContext.available` riflette soltanto la disponibilità di `match.pointShare`.

Può quindi essere `true` quando le statistiche `pointsTotal` sono valide ma `recent` e `comparison` restano indisponibili per point-by-point insufficiente o non decodificabile.

Per riconoscere un contesto completo, il consumer deve usare:

```txt
dataQuality.level === complete
```

dataQuality.sources.pointByPoint rappresenta la disponibilità della finestra recente verificata, non la sola presenza del payload point-by-point raw.

Il contesto top-level usa la disponibilità di `pointsTotal`; la qualità completa richiede anche una finestra recente valida.

### Match

`match.pointShare` usa esclusivamente la statistica SofaScore:

```txt
period: ALL
key: pointsTotal
```

Può includere:

```txt
homePoints
awayPoints
totalPoints
homePct
awayPct
leadingSide
```

Numeri e stringhe numeriche finite non negative sono validi.

Lo zero è valido; un totale uguale a zero rende il contesto indisponibile.

### Recent

`recent` descrive i punti degli ultimi tre game completati soltanto quando la finestra point-by-point è completa e verificabile.

Non usa conteggi parziali, valori sintetici o quote inventate.

### Comparison

`comparison` può esporre differenze percentuali osservate tra finestra recente e andamento complessivo del match.

`observedShift` è descrittivo: non rappresenta un trend, una previsione o un’indicazione operativa.

### Data quality

`dataQuality` rappresenta la disponibilità effettiva delle statistiche match e della finestra point-by-point.

Il contesto è completo soltanto quando sono disponibili sia le statistiche match necessarie sia una finestra recente valida.

## Persistenza e tracking

Il tracking costruisce `localContext` dopo `normalizeSnapshot`.

Il tick timeline SofaScore può contenere:

```txt
snapshot
localContext
```

`localContext` appartiene al tick SofaScore e non viene aggiunto alla history aggregata.

Il sample osservato dal Source Identity Gate resta limitato a:

```txt
snapshot
tournamentName
dateStr
```

`localContext` non viene aggiunto al sample del gate.

Durante il bootstrap Source Identity, `matchTracker.js` passa soltanto `sofaSample.snapshot`; `persistSofaTrackingSample(...)` calcola quindi `localContext` da quello snapshot prima della persistenza canonica.

## Confini e limiti intenzionali

Questo modulo non implementa:

```txt
tie-break numerici
token point-by-point non osservati
transizioni point-by-point ambigue
fallback numerici inventati
break
pressure
trend
volatilità
previsione
segnali betting
```

L’assenza o l’ambiguità dei dati resta esplicita.

## Verifica

```txt
node sofa/pointByPoint.test.mjs
node sofa/normalizeSnapshot.test.mjs
node sofa/localContext.test.mjs
node sofa/buildSofaAnalysis.test.mjs
node sofa/trackerUpdate.test.mjs
node sofa/matchHistory/sofaUpdates.test.mjs
node routes/match/analysisResponse.test.mjs
```

La validazione locale non sostituisce una verifica su payload point-by-point reale.

## Documenti collegati

* [Tracking live](./01-live-tracking.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
* [API Match](../../api/01-match.md)
* [Scraper SofaScore](../python/02-sofascore-scraper.md)
* [Validazione e rollback](../../operations/04-validation-and-rollback.md)
