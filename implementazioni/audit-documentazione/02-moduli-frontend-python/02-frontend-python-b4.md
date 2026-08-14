# 13. Checkpoint B4 — Frontend e Python

[← Checkpoint B3 — documenti owner dei moduli](01-moduli-owner-b3.md) · [Moduli, frontend e Python](../02-moduli-frontend-python.md)

> Questo modulo conserva il record del checkpoint storico B4. Percorsi `.mdx`, qualificatore sui test, finding e osservazioni descrivono il checkpoint; le sottosezioni “Stato corrente” riportano soltanto l’overlay tecnico pertinente.

### 13.1 Perimetro del checkpoint

I documenti frontend registrati al checkpoint erano:

```txt
modules/frontend/01-session-shell.mdx
modules/frontend/02-live-polling-and-view-model.mdx
modules/frontend/03-betfair-and-market-reactions-ui.mdx
modules/frontend/04-match-context-ui.mdx
```

I documenti Python registrati al checkpoint erano:

```txt
modules/python/01-entrypoints-and-runtime.mdx
modules/python/02-sofascore-scraper.mdx
modules/python/03-betfair-scraper.mdx
modules/python/04-betfair-graph-url-validation.mdx
```

Anche questi percorsi `.mdx` sono provenance pre-migrazione. Il checkpoint confrontò allora:

```txt
App.jsx
hook sessione, polling, bootstrap, Source Identity e health
view model e componenti principali
vite.config.js
launcher/app.py e launcher/services.py
wrapper root Python
package scrapers/sofa
package scrapers/betfair
route /api/betfair/odds allora presente nel perimetro
processor Node Betfair
test frontend e Python mirati
```

**Qualificatore del checkpoint:** i test furono letti, ma non eseguiti. Il qualificatore non viene convertito in validazione corrente.

### 13.2 Esito sintetico del checkpoint

| Area                | Osservazione registrata nel checkpoint                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Session shell       | Ownership coerente; Start fallito lasciava poller nascosti                         |
| Polling             | Evidence e Source Identity protetti; SofaScore e Betfair non isolavano le sessioni |
| View model          | Mapping sportivo coerente; pipeline persistence descritta ma assente               |
| Betfair UI          | Money Flow e health coerenti; integrity non arrivava ai componenti                 |
| Market Reactions UI | Rendering puro coerente; riceveva soltanto il sottoblocco Market Reactions         |
| Match Context       | Coerente con il backend e senza fallback inventati                                 |
| Launcher            | Porte dinamiche e proxy Vite collegati                                             |
| Wrapper Python      | Sottili e compatibili                                                              |
| SofaScore scraper   | Contratto principale coerente                                                      |
| Betfair scraper     | Contratto principale coerente con limiti di hardening pubblico                     |
| Graph URL           | Parser e mapping coerenti                                                          |

Questa tabella è la fotografia del B4 e non descrive automaticamente lo stato tecnico attuale del frontend e dei moduli Python.

---

## DOC-018 — Pipeline `integrity` frontend descritta ma non implementata end-to-end

**Stato al checkpoint:** `CONFERMATO`

**Priorità registrata al checkpoint:** alta

### Osservazione storica

Il checkpoint registrò che la documentazione descriveva una pipeline generale:

```txt
integrity SofaScore
+ integrity Betfair
+ integrity Evidence
→ useDashboardViewModel
→ persistence view state
→ componenti UI
```

mentre il codice allora osservato conservava alcuni stati di integrity negli hook ma non li propagava end-to-end alla UI.

Fra le differenze registrate:

- `App.jsx` non destrutturava le integrity Match e Betfair;
- `useDashboardViewModel(...)` non riceveva `sofaIntegrity`, `betfairIntegrity` o `evidenceIntegrity`;
- `BetfairDepthCard.jsx` non riceveva persistence integrity;
- `useMarketReactionEvidence(...)` conservava soltanto il sottoblocco Market Reactions;
- `MarketReactionsPage.jsx` non riceveva top-level integrity, source diagnostics o `persistenceComplete`;
- il `409` SofaScore produceva `partial_persistence` oppure `recovery_failed`, non il nome documentato `persistence_integrity` come `serverStatus`.

Il checkpoint concluse che la descrizione documentale della pipeline frontend era più forte dell’implementazione allora osservata.

### Stato corrente

Il comportamento attuale è diverso da quello registrato nel checkpoint.

`useMatchPolling(...)` espone e conserva:

```txt
integrity
readStatus
serverStatus
current data
lastKnownData
```

con `409 persistence_integrity` normalizzato in stato degradato e `serverStatus` `partial_persistence` oppure `recovery_failed`.

`useBetfairJson(...)` conserva a sua volta `integrity`, `readStatus`, current e last-known e azzera il dato corrente quando la persistenza è degradata.

`useMarketReactionEvidence(...)` conserva oggi:

```txt
latest
evidence = latest.marketReactionEvidence
sources
integrity
persistenceComplete
readStatus
```

`App.jsx` destruttura esplicitamente le integrity Match, Betfair ed Evidence e costruisce:

```txt
buildPersistenceViewState({
  sofaIntegrity,
  betfairIntegrity,
  evidenceIntegrity,
  evidencePersistenceComplete,
  ...
})
```

Il risultato viene passato alla shell/dashboard; `MarketReactionsPage` riceve inoltre `integrity`, `sources`, `persistenceComplete` e `readStatus` e rende separatamente la degradazione della persistenza.

`useDashboardViewModel(...)` continua correttamente a non accettare le tre integrity: nel disegno corrente la persistence view state non è incorporata nel mapping sportivo, ma è costruita separatamente in `App.jsx`. La documentazione canonica corrente descrive questa separazione.

Il finding `DOC-018` resta quindi un record valido del B4, ma la lacuna end-to-end che descriveva non rappresenta il comportamento attuale.

---

## DOC-019 — Hardening Python descritto in modo più forte del comportamento pubblico

**Stato al checkpoint:** `CONFERMATO`

**Priorità registrata al checkpoint:** alta

### Osservazione storica

Il B4 registrò tre esempi in cui il contratto documentato risultava più forte del comportamento allora osservato.

#### Path della network capture

Il checkpoint registrò che `summarize_network_capture(...)` includeva:

```txt
dump_dir
```

nel risultato pubblico del percorso allora collegato allo scraper.

#### Filename della cache

Il checkpoint registrò una cache con filename leggibile derivato dalla URL normalizzata, con il rischio che valori di query non rimossi dalla normalizzazione fossero riconoscibili nel nome del file.

#### Errori pubblici

Il checkpoint registrò superfici HTTP che potevano restituire `error.message` e producer Python che trasformavano direttamente `str(error)` in output.

La distinzione documentale richiesta allora era:

```txt
contenuti diagnostici redatti
≠
garanzia che ogni superficie pubblica sia priva di path o dettagli runtime
```

### Stato corrente

I tre esempi storici non sono riprodotti nello stesso modo nei percorsi correnti.

#### Network capture corrente

`network_capture.py` conserva internamente i path dei file salvati nel collector, ma `summarize_network_capture(...)` restituisce un allow-list con:

```txt
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

Il summary pubblico non include `dump_dir` né i nomi completi dei file salvati.

#### Cache corrente

`cache.py` costruisce la chiave come digest SHA-256 di URL normalizzata, request identity e versione di schema:

```txt
normalized URL + request identity + schema
→ JSON deterministico
→ SHA-256
→ <digest>.json
```

Il filename non contiene quindi la URL in forma leggibile. Lettura e scrittura applicano inoltre `redact_value(...)` al payload.

#### Errori e output corrente

`buildMatchAnalysisResponse(...)` converte gli errori interni in risposte pubbliche bounded con codici e messaggi statici per i casi classificati, anziché restituire direttamente `error.message`.

Lo scraper Betfair applica `redact_value(...)` all’intero risultato prima della stampa JSON. `redact_text(...)` rimuove o redige query sensibili, header/token, path locali e caratteri di controllo e limita il testo diagnostico a una lunghezza massima. Il payload può comunque contenere campi `error` o `api_error` redatti: questa osservazione non viene trasformata nella pretesa che ogni errore Python sia necessariamente una enum statica.

Il percorso storico `/api/betfair/odds` citato nel B4 non è presente fra le route Betfair correnti e resta quindi soltanto un riferimento del checkpoint.

Le esposizioni specifiche registrate da `DOC-019` risultano rimosse o cambiate nei percorsi a cui il finding si riferiva; il rilievo non implica garanzie ulteriori su superfici diverse.

---

## 13.3 Frontend — rilievi collegati registrati nel checkpoint

### Sessione e Start fallito

Il B4 registrò il seguente effetto storico:

```txt
Start fallito
→ shell nascosta
→ input preservati
→ configurazione confermata ancora valorizzata
→ poller ancora autorizzati indirettamente
```

#### Stato corrente

Il lifecycle corrente usa `sessionActive` e `trackingSessionId` come identificatori che autorizzano la sessione frontend. In `useLiveTrackingActions(...)` la sessione viene attivata soltanto dopo una risposta Start con `trackingSessionId` valido.

In caso di failure Start il codice corrente:

```txt
reset dashboard bootstrap
→ clearConfirmedSession
→ sessionActive false
→ trackingSessionId null
→ shell nascosta
→ errore Start bounded
```

`App.jsx` passa URL/eventId ai poller Match, Betfair ed Evidence soltanto quando `sessionActive=true`. L’effetto storico dei poller nascosti non viene quindi promosso a comportamento corrente.

### Polling e lifecycle

Il B4 registrò l’assenza di cancellazione delle richieste in flight per Match e Betfair, mentre Evidence e Source Identity avevano già meccanismi più forti.

#### Stato corrente

Gli hook Match e Betfair usano entrambi:

```txt
setTimeout ricorsivo
pollGeneration
requestId
AbortController
active request ownership
stale response guard
cleanup su cambio lifecycle/unmount
```

Il test `frontend/src/hooks/pollingLifecycle.test.mjs` copre, fra gli altri casi, abort sul cambio evento/configurazione e scarto di una risposta Match tardiva.

L’osservazione storica sulla mancanza di isolamento di Match/Betfair non descrive quindi il comportamento attuale.

### Metodi Source Identity legacy

Il B4 registrò che `useMarketReactionEvidence(...)` esportava:

```txt
confirmSourceIdentity
revokeSourceIdentityConfirmation
```

mentre la shell usava il gate live come riferimento globale.

I due metodi sono ancora esportati dall’hook Evidence, mentre `App.jsx` usa `useSourceIdentityGateUi(...)` per il flusso globale di conferma/mismatch. Il dato viene conservato come confine legacy del modulo, senza trasformarlo in un secondo riferimento globale della shell.

### Copy mojibake

Il checkpoint registrò stringhe mojibake visibili nel sorgente frontend allora analizzato. Questa nota resta provenance del B4 e non costituisce una valutazione generale del copy frontend attuale.

---

## 13.4 Aree coerenti registrate nel checkpoint

Le aree seguenti sono conservate come risultato storico del B4. Non sostituiscono gli owner tecnici correnti.

### Porte dinamiche frontend/backend

Il checkpoint registrò:

```txt
launcher seleziona backend
→ VITE_BACKEND_TARGET usa la porta scelta
→ Vite proxy /api inoltra al backend effettivo
```

La nota associata era di non introdurre host assoluti nei client frontend.

### Source Identity UI

Il checkpoint registrò:

```txt
session ID
request ID
AbortController
una sola fetch per sessione
```

con conferma e mismatch posseduti dal flusso UI Source Identity.

### Money Flow UI

Il checkpoint registrò come coerenti:

```txt
selectionId come identità
→ 20 slot condivisi
→ volume abbinato neutro
→ nessuna barra per punti invalidi
→ base tecnica minima 100
```

### Match Context

Il checkpoint registrò che il frontend:

- inoltrava `localContext`;
- validava numeri e finestra;
- non decodificava point-by-point;
- non creava fallback numerici;
- non trasformava differenze in segnali.

### Wrapper e launcher

Il checkpoint registrò i wrapper root come sottili e il launcher come responsabile di:

- selezione porte senza kill-by-port;
- configurazione Vite verso il backend effettivo;
- preservazione del CDP esterno;
- terminazione dei soli processi owned.

### Graph URL

Il checkpoint registrò:

```txt
https obbligatorio
graphs.betfair.it
marketId / selectionId / 0
no credenziali o porta
no fallback per nome
duplicato riservato dopo mapping
skip delle URL successive salvo auth_suspected terminale
```

---

## Esito B4

Esito registrato alla chiusura del checkpoint:

```txt
frontend e Python verificati
→ contratti coerenti preservati
→ pipeline integrity falsa classificata
→ race sessione e failure Start registrate
→ hardening diagnostico incompleto registrato
→ nessuna modifica a docs/ o al codice durante il checkpoint
```

La frase “nessuna modifica” riguarda esclusivamente l’esecuzione storica del B4.

La fase successiva allora indicata era:

```txt
B5 — Operations e roadmap
```

---

## Navigazione

- [← Checkpoint B3 — documenti owner dei moduli](01-moduli-owner-b3.md)
- [← Facade: Moduli, frontend e Python](../02-moduli-frontend-python.md)
- [Operations, roadmap e controlli →](../03-operations-roadmap-e-controlli.md)
