# UI Betfair e Market Reactions

## Scopo

Questo modulo descrive la visualizzazione frontend di dati Betfair, health, Money Flow e Market Reactions.

I componenti visualizzano dati già classificati dal backend, dagli hook e dallo snapshot Evidence. Non producono Evidence, non interpretano causalità e non diventano owner di persistenza, journal o recovery.

Le API espongono persistence integrity, ma il wiring UI corrente è incompleto: gli hook SofaScore e Betfair conservano `integrity`, mentre `App.jsx`, `useDashboardViewModel(...)`, `BetfairDepthCard.jsx` e `MarketReactionsPage.jsx` non la ricevono ancora come prop dedicata.

## Betfair Depth

Struttura:

```txt
frontend/src/components/
├── BetfairDepthCard.jsx
├── BetfairHealthToast.jsx
└── betfair/
    ├── BetfairRunnerDepth.jsx
    ├── MoneyFlowChart.jsx
    └── BetfairHealthDebugPanel.jsx
```

| Componente                    | Responsabilità                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `BetfairDepthCard.jsx`        | Contenitore, stato vuoto, health, associazione runner tramite `selectionId`, griglia e scala condivise |
| `BetfairRunnerDepth.jsx`      | Ladder, Best Back, Best Lay, total matched e grafico neutro del runner                                 |
| `MoneyFlowChart.jsx`          | Barra neutra per tick e assenza di barra per slot invalidi, anomali o vuoti                           |
| `BetfairHealthDebugPanel.jsx` | Pannello espandibile di diagnostica health                                                             |
| `BetfairHealthToast.jsx`      | Toast per transizione health critica                                                                   |

`BetfairDepthCard.jsx` riceve attualmente:

```txt
data
history
health
healthTransition
```

Non riceve:

```txt
integrity
serverStatus persistence
persistenceComplete
```

Di conseguenza la card non mostra ancora uno stato persistence separato dalla health.

### Contratto history Money Flow

```txt
history.series[]
→ ogni elemento usa selectionId, name e points
→ BetfairDepthCard associa il runner con String(selectionId)
→ name è soltanto label
→ runner senza selectionId riceve history vuota
```

La griglia condivisa viene costruita da `series[].points`.

```txt
timestamp ISO completi
→ ordinamento cronologico

punti allineati validi
→ shared max

stesso nome
→ non implica continuità storica
```

Lo stato persistence non viene ricostruito dal nome runner, dai point o dalla health.

## Confine Money Flow

Per modificare il grafico, il contesto minimo è:

```txt
BetfairDepthCard.jsx
useDashboardViewModel.js
utils/betfairMoneyFlow.js
utils/betfairMoneyFlow.test.mjs
MoneyFlowChart.jsx
BetfairRunnerDepth.jsx
```

Contratto:

```txt
series
→ selectionId
→ points
```

`MoneyFlowChart.jsx` può:

- allineare history alla griglia condivisa;
- usare una scala condivisa;
- usare `getDisplayMatchedVolume(point)`;
- mostrare una barra soltanto per `matchedVolume` positivo e visualizzabile;
- escludere punti invalidi, anomali, vuoti o assenti;
- mantenere hover locale minimale.

Non deve:

- calcolare identità runner;
- correggere delta market o runner;
- usare `computeFlowWom`;
- attribuire direzione Back o Lay;
- mostrare WOM, pressure, trend o volume non attribuito come segnali;
- dedurre intenzione dei trader;
- generare punti sintetici;
- creare richieste API.

`BetfairRunnerDepth.jsx` può mostrare Best Back, Best Lay e quantità non abbinate come dati grezzi del book. Non deve trasformarli in direzione Money Flow.

### Volume abbinato nel tempo

Titolo:

```txt
Volume abbinato nel tempo
```

Regole:

```txt
matchedVolume positivo e validForDisplay
→ una barra neutra sopra lo zero

empty slot
→ nessuna barra

invalidVolume o anomaly
→ nessuna barra

matchedVolume = 0
→ nessuna barra
```

La scala condivisa usa soltanto volume visualizzabile e mantiene una base tecnica minima di 100.

Hover:

```txt
VOLUME ABBINATO: <importo> EUR
```

Non esistono tooltip o legende direzionali.

## Health Betfair

La UI riceve `health` e `healthTransition` dal livello hook.

Health, freshness e autenticazione sono già classificati dal backend.

`useBetfairHealthAlerts(...)` deriva transizioni, toast e audio senza cambiare status o significato.

I componenti non devono:

- ricalcolare status backend;
- trasformare errori tecnici in classificazioni nuove;
- trasformare tick o ladder stale in stati diversi;
- trasformare `partial_persistence` o `recovery_failed` in health;
- attivare polling autonomo.

L’avviso audio corrente combina flag strutturati con un controllo testuale su `message` e `reasons`. Un refactor deve preservare o migrare esplicitamente questa dipendenza.

### Pannello diagnostico

`BetfairHealthDebugPanel.jsx` espone in sola lettura:

```txt
lastScrapeAttemptAt
lastSuccessfulScrapeAt
lastCanonicalTickAt
lastUsableLadderAt
lastValidVolumeAt
lastTechnicalErrorAt
graphLoginRequiredAt
computedAt
technicalErrorActive
lastTechnicalErrorReason
latestBetfairAgeSec
latestUsableLadderAgeSec
betfairUrlOk
```

Il pannello non ricalcola status, login, freshness, alert o integrity.

Campi assenti:

```txt
null
—
```

## Persistence integrity nella UI Betfair

Contratto backend e hook:

```txt
GET /api/betfair/:eventId/latest oppure /json
→ useBetfairJson(...)
→ integrity conservata nello stato dell’hook
```

Wiring corrente:

```txt
App.jsx
→ destruttura data, health, moneyFlowHistory e lastUpdate
→ non destruttura integrity

useDashboardViewModel(...)
→ non riceve integrity

BetfairDepthCard.jsx
→ non riceve integrity
→ non mostra label persistence dedicata
```

Quindi non è corretto descrivere come già disponibile una UI Betfair che visualizza `partial_persistence` o `recovery_failed` separatamente dalla health.

Il comportamento implementato resta:

```txt
409 persistence_integrity
→ useBetfairJson setData(null)
→ integrity preservata internamente
→ health sicura eventualmente preservata
→ nessun lastUpdate locale inventato
→ nessun Money Flow sintetico
```

Il completamento futuro del wiring deve:

- passare integrity in modo esplicito;
- mantenere health e integrity separate;
- non mostrare `commitId` come informazione utente;
- non esporre path o payload journal;
- non tentare recovery client-side;
- non creare runner, ladder o barre mancanti.

## Confine overview

`OverviewDashboard.jsx` compone:

- `MatchContextCard.jsx`;
- `KeyStatsCard.jsx`;
- `BetfairDepthCard.jsx`;
- `TotManualInputPlaceholder.jsx`.

`MatchOverviewBar.jsx` è renderizzato da `DashboardWorkspace.jsx` e appartiene alla shell.

`MomentumEngineCard.jsx` non è presente e non deve comparire nella mappa.

## Market Reactions

Struttura:

```txt
frontend/src/components/
├── MarketReactionsPage.jsx
├── Sidebar.jsx
├── SourceIdentityGateIndicator.jsx
├── SourceIdentityGateToast.jsx
├── SourceIdentityGateWaitingScreen.jsx
└── marketReactions/
    ├── FieldLedReactionCard.jsx
    ├── MarketLedObservationCard.jsx
    ├── SourceIdentityConfirmationModal.jsx
    └── SourceIdentityControls.jsx
```

| Componente                            | Responsabilità                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `MarketReactionsPage.jsx`             | Pagina presentazionale del solo `marketReactionEvidence` ricevuto                                 |
| `Sidebar.jsx`                         | Navigazione, indicatore Source Identity e health Betfair                                           |
| `SourceIdentityGateIndicator.jsx`     | Semaforo Source Identity                                                                           |
| `SourceIdentityGateToast.jsx`         | Toast aligned o mismatch                                                                           |
| `SourceIdentityGateWaitingScreen.jsx` | Stato centrale collecting, pending o errore bootstrap                                              |
| `SourceIdentityConfirmationModal.jsx` | Mapping manuale pending ricevuto dal gate live                                                     |
| `SourceIdentityControls.jsx`          | Componente legacy prop-driven, non montato come autorità globale                                   |

`MarketReactionsPage.jsx` riceve:

```txt
eventId
evidence
loading
error
reasons
lastUpdate
isPolling
refresh
```

Il valore `evidence` è soltanto:

```txt
payload.latest.marketReactionEvidence
```

perché `useMarketReactionEvidence(...)` non conserva il wrapper Evidence completo.

La pagina non riceve attualmente:

```txt
integrity top-level
sources.sofa
sources.betfair
latest.dataQuality.persistenceComplete
snapshot Evidence completo
```

Non deve:

- creare polling;
- confermare o revocare mapping direttamente;
- determinare lo stato globale Source Identity;
- dedurre causalità;
- leggere journal;
- avviare recovery.

## Persistence integrity e Market Reactions

Il backend Evidence è owner della degradazione cross-source.

Quando persistence integrity è incompleta, il builder backend deve produrre:

```txt
marketReactionEvidence.available = false
marketLedAvailable = false
fieldLedAvailable = false
fieldLedMarketResponseObserved = false
causalityClaimed = false
```

Il frontend riceve quindi un `marketReactionEvidence` già degradato e non deve riabilitarlo.

Limite corrente:

```txt
404 Evidence con integrity top-level
→ useMarketReactionEvidence legge il body
→ conserva payload.reasons oppure payload.error
→ non conserva integrity
```

```txt
200 Evidence
→ conserva solo marketReactionEvidence
→ non inoltra persistenceComplete o sources
```

La UI non può quindi mostrare oggi il motivo strutturato di persistence integrity come blocco separato. Può mostrare soltanto le `reasons` già incluse nel ramo Market Reactions oppure il messaggio del `404`.

La reason canonica backend, quando presente nello snapshot, è:

```txt
Persistence incomplete: canonical cross-source evidence unavailable
```

Non usare varianti testuali come contratto alternativo.

Il completamento futuro del wiring deve preservare il wrapper Evidence e passare almeno:

```txt
integrity
latest.dataQuality.persistenceComplete
sources
```

senza ricostruire questi valori nel frontend.

## Confine Source Identity

Lo stato globale Source Identity usa esclusivamente:

```txt
GET /api/match/:eventId/source-identity-status
→ useSourceIdentityGateStatus(...)
→ useSourceIdentityGateUi(...)
→ sidebar, waiting screen, modale e toast
```

`MarketReactionsPage.jsx` non usa Evidence per decidere collecting, pending, recording o mismatch.

La phase `recording/aligned` produce semaforo verde e toast, ma non sblocca direttamente la dashboard. Servono:

```txt
dashboardContentReady
+ dashboardData
```

La modale pending mostra soltanto nomi, runner e motivi sanitizzati. Non mostra URL, market ID, selection ID, cookie, token, path o target journal.

Il flusso globale espone la conferma manuale ma non una revoca visibile. `SourceIdentityControls.jsx` conserva una revoca legacy non montata e non deve diventare una seconda autorità UI.

## Viste Strategy deprecate

Le viste:

```txt
lay
banca
superbreak
```

sono superfici Strategy legacy e deprecate. Restano nel routing finché il codice non viene rimosso, ma non devono essere estese.

Market Reactions e Match Evidence non appartengono alla deprecazione Strategy.

## Regole interpretative

La UI deve preservare:

```txt
temporal proximity only
causalityClaimed: false
```

Non visualizzare Market Reactions come:

- causa certa;
- segnale operativo;
- raccomandazione;
- prova di intenzione;
- indicazione sul vincitore;
- effetto certo di una recovery;
- effetto certo di un errore health.

Quando il backend dichiara il ramo non disponibile, la UI mostra assenza o reasons, non osservazioni valide.

## Test e verifica

```bash
npm run build
node src/utils/betfairMoneyFlow.test.mjs
node src/hooks/useBetfairJson.test.mjs
```

### Money Flow

```txt
stesso selectionId con nome aggiornato
→ stessa serie

stesso nome con selectionId diverso
→ nessuna continuità

selectionId assente
→ history vuota

point valido positivo
→ una barra neutra

invalidVolume, anomaly o empty slot
→ nessuna barra

hover
→ VOLUME ABBINATO: <importo> EUR
```

### Health

```txt
aprire BetfairHealthDebugPanel
→ confrontare tick, ladder, scrape e reason
→ campi assenti null o —
→ nessuna trasformazione persistence → health
```

### Persistence integrity

Stato corrente da verificare:

```txt
useBetfairJson con 409
→ integrity preservata internamente
→ data null
→ nessuna ora locale come lastUpdate

App / BetfairDepthCard
→ nessuna prop integrity dedicata
→ nessuna label persistence dichiarata come implementata
```

### Market Reactions

```txt
backend con persistenceComplete:false
→ marketReactionEvidence non disponibile
→ causalityClaimed false

useMarketReactionEvidence
→ conserva solo marketReactionEvidence
→ non conserva wrapper integrity/sources

MarketReactionsPage
→ non crea polling secondario
→ non legge journal
→ non esegue recovery
```

## Documenti collegati

- [Sessione e shell frontend](./01-session-shell.md)
- [Polling e view model](./02-live-polling-and-view-model.md)
- [Contesto punti UI](./04-match-context-ui.md)
- [Match Evidence Snapshot](../evidence/01-match-evidence-snapshot.md)
- [Source Identity](../evidence/02-source-identity.md)
- [Market Reactions](../evidence/04-market-reactions.md)
- [API Betfair](../../api/02-betfair.md)
- [API Evidence](../../api/03-evidence.md)
