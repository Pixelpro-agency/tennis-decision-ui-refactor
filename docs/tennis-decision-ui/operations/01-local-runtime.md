# Runtime locale

## Scopo

`avvio.py` coordina CDP, backend Express e frontend Vite. Il launcher non possiede Chrome, non modifica dati canonici e non esegue recovery della persistenza.

## Stato

Il launcher usa lock e manifest schema 2, riuso working-copy-aware, discovery bounded e ownership esplicita. La writer authority resta backend-owned.

## Responsabilità operative

Il runbook descrive il percorso completo dall'avvio alla terminazione: coordinamento launcher, risoluzione dei servizi, verifica delle identity, readiness, handoff al browser e shutdown owned-only. I dettagli implementativi delle primitive Python restano nell'owner runtime Python.

## Sequenza di avvio

```text
lettura del manifest precedente
→ acquisizione o reclaim conservativo del launcher lock
→ eventuale riuso della sessione verificata
→ risoluzione CDP bounded
→ discovery read-only dei backend candidati
→ riuso oppure avvio di un solo backend
→ risoluzione frontend coerente con backendTarget
→ manifest ready
→ apertura browser best-effort
```

Il fast path di riuso avviene dopo il lock. Nessuna sessione viene riusata sulla sola presenza del manifest.

## Authority distinte

```text
launcher lock
→ una sola orchestrazione launcher attiva

manifest schema 2
→ stato osservato della sessione e dei servizi

owned process registry
→ soli processi avviati da questa invocazione

writer authority backend
→ un solo writer per storage identity
```

Nessuna di queste authority sostituisce le altre. In particolare, PID presente nel manifest non implica ownership e launcher lock acquisito non autorizza scritture in `backend/match_history/`.

## Esito CLI

Il processo termina con `0` soltanto quando la sessione è pronta, è stata riusata correttamente oppure è terminata normalmente. Lock bloccato, backend/frontend falliti, manifest non persistibile ed eccezioni di bootstrap producono un exit code non-zero.

I failure restituiscono reason bounded. Stack, path locali, token e payload non fanno parte dell'esito pubblico del launcher.

## Identità e riuso backend

`/api/health` espone `project`, identità di istanza, PID, timestamp e due identity SHA-256 bounded: repository e storage. Gli hash derivano dai percorsi canonici ma non espongono i percorsi locali.

Il launcher riusa un backend soltanto quando progetto, repository identity e storage identity corrispondono alla working copy corrente. Un backend Tennis Decision UI appartenente a un'altra copia viene trattato come processo esterno e non viene terminato.

La risoluzione esegue prima una discovery read-only bounded di tutte le cinque porte candidate. Solo se non trova un backend riusabile sceglie una porta libera e avvia un child. Questo evita spawn inutili davanti a un backend valido su porta alternativa.

Un servizio con progetto corretto ma identity repository o storage differente è `foreign` rispetto alla sessione corrente. La porta può essere saltata, ma il processo non viene terminato. Un child che termina durante readiness produce failure immediata senza attendere inutilmente il timeout massimo.

Il frontend viene riusato soltanto se la sua identity è completa e `backendTarget` coincide con il backend selezionato.

## Lock, guard e manifest

Il launcher lock persistente classifica l'owner come active, stale o unknown usando PID, start fingerprint ed executable quando disponibile. `unknown` blocca il reclaim aggressivo; un PID riciclato non dimostra ownership.

La coordination guard serializza acquisizione, reclaim e rilascio del lock, ma non è una writer authority applicativa. Il manifest schema 2 descrive sessione e servizi osservati; una failure di scrittura o replace è un errore di bootstrap, non un successo silenzioso.

Il manifest registra PID dei servizi quando disponibili e verificati. Solo i processi `owned` sono stati avviati dalla sessione corrente e possono essere terminati dal launcher. Un servizio `reused` può avere PID verificato senza diventare owned.

## CDP

Il launcher cerca al massimo cinque endpoint loopback. Chrome/CDP resta `external` o `reused`, mai `owned`.

La URL CDP scelta entra nel frontend tramite `VITE_CDP_URL`; il frontend la conserva nello stato della sessione e la invia alle API che la consumano. Il launcher non configura direttamente scraper o backend con `VITE_CDP_URL`. Il riuso di una sessione esistente non costituisce una nuova validazione CDP.

Uno stato CDP provvisorio resta esplicito e non viene presentato come readiness definitiva. La provenienza effettiva segue launcher, ambiente Vite, stato frontend confermato, request backend e scraper.

## Readiness e browser

Backend e frontend validati determinano la readiness. `webbrowser.open()` è una convenience best-effort: successo o failure vengono registrati in forma bounded, ma un browser non aperto non rende indisponibili servizi già pronti.

L'URL frontend resta disponibile nel manifest e nei messaggi operativi, così l'operatore può aprirlo manualmente.

## Ownership e shutdown

Solo backend e frontend avviati dalla sessione sono `owned`. Processi reused, listener esterni e Chrome non vengono terminati.

Su Ctrl+C il launcher ferma soltanto i process tree owned. Il backend drena tracker e scheduler prima di rilasciare la [writer authority](../modules/storage/05-writer-authority.md). Un drain fallito o force timeout non autorizza release anticipato.

Il budget del parent deve lasciare al backend il tempo necessario per drain, cleanup Python, chiusura listener e rilascio dell'authority prima dell'escalation. La force termination resta l'ultima fase ed è indirizzata al PID owned, mai alla porta.

Launcher lock, manifest e writer authority sono distinti. Gli artefatti launcher vivono in `launcher/.runtime/`; writer authority e commit journal appartengono allo storage backend.

```text
Ctrl+C
→ snapshot del registry owned
→ stop di ciascun entry registrato nell'ordine del registry
   ├── frontend: terminazione del process tree owned
   └── backend: segnale pulito
       → drain tracker e scheduler
       → cleanup child Python posseduti dal backend
       → chiusura listener
       → release writer authority
→ escalation launcher solo dopo il budget previsto
```

```text
reused / external / foreign
→ mai inserito nel registry owned
→ mai terminato dal launcher
```

## Riferimenti implementativi

| Responsabilità          | Implementazione                                      |
| ----------------------- | ---------------------------------------------------- |
| entry point compatibile | `avvio.py`                                           |
| orchestrazione          | `launcher/app.py`                                    |
| lock e manifest         | moduli sotto `launcher/`                             |
| probe/identity backend  | health backend e client launcher                     |
| frontend identity       | endpoint locale Vite                                 |
| writer authority        | `backend/src/runtime/matchHistoryWriterAuthority.js` |

### Matrice di ownership

| Servizio                        | Stato possibile       | Terminabile dal launcher                |
| ------------------------------- | --------------------- | --------------------------------------- |
| backend avviato nella sessione  | `owned`               | sì, tramite PID/process tree registrato |
| frontend avviato nella sessione | `owned`               | sì                                      |
| backend/frontend esistente      | `reused`              | no                                      |
| listener estraneo               | `foreign`             | no                                      |
| Chrome/CDP                      | `external` o `reused` | no                                      |

### Risoluzione backend

```text
probe bounded delle cinque candidate
→ health Tennis Decision UI?
→ repositoryIdentity attesa?
→ storageIdentity attesa?
   sì → reuse
   no → foreign, non terminare

nessun reusable
→ prima porta libera
→ spawn di un solo child
→ readiness o early-exit
```

### Failure matrix

| Failure                   | Esito                   | Cleanup                                 |
| ------------------------- | ----------------------- | --------------------------------------- |
| lock active/unknown       | blocked, exit non-zero  | nessun processo esterno toccato         |
| manifest non persistibile | bootstrap failure       | solo risorse owned                      |
| backend early exit        | startup failure bounded | registry owned ripulito                 |
| frontend failure          | sessione non ready      | backend owned fermato secondo lifecycle |
| browser open false        | servizi restano ready   | nessun teardown                         |
| CDP unavailable           | stato esplicito         | Chrome non terminato                    |

## Verifica

Il contratto corrente è supportato dai test launcher/backend. Gli esiti della run del 2026-08-10 sono registrati in [Local runtime hardening](../../validations/local-runtime-hardening-2026-08-10.md). L'artifact è evidenza offline e non equivale a un collaudo live completo con browser e due working copy reali.

La matrice copre working-copy identity, discovery-before-spawn, exit code, browser best-effort, CDP provenance, frontend binding e non terminazione dei processi non owned.

```powershell
python -m unittest launcher.tests.test_launcher -q
python -m unittest launcher.tests.test_runtime_hardening -q
node backend/src/server.test.mjs
node backend/src/runtime/matchHistoryWriterAuthority.test.mjs
```

## Diagnostica rapida

| Sintomo              | Controllo                                                                          |
| -------------------- | ---------------------------------------------------------------------------------- |
| Launcher già attivo  | Verificare lo stato bounded del launcher lock; non rimuoverlo se active o unknown. |
| Backend non riusato  | Confrontare repository/storage identity della health con la working copy corrente. |
| Frontend non riusato | Verificare `backendTarget` e identity endpoint Vite.                               |
| Browser non aperto   | Usare l'URL frontend del manifest; i servizi possono essere comunque ready.        |
| CDP unavailable      | Verificare gli endpoint bounded senza terminare Chrome o listener esterni.         |

## Confini

Il runbook non ridefinisce scraper, tracking, journal, retention o API. Non autorizza kill per porta, cancellazione di sidecar o riuso fra working copy diverse.

## Documenti collegati

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
- [Validazione local runtime](../../validations/local-runtime-hardening-2026-08-10.md)
