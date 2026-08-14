# Runtime locale

## Scopo

Questo runbook descrive l'avvio, il riuso, la readiness e lo shutdown locale dello stack di sviluppo:

```text
Chrome CDP
→ backend Express
→ frontend Vite
```

`avvio.py` è l'entry point dell'orchestrazione. Il launcher coordina i servizi locali, ma non è owner del tracking, degli scraper, dei dati canonici, del commit journal o della recovery. La writer authority della persistenza resta backend-owned.

## Prerequisiti

- Python e Node.js disponibili nel terminale.
- Dipendenze frontend installate, inclusa la CLI Vite locale.
- PowerShell e Chrome disponibili se il launcher deve richiedere l'avvio di Chrome con CDP.
- Per i flussi Betfair che la richiedono, `BETFAIR_APP_KEY` disponibile nell'ambiente o nel file `.env` locale della root.

Il file `.env` è locale: non deve essere condiviso o versionato.

## Avvio

Dalla root del repository:

```text
python avvio.py
```

Sequenza operativa:

```text
lettura del manifest precedente
→ creazione dell'identità della nuova invocazione
→ acquisizione o reclaim conservativo del launcher lock
→ eventuale riuso della sessione verificata
→ creazione del manifest di startup
→ risoluzione CDP bounded
→ discovery read-only dei backend candidati
→ riuso oppure avvio di un solo backend
→ risoluzione del frontend coerente con il backend selezionato
→ manifest ready
→ apertura browser best-effort
→ attesa di Ctrl+C o di un segnale di arresto
```

Il fast path di riuso viene valutato soltanto dopo l'acquisizione o il reclaim positivo del lock. La sola presenza di un manifest non rende riusabile una sessione.

## Servizi e porte

| Servizio        | Porta preferita | Verifica                                     |
| --------------- | --------------: | -------------------------------------------- |
| Chrome CDP      | `9222`          | `http://127.0.0.1:<porta>/json/version`      |
| Backend Express | `3001`          | `http://127.0.0.1:<porta>/api/health`        |
| Frontend Vite   | `3000`          | `http://127.0.0.1:<porta>/__launcher/health` |

Le porte sono preferite, non riservate. La discovery e i tentativi di avvio sono bounded; il launcher non termina processi in base alla sola porta occupata.

Il backend viene avviato con `PORT` impostata sulla porta selezionata e ascolta su `127.0.0.1`. Il frontend viene avviato tramite la CLI Vite locale, con `--host 127.0.0.1`, `--strictPort`, `VITE_BACKEND_TARGET` e `VITE_CDP_URL`.

Vite espone API relative sotto `/api` e le inoltra al `backendTarget` selezionato.

## Risoluzione e riuso dei servizi

### Backend

La risoluzione esegue prima una discovery read-only delle cinque porte candidate, dalla preferita alle quattro successive. Un backend è riusabile soltanto se `/api/health` conferma:

- `ok: true`;
- progetto `tennis-decision-ui`;
- `repositoryIdentity` della working copy corrente;
- `storageIdentity` dello storage corrente;
- `instanceId` non vuoto;
- PID positivo.

Le identity di repository e storage sono hash SHA-256 dei percorsi canonici normalizzati; la health non espone i percorsi locali.

Se nessun candidato è riusabile, il launcher seleziona una porta libera e avvia un solo child alla volta. La readiness deve restituire l'identità attesa e il PID dichiarato deve coincidere con il child avviato. Un avvio fallito viene ripulito tramite il registry owned prima del tentativo successivo.

Un listener estraneo o un backend Tennis Decision UI con repository/storage identity differenti è esterno alla sessione corrente: viene saltato e non viene terminato.

### Frontend

Il frontend viene riusato soltanto se l'endpoint `__launcher/health` restituisce un'identità completa e il suo `backendTarget` coincide con il backend selezionato.

La discovery delle porte occupate precede gli spawn. In assenza di un frontend riusabile, il launcher tenta al massimo cinque avvii su porte libere. Se la CLI Vite locale manca, il bootstrap del frontend fallisce immediatamente senza ulteriori tentativi su altre porte.

### CDP

Il launcher valuta al massimo cinque endpoint loopback, dalla porta `9222` alle quattro successive. Accetta soltanto un `/json/version` con `webSocketDebuggerUrl` locale, coerente con la porta interrogata e con path browser valido.

Un endpoint già valido è `reused`. Se nessun endpoint è valido, il launcher può invocare lo script PowerShell su una porta osservata libera. Chrome e il relativo helper restano esterni: non entrano mai nel registry owned e non vengono terminati dal launcher.

L'esito CDP può essere `ready`, `starting` oppure `unavailable`. CDP non determina la readiness di backend e frontend. La URL risolta, anche vuota, viene passata a Vite tramite `VITE_CDP_URL`; il frontend la normalizza, la conserva nello stato della sessione e la propaga alle richieste applicative che la usano. Il launcher non configura direttamente backend o scraper con questa variabile.

## Authority e stato della sessione

```text
launcher lock
→ autorizza una sola orchestrazione launcher

manifest schema 2
→ descrive lo stato osservato della sessione e dei servizi

owned process registry
→ contiene soltanto i processi avviati dall'invocazione corrente

writer authority backend
→ autorizza un solo backend writer per la stessa storage identity
```

Queste responsabilità sono distinte. Un PID presente nel manifest non dimostra ownership; un lock launcher acquisito non autorizza scritture nello storage backend; un servizio riusato non diventa owned.

Gli artefatti effimeri del launcher vivono in `launcher/.runtime/`:

```text
launcher/.runtime/
├── launcher.lock
├── launcher.lock.guard
└── manifest.json
```

Lock e manifest usano schema 2. Il lock lega `sessionId`, PID e identità del processo launcher. Il guard serializza acquisizione, reclaim e rilascio. Un lock con owner verificato `active` blocca una seconda invocazione; un lock `stale` può essere recuperato; uno stato `unknown` non viene rimosso aggressivamente.

Il manifest registra la sessione e i ruoli `backend`, `frontend` e `cdp`, con stato, endpoint, identity, PID quando applicabile, source, reason e ownership.

Valori principali:

```text
session.status
→ starting | ready | stopping | stopped | failed

service.status
→ pending | starting | ready | failed | unavailable

ownership
→ owned | reused | external | unknown
```

La writer authority vive invece nello storage backend. Il backend la acquisisce prima della recovery e prima di aprire il listener. Se l'acquisizione non riesce o ha esito invalido, il backend non esegue recovery e non entra in ascolto. Se la recovery restituisce un esito fatal, il backend rilascia l'authority e interrompe il bootstrap.

Il launcher non legge, interpreta o ripara commit journal e record della writer authority.

## Readiness, browser ed esito CLI

La sessione diventa `ready` quando backend e frontend sono stati validati. L'apertura del browser avviene dopo la persistenza dello stato ready ed è best-effort: l'esito viene registrato, ma un browser non aperto non provoca il teardown di servizi già pronti.

Il processo launcher restituisce:

| Scenario                                     | Codice   |
| -------------------------------------------- | -------: |
| lock acquisito e sessione esistente riusata  | `0`      |
| sessione avviata e poi arrestata normalmente | `0`      |
| lock non acquisibile perché active o unknown | `2`      |
| backend non risolto                          | `3`      |
| frontend non risolto                         | `4`      |
| eccezione non gestita di bootstrap           | non-zero |

Una failure di scrittura del manifest non viene trasformata in successo silenzioso. Log e reason del launcher sono bounded e sanificati; URL, credenziali, token e percorsi locali vengono redatti dai campi testuali runtime.

## Ownership e shutdown

### Matrice di ownership

| Servizio                                    | Ownership                              | Terminabile dal launcher                    |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------- |
| backend avviato nella sessione              | `owned`                                | sì, tramite il PID/process group registrato |
| frontend avviato nella sessione             | `owned`                                | sì, tramite il PID/process group registrato |
| backend o frontend verificato già esistente | `reused`                               | no                                          |
| listener estraneo                           | esterno/foreign rispetto alla sessione | no                                          |
| Chrome/CDP                                  | `external`, `reused` o `unknown`       | no                                          |

Su Ctrl+C, SIGTERM e, su Windows, SIGBREAK, la prima richiesta di stop avvia un unico percorso protetto di shutdown. Il launcher opera su uno snapshot del registry e tenta di arrestare soltanto le entry che dimostrano ancora la propria registrazione e il proprio PID.

Per ogni processo owned viene inviato prima un segnale pulito. Dopo il grace period, l'escalation può colpire soltanto lo stesso PID/process tree registrato e deve confermarne l'uscita. Non esiste kill per porta.

Per il backend, il segnale pulito attiva il lifecycle backend-owned:

```text
richiesta di chiusura listener
→ avvio stop e drain dei tracker
→ cleanup dei processi Python registrati dal backend
→ attesa del drain tracker
→ attesa della chiusura listener
→ release writer authority soltanto con drain valido
→ terminazione del backend
```

Il timer interno del backend è di 6 secondi; il grace period del launcher è di 8 secondi. Se il drain fallisce o non dimostra zero operazioni attive, la writer authority viene trattenuta. Il timeout forza l'uscita del backend senza autorizzare un release anticipato. Solo dopo il proprio budget il launcher può escalare sul child owned.

Il launcher non cancella history, timeline, journal, conferme Source Identity, dump o cache. Processi reused, listener esterni e Chrome/CDP restano intatti.

## Failure matrix

| Failure                                         | Esito operativo                       | Cleanup                                  |
| ----------------------------------------------- | ------------------------------------- | ---------------------------------------- |
| lock `active` o `unknown`                       | seconda invocazione bloccata          | nessun servizio toccato                  |
| manifest non persistibile                       | bootstrap fallito                     | soltanto risorse owned                   |
| backend non avviabile o identity/PID non validi | startup backend fallito               | child owned ripulito                     |
| frontend non avviabile o identity non valida    | sessione non ready                    | risorse owned arrestate nel `finally`    |
| CLI Vite locale assente                         | failure frontend immediata            | nessun ulteriore spawn frontend          |
| browser non aperto                              | servizi restano ready                 | nessun teardown                          |
| CDP non disponibile                             | stato `unavailable` e URL vuota       | Chrome/listener esterni non terminati    |
| shutdown parzialmente fallito                   | sessione `failed` quando persistibile | nessuna estensione ai processi non owned |

## Diagnostica rapida

| Sintomo                             | Controllo                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Launcher già attivo                 | Verificare lo stato bounded del lock; non rimuoverlo se `active` o `unknown`.                             |
| Backend non riusato                 | Confrontare `repositoryIdentity` e `storageIdentity` della health con la working copy corrente.           |
| Frontend non riusato                | Verificare identità completa e `backendTarget`.                                                           |
| Backend fallisce prima del listener | Verificare gli esiti bounded di writer authority e recovery; non cancellare manualmente i record.         |
| Frontend non parte                  | Verificare dipendenze e CLI Vite locale.                                                                  |
| Chiamate `/api` falliscono          | Verificare `VITE_BACKEND_TARGET` e il proxy Vite.                                                         |
| Browser non si apre                 | Aprire manualmente l'URL frontend registrato nei messaggi o nel manifest.                                 |
| CDP `starting` o `unavailable`      | Verificare gli endpoint bounded senza terminare Chrome o listener esterni.                                |
| API segnala `persistence_integrity` | Trattare lo stato secondo gli owner storage/API; non come autorizzazione al riavvio o alla cancellazione. |

## Verifica

La verifica ordinaria usa le suite pertinenti. I test launcher e server sono registrati nel manifest di validation; il test della writer authority viene eseguito direttamente:

```text
python -m unittest -v launcher.tests.test_launcher
node backend/src/server.test.mjs
node backend/src/runtime/matchHistoryWriterAuthority.test.mjs
```

La suite launcher copre, fra gli altri, lock e manifest schema 2, riuso working-copy-aware, discovery-before-spawn, contratto CLI, browser best-effort, propagazione CDP, identity frontend/backend, shutdown owned-only e redazione dei log. I test backend coprono bootstrap, recovery prima del listener, writer authority e shutdown.

I test offline non equivalgono a un collaudo live con browser reale, porte realmente occupate e più working copy concorrenti.

Scenari operativi minimi:

```text
avvio normale
→ backend autorizzato e ready
→ frontend coerente e ready
→ manifest ready

backend valido già attivo
→ identity repository/storage coerenti
→ reuse senza nuovo backend

listener estraneo su porta preferita
→ fallback bounded
→ listener non terminato

CDP assente
→ stato esplicito
→ backend e frontend ancora avviabili

Ctrl+C
→ solo processi owned arrestati
→ backend dispone del proprio budget di shutdown
→ servizi riusati e Chrome preservati
```

## Confini

Questo runbook non ridefinisce tracking, scraper, Source Identity, health applicativa, commit journal, recovery, retention o contratti API. Spiega soltanto come questi sottosistemi incontrano il lifecycle locale.

Non autorizza kill per porta, cancellazione di sidecar, riuso fra working copy differenti o interventi manuali sulla writer authority.

## Riferimenti implementativi

| Responsabilità                           | Implementazione                                      |
| ---------------------------------------- | ---------------------------------------------------- |
| entry point                              | `avvio.py`                                           |
| orchestrazione                           | `launcher/app.py`                                    |
| configurazione porte e percorsi          | `launcher/config.py`                                 |
| lock e manifest                          | `launcher/session.py`                                |
| discovery, startup, ownership e shutdown | `launcher/services.py`                               |
| probe e logging bounded                  | `launcher/system.py`                                 |
| bootstrap e shutdown backend             | `backend/src/server.js`                              |
| writer authority                         | `backend/src/runtime/matchHistoryWriterAuthority.js` |
| identity e proxy frontend                | `frontend/vite.config.js`                            |
| stato CDP frontend                       | `frontend/src/hooks/useAnalysisSessionState.js`      |

## Documenti collegati

- [API Runtime Health](../api/06-runtime-health.md)
- [Entry point e runtime Python](../modules/python/01-entrypoints-and-runtime.md)
- [Tracking live](../modules/sofa/01-live-tracking.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
- [Writer authority](../modules/storage/05-writer-authority.md)
- [Controllo tracking live](./02-live-tracking-control.md)
- [Diagnostica Betfair](./03-betfair-diagnostics.md)
- [Validazione e rollback](./04-validation-and-rollback.md)
- [Retention e cleanup](./05-retention-and-cleanup.md)
- [Repository map](../reference/01-repository-map.md)

## Quando leggerlo

Consultare questo runbook prima di:

- avviare `python avvio.py`;
- modificare launcher, porte, proxy Vite, startup o shutdown;
- diagnosticare il riuso di CDP, backend o frontend;
- distinguere launcher lock, process ownership e writer authority;
- decidere se un processo locale può essere terminato dal launcher.
