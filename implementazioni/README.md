# Tennis Decision UI — Registro modulare della revisione

Questa cartella contiene il registro analitico operativo della revisione. Non sostituisce la documentazione tecnica canonica del progetto.

## Ordine di lettura minimo

1. [Metodo, stati e regole](./00-metodo-e-stati.md)
2. [Piano generale dell’audit](./01-piano-generale-audit.md)
3. file tematico necessario per l’area corrente;
4. [Decisioni dell’utente](./99-decisioni-utente.md), quando una scelta influisce sul lavoro.

## File

- [00-metodo-e-stati.md](./00-metodo-e-stati.md) — fonti, stati, classificazioni e regole;
- [01-piano-generale-audit.md](./01-piano-generale-audit.md) — ordine e perimetro delle analisi;
- [02-audit-documentazione.md](./02-audit-documentazione.md) — rilievi e checklist documentali;
- [03-audit-codice.md](./03-audit-codice.md) — indice dell’audit del codice suddiviso per dominio;
  - [01-rilievi-iniziali.md](./audit-codice/01-rilievi-iniziali.md) — rilievi iniziali e Punto 1;
  - [02-runtime-sessioni-betfair.md](./audit-codice/02-runtime-sessioni-betfair.md) — Punti 2–3, runtime e Betfair;
  - [03-storage-recovery.md](./audit-codice/03-storage-recovery.md) — Punto 4, storage e recovery;
  - [04-evidence-market-reactions.md](./audit-codice/04-evidence-market-reactions.md) — Punto 5, Evidence;
  - [05-frontend-session-shell.md](./audit-codice/05-frontend-session-shell.md) — Punto 6, frontend;
  - [06-validazione-e-test.md](./audit-codice/06-validazione-e-test.md) — Punto 7, test e validazione;
  - [07-post-audit-e-migrazione.md](./audit-codice/07-post-audit-e-migrazione.md) — chiusura post-audit e migrazione;
- [04-task-completate.md](./04-task-completate.md) — verifica delle task dichiarate concluse;
- [05-audit-docs-planning.md](./05-audit-docs-planning.md) — trattamento differito di `docs/planning`;
- [06-implementazioni-proposte.md](./06-implementazioni-proposte.md) — implementazioni da valutare;
- [99-decisioni-utente.md](./99-decisioni-utente.md) — decisioni strutturali.

## Regole

- gli ID dei rilievi sono globali e non vanno rinumerati;
- una voce dettagliata vive in un solo file;
- la Todo in root è la vista sintetica unica;
- i file di questa cartella non sono documenti canonici dell’architettura;
- ogni aggiornamento sostanziale deve riportare lo SHA verificato;
- non caricare tutti i file nel contesto quando basta il modulo pertinente;
- i file indice non devono duplicare le schede owner contenute nei moduli;
- i checker devono scandire ricorsivamente i Markdown sotto `implementazioni/`.
