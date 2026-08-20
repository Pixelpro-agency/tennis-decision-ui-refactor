# Tennis Decision UI — Todo list e stato operativo

## Scopo

Questa Todo è la vista operativa unica e sintetica della revisione di **Tennis Decision UI**.

Serve a:

- mostrare lo stato corrente verificabile senza duplicare le schede owner;
- conservare inventari e checkpoint storici dell’audit quando restano utili;
- distinguere comportamento presente, mitigazioni parziali, lavoro approvato ma non completato, futuro e verifiche mancanti;
- collegare gli ID sintetici alle relative schede owner;
- mantenere separati stato tecnico corrente, provenance storica e risultati di validation;
- fornire una base per preparare task esecutive separate senza selezionare automaticamente la prossima task.

Le motivazioni, le decisioni e le evidenze analitiche complete vivono nei moduli sotto `implementazioni/`. La documentazione tecnica corrente vive sotto `docs/tennis-decision-ui/`. Questa Todo non sostituisce nessuno dei due livelli.


### Provenance storica del recupero documentale

```txt
SHA base del recupero documentale: 8f936d1a3686b775e967e375576f52f19da461a5
Commit di applicazione del recupero: 2ebe7e8ad0935bf0195679452d2e54e1de4d63dc
Data del recupero documentale: 2026-08-06
```

Questi riferimenti restano esclusivamente provenance storica del recupero documentale.

## Legenda

```txt
[x] classificazione/decisione/attività completata oppure condizione verificata indicata dal testo
[ ] lavoro, implementazione, verifica o copertura ancora aperta
[-] parziale, mitigato, coperto solo in parte o con limite residuo
[~] futuro o rinviato
```

Lo stato testuale in **grassetto** è l’autorità sintetica della riga. Una checkbox `[x]` non equivale automaticamente a “codice implementato”.

---

## Authority e struttura

`todo-list-tennis-decision-ui.md` è l’unico entry point operativo della Todo, ma non è l’unico file fisico. I Blocchi top-level vivono una sola volta nei moduli dedicati sotto `todo-list-tennis-decision-ui/`; la facade non ne duplica le checklist.

Le schede sotto `implementazioni/` restano owner delle motivazioni, delle evidenze e dei criteri completi. Le superfici sintetiche canoniche consumate dal registry checker sono:

- [Rilievi registrati](./todo-list-tennis-decision-ui/06-rilievi-registrati.md) per i finding;
- [Implementazioni utili](./todo-list-tennis-decision-ui/07-implementazioni-utili.md) per le `IMPL-*`.

## Lettura a contesto minimo

Partire da questa facade e aprire soltanto i moduli indicati dal routing per la richiesta corrente. Gli audit storici della documentazione e del codice non sono contesto predefinito per una task tecnica corrente: consultarli soltanto quando servono provenance o ricostruzione storica.

## Indice dei moduli

1. [Stato, fonti e inventario — Blocco A](./todo-list-tennis-decision-ui/01-stato-fonti-inventario.md)
3. [Audit documentazione storico — Blocco B](./todo-list-tennis-decision-ui/03-audit-documentazione-storico.md)
4. [Audit codice storico — Blocco C](./todo-list-tennis-decision-ui/04-audit-codice-storico.md)
5. [Ricontrollo task e priorità — Blocco D](./todo-list-tennis-decision-ui/05-ricontrollo-task-priorita.md)
6. [Rilievi registrati — Blocco E](./todo-list-tennis-decision-ui/06-rilievi-registrati.md)
7. [Implementazioni utili — Blocco F](./todo-list-tennis-decision-ui/07-implementazioni-utili.md)
8. [Workflow operativo permanente — Blocco G](./todo-list-tennis-decision-ui/08-workflow-operativo-permanente.md)
9. [Modularizzazione e pulizia — Blocco H](./todo-list-tennis-decision-ui/09-modularizzazione-e-pulizia.md)
10. [Preparazione task esecutive — Blocco I](./todo-list-tennis-decision-ui/10-preparazione-task-esecutive.md)
11. [Stato di chiusura — Blocco J](./todo-list-tennis-decision-ui/11-stato-di-chiusura.md)

## Routing rapido

| Richiesta                                                          | Contesto iniziale                                                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Orientamento generale o inventario                                 | [01 — Stato, fonti e inventario](./todo-list-tennis-decision-ui/01-stato-fonti-inventario.md)            |
| Regole documentali                                                 | [Metodo, stati e regole](./implementazioni/00-metodo-e-stati.md)                                         |
| Ricostruzione dell’audit documentazione storico                    | [03 — Audit documentazione storico](./todo-list-tennis-decision-ui/03-audit-documentazione-storico.md)   |
| Ricostruzione dell’audit codice storico                            | [04 — Audit codice storico](./todo-list-tennis-decision-ui/04-audit-codice-storico.md)                   |
| Ricontrollo delle vecchie task o priorità correnti                 | [05 — Ricontrollo task e priorità](./todo-list-tennis-decision-ui/05-ricontrollo-task-priorita.md)       |
| Lavorare su `DOC/CODE/RUNTIME/STORAGE/EVIDENCE/FRONTEND/TEST/etc.` | [06 — Rilievi registrati](./todo-list-tennis-decision-ui/06-rilievi-registrati.md)                       |
| Lavorare su una `IMPL-*`                                           | [07 — Implementazioni utili](./todo-list-tennis-decision-ui/07-implementazioni-utili.md)                 |
| Preparare o verificare il workflow operativo                       | [08 — Workflow operativo permanente](./todo-list-tennis-decision-ui/08-workflow-operativo-permanente.md) |
| Verificare struttura, modularizzazione o cleanup documentale       | [09 — Modularizzazione e pulizia](./todo-list-tennis-decision-ui/09-modularizzazione-e-pulizia.md)       |
| Preparare una task esecutiva                                       | [10 — Preparazione task esecutive](./todo-list-tennis-decision-ui/10-preparazione-task-esecutive.md)     |
| Verificare il closeout generale                                    | [11 — Stato di chiusura](./todo-list-tennis-decision-ui/11-stato-di-chiusura.md)                         |

### Quale task affrontiamo adesso?

Usare come contesto iniziale sufficiente:

- [05 — Ricontrollo task e priorità](./todo-list-tennis-decision-ui/05-ricontrollo-task-priorita.md);
- [06 — Rilievi registrati](./todo-list-tennis-decision-ui/06-rilievi-registrati.md);
- [07 — Implementazioni utili](./todo-list-tennis-decision-ui/07-implementazioni-utili.md);
- [11 — Stato di chiusura](./todo-list-tennis-decision-ui/11-stato-di-chiusura.md).

### Preparare un prompt esecutivo

Aprire:

- [08 — Workflow operativo permanente](./todo-list-tennis-decision-ui/08-workflow-operativo-permanente.md);
- [10 — Preparazione task esecutive](./todo-list-tennis-decision-ui/10-preparazione-task-esecutive.md);
- il solo modulo che contiene la task interessata, individuato tramite il routing precedente.
