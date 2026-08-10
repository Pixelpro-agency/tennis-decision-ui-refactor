# UI Betfair e Market Reactions

## Scopo

Questa pagina è la facade delle superfici frontend dedicate a Betfair Depth, Money Flow, health e Market Reactions.

I componenti visualizzano read model già prodotti da backend e hook. Non producono Evidence, non attribuiscono causalità, non leggono journal e non eseguono recovery.

Il lifecycle della sessione e di Source Identity appartiene a [Sessione e shell frontend](./01-session-shell.md); request safety, current/last-known e timestamp appartengono a [Polling e view model](./02-live-polling-and-view-model.md).

## Struttura

```txt
frontend/src/components/
├── BetfairDepthCard.jsx
├── BetfairHealthToast.jsx
├── MarketReactionsPage.jsx
├── betfair/
│   ├── BetfairRunnerDepth.jsx
│   ├── MoneyFlowChart.jsx
│   └── BetfairHealthDebugPanel.jsx
└── marketReactions/
    ├── FieldLedReactionCard.jsx
    ├── MarketLedObservationCard.jsx
    ├── SourceIdentityConfirmationModal.jsx
    └── SourceIdentityControls.jsx
```

## Betfair Depth

| Componente                    | Responsabilità                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `BetfairDepthCard.jsx`        | Contenitore, stato vuoto, health, associazione history-runner e griglia condivisa |
| `BetfairRunnerDepth.jsx`      | Ladder, Best Back/Lay, total matched e grafico del runner                         |
| `MoneyFlowChart.jsx`          | Volume abbinato neutro nel tempo                                                  |
| `BetfairHealthDebugPanel.jsx` | Diagnostica health read-only                                                      |
| `BetfairHealthToast.jsx`      | Avviso sulle transizioni health                                                   |

`BetfairDepthCard` riceve attualmente:

```txt
data
lastKnownData
history
lastKnownHistory
health
healthTransition
persistenceViewState
readStatus
isPolling
trackingStopped
sourceUpdatedAt
```

La card distingue autonomamente current, waiting, stopped, degraded, error e last-known. Health, persistence e Source Identity restano separati.

## History Money Flow

Il contratto è:

```txt
history.series[]
→ selectionId
→ name come label
→ points
```

L'associazione con il runner usa `String(selectionId)`. Il nome non è un'identità tecnica:

```txt
stesso selectionId + nome aggiornato
→ stessa serie

stesso nome + selectionId diverso
→ nessuna continuità

selectionId assente
→ history vuota
```

La griglia temporale condivisa deriva dai point di tutte le serie e mantiene l'allineamento tra runner.

## Money Flow neutro

Il grafico rappresenta soltanto volume abbinato osservato.

```txt
matchedVolume positivo + validForDisplay
→ barra neutra sopra lo zero

empty / invalidVolume / anomaly
→ nessuna barra

matchedVolume = 0
→ nessuna barra
```

Non deve mostrare:

- direzione Back/Lay;
- WOM o pressure;
- intenzione del trader;
- volume non attribuito come segnale;
- punti sintetici;
- raccomandazioni operative.

### Scala e osservabilità

`getMoneyFlowAxisMax()` produce il massimo normalizzato condiviso usato sia dalle barre sia dall'asse.

Hover e formattazione distinguono:

```txt
slot assente/invalid/anomaly
≠ zero realmente osservato
```

Gli stati non osservabili non producono tooltip numerico; uno zero reale e valido resta `0 EUR`.

## Valori Betfair mancanti

Price, size e total matched sono dati osservati. `null` o assenza non equivalgono a zero.

Contratto applicato dai formattatori condivisi:

```txt
price mancante → —
size mancante → —
runner matched mancante → —
zero reale → 0 o 0.00 secondo il campo
```

I valori mancanti non vengono più convertiti implicitamente in zero.

## Stato vuoto e polling

Lo stato vuoto usa `isPolling`, `readStatus`, `trackingStopped` e `persistenceViewState`. Non contiene più un intervallo hard-coded e distingue polling attivo, inattivo, waiting, Stop, errore e persistence incompleta.

## Current e last-known Betfair

`useBetfairJson()` espone ora:

```txt
data
lastKnownData
readStatus
integrity
sourceUpdatedAt
fetchedAt
```

Il fallback `/latest → /json` è atomico e non combina più data nuova con health/history precedenti.

`App.jsx` inoltra read status, last-known, history e source timestamp alla card. Con `degraded` o `error`, la card può mostrare l'ultimo dato disponibile con label e timestamp espliciti, senza presentarlo come live.

## Health Betfair

Health, persistence, freshness e Source Identity sono assi distinti.

`useBetfairHealthAlerts()` deriva transizioni, toast e audio dalla health backend senza modificarne lo status. I componenti non devono riclassificare persistence integrity come health.

L'avviso audio corrente considera sia flag strutturati sia testo in `message` e `reasons`; un refactor deve preservare o migrare consapevolmente questa dipendenza.

### Debug panel

`BetfairHealthDebugPanel.jsx` mostra in sola lettura:

```txt
lastScrapeAttemptAt
lastSuccessfulScrapeAt
lastCanonicalTickAt
lastUsableLadderAt
lastValidVolumeAt
lastTechnicalErrorAt
graphLoginRequiredAt
graphLoginRequiredUrl
computedAt
technicalErrorActive
lastTechnicalErrorReason
latestBetfairAgeSec
latestUsableLadderAgeSec
betfairUrlOk
```

Campi assenti sono resi come `null` o `—`. `graphLoginRequiredUrl` è un URL già redatto dal backend/scraper e deve restare tale; la UI non deve introdurre campi diagnostici raw, cookie, token o target CDP.

## Persistence Betfair

`useBetfairJson()` conserva integrity e `App.jsx` la integra in `persistenceViewState`. `DashboardWorkspace` mostra un avviso comune per `degraded` ed `error`.

Il wiring specifico della card è completato:

```txt
useBetfairJson integrity/readStatus
→ App e banner shell
→ BetfairDepthCard persistence/read state
```

La card non deve mostrare `commitId`, path, contenuti journal o controlli di recovery.

## Market Reactions

`MarketReactionsPage` riceve ora:

```txt
eventId
evidence
loading
error
reasons
integrity
sources
persistenceComplete
readStatus
lastUpdate
isPolling
refresh
```

`useMarketReactionEvidence()` conserva il wrapper Evidence:

```txt
latest
marketReactionEvidence
sources
integrity
latest.dataQuality.persistenceComplete
sourceUpdatedAt
fetchedAt
```

La pagina mostra un avviso separato quando `readStatus=degraded` o `persistenceComplete=false`. Non ricostruisce questi valori nel client.

## Degradazione cross-source

Il backend resta owner della degradazione. Con persistence incompleta deve produrre:

```txt
marketReactionEvidence.available = false
marketLedAvailable = false
fieldLedAvailable = false
fieldLedMarketResponseObserved = false
causalityClaimed = false
```

Il frontend non riabilita un ramo dichiarato non disponibile.

Reason canonica:

```txt
Persistence incomplete: canonical cross-source evidence unavailable
```

La pagina visualizza availability e reasons ricevute. I mapping interni delle card Market-led e Field-led restano governati dal relativo view model e dai finding del modulo [Market Reactions](../evidence/04-market-reactions.md).

## Source Identity

La pagina Market Reactions non determina collecting, pending, recording o mismatch. L'autorità globale è:

```txt
useSourceIdentityGateStatus
→ useSourceIdentityGateUi
→ sidebar, waiting screen, modale e toast
```

`SourceIdentityControls.jsx` è un componente legacy prop-driven e non deve diventare una seconda autorità.

La modale pending non mostra URL, market ID, selection ID, cookie, token, path o journal target.

## Regole interpretative

La UI deve preservare:

```txt
temporal proximity only
causalityClaimed: false
```

Market Reactions non è:

- una causa certa;
- un segnale di trading;
- una raccomandazione;
- una prova di intenzione;
- un'indicazione sul vincitore.

## Confine overview

`OverviewDashboard.jsx` compone Match Context, Key Stats, Betfair Depth e il placeholder TOT manuale. `MatchOverviewBar` appartiene alla shell.

Le viste Strategy legacy `lay`, `banca` e `superbreak` sono deprecate e non devono essere estese. Market Reactions e Match Evidence non appartengono a tale deprecazione.

## Test

Copertura esistente:

```txt
frontend/src/utils/betfairMoneyFlow.test.mjs
frontend/src/hooks/useBetfairJson.test.mjs
frontend/src/hooks/useMarketReactionEvidence.test.mjs
frontend/src/hooks/pollingLifecycle.test.mjs
frontend/src/components/marketReactions/marketReactionViewModel.test.mjs
frontend/src/components/frontendComponents.test.jsx
```

La suite JSX copre MoneyFlowChart, valori null del runner, lifecycle e last-known della Betfair card, debug URL redatto e persistence incompleta in Market Reactions.

Verifica:

```bash
node --test <tutti i file frontend/src/**/*.test.mjs>
npm.cmd run test:components
npm.cmd run build
python scripts/check_documentation_links.py
python scripts/check_registry_consistency.py
```

`npm.cmd run lint` non è disponibile finché manca una configurazione ESLint.

## Modularizzazione prevista

Questa pagina resta la facade. La separazione dettagliata proposta è:

```txt
[Betfair Depth e health UI](./05-betfair-depth-and-health-ui.md)
[Market Reactions UI](./06-market-reactions-ui.md)
```

I due documenti sono owner derivati e non aggiungono voci alla sequenza originale dei 72 file. Il lifecycle Source Identity resta in `01-session-shell.md`.

## Documenti collegati

- [Sessione e shell frontend](./01-session-shell.md)
- [Polling e view model](./02-live-polling-and-view-model.md)
- [Contesto punti UI](./04-match-context-ui.md)
- [Match Evidence Snapshot](../evidence/01-match-evidence-snapshot.md)
- [Source Identity](../evidence/02-source-identity.md)
- [Market Reactions](../evidence/04-market-reactions.md)
- [API Betfair](../../api/02-betfair.md)
- [API Evidence](../../api/03-evidence.md)
