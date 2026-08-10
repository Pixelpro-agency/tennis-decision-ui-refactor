# Report documentale — `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-064
Sequenza audit: 64/72
Documento: implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
HEAD verificato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Blob SHA: a3b1f55ad3a2fc7c12cddda1b7618e7b161afcd6
Dimensione: 1132 righe
Perimetro: IMPL-001…015
Baseline storica principale: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Stato report: completato
```

Confronti principali:

```text
todo-list-tennis-decision-ui.md
scripts/check_documentation_links.py
scripts/check_registry_consistency.py
scripts/validation/test-manifest.json
scripts/cleanup_runtime_cache.py
backend/src/routes/match/trackingResponses.js
backend/src/routes/betfair/oddsResponse.js
backend/src/runtime/matchHistoryWriterAuthority.js
frontend/src/App.jsx
```

GitHub non è stato modificato.

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 065: NON analizzato
```

---

# 1. Esito sintetico

```text
IMPL-001  → IMPLEMENTATA
IMPL-002  → CONSIGLIATA / aperta
IMPL-003  → NECESSARIA / aperta
IMPL-004  → COMPLETATA
IMPL-005  → IMPLEMENTATA E VERIFICATA
IMPL-006  → APPROVATA / CRITICA / aperta
IMPL-007  → NECESSARIA / aperta
IMPL-008  → CONSIGLIATA / aperta
IMPL-009  → NECESSARIA / aperta
IMPL-010  → FUTURA
IMPL-011  → NECESSARIA / aperta
IMPL-012  → NECESSARIA / aperta
IMPL-013  → NECESSARIA / aperta
IMPL-014  → FUTURA / non pronta
IMPL-015  → COMPLETATA
```

Verifiche correnti:

```text
link checker:                     presente
registry checker:                 presente
writer authority:                 presente
trackingSessionId end-to-end:     assente
serializer diagnostico pubblico:  assente
persistence validation profile:   planned
benchmark profile:                planned
frontend integrity adapter:       assente
maintenance authority completa:   assente
replay offline canonico:          assente
```

Esito:

```text
nuovi bug runtime:        0
nuove implementazioni:    0
nuovi finding documento:  2
nuove task:               2
split_required:           true
```

---

# 2. Problema principale: temporal authority interna

Il file conserva più epoche nello stesso presente:

```text
B1–B6
→ classificazione iniziale

D1–D18
→ nuove strutture registrate

decisioni successive
→ alcune IMPL approvate

post-implementazione
→ alcune IMPL completate
```

Questo è utile come storico, ma manca un boundary sufficiente fra:

```text
problema originario
stato al checkpoint
decisione successiva
stato corrente
closeout implementazione
```

---

# 3. Intro globale non più current

Il file afferma:

```text
Queste voci non modificano il prodotto.
Diventano task soltanto dopo una decisione sul loro ordine.
```

Questa frase descrive il momento iniziale del registro.

Oggi alcune voci sono già:

```text
IMPL-001 → implementata
IMPL-004 → completata
IMPL-005 → implementata
IMPL-006 → approvata critica
IMPL-015 → completata
```

Quindi l’intro va marcata come descrizione storica del checkpoint.

---

# 4. IMPL-001 — drift interno certo

La card dice:

```text
Stato:
IMPLEMENTATA E VERIFICATA
```

ma subito dopo conserva:

```text
Manca però un controllo globale ripetibile...
```

Il checker oggi esiste realmente:

```text
scripts/check_documentation_links.py
```

e implementa un controllo read-only su Markdown/MDX, target e anchor.

Quindi:

```text
"Manca..."
→ problema originario

NON:
→ stato corrente
```

IMPL-001 non va riaperta.

---

# 5. IMPL-002 — stato coerente

```text
Classificazione:
CONSIGLIATA

Stato:
CONFERMATO
```

Todo:

```text
CONSIGLIATA
```

Nessun false-complete.

---

# 6. IMPL-003 — ancora aperta

La matrice test completa non esiste ancora.

Il validation runner corrente ha un manifest reale, ma rappresenta soltanto una superficie verificata.

Quindi:

```text
runner implementato
≠
test map completa
```

IMPL-003 resta aperta.

---

# 7. IMPL-004 — completata

Il file è già coerente:

```text
IMPLEMENTATA E COMPLETATA TRAMITE DEC-013
```

La struttura reale:

```text
docs/validations/
```

esiste.

La vecchia proposta:

```text
docs/tennis-decision-ui/archive/validations/
```

è correttamente dichiarata superata.

---

# 8. IMPL-005 — completata

La card dichiara:

```text
IMPLEMENTATA E VERIFICATA
```

Il checker reale esiste:

```text
scripts/check_registry_consistency.py
```

e controlla:

```text
owner
Todo
prefissi
duplicati
contraddizioni di stato
```

Nessun drift tecnico.

---

# 9. §13.1 — ordine consigliato oggi storico

L’ordine include:

```text
IMPL-005
IMPL-003
IMPL-001
IMPL-002
IMPL-004
```

Ma:

```text
001 completed
004 completed
005 completed
```

Quindi la sezione deve essere marcata:

```text
ordine consigliato al checkpoint B6
```

e non usata come current execution queue.

---

# 10. §14 — blanket statement contraddittorio

La sezione dice:

```text
Non sono feature approvate
e non devono essere implementate automaticamente.
```

Poche righe dopo:

```text
IMPL-006
→ CONFERMATA E APPROVATA
→ priorità critica
```

Questa non è una contraddizione di decisione: sono due momenti temporali diversi.

Serve però una nota:

```text
al momento della registrazione
→ non erano automaticamente approvate

decisioni successive
→ indicate nelle singole card
```

---

# 11. IMPL-006 — ancora aperta

Il contratto approvato richiede:

```text
trackingSessionId
commandId
session authority condivisa
```

Current Start response restituisce ancora:

```text
{ ok: true, eventId }
```

e non restituisce `trackingSessionId`.

Quindi IMPL-006 resta correttamente aperta e critica.

---

# 12. IMPL-007 — ancora aperta

Richiede un serializer pubblico bounded e allow-list.

Current `/api/betfair/odds` può ancora rispondere:

```text
details:
error.message
```

Quindi il public diagnostic boundary non è chiuso.

Non creare nuovi SECURITY owner.

---

# 13. IMPL-008 — ancora aperta

Il validation manifest corrente dichiara:

```text
persistence:
enabled: false
status: planned
reason:
dipende da IMPL-008
```

Esistono test persistence/recovery, ma non il profilo/harness canonico richiesto.

Quindi IMPL-008 resta aperta.

---

# 14. IMPL-009 — ancora aperta

La struttura richiede:

```text
adapter persistence unico
stati locali
stato globale
sidebar indicator
modale dettagli
```

Current `App.jsx` non destruttura ancora `integrity` dai poller Match/Betfair e non la passa al view model.

Quindi IMPL-009 resta aperta.

`DOC-018` può essere risolto lato documentazione senza chiudere IMPL-009.

---

# 15. IMPL-010 — futura

Il toolkit strategie offline resta correttamente:

```text
FUTURO
```

Non è una task live.

Non deve riusare la vecchia Strategy UI come base obbligatoria.

---

# 16. IMPL-011 — ancora aperta

La utility corrente:

```text
scripts/cleanup_runtime_cache.py
```

possiede già:

```text
dry-run
--apply
--offline-confirmed
allow-list
launcher lock existence check
port probe
recheck prima di unlink
```

Ma IMPL-011 richiede di più:

```text
maintenance lock project-owned
runtime manifest
porte effettive
identità servizi
file identity/size/mtime recheck
```

Il codice corrente usa ancora:

```text
launcher.lock existence
porte 3000/3001
```

e non realizza l’intera authority proposta.

Quindi:

```text
primitive presenti
≠
IMPL-011 completata
```

---

# 17. IMPL-012 — ancora aperta

Richiede:

```text
fixture versionate
replay offline deterministico
cursore storico
tie-breaker
no future data
Source Identity storica
Evidence/reason
```

Non esiste un replay canonico corrente.

Stato coerente.

---

# 18. IMPL-013 — ancora aperta

Il manifest corrente dichiara:

```text
benchmark:
enabled: false
status: planned
reason:
dipende da IMPL-013
```

Quindi nessuna baseline p50/p95 va dichiarata come già disponibile.

---

# 19. IMPL-014 — futura

```text
FUTURA E CONDIZIONATA
NON PRONTA
```

Dipendenze:

```text
IMPL-006
IMPL-012
IMPL-013
```

ancora aperte.

Nessuna promotion.

---

# 20. IMPL-015 — completata

Il closeout è coerente.

Current implementation:

```text
backend/src/runtime/matchHistoryWriterAuthority.js
```

possiede:

```text
project marker
instance identity
PID
process fingerprint
active/dead/unknown
fail-closed
reclaim dead owner
```

Il file registra inoltre:

```text
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
falliti: 0
```

e conserva il limite:

```text
collaudo live multi-processo
non eseguito
```

Questo boundary è corretto.

---

# 21. §14.1 — altro ordine ormai storico

La sezione “Ordine aggiornato” include ancora:

```text
IMPL-005
IMPL-001
IMPL-004
```

già completate.

Va quindi qualificata come:

```text
sequenza proposta al checkpoint D1–D18
```

Non va sostituita con una nuova Todo duplicata.

---

# 22. IMPL-BASE-001 — temporal authority

**Priorità:** HIGH

## Problema

Il registro mescola:

```text
problema originario
checkpoint
decisione
current state
closeout
```

senza una overlay uniforme.

Manifestazioni certe:

```text
IMPL-001
→ implemented
→ "Manca però..."

§13.1
→ ordine con completed items

§14 intro
→ "non approvate"

IMPL-006
→ approved critical

§14.1
→ ordine con completed items
```

## Azione

Aggiungere in testa:

```text
Il file conserva più checkpoint storici.
Le descrizioni di problema e gli ordini
valgono per il checkpoint indicato.
Lo stato corrente è quello
della singola card e della Todo.
```

Poi:

```text
IMPL-001
→ etichettare "Manca..." come problema originario

§13.1
→ ordine al checkpoint B6

§14 intro
→ stato iniziale prima delle decisioni successive

§14.1
→ sequencing storico, non backlog corrente
```

## Current summary consigliata

```text
COMPLETATE:
001
004
005
015

APERTE:
002
003
006
007
008
009
011
012
013

FUTURE:
010
014
```

## Vincoli

Non:

```text
riaprire completed IMPL
promuovere open IMPL
inventare PASS current
inventare live validation
sostituire la Todo
```

---

# 23. Modularizzazione

Il file ha:

```text
1132 righe
```

ma lo split non è motivato dalla sola lunghezza.

Esistono tre responsibility boundary reali.

---

# 24. Responsibility A — utility e controlli

Owner:

```text
IMPL-001
IMPL-002
IMPL-003
IMPL-004
IMPL-005
```

Contesto:

```text
docs
link checker
registry checker
test map
validations
```

---

# 25. Responsibility B — authority, boundary e supporto cross-layer

Owner:

```text
IMPL-006
IMPL-007
IMPL-008
IMPL-009
IMPL-011
IMPL-015
```

Contesto:

```text
session authority
diagnostic boundary
persistence/recovery harness
frontend integrity
maintenance authority
writer authority
```

---

# 26. Responsibility C — offline, replay, strategy e performance

Owner:

```text
IMPL-010
IMPL-012
IMPL-013
IMPL-014
```

Contesto:

```text
Strategy Lab
fixture/replay
dataset cross-source
performance baseline
Betfair optimization
```

---

# 27. IMPL-BASE-002 — modularizzazione

**Priorità:** MEDIUM-HIGH

Mantenere:

```text
implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
```

come facade stabile.

Creare:

```text
implementazioni/implementazioni-proposte/01-utility-e-autorita-base/
├── 01-utility-e-controlli.md
├── 02-autorita-boundary-e-supporto.md
└── 03-offline-replay-strategy-performance.md
```

### Child 1

```text
IMPL-001…005
baseline B1–B6
ordine storico §13.1
```

### Child 2

```text
IMPL-006
IMPL-007
IMPL-008
IMPL-009
IMPL-011
IMPL-015
```

### Child 3

```text
IMPL-010
IMPL-012
IMPL-013
IMPL-014
```

Il facade contiene soltanto:

```text
perimetro
current summary
checkpoint note
link ai child
previous/next navigation
```

---

# 28. Acceptance criteria — IMPL-BASE-001

```text
[ ] lifecycle banner presente
[ ] baseline b277 preservata
[ ] IMPL-001 problem statement marcato storico
[ ] IMPL-001 resta completed
[ ] IMPL-004 resta completed
[ ] IMPL-005 resta completed
[ ] IMPL-015 resta completed
[ ] §13.1 marcato historical
[ ] §14 intro non contraddice IMPL-006
[ ] §14.1 marcato historical
[ ] open IMPL non promosse
[ ] future IMPL non promosse
[ ] Todo resta authority sintetica
```

---

# 29. Acceptance criteria — IMPL-BASE-002

```text
[ ] facade path preservato
[ ] tre child creati
[ ] IMPL-001…015 presenti una sola volta
[ ] nessun owner duplicato
[ ] IMPL-009 extension preservata
[ ] IMPL-015 closeout preservato integralmente
[ ] test/commit provenance IMPL-015 preservata
[ ] next link verso 02-runtime-betfair preservato
[ ] registry checker PASS
[ ] link checker PASS
[ ] validation fast PASS
[ ] git diff --check PASS
```

---

# 30. Mandatory modularization block

```text
modularization_reviewed: true
split_required: true
proposed_files:
  - implementazioni/implementazioni-proposte/01-utility-e-autorita-base/01-utility-e-controlli.md
  - implementazioni/implementazioni-proposte/01-utility-e-autorita-base/02-autorita-boundary-e-supporto.md
  - implementazioni/implementazioni-proposte/01-utility-e-autorita-base/03-offline-replay-strategy-performance.md
```

---

# 31. Dedupe — finding da non duplicare

```text
IMPL-IDX-001
AUDIT-CODE-P7-001
AUDIT-CODE-POST-001
DOC-AUDIT-PROC-001

FRONTEND-*
SECURITY-*
CLEANUP-002
RETENTION-*
VALID-ROLL-*
METHOD-EVIDENCE-001
```

---

# 32. Non-finding importanti

```text
IMPL-002 non implementata
→ non è bug, è consigliata

IMPL-003 non chiusa dal validation runner
→ corretto

IMPL-008 con test esistenti
→ non equivale ad harness canonico

IMPL-011 con primitive cleanup
→ non equivale a maintenance authority

IMPL-013 benchmark planned
→ corretto

IMPL-014 future
→ corretto

IMPL-015 live multiprocess non eseguito
→ limite esplicito, non overclaim
```

---

# 33. Verifica tecnica futura delle sole modifiche documentali

```text
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
node scripts/validation/run.mjs fast
git diff --check
```

Non serve:

```text
tracking live
Chrome
Betfair login
scraper live
```

per il refactor del registro.

---

# 34. Decisione finale

```text
ROLE:
registro owner valido

PERIMETRO:
IMPL-001…015

PROBLEMA:
temporal authority
+
context boundary

NUOVI BUG:
0

NUOVI FINDING:
2

CHANGE ID:
IMPL-BASE-001
IMPL-BASE-002

full_rewrite_required:
false

targeted_revision_required:
true

modularization_reviewed:
true

split_required:
true
```

---

# 35. Stato audit dopo report 064

```text
Documenti Markdown totali: 72
Analizzati: 64
Da analizzare: 8
Avanzamento: 88,89%
```

Sequenza:

```text
[✓] 063 implementazioni/audit-documentazione/04-processo-e-materiali-storici.md
[✓] 064 implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
[ ] 065 implementazioni/implementazioni-proposte/02-runtime-betfair.md
```

---

# 36. Contatori task

Mappa e JSON sono consolidati fino al report 062.

```text
consolidate fino al 062: 338
063: +1
064: +2
totale provvisorio: 341
```

Non ancora consolidate:

```text
DOC-AUDIT-PROC-001
IMPL-BASE-001
IMPL-BASE-002
```

---

# 37. Stato mappa / JSON

```text
mappa-file-markdown-repository-continuazione-048.md
→ NON MODIFICATA

modifiche-audit-markdown-continuazione-048.json
→ NON MODIFICATO
```

---

# 38. Prossimo documento — non analizzato

```text
065
implementazioni/implementazioni-proposte/02-runtime-betfair.md
```

---

# 39. Stop operativo

```text
report 064: COMPLETATO
nuovi Change ID: 2
ZIP: CREATO
mappa: NON TOCCATA
JSON: NON TOCCATO
documento 065: NON ANALIZZATO
```
