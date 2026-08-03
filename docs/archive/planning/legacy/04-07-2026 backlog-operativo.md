# 1. COMPLETATO Sicurezza, segreti, log e dump diagnostici

## Stato di validazione

**Implementato e verificato offline.**

La protezione dei segreti e la redazione diagnostica Betfair sono state validate con test Python, test del lifecycle Node/Python e probe locali con marker fittizi.

Non sono stati eseguiti scraper live, chiamate Betfair, apertura Chrome/CDP o analisi di dump, cache, cookie, token o credenziali reali. Una futura verifica controllata su diagnostica runtime reale resta separata e deve avvenire senza esporre dati sensibili.

## Intervento eseguito

Sono state completate esclusivamente correzioni non funzionali relative alla protezione dei segreti, alla redazione dei dati diagnostici e alla riduzione dell’esposizione di output raw tra scraper Python e backend Node.

Sono stati applicati:

* redazione automatica nei log Python di URL con query sensibili, token Bearer, cookie, header di autorizzazione e chiavi API;
* redazione di metadata, header, body JSON, body testuali, errori e summary prodotti dalla network capture Betfair;
* rimozione del body remoto dai messaggi di errore HTTP dello scraper;
* spostamento della chiave applicativa Betfair dal sorgente Python alla configurazione locale `.env`;
* risoluzione della chiave con precedenza: variabile ambiente valida, poi `.env`, altrimenti errore statico non sensibile;
* `.gitignore` minimo per `.env` e file `.env.*`;
* estensione della redazione per gli alias applicativi Betfair:

  ```text
  appKey
  appkey
  app_key
  app-key
  APP_KEY
  BETFAIR_APP_KEY
  x-application
  x-application-key
  ```
* redazione di testo libero con separatori `=` e `:`, inclusi casi come:

  ```text
  APP_KEY=<valore>
  APP_KEY: <valore>
  token: <valore>
  x-application: <valore>
  ```
* redazione di JSON serializzato o non parseabile con chiavi sensibili, mantenendo parseabile il JSON quando l’input originale lo era;
* redazione dei campi diagnostici restituiti da `scrape.py`, inclusi:

  ```text
  api_error
  error
  diagnostics
  graph_diagnostics.failures[].url
  graph_diagnostics.failures[].text
  ```
* redazione dei risultati cache Betfair sia prima della scrittura sia dopo la lettura, in modo da proteggere anche cache legacy già esistenti senza riscriverle o migrarle;
* rimozione dai log e dagli errori del bridge Node/Python di URL completi, key derivate da URL, argomenti completi dello spawn, stdout raw, stderr raw e messaggi raw del child process;
* mantenimento nel bridge Node/Python di soli log strutturali non sensibili, inclusi modalità, numero Graph URL, stato network capture, PID, durata, byte stdout/stderr, exit code, signal code e reason tecnica;
* test automatici per redazione di log, dump, URL, header, payload JSON, testo libero, cache nuove e legacy, errori HTTP, configurazione, lifecycle Node/Python e propagazione sicura degli errori.

## Invarianti preservati

Non sono stati modificati:

* scraping Betfair e flusso funzionale di acquisizione;
* URL o parametri API funzionali;
* modalità CDP o persistent;
* flag e argomenti CLI;
* TTL, path, cache key, formato JSON e logica hit/miss della cache;
* estrazione ladder e parsing delle quote;
* attivazione e condizioni della network capture;
* timeout, deduplicazione, terminazione SIGTERM/SIGKILL e lifecycle funzionale degli scraper figli;
* tracking;
* route backend e contratti HTTP;
* frontend;
* timeline;
* history;
* Source Identity;
* logica di mercato, ladder, quote, Money Flow o graphHealth;
* dati canonici, cache reali, dump reali e profili browser.

## Verifica effettuata

Sono stati eseguiti con esito positivo:

```text
py -3 -m py_compile
  scrapers/betfair/diagnostic_redaction.py
  scrapers/betfair/scrape.py
  scrapers/betfair/cache.py
→ completato

py -3 -m unittest -v
  scrapers.betfair.config_test
  scrapers.betfair.diagnostic_redaction_test
  scrapers.betfair.cache_test
→ 23/23 test superati

node --check backend/src/sofa/betfair/scraperLifecycle/runner.js
→ completato

node --check backend/src/sofa/betfairFetch.js
→ completato

node backend/src/sofa/betfair/scraperLifecycle.test.mjs
→ 55 asserzioni passate, 0 fallite
```

Sono stati inoltre verificati tramite probe locale, con marker fittizi:

```text
appKey URL
app_key URL
APP_KEY con =
APP_KEY con :
token:
JSON token
JSON x-application
```

Tutti i casi hanno prodotto redazione corretta senza leak. I JSON redatti sono rimasti parseabili e hanno preservato i campi business non sensibili.

## Stato finale

La Task 1 è conclusa.

La redazione diagnostica ora copre sia i percorsi originari di log, dump e configurazione, sia i percorsi aggiuntivi individuati durante l’audit: output dello scraper, cache legacy e bridge Node/Python.

## Escluso da questa task

Retention, limiti di dimensione, limiti temporali, classificazione degli artefatti rigenerabili, cleanup, dry-run, report di spazio recuperato e protezione dal cleanup di timeline, history e conferme restano nella Task 3.

----------------------------------------------------------------------------------------------------------------

# 2. Launcher, porte, Chrome, processi owned e chiusura pulita

## Stato attuale

Il launcher locale avvia oppure riusa i servizi necessari per lavorare sul progetto:

```txt
Chrome/CDP
→ backend
→ frontend Vite
→ browser applicativo
```

Il percorso standard di avvio è già registrato come funzionante.

Restano però da verificare in condizioni reali i casi più delicati:

* porta `3000`, `3001` o `9222` già occupata;
* endpoint backend o frontend disponibile su una porta alternativa;
* endpoint Chrome DevTools Protocol disponibile su una porta diversa da `9222`;
* doppio avvio ravvicinato;
* chiusura con `Ctrl+C`;
* terminazione tramite `SIGINT` o `SIGTERM`;
* servizi già avviati da una sessione precedente;
* servizi avviati manualmente o da un processo esterno;
* lock o manifest rimasti dopo un arresto anomalo;
* endpoint CDP raggiungibile ma collegato a una sessione Chrome non utilizzabile per Betfair.

Il launcher deve distinguere in modo esplicito tra:

```txt
processo avviato dalla sessione corrente
→ owned

processo già esistente e identificato correttamente
→ reused
→ non owned

processo sulla porta prevista ma non identificato
→ external o unknown
→ non owned
→ non riutilizzato automaticamente
```

Il launcher deve considerare owned soltanto backend e frontend avviati dalla sessione corrente.

Chrome/CDP, sia riusato sia avviato tramite helper, non deve essere registrato come owned e non deve mai essere chiuso dal launcher.

Una futura ottimizzazione potrebbe introdurre un worker Python persistente per mantenere attivi Playwright e la connessione CDP durante il tracking. Questo task non deve implementare il worker, ma deve definire le regole di ownership e shutdown necessarie per evitare processi orfani o terminazioni di processi esterni.

---

## Obiettivo

Verificare che il launcher possa avviare, identificare, riusare e chiudere il progetto senza:

* terminare processi esterni;
* eseguire kill in base alla sola porta occupata;
* confondere un backend del progetto con un servizio non identificato;
* confondere un frontend Vite del progetto con un altro server locale;
* creare processi duplicati durante avvii ravvicinati;
* lasciare backend o frontend owned attivi dopo la chiusura;
* terminare backend o frontend riusati;
* chiudere Chrome o un endpoint CDP esterno;
* lasciare lock o manifest incoerenti;
* usare porte differenti da quelle dichiarate nel manifest;
* propagare al frontend un backend target errato;
* promettere una sessione Chrome autenticata quando può soltanto rilevare o riusare un endpoint CDP;
* lasciare in futuro un worker Python owned in esecuzione dopo lo shutdown del componente responsabile.

Il risultato deve essere un lifecycle locale:

```txt
identificabile
→ deterministico
→ idempotente
→ sicuro rispetto ai processi esterni
→ coerente dopo avvio, riuso, errore e shutdown
```

---

## Modello di ownership

Il task deve rendere esplicita la classificazione dei processi.

### Backend

```txt
backend avviato dal launcher corrente
→ owned
→ registrato nel manifest
→ terminato dal launcher allo shutdown

backend già attivo e identificato come appartenente al progetto
→ reused
→ non owned
→ lasciato attivo allo shutdown

servizio sconosciuto sulla porta backend
→ external o unknown
→ non owned
→ mai terminato
→ fallback porta o errore esplicito
```

### Frontend

```txt
frontend avviato dal launcher corrente
→ owned
→ registrato nel manifest
→ terminato dal launcher allo shutdown

frontend già attivo e identificato come appartenente al progetto
→ reused
→ non owned
→ lasciato attivo allo shutdown

servizio sconosciuto sulla porta frontend
→ external o unknown
→ non owned
→ mai terminato
→ fallback porta o errore esplicito
```

### Chrome/CDP

```txt
Chrome già disponibile
→ reused
→ non owned

Chrome avviato tramite helper
→ external rispetto al lifecycle del launcher
→ non owned

endpoint CDP rilevato
→ non implica autenticazione Betfair
→ non implica pagina corretta
→ non implica sessione utilizzabile

shutdown launcher
→ Chrome resta aperto
```

### Futuro worker Python persistente

Questo task non deve introdurre il worker, ma deve fissare il contratto da rispettare quando verrà implementato.

```txt
worker avviato e gestito dal backend
→ owned dal backend
→ non owned direttamente dal launcher
→ terminato durante lo shutdown controllato del backend

worker avviato direttamente dal launcher
→ owned dalla sessione launcher corrente
→ registrato nel manifest
→ terminato durante lo shutdown del launcher

worker già esistente e correttamente identificato
→ reused
→ non owned
→ non terminato dal launcher

worker non identificato
→ external o unknown
→ non riutilizzato automaticamente
→ mai terminato per sola porta o PID non verificato
```

Deve essere definito un solo componente responsabile del lifecycle del worker.

Non è ammessa ownership contemporanea da parte di launcher e backend.

---

## Confini

Questo task riguarda:

* `avvio.py`;
* tutti i file sotto `launcher/` coinvolti nell’avvio;
* script helper utilizzati per Chrome o CDP;
* configurazione di backend e frontend;
* script npm di avvio;
* selezione delle porte;
* fallback delle porte;
* identificazione dei servizi;
* manifest runtime;
* lock runtime;
* PID e metadata dei processi;
* classificazione `owned`, `reused`, `external` o `unknown`;
* propagazione degli endpoint scelti;
* gestione di `SIGINT` e `SIGTERM`;
* shutdown normale;
* shutdown dopo errore parziale;
* selezione, verifica e riuso dell’endpoint CDP;
* regole future di ownership per un eventuale worker Python persistente.

Questo task non deve:

* modificare lo scraping SofaScore o Betfair;
* modificare login, cookie o profili browser;
* modificare dati Betfair;
* introdurre ora un worker Python persistente;
* modificare parsing, ladder o Graph URL;
* modificare la frequenza di polling;
* chiudere Chrome in base alla sola porta;
* terminare processi in base alla sola presenza di un PID non verificato;
* cancellare cache, timeline, history, journal o conferme;
* cambiare la logica di Source Identity;
* modificare strategie o Evidence;
* assumere che un endpoint CDP raggiungibile corrisponda a una sessione Betfair autenticata;
* tentare login automatici;
* ispezionare cookie, credenziali o contenuto sensibile del profilo Chrome.

---

## Materiale da fornire nella chat operativa

* `avvio.py`;
* tutti i file sotto `launcher/` coinvolti nell’avvio e nello shutdown;
* script helper per Chrome o CDP;
* file backend che contiene `app.listen(...)`;
* bootstrap del backend;
* script npm backend;
* script npm frontend;
* eventuale `vite.config`;
* configurazione delle porte backend e frontend;
* modalità con cui il frontend riceve l’URL del backend;
* modalità con cui viene scelto, rilevato o passato `cdpUrl`;
* gestione attuale di `SIGINT` e `SIGTERM`;
* funzioni di terminazione dei processi;
* writer e reader di lock e manifest;
* struttura effettiva del manifest runtime;
* test esistenti del launcher;
* log redatti di un avvio riuscito;
* log redatti di un avvio problematico, se disponibile;
* elenco sintetico di porte, PID e processi durante una sessione attiva;
* comportamento osservato dopo `Ctrl+C`;
* comportamento osservato dopo un doppio avvio;
* eventuali script che avviano processi Python separati dal normale scraping.

Non servono:

* profilo Chrome;
* cookie;
* token;
* credenziali;
* contenuto della sessione browser;
* dump di rete;
* URL con parametri sensibili.

---

## Identificazione dei servizi

Una porta occupata non è una prova sufficiente che il servizio appartenga al progetto.

Prima di riutilizzare un backend o frontend, il launcher deve verificare un’identità esplicita tramite uno o più segnali affidabili:

```txt
health endpoint con identificatore applicativo
manifest runtime coerente
PID verificato
command line compatibile
working directory compatibile
porta dichiarata dal processo
token runtime locale non sensibile
versione o instanceId del servizio
```

La verifica non deve dipendere esclusivamente da:

```txt
porta aperta
nome generico del processo
risposta HTTP 200
presenza di node.exe o python.exe
PID recuperato da un vecchio manifest
```

Se l’identità non è dimostrabile:

```txt
servizio
→ external o unknown
→ non riusato automaticamente
→ non terminato
→ fallback porta o errore esplicito
```

---

## Manifest runtime

Il manifest deve rappresentare lo stato reale della sessione e distinguere almeno:

```txt
service
status
ownership
pid
port
baseUrl
startedAt
source
instanceId, se disponibile
```

Valori indicativi:

```txt
ownership
→ owned
→ reused
→ external
→ unknown

status
→ starting
→ ready
→ failed
→ stopping
→ stopped
```

Per Chrome/CDP:

```txt
ownership
→ sempre reused o external
→ mai owned
```

Il manifest non deve contenere:

* cookie;
* token;
* credenziali;
* header sensibili;
* contenuto della sessione Chrome;
* URL Betfair completi con parametri sensibili.

Un manifest precedente non deve essere considerato valido senza verificare:

```txt
PID ancora esistente
processo corrispondente
servizio raggiungibile
identità del servizio
coerenza fra porta, PID e baseUrl
```

---

## Lock runtime

Il lock deve impedire avvii concorrenti incoerenti senza bloccare definitivamente il progetto dopo un crash.

Il task deve verificare:

```txt
lock creato atomicamente
lock associato alla sessione corrente
lock con PID e instanceId
lock stale rilevabile
lock stale non rimosso senza verifica
lock rimosso dopo shutdown normale
lock rimosso dopo errore gestito
```

Un lock esistente deve essere classificato come:

```txt
sessione attiva verificata
→ secondo avvio rifiutato o trasformato in riuso controllato

sessione non più esistente
→ lock stale
→ cleanup sicuro
→ nuovo avvio consentito

stato non verificabile
→ nessuna cancellazione aggressiva
→ errore esplicito
```

---

## Verifiche richieste

Verificare con precisione:

1. se una porta occupata appartiene realmente a un servizio del progetto prima di riusarla;
2. quali segnali vengono usati per identificare backend e frontend;
3. cosa accade quando `3000`, `3001` o `9222` sono occupate da un processo esterno;
4. se backend e frontend usano correttamente le porte alternative selezionate;
5. se il frontend riceve il backend target effettivo e non una porta predefinita rimasta hardcoded;
6. se un doppio avvio crea processi duplicati, manifest incoerenti o lock bloccati;
7. se due launcher avviati quasi contemporaneamente possono superare il controllo del lock;
8. se `Ctrl+C` termina soltanto backend e frontend owned dalla sessione corrente;
9. se `SIGTERM` produce lo stesso comportamento controllato;
10. se backend o frontend riusati restano aperti dopo la chiusura;
11. se Chrome/CDP resta sempre fuori dall’ownership;
12. se Chrome avviato tramite helper resta aperto allo shutdown del launcher;
13. se un endpoint CDP alternativo viene rilevato e propagato correttamente;
14. se l’endpoint CDP viene normalizzato e validato prima dell’uso;
15. cosa vede il frontend quando CDP non è disponibile;
16. cosa vede il frontend quando CDP è raggiungibile ma non utilizzabile;
17. se il sistema distingue CDP raggiungibile da sessione Betfair autenticata;
18. se lock e manifest vengono rimossi correttamente dopo shutdown normale;
19. se lock e manifest vengono gestiti correttamente dopo errore parziale;
20. se un processo muore prima che il manifest venga aggiornato;
21. se un vecchio manifest può causare il riuso o la terminazione del processo sbagliato;
22. se un PID riciclato dal sistema operativo può essere confuso con il processo precedente;
23. se lo shutdown è idempotente quando viene invocato più volte;
24. se un errore durante la terminazione di un processo impedisce il cleanup degli altri processi owned;
25. se eventuali processi figli di backend o frontend restano orfani;
26. quale componente possiederà in futuro il lifecycle di un worker Python persistente;
27. se lo shutdown del componente owner potrà lasciare il worker Python attivo;
28. se un worker riusato potrà essere distinto da un worker avviato dalla sessione corrente;
29. se Chrome/CDP resterà non owned anche quando verrà utilizzato da un worker persistente;
30. se il launcher può chiudersi senza attendere indefinitamente processi non responsivi.

---

## Scenari minimi di prova

```txt
1. Avvio standard

→ lock creato correttamente
→ backend disponibile
→ frontend disponibile
→ browser applicativo aperto
→ CDP rilevato o configurato
→ manifest coerente
→ ownership corretta
```

```txt
2. Porta backend occupata dal backend corretto già attivo

→ identità verificata
→ backend classificato reused
→ nessun nuovo backend
→ backend non terminato allo shutdown
```

```txt
3. Porta backend occupata da processo esterno

→ nessuna terminazione per sola porta
→ nessun riuso senza identificazione
→ fallback porta oppure errore esplicito
→ manifest coerente con la decisione
```

```txt
4. Porta frontend occupata dal frontend corretto già attivo

→ identità verificata
→ frontend classificato reused
→ frontend non terminato allo shutdown
```

```txt
5. Porta frontend occupata da processo esterno

→ nessuna terminazione
→ fallback frontend
→ backend target propagato correttamente
→ frontend raggiungibile sulla porta scelta
```

```txt
6. CDP su porta alternativa

→ endpoint rilevato o passato correttamente
→ endpoint normalizzato
→ frontend e backend ricevono lo stesso cdpUrl
→ Chrome non diventa owned
```

```txt
7. Porta 9222 occupata da servizio non CDP

→ nessuna falsa classificazione come Chrome
→ nessuna terminazione
→ ricerca alternativa o errore esplicito
```

```txt
8. CDP raggiungibile ma sessione Betfair non autenticata

→ endpoint dichiarato tecnicamente disponibile
→ nessuna promessa di login valido
→ stato applicativo distinto da CDP assente
```

```txt
9. Doppio avvio ravvicinato

→ un solo launcher acquisisce il lock
→ nessun duplicato backend
→ nessun duplicato frontend
→ manifest coerente
→ secondo avvio rifiutato o gestito esplicitamente
```

```txt
10. Lock stale

→ sessione precedente non attiva verificata
→ lock stale rimosso in sicurezza
→ nuovo avvio consentito
```

```txt
11. Manifest stale con PID riciclato

→ identità processo non corrispondente
→ nessun riuso
→ nessuna terminazione del processo
→ manifest precedente invalidato in sicurezza
```

```txt
12. Ctrl+C

→ stop dei soli processi owned
→ backend reused lasciato aperto
→ frontend reused lasciato aperto
→ Chrome lasciato aperto
→ cleanup di lock e manifest
```

```txt
13. SIGTERM

→ stesso comportamento controllato di Ctrl+C
→ nessun processo esterno terminato
→ cleanup runtime completato
```

```txt
14. Errore durante avvio frontend

→ backend owned terminato o mantenuto secondo policy esplicita
→ nessun processo parziale non dichiarato
→ manifest aggiornato
→ lock rimosso
```

```txt
15. Errore durante avvio backend

→ frontend non avviato contro un backend inesistente
→ Chrome lasciato aperto
→ manifest e lock puliti
```

```txt
16. Processo owned non responsivo allo shutdown

→ terminazione graduale
→ timeout esplicito
→ eventuale escalation limitata al PID owned verificato
→ nessun kill per porta
→ cleanup degli altri processi prosegue
```

```txt
17. Shutdown invocato due volte

→ comportamento idempotente
→ nessuna eccezione non gestita
→ nessun tentativo di terminare processi reused
```

```txt
18. Futuro worker Python owned dal backend

→ launcher non tenta di gestirlo direttamente
→ shutdown backend termina il worker
→ Chrome esterno resta aperto
```

```txt
19. Futuro worker Python owned dal launcher

→ worker registrato nel manifest
→ terminato soltanto dalla sessione owner
→ nessun worker orfano
→ Chrome esterno resta aperto
```

```txt
20. Futuro worker Python già esistente

→ riuso soltanto dopo identificazione
→ classificazione reused
→ nessuna terminazione allo shutdown
```

Gli scenari 18–20 possono essere verificati inizialmente tramite fake o simulazioni, senza implementare il worker reale.

---

## Intervento atteso

Applicare modifiche soltanto se le verifiche mostrano un comportamento scorretto, ambiguo o non dimostrabile.

Le eventuali correzioni devono essere circoscritte al launcher e al lifecycle locale.

Non devono introdurre modifiche preventive prive di un caso verificato.

Le correzioni possono includere:

* endpoint di health con identificatore applicativo;
* manifest con ownership esplicita;
* lock atomico con rilevamento stale;
* validazione PID più command line o working directory;
* fallback porte coerente;
* propagazione centralizzata delle porte selezionate;
* shutdown idempotente;
* timeout di terminazione;
* cleanup tramite `finally`;
* distinzione fra CDP disponibile e sessione Betfair utilizzabile;
* contratto di ownership per il futuro worker persistente.

---

## Invarianti da preservare

```txt
nessun kill per sola porta
→ una porta occupata non dimostra ownership
```

```txt
riuso
→ soltanto servizi identificati come appartenenti al progetto
```

```txt
ownership
→ solo processi avviati dalla sessione o dal componente owner corrente
```

```txt
backend e frontend reused
→ mai terminati dal launcher
```

```txt
Chrome/CDP
→ mai owned
→ mai chiuso dal launcher
```

```txt
Chrome avviato tramite helper
→ resta non owned
→ resta aperto allo shutdown
```

```txt
shutdown
→ termina solo processi owned e verificati
→ resta idempotente
→ rimuove lock e manifest effimeri
```

```txt
processo sconosciuto
→ non terminato
→ non riusato automaticamente
```

```txt
CDP disponibile
→ non equivale a login Betfair valido
```

```txt
CDP raggiungibile
→ non equivale a mercato corretto aperto
```

```txt
worker persistente futuro
→ un solo owner
→ nessuna ownership condivisa fra launcher e backend
```

```txt
worker reused
→ non terminato dal launcher
```

```txt
worker owned
→ terminato dal proprio owner
→ nessun processo orfano
```

```txt
errore parziale
→ non lascia stato runtime dichiarato come sano
```

```txt
manifest
→ descrive lo stato reale
→ non costituisce da solo prova di identità
```

---

## Output diagnostico atteso

I log del launcher devono essere strutturali e redatti.

Devono poter mostrare:

```txt
servizio
porta richiesta
porta selezionata
stato identificazione
ownership
PID
azione eseguita
fallback
reason tecnica
shutdown result
```

Non devono mostrare:

* cookie;
* token;
* credenziali;
* contenuto del profilo Chrome;
* header sensibili;
* URL Betfair completi con parametri sensibili;
* stdout o stderr raw non redatti di processi figli.

Esempio concettuale:

```txt
service=backend
requestedPort=3000
selectedPort=3002
ownership=owned
status=ready
pid=1234
reason=requested_port_external
```

---

## Test attesi

I test devono poter essere eseguiti senza:

* login Betfair;
* scraping live;
* rete esterna;
* profilo Chrome reale;
* terminazione di processi esterni reali.

Usare fake o processi controllati per simulare:

* porte occupate;
* servizi identificati;
* servizi sconosciuti;
* PID non più esistente;
* PID riciclato;
* lock stale;
* manifest stale;
* doppio avvio;
* `SIGINT`;
* `SIGTERM`;
* processo non responsivo;
* CDP alternativo;
* endpoint non CDP su porta `9222`;
* worker Python owned, reused o unknown.

---

## Criterio di completamento

Il task è completato quando:

* l’avvio standard è verificato con log o osservazione reale;
* backend e frontend vengono classificati correttamente come owned o reused;
* una porta occupata non causa mai terminazione per sola porta;
* i servizi sconosciuti non vengono riusati automaticamente;
* i fallback delle porte principali sono verificati;
* frontend e backend condividono configurazioni coerenti dopo un fallback;
* un doppio avvio non crea duplicati o stato runtime incoerente;
* lock e manifest stale vengono gestiti in modo sicuro;
* un PID riciclato non consente il riuso o la terminazione del processo sbagliato;
* `Ctrl+C` chiude soltanto i processi owned;
* `SIGTERM` produce uno shutdown equivalente e controllato;
* backend e frontend reused restano aperti;
* Chrome/CDP esterno resta aperto in ogni scenario;
* Chrome avviato tramite helper resta non owned;
* il comportamento con CDP assente, alternativo o non utilizzabile è documentato;
* CDP disponibile e sessione Betfair autenticata restano stati distinti;
* lo shutdown è idempotente;
* un processo owned non responsivo non blocca indefinitamente il launcher;
* errori parziali non lasciano processi owned orfani;
* manifest e lock non restano bloccati dopo shutdown o errore;
* è definito il contratto di ownership del futuro worker Python persistente;
* launcher e backend non possono diventare contemporaneamente owner dello stesso worker;
* Chrome resta non owned anche quando usato dal futuro worker;
* tutti i casi critici sono coperti da test automatici o prove controllate.

# 3. COMPLETATO Retention, cache, dump e pulizia sicura

## Intervento eseguito

È stata completata una classificazione read-only degli artefatti runtime, basata su writer, reader, riuso e semantica reale.

È stata inoltre creata una utility standalone di retention esclusivamente per le cache dimostrate rigenerabili:

```text
backend/betfair_cache
backend/scraper_cache
```

L’utility non è integrata in avvio, shutdown, launcher, scraping, tracking o backend.

## Regole implementate

La utility:

* usa dry-run come comportamento predefinito;
* richiede almeno una cache esplicita e almeno una policy di retention;
* supporta limiti per età, quantità file e dimensione complessiva;
* non legge contenuti JSON;
* non scansiona ricorsivamente;
* considera solo file `.json` regolari e non symlink;
* usa una allow-list fissa delle sole due cache autorizzate;
* richiede sia `--apply` sia `--offline-confirmed` per qualunque eliminazione reale;
* blocca l’apply se esiste il lock del launcher;
* blocca l’apply se le porte 3000 o 3001 risultano occupate su IPv4 o IPv6;
* blocca l’apply anche in caso di errore durante le verifiche di sessione;
* produce un report JSON con candidati, file saltati, file rimossi, byte recuperati ed errori.

## Policy verificata

La policy iniziale verificata è:

```text
max-age-days = 7
```

Questa policy riguarda esclusivamente la conservazione su disco delle due cache autorizzate e non modifica i TTL applicativi esistenti.

Il dry-run finale ha rilevato:

* 50 file analizzati;
* 1.548.868 byte analizzati;
* 0 candidati nella cache Betfair;
* 32 candidati nella cache Sofa;
* 898.795 byte candidati;
* 0 errori;
* 0 file eliminati;
* 0 byte recuperati.

Non è stato eseguito alcun `--apply` sulle cache reali.

## Esclusioni permanenti

I seguenti elementi non sono candidati a cleanup automatico:

| Categoria             | Esempi                                       | Regola                        |
| --------------------- | -------------------------------------------- | ----------------------------- |
| Dati canonici         | timeline, history aggregata, tick persistiti | Mai eliminare automaticamente |
| Conferme operatore    | Source Identity confirmations                | Mai eliminare automaticamente |
| Profili browser       | `scraper_profile`, profili Chrome            | Mai eliminare o ispezionare   |
| Configurazione locale | `.env`, file di configurazione               | Mai eliminare automaticamente |
| Runtime sessione      | lock, manifest, file `.tmp`                  | Fuori scope del cleanup cache |
| Dump diagnostici      | `betfair_network_dump`                       | Nessun cleanup automatico     |
| Log runtime           | log Betfair, backend e Sofa                  | Nessun cleanup automatico     |
| Elementi sconosciuti  | file senza writer/reader dimostrati          | Nessuna eliminazione          |

Dump e log sono stati analizzati ma restano esclusi dalla retention automatica: alcuni hanno reader applicativi, mentre per altri non è stata dimostrata l’assenza di reader o di un contratto operativo di persistenza.

## Verifica effettuata

Sono stati eseguiti test automatici della utility di retention:

* dry-run senza modifiche;
* selezione per età;
* selezione per quantità;
* selezione per dimensione;
* deduplicazione delle motivazioni;
* blocco senza `--offline-confirmed`;
* blocco con sessione potenzialmente attiva;
* gestione errori di rimozione;
* esclusione di directory, file non JSON e symlink;
* protezione da directory arbitrarie;
* controlli IPv4 e IPv6 sulle porte runtime.

Esito finale:

```text
17 test superati
1 test symlink saltato nell’ambiente Windows
nessun fallimento
```

## Invarianti preservati

Non sono stati modificati:

* scraping;
* TTL e reader/writer delle cache;
* `clearBetfairCache`;
* tracking;
* API e route backend;
* frontend;
* launcher;
* Chrome/CDP;
* timeline;
* history;
* Source Identity;
* dump;
* log;
* profili browser.

## Stato finale

La Task 3 è conclusa.

La retention automatizzabile è limitata in modo esplicito alle sole cache Betfair e Sofa, con dry-run predefinito e apply protetto. Tutti gli altri artefatti restano esclusi finché non esista una prova separata e completa che ne consenta la gestione senza interferire con sessioni, diagnostica, tracking o dati persistenti.

----------------------------------------------------------------------------------------------------------------

# 4. Fixture, test riproducibili, replay offline e freschezza dei dati

## Stato attuale

Il progetto dispone di:

* timeline canoniche SofaScore persistite;
* timeline canoniche Betfair persistite;
* history aggregata;
* test mirati;
* casi tecnici già conosciuti;
* regole di qualità dati;
* Source Identity;
* selezione dell’epoch Betfair;
* Evidence e health costruiti a partire dai dati disponibili.

Molte verifiche importanti dipendono però ancora da:

```txt
partita live
→ Chrome aperto
→ endpoint CDP disponibile
→ login Betfair valido
→ mercato ancora disponibile
→ Graph URL funzionanti
```

Replay e backtesting non sono ancora implementati.

Questo rende difficile riprodurre in modo deterministico casi come:

* Source Identity pending;
* Source Identity mismatch;
* bootstrap Betfair fallito;
* ladder stale;
* tick fuori ordine;
* timestamp coincidenti;
* point-by-point assente o incompleto;
* mercato valido ma dati non aggiornati;
* valori Graph invariati dopo una nuova acquisizione;
* pagina Graph riletta senza una nuova acquisizione;
* aggiornamento di un solo Graph su due;
* disallineamento temporale tra i Graph dei due runner;
* cambio di epoch Betfair;
* tick del mercato precedente presenti nella timeline;
* dati tecnicamente validi ma non utilizzabili nel contesto storico corrente;
* persistenza parziale nota.

La Task 6 ha introdotto integrità persistente, commit multi-file e recovery. Il replay deve rispettare tali contratti e non deve trattare un documento parzialmente persistito come una fonte completa.

La Task 7 definisce le garanzie runtime su generation, command ID e risposte tardive. Il replay non deve simulare il runtime live, ma deve poter rappresentare gli effetti persistiti rilevanti di richieste appartenenti a istanti o acquisizioni differenti.

---

## Obiettivo

Creare una base affidabile per verifiche riproducibili senza:

* browser;
* login;
* CDP;
* fetch live;
* rete esterna;
* sessioni runtime;
* disponibilità del mercato.

Il primo obiettivo non è costruire una dashboard storica completa.

Il primo obiettivo è poter rieseguire casi noti sugli stessi dati e verificare che:

```txt
ordinamento tick
Source Identity storica
epoch Betfair
freshness
graph health
qualità dati
Evidence
no-trade reasons
```

producano risultati coerenti, deterministici e spiegabili.

Il replay deve permettere di avanzare un cursore storico e ricostruire esclusivamente il contesto che sarebbe stato disponibile in quel momento.

Non deve usare dati futuri.

---

## Primo risultato richiesto

La prima implementazione deve produrre:

```txt
A. Test tecnico offline
```

La base progettata deve poter essere riutilizzata successivamente per:

```txt
B. Replay programmabile da CLI o script
```

Restano fuori dalla prima implementazione:

```txt
C. Pagina completa per rivedere una partita
D. Confronto operativo tra strategie
E. Backtesting di trading
```

Una UI storica o un backtesting non devono essere introdotti prima che fixture, ordinamento, freshness ed epoch abbiano dimostrato stabilità.

---

## Dipendenze

La task deve rispettare i risultati già consolidati delle task precedenti.

### Task 6 — Integrità persistente

```txt
partial_persistence
→ non equivale a timeline completa

recovery_failed
→ dato degradato o non disponibile

documento canonico assente per commit incompleto
→ non sostituito con cache o payload raw

integrity
→ mantenuta separata da stale, missing e mismatch
```

### Task 7 — Concorrenza e generazioni

Il replay non deve interrogare generation o command ID live.

Può però utilizzare metadata persistiti o presenti nelle fixture per dimostrare che:

```txt
due Graph dello stesso campione
→ appartengono alla stessa acquisizione logica

risposta precedente
→ non può essere combinata con una risposta successiva

tick fuori ordine
→ viene riordinato senza alterare la semantica storica
```

### Task 8 e Task 9

Le fixture introdotte in questa task devono poter essere riutilizzate per verificare le future ottimizzazioni di:

* parsing DOM aggregato;
* pagine Graph persistenti;
* worker Python persistente;
* attese dinamiche;
* freshness verificabile;
* due Graph acquisiti sequenzialmente o con concorrenza controllata.

---

## Confini

Questo task riguarda:

* fixture piccole, sintetiche o anonimizzate;
* lettura delle timeline canoniche persistite;
* caricamento di fixture equivalenti alle timeline canoniche;
* ordinamento deterministico dei tick;
* cursore storico;
* ricostruzione offline di Evidence;
* ricostruzione offline della qualità dati;
* ricostruzione offline di graph health;
* policy storica per Source Identity;
* selezione dell’epoch Betfair al punto storico corretto;
* verifica della freshness;
* verifica della coerenza temporale dei due Graph;
* distinzione tra nuova acquisizione e semplice rilettura del DOM;
* test di regressione;
* report sintetico del replay.

Questo task non deve:

* aprire Chrome;
* avviare Playwright;
* collegarsi tramite CDP;
* eseguire scraping live;
* chiamare API esterne;
* usare dump browser come fonte primaria;
* usare payload diagnostici come fonte primaria;
* usare cache scraper come fonte primaria;
* usare snapshot `latest` come sostituto della timeline;
* interrogare il gate Source Identity live in memoria;
* interrogare tracker o generation live;
* introdurre una UI storica completa;
* introdurre una nuova strategia;
* trasformare Evidence in una strategia;
* eseguire backtesting di trading;
* inventare timestamp, Graph o runner mancanti;
* ricostruire dati canonici da dump o cache quando le timeline sono incomplete;
* considerare automaticamente stale un dato solo perché i valori numerici sono invariati;
* considerare automaticamente fresco un dato solo perché è stato letto nuovamente dal DOM.

---

## Fonte dati consentita

La fonte primaria del replay deve essere:

```txt
timeline canonica SofaScore
+
timeline canonica Betfair
+
metadata di integrità applicabili
```

Possono essere usate fixture sintetiche equivalenti, purché rispettino il contratto minimo delle timeline canoniche.

Non usare come sostituti:

```txt
payload browser raw
dump diagnostici
cache scraper
snapshot latest
stato runtime effimero
gate Source Identity live
registry tracker
pagine Graph
HTML salvato casualmente
```

L’eventuale history aggregata può essere utilizzata solo:

* come dato di confronto;
* per verificare compatibilità;
* quando una funzione esistente ne richiede esplicitamente il contratto.

Non deve diventare una fonte alternativa che introduce informazioni non disponibili nelle timeline al cursore storico.

---

## Regole delle fixture

Le fixture devono essere:

```txt
piccole
→ pochi tick

leggibili
→ campi comprensibili

dedicate
→ un comportamento principale per fixture

anonimizzate
→ nessun dato sensibile

deterministiche
→ nessuna dipendenza da orario corrente o rete

minimali
→ solo campi indispensabili

versionate
→ schema o versione esplicita
```

Ogni fixture deve dichiarare almeno:

```js
{
  "name": "fixture-name",
  "version": 1,
  "description": "Caso tecnico riprodotto",
  "cursor": "timestamp o indice",
  "sofaTimeline": [],
  "betfairTimeline": [],
  "integrity": null,
  "sourceIdentityPolicy": {},
  "expected": {}
}
```

Lo schema effettivo può essere diverso, ma deve contenere informazioni equivalenti.

---

## Identità di acquisizione Graph

Per distinguere una nuova acquisizione da una semplice rilettura della pagina, il replay deve poter rappresentare un’identità logica di acquisizione.

Quando i campi sono disponibili nel formato canonico, utilizzare uno o più tra:

```txt
acquisitionId
requestId
commandId
sampleId
response timestamp
navigation timestamp
Graph fetchedAt
timestamp canonico del tick
```

Non è obbligatorio introdurre tutti questi campi.

È obbligatorio definire una prova deterministica equivalente a:

```txt
nuovo campione
→ nuova acquisizione dimostrabile
```

Le fixture possono introdurre un campo tecnico esplicito anche se il formato live non lo possiede ancora, purché:

* sia chiaramente marcato come metadata della fixture;
* non venga confuso con un dato business;
* serva a fissare il comportamento atteso per la Task 9.

Esempio concettuale:

```js
{
  "graphAcquisition": {
    "id": "acq-0002",
    "startedAt": "2026-07-04T20:13:06.000Z",
    "completedAt": "2026-07-04T20:13:08.000Z",
    "runners": {
      "3120166": {
        "requestId": "graph-request-21",
        "responseAt": "2026-07-04T20:13:07.100Z"
      },
      "1234567": {
        "requestId": "graph-request-22",
        "responseAt": "2026-07-04T20:13:07.600Z"
      }
    }
  }
}
```

---

## Invarianti del replay

### Nessuna dipendenza live

```txt
nessun fetch live
→ risultato ripetibile

nessun browser o login
→ esecuzione indipendente dall’ambiente

nessuna data corrente implicita
→ il tempo deriva esclusivamente dalla fixture
```

### Ordinamento

```txt
tick ordinati
→ timestamp valido
→ tie-breaker deterministico
```

Quando due tick hanno lo stesso timestamp, il replay deve utilizzare un tie-breaker esplicito, ad esempio:

```txt
seq canonico
commitId
ordine persistito verificabile
source priority documentata
fixtureOrder
```

Non utilizzare l’ordine casuale di:

* `readdir`;
* proprietà degli oggetti;
* Map non documentate;
* risultati asincroni.

### Cursore storico

```txt
cursore
→ include solo tick disponibili fino a quel punto
```

Nessuna funzione può leggere:

* ultimo tick dell’intera timeline;
* epoch finale;
* Source Identity finale;
* stato finale del match;

quando il cursore è posizionato in un istante precedente.

### Epoch Betfair

```txt
epoch Betfair
→ calcolato al cursore storico
→ non derivato dall'epoch finale
```

I tick appartenenti a un mercato precedente devono essere esclusi dal contesto corrente dopo un cambio epoch.

I tick futuri di una nuova epoch non possono influenzare cursori precedenti.

### Source Identity

```txt
Source Identity
→ policy storica esplicita
→ nessuna lettura del gate live
```

Se non esiste una conferma Source Identity persistita, la fixture o la policy deve stabilire uno dei seguenti stati:

```txt
not_applicable
pending
aligned
mismatch
unknown
```

`unknown` non può essere trasformato automaticamente in `aligned`.

### Dati insufficienti

```txt
dati insufficienti
→ risultato non disponibile o degradato
→ reason esplicita
→ nessun dato sintetico inventato
```

### Valori invariati

```txt
valori Graph invariati
→ non equivalgono automaticamente a stale
```

Se esiste prova di una nuova acquisizione, un campione può essere fresco anche quando:

* quote identiche;
* volumi identici;
* ladder identica;
* total matched invariato.

### DOM non aggiornato

```txt
stesso DOM
+ nessuna nuova risposta
+ nessuna nuova navigazione
→ non è un nuovo campione
```

Una rilettura della pagina precedente non può produrre un tick fresco.

### Coerenza dei due Graph

```txt
due Graph nello stesso campione
→ appartengono alla stessa acquisizione logica
→ rispettano una soglia temporale esplicita
```

Non è ammesso combinare silenziosamente:

```txt
Graph runner A della richiesta corrente
+
Graph runner B della richiesta precedente
```

### Snapshot della ladder

```txt
ladder
→ snapshot coerente
→ righe appartenenti allo stesso momento logico
```

Una fixture può rappresentare una lettura frammentata o incoerente per verificare che il sistema la rifiuti o degradi.

### Integrità persistente

```txt
partial_persistence noto
→ Evidence cross-source non completa

recovery_failed
→ reason distinta

missing reale
→ non confuso con partial_persistence
```

---

## Policy di freshness da definire

La chat operativa deve formalizzare una funzione o un contratto equivalente a:

```js
evaluateGraphFreshness({
  tick,
  previousTick,
  cursor,
  acquisitionMetadata,
  policy
})
```

Risultato indicativo:

```js
{
  status:
    "fresh" |
    "stale" |
    "not_updated" |
    "partially_updated" |
    "temporally_misaligned" |
    "unknown",
  reason: "machine_readable_reason",
  observedAt: "timestamp",
  ageMs: 0,
  graphSkewMs: 0
}
```

La policy deve distinguere almeno:

### Fresh

```txt
nuova acquisizione provata
→ entrambi i Graph validi
→ identità runner coerente
→ differenza temporale entro soglia
```

### Not updated

```txt
nessuna nuova risposta
→ nessuna nuova navigazione
→ DOM precedente riletto
```

### Partially updated

```txt
un Graph aggiornato
→ secondo Graph non aggiornato o assente
```

### Temporally misaligned

```txt
entrambi i Graph nuovi
→ differenza temporale oltre soglia
```

### Stale

```txt
nuova acquisizione o tick canonico
→ età oltre soglia prevista
```

### Unknown

```txt
metadata insufficienti
→ nessuna supposizione
```

Le soglie non devono essere inventate nel task.

Devono essere:

* ricavate dai contratti esistenti;
* fissate esplicitamente;
* coperte da test;
* eventualmente parametrizzabili.

---

## Materiale da fornire nella chat operativa

* schema effettivo dei tick SofaScore;
* schema effettivo dei tick Betfair;
* esempi dei campi `seq`, timestamp, `commitId` e freshness;
* `timelineStore`;
* moduli di lettura e serializzazione timeline;
* moduli di ordinamento;
* builder Evidence;
* builder Data Quality;
* builder Graph Health;
* builder No Trade Reasons;
* moduli che calcolano Market Flow;
* moduli di allineamento;
* selettore dell’epoch Betfair;
* moduli Source Identity rilevanti;
* reader di integrità introdotti nella Task 6;
* test esistenti con fixture;
* configurazione test;
* uno o due esempi anonimizzati di timeline corte;
* elenco dei casi già noti;
* schema o metadata disponibili per dimostrare una nuova acquisizione Graph;
* soglie correnti di stale;
* eventuale soglia corrente di disallineamento temporale;
* modalità con cui viene determinato che entrambi i Graph appartengono allo stesso scrape;
* decisione sul formato del report offline.

Non servono:

* Chrome;
* profilo browser;
* cookie;
* token;
* credenziali;
* Graph URL reali con parametri sensibili;
* dump completi;
* timeline da decine di megabyte.

---

## Fixture minime da creare

### 1. SofaScore valido senza Betfair

```txt
SofaScore valido
→ Evidence Sofa-only
→ nessuna attribuzione cross-source
```

### 2. Source Identity pending

```txt
Source Identity pending
→ cross-source non disponibile
→ nessun record o segnale attribuito al mercato
```

### 3. Source Identity mismatch

```txt
Source Identity mismatch
→ cross-source non disponibile
→ reason esplicita
```

### 4. Bootstrap Betfair fallito

```txt
SofaScore disponibile
→ Betfair assente o tecnicamente non valido
→ nessun falso dato cross-source
```

### 5. Ladder stale

```txt
tick Betfair oltre soglia
→ health o qualità degradata
→ nessun dato presentato come aggiornato
```

### 6. Tick fuori ordine

```txt
ordine file diverso dall'ordine temporale
→ ordinamento deterministico
→ risultato riproducibile
```

### 7. Timestamp coincidenti

```txt
due tick con stesso timestamp
→ tie-breaker esplicito
→ ordine stabile
```

### 8. Cambio di epoch Betfair

```txt
mercato precedente
→ escluso dal contesto corrente

cursore precedente al cambio
→ nessuna informazione futura
```

### 9. Point-by-point assente

```txt
local context non disponibile
→ nessun calcolo sportivo inventato
```

### 10. Mercato sano e aggiornato

```txt
SofaScore valido
→ Betfair valido
→ Source Identity applicabile
→ Graph freschi
→ Evidence completa nei limiti dei dati
```

### 11. Nuova risposta Graph con valori modificati

```txt
nuova acquisizione dimostrata
→ valori modificati
→ campione fresh
```

### 12. Nuova risposta Graph con valori invariati

```txt
nuova acquisizione dimostrata
→ ladder identica alla precedente
→ campione ancora fresh
→ nessuna falsa classificazione stale
```

### 13. Pagina Graph riletta senza nuova acquisizione

```txt
nessuna nuova risposta
→ nessuna nuova navigazione
→ stesso DOM

risultato
→ not_updated
→ nessuna persistenza come nuovo tick
```

### 14. Solo primo Graph aggiornato

```txt
Graph runner A nuovo
→ Graph runner B precedente

risultato
→ partially_updated
→ nessuna fusione silenziosa
```

### 15. Solo secondo Graph aggiornato

```txt
Graph runner A precedente
→ Graph runner B nuovo

risultato
→ partially_updated
→ nessuna fusione silenziosa
```

### 16. Due Graph temporalmente allineati

```txt
due risposte nuove
→ differenza entro soglia

risultato
→ fresh
```

### 17. Due Graph temporalmente disallineati

```txt
due risposte nuove
→ differenza oltre soglia

risultato
→ temporally_misaligned
→ qualità degradata
```

### 18. Identità runner non coerente

```txt
Graph URL o selectionId non corrisponde al runner atteso

risultato
→ tick non utilizzabile
→ reason esplicita
```

### 19. Snapshot ladder incoerente

```txt
righe appartenenti a momenti differenti
→ duplicati o combinazioni incompatibili

risultato
→ tick degradato o rifiutato
```

### 20. Tick Graph della richiesta precedente arrivato tardi

```txt
acquisitionId precedente
→ timestamp di arrivo successivo

risultato
→ ordinamento tramite identità logica
→ nessuna sovrascrittura del campione più recente
```

### 21. Integrità persistente parziale

```txt
timeline presente
→ history incompleta nota

risultato
→ partial_persistence
→ Evidence cross-source non completa
```

### 22. Recovery fallita

```txt
integrity recovery_failed

risultato
→ stato degradato
→ reason distinta da stale e missing
```

### 23. Fixture incompleta

```txt
campo indispensabile assente

risultato
→ nessun crash
→ unavailable o degraded con reason
```

Ogni fixture deve contenere solo i campi indispensabili per riprodurre il comportamento.

---

## Verifiche richieste

La chat operativa deve verificare:

1. come vengono ordinati i tick quando timestamp e ordine di scrittura divergono;
2. quale tie-breaker è già disponibile;
3. se `seq` è sempre presente e affidabile;
4. come ordinare tick con timestamp uguali;
5. come calcolare l’epoch Betfair al cursore storico;
6. quali tick segnano l’inizio di una nuova epoch;
7. come escludere tick del mercato precedente;
8. quali dati Evidence possono essere ricostruiti solo dalle timeline;
9. quali campi dipendono da runtime, gate live o fetch attivo;
10. quale policy storica adottare quando non esiste una conferma Source Identity persistita;
11. se Source Identity può essere ricostruita oppure deve essere fornita dalla fixture;
12. come distinguere una nuova risposta con valori invariati da una pagina mai aggiornata;
13. quale prova minima certifica una nuova acquisizione Graph;
14. quali metadata di acquisizione sono già persistiti;
15. quali metadata devono essere aggiunti in futuro senza alterare i dati business;
16. quale differenza temporale massima è ammessa tra i due Graph;
17. come viene classificato un campione con un solo Graph nuovo;
18. se un solo Graph valido rende inutilizzabile tutto il tick o solo la ladder parziale;
19. se due Graph appartenenti a command ID differenti possono essere combinati;
20. come riconoscere una risposta tardiva appartenente all’acquisizione precedente;
21. se una ladder può essere letta mentre il DOM sta cambiando;
22. come rappresentare una ladder incoerente in fixture;
23. se una nuova acquisizione con valori invariati aggiorna comunque il timestamp di freshness;
24. se il timestamp di persistenza può sostituire il timestamp di acquisizione;
25. come distinguere source timestamp, acquisition timestamp e persistence timestamp;
26. come viene propagata `partial_persistence`;
27. come distinguere partial persistence, stale, missing e mismatch;
28. se le fixture possono essere eseguite senza file esterni;
29. se le fixture possono essere eseguite senza browser o credenziali;
30. se gli stessi input producono sempre lo stesso output;
31. se una modifica a Evidence cambia risultati attesi già fissati;
32. se una modifica a freshness cambia risultati attesi già fissati;
33. se una modifica all’ordinamento cambia risultati attesi già fissati;
34. se una modifica all’epoch introduce informazioni future;
35. se il report è sufficientemente chiaro per identificare la causa del risultato.

---

## Runner offline

Il runner offline deve:

```txt
caricare fixture o timeline
→ validare lo schema minimo
→ ordinare i tick
→ applicare il cursore
→ selezionare l'epoch Betfair
→ applicare Source Identity storica
→ valutare freshness
→ valutare Graph alignment
→ costruire Data Quality
→ costruire Evidence
→ costruire No Trade Reasons
→ produrre un report
```

Interfaccia concettuale:

```js
runOfflineReplay({
  sofaTimeline,
  betfairTimeline,
  integrity,
  cursor,
  sourceIdentityPolicy,
  freshnessPolicy
})
```

Output indicativo:

```js
{
  ok: true,
  fixture: "graph-values-unchanged-but-fresh",
  cursor: "2026-07-04T20:13:08.000Z",
  processedTicks: {
    sofa: 3,
    betfair: 2
  },
  selectedEpoch: {
    marketId: "1.123456789",
    startedAt: "2026-07-04T20:12:00.000Z"
  },
  sourceIdentity: {
    status: "aligned",
    reason: null
  },
  graphFreshness: {
    status: "fresh",
    reason: "new_acquisition_same_values",
    graphSkewMs: 500
  },
  integrity: {
    status: "no_known_partial"
  },
  dataQuality: {},
  evidence: {},
  reasons: []
}
```

Lo schema effettivo può essere diverso, ma deve esporre le stesse categorie logiche.

---

## Assertion test

Ogni fixture deve avere assertion esplicite su:

```txt
ordine tick
epoch selezionato
Source Identity
freshness
Graph alignment
integrità
qualità dati
Evidence disponibile o non disponibile
reason
assenza di informazioni future
```

Non limitarsi a verificare che il runner non generi eccezioni.

Le assertion devono fissare il comportamento business e tecnico atteso.

Esempio:

```js
assert.equal(result.graphFreshness.status, 'fresh');
assert.equal(
  result.graphFreshness.reason,
  'new_acquisition_same_values'
);
assert.equal(result.dataQuality.betfairFresh, true);
```

---

## Golden test e snapshot

Gli snapshot completi possono essere utilizzati soltanto per output piccoli e stabili.

Per output complessi è preferibile verificare campi mirati:

```txt
status
reason
epoch
freshness
availability
no-trade reasons
```

Evitare snapshot enormi che:

* nascondono cambiamenti rilevanti;
* richiedono aggiornamenti indiscriminati;
* contengono ladder complete non necessarie;
* rendono difficile capire la regressione.

---

## Report sintetico

Ogni esecuzione deve produrre almeno:

```txt
fixture o file eseguito
versione fixture
cursore
tick Sofa elaborati
tick Betfair elaborati
tick esclusi
tie-breaker applicato
epoch selezionato
Source Identity
integrity
freshness
Graph skew
campioni parziali o rifiutati
reason di indisponibilità
risultato finale
```

Esempio testuale:

```txt
fixture=graph-partially-updated
cursor=2026-07-04T20:13:08.000Z
sofaTicks=3
betfairTicks=2
epoch=1.123456789
sourceIdentity=aligned
freshness=partially_updated
graphSkewMs=n/a
evidence=unavailable
reason=second_graph_not_updated
```

---

## Scenari minimi di prova

```txt
1. Stesso input eseguito due volte
→ stesso output byte-per-byte o semanticamente equivalente
```

```txt
2. Timeline con timestamp uguali
→ ordine stabile grazie al tie-breaker
```

```txt
3. Timeline fornita in ordine inverso
→ stesso risultato dopo ordinamento
```

```txt
4. Cambio storico di mercato Betfair
→ epoch selezionata al cursore
→ nessuna informazione futura
```

```txt
5. Source Identity non disponibile
→ cross-source non attribuito
→ reason esplicita
```

```txt
6. Source Identity mismatch
→ nessun dato cross-source
```

```txt
7. SofaScore senza Betfair
→ Evidence disponibile nei limiti Sofa-only
```

```txt
8. Tick Betfair tecnicamente invalido
→ non trattato come tick canonico utilizzabile
```

```txt
9. Valori Graph modificati dopo nuova acquisizione
→ fresh
```

```txt
10. Valori Graph invariati dopo nuova acquisizione
→ fresh
→ nessun falso stale
```

```txt
11. DOM invariato senza nuova acquisizione
→ not_updated
→ nessun nuovo tick valido
```

```txt
12. Un solo Graph aggiornato
→ partially_updated
→ nessuna fusione con il campione precedente
```

```txt
13. Due Graph entro soglia temporale
→ fresh
```

```txt
14. Due Graph oltre soglia temporale
→ temporally_misaligned
→ qualità degradata
```

```txt
15. Risposta Graph tardiva della richiesta precedente
→ esclusa dal campione corrente
```

```txt
16. Runner o selectionId errato
→ campione rifiutato
```

```txt
17. Ladder incoerente
→ tick degradato o rifiutato
```

```txt
18. Partial persistence
→ Evidence cross-source non completa
→ reason distinta da stale
```

```txt
19. Recovery failed
→ stato degradato esplicito
```

```txt
20. Fixture incompleta
→ nessun crash
→ unavailable o degraded con reason
```

---

## Intervento atteso

L’intervento iniziale deve produrre:

```txt
fixture piccole
→ casi noti riproducibili
```

```txt
schema fixture
→ versione esplicita
→ validazione minima
```

```txt
runner offline
→ legge timeline canoniche o fixture
→ ordina i tick
→ applica il cursore
→ seleziona epoch
→ valuta freshness
→ costruisce contesto
```

```txt
assertion test
→ confrontano output atteso e reale
```

```txt
report sintetico
→ spiega risultato e reason
```

Il primo intervento non deve:

* introdurre UI;
* modificare lo scraping;
* modificare il polling;
* implementare la Task 9;
* aggiungere dati live;
* trasformare fixture in file enormi;
* copiare intere timeline reali.

---

## Invarianti da preservare

```txt
timeline canonica
→ fonte primaria
```

```txt
cache e dump
→ non fonti del replay
```

```txt
Evidence
→ costruita solo con dati disponibili al cursore
```

```txt
epoch
→ storica
→ nessuna informazione futura
```

```txt
Source Identity
→ policy storica esplicita
```

```txt
valori invariati
→ non equivalgono a stale
```

```txt
nuova lettura DOM
→ non equivale a nuova acquisizione
```

```txt
un solo Graph nuovo
→ non combinato con Graph precedente
```

```txt
Graph disallineati
→ qualità degradata
```

```txt
partial persistence
→ distinta da stale e missing
```

```txt
dato mancante
→ non inventato
```

```txt
fixture
→ corta
→ leggibile
→ dedicata
```

---

## Criterio di completamento

Il task è completato quando:

* esiste uno schema fixture versionato;
* esiste un set iniziale di fixture piccole e anonimizzate;
* i casi principali possono essere eseguiti senza browser, login o rete;
* il replay usa soltanto timeline canoniche persistite o fixture equivalenti;
* l’ordine dei tick è deterministico;
* timestamp coincidenti sono risolti con un tie-breaker esplicito;
* il cursore impedisce l’uso di informazioni future;
* l’epoch Betfair è calcolata al cursore storico;
* i tick di epoch differenti non vengono combinati;
* Source Identity segue una policy storica esplicita;
* `unknown` non viene trasformato implicitamente in `aligned`;
* una nuova acquisizione con valori invariati viene riconosciuta come fresca;
* una rilettura del vecchio DOM non viene riconosciuta come nuovo campione;
* un solo Graph aggiornato non viene combinato con il Graph precedente;
* i due Graph rispettano una policy temporale esplicita;
* un disallineamento temporale produce una reason verificabile;
* identità runner e selection ID vengono controllati;
* una risposta tardiva della richiesta precedente non modifica il campione corrente;
* una ladder incoerente viene degradata o rifiutata;
* partial persistence resta distinta da stale, missing e mismatch;
* gli output attesi sono coperti da assertion;
* gli stessi input producono sempre lo stesso output;
* almeno una regressione su freshness viene intercettata da una fixture;
* almeno una regressione sull’epoch viene intercettata da una fixture;
* almeno una regressione su Source Identity viene intercettata da una fixture;
* il report spiega tick elaborati, epoch, freshness, integrity e reason;
* la base può essere riutilizzata successivamente da una CLI senza riscrivere la logica centrale.

# 5. Strategie, classificazioni e segnali osservativi

## Stato attuale

Il progetto contiene già componenti e contratti collegati a strategie, inclusi elementi relativi a `Lay The Winner`.

Sono inoltre presenti o previsti:

* Evidence;
* `marketEvidence`;
* `targetContext`;
* `targetSignals`;
* `noTradeReasons`;
* qualità dati;
* Source Identity;
* Money Flow;
* ladder Betfair;
* timeline canoniche;
* replay offline;
* integrità persistente;
* health tecnico;
* componenti frontend che presentano osservazioni e blocchi.

Evidence non è una strategia.

Evidence raccoglie e presenta:

```txt
contesto sportivo
→ qualità dei dati
→ stato Source Identity
→ osservazioni SofaScore
→ dati Betfair
→ ladder e Money Flow
→ freshness
→ ragioni di indisponibilità
→ diagnostica applicabile
```

Evidence non dimostra automaticamente:

* causalità;
* intenzione dei partecipanti al mercato;
* esistenza di “smart money”;
* probabilità reale di vittoria;
* quota equa;
* vantaggio statistico;
* convenienza economica di un’operazione;
* validità di un ingresso o di un’uscita;
* rendimento futuro.

Una variazione di quota o volume è un’osservazione.

Non è, da sola, una prova della causa che l’ha generata.

Le roadmap già fissate richiedono di non anticipare:

* fair odds;
* previsioni;
* punteggi presentati come probabilità;
* interpretazioni certe del Money Flow;
* “smart money”;
* suggerimenti automatici di ingresso;
* suggerimenti automatici di uscita;
* raccomandazioni `back`;
* raccomandazioni `lay`;
* automazione di ordini;
* gestione automatica del capitale.

Prima devono essere affidabili:

```txt
dati
→ integrità
→ freshness
→ Source Identity
→ allineamento temporale
→ replay
→ criteri osservabili
→ test riproducibili
```

---

## Obiettivo

Definire il primo livello utile, trasparente e verificabile di strategia o segnale senza trasformare dati incompleti in una raccomandazione di trading.

Il primo risultato deve essere una classificazione osservativa:

```txt
input disponibili
→ qualità e integrità
→ condizioni valutabili
→ condizioni soddisfatte
→ condizioni non soddisfatte
→ condizioni non valutabili
→ ragioni di blocco
→ nessuna promessa di rendimento
```

L’output iniziale deve aiutare l’utente a capire:

* cosa è stato osservato;
* quali dati sono stati realmente utilizzati;
* quali condizioni sono soddisfatte;
* quali condizioni mancano;
* quali condizioni non possono essere valutate;
* perché il risultato è disponibile o bloccato;
* quale versione della logica ha prodotto il risultato.

Non deve dire all’utente cosa fare sul mercato.

Solo dopo:

* fixture stabili;
* replay deterministico;
* dati di qualità;
* definizioni quantitative;
* validazione storica separata;
* criteri di valutazione espliciti;

potrà essere considerato un livello classificatorio più avanzato.

---

## Livelli di maturità

La task deve distinguere esplicitamente cinque livelli.

### Livello A — Osservazioni descrittive

```txt
cosa è accaduto
→ dati misurati
→ nessuna interpretazione operativa
```

Esempi consentiti:

```txt
la quota è diminuita nel periodo osservato
il volume abbinato è aumentato
la ladder è fresca
il runner ha vinto gli ultimi due game
i due Graph sono temporalmente allineati
```

### Livello B — Condizioni e motivi di blocco

```txt
condizioni definite
→ soddisfatte
→ non soddisfatte
→ non valutabili
```

Esempi consentiti:

```txt
freshness Betfair soddisfatta
Source Identity non applicabile
point-by-point insufficiente
ladder temporalmente disallineata
```

### Livello C — Punteggio o classificazione interna

```txt
più condizioni
→ classificazione sintetica
```

Questo livello richiede:

* formula esplicita;
* versione;
* fixture;
* replay;
* analisi di sensibilità;
* nessuna rappresentazione del punteggio come probabilità reale.

### Livello D — Suggerimento operativo non automatico

```txt
classificazione
→ suggerimento interpretativo
```

Questo livello resta fuori dalla prima implementazione.

Richiede una task separata, criteri ulteriori e validazione dedicata.

### Livello E — Raccomandazione o automazione

```txt
back
lay
entrata
uscita
ordine
```

Questo livello è fuori scope.

La prima implementazione deve fermarsi a:

```txt
Livello A
oppure
Livello B
```

---

## Dipendenze

Prima di rendere disponibile una classificazione osservativa devono essere soddisfatte le dipendenze pertinenti.

### Task 4 — Fixture e replay offline

Devono essere disponibili fixture per:

* dati completi;
* SofaScore senza Betfair;
* Source Identity pending;
* Source Identity mismatch;
* ladder stale;
* Graph non aggiornato;
* Graph parzialmente aggiornati;
* Graph temporalmente disallineati;
* risposta tardiva;
* cambio epoch;
* dati tecnicamente invalidi;
* partial persistence;
* fixture incompleta.

Ogni regola deve essere eseguibile offline sugli stessi input.

### Task 6 — Integrità persistente

La strategia deve distinguere:

```txt
no_known_partial
partial_persistence
recovery_pending
recovery_failed
```

Una persistenza incompleta deve impedire l’uso di dati cross-source quando la completezza non può essere dimostrata.

`partial_persistence` non deve essere trasformato in:

* stale;
* missing;
* mismatch;
* condizione strategica non soddisfatta.

Deve restare una ragione distinta.

### Task 7 — Concorrenza e idempotenza

L’output non deve essere aggiornato da:

* risposte tardive;
* generation invalidate;
* command ID non più attivi;
* sessioni precedenti;
* pagine Graph del match precedente.

Il task strategico non deve leggere direttamente lo stato runtime effimero quando esiste una fonte canonica persistita.

### Task 8 — Baseline e osservabilità

Devono essere misurabili:

* età dei dati;
* ritardo di acquisizione;
* ritardo di persistenza;
* Graph skew;
* stato freshness;
* timeout;
* retry;
* qualità tecnica.

La strategia non deve creare soglie temporali arbitrarie differenti da quelle utilizzate da Data Quality.

### Task 9 — Ottimizzazione dello scraper

Le ottimizzazioni non devono cambiare il significato degli input strategici.

La strategia deve continuare a distinguere:

```txt
fresh
stale
not_updated
partially_updated
temporally_misaligned
unknown
```

Una nuova risposta Graph con valori invariati può essere fresca.

Una rilettura del vecchio DOM non è un nuovo dato.

---

## Prerequisiti applicativi

Prima di produrre un risultato cross-source devono essere disponibili e verificabili:

### Source Identity

```txt
aligned
→ contesto cross-source applicabile

pending
→ risultato cross-source non disponibile

mismatch
→ risultato cross-source non applicabile

unknown
→ nessuna assunzione implicita
```

### Integrità

```txt
persistenza completa
→ input utilizzabili

partial persistence
→ risultato cross-source bloccato

recovery failed
→ risultato degradato o indisponibile
```

### Validità tecnica Betfair

```txt
tick tecnicamente valido
→ valutazione consentita

tick tecnicamente invalido
→ nessuna valutazione costruita sul tick
```

### Freshness

```txt
fresh
→ dato temporalmente utilizzabile

stale
→ dato non presentato come attuale

not_updated
→ nessun nuovo dato

partially_updated
→ nessuna coppia completa dei runner

temporally_misaligned
→ nessuna osservazione cross-runner che richieda simultaneità

unknown
→ nessuna assunzione
```

### Epoch Betfair

```txt
epoch corrente al cursore
→ utilizzabile

tick di epoch precedente
→ escluso
```

### Contesto SofaScore

```txt
point-by-point disponibile
→ condizioni sportive valutabili

point-by-point assente
→ condizioni dipendenti dal punto non valutabili
```

Una dipendenza non soddisfatta non deve produrre una raccomandazione degradata.

Deve produrre uno stato esplicito.

---

## Confini

### Inclusi

Questo task riguarda:

* contratti Strategy esistenti;
* `layTheWinner`;
* `marketEvidence`;
* `targetContext`;
* `targetSignals`;
* `noTradeReasons`;
* builder Evidence;
* Data Quality utilizzata dalla strategia;
* integrità applicata all’output;
* freshness applicata all’output;
* output backend;
* route Strategy;
* view model frontend;
* componenti che mostrano osservazioni;
* componenti che mostrano condizioni;
* componenti che mostrano blocchi;
* regole di indisponibilità;
* reason code;
* provenienza degli input;
* versionamento della logica;
* fixture;
* replay;
* test automatici;
* confronto fra versioni;
* eventuale feature flag.

### Esclusi

Questo task non deve:

* modificare scraping;
* modificare Graph URL;
* modificare timeline;
* modificare persistenza;
* modificare recovery;
* riscrivere Source Identity;
* riscrivere Money Flow;
* modificare le regole di freshness;
* modificare la validità tecnica Betfair;
* inventare dati mancanti;
* trasformare osservazioni in causalità;
* interpretare volume come intenzione certa;
* interpretare variazioni quota come informazione privilegiata;
* calcolare fair odds;
* produrre probabilità predittive;
* inviare ordini a Betfair;
* eseguire puntate automatiche;
* gestire automaticamente stake;
* suggerire entrata o uscita;
* presentare risultati come certi;
* introdurre una nuova strategia senza specifica;
* modificare `Lay The Winner` senza averne prima documentato il contratto reale;
* usare dati runtime effimeri quando non riproducibili nel replay;
* dipendere da browser, login o rete durante i test.

---

## Materiale da fornire nella chat operativa

### Backend

* route Strategy;
* implementazione di `layTheWinner`;
* `marketEvidence`;
* `targetContext`;
* `targetSignals`;
* builder Evidence;
* builder Data Quality;
* builder No Trade Reasons;
* moduli Money Flow;
* selettore epoch;
* Source Identity applicata a Evidence;
* gestione integrity;
* contratti di freshness;
* payload Strategy attuali;
* eventuali feature flag;
* versioni o costanti strategiche esistenti.

### Frontend

* hook collegati alla strategia;
* componenti che mostrano:

  * strategia;
  * target;
  * segnali;
  * condizioni;
  * blocchi;
  * qualità;
* testi UI attuali;
* eventuali colori o badge semantici;
* gestione degli stati loading, unavailable e blocked.

### Test e fixture

* test esistenti;
* fixture della Task 4;
* replay runner;
* risposte API anonimizzate;
* casi reali conosciuti;
* esempi di output desiderato;
* esempi di output da evitare.

### Definizione funzionale

Prima del codice deve essere indicato il risultato desiderato:

```txt
A. osservazioni descrittive
B. condizioni soddisfatte e motivi di blocco
C. punteggio interno
D. suggerimento non automatico
E. raccomandazione esplicita
```

La prima implementazione deve scegliere `A` o `B`.

---

## Decisioni da fissare prima del codice

La chat operativa deve chiarire:

1. quale problema concreto deve risolvere l’output;
2. quale utente lo consulta;
3. quale decisione informativa deve supportare;
4. quali input sono obbligatori;
5. quali input sono opzionali;
6. quali input vengono realmente utilizzati;
7. quali dati vengono soltanto visualizzati;
8. quali condizioni rendono il risultato non disponibile;
9. quali condizioni rendono il risultato non applicabile;
10. quali condizioni rendono il risultato bloccato;
11. quali condizioni sono valutabili anche senza Betfair;
12. quali condizioni richiedono Source Identity aligned;
13. quali condizioni richiedono entrambi i Graph;
14. quali condizioni richiedono point-by-point;
15. quali condizioni richiedono Money Flow;
16. quali condizioni dipendono dalla freshness;
17. quali condizioni dipendono dall’epoch;
18. quali condizioni dipendono dall’integrità persistente;
19. se l’output è descrittivo o classificatorio;
20. quali campi sono misurati;
21. quali campi sono derivati;
22. quali campi sono interpretazioni;
23. quali campi sono reason;
24. come evitare causalità non dimostrata;
25. come evitare di interpretare volumi come intenzione;
26. come evitare che un punteggio venga letto come probabilità;
27. come viene versionata la logica;
28. come vengono confrontate versioni differenti;
29. come viene comunicato il cambiamento alla UI;
30. quale comportamento deve avere una versione sconosciuta.

Nessuna regola deve essere codificata finché il suo significato non è trasformato in una condizione verificabile.

---

## Tassonomia dell’output

L’output deve distinguere almeno:

```txt
available
blocked
insufficient_data
not_applicable
unavailable
```

### Available

```txt
input obbligatori disponibili
→ qualità sufficiente
→ condizioni valutate
→ risultato osservativo disponibile
```

`available` non significa:

* opportunità;
* vantaggio;
* trade valido;
* rendimento atteso positivo.

### Blocked

```txt
dati presenti
→ prerequisito operativo non soddisfatto
```

Esempi:

* Source Identity pending;
* ladder stale;
* Graph disallineati;
* partial persistence;
* tick tecnicamente invalido.

### Insufficient data

```txt
input indispensabile mancante
→ valutazione non completabile
```

Esempi:

* point-by-point assente;
* ladder mancante;
* dati storici insufficienti.

### Not applicable

```txt
regola non pertinente al contesto
```

Esempi:

* condizione cross-source senza Source Identity applicabile;
* mercato differente da quello previsto dalla regola;
* fase della partita non supportata.

### Unavailable

```txt
errore tecnico o contratto non valutabile
```

Esempi:

* recovery failed;
* schema sconosciuto;
* versione non supportata;
* errore interno controllato.

---

## Contratto dell’output

Struttura indicativa:

```js
{
  "strategy": {
    "id": "lay_the_winner_observation",
    "version": "1.0.0",
    "level": "B",
    "status": "available",
    "evaluatedAt": "2026-07-04T20:13:08.000Z"
  },
  "scope": {
    "eventId": "safe-event-id",
    "epochId": "market-epoch",
    "cursor": "2026-07-04T20:13:08.000Z"
  },
  "dataQuality": {
    "sourceIdentity": "aligned",
    "technicalValidity": "valid",
    "freshness": "fresh",
    "graphPairStatus": "fresh",
    "persistenceComplete": true
  },
  "conditions": [],
  "observations": [],
  "reasons": [],
  "inputs": [],
  "provenance": {},
  "disclaimer": "Observational output only"
}
```

Lo schema effettivo può differire, ma deve mantenere categorie equivalenti.

---

## Contratto delle condizioni

Ogni condizione deve avere un’identità stabile.

Esempio:

```js
{
  "id": "betfair_ladder_fresh",
  "label": "Ladder Betfair aggiornata",
  "status": "satisfied",
  "required": true,
  "value": true,
  "reason": null,
  "source": "betfair_data_quality",
  "observedAt": "2026-07-04T20:13:08.000Z"
}
```

Stati consentiti:

```txt
satisfied
not_satisfied
not_evaluable
not_applicable
```

Non usare un semplice booleano quando è necessario distinguere:

```txt
false
→ condizione valutata e non soddisfatta

null
→ condizione non valutabile
```

Ogni condizione deve dichiarare:

* ID;
* descrizione;
* obbligatorietà;
* stato;
* valore utilizzato;
* fonte;
* timestamp;
* reason;
* versione della regola.

---

## Contratto delle osservazioni

Le osservazioni devono descrivere dati senza convertirli automaticamente in segnali.

Esempio:

```js
{
  "id": "market_price_decreased",
  "status": "observed",
  "value": {
    "from": 2.20,
    "to": 2.06,
    "change": -0.14
  },
  "period": {
    "from": "2026-07-04T20:12:00.000Z",
    "to": "2026-07-04T20:13:00.000Z"
  },
  "source": "betfair_timeline",
  "interpretation": null
}
```

Non deve essere trasformata automaticamente in:

```txt
mercato informato
pressione certa
smart money
ingresso consigliato
```

---

## Provenienza degli input

Ogni output deve poter spiegare da dove arrivano i dati.

Esempio:

```js
{
  "provenance": {
    "sofaTick": {
      "timestamp": "2026-07-04T20:13:05.000Z",
      "seq": 18
    },
    "betfairTick": {
      "timestamp": "2026-07-04T20:13:08.000Z",
      "seq": 11,
      "epochId": "market-1"
    },
    "sourceIdentity": {
      "status": "aligned",
      "policyVersion": "1"
    },
    "strategyVersion": "1.0.0"
  }
}
```

Non inserire:

* cookie;
* token;
* URL sensibili;
* Graph URL completi;
* payload raw;
* dati diagnostici non necessari.

---

## Reason code

Le ragioni devono essere:

```txt
machine-readable
→ stabili

human-readable
→ comprensibili
```

Esempi indicativi:

```txt
source_identity_pending
source_identity_mismatch
source_identity_unknown
betfair_tick_missing
betfair_tick_invalid
betfair_ladder_stale
betfair_graph_not_updated
betfair_graph_partially_updated
betfair_graph_temporally_misaligned
betfair_runner_identity_invalid
point_by_point_missing
market_epoch_unavailable
persistence_incomplete
persistence_recovery_failed
insufficient_history
condition_not_satisfied
strategy_version_unsupported
```

Una reason deve essere aggiunta una sola volta.

Non usare reason generiche come:

```txt
error
invalid
not ready
```

quando è disponibile una causa più precisa.

---

## No Trade Reasons

`noTradeReasons` deve continuare a rappresentare blocchi operativi o prerequisiti non soddisfatti.

Non deve sostituire:

* diagnostica tecnica;
* tutte le reason Data Quality;
* errori di persistenza;
* Source Identity;
* health dello scraper.

Esempio:

```txt
Data Quality
→ Betfair Graph partially updated

No Trade Reason
→ Current market observation unavailable because both runner Graphs are not from the same acquisition
```

Le due informazioni sono collegate, ma non identiche.

Il task deve verificare:

* quali reason diventano no-trade reasons;
* quali restano diagnostiche;
* quali sono soltanto informative;
* quali bloccano l’intero output;
* quali bloccano soltanto una condizione.

---

## Versionamento

Ogni logica deve avere una versione esplicita.

Formato consigliato:

```txt
major.minor.patch
```

### Major

```txt
cambia significato dell'output
cambia formula
cambia input obbligatori
cambia classificazione
```

### Minor

```txt
aggiunge una condizione compatibile
aggiunge una reason
aggiunge una osservazione
```

### Patch

```txt
correzione senza cambiare il contratto previsto
```

Ogni risultato deve includere:

```txt
strategyId
strategyVersion
conditionSetVersion
dataQualityVersion, se applicabile
```

Le fixture devono dichiarare quale versione stanno testando.

---

## Confronto tra versioni

Una nuova versione non deve sovrascrivere silenziosamente il comportamento precedente.

Il replay deve poter eseguire:

```txt
stessi input
→ versione precedente
→ nuova versione
→ confronto esplicito
```

Il confronto deve mostrare:

* condizioni cambiate;
* status cambiato;
* reason aggiunte o rimosse;
* osservazioni cambiate;
* dati utilizzati diversamente.

Esempio:

```js
{
  "fromVersion": "1.0.0",
  "toVersion": "1.1.0",
  "changes": [
    {
      "field": "conditions.betfair_ladder_fresh.status",
      "before": "satisfied",
      "after": "not_evaluable"
    }
  ]
}
```

---

## Feature flag e modalità shadow

Una modifica significativa deve poter essere introdotta tramite feature flag.

Esempio:

```txt
STRATEGY_LAY_WINNER_VERSION=1.0.0
```

Quando possibile, una nuova versione può essere eseguita in shadow mode:

```txt
versione attuale
→ output mostrato

nuova versione
→ calcolata offline o in parallelo localmente
→ non mostrata come operativa
→ differenze registrate
```

La modalità shadow non deve:

* modificare scraping;
* aumentare richieste remote;
* modificare persistenza canonica;
* influire sulla UI operativa.

---

## Primo intervento consigliato

Il primo intervento deve rendere esplicito l’output osservativo di `Lay The Winner` o del contratto Strategy esistente.

Non deve tentare di dimostrare che la strategia sia profittevole.

Struttura minima:

```txt
strategy
→ id
→ version
→ level

status
→ available
→ blocked
→ insufficient_data
→ not_applicable
→ unavailable

conditions
→ satisfied
→ not_satisfied
→ not_evaluable
→ not_applicable

observations
→ fatti misurati

dataQuality
→ prerequisiti tecnici

reasons
→ cause precise

provenance
→ tick e versioni utilizzate
```

L’output iniziale deve fermarsi a:

```txt
cosa è osservabile
→ cosa è valutabile
→ cosa manca
→ cosa blocca il risultato
```

---

## Interfaccia frontend

La UI deve mostrare chiaramente:

* nome della classificazione;
* livello A o B;
* versione;
* stato;
* condizioni;
* qualità dati;
* freshness;
* Source Identity;
* integrità;
* motivi di blocco;
* timestamp degli input;
* natura osservativa dell’output.

La UI non deve mostrare:

```txt
entra ora
esci ora
trade sicuro
opportunità garantita
smart money confermato
quota sbagliata
valore certo
profitto atteso certo
```

### Linguaggio consentito

```txt
osservato
condizione soddisfatta
condizione non soddisfatta
non valutabile
dato non aggiornato
dato insufficiente
classificazione descrittiva
```

### Linguaggio da evitare

```txt
segnale sicuro
forte opportunità
mercato informato
movimento certo
trade consigliato
```

### Colori

I colori non devono implicare automaticamente:

```txt
verde
→ entra

rosso
→ esci
```

Se usati, devono rappresentare:

* disponibilità;
* qualità;
* stato della condizione;
* blocco tecnico.

---

## Verifiche richieste

Verificare con precisione:

1. quali dati usa davvero `layTheWinner`;
2. quali dati sono soltanto visualizzati;
3. quali campi derivano da Evidence;
4. quali campi derivano direttamente dalle timeline;
5. quali campi dipendono da runtime effimero;
6. se tali campi possono essere ricostruiti nel replay;
7. se l’output dipende da dati stale;
8. se l’output dipende da Graph non aggiornati;
9. se l’output dipende da un solo Graph;
10. se l’output usa Graph temporalmente disallineati;
11. se l’output può essere prodotto senza Source Identity applicabile;
12. se l’output può essere prodotto con partial persistence;
13. se l’output usa tick tecnicamente invalidi;
14. se l’output usa tick dell’epoch sbagliata;
15. se una risposta tardiva può modificare l’output;
16. se un `noTradeReason` viene confuso con un errore tecnico;
17. se uno stato `blocked` viene confuso con `insufficient_data`;
18. se `not_applicable` viene confuso con errore;
19. se ogni condizione distingue false da non valutabile;
20. se ogni condizione ha una fonte;
21. se ogni osservazione ha un periodo temporale;
22. se ogni output ha una versione;
23. se ogni output ha provenance;
24. se la stessa fixture produce lo stesso output;
25. se lo stesso input produce lo stesso output su due esecuzioni;
26. se la versione precedente resta testabile;
27. se una nuova versione cambia output in modo spiegabile;
28. se il frontend mostra correttamente blocchi e indisponibilità;
29. se il frontend mostra dati vecchi come attuali;
30. se esistono testi UI che promettono più del backend;
31. se colori o icone suggeriscono azioni operative;
32. se un punteggio può essere interpretato come probabilità;
33. se Money Flow viene presentato come intenzione certa;
34. se un movimento quota viene presentato come causa;
35. se ogni regola può essere associata a fixture e versione;
36. se le reason sono stabili e deduplicate;
37. se l’output può essere serializzato senza dati sensibili;
38. se il replay può produrre lo stesso contratto della route live;
39. se la route live e il replay condividono la stessa funzione centrale;
40. se una modifica alla UI può alterare il significato dell’output.

---

## Fixture minime

### 1. Dati completi e coerenti

```txt
SofaScore valido
Betfair valido
Source Identity aligned
freshness fresh
integrità completa
→ osservazione disponibile
```

### 2. SofaScore senza Betfair

```txt
→ osservazioni Sofa-only
→ nessuna attribuzione cross-source
```

### 3. Source Identity pending

```txt
→ output cross-source blocked o not_applicable
→ reason esplicita
```

### 4. Source Identity mismatch

```txt
→ nessuna conclusione cross-source
→ reason mismatch
```

### 5. Source Identity unknown

```txt
→ nessuna assunzione aligned
→ output non applicabile o bloccato
```

### 6. Ladder stale

```txt
→ nessun risultato presentato come attuale
```

### 7. Graph non aggiornato

```txt
→ status blocked
→ reason betfair_graph_not_updated
```

### 8. Un solo Graph aggiornato

```txt
→ partially_updated
→ nessuna osservazione cross-runner completa
```

### 9. Graph temporalmente disallineati

```txt
→ temporally_misaligned
→ condizioni dipendenti dalla simultaneità non valutabili
```

### 10. Valori invariati dopo nuova risposta

```txt
→ dato ancora fresh
→ output non bloccato per falsa stale
```

### 11. Betfair tecnicamente invalido

```txt
→ nessuna classificazione costruita sul tick
```

### 12. Epoch non corretta

```txt
→ tick precedente escluso
→ nessuna informazione futura
```

### 13. Point-by-point assente

```txt
→ condizioni sportive dipendenti dal punto not_evaluable
```

### 14. Partial persistence

```txt
→ output cross-source blocked
→ reason persistence_incomplete
```

### 15. Recovery failed

```txt
→ unavailable
→ reason distinta da stale
```

### 16. Dati completi ma condizioni non soddisfatte

```txt
→ output disponibile
→ condizioni not_satisfied
→ nessuna raccomandazione
```

### 17. Dati insufficienti

```txt
→ insufficient_data
→ reason esplicite
```

### 18. Regola non applicabile

```txt
→ not_applicable
→ nessun errore
```

### 19. Cambio versione algoritmo

```txt
→ output precedente conservato
→ nuovo output confrontabile
```

### 20. Reason duplicate

```txt
→ stessa reason prodotta da più percorsi
→ presentata una sola volta
```

### 21. Risposta tardiva

```txt
→ nessuna modifica all’output della generation corrente
```

### 22. Fixture incompleta

```txt
→ nessun crash
→ unavailable o insufficient_data
```

---

## Scenari minimi di prova

```txt
1. Input completo e allineato
→ output osservativo spiegabile
```

```txt
2. Dato stale
→ blocco esplicito
```

```txt
3. Graph non aggiornato
→ nessun risultato presentato come corrente
```

```txt
4. Nuova risposta con valori invariati
→ output ancora valutabile
```

```txt
5. Un solo Graph aggiornato
→ condizioni cross-runner non valutabili
```

```txt
6. Graph disallineati
→ condizioni simultanee bloccate
```

```txt
7. Source Identity pending
→ nessuna conclusione cross-source
```

```txt
8. Source Identity mismatch
→ nessuna conclusione cross-source
```

```txt
9. Partial persistence
→ output blocked
→ reason specifica
```

```txt
10. Fixture ripetuta
→ output identico
```

```txt
11. Timeline invertita
→ output identico dopo ordinamento
```

```txt
12. Cursore precedente
→ nessuna informazione futura
```

```txt
13. Condizione non soddisfatta
→ nessuna forzatura del risultato
```

```txt
14. Condizione non valutabile
→ distinta da non soddisfatta
```

```txt
15. No Trade Reason presente
→ UI mostra blocco operativo
→ nessuna trasformazione in errore tecnico
```

```txt
16. Nuova versione della regola
→ confronto esplicito
```

```txt
17. Versione sconosciuta
→ unavailable
→ reason strategy_version_unsupported
```

```txt
18. Frontend
→ nessun linguaggio operativo o garantistico
```

---

## Test contrattuali backend/frontend

Il backend deve essere testato sul contratto completo.

Il frontend deve essere testato almeno su:

* `available`;
* `blocked`;
* `insufficient_data`;
* `not_applicable`;
* `unavailable`;
* freshness stale;
* Graph parziale;
* mismatch;
* partial persistence;
* nuova versione.

Verificare che:

```txt
status backend
→ testo UI coerente

reason backend
→ messaggio UI coerente

version backend
→ visibile o disponibile per diagnostica

provenance
→ non espone dati sensibili
```

---

## Intervento atteso

La prima implementazione deve:

1. inventariare il comportamento attuale;
2. distinguere Evidence e Strategy;
3. documentare gli input reali;
4. definire il livello A o B;
5. introdurre un contratto versionato;
6. rendere esplicite le condizioni;
7. distinguere condizioni false e non valutabili;
8. introdurre reason code stabili;
9. includere Data Quality e integrità;
10. includere provenance minima;
11. condividere la funzione centrale tra live e replay;
12. aggiornare il frontend;
13. creare fixture;
14. aggiungere test;
15. verificare che non siano presenti promesse operative.

Non introdurre contemporaneamente:

* un punteggio;
* una probabilità;
* una nuova strategia;
* una raccomandazione;
* una modifica di Money Flow.

---

## Invarianti

```txt
Evidence
→ non equivale a strategia
```

```txt
osservazione
→ non equivale a causalità
```

```txt
volume
→ non equivale a intenzione certa
```

```txt
movimento quota
→ non equivale a informazione certa
```

```txt
classificazione
→ non equivale a probabilità
```

```txt
available
→ non equivale a trade valido
```

```txt
dati stale
→ nessun output presentato come attuale
```

```txt
Graph not_updated
→ nessun nuovo risultato corrente
```

```txt
Graph parziale
→ nessuna combinazione con dati precedenti
```

```txt
Graph disallineati
→ condizioni simultanee non valutabili
```

```txt
Source Identity non applicabile
→ nessuna attribuzione cross-source
```

```txt
partial persistence
→ nessun output cross-source completo
```

```txt
noTradeReasons
→ blocchi operativi
→ non sostituiscono tutta la diagnostica
```

```txt
output
→ spiegabile tramite input, condizioni, versioni e reason
```

```txt
replay
→ stessa funzione centrale del live
```

```txt
versione
→ sempre esplicita
```

---

## Criterio di completamento

Il task è completato quando:

* è definito esplicitamente il livello dell’output;
* la prima implementazione si ferma al livello A o B;
* Evidence e Strategy hanno responsabilità separate;
* ogni input utilizzato è identificabile;
* ogni input ha una fonte;
* ogni condizione ha un ID stabile;
* ogni condizione distingue soddisfatta, non soddisfatta e non valutabile;
* ogni osservazione contiene un dato misurato;
* ogni osservazione contiene un riferimento temporale;
* l’output distingue `available`, `blocked`, `insufficient_data`, `not_applicable` e `unavailable`;
* dati stale bloccano le condizioni che richiedono attualità;
* Graph non aggiornati non producono un nuovo risultato;
* un solo Graph aggiornato non viene combinato con dati precedenti;
* Graph disallineati bloccano le condizioni che richiedono simultaneità;
* Source Identity è un prerequisito esplicito per il cross-source;
* `unknown` non viene trasformato in `aligned`;
* tick tecnicamente invalidi non vengono usati;
* tick di epoch precedenti vengono esclusi;
* partial persistence resta distinta da stale, missing e mismatch;
* recovery failed produce uno stato esplicito;
* ogni risultato contiene reason comprensibili;
* ogni reason ha un codice machine-readable;
* reason duplicate vengono eliminate;
* ogni risultato contiene strategy ID e versione;
* ogni risultato contiene provenance sufficiente;
* live e replay usano la stessa logica centrale;
* la stessa fixture produce sempre lo stesso output;
* versioni precedenti restano testabili;
* una nuova versione è confrontabile con la precedente;
* frontend e backend condividono la stessa semantica degli stati;
* il frontend non mostra testi operativi o garantistici;
* colori e icone non implicano automaticamente ingresso o uscita;
* Money Flow non viene presentato come intenzione certa;
* movimenti di quota non vengono presentati come causalità;
* non vengono introdotte fair odds;
* non vengono introdotte probabilità predittive;
* non vengono introdotte raccomandazioni `back` o `lay`;
* non vengono introdotti ordini automatici;
* esistono fixture per tutti i blocchi principali;
* esistono test backend;
* esistono test frontend;
* almeno una regressione di versione viene intercettata;
* almeno una regressione sulla freshness viene intercettata;
* almeno una regressione su Source Identity viene intercettata;
* almeno una regressione su integrità persistente viene intercettata;
* l’output finale resta osservativo, trasparente e verificabile.

# 6. COMPLETATO Integrità persistente, commit multi-file e recovery dopo crash

## Stato di validazione

**Implementato e verificato offline sul codice e sulle suite mirate disponibili.**

La persistenza correlata di history e timeline SofaScore/Betfair utilizza ora un protocollo esplicito di commit multi-file con journal persistente, `commitId` condiviso, recovery idempotente al riavvio e propagazione dello stato di integrità verso API, Evidence e frontend.

La verifica ha incluso ispezione dei percorsi reali di scrittura, failure injection, retry, deduplicazione, recovery, contratti HTTP e gestione frontend degli stati `partial_persistence` e `recovery_failed`.

Non è stata eseguita una sessione live completa con browser, feed SofaScore e mercato Betfair reale. Non è stata inoltre eseguita una singola suite end-to-end denominata `recoveryIntegration`, `persistenceIntegrity` o `integrityIntegration`: tali file non esistono nel progetto. La copertura è distribuita tra le suite dedicate a journal, updater, recovery, route, Evidence e hook frontend.

I test sono stati verificati nell’ambiente disponibile con Node.js `v22.16.0`. Non viene attribuita una verifica eseguita con Node.js `24.11.1`.

## Intervento eseguito

È stato introdotto un protocollo di persistenza che impedisce a un aggiornamento multi-file incompleto di essere trattato come completato.

Sono stati implementati:

* risultati strutturati per i writer di history e timeline;
* discovery deterministica del file history;
* distinzione tra history assente, JSON invalido, errore di lettura ed errore di discovery;
* journal persistente sotto la directory canonica dei dati;
* scrittura atomica del journal tramite file temporaneo e rename;
* identificatore `commitId` stabile e condiviso tra journal, history, tick canonico, writer e risultato;
* commit coordinato di history e timeline per SofaScore;
* commit coordinato di history e timeline canonica per Betfair;
* marker separati di completamento per ogni documento;
* mantenimento del journal quando un documento non viene completato;
* recovery selettiva dei soli documenti mancanti;
* verifica dei target canonici prima della rimozione del journal;
* stato interno di integrità per evento e source;
* recovery bootstrap prima dell’apertura della porta HTTP;
* propagazione additiva dell’integrità nelle API Match e Betfair;
* propagazione dell’integrità in Evidence e Data Quality;
* blocco delle osservazioni cross-source quando la persistenza canonica è incompleta;
* gestione frontend esplicita dei conflitti HTTP `409`.

## Contratti dei writer e discovery history

Le primitive di persistenza restituiscono esiti strutturati e non comunicano più il successo tramite valori ambigui come:

```text
undefined
null
path semplice
errore presente soltanto nei log
```

I risultati distinguono almeno:

```text
written
unchanged
failed
```

e contengono source, event ID, reason e target interessato.

Le scritture canoniche continuano a usare:

```text
documento completo in memoria
→ file temporaneo nella stessa directory
→ rename sul file canonico
```

Un errore di scrittura o rename non deve essere interpretato come successo e non autorizza il caller a proseguire con il documento successivo.

La discovery della history:

* esclude i file `sofa_*`;
* esclude i file `betfair_*`;
* ignora i file temporanei;
* non confonde event ID con prefissi comuni;
* usa un ordinamento deterministico;
* conserva la compatibilità con i nomi history esistenti.

La lettura strutturata distingue:

```text
found
missing
invalid_json
read_failed
discovery_failed
```

Una nuova history può essere creata soltanto in caso di `missing`. Una history corrotta o illeggibile non viene trattata come inesistente e non viene sovrascritta automaticamente.

## Journal persistente e stato di integrità

Ogni aggiornamento coordinato viene registrato prima delle scritture canoniche in un journal sidecar:

```text
backend/match_history/.pending_commits/
```

Il record contiene:

```text
commitId
eventId
source
createdAt
status
target history
payload history
marker history.completed
target timeline
payload timeline
marker timeline.completed
reason
```

Il journal non è un documento business:

* non è una history;
* non è una timeline;
* non viene letto dai normali reader dei dati;
* non viene utilizzato come fonte di Evidence;
* non sostituisce i file canonici.

Le mutazioni del journal sono atomiche. Un aggiornamento fallito lascia il record precedente invariato quando possibile e non produce un falso completamento.

Lo stato read-only di integrità distingue:

```text
no_known_partial
partial_persistence
recovery_failed
```

e può esporre:

```text
source
commitId
affectedDocuments
reason
```

`affectedDocuments` è limitato ai documenti canonici:

```text
history
timeline
```

Un journal completo può essere eliminato soltanto dopo aver verificato che entrambi i target canonici esistano e corrispondano al commit registrato. Se un target manca o non è valido, il relativo marker viene riaperto e il documento viene ricostruito dal payload journalizzato.

## Commit SofaScore

Il commit SofaScore segue questo ordine:

```text
creazione journal pending
→ scrittura history
→ marker history completata
→ scrittura timeline SofaScore
→ marker timeline completata
→ verifica dei target canonici
→ rimozione journal
```

Il medesimo `commitId` viene propagato in:

```text
journal
history row
tick SofaScore
writer history
writer timeline
risultato sofa_commit
```

In caso di failure della history:

```text
timeline non tentata
→ journal mantenuto
→ risultato failed
```

In caso di failure della timeline:

```text
history già completata
→ journal mantenuto
→ retry della sola timeline
```

Il retry usa il documento già salvato nel journal:

* non genera una nuova history row;
* non genera un nuovo tick;
* non assegna un nuovo `commitId`;
* non ricostruisce il payload usando uno stato runtime successivo.

Un risultato mancante, `undefined` o con envelope incompleto viene normalizzato come fallimento e non apre la registrazione Betfair del bootstrap.

`localContext` può essere conservato nel tick SofaScore quando previsto, ma resta fuori dalla history aggregata e dal campione usato per la Source Identity.

## Commit Betfair

Il processor Betfair è l’owner del commit canonico coordinato di:

```text
history aggregata
+
timeline Betfair canonica
```

La preparazione della history non esegue una seconda scrittura autonoma e non crea un owner concorrente.

Il commit Betfair:

* genera un solo `commitId`;
* inserisce lo stesso valore nella history row e nel tick;
* conserva `selectionId`;
* conserva separatamente i totali matched necessari;
* assegna una sequence canonica stabile;
* registra nel journal i documenti completi da riparare;
* aggiorna lo stato runtime soltanto dopo `complete` o `recovered`.

Prima di classificare un nuovo sample come duplicato, regressivo o tecnicamente inutilizzabile, il processor verifica la presenza di un journal incompleto.

Quando esiste un journal:

```text
nuovo sample
→ non genera un nuovo commit
→ non genera una nuova sequence
→ non sostituisce il payload pending
→ avvia la repair del commit esistente
```

La repair è duplicate-aware:

* riscrive soltanto i documenti incompleti;
* mantiene lo stesso `commitId`;
* mantiene la stessa history preparata;
* mantiene lo stesso tick e la stessa sequence;
* non duplica history o timeline;
* può completarsi anche se il nuovo sample ricevuto non sarebbe utilizzabile per creare un nuovo commit.

In assenza di journal incompleto:

```text
duplicate_tick
→ unchanged

regressive_sample
→ unchanged
```

La timeline legacy Betfair resta separata dalla timeline canonica. Non viene usata per recovery, Evidence, API canoniche o stato di integrità. Un errore del cleanup legacy può essere esposto come warning, ma non rende fallito un commit canonico già completato.

La proprietà derivata `latest` non viene persistita nel documento canonico usato dal commit.

## Recovery e avvio backend

All’avvio del backend viene eseguita una scansione dei journal prima di `app.listen(...)`.

Il server separa:

```text
creazione applicazione Express
avvio effettivo del listener
```

L’importazione del modulo server non apre automaticamente la porta.

La recovery:

1. legge i journal verificabili;
2. identifica i documenti incompleti;
3. usa esclusivamente i payload persistiti nel journal;
4. riscrive soltanto history o timeline mancanti;
5. verifica target e `commitId`;
6. aggiorna i marker;
7. rimuove il journal soltanto dopo verifica completa.

Un errore irreversibile o un journal non riparabile viene registrato come:

```text
recovery_failed
```

e resta osservabile.

Una failure fatale della scansione o della recovery impedisce l’avvio del listener. Il backend non deve accettare richieste presentando come coerente uno stato che non è riuscito nemmeno a verificare.

## API Match e Betfair

Le API espongono l’integrità come informazione additiva.

Per una risorsa esistente:

```text
HTTP 200
→ payload invariato
→ blocco integrity aggiunto
```

Per una risorsa realmente assente senza commit parziale noto:

```text
HTTP 404
→ comportamento precedente preservato
```

Per una risorsa assente collegata a un commit incompleto:

```text
HTTP 409
error: persistence_integrity
→ integrity.partial_persistence
oppure
→ integrity.recovery_failed
```

Le API Match usano la source `sofa`.

Le API Betfair usano la source `betfair` e mantengono `integrity` separata da:

```text
health
freshness
graph health
stato CDP
ladder
runtime dello scraper
```

Una persistenza incompleta non trasforma artificialmente una sessione sana in stale, non simula un errore di login e non modifica la classificazione tecnica del feed.

## Evidence, Data Quality e no-trade reasons

Evidence aggrega separatamente l’integrità SofaScore e Betfair.

Il risultato espone:

```text
integrity.status
integrity.reason
integrity.affectedSources
integrity.sources.sofa
integrity.sources.betfair
```

Quando non esiste un commit parziale noto:

```text
persistenceComplete = true
```

Quando esiste `partial_persistence` o `recovery_failed`:

```text
persistenceComplete = false
```

La persistenza incompleta blocca l’uso cross-source dei dati canonici:

* runner Betfair non attribuiti al match;
* Market Reactions non disponibili;
* finestre cross-source non costruite;
* `causalityClaimed` resta `false`;
* viene aggiunta una no-trade reason esplicita.

Reason utilizzata:

```text
Persistence incomplete: canonical cross-source evidence unavailable
```

Restano indipendenti:

* freschezza SofaScore;
* freschezza Betfair;
* graph health;
* affidabilità della ladder;
* validità del Money Flow;
* stato live del mercato;
* Source Identity.

La Source Identity non viene riscritta a causa della persistenza. Può quindi restare:

```text
aligned
pending
mismatch
```

mentre l’uso cross-source viene sospeso separatamente.

La route Evidence conserva i propri status HTTP esistenti e aggiunge il blocco `integrity` alle risposte disponibili o mancanti. Non avvia recovery e non modifica file durante una richiesta.

## Frontend

Gli hook frontend Match e Betfair riconoscono il conflitto:

```text
HTTP 409
error: persistence_integrity
```

senza trattarlo come un errore generico di rete.

Il polling Match distingue:

```text
404
→ waiting

409 partial_persistence
→ partial_persistence

409 recovery_failed
→ recovery_failed
```

Il polling Betfair gestisce sia:

```text
/api/betfair/:eventId/latest
```

sia il fallback:

```text
/api/betfair/:eventId/json
```

In presenza di conflitto:

* il dato incompleto non viene presentato come valido;
* il blocco `integrity` viene conservato;
* l’eventuale health Betfair resta disponibile;
* l’errore generico viene lasciato vuoto;
* il polling può continuare e osservare una futura recovery.

I payload `200` privi del nuovo campo restano compatibili: `integrity` viene trattata come opzionale.

## Invarianti preservati

Non sono stati modificati:

* formato generale delle history e timeline esistenti, salvo i campi additivi necessari al commit;
* scrittura atomica del singolo JSON;
* naming canonico dei file;
* deduplicazione SofaScore;
* classificazione duplicate/regressive Betfair;
* sequence canonica Betfair;
* semantica di freshness;
* health Betfair;
* parsing quote e ladder;
* calcolo del Money Flow;
* lifecycle funzionale dello scraper;
* Source Identity automatica;
* conferma manuale e revoca Source Identity;
* epoch Betfair;
* logica sportiva;
* Market Reactions, salvo il blocco prudenziale quando la persistenza è incompleta;
* contratti legacy `404` quando non esiste un partial noto;
* strategia Lay The Winner;
* Chrome/CDP;
* launcher;
* cache e retention;
* file business esistenti durante la verifica.

## Verifica effettuata

Sono stati controllati i moduli di:

```text
storage e discovery history
timeline store
journal
commit SofaScore
commit Betfair
tracker e bootstrap
Source Identity Gate
recovery
server
API Match
API Betfair
Evidence
Data Quality
no-trade reasons
hook Match
hook Betfair
```

Tra le suite eseguite con esito positivo durante la verifica:

```text
timelineStore.test.mjs
→ 38 test superati

commitJournal.test.mjs
→ 88 test superati

sofaUpdates.test.mjs
→ 28 test superati

betfairUpdates.test.mjs
→ 14 test superati

readResponses.test.mjs
→ 38 asserzioni superate

latestPayloadResponse.test.mjs, latestPayloadIntegrity.test.mjs, betfairJsonResponse.test.mjs, normalizeIntegrity.test.mjs
→ 80 asserzioni superate

dataQuality.test.mjs
→ 17 asserzioni superate

noTradeReasons.test.mjs
→ 10 asserzioni superate

evidenceResponses.test.mjs
→ 14 test superati

useMatchPolling.test.mjs
→ suite superata

useBetfairJson.test.mjs
→ 10 test superati
```

Sono stati inoltre eseguiti controlli `node --check` sui principali file JavaScript ricevuti, senza errori sintattici.

Le suite verificano, tra gli altri, questi scenari:

```text
history assente
history corrotta
rename fallito
target errato
commitId errato
writer undefined
history completata e timeline fallita
retry senza nuova history
retry senza nuovo tick
repair duplicate-aware
journal completo residuo
target canonico mancante dopo marker completato
recovery_failed
risorsa presente con integrity additiva
risorsa assente con 404
risorsa assente con 409
Evidence bloccata con tick ancora fresco
Source Identity preservata
frontend consapevole dei 409
```

La verifica non attribuisce:

* una singola suite end-to-end recovery → API → Evidence;
* una prova live/replay completa;
* un test su filesystem reale dell’intero ciclo journal con crash fisico;
* una prova con più processi backend concorrenti sulla stessa directory;
* un’esecuzione su Node.js `24.11.1`.

## Stato finale

La Task 6 è conclusa nel perimetro dell’architettura backend attuale.

Un aggiornamento multi-file incompleto non viene più trattato come successo silenzioso. Il journal conserva il commit necessario alla repair, la recovery viene eseguita prima dell’ascolto HTTP, API ed Evidence rendono osservabile lo stato parziale e il frontend distingue i conflitti di persistenza dagli errori tecnici ordinari.

Il protocollo protegge il modello single-process attualmente verificato. Un’eventuale futura architettura con più processi che scrivono contemporaneamente nella stessa directory richiederà una decisione separata su lock o creazione esclusiva cross-process.

Una futura validazione controllata live o replay può confermare il comportamento nell’ambiente reale, ma non modifica il contratto implementato e verificato offline.

## Escluso da questa task

Restano fuori dalla Task 6:

* database o transazioni distribuite;
* lock cross-process o coordinamento tra più backend writer;
* code generiche;
* nuove dipendenze infrastrutturali;
* migrazioni o cancellazioni automatiche dei dati canonici;
* ricostruzione di dati mancanti a partire da stato runtime non journalizzato;
* modifiche alla semantica sportiva;
* modifiche alla classificazione Source Identity;
* modifiche a Money Flow, graph health, ladder o quote;
* nuove strategie o segnali;
* modifiche alla strategia Lay The Winner;
* replay offline e backtesting;
* verifiche live con credenziali, cookie, token o profili browser reali;
* retention e cleanup, già trattati separatamente nella Task 3.

# 7. Audit concorrenza, stop, generazioni e idempotenza runtime

## Stato attuale

Il tracking live comprende più flussi asincroni e più livelli di stato:

```txt
route start
→ creazione tracker
→ scheduler
→ aggiornamento SofaScore
→ scraper Betfair
→ normalizzazione e validazione
→ Source Identity
→ persistenza
→ endpoint backend
→ polling frontend
→ stop, untrack o mismatch
```

Sono già documentati e parzialmente implementati:

* stop globale;
* stop o untrack di un singolo evento;
* mismatch Source Identity;
* timeout degli scraper;
* deduplicazione degli scraper Betfair attivi;
* persistenza differita;
* terminazione dei processi scraper figli;
* prevenzione della sovrapposizione tramite flag runtime;
* retry dopo errori tecnici.

Non è stato confermato un bug di concorrenza.

Questo task è un audit preventivo e deve verificare che eventi tardivi, doppio avvio, timeout, stop durante una richiesta o cambio di sessione non possano:

* produrre tick dopo la chiusura del tracking;
* persistere dati appartenenti a una sessione precedente;
* applicare dati del match precedente al match corrente;
* creare due pipeline concorrenti per lo stesso evento;
* lasciare processi o risorse runtime non più controllati;
* trasformare una risposta tardiva in un aggiornamento valido;
* creare retry sovrapposti;
* riutilizzare pagine Graph con identità non più coerente.

Una futura ottimizzazione potrà mantenere attivi per tutta la sessione:

```txt
processo Python
Playwright
connessione CDP
pagina principale Betfair
pagina Graph del primo runner
pagina Graph del secondo runner
```

Il task non deve implementare preventivamente questa architettura, ma deve verificare e fissare le garanzie runtime necessarie affinché possa essere introdotta in sicurezza.

---

## Obiettivo

Verificare che il runtime mantenga comportamenti:

```txt
idempotenti
→ una stessa azione ripetuta non produce effetti aggiuntivi indesiderati

serializzati
→ una sola operazione mutante attiva per pipeline logica

invalidabili
→ stop, mismatch o nuova sessione rendono inutilizzabili i risultati precedenti

attribuibili
→ ogni risultato appartiene a eventId, sessione e comando corretti

recuperabili
→ timeout ed errori non lasciano stato bloccato

osservabili
→ frontend e diagnostica distinguono gli stati transitori
```

L’audit deve coprire la sovrapposizione di:

* start ripetuti;
* start dello stesso `eventId`;
* start di un nuovo match mentre il precedente è attivo;
* stop durante una richiesta SofaScore;
* stop durante uno scrape Betfair;
* risposta scraper arrivata dopo stop;
* risposta scraper arrivata dopo mismatch;
* risposta scraper arrivata dopo un nuovo start;
* untrack di un singolo evento;
* stop globale;
* timeout e retry;
* perdita del collegamento CDP;
* cambio di Source Identity;
* due aggiornamenti ravvicinati dello stesso evento;
* terminazione ripetuta degli scraper;
* eventuale worker Python persistente;
* eventuale riuso delle pagine Graph;
* aggiornamento di un solo Graph su due;
* cambio di mercato con risorse del mercato precedente ancora aperte.

---

## Modello di identità runtime

Ogni sessione di tracking deve avere un’identità logica distinta.

Il solo `eventId` non è sufficiente perché lo stesso evento può essere:

```txt
avviato
→ fermato
→ avviato nuovamente
```

Una risposta appartenente alla prima sessione non deve essere valida nella seconda.

Il task deve valutare o introdurre un modello equivalente a:

```js
{
  eventId,
  generationId,
  sessionId,
  commandId,
  source,
  startedAt
}
```

Non è obbligatorio usare entrambi `generationId` e `sessionId` se rappresentano la stessa identità. È obbligatorio, invece, disporre di un identificatore che cambi a ogni nuova sessione logica.

### Generation ID

```txt
nuovo start
→ nuova generation

stop
→ generation invalidata

untrack
→ generation invalidata

mismatch terminale
→ generation invalidata per la persistenza

nuovo start dello stesso eventId
→ generation precedente non più utilizzabile
```

### Command ID

Ogni richiesta asincrona deve avere un identificatore univoco:

```txt
aggiornamento SofaScore
→ commandId

scrape Betfair
→ commandId

eventuale comando al worker persistente
→ commandId
```

Una risposta è applicabile soltanto se:

```txt
eventId corrisponde
generationId è ancora attivo
commandId è ancora il comando atteso
tracker non è stopping o stopped
Source Identity consente il passaggio previsto
```

### Identità del mercato e dei Graph

Per Betfair, la validazione deve includere:

```txt
eventId applicativo
market key
marketId, se disponibile
URL mercato normalizzato
selectionId dei runner
identità runner attesa
Graph URL atteso
generationId
```

Una pagina Graph aperta nella generation precedente non può essere utilizzata automaticamente dalla generation successiva.

---

## Stati runtime espliciti

Il task deve verificare se lo stato attuale è sufficientemente esplicito oppure se serva un modello simile a:

```txt
idle
starting
running
stopping
stopped
failed
mismatch
```

Per le singole sorgenti:

```txt
sofa
→ idle
→ updating
→ failed
→ stopped

betfair
→ idle
→ updating
→ timed_out
→ reconnecting
→ failed
→ stopped
```

Gli stati devono impedire transizioni incompatibili.

Esempi:

```txt
stopping
→ non accetta un nuovo update della stessa generation

stopped
→ non persiste risultati tardivi

mismatch
→ non persiste nuovi dati cross-source

reconnecting
→ non avvia una seconda riconnessione concorrente

updating Betfair
→ non avvia un secondo comando Betfair
```

Non è obbligatorio esporre tutti questi valori pubblicamente. È obbligatorio che la logica runtime distingua in modo affidabile le condizioni equivalenti.

---

## Obiettivo rispetto al futuro worker persistente

Una futura Task 9 potrà introdurre un worker Python persistente.

Prima di farlo, questo task deve assicurare che:

```txt
un solo comando mutante
→ attivo nel worker per volta

ogni comando
→ associato a generationId e commandId

risposta tardiva
→ scartata se generation o comando non sono più validi

stop
→ invalida il comando attivo prima del cleanup

timeout
→ invalida il comando prima del retry

nuovo start
→ non riutilizza lo stato logico della sessione precedente

worker bloccato
→ terminabile senza chiudere Chrome esterno
```

L’ownership del processo worker è definita nella Task 2.

Questa task riguarda esclusivamente il comportamento runtime dopo che il worker è stato avviato.

---

## Confini

Questo task riguarda:

* lifecycle dei tracker;
* `matchTracker`;
* scheduler principale;
* aggiornamenti SofaScore;
* aggiornamenti Betfair;
* lifecycle e runner dello scraper Betfair;
* callback Source Identity;
* route start, stop e untrack;
* route o servizi che espongono stato runtime;
* persistenza successiva agli aggiornamenti;
* invalidazione delle richieste tardive;
* timeout;
* retry;
* cleanup degli scraper figli;
* eventuale protocollo Node/Python;
* eventuale worker Python persistente;
* eventuale connessione Playwright/CDP persistente;
* eventuale riuso delle pagine Betfair e Graph;
* stato runtime effimero;
* test su stop, timeout, mismatch, doppio start e cambio match;
* diagnostica strutturale del lifecycle.

Questo task non deve:

* cambiare la classificazione Source Identity;
* modificare le regole di validità tecnica Betfair;
* modificare Money Flow;
* modificare il parsing delle ladder, salvo eventuali adattamenti minimi per associare identità runtime;
* introdurre nuove strategie;
* modificare la retention;
* modificare la semantica della persistenza canonica definita nella Task 6;
* aumentare la frequenza di polling;
* introdurre più match contemporanei;
* introdurre più scrape Betfair concorrenti;
* implementare in modo definitivo il worker persistente se l’audit non lo richiede;
* assumere che esista una race condition prima di averla dimostrata;
* chiudere Chrome esterno;
* introdurre retry aggressivi;
* modificare login o sessione Betfair;
* riutilizzare dati Graph precedenti come nuovi campioni.

---

## Materiale da fornire nella chat operativa

Per rendere il task preciso servono:

* `matchTracker.js`;
* tracker update SofaScore;
* tracker update Betfair;
* scheduler principale;
* lifecycle o runner dello scraper Betfair;
* bridge Node/Python;
* route start;
* route stop;
* route untrack;
* route di stop globale;
* callback Source Identity in caso di alignment, pending e mismatch;
* funzioni che terminano gli scraper figli;
* gestione timeout e retry;
* funzioni di persistenza invocate dopo gli update;
* eventuali Map o registry degli scraper attivi;
* eventuali flag `updatingSofa`, `updatingBetfair` e `betfairFinished`;
* runtime health per `eventId`;
* test di stop, timeout, mismatch e doppio start;
* test di persistenza tardiva, se esistenti;
* log redatti di:

  * evento avviato;
  * evento fermato durante scrape;
  * evento riavviato;
  * timeout;
  * mismatch;
* eventuali contatori o stato runtime per `eventId`;
* contratti attuali di ritorno dello scraper;
* eventuali modalità di riuso della pagina CDP;
* modalità con cui si identifica il mercato e i runner;
* modalità con cui il frontend apprende che il tracking è stato fermato.

Per preparare il futuro worker, se già esistono prototipi o helper, fornire anche:

* protocollo stdin/stdout o socket;
* funzioni di avvio e terminazione;
* gestione command ID;
* cleanup delle pagine;
* riconnessione CDP.

Non servono:

* cookie;
* token;
* credenziali;
* profilo Chrome;
* dump completi;
* payload raw non redatti.

---

## Verifiche richieste

Verificare con precisione:

1. se due start dello stesso `eventId` possono creare due tracker;
2. se due start ravvicinati possono creare due scheduler;
3. se uno start dello stesso evento riusa, sostituisce o duplica lo stato precedente;
4. se uno start di un nuovo evento invalida correttamente quello precedente;
5. se un tracker fermato può ancora ricevere una risposta tardiva;
6. se una risposta tardiva SofaScore può aggiornare lo stato runtime dopo stop;
7. se una risposta tardiva Betfair può aggiornare lo stato runtime dopo stop;
8. se una risposta tardiva può persistere un tick dopo stop;
9. se una risposta tardiva può persistere un tick dopo untrack;
10. se una risposta tardiva può persistere un tick dopo mismatch;
11. se una risposta della generation precedente può essere applicata dopo un nuovo start;
12. se ogni aggiornamento può essere associato a una generation attiva;
13. se ogni comando asincrono può essere associato a un command ID;
14. se mismatch ferma tutti i tracker previsti senza eliminare lo stato mismatch causale;
15. se mismatch invalida le persistenze tardive già in volo;
16. se stop globale e untrack individuale hanno effetti chiaramente distinti;
17. se stop di un singolo evento può interferire con altri eventi eventualmente presenti;
18. se un timeout può sovrapporsi a un nuovo scrape;
19. se un retry può partire prima della conclusione effettiva del processo precedente;
20. se un processo terminato tramite timeout può comunque emettere una risposta utilizzabile;
21. se retry e deduplicazione impediscono persistenze duplicate;
22. se gli scraper figli vengono terminati una sola volta;
23. se la terminazione ripetuta dello stesso processo è sicura;
24. se `SIGTERM` seguito da escalation può colpire solo il processo atteso;
25. se la callback `close` del processo può essere eseguita dopo il timeout e modificare nuovamente lo stato;
26. se una promise già rifiutata o risolta può produrre un secondo effetto;
27. se lo stato runtime viene ripulito quando un errore interrompe il flusso;
28. se tracker, registry e flag vengono ripuliti anche durante eccezioni;
29. se un errore di persistenza lascia la pipeline bloccata in `updating`;
30. se il frontend può leggere uno stato temporaneamente incoerente dopo stop;
31. se il frontend può continuare a mostrare il tracking come attivo dopo invalidazione;
32. se l’endpoint runtime distingue running, stopping e stopped;
33. se una perdita CDP avvia più riconnessioni contemporanee;
34. se la riconnessione CDP può sovrapporsi a un nuovo start;
35. se la riconnessione riutilizza soltanto la generation ancora attiva;
36. se il fallimento CDP lascia pagine o oggetti Playwright non più validi nel registry;
37. se le pagine Graph riutilizzate appartengono ancora al mercato corretto;
38. se una pagina Graph del match precedente può essere letta nel match successivo;
39. se URL, marketId e `selectionId` vengono verificati prima della persistenza;
40. se un solo Graph aggiornato può essere combinato con il Graph precedente dell’altro runner;
41. se un aggiornamento Graph tardivo può sovrascrivere un aggiornamento successivo;
42. se due Graph possono essere associati a command ID differenti nello stesso campione;
43. se un futuro worker persistente può accettare due comandi contemporanei;
44. se un futuro worker non responsivo può essere terminato senza chiudere Chrome;
45. se la terminazione del worker lascia il backend in uno stato recuperabile;
46. se il worker può essere riavviato senza riutilizzare risorse logiche della generation precedente;
47. se il cleanup di browser context e pagine è idempotente;
48. se lo stop invocato più volte produce sempre lo stesso risultato;
49. se stop e mismatch concorrenti producono uno stato finale deterministico;
50. se eventuali race condition possono essere riprodotte con test controllati e non soltanto osservate occasionalmente.

---

## Invarianti runtime

Il task deve preservare o introdurre garanzie equivalenti alle seguenti.

### Una sola pipeline attiva

```txt
eventId + generationId
→ una sola pipeline logica attiva
```

Con l’attuale vincolo di un solo match:

```txt
tracker globale
→ una sola generation attiva
```

### Una sola operazione Betfair attiva

```txt
generation
→ massimo un comando Betfair attivo
```

### Invalidazione

```txt
stop
→ invalida generation
→ invalida command ID attivi
→ impedisce persistenza tardiva
```

```txt
untrack
→ invalida la generation dell'evento
→ impedisce persistenza tardiva
```

```txt
mismatch
→ invalida i risultati cross-source tardivi
→ conserva il gate mismatch causale
```

```txt
nuovo start
→ crea nuova generation
→ invalida la precedente
```

### Persistenza

```txt
risposta scraper
→ persistibile solo se generation e command ID sono ancora validi
```

```txt
persistenza iniziata prima dello stop
→ deve essere gestita secondo policy esplicita
→ nessun nuovo commit deve iniziare dopo invalidazione
```

Se una scrittura canonica è già iniziata e non può essere annullata atomicamente, il comportamento deve essere coordinato con la Task 6 e documentato esplicitamente.

### Retry

```txt
retry
→ soltanto dopo completamento o invalidazione certa del comando precedente
```

```txt
timeout
→ invalida comando
→ cleanup
→ eventuale retry successivo
```

### Cleanup

```txt
cleanup
→ idempotente
→ sicuro se invocato più volte
```

```txt
cleanup worker
→ non chiude Chrome esterno
```

```txt
cleanup pagine
→ non rende valide risposte già in volo
```

### Pagine Graph

```txt
pagina Graph riutilizzata
→ identità mercato verificata
→ identità runner verificata
→ generation verificata
```

```txt
DOM precedente
→ non diventa un nuovo campione
```

```txt
cambio match
→ pagine precedenti invalidate, chiuse o riconfigurate esplicitamente
```

---

## Politica sulle risposte tardive

Ogni callback asincrona deve verificare la validità runtime immediatamente prima di:

* aggiornare lo stato;
* modificare contatori;
* osservare Source Identity;
* persistere;
* modificare health;
* segnare Betfair come terminato;
* esporre un nuovo latest.

Esempio concettuale:

```js
if (!isGenerationActive(eventId, generationId)) {
    return {
        ok: false,
        skipped: true,
        reason: 'stale_generation'
    };
}

if (!isCommandActive(commandId)) {
    return {
        ok: false,
        skipped: true,
        reason: 'stale_command'
    };
}
```

La verifica effettuata soltanto all’inizio dello scrape non è sufficiente.

Deve essere ripetuta prima dell’effetto mutante finale.

---

## Politica sullo stop

Lo stop deve seguire un ordine deterministico:

```txt
1. marcare generation come stopping o invalidata
2. impedire nuovi aggiornamenti
3. invalidare command ID attivi
4. rimuovere o disattivare tracker
5. terminare scraper o worker owned
6. attendere cleanup limitato da timeout
7. marcare stopped
8. esporre stato finale coerente
```

Lo stop non deve:

* attendere indefinitamente;
* lasciare il tracker visibile come running;
* consentire nuove persistenze;
* eliminare lo stato mismatch causale da preservare;
* chiudere Chrome esterno;
* terminare un processo non owned.

---

## Politica sulla riconnessione CDP

La perdita CDP deve produrre:

```txt
errore tecnico
→ nessuna persistenza del campione incompleto

una sola riconnessione controllata
→ per generation

backoff
→ nessun loop immediato

generation ancora attiva
→ riconnessione consentita

generation invalidata
→ riconnessione annullata
```

Una connessione ristabilita deve verificare nuovamente:

* browser corretto;
* pagina mercato;
* market ID;
* URL;
* runner;
* pagine Graph;
* sessione logica.

Non deve assumere che gli oggetti Playwright precedenti siano ancora validi.

---

## Politica per il futuro worker persistente

Il worker deve essere trattato come un esecutore seriale.

Protocollo minimo concettuale:

```js
{
  type: 'scrape',
  eventId,
  generationId,
  commandId,
  marketUrl,
  graphUrls,
  timeoutMs
}
```

Risposta minima:

```js
{
  eventId,
  generationId,
  commandId,
  ok,
  result,
  error
}
```

Regole:

```txt
command ID sconosciuto
→ risposta ignorata

generation non attiva
→ risposta ignorata

comando già completato
→ seconda risposta ignorata

worker busy
→ nessun secondo comando concorrente

worker timeout
→ comando invalidato
→ worker terminato o recuperato secondo policy

nuovo worker
→ nuovo instanceId
→ nessuna risposta del worker precedente accettata
```

L’eventuale `workerInstanceId` è consigliato per distinguere risposte o eventi provenienti da processi differenti.

---

## Scenari minimi di prova

```txt
1. Doppio start dello stesso eventId

→ una sola generation attiva
→ un solo tracker effettivo
→ nessun doppio scheduler
→ nessun doppio scrape
→ nessuna doppia persistenza
```

```txt
2. Due start simultanei dello stesso eventId

→ creazione della sessione serializzata
→ una sola generation vince
→ nessuno stato parziale duplicato
```

```txt
3. Start di un nuovo match durante tracking attivo

→ generation precedente invalidata
→ nuovo tracker coerente
→ nessun dato del match precedente persistito nel nuovo
```

```txt
4. Stop durante scrape Betfair attivo

→ generation invalidata prima del cleanup
→ risposta tardiva ignorata
→ nessun nuovo tick dopo lo stop
→ Chrome lasciato aperto
```

```txt
5. Stop durante update SofaScore

→ risposta tardiva ignorata
→ nessun aggiornamento runtime o persistence dopo stop
```

```txt
6. Mismatch durante aggiornamento

→ stop dei tracker previsto
→ gate mismatch preservato
→ generation invalidata
→ scraper figli terminati
→ risposta tardiva ignorata
```

```txt
7. Untrack di un singolo evento

→ solo evento richiesto fermato
→ generation invalidata
→ altri tracker invariati, se supportati
```

```txt
8. Stop globale

→ tutte le generation invalidate
→ nessuna persistenza tardiva
→ cleanup idempotente
```

```txt
9. Timeout seguito da retry

→ command ID precedente invalidato
→ nessun overlap
→ retry avviato soltanto dopo cleanup
→ nessun tick duplicato
```

```txt
10. Timeout e callback close successiva

→ close tardiva non modifica stato già finalizzato
→ promise risolta o rifiutata una sola volta
```

```txt
11. Start, stop e start ravvicinati

→ nuova generation
→ nessun riferimento alla generation precedente
→ risposta precedente ignorata
```

```txt
12. Risposta vecchia dopo nuovo start

→ eventId uguale
→ generation diversa
→ risposta scartata
→ nessuna persistenza
```

```txt
13. Stop invocato due volte

→ stesso stato finale
→ nessuna eccezione
→ nessuna doppia terminazione problematica
```

```txt
14. Stop e mismatch quasi simultanei

→ stato finale deterministico
→ mismatch causale preservato quando previsto
→ cleanup eseguito una sola volta logicamente
```

```txt
15. Perdita CDP durante scrape

→ errore tecnico esplicito
→ nessun tick incompleto
→ una sola riconnessione controllata
```

```txt
16. Perdita CDP seguita da stop

→ riconnessione annullata
→ nessun nuovo comando
→ stato stopped
```

```txt
17. Cambio match con pagine Graph aperte

→ pagine precedenti invalidate o chiuse
→ identità mercato verificata
→ nessun dato del mercato precedente
```

```txt
18. Solo Graph 1 aggiornato

→ nessuna fusione con Graph 2 della richiesta precedente
→ campione degradato o rifiutato secondo policy
```

```txt
19. Graph 1 della richiesta precedente arriva dopo Graph 1 successivo

→ command ID precedente scartato
→ nessuna sovrascrittura del dato più recente
```

```txt
20. Identità runner diversa da quella attesa

→ campione non persistito
→ reason esplicita
→ nessun aggiornamento silenzioso
```

```txt
21. Worker persistente riceve due comandi

→ un solo comando attivo
→ secondo comando accodato o rifiutato secondo policy
→ nessun overlap
```

```txt
22. Stop durante comando del worker persistente

→ command ID invalidato
→ risposta tardiva ignorata
→ nessun tick persistito
```

```txt
23. Worker non responsivo

→ timeout
→ terminazione controllata
→ Chrome esterno lasciato aperto
→ backend recuperabile
```

```txt
24. Worker riavviato

→ nuovo workerInstanceId
→ risposte del worker precedente ignorate
→ nuova generation coerente
```

```txt
25. Errore di persistenza

→ flag updating ripristinato
→ pipeline non bloccata
→ errore strutturato
→ nessun falso successo
```

```txt
26. Frontend durante stop

→ stato stopping o stopped esplicito
→ nessuna nuova informazione presentata come live
```

---

## Test di race controllati

I test devono poter controllare manualmente il momento in cui una promise viene:

* risolta;
* rifiutata;
* lasciata pendente;
* completata dopo stop;
* completata dopo nuovo start;
* completata dopo timeout;
* completata dopo mismatch.

Usare deferred promise o fake equivalenti.

Esempio concettuale:

```js
const deferred = createDeferred();

const updatePromise = updateBetfair(..., {
    fetchBetfairData: () => deferred.promise
});

stopMatchTracker(eventId);

deferred.resolve(validBetfairResult);

await updatePromise;

assert.equal(persistCalls, 0);
```

Non affidarsi soltanto a `setTimeout()` reali, perché i test devono essere deterministici.

---

## Diagnostica runtime attesa

I log devono consentire di ricostruire il lifecycle senza contenere dati sensibili.

Campi consigliati:

```txt
eventId
generationId
commandId
workerInstanceId, se applicabile
source
action
stateBefore
stateAfter
reason
elapsedMs
processPid
```

Esempi concettuali:

```txt
action=betfair_result_skipped
reason=stale_generation
```

```txt
action=tracker_stopping
reason=manual_stop
```

```txt
action=worker_command_invalidated
reason=timeout
```

```txt
action=cdp_reconnect_skipped
reason=generation_stopped
```

Non registrare:

* URL sensibili completi;
* cookie;
* token;
* credenziali;
* payload integrali;
* Graph URL completi se contengono parametri sensibili;
* stdout o stderr raw non redatti.

---

## Intervento atteso

Modificare il codice soltanto se l’audit mostra:

* una finestra reale di concorrenza;
* una risposta tardiva applicabile;
* un cleanup non idempotente;
* un retry sovrapposto;
* una generation non distinguibile;
* una riconnessione CDP concorrente;
* un possibile riuso del mercato precedente;
* uno stato frontend ambiguo;
* una futura incompatibilità concreta con il worker persistente.

Le correzioni devono essere circoscritte e preferire:

* `generationId`;
* `commandId`;
* controlli di validità prima degli effetti mutanti;
* abort o invalidazione logica;
* state machine minima;
* registry per generation;
* cleanup centralizzato;
* deferred promise nei test;
* risultato strutturato per operazioni ignorate.

Non introdurre una riscrittura completa del runtime se controlli mirati sono sufficienti.

---

## Invarianti da preservare

```txt
Source Identity
→ classificazione invariata
```

```txt
mismatch
→ stato causale preservato
```

```txt
validità tecnica Betfair
→ regole invariate
```

```txt
persistenza canonica
→ contratti Task 6 preservati
```

```txt
un solo match
→ comportamento attuale preservato
```

```txt
un solo scrape Betfair attivo
→ preservato
```

```txt
Chrome/CDP
→ esterno
→ non chiuso dal runtime
```

```txt
stop
→ non introduce nuovi commit
```

```txt
risposta tardiva
→ nessun effetto mutante
```

```txt
retry
→ idempotente
→ non sovrapposto
```

```txt
cleanup
→ sicuro se ripetuto
```

```txt
pagina Graph
→ mai riutilizzata senza verifica di identità
```

```txt
DOM precedente
→ mai persistito come nuovo campione
```

---

## Criterio di completamento

Il task è completato quando:

* ogni nuova sessione di tracking possiede una generation distinguibile;
* ogni operazione asincrona mutante può essere associata a un command ID o meccanismo equivalente;
* start ripetuti non creano pipeline duplicate;
* due start simultanei producono una sola sessione attiva;
* stop, untrack e mismatch invalidano le richieste in volo;
* una risposta tardiva non può aggiornare stato, health o persistenza;
* una risposta della generation precedente viene sempre ignorata;
* timeout e retry non producono overlap;
* callback tardive dopo timeout non finalizzano due volte la stessa operazione;
* cleanup degli scraper figli è idempotente;
* stop ripetuti producono lo stesso stato finale;
* stop e mismatch concorrenti producono un risultato deterministico;
* la perdita CDP non crea riconnessioni concorrenti;
* una riconnessione viene annullata se la generation non è più attiva;
* cambio match invalida pagine e risultati del mercato precedente;
* identità mercato e runner vengono verificate prima della persistenza;
* un solo Graph aggiornato non viene combinato silenziosamente con dati precedenti;
* il frontend distingue tracking attivo, in arresto e fermato;
* un errore non lascia flag, promise o registry bloccati;
* il futuro worker persistente può accettare un solo comando mutante alla volta;
* ogni risposta del worker è verificata tramite generation, command ID e, se necessario, worker instance ID;
* un worker non responsivo può essere terminato senza chiudere Chrome esterno;
* eventuali race condition trovate hanno:

  * correzione circoscritta;
  * test deterministico;
  * regressione automatizzata;
* tutti gli scenari critici sono coperti senza browser live, login o rete esterna.

# 8. Baseline performance, freschezza e osservabilità end-to-end

## Stato attuale

Il progetto dispone già di:

* tracking SofaScore e Betfair;
* scheduler con intervalli configurati;
* normalizzazione e validazione tecnica dei tick;
* persistenza canonica;
* health e Data Quality;
* endpoint backend;
* polling frontend;
* log strutturali;
* timeout e retry;
* protezione dei segreti nei log;
* integrità persistente e recovery;
* controlli di concorrenza e idempotenza previsti nella Task 7.

Non è ancora disponibile una baseline completa e strumentata del percorso end-to-end.

Il percorso reale da misurare è:

```txt
scheduler abilita aggiornamento
→ processo o comando scraper avviato
→ Python inizializzato
→ Playwright inizializzato
→ connessione CDP completata
→ pagina mercato acquisita
→ Graph runner 1 acquisito
→ Graph runner 2 acquisito
→ ladder estratte
→ dati normalizzati
→ validità tecnica calcolata
→ tick canonico persistito
→ endpoint aggiornato
→ polling frontend
→ UI aggiornata
```

Non è stato ancora dimostrato, tramite metriche interne separate per fase, dove venga speso il tempo.

Dai dati storici esaminati è possibile stimare un intervallo effettivo Betfair superiore all’intervallo nominale dello scheduler, ma tale stima non sostituisce una strumentazione reale.

Questa task non deve partire dalla conclusione che il progetto sia lento.

Deve stabilire:

```txt
quanto tempo viene speso
→ dove viene speso
→ quante operazioni remote vengono eseguite
→ quanta parte è lavoro locale
→ quanto sono freschi i dati
→ quanto cresce il costo durante una sessione lunga
```

---

## Obiettivo

Definire una misurazione:

```txt
minima
ripetibile
sicura
non invasiva
sufficientemente dettagliata
```

delle prestazioni e della qualità temporale del progetto.

La baseline deve consentire di decidere:

* se esiste un collo di bottiglia reale;
* in quale fase si trova;
* se dipende da rete, Chrome, CDP, Python, Node.js, file system o frontend;
* se un problema riguarda velocità, freschezza, stabilità o dimensione dei dati;
* se una futura ottimizzazione riduce realmente il tempo;
* se una futura ottimizzazione aumenta il numero di richieste verso Betfair;
* se una futura ottimizzazione altera la freschezza o la correttezza dei campioni;
* se una futura ottimizzazione introduce nuovi errori o instabilità.

L’obiettivo iniziale è:

```txt
osservare
→ misurare
→ classificare
→ non ottimizzare
```

---

## Principio fondamentale

Questa task deve produrre esclusivamente una baseline.

Non deve implementare:

* worker Python persistente;
* riuso delle pagine Graph;
* parallelizzazione dei Graph;
* parsing DOM aggregato;
* riduzione delle attese;
* aumento della frequenza;
* nuove cache;
* nuove code;
* nuova persistenza;
* riduzione dei payload;
* modifiche al polling.

Tali interventi appartengono alla futura Task 9 e potranno essere valutati soltanto dopo il completamento della baseline.

---

## Dipendenze

### Task 1 — Sicurezza diagnostica

Tutte le metriche e i log introdotti devono rispettare la redazione già implementata.

Non devono essere registrati:

```txt
cookie
token
credenziali
header sensibili
app key
URL completi con query sensibili
stdout raw
stderr raw
payload completi
HTML completo
dump di rete
```

### Task 6 — Integrità persistente

La misurazione della persistenza deve distinguere:

```txt
commit complete
partial
recovered
failed
unchanged
```

Un errore di persistenza non può essere contato come scrape riuscito end-to-end.

### Task 7 — Concorrenza e idempotenza

Le metriche devono poter essere associate, quando disponibili, a:

```txt
eventId
generationId
commandId
workerInstanceId
```

Le risposte tardive o appartenenti a generation invalidate non devono alterare le metriche di successo.

### Task 4 — Fixture e replay offline

Le regole di freshness e disallineamento Graph definite nella Task 4 devono essere riutilizzabili dalla baseline.

La baseline non deve adottare una definizione diversa di:

```txt
fresh
stale
not_updated
partially_updated
temporally_misaligned
unknown
```

---

## Confini

Questo task riguarda:

* durata degli scrape SofaScore;
* durata degli scrape Betfair;
* startup del processo Python;
* import e inizializzazione Python;
* startup di Playwright;
* collegamento CDP;
* selezione o creazione delle pagine;
* caricamento della pagina principale Betfair;
* acquisizione del mercato;
* acquisizione dei due Graph;
* parsing delle ladder;
* normalizzazione;
* validazione tecnica;
* costruzione Graph Health;
* costruzione Data Quality;
* serializzazione tra Python e Node.js;
* persistenza history;
* persistenza timeline;
* commit canonico;
* durata degli endpoint;
* dimensione dei payload;
* polling frontend;
* ricezione frontend;
* aggiornamento UI, se misurabile senza eccessiva invasività;
* CPU e memoria;
* dimensione e crescita dei file;
* timeout;
* retry;
* campioni rifiutati;
* campioni duplicati;
* campioni regressivi;
* campioni stale;
* campioni non aggiornati;
* campioni con un solo Graph valido;
* errori di persistenza;
* riconnessioni CDP;
* numero di processi e pagine;
* numero di richieste remote per campione;
* confronto cold start e steady state;
* report aggregato della sessione.

Questo task non deve:

* cambiare la semantica dei dati;
* modificare la validità tecnica Betfair;
* modificare Source Identity;
* modificare Evidence o Strategy;
* aumentare la frequenza di polling;
* introdurre batching;
* aggiungere cache;
* introdurre un worker persistente;
* riutilizzare pagine Graph;
* parallelizzare richieste;
* bloccare risorse browser;
* modificare i timeout senza misure;
* cambiare il formato canonico delle timeline;
* introdurre infrastruttura cloud;
* introdurre monitoring esterno;
* introdurre nuove dipendenze pesanti senza necessità dimostrata;
* registrare payload completi;
* registrare URL sensibili;
* considerare automaticamente stale un Graph con valori invariati;
* considerare automaticamente fresco un Graph soltanto perché il DOM è stato letto.

---

## Materiale da fornire nella chat operativa

### Backend e runtime

* `matchTracker.js`;
* scheduler principale;
* tracker update SofaScore;
* tracker update Betfair;
* `betfairFetch`;
* lifecycle o runner scraper;
* gestione timeout;
* gestione retry;
* registry degli scraper attivi;
* moduli runtime e health;
* eventuali generation ID e command ID;
* callback di completamento e cleanup.

### Python e browser

* entry point Python SofaScore;
* entry point Python Betfair;
* browser session;
* inizializzazione Playwright;
* connessione CDP;
* acquisizione pagina principale;
* acquisizione Graph;
* parsing ladder;
* normalizzazione;
* validità tecnica;
* serializzazione stdout;
* eventuali tempi già disponibili.

### Persistenza

* writer history;
* writer timeline;
* commit multi-file;
* journal;
* recovery;
* integrità API;
* dimensione attuale dei documenti;
* modalità di riscrittura dei file.

### API e frontend

* route `latest`;
* route timeline;
* route history;
* route health;
* route Evidence;
* hook frontend di polling;
* frequenza di polling;
* componenti principali che ricevono i dati;
* eventuale timestamp di ricezione frontend;
* eventuale rendering o view model costoso.

### Test e dati operativi

* test timeout;
* test retry;
* test latest;
* test health;
* test persistenza;
* test polling;
* log redatti di almeno una sessione reale;
* durata consigliata iniziale di almeno 10–15 minuti;
* una sessione più lunga, se disponibile;
* dimensione iniziale e finale dei file;
* frequenze effettive di scraping e polling;
* informazioni locali su CPU e memoria;
* numero di match e processi attivi;
* modello CPU e quantità RAM, se disponibili.

Non servono:

* cookie;
* credenziali;
* profilo Chrome;
* token;
* dump completi;
* Graph URL sensibili;
* timeline complete da decine di megabyte nella chat.

---

## Modello temporale

Per evitare timestamp ambigui, ogni misura deve distinguere almeno:

```txt
source timestamp
→ tempo dichiarato dalla sorgente, se disponibile

acquisition timestamp
→ tempo in cui lo scraper acquisisce il dato

persistence timestamp
→ tempo in cui il tick canonico viene salvato

API timestamp
→ tempo in cui l'endpoint espone il dato

frontend receive timestamp
→ tempo in cui il frontend riceve la risposta

UI timestamp
→ tempo in cui il dato viene applicato alla UI
```

Non devono essere confusi:

```txt
timestamp risposta Graph
timestamp parsing completato
timestamp persistenza
timestamp polling
```

Il timestamp di persistenza non certifica da solo la freschezza della sorgente.

---

## Identificatori di correlazione

Ogni misura per scrape deve essere correlabile tramite un identificatore tecnico non sensibile.

Schema concettuale:

```js
{
  eventId,
  source: "sofa" | "betfair",
  generationId,
  commandId,
  scrapeId,
  startedAt
}
```

Se `generationId` o `commandId` non sono ancora presenti, introdurre almeno uno `scrapeId` locale per correlare:

```txt
Node avvia processo
→ Python misura fasi
→ Node riceve risultato
→ persistenza
→ endpoint
```

L’identificatore non deve alterare la semantica business.

---

## Strumentazione per scrape SofaScore

Per ogni scrape SofaScore raccogliere almeno:

```txt
schedulerEligibleAt
updateStartedAt
processSpawnStartedAt
processSpawnedAt
pythonReadyAt, se misurabile
request1StartedAt
request1CompletedAt
request2StartedAt
request2CompletedAt
request3StartedAt
request3CompletedAt
normalizationStartedAt
normalizationCompletedAt
serializationCompletedAt
nodeResultReceivedAt
persistenceStartedAt
persistenceCompletedAt
updateCompletedAt
```

Metriche derivate:

```txt
schedulerDelayMs
processStartupMs
requestTotalMs
normalizationMs
serializationMs
bridgeMs
persistenceMs
totalUpdateMs
```

Registrare anche:

```txt
requestCount
responseBytes, se sicuro
tickValid
tickRejected
errorCategory
retryCount
```

---

## Strumentazione per scrape Betfair

### Fase Node e processo

Registrare:

```txt
schedulerEligibleAt
updateStartedAt
spawnRequestedAt
processSpawnedAt
pythonMainStartedAt, se misurabile
pythonImportsCompletedAt, se misurabile
scraperCommandReceivedAt
```

Metriche:

```txt
schedulerDelayMs
spawnMs
pythonStartupMs
importInitializationMs
```

### Fase Playwright/CDP

Registrare:

```txt
playwrightStartAt
playwrightReadyAt
cdpConnectStartAt
cdpConnectCompletedAt
browserResolvedAt
contextResolvedAt
marketPageResolveStartedAt
marketPageResolvedAt
```

Metriche:

```txt
playwrightStartupMs
cdpConnectMs
browserResolveMs
contextResolveMs
pageResolveMs
```

### Pagina principale e mercato

Registrare:

```txt
marketNavigationStartedAt
marketResponseAt
marketDomReadyAt
marketValidationCompletedAt
marketApiStartedAt
marketApiCompletedAt
marketIdResolvedAt
```

Metriche:

```txt
marketNavigationMs
marketDomReadyMs
marketValidationMs
marketApiMs
marketResolutionMs
```

Registrare anche:

```txt
marketReloadCount
marketPageCreated
marketPageReused
marketIdentityValid
loginDetected
challengeDetected
```

### Graph runner 1

Registrare:

```txt
graph1PageResolveStartedAt
graph1PageResolvedAt
graph1NavigationStartedAt
graph1RequestAt
graph1ResponseAt
graph1DomReadyAt
graph1StableAt
graph1ExtractionStartedAt
graph1ExtractionCompletedAt
graph1ValidationCompletedAt
```

Metriche:

```txt
graph1PageResolveMs
graph1NavigationMs
graph1ResponseMs
graph1DomReadyMs
graph1StabilizationMs
graph1ExtractionMs
graph1ValidationMs
graph1TotalMs
```

Registrare anche:

```txt
graph1PageCreated
graph1PageReused
graph1RequestCount
graph1ResponseStatus
graph1Rows
graph1Bytes, se misurabile
graph1FreshnessStatus
graph1FreshnessReason
graph1RunnerIdentityValid
```

### Graph runner 2

Registrare gli stessi campi del Graph 1:

```txt
graph2PageResolveStartedAt
graph2PageResolvedAt
graph2NavigationStartedAt
graph2RequestAt
graph2ResponseAt
graph2DomReadyAt
graph2StableAt
graph2ExtractionStartedAt
graph2ExtractionCompletedAt
graph2ValidationCompletedAt
```

Metriche:

```txt
graph2PageResolveMs
graph2NavigationMs
graph2ResponseMs
graph2DomReadyMs
graph2StabilizationMs
graph2ExtractionMs
graph2ValidationMs
graph2TotalMs
```

Registrare inoltre:

```txt
graph2PageCreated
graph2PageReused
graph2RequestCount
graph2ResponseStatus
graph2Rows
graph2Bytes, se misurabile
graph2FreshnessStatus
graph2FreshnessReason
graph2RunnerIdentityValid
```

### Relazione tra i due Graph

Registrare:

```txt
graphAcquisitionId
graph1ResponseAt
graph2ResponseAt
graphSkewMs
graphPairStatus
```

Valori indicativi per `graphPairStatus`:

```txt
fresh
partially_updated
temporally_misaligned
not_updated
invalid_identity
unknown
```

Registrare anche:

```txt
graphUrlsProvided
graphUrlsAttempted
graphUrlsSucceeded
graphUrlsFailed
```

### Parsing e normalizzazione

Registrare:

```txt
parsingStartedAt
parsingCompletedAt
normalizationStartedAt
normalizationCompletedAt
technicalValidationStartedAt
technicalValidationCompletedAt
serializationStartedAt
serializationCompletedAt
```

Metriche:

```txt
parsingMs
normalizationMs
technicalValidationMs
serializationMs
```

Registrare:

```txt
rowsTotal
rowsRunner1
rowsRunner2
invalidRows
duplicatePrices
missingValues
technicalStatus
technicalReason
stdoutBytes
stderrBytes
```

Non registrare stdout o stderr raw.

### Bridge Node/Python

Registrare:

```txt
nodeSpawnAt
nodeStdoutCompletedAt
childCloseAt
jsonParseStartedAt
jsonParseCompletedAt
```

Metriche:

```txt
childLifetimeMs
stdoutCollectionMs
jsonParseMs
nodeBridgeMs
```

### Persistenza

Registrare:

```txt
persistenceStartedAt
historyWriteStartedAt
historyWriteCompletedAt
timelineWriteStartedAt
timelineWriteCompletedAt
journalOperationsCompletedAt
persistenceCompletedAt
```

Metriche:

```txt
historyWriteMs
timelineWriteMs
journalMs
persistenceTotalMs
```

Registrare:

```txt
commitStatus
historyStatus
timelineStatus
bytesBefore
bytesAfter
fileGrowthBytes
partialPersistence
recoveryRequired
```

### Fine end-to-end

Registrare:

```txt
tickCanonicalAt
latestAvailableAt
endpointFirstServedAt, se misurabile
frontendReceivedAt, se disponibile
uiAppliedAt, se disponibile
```

Metriche:

```txt
scrapeToPersistenceMs
scrapeToApiMs
scrapeToFrontendMs
scrapeToUiMs
totalEndToEndMs
```

---

## Misura delle attese fisse

La baseline deve identificare espressamente:

```txt
numero attese fisse per scrape
durata configurata di ogni attesa
tempo totale teorico di attesa
tempo effettivamente trascorso in attesa
fase in cui l'attesa viene applicata
```

Per ogni attesa, classificare:

```txt
necessaria
probabilmente eccessiva
insufficiente
non determinabile
```

Questa task non deve ancora sostituirla.

Deve soltanto quantificarla.

---

## Misura delle operazioni DOM/CDP

Per quanto possibile senza modificare la semantica, misurare o stimare:

```txt
numero locator creati
numero chiamate count
numero chiamate nth
numero textContent
numero innerText
numero evaluate
numero evaluateAll
numero chiamate per riga
numero chiamate per cella
numero totale di round trip CDP
```

Se il conteggio preciso è troppo invasivo, produrre almeno una stima documentata dal flusso del parser.

L’obiettivo è poter confrontare in futuro:

```txt
parser attuale
→ chiamate frammentate

parser ottimizzato
→ snapshot DOM aggregato
```

---

## Misura del traffico remoto

La baseline deve distinguere:

```txt
operazioni locali
→ non aumentano il carico verso Betfair

richieste remote
→ generano traffico verso Betfair
```

Per ogni campione Betfair misurare, se tecnicamente possibile:

```txt
numero navigazioni pagina principale
numero navigazioni Graph
numero richieste API Betfair
numero reload
numero redirect
numero retry remoti
numero richieste annullate
numero risposte 2xx
numero risposte 3xx
numero risposte 4xx
numero risposte 5xx
```

Non serve registrare URL completi.

È sufficiente usare categorie sicure:

```txt
market_page
graph_runner_1
graph_runner_2
betfair_api
static_resource
other
```

Registrare separatamente:

```txt
richieste document
richieste XHR/fetch
script
stylesheet
image
font
media
other
```

L’obiettivo è stabilire se una futura ottimizzazione:

* riduce solo il lavoro locale;
* riduce anche le richieste remote;
* lascia invariato il traffico;
* concentra maggiormente le richieste;
* aumenta il rischio di picchi.

---

## Freshness e qualità temporale

La baseline deve raccogliere per ogni campione:

```txt
acquisitionStartedAt
graph1ResponseAt
graph2ResponseAt
acquisitionCompletedAt
persistenceCompletedAt
```

Metriche:

```txt
acquisitionAgeAtPersistenceMs
graphSkewMs
tickAgeAtApiMs
tickAgeAtFrontendMs
```

Classificazioni:

```txt
fresh
stale
not_updated
partially_updated
temporally_misaligned
unknown
```

Regole:

```txt
valori invariati
→ non equivalgono automaticamente a stale

nuova risposta verificata
→ può essere fresh anche con valori identici

DOM riletto senza nuova risposta
→ not_updated

un solo Graph nuovo
→ partially_updated

due Graph nuovi oltre soglia
→ temporally_misaligned
```

La baseline deve contare separatamente ogni stato.

---

## Cold start e steady state

La baseline deve distinguere:

### Cold start

```txt
primo scrape dopo avvio backend
primo avvio Python
primo collegamento CDP
prima apertura pagina
prima acquisizione Graph
```

### Steady state

```txt
scrape successivi
stesso backend
stesso Chrome
stesso match
stessa sessione
```

Anche con il processo Python attuale avviato a ogni ciclo, il confronto deve distinguere:

* primo ciclo della sessione;
* cicli successivi;
* eventuale effetto delle cache browser;
* crescita dei file;
* stato Chrome già caldo.

Metriche aggregate:

```txt
coldStartP50
steadyStateP50
steadyStateP95
```

Non mescolare il primo ciclo con tutti gli altri senza segnalarlo.

---

## Baseline frontend

Per ogni endpoint coinvolto nel polling misurare:

```txt
route
requestStartedAt
responseCompletedAt
status
payloadBytes
serializationMs, se disponibile
```

Per il frontend:

```txt
pollStartedAt
responseReceivedAt
jsonParsedAt
stateAppliedAt
uiCommittedAt, se misurabile
```

Metriche:

```txt
networkMs
frontendParseMs
stateUpdateMs
renderMs
pollIntervalActualMs
```

Registrare inoltre:

```txt
pollCount
responsesUnchanged
responsesChanged
errors
abortedRequests
overlappingPolls
```

Verificare se il frontend:

* avvia una nuova richiesta prima della fine della precedente;
* scarica ogni volta timeline complete;
* riceve payload crescenti;
* riceve dati invariati;
* esegue rendering non necessario;
* continua a fare polling dopo stop.

La task non deve ancora modificare il polling.

---

## Baseline file e payload

Registrare a intervalli regolari:

```txt
dimensione history
dimensione timeline SofaScore
dimensione timeline Betfair
dimensione risposta latest
dimensione risposta timeline
dimensione risposta history
dimensione risposta Evidence
```

Esempio di checkpoint:

```txt
inizio sessione
5 minuti
10 minuti
15 minuti
fine sessione
```

Metriche derivate:

```txt
growthBytesPerMinute
payloadGrowthPerTick
writeDurationVsFileSize
readDurationVsFileSize
```

Verificare se:

* il tempo di scrittura cresce con il file;
* il tempo di lettura cresce con il file;
* la risposta frontend cresce continuamente;
* vengono riscritti dati invariati;
* una sessione lunga degrada rispetto a una breve.

---

## CPU e memoria

Misurare, se possibile:

```txt
Node backend
processo Python scraper
Chrome
frontend dev server
```

Per ogni componente:

```txt
CPU media
CPU massima
RSS
heap, se disponibile
working set
numero processi figli
numero thread, se disponibile
```

Checkpoint consigliati:

```txt
prima dello start
primo scrape
5 minuti
10 minuti
15 minuti
fine sessione
dopo stop
```

Verificare:

* crescita continua della memoria;
* memoria non liberata dopo stop;
* processi figli residui;
* picchi durante parsing ladder;
* picchi durante riscrittura file;
* differenza fra primo ciclo e cicli successivi.

Non è necessario introdurre un profiler invasivo nella prima fase.

---

## Metriche aggregate della sessione

Per ogni sessione produrre almeno:

```txt
sessionId
eventId
startedAt
completedAt
durationMs

SofaScore:
→ scrapes attempted
→ scrapes succeeded
→ scrapes failed
→ valid ticks
→ rejected ticks
→ p50
→ p95
→ max

Betfair:
→ scrapes attempted
→ scrapes succeeded
→ scrapes failed
→ valid ticks
→ stale ticks
→ not_updated
→ partially_updated
→ temporally_misaligned
→ duplicate ticks
→ regressive samples
→ timeouts
→ retries
→ p50
→ p95
→ max

Graph:
→ URL attempted
→ URL succeeded
→ URL failed
→ rows average
→ graph skew p50
→ graph skew p95

Persistence:
→ complete commits
→ partial commits
→ recovered commits
→ failed commits
→ p50
→ p95

API:
→ requests
→ errors
→ payload p50
→ payload p95
→ latency p50
→ latency p95

Frontend:
→ polls
→ errors
→ unchanged responses
→ overlapping polls
→ receive latency p50
→ receive latency p95
```

---

## Domande da risolvere prima di ottimizzare

La chat operativa deve stabilire:

1. quanto dura uno scrape SofaScore normale;
2. quanto dura uno scrape Betfair normale;
3. quanto dura il primo scrape rispetto ai successivi;
4. quanto costa avviare il processo Python;
5. quanto costa importare i moduli;
6. quanto costa inizializzare Playwright;
7. quanto costa collegarsi a CDP;
8. quanto costa individuare o creare la pagina principale;
9. quanto costa caricare o aggiornare la pagina mercato;
10. quanto dura il Graph del primo runner;
11. quanto dura il Graph del secondo runner;
12. quanto tempo viene speso in attese fisse;
13. quanto costa leggere ogni cella tramite chiamate separate;
14. quante operazioni DOM/CDP vengono eseguite per ladder;
15. quanto tempo richiedono parsing e normalizzazione;
16. quanto tempo richiede la validazione tecnica;
17. quanto costa serializzare il risultato Python;
18. quanto costa trasferire e parsare il JSON in Node;
19. quanto tempo richiede la persistenza;
20. quanto cresce il costo di persistenza con file più grandi;
21. quanto tempo passa tra acquisizione e tick canonico;
22. quanto tempo passa tra tick canonico e risposta API;
23. quanto tempo passa tra API e frontend;
24. quanto tempo passa tra frontend e UI;
25. quante richieste remote vengono inviate per campione;
26. quante navigazioni Graph vengono inviate per campione;
27. quante risorse statiche vengono riscaricate;
28. se il Graph produce una nuova risposta a ogni caricamento;
29. se una pagina Graph aperta riceve aggiornamenti autonomi;
30. come distinguere nuova risposta e DOM precedente;
31. se valori invariati possono essere certificati come nuova acquisizione;
32. quanti campioni hanno un solo Graph aggiornato;
33. quanto sono temporalmente distanti i due Graph;
34. quale fase genera la maggior parte del p95;
35. se timeout e retry aumentano il carico;
36. se un retry si sovrappone al comando precedente;
37. se CPU o memoria crescono durante sessioni lunghe;
38. se restano processi o pagine dopo stop;
39. se il polling frontend riceve più dati del necessario;
40. se esistono polling sovrapposti;
41. se una risposta invariata produce rendering inutile;
42. se il problema principale è rete, rendering, CDP, parsing, file system, API o frontend;
43. quali metriche possono essere raccolte senza dati sensibili;
44. quale soglia numerica giustifica la Task 9;
45. quali ottimizzazioni potrebbero ridurre il tempo senza aumentare il traffico verso Betfair.

---

## Baseline minima obbligatoria

### Per ogni scrape

```txt
scrapeId
eventId
source
startedAt
completedAt
technicalStatus
technicalReason
totalMs
```

### Per ogni scrape Betfair

```txt
processStartupMs
playwrightStartupMs
cdpConnectMs
marketPageMs
marketApiMs
graph1Ms
graph2Ms
parsingMs
normalizationMs
validationMs
serializationMs
bridgeMs
persistenceMs
totalMs
```

### Per ogni Graph

```txt
requestStartedAt
responseAt
extractionCompletedAt
rows
status
freshness
runnerIdentityValid
```

### Per ogni tick valido

```txt
sourceTimestamp
acquisitionTimestamp
persistenceTimestamp
latestAvailableTimestamp
frontendReceivedTimestamp, se disponibile
```

### Per ogni endpoint

```txt
route
durationMs
payloadBytes
status
```

### Per ogni sessione

```txt
tick validi
tick rifiutati
tick duplicati
tick regressivi
stale
not_updated
partially_updated
temporally_misaligned
timeout
retry
errori persistence
richieste remote
CPU
memoria
dimensione file
```

---

## Formato delle metriche

Le metriche possono essere registrate tramite:

* log JSONL locale;
* file di sessione dedicato;
* oggetti aggregati in memoria con export finale;
* endpoint diagnostico locale;
* combinazione minima di questi strumenti.

È preferibile un formato append-only, per evitare riscritture continue.

Esempio concettuale:

```json
{
  "type": "performance_phase",
  "eventId": "redacted-or-safe-id",
  "source": "betfair",
  "scrapeId": "scrape-00012",
  "phase": "graph_1",
  "status": "completed",
  "elapsedMs": 3124,
  "rows": 112,
  "freshness": "fresh"
}
```

---

## Retention delle metriche

Le metriche della baseline devono essere:

* locali;
* temporanee;
* redatte;
* separate dai dati canonici;
* non lette da Evidence o Strategy;
* non usate come sorgente business.

La task deve definire:

```txt
directory
formato
dimensione massima
durata conservazione
cleanup manuale o controllato
```

Non integrare automaticamente la retention delle metriche nella Task 3 senza una decisione esplicita.

---

## Scenari minimi di prova

### 1. Sessione normale di 10–15 minuti

```txt
→ baseline completa
→ almeno più cicli SofaScore
→ almeno più cicli Betfair
→ metriche per fase disponibili
```

### 2. Primo scrape e steady state

```txt
→ primo ciclo identificato
→ cicli successivi separati
→ confronto cold/steady disponibile
```

### 3. Timeout Betfair

```txt
→ durata misurata
→ comando identificato
→ retry misurato
→ impatto su health misurato
→ nessun doppio conteggio
```

### 4. Retry riuscito

```txt
→ primo tentativo fallito
→ retry distinto
→ esito finale correlato
→ richieste remote conteggiate
```

### 5. Graph con valori modificati

```txt
→ nuova acquisizione
→ fresh
→ tempi Graph registrati
```

### 6. Graph con valori invariati ma nuova risposta

```txt
→ fresh
→ nessun falso stale
```

### 7. DOM riletto senza nuova risposta

```txt
→ not_updated
→ nessun nuovo campione contato come fresh
```

### 8. Solo un Graph aggiornato

```txt
→ partially_updated
→ stato misurato
→ nessuna fusione silenziosa
```

### 9. Graph temporalmente disallineati

```txt
→ graphSkewMs disponibile
→ temporally_misaligned
```

### 10. Timeline in crescita

```txt
→ dimensione file misurata
→ tempo lettura e scrittura confrontato
```

### 11. Polling frontend attivo

```txt
→ frequenza reale
→ payload
→ latenza
→ richieste sovrapposte rilevate
```

### 12. Risposta frontend invariata

```txt
→ risposta identificata come invariata
→ eventuale rendering osservato
```

### 13. Errore persistenza

```txt
→ errore visibile
→ status commit corretto
→ nessun dato sensibile
```

### 14. Partial persistence

```txt
→ scrape e persistence distinti
→ end-to-end non classificato come completo
```

### 15. Riavvio sessione

```txt
→ nuovo sessionId
→ confronto con sessione precedente
→ nessuna metrica mescolata
```

### 16. Stop durante scrape

```txt
→ comando invalidato
→ eventuale risposta tardiva non classificata come successo
```

### 17. Sessione più lunga

```txt
→ CPU e memoria confrontate
→ crescita file confrontata
→ p95 confrontato nel tempo
```

### 18. CDP non disponibile

```txt
→ fase cdpConnect fallita
→ durata e reason misurate
→ nessuna classificazione Graph
```

### 19. CDP perso durante scrape

```txt
→ fase precisa identificata
→ riconnessione conteggiata
→ nessun doppio scrape
```

### 20. Pagina login o challenge

```txt
→ stato tecnico esplicito
→ nessun payload sensibile
→ nessun retry aggressivo introdotto
```

---

## Intervento atteso

La prima implementazione deve introdurre esclusivamente:

```txt
timestamp per fase
→ metriche locali

identificatori di correlazione
→ scrapeId
→ generationId e commandId quando disponibili

aggregazione sessione
→ p50
→ p95
→ massimo
→ conteggi

report finale
→ leggibile
→ redatto
→ confrontabile
```

Non deve ottimizzare il codice osservato.

La strumentazione deve avere overhead limitato.

Non deve:

* leggere HTML completi solo per misurare;
* salvare payload completi;
* intercettare ogni risorsa se ciò altera significativamente il comportamento;
* introdurre un profiler pesante;
* rallentare sensibilmente il percorso live.

Se una misura precisa è troppo invasiva, utilizzare:

```txt
stima documentata
→ reason
→ livello di confidenza
```

---

## Classificazione dopo la baseline

Al termine, ogni possibile intervento deve essere classificato.

### Nessun collo di bottiglia misurabile

```txt
→ nessuna modifica
```

### Collo di bottiglia locale

Esempi:

```txt
spawn Python
CDP
parsing DOM
serializzazione
persistenza
frontend
```

Risultato:

```txt
→ intervento circoscritto
→ nessun aumento del traffico remoto
```

### Collo di bottiglia remoto

Esempi:

```txt
latenza Graph
pagina mercato
API Betfair
```

Risultato:

```txt
→ nessuna ottimizzazione aggressiva
→ valutare comportamento prudente
```

### Payload eccessivo

```txt
→ audit endpoint e view model
→ test di compatibilità
```

### Persistenza crescente

```txt
→ audit storage
→ preservare Task 6
```

### Polling eccessivo

```txt
→ confronto dati nuovi / risposte ricevute
→ eventuale modifica solo dopo benchmark
```

### Freshness insufficiente

```txt
→ distinguere tempo di acquisizione da intervallo scheduler
→ non aumentare subito la frequenza
```

---

## Requisiti per una futura ottimizzazione

Ogni modifica proposta nella Task 9 deve avere:

```txt
problema misurato
metrica iniziale
obiettivo numerico
intervento circoscritto
impatto atteso
numero richieste remote prima
numero richieste remote dopo
test di regressione
benchmark prima/dopo
verifica freshness
verifica qualità
verifica stabilità
```

Esempio:

```txt
problema
→ parsing Graph p95 = 4.2 s

obiettivo
→ parsing Graph p95 < 1.0 s

intervento
→ snapshot DOM aggregato

vincolo
→ numero richieste remote invariato
```

---

## Report finale della baseline

Il report deve contenere almeno:

### Ambiente

```txt
data
durata sessione
sistema operativo
CPU
RAM
versione Node
versione Python
versione Playwright
browser
numero match
numero processi
```

### Configurazione

```txt
intervallo SofaScore
intervallo Betfair
intervallo frontend
timeout
retry
network capture
numero Graph URL
```

### Tempi SofaScore

```txt
p50
p95
max
request time
normalization
persistence
```

### Tempi Betfair

```txt
startup Python
Playwright
CDP
pagina mercato
Graph 1
Graph 2
parsing
normalizzazione
validazione
bridge
persistenza
totale
```

### Freshness

```txt
fresh
stale
not_updated
partially_updated
temporally_misaligned
graphSkew p50
graphSkew p95
```

### Traffico

```txt
richieste per campione
navigazioni per campione
retry
redirect
errori HTTP per categoria
```

### Persistenza

```txt
dimensione iniziale
dimensione finale
crescita
write p50
write p95
commit complete
partial
failed
```

### API e frontend

```txt
payload
latenza endpoint
latenza frontend
poll sovrapposti
risposte invariate
```

### Risorse

```txt
CPU
memoria
crescita nel tempo
processi residui
```

### Conclusioni

```txt
collo di bottiglia principale
collo di bottiglia secondario
problemi non dimostrati
ottimizzazioni candidate
ottimizzazioni non giustificate
rischi
```

---

## Invarianti da preservare

```txt
misurazione
→ non modifica il comportamento business
```

```txt
strumentazione
→ non aumenta significativamente il traffico remoto
```

```txt
freshness
→ non dedotta solo dal cambiamento dei valori
```

```txt
DOM riletto
→ non equivale a nuova acquisizione
```

```txt
Graph parziale
→ non contato come coppia completa
```

```txt
partial persistence
→ non classificata come successo end-to-end
```

```txt
risposta tardiva
→ non classificata come scrape valido
```

```txt
log performance
→ nessun dato sensibile
```

```txt
payload canonici
→ non copiati nei log
```

```txt
Task 8
→ osservazione
→ nessuna ottimizzazione
```

---

## Criterio di completamento

Il task è completato quando:

* esiste una baseline reale di almeno 10–15 minuti;
* ogni scrape possiede un identificatore correlabile;
* è possibile distinguere SofaScore e Betfair;
* è misurato il tempo totale per scrape;
* è misurato il costo dello spawn Python;
* è misurato il costo di inizializzazione Playwright;
* è misurato il costo della connessione CDP;
* è misurato il costo della pagina principale;
* sono misurati separatamente Graph 1 e Graph 2;
* sono misurati parsing, normalizzazione e validazione;
* è misurata la serializzazione Python/Node;
* è misurata la persistenza;
* è misurata la latenza fino all’API;
* è misurata la latenza fino al frontend, se tecnicamente disponibile;
* cold start e steady state sono distinti;
* p50, p95 e massimo sono disponibili;
* il numero di richieste remote per campione è noto o stimato con metodologia documentata;
* il numero di navigazioni Graph per campione è noto;
* il numero di reload della pagina principale è noto;
* il costo delle attese fisse è quantificato;
* il numero di operazioni DOM/CDP è noto o stimato;
* una nuova risposta con valori invariati viene distinta dal vecchio DOM;
* `fresh`, `stale`, `not_updated`, `partially_updated` e `temporally_misaligned` sono conteggiati;
* il disallineamento temporale dei Graph è misurato;
* tick validi, rifiutati, duplicati e regressivi sono osservabili;
* timeout e retry sono osservabili;
* errori di persistenza e partial persistence sono osservabili;
* dimensione e crescita dei file sono misurabili;
* dimensione e latenza degli endpoint sono misurabili;
* frequenza reale e sovrapposizione del polling frontend sono misurabili;
* CPU e memoria sono misurabili almeno a intervalli;
* processi o risorse residue dopo stop sono verificabili;
* log e metriche non contengono dati sensibili;
* l’overhead della strumentazione è documentato;
* esiste un report finale confrontabile;
* nessuna ottimizzazione della Task 9 viene introdotta prima della conclusione della baseline;
* ogni futura ottimizzazione può essere confrontata quantitativamente con questa baseline.

# 9. Ottimizzazione prudente dello scraper Betfair e freschezza dei Graph

## Stato attuale

Lo scraper Betfair utilizza attualmente:

```txt
un solo match
→ un solo aggiornamento Betfair attivo
→ processo Python dedicato
→ Playwright
→ collegamento a Chrome tramite CDP
→ pagina principale del mercato
→ due Graph URL, uno per runner
→ estrazione delle ladder
→ normalizzazione e validazione
→ persistenza canonica
```

Il percorso esistente è specializzato per il progetto e produce dati strutturati senza dipendere da agenti LLM o framework di navigazione generici.

Nel campione analizzato:

```txt
2 Graph URL forniti
→ 2 Graph tentati
→ 2 Graph riusciti
→ 0 Graph falliti
→ ladder utilizzabili per entrambi i runner
```

L’intervallo effettivo tra i campioni Betfair risulta però superiore all’intervallo nominale dello scheduler.

Sono state individuate possibili fonti di overhead:

```txt
nuovo processo Python per ogni aggiornamento
inizializzazione ripetuta di Playwright
nuovo collegamento CDP
risoluzione o creazione ripetuta delle pagine
attese temporali fisse
elaborazione sequenziale dei Graph
letture DOM frammentate per righe e celle
serializzazione di output voluminosi
persistenza di file crescenti
```

Questi elementi sono ipotesi tecniche.

La Task 8 deve misurarne il costo effettivo prima che questa task introduca modifiche.

---

## Obiettivo

Ridurre la latenza dello scraper Betfair e migliorare la coerenza temporale dei campioni senza:

* aumentare inizialmente la frequenza delle richieste;
* aumentare il numero di match;
* introdurre più pipeline Betfair concorrenti;
* rendere il traffico più aggressivo;
* creare picchi non necessari;
* riutilizzare ladder precedenti come dati nuovi;
* confondere valori invariati con dati non aggiornati;
* compromettere login o sessione Chrome;
* modificare Source Identity;
* indebolire la validazione tecnica;
* modificare la semantica delle timeline;
* compromettere commit e recovery della Task 6;
* aumentare il rischio operativo dell’account Betfair.

L’obiettivo iniziale è:

```txt
ridurre lavoro locale
→ ridurre attese inutili
→ ridurre operazioni CDP
→ ridurre creazione di processi e pagine
→ mantenere invariato o inferiore il traffico remoto
```

La velocità non deve essere ottenuta sacrificando:

```txt
freshness
coerenza dei due runner
identità del mercato
completezza delle ladder
stabilità
osservabilità
```

---

## Decisione architetturale

La base da preservare è:

```txt
Chrome reale autenticato
→ CDP
→ Playwright
→ parsing deterministico
→ validazione tecnica
→ persistenza canonica
```

Questa task non deve migrare il percorso principale verso:

* Browser Use;
* Steel Browser;
* Crawl4AI;
* Scrapling;
* Obscura;
* altri browser agent basati su LLM.

Un framework esterno può essere valutato soltanto in una sperimentazione separata, con benchmark controllato e senza sostituire immediatamente il percorso produttivo.

---

## Dipendenze

La task può essere implementata soltanto dopo il completamento delle seguenti attività.

### Task 2 — Launcher e ownership

Deve essere definito chi possiede il lifecycle di un eventuale worker Python persistente.

```txt
worker owned dal backend
→ terminato dal backend

worker owned dal launcher
→ registrato nel manifest
→ terminato dal launcher

worker reused
→ non terminato

Chrome
→ sempre non owned
```

Launcher e backend non possono essere contemporaneamente owner dello stesso worker.

### Task 4 — Fixture e replay offline

Devono essere disponibili fixture per:

* nuova acquisizione con valori modificati;
* nuova acquisizione con valori invariati;
* DOM precedente senza nuova acquisizione;
* un solo Graph aggiornato;
* Graph temporalmente disallineati;
* identità runner errata;
* risposta Graph tardiva;
* ladder incoerente.

Le ottimizzazioni non possono cambiare il comportamento fissato dalle fixture.

### Task 7 — Concorrenza e idempotenza

Devono essere verificati:

* generation ID;
* command ID;
* invalidazione delle risposte tardive;
* stop durante scrape;
* timeout e retry;
* perdita CDP;
* cambio match;
* cleanup idempotente;
* un solo comando Betfair attivo.

### Task 8 — Baseline performance

Devono essere disponibili almeno:

```txt
p50 e p95 dello scrape Betfair
costo spawn Python
costo inizializzazione Playwright
costo collegamento CDP
costo pagina principale
durata Graph 1
durata Graph 2
durata parsing
durata validazione
durata bridge Node/Python
durata persistenza
numero richieste remote per campione
numero navigazioni Graph
numero reload pagina principale
freshness e Graph skew
```

Nessuna fase di questa task deve essere accettata senza confronto prima/dopo.

---

## Principi di sicurezza operativa

### Un solo match

```txt
un solo match attivo
→ invariato
```

### Una sola pipeline Betfair

```txt
una generation
→ massimo un comando Betfair mutante attivo
```

### Frequenza iniziale invariata

Durante le prime fasi:

```txt
intervallo scheduler
→ invariato

numero richieste Graph
→ uguale o inferiore alla baseline

numero reload mercato
→ uguale o inferiore alla baseline
```

Il tempo risparmiato non deve essere immediatamente convertito in richieste più frequenti.

### Nessun retry aggressivo

```txt
errore temporaneo
→ retry limitato
→ backoff

timeout
→ invalidazione comando
→ cleanup
→ nessun retry sovrapposto

login o challenge
→ nessun ciclo continuo di reload
```

### Risposte anomale

In presenza di:

```txt
401
403
429
challenge
pagina login
redirect inatteso
mercato non disponibile
```

il comportamento deve essere prudente:

```txt
campione non valido
→ health degradata
→ reason esplicita
→ backoff
→ eventuale sospensione dopo soglia
```

Non introdurre:

* proxy rotation;
* cambio automatico di identità;
* bypass CAPTCHA;
* login ripetuti;
* escalation automatica del traffico;
* tecniche evasive aggressive.

### Chrome esterno

```txt
Chrome
→ non owned
→ non chiuso dallo scraper
→ non chiuso dal worker
→ non chiuso dal backend
```

### Rispetto delle condizioni del servizio

Non può essere garantita l’assenza assoluta di restrizioni o blocchi.

La task deve:

* mantenere comportamento prudente;
* limitare il traffico;
* evitare picchi inutili;
* rendere visibili errori e risposte anomale;
* rispettare termini, limiti e modalità di accesso applicabili al servizio.

---

## Confini

### Inclusi

Questa task riguarda:

* scraper Python Betfair;
* bridge Node/Python;
* browser session;
* Playwright;
* collegamento CDP;
* pagina principale Betfair;
* pagine Graph;
* parsing ladder;
* validazione di identità;
* freshness;
* coerenza temporale dei Graph;
* eventuale worker Python persistente;
* eventuale riuso controllato delle pagine;
* riduzione delle attese fisse;
* riduzione delle operazioni DOM/CDP;
* riduzione delle navigazioni non necessarie;
* persistenza più efficiente, solo se dimostrata necessaria;
* benchmark;
* test automatici;
* metriche prima/dopo;
* feature flag e rollback.

### Esclusi

Questa task non deve:

* modificare Source Identity;
* modificare la classificazione aligned, pending o mismatch;
* modificare Money Flow;
* modificare strategie;
* introdurre segnali operativi;
* cambiare la validità sportiva;
* cambiare il contenuto business delle ladder;
* cambiare il significato delle quote;
* aumentare subito la frequenza di polling;
* introdurre più match;
* introdurre più worker concorrenti;
* introdurre browser agent basati su LLM;
* introdurre proxy rotativi;
* introdurre bypass CAPTCHA;
* automatizzare scommesse;
* chiudere Chrome esterno;
* utilizzare cache come sostituzione di una nuova acquisizione;
* considerare il vecchio DOM come campione nuovo;
* implementare tutte le ottimizzazioni contemporaneamente.

---

## Regola di implementazione incrementale

Ogni intervento deve seguire questo ciclo:

```txt
baseline della fase
→ modifica singola
→ test automatici
→ benchmark controllato
→ confronto p50 e p95
→ verifica traffico remoto
→ verifica freshness
→ decisione keep o rollback
```

Non combinare più modifiche importanti nello stesso benchmark iniziale.

Esempio:

```txt
prima
→ parser DOM attuale

dopo
→ parser aggregato

invariato
→ processo Python
→ pagine
→ attese
→ frequenza
```

Solo dopo aver validato una fase si può procedere alla successiva.

---

## Fase 1 — Parsing DOM aggregato delle ladder

### Problema da verificare

Il parser attuale può eseguire numerose operazioni separate tramite Playwright per:

* contare le righe;
* selezionare ogni riga;
* selezionare ogni cella;
* leggere testo o attributi;
* convertire i valori.

Con centinaia di righe, questo può generare molti round trip tra:

```txt
Python
→ Playwright
→ CDP
→ Chrome
```

### Intervento

Estrarre l’intera ladder con una sola operazione JavaScript per ciascun Graph.

Esempio concettuale:

```js
const ladder = await page.locator('table tbody tr').evaluateAll(rows =>
  rows.map(row => {
    const cells = Array.from(row.querySelectorAll('td'));

    return {
      price: cells[0]?.textContent?.trim() ?? null,
      back: cells[1]?.textContent?.trim() ?? null,
      lay: cells[2]?.textContent?.trim() ?? null,
      traded: cells[3]?.textContent?.trim() ?? null
    };
  })
);
```

Il selettore effettivo deve essere ricavato dalla struttura reale.

### Requisiti

```txt
una singola lettura logica per tabella
→ snapshot coerente

stessi campi del parser precedente
→ nessuna perdita dati

stessa normalizzazione
→ stesso output canonico

identità runner
→ verificata prima dell'accettazione

numero righe
→ verificato

celle mancanti
→ gestite esplicitamente
```

### Validazione

Confrontare parser precedente e nuovo sulle stesse fixture:

```txt
numero righe
prezzi
back
lay
traded
ordine ladder
duplicati
campi mancanti
```

### Obiettivi indicativi

```txt
operazioni DOM/CDP
→ riduzione almeno 80%

tempo parsing p50
→ riduzione misurabile

tempo parsing p95
→ riduzione misurabile

richieste remote
→ invariate
```

La percentuale definitiva deve essere ricavata dal benchmark.

---

## Fase 2 — Attese basate su condizioni reali

### Problema da verificare

Le attese fisse possono:

* prolungare un ciclo quando il contenuto è già disponibile;
* non essere sufficienti quando la pagina è lenta;
* introdurre variabilità non correlata allo stato reale;
* rendere difficile distinguere caricamento e stabilizzazione.

### Intervento

Sostituire progressivamente le attese fisse con condizioni osservabili.

Condizioni possibili:

```txt
risposta document ricevuta
risposta Graph ricevuta
tabella presente
numero minimo di righe
runner atteso visibile
nessuna schermata login
nessun challenge
contenuto stabile per una breve finestra
```

Esempio concettuale:

```js
await page.waitForFunction(
  ({ selector, minimumRows }) => {
    const rows = document.querySelectorAll(selector);
    return rows.length >= minimumRows;
  },
  {
    selector: 'table tbody tr',
    minimumRows: 1
  },
  {
    timeout: graphTimeoutMs
  }
);
```

### Vincolo di frequenza

La rimozione di uno `sleep()` non deve produrre:

```txt
scrape completato
→ nuovo scrape immediato
→ loop continuo
```

Deve rimanere:

* intervallo minimo dello scheduler;
* una sola pipeline attiva;
* backoff dopo errori;
* nessuna sovrapposizione.

### Validazione

Misurare:

```txt
tempo risparmiato
timeout
false readiness
tabella incompleta
righe mancanti
errori
p50
p95
```

Un’attesa dinamica viene mantenuta soltanto se non peggiora la completezza.

---

## Fase 3 — Worker Python persistente

### Problema da verificare

A ogni scrape possono essere ripetuti:

* startup Python;
* import;
* inizializzazione Playwright;
* collegamento CDP;
* inizializzazione dello stato.

### Intervento

Valutare un worker Python mantenuto attivo durante la sessione di tracking.

Architettura concettuale:

```txt
backend Node
→ avvia worker Python
→ invia comando scrape
→ riceve risposta JSON
→ riutilizza worker
→ termina worker allo shutdown
```

Possibili trasporti:

* stdin/stdout con protocollo a righe;
* socket locale;
* named pipe;
* servizio HTTP esclusivamente locale.

La scelta deve privilegiare semplicità e osservabilità.

### Contratto minimo del comando

```js
{
  "type": "scrape",
  "eventId": "safe-event-id",
  "generationId": "generation-id",
  "commandId": "command-id",
  "marketUrl": "redacted-or-safe-reference",
  "graphUrls": ["reference-1", "reference-2"],
  "timeoutMs": 90000
}
```

Gli URL sensibili non devono comparire nei log.

### Risposta minima

```js
{
  "eventId": "safe-event-id",
  "generationId": "generation-id",
  "commandId": "command-id",
  "workerInstanceId": "worker-instance-id",
  "ok": true,
  "result": {},
  "error": null,
  "timings": {}
}
```

### Regole

```txt
un solo comando attivo
→ nessun overlap

generation non attiva
→ comando rifiutato o risultato ignorato

commandId non attivo
→ risultato ignorato

worker busy
→ comando accodato o rifiutato secondo policy esplicita

timeout
→ comando invalidato

worker non responsivo
→ terminazione controllata

worker riavviato
→ nuovo workerInstanceId

Chrome
→ non chiuso
```

### Health del worker

Stati indicativi:

```txt
starting
ready
busy
stopping
stopped
failed
```

Metriche:

```txt
uptime
commands received
commands completed
commands failed
timeouts
restarts
current command
last completedAt
```

### Rollback

Il percorso attuale con processo per scrape deve rimanere disponibile tramite feature flag fino al completamento della validazione.

Esempio:

```txt
BETFAIR_WORKER_MODE=spawn
BETFAIR_WORKER_MODE=persistent
```

---

## Fase 4 — Riutilizzo controllato delle pagine Graph

### Principio fondamentale

Riutilizzare una pagina non significa riutilizzare i dati.

```txt
stessa scheda
→ nuova acquisizione verificata
→ nuova ladder

stessa scheda
→ nessuna nuova acquisizione
→ nessun nuovo campione
```

### Modalità possibili

### Graph con aggiornamento automatico

Se la pagina riceve autonomamente nuovi dati:

```txt
pagina già aperta
→ attendere nuova risposta o evento
→ associare acquisitionId
→ estrarre nuova ladder
```

### Graph senza aggiornamento automatico

Se la pagina non si aggiorna autonomamente:

```txt
pagina già aperta
→ nuova navigazione o reload controllato
→ nuova risposta
→ estrazione
```

La pagina può essere riutilizzata, ma non il DOM precedente.

### Prova di nuova acquisizione

Ogni campione deve disporre di una prova equivalente a uno o più dei seguenti elementi:

```txt
nuovo requestId
nuova risposta di rete
nuova navigazione
nuovo acquisitionId
timestamp di risposta nuovo
evento applicativo verificabile
```

La sola differenza del timestamp locale di lettura non è sufficiente.

### Valori invariati

```txt
nuova risposta verificata
+ stessi valori
→ campione potenzialmente fresh
```

Quote e volumi possono rimanere invariati tra due acquisizioni reali.

Non usare il cambiamento dei valori come unica prova di freshness.

### DOM non aggiornato

```txt
nessuna nuova risposta
+ nessuna nuova navigazione
+ stesso DOM
→ not_updated
→ campione non persistito come nuovo
```

### Un solo Graph aggiornato

```txt
Graph runner A nuovo
+ Graph runner B precedente
→ partially_updated
```

Non è ammesso combinare silenziosamente i due dati.

La policy deve scegliere tra:

```txt
rifiuto completo del tick
oppure
tick degradato senza ladder cross-runner utilizzabile
```

La decisione deve essere esplicita e coperta da fixture.

### Identità

Prima di accettare una pagina riutilizzata verificare:

* generation ID;
* market ID;
* market key;
* URL normalizzato;
* selection ID;
* runner atteso;
* Graph URL associato;
* pagina non chiusa;
* pagina non appartenente al match precedente.

### Cambio match

```txt
nuovo match
→ invalidare pagine Graph precedenti
→ chiuderle o riconfigurarle esplicitamente
→ nessun riuso automatico
```

---

## Fase 5 — Coerenza temporale dei due Graph

### Problema

I due Graph rappresentano runner differenti e vengono acquisiti in istanti diversi.

Un intervallo troppo ampio potrebbe produrre:

```txt
runner A fotografato all'istante T1
runner B fotografato all'istante T2
→ coppia temporalmente incoerente
```

### Intervento

Registrare:

```txt
graph1RequestAt
graph1ResponseAt
graph1ExtractionAt
graph2RequestAt
graph2ResponseAt
graph2ExtractionAt
graphSkewMs
```

La policy deve definire una soglia esplicita per:

```txt
aligned
temporally_misaligned
unknown
```

La soglia deve essere:

* ricavata dai dati della Task 8;
* configurabile;
* coperta da fixture;
* non scelta arbitrariamente.

### Sequenziale prudente

Prima configurazione raccomandata:

```txt
Graph 1
→ completamento
→ breve intervallo controllato, se necessario
→ Graph 2
```

Questa modalità evita picchi simultanei e preserva il comportamento prudente.

### Aggiornamento sfalsato

Possibile evoluzione:

```txt
due pagine già aperte
→ aggiornamento Graph 1
→ breve offset
→ aggiornamento Graph 2
```

### Concorrenza completa

La concorrenza simultanea deve essere valutata soltanto nella Fase 8 e solo se il beneficio è necessario.

---

## Fase 6 — Riduzione delle navigazioni della pagina principale

### Problema da verificare

La pagina principale Betfair potrebbe essere ricaricata a ogni ciclo anche quando:

* il match è invariato;
* il market ID è già noto;
* la sessione è valida;
* i runner sono invariati;
* i Graph URL sono già disponibili.

### Intervento

Classificare i dati in:

### Invarianti della sessione

Possibili esempi:

```txt
eventId
marketId
market key
selectionId
runner identity
Graph URL
```

### Dati dinamici

```txt
quote
volumi
ladder
total matched
graph health
timestamp
```

Gli invarianti possono essere riutilizzati soltanto dopo verifica.

I dati dinamici devono essere nuovamente acquisiti.

### Verifica periodica

Anche quando la pagina principale non viene ricaricata a ogni ciclo, deve esistere una verifica periodica o event-driven di:

* mercato corretto;
* sessione valida;
* pagina non reindirizzata;
* runner invariati;
* Graph URL ancora applicabili.

### Invalidazione

Invalidare immediatamente gli invarianti quando:

```txt
cambio match
cambio market ID
cambio selection ID
redirect
login
challenge
errore di identità
mismatch tecnico
```

### Obiettivo

Ridurre:

* navigazioni document;
* caricamento risorse statiche;
* tempo pagina principale;
* operazioni locali.

Il numero di richieste dinamiche necessarie ai dati live non deve essere ridotto al punto da produrre dati vecchi.

---

## Fase 7 — Persistenza più efficiente

### Condizione di ingresso

Questa fase deve essere eseguita soltanto se la Task 8 dimostra che:

```txt
persistence p95
→ rappresenta un collo di bottiglia significativo

oppure

tempo di scrittura
→ cresce in modo rilevante con la dimensione dei file
```

### Possibili soluzioni

Valutare separatamente:

* JSONL append-only;
* SQLite;
* snapshot più delta;
* separazione della ladder dai riepiloghi;
* compattazione a match concluso;
* indici locali;
* endpoint che non rileggono l’intera timeline.

### Invarianti

Qualunque cambiamento deve preservare:

```txt
commit multi-file della Task 6
recovery
idempotenza
timeline canoniche
reader API
Evidence
replay offline
integrity
Source Identity
```

Non introdurre una nuova persistenza solo perché i file sono grandi.

Serve un problema misurato.

---

## Fase 8 — Concorrenza controllata dei due Graph

### Condizione di ingresso

Questa fase è opzionale.

Può essere valutata soltanto se, dopo le fasi precedenti:

* Graph 1 e Graph 2 restano il collo di bottiglia principale;
* il numero di richieste è noto;
* freshness e coerenza sono affidabili;
* gli errori non sono aumentati;
* non sono emersi challenge o risposte anomale;
* il beneficio potenziale è giustificato.

### Varianti da confrontare

### A. Sequenziale ottimizzato

```txt
Graph 1
→ Graph 2
```

### B. Sfalsato

```txt
Graph 1 avviato
→ breve offset
→ Graph 2 avviato
```

### C. Concorrente limitato

```txt
massimo due Graph
→ stesso match
→ stessa generation
→ stesso command ID logico
```

### Vincoli

```txt
nessun altro scrape Betfair concorrente
numero totale richieste invariato
nessun retry simultaneo
nessun aumento di reload
nessun aumento di 4xx
nessun aumento di timeout
nessuna riduzione della validità
```

### Decisione

La concorrenza viene mantenuta soltanto se:

```txt
p50 migliora
p95 migliora
Graph success rate non peggiora
freshness non peggiora
graphSkew non peggiora
richieste totali non aumentano
anomalie non aumentano
```

In caso contrario, mantenere la modalità sequenziale ottimizzata.

---

### Gestione della cache

### Principio

Questa task non deve “eliminare tutte le cache”.

Devono essere distinte:

```txt
cache applicativa dello scraper
cache HTTP di Chrome
service worker cache
cache CDN o server
cookie e storage di sessione
risorse statiche
dati dinamici
```

### Dati dinamici

Quote, volumi e ladder devono provenire da una nuova acquisizione verificata.

### Risorse statiche

Script, CSS, font e immagini non devono essere necessariamente riscaricati a ogni ciclo.

Riutilizzare risorse statiche può migliorare:

* velocità;
* stabilità;
* consumo di banda;
* carico sul sito.

### Cache applicativa

La cache applicativa non può sostituire una nuova acquisizione dei dati live.

Può essere usata soltanto per:

* metadata invarianti;
* fallback diagnostico non presentato come live;
* deduplicazione;
* confronti.

### Cache bypass selettivo

Un eventuale bypass deve riguardare esclusivamente richieste dinamiche identificate.

Non disabilitare indiscriminatamente tutta la cache browser senza un benchmark.

---

### Blocco selettivo delle risorse

Questa ottimizzazione è facoltativa e successiva alla baseline.

Possono essere valutati:

* immagini;
* font;
* media;
* tracker;
* pubblicità;
* risorse chiaramente non necessarie.

Non bloccare senza verifica:

* script applicativi;
* XHR;
* Fetch;
* document;
* stylesheet necessari al rendering della tabella;
* WebSocket o stream eventualmente usati dai Graph.

Ogni regola di blocco deve avere test di regressione.

---

### Feature flag

Ogni modifica strutturale deve poter essere disattivata.

Flag indicativi:

```txt
BETFAIR_AGGREGATED_DOM_PARSER
BETFAIR_DYNAMIC_WAITS
BETFAIR_PERSISTENT_WORKER
BETFAIR_REUSE_GRAPH_PAGES
BETFAIR_REUSE_MARKET_PAGE
BETFAIR_GRAPH_MODE
BETFAIR_RESOURCE_BLOCKING
```

Valori possibili:

```txt
off
shadow
on
```

### Shadow mode

Quando possibile, usare una modalità shadow:

```txt
percorso attuale produce il dato canonico
→ nuovo percorso esegue confronto
→ nessuna persistenza dal nuovo percorso
→ differenze registrate in forma redatta
```

La modalità shadow non deve raddoppiare il traffico remoto verso Betfair.

È adatta soprattutto a:

* nuovo parser sullo stesso DOM;
* nuova normalizzazione;
* nuova validazione;
* nuova persistenza locale.

Non è adatta se richiede duplicare navigazioni o richieste remote.

---

### Rollback

Ogni fase deve avere un rollback esplicito.

In caso di:

* aumento errori;
* riduzione righe;
* identity mismatch;
* Graph non aggiornati;
* maggiore p95;
* aumento richieste;
* problemi CDP;
* memory leak;
* processi residui;
* partial persistence;
* challenge o anomalie;

il sistema deve poter tornare alla configurazione precedente senza migrazione manuale complessa.

---

### Metriche obbligatorie prima e dopo

Per ogni fase confrontare:

### Tempi

```txt
p50
p95
massimo
```

Per:

* durata totale;
* startup;
* CDP;
* pagina mercato;
* Graph 1;
* Graph 2;
* parsing;
* normalizzazione;
* bridge;
* persistenza;
* end-to-end.

### Qualità

```txt
tick validi
tick rifiutati
fresh
stale
not_updated
partially_updated
temporally_misaligned
invalid_identity
```

### Graph

```txt
URL tentati
URL riusciti
URL falliti
righe medie
righe minime
righe massime
graphSkew p50
graphSkew p95
```

### Traffico

```txt
richieste remote per campione
navigazioni Graph
reload mercato
redirect
retry
4xx
5xx
```

### Risorse

```txt
CPU Node
CPU Python
CPU Chrome
memoria Node
memoria Python
memoria Chrome
processi figli
pagine aperte
```

### Persistenza

```txt
write p50
write p95
byte scritti
crescita file
commit complete
partial
failed
recovered
```

---

### Obiettivi iniziali

Gli obiettivi sono soglie di valutazione, non garanzie.

### Parsing DOM

```txt
operazioni DOM/CDP
→ riduzione almeno 80%

parsing p95
→ riduzione significativa
```

### Prime fasi conservative

```txt
durata interna scrape
→ riduzione almeno 20%

richieste remote
→ uguali o inferiori

tick validi
→ non inferiori alla baseline

Graph success rate
→ non inferiore alla baseline
```

### Ottimizzazione completa

Target indicativo da verificare:

```txt
intervallo effettivo
→ riduzione del 25–45%

freshness media
→ miglioramento corrispondente

errori
→ non superiori alla baseline
```

Questi valori devono essere confermati dai benchmark reali.

Non devono essere usati come criterio per forzare modifiche rischiose.

---

### Test obbligatori

### Parsing

```txt
1. Parser precedente e aggregato
→ stessi valori canonici

2. Celle mancanti
→ comportamento equivalente o più esplicito

3. Righe duplicate
→ stessa policy

4. Ladder grande
→ snapshot coerente
```

### Freshness

```txt
5. Nuova risposta con valori modificati
→ fresh

6. Nuova risposta con valori invariati
→ fresh

7. DOM precedente senza nuova risposta
→ not_updated

8. Un solo Graph nuovo
→ partially_updated

9. Graph oltre soglia temporale
→ temporally_misaligned
```

### Identità

```txt
10. Runner errato
→ rifiuto

11. Selection ID errato
→ rifiuto

12. Market ID errato
→ rifiuto

13. Pagina del match precedente
→ rifiuto
```

### Worker

```txt
14. Un solo comando attivo
→ nessun overlap

15. Stop durante comando
→ risposta ignorata

16. Timeout
→ comando invalidato

17. Worker non responsivo
→ terminazione controllata

18. Worker riavviato
→ nuovo instance ID

19. Chrome esterno
→ lasciato aperto
```

### Pagine persistenti

```txt
20. Pagina valida riutilizzata
→ nuova acquisizione

21. Pagina chiusa
→ ricreazione controllata

22. Perdita CDP
→ oggetti invalidati

23. Cambio match
→ pagine precedenti non riutilizzate
```

### Navigazione

```txt
24. Pagina principale non ricaricata
→ identità ancora verificata

25. Redirect login
→ campione rifiutato

26. Challenge
→ backoff
→ nessun loop
```

### Concorrenza Graph

```txt
27. Sequenziale
→ baseline

28. Sfalsato
→ nessun overlap esterno

29. Concorrente limitato
→ massimo due richieste previste

30. Timeout di un Graph
→ nessuna fusione con il precedente
```

### Persistenza

```txt
31. Commit completo
→ invariato

32. Partial persistence
→ correttamente propagata

33. Recovery
→ compatibile

34. File grande
→ nessuna regressione di integrità
```

### Prestazioni

```txt
35. Benchmark ripetibile
→ p50 e p95 disponibili

36. Richieste remote
→ confronto prima/dopo

37. CPU e memoria
→ nessuna crescita non controllata

38. Stop
→ nessun processo o pagina residua
```

---

### Scenari minimi di prova

### 1. Parser aggregato con percorso attuale invariato

```txt
→ richieste remote identiche
→ output equivalente
→ parsing più rapido
```

### 2. Attese dinamiche

```txt
→ contenuto rapido
→ nessun tempo fisso inutile

→ contenuto lento
→ nessuna lettura prematura
```

### 3. Worker persistente per sessione

```txt
→ più comandi sequenziali
→ un solo processo
→ nessun overlap
→ Chrome lasciato aperto
```

### 4. Stop durante worker

```txt
→ generation invalidata
→ risposta tardiva ignorata
→ nessun tick persistito
```

### 5. Pagine Graph riutilizzate con nuova risposta

```txt
→ nuova acquisitionId
→ fresh
```

### 6. Pagine Graph riutilizzate senza nuova risposta

```txt
→ not_updated
→ nessun nuovo tick
```

### 7. Valori invariati dopo nuova risposta

```txt
→ fresh
→ nessun falso stale
```

### 8. Un solo Graph aggiornato

```txt
→ partially_updated
→ nessuna fusione con dati precedenti
```

### 9. Cambio match

```txt
→ pagine precedenti invalidate
→ nuovo mercato verificato
```

### 10. Perdita CDP

```txt
→ errore controllato
→ una sola riconnessione
→ nessuna persistenza incompleta
```

### 11. Login scaduto

```txt
→ campione rifiutato
→ health degradata
→ backoff
→ nessun loop
```

### 12. Graph sequenziali ottimizzati

```txt
→ benchmark ufficiale
```

### 13. Graph sfalsati

```txt
→ confronto con sequenziale
→ nessun aumento errori
```

### 14. Graph concorrenti

```txt
→ solo dopo approvazione
→ confronto traffico e stabilità
```

### 15. Sessione lunga

```txt
→ worker stabile
→ nessuna crescita incontrollata
→ pagine non accumulate
```

---

### Diagnostica attesa

I log devono essere strutturali e redatti.

Campi consigliati:

```txt
eventId
generationId
commandId
workerInstanceId
scrapeId
phase
action
status
reason
elapsedMs
rows
freshness
graphSkewMs
requestCount
pageCreated
pageReused
```

Esempi:

```txt
phase=graph_1
status=completed
freshness=fresh
rows=112
elapsedMs=1840
```

```txt
phase=graph_pair
status=rejected
reason=second_graph_not_updated
```

```txt
phase=worker
status=restarted
reason=command_timeout
```

Non registrare:

* Graph URL completi sensibili;
* cookie;
* token;
* header;
* payload completi;
* HTML;
* stdout raw;
* stderr raw.

---

### Report per ogni fase

Ogni fase deve produrre un report contenente:

```txt
configurazione
feature flag
numero sessioni
numero campioni
baseline p50
baseline p95
nuovo p50
nuovo p95
differenza percentuale
richieste prima
richieste dopo
freshness prima
freshness dopo
errori prima
errori dopo
CPU e memoria
decisione
```

Decisioni consentite:

```txt
keep
rollback
needs_more_data
```

---

### Ordine operativo

```txt
1. Confermare baseline Task 8.
2. Introdurre feature flag e rollback.
3. Implementare parsing DOM aggregato.
4. Confrontare output vecchio e nuovo.
5. Introdurre attese dinamiche.
6. Misurare stabilità e completezza.
7. Implementare worker Python persistente.
8. Verificare generation, command ID e cleanup.
9. Riutilizzare pagine Graph con freshness verificata.
10. Ridurre navigazioni della pagina principale, se giustificato.
11. Valutare persistenza più efficiente, se misurata come collo di bottiglia.
12. Benchmark sequenziale ottimizzato.
13. Valutare aggiornamento Graph sfalsato.
14. Valutare concorrenza limitata soltanto se ancora necessaria.
15. Consolidare configurazione finale.
16. Conservare rollback del percorso precedente per un periodo definito.
```

---

### Invarianti da preservare

```txt
un solo match
→ invariato
```

```txt
un solo scrape Betfair attivo
→ invariato
```

```txt
Chrome
→ non owned
→ non chiuso
```

```txt
Source Identity
→ classificazione invariata
```

```txt
validità tecnica
→ non indebolita
```

```txt
persistenza Task 6
→ preservata
```

```txt
risposte tardive
→ nessun effetto mutante
```

```txt
nuova ladder
→ richiede nuova acquisizione
```

```txt
valori invariati
→ non equivalgono automaticamente a stale
```

```txt
DOM precedente
→ non è un campione nuovo
```

```txt
un solo Graph aggiornato
→ non combinato con il Graph precedente
```

```txt
Graph disallineati
→ stato degradato o rifiutato
```

```txt
cache
→ non sostituisce dati live
```

```txt
velocità
→ non ottenuta aumentando indiscriminatamente le richieste
```

```txt
errore o challenge
→ backoff
→ nessun retry aggressivo
```

---

### Criterio di completamento

La task è completata quando:

* la baseline della Task 8 è disponibile;
* ogni modifica è protetta da feature flag o rollback equivalente;
* il parser aggregato produce lo stesso output canonico del parser precedente;
* le operazioni DOM/CDP sono ridotte in modo misurabile;
* le attese dinamiche non riducono la completezza delle ladder;
* un eventuale worker persistente accetta un solo comando alla volta;
* ogni comando è associato a generation ID e command ID;
* le risposte tardive del worker vengono ignorate;
* il worker può essere terminato senza chiudere Chrome;
* le pagine Graph possono essere riutilizzate soltanto dopo verifica dell’identità;
* ogni campione deriva da una nuova acquisizione dimostrabile;
* valori invariati dopo una nuova risposta possono essere classificati come freschi;
* il vecchio DOM non viene mai persistito come nuovo tick;
* un solo Graph aggiornato non viene combinato con dati precedenti;
* il disallineamento temporale dei Graph viene misurato e classificato;
* il cambio match invalida pagine e metadata precedenti;
* la perdita CDP produce un errore controllato;
* login e challenge non generano loop aggressivi;
* il numero di richieste remote è noto prima e dopo;
* le prime fasi non aumentano il traffico remoto;
* p50 e p95 migliorano in modo misurabile;
* la percentuale di campioni validi non peggiora;
* il successo dei Graph non peggiora;
* freshness e coerenza non peggiorano;
* CPU e memoria non mostrano regressioni rilevanti;
* non restano processi o pagine dopo stop;
* la persistenza continua a rispettare integrità e recovery;
* la concorrenza dei Graph viene introdotta soltanto se necessaria e dimostrata sicura;
* ogni fase dispone di test automatici;
* ogni fase dispone di benchmark prima/dopo;
* ogni fase termina con una decisione `keep`, `rollback` o `needs_more_data`;
* la configurazione finale mantiene un comportamento prudente verso Betfair.

# Ordine di lavoro proposto

1. **Sicurezza diagnostica — Task 1**
   Audit, protezione dei segreti e redazione diagnostica.
   **COMPLETATA**

2. **Launcher, porte, Chrome e ownership dei processi — Task 2**
   Verificare avvio, riuso dei servizi, fallback delle porte, lock, manifest, ownership, shutdown e contratto del futuro worker Python persistente.

3. **Integrità persistente dopo crash — Task 6**
   Commit multi-file, journal, recovery idempotente e propagazione dello stato di integrità.
   **COMPLETATA**

4. **Concorrenza, stop, generazioni e idempotenza runtime — Task 7**
   Verificare doppio start, risposte tardive, stop durante gli aggiornamenti, timeout, retry, generation ID, command ID, perdita CDP e compatibilità con il futuro worker persistente.

5. **Retention e cleanup sicuro — Task 3**
   Retention protetta delle sole cache rigenerabili, con dry-run e controlli sulla sessione attiva.
   **COMPLETATA**

6. **Fixture, test riproducibili e replay offline — Task 4**
   Creare fixture deterministiche per Source Identity, epoch, freshness, Graph parziali o disallineati, integrità persistente ed Evidence.

7. **Baseline performance, freschezza e osservabilità — Task 8**
   Misurare il percorso completo senza introdurre ottimizzazioni preventive: scraper, Playwright, CDP, Graph, parsing, persistenza, API, frontend, richieste remote e risorse locali.

8. **Ottimizzazione prudente dello scraper Betfair — Task 9**
   Applicare soltanto ottimizzazioni giustificate dalla baseline: parsing DOM aggregato, attese dinamiche, worker persistente, riuso verificato delle pagine Graph, riduzione delle navigazioni e, solo alla fine, eventuale concorrenza controllata.

9. **Strategie, classificazioni e segnali osservativi — Task 5**
   Definire output osservativi e condizioni verificabili soltanto dopo replay, freshness, qualità dati, integrità e comportamento dello scraper sufficientemente affidabili.

## Dipendenze operative principali

```txt
Task 2
→ chiarisce ownership e shutdown

Task 7
→ protegge stop, retry e risposte tardive

Task 4
→ rende riproducibili qualità e freshness

Task 8
→ produce la baseline ufficiale

Task 9
→ ottimizza sulla base di dati misurati

Task 5
→ usa dati e contratti ormai verificabili
```

## Sequenza delle attività ancora da eseguire

```txt
Task 2
→ Task 7
→ Task 4
→ Task 8
→ Task 9
→ Task 5
```
