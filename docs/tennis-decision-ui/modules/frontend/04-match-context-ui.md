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

**Implementato e coperto da test automatici; validazione live ancora aperta.**

Il backend calcola il `localContext`; il frontend ne valida versione, provenienza, shape e coerenza numerica, formatta le etichette e rende le sezioni disponibili.

I test automatici coprono mapping, view model e rendering di `MatchContextCard`.

Restano da verificare la resa e gli stati di indisponibilità su dati live reali.

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

L'authority numerica appartiene al backend. La validazione del contratto ricevuto e la formattazione per la presentazione appartengono a:

```txt
frontend/src/components/matchContextViewModel.js
```

Il componente riceve:

```txt
localContext
players
```

La card presenta il contenuto come contesto descrittivo calcolato sui dati SofaScore disponibili. Il calcolo è `project-calculated` nel backend.

## Contenuto visualizzato

Quando i dati sono disponibili, la card può mostrare:

```txt
punti nel match
→ ultimi tre game completati
→ differenza osservata rispetto al match
```

I termometri usano esclusivamente percentuali già calcolate dal backend.

La differenza osservata è descrittiva. Non rappresenta un trend, una previsione o un’indicazione operativa.

Il consumer verifica che punti e percentuali siano numeri finiti nei rispettivi intervalli e controlla le invarianti del producer:

```txt
homePct + awayPct = 100
homePoints + awayPoints = totalPoints
percentuali coerenti con i punti
```

Un payload incoerente degrada la sezione a unavailable. Il frontend non corregge, non esegue clamp e non ricalcola i valori da mostrare.

## Validazione della finestra recente

La sezione degli ultimi game è disponibile soltanto quando:

```txt
recent.available === true
recent.window.includedGames === 3
recent.window.excludedCurrentGame === true
recent.pointShare valido secondo i controlli frontend correnti
```

Una finestra con zero, uno o due game resta indisponibile anche quando il payload dichiara `recent.available === true`.

Il frontend non completa una finestra incompleta, non usa game più vecchi e non ricostruisce conteggi point-by-point.

Il gate verifica inoltre `kind: completed-games`, `requestedGames: 3` e la presenza di esattamente tre elementi in `games`.

## Availability per sezione

L'indisponibilità non è un interruttore globale della card:

```txt
localContext.available
→ disponibilità della point share del match

recent.available
→ disponibilità della finestra recente

comparison.available
→ disponibilità del confronto

dataQuality.level
→ qualità complessiva complete / partial / insufficient
```

Il frontend valuta le sezioni separatamente. Una sezione disponibile può quindi restare visibile mentre un'altra mostra il proprio stato indisponibile.

Quando una singola sezione non è disponibile, quella sezione non mostra:

```txt
barre
punti
percentuali
differenze
quote
```

Le reason `point_by_point_unavailable`, `insufficient_verified_completed_games` e `unsupported_or_ambiguous_score_transition` hanno un copy italiano nel view model. 

Il producer preserva `unsupported_or_ambiguous_score_transition` quando uno dei tre game candidati non è decodificabile; l'insufficienza numerica dei game resta distinta tramite `insufficient_verified_completed_games`.

Una reason diversa usa il fallback:

```txt
Dati recenti non disponibili.
```

L’assenza di dati resta un’informazione reale e non viene sostituita da valori sintetici.

## Confronto e `observedShift`

I delta percentuali sono calcolati dal backend e descrivono la differenza tra la finestra recente e l'intero match.

`observedShift === true` ha una semantica più stretta: indica che il lato con più punti è cambiato tra match e finestra recente. Non indica genericamente che le percentuali sono cambiate e non rappresenta momentum o trend.

Il consumer mostra il confronto soltanto quando match e recent sono validi, i due delta sono finiti, opposti e coerenti con le point share ricevute.

## Versione e provenienza del contratto

Il payload canonico dichiara:

```txt
version: 1
source: project-calculated
purpose: descriptive-match-context
```

Questi campi descrivono versione, provenienza e scopo e costituiscono il gate del consumer. Sono accettati soltanto `version: 1`, `source: project-calculated` e `purpose: descriptive-match-context`. Un contratto assente o diverso degrada in modo deterministico tutte le sezioni a unavailable.

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

La card non legge direttamente `dataQuality`; questo metadata resta disponibile nel read model backend ma non produce attualmente un badge o un gate globale UI.

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

La suite component-level monta la card e verifica rendering delle barre, attributi accessibili, copy di provenienza e degradazione di un contratto non supportato.

## Documenti collegati

* [Polling e view model](./02-live-polling-and-view-model.md)
* [Contesto locale e point-by-point](../sofa/02-local-context-and-point-by-point.md)
* [API Match](../../api/01-match.md)
