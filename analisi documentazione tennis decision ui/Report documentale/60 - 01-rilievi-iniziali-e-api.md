# Report documentale — `implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-060
Sequenza audit: 60/72
Documento analizzato: 01-rilievi-iniziali-e-api.md
Percorso documento: implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
Percorso report: Report documentale/60 - 01-rilievi-iniziali-e-api.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: ee09ca5981fa22bd7df79ea2e8788f01a8fc12e7
Dimensione documento: 1073 righe
Tipo: modulo owner dell’audit documentale — rilievi iniziali B1 + checkpoint API B2
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md
implementazioni/02-audit-documentazione.md

README.md
docs/tennis-decision-ui/roadmap/01-current-state.md
docs/tennis-decision-ui/reference/01-repository-map.md
docs/tennis-decision-ui/ai/01-context-selection.md
docs/tennis-decision-ui/ai/02-documentation-conventions.md

docs/tennis-decision-ui/api/01-match.md
docs/tennis-decision-ui/api/02-betfair.md
docs/tennis-decision-ui/api/03-evidence.md
docs/tennis-decision-ui/api/04-strategy.md
docs/tennis-decision-ui/api/05-preflight.md

backend/src/routes/match.js
backend/src/routes/test.js
```

Sono stati inoltre coordinati, senza duplicarli:

```text
DOC-AUDIT-IDX-001
CURRENT-STATE-001…003
ROOT-REG-001…003
PLANNING-AUDIT-001/002
WORKFLOW-002…005
CODE-001
CODE-002
CODE-003
```

GitHub non è stato modificato.

Per mantenere il workflow concordato:

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 061: NON analizzato
```

---

# Esito sintetico

```text
Valore storico del modulo:                         ALTO
Checkpoint B1/B2:                                  CHIARO nel contenuto
Parent facade:                                     ancora non marca abbastanza lo scope storico
Owner DOC-001…013:                                 presenti e univoci
WORKFLOW-001:                                      presente e univoco

Migrazione .mdx → .md:                             COMPLETATA
Correzione canonica "non ancora eseguita":         STALE
README → index.md:                                 CORRETTO
Convenzioni → .md:                                 CORRETTE
Current State:                                     RISCRITTO come stato corrente
Evidence read-only/mutante:                        CORRETTO nel documento corrente
Betfair integrity adapter:                         NOME CORRETTO
Strategy legacy:                                   CLASSIFICATA DEPRECATA/ATTIVA
Preflight wording:                                 RIDOTTA al controllo sintattico attuale

Finding ancora realmente attivi:
DOC-002:                                           SÌ
DOC-006:                                           SÌ
WORKFLOW-001:                                      SÌ / parzialmente migliorato
DOC-009:                                           SÌ
DOC-011:                                           SÌ

Finding documentali assorbiti o sostanzialmente risolti:
DOC-001:                                           SÌ
DOC-003:                                           SÌ
DOC-004:                                           SÌ
DOC-005:                                           SÌ
DOC-007:                                           SÌ
DOC-008:                                           SÌ
DOC-010:                                           SÌ
DOC-012:                                           SÌ lato documentazione
DOC-013:                                           SÌ lato documentazione; CODE-002 resta aperto

Current Todo:
DOC-001…013:                                       ancora tutti "CONFERMATO"
WORKFLOW-001:                                      ancora "CONFERMATO"

Problema principale:                               owner/current-state reconciliation mancante
Nuovi bug runtime:                                 0
Nuovi bug API:                                     0
Nuovi finding documentali:                         2
Nuove task:                                        2

Responsabilità nel file:                           2
Dimensione:                                        1073 righe
Split:                                             SÌ
Riscrittura completa contenuto storico:            NO
Revisione mirata:                                  SÌ
Priorità complessiva:                              ALTA
```

Conclusione:

```text
IL MODULO 060 È ANCORA UTILE
COME RECORD DEL PRIMO AUDIT DOCUMENTALE.

NON VA RISCRITTO
COME SE I FINDING ORIGINALI
FOSSERO STATI SBAGLIATI.

TUTTAVIA DOPO LA MIGRAZIONE
CANONICA MOLTI DI QUEI FINDING
SONO STATI EFFETTIVAMENTE ASSORBITI.

IL FILE NON HA RICEVUTO
UNA OVERLAY CURRENT SUFFICIENTE.

LA PROVA PIÙ EVIDENTE È:

"correzione dei documenti canonici
→ NON ANCORA ESEGUITA"

MENTRE LA TODO CORRENTE DICE:

"migrazione .mdx → .md completata"
"40 file legacy sostituiti e rimossi"
"documentazione canonica riallineata".

INOLTRE ALCUNE OWNER CARD
RESTANO "CONFERMATO"
ANCHE QUANDO IL DOCUMENTO CANONICO
CORRENTE SODDISFA IL CRITERIO
DI CHIUSURA DEL FINDING.

SERVONO DUE INTERVENTI:

1. DOC-AUDIT-P12-001
   → reconciliation storico/current;

2. DOC-AUDIT-P12-002
   → separare rilievi iniziali e API
     mantenendo il path corrente come facade.
```

---

# 1. Ruolo del modulo

Il parent facade dichiara:

```text
Rilievi iniziali e API
→ Sezioni 9–11
→ DOC-001…013
→ WORKFLOW-001.
```

Il child contiene effettivamente:

```text
§9
→ rilievi strutturali iniziali

§10
→ checklist generale

§11
→ checkpoint audit API.
```

Il mapping è corretto.

---

# 2. Il modulo conserva due checkpoint/responsabilità diverse

Prima responsabilità:

```text
orientamento
roadmap
repository map
MDX
convenzioni
context selection
README.
```

Seconda responsabilità:

```text
API Match
API Betfair
API Evidence
API Strategy
API Preflight
API Runtime Health.
```

Questa separazione
è semanticamente reale.

---

# 3. La Todo dichiara esplicitamente che B1–B6 sono checkpoint storici

Current Todo:

```text
Le checklist B1–B6
descrivono il checkpoint
dell’audit documentale.

Gli stati owner correnti
restano nei Blocchi E/F
e nei registri analitici.
```

Questa regola è fondamentale.

---

# 4. Il modulo 060 non espone lo stesso boundary in testa

Il file inizia direttamente con:

```text
Audit della documentazione
Rilievi iniziali già registrati
```

ma non contiene
un banner globale equivalente a:

```text
DOC-001…013
→ finding al checkpoint B1/B2

current status
→ Todo / current canonical docs.
```

Questo aumenta il rischio
di leggere le owner card
come stato corrente assoluto.

---

# 5. Il problema è amplificato dalla migrazione completata

La Todo corrente dichiara:

```text
Migrazione .mdx → .md completata
40 file legacy sostituiti e rimossi
Documentazione canonica riallineata
Fonti duplicate consolidate e rimosse.
```

Quindi alcune azioni proposte
nel modulo 060
sono ormai state eseguite.

---

# 6. Il file chiude ancora il blocco API con uno stato pre-migrazione

Coda del documento:

```text
audit dei sei documenti API
→ COMPLETATO

correzione dei documenti canonici
→ NON ANCORA ESEGUITA
```

Questa seconda riga
non è più current.

---

# 7. Il checkpoint storico può essere preservato

La correzione non deve essere:

```text
cancellare
"NON ANCORA ESEGUITA".
```

Deve diventare:

```text
Stato al checkpoint B2:
correzione canonica non ancora eseguita

Stato successivo:
migrazione canonica completata
→ verificare per ogni DOC-ID
  se il finding è risolto,
  parziale o ancora attivo.
```

---

# 8. DOC-001 — finding originario

Root issue:

```text
roadmap troppo vicina
alla cronologia task.
```

Criterio:

```text
roadmap leggibile
come stato corrente
senza diario operativo.
```

---

# 9. Current State corrente soddisfa sostanzialmente DOC-001

Il documento corrente:

```text
# Stato corrente del progetto
```

dichiara:

```text
fotografa ciò che esiste oggi
distingue base implementata
limiti correnti
validazioni storiche
componenti deprecati.
```

Non organizza più il documento
attorno a:

```text
Task 1A
Task 1B
Task 2A–2F
Task 6
...
```

Quindi la root issue
di DOC-001
è stata sostanzialmente assorbita.

---

# 10. L’eventuale stale archive pointer del Current State è un’altra issue

Il Current State corrente
ha una diversa anomalia archive
già posseduta da:

```text
CURRENT-STATE-002
ROOT-REG-001
PLANNING-AUDIT-002.
```

Non riaprire DOC-001
per quel problema.

---

# 11. DOC-001 current outcome proposto

```text
Stato al checkpoint:
CONFERMATO

Stato corrente:
RISOLTO/ASSORBITO
DALLA RISCRITTURA CANONICA
```

La dicitura esatta
va armonizzata
con lo schema dei registri.

---

# 12. DOC-002 — repository map troppo estesa

Current repository map
è stata migliorata:

```text
non elenca package-lock root
non presenta se stessa
come manuale completo.
```

Ma resta molto dettagliata.

---

# 13. DOC-002 resta sostanzialmente attivo

La repository map corrente
contiene ancora:

```text
writer authority
recovery ordering
tracker drain
pending commits
writer authority sidecar
frontend hooks
validation commands
runtime rules.
```

Il finding originale diceva:

```text
la mappa deve spiegare
dove si trova una responsabilità
e quale documento la possiede
senza diventare
un secondo manuale completo.
```

Il confine non è ancora
completamente raggiunto.

---

# 14. DOC-002 non va chiuso automaticamente con la migrazione

Current outcome:

```text
CONFERMATO
parzialmente migliorato.
```

Non serve un nuovo DOC-ID.

---

# 15. DOC-003 — Evidence read-only/mutante

Finding originario:

```text
intero router
descritto come read-only
pur contenendo
POST confirm
DELETE confirm.
```

---

# 16. Current Evidence document corregge esplicitamente il confine

Tabella endpoint:

```text
GET latest
→ snapshot Evidence

POST confirm
→ conferma Source Identity

DELETE confirm
→ revoca conferma.
```

Scopo:

```text
router espone snapshot
e gestisce conferma/revoca.
```

Quindi il router
non viene più presentato
come totalmente read-only.

---

# 17. Il current Evidence document delimita correttamente la read-only claim

Formula:

```text
La lettura latest Evidence
espone integrity read-only.
```

e separatamente:

```text
router gestisce
conferma e revoca.
```

Criterio DOC-003
sostanzialmente soddisfatto.

---

# 18. DOC-003 current outcome

```text
Stato al checkpoint:
CONFERMATO

Stato corrente:
RISOLTO LATO DOCUMENTAZIONE.
```

Non implica:

```text
RUNTIME-010 chiuso.
```

Sono responsibility diverse.

---

# 19. DOC-004 — migrazione MDX strutturale

Finding:

```text
.md → non semplice rename
metadata JS da rimuovere
link da aggiornare
no duplicate canonici.
```

---

# 20. Current repository dimostra la migrazione

Todo:

```text
Migrazione .mdx → .md completata
40 file legacy sostituiti e rimossi.
```

Current canonical paths
usano:

```text
*.md
```

e i documenti verificati
non usano:

```text
export const meta.
```

DOC-004 è stato assorbito.

---

# 21. DOC-004 current outcome

```text
COMPLETATO / ASSORBITO DA IMPL-032.
```

Non lasciare soltanto:

```text
CONFERMATO.
```

---

# 22. DOC-005 — convenzioni imponevano MDX

Finding originario:

```text
02-documentation-conventions.mdx
→ prescriveva .mdx.
```

Current file:

```text
02-documentation-conventions.md
```

prescrive:

```text
01-nome-chiaro.md
02-nome-chiaro.md

nessun export const meta
nessun frontmatter predefinito.
```

Criterio soddisfatto.

---

# 23. DOC-005 current outcome

```text
COMPLETATO / ASSORBITO DALLA MIGRAZIONE.
```

---

# 24. DOC-006 — contratti owner duplicati negli orientamenti

Current repository map
continua a descrivere:

```text
writer authority
recovery
shutdown
tracker drain
storage sidecar
frontend polling ownership.
```

Questi dettagli
hanno owner più specifici.

---

# 25. DOC-006 resta attivo

La migrazione
ha migliorato la struttura,
ma non ha eliminato
tutta la duplicazione
di contratti tecnici.

Current outcome:

```text
CONFERMATO.
```

---

# 26. WORKFLOW-001 — context selection multipurpose

Il current:

```text
ai/01-context-selection.md
```

è migliorato
perché rimanda a:

```text
03-workflow-esecutivo.md
```

per il ciclo completo.

---

# 27. Ma WORKFLOW-001 non è completamente risolto

Il file corrente
contiene ancora:

```text
ruoli
gerarchia fonti
prompt requirements
fileModificati.md
report
CHAT_ESECUTORE
DESKTOP_ESECUTORE
tentativi
delivery rules.
```

Quindi resta più ampio
della sola:

```text
context selection.
```

Current outcome:

```text
CONFERMATO
parzialmente migliorato.
```

---

# 28. DOC-007 — Current State mescolava stato/storia/validazione

Il documento corrente
possiede sezioni separate:

```text
Base implementata
Limiti correnti
Componenti deprecati
Validazioni storiche
Funzioni non presenti.
```

Non usa una cronologia task
come struttura principale.

---

# 29. La presenza di una sezione “Validazioni storiche” non riapre DOC-007

Il problema originario
era la fusione indistinta.

Oggi:

```text
validazioni storiche
→ sezione esplicita
→ rimando docs/validations
→ non equivalgono
  a current PASS.
```

La separazione
è il comportamento richiesto.

---

# 30. DOC-007 current outcome

```text
RISOLTO/ASSORBITO
DALLA RISCRITTURA CURRENT STATE.
```

---

# 31. DOC-008 — README index migration

Finding originario:

```text
README
→ link index.mdx.
```

Current README:

```text
docs/tennis-decision-ui/index.md
```

e dichiara:

```text
Markdown ordinario .md.
```

Criterio soddisfatto.

---

# 32. DOC-008 current outcome

```text
COMPLETATO.
```

---

# 33. Checklist §10 è anch’essa storica

La checklist:

```text
[ ] README root
[ ] repository map
[ ] API Match
...
```

era lista:

```text
Aree da ricontrollare.
```

Oggi B1–B6 nella Todo
sono completate
come attività di audit.

---

# 34. La checklist §10 non deve apparire come backlog corrente

Aggiungere un marker:

```text
Checklist iniziale del checkpoint
— audit successivamente completato.
```

Non trasformarla
in una seconda Todo.

---

# 35. Checkpoint API B2 è ben provienziato

Il file usa:

```text
SHA b277bd9...
```

e chiarisce:

```text
test letti
≠
test eseguiti.
```

Da preservare.

---

# 36. DOC-009 — debug-last resta realmente attivo

Current code:

```text
let lastDebugData = null
```

e:

```text
router.get('/debug-last', ...)
→ buildDebugLastResponse(lastDebugData).
```

Non esiste assegnazione
a `lastDebugData`.

---

# 37. Current Match API non chiude DOC-009

Il documento corrente
dice ancora:

```text
GET /api/match/debug-last
→ Restituisce l’ultimo debug disponibile.
```

Lo marca:

```text
deprecato
```

ma non chiarisce
che current runtime
non possiede un producer.

Quindi il mismatch
resta reale.

---

# 38. CODE-003 non sostituisce DOC-009

CODE-003 possiede:

```text
rimozione endpoint approvata.
```

Finché la rimozione
non viene implementata:

```text
DOC-009
→ resta utile
per il current contract mismatch.
```

Non aprire un nuovo bug.

---

# 39. DOC-010 — adapter Betfair nome errato

Finding originario:

```text
getBetfairPersistenceIntegrity
```

non esisteva.

---

# 40. Current Betfair API usa il nome reale

Documentazione corrente:

```text
getMatchPersistenceIntegrity(eventId, 'betfair')
```

e lo identifica
come adapter read-only.

Criterio soddisfatto.

---

# 41. DOC-010 current outcome

```text
RISOLTO.
```

---

# 42. DOC-011 — API troppo estese rispetto agli owner

Il current API set
resta molto dettagliato.

Esempi Evidence:

```text
integrity aggregation
normalization rules
source fields
affectedDocuments
error semantics
internal module responsibilities.
```

Match:

```text
writer/recovery semantics
Source Identity persistence state
tracking lifecycle
test matrix.
```

Betfair:

```text
Money Flow modules
health
integrity
process boundaries.
```

---

# 43. DOC-011 resta attivo

Il criterio originale:

```text
API:
method
path
input
output
status
side effect
security
owner delegated.
```

Current API docs
continuano a ripetere
molta logica interna.

Quindi:

```text
CONFERMATO.
```

---

# 44. DOC-012 — Strategy legacy attiva

Finding originario
richiedeva descrivere:

```text
endpoint/UI attivi
strategia legacy
segnale non disponibile
Market Evidence separata.
```

---

# 45. Current Strategy API soddisfa esattamente il criterio

Current doc:

```text
## Stato
Deprecato.
```

e:

```text
router e consumer ancora presenti
rimozione approvata
non estendere API
Market Reactions preservate.
```

Descrive inoltre:

```text
strategy.available:false
decision.signal:UNAVAILABLE
marketEvidence disponibile.
```

Criterio documentale soddisfatto.

---

# 46. CODE-001 resta comunque aperto come implementazione

Rimozione Strategy:

```text
approvata
non ancora applicata.
```

Quindi:

```text
DOC-012 resolved
≠
CODE-001 completed.
```

---

# 47. DOC-012 current outcome

```text
RISOLTO LATO DOCUMENTAZIONE.
```

---

# 48. DOC-013 — Preflight overclaim

Finding originario:

```text
documento non deve promettere
validazione affidabile
finché regex permissiva resta.
```

---

# 49. Current Preflight doc usa wording bounded

Current endpoint table:

```text
Valida sintatticamente
URL e event ID Betfair.
```

Sezione Betfair:

```text
hostname compatibile
con il controllo backend Betfair.
```

Non dice:

```text
dominio Betfair autenticato/affidabile.
```

Quindi il documento
riflette il controllo attuale.

---

# 50. Il codice resta però permissivo

Current backend:

```js
const isBetfair = /betfair\.\\w+$/i.test(parsed.hostname);
```

e non limita
il protocollo in questa route.

La root tecnica
resta:

```text
CODE-002.
```

---

# 51. DOC-013 current outcome deve separare documentazione e codice

Proposta:

```text
documentary mismatch:
RISOLTO

underlying code inconsistency:
CODE-002 APERTO.
```

Non lasciare DOC-013
come unico indicatore
del bug runtime.

---

# 52. Runtime Health — nessun problema

Il checkpoint originario
non trovava discrepanze funzionali.

Nessuna evidence corrente
nel perimetro di questo report
richiede di aprire un nuovo DOC-ID.

---

# 53. Mapping current consigliato per DOC-001…013

```text
RISOLTI/ASSORBITI:
DOC-001
DOC-003
DOC-004
DOC-005
DOC-007
DOC-008
DOC-010
DOC-012

RISOLTO LATO DOC,
ROOT CODE ANCORA APERTA:
DOC-013 → CODE-002

ANCORA ATTIVI:
DOC-002
DOC-006
DOC-009
DOC-011

PARZIALMENTE MIGLIORATO,
ANCORA ATTIVO:
WORKFLOW-001
```

Questa è una proposta
di reconciliation,
non una modifica già applicata.

---

# 54. Perché DOC-002 e DOC-006 non sono duplicati da eliminare

DOC-002 possiede:

```text
scopo eccessivo
della repository map.
```

DOC-006 possiede:

```text
duplicazione di contratti
fra orientamento/architecture
e owner.
```

Sono correlati
ma distinguibili.

---

# 55. Perché DOC-001 e DOC-007 possono essere entrambi chiusi

DOC-001:

```text
roadmap troppo cronologica.
```

DOC-007:

```text
Current State univa
stato/storia/validation/roadmap.
```

Il current document
ha risolto entrambe
con una nuova struttura current-first.

---

# 56. Perché DOC-003 non deve restare aperto per Source Identity runtime bugs

DOC-003 riguarda:

```text
contratto documentale
read-only vs mutante.
```

RUNTIME-010
e session authority
sono bug diversi.

Current Evidence API
ha corretto il boundary.

---

# 57. Perché DOC-012 non deve restare aperto finché Strategy esiste

Il criterio DOC-012
non era:

```text
rimuovere Strategy.
```

Era:

```text
descriverla correttamente
come legacy attiva.
```

La rimozione
è CODE-001.

---

# 58. Perché DOC-013 può chiudersi lato documentazione prima di CODE-002

La policy documentale
richiede:

```text
documentare il comportamento reale,
anche se limitato.
```

Current Preflight doc
fa proprio questo.

La convergenza dei validator
resta CODE-002.

---

# 59. DOC-AUDIT-P12-001 — reconciliation storico/current dei finding B1/B2

**Priorità:** high  
**Tipo:** owner lifecycle / post-migration reconciliation

## Problema

Il modulo conserva
owner card nate prima
della migrazione canonica
ma non distingue uniformemente:

```text
finding storico confermato
finding ancora aperto
finding assorbito dalla migrazione
finding doc risolto con bug code ancora aperto.
```

Inoltre la coda API
dice ancora:

```text
correzione documenti canonici
→ NON ANCORA ESEGUITA.
```

## Azione

Aggiungere un banner:

```text
§9–11 = checkpoint B1/B2 storico.

Per current status
vedere Todo e documenti canonici.
```

Per gli owner interessati
registrare:

```text
stato al checkpoint
+
stato corrente.
```

Reconciliation minima proposta:

```text
DOC-001 → resolved/absorbed
DOC-003 → resolved documentation
DOC-004 → completed via migration
DOC-005 → completed via migration
DOC-007 → resolved/absorbed
DOC-008 → completed
DOC-010 → resolved
DOC-012 → resolved documentation
DOC-013 → documentation resolved; CODE-002 open

DOC-002 → remains open
DOC-006 → remains open
DOC-009 → remains open
DOC-011 → remains open
WORKFLOW-001 → remains open / partially improved.
```

Aggiornare anche:

```text
§10
→ initial checklist, audit completed

Stato blocco API
→ checkpoint correction pending
→ current canonical migration completed.
```

---

# 60. Acceptance criteria — P12-001

```text
[ ] historical checkpoint preserved
[ ] current overlay added
[ ] no historical finding deleted
[ ] DOC-001 current outcome reconciled
[ ] DOC-003 reconciled
[ ] DOC-004 reconciled
[ ] DOC-005 reconciled
[ ] DOC-007 reconciled
[ ] DOC-008 reconciled
[ ] DOC-010 reconciled
[ ] DOC-012 reconciled
[ ] DOC-013 split doc/code state
[ ] DOC-002 remains open
[ ] DOC-006 remains open
[ ] DOC-009 remains open
[ ] DOC-011 remains open
[ ] WORKFLOW-001 remains open/partial
[ ] CODE-001 untouched
[ ] CODE-002 untouched
[ ] CODE-003 untouched
[ ] CURRENT-STATE-* untouched
[ ] Todo and owner state no longer contradict semantically
```

---

# 61. Coordinamento con DOC-AUDIT-IDX-001

`DOC-AUDIT-IDX-001`
possiede:

```text
parent facade 02
che sembra indice globale
ma mappa solo audit storico B1–B6.
```

`DOC-AUDIT-P12-001`
possiede:

```text
historical/current lifecycle
dentro il child 01.
```

Non duplicati.

---

# 62. Coordinamento con WORKFLOW-005 / IMPL-032

Migrazione:

```text
completata.
```

Il nuovo finding
non riapre la migrazione.

Usa la migrazione
come evento di supersession.

---

# 63. Coordinamento con CURRENT-STATE-*

Il current-state
ha finding propri
emersi dopo la migrazione.

Questi non impediscono
di chiudere DOC-001/007
per la root issue originaria.

Non duplicare.

---

# 64. Coordinamento con CODE-001

DOC-012:

```text
classification documentation
```

CODE-001:

```text
runtime/UI removal.
```

Due lifecycle diversi.

---

# 65. Coordinamento con CODE-002

DOC-013:

```text
current wording documentation.
```

CODE-002:

```text
shared validator implementation.
```

Non aspettare necessariamente
la correzione runtime
per descrivere correttamente
il limite corrente.

---

# 66. Coordinamento con CODE-003

DOC-009:

```text
current API contract mismatch.
```

CODE-003:

```text
removal approved.
```

Finché endpoint esiste
e il doc promette "ultimo debug",
DOC-009 resta attivo.

---

# 67. Modularizzazione — dimensione

Il file ha:

```text
1073 righe.
```

La sola lunghezza
non determina lo split.

---

# 68. Esistono però due responsibility boundary reali

## A — rilievi iniziali

```text
DOC-001…008
WORKFLOW-001
checklist §10.
```

## B — audit API

```text
checkpoint SHA b277...
DOC-009…013
Runtime Health
API summary.
```

---

# 69. I contesti necessari sono diversi

Per A:

```text
README
Current State
Repository Map
AI conventions/context
architecture
migration state.
```

Per B:

```text
API docs
backend routes
frontend consumers
HTTP tests.
```

Caricare tutto insieme
non è il minimo contesto sufficiente.

---

# 70. Lo split è quindi per responsabilità, non per line count

Proposta:

```text
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
→ facade stabile
```

Child:

```text
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api/
├── 01-rilievi-iniziali.md
└── 02-api.md
```

---

# 71. Child 1

Contenuto:

```text
§9
DOC-001…008
WORKFLOW-001

§10
checklist iniziale.
```

Banner:

```text
checkpoint B1 / initial audit
current overlay in owner states.
```

---

# 72. Child 2

Contenuto:

```text
§11
checkpoint API b277...
API summary
DOC-009…013
Runtime Health
Stato blocco API.
```

Banner:

```text
checkpoint B2
tests inspected, not executed
current canonical migration overlay.
```

---

# 73. Il facade deve preservare il path corrente

Non modificare:

```text
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
```

come entrypoint.

Il parent:

```text
02-audit-documentazione.md
```

continua a puntare
allo stesso path.

---

# 74. DOC-AUDIT-P12-002 — split rilievi iniziali / API

**Priorità:** medium-high  
**Tipo:** modularization / context boundary

## Azione

Creare:

```text
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api/01-rilievi-iniziali.md
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api/02-api.md
```

e trasformare
il file esistente
in facade breve.

---

# 75. Acceptance criteria — P12-002

```text
[ ] facade path preserved
[ ] child initial findings created
[ ] child API created
[ ] all owner IDs preserved
[ ] no owner duplicated
[ ] no content lost
[ ] checkpoint b277 preserved
[ ] test-not-executed qualifier preserved
[ ] current overlay from P12-001 preserved
[ ] parent facade link remains valid
[ ] next module navigation remains valid
[ ] registry checker PASS
[ ] link checker PASS
[ ] fast PASS
[ ] git diff --check PASS
```

---

# 76. Mandatory modularization review

```text
modularization_reviewed: true
split_required: true
proposed_files:
  - implementazioni/audit-documentazione/01-rilievi-iniziali-e-api/01-rilievi-iniziali.md
  - implementazioni/audit-documentazione/01-rilievi-iniziali-e-api/02-api.md
```

Il file esistente:

```text
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
```

resta facade stabile.

---

# 77. Non creare nuovi documenti canonici

I child proposti
sono sotto:

```text
implementazioni/
```

quindi restano:

```text
registri non canonici.
```

La conta canonica
non cambia automaticamente.

---

# 78. Current canonical evidence — DOC-001/007

`roadmap/01-current-state.md`:

```text
current-first
limiti separati
historical validations separate
future absent separate.
```

Questo giustifica
la reconciliation.

---

# 79. Current canonical evidence — DOC-003

`api/03-evidence.md`:

```text
GET latest
POST confirm
DELETE confirm
```

con effetti
esplicitamente distinti.

---

# 80. Current canonical evidence — DOC-004/005

`ai/02-documentation-conventions.md`:

```text
.md
no export const meta
no frontmatter default
forbid mdx links.
```

---

# 81. Current canonical evidence — DOC-008

README:

```text
docs/tennis-decision-ui/index.md
```

e Markdown ordinario.

---

# 82. Current canonical evidence — DOC-010

Betfair API:

```text
getMatchPersistenceIntegrity(eventId, 'betfair')
```

Nome reale.

---

# 83. Current canonical evidence — DOC-012

Strategy API:

```text
Deprecato
router/consumer ancora presenti
rimozione approvata
non estendere.
```

Criterio originario soddisfatto.

---

# 84. Current canonical evidence — DOC-013

Preflight:

```text
Valida sintatticamente
```

e:

```text
hostname compatibile
con il controllo backend.
```

Wording bounded.

---

# 85. Current code evidence — DOC-009

`match.js`:

```text
let lastDebugData = null
```

e nessuna write successiva.

Finding ancora reale.

---

# 86. Current code evidence — CODE-002

`test.js`:

```js
/betfair\.\\w+$/i
```

Finding runtime
ancora aperto.

Questo non impedisce
di riconciliare
DOC-013 lato documentazione.

---

# 87. Current canonical evidence — DOC-002/006

Repository map
continua a contenere:

```text
authority
recovery
shutdown
storage internals
frontend hooks
validation tooling.
```

Quindi non chiudere
questi finding.

---

# 88. Current canonical evidence — DOC-011

I documenti API
continuano a includere
molto dettaglio
dei moduli interni.

Non chiudere DOC-011
solo perché la migrazione
è stata completata.

---

# 89. Current canonical evidence — WORKFLOW-001

Context selection
rimanda a un workflow separato,
ma conserva ancora
molte regole esecutive.

Classificazione consigliata:

```text
PARZIALMENTE MIGLIORATO
ANCORA CONFERMATO.
```

---

# 90. Non cambiare gli ID

Vincolo:

```text
DOC-001…013
WORKFLOW-001
```

restano gli stessi.

---

# 91. Non creare nuovi DOC per gli stati risolti

Non creare:

```text
DOC-034
DOC-035...
```

per registrare
che la migrazione
ha risolto finding esistenti.

Aggiornare lifecycle
degli owner originari.

---

# 92. Non modificare i current canonical docs dentro questa task salvo necessità separata

P12-001 è prima di tutto:

```text
registry reconciliation.
```

Gli attuali documenti canonici
servono come evidence.

Se un finding ancora attivo
richiede una futura correzione,
resta nel proprio owner.

---

# 93. Non chiudere DOC-009 con la sola deprecazione

Deprecato:

```text
≠
contratto corretto.
```

Finché il doc dice
“ultimo debug disponibile”
e il producer non esiste:

```text
finding open.
```

---

# 94. Non chiudere DOC-011 solo perché l’API è accurata

Accuratezza:

```text
≠
ownership documentale corretta.
```

La root issue
è duplicazione e scope.

---

# 95. Non chiudere WORKFLOW-001 solo perché esiste 03-workflow-esecutivo.md

Il current context selection
resta ancora
multi-purpose.

Serve una verifica
specifica prima
di promotion.

---

# 96. Non riaprire DOC-004/005/008

La migrazione canonica
ha realmente eseguito
il lavoro strutturale.

Questi ID
devono essere reconciliati,
non rilanciati come task.

---

# 97. Non riaprire DOC-010

Il simbolo reale
è già nel documento Betfair.

---

# 98. Non riaprire DOC-012 per la Strategy ancora presente

La presenza è prevista
dal documento corretto.

Rimozione:

```text
CODE-001.
```

---

# 99. Non riaprire DOC-013 come bug code

Il mismatch validator
è:

```text
CODE-002.
```

DOC-013 deve tracciare
soltanto l’accuratezza documentale.

---

# 100. Nuovi finding

```text
DOC-AUDIT-P12-001
DOC-AUDIT-P12-002
```

---

# 101. Nuove task runtime

```text
0
```

---

# 102. Nuove task documentali

```text
2
```

---

# 103. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

Il contenuto storico
deve essere preservato.

---

# 104. Decisione finale

```text
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md:

ROLE:
UTILE MA TEMPORALMENTE NON RIALLINEATO

DIMENSIONE:
1073 RIGHE

CHECKPOINT:
B1 + B2

CURRENT MIGRATION:
COMPLETATA

CODA "CORREZIONE NON ESEGUITA":
STALE

OWNER ASSORBITI/RISOLTI:
DOC-001
DOC-003
DOC-004
DOC-005
DOC-007
DOC-008
DOC-010
DOC-012

DOC-013:
DOCUMENTAZIONE SOSTANZIALMENTE RISOLTA
CODE-002 RESTA APERTO

OWNER ANCORA ATTIVI:
DOC-002
DOC-006
DOC-009
DOC-011
WORKFLOW-001

NUOVI BUG RUNTIME:
0

NUOVI BUG API:
0

NUOVI FINDING:
2

CHANGE ID:
DOC-AUDIT-P12-001
DOC-AUDIT-P12-002

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ

MODULARIZZAZIONE:
SÌ
```

---

# 105. Stato audit dopo report 060

```text
Documenti Markdown totali: 72
Analizzati: 60
Da analizzare: 12
Avanzamento: 83,33%
```

Sequenza corrente:

```text
[✓] 058 implementazioni/audit-codice/06-validazione-e-test.md
[✓] 059 implementazioni/audit-codice/07-post-audit-e-migrazione.md
[✓] 060 implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
[ ] 061 implementazioni/audit-documentazione/02-moduli-frontend-python.md
```

Nuove task non ancora consolidate:

```text
058 → 1
059 → 1
060 → 2

totale non consolidato:
4
```

Contatori:

```text
task note consolidate fino al report 057:
330

report 058:
+1

report 059:
+1

report 060:
+2

task complessive note provvisorie:
334
```

---

# 106. Stato mappa / JSON

```text
mappa-file-markdown-repository-continuazione-048.md
→ NON MODIFICATA

modifiche-audit-markdown-continuazione-048.json
→ NON MODIFICATO
```

Change ID non ancora consolidati:

```text
AUDIT-CODE-P7-001
AUDIT-CODE-POST-001
DOC-AUDIT-P12-001
DOC-AUDIT-P12-002
```

---

# 107. Prossimo documento — NON ANALIZZATO

```text
061
implementazioni/audit-documentazione/02-moduli-frontend-python.md
```

In questa esecuzione:

```text
NON aperto
NON analizzato
NON anticipato.
```

---

# 108. Stop operativo

```text
report 060:
COMPLETATO

nuovi Change ID:
DOC-AUDIT-P12-001
DOC-AUDIT-P12-002

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 061:
NON ANALIZZATO
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `DOC-AUDIT-P12-001`.
- Task ancora aperte: `DOC-AUDIT-P12-002`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
