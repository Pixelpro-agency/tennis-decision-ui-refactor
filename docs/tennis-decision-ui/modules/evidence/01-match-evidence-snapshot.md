# Match Evidence Snapshot

## Scopo

Il Match Evidence Snapshot è una vista read-only costruita dalle timeline canoniche già persistite di SofaScore e Betfair.

Può leggere una conferma Source Identity già persistita per stabilire l’identità effective del contesto corrente, ma non legge né ricostruisce lo stato live del gate.

Può leggere lo stato additivo di persistence integrity, già derivato dai journal canonici, per distinguere una persistenza completa da una persistenza incompleta nota.

Non è:

* una strategia;
* un segnale operativo;
* una previsione;
* una fair odds;
* un’autorizzazione al trade;
* un punto di recovery;
* un owner di history, timeline o journal.

## Implementazione

```txt
backend/src/sofa/matchEvidence.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/matchEvidence/noTradeReasons.js
backend/src/sofa/matchHistory.js
backend/src/routes/evidence.js
```

Flusso:

```txt
timeline SofaScore e/o timeline Betfair
→ lettura integrity SofaScore read-only
→ lettura integrity Betfair read-only
→ boundary canonico delle entry disponibili
→ selezione dell’active Betfair market epoch
→ Source Identity effective
→ buildEvidenceFromTicks
→ dataQuality + noTradeReasons
→ risposta API Evidence
```

L'epoch Betfair attivo è la porzione finale contigua della timeline con la stessa firma di mercato. I tick di epoch storici non partecipano a lookback, market evidence o Market Reactions del contesto corrente.

Il boundary costruisce viste canoniche prima della composizione. Sofa accetta solo entry `source=sofa`; Betfair richiede `source=betfair`, `seq` finito e un array di runner composto da oggetti non-array. Wrong-source, legacy, `seq` non finiti e runner malformed non rendono una timeline `found` e non raggiungono Source Identity o data quality.

La lettura di `integrity` usa l’adapter read-only esposto dal livello storage tramite `getMatchPersistenceIntegrity` e non importa direttamente payload journalizzati, target locali o path filesystem.

## Contratto dello snapshot

Lo snapshot contiene:

```txt
metadata
alignment
dataQuality
sofaEvidence
marketEvidence
marketReactionEvidence
valueHypothesis
externalEvidence
noTradeReasons
```

| Blocco                   | Responsabilità                                                                   |
| ------------------------ | -------------------------------------------------------------------------------- |
| `metadata`               | Event ID, giocatori e timestamp di aggiornamento                                 |
| `alignment`              | Relazione temporale fra feed                                                     |
| `dataQuality`            | Freschezza, health tecnica, tradabilità e `persistenceComplete`                  |
| `sofaEvidence`           | Score, servizio, pressure, marker e contesto campo                               |
| `marketEvidence`         | Runner attribuiti, book, ladder, prezzo e money flow                             |
| `marketReactionEvidence` | Osservazioni temporali senza causalità dichiarata                                |
| `valueHypothesis`        | Placeholder disabilitato finché non esiste un modello calibrato                  |
| `externalEvidence`       | Placeholder per fonti esterne future                                             |
| `noTradeReasons`         | Blocchi espliciti da qualità dati, mercato, allineamento, identità o persistenza |

`marketReactionEvidence.summary.causalityClaimed` resta sempre `false`.

`metadata.updatedAt` è il momento in cui lo snapshot viene costruito. Non misura la freshness di SofaScore o Betfair: quella appartiene a `dataQuality` e ai timestamp delle fonti. Non esiste al momento un campo additivo `computedAt`.

## Persistence integrity nello snapshot

Evidence consuma `integrity` come stato read-only della persistenza canonica.

Gli stati pubblici sono:

```txt
no_known_partial
partial_persistence
recovery_failed
```

Il valore aggregato segue la priorità:

```txt
recovery_failed
→ partial_persistence
→ no_known_partial
```

La forma pubblica arriva dal contratto API Evidence:

```js
{
  "integrity": {
    "status": "no_known_partial | partial_persistence | recovery_failed",
    "reason": "<string|null>",
    "affectedSources": ["sofa", "betfair"],
    "sources": {
      "sofa": {
        "status": "no_known_partial | partial_persistence | recovery_failed",
        "reason": "<string|null>",
        "source": "sofa|null",
        "commitId": "<string|null>",
        "affectedDocuments": ["history", "timeline"]
      },
      "betfair": {
        "status": "no_known_partial | partial_persistence | recovery_failed",
        "reason": "<string|null>",
        "source": "betfair|null",
        "commitId": "<string|null>",
        "affectedDocuments": ["history", "timeline"]
      }
    }
  }
}
```

Evidence usa questa informazione solo per degradare l’uso canonico cross-source e per compilare qualità e reason operative.

Evidence non espone né propaga:

```txt
payload journalizzati
target locali
path filesystem
metadata journal interni
stack trace
dettagli filesystem
cookie
token
payload browser raw
```

`integrity` non è:

```txt
freshness
staleness
tick stale
Source Identity mismatch
Market Reactions
Graph health
ladder reliability
runtime scraper
health Betfair
```

## `persistenceComplete`

Nel blocco `dataQuality`, lo snapshot espone:

```js
{
  "persistenceComplete": true
}
```

oppure:

```js
{
  "persistenceComplete": false
}
```

Regole:

```txt
integrity.status = no_known_partial
→ persistenceComplete:true

integrity.status = partial_persistence
integrity.status = recovery_failed
→ persistenceComplete:false
```

Quando `persistenceComplete:false`, Evidence aggiunge la reason standard:

```txt
Persistence incomplete: canonical cross-source evidence unavailable
```

La reason standard può comparire in più raccolte dello snapshot, tra cui `dataQuality.reasons`, `noTradeReasons` e `marketReactionEvidence.summary.reasons`; in ciascuna raccolta viene deduplicata. Può coesistere con reason Source Identity `pending` o `mismatch` senza duplicati nella stessa raccolta.

La persistence integrity non riscrive la freshness tecnica delle singole fonti in `dataQuality`:

```txt
betfairRecent
sofaRecent
```

Un tick Betfair fresco resta quindi `betfairRecent:true` anche se la persistenza è incompleta.

Il gating cross-source agisce invece sull’allineamento attribuito: quando la persistenza è incompleta, il builder non passa il tick Betfair a `buildAlignment()`. Di conseguenza i campi Betfair/pairwise dell’`alignment` possono risultare non disponibili e `alignmentQuality` / `freshnessQuality` degradano. Questa degradazione dell’allineamento non equivale a rendere stale il tick Betfair grezzo.

## Degradazione cross-source

Quando `integrity.status` è:

```txt
partial_persistence
recovery_failed
```

Evidence blocca l’uso cross-source canonico.

Effetti sullo snapshot:

```txt
runner Betfair attribuiti
→ []

lookback Betfair attribuito
→ non passato al builder downstream

tick Betfair attribuiti a Market Reactions
→ non passati

marketReactionEvidence.available
→ false

marketReactionEvidence.summary.causalityClaimed
→ false
```

La persistenza incompleta è un blocco di usabilità cross-source, non un errore tecnico del tick.

Source Identity effective resta invariata:

```txt
aligned resta aligned
pending resta pending
mismatch resta mismatch
```

Quindi `partial_persistence` o `recovery_failed` non trasformano Source Identity in `mismatch` e non sostituiscono le reason Source Identity esistenti.

## Gate live e Source Identity effective

Esistono due livelli distinti:

```txt
1. Source Identity Gate live
   → autorizza o blocca la persistenza di nuovi campioni

2. Source Identity effective nello snapshot
   → autorizza o blocca l’uso cross-source di timeline già persistite
```

Lo snapshot non è l’autorità per il gate live.

Il frontend non deve dedurre dal suo contenuto se il gate corrente è `collecting`, `pending`, `recording`, `mismatch` o `not-applicable`.

Dopo un cambio di contesto può esistere uno snapshot precedente mentre il gate live è già tornato in buffering o è entrato in mismatch.

### Effetto dell’identità effective

| Stato effective | Dati Betfair attribuiti        | Market Reactions cross-source          | `dataQuality`                   |
| --------------- | ------------------------------ | -------------------------------------- | ------------------------------- |
| `aligned`       | Disponibili per l’epoch attivo | Disponibili senza causalità dichiarata | Valuta il tick Betfair corrente |
| `pending`       | Non attribuiti                 | Sospese                                | Può restare tecnicamente fresca |
| `mismatch`      | Non attribuiti                 | Sospese                                | Può restare tecnicamente fresca |

Quando lo stato effective è `pending` o `mismatch`, il builder esclude dall’uso cross-source:

```txt
tick Betfair attribuito
lookback Betfair
tick Betfair per allineamento esteso
tick Betfair per Market Reactions
runner e money flow attribuiti
```

Il tick Betfair grezzo può comunque contribuire a `dataQuality`: un dato fresco ma non attribuibile non deve essere trasformato artificialmente in dato mancante.

In entrambi gli stati vengono aggiunte ragioni esplicite:

```txt
Source identity pending: cross-source observations unavailable
```

oppure:

```txt
Source identity mismatch: cross-source observations unavailable
```

Le reason di Source Identity e la reason di persistenza incompleta possono coesistere. Nessuna delle due deve cancellare o riscrivere l’altra.

## Snapshot con una sola fonte

Uno snapshot può essere costruito con una timeline SofaScore disponibile e senza timeline Betfair.

In questo caso:

```txt
Source Identity effective
→ pending

marketEvidence.runners
→ []

marketReactionEvidence.available
→ false

noTradeReasons
→ include la mancanza o la staleness Betfair
```

Questo è un comportamento dello snapshot da timeline persistite. Non implica che il gate live sia `not-applicable`, `collecting` o `pending`.

Il composer supporta anche il caso Betfair-only: se Betfair contiene almeno un tick valido e SofaScore non contiene tick canonici, costruisce uno snapshot degradato con Source Identity `pending` e senza uso cross-source. Solo quando entrambe le fonti non forniscono tick ammessi dal boundary restituisce `missing:true`.

I flag `sources.sofaTimelineFound` e `sources.betfairTimelineFound` indicano che, dopo il boundary canonico del composer, è disponibile almeno un tick SofaScore canonico o almeno un tick Betfair valido rispettivamente. Non equivalgono alla semplice esistenza del file né alla presenza di una qualunque entry raw.

A livello storage, `loadTimelineResult()` distingue una timeline `found`, `missing` o `failed` e mantiene reason bounded per discovery, lettura, JSON o shape non validi. Il composer `buildLatestMatchEvidence()` usa però `loadTimeline()`, che restituisce la timeline soltanto quando il risultato storage è `found` e collassa gli altri esiti a `null`; il contratto Evidence corrente non espone quindi quella read-result semantics dettagliata e non tenta recovery automatica.

Se la mancanza di una timeline è accompagnata da `partial_persistence` o `recovery_failed`, Evidence deve mantenere l’assenza osservabile tramite `integrity` e `persistenceComplete:false`, senza tentare recovery.

## Regole read-only

La costruzione dello snapshot non deve:

* avviare scraper;
* fare fetch live;
* aprire browser;
* eseguire recovery;
* scrivere journal;
* aggiungere tick;
* scrivere history;
* modificare timeline raw;
* leggere network dump;
* salvare o revocare conferme manuali.

Può leggere una conferma Source Identity già persistita e applicarla soltanto quando è compatibile con l’event ID e l’epoch corrente.

La lettura del confirmation store è fail-closed. `sources.confirmationStoreStatus` espone `ok`, `unavailable` o `not_applicable`; il campo bounded `confirmationStoreReason` distingue `not_found`, `invalid_json`, `invalid_shape`, `invalid_record`, `read_failed` e `lookup_failed`, senza path, stack o payload.

Nel gate live la conferma viene persistita soltanto dopo un bootstrap riuscito. Un bootstrap fallito lascia fase `pending` e non crea una confirmation durevole; un fallimento della scrittura della confirmation non porta la sessione in `recording`. Lo snapshot continua comunque a rappresentare l'identità effective delle timeline, non la fase corrente del gate live.

Può leggere `integrity` già calcolata dagli adapter read-only, ma non deve usare `integrity` per riparare dati o cambiare lo stato runtime di SofaScore, Betfair, scraper o tracker.

## Invarianti interpretativi

* Lo snapshot non rende una strategia automaticamente valida.
* Il money flow non è intenzione certa dei trader.
* Vicinanza temporale non dimostra causalità.
* Un dato mancante, ambiguo, non attribuibile o degradato da persistenza incompleta deve restare tale.
* Trade on Tennis resta un placeholder finché non sono disponibili dati reali.
* `valueHypothesis.enabled` resta `false` finché non esiste un modello calibrato.
* `sofaEvidence` non espone `momentum`, neppure quando un tick storico contiene ancora quel campo.
* Evidence mantiene marker e pressure disponibili, ma non costruisce una lettura Momentum sostitutiva.
* La costruzione non modifica gli input timeline ricevuti.
* `persistenceComplete:false` non è equivalente a Source Identity mismatch.
* `partial_persistence` e `recovery_failed` non sono health Betfair, Graph health, freshness o runtime scraper.

## Ownership dei dettagli

Questo documento possiede input, ordine di composizione, output, gating cross-source, confine read-only e limiti del composer. Algoritmo e fingerprint Source Identity, Graph/Money Flow, Market Reactions e journal/recovery appartengono ai rispettivi owner collegati e qui sono richiamati soltanto per descrivere come influenzano lo snapshot.

Il domain snapshot è distinto dall'envelope HTTP. La route Evidence restituisce errori pubblici statici e bounded (`evidence_build_failed` per la costruzione) e non propaga message, stack, path, URL o dettagli filesystem ricevuti dalle eccezioni interne.

## Verifica

Dalla cartella `backend/src`:

```txt
node sofa/matchEvidence/latestMatchEvidence/loadingAndEpochs.test.mjs
node sofa/matchEvidence/latestMatchEvidence/manualConfirmation.test.mjs
node sofa/matchEvidence/latestMatchEvidence/persistenceIntegrity.test.mjs
node sofa/matchEvidence/latestMatchEvidence/integrityNormalization.test.mjs
node sofa/matchEvidence/evidenceBuilder/sourceAvailability.test.mjs
node sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
node sofa/matchEvidence/evidenceBuilder/persistenceIntegrity.test.mjs
node sofa/matchEvidence/noTradeReasons.test.mjs
node sofa/matchEvidence/dataQuality.test.mjs
node sofa/matchEvidence/sofaEvidence.test.mjs
node sofa/matchEvidence/sourceIdentityConfirmationStore.test.mjs
node routes/evidence/evidenceRoute.test.mjs
node routes/evidence/evidenceResponses.test.mjs
```

La suite deve verificare almeno:

```txt
epoch Betfair storico escluso
→ soltanto l’epoch finale contribuisce allo snapshot

Source Identity pending o mismatch
→ runner non attribuiti
→ Market Reactions sospese
→ dataQuality Betfair ancora disponibile quando il tick è fresco

snapshot Sofa-only
→ Evidence disponibile
→ nessuna attribuzione di mercato

snapshot Betfair-only
→ Evidence degradato disponibile
→ Source Identity pending
→ nessun uso cross-source

integrity no_known_partial
→ persistenceComplete true

partial_persistence o recovery_failed
→ persistenceComplete false
→ reason Persistence incomplete presente senza duplicati nelle singole raccolte in cui compare
→ runner Betfair attribuiti esclusi
→ Market Reactions cross-source sospese
→ causalityClaimed false

persistence incomplete + Source Identity pending o mismatch
→ reason distinte e senza duplicati
→ Source Identity effective non riscritta

conferma manuale applicabile
→ aligned solo nell’epoch e nel contesto confermati

input timeline
→ immutabili

costruzione Evidence
→ nessuna recovery
→ nessuna scrittura journal
→ nessun fetch live
```

## Documenti collegati

* [Source Identity](./02-source-identity.md)
* [Qualità, flow e allineamento](./03-quality-flow-and-alignment.md)
* [Market Reactions](./04-market-reactions.md)
* [Timeline e history](../storage/01-timelines-and-history.md)
* [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
* [API Evidence](../../api/03-evidence.md)
* [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
