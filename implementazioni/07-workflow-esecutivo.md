# Tennis Decision UI — Workflow esecutivo e criteri di chiusura

> Contiene le regole per trasformare un rilievo in task, consegnare documenti completi e chiudere la revisione.

### 7.6 Modalità di riscrittura e consegna dei documenti

Per la riscrittura della documentazione canonica, la modalità preferita è:

```txt
file completo sostitutivo
→ download
→ inserimento manuale dell’utente
→ verifica
→ eliminazione del vecchio file
```

Evitare, quando possibile:

- patch parziali molto grandi;
- comandi terminale che modificano decine di documenti;
- sostituzioni regex non revisionate;
- rinomina automatica di massa senza conversione della sintassi;
- richieste esecutive che devono ricostruire il contenuto completo da frammenti.

Per una singola area, l’assistente deve poter produrre:

```txt
nuovi file .md completi
+ manifest di migrazione
+ elenco file .mdx da rimuovere dopo verifica
+ elenco link aggiornati
+ checklist di controllo
```

Per più file o una directory completa, la consegna consigliata è un archivio ZIP che preserva la struttura:

```txt
docs-tennis-decision-ui-md/
├── MIGRATION-MANIFEST.md
└── docs/
    └── tennis-decision-ui/
        └── <struttura finale .md>
```

Il manifest deve indicare per ogni file:

```txt
percorso precedente
→ percorso nuovo
→ azione: sostituire / riscrivere / spostare / archiviare / eliminare
→ documenti collegati da aggiornare
→ verifica necessaria
```

L’utente resta responsabile dell’inserimento nel repository e delle operazioni Git.

Questa modalità riduce gli errori rispetto a una patch terminale, ma richiede comunque una revisione del contenuto completo e dei link prima della rimozione dei vecchi `.mdx`.

---

## 15. Criteri per trasformare un rilievo in task esecutiva

Una voce diventa `PRONTO PER TASK` soltanto quando sono definiti:

- problema dimostrato;
- obiettivo;
- comportamento da preservare;
- file modificabili;
- file consultabili;
- fuori scope;
- dipendenze;
- test;
- massimo tre tentativi;
- report richiesto;
- criteri di successo;
- criteri di stop;
- eventuale collaudo separato;
- impatto documentale;
- decisioni dell’utente risolte.

Una task non deve contenere contemporaneamente:

- audit generale;
- refactor esteso;
- correzione documentale globale;
- implementazione nuova;
- cleanup legacy;
- collaudo live.

Separare i lavori quando possono fallire o essere revisionati indipendentemente.

---

## 16. Criteri di chiusura della revisione

La revisione generale può essere considerata conclusa soltanto quando:

### Documentazione

- ogni area ha un documento owner chiaro;
- i contratti non sono duplicati inutilmente;
- lo stato corrente è separato dalla cronologia;
- link e percorsi sono verificati;
- implementato, validato e futuro sono distinti;
- i documenti legacy sono classificati.

### Codice

- entrypoint e lifecycle sono mappati;
- router ed endpoint sono inventariati;
- side effect e ownership sono chiari;
- persistenza e recovery sono verificati;
- frontend e backend sono confrontati;
- scraper e wrapper sono controllati;
- candidati cleanup sono dimostrati.

### Task completate

- ogni task rilevante ha uno stato reale;
- test automatici e collaudi live sono separati;
- le task non vengono riaperte senza discrepanze concrete;
- i limiti residui sono espliciti.

### Implementazioni future

- ogni proposta è classificata;
- nessuna idea è confusa con un requisito;
- dipendenze e rischi sono espliciti;
- l’utente ha deciso le alternative strutturali.

### Workflow

- ruoli e responsabilità sono definiti;
- prompt e report sono standardizzati;
- Git resta sotto controllo dell’utente;
- revisione e collaudo sono separati quando necessario;
- Todo e registro analitico restano coerenti.

---
