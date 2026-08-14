# Diagnostica e network capture Betfair

## Scopo

Questo documento è l’owner tecnico della diagnostica e della network capture del package Python Betfair.

Il contratto core dello scraper appartiene a [Scraper Betfair](./03-betfair-scraper.md); la grammatica e il mapping delle Graph URL appartengono a [Validazione Graph URL](./04-betfair-graph-url-validation.md).

La capture è diagnostica: non alimenta direttamente timeline, history, Evidence o decisioni runtime.

## Componenti e responsabilità

| File                                       | Responsabilità                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `scrapers/betfair/network_capture.py`      | Filtra le risposte browser, registra e limita i task async, salva dump redatti, estrae candidati JSON e costruisce il summary pubblico |
| `scrapers/betfair/diagnostic_redaction.py` | Redige URL, header, mapping, sequenze, testo libero e path locali                                                                      |
| `scrapers/betfair/scrape.py`               | Crea il collector, installa la capture sulle pagine interessate, esegue il drain e aggiunge `network_capture` al risultato             |
| `scrapers/betfair/cli.py`                  | Espone `--no-network-capture`, applica la redazione ricorsiva finale e mantiene stdout riservato al JSON del risultato                 |
| `scrapers/betfair/config.py`               | Definisce host, filtri, directory del dump e sink di logging redatti                                                                   |

## Attivazione e integrazione

Nel CLI Python diretto la network capture è abilitata per default e viene disabilitata con:

```text
--no-network-capture
```

Il tracking live passa `networkCapture: false`; il runner Node aggiunge quindi `--no-network-capture` al processo Python. La capture non è una dipendenza del percorso live ordinario.

Quando è abilitata, `scrape_betfair(...)`:

1. crea un collector condiviso;
2. prepara la directory locale del dump;
3. registra un handler `response` sulla pagina Betfair principale;
4. registra lo stesso handler sulle eventuali pagine ladder create durante la sessione;
5. chiude le pagine ladder al termine del relativo tentativo;
6. dopo il blocco browser, attende con un limite temporale i task posseduti dalla capture;
7. costruisce il summary e lo assegna a `results.network_capture`.

Il campo `network_capture` viene aggiunto anche quando la capture è disabilitata; in quel caso il summary espone `enabled: false` e contatori vuoti.

## Selezione delle risposte

La capture ignora URL mancanti e host presenti in `EXCLUDED_HOSTS`.

Sono considerate interessanti:

- tutte le risposte provenienti dagli host elencati in `BETFAIR_HOSTS`;
- le risposte provenienti da altri sottodomini `*.betfair.it` soltanto quando il path contiene una keyword configurata in `INTERESTING_PATH_KEYWORDS`.

Per ogni risposta ammessa vengono raccolti, in forma redatta, URL, status, content type, timestamp e header. La capture prova quindi a leggere il body e, quando appare JSON, a decodificarlo, redigerlo e analizzarlo per individuare strutture con chiavi relative a prezzi, quote, traded, volumi, matched, tempo, runner, selection o market.

## Dump locale e soglie

La destinazione configurata è:

```text
backend/betfair_network_dump/
```

Per una risposta ammessa la capture può creare:

- un file metadata JSON;
- un body JSON, se il contenuto viene decodificato come JSON;
- in alternativa, un body testuale redatto quando non è già stato salvato come JSON e non supera 256 KiB.

Un body superiore a 5 MiB non viene salvato e il record metadata riceve `skipped: body_too_large`.

I nomi dei file derivano da timestamp, ultimo segmento redatto della URL e hash della URL redatta. I path completi dei file salvati restano nel collector interno per il conteggio, ma non vengono copiati nel summary pubblico.

## Limiti e lifecycle dei task

Ogni handler `response` crea un task registrato nel set condiviso `collector.tasks`; il task viene rimosso dal set quando termina.

I limiti correnti sono:

| Limite                           | Valore    | Effetto                                                                        |
| -------------------------------- | --------: | ------------------------------------------------------------------------------ |
| Handler concorrenti              | 16        | Un semaforo condiviso limita l’esecuzione di `handle_network_response(...)`    |
| Elementi per lista del collector | 250       | Le aggiunte successive vengono scartate e `collector_truncated` diventa `true` |
| Body acquisibile                 | 5 MiB     | I body più grandi non vengono salvati                                          |
| Fallback testuale                | 256 KiB   | Oltre la soglia non viene creato il file `.txt`                                |
| Drain finale                     | 3 secondi | Allo scadere, i task ancora pendenti vengono cancellati e attesi               |
| URL uniche nel summary           | 25        | `interesting_urls` viene troncato al limite                                    |
| Candidati nel summary            | 50        | L’elenco deduplicato viene troncato al limite                                  |

Se il drain scade, il collector imposta `drain_timed_out: true`; il summary viene costruito soltanto dopo il drain. Il codice non espone nel summary il set dei task, il semaforo, il collector completo o la directory del dump.

## Contratto del summary pubblico

`summarize_network_capture(...)` restituisce esclusivamente:

```text
enabled
response_count
saved_count
json_count
errors_count
interesting_urls
drain_timed_out
collector_truncated
candidates
```

`candidates` contiene descrittori strutturali deduplicati con URL sorgente redatta, path JSON, lunghezza, un campione limitato di chiavi e reason diagnostica. Non contiene il payload JSON completo.

Non fanno parte del contratto pubblico:

```text
dump_dir
saved
responses
json_payloads
errors
tasks
semaphore
```

## Redazione diagnostica

La redazione usa il placeholder:

```text
<REDACTED>
```

Copre:

- query parameter con chiavi sensibili, incluse varianti della app key Betfair;
- header sensibili senza distinzione tra maiuscole e minuscole, inclusi authorization, proxy authorization, cookie, set-cookie e header applicativi;
- mapping e sequenze annidati;
- JSON serializzato o testo libero contenente coppie chiave-valore sensibili;
- token Bearer;
- path Windows con slash o backslash, UNC e path POSIX riconosciuti;
- caratteri di controllo e sequenze ANSI nel testo diagnostico;
- campi numerici non finiti negli eventi del logger strutturato, che non vengono emessi.

Le URL mantengono scheme, host, path, parametri non sensibili e fragment; vengono sostituiti soltanto i valori dei parametri la cui chiave è classificata come sensibile.

Il testo diagnostico viene normalizzato su una sola riga ed è limitato a 1000 caratteri; quando viene troncato termina con `<truncated>`.

Restano disponibili i dati business non sensibili, inclusi identificativi evento, mercato e selection, nome runner, quote, volumi, stati, reason tecniche e contatori diagnostici.

## Punti di applicazione

```text
risposta browser
→ URL, header, metadata e body redatti
→ collector bounded
→ dump locale redatto
→ summary pubblico allow-listed

risultato scraper
→ redact_value(...)
→ eventuale cache consentita
→ JSON su stdout

evento di log
→ campi ammessi e redatti
→ stderr e file log configurato
```

Gli errori HTTP interni del client Betfair conservano lo status HTTP, ma non includono il body remoto raw. Gli errori, le URL e i testi diagnostici aggiunti dal percorso di scraping vengono redatti prima dell’esposizione; il CLI applica inoltre `redact_value(...)` all’intero risultato prima dell’eventuale cache e della serializzazione finale.

`stdout` è riservato al JSON finale dello scraper. La diagnostica usa `stderr` e il file log configurato.

## Confini

Questo owner non descrive:

- acquisizione e normalizzazione core dei dati Betfair;
- grammatica, canonicalizzazione e mapping delle Graph URL;
- polling Node, persistenza canonica, Evidence o UI;
- retention e cleanup generale dei file runtime;
- procedure operative di login, CDP o diagnosi del servizio.

La capture osserva le risposte ricevute dal browser; non modifica il traffico e non aggira TLS.

## Verifica

La copertura direttamente pertinente è distribuita tra:

| Test                                            | Copertura rilevante                                                                                                                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scrapers/betfair/diagnostic_redaction_test.py` | URL, header, payload annidati, testo libero, alias app key, log su stderr/file, dump temporanei redatti, omissione dei body HTTP remoti, path locali, controlli/ANSI, troncamento e omissione dei numeri non finiti dal logger strutturato |
| `scrapers/betfair/runtime_contract_test.py`     | drain dei task posseduti, assenza di `dump_dir` nel summary pubblico e limite del collector                                                                                                                                                |
| `scrapers/betfair/cache_test.py`                | redazione in scrittura e lettura della cache, inclusa una cache legacy                                                                                                                                                                     |

Comando di verifica:

```powershell
python -m unittest -v `
  scrapers.betfair.diagnostic_redaction_test `
  scrapers.betfair.runtime_contract_test `
  scrapers.betfair.cache_test
```

Per verifiche di redazione e dump usare marker fittizi e directory temporanee. Non usare cookie, credenziali, log, cache o dump reali come fixture.

## Documenti collegati

- [Scraper Betfair](./03-betfair-scraper.md)
- [Validazione Graph URL](./04-betfair-graph-url-validation.md)
- [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
- [Retention e cleanup](../../operations/05-retention-and-cleanup.md)
- [Validità tecnica dei campioni](../betfair/02-technical-sample-validity.md)
