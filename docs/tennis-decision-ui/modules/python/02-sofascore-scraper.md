# Scraper SofaScore

## Scopo

Questo modulo documenta l’acquisizione SofaScore.

```txt
scraper.py
→ scrapers.sofa.cli
```

Il package recupera dati SofaScore e restituisce JSON al backend Node.

Non costruisce snapshot finali, momentum, Evidence o timeline.

## Struttura

```txt
scrapers/sofa/
├── cli.py
├── urls.py
├── browser.py
├── cache.py
└── config.py
```

| File         | Responsabilità                                            |
| ------------ | --------------------------------------------------------- |
| `cli.py`     | Input CLI, cache, fallback browser e JSON stdout          |
| `urls.py`    | Pulizia URL, event ID e costruzione endpoint              |
| `browser.py` | Playwright, pagina SofaScore e fetch nel contesto browser |
| `cache.py`   | Cache breve per input normalizzati                        |
| `config.py`  | Percorsi cache, profilo browser, TTL e logging stderr     |

## Contratto CLI

Comando base:

```powershell
python .\scraper.py <url-1> <url-2> ...
```

Lo scraper accetta:

* URL match SofaScore;
* endpoint API SofaScore;
* una o più URL nella stessa esecuzione.

Se riceve un singolo URL match con event ID, lo espande in:

```txt
/api/v1/event/<eventId>
/api/v1/event/<eventId>/statistics
/api/v1/event/<eventId>/point-by-point
```

L’output è un oggetto JSON indicizzato per URL endpoint.

## Cache

Directory:

```txt
backend/scraper_cache/
```

TTL attuale:

```txt
5 secondi
```

La cache è un’ottimizzazione runtime.

Non è una timeline, una fonte di replay o un archivio da inviare a un’API AI.

## Browser e fallback

Flusso:

```txt
input normalizzato
→ cache
→ browser headless
→ fetch endpoint nel contesto pagina
→ JSON stdout
```

Il browser usa un profilo persistente locale:

```txt
backend/scraper_profile/
```

Quando rileva blocco o challenge in modalità headless:

```txt
headless
→ blocco o challenge rilevato
→ nuova esecuzione headed
→ attesa fino a 60 secondi per intervento manuale
→ tentativo fetch API nel contesto browser
```

Il fallback headed può attendere fino a 60 secondi prima di proseguire al fetch API. Non certifica che la challenge sia stata effettivamente risolta.

## Output e logging

`stdout` deve contenere solo JSON.

Esempio errore input:

```json
{
  "error": "No URLs provided"
}
```

Log e messaggi browser usano `stderr`.

Non aggiungere testo libero su stdout: il backend Node esegue parsing JSON diretto.

## Confini

Lo scraper SofaScore non deve:

* salvare history o timeline;
* calcolare momentum;
* costruire Match Evidence;
* chiamare route Node;
* modificare Source Identity;
* dipendere da componenti React;
* salvare dump browser come dati canonici.

## Verifica

```powershell
python -m py_compile .\scraper.py
python -c "from scrapers.sofa.cli import main; print('import OK')"
python -c "from scrapers.sofa.urls import build_sofascore_api_urls; urls = build_sofascore_api_urls('16402319'); assert len(urls) == 3; assert not any('tennis-power-rankings' in url for url in urls); print('Sofa URL builder: OK')"
```

Dopo modifiche a URL o output:

```txt
verificare URL match
→ verificare endpoint API diretto
→ verificare cache
→ verificare fallback headed
→ verificare JSON stdout valido
```

## Documenti collegati

* [Entry point e runtime Python](./01-entrypoints-and-runtime.md)
* [Tracking live](../sofa/01-live-tracking.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
* [API Match](../../api/01-match.md)
