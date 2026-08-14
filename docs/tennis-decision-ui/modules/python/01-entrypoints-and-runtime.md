# Entry point e runtime Python

## Scopo

Questo documento definisce i contratti pubblici dei wrapper Python e il launcher locale.

Usarlo prima di modificare file root, argomenti CLI, avvio servizi o shutdown.

## Wrapper compatibili

```txt
avvio.py
scraper.py
betfair_scraper.py
```

| Wrapper              | Modulo reale           | Ruolo                               |
| -------------------- | ---------------------- | ----------------------------------- |
| `avvio.py`           | `launcher.app`         | Avvio coordinato dello stack locale |
| `scraper.py`         | `scrapers.sofa.cli`    | Scraper SofaScore asincrono         |
| `betfair_scraper.py` | `scrapers.betfair.cli` | Scraper Betfair                     |

I wrapper devono restare sottili.

Non inserire logica di scraping, parsing browser o regole di dominio nei file root.

## Contratti da preservare

Durante modifiche Python non cambiare senza una migrazione esplicita:

* nomi e percorsi dei tre wrapper root;
* argomenti CLI ricevuti dagli scraper;
* JSON prodotto su stdout nelle modalità scrape che usano stdout come result channel;
* significato delle opzioni browser;
* percorsi invocati dal backend Node;
* comportamento Ctrl+C del launcher;
* Chrome CDP aperto dopo lo shutdown normale.

I contratti dipendono dalla modalità:

```txt
SofaScore scrape
→ stdout contiene il risultato JSON

Betfair scrape
→ stdout contiene il risultato JSON

Betfair login-only
→ processo di lifecycle
→ nessun JSON finale richiesto

input SofaScore mancante o non valido
→ errore JSON su stdout
→ exit code non-zero

errore di parsing o validazione CLI Betfair
→ exit code non-zero
→ diagnostica su stderr
```

I log diagnostici degli scraper devono usare `stderr`, essere bounded e redatti prima della scrittura. I logger Betfair e SofaScore applicano la stessa redazione bounded; i failure payload pubblici preferiscono code e messaggi statici.

Il backend Node non deve registrare stdout raw, stderr raw, argomenti completi dello spawn, URL complete o messaggi raw del child process quando possono contenere dati sensibili.

Sono ammessi log strutturali non sensibili, come modalità, conteggi, PID, durata, byte stdout/stderr, exit code, signal code e reason tecniche.

Il consumer Node SofaScore limita stdout a 2 MiB. Un overflow azzera il buffer, restituisce `scraper_output_too_large` e richiede la terminazione del solo child Python owned; il buffer parziale non viene interpretato come JSON.

## Chiamanti principali

```txt
backend/src/sofa/directFetch.js
→ scraper.py

backend/src/sofa/betfair/scraperLifecycle/runner.js
→ betfair_scraper.py

backend/src/routes/betfair.js
→ openBetfairLoginWindow(...)
```

Il relativo helper possiede l’invocazione di `betfair_scraper.py`.

Il backend Node non deve importare o invocare direttamente moduli interni di `scrapers/`.

## Launcher

```txt
launcher/
├── app.py
├── config.py
├── services.py
├── session.py
├── system.py
└── tests/
    ├── test_launcher.py
    └── test_runtime_hardening.py
```

| File                     | Responsabilità                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `app.py`                 | Sequenza di avvio, riuso sessione, lock e gestione Ctrl+C.                                |
| `config.py`              | Root progetto, helper CDP, porte preferite e percorsi runtime.                            |
| `services.py`            | Risoluzione CDP, backend e frontend, apertura browser e shutdown dei soli processi owned. |
| `session.py`             | Lock e manifest runtime atomico, verifica riuso e registrazione ownership.                |
| `system.py`              | Logging, probe porte, verifiche HTTP e attese limitate.                                   |
| `tests/test_launcher.py` | Test deterministici del lifecycle launcher.                                               |
| `tests/test_runtime_hardening.py` | Test mirati dei contratti runtime e dell'hardening.                              |

`system.py` non termina processi in base alla sola porta.

## Ownership e autorità distinte

```txt
launcher lock
→ appartiene al launcher Python
→ impedisce orchestratori launcher concorrenti
→ governa ownership e riuso della sessione locale

writer authority
→ appartiene al bootstrap backend Node
→ impedisce backend writer concorrenti sulla stessa storage identity
→ viene acquisita dentro startServer()

backend process registry
→ possiede esclusivamente i figli Python registrati

wrapper Python
→ entrypoint compatibili
```

Il launcher non mantiene un registry concorrente degli scraper e non possiede il record `.writer_authority`.

Il launcher:

- non crea record writer authority;
- non rimuove record writer authority;
- non recupera record writer authority;
- non interpreta gli stati `active`, `unknown`, `reclaimed` o `already_owned`.

Tutti gli avvii backend, incluso quello effettuato dal launcher, convergono su `startServer()` e rispettano la stessa writer authority.

## Lock e riuso della sessione

```txt
lock attivo o non verificabile
→ seconda invocazione launcher bloccata
→ nessun session_reuse
→ nessun browser_open

lock assente o positivamente stale
+ manifest e servizi riusabili
→ lock acquisito o reclaimed
→ session_reuse
→ browser_open sul frontend esistente
→ rilascio del lock acquisito dalla nuova invocazione
```

Il launcher lock non dimostra l'ownership della persistenza. Un backend avviato manualmente su un'altra porta viene comunque sottoposto alla writer authority Node.

## Sequenza runtime

```txt
python avvio.py
→ launcher lock
→ eventuale verifica di una sessione riusabile
→ manifest runtime iniziale
→ risoluzione CDP
→ risoluzione backend
→ backend startServer()
   → acquire writer authority
   → recovery
   → listener readiness
   → shutdown registrar
→ risoluzione frontend
→ manifest pronto
→ apertura browser
```

Il launcher riusa una sessione soltanto quando backend, identità backend e frontend risultano realmente raggiungibili.

Le porte preferite sono:

| Servizio        | Porta preferita |
| --------------- | --------------- |
| Chrome CDP      | `9222`          |
| Backend Express | `3001`          |
| Frontend Vite   | `3000`          |

Quando una porta preferita è occupata da un processo non riconosciuto, il launcher cerca una porta alternativa senza chiudere processi esterni.

Il backend viene riusato soltanto dopo verifica health e identità Tennis Decision UI.

Il frontend viene avviato direttamente tramite Node e CLI Vite locale, con bind e readiness su:

```txt
127.0.0.1
```

Anche il backend canonico usa un bind esplicito su `127.0.0.1`. Il probe health loopback e il bind del listener sono quindi due controlli distinti ma coerenti.

Il launcher avvia direttamente `node server.js`; non usa `BACKEND_SCRIPT`. 

`scripts/start-backend-dev.ps1` resta un helper di sviluppo manuale e non una dipendenza del lifecycle launcher.

Il launcher usa l'URL frontend effettivamente scelto nel manifest e per aprire il browser.

## Percorsi runtime collegati

```txt
scrapers/betfair/cdp_url.py
backend/src/runtime/pythonProcessRegistry.js
backend/src/runtime/runtimeLogger.js
backend/src/runtime/matchHistoryWriterAuthority.js
```

Il documento collega questi moduli senza assorbirne i contratti completi. Il contratto owner della writer authority è descritto in [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md).

## CDP

Il launcher riusa un endpoint CDP valido esistente.

La discovery considera al massimo cinque porte candidate, dalla porta preferita fino alla quarta porta successiva.

Quando non trova un endpoint valido, può richiedere all'helper l'avvio di Chrome dedicato su una porta libera e passare al frontend l'URL candidato.

Il CDP non blocca l'avvio di backend e frontend.

Gli stati sono distinti:

```txt
ready
→ endpoint verificato

starting
→ helper avviato, URL candidata non ancora verificata ready

unavailable
→ nessun endpoint utilizzabile, URL vuota
```

Il launcher esegue fino a tre probe bounded dopo `launch_requested`. Se uno riesce, registra `ready`; altrimenti conserva `starting` con URL candidata. 

`starting` non deve essere presentato come disponibilità verificata.

Un CDP `unavailable` resta vuoto; non viene convertito automaticamente in:

```txt
http://127.0.0.1:9222
```

Chrome/CDP esterno non viene chiuso né registrato come processo owned.

## Manifest e ownership

Il manifest runtime registra la sessione corrente, gli URL effettivi e i PID dei servizi quando disponibili e verificati. Solo i processi con ownership `owned` sono stati avviati dalla sessione corrente e possono essere terminati dal launcher. Un servizio `reused` può avere un PID verificato nel manifest, ma non diventa owned e non viene terminato dal launcher.

La scrittura usa un file temporaneo nella stessa directory e replace atomico. 

`write_manifest()` ripulisce il temporaneo quando possibile e propaga gli errori I/O; `_safe_write_manifest()` li converte in un risultato booleano soltanto nei percorsi di cleanup che richiedono una degradazione bounded.

Il riuso richiede:

```txt
backend health valido
→ project Tennis Decision UI
→ instanceId coerente
→ frontend raggiungibile
```

I processi riusati non diventano owned.

Il manifest non rappresenta la writer authority e non deve contenere o interpretare il record `.writer_authority`.

## Shutdown

Con Ctrl+C, il launcher tenta prima un arresto pulito dei soli processi owned.

Il backend, quando riceve il segnale, esegue autonomamente:

```txt
server.close richiesto; la chiusura del listener procede in parallelo
→ terminal tracker barrier
→ stop tracker e scheduler
→ tracker drain avviato
→ cleanup processi Python
→ completamento del tracker drain fino al registro vuoto
→ attesa/verifica della chiusura del listener
→ release writer authority
→ exit
```

Dopo un'attesa limitata, il launcher può usare il fallback sul process tree soltanto per il PID owned registrato.

La configurazione assegna al launcher 8 secondi prima dell'escalation, oltre il budget interno backend di 6 secondi. 

Il parent non anticipa quindi il force budget del child; oltre la deadline parent resta ammesso il fallback sul solo PID owned.

Non termina:

```txt
processi riusati
Chrome/CDP
processi esterni che occupano una porta preferita
```

Un force timeout o una terminazione brutale possono lasciare il record authority presente. Il launcher non lo cancella: il backend successivo lo classifica e può recuperarlo soltanto quando l'owner è positivamente morto.

Non usare cleanup basati su:

```txt
netstat
Stop-Process
taskkill per porta
```

## Verifica

Dalla root:

```powershell
python -m py_compile .\avvio.py .\scraper.py .\betfair_scraper.py
python -m compileall launcher scrapers
python -m unittest launcher.tests.test_launcher launcher.tests.test_runtime_hardening
```

Poi:

```powershell
python -c "from launcher.app import main; from scrapers.sofa.cli import main as sofa_main; from scrapers.betfair.cli import main as betfair_main; print('import OK')"
```

La writer authority è verificata dai test Node owner, non dai test launcher:

```txt
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.test.mjs
backend/src/sofa/matchTracker.test.mjs
```

### Matrice di verifica

| Contratto                                                                      | Implementazione primaria                        | Verifica mirata                                                                                                                     |
| ------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Wrapper root sottili e importabili                                             | `avvio.py`, `scraper.py`, `betfair_scraper.py`  | `py_compile`, `compileall`, import smoke                                                                                            |
| SofaScore scrape: JSON su stdout; input non valido: JSON e codice non-zero     | `scrapers/sofa/cli.py`                          | `launcher/tests/test_runtime_hardening.py`                                                                                          |
| Betfair scrape e login-only distinti                                           | `scrapers/betfair/cli.py`                       | login-only: `launcher/tests/test_runtime_hardening.py`; lifecycle login: `backend/src/routes/betfair/loginWindowLifecycle.test.mjs` |
| Diagnostica SofaScore bounded e redatta                                        | `scrapers/sofa/config.py`                       | `launcher/tests/test_runtime_hardening.py`                                                                                          |
| Limite stdout SofaScore e terminazione del child owned                         | `backend/src/sofa/directFetch.js`               | `backend/src/sofa/directFetch.test.mjs`                                                                                             |
| Lock, manifest atomico, riuso e ownership launcher                             | `launcher/session.py`, `launcher/app.py`        | `launcher/tests/test_launcher.py`, `launcher/tests/test_runtime_hardening.py`                                                       |
| CDP delayed-ready e stato `starting`                                           | `launcher/services.py`                          | `launcher/tests/test_launcher.py`, `launcher/tests/test_runtime_hardening.py`                                                       |
| Avvio diretto backend/frontend e bind locale                                   | `launcher/services.py`, `backend/src/server.js` | `launcher/tests/test_launcher.py`, `backend/src/server.test.mjs`                                                                    |
| Gerarchia dei timeout e shutdown dei soli processi owned                       | `launcher/services.py`, `backend/src/server.js` | `launcher/tests/test_launcher.py`, `launcher/tests/test_runtime_hardening.py`, `backend/src/server.test.mjs`                        |
| Registry dei figli Python separato dal launcher                                | `backend/src/runtime/pythonProcessRegistry.js`  | `backend/src/runtime/pythonProcessRegistry.test.mjs`, `backend/src/server.test.mjs`                                                 |
| Writer authority acquisita prima di recovery/listen e rilasciata dopo il drain | `backend/src/server.js`                         | `backend/src/runtime/matchHistoryWriterAuthority.test.mjs`, `backend/src/server.test.mjs`, `backend/src/sofa/matchTracker.test.mjs` |

Le prove manuali di avvio, riuso, shutdown e fallback appartengono al runbook operativo e ai documenti di validation, non a questo owner tecnico.

## Confini con il runbook operativo

Questo documento è l'owner tecnico di wrapper, modalità CLI, launcher, manifest e ownership dei processi. 

[Runtime locale](../../operations/01-local-runtime.md) è l'owner delle istruzioni operative, dei comandi per l'utente e della diagnosi di avvio. 

Le evidenze live appartengono ai documenti di validation; la writer authority appartiene al modulo storage collegato sotto.

## Documenti collegati

* [Runtime locale](../../operations/01-local-runtime.md)
* [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
* [Scraper SofaScore](./02-sofascore-scraper.md)
* [Scraper Betfair](./03-betfair-scraper.md)
* [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
