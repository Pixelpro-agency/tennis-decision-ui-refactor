# Timeline e history: facade e contratti core

Questo documento è l'owner del boundary comune di persistenza. I flussi specifici sono descritti in [Persistenza SofaScore](./03-sofa-persistence.md) e [Persistenza Betfair](./04-betfair-persistence.md); journal e recovery appartengono a [Commit journal e recovery](./02-commit-journal-and-recovery.md).

## Scopo

Definire artefatti canonici, discovery, letture fail-closed, API comuni e stato cross-source condiviso senza duplicare i contratti specifici dei writer.

## Stato

History e timeline usano target univoci, read result strutturati e scrittura atomica per singolo file. La coppia di documenti resta coordinata dal commit journal.

## Responsabilità

La facade possiede formato degli artefatti, discovery canonica, letture fail-closed, API comuni e proiezioni cross-source committed. Non possiede le regole di materialità specifiche di SofaScore o Betfair e non possiede recovery o writer authority.

## Struttura corrente

```text
backend/match_history/
├── <history canoniche per eventId>.json
├── sofa_<eventId>.json
├── betfair_<eventId>.json
├── .pending_commits/
│   └── journal sidecar globale
└── .writer_authority/
    └── authority process-level dello storage
```

I nomi dei file canonici includono anche i segmenti descrittivi costruiti dagli helper di storage; lo schema mostra ownership e collocazione, non una filename da costruire manualmente.

## Flusso corrente

```text
eventId + source
→ validazione identità
→ discovery target
   ├── zero candidati → missing
   ├── un candidato → found
   └── più candidati → ambiguous_storage_target
→ lettura e validazione shape
→ decisione di materialità nell'owner della sorgente
→ commit journalizzato
→ write atomica per singolo file
→ promotion dello stato shared soltanto dopo complete
```

```text
history aggregata
→ righe materialmente cambiate
→ può includere la projection committed della sorgente opposta

timeline SofaScore / Betfair
→ tick canonici della singola sorgente
→ materialità e deduplica specifiche
```

## Artefatti canonici

In `backend/match_history/` convivono una history aggregata per `eventId`, le timeline SofaScore e Betfair e il journal sidecar globale `.pending_commits/`.

Ogni documento canonico contiene un oggetto `metadata` e un array `history` oppure `timeline`. `latest` non viene persistito: `loadTimeline()` lo deriva dall'ultimo tick. Un aggiornamento dei soli metadati non viene scritto quando il tick è duplicato e non va presentato come modifica canonica avvenuta.

### History aggregata

La history raccoglie righe prodotte alternativamente dalle due sorgenti e può includere una projection committed della sorgente opposta. Non è una copia della timeline e non conserva ogni poll.

### Timeline per sorgente

Le timeline SofaScore e Betfair conservano tick canonici con materialità propria. Il campo `latest` appartiene esclusivamente alla vista di lettura; i writer persistono `metadata` e `timeline`.

## Letture fail-closed

`loadHistoryResult()` e `loadTimelineResult()` distinguono `found`, `missing`, `discovery_failed`, `read_failed`, `invalid_json`, `invalid_shape` e `ambiguous_storage_target`.

Solo `missing` autorizza l'inizializzazione. Ogni failure blocca la riscrittura: JSON corrotto, shape invalida o errore filesystem non diventano documenti vuoti. Le facade legacy restituiscono il documento solo per `found`; i writer canonici usano i read result strutturati.

La shape minima richiede un documento oggetto, `metadata` oggetto e l'array coerente con il tipo. La compatibilità legacy non viene applicata come normalizzazione silenziosa nel boundary di scrittura.

## Discovery e identità

Per `source + eventId` o per la history aggregata: zero candidati significa `missing`, uno identifica il target, più candidati produce `ambiguous_storage_target`. Non viene scelto il primo file lessicografico né eseguito cleanup automatico.

L'`eventId` attraversa il validator condiviso prima della risoluzione dei target. Discovery ambigua, traversal e identità non canoniche non autorizzano creazione, rinomina o cancellazione automatica.

## API e ownership

`matchHistory.js` espone `getHistoryFile`, `loadHistory`, `loadHistoryResult`, `saveHistory(eventId, historyData, metadata = {}, commitId = null)`, `addSofaUpdate` e `prepareBetfairHistory`.

`addBetfairUpdate` è una facade di compatibilità prepare-only: il commit Betfair appartiene al processor di persistenza.

`timelineStore.js` espone `getTimelineFile`, `loadTimeline`, `loadTimelineResult`, `saveTimeline` e `writeTimelineDocument`.

Le scritture usano file temporaneo e rename sul singolo target. La consistenza della coppia history/timeline è coordinata dal journal.

`saveTimeline()` conserva la semantica legacy ma non trasforma un duplicate tick in un metadata-only write. I consumer non devono interpretare metadata calcolati in memoria come dati persistiti quando il risultato è `unchanged`.

## Stato cross-source

Le projection riusate dalla sorgente opposta rappresentano solo stato canonico confermato. Preparation, failure, partial commit e sample status-only regressivi non promuovono lo stato condiviso. La promozione avviene dopo un commit `complete`; il recovery riusa gli artefatti journalizzati.

Questo impedisce che un sample Betfair fallito compaia in una successiva riga SofaScore o che un sample SofaScore non committato venga incorporato da Betfair. Stato osservato, candidato e committed non sono sinonimi.

## Rappresentazione Betfair condivisa

`selectionId` è l'identità del runner, il confronto è indipendente dall'ordine e i valori mancanti non vengono convertiti in zero. Questo vale anche per market total e Money Flow.

`matchedTotal` del mercato e `totalMatchedOnSelection` del runner restano campi distinti. Le rappresentazioni di deduplica preservano questa distinzione e non usano il nome come identity primaria quando `selectionId` è disponibile.

## Failure model

```text
missing
→ inizializzazione consentita

invalid_json / invalid_shape / read_failed / discovery_failed
→ nessun overwrite
→ failure strutturata

ambiguous_storage_target
→ nessuna selezione automatica
→ intervento esplicito richiesto
```

Il cleanup legacy e i consumer HTTP devono mantenere la stessa distinzione: un errore di lettura non equivale a `unchanged` o `not found`.

## Riferimenti implementativi

| Boundary            | Implementazione                                   |
| ------------------- | ------------------------------------------------- |
| timeline            | `backend/src/sofa/timelineStore.js`               |
| history facade      | `backend/src/sofa/matchHistory.js`                |
| storage e discovery | `backend/src/sofa/matchHistory/storage.js`        |
| SofaScore documents | `backend/src/sofa/matchHistory/sofaUpdates/`      |
| Betfair documents   | `backend/src/sofa/matchHistory/betfairUpdates.js` |

### Shape canoniche

```json
{
  "metadata": {},
  "history": []
}
```

```json
{
  "metadata": {},
  "timeline": []
}
```

La view di lettura può aggiungere:

```json
{
  "latest": "ultimo elemento oppure null",
  "integrity": "stato read-only"
}
```

`latest` e `integrity` non diventano automaticamente campi persistiti.

### Contratto dei read result

| `status` / `reason`                   | Documento        | Scrittura successiva           |
| ------------------------------------- | ---------------- | ------------------------------ |
| `found` / `null`                      | valido           | consentita secondo materialità |
| `missing` / `null`                    | assente          | inizializzazione consentita    |
| `failed` / `invalid_json`             | non affidabile   | vietata                        |
| `failed` / `invalid_shape`            | non canonico     | vietata                        |
| `failed` / `read_failed`              | sconosciuto      | vietata                        |
| `failed` / `discovery_failed`         | sconosciuto      | vietata                        |
| `failed` / `ambiguous_storage_target` | identità ambigua | vietata                        |

## Verifica

Eseguire le suite `storage/discoveryAndRead`, `sofaUpdates/changeDetection`, `sofaUpdates/writerContract`, `betfairUpdates`, `processor/persistenceCommit`, `processor/persistenceRecovery`, `processor/canonicalTimeline` e le integrazioni `timelineStore`.

La matrice copre invalid JSON/shape senza overwrite, discovery ambigua, failure parziali, assenza di leakage cross-source, materialità Sofa separata, identity `selectionId` e distinzione missing/zero.

## Confini

Questo owner non descrive polling, browser, payload HTTP, Source Identity o strategie. Non sostituisce gli owner SofaScore, Betfair e journal/recovery.

## Documenti collegati

- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
- [Commit journal e recovery](./02-commit-journal-and-recovery.md)
- [Persistenza SofaScore](./03-sofa-persistence.md)
- [Persistenza Betfair](./04-betfair-persistence.md)
- [Tracking live](../sofa/01-live-tracking.md)
- [Contesto locale e point-by-point](../sofa/02-local-context-and-point-by-point.md)
- [Validità tecnica dei campioni Betfair](../betfair/02-technical-sample-validity.md)
- [API Match](../../api/01-match.md)
- [API Betfair](../../api/02-betfair.md)
- [API Evidence](../../api/03-evidence.md)
