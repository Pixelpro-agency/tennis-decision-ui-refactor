# Artefatti esecutivi e revisione

## Scopo

Questo documento è l’owner degli artefatti prodotti dalle task, della consegna `CHAT_ESECUTORE` e delle evidenze richieste alla revisione. Il lifecycle e i ruoli appartengono al [Workflow esecutivo](./03-workflow-esecutivo.md).

## 1. Artefatto per file creati o modificati

`fileModificati.md` rappresenta il contenuto reale della copia locale dopo l’esecuzione. Non è il report della task e non viene committato.

Deve contenere tutti e soli i file creati o modificati, con contenuto completo. Non deve contenere report, risultati dei test, warning, file non toccati, cache, dump, dati runtime o credenziali.

Se un tentativo cambia ancora i file, l’artefatto viene rigenerato. Un elenco di percorsi o contenuti ricostruiti dal remoto non lo sostituisce.

## 2. Generazione riproducibile

Non usare `repomix@latest`: una versione variabile non rende ripetibile la generazione.

La task deve scegliere uno dei metodi approvati:

1. Repomix con versione esplicitamente approvata e dichiarata nel prompt;
2. un generatore project-owned, quando sarà implementato e verificato da una task separata.

Non esiste al momento una versione Repomix approvata né un generatore locale canonico documentato. Finché manca questa decisione, il prompt deve fornire un metodo deterministico esplicito senza presentare strumenti futuri come disponibili.

## 3. Pacchetto bounded e segmentato

Quando un singolo file non consente una revisione integrale affidabile, l’artefatto può essere un pacchetto:

```txt
fileModificati/
├── manifest.json
├── 01.md
├── 02.md
└── ...
```

Il manifest registra per ogni contenuto:

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
- tutti i segmenti vengono letti prima dell’approvazione;
- il pacchetto non amplia lo scope e non viene committato.

Le soglie numeriche di dimensione e segmentazione richiedono una decisione esplicita dell’utente e non sono definite da questo documento.

## 4. Task di sola cancellazione

Non creare un falso `fileModificati.md`. Richiedere:

```bash
git status --short
git diff --name-status
```

e, quando serve a verificare il contenuto rimosso:

```bash
git diff -- <percorso>
```

Il manifest distingue file creati, modificati, eliminati e rinominati e conferma che tutte e sole le cancellazioni autorizzate siano presenti.

## 5. Ciclo `CHAT_ESECUTORE`

### Consegna iniziale

La prima risposta è una consegna applicabile, non un report finale. Il `DELIVERY-MANIFEST` dichiara SHA base, file previsti, metodo unico di applicazione, controlli, risultato atteso, rollback, limiti e procedura per l’artefatto di revisione.

La Chat Esecutore non dichiara la task completata, controlli locali superati o artefatti provenienti dalla copia locale prima dell’applicazione.

### Applicazione locale

L’utente applica la consegna, esegue i controlli, completa gli eventuali tentativi e restituisce artefatto finale, output, exit code, errori e stato locale richiesto.

### Report finale

La Chat Esecutore legge integralmente gli artefatti applicabili, ne verifica scope e completezza e produce il report separato usando soltanto output reali. Se gli artefatti mancano o sono incompleti, riporta il blocco e non un successo.

## 6. Report finale

Il report contiene almeno:

- ID, modalità e SHA base;
- stato iniziale disponibile;
- file letti, creati, modificati, eliminati e rinominati;
- riepilogo;
- comandi, exit code e risultati reali;
- tentativi, warning e limiti;
- stato locale riportato;
- impatto documentale;
- stato per revisione;
- operazioni Git effettivamente eseguite.

Deve inoltre dichiarare l’artefatto di revisione:

```txt
fileModificati.md singolo
pacchetto segmentato
non applicabile: task read-only
non applicabile: sola cancellazione con manifest
```

Il report non sostituisce l’artefatto tecnico, non inventa esiti e non approva il lavoro dell’Esecutore.

## 7. Controllo prima della revisione

```txt
[ ] Tutti e soli i file autorizzati sono rappresentati.
[ ] Il contenuto è completo e non troncato.
[ ] Manifest, ordine, dimensioni e digest sono coerenti, se applicabili.
[ ] Le cancellazioni hanno evidenze reali e scope verificabile.
[ ] Output ed exit code provengono dalla stessa esecuzione.
[ ] Nessun artefatto locale è destinato al commit.
[ ] Warning e limiti sono espliciti.
```

## Documenti collegati

- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
- [Selezione del contesto per AI](./01-context-selection.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
