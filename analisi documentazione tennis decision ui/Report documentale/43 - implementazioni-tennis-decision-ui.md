# Report documentale — `implementazioni-tennis-decision-ui.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-043
Sequenza audit: 43/72
Documento analizzato: implementazioni-tennis-decision-ui.md
Percorso documento: implementazioni-tennis-decision-ui.md
Percorso report: Report documentale/43 - implementazioni-tennis-decision-ui.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: c7e73111648f5dc94942df8b939033274a01bacd
Dimensione documento: 174 righe
Tipo: indice root / registro operativo di orientamento della revisione
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
implementazioni/README.md
implementazioni/00-metodo-e-stati.md
implementazioni/01-piano-generale-audit.md
implementazioni/03-audit-codice.md
implementazioni/04-task-completate.md
implementazioni/06-implementazioni-proposte.md
implementazioni/99-decisioni-utente.md
todo-list-tennis-decision-ui.md

commit:
aefc0ba5894d8fca60e5811088fede3ebbfde98a
docs: modularize audit and implementation registries

commit:
2ebe7e8ad0935bf0195679452d2e54e1de4d63dc
docs: restore root registries and preserve archive policy

commit:
4c5f43b007149f3210c27d7565357a447a3a6ef4
docs: stabilize root registry recovery metadata

compare:
aefc0ba... → 4c5f43b...

artifact locale conclusivo:
ROOTMD-LOCAL-CLOSED-001

artifact locale della decisione archive:
ARCHIVE-DEC-001

report documentali:
038 — current state
039 — validations README
040 — Betfair live validation
041 — documentation migration finalization
042 — Source Identity live verification
```

Sono stati inoltre richiamati i finding/owner già esistenti:

```text
DOC-018
DOC-019
DOC-020
DOC-022
WORKFLOW-002
WORKFLOW-003
IMPL-005
VALID-ROLL-001
CURRENT-STATE-001
CURRENT-STATE-002
CURRENT-STATE-003
MIGRATION-VAL-001
BETFAIR-VAL-001
BETFAIR-VAL-002
BETFAIR-VAL-003
SOURCE-ID-VAL-001
SOURCE-ID-VAL-002
SOURCE-ID-VAL-003
```

GitHub non è stato modificato.

La mappa cumulativa e il JSON dell’audit non vengono aggiornati con questo report.

Nuovo blocco:

```text
043–047
```

Il consolidamento cumulativo avverrà dopo il report 047.

---

# Esito sintetico

```text
Ruolo come entry point:                         BUONO
Separazione root ↔ registri analitici:          BUONA
Coerenza implementazioni concluse:              ALTA
Coerenza priorità ↔ Todo:                       BUONA
Baseline codice aefc0ba:                        CORRETTA
Provenance recupero 8f936d1 → 2ebe7e8:          CORRETTA
Provenance dell’ultimo registry validation:     INCOMPLETA nel root
Coerenza archive policy fra registri:           ERRATA
Canonical docs “real behavior” come fatto:      TROPPO FORTE
Migrazione meccanica vs fidelity semantica:     NON DISTINTA
Audit completion vs evidence tier:              MIGLIORABILE
Modularizzazione:                               NON necessaria

Nuovi finding:                                  3
Nuove task runtime:                             0
Finding esistenti richiamati:                   numerosi, non duplicati
Riscrittura completa:                           NO
Revisione mirata:                               SÌ
Nuovi documenti canonici proposti:              nessuno
Priorità complessiva:                           ALTA
```

La conclusione centrale è:

```text
IL ROOT REGISTRY È STRUTTURALMENTE BUONO
E NON È UN SECONDO MONOLITE OWNER.

LE BASELINE PRINCIPALI SONO REALI.

MA OGGI HA TRE PROBLEMI DI GOVERNANCE:

1. la policy docs/archive consumata da root/Todo
   non ha più un owner coerente in 99-decisioni-utente
   e confligge con DEC-026 e con 00-metodo-e-stati;

2. i risultati “dell’ultimo controllo” esistono davvero
   sul checkpoint 4c5f43b,
   ma il root non espone il livello
   “last validated registry baseline / artifact”;

3. il root presenta come fatto generale
   “la documentazione canonica descrive il comportamento reale”
   e “migrazione completata”
   senza distinguere:
   policy desiderata,
   conversione meccanica completata,
   e finding semantici/documentali ancora aperti.
```

Non emerge invece alcun motivo per:

```text
riaprire IMPL-015
riaprire IMPL-028
riaprire IMPL-032 come intero blocco
rinumerare ID
rifare il recupero root
dividere il file
cambiare codice applicativo
```

---

# 1. Il ruolo del file root è corretto

Il documento si presenta come:

```text
punto di ingresso corrente
per la revisione tecnica e documentale
```

e dichiara esplicitamente di non sostituire:

```text
codice
test
documentazione tecnica canonica
collaudi
```

Questa separazione è corretta.

Il root deve restare:

```text
indice sintetico / orientation layer
```

non:

```text
seconda Todo
secondo registro owner
seconda documentazione tecnica
secondo decision log.
```

---

# 2. La gerarchia root → registri modulari è coerente

Il file collega correttamente:

```text
Todo
README implementazioni
metodo
piano audit
decisioni utente

audit documentazione
audit codice
task completate
planning
implementazioni proposte
```

L’indice `implementazioni/README.md` conferma la stessa struttura.

Questo punto va preservato.

---

# 3. La modularizzazione dei registri è descritta correttamente

Il root dichiara:

```text
02-audit-documentazione.md
→ 4 moduli

03-audit-codice.md
→ 7 moduli

06-implementazioni-proposte.md
→ 7 moduli
```

L’indice modulare conferma:

```text
audit codice
→ 7 moduli

implementazioni proposte
→ 7 moduli
```

e mantiene i file root come indici.

Nessun finding su questo punto.

---

# 4. La baseline codice `aefc0ba` è corretta

Il root dichiara:

```text
SHA codice verificato:
aefc0ba5894d8fca60e5811088fede3ebbfde98a
```

La verifica Git:

```text
aefc0ba → 4c5f43b
```

mostra tre commit successivi.

I file cambiati sono:

```text
README
docs/archive/README
docs/tennis-decision-ui/index
registri implementazioni
Todo
```

Non risultano file sotto:

```text
backend/
frontend/
launcher/
scrapers/
scripts runtime applicativi
```

modificati nel compare.

## Conclusione

```text
code baseline aefc0ba
→ ancora valida per il codice applicativo corrente
```

Non aprire una task per “SHA codice vecchio”.

---

# 5. Distinguere code baseline e documentation baseline è corretto

Il root conserva:

```text
SHA codice verificato
→ aefc0ba

base del recupero documentale
→ 8f936d1

commit di applicazione recupero
→ 2ebe7e8
```

Questa separazione è concettualmente corretta.

Non bisogna forzare:

```text
un solo SHA
```

per descrivere tre cose diverse.

---

# 6. Il commit `2ebe7e8` ha realmente il ruolo dichiarato

Il commit:

```text
2ebe7e8ad0935bf0195679452d2e54e1de4d63dc
docs: restore root registries and preserve archive policy
```

modifica realmente:

```text
root registries
Todo
README/index
archive policy wording
conteggio link 72 / 428
```

Quindi la frase:

```text
Il recupero documentale è stato pubblicato nel commit 2ebe7e8
```

è vera.

---

# 7. Il commit `4c5f43b` ha però un ruolo ulteriore

Il commit corrente:

```text
4c5f43b007149f3210c27d7565357a447a3a6ef4
docs: stabilize root registry recovery metadata
```

modifica proprio:

```text
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
```

per correggere la rappresentazione:

```text
recovery base
vs
recovery application commit.
```

Quindi la storia completa è:

```text
aefc0ba
→ code baseline

8f936d1
→ recovery source/base

2ebe7e8
→ recovery applied/published

4c5f43b
→ root-registry metadata stabilized
→ validation rerun recorded externally
```

Il root corrente espone soltanto i primi tre livelli.

---

# 8. Esiste prova primaria della validazione finale su `4c5f43b`

L’artifact locale conclusivo:

```text
ROOTMD-LOCAL-CLOSED-001
```

registra:

```text
final_published_commit:
4c5f43b00714

metadata_stabilization_commit:
4c5f43b00714

registry tests:
18 PASS

nested registry tests:
2 PASS

registry consistency:
240 owner IDs
214 Todo rows
0 errors
0 warnings

documentation links:
72 files
428 links
0 errors
0 warnings

fast:
6 passed
0 failed
0 timed out

fast artifact:
test-results/2026-08-06T15-34-19-026Z-4c5f43b00714-fast.json

git diff:
PASS

working tree:
clean

branch alignment:
main and origin/main aligned at 4c5f43b
```

Quindi i numeri del root non sono inventati.

---

# 9. Il problema non è il risultato: è il suo binding nel root

Il root usa il titolo:

```text
Risultati dell’ultimo controllo
```

e mostra:

```text
18 PASS
2 PASS
240 / 214
72 / 428
fast 6 PASS
git diff PASS
```

ma non dice:

```text
questi risultati appartengono
alla validazione finale del registry
sul checkpoint 4c5f43b
```

né espone:

```text
artifact ID/path
scope del controllo
working-tree state
```

Per un entry point che dichiara di:

```text
indicare la baseline verificata
```

questa omissione è materiale.

---

# 10. Non bisogna introdurre un “current HEAD” auto-referenziale

Un file Git non deve tentare di certificare magicamente:

```text
HEAD corrente = SHA contenuto nel file stesso
```

come unico modello.

Un commit hash dipende anche dal contenuto.

La soluzione non è creare una fragile self-reference.

La soluzione è distinguere:

```text
application code baseline
documentation recovery base
recovery application commit
last validated registry baseline
validation artifact
```

Il campo:

```text
last validated registry baseline
```

può restare stabile fino alla successiva validazione reale.

---

# 11. `ROOT-REG-002` — rendere esplicita la provenance dell’ultimo registry validation

**Priorità:** high  
**Tipo:** root registry validation provenance

## Problema

Il root contiene risultati reali ma non li lega esplicitamente al checkpoint che li ha prodotti.

## Azione

Aggiungere una sezione equivalente a:

```text
Ultimo baseline registri validato:
4c5f43b007149f3210c27d7565357a447a3a6ef4

Tipo:
registry/documentation validation

Artifact:
test-results/2026-08-06T15-34-19-026Z-4c5f43b00714-fast.json
+ eventuale record locale conclusivo disponibile

Working tree:
clean al checkpoint registrato
```

Se l’artifact locale non deve diventare repository source:

```text
non linkarlo come se fosse versionato.
```

In quel caso indicare:

```text
artifact locale/non repository
```

o soltanto il validation baseline verificato.

## Non fare

Non sostituire:

```text
aefc0ba
```

con:

```text
4c5f43b
```

come code baseline.

Sono semanticamente diversi.

## Criterio di chiusura

Un lettore del root distingue senza inferenza:

```text
code state
documentation recovery
registry metadata stabilization
validation evidence.
```

---

# 12. Le implementazioni dichiarate concluse coincidono con l’indice `IMPL-*`

Il root elenca:

```text
IMPL-001
IMPL-005
IMPL-015
IMPL-028
IMPL-032
```

come concluse.

`implementazioni/06-implementazioni-proposte.md` elenca esattamente gli stessi ID sotto:

```text
Completate
```

Quindi non emerge divergenza root ↔ indice IMPL.

Nessun finding.

---

# 13. Non riaprire `IMPL-015`

Il root dice:

```text
IMPL-015
→ writer authority esclusiva match_history
```

come implementazione conclusa.

La Todo corrente conferma:

```text
IMPL-015 completata
writer authority esclusiva implementata
acquire prima della recovery
secondo backend bloccato
terminal tracker barrier/drain implementati
```

Il fatto che l’audit successivo abbia rilevato:

```text
event authority
recovery semantics
maintenance authority
```

non significa automaticamente:

```text
IMPL-015 non implementata.
```

Sono responsabilità successive/distinte.

---

# 14. Non riaprire `IMPL-028`

Il root la classifica completata.

La Todo corrente conferma:

```text
IMPL-028 completata
```

e il repository possiede il runner/manifest di validazione già auditato.

Nessun finding root-specific.

---

# 15. `IMPL-032` è completata come migrazione infrastrutturale/meccanica

Il root classifica:

```text
IMPL-032
→ migrazione documentale per batch
```

come conclusa.

La migrazione ha effettivamente:

```text
40 MDX iniziali
→ 0 MDX finali
```

e ha completato la conversione strutturale.

Questa classificazione non va cancellata.

---

# 16. Ma “IMPL-032 completata” non prova fidelity perfetta di ogni artifact

Il report 041 ha rilevato:

```text
MIGRATION-VAL-001
```

sulla strength del claim di content preservation.

I report 040 e 042 hanno rilevato:

```text
BETFAIR-VAL-001/002/003
SOURCE-ID-VAL-001/002/003
```

su:

```text
migration source provenance
historical fidelity
evidence-state preservation
summary completeness.
```

Questi finding non implicano:

```text
rifare la migrazione
```

ma impediscono di interpretare:

```text
migrazione completata
```

come:

```text
ogni contenuto migrato semanticamente perfetto
e ogni historical validation già riallineata.
```

---

# 17. Il root mescola completion meccanica e correttezza semantica

Sezione:

```text
Documentazione e registri
```

dice:

```text
Migrazione .mdx → .md
→ completata
→ 40 file legacy sostituiti e rimossi
→ link strict verificati
```

Questo è corretto sul piano:

```text
meccanico/strutturale.
```

Subito prima, però, il root afferma:

```text
La documentazione canonica descrive il comportamento reale.
```

La combinazione può essere letta come:

```text
conversione conclusa
+
documentazione semanticamente allineata
+
nessuna discrepanza owner corrente.
```

Questa conclusione non è supportata.

---

# 18. La Todo dello stesso commit dimostra che esistono discrepanze documentali note

La Todo corrente contiene finding confermati come:

```text
DOC-018
→ pipeline integrity frontend descritta ma non collegata

DOC-019
→ hardening Python descritto più forte del codice

DOC-020
→ percorso .pending_commits errato in alcuni documenti

DOC-022
→ Current State non aggiornato
```

Quindi, all’interno dello stesso sistema di registri:

```text
“documentazione canonica descrive il comportamento reale”
```

non può essere una garanzia fattuale assoluta.

È al massimo:

```text
regola/obiettivo della documentazione canonica.
```

---

# 19. `DEC-025` è una policy, non una certificazione globale

`DEC-025` stabilisce:

```text
la nuova documentazione canonica
descrive soltanto comportamento presente
```

come decisione di riscrittura.

Questo significa:

```text
deve descrivere
```

non:

```text
ogni file corrente è già verificato perfetto.
```

Il root trasforma una regola normativa in una frase fattuale.

---

# 20. `ROOT-REG-003` — separare policy documentale, migrazione meccanica e stato semantico

**Priorità:** high  
**Tipo:** root state aggregation / evidence strength

## Problema

Attuale:

```text
La documentazione canonica descrive il comportamento reale.
```

è troppo assoluto rispetto agli stessi finding correnti.

Inoltre:

```text
migrazione completata
```

non distingue:

```text
conversione strutturale
da
fidelity semantica.
```

## Correzione suggerita

Formula equivalente:

```text
La documentazione canonica è l’owner tecnico corrente
e deve descrivere il comportamento reale.

Le discrepanze note fra documentazione, codice e prove
restano registrate nella Todo e nei registri analitici
finché non vengono corrette e verificate.
```

Per la migrazione:

```text
Migrazione strutturale .mdx → .md
→ completata

Allineamento semantico/fidelity
→ soggetto ai finding documentali ancora aperti
```

## Dipendenze, non duplicate

```text
DOC-018
DOC-019
DOC-020
DOC-022

CURRENT-STATE-001..003

MIGRATION-VAL-001
BETFAIR-VAL-001..003
SOURCE-ID-VAL-001..003
```

Il root non deve copiare tutte le schede.

Deve soltanto evitare l’overclaim.

---

# 21. Il root sintetizza correttamente il ricontrollo D1–D18

Il root dice:

```text
Ricontrollo D1–D18
→ completato
```

Il file owner `04-task-completate.md` conferma:

```text
18 task ricontrollate
9 confermate
7 confermate con limiti
2 da riaprire parzialmente
```

Quindi:

```text
ricontrollo completato
```

significa correttamente:

```text
attività di review conclusa
```

non:

```text
tutte le task perfette.
```

Nessun finding su questa frase, purché la distinzione resti chiara.

---

# 22. “Audit statico del codice completato” è supportato ma deve restare un activity state

`01-piano-generale-audit.md` registra:

```text
BLOCCO C
→ prima analisi statica per tutti i settori completata
→ test presenti letti
→ suite non eseguite
```

`03-audit-codice.md` registra:

```text
Punto 7 completato
→ audit tecnico Punti 1–7 concluso
```

Quindi la frase root non è falsa.

---

# 23. Le checklist C ancora aperte non contraddicono automaticamente l’audit concluso

La Todo conserva:

```text
C2…C13
```

con molte voci:

```text
[ ]
[-]
```

ma spiega che:

```text
le checklist C1–C13 conservano
gli stati osservati durante l’audit
e le voci aperte non vengono promosse
senza nuova verifica.
```

Quindi:

```text
audit activity complete
≠
all checklist items complete.
```

Non creare una task per “audit non completato”.

---

# 24. Il root potrebbe qualificare meglio il livello probatorio, ma non serve un quarto Change ID

Durante la revisione `ROOT-REG-003` conviene aggiungere una formula compatta:

```text
Audit statico del codice
→ attività di analisi completata
→ suite non rieseguite come parte di quell’audit
→ finding e copertura aperti restano nella Todo
```

Questo evita ambiguità senza creare una nuova task.

---

# 25. Il root e la Todo sono coerenti sulla selezione della prossima task

Root:

```text
Prossimo passo:
DA SELEZIONARE
```

Todo:

```text
Nessuna delle voci prioritarie
è stata selezionata automaticamente
come prossima task.
```

`03-audit-codice.md` dice lo stesso.

Nessun finding.

---

# 26. La lista di priorità root è coerente con i gruppi IMPL correnti

Il root raggruppa:

```text
session authority
Betfair authority/control plane
storage/recovery
Evidence provenance/eligibility
fixture/frontend harness/result ledger
diagnostica/retention/cleanup
```

La Todo contiene gli owner corrispondenti:

```text
IMPL-006
IMPL-016/017
IMPL-019/020/021
IMPL-022/023/024
IMPL-025/026/027
IMPL-029/030/031
```

La sintesi root è utile e non duplica le schede.

Da preservare.

---

# 27. Il problema più grave di governance è la policy `docs/archive/`

Il root corrente dice:

```text
docs/archive/
→ materiali storici o futuri non canonici
→ conservati intenzionalmente per uso successivo
```

e nelle regole di manutenzione:

```text
i materiali non canonici dichiarati utili
possono essere conservati in docs/archive

docs/archive
non viene incluso
nelle pulizie automatiche o generiche.
```

La Todo corrente ripete la stessa policy.

---

# 28. Esiste una decisione locale esplicita che spiega questa policy

Il report locale aperto/finale del recupero registra:

```text
ARCHIVE-DEC-001
status: active
```

con decisione:

```text
docs/archive e i contenuti inseriti dall’utente
restano nel repository
perché potranno servire in futuro.
```

e regole:

```text
non canonical
non owner tecnico
non prova implementazione
no generic cleanup
```

Quindi il root non ha inventato la policy.

La decisione esiste realmente come evidenza locale.

---

# 29. Ma `ARCHIVE-DEC-001` non è stata reintegrata nel decision log corrente

Il root dichiara fra le fonti correnti:

```text
implementazioni/99-decisioni-utente.md
```

come owner delle decisioni strutturali.

Il decision log corrente arriva a:

```text
DEC-026
```

e non contiene:

```text
ARCHIVE-DEC-001
```

né una decisione successiva equivalente.

Quindi:

```text
root/Todo
→ consumano policy archive nuova

99-decisioni
→ non la possiede.
```

Questo viola il principio:

```text
una decisione strutturale
deve avere un owner riconoscibile.
```

---

# 30. `DEC-026` contiene una policy diversa

`DEC-026` dice:

```text
il repository non deve conservare
prompt, backlog, pacchetti esecutivi o ODT separati
quando il contenuto utile è già nei documenti di lavoro
```

e:

```text
docs/archive/README.md
conserva una descrizione breve
della provenienza e destinazione
```

Questa policy era coerente con il cleanup storico del 4 agosto.

Il root corrente dice invece:

```text
materiali storici/futuri non canonici
possono restare in docs/archive
per uso successivo.
```

Sono due regole diverse.

---

# 31. `00-metodo-e-stati.md` conserva ancora la vecchia regola

La sezione storica del metodo dice in sostanza:

```text
docs/archive/README.md
→ soltanto mappa di provenienza

backlog, prompt e planning separati
→ non restano nel repository
dopo assorbimento
```

Anche questo non è allineato al root/Todo correnti.

Quindi la divergenza non è soltanto:

```text
root vs DEC-026
```

ma:

```text
root/Todo
vs
00-metodo
vs
99-decisioni.
```

---

# 32. Il root stesso rende la divergenza più difficile da vedere

Il root dice:

```text
Le decisioni più recenti sintetizzate includono
DEC-025 e DEC-026.
```

Questo induce il lettore a pensare che la policy archive corrente derivi da:

```text
DEC-026
```

quando `DEC-026` contiene una regola sostanzialmente diversa.

Questa frase va corretta.

---

# 33. `ROOT-REG-001` — riallineare l’authority della policy archive

**Priorità:** high  
**Tipo:** decision authority / registry consistency

## Problema

Policy corrente effettivamente applicata:

```text
ARCHIVE-DEC-001
→ preserve user-added archive content
→ non canonical
→ non owner
→ no generic cleanup
```

ma l’owner Git dichiarato delle decisioni:

```text
implementazioni/99-decisioni-utente.md
```

non contiene questa decisione.

Al contrario conserva:

```text
DEC-026
```

con la precedente policy di consolidamento/rimozione.

`00-metodo-e-stati.md` conserva a sua volta la regola precedente.

## Azione

Registrare nel decision log una decisione strutturale superseding.

Possibili forme:

```text
A.
nuovo DEC con il prossimo ID disponibile
→ preservazione archive corrente
→ DEC-026 marcata superseded per la sola policy di cleanup generale
```

oppure:

```text
B.
aggiornamento esplicito di DEC-026
con sezione di supersession datata
senza riscrivere retroattivamente la decisione storica originaria.
```

La soluzione deve preservare la storia.

## Aggiornare poi

```text
implementazioni/00-metodo-e-stati.md
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
eventuali README/index consumer
```

senza duplicare l’intera decisione.

## Non fare

Questa task NON autorizza:

```text
cancellazione docs/archive
ripristino docs/archive/README.md
spostamento file archive
cleanup automatico
```

Riguarda soltanto:

```text
authority e coerenza della decisione.
```

## Criterio di chiusura

Esiste una sola policy corrente riconoscibile e:

```text
decision log
→ owner

metodo
→ regola operativa

root/Todo
→ consumer sintetici
```

sono coerenti.

---

# 34. Non ricreare `docs/archive/README.md` come effetto collaterale

Il report 038/037 ha già stabilito che il vecchio:

```text
docs/archive/README.md
```

non è un owner corrente.

`ROOT-REG-001` non deve usare la vecchia DEC-026 per ricrearlo automaticamente.

Prima si riallinea la decisione corrente.

Poi i consumer seguono la policy risultante.

---

# 35. `CURRENT-STATE-002` resta separata

`CURRENT-STATE-002` possiede il problema:

```text
Current State
→ riferimento a docs/archive/README.md assente
```

`ROOT-REG-001` possiede invece:

```text
decision authority
→ quale policy archive è corrente
```

Non sono la stessa task.

---

# 36. `IMPL-005` non risolve la divergenza semantica da sola

`IMPL-005` verifica:

```text
coerenza degli ID
Todo ↔ registri
scansione ricorsiva
```

Il checker può essere verde anche quando:

```text
root dice A
00-metodo dice B
DEC-026 dice B
```

perché la divergenza è semantica.

Quindi `ROOT-REG-001` non duplica `IMPL-005`.

Un eventuale hardening checker futuro può consumare la decisione, non sostituirla.

---

# 37. Il recupero root precedente è chiuso e non va riaperto come task storica

Il record locale conclusivo dichiara:

```text
ROOTMD-LOCAL-CLOSED-001
overall: closed
open_findings: 0
open_tasks: 0
pending_validations: 0
```

Quindi non riaprire:

```text
ROOTMD-META-001
ROOTMD-RECOVERY-001
```

come se fossero falliti.

I nuovi finding 043 derivano dal confronto più ampio con:

```text
decision log
method registry
new audit evidence
```

e hanno scope diverso.

---

# 38. I risultati dei checker del recupero sono attendibili

Il record conclusivo registra:

```text
registry tests 18 PASS
nested 2 PASS
registry 240/214 0/0
links 72/428 0/0
fast 6/0/0
diff PASS
working tree clean
```

Quindi non creare:

```text
ROOT-REG-004
→ risultati inventati
```

Non c’è evidenza per farlo.

---

# 39. Ma il root deve evitare il termine dinamico “ultimo” senza baseline

La frase:

```text
Risultati dell’ultimo controllo
```

invecchia male.

Dopo una nuova modifica:

```text
“ultimo”
```

può non essere più l’ultimo.

Meglio:

```text
Ultimo controllo registri validato
Baseline: <SHA>
Data/run/artifact: <se disponibile>
```

Questo rientra in:

```text
ROOT-REG-002.
```

---

# 40. La Todo è più precisa del root sulla natura del recovery checkpoint

La patch di `4c5f43b` ha trasformato nella Todo:

```text
Verifiche dell’ultimo checkpoint
```

in:

```text
Verifiche del recupero pubblicato
```

e ha aggiunto:

```text
base del recupero
commit di applicazione
```

Il root, invece, mantiene:

```text
Risultati dell’ultimo controllo
```

Quindi il root è meno preciso della propria vista operativa.

Da correggere tramite `ROOT-REG-002`.

---

# 41. Il root non deve diventare una copia della Todo per risolvere il problema

Non aggiungere:

```text
tutte le 214 righe
tutte le checklist A–G
tutti gli owner IMPL
tutti i finding DOC/CODE/etc.
```

Il root deve restare breve.

La correzione richiesta è solo:

```text
baseline/provenance
policy vs state
decision authority
```

---

# 42. Le regole di manutenzione owner/Todo sono corrette

Il root dice:

```text
ogni ID owner
→ una sola scheda dettagliata

Todo
→ una riga sintetica per owner

indici
→ non duplicano schede
```

Questo è coerente con:

```text
implementazioni/README.md
00-metodo-e-stati.md
```

Da preservare.

---

# 43. “Una voce approvata non viene descritta come implementata” è corretta

Questa regola è essenziale.

Il root separa:

```text
implementazioni concluse
```

da:

```text
priorità da scegliere
```

e `06-implementazioni-proposte.md` conserva la stessa distinzione.

Nessun finding.

---

# 44. “Una funzione futura non diventa documentazione canonica” è corretta come policy

È coerente con:

```text
DEC-025
```

Il problema non è la policy.

Il problema è la frase fattuale precedente:

```text
la documentazione canonica descrive il comportamento reale
```

senza qualificare i finding ancora aperti.

---

# 45. “Storico delle revisioni affidato ai commit Git” non deve assorbire le decisioni correnti

La cronologia può stare nei commit.

Ma una decisione strutturale ancora attiva, come:

```text
ARCHIVE-DEC-001
```

non può vivere soltanto:

```text
in un artifact locale
+
nella diff Git
+
nei consumer root/Todo.
```

Se è policy corrente, deve avere un owner corrente.

Questo rafforza `ROOT-REG-001`.

---

# 46. Il root non deve incorporare l’intero artifact locale ROOTMD

L’artifact locale è utile come evidence.

Non deve diventare:

```text
nuovo registro canonico in repository
```

Il root può consumarne soltanto:

```text
baseline validata
run/artifact
risultati sintetici
```

La storia dettagliata resta fuori dal root.

---

# 47. Aspetti corretti da preservare

```text
1. root come entry point, non owner tecnico;
2. Todo come vista sintetica;
3. registri modulari come owner analitici;
4. docs come owner tecnici;
5. validations separate;
6. code baseline aefc0ba;
7. recovery base 8f936d1;
8. recovery application 2ebe7e8;
9. nessuna code change dopo aefc0ba fino a 4c5f43b;
10. 4 moduli audit documentazione;
11. 7 moduli audit codice;
12. 7 moduli implementazioni proposte;
13. IMPL-001 completed;
14. IMPL-005 completed;
15. IMPL-015 completed;
16. IMPL-028 completed;
17. IMPL-032 completed;
18. next task non selezionata automaticamente;
19. priorità sintetiche coerenti con Todo;
20. no duplicate owner cards negli indici;
21. no automatic Git;
22. checker/link/fast/diff dopo modifiche registri.
```

---

# 48. Aspetti da non reinterpretare

Non trasformare:

```text
audit completed
→ all bugs fixed
```

Non trasformare:

```text
IMPL-032 completed
→ perfect semantic migration
```

Non trasformare:

```text
links 0 errors
→ all docs technically true
```

Non trasformare:

```text
registry checker green
→ all decision semantics coherent
```

Non trasformare:

```text
aefc0ba code baseline
→ stale code
```

Non trasformare:

```text
2ebe7e8 recovery application
→ current validated registry baseline
```

Non trasformare:

```text
ARCHIVE-DEC-001 local evidence
→ owner decision already integrated in 99-decisioni.
```

---

# 49. Finding esistenti da NON duplicare

## `DOC-018`

Possiede:

```text
integrity frontend descritta ma non collegata
```

Il root la usa soltanto come esempio di discrepanza documentale ancora aperta.

---

## `DOC-019`

Possiede:

```text
hardening Python documentato più forte del codice
```

---

## `DOC-020`

Possiede:

```text
path .pending_commits errati
```

---

## `DOC-022`

Possiede:

```text
Current State non aggiornato
```

---

## `WORKFLOW-002`

Possiede:

```text
Todo ↔ registri
```

Non possiede la decision conflict archive.

---

## `WORKFLOW-003`

Possiede:

```text
prefissi / registry structure
```

---

## `IMPL-005`

Possiede:

```text
registry consistency automation
```

Non sostituisce il decision owner.

---

## `VALID-ROLL-001`

Possiede:

```text
exact working-tree provenance
per validation future
```

`ROOT-REG-002` riguarda il root registry come consumer dell’ultimo validation baseline.

---

## `CURRENT-STATE-001..003`

Possiedono:

```text
Current State provenance
stale archive README
historical validation inventory
```

Non possiedono il root registry.

---

## `MIGRATION-VAL-001`

Possiede:

```text
evidence strength della migration finalization
```

---

## `BETFAIR-VAL-001..003`

Possiedono:

```text
fidelity della historical Betfair validation
```

---

## `SOURCE-ID-VAL-001..003`

Possiedono:

```text
fidelity della historical Source Identity validation
```

`ROOT-REG-003` non li sostituisce.

Deve soltanto evitare che il root dichiari semantic closure globale.

---

# 50. Nuovi finding

```text
ROOT-REG-001 — high
Archive policy decision authority divergence

ROOT-REG-002 — high
Root registry validation baseline/provenance

ROOT-REG-003 — high
Policy vs factual documentation/migration state
```

Nuove task runtime:

```text
0
```

---

# 51. `ROOT-REG-001` — summary

```text
root/Todo:
preserve archive content

local evidence:
ARCHIVE-DEC-001 active

99-decisioni:
DEC-026 = old consolidation/removal policy

00-metodo:
old archive README / removal rule

→ authority divergence
```

Correzione:

```text
superseding DEC owner
+
method alignment
+
root/Todo remain consumers
```

---

# 52. `ROOT-REG-002` — summary

```text
results exist:
4c5f43b validation

root wording:
“ultimo controllo”
without explicit registry baseline/artifact

→ provenance incomplete
```

Correzione:

```text
last validated registry baseline
+
validation scope/artifact
```

senza confondere:

```text
code SHA
recovery SHA
registry SHA.
```

---

# 53. `ROOT-REG-003` — summary

```text
policy:
canonical docs should describe reality

fact:
same registry contains confirmed doc divergences

mechanical migration:
complete

semantic fidelity:
not fully closed
```

Correzione:

```text
policy wording
+
known deviations remain tracked
+
mechanical migration ≠ semantic perfect alignment.
```

---

# 54. Correzione documentale consigliata — baseline

Esempio sintetico:

```text
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main

Application code baseline verified:
aefc0ba...

Documentation recovery base:
8f936d1...

Recovery application commit:
2ebe7e8...

Last registry baseline independently validated:
4c5f43b...
```

Non chiamare tutti e quattro:

```text
current SHA.
```

---

# 55. Correzione documentale consigliata — validation results

Da:

```text
## Risultati dell’ultimo controllo
```

A equivalente:

```text
## Ultimo controllo registri validato

Baseline registri:
4c5f43b...

Scope:
registry checker
documentation links
fast profile
git diff
working tree
```

Poi i risultati già esistenti.

---

# 56. Correzione documentale consigliata — canonical docs

Da:

```text
La documentazione canonica descrive il comportamento reale.
```

A:

```text
La documentazione canonica è l’owner tecnico corrente
e deve descrivere il comportamento reale.

Le discrepanze già rilevate restano nei registri
fino a correzione e verifica.
```

---

# 57. Correzione documentale consigliata — migration

Da:

```text
Migrazione .mdx → .md
→ completata
```

A:

```text
Migrazione strutturale .mdx → .md
→ completata

Fidelity e allineamento semantico
→ seguono i finding documentali ancora aperti
```

Non cambiare:

```text
40 file legacy sostituiti/rimossi
```

se usato come conteggio meccanico storico.

---

# 58. Correzione documentale consigliata — archive decision

Il root non deve diventare owner della decisione.

Dopo il riallineamento del decision log:

```text
docs/archive/
→ consumer summary della decisione <DEC-ID>
```

e basta.

Non copiare nel root tutta la decisione.

---

# 59. Verification matrix proposta

## A. Code baseline

```text
compare aefc0ba → current audited commit
→ no application code changes
```

---

## B. Recovery base

```text
8f936d1
→ documented as recovery base
```

---

## C. Recovery application

```text
2ebe7e8
→ actual recovery/preserve archive commit
```

---

## D. Registry stabilization

```text
4c5f43b
→ modifies root/Todo metadata
```

---

## E. Final registry validation

Verify recorded evidence:

```text
18 PASS
2 PASS
240/214
72/428
fast 6/0/0
diff PASS
tree clean
```

---

## F. Validation artifact

```text
test-results/...4c5f43b...fast.json
→ if repository/local evidence is available
```

Classify availability honestly.

---

## G. Completed IMPL parity

```text
root completed IDs
==
06-implementazioni-proposte completed IDs
```

Expected:

```text
001
005
015
028
032
```

---

## H. Next-task state

```text
root:
DA SELEZIONARE

Todo:
none automatically selected
```

Must agree.

---

## I. Archive root policy

```text
root
Todo
```

must agree with the current decision owner.

---

## J. Archive method policy

```text
00-metodo
```

must agree with the same decision owner.

---

## K. DEC-026

Must be explicitly classified:

```text
current
partially superseded
fully superseded
historical
```

for the archive-retention portion.

No silent contradiction.

---

## L. ARCHIVE-DEC-001

If retained as active current policy:

```text
must be integrated into current decision ownership
```

not left only in local evidence.

---

## M. Canonical docs wording

Must not imply:

```text
zero known documentation discrepancies.
```

---

## N. Migration wording

Must distinguish:

```text
structural conversion complete
semantic fidelity/open findings.
```

---

## O. Audit completion

Must remain:

```text
activity complete
```

not:

```text
all tasks implemented.
```

---

## P. Registry checker

Run after changes.

---

## Q. Link checker

Run after changes.

---

## R. Fast profile

Run after changes.

---

## S. Git diff check

Run after changes.

---

# 60. Modularizzazione

## Dimensione

```text
174 righe
```

## Responsabilità

Il file svolge una sola funzione coerente:

```text
entry point operativo
→ baseline
→ link ai registri
→ stato sintetico
→ priorità
→ regole minime
→ next step.
```

Le schede analitiche sono già modularizzate altrove.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
implementazioni-baseline.md
implementazioni-status.md
implementazioni-priorita.md
```

Il valore del root è proprio essere un orientation layer compatto.

---

# 61. Ordine consigliato

```text
1. ROOT-REG-001
   → decision authority archive

2. ROOT-REG-003
   → policy vs factual state
   → structural migration vs semantic fidelity

3. ROOT-REG-002
   → validation baseline/provenance

4. allineare 00-metodo e 99-decisioni
   senza duplicare owner

5. mantenere Todo come vista sintetica

6. registry checker

7. link checker

8. fast profile

9. git diff --check

10. nessuna modifica runtime
```

---

# 62. Decisione finale

```text
implementazioni-tennis-decision-ui.md:

ENTRY POINT STRUTTURALMENTE BUONO.

NON RISCRIVERE COMPLETAMENTE.
NON DIVIDERE.

BASELINE CODICE:
aefc0ba
→ CORRETTA

RECOVERY BASE:
8f936d1
→ CORRETTA

RECOVERY APPLICATION:
2ebe7e8
→ CORRETTA

REGISTRY STABILIZATION:
4c5f43b
→ reale
→ non esplicitata come last validated registry baseline nel root

VALIDATION RESULTS:
18 PASS
2 PASS
240 / 214
72 / 428
fast 6 PASS
diff PASS
tree clean
→ supportati da artifact conclusivo

COMPLETED IMPL:
001 / 005 / 015 / 028 / 032
→ coerenti con indice IMPL

NEXT TASK:
DA SELEZIONARE
→ coerente

NUOVI PROBLEMI:

ROOT-REG-001 — HIGH
→ archive preservation policy vive in root/Todo
  e in ARCHIVE-DEC-001 locale
  ma non ha owner coerente nel decision log Git;
  DEC-026 e 00-metodo conservano la policy precedente.

ROOT-REG-002 — HIGH
→ risultati reali dell’ultimo registry validation
  non sono legati nel root a
  last validated registry baseline / artifact.

ROOT-REG-003 — HIGH
→ “canonical docs describe real behavior”
  è un overclaim fattuale;
  mechanical migration complete
  non equivale a semantic fidelity complete.

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

La regola di governance da preservare è:

```text
root registry
→ sintetizza

decision log
→ decide

Todo
→ mostra stato

registri analitici
→ possiedono finding/task

docs
→ possiedono contratti tecnici

validation artifact
→ prova un run specifico

Nessun layer deve assorbire
l’autorità degli altri.
```

---

# 63. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-043

Documento:
implementazioni-tennis-decision-ui.md

Nuovi Change ID:
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003

Finding esistenti richiamati:
DOC-018
DOC-019
DOC-020
DOC-022
WORKFLOW-002
WORKFLOW-003
IMPL-005
VALID-ROLL-001
CURRENT-STATE-001
CURRENT-STATE-002
CURRENT-STATE-003
MIGRATION-VAL-001
BETFAIR-VAL-001
BETFAIR-VAL-002
BETFAIR-VAL-003
SOURCE-ID-VAL-001
SOURCE-ID-VAL-002
SOURCE-ID-VAL-003

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 64. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 43
Da analizzare: 29
Avanzamento: 59,72%

Blocco 043–047:
[✓] 043 implementazioni-tennis-decision-ui.md
[ ] 044 implementazioni/00-metodo-e-stati.md
[ ] 045 implementazioni/01-piano-generale-audit.md
[ ] 046 implementazioni/02-audit-documentazione.md
[ ] 047 implementazioni/03-audit-codice.md
```

Il prossimo documento canonico è:

```text
implementazioni/00-metodo-e-stati.md
```

La mappa e il ledger cumulativi restano invariati fino al report 047.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `ROOT-REG-001, ROOT-REG-003`.
- Task ancora aperte: `ROOT-REG-002`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
