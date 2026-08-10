# Report documentale — `docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-015
Sequenza audit: 15/72
Documento analizzato: 02-technical-sample-validity.md
Percorso documento: docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md
Percorso report: Report documentale/15 - 02-technical-sample-validity.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 281976077df2f67ecf13a5e19c319ed444f99485
Dimensione documento: 396 righe
Ruolo dichiarato: owner della validità tecnica dei campioni Betfair
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/betfair/processor.js`;
- `backend/src/sofa/betfair/processor/technicalSample.js`;
- `backend/src/sofa/betfair/processor/runnerProcessing.js`;
- `backend/src/sofa/betfair/processor/persistence.js`;
- `backend/src/sofa/betfair/processor/persistenceDecision.js`;
- `backend/src/sofa/betfair/processor/persistenceDocuments.js`;
- `backend/src/sofa/betfair/processor/canonicalTimeline.js`;
- `backend/src/sofa/betfair/timeline.js`;
- `backend/src/sofa/betfair/timeline/state.js`;
- `backend/src/sofa/betfair/timeline/runnerSnapshot.js`;
- `backend/src/sofa/betfair/timeline/statusOnlySnapshot.js`;
- `backend/src/sofa/betfair/timeline/graphHealth.js`;
- `backend/src/sofa/betfair/moneyFlow.js`;
- `backend/src/sofa/betfair/trackerUpdate.js`;
- `backend/src/sofa/betfairFetch.js`;
- `scrapers/betfair/scrape.py`;
- `scrapers/betfair/market_api.py`;
- `scrapers/betfair/parsing.py`;
- `backend/src/sofa/betfair/processor/technicalSample.test.mjs`;
- `backend/src/sofa/betfair/processor/runnerProcessing.test.mjs`;
- `backend/src/sofa/betfair/processor/runtimeOrchestration.test.mjs`;
- `backend/src/sofa/betfair/processor/canonicalTimeline.test.mjs`;
- `backend/src/sofa/betfair/timeline/state.test.mjs`;
- `backend/src/sofa/betfair/trackerUpdate/technicalRecovery.test.mjs`;
- `docs/validations/betfair-live-validation-2026-07-04.md`;
- `docs/tennis-decision-ui/ai/02-documentation-conventions.md`;
- i finding tecnici e documentali già registrati su Betfair, Data Lifecycle e scraper lifecycle.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: MEDIO-ALTA
Classifier top-level: implementato
Fail-closed su error/api_error/runners vuoti/market total: corretto
Protezione campione non utilizzabile: sostanzialmente corretta
Repair journal: sostanzialmente corretto
Status-only: implementato ma descritto con semantica incompleta
Validità runner individuali: insufficiente
Runner identity canonica: non garantita dal classifier
Runner matched volume: ancora sintetizzabile
Vocabolario regressione: non uniforme
Runtime acquisition vs marketState: da separare
Copertura test classifier: insufficiente
Validazione storica inline: da separare
Modifiche proposte: 9
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
```

La distinzione centrale del documento è corretta:

```text
errore tecnico
≠ mercato concluso
≠ persistenza canonica
```

È corretto inoltre che:

```text
campione tecnico non utilizzabile
→ non passa al Source Identity Gate
→ non produce nuovi dati business dal sample corrente
→ può soltanto tentare repair deterministico di un journal pending
```

Il problema principale è che la funzione chiamata:

```text
classifyBetfairTechnicalSample
```

garantisce oggi soltanto una validità **top-level**.

Non garantisce che il contenuto dei runner sia realmente processabile o canonico.

In particolare:

```text
runners: [null]
+
market_info.total_matched > 0
→ usable:true
```

ma il successivo:

```text
processBetfairRunnerState
```

dereferenzia immediatamente:

```text
runner.ladder
runner.exchange
runner.back
runner.lay
```

e può quindi fallire.

Anche runner oggetto ma senza `selectionId` vengono accettati e possono raggiungere `marketState` con:

```text
selectionId:null
```

come confermato da un test corrente.

---

# 1. Classifier top-level e runner non processabili

## Esito: gap critico

`classifyBetfairTechnicalSample(raw)` verifica:

```text
raw plain object
error assente
api_error assente
runners array
runners non vuoto
market_info.total_matched presente
total_matched numerico/finito
total_matched > 0
```

Non verifica però che ogni elemento di:

```text
raw.runners
```

sia un oggetto.

Esempio:

```js
{
  runners: [null],
  market_info: {
    total_matched: 1000
  }
}
```

viene classificato:

```text
usable:true
```

Il processor entra quindi in:

```text
processBetfairRunnerState
```

che esegue accessi diretti a proprietà del runner.

Quindi il contratto:

```text
usable
→ campione elaborabile
```

non è garantito.

## Finding `TECH-SAMPLE-001` — validare la shape minima di ogni runner

**Priorità:** critica  
**Tipo:** technical sample safety

### Modifica runtime richiesta

Prima di restituire:

```text
usable:true
```

il classifier deve almeno garantire che ogni runner sia una struttura processabile.

Requisito immediato non controverso:

```text
ogni runner
→ oggetto non-array
```

Se il contratto definitivo richiede altri campi obbligatori, devono essere derivati dagli owner runtime effettivi e testati.

### Reason

Introdurre un reason stabile, per esempio:

```text
runner_invalid
```

oppure una nomenclatura coerente con il registry reason esistente.

### Test obbligatori

Aggiungere almeno:

```text
runners:[null]
runners:[1]
runners:["x"]
runners:[[]]
```

e verificare:

```text
usable:false
→ nessun processBetfairRunnerState
→ nessun gate
→ nessun nuovo commit
```

---

# 2. `selectionId` mancante o duplicato

## Esito: identità runner non garantita

Il classifier non valida:

```text
selectionId
```

né:

```text
unicità dei selectionId
```

`runnerProcessing.test.mjs` conferma esplicitamente che un runner senza `selectionId` viene accettato:

```text
selectionId:null
```

e inserito in:

```text
marketState
```

La timeline canonica normalizza anch’essa il valore assente a `null`.

## Effetto su duplicate/regression

`timeline/state.js` usa `selectionId` come identità del runner.

Quando incontra:

```text
selectionId:null
```

oppure un duplicato:

```text
indexRunnersBySelectionId(...)
→ null
```

e i controlli:

```text
isDuplicateBetfairTick
isRegressiveBetfairTick
```

perdono la possibilità di confrontare in modo affidabile le identità.

## Finding `TECH-SAMPLE-002` — definire la runner identity minima per un sample canonico

**Priorità:** alta  
**Tipo:** canonical runner identity

### Modifica richiesta

Separare:

```text
sample top-level parseable
da
sample autorizzabile verso canonical processing
```

Prima del percorso canonico occorre una decisione esplicita sul requisito:

```text
selectionId presente
selectionId normalizzabile
selectionId univoco nel sample
```

Il codice corrente utilizza già `selectionId` come identity stabile in restore, Money Flow, duplicate detection, regression detection, Source Identity e timeline.

### Test

Aggiungere:

```text
selectionId mancante
selectionId null
selectionId duplicate
stesso nome + ID diverso
ID valido + nome cambiato
```

---

# 3. Runner matched volume sintetico dopo il classifier

## Esito: incongruenza critica con la filosofia dati

Un sample può superare il classifier perché:

```text
market_info.total_matched > 0
runners non vuoto
```

anche se manca un volume matched reale del runner.

`processBetfairRunnerState()` contiene ancora il fallback:

```text
marketTotalMatched / runnerCount
```

quando non trova un valore runner positivo.

Il valore viene poi propagato anche in:

```text
totalMatchedOnSelection
```

e può entrare nel calcolo Money Flow.

Questo comportamento è già stato classificato nell’audit tecnico come dato sintetico da rimuovere.

## Finding `TECH-SAMPLE-003` — eliminare il fallback sintetico runner matched

**Priorità:** critica  
**Tipo:** data integrity

### Coordinamento

Coordinare con la decisione già registrata:

```text
DATA-001
```

senza creare due implementazioni divergenti.

### Contratto target

Quando il volume runner non esiste:

```text
matchedTotal
→ null/unavailable

totalMatchedOnSelection
→ non inventato

Money Flow
→ suppressed

reason
→ runner_matched_unavailable
```

Zero non deve sostituire automaticamente un dato assente.

### Documentazione

Chiarire:

```text
total_matched mercato valido
≠ volume matched runner valido
```

---

# 4. RepairOnly: nessun nuovo dato dal sample non significa nessuna scrittura

## Esito: formulazione corrente ambigua

Il documento contiene invarianti come:

```text
campione tecnico non utilizzabile
→ non salva nuove row history
→ non salva nuove timeline
```

La proprietà business è corretta:

```text
il sample tecnico corrente
non viene trasformato in un nuovo tick o in una nuova row
```

Ma la proprietà filesystem, se letta letteralmente, non è corretta.

`persistBetfairProcessedResult()` verifica prima un eventuale:

```text
pendingCommit
```

e può eseguire:

```text
repairPendingBetfairCommit(...)
```

Il repair può completare fisicamente i target:

```text
history
timeline
```

usando payload, target, metadata e `commitId` già nel journal.

## Finding `TECH-SAMPLE-004` — distinguere business append e repair write

**Priorità:** alta  
**Tipo:** recovery semantics

### Formula corretta

```markdown
Un campione tecnico non utilizzabile non genera nuovi dati canonici
derivati dal sample corrente.

Può però attivare `repairOnly` e completare fisicamente i target
history/timeline di un commit già descritto dal journal pending.
```

### Invarianti corretti

```text
no new sample-derived tick
no new sample-derived history row
no new commitId
no business reconstruction from live sample
marketState unchanged
Source Identity bypassed
```

---

# 5. `regressive_sample` e `regressive_tick`

## Esito: vocabolario non uniforme

Il documento afferma che il sistema può rifiutare il risultato come:

```text
regressive_sample
duplicate_tick
```

Il codice usa due livelli distinti.

### Runner processing

```text
timelineIntegrity.reason
→ regressive_sample
```

### Persistence decision

```text
persistence reason
→ regressive_tick
```

sia quando:

```text
timelineIntegrity.accepted === false
```

sia quando il confronto canonico rileva una regressione.

## Finding `TECH-SAMPLE-005` — distinguere reason interno e reason persistence

**Priorità:** media  
**Tipo:** reason vocabulary

### Modifica richiesta

Documentare:

```text
timelineIntegrity.reason
→ regressive_sample

persistence result reason
→ regressive_tick

duplicate persistence reason
→ duplicate_tick
```

Unificare il vocabolario soltanto se viene modificato anche il codice.

---

# 6. Status-only: `marketState` invariato ma timeline canonica avanzata

## Esito: baseline non sufficientemente distinta

Il documento dice che il tick status-only:

```text
conserva mercato e runner dell’ultimo tick canonico
non aggiorna baseline runner o market
viene aggiunto alla timeline canonica
```

Questa descrizione deve distinguere due strutture.

### Runtime `marketState`

Nel percorso regressivo:

```text
timelineIntegrity.accepted:false
→ nessun pending runner state
```

quindi un commit status-only non avanza il `marketState`.

### Timeline canonica

Il tick status-only:

```text
riceve nuovo seq
riceve nuovo commitId
viene aggiunto alla timeline
```

e `findLastAlgorithmicTick()` non esclude i tick `statusOnlyGraphLogin`.

Quindi può diventare il riferimento timeline del ciclo successivo.

### Money Flow

I runner vengono clonati, ma `moneyFlow` viene sostituito con:

```text
back:0
lay:0
trend:neutral
confidence:suppressed
reason:graph_login_required
```

## Finding `TECH-SAMPLE-006` — definire le due baseline dello status-only

**Priorità:** alta  
**Tipo:** canonical timeline semantics

### Modifica richiesta

Documentare separatamente:

```text
marketState runtime
→ non avanzato

canonical timeline
→ avanzata con nuovo status-only tick

history business rows
→ append:false

Money Flow nel nuovo tick
→ suppressed graph_login_required
```

Aggiungere che il nuovo tick può essere il `last algorithmic tick` successivo.

---

# 7. Runner `marketState` e Betfair runtime acquisition state

## Esito: frase ambigua

Il documento afferma:

```text
Solo complete/recovered
→ confermano lo stato runtime dei runner
```

Nel contesto si riferisce al `marketState` e questa proprietà è corretta.

Ma `trackerUpdate.js` possiede anche:

```text
betfairRuntime.lastSuccessfulScrapeAt
```

che viene aggiornato dopo un sample tecnicamente usabile **prima** del gate e della persistenza, e anche nel percorso `hasFinished`.

Quindi:

```text
Betfair runtime acquisition state
≠ commit-confirmed runner marketState
```

## Finding `TECH-SAMPLE-007` — rinominare il concetto di stato confermato

**Priorità:** alta  
**Tipo:** runtime vs persistence semantics

### Formula consigliata

```text
complete/recovered
→ confermano il runner baseline `marketState`

lastSuccessfulScrapeAt
→ rappresenta il successo runtime/acquisition secondo trackerUpdate
→ non prova un commit canonico
```

Coordinare con:

```text
DATA-LIFE-003
```

---

# 8. Copertura test del classifier e status-only

## Esito: insufficiente rispetto al contratto documentato

Il documento elenca otto reason:

```text
invalid_raw
raw_error
api_error
runners_missing
runners_empty
total_matched_missing
total_matched_invalid
total_matched_non_positive
```

ma:

```text
processor/technicalSample.test.mjs
```

verifica direttamente soltanto:

```text
runners_empty
```

Mancano test diretti per il resto della matrice e per i nuovi edge case emersi.

### Status-only

Non esiste sul checkpoint:

```text
statusOnlySnapshot.test.mjs
```

e `canonicalTimeline.test.mjs` copre regressione ordinaria/duplicate, non il percorso end-to-end di login Graph status-only.

## Finding `TECH-SAMPLE-008` — completare la matrice automatica

**Priorità:** alta  
**Tipo:** verification coverage

### Classifier

Testare:

```text
invalid_raw
raw_error
api_error
runners_missing
runners_empty
total_matched_missing
total_matched_invalid
total_matched_non_positive
numero valido
stringa EUR prodotta da format_eur
NaN
Infinity
runner malformed
selectionId missing
selectionId duplicate
```

### Status-only

Aggiungere un test end-to-end:

```text
previous canonical tick
+
graphLoginRequired:true
+
graphRowsTotal:0
+
timelineIntegrity.accepted:false
→ status-only commit
```

Verificare:

```text
new seq
new commitId
timeline append
history append:false
marketState invariato
Money Flow suppressed
graphHealth auth_suspected
```

Aggiungere anche negative cases.

---

# 9. Validazioni storiche dentro l’owner

## Esito: ownership da pulire

La sezione iniziale include risultati storici live e la sezione Verifica conserva dettagli come:

```text
script Node mirato
→ here-doc corrotto
→ non dichiarare PASS
```

Questi elementi sono provenance di collaudo, non contratto permanente.

Le convenzioni prescrivono:

```text
report di collaudo
→ docs/validations/
```

e:

```text
validazione storica
≠ prova di PASS sullo SHA corrente
```

Esiste già:

```text
docs/validations/betfair-live-validation-2026-07-04.md
```

che registra logout Graph e recovery con limiti espliciti.

## Finding `TECH-SAMPLE-009` — separare contratto e validation history

**Priorità:** media  
**Tipo:** document ownership

### Modifica richiesta

Nell’owner mantenere:

```text
stato corrente
test automatici disponibili
gap correnti
link alle validation storiche
```

Rimuovere il racconto dettagliato dei singoli collaudi e degli script falliti.

Non inventare metadata per prove non archiviate.

---

# 10. Mercato concluso

## Esito: sostanzialmente corretto

`trackerUpdate.js` controlla:

```text
event_status.hasFinished === true
```

prima del classifier.

Quando vero:

```text
lastSuccessfulScrapeAt aggiornato
betfairFinished = true
return
```

senza gate o persistenza del sample conclusivo.

È quindi corretta la regola:

```text
finished esplicito
→ stop polling Betfair
```

e gli errori tecnici da soli non impostano `betfairFinished:true`.

Aggiungere soltanto la precisione:

```text
hasFinished esplicito ha precedenza sulla classificazione tecnica
```

---

# 11. Technical failure result

## Esito: coerente

`buildTechnicalFailureResult()` garantisce:

```text
runners array
market_info object
diagnostics
graph_diagnostics
event_status default
technicalFailure
```

Questa parte è corretta.

Dopo eventuali nuovi reason di `TECH-SAMPLE-001/002`, il documento dovrà essere aggiornato nello stesso scope.

---

# 12. Secondo guard in persistenza

## Esito: corretto ma usa lo stesso classifier

`persistBetfairProcessedResult()` passa da:

```text
evaluateBetfairPersistenceDecision
```

che riclassifica il `processedResult`.

Quindi esiste un backstop prima di creare un nuovo commit.

Il backstop però usa lo stesso classifier top-level e non corregge autonomamente:

```text
runner malformed
selectionId mancante/duplicato
```

---

# 13. Graph error e technical usability

## Esito: separazione corretta

È corretto che un errore Graph isolato non renda automaticamente inutilizzabile un sample che possiede dati di mercato sufficienti.

Graph Health resta una dimensione distinta:

```text
ok
stale
auth_suspected
bad_graph_url
temporary_error
unavailable
finished
unknown
```

Questa separazione va mantenuta.

---

# 14. Money Flow

## Esito: suppression corretta, input upstream da correggere

`calculateValidatedMoneyFlow()` sopprime correttamente quando:

- ladder non è Graph;
- market delta non è disponibile;
- runner matched manca;
- regressioni;
- runner delta supera market delta;
- ladder traded delta è incoerente.

Il problema è a monte: `runnerProcessing` può trasformare un dato runner assente in un valore sintetico.

Quindi `TECH-SAMPLE-003` deve correggere l’input, non indebolire la suppression.

---

# 15. `total_matched` formattato

## Esito: coerente con il producer corrente

Il producer Python usa:

```text
format_eur()
```

e per valori >= 1000 produce stringhe come:

```text
EUR 74,817
```

Il parser Node corrente gestisce questo formato.

Aggiungere il formato producer-compatible alla matrice test di `TECH-SAMPLE-008`.

---

# 16. Status-only e Graph Health

## Esito: implementazione coerente

Nel percorso status-only:

```text
graphHealth.status
→ auth_suspected

reason
→ graph_login_required

hasUsableLadder
→ false

hasUsableGraphLadder
→ false
```

La correzione richiesta riguarda il significato delle baseline, non la classificazione Graph Health.

---

# 17. Persistence result

## Esito: corretto ad alto livello

Per duplicate/regressione ordinaria:

```text
unchanged
→ nessun nuovo commit
```

Per un nuovo commit:

```text
new commitId
→ prepare documents
→ journalized commit
```

Per pending journal:

```text
repair prima del nuovo sample
```

Correggere soltanto reason, repair write semantics e status-only baseline.

---

# 18. Modularizzazione

## Valutazione

```text
Righe: 396
Responsabilità primaria: 1
Owner: validità tecnica Betfair
Sottotemi: classifier, finished, repair boundary, persistence eligibility, status-only
Owner specialistici collegati: sì
Contesti indipendenti da separare: no
Rischio principale: duplicazione, non lunghezza
Suddivisione richiesta: no
```

Il documento deve restare un owner unico.

Creare documenti distinti per technical errors, repair e status-only frammenterebbe un contratto che deve essere letto in sequenza.

La soluzione è:

```text
mantenere un owner unico
→ ridurre storico
→ rinviare dettagli storage agli owner
→ precisare i confini
```

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-015
Percorso report: Report documentale/15 - 02-technical-sample-validity.md
Documento: docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md
Change ID: TECH-SAMPLE-001
Change ID: TECH-SAMPLE-002
Change ID: TECH-SAMPLE-003
Change ID: TECH-SAMPLE-004
Change ID: TECH-SAMPLE-005
Change ID: TECH-SAMPLE-006
Change ID: TECH-SAMPLE-007
Change ID: TECH-SAMPLE-008
Change ID: TECH-SAMPLE-009
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

Quando verrà eseguito il prossimo aggiornamento cumulativo:

```text
mappa-file-markdown-repository.md
→ registrare i report del blocco non ancora recepiti
→ indice 15 ANALIZZATO
→ Divisione non necessaria
→ aggiungere le task del report

modifiche-audit-markdown.json
→ appendere soltanto nuovi report/task
→ preservare il ledger precedente
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `TECH-SAMPLE-001` — runner shape minima

**Priorità:** critical

- impedire `usable:true` con runner non-oggetto;
- introdurre reason stabile;
- evitare crash in `runnerProcessing`;
- aggiungere test malformed runner.

## `TECH-SAMPLE-002` — canonical runner identity

**Priorità:** high

- definire il requisito `selectionId`;
- gestire ID mancanti;
- rifiutare ID duplicati;
- preservare rename con stesso ID;
- mantenere affidabili duplicate/regression detection.

## `TECH-SAMPLE-003` — runner matched sintetico

**Priorità:** critical

- applicare la decisione `DATA-001`;
- rimuovere `marketTotalMatched / runnerCount`;
- rappresentare dato assente come unavailable;
- sopprimere Money Flow dipendente;
- aggiornare test e documentazione nello stesso scope.

## `TECH-SAMPLE-004` — repair write semantics

**Priorità:** high

- distinguere no new sample-derived data da no filesystem write;
- dichiarare che repair può completare target pendenti;
- mantenere sample live escluso dalla ricostruzione business.

## `TECH-SAMPLE-005` — regression reasons

**Priorità:** medium

- distinguere `regressive_sample`;
- distinguere `regressive_tick`;
- mantenere `duplicate_tick`;
- unificare solo se cambia anche il codice.

## `TECH-SAMPLE-006` — status-only baseline semantics

**Priorità:** high

- distinguere `marketState` e canonical timeline;
- documentare seq/commitId nuovi;
- documentare history append:false;
- documentare Money Flow suppressed;
- documentare il nuovo last algorithmic tick.

## `TECH-SAMPLE-007` — runner baseline vs Betfair runtime

**Priorità:** high

- usare `marketState` quando si parla di complete/recovered;
- distinguere `lastSuccessfulScrapeAt`;
- coordinare con `DATA-LIFE-003`.

## `TECH-SAMPLE-008` — verification matrix

**Priorità:** high

- testare tutti i reason classifier;
- testare malformed runner;
- testare selectionId missing/duplicate;
- testare parser producer-compatible;
- testare rimozione volume sintetico;
- aggiungere test automatico dedicato status-only.

## `TECH-SAMPLE-009` — validation ownership

**Priorità:** medium

- togliere risultati live storici dettagliati dall’owner;
- linkare la validation esistente;
- lasciare nell’owner soltanto contratto, stato e gap correnti;
- non inventare metadata.

---

# Ordine consigliato di applicazione

```text
1. TECH-SAMPLE-001
2. TECH-SAMPLE-002
3. DATA-001 / TECH-SAMPLE-003
4. TECH-SAMPLE-008
5. TECH-SAMPLE-006
6. TECH-SAMPLE-004
7. TECH-SAMPLE-007
8. TECH-SAMPLE-005
9. TECH-SAMPLE-009
10. revisione mirata del documento owner
11. checker documentali
12. aggiornamento cumulativo mappa/JSON al checkpoint previsto
```

---

# Verifica prevista dopo un’eventuale modifica

## Syntax

```bash
node --check backend/src/sofa/betfair/processor.js
node --check backend/src/sofa/betfair/processor/technicalSample.js
node --check backend/src/sofa/betfair/processor/runnerProcessing.js
node --check backend/src/sofa/betfair/processor/persistence.js
node --check backend/src/sofa/betfair/processor/persistenceDecision.js
node --check backend/src/sofa/betfair/timeline.js
node --check backend/src/sofa/betfair/timeline/state.js
node --check backend/src/sofa/betfair/timeline/statusOnlySnapshot.js
node --check backend/src/sofa/betfair/trackerUpdate.js
```

## Classifier

Verificare:

```text
null raw
array raw
raw.error
raw.api_error
runners missing
runners empty
runner null
runner primitive
market total missing
market total invalid
market total zero
market total negativo
market total EUR formattato
```

## Runner identity

```text
missing selectionId
duplicate selectionId
same ID + renamed runner
different ID + same name
```

## Runner volume

```text
runner matched reale
→ preservato

runner matched assente
→ nessun marketTotal/runnerCount

Money Flow
→ suppressed
```

## RepairOnly

Con journal pending:

```text
technical sample invalid
→ nessun dato sample-derived
→ repair target consentito
→ commitId preesistente
→ marketState invariato
```

Senza journal:

```text
→ unchanged/skip
→ nessun nuovo commit
```

## Status-only

```text
previous tick
graphLoginRequired true
graphRowsTotal 0
timelineIntegrity accepted false
→ status-only

new seq
new commitId
timeline append
history no business append
marketState invariato
Money Flow suppressed
graphHealth auth_suspected
```

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
02-technical-sample-validity.md: OWNER VALIDO, MA CLASSIFIER TROPPO PERMISSIVO

Top-level invalid raw: corretto
raw.error/api_error: corretto
runners empty: corretto
market total invalid: corretto
finished separation: corretta
repairOnly boundary: corretta nel principio
runner object validity: mancante
selectionId authority: mancante
duplicate selectionId guard: mancante
synthetic runner matched: ancora presente
regression vocabulary: non uniforme
status-only marketState: invariato
status-only canonical timeline: avanza
status-only Money Flow: suppressed
Betfair runtime timestamp: non commit-confirmed
test classifier: troppo ridotto
test status-only dedicato: mancante
storico live nell’owner: da separare

Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: alta
```

Il documento deve restare un singolo owner.

La correzione più importante è rendere vera l’implicazione:

```text
usable:true
→ sample realmente processabile
```

che oggi non è garantita.

La seconda distinzione da preservare è:

```text
market total valido
≠ runner data valida
≠ runner matched osservato
≠ canonical persistence riuscita
```
