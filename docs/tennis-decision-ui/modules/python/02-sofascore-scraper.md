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

Il consumer canonico Node passa i tre endpoint SofaScore dello stesso evento. 

La CLI applica la stessa authority:

* URL match SofaScore;
* endpoint API SofaScore;
* uno o più endpoint API appartenenti allo stesso evento.

Se riceve un singolo URL match con event ID, lo espande in:

```txt
/api/v1/event/<eventId>
/api/v1/event/<eventId>/statistics
/api/v1/event/<eventId>/point-by-point
```

L’output è un oggetto JSON indicizzato per URL endpoint.

Sono ammessi soltanto HTTPS, host `sofascore.com`/`www.sofascore.com`, porta standard e path match/API riconosciuti. 

Query, credenziali, host esterni, più match URL e batch mixed-event vengono rifiutati prima di cache e browser. 

Gli endpoint duplicati vengono normalizzati una sola volta mantenendo l'ordine.

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

La chiave è il digest SHA-256 della lista URL canonica serializzata in modo deterministico. 

Il filename è opaco e conserva l'ordine del batch.

Sono cacheabili soltanto risultati non vuoti in cui ogni endpoint è riuscito. 

Le failure HTTP, browser, challenge e timeout non vengono persistite; una cache scaduta, corrotta o contenente errori viene trattata come miss.

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

Il fallback headed attende fino a 60 secondi. Se la challenge resta presente, termina con `challenge_unresolved` e non la confonde con un errore endpoint.

La gerarchia temporale è:

```txt
navigazione pagina: 30 secondi
challenge manuale: massimo 60 secondi
singolo endpoint: 15 secondi con AbortController
intera esecuzione Python: 105 secondi
bridge Node: 120 secondi
```

Il budget Python vale anche per la CLI autonoma ed è inferiore a quello parent.

## Profilo persistente

`backend/scraper_profile/` è il `user_data_dir` del browser persistente e non una cache. Conserva stato del sito e può contenere session data locale.

Il percorso backend serializza fisicamente le esecuzioni SofaScore tramite il barrier di `directFetch.js`; invocazioni manuali concorrenti di `scraper.py` non sono invece coordinate.

Il progetto non applica cleanup automatici al profilo: eventuale rimozione deve avvenire offline, in modo esplicito, con browser e scraper fermi.

Il profilo non deve essere pubblicato, allegato a risposte HTTP o trattato come dato canonico.

## Output e logging

`stdout` deve contenere solo JSON.

Esempio errore input:

```json
{
  "error": "No URLs provided"
}
```

Log e messaggi browser usano `stderr`.

Prima della scrittura, la diagnostica SofaScore usa la redazione bounded condivisa con il runtime Betfair. 

URL, query sensibili, token, header, path e testo eccessivo vengono redatti o limitati.

Il backend limita stdout a 2 MiB. Se il child supera il limite:

```txt
buffer azzerato
→ terminazione del solo processo owned
→ scraper_output_too_large
→ nessun parsing del JSON parziale
```

Non aggiungere testo libero su stdout: il backend Node esegue parsing JSON diretto.

Le failure Python usano un envelope bounded con `ok:false`, `error.code` e `error.message`; per errori HTTP può essere presente `error.status`. 

Raw exception text non entra nel result pubblico.

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
python -m unittest launcher.tests.test_runtime_hardening
python -m unittest scrapers.sofa.runtime_contract_test
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
