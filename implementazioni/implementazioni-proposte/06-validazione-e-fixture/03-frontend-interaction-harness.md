# Tennis Decision UI — Frontend interaction harness

> **Facade:** [Validazione, fixture e test harness](../06-validazione-e-fixture.md)  
> **Owner:** `IMPL-030`  
> **Parte precedente:** [Fixture e sandbox](02-fixture-e-sandbox.md)

## IMPL-030 — Frontend interaction test harness

**Classificazione:** `NECESSARIA`  
**Stato:** `CONFERMATA E APPROVATA — NON COMPLETATA — COPERTURA PARZIALE`  
**Priorità:** critica per il Punto 6

`IMPL-030` possiede il test harness frontend capace di montare componenti e hook in un ambiente DOM controllato e verificare lifecycle e interazioni asincrone.

I test frontend già presenti forniscono copertura utile, ma non chiudono questo owner.

### Copertura corrente nel runner

Il profilo `frontend` include entry per:

```txt
frontend-use-match-polling
frontend-use-betfair-json
frontend-dashboard-connections
frontend-source-identity-presentation
frontend-build
```

Le entry di test sono mirate a contratti puri o di presentazione.

La build Vite verifica la compilazione del frontend.

Questa superficie non monta un DOM e non costituisce un interaction harness generale.

### Test hook correnti

I test degli hook verificano funzioni esportate e contratti di normalizzazione/classificazione.

Per esempio, la copertura di polling può verificare:

```txt
status HTTP
normalizzazione payload
persistence integrity states
```

senza montare il lifecycle React del hook.

Questo tipo di test resta valido e non deve essere eliminato quando viene introdotto l'harness DOM.

### Test component-level già presente

Il frontend espone un test componenti basato su:

```txt
node:test
react
react-test-renderer
act()
```

con copertura di componenti reali come:

```txt
MoneyFlowChart
BetfairRunnerDepth
BetfairDepthCard
BetfairHealthDebugPanel
MarketReactionsPage
MatchContextCard
```

Questa copertura è distinta dall'harness DOM generale.

Il comando component-level non è parte del profilo canonico `frontend` finché non viene registrato esplicitamente nel manifest.

### Stack approvato

Lo stack previsto per l'interaction harness è:

```txt
Vitest
jsdom
React Testing Library
@testing-library/user-event quando necessario
fake timer Vitest
```

Questa superficie deve essere introdotta in modo minimo e locale al frontend.

La presenza di `react-test-renderer` non equivale alla presenza dello stack DOM.

### Responsabilità del harness

Il harness deve poter verificare in modo deterministico:

```txt
StrictMode
mount/unmount
cleanup/remount
fake timer
AbortController
request in flight
session switching
Stop
snapshot frozen
modale Source Identity
indicatori live
persistence UI
Market Reactions presentation
```

Non tutti questi casi devono essere concentrati in un singolo test.

Il requisito è possedere una infrastruttura comune che permetta di testarli senza browser o backend reali.

### Network

I test offline del frontend devono usare fake controllati o adapter iniettati.

Non devono chiamare:

```txt
backend locale reale
SofaScore
Betfair
internet
```

Un test che richiede fonti reali non appartiene al profilo offline dell'interaction harness.

### Time control

Il tempo deve essere controllabile esplicitamente:

```txt
fake timer
→ avanzamento esplicito
→ flush Promise controllato
→ assertion
```

Non devono essere usati sleep reali come meccanismo ordinario di sincronizzazione del test harness.

### StrictMode

Il harness deve poter montare la superficie sotto:

```txt
React.StrictMode
```

per verificare sequenze come:

```txt
mount
→ cleanup
→ remount
→ una sola catena polling effettiva
```

La verifica deve distinguere gli effetti attesi di StrictMode da duplicazioni reali del polling o delle request.

### AbortController e request in flight

Il harness deve poter rappresentare una request ancora in corso e osservare:

```txt
mount
→ request in flight
→ session switch / unmount / stop
→ abort o invalidazione controllata
→ nessun aggiornamento stale della sessione precedente
```

Questa responsabilità non può essere dimostrata soltanto con test di funzioni pure.

### Session switching

Il cambio di sessione deve essere testabile senza backend reale:

```txt
sessione A
→ polling/request A

switch a sessione B
→ cleanup A
→ stato B
→ nessuna contaminazione da response tardiva A
```

### Stop e snapshot frozen

Il harness deve poter verificare che lo stop della sessione produca il comportamento UI previsto senza continuare una catena di polling attiva.

Quando esiste uno snapshot last-known/frozen, il test deve distinguere:

```txt
dato congelato ancora visualizzabile
≠ polling ancora attivo
```

### Source Identity

Le interazioni relative alla Source Identity devono poter essere testate come comportamento UI reale, inclusi quando pertinenti:

```txt
apertura modale
contenuto dei runner
azione utente
chiusura
stato successivo
```

La classificazione backend degli stati resta fuori dall'owner `IMPL-030`.

### Persistence UI e Market Reactions

Il frontend harness deve poter verificare la presentazione degli stati di persistenza e la separazione fra:

```txt
dato disponibile
dato last-known
waiting
errore
partial_persistence
recovery_failed
```

e le superfici di Market Reactions collegate.

La causalità e la classificazione backend non vengono ridefinite dal test harness.

### Fixture frontend

Quando un contratto frontend deve essere condiviso fra più test, può usare il catalogo di `IMPL-029`.

Factory piccole e specifiche del singolo test possono restare locali.

La dipendenza utile è:

```txt
IMPL-029
→ fixture condivise e sandbox quando necessarie

IMPL-030
→ mount, lifecycle e interaction semantics
```

### TEST-ID

Il perimetro approvato include:

```txt
TEST-044…058
TEST-071
```

`TEST-071` resta aperto e rappresenta il requirement esplicito per:

```txt
frontend harness
StrictMode
fake timer
```

`TEST-059` conserva una componente manuale/visuale responsive e non viene assorbito artificialmente dall'harness DOM.

I test Node puri o component-level esistenti non trasformano `TEST-071` in PASS.

### Cosa non sostituisce

L'interaction harness non sostituisce:

```txt
build Vite
smoke browser reale
responsive visuale
collaudo live
classificazione backend degli stati
```

Il profilo frontend offline e il collaudo reale restano superfici diverse.

### Confini

`IMPL-030` non possiede:

```txt
manifest del runner
run artifact
historical result ledger
fixture catalog generale
backend state classification
browser smoke reale
live validation
```

Possiede il modo ripetibile di verificare il lifecycle e le interazioni React in ambiente controllato.

---

## Invarianti del child

```txt
pure hook test
≠ lifecycle test

react-test-renderer test
≠ DOM interaction harness completo

build Vite
≠ interaction test

fake timer
→ tempo controllato
→ nessun sleep reale ordinario

StrictMode
→ cleanup/remount verificabili

frontend offline
→ nessun backend reale
→ nessuna rete esterna

TEST-071
→ resta aperto finché l'harness non è realmente introdotto
```
