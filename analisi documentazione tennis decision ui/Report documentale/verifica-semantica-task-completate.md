# Verifica semantica delle task documentali completate

## Scopo

Questo report registra il ricontrollo delle task segnate come completate nelle mappe dell’audit documentale. Il controllo non si limita alla presenza della checkbox: confronta la formulazione della task, il documento corrente, il report originario, la baseline GitHub e, quando il finding riguarda un comportamento osservabile, codice e test collegati.

## Baseline

```text
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Commit storico di confronto: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Titolo: docs: stabilize root registry recovery metadata
Task censite: 338
Task inizialmente segnate completate: 275
Task inizialmente aperte: 63
```

La baseline storica serve a preservare forma, responsabilità e informazioni corrette. Non prevale sul codice corrente e non autorizza il ripristino di contratti superati. Per i documenti modularizzati il confronto riguarda l’insieme formato dall’owner e dai moduli estratti.

## Criteri di esito

| Esito | Significato |
| --- | --- |
| `CONFERMATA` | Azione richiesta presente e semanticamente coerente con le fonti correnti |
| `DA CORREGGERE` | Task sostanzialmente applicata ma documento o registri richiedono una correzione |
| `RIAPERTA` | Checkbox completata non sostenuta dalle evidenze correnti |
| `NON APPLICABILE` | Task storica sostituita da una decisione esplicita, da documentare senza falsificarne la storia |

## Avanzamento

| Blocco | Documenti | Task completate ricontrollate | Esito |
| ---: | --- | ---: | --- |
| 1 | `README.md`; `ai/01-context-selection.md`; `ai/02-documentation-conventions.md`; `ai/03-workflow-esecutivo.md` | 17 | `CONFERMATE` |
| 2 | API Match, Betfair, Evidence, Strategy, Preflight e Runtime Health | 53 | 52 `CONFERMATE`, 1 `RIAPERTA` |
| 3 | Architettura e indice canonico | 23 | `CONFERMATE` con riallineamento dello stato corrente |
| 4 | Moduli Betfair ed Evidence | 59 | `CONFERMATE` con tre correzioni di stato corrente |

## Blocco 1 — README e workflow AI

### `README.md`

Task confermate:

```text
README-001
README-002
README-STYLE-001
```

Verificato che i requisiti Node rimandino ai manifest, che `.pending_commits/` e `.writer_authority/` siano descritti come sidecar interni a `backend/match_history/` e che la formula editoriale sia “JSON con output limitato”. La baseline GitHub conteneva ancora “JSON bounded” e non citava la writer authority nel README.

### `ai/01-context-selection.md`

Task confermate:

```text
CTX-001
CTX-002
CTX-003
CTX-004
```

Il documento corrente è limitato alla selezione del contesto, rende condizionali gli artefatti esecutivi, esclude `fileModificati.md` dalle modalità read-only, collega il workflow owner e il modulo `04-diagnosi-e-modularizzazione.md`, e usa guardrail condizionali collegati agli owner tecnici. Il testo monolitico della baseline GitHub non è stato ripristinato.

### `ai/02-documentation-conventions.md`

Task confermate:

```text
DOC-CONV-001
DOC-CONV-002
DOC-CONV-003
DOC-CONV-004
```

`docs/archive/` è classificato come non canonico, preservato, non owner e non prova di implementazione. La rimozione richiede una task esplicita. La migrazione MDX è dichiarata conclusa e la procedura corrente collega il workflow esecutivo.

### `ai/03-workflow-esecutivo.md`

Task confermate:

```text
WF-DOC-001
WF-DOC-002
WF-DOC-003
WF-DOC-004
WF-DOC-005
WF-DOC-006
```

Il documento separa task con modifiche, attività read-only e sole cancellazioni; non contiene `repomix@latest`; mantiene lifecycle e ruoli nell’owner e collega i documenti estratti per diagnosi e artefatti. Gli artefatti di revisione sono condizionali e le operazioni Git restano attribuite all’utente salvo autorizzazione esplicita.

## Blocco 2 — API

### Match

Le otto task `MATCH-API-001…008` sono confermate. Facade e tre owner estratti descrivono shape HTTP, integrity, collapsing degli errori di lettura, tracking e analisi. Il response builder di `/analyze` restituisce code e messaggi pubblici bounded; il router converte la diagnostica in eventi runtime redatti.

### Betfair

Le nove task `BETFAIR-API-001…009` sono confermate. Il probe CDP usa `classifyCdpBaseUrl`, le viste e le tolleranze sono documentate, e la login identity corrisponde al codice. È stata corretta un’incoerenza residua: la facade descriveva ancora `/odds` come deprecata, mentre route e owner specifico ne provano la rimozione. Corretto anche il riferimento di verifica inesistente nel documento del log.

### Evidence

Nove task su dieci sono confermate. `EVIDENCE-API-001` è stata riaperta:

```text
validator canonico presente: backend/src/utils/eventId.js
usato da timelineStore e matchHistory/storage

validator locali ancora presenti e più permissivi:
- backend/src/sofa/matchHistory/recovery.js
- backend/src/sofa/matchHistory/sofaUpdates/commitResult.js
- backend/src/sofa/matchHistory/commitJournal/recordSchema.js
```

La richiesta di un validator condiviso fra API, storage e test non è quindi chiusa integralmente. Le task `EVIDENCE-API-002…010` sono confermate: contratti bounded, confirmation store osservabile, mapping degli errori, rollback compensativo, test modulari e owner API estratti risultano presenti.

### Strategy

Le nove task `STRATEGY-API-001…009` sono confermate come sequenza storica culminata in `CODE-001`. Route, mount, consumer e documento canonico Strategy risultano rimossi; Evidence, Market Reactions, Source Identity, Money Flow e tracking sono rimasti separati.

### Preflight

Le nove task `PREFLIGHT-API-001…009` sono confermate. CDP, SofaScore, Betfair e Graph usano validator bounded e test dedicati; il frontend resta advisory. I riferimenti a `/odds` sono stati aggiornati perché quella route, pur essendo stata un consumer durante l’applicazione originaria di `DEC-020`, non esiste più nello stato corrente.

### Runtime Health

Le otto task `RUNTIME-HEALTH-001…008` sono confermate. Bind e boundary locali, response allow-list, significato di `ok`, `instanceId`, `startedAt`, snapshot del registry Python, `Cache-Control: no-store` e rimozione di `/api/test/health` risultano coerenti fra documento, codice e test.

## Blocco 3 — architettura e indice

Le otto task `ARCH-BOUND-001…008`, le nove task `DATA-LIFE-001…009` e le sei task `INDEX-001…006` sono confermate.

Il confronto con codice e test correnti ha però individuato uno stato successivo non riportato nei due documenti architetturali: la `trackingSessionId` esiste ed è propagata fra Start, tracker, callback SofaScore/Betfair, Source Identity Gate, conferma e bootstrap frontend. I documenti sono stati riallineati senza dichiarare chiusa la provenance end-to-end: timeline, history e varie letture persistite restano eventId-based.

Sono state aggiornate anche le protezioni frontend correnti: i poller principali possiedono generation locale, abort della richiesta e scarto delle risposte stale; lo Stop rende inattiva la sessione e disabilita i consumer condizionati. Resta distinta la quiescenza fisica delle Promise Node già avviate.

L’indice conserva la separazione fra fatti correnti, target approvati e validazioni storiche; include tutti i moduli estratti e non usa `docs/archive/` come owner.

## Blocco 4 — moduli Betfair ed Evidence

Sono confermate le 12 task `BETFAIR-LIFE-001…012`, le 9 task `TECH-SAMPLE-001…009`, le 9 task `EVID-SNAPSHOT-001…009`, le 9 task `SOURCE-ID-001…009`, le 10 task `QUALITY-FLOW-001…010` e le 10 task `MARKET-REACT-001…010`.

La verifica ha confrontato classifier, session authority, scraper lifecycle, confirmation order, quality predicates, finestre temporali, Market Reactions e relativi test modulari. Runner invalidi, `selectionId`, volume unavailable, status-only, Money Flow confirmed, ladder/book predicates, clock skew, finestre 10/30/240 secondi, reliability e `causalityClaimed:false` corrispondono al codice corrente.

Tre owner collegati sono stati riallineati:

1. il lifecycle scraper ora distingue il processo SofaScore fisicamente ancora in volo dal rifiuto logico della callback tramite `trackingSessionId`;
2. il lifecycle dati descrive bootstrap prima e upsert della confirmation dopo;
3. l’owner API della conferma non cita più un rollback della confirmation precedente al bootstrap, perché la confirmation non viene ancora persistita in quel punto.

La baseline GitHub è stata usata per preservare le sezioni e i contratti utili; le correzioni successive restano prevalenti quando sostenute da codice e test correnti.

## Blocco 5 — frontend e Match Context

Sono confermate le 10 task `FRONT-SESSION-001…010`, le 10 task `FRONT-POLL-001…010`, le 9 task `FRONT-BETFAIR-001…009` e le 7 task `MATCH-CONTEXT-001…007`.

La verifica ha seguito l’intero lifecycle da Start a Stop. La sessione frontend viene promossa soltanto dopo una risposta Start valida contenente `trackingSessionId`; `sessionActive` abilita i consumer live, mentre Stop rimuove entrambe le authority. Bootstrap e conferma Source Identity sono vincolati alla sessione corrente. Gli stati di persistence restano viste read-only e non espongono dettagli dello storage.

I poller Match, Betfair, Evidence e Source Identity usano generazioni locali, `AbortController`, cleanup e guardie contro risposte stale. Match e Betfair distinguono dati correnti e `lastKnownData`; Betfair costruisce il fallback in modo atomico. Evidence conserva integrity, sources e `persistenceComplete`, mentre `sourceUpdatedAt` resta distinto da `fetchedAt`.

Money Flow usa un massimo normalizzato condiviso, non trasforma valori mancanti in zero e non mostra tooltip per campioni invalidi. La card Betfair espone waiting, error, degraded e last-known reali; `graphLoginRequiredUrl` è soltanto la diagnostica redatta prevista dal contratto. Il contesto partita accetta esclusivamente il contratto versionato canonico, degrada a unavailable le incoerenze e mantiene `observedShift` come cambio del lato leader, non come trend.

Verifiche eseguite:

```text
frontend component tests: 6/6 superati
frontend hook, utility e view-model tests: 21/21 superati
backend localContext, pointByPoint e buildSofaAnalysis: 3/3 superati
```

La riduzione o suddivisione rispetto alla baseline GitHub è intenzionale: le facade rimandano agli owner estratti per Betfair depth/health e Market Reactions senza ripristinare duplicazioni storiche.

## Blocco 6 — runtime Python e moduli Sofa

Sono confermate le 10 task `PY-RUNTIME-001…010`, le 10 task `SOFA-SCRAPER-001…010`, le 10 task `BETFAIR-SCRAPER-001…010`, le 7 task `GRAPH-URL-001…007`, le 9 task `SOFA-LIVE-001…009` e le 8 task `LOCAL-PBP-001…008`.

Il launcher distingue processi `owned` e servizi `reused`, registra PID verificati quando disponibili e termina soltanto gli owned. Manifest, lock, probe CDP, readiness, bind loopback, failure I/O e shutdown bounded corrispondono al runtime e alla suite corrente. Il bridge SofaScore limita stdout a 2 MiB e concede 120 secondi al budget Python di 105 secondi.

Lo scraper SofaScore applica identità URL canonica, singolo eventId, chiave SHA-256 deterministica, cache dei soli successi completi, `challenge_unresolved` e risultati pubblici bounded. Lo scraper Betfair include l’identità della richiesta nella cache key, limita l’eleggibilità della cache, redige capture e diagnostica, drena i task async e usa ora un budget Python di 120 secondi con parent Node a 135 secondi. Questo stato corrente realizza l’obiettivo di coordinamento espresso originariamente dalla task sul vecchio timeout Node di 90 secondi.

La validazione Graph distingue identità mercato assente da mismatch, rifiuta selection duplicate, produce URL canoniche e separa test deterministici da osservazioni live. Il tracking Sofa mantiene separate membership, generation dei child, `bufferGeneration` e `trackingSessionId`; Stop parziale, callback stale, `repairOnly`, weak finished hint e cleanup osservabile sono coperti dal codice e dai test.

Il Point-by-Point valida ordine, coppie set/game, identità corrente e `pointsTotal`; `/analyze` e `/snapshot` sono compute-only. `dataQuality.complete` resta completezza della derivazione, non freshness o provenance.

Verifiche eseguite:

```text
launcher: 247 test superati, 1 skip previsto
scraper Python SofaScore/Betfair: 78/78 superati
tracking, lifecycle, Graph, local context e PBP Node: tutte le suite mirate superate
```

## Blocco 7 — storage e operazioni runtime già completate

Sono confermate le 9 task `STORAGE-TH-001…009`, le 10 task `JOURNAL-REC-001…010`, le 7 task `LOCAL-RUNTIME-001…007` e le 5 task completate `LIVE-CTRL-001`, `LIVE-CTRL-002`, `LIVE-CTRL-003`, `LIVE-CTRL-005`, `LIVE-CTRL-006`.

Timeline e history restituiscono risultati di lettura strutturati, falliscono chiuse su target ambigui o documenti illeggibili e separano stato prepared da committed. La materialità Sofa distingue history e timeline; la proiezione Betfair usa `selectionId`, preserva missing e confronta i runner senza dipendere dall’ordine. `latest` resta una view derivata.

Journal e recovery verificano semanticamente i target prima del cleanup, validano binding e payload prima del repair e rendono osservabili journal invalidi, `recovery_failed` e retry pending. La diagnostica è bounded; i nuovi commit ID sono source-prefixed UUID. L’owner della writer authority è stato estratto senza duplicare il journal owner.

Il launcher confronta repository e storage identity opache prima del riuso, completa la discovery prima dello spawn e distingue readiness, browser convenience ed esito CLI. La CDP URL è propagata come dato della sessione, non come configurazione globale del backend. Nel runbook live restano separate evidenza corrente, persistita e last-known, oltre a Stop logico, cleanup Python e drain delle operazioni Node.

La task `LIVE-CTRL-004` resta correttamente aperta: il riuso della `terminationPromise` dopo un cleanup incompleto non è stato ancora risolto. Anche `LIVE-CTRL-007` resta aperta perché richiede un artifact live 9B con provenance reale e una matrice post-Stop più ampia.

Verifiche eseguite:

```text
storage, journal, recovery e timeline: 21 file di test superati
launcher e local runtime: coperti anche dai 247 test del blocco precedente
```

## Blocco 8 — retention

Sono confermate `RETENTION-001` e `RETENTION-002`. Le soglie `max-files` e `max-total-bytes` sono applicate separatamente a ciascuna cache selezionata; l’apply è best-effort per file e il report espone `removed`, `errors` e `recoveredBytes`. La suite del cleanup ha superato 18 test con 1 skip previsto.

`RETENTION-003` resta correttamente aperta: il documento dichiara esplicitamente che manca ancora una snapshot boundary project-owned per un backup coerente destinato a restore o audit.

## Esito delle task inizialmente marcate completate

```text
task esaminate: 275
task confermate dal codice, dai test e dagli owner correnti: 274
task riaperta: EVIDENCE-API-001
```

## Verifica delle task aperte e completamento dell’inventario

Sono state riesaminate anche le 64 task risultate aperte dopo la riapertura di `EVIDENCE-API-001`. Quarantanove erano correzioni documentali applicabili oppure descrivevano hardening già presente nel codice ma non ancora riflesso negli owner: sono state applicate e marcate completate in mappa e JSON. Dieci documenti residui, indici 63–72, sono stati letti e dotati di report; non hanno introdotto nuove root issue.

Restano aperte 15 task:

```text
EVIDENCE-API-001
LIVE-CTRL-004
LIVE-CTRL-007
BETFAIR-DIAG-002
VALID-ROLL-001
VALID-ROLL-002
VALID-ROLL-003
VALID-ROLL-005
RETENTION-003
ROOT-REG-002
AUDIT-CODE-P1-002
AUDIT-CODE-P23-002
DOC-AUDIT-P12-002
DOC-AUDIT-B34-002
DOC-AUDIT-B56-002
```

Le prime dieci richiedono ancora codice, copertura, provenance live o una decisione/authority non dimostrata. Le ultime cinque richiedono la divisione strutturale di registri molto grandi: la semantica è stata corretta tramite overlay corrente, ma la modularizzazione non è stata dichiarata completata senza aver realmente creato i child e spostato integralmente i contenuti.

## Verifica globale finale

```text
task in mappa e JSON: 338
task completate: 323
task aperte: 15
parità checkbox mappa/JSON: verificata
mojibake nei documenti e registri: 0 occorrenze
link checker strict: 168 file, 780 link, 0 errori, 0 warning
registry checker: 241 owner, 214 righe Todo, 0 errori, 0 warning
test checker: 31 superati
full-offline nel sandbox: 16 entry superate, build frontend bloccata dall’accesso al parent del workspace
build frontend fuori sandbox: superata, 1468 moduli trasformati
```

Non sono state eseguite operazioni Git. Il codice applicativo non è stato modificato.
