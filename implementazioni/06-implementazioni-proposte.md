# Tennis Decision UI — Registro delle implementazioni proposte

> Indice modulare delle schede `IMPL-*`. Le schede owner complete sono conservate nei sette file tematici collegati sotto. Questo file non duplica le schede e non modifica priorità, stati, dipendenze o decisioni.

## Regole di lettura

- gli ID restano globali e non sono stati rinumerati;
- ogni scheda owner vive una sola volta nei moduli;
- estensioni e addendum restano accanto alla fase che li ha prodotti;
- il contenuto storico è preservato integralmente, senza sintesi sostitutive;
- gli stati indicano il checkpoint documentato e non autorizzano automaticamente una task;
- il registry checker deve leggere ricorsivamente `implementazioni/**/*.md`.

## Mappa dei moduli

| Intervallo | Modulo | Contenuto |
| --- | --- | --- |
| `IMPL-001…015` | [Utility e autorità di base](implementazioni-proposte/01-utility-e-autorita-base.md) | Checker documentali, session authority, boundary pubblici, harness, persistence UI, toolkit offline, maintenance, fixture, benchmark, ottimizzazione e writer authority. |
| `IMPL-016…018` | [Runtime e acquisizione Betfair](implementazioni-proposte/02-runtime-betfair.md) | Autorità globale dei comandi Betfair, control plane locale, envelope di acquisizione, provenance e futura attribuzione del volume. |
| `IMPL-019…021` | [Storage, documenti canonici e recovery](implementazioni-proposte/03-storage-recovery.md) | Autorità per evento, contratto dei documenti canonici, recovery verificata, stato globale e relative estensioni. |
| `IMPL-022…024` | [Evidence, provenance e confronti temporali](implementazioni-proposte/04-evidence-provenance.md) | Provenance temporale, eligibility e branch state delle Market Reactions, identità runner, comparabilità prezzo e calibrazione. |
| `IMPL-025…027` | [Frontend, sessione live e polling](implementazioni-proposte/05-frontend-session-polling.md) | Controller della sessione frontend, polling session-scoped, view model Market Reactions, persistence UI e cleanup collegati. |
| `IMPL-028…031` | [Validazione, fixture e test harness](implementazioni-proposte/06-validazione-e-fixture.md) | Runner canonico, catalogo fixture e sandbox, harness frontend, result ledger ed estensioni della test map. |
| `IMPL-032 e checkpoint successivi` | [Migrazione documentale e normalizzazione dei registri](implementazioni-proposte/07-documentazione-e-normalizzazione.md) | Pipeline di migrazione documentale, checkpoint dei checker, baseline rilevata e normalizzazione degli owner duplicati. |

## Ordine consigliato

```text
01 — utility e autorità di base
02 — runtime e acquisizione Betfair
03 — storage e recovery
04 — Evidence e provenance
05 — frontend, sessione e polling
06 — validazione e fixture
07 — documentazione e normalizzazione
```

## Integrità della modularizzazione

La sorgente precedente era `implementazioni/06-implementazioni-proposte.md` con:

```text
righe: 4088
byte UTF-8: 83098
blob Git: 1b0260925b550e28851b7ad16505bd60571702cc
```

Il contenuto compreso tra i marker `BEGIN ORIGINAL CONTENT` e `END ORIGINAL CONTENT` dei sette moduli ricompone esattamente la sorgente precedente. Il controllo è eseguibile con lo script temporaneo incluso nel pacchetto.
