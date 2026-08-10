# Report documentale — `implementazioni/00-metodo-e-stati.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-044
Sequenza audit: 44/72
Documento analizzato: 00-metodo-e-stati.md
Percorso documento: implementazioni/00-metodo-e-stati.md
Percorso report: Report documentale/44 - 00-metodo-e-stati.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 6b571a4e61c7173bbeeb3aeae12b875c7a9b07f3
Dimensione documento: 430 righe
Tipo: metodo operativo / stati / regole della revisione
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
implementazioni-tennis-decision-ui.md
implementazioni/README.md
implementazioni/01-piano-generale-audit.md
implementazioni/05-audit-docs-planning.md
implementazioni/06-implementazioni-proposte.md
implementazioni/99-decisioni-utente.md
todo-list-tennis-decision-ui.md

scripts/check_registry_consistency.py
scripts/tests/test_check_registry_consistency.py

implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md

commit:
4c5f43b007149f3210c27d7565357a447a3a6ef4
docs: stabilize root registry recovery metadata

report precedente:
TDUI-DOC-REPORT-043
implementazioni-tennis-decision-ui.md
```

Sono stati inoltre richiamati i finding/owner già esistenti:

```text
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003

VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003

VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006

WORKFLOW-002
WORKFLOW-003

IMPL-005
IMPL-028
IMPL-031
IMPL-032

DOC-004
DOC-005
DOC-023
```

GitHub non è stato modificato.

La mappa cumulativa e il ledger JSON restano invariati.

Questo è il secondo report del blocco:

```text
043–047
```

Il consolidamento cumulativo avverrà dopo il report 047.

---

# Esito sintetico

```text
Ruolo come metodo operativo:                    BUONO
Gerarchia generale delle fonti:                PRUDENTE ma TROPPO LINEARE
Separazione audit → task → review:              ALTA
Regola massimo tre tentativi:                   CORRETTA
No refactor fuori scope:                        CORRETTA
No dati inventati:                              CORRETTA
Git sotto controllo utente:                     CORRETTA

Workflow state taxonomy:                        BUONA come lifecycle
Verification/evidence taxonomy:                 INSUFFICIENTE
Schema owner card dichiarato:                   NON CONFORME al repository corrente
Contratto IMPL-005 documentato:                 DIVERGENTE dal checker reale
Copertura automatica descritta:                 TROPPO FORTE
Vocabulary stato checker:                       NON ALLINEATA al metodo
Sezioni migrazione/planning:                    TRANSIZIONALI / STALE
Policy docs/archive:                            ERRATA ma già owner ROOT-REG-001
Modularizzazione:                               NON necessaria

Nuovi finding:                                  4
Nuove task runtime:                             0
Finding già posseduti non duplicati:            sì
Riscrittura completa:                           NO
Revisione mirata:                               SÌ
Nuovi documenti canonici proposti:              nessuno
Priorità complessiva:                           ALTA
```

La conclusione centrale è:

```text
IL METODO DI BASE È SANO.

LE REGOLE PIÙ IMPORTANTI RESTANO CORRETTE:
- audit prima delle modifiche;
- una task verificabile per volta;
- niente refactor fuori scope;
- massimo tre tentativi;
- test mirati;
- report finale;
- niente commit/push dell’esecutore;
- non inventare dati o PASS;
- non promuovere un dubbio a bug;
- owner unico per ID.

MA IL DOCUMENTO NON È PIÙ INTERAMENTE
UN “CURRENT METHOD”.

QUATTRO AREE SONO DRIFTATE:

1. workflow state e verification evidence
   sono ancora mescolati in una gerarchia lineare;

2. la sezione 7.7 descrive IMPL-005
   in modo diverso dal checker realmente implementato;

3. le sezioni 7.4–7.6 parlano ancora
   di futura migrazione MDX e futura analisi planning,
   attività già concluse;

4. la scheda “obbligatoria” dei rilievi
   non corrisponde alle owner card storiche correnti
   e non ha enforcement automatico.
```

---

# 1. Il file è correttamente non canonico

La testata dichiara:

```text
Registro operativo non canonico.
La documentazione tecnica corrente resta in docs/.
```

Questo è il confine giusto.

Il metodo deve governare:

```text
audit
workflow
stati
evidenza
ownership dei registri
```

e non:

```text
runtime tecnico
API contract
storage contract
frontend contract.
```

Da preservare.

---

# 2. La separazione fra Todo e metodo è corretta

Il documento dice:

```text
Todo
→ stato sintetico

00-metodo
→ motivazioni
→ evidenze
→ rischi
→ dipendenze
→ criteri di chiusura
```

Il principio è coerente con la struttura modulare corrente.

Non creare un finding di duplicazione.

---

# 3. La baseline storica B1–B6 può restare storica

La sezione 2 registra:

```text
SHA iniziale:
ae9766d...

SHA checkpoint audit B1–B6:
b277bd9...
```

Questa sezione si presenta come:

```text
Stato iniziale verificato
```

e quindi non deve essere automaticamente sostituita con:

```text
aefc0ba
4c5f43b
```

soltanto perché il repository è avanzato.

La baseline corrente sintetica appartiene al root/Todo.

---

# 4. La frase “non assumere che un rilievo resti valido” è corretta

Il metodo richiede:

```text
SHA precedente
→ nuovo SHA esaminato
→ aree cambiate
→ rilievi da riconfermare
```

come principio di revisione.

Questo è coerente con l’audit corrente:

```text
finding storico
≠
verità eterna.
```

Da preservare.

---

# 5. La gerarchia delle prove parte da un principio utile

Il documento ordina:

```text
1. codice corrente
2. test automatici presenti e realmente eseguibili
3. collaudi live documentati
4. documentazione owner
5. roadmap / brief / report storici
6. inferenze
```

Il principio sottostante è sano:

```text
non usare note storiche
come prova più forte del repository corrente.
```

Il problema è la forma:

```text
un’unica scala di attendibilità.
```

---

# 6. “Codice corrente” e “comportamento desiderato” non sono la stessa domanda

Per stabilire:

```text
cosa fa oggi il prodotto
```

il codice corrente è una fonte primaria.

Per stabilire:

```text
cosa deve fare secondo una decisione approvata
```

il decision log può essere l’authority del target,
anche se il codice non è ancora allineato.

Per stabilire:

```text
se il codice è stato testato offline
```

serve un run automatico.

Per stabilire:

```text
se il comportamento è stato osservato live
```

serve evidenza live.

Queste domande non appartengono a una sola scala.

---

# 7. Un test “presente ed eseguibile” non è automaticamente una prova superiore a un live run

La sezione 3 mette:

```text
test automatici presenti e realmente eseguibili
```

prima di:

```text
collaudi live documentati.
```

Poche righe dopo precisa correttamente:

```text
un test presente ma non eseguito
non equivale a una validazione corrente.
```

Le due frasi insieme creano ambiguità.

Esempio:

```text
test presente ma non eseguito
vs
live observation con artifact sufficiente
```

non esiste una regola generale secondo cui il primo
sia più attendibile del secondo.

---

# 8. DEC-024 ha già introdotto un modello più preciso

La decisione sul sistema di validazione richiede di distinguere sempre:

```text
planned
implemented
executed
passed
failed
blocked
live_observed
```

Questa è una struttura multidimensionale.

Il metodo corrente non l’ha ancora assorbita.

---

# 9. Anche l’audit 042 ha dovuto usare più assi

Per Source Identity è stato necessario distinguere:

```text
IMPLEMENTED
TESTED OFFLINE
NOT VALIDATED LIVE
```

perché:

```text
test offline PASS
```

non autorizza:

```text
live_observed.
```

Questa distinzione dovrebbe appartenere al metodo,
non essere ricostruita ad hoc in ogni report.

---

# 10. Workflow state e evidence state devono restare distinti

La tabella della sezione 4 contiene:

```text
DA VERIFICARE
IN VERIFICA
CONFERMATO
DA DECIDERE
APPROVATO
PRONTO PER TASK
IN ESECUZIONE
COMPLETATO
SCARTATO
RINVIATO
FUTURO
```

Questi sono principalmente:

```text
workflow / decision lifecycle states.
```

Non descrivono da soli:

```text
implemented?
test executed?
test passed?
live observed?
artifact archived?
```

---

# 11. `COMPLETATO` è troppo corto per rappresentare l’evidenza

Il metodo definisce:

```text
COMPLETATO
→ Modifica verificata e chiusa
```

Questa definizione può funzionare per il lifecycle,
ma non deve essere letta come:

```text
implemented + offline PASS + live PASS
```

a meno che il criterio della task lo richieda.

Serve quindi una seconda dimensione,
non necessariamente nuovi workflow state.

---

# 12. `METHOD-EVIDENCE-001` — separare lifecycle, implementation e verification evidence

**Priorità:** high  
**Tipo:** operational evidence model

## Problema

Il metodo usa una gerarchia lineare di fonti
e una tabella lifecycle
per problemi che richiedono più assi indipendenti.

## Azione

Mantenere gli stati workflow correnti,
ma aggiungere un modello esplicito equivalente a:

```text
workflowState
→ DA VERIFICARE / CONFERMATO / APPROVATO / ...

implementationState
→ absent / partial / implemented / unknown

offlineVerification
→ not_run / passed / failed / blocked / not_applicable

liveVerification
→ not_run / observed / failed / blocked / not_applicable

provenance
→ SHA / run ID / artifact / non registrato
```

La nomenclatura può essere più semplice,
ma le dimensioni devono restare separate.

## Chiarire anche

```text
code
→ authority sul comportamento implementato corrente

decision log
→ authority sul target approvato

test result
→ authority sul run offline specifico

live artifact
→ authority sull’osservazione live specifica

historical report
→ authority soltanto sul proprio checkpoint
```

## Dipendenze già esistenti

```text
VALID-INDEX-001
VALID-ROLL-004
DEC-024
IMPL-031
```

Non duplicare i loro scope.

Il metodo deve consumarne la semantica.

## Criterio di chiusura

Un finding può essere descritto senza usare
una sola parola `COMPLETATO`
per inferire automaticamente
implementazione, test e live validation.

---

# 13. La regola “un dubbio non diventa bug” è corretta

Il metodo dice:

```text
un dubbio non deve essere promosso a errore
senza evidenza.
```

Questa è una delle regole più importanti.

Da preservare integralmente.

---

# 14. La regola “proposta utile ≠ requisito approvato” è corretta

Il documento separa:

```text
proposal
approval
implementation
```

e questo è coerente con il decision log corrente.

Da preservare.

---

# 15. La regola dei tre tentativi è corretta e corrente

Sezione 7.2:

```text
massimo tre tentativi ragionati
per ogni prompt esecutivo
```

La Todo corrente ripete:

```text
Massimo tre tentativi ragionati per prompt esecutivo
```

Quindi non è una regola storica superata.

Nessun finding.

---

# 16. Il report obbligatorio è coerente

Il metodo richiede:

```text
report finale obbligatorio
```

La Todo permanente richiede:

```text
file
comandi
test
esiti
limiti
```

Coerenza alta.

---

# 17. Il confine Git è coerente

Il metodo dice:

```text
nessun commit o push eseguito dall’esecutore
commit e push effettuati dall’utente
branch/PR solo se approvati
```

È coerente con le decisioni di workflow.

Nessun finding.

---

# 18. La regola “una task verificabile per volta” è corretta

Il metodo evita:

```text
mega-refactor
task eterogenee
patch fuori scope
```

ed è coerente con la struttura attuale del progetto.

Da preservare.

---

# 19. La sezione 6 dichiara uno schema owner molto più forte delle card reali

Il metodo dice:

```text
Ogni voce dettagliata deve contenere:
ID
Titolo
Stato
Classificazione
Priorità
Area
Fonte o evidenza
Codice coinvolto
Documenti coinvolti
Osservazione
Motivo
Impatto
Cosa mantenere
Cosa eliminare
Cosa riscrivere
Cosa spostare
Cosa controllare ancora
Rischi
Alternative
Decisione richiesta
Dipendenze
Azione proposta
Test o controlli necessari
Criterio di chiusura
```

e prescrive:

```text
se non applicabile
→ scrivere “non applicabile”.
```

---

# 20. Le owner card correnti non rispettano letteralmente questo schema

Esempio:

```text
DOC-001
```

contiene:

```text
Stato
Priorità
Area
Documenti coinvolti
Osservazione
Motivo
Cosa mantenere
Cosa eliminare/spostare
Cosa riscrivere
Cosa controllare
Decisione richiesta
Criterio di chiusura
```

ma non contiene come campi espliciti tutti i campi obbligatori,
fra cui per esempio:

```text
Classificazione
Fonte o evidenza
Impatto
Rischi
Alternative
Dipendenze
Test o controlli necessari
```

in forma uniforme.

---

# 21. Questo non rende le card inutili

Il problema NON è:

```text
DOC-001 è invalida.
```

Il problema è:

```text
metodo dichiara schema mandatory
≠
repository usa schema storico più flessibile.
```

Non serve riscrivere centinaia di card solo per uniformare label.

---

# 22. IMPL card usa inoltre uno schema diverso per natura

Esempio `IMPL-001`:

```text
Classificazione
Stato
contratto
vincoli
dipendenza
```

e non la scheda completa dei rilievi.

Questo è ragionevole,
perché un’implementazione proposta non è lo stesso tipo di record di un DOC finding.

Il metodo dovrebbe esplicitarlo.

---

# 23. Il checker non verifica lo schema completo delle card

`scripts/check_registry_consistency.py` riconosce owner tramite:

```text
heading ID — Titolo
```

e legge:

```text
Stato
```

ma non richiede tutti i campi della sezione 6.

Quindi oggi:

```text
registry checker PASS
```

non significa:

```text
owner schema della sezione 6 completamente rispettato.
```

---

# 24. `METHOD-SCHEMA-001` — rendere realistico il contratto delle owner card

**Priorità:** medium  
**Tipo:** registry schema governance

## Problema

Esiste un divario fra:

```text
schema obbligatorio dichiarato
```

e:

```text
schede storiche/correnti effettive.
```

## Azione consigliata

Definire almeno:

```text
campi minimi obbligatori
vs
campi raccomandati
vs
campi non applicabili per tipo di record.
```

Esempio:

```text
tutti gli owner:
ID
Titolo
Stato
scope/area
evidenza o fonte
azione/decisione
criterio di chiusura

finding tecnici:
rischi
codice/documenti
test

IMPL:
classificazione
dipendenze
contratto
criterio di chiusura

DEC:
decisione
stato
confini
conseguenze
```

## Migrazione

Non fare:

```text
mass rewrite di 240 owner card.
```

Applicare la regola a:

```text
nuove card
card modificate sostanzialmente
```

e definire grandfathering per lo storico.

## Checker

Solo dopo aver deciso lo schema minimo,
valutare un controllo machine-checkable.

Non inventare enforcement prima della decisione.

---

# 25. Le sezioni 7.4–7.6 sono ancora scritte come fase di migrazione futura

La sezione 7.4 usa formule come:

```text
La futura riscrittura della documentazione...
```

e:

```text
la modalità tecnica di migrazione
deve essere verificata
prima della conversione di massa.
```

Questo era corretto prima della migrazione.

Non lo è più come istruzione corrente.

---

# 26. La migrazione strutturale è già terminata

Il sistema di registri corrente dichiara:

```text
IMPL-032
→ COMPLETATA
```

e il root registra:

```text
migrazione .mdx → .md completata.
```

Il metodo non deve comportarsi
come se la conversione fosse ancora il prossimo lavoro.

---

# 27. La regola `.md` resta invece attuale

Da preservare:

```text
nuovi documenti tecnici
→ .md

non creare nuovi .mdx
```

Questa è una policy permanente.

Non eliminare la sezione 7.4 per intero.

---

# 28. Va separata la policy permanente dalla procedura storica di migrazione

Policy permanente:

```text
.md only
no MDX
no duplicate owners
link validi
nessuna feature futura presentata come current
```

Procedura storica:

```text
mantieni temporaneamente vecchio MDX
genera manifest di rimozione
verifica prima della conversione di massa
rimuovi MDX dopo sostituzione
```

La seconda non dovrebbe restare presentata come workflow ordinario corrente.

---

# 29. La sezione 7.6 è anch’essa centrata sulla migrazione già conclusa

Descrive la consegna:

```text
nuovi file .md completi
+ manifest migrazione
+ elenco .mdx da rimuovere
+ link aggiornati
```

Questo può essere utile come storico,
ma non deve diventare l’obbligo per ogni futura modifica documentale.

---

# 30. La parte “file completi o ZIP” resta utile

Da preservare come preferenza:

```text
file completi
ZIP quando più file
revisione prima dell’inserimento
```

Da eliminare come default permanente:

```text
sempre manifest .mdx removal
```

quando non esistono più `.mdx` canonici da convertire.

---

# 31. La sezione 7.5 parla ancora di planning come fase futura

Il metodo dice:

```text
Quando verrà analizzata
ogni voce di docs/planning...
```

Il registro:

```text
implementazioni/05-audit-docs-planning.md
```

dichiara invece:

```text
lettura completa
consolidamento completato
pulizia fisica completata
```

e specifica gli esiti per planning replay e Market Reactions Journal.

Quindi:

```text
“quando verrà analizzata”
```

è stale.

---

# 32. Il metodo non deve perdere la regola generale sulle fonti storiche

Da preservare:

```text
fonte storica
≠
prova di comportamento corrente

prima:
current docs
current code
test/live
poi:
historical source
```

Questa è ancora corretta.

Va solo rimossa la falsa temporalità:

```text
docs/planning ancora da analizzare.
```

---

# 33. `docs/archive/README.md` è un problema reale ma già posseduto

La sezione 7.5 afferma:

```text
docs/archive/README.md
conserva soltanto una mappa di provenienza.
```

Sul commit auditato:

```text
docs/archive/README.md
→ non esiste.
```

Inoltre report 043 ha dimostrato che:

```text
root/Todo
→ nuova policy preserve archive

DEC-026 + 00-metodo
→ vecchia policy consolidate/remove
```

---

# 34. Non creare `METHOD-ARCHIVE-001`

La policy archive è già owner di:

```text
ROOT-REG-001
```

che richiede:

```text
decision authority superseding
→ aggiornamento 99-decisioni
→ aggiornamento 00-metodo
→ root/Todo consumer
```

Creare una nuova task archive qui duplichererebbe ownership.

---

# 35. `METHOD-LIFECYCLE-001` — convertire le istruzioni transitorie in steady-state method

**Priorità:** medium-high  
**Tipo:** operational lifecycle normalization

## Scope

```text
7.4
7.5
7.6
```

esclusa la decision authority archive,
che resta `ROOT-REG-001`.

## Problema

Il current method contiene ancora:

```text
futura riscrittura
prima della conversione di massa
vecchio MDX da rimuovere
planning da analizzare in futuro
manifest migrazione come default
```

anche se quelle fasi sono già state completate.

## Azione

Separare:

```text
regole permanenti
```

da:

```text
procedura storica conclusa.
```

### Permanenti

```text
.md only
no MDX nuovo
owner unico
historical sources non primary
file completo/ZIP quando utile
verifica link
nessun dato perso
Git sotto controllo utente
```

### Storiche / concluse

```text
MDX coexistence window
mass conversion preparation
planning audit future
MDX removal manifest
```

Possono essere:

```text
rimosse dal current method
```

oppure:

```text
marcate historical/completed
con link al registro che le conserva.
```

## Dipendenze

```text
ROOT-REG-001
IMPL-032
05-audit-docs-planning
DEC-025
DEC-026 / eventuale superseding DEC
```

## Criterio di chiusura

Un nuovo esecutore che legge il metodo
non viene istruito a riaprire una migrazione
o un planning audit già conclusi.

---

# 36. La sezione 7.7 ha un contratto di parità ormai errato

Il metodo dichiara:

```text
ogni ID dettagliato
→ compare nella Todo
→ compare nel BLOCCO E dei rilievi
→ usa prefisso dichiarato
→ mantiene stesso stato sostanziale
```

Questa regola non descrive il sistema corrente.

---

# 37. Gli IMPL non vivono nel BLOCCO E

La Todo corrente usa:

```text
BLOCCO E
→ rilievi

BLOCCO F
→ implementazioni utili
```

Quindi un owner:

```text
IMPL-025
```

deve avere la riga canonica in:

```text
BLOCCO F
```

non in BLOCCO E.

La frase “ogni ID dettagliato → BLOCCO E”
è letteralmente falsa per gli IMPL.

---

# 38. I DEC sono owner ma non hanno riga sintetica E/F

Il checker raccoglie owner ricorsivamente sotto:

```text
implementazioni/**/*.md
```

e include i `DEC-*` come owner card.

Poi li esclude esplicitamente dalla parità:

```text
PARITY_EXCLUDED_PREFIXES = {"DEC"}
```

Questo è coerente con i conteggi:

```text
240 owner card
214 Todo row
```

La differenza è compatibile con:

```text
26 DEC owner
```

senza riga E/F.

---

# 39. Quindi “ogni ID dettagliato → Todo” non è il contratto reale

Il contratto reale è più vicino a:

```text
owner non-DEC
→ una sola riga canonica Todo E/F

DEC
→ owner nel decision log
→ escluso dalla parity E/F
→ latest DEC sintetizzata secondo checker
```

Il metodo deve dire questo.

---

# 40. Anche la formula “registro documentazione ∪ registro codice” è incompleta

La sezione 7.7 dice:

```text
ID registro documentazione
∪ ID registro codice
→ uguali agli ID sintetici Todo
```

Il checker reale non limita gli owner a:

```text
02-audit-documentazione
+
03-audit-codice.
```

Scansiona:

```text
implementazioni/**/*.md
```

quindi include:

```text
IMPL owner
TEST owner
WORKFLOW
SECURITY
PYTHON
CLEANUP
etc.
```

salvo le esclusioni esplicite.

---

# 41. Il checker è più evoluto del contratto documentato

Oltre a:

```text
parità owner/Todo
duplicate owner
duplicate Todo
prefix
status contradiction
```

controlla anche:

```text
SHA summary mismatch
range mismatch
latest TEST/IMPL
latest DEC summarized
audit Punto
next-step marker
```

Questi controlli non sono rappresentati bene nella sezione 7.7.

---

# 42. Il metodo attribuisce a IMPL-005 un controllo che il codice non implementa

Il metodo elenca fra i controlli minimi:

```text
ID DA DECIDERE
→ deve comparire anche nel registro decisioni
quando la scelta diventa operativa
```

Subito dopo dice:

```text
Il controllo automatico è implementato da IMPL-005.
```

Ma `check_registry_consistency.py`
non esegue una scansione per:

```text
ogni owner DA DECIDERE
→ corrispondente DEC.
```

Controlla invece:

```text
latest DEC
→ deve essere sintetizzata nel root/Todo.
```

Sono controlli diversi.

---

# 43. Questo è un overclaim di automazione

Quindi oggi un checker verde non prova automaticamente:

```text
ogni DA DECIDERE
ha una decisione owner corretta.
```

Quella verifica resta:

```text
manuale / semantica
```

finché non viene implementato un mapping machine-checkable.

---

# 44. Il vocabulary del checker contiene uno stato non dichiarato dal metodo

Il codice usa:

```text
STRICT_STATE_TOKENS
```

che include:

```text
MANCANTE
```

La tabella della sezione 4 non include `MANCANTE`.

I test del checker usano esplicitamente:

```text
COMPLETATO owner
vs
MANCANTE Todo
→ incompatible_status
```

e:

```text
APPROVATO owner
vs
MANCANTE Todo
→ non incompatibile
```

Quindi `MANCANTE` è parte del contratto automatico,
anche se non è dichiarato nel metodo.

---

# 45. Non è dimostrato che `MANCANTE` sia oggi usato nelle row canoniche

La ricerca corrente non ha trovato
un uso canonico affidabile da citare.

Quindi non affermare:

```text
Todo corrente usa MANCANTE.
```

Il fatto dimostrato è:

```text
checker e suite supportano MANCANTE
ma il metodo non lo definisce.
```

Questo è comunque drift di contract.

---

# 46. “Stesso stato sostanziale” è più forte di ciò che il checker verifica

Il checker non esegue equivalenza semantica completa.

Estrae alcuni token:

```text
DA VERIFICARE
IN VERIFICA
CONFERMATO
DA DECIDERE
APPROVATO
PRONTO PER TASK
IN ESECUZIONE
COMPLETATO
SCARTATO
RINVIATO
FUTURO
MANCANTE
```

e segnala solo alcune combinazioni incompatibili.

Quindi un PASS significa:

```text
nessuna contraddizione stretta codificata
```

non:

```text
owner e Todo hanno esattamente
lo stesso stato sostanziale.
```

---

# 47. Esempio: stati IMPL non sono completamente normalizzati dal checker

Nel repository esistono formule come:

```text
IMPLEMENTATA E VERIFICATA
IMPLEMENTATA E VALIDATA
APPROVATA; PRIORITÀ CRITICA
NECESSARIA
```

Il checker non dispone di una macchina semantica completa
per tutte queste formule.

Questo non è necessariamente un bug del checker.

Va documentato correttamente.

---

# 48. `METHOD-REG-001` — riallineare il contratto del registry checker

**Priorità:** high  
**Tipo:** registry method ↔ implementation contract

## Problema

Sezione 7.7 e checker divergono su:

```text
scope owner
BLOCCO E/F
DEC parity exclusion
status vocabulary
strict contradiction semantics
latest decision handling
automated vs manual checks
additional metadata checks
```

## Azione

Riscrivere 7.7 in modo equivalente a:

```text
owner cards
→ discovery ricorsiva implementazioni/**/*.md

non-DEC owners
→ parity con righe canoniche Todo
   nei BLOCCO E/F

DEC
→ esclusi dalla parity E/F

status
→ checker rileva contraddizioni strette codificate
→ non certifica equivalenza semantica completa

DA DECIDERE → DEC mapping
→ manuale finché non esiste mapping automatico

checker additionally verifies
→ duplicate owner/row
→ prefix
→ SHA summary
→ ranges
→ latest TEST/IMPL
→ latest decision summarized
→ audit point
→ next-step markers
```

## Vocabulary

Decidere esplicitamente se:

```text
MANCANTE
```

è:

```text
synthetic-only state
workflow state
legacy token
```

e documentarlo.

Non rimuoverlo dal checker senza verificare consumer/test.

## Non fare

Non riaprire:

```text
IMPL-005
```

come se il checker fosse rotto.

Il finding principale è:

```text
documentation of checker contract drifted.
```

Eventuali nuove feature di checker
richiedono decisione separata.

---

# 49. IMPL-005 resta correttamente implementata

`06-implementazioni-proposte` descrive il nucleo IMPL-005 come:

```text
insieme ID
stati incompatibili
prefissi sconosciuti
duplicati
owner senza row
row senza owner
```

Il checker implementa effettivamente questo nucleo.

Non dichiarare:

```text
IMPL-005 fallita.
```

Il problema è il testo del metodo,
che aggiunge o generalizza condizioni in modo non preciso.

---

# 50. La suite del checker supporta le semantiche principali

Sono presenti test per:

```text
owner/row parity
duplicate owner
duplicate row
unknown prefix
DEC excluded from parity
completed vs missing contradiction
approval vs missing allowed
Block F canonical
SHA mismatch
range/latest ID mismatch
latest DEC summarized
audit point mismatch
next step mismatch
CLI exit behavior
```

Quindi il checker non è una utility improvvisata.

Da preservare.

---

# 51. La regola owner unico della sezione 7.8 è corretta

Il metodo definisce owner card tramite:

```text
### ID — Titolo
```

e richiede che note/addendum
non replichino quel pattern.

Il checker implementa:

```text
duplicate_owner_card
```

Questa parte è ben allineata.

---

# 52. La normalizzazione “non eliminare contenuti sostanziali” resta una buona regola

La sezione 7.8 prescrive:

```text
normalizzazione
→ ownership/navigation
→ non eliminazione contenuto sostanziale.
```

Come regola di registry modularization è corretta.

Non confonderla con:

```text
MIGRATION-VAL-001
```

che riguarda la forza della prova
sulla migrazione documentale 40 file.

Sono scope diversi.

---

# 53. Il metodo non deve assorbire la policy archive come owner

Report 043 ha stabilito:

```text
decision log
→ decide

00-metodo
→ applica la regola operativa
```

Quindi la futura correzione di 7.5
deve avvenire dopo `ROOT-REG-001`.

Il metodo non deve inventare autonomamente
la nuova decisione archive.

---

# 54. Il metodo non deve diventare una cronologia della migrazione

Sezioni 7.4–7.6 possono conservare
solo ciò che serve ancora come:

```text
policy operativa corrente.
```

La cronologia:

```text
prima conversione MDX
batch
vecchi file
manifest rimozione
```

può restare recuperabile in:

```text
commit Git
IMPL-032
validation migration finalization
audit documentale storico.
```

---

# 55. Il metodo deve distinguere current rule da historical rationale

Una possibile struttura senza nuovi file:

```text
7.4 Regole permanenti documentazione
7.5 Fonti storiche e non canoniche
7.6 Consegna artefatti documentali
7.7 Registry consistency
7.8 Owner/addendum
```

Con brevi note:

```text
migrazione iniziale completata
→ vedere IMPL-032 / historical validation
```

senza riscrivere il processo storico nel current method.

---

# 56. Non serve modularizzare il documento

Il file ha:

```text
430 righe
```

ma le sezioni appartengono tutte a una responsabilità:

```text
metodo operativo della revisione.
```

Separare:

```text
stati.md
prove.md
workflow.md
registry.md
```

creerebbe più owner di metodo
senza necessità dimostrata.

---

# 57. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 58. Aspetti corretti da preservare integralmente

```text
1. registro operativo non canonico;
2. docs tecnici restano owner del comportamento;
3. Todo come vista sintetica;
4. baseline storica B1–B6;
5. non assumere validità eterna dei finding;
6. codice corrente prima delle inferenze storiche;
7. test presente ma non eseguito ≠ current validation;
8. report storico ≠ prova del current behavior;
9. dubbio ≠ bug;
10. proposta ≠ requisito approvato;
11. decisioni strutturali appartengono all’utente;
12. lifecycle state espliciti;
13. ID non rinumerati;
14. una task verificabile per volta;
15. no refactor fuori scope;
16. no modifiche automatiche durante audit;
17. massimo tre tentativi;
18. file modificabili/consultabili separati;
19. test mirati;
20. report finale obbligatorio;
21. no commit/push esecutore;
22. no dati inventati;
23. no validation-missing → bug;
24. no legacy-used → dead code;
25. .md only per nuovi documenti;
26. owner unico;
27. duplicate_owner_card gate;
28. full file/ZIP quando utile;
29. fonti storiche non primary;
30. review prima di pubblicazione.
```

---

# 59. Aspetti da correggere

```text
A. evidence model lineare
→ METHOD-EVIDENCE-001

B. schema card mandatory non realistico
→ METHOD-SCHEMA-001

C. migration/planning future wording stale
→ METHOD-LIFECYCLE-001

D. registry checker contract drift
→ METHOD-REG-001

E. archive policy
→ ROOT-REG-001 già esistente
```

---

# 60. Finding esistenti da NON duplicare

## `ROOT-REG-001`

Possiede:

```text
current archive policy decision authority
DEC-026 vs ARCHIVE-DEC-001
allineamento 99-decisioni / metodo / root / Todo
```

Il report 044 non crea un secondo owner archive.

---

## `ROOT-REG-002`

Possiede:

```text
root registry validation baseline/provenance
```

Non è una responsabilità di `00-metodo`.

---

## `ROOT-REG-003`

Possiede:

```text
root claim
canonical docs = reality
structural migration ≠ semantic closure
```

`METHOD-LIFECYCLE-001` riguarda invece
istruzioni operative transitorie rimaste attive.

---

## `VALID-INDEX-001`

Possiede:

```text
historical validation evidence taxonomy.
```

`METHOD-EVIDENCE-001` deve consumarla,
non riscriverla.

---

## `VALID-ROLL-004`

Possiede:

```text
runner result-state semantics.
```

Il metodo deve collegarsi alla distinzione,
non duplicare il runner.

---

## `IMPL-005`

Possiede:

```text
registry checker implementation.
```

`METHOD-REG-001` possiede:

```text
documentazione corretta del suo contratto.
```

---

## `IMPL-032`

Possiede:

```text
migration pipeline.
```

`METHOD-LIFECYCLE-001` non riapre la pipeline.

---

## `DOC-004 / DOC-005`

Possiedono il problema storico:

```text
MDX → MD
convenzioni da convertire.
```

La conversione è già avvenuta.

Il nuovo finding riguarda:

```text
current method ancora scritto come pre-migration.
```

---

# 61. Nuovi finding

```text
METHOD-EVIDENCE-001 — high
Dimensioned implementation / offline / live evidence model

METHOD-REG-001 — high
Registry checker contract and status vocabulary alignment

METHOD-LIFECYCLE-001 — medium-high
Remove transitional migration/planning workflow from current method

METHOD-SCHEMA-001 — medium
Owner-card schema minimum vs historical/current reality
```

Nuove task runtime:

```text
0
```

---

# 62. `METHOD-EVIDENCE-001` — summary

```text
current:
single evidence hierarchy
+
workflow states

required:
workflow lifecycle
≠
implementation state
≠
offline verification
≠
live verification
≠
provenance
```

Non eliminare la gerarchia generale.

Riformularla per domanda/evidence type.

---

# 63. `METHOD-REG-001` — summary

```text
current docs:
every detailed ID → Todo → Block E
doc-registry ∪ code-registry = Todo
DA DECIDERE → decision log
IMPL-005 automates controls

actual checker:
recursive implementazioni/**/*.md
Block E + Block F
DEC excluded from parity
strict status contradictions only
MANCANTE recognized
latest DEC summarized
SHA/range/point/next-step checks
no per-DA-DECIDERE → DEC mapping
```

Il checker è più corretto del testo.

---

# 64. `METHOD-LIFECYCLE-001` — summary

```text
keep:
.md only
historical ≠ current evidence
full file/ZIP when useful
link verification

remove/mark historical:
future mass MDX conversion
old MDX coexistence
MDX removal manifest as default
planning “when analyzed”
```

Archive policy resta dipendenza `ROOT-REG-001`.

---

# 65. `METHOD-SCHEMA-001` — summary

```text
current:
24-ish mandatory fields per detailed card

reality:
historical DOC/WORKFLOW cards vary
IMPL/DEC cards have different natural schema
checker does not enforce field completeness
```

Serve:

```text
minimum schema by record type
+
grandfathering
```

non mass rewrite.

---

# 66. Verification matrix proposta

## A. Method source

```text
00-metodo-e-stati.md
→ current Git blob
→ 430 lines
```

---

## B. Code baseline wording

```text
historical B1–B6 baseline
→ retained as historical origin
```

---

## C. Three-attempt rule

```text
method
→ max 3

Todo workflow
→ max 3

PASS
```

---

## D. Git ownership

```text
method
→ user commit/push

Todo
→ user commit/push

PASS
```

---

## E. Evidence dimensions

Verify method can represent independently:

```text
implemented
offline not_run/pass/fail/blocked
live not_run/observed/fail/blocked
provenance
```

without inferring one from another.

---

## F. Workflow lifecycle

Existing:

```text
DA VERIFICARE
...
COMPLETATO
```

must remain usable
without being overloaded as verification state.

---

## G. Registry owner discovery

Document:

```text
implementazioni/**/*.md
```

matching checker implementation.

---

## H. Todo parity sections

Document:

```text
BLOCCO E
+
BLOCCO F
```

not E only.

---

## I. DEC parity

Document:

```text
DEC excluded from E/F parity
```

with latest-decision summary behavior.

---

## J. Status vocabulary

Decide/document:

```text
MANCANTE
```

scope.

---

## K. Status consistency semantics

Document:

```text
strict contradictions
```

not:

```text
full semantic equality
```

unless checker is intentionally extended.

---

## L. DA DECIDERE mapping

Either:

```text
manual check
```

or implement a machine-readable mapping.

Do not claim it is already automated.

---

## M. Additional IMPL-005 checks

Document current behavior for:

```text
SHA
ranges
latest TEST/IMPL
latest DEC
audit point
next step
```

or explicitly call them checker hardening beyond minimum contract.

---

## N. Owner-card schema

Sample multiple types:

```text
DOC
CODE
TEST
IMPL
DEC
```

and define minimum applicable fields.

---

## O. Grandfathering

Historical cards need not be rewritten
only to add empty headings.

---

## P. MDX policy

Current rule:

```text
no new MDX
```

PASS.

---

## Q. Migration lifecycle

Current method must not say:

```text
mass migration still pending.
```

---

## R. Planning lifecycle

`05-audit-docs-planning` states:

```text
complete
```

so method must not state:

```text
when it will be analyzed
```

as current next phase.

---

## S. Archive authority

After `ROOT-REG-001`:

```text
method
→ consume current DEC
```

not invent policy.

---

## T. Registry checker tests

After method/checker changes:

```text
scripts/tests/test_check_registry_consistency.py
```

---

## U. Registry checker

```text
scripts/check_registry_consistency.py
→ 0 errors
→ 0 warnings
```

---

## V. Documentation link checker

Required after registry/doc changes.

---

## W. Fast profile

Required according to current workflow.

---

## X. Git diff check

Required after changes.

---

# 67. Ordine consigliato

```text
1. ROOT-REG-001
   → stabilire decision authority archive

2. METHOD-EVIDENCE-001
   → chiarire modello delle prove

3. METHOD-REG-001
   → riallineare metodo ↔ checker

4. METHOD-LIFECYCLE-001
   → rimuovere temporalità pre-migration

5. METHOD-SCHEMA-001
   → definire schema minimo realistico

6. registry checker tests

7. registry checker

8. documentation link checker

9. fast profile

10. git diff --check
```

Nessun intervento runtime.

---

# 68. Decisione finale

```text
implementazioni/00-metodo-e-stati.md:

METODO DI BASE:
BUONO

DA PRESERVARE:
- audit before modify
- one task at a time
- no scope creep
- three attempts
- report mandatory
- no invented PASS/data
- Git controlled by user
- historical evidence != current behavior
- unique owner IDs
- registry checker gate

NUOVI PROBLEMI:

METHOD-EVIDENCE-001 — HIGH
→ hierarchy troppo lineare
→ manca separation:
  workflow / implementation / offline / live / provenance

METHOD-REG-001 — HIGH
→ 7.7 non descrive il checker reale
→ E-only è falso
→ DEC parity exclusion non documentata
→ owner scope incompleto
→ MANCANTE non dichiarato
→ strict contradiction != semantic equality
→ DA DECIDERE→DEC non è automatizzato

METHOD-LIFECYCLE-001 — MEDIUM-HIGH
→ 7.4–7.6 ancora pre-migration
→ planning descritto come futuro
→ MDX-removal workflow ancora default

METHOD-SCHEMA-001 — MEDIUM
→ mandatory detailed-card schema
  non corrisponde alle owner card reali
→ definire minimum schema / grandfathering

ARCHIVE POLICY:
problema confermato
ma già owner ROOT-REG-001
→ nessun duplicato

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
ALTA
```

Regola chiave:

```text
un metodo operativo deve descrivere
non soltanto le intenzioni corrette,
ma anche il contratto reale
degli strumenti che dichiara obbligatori.

checker PASS
non può significare più
di ciò che il checker effettivamente verifica.
```

---

# 69. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-044

Documento:
implementazioni/00-metodo-e-stati.md

Nuovi Change ID:
METHOD-EVIDENCE-001
METHOD-REG-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001

Finding esistenti richiamati:
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003
VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006
WORKFLOW-002
WORKFLOW-003
IMPL-005
IMPL-028
IMPL-031
IMPL-032
DOC-004
DOC-005
DOC-023

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 70. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 44
Da analizzare: 28
Avanzamento: 61,11%

Blocco 043–047:
[✓] 043 implementazioni-tennis-decision-ui.md
[✓] 044 implementazioni/00-metodo-e-stati.md
[ ] 045 implementazioni/01-piano-generale-audit.md
[ ] 046 implementazioni/02-audit-documentazione.md
[ ] 047 implementazioni/03-audit-codice.md
```

Nuove task non ancora consolidate nel ledger:

```text
043
→ 3

044
→ 4

blocco 043–044
→ 7
```

Contatori provvisori:

```text
task precedenti non duplicate: 181
task continuazione consolidate fino a 042: 128
task nuove 043–044: 7
task complessive note provvisorie: 316
```

Il prossimo documento canonico è:

```text
implementazioni/01-piano-generale-audit.md
```

La mappa e il ledger cumulativi restano invariati fino al report 047.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `METHOD-EVIDENCE-001, METHOD-REG-001, METHOD-LIFECYCLE-001, METHOD-SCHEMA-001`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
