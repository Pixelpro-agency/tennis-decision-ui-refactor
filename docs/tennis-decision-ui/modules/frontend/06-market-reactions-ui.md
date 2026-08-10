# Market Reactions UI

## Scopo

Questo documento è l'owner dettagliato della presentazione Market Reactions. La costruzione dell'Evidence appartiene a [Market Reactions](../evidence/04-market-reactions.md); il lifecycle Source Identity appartiene a [Sessione e shell frontend](./01-session-shell.md).

## Componenti

```txt
MarketReactionsPage.jsx
marketReactions/FieldLedReactionCard.jsx
marketReactions/MarketLedObservationCard.jsx
```

La modale Source Identity è collegata alla navigazione Market Reactions ma il relativo lifecycle non appartiene a questo owner.

## Input della pagina

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

Questi valori arrivano da `useMarketReactionEvidence()`. La pagina non crea polling secondari e non ricostruisce il wrapper Evidence.

## Persistence presentation

Quando:

```txt
readStatus = degraded
oppure
persistenceComplete = false
```

la pagina mostra un avviso persistence separato con l'eventuale reason strutturata. `sources` può confermare che sono disponibili diagnostiche sulla lettura corrente, senza esporre path o journal.

Il backend resta owner della degradazione cross-source e deve mantenere:

```txt
available = false
causalityClaimed = false
```

quando le fonti canoniche non sono complete.

## Regole interpretative

Market Reactions rappresenta prossimità temporale, non causalità.

Non trasformare le osservazioni in:

- segnale di trading;
- raccomandazione;
- intenzione del mercato;
- previsione del vincitore;
- causa certa.

Availability e reasons ricevute dal backend prevalgono su qualunque considerazione visuale.

## Source Identity

La pagina non determina `collecting`, `pending`, `recording` o `mismatch`. L'autorità resta:

```txt
useSourceIdentityGateStatus
→ useSourceIdentityGateUi
→ shell, sidebar, waiting screen, modale e toast
```

`SourceIdentityControls.jsx` è legacy e non è una seconda autorità globale.

## Riferimenti implementativi

```text
frontend/src/components/MarketReactionsPage.jsx
frontend/src/components/marketReactions/marketReactionViewModel.js
frontend/src/components/marketReactions/MarketLedObservationCard.jsx
frontend/src/components/marketReactions/FieldLedReactionCard.jsx
frontend/src/hooks/useMarketReactionEvidence.js
```

```text
Evidence response
→ persistence/identity gate presentation
→ market-led view model
→ field-led view model
→ availability e reason per card
→ rendering descriptive-only
```

| Backend                        | UI                                          |
| ------------------------------ | ------------------------------------------- |
| sezione unavailable            | card con reason, non nascosta dal parent    |
| integrity degradata            | messaggio persistence dedicato              |
| Source Identity non confermata | stato gate esplicito                        |
| osservazione disponibile       | intervallo, direzione e qualità descrittiva |

## Test

```bash
npm.cmd run test:components
node src/components/marketReactions/marketReactionViewModel.test.mjs
node src/hooks/useMarketReactionEvidence.test.mjs
npm.cmd run build
```

La suite component-level verifica la visualizzazione separata della persistence degradation. I test del view model coprono availability, reasons e mapping delle osservazioni.

## Collegamenti

- [Facade UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md)
- [Sessione e shell frontend](./01-session-shell.md)
- [Polling e view model](./02-live-polling-and-view-model.md)
- [Market Reactions Evidence](../evidence/04-market-reactions.md)
- [API Evidence](../../api/03-evidence.md)
