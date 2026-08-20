## 15. Checkpoint B6 — controlli trasversali e chiusura dell’audit

### 15.1 Perimetro

Controlli eseguiti:

```txt
indice canonico e target
→ riferimenti fra owner
→ percorsi filesystem citati
→ test citati
→ coerenza Todo/registri
→ classificazione delle implementazioni di supporto
```

Baseline:

```txt
SHA verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

### 15.2 Link e navigazione

Tutti i target elencati direttamente nell’indice canonico del checkpoint sono stati aperti durante i blocchi B1–B5.

Esito:

```txt
nessun link rotto confermato nell’indice canonico
```

Questo non equivale a una scansione completa di tutti i link interni.

Restavano fuori dal controllo completo i link fra singoli documenti, gli anchor e i materiali legacy.

## WORKFLOW-002 — Todo e registro analitico non erano allineati

**Stato:** `COMPLETATO NEL CHECKPOINT B6`
**Priorità:** alta per il metodo

Il confronto locale dei registri B5 ha rilevato:

```txt
TEST-001
→ presente nei registri analitici
→ assente dall’intera Todo
```

Il BLOCCO E conteneva soltanto una parte dei rilievi. Mancavano, fra gli altri:

```txt
DOC-014…DOC-019
RUNTIME-002
SOFA-001
TEST-001
EVIDENCE-001
FRONTEND-001…FRONTEND-004
CLEANUP-001
SECURITY-001…SECURITY-003
PYTHON-001
TEST-002
```

Impatto:

- rischio di dimenticare rilievi durante la preparazione delle task;
- priorità incomplete;
- impossibilità di usare la Todo come vista sintetica unica.

Correzione:

```txt
BLOCCO E ricostruito
→ TEST-001 aggiunto
→ tutti gli ID analitici riportati
→ stati sintetici uniformati
```

Prevenzione:

```txt
IMPL-005
→ classificata necessaria
```

---

## WORKFLOW-003 — Prefissi usati ma non dichiarati nel metodo

**Stato:** `COMPLETATO NEL CHECKPOINT B6`
**Priorità:** media

Il metodo dichiarava i prefissi stabili, ma B4 ha introdotto:

```txt
SECURITY-
PYTHON-
```

senza aggiornare la tabella.

Correzione:

```txt
SECURITY-
→ redazione, superfici pubbliche e dati sensibili

PYTHON-
→ concorrenza e comportamento interno dei package Python
```

Gli ID esistenti non sono stati rinumerati.

---

## 15.3 Test e validazioni

L’audit distingue definitivamente:

```txt
file test presente
≠ test eseguito nel checkpoint
≠ collaudo live
≠ prova archiviata
```

Non è stato confermato un test citato con percorso sicuramente inesistente nei documenti owner analizzati.

Sono però confermati:

- `TEST-001`: manca il test dedicato al tick Betfair `status-only`;
- `TEST-002`: mancano test lifecycle per polling e cambio sessione;
- `TEST-003`: manca un inventario/test runner canonico;
- `PYTHON-001`: il percorso capture asincrono non ha una verifica deterministica completa.

Conclusione:

```txt
IMPL-003
→ necessaria
```

---

## 15.4 Classificazione finale delle correzioni documentali

### Correzioni documentali indipendenti dal codice

```txt
DOC-002
DOC-006
DOC-010
DOC-011
DOC-014
DOC-015
DOC-016
DOC-017
DOC-020
DOC-021
DOC-023
```

### Documenti che devono attendere decisioni o correzioni codice

```txt
DOC-003
→ chiarire GET/POST/DELETE mantenendo il comportamento reale

DOC-009
→ dipende da CODE-003

DOC-012
→ dipende da CODE-001

DOC-013
→ dipende da CODE-002

DOC-018
→ dipende da FRONTEND-002

DOC-019
→ dipende da SECURITY-001/002/003 e PYTHON-001

DOC-022
→ Current State dopo il primo batch di correzioni
```

### Documenti da archiviare o separare

```txt
validazioni Betfair live
collaudi launcher
osservazioni Source Identity
```

Non devono essere cancellati: vanno spostati in un archivio con data e SHA.

### Documenti futuri da preservare

```txt
Replay e backtesting
Market Reactions Journal
```

Devono restare esclusi dalla descrizione dello stato corrente.

## 15.5 Esito B6

```txt
audit documentazione B1–B6
→ completato

audit codice statico per settori
→ completato

suite test
→ non rieseguite

documentazione canonica e codice
→ non modificati

Todo e registri
→ riallineati

prossimo blocco
→ ricontrollo task dichiarate completate
```