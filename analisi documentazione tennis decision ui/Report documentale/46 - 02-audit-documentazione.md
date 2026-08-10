# Report documentale — `implementazioni/02-audit-documentazione.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-046
Sequenza audit: 46/72
Documento analizzato: 02-audit-documentazione.md
Percorso documento: implementazioni/02-audit-documentazione.md
Percorso report: Report documentale/46 - 02-audit-documentazione.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Contenuto corrente introdotto/normalizzato a partire da: 8f936d1a3686b775e967e375576f52f19da461a5
Dimensione documento corrente: 21 righe
Dimensione UTF-8 ricostruita dal diff corrente: 1115 byte
Git blob SHA calcolato sul contenuto corrente ricostruito: 694a3bbd800d93f923e07d51428d7cd6a5f292e9
SHA-256 contenuto corrente ricostruito: a38024f8b324a0ef65d1dcc0683a948f7dd64bce91310c85d62ee4b58087c7f5
Tipo: facade / indice del registro storico dell’audit documentale
Stato report audit: completato
```

Nota sulla provenienza del blob:

```text
il contenuto corrente è ricostruibile integralmente
dalla patch Git che ha prodotto il facade attuale;

il Git blob SHA riportato sopra
è calcolato sul contenuto UTF-8 ricostruito,
non restituito direttamente da un fetch del blob.
```

Il documento è stato confrontato con:

```text
commit di modularizzazione:
aefc0ba5894d8fca60e5811088fede3ebbfde98a
docs: modularize audit and implementation registries

commit di riallineamento del facade:
8f936d1a3686b775e967e375576f52f19da461a5
docs: align current registries and remove migration residue

commit corrente:
4c5f43b007149f3210c27d7565357a447a3a6ef4
docs: stabilize root registry recovery metadata

implementazioni/README.md
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/audit-codice/07-post-audit-e-migrazione.md

moduli correnti:
implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
implementazioni/audit-documentazione/02-moduli-frontend-python.md
implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md
implementazioni/audit-documentazione/04-processo-e-materiali-storici.md
```

Sono stati inoltre richiamati i finding già aperti:

```text
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003

METHOD-EVIDENCE-001
METHOD-REG-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001

PLAN-AUDIT-001
PLAN-AUDIT-002
PLAN-AUDIT-003

WORKFLOW-002
WORKFLOW-003
WORKFLOW-004
WORKFLOW-005

IMPL-005
```

GitHub non è stato modificato.

La mappa cumulativa e il ledger JSON restano invariati.

Questo è il quarto report del blocco:

```text
043–047
```

Il consolidamento cumulativo avverrà dopo il report 047.

---

# Esito sintetico

```text
Ruolo come facade:                              CORRETTO
Dimensione del facade:                          OTTIMA
Quattro moduli collegati:                       CONFERMATI
Owner card nel facade:                          NESSUNA
Ulteriore split:                                NON necessario
Percorso root stabile:                          CORRETTO
Regola owner unico:                             CORRETTA
Regola no-renumber:                             CORRETTA
Todo sintetica:                                 COERENTE per gli ID del perimetro
Checker/link/fast/diff gate:                    COERENTE
Modularizzazione iniziale:                      STRUTTURALMENTE SOLIDA
Riferimenti storici nei moduli:                 AMMESSI come storico
Scope `DOC-*` / `WORKFLOW-*` del facade:        AMBIGUO / TROPPO AMPIO
Navigazione verso owner successivi:             INCOMPLETA

Nuovi finding:                                  1
Nuove task runtime:                             0
Riscrittura completa:                           NO
Revisione mirata:                               SÌ
Nuovi documenti canonici proposti:              nessuno
Priorità complessiva:                           MEDIO-ALTA
```

La conclusione centrale è:

```text
LA MODULARIZZAZIONE È BUONA
E VA PRESERVATA.

IL FACADE NON DEVE TORNARE A ESSERE
UN MONOLITE DA MIGLIAIA DI RIGHE.

IL SOLO PROBLEMA NUOVO È DI AUTHORITY/NAVIGAZIONE:

il file si presenta come
“indice corrente del registro DOC-* e WORKFLOW-*”
dell’audit documentale,

ma i quattro moduli elencati possiedono soltanto:

DOC-001…023
WORKFLOW-001…003

mentre il progetto ha successivamente creato:

DOC-024…033
WORKFLOW-004…005

in altri registri, soprattutto nell’audit del codice.

Quindi il prefisso globale
non coincide più con questa directory.
```

La correzione corretta NON è:

```text
spostare DOC-024…033 qui
spostare WORKFLOW-004…005 qui
duplicare le schede
rinumerare gli ID
creare altri moduli
```

La correzione è:

```text
dichiarare il perimetro storico B1–B6
di questi quattro moduli

+
indicare dove continuano
gli owner DOC/WORKFLOW successivi.
```

---

# 1. Il file corrente è realmente un facade leggero

Il contenuto corrente è composto da:

```text
titolo
→ una frase di ruolo
→ tabella di quattro moduli
→ sei regole
```

Non contiene:

```text
schede DOC complete
schede WORKFLOW complete
contratti tecnici
test copiati
cronologia estesa
payload
codice.
```

Questo è esattamente il ruolo desiderabile per un indice.

---

# 2. I quattro moduli esistono nel repository corrente

La struttura corrente contiene:

```text
implementazioni/audit-documentazione/
├── 01-rilievi-iniziali-e-api.md
├── 02-moduli-frontend-python.md
├── 03-operations-roadmap-e-controlli.md
└── 04-processo-e-materiali-storici.md
```

Non risultano:

```text
quinto modulo non indicizzato
duplicato root del monolite
secondo audit-documentazione root parallelo.
```

La struttura è coerente.

---

# 3. Il mapping dei quattro moduli è chiaro

Il facade corrente dichiara:

```text
01
→ sezioni 9–11
→ DOC-001…013
→ WORKFLOW-001

02
→ sezioni 12–13
→ DOC-014…019

03
→ sezioni 14–15
→ DOC-020…023
→ WORKFLOW-002…003

04
→ sezioni 16–17
→ decisioni documentali
→ materiali di processo
```

Questo mapping è utile.

Permette di raggiungere le owner card
senza caricare l’intero audit storico.

---

# 4. La modularizzazione originaria era esplicitamente conservativa

Il commit:

```text
aefc0ba5894d8fca60e5811088fede3ebbfde98a
```

trasforma il precedente monolite:

```text
2623 righe
62521 byte
```

in un indice e quattro moduli.

La versione iniziale dell’indice registrava:

```text
blob sorgente ricomponibile
ID non rinumerati
owner una sola volta
checkpoint/addendum in ordine storico
```

e dichiarava che la concatenazione dei quattro moduli
ricostruiva il contenuto precedente.

Questo mostra l’intento corretto:

```text
modularizzazione
≠
riscrittura semantica del registro.
```

---

# 5. Il current facade ha poi rimosso i dettagli tecnici della modularizzazione

Al commit:

```text
8f936d1...
```

l’indice è stato ridotto ulteriormente.

Sono stati rimossi dal facade:

```text
blob sorgente
conteggi byte/righe
tabella con conteggi per modulo
descrizione dettagliata della ricomposizione
```

e sono rimasti:

```text
ruolo corrente
quattro link
perimetro
regole.
```

Questa riduzione non è, di per sé, un problema.

Lo storico della modularizzazione resta in Git.

---

# 6. Non serve riaggiungere nel facade i conteggi della vecchia sorgente

Non proporre:

```text
62521 byte
2623 righe
line count di ogni modulo
source blob
```

come metadata obbligatori permanenti.

Sono utili per il checkpoint di modularizzazione,
non per la navigazione quotidiana.

Se serve verificare nuovamente la fidelity,
lo si fa con uno script/test o con Git history,
non trasformando il facade in un report.

---

# 7. Le differenze dei line count iniziali non sono un finding

La patch di modularizzazione mostra hunk Git
che possono sembrare differire di una riga
dai conteggi inizialmente riportati nel facade
per alcuni moduli.

Questo può dipendere da:

```text
newline ai confini
line count convention
segment boundary
```

e il current facade non usa più quei numeri
come contratto corrente.

Non esiste prova sufficiente per concludere:

```text
contenuto perso.
```

Nessun finding aperto su questo punto.

---

# 8. I moduli storici possono contenere riferimenti `.mdx`

Le owner card furono scritte
prima della migrazione finale Markdown.

È quindi normale trovare nei moduli storici:

```text
index.mdx
source-identity.mdx
current-state.mdx
operations/*.mdx
```

quando la scheda descrive:

```text
il documento analizzato al proprio checkpoint.
```

Non bisogna fare una sostituzione globale:

```text
.mdx → .md
```

dentro ogni osservazione storica.

---

# 9. Il riferimento storico va distinto da un path corrente

Criterio:

```text
“al checkpoint il documento era X.mdx”
→ conservabile

“il current owner è X.mdx”
→ da correggere
```

Questa distinzione va applicata
quando saranno auditati individualmente i quattro moduli:

```text
indici 60–63.
```

Il report 046 non anticipa finding specifici
sui loro singoli contenuti.

---

# 10. Il facade non contiene owner card duplicate

Il current file non presenta heading del tipo:

```text
### DOC-...
### WORKFLOW-...
```

Quindi non è un secondo owner.

La regola:

```text
ogni scheda owner vive in un solo modulo
```

è rispettata a livello di facade.

---

# 11. Il registry checker ricorsivo protegge la duplicazione strutturale

Il sistema corrente usa discovery ricorsiva sotto:

```text
implementazioni/**/*.md
```

e il checkpoint dei registri è stato riportato verde.

Questo supporta la conclusione:

```text
nessun duplicate owner heading noto
nel registry corrente.
```

Non dimostra però:

```text
assenza di duplicazioni semantiche
fra testi diversi.
```

Questa distinzione già appartiene a:

```text
METHOD-REG-001.
```

Non duplicarla.

---

# 12. La regola “gli ID non vengono rinumerati” è corretta

La modularizzazione ha preservato:

```text
DOC-001…
WORKFLOW-001…
```

senza trasformarli in ID locali per modulo.

Questo è importante perché:

```text
Todo
decisioni
audit codice
implementazioni
```

continuano a riferirsi agli stessi ID.

Da preservare.

---

# 13. La regola “Todo contiene una sola riga sintetica per ogni ID” è corretta nel perimetro del facade

Per:

```text
DOC-001…023
WORKFLOW-001…003
```

la Todo possiede le relative righe sintetiche.

Non confondere questa frase con il contratto globale dei `DEC-*`,
che il checker esclude dalla parity E/F.

Il current facade parla di:

```text
registro DOC/WORKFLOW
```

quindi non nasce qui un nuovo problema DEC.

---

# 14. Non duplicare `METHOD-REG-001`

Il report 044 ha già aperto:

```text
METHOD-REG-001
```

per il contratto generale del checker:

```text
recursive owner discovery
Block E + F
DEC exclusion
status vocabulary
strict contradictions
metadata checks.
```

Il report 046 non riapre quel problema.

Qui il problema è:

```text
quale parte del namespace DOC/WORKFLOW
questo specifico indice rappresenta.
```

---

# 15. Il problema nasce dall’evoluzione successiva dell’audit

Al tempo dell’audit documentale B1–B6,
i quattro moduli coprivano:

```text
DOC-001…023
WORKFLOW-001…003.
```

Successivamente,
durante il secondo audit tecnico
e il post-audit,
sono stati creati altri finding documentali/workflow.

La Todo corrente contiene almeno:

```text
DOC-024
DOC-025
DOC-026
DOC-027
DOC-028
DOC-029
DOC-030
DOC-031
DOC-032
DOC-033

WORKFLOW-004
WORKFLOW-005
```

Questi ID sono project-internal,
non finding del presente audit esterno.

---

# 16. `DOC-024…033` non vivono nei quattro moduli di `audit-documentazione/`

Il current facade dichiara esplicitamente
come ultimi DOC del proprio mapping:

```text
DOC-020…023.
```

Gli ID successivi sono nati
in fasi dell’audit tecnico.

Per esempio:

```text
DOC-033
→ documentazione canonica che anticipa contratti
  approvati ma non implementati
```

è registrata nel post-audit tecnico.

Quindi:

```text
prefix DOC
≠
directory audit-documentazione.
```

---

# 17. Anche `WORKFLOW-004` vive nell’audit codice

`WORKFLOW-004` riguarda:

```text
SHA
range
stato sintetico dei registri
```

ed è una owner card del secondo audit tecnico.

Il current audit-code register
ne conserva il dettaglio.

Quindi:

```text
prefix WORKFLOW
≠
directory audit-documentazione.
```

---

# 18. `WORKFLOW-005` è anch’essa post-audit

`WORKFLOW-005` riguarda:

```text
migrazione documentale per batch.
```

È registrata nel post-audit/migrazione,
non nei quattro moduli B1–B6.

Questo conferma che l’espansione dei prefissi
è intenzionale e cross-register.

---

# 19. La frase introduttiva del facade è quindi troppo ampia

Attuale:

```text
Questo file è l’indice corrente
del registro DOC-* e WORKFLOW-*
relativo all’audit documentale.
```

Un lettore ragionevole può interpretarla come:

```text
qui trovo tutti gli owner DOC-*
e WORKFLOW-* correnti.
```

Ma la tabella contiene soltanto:

```text
DOC-001…023
WORKFLOW-001…003.
```

La frase e la tabella
non hanno lo stesso scope.

---

# 20. Anche “nuovi rilievi vanno aggiunti al modulo pertinente” è ambigua

Attuale:

```text
nuovi rilievi
→ modulo pertinente.
```

All’interno di questo file,
“modulo pertinente” può essere interpretato come:

```text
uno dei quattro audit-documentazione/.
```

Ma la storia successiva dimostra
che un nuovo finding `DOC-*`
può appartenere legittimamente a:

```text
audit-codice/
post-audit/
altro owner del registro.
```

Quindi la regola deve essere resa globale:

```text
nuovo rilievo
→ owner module pertinente
nell’intero registry
```

non necessariamente:

```text
uno di questi quattro.
```

---

# 21. Non bisogna spostare retroattivamente DOC-024…033

Una soluzione sbagliata sarebbe:

```text
creare una quinta parte
e spostare DOC-024…033
fuori dall’audit codice.
```

Questo romperebbe:

```text
sequenza storica
contesto della scoperta
modularizzazione per dominio/fase.
```

Gli owner successivi devono restare
dove furono normalizzati.

---

# 22. Non bisogna duplicare gli owner nel facade

Altra soluzione sbagliata:

```text
aggiungere le schede complete DOC-024…033
in 02-audit-documentazione.md.
```

Violerebbe:

```text
owner unico
facade leggero
registry checker.
```

Il facade deve aggiungere soltanto:

```text
navigation / scope.
```

---

# 23. Non bisogna rinumerare i prefissi per far coincidere directory e tipo

Non proporre:

```text
DOC2-024
CODEDOC-024
WORKFLOW-CODE-004
```

Gli ID sono globali e storici.

Il problema è di navigazione,
non di namespace numerico.

---

# 24. `DOC-AUDIT-IDX-001` — chiarire il perimetro del facade e la continuazione degli owner

**Priorità:** high  
**Tipo:** registry prefix scope / owner navigation

## Problema

Il current facade si presenta come:

```text
indice corrente del registro DOC-* e WORKFLOW-*
relativo all’audit documentale
```

ma mappa soltanto:

```text
DOC-001…023
WORKFLOW-001…003.
```

Il progetto contiene owner successivi:

```text
DOC-024…033
WORKFLOW-004…005
```

in altri moduli.

## Rischio

Un manutentore può:

```text
A.
cercare DOC-033 nei quattro moduli
→ non trovarlo;

B.
aggiungere una seconda owner card DOC-033
→ duplicate owner;

C.
spostare finding storici per “completare” il range
→ perdere contesto;

D.
aggiungere ogni nuovo DOC/WORKFLOW
a audit-documentazione/
anche quando nasce nell’audit codice.
```

Il registry checker può intercettare
alcune duplicazioni strutturali,
ma non evita il problema di navigazione/authority
prima della modifica.

---

# 25. Correzione consigliata per la frase introduttiva

Formula equivalente:

```text
Questo file è l’indice corrente
dei moduli storici dell’audit documentale B1–B6.

Questi moduli possiedono:
DOC-001…023
WORKFLOW-001…003.

I finding DOC/WORKFLOW creati
nelle fasi tecniche successive
restano nei rispettivi moduli owner
dell’audit codice/post-audit
e sono sintetizzati nella Todo.
```

Non è necessario usare esattamente questo testo,
ma il confine deve essere esplicito.

---

# 26. Correzione consigliata per la regola dei nuovi rilievi

Da:

```text
nuovi rilievi vanno aggiunti al modulo pertinente
```

a qualcosa di equivalente:

```text
un nuovo rilievo viene aggiunto
al modulo owner pertinente
nell’intero registro implementazioni/;

non è il prefisso DOC/WORKFLOW
a determinare automaticamente
la directory owner.
```

Questo evita di confondere:

```text
tipo di ID
con
fase/domain owner.
```

---

# 27. Aggiungere navigazione, non contenuto duplicato

Il facade può includere una nota breve:

```text
Continuazione dei prefissi:

DOC-024…033
WORKFLOW-004…005
→ vedere audit codice/post-audit
→ Todo come indice sintetico globale.
```

Non serve una tabella enorme.

---

# 28. La Todo resta il punto globale migliore per trovare un ID

La struttura corrente dichiara:

```text
Todo
→ vista sintetica unica.
```

Questo è particolarmente utile
proprio perché gli stessi prefissi
possono vivere in moduli diversi.

Quindi il facade dovrebbe rimandare a:

```text
todo-list-tennis-decision-ui.md
```

per:

```text
ricerca globale ID
stato sintetico
owner/navigation.
```

---

# 29. `implementazioni/README.md` può restare l’indice dei registri

Non serve trasformare `02-audit-documentazione.md`
in un secondo super-indice.

La gerarchia corretta resta:

```text
implementazioni/README.md
→ quali registri esistono

Todo
→ quali ID/stati esistono globalmente

02-audit-documentazione.md
→ storico/moduli B1–B6 documentali

03-audit-codice.md
→ audit tecnico e finding successivi

moduli
→ owner card.
```

---

# 30. Il facade non deve diventare current-state owner dei finding

La frase:

```text
indice corrente
```

può significare:

```text
current file used for navigation
```

non:

```text
tutti i finding dentro sono current/unresolved.
```

È utile precisarlo.

Gli stati owner possono essere:

```text
CONFERMATO
COMPLETATO
APPROVATO
storico
```

e la Todo è l’authority sintetica.

---

# 31. I moduli conserveranno storia non sincronizzata riga per riga

Questo è intenzionale.

Una owner card può dire:

```text
al checkpoint:
.mdx
```

anche se oggi il file è `.md`.

Una scheda può descrivere:

```text
finding successivamente risolto.
```

Il current state non si ottiene
riscrivendo ogni frase storica.

---

# 32. Questo principio è coerente con il post-audit

Il progetto ha già scelto:

```text
storico delle revisioni
→ commit Git

owner card
→ non riscrivere retroattivamente la scoperta

Todo
→ stato sintetico.
```

Il facade deve aiutare questa lettura,
non cancellarla.

---

# 33. Non aggiungere nel facade i finding del presente audit esterno

I Change ID creati dai report documentali 001–046
appartengono al nostro ledger esterno di audit:

```text
TDUI-DOC-REPORT-...
```

Non devono essere inseriti automaticamente
nel project registry solo perché esistono.

Qualsiasi ingestion futura
deve essere una task esplicita.

---

# 34. Distinguere project-internal DOC dagli external Change ID

Il finding `DOC-AUDIT-IDX-001`
del presente report è:

```text
Change ID dell’audit documentale esterno
```

non:

```text
nuovo DOC-034 del progetto.
```

Non assegnare numerazione project-internal
durante questo audit.

---

# 35. Il current facade non necessita di baseline propria

A differenza di:

```text
root registry
Todo
validation artifact
historical checkpoint
```

questo file non contiene:

```text
risultati di test
SHA del codice
claim runtime
stato tecnico.
```

È soltanto navigazione.

Non serve introdurre:

```text
current SHA
working tree
run artifact
```

in ogni aggiornamento minore del facade.

La regola generale del README
sugli aggiornamenti sostanziali
va applicata con buon senso
e sarà trattata dai finding del metodo/piano.

---

# 36. Non creare `DOC-AUDIT-IDX-002` per la provenance del facade

Il facade ha una storia Git chiara:

```text
aefc0ba
→ modularizzazione iniziale

8f936d1
→ semplificazione/current alignment
```

e non pretende di essere un validation artifact.

Un nuovo finding provenance sarebbe eccessivo.

---

# 37. La regola checker/link/fast/diff è coerente

Il current facade richiede dopo le modifiche:

```text
registry checker
link checker
fast
git diff --check.
```

Questa è coerente con:

```text
03-audit-codice.md
06-implementazioni-proposte.md
root workflow.
```

Da preservare.

---

# 38. Il facade non deve dettagliare il contratto dei checker

Il report 044 ha aperto:

```text
METHOD-REG-001
```

per spiegare correttamente cosa verifica `IMPL-005`.

Il facade deve limitarsi a:

```text
eseguire il checker.
```

Non copiare:

```text
parity E/F
DEC exclusion
status tokens
SHA checks
range checks.
```

---

# 39. La modularizzazione corrente è già sufficiente

Dimensione:

```text
21 righe
```

Responsabilità:

```text
navigazione dei quattro moduli storici
+
regole minime.
```

Non esiste una motivazione per dividerlo.

---

# 40. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 41. Non creare un quinto modulo solo per i nuovi DOC

Gli ID successivi non sono semplicemente:

```text
“parte 5 dell’audit documentale”.
```

Sono nati durante:

```text
secondo audit codice
frontend
Evidence
validation
post-audit
migrazione.
```

Il loro contesto è parte dell’evidenza.

Rimangono nei moduli dove furono prodotti.

---

# 42. Non usare il range numerico come unico owner resolver

Una regola fragile sarebbe:

```text
DOC-001…999
→ audit-documentazione/
```

perché è già falsa.

Il resolver corretto è:

```text
Todo / registry checker / owner heading
→ path owner effettivo.
```

Il prefisso descrive la categoria,
non la directory.

---

# 43. L’indice può mostrare range storici, non range globali

La tabella:

```text
DOC-001…013
DOC-014…019
DOC-020…023
```

è corretta se presentata come:

```text
range posseduti da questa fase storica.
```

Non va rimossa.

Serve soltanto una nota:

```text
i prefissi continuano altrove.
```

---

# 44. `WORKFLOW-001…003` sono anch’essi range storici corretti

Non spostare:

```text
WORKFLOW-004
WORKFLOW-005
```

nei vecchi moduli
solo per rendere numericamente continuo il range.

La numerazione globale
può attraversare più fasi.

---

# 45. Il fourth module non è un owner tecnico corrente

`04-processo-e-materiali-storici.md`
contiene:

```text
decisioni documentali
materiali di processo
storico.
```

Questo è coerente con la natura del registro.

Non trasformarlo in:

```text
decision log corrente
```

perché esiste:

```text
99-decisioni-utente.md.
```

Il suo contenuto sarà auditato individualmente al report 063.

---

# 46. I moduli 60–63 richiederanno audit individuale

Ordine canonico futuro:

```text
60 implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
61 implementazioni/audit-documentazione/02-moduli-frontend-python.md
62 implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md
63 implementazioni/audit-documentazione/04-processo-e-materiali-storici.md
```

Il report 046 non deve anticipare
tutti i loro finding.

Oggi verifichiamo soltanto:

```text
facade
mapping
ownership
navigation
modularization.
```

---

# 47. Aspetti corretti da preservare integralmente

```text
1. facade di 21 righe;
2. quattro moduli;
3. link relativi;
4. range DOC-001…023 storico;
5. WORKFLOW-001…003 storico;
6. sezione processo/materiali separata;
7. owner unico;
8. ID non rinumerati;
9. Todo sintetica;
10. nuovi rilievi senza duplicazione owner;
11. history via Git;
12. registry checker dopo modifica;
13. link checker dopo modifica;
14. fast dopo modifica;
15. git diff --check;
16. nessun contratto tecnico nel facade;
17. nessuna owner card nel facade;
18. nessun ulteriore split.
```

---

# 48. Aspetti da correggere

```text
DOC-AUDIT-IDX-001 — HIGH

→ delimitare il facade ai moduli B1–B6
→ DOC-001…023
→ WORKFLOW-001…003

→ indicare che i prefissi
  continuano nei registri tecnici successivi

→ chiarire che un nuovo DOC/WORKFLOW
  va nel modulo owner pertinente
  dell’intero registry,
  non automaticamente in questa directory.
```

---

# 49. Finding esistenti da NON duplicare

## `METHOD-REG-001`

Possiede:

```text
contratto generale registry checker.
```

`DOC-AUDIT-IDX-001` possiede:

```text
scope/navigation
di questo facade specifico.
```

---

## `WORKFLOW-002`

Possiede lo storico problema:

```text
Todo ↔ registro analitico divergenti.
```

Il nuovo finding non dice
che la parity corrente sia rotta.

Dice:

```text
navigation scope ambiguo
anche con parity verde.
```

---

## `WORKFLOW-004`

Possiede:

```text
SHA/range/stato sintetico
fra registri.
```

Il nuovo finding non apre
una nuova automazione di range.

---

## `ROOT-REG-003`

Possiede:

```text
overclaim sullo stato globale dei docs.
```

Questo facade non fa claim tecnico globale.

---

## `PLAN-AUDIT-001`

Possiede:

```text
historical plan vs current plan authority.
```

Qui il tema è:

```text
historical owner range vs global prefix navigation.
```

---

# 50. Nuovo finding

## `DOC-AUDIT-IDX-001`

**Titolo:** Delimitare il namespace del facade dell’audit documentale  
**Priorità:** high  
**Tipo:** registry prefix scope / owner navigation

### Evidenza

Facade:

```text
“registro DOC-* e WORKFLOW-*”
```

Tabella:

```text
DOC-001…023
WORKFLOW-001…003
```

Project registry successivo:

```text
DOC-024…033
WORKFLOW-004…005
```

con owner fuori da `audit-documentazione/`.

### Azione

1. dichiarare che i quattro moduli
   conservano l’audit documentale B1–B6;

2. mantenere i range storici;

3. aggiungere un pointer alla continuazione
   degli ID nei registri successivi;

4. chiarire che il prefisso
   non determina la directory owner;

5. lasciare Todo come vista sintetica globale;

6. non spostare o duplicare owner esistenti.

### Criterio di chiusura

Dato un ID:

```text
DOC-010
DOC-025
DOC-033
WORKFLOW-002
WORKFLOW-004
WORKFLOW-005
```

un lettore può capire:

```text
se appartiene ai quattro moduli B1–B6
oppure a una fase successiva

e dove trovare l’owner
senza creare duplicati.
```

---

# 51. Verification matrix proposta

## A. Facade

```text
nessuna owner card
```

---

## B. Moduli

Esistono:

```text
01
02
03
04
```

---

## C. Link

Tutti e quattro i link relativi risolvono.

---

## D. Historical ranges

```text
DOC-001…023
WORKFLOW-001…003
```

restano associati ai quattro moduli.

---

## E. Later DOC range

Verificare owner reali:

```text
DOC-024…033
```

senza spostarli.

---

## F. Later WORKFLOW range

Verificare owner reali:

```text
WORKFLOW-004
WORKFLOW-005
```

senza spostarli.

---

## G. Todo

Ogni project ID non-DEC
mantiene la propria riga sintetica canonica.

---

## H. Duplicate owner

```text
registry checker
→ 0 duplicate owner.
```

---

## I. Prefix

Non imporre:

```text
DOC => audit-documentazione
WORKFLOW => audit-documentazione.
```

---

## J. New finding rule

Documentare:

```text
new finding
→ relevant owner module in whole registry.
```

---

## K. Historical `.mdx`

Non correggere in massa.

---

## L. Current paths

Quando un modulo parla di owner corrente,
deve usare il path corrente.

Questo verrà verificato nei report 060–063.

---

## M. Registry checker

Dopo modifica:

```text
0 errori
0 warning.
```

---

## N. Documentation links

Dopo modifica:

```text
strict link checker
→ PASS.
```

---

## O. Fast

```text
fast profile
→ PASS.
```

---

## P. Diff

```text
git diff --check
→ PASS.
```

---

# 52. Ordine consigliato

```text
1. DOC-AUDIT-IDX-001
   → scope/navigation

2. non spostare owner

3. non rinumerare ID

4. mantenere facade leggero

5. registry checker

6. link checker

7. fast

8. git diff --check
```

Nessuna modifica runtime.

---

# 53. Decisione finale

```text
implementazioni/02-audit-documentazione.md:

FACADE:
CORRETTO

MODULARIZZAZIONE:
CORRETTA

QUATTRO MODULI:
CONFERMATI

OWNER DUPLICATI NEL FACADE:
NESSUNO

SPLIT ULTERIORE:
NO

RISCRITTURA COMPLETA:
NO

NUOVO PROBLEMA:

DOC-AUDIT-IDX-001 — HIGH

il facade si presenta come
indice corrente del registro DOC-* / WORKFLOW-*,

ma possiede soltanto
la tranche storica:

DOC-001…023
WORKFLOW-001…003

mentre il progetto contiene
owner successivi:

DOC-024…033
WORKFLOW-004…005

nei registri dell’audit tecnico/post-audit.

CORREZIONE:

→ dichiarare scope B1–B6;
→ mantenere range storici;
→ indicare la continuazione altrove;
→ prefisso != directory owner;
→ Todo = vista sintetica globale;
→ non spostare o duplicare schede.

Nuove task runtime:
0

Nuovi file:
0

Priorità:
MEDIO-ALTA
```

La regola di governance da preservare è:

```text
un ID globale descrive una categoria,

ma l’owner vive
nel modulo della fase/responsabilità
che ha prodotto e mantiene il finding.

Il facade deve navigare questa realtà,
non forzarla in una directory unica.
```

---

# 54. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-046

Documento:
implementazioni/02-audit-documentazione.md

Nuovi Change ID:
DOC-AUDIT-IDX-001

Finding esistenti richiamati:
ROOT-REG-001
ROOT-REG-002
ROOT-REG-003
METHOD-EVIDENCE-001
METHOD-REG-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001
PLAN-AUDIT-001
PLAN-AUDIT-002
PLAN-AUDIT-003
WORKFLOW-002
WORKFLOW-003
WORKFLOW-004
WORKFLOW-005
IMPL-005

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 55. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 46
Da analizzare: 26
Avanzamento: 63,89%

Blocco 043–047:
[✓] 043 implementazioni-tennis-decision-ui.md
[✓] 044 implementazioni/00-metodo-e-stati.md
[✓] 045 implementazioni/01-piano-generale-audit.md
[✓] 046 implementazioni/02-audit-documentazione.md
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

046
→ 1

blocco 043–046
→ 11
```

Contatori provvisori:

```text
task precedenti non duplicate: 181
task continuazione consolidate fino a 042: 128
task nuove 043–046: 11
task complessive note provvisorie: 320
```

Il prossimo documento canonico è:

```text
implementazioni/03-audit-codice.md
```

Dopo il report 047:

```text
→ consolidare mappa
→ consolidare JSON ledger
→ aggiornare blocco 043–047
→ aggiornare contatori ufficiali.
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `DOC-AUDIT-IDX-001`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
