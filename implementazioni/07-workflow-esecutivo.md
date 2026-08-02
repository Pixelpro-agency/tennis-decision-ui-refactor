# Tennis Decision UI — Workflow esecutivo e criteri di chiusura

## Scopo

Questo documento definisce il flusso operativo permanente del progetto.

Principi:

- una task per volta;
- scope minimo verificabile;
- nessun refactor opportunistico;
- ruoli separati;
- massimo tre tentativi;
- revisione prima del commit;
- commit e push eseguiti soltanto dall’utente.

## 1. Ruoli

### 1.1 Utente

L’utente:

- decide requisiti e priorità;
- applica le consegne della Chat Esecutore;
- prepara la copia locale;
- allega diff, report o `fileModificati.md`;
- esegue materialmente commit e push su `main`.

### 1.2 Chat Analisi / Amministratore

La Chat Analisi:

- legge GitHub in sola lettura;
- confronta codice, documenti, test e decisioni;
- chiede all’utente le decisioni che cambiano comportamento;
- delimita una task;
- sceglie la modalità esecutiva;
- prepara prompt o consegna;
- revisiona integralmente il risultato;
- decide se serve collaudo;
- fornisce i comandi Git soltanto dopo approvazione.

Non modifica autonomamente GitHub e non approva senza leggere il risultato.

### 1.3 Chat Esecutore

Modalità:

```txt
CHAT_ESECUTORE
```

Usarla quando ChatGPT Desktop non è disponibile o quando la modifica può essere consegnata in modo deterministico.

La Chat Esecutore:

- legge la repository condivisa in sola lettura;
- verifica branch e SHA remoto;
- non modifica la copia locale;
- non esegue test locali dichiarandoli come eseguiti;
- prepara una consegna applicabile dall’utente.

Formati consentiti:

```txt
A. file completi sostitutivi
B. archivio ZIP con struttura e manifest
C. script patch Python deterministico
D. comandi Git Bash mirati che modificano file
E. patch testuale soltanto quando piccola e revisionabile
```

La consegna deve includere:

- SHA base;
- file creati/modificati/eliminati;
- istruzioni di applicazione;
- controlli da eseguire;
- risultato atteso;
- rollback;
- limiti;
- divieto di commit/push automatico.

Dopo l’applicazione, l’utente produce la diff locale o `fileModificati.md` e la Chat Analisi revisiona.

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
- restituisce il report;
- non esegue commit o push;
- non esegue collaudo browser nello stesso prompt.

### 1.5 Desktop Collaudatore

Modalità:

```txt
DESKTOP_COLLAUDATORE
```

Il Desktop Collaudatore:

- usa la stessa copia locale modificata;
- non modifica codice o documentazione;
- usa interazioni reali;
- controlla UI, dati, console, reload e persistenza;
- produce finding numerati;
- produce matrice `PASS / FAIL / BLOCCATO`;
- non crea `fileModificati.md`;
- non esegue commit o push.

## 2. Scelta della modalità

```txt
modifica locale complessa o diagnosi runtime
→ DESKTOP_ESECUTORE

documenti completi, patch deterministica o Desktop non disponibile
→ CHAT_ESECUTORE

collaudo browser indipendente
→ DESKTOP_COLLAUDATORE

analisi senza modifica
→ CHAT_ANALISI
```

Una task usa una sola modalità esecutiva. Un fix dopo collaudo richiede una nuova task Esecutore.

## 3. Gerarchia delle fonti

1. decisione esplicita più recente dell’utente;
2. stato locale autorizzato: SHA base + diff corrente;
3. test eseguiti sullo stesso stato;
4. codice sul branch canonico;
5. documentazione owner;
6. registri `implementazioni/`;
7. planning e report storici;
8. conversazioni, ZIP e Repomix precedenti.

Un documento storico non prevale sul codice corrente.

## 4. Prompt e consegne

Ogni task deve indicare:

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
- report;
- criteri di successo e stop;
- impatto documentale.

## 5. Massimo tre tentativi

Ogni tentativo:

1. parte dall’errore reale;
2. formula una causa plausibile;
3. applica la correzione minima nello scope;
4. ripete il controllo pertinente.

Dopo il terzo fallimento:

- fermarsi;
- non ampliare lo scope;
- riportare errore, log, file e blocco.

## 6. Artefatti di revisione

### Desktop Esecutore

`fileModificati.md` è obbligatorio e deve contenere:

- stato iniziale;
- working tree;
- file coinvolti;
- comandi ed exit code;
- diff completa;
- contenuto dei file nuovi;
- warning e limiti.

Non va committato.

### Chat Esecutore

La consegna deve contenere:

```txt
DELIVERY-MANIFEST
→ SHA base
→ file
→ modalità applicazione
→ controlli
→ rollback
```

Dopo l’applicazione locale:

```txt
utente
→ git diff / fileModificati.md
→ Chat Analisi revisiona
```

## 7. Documentazione

Per la riscrittura canonica:

```txt
file .md completi
→ ZIP quando necessario
→ manifest di migrazione
→ elenco .mdx da rimuovere
→ verifica link
```

Non usare conversioni automatiche di massa non revisionate.

## 8. Collaudi

Il collaudo separato è normalmente richiesto quando cambiano:

- UX;
- polling;
- session lifecycle;
- persistenza;
- route;
- dati osservabili;
- browser/CDP;
- comportamento runtime.

I report vengono conservati separatamente in `docs/validations/`, non nei documenti owner.

## 9. Git e GitHub

Chat e Desktop non eseguono scritture Git/GitHub.

Flusso finale:

```txt
revisione positiva
→ eventuale collaudo positivo
→ rimozione fileModificati.md
→ git diff --check
→ staging dei soli file approvati
→ commit
→ push main
→ verifica remota dello SHA
```

Branch separati e pull request sono eccezioni approvate esplicitamente.

## 10. Criteri `PRONTO PER TASK`

Una voce diventa task soltanto quando sono definiti:

- problema dimostrato;
- decisioni risolte;
- scope;
- file;
- test;
- rischi;
- criteri;
- collaudo;
- impatto documentale.

## 11. Criteri di chiusura

Una task è chiusa quando:

- scope rispettato;
- controlli positivi;
- diff revisionata;
- finding bloccanti assenti;
- documentazione aggiornata quando richiesta;
- commit e push effettuati dall’utente;
- nuovo SHA verificato.



## 12. Impatto documentale nel report di ogni task

Ogni consegna deve includere:

```txt
modifiche funzionali
contratti coinvolti
documenti owner da aggiornare
documenti invariati
link da verificare
nuovi documenti eventualmente necessari
informazioni mancanti o limiti
```

Questa sezione sostituisce i vecchi file `_work/change-brief.md` e `_work/01-documentation-impact-request.md`.

## 13. Modularizzazione

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
