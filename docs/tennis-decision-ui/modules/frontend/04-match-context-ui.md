# Contesto punti UI

## Scopo

Questo modulo documenta la card frontend:

```txt
frontend/src/components/MatchContextCard.jsx
```

La card mostra un contesto descrittivo dei punti ricevuto dal backend tramite `localContext`.

```txt
timeline SofaScore
→ useMatchPolling
→ dashboard view model
→ MatchContextCard
```

Non è una strategia, una previsione, un segnale betting o una fair odds.

## Stato

**Implementato, da validare su match reale.**

La validazione locale copre mapping, view model e build frontend.

Restano da validare la resa su dati live reali e gli stati di indisponibilità osservati durante un match.

## Responsabilità

La card:

* mostra i punti complessivi del match quando disponibili;
* mostra gli ultimi tre game completati soltanto quando la finestra è valida;
* mostra la differenza osservata rispetto al match soltanto quando disponibile;
* usa i nomi giocatori ricevuti dallo snapshot;
* rappresenta esplicitamente dati non disponibili.

La card non deve:

* calcolare valori sportivi di punti, percentuali, differenze o lato in vantaggio; può soltanto validare i numeri ricevuti e formattare le etichette per la presentazione;
* interpretare point-by-point;
* ricostruire Evidence o Source Identity;
* creare fallback `50/50`;
* mostrare quote, barre, punti o percentuali inventate;
* derivare trend, previsioni, strategie o segnali betting.

## Flusso dati

`useMatchPolling(...)` conserva il payload ricevuto dal backend.

`mapBackendDataToDashboard(...)` richiede `backendData.snapshot`, inoltra `backendData.localContext` senza ricalcolarlo e usa `snapshot.players` per i nomi visualizzati.

Il flusso frontend è:

payload backend
→ useMatchPolling
→ useDashboardViewModel
→ mapBackendDataToDashboard
→ MatchContextCard

La validazione e la formattazione locale appartengono a:

```txt
frontend/src/components/matchContextViewModel.js
```

Il componente riceve:

```txt
localContext
players
```

## Contenuto visualizzato

Quando i dati sono disponibili, la card può mostrare:

```txt
punti nel match
→ ultimi tre game completati
→ differenza osservata rispetto al match
```

I termometri usano esclusivamente percentuali già calcolate dal backend.

La differenza osservata è descrittiva. Non rappresenta un trend, una previsione o un’indicazione operativa.

## Validazione della finestra recente

La sezione degli ultimi game è disponibile soltanto quando:

```txt
recent.window.includedGames === 3
recent.window.excludedCurrentGame === true
```

Una finestra con zero, uno o due game resta indisponibile anche quando il payload dichiara `recent.available === true`.

Il frontend non completa una finestra incompleta, non usa game più vecchi e non ricostruisce conteggi point-by-point.

## Stati non disponibili

Quando i dati non sono disponibili, la card non mostra:

```txt
barre
punti
percentuali
differenze
quote
```

Le reason `point_by_point_unavailable`, `insufficient_verified_completed_games` e `unsupported_or_ambiguous_score_transition` vengono tradotte in copy italiano semplice.

Una reason diversa usa il fallback:

```txt
Dati recenti non disponibili.
```

L’assenza di dati resta un’informazione reale e non viene sostituita da valori sintetici.

## Confini

`MatchContextCard` e `matchContextViewModel.js` non devono dipendere da:

```txt
scraper Python
browser
filesystem
timeline store
Source Identity store
Match Evidence builder
decoder point-by-point
```

La UI comunica soltanto tramite il view model e i payload già ricevuti dal backend.

## Verifica

```txt
node src/components/matchContextViewModel.test.mjs
node src/types/dashboard.test.mjs
npm run build
```

Verificare:

```txt
localContext inoltrato senza ricalcolo
→ finestra recente disponibile solo con tre game e game corrente escluso
→ nessun fallback numerico
→ nessuna percentuale inventata
→ stati non disponibili senza barre o valori fittizi
```

## Documenti collegati

* [Polling e view model](./02-live-polling-and-view-model.md)
* [Contesto locale e point-by-point](../sofa/02-local-context-and-point-by-point.md)
* [API Match](../../api/01-match.md)
