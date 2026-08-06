# Tennis Decision UI — Audit della documentazione

> Indice modulare del registro storico dei rilievi `DOC-*` e `WORKFLOW-*`. Il contenuto originale è conservato integralmente nei quattro moduli collegati.

## Integrità della modularizzazione

- blob Git della sorgente ricomponibile: `e8295d550aea74edde4caed1d84b1e00cab1d35e`;
- byte della sorgente: `62521`;
- righe della sorgente: `2623`;
- gli ID non sono stati rinumerati;
- ogni scheda owner resta presente una sola volta;
- i checkpoint e gli addendum rimangono nella loro sequenza storica.

## Moduli

| Modulo | Perimetro | Owner principali | Contenuto | Righe |
| --- | --- | --- | --- | ---: |
| [01-rilievi-iniziali-e-api.md](audit-documentazione/01-rilievi-iniziali-e-api.md) | Sezioni 9–11 | DOC-001…013, WORKFLOW-001 | Rilievi iniziali, checklist e audit delle API | 1074 |
| [02-moduli-frontend-python.md](audit-documentazione/02-moduli-frontend-python.md) | Sezioni 12–13 | DOC-014…019 | Moduli owner, frontend e Python | 743 |
| [03-operations-roadmap-e-controlli.md](audit-documentazione/03-operations-roadmap-e-controlli.md) | Sezioni 14–15 | DOC-020…023, WORKFLOW-002…003 | Operations, roadmap e controlli trasversali | 538 |
| [04-processo-e-materiali-storici.md](audit-documentazione/04-processo-e-materiali-storici.md) | Sezioni 16–17 | materiali di processo e storico | Decisioni documentali e inventario dei materiali locali | 268 |

## Ordine di lettura

Per ricostruire l’audit nella sequenza originaria, leggere i quattro moduli nell’ordine numerico. La loro concatenazione byte per byte ricostruisce il precedente `02-audit-documentazione.md`.

## Regola di manutenzione

- inserire un nuovo rilievo nel modulo corrispondente alla fase o al dominio;
- non creare una seconda scheda owner dello stesso ID;
- mantenere gli ampliamenti storici come note o addendum collegati;
- rieseguire registry checker, link checker e profilo `fast` dopo ogni modifica.
