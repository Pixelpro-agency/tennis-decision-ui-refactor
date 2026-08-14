# Chiusura della migrazione documentale — 3 agosto 2026

## Scopo

Questo record documenta la chiusura della campagna di migrazione della documentazione tecnica da MDX a Markdown ordinario, avviata il 3 agosto 2026 e completata con il follow-up di pulizia e pubblicazione del 4 agosto 2026.

I risultati e i conteggi riportati appartengono ai checkpoint storici indicati. Il documento non descrive modifiche al comportamento applicativo, non rappresenta lo stato corrente della repository e non sostituisce gli owner tecnici in `docs/tennis-decision-ui/`.

## Risultato della migrazione

Al checkpoint della migrazione finale risultavano:

- 40 file `.mdx` rimossi dalla documentazione canonica;
- 28 owner residui convertiti strutturalmente in `.md`;
- 8 owner già riscritti mantenuti nelle destinazioni Markdown approvate;
- 2 collaudi storici mantenuti in `docs/validations/`;
- 2 specifiche future inizialmente spostate nel planning non canonico e successivamente consolidate nei registri;
- metadata JavaScript `export const meta` rimossi dagli owner convertiti;
- link relativi aggiornati verso le destinazioni finali;
- workspace `docs/migration/` e report temporanei di consegna rimossi.

## Materiale locale classificato

Nella prima fase della campagna furono conservati in `docs/archive/`:

- brief storico Source Identity;
- prompt di navigazione e modularizzazione;
- backlog, pacchetti esecutivi e report storici;
- due documenti ODT con idee future.

Furono invece eliminati dalla superficie documentale:

- `docs/_work/`, composto da template temporanei;
- `docs/percorsi.txt`, sostituito dall'indice e dalla repository map;
- `docs/planning/docs.rar`, archivio binario opaco e duplicato;
- `DELIVERY-MANIFEST.md` e `VALIDATION-REPORT.md`, report temporanei dei pacchetti;
- cache Python generate localmente.

Questa classificazione descrive il passaggio intermedio della campagna e non attesta l'esistenza corrente dei percorsi citati.

## Follow-up di pulizia — 4 agosto 2026

Dopo la verifica remota del commit documentale, le dieci fonti conservate inizialmente sotto `docs/archive/` furono rilette e confrontate con owner, registri e validations.

Il contenuto ancora utile fu consolidato in `IMPL-010`, `IMPL-012`, `IMPL-018`, `IMPL-023`, nei documenti di workflow e nelle validations Source Identity. Le copie separate — quattro documenti legacy, due planning, un brief, un prompt e due ODT — furono rimosse. Al checkpoint del cleanup, `docs/archive/README.md` conservava la mappa fonte → destinazione.

La pulizia non modificò codice applicativo e non presentò le idee future come funzionalità implementate.

Controlli registrati per il follow-up sulla copia:

```text
Markdown residui:           56
Link strict:                56 file, 365 link, 0 errori, 0 warning
Registry consistency:       240 owner, 214 righe, 0 errori, 0 warning
Python checker tests:       29 passati
Validation runner tests:    19 passati
```

## Controlli eseguiti sulla copia documentale

Il record di campagna riporta i seguenti esiti:

```text
Python checker tests:       29 passati, 0 falliti
Validation runner tests:    19 passati, 0 falliti
Documentation link strict:  0 errori, 0 warning
Registry consistency:       0 errori, 0 warning
File MDX residui:           0
export const meta residui:  0 negli owner canonici
```

Il confronto dimensionale dei 28 owner convertiti, con rapporto fra dimensioni compreso fra `0,998` e `1,001`, non indicò troncamenti sostanziali. Questo controllo non dimostra l'identità esatta o la preservazione semanticamente integrale dei corpi: una prova di quel livello richiederebbe un diff normalizzato per file e la classificazione di ogni differenza.

## Limiti della verifica

L'archivio usato per costruire il pacchetto finale conteneva documentazione, registri e script, ma non l'intera copia di backend, frontend, launcher e scraper. I controlli eseguiti sulla copia documentale non costituiscono quindi una validazione live o una verifica completa del prodotto.

Il profilo `full-offline` fu inoltre rieseguito sulla working tree applicativa reale dopo la migrazione e dopo il cleanup dell'archivio. Il record storico riporta exit code `0` per entrambe le esecuzioni. Il profilo era offline e i suoi risultati restano limitati alle entry abilitate dal relativo manifest al momento dell'esecuzione.

## Gate post-applicazione

Sulla working tree applicativa reale furono eseguiti:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs full-offline
```

Esito registrato:

```text
STRICT_LINKS=0
REGISTRY=0
FULL_OFFLINE=0
```

Questi codici attestano l'esito dei comandi nella specifica esecuzione storica; non attestano da soli che il contenuto non committato della working tree coincidesse integralmente con un determinato commit.

## Verifica della pubblicazione remota — 4 agosto 2026

La migrazione documentale finale fu pubblicata con:

```text
2697f66ea8e17a9e35481299cb47ec402558df55
docs: finalize canonical documentation migration
```

Il cleanup delle fonti archive consolidate fu pubblicato con:

```text
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
docs: remove consolidated legacy archive
```

La verifica conclusiva del cleanup registrò:

```text
LOCAL=3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
REMOTE=3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
PUSH_CLEANUP_VERIFICATO=1

LINKS=0
REGISTRY=0
FULL_OFFLINE=0
DIFF_CHECK=0
```

L'uguaglianza registrata fra i riferimenti locale e remoto confermò la pubblicazione del commit di cleanup; non costituisce, da sola, prova dell'assenza di modifiche non committate nella working tree.

## Chiusura storica

La campagna documentale del 3–4 agosto 2026 fu dichiarata chiusa. Al relativo checkpoint, il lavoro tecnico indicato come successivo era `IMPL-015` — writer authority esclusiva per `match_history`. Questa indicazione appartiene alla sequenza storica della campagna e non definisce la roadmap corrente.
