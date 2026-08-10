# API Match — analisi e snapshot

## Endpoint

```txt
POST /api/match/analyze
POST /api/match/snapshot
```

`snapshot` esegue un redirect `307` verso `/api/match/analyze`.

## Analyze

Payload:

```json
{"url":"<sofascore-match-url>"}
```

Flusso:

```txt
extractEventId
→ buildSofaAnalysis
→ snapshot + localContext
```

`/analyze` e il redirect `/snapshot` sono compute-only: non scrivono history, timeline o journal e non aggirano Source Identity Gate o tracking session authority. La risposta positiva contiene `snapshot` e `localContext`.

## Errori correnti

| Caso                                     | HTTP  | `code`                 | Messaggio pubblico                     |
| ---------------------------------------- | ---:  | ---------------------- | -------------------------------------- |
| URL assente                              | `400` | non presente           | `URL mancante`                         |
| Event ID non ricavabile                  | `400` | non presente           | `URL non valido o eventId non trovato` |
| Messaggio contenente `404` o `not found` | `404` | `sofa_event_not_found` | `Evento SofaScore non trovato.`        |
| Messaggio contenente `403` o `blocked`   | `503` | `sofa_access_blocked`  | `SofaScore non disponibile.`           |
| Altro errore                             | `500` | `analysis_failed`      | `Analisi SofaScore non riuscita.`      |

La classificazione normalizza il messaggio in lowercase e preserva la precedenza del caso `404/not found`. Il body HTTP non restituisce il messaggio raw dell’eccezione. La diagnostica tecnica resta confinata al logging runtime redatto.

## Confini

Il router non implementa parsing SofaScore, calcolo point-by-point o composizione di `localContext`; delega ai moduli SofaScore. Gli errori tecnici vengono registrati dal runtime logger senza essere copiati nel body HTTP.

## Documenti collegati

- [API Match](../01-match.md)
- [Contesto locale e point-by-point](../../modules/sofa/02-local-context-and-point-by-point.md)
- [Timeline e history](../../modules/storage/01-timelines-and-history.md)
