# Scraper Betfair

## Scopo

Questo modulo documenta il package Python che acquisisce dati Betfair.

```txt
betfair_scraper.py
→ scrapers.betfair.cli
```

Il package gestisce browser, sessione CDP, profilo persistente, quote, ladder e diagnostica.

Non decide polling, persistence canonica, Evidence o UI.

## Struttura

```txt
scrapers/betfair/
├── cli.py
├── scrape.py
├── graph_url.py
├── graph_url_test.py
├── cdp_url.py
├── browser_session.py
├── market_api.py
├── ladder.py
├── network_capture.py
├── diagnostic_redaction.py
├── cache.py
├── parsing.py
└── config.py
```

| File                      | Responsabilità                                                            |
| ------------------------- | ------------------------------------------------------------------------- |
| `cli.py`                  | Argomenti, cache, login-only e JSON stdout per lo scraping                |
| `scrape.py`               | Orchestrazione browser, mercato, ladder e diagnostica                     |
| `graph_url.py`            | Parser puro URL dirette e validazione mapping ladder                      |
| `graph_url_test.py`       | Test unitari puri del parser e del mapping                                |
| `cdp_url.py`              | Validazione e normalizzazione dell'endpoint CDP locale                    |
| `browser_session.py`      | CDP esistente o profilo persistente                                       |
| `market_api.py`           | Dati mercato read-only                                                    |
| `ladder.py`               | Lettura ladder da Graph URL                                               |
| `network_capture.py`      | Capture diagnostica delle risposte browser                                |
| `diagnostic_redaction.py` | Redazione pura di URL, header, payload JSON e testo diagnostico sensibile |
| `cache.py`                | Cache breve del risultato                                                 |
| `parsing.py`              | URL, event ID, normalizzazione e sanitizzazione                           |
| `config.py`               | Percorsi, host, logging e risoluzione locale della configurazione Betfair |

## Contratto CLI

Comando base:

```powershell
python .\betfair_scraper.py <betfair-url>
```

Opzioni:

```txt
--mode persistent|cdp
--profile-dir <directory>
--cdp-url <url>
--ladder-urls <url1,url2,...>
--no-network-capture
--no-cache
--login-only
```

| Opzione                | Effetto                                                |
| ---------------------- | ------------------------------------------------------ |
| `--mode persistent`    | Apre un browser con profilo persistente                |
| `--mode cdp`           | Si collega a Chrome già avviato                        |
| `--profile-dir`        | Usa il profilo indicato in modalità persistent         |
| `--cdp-url`            | Usa l’endpoint CDP indicato                            |
| `--ladder-urls`        | Legge ladder da Graph URL                              |
| `--no-network-capture` | Disabilita capture diagnostica                         |
| `--no-cache`           | Ignora la cache runtime                                |
| `--login-only`         | Apre il flusso interattivo di login senza fetch finale |

In modalità `--login-only` non esiste un payload dati finale da trattare come risposta scraper.

La chiave applicativa Betfair non deve essere definita come valore letterale nei file Python.

`APP_KEY` resta il nome pubblico importato dallo scraper, ma viene risolto in questo ordine:

```txt
BETFAIR_APP_KEY dall’ambiente, se non vuota dopo strip()
→ BETFAIR_APP_KEY nel file .env della root, se non vuota dopo strip()
→ RuntimeError("BETFAIR_APP_KEY is required")
```

Un valore ambiente vuoto o composto solo da spazi non blocca il fallback al file `.env`.

Il parser locale del `.env` supporta commenti, righe vuote, `KEY=value`, spazi esterni, valori quotati e prefisso `export`.

Non carica né sovrascrive altre variabili `.env`.

## CLI CDP e modalità persistent

```txt
--mode cdp
→ --cdp-url obbligatoria
```

Una URL vuota o non valida fallisce prima di Playwright, cache, login-only, fetch o browser session. Non esiste default implicito a `9222`.

```txt
--mode persistent
→ cdpUrl non richiesta
→ profileDir usata quando prevista
```

## Browser

### Modalità CDP

```txt
Chrome già avviato con endpoint CDP
→ connect_over_cdp(...)
→ riuso context esistente
→ riuso o creazione pagina Betfair
```

L’autenticazione non è garantita dalla connessione CDP. Lo scraper la valuta soltanto con un’euristica sulla pagina e può continuare anche quando il login non sembra presente.

Il contesto CDP non deve essere chiuso dallo scraper.

### Modalità persistent

```txt
profilo locale
→ launch_persistent_context(...)
→ pagina Betfair
→ scraping
→ chiusura context al termine
```

## Login-only

```txt
--login-only
→ processo interattivo distinto dal tracking
→ nessun payload dati finale
→ resta attivo finché l'utente chiude le pagine/browser
→ viene terminato anche dallo shutdown backend con scope=all
```

`POST /api/match/stop` usa `scope=tracking` e non termina il login-only.

## Risultato

Il risultato raw contiene almeno:

```txt
runners
market_info
```

Può includere anche:

```txt
network_capture
graph_diagnostics
event_status
```

I campi diagnostici restituiti dallo scraper vengono redatti prima dell’esposizione al backend Node.

Sono inclusi almeno:

```txt
results.api_error
results.error
results.diagnostics
graph_diagnostics.failures[].url
graph_diagnostics.failures[].text
```

Le URL diagnostiche vengono redatte prima del troncamento. Anche i mapping diagnostici annidati, incluso `login_required`, passano dalla redazione ricorsiva.

Questa redazione non cambia la semantica di:

```txt
auth_suspected
temporary_error
no_ladder_rows
```

Non modificare nomi o semantica dei campi senza aggiornare `betfairFetch.js`, processor, timeline e test collegati.

Le Graph URL dirette vengono validate e associate al runner API prima dell’apertura della pagina ladder.

Il dettaglio di grammatica, mapping, duplicati e reason diagnostici appartiene al documento dedicato.

## Cache

Directory:

```txt
backend/betfair_cache/
```

TTL attuale:

```txt
4 secondi
```

Il CLI usa la cache salvo `--no-cache` e salvo `--login-only`.

Nel tracking live, `updateBetfair(...)` passa `networkCapture: false`. Il runner aggiunge quindi `--no-network-capture`; senza Graph URL non aggiunge `--no-cache`, quindi la cache Python può essere usata.

Il runner aggiunge `--no-cache` quando è presente almeno una Graph URL oppure quando `networkCaptureInput` non è esattamente `false`. Questo secondo caso include input assente, `true` o non booleano.

La cache Python non è un dato canonico.

Le cache runtime Betfair vengono redatte sia in scrittura sia in lettura.

```txt
scrittura cache
→ nessun nuovo file cache deve contenere marker sensibili

lettura cache
→ anche cache legacy già presenti vengono restituite redatte
```

Restano invariati:

```txt
CACHE_TTL_SECONDS
cache key
directory cache
formato JSON
logica hit/miss
```

La lettura di cache legacy non riscrive né migra automaticamente il file esistente.

## Network capture: comportamento attuale

Nel CLI Python invocato direttamente, la capture è attiva salvo `--no-network-capture`.

Nel tracking live, il backend passa esplicitamente `networkCapture: false`; il runner Node aggiunge quindi `--no-network-capture`.

Quando la capture è attiva, può scrivere in:

```txt
backend/betfair_network_dump/
```

Il dump può contenere:

* metadati della risposta, inclusi URL, status e header;
* body JSON fino a 5 MiB;
* body testuale fino a 256 KiB quando non è stato salvato come JSON.

Body superiori a 5 MiB non vengono salvati.

La capture è diagnostica. Non alimenta direttamente timeline, history, Evidence o UI.

## Hardening diagnostico

La diagnostica Betfair deve essere non distruttiva e redatta prima di essere scritta, propagata o registrata.

La redazione copre:

```txt
URL e query parameter sensibili
header sensibili case-insensitive
payload JSON annidati
JSON serializzato o non parseabile
testo libero diagnostico
token Bearer
alias della chiave applicativa Betfair
```

I dati business non sensibili devono restare disponibili, inclusi:

```txt
marketId
eventId
selectionId
nome runner
quote
volumi
reason tecniche
contatori diagnostici
```

Gli errori HTTP interni del client Betfair continuano a riportare lo status HTTP, ma non includono body remoti raw.

Il logger Python scrive ancora su `stderr` e sul file log esistente, ma il messaggio viene redatto prima della scrittura.

La network capture mantiene condizioni di attivazione, filtri, soglie e schema del summary, ma metadata, header, URL, errori, body JSON, body testuali e dati inseriti nel collector vengono salvati solo in forma redatta.

Il percorso runtime ordinario con Chrome/CDP e Betfair è stato validato nel collaudo `9B`. Restano fuori da questa validazione le failure specifiche di rete, credenziali e browser; la redazione continua a essere verificata con marker fittizi, senza usare o condividere segreti, cookie, dump o payload reali.

## Redazione diagnostica

La redazione copre:

```txt
Authorization Basic
Authorization Digest
Proxy-Authorization
Cookie multipli
Set-Cookie e attributi
chiavi sensibili JSON
token Bearer
path Windows con slash e backslash
path UNC
path POSIX
valori numerici non finiti
```

```txt
stdout
→ JSON scraper

stderr e file log
→ diagnostica strutturata e redatta
```

Nessun messaggio diagnostico contamina stdout.

## Stato live Task 2

Validato nel collaudo `9B`:

```txt
mode=cdp reale
login-only started
login-only reused
tracking Betfair
ladder utilizzabile
matched volume aggiornato
shutdown del figlio owned
CDP preservato
```

Non sono dichiarate validate tutte le possibili failure di rete, credenziali o browser.

## Verifica

```powershell
python -m unittest -v scrapers.betfair.config_test
python -m unittest -v scrapers.betfair.diagnostic_redaction_test
python -m unittest -v scrapers.betfair.cache_test

python -m py_compile `
  scrapers/betfair/config.py `
  scrapers/betfair/market_api.py `
  scrapers/betfair/network_capture.py `
  scrapers/betfair/diagnostic_redaction.py `
  scrapers/betfair/scrape.py `
  scrapers/betfair/cache.py
```

Per modifiche di redazione diagnostica, i test devono usare marker fittizi e dump simulati. Non usare log, dump, cache, cookie o credenziali reali come input di test.

Per modifiche Node ↔ Python:

```txt
verificare JSON stdout
→ verificare modalità cdp
→ verificare modalità persistent
→ verificare ladder URL
→ verificare --no-network-capture
→ verificare --login-only
→ verificare che Chrome CDP resti aperto
```

## Documenti collegati

* [Entry point e runtime Python](./01-entrypoints-and-runtime.md)
* [Validazione Graph URL Betfair](./04-betfair-graph-url-validation.md)
* [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
* [API Betfair](../../api/02-betfair.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
