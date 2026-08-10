# Report documentale — `docs/tennis-decision-ui/ai/01-context-selection.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-002
Sequenza audit: 02/72
Documento analizzato: 01-context-selection.md
Percorso documento: docs/tennis-decision-ui/ai/01-context-selection.md
Percorso report: Report documentale/02 - 01-context-selection.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 472 righe
Ruolo dichiarato: selezione del contesto minimo e regole operative per prompt AI
Stato report: completato
```

Il documento è stato confrontato con:

- `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`;
- `docs/tennis-decision-ui/ai/02-documentation-conventions.md`;
- `docs/tennis-decision-ui/reference/01-repository-map.md`;
- `docs/tennis-decision-ui/index.md`;
- `implementazioni/99-decisioni-utente.md`;
- i confini tecnici richiamati dal testo.

I due file mappa non sono stati modificati.

## Esito sintetico

```text
Coerenza generale con il progetto: MEDIO-ALTA
Contraddizioni bloccanti: 0
Contraddizioni operative interne: 1
Sovrapposizioni con un altro owner: 1 estesa
Informazioni obsolete accertate: 0
Correzioni consigliate: 4
Migliorie editoriali facoltative: 0
Necessità di ristrutturazione: SÌ
Necessità di suddivisione: SÌ, per responsabilità
```

Il documento contiene regole valide e coerenti con le decisioni del progetto, ma non dovrebbe restare nella forma attuale.

Il problema principale non è la correttezza generale delle regole: è la presenza nello stesso file di più responsabilità già appartenenti ad altri owner.

---

## 1. Scopo dichiarato

### Esito: corretto, ma non rispettato dalla struttura completa

Lo scopo iniziale è chiaro:

```text
definire il contesto minimo e le regole operative da inserire nei prompt
```

Il documento dichiara inoltre di non sostituire:

- codice;
- test;
- documentazione tecnica owner;
- decisioni dell’utente;
- workflow esecutivo completo.

Questa delimitazione è corretta.

Il contenuto successivo, però, non mantiene completamente il confine dichiarato. Le sezioni dedicate a ruoli, `fileModificati.md`, report, Chat Esecutore, Desktop Esecutore, Desktop Collaudatore e contenuto minimo del report ricostruiscono una parte sostanziale del workflow completo.

### Finding `CTX-001` — scopo dichiarato e contenuto effettivo divergono

**Gravità:** media  
**Tipo:** ownership documentale

Il file dichiara di non sostituire il workflow, ma ne duplica numerosi contratti operativi.

La duplicazione riguarda soprattutto:

```text
Sezione 2  → ruoli
Sezione 5  → requisiti obbligatori del prompt
Sezione 6  → fileModificati.md
Sezione 7  → report
Sezione 8  → CHAT_ESECUTORE
Sezione 9  → DESKTOP_ESECUTORE
Sezione 10 → DESKTOP_COLLAUDATORE
Sezione 11 → contenuto minimo del report
```

Questi argomenti hanno già come owner:

```text
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
```

### Modifica consigliata

Mantenere in `01-context-selection.md` soltanto:

- dati iniziali da verificare;
- gerarchia delle fonti in forma sintetica;
- criteri per scegliere il contesto minimo;
- elementi da escludere;
- navigazione del codice;
- condizioni che richiedono una decisione dell’utente;
- template di contesto con campi condizionali;
- checklist sintetica.

Sostituire le sezioni operative duplicate con un unico rinvio:

```markdown
## Workflow esecutivo

Ruoli, massimo tre tentativi, modalità di consegna, `fileModificati.md`,
report finale, collaudo, commit e push sono definiti nel documento owner:

- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)

Questo documento stabilisce soltanto quale contesto selezionare e quali
informazioni inserire nel prompt. Non replica il ciclo esecutivo completo.
```

---

## 2. Repository, branch e precondizioni iniziali

### Esito: coerente

Il documento indica correttamente:

```text
repository
branch
SHA
obiettivo
modalità
scope
file modificabili
file consultabili
file esclusi
controllo mirato
```

Repository e branch ordinari coincidono con lo stato del progetto:

```text
Pixelpro-agency/tennis-decision-ui-refactor
main
```

La distinzione fra:

```text
file modificabili
file consultabili
file esclusi
```

è corretta e importante.

La regola:

```text
un file consultabile non diventa modificabile
```

è coerente con il workflow e riduce il rischio di ampliamenti opportunistici dello scope.

**Modifiche necessarie:** nessuna.

---

## 3. Ruoli operativi

### Esito: coerente nei contenuti, duplicato nell’ownership

I quattro ruoli:

```text
CHAT_ANALISI
CHAT_ESECUTORE
DESKTOP_ESECUTORE
DESKTOP_COLLAUDATORE
```

coincidono con la decisione strutturale dell’utente e con il workflow owner.

Sono coerenti anche i confini:

- la Chat Analisi delimita e revisiona;
- la Chat Esecutore prepara una consegna applicabile;
- il Desktop Esecutore modifica la copia locale;
- il Desktop Collaudatore verifica senza modificare.

La regola:

```text
non cambiare ruolo durante la stessa esecuzione
```

è corretta.

### Problema

Il dettaglio dei ruoli non dovrebbe essere duplicato qui, perché è già definito in modo più completo in `03-workflow-esecutivo.md`.

### Modifica consigliata

Conservare soltanto una tabella orientativa:

```markdown
## Modalità

| Modalità | Uso |
| --- | --- |
| `CHAT_ANALISI` | Analisi, delimitazione e revisione |
| `CHAT_ESECUTORE` | Consegna deterministica da applicare localmente |
| `DESKTOP_ESECUTORE` | Modifica e controlli sulla copia locale |
| `DESKTOP_COLLAUDATORE` | Collaudo indipendente e read-only |

Per contratti, obblighi e criteri di chiusura applicare
[Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md).
```

---

## 4. Gerarchia delle fonti

### Esito: coerente

La gerarchia:

```text
decisione utente recente
→ stato locale autorizzato e fileModificati.md
→ test sullo stesso stato
→ codice corrente
→ documento owner
→ registri
→ planning e report storici
```

è compatibile con:

- indice canonico;
- workflow esecutivo;
- decisioni dell’utente;
- regola secondo cui i materiali storici non prevalgono sul codice corrente.

La frase:

```text
Quando le fonti divergono, non inventare una sintesi.
```

è corretta.

### Osservazione

Il workflow owner include anche gli output reali insieme allo stato locale. La versione di questo documento è una sintesi accettabile, purché resti esplicitamente sintetica e rinvii all’owner.

### Modifica consigliata

Aggiungere una frase:

```markdown
Questa è una sintesi di orientamento. Per la gerarchia operativa completa
prevale `03-workflow-esecutivo.md`.
```

---

## 5. Selezione minima del contesto

### Esito: pienamente coerente e centrale per il documento

Questa è la responsabilità più chiara e più utile del file.

Il documento richiede di includere soltanto:

1. obiettivo concreto;
2. file modificabili;
3. file consultabili;
4. file esclusi;
5. documento owner;
6. contratto condiviso soltanto se attraversato;
7. test o controllo mirato;
8. decisioni utente pertinenti;
9. procedura per l’artefatto locale, quando applicabile;
10. formato e momento del report, quando applicabile.

Sono corrette anche le esclusioni:

- repository completo;
- Repomix globale;
- history e timeline reali;
- cache;
- dump;
- profili browser;
- `.env`;
- credenziali;
- report storici non pertinenti;
- tutti i documenti canonici.

Queste regole coincidono con la mappa del repository e con i criteri di protezione dei dati runtime e sensibili.

### Modifica necessaria

I punti 9 e 10 non sono universali. Devono essere dichiarati condizionali:

```diff
-9. procedura per `fileModificati.md`;
-10. formato e momento del report finale.
+9. procedura per `fileModificati.md`, soltanto se la modalità può creare
+   o modificare file;
+10. formato e momento del report, soltanto quando previsto dal workflow
+    della modalità scelta.
```

---

## 6. Informazioni obbligatorie del prompt

### Esito: contiene una contraddizione operativa interna

La sezione afferma:

```text
Ogni prompt deve indicare
```

e include fra i campi obbligatori:

```text
metodo unico di consegna
generazione obbligatoria di fileModificati.md
momento del report finale
commit: no
push: no
```

Questa formulazione è troppo ampia.

Non tutti i prompt del progetto sono prompt esecutivi che modificano file:

- `CHAT_ANALISI` può essere read-only;
- `DESKTOP_COLLAUDATORE` deve essere read-only;
- il Collaudatore non crea né aggiorna `fileModificati.md`;
- un’analisi documentale senza modifiche non richiede un metodo di consegna.

### Finding `CTX-002` — obblighi universali incompatibili con i ruoli read-only

**Gravità:** alta  
**Tipo:** contraddizione operativa interna

La sezione 5 e la checklist finale rendono obbligatorio `fileModificati.md` per ogni prompt, mentre la sezione 10 stabilisce correttamente che il Desktop Collaudatore non deve crearlo o aggiornarlo.

Le due regole non possono essere applicate contemporaneamente.

### Modifica consigliata

Sostituire:

```text
Ogni prompt deve indicare:
```

con:

```text
Ogni prompt deve indicare i campi comuni pertinenti alla modalità scelta.

Ogni prompt esecutivo che può creare o modificare file deve inoltre
indicare metodo di consegna, procedura per fileModificati.md,
controlli locali e momento del report finale.
```

Dividere poi i campi in due gruppi.

#### Campi comuni

```text
ID e titolo
modalità
obiettivo unico
repository / root / branch / SHA
file modificabili
file consultabili
file esclusi
documento owner
comportamento richiesto
contratti da preservare
controlli
criterio di successo
criterio di stop
impatto documentale
commit: no
push: no
```

#### Campi condizionali per task che modificano file

```text
massimo tre tentativi
metodo unico di consegna
generazione di fileModificati.md
momento del report finale
rollback
manifest dei file previsti
```

#### Eccezione esplicita

```text
DESKTOP_COLLAUDATORE
→ non crea e non aggiorna fileModificati.md
→ non usa un metodo di consegna di modifiche
→ produce una matrice PASS / FAIL / BLOCCATO
```

---

## 7. `fileModificati.md` e report

### Esito: regole coerenti, ma appartenenti al workflow owner

Le regole descritte sono coerenti:

- `fileModificati.md` contiene tutti e soli i file creati o modificati;
- contiene il contenuto completo;
- non contiene il report;
- non viene committato;
- deve essere rigenerato dopo ulteriori modifiche;
- il report finale è separato;
- la Chat Esecutore non può dichiarare il risultato concluso prima degli output locali.

Non sono state rilevate informazioni obsolete.

### Problema documentale

Il file replica quasi integralmente il contratto già descritto in:

```text
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
```

Questo crea due rischi:

1. aggiornare un documento e dimenticare l’altro;
2. non sapere quale formulazione prevalga quando le due copie divergono.

### Finding `CTX-003` — duplicazione estesa del contratto `fileModificati.md` e report

**Gravità:** media  
**Tipo:** duplicazione di owner

### Modifica consigliata

Rimuovere da questo file:

- comando ordinario Repomix;
- sostituti non accettati;
- sequenza completa della Chat Esecutore;
- contenuto minimo del report;
- ciclo Desktop Esecutore;
- ciclo Desktop Collaudatore.

Conservare soltanto:

```markdown
## Artefatti della modalità scelta

Quando la modalità può creare o modificare file, il prompt deve
richiamare esplicitamente gli artefatti e la sequenza definiti nel
[Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md).

Per modalità read-only non richiedere `fileModificati.md`.
```

---

## 8. Decisioni mancanti

### Esito: coerente e utile

È corretta la distinzione fra decisioni che richiedono intervento dell’utente e informazioni recuperabili tecnicamente.

Chiedere quando cambia:

- comportamento;
- dati;
- persistenza;
- UI;
- risultato;
- scope di rimozione;
- compatibilità.

Non chiedere per:

- informazioni recuperabili;
- metodi tecnici equivalenti;
- controlli necessari;
- nomi temporanei;
- dettagli già decisi.

Questa sezione appartiene effettivamente alla selezione del contesto e dovrebbe restare.

### Miglioria consigliata

Aggiungere anche:

```text
autorità o ownership
```

fra le decisioni che richiedono conferma quando non sono già definite, perché un cambio di owner può modificare più documenti e moduli.

Questa aggiunta è consigliata ma non bloccante.

---

## 9. Confini tecnici permanenti

### Esito: tecnicamente coerente, ma fragile come copia trasversale

Le regole elencate risultano compatibili con il progetto:

- Evidence non viene ricostruita nel frontend;
- non viene dichiarata causalità;
- dump e diagnostica non diventano input algoritmici;
- Source Identity non viene risolta modificando timeline;
- health e persistence restano distinti;
- `selectionId` prevale nei confronti temporali che richiedono identità runner;
- Market Reactions non introduce nuovi blocchi a Start;
- non si terminano processi in base alla sola porta;
- i wrapper root restano facade compatibili.

Non è stata rilevata una regola tecnicamente falsa.

### Finding `CTX-004` — guardrail trasversali senza riferimenti agli owner

**Gravità:** media  
**Tipo:** rischio di obsolescenza documentale

Il titolo “permanenti” è troppo forte. Queste regole provengono da contratti diversi e possono essere aggiornate insieme ai rispettivi owner.

### Modifica consigliata

Rinominare la sezione:

```diff
-## 13. Confini tecnici permanenti
+## Guardrail tecnici da includere quando pertinenti
```

Convertire l’elenco in una mappa verso gli owner:

```markdown
| Guardrail | Fonte da verificare |
| --- | --- |
| Evidence non ricostruita nel frontend | owner Evidence e frontend |
| Nessuna causalità dichiarata | owner Market Reactions |
| Health distinta da persistence | owner runtime health e storage |
| `selectionId` per identità temporale runner | decisioni utente e owner Evidence |
| Nessun kill-by-port | owner runtime locale |
| Wrapper root preservati | mappa del repository e owner Python |

Prima di inserire un guardrail in un prompt, verificarlo sul relativo
owner corrente. Questo elenco orienta la selezione del contesto e non
sostituisce i contratti tecnici.
```

---

## 10. Navigazione del codice

### Esito: coerente e centrale

L’ordine:

1. indice o repository map;
2. documento owner;
3. file target;
4. import indispensabili;
5. consumer diretti se il contratto cambia;
6. test più vicino;
7. fixture o helper locale;

è coerente con la mappa del repository e con la regola di non caricare automaticamente l’intero progetto.

La frase:

```text
Non leggere automaticamente test fratelli o intere directory.
```

è corretta e aiuta a preservare il contesto.

**Modifiche necessarie:** nessuna.

---

## 11. Diagnosi e modularizzazione

### Esito: contenuto valido, responsabilità distinta

La sezione contiene una procedura tecnica autonoma:

- identificazione della responsabilità primaria;
- export pubblici;
- input e output;
- stato;
- side effect;
- dipendenze;
- consumer;
- test;
- confine naturale;
- classificazione del file;
- regole per facade, I/O, stato e dependency injection.

Questa non è più semplice selezione del contesto.

Il workflow owner contiene già criteri generali per decidere una separazione, ma non contiene la classificazione tecnica dettagliata presente qui.

### Modifica strutturale consigliata

Creare un documento autonomo:

```text
docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md
```

Spostarvi:

```text
attuale sezione 15 — Diagnosi e modularizzazione
```

Il nuovo documento dovrebbe essere collegato da:

- `docs/tennis-decision-ui/index.md`;
- `docs/tennis-decision-ui/ai/01-context-selection.md`;
- `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`, nella sezione modularizzazione.

Il file `01-context-selection.md` dovrebbe mantenere soltanto:

```markdown
## Diagnosi di file complessi

Quando la task richiede diagnosi o modularizzazione, aggiungere al
contesto il documento owner:

- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
```

---

## 12. Template minimo

### Esito: utile, ma non correttamente condizionale

Il template è utile come base operativa, ma obbliga sempre:

- metodo unico di consegna;
- `fileModificati.md`;
- sequenza del report;
- commit e push.

È adatto a una task esecutiva che modifica file, non a tutte le modalità.

### Modifica consigliata

Dividere il template in:

```text
A. campi comuni
B. blocco esecutore con modifica file
C. blocco collaudatore read-only
D. blocco analisi read-only
```

#### Blocco comune

```text
ID e titolo:
Modalità:
Obiettivo:
Repository / root / branch / SHA:
File modificabili:
File consultabili:
File esclusi:
Documento owner:
Contratti da preservare:
Controlli:
Criterio di successo:
Criterio di stop:
Impatto documentale:
Commit: no
Push: no
```

#### Blocco aggiuntivo per esecutore con modifiche

```text
Massimo tre tentativi:
Metodo unico di consegna:
Manifest dei file:
fileModificati.md:
Sequenza del report:
Rollback:
```

#### Blocco per collaudatore

```text
Interazioni reali:
Dati da osservare:
Matrice PASS / FAIL / BLOCCATO:
Criterio di perdita critica:
fileModificati.md: non previsto
```

---

## 13. Checklist

### Esito: utile, ma ripete la contraddizione del template

La checklist impone:

```text
fileModificati.md obbligatorio
elenco esatto dei file da includere
report prodotto solo dopo fileModificati.md
```

senza distinguere la modalità.

Questo contraddice il contratto del Desktop Collaudatore presente nello stesso documento.

### Modifica necessaria

Sostituire:

```text
[ ] fileModificati.md obbligatorio.
[ ] Elenco esatto dei file da includere.
[ ] fileModificati.md separato dal report.
[ ] Report prodotto solo dopo fileModificati.md e output reali.
```

con:

```text
[ ] Se la task crea o modifica file, fileModificati.md è obbligatorio.
[ ] Se fileModificati.md è previsto, include tutti e soli i file toccati.
[ ] Se fileModificati.md è previsto, resta separato dal report.
[ ] Per CHAT_ESECUTORE con modifiche, il report finale segue
    fileModificati.md e output reali.
[ ] Per DESKTOP_COLLAUDATORE, fileModificati.md non viene creato.
```

---

## 14. Link e collocazione

### Esito: coerente

I documenti collegati esistono e sono collocati correttamente:

```text
./03-workflow-esecutivo.md
./02-documentation-conventions.md
../reference/01-repository-map.md
```

Il file usa Markdown ordinario, un titolo H1 e un nome conforme alle convenzioni.

**Modifiche necessarie:** nessuna sui link correnti.

Se viene creato il nuovo owner sulla modularizzazione, aggiungere:

```markdown
- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
```

---

## 15. Lunghezza e integrità del contesto

Il documento ha 472 righe e contiene molte sezioni operative estese.

Le convenzioni documentali indicano:

```text
target normale: circa 200–600 parole
oltre circa 700–900 parole: verificare la presenza di più responsabilità
```

Questo file supera ampiamente la soglia di verifica e contiene effettivamente più responsabilità.

### Valutazione

```text
File troppo lungo: SÌ
Rischio di perdita del contesto: ALTO
Duplicazione di contratti: ALTA
Suddivisione consigliata: SÌ
Semplice spezzatura per dimensione: NO
Ristrutturazione per ownership: SÌ
```

### Struttura consigliata

#### Conservare in `01-context-selection.md`

```text
Scopo
precondizioni iniziali
modalità in forma sintetica
gerarchia sintetica
selezione minima del contesto
materiali da escludere
decisioni mancanti
guardrail come riferimenti agli owner
navigazione del codice
template condizionale
checklist condizionale
documenti collegati
```

#### Lasciare esclusivamente a `03-workflow-esecutivo.md`

```text
contratti completi dei ruoli
massimo tre tentativi
fileModificati.md
consegna Chat Esecutore
Desktop Esecutore
Desktop Collaudatore
report finale
revisione
collaudo
Git
criteri di chiusura
```

#### Spostare in un nuovo `04-diagnosi-e-modularizzazione.md`

```text
analisi delle responsabilità
classificazione dei file
confini di estrazione
facade ed entry point
I/O e side effect
stato runtime e policy
dependency injection
consumer e test
```

### Dimensione attesa dopo la ristrutturazione

```text
01-context-selection.md
→ documento sintetico di orientamento

03-workflow-esecutivo.md
→ unico owner del ciclo esecutivo

04-diagnosi-e-modularizzazione.md
→ owner della diagnosi tecnica e dei criteri di separazione
```

La riduzione non deve eliminare le regole: deve rimuovere le copie e assegnare ogni responsabilità al proprio owner.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-002
Percorso report: Report documentale/02 - 01-context-selection.md
Documento: docs/tennis-decision-ui/ai/01-context-selection.md
Change ID: CTX-001
Change ID: CTX-002
Change ID: CTX-003
Change ID: CTX-004
Suddivisione richiesta: sì
Nuovo file proposto: docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md
```

I due file mappa dovranno conservare in futuro soltanto questi riferimenti e una sintesi delle modifiche. Non sono stati aggiornati durante questa analisi.

---

# Modifiche proposte

## `CTX-001` — eliminare la duplicazione del workflow

**Azione:**

- ridurre la descrizione dei ruoli a una tabella;
- eliminare dal file i contratti completi delle sezioni 5–11;
- sostituirli con un rinvio a `03-workflow-esecutivo.md`.

**File coinvolti se applicata:**

```text
docs/tennis-decision-ui/ai/01-context-selection.md
```

---

## `CTX-002` — rendere condizionali `fileModificati.md`, consegna e report

**Azione:**

- distinguere campi comuni e campi per task che modificano file;
- correggere template e checklist;
- dichiarare esplicitamente che il Collaudatore non crea `fileModificati.md`.

**File coinvolti se applicata:**

```text
docs/tennis-decision-ui/ai/01-context-selection.md
```

---

## `CTX-003` — separare diagnosi e modularizzazione

**Azione:**

- creare `docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md`;
- spostare la sezione 15;
- mantenere nel file corrente soltanto il collegamento;
- aggiornare indice e link collegati.

**File coinvolti se applicata:**

```text
docs/tennis-decision-ui/ai/01-context-selection.md
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md
docs/tennis-decision-ui/index.md
```

---

## `CTX-004` — trasformare i confini permanenti in riferimenti agli owner

**Azione:**

- rinominare la sezione;
- collegare ogni guardrail al relativo owner o decisione;
- evitare che il documento AI diventi una seconda copia dei contratti tecnici.

**File coinvolti se applicata:**

```text
docs/tennis-decision-ui/ai/01-context-selection.md
```

---

# Ordine consigliato di applicazione

```text
1. definire la nuova struttura di 01-context-selection.md;
2. creare 04-diagnosi-e-modularizzazione.md;
3. rimuovere le copie del workflow da 01-context-selection.md;
4. rendere condizionali template e checklist;
5. trasformare i guardrail in riferimenti agli owner;
6. aggiornare index.md e i documenti collegati;
7. eseguire link checker e profilo di validazione documentale.
```

Controlli previsti dopo un’eventuale modifica:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
```

---

# Decisione finale

```text
01-context-selection.md: APPROVATO NEI CONTENUTI, DA RISTRUTTURARE
Riscrittura completa: consigliata
Suddivisione: consigliata per responsabilità
Contraddizione operativa da correggere: sì
Informazioni tecniche false: nessuna accertata
Modifica urgente per il runtime: nessuna
Priorità documentale: media
```

Il documento contiene principi validi, ma nella forma corrente concentra selezione del contesto, workflow esecutivo, contratti degli artefatti, guardrail tecnici e diagnosi di modularizzazione.

La correzione più importante è impedire che `fileModificati.md` venga richiesto universalmente anche ai ruoli read-only.

La ristrutturazione deve ridurre il file corrente, lasciare il workflow al suo owner e creare un documento separato per la diagnosi e la modularizzazione.
