## 14. Checkpoint B5 — Operations e roadmap

### Perimetro

Verificati:

```txt
Operations
→ runtime locale
→ controllo tracking live
→ diagnostica Betfair
→ validation e rollback
→ retention e cleanup
→ verifica live Source Identity
→ validazione live Betfair

Roadmap
→ stato corrente
→ replay e backtesting
→ Market Reactions Journal
```

Confrontati con launcher, server, tracking, process registry, commit journal, cleanup runtime, test cleanup e rilievi frontend/Python di B4.

I test sono stati letti ma non eseguiti.

## Esito sintetico

| Documento                | Esito                                                     |
| ------------------------ | --------------------------------------------------------- |
| Runtime locale           | Coerente, ma troppo vicino a un documento architetturale  |
| Controllo tracking       | Runbook coerente                                          |
| Diagnostica Betfair      | Sequenza utile; hardening pubblico descritto troppo forte |
| Validation e rollback    | Documento monolitico e duplicato                          |
| Retention e cleanup      | Allow-list corretta; path e offline check da correggere   |
| Source Identity live     | Checklist e risultati storici mescolati                   |
| Betfair live validation  | Report storico trasparente, da archiviare                 |
| Current State            | Non più affidabile                                        |
| Replay/backtesting       | `FUTURA`, non implementata                                |
| Market Reactions Journal | `FUTURA`, non implementata                                |

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

Il documento di validation e rollback del checkpoint contiene metodo generale, matrici test, collaudi storici, contratti di modulo, smoke test, validazione live e rollback.

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

Il documento di validazione live Betfair del checkpoint è un report storico.

Il documento di verifica live Source Identity del checkpoint combina procedura aperta, risultati osservati e note UX.

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

