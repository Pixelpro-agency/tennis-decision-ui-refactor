# Tennis Decision UI — Decisioni strutturali dell’utente

> Conserva soltanto decisioni che influenzano più aree o task.

## 17. Registro delle decisioni dell’utente

Questa sezione conserva soltanto decisioni strutturali che influenzano più task.

### DEC-001 — Uso di due registri operativi

**Stato:** approvata.

Decisione:

```txt
documento analitico dettagliato
+ Todo sintetica
```

Il documento analitico conserva motivi e criteri. La Todo conserva stato e percorso.

### DEC-002 — Audit prima delle modifiche

**Stato:** approvata.

Decisione:

```txt
prima analisi documentazione e codice
→ poi task esecutive
```

### DEC-003 — Possibile modularizzazione del registro

**Stato:** approvata come opzione futura.

Decisione:

Se il registro diventa troppo grande, creare una cartella root `implementazioni/` e dividerlo per aree collegate, mantenendo ID e indice.


### DEC-004 — Nuovi documenti soltanto in formato Markdown

**Stato:** approvata.

Decisione:

```txt
nuovi documenti tecnici: .md
nuovi documenti tecnici: non .mdx
```

La migrazione deve verificare la compatibilità del sistema documentale e convertire gli elementi specifici MDX prima della sostituzione.

### DEC-005 — Lettura differita e classificata di `docs/planning`

**Stato:** approvata.

Decisione:

`docs/planning` verrà analizzata dopo il primo confronto fra documentazione canonica e codice corrente. I file saranno letti per area e classificati come storici, realizzati, ancora validi, futuri, duplicati o superati.


### DEC-006 — Consegna tramite documenti completi

**Stato:** approvata come metodo preferito.

Decisione:

I documenti riscritti saranno consegnati come file completi scaricabili. Per gruppi numerosi, usare un archivio ZIP con struttura delle cartelle e manifest di migrazione. L’utente inserirà i file nel repository e gestirà Git.

### DEC-007 — Conversione dei metadata MDX

**Stato:** da verificare tecnicamente.

Proposta:

Sostituire `export const meta` con frontmatter YAML nei nuovi `.md`, preservando `id`, ordine, titolo, stato, versione e lingua quando presenti.

---
