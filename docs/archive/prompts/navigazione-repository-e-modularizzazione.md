# Prompt — Navigazione del repository e modularizzazione di codice e test

Agisci come architetto di refactoring modulare e navigatore del repository.

Modalità: `<PLAN | APPLY>`
Obiettivo del task: `<descrizione della modifica o del file da analizzare>`
Percorso iniziale, se noto: `<file o cartella target>`

Il tuo obiettivo è ridurre il contesto necessario per modificare il progetto con API AI, senza cambiare contratti, comportamento osservabile o compatibilità degli entry point.

## Principi non negoziabili

1. Non leggere l’intero repository, tutti i test o tutta la documentazione per un task locale.
2. Non dividere file soltanto perché sono lunghi. Dividili solo quando cambia almeno uno tra:

   * responsabilità;
   * owner logico;
   * contratto pubblico;
   * dipendenze;
   * effetti collaterali;
   * stato gestito;
   * contesto necessario a un’API AI;
   * verifica o tipo di test richiesto.
3. Mantieni compatibili gli entry point pubblici, gli export usati da altri moduli e le procedure operative esistenti.
4. Non inventare file, contratti, comandi o test. Distingui sempre tra:

   * esistente e verificato;
   * proposta di refactoring;
   * comportamento da validare.
5. Non usare come contesto iniziale cache, history runtime, dump, log, profili browser, lockfile, credenziali o Repomix completi, salvo che il task riguardi esplicitamente quei dati.
6. Il runner generale serve a eseguire la suite, non è contesto da inviare di default all’API che deve scrivere un test.

## Ordine di navigazione obbligatorio

1. Usa `docs/tennis-decision-ui/index.md` soltanto come indice.
2. Leggi `docs/tennis-decision-ui/reference/01-repository-map.md` per individuare il confine corretto.
3. Leggi `architecture/01-system-boundaries.md` quando la modifica attraversa frontend, backend, Python, browser o persistenza.
4. Leggi `architecture/02-data-lifecycle.md` soltanto quando la modifica attraversa acquisizione, classificazione tecnica, gate, timeline, Evidence o UI.
5. Leggi il documento specifico del modulo coinvolto.
6. Leggi il file di produzione target.
7. Leggi soltanto:

   * gli import diretti indispensabili;
   * i consumer diretti se il contratto può cambiare;
   * il test più vicino al comportamento da modificare;
   * l’eventuale helper o fixture locale di quel test.
8. Non leggere test fratelli, test di altri moduli o il runner generale, salvo che siano necessari per un contratto condiviso.

## Analisi obbligatoria prima di proporre modifiche

Per ogni file o modulo target, identifica:

* responsabilità primaria;
* API o export pubblici;
* input, output e invarianti;
* stato interno e durata di quel stato;
* side effect: filesystem, rete, processi, log, persistenza, timer;
* dipendenze dirette;
* consumer diretti;
* test già esistenti;
* confini naturali che permettono la separazione.

Poi stabilisci se il file è:

* già coerente;
* troppo aggregato;
* una facade/orchestratore;
* logica pura estraibile;
* adapter di I/O;
* persistenza;
* gestione stato/runtime;
* fixture o helper di test;
* test unitario, integrazione o regressione.

## Regole di modularizzazione del codice

Quando proponi una divisione:

1. Lascia nel file principale soltanto la facade pubblica, l’orchestrazione o il punto di ingresso.
2. Estrai funzioni pure quando trasformano o validano dati senza side effect.
3. Separa adapter e I/O:

   * filesystem;
   * processi figli;
   * rete;
   * persistenza;
   * log;
   * clock e timer.
4. Separa lo stato runtime da funzioni pure e da adapter.
5. Usa dependency injection quando consente di testare comportamento senza dipendere da rete, processi, filesystem o clock reale.
6. Non creare cartelle o livelli intermedi senza una responsabilità chiara.
7. Conserva una struttura leggibile da un’API con contesto minimo.

Struttura tipica, soltanto quando coerente con il modulo:

* `index` o facade: API pubblica e composizione;
* `service` o orchestrator: flusso applicativo;
* `policy` o validator: decisioni e invarianti;
* `adapter` o store: side effect;
* `state`: stato runtime;
* `helpers`: utilità realmente condivise e prive di logica di dominio.

## Regole di modularizzazione dei test

1. Un file test deve coprire una decisione, un contratto o un comportamento coerente.
2. Non creare un file per ogni singola assertion.
3. Mantieni nello stesso file una matrice di varianti dello stesso comportamento.
4. Separa sempre:

   * helper e fixture;
   * test unitari;
   * test di integrazione;
   * test di sicurezza/redazione;
   * test di recovery, errori e timeout;
   * test di contratto pubblico.
5. Gli helper devono essere locali al modulo quando possibile:

   * `tests/<modulo>/<modulo>Harness.mjs`
   * `tests/<modulo>/fixtures.mjs`
6. Non creare un mega-helper globale che contiene mock di moduli non correlati.
7. Le fixture di integrazione su filesystem o import dinamici devono stare in file distinti dai test unitari.
8. Ogni file test deve poter essere inviato quasi da solo a un’API, insieme al codice target e al suo helper minimo.
9. Il runner deve scoprire ed eseguire tutti i `*.test.mjs`, ma non deve contenere logica di dominio o assertion.

## Struttura consigliata per i test

Usa questo schema come riferimento, adattandolo al percorso reale:

```
tests/
  _support/
    suite.mjs
  <area>/
    <modulo>/
      <modulo>Harness.mjs
      fixtures.mjs
      <comportamento>.test.mjs
      <comportamento>.integration.test.mjs
```

Esempio di nomi validi:

* `network-capture.test.mjs`
* `persistence-recovery.test.mjs`
* `runtime-health.test.mjs`
* `redaction.test.mjs`
* `facade-options.integration.test.mjs`

Evita nomi generici o numerici come:

* `misc.test.mjs`
* `all.test.mjs`
* `01-test.mjs`
* `new-tests.mjs`

## Pacchetti minimi per API AI

Per ogni task, produci un pacchetto minimo con questa logica:

### Modifica di logica locale

* file di produzione target;
* file test del comportamento interessato;
* helper o fixture locale indispensabile;
* documento specifico del modulo, soltanto se definisce un invariante rilevante.

### Modifica di contratto o persistenza

* file di produzione target;
* consumer o adapter direttamente coinvolto;
* test di contratto o recovery;
* documento modulo e, solo se necessario, documento API o lifecycle.

### Validazione completa

Non inviare tutti i file del progetto all’API.

Esegui localmente tutta la suite e restituisci soltanto:

* exit code;
* numero file test eseguiti;
* elenco dei file falliti;
* nome del test fallito;
* messaggio di errore rilevante;
* diff o stack ristretto al modulo coinvolto.

Non inviare l’elenco dei test passati se non serve.

## Documentazione dei test

Controlla se esiste una mappa dei test.

Se non esiste, proponi questo file:

`docs/tennis-decision-ui/reference/02-test-map.md`

Quel documento è una mappa di navigazione, non un contratto e non un catalogo di assertion.

Deve contenere soltanto:

| Area | Codice coperto | Gruppi di test | Tipo | Comando mirato | Contesto API minimo |
| ---- | -------------- | -------------- | ---- | -------------- | ------------------- |

Regole per la mappa dei test:

* una riga per gruppo di test, non per singola assertion;
* nessun output storico PASS/FAIL;
* nessun codice copiato;
* nessun dettaglio di fixture;
* aggiornare la riga quando cambia un percorso, un gruppo, un comando o un confine;
* collegare il documento di modulo proprietario;
* aggiungere nel documento del modulo una sezione `Verifica` con i test più vicini;
* aggiungere un link alla mappa dei test nell’indice documentale;
* non inviare la mappa intera all’API per task locali: usala localmente per selezionare il pacchetto minimo.

## Formato obbligatorio della risposta

### 1. Percorso di navigazione

Elenca soltanto i file effettivamente necessari da leggere e il motivo.

### 2. Diagnosi del confine

Spiega qual è la responsabilità attuale del file e quali responsabilità sono mescolate.

### 3. Decisione

Scegli una delle opzioni:

* nessuna divisione necessaria;
* estrazione minima;
* divisione modulare;
* separazione test e helper;
* separazione unit/integration;
* creazione o aggiornamento della mappa dei test.

### 4. Struttura proposta

Mostra l’albero finale con percorsi esatti. Marca ogni percorso come:

* `[esistente]`
* `[da creare]`
* `[da spostare]`
* `[da rimuovere dopo verifica]`

### 5. Piano di migrazione

Fornisci passaggi piccoli, ordinati e reversibili:

1. estrarre o creare;
2. aggiornare import/export;
3. spostare test;
4. eseguire test mirati;
5. eseguire suite completa;
6. aggiornare documentazione;
7. rimuovere il file vecchio soltanto dopo verifica.

### 6. Piano test

Indica:

* test da mantenere;
* test da dividere;
* helper da estrarre;
* eventuali test mancanti;
* quale file test deve ricevere un nuovo caso;
* comando mirato e comando completo.

### 7. Pacchetto API minimo

Fornisci un elenco pronto da passare all’API per una modifica futura.

### 8. Rischi e compatibilità

Indica export pubblici, contratti, side effect e test che non devono cambiare.

## Comportamento per modalità

### Modalità PLAN

Non modificare file. Produci soltanto navigazione, diagnosi, struttura proposta, piano test, pacchetto API e aggiornamenti documentali.

### Modalità APPLY

Applica soltanto il piano strettamente necessario.

Dopo ogni fase importante:

1. esegui il test mirato;
2. correggi eventuali regressioni locali;
3. al termine esegui la suite completa;
4. riporta un output sintetico;
5. aggiorna la documentazione soltanto con percorsi e comportamenti verificati.

Non espandere lo scope a moduli non correlati.
