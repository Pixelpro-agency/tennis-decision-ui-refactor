# Workflow esecutivo e criteri di chiusura

## Scopo

Questo documento definisce il flusso operativo permanente delle task esecutive di Tennis Decision UI.

Principi:

- una task per volta;
- scope minimo verificabile;
- nessun refactor opportunistico;
- ruoli separati;
- massimo tre tentativi ragionati;
- `fileModificati.md` obbligatorio per ogni task che crea o modifica file;
- report dell’Esecutore separato da `fileModificati.md`;
- revisione della Chat Analisi prima del commit;
- commit e push eseguiti soltanto dall’utente.

## 1. Ruoli

### 1.1 Utente

L’utente:

- decide requisiti e priorità;
- applica le consegne della Chat Esecutore sulla copia locale;
- esegue i controlli locali richiesti;
- genera o fa generare `fileModificati.md`;
- restituisce alla Chat Esecutore `fileModificati.md` e gli output reali dei controlli;
- porta alla Chat Analisi `fileModificati.md` e il report finale separato dell’Esecutore;
- esegue materialmente commit e push su `main` soltanto dopo approvazione.

### 1.2 Chat Analisi / Amministratore

Modalità:

```txt
CHAT_ANALISI
```

La Chat Analisi:

- legge GitHub in sola lettura;
- confronta decisioni, codice, documenti, test e artefatti della task;
- delimita una sola task;
- sceglie la modalità esecutiva;
- prepara il prompt;
- revisiona integralmente `fileModificati.md`;
- legge il report finale separato dell’Esecutore;
- decide se serve un collaudo;
- approva o respinge il risultato;
- fornisce i comandi Git soltanto dopo approvazione.

Non modifica autonomamente GitHub e non approva senza avere letto integralmente `fileModificati.md`.

### 1.3 Chat Esecutore

Modalità:

```txt
CHAT_ESECUTORE
```

Usarla quando il lavoro viene svolto tramite una chat dal browser che può leggere GitHub ma non può modificare direttamente la copia locale dell’utente.

La Chat Esecutore:

- legge la repository condivisa in sola lettura;
- verifica repository, branch e SHA remoto;
- non modifica la copia locale;
- non dichiara eseguiti test locali che non ha eseguito;
- prepara una consegna deterministica applicabile dall’utente;
- dopo l’applicazione riceve `fileModificati.md` e gli output reali;
- soltanto allora produce il report finale separato.

Formati di consegna consentiti:

```txt
A. file completi sostitutivi
B. archivio ZIP con struttura e manifest
C. script patch Python deterministico
D. comandi mirati che modificano file
E. patch testuale soltanto quando piccola e revisionabile
```

La Chat Esecutore deve scegliere un solo metodo di consegna, salvo necessità tecnica esplicita.

### 1.4 Desktop Esecutore

Modalità:

```txt
DESKTOP_ESECUTORE
```

Il Desktop Esecutore:

- lavora direttamente sulla copia locale;
- verifica branch, SHA e working tree;
- modifica soltanto i file autorizzati;
- esegue i controlli richiesti;
- crea o sovrascrive `fileModificati.md`;
- restituisce `fileModificati.md`;
- restituisce separatamente il report finale;
- non esegue commit o push;
- non approva il proprio lavoro;
- non esegue un collaudo browser indipendente nello stesso prompt.

### 1.5 Desktop Collaudatore

Modalità:

```txt
DESKTOP_COLLAUDATORE
```

Il Desktop Collaudatore:

- usa la stessa copia locale già modificata;
- non modifica codice o documentazione;
- usa interazioni reali;
- controlla UI, dati, console, reload e persistenza;
- produce finding numerati;
- produce una matrice `PASS / FAIL / BLOCCATO`;
- non crea o modifica `fileModificati.md`;
- non esegue commit o push.

## 2. Scelta della modalità

```txt
modifica locale complessa o diagnosi runtime
→ DESKTOP_ESECUTORE

consegna deterministica tramite browser
→ CHAT_ESECUTORE

collaudo browser indipendente
→ DESKTOP_COLLAUDATORE

analisi, delimitazione o revisione
→ CHAT_ANALISI
```

Una task usa una sola modalità esecutiva.

Un fix successivo a un collaudo fallito richiede una nuova esecuzione autorizzata. Non trasformare il Collaudatore in Esecutore.

## 3. Gerarchia delle fonti

1. decisione esplicita più recente dell’utente;
2. stato locale autorizzato rappresentato da SHA base, `fileModificati.md` e output reali;
3. test eseguiti sullo stesso stato;
4. codice sul branch canonico;
5. documentazione owner;
6. registri `implementazioni/`;
7. planning e report storici;
8. conversazioni, ZIP e materiali precedenti.

Un documento storico non prevale sul codice corrente.

## 4. Requisiti obbligatori del prompt

Ogni prompt esecutivo deve indicare:

- ID e titolo;
- modalità;
- obiettivo unico;
- repository, root, branch e SHA;
- file modificabili;
- file consultabili;
- file esclusi;
- comportamento richiesto;
- contratti da preservare;
- controlli;
- massimo tre tentativi;
- criterio di successo;
- criterio di stop;
- impatto documentale;
- metodo unico di consegna;
- procedura obbligatoria per creare `fileModificati.md`;
- momento esatto in cui è consentito produrre il report finale.

Per `CHAT_ESECUTORE`, il prompt deve distinguere esplicitamente:

```txt
fase 1
→ consegna iniziale

fase 2
→ applicazione locale, controlli e fileModificati.md

fase 3
→ report finale separato
```

## 5. Massimo tre tentativi

Ogni tentativo:

1. parte dall’errore reale;
2. formula una causa plausibile;
3. applica la correzione minima nello scope;
4. ripete il controllo pertinente.

Dopo il terzo fallimento:

- fermarsi;
- non ampliare lo scope;
- produrre `fileModificati.md` sullo stato finale raggiunto, se sono stati modificati file;
- riportare nel report errore, comando, exit code, file coinvolti e blocco;
- non dichiarare la task completata.

## 6. `fileModificati.md`

### 6.1 Funzione

`fileModificati.md` è l’artefatto tecnico che permette alla Chat Analisi di leggere il contenuto reale dei file presenti nella copia locale dopo l’esecuzione.

Non è il report della task.

### 6.2 Contenuto

Deve contenere tutti e soli i file effettivamente creati o modificati dalla task.

Deve includere il contenuto completo di ciascun file.

Non deve contenere:

- il report dell’Esecutore;
- spiegazioni narrative;
- risultati dei test;
- comandi o exit code;
- warning;
- file preesistenti non toccati;
- dati runtime;
- cache;
- dump;
- credenziali.

I file eliminati vengono dichiarati nel report finale e negli output locali; non devono essere ricostruiti artificialmente dentro `fileModificati.md`.

### 6.3 Generazione

Dalla root della repository:

```powershell
$repomixInclude = 'percorso/file1,percorso/file2'
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"
```

`$repomixInclude` deve contenere esclusivamente i file realmente creati o modificati dalla task.

Se un tentativo successivo modifica ancora uno dei file, `fileModificati.md` deve essere rigenerato.

`fileModificati.md` non viene committato.

### 6.4 Obbligo

Per ogni task che crea o modifica file:

```txt
assenza di fileModificati.md
→ task non pronta per revisione
```

Un elenco di percorsi, un manifest, un riepilogo o contenuti ricostruiti dal repository remoto non sostituiscono `fileModificati.md`.

## 7. CHAT_ESECUTORE — ciclo completo

### 7.1 Fase 1 — Consegna iniziale

La prima risposta della Chat Esecutore è una consegna pronta per applicazione locale.

Deve contenere:

```txt
DELIVERY-MANIFEST
→ SHA base
→ file creati/modificati/eliminati previsti
→ metodo unico di applicazione
→ controlli locali
→ risultato atteso
→ rollback
→ limiti
→ procedura esatta per generare fileModificati.md
```

La consegna iniziale non è il report finale.

In questa fase la Chat Esecutore non deve:

- dichiarare la task completata;
- dichiarare superati i controlli locali;
- dichiarare il risultato pronto per revisione;
- produrre un `fileModificati.md` come se provenisse dalla copia locale;
- produrre il report finale.

Quando la consegna usa uno script locale, lo script può creare o sovrascrivere `fileModificati.md` dopo avere applicato la versione finale dei file. Se avvengono correzioni successive, l’artefatto deve essere rigenerato.

### 7.2 Fase 2 — Applicazione locale

L’utente:

1. applica la consegna;
2. esegue i controlli richiesti;
3. completa al massimo tre tentativi;
4. genera o rigenera `fileModificati.md` sullo stato finale;
5. restituisce alla Chat Esecutore:
   - `fileModificati.md`;
   - output completi dei controlli;
   - exit code;
   - eventuali errori;
   - stato locale richiesto dal prompt.

### 7.3 Fase 3 — Report finale

Soltanto dopo avere ricevuto `fileModificati.md` e gli output reali, la Chat Esecutore:

1. legge integralmente `fileModificati.md`;
2. verifica che contenga tutti e soli i file autorizzati;
3. confronta il contenuto con la consegna;
4. usa esclusivamente comandi, output ed exit code realmente forniti;
5. produce il report finale separato.

Se `fileModificati.md` manca, è incompleto o contiene file fuori scope, la Chat Esecutore non produce un report di successo. Riporta invece il blocco.

## 8. Report finale dell’Esecutore

Il report finale è una risposta separata da `fileModificati.md`.

Deve contenere almeno:

- ID e modalità;
- SHA base;
- stato iniziale disponibile;
- file letti;
- file creati;
- file modificati;
- file eliminati;
- riepilogo delle modifiche;
- comandi eseguiti ed exit code reali;
- test e risultati reali;
- numero e contenuto dei tentativi;
- warning e limiti;
- working tree o stato locale riportato;
- impatto documentale;
- commit: no;
- push: no;
- stato per revisione.

Non deve:

- sostituire `fileModificati.md`;
- dichiarare PASS per controlli non eseguiti;
- inventare output;
- dichiarare pulita una working tree non verificata;
- approvare il proprio lavoro.

## 9. Revisione della Chat Analisi

La Chat Analisi deve ricevere entrambi:

```txt
fileModificati.md
+
report finale separato dell’Esecutore
```

La revisione:

- legge integralmente `fileModificati.md`;
- verifica scope e contratti;
- confronta il report con gli output reali;
- controlla test, warning e limiti;
- decide se il risultato è approvato, da correggere o bloccato;
- decide se è necessario un collaudo separato.

La Chat Analisi non approva sulla sola base del report.

## 10. Collaudi

Il collaudo separato è normalmente richiesto quando cambiano:

- UX;
- polling;
- lifecycle di sessione;
- persistenza;
- route;
- dati osservabili;
- browser o CDP;
- comportamento runtime.

I report di collaudo vengono conservati separatamente in `docs/validations/`, non nei documenti owner.

## 11. Git e GitHub

Chat e Desktop non eseguono commit o push.

Flusso finale:

```txt
revisione positiva
→ eventuale collaudo positivo
→ rimozione di fileModificati.md
→ git diff --check
→ staging dei soli file approvati
→ commit eseguito dall’utente
→ push main eseguito dall’utente
→ verifica remota dello SHA
```

`git diff --check` è soltanto un controllo tecnico su whitespace ed errori di patch. Non è un artefatto di revisione e non sostituisce `fileModificati.md`.

Branch separati e pull request sono eccezioni approvate esplicitamente.

## 12. Criteri `PRONTO PER TASK`

Una voce diventa task soltanto quando sono definiti:

- problema dimostrato;
- decisioni risolte;
- scope;
- file;
- test;
- rischi;
- criteri;
- collaudo;
- impatto documentale;
- modalità esecutiva;
- generazione di `fileModificati.md`;
- sequenza del report finale.

## 13. Criteri di chiusura

Una task è chiusa quando:

- scope rispettato;
- controlli positivi o limiti esplicitamente accettati;
- `fileModificati.md` revisionato integralmente;
- report finale coerente con gli output reali;
- finding bloccanti assenti;
- documentazione aggiornata quando richiesta;
- eventuale collaudo concluso;
- commit e push effettuati dall’utente;
- nuovo SHA remoto verificato.

## 14. Impatto documentale

Il report finale di ogni task deve dichiarare:

```txt
modifiche funzionali
contratti coinvolti
documenti owner da aggiornare
documenti invariati
link da verificare
nuovi documenti eventualmente necessari
informazioni mancanti o limiti
```

Queste informazioni appartengono al report finale, non a `fileModificati.md`.

## 15. Modularizzazione

Non dividere un file soltanto perché è lungo.

Una separazione è giustificata quando cambia almeno uno fra:

- responsabilità;
- contratto;
- stato;
- side effect;
- dipendenza;
- owner;
- tipo di test;
- contesto minimo necessario.

Preservare facade ed entry point pubblici fino alla migrazione completa e ai test positivi.

## Documenti collegati

- [Selezione del contesto per AI](./01-context-selection.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Mappa del repository](../reference/01-repository-map.md)
