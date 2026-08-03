# Validazione live Betfair — 4 luglio 2026

## Metadati

| Campo | Valore |
| --- | --- |
| Data | 4 luglio 2026 |
| Tipo | Osservazione live manuale |
| SHA | Non registrato nel documento sorgente |
| Sorgente migrata | `docs/validations/betfair-live-validation-2026-07-04.md` |
| Stato | Completata con limiti documentati |

## Scopo

Registrare la verifica manuale della pipeline:

```txt
SofaScore
→ Source Identity
→ Betfair
→ timeline
→ latest
→ read model
→ Volume abbinato nel tempo
```

Non è una specifica del comportamento futuro.

## Sessione A — Graph URL disponibili

Osservato:

```txt
Sofa: Connected
Source Identity recording / canonical / aligned
Betfair health green
graphHealth ok
2 Graph URL fornite, tentate e riuscite
ladderSource graph_url per entrambi i runner
selectionId stabile
seq 29 → 30 → 31
matchedVolume positivo
grafico Volume abbinato nel tempo visibile
```

Nomi dei giocatori e URL completi non sono conservati nel report.

## Sessione B — nessuna Graph URL

Osservato:

```txt
tracking ancora attivo
graphHealth unavailable
reason no_graph_urls_provided
Betfair yellow / STALE
ladderSource book_depth
matchedVolume positivo possibile
nessuno stop inatteso
nessuna regressione seq osservata
```

Un tick ha prodotto:

```txt
market_delta_raw_computed_mismatch
matchedVolume 0
validForDisplay false
invalidVolume true
anomaly true
```

Il point è stato soppresso senza fermare il tracking.

## Sessione C — logout Graph e recovery

Osservato manualmente:

```txt
sessione stabile
→ logout Betfair
→ tick status-only
→ graphHealth auth_suspected
→ health red / ALERT
→ popup e audio
→ login ripristinato
→ ritorno a Connected
```

Non è stato archiviato un payload `/latest` post-fix e non risultava un test automatico PASS dedicato al tick `status-only`.

## Console

Sessione A:

- due risposte Betfair `404` iniziali, non ripetute dopo la stabilizzazione;
- successiva fase con risposte `200/304`.

Sessione B:

- console applicativa pulita per oltre trenta secondi dopo il reset.

## Limiti

Le sessioni A e B hanno riutilizzato lo stesso `eventId`. Sequenza, timeline e scala del grafico della seconda sessione non erano quindi completamente isolate.

Non sono stati verificati:

- sessione iniziata con login Betfair già scaduto;
- Graph URL malformate;
- mismatch `marketId`;
- errore API o rete reale;
- mercato Betfair realmente concluso.

Il logout della Sessione C non equivale al caso di login assente all'avvio.

Il caso SofaScore `404` durante Source Identity buffering è stato riferito come risolto ma senza artefatti allegati e non viene considerato evidenza archiviata.

## Interpretazione

| Caso | Stato |
| --- | --- |
| Graph URL valide | `live_observed` |
| Nessuna Graph URL | `live_observed` |
| Volume anomalo soppresso | `live_observed` |
| Logout Graph e alert | `live_observed` |
| Recovery dopo login | `live_observed` |
| Login già scaduto all'avvio | non eseguito |
| Graph URL malformate | non eseguito |
| Errore rete/API reale | non eseguito |
| Mercato finished reale | non eseguito |

## Documenti owner correnti

- [Validità tecnica Betfair](../tennis-decision-ui/modules/betfair/02-technical-sample-validity.md)
- [Lifecycle scraper Betfair](../tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md)
- [Diagnostica Betfair](../tennis-decision-ui/operations/03-betfair-diagnostics.md)
- [Stato corrente](../tennis-decision-ui/roadmap/01-current-state.md)
