# Source Identity

## Scopo

Source Identity gestisce due responsabilità separate:

```txt
Source Identity Gate live
→ autorizza o blocca la persistenza di nuovi campioni SofaScore e Betfair

Source Identity effective nello snapshot Evidence
→ autorizza o blocca l’uso cross-source di timeline già persistite
```

Il modulo impedisce sia la persistenza canonica sia l’analisi Evidence fra fonti non compatibili.

## Implementazione

```txt
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/matchTracker.js

backend/src/sofa/matchEvidence/sourceIdentity.js
backend/src/sofa/matchEvidence/sourceIdentity/
backend/src/sofa/matchEvidence/sourceIdentityConfirmation.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js

backend/src/routes/match/sourceIdentityStatusResponse.js
```

I consumer della classificazione automatica importano dalla facade:

```txt
backend/src/sofa/matchEvidence/sourceIdentity.js
```

Il matching nomi resta esposto da:

```txt
backend/src/sofa/matchEvidence/sourceIdentity/nameMatching.js
```

I file sotto `backend/src/sofa/matchEvidence/sourceIdentity/` separano normalizzazione, profilo nome, cognomi composti, apostrofi, given names, runner matching, builder Source Identity ed epoch Betfair.

Il gate live resta separato in:

```txt
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/sourceIdentityGate/
```

`sourceIdentityGate.js` resta la facade pubblica. I file sotto `sourceIdentityGate/` separano validazione campioni, sessione runtime, store in memoria, status read-only, evaluator del lifecycle e conferma manuale.

Il gate è indicizzato per `eventId`, ma ogni nuovo Start crea anche una `trackingSessionId` distinta. L'identificativo viene conservato nel tracker e nel gate, raggiunge gli observer SofaScore e Betfair, è restituito dallo Start ed è richiesto dalla conferma manuale live. Una callback appartenente a una sessione precedente viene bloccata prima del gate e della persistenza.

`bufferGeneration` distingue i contesti osservati all'interno della stessa sessione gate e non sostituisce `trackingSessionId`.

## Fasi del gate live

| Fase             | Persistenza | Significato                                                               |
| ---------------- | ----------- | ------------------------------------------------------------------------- |
| `collecting`     | `buffering` | Mancano campioni validi per completare la valutazione                     |
| `pending`        | `buffering` | L’identità automatica non è sufficiente e può richiedere conferma manuale |
| `recording`      | `canonical` | Identità allineata automaticamente o tramite conferma applicabile         |
| `mismatch`       | `blocked`   | Fonti incompatibili; il campione causale non viene persistito             |
| `not-applicable` | `canonical` | Nessun URL Betfair; SofaScore può proseguire                              |
| `stopped`        | Non esposto | Stato interno transitorio prima della rimozione del gate                  |

Prima di `recording`, il gate conserva soltanto l’ultimo campione valido per fonte in memoria.

Un campione Betfair tecnicamente non utilizzabile non deve raggiungere il gate nel flusso normale:

```txt
technicalFailure
→ nessun aggiornamento candidate
→ nessun bootstrap
→ nessuna persistenza
→ nessun mismatch
```

Il tracker continua il polling fino a un campione tecnicamente utilizzabile oppure a un `event_status.hasFinished` esplicito.

## Azioni degli observer

Gli observer restituiscono:

```txt
buffered
persist-current
bootstrapped
blocked
gate_unavailable
```

| Azione            | Significato                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `buffered`        | Il campione resta in memoria; nessuna persistenza canonica           |
| `persist-current` | Il campione può essere persistito dal tracker                        |
| `bootstrapped`    | Il callback di apertura ha già persistito il primo contesto canonico |
| `blocked`         | Il gate è in mismatch o terminale; nessuna persistenza               |
| `gate_unavailable`| Non esiste una sessione gate valida; il campione viene bloccato      |

`bootstrapped` evita la doppia persistenza del campione che apre `recording`.

Nel tracking canonico l'assenza imprevista del gate è fail-closed e produce `blocked` con reason `gate_unavailable`. Sofa-only usa esplicitamente `not-applicable` e può persistere senza dipendere dal gate Betfair.

Nel bootstrap il tracker mantiene l’ordine:

```txt
SofaScore
→ Betfair
```

## Stati Source Identity

| Stato      | Significato                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| `aligned`  | Giocatori SofaScore e runner Betfair hanno un mapping biunivoco deterministico |
| `pending`  | Dati incompleti, ambiguità o evidenza parziale uno-a-uno da confermare         |
| `mismatch` | Non esiste una corrispondenza plausibile nel contesto corrente                 |

`sourceIdentity.status` descrive l’identità calcolata.

`phase` descrive invece il lifecycle e governa la persistenza live.

I due valori non sono intercambiabili.

## Classificazione automatica

Il builder calcola i candidati SofaScore per ciascun runner Betfair.

La precedenza è:

```txt
dati identitari incompleti
→ pending

runner con candidati stretti assenti
→ verifica evidenza parziale tramite token condivisi
→ pending soltanto con mapping uno-a-uno plausibile
→ altrimenti mismatch

candidati stretti presenti ma ambigui
→ pending

mapping stretto biunivoco
→ aligned
```

| Scenario                                          | Stato      | Conseguenza                                    |
| ------------------------------------------------- | ---------- | ---------------------------------------------- |
| Un runner compatibile e uno estraneo              | `mismatch` | Persistenza bloccata; nessuna conferma manuale |
| Entrambi i runner con evidenze parziali uno-a-uno | `pending`  | Conferma manuale ammessa                       |
| Entrambi i runner ambigui senza runner estranei   | `pending`  | Conferma manuale ammessa                       |
| Mapping stretto biunivoco                         | `aligned`  | Il gate può entrare o restare in `recording`   |

Esempi:

```txt
John Smith / Peter Smith
Smith / Fabio Fognini
→ mismatch

Andrew Fenty / Anders Fenty
And Fenty / Fenty
→ pending
```

Normalizzazione, accenti, particelle dei cognomi e abbreviazioni possono contribuire al matching, ma non devono trasformare un caso ambiguo in allineamento automatico.

## Epoch Betfair

L’identità viene calcolata sull’epoch Betfair attivo.

La firma usa, in ordine di preferenza:

```txt
marketId + selectionIds distinti
```

oppure:

```txt
marketKey + runner normalizzati
```

L’epoch attivo è la sequenza finale contigua di tick con la stessa firma.

```txt
cambio firma mercato
→ tick storici esclusi

ultimo tick senza firma valida
→ nessun epoch attivo
→ Source Identity pending
```

L’esclusione di un epoch precedente resta disponibile come ragione diagnostica, ma non autorizza l’uso dei suoi runner nel contesto corrente.

## Conferma manuale

La conferma è ammessa soltanto quando l’identità automatica è `pending`.

La validazione richiede un contesto completo:

```txt
eventId
+ epochSignature
+ marketId
+ due selectionId distinti
+ due giocatori SofaScore
+ due runner Betfair
+ mapping uno-a-uno selezionato
```

La conferma viene legata a un fingerprint del contesto.

Una conferma esistente è applicabile soltanto se tutti gli elementi del contesto coincidono.

```txt
conferma pending valida
→ bootstrap SofaScore
→ bootstrap Betfair
→ persistenza confirmation
→ recording
```

La confirmation viene resa durevole soltanto dopo un bootstrap riuscito. Se il bootstrap fallisce non viene eseguito alcun upsert; se l'upsert fallisce, la sessione resta `pending` e non entra in `recording`.

Una conferma con lo stesso fingerprint è idempotente.

Una nuova conferma per lo stesso contesto sostituisce l’eventuale record precedente con fingerprint diverso.

### Cambio di contesto

Un cambio di epoch, mercato, selection ID o runner rende non applicabile una conferma manuale precedente.

Non forza però automaticamente il gate in `pending`.

Il gate rivaluta l’identità automatica con i nuovi campioni:

```txt
nuovo contesto automaticamente aligned
→ recording può proseguire

nuovo contesto pending
→ recording → pending
→ nuova generazione di buffering
→ nuova conferma necessaria

nuovo contesto mismatch
→ stato terminale mismatch
```

Se il bootstrap fallisce:

```txt
phase
→ pending

error
→ Bootstrap persistence failed
```

Non esiste rollback cross-source automatico. Il gate non ritenta automaticamente lo stesso bootstrap nella stessa `bufferGeneration`; un cambio di contesto incrementa la generazione e consente un nuovo tentativo deterministico. La conferma manuale fallita ripristina uno stato pending ritentabile.

### POST senza gate live

Se non esiste un gate live, il POST di conferma viene rifiutato con `409 confirmation_session_changed`. Una confirmation persistita resta disponibile per lettura o revoca diagnostica, ma non può autorizzare il bootstrap né portare una nuova sessione in `recording`.

Gli errori di input/contesto usano status `400`, `409` o `422`. Failure di store, bootstrap e persistenza sono mappate su `500` con code bounded come `confirmation_persistence_failed` e `confirmation_bootstrap_failed`, senza error message raw.

## Mismatch e cleanup

In caso di mismatch:

```txt
campione causale non persistito
→ callback onMismatch
→ stop dei tracker live
→ preservazione del gate mismatch dell’evento
→ terminazione scoped e bounded del ruolo betfair_tracking nel process registry
→ eventuale escalation sul solo PID registrato se l'uscita non è confermata
→ Chrome e CDP lasciati aperti
```

Il mismatch non deve:

* cancellare timeline o history esistenti;
* cancellare cache;
* cancellare conferme manuali;
* terminare Chrome;
* terminare processi Python esterni al progetto.

La terminazione preserva anche il ruolo `betfair_login`; Chrome e CDP non sono owned dal cleanup del tracking.

Stop manuale, untrack e nuovo start puliscono i gate nel proprio scope. Il gate mismatch viene preservato soltanto nel percorso di mismatch per permettere la lettura dello status terminale.

## Status endpoint

Il frontend legge lo stato live tramite:

```txt
GET /api/match/:eventId/source-identity-status
```

Risposte principali:

| Condizione                    |  HTTP | Risultato                     |
| ----------------------------- | ----: | ----------------------------- |
| Event ID assente o non valido | `400` | Errore di input               |
| Nessuna sessione gate attiva  | `404` | Nessun gate disponibile       |
| Gate disponibile              | `200` | Stato serializzabile e sicuro |

Il payload di successo contiene:

```txt
ok
eventId
active
phase
persistence
sourceIdentity
updatedAt
error opzionale
```

`sourceIdentity`, quando presente, espone soltanto:

```txt
status
sofaPlayers
betfairRunners
reasons
```

Non deve esporre URL, `marketId`, `selectionId`, payload raw, token, cookie, stack trace o path locali.

`active` è `false` nel mismatch; `persistence` vale `blocked`.

## Frontend e confini

Il frontend consuma lo status backend ma non deve ricostruire logica identitaria.

Non deve:

* dedurre Source Identity dallo snapshot Evidence;
* dedurre mismatch dai link;
* dedurre mapping dai nomi;
* ricostruire epoch o contesto mercato;
* accedere al confirmation store;
* modificare timeline o history;
* esporre dati sensibili del runtime.

La conferma manuale usa:

```txt
POST /api/evidence/:eventId/source-identity/confirm
```

Il POST è valido soltanto per un pending reale comunicato dal backend.

Il dettaglio del rendering di waiting, pending, modali, toast e ritorno al form appartiene ai documenti frontend.

## Verifica

Dalla cartella `backend/src`:

```txt
node --check sofa/matchEvidence/sourceIdentity/builder.js
node --check sofa/matchEvidence/sourceIdentity/nameMatching.js
node --check sofa/matchEvidence/sourceIdentity/nameProfile.js
node --check sofa/matchEvidence/sourceIdentity/surnameMatching.js
node --check sofa/matchEvidence/sourceIdentity/apostropheMatching.js
node --check sofa/matchEvidence/sourceIdentity/givenNameMatching.js
node --check sofa/matchEvidence/sourceIdentity/runnerNameMatching.js
node --check sofa/sourceIdentityGate.js
node --check sofa/sourceIdentityGate/sampleValidation.js
node --check sofa/sourceIdentityGate/sessionFactory.js
node --check sofa/sourceIdentityGate/store.js
node --check sofa/sourceIdentityGate/status.js
node --check sofa/sourceIdentityGate/evaluator.js
node --check sofa/sourceIdentityGate/manualConfirmation.js

node sofa/matchEvidence/sourceIdentity/nameNormalization.test.mjs
node sofa/matchEvidence/sourceIdentity/identityClassification.test.mjs
node sofa/matchEvidence/sourceIdentity/ambiguityAndConfirmation.test.mjs
node sofa/matchEvidence/sourceIdentity/marketEpoch.test.mjs
node sofa/sourceIdentityGate/lifecycle.test.mjs
node sofa/sourceIdentityGate/epochRecovery.test.mjs
node sofa/sourceIdentityGate/bootstrapFailures.test.mjs
node sofa/sourceIdentityGate/mismatchAndIsolation.test.mjs
node routes/match/sourceIdentityStatusResponse.test.mjs

node sofa/matchEvidence/latestMatchEvidence/manualConfirmation.test.mjs
node sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
```

La suite deve verificare almeno:

```txt
runner compatibile + runner estraneo
→ mismatch
→ persistence blocked
→ nessun bootstrap

ambiguità reale senza runner estranei
→ pending

conferma manuale applicabile
→ recording e bootstrap unico

nuovo contesto pending
→ nuova generazione
→ nuova conferma richiesta

bootstrap fallito
→ pending senza retry automatico

status route
→ 400 input invalido
→ 404 gate assente
→ mismatch active:false e persistence:blocked

input
→ immutabili
```

La matrice automatica copre stesso `eventId` con tracking session diversa, callback SofaScore e Betfair stale, gate assente fail-closed, Sofa-only not-applicable, conferma stale o senza gate, failure di store e bootstrap e recovery dopo cambio contesto. I risultati live storici appartengono alla validation collegata e non costituiscono automaticamente un PASS del checkpoint corrente.

## Documenti collegati

* [Match Evidence Snapshot](./01-match-evidence-snapshot.md)
* [Validità tecnica campioni Betfair](../betfair/02-technical-sample-validity.md)
* [Sessione e shell frontend](../frontend/01-session-shell.md)
* [Polling e view model](../frontend/02-live-polling-and-view-model.md)
* [API Match](../../api/01-match.md)
* [API Evidence](../../api/03-evidence.md)
* [Ciclo di vita dei dati](../../architecture/02-data-lifecycle.md)
* [Verifica live Source Identity](../../../validations/source-identity-live-verification.md)
