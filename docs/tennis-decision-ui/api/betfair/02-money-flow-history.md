# API Betfair — Money Flow History

## Scopo

`moneyFlowHistory` è il read model incluso in `/api/betfair/:eventId/latest`. Usa al massimo gli ultimi venti tick validi e non espone direzione, trend o confidence.

## Identità

`selectionId`, normalizzato a stringa, è l’unica identità della serie:

```txt
stesso selectionId → continuità, anche se cambia il nome
stesso nome e selectionId diverso → serie separate
selectionId assente → runner escluso
```

## Volume e validazione

Priorità: raw runner delta valido, poi computed runner delta valido, altrimenti zero con `volumeDetected=false`.

Le anomalie mantengono separati delta negativi, `matched_total_decreased`, zero-vs-positivo, divergenza raw/computed e runner oltre il market delta.

```txt
raw/computed mismatch → max(1, 10% del valore maggiore)
runner oltre market → max(1, 5% del market delta assoluto)
```

Un point invalido usa `matchedVolume: 0`, `validForDisplay: false`, `invalidVolume: true` e `anomaly: true`. Ladder assente, Back, Lay e `classifiedVolume` non invalidano da soli un volume coerente.

## Shape sintetica

```json
{"series":[{"selectionId":"<selectionId>","name":"<runner>","points":[]}]}
```

Ogni point può includere timestamp, delta runner e mercato, ladder delta, reason, validation reasons, sequenza, graph health, ladder source e flag di validità.

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Letture, integrity e health](./01-read-integrity-and-health.md)
- [Validità tecnica dei campioni](../../modules/betfair/02-technical-sample-validity.md)
