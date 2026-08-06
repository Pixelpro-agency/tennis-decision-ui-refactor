# Tennis Decision UI — Migrazione documentale e normalizzazione dei registri

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-032 e checkpoint successivi
> **Parte precedente:** [Validazione, fixture e test harness](06-validazione-e-fixture.md)
> **Parte successiva:** [indice](../06-implementazioni-proposte.md)

## 22. Fase documentale post-audit

### IMPL-032 — Manifest e pipeline di migrazione documentale per batch

**Classificazione:** `NECESSARIA`
**Stato:** `IMPLEMENTATA E COMPLETATA`
**Priorità:** critica prima della riscrittura canonica

### Problema originario

Prima della migrazione, la documentazione canonica usava `.mdx`, metadata JavaScript e link espliciti alle estensioni correnti.

Una rinomina massiva rischierebbe di:

- lasciare JavaScript nei nuovi `.md`;
- rompere link relativi;
- mantenere duplicati `.mdx`/`.md`;
- perdere contenuti unici;
- promuovere contratti approvati ma non implementati;
- conservare come attivi documenti storici o futuri.

### Obiettivo

Creare una migrazione verificabile e reversibile:

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

### Workspace preparatorio

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

Questa cartella è temporanea e non diventa documentazione tecnica canonica del prodotto.

### Stati di migrazione

```txt
KEEP_CURRENT
REWRITE_NOW
REWRITE_WITH_CODE
MOVE_TO_VALIDATIONS
ARCHIVE_NON_CANONICAL
DEPRECATE_THEN_REMOVE
REMOVE_AFTER_REPLACEMENT
```

### Regole

1. la documentazione canonica descrive il codice corrente;
2. una decisione approvata ma non implementata resta nei registri;
3. il futuro non resta nell’indice canonico attivo;
4. un documento storico viene spostato in `docs/validations/` o archivio, non mescolato a un runbook;
5. un file deprecato ma ancora collegato al codice resta disponibile fino alla task di rimozione;
6. nessun `.mdx` viene eliminato prima di `TEST-077…079`;
7. ogni batch ha rollback tramite ripristino dei file precedenti;
8. le sostituzioni vengono consegnate come file completi o ZIP strutturato.

### Batch iniziali

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

### Test minimi

```txt
TEST-076
TEST-077
TEST-078
TEST-079
```

### Criterio di chiusura

- tutti i documenti canonici finali sono `.md`;
- nessun `export const meta` nei file finali;
- indice e README puntano soltanto a file esistenti;
- nessun duplicato canonico `.mdx`/`.md`;
- storico e validazioni separati;
- futuro non presentato come stato corrente;
- workspace di migrazione rimosso o archiviato dopo il completamento.

---

## 23. Checkpoint implementazione dei controlli documentali read-only

`IMPL-001` e `IMPL-005` sono ora implementate come utility Python locali,
offline e senza scritture:

```txt
scripts/check_documentation_links.py
scripts/check_registry_consistency.py
```

### Contratto effettivo

Il link checker:

- scansiona `.md` e `.mdx` ricorsivamente;
- esclude runtime, cache, build, dipendenze e `legacy/` per default;
- riporta file sorgente, riga e target;
- distingue `target_missing`, `anchor_missing` e `anchor_unverifiable`;
- tratta i link `.mdx` come warning durante la migrazione;
- può promuoverli a errore con `--forbid-mdx-links`;
- non modifica i documenti.

Il registry checker:

- confronta le righe canoniche dei Blocchi E/F con le schede owner;
- rileva ID duplicati, owner mancanti e righe sintetiche senza owner;
- verifica prefissi dichiarati e contraddizioni di stato strette;
- confronta SHA sintetici, ultimo Punto, ultimi TEST/IMPL/DEC, range e prossimo passo;
- produce output testo o JSON;
- non rinumera né modifica i registri.

### Test implementati

```txt
scripts/tests/test_check_documentation_links.py
scripts/tests/test_check_registry_consistency.py
```

Le suite usano directory temporanee e non accedono a history, timeline, cache,
profili browser o servizi live.

### Baseline rilevata

La prima esecuzione sui registri del checkpoint ha rilevato finding reali, non
errori dello strumento:

```txt
29 ID con più schede owner
4 TEST sintetici senza scheda owner
1 prefisso DATA- non dichiarato
ultimo TEST-ID sintetico diverso dall'ultimo owner
```

Il primo pacchetto dei checker ha corretto soltanto le quattro schede `TEST-076…079` mancanti e la dichiarazione del prefisso `DATA-`. La baseline dei 29 owner duplicati è stata conservata come finding esplicito e normalizzata nella task separata descritta nella sezione 24.

### Stato

```txt
IMPL-001 → IMPLEMENTATA E VERIFICATA
IMPL-005 → IMPLEMENTATA E VERIFICATA
normalizzazione delle schede duplicate → COMPLETATA
IMPL-028 → IMPLEMENTATA E VALIDATA
IMPL-032 → MIGRAZIONE COMPLETATA
```

---

## 24. Normalizzazione controllata degli owner duplicati

La baseline prodotta da `IMPL-005` conteneva 29 `duplicate_owner_card`. La normalizzazione è stata eseguita senza rinumerare ID e senza eliminare evidenze o decisioni.

### Regola applicata

```txt
scheda più completa e aggiornata
→ owner canonico

scoperta iniziale o ampliamento intermedio
→ nota/addendum collegato

riferimento nel registro codice a una implementazione proposta
→ riferimento audit, non secondo owner
```

Per `IMPL-016…027` l’owner canonico resta in `implementazioni/06-implementazioni-proposte.md`; le sezioni corrispondenti dell’audit codice restano riferimenti analitici.

Per i finding ampliati durante i Punti successivi, l’owner è stato scelto in base a completezza e stato corrente, non alla sola posizione cronologica. Quando la scheda iniziale era più completa, il suo stato è stato aggiornato e le occorrenze successive sono rimaste addendum.

### Matrice degli owner normalizzati

| ID | Owner canonico | Trattamento delle altre occorrenze |
| --- | --- | --- |
| `CLEANUP-002` | `03-audit-codice.md` — offline check e authority | ampliamento successivo conservato come addendum |
| `CODE-002` | `03-audit-codice.md` — preflight Betfair | ampliamento sulla validazione condivisa conservato |
| `CODE-005` | `03-audit-codice.md` — lint frontend | ampliamento finale conservato come addendum |
| `DOC-017` | `02-audit-documentazione.md` | riferimento nel registro codice non owner |
| `EVIDENCE-001` | `03-audit-codice.md` — implementazione mancante | decisione iniziale conservata come nota collegata |
| `FRONTEND-001` | `03-audit-codice.md` — risposte tardive | due ampliamenti conservati come addendum |
| `FRONTEND-002` | `03-audit-codice.md` — persistence integrity UI | ampliamento finale conservato |
| `FRONTEND-003` | `03-audit-codice.md` — Start fallito | due ampliamenti conservati come addendum |
| `FRONTEND-005` | `03-audit-codice.md` — loop dopo cleanup | nota iniziale conservata |
| `FRONTEND-006` | `03-audit-codice.md` — Start/Stop concorrenti | nota iniziale conservata |
| `FRONTEND-007` | `03-audit-codice.md` — modalità statica dopo Stop | nota iniziale conservata |
| `IMPL-009` | `06-implementazioni-proposte.md` — adapter persistence | estensione pannello globale conservata |
| `IMPL-016…027` | `06-implementazioni-proposte.md` | riferimenti sintetici del registro codice non owner |
| `PYTHON-001` | `03-audit-codice.md` — network capture | ampliamento successivo conservato |
| `RUNTIME-002` | `03-audit-codice.md` — invalidazione sessione | ampliamento successivo conservato |
| `SECURITY-002` | `03-audit-codice.md` — cache Betfair | ampliamento successivo conservato |
| `TEST-002` | `03-audit-codice.md` — copertura lifecycle hook | requisiti aggiuntivi conservati come addendum |
| `TEST-003` | `03-audit-codice.md` — inventario e runner test | nota iniziale conservata |

### Esito

```txt
duplicate_owner_card → 0
owner_without_synthetic_row → 0
synthetic_row_without_owner → 0
unknown_prefix → 0
state_mismatch → 0
checkpoint mismatch → 0
```

La normalizzazione modifica esclusivamente titoli di ownership e aggiornamenti di stato del registro. I contenuti sostanziali delle 29 occorrenze restano presenti.

### Stato dopo IMPL-015

```txt
IMPL-015
→ COMPLETATA
→ codice e test pubblicati su ac0361e e f86ac26
→ documentazione riallineata
```

Nessuna task successiva viene selezionata da questo riallineamento.
