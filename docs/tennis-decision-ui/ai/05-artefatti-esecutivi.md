# Artefatti esecutivi e revisione

## Scopo

Questo documento è l’owner del formato, della completezza e del lifecycle degli artefatti prodotti durante le esecuzioni, della consegna `CHAT_ESECUTORE` e delle evidenze tecniche richieste alla revisione.

Il lifecycle generale delle task, i ruoli, gli stati e i criteri di chiusura appartengono al [Workflow esecutivo](./03-workflow-esecutivo.md). Questo documento definisce invece quale artefatto è applicabile, cosa deve contenere, come viene consegnato e quali evidenze devono essere disponibili prima della revisione.

## 1. Applicabilità degli artefatti

L’artefatto richiesto dipende dal tipo di task.

| Tipo di task             | Artefatto tecnico applicabile                                            |
| ------------------------ | ------------------------------------------------------------------------ |
| File creati o modificati | `fileModificati.md` oppure pacchetto segmentato                          |
| Sola cancellazione       | manifest delle cancellazioni e output reali sul perimetro                |
| Analisi read-only        | nessun `fileModificati.md`; report e fonti consultate                    |
| Collaudo read-only       | nessun `fileModificati.md`; matrice ed evidenze previste dal workflow    |
| Blocco senza modifiche   | nessun `fileModificati.md`; errore, output, tentativi e criterio di stop |

L’assenza di `fileModificati.md` è quindi un blocco soltanto quando la task ha realmente creato o modificato file.

## 2. `fileModificati.md`

### 2.1 Funzione

`fileModificati.md` rappresenta il contenuto reale dei file presenti nella copia locale dopo l’esecuzione. È l’artefatto tecnico usato per revisionare ciò che è stato effettivamente creato o modificato.

Non è il report della task e non viene committato.

### 2.2 Contenuto

Deve contenere tutti e soli i file effettivamente creati o modificati dalla task, con contenuto completo.

Non deve contenere:

- report dell’Esecutore;
- spiegazioni narrative;
- risultati dei test;
- comandi o exit code;
- warning;
- file preesistenti non toccati;
- cache;
- dump;
- dati runtime;
- credenziali.

I file eliminati non vengono ricostruiti artificialmente dentro `fileModificati.md`.

Un elenco di percorsi, un riepilogo, un manifest privo del contenuto dei file oppure contenuti ricostruiti dal repository remoto non sostituiscono l’artefatto locale quando `fileModificati.md` è applicabile.

### 2.3 Rigenerazione

Se un tentativo successivo modifica ancora uno dei file rappresentati, `fileModificati.md` deve essere rigenerato sullo stato finale raggiunto prima della revisione.

## 3. Generazione riproducibile

La procedura di generazione deve essere deterministica e dichiarata nel prompt applicabile.

Non usare versioni mobili come `repomix@latest`.

Il prompt che richiede l’artefatto deve specificare esplicitamente il metodo deterministico da usare senza presentare come disponibile uno strumento non adottato dal repository.

Se viene usato uno strumento esterno, la versione deve essere esplicita e riproducibile. Un eventuale generatore project-owned potrà essere trattato come canonico soltanto dopo essere stato realmente implementato e verificato.

## 4. Pacchetto bounded e segmentato

Quando un singolo `fileModificati.md` non consente una revisione integrale affidabile, l’artefatto può essere suddiviso in un pacchetto:

```txt
fileModificati/
├── manifest.json
├── 01.md
├── 02.md
└── ...
```

Il `manifest.json` registra per ogni contenuto rappresentato:

```txt
percorso originale
segmento e ordine
intervallo di righe, se il file è diviso
byte
righe
SHA-256 del contenuto
stato: completo
```

Regole:

- nessun contenuto viene troncato;
- un file resta intero quando possibile;
- ogni divisione dichiara gli intervalli e ne preserva l’ordine;
- il manifest permette di ricostruire l’ordine completo del materiale;
- tutti i segmenti applicabili vengono letti prima dell’approvazione;
- il pacchetto non amplia lo scope;
- il pacchetto non viene committato.

Le soglie numeriche di dimensione o segmentazione non sono definite da questo documento e richiedono una decisione esplicita quando necessarie.

## 5. Task di sola cancellazione

Una task di sola cancellazione non deve creare un falso `fileModificati.md`.

Le evidenze minime sullo stato locale comprendono:

```bash
git status --short
git diff --name-status
```

Quando serve verificare il contenuto rimosso:

```bash
git diff -- <percorso>
```

Il manifest delle cancellazioni deve rendere verificabili tutte e sole le cancellazioni autorizzate.

Se gli output mostrano creazioni, modifiche o rinomine non autorizzate, la task non può essere dichiarata conforme allo scope di sola cancellazione.

Le evidenze e il manifest devono riferirsi allo stesso stato locale usato per il report finale.

## 6. Ciclo `CHAT_ESECUTORE`

### 6.1 Consegna iniziale

La prima risposta della `CHAT_ESECUTORE` è una consegna applicabile localmente, non un report finale.

Il `DELIVERY-MANIFEST` dichiara almeno:

```txt
SHA base
file creati/modificati/eliminati previsti
metodo unico di applicazione
controlli locali
risultato atteso
rollback
limiti
procedura per produrre l’artefatto di revisione applicabile
```

La `CHAT_ESECUTORE` deve scegliere un solo metodo di consegna, salvo necessità tecnica esplicita.

Formati di consegna utilizzabili quando appropriati:

```txt
A. file completi sostitutivi
B. archivio ZIP con struttura e manifest
C. script patch deterministico
D. comandi mirati che modificano file
E. patch testuale quando piccola e integralmente revisionabile
```

Nella consegna iniziale la `CHAT_ESECUTORE` non deve:

- dichiarare la task completata;
- dichiarare superati controlli locali non ancora eseguiti;
- dichiarare il risultato pronto per revisione;
- produrre un artefatto come se provenisse dalla copia locale dell’utente;
- produrre il report finale.

### 6.2 Applicazione locale

L’utente applica la consegna, esegue i controlli richiesti, completa gli eventuali tentativi previsti dal workflow e restituisce le evidenze reali dello stato finale.

Quando sono stati creati o modificati file, restituisce `fileModificati.md` oppure il pacchetto segmentato.

Quando l’artefatto non è applicabile, restituisce le evidenze previste per il tipo di task.

Gli output devono includere, quando richiesti dal prompt, risultati dei controlli, exit code, errori e stato locale.

### 6.3 Report finale

Soltanto dopo aver ricevuto gli artefatti applicabili e gli output reali, la `CHAT_ESECUTORE`:

1. legge integralmente gli artefatti di revisione applicabili;
2. verifica che rappresentino tutti e soli i file o le operazioni autorizzate;
3. confronta il materiale con la consegna;
4. usa soltanto comandi, output ed exit code realmente disponibili;
5. produce il report finale separato.

Se un artefatto obbligatorio manca, è incompleto, è troncato oppure contiene elementi fuori scope, il report deve dichiarare il blocco e non un successo.

## 7. Report finale

Il report finale è separato dall’artefatto tecnico.

Contiene almeno:

- ID e modalità;
- SHA base;
- stato iniziale disponibile;
- file letti;
- file creati;
- file modificati;
- file eliminati;
- file rinominati, se presenti;
- riepilogo delle modifiche o delle operazioni;
- comandi eseguiti;
- exit code e risultati reali;
- tentativi;
- warning e limiti;
- working tree o stato locale riportato;
- impatto documentale;
- artefatto di revisione applicabile;
- stato per revisione;
- operazioni Git effettivamente eseguite.

L’artefatto di revisione viene dichiarato esplicitamente, per esempio:

```txt
fileModificati.md singolo
pacchetto segmentato
non applicabile: task read-only
non applicabile: sola cancellazione con manifest
```

Il report:

- non sostituisce l’artefatto tecnico;
- non inventa output o risultati;
- non dichiara superati controlli non eseguiti;
- non dichiara pulito uno stato locale non verificato;
- non approva il lavoro dell’Esecutore.

## 8. Controllo prima della revisione

```txt
[ ] L’artefatto corrisponde al tipo di task.
[ ] Tutti e soli i file o le operazioni autorizzate sono rappresentati.
[ ] Il contenuto applicabile è completo e non troncato.
[ ] Manifest, ordine, dimensioni e digest sono coerenti, se applicabili.
[ ] Le cancellazioni hanno evidenze reali e scope verificabile.
[ ] Output ed exit code appartengono allo stesso stato finale dichiarato.
[ ] Nessun artefatto locale di revisione è destinato al commit.
[ ] Warning e limiti sono espliciti.
```

La revisione non può basarsi soltanto sul riepilogo del report quando esiste un artefatto tecnico applicabile.

## 9. Protezione Git degli artefatti locali

`fileModificati.md` e l’eventuale directory `fileModificati/` sono artefatti locali di revisione e non fanno parte dei file da pubblicare.

Prima dello staging deve essere verificata l’assenza degli artefatti locali dal perimetro destinato al commit. Finché non esiste una modifica di configurazione separata e approvata, l’artefatto deve essere rimosso dalla copia di lavoro prima dello staging.

Un’eventuale protezione exact-root in `.gitignore` costituisce una modifica di configurazione distinta e non deve essere assunta come già disponibile.

## Documenti collegati

- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
- [Selezione del contesto per AI](./01-context-selection.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
