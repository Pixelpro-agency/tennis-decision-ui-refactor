# Tennis Decision UI — Audit del codice

> Indice modulare del registro analitico dell’audit del codice. La documentazione tecnica canonica del prodotto resta in `docs/tennis-decision-ui/`.

## Scopo

Il precedente file monolitico è stato suddiviso per dominio e fase di audit senza eliminare, sintetizzare o rinumerare il contenuto originale.

Questo indice serve a:

- individuare rapidamente il modulo pertinente;
- evitare di caricare oltre seimila righe quando basta un solo dominio;
- mantenere stabile il percorso storico `implementazioni/03-audit-codice.md`;
- preservare ID, stati, baseline, decisioni, test richiesti, addendum e checkpoint;
- distinguere il registro analitico dalla documentazione canonica del prodotto.

## Provenienza verificata

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch sorgente: main
Blob Git sorgente: 8302e35df847b7a00facd57b3369d0d34eaf494c
Righe originali: 6663
Byte originali UTF-8/LF: 159326
SHA-256 contenuto originale: 40ce411163788a6b649ebf6917dbe24cb6c6254bba11c03285109d63e2a5ef92
```

I sette file contengono blocchi originali delimitati da marker HTML. Il validatore incluso nel pacchetto estrae tali blocchi, li ricompone nell’ordine dichiarato e verifica l’hash della sorgente.

## Ordine di lettura

| Parte | File | Perimetro originale |
| ---: | --- | --- |
| 1 | [Rilievi iniziali e Punto 1](./audit-codice/01-rilievi-iniziali.md) | Rilievi B3–B6, decisioni e autorità runtime iniziale |
| 2 | [Runtime, sessioni e Betfair](./audit-codice/02-runtime-sessioni-betfair.md) | Punti 2–3: tracking, sessioni, Betfair, Graph, diagnostica e cleanup |
| 3 | [Storage, journal e recovery](./audit-codice/03-storage-recovery.md) | Punto 4: persistenza, documenti canonici, journal e recovery |
| 4 | [Evidence e Market Reactions](./audit-codice/04-evidence-market-reactions.md) | Punto 5: provenance, alignment, eligibility e osservazioni cross-source |
| 5 | [Frontend e session shell](./audit-codice/05-frontend-session-shell.md) | Punto 6: controller sessione, polling, integrity UI e presentazione |
| 6 | [Validazione e test](./audit-codice/06-validazione-e-test.md) | Punto 7: runner, fixture, sandbox, harness e result ledger |
| 7 | [Post-audit e migrazione](./audit-codice/07-post-audit-e-migrazione.md) | Controllo finale, migrazione documentale e riallineamenti conclusivi |

## Mappa per dominio

| Esigenza | Modulo da aprire |
| --- | --- |
| Prime discrepanze, Strategy legacy, Preflight, Source Identity iniziale, sicurezza e Python | Parte 1 |
| Nuovo Start, callback stale, generation, lifecycle Betfair, Graph URL, network capture e runtime browser | Parte 2 |
| Shared history, commit concorrenti, target verificati, recovery state e durabilità | Parte 3 |
| Timestamp, source skew, Significant Flow, comparabilità runner e Market Reactions | Parte 4 |
| Session shell, polling session-scoped, Stop statico, integrity UI e rendering Market Reactions | Parte 5 |
| Manifest di test, profili offline, fixture, sandbox, frontend harness e artefatti JSON | Parte 6 |
| Chiusura Punti 1–7, migrazione Markdown, controlli documentali e IMPL-015 | Parte 7 |

## Regole di conservazione

La modularizzazione applica queste regole:

1. nessun ID è stato rinumerato;
2. nessuna scheda owner è stata duplicata o eliminata;
3. titoli, stati, priorità, baseline e decisioni originali sono conservati;
4. i checkpoint storici restano accanto alla fase che li ha prodotti;
5. gli addendum successivi non riscrivono retroattivamente la scoperta iniziale;
6. il testo originale è conservato integralmente fra i marker di ogni parte;
7. questo indice non introduce nuove schede owner;
8. il percorso root resta stabile e i nuovi file sono collegati con link relativi;
9. la Todo resta la vista sintetica unica;
10. la documentazione canonica corrente resta sotto `docs/tennis-decision-ui/`.

## Ownership e registry checker

Le schede owner ora vivono anche sotto `implementazioni/audit-codice/`.

Il registry checker deve quindi eseguire una scansione ricorsiva dei Markdown sotto `implementazioni/`, mantenendo invariati:

```txt
ID globali
→ una sola scheda owner
→ una sola riga sintetica Todo
→ stati compatibili
→ prefissi dichiarati
```

Il pacchetto include una patch controllata per `scripts/check_registry_consistency.py` e un test mirato per la discovery ricorsiva.

## Validazione richiesta dopo l’applicazione

```bash
python scripts/validate_audit_code_split.py
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
node scripts/validation/run.mjs fast
git diff --check
```

Un PASS del validatore di split dimostra la conservazione del testo originale. Non sostituisce il registry checker, il link checker o il profilo `fast`.

## Stato

```txt
audit del codice
→ contenuto storico preservato integralmente
→ suddivisione modulare in sette parti
→ percorso indice stabile
→ nessuna modifica al codice applicativo
→ nessuna task tecnica selezionata automaticamente
```
