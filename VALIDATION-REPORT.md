# Validation report — Migrazione documentale Batch 0

## Esito

- controlli eseguiti: **63**;
- passati: **63**;
- falliti: **0**.

## Controlli principali

- [x] base blob implementazioni-tennis-decision-ui.md — `7a58ebe45f778250f36cd6f5f126009ec25953bc`
- [x] base blob todo-list-tennis-decision-ui.md — `19e60e21943f7334f22b9a1f87fcba6642c86023`
- [x] base blob implementazioni/03-audit-codice.md — `ef23e02801d91452519e5495782c8273c6cabb65`
- [x] base blob implementazioni/06-implementazioni-proposte.md — `a4765546727cb6b0062c578b543783d8e1f9af4f`
- [x] base blob implementazioni/99-decisioni-utente.md — `26e515f6c60a5819cc9d5ab976416767fb827858`
- [x] append-only implementazioni/03-audit-codice.md — `old=144580 new=149113`
- [x] append-only implementazioni/06-implementazioni-proposte.md — `old=63848 new=66755`
- [x] append-only implementazioni/99-decisioni-utente.md — `old=18978 new=21336`
- [x] fences DELIVERY-MANIFEST.md — `fences=0`
- [x] utf8 replacement DELIVERY-MANIFEST.md
- [x] fences implementazioni-tennis-decision-ui.md — `fences=10`
- [x] utf8 replacement implementazioni-tennis-decision-ui.md
- [x] fences VALIDATION-REPORT.md — `fences=0`
- [x] utf8 replacement VALIDATION-REPORT.md
- [x] fences todo-list-tennis-decision-ui.md — `fences=16`
- [x] utf8 replacement todo-list-tennis-decision-ui.md
- [x] fences implementazioni/03-audit-codice.md — `fences=664`
- [x] utf8 replacement implementazioni/03-audit-codice.md
- [x] fences implementazioni/99-decisioni-utente.md — `fences=48`
- [x] utf8 replacement implementazioni/99-decisioni-utente.md
- [x] fences implementazioni/06-implementazioni-proposte.md — `fences=392`
- [x] utf8 replacement implementazioni/06-implementazioni-proposte.md
- [x] fences docs/migration/tennis-decision-ui/OWNER-MATRIX.md — `fences=0`
- [x] utf8 replacement docs/migration/tennis-decision-ui/OWNER-MATRIX.md
- [x] fences docs/migration/tennis-decision-ui/MIGRATION-MANIFEST.md — `fences=0`
- [x] utf8 replacement docs/migration/tennis-decision-ui/MIGRATION-MANIFEST.md
- [x] fences docs/migration/tennis-decision-ui/DOCUMENT-INVENTORY.md — `fences=0`
- [x] utf8 replacement docs/migration/tennis-decision-ui/DOCUMENT-INVENTORY.md
- [x] fences docs/migration/tennis-decision-ui/LINK-REPORT.md — `fences=2`
- [x] utf8 replacement docs/migration/tennis-decision-ui/LINK-REPORT.md
- [x] fences docs/migration/tennis-decision-ui/README.md — `fences=4`
- [x] utf8 replacement docs/migration/tennis-decision-ui/README.md
- [x] fences docs/migration/tennis-decision-ui/VALIDATION-CHECKLIST.md — `fences=0`
- [x] utf8 replacement docs/migration/tennis-decision-ui/VALIDATION-CHECKLIST.md
- [x] fences docs/migration/tennis-decision-ui/BATCH-PLAN.md — `fences=8`
- [x] utf8 replacement docs/migration/tennis-decision-ui/BATCH-PLAN.md
- [x] no meta JS OWNER-MATRIX.md
- [x] no meta JS MIGRATION-MANIFEST.md
- [x] no meta JS DOCUMENT-INVENTORY.md
- [x] no meta JS LINK-REPORT.md
- [x] no meta JS README.md
- [x] no meta JS VALIDATION-CHECKLIST.md
- [x] no meta JS BATCH-PLAN.md
- [x] ID new DOC-033 — `count=3`
- [x] ID new WORKFLOW-005 — `count=3`
- [x] ID new IMPL-032 — `count=6`
- [x] ID new TEST-076 — `count=6`
- [x] ID new TEST-077 — `count=43`
- [x] ID new TEST-078 — `count=5`
- [x] ID new TEST-079 — `count=5`
- [x] ID new DEC-025 — `count=5`
- [x] inventory 41 rows — `rows=41`
- [x] inventory unique paths — `unique=41`
- [x] inventory canonical 40
- [x] inventory README
- [x] manifest 41 rows — `rows=41`
- [x] manifest old paths match inventory — `missing=set() extra=set()`
- [x] manifest old unique
- [x] manifest new no mdx
- [x] manifest new unique — `duplicates=[]`
- [x] scope only registers + migration workspace — `unexpected=[]`
- [x] no canonical replacements batch0 — `[]`
- [x] new package relative links — `broken=[]`

## Verifiche repository effettuate

- i cinque registri sorgente coincidono con i blob remoti del commit `eef267aab3c138395a5ca3d644a942190c5360e8`;
- tutti i 40 target elencati da `docs/tennis-decision-ui/index.mdx` sono stati aperti sul commit base;
- `docs/tennis-decision-ui/chapters/` e `sections/` non risultano presenti;
- nessun file applicativo o canonico è modificato nel Batch 0.

## Test non applicabili o non eseguiti

- nessuna suite Node/Python/frontend: il codice non cambia;
- nessun collaudo browser o live;
- il link checker ricorsivo dell’intera repository (`IMPL-001`) non esiste ancora; il Batch 0 verifica i target dell’indice e i link interni al pacchetto.

## Criterio di consegna

Il pacchetto è consegnabile soltanto con `failed = 0`.
