# Registro delle fonti consolidate

Le dieci fonti storiche consolidate durante l’audit sono state rimosse. I materiali aggiunti successivamente in questa cartella non appartengono a quel cleanup e restano non canonici.

Le fonti storiche ricevute durante l'audit sono state lette, confrontate con il
codice e con i registri, quindi rimosse quando il contenuto utile risultava già
assorbito. Questo file conserva soltanto la mappa di provenienza.

| Fonte rimossa                         | Contenuto utile conservato in                                                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brief Source Identity frontend        | `docs/tennis-decision-ui/modules/evidence/02-source-identity.md`, documenti frontend e `docs/validations/source-identity-live-verification.md`              |
| Prompt navigazione e modularizzazione | `docs/tennis-decision-ui/ai/01-context-selection.md`, `implementazioni/07-workflow-esecutivo.md`, `implementazioni/08-linee-guida-chat-e-ai.md`, `IMPL-003` |
| Backlog operativo del 4 luglio 2026   | `implementazioni/03-audit-codice.md`, `implementazioni/04-task-completate.md`, `IMPL-010`, `IMPL-012…015`                                                   |
| Pacchetto e report Task 6             | owner storage correnti, `implementazioni/04-task-completate.md` e finding già normalizzati nei registri                                                     |
| Pacchetto launcher Task 2             | owner runtime correnti, task completate e scenari ancora aperti nella Todo                                                                                  |
| Replay e backtesting                  | `IMPL-012` e prerequisiti strategici di `IMPL-010`                                                                                                          |
| Market Reactions Journal              | estensione futura consolidata sotto `IMPL-023`                                                                                                              |
| `Idee Future.odt`                     | requisiti futuri consolidati sotto `IMPL-010`, `IMPL-012`, `IMPL-018` e `IMPL-023`                                                                          |
| `Idee Per Stream API Betfair.odt`     | estensione Stream API consolidata sotto `IMPL-018`                                                                                                          |

## Regola corrente

Una fonte storica separata viene mantenuta soltanto quando contiene evidenza o
requisiti unici non ancora registrati. Dopo l'assorbimento:

```txt
contenuto unico nei registri o nelle validations
→ link verificati
→ fonte duplicata rimossa
→ nessun secondo owner
```

I report di collaudo con evidenza ancora utile restano in `docs/validations/`.
Le funzionalità future non sono implementate e non diventano canoniche per il
solo fatto di essere citate nei registri.
