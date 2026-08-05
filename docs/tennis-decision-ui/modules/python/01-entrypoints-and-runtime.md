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
* JSON prodotto su stdout;
* significato delle opzioni browser;
* percorsi invocati dal backend Node;
* comportamento Ctrl+C del launcher;
* Chrome CDP aperto dopo lo shutdown normale.

I log diagnostici degli scraper devono usare `stderr` e devono essere redatti prima della scrittura. `stdout` deve restare leggibile come JSON dal backend.

Il backend Node non deve registrare stdout raw, stderr raw, argomenti completi dello spawn, URL complete o messaggi raw del child process quando possono contenere dati sensibili.

Sono ammessi log strutturali non sensibili, come modalità, conteggi, PID, durata, byte stdout/stderr, exit code, signal code e reason tecniche.

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

## Stato

Validato live, inclusa la correzione finale del launcher:

```txt
avvio canonico
seconda invocazione launcher bloccata dal lock attivo
shutdown Ctrl+C
terminazione backend/frontend owned
preservazione CDP reused
riavvio pulito
```

Il collaudo finale del launcher ha confermato che la seconda invocazione termina senza `session_reuse`, `browser_open` o nuovi servizi e lascia invariati lock, manifest e identità della prima sessione.

Il backend Node implementa inoltre una writer authority separata dal launcher lock. I test automatici IMPL-015 sono passati, ma non è stato eseguito un collaudo manuale con due backend reali concorrenti.

Restano da validare live:

```txt
fallback backend/frontend con porte occupate da processi esterni
CDP reale alternativo
force-kill realmente necessario
due backend reali concorrenti sulla stessa storage identity
```

## Launcher

```txt
launcher/
├── app.py
├── config.py
├── services.py
├── session.py
├── system.py
└── tests/
    └── test_launcher.py
```

| File                     | Responsabilità                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `app.py`                 | Sequenza di avvio, riuso sessione, lock e gestione Ctrl+C.                                |
| `config.py`              | Root progetto, script PowerShell, porte preferite e percorsi runtime.                     |
| `services.py`            | Risoluzione CDP, backend e frontend, apertura browser e shutdown dei soli processi owned. |
| `session.py`             | Lock e manifest runtime atomico, verifica riuso e registrazione ownership.                |
| `system.py`              | Logging, probe porte, verifiche HTTP e attese limitate.                                   |
| `tests/test_launcher.py` | Test deterministici del lifecycle launcher.                                               |

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

Quando non trova un endpoint valido, può avviare Chrome dedicato su una porta libera e passa subito al frontend l'URL candidato.

Il CDP non blocca l'avvio di backend e frontend.

Un CDP non disponibile resta vuoto; non viene convertito automaticamente in:

```txt
http://127.0.0.1:9222
```

Chrome/CDP esterno non viene chiuso né registrato come processo owned.

## Manifest e ownership

Il manifest runtime registra la sessione corrente, gli URL effettivi e i PID dei servizi quando disponibili e verificati. Solo i processi con ownership `owned` sono stati avviati dalla sessione corrente e possono essere terminati dal launcher. Un servizio `reused` può avere un PID verificato nel manifest, ma non diventa owned e non viene terminato dal launcher.

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
python -m unittest launcher.tests.test_launcher
```

Poi:

```powershell
python -c "from launcher.app import main; from scrapers.sofa.cli import main as sofa_main; from scrapers.betfair.cli import main as betfair_main; print('import OK')"
```

Infine, quando necessario:

```powershell
python .\avvio.py
```

La writer authority è verificata dai test Node owner, non dai test launcher:

```txt
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.test.mjs
backend/src/sofa/matchTracker.test.mjs
```

## Documenti collegati

* [Runtime locale](../../operations/01-local-runtime.md)
* [Commit journal e recovery](../storage/02-commit-journal-and-recovery.md)
* [Scraper SofaScore](./02-sofascore-scraper.md)
* [Scraper Betfair](./03-betfair-scraper.md)
* [Lifecycle scraper Betfair](../betfair/01-scraper-lifecycle.md)
