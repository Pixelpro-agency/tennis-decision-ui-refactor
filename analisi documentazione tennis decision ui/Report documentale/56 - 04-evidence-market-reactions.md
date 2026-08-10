# Report documentale — `implementazioni/audit-codice/04-evidence-market-reactions.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-056
Sequenza audit: 56/72
Documento analizzato: 04-evidence-market-reactions.md
Percorso documento: implementazioni/audit-codice/04-evidence-market-reactions.md
Percorso report: Report documentale/56 - 04-evidence-market-reactions.md
Commit repository di riferimento del blocco: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento corrente: 6df48cb4e43fd82285c199dec135595290541911
Dimensione documento: 980 righe
Tipo: modulo owner dell’audit codice — secondo audit Punto 5 Evidence/Market Reactions
Baseline dichiarata nel documento: 2959fba5bc3e0480cc3ea03f4469361cbb629ae6
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/implementazioni-proposte/04-evidence-provenance.md
implementazioni/99-decisioni-utente.md

backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/matchEvidence/alignment.js
backend/src/sofa/matchEvidence/time.js
backend/src/sofa/matchEvidence/dataQuality.js
backend/src/sofa/fieldLedReactionEvidence.js
backend/src/sofa/marketReactionEvidence.js
backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/candidates.js
backend/src/sofa/significantMarketFlow/baseline.js
backend/src/sofa/significantMarketFlow/clusters.js
backend/src/sofa/marketLedObservationEvidence/observationWindow.js
```

Sono stati inoltre coordinati, senza duplicarli:

```text
EVIDENCE-001…009
DOC-017
DOC-026
DOC-027
IMPL-018
IMPL-022
IMPL-023
IMPL-024
TEST-031…043

METHOD-EVIDENCE-001
PLAN-AUDIT-003
TASK-RECHECK-002
```

GitHub non è stato modificato.

La mappa/JSON `continuazione-048` non viene aggiornata con questo singolo report.
Il consolidamento resta previsto alla chiusura del blocco 053–057, salvo diversa istruzione dell’utente.

---

# Esito sintetico

```text
Valore tecnico del modulo:                         ALTO
Baseline dichiarata:                               PRESENTE
Analisi statica dichiarata:                        SÌ
Suite lette ma non rieseguite:                     SÌ

Evidence read-only:                                COERENTE
Gating Source Identity/persistence:                COERENTE
Active market epoch:                               COERENTE
Manual confirmation contextual:                    COERENTE nel proprio dominio
No causality:                                      COERENTE
Input immutability:                                COERENTE come test/contract letto

EVIDENCE-001…009:                                  COERENTI con Todo
DOC-026/027:                                       COERENTI
TEST-031…043:                                      ANCORA MANCANTI
IMPL-022:                                          APPROVATA / struttura assente
IMPL-023:                                          APPROVATA / struttura assente
IMPL-024:                                          APPROVATA / struttura assente

Current code:
selectionId fallback nome:                         ancora presente
status-only eligibility filter:                    ancora assente
market totalMatched => response:                   ancora presente
marker present => field event:                     ancora presente
maxTickGapSec semantica errata:                    ancora presente
future timestamp clamp a zero:                     ancora presente
price source comparability:                        ancora assente
runner coverage globale:                           ancora parziale/booleana
baseline flow runner-specific:                     ancora assente
cluster max time gap:                              ancora assente
availability semantics uniformi:                   ancora assenti

Contraddizioni interne di stato:                   NESSUNA significativa
Drift priorità vs Todo:                            NESSUNO significativo
False closure:                                     NESSUNA
Nuovo bug runtime:                                 NESSUNO
Nuovo finding documentale:                         NESSUNO
Nuove task:                                        0

Responsabilità del file:                           UNA pipeline Evidence/Reaction
Dimensione:                                        980 righe
Split:                                             NON necessario
Riscrittura completa:                              NO
Revisione mirata autonoma:                         NO
Nuovi file proposti:                               nessuno
Priorità complessiva del documento:                ALTA come record tecnico
```

Conclusione:

```text
IL PUNTO 5 È ANCORA
UN RECORD TECNICO COERENTE.

I FINDING EVIDENCE-001…009
NON SONO STATI FALSAMENTE CHIUSI.

IL CODICE CORRENTE
CONFERMA DIRETTAMENTE
LE ROOT ISSUE PRINCIPALI.

GLI OWNER IMPL-022…024
RESTANO APPROVATI
MA NON IMPLEMENTATI.

NON EMERGE UNA NUOVA
ROOT ISSUE AUTONOMA.

NON SERVE APRIRE
ALTRI CHANGE ID.

NON SERVE DIVIDERE
IL DOCUMENTO:
PROVENANCE, RUNNER IDENTITY,
ELIGIBILITY E OBSERVATION SEMANTICS
FORMANO UNA SOLA PIPELINE
DI EVIDENCE CROSS-SOURCE.
```

---

# 1. Il ruolo del documento è chiaro

Header:

```text
Parte 4 di 7
— Evidence e Market Reactions
```

Perimetro:

```text
provenance temporale
alignment
eligibility
Significant Flow
comparabilità prezzi
semantica Market Reactions.
```

Questa è una responsabilità
ampia ma tecnicamente coerente.

---

# 2. Il documento contiene un solo audit point

Esiste:

```text
Punto 5
```

con una sola baseline:

```text
2959fba5bc3e0480cc3ea03f4469361cbb629ae6
```

e un unico obiettivo:

```text
stabilire quando
un confronto cross-source
può essere presentato
come osservazione descrittiva affidabile.
```

---

# 3. Il documento dichiara correttamente il tipo di verifica

Formula:

```text
L’analisi è statica.
Le suite presenti sono state lette
ma non rieseguite.
```

Quindi non trasforma:

```text
test file presente
```

in:

```text
test eseguito / PASS.
```

Corretto.

---

# 4. La classificazione dei rilievi è esplicita

Il Punto 5 distingue:

```text
bug confermato
limite noto
miglioria utile
documentazione mancante
struttura completamente assente
nessuna azione necessaria
decisione utente richiesta.
```

Questo evita di trasformare
ogni osservazione
in un bug runtime.

---

# 5. Le decisioni richieste risultano approvate

Il documento dichiara:

```text
decisioni richieste
→ approvate integralmente dall’utente.
```

Le stesse decisioni
sono poi formalizzate
in:

```text
DEC-022
IMPL-022
IMPL-023
IMPL-024.
```

Coerente.

---

# 6. Evidence read-only — boundary corretto

Il documento dichiara
che Match Evidence:

```text
legge timeline persistite
Source Identity effective
persistence integrity
active market epoch
```

e non deve:

```text
avviare scraper
fetch live
aprire browser
eseguire recovery
scrivere journal
aggiungere tick
modificare timeline/history
cambiare live gate.
```

Il codice corrente
`buildLatestMatchEvidenceFromTimelines`
lavora su:

```text
timeline caricate
integrity read
confirmation read
builder derivati.
```

Nessuna mutazione
del runtime live
è introdotta da questo percorso.

---

# 7. Non aprire un finding su Evidence read-only

Non emerge
una route mutante
nel percorso Evidence corrente.

Il boundary resta valido.

---

# 8. Gating cross-source — contratto corrente coerente

`buildEvidenceFromTicks(...)`
calcola:

```text
crossSourceAllowed
=
Source Identity aligned
AND
no persistence conflict.
```

Se false:

```text
scopedBetfairTick → null
scopedLookbackEntries → []
scopedAllBetfairTicks → []
Market Reaction ticks → []
```

Quindi i dati Betfair
non vengono attribuiti
quando il cross-source gate
non è valido.

---

# 9. Pending e mismatch restano distinti

Il builder produce reason diverse:

```text
Source identity pending
...
Source identity mismatch
...
```

e non le converte
in un errore Storage.

Questa separazione
è corretta.

---

# 10. Persistence conflict resta distinta

Il conflict viene riconosciuto per:

```text
partial_persistence
recovery_failed.
```

e aggiunge:

```text
Persistence incomplete:
canonical cross-source evidence unavailable.
```

Coerente con il Punto 5.

---

# 11. `integrity_unknown` non è ancora implementato

Il documento dice correttamente:

```text
Quando verrà implementato
integrity_unknown del Punto 4
→ persistenceComplete:false.
```

Non afferma
che lo stato esista già
nel current runtime.

Quindi nessun overclaim.

---

# 12. Active market epoch — boundary utile

Il Punto 5
limita le osservazioni
all’epoch Betfair attivo.

`latestMatchEvidence`
usa:

```text
selectActiveBetfairMarketEpoch(...)
```

e costruisce:

```text
activeBetfairTimeline
```

con i soli tick
dell’epoch corrente.

Da preservare.

---

# 13. Gli epoch storici non devono contaminare il contesto corrente

Questo è coerente
con la finalità:

```text
Market Reactions
→ descrizione del contesto corrente.
```

Nessun finding.

---

# 14. Conferma Source Identity contestuale — claim bounded

Il documento descrive
il contesto persisted/effective
con:

```text
eventId
marketId
epochSignature
selectionId
player/runner mapping.
```

Il builder corrente
costruisce un:

```text
confirmationContext
```

dall’active epoch.

Questo non risolve
il diverso problema
della conferma live stale
da sessione precedente.

---

# 15. Non duplicare RUNTIME-010

La session safety
della conferma live
è già:

```text
RUNTIME-010
```

e appartiene
alla session authority.

Il Punto 5
si occupa del:

```text
context persisted/effective
```

non del command/session lifecycle.

---

# 16. No causalità — invariante ancora presente

Il documento richiede:

```text
causalityClaimed:false
interpretation: temporal_proximity_only.
```

Il codice corrente
Field→Market
e Market→Field
continua ad esporre
questa invariante.

---

# 17. Non trasformare Market Reactions in segnale

Il Punto 5
non autorizza:

```text
trade suggestion
fair odds
causal claim
trader intent
signal.
```

Da preservare.

---

# 18. EVIDENCE-001 — stato corrente coerente

Modulo:

```text
selectionId obbligatorio
→ implementazione mancante
→ priorità alta.
```

Todo:

```text
DEC-010 approvata
→ implementazione mancante.
```

Coerente.

---

# 19. Current code conferma EVIDENCE-001

`buildRunnerPriceChanges(...)`:

```text
if selectionId presente
→ cerca selectionId

if non trovato
e baseline selectionId è null
→ fallback name.
```

Quindi:

```text
nome
→ è ancora usato
come fallback identity temporale.
```

Il finding resta aperto.

---

# 20. Non aprire un nuovo bug runner identity

La root issue
è già:

```text
EVIDENCE-001
IMPL-024.
```

Nessun nuovo Change ID.

---

# 21. EVIDENCE-002 — stato coerente

Modulo:

```text
status-only
→ può essere riletto
come nuovo event
→ priorità critica.
```

Todo:

```text
EVIDENCE-002
→ CONFERMATO
→ IMPL-023 approvata
→ priorità critica.
```

Coerente.

---

# 22. Current Significant Flow non filtra status-only

`buildSignificantMarketFlowEvidence(...)`
itera sui tick e chiama:

```text
extractTickCandidates(tick, cfg)
```

Il candidate extractor:

```text
legge tick.data.runners
estrae flow
valida volume
```

ma non controlla:

```text
statusOnlyGraphLogin.
```

Quindi la root issue
resta reale.

---

# 23. Il problema non è mantenere il tick nella timeline

Il Punto 5
approva esplicitamente:

```text
status-only
→ timeline sì
→ health sì
→ algoritmi no.
```

Questo boundary
è corretto.

---

# 24. EVIDENCE-003 — stato coerente

Modulo:

```text
market totalMatched aumentato
→ non equivale
a runner response.
```

Todo:

```text
EVIDENCE-003
→ CONFERMATO
→ semantica da separare.
```

Coerente.

---

# 25. Current code conferma EVIDENCE-003

Field→Market:

```text
priceChangeObserved
OR
marketMatchedDelta > 0

→ marketResponseObserved:true.
```

Il secondo ramo
dimostra soltanto:

```text
attività matched generale.
```

Non:

```text
variazione del runner.
```

Finding ancora reale.

---

# 26. La decisione activity/observation è ben definita

Target:

```text
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation.
```

Questa tassonomia
è più precisa.

Da preservare.

---

# 27. EVIDENCE-004 — stato coerente

Modulo:

```text
marker persistente
→ può sembrare
nuova comparsa post-flow.
```

Todo:

```text
EVIDENCE-004
→ transition gate approvato.
```

Coerente.

---

# 28. Current code conferma EVIDENCE-004

`buildObservationWindow(...)`:

```text
for each post-source tick
→ detect markers
→ add type to set
```

poi:

```text
fieldEventObservedAfterFlow
=
relevantMarkersObserved.length > 0
OR
diff.scoreChanged.
```

Quindi:

```text
marker presente dopo
```

può bastare,
anche se era presente
già prima.

Finding ancora reale.

---

# 29. Il target transition-based è corretto

Distinguere:

```text
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource.
```

Un evento richiede
una transizione,
non sola persistenza.

---

# 30. EVIDENCE-005 — stato coerente

Modulo:

```text
maxTickGapSec
→ semantica errata

future timestamp
→ freshness zero

acquisition provenance
→ mancante.
```

Todo:

```text
EVIDENCE-005
→ CONFERMATO
→ IMPL-022 approvata.
```

Coerente.

---

# 31. Current code conferma `maxTickGapSec`

`buildAlignment(...)`:

```text
maxTickGapSec =
Math.max(sofaAge, betfairAge)
```

Quindi il nome
non misura:

```text
abs(sofaTs - betfairTs).
```

Il finding è esatto.

---

# 32. Current code conferma il future timestamp clamp

`ageSec(...)`:

```text
Math.max(
  0,
  now - timestamp
)
```

Un timestamp futuro:

```text
→ age 0.
```

Non produce
clock-skew degradation.

Finding ancora reale.

---

# 33. Una sola fonte può ancora produrre `medium`

`buildAlignment(...)`:

```text
sofaAge recente
AND
(betfairAge === null OR betfairAge <= medium)
→ alignmentQuality = medium.
```

Quindi:

```text
cross-source alignment
```

può essere etichettato
`medium`
anche senza Betfair.

Questo corrisponde
alla critica del Punto 5.

---

# 34. IMPL-022 resta correttamente assente

Owner:

```text
Classificazione:
NECESSARIA

Stato:
STRUTTURA COMPLETAMENTE ASSENTE

Priorità:
critica.
```

Non viene dichiarata
implementata.

---

# 35. EVIDENCE-006 — stato coerente

Modulo:

```text
price source
→ non preservata/comparata

baseline
→ no bounded gap.
```

Todo:

```text
EVIDENCE-006
→ CONFERMATO
→ IMPL-024 approvata.
```

Coerente.

---

# 36. Current code conferma price source loss

`resolvePrice(...)`
prova in ordine:

```text
LTP
mid book
best back
best lay
```

ma restituisce:

```text
solo numero.
```

Non restituisce:

```text
priceSource.
```

Quindi una differenza
può riflettere:

```text
source switch
```

oltre al movimento reale.

---

# 37. Current code conferma baseline unbounded

Field→Market sceglie:

```text
ultimo tick <= anchor
```

senza:

```text
max baselineGapSec.
```

Finding ancora reale.

---

# 38. IMPL-024 resta correttamente assente

Owner:

```text
STRUTTURA COMPLETAMENTE ASSENTE
Priorità alta
Decisione approvata.
```

Include:

```text
selectionId
price source
baseline gap
comparisonStatus
coverage.
```

Coerente.

---

# 39. EVIDENCE-007 — stato coerente

Modulo:

```text
un solo runner affidabile
→ può rendere vero
un boolean globale.
```

Todo:

```text
EVIDENCE-007
→ coverage esplicita approvata.
```

Coerente.

---

# 40. Current dataQuality conferma `some(...)`

Per ladder:

```text
runners.some(...)
→ ladderReliable:true
```

Per money flow:

```text
runners.some(...)
→ moneyFlowReliable:true
```

Per book:

```text
loop
→ primo runner two-sided
→ marketTradable:true.
```

Quindi:

```text
1 runner su 2
```

può produrre
un boolean globale positivo.

Finding ancora reale.

---

# 41. Il target coverage è corretto

Campi proposti:

```text
expectedRunnerCount
identifiedRunnerCount
tradableRunnerCount
reliableLadderRunnerCount
reliableFlowRunnerCount
```

con:

```text
complete
partial
none.
```

Buona semantica.

---

# 42. EVIDENCE-008 — stato coerente

Modulo:

```text
baseline flow
cluster
threshold
→ policy non sufficientemente definita.
```

Todo:

```text
EVIDENCE-008
→ limite confermato
→ policy approvata.
```

Coerente.

---

# 43. Current code conferma baseline aggregata cross-runner

Il detector costruisce:

```text
baselineEntries
```

da tutte le entry valide
precedenti al cutoff.

Poi:

```text
baselineAmounts =
baselineEntries.map(observedFlowAmount)
```

e calcola:

```text
un solo baselineMedian.
```

Non separa:

```text
selectionId.
```

Quindi il flow del runner A
può usare dati del runner B.

---

# 44. La utility median non contiene alcun grouping runner-specific

`computeRecentMedianFlow(flowAmounts)`
riceve:

```text
un array di numeri.
```

Non conosce:

```text
selectionId
runner
market.
```

La separazione
deve avvenire upstream
in una futura implementazione.

---

# 45. Current clusters non hanno max time gap

`detectClusters(...)` usa:

```text
cfg.maxClusterTicks
```

e richiede:

```text
tickIndex consecutivi.
```

Non usa:

```text
maxClusterGapSec.
```

Due tick consecutivi
ma molto distanti nel tempo
possono quindi appartenere
allo stesso cluster.

---

# 46. Current clusters possono fare fallback sul nome

Grouping:

```text
selectionId presente
→ sid:<id>

altrimenti
→ name:<runner name>.
```

Questo è contrario
al target:

```text
selectionId obbligatorio
per cluster runner-specific.
```

Finding ancora aperto.

---

# 47. Current clustering genera finestre sovrapposte

Il loop:

```text
for start = 0...
```

costruisce una finestra
per ogni posizione di partenza.

Il dedupe finale
usa:

```text
runner
selectionId
timestamp
```

e conserva
il cluster con importo maggiore
sulla stessa key.

Questo non equivale
a una policy esplicita:

```text
ogni tick assegnato
a un solo cluster.
```

La critica del Punto 5
resta valida.

---

# 48. Threshold restano euristiche

Il documento le qualifica:

```text
heuristic
provisional
versioned
not calibrated
not a signal.
```

Questa prudenza
va preservata.

---

# 49. Non introdurre calibrazione senza fixture/baseline

Il target lega:

```text
TEST-040/041
IMPL-012
IMPL-013
```

prima della calibrazione.

Coerente
con la filosofia data-first.

---

# 50. EVIDENCE-009 — stato coerente

Modulo:

```text
available
window state
observed/computed
→ semantiche non uniformi.
```

Todo:

```text
EVIDENCE-009
→ CONFERMATO
→ branch state approvato.
```

Coerente.

---

# 51. Current Market Reactions conferma top-level `available` ambiguo

`buildMarketReactionEvidence(...)`:

```text
available =
significantMarketFlow.available
OR
marketLedObservation.available
OR
fieldLedReaction.available.
```

Quindi:

```text
detector eseguito
```

può rendere
il parent available
anche senza
una osservazione qualificata.

Finding ancora reale.

---

# 52. Current Significant Flow usa `available:true` anche senza flow significativo

Se esistono tick:

```text
return {
  available: true,
  significantFlows,
  ...
}
```

anche quando:

```text
significantFlows.length === 0.
```

Il summary aggiunge:

```text
No significant flow detected.
```

Questo conferma
la semantica ambigua
descritta in EVIDENCE-009.

---

# 53. Field→Market espone `windowClosed`

Il ramo Field→Market
costruisce:

```text
windowClosed.
```

Ma il contratto uniforme:

```text
windowState
provisional
finalForWindow
```

non esiste ancora
a livello cross-branch.

---

# 54. IMPL-023 resta correttamente assente

Owner:

```text
STRUTTURA COMPLETAMENTE ASSENTE
Priorità critica
Decisione approvata.
```

Include:

```text
eligibility
branch state
status-only exclusion
activity/observation
marker transition
coverage
flow policy
cluster policy
window state.
```

Il modulo e l’owner
sono perfettamente allineati.

---

# 55. DOC-017 — correttamente non duplicato

Il Punto 5
registra soltanto:

```text
Riferimento audit a DOC-017
```

e dice:

```text
NON DUPLICARE.
```

Buona disciplina ownership.

---

# 56. DOC-026 — stato coerente

Richiede documentazione
di:

```text
acquiredAt
recordedAt
freshness
source skew
pipeline delay
future skew
baseline gap
window state.
```

Todo:

```text
DOC-026
→ CONFERMATO
→ CORREZIONE APPROVATA.
```

Coerente.

---

# 57. DOC-027 — stato coerente

Richiede distinzione:

```text
computed
input available
source event
activity
qualified observation
provisional/final.
```

Todo:

```text
DOC-027
→ CONFERMATO
→ CORREZIONE APPROVATA.
```

Coerente.

---

# 58. Le sintesi IMPL sono correttamente riferimenti audit

Il file usa:

```text
Riferimento audit a IMPL-022
Riferimento audit a IMPL-023
Riferimento audit a IMPL-024.
```

Non introduce
secondi owner.

Da preservare.

---

# 59. Le specifiche complete restano nel registro IMPL

Il file stesso dice:

```text
specifiche complete
→ 06-implementazioni-proposte.md.
```

L’owner effettivo
vive oggi nel child:

```text
implementazioni-proposte/04-evidence-provenance.md.
```

Il facade 06
continua a navigarlo.

Nessuna duplicazione owner.

---

# 60. TEST-031…043 restano mancanti

La Todo corrente
mantiene:

```text
TEST-031
...
TEST-043
→ MANCANTI.
```

Non esiste nel Punto 5
un claim di execution.

Coerente.

---

# 61. TEST-031/032 coprono eligibility/status-only

Mapping corretto:

```text
EVIDENCE-002
→ TEST-031
→ TEST-032.
```

---

# 62. TEST-033 copre selectionId

Mapping:

```text
EVIDENCE-001
IMPL-024
→ TEST-033.
```

Corretto.

---

# 63. TEST-034 copre activity vs response

Mapping:

```text
EVIDENCE-003
→ TEST-034.
```

Corretto.

---

# 64. TEST-035 copre marker transition

Mapping:

```text
EVIDENCE-004
→ TEST-035.
```

Corretto.

---

# 65. TEST-036/037 coprono price source e baseline gap

Mapping:

```text
EVIDENCE-006
→ TEST-036
→ TEST-037.
```

Corretto.

---

# 66. TEST-038 copre coverage runner

Mapping:

```text
EVIDENCE-007
→ TEST-038.
```

Corretto.

---

# 67. TEST-039 copre temporal provenance

Mapping:

```text
EVIDENCE-005
IMPL-022
→ TEST-039.
```

Corretto.

---

# 68. TEST-040/041 coprono Significant Flow

Mapping:

```text
EVIDENCE-008
→ runner-specific baseline
→ temporal clusters.
```

Corretto.

---

# 69. TEST-042/043 coprono state semantics

Mapping:

```text
EVIDENCE-009
→ availability semantics
→ window lifecycle.
```

Corretto.

---

# 70. No causality resta anche nei test/target

Il Punto 5
non usa i test
per introdurre:

```text
causal inference.
```

L’output resta:

```text
descriptive / temporal.
```

Da preservare.

---

# 71. L’ordine tecnico risultante è coerente come dependency chain

Sequenza:

```text
IMPL-018
→ IMPL-022
→ IMPL-024
→ IMPL-023
→ TEST-031…043
→ IMPL-012
→ IMPL-013.
```

È una catena logica:

```text
prima acquisition provenance
poi interpretation temporale
poi identity/comparability
poi eligibility
poi test
poi baseline/calibrazione.
```

---

# 72. L’ordine non seleziona automaticamente la prossima task

La Todo corrente
mantiene:

```text
nessuna task automaticamente selezionata.
```

Il blocco del Punto 5
è una dependency order,
non un mandato operativo.

Nessun finding.

---

# 73. IMPL-018 è ancora approvata, non completata

Todo:

```text
IMPL-018
→ APPROVATA
→ priorità alta.
```

Quindi la dependency iniziale
non è stata falsamente
considerata soddisfatta.

---

# 74. IMPL-022 è ancora approvata, non completata

Todo:

```text
IMPL-022
→ APPROVATA
→ priorità critica.
```

Coerente.

---

# 75. IMPL-023 è ancora approvata, non completata

Todo:

```text
IMPL-023
→ APPROVATA
→ priorità critica.
```

Coerente.

---

# 76. IMPL-024 è ancora approvata, non completata

Todo:

```text
IMPL-024
→ APPROVATA
→ priorità alta.
```

Coerente.

---

# 77. Non emerge metadata drift di priorità

Confronto:

```text
EVIDENCE-002
→ critical in modulo
→ critical in Todo

IMPL-022
→ critical owner/Todo

IMPL-023
→ critical owner/Todo

IMPL-024
→ high owner/Todo.
```

Le altre EVIDENCE
mantengono priorità compatibili
o non ripetute
nella Todo.

Nessuna divergenza
come quella trovata nel report 054.

---

# 78. Non emerge stale decision block

A differenza del report 053,
il Punto 5 non contiene:

```text
decisione già presa
→ ripresentata più avanti
come domanda aperta.
```

Le decisioni sono
coerentemente raccolte
come:

```text
Decisioni approvate.
```

---

# 79. Non emerge false implementation state

Il file non dice:

```text
EVIDENCE-001…009 fixed.
```

Dice:

```text
bug confermato
correzione approvata
policy approvata
implementazione mancante.
```

Coerente.

---

# 80. Non emerge false test state

Il file non dice:

```text
TEST-031…043 passed.
```

Dice:

```text
Test mancanti.
```

Coerente con Todo.

---

# 81. Non è necessario un supersession pointer obbligatorio

I finding del Punto 5
non risultano superati
da owner tecnici successivi.

Al contrario:

```text
il codice corrente
continua a confermarli.
```

Quindi il file
non ha bisogno
di una overlay current
per evitare una lettura falsa.

---

# 82. Gli owner IMPL correnti approfondiscono, non contraddicono

`IMPL-022`
formalizza EVIDENCE-005.

`IMPL-023`
formalizza EVIDENCE-002/003/004/007/008/009.

`IMPL-024`
formalizza EVIDENCE-001/006/007.

Il mapping è coerente.

---

# 83. Non duplicare EVIDENCE-001…009

Non creare:

```text
EVIDENCE-010
EVIDENCE-011
...
```

per descrivere
gli stessi problemi
verificati nel codice corrente.

Gli owner esistono già.

---

# 84. Non duplicare IMPL-022…024

Il report 056
non deve creare
nuove implementation cards.

Le strutture necessarie
sono già approvate.

---

# 85. Non duplicare TEST-031…043

I test mancanti
sono già registrati.

La loro assenza
non richiede nuovi TEST-ID.

---

# 86. Non trasformare EVIDENCE-008 in strategy work

Significant Flow
resta:

```text
evidence descrittiva
euristica
non calibrata
non signal.
```

Nessuna strategia
va introdotta
da questa task.

---

# 87. Non introdurre fair odds

Il Punto 5
non richiede:

```text
fair odds
EV
bet recommendation.
```

Fuori scope.

---

# 88. Non introdurre causal inference

L’ordine temporale:

```text
field → market
market → field
```

non diventa:

```text
field caused market
market caused field.
```

Da preservare.

---

# 89. Non fondere Source Identity con Evidence eligibility

Source Identity risponde:

```text
questi runner appartengono
alla stessa partita/contesto?
```

Eligibility risponde:

```text
questo tick
è tecnicamente adatto
all’algoritmo?
```

Sono contratti diversi.

Il Punto 5
li distingue correttamente.

---

# 90. Non fondere persistence integrity con market quality

Persistence risponde:

```text
posso fidarmi
della canonizzazione cross-source?
```

Graph/ladder/flow quality risponde:

```text
il contenuto
è utilizzabile per questa osservazione?
```

Il target IMPL-023
mantiene la separazione.

---

# 91. Non fondere health e algorithmic eligibility

Un tick status-only
può essere:

```text
utile per health
```

ma:

```text
non eligible
per flow/reaction.
```

Questo è uno dei contratti
più importanti del modulo.

---

# 92. Non fondere market activity e qualified observation

Aumento volume mercato:

```text
activity
```

non:

```text
qualified runner response.
```

Da preservare.

---

# 93. Non fondere marker presence e transition

Marker presente:

```text
context.
```

Marker comparso dopo source:

```text
transition.
```

Solo il secondo
può qualificare
un nuovo field event.

---

# 94. Non fondere age e source skew

```text
source age
≠
source-to-source skew.
```

Il current `maxTickGapSec`
confonde il naming.

IMPL-022
è l’owner corretto.

---

# 95. Non fondere recordedAt e acquiredAt

Il timestamp di persistenza/costruzione
non dimostra:

```text
quando la source
è stata acquisita.
```

Dipendenza corretta:

```text
IMPL-018
→ IMPL-022.
```

---

# 96. Non fondere price value e price source

```text
1.80 LTP
```

e:

```text
1.80 mid-book
```

non sono necessariamente
lo stesso tipo
di osservazione.

IMPL-024
mantiene la provenance
del prezzo.

---

# 97. Non fondere runner name e Exchange identity

Il nome può restare:

```text
display
diagnostics
Source Identity matching.
```

Ma per:

```text
same runner across Betfair ticks
```

serve:

```text
selectionId.
```

Da preservare.

---

# 98. Non fondere global boolean e full runner coverage

```text
some reliable runner
```

non equivale:

```text
both tennis runners reliable.
```

Il target coverage
è necessario.

---

# 99. Non cambiare subito le soglie Significant Flow

Prima servono:

```text
eligibility
identity
provenance
fixture
replay
baseline.
```

Il Punto 5
è correttamente conservativo.

---

# 100. Non usare il numero di tick come proxy del tempo

Il cluster corrente
lo fa implicitamente.

La policy futura
deve usare:

```text
maxClusterGapSec.
```

Già owner di EVIDENCE-008/IMPL-023.

---

# 101. Non aggiungere un nuovo journal Market Reactions come parte di questo fix

L’owner IMPL-023
considera il journal
solo come:

```text
estensione futura
derivata
material-change only.
```

Non fa parte
della prima correzione.

---

# 102. Il journal futuro non diventa canonical source

Se introdotto:

```text
timeline
→ authority

Market Reactions journal
→ derived history.
```

Da preservare.

---

# 103. Current top-level `available` conferma che FRONTEND-009/IMPL-027 dovranno adattarsi

Il backend corrente
usa ancora semantica ambigua.

Il frontend audit successivo
possiede il mapping UI.

Non aprire un nuovo frontend bug
da questo documento.

---

# 104. Non duplicare FRONTEND-009

Il Punto 5
definisce la semantica backend.

Il Punto 6/frontend
gestisce:

```text
rendering
schema mapping
unavailable UI.
```

Responsabilità separate.

---

# 105. Non duplicare DOC-026/027

Gli aggiornamenti documentali
sono già registrati
come DOC owner.

Il report 056
non apre una nuova DOC task.

---

# 106. Non duplicare METHOD-EVIDENCE-001

Il metodo generale
possiede:

```text
implemented
offline tested
live validated
provenance dimensions.
```

Il Punto 5
possiede:

```text
Evidence domain semantics.
```

Nessuna sovrapposizione
che richieda nuovo ID.

---

# 107. Non duplicare PLAN-AUDIT-003

Il Punto 5
è completato
come attività di audit,
non come implementazione.

Il file lo rende
sufficientemente evidente
tramite:

```text
analisi statica
suite non rieseguite
test mancanti
structure absent.
```

Nessun task locale.

---

# 108. Modularizzazione — analisi

Dimensione:

```text
980 righe.
```

Il numero da solo
non giustifica lo split.

Il documento ha:

```text
una baseline
un audit point
una dependency chain
un dominio cross-source unico.
```

---

# 109. Possibili sottodomini

È possibile distinguere concettualmente:

```text
A
Temporal provenance/alignment

B
Runner identity/price comparability

C
Market Reaction eligibility/semantics
```

Ma non sono indipendenti.

---

# 110. Perché i tre sottodomini sono fortemente accoppiati

Eligibility dipende da:

```text
timestamp provenance
runner identity
price comparability
runner coverage.
```

Runner comparison dipende da:

```text
anchor
baseline gap
first-post gap.
```

Significant Flow dipende da:

```text
eligibility
selectionId
provenance
cluster time.
```

Market Reaction branches dipendono da tutti.

---

# 111. Uno split ora aumenterebbe i cross-link

Separare in tre file
richiederebbe ripetere:

```text
selectionId policy
timestamp policy
eligibility policy
test matrix
dependency order.
```

Questo aumenterebbe
il rischio di drift.

---

# 112. Gli owner IMPL sono già la modularizzazione implementativa

La separazione tecnica
necessaria per l’esecuzione
esiste già:

```text
IMPL-022
IMPL-023
IMPL-024.
```

Quindi non serve
duplicare la stessa separazione
anche nel record audit.

---

# 113. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Motivo:

```text
980 righe
ma una sola pipeline Evidence
con dipendenze trasversali forti.

La modularizzazione esecutiva
esiste già nei tre owner IMPL.
```

---

# 114. Aspetti corretti da preservare integralmente

```text
1. baseline 2959fba5;
2. analysis static dichiarata;
3. test non rieseguiti dichiarato;
4. Evidence read-only;
5. SI/persistence gating;
6. active Betfair epoch;
7. contextual confirmation;
8. causalityClaimed:false;
9. temporal_proximity_only;
10. input immutability;
11. selectionId target;
12. status-only health-only;
13. activity != response;
14. marker presence != transition;
15. age != source skew;
16. future timestamps degraded;
17. acquiredAt != recordedAt;
18. price source provenance;
19. bounded baseline;
20. runner coverage;
21. runner-specific flow baseline;
22. market baseline separata;
23. cluster time gap;
24. no double-count cluster;
25. threshold provisional;
26. computed/available/observed separation;
27. window open/closed;
28. DOC-017 non duplicato;
29. DOC-026/027;
30. IMPL-022…024 come riferimenti;
31. TEST-031…043 missing;
32. no signal;
33. no fair odds;
34. no causal claim.
```

---

# 115. Finding esistenti da NON duplicare

## EVIDENCE-001…009

Sono gli owner
delle root issue
tecniche del Punto 5.

---

## IMPL-022

Possiede:

```text
temporal provenance
alignment
freshness/skew
window time policy.
```

---

## IMPL-023

Possiede:

```text
tick eligibility
branch state
activity/observation
marker transition
coverage
Significant Flow
cluster/window semantics.
```

---

## IMPL-024

Possiede:

```text
runner temporal identity
price source
comparability
baseline policy.
```

---

## DOC-026 / DOC-027

Possiedono:

```text
canonical documentation
della nuova semantica.
```

---

## TEST-031…043

Possiedono:

```text
test requirements
del Punto 5.
```

---

# 116. Nuovi finding

```text
nessuno
```

---

# 117. Nuove task runtime

```text
0
```

---

# 118. Nuove task documentali

```text
0
```

---

# 119. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: false
```

Il documento
può restare invariato
come audit record
finché non vengono
implementati gli owner IMPL
o cambia la semantica corrente.

---

# 120. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 121. Verification matrix futura — IMPL-022

```text
[ ] acquiredAt
[ ] recordedAt
[ ] sourceSkewSec
[ ] pipelineDelaySec
[ ] futureSkewSec
[ ] freshnessAgeSec
[ ] maxTickGapSec deprecato/rinominato
[ ] baselineGapSec
[ ] firstPostSourceGapSec
[ ] window state
[ ] versioned thresholds
[ ] exact reasons
[ ] TEST-039
[ ] TEST-043
```

---

# 122. Verification matrix futura — IMPL-024

```text
[ ] selectionId mandatory
[ ] no name fallback
[ ] baseline price source
[ ] latest price source
[ ] source comparability
[ ] bounded baseline
[ ] comparisonStatus
[ ] reasons
[ ] coverage
[ ] TEST-033
[ ] TEST-036
[ ] TEST-037
[ ] TEST-038
```

---

# 123. Verification matrix futura — IMPL-023

```text
[ ] status-only excluded algorithmically
[ ] degraded tick eligibility
[ ] activity != qualified observation
[ ] marker transition gate
[ ] coverage integration
[ ] runner-specific baseline
[ ] market baseline separate
[ ] maxClusterGapSec
[ ] no overlapping double count
[ ] cluster provenance
[ ] threshold version/status
[ ] branch computed/input/source/observation
[ ] window open/closed
[ ] provisional/final
[ ] no causality
[ ] TEST-031
[ ] TEST-032
[ ] TEST-034
[ ] TEST-035
[ ] TEST-038
[ ] TEST-040
[ ] TEST-041
[ ] TEST-042
[ ] TEST-043
```

---

# 124. Order dependency — interpretazione corretta

Il Punto 5 conserva:

```text
IMPL-018
→ IMPL-022
→ IMPL-024
→ IMPL-023
→ TEST-031…043
→ IMPL-012
→ IMPL-013.
```

Questa sequenza
è una dependency chain.

Non significa:

```text
prossima task automaticamente selezionata.
```

---

# 125. Current code evidence — EVIDENCE-001

```text
selectionId missing
→ fallback name
```

conferma:

```text
implementation missing.
```

---

# 126. Current code evidence — EVIDENCE-002

```text
extractTickCandidates
→ nessun check statusOnlyGraphLogin
```

conferma:

```text
eligibility assente.
```

---

# 127. Current code evidence — EVIDENCE-003

```text
marketResponseObserved
=
price change
OR
market total matched increase
```

conferma:

```text
activity/response conflation.
```

---

# 128. Current code evidence — EVIDENCE-004

```text
relevantMarkersObserved.length > 0
→ fieldEventObservedAfterFlow
```

conferma:

```text
presence/transition conflation.
```

---

# 129. Current code evidence — EVIDENCE-005

```text
maxTickGapSec
=
max(source ages)
```

e:

```text
future timestamp
→ age zero.
```

confermano
il finding.

---

# 130. Current code evidence — EVIDENCE-006

```text
resolvePrice
→ number only
```

e:

```text
baseline
→ ultimo tick <= anchor
→ no max gap.
```

confermano
il finding.

---

# 131. Current code evidence — EVIDENCE-007

```text
runners.some(...)
```

per:

```text
ladderReliable
moneyFlowReliable
```

e first tradable runner
per `marketTradable`
confermano
la coverage parziale.

---

# 132. Current code evidence — EVIDENCE-008

```text
single baselineMedian
→ all runners
```

e cluster:

```text
tick adjacency
no time gap
name fallback
overlapping windows
```

confermano
il limite.

---

# 133. Current code evidence — EVIDENCE-009

```text
parent available
=
child available OR
```

e Significant Flow:

```text
ticks present
→ available:true
anche con zero significant flow
```

confermano
la semantica ambigua.

---

# 134. Decisione finale

```text
implementazioni/audit-codice/04-evidence-market-reactions.md:

ROLE:
CORRETTO

BASELINE:
ESPLICITA

AUDIT STATICO:
ESPLICITO

SUITE NON RIESEGUITE:
ESPLICITO

EVIDENCE-001…009:
COERENTI CON TODO
E CONFERMATI DAL CODICE CORRENTE

DOC-026/027:
COERENTI

TEST-031…043:
ANCORA MANCANTI

IMPL-022:
APPROVATA
STRUTTURA ASSENTE
CRITICA

IMPL-023:
APPROVATA
STRUTTURA ASSENTE
CRITICA

IMPL-024:
APPROVATA
STRUTTURA ASSENTE
ALTA

FALSE CLOSURE:
NESSUNA

METADATA DRIFT:
NESSUNO SIGNIFICATIVO

NUOVI FINDING:
0

NUOVE TASK:
0

RISCRITTURA:
NO

MODULARIZZAZIONE:
NO

NUOVI FILE:
NO
```

---

# 135. Stato audit dopo report 056

```text
Documenti Markdown totali: 72
Analizzati: 56
Da analizzare: 16
Avanzamento: 77,78%

Blocco 053–057:
[✓] 053 implementazioni/audit-codice/01-rilievi-iniziali.md
[✓] 054 implementazioni/audit-codice/02-runtime-sessioni-betfair.md
[✓] 055 implementazioni/audit-codice/03-storage-recovery.md
[✓] 056 implementazioni/audit-codice/04-evidence-market-reactions.md
[ ] 057 implementazioni/audit-codice/05-frontend-session-shell.md
```

Nuove task non ancora consolidate:

```text
053
→ 2

054
→ 2

055
→ 0

056
→ 0

blocco 053–056
→ 4
```

Contatori provvisori:

```text
task note fino al report 052:
326

task report 053:
2

task report 054:
2

task report 055:
0

task report 056:
0

task complessive note provvisorie:
330
```

La mappa/JSON `continuazione-048`
non viene aggiornata
fino alla chiusura del blocco 053–057,
salvo diversa istruzione.

---

# 136. Prossimo documento

```text
057
implementazioni/audit-codice/05-frontend-session-shell.md
```

Non analizzato in questo report.
