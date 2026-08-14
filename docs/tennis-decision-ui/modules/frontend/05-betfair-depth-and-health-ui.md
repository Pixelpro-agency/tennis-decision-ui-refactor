# Betfair Depth e health UI

## Scopo

Questo documento è l'owner dettagliato delle superfici frontend che presentano Betfair Depth, runner ladder, Money Flow, health e stato di lettura/persistenza Betfair.

La facade di orientamento resta [UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md). La presentazione di Market Reactions appartiene a `06-market-reactions-ui.md`; il lifecycle UI di Source Identity appartiene a `01-session-shell.md`.

## Componenti e responsabilità

| Componente o utility                  | Responsabilità                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `BetfairDepthCard.jsx`                | Seleziona il dato corrente o last-known, presenta stato della card, total matched di mercato, health banner, debug panel e runner. |
| `betfair/BetfairRunnerDepth.jsx`      | Presenta best back/lay, ladder scrollabile, total matched del runner e Money Flow.                                                 |
| `betfair/MoneyFlowChart.jsx`          | Disegna il volume abbinato nel tempo su griglia condivisa e gestisce il tooltip dell'osservazione.                                 |
| `betfair/BetfairHealthDebugPanel.jsx` | Espone in forma espandibile il sottoinsieme fisso di campi health previsto dalla UI.                                               |
| `BetfairHealthToast.jsx`              | Presenta il toast rosso di alert o logout Betfair e lo chiude automaticamente dopo otto secondi.                                   |
| `utils/betfairMoneyFlow.js`           | Costruisce la griglia temporale, allinea le serie e normalizza disponibilità e scala dei volumi.                                   |

`OverviewDashboard` passa alla card i dati e gli stati Betfair. `DashboardWorkspace` presenta inoltre il toast health e il banner globale di persistence degradata.

## Contratto della card

`BetfairDepthCard` riceve:

```txt
data
history
lastKnownHistory
health
healthTransition
persistenceViewState
readStatus
isPolling
trackingStopped
lastKnownData
sourceUpdatedAt
```

La card usa `data` quando disponibile. Può usare `lastKnownData` soltanto quando il dato corrente è assente, esiste un valore last-known e `readStatus` è `degraded` oppure `error`. In quel caso usa anche `lastKnownHistory` e presenta esplicitamente il dato come non corrente; `sourceUpdatedAt`, se presente, è mostrato accanto alla label.

La priorità di `getBetfairCardStateLabel()` è:

```txt
trackingStopped → Live tracking stopped
last-known visibile → Last known Betfair data — not current
persistenceViewState.status=degraded oppure readStatus=degraded → Persistence incomplete
readStatus=error → Unable to load current Betfair data
readStatus=waiting → Waiting for Betfair Exchange data
isPolling=true → Polling active
altro → Betfair polling inactive
```

Quando non esistono dati con `runners`, la card mostra un empty state. Se l'health corrente è `red`, l'empty state viene sostituito dall'alert Betfair con il messaggio health o di login disponibile e dall'invito a ripristinare la sessione Betfair. Il debug panel resta disponibile quando esiste `health`.

Quando i runner sono disponibili, la card presenta:

- il total matched di mercato;
- un banner health per gli stati `yellow`, `red` o `finished`;
- i timestamp dell'ultimo tick Betfair e dell'ultima ladder utile per gli stati non `finished`;
- il marker `New Betfair alert detected` sulla transizione `to-red`;
- il banner `Betfair data recovered` sulla transizione `recovered`, se lo stato corrente non è più `red` o `yellow`;
- il debug panel;
- una colonna per runner, due colonne da breakpoint `md`.

## Assenza e zero osservato

Le funzioni di formattazione preservano la distinzione tra dato assente e zero:

| Input                              | Price        | Amount / matched                                                |
| ---------------------------------- | ------------ | --------------------------------------------------------------- |
| `null`, `undefined`, stringa vuota | `—`          | `—` oppure stringa vuota nei soli segmenti grafici della ladder |
| zero osservato                     | `0.00`       | `0`                                                             |
| numero finito                      | due decimali | intero formattato                                               |
| valore non numerico                | `—`          | `—`                                                             |

`formatObservedPrice()` e `formatObservedAmount()` applicano il contratto ai runner e alla ladder. `formatMarketTotalMatched()` legge prima `market.totalMatched`, usa `market_info.total_matched` come fallback e aggiunge `EUR` soltanto a un valore numerico finito.

## Runner ladder

Ogni `BetfairRunnerDepth` presenta:

- nome del runner;
- best back e relativa size;
- best lay e relativa size;
- tabella con `Price`, `Unmatched (Back/Lay)` e `Matched (Total)`;
- total matched della selezione, letto da `totalMatchedOnSelection` con fallback a `matchedTotal`;
- Money Flow associato allo stesso `selectionId`.

La ladder usa `runner.ladder` oppure una lista vuota. Le quote presenti in `bookBack` e `bookLay` determinano l'evidenziazione delle prime tre posizioni: intensità maggiore per la prima quota e progressivamente minore per la seconda e la terza. I valori unmatched back/lay sono resi come barre contrapposte; il matched totale della riga usa una barra proporzionale al massimo traded osservato nella ladder corrente.

La tabella ha header separato e corpo verticalmente scrollabile. L'identità usata per associare il runner alla serie Money Flow è la rappresentazione stringa di `selectionId`; se `selectionId` manca, la card non associa alcuna history al runner.

## Money Flow

Il grafico presenta esclusivamente `matchedVolume` neutro; non attribuisce il volume a back o lay.

`buildSharedGrid()` raccoglie i timestamp unici di tutte le serie, li ordina, conserva gli ultimi 20 e aggiunge a sinistra gli slot vuoti necessari. `alignToGrid()` allinea ogni runner alla stessa griglia e crea osservazioni `emptySlot` dove non esiste un punto reale. Se la griglia condivisa non è fornita, il grafico usa direttamente gli ultimi 20 punti del runner.

La scala verticale è comune tra runner:

1. `BetfairDepthCard` calcola il massimo dei volumi visualizzabili di tutte le serie;
2. passa lo stesso `sharedMaxVal` a ogni `MoneyFlowChart`;
3. `getMoneyFlowAxisMax()` considera anche i volumi della serie corrente, impone un minimo di `100` EUR e arrotonda il massimo al centinaio superiore;
4. lo stesso massimo governa etichette dell'asse e altezza delle barre.

`getMatchedVolumeObservation()` distingue gli stati del tooltip:

| Stato del punto                   | Disponibilità   | Presentazione                                            |
| --------------------------------- | --------------- | -------------------------------------------------------- |
| `matchedVolume=0` finito e valido | disponibile     | tooltip `VOLUME ABBINATO: 0 EUR`, nessuna barra positiva |
| `matchedVolume>0` finito e valido | disponibile     | tooltip numerico e barra                                 |
| punto assente o `emptySlot`       | non disponibile | nessun tooltip numerico, nessuna barra                   |
| `invalidVolume=true`              | non disponibile | nessun tooltip numerico, nessuna barra                   |
| `anomaly=true`                    | non disponibile | nessun tooltip numerico, nessuna barra                   |
| `validForDisplay=false`           | non disponibile | nessun tooltip numerico, nessuna barra                   |
| valore non finito o negativo      | non disponibile | nessun tooltip numerico, nessuna barra                   |

Le etichette temporali sono distribuite su un massimo di cinque posizioni della serie. Il bordo sinistro rappresenta i dati più vecchi e quello destro il live.

## Health

La card non calcola lo stato health: riceve il modello già costruito a monte e ne presenta `status`, `message`, `reasons`, `timestamps`, `metrics` e `checks` pertinenti.

| Stato / transizione | Presentazione nella card                                    |
| ------------------- | ----------------------------------------------------------- |
| `yellow`            | warning con messaggio health e freshness disponibile        |
| `red`               | alert rosso; se disponibile usa il testo di login richiesto |
| `finished`          | stato `Betfair market finished` senza freshness del tick    |
| `to-red`            | marker di nuovo alert                                       |
| `recovered`         | banner di recupero quando health non è più rosso o giallo   |

`BetfairHealthToast` è separato dalla card e viene montato da `DashboardWorkspace`. Quando è visibile:

- usa il titolo `BETFAIR LOGOUT DETECTED` se `metrics.graphLoginRequired=true`, altrimenti `BETFAIR ALERT`;
- usa `graphLoginRequiredText` o `health.message` come dettaglio, con fallback statici;
- consente la chiusura manuale;
- invoca automaticamente `onDismiss()` dopo otto secondi.

La logica che decide quando mostrare il toast e l'eventuale alert audio resta esterna a questi componenti.

## Debug panel

`BetfairHealthDebugPanel` è assente se non riceve `health`; altrimenti è chiuso per default e può essere espanso dall'utente.

Il pannello legge esclusivamente una lista fissa di campi da:

```txt
health.status
health.message
health.reasons
health.timestamps
health.metrics
health.checks
```

Tra i valori presentati rientrano timestamp di scrape, tick, ladder, volume ed errore tecnico; age e contatori; flag di login/ladder/market/CDP; `graphLoginRequiredText`; `graphLoginRequiredUrl`.

Il componente non esegue redazione o validazione dell'URL: visualizza il valore ricevuto. Di conseguenza `graphLoginRequiredUrl` deve essere già redatto a monte. Cookie, token, header, target CDP e URL raw non fanno parte della lista dei campi renderizzati dal pannello.

## Stato di lettura e persistence presentation

`useBetfairJson` costruisce un modello atomico a ogni ciclo di lettura:

```txt
latest disponibile
→ data + health + moneyFlowHistory + sourceUpdatedAt

latest 404
→ fallback alla timeline JSON
→ data senza health e senza moneyFlowHistory

409 persistence_integrity
→ data corrente, health e moneyFlowHistory rimossi
→ integrity conservata
→ readStatus=degraded

altro errore
→ data corrente rimossa
→ readStatus=waiting per 404, altrimenti error
```

Ogni lettura riuscita aggiorna anche `lastKnownData` e `lastKnownMoneyFlowHistory`. Una lettura degradata o in errore non li sovrascrive; la card può quindi presentarli secondo il contratto last-known descritto sopra.

Health, persistence e stato di lettura rimangono assi distinti:

- `health` governa alert, banner health, toast e pannello diagnostico;
- `persistenceViewState` governa la presentation della persistenza degradata nella card e nel banner di workspace;
- `readStatus` dichiara se la lettura è `inactive`, `waiting`, `current`, `degraded` o `error`;
- Source Identity non viene ricostruita dalla card e il suo lifecycle resta fuori da questo owner.

La UI non mostra `commitId`, path di persistenza o stato del journal e non offre recovery client-side.

## Flusso presentazionale

```txt
useBetfairJson
→ current / last-known / unavailable
→ BetfairDepthCard
→ runner per selectionId
→ ladder + Money Flow su scala condivisa
→ health card/debug separati dalla persistence presentation
→ toast health e banner persistence nel workspace
```

| Condizione                            | Presentazione                                                   |
| ------------------------------------- | --------------------------------------------------------------- |
| lettura current con dati validi       | valori correnti                                                 |
| lettura degraded/error con last-known | label non corrente e timestamp sorgente disponibile             |
| campione Money Flow inutilizzabile    | nessun tooltip numerico e nessuna barra sintetica               |
| persistence degradata                 | warning distinto dallo stato health                             |
| dati assenti                          | empty state, senza trasformare l'assenza in quote o matched `0` |

## Riferimenti implementativi

```text
frontend/src/components/BetfairDepthCard.jsx
frontend/src/components/betfair/BetfairRunnerDepth.jsx
frontend/src/components/betfair/MoneyFlowChart.jsx
frontend/src/components/betfair/BetfairHealthDebugPanel.jsx
frontend/src/components/BetfairHealthToast.jsx
frontend/src/components/OverviewDashboard.jsx
frontend/src/components/DashboardWorkspace.jsx
frontend/src/hooks/useBetfairJson.js
frontend/src/utils/betfairMoneyFlow.js
```

## Verifica

Da `frontend/`:

```bash
npm.cmd run test:components
node src/utils/betfairMoneyFlow.test.mjs
node src/hooks/useBetfairJson.test.mjs
npm.cmd run build
```

`frontendComponents.test.jsx` verifica per quest'area:

- scala normalizzata del Money Flow;
- distinzione tra zero osservato e volume non disponibile;
- distinzione tra valori mancanti e zero in runner e ladder;
- label di lifecycle e presentazione last-known della card;
- rendering del campo `graphLoginRequiredUrl` ricevuto dal debug panel.

`betfairMoneyFlow.test.mjs` verifica griglia a 20 slot, ordinamento e padding, allineamento, disponibilità del volume e massimo dell'asse. `useBetfairJson.test.mjs` verifica timestamp, normalizzazione della timeline, riconoscimento del `409 persistence_integrity`, modello atomico del fallback timeline e fallback da latest 404.

## Collegamenti

- [Facade UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md)
- [Polling e view model](./02-live-polling-and-view-model.md)
- [Session shell e Source Identity](./01-session-shell.md)
- [Market Reactions UI](./06-market-reactions-ui.md)
- [API Betfair](../../api/02-betfair.md)
- [Validità tecnica dei campioni](../betfair/02-technical-sample-validity.md)
