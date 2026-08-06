# Tennis Decision UI — Audit della documentazione

Questo file è l’indice corrente del registro `DOC-*` e `WORKFLOW-*` relativo all’audit documentale.

## Moduli

| Modulo | Perimetro |
| --- | --- |
| [Rilievi iniziali e API](audit-documentazione/01-rilievi-iniziali-e-api.md) | Sezioni 9–11; DOC-001…013 e WORKFLOW-001 |
| [Moduli, frontend e Python](audit-documentazione/02-moduli-frontend-python.md) | Sezioni 12–13; DOC-014…019 |
| [Operations, roadmap e controlli](audit-documentazione/03-operations-roadmap-e-controlli.md) | Sezioni 14–15; DOC-020…023 e WORKFLOW-002…003 |
| [Processo e materiali consolidati](audit-documentazione/04-processo-e-materiali-storici.md) | Sezioni 16–17; decisioni documentali e materiali di processo |

## Regole

- ogni scheda owner vive in un solo modulo;
- gli ID non vengono rinumerati;
- la Todo contiene una sola riga sintetica per ogni ID;
- lo storico delle modifiche è affidato ai commit Git;
- nuovi rilievi vanno aggiunti al modulo pertinente;
- dopo ogni modifica eseguire registry checker, link checker, profilo `fast` e `git diff --check`.
