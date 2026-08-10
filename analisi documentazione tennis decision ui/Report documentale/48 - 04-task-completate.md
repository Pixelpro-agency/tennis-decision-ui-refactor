# Report documentale — `implementazioni/04-task-completate.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-048
Sequenza audit: 48/72
Documento analizzato: 04-task-completate.md
Percorso documento: implementazioni/04-task-completate.md
Percorso report: Report documentale/48 - 04-task-completate.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 2edc228be3db1ee004f8128395add098d8465027
Dimensione documento: 1129 righe
Tipo: ricontrollo storico D1–D18 delle task considerate completate
Baseline dichiarata dal ricontrollo: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Suite durante il ricontrollo: non rieseguite
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md
implementazioni/README.md
implementazioni/03-audit-codice.md
implementazioni/audit-codice/02-runtime-sessioni-betfair.md
implementazioni/audit-codice/03-storage-recovery.md
implementazioni/audit-codice/07-post-audit-e-migrazione.md

frontend/src/App.jsx
backend/src/routes/match/trackingResponses.js
backend/src/sofa/betfair/processor/runnerProcessing.js

report documentali:
027 — Betfair Graph URL validation
029 — local context / point-by-point
030 — timelines/history
031 — commit journal/recovery
032 — local runtime
033 — live tracking control
034 — Betfair diagnostics
036 — retention and cleanup
```

Sono stati inoltre richiamati, senza duplicarli:

```text
METHOD-EVIDENCE-001
PLAN-AUDIT-001
PLAN-AUDIT-003

GRAPH-URL-001…007
LOCAL-PBP-001…008
STORAGE-TH-001…009
JOURNAL-REC-001…010
LOCAL-RUNTIME-001…007
LIVE-CTRL-001…007
BETFAIR-DIAG-001…008
RETENTION-001…003

RUNTIME-009
DATA-001
STORAGE-001…009
```

GitHub non è stato modificato.

La mappa cumulativa e il ledger JSON restano invariati.

Questo è il primo report del blocco:

```text
048–052
```

Il consolidamento cumulativo avverrà dopo il report 052.

---

# Esito sintetico

```text
Valore come snapshot storico b277bd9:               ALTO
Baseline dichiarata:                                CHIARA
Distinzione test presenti / suite non eseguite:     CORRETTA
Regola riapertura circoscritta:                      CORRETTA
D1–D18 come audit campaign:                         COERENTE al checkpoint
Uso corrente come stato D1–D18:                     NON PIÙ COERENTE
Conteggio 9 / 7 / 2 come current summary:           SUPERATO
Todo corrente:                                      CONSERVA STATI SUPERATI
Supersession da audit successivi:                   NON RAPPRESENTATA
Modularizzazione:                                   NON necessaria

Nuovi finding:                                      2
Nuove task runtime:                                 0
Underlying technical task duplicate:                0
Riscrittura completa:                               NO
Revisione mirata:                                   SÌ
Nuovi documenti canonici proposti:                  nessuno
Priorità complessiva:                               CRITICA per la governance degli stati
```

La conclusione centrale è:

```text
IL RICONTROLLO D1–D18
NON DEVE ESSERE RISCRITTO
COME SE FOSSE STATO SBAGLIATO AL CHECKPOINT b277bd9.

IL PROBLEMA È SUCCESSIVO:

D1–D18 È RIMASTO CONGELATO
MENTRE IL PROGETTO HA ESEGUITO
ALTRI AUDIT PIÙ PROFONDI
CHE HANNO TROVATO DISCREPANZE CONCRETE
NELLO SCOPE DI TASK
ALLORA MARCATE “CONFERMATA”.

LA TODO CORRENTE COPIA ANCORA
IL VECCHIO CONTEGGIO:

9 confermate
7 confermate con limiti
2 da riaprire

COME SE FOSSE ANCORA
LA CLASSIFICAZIONE CORRENTE.
```

Gli audit successivi dimostrano invece,
almeno per i seguenti casi,
che lo stato corrente deve essere riesaminato:

```text
D5
D6
D9
D10
D11
D12
D13
D16
```

e i limiti di:

```text
D18
```

devono essere ampliati.

D14 e D17
restano correttamente da riaprire.

---

# 1. Il documento dichiara correttamente la propria baseline

La sezione iniziale registra:

```text
SHA verificato:
b277bd9b7373dfd8702e65446c88bab7a0f64dcc

Audit usato:
B1–B6 completato in lettura

Test:
file presenti letti
suite non rieseguite
```

Questo è un buon contratto storico.

Non bisogna sostituire retroattivamente:

```text
b277bd9
```

con:

```text
4c5f43b
```

per far sembrare il ricontrollo più recente.

---

# 2. Il file è quindi una recertificazione di checkpoint, non una certificazione eterna

La corretta lettura è:

```text
sul checkpoint b277bd9
→ con le evidenze allora lette
→ D1–D18 furono classificati così.
```

Non:

```text
qualunque commit futuro
→ mantiene automaticamente
gli stessi stati D1–D18.
```

Questa distinzione oggi manca
nella presentazione corrente del registro.

---

# 3. Il titolo da solo non rende esplicita la natura immutabile dello snapshot

Il file si chiama:

```text
Ricontrollo delle task considerate completate
```

e `implementazioni/README.md`
lo presenta semplicemente come:

```text
verifica delle task dichiarate concluse.
```

Non viene detto:

```text
snapshot storico b277bd9
→ gli stati correnti possono essere superseded
dai successivi audit tecnici.
```

Questa omissione è diventata importante
perché esistono davvero supersession successive.

---

# 4. La Todo corrente continua a copiare lo snapshot D1–D18

La Todo corrente mantiene:

```text
D1  CONFERMATA CON LIMITI
D2  CONFERMATA CON LIMITI
D3  CONFERMATA
D4  CONFERMATA
D5  CONFERMATA
D6  CONFERMATA
D7  CONFERMATA
D8  CONFERMATA CON LIMITI
D9  CONFERMATA CON LIMITI
D10 CONFERMATA
D11 CONFERMATA
D12 CONFERMATA
D13 CONFERMATA CON LIMITI
D14 DA RIAPRIRE
D15 CONFERMATA
D16 CONFERMATA CON LIMITI
D17 DA RIAPRIRE
D18 CONFERMATA CON LIMITI
```

e continua a stampare:

```text
CONFERMATA: 9
CONFERMATA CON LIMITI: 7
DA RIAPRIRE: 2
```

Questa è ormai una current-state problem,
non un semplice documento storico.

---

# 5. Il progetto ha eseguito audit tecnici successivi molto più profondi

Dopo il ricontrollo b277bd9
sono stati eseguiti:

```text
secondo audit codice
→ Punti 1–7

post-audit

audit documentale canonico
→ report 023–047
```

Questi lavori hanno trovato
discrepanze concrete in runtime,
storage, Graph, context e retention.

Quindi il vecchio ricontrollo
non può restare l’unico source
dello stato sintetico D1–D18.

---

# 6. Non tutte le nuove issue riaprono automaticamente la vecchia task

Regola da preservare:

```text
nuovo finding
≠
vecchia task interamente fallita.
```

Il documento stesso dice correttamente:

```text
quando una task è DA RIAPRIRE
→ riaprire soltanto la parte difettosa.
```

Questa regola deve essere applicata
anche alle nuove discrepanze.

---

# 7. Il problema è quindi una supersession di stato, non una cancellazione della storia

Servono due livelli:

```text
historical recheck state
→ quello del b277bd9

current superseding state
→ quello derivato dalle prove successive.
```

Non bisogna mutare il passato.

---

# 8. D1 — Source Identity 1A può restare `CONFERMATA CON LIMITI` nell’overlay corrente

Il vecchio ricontrollo già include:

```text
pending reale non verificato
confirm reale non verificato
decline reale non verificato
bootstrap cross-source non transazionale
RUNTIME-002
```

Gli audit successivi
hanno ampliato session authority,
mismatch cleanup e stale callbacks,
ma il documento aveva già classificato
la task come:

```text
CONFERMATA CON LIMITI.
```

Non emerge la necessità
di trasformarla automaticamente in:

```text
DA RIAPRIRE intera.
```

Le task tecniche successive
restano owner delle correzioni.

---

# 9. D2 — Source Identity frontend può restare `CONFERMATA CON LIMITI`

Il file già dichiara:

```text
pending reale
confirm
decline
bootstrap failure
toast pending reale
```

come live non verificati
e separa cleanup legacy.

I successivi finding frontend/session
ampliano il perimetro,
ma non richiedono qui
un nuovo Change ID tecnico.

---

# 10. D3 — Money Flow 2A può restare `CONFERMATA`

Il contratto specifico è:

```text
campione tecnico inutilizzabile
≠
finished

→ non persiste
→ non aggiorna baseline
```

I finding Betfair successivi
su authority, provenance o diagnostics
non dimostrano direttamente
che questa specifica regola sia falsa.

Non riaprire D3 per prossimità tematica.

---

# 11. D4 — Money Flow 2B può restare `CONFERMATA` come nucleo

Il runtime distingue:

```text
attempt
success
technical error
reason
```

e gli audit successivi
non hanno dimostrato che questa separazione
sia stata rimossa.

Esistono finding su:

```text
finished authority
auth hysteresis
stale semantics
```

ma non basta questo report
per annullare l’intera Task 2B.

Non aprire una nuova riapertura
senza binding preciso allo scope originale.

---

# 12. D5 — Money Flow 2C NON può restare `CONFERMATA` senza qualificazione

D5 dichiara fra i contratti riconfermati:

```text
separazione fra matchedTotal runner
e totale mercato.
```

Il codice corrente contiene invece:

```text
se runner.matchedTotal manca o vale 0

runnerMatched =
  state.totalMatched
  || tradedVolume
  || exchange.tradedVolume
  || 0

se runnerMatched non è positivo

runner.matchedTotal =
  marketTotalMatched / runnerCount
```

Quindi:

```text
dato runner assente
→ derivazione sintetica dal totale mercato.
```

Questo è una discrepanza concreta.

---

# 13. Il secondo audit interno ha già registrato questo problema come `DATA-001`

`DATA-001` dichiara:

```text
Volume runner inventato
da marketTotal / runnerCount
```

e ne approva la rimozione.

Quindi il problema non è una nuova scoperta
da implementare con un owner parallelo.

Il problema del report 048 è:

```text
D5 è ancora sintetizzata come CONFERMATA.
```

---

# 14. Stato corrente suggerito per D5

```text
D5
→ DA RIAPRIRE IN MODO CIRCOSCRITTO

riaprire:
→ source semantics di matchedTotal runner
→ missing != synthetic market split
→ Money Flow dipendente

non riaprire automaticamente:
→ selectionId
→ finite seq
→ commitId singolo
→ dedupe/regression core
```

Owner tecnici già esistenti:

```text
DATA-001
STORAGE-TH-005
```

---

# 15. D6 — Money Flow 2D non può più essere descritta come completamente `CONFERMATA`

Il vecchio ricontrollo dichiara:

```text
marketId coherence
selectionId mapping
duplicates
query/fragment parser
skip URL
```

come pienamente riconfermati.

Il successivo audit Graph URL
ha aperto:

```text
GRAPH-URL-001
→ missing upstream market identity
  distinto da mismatch Graph

GRAPH-URL-002
→ duplicate API selection identity
  deve fail-closed

GRAPH-URL-003
→ query/fragment canonicalization

GRAPH-URL-004
→ Graph loop integration contract
```

Questi punti toccano direttamente
mapping e identity del Task 2D.

---

# 16. Non tutta D6 è fallita

Restano valide parti come:

```text
HTTPS
graphs.betfair.it
path diretto
view 0
runnerChartData rifiutato
no fallback per nome
```

Quindi non va riaperta
come blocco totale.

---

# 17. Stato corrente suggerito per D6

```text
D6
→ DA RIAPRIRE IN MODO CIRCOSCRITTO
```

oppure, se il progetto preferisce
riservare `DA RIAPRIRE`
soltanto a un bug già riprodotto runtime:

```text
CONFERMATA CON LIMITI CRITICI
```

Ma non deve restare:

```text
CONFERMATA
```

senza indicare:

```text
GRAPH-URL-001…004.
```

Owner tecnico:

```text
GRAPH-URL-001…007
```

---

# 18. D7 — Money Flow 2E può restare confermata nel proprio scope UI

Il frontend neutro:

```text
Volume abbinato nel tempo
```

e l’assenza di semantica direzionale
restano concettualmente separati
dal problema upstream DATA-001.

Quindi:

```text
D5 può essere riaperta
senza annullare D7.
```

Questa separazione è corretta.

---

# 19. D8 — Validazione live Betfair resta `CONFERMATA CON LIMITI`

Il report storico
ha realmente osservato A/B/C.

I report 039–040
hanno trovato problemi di:

```text
metadata
provenance
migration fidelity
scenario summary
```

non hanno dimostrato
che le osservazioni live principali
non siano mai avvenute.

Quindi il current overlay
può mantenere:

```text
CONFERMATA CON LIMITI
```

aggiungendo eventualmente
i finding `BETFAIR-VAL-*`.

---

# 20. D9 — Runtime launcher non può più restare solo `CONFERMATA CON LIMITI` di validazione

Il vecchio ricontrollo descrive i limiti come:

```text
scenari live non osservati:
porte alternative
CDP alternativo
force-kill
runtime conflict
login-only continuity
```

Quindi il limite è presentato
principalmente come validation gap.

Il report 032 ha invece trovato
discrepanze concrete nel runtime attuale.

---

# 21. `LOCAL-RUNTIME-001` è una discrepanza nel core del riuso

Il launcher può riusare un backend
che appare appartenere allo stesso progetto
senza dimostrare:

```text
same working copy
same storage authority.
```

La task è stata classificata:

```text
critical.
```

Questo non è un collaudo live mancante.

È un problema di:

```text
service identity / reuse authority.
```

---

# 22. Altri finding launcher correnti

Sono stati aperti anche:

```text
LOCAL-RUNTIME-002
→ bounded reuse/spawn resolution

LOCAL-RUNTIME-003
→ CLI outcome e failure exit semantics

LOCAL-RUNTIME-004
→ CDP configuration provenance

LOCAL-RUNTIME-005
→ browser handoff semantics
```

Quindi la frase D9:

```text
non riaprire il runtime launcher
```

non è più sostenibile come current state generale.

---

# 23. Stato corrente suggerito per D9

```text
D9
→ DA RIAPRIRE IN MODO CIRCOSCRITTO
```

riaprendo:

```text
service identity
reuse authority
CLI outcome
readiness/handoff
```

senza riaprire automaticamente:

```text
process ownership base
Chrome/CDP external ownership
tracking/login registry scopes
```

Owner:

```text
LOCAL-RUNTIME-001…007
PY-RUNTIME-*
```

---

# 24. D10 — Stop globale è il caso più diretto

Il ricontrollo dice:

```text
D10
→ CONFERMATA
```

e descrive:

```text
stop tracking
generation invalidated
process cleanup
login preserved
no Chrome close
no data deletion
```

Questi punti non sono tutti falsi.

Ma il contratto di completion
è oggi incompleto.

---

# 25. Il codice corrente restituisce Stop completo anche quando Python cleanup fallisce

`buildStopMatchResponse()`:

```text
try terminateTracking()
catch
→ pythonCleanup.ok = false
```

ma poi restituisce comunque:

```text
HTTP 200

{
  ok: true,
  stopped: true,
  pythonCleanup
}
```

anche quando:

```text
pythonCleanup.ok !== true.
```

Questa è una discrepanza concreta.

---

# 26. Il secondo audit interno l’ha già registrata come `RUNTIME-009`

`RUNTIME-009`:

```text
Stop pubblico nasconde un cleanup parziale
```

e approva:

```text
status:
complete | partial_failure

logicalStop:
true

physicalCleanup:
complete | partial
```

Quindi non creare un nuovo bug Stop tecnico.

---

# 27. Gli audit documentali successivi confermano la stessa root issue

Report 033:

```text
LIVE-CTRL-002
→ Stop completion semantics
```

e report 028:

```text
SOFA-LIVE-003 / cleanup semantics
```

mantengono lo stesso problema.

---

# 28. Stato corrente suggerito per D10

```text
D10
→ DA RIAPRIRE IN MODO CIRCOSCRITTO
```

riaprendo soltanto:

```text
completion semantics
physical cleanup result
UI presentation del partial failure
poller cleanup coerente
```

senza annullare:

```text
scope tracking
login-only preservation
no Chrome close
no data deletion
SIGINT/SIGTERM cleanup.
```

---

# 29. D11 — Timeline store non può restare completamente `CONFERMATA`

Il vecchio ricontrollo conferma:

```text
atomic write
schema
naming
metadata
dedupe
sequence
history
HTTP/frontend contracts.
```

La proprietà:

```text
temp file → rename
```

resta utile e corretta.

Ma l’audit successivo
ha trovato problemi di read/discovery
capaci di produrre perdita o overwrite.

---

# 30. `STORAGE-TH-001` è direttamente nello scope timeline/history

Un file:

```text
invalid JSON
invalid shape
read failure
```

può essere trattato come:

```text
missing / empty
```

anziché:

```text
storage integrity failure.
```

Un documento canonico illeggibile
non deve essere sovrascritto
come se non esistesse.

Questo è un problema
del lifecycle del timeline store,
non una semplice feature futura.

---

# 31. `STORAGE-TH-002` aggiunge ambiguous target

Con più candidati dello stesso eventId:

```text
sort()[0]
```

non costituisce una canonical authority sicura.

Quindi anche:

```text
naming / target discovery
```

non può essere considerato
pienamente confermato.

---

# 32. Stato corrente suggerito per D11

```text
D11
→ DA RIAPRIRE IN MODO CIRCOSCRITTO
```

preservando:

```text
atomic write primitive
temp/rename
core timeline shape
```

e riaprendo:

```text
read result
corruption handling
ambiguous discovery
canonical target authority.
```

Owner:

```text
STORAGE-TH-001
STORAGE-TH-002
STORAGE-TH-006
```

---

# 33. D12 — Commit journal è ancora più chiaramente superato

Il ricontrollo dice:

```text
D12
→ CONFERMATA
```

e afferma:

```text
cleanup solo dopo target completati e verificati.
```

Gli audit successivi
hanno trovato esattamente
che questa garanzia non è abbastanza forte.

---

# 34. `JOURNAL-REC-001` contraddice la garanzia di cleanup

Il finding richiede:

```text
eliminare cleanup completed residual blind
```

e centralizzare:

```text
verify + cleanup
```

con riapertura dei marker
quando il target non è verificabile.

Quindi:

```text
“cleanup solo dopo target verificati”
```

è troppo forte come current claim.

---

# 35. `JOURNAL-REC-002` contraddice la forza della target verification

La target verification corrente:

```text
JSON parsabile
```

non dimostra:

```text
target corretto
shape
eventId
source
coerenza col journal.
```

Il ricontrollo tratta invece genericamente:

```text
target verification
```

come prova sufficiente.

---

# 36. `JOURNAL-REC-003/004` ampliano il problema

Esistono anche problemi di:

```text
repair payload business validity
integrity unreadable / scan failure
```

che possono influenzare
il lifecycle del journal.

Questi non sono soltanto:

```text
mancanza di harness.
```

---

# 37. Stato corrente suggerito per D12

```text
D12
→ DA RIAPRIRE IN MODO CIRCOSCRITTO
```

riaprendo:

```text
residual cleanup
semantic target verification
repair input validation
integrity read authority
```

preservando:

```text
pending before writers
commitId
markers
atomic journal write
repairOnly concept
```

Owner:

```text
JOURNAL-REC-001…010
STORAGE-001…009
```

---

# 38. D13 — Recovery non è più soltanto “confermata con limite harness”

Il vecchio documento dice:

```text
D13
→ CONFERMATA CON LIMITI
```

e il limite principale è:

```text
manca harness controllato
per produrre partial/recovery/recovery_failed.
```

Poi conclude:

```text
La recovery non viene riaperta.
```

Questa conclusione è stata superata
dall’audit storage successivo.

---

# 39. Il secondo audit storage ha trovato bug di recovery core

`STORAGE-002`:

```text
record parziale
→ completed flag trusted
→ target già marked complete
  può non essere verificato
```

Scenario:

```text
history.completed=true
history cancellata/corrotta
timeline pending
restart
→ timeline riparata
→ journal rimosso
→ history ancora assente/invalida
```

Questo è un bug di recovery,
non una mancanza di harness.

---

# 40. `STORAGE-003` mostra target verification semanticamente insufficiente

Un JSON estraneo ma parsabile
può soddisfare la verifica.

La recovery quindi può:

```text
considerare sano
un target semanticamente sbagliato.
```

Anche questo è nello scope D13.

---

# 41. `STORAGE-004` mostra un problema di integrity globale

Un journal invalido non attribuibile
può coesistere con:

```text
no_known_partial
```

e non bloccare correttamente writer.

Anche questo supera
il vecchio limite “manca harness”.

---

# 42. Stato corrente suggerito per D13

```text
D13
→ DA RIAPRIRE IN MODO CIRCOSCRITTO
```

riaprendo:

```text
completed target verification
semantic validator
invalid/unreadable journal state
recovery lifecycle semantics
retry/failed authority
```

preservando:

```text
recovery before listen
no tracking/scraper bootstrap
repair architecture
fatal bootstrap boundary.
```

---

# 43. D14 resta correttamente `DA RIAPRIRE`

Il frontend corrente continua
a non propagare integralmente
l’integrity nel composition/view model.

Quindi:

```text
D14
→ DA RIAPRIRE
```

resta coerente.

Non aprire una nuova task tecnica.

---

# 44. D15 può restare `CONFERMATA` nel contratto condizionale dichiarato

D15 dice:

```text
quando una fonte canonica
ha incomplete persistence conosciuta

→ Evidence degrada
→ noTradeReasons
→ Market Reactions unavailable
→ no causalità.
```

Gli audit successivi
hanno trovato problemi
sulla capacità dello Storage
di riconoscere ogni stato degradato,
ma non dimostrano che:

```text
dato un integrity state noto
→ Evidence non degradi.
```

Quindi non è necessario
riaprire D15 in questo report.

---

# 45. D16 — Context locale V1 ha oggi limiti più profondi di quelli registrati

Il vecchio ricontrollo indica come limite principale:

```text
SOFA-001
→ verificare che l’ultimo game sia quello corrente
```

e alcuni live test mancanti.

Il report 029 ha però aperto
problemi strutturali aggiuntivi.

---

# 46. `LOCAL-PBP-001` conferma che current-game authority non è dimostrata

Non basta:

```text
highest (set,game)
→ game corrente.
```

Serve evidence sul source contract.

Questa è una concretezza più forte
del semplice:

```text
“validarlo live”.
```

---

# 47. `LOCAL-PBP-002/003` aprono problemi di identità e domain contract

Sono richiesti:

```text
integer semantics set/game
uniqueness
duplicate conflict handling

pointsTotal:
type
integer semantics
zero vs invalid
duplicates.
```

Quindi il contratto input
non è ancora completamente definito.

---

# 48. `LOCAL-PBP-005` è addirittura critical

Le route:

```text
/api/match/analyze
/snapshot
```

possono comportarsi da writer
senza un confine chiaro rispetto
alle authority canoniche.

Questo non è un semplice
collaudo live mancante.

---

# 49. Stato corrente suggerito per D16

```text
D16
→ DA RIAPRIRE IN MODO CIRCOSCRITTO
```

riaprendo:

```text
current-game authority
structural identity PBP
pointsTotal domain
canonical writer boundary
dataQuality semantics
```

preservando:

```text
no prediction
no signal
recent-window intent
descriptive comparison
```

Owner:

```text
LOCAL-PBP-001…008
```

---

# 50. D17 resta correttamente `DA RIAPRIRE`

Il secondo audit Betfair
conferma e amplia:

```text
SECURITY-001
SECURITY-002
SECURITY-003
PYTHON-001
```

quindi l’esito corrente
rimane giustificato.

Non creare una nuova task D17.

---

# 51. D18 può restare `CONFERMATA CON LIMITI`, ma i limiti sono incompleti

Il vecchio documento registra:

```text
porte alternative non coperte
recheck identity/mtime/size mancante
real apply non validato.
```

Questi limiti restano pertinenti.

Il report 036 ha aggiunto:

```text
RETENTION-001
→ max-files / max-total-bytes per cache

RETENTION-002
→ apply best-effort
→ exit 1 può coesistere con file già rimossi

RETENTION-003
→ backup snapshot multi-artifact non definito.
```

Quindi la classificazione:

```text
CONFERMATA CON LIMITI
```

può restare,
ma la lista limiti deve essere aggiornata
nel current overlay.

---

# 52. Il conteggio corrente non può quindi restare 9 / 7 / 2

Se si applica una lettura prudente
basata soltanto sulle discrepanze
concrete già dimostrate:

```text
CONFERMATA
D3
D4
D7
D15

→ 4
```

```text
CONFERMATA CON LIMITI
D1
D2
D8
D18

→ 4
```

```text
DA RIAPRIRE IN MODO CIRCOSCRITTO
D5
D6
D9
D10
D11
D12
D13
D14
D16
D17

→ 10
```

Totale:

```text
4 + 4 + 10 = 18
```

Questa è una **proposta di current overlay**,
non una riscrittura della tabella storica b277bd9.

---

# 53. La matrice corrente deve restare prudente

Non deve diventare:

```text
nuovo source of truth tecnico
che duplica tutti gli owner.
```

Deve contenere solo:

```text
D-ID
historical result
current status overlay
superseded-by IDs
last reviewed SHA
```

Esempio:

```text
D10

historical:
CONFERMATA @ b277bd9

current:
DA RIAPRIRE PARZIALMENTE

supersededBy:
RUNTIME-009
LIVE-CTRL-002

lastReview:
4c5f43b
```

---

# 54. `TASK-RECHECK-001` — separare immutable historical recheck da current status

**Priorità:** high  
**Tipo:** historical recertification authority

## Problema

Il file contiene una recertificazione
correttamente ancorata a:

```text
b277bd9
```

ma:

```text
README
Todo
registro operativo
```

continuano a consumarne
gli esiti come se fossero current status.

## Azione

Aggiungere all’inizio del file
una dichiarazione equivalente a:

```text
Questo documento conserva
il ricontrollo D1–D18 eseguito
sulla baseline b277bd9.

Gli esiti storici non vengono
riscritti retroattivamente.

Lo stato corrente di una task
può essere superseded
da finding o audit successivi.
```

Aggiungere:

```text
current status pointer
→ Todo / overlay D1–D18
```

oppure una piccola matrice di supersession
in fondo al documento.

## Coordinamento

```text
PLAN-AUDIT-001
PLAN-AUDIT-003
METHOD-EVIDENCE-001
```

senza duplicare i loro owner.

## Criterio di chiusura

Un lettore non interpreta più:

```text
Esito reale @ b277bd9
```

come:

```text
Esito corrente @ HEAD.
```

---

# 55. `TASK-RECHECK-002` — riconciliare gli stati D1–D18 con le prove successive

**Priorità:** critical  
**Tipo:** completed-task status supersession

## Problema

La Todo corrente continua a mostrare:

```text
9 confermate
7 con limiti
2 da riaprire
```

nonostante finding successivi
abbiano dimostrato discrepanze concrete
nello scope di più task.

## Azione

Costruire una current overlay
senza modificare gli esiti storici.

### Re-review obbligatoria minima

```text
D5
→ DATA-001
→ STORAGE-TH-005

D6
→ GRAPH-URL-001…004

D9
→ LOCAL-RUNTIME-001…007

D10
→ RUNTIME-009
→ LIVE-CTRL-002
→ eventuale FRONTEND-007

D11
→ STORAGE-TH-001/002/006

D12
→ JOURNAL-REC-001…010

D13
→ STORAGE-002/003/004
→ JOURNAL-REC-002…006

D16
→ LOCAL-PBP-001…008

D18
→ RETENTION-001…003
```

D14 e D17:

```text
restano già riaperte.
```

### Proposta prudente di overlay

```text
D1  CONFERMATA CON LIMITI
D2  CONFERMATA CON LIMITI
D3  CONFERMATA
D4  CONFERMATA
D5  DA RIAPRIRE PARZIALMENTE
D6  DA RIAPRIRE PARZIALMENTE
D7  CONFERMATA
D8  CONFERMATA CON LIMITI
D9  DA RIAPRIRE PARZIALMENTE
D10 DA RIAPRIRE PARZIALMENTE
D11 DA RIAPRIRE PARZIALMENTE
D12 DA RIAPRIRE PARZIALMENTE
D13 DA RIAPRIRE PARZIALMENTE
D14 DA RIAPRIRE PARZIALMENTE
D15 CONFERMATA
D16 DA RIAPRIRE PARZIALMENTE
D17 DA RIAPRIRE PARZIALMENTE
D18 CONFERMATA CON LIMITI
```

Non applicare automaticamente questa tabella
senza verificare gli owner project-internal
durante la task esecutiva.

È la matrice minima
supportata dall’evidenza di audit corrente.

## Todo

Aggiornare:

```text
BLOCCO D
```

per distinguere:

```text
historical recheck result
current superseding status.
```

Non lasciare un solo bold status
che mescola i due tempi.

## Criterio di chiusura

Per ogni D1–D18 esiste:

```text
historical result
baseline historical
current status
current evidence refs
last reviewed SHA
```

e il conteggio corrente
deriva dalla current overlay,
non dalla tabella b277bd9.

---

# 56. Non creare nuove task tecniche per D5/D10/D12 ecc.

Il report 048 non è owner
dei bug tecnici.

Per esempio:

```text
D5
→ DATA-001 già owner

D10
→ RUNTIME-009 / LIVE-CTRL-002

D12
→ JOURNAL-REC-*

D16
→ LOCAL-PBP-*

D18
→ RETENTION-*.
```

La task nuova è:

```text
status reconciliation.
```

Questo evita backlog duplicato.

---

# 57. Il modello “test presente” è dichiarato correttamente, ma va collegato a `METHOD-EVIDENCE-001`

Il file è onesto:

```text
suite non rieseguite
```

e usa spesso:

```text
sono presenti test.
```

Quindi non afferma:

```text
test passati sul b277bd9
```

quando non sono stati eseguiti.

Questo va preservato.

---

# 58. Ma `CONFERMATA` non deve essere reinterpretata come `TESTED OFFLINE PASS`

Il file definisce:

```text
CONFERMATA
→ implementazione e prove disponibili
   coerenti col contratto.
```

Con suite non eseguite,
questa classificazione significa:

```text
static recertification
+
test files inspected
+
eventuali artifact live.
```

Non:

```text
fresh offline PASS.
```

Questo è già scope di:

```text
METHOD-EVIDENCE-001.
```

Non apro `TASK-RECHECK-003`.

---

# 59. Il termine “Esito reale” è troppo assoluto se il file resta historical

La tabella usa:

```text
Esito reale.
```

Meglio, durante `TASK-RECHECK-001`:

```text
Esito del ricontrollo @ b277bd9
```

oppure:

```text
Historical recheck result.
```

Non significa che l’esito
fosse falso al proprio checkpoint.

Significa che non è timeless.

---

# 60. La sezione “Soltanto due task ricevono DA RIAPRIRE” deve essere temporalmente qualificata

Storicamente:

```text
sul ricontrollo b277bd9
→ solo D14 e D17.
```

Come current statement:

```text
non più supportato.
```

Quindi:

```text
Soltanto due task...
```

deve diventare:

```text
Nel ricontrollo b277bd9,
soltanto due task...
```

se si mantiene immutabile il body.

---

# 61. La sezione “quattro strutture assenti” è anch’essa uno snapshot

Il file registra:

```text
IMPL-006
IMPL-007
IMPL-008
IMPL-009
```

come quattro strutture assenti emerse allora.

Gli audit successivi hanno creato:

```text
IMPL-016…031
```

e altri gap.

Quindi non va letta come:

```text
le sole strutture mancanti correnti.
```

Va qualificata:

```text
emerse nel ricontrollo b277bd9.
```

---

# 62. L’ordine tecnico risultante è storico

Sezione 6 contiene:

```text
1 session isolation
2 diagnostic hardening
3 integrity frontend
4 harness recovery
5 circumscribed fixes
6 user decisions
```

Successivamente il progetto
ha eseguito altri audit e approvato
molte più strutture.

Il root corrente dice:

```text
next task
→ DA SELEZIONARE.
```

Quindi l’ordine del file
non deve sembrare
il current execution queue.

Rientra in:

```text
TASK-RECHECK-001.
```

---

# 63. Non cancellare l’ordine storico

È utile per capire:

```text
quale priorità emerse
dal primo ricontrollo D.
```

La soluzione è:

```text
historical label
```

non:

```text
rimozione.
```

---

# 64. D5 dimostra perché una recertificazione deve avere un trigger di invalidazione

Sul b277bd9
il review poteva concludere:

```text
matchedTotal separation confirmed.
```

Poi un audit più profondo
trova:

```text
marketTotal / runnerCount fallback.
```

Questo non significa necessariamente
che il reviewer precedente abbia inventato.

Significa:

```text
evidence depth changed.
```

Serve quindi un meccanismo di:

```text
supersededBy.
```

---

# 65. D10 dimostra perché il trigger non può essere soltanto “file modificato”

Un finding successivo
può emergere anche:

```text
senza una modifica al codice
dopo il vecchio review.
```

Perché un audit più profondo
può scoprire una proprietà
che la prima passata non aveva verificato.

Quindi:

```text
task recheck invalidation
```

deve avvenire quando esiste:

```text
new conflicting evidence
```

non soltanto:

```text
git diff touching same file.
```

---

# 66. Questo principio è importante per tutto il progetto

Regola suggerita:

```text
historical task certification
→ remains historical

new audit finding in same declared scope
→ current status becomes needs_reconciliation

current status changes
→ only after explicit review
```

Non promuovere automaticamente:

```text
finding exists
→ whole task failed.
```

---

# 67. `TASK-RECHECK-002` deve essere una review task, non una mega-implementation

Scope:

```text
status
evidence refs
current counts
Todo synchronization.
```

Fuori scope:

```text
fixare DATA-001
fixare RUNTIME-009
fixare JOURNAL-REC
fixare LOCAL-PBP
fixare retention.
```

Questi interventi appartengono
ai propri owner.

---

# 68. La Todo deve poter rappresentare historical e current senza duplicare le schede

Possibile sintesi:

```text
D10
historical @ b277bd9:
CONFERMATA

current:
DA RIAPRIRE PARZIALMENTE

owner:
RUNTIME-009 / LIVE-CTRL-002
```

Oppure usare un marker:

```text
SUPERSEDED
```

purché il metodo lo definisca.

Non introdurre un nuovo status
senza coordinare:

```text
METHOD-EVIDENCE-001
METHOD-REG-001.
```

---

# 69. Non usare checkbox per nascondere la divergenza

Una riga:

```text
[x] D10 — CONFERMATA
```

non può restare l’unico stato sintetico
se esiste poi:

```text
RUNTIME-009
→ concrete discrepancy in Stop scope.
```

La checkbox può significare:

```text
review D10 completed
```

ma il bold state deve descrivere
la current task state.

Questo è coerente
con la regola generale della Todo:

```text
checkbox
≠
state authority.
```

---

# 70. D14 mostra già il modello corretto di riapertura circoscritta

Il file non annulla:

```text
journal
recovery
integrity backend
Evidence degradation.
```

Riapre soltanto:

```text
frontend/cross-layer.
```

Lo stesso pattern va applicato
a D5/D9/D10/D11/D12/D13/D16.

---

# 71. D17 mostra lo stesso pattern

Riapre:

```text
serializer pubblico
cache key
error response
capture completion
```

e preserva:

```text
APP_KEY config
existing redaction
tracking capture disabled.
```

Questo modello è corretto.

---

# 72. D12 non deve essere protetta solo perché una grande Task 6 fu implementata con molti test

La presenza di:

```text
commit journal
test
recovery integration
```

non rende impossibile
trovare in seguito:

```text
blind residual cleanup
semantic target verification gap
integrity unknown collapse.
```

Quindi:

```text
molti test
≠
task immutabilmente confermata.
```

---

# 73. D9 non deve essere protetta solo perché il launcher funzionava nel flusso normale

Il finding working-copy-aware
riguarda un confine di authority
che può non emergere
nel normale avvio singolo.

Questo è esattamente
il tipo di issue
che un audit successivo
deve poter usare per supersedere
una vecchia recertificazione.

---

# 74. D16 non deve essere protetta solo perché il calcolo numerico produce output

Il problema:

```text
current game authority
```

e:

```text
writer bypass
```

non equivale a:

```text
formula localContext sbagliata.
```

Ma ricade comunque
nel contratto di robustezza
della feature V1.

Quindi:

```text
reopen circumscribed
```

è il risultato più preciso.

---

# 75. D18 non deve essere promossa a DA RIAPRIRE solo per qualsiasi miglioria

Il report 036 trova:

```text
partial apply semantics
backup boundary
per-cache cap semantics.
```

La utility core:

```text
standalone
allow-list
dry-run
apply confirmation
```

resta presente.

Quindi:

```text
CONFERMATA CON LIMITI
```

resta una classificazione sostenibile.

Questo mostra che il reconciliation
non deve essere meccanico.

---

# 76. D6 richiede una decisione prudente nella review esecutiva

Per D6 esistono finding
nel mapping/identity contract.

La review deve decidere:

```text
CONFERMATA CON LIMITI
```

oppure:

```text
DA RIAPRIRE PARZIALMENTE
```

in base al confine originale Task 2D.

Il report 048 propone:

```text
DA RIAPRIRE PARZIALMENTE
```

perché:

```text
duplicate API selection identity
```

tocca direttamente l’affidabilità
del mapping runner.

Ma la review può scegliere
lo stato meno forte
se dimostra che quel caso
era esplicitamente fuori scope.

---

# 77. Il report 048 non chiude nessun finding tecnico

Non modifica:

```text
GRAPH-URL-*
LOCAL-RUNTIME-*
RUNTIME-009
STORAGE-TH-*
JOURNAL-REC-*
LOCAL-PBP-*
RETENTION-*.
```

Restano tutte task indipendenti.

---

# 78. Aspetti corretti da preservare integralmente

```text
1. SHA b277bd9 esplicito;
2. suite non rieseguite esplicito;
3. flusso contratto → codice → test → live → docs → finding;
4. sei esiti ammessi;
5. non usare DA RIAPRIRE per proposal future;
6. riaprire solo sotto-perimetro difettoso;
7. D1 Source Identity con limiti;
8. D2 frontend Source Identity con limiti;
9. D3 technical sample != finished;
10. D4 runtime technical health separation;
11. D7 Money Flow UI non direzionale;
12. D8 live validation con limiti;
13. D14 riapertura frontend/cross-layer;
14. D15 Evidence degradation distinta da D14;
15. D17 riapertura diagnostics;
16. D18 core utility con limiti;
17. IMPL-006…009 come strutture emerse allora;
18. ordine tecnico non autorizza modifiche;
19. nessun codice/docs modificato nel blocco D;
20. nessuna suite eseguita nel blocco D.
```

---

# 79. Aspetti da correggere

```text
TASK-RECHECK-001 — HIGH
→ historical snapshot vs current task status

TASK-RECHECK-002 — CRITICAL
→ reconciliation D1–D18
  con audit successivi
→ current counts
→ Todo synchronization
```

---

# 80. Finding esistenti da NON duplicare

## `METHOD-EVIDENCE-001`

Possiede:

```text
implementation
offline verification
live verification
provenance
```

Il report 048 deve consumarne il modello,
non crearne uno parallelo.

---

## `PLAN-AUDIT-001`

Possiede:

```text
historical plan vs current audit authority.
```

`TASK-RECHECK-001` è specifico
agli stati delle task D1–D18.

---

## `PLAN-AUDIT-003`

Possiede:

```text
activity complete vs exhaustive coverage.
```

Qui la questione è:

```text
historical task result vs superseding evidence.
```

---

## `GRAPH-URL-*`

Possiedono i bug/contract Graph.

---

## `LOCAL-RUNTIME-*`

Possiedono launcher/runtime issues.

---

## `RUNTIME-009` / `LIVE-CTRL-002`

Possiedono Stop partial completion.

---

## `STORAGE-TH-*`

Possiedono timeline/history issues.

---

## `JOURNAL-REC-*`

Possiedono journal/recovery issues.

---

## `LOCAL-PBP-*`

Possiedono Context/PBP issues.

---

## `RETENTION-*`

Possiedono retention issues.

---

# 81. Verification matrix proposta

## A. Historical identity

```text
D1–D18 historical baseline
→ b277bd9
```

---

## B. Historical test state

```text
suite not rerun
```

must remain visible.

---

## C. Current audit SHA

Current overlay must record:

```text
lastReviewedSha
```

separate from historical SHA.

---

## D. D1

Confirm:

```text
historical C-with-limits
current owner refs
```

---

## E. D2

Same.

---

## F. D3

No reclassification
without direct contrary evidence.

---

## G. D4

No reclassification
without scope binding.

---

## H. D5

Verify current code
does/does not contain:

```text
marketTotalMatched / runnerCount
```

before final status update.

---

## I. D6

Verify:

```text
GRAPH-URL-001…004
```

against original 2D scope.

---

## J. D7

Preserve UI/non-directional scope.

---

## K. D8

Historical validation state
must remain evidence-scoped.

---

## L. D9

Review:

```text
LOCAL-RUNTIME-001…007
```

against launcher Task 2 contract.

---

## M. D10

Verify current public Stop:

```text
pythonCleanup.ok false
→ does top-level still return ok true?
```

Current audited answer:

```text
yes.
```

---

## N. D11

Review:

```text
invalid_json
invalid_shape
ambiguous target
```

against Timeline Task 4 scope.

---

## O. D12

Review:

```text
residual cleanup
semantic target verification
repair payload
integrity unreadable
```

against Task 6.

---

## P. D13

Review recovery core,
not only test harness.

---

## Q. D14

Confirm frontend wiring remains open.

---

## R. D15

Test conditional degradation separately
from integrity detection authority.

---

## S. D16

Review:

```text
LOCAL-PBP-001…008
```

---

## T. D17

Keep current reopen
until underlying owners close.

---

## U. D18

Expand limits with:

```text
RETENTION-001…003
```

without automatic full reopen.

---

## V. Counts

Derive:

```text
historical counts
```

and:

```text
current counts
```

separately.

---

## W. Todo

Do not show a single
unqualified current status
copied from b277.

---

## X. Registry checker

After changes:

```text
0 errors
0 warnings.
```

---

## Y. Link checker

Run.

---

## Z. Fast profile

Run.

---

## AA. Diff

```text
git diff --check
→ PASS.
```

---

# 82. Modularizzazione

## Dimensione

```text
1129 righe
```

Il file è lungo,
ma la responsabilità è unica:

```text
una sola campagna di ricontrollo
D1–D18
sulla stessa baseline.
```

Separarlo per dominio:

```text
Source Identity
Money Flow
Storage
Frontend
Diagnostics
```

farebbe perdere la funzione:

```text
recertification campaign snapshot.
```

Inoltre i veri owner tecnici
esistono già altrove.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
04-task-completate-runtime.md
04-task-completate-storage.md
...
```

---

# 83. Una overlay corrente non richiede un nuovo file

Per non aumentare gli owner,
si può usare:

```text
sezione finale
→ Supersession/current overlay
```

oppure:

```text
Todo
→ current status
04-task-completate
→ historical result + pointer.
```

Non è necessario
un nuovo documento canonico.

---

# 84. Ordine consigliato

```text
1. TASK-RECHECK-001
   → congelare semanticamente
     il ricontrollo b277 come storico

2. TASK-RECHECK-002
   → current overlay D1–D18

3. verificare almeno
   D5 D6 D9 D10 D11 D12 D13 D16 D18

4. aggiornare Todo
   con historical/current distinction

5. non modificare owner tecnici

6. registry checker

7. link checker

8. fast

9. git diff --check
```

---

# 85. Decisione finale

```text
implementazioni/04-task-completate.md:

COME SNAPSHOT b277bd9:
AFFIDABILE E UTILE

COME CURRENT STATUS D1–D18:
SUPERATO

IL PROBLEMA NON È:
“il vecchio audit era tutto falso”

IL PROBLEMA È:
“il vecchio audit è rimasto
l’unica sintesi D1–D18
anche dopo nuove prove contrarie”.

NUOVI FINDING:

TASK-RECHECK-001 — HIGH
→ rendere esplicito
  historical checkpoint vs current state

TASK-RECHECK-002 — CRITICAL
→ riconciliare D1–D18
  con audit successivi
→ aggiornare current overlay e Todo
→ non riscrivere retroattivamente b277
→ non duplicare underlying technical owners

MATRICE CORRENTE PRUDENTE PROPOSTA:

CONFERMATA:
D3 D4 D7 D15

CONFERMATA CON LIMITI:
D1 D2 D8 D18

DA RIAPRIRE PARZIALMENTE:
D5 D6 D9 D10 D11 D12 D13 D14 D16 D17

historical counts b277:
9 / 7 / 2

proposed current overlay:
4 / 4 / 10

Nuove task runtime:
0

Riscrittura completa:
NO

Revisione mirata:
SÌ

Modularizzazione:
NO

Nuovi file:
NO

Priorità:
CRITICA per la governance dello stato.
```

Regola fondamentale:

```text
una task può essere
correttamente “confermata”
a un checkpoint,

e successivamente
richiedere riapertura parziale
quando emerge nuova evidenza.

La nuova evidenza
non cancella la storia,

ma deve supersedere
lo stato corrente.
```

---

# 86. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-048

Documento:
implementazioni/04-task-completate.md

Nuovi Change ID:
TASK-RECHECK-001
TASK-RECHECK-002

Finding esistenti richiamati:
METHOD-EVIDENCE-001
PLAN-AUDIT-001
PLAN-AUDIT-003
GRAPH-URL-001…007
LOCAL-PBP-001…008
STORAGE-TH-001…009
JOURNAL-REC-001…010
LOCAL-RUNTIME-001…007
LIVE-CTRL-001…007
BETFAIR-DIAG-001…008
RETENTION-001…003
RUNTIME-009
DATA-001
STORAGE-001…009

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 87. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 48
Da analizzare: 24
Avanzamento: 66,67%

Blocco 048–052:
[✓] 048 implementazioni/04-task-completate.md
[ ] 049 implementazioni/05-audit-docs-planning.md
[ ] 050 implementazioni/06-implementazioni-proposte.md
[ ] 051 implementazioni/99-decisioni-utente.md
[ ] 052 implementazioni/README.md
```

Nuove task non ancora consolidate:

```text
048
→ 2
```

Contatori provvisori:

```text
task precedenti non duplicate: 181
task continuazione consolidate fino a 047: 139
task nuove 048: 2
task complessive note provvisorie: 322
```

Il prossimo documento canonico è:

```text
implementazioni/05-audit-docs-planning.md
```

La mappa e il ledger cumulativi restano invariati fino al report 052.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `TASK-RECHECK-001…002`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
