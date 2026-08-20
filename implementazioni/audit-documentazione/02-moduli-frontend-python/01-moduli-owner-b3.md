# 12. Checkpoint B3 — documenti owner dei moduli

[← Moduli, frontend e Python](../02-moduli-frontend-python.md) · [Checkpoint B4 — Frontend e Python →](02-frontend-python-b4.md)

> Questo modulo conserva il record del checkpoint storico B3. Baseline storica, qualificatore sui test, finding e decisioni differite descrivono il checkpoint; le sottosezioni “Stato corrente” riportano soltanto l’overlay tecnico pertinente.

### Perimetro del checkpoint

Il checkpoint B3 fu eseguito sullo SHA storico:

```txt
b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

I documenti registrati allora coprivano:

```txt
SofaScore
→ live tracking
→ local context e point-by-point

Betfair
→ scraper lifecycle
→ validità tecnica del sample

Storage
→ timeline e history
→ commit journal e recovery

Evidence
→ Match Evidence Snapshot
→ Source Identity
→ qualità, flow e alignment
→ Market Reactions
```

Il confronto storico coprì tracking, gate, point-by-point, local context, processor Betfair, timeline, history, journal, recovery, Evidence e Market Reactions.

**Qualificatore del checkpoint:** i test furono letti, ma non eseguiti. Il qualificatore riguarda esclusivamente il checkpoint B3 e non equivale a un PASS corrente.

### Esito sintetico del checkpoint

| Documento              | Osservazione registrata nel checkpoint            | Tema documentale registrato                                                  |
| ---------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Tracking live          | Contratto principale coerente, file troppo esteso | Ownership troppo ampia rispetto a scheduler e orchestrazione                 |
| Local context/PBP      | Coerente con il codice osservato                  | Validazione live dell’assunzione sull’ultimo game separata dal checkpoint    |
| Lifecycle Betfair      | Coerente, ma sovrapposto a Runtime e Storage      | Confini fra owner                                                            |
| Validità tecnica       | Coerente nel dominio                              | Ordine tracking key/classificazione descritto in modo non aderente al codice |
| Timeline/history       | Sostanzialmente coerente                          | Distinzione fra facade storage e journal                                     |
| Journal/recovery       | Coerente e vicino a un owner autonomo             | Pulizia strutturale e separazione dell’owner documentale                     |
| Match Evidence         | Coerente                                          | Ripetizioni su integrity e identity                                          |
| Source Identity        | Coerente                                          | Distinzione gate live/effective snapshot da preservare                       |
| Qualità/flow/alignment | Coerente                                          | Ripetizioni fra owner Evidence                                               |
| Market Reactions       | Filosofia coerente, input descritto male          | Composizione nel builder e confini del modulo                                |

La tabella sopra è lo snapshot del checkpoint. Non costituisce una lista di interventi correnti.

---

## DOC-014 — Tracking key Betfair calcolata prima della classificazione

**Stato al checkpoint:** `CONFERMATO`

**Priorità registrata al checkpoint:** media documentale, bassa operativa

### Osservazione storica

Il checkpoint registrò che la documentazione descriveva:

```txt
fetch
→ classificazione tecnica
→ tracking key
→ gate
→ persistenza
```

ed escludeva la chiamata a `getBetfairTrackingKey` per un campione tecnico non utilizzabile.

Il codice osservato nel checkpoint eseguiva invece:

```txt
fetch
→ hasFinished
→ getBetfairTrackingKey
→ classifyBetfairTechnicalSample
```

La conclusione storica fu che la discrepanza era documentale e non dimostrava un bug operativo, perché `getBetfairTrackingKey` era una trasformazione pura basata sulla chiave dello scraper e non modificava gate, baseline o persistenza.

### Stato corrente

`backend/src/sofa/betfair/trackerUpdate.js` conserva l’ordine:

```txt
fetch
→ hasFinished
→ getBetfairTrackingKey
→ classifyBetfairTechnicalSample
→ eventuale gate/persistenza
```

I documenti canonici correnti di lifecycle e validità tecnica Betfair non ripropongono la vecchia sequenza che collocava obbligatoriamente la tracking key dopo la classificazione e non affermano che un sample inutilizzabile eviti la costruzione della key.

Il fatto tecnico originario resta parte della provenance del checkpoint; la specifica contraddizione documentale registrata allora non descrive un finding corrente.

---

## DOC-015 — I documenti owner B3 duplicano contratti trasversali

**Stato al checkpoint:** `CONFERMATO`

**Priorità registrata al checkpoint:** alta

### Osservazione storica

Il checkpoint registrò sovrapposizioni come:

```txt
Tracking live
→ registry, generation, Betfair validity, Source Identity, storage

Lifecycle Betfair
→ registry, tracker, processor, storage, integrity, retention

Timeline/history
→ gate, validità Betfair, journal, recovery, logout Graph

Documenti Evidence
→ integrity, persistenceComplete, Source Identity, no-causality
```

L’ownership di riferimento annotata nel checkpoint separava i domini in questo modo:

```txt
Tracking live
→ scheduler e orchestrazione

Runtime
→ generation, processi e terminazione

Validità tecnica Betfair
→ classificazione del sample

Source Identity
→ gate, effective identity e conferma

Timeline/history
→ documenti canonici e writer

Journal/recovery
→ commit multi-documento, integrity e repair

Match Evidence
→ composizione snapshot

Qualità/flow/alignment
→ qualità e osservazioni descrittive

Market Reactions
→ Market → Field e Field → Market
```

Questa mappa appartiene al record della razionalizzazione documentale e non autorizza, da sola, modifiche al codice o agli altri documenti.

### Stato corrente

I documenti canonici correnti esplicitano confini e collegamenti fra owner: Storage distingue facade, writer specifici e journal; Betfair separa lifecycle e validità tecnica; Market Reactions dichiara i propri confini rispetto a Evidence, persistence e Source Identity; il frontend distingue polling, view model sportivo e persistence view state.

`DOC-015` resta un finding storico di ownership. Non costituisce un’affermazione globale sulla presenza attuale di duplicazioni in tutta la documentazione canonica.

---

## DOC-016 — Facade Storage e formule read-only troppo forti

**Stato al checkpoint:** `CONFERMATO`

**Priorità registrata al checkpoint:** media

### Osservazione storica

#### `addBetfairUpdate`

Il checkpoint registrò che `addBetfairUpdate` veniva presentata come API della history, mentre il codice la trattava come facade di compatibilità:

```txt
addBetfairUpdate
→ prepareBetfairHistory
→ prepara soltanto il documento
```

Il commit canonico Betfair journalizzato apparteneva al processor.

#### Inizializzazione delle directory

Il checkpoint registrò inoltre che `timelineStore.js` poteva creare `backend/match_history/` al caricamento e che `createHistoryStorage(...)` inizializzava la directory ricevuta.

La distinzione utile era quindi:

```txt
request read-only
→ nessuna scrittura canonica di history/timeline/journal

inizializzazione storage
→ può assicurare directory project-owned
```

La formula assoluta “l’intero modulo non crea mai directory” era più forte del comportamento osservato.

### Stato corrente

Il comportamento tecnico mantiene quella distinzione:

```txt
addBetfairUpdate
→ facade di compatibilità prepare-only

processor Betfair
→ owner del commit canonico journalizzato

timelineStore / createHistoryStorage
→ possono assicurare l’esistenza delle directory di storage
```

La documentazione canonica corrente di Storage descrive esplicitamente `addBetfairUpdate` come facade `prepare-only` e separa il boundary comune dai writer specifici e dal journal/recovery.

La discrepanza documentale appartiene quindi al checkpoint storico e non descrive la documentazione canonica corrente.

---

## DOC-017 — Market Reactions non riceve uno snapshot già costruito

**Stato al checkpoint:** `CONFERMATO`

**Priorità registrata al checkpoint:** media

### Osservazione storica

Il checkpoint registrò come non aderente al codice la formula:

```txt
Market Reactions consuma solo snapshot Evidence già costruiti
```

Il flusso osservato era invece:

```txt
buildLatestMatchEvidenceFromTimelines
→ selezione epoch e tick
→ buildEvidenceFromTicks
→ scoping per Source Identity e integrity
→ buildMarketReactionEvidence({ sofaTicks, betfairTicks, now })
→ snapshot Evidence finale
```

Il punto documentale era quindi che Market Reactions veniva composto durante il builder e riceveva tick già selezionati/scoped, non uno snapshot Evidence completo.

### Stato corrente

Il flusso corrente mantiene questo confine. `latestMatchEvidence.js` seleziona timeline, epoch e tick; `evidenceBuilder.js` applica lo scoping necessario e chiama `buildMarketReactionEvidence(...)`; il risultato viene poi inserito nello snapshot Evidence finale.

La documentazione canonica corrente di Market Reactions descrive il composer Evidence come sorgente degli input utilizzabili e dichiara che il dominio non legge direttamente gate live, journal o storage.

La specifica descrizione errata registrata da `DOC-017` non è presente nella documentazione canonica corrente.

---

## Ulteriori verifiche registrate nel checkpoint B3

Le sottosezioni seguenti conservano osservazioni del checkpoint che allora non produssero discrepanze funzionali confermate. Restano record storico e non sostituiscono gli owner tecnici correnti.

### Local context e point-by-point

Il checkpoint registrò:

```txt
token: 0, 15, 30, 40, A
→ ultimo game escluso come potenzialmente aperto
→ esatti tre game precedenti
→ nessun fallback a game più vecchi
→ available basato su pointsTotal
→ qualità complete solo con finestra recente valida
```

`SOFA-001` rimase un riferimento separato di validazione live e non viene riaperto da questo documento.

### Journal e recovery

Il checkpoint registrò:

```txt
commitId source-UUID
→ pending prima dei writer
→ marker history/timeline
→ verifica target completed residual
→ riapertura marker mancanti
→ recovery prima di listen
→ fatal globale separato dalle failure per-file
```

Questa sequenza resta provenance del B3; l’owner tecnico corrente di journal/recovery è esterno a questo registro.

### Source Identity

Il checkpoint registrò lifecycle e azioni:

```txt
collecting / pending / recording / mismatch / not-applicable

buffered / persist-current / bootstrapped / blocked / no-gate
```

Registrò inoltre confirmation store atomico e separazione fra gate live ed effective identity. Queste note non sostituiscono l’owner canonico Source Identity corrente.

### Logout Graph `status-only`

Il checkpoint registrò come coerente la limitazione del comportamento `status-only` ai casi previsti dalla persistence decision e mantenne `TEST-001` come riferimento separato.

`TEST-001` resta un riferimento storico e non viene presentato come PASS.

---

## Decisione differita al checkpoint — EVIDENCE-001

Il checkpoint registrò che Field → Market confrontava i runner secondo questa distinzione:

```txt
selectionId presente
→ match per selectionId

selectionId assente
→ fallback su nome identico e selectionId assente
```

Le alternative annotate allora erano:

```txt
A. selectionId obbligatorio
→ nessun confronto senza ID

B. fallback esatto per nome
→ qualità degradata
→ reason esplicita
→ test dedicato
```

Queste alternative restano una decisione differita del checkpoint e non descrivono, da sole, il comportamento corrente.

---

## Esito B3

Esito registrato alla chiusura del checkpoint:

```txt
documenti owner verificati
→ duplicazioni classificate
→ discrepanze documentali registrate
→ problemi di codice separati
→ nessuna modifica a docs/ o al codice durante il checkpoint
```

La frase “nessuna modifica” riguarda esclusivamente l’esecuzione storica del B3.

La fase successiva allora indicata era:

```txt
B4 — Frontend e Python
```

---

## Navigazione

- [← Facade: Moduli, frontend e Python](../02-moduli-frontend-python.md)
- [Checkpoint B4 — Frontend e Python →](02-frontend-python-b4.md)
