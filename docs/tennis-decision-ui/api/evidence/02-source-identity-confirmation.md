# API Evidence — conferma e revoca Source Identity

## Endpoint

```txt
POST   /api/evidence/:eventId/source-identity/confirm
DELETE /api/evidence/:eventId/source-identity/confirm
```

POST tenta prima la conferma tramite gate live; usa il fallback basato sulle timeline soltanto quando il gate è assente o restituisce `ok:false`.

## Conferma con gate

| Fase                     | HTTP corrente               |
| ------------------------ | --------------------------: |
| `collecting`             | `422`                       |
| `pending`                | `200`, `400`, `409` o `422` |
| `recording` o `mismatch` | `409`                       |
| Altra fase               | `400`                       |

Il mapping distingue input `400`, contesto incompleto `422`, conflitti o race `409` e failure di persistenza o bootstrap `500`. I code pubblici sono bounded, fra cui `confirmation_persistence_failed` e `confirmation_bootstrap_failed`.

## Sequenza e limite di atomicità

La sequenza corrente è:

```txt
validazione
→ persistenza della conferma
→ applicazione al gate
→ bootstrap recording
```

Il bootstrap viene eseguito prima dell’upsert della confirmation. Se fallisce, la sessione torna all’identità automatica precedente, il gate resta `pending` e nessuna nuova confirmation viene persistita. Se l’upsert fallisce dopo il bootstrap, il gate torna comunque `pending` e la risposta non dichiara successo; i commit canonici già completati dal bootstrap non vengono cancellati o riscritti retroattivamente.

## Fallback senza gate

Richiede timeline Sofa e Betfair con entry, Source Identity automatica `pending`, contesto completo, due coppie uno-a-uno e frase esatta. Può persistere la conferma senza aprire un gate o un bootstrap live.

## Revoca

DELETE opera sulla conferma applicabile al contesto persistito corrente:

| Condizione                   | HTTP  | Esito                       |
| ---------------------------- | ----: | --------------------------- |
| Contesto timeline assente    | `404` | nessuna revoca              |
| Nessuna conferma applicabile | `200` | `revoked:false`             |
| Revoca riuscita              | `200` | `revoked:true`              |
| Errore store                 | `500` | messaggio pubblico corrente |

La revoca non è gate-aware, non modifica timeline o history e non esegue recovery.

## Documenti collegati

- [API Evidence](../03-evidence.md)
- [Source Identity](../../modules/evidence/02-source-identity.md)
- [Snapshot Match Evidence](../../modules/evidence/01-match-evidence-snapshot.md)
