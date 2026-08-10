# Report documentale — `implementazioni/implementazioni-proposte/04-evidence-provenance.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-067
Sequenza audit: 67/72
Documento analizzato: implementazioni/implementazioni-proposte/04-evidence-provenance.md
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
Ultimo HEAD verificato nel ciclo: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento corrente: 52a741065333c5721abeb68ca342e45be9b1e3cc
Dimensione documento: 684 righe
Perimetro dichiarato: IMPL-022…024
Tipo: registro owner — Evidence temporal provenance, Market Reactions eligibility e runner temporal identity
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md

backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/evidenceBuilder.js
backend/src/sofa/matchEvidence/alignment.js
backend/src/sofa/matchEvidence/alignmentExtension.js
backend/src/sofa/matchEvidence/time.js

backend/src/sofa/temporalAlignmentEvidence.js
backend/src/sofa/temporalAlignment/betfairMove.js
backend/src/sofa/temporalAlignment/betfairMove/candidateSelection.js
backend/src/sofa/temporalAlignment/betfairMove/primitives.js

backend/src/sofa/marketReactionEvidence.js
backend/src/sofa/significantMarketFlowEvidence.js
backend/src/sofa/significantMarketFlow/candidates.js
backend/src/sofa/marketLedObservationEvidence.js
backend/src/sofa/fieldLedReactionEvidence.js
backend/src/sofa/marketReactionEvidence.test.mjs
```

Sono stati coordinati, senza duplicarli:

```text
IMPL-012
IMPL-013
IMPL-018

EVIDENCE-001…009
VALID-ROLL-*
METHOD-EVIDENCE-001

TEST-031…043

AUDIT-CODE-P7-001
IMPL-BETFAIR-001
IMPL-STORAGE-001
IMPL-STORAGE-002
```

GitHub non è stato modificato.

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 068: NON analizzato
```

---

# 1. Esito sintetico

```text
IMPL-022:
APPROVATA
PRIORITÀ CRITICA
NON COMPLETATA
MA STRUTTURA NON È “COMPLETAMENTE ASSENTE”

IMPL-023:
APPROVATA
PRIORITÀ CRITICA
NON COMPLETATA
MA STRUTTURA NON È “COMPLETAMENTE ASSENTE”

IMPL-024:
APPROVATA
PRIORITÀ ALTA
NON COMPLETATA
MA STRUTTURA NON È “COMPLETAMENTE ASSENTE”

Todo ↔ owner approval/priority:
COERENTE

False completion:
NESSUNA

False “total absence”:
SÌ — per 022, 023 e 024

Temporal alignment legacy/current:
PRESENTE

Market Reactions legacy/current:
PRESENTE

Runner comparison legacy/current:
PRESENTE

Nuovi bug runtime:
0

Nuovi finding registry:
1

Nuove task:
1

Split:
NON necessario
```

Conclusione:

```text
IL MODULO 067
NON HA UN PROBLEMA
DI STATO “COMPLETATO”.

LE TRE IMPL
RESTANO CORRETTAMENTE APERTE.

IL PROBLEMA È PIÙ PRECISO:

TUTTE E TRE LE CARD
DICONO:

“STRUTTURA COMPLETAMENTE ASSENTE”

MA IL CODICE CORRENTE
CONTIENTE GIÀ
PRIMITIVE REALI E TESTATE.

IMPL-022
→ alignment attuale
→ age/freshness legacy
→ temporal alignment
→ reaction windows
→ warnings

IMPL-023
→ Market Reactions attuale
→ Significant Flow
→ Market→Field
→ Field→Market
→ available/dataQuality/reasons
→ causalityClaimed:false

IMPL-024
→ confronto runner già esistente
→ selectionId preferito
→ fallback nome legacy
→ price source estratta almeno in alcuni moduli
→ price delta e volume validation

I NUOVI CONTRATTI APPROVATI
RESTANO COMUNQUE MANCANTI:

022
→ acquiredAt/recordedAt/sourceSkew
→ future skew bounded
→ policy versionata
→ reason uniformi

023
→ eligibility uniforme
→ status-only gate
→ branch state uniforme
→ qualified observation
→ transition gate
→ coverage/versioning

024
→ selectionId obbligatorio
→ niente fallback nome
→ price-source comparability
→ baseline gap policy
→ runner coverage

SERVE QUINDI UNA SOLA TASK:

IMPL-EVIDENCE-001
→ registrare l’implementation coverage reale
  e sostituire “completamente assente”
  con uno stato bounded.

NESSUNA NUOVA TASK TECNICA.
NESSUNO SPLIT.
```

---

# 2. Perimetro del documento

Il file contiene:

```text
IMPL-022
Evidence temporal provenance and alignment policy

IMPL-023
Market Reaction eligibility e branch state

IMPL-024
Runner temporal identity e price comparability
```

Il range è corretto.

---

# 3. Stato Todo

La Todo corrente mantiene:

```text
IMPL-022
→ APPROVATA
→ PRIORITÀ CRITICA

IMPL-023
→ APPROVATA
→ PRIORITÀ CRITICA

IMPL-024
→ APPROVATA
→ PRIORITÀ ALTA
```

Quindi non esiste drift
fra approval/priority
owner e Todo.

---

# 4. Primo problema: il campo Stato è troppo forte

Tutte e tre le card dicono:

```text
Stato:
STRUTTURA COMPLETAMENTE ASSENTE
```

Questo non è più vero
come descrizione del codice corrente.

---

# 5. Distinzione necessaria

La formula corretta è:

```text
CONTRATTO APPROVATO:
NON IMPLEMENTATO COMPLETAMENTE

PRIMITIVE LEGACY/CURRENT:
PRESENTI
```

Non:

```text
nessuna struttura esistente.
```

---

# 6. IMPL-022 — primitive esistenti

`buildEvidenceFromTicks(...)`
costruisce già:

```text
alignment
alignment extension
market evidence
Market Reactions
```

e integra temporal evidence.

---

# 7. Alignment legacy/current esiste

`buildAlignment(...)`
produce già:

```text
sofaSeq
betfairSeq
sofaTimestamp
betfairTimestamp
sofaAgeSec
betfairAgeSec
maxTickGapSec
alignmentQuality
```

Quindi il dominio:

```text
timestamp
freshness
alignment quality
```

non è assente.

---

# 8. `maxTickGapSec` ha proprio il limite descritto da IMPL-022

Current:

```text
maxTickGapSec
=
max(sofaAge, betfairAge)
```

Non è:

```text
abs(sofaAcquiredAt - betfairAcquiredAt).
```

Quindi il problema della card
è reale,
ma esiste già una primitive da migrare.

---

# 9. Future timestamp clamp è ancora presente

`ageSec(...)` usa:

```text
Math.max(0, now - timestamp)
```

Quindi un timestamp futuro
può ancora produrre:

```text
age = 0.
```

Questo conferma
che IMPL-022 resta necessaria.

---

# 10. Temporal alignment avanzato esiste già

`buildTemporalAlignment(...)`
produce:

```text
latestScoreChange
latestRelevantSofaMarker
latestBetfairMove
reactionWindows
warnings
```

Questa struttura
è una base concreta.

---

# 11. Alignment extension la integra nello snapshot Evidence

`buildAlignmentExtension(...)`
chiama:

```text
buildTemporalAlignment(...)
```

e restituisce:

```text
temporal
lastSofaMarker
lastBetfairMove
eventMarketGapSec
marketReactionOrder.
```

Quindi la provenance temporale
non parte da zero.

---

# 12. IMPL-022 — ciò che manca davvero

Non esiste ancora
un owner contract uniforme con:

```text
acquiredAt
recordedAt
sourceTimestamp
pipelineDelaySec
futureSkewSec
freshnessAgeSec
validTimestamp
sourceSkewSec
sourceOrder
alignmentReasons
alignmentPolicyVersion.
```

---

# 13. IMPL-018 resta una dipendenza reale

La card 022 correttamente dice:

```text
IMPL-018
→ produce acquisition provenance

IMPL-022
→ interpreta quella provenance.
```

Current Evidence
non deve inventare
`acquiredAt`
dal timestamp persistito.

Questo dependency boundary
è coerente.

---

# 14. IMPL-022 — window contract ancora incompleto

Current code possiede
finestre temporali,
ma non un contratto uniforme con:

```text
anchorAt
baselineAt
baselineGapSec
firstPostSourceAt
firstPostSourceGapSec
windowState
provisional
finalForWindow.
```

---

# 15. IMPL-022 — policy versioning assente

Non esiste
un unico oggetto owner con:

```text
alignmentPolicyVersion
freshnessThresholds
sourceSkewThresholds
futureSkewToleranceSec
baselineGapThresholdSec.
```

Le soglie legacy
restano distribuite.

---

# 16. IMPL-022 — current status corretto

```text
APPROVATA
NON COMPLETATA
PRIMITIVE TEMPORALI PRESENTI
CONTRATTO OWNER VERSIONATO MANCANTE.
```

Non:

```text
STRUTTURA COMPLETAMENTE ASSENTE.
```

---

# 17. TEST-039/043 non vanno promossi

La Todo mantiene:

```text
TEST-039
Acquisition timestamp, source skew, clock skew
→ MANCANTE

TEST-043
Finestre open/closed e provisional/final
→ MANCANTE.
```

La presenza di test legacy
su temporal windows
non equivale
alla chiusura dei nuovi requirement ID.

---

# 18. IMPL-023 — Market Reactions esiste già

Current owner runtime:

```text
buildMarketReactionEvidence(...)
```

costruisce:

```text
significantMarketFlow
marketLedObservation
fieldLedReaction
summary.
```

Quindi non è possibile
classificare il dominio
come completamente assente.

---

# 19. Parent `available` esiste già

Current:

```text
available =
SMF available
OR MLO available
OR FLR available.
```

Il problema della card
è che questa semantica
non è abbastanza uniforme,
non che il campo non esista.

---

# 20. `causalityClaimed:false` esiste già

Current parent:

```text
summary.causalityClaimed = false.
```

Market-led e Field-led
mantengono anch’essi
il confine di non causalità.

Questo requisito
è già una invariant esistente
da preservare.

---

# 21. `interpretation:temporal_proximity_only` esiste già nel Field-led branch

Current Field-led restituisce:

```text
interpretation:
temporal_proximity_only

causalityClaimed:false.
```

Quindi anche questo
non deve essere reimplementato da zero.

---

# 22. Significant Flow esiste già

Current:

```text
buildSignificantMarketFlowEvidence(...)
```

produce:

```text
significantFlows
latestSignificantFlow
absolute tier
relative tier
liquidity share
clusters
reasons.
```

---

# 23. Baseline Significant Flow esiste ma non è quella approvata da IMPL-023

Current baseline:

```text
baselineEntries
→ tutti i flow validi
→ median observedFlowAmount.
```

Non è necessariamente:

```text
runner-specific
same selectionId only
runnerRelativeMultiplier
marketRelativeMultiplier separati.
```

Quindi la nuova policy
resta necessaria.

---

# 24. Tick eligibility uniforme non esiste

`extractTickCandidates(...)`
legge:

```text
runners
flow amount
volume validation.
```

Non applica
un contratto centrale:

```text
eligible/degraded/status_only/stale/...
```

---

# 25. `statusOnlyGraphLogin` non è gate centrale nel flow builder

Nel percorso verificato
Significant Flow
non controlla
un eligibility object
che impedisca
la generazione algoritmica
per `status-only`.

Questo conferma
la root issue EVIDENCE-002/IMPL-023.

---

# 26. Field → Market current contract esiste ma usa semantica troppo larga

Current Field-led calcola:

```text
priceChangeObserved
matchedVolumeIncreaseObserved
marketResponseObserved
=
price change OR market total matched increase.
```

---

# 27. IMPL-023 vuole separare generic market activity da qualified observation

Nuovo contract:

```text
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation.
```

Quindi il current behavior
è una primitive da rifattorizzare,
non un’assenza totale.

---

# 28. Market → Field current branch esiste

`buildMarketLedObservationEvidence(...)`
ha già:

```text
source market event
baseline Sofa
observation windows
score change
point/game/set/server changes
fieldEventObservedAfterFlow.
```

---

# 29. Transition gate approvato resta mancante come contract uniforme

IMPL-023 vuole distinguere:

```text
markerPresentAfterSource
markerTransitionObservedAfterSource
scoreTransitionObservedAfterSource.
```

Il current branch
non espone
questo schema owner uniforme.

---

# 30. Branch state uniforme manca

Current moduli usano:

```text
available
summary
windowClosed
dataQuality
reasons
```

con contratti differenti.

Non esiste ancora
per ogni branch:

```text
computed
inputAvailable
sourceEventAvailable
observationAvailable
observationDetected
provisional
stale
dataQuality
reasons.
```

---

# 31. Window state uniforme manca

Field-led ha:

```text
windowClosed: boolean.
```

IMPL-023 richiede:

```text
open
closed
insufficient_data
stale_source

provisional
finalForWindow.
```

Quindi la migrazione
è ancora necessaria.

---

# 32. Threshold versioning/calibration manca

Current Significant Flow
ha config e thresholds,
ma non un owner contract completo con:

```text
thresholdVersion
calibrationStatus
heuristic/provisional/not_calibrated/not_signal.
```

---

# 33. IMPL-023 — status corretto

```text
APPROVATA
NON COMPLETATA
MARKET REACTIONS LEGACY/CURRENT PRESENTI
ELIGIBILITY E BRANCH CONTRACT UNIFORMI MANCANTI.
```

---

# 34. Existing Market Reactions tests non chiudono TEST-031…043

`marketReactionEvidence.test.mjs`
verifica già, fra l’altro:

```text
empty input
availability
causality false
significant flow
market-led observation
config forwarding
field-led base contract
input immutability.
```

Questa è coverage legacy reale.

---

# 35. Ma i nuovi TEST-ID restano formalmente mancanti

La Todo mantiene:

```text
TEST-031…043
→ MANCANTI.
```

Non promuoverli
solo perché un vecchio test
copre sotto-comportamenti simili.

---

# 36. IMPL-024 — runner comparison esiste già

Current Field-led:

```text
buildRunnerPriceChanges(...)
```

confronta runner
fra baseline e latest.

Quindi non è
una struttura completamente assente.

---

# 37. SelectionId è già preferito

Current:

```text
if baseline selectionId != null
→ find latest same selectionId.
```

Questa è una primitive utile.

---

# 38. Ma il fallback nome legacy è ancora presente

Se baseline runner
non ha selectionId:

```text
find latest runner
with selectionId == null
and same name.
```

Questo viola
la nuova policy IMPL-024:

```text
no name fallback
for temporal comparisons.
```

---

# 39. Temporal Alignment Betfair move ha lo stesso fallback legacy

`selectBestBetfairMoveCandidate(...)`
usa:

```text
selectionId se presente
altrimenti runner.name.
```

Quindi il problema
è cross-module reale.

---

# 40. Price extraction esiste già

`extractRunnerPrice(...)`
produce:

```text
ltp
mid
book_back
book_lay
unavailable
```

con `source` esplicita.

Questa è una base concreta
per IMPL-024.

---

# 41. Candidate selection però conserva solo la source latest

Current:

```text
toPrice + priceSource
fromPrice senza fromPriceSource.
```

Quindi non può ancora
valutare correttamente:

```text
baselinePriceSource
vs
latestPriceSource.
```

---

# 42. Field-led `resolvePrice()` perde completamente la source

Current:

```text
LTP
→ mid
→ back
→ lay
```

ma restituisce solo:

```text
number.
```

Non conserva:

```text
price source.
```

---

# 43. Price source comparability manca

Non esiste
un contract uniforme:

```text
comparable
degraded_source_change
price_unavailable.
```

---

# 44. Baseline gap policy manca

Current Field-led
sceglie:

```text
ultimo Betfair tick <= anchor.
```

Non verifica
un limite esplicito:

```text
baselineGapSec <= threshold.
```

---

# 45. Coverage runner owner manca

Non esiste ancora
un risultato unico con:

```text
expectedRunnerCount
identifiedRunnerCount
comparableRunnerCount
tradableRunnerCount
reliableLadderRunnerCount
reliableFlowRunnerCount.
```

---

# 46. IMPL-024 — status corretto

```text
APPROVATA
NON COMPLETATA
RUNNER COMPARISON PRIMITIVES PRESENTI
STRICT IDENTITY/PRICE COMPARABILITY/COVERAGE MANCANTI.
```

---

# 47. TEST-033/036/037/038 restano open

La Todo mantiene:

```text
TEST-033 selectionId obbligatorio
TEST-036 source prezzo cambiata
TEST-037 baseline gap
TEST-038 coverage runner
→ MANCANTI.
```

Coerente con lo stato reale.

---

# 48. Ordine approvato — verifica

Il file propone:

```text
IMPL-018
→ IMPL-022
→ IMPL-024
→ IMPL-023
→ TEST-031…043
→ IMPL-012
→ IMPL-013
→ calibrazione threshold.
```

---

# 49. L’ordine è sostanzialmente coerente

Rationale:

```text
018
→ acquisition timestamps

022
→ temporal semantics

024
→ identity/comparability

023
→ eligibility e branches

012
→ fixture/replay

013
→ baseline/calibration.
```

Non serve
un dependency finding separato.

---

# 50. La calibrazione può correttamente venire dopo implementation contract

IMPL-023 permette
soglie correnti solo come:

```text
heuristic
provisional
not_calibrated
not_signal.
```

Quindi può essere implementata
prima della baseline IMPL-013,
purché non venga dichiarata calibrata.

---

# 51. Nessun ciclo evidente

A differenza del 065/066,
qui non emerge
una contraddizione certa
fra hard dependency
ed execution order.

---

# 52. IMPL-EVIDENCE-001 — implementation coverage reale

**Priorità:** HIGH  
**Tipo:** owner state granularity / preserve existing Evidence behavior

## Root issue

Le tre card usano:

```text
STRUTTURA COMPLETAMENTE ASSENTE
```

ma esistono
sotto-strutture concrete
che una task futura
deve preservare o migrare.

---

# 53. Azione — IMPL-022

Sostituire lo stato blanket
con una forma bounded:

```text
Stato:
APPROVATA, NON COMPLETATA

Primitive correnti:
- alignment age/maxTickGapSec;
- alignmentQuality;
- temporalAlignment;
- score/marker/move/reaction windows.

Manca:
- acquisition provenance owner;
- source skew;
- future skew policy;
- alignment policy versionata;
- uniform window provenance.
```

---

# 54. Azione — IMPL-023

Registrare:

```text
Primitive correnti:
- Market Reactions builder;
- Significant Flow;
- Market-led observation;
- Field-led reaction;
- available/dataQuality/reasons;
- causalityClaimed:false.

Manca:
- central tick eligibility;
- status-only exclusion;
- uniform branch state;
- qualified observation semantics;
- transition gate;
- coverage integration;
- versioned threshold/calibration state;
- uniform window state.
```

---

# 55. Azione — IMPL-024

Registrare:

```text
Primitive correnti:
- temporal runner comparison;
- selectionId preferred;
- legacy name fallback;
- price extraction LTP/mid/back/lay;
- price deltas;
- volume validation.

Manca:
- selectionId-only identity;
- no name fallback;
- baseline/latest price sources;
- comparability policy;
- baseline gap threshold;
- runner coverage.
```

---

# 56. Vincolo fondamentale

Non trasformare
la nuova card in una riscrittura
from-scratch.

La futura task tecnica deve:

```text
preservare invarianti corrette
sostituire primitive insufficienti
aggiungere contract mancanti
eliminare fallback vietati.
```

---

# 57. Invarianti da preservare — Evidence

```text
Source Identity scope
persistence integrity scope
causalityClaimed:false
no signal
no strategy
no recommendation
no timeline mutation
no recovery side effects
pure builders dove già puri.
```

---

# 58. Invarianti da preservare — temporal

```text
latest score change
latest relevant Sofa marker
latest Betfair move
reaction windows
warnings
input immutability.
```

Possono cambiare schema,
non devono sparire
senza migration plan.

---

# 59. Invarianti da preservare — Market Reactions

```text
Significant Flow
Market→Field
Field→Market
temporal_proximity_only
causality false
reasons
window observation.
```

---

# 60. Invarianti da sostituire esplicitamente

```text
name fallback runner
future timestamp age=0
maxTickGapSec semantic ambiguity
market total matched == response
non-uniform available
non-versioned thresholds.
```

---

# 61. Acceptance criteria — IMPL-EVIDENCE-001

```text
[ ] IMPL-022 non dice più “completamente assente”
[ ] IMPL-023 non dice più “completamente assente”
[ ] IMPL-024 non dice più “completamente assente”
[ ] approval e priority non cambiano
[ ] current primitive list 022 presente
[ ] current primitive list 023 presente
[ ] current primitive list 024 presente
[ ] missing contract list 022 presente
[ ] missing contract list 023 presente
[ ] missing contract list 024 presente
[ ] name fallback legacy esplicitato
[ ] future timestamp clamp legacy esplicitato
[ ] current Market Reactions invariants preservate
[ ] TEST-031…043 non promossi
[ ] IMPL-018 dependency preservata
[ ] order §19.2 preservato salvo nuova evidence
[ ] nessun signal/strategy introdotto
```

---

# 62. Dedupe con EVIDENCE-001…009

`IMPL-EVIDENCE-001`
non crea nuovi bug Evidence.

Gli owner tecnici restano:

```text
EVIDENCE-001…009.
```

Questa task corregge
solo la descrizione dello stato
delle implementazioni proposte.

---

# 63. Dedupe con report 056

Report 056
ha già confermato
che i finding Evidence
sono current.

Il 067
non deve riaprirli.

---

# 64. Dedupe con IMPL-BETFAIR-001

IMPL-BETFAIR-001
possiede dependency graph
016…018.

IMPL-EVIDENCE-001
possiede implementation coverage
022…024.

Non duplicati.

---

# 65. Dedupe con IMPL-STORAGE-001

Stesso pattern metodologico,
owner diversi:

```text
IMPL-STORAGE-001
→ primitive Task 6 vs IMPL-019…021

IMPL-EVIDENCE-001
→ primitive Evidence legacy vs IMPL-022…024.
```

Non duplicati.

---

# 66. TEST-ID — regola

I test legacy
possono coprire parti
dei nuovi requisiti.

Ma:

```text
legacy coverage
≠
TEST-ID completed.
```

Serve mapping esplicito
nel manifest/test map
prima di promuovere uno stato.

---

# 67. Current test evidence utile

`marketReactionEvidence.test.mjs`
conferma che esistono già test
per:

```text
available false su input vuoto
SMF/MLO/FLR availability
causality false
large flow
observation windows
config forwarding
input immutability.
```

Questa evidence
va usata per preservare regressions.

---

# 68. Non usare questi test per chiudere TEST-031…043

Gli ID nuovi richiedono:

```text
eligibility
status-only
source skew
strict selectionId
price source changes
baseline gap
coverage
branch state
cluster identity
threshold versions.
```

Mancano ancora
come acceptance completa.

---

# 69. Modularizzazione — dimensione

Il file ha:

```text
684 righe.
```

È superiore ai moduli 065/066,
ma resta sotto il livello
in cui la sola lunghezza
giustifica uno split.

---

# 70. Responsabilità condivisa

I tre owner
sono strettamente concatenati:

```text
temporal provenance
→ runner comparability
→ Market Reaction eligibility.
```

Separarli renderebbe
più difficile verificare
lo stesso cross-source contract.

---

# 71. Context overlap alto

Per IMPL-023
servono direttamente:

```text
IMPL-022 temporal policy
IMPL-024 runner coverage/comparability.
```

Quindi tre child separati
avrebbero cross-link continui.

---

# 72. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 73. Aspetti corretti da preservare — IMPL-022

```text
acquiredAt governs freshness
recordedAt is audit pipeline time
sourceTimestamp informational until verified
future skew degraded
single-source is not medium cross-source alignment
versioned thresholds
bounded reasons.
```

---

# 74. Aspetti corretti da preservare — IMPL-023

```text
status-only remains in timeline/health only
no flow/source event from status-only
uniform branch state
market activity != qualified observation
persistent marker != transition
selectionId in clusters
no double counting
threshold provisional/not calibrated/not signal
no causality
no signals.
```

---

# 75. Aspetti corretti da preservare — IMPL-024

```text
selectionId-only temporal identity
name presentation only
explicit price sources
source change degraded
baseline bounded
coverage explicit
branch-local degradation only.
```

---

# 76. Non-finding — temporal alignment già presente

Non significa
che IMPL-022 sia completata.

Il legacy/current alignment
non possiede
l’acquisition provenance contract.

---

# 77. Non-finding — Market Reactions già presente

Non significa
che IMPL-023 sia completata.

Manca eligibility owner
ed uniform branch state.

---

# 78. Non-finding — selectionId già usato in alcuni confronti

Non significa
che IMPL-024 sia completata.

Il fallback nome
è ancora presente.

---

# 79. Non-finding — priceSource già calcolata in temporalAlignment

Non significa
price comparability completa.

Manca la baseline source
nel candidate contract
e la policy condivisa.

---

# 80. Non-finding — `available` esiste

La root issue
è la semantica non uniforme,
non l’assenza del campo.

---

# 81. Non-finding — `windowClosed` esiste

La nuova policy richiede
uno state machine più ricco:

```text
open/closed/insufficient_data/stale_source
provisional/final.
```

---

# 82. Non-finding — significant flow threshold esiste

La nuova policy richiede:

```text
version
calibration status
runner-specific baseline
market-specific baseline.
```

---

# 83. Non-finding — current `dataQuality`

È una primitive,
non la nuova eligibility policy.

Non vanno fuse automaticamente.

---

# 84. Non-finding — Source Identity/persistence gating già esiste a monte

`buildEvidenceFromTicks(...)`
scopa i Betfair input
solo quando:

```text
Source Identity aligned
and persistence complete.
```

IMPL-023 aggiunge
eligibility tecnica
all’interno del dominio,
non sostituisce quei gate.

---

# 85. Non-finding — causality boundary

È già correttamente:

```text
false.
```

Non va rimesso in discussione.

---

# 86. Verifica futura dopo sola correzione registry

```text
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
node scripts/validation/run.mjs fast
git diff --check
```

Non serve:

```text
tracking live
Betfair browser
Chrome
network capture
replay reale.
```

---

# 87. Nuovi finding

```text
IMPL-EVIDENCE-001
```

---

# 88. Nuove task runtime

```text
0
```

---

# 89. Nuove task registry/documentazione

```text
1
```

---

# 90. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

---

# 91. Decisione finale

```text
implementazioni/implementazioni-proposte/04-evidence-provenance.md:

ROLE:
OWNER REGISTRY SOLIDO

PERIMETRO:
IMPL-022…024

DIMENSIONE:
684 RIGHE

IMPL-022:
OPEN
APPROVATA
CRITICA
PARTIAL LEGACY/CURRENT PRIMITIVES EXIST

IMPL-023:
OPEN
APPROVATA
CRITICA
PARTIAL LEGACY/CURRENT PRIMITIVES EXIST

IMPL-024:
OPEN
APPROVATA
ALTA
PARTIAL LEGACY/CURRENT PRIMITIVES EXIST

FALSE COMPLETION:
NO

FALSE TOTAL ABSENCE:
YES

NEW RUNTIME BUG:
NO

PROBLEMA:
IMPLEMENTATION COVERAGE
NON RAPPRESENTATA

CHANGE ID:
IMPL-EVIDENCE-001

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ

MODULARIZZAZIONE:
NO
```

---

# 92. Stato audit dopo report 067

```text
Documenti Markdown totali: 72
Analizzati: 67
Da analizzare: 5
Avanzamento: 93,06%
```

Sequenza:

```text
[✓] 065 implementazioni/implementazioni-proposte/02-runtime-betfair.md
[✓] 066 implementazioni/implementazioni-proposte/03-storage-recovery.md
[✓] 067 implementazioni/implementazioni-proposte/04-evidence-provenance.md
[ ] 068 implementazioni/implementazioni-proposte/05-frontend-session-polling.md
```

---

# 93. Contatori task

Ultimo consolidamento:

```text
report 062
→ 338 task note
```

Dopo:

```text
063 → +1
064 → +2
065 → +1
066 → +2
067 → +1
```

Totale provvisorio:

```text
345
```

Non ancora consolidate:

```text
DOC-AUDIT-PROC-001
IMPL-BASE-001
IMPL-BASE-002
IMPL-BETFAIR-001
IMPL-STORAGE-001
IMPL-STORAGE-002
IMPL-EVIDENCE-001
```

---

# 94. Stato mappa / JSON

```text
mappa-file-markdown-repository-continuazione-048.md
→ NON MODIFICATA

modifiche-audit-markdown-continuazione-048.json
→ NON MODIFICATO
```

---

# 95. Prossimo documento — non analizzato

```text
068
implementazioni/implementazioni-proposte/05-frontend-session-polling.md
```

---

# 96. Stop operativo

```text
report 067:
COMPLETATO

nuovo Change ID:
IMPL-EVIDENCE-001

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 068:
NON ANALIZZATO
```
