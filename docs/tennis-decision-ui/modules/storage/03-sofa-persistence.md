# Persistenza SofaScore

## Scopo

Definire preparation, materialità e promozione dello stato committed del writer SofaScore.

## Stato

Il writer SofaScore prepara history e timeline sotto lo stesso `commitId` e le consegna al workflow journalizzato.

## Responsabilità

Questo owner decide separatamente la materialità di history e timeline, costruisce i due documenti candidati e promuove lo stato SofaScore condiviso soltanto dopo commit completo. Discovery, letture comuni e formato degli artefatti appartengono alla facade Storage; recovery e marker appartengono al commit journal.

## Flusso di persistenza

```text
sample autorizzato dal tracking
→ lettura fail-closed di history e timeline
→ decisione di materialità per artefatto
→ costruzione dei candidati con lo stesso commitId
→ pending journal
→ write e verifica history/timeline richieste
→ commit complete
→ promozione latestSofaState committed
```

Qualunque failure prima di `complete` impedisce la promozione dello stato cross-source.

## Materialità separata

La history confronta score, serving, statistiche, status, surface e projection Betfair committed. La timeline confronta snapshot canonico completo e `localContext`.

`history` invariata e timeline invariata produce `unchanged`; una history cambiata produce row e tick; snapshot o `localContext` cambiati con history invariata producono soltanto un nuovo tick nello stesso commit journalizzato.

Un miglioramento point-by-point o `localContext.dataQuality` non viene perso perché il punteggio è invariato. Poll integralmente identici non generano tick.

```text
historyChanged = false
timelineChanged = false
→ unchanged

historyChanged = true
timelineChanged = true
→ history + timeline nello stesso commit

historyChanged = false
timelineChanged = true
→ sola timeline, sempre tramite journal
```

### History

La history aggregata registra soltanto variazioni materiali del proprio contratto. Non vengono create righe artificiali per conservare un cambiamento esclusivo della timeline.

### Timeline

La timeline confronta il contenuto canonico del tick, inclusi snapshot, point-by-point e `localContext`. Una variazione esclusiva della timeline attraversa comunque il journal: non usa scritture dirette fuori dal commit logico.

## Lettura e commit

Solo `missing` crea un documento nuovo. Failure, shape invalida e target ambiguo bloccano ogni overwrite.

`latestSofaState` viene promosso soltanto dopo un risultato `complete`. Un sample fallito o partial non può essere incorporato da una futura row Betfair.

Il tick contiene `snapshot`, `localContext`, timestamp, sequenza, `eventId`, projection principali, diagnostica e `commitId`. `latest` resta una view derivata.

## Failure e retry

`missing` consente inizializzazione; `invalid_json`, `invalid_shape`, `read_failed`, `discovery_failed` e `ambiguous_storage_target` bloccano l'overwrite. Un retry riusa payload, metadata, target e `commitId` del journal invece di ricostruirli dal sample corrente.

Un commit partial resta osservabile tramite integrity. Il writer non rimuove autonomamente completed residual senza verifica semantica dei target.

## Confini

Il writer non avvia polling o browser, non costruisce payload HTTP e non calcola runtime health. Recovery e retry riusano payload e target del journal.

## Riferimenti implementativi

```text
backend/src/sofa/matchHistory/sofaUpdates/handler.js
backend/src/sofa/matchHistory/sofaUpdates/changeDetection.js
backend/src/sofa/matchHistory/sofaUpdates/historyDocument.js
backend/src/sofa/matchHistory/sofaUpdates/timelineDocument.js
backend/src/sofa/matchHistory/sofaUpdates/commitResult.js
```

### Matrice di materialità

| History         | Timeline  | Risultato                                           |
| --------------- | --------- | --------------------------------------------------- |
| invariata       | invariata | `unchanged`, nessun commit                          |
| cambiata        | cambiata  | commit dei due artefatti                            |
| invariata       | cambiata  | commit timeline nello stesso workflow journalizzato |
| failure lettura | qualunque | nessun overwrite                                    |

### Projection cross-source

```text
latestBetfairState committed
→ può entrare nella nuova history SofaScore

Betfair observed/prepared/partial
→ non può entrare nella history SofaScore
```

## Verifica

Eseguire dalla cartella `backend/src`:

```powershell
node sofa/matchHistory/sofaUpdates/changeDetection.test.mjs
node sofa/matchHistory/sofaUpdates/commitLifecycle.test.mjs
node sofa/matchHistory/sofaUpdates/recoveryAndRetry.test.mjs
node sofa/matchHistory/sofaUpdates/writerContract.test.mjs
```

## Documenti collegati

- [Timeline e history](./01-timelines-and-history.md)
- [Commit journal e recovery](./02-commit-journal-and-recovery.md)
- [Tracking live](../sofa/01-live-tracking.md)
- [Contesto locale e point-by-point](../sofa/02-local-context-and-point-by-point.md)
- [Source Identity](../evidence/02-source-identity.md)
- [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
