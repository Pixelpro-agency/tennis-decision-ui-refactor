# API Match — analisi e snapshot

## Endpoint

```txt
POST /api/match/analyze
POST /api/match/snapshot
```

`POST /api/match/snapshot` esegue un redirect HTTP `307` verso `/api/match/analyze`.

La route `snapshot` non costruisce una risposta autonoma: il contratto di analisi, inclusi payload, risposta ed errori, resta quello di `/api/match/analyze`.

## Analyze

### Payload

```json
{
  "url": "<sofascore-match-url>"
}
```

`url` viene accettata soltanto se è una stringa; prima dell'uso viene applicato `trim()`.

Una stringa assente, non stringa o composta soltanto da spazi viene trattata come URL mancante.

### Flusso

```txt
payload.url
→ trim
→ extractEventId(url)
→ buildSofaAnalysis(eventId)
    → loadSofaPayload(eventId)
    → normalizeSnapshot(...)
    → buildLocalContext(snapshot)
→ { snapshot, localContext }
```

`buildSofaAnalysis` usa i dati SofaScore dell'evento, delle statistiche e del point-by-point per costruire lo snapshot normalizzato e il contesto locale derivato.

Il percorso `/analyze` è compute-only rispetto alla persistenza canonica:

- non scrive history;
- non scrive timeline;
- non scrive journal;
- non invoca `addSofaUpdate`;
- non consulta né modifica il Source Identity Gate;
- non chiama il lifecycle `trackMatch` e non crea una tracking session Match.

Questo non implica assenza di attività runtime: l'acquisizione SofaScore delegata a `loadSofaPayload(...)` usa `batchFetch(...)`, che può avviare un processo Python registrato nel runtime con ruolo `SOFA_TRACKING` e produrre logging diagnostico. Questi effetti runtime non costituiscono persistenza canonica dell'analisi.

La risposta positiva contiene esclusivamente:

```json
{
  "snapshot": {},
  "localContext": {}
}
```

## Snapshot restituito

`snapshot` è prodotto da `normalizeSnapshot(...)`.

Campi top-level:

| Campo          | Contenuto                                                                              |
| -------------- | -------------------------------------------------------------------------------------- |
| `eventId`      | Event ID SofaScore dell'evento normalizzato                                            |
| `fetchedAt`    | Timestamp `Date.now()` della normalizzazione                                           |
| `players`      | Giocatori `home` e `away`, con `name` e, quando il servizio è determinato, `isServing` |
| `status`       | `type` e `description` dello stato evento                                              |
| `surface`      | Superficie dell'evento; fallback corrente `Hard`                                       |
| `score`        | Set, totale set, game del set corrente e punteggio del game                            |
| `serving`      | `home`, `away` oppure `null`                                                           |
| `stats`        | Statistiche match e, quando presenti, statistiche per set                              |
| `pointByPoint` | Point-by-point normalizzato                                                            |

### `score`

La shape corrente è:

```txt
score
├── sets[]
│   ├── home
│   └── away
├── totalSetsHome
├── totalSetsAway
├── games
│   ├── home
│   └── away
└── point
```

`sets` include i periodi disponibili da `period1` a `period5`.

`games` rappresenta il punteggio in game del set corrente ricavato dall'ultimo periodo disponibile.

`point` è una stringa nel formato:

```txt
<homePoint>-<awayPoint>
```

con fallback `0-0`.

### `stats`

`stats.match` contiene le statistiche del periodo `ALL`.

Le statistiche dei singoli set vengono esposte, quando presenti, come:

```txt
set1
set2
set3
set4
set5
```

Ogni elemento normalizzato può contenere:

```txt
period
key
label
home
away
homeValue
awayValue
homeTotal
awayTotal
group
```

### `pointByPoint`

Quando il point-by-point è valido e disponibile, la struttura normalizzata espone:

```txt
available: true
reason: null
semantics
sets
currentGame
```

La semantica corrente è:

```txt
source: home-away-point-transitions
representation: after-point
```

Quando il point-by-point non è disponibile o non è normalizzabile:

```json
{
  "available": false,
  "reason": "point_by_point_unavailable",
  "semantics": null,
  "sets": []
}
```

Il dettaglio della normalizzazione point-by-point appartiene al relativo owner SofaScore.

## `localContext`

`localContext` è calcolato da `buildLocalContext(snapshot)` e viene restituito come parte del contratto di risposta dell'analisi.

Shape top-level:

```txt
version
source
purpose
available
match
recent
comparison
dataQuality
```

Valori identificativi correnti:

```txt
version: 1
source: project-calculated
purpose: descriptive-match-context
```

Struttura pubblica principale:

```txt
localContext
├── match
│   └── pointShare
├── recent
│   ├── available
│   ├── reason
│   ├── window
│   └── pointShare
├── comparison
│   ├── available
│   ├── reason
│   ├── homeDeltaPctPoints
│   ├── awayDeltaPctPoints
│   └── observedShift
└── dataQuality
    ├── level
    ├── freshness
    ├── provenance
    ├── temporalAlignment
    ├── sources
    └── reasons
```

`dataQuality.level` usa i valori correnti:

```txt
derivation_complete
derivation_partial
derivation_insufficient
```

Le regole di derivazione di point share, finestra recente, comparison, availability, reason e data quality non appartengono al contratto interno del router Match: sono possedute da [Contesto locale e point-by-point](../../modules/sofa/02-local-context-and-point-by-point.md).

## Errori correnti

| Caso                                               | HTTP  | `code`                 | Messaggio pubblico                     |
| -------------------------------------------------- | ----: | ---------------------- | -------------------------------------- |
| URL assente o vuota                                | `400` | non presente           | `URL mancante`                         |
| Event ID non ricavabile                            | `400` | non presente           | `URL non valido o eventId non trovato` |
| Messaggio di errore contenente `404` o `not found` | `404` | `sofa_event_not_found` | `Evento SofaScore non trovato.`        |
| Messaggio di errore contenente `403` o `blocked`   | `503` | `sofa_access_blocked`  | `SofaScore non disponibile.`           |
| Altro errore dell'analisi                          | `500` | `analysis_failed`      | `Analisi SofaScore non riuscita.`      |

La classificazione degli errori dell'analisi:

1. converte il messaggio tecnico in lowercase;
2. verifica prima `404` / `not found`;
3. verifica poi `403` / `blocked`;
4. usa `analysis_failed` per gli altri errori.

Il body HTTP non restituisce il messaggio raw dell'eccezione.

Nel router Express, il logging dell'errore usa `runtimeErrorCode(...)` e il runtime logger redige i campi ammessi; il messaggio tecnico non viene copiato nel payload pubblico.

## Confini

Il router Match registra le due route e delega la costruzione dell'analisi ai moduli SofaScore.

Questo documento non possiede:

- parsing e acquisizione interna dei payload SofaScore;
- algoritmo di normalizzazione point-by-point;
- dettagli interni del calcolo di `localContext` oltre alla shape restituita;
- persistenza history, timeline o journal;
- API read/integrity;
- tracking live;
- Source Identity;
- recovery della persistenza.

`/analyze` e `/snapshot` non restituiscono `409 persistence_integrity`, perché non sono superfici di lettura della persistenza canonica.

## Verifica pertinente

Dalla cartella `backend/src`:

```txt
node --check routes/match.js
node --check routes/match/analysisResponse.js

node routes/match/analysisResponse.test.mjs
node sofa/normalizeSnapshot.test.mjs
```

Le verifiche direttamente pertinenti coprono:

```txt
/analyze
→ validazione URL
→ risposta { snapshot, localContext }
→ nessuna scrittura canonical history
→ nessuna dipendenza da addSofaUpdate
→ mapping pubblico degli errori senza messaggio raw

snapshot
→ chiavi top-level normalizzate
→ score, stats, serving e pointByPoint
```

I test delle regole interne di point-by-point e `localContext` appartengono al relativo owner SofaScore.

## Documenti collegati

- [API Match](../01-match.md)
- [Contesto locale e point-by-point](../../modules/sofa/02-local-context-and-point-by-point.md)
- [Timeline e history](../../modules/storage/01-timelines-and-history.md)
