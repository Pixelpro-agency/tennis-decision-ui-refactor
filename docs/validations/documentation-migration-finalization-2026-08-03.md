# Chiusura della migrazione documentale — 3 agosto 2026

## Scopo

Questo record documenta la chiusura della migrazione della documentazione tecnica da MDX a Markdown ordinario.

Non descrive modifiche al comportamento applicativo e non sostituisce gli owner tecnici in `docs/tennis-decision-ui/`.

## Risultato

La migrazione finale ha prodotto:

- 40 file `.mdx` rimossi dalla documentazione canonica;
- 28 owner residui convertiti strutturalmente in `.md`;
- 8 owner già riscritti mantenuti nelle destinazioni Markdown approvate;
- 2 collaudi storici mantenuti in `docs/validations/`;
- 2 specifiche future inizialmente spostate nel planning non canonico e successivamente consolidate nei registri;
- metadata JavaScript `export const meta` rimossi dagli owner convertiti;
- link relativi aggiornati verso le destinazioni finali;
- workspace `docs/migration/` e report temporanei di consegna rimossi.

## Materiale locale classificato

Conservato in `docs/archive/`:

- brief storico Source Identity;
- prompt di navigazione e modularizzazione;
- backlog, pacchetti esecutivi e report storici;
- due documenti ODT con idee future.

Eliminato dalla superficie documentale:

- `docs/_work/`, composto da template temporanei;
- `docs/percorsi.txt`, sostituito dall'indice e dalla repository map;
- `docs/planning/docs.rar`, archivio binario opaco e duplicato;
- `DELIVERY-MANIFEST.md` e `VALIDATION-REPORT.md`, report temporanei dei pacchetti;
- cache Python generate localmente.

## Follow-up di pulizia — 4 agosto 2026

Dopo la verifica remota del commit documentale, le dieci fonti conservate
inizialmente sotto `docs/archive/` sono state rilette e confrontate con owner,
registri e validations.

Il contenuto ancora utile è stato consolidato in `IMPL-010`, `IMPL-012`,
`IMPL-018`, `IMPL-023`, nei documenti di workflow e nelle validations Source
Identity. Le copie separate — inclusi quattro documenti legacy, due planning,
un brief, un prompt e due ODT — sono state rimosse. `docs/archive/README.md`
conserva la mappa fonte → destinazione.

La pulizia non modifica codice applicativo e non presenta le idee future come
funzionalità implementate.

Controlli del follow-up sulla copia:

```text
Markdown residui:           56
Link strict:                56 file, 365 link, 0 errori, 0 warning
Registry consistency:       240 owner, 214 righe, 0 errori, 0 warning
Python checker tests:       29 passati
Validation runner tests:    19 passati
```

## Controlli eseguiti sulla copia documentale

```text
Python checker tests:       29 passati, 0 falliti
Validation runner tests:    19 passati, 0 falliti
Documentation link strict:  0 errori, 0 warning
Registry consistency:       0 errori, 0 warning
File MDX residui:           0
export const meta residui:  0 negli owner canonici
```

Il confronto dimensionale dei 28 owner convertiti ha confermato che ciascun nuovo file conserva il corpo del sorgente, con variazioni limitate alla rimozione del blocco metadata e all'aggiornamento dei percorsi.

## Limite della verifica

L'archivio usato per costruire il pacchetto finale conteneva documentazione, registri e script, ma non l'intera copia di backend, frontend, launcher e scraper.

Il profilo `full-offline` è stato rieseguito sulla working tree reale dopo la migrazione e dopo il cleanup dell'archivio. Entrambe le esecuzioni hanno restituito exit code `0`.

## Gate post-applicazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs full-offline
```

Risultato verificato sulla working tree reale:

```text
STRICT_LINKS=0
REGISTRY=0
FULL_OFFLINE=0
```

## Verifica della pubblicazione remota — 4 agosto 2026

La migrazione documentale finale è stata pubblicata con:

```text
2697f66ea8e17a9e35481299cb47ec402558df55
docs: finalize canonical documentation migration
```

Il cleanup delle fonti archive consolidate è stato pubblicato con:

```text
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
docs: remove consolidated legacy archive
```

Verifica conclusiva del cleanup:

```text
LOCAL=3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
REMOTE=3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
PUSH_CLEANUP_VERIFICATO=1

LINKS=0
REGISTRY=0
FULL_OFFLINE=0
DIFF_CHECK=0
```

La fase documentale è chiusa. Il prossimo lavoro tecnico è `IMPL-015` —
writer authority esclusiva per `match_history`.
