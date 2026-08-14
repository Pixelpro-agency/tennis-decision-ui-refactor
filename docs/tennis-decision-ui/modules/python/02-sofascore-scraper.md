# Scraper SofaScore

## Scopo

Questo modulo documenta l’acquisizione Python dei dati SofaScore.

```txt
scraper.py
→ scrapers.sofa.cli
```

Il package normalizza l’input, usa una cache runtime breve, recupera gli endpoint nel contesto di un browser persistente e scrive il risultato JSON su `stdout` per il backend Node.

Non costruisce snapshot normalizzati, `localContext`, Source Identity, history, timeline o Match Evidence: queste responsabilità appartengono al flusso backend downstream.

## Struttura

```txt
scrapers/sofa/
├── cli.py
├── urls.py
├── browser.py
├── cache.py
└── config.py
```

| File         | Responsabilità                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `cli.py`     | Coordinamento di input, cache, fallback browser e JSON su `stdout`                                        |
| `urls.py`    | Validazione e normalizzazione URL, estrazione dell’event ID e costruzione degli endpoint                  |
| `browser.py` | Browser Playwright persistente, navigazione alla pagina evento e fetch degli endpoint nel contesto pagina |
| `cache.py`   | Identità, lettura, validazione e scrittura della cache breve                                              |
| `config.py`  | Percorsi runtime, TTL della cache e logging redatto su `stderr`                                           |

## Contratto CLI e URL

Comando base:

```powershell
python .\scraper.py <url-1> <url-2> ...
```

La CLI accetta due forme di input:

* un singolo URL match SofaScore contenente un event ID;
* uno o più endpoint API SofaScore appartenenti allo stesso evento.

Un singolo URL match viene espanso nei tre endpoint canonici:

```txt
https://www.sofascore.com/api/v1/event/<eventId>
https://www.sofascore.com/api/v1/event/<eventId>/statistics
https://www.sofascore.com/api/v1/event/<eventId>/point-by-point
```

Il backend costruisce direttamente questi tre endpoint in `loadSofaAnalysis.js` e li passa in un unico batch al bridge Python.

Sono autorizzati soltanto URL HTTPS con host `sofascore.com` o `www.sofascore.com`, porta assente o `443`, senza credenziali e senza query. I path API devono corrispondere a uno dei tre endpoint riconosciuti. Per gli URL match sono riconosciuti il path `/event/<eventId>` e la forma con fragment `#id:<eventId>` su un path non API.

La normalizzazione rifiuta prima dell’accesso a cache e browser:

* URL non autorizzati o privi di event ID valido;
* combinazioni di URL match e URL API;
* più URL match nello stesso invio;
* batch API riferiti a eventi diversi.

Gli endpoint API vengono ricondotti all’host canonico `www.sofascore.com`; i duplicati sono rimossi conservando l’ordine del primo incontro.

## Pipeline di acquisizione

```txt
input CLI
→ normalizzazione URL
→ cache breve
→ browser headless persistente
→ eventuale fallback headed
→ fetch degli endpoint nel contesto pagina
→ JSON su stdout
```

Il browser ricava l’event ID dagli endpoint normalizzati e naviga prima a:

```txt
https://www.sofascore.com/event/<eventId>
```

Dopo il caricamento della pagina, ogni endpoint viene richiesto tramite `fetch` eseguito nel contesto browser. Il risultato finale è un oggetto JSON indicizzato per URL endpoint.

## Cache runtime breve

Directory:

```txt
backend/scraper_cache/
```

TTL:

```txt
5 secondi
```

La cache è un’ottimizzazione runtime; non è una timeline, una fonte di replay o un archivio canonico.

La chiave è il digest SHA-256 della lista ordinata degli URL canonici serializzata in modo deterministico. Il nome del file non espone gli URL e batch con ordine diverso producono chiavi diverse.

Un risultato è cacheabile soltanto se:

* l’oggetto dei risultati non è vuoto;
* ogni valore associato a un endpoint è un oggetto;
* nessun valore contiene una proprietà top-level `error`.

I risultati di errore prodotti dal browser contengono `error` e non vengono quindi scritti. Una entry assente, scaduta, illeggibile o non più cacheabile è trattata come cache miss. Gli errori di lettura e scrittura della cache non interrompono direttamente la pipeline.

## Browser persistente e fallback headed

Il browser Playwright usa come `user_data_dir`:

```txt
backend/scraper_profile/
```

`backend/scraper_profile/` è un profilo browser persistente e resta distinto da `backend/scraper_cache/`. Può conservare stato locale del sito e non è un dato canonico da esporre nelle risposte applicative.

L’acquisizione parte in modalità headless. Se la pagina ha titolo `Just a moment` o `Attention Required`, oppure la navigazione restituisce HTTP `403`, la prima esecuzione segnala la necessità del fallback:

```txt
headless
→ blocco o challenge rilevato
→ chiusura del contesto
→ nuova esecuzione headed
→ attesa dell’eventuale risoluzione manuale
→ fetch degli endpoint
```

In modalità headed la verifica viene ripetuta ogni secondo, per un massimo di 60 secondi. La challenge è considerata risolta quando il titolo non contiene più `Just a moment` e contiene `Sofa`. Se il budget scade, ogni endpoint riceve un risultato `challenge_unresolved`; il fetch degli endpoint non viene eseguito.

Le invocazioni avviate dal backend sono serializzate fisicamente dal barrier di `directFetch.js`: una nuova esecuzione non parte finché il registry non conferma il completamento del processo precedente. La CLI Python, eseguita direttamente, non introduce un proprio lock di concorrenza.

## Timeout

| Livello                      | Budget             | Comportamento                                                              |
| ---------------------------- | -----------------: | -------------------------------------------------------------------------- |
| Navigazione pagina           | 30 secondi         | timeout Playwright della `page.goto`                                       |
| Risoluzione challenge headed | massimo 60 secondi | polling del titolo ogni secondo                                            |
| Singolo endpoint             | 15 secondi         | `AbortController` nel `fetch` eseguito in pagina                           |
| Intera acquisizione Python   | 105 secondi        | `asyncio.wait_for` attorno all’esecuzione browser                          |
| Bridge Node                  | 120 secondi        | risultato `scraper_timeout` e richiesta di terminazione del processo owned |

Il budget dell’intera acquisizione Python vale anche per l’esecuzione diretta della CLI ed è inferiore al timeout del parent Node.

## Output ed errori

`stdout` è riservato al solo JSON; log e diagnostica Python sono scritti su `stderr`.

Un input CLI assente produce un envelope top-level e termina con stato non zero:

```json
{
  "ok": false,
  "error": {
    "code": "missing_urls",
    "message": "No SofaScore URLs provided"
  }
}
```

Anche un input non valido usa lo stesso schema top-level, con un codice derivato dalla validazione e il messaggio bounded `Invalid SofaScore input`.

Durante l’acquisizione, le failure sono invece associate ai singoli URL:

```json
{
  "https://www.sofascore.com/api/v1/event/123": {
    "ok": false,
    "error": {
      "code": "endpoint_timeout",
      "message": "SofaScore endpoint timed out"
    }
  }
}
```

Per un errore HTTP può essere presente anche `error.status`. I risultati bounded distinguono, tra gli altri, `http_error`, `endpoint_timeout`, `endpoint_fetch_failed`, `endpoint_evaluation_failed`, `challenge_unresolved`, `browser_failure` e `scrape_timeout`. Il testo grezzo delle eccezioni non viene inserito nei risultati pubblici.

La funzione di logging SofaScore applica a ogni messaggio la redazione condivisa con il runtime Betfair: valori sensibili, header sensibili, token bearer e path locali vengono redatti; caratteri di controllo e ANSI vengono rimossi; il testo diagnostico è limitato a 1000 caratteri.

## Bridge Node e lifecycle del processo

`backend/src/sofa/directFetch.js` avvia `scraper.py` come processo Python owned con ruolo `sofa_tracking`, raccoglie `stdout` e ne esegue il parsing JSON solo dopo la chiusura con codice `0`. `stderr` non viene incorporato nel payload restituito al caller.

Il bridge applica un limite predefinito di 2 MiB a `stdout`. Se il limite viene superato:

```txt
buffer stdout azzerato
→ risultato scraper_output_too_large
→ richiesta di terminazione del processo owned
→ nessun parsing del JSON parziale
```

Timeout, cancellazione della generazione di tracking, errore di spawn, uscita non zero e JSON vuoto o non valido vengono convertiti dal bridge in risultati di errore per tutti gli URL richiesti. Anche quando il risultato del caller è già stato risolto, il barrier resta occupato fino alla conferma del completamento fisico del child.

## Confini

Lo scraper SofaScore acquisisce payload grezzi per endpoint. Non possiede le responsabilità downstream di:

* validare e costruire lo snapshot applicativo;
* calcolare `localContext`;
* osservare o modificare Source Identity;
* salvare history o timeline;
* costruire Match Evidence;
* chiamare route Node;
* dipendere da componenti React;
* trattare cache o profilo browser come dati canonici.

`loadSofaAnalysis.js` possiede la costruzione del batch di endpoint e il consumo del bridge; `trackerUpdate.js` possiede normalizzazione, contesto locale, Source Identity gate e avvio della persistenza.

## Verifica

Verifiche owner Python:

```powershell
python -m py_compile .\scraper.py
python -c "from scrapers.sofa.cli import main; print('import OK')"
python -c "from scrapers.sofa.urls import build_sofascore_api_urls; urls = build_sofascore_api_urls('16402319'); assert len(urls) == 3; assert not any('tennis-power-rankings' in url for url in urls); print('Sofa URL builder: OK')"
python -m unittest scrapers.sofa.runtime_contract_test
python -m unittest launcher.tests.test_runtime_hardening
```

`scrapers.sofa.runtime_contract_test` verifica espansione e authority degli URL, rifiuto dei batch non validi, chiave e ammissibilità della cache, schema degli errori, gerarchia dei timeout e output JSON degli errori CLI. `launcher.tests.test_runtime_hardening` verifica inoltre che la diagnostica SofaScore sia bounded e redatta e che l’input CLI assente produca JSON con stato non zero.

Verifica collegata al bridge Node:

```powershell
node .\backend\src\sofa\directFetch.test.mjs
```

Il test copre serializzazione fisica, cancellazione, timeout, spawn failure, rilascio del barrier dopo completamento confermato, assenza degli URL sensibili dai log e limite di `stdout`.

## Documenti collegati

* [Entry point e runtime Python](./01-entrypoints-and-runtime.md)
* [Tracking live](../sofa/01-live-tracking.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
* [API Match](../../api/01-match.md)
