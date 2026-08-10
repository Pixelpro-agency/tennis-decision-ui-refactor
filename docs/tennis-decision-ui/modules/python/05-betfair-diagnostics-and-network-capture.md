# Diagnostica e network capture Betfair

## Scopo

Questo documento descrive la diagnostica dello scraper Betfair, separata dal contratto core documentato in [Scraper Betfair](./03-betfair-scraper.md).

## Attivazione e destinazione

Nel CLI diretto la capture è attiva salvo `--no-network-capture`. Il tracking live la disabilita esplicitamente. Quando attiva può salvare artefatti redatti in:

```text
backend/betfair_network_dump/
```

La directory è un dettaglio locale: non compare nel payload pubblico.

## Limiti e lifecycle

La capture considera soltanto risposte Betfair interessanti ed esclude gli host configurati. Ogni pagina registra i task di risposta nel collector condiviso.

- massimo 16 handler eseguiti contemporaneamente;
- body oltre 5 MiB non salvati;
- testo non JSON salvato solo fino a 256 KiB;
- drain finale massimo di 3 secondi;
- allo scadere del drain, i task residui vengono cancellati e il summary espone `drain_timed_out=true`.

Il summary viene prodotto soltanto dopo il drain bounded. Contiene contatori, URL redatte, candidati e stato del drain, ma non nomi completi dei file o path locali.

## Redazione

La redazione avviene prima di log, dump, cache o output pubblico e copre:

- URL e query sensibili;
- header di autenticazione, cookie e set-cookie;
- token Bearer e chiavi applicative Betfair;
- payload JSON annidati e testo libero;
- path Windows, UNC e POSIX;
- valori numerici non JSON-safe.

Restano disponibili identificatori business, nomi runner, quote, volumi, reason tecniche e contatori.

`stdout` è riservato al JSON finale. Log diagnostici redatti usano `stderr` e il file log configurato.

## Riferimenti implementativi

```text
scraper Betfair
→ evento diagnostico strutturato
→ redazione per categoria
→ sink locale bounded

CLI diretto senza `--no-network-capture`
→ registrazione temporanea
→ summary redatto
→ cleanup listener/file secondo lifecycle
```

| Categoria  | Ammesso                   | Vietato                      |
| ---------- | ------------------------- | ---------------------------- |
| URL        | origin/path bounded       | query, fragment, credenziali |
| HTTP       | status, metodo, conteggio | header e body completi       |
| browser    | tipo evento, timestamp    | cookie, storage, token       |
| filesystem | nome log relativo         | path personale assoluto      |
| errori     | code pubblico             | stack raw nel payload        |

Nel CLI diretto la capture è abilitata per default e viene disattivata con `--no-network-capture`; il tracking live passa esplicitamente la disabilitazione. Non alimenta timeline, history, Evidence o decisioni runtime e non deve diventare una dipendenza del percorso live ordinario.

## Confini

Il modulo non modifica il traffico, non aggira TLS, non conserva segreti e non amplia la retention generale. La procedura operativa completa appartiene al runbook Betfair.

## Verifica

La matrice verifica default del CLI diretto, disabilitazione esplicita nel tracking live, cleanup dei listener, redazione di URL/query/header e assenza di output diagnostico non redatto nei payload pubblici.

I test usano esclusivamente marker fittizi e dump temporanei:

```powershell
python -m unittest -v `
  scrapers.betfair.diagnostic_redaction_test `
  scrapers.betfair.cache_test `
  scrapers.betfair.runtime_contract_test
```

Non usare cookie, credenziali, log o dump reali come fixture.

## Documenti collegati

- [Scraper Betfair](./03-betfair-scraper.md)
- [Validazione Graph URL](./04-betfair-graph-url-validation.md)
- [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
- [Retention e cleanup](../../operations/05-retention-and-cleanup.md)
- [Validità tecnica dei campioni](../betfair/02-technical-sample-validity.md)
