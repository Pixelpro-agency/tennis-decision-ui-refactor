# Migrazione documentale Tennis Decision UI — Batch 0

## Stato

```txt
Base codice verificata: 275008a5cd6451f24c6895068639ee3055395986
Checkpoint registri: eef267aab3c138395a5ca3d644a942190c5360e8
Batch: 0 — inventario e manifest
Sostituzioni canoniche: nessuna
Cancellazioni: nessuna
```

## Scopo

Questa cartella è un workspace temporaneo per la migrazione della documentazione tecnica da `.mdx` a Markdown `.md` ordinario.

Non è documentazione canonica del prodotto e non sostituisce:

- `docs/tennis-decision-ui/`;
- il codice corrente;
- i test;
- i registri `implementazioni/`.

## Regola principale

```txt
documentazione canonica
→ descrive il codice realmente presente

contratto approvato ma non implementato
→ resta nei registri

funzione futura
→ non resta nell’indice canonico attivo
```

## Contenuti

- `DOCUMENT-INVENTORY.md`: inventario dei documenti indicizzati e dei riferimenti collegati;
- `MIGRATION-MANIFEST.md`: mapping vecchio percorso → destinazione/azione;
- `OWNER-MATRIX.md`: owner documentali e code owner principali;
- `LINK-REPORT.md`: link verificati, anomalie e controlli ancora necessari;
- `BATCH-PLAN.md`: ordine della riscrittura;
- `VALIDATION-CHECKLIST.md`: controlli obbligatori prima di ogni consegna.

## Confini del Batch 0

Il Batch 0 non:

- rinomina file;
- crea sostituti canonici;
- aggiorna link nei documenti correnti;
- elimina `.mdx`;
- modifica codice, test o runtime.

## Uscita dal workspace

La cartella verrà rimossa o archiviata dopo che:

1. tutti i documenti finali saranno `.md`;
2. tutti i link saranno validi;
3. non esisteranno duplicati canonici `.mdx`/`.md`;
4. i report storici saranno separati;
5. l’indice finale descriverà soltanto documenti attivi.
