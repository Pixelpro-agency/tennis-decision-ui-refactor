# Workflow esecutivo e criteri di chiusura

## Scopo

Questo documento è l’owner del lifecycle delle task e dei ruoli operativi di Tennis Decision UI. Il formato degli artefatti, le consegne della Chat Esecutore e il report finale appartengono ad [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md). La diagnosi dei confini appartiene a [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md).

Principi:

- una task per volta e scope minimo verificabile;
- nessun refactor opportunistico;
- modalità dichiarata e invariata nella stessa esecuzione;
- massimo tre tentativi ragionati;
- revisione indipendente prima della pubblicazione;
- commit e push eseguiti soltanto dall’utente.

## 1. Ruoli

### Utente

Decide requisiti e priorità, autorizza lo scope, applica le eventuali consegne remote e pubblica soltanto dopo la revisione richiesta.

### `CHAT_ANALISI`

Analizza e delimita la task, prepara o revisiona le istruzioni, legge tutti gli artefatti applicabili e decide se il risultato è approvato, da correggere o bloccato. Non modifica file e non approva sulla sola base di un riepilogo.

### `CHAT_ESECUTORE`

Prepara una consegna deterministica quando può consultare le fonti ma non modificare la copia locale. Non dichiara modifiche o controlli locali prima di averne ricevuto le evidenze reali. Il ciclo completo è definito in [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

### `DESKTOP_ESECUTORE`

Lavora sulla copia locale, modifica soltanto i file autorizzati, esegue i controlli richiesti e produce gli artefatti applicabili. Non esegue commit, push o un collaudo indipendente nello stesso prompt.

### `DESKTOP_COLLAUDATORE`

Opera in sola lettura sullo stato da collaudare, usa interazioni reali e produce finding ed esiti `PASS / FAIL / BLOCCATO`. Non modifica file, non crea `fileModificati.md` e non diventa Esecutore dopo un fallimento.

## 2. Scelta della modalità

| Esigenza                                       | Modalità               |
| ---------------------------------------------- | ---------------------- |
| Analisi, delimitazione o revisione             | `CHAT_ANALISI`         |
| Consegna applicabile tramite chat browser      | `CHAT_ESECUTORE`       |
| Modifica locale o diagnosi runtime autorizzata | `DESKTOP_ESECUTORE`    |
| Collaudo browser indipendente                  | `DESKTOP_COLLAUDATORE` |

Una sequenza complessiva può usare modalità diverse in prompt distinti. La modalità non cambia durante la stessa esecuzione; un fix dopo un collaudo fallito richiede una nuova task autorizzata.

## 3. Gerarchia delle fonti

1. decisione esplicita più recente dell’utente;
2. stato locale autorizzato ed evidenze reali della stessa esecuzione;
3. test eseguiti sullo stesso stato;
4. codice sul branch canonico;
5. documentazione owner;
6. registri correnti;
7. planning, report storici e materiali precedenti.

Lo stato locale è rappresentato dagli artefatti pertinenti alla task: non sempre esiste `fileModificati.md`.

## 4. Requisiti del prompt per modalità

### Campi comuni

- ID, titolo e modalità;
- obiettivo unico;
- repository, root, branch e SHA quando pertinenti;
- file modificabili, consultabili ed esclusi;
- comportamento o verifica richiesta;
- contratti da preservare;
- controlli;
- criterio di successo e criterio di stop;
- impatto documentale;
- vincoli sulle operazioni Git.

### Task che creano o modificano file

Aggiungere:

- massimo tre tentativi;
- metodo unico di consegna, se necessario;
- artefatto di revisione e relativa procedura;
- rollback, quando applicabile;
- momento del report finale.

### Task read-only o di collaudo

Aggiungere:

- precondizioni;
- interazioni o controlli reali;
- evidenze da raccogliere;
- matrice `PASS / FAIL / BLOCCATO`, se è un collaudo;
- criterio di perdita critica;
- `fileModificati.md`: non previsto.

### Task di sola cancellazione

Richiedere manifest delle cancellazioni, output reali sul perimetro e report. Non ricostruire artificialmente i file eliminati dentro `fileModificati.md`.

## 5. Massimo tre tentativi

Ogni tentativo:

1. parte dall’errore reale;
2. formula una causa plausibile;
3. applica la correzione minima nello scope;
4. ripete il controllo pertinente.

Dopo il terzo fallimento, fermarsi senza ampliare lo scope e riportare errore, comando, esito, file coinvolti e criterio di stop. Se sono stati modificati file, produrre l’artefatto di revisione sullo stato finale raggiunto.

## 6. Revisione condizionale

| Stato o tipo di task     | Artefatti richiesti                                               |
| ------------------------ | ----------------------------------------------------------------- |
| File creati o modificati | `fileModificati.md` o pacchetto segmentato, report e output reali |
| File eliminati           | Manifest delle cancellazioni, output sul perimetro e report       |
| Collaudo read-only       | Matrice `PASS / FAIL / BLOCCATO`, evidenze e limiti               |
| Analisi read-only        | Report di analisi e fonti consultate                              |
| Blocco senza modifiche   | Errore, output, tentativi e criterio di stop                      |

La Chat Analisi legge integralmente tutti gli artefatti applicabili prima di approvare. Formati, completezza e lifecycle sono definiti in [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

## 7. Collaudo

Il collaudo deve essere dichiarato come:

```txt
richiesto → perimetro e criteri
non richiesto → motivazione
bloccato → precondizione mancante
```

È normalmente separato quando cambiano UX, polling, lifecycle di sessione, persistenza, route, dati osservabili, browser, CDP o comportamento runtime. I report storici di collaudo appartengono a `docs/validations/`, non ai documenti owner.

## 8. Stati della task

| Stato                | Significato                                                        |
| -------------------- | ------------------------------------------------------------------ |
| Eseguita             | L’attività si è fermata con un risultato reale, anche non positivo |
| Pronta per revisione | Controlli e artefatti applicabili sono disponibili                 |
| Approvata            | La revisione indipendente non rileva blocchi                       |
| Pubblicata           | L’utente ha eseguito la pubblicazione autorizzata                  |
| Chiusa               | SHA e stato finale richiesti sono verificati                       |

Questi stati non sono intercambiabili. Un Esecutore non auto-approva il proprio lavoro.

## 9. Gate finale e Git

Chat ed Esecutori non eseguono commit o push salvo autorizzazione esplicita dell’utente.

Prima di uno staging effettuato dall’utente, il controllo previsto comprende:

```bash
git status --short
git diff --name-status
git diff --check
git diff --stat
```

Verificare tutti e soli i file approvati, assenza degli artefatti locali di revisione, assenza di dati runtime o sensibili e nessuna modifica a `docs/archive/` salvo task esplicita.

L’eventuale protezione exact-root di `fileModificati.md` o del pacchetto segmentato in `.gitignore` richiede una modifica di configurazione separata e approvata. Finché non è approvata, la protezione resta procedurale e l’artefatto deve essere rimosso prima dello staging.

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

## 11. Criteri di chiusura

Una task è pronta per la chiusura quando:

- lo scope è rispettato;
- i controlli sono positivi o i limiti sono esplicitamente accettati;
- tutti gli artefatti applicabili sono stati revisionati;
- non restano finding bloccanti;
- la documentazione richiesta è aggiornata;
- l’eventuale collaudo è concluso;
- l’utente ha completato le operazioni di pubblicazione previste;
- lo stato finale richiesto è stato verificato.

## 12. Impatto documentale

Il report applicabile dichiara modifiche funzionali, contratti coinvolti, owner da aggiornare, documenti invariati, link da verificare, nuovi documenti necessari e informazioni mancanti. Il controllo di modularizzazione segue [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md).

## Documenti collegati

- [Selezione del contesto per AI](./01-context-selection.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
- [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md)
- [Mappa del repository](../reference/01-repository-map.md)
