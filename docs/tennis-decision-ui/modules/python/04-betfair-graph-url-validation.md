# Validazione Graph URL Betfair

## Stato

**Implementato, con percorso positivo osservato live e matrice completa ancora da validare.**

Il parser, il mapping e i test unitari puri sono completati.

Nel collaudo live `9B` è stato osservato almeno il percorso positivo:

```txt
mode=cdp reale
→ Graph URL valida
→ runner assegnato
→ ladder utilizzabile
→ matched volume aggiornato
```

Sono stati inoltre osservati live il requisito di login sulla pagina Graph e il successivo ritorno a `Connected` dopo autenticazione, nel flusso logout Graph documentato dagli owner Betfair.

Restano da validare come matrice live dedicata:

```txt
URL sintatticamente invalide
marketId non coerente
selectionId assente
selectionId duplicata
login mancante all’avvio della sessione
ladder vuota o temporaneamente non disponibile
più Graph URL con combinazioni miste valide/invalide
```

I test puri non aprono browser o rete e non sostituiscono questa matrice live.

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

La URL deve rispettare:

```txt
schema
→ esclusivamente https

host
→ esclusivamente graphs.betfair.it
→ nessuna credenziale
→ nessuna porta esplicita

path
→ marketId / selectionId / 0

marketId
→ valore Betfair numerico con punto

selectionId
→ sole cifre
```

L’endpoint `runnerChartData` viene rifiutato con:

```txt
bad_graph_url_unsupported_endpoint
```

Ogni altro errore sintattico usa:

```txt
bad_graph_url_invalid
```

## Regole di mapping

Flusso:

```txt
fetch_market_data_api(...)
→ selection_map dei soli runner con selectionId non nullo
→ expected_market_id da market_info.market_id
→ seen_selection_ids per l’esecuzione corrente
→ runner risolto
```

Failure reason:

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

Se la prima URL produce ladder vuota, errore temporaneo o login richiesto, una URL successiva con la stessa `selectionId` resta duplicata e non viene ritentata.

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

Le failure diagnostiche memorizzate sono limitate alle prime cinque; i contatori restano completi.

URL e testo delle failure devono essere redatti prima dell’esposizione:

```txt
graph_diagnostics.failures[].url
graph_diagnostics.failures[].text
```

La redazione avviene prima del troncamento e non cambia reason, contatori o decisione di skip.

Il login richiesto è l’eccezione:

```txt
login_required dalla pagina Graph
→ diagnostics nel risultato raw
→ graph_diagnostics.authSuspected = true
→ failure auth_suspected
→ interruzione delle Graph URL rimanenti
```

Se `event_status.hasFinished` è `true`, lo scraper non tenta Graph URL:

```txt
skippedBecauseFinished = true
graphUrlsAttempted = 0
```

Una URL sintatticamente valida non garantisce login attivo, ladder disponibile, righe ladder o Money Flow valido.

## Preflight backend e parser Python

Il preflight backend controlla una grammatica preliminare e distinta.

```txt
POST /api/test/graph-urls
→ controllo leggero backend
→ non prova l’accettazione definitiva dello scraper
```

L’accettazione definitiva appartiene a questo modulo Python:

```txt
https://graphs.betfair.it/<marketId>/<selectionId>/0
→ parser Python
→ marketId coerente
→ selectionId presente
→ duplicato escluso
→ ladder assegnata
```

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

Le regole generali di redazione appartengono allo scraper Betfair e al runbook diagnostico.

## Verifica

Dalla cartella che contiene `scrapers/`:

```bash
python -m py_compile \
  scrapers/betfair/graph_url.py \
  scrapers/betfair/graph_url_test.py \
  scrapers/betfair/scrape.py

python -m unittest -v scrapers.betfair.graph_url_test
```

I test puri devono verificare:

```txt
parser URL, incluse query string, fragment e slash finale
endpoint runnerChartData non supportato
market mismatch
selection assente
duplicati
assenza della chiave "None"
```

Non devono aprire browser, rete o Betfair reale.

### Verifica live già osservata

```txt
Graph URL valida
→ mapping runner
→ ladder utilizzabile
→ matched volume aggiornato
```

### Verifica live ancora aperta

```txt
URL invalide
market mismatch reale
selection assente reale
duplicato reale
login inizialmente assente
ladder vuota o temporanea
lista mista di URL
```

## Documenti collegati

- [Scraper Betfair](./03-betfair-scraper.md)
- [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
- [Validazione e rollback](../../operations/04-validation-and-rollback.md)
- [API Preflight](../../api/05-preflight.md)
