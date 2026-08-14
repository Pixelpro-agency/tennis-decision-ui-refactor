# Selezione del contesto per AI

## Scopo

Questo documento definisce come scegliere il contesto minimo necessario per una task su Tennis Decision UI. Non definisce il ciclo di esecuzione o i criteri di chiusura, che appartengono a [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md). Formato degli artefatti, consegna `CHAT_ESECUTORE`, evidenze di revisione e report finale appartengono ad [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

Per analizzare responsabilità, confini ed eventuali estrazioni di moduli, usare [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md).

Il contesto selezionato non sostituisce codice, test, documentazione owner o decisioni esplicite dell’utente.

## 1. Dati iniziali

Prima di lavorare, identificare:

```txt
repository e root locale
branch e SHA, quando pertinenti
obiettivo unico
modalità operativa
file modificabili
file consultabili
file esclusi
documento owner
controllo mirato
```

Un file consultabile non diventa modificabile. Un file non incluso nello scope di modifica resta fuori perimetro.

## 2. Orientamento sulle modalità

| Modalità               | Contesto da privilegiare                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `CHAT_ANALISI`         | Fonti necessarie per analisi, delimitazione, revisione o preparazione di istruzioni        |
| `CHAT_ESECUTORE`       | Fonti necessarie per produrre una consegna applicabile e verificabile                      |
| `DESKTOP_ESECUTORE`    | File locali autorizzati, dipendenze dirette e controlli pertinenti                         |
| `DESKTOP_COLLAUDATORE` | Contratto da verificare, ambiente osservabile e criteri di esito, senza file da modificare |

Ruoli, modalità, tentativi e criteri di stop sono regolati dal [workflow esecutivo](./03-workflow-esecutivo.md). Formato degli artefatti, consegna `CHAT_ESECUTORE`, evidenze di revisione e report finale sono regolati da [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

## 3. Gerarchia sintetica delle fonti

In caso di divergenza, usare questo ordine:

1. decisione recente dell’utente;
2. stato locale autorizzato e output reali della stessa esecuzione;
3. test eseguiti sullo stesso stato;
4. codice corrente;
5. documento owner;
6. registri correnti;
7. planning e report storici.

Questa gerarchia serve qui come orientamento per selezionare il contesto. Il contratto operativo completo resta nel [workflow esecutivo](./03-workflow-esecutivo.md).

Non fondere fonti incompatibili. Segnalare la divergenza e chiedere una decisione solo se cambia il risultato richiesto.

## 4. Contesto minimo

Includere soltanto:

1. obiettivo concreto;
2. file modificabili, consultabili ed esclusi;
3. documento owner;
4. contratti condivisi realmente attraversati;
5. dipendenze e consumer diretti necessari;
6. test, fixture o controllo più vicino;
7. decisioni utente pertinenti;
8. criterio osservabile di successo e di stop.

Metodo di consegna, artefatti di revisione e report finale si includono soltanto quando la modalità e il [workflow esecutivo](./03-workflow-esecutivo.md) li richiedono; formato e lifecycle degli artefatti sono definiti in [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md). Le modalità read-only, in particolare `CHAT_ANALISI` e `DESKTOP_COLLAUDATORE`, non creano né aggiornano `fileModificati.md`.

## 5. Esclusioni predefinite

Non caricare automaticamente:

- l’intero repository o un Repomix globale;
- history, timeline, cache o dump reali;
- profili browser;
- `.env`, credenziali o altri dati sensibili;
- report storici non pertinenti;
- tutti i documenti canonici;
- test fratelli o directory complete senza una dipendenza dimostrata.

Una fonte esclusa può essere aggiunta solo quando serve a verificare un contratto specifico e il suo uso è autorizzato.

## 6. Selezione per tipo di attività

### Attività di modifica

Oltre al contesto comune, indicare:

- file autorizzati alla modifica;
- contratti da preservare;
- consumer interessati;
- controlli da eseguire;
- eventuali artefatti e modalità di consegna richiesti dal workflow, secondo l’owner [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md).

### Attività read-only

Indicare:

- fonti osservabili;
- azioni vietate;
- evidenze da raccogliere;
- matrice o formato dell’esito, se richiesto.

Non aggiungere istruzioni per creare `fileModificati.md`, applicare patch o preparare una consegna modificabile.

### Analisi o revisione documentale

Indicare:

- documento analizzato;
- documento owner del comportamento descritto;
- codice o test usati come fonte di verità;
- distinzione tra stato corrente, target approvato e storia.

## 7. Navigazione del codice

Ordine preferito:

1. indice o mappa del repository;
2. documento owner;
3. file target;
4. import indispensabili;
5. consumer diretti, se il contratto cambia;
6. test più vicino;
7. fixture o helper locale necessario.

Allargare il contesto un passaggio alla volta. Ogni nuova fonte deve rispondere a una domanda ancora aperta.

## 8. Guardrail condizionali

I guardrail tecnici non vanno copiati in ogni prompt. Includere solo quelli relativi al confine attraversato e rinviare all’owner:

| Area attraversata                                       | Owner da consultare                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Processi, porte, ownership e terminazione               | [Confini di sistema](../architecture/01-system-boundaries.md) e [Runtime locale](../operations/01-local-runtime.md) |
| Persistenza canonica, timeline e history                | [Timeline e history: facade e contratti core](../modules/storage/01-timelines-and-history.md)                       |
| Commit journal e recovery                               | [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)                                   |
| Writer authority ed esclusività process-level           | [Writer authority](../modules/storage/05-writer-authority.md)                                                       |
| Evidence e composizione dello snapshot                  | [Match Evidence Snapshot](../modules/evidence/01-match-evidence-snapshot.md)                                        |
| Source Identity                                         | [Source Identity](../modules/evidence/02-source-identity.md)                                                        |
| Qualità, freshness e allineamento delle fonti           | [Qualità, flow e allineamento](../modules/evidence/03-quality-flow-and-alignment.md)                                |
| Causalità e Market Reactions                            | [Market Reactions](../modules/evidence/04-market-reactions.md)                                                      |
| Identità Betfair e `selectionId`                        | [Validità tecnica del campione](../modules/betfair/02-technical-sample-validity.md)                                 |
| Lifecycle Start/Stop e attivazione frontend             | [Session shell](../modules/frontend/01-session-shell.md)                                                            |
| Betfair Depth, Money Flow e health UI                   | [Betfair Depth e health UI](../modules/frontend/05-betfair-depth-and-health-ui.md)                                  |
| Presentazione Market Reactions                          | [Market Reactions UI](../modules/frontend/06-market-reactions-ui.md)                                                |
| Entry point e wrapper Python                            | [Entry point e runtime Python](../modules/python/01-entrypoints-and-runtime.md)                                     |

Se la task non attraversa una di queste aree, il relativo guardrail non fa parte del contesto minimo.

## 9. Decisioni mancanti

Fermarsi e chiedere all’utente quando una scelta non ricavabile dalle fonti cambia:

- comportamento o risultato;
- dati o persistenza;
- interfaccia utente;
- compatibilità;
- perimetro di rimozione;
- authority fra fonti discordanti.

Non chiedere per informazioni recuperabili, controlli necessari, dettagli già decisi o metodi tecnici equivalenti entro lo scope autorizzato.

## 10. Template condizionale

```txt
ID e titolo:
Modalità:
Obiettivo:
Repository / root / branch / SHA, se pertinenti:

File modificabili:
- ...

File consultabili:
- ...

File esclusi:
- ...

Documento owner:
- ...

Contratti attraversati:
- ...

Controllo e risultato atteso:
- ...

Criterio di stop:
- ...
```

Per una task di modifica aggiungere soltanto i campi esecutivi richiesti dal workflow; per consegna, artefatti e report usare l’owner [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md). Per una task read-only aggiungere invece evidenze e formato dell’esito, senza `fileModificati.md`.

## 11. Checklist

```txt
[ ] Esiste un solo obiettivo verificabile.
[ ] Modalità e scope sono espliciti.
[ ] File modificabili, consultabili ed esclusi sono distinti.
[ ] Il documento owner è individuato.
[ ] Sono inclusi soltanto contratti e consumer attraversati.
[ ] Il controllo è reale, mirato e ripetibile.
[ ] Ogni fonte aggiunta risponde a una domanda aperta.
[ ] Nessun dato sensibile è incluso.
[ ] Artefatti e report sono presenti solo se richiesti dal workflow e seguono il relativo owner.
[ ] Una modalità read-only non crea fileModificati.md.
```

## Documenti collegati

- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
- [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md)
- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Mappa del repository](../reference/01-repository-map.md)
