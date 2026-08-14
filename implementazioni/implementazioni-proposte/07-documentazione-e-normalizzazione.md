# Tennis Decision UI — Migrazione documentale e normalizzazione dei registri

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-032 e checkpoint successivi
> **Parte precedente:** [Validazione, fixture e test harness](06-validazione-e-fixture.md)
> **Parte successiva:** [indice](../06-implementazioni-proposte.md)
> **Natura del documento:** closeout documentale. Le sezioni 22–24 conservano la provenance della migrazione e della normalizzazione; la sezione 25 distingue lo stato documentale corrente dalla struttura storica del checkpoint.

## 22. Fase documentale post-audit

### IMPL-032 — Manifest e pipeline di migrazione documentale per batch

**Classificazione:** `NECESSARIA`  
**Stato:** `IMPLEMENTATA E COMPLETATA`  
**Priorità storica al checkpoint:** critica prima della riscrittura canonica

### Problema originario

Prima della migrazione, la documentazione canonica usava `.mdx`, metadata JavaScript e link espliciti alle estensioni correnti.

Una rinomina massiva avrebbe rischiato di:

- lasciare JavaScript nei nuovi `.md`;
- rompere link relativi;
- mantenere duplicati `.mdx`/`.md`;
- perdere contenuti unici;
- promuovere contratti approvati ma non implementati;
- conservare come attivi documenti storici o futuri.

### Pipeline storica di migrazione

La migrazione venne impostata come percorso verificabile e reversibile:

```txt
inventario
→ manifest
→ owner matrix
→ batch piccoli
→ file completi
→ verifica contenuti e link
→ sostituzione
→ eliminazione finale dei vecchi .mdx
```

### Workspace preparatorio storico

Il processo prevedeva un workspace temporaneo:

```txt
docs/migration/tennis-decision-ui/
├── README.md
├── DOCUMENT-INVENTORY.md
├── MIGRATION-MANIFEST.md
├── OWNER-MATRIX.md
├── LINK-REPORT.md
├── BATCH-PLAN.md
└── VALIDATION-CHECKLIST.md
```

Il workspace non era destinato a diventare documentazione tecnica canonica del prodotto.

### Stati usati durante la migrazione

```txt
KEEP_CURRENT
REWRITE_NOW
REWRITE_WITH_CODE
MOVE_TO_VALIDATIONS
ARCHIVE_NON_CANONICAL
DEPRECATE_THEN_REMOVE
REMOVE_AFTER_REPLACEMENT
```

### Regole del closeout

1. la documentazione canonica descrive il codice corrente;
2. una decisione approvata ma non implementata resta nei registri;
3. il futuro non resta nell’indice canonico attivo;
4. un documento storico viene spostato in `docs/validations/` o archivio, non mescolato a un runbook;
5. un file deprecato ma ancora collegato al codice resta disponibile fino alla task di rimozione;
6. nessun `.mdx` viene eliminato prima di `TEST-077…079`;
7. ogni batch mantiene un rollback tramite ripristino dei file precedenti;
8. le sostituzioni vengono consegnate come file completi o ZIP strutturato.

### Batch storici

```txt
Batch 0
→ registri + inventario + manifest

Batch 1
→ convenzioni + indice + README + repository map + context selection

Batch 2
→ architettura + current state + struttura validations

Batch comportamentali
→ API e moduli aggiornati insieme al codice quando il relativo contratto cambia

Batch finale
→ verifica globale link
→ rimozione .mdx sostituiti
→ rimozione riferimenti legacy
→ eliminazione workspace migration
```

### Checkpoint previsti

```txt
TEST-076
TEST-077
TEST-078
TEST-079
```

### Criteri di chiusura registrati

- tutti i documenti canonici finali sono `.md`;
- nessun `export const meta` nei file finali;
- indice e README puntano soltanto a file esistenti;
- nessun duplicato canonico `.mdx`/`.md`;
- storico e validazioni separati;
- futuro non presentato come stato corrente;
- workspace di migrazione rimosso o archiviato dopo il completamento.

### Stato dopo il completamento

La struttura documentale risultante conserva due condizioni di chiusura della migrazione:

```txt
nessun file .mdx nell'albero del repository
nessun path docs/migration/tennis-decision-ui/
```

I batch, il workspace e i checkpoint sopra restano provenance del processo storico e non vanno reinterpretati come attività ancora da eseguire.

---

## 23. Checkpoint dei controlli documentali read-only

`IMPL-001` e `IMPL-005` sono utility Python locali, offline e senza riscrittura automatica dei registri:

```txt
scripts/check_documentation_links.py
scripts/check_registry_consistency.py
```

### Contratto dei checker

Il link checker:

- scansiona `.md` e `.mdx` ricorsivamente;
- esclude per default dipendenze, build, cache e altre aree runtime configurate;
- esclude `legacy/` salvo richiesta esplicita;
- riporta file sorgente, riga e target;
- distingue `target_missing`, `anchor_missing` e `anchor_unverifiable`;
- tratta i link `.mdx` come warning per default;
- può promuovere i link `.mdx` a errore con `--forbid-mdx-links`;
- non modifica i documenti.

Il registry checker:

- raccoglie le schede owner sotto `implementazioni/`;
- confronta le righe canoniche dei Blocchi E/F della Todo con le schede owner;
- rileva owner duplicati, righe sintetiche duplicate, owner senza riga sintetica e righe sintetiche senza owner;
- verifica prefissi dichiarati e contraddizioni di stato strette;
- confronta metadata sintetici quali SHA, range, ultimo Punto, ultimi ID e prossimo passo;
- produce output testo o JSON;
- non rinumera né modifica i registri.

### Test correnti

```txt
scripts/tests/test_check_documentation_links.py
scripts/tests/test_check_registry_consistency.py
```

Le due suite costruiscono repository temporanei per verificare i checker senza operare sui registri reali. Coprono, fra l’altro:

- link validi, target mancanti, anchor mancanti e link `.mdx`;
- esclusione di `legacy/`;
- owner e righe sintetiche mancanti o duplicate;
- prefissi sconosciuti;
- contraddizioni di stato;
- mismatch di SHA, range, ultimo ID, ultimo Punto e prossimo passo;
- output JSON e codici di ritorno non zero in presenza di errori.

### Registrazione nel validation manifest

`scripts/validation/test-manifest.json` registra entrambi i controlli documentali:

```txt
documentation-registry-consistency
documentation-link-check
```

Entrambi sono abilitati nei profili `fast` e `full-offline`; il manifest li classifica come controlli documentali senza mutazioni del filesystem.

### Baseline storica del checkpoint

La prima esecuzione registrata nel closeout aveva rilevato finding reali, non errori dello strumento:

```txt
29 ID con più schede owner
4 TEST sintetici senza scheda owner
1 prefisso DATA- non dichiarato
ultimo TEST-ID sintetico diverso dall'ultimo owner
```

Il primo pacchetto dei checker corresse soltanto le quattro schede `TEST-076…079` mancanti e la dichiarazione del prefisso `DATA-`. La baseline dei 29 owner duplicati venne conservata come finding esplicito e trattata nella normalizzazione descritta nella sezione 24.

### Stato documentato

```txt
IMPL-001 → IMPLEMENTATA E VERIFICATA
IMPL-005 → IMPLEMENTATA E VERIFICATA
IMPL-032 → IMPLEMENTATA E COMPLETATA
```

Lo stato sopra appartiene alle rispettive schede owner correnti. Gli esiti numerici restano riferiti al checkpoint storico.

---

## 24. Normalizzazione controllata degli owner duplicati — checkpoint storico

La baseline prodotta da `IMPL-005` conteneva 29 `duplicate_owner_card`. La normalizzazione registrata nel checkpoint venne eseguita senza rinumerare ID e senza eliminare evidenze o decisioni.

### Regola applicata al checkpoint

```txt
scheda più completa e aggiornata
→ owner canonico

scoperta iniziale o ampliamento intermedio
→ nota/addendum collegato

riferimento nel registro codice a una implementazione proposta
→ riferimento audit, non secondo owner
```

Per `IMPL-016…027`, nel checkpoint pre-modularizzazione l’owner canonico era registrato in `implementazioni/06-implementazioni-proposte.md`; le sezioni corrispondenti dell’audit codice restavano riferimenti analitici.

Per i finding ampliati durante i Punti successivi, l’owner venne scelto in base a completezza e stato del checkpoint, non alla sola posizione cronologica. Quando la scheda iniziale era più completa, il suo stato venne aggiornato e le occorrenze successive rimasero addenda.

### Matrice storica del checkpoint pre-modularizzazione

> I path di questa matrice descrivono la struttura documentale del checkpoint in cui avvenne la normalizzazione. Non sono pointer agli owner correnti dopo la modularizzazione.

| ID             | Owner canonico al checkpoint                           | Trattamento delle altre occorrenze                  |
| -------------- | ------------------------------------------------------ | --------------------------------------------------- |
| `CLEANUP-002`  | `03-audit-codice.md` — offline check e authority       | ampliamento successivo conservato come addendum     |
| `CODE-002`     | `03-audit-codice.md` — preflight Betfair               | ampliamento sulla validazione condivisa conservato  |
| `CODE-005`     | `03-audit-codice.md` — lint frontend                   | ampliamento finale conservato come addendum         |
| `DOC-017`      | `02-audit-documentazione.md`                           | riferimento nel registro codice non owner           |
| `EVIDENCE-001` | `03-audit-codice.md` — implementazione mancante        | decisione iniziale conservata come nota collegata   |
| `FRONTEND-001` | `03-audit-codice.md` — risposte tardive                | due ampliamenti conservati come addendum            |
| `FRONTEND-002` | `03-audit-codice.md` — persistence integrity UI        | ampliamento finale conservato                       |
| `FRONTEND-003` | `03-audit-codice.md` — Start fallito                   | due ampliamenti conservati come addendum            |
| `FRONTEND-005` | `03-audit-codice.md` — loop dopo cleanup               | nota iniziale conservata                            |
| `FRONTEND-006` | `03-audit-codice.md` — Start/Stop concorrenti          | nota iniziale conservata                            |
| `FRONTEND-007` | `03-audit-codice.md` — modalità statica dopo Stop      | nota iniziale conservata                            |
| `IMPL-009`     | `06-implementazioni-proposte.md` — adapter persistence | estensione pannello globale conservata              |
| `IMPL-016…027` | `06-implementazioni-proposte.md`                       | riferimenti sintetici del registro codice non owner |
| `PYTHON-001`   | `03-audit-codice.md` — network capture                 | ampliamento successivo conservato                   |
| `RUNTIME-002`  | `03-audit-codice.md` — invalidazione sessione          | ampliamento successivo conservato                   |
| `SECURITY-002` | `03-audit-codice.md` — cache Betfair                   | ampliamento successivo conservato                   |
| `TEST-002`     | `03-audit-codice.md` — copertura lifecycle hook        | requisiti aggiuntivi conservati come addendum       |
| `TEST-003`     | `03-audit-codice.md` — inventario e runner test        | nota iniziale conservata                            |

### Esito storico del checkpoint

```txt
duplicate_owner_card → 0
owner_without_synthetic_row → 0
synthetic_row_without_owner → 0
unknown_prefix → 0
state_mismatch → 0
checkpoint mismatch → 0
```

La normalizzazione registrata in quel checkpoint modificò titoli di ownership e aggiornamenti di stato del registro senza eliminare i contenuti sostanziali delle occorrenze conservate.

I valori sopra sono evidence del checkpoint storico e restano riferiti a quel momento della normalizzazione.

---

## 25. Stato documentale corrente dopo la modularizzazione

Dopo il checkpoint di normalizzazione, i tre registri principali coinvolti nella matrice storica sono diventati facade/indici:

```txt
implementazioni/02-audit-documentazione.md
implementazioni/03-audit-codice.md
implementazioni/06-implementazioni-proposte.md
```

Nella struttura corrente:

- `02-audit-documentazione.md` indicizza i moduli child dell’audit documentale;
- `03-audit-codice.md` dichiara esplicitamente di essere l’indice corrente e di non contenere schede owner;
- `06-implementazioni-proposte.md` è l’indice corrente delle schede `IMPL-*`, che vivono nei moduli tematici child.

Di conseguenza, i path della matrice della sezione 24 restano provenance corretta del checkpoint ma non devono essere usati come owner path correnti.

### Collocazione corrente degli owner citati nella matrice storica

| ID             | Owner corrente                                                            |
| -------------- | ------------------------------------------------------------------------- |
| `CLEANUP-002`  | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `CODE-002`     | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `CODE-005`     | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `DOC-017`      | `implementazioni/audit-documentazione/02-moduli-frontend-python.md`       |
| `EVIDENCE-001` | `implementazioni/audit-codice/04-evidence-market-reactions.md`            |
| `FRONTEND-001` | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `FRONTEND-002` | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `FRONTEND-003` | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `FRONTEND-005` | `implementazioni/audit-codice/05-frontend-session-shell.md`               |
| `FRONTEND-006` | `implementazioni/audit-codice/05-frontend-session-shell.md`               |
| `FRONTEND-007` | `implementazioni/audit-codice/05-frontend-session-shell.md`               |
| `IMPL-009`     | `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md`  |
| `IMPL-016…018` | `implementazioni/implementazioni-proposte/02-runtime-betfair.md`          |
| `IMPL-019…021` | `implementazioni/implementazioni-proposte/03-storage-recovery.md`         |
| `IMPL-022…024` | `implementazioni/implementazioni-proposte/04-evidence-provenance.md`      |
| `IMPL-025…027` | `implementazioni/implementazioni-proposte/05-frontend-session-polling.md` |
| `PYTHON-001`   | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `RUNTIME-002`  | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `SECURITY-002` | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `TEST-002`     | `implementazioni/audit-codice/01-rilievi-iniziali.md`                     |
| `TEST-003`     | `implementazioni/audit-codice/06-validazione-e-test.md`                   |

### Regola di interpretazione corrente

```txt
facade/indice
→ orienta verso i moduli

heading owner canonico nel modulo child
→ definisce la collocazione corrente

nota, addendum o ampliamento
→ conserva contesto
→ non diventa automaticamente un secondo owner

prefisso dell'ID
→ non determina da solo la directory owner
```

La modularizzazione non riscrive la storia del checkpoint: cambia soltanto il modo in cui gli owner correnti sono distribuiti. Questo documento conserva quindi entrambe le viste senza confonderle:

```txt
migrazione storica
→ checker e checkpoint
→ normalizzazione storica degli owner
→ struttura owner corrente post-modularizzazione
```

Nessuna ulteriore riconciliazione viene dichiarata come eseguita soltanto sulla base di report, TODO o addenda storici.
