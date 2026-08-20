# Tennis Decision UI — Validazione, fixture e test harness

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)  
> **Perimetro:** `IMPL-028…031`  
> **Parte precedente:** [Frontend, sessione live e polling](05-frontend-session-polling.md)

## 21. Modulo di validazione

Questo file è la facade stabile del modulo di validazione.

Le responsabilità owner sono separate nei tre documenti tematici:

| Documento                                                                                         | Owner                  | Responsabilità                                                           | Stato                                                           |
| ------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| [01-runner-e-result-ledger.md](06-validazione-e-fixture/01-runner-e-result-ledger.md)             | `IMPL-028`, `IMPL-031` | runner, manifest, run artifact JSON v1, result contract e ledger storico | `IMPL-028` completata; `IMPL-031` aperta con copertura parziale |
| [02-fixture-e-sandbox.md](06-validazione-e-fixture/02-fixture-e-sandbox.md)                       | `IMPL-029`             | fixture catalog, provenance, sandbox e cleanup                           | aperta                                                          |
| [03-frontend-interaction-harness.md](06-validazione-e-fixture/03-frontend-interaction-harness.md) | `IMPL-030`             | harness DOM, lifecycle e interazioni frontend                            | aperta con copertura parziale                                   |

Il path di questa facade resta stabile per la navigazione dal registro principale e dai moduli adiacenti.

### Boundary degli owner

```txt
IMPL-028
→ possiede manifest e runner canonico
→ possiede il run artifact JSON v1 necessario al runner
→ resta completata e validata localmente

IMPL-031
→ estende il result contract oltre il run artifact v1
→ possiede ledger storico, latest-result authority e semantiche mancanti
→ resta aperta
→ TEST-069 e TEST-070 restano parziali

IMPL-029
→ possiede fixture catalog e sandbox condivisa
→ resta aperta

IMPL-030
→ possiede frontend interaction harness
→ resta aperta
```

`IMPL-031` non è una hard prerequisite per l'esistenza del runner o del run artifact v1 di `IMPL-028`.

La relazione corretta è:

```txt
IMPL-028
→ runner + manifest + v1 run artifact

IMPL-031
→ estensione del result contract
→ historical/result ledger
→ latest result/reference state
→ requirement coverage semantics
```

Questa distinzione evita una dipendenza ciclica tra i due owner e preserva il closeout di `IMPL-028`.

### Riferimenti TEST

Il blocco `TEST-060…075` dell'ordine approvato resta preservato.

I child documentano i TEST-ID attribuiti esplicitamente ai rispettivi owner:

```txt
01-runner-e-result-ledger.md
→ TEST-060…064
→ TEST-068
→ TEST-069
→ TEST-070
→ TEST-073

02-fixture-e-sandbox.md
→ TEST-065…067

03-frontend-interaction-harness.md
→ TEST-044…058
→ TEST-059
→ TEST-071
```

`TEST-069` e `TEST-070` non sono chiusi: il run artifact v1 fornisce copertura parziale, ma il result ledger completo non è ancora implementato.

I riferimenti del range `TEST-060…075` non attribuiti in modo più specifico in queste card restano parte del perimetro di validazione senza essere ridefiniti artificialmente.

---

## 21.1 Estensioni condivise

Le relazioni trasversali restano centralizzate in questa facade per evitare duplicazioni nei tre child.

### Riferimento a IMPL-003 — Test map machine-checkable

Il manifest di validazione espone già campi utili alla mappa:

```txt
id
area
owner
requirementIds
command
type
profiles
timeoutSec
serialGroup
fixtures
mutatesFilesystem
liveRequired
```

Il runner applica già:

```txt
formato TEST-NNN
ownership univoca dei TEST-ID tra le entry
```

La mappa completa test ↔ owner ↔ documento non è però equivalente al solo manifest corrente.

### Riferimento a IMPL-005 — Coerenza registri

Il manifest integra due entry documentali read-only:

```txt
documentation-registry-consistency
documentation-link-check
```

Entrambe appartengono ai profili:

```txt
fast
full-offline
```

Questa integrazione resta separata dalle responsabilità specifiche dei tre child.

### Riferimento a IMPL-008 — Profilo persistence

Il profilo:

```txt
persistence
```

è riconosciuto dal manifest ma resta:

```txt
enabled: false
status: planned
```

La sua attivazione richiede una sandbox persistence dedicata e non riapre `IMPL-028`.

### Riferimento a IMPL-012 — Replay

Il replay resta un modulo dedicato.

Nel manifest corrente non esiste un profilo `replay` né una entry replay dedicata.

L'eventuale integrazione nel runner deve restare un'invocazione isolata e non incorporare il replay nel runner stesso.

### Riferimento a IMPL-013 — Profilo benchmark

Il profilo:

```txt
benchmark
```

resta:

```txt
enabled: false
status: planned
```

Non è incluso in `full-offline` e non è un gate ordinario.

### Riferimento a CODE-005 — Lint

Il frontend espone uno script lint, ma il manifest di validazione non contiene una entry lint.

La presenza dello script non equivale quindi a integrazione del lint nel runner canonico.

---

## 21.2 Ordine approvato

L'ordine di riferimento del modulo resta:

```txt
IMPL-005 esteso
→ IMPL-028 manifest e runner
→ IMPL-029 fixture e sandbox
→ IMPL-030 frontend harness
→ IMPL-003 test map
→ IMPL-031 result ledger
→ IMPL-008 persistence profile
→ IMPL-012 replay profile
→ IMPL-013 benchmark profile
→ TEST-060…075
→ eventuale CI offline
```

Questo ordine non rende `IMPL-031` prerequisito della parte già completata di `IMPL-028`.

Il run artifact v1 appartiene al closeout del runner; `IMPL-031` completa successivamente il ledger e le semantiche avanzate del risultato.

## 21.3 Invarianti del modulo

```txt
runner implementato
≠ inventario completo di tutti i test

run artifact JSON v1 implementato
≠ ledger IMPL-031 completato

metadata fixtures presente nel manifest
≠ catalogo fixture IMPL-029 implementato

test frontend puri o component-level presenti
≠ frontend interaction harness IMPL-030 completato

profilo planned
≠ profilo eseguibile

serialGroup presente
≠ scheduling concorrente implementato

requires metadata
≠ sandbox di sicurezza

JSON Schema presente
≠ validazione runtime automatica dello schema
```

La superficie eseguibile comune resta:

```txt
manifest controllato
→ preflight
→ profilo offline abilitato
→ entry abilitate
→ child process seriali
→ timeout
→ output bounded/redatto
→ risultato normalizzato
→ artifact locale opzionale
```

Restano fuori dalla superficie completata del runner:

```txt
fixture catalog condiviso
sandbox applicativa comune
frontend DOM interaction harness generale
persistence profile
benchmark profile
live profile
ledger storico degli esiti
CI di validazione
inventario completo test ↔ owner ↔ documento
```
