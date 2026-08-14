# Tennis Decision UI — Audit del codice

Questo file è l’indice del registro storico dell’audit tecnico, suddiviso per dominio in sette moduli. I moduli conservano rilievi, decisioni e stati riferiti ai rispettivi checkpoint: non costituiscono la documentazione tecnica canonica del comportamento corrente, che resta sotto `docs/tennis-decision-ui/`.

## Moduli

| Parte | Modulo                                                                      | Perimetro                                                      |
| ----: | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1     | [Rilievi iniziali e Punto 1](audit-codice/01-rilievi-iniziali.md)           | Finding iniziali, entry point, launcher e writer authority     |
| 2     | [Runtime, sessioni e Betfair](audit-codice/02-runtime-sessioni-betfair.md)  | Start/Stop, generazioni, Betfair, Graph, diagnostica e cleanup |
| 3     | [Storage, journal e recovery](audit-codice/03-storage-recovery.md)          | Persistenza, documenti canonici, journal e recovery            |
| 4     | [Evidence e Market Reactions](audit-codice/04-evidence-market-reactions.md) | Provenance, alignment, eligibility e confronti cross-source    |
| 5     | [Frontend e session shell](audit-codice/05-frontend-session-shell.md)       | Session controller, polling, integrity UI e presentazione      |
| 6     | [Validazione e test](audit-codice/06-validazione-e-test.md)                 | Runner, fixture, sandbox, harness e result ledger              |
| 7     | [Post-audit e migrazione](audit-codice/07-post-audit-e-migrazione.md)       | Chiusura dei Punti 1–7 e riallineamenti storici successivi     |

## Mappa rapida

| Area                                                        | Parte |
| ----------------------------------------------------------- | ----: |
| Launcher, runtime iniziale, Strategy, Preflight e sicurezza | 1     |
| Sessioni backend, Betfair, Graph e network capture          | 2     |
| Storage, commit concorrenti, integrity e recovery           | 3     |
| Evidence, timestamp, source skew e Market Reactions         | 4     |
| Session shell, polling e integrity frontend                 | 5     |
| Test runner, fixture, harness e artefatti                   | 6     |
| Chiusura dell’audit, migrazione e riallineamenti storici    | 7     |

## Regole

- ogni scheda owner del registro vive in un solo modulo;
- gli ID, gli stati e le decisioni storiche non vengono rinumerati;
- la Todo resta la vista sintetica unica dello stato delle attività;
- lo storico delle revisioni è affidato ai commit Git;
- questo indice non contiene schede owner, contratti tecnici né matrici di validazione;
- baseline, stati e verifiche riportati nei moduli appartengono ai rispettivi checkpoint e non attestano da soli il comportamento corrente;
- dopo una modifica documentale eseguire `python scripts/check_registry_consistency.py`, `python scripts/check_documentation_links.py --forbid-mdx-links`, `node scripts/validation/run.mjs fast` e `git diff --check`.

## Stato dell’audit

```txt
Punto 7 completato
→ attività storica di audit dei Punti 1–7 conclusa
→ attività tecniche, test e verifiche live restano governati dai rispettivi owner e dalla Todo
→ nessuna nuova task selezionata automaticamente
```
