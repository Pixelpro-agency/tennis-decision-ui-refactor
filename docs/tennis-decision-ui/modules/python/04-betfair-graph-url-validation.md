# Validazione Graph URL Betfair

## Stato

**Implementato e coperto da verifiche deterministiche; il percorso positivo e alcuni casi dipendenti dalla sessione sono osservati live con i limiti registrati nell’archivio di validazione.**

Il parser, il mapping fail-closed e il Graph loop sono verificati offline. L’evidenza live del 4 luglio 2026 documenta due Graph URL tentate e riuscite, l’assegnazione della ladder ai runner e il successivo comportamento di logout e ripristino della sessione. Non estende questi risultati ai casi live che l’archivio dichiara non eseguiti.

## Scopo

Questo documento è l’owner tecnico della grammatica delle Graph URL dirette e del mapping runtime Python tra:

```text
marketId della URL
→ market_info.market_id ricevuto dall’API Betfair
→ selectionId della URL
→ runner API
→ ladder estratta dalla pagina Graph
```

Descrive:

- parsing e canonicalizzazione della URL diretta;
- costruzione della mappa delle selection API;
- verifica dell’identità di mercato e runner;
- prenotazione delle selection nella singola esecuzione;
- integrazione del Graph loop in `scrapers/betfair/scrape.py`;
- confine tra validazione preliminare del backend e autorità runtime Python;
- separazione tra test deterministici ed evidenza live.

Non descrive l’intero scraper Betfair, la CLI Python, la persistenza, Source Identity, il frontend, la semantica Back/Lay o la validità del Money Flow.

## Formato diretto accettato

```text
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

Esempio:

```text
https://graphs.betfair.it/1.23456789/101/0
```

Il parser Python richiede:

| Parte | Regola |
| --- | --- |
| schema | esclusivamente `https` |
| host | esclusivamente `graphs.betfair.it` |
| authority | nessuna credenziale e nessuna porta esplicita |
| path | esattamente `/<marketId>/<selectionId>/0`, salvo uno slash finale |
| `marketId` | una o più cifre, un punto, una o più cifre |
| `selectionId` | una o più cifre |
| vista | esclusivamente `0` |

Query, fragment e slash finale sono tollerati in input. Dopo la validazione, il parser restituisce sempre:

```text
canonical_url=https://graphs.betfair.it/<marketId>/<selectionId>/0
```

Soltanto `canonical_url` viene passata a `extract_ladder_from_url()`: query e fragment dell’input non partecipano al mapping e non vengono riutilizzati per la navigazione.

L’endpoint legacy `runnerChartData` è esplicitamente respinto dal parser Python con `bad_graph_url_unsupported_endpoint`. Gli altri errori di forma usano `bad_graph_url_invalid`. La canonicalizzazione avviene dopo l’allow-list e non rende valido un target che non la supera.

## Mapping fail-closed

### Identità di mercato

L’identità upstream attesa proviene esclusivamente da `market_info.market_id`, popolato da `fetch_market_data_api()` con il `marketId` del mercato `MATCH_ODDS` restituito da Betfair.

```text
market_info.market_id assente o non conforme
→ bad_graph_url_market_identity_unavailable

market_info.market_id valido ma diverso dal marketId della URL
→ bad_graph_url_market_mismatch
```

L’assenza o la malformazione dell’identità upstream non viene classificata come mismatch: `bad_graph_url_market_mismatch` richiede due identità confrontabili e differenti.

### Identità del runner

`build_selection_map()` considera soltanto runner rappresentati da oggetti e con `selectionId` non nullo. Ogni chiave è la rappresentazione stringa del `selectionId` ricevuto dall’API.

Il mapping non usa fallback basati su:

```text
nome runner
indice del runner
ordine nel payload
```

Se la stessa selection compare in più runner API, viene rimossa dalle selection risolvibili e registrata come ambigua. Nessuno dei runner viene scelto:

```text
selectionId presente più volte nel payload API
→ bad_graph_url_selection_ambiguous
```

Una selection non ambigua ma assente dalla mappa produce `bad_graph_url_selection_not_found`.

### Reason bounded del parser e del mapping

| Reason                                      | Significato                                                 |
| ------------------------------------------- | ----------------------------------------------------------- |
| `bad_graph_url_invalid`                     | Input assente o grammatica non valida                       |
| `bad_graph_url_unsupported_endpoint`        | Endpoint `runnerChartData` non supportato dal parser Python |
| `bad_graph_url_market_identity_unavailable` | Identità mercato API assente o malformata                   |
| `bad_graph_url_market_mismatch`             | Identità URL e API entrambe disponibili ma differenti       |
| `bad_graph_url_selection_not_found`         | Selection non presente tra i runner API risolvibili         |
| `bad_graph_url_selection_ambiguous`         | Più runner API espongono la stessa selection                |
| `bad_graph_url_duplicate_selection`         | Selection già prenotata nella stessa esecuzione             |

## Pipeline runtime

```text
Graph URL di input
→ parse_direct_ladder_url()
→ canonicalizzazione
→ build_selection_map() sui runner API
→ verifica di market_info.market_id
→ risoluzione univoca del selectionId
→ controllo seen_selection_ids
→ prenotazione della selection
→ apertura di una nuova pagina
→ extract_ladder_from_url(canonical_url)
→ assegnazione della ladder al solo runner risolto
```

| Fase         | Esito positivo                                       | Esito negativo                                           |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| parsing      | IDs e URL canonica                                   | failure sintattica; nessuna pagina aperta                |
| mercato      | market ID uguale a quello API                        | identità indisponibile o mismatch; nessuna pagina aperta |
| runner       | un solo runner risolto                               | selection assente o ambigua; nessuna pagina aperta       |
| duplicato    | selection non ancora vista                           | selection duplicata; nessuna pagina aperta               |
| estrazione   | almeno una riga ladder                               | login, challenge, ladder vuota o errore                  |
| assegnazione | `runner.ladder` e `runner.ladder_source="graph_url"` | nessuna assegnazione o sovrascrittura                    |

## Prenotazione e assegnazione

La selection viene aggiunta a `seen_selection_ids` dopo il mapping riuscito e prima dell’apertura della pagina Graph. La prenotazione riguarda quindi il target risolto, non il successo dell’estrazione.

```text
prima URL mappata
→ selection prenotata
→ apertura pagina
→ ladder valida, vuota, login richiesto o errore temporaneo

seconda URL per la stessa selection
→ bad_graph_url_duplicate_selection
→ nessuna nuova pagina
```

Questa regola impedisce che una URL successiva assegni o sovrascriva la ladder dello stesso runner nella medesima esecuzione. `graphUrlsSucceeded` aumenta soltanto quando sono presenti righe ladder e l’assegnazione è avvenuta.

## Failure, contatori e controllo del ciclo

`graph_diagnostics` registra:

| Campo                    | Significato                                              |
| ------------------------ | -------------------------------------------------------- |
| `graphUrlsProvided`      | Numero di URL ricevute dal runtime                       |
| `graphUrlsAttempted`     | URL raggiunte dal Graph loop                             |
| `graphUrlsSucceeded`     | Ladder non vuote assegnate ai runner                     |
| `graphUrlsFailed`        | Failure di parsing, mapping, autenticazione o estrazione |
| `graphRowsTotal`         | Somma delle righe delle ladder assegnate                 |
| `authSuspected`          | Login richiesto rilevato su una pagina Graph             |
| `loggedInHeuristic`      | Esito dell’euristica di login sulla pagina principale    |
| `skippedBecauseFinished` | Graph loop saltato perché l’evento risulta terminato     |
| `failures`               | Prime cinque failure diagnostiche redatte                |

Una failure di parsing o mapping incrementa `graphUrlsAttempted` e `graphUrlsFailed`, non crea una pagina e lascia proseguire il ciclo. Anche ladder vuota, security challenge ed errore temporaneo incrementano le failure e permettono di passare alla URL successiva.

Il caso di login richiesto sulla pagina Graph è l’eccezione:

```text
login_required
→ diagnostics redatte nel risultato
→ authSuspected=true
→ failure auth_required
→ interruzione delle URL rimanenti
```

Le failure conservano `reason` e valori redatti di `url` ed eventuale `text`, ciascuno troncato a 200 caratteri. L’elenco è limitato a cinque elementi; i contatori continuano invece a rappresentare l’intero ciclo.

Se `event_status.hasFinished` è vero, il Graph loop non inizia:

```text
skippedBecauseFinished=true
graphUrlsAttempted=0
nessuna pagina Graph aperta
```

## Preflight backend e autorità runtime

`POST /api/test/graph-urls` usa `validateGraphUrls()` per una verifica preliminare dell’input. Accetta un array oppure una stringa separata da virgole o righe e restituisce il dettaglio di ogni URL, i conteggi e `sameMarket`.

Il preflight e il parser Python condividono la forma diretta accettata: HTTPS, host esatto, nessuna credenziale o porta esplicita, path `/<marketId>/<selectionId>/0`, market ID numerico con punto e selection ID numerico. Entrambi respingono selection duplicate nella richiesta.

I due livelli non sono però la stessa autorità e non hanno un contratto di errore identico:

- nel backend `runnerChartData` ricade in `bad_graph_url_invalid`; il reason specifico `bad_graph_url_unsupported_endpoint` appartiene al parser Python;
- `sameMarket` descrive se le URL sintatticamente valide osservate appartengono a un solo market ID; un valore `false` non rende da solo `ok=false`;
- il backend non possiede il `market_info.market_id` né i runner della risposta API Betfair;
- query e fragment sono tollerati da entrambi, ma solo Python produce e apre la URL canonica;
- l’accettazione definitiva e l’assegnazione della ladder restano nel runtime Python.

| Controllo                                      | Preflight backend   | Runtime Python                          |
| ---------------------------------------------- | ------------------- | --------------------------------------- |
| input vuoto                                    | sì                  | trattato dal chiamante come lista vuota |
| grammatica della URL diretta                   | sì                  | sì                                      |
| selection duplicate nella richiesta/esecuzione | sì                  | sì                                      |
| uniformità dei market ID dichiarati            | espone `sameMarket` | confronta ogni URL con il market API    |
| identità mercato API disponibile               | no                  | sì                                      |
| selection presente e univoca nel payload API   | no                  | sì                                      |
| canonicalizzazione per la navigazione          | no                  | sì                                      |
| autenticazione, challenge e righe ladder       | no                  | sì                                      |
| assegnazione al runner                         | no                  | sì                                      |

Un preflight positivo non avvia lo scraper, non prenota selection e non garantisce la disponibilità futura della sessione browser o della ladder.

## Verifica deterministica

Dalla cartella che contiene `scrapers/`:

```powershell
python -m unittest -v `
  scrapers.betfair.graph_url_test `
  scrapers.betfair.graph_loop_test
```

`graph_url_test.py` verifica:

- parsing e canonicalizzazione della forma diretta;
- query, fragment e slash finale;
- schema, host, path e vista invalidi;
- rifiuto esplicito di `runnerChartData`;
- identità upstream del mercato indisponibile distinta dal mismatch;
- selection assente, duplicata nella sessione o ambigua nel payload API;
- esclusione dei `selectionId` nulli.

`graph_loop_test.py` verifica in integrazione controllata:

- lista mista valida/invalida;
- skip delle pagine per URL respinte;
- prenotazione prima dell’estrazione;
- navigazione mediante URL canonica;
- contatori completi;
- assegnazione della ladder e `ladder_source="graph_url"`;
- ladder vuota senza assegnazione;
- skip completo per evento terminato.

La validazione backend ha un test separato in `backend/src/routes/test/graphUrlValidation.test.mjs`. Questi test sono deterministici e non aprono Betfair reale.

## Evidenza live

L’archivio [Validazione live Betfair — 4 luglio 2026](../../../validations/betfair-live-validation-2026-07-04.md) registra:

- due Graph URL fornite, tentate e riuscite;
- `ladderSource=graph_url` per entrambi i runner;
- `selectionId` stabile;
- matched volume positivo;
- logout durante una sessione stabile, `graphHealth auth_suspected`, alert, ripristino del login e ritorno a `Connected`.

Lo stesso archivio non registra lo SHA della sessione sorgente, non identifica esplicitamente `mode=cdp` e non usa l’etichetta `9B`. Dichiara inoltre non eseguiti i casi live di Graph URL malformate, mismatch `marketId`, errore API/rete reale, login già scaduto all’avvio e mercato realmente terminato.

I claim su parser, mapping, duplicati, contatori e skip derivano quindi dai test deterministici. L’evidenza live resta limitata agli aspetti effettivamente osservati della pagina e della sessione reale.

## Confini

Questo owner governa la validazione e l’assegnazione del target Graph. Non governa:

- lifecycle complessivo del processo o modalità della sessione browser;
- logica generale di login e stato dell’evento;
- cattura di rete e conservazione dei dump;
- persistenza di timeline e history;
- Source Identity;
- validità tecnica dei campioni o classificazione del Money Flow;
- comportamento del frontend.

## Documenti collegati

- [Scraper Betfair](./03-betfair-scraper.md)
- [Diagnostica e network capture](./05-betfair-diagnostics-and-network-capture.md)
- [API Preflight](../../api/04-preflight.md)
- [Validazione e rollback](../../operations/04-validation-and-rollback.md)
