# Scraper Betfair

## Scopo

Questo documento descrive il package Python che acquisisce da Betfair i dati del mercato `MATCH_ODDS`, i runner, le migliori quote disponibili e, quando richieste, le ladder delle Graph URL.

```text
betfair_scraper.py
→ scrapers.betfair.cli
→ scrapers.betfair.scrape
```

Lo scraper gestisce la propria invocazione CLI, la sessione Playwright, la lettura read-only della Market API, l’acquisizione opzionale delle ladder, la cache runtime e la produzione del risultato JSON consumato dal backend Node.

Non possiede scheduling, polling, persistence canonica, Evidence o interfaccia utente. Il lifecycle del processo figlio e il consumo del risultato Python appartengono al backend Node.

## Struttura

```text
scrapers/betfair/
├── cli.py
├── scrape.py
├── browser_session.py
├── market_api.py
├── ladder.py
├── graph_url.py
├── cdp_url.py
├── cache.py
├── parsing.py
├── config.py
├── network_capture.py
└── diagnostic_redaction.py
```

| File                      | Responsabilità                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `cli.py`                  | Argomenti, validazione iniziale, cache, login-only, timeout complessivo e JSON su `stdout`               |
| `scrape.py`               | Orchestrazione della sessione, acquisizione mercato, Graph URL, stato evento e cleanup                   |
| `browser_session.py`      | Connessione CDP, apertura del profilo persistent, selezione della pagina, login euristico e stato evento |
| `market_api.py`           | Lettura read-only del mercato `MATCH_ODDS`, runner, quote e volumi                                       |
| `ladder.py`               | Navigazione ed estrazione delle righe ladder                                                             |
| `graph_url.py`            | Parsing delle Graph URL dirette e associazione ai runner API                                             |
| `cdp_url.py`              | Validazione e normalizzazione dell’endpoint CDP loopback                                                 |
| `cache.py`                | Cache runtime breve dei risultati completi idonei                                                        |
| `parsing.py`              | Normalizzazione URL, estrazione event ID e parser di supporto                                            |
| `config.py`               | Configurazione locale, percorsi, chiave applicativa e logging                                            |
| `network_capture.py`      | Capture diagnostica opzionale e bounded                                                                  |
| `diagnostic_redaction.py` | Redazione centralizzata del risultato e della diagnostica                                                |

La grammatica e il mapping delle Graph URL hanno un owner dedicato. Capture, dump, redazione e policy diagnostiche sono descritti nel documento dedicato alla diagnostica.

## Contratto CLI

Comando base:

```powershell
python .\betfair_scraper.py <betfair-url> [opzioni]
```

| Opzione                         | Effetto                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `--mode persistent\|cdp`        | Seleziona il profilo persistent oppure una sessione Chrome esistente via CDP; il default è `persistent` |
| `--profile-dir <directory>`     | Imposta il profilo usato in modalità persistent                                                         |
| `--cdp-url <url>`               | Imposta l’endpoint CDP richiesto in modalità `cdp`                                                      |
| `--ladder-urls <url1,url2,...>` | Richiede l’acquisizione delle ladder indicate                                                           |
| `--no-network-capture`          | Disabilita la capture browser-level                                                                     |
| `--no-cache`                    | Esclude lettura e scrittura della cache per l’invocazione                                               |
| `--login-only`                  | Apre la sessione interattiva senza eseguire lo scraping finale                                          |

In modalità `cdp`, `--cdp-url` è obbligatoria. La URL deve usare `http` o `https`, riferirsi a un host loopback consentito e includere una porta valida. Una stringa vuota o non valida fallisce prima dell’import del runtime di scraping e prima dell’apertura di Playwright. Non esiste un fallback implicito alla porta `9222`.

La URL ricevuta viene normalizzata prima dell’uso, rimuovendo dalla query i parametri runtime riconosciuti. Dopo la navigazione, lo scraper estrae dalla URL il primo identificatore numerico di almeno cinque cifre; se non lo trova, mantiene il payload base e aggiunge `error: "Could not extract event ID from URL"`.

In modalità `--login-only` il processo non stampa un payload dati finale.

## Sessioni browser

### Modalità CDP

```text
Chrome già avviato con endpoint CDP
→ connect_over_cdp(...)
→ primo context esistente
→ pagina Betfair esistente oppure nuova pagina
```

Lo scraper richiede che il browser collegato abbia almeno un context. Riusa il primo context e, quando possibile, una pagina la cui URL contiene `betfair`; altrimenti crea una pagina nel context esistente.

La connessione CDP non garantisce che l’utente sia autenticato. Lo scraper applica un controllo euristico sulla pagina e registra l’esito, ma continua il flusso anche quando il login non viene rilevato.

Il context collegato via CDP è esterno all’invocazione e non viene chiuso dallo scraper.

### Modalità persistent

```text
profilo richiesto o profilo persistent predefinito
→ launch_persistent_context(...)
→ prima pagina disponibile oppure nuova pagina
→ scraping
→ chiusura del context posseduto
```

Il browser viene aperto in modalità visibile con viewport e user agent configurati. I flag Chromium aggiunti sono:

```text
--disable-blink-features=AutomationControlled
--disable-infobars
```

Non vengono usati `--no-sandbox`, `--disable-setuid-sandbox` o `--ignore-certificate-errors`.

Il context persistent viene creato dall’invocazione Python e viene chiuso nel cleanup.

## Login-only

```text
--login-only
→ apertura della sessione scelta
→ navigazione alla URL Betfair
→ attesa finché non restano pagine aperte
→ nessun payload scraper su stdout
```

Il login-only è distinto dal processo di tracking. Il backend assegna ruoli diversi ai processi Python: lo stop con scope `tracking` non termina il login-only, mentre uno shutdown globale può terminare un processo login-only posseduto dal backend.

## Acquisizione del mercato

Dopo la navigazione e la rilevazione dello stato dell’evento, lo scraper estrae l’event ID dalla URL e usa la Market API read-only in due passaggi:

```text
byevent
→ ricerca del mercato con marketType = MATCH_ODDS
→ marketId e totalMatched
→ bymarket
→ runner, stato e migliori quote back/lay
```

Per ogni runner il risultato include nome, `selectionId`, liste `back` e `lay`, stato ed exchange originali, una ladder inizialmente vuota e il riepilogo `market_graph`. `market_info` contiene `market_id` e `total_matched`.

Una risposta HTTP con status almeno `400` produce un errore che conserva lo status senza includere il body remoto. Se la Market API fallisce, lo scraper mantiene il payload base e aggiunge `api_error`.

## Stato finale dell’evento

Lo stato viene valutato sulla pagina principale prima della lettura del mercato.

`event_status.hasFinished: true` deriva soltanto da marker strutturali dedicati:

```text
span.match-finished con testo finito|finished|terminato
.tennis-header.finished
```

La presenza dello stesso testo in `.sports-header`, `.tennis-header` o `.inplay-info` produce soltanto `weakFinishedHint: true`. Il suggerimento debole è diagnostico e non equivale a una conferma di fine evento.

Quando `hasFinished` è vero, lo scraper non apre le Graph URL e imposta `graph_diagnostics.skippedBecauseFinished: true`.

## Graph URL e ladder

Le Graph URL richieste vengono analizzate e associate ai runner già restituiti dalla Market API prima dell’apertura delle rispettive pagine. Il contratto completo di host, path, mapping, coerenza `marketId`/`selectionId` e duplicati è documentato in [Validazione Graph URL Betfair](./04-betfair-graph-url-validation.md).

Per ogni mapping valido lo scraper apre una nuova pagina nel context, estrae la ladder e chiude la pagina dopo l’uso. Una ladder riuscita viene assegnata al runner corrispondente insieme a `ladder_source: "graph_url"`.

Le failure di acquisizione distinguono:

| Reason               | Significato nel core scraper                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `auth_required`      | La pagina richiede un’azione di autenticazione; le Graph URL successive non vengono elaborate |
| `security_challenge` | La pagina presenta marker di challenge o security check                                       |
| `no_ladder_rows`     | La pagina è stata letta ma non ha prodotto righe ladder valide                                |
| `temporary_error`    | Navigazione o parsing hanno prodotto un errore tecnico ritentabile                            |

`graph_diagnostics` mantiene i conteggi delle URL fornite, tentate, riuscite e fallite, oltre alle failure redatte. I dettagli diagnostici e la redazione dei valori pubblici appartengono all’owner dedicato.

## Risultato pubblico

In modalità scraping il CLI stampa un solo dizionario JSON redatto su `stdout`. Log e diagnostica operativa usano `stderr` e il logger configurato.

La base del risultato è:

```json
{
  "runners": [],
  "market_info": {}
}
```

Secondo il percorso attraversato possono essere presenti:

```text
event_status
graph_diagnostics
diagnostics
api_error
network_capture
error
```

Sul timeout complessivo il CLI produce:

```json
{
  "runners": [],
  "market_info": {},
  "error": "scraper_timeout"
}
```

Non esiste una enum unica di stati terminali introdotta dal CLI. Un evento concluso è rappresentato da `event_status.hasFinished: true`. Il `login_required` restituito dal parser della ladder viene tradotto nella diagnostica Graph e non costituisce uno stato terminale generale del payload.

Prima della cache e della stampa, il risultato fresh passa attraverso la redazione ricorsiva. Anche la lettura e la scrittura della cache applicano lo stesso contratto. I dettagli di allow-list, path locali, dump e redazione sono in [Diagnostica e network capture Betfair](./05-betfair-diagnostics-and-network-capture.md).

## Cache

La cache runtime vive in:

```text
backend/betfair_cache/
```

Ha TTL di 4 secondi e non è un dato canonico.

La chiave è un digest SHA-256 opaco costruito dalla URL Betfair normalizzata, dall’identità della richiesta e dalla versione di schema. L’identità distingue modalità browser, endpoint CDP o profilo persistent e configurazione di capture/ladder; configurazioni incompatibili non condividono lo stesso file.

Il CLI permette la cache soltanto quando:

- non è attivo `--no-cache`;
- non è attivo `--login-only`;
- non sono state richieste Graph URL;
- la network capture è disabilitata.

Un risultato viene scritto soltanto se:

- è un dizionario;
- non contiene `error` o `api_error`;
- non ha `event_status.hasFinished: true`;
- contiene una lista `runners` non vuota;
- contiene un dizionario `market_info` non vuoto.

Risultati incompleti, errori temporanei ed eventi conclusi non vengono memorizzati e non sopprimono le invocazioni successive. Una cache scaduta o illeggibile viene ignorata.

Nel tracking ordinario il backend passa `networkCapture: false`, producendo `--no-network-capture`. Il runner Node aggiunge `--no-cache` quando la richiesta lo impone esplicitamente, quando esiste almeno una Graph URL oppure quando l’input della network capture non è esattamente `false`.

## Timeout e confine Node

Il CLI Python applica un timeout complessivo di 120 secondi a `scrape_betfair()`. Il budget comprende il flusso asincrono di navigazione, acquisizione Graph, drain della capture e cleanup eseguito dalla coroutine.

Il runner Node usa un timeout di 135 secondi e limita `stdout` a 4 MiB. In questo modo il parent concede al processo Python un margine per completare il proprio timeout, serializzare il risultato e chiudere le risorse possedute. Se il child supera il timeout Node, eccede il limite di output, termina con codice non zero o produce JSON non valido, il runner restituisce una failure di lifecycle e richiede la terminazione del processo quando previsto.

Il backend costruisce gli argomenti del processo, evita invocazioni concorrenti incompatibili per la stessa chiave logica, consuma il JSON e passa il risultato al processor Betfair. Queste responsabilità non appartengono allo scraper Python.

## Sequenza del processo

```text
argomenti CLI
→ validazione CDP e normalizzazione URL Betfair
→ eventuale lettura cache
→ apertura o collegamento alla sessione browser
→ navigazione alla pagina Betfair
→ rilevazione dello stato evento
→ estrazione event ID e lettura Market API
→ validazione e acquisizione Graph opzionale
→ cleanup delle risorse possedute
→ drain della capture opzionale
→ redazione del risultato
→ eventuale scrittura cache
→ payload JSON su stdout
```

## Ownership delle risorse e dei canali

| Elemento           | Proprietario/comportamento                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| Context CDP        | Esterno; viene riusato e non chiuso dallo scraper                                 |
| Context persistent | Creato dall’invocazione Python e chiuso nel cleanup                               |
| Pagine Graph       | Create dallo scraper e chiuse dopo l’acquisizione                                 |
| `stdout`           | Un payload JSON pubblico consumabile dal parent Node                              |
| `stderr` e log     | Diagnostica operativa redatta                                                     |
| Cache              | Dato runtime breve, non canonico                                                  |
| Network capture    | Diagnostica opzionale; non alimenta direttamente timeline, history, Evidence o UI |

## Verifica

I test direttamente pertinenti al core e ai suoi confini sono eseguibili con:

```powershell
python -m unittest -v `
  scrapers.betfair.cache_test `
  scrapers.betfair.cdp_url_test `
  scrapers.betfair.graph_url_test `
  scrapers.betfair.graph_loop_test `
  scrapers.betfair.runtime_contract_test

node backend/src/sofa/betfair/scraperLifecycle.test.mjs
```

La verifica automatica copre, tra l’altro, identità e idoneità della cache, contratto CDP, parsing e mapping Graph, ciclo di acquisizione Graph, distinzione tra fine evento autorevole e suggerimento debole, classificazione della challenge, flag del browser persistent, timeout e lifecycle Node.

Il collaudo live resta distinto dai test automatici ed è necessario per verificare autenticazione reale, profilo persistent, collegamento CDP e compatibilità del browser nell’ambiente dell’utente.

## Documenti collegati

- [Entry point e runtime Python](./01-entrypoints-and-runtime.md)
- [Validazione Graph URL Betfair](./04-betfair-graph-url-validation.md)
- [Diagnostica e network capture Betfair](./05-betfair-diagnostics-and-network-capture.md)
- [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
- [API Betfair](../../api/02-betfair.md)
