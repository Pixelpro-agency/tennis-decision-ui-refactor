# Validazione Graph URL Betfair

## Scopo

Questo documento descrive la grammatica delle Graph URL, il mapping tra mercato e runner e l’integrazione in `scrapers/betfair/scrape.py`.

## Formato accettato

```text
https://graphs.betfair.it/<marketId>/<selectionId>/0
```

Il parser richiede HTTPS, host esatto, nessuna credenziale o porta esplicita, `marketId` numerico con punto, `selectionId` numerico e vista `0`. `runnerChartData` è esplicitamente non supportato.

Query, fragment e slash finale sono tollerati in input. Il parser produce sempre:

```text
canonical_url=https://graphs.betfair.it/<marketId>/<selectionId>/0
```

Soltanto `canonical_url` viene aperta dal browser; query e fragment forniti dall’utente non partecipano al mapping né alla navigazione.

## Mapping fail-closed

Il mapping usa esclusivamente `market_info.market_id` e `runners[].selectionId` ricevuti dall’API Betfair. Non usa nomi, posizione o ordine dei runner.

Reason bounded:

| Reason                                      | Significato                                                |
| ------------------------------------------- | ---------------------------------------------------------- |
| `bad_graph_url_invalid`                     | Grammatica non valida                                      |
| `bad_graph_url_unsupported_endpoint`        | Endpoint non supportato                                    |
| `bad_graph_url_market_identity_unavailable` | Identità mercato API assente o malformata                  |
| `bad_graph_url_market_mismatch`             | Entrambe le identità esistono ma differiscono              |
| `bad_graph_url_selection_not_found`         | Selection non presente nel payload API                     |
| `bad_graph_url_selection_ambiguous`         | Più runner API espongono la stessa selection               |
| `bad_graph_url_duplicate_selection`         | La selection è già stata riservata nella stessa esecuzione |

Runner con `selectionId` nullo vengono ignorati. Se una selection compare più volte nel payload API, nessun runner viene scelto: il mapping fallisce come ambiguo.

## Riserva e assegnazione

Una selection viene riservata dopo il mapping riuscito e prima dell’apertura della pagina. Una seconda URL per la stessa selection viene quindi rifiutata anche se la prima pagina produce ladder vuota, login richiesto o errore temporaneo.

Una URL respinta incrementa i contatori attempted/failed, registra una failure redatta e non apre una pagina. Il ciclo continua con la URL successiva, salvo `auth_required`, che interrompe le richieste successive.

`event_status.hasFinished=true`, proveniente soltanto da evidenza strutturale authoritative, evita l’intero ciclo Graph.

## Preflight e autorità runtime

`POST /api/test/graph-urls` e il parser Python condividono la grammatica sintattica. Il preflight può validare forma, duplicati nella richiesta e uniformità dei market ID dichiarati.

Restano responsabilità esclusiva del runtime Python:

- disponibilità del market ID API;
- confronto con il mercato effettivo;
- unicità e risoluzione del runner API;
- login, challenge e presenza delle righe ladder;
- assegnazione della ladder.

## Riferimenti implementativi

| Passo                | Authority                            |
| -------------------- | ------------------------------------ |
| parsing e forma URL  | validator Graph URL Python           |
| protocollo/host/path | allow-list Betfair                   |
| riserva del target   | stato runtime della sessione scraper |
| preflight HTTP       | route Preflight                      |
| errore pubblico      | mapping bounded condiviso            |

### Pipeline fail-closed

```text
stringa input
→ parse URL
→ protocollo HTTPS
→ hostname Betfair consentito
→ path Graph riconosciuto
→ query ammessa senza esposizione
→ canonicalizzazione
→ reserve/assign una sola volta
```

| Input                                                | Risultato                                   |
| ---------------------------------------------------- | ------------------------------------------- |
| URL Betfair Graph valida                             | canonical target                            |
| forma, protocollo, host, credenziali o path invalidi | `bad_graph_url_invalid`                     |
| endpoint `runnerChartData` legacy                    | `bad_graph_url_unsupported_endpoint`        |
| market identity API assente                          | `bad_graph_url_market_identity_unavailable` |
| market diverso                                       | `bad_graph_url_market_mismatch`             |
| `selectionId` ambiguo                                | `bad_graph_url_selection_ambiguous`         |
| runner non trovato                                   | `bad_graph_url_selection_not_found`         |
| `selectionId` duplicato nella stessa assegnazione    | `bad_graph_url_duplicate_selection`         |

La canonicalizzazione non viene usata per rendere valido un target che non supera l'allow-list. Il valore completo non entra nei log.

### Confine preflight/runtime

```text
preflight
→ prova che l'input è accettabile adesso

runtime assignment
→ resta authority effettiva della sessione
→ ripete i controlli necessari
```

Un preflight positivo non trasferisce ownership, non avvia lo scraper e non garantisce che la sessione browser resterà disponibile.

## Confini

Questo owner valida e assegna il target Graph. Non governa login, lifecycle del processo, cattura di rete, persistenza canonica o qualità tecnica dei campioni.

## Verifica automatica

```powershell
python -m unittest -v `
  scrapers.betfair.graph_url_test `
  scrapers.betfair.graph_loop_test
```

I test offline coprono grammatica, canonicalizzazione, market identity assente, mismatch reale, selection mancante o ambigua, duplicati della richiesta, lista mista, contatori, page skip, assegnazione, ladder vuota e skip per evento terminato.

## Evidenza live

L’archivio [Betfair live validation 2026-07-04](../../../validations/betfair-live-validation-2026-07-04.md) registra due Graph URL tentate e riuscite, mapping ai runner, `ladderSource=graph_url` e matched volume positivo. Registra inoltre logout, `auth_suspected`, ripristino del login e ritorno a `Connected`.

Lo stesso artefatto non identifica esplicitamente la sessione come `mode=cdp` né usa l’etichetta `9B`; questi dettagli non vengono quindi presentati come evidenza storica.

Il collaudo live serve soltanto per aspetti dipendenti da browser e sorgente reale: autenticazione, challenge, compatibilità della pagina e disponibilità effettiva della ladder. Parser, mapping e contatori appartengono ai test deterministici.

## Documenti collegati

- [Scraper Betfair](./03-betfair-scraper.md)
- [Diagnostica e network capture](./05-betfair-diagnostics-and-network-capture.md)
- [API Preflight](../../api/04-preflight.md)
- [Validazione e rollback](../../operations/04-validation-and-rollback.md)
