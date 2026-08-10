# Scraper Betfair

## Scopo

Lo scraper Betfair acquisisce mercato, runner e ladder attraverso un browser Playwright. Supporta un profilo persistente locale oppure una sessione Chrome già avviata e raggiungibile via CDP.

Il processo Python scrive un solo payload JSON su `stdout`; log e diagnostica operativa usano `stderr` e il logger dedicato.

## Componenti

| File                      | Responsabilità                                         |
| ------------------------- | ------------------------------------------------------ |
| `cli.py`                  | CLI, validazione iniziale, cache e timeout complessivo |
| `scrape.py`               | Orchestrazione browser, API mercato e Graph URL        |
| `browser_session.py`      | Apertura sessione, login euristico e stato evento      |
| `market_api.py`           | Lettura del mercato principale                         |
| `ladder.py`               | Estrazione ladder da Graph URL                         |
| `cache.py`                | Cache breve dei soli risultati completi                |
| `network_capture.py`      | Capture diagnostica bounded                            |
| `diagnostic_redaction.py` | Redazione centralizzata                                |

I dettagli di capture, dump e redazione sono nel documento [Diagnostica e network capture Betfair](./05-betfair-diagnostics-and-network-capture.md).

## Contratto CLI

```text
python betfair_scraper.py <url> [opzioni]
```

Opzioni principali:

```text
--mode persistent|cdp
--profile-dir <path>
--cdp-url <url>
--ladder-urls <url1,url2,...>
--no-network-capture
--no-cache
--login-only
```

Una URL Betfair vuota o non valida fallisce prima dell’apertura del browser. In modalità CDP `--cdp-url` è obbligatoria e deve superare la validazione loopback condivisa; non esiste un fallback implicito alla porta 9222.

## Sessioni browser

In modalità `cdp` lo scraper si collega al browser esistente, riusa il primo contesto e non lo chiude. In modalità `persistent` apre e chiude un contesto proprietario usando il profilo richiesto o quello predefinito.

Il browser persistent conserva soltanto i flag di compatibilità necessari. Non usa `--no-sandbox`, `--disable-setuid-sandbox` o `--ignore-certificate-errors`.

`--login-only` apre una sessione interattiva separata dal tracking e resta attivo finché l’utente chiude le pagine. Lo stop del tracking non termina questa sessione; lo shutdown globale può terminarla se il processo è owned.

## Stato finale dell’evento

`event_status.hasFinished=true` è prodotto soltanto da marker strutturali dedicati:

```text
span.match-finished
.tennis-header.finished
```

Testo generico contenente “finito”, “finished” o “terminato” produce solo `weakFinishedHint=true`. Il suggerimento debole resta diagnostico e non autorizza l’arresto automatico del polling.

## Graph URL e classificazione degli errori

Le Graph URL vengono validate e associate a un runner API prima dell’apertura. Le failure usano reason distinte:

```text
auth_required
security_challenge
no_ladder_rows
temporary_error
```

`auth_required` interrompe l’elaborazione delle Graph URL successive perché richiede un’azione dell’utente. Le altre classificazioni descrivono rispettivamente una challenge, una pagina valida senza righe e un errore tecnico ritentabile.

Il contratto completo di grammatica e mapping è in [Validazione Graph URL Betfair](./04-betfair-graph-url-validation.md).

## Risultato pubblico

Il risultato contiene sempre:

```text
runners
market_info
```

Può contenere `event_status`, `graph_diagnostics`, `network_capture`, `api_error` o `error`. Prima della stampa l’intero risultato passa attraverso la redazione ricorsiva.

Il summary pubblico della network capture è allow-list e non espone directory di dump, profili o altri path locali.

## Cache

La cache runtime vive in `backend/betfair_cache/`, ha TTL di 4 secondi e non è un dato canonico.

La chiave è un digest SHA-256 opaco della URL normalizzata, dell’identità runtime, delle dimensioni della richiesta e della versione di schema. Modalità o configurazioni incompatibili non condividono lo stesso file.

La cache è abilitata solo quando:

- non sono richieste Graph URL;
- la network capture è disabilitata;
- non sono attivi `--no-cache` o `--login-only`;
- il risultato contiene runner e informazioni mercato non vuoti;
- non sono presenti `error`, `api_error` o stato finale.

Scrittura, lettura e risultato fresh applicano lo stesso contratto di redazione. Errori temporanei e risultati incompleti non vengono memorizzati e quindi non sopprimono i retry.

## Timeout

Il CLI Python applica un budget complessivo di 120 secondi, inclusi navigazione, Graph URL, drain della capture e cleanup. Il runner Node usa 135 secondi: il parent concede quindi al child il tempo di concludere e serializzare il risultato prima di richiederne la terminazione.

## Riferimenti implementativi

| Responsabilità          | File                                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| entry point compatibile | `betfair_scraper.py`                                                             |
| CLI e runtime           | `scrapers/betfair/cli.py`, `scrapers/betfair/scrape.py`                          |
| sessione CDP/Playwright | moduli Betfair sotto `scrapers/`                                                 |
| URL Graph               | [owner Graph URL](./04-betfair-graph-url-validation.md)                          |
| diagnostica opt-in      | [diagnostica e network capture](./05-betfair-diagnostics-and-network-capture.md) |
| lifecycle Node          | `backend/src/sofa/betfair/`                                                      |

### Sequenza del processo

```text
argomenti CLI
→ validazione event/graph/CDP
→ connessione alla sessione browser esistente
→ discovery del mercato
→ acquisizione Graph
→ classificazione del campione
→ output JSON pubblico su stdout
→ diagnostica redatta separata
→ cleanup risorse possedute
```

Lo scraper non possiede Chrome e non termina il browser. La sessione persistente resta esterna; il processo possiede soltanto le risorse create nella propria invocazione.

### Canali di output

| Canale          | Contenuto                                       |
| --------------- | ----------------------------------------------- |
| stdout          | un payload JSON pubblico consumabile dal parent |
| stderr/log      | diagnostica bounded e redatta                   |
| cache           | dati runtime secondo la policy documentata      |
| network capture | solo opt-in, mai requisito ordinario            |

Un errore pubblico usa code e messaggio bounded. URL completi con query, cookie, token, stack e path personali non attraversano stdout.

### Risultato effettivo

Il CLI non espone una enum unica di stati terminali. In modalità scraping stampa il dizionario redatto restituito da `scrape_betfair()`; la base del payload è:

```json
{
  "runners": [],
  "market_info": {}
}
```

Il risultato può inoltre includere `event_status`, `graph_diagnostics`, `diagnostics`, `api_error` o `network_capture` secondo il percorso attraversato. Sul timeout globale il CLI produce letteralmente:

```json
{
  "runners": [],
  "market_info": {},
  "error": "scraper_timeout"
}
```

Un evento concluso è rappresentato da `event_status.hasFinished: true`; non esiste un code pubblico `market_finished` introdotto dal CLI. `login_required` è una struttura restituita dal parser della ladder e viene tradotta nella diagnostica del risultato, non è uno stato terminale generale inventato dal documento.

## Verifica

```powershell
python -m unittest -v `
  scrapers.betfair.cache_test `
  scrapers.betfair.cdp_url_test `
  scrapers.betfair.graph_url_test `
  scrapers.betfair.runtime_contract_test

node backend/src/sofa/betfair/scraperLifecycle.test.mjs
```

Il collaudo live resta necessario per verificare autenticazione reale, profilo persistent, collegamento CDP e compatibilità del browser nell’ambiente dell’utente.

## Documenti collegati

- [Entry point e runtime Python](./01-entrypoints-and-runtime.md)
- [Validazione Graph URL Betfair](./04-betfair-graph-url-validation.md)
- [Diagnostica e network capture Betfair](./05-betfair-diagnostics-and-network-capture.md)
- [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
- [API Betfair](../../api/02-betfair.md)
