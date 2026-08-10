# Report documentale — `implementazioni/01-piano-generale-audit.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-045
Sequenza audit: 45/72
Documento analizzato: 01-piano-generale-audit.md
Percorso documento: implementazioni/01-piano-generale-audit.md
Percorso report: Report documentale/45 - 01-piano-generale-audit.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 27446e5cc3d3168481c8f3d498cf460d6dab2348
Dimensione documento: 405 righe
Tipo: piano generale / sequenza storica dell’audit
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
implementazioni/README.md
implementazioni/00-metodo-e-stati.md
implementazioni/03-audit-codice.md
implementazioni/04-task-completate.md
implementazioni/05-audit-docs-planning.md
todo-list-tennis-decision-ui.md

implementazioni/audit-codice/07-post-audit-e-migrazione.md

commit:
dda406c4a07ae4a1debfcab39db346e47c33c419
docs: classify local planning and workflow materials

commit corrente:
4c5f43b007149f3210c27d7565357a447a3a6ef4
docs: stabilize root registry recovery metadata

report precedenti:
TDUI-DOC-REPORT-043
TDUI-DOC-REPORT-044
```

Sono stati richiamati, senza duplicarli:

```text
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003

METHOD-EVIDENCE-001
METHOD-REG-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001

CURRENT-STATE-001
CURRENT-STATE-003

VALID-ROLL-001
VALID-ROLL-004

DOC-001
DOC-007
DOC-022
```

GitHub non è stato modificato.

La mappa cumulativa e il ledger JSON restano invariati.

Questo è il terzo report del blocco:

```text
043–047
```

Il consolidamento cumulativo avverrà dopo il report 047.

---

# Esito sintetico

```text
Valore come ricostruzione storica dell’audit:       ALTO
Ordine originale A→G:                               COERENTE
Separazione audit / task / implementazione:         BUONA
D1–D18:                                             COERENTE con owner
Distinzione implementazione/test/live:              BUONA nel Blocco D
Provenance 8.1–8.2:                                 PRESENTE
Provenance 8.3–8.4:                                 INCOMPLETA
Stato corrente dell’audit:                          NON RAPPRESENTATO
Authority temporale del file:                       AMBIGUA
Semantica “completato” vs copertura esaustiva:      AMBIGUA
Riferimenti MDX/planning nel piano iniziale:        STORICI ma NON ETICHETTATI
Modularizzazione:                                   NON necessaria

Nuovi finding:                                      3
Nuove task runtime:                                 0
Riscrittura completa:                               NO
Revisione mirata:                                   SÌ
Nuovi documenti canonici proposti:                  nessuno
Priorità complessiva:                               MEDIO-ALTA
```

La conclusione centrale è:

```text
IL FILE NON È SBAGLIATO COME STORIA DELL’AUDIT.

IL PROBLEMA È CHE CONTINUA A ESSERE PRESENTATO
COME “PIANO GENERALE” E COME ORDINE/PERIMETRO
DI LETTURA CORRENTE,
MA LA SUA CRONOLOGIA SI FERMA MOLTO PRIMA
DELLO STATO ATTUALE.

QUINDI SERVE DISTINGUERE ESPLICITAMENTE:

PIANO ORIGINARIO
→ snapshot storici B6 / D1–D18 / planning locale

DA:

STATO CORRENTE DELLA REVISIONE
→ Punti 1–7 conclusi
→ migrazione completata
→ IMPL-015 / IMPL-028 completate
→ nessuna nuova task selezionata automaticamente.
```

Non emerge alcun motivo per:

```text
cancellare gli snapshot 8.1–8.4
riscrivere la cronologia
rinumerare i blocchi
riaprire D1–D18
riaprire IMPL-015
riaprire IMPL-028
riaprire IMPL-032
creare una nuova roadmap tecnica
modificare codice applicativo
```

---

# 1. Il piano iniziale A→G è strutturalmente sensato

La sezione 8 definisce:

```text
A — baseline e inventario
B — audit documentazione
C — audit codice
D — ricontrollo task completate
E — implementazioni utili
F — audit docs/planning
G — integrazione workflow
```

Come piano originario è coerente.

In particolare:

```text
audit
→ classificazione
→ decisioni
→ implementazioni separate
```

resta una sequenza valida.

---

# 2. Il Blocco D contiene una regola importante da preservare

Il piano dice:

```text
verificare task concluse sul repository attuale
→ distinguere implementazione
→ test automatici
→ validazione live
→ non riaprire senza discrepanza concreta
```

Questa regola è coerente con `04-task-completate.md`.

Il registro D1–D18 usa infatti esiti distinti:

```text
CONFERMATA
CONFERMATA CON LIMITI
DA RIAPRIRE
DOCUMENTAZIONE DA CORREGGERE
TEST DA AGGIORNARE
NON VERIFICABILE
```

e ribadisce che `DA RIAPRIRE` non va usato per una semplice proposta futura.

Da preservare.

---

# 3. I conteggi D1–D18 del piano sono corretti

Il piano registra:

```text
CONFERMATA
→ 9

CONFERMATA CON LIMITI
→ 7

DA RIAPRIRE
→ 2
```

`04-task-completate.md` registra gli stessi conteggi.

Nessun finding.

---

# 4. D14 e D17 sono correttamente indicati come riaperture parziali

Il piano indica:

```text
D14
→ persistence integrity frontend/cross-layer

D17
→ diagnostica Betfair hardening pubblico/capture
```

Il registro owner delle task completate usa la stessa semantica:

```text
DA RIAPRIRE
→ solo parte difettosa
→ non annullare automaticamente il resto.
```

Nessun finding.

---

# 5. IMPL-006…009 sono correttamente presentate come proposte, non come implementazioni

Il piano dice:

```text
IMPL-006
IMPL-007
IMPL-008
IMPL-009

→ strutture/procedure assenti
→ non automaticamente approvate.
```

Questo è corretto storicamente.

Il fatto che successivamente alcune siano state approvate o superate
non rende falso lo snapshot.

---

# 6. Lo stesso vale per IMPL-012…015

Sezione 8.4 registra:

```text
IMPL-012
IMPL-013
IMPL-014
IMPL-015

→ nuove proposte registrate.
```

Al momento dello snapshot era una descrizione valida.

Il fatto che `IMPL-015` oggi sia completata
non richiede la riscrittura retroattiva della sezione 8.4.

---

# 7. Il file ha quindi natura parzialmente storica

Sono presenti snapshot espliciti:

```text
8.1 Stato dopo checkpoint B6
8.2 Stato dopo ricontrollo D1–D18
8.3 Stato dopo decisioni, workflow e planning
8.4 Audit materiali locali
```

Questa struttura è utile come cronologia del percorso.

Non va eliminata.

---

# 8. Ma la testata non dichiara che il file è ormai una cronologia storica

La testata dice:

```text
Questo file definisce ordine, aree e output delle analisi.
```

L’indice `implementazioni/README.md` lo presenta come:

```text
Piano generale dell’audit
→ ordine e perimetro delle analisi
```

e lo colloca al punto 2 dell’ordine minimo di lettura.

Quindi un lettore nuovo lo interpreta legittimamente come:

```text
current audit plan.
```

---

# 9. Il contenuto corrente non arriva però al current audit state

Il file termina con:

```text
IMPL-012…015
```

e non registra nel proprio stato:

```text
secondo audit Punti 1–7 concluso
post-audit trasversale
IMPL-016…032
IMPL-028 implementata
IMPL-032 completata
migrazione MDX→MD completata
IMPL-015 completata
modularizzazione registri
next task = DA SELEZIONARE
```

---

# 10. Queste fasi esistono realmente altrove

`03-audit-codice.md` corrente dichiara:

```text
Punto 7 completato
→ audit tecnico Punti 1–7 concluso
→ nessuna nuova task selezionata automaticamente
```

La Todo corrente dichiara:

```text
Secondo audit del codice — Punti 1–7
→ tutti completati

Documentazione e cleanup
→ migrazione completata
→ 40 file legacy sostituiti/rimossi
→ IMPL-001 / 005 / 032 completate

Runtime e validazione
→ IMPL-015 completata
→ IMPL-028 completata
```

Quindi il problema non è assenza di stato nel repository.

Il problema è:

```text
01-piano-generale-audit
continua ad avere ruolo corrente
ma non indirizza esplicitamente
alla current-state authority.
```

---

# 11. `PLAN-AUDIT-001` — distinguere piano storico e stato operativo corrente

**Priorità:** high  
**Tipo:** audit-plan temporal authority

## Problema

Il file è contemporaneamente:

```text
piano originario
+
cronologia di checkpoint
+
documento nell’ordine minimo di lettura corrente
```

ma non dichiara quale parte sia ancora operativa.

## Azione

Aggiungere in testa una nota equivalente a:

```text
Questo documento conserva il piano originario
e gli snapshot storici dell’audit.

Lo stato operativo corrente vive in:
- todo-list-tennis-decision-ui.md
- implementazioni/03-audit-codice.md
- implementazioni-tennis-decision-ui.md

Le sezioni 8.1–8.4 non vengono retroattivamente
riscritte per seguire gli avanzamenti successivi.
```

Oppure, se si vuole mantenere anche
una sintesi corrente nel piano:

```text
## Stato corrente del piano

Punti 1–7
→ conclusi

migrazione documentale
→ completata

task implementative selezionate
→ nessuna nuova selezione automatica

vedere Todo/root per il dettaglio.
```

## Non fare

Non aggiornare retroattivamente:

```text
8.1
8.2
8.3
8.4
```

come se gli snapshot avessero previsto eventi successivi.

## Criterio di chiusura

Un lettore distingue senza inferenza:

```text
original plan
historical snapshot
current audit state.
```

---

# 12. Il Blocco B iniziale contiene path `.mdx`

Il piano iniziale cita:

```text
docs/tennis-decision-ui/index.mdx
```

e il Blocco E cita:

```text
validazione link MDX
```

Oggi la documentazione è `.md`.

---

# 13. Non correggere automaticamente questi riferimenti storici come semplici typo

Il contesto della sezione 8 è il piano iniziale,
nato prima della migrazione.

Quindi:

```text
index.mdx
link MDX
```

possono essere conservati come:

```text
state at original planning time.
```

Il problema è soltanto che il piano non li etichetta
esplicitamente come riferimenti storici.

Questo rientra in `PLAN-AUDIT-001`.

Non aprire una task `MDX-PATH-*`.

---

# 14. Anche il Blocco F `docs/planning` è storicamente corretto

Il piano iniziale dice:

```text
BLOCCO F
→ audit differito docs/planning
```

Successivamente la fase è stata effettivamente eseguita.

`05-audit-docs-planning.md` dichiara:

```text
LETTURA COMPLETA
CONSOLIDAMENTO COMPLETATO
PULIZIA FISICA COMPLETATA
LINK, REGISTRI E TEST DEL PACCHETTO VALIDATI
```

Quindi non è necessario cancellare il Blocco F storico.

Serve soltanto chiarire che è:

```text
phase originally planned
→ later completed.
```

---

# 15. La sezione 8.1 è ben provvista di provenance

`8.1` dichiara:

```text
SHA verificato:
b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

e spiega cosa significa
e cosa NON significa il completamento B1–B6.

Questa è una buona pratica.

---

# 16. Anche 8.2 dichiara la baseline

`8.2` dice:

```text
Baseline invariata
→ b277bd9...
```

e specifica:

```text
D1–D18
→ completati

suite
→ non eseguite

collaudi live
→ non eseguiti

modifiche prodotto
→ non eseguite.
```

Anche questo è corretto.

---

# 17. 8.3 non dichiara SHA, data o checkpoint

`8.3` introduce:

```text
stato dopo decisioni, workflow e planning
```

e contiene affermazioni sostanziali su:

```text
decisioni chiuse
workflow adattato
docs/planning classificato
materiali assorbiti
formato docs deciso
sequenza di pubblicazione
```

ma non indica:

```text
SHA verificato
data
commit
working-tree provenance.
```

---

# 18. 8.4 non dichiara SHA o baseline nel file

`8.4` registra:

```text
docs.zip
9 file letti
classificazione completata
IMPL-012…015 registrate
```

ma non espone una baseline Git nel documento.

La cronologia Git permette di ricostruire che la sezione 8.4
fu aggiunta dal commit:

```text
dda406c4a07ae4a1debfcab39db346e47c33c419
docs: classify local planning and workflow materials
```

ma questa provenance è esterna al file.

---

# 19. Il README dei registri impone invece lo SHA sugli aggiornamenti sostanziali

`implementazioni/README.md` dice:

```text
ogni aggiornamento sostanziale
deve riportare lo SHA verificato.
```

Le sezioni 8.3 e 8.4 sono aggiornamenti sostanziali.

Quindi qui esiste una non conformità reale
fra regola di governance e file.

---

# 20. `PLAN-AUDIT-002` — provenance per gli snapshot 8.3–8.4

**Priorità:** medium-high  
**Tipo:** historical checkpoint provenance

## Problema

8.1 e 8.2:

```text
SHA presente
```

8.3 e 8.4:

```text
SHA assente
```

pur contenendo risultati e decisioni di fase.

## Azione

Per 8.3 e 8.4 registrare,
solo se dimostrabile:

```text
data
SHA verificato
commit che incorpora lo snapshot
fonte locale/non repository
```

Se la baseline esatta della verifica
non è ricostruibile con sicurezza:

```text
SHA della verifica: non registrato
commit di registrazione: <commit dimostrabile>
```

Non trasformare il commit che aggiunge il testo
automaticamente nello SHA del repository effettivamente verificato.

## Evidenza ricostruibile

Per 8.4 è dimostrabile almeno:

```text
commit di registrazione:
dda406c4...
```

Non è sufficiente, da solo, a dimostrare
la working tree esatta usata per tutte le osservazioni.

## Criterio di chiusura

Ogni snapshot di fase contiene:

```text
baseline della verifica
oppure
non registrato

+
commit/data di registrazione quando disponibile.
```

---

# 21. La semantica di completamento B6 è abbastanza prudente

8.1 chiarisce che:

```text
B1–B6 completato
```

NON significa:

```text
test rieseguiti
task riconfermate
bug corretti
docs riscritte
planning classificato.
```

Questa qualificazione è buona.

---

# 22. “BLOCCO A completato nel perimetro necessario” resta però vago

Il piano dice:

```text
BLOCCO A
→ completato nel perimetro necessario
```

La Todo corrente conserva però:

```text
A8  inventario completo root           [ ]
A9  inventario completo backend        [ ]
A10 inventario completo frontend       [ ]
A11 inventario completo package Python [ ]
A12 inventario script operativi        [ ]
A13 inventario test                    [ ]
```

Quindi:

```text
completed in necessary perimeter
```

non può essere letto come:

```text
inventory exhaustive.
```

---

# 23. Lo stesso problema esiste per “prima analisi statica per tutti i settori completata”

Il piano dice:

```text
BLOCCO C
→ prima analisi statica per tutti i settori completata
```

La Todo corrente conserva però interi gruppi
della checklist originaria come non completati:

```text
C7 SofaScore
C8 Betfair
C9 Storage/recovery
C10 Evidence/Source Identity
...
```

con molte voci `[ ]`.

La Todo specifica correttamente:

```text
le checklist C1–C13
conservano gli stati osservati durante l’audit
e le voci aperte non vengono promosse
senza nuova verifica.
```

---

# 24. Queste due rappresentazioni possono essere entrambe vere

Possibile semantica coerente:

```text
prima passata/orientamento del settore
→ completata

copertura esaustiva della checklist
→ non completata
```

Il problema è che il piano non definisce
questa differenza.

---

# 25. Il secondo audit Punti 1–7 aumenta il rischio di confusione

Oggi esiste anche:

```text
Punto 1…7
→ completati
```

come audit tecnico successivo.

Quindi ci sono almeno tre livelli:

```text
prima passata B1–B6 / settori
checklist C1–C13
secondo audit Punti 1–7
```

senza una legenda esplicita nel piano.

---

# 26. Non bisogna trasformare le checkbox C aperte in prova che l’audit non sia mai avvenuto

Il report 045 NON conclude:

```text
“BLOCCO C non è stato eseguito”.
```

Il repository contiene un audit tecnico molto esteso
e successivamente un secondo audit Punti 1–7.

La conclusione corretta è:

```text
completion language is underspecified.
```

---

# 27. `PLAN-AUDIT-003` — definire activity completion vs exhaustive coverage

**Priorità:** medium-high  
**Tipo:** audit coverage semantics

## Problema

Termini come:

```text
completato nel perimetro necessario
prima analisi completata
audit completato
```

coesistono con checklist che conservano voci aperte.

Senza una definizione,
il lettore può confondere:

```text
attività di audit eseguita
```

con:

```text
copertura esaustiva completata.
```

## Azione

Nel piano aggiungere una distinzione equivalente a:

```text
phase activity complete
→ la passata prevista è stata eseguita
   e i finding sono stati registrati

coverage complete
→ tutte le checklist del perimetro
   hanno stato risolto/verificato

test execution complete
→ suite richieste realmente eseguite

live validation complete
→ scenari live richiesti osservati
```

Poi qualificare gli snapshot:

```text
A:
phase/orientation complete
inventory exhaustive = no

B:
phase complete

C first pass:
phase complete
checklist exhaustive = no
suite execution = no

Punti 1–7:
second audit activity complete
```

## Dipendenze

Questo deve consumare:

```text
METHOD-EVIDENCE-001
```

senza duplicarne l’intero modello.

`METHOD-EVIDENCE-001` possiede il modello generale;
`PLAN-AUDIT-003` possiede
l’applicazione di quel modello al piano.

## Criterio di chiusura

La parola:

```text
completato
```

non permette più di inferire erroneamente:

```text
tutte le checklist verdi
tutti i test eseguiti
tutti i live conclusi.
```

---

# 28. Il piano non deve incorporare tutta la Todo

La correzione di `PLAN-AUDIT-001`
non richiede di copiare:

```text
A1–A16
B1–B6
C1–C13
D1–D18
E/F
IMPL-001…032
```

nel piano.

Il current status può restare un link sintetico.

---

# 29. Il piano non deve duplicare il root registry

Il root possiede:

```text
entry point
baseline sintetica
stato generale
priorità
next step
```

Il piano deve possedere:

```text
sequenza e significato delle fasi di audit.
```

Questa separazione è utile.

---

# 30. Il piano non deve duplicare 03-audit-codice

`03-audit-codice.md` possiede:

```text
current technical audit index
Punti 1–7
domain modules.
```

Il piano deve solo dire:

```text
fase tecnica eseguita
→ vedi owner.
```

---

# 31. Il piano non deve duplicare 04-task-completate

`04-task-completate.md` possiede:

```text
D1–D18
esiti e prove dettagliate.
```

Nel piano bastano i conteggi e il link.

---

# 32. Il piano non deve duplicare 05-audit-docs-planning

`05-audit-docs-planning.md` possiede:

```text
classificazione e cleanup delle fonti locali.
```

Nel piano bastano:

```text
fase eseguita
→ snapshot storico
→ owner.
```

---

# 33. Il Blocco E iniziale è storicamente utile

Contiene criteri:

```text
necessaria
consigliata
opzionale
hardening
automazione
qualità
manutenibilità
futura
da non fare
```

e la regola:

```text
non introdurre implementazioni
solo perché tecnicamente interessanti.
```

Questi principi restano validi.

Non cancellare la sezione.

---

# 34. Alcuni esempi del Blocco E sono però chiaramente pre-migrazione

Per esempio:

```text
validazione link MDX
eventuale archivio collaudi
```

sono stati successivamente:

```text
trasformati
implementati
o superati.
```

Non aggiornarli retroattivamente come se fossero sempre stati `.md`.

Etichettare il blocco come:

```text
original candidate set.
```

rientra in `PLAN-AUDIT-001`.

---

# 35. Il Blocco G è anch’esso un piano storico

Descrive:

```text
integrazione del metodo dell’altro progetto
```

come attività futura.

8.3 registra successivamente:

```text
workflow Props24 adattato
```

Quindi il documento stesso possiede già:

```text
planned
→ later completed
```

ma non una legenda che chiarisca
che la sezione originale non è ancora operativa.

Ancora `PLAN-AUDIT-001`.

---

# 36. Non creare una task separata per ogni frase futura superata

Non aprire:

```text
PLAN-MDX-001
PLAN-PLANNING-001
PLAN-WORKFLOW-001
PLAN-ARCHIVE-001
```

Sono manifestazioni dello stesso problema:

```text
historical plan vs current authority.
```

---

# 37. La policy archive non appartiene a questo report

Il piano storico usa formule come:

```text
archiviare
eliminare
eventuale archivio.
```

Il problema della policy archive corrente
è già posseduto da:

```text
ROOT-REG-001.
```

Il report 045 non crea una seconda authority.

---

# 38. La provenance del current registry non appartiene al piano

`ROOT-REG-002` possiede:

```text
last validated registry baseline.
```

`PLAN-AUDIT-002` possiede invece:

```text
baseline dei singoli snapshot storici del piano.
```

Sono scope distinti.

---

# 39. Il modello evidence generale non viene duplicato

`METHOD-EVIDENCE-001` possiede:

```text
workflow state
implementation state
offline verification
live verification
provenance.
```

`PLAN-AUDIT-003` deve soltanto applicare
una distinzione minimale a:

```text
activity completion
coverage
test execution
live validation.
```

---

# 40. La sequenza 8.3 contiene una scelta storica da non trattare come next step corrente

8.3 dice:

```text
checkpoint registri
→ push main
→ nuovo SHA
→ seconda lettura codice
→ task separate
```

Questa sequenza è stata successivamente eseguita/superata.

Oggi il current owner dice:

```text
nessuna nuova task selezionata automaticamente.
```

Quindi il piano non deve lasciare intendere
che la sequenza 8.3 sia il current next step.

Rientra in `PLAN-AUDIT-001`.

---

# 41. Il file può restare lungo 405 righe

Dimensione:

```text
405 righe
```

Responsabilità:

```text
piano originario
+
checkpoint di avanzamento.
```

È ancora una singola responsabilità coerente.

---

# 42. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
01-piano-storico.md
01-piano-corrente.md
01-checkpoint-audit.md
```

se basta una nota temporale e un current-state pointer.

---

# 43. Aspetti corretti da preservare

```text
1. piano A→G originario;
2. baseline/inventory prima delle modifiche;
3. docs ↔ code in entrambe le direzioni;
4. audit codice per owner/side effect/test;
5. D1–D18 come ricontrollo separato;
6. implementation/test/live separati nel Blocco D;
7. non riaprire task senza discrepanza concreta;
8. implementazioni utili solo dopo audit;
9. proposal classification;
10. no “implementazione perché interessante”;
11. planning non primary per current state;
12. workflow adattato al runtime specifico TDUI;
13. B6 snapshot con limiti espliciti;
14. D1–D18 snapshot con suite/live non eseguiti;
15. 8.4 inventario dei nove materiali;
16. IMPL-012…015 come proposte storiche;
17. nessuna cancellazione/modifica codice nello snapshot 8.4.
```

---

# 44. Aspetti da correggere

```text
PLAN-AUDIT-001 — high
historical plan vs current audit authority

PLAN-AUDIT-002 — medium-high
missing provenance 8.3 / 8.4

PLAN-AUDIT-003 — medium-high
activity completion vs exhaustive coverage
```

Nuove task runtime:

```text
0
```

---

# 45. Finding esistenti da NON duplicare

## `ROOT-REG-001`

Possiede:

```text
archive policy authority.
```

---

## `ROOT-REG-002`

Possiede:

```text
root registry current validation provenance.
```

---

## `ROOT-REG-003`

Possiede:

```text
root state overclaims.
```

---

## `METHOD-EVIDENCE-001`

Possiede:

```text
general multidimensional evidence model.
```

---

## `METHOD-LIFECYCLE-001`

Possiede:

```text
stale transitional instructions
inside 00-metodo.
```

`PLAN-AUDIT-001` riguarda un file diverso:

```text
01-piano
→ historical/current temporal authority.
```

---

## `CURRENT-STATE-001`

Possiede:

```text
runtime/doc review dual baseline
inside Current State.
```

---

## `DOC-001 / DOC-007 / DOC-022`

Possiedono:

```text
roadmap/current-state structure and freshness.
```

Non possiedono il piano generale dei registri.

---

# 46. Verification matrix proposta

## A. Original plan

Preservare:

```text
A→G
```

come piano originario.

---

## B. Historical label

La sezione 8 deve dichiarare:

```text
original plan / historical baseline
```

se non viene mantenuta come current plan.

---

## C. Current authority

Indicare:

```text
Todo
root
03-audit-codice
```

come current state owner appropriati.

---

## D. B6 baseline

```text
b277bd9...
```

resta associata soltanto allo snapshot 8.1.

---

## E. D1–D18 baseline

```text
b277bd9...
```

resta associata allo snapshot 8.2.

---

## F. Snapshot 8.3 provenance

Registrare:

```text
SHA verificato
oppure non registrato
```

e commit di registrazione se dimostrabile.

---

## G. Snapshot 8.4 provenance

Registrare:

```text
SHA verificato
oppure non registrato
```

e:

```text
commit di registrazione
dda406c4...
```

se si sceglie di esporlo.

---

## H. Do not infer working tree

Non usare automaticamente:

```text
commit di registrazione
=
working tree verificata.
```

---

## I. A completion

Esplicitare:

```text
orientation/perimeter complete
≠ exhaustive inventory.
```

---

## J. A8–A13

Restano:

```text
open in Todo
```

finché non vengono davvero verificati.

---

## K. C first pass

Esplicitare:

```text
first-pass activity complete
≠ all C checklist items complete.
```

---

## L. Punti 1–7

Current technical index:

```text
completed
```

e non devono essere confusi con la vecchia C1–C13 checklist.

---

## M. Test execution

Historical B6/D snapshots:

```text
suite not rerun
```

deve restare esplicito.

---

## N. Live validation

Non promuovere automaticamente:

```text
audit complete
→ live complete.
```

---

## O. Planning phase

Original:

```text
deferred
```

Later:

```text
completed
```

Entrambi devono essere leggibili temporalmente.

---

## P. MDX references

Original-plan `.mdx` references:

```text
historical
```

non current paths.

---

## Q. Current next step

Il piano non deve sovrascrivere:

```text
DA SELEZIONARE
```

dichiarato dai current owner.

---

## R. Registry checker

Dopo modifiche:

```text
0 errors
0 warnings.
```

---

## S. Documentation link checker

Eseguire.

---

## T. Fast profile

Eseguire.

---

## U. git diff --check

Eseguire.

---

# 47. Ordine consigliato

```text
1. PLAN-AUDIT-001
   → chiarire historical/current authority

2. PLAN-AUDIT-002
   → provenance 8.3 / 8.4

3. METHOD-EVIDENCE-001
   → definire modello generale evidence

4. PLAN-AUDIT-003
   → applicare completion semantics al piano

5. non riscrivere gli snapshot storici

6. registry checker

7. documentation link checker

8. fast profile

9. git diff --check
```

Nessuna modifica runtime.

---

# 48. Decisione finale

```text
implementazioni/01-piano-generale-audit.md:

VALORE STORICO:
ALTO

PIANO ORIGINARIO:
COERENTE

D1–D18:
COERENTI

SEPARAZIONE:
implementation
test
live
→ buona nel Blocco D

PROBLEMA 1:
PLAN-AUDIT-001 — HIGH
→ file ancora presentato come piano corrente
  ma cronologia ferma prima di:
  Punti 1–7
  migration complete
  IMPL-015 / 028 / 032
  current next step

PROBLEMA 2:
PLAN-AUDIT-002 — MEDIUM-HIGH
→ snapshot 8.3 e 8.4
  senza SHA/baseline nel documento
→ README richiede SHA
  per update sostanziali

PROBLEMA 3:
PLAN-AUDIT-003 — MEDIUM-HIGH
→ “completato”
  non distingue:
  activity pass
  exhaustive coverage
  test execution
  live validation
→ Todo conserva A8–A13 e molte C checklist aperte

MDX/planning old references:
NON BUG AUTONOMI
→ sono storici
→ vanno etichettati come tali

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
MEDIO-ALTA
```

Regola da preservare:

```text
un piano storico può conservare
le decisioni e i next-step del proprio checkpoint,

ma deve rendere impossibile
confonderli con il current execution state.
```

---

# 49. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-045

Documento:
implementazioni/01-piano-generale-audit.md

Nuovi Change ID:
PLAN-AUDIT-001
PLAN-AUDIT-002
PLAN-AUDIT-003

Finding esistenti richiamati:
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003
METHOD-EVIDENCE-001
METHOD-REG-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001
CURRENT-STATE-001
CURRENT-STATE-003
VALID-ROLL-001
VALID-ROLL-004
DOC-001
DOC-007
DOC-022

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 50. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 45
Da analizzare: 27
Avanzamento: 62,50%

Blocco 043–047:
[✓] 043 implementazioni-tennis-decision-ui.md
[✓] 044 implementazioni/00-metodo-e-stati.md
[✓] 045 implementazioni/01-piano-generale-audit.md
[ ] 046 implementazioni/02-audit-documentazione.md
[ ] 047 implementazioni/03-audit-codice.md
```

Nuove task non ancora consolidate nel ledger:

```text
043
→ 3

044
→ 4

045
→ 3

blocco 043–045
→ 10
```

Contatori provvisori:

```text
task precedenti non duplicate: 181
task continuazione consolidate fino a 042: 128
task nuove 043–045: 10
task complessive note provvisorie: 319
```

Il prossimo documento canonico è:

```text
implementazioni/02-audit-documentazione.md
```

La mappa e il ledger cumulativi restano invariati fino al report 047.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `PLAN-AUDIT-001…003`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
