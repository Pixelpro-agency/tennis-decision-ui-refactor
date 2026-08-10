# Report documentale — `docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-030
Sequenza audit: 30/72
Documento analizzato: 01-timelines-and-history.md
Percorso documento: docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md
Percorso report: Report documentale/30 - 01-timelines-and-history.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: a9bd897a72716a81fa9d746b16679f71a56e8031
Dimensione documento: 687 righe
Ruolo dichiarato: owner della persistenza canonica timeline/history
Stato report: applicato e verificato
```

Il documento è stato confrontato con:

- `backend/src/sofa/timelineStore.js`;
- `backend/src/sofa/matchHistory.js`;
- `backend/src/sofa/matchHistory/storage.js`;
- `backend/src/sofa/matchHistory/betfairUpdates.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/handler.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/changeDetection.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/historyDocument.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/timelineDocument.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/commitResult.js`;
- `backend/src/sofa/betfair/processor/persistence.js`;
- `backend/src/sofa/betfair/processor/persistenceDecision.js`;
- `backend/src/sofa/betfair/processor/persistenceDocuments.js`;
- `backend/src/sofa/betfair/processor/persistenceCommitWorkflow.js`;
- `backend/src/sofa/betfair/processor/canonicalTimeline.js`;
- `backend/src/sofa/betfair/timeline/state.js`;
- `backend/src/sofa/betfairFetch.js`;
- `backend/src/sofa/betfairHealth.js`;
- `backend/src/routes/match/readResponses.js`;
- `backend/src/routes/betfair/latestPayload.js`;
- `backend/src/runtime/matchHistoryWriterAuthority.js`;
- `backend/src/server.js`;
- `backend/src/sofa/matchHistory/sofaUpdates/changeDetection.test.mjs`;
- `backend/src/sofa/matchHistory/sofaUpdates/writerContract.test.mjs`;
- `backend/src/sofa/matchHistory/betfairUpdates.test.mjs`;
- `backend/src/sofa/betfair/processor/canonicalTimeline.test.mjs`;
- i finding già registrati nei report precedenti, soprattutto `MATCH-API-*`, `BETFAIR-API-*`, `EVIDENCE-API-*`, `DATA-LIFE-*`, `TECH-SAMPLE-*`, `SOURCE-ID-*`, `SOFA-LIVE-*` e `LOCAL-PBP-*`.

La mappa Markdown di continuazione e il JSON incrementale di continuazione non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA

writer authority di processo: implementata
history write atomica per file: implementata
timeline write atomica per file: implementata
journalized Sofa commit: implementato
journalized Betfair commit: implementato
writer result con target/commitId validation: implementato
Betfair canonical timeline filtering: implementato
status-only Graph path: implementato
marketState commit dopo commit canonico: implementato
history read result found/missing/failed: parzialmente implementato
Source Identity come precondizione esterna allo storage: descrizione corretta come boundary

Timeline read result strutturato: assente
Timeline invalid JSON/read/discovery failure: collassati a null
Timeline shape non-array: normalizzata silenziosamente a []
Writer Sofa/Betfair: possono ricreare e sovrascrivere timeline parse-failed/shape-invalid
Legacy cleanup Betfair: read failure può diventare unchanged success
History invalid shape: non distinta da documento valido
Canonical file discovery: più candidati → primo lexicografico
latestSofaState: aggiornato prima del commit canonico
latestBetfairState: aggiornato durante prepare, prima del commit
status-only Betfair: aggiorna latestBetfairState con sample regressivo
Future Sofa history row: può quindi riadottare stato Betfair non canonico
Sofa dedup history: è anche gate timeline
pointByPoint/localContext-only change: non forza tick Sofa
Betfair history comparable representation: non usa selectionId
Missing Money Flow: normalizzato a zero nel comparable
Missing market total: può diventare zero sintetico/mojibake
addBetfairUpdate: non è più un writer, è compatibility prepare facade
loadHistoryResult: export reale ma assente dalla lista API del documento
saveHistory: firma documentata incompleta rispetto a commitId
timeline latest: derivato in lettura, non persistito dal writer canonico
saveTimeline duplicate: metadata merge non viene scritto
timelineStore.test.mjs: path dichiarato ma assente al commit

Modifiche nuove proposte: 9
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: SÌ
Nuovi documenti canonici proposti: 2
Priorità complessiva: CRITICA
```

Il design di commit journalizzato è sostanzialmente solido e non viene rimesso in discussione in questo report.

Il problema più importante si trova prima del journal:

```text
discovery/read/shape
→ documento canonico assunto valido
→ costruzione del nuovo documento
```

e nello stato condiviso usato per costruire la history:

```text
sample osservato/preparato
→ latest*State
→ futura history dell'altra sorgente
```

Questi due boundary possono introdurre perdita o contaminazione di dati prima che le garanzie del commit journal diventino operative.

---

# 1. Timeline read failure e invalid shape possono essere trattati come timeline vuota

## Esito: gap critico

`loadTimeline(source, eventId)` usa:

```text
getTimelineFile(...)
→ exists
→ JSON.parse
```

ma restituisce:

```text
null
```

sia quando:

- il file non esiste;
- la discovery fallisce;
- la lettura fallisce;
- il JSON è invalido.

Inoltre:

```js
if (!Array.isArray(data.timeline)) {
    data.timeline = [];
}
```

quindi un documento parseabile ma con shape invalida diventa in memoria:

```text
timeline: []
```

anziché produrre una failure.

## Effetto sul writer Sofa

`createSofaUpdateHandler()` usa:

```text
existingTimeline = loadTimeline('sofa', eventId)
```

e passa il risultato a `prepareTimelineDocument()`.

Quando riceve `null`:

```text
crea un nuovo documento timeline
```

Il target viene poi risolto nuovamente tramite `getTimelineFile()`.

Se il file esistente era presente ma JSON-corrotto:

```text
loadTimeline → null
getTimelineFile → stesso file esistente
nuovo journal
→ writeTimelineDocument
→ overwrite del file corrotto con una nuova timeline
```

La cronologia precedente viene quindi persa anziché essere bloccata per recovery/manual inspection.

## Effetto sul writer Betfair

`evaluateBetfairPersistenceDecision()`:

```text
loadTimeline('betfair', eventId)
→ toCanonicalTimelineView(...)
```

Con `null`:

```text
{ metadata:{}, timeline:[] }
```

e il nuovo commit può ricostruire una timeline da zero.

## Invalid shape

Il rischio è ancora più invisibile con:

```json
{
  "metadata": {},
  "timeline": {}
}
```

perché il JSON è valido.

`loadTimeline()` lo converte a:

```json
{
  "metadata": {},
  "timeline": []
}
```

senza error status.

## Legacy cleanup

`cleanupLegacyBetfairTimeline()` usa ancora `loadTimeline()`.

Se il read fallisce:

```text
!timelineObj
→ { ok:true, status:'unchanged' }
```

quindi un errore di lettura può diventare un falso cleanup success.

## History

`loadHistoryResult()` è migliore perché distingue:

```text
found
missing
failed
```

e riconosce `invalid_json`.

Non valida però la shape.

Un JSON parseabile con:

```text
history non-array
metadata invalida
```

può essere normalizzato dai builder a un nuovo documento e successivamente riscritto.

## Finding `STORAGE-TH-001` — introdurre canonical document read results fail-closed

**Priorità:** critical  
**Tipo:** canonical read/write safety

### Target

Introdurre un contratto strutturato almeno per:

```text
timeline_read
history_read
```

che distingua:

```text
found
missing
discovery_failed
read_failed
invalid_json
invalid_shape
```

### Timeline

Non normalizzare:

```text
timeline non-array
→ []
```

nel boundary di lettura canonico.

La compatibilità legacy deve essere una migration/cleanup esplicita, non una normalizzazione distruttiva invisibile.

### History

Validare almeno:

```text
document object
metadata object
history array
```

prima che un writer possa considerare il file base valido.

### Writer rule

```text
missing
→ può inizializzare un nuovo documento

failed / invalid_json / invalid_shape
→ zero overwrite canonico
→ failure strutturata
```

### Consumer da coordinare

Almeno:

```text
Sofa writer
Betfair writer
legacy cleanup
API read
Evidence read
Betfair restore
recovery
```

Coordinare con le task read-result già aperte:

```text
MATCH-API-005
BETFAIR-API-004
EVIDENCE-API-004
```

senza creare una seconda tassonomia incompatibile.

---

# 2. Discovery history/timeline sceglie silenziosamente il primo file quando esistono più candidati

## Esito: canonical identity ambigua

`findTimelineFile()`:

```text
readdir
→ filter source + _eventId.json
→ sort()
→ [0]
```

`discoverHistoryFile()` applica la stessa filosofia:

```text
filter _eventId.json
→ sort()
→ [0]
```

## Problema

Per lo stesso:

```text
source + eventId
```

oppure:

```text
history + eventId
```

possono esistere accidentalmente due file:

```text
2026-07-01_Tournament_A_vs_B_123.json
2026-07-02_Tournament_A_vs_B_123.json
```

La storage authority non segnala:

```text
ambiguous canonical target
```

ma sceglie il primo lessicografico.

## Conseguenze

Il processo può:

- leggere un file e lasciare l'altro ignorato;
- continuare a scrivere sul target scelto;
- produrre una vista diversa da quella attesa dall'operatore;
- entrare in conflitto con target journalizzati;
- nascondere una duplicazione generata da migrazione, copia manuale o bug precedente.

## Finding `STORAGE-TH-002` — rendere univoca la canonical file discovery

**Priorità:** high  
**Tipo:** storage identity

### Target

La discovery deve restituire:

```text
0 candidati → missing
1 candidato → found
>1 candidati → ambiguous_storage_target
```

Non:

```text
>1 → sort()[0]
```

### Recovery

Non scegliere automaticamente quale file eliminare o rinominare.

Un'ambiguità deve essere osservabile e richiedere una procedura esplicita.

### Coordinamento

Usare il validator `eventId` condiviso già richiesto da task precedenti; non introdurre un secondo validator locale.

---

# 3. `latestSofaState` e `latestBetfairState` sono “latest prepared/observed”, non “latest committed”

## Esito: gap critico di cross-source consistency

`matchHistory.js` crea:

```text
latestSofaState
latestBetfairState
```

condivise fra i due handler.

Il documento le descrive genericamente come:

```text
stato condiviso più recente
```

ma la distinction operativa è fondamentale.

## Sofa

`createSofaUpdateHandler()` esegue:

```js
latestSofaState.set(eventId, sofaData);
```

all'inizio dell'update.

Questo avviene prima di:

- validazione journal dependencies;
- history read;
- dedup;
- journal create;
- history write;
- timeline write;
- commit complete.

Un sample Sofa può quindi diventare `latestSofaState` anche quando il suo commit canonico fallisce.

## Betfair

`prepareBetfairHistory()` esegue:

```js
latestBetfairState.set(eventId, ...)
```

durante la preparazione.

Questo avviene prima di:

- create pending journal;
- history write;
- timeline write;
- commit completion.

Il test `betfairUpdates.test.mjs` considera esplicitamente normale che la sola preparation aggiorni la mappa in memoria.

## Perché è pericoloso

Le mappe non sono soltanto diagnostiche.

Sono usate dall'altra sorgente per costruire la history aggregata.

### Leak Betfair → Sofa

```text
Betfair sample B2
→ prepare aggiorna latestBetfairState=B2
→ commit Betfair fallisce
→ B2 non è canonico

poi Sofa S2
→ appendHistoryRow usa latestBetfairState
→ history Sofa può incorporare B2
```

La history aggregata può quindi contenere una proiezione Betfair che non esiste nella timeline Betfair canonica.

### Leak Sofa → Betfair

Simmetricamente:

```text
Sofa S2
→ latestSofaState=S2
→ commit Sofa fallisce

poi Betfair B2 commit completo
→ prepareBetfairHistory usa latestSofaState
→ history Betfair può incorporare S2
```

## Caso status-only ancora più netto

Nel percorso Graph logout:

```text
append:false
```

impedisce la nuova riga history Betfair.

Ma `prepareBetfairHistory()` aggiorna comunque:

```text
latestBetfairState
```

con il sample regressivo.

Il documento dichiara correttamente che lo status-only:

```text
non adotta il sample regressivo nella history
baseline marketState invariato
```

ma una successiva riga Sofa può riutilizzare proprio quello stato Betfair in memoria.

## Finding `STORAGE-TH-003` — separare observed/prepared state da committed canonical state

**Priorità:** critical  
**Tipo:** cross-source commit consistency

### Target

Le projection usate per costruire history canonica devono provenire soltanto da:

```text
commit complete
oppure
recovered
```

### Possibile struttura

Distinguere semanticamente:

```text
latestObservedSofa
latestCommittedSofa

latestObservedBetfair
latestCommittedBetfair
```

oppure aggiornare le mappe correnti soltanto dopo commit canonico.

### Status-only

Il sample regressivo status-only non deve sostituire la projection Betfair committed usata dalla future history Sofa.

### Failure

Un commit fallito o partial non deve modificare lo stato cross-source che un writer successivo può incorporare.

### Test

Coprire:

```text
Sofa failed → Betfair later complete
Betfair failed → Sofa later complete
status-only regressivo → Sofa later complete
recovery complete → committed state aggiornato
```

---

# 4. La deduplica history Sofa è anche il gate timeline e può perdere cambiamenti canonici di pointByPoint/localContext

## Esito: coupling fra due artefatti con semantiche diverse

Il documento dichiara esplicitamente:

```text
La deduplicazione della history
è anche il gate effettivo della timeline SofaScore.
```

e:

```text
Un localContext nuovo, da solo, non forza un nuovo tick.
```

Questo descrive correttamente il codice.

## Dedup corrente

`shouldSkipSofaHistoryRow()` confronta:

```text
score
serving
stats
status
surface
Betfair comparable history state
```

Non confronta:

```text
snapshot.pointByPoint
localContext
localContext.version
localContext.dataQuality
```

## Scenario concreto

Sample A:

```text
score invariato
stats invariati
PBP temporaneamente unavailable
localContext.recent unavailable
```

Sample B pochi secondi dopo:

```text
stesso score
stesse stats
PBP ora disponibile
localContext.recent complete
```

La dedup può classificare B come:

```text
unchanged
```

quindi:

```text
history: nessuna nuova riga
timeline Sofa: nessun nuovo tick
```

La timeline canonica non registra il miglioramento della qualità/context.

## Perché history e timeline non hanno la stessa materialità

La history aggregata non salva `localContext`.

La timeline sì.

Quindi:

```text
cambiamento non rilevante per history
```

non implica necessariamente:

```text
cambiamento non rilevante per timeline
```

## Finding `STORAGE-TH-004` — separare materialità history e materialità timeline Sofa

**Priorità:** high  
**Tipo:** canonical change detection

### Target

Definire due decisioni:

```text
history row changed?
timeline tick changed?
```

senza creare righe history artificiali.

### Timeline materiality

Includere almeno le parti canoniche del tick che possono cambiare indipendentemente dalla history, in particolare:

```text
pointByPoint
localContext
version/dataQuality se parte del contratto
```

secondo le decisioni dell'owner `LOCAL-PBP-*`.

### Journal

Mantenere il commit logico coerente anche quando:

```text
history unchanged
timeline changed
```

senza aggirare il journal con write dirette.

### Non fare

Non trasformare ogni poll identico in un nuovo tick.

Serve una deduplica timeline-specifica deterministica.

---

# 5. La representation Betfair usata dalla history dedup non rispetta pienamente l'identity canonica e confonde missing con zero

## Esito: gap alto

Il documento afferma correttamente che per il tick Betfair:

```text
selectionId
→ unica identity runner
```

La history row Betfair salva `selectionId`.

La representation usata per deduplica non lo usa in modo coerente.

## Sofa-side comparable state

`normalizeBetfairForHistory()` riduce ogni runner a:

```text
name
wom
moneyFlow.back
moneyFlow.lay
```

senza `selectionId`.

Valori Money Flow mancanti vengono convertiti con:

```text
Number(value)
→ se non finito → 0
```

## Market total mancante

`getPersistedBetfairTotalMatched()` ritorna:

```text
'0 €'
```

quando il valore non è numero/stringa valida.

Quindi:

```text
missing
```

diventa una rappresentazione zero-like e contiene anche mojibake.

## Betfair-side representation

`buildBetfairRepresentation()` usa ancora:

```text
name
moneyFlow back/lay
wom
```

senza `selectionId`.

La riga usa:

```js
betfairData?.market_info?.total_matched || '0 €'
```

quindi il valore mancante e alcuni falsy values confluiscono nello stesso fallback.

## Conseguenze

Possibili:

```text
stesso nome + selectionId diverso
→ identity change non rappresentata nella dedup

moneyFlow missing
→ 0

market total missing
→ zero-like fallback
```

La dedup della history può quindi classificare erroneamente due stati come equivalenti oppure materialmente diversi per motivi di rappresentazione.

## Finding `STORAGE-TH-005` — rendere la history projection identity-safe e missing-preserving

**Priorità:** high  
**Tipo:** history canonical representation

### Runner

La representation di dedup deve usare:

```text
selectionId normalizzato
```

come identity quando presente, coerentemente con il resto del Betfair pipeline.

### Missing

Mantenere distinti:

```text
missing
zero reale
```

per:

- market total;
- runner matched;
- Money Flow;
- campi numerici persistibili.

### Ordinamento

La comparazione non deve dipendere accidentalmente dall'ordine dell'array se l'identity è `selectionId`.

### Coordinamento

Questa task deve coordinarsi con:

```text
TECH-SAMPLE-002
TECH-SAMPLE-003
DATA-001
```

e non reintrodurre fallback numerici rimossi a monte.

---

# 6. `latest` è una view derivata, mentre `saveTimeline()` non lo aggiorna né lo persiste

## Esito: contratto documentale impreciso e metadata-only update non persistito

Il documento presenta la struttura logica:

```text
metadata
timeline
updatedAt
latest
```

come output del modulo.

Questo è corretto per:

```text
loadTimeline()
```

perché il loader ritorna:

```js
latest: data.timeline[data.timeline.length - 1] || null
```

## Documento persistito

I writer canonici Sofa e Betfair eliminano:

```text
latest
```

prima di scrivere.

Quindi `latest` è una view derivata, non una source-of-truth persistita.

## Frase falsa

Il documento dice che `saveTimeline()`:

```text
aggiunge il nuovo tick
...
e aggiorna latest
```

Il codice non assegna `timelineObj.latest`.

Scrive:

```text
metadata
updatedAt
timeline
```

e `latest` viene aggiunto al caricamento successivo.

## Duplicate path

`saveTimeline()` inoltre:

1. mergea metadata in memoria;
2. imposta `updatedAt`;
3. verifica se `lastEntry.data === entryData`;
4. se duplicato ritorna `unchanged`;
5. non scrive il documento.

Quindi:

```text
metadata nuova
+
entryData identica
→ metadata non persistita
```

## Finding `STORAGE-TH-006` — chiarire derived `latest` e decidere metadata-only update semantics

**Priorità:** medium  
**Tipo:** timeline document contract

### `latest`

Documentare:

```text
persisted document
→ metadata + timeline + updatedAt

loaded/API view
→ aggiunge latest derivato
```

### Legacy

I writer canonici devono continuare a rimuovere un eventuale `latest` persistito legacy per evitare stale derived state.

### Metadata

Decidere esplicitamente:

```text
duplicate tick + metadata changed
```

se deve essere:

```text
unchanged senza write
```

oppure:

```text
metadata-only write
```

e coprire la scelta con test.

---

# 7. La lista “API pubblica” della history non corrisponde agli export e attribuisce ad `addBetfairUpdate()` un ruolo ormai legacy

## Esito: contratto facade da aggiornare

Il documento elenca:

```text
getHistoryFile
loadHistory
saveHistory
addSofaUpdate
addBetfairUpdate
```

## Export reale

`matchHistory.js` espone anche:

```text
loadHistoryResult
```

che è proprio l'API necessaria per distinguere:

```text
found
missing
failed
```

La frase documentale sulla lettura strutturata non può quindi essere compresa correttamente senza citarla.

## `saveHistory`

La firma reale è:

```text
saveHistory(eventId, historyData, metadata, commitId)
```

Il documento omette `commitId`.

## `addBetfairUpdate`

Il codice contiene esplicitamente:

```text
Compatibility façade:
it now prepares a document only.
The processor owns the sole journalized canonical write.
```

`addBetfairUpdate()` chiama infatti:

```text
prepareBetfairHistory(...)
```

e non scrive direttamente il file.

Quindi presentarlo nella stessa lista degli update writer senza qualifica è fuorviante.

## Finding `STORAGE-TH-007` — riallineare la facade API al codice corrente

**Priorità:** medium  
**Tipo:** documentation/API ownership

### Documento

Distinguere:

```text
read API
write primitive
Sofa canonical writer
Betfair preparation compatibility facade
Betfair canonical commit facade
recovery/integrity API
```

### Correzioni minime

Aggiungere:

```text
loadHistoryResult
```

Correggere:

```text
saveHistory(..., commitId)
```

Classificare:

```text
addBetfairUpdate
→ compatibility prepare-only
```

e indicare come canonical Betfair writer:

```text
persistBetfairProcessedResult
/
persistBetfairTrackingSample
```

secondo l'owner appropriato.

---

# 8. La verification matrix non copre i boundary che possono causare perdita/contaminazione

## Esito: coverage incompleta

Il documento dichiara:

```text
node sofa/timelineStore.test.mjs
```

ma l'esatto file non risulta presente al commit auditato.

Sono invece presenti varie suite modulari per:

- Sofa change detection;
- Sofa commit lifecycle/writer contract;
- Betfair history preparation;
- Betfair canonical timeline;
- journal/recovery.

## Gap principali

Non risultano test owner dedicati per:

```text
timeline invalid JSON → writer blocked
timeline invalid shape → writer blocked
history invalid shape → writer blocked
multiple canonical candidate files → ambiguous failure
legacy cleanup read failure → non unchanged
Sofa failed commit → no leak in later Betfair history
Betfair failed commit → no leak in later Sofa history
status-only regressivo → no leak in future Sofa history
PBP unavailable→available a score invariato → timeline material change
selectionId change in history dedup
missing Money Flow ≠ zero
metadata-only duplicate behavior
loaded latest ≠ persisted latest
```

## Test esistente significativo

`betfairUpdates.test.mjs` verifica oggi:

```text
preparation-updates-only-in-memory-betfair-state
```

Questa coverage prova il comportamento corrente, ma non dimostra che lo stato venga poi rollbackato o promosso solo dopo commit.

È quindi un test da cambiare/integrare insieme a `STORAGE-TH-003`, non una garanzia di consistency.

## Finding `STORAGE-TH-008` — ricostruire la verification matrix storage

**Priorità:** high  
**Tipo:** verification contract

### Target

Aggiungere test filesystem e integration per `STORAGE-TH-001..007`.

### Path documentali

Rimuovere i test path assenti o sostituirli con le suite reali.

### Fail-closed

Le suite devono verificare esplicitamente:

```text
canonical input corrotto
→ nessun overwrite
```

non soltanto:

```text
writer result non-ok
```

---

# 9. Modularizzazione

## Valutazione

```text
Righe: 687
Responsabilità reali: almeno 3
```

Il file non è soltanto lungo.

Combina tre owner di codice distinti.

### Owner A — storage core

```text
timelineStore.js
matchHistory/storage.js
file discovery
read/write contract
atomic per-file write
canonical document shape
writer authority precondition
```

### Owner B — Sofa persistence

```text
matchHistory/sofaUpdates/
Sofa history projection
Sofa timeline tick
Sofa dedup
localContext
cross-source shared state
```

### Owner C — Betfair persistence

```text
betfair/processor/persistence*
betfair/timeline/
Betfair history preparation
runner identity
status-only
marketState commit
legacy cleanup
```

Il quarto tema:

```text
commit journal/recovery
```

possiede già il file dedicato:

```text
02-commit-journal-and-recovery.md
```

e non deve essere duplicato.

## Struttura proposta

Mantenere:

```text
01-timelines-and-history.md
```

come facade/core storage owner, riducendolo a:

- artefatti canonici;
- differenza timeline/history;
- file identity;
- read/write result;
- atomic write;
- writer authority precondition;
- Source Identity come precondizione esterna;
- ownership map;
- link agli owner specifici.

Mantenere:

```text
02-commit-journal-and-recovery.md
```

come owner journal/recovery.

Creare:

```text
docs/tennis-decision-ui/modules/storage/03-sofa-persistence.md
```

per:

- `sofaUpdates/`;
- history/timeline materiality;
- dedup;
- localContext;
- shared committed state;
- Source Identity outcome integration lato persistence.

Creare:

```text
docs/tennis-decision-ui/modules/storage/04-betfair-persistence.md
```

per:

- `processor/persistence*`;
- Betfair history projection;
- status-only;
- runner identity/restore;
- marketState commit;
- legacy cleanup;
- shared committed state lato Betfair.

## Perché lo split è giustificato

Non viene proposto perché 687 righe sono “troppe”.

Viene proposto perché:

```text
storage primitive
Sofa writer
Betfair writer
```

hanno:

- owner di codice diversi;
- invarianti diversi;
- test diversi;
- failure mode diversi;
- contesti minimi diversi.

## Finding `STORAGE-TH-009` — modularizzare core storage, Sofa persistence e Betfair persistence

**Priorità:** medium  
**Tipo:** documentation modularization

### Task operativa

- mantenere `01-timelines-and-history.md` come facade/core;
- mantenere `02-commit-journal-and-recovery.md` invariato come owner journal;
- creare `03-sofa-persistence.md`;
- creare `04-betfair-persistence.md`;
- rimuovere duplicazioni con `01-live-tracking.md`, `02-technical-sample-validity.md` e journal/recovery;
- aggiornare index, link, owner map e checker;
- non inserire i nuovi file nell'inventario canonico finché non esistono realmente.

## Decisione

```text
modularization_reviewed: true
split_required: true
split_recommended: true
proposed_files:
  - docs/tennis-decision-ui/modules/storage/03-sofa-persistence.md
  - docs/tennis-decision-ui/modules/storage/04-betfair-persistence.md
```

---

# Elementi corretti da preservare

## Writer authority

Il documento distingue correttamente:

```text
process-level writer authority
≠
check interno a ogni writer
```

Il backend acquisisce l'authority prima della recovery/runtime.

Le primitive storage dirette non devono fingere di possedere una protezione cross-process che non implementano.

## Atomic per-file write

History e timeline serializzano in memoria, scrivono `.tmp` nella stessa directory e fanno rename.

Il failure path prova a rimuovere il temporaneo.

Questa proprietà va preservata.

## Commit result validation

Sofa e Betfair verificano:

```text
ok
target
commitId
```

prima di marcare il documento completato nel journal.

I test writer contract coprono target e commitId errati e result undefined.

## Betfair marketState

La state authority del processor Betfair è più forte delle mappe history condivise:

```text
pending runner state
→ commit canonical complete/recovered
→ commitPendingBetfairRunnerState
```

Questo pattern è quello da riusare concettualmente per correggere `STORAGE-TH-003`.

## Canonical Betfair timeline

La view canonica esclude entry legacy/non conformi e `seq` non finiti prima della costruzione del nuovo documento.

Questa parte è coerente.

## `matchedTotal` vs `totalMatchedOnSelection`

La history Betfair salva correttamente i due valori separatamente quando disponibili.

La relativa suite verifica questa distinzione.

---

# Dipendenze già aperte da non duplicare

```text
MATCH-API-004
MATCH-API-005
BETFAIR-API-003
BETFAIR-API-004
EVIDENCE-API-004
EVID-SNAPSHOT-003
DATA-LIFE-002
DATA-LIFE-003
DATA-LIFE-005
TECH-SAMPLE-002
TECH-SAMPLE-003
SOURCE-ID-001
SOURCE-ID-002
SOFA-LIVE-001
SOFA-LIVE-005
LOCAL-PBP-005
```

In particolare:

- il `no-gate` fail-open resta task Source Identity/live;
- `/analyze` come writer fuori dal gate è già `LOCAL-PBP-005`;
- missing runner matched/selection identity sono già censiti a monte;
- read API HTTP devono coordinarsi con il nuovo read-result storage, non inventarne uno differente.

---

# Riferimenti per la mappa e il JSON incrementale di continuazione

```text
Report ID: TDUI-DOC-REPORT-030
Percorso report: Report documentale/30 - 01-timelines-and-history.md
Documento: docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md

Change ID: STORAGE-TH-001
Change ID: STORAGE-TH-002
Change ID: STORAGE-TH-003
Change ID: STORAGE-TH-004
Change ID: STORAGE-TH-005
Change ID: STORAGE-TH-006
Change ID: STORAGE-TH-007
Change ID: STORAGE-TH-008
Change ID: STORAGE-TH-009

Suddivisione richiesta: sì
Nuovi file canonici proposti: 2
```

Nel prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository-continuazione-023.md
→ registrare report 030
→ indice 30 ANALIZZATO
→ Divisione richiesta
→ aggiungere STORAGE-TH-001..009
→ STORAGE-TH-009 come task [ ] operativa
→ registrare i due proposed files senza aggiungerli all'inventario finché non creati

modifiche-audit-markdown-continuazione-023.json
→ appendere TDUI-DOC-REPORT-030
→ appendere STORAGE-TH-001..009
→ split_required:true
→ proposed_files:
   - docs/tennis-decision-ui/modules/storage/03-sofa-persistence.md
   - docs/tennis-decision-ui/modules/storage/04-betfair-persistence.md
```

I file di mappa/ledger non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `STORAGE-TH-001` — canonical document read results

**Priorità:** critical

- structured timeline read;
- history shape validation;
- missing distinto da read/parse/shape failure;
- zero overwrite su canonical document non leggibile;
- cleanup legacy fail-closed;
- API/Evidence consumano la stessa tassonomia.

## `STORAGE-TH-002` — canonical file discovery uniqueness

**Priorità:** high

- zero/uno/molti candidati;
- molti candidati → ambiguity;
- niente `sort()[0]`;
- nessuna cancellazione automatica del candidato extra;
- test filesystem.

## `STORAGE-TH-003` — committed cross-source shared state

**Priorità:** critical

- observed/prepared distinto da committed;
- failure/partial non promuove shared state;
- status-only non promuove regressivo;
- future history usa projection committed;
- recovery complete aggiorna state in modo coerente.

## `STORAGE-TH-004` — Sofa per-artifact materiality

**Priorità:** high

- history dedup distinta da timeline dedup;
- PBP/localContext material change persistibile;
- nessuna fake history row;
- journal invariants preservate;
- coordinare `LOCAL-PBP-*`.

## `STORAGE-TH-005` — Betfair history identity/missing semantics

**Priorità:** high

- selectionId nella comparable representation;
- missing ≠ zero;
- no mojibake fallback;
- order-independent runner comparison per ID;
- coordinare `TECH-SAMPLE-002/003`.

## `STORAGE-TH-006` — timeline derived latest / metadata

**Priorità:** medium

- `latest` read-derived;
- niente stale persisted latest;
- correggere frase `saveTimeline updates latest`;
- decidere metadata-only duplicate write;
- test contratto.

## `STORAGE-TH-007` — facade API ownership

**Priorità:** medium

- documentare `loadHistoryResult`;
- firma `saveHistory` con commitId;
- `addBetfairUpdate` prepare-only compatibility;
- indicare canonical Betfair commit owner reale.

## `STORAGE-TH-008` — verification matrix

**Priorità:** high

- correggere path test assenti;
- corrupt/invalid-shape overwrite tests;
- ambiguous discovery;
- cross-source uncommitted leakage;
- status-only leakage;
- localContext-only timeline change;
- history identity/missing;
- latest/metadata semantics.

## `STORAGE-TH-009` — modularizzazione

**Priorità:** medium

- `01-*` facade/core;
- `02-*` journal/recovery invariato;
- creare `03-sofa-persistence.md`;
- creare `04-betfair-persistence.md`;
- aggiornare link/index/owner map;
- niente duplicazione degli owner già esistenti.

---

# Ordine consigliato di applicazione

```text
1. STORAGE-TH-001
2. STORAGE-TH-003
3. STORAGE-TH-002
4. STORAGE-TH-004
5. STORAGE-TH-005
6. STORAGE-TH-006
7. STORAGE-TH-007
8. STORAGE-TH-008
9. STORAGE-TH-009
10. revisione finale dei tre owner storage
11. checker documentali
12. aggiornamento cumulativo mappa/ledger
```

`STORAGE-TH-001` viene prima perché nessun writer dovrebbe continuare a modificare un documento la cui lettura/shape non è stata stabilita in modo affidabile.

`STORAGE-TH-003` viene subito dopo perché una scrittura journalizzata correttamente non basta se la history successiva può incorporare uno stato dell'altra sorgente che non è mai stato committed.

---

# Verifica prevista dopo un'eventuale modifica

## Timeline read

```text
file assente
→ missing
```

```text
JSON invalido
→ invalid_json
→ zero overwrite
```

```text
timeline non-array
→ invalid_shape
→ zero overwrite
```

```text
read/discovery failure
→ failed
→ zero overwrite
```

## History read

```text
history non-array
→ invalid_shape
→ zero overwrite
```

non:

```text
history=[]
→ nuovo file sovrascritto
```

## Discovery

```text
nessun file
→ missing

un file
→ found

due file stesso eventId/source
→ ambiguous_storage_target
→ zero write
```

## Shared state

```text
Betfair prepare
→ commit failed
→ latest committed Betfair invariato
```

```text
status-only regressivo
→ canonical status tick
→ latest committed Betfair business projection invariata
```

```text
Sofa failed
→ successivo Betfair commit
→ non incorpora Sofa failed sample
```

## Sofa materiality

```text
score/stats uguali
PBP unavailable → available
localContext partial → complete
→ timeline material change
```

senza obbligare una nuova history row se la projection history è invariata.

## Betfair history representation

```text
same selectionId + same data
→ equivalent
```

```text
same name + different selectionId
→ non equivalent
```

```text
missing moneyFlow
≠
real 0
```

```text
missing market total
≠
real 0
```

## `latest`

Documento persistito:

```text
no persisted latest
```

View caricata:

```text
latest = final timeline entry
```

## Metadata duplicate

Testare esplicitamente la decisione approvata:

```text
same tick + metadata changed
→ metadata-only write
```

oppure:

```text
→ unchanged
```

ma il contratto deve essere intenzionale.

## Verification

Mantenere le suite reali di:

```text
Sofa commit
Betfair commit
journal/recovery
canonical timeline
history prepare
writer contracts
```

e aggiungere test filesystem per i nuovi boundary.

---

# Decisione finale

```text
01-timelines-and-history.md:
ARCHITETTURA DI COMMIT SOLIDA, MA INPUT CANONICO E SHARED STATE NON SONO ANCORA ABBASTANZA FAIL-CLOSED

writer authority: solida
atomic per-file write: solida
Sofa journal commit: solido
Betfair journal commit: solido
target/commitId verification: solida
canonical Betfair filtering: solido
marketState post-commit: solido

timeline missing/error/invalid: non distinti
timeline invalid shape: può diventare []
canonical timeline corrotta: può essere sovrascritta
history invalid shape: non bloccata
multiple file candidates: first lexicographic wins
latestSofaState: pre-commit
latestBetfairState: pre-commit
status-only: può contaminare latestBetfairState
cross-source history: può incorporare sample non committed
Sofa history dedup: blocca anche timeline
localContext/PBP-only change: può essere perso
history Betfair comparable: no selectionId
missing numeric state: zero-like fallback
latest: derived ma documentato come aggiornato dal save
metadata-only change: non persistita su duplicate
facade API docs: parzialmente stale
verification: manca sui boundary più pericolosi

Riscrittura completa: no
Modularizzazione: sì
Nuovi documenti canonici proposti: 2
Priorità complessiva: critica
```

Le due invarianti principali da introdurre sono:

```text
canonical file non leggibile o semanticamente invalido
→ nessun writer lo tratta come file mancante/vuoto
→ nessun overwrite
```

e:

```text
stato di una sorgente usato dentro la history dell'altra
→ deve essere stato canonicalmente committed
→ non soltanto osservato o preparato
```

La terza conseguenza è:

```text
history materiality
≠
timeline materiality
```

perché la timeline Sofa conserva dati (`pointByPoint`, `localContext`) che la history aggregata intenzionalmente non conserva.

---

# Applicazione 2026-08-10

Le task STORAGE-TH-001…009 sono state applicate e verificate. Implementati read result fail-closed, discovery univoca, promotion dello stato solo dopo commit completo, materialità Sofa separata e projection Betfair identity-safe/missing-preserving. La facade canonica è stata revisionata e le responsabilità specifiche sono state separate nei nuovi documenti `03-sofa-persistence.md` e `04-betfair-persistence.md`, senza classificare l'intervento come riscrittura completa. Le suite storage, Sofa, Betfair, recovery e timeline interessate risultano PASS. Operazioni Git: nessuna.

