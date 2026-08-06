# Tennis Decision UI — Implementazioni proposte

Questo file è l’indice corrente delle schede `IMPL-*`. Le schede complete vivono nei moduli tematici.

## Moduli

| Intervallo | Modulo | Perimetro |
| --- | --- | --- |
| IMPL-001…015 | [Utility e autorità di base](implementazioni-proposte/01-utility-e-autorita-base.md) | Checker, session authority, boundary pubblici, harness, fixture, baseline e writer authority |
| IMPL-016…018 | [Runtime e acquisizione Betfair](implementazioni-proposte/02-runtime-betfair.md) | Command authority, control plane ed envelope di acquisizione |
| IMPL-019…021 | [Storage e recovery](implementazioni-proposte/03-storage-recovery.md) | Autorità per evento, document contract e recovery control plane |
| IMPL-022…024 | [Evidence e provenance](implementazioni-proposte/04-evidence-provenance.md) | Provenance temporale, eligibility, runner identity e comparabilità |
| IMPL-025…027 | [Frontend, sessione e polling](implementazioni-proposte/05-frontend-session-polling.md) | Live-session controller, polling session-scoped e Market Reactions UI |
| IMPL-028…031 | [Validazione e fixture](implementazioni-proposte/06-validazione-e-fixture.md) | Runner canonico, fixture, sandbox, harness e result ledger |
| IMPL-032 | [Documentazione e normalizzazione](implementazioni-proposte/07-documentazione-e-normalizzazione.md) | Migrazione documentale e coerenza dei registri |

## Stato sintetico

Completate:

- IMPL-001;
- IMPL-005;
- IMPL-015;
- IMPL-028;
- IMPL-032.

Future o condizionate:

- IMPL-010;
- IMPL-014.

Le altre implementazioni restano classificate nella Todo e nelle rispettive schede owner.

## Regole

- ogni scheda owner vive in un solo modulo;
- gli ID non vengono rinumerati;
- una classificazione o approvazione non equivale a implementazione;
- nessuna task viene avviata automaticamente;
- lo storico delle modifiche è affidato ai commit Git;
- dopo ogni modifica eseguire registry checker, link checker, profilo `fast` e `git diff --check`.
