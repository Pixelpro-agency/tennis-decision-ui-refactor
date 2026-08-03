# DELIVERY-MANIFEST — Migrazione documentale Batch 0

- Base remota: `eef267aab3c138395a5ca3d644a942190c5360e8`
- Codice verificato: `275008a5cd6451f24c6895068639ee3055395986`
- Modifiche applicative: nessuna
- Documenti canonici sostituiti: nessuno
- Vecchi `.mdx` eliminati: nessuno

## File inclusi

| File | Byte | SHA-256 |
|---|---:|---|
| `VALIDATION-REPORT.md` | 4831 | `4bca2fbe38cab62d131ff5139e98cad1eed92df686f89563498b58dffd193fcb` |
| `docs/migration/tennis-decision-ui/BATCH-PLAN.md` | 2239 | `1d5deea26456eb03f44e84b614cb35001ca6a49c58252afe05098f6a5ec9d6a6` |
| `docs/migration/tennis-decision-ui/DOCUMENT-INVENTORY.md` | 8513 | `2101927e6f0272615956a2c547b7896ab101069b702010e1a39bc364cf386ad9` |
| `docs/migration/tennis-decision-ui/LINK-REPORT.md` | 1671 | `79acb80cceffc78032ff796fd38a58679a493ae1bebb4c9ea1accdb07fb58064` |
| `docs/migration/tennis-decision-ui/MIGRATION-MANIFEST.md` | 9126 | `d5ea9d3b34933c1f8d6ee0e13b75f3754dc9b2972bde77c3d6a1f7504f96c8c1` |
| `docs/migration/tennis-decision-ui/OWNER-MATRIX.md` | 4488 | `caa5686ecc8d7120cbc90263f56f817b0d1bfd64ea4282b374a36c340a14f5aa` |
| `docs/migration/tennis-decision-ui/README.md` | 1745 | `4e737018b7faeaccf169b0fdaa30c043e2c42456fca577691f522c80b25aaae0` |
| `docs/migration/tennis-decision-ui/VALIDATION-CHECKLIST.md` | 1713 | `d59b624edfb8cae797593c688a425e35972f32f9a7e6d7fb44068811592389ba` |
| `implementazioni/03-audit-codice.md` | 149113 | `bb574ff74c7c3b37ef4b991bb6feeb47ffc9a18f80ea96fa3bd1c63563c59a7e` |
| `implementazioni/06-implementazioni-proposte.md` | 66755 | `3aeefd88e03bf54f21d725099cacbf22537aab9e56885182da3f41605d593392` |
| `implementazioni/99-decisioni-utente.md` | 21336 | `4335d1976f5522a79245fb250c234cefc0631c20025135225fa8b13d99cbcb7d` |
| `implementazioni-tennis-decision-ui.md` | 4121 | `ca92daf1da6e683f2419365eba2b4ddcaa42fe4b439ba7c47ebe26da92f72498` |
| `todo-list-tennis-decision-ui.md` | 46282 | `219c8d4f9b82cd6f9be2d9af8d61076a3d9f5ee8f7bb068eeb022ae215fdadd0` |

## Applicazione

Estrarre lo ZIP nella root del repository. I cinque registri vengono aggiornati e viene aggiunta la cartella temporanea `docs/migration/tennis-decision-ui/`.

## Rollback

Prima del commit: ripristinare i cinque registri e rimuovere `docs/migration/tennis-decision-ui/`, `DELIVERY-MANIFEST.md` e `VALIDATION-REPORT.md`. Dopo il commit: revert del singolo commit documentale.

## Controlli dichiarati

- confronto dei cinque file base con i blob remoti del commit `eef267a`;
- verifica dei 40 target dell’indice;
- verifica assenza `chapters/` e `sections/`;
- controllo ID nuovi non duplicati;
- verifica fence Markdown e UTF-8;
- verifica mapping inventario/manifest;
- verifica link nuovi del pacchetto;
- verifica ZIP finale;
- nessun test applicativo eseguito perché il codice non cambia.
