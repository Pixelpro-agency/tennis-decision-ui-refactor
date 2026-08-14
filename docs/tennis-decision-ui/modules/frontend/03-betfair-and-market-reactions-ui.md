# UI Betfair e Market Reactions

## Scopo

Questo documento è la facade delle superfici frontend dedicate a Betfair Depth, Money Flow, Betfair Health e Market Reactions.

Definisce i confini comuni tra i relativi owner e il modo in cui la shell compone read model già classificati. I contratti dettagliati appartengono a:

- [Betfair Depth e health UI](./05-betfair-depth-and-health-ui.md), per Depth, ladder runner, Money Flow, health e presentazione della persistence Betfair;
- [Market Reactions UI](./06-market-reactions-ui.md), per availability, reasons, persistence Evidence e rendering delle osservazioni Market-led e Field-led;
- [Sessione e shell frontend](./01-session-shell.md), per il lifecycle UI di Source Identity;
- [Polling e view model](./02-live-polling-and-view-model.md), per polling, current/last-known, request safety e timestamp.

Il frontend visualizza read model prodotti dal backend e normalizzati dagli hook. Non produce Evidence, non ricostruisce journal o recovery e non attribuisce causalità alle osservazioni.

## Mappa delle superfici

| Superficie           | Ingresso frontend                                             | Responsabilità presentazionale                                                           | Owner dettagliato                                                |
| -------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Betfair Depth        | `useBetfairJson()` e view model dashboard                     | Mostrare quote, ladder, total matched, Money Flow e stati current/last-known             | [Betfair Depth e health UI](./05-betfair-depth-and-health-ui.md) |
| Betfair Health       | health ricevuta dal read model Betfair                        | Mostrare stato, transizioni, toast, audio e diagnostica read-only                        | [Betfair Depth e health UI](./05-betfair-depth-and-health-ui.md) |
| Persistence Betfair  | `integrity`, `readStatus` e `persistenceViewState`            | Mostrare degradazione separata dalla health e mantenere esplicito l'eventuale last-known | [Betfair Depth e health UI](./05-betfair-depth-and-health-ui.md) |
| Market Reactions     | `useMarketReactionEvidence()`                                 | Mostrare availability, reasons e osservazioni descrittive già costruite                  | [Market Reactions UI](./06-market-reactions-ui.md)               |
| Persistence Evidence | `integrity`, `sources`, `persistenceComplete` e `readStatus`  | Mostrare un avviso separato senza ricostruire lo stato nel client                        | [Market Reactions UI](./06-market-reactions-ui.md)               |
| Source Identity      | `useSourceIdentityGateStatus()` e `useSourceIdentityGateUi()` | Governare gate, waiting screen, sidebar, modale e toast nella shell                      | [Sessione e shell frontend](./01-session-shell.md)               |

## Composizione corrente

```txt
useBetfairJson
→ App.jsx
→ persistenceViewState + dashboard view model
→ OverviewDashboard
→ BetfairDepthCard

useMarketReactionEvidence
→ App.jsx
→ MarketReactionsPage

useSourceIdentityGateStatus
→ useSourceIdentityGateUi
→ shell, sidebar, waiting screen, modale e toast
```

`App.jsx` conserva distinti i flussi Betfair, Evidence e Source Identity. La facade non assegna a una superficie la responsabilità di ricostruire lo stato posseduto da un'altra.

## Confini comuni

### Health, persistence, freshness e Source Identity

Questi assi non sono intercambiabili:

| Asse                    | Significato nella UI                                                 | Non implica                                           |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| Health Betfair          | Stato tecnico della sorgente e delle osservazioni Betfair            | Integrità della persistenza o identità dei runner     |
| Persistence integrity   | Completezza dei documenti canonici necessari alla lettura            | Logout, freshness o stato del mercato                 |
| Freshness e read status | Correnza, attesa, degradazione, errore o uso esplicito di last-known | Causa tecnica specifica non dichiarata dal read model |
| Source Identity         | Allineamento tra identità SofaScore e Betfair e relativo gate UI     | Health Betfair o completezza della persistenza        |

La UI presenta queste classificazioni senza fonderle e senza convertirne una nell'altra.

### Current e last-known

Il read model Betfair mantiene separati dato corrente e ultimo dato noto. Quando la lettura corrente è degradata o in errore, `BetfairDepthCard` può mostrare il last-known soltanto con una label non-current e con il timestamp sorgente disponibile.

Il fallback Betfair da `/latest` a `/json` produce un modello atomico: non combina un dato nuovo con health o history appartenenti a una lettura precedente.

Market Reactions non ricostruisce un proprio last-known. La pagina presenta lo snapshot corrente, gli stati di caricamento o errore e le reasons ricevute dall'hook.

### Persistence presentation

`useBetfairJson()` conserva `integrity` e `readStatus`; `App.jsx` li integra nello stato persistence comune e inoltra alla card Betfair lo stato necessario alla presentazione.

`useMarketReactionEvidence()` conserva il wrapper utile alla pagina:

```txt
latest
marketReactionEvidence
sources
integrity
latest.dataQuality.persistenceComplete
sourceUpdatedAt
fetchedAt
readStatus
```

Con `readStatus=degraded` o `persistenceComplete=false`, `MarketReactionsPage` mostra un avviso persistence separato. Il frontend non riabilita un ramo Evidence dichiarato non disponibile e non espone `commitId`, path, contenuti journal o controlli di recovery.

## Invarianti interpretativi

### Money Flow

Il Money Flow rappresenta esclusivamente volume abbinato osservato e non direzionale.

```txt
matchedVolume valido e positivo
→ barra neutra sopra lo zero

zero reale e valido
→ osservazione disponibile con valore 0, senza barra

empty, invalidVolume, anomaly o dato non visualizzabile
→ nessuna barra e nessun valore numerico osservato
```

La UI non trasforma il volume in direzione Back/Lay, WOM, pressure, intenzione del trader, segnale o raccomandazione. L'identità tecnica della serie è `selectionId`; il nome del runner è soltanto una label.

### Market Reactions

La UI preserva il contratto:

```txt
temporal proximity only
causalityClaimed: false
```

Market Reactions descrive osservazioni temporalmente prossime. Non costituisce causa certa, segnale di trading, raccomandazione, prova di intenzione o indicazione sul vincitore. Availability e reasons ricevute dal backend prevalgono sulla disponibilità visuale dei singoli campi.

## Confine Source Identity

`MarketReactionsPage` non determina gli stati `collecting`, `pending`, `recording` o `mismatch`. Il lifecycle globale resta nella shell:

```txt
useSourceIdentityGateStatus
→ useSourceIdentityGateUi
→ sidebar, waiting screen, modale e toast
```

La modale di conferma è collegata alla navigazione Market Reactions, ma non trasferisce l'ownership del gate alla pagina. `SourceIdentityControls.jsx` resta un componente legacy prop-driven e non è una seconda autorità globale.

## Confine overview e viste legacy

`OverviewDashboard.jsx` compone Match Context, Key Stats, Betfair Depth e il placeholder TOT manuale. `MatchOverviewBar` appartiene alla shell.

Le viste Strategy legacy `lay`, `banca` e `superbreak` sono deprecate. Market Reactions e Match Evidence non appartengono a tale deprecazione.

## Verifica

La copertura pertinente è distribuita tra gli owner derivati:

```txt
frontend/src/utils/betfairMoneyFlow.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/hooks/useMarketReactionEvidence.test.mjs
frontend/src/components/marketReactions/marketReactionViewModel.test.mjs
frontend/src/components/frontendComponents.test.jsx
```

I test verificano, tra gli altri contratti, scala e osservabilità del Money Flow, distinzione null/zero, fallback Betfair atomico, lifecycle e last-known della card, URL diagnostico redatto e degradazione persistence separata in Market Reactions.

Comandi di verifica degli owner:

```bash
node frontend/src/utils/betfairMoneyFlow.test.mjs
node frontend/src/hooks/useBetfairJson.test.mjs
node frontend/src/hooks/useMarketReactionEvidence.test.mjs
node frontend/src/components/marketReactions/marketReactionViewModel.test.mjs
npm.cmd --prefix frontend run test:components
npm.cmd --prefix frontend run build
python scripts/check_documentation_links.py
python scripts/check_registry_consistency.py
```

## Documenti collegati

- [Sessione e shell frontend](./01-session-shell.md)
- [Polling e view model](./02-live-polling-and-view-model.md)
- [Contesto punti UI](./04-match-context-ui.md)
- [Betfair Depth e health UI](./05-betfair-depth-and-health-ui.md)
- [Market Reactions UI](./06-market-reactions-ui.md)
- [Match Evidence Snapshot](../evidence/01-match-evidence-snapshot.md)
- [Source Identity](../evidence/02-source-identity.md)
- [Market Reactions](../evidence/04-market-reactions.md)
- [API Betfair](../../api/02-betfair.md)
- [API Evidence](../../api/03-evidence.md)
