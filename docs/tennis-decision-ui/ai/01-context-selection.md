# Selezione del contesto per AI

## Scopo

Questo documento definisce il contesto minimo da fornire a una chat o a un'API AI per analizzare, modificare o collaudare Tennis Decision UI.

L'obiettivo è ottenere una task verificabile senza caricare automaticamente l'intero repository, dati runtime, documentazione aggregata o materiale storico non pertinente.

## Gerarchia delle fonti

Usare, in ordine:

1. decisione esplicita più recente dell'utente;
2. stato locale autorizzato: SHA base, branch e diff corrente;
3. test eseguiti sullo stesso stato;
4. codice sul branch canonico;
5. documento owner del modulo;
6. registri di audit, implementazioni e decisioni;
7. planning, validazioni e report storici.

Quando le fonti divergono, non inventare una sintesi. Segnalare la discrepanza e usare la fonte con autorità maggiore.

## Informazioni minime della task

Ogni task deve indicare:

- obiettivo unico e osservabile;
- modalità operativa;
- repository, branch e SHA base;
- file modificabili;
- file consultabili;
- file esclusi;
- documento owner;
- contratti da preservare;
- controllo o test mirato;
- criterio di successo e di stop;
- impatto documentale.

Distinguere sempre:

```txt
file modificabili
≠
file consultabili
≠
file esclusi
```

Un file consultabile non diventa automaticamente modificabile.

## Modalità operative

| Modalità               | Uso                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `CHAT_ANALISI`         | Lettura, confronto, decisioni, delimitazione e revisione; nessuna modifica autonoma al repository |
| `CHAT_ESECUTORE`       | Consegna deterministica tramite file completi, ZIP, patch o comandi; nessun commit o push         |
| `DESKTOP_ESECUTORE`    | Modifica della copia locale, controlli mirati e `fileModificati.md`; nessun commit o push         |
| `DESKTOP_COLLAUDATORE` | Verifica browser/runtime indipendente senza modificare file                                       |

Non cambiare ruolo all'interno della stessa task. Un fix successivo a un collaudo fallito è una nuova task Esecutore.

## Percorso di lettura consigliato

Per una modifica ristretta:

1. aprire la [mappa del repository](../reference/01-repository-map.md);
2. leggere il documento owner;
3. leggere il file target;
4. seguire soltanto gli import indispensabili;
5. leggere i consumer diretti se il contratto cambia;
6. leggere il test più vicino quando serve a comprendere o verificare il contratto;
7. aggiungere fixture o helper locali soltanto se indispensabili.

Non leggere automaticamente intere directory, test fratelli, tutti i documenti canonici o un Repomix globale.

## Pacchetti minimi per area

| Area                | Codice minimo                                         | Documento owner corrente                                                              |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| API Match           | router Match e modulo `routes/match/` interessato     | `../api/01-match.md`                                                                    |
| API Betfair         | router Betfair e modulo `routes/betfair/` interessato | `../api/02-betfair.md`                                                                  |
| API Evidence        | route e modulo Evidence interessato                   | `../api/03-evidence.md`                                                                 |
| Tracking live       | `matchTracker.js` e update coinvolto                  | `../modules/sofa/01-live-tracking.md`                                                   |
| Persistenza         | facade e sottoprogetto storage interessato            | `../modules/storage/01-timelines-and-history.md` o `02-commit-journal-and-recovery.md` |
| Scraper Betfair     | package Python e adattatore Node interessato          | `../modules/python/03-betfair-scraper.md`                                               |
| Scraper SofaScore   | package Python e adattatore Node interessato          | `../modules/python/02-sofascore-scraper.md`                                             |
| Frontend            | hook, componente e utility direttamente coinvolti     | documento `modules/frontend/` pertinente                                              |
| Runtime locale      | wrapper, `launcher/` o script interessato             | `../operations/01-local-runtime.md`                                                     |
| Solo documentazione | file target e link direttamente collegati             | [Convenzioni documentazione](./02-documentation-conventions.md)                       |

I percorsi nella tabella puntano agli owner Markdown correnti. Non autorizzano a descrivere come implementati i contratti futuri registrati nell'audit.

## Quando ampliare il contesto

Aggiungere un contratto condiviso soltanto quando la modifica può cambiare:

- endpoint, payload o status HTTP;
- argomenti CLI o JSON su stdout;
- ownership di processi o sessioni;
- formato o autorità della persistenza;
- invarianti di Source Identity o Evidence;
- comportamento osservabile del frontend;
- lifecycle di scraper, browser o runtime.

Per un refactor interno che preserva il contratto pubblico, non caricare automaticamente tutti i consumer.

## Confini permanenti

- Il frontend non ricostruisce Evidence, identity o journal.
- Gli endpoint read-only non avviano scraper, tracking, browser, repair o recovery.
- Health, freshness e persistence integrity sono concetti distinti.
- Il nome del runner non sostituisce `selectionId` quando è richiesta l'identità Betfair.
- I network dump non sono input algoritmici né fonte canonica.
- History e timeline non si modificano per risolvere Source Identity.
- Un problema interno a Market Reactions non introduce automaticamente un nuovo blocco dello Start.
- Processi esterni non vengono terminati in base alla sola porta.
- I wrapper Python root restano facade sottili salvo migrazione esplicita della CLI.

## Test e tentativi

Ogni task deve specificare il controllo più vicino al comportamento modificato.

Regole:

- non dichiarare eseguito un test che non è stato realmente eseguito;
- non attribuire automaticamente un fallimento alla modifica senza una baseline comparabile;
- non ampliare lo scope per correggere failure non pertinenti;
- sono consentiti al massimo tre tentativi ragionati;
- ogni tentativo parte dall'errore reale, formula una causa plausibile, applica la correzione minima e ripete il controllo pertinente;
- dopo il terzo fallimento, fermarsi e riportare errore, file, comandi, exit code e limite.

Il progetto non dispone ancora di un runner unico. Fino alla sua introduzione, i comandi sono scelti dal documento owner, dal test più vicino e dal runbook di validazione.

## Artefatto post-task

### Desktop Esecutore

Se la task modifica file, creare `fileModificati.md` dalla root includendo soltanto i file effettivamente modificati o creati dalla task. Non includere modifiche preesistenti e non modificare ulteriormente i file dopo la generazione dell'artefatto.

Comando previsto in PowerShell:

```powershell
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"
```

`fileModificati.md` non viene committato.

### Chat Esecutore

La consegna deve includere:

- SHA base;
- file completi o patch deterministica;
- istruzioni di applicazione;
- controlli;
- risultato atteso;
- rollback;
- limiti;
- divieto di commit e push automatici.

Dopo l'applicazione locale, l'utente fornisce diff o `fileModificati.md` alla Chat Analisi.

## Esclusioni predefinite

Non includere salvo necessità esplicita:

- `.env`, cookie, token, password, chiavi e credenziali;
- profili browser;
- `backend/match_history/` e `.pending_commits/`;
- cache runtime o browser;
- dump di rete e log completi;
- lock e manifest runtime;
- `node_modules` e build;
- file sotto `legacy/`;
- report storici non pertinenti;
- intero repository o Repomix globale.

## Template minimo

```txt
ID e titolo:
Modalità:
Obiettivo:
Repository / branch / SHA:

File modificabili:
- ...

File consultabili:
- ...

File esclusi:
- ...

Documento owner:
- ...

Contratti da preservare:
- ...

Controlli:
- ...

Massimo tre tentativi:
- sì

Criterio di successo:
- ...

Criterio di stop:
- ...

Impatto documentale:
- ...

Report finale:
- file modificati;
- comandi ed exit code;
- test e risultati;
- tentativi;
- warning e limiti;
- commit: no;
- push: no.
```

## Checklist

```txt
[ ] Un solo obiettivo verificabile.
[ ] Branch e SHA base dichiarati.
[ ] File modificabili, consultabili ed esclusi separati.
[ ] Documento owner individuato.
[ ] Contratti condivisi inclusi soltanto se attraversati.
[ ] Controllo mirato reale e ripetibile.
[ ] Massimo tre tentativi esplicitato.
[ ] Nessun dato generato o sensibile incluso senza necessità.
[ ] Impatto documentale dichiarato.
[ ] Commit e push riservati all'utente.
```

## Documenti collegati

- [Indice della documentazione](../index.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Mappa del repository](../reference/01-repository-map.md)
- [Workflow esecutivo completo](../../../implementazioni/07-workflow-esecutivo.md)
- [Linee guida per chat e AI](../../../implementazioni/08-linee-guida-chat-e-ai.md)
