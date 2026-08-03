# Strategia generale

Non userei un solo prompt.

La Task 2 coinvolge:

lock
manifest
porte
identità dei servizi
riuso
segnali
shutdown
Chrome/CDP
frontend
backend
processi Python
log
test di integrazione

Un unico prompt avrebbe troppi file modificabili, troppi contratti simultanei e renderebbe difficile capire quale modifica abbia causato una regressione.

Procederei con nove prompt esecutivi, in sequenza. Ogni prompt dovrà:

partire dallo stato prodotto dal prompt precedente;
avere un solo obiettivo principale;
elencare esplicitamente i file autorizzati;
vietare modifiche fuori scope;
richiedere test mirati;
preservare gli invarianti del backlog;
produrre un riepilogo delle modifiche e dei test eseguiti;
non anticipare la Task 7.

# Prompt 1 — Lock atomico e identità della sessione
Problema da risolvere

Il lock attuale contiene soltanto un PID.

Il recupero stale usa:

leggi PID
→ verifica se sembra vivo
→ elimina il file
→ prova a ricrearlo

Due launcher concorrenti possono entrambi classificare il vecchio lock come stale; uno dei due può eliminare il lock appena acquisito dall’altro.

Inoltre un PID riciclato può essere scambiato per il vecchio launcher.

Obiettivo del prompt

Introdurre un lock identificato e recuperabile senza race:

{
  "schema": 2,
  "sessionId": "uuid",
  "pid": 1234,
  "createdAt": "timestamp"
}

Il lock dovrà essere acquisito con creazione esclusiva.

Il recupero stale dovrà usare una presa atomica del vecchio lock, per esempio tramite rename verso un nome di quarantena univoco, mai tramite semplice unlink seguito da ricreazione.

Il rilascio dovrà rimuovere il lock solo quando il sessionId appartiene alla sessione corrente.

Classificazione richiesta
PID vivo
+ manifest con stesso sessionId e launcherPid
→ sessione attiva

PID morto
→ stale verificato

PID vivo
+ manifest assente o incoerente
→ unknown
→ nessuna cancellazione aggressiva
File probabili
launcher/session.py
launcher/app.py
launcher/tests/test_launcher.py
Test principali
acquisizione atomica;
secondo launcher rifiutato;
due reclaim concorrenti;
lock stale con PID morto;
PID vivo e manifest coerente;
PID vivo ma manifest incoerente;
rilascio da sessione non owner;
rilascio idempotente;
file lock corrotto classificato unknown, non cancellato automaticamente.
Cosa non deve fare
non modificare porte;
non modificare CDP;
non modificare frontend o backend;
non cambiare ancora lo schema completo dei servizi nel manifest;
non introdurre dipendenze esterne per la gestione del lock.

# Prompt 2 — Manifest runtime e modello di ownership
Problema da risolvere

Il manifest corrente è piatto e non rappresenta chiaramente:

owned
reused
external
unknown

La struttura ownership attuale associa PID e ruolo, ma non descrive realmente l’ownership del servizio.

Mancano inoltre stato, porta richiesta, porta selezionata, origine e reason.

Obiettivo del prompt

Introdurre uno schema manifest esplicito, per esempio:

{
  "schema": 2,
  "session": {
    "sessionId": "...",
    "launcherPid": 1234,
    "status": "starting",
    "startedAt": "..."
  },
  "services": {
    "backend": {
      "status": "ready",
      "ownership": "owned",
      "pid": 2001,
      "requestedPort": 3001,
      "selectedPort": 3002,
      "baseUrl": "http://127.0.0.1:3002",
      "healthUrl": "http://127.0.0.1:3002/api/health",
      "instanceId": "...",
      "source": "launcher",
      "reason": "requested_port_external"
    },
    "frontend": {},
    "cdp": {}
  }
}

Valori consentiti:

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
→ unavailable
Regole
il manifest non costituisce da solo prova di identità;
uno schema vecchio non viene riutilizzato automaticamente;
il PID di un servizio reused può essere registrato come informazione, ma non diventa owned;
Chrome/CDP non può mai avere ownership=owned;
un errore parziale deve aggiornare il manifest prima del cleanup;
ogni servizio deve riportare reason e porta effettiva.
File probabili
launcher/session.py
launcher/services.py
launcher/app.py
launcher/tests/test_launcher.py
Test principali
manifest completo durante avvio standard;
backend owned;
backend reused;
servizio sconosciuto;
frontend owned e reused;
CDP reused o external, mai owned;
errore backend;
errore frontend;
manifest schema precedente non riutilizzato;
coerenza tra baseUrl, healthUrl, porta e PID;
scrittura atomica;
manifest corrotto.
Cosa non deve fare
non introdurre ancora l’endpoint d’identità frontend;
non cambiare il meccanismo CDP;
non modificare lo shutdown dei processi;
non creare il futuro worker Python.

# Prompt 3 — Segnali e shutdown idempotente del launcher
Problema da risolvere

Il launcher intercetta direttamente soltanto KeyboardInterrupt.

Non è dimostrata l’equivalenza tra:

Ctrl+C
SIGINT
SIGTERM
SIGBREAK su Windows

Inoltre un errore inatteso durante lo stop di un processo owned può impedire la terminazione degli owned successivi.

Obiettivo del prompt

Introdurre un unico percorso di shutdown:

segnale
→ richiesta di stop
→ uscita dal loop principale
→ status manifest=stopping
→ stop di ogni processo owned
→ cleanup manifest e lock

Gli handler di segnale non dovranno eseguire direttamente operazioni complesse.

Dovranno solo impostare uno stato o un evento di arresto.

Regole
shutdown idempotente;
solo processi presenti nel registry owned;
un errore su backend non blocca lo stop del frontend;
tentativo pulito;
attesa limitata;
escalation soltanto sul PID owned verificato;
nessun kill per porta;
backend/frontend reused mai terminati;
Chrome mai terminato;
cleanup lock e manifest tramite finally.
File probabili
launcher/app.py
launcher/services.py
launcher/session.py
launcher/tests/test_launcher.py
Test principali
KeyboardInterrupt;
SIGINT;
SIGTERM;
SIGBREAK simulato su Windows;
shutdown chiamato due volte;
processo già terminato;
processo non responsivo;
primo owned genera errore, secondo viene comunque fermato;
reused non viene segnalato;
force-kill soltanto sul PID registrato;
cleanup dopo errore parziale.
Cosa non deve fare
non modificare il lifecycle interno degli scraper Python;
non introdurre generation o command ID;
non modificare il frontend;
non chiudere Chrome.

# Prompt 4 — Identità e riuso sicuro del frontend
Problema da risolvere

Il backend possiede un’identità forte:

project
service
instanceId
pid
startedAt

Il frontend no.

Una porta frontend occupata viene semplicemente saltata e un altro Vite viene avviato su una porta differente. Un frontend corretto già attivo non può essere riconosciuto e riusato.

La verifica del frontend contenuto nel manifest consiste attualmente in una semplice risposta HTTP.

Obiettivo del prompt

Aggiungere al dev server Vite un endpoint locale di identità, per esempio:

/__launcher/health

con:

{
  "ok": true,
  "project": "tennis-decision-ui",
  "service": "frontend",
  "instanceId": "...",
  "pid": 1234,
  "startedAt": "...",
  "frontendPort": 3000,
  "backendTarget": "http://127.0.0.1:3001"
}
Regole di riuso
porta occupata
+ identità frontend valida
+ backendTarget uguale al backend selezionato
→ reused

porta occupata
+ identità valida
+ backendTarget differente
→ non riusato

porta occupata
+ HTTP 200 generico
→ external o unknown
→ mai riusato

frontend appena avviato
→ PID restituito deve coincidere con proc.pid
File probabili
frontend/vite.config.js
launcher/system.py
launcher/services.py
launcher/session.py
launcher/tests/test_launcher.py
Test principali
frontend identificato;
server HTTP generico respinto;
frontend con backend target sbagliato respinto;
frontend corretto riusato;
frontend reused non terminato allo shutdown;
frontend appena avviato con PID errato;
fallback quando 3000 è occupata da un processo esterno;
manifest reusable solo con identità frontend valida;
backend alternativo correttamente propagato al frontend.
Cosa non deve fare
non modificare componenti React;
non modificare il polling;
non modificare le route backend business;
non usare il semplice titolo HTML come prova di identità.

# Prompt 5 — Discovery CDP e helper Chrome
Problema da risolvere

Il launcher controlla solamente 9222.

Se un CDP valido è già attivo su una porta alternativa, non viene riusato.

Dopo l’avvio dell’helper, il manifest può restare indefinitamente in stato starting.

Lo spawn riuscito di PowerShell non dimostra che Chrome o /json/version siano realmente disponibili.

Obiettivo del prompt

Implementare una discovery limitata e deterministica:

verifica 9222
→ verifica un intervallo limitato di porte alternative
→ riusa il primo endpoint CDP valido
→ ignora porte occupate non-CDP
→ individua una porta libera
→ avvia l’helper
→ verifica il candidato con timeout limitato
→ aggiorna manifest
Stati richiesti
endpoint già valido
→ ownership=reused
→ status=ready

Chrome avviato tramite helper
→ ownership=external
→ status=starting, poi ready o unavailable

porta occupata non-CDP
→ ownership=external o unknown
→ mai terminata
Regole
validazione tramite /json/version;
richiesta di webSocketDebuggerUrl;
normalizzazione dell’URL;
stessa cdpUrl propagata a backend e frontend;
Chrome mai inserito negli owned;
nessun kill sulla porta 9222;
nessuna promessa di login Betfair;
endpoint tecnicamente disponibile distinto da sessione autenticata.
File probabili
launcher/config.py
launcher/system.py
launcher/services.py
scripts/start-cdp-dev.ps1
launcher/tests/test_launcher.py
Test principali
CDP valido su 9222;
CDP valido su porta alternativa;
9222 occupata da servizio non-CDP;
nessuna porta libera;
helper fallisce;
helper parte ma endpoint non compare;
endpoint compare correttamente;
normalizzazione URL;
Chrome mai owned;
shutdown launcher lascia Chrome aperto.
Cosa non deve fare
non effettuare login;
non ispezionare cookie o profili;
non modificare gli scraper;
non chiudere Chrome;
non confondere CDP raggiungibile con autenticazione valida.

# Prompt 6 — Propagazione CDP e blocco dei fallback falsi
Problema da risolvere

Lo stato React conserva correttamente cdpUrl="".

liveSessionRequests.js, però, interpreta la stringa vuota come valore assente e reinserisce:

http://127.0.0.1:9222

Il tracking è già protetto lato client e backend. La finestra login non lo è completamente.

Inoltre il test trackingResponses.test.mjs è obsoleto: si aspetta ancora il fallback CDP, mentre l’implementazione corrente restituisce correttamente 400.

Obiettivo del prompt

Distinguere:

undefined
→ nessuna configurazione fornita
→ eventuale fallback legacy consentito dove documentato

""
→ indisponibilità esplicita dichiarata dal launcher
→ nessun fallback
Modifiche previste
preservare cdpUrl="" in buildBetfairLoginRequest;
lasciare che liveSessionApi.requireCdpUrl() blocchi il login;
aggiungere validazione backend a /api/betfair/login-window per mode=cdp e URL vuoto;
aggiornare il test obsoleto di trackingResponses;
non modificare il comportamento documentato della route diagnostica /api/test/cdp, che può mantenere il proprio fallback esplicito.
File probabili
frontend/src/utils/liveSessionRequests.js
frontend/src/utils/liveSessionRequests.test.mjs
frontend/src/hooks/useAnalysisSessionState.js
frontend/src/utils/analysisSessionState.js
frontend/src/services/liveSessionApi.js
backend/src/routes/betfair.js
backend/src/routes/match/trackingResponses.test.mjs

analysisSessionState.js non dovrebbe richiedere modifiche funzionali; servirà per fissare il contratto con un test sulla stringa vuota.

Test principali
cdpUrl="" resta vuoto;
cdpUrl=undefined segue il fallback documentato;
login CDP con stringa vuota non effettua fetch;
route login CDP vuota restituisce 400;
nessun processo Python viene avviato;
tracking CDP vuoto restituisce 400;
test obsoleto aggiornato;
modalità persistent non viene alterata.
Cosa non deve fare
non modificare discovery porte;
non modificare Playwright;
non cambiare la route diagnostica CDP senza una ragione separata;
non introdurre login automatico.

# Prompt 7 — Lifecycle dei processi Python owned dal backend
Problema da risolvere

Il backend possiede i processi scraper, ma la terminazione globale attuale:

invia SIGTERM
→ svuota il registry
→ non attende exit
→ non garantisce escalation

La condizione basata su proc.killed non prova che il processo sia terminato.

Inoltre il processo --login-only non è registrato nel lifecycle centrale.

La sua funzione Python attende che l’intero context.pages diventi vuoto:

while context.pages:
    await asyncio.sleep(1)

In modalità CDP può quindi restare attiva anche dopo la chiusura della pagina Betfair, se Chrome contiene altre schede.

Obiettivo del prompt

Garantire:

backend shutdown
→ stop tracker
→ terminazione bounded di tutti i Python owned
→ escalation sul solo PID/process tree owned
→ nessun Python orfano
→ Chrome CDP esterno resta aperto
Scraper normali

Il lifecycle dovrà:

conservare il processo finché exit o close non sono realmente avvenuti;
non usare proc.killed come prova di uscita;
inviare terminazione pulita;
attendere per un tempo limitato;
eseguire escalation verificata;
non svuotare il registry prima della conclusione;
rendere la terminazione idempotente;
consentire lo shutdown del backend senza attesa infinita.
Login-only

Dovrà avere un registry backend esplicito oppure essere integrato in un lifecycle dedicato.

La funzione Python dovrà attendere:

chiusura della pagina gestita
oppure disconnessione browser
oppure terminazione del processo

Non dovrà attendere la chiusura di tutte le altre schede del Chrome CDP.

Future worker

Questo prompt fisserà anche la decisione architetturale:

futuro worker Python persistente
→ owned esclusivamente dal backend
→ mai owned direttamente dal launcher

La scelta è coerente con l’architettura corrente, dove il backend avvia già gli scraper Python. Il launcher possiederà soltanto il backend.

File probabili
backend/src/server.js
backend/src/server.test.mjs
backend/src/sofa/betfair/scraperLifecycle.js
backend/src/sofa/betfair/scraperLifecycle/runner.js
backend/src/sofa/betfair/scraperLifecycle.test.mjs
backend/src/sofa/betfairFetch.js
backend/src/routes/betfair/loginWindow.js
backend/src/routes/betfair.js
scrapers/betfair/scrape.py
scrapers/betfair/cli.py

Potrebbe essere introdotto un piccolo modulo dedicato al lifecycle login, ma solo se il prompt dimostra che è più semplice e isolato rispetto all’estensione del runner esistente.

Test principali
scraper esce dopo SIGTERM;
scraper ignora SIGTERM;
escalation eseguita;
registry non svuotato prematuramente;
terminazione chiamata due volte;
un processo già uscito;
errore su un processo non blocca gli altri;
backend attende il cleanup bounded;
timeout globale backend;
login-only registrato;
login-only terminato allo shutdown;
chiusura della sola pagina Betfair termina Python;
altre schede CDP restano aperte;
Chrome CDP non riceve segnali;
persistent browser figlio gestito dal proprio processo owner.
Confine con la Task 7

Questo prompt deve risolvere soltanto la terminazione fisica.

Non deve introdurre:

generation ID;
command ID;
invalidazione delle risposte tardive;
nuovi contratti di deduplicazione;
cancellazione semantica delle promise;
worker persistente reale.

Questi aspetti resteranno nella Task 7.

# Prompt 8 — Log strutturali e niente output raw dei figli
Problema da risolvere

Il launcher legge e ristampa direttamente stdout dei processi figli.

Questo contrasta con il requisito della Task 2 secondo cui i log devono essere strutturali e non devono esporre stdout o stderr raw.

Anche il percorso login stampa attualmente l’intera command line Python, comprendendo URL e altri argomenti.

Obiettivo del prompt

Produrre log del tipo:

service=backend
requestedPort=3001
selectedPort=3002
ownership=owned
status=ready
pid=1234
action=start
reason=requested_port_external

Per i figli:

service=backend
pid=1234
stdoutBytes=820
stderrBytes=0
exitCode=0

senza ristampare le righe raw.

Regole
i pipe devono essere drenati per evitare deadlock;
l’output raw non deve essere mostrato nel terminale;
niente argomenti completi dello spawn;
niente URL Betfair completi;
niente profili, token o header;
reason tecniche statiche;
errori non sensibili;
log shutdown per ogni owned.
File probabili
launcher/system.py
launcher/services.py
launcher/tests/test_launcher.py
backend/src/routes/betfair/loginWindow.js

Eventuali modifiche a log Node dovranno essere limitate ai percorsi coinvolti nella Task 2.

Test principali
reader drena senza ristampare;
conteggio byte;
niente marker sensibile nei log;
command line login non stampata;
URL completi assenti;
reason e PID presenti;
exit code e shutdown result presenti.
Cosa non deve fare
non riaprire la Task 1;
non cambiare scraping o payload;
non aggiungere dump diagnostici;
non introdurre un sistema di logging generale per tutto il progetto.

# Prompt 9 — Integrazione, regressione e documentazione finale

Questo sarà l’ultimo prompt della Task 2.

Non introdurrà nuove funzionalità, salvo correzioni minime necessarie per fare rispettare contratti già implementati.

Obiettivo

Eseguire la verifica integrata di:

lock
manifest
backend
frontend
porte alternative
CDP
segnali
shutdown
figli Python
log
Scenari da coprire

Almeno:

avvio standard;
backend corretto già attivo;
backend estraneo sulla porta preferita;
frontend corretto già attivo;
frontend estraneo;
backend e frontend su porte alternative;
CDP alternativo;
9222 occupata da servizio non-CDP;
CDP assente;
CDP raggiungibile ma non autenticato;
doppio avvio ravvicinato;
lock stale;
PID riciclato simulato;
Ctrl+C;
SIGTERM;
SIGBREAK Windows;
errore durante avvio backend;
errore durante avvio frontend;
owned non responsivo;
shutdown doppio;
scraper Python non responsivo;
processo login-only;
Chrome lasciato aperto;
nessun output raw;
manifest finale coerente.
Documentazione da aggiornare
docs/tennis-decision-ui/operations/01-local-runtime.mdx
docs/tennis-decision-ui/modules/python/01-entrypoints-and-runtime.mdx
docs/tennis-decision-ui/modules/python/03-betfair-scraper.mdx
docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.mdx
docs/tennis-decision-ui/api/01-match.mdx
docs/tennis-decision-ui/api/02-betfair.mdx
docs/tennis-decision-ui/api/05-preflight.mdx
Output finale richiesto al prompt
file modificati
test eseguiti
test passati
prove controllate
invarianti preservati
limiti residui
aspetti rinviati alla Task 7
Ordine di esecuzione

L’ordine deve essere questo:

1. Lock e session identity
2. Manifest runtime
3. Segnali e shutdown launcher
4. Identità frontend
5. Discovery CDP
6. Propagazione CDP
7. Processi Python backend-owned
8. Log strutturali
9. Integrazione e documentazione

Le dipendenze sono intenzionali:

lock
→ rende sicura la sessione

manifest
→ rende osservabile ownership e stato

shutdown
→ utilizza ownership affidabile

frontend identity
→ abilita riuso reale

CDP discovery
→ produce endpoint corretto

CDP propagation
→ impedisce fallback falsi

Python lifecycle
→ completa lo shutdown del backend

logging
→ rende verificabile il comportamento

integration
→ dimostra la task completa
Decisioni ormai definitive
La Task 2 sarà divisa in più prompt.
Il launcher possiede soltanto backend e frontend avviati dalla sessione.
Chrome/CDP non è mai owned.
Il futuro worker Python persistente sarà owned dal backend, non dal launcher.
Il tracking CDP senza URL deve restituire 400.
La stringa vuota CDP è uno stato esplicito e non deve diventare 9222.
Il fallback della route diagnostica /api/test/cdp resta separato.
Il frontend deve avere un’identità verificabile.
Il manifest non è una prova sufficiente di identità.
Nessuna terminazione può essere basata sulla sola porta.
La terminazione fisica dei processi Python appartiene alla Task 2.
Generation, command ID e risposte tardive appartengono alla Task 7.
