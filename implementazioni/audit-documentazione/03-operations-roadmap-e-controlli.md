## 14. Checkpoint B5 — Operations e roadmap

### Perimetro

Verificati:

```txt
operations/01-local-runtime.mdx
operations/02-live-tracking-control.mdx
operations/03-betfair-diagnostics.mdx
operations/04-validation-and-rollback.mdx
operations/05-retention-and-cleanup.mdx
operations/06-source-identity-live-verification.mdx
operations/07-betfair-live-validation.mdx

roadmap/01-current-state.mdx
roadmap/02-replay-and-backtesting.mdx
roadmap/03-market-reactions-journal.mdx
```

Confrontati con launcher, server, tracking, process registry, commit journal, cleanup runtime, test cleanup e rilievi frontend/Python di B4.

I test sono stati letti ma non eseguiti.

## Esito sintetico

| Documento | Esito |
| --- | --- |
| Runtime locale | Coerente, ma troppo vicino a un documento architetturale |
| Controllo tracking | Runbook coerente |
| Diagnostica Betfair | Sequenza utile; hardening pubblico descritto troppo forte |
| Validation e rollback | Documento monolitico e duplicato |
| Retention e cleanup | Allow-list corretta; path e offline check da correggere |
| Source Identity live | Checklist e risultati storici mescolati |
| Betfair live validation | Report storico trasparente, da archiviare |
| Current State | Non più affidabile |
| Replay/backtesting | `FUTURA`, non implementata |
| Market Reactions Journal | `FUTURA`, non implementata |

---

## DOC-020 — Percorso journal documentato senza punto iniziale

**Stato:** `CONFERMATO`
**Priorità:** alta documentale

Il codice usa:

```txt
backend/match_history/.pending_commits/
```

Retention e Current State usano anche:

```txt
backend/match_history/pending_commits/
```

Validation/rollback usa invece la forma corretta.

Un operatore può cercare il journal nella directory sbagliata, costruire backup incompleti o credere che non esistano commit pending.

Correzione: usare ovunque il percorso con `.pending_commits`.

---

## DOC-021 — Validation/rollback e runbook troppo estesi

**Stato:** `CONFERMATO`
**Priorità:** alta

`operations/04-validation-and-rollback.mdx` contiene metodo generale, matrici test, collaudi storici, contratti di modulo, smoke test, validazione live e rollback.

La stessa informazione vive quindi nei documenti owner, nei runbook, nel Current State e nei report live.

Esempio:

```txt
node --check backend/src/sofa/matchHistory/commitJournal.js
```

controlla ormai una facade di re-export, mentre la logica reale vive sotto `commitJournal/`.

Struttura proposta:

```txt
operations/validation-method.md
→ metodo generale e rollback

reference/test-matrix.md
→ test canonici per modulo
→ idealmente verificato automaticamente

documenti owner
→ test più vicini

archive/validations/
→ collaudi e output storici
```

---

## DOC-022 — Current State non aggiornato rispetto a B4

**Stato:** `CONFERMATO`
**Priorità:** alta

Il Current State dichiara completa la pipeline frontend di integrity e la degradazione UI.

B4 ha verificato:

```txt
useMatchPolling conserva integrity
→ App la scarta

useBetfairJson conserva integrity
→ App la scarta

useDashboardViewModel non riceve integrity

BetfairDepthCard non riceve persistence state

useMarketReactionEvidence conserva solo marketReactionEvidence
```

Dichiara inoltre l’hardening diagnostico sostanzialmente completo, mentre B4 ha registrato:

```txt
SECURITY-001
SECURITY-002
SECURITY-003
PYTHON-001
```

La lista delle priorità non include i difetti B4 né `CLEANUP-002`.

Il nuovo Current State deve derivare dai registri e distinguere implementato/verificato, implementato con limiti, bug, validazioni aperte, decisioni e futuro.

---

## DOC-023 — Collaudi storici mescolati ai runbook

**Stato:** `CONFERMATO`
**Priorità:** media-alta

Nei runbook sono mescolati:

```txt
collaudo 9A-R2B
collaudo 9B
osservazioni Source Identity
validazione Betfair 2026-07-04
sequenze Stop/login
note TopBar
```

`operations/07-betfair-live-validation.mdx` è un report storico.

`operations/06-source-identity-live-verification.mdx` combina procedura aperta, risultati osservati e note UX.

Struttura proposta:

```txt
operations/source-identity-live-check.md
→ procedura corrente

archive/validations/<data>-<tema>.md
→ data
→ SHA
→ ambiente
→ passi
→ risultati
→ limiti
→ artefatti
```

Questo rafforza `IMPL-004`.

---

## Runbook da preservare

Il controllo tracking distingue correttamente gate live, Stop globale, `scope=tracking` e shutdown completo.

La diagnostica Betfair separa correttamente health, freshness, integrity, Graph auth, runtime error e Money Flow. Va corretta la garanzia forte sulle superfici pubbliche collegandola ai rilievi B4.

Il report Betfair del 2026-07-04 dichiara chiaramente casi osservati, casi non osservati, riuso dell’eventId, assenza del payload post-fix e assenza del test automatico `status-only`.

---

## Roadmap future

### Replay e backtesting

Classificazione:

```txt
FUTURA
NON IMPLEMENTATA
```

Principi validi: timeline canoniche, nessun fetch live, nessun browser, niente informazione futura, epoch al cursore, versione algoritmo e Source Identity storica esplicita.

### Market Reactions Journal

Classificazione:

```txt
FUTURA
NON IMPLEMENTATA
```

Principi validi: nessuna copia completa a ogni polling, dedupe stabile, update materiale, `causalityClaimed:false`, route lazy/read-only e timeline immutate.

Entrambi devono restare fuori dal contesto predefinito che descrive il sistema corrente.

---

## Esito B5

```txt
operations e roadmap verificate
→ path journal errato confermato
→ Current State da riscrivere
→ validation matrix da separare
→ collaudi da archiviare
→ future roadmap correttamente classificate
→ nessuna modifica a docs/ o codice
```

Prossima fase:

```txt
B6 — Controlli trasversali
```

---

## 15. Checkpoint B6 — controlli trasversali e chiusura dell’audit

### 15.1 Perimetro

Controlli eseguiti:

```txt
indice canonico e target
→ riferimenti fra owner
→ percorsi filesystem citati
→ test citati
→ materiale legacy
→ futuro vs corrente
→ coerenza Todo/registri
→ classificazione delle implementazioni di supporto
```

Baseline:

```txt
SHA verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

### 15.2 Link e navigazione

Tutti i target elencati direttamente in `docs/tennis-decision-ui/index.mdx` sono stati aperti durante i blocchi B1–B5.

Esito:

```txt
nessun link rotto confermato nell’indice canonico
```

Questo non equivale a una scansione completa di tutti i link interni.

Restano aperti link fra singoli documenti, anchor, materiali legacy e collegamenti che cambieranno durante la conversione `.mdx` → `.md`.

Conclusione:

```txt
IMPL-001
→ necessario prima della migrazione documentale
```

Il README root collega ancora `index.mdx`; è corretto nello stato corrente e dovrà cambiare insieme alla migrazione.

### 15.3 Materiale legacy

L’indice dichiara esplicitamente non canonici:

```txt
chapters/
sections/
```

Non è emersa una ragione per usarli come fonte dello stato corrente.

Regola:

```txt
non eliminarli durante l’audit
→ verificare consumer e contenuti durante la migrazione
→ archiviare o rimuovere solo dopo link check e manifest
```

I documenti Replay e Market Reactions Journal sono invece proposte future esplicite, non implementazioni abbandonate.

---

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

## 15.4 Test e validazioni

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

## 15.5 Classificazione finale delle correzioni documentali

### Correzioni documentali indipendenti dal codice

```txt
DOC-002
DOC-004
DOC-005
DOC-006
DOC-008
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

---

## 15.6 Struttura documentale risultante

```txt
index e current state sintetico

architecture
→ confini e flussi trasversali

api
→ contratto HTTP

modules
→ owner del comportamento

operations
→ procedure correnti

reference
→ mappe e matrice test

archive/validations
→ prove storiche

roadmap
→ soltanto futuro esplicito
```

Ogni regola dettagliata deve avere un solo owner.

---

## 15.7 Esito B6

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

---
