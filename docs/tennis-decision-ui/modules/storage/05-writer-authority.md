# Writer authority

## Scopo

Definire l'esclusività process-level del backend che può scrivere nella storage identity locale.

## Stato

La writer authority garantisce un solo backend writer per la storage identity locale. Non è un journal, una cache o una fonte dati.

## Responsabilità

La primitive possiede acquisizione esclusiva, classificazione dell'owner esistente, reclaim conservativo e rilascio verificato. È distinta dall'identità della sessione launcher e dall'ownership dei processi.

## Collocazione e identità

I record risiedono in `backend/match_history/.writer_authority/` e contengono soltanto identità bounded del backend owner. L'identità non deriva dalla sola porta e resta distinta dal lock del launcher e dalla ownership dei processi.

## Bootstrap

`startServer()` acquisisce l'authority prima di recovery, listener e tracking. `createApp()` non produce questi side effect.

Un owner active o unknown blocca il secondo backend. Un owner dead può essere reclaimed solo dopo verifica; un PID riciclato non dimostra continuità dell'owner.

L'acquisizione è fail-closed e protegge la race fra processi concorrenti. Il record contiene un token d'istanza non esposto nei log e viene sostituito soltanto quando la classificazione autorizza esplicitamente il reclaim.

```text
record assente
→ create esclusiva
→ authority acquisita

record active o unknown
→ startup bloccato

record dead verificato
→ reclaim conservativo
→ nuova acquisizione
```

## Shutdown

L'authority viene mantenuta durante tutto il runtime e rilasciata dopo il drain dei tracker. Drain fallito o force timeout non autorizzano un rilascio anticipato: il record residuo sarà valutato dal backend successivo.

Il rilascio verifica che il chiamante sia ancora l'owner. Un processo non può cancellare l'authority di un'altra istanza e il launcher non può inferirne il rilascio dalla sola terminazione di un PID.

## Confini

I writer business non creano o rimuovono autonomamente l'authority. I log sono bounded e non espongono owner token, path personali, stack o payload.

## Riferimenti implementativi

```text
backend/src/runtime/matchHistoryWriterAuthority.js
backend/src/server.js
backend/src/sofa/matchTracker.js
```

### Classificazione dell'owner

| Stato             | Azione del nuovo backend                    |
| ----------------- | ------------------------------------------- |
| `active`          | startup bloccato                            |
| `unknown`         | startup bloccato, nessun reclaim aggressivo |
| `dead` verificato | reclaim consentito                          |
| record assente    | acquisizione atomica                        |

```text
acquire authority
→ recovery
→ listener e tracking
→ drain tracker
→ chiusura listener
→ release verificato
```

Il token dell'owner lega acquire e release. PID e porta, da soli, non autorizzano cancellazione o trasferimento.

## Verifica

Eseguire dalla cartella `backend/src`:

```powershell
node runtime/matchHistoryWriterAuthority.test.mjs
node server.test.mjs
```

## Documenti collegati

- [Commit journal e recovery](./02-commit-journal-and-recovery.md)
- [Timeline e history](./01-timelines-and-history.md)
- [Runtime locale](../../operations/01-local-runtime.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
- [Tracking live](../sofa/01-live-tracking.md)
