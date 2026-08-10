# Report documentale — `docs/validations/source-identity-live-verification.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-042
Sequenza audit: 42/72
Documento analizzato: source-identity-live-verification.md
Percorso documento: docs/validations/source-identity-live-verification.md
Percorso report: Report documentale/42 - source-identity-live-verification.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 7757d849e4f83bffb91abd339204512c1c41e6bb
Dimensione documento: 142 righe
Tipo: osservazione live manuale storica Source Identity/frontend
Periodo dichiarato: osservazioni consolidate fino al 4 luglio 2026
SHA della sessione storica: non registrato
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
fonte storica originale:
docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx
blob storico: 18710614226eab2c058c299583b0131e74597115
snapshot storico letto al commit:
0dc87959a052a8b74d0591f89275a9886f49d386

owner corrente Source Identity:
docs/tennis-decision-ui/modules/evidence/02-source-identity.md
blob: 47b0ce95c56ab1107b8b0c5ecdc58a11b8074b1d

owner frontend:
docs/tennis-decision-ui/modules/frontend/01-session-shell.md
blob: 904d3e38d48f335f5540080d328e32718cf5f8ba

frontend/src/App.jsx
blob: 116cd3a9bed4e4a1da84ffdfcbae4572e719ac4d

frontend/src/hooks/useSourceIdentityGateStatus.js
blob: bb4d435ff5d04a0c2a751fd7035351599c3f85f3

frontend/src/hooks/useSourceIdentityGateUi.js
blob: d0d94d6f69d13f9561d1914ea43b0cf98281ad4d

frontend/src/hooks/useLiveTrackingActions.js
blob: f67f358ed25c0e9e02d151b9f29c53515489c352

frontend/src/components/marketReactions/SourceIdentityConfirmationModal.jsx
blob: 0d40d9ea25be3a6cb4db4380da362be7a371abba

backend/src/routes/match/sourceIdentityStatusResponse.js
blob: bcf03e3c4c2e16f58da8f1a6203659f01f820c13

backend/src/sofa/sourceIdentityGate/manualConfirmation.js
blob: 1ab59aef8cd63864ff378850b4b21aba6c285a2a

backend/src/sofa/sourceIdentityGate/lifecycle.test.mjs
blob: 79d2014b25f12bbfe6f0f0db3415422f1db4a218

backend/src/sofa/sourceIdentityGate/bootstrapFailures.test.mjs
blob: f8d9b3ddf40e4af679189a08969240ff076e9efc

backend/src/sofa/sourceIdentityGate/mismatchAndIsolation.test.mjs
blob: d8ecd27e0a6b893ed307ee465b1ebd0721d882dd

backend/src/routes/match/sourceIdentityStatusResponse.test.mjs
blob: 3d050dd8082f7676634948f7be86317aa96bbc12

frontend/src/utils/sourceIdentityGatePresentation.test.mjs
blob: f2cc691fecae22b78c619c4f9a2294d367cf1871

report 028 — Sofa live tracking
report 033 — live tracking control
report 035 — validation and rollback
report 038 — current state
report 039 — validations README
report 040 — Betfair live validation
report 041 — documentation migration finalization
```

Sono stati inoltre richiamati i finding già aperti:

```text
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003
VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006
CURRENT-STATE-003
LIVE-CTRL-002
LIVE-CTRL-004
LIVE-CTRL-006
LIVE-CTRL-007
SOFA-LIVE-001
SOFA-LIVE-004
SOFA-LIVE-009
```

GitHub non è stato modificato.

Questo report chiude il blocco cumulativo:

```text
038–042
```

Dopo la produzione del report vengono quindi aggiornati anche:

```text
mappa-file-markdown-repository-continuazione-023.md
modifiche-audit-markdown-continuazione-023.json
```

senza modificare il primo segmento congelato `1–22`.

---

# Esito sintetico

```text
Fedeltà come report storico:                  ALTA
Separazione live_observed / non eseguito:    ALTA
Prudenza su pending reale:                    ALTA
Prudenza sul limite cross-source:             ALTA
Coerenza con fonte MDX:                       MEDIO-ALTA
Provenance della migrazione:                  ERRATA
Buffering evidence fidelity:                  ERRATA / INFLAZIONATA
Completezza tabella Interpretazione:          PARZIALE
Coerenza con runtime corrente:                BUONA come storico, non current PASS
Offline coverage corrente:                    PRESENTE ma distinta dal live
Privacy/status payload:                       BUONA
Modularizzazione:                             NON necessaria

Nuovi finding:                                3
Nuove task tecniche runtime:                  0
Riscrittura completa:                         NO
Revisione mirata:                             SÌ
Nuovi documenti canonici proposti:            nessuno
Priorità complessiva:                         ALTA
```

La conclusione centrale è:

```text
IL REPORT STORICO SOURCE IDENTITY
È SOSTANZIALMENTE AFFIDABILE.

PRESERVA CORRETTAMENTE:
- collecting → recording osservato;
- mismatch → form osservato;
- restart dopo correzione osservato;
- TopBar Connected con timeline osservata;
- pending reale NON eseguito;
- decline reale NON eseguito;
- limite cross-source NON presentato come live observation.

MA LA MIGRAZIONE HA TRE DIFETTI DOCUMENTALI:

1. il campo “Sorgente migrata” è self-reference;
2. il caso buffering promuove una voce unchecked
   (“nessun errore di polling”)
   a osservazione riferita;
3. la tabella Interpretazione non riepiloga
   tutti gli scenari esplicitamente non verificati.
```

Nessuno dei tre finding richiede modifiche runtime.

---

# 1. Il documento è correttamente classificato come historical validation

La testata corrente dichiara:

```text
Tipo:
Osservazione live manuale

Periodo:
Osservazioni consolidate fino al 4 luglio 2026

SHA:
Non registrato nel documento sorgente

Stato:
Parziale: alcuni flussi osservati,
pending reale non verificato
```

Questa classificazione è corretta.

Non presenta il documento come:

```text
owner tecnico
current PASS
suite automatica
specifica futura
```

Il body ribadisce:

```text
questo documento non definisce
il contratto del gate o della persistenza
```

Da preservare.

---

# 2. `SHA non registrato` è la scelta corretta

La fonte storica MDX non registra lo SHA esatto della working tree della sessione live.

Quindi il file corrente fa bene a mantenere:

```text
SHA
→ Non registrato nel documento sorgente
```

Non ricostruire retroattivamente lo SHA da:

```text
data 4 luglio
commit vicini
mtime
chat
snapshot successivi
```

perché nessuno di questi elementi dimostra quale working tree fosse realmente in esecuzione.

Ownership:

```text
VALID-INDEX-002
VALID-ROLL-001
```

Nessuna nuova task.

---

# 3. Collecting → recording è preservato fedelmente

Fonte MDX:

```text
collecting
→ recording automatico
→ shell immediata
→ semaforo grigio
→ semaforo verde
→ toast verde circa 5 secondi
→ dashboard dopo dashboardContentReady + dashboardData
```

File migrato:

```text
shell immediata
→ indicatore grigio
→ recording/aligned
→ indicatore verde
→ toast verde temporaneo
→ dashboard dopo dashboardContentReady + dashboardData
```

La trasformazione:

```text
“circa 5 secondi”
→ “temporaneo”
```

è prudente e non cambia il significato essenziale.

Il documento conserva inoltre correttamente:

```text
recording/aligned
≠
sblocco diretto della dashboard
```

perché la dashboard storicamente dipendeva anche da:

```text
dashboardContentReady
+
dashboardData
```

---

# 4. Questo fatto storico non va sostituito dal comportamento corrente

L’owner frontend corrente descrive ancora:

```text
sessionShellVisible
→ shell immediata

dashboardContentReady + dashboardData
→ contenuto dashboard
```

ma ciò non serve a “ri-validare” la sessione del 4 luglio.

La validazione resta:

```text
historical live observation
```

Il codice corrente è solo un confronto di coerenza.

---

# 5. Mismatch → form è preservato correttamente

Fonte MDX:

```text
mismatch
→ toast rosso
→ ritorno al form
→ URL e campi preservati
```

File corrente:

```text
mismatch
→ toast rosso
→ ritorno al form
→ campi preservati
```

La perdita della parola:

```text
URL
```

non cambia sostanzialmente l’evidenza perché gli URL erano campi del form, ma durante la correzione di fidelity può essere ripristinata la formula storica più precisa:

```text
URL e campi preservati
```

senza aggiungere nuovi dati.

Non apro un finding separato.

Rientra in:

```text
SOURCE-ID-VAL-002
```

come fidelity review del source→destination.

---

# 6. Restart dopo mismatch è preservato correttamente

Fonte storica:

```text
mismatch
→ correzione link
→ nuovo Start
→ collecting
→ aligned
```

con nota:

```text
toast verde non osservato nel restart
indicatore verde osservato
registrazione osservata
```

File corrente conserva esattamente questa distinzione.

Importante:

```text
non trasformare
“toast verde non osservato”
in
“toast verde funzionante”
```

solo perché il codice corrente contiene oggi una transition detection del toast.

---

# 7. Il codice corrente supporta il toast, ma non cambia il risultato storico

`useSourceIdentityGateUi.js` genera il toast verde quando:

```text
phase === recording
+
sourceIdentity.status === aligned
+
previous phase !== recording
```

Questo è:

```text
supporto statico corrente
```

non:

```text
nuova prova della sessione storica.
```

Il report fa bene a mantenere:

```text
restart toast verde
→ non osservato
```

---

# 8. TopBar Connected con timeline è una osservazione storica reale

Fonte MDX:

```text
2026-07-04
→ Source Identity recording / canonical / aligned
→ TopBar Sofa: Connected
→ timeline disponibile
```

Inoltre la checklist storica marca esplicitamente:

```text
GET /api/match/:eventId/json
→ 200
→ TopBar Sofa: Connected
```

come osservato.

Il file corrente conserva:

```text
Source Identity recording / canonical / aligned
TopBar Sofa: Connected
GET timeline SofaScore disponibile
```

Il significato generale è preservato.

---

# 9. La formula “GET timeline SofaScore disponibile” è però meno precisa dell’endpoint storico

La fonte non dice genericamente:

```text
GET timeline
```

ma registra:

```text
GET /api/match/:eventId/json
→ 200
```

come condizione osservata della TopBar Connected.

Durante la correzione fidelity conviene ripristinare il riferimento preciso:

```text
GET /api/match/:eventId/json → 200
```

oppure evitare di nominare una route diversa/ambigua.

Questo è incluso in:

```text
SOURCE-ID-VAL-002
```

non richiede una quarta task.

---

# 10. Pending reale è correttamente classificato non eseguito

Il file dice:

```text
Non è stata osservata una sessione reale completa con:

phase=pending
→ nomi reali nella modale
→ conferma manuale
→ bootstrap riuscito
→ recording/aligned
→ dashboard
```

Questa è la classificazione corretta.

L’owner Source Identity corrente continua a dichiarare:

```text
pending reale
→ conferma manuale reale
→ recording/aligned

resta da validare live
```

Nessuna contraddizione.

---

# 11. I test offline correnti NON chiudono il pending live

Il runtime corrente possiede test che verificano:

```text
pending sintetico
manual confirmation
bootstrap unico
recording
```

`sourceIdentityGate/lifecycle.test.mjs` verifica per esempio:

```text
validBetfairSamplePending
→ phase pending
→ confirmActiveSourceIdentityGate(...)
→ ok true
→ phase recording
→ bootstrapCount 1
```

Questo è:

```text
TESTED OFFLINE
```

non:

```text
VALIDATED LIVE.
```

La validation fa bene a non promuovere il caso.

---

# 12. Bootstrap failure è testato offline ma non osservato live

Il file storico elenca fra i casi da verificare:

```text
bootstrap fallito
→ gate pending
→ errore sicuro
```

Il runtime corrente ha test automatici che verificano:

```text
phase pending
error = Bootstrap persistence failed
no automatic retry
```

Quindi oggi possiamo dire:

```text
IMPLEMENTED
TESTED OFFLINE
NOT VALIDATED LIVE
```

Non modificare il record storico in:

```text
live_observed
```

solo per il test corrente.

---

# 13. Mismatch con runner estraneo è testato offline ma non va inserito come live observation

La validation dice ancora da verificare:

```text
nessuna modale su runner estraneo e mismatch
```

I test correnti verificano lato gate:

```text
un runner compatibile
+
un runner estraneo
→ mismatch
→ blocked
→ persistence blocked
→ nessun bootstrap
```

Anche qui:

```text
offline test
≠
live observation.
```

---

# 14. Il payload status corrente è bounded e coerente con il limite privacy

`sourceIdentityStatusResponse.js` serializza soltanto:

```text
status
sofaPlayers
betfairRunners
reasons
```

oltre ai campi top-level sicuri del gate.

Non serializza:

```text
URL
marketId
selectionId
raw payload
token
cookie
path locali
```

Questo è coerente con il requisito storico:

```text
assenza URL/marketId/selectionId nella modale
```

ma resta prova statica corrente.

Il caso live resta non eseguito.

---

# 15. La modale corrente usa davvero soltanto i nomi e le reasons

`SourceIdentityConfirmationModal.jsx` riceve:

```text
sourceIdentity
```

e usa:

```text
sofaPlayers
betfairRunners
reasons
```

per:

```text
mapping 1:1
frase di conferma
submit
```

Non legge:

```text
marketId
selectionId
URL
```

Questa coerenza non autorizza a cambiare la validation storica.

---

# 16. Decline reale è correttamente non eseguito

Il file dice:

```text
pending
→ decline
→ stop globale
→ ritorno al form
→ campi preservati
→ nessun toast mismatch
```

non osservato end-to-end.

Corretto.

Il codice corrente collega il pulsante decline a:

```text
stopAndCloseConfirmation
→ stopAndReturnToLinks
→ stopMatchTracking(...)
```

ma questo è soltanto il wiring corrente.

---

# 17. Il current decline path dipende dalla semantica Stop già auditata

`stopAndReturnToLinks()` considera successo:

```text
data?.ok === true
```

Il report 033 ha già aperto:

```text
LIVE-CTRL-002
→ Stop completion semantics
```

perché il backend può avere una cleanup Python non completamente riuscita pur mantenendo top-level success.

Quindi non creare:

```text
SOURCE-ID runtime decline bug
```

come duplicato.

La live validation del decline resta utile proprio perché il path end-to-end non è stato osservato.

---

# 18. Il limite cross-source è correttamente declassato da “live” a “contratto sorgente”

Il file corrente dice:

```text
commit SofaScore riuscito
→ commit Betfair fallito
→ gate torna pending
→ tick SofaScore non rollbackato
```

poi precisa:

```text
Il documento sorgente registrava questo limite
come contratto corrente,
non come evento live riprodotto nella stessa validazione.
```

Questa è una correzione molto buona rispetto alla vecchia collocazione nel runbook.

Da preservare.

---

# 19. Il titolo “Limite noto osservabile” è migliorabile ma non merita una nuova task

La sezione si chiama:

```text
Limite noto osservabile
```

mentre il body chiarisce:

```text
non live reproduced
```

Per evitare ambiguità, durante la normalizzazione `VALID-INDEX-001` si può rinominare:

```text
Limite noto dal contratto sorgente — non riprodotto live
```

oppure equivalente.

Non creo:

```text
SOURCE-ID-VAL-004
```

perché il body già impedisce l’overclaim e il problema appartiene alla tassonomia generale.

---

# 20. Il problema metadata è identico al pattern già trovato nel report Betfair

La testata corrente dice:

```text
Sorgente migrata
→ docs/validations/source-identity-live-verification.md
```

Questo è il file corrente stesso.

Quindi rappresenta:

```text
destination
→ destination
```

anziché:

```text
historical source
→ destination.
```

---

# 21. La fonte storica originale è verificabile

È stato letto al commit storico:

```text
docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx
```

Titolo:

```text
Verifica live Source Identity
```

Il corpo contiene:

```text
collecting → recording
mismatch
restart dopo correzione
TopBar Connected
buffering checklist
pending reale checklist
limite cross-source
```

che corrispondono chiaramente al documento migrato.

Quindi la provenance può essere corretta senza inferenze.

---

# 22. `SOURCE-ID-VAL-001` — correggere la provenance della migrazione

**Priorità:** high  
**Tipo:** historical source provenance  
**Ownership generale:** `VALID-INDEX-002`

## Problema

Attuale:

```text
Sorgente migrata:
docs/validations/source-identity-live-verification.md
```

è self-reference.

## Fonte storica verificata

```text
docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx
```

## Azione

Correggere con formula equivalente a:

```text
Sorgente storica migrata:
docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx
```

Opzionalmente mantenere separato:

```text
Destinazione corrente:
docs/validations/source-identity-live-verification.md
```

## Non fare

Non inventare:

```text
SHA della sessione live
browser version
match/eventId
URL reali
commit della working tree live
```

se non risultano nella fonte.

## Criterio di chiusura

```text
source path storico
→ esiste nel checkpoint pre-migrazione
→ contiene la validation Source Identity
→ destination corrente ne deriva realmente
```

---

# 23. Il problema più importante di fidelity è nel paragrafo buffering

File corrente:

```text
È stato riferito che durante buffering,
con timeline SofaScore non ancora disponibile,
la TopBar mostrava Sofa: In attesa
senza errore di polling.
```

Questa frase presenta come unica osservazione riferita un bundle di condizioni:

```text
buffering
+
timeline non disponibile
+
Sofa: In attesa
+
nessun errore polling
```

Ma la fonte MDX non aveva verificato tutto questo bundle.

---

# 24. Cosa risultava realmente dalla checklist storica

La fonte MDX marcava ancora unchecked:

```text
[ ] backend comunica phase collecting/pending + persistence buffering
[ ] GET /api/match/:eventId/json restituisce 404
[ ] shell visibile
[ ] waiting screen visibile
[ ] TopBar visibile
[ ] badge ambra / tempo —
[ ] polling continua senza SofaScore JSON polling error
```

All’interno della voce:

```text
[ ] TopBar mostra Sofa: In attesa
```

era presente la nota:

```text
Osservazione manuale riportata;
artefatto non archiviato.
```

Quindi il dato riferito era specificamente:

```text
Sofa: In attesa
```

non l’intera checklist.

---

# 25. “Senza errore di polling” è stato promosso da unchecked a historically_reported

Nella fonte:

```text
polling continua senza:
SofaScore JSON polling error
```

era:

```text
[ ]
```

cioè non verificato.

Nel file corrente diventa parte della frase:

```text
È stato riferito ...
senza errore di polling.
```

Questo cambia lo stato probatorio:

```text
not_executed / unchecked
→ historically_reported
```

senza una fonte che lo supporti.

È una vera inflazione dell’evidenza storica.

---

# 26. Anche “timeline non ancora disponibile” va qualificato con prudenza

La fonte voleva verificare esplicitamente:

```text
eventId privo di timeline preesistente
+
GET /api/match/:eventId/json = 404
```

ma quella voce era unchecked.

Quindi la frase corrente:

```text
con timeline SofaScore non ancora disponibile
```

non dovrebbe essere presentata come parte dell’osservazione riferita se non esiste un artifact ulteriore.

Può essere descritta come:

```text
contesto che il runbook intendeva verificare
```

non come fatto osservato.

---

# 27. La correzione deve essere conservativa

Formula supportata dalla fonte:

```text
È stato riferito manualmente che la TopBar mostrava
“Sofa: In attesa”.

Non furono archiviati screenshot, payload o log.

Le condizioni correlate della checklist —
404 della route JSON, assenza di errori di polling,
badge ambra, shell/waiting screen —
non risultavano marcate come verificate.
```

Questo preserva esattamente il livello di evidenza.

---

# 28. `SOURCE-ID-VAL-002` — ripristinare la fidelity storica del buffering e delle route osservate

**Priorità:** high  
**Tipo:** historical migration fidelity  
**Ownership generale:** `VALID-INDEX-001` / `VALID-INDEX-002`

## Azione

Confrontare:

```text
operations/06-source-identity-live-verification.mdx
vs
docs/validations/source-identity-live-verification.md
```

classificando le differenze:

```text
layout-only
safe wording reduction
privacy redaction
duplicate removal
historically_reported
not_executed
material evidence inflation
material evidence omission
```

## Correzioni minime già individuate

### A. Buffering

Togliere dal fatto riferito ciò che era unchecked:

```text
“senza errore di polling”
```

e non presentare il `404`/timeline absence come verificato se non supportato.

### B. Connected

Rendere precisa la route osservata:

```text
GET /api/match/:eventId/json
→ 200
→ Sofa: Connected
```

anziché l’ambiguo:

```text
GET timeline SofaScore disponibile
```

### C. Mismatch

Facoltativamente ripristinare:

```text
URL e campi preservati
```

per aderire alla fonte.

## Criterio di chiusura

Nessuna voce storica cambia stato fra:

```text
live_observed
historically_reported
not_executed
```

per effetto della sola migrazione documentale.

---

# 29. La tabella Interpretazione è utile ma incompleta

Tabella corrente:

```text
collecting → recording                live_observed
mismatch → form                       live_observed
correzione → nuovo Start → aligned    live_observed
TopBar Connected con timeline         live_observed
buffering → In attesa                 reported/not archived
pending reale → confirm               not executed
pending reale → decline               not executed
```

Il body contiene però altri scenari esplicitamente da verificare.

---

# 30. Scenari non verificati assenti dal riepilogo

Il body elenca:

```text
pending prodotto da fonti plausibilmente correlate
nessuna modale su runner estraneo e mismatch
assenza URL/marketId/selectionId nella modale
toast verde una sola volta per transizione
bootstrap fallito → pending + errore sicuro
```

Questi non compaiono nella tabella finale.

---

# 31. Alcuni di questi scenari non sono semplici dettagli del “pending confirm”

Per esempio:

```text
mismatch con runner estraneo
→ nessuna modale
```

appartiene al confine:

```text
mismatch vs pending
```

non al solo confirm path.

Analogamente:

```text
toast una sola volta
```

è un lifecycle UI indipendente.

E:

```text
bootstrap fallito
```

è un failure path distinto dal bootstrap riuscito.

Quindi un lettore della sola tabella perde parte del perimetro storico aperto.

---

# 32. `SOURCE-ID-VAL-003` — completare la tabella Interpretazione

**Priorità:** medium  
**Tipo:** historical scenario summary completeness  
**Ownership generale:** `VALID-INDEX-001`

## Azione

Aggiungere righe o raggruppamenti che mantengano almeno:

```text
pending plausibile prodotto realmente
→ not_executed

mismatch runner estraneo → nessuna modale
→ not_executed live

modal privacy fields
→ not_executed live

recording toast single transition
→ not_executed live per il caso specifico richiesto

bootstrap failure safe pending
→ not_executed live
```

La tabella può restare compatta se usa un gruppo:

```text
pending/mismatch boundary sub-scenarios
→ non eseguiti live
```

ma non deve farli sparire.

## Criterio di chiusura

Ogni scenario esplicitamente classificato nel body come:

```text
live_observed
historically_reported
not_executed
```

è rappresentato o chiaramente ricompreso nella tabella finale.

---

# 33. Non creare una task per “pending live ancora mancante”

Il pending reale non è una scoperta di questo audit.

È già registrato:

```text
owner Source Identity
owner frontend
historical validation
```

come scenario ancora da validare live.

Il report 042 non deve trasformare:

```text
validation pending
```

in:

```text
nuovo bug runtime.
```

---

# 34. Non creare una task runtime per il bootstrap failure

Il bootstrap failure corrente è:

```text
IMPLEMENTED
TESTED OFFLINE
NOT VALIDATED LIVE
```

L’assenza di live validation è già espressa.

Il test automatico corrente verifica:

```text
pending
synthetic safe error
no automatic retry
```

Quindi nessuna nuova implementazione tecnica nasce da questo file.

---

# 35. Non creare una task runtime per mismatch runner estraneo

Il test corrente verifica:

```text
one compatible + one unrelated
→ mismatch
→ blocked
→ no bootstrap
```

La validation storica non l’ha osservato come pending/modal scenario.

Il fatto che oggi sia testato offline non cambia la classificazione live.

---

# 36. Non creare una task privacy per la modale

Il current serializer e la current modal non espongono:

```text
URL
marketId
selectionId
raw payload
```

La live validation non lo ha però osservato in un pending reale.

Quindi:

```text
implementation/static boundary
→ corrente

live observation
→ ancora aperta
```

Nessun nuovo bug privacy emerso.

---

# 37. Non usare il record storico per chiudere `LIVE-CTRL-004`

Il report storico ha osservato:

```text
mismatch
→ form
```

Il report 033/028 ha successivamente evidenziato problemi più profondi sulla cleanup fisica e sulle operazioni in-flight.

Quindi:

```text
UI ritorna al form
```

non prova:

```text
ogni child Sofa fermato
ogni Promise drenata
nessun campione tardivo persistito.
```

Il finding corrente resta aperto.

---

# 38. Non usare il restart storico per chiudere la session authority

Il record dice:

```text
mismatch
→ correzione link
→ nuovo Start
→ aligned
```

Questa è una valida osservazione UX.

Non dimostra:

```text
trackingSessionId end-to-end
invalidazione di ogni callback precedente
nessuna response tardiva
nessuna persistenza cross-session
```

Quindi non chiude:

```text
SOFA-LIVE-001
LIVE-CTRL-006
IMPL-006
```

---

# 39. Non usare “TopBar Connected” per dimostrare l’intera health pipeline

La TopBar Connected osservata significa soltanto:

```text
in quella sessione
→ UI mostrava Connected
→ timeline/JSON era disponibile
```

Non dimostra:

```text
freshness generale
scheduler health
future skew
persistence integrity
session authority
```

Il report storico non lo afferma.

---

# 40. Aspetti corretti da preservare integralmente

```text
1. Tipo = osservazione live manuale.
2. Periodo fino al 4 luglio 2026.
3. SHA = non registrato.
4. Stato complessivo = parziale.
5. Il documento non è owner del gate.
6. collecting → recording = live_observed.
7. shell immediata = osservata.
8. indicatore grigio → verde = osservato.
9. dashboard dipendente da bootstrap/data = osservata.
10. mismatch → toast/form = osservato.
11. campi del form preservati = osservato.
12. restart dopo correzione = osservato.
13. vecchio mismatch toast non persistente = osservato.
14. toast verde nel restart = non osservato.
15. recording/canonical/aligned = osservato.
16. TopBar Sofa Connected = osservata.
17. pending reale confirm = non eseguito.
18. pending reale decline = non eseguito.
19. bootstrap failure live = non eseguito.
20. privacy della modal live = non eseguita.
21. runner estraneo/no modal live = non eseguito.
22. toast single-transition specifico = non eseguito live.
23. cross-source nontransactional = contratto sorgente, non live observation.
24. owner correnti separati dal report storico.
```

---

# 41. Aspetti da correggere

```text
A. provenance self-reference
→ SOURCE-ID-VAL-001

B. buffering observation inflation
→ SOURCE-ID-VAL-002

C. route Connected resa ambigua
→ SOURCE-ID-VAL-002

D. tabella Interpretation incompleta
→ SOURCE-ID-VAL-003

E. heading “Limite noto osservabile”
→ allineabile tramite VALID-INDEX-001,
  senza nuovo Change ID
```

---

# 42. Finding esistenti da NON duplicare

## `VALID-INDEX-001`

Possiede:

```text
historical evidence state taxonomy
scenario-level classification
live_observed
historically_reported
not_executed
```

`SOURCE-ID-VAL-002/003` sono applicazioni artifact-specific.

---

## `VALID-INDEX-002`

Possiede:

```text
validation metadata conformance
known / non registrato / non archiviato
historical source metadata
```

`SOURCE-ID-VAL-001` applica la correzione al file specifico.

---

## `VALID-INDEX-003`

Possiede:

```text
run identity
immutable historical artifacts
new run → new artifact
```

Il file dateless Source Identity può restare storico e immutato dopo la correzione.

Nuove live run non devono essere accodate ambiguamente.

---

## `VALID-ROLL-001`

Possiede:

```text
exact working-tree provenance
```

Lo SHA storico mancante resta:

```text
non registrato.
```

---

## `VALID-ROLL-004`

Possiede:

```text
validation result semantics
workflow state vs runner state
```

---

## `VALID-ROLL-006`

Possiede:

```text
documentation validation coverage matrix
eventuale checker strutturale
```

---

## `CURRENT-STATE-003`

Possiede:

```text
artifact-backed historical validation inventory
```

---

## `LIVE-CTRL-002`

Possiede:

```text
Stop completion semantics
```

Applicabile al decline path corrente.

---

## `LIVE-CTRL-004`

Possiede:

```text
mismatch cleanup remaining / physical quiescence
```

La vecchia UI observation non lo chiude.

---

## `LIVE-CTRL-006`

Possiede:

```text
restart semantics
session isolation
```

---

## `SOFA-LIVE-001`

Possiede:

```text
tracking session authority alignment
```

---

# 43. Nuovi finding

```text
SOURCE-ID-VAL-001 — high
Migration source provenance self-reference

SOURCE-ID-VAL-002 — high
Historical migration fidelity / buffering evidence inflation

SOURCE-ID-VAL-003 — medium
Historical scenario summary completeness
```

Nuove task runtime:

```text
0
```

---

# 44. `SOURCE-ID-VAL-001` — summary

```text
current metadata:
destination → destination

required:
historical source → destination
```

Fonte verificata:

```text
docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx
```

Non inventare SHA live.

---

# 45. `SOURCE-ID-VAL-002` — summary

Correggere la migrazione in modo che:

```text
reported:
Sofa: In attesa
```

non trascini con sé condizioni che erano ancora unchecked:

```text
404
no polling error
shell/waiting visibility
badge amber
```

Preservare inoltre la route osservata:

```text
/api/match/:eventId/json → 200
```

per il caso Connected.

---

# 46. `SOURCE-ID-VAL-003` — summary

La tabella finale deve includere o ricomprendere chiaramente:

```text
pending plausibile
mismatch/no modal
modal privacy
single toast transition
bootstrap failure
```

come:

```text
not_executed live
```

senza trasformare test offline correnti in live evidence.

---

# 47. Correzione documentale consigliata — metadata

Da:

```text
| Sorgente migrata | docs/validations/source-identity-live-verification.md |
```

A equivalente:

```text
| Sorgente storica migrata | docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx |
```

Eventuale campo separato:

```text
| Destinazione corrente | docs/validations/source-identity-live-verification.md |
```

---

# 48. Correzione documentale consigliata — buffering

Da evitare:

```text
È stato riferito che durante buffering,
con timeline non disponibile,
Sofa: In attesa
senza errore polling.
```

Preferibile:

```text
È stato riferito manualmente che la TopBar mostrava
“Sofa: In attesa”.

Non furono archiviati screenshot, payload o log sufficienti.
Le altre condizioni della checklist di buffering,
inclusi il 404 della route JSON e l’assenza di errori di polling,
non risultavano marcate come verificate nel documento sorgente.
```

---

# 49. Correzione documentale consigliata — Connected

Da:

```text
GET timeline SofaScore disponibile
```

A:

```text
GET /api/match/:eventId/json → 200
TopBar Sofa: Connected
```

perché questa è la condizione esplicitamente checked nella fonte.

---

# 50. Correzione documentale consigliata — Interpretation

Possibile tabella:

```text
collecting → recording                     live_observed
mismatch → form                            live_observed
correzione → nuovo Start → aligned         live_observed
TopBar Connected con JSON 200              live_observed
TopBar “Sofa: In attesa”                   historically_reported / not archived
buffering 404                              not_executed
buffering no polling error                 not_executed
pending reale → confirm                    not_executed
pending reale → decline                    not_executed
pending plausibile boundary                not_executed
mismatch runner estraneo → no modal        not_executed
modal sensitive-field absence live         not_executed
single green toast transition              not_executed
bootstrap failure safe pending live        not_executed
```

Può essere compressa in gruppi purché la semantica resti esplicita.

---

# 51. Verification matrix proposta

## A. Historical source path

```text
operations/06-source-identity-live-verification.mdx
→ exists in pre-migration checkpoint
```

---

## B. Migration metadata

```text
source != destination
```

---

## C. SHA

```text
historical live SHA
→ non registrato
```

---

## D. Collecting

```text
source checked
→ destination live_observed
```

---

## E. Mismatch

```text
source checked
→ destination live_observed
```

---

## F. Restart

```text
source checked
→ destination live_observed
```

---

## G. Restart toast

```text
source note: not observed
→ destination: not observed
```

---

## H. Connected

```text
/api/match/:eventId/json = 200
→ Sofa Connected
→ observed
```

---

## I. Waiting report

```text
Sofa: In attesa
→ historically_reported
→ artifact not archived
```

---

## J. Buffering 404

```text
source unchecked
→ not_executed
```

---

## K. No polling error

```text
source unchecked
→ not_executed
```

---

## L. Pending confirm live

```text
not_executed
```

---

## M. Pending decline live

```text
not_executed
```

---

## N. Pending plausible boundary

```text
not_executed live
```

---

## O. Mismatch no modal

```text
not_executed live
```

---

## P. Modal privacy

```text
current static implementation compliant
live scenario not_executed
```

---

## Q. Toast single transition

```text
current code has transition guard
historical dedicated scenario not_executed
```

---

## R. Bootstrap failure

```text
current automated test PASS semantics
historical live not_executed
```

---

## S. Cross-source nontransactional

```text
source contract note
not same-validation live observation
```

---

## T. New future live run

```text
new artifact
not append ambiguously to dateless legacy file
```

owner:

```text
VALID-INDEX-003
```

---

# 52. Modularizzazione

## Dimensione

```text
142 righe
```

## Responsabilità

Il documento ha un solo compito:

```text
registrare la campagna storica
Source Identity/frontend live
con observed / reported / not executed.
```

Le sezioni:

```text
collecting
mismatch
restart
TopBar
pending
Decline
limite
interpretazione
```

appartengono allo stesso contesto di verifica.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
source-identity-pending-validation.md
source-identity-mismatch-validation.md
source-identity-topbar-validation.md
```

come frammenti della vecchia campagna.

Nuove run future devono invece avere artifact nuovi secondo `VALID-INDEX-003`.

---

# 53. Ordine consigliato

```text
1. SOURCE-ID-VAL-002
   → rimuovere evidence inflation del buffering

2. SOURCE-ID-VAL-001
   → correggere source provenance

3. SOURCE-ID-VAL-003
   → completare Interpretation

4. applicare VALID-INDEX-001/002/003
   senza creare policy concorrenti

5. non cambiare i live_observed storici
   per adeguarli al codice corrente

6. non promuovere pending/decline
   grazie ai soli test offline

7. link checker / metadata checker quando previsto

8. nuove live validation future
   → nuovi artifact separati
```

---

# 54. Decisione finale

```text
docs/validations/source-identity-live-verification.md:

REPORT STORICO SOSTANZIALMENTE AFFIDABILE.

L’OSSATURA DELLA MIGRAZIONE È BUONA:
- observed resta observed;
- pending reale resta non eseguito;
- decline resta non eseguito;
- bootstrap failure non viene promosso live;
- limite cross-source è esplicitamente non riprodotto;
- owner correnti restano separati.

NUOVI PROBLEMI:

SOURCE-ID-VAL-001 — HIGH
→ “Sorgente migrata” punta al file stesso
→ correggere con operations/06-...mdx

SOURCE-ID-VAL-002 — HIGH
→ il buffering migrato promuove
  “nessun errore di polling”
  da unchecked a historically_reported
→ rendere di nuovo precisa la route /json=200
  del caso Connected

SOURCE-ID-VAL-003 — MEDIUM
→ Interpretation non riepiloga
  tutti gli scenari non verificati del body

NUOVE TASK RUNTIME:
0

Riscrittura completa:
NO

Revisione mirata:
SÌ

Modularizzazione:
NO

Nuovi documenti:
NO

Priorità:
ALTA
```

La regola fondamentale è:

```text
la migrazione di una historical validation
può ridurre wording troppo forte,
ma non può cambiare silenziosamente
lo stato probatorio di una voce:

unchecked / not_executed
→ non può diventare
historically_reported.

TESTED OFFLINE oggi
→ non diventa
VALIDATED LIVE ieri.
```

---

# 55. Riferimenti per aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-042

Documento:
docs/validations/source-identity-live-verification.md

Nuovi Change ID:
SOURCE-ID-VAL-001
SOURCE-ID-VAL-002
SOURCE-ID-VAL-003

Finding esistenti richiamati:
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003
VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006
CURRENT-STATE-003
LIVE-CTRL-002
LIVE-CTRL-004
LIVE-CTRL-006
LIVE-CTRL-007
SOFA-LIVE-001
SOFA-LIVE-004
SOFA-LIVE-009

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 56. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 42
Da analizzare: 30
Avanzamento: 58,33%

Blocco 038–042:
[✓] 038 roadmap/01-current-state.md
[✓] 039 docs/validations/README.md
[✓] 040 docs/validations/betfair-live-validation-2026-07-04.md
[✓] 041 docs/validations/documentation-migration-finalization-2026-08-03.md
[✓] 042 docs/validations/source-identity-live-verification.md
```

Il prossimo documento canonico è:

```text
implementazioni-tennis-decision-ui.md
```

Checkpoint cumulativo da consolidare:

```text
report 038 → 3 Change ID
report 039 → 3 Change ID
report 040 → 3 Change ID
report 041 → 1 Change ID
report 042 → 3 Change ID

nuove task del blocco:
13

task continuazione precedenti:
115

task continuazione dopo 042:
128

task precedenti non duplicate:
181

task complessive note:
309
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `SOURCE-ID-VAL-001…003`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
