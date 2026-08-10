# Report documentale — `docs/tennis-decision-ui/index.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-013
Sequenza audit: 13/72
Documento analizzato: index.md
Percorso documento: docs/tennis-decision-ui/index.md
Percorso report: Report documentale/13 - index.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 23466043ea21f76001c7eea79e81b4ce33988c6f
Dimensione documento: 126 righe
Ruolo dichiarato: indice canonico della documentazione tecnica corrente
Stato report: completato
```

Il documento è stato confrontato con:

- l’inventario canonico dell’audit;
- `README.md`;
- `docs/tennis-decision-ui/ai/02-documentation-conventions.md`;
- `docs/tennis-decision-ui/reference/01-repository-map.md`;
- `docs/tennis-decision-ui/roadmap/01-current-state.md`;
- `docs/validations/README.md`;
- `docs/validations/documentation-migration-finalization-2026-08-03.md`;
- `implementazioni/03-audit-codice.md`;
- `implementazioni/06-implementazioni-proposte.md`;
- la presenza corrente di `docs/archive/README.md`;
- il confronto tra la baseline tecnica dichiarata dal Current State e il commit dell’audit;
- i report documentali 001–012 già prodotti.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Ruolo di indice canonico: CORRETTO
Copertura dei documenti canonici: COMPLETA
Copertura docs/validations: COMPLETA
Link proposti a file non ancora esistenti: nessuno
Separazione current/deprecated/historical: sostanzialmente corretta
Gerarchia delle fonti: da correggere
Policy archive cross-document: incoerente
Formule di stato ad alto rischio di drift: presenti
Migrazione MDX: correttamente dichiarata completata
Modifiche proposte: 6
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti proposti: nessuno
```

L’indice è strutturalmente valido.

Non richiede:

- una nuova gerarchia di cartelle;
- un secondo indice;
- una divisione per aree;
- l’aggiunta anticipata dei documenti proposti dagli audit;
- una riscrittura estesa.

La correzione più importante è semantica.

L’indice deve distinguere chiaramente:

```text
fatto sullo stato corrente
da
decisione/target approvato
```

Una decisione utente può essere vincolante sul comportamento desiderato, ma non può trasformare da sola una capacità non implementata in una capacità corrente.

---

# 1. Copertura della documentazione canonica

## Esito: completa

L’inventario corrente contiene:

```text
docs/tennis-decision-ui/
→ 37 file Markdown
```

incluso:

```text
docs/tennis-decision-ui/index.md
```

L’indice contiene collegamenti verso tutti gli altri **36** documenti canonici del namespace.

Sono coperti:

```text
ai/
→ 3/3

api/
→ 6/6

architecture/
→ 2/2

modules/betfair/
→ 2/2

modules/evidence/
→ 4/4

modules/frontend/
→ 4/4

modules/python/
→ 4/4

modules/sofa/
→ 2/2

modules/storage/
→ 2/2

operations/
→ 5/5

reference/
→ 1/1

roadmap/
→ 1/1
```

Non risulta un owner canonico `.md` del namespace `docs/tennis-decision-ui/` completamente assente dalla navigazione.

Questa è una proprietà positiva da preservare.

---

# 2. Copertura delle validazioni storiche

## Esito: completa

L’inventario contiene quattro file sotto:

```text
docs/validations/
```

ovvero:

```text
README.md
source-identity-live-verification.md
betfair-live-validation-2026-07-04.md
documentation-migration-finalization-2026-08-03.md
```

L’indice collega tutti e quattro.

La classificazione:

```text
Validazioni storiche
```

è coerente con `docs/validations/README.md`.

È inoltre corretta la regola:

```text
una validazione storica
≠
PASS corrente
```

Non sono necessarie modifiche strutturali a questa sezione.

---

# 3. Migrazione MDX

## Esito: coerente

L’indice dichiara:

```text
migrazione da MDX a Markdown completata
tutti gli owner canonici usano .md
```

Il record di finalizzazione documentale registra:

```text
File MDX residui: 0
export const meta residui: 0 negli owner canonici
```

La ricerca corrente nel repository non ha inoltre restituito file `.mdx`.

Questa affermazione può restare.

## Miglioria editoriale separata

La sezione:

```text
Fondazione e architettura migrate
```

mantiene però nel titolo una fase di migrazione ormai conclusa.

Questo viene trattato in `INDEX-005`.

---

# 4. Gerarchia delle fonti

## Esito: semanticamente ambigua

L’indice usa:

```text
1. decisione esplicita più recente dell'utente
2. stato locale autorizzato e test eseguiti sullo stesso stato
3. codice sul branch canonico
4. documento owner
5. registri
6. storico
```

e subito dopo precisa:

```text
Un documento non rende implementata una funzione che il codice non contiene.
```

La seconda regola è corretta.

Il problema è che il primo elenco mescola due domande diverse:

```text
che cosa esiste oggi?
e
che cosa deve diventare il sistema?
```

## Esempio

Una decisione utente può approvare:

```text
trackingSessionId end-to-end
```

ma finché il codice non lo implementa, lo stato corrente resta:

```text
trackingSessionId assente
```

Lo stesso vale per:

```text
IMPL-016
IMPL-017
IMPL-018
```

e per qualunque altra implementazione approvata ma ancora assente.

`02-documentation-conventions.md` stabilisce infatti:

```text
non usare Implementato
per una decisione o proposta non presente nel codice
```

e:

```text
quando una capacità manca
→ descrivere il limite corrente
→ non presentare la soluzione approvata come già disponibile
```

## Finding `INDEX-001` — separare verità corrente e target approvato

**Priorità:** alta  
**Tipo:** gerarchia delle fonti

### Modifica richiesta

Sostituire la gerarchia unica con due regole.

### Per i fatti sullo stato corrente

```text
1. stato locale autorizzato + test sullo stesso stato, quando disponibili
2. codice sul branch/checkpoint oggetto della task
3. documento owner corrente
4. registri
5. validazioni e storico
```

### Per target, vincoli e decisioni

```text
1. decisione utente esplicita più recente
2. implementazione/proposta approvata
3. documenti e decisioni precedenti compatibili
```

Aggiungere:

```text
Una decisione approvata modifica il target, non il fatto corrente,
finché codice e test non implementano il cambiamento.
```

Questo evita che una decisione futura venga interpretata come implementazione.

---

# 5. Policy `docs/archive/`

## Esito: incoerenza canonica

L’indice dichiara:

```text
docs/archive/
→ conserva materiali storici, planning, brief o fonti future non canoniche
→ non viene eliminato automaticamente
```

`README.md` usa una formulazione analoga.

Il documento canonico delle convenzioni, sullo stesso commit, afferma invece:

```text
docs/archive/ non è un deposito permanente
```

e:

```text
un file deve essere eliminato
quando il contenuto unico è stato trasferito
e il controllo finale è positivo
```

Quindi esistono due policy incompatibili nella documentazione canonica.

## Stato fisico del repository

Al commit auditato:

```text
docs/archive/README.md
→ Not Found
```

e l’inventario Markdown registra:

```text
docs/archive
→ 0 file .md
```

Il record storico della migrazione documentale conferma inoltre che i materiali archive precedenti furono consolidati e rimossi.

L’indice usa quindi il presente:

```text
docs/archive/ conserva ...
```

senza distinguere:

```text
policy per materiali eventualmente conservati
da
contenuto realmente presente nel commit
```

## Finding `INDEX-002` — riallineare policy e stato di `docs/archive/`

**Priorità:** alta  
**Tipo:** coerenza documentale

### Modifica richiesta

Coordinare con:

```text
DOC-CONV-001
DOC-CONV-003
```

La policy scelta nell’audit corrente è di preservare il materiale non canonico quando esplicitamente dichiarato utile.

L’indice può quindi usare una forma non falsa rispetto a un archive vuoto:

```markdown
`docs/archive/` è la radice non canonica destinata agli eventuali
materiali storici, planning, brief o fonti future che l'utente decide
esplicitamente di conservare.

La directory può essere vuota o assente dal checkpoint Git.
Il suo contenuto, quando presente, non è owner tecnico e non viene
eliminato da cleanup generici o automatici.
```

### Non fare

Non creare:

```text
docs/archive/README.md
```

soltanto per rendere vera una frase dell’indice.

Crearlo esclusivamente se serve davvero un registro di materiali archive presenti.

---

# 6. Stato dei documenti e note sui “gap”

## Esito: classificazione utile ma non uniforme

L’indice usa alcune note ad hoc:

```text
tracking e storage
→ hanno limiti già registrati

primi tre documenti frontend
→ hanno gap registrati
```

mentre altri owner già auditati con gap rilevanti vengono semplicemente elencati, per esempio:

```text
API Match
API Betfair
API Evidence
Preflight
Runtime Health
```

Questo non rende l’indice errato, ma produce una seconda fonte di stato destinata a diventare rapidamente obsoleta.

## Problema di manutenzione

Dopo l’applicazione di una task:

```text
un gap può sparire
```

ma la frase dell’indice resterebbe finché qualcuno la ricorda manualmente.

All’opposto, un nuovo finding può comparire senza essere riflesso nell’indice.

L’indice dovrebbe essere:

```text
mappa di navigazione
```

non:

```text
registro distribuito dei finding
```

## Finding `INDEX-003` — rimuovere lo stato dei finding ad hoc dall’indice

**Priorità:** media  
**Tipo:** ownership documentale

### Modifica richiesta

Sostituire le note specifiche del tipo:

```text
questi tre documenti hanno gap
questi documenti hanno limiti
```

con una regola unica, per esempio:

```markdown
L’inclusione nell’indice identifica il documento owner corrente.
Non certifica che il documento sia privo di finding aperti.

Per limiti correnti usare `roadmap/01-current-state.md`;
per finding, decisioni e implementazioni approvate usare i registri.
```

Mantenere invece gli stati strutturali stabili:

```text
corrente
deprecato
storico
non canonico
```

### API correnti

La sezione:

```text
API correnti
```

può restare.

Deve significare:

```text
documenti owner correnti delle route family
```

non:

```text
ogni endpoint descritto è raccomandato o non deprecato
```

Per esempio Match e Betfair possono ancora descrivere singoli endpoint legacy finché il codice li espone.

---

# 7. `Stato corrente del progetto`

## Esito: link valido, baseline da non nascondere

L’indice collega:

```text
roadmap/01-current-state.md
```

come:

```text
Stato corrente del progetto
```

Il documento collegato dichiara però esplicitamente:

```text
Baseline tecnica:
f86ac267919ca13859c98db7015362f26176ba36
```

Il commit oggetto dell’audit è:

```text
4c5f43b007149f3210c27d7565357a447a3a6ef4
```

e il confronto mostra:

```text
4c5f43b...
→ 17 commit avanti rispetto a f86ac267...
```

Il confronto non mostra modifiche applicative a:

```text
backend/
frontend/
launcher/
scrapers/
```

fra i due checkpoint, ma mostra modifiche a documentazione e tooling.

Quindi non è corretto concludere automaticamente che il Current State sia falso.

È però importante non usare il titolo del link come prova che la sua baseline coincida sempre con il checkpoint corrente.

## Finding `INDEX-004` — rendere esplicita la natura “snapshot con baseline”

**Priorità:** media  
**Tipo:** navigazione temporale

### Modifica richiesta

Usare una label stabile, per esempio:

```text
Stato corrente / snapshot con baseline dichiarata
```

oppure aggiungere una nota globale:

```markdown
I documenti di stato e le validazioni devono essere interpretati sulla
baseline dichiarata al loro interno; il titolo del link non sostituisce
il confronto con il checkpoint corrente.
```

Il controllo approfondito del contenuto di:

```text
roadmap/01-current-state.md
```

resta demandato al suo audit dedicato.

---

# 8. Formulazione “migrate”

## Esito: residuo editoriale della migrazione conclusa

L’indice dice contemporaneamente:

```text
La migrazione da MDX a Markdown è completata.
```

e usa l’intestazione:

```text
Fondazione e architettura migrate
```

La parola:

```text
migrate
```

non aggiunge più informazione operativa alla navigazione corrente.

## Finding `INDEX-005` — rimuovere il framing di migrazione dall’heading corrente

**Priorità:** low  
**Tipo:** editoriale

### Modifica richiesta

Rinominare, per esempio:

```text
## Fondazione, architettura e processo documentale
```

oppure:

```text
## Fondazione e architettura
```

La storia della migrazione resta correttamente nel report:

```text
docs/validations/documentation-migration-finalization-2026-08-03.md
```

Non serve conservarla nel nome di una sezione permanente dell’indice.

---

# 9. Manutenzione dell’indice

## Esito: regola implicita ma non esplicita

Le convenzioni dichiarano che una modifica deve aggiornare la documentazione quando cambia un:

```text
percorso canonico
```

e richiedono il link checker.

L’indice non esplicita però il proprio trigger di aggiornamento.

Questo diventa importante perché gli audit già completati propongono:

```text
nuovi owner API Match
nuovi owner API Betfair
nuovi owner API Evidence
nuovi owner AI
rimozione Strategy
```

Questi file **non devono essere inseriti ora**, perché non esistono ancora.

Quando verranno realmente creati o rimossi, l’indice dovrà cambiare nella stessa task.

## Finding `INDEX-006` — definire il contratto di manutenzione dell’indice

**Priorità:** media  
**Tipo:** manutenzione documentale

### Modifica richiesta

Aggiungere in fondo:

```markdown
## Manutenzione dell’indice

Aggiornare questo file nella stessa task quando un documento canonico:

- viene creato;
- viene rinominato o spostato;
- cambia owner;
- diventa deprecato;
- viene rimosso;
- viene sostituito da una facade e nuovi owner.

Non aggiungere link a file soltanto proposti.

Dopo ogni modifica eseguire:

python scripts/check_documentation_links.py --forbid-mdx-links
```

### Relazione con le modularizzazioni già proposte

Non aggiungere oggi:

```text
api/match/*
api/betfair/*
api/evidence/*
ai/04-*
ai/05-*
```

finché le rispettive task non creano realmente quei documenti.

Questo mantiene l’indice coerente con il principio:

```text
future specification
≠
canonical owner
```

---

# 10. Link e navigazione

## Esito: nessun finding strutturale

Il confronto dell’indice con l’inventario corrente mostra una copertura completa dei documenti canonici.

I principali entry point esterni sono inoltre presenti:

```text
scripts/validation/README.md
docs/validations/README.md
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
implementazioni/03-audit-codice.md
implementazioni/06-implementazioni-proposte.md
implementazioni/99-decisioni-utente.md
```

`03-audit-codice.md` e `06-implementazioni-proposte.md` sono correttamente facades/indici delle rispettive strutture modulari.

Quindi l’indice non deve collegare direttamente ogni sottofile di:

```text
implementazioni/audit-codice/
implementazioni/implementazioni-proposte/
```

La navigazione a due livelli è appropriata.

---

# 11. Strategia deprecata

## Esito: corretto

L’indice separa:

```text
API correnti
```

da:

```text
API Strategy
→ codice ancora presente
→ deprecato
→ non estendere
```

Questa classificazione è coerente con lo stato corrente e con il report:

```text
TDUI-DOC-REPORT-008
```

Non aggiungere una struttura futura per Strategy.

Dopo l’applicazione verificata di:

```text
CODE-001
STRATEGY-API-008
```

la voce Strategy dovrà essere eliminata dall’indice nella stessa task.

Questo requisito è coperto da `INDEX-006`.

---

# 12. Audit e registri

## Esito: corretto

L’indice punta ai registri sintetici principali.

`implementazioni/03-audit-codice.md` è effettivamente una facade che rimanda ai sette moduli dell’audit.

`implementazioni/06-implementazioni-proposte.md` è effettivamente una facade che rimanda ai moduli `IMPL-*`.

La scelta evita che l’indice canonico debba duplicare tutta la struttura dei registri.

Non sono proposte modifiche.

---

# 13. Materiale non canonico e specifiche future

## Esito: principio corretto

È corretto che:

```text
specifica futura
→ non entra nella documentazione tecnica corrente
```

e che:

```text
requisiti futuri
→ registri
```

finché il codice non viene implementato.

Questa regola è coerente con le convenzioni.

L’unica correzione necessaria riguarda:

```text
policy archive
```

trattata in `INDEX-002`.

---

# 14. Lunghezza e integrità del contesto

## Valutazione

```text
Righe: 126
Responsabilità primaria: 1
Funzione: navigazione canonica
Aree elencate: molte
Owner aggiuntivi interni al file: nessuno
Contesti indipendenti da separare: no
Rischio di frammentazione: alto se diviso
Suddivisione richiesta: no
```

La varietà delle sezioni non costituisce una pluralità di responsabilità.

Un indice deve necessariamente attraversare:

- architettura;
- API;
- moduli;
- operations;
- validazioni;
- registri.

Dividerlo in più indici canonici aumenterebbe il rischio di drift e renderebbe ambiguo il punto di ingresso.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-013
Percorso report: Report documentale/13 - index.md
Documento: docs/tennis-decision-ui/index.md
Change ID: INDEX-001
Change ID: INDEX-002
Change ID: INDEX-003
Change ID: INDEX-004
Change ID: INDEX-005
Change ID: INDEX-006
Suddivisione richiesta: no
Nuovi file proposti: nessuno
```

Nel prossimo aggiornamento:

```text
mappa-file-markdown-repository.md
→ registrare report 013
→ indice 13 ANALIZZATO
→ Divisione non necessaria
→ 6 nuove task
→ prossimo indice 14

modifiche-audit-markdown.json
→ aggiungere soltanto report 013
→ aggiungere soltanto INDEX-001..006
→ preservare report 008..012 già presenti
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `INDEX-001` — gerarchia current vs target

**Priorità:** high

**Azione:**

- separare fatti correnti e target approvati;
- impedire che una decisione non implementata sovrascriva lo stato reale;
- mantenere decisioni utente come authority del target;
- mantenere codice/test come authority della presenza corrente.

---

## `INDEX-002` — policy archive

**Priorità:** high

**Azione:**

- coordinare con `DOC-CONV-001` e `DOC-CONV-003`;
- mantenere la policy di preservazione esplicita;
- non affermare che l’archive contiene file quando il checkpoint è vuoto;
- non ricreare un README archive senza necessità reale;
- allineare README, indice e convenzioni.

---

## `INDEX-003` — stato dei finding nell’indice

**Priorità:** medium

**Azione:**

- rimuovere note ad hoc sui gap di singoli gruppi;
- dichiarare una volta che presenza nell’indice significa owner corrente, non assenza di finding;
- usare roadmap e registri per limiti/finding;
- mantenere soltanto stati strutturali stabili.

---

## `INDEX-004` — snapshot Current State

**Priorità:** medium

**Azione:**

- rendere esplicito che `roadmap/01-current-state.md` va interpretato sulla baseline dichiarata;
- non usare il titolo del link come certificazione automatica del checkpoint corrente;
- lasciare il controllo dettagliato al successivo audit del documento roadmap.

---

## `INDEX-005` — heading migration-era

**Priorità:** low

**Azione:**

- rinominare `Fondazione e architettura migrate`;
- mantenere la storia della migrazione soltanto nella validation storica;
- non cambiare la struttura dei link.

---

## `INDEX-006` — manutenzione dell’indice

**Priorità:** medium

**Azione:**

- definire i trigger di aggiornamento dell’indice;
- aggiornare nella stessa task create/rename/move/deprecate/remove/split;
- non linkare file soltanto proposti;
- eseguire link checker dopo ogni modifica strutturale.

---

# Ordine consigliato di applicazione

```text
1. riallineare la policy archive con DOC-CONV-001 / DOC-CONV-003;
2. correggere la gerarchia current vs target;
3. sostituire le note ad hoc sui gap con una regola stabile;
4. chiarire la baseline del Current State;
5. rinominare l’heading migration-era;
6. aggiungere la regola di manutenzione dell’indice;
7. eseguire link checker;
8. rieseguire registry checker;
9. aggiornare mappa Markdown e JSON incrementale.
```

Le modifiche sono prevalentemente documentali.

Non richiedono cambi applicativi.

---

# Verifica prevista dopo la modifica

## Link

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
```

Atteso:

```text
0 errori
0 warning
```

Non riportare come risultato corrente finché il comando non viene realmente eseguito sulla working tree modificata.

## Registry

```bash
python scripts/check_registry_consistency.py
```

Atteso:

```text
0 errori
0 warning
```

## Ricerca MDX

Verificare:

```text
nessun owner canonico .mdx
nessun link canonico .mdx
```

## Copertura indice

Dopo ogni modifica strutturale:

```text
inventario docs/tennis-decision-ui
-
index.md
=
tutti i documenti raggiungibili dall’indice
```

Per il checkpoint auditato il confronto statico è:

```text
37 file canonici
- 1 index.md
= 36 documenti collegati
```

## Archive

Se `docs/archive/` è vuoto o assente:

```text
indice
→ descrive la policy
→ non inventa contenuti presenti
```

Se contiene materiale:

```text
materiale esplicitamente preservato
→ non owner
→ non current implementation
→ non rimosso da cleanup generici
```

## Diff

```bash
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
docs/tennis-decision-ui/index.md: INDICE CANONICO SOLIDO, REVISIONE MIRATA
Copertura owner canonici: completa
Copertura validations: completa
Link a file futuri inesistenti: nessuno
Migrazione Markdown: coerente
Gerarchia delle fonti: da separare current/target
Archive policy: incoerente con le convenzioni e non aderente allo stato fisico
Note sui gap: troppo ad hoc
Current State: baseline da rendere più evidente
Heading “migrate”: da normalizzare
Maintenance rule: da aggiungere
Riscrittura completa: no
Modularizzazione: no
Nuovi documenti: nessuno
Priorità: media
```

L’indice deve restare un singolo documento.

La proprietà più importante da preservare è:

```text
un solo punto di ingresso
→ tutti gli owner correnti raggiungibili
→ nessuna specifica futura promossa prematuramente
```

La correzione principale è fare in modo che la gerarchia documentale non confonda mai:

```text
“è stato deciso”
con
“è stato implementato”.
```
