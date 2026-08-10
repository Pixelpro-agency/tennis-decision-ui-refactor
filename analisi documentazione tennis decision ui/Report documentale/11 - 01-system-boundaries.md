# Report documentale — `docs/tennis-decision-ui/architecture/01-system-boundaries.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-011
Sequenza audit: 11/72
Documento analizzato: 01-system-boundaries.md
Percorso documento: docs/tennis-decision-ui/architecture/01-system-boundaries.md
Percorso report: Report documentale/11 - 01-system-boundaries.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 213 righe
Ruolo dichiarato: owner dei confini architetturali del sistema
Stato report: completato
```

Il documento è stato confrontato con:

- `docs/tennis-decision-ui/architecture/02-data-lifecycle.md`;
- `docs/tennis-decision-ui/operations/01-local-runtime.md`;
- `docs/tennis-decision-ui/api/06-runtime-health.md`;
- `backend/src/server.js`;
- `backend/src/sofa/matchTracker.js`;
- `backend/src/sofa/sourceIdentityGate.js`;
- `backend/src/sofa/sourceIdentityGate/sessionFactory.js`;
- `backend/src/runtime/pythonProcessRegistry.js`;
- `backend/src/runtime/matchHistoryWriterAuthority.js`;
- `backend/src/routes/betfair/loginWindowLifecycle.js`;
- `backend/src/sofa/betfair/scraperLifecycle.js`;
- `backend/src/sofa/betfair/scraperLifecycle/runner.js`;
- `frontend/src/utils/liveSessionRequests.js`;
- `frontend/src/components/LayTheWinner.jsx`;
- `implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md`;
- `implementazioni/implementazioni-proposte/02-runtime-betfair.md`;
- i rilievi già registrati nei report API 008–010.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza architetturale generale: ALTA
Ownership principali: sostanzialmente corrette
Confini persistenza/writer authority: corretti
Limite trackingSessionId: correttamente dichiarato
Aree correnti da correggere o precisare: 8
Modifiche proposte: 8
Necessità di riscrittura completa: NO
Necessità di revisione strutturale mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti proposti: nessuno
```

Il documento è solido nel descrivere i livelli principali:

```text
frontend
→ router HTTP
→ dominio/tracking
→ persistenza
→ runtime Python
→ scraper
```

ed è particolarmente corretto su:

- writer authority backend-owned;
- distinzione fra launcher lock e writer authority;
- recovery prima del listener;
- fail-closed su authority non verificabile;
- drain tracker prima del release;
- ruolo del Python process registry;
- Source Identity Gate ancora eventId-based;
- assenza di `trackingSessionId` end-to-end;
- Evidence read-only;
- Strategy ancora presente ma deprecata;
- necessità di non dichiarare implementate strutture soltanto approvate.

Le principali correzioni riguardano il rapporto fra **stato corrente** e **target già approvati**.

Il documento deve distinguere più nettamente:

```text
implementato oggi
da
approvato ma non implementato
da
legacy ancora presente
```

In particolare:

```text
IMPL-006
→ tracking session authority
→ approvata, non implementata

IMPL-016
→ Betfair runtime command authority
→ approvata, non implementata

IMPL-017
→ local control-plane boundary
→ approvata, non implementata
```

---

# 1. Struttura corrente e ownership generale

## Esito: sostanzialmente corretta

La struttura:

```text
utente
→ frontend React/Vite
→ backend Express
→ dominio/persistenza/runtime
→ wrapper Python
→ scraper
→ fonti esterne
```

corrisponde al repository.

La separazione del launcher:

```text
avvio.py
→ launcher/
→ Chrome CDP
→ backend
→ frontend
```

è corretta.

È corretta anche la distinzione:

```text
launcher
→ orchestrazione locale

backend
→ dominio, persistenza, figli Python

Chrome/CDP
→ esterno all’ownership backend
```

Non è necessario modificare la struttura di base.

---

# 2. Frontend → `/api`: esiste ancora un’eccezione legacy

## Esito: invariante non completamente vera nello stato corrente

Il documento afferma:

```text
Il frontend comunica con il backend tramite `/api`.
```

Questo è il target corretto e vale per le superfici frontend moderne.

Esiste però ancora la Strategy legacy:

```text
frontend/src/components/LayTheWinner.jsx
```

che usa direttamente:

```text
http://localhost:3001/api/strategy/lay-the-winner
```

con polling ogni tre secondi.

Quindi lo stato corrente è:

```text
frontend canonico
→ API relative /api

Strategy legacy
→ URL assoluta localhost:3001
```

La Strategy è già approvata per la rimozione tramite:

```text
CODE-001
STRATEGY-API-008
```

Il documento architetturale non deve nascondere l’eccezione prima che sia stata rimossa.

## Finding `ARCH-BOUND-001` — qualificare l’invariante `/api`

**Priorità:** alta  
**Tipo:** stato corrente vs target architetturale

### Modifica richiesta

Sostituire la formulazione assoluta con:

```markdown
Le superfici frontend canoniche comunicano con il backend tramite API
relative sotto `/api`.

La Strategy legacy contiene ancora un consumer con backend URL
hardcoded; questa è un'eccezione già destinata alla rimozione con
`CODE-001` e non deve essere replicata.
```

Dopo la rimozione verificata della Strategy, ripristinare l’invariante forte:

```text
frontend
→ soltanto API relative /api
```

Non introdurre un secondo meccanismo di configurazione per preservare il consumer legacy.

---

# 3. Local control-plane boundary

## Esito: target approvato ma non descritto in modo sufficiente

Il documento definisce il backend come runtime locale, ma non espone chiaramente il gap corrente:

```js
app.use(cors());
```

e:

```js
app.listen(port)
```

senza bind esplicito:

```text
127.0.0.1
```

`IMPL-017 — Local control-plane boundary` è già:

```text
CONFERMATA E APPROVATA
priorità critica
```

e prescrive:

```text
listen host: 127.0.0.1
allowed origins: frontend locale
allowed hosts: loopback
nessun indirizzo non loopback
```

Classifica inoltre:

```text
Start
Stop
login
confirm/revoke
```

come control plane mutante e:

```text
latest
json
health
evidence read-only
```

come data plane read-only locale.

## Finding `ARCH-BOUND-002` — aggiungere il boundary HTTP locale approvato

**Priorità:** critica  
**Tipo:** confine di rete

### Modifica richiesta

Aggiungere una sezione:

```text
Confine HTTP locale — stato corrente
```

che distingua:

### Corrente

```text
CORS globale aperto
listener senza host loopback esplicito
```

### Target approvato

```text
IMPL-017
→ loopback bind
→ Host locale
→ Origin locale
→ porte alternative launcher compatibili
```

Coordinare con:

```text
RUNTIME-HEALTH-001
PREFLIGHT-API-005
```

Non dichiarare `IMPL-017` implementata finché codice e test non lo dimostrano.

---

# 4. Betfair: le authority correnti sono due e non equivalgono a una command authority

## Esito: formulazione troppo sintetica

Il documento afferma:

```text
Il lifecycle Betfair deduplica le richieste per mercato e runtime
identity.
```

Questa frase comprime meccanismi differenti.

## Tracking scraper

`createScraperRunner` mantiene:

```text
activeScrapers: Map
```

indicizzata da:

```text
key
```

e confronta anche:

```text
runtimeIdentity
```

La runtime identity è:

```text
persistent
→ profileDir

cdp
→ cdpUrl
```

Lo scraper può riusare una Promise attiva quando:

```text
stessa key
+
stessa runtime identity
```

## Login window

`loginWindowLifecycle` mantiene invece:

```text
un solo active
```

e confronta soltanto:

```text
runtimeIdentity
```

Il target URL non partecipa alla deduplica login.

Queste due authority:

```text
scraper tracking
login window
```

sono separate.

Non esiste ancora un arbitro globale:

```text
login
vs
tracking
vs
diagnostics
```

`IMPL-016` è stata precisamente approvata per colmare questo gap.

## Finding `ARCH-BOUND-003` — descrivere correttamente le authority Betfair correnti

**Priorità:** alta  
**Tipo:** ownership runtime

### Modifica richiesta

Sostituire la frase attuale con una distinzione:

```text
tracking scraper lifecycle
→ key + runtime identity
→ authority locale alla richiesta scraper

login lifecycle
→ singolo active + runtime identity
→ authority locale alla login window

IMPL-016
→ command authority globale
→ approvata ma non ancora implementata
```

Specificare:

```text
la key testuale o la runtime identity da sole
non costituiscono canonical market authority
```

e:

```text
login/tracking non possiedono ancora handoff globale
```

---

# 5. Authority approvate ma non implementate

## Esito: copertura incompleta

Il documento già dichiara correttamente:

```text
trackingSessionId non esiste ancora
IMPL-006 resta separata
```

Manca però una vista architetturale unica delle authority approvate.

Questo è importante perché il documento afferma nel proprio scopo:

```text
non descrivere come già presenti strutture approvate ma non implementate
```

## Finding `ARCH-BOUND-004` — introdurre una matrice “corrente vs approvato”

**Priorità:** alta  
**Tipo:** stato architetturale

### Modifica richiesta

Aggiungere una tabella:

| Authority | Stato corrente | Target approvato |
| --- | --- | --- |
| Launcher lock | implementato | invariato |
| Writer authority | implementata | invariata |
| Source Identity Gate | eventId-based | session-aware con `IMPL-006` |
| Tracking session authority | assente | `IMPL-006` |
| Betfair command authority | assente | `IMPL-016` |
| Local HTTP boundary | incompleto | `IMPL-017` |

Aggiungere una nota:

```text
writer authority
→ process/storage-wide
→ non sostituisce event-scoped authority
→ non sostituisce tracking session authority
```

La matrice deve indicare lo stato, non duplicare i dettagli delle implementazioni proposte.

---

# 6. Ownership Source Identity nella tabella

## Esito: owner troppo aggregato

La tabella attuale assegna alla riga:

```text
Tracking
```

owner:

```text
backend/src/sofa/matchTracker.js e moduli update
```

e responsabilità:

```text
Scheduler, concorrenza per evento, Source Identity Gate, stop e drain
```

`Source Identity Gate` possiede però un proprio insieme di moduli:

```text
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/sourceIdentityGate/
```

Il gate non è soltanto una funzione interna del scheduler.

Possiede:

- session store;
- evaluator;
- status;
- sample validation;
- manual confirmation;
- bootstrap callback;
- mismatch lifecycle.

`matchTracker.js` integra il gate nel tracking, ma non è l’unico owner.

## Finding `ARCH-BOUND-005` — correggere l’owner Source Identity

**Priorità:** media  
**Tipo:** ownership

### Modifica richiesta

Separare o ampliare la riga:

```text
Tracking
→ matchTracker.js
→ scheduler, tracked matches, update operations, stop/drain

Source Identity
→ sourceIdentityGate.js + sourceIdentityGate/
→ gate lifecycle, candidate samples, phase, confirmation e mismatch
```

Mantenere:

```text
matchTracker
→ integratore del gate nel lifecycle live
```

Non spostare il codice soltanto per far combaciare la tabella.

---

# 7. Confini read-only e rete

## Esito: manca un guardrail per network I/O diagnostico

Il documento definisce bene che le letture non devono:

```text
avviare tracking
avviare scraper
aprire browser
aggiungere tick
modificare history/timeline
eseguire recovery
scrivere conferme
```

Manca però un confine esplicito per:

```text
network I/O
```

Questo è rilevante perché il codice corrente di:

```text
GET /api/betfair/:eventId/latest
```

può eseguire un probe HTTP verso:

```text
<cdpUrl>/json/version
```

e il report Betfair ha già registrato:

```text
BETFAIR-API-001
```

perché il `cdpUrl` corrente non viene validato con il classifier loopback canonico.

Quindi una route read-only può oggi provocare network I/O non sufficientemente confinato.

## Finding `ARCH-BOUND-006` — definire il confine delle letture con network I/O

**Priorità:** alta  
**Tipo:** guardrail read-only

### Modifica richiesta

Aggiungere:

```markdown
Una route read-only non deve produrre scritture o avviare runtime
mutante.

Se esegue un probe di rete diagnostico, il target deve essere
esplicitamente ammesso dall'owner, validato, bounded e non derivare da
un input arbitrario non classificato.
```

Registrare come eccezione corrente:

```text
Betfair latest CDP status
→ da correggere con BETFAIR-API-001
```

Dopo la correzione:

```text
solo probe loopback validato e bounded
```

Non trasformare tutte le GET in “pure local reads” se il contratto owner prevede un probe diagnostico controllato.

---

# 8. Duplicazione con Data Lifecycle e Runtime locale

## Esito: rischio di drift documentale

`01-system-boundaries.md` contiene un blocco molto dettagliato su:

- writer authority;
- ordine bootstrap;
- recovery;
- listener;
- shutdown;
- tracker drain;
- release;
- force timeout.

`02-data-lifecycle.md` contiene una descrizione quasi equivalente.

`01-local-runtime.md` possiede inoltre:

- bootstrap locale;
- launcher;
- porte;
- writer authority;
- shutdown;
- riuso servizi.

Il documento dei confini deve essere owner delle **responsabilità e invariant**, non del runbook operativo.

La duplicazione è già abbastanza dettagliata da poter divergere.

## Finding `ARCH-BOUND-007` — ridurre le sequenze operative duplicate

**Priorità:** media  
**Tipo:** ownership documentale

### Modifica richiesta

In `01-system-boundaries.md` mantenere:

```text
launcher lock
≠ writer authority
≠ tracking session authority

writer authority
→ prima di recovery e listener

shutdown
→ authority non rilasciata prima del drain verificato
```

Spostare il dettaglio procedurale verso gli owner già esistenti tramite link:

```text
02-data-lifecycle.md
01-local-runtime.md
modules/storage/02-commit-journal-and-recovery.md
```

Non creare un nuovo documento.

---

# 9. Verification boundary

## Esito: manca una sezione di verifica architetturale

Il documento contiene:

```text
Regole durante un refactor
```

ma non una matrice che dica quali test provano ciascun confine.

Per un documento architetturale è utile mantenere test **di boundary**, non l’intera suite.

## Finding `ARCH-BOUND-008` — aggiungere una matrice minima di verifica

**Priorità:** media  
**Tipo:** verificabilità

### Modifica richiesta

Aggiungere una tabella sintetica:

| Confine | Evidenza automatica |
| --- | --- |
| backend bootstrap / writer authority | `server.test.mjs`, writer authority test |
| Python ownership | `pythonProcessRegistry.test.mjs` |
| Source Identity gate | test `sourceIdentityGate/` |
| tracker drain | test `matchTracker` / shutdown |
| API relative frontend | grep/build + rimozione Strategy legacy |
| local HTTP boundary | test IMPL-017 quando implementata |
| read-only network probe | test `BETFAIR-API-001` |

Per la documentazione:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
```

Non riportare esiti `PASS` storici come prova corrente.

---

# 10. Writer authority

## Esito: sostanzialmente corretto

Le affermazioni principali sono coerenti con:

```text
matchHistoryWriterAuthority.js
server.js
```

La authority:

- calcola repository identity;
- calcola storage identity;
- registra backend instance e PID;
- verifica l’identità del processo precedente;
- distingue `alive`, `dead`, `unknown`;
- fallisce chiusa su owner non verificabile;
- viene acquisita prima della recovery;
- viene rilasciata dopo drain e listener close.

Il documento distingue correttamente:

```text
launcher lock
da
writer authority
```

e:

```text
writer authority
da
tracking session authority
```

### Precisione consigliata

Con `ARCH-BOUND-004` aggiungere:

```text
writer authority
→ serializza i backend writer sulla storage identity
→ non è event-scoped
→ non prova che una callback appartenga alla sessione live corrente
```

Non serve un change ID aggiuntivo.

---

# 11. Source Identity Gate

## Esito: limite corrente descritto correttamente

Il codice conferma che:

```text
startSourceIdentityGate(eventId)
getGateSession(eventId)
```

e la session factory contiene:

```text
eventId
```

ma non:

```text
trackingSessionId
```

Anche `buildMatchTrackingRequest` non include un session token.

Quindi la frase:

```text
non esiste ancora un trackingSessionId propagato end-to-end
```

è corretta.

Non va trasformata in stato implementato soltanto perché `IMPL-006` è approvata.

---

# 12. Persistence boundary

## Esito: coerente, ma da mantenere ad alto livello

Sono corretti:

```text
history e timeline distinti
commit journal
writer authority
integrity read-only
Evidence non owner di recovery
```

La sequenza:

```text
campione autorizzato
→ journal pending
→ history
→ timeline
→ stato completo/incompleto
```

è coerente con gli owner storage.

Non serve modificarne il significato.

Il documento deve però rinviare ai documenti storage per:

- dettagli dei journal;
- target verification;
- recovery;
- reason;
- revision future.

---

# 13. Python ownership

## Esito: coerente

Il documento afferma:

```text
backend
→ registra e termina i propri figli Python

launcher
→ non termina servizi sconosciuti

Chrome/CDP
→ non posseduto dal backend
```

Il Python process registry conferma che:

- ogni figlio ha execution ID;
- owner token interno;
- generation;
- role;
- lifecycle;
- terminazione scoped;
- stale owner non rimuove il nuovo owner.

Questa parte è corretta.

---

# 14. Strategy deprecata

## Esito: coerente, ma deve collegarsi al report specifico

Il documento dice correttamente che:

```text
router e UI Strategy
→ ancora presenti
→ non devono essere estesi
→ destinati alla rimozione
```

Aggiungere un riferimento sintetico a:

```text
CODE-001
STRATEGY-API-008
```

per collegare il boundary architetturale alla task owner.

Non duplicare nel documento i dettagli di pressure, confidence o polling Strategy.

Questa correzione rientra in `ARCH-BOUND-001`.

---

# 15. Lunghezza, responsabilità e integrità del contesto

## Valutazione

```text
Righe: 213
Responsabilità primaria: 1
Owner: architettura dei confini
Contesti indipendenti: no
Duplicazioni operative: sì
Necessità di nuovi owner: no
Suddivisione richiesta: no
```

Il documento contiene sezioni differenti, ma tutte rispondono alla stessa domanda:

```text
chi possiede cosa
e
quali confini non devono essere attraversati
```

La soluzione non è separare:

```text
frontend-boundaries.md
storage-boundaries.md
python-boundaries.md
```

perché frammenterebbe l’owner architetturale.

Occorre invece:

- mantenere una sola mappa dei confini;
- ridurre runbook duplicati;
- distinguere stato corrente e target approvato;
- collegare gli owner specialistici.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-011
Percorso report: Report documentale/11 - 01-system-boundaries.md
Documento: docs/tennis-decision-ui/architecture/01-system-boundaries.md
Change ID: ARCH-BOUND-001
Change ID: ARCH-BOUND-002
Change ID: ARCH-BOUND-003
Change ID: ARCH-BOUND-004
Change ID: ARCH-BOUND-005
Change ID: ARCH-BOUND-006
Change ID: ARCH-BOUND-007
Change ID: ARCH-BOUND-008
Suddivisione richiesta: no
Nuovi file proposti: nessuno
```

Nel prossimo aggiornamento:

```text
mappa-file-markdown-repository.md
→ registrare report 011
→ indice 11 ANALIZZATO
→ Divisione non necessaria
→ 8 nuove task
→ prossimo indice 12

modifiche-audit-markdown.json
→ aggiungere soltanto report 011
→ aggiungere soltanto ARCH-BOUND-001..008
→ preservare report 008..010 già presenti
```

I due file non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `ARCH-BOUND-001` — frontend API relative e Strategy legacy

**Priorità:** alta

**Azione:**

- qualificare l’invariante `/api`;
- registrare il consumer Strategy hardcoded come eccezione;
- collegare `CODE-001` e `STRATEGY-API-008`;
- ripristinare l’invariante forte dopo la rimozione.

---

## `ARCH-BOUND-002` — local HTTP boundary

**Priorità:** critica

**Azione:**

- aggiungere stato corrente vs target `IMPL-017`;
- documentare CORS e bind correnti;
- coordinare con Runtime Health;
- non dichiarare implementato il target prima dei test.

---

## `ARCH-BOUND-003` — authority Betfair correnti

**Priorità:** alta

**Azione:**

- separare scraper lifecycle e login lifecycle;
- descrivere key/runtime identity;
- chiarire che non esiste ancora command authority globale;
- collegare `IMPL-016`.

---

## `ARCH-BOUND-004` — matrice current vs approved

**Priorità:** alta

**Azione:**

- aggiungere launcher lock;
- writer authority;
- Source Identity eventId-based;
- IMPL-006;
- IMPL-016;
- IMPL-017;
- distinguere authority process-wide, event-scoped e session-scoped.

---

## `ARCH-BOUND-005` — owner Source Identity

**Priorità:** media

**Azione:**

- separare tracking scheduler e Source Identity Gate nella matrice owner;
- includere `sourceIdentityGate.js` e `sourceIdentityGate/`;
- mantenere `matchTracker` come integratore live.

---

## `ARCH-BOUND-006` — network I/O nelle letture

**Priorità:** alta

**Azione:**

- definire il guardrail per probe diagnostici read-only;
- vietare target arbitrari non classificati;
- collegare `BETFAIR-API-001`;
- consentire soltanto probe bounded e validati quando previsti dall’owner.

---

## `ARCH-BOUND-007` — ridurre duplicazioni operative

**Priorità:** media

**Azione:**

- mantenere invarianti;
- accorciare bootstrap/shutdown dettagliati;
- rinviare a Data Lifecycle, Runtime locale e Storage;
- non creare nuovi documenti.

---

## `ARCH-BOUND-008` — verifica dei confini

**Priorità:** media

**Azione:**

- aggiungere matrice boundary → test;
- includere writer authority, registry, gate, drain, API relative e local boundary;
- aggiungere checker documentali;
- non riportare PASS senza output corrente.

---

# Ordine consigliato di applicazione

```text
1. applicare o pianificare IMPL-017 nel server;
2. correggere BETFAIR-API-001;
3. rimuovere Strategy tramite CODE-001;
4. introdurre la matrice current vs approved;
5. correggere authority Betfair;
6. correggere owner Source Identity;
7. ridurre duplicazioni operative;
8. aggiungere matrice di verifica;
9. aggiornare 01-system-boundaries.md;
10. aggiornare mappa Markdown e JSON incrementale.
```

Le correzioni puramente documentali immediate sono:

```text
ARCH-BOUND-003
ARCH-BOUND-004
ARCH-BOUND-005
ARCH-BOUND-007
ARCH-BOUND-008
```

Le task:

```text
ARCH-BOUND-001
ARCH-BOUND-002
ARCH-BOUND-006
```

dipendono anche da modifiche runtime già registrate altrove e devono evitare di duplicare implementation task esistenti.

---

# Controlli previsti dopo un’eventuale modifica

## Boundary backend

```bash
node --check backend/src/server.js
node --check backend/src/sofa/matchTracker.js
node --check backend/src/sofa/sourceIdentityGate.js
node --check backend/src/runtime/pythonProcessRegistry.js
node --check backend/src/runtime/matchHistoryWriterAuthority.js
```

## Test owner

Eseguire almeno i test registrati per:

```text
server bootstrap/shutdown
writer authority
python process registry
match tracker drain
Source Identity Gate
Betfair scraper lifecycle
Betfair login lifecycle
```

## Frontend

Dopo CODE-001:

```bash
git grep -n "http://localhost:3001"
git grep -n "/api/strategy"
```

Risultato atteso:

```text
nessun consumer runtime Strategy
```

Verificare inoltre che le superfici canoniche continuino a usare API relative.

## Local boundary

Dopo IMPL-017:

```text
bind 127.0.0.1
Host locale ammesso
Host non locale rifiutato
Origin frontend locale ammessa
Origin esterna rifiutata
porta launcher alternativa ammessa
```

## Read-only diagnostics

Dopo BETFAIR-API-001:

```text
cdpUrl esterna
→ nessun fetch

cdpUrl loopback valida
→ probe bounded
```

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
01-system-boundaries.md: ARCHITETTURA SOLIDA, REVISIONE MIRATA NECESSARIA
Struttura dei livelli: corretta
Writer authority: corretta
Launcher ownership: corretta
Python ownership: corretta
Source Identity session gap: correttamente dichiarato
Frontend /api: eccezione Strategy da registrare
Local HTTP boundary: approvato ma non implementato
Betfair authority: da descrivere con maggiore precisione
Approved vs current: da rendere esplicito
Source Identity owner: da correggere nella matrice
Read-only network probe: guardrail mancante
Duplicazione runbook: da ridurre
Verification matrix: da aggiungere
Riscrittura completa: no
Modularizzazione: no
Nuovi documenti: nessuno
Priorità: medio-alta
```

Il documento non deve essere diviso.

È già il punto corretto in cui mantenere una singola mappa dei confini.

La revisione deve soprattutto impedire tre confusioni:

```text
current
≠ approved

process authority
≠ session authority

read-only
≠ arbitrary network access
```
