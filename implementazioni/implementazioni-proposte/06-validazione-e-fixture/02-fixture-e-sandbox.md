# Tennis Decision UI — Fixture e sandbox

> **Facade:** [Validazione, fixture e test harness](../06-validazione-e-fixture.md)  
> **Owner:** `IMPL-029`  
> **Parte precedente:** [Runner e result ledger](01-runner-e-result-ledger.md)  
> **Parte successiva:** [Frontend interaction harness](03-frontend-interaction-harness.md)

## IMPL-029 — Fixture catalog e sandbox condivisa

**Classificazione:** `NECESSARIA`  
**Stato:** `CONFERMATA E APPROVATA — NON COMPLETATA`  
**Priorità:** alta

`IMPL-029` possiede la standardizzazione delle fixture condivise e della sandbox filesystem usata dalle suite che scrivono.

Non possiede il runner, il result ledger o il frontend interaction harness.

### Stato corrente

Il manifest di validazione possiede già primitive utili:

```txt
fixtures
mutatesFilesystem
serialGroup
pathChecks
```

Il preflight verifica che gli eventuali path dichiarati in `fixtures` esistano e restino all'interno della repository.

Le entry correnti del manifest usano però:

```json
"fixtures": []
```

come valore prevalente e non esiste ancora un catalogo fixture condiviso ownerizzato da `IMPL-029`.

Non esiste inoltre una sandbox applicativa comune usata uniformemente dalle suite.

### Debito già visibile

L'entry:

```txt
backend-commit-id
```

è presente nel manifest ma disabilitata.

Il motivo registrato è che il relativo test costruisce una directory sotto:

```txt
process.cwd()/virtual-commit-id-journal/...
```

senza cleanup garantito.

Questo caso rappresenta direttamente il debito coperto da `TEST-065`.

### Obiettivo

Fornire una superficie condivisa per:

```txt
catalogo fixture versionate
factory condivise quando utili
schema e provenance
sandbox temporanea
cleanup garantito
protezione delle directory runtime
```

La soluzione non deve trasformare tutte le fixture locali in fixture globali.

### Struttura proposta

```txt
test/
├── fixtures/
│   ├── sofa/
│   ├── betfair/
│   ├── evidence/
│   ├── persistence/
│   └── frontend/
├── factories/
├── manifests/
└── schemas/
```

La struttura deve essere introdotta soltanto per contratti realmente condivisi.

### Metadata fixture

Il contratto condiviso previsto comprende:

```txt
fixtureId
schemaVersion
kind
origin
redactionStatus
expectedInvariants
createdFor
```

Valori `origin` previsti:

```txt
constructed
sanitized_capture
```

Una capture sanitizzata non deve essere accettata come fixture condivisa senza verifica della redaction.

### Cosa può restare locale

Factory piccole e specifiche di un singolo modulo possono rimanere nel relativo test.

Esempi:

```txt
oggetto minimale
fake logger locale
semplice response builder
```

Il catalogo condiviso serve quando:

```txt
il contratto è riutilizzato
oppure
deve rappresentare una sequenza temporale stabile
oppure
deve essere condiviso fra più suite
```

### Sandbox condivisa

Ogni test che scrive deve poter ricevere una root temporanea dedicata:

```txt
os.tmpdir / tempfile
→ directory univoca
→ path interni derivati
→ esecuzione del test
→ cleanup garantito
```

La sandbox deve evitare che una suite offline scriva accidentalmente nelle aree runtime reali.

Il result pubblico del runner non deve esporre un path locale completo della sandbox; è sufficiente un identificatore opaco quando serve correlazione.

### Directory runtime da proteggere

Nei profili offline la sandbox deve impedire l'uso accidentale delle aree runtime reali, incluse almeno:

```txt
backend/match_history
backend/source_identity_confirmations.json
backend/betfair_cache
backend/scraper_cache
backend/betfair_network_dump
profili Chrome
launcher/.runtime reale
```

Le regole devono essere applicate dalla superficie di test/sandbox e non soltanto documentate come convenzione.

### Integrazione con il manifest

`IMPL-029` deve integrarsi con i contratti già esistenti del runner:

```txt
fixtures
mutatesFilesystem
serialGroup
pathChecks
```

Il runner non deve incorporare il catalogo fixture come mega-modulo.

La relazione resta:

```txt
manifest
→ dichiara fixture e caratteristiche della entry

fixture catalog
→ possiede dati condivisi e provenance

sandbox
→ possiede root temporanee e cleanup
```

### TEST-065…067

```txt
TEST-065
→ sandbox cleanup
→ aperto

TEST-066
→ nessun accesso alle directory runtime reali
→ aperto

TEST-067
→ fixture schema / provenance / redaction
→ aperto
```

La sola presenza del campo `fixtures` nel manifest non chiude questi requirement.

### Relazioni

```txt
IMPL-008
→ consumer della sandbox persistence/recovery

IMPL-012
→ consumer di fixture temporali e replay

IMPL-030
→ consumer di fixture frontend condivise quando necessarie

IMPL-013
→ consumer di input benchmark controllati
```

Queste relazioni condividono utility, ma non fondono i rispettivi owner in un unico harness.

### Confini

`IMPL-029` non possiede:

```txt
runner canonico
result artifact
historical result ledger
frontend DOM harness
benchmark engine
replay engine
persistence/recovery implementation
```

Possiede esclusivamente la superficie comune necessaria a rendere fixture e scritture di test ripetibili, isolate e verificabili.

---

## Invarianti del child

```txt
fixtures[] nel manifest
≠ fixture catalog completato

temp directory usata da un singolo test
≠ sandbox condivisa

factory locale semplice
≠ obbligo di migrazione nel catalogo

sanitized_capture
→ richiede redaction verificata

test offline
→ non deve toccare directory runtime reali

cleanup
→ deve essere garantito

IMPL-029
→ resta aperta finché TEST-065…067 non sono coperti
```
