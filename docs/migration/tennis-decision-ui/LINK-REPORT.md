# Report dei link — Batch 0

## Base

`eef267aab3c138395a5ca3d644a942190c5360e8`

## Controlli eseguiti

- `docs/tennis-decision-ui/index.mdx` letto integralmente come inventario di navigazione;
- tutti i **40** target elencati dall’indice sono stati aperti sul commit base;
- il link del `README.md` verso `docs/tennis-decision-ui/index.mdx` è coerente con il file presente;
- i riferimenti testuali a `docs/tennis-decision-ui/chapters/` e `sections/` sono stati verificati come non presenti sul commit base;
- nessun link è stato modificato nel Batch 0.

## Anomalie confermate

1. tutte le destinazioni canoniche usano estensione `.mdx`;
2. i documenti usano `export const meta` non compatibile con Markdown ordinario;
3. l’indice contiene una sezione legacy per directory che non risultano presenti;
4. `README.md` punta ancora a `index.mdx`;
5. i documenti futuri Replay e Market Reactions Journal sono ancora nell’indice attivo;
6. le validazioni live sono collocate sotto `operations/` invece di una sezione storica dedicata.

## Controlli non ancora eseguiti

Il Batch 0 non dispone ancora del link checker locale `IMPL-001`. Prima di rimuovere un `.mdx` devono essere eseguiti:

```txt
scansione ricorsiva di tutti i file versionati
→ estrazione link Markdown
→ risoluzione relativa
→ ricerca riferimenti testuali .mdx
→ ricerca export const meta
→ ricerca duplicati .mdx/.md
```

## Regola per i batch

Ogni batch deve produrre un aggiornamento di questo report con:

- file nuovi;
- file sostituiti;
- link modificati;
- link risolti;
- link ancora bloccati da documenti non migrati;
- vecchi file che possono essere eliminati;
- rollback.
