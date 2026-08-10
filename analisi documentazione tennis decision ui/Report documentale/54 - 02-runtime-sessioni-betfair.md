# Report documentale — `implementazioni/audit-codice/02-runtime-sessioni-betfair.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-054
Sequenza audit: 54/72
Documento analizzato: 02-runtime-sessioni-betfair.md
Percorso documento: implementazioni/audit-codice/02-runtime-sessioni-betfair.md
Percorso report: Report documentale/54 - 02-runtime-sessioni-betfair.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 497f3e7a536a54909a7eaf253dcb80135e497eb0
Dimensione documento: 1057 righe
Tipo: modulo owner dell’audit codice — secondo audit Punti 2 e 3
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
implementazioni/03-audit-codice.md
todo-list-tennis-decision-ui.md
implementazioni/99-decisioni-utente.md
implementazioni/audit-codice/01-rilievi-iniziali.md
implementazioni/audit-codice/03-storage-recovery.md
implementazioni/audit-codice/05-frontend-session-shell.md
implementazioni/audit-codice/06-validazione-e-test.md
implementazioni/audit-codice/07-post-audit-e-migrazione.md

backend/src/routes/match/trackingResponses.js
backend/src/sofa/matchTracker.js
```

Sono stati inoltre coordinati, senza duplicarli, finding già emersi nell’audit documentale corrente:

```text
SOFA-LIVE-001…009
GRAPH-URL-001…007
PY-RUNTIME-001…010
BETFAIR-SCRAPER-001…010
LIVE-CTRL-001…007
BETFAIR-DIAG-001…008
RETENTION-001…003

PLAN-AUDIT-003
METHOD-EVIDENCE-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001
```

GitHub non è stato modificato.

La mappa/JSON `continuazione-048` non viene aggiornata con questo singolo report. Il consolidamento resta previsto alla chiusura del blocco 053–057, salvo diversa istruzione dell’utente.

---

# Esito sintetico

```text
Valore tecnico del modulo:                         ALTO
Punto 2 session authority:                         COERENTE con Todo
Punto 3 Betfair lifecycle:                         COERENTE con Todo
Decisioni approvate:                               COERENTI
Test gap TEST-005…018:                             COERENTI
RUNTIME-002/004/006/007:                           ANCORA APERTI
RUNTIME-009:                                       ANCORA APERTO
RUNTIME-011 rimozione /odds:                       ANCORA APPROVATA
RUNTIME-012 / SECURITY-004 / DATA-001:             ANCORA APERTI
RUNTIME-003/IMPL-015:                              correttamente fuori da questo modulo

Current code Start route:                          contiene gap successivo già owned
Current code Stop route:                           conferma RUNTIME-009
Priorità FRONTEND-003 nel modulo:                  ALTA
Priorità FRONTEND-003 nella Todo:                  CRITICA
Priorità FRONTEND-007 nel modulo:                  MEDIO-ALTA
Priorità FRONTEND-007 nella Todo:                  CRITICA

"COMPLETATO E APPROVATO":                          richiede qualifier locale
Ordine tecnico risultante:                         STORICO, non current queue
"Parti solide":                                    snapshot, poi raffinate da audit successivi
Supersession pointer:                              INSUFFICIENTE

Responsabilità principali:                         2
Baseline Punto 2:                                  dda406c4...
Baseline Punto 3:                                  cf249ad...
Dimensione:                                        1057 righe
Split per responsabilità:                          SÌ

Nuovi finding:                                     2
Nuove task runtime:                                0
Nuove task documentali:                            2
Riscrittura completa:                              NO
Revisione mirata:                                  SÌ
Modularizzazione:                                  SÌ
Priorità complessiva:                              ALTA
```

Conclusione:

```text
IL MODULO NON HA BISOGNO
DI NUOVI BUG RUNTIME.

GLI OWNER PRINCIPALI
SONO ANCORA COERENTI
CON LA TODO.

IL PROBLEMA È DOCUMENTALE:

1. il modulo conserva audit snapshot
   che sono stati successivamente raffinati;
2. alcune priorità owner
   non sono più allineate alla Todo;
3. "COMPLETATO E APPROVATO"
   può essere letto come implementation state;
4. l'ordine tecnico del Punto 3
   è storico, non la queue corrente;
5. due audit con baseline e responsabilità diverse
   vivono nello stesso file.

SERVONO:
- reconciliation/supersession locale;
- split Punto 2 / Punto 3
  con facade stabile.
```

---

# 1. Il modulo contiene due audit formalmente distinti

La prima metà è:

```text
Punto 2
→ tracking
→ Start/Stop
→ generation
→ callback tardive
→ session authority
```

Baseline:

```text
dda406c4a07ae4a1debfcab39db346e47c33c419
```

La seconda metà è:

```text
Punto 3
→ lifecycle Betfair
→ Graph
→ diagnostica
→ concorrenza
→ cleanup
```

Baseline:

```text
cf249ad669347fb06dc69d876d68af591a7f5639
```

Questa differenza di baseline
è già una prova
che non si tratta
di una singola fotografia tecnica.

---

# 2. `COMPLETATO E APPROVATO` si riferisce all’attività di audit

Entrambi i punti riportano:

```text
Stato:
COMPLETATO E APPROVATO
```

ma sotto contengono decine di finding:

```text
CONFERMATO
MANCANTE
RIMOZIONE APPROVATA
```

Quindi semanticamente:

```text
audit point completed
≠
findings fixed
≠
tests passed
≠
live validated.
```

Questa distinzione è coerente
con il progetto,
ma non è dichiarata localmente.

---

# 3. Non apro un nuovo finding generale sulla parola “completato”

La semantica globale:

```text
activity complete
vs exhaustive coverage
```

è già posseduta da:

```text
PLAN-AUDIT-003.
```

Nel report 054 il problema è più stretto:

```text
questo modulo
non espone chiaramente
la propria temporal authority
e alcuni metadata locali
sono già driftati.
```

---

# 4. Punto 2: RUNTIME-002 resta coerente

Modulo:

```text
RUNTIME-002
→ CONFERMATO E AMPLIATO
→ priorità critica
```

Todo:

```text
RUNTIME-002
→ CONFERMATO
→ priorità critica.
```

Nessuna divergenza.

---

# 5. Punto 2: RUNTIME-004 resta coerente

Modulo:

```text
same eventId
→ callback vecchia
→ gate nuovo
→ contaminazione.
```

Todo:

```text
RUNTIME-004
→ CONFERMATO
→ priorità critica.
```

Nessuna nuova task.

---

# 6. RUNTIME-005 è correttamente una rimozione approvata

Modulo:

```text
/untrack
→ legacy
→ cleanup soltanto logico
→ removal approved.
```

Todo:

```text
RUNTIME-005
→ RIMOZIONE APPROVATA.
```

Non risulta completata,
quindi non va promossa.

---

# 7. RUNTIME-006 è coerente

Modulo:

```text
mismatch stale
→ può fermare sessione corrente.
```

Todo:

```text
RUNTIME-006
→ CONFERMATO
→ priorità critica.
```

Coerente.

---

# 8. RUNTIME-007 è coerente

Modulo:

```text
Betfair active.promise
→ riuso per key/runtime
→ nessuna trackingSessionId.
```

Todo:

```text
RUNTIME-007
→ CONFERMATO
→ priorità critica.
```

Nessun drift.

---

# 9. RUNTIME-008 è coerente

Modulo:

```text
mismatch
→ generation stale
→ Betfair terminato
→ SofaScore non terminato fisicamente.
```

Todo:

```text
RUNTIME-008
→ CONFERMATO
→ priorità alta.
```

Coerente.

---

# 10. RUNTIME-009 è ancora confermato dal codice corrente

Il modulo dichiara:

```text
buildStopMatchResponse()
→ ok:true
→ stopped:true
anche se pythonCleanup.ok è false.
```

Il codice corrente
fa ancora esattamente questo.

Nel catch:

```text
pythonCleanup = {
  ok: false,
  ...
}
```

e la response resta:

```text
httpStatus: 200
body.ok: true
body.stopped: true
body.pythonCleanup
```

Quindi:

```text
RUNTIME-009
→ non è stale.
```

---

# 11. Il report 028 ha già riaperto la stessa root issue in chiave documentale/canonica

Finding già esistente:

```text
SOFA-LIVE-003
```

possiede:

```text
stop logico
vs
cleanup fisico

remaining process/failure
→ no falso successo complessivo.
```

Non aprire un nuovo bug Stop.

---

# 12. RUNTIME-010 resta coerente

Modulo:

```text
Confirm Source Identity
→ eventId soltanto
→ stale confirm può colpire gate nuovo.
```

Todo:

```text
RUNTIME-010
→ CONFERMATO
→ priorità alta.
```

Coerente.

---

# 13. FRONTEND-001 resta coerente

Modulo:

```text
response tardive Sofa/Betfair
→ attraversano cambio sessione
```

Todo:

```text
FRONTEND-001
→ CONFERMATO
→ priorità critica.
```

Coerente.

---

# 14. FRONTEND-003 ha un metadata drift

Nel modulo:

```text
FRONTEND-003
→ Start fallito lascia sessione nascosta
→ priorità alta.
```

Todo corrente:

```text
FRONTEND-003
→ CONFERMATO
→ priorità critica.
```

Quindi:

```text
owner detail
≠
summary current priority.
```

La issue è la stessa,
ma la priorità corrente
è stata elevata.

---

# 15. FRONTEND-005 resta coerente

Modulo:

```text
loop polling vecchio
→ può ricreare timeout dopo cleanup
```

Todo:

```text
FRONTEND-005
→ CONFERMATO
→ priorità critica.
```

Coerente.

---

# 16. FRONTEND-006 resta coerente

Modulo:

```text
Start concorrenti
→ non serializzati.
```

Todo:

```text
FRONTEND-006
→ CONFERMATO
→ priorità alta.
```

Coerente.

---

# 17. FRONTEND-007 ha un secondo metadata drift

Modulo:

```text
FRONTEND-007
→ Stop Live Tracking
  lascia Betfair/Evidence/Source Identity
→ priorità medio-alta.
```

Todo corrente:

```text
FRONTEND-007
→ CONFERMATO
→ priorità critica.
```

Questa è una divergenza reale.

---

# 18. La priorità critica corrente è plausibile nel contratto approvato

La decisione del modulo stesso dice:

```text
Stop Live Tracking
→ ferma tutti i poller live
→ conserva gli ultimi dati
→ UI statica.
```

Un poller live che continua
dopo Stop
non è soltanto UI minore:

```text
contraddice il lifecycle
della sessione.
```

Non è quindi sorprendente
che la Todo abbia elevato
la priorità.

---

# 19. DOC-025 resta coerente

Modulo:

```text
process generation
≠
tracking session authority
≠
command/request identity.
```

Todo:

```text
DOC-025
→ CONFERMATO.
```

Nessuna chiusura falsa.

---

# 20. TEST-002 e TEST-005…009 restano mancanti

Il modulo elenca:

```text
lifecycle frontend
session replacement backend
Betfair reuse session-safe
mismatch cleanup
Stop partial failure
Confirm stale.
```

Todo mantiene:

```text
TEST-002
TEST-005
TEST-006
TEST-007
TEST-008
TEST-009
→ MANCANTI.
```

Coerente.

---

# 21. Le nove decisioni del Punto 2 restano approvate

Tra le altre:

```text
trackingSessionId end-to-end
new Start invalidates old
unified cleanup
remove /untrack
partial Stop explicit
all pollers same authority
Confirm session-bound
single Start command.
```

Queste decisioni
sono state assorbite
dalla famiglia:

```text
DEC-019
IMPL-006
IMPL-025
IMPL-026.
```

Non vanno riscritte
come comportamento già implementato.

---

# 22. Il contratto `trackingSessionId` è target approvato, non current implementation

Il file presenta:

```text
trackingSessionId
commandId
eventId
```

come:

```text
Contratto tecnico risultante.
```

Questo è corretto
se letto come:

```text
contract approved after audit.
```

Non è corretto
se letto come:

```text
current runtime behavior.
```

Serve un qualifier locale.

---

# 23. Il codice corrente conferma che session authority end-to-end non è ancora presente

`trackMatch(...)` corrente:

```text
eventId
→ chiave trackedMatches
→ gate
```

non possiede un parametro:

```text
trackingSessionId.
```

Le callback principali
continuano a catturare:

```text
eventId.
```

Quindi il target approvato
non è ancora current implementation.

---

# 24. Nuova evidence successiva: Start può dichiarare successo quando il tracker rifiuta

Il codice corrente di route:

```text
trackMatch(...)
→ return value ignorato

return:
HTTP 200
ok:true
eventId
```

Il tracker corrente:

```text
if (terminalTrackerBarrier) return null;
if (!eventId) return null;
```

Quindi esiste lo scenario:

```text
terminal barrier attiva
→ trackMatch() rifiuta
→ route continua a rispondere 200 ok:true.
```

---

# 25. Questo problema non è registrato nel Punto 2 originale

Il modulo 054
ha un audit ampio di Start,
ma non contiene questa specifica issue.

Non è un errore metodologico
dell’audit storico:

```text
è una evidenza
emersa successivamente.
```

---

# 26. Il problema è già owned da SOFA-LIVE-002

Report 028:

```text
SOFA-LIVE-002
→ nessun HTTP 200 ok:true
  se il tracker rifiuta l’attivazione
→ bounded result
→ test terminal barrier.
```

Quindi il report 054
non apre:

```text
RUNTIME-013
```

o altro duplicato.

Deve soltanto
prevedere un supersession pointer.

---

# 27. Anche RUNTIME-009 è stato raffinato successivamente

Il modulo già individua:

```text
partial Stop hidden.
```

Report 028 aggiunge
la distinzione più esplicita:

```text
logical stop
physical cleanup
remaining processes.
```

Owner successivo:

```text
SOFA-LIVE-003
```

La root issue resta la stessa.

---

# 28. RUNTIME-008 è stato raffinato da SOFA-LIVE-004

Modulo:

```text
mismatch non termina fisicamente Sofa.
```

Report 028:

```text
cleanup mismatch fisicamente completo
e osservabile
per child Sofa/Betfair.
```

Non è un nuovo bug.

È una specificazione
più forte della stessa root issue.

---

# 29. RUNTIME-002/004/006/007 sono stati ricondotti alla tracking session authority

Report 028:

```text
SOFA-LIVE-001
```

esplicita:

```text
trackedMatches membership
≠
Python generation
≠
Source Identity bufferGeneration
≠
tracking session authority.
```

Questo è un ottimo
supersession pointer
per il Punto 2.

---

# 30. Questi riferimenti successivi non devono sostituire il Punto 2

Il Punto 2
resta utile come:

```text
origine delle issue runtime
e delle decisioni.
```

La soluzione corretta è:

```text
snapshot/audit baseline
+
pointer a evidence successiva.
```

Non:

```text
riscrivere tutta la storia
con i finding 2026-08.
```

---

# 31. Punto 3: parser Graph runtime — nucleo valido

Il modulo dichiara solido:

```text
https
graphs.betfair.it
no credentials
no port
path /market/selection/0
reject runnerChartData
market coherence
selection identity
duplicate rejection.
```

Il nucleo parser
resta una base corretta.

---

# 32. Gli audit documentali successivi hanno però raffinato il boundary

Report 027 ha aperto:

```text
GRAPH-URL-001
→ missing upstream market identity
  vs real mismatch

GRAPH-URL-002
→ duplicate API selection identity
  fail-closed

GRAPH-URL-003
→ query/fragment canonicalization

GRAPH-URL-004
→ Graph loop integration.
```

Quindi:

```text
"Parser Graph runtime solido"
```

deve essere letto
come:

```text
nucleo parser verificato
al Punto 3
```

non come:

```text
l'intera Graph URL pipeline
è completamente chiusa.
```

---

# 33. Non apro nuove task Graph

I relativi owner sono già:

```text
GRAPH-URL-001…007.
```

Il report 054
deve solo coordinare
la lettura temporale.

---

# 34. Graph Health/status-only resta una parte solida ma bounded

Il modulo distingue:

```text
ok
partial_graph_success
auth_suspected
bad_graph_url
temporary_error
unavailable
finished.
```

e preserva snapshot
nel caso Graph login status-only.

Gli audit successivi
hanno però chiesto
di qualificare la source
del `finished`.

---

# 35. Il `finished` authoritative è stato raffinato dopo

Report 028:

```text
SOFA-LIVE-007
```

richiede che:

```text
hasFinished ricevuto
≠
finished authoritative
```

finché il producer Betfair
non è irrobustito.

Owner Betfair:

```text
BETFAIR-SCRAPER-006.
```

Quindi la classificazione locale
non va cancellata,
ma il current authority
deve puntare ai finding successivi.

---

# 36. RUNTIME-011 resta coerente

Modulo:

```text
/api/betfair/odds
→ secondo ingresso mutante
→ rimozione approvata
→ priorità critica.
```

Todo corrente:

```text
RUNTIME-011
→ RIMOZIONE APPROVATA
→ priorità critica.
```

Coerente.

---

# 37. RUNTIME-012 resta coerente

Modulo:

```text
manca arbitro globale
per login/tracking/diagnostics.
```

Todo:

```text
RUNTIME-012
→ CONFERMATO
→ priorità critica.
```

Coerente.

---

# 38. SECURITY-004 resta coerente

Modulo:

```text
local control plane
→ loopback
→ CORS/Origin/Host
→ no mutating GET.
```

Todo:

```text
SECURITY-004
→ CONFERMATO
→ priorità critica.
```

Coerente.

---

# 39. CODE-002 resta coerente

Modulo:

```text
un solo validatore Betfair backend-owned.
```

Todo:

```text
CODE-002
→ CONFERMATO
→ validatore unico approvato.
```

Nessuna falsa implementazione.

---

# 40. CODE-006 resta coerente

Modulo:

```text
preflight Graph
≠
runtime Graph grammar.
```

Todo:

```text
CODE-006
→ CONFERMATO
→ parità approvata.
```

Coerente.

---

# 41. CODE-007 resta coerente

Modulo:

```text
/latest
→ cdpUrl da query
→ probe non session-owned.
```

Todo:

```text
CODE-007
→ CONFERMATO
→ session-owned approvato.
```

Coerente.

---

# 42. DATA-001 resta coerente e critical

Modulo:

```text
marketTotalMatched / runnerCount
→ dato sintetico
→ rimozione approvata
→ priorità critica.
```

Todo:

```text
DATA-001
→ RIMOZIONE APPROVATA
→ priorità critica.
```

Current code era già stato verificato
nel report 048
come ancora contenente il fallback.

Quindi:

```text
decisione approvata
≠
fix completato.
```

---

# 43. DATA-002 resta coerente

Modulo:

```text
API/Graph
→ fusion senza acquisition timestamps/skew.
```

Todo:

```text
DATA-002
→ CONFERMATO
→ priorità alta.
```

Coerente.

---

# 44. PYTHON-001 resta coerente

Modulo:

```text
network capture tasks
→ create_task
→ non tracked/drained/cancelled.
```

Todo:

```text
PYTHON-001
→ CONFERMATO.
```

Coerente.

---

# 45. SECURITY-001/003 restano coerenti

Modulo:

```text
dump_dir/raw detail
→ oltrepassano HTTP boundary.
```

Todo:

```text
SECURITY-001
→ priorità alta

SECURITY-003
→ confermato.
```

Nessuna falsa chiusura.

---

# 46. SECURITY-002 resta coerente

Modulo:

```text
URL-sanitized cache filename
→ fragments
→ collisions
→ missing runtime/Graph identity.
```

Todo:

```text
SECURITY-002
→ CONFERMATO
→ priorità alta.
```

Coerente.

---

# 47. SECURITY-005 resta una rimozione condizionata

Modulo:

```text
--no-sandbox
--disable-setuid-sandbox
--ignore-certificate-errors

→ rimuovere dal default
→ salvo necessità dimostrata.
```

Todo ripete:

```text
RIMOZIONE APPROVATA
SALVO NECESSITÀ DIMOSTRATA.
```

Coerente.

---

# 48. CLEANUP-002 resta coerente

Modulo:

```text
apply
→ lock + porte 3000/3001
→ authority insufficiente.
```

Todo:

```text
CLEANUP-002
→ CONFERMATO.
```

Gli audit successivi
hanno raffinato il problema
con `RETENTION-*`
e `LOCAL-RUNTIME-*`.

Non duplicare.

---

# 49. CLEANUP-003 resta coerente

Modulo:

```text
log
network dump
→ no retention distinta.
```

Todo:

```text
CLEANUP-003
→ CONFERMATO
→ priorità medio-alta.
```

Coerente.

---

# 50. TEST-010…018 restano mancanti

Todo mantiene:

```text
TEST-010
TEST-011
TEST-012
TEST-013
TEST-014
TEST-015
TEST-016
TEST-017
TEST-018
→ MANCANTI.
```

Nessun overclaim.

---

# 51. Le strutture IMPL-016…018 sono correttamente definite come sintesi

Il modulo usa:

```text
Sintesi IMPL-016
Sintesi IMPL-017
Sintesi IMPL-018
```

e non owner card duplicate.

Questo riallineamento
era stato fatto appositamente
per evitare ownership concorrente.

Da preservare.

---

# 52. Non convertire queste sintesi in owner card

Gli owner reali
vivono nei moduli:

```text
implementazioni/implementazioni-proposte/
```

Il report 054
non deve creare:

```text
second owner IMPL-016
second owner IMPL-017
second owner IMPL-018.
```

---

# 53. L’ordine tecnico risultante non è più la queue corrente

Il file conclude:

```text
IMPL-015
→ IMPL-006
→ IMPL-017
→ rimozione /odds
→ IMPL-016
→ ...
```

Questo era l’ordine tecnico
risultante dal Punto 3.

---

# 54. IMPL-015 è oggi già completata

Current root/Todo:

```text
IMPL-015
→ COMPLETATA.
```

Quindi l’ordine non può essere letto
come una queue non ancora iniziata.

---

# 55. Il root corrente dice esplicitamente che il prossimo passo è da selezionare

Current registry:

```text
Prossimo passo:
DA SELEZIONARE.
```

e propone aree,
non una sequenza obbligatoria.

Quindi il blocco:

```text
Ordine tecnico risultante
```

deve essere qualificato:

```text
ordine approvato
al checkpoint del Punto 3.
```

---

# 56. Non riscrivere l’ordine con la priorità di oggi

Sarebbe storia retroattiva.

Correzione:

```text
preservare ordine storico
+
pointer alla Todo/current root.
```

---

# 57. `AUDIT-CODE-P23-001` — riallineare temporal authority, supersession e metadata

**Priorità:** high  
**Tipo:** historical audit authority / registry metadata drift

## Problema

Il modulo contiene due audit snapshot
ancora presentati con:

```text
COMPLETATO E APPROVATO
Parti solide
Contratto risultante
Ordine tecnico risultante
```

senza una nota globale
che distingua:

```text
audit result
approved target
current implementation
current priority
later evidence.
```

Inoltre:

```text
FRONTEND-003
module priority → alta
Todo priority → critica

FRONTEND-007
module priority → medio-alta
Todo priority → critica.
```

E sono emerse
evidenze successive già owned:

```text
SOFA-LIVE-001…009
GRAPH-URL-001…007
```

che raffinano
le parti storicamente dichiarate solide.

## Azione

Aggiungere in testa
una nota equivalente a:

```text
Punto 2 e Punto 3
sono audit snapshot
sulle baseline indicate.

"COMPLETATO E APPROVATO"
significa:
audit completato
e decisioni del checkpoint approvate.

Non significa:
tutti i finding risolti
o target implementati.

Per current status:
Todo + owner correnti.
```

Aggiungere un breve
`Supersession / evidence successiva`:

```text
Punto 2
→ SOFA-LIVE-001…009
→ LIVE-CTRL-*
→ frontend owner correnti

Punto 3
→ GRAPH-URL-001…007
→ BETFAIR-SCRAPER-*
→ BETFAIR-DIAG-*
→ RETENTION-*.
```

Riallineare
almeno le priorità:

```text
FRONTEND-003 → critica
FRONTEND-007 → critica
```

oppure,
se si vuole congelare
il metadata storico,
separare esplicitamente:

```text
priority_at_checkpoint
current_priority.
```

Qualificare:

```text
Contratto tecnico risultante
→ target approvato

Ordine tecnico risultante
→ ordine storico del checkpoint.
```

---

# 58. Non duplicare SOFA-LIVE-002

Il bug:

```text
trackMatch returns null
but route returns 200
```

è già owner di:

```text
SOFA-LIVE-002.
```

`AUDIT-CODE-P23-001`
deve soltanto
renderlo raggiungibile
come evidence successiva.

---

# 59. Non duplicare SOFA-LIVE-003/004

Analogamente:

```text
Stop partial
mismatch physical cleanup
```

hanno già owner successivi.

Il modulo 054
resta il record storico
dell’origine `RUNTIME-008/009`.

---

# 60. Non duplicare GRAPH-URL-001…007

Il core Graph del Punto 3
resta storico.

I refinement successivi
restano nei finding Graph
già aperti.

---

# 61. Non riaprire WORKFLOW-004 come stessa task

`WORKFLOW-004` fu completata
come controllo di drift
dei registri allora esistenti.

Qui esiste un nuovo drift
successivo e locale.

La nuova task deve correggere:

```text
questa Parte 2
```

senza dichiarare fallita
l’intera implementazione
di `WORKFLOW-004`.

---

# 62. Il modulo ha due responsabilità semanticamente autonome

## A — Session authority

Include:

```text
RUNTIME-002
RUNTIME-004…010
FRONTEND-001/003/005/006/007
DOC-025
TEST-002
TEST-005…009
trackingSessionId
commandId
Start sequence
no-gate semantics.
```

## B — Betfair runtime/control plane

Include:

```text
RUNTIME-011/012
SECURITY-001…005
CODE-002/006/007
DATA-001/002
PYTHON-001
CLEANUP-002/003
IMPL-016…018 summaries
TEST-010…018
Graph
capture
cache
retention.
```

---

# 63. Le due responsabilità usano anche baseline diverse

```text
Session authority
→ dda406c4...

Betfair
→ cf249ad...
```

Questo è un segnale
forte per lo split.

---

# 64. Le dipendenze di lettura sono differenti

Per session authority:

```text
matchTracker
trackingResponses
Source Identity Gate
python registry
App
polling hooks.
```

Per Betfair:

```text
betfair routes
scraper lifecycle
processor
Graph parser
Python scraper
cache
capture
control plane
cleanup.
```

Non è utile
caricare entrambi
per una singola correzione.

---

# 65. La dimensione rafforza, ma non determina, lo split

Documento:

```text
1057 righe.
```

Non supera da solo
una soglia rigida.

Ma:

```text
due audit point
due baseline
due famiglie owner
due test matrix
due decision sets
```

rendono lo split
semanticamente giustificato.

---

# 66. `AUDIT-CODE-P23-002` — dividere Punto 2 e Punto 3 mantenendo facade stabile

**Priorità:** medium-high  
**Tipo:** modularization / context boundary

## Azione

Mantenere:

```text
implementazioni/audit-codice/02-runtime-sessioni-betfair.md
```

come facade stabile.

Creare:

```text
implementazioni/audit-codice/02-runtime-sessioni-betfair/
├── 01-session-authority-start-stop.md
└── 02-betfair-lifecycle-control-plane.md
```

---

# 67. Child 1 — session authority

Contenuto:

```text
Punto 2
baseline dda406c4
RUNTIME-002
RUNTIME-004…010
FRONTEND-001
FRONTEND-003
FRONTEND-005…007
DOC-025
TEST-002
TEST-005…009
decisioni
trackingSessionId
commandId
Start sequence
no-gate.
```

---

# 68. Child 2 — Betfair lifecycle/control plane

Contenuto:

```text
Punto 3
baseline cf249ad
Graph parser/health
RUNTIME-011/012
SECURITY-001…005
CODE-002/006/007
DATA-001/002
PYTHON-001
CLEANUP-002/003
IMPL-016…018 summaries
TEST-010…018
decisioni
ordine tecnico storico.
```

---

# 69. Il facade deve essere breve

Il facade può contenere:

```text
titolo
scope
mappa 2 child
baseline di ciascun child
current-status pointer
supersession pointer
navigation Parte 1 / Parte 3.
```

Non deve duplicare
le owner card.

---

# 70. Il link dalla Parte 1 resta stabile

Parte 1 punta a:

```text
02-runtime-sessioni-betfair.md
```

che resta esistente.

Nessuna rinumerazione
delle Parti 1–7.

---

# 71. Il link verso Parte 3 resta stabile

Facade 02 continua
a puntare:

```text
03-storage-recovery.md.
```

Lo split interno
non modifica la sequenza principale.

---

# 72. Nessun ID deve essere rinumerato

Vincolo:

```text
RUNTIME
FRONTEND
SECURITY
CODE
DATA
PYTHON
CLEANUP
DOC
TEST
```

restano identici.

---

# 73. Nessuna owner card deve essere duplicata

Dopo lo split:

```text
ogni heading owner
vive in un solo child.
```

Il facade
deve usare solo summary/link.

---

# 74. Le sintesi IMPL devono restare sintesi

Non trasformarle
in owner card.

Usare eventualmente:

```text
Sintesi IMPL-016
Sintesi IMPL-017
Sintesi IMPL-018.
```

---

# 75. Verification matrix — P23-001

```text
[ ] banner audit snapshot
[ ] meaning of COMPLETATO E APPROVATO clarified
[ ] target approved != implemented
[ ] current status pointer → Todo
[ ] FRONTEND-003 current priority reconciled
[ ] FRONTEND-007 current priority reconciled
[ ] SOFA-LIVE supersession pointer
[ ] GRAPH-URL supersession pointer
[ ] Betfair scraper/diagnostic pointer
[ ] Ordine tecnico marked historical
[ ] no owner status falsely closed
[ ] no technical task duplicated
```

---

# 76. Verification matrix — P23-002

```text
[ ] facade path preserved
[ ] child Punto 2 created
[ ] child Punto 3 created
[ ] all content preserved
[ ] baseline Punto 2 preserved
[ ] baseline Punto 3 preserved
[ ] all IDs unique
[ ] no owner duplicated
[ ] Parte 1 navigation valid
[ ] Parte 3 navigation valid
[ ] registry checker PASS
[ ] link checker PASS
[ ] fast PASS
[ ] git diff --check PASS
```

---

# 77. Modularizzazione obbligatoria

```text
modularization_reviewed: true
split_required: true
proposed_files:
  - implementazioni/audit-codice/02-runtime-sessioni-betfair/01-session-authority-start-stop.md
  - implementazioni/audit-codice/02-runtime-sessioni-betfair/02-betfair-lifecycle-control-plane.md
```

Il file:

```text
implementazioni/audit-codice/02-runtime-sessioni-betfair.md
```

resta come facade.

---

# 78. Non aprire nuovi documenti canonici

I child proposti
sono registri sotto:

```text
implementazioni/
```

e non:

```text
docs/tennis-decision-ui/.
```

La conta canonica 72
non viene modificata
finché non avviene
la ristrutturazione reale
e non si aggiorna
l’inventario ufficiale.

---

# 79. Aspetti corretti da preservare integralmente

```text
1. RUNTIME-002 critical;
2. same-event session contamination;
3. remove /untrack;
4. stale mismatch;
5. Betfair promise reuse issue;
6. mismatch Sofa physical cleanup;
7. Stop partial failure;
8. stale Source Identity confirm;
9. late frontend responses;
10. Start failure hidden session;
11. orphan poll loops;
12. concurrent Start;
13. Stop all pollers target;
14. process generation != session;
15. TEST-005…009 gaps;
16. trackingSessionId target;
17. commandId target;
18. eventId != session;
19. no-gate stale target;
20. Graph parser core;
21. Graph status-only preservation;
22. Betfair single-key barrier;
23. diagnostic redaction helpers;
24. tracking capture disabled;
25. remove /odds;
26. Betfair global command authority;
27. local control plane;
28. shared Betfair validator;
29. Graph parity;
30. CDP session-owned target;
31. remove synthetic runner volume;
32. acquisition timestamps/skew;
33. capture drain;
34. public serialization boundary;
35. cache identity hardening;
36. Chromium flags removal;
37. maintenance authority;
38. log/dump retention;
39. IMPL-016…018 as summaries;
40. TEST-010…018 gaps.
```

---

# 80. Aspetti da correggere

```text
AUDIT-CODE-P23-001 — HIGH
→ temporal authority
→ current metadata drift
→ supersession pointers
→ historical order qualifier

AUDIT-CODE-P23-002 — MEDIUM-HIGH
→ split Punto 2 / Punto 3
→ facade stabile
```

---

# 81. Finding esistenti da NON duplicare

```text
SOFA-LIVE-001…009
GRAPH-URL-001…007
PY-RUNTIME-001…010
BETFAIR-SCRAPER-001…010
LIVE-CTRL-001…007
BETFAIR-DIAG-001…008
RETENTION-001…003
PLAN-AUDIT-003
METHOD-EVIDENCE-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001
```

---

# 82. Nuovo finding — AUDIT-CODE-P23-001

**Titolo:** Riallineare snapshot, priorità e supersession del modulo Runtime/Betfair  
**Priorità:** high  
**Tipo:** historical audit authority / registry metadata drift

### Evidence minima

```text
FRONTEND-003:
modulo → alta
Todo → critica

FRONTEND-007:
modulo → medio-alta
Todo → critica

Start:
trackMatch può restituire null
route ignora return
→ 200 ok:true
→ SOFA-LIVE-002 già owner

Ordine tecnico:
inizia da IMPL-015
oggi già completata
→ non current queue
```

### Criterio

Il modulo resta
record storico dell’audit,
ma non produce
metadata correnti divergenti
o false impression
di implementation completion.

---

# 83. Nuovo finding — AUDIT-CODE-P23-002

**Titolo:** Separare session authority e Betfair lifecycle in due moduli child  
**Priorità:** medium-high  
**Tipo:** modularization / context boundary

### Criterio

```text
facade stabile
2 child
2 baseline
owner ID preservati
zero duplicati
zero perdita contenuto
```

---

# 84. Ordine consigliato

```text
1. AUDIT-CODE-P23-001
   → chiarire temporal authority
   → allineare metadata

2. AUDIT-CODE-P23-002
   → split Punto 2 / Punto 3

3. registry checker

4. link checker

5. fast

6. git diff --check
```

Le due task
possono essere eseguite
nello stesso batch documentale,
ma devono mantenere
acceptance criteria separati.

---

# 85. Decisione finale

```text
implementazioni/audit-codice/02-runtime-sessioni-betfair.md:

CONTENUTO TECNICO:
SOLIDO COME AUDIT RECORD

OWNER PRINCIPALI:
COERENTI CON TODO

NUOVI BUG RUNTIME:
0

NUOVI BUG BETFAIR:
0

CURRENT EVIDENCE:
alcuni finding successivi
raffinano il Punto 2/3
ma hanno già owner

METADATA DRIFT:
FRONTEND-003
alta → critica

FRONTEND-007
medio-alta → critica

TEMPORAL AUTHORITY:
DA CHIARIRE

ORDINE TECNICO:
STORICO
NON CURRENT QUEUE

MODULARIZZAZIONE:
SÌ

FACADE:
02-runtime-sessioni-betfair.md

CHILD:
01-session-authority-start-stop.md
02-betfair-lifecycle-control-plane.md

NUOVI CHANGE ID:
AUDIT-CODE-P23-001
AUDIT-CODE-P23-002

RISCRITTURA COMPLETA:
NO

PRIORITÀ:
ALTA
```

---

# 86. Stato audit dopo report 054

```text
Documenti Markdown totali: 72
Analizzati: 54
Da analizzare: 18
Avanzamento: 75,00%

Blocco 053–057:
[✓] 053 implementazioni/audit-codice/01-rilievi-iniziali.md
[✓] 054 implementazioni/audit-codice/02-runtime-sessioni-betfair.md
[ ] 055 implementazioni/audit-codice/03-storage-recovery.md
[ ] 056 implementazioni/audit-codice/04-evidence-market-reactions.md
[ ] 057 implementazioni/audit-codice/05-frontend-session-shell.md
```

Nuove task non ancora consolidate:

```text
053
→ 2

054
→ 2

blocco 053–054
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

task complessive note provvisorie:
330
```

La mappa/JSON `continuazione-048`
non viene aggiornata
fino alla chiusura del blocco 053–057,
salvo diversa istruzione.

---

# 87. Prossimo documento

```text
055
implementazioni/audit-codice/03-storage-recovery.md
```

Non analizzato in questo report.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `AUDIT-CODE-P23-001`.
- Task ancora aperte: `AUDIT-CODE-P23-002`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
