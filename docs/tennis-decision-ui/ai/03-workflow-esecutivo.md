# Workflow esecutivo e criteri di chiusura

## Scopo

Questo documento è l’owner del lifecycle generale delle task e dei ruoli operativi di Tennis Decision UI.

Definisce:

- ruoli e modalità operative;
- sequenza generale di analisi, esecuzione, revisione, collaudo e pubblicazione;
- gerarchia delle fonti;
- requisiti minimi dei prompt;
- regola dei tentativi;
- stati della task;
- gate finale e criteri di chiusura.

Il formato degli artefatti, le consegne della `CHAT_ESECUTORE` e il report finale appartengono ad [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md). La diagnosi dei confini e i criteri tecnici di modularizzazione appartengono a [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md).

Principi:

- una task per volta e scope minimo verificabile;
- nessun refactor opportunistico;
- ruoli separati;
- modalità dichiarata e invariata nella stessa esecuzione;
- massimo tre tentativi ragionati;
- revisione indipendente prima della pubblicazione;
- nel flusso standard commit e push sono eseguiti dall’utente; eventuali eccezioni richiedono un’autorizzazione esplicita.

## 1. Ruoli

### 1.1 Utente

L’utente:

- decide requisiti e priorità;
- autorizza lo scope;
- applica le eventuali consegne remote sulla copia locale;
- fornisce le evidenze locali richieste quando l’esecutore non può produrle direttamente;
- pubblica soltanto dopo la revisione e gli eventuali collaudi richiesti.

### 1.2 `CHAT_ANALISI`

La `CHAT_ANALISI`:

- analizza e delimita una sola task;
- individua le fonti necessarie e il documento owner;
- sceglie o verifica la modalità operativa;
- prepara o revisiona le istruzioni;
- legge integralmente gli artefatti applicabili;
- confronta risultato, scope, contratti, controlli, warning e limiti;
- decide se il risultato è approvato, da correggere o bloccato;
- decide se è richiesto un collaudo separato.

Opera in analisi e revisione: non modifica i file della task e non approva sulla sola base di un riepilogo.

### 1.3 `CHAT_ESECUTORE`

La `CHAT_ESECUTORE` si usa quando l’esecutore può consultare le fonti ma non modificare direttamente la copia locale dell’utente.

La `CHAT_ESECUTORE`:

- prepara una consegna deterministica entro lo scope autorizzato;
- non dichiara modifiche locali, test locali o controlli locali prima di averne ricevuto evidenze reali;
- distingue la consegna iniziale dalle evidenze dell’applicazione locale e dal report finale;
- non auto-approva il proprio lavoro.

Il ciclo completo, i formati di consegna e gli artefatti richiesti sono definiti in [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

### 1.4 `DESKTOP_ESECUTORE`

Il `DESKTOP_ESECUTORE`:

- lavora direttamente sulla copia locale autorizzata;
- modifica soltanto i file inclusi nello scope;
- esegue i controlli richiesti;
- produce gli artefatti applicabili alla task;
- non auto-approva il proprio lavoro;
- non esegue un collaudo indipendente nello stesso prompt.

Le operazioni di pubblicazione non fanno parte dell’esecuzione standard.

### 1.5 `DESKTOP_COLLAUDATORE`

Il `DESKTOP_COLLAUDATORE`:

- opera in sola lettura sullo stato da collaudare;
- usa interazioni e osservazioni reali;
- raccoglie evidenze;
- produce finding ed esiti `PASS / FAIL / BLOCCATO`;
- non modifica codice o documentazione;
- non crea `fileModificati.md`;
- non diventa Esecutore dopo un fallimento.

Un fix successivo a un collaudo fallito richiede una nuova task autorizzata.

## 2. Scelta della modalità

| Esigenza                                       | Modalità               |
| ---------------------------------------------- | ---------------------- |
| Analisi, delimitazione o revisione             | `CHAT_ANALISI`         |
| Consegna applicabile tramite chat browser      | `CHAT_ESECUTORE`       |
| Modifica locale o diagnosi runtime autorizzata | `DESKTOP_ESECUTORE`    |
| Collaudo browser indipendente                  | `DESKTOP_COLLAUDATORE` |

Una sequenza complessiva può usare modalità diverse in prompt distinti. La modalità non cambia durante la stessa esecuzione.

Il lifecycle generale è:

```txt
analisi e delimitazione
→ esecuzione autorizzata
→ controlli ed evidenze
→ revisione indipendente
→ eventuale collaudo separato
→ gate finale
→ pubblicazione autorizzata
→ verifica dello stato finale
```

Le fasi possono terminare con un blocco o richiedere una nuova task; non devono essere fuse per aggirare la separazione dei ruoli.

## 3. Gerarchia delle fonti

Per il risultato di una task usare, nell’ordine:

1. decisione esplicita più recente dell’utente;
2. stato locale autorizzato ed evidenze reali della stessa esecuzione;
3. test eseguiti sullo stesso stato;
4. codice sul branch canonico;
5. documentazione owner;
6. registri correnti;
7. planning, report storici e materiali precedenti.

Lo stato locale è rappresentato dagli artefatti pertinenti alla task: non sempre esiste `fileModificati.md`.

Una fonte storica non prevale sullo stato corrente. Se fonti della stessa task risultano incompatibili e la divergenza cambia il risultato, la task deve essere bloccata finché l’authority non è risolta.

## 4. Requisiti del prompt per modalità

### 4.1 Campi comuni

Ogni prompt deve definire, quando pertinenti:

- ID, titolo e modalità;
- obiettivo unico;
- repository, root, branch e SHA;
- file modificabili, consultabili ed esclusi;
- comportamento o verifica richiesta;
- contratti da preservare;
- controlli;
- criterio di successo;
- criterio di stop;
- impatto documentale;
- vincoli sulle operazioni Git.

### 4.2 Task che creano o modificano file

Aggiungere:

- massimo tre tentativi;
- metodo unico di consegna, quando necessario;
- artefatto di revisione e relativa procedura;
- rollback, quando applicabile;
- momento in cui è consentito produrre il report finale.

Per `CHAT_ESECUTORE`, il prompt deve mantenere distinta la sequenza:

```txt
consegna iniziale
→ applicazione locale ed evidenze
→ report finale
```

I contratti dettagliati di queste fasi appartengono ad [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

### 4.3 Task read-only o di collaudo

Aggiungere:

- precondizioni;
- interazioni o controlli reali;
- evidenze da raccogliere;
- matrice `PASS / FAIL / BLOCCATO`, se è un collaudo;
- criterio di perdita critica;
- `fileModificati.md`: non previsto.

### 4.4 Task di sola cancellazione

Richiedere manifest delle cancellazioni, output reali sul perimetro e report. Non ricostruire artificialmente i file eliminati dentro `fileModificati.md`.

## 5. Massimo tre tentativi

Ogni tentativo:

1. parte dall’errore reale;
2. formula una causa plausibile;
3. applica la correzione minima nello scope;
4. ripete il controllo pertinente.

Dopo il terzo fallimento:

- fermarsi senza ampliare lo scope;
- riportare errore, comando, esito, file coinvolti e criterio di stop;
- non dichiarare la task completata;
- se sono stati modificati file, produrre l’artefatto di revisione sullo stato finale raggiunto.

La definizione e il lifecycle dell’artefatto di revisione appartengono ad [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

## 6. Revisione condizionale

| Stato o tipo di task     | Evidenze o artefatti richiesti                                    |
| ------------------------ | ----------------------------------------------------------------- |
| File creati o modificati | Artefatto di revisione, report e output reali                     |
| File eliminati           | Manifest delle cancellazioni, output sul perimetro e report       |
| Collaudo read-only       | Matrice `PASS / FAIL / BLOCCATO`, evidenze e limiti               |
| Analisi read-only        | Report di analisi e fonti consultate                              |
| Blocco senza modifiche   | Errore, output, tentativi applicabili e criterio di stop          |

Per file creati o modificati, l’artefatto può essere `fileModificati.md` o il pacchetto previsto dal contratto corrente.

La `CHAT_ANALISI` legge integralmente tutti gli artefatti applicabili prima di approvare. Formati, completezza e lifecycle sono definiti in [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

## 7. Collaudo

Il collaudo deve essere dichiarato come:

```txt
richiesto → perimetro e criteri
non richiesto → motivazione
bloccato → precondizione mancante
```

È normalmente separato quando cambiano:

- UX;
- polling;
- lifecycle di sessione;
- persistenza;
- route;
- dati osservabili;
- browser o CDP;
- comportamento runtime.

Il collaudo verifica lo stato prodotto dall’esecuzione; non lo corregge. Un fallimento torna al workflow come nuova task autorizzata.

I report storici di collaudo appartengono a `docs/validations/`, non ai documenti owner.

## 8. Stati della task

| Stato                | Significato                                                        |
| -------------------- | ------------------------------------------------------------------ |
| Eseguita             | L’attività si è fermata con un risultato reale, anche non positivo |
| Pronta per revisione | Controlli e artefatti applicabili sono disponibili                 |
| Approvata            | La revisione indipendente non rileva blocchi                       |
| Pubblicata           | Le operazioni di pubblicazione autorizzate sono state eseguite     |
| Chiusa               | SHA e stato finale richiesti sono verificati                       |

Questi stati non sono intercambiabili.

In particolare:

- un Esecutore non auto-approva il proprio lavoro;
- `Eseguita` non significa `Approvata`;
- `Approvata` non significa `Pubblicata`;
- `Pubblicata` non significa `Chiusa` finché non è verificato lo stato finale richiesto.

## 9. Gate finale e Git

Nel flusso standard, Chat ed Esecutori non eseguono commit o push. Un’eventuale eccezione richiede autorizzazione esplicita.

Prima di uno staging effettuato dall’utente, il controllo previsto comprende:

```bash
git status --short
git diff --name-status
git diff --check
git diff --stat
```

Verificare:

- tutti e soli i file approvati;
- assenza degli artefatti locali di revisione destinati a non essere committati;
- assenza di dati runtime o sensibili;
- nessuna modifica a `docs/archive/` salvo task esplicita.

L’eventuale protezione exact-root di `fileModificati.md` o del pacchetto segmentato in `.gitignore` richiede una modifica di configurazione separata e approvata. Finché tale protezione non è presente, resta procedurale e l’artefatto deve essere rimosso prima dello staging.

Il flusso finale è:

```txt
revisione positiva
→ eventuale collaudo positivo
→ gate finale
→ staging dei soli file approvati
→ commit e push autorizzati
→ verifica dello SHA e dello stato finale
```

## 10. Criteri `PRONTO PER TASK`

Una voce diventa task quando sono definiti:

- problema dimostrato e decisioni risolte;
- scope e file;
- modalità;
- contratti, rischi e controlli;
- criterio di successo e di stop;
- artefatti applicabili al tipo di task;
- collaudo richiesto, non richiesto o bloccato;
- impatto documentale.

Una voce che richiede ancora una decisione capace di cambiare comportamento, scope o authority non è `PRONTO PER TASK`.

## 11. Criteri di chiusura

Una task è pronta per la chiusura quando:

- lo scope è rispettato;
- i controlli sono positivi o i limiti sono esplicitamente accettati;
- tutti gli artefatti applicabili sono stati revisionati;
- non restano finding bloccanti;
- la documentazione richiesta è aggiornata;
- l’eventuale collaudo è concluso;
- le operazioni di pubblicazione previste sono state completate;
- lo stato finale richiesto è stato verificato.

La chiusura appartiene al risultato complessivo del workflow, non alla sola esecuzione tecnica.

## 12. Impatto documentale

Il report applicabile dichiara:

- modifiche funzionali;
- contratti coinvolti;
- owner da aggiornare;
- documenti invariati;
- link da verificare;
- nuovi documenti necessari;
- informazioni mancanti o limiti.

Il controllo di modularizzazione segue [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md). I dettagli del report e degli artefatti appartengono ad [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

## Documenti collegati

- [Selezione del contesto per AI](./01-context-selection.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
- [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md)
- [Mappa del repository](../reference/01-repository-map.md)
