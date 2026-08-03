# Validazione Graph URL Betfair

## Stato

**Implementato, da validare.**

Il parser, il mapping e i test unitari puri sono completati.

Resta da validare il comportamento in una sessione reale Playwright/Betfair, con Graph URL valide, URL invalide e login Betfair attivo o mancante.

## Scopo

Questo documento descrive esclusivamente:

```txt
scrapers/betfair/graph_url.py
scrapers/betfair/graph_url_test.py
integrazione Graph URL in scrapers/betfair/scrape.py
```

Copre:

```txt
grammatica della URL diretta
→ mapping marketId / selectionId / runner
→ gestione duplicati
→ failure reason diagnostici
```

Non descrive:

```txt
CLI Python
endpoint HTTP
cache
Source Identity
persistenza
frontend
semantica Back / Lay
```

## Formato diretto accettato

La Graph URL diretta accettata è:

```txt
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

Query string, fragment e slash finale sono ammessi.

Esempio sicuro:

```txt
https://graphs.betfair.it/1.23456789/101/0
```

## Regole di parsing

La URL deve rispettare tutte queste condizioni:

```txt
schema
→ esclusivamente https

host
→ esclusivamente graphs.betfair.it, senza credenziali nella URL né porta esplicita

path
→ marketId / selectionId / 0

marketId
→ valore Betfair numerico con punto

selectionId
→ sole cifre
```

L’endpoint `runnerChartData` viene rifiutato esplicitamente:

```txt
bad_graph_url_unsupported_endpoint
```

Ogni altro errore sintattico usa:

```txt
bad_graph_url_invalid
```

## Regole di mapping

Il mapping usa questo flusso:

```txt
fetch_market_data_api(...)
→ selection_map dei soli runner con selectionId non nullo
→ expected_market_id da market_info.market_id
→ seen_selection_ids per l’esecuzione corrente
→ runner già risolto
```

Failure reason di mapping:

```txt
bad_graph_url_market_mismatch
bad_graph_url_selection_not_found
bad_graph_url_duplicate_selection
```

## Invariante di assegnazione

Una URL valida può risolvere un solo runner API.

```txt
URL valida
→ runner API risolto
→ ladder assegnata soltanto a quel runner
→ graphUrlsSucceeded incrementato soltanto dopo l’assegnazione
```

Una selezione già validata viene riservata nella stessa esecuzione.

```txt
selectionId già visto
→ URL successiva rifiutata
→ nessuna sovrascrittura della ladder
```

La selezione viene riservata subito dopo il mapping riuscito, prima dell’apertura della pagina ladder.

Se la lettura della prima URL produce ladder vuota, errore temporaneo o login richiesto, una URL successiva con la stessa `selectionId` resta comunque duplicata e non viene ritentata.

Non esiste fallback per:

```txt
nome runner
indice runner
ordine ricevuto dal payload
```

## Failure, stop e skip

Una URL respinta dal parser o dal mapping non interrompe il ciclo sulle URL successive.

```txt
URL invalida o mapping non riuscito
→ graphUrlsAttempted +1
→ graphUrlsFailed +1
→ failure diagnostica con motivo specifico
→ nessuna context.new_page()
→ nessuna extract_ladder_from_url()
→ continuazione con la URL seguente
```

Le failure diagnostiche memorizzate sono limitate alle prime cinque; i contatori restano comunque completi.

URL e testo delle failure diagnostiche devono essere redatti prima dell’esposizione nel risultato dello scraper.

```txt
graph_diagnostics.failures[].url
graph_diagnostics.failures[].text
```

La redazione avviene prima del troncamento diagnostico e non cambia reason, contatori o decisione di skip.

Il login richiesto è l’eccezione:

```txt
login_required dalla pagina Graph
→ diagnostics nel risultato raw
→ graph_diagnostics.authSuspected = true
→ failure auth_suspected
→ interruzione delle Graph URL rimanenti
```

Questo documento descrive dove compaiono le failure Graph URL. Le regole generali di redazione appartengono allo scraper Betfair e al runbook diagnostico.

Se `event_status.hasFinished` è `true`, lo scraper non tenta alcuna Graph URL:

```txt
skippedBecauseFinished = true
graphUrlsAttempted = 0
```

Una URL sintatticamente valida non garantisce login attivo, ladder disponibile, righe ladder o Money Flow valido.

## Confini

Questo modulo non modifica:

```txt
CLI Python
endpoint HTTP
payload API
timeline
history
Source Identity
frontend
lifecycle Node
redazione diagnostica generale
cache Betfair
```

Questo documento descrive dove compaiono le failure Graph URL. Le regole generali di redazione appartengono allo scraper Betfair e al runbook diagnostico.

Il preflight backend controlla una grammatica distinta e preliminare.

L’accettazione definitiva della Graph URL per lo scraper appartiene a questo modulo Python.

## Verifica

Dalla cartella che contiene il package `scrapers/`:

```bash
python -m py_compile \
  scrapers/betfair/graph_url.py \
  scrapers/betfair/graph_url_test.py \
  scrapers/betfair/scrape.py

python -m unittest -v scrapers.betfair.graph_url_test
```

I test devono verificare soltanto helper puri:

```txt
parser URL, inclusi query string, fragment e slash finale
endpoint runnerChartData non supportato
market mismatch
selection assente
duplicati
assenza della chiave "None"
```

Non devono aprire browser, rete o Betfair reale.

## Documenti collegati

* [Scraper Betfair](./03-betfair-scraper.md)
* [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
* [Validazione e rollback](../../operations/04-validation-and-rollback.md)
* [API Preflight](../../api/05-preflight.md)
