# Tennis Decision UI — Audit della documentazione

> Contiene i rilievi `DOC-*` e `WORKFLOW-*` relativi ai documenti, oltre alla checklist documentale.

## 9. Rilievi iniziali già registrati

### DOC-001 — Roadmap troppo vicina alla cronologia delle task

**Stato:** `CONFERMATO`
**Priorità:** alta per la revisione documentale
**Area:** roadmap e stato corrente

**Documenti coinvolti:**

```txt
docs/tennis-decision-ui/roadmap/01-current-state.mdx
```

**Osservazione**

La roadmap contiene molte sezioni organizzate attorno a numeri di task, sotto-task, collaudi e passaggi storici:

```txt
Task 1A
Task 1B
Task 2A–2F
Task 2 runtime
Task 3a
Task 4
Task 6
collaudi 9A-R2B e 9B
```

Il contenuto è utile come memoria del lavoro svolto, ma una parte consistente non appartiene più al documento canonico dello stato corrente.

**Motivo**

La futura documentazione deve distinguere:

```txt
implementato
validato automaticamente
validato live
validazione aperta
pianificato
legacy
```

senza dipendere dalla cronologia dei prompt.

**Cosa mantenere**

- stato reale delle funzionalità;
- validazioni ancora aperte;
- limiti intenzionali;
- priorità tecniche;
- distinzioni tra implementato e validato;
- riferimenti ai documenti owner.

**Cosa eliminare o spostare**

- narrazione dettagliata delle singole task quando non necessaria;
- ripetizioni dei contratti già presenti nei documenti owner;
- riferimenti a collaudi storici privi di utilità operativa corrente;
- passaggi intermedi ormai superati.

**Cosa riscrivere**

La roadmap deve diventare una vista dello stato corrente e delle priorità, non un diario.

**Cosa controllare ancora**

- quali prove storiche devono essere conservate;
- se creare un archivio separato dei collaudi;
- se alcuni numeri di task sono ancora usati da procedure esterne;
- quali sezioni possono essere sostituite da link ai documenti owner;
- separazione fra stato attuale, validazioni aperte, task storiche e priorità;
- spostamento dei dettagli tecnici di Source Identity, journal, Betfair e runtime nei documenti owner;
- eventuale trasformazione del documento in una vista breve con tabella di stato e link.

**Decisione richiesta**

Definire con l’utente quanta cronologia mantenere e dove conservarla.

**Criterio di chiusura**

- roadmap leggibile come stato corrente;
- nessuna informazione tecnica unica persa;
- cronologia utile conservata in posizione approvata;
- nessuna duplicazione inutile dei contratti.

---

### DOC-002 — Repository map troppo estesa e potenzialmente duplicata

**Stato:** `CONFERMATO`
**Priorità:** media
**Area:** orientamento documentale

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/reference/01-repository-map.mdx
```

**Osservazione**

La mappa contiene non soltanto percorsi e responsabilità, ma anche dettagli su:

- ownership runtime;
- journal e integrity;
- endpoint;
- Source Identity;
- frontend;
- dati sensibili;
- comportamento delle route read-only;
- invarianti di persistenza.

Molti di questi contenuti sono già presenti nei documenti owner.

**Motivo**

Lo stesso contratto ripetuto in più file aumenta il rischio di divergenza.

**Cosa mantenere**

- struttura root;
- aree principali;
- responsabilità generali;
- file owner;
- riferimenti ai documenti specifici;
- esclusioni per il contesto AI.

**Cosa potrebbe essere ridotto o spostato**

- payload e status HTTP;
- dettagli completi del lifecycle;
- regole già definite nei documenti Runtime, API, Storage, Evidence e Frontend;
- descrizioni troppo granulari dei singoli hook.

**Verifica aggiuntiva sul repository**

Il documento elenca un `package-lock.json` nella root, ma il file non è stato risolto sullo SHA corrente. I manifest verificati appartengono ai sottoprogetti `backend/` e `frontend/`. La voce root deve quindi essere corretta o dimostrata prima della riscrittura.

**Cosa controllare ancora**

- informazioni presenti soltanto nella repository map;
- link che dipendono dal contenuto attuale;
- uso della mappa nei prompt o in procedure automatiche.

**Criterio di chiusura**

La mappa deve spiegare dove si trova una responsabilità e quale documento la possiede, senza diventare un secondo manuale completo.

---

### DOC-003 — Confine read-only del router Evidence descritto in modo ambiguo

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** API Evidence e Source Identity

**Codice coinvolto:**

```txt
backend/src/routes/evidence.js
backend/src/routes/evidence/evidenceResponses.js
backend/src/sofa/sourceIdentityGate.js
backend/src/sofa/sourceIdentityGate/manualConfirmation.js
backend/src/sofa/matchTracker.js
```

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/api/03-evidence.mdx
```

**Osservazione**

La lettura latest Evidence è read-only, ma il router Evidence contiene anche:

```txt
POST /api/evidence/:eventId/source-identity/confirm
DELETE /api/evidence/:eventId/source-identity/confirm
```

La conferma con gate attivo può:

```txt
persistenza della conferma operatore
→ apertura di recording
→ bootstrap canonico SofaScore → Betfair
```

La revoca modifica lo store delle conferme.

**Motivo**

Descrivere l’intero router come read-only confonde il confine degli effetti collaterali.

**Cosa mantenere**

- `GET latest` read-only;
- lettura integrity read-only;
- assenza di recovery dalle route;
- distinzione fra Evidence e persistenza canonica;
- regole della conferma manuale.

**Cosa riscrivere**

Separare esplicitamente:

```txt
GET latest
→ read-only

POST confirm fallback
→ scrive la conferma

POST confirm gate-aware
→ scrive la conferma
→ può aprire recording
→ può eseguire bootstrap canonico

DELETE confirm
→ revoca una conferma persistita
```

**Verifica completata sullo SHA corrente**

- il fallback senza gate scrive soltanto il record di conferma;
- il percorso gate-aware chiama la conferma della sessione attiva;
- una conferma `aligned` può invocare `onOpenRecording(...)` e il bootstrap canonico;
- un bootstrap fallito mantiene il gate in `pending` e non restituisce successo;
- la revoca modifica il confirmation store ed è distinta dalla lettura latest;
- i test di `evidenceResponses.js` coprono fasi gate, mapping `400/409/422` e successo `recording`.

**Cosa controllare ancora**

- eventuali formulazioni analoghe nei documenti Source Identity e data lifecycle;
- test route-level completi per fallback e revoca durante il successivo audit Evidence.

**Criterio di chiusura**

Il documento deve distinguere chiaramente endpoint read-only ed endpoint mutanti senza attribuire a Evidence responsabilità di recovery o scrittura diretta del journal.

---

### DOC-004 — La migrazione `.mdx` → `.md` richiede conversione strutturale

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** intera documentazione canonica

**Documenti coinvolti:**

```txt
docs/tennis-decision-ui/**/*.mdx
README.md
```

**Osservazione**

I documenti contengono sintassi specifica MDX:

```js
export const meta = {
  id: '...',
  order: 1,
  title: '...',
};
```

Inoltre indice, convenzioni e collegamenti usano esplicitamente estensioni `.mdx`.

Una semplice rinomina produrrebbe file `.md` contenenti JavaScript non appartenente al Markdown ordinario e lascerebbe link non aggiornati.

**Cosa mantenere**

- `id`;
- ordine;
- titolo;
- eventuali campi `version`, `status` e `language`;
- struttura di navigazione;
- collegamenti fra documenti.

**Proposta tecnica da verificare**

Convertire i metadata in frontmatter YAML:

```yaml
---
id: source-identity
order: 2
title: Source Identity
status: active
language: it
---
```

**Cosa controllare ancora**

- eventuali script o CI che leggono `export const meta`;
- eventuali consumer che cercano file `.mdx`;
- gestione futura di frontmatter YAML;
- link nel README, nei prompt, nei test e nei documenti planning;
- compatibilità di GitHub e degli strumenti AI usati dall’utente.

**Criterio di chiusura**

- nessun nuovo `.mdx`;
- nessun `export const meta` rimasto nei nuovi `.md`;
- metadata preservati in forma leggibile;
- link aggiornati;
- nessun duplicato canonico `.mdx`/`.md`.

---

### DOC-005 — Le convenzioni documentali attuali impongono il formato da sostituire

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** convenzioni documentali

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/ai/02-documentation-conventions.mdx
```

**Osservazione**

Il documento prescrive:

```txt
01-nome-chiaro.mdx
02-nome-chiaro.mdx
```

e utilizza `.mdx` in owner, esempi, link e checklist.

**Motivo**

La nuova regola `.md` non può essere applicata stabilmente finché il documento che governa la documentazione continua a imporre `.mdx`.

**Azione proposta**

Questo deve essere uno dei primi documenti riscritti.

Deve definire:

- estensione `.md`;
- metadata Markdown compatibili;
- documenti owner;
- distinzione fra tecnico, planning, workflow e storico;
- criteri di dimensione;
- link senza dipendenze obsolete;
- procedura di sostituzione dei vecchi file.

**Criterio di chiusura**

La convenzione futura non deve contenere istruzioni che ricreino `.mdx`.

---

### DOC-006 — Repository map e documenti architetturali duplicano contratti owner

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** reference e architecture

**Documenti coinvolti:**

```txt
reference/01-repository-map.mdx
architecture/01-system-boundaries.mdx
architecture/02-data-lifecycle.mdx
```

**Osservazione**

I documenti dichiarano finalità di orientamento e confine, ma contengono anche dettagli specifici su:

- ruoli pubblici del process registry;
- ownership e shutdown;
- campi runtime;
- journal e recovery;
- Source Identity Gate;
- tick Betfair `status-only`;
- `graphHealth.status`;
- flag diagnostici;
- sequenza bootstrap;
- eccezioni di persistenza;
- risposte integrity;
- comportamento dettagliato del frontend.

**Motivo**

Questi dettagli appartengono soprattutto ai documenti owner di Runtime, Betfair, Storage, Evidence e Frontend.

La duplicazione:

- aumenta il costo di aggiornamento;
- rende difficile capire quale file è fonte primaria;
- produce documenti di orientamento troppo lunghi;
- espone al rischio di contratti divergenti.

**Cosa mantenere**

Repository map:

- percorsi;
- responsabilità;
- entrypoint;
- owner;
- tipi di dati;
- link ai documenti specifici.

System boundaries:

- confini fra frontend, API, dominio, persistenza, Python e runtime;
- responsabilità che non devono attraversare i confini;
- invarianti realmente trasversali.

Data lifecycle:

- flusso generale;
- distinzione acquisizione, normalizzazione, gate, persistenza, lettura ed Evidence;
- rimandi ai documenti owner.

**Cosa spostare**

- dettagli Graph logout e `status-only` → Betfair;
- registry fisico e ruoli → Runtime;
- journal repair e integrity dettagliata → Storage;
- fasi e bootstrap dettagliati → Source Identity;
- stati UI dettagliati → Frontend.

**Criterio di chiusura**

Ogni contratto dettagliato deve avere un owner unico; i documenti architetturali devono collegarlo senza ripeterlo integralmente.

---

### WORKFLOW-001 — `ai/01-context-selection.mdx` contiene più responsabilità

**Stato:** `CONFERMATO`
**Priorità:** alta per il nuovo workflow
**Area:** metodologia operativa e contesto AI

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/ai/01-context-selection.mdx
```

**Osservazione**

Il documento include insieme:

- selezione del contesto;
- file autorizzati;
- regola dei tre tentativi;
- gestione dei test falliti;
- divieto di leggere test non autorizzati;
- generazione di `fileModificati.md`;
- uso di Repomix;
- template completo del prompt;
- formato del report;
- esempio esecutivo Source Identity;
- esclusioni di sicurezza.

**Motivo**

Non è più un singolo documento di “context selection”. Mescola:

```txt
policy del contesto
+ ruolo dell’esecutore
+ protocollo di test
+ protocollo degli artefatti
+ template prompt
+ regole di fallimento
```

Questo rende difficile adattare il metodo dell’altro progetto e distinguere le regole della Chat Analisi da quelle dell’esecutore.

**Cosa mantenere**

- principio del minimo contesto sufficiente;
- file modificabili e consultabili separati;
- documento owner pertinente;
- nessun dump o dato sensibile;
- massimo tre tentativi ragionati;
- artefatto post-task;
- stop dopo il terzo fallimento.

**Cosa riscrivere o dividere**

Proposta:

```txt
workflow/
├── 01-ruoli-e-responsabilita.md
├── 02-regole-prompt-esecutivi.md
├── 03-test-tentativi-e-stop.md
├── 04-report-e-file-modificati.md
└── 05-selezione-contesto.md
```

La collocazione definitiva deve essere decisa dopo il confronto con i documenti dell’altro progetto.

**Cosa controllare ancora**

- quali regole sono ancora approvate;
- differenza fra Chat Analisi, esecutore e collaudatore;
- compatibilità con ChatGPT Desktop e altri esecutori;
- se `fileModificati.md` resta l’unico artefatto;
- se la regola di non leggere test invariati deve valere soltanto per l’esecutore.

**Criterio di chiusura**

Ogni regola operativa deve avere un owner chiaro e non deve essere confusa con la documentazione dell’architettura applicativa.

---

### DOC-007 — `roadmap/01-current-state.mdx` unisce stato, storia e validazione

**Stato:** `CONFERMATO`
**Priorità:** alta
**Area:** roadmap

**Osservazione**

Il documento contiene:

- tabella delle funzioni implementate;
- spiegazioni tecniche dettagliate;
- Task 1A, 1B, 2A–2F, Task 2 runtime, Task 3a, Task 4 e Task 6;
- esiti di collaudi denominati;
- scenari live ancora aperti;
- hardening;
- debiti tecnici;
- ordine consigliato;
- attività da non anticipare.

**Motivo**

Sono almeno quattro responsabilità:

```txt
stato corrente
+ registro storico delle task
+ registro delle validazioni
+ roadmap futura
```

**Azione proposta**

Separare almeno:

```txt
stato-corrente.md
validazioni-aperte.md
roadmap-tecnica.md
archivio-task-e-collaudi.md
```

La necessità dell’archivio separato deve essere decisa dall’utente.

**Criterio di chiusura**

Lo stato corrente deve essere leggibile senza conoscere la numerazione storica delle task, mentre le prove utili non devono andare perse.

---

### DOC-008 — Il README deve diventare il primo punto della migrazione `.md`

**Stato:** `CONFERMATO`
**Priorità:** media
**Area:** root

**Documento coinvolto:**

```txt
README.md
```

**Osservazione**

Il README collega direttamente:

```txt
docs/tennis-decision-ui/index.mdx
```

**Azione proposta**

Aggiornare il link soltanto quando il nuovo indice `.md` è pronto e verificato.

**Criterio di chiusura**

Il README deve puntare a un unico indice canonico esistente.

## 10. Aree da ricontrollare nella documentazione

Lista iniziale:

- [ ] indice e mappa dei documenti;
- [ ] README root;
- [ ] repository map;
- [ ] system boundaries;
- [ ] data lifecycle;
- [ ] API Match;
- [ ] API Betfair;
- [ ] API Evidence;
- [ ] API Strategy;
- [ ] API Preflight;
- [ ] API Runtime Health;
- [ ] tracking SofaScore;
- [ ] local context e point-by-point;
- [ ] timeline e history;
- [ ] journal e recovery;
- [ ] lifecycle Betfair;
- [ ] validità tecnica Betfair;
- [ ] Match Evidence Snapshot;
- [ ] Source Identity;
- [ ] qualità, flow e alignment;
- [ ] Market Reactions;
- [ ] frontend session shell;
- [ ] polling e view model;
- [ ] UI Betfair e Market Reactions;
- [ ] match context UI;
- [ ] entrypoint e runtime Python;
- [ ] scraper SofaScore;
- [ ] scraper Betfair;
- [ ] Graph URL;
- [ ] runtime locale;
- [ ] controllo tracking;
- [ ] diagnostica Betfair;
- [ ] validation e rollback;
- [ ] retention e cleanup;
- [ ] validazione live Source Identity;
- [ ] validazione live Betfair;
- [ ] current state;
- [ ] replay e backtesting;
- [ ] Market Reactions Journal;
- [ ] file legacy e collegamenti;
- [ ] meta e frontmatter;
- [ ] link relativi;
- [ ] test citati;
- [ ] percorsi citati;
- [ ] contratti duplicati.

---

## 11. Checkpoint audit API — SHA `b277bd9b7373dfd8702e65446c88bab7a0f64dcc`

### Perimetro verificato

```txt
docs/tennis-decision-ui/api/01-match.mdx
docs/tennis-decision-ui/api/02-betfair.mdx
docs/tennis-decision-ui/api/03-evidence.mdx
docs/tennis-decision-ui/api/04-strategy.mdx
docs/tennis-decision-ui/api/05-preflight.mdx
docs/tennis-decision-ui/api/06-runtime-health.mdx
```

Confronto eseguito con:

```txt
backend/src/server.js
backend/src/routes/match.js
backend/src/routes/match/
backend/src/routes/betfair.js
backend/src/routes/betfair/
backend/src/routes/evidence.js
backend/src/routes/evidence/
backend/src/routes/strategy.js
backend/src/routes/strategy/
backend/src/routes/test.js
backend/src/routes/test/
backend/src/runtime/pythonProcessRegistry.js
frontend/src/App.jsx
frontend/src/components/LayTheWinner.jsx
frontend/src/services/liveSessionApi.js
frontend/src/hooks/usePreflightChecks.js
```

Sono stati letti anche i test mirati disponibili per Match, Evidence, Strategy, Betfair, Graph URL e server health.

Questa verifica prova la presenza e il contenuto dei test sul repository. Non equivale alla loro esecuzione sullo SHA corrente.

---

### Esito sintetico per API

| API | Esito audit | Rilievi principali |
| --- | --- | --- |
| Match | contratto prevalentemente coerente | `DOC-009`, `CODE-003` sul debug legacy |
| Betfair | contratto prevalentemente coerente ma sovradocumentato | `DOC-010`, `DOC-011` |
| Evidence | contratto dettagliato e quasi coerente | `DOC-003`, `DOC-011` |
| Strategy | contratto coerente con una superficie legacy ancora attiva | `DOC-012`, `CODE-001`, `CODE-004` |
| Preflight | documento coerente con il codice, ma il codice valida troppo permissivamente Betfair | `DOC-013`, `CODE-002` |
| Runtime Health | contratto coerente con codice e test ispezionato | nessuna correzione funzionale individuata |

---

### DOC-009 — `debug-last` è documentato come dato disponibile ma non ha un producer reale

**Stato:** `CONFERMATO`

**Priorità:** media

**Area:** API Match

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/api/01-match.mdx
```

**Codice coinvolto:**

```txt
backend/src/routes/match.js
backend/src/routes/match/readResponses.js
backend/src/routes/match/readResponses.test.mjs
```

**Osservazione**

Il documento descrive:

```txt
GET /api/match/debug-last
→ restituisce l’ultimo debug disponibile
```

Nel router, però:

```txt
let lastDebugData = null
```

e non esiste alcuna assegnazione successiva. Anche `logDebug(...)` non aggiorna quel valore: emette soltanto un evento statico nel runtime logger.

Il test di `buildDebugLastResponse` dimostra che l’helper saprebbe restituire un oggetto ricevuto, ma non prova che il router ne produca o ne conservi uno.

**Comportamento effettivo**

```txt
GET /api/match/debug-last
→ sempre { error: "No data captured yet" }
```

finché il codice resta invariato.

**Azione proposta**

Prima della riscrittura scegliere una delle due opzioni:

1. rimuovere endpoint e documentazione se il debug è legacy;
2. definire un producer esplicito, bounded e redatto se il debug serve ancora.

Non reintrodurre payload raw o dati sensibili soltanto per rendere vivo l’endpoint.

**Criterio di chiusura**

Il contratto documentato deve corrispondere a un comportamento realmente raggiungibile.

---

### DOC-010 — L’API Betfair cita un adapter con nome non esistente

**Stato:** `CONFERMATO`

**Priorità:** media

**Area:** API Betfair e persistence integrity

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/api/02-betfair.mdx
```

**Osservazione**

Il documento usa il nome:

```txt
getBetfairPersistenceIntegrity(eventId, source = 'betfair')
```

Il router e `latestPayload.js` usano invece:

```txt
getMatchPersistenceIntegrity(eventId, 'betfair')
```

importato da:

```txt
backend/src/sofa/matchHistory.js
```

**Impatto**

Il comportamento documentato è sostanzialmente corretto, ma il nome dell’adapter può portare a:

- cercare una funzione inesistente;
- creare un duplicato non necessario;
- preparare prompt con file o simboli sbagliati.

**Azione proposta**

Usare ovunque il nome reale oppure descrivere genericamente l’adapter pubblico di persistence integrity senza inventare un alias Betfair.

**Criterio di chiusura**

Tutti i simboli citati nel documento devono esistere sul repository.

---

### DOC-011 — I documenti API incorporano troppa logica dei moduli owner

**Stato:** `CONFERMATO`

**Priorità:** alta

**Area:** API Match, Betfair ed Evidence

**Documenti coinvolti:**

```txt
docs/tennis-decision-ui/api/01-match.mdx
docs/tennis-decision-ui/api/02-betfair.mdx
docs/tennis-decision-ui/api/03-evidence.mdx
```

**Osservazione**

I documenti non si limitano al contratto HTTP. Ripetono in modo esteso:

- algoritmi Money Flow;
- regole di validazione raw/computed;
- logout Graph e tick `status-only`;
- lifecycle e ownership dei processi;
- journal, recovery e normalizzazione integrity;
- fasi Source Identity;
- bootstrap;
- degradazione cross-source;
- cronologia di collaudi e assenza di specifiche prove post-fix;
- lunghe matrici di test appartenenti ai moduli.

**Motivo**

Una API deve possedere principalmente:

```txt
metodo
path
input
output
status
side effect
sicurezza
owner delegati
```

Le regole algoritmiche e di lifecycle devono avere owner nei documenti Betfair, Storage, Source Identity, Evidence e Runtime.

**Cosa mantenere nelle API**

- shape pubbliche;
- status HTTP;
- effetti collaterali osservabili;
- errori pubblici;
- differenza read-only/mutante;
- link ai documenti owner;
- smoke test e test di contratto essenziali.

**Cosa spostare**

- algoritmi Money Flow → modulo Betfair/Money Flow;
- journal e recovery dettagliati → Storage;
- gate e bootstrap → Source Identity;
- health e process lifecycle → Runtime/Betfair;
- validazioni storiche e prove live → registro separato delle validazioni.

**Criterio di chiusura**

Il contratto HTTP deve restare completo senza diventare una seconda copia dei moduli interni.

---

### DOC-012 — Strategy è legacy ma ancora parte del runtime corrente

**Stato:** `CONFERMATO`

**Priorità:** media

**Area:** API Strategy

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/api/04-strategy.mdx
```

**Codice verificato:**

```txt
backend/src/routes/strategy.js
backend/src/routes/strategy/layTheWinner.js
frontend/src/App.jsx
frontend/src/components/LayTheWinner.jsx
```

**Osservazione**

La Strategy non è codice morto:

```txt
App.jsx
→ importa LayTheWinner
→ rende la vista quando activeView = lay

LayTheWinner.jsx
→ chiama GET /api/strategy/lay-the-winner
→ polling ogni 3 secondi
```

Il backend continua a:

- eseguire `buildSofaAnalysis(eventId)`;
- leggere la timeline Betfair;
- costruire il view model;
- restituire Market Evidence;
- dichiarare il segnale legacy non disponibile.

**Conclusione**

La classificazione corretta è:

```txt
superficie implementata
+ consumer frontend attivo
+ strategia operativa disabilitata/legacy
```

Non deve essere eliminata come codice morto durante un cleanup generico.

**Azione proposta**

Il documento futuro deve distinguere:

- endpoint e UI ancora attivi;
- segnale e probabilità non disponibili;
- Market Evidence ancora resa;
- decisione futura dell’utente su mantenimento, isolamento o rimozione.

**Criterio di chiusura**

Strategy deve essere descritta come legacy attiva, non come funzione completa né come codice inutilizzato.

---

### DOC-013 — Il documento Preflight non può promettere una vera validazione Betfair finché il controllo resta permissivo

**Stato:** `CONFERMATO`

**Priorità:** alta

**Area:** API Preflight

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/api/05-preflight.mdx
```

**Codice coinvolto:**

```txt
backend/src/routes/test.js
frontend/src/hooks/usePreflightChecks.js
```

**Osservazione**

Il documento presenta:

```txt
POST /api/test/betfair-url
→ valida sintatticamente URL e event ID Betfair
```

Il codice usa:

```js
/betfair\.\w+$/i
```

sul solo hostname e non limita il protocollo.

Questo controllo può accettare host che terminano testualmente in `betfair.<tld>` senza essere domini Betfair effettivi e può accettare protocolli diversi da HTTP/HTTPS.

La validazione `login-window`, invece, usa un controllo più stretto su `betfair.it` e sottodomini con protocollo HTTP/HTTPS.

**Impatto documentale**

Finché `CODE-002` non viene risolto, il documento deve parlare di:

```txt
controllo sintattico permissivo attuale
```

e non di validazione affidabile del dominio Betfair.

**Azione proposta**

Allineare prima il codice su un validatore condiviso; poi documentare il contratto definitivo.

**Criterio di chiusura**

Preflight e login non devono applicare nozioni incompatibili di URL Betfair valida.

---

### API Runtime Health — nessuna discrepanza funzionale confermata

Il contratto di:

```txt
GET /api/health
```

corrisponde a `createApp()` e allo snapshot pubblico del process registry.

Sono stati verificati:

- identità backend;
- `instanceId`, `pid`, `startedAt`, `timestamp`;
- shape `pythonProcesses`;
- tre ruoli pubblici;
- esclusione di `ownerToken`, `cdpUrl` e `profileDir`;
- test HTTP dedicato in `backend/src/server.test.mjs`.

Non è richiesta una riscrittura funzionale del contratto. Resta soltanto la conversione generale `.mdx → .md` e l’eventuale riduzione delle duplicazioni con Runtime locale.

---

### Stato del blocco API

```txt
audit dei sei documenti API
→ COMPLETATO

correzione dei documenti canonici
→ NON ANCORA ESEGUITA

test automatici
→ LETTI, NON ESEGUITI IN QUESTA FASE

prossimo blocco
→ moduli SofaScore, Betfair, Storage ed Evidence
```

---

## 12. Checkpoint B3 — documenti owner dei moduli

### Perimetro

Verificati sullo SHA:

```txt
b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

Documenti:

```txt
modules/sofa/01-live-tracking.mdx
modules/sofa/02-local-context-and-point-by-point.mdx

modules/betfair/01-scraper-lifecycle.mdx
modules/betfair/02-technical-sample-validity.mdx

modules/storage/01-timelines-and-history.mdx
modules/storage/02-commit-journal-and-recovery.mdx

modules/evidence/01-match-evidence-snapshot.mdx
modules/evidence/02-source-identity.mdx
modules/evidence/03-quality-flow-and-alignment.mdx
modules/evidence/04-market-reactions.mdx
```

Sono stati confrontati con tracking, gate, point-by-point, local context, processor Betfair, timeline, history, journal, recovery, Evidence e Market Reactions.

I test sono stati letti, ma non eseguiti.

### Esito sintetico

| Documento | Esito | Intervento futuro |
| --- | --- | --- |
| Tracking live | Contratto principale coerente, file troppo esteso | Limitare a scheduler e orchestrazione |
| Local context/PBP | Coerente con il codice | Preservare; validare live l’ultimo game |
| Lifecycle Betfair | Coerente, sovrapposto a Runtime e Storage | Ridurre e collegare gli owner |
| Validità tecnica | Coerente nel dominio | Correggere l’ordine key/classificazione |
| Timeline/history | Sostanzialmente coerente | Separare facade e journal |
| Journal/recovery | Coerente e vicino a un owner valido | Pulizia e conversione `.md` |
| Match Evidence | Coerente | Ridurre ripetizioni integrity/identity |
| Source Identity | Coerente | Preservare gate live/effective snapshot |
| Qualità/flow/alignment | Coerente | Ridurre ripetizioni |
| Market Reactions | Filosofia coerente, input descritto male | Correggere composizione e confini |

---

## DOC-014 — Tracking key Betfair calcolata prima della classificazione

**Stato:** `CONFERMATO`
**Priorità:** media documentale, bassa operativa

I documenti dichiarano:

```txt
fetch
→ classificazione tecnica
→ tracking key
→ gate
→ persistenza
```

e affermano che un campione tecnico non utilizzabile non chiama `getBetfairTrackingKey`.

Il codice di `backend/src/sofa/betfair/trackerUpdate.js` esegue invece:

```txt
fetch
→ hasFinished
→ getBetfairTrackingKey
→ classifyBetfairTechnicalSample
```

`getBetfairTrackingKey` è una trasformazione pura basata su `scraperKey`; non modifica gate, baseline o persistenza. La discrepanza è quindi documentale, non un bug operativo dimostrato.

### Azione

Durante la riscrittura scegliere:

```txt
A. correggere il documento
oppure
B. spostare il calcolo dopo la classificazione
```

La soluzione A è la modifica minima.

---

## DOC-015 — I documenti owner B3 duplicano contratti trasversali

**Stato:** `CONFERMATO`
**Priorità:** alta

Esempi:

```txt
Tracking live
→ registry, generation, Betfair validity, Source Identity, storage

Lifecycle Betfair
→ registry, tracker, processor, storage, integrity, retention

Timeline/history
→ gate, validità Betfair, journal, recovery, logout Graph

tutti i documenti Evidence
→ integrity, persistenceComplete, Source Identity, no-causality
```

La stessa regola compare quindi in più file e può divergere.

### Ownership finale proposta

```txt
Tracking live
→ scheduler e orchestrazione

Runtime
→ generation, processi e terminazione

Validità tecnica Betfair
→ classificazione del sample

Source Identity
→ gate, effective identity e conferma

Timeline/history
→ documenti canonici e writer

Journal/recovery
→ commit multi-documento, integrity e repair

Match Evidence
→ composizione snapshot

Qualità/flow/alignment
→ qualità e osservazioni descrittive

Market Reactions
→ Market→Field e Field→Market
```

Gli altri file devono contenere soltanto una breve precondizione e un link all’owner.

---

## DOC-016 — Facade Storage e formule read-only troppo forti

**Stato:** `CONFERMATO`
**Priorità:** media

### `addBetfairUpdate`

Il documento la elenca fra le API della history, ma nel codice è una facade di compatibilità:

```txt
addBetfairUpdate
→ prepareBetfairHistory
→ prepara soltanto il documento
```

Il processor Betfair è l’owner dell’unico commit canonico journalizzato.

### Inizializzazione delle directory

`timelineStore.js` crea `backend/match_history/` al caricamento quando manca.

`createHistoryStorage(...)` inizializza anch’esso la directory ricevuta.

Quindi:

```txt
la route read-only non scrive history/timeline/journal
```

è corretto, mentre:

```txt
l’intero modulo non crea mai directory
```

non lo è.

### Correzione

```txt
addBetfairUpdate
→ facade legacy prepare-only

request read-only
→ nessuna scrittura canonica

inizializzazione storage
→ può assicurare le directory project-owned
```

---

## DOC-017 — Market Reactions non riceve uno snapshot già costruito

**Stato:** `CONFERMATO`
**Priorità:** media

Il documento dichiara:

```txt
Market Reactions consuma solo snapshot Evidence già costruiti
```

Il flusso reale è:

```txt
buildLatestMatchEvidenceFromTimelines
→ selezione epoch e tick
→ buildEvidenceFromTicks
→ scoping per Source Identity e integrity
→ buildMarketReactionEvidence({ sofaTicks, betfairTicks, now })
→ snapshot Evidence finale
```

Market Reactions viene quindi composto durante il builder e riceve array di tick già scoped, non uno snapshot completo.

### Formula corretta

```txt
Evidence builder
→ seleziona tick attribuibili
→ passa array scoped
→ Market Reactions costruisce i rami
→ risultato inserito nello snapshot
```

Il modulo resta puro rispetto a I/O, journal, tracking e persistenza.

---

## Verifiche senza discrepanze funzionali confermate

### Local context e point-by-point

Il codice conferma:

```txt
token: 0, 15, 30, 40, A
→ ultimo game escluso come potenzialmente aperto
→ esatti tre game precedenti
→ nessun fallback a game più vecchi
→ available basato su pointsTotal
→ qualità complete solo con finestra recente valida
```

Resta la validazione live `SOFA-001`.

### Journal e recovery

Confermati:

```txt
commitId source-UUID
→ pending prima dei writer
→ marker history/timeline
→ verifica target completed residual
→ riapertura marker mancanti
→ recovery prima di listen
→ fatal globale separato dalle failure per-file
```

### Source Identity

Confermati lifecycle e azioni:

```txt
collecting / pending / recording / mismatch / not-applicable

buffered / persist-current / bootstrapped / blocked / no-gate
```

Confermati anche confirmation store atomico e separazione fra gate live ed effective identity.

### Logout Graph `status-only`

Il processor produce `timelineIntegrity.accepted:false` per regressioni e la persistence decision applica il controllo Graph-login specifico. La limitazione documentata al `regressive_sample` è coerente.

Resta aperto `TEST-001`.

---

## Decisione differita — EVIDENCE-001

Field → Market confronta i runner così:

```txt
selectionId presente
→ match per selectionId

selectionId assente
→ fallback su nome identico e selectionId assente
```

Il resto del dominio Betfair usa normalmente `selectionId` come identità unica.

Alternative:

```txt
A. selectionId obbligatorio
→ nessun confronto senza ID

B. fallback esatto per nome
→ qualità degradata
→ reason esplicita
→ test dedicato
```

Non modificare questa scelta durante la sola riscrittura documentale.

---

## Esito B3

```txt
documenti owner verificati
→ duplicazioni classificate
→ discrepanze documentali registrate
→ problemi di codice separati
→ nessuna modifica a docs/ o al codice
```

Prossima fase:

```txt
B4 — Frontend e Python
```

---

## 13. Checkpoint B4 — Frontend e Python

### 13.1 Perimetro verificato

Documenti frontend:

```txt
modules/frontend/01-session-shell.mdx
modules/frontend/02-live-polling-and-view-model.mdx
modules/frontend/03-betfair-and-market-reactions-ui.mdx
modules/frontend/04-match-context-ui.mdx
```

Documenti Python:

```txt
modules/python/01-entrypoints-and-runtime.mdx
modules/python/02-sofascore-scraper.mdx
modules/python/03-betfair-scraper.mdx
modules/python/04-betfair-graph-url-validation.mdx
```

Confrontati con:

```txt
App.jsx
hook sessione, polling, bootstrap, Source Identity e health
view model e componenti principali
vite.config.js
launcher/app.py e launcher/services.py
wrapper root Python
package scrapers/sofa
package scrapers/betfair
route /api/betfair/odds
processor Node Betfair
test frontend e Python mirati
```

I test sono stati letti, ma non eseguiti.

### 13.2 Esito sintetico

| Area | Esito |
| --- | --- |
| Session shell | Ownership coerente; failure Start lascia poller nascosti |
| Polling | Evidence e Source Identity protetti; SofaScore e Betfair non isolano le sessioni |
| View model | Mapping sportivo coerente; pipeline persistence descritta ma assente |
| Betfair UI | Money Flow e health coerenti; stato integrity non arriva ai componenti |
| Market Reactions UI | Rendering puro coerente; riceve solo il sottoblocco Market Reactions |
| Match Context | Coerente con il backend e senza fallback inventati |
| Launcher | Porte dinamiche e proxy Vite realmente collegati |
| Wrapper Python | Sottili e compatibili |
| SofaScore scraper | Contratto principale coerente |
| Betfair scraper | Contratto principale coerente con gap di hardening pubblico |
| Graph URL | Parser e mapping coerenti |

---

## DOC-018 — Pipeline `integrity` frontend descritta ma non implementata end-to-end

**Stato:** `CONFERMATO`
**Priorità:** alta

### Contratto documentato

`02-live-polling-and-view-model.mdx` descrive:

```txt
integrity SofaScore
+ integrity Betfair
+ integrity Evidence
→ useDashboardViewModel
→ persistence view state
→ componenti UI
```

Lo stesso documento afferma che il `409` SofaScore produce:

```txt
serverStatus: persistence_integrity
```

`03-betfair-and-market-reactions-ui.mdx` descrive inoltre label e stati degradati separati in BetfairDepthCard e Market Reactions.

### Comportamento reale

`useMatchPolling(...)` conserva una `integrity` separata, ma `App.jsx` non la destruttura.

`useBetfairJson(...)` conserva una `integrity` separata, ma `App.jsx` non la destruttura.

`useDashboardViewModel(...)` non accetta:

```txt
sofaIntegrity
betfairIntegrity
evidenceIntegrity
```

e restituisce soltanto:

```txt
dashboardData
betfairHistory
```

`BetfairDepthCard.jsx` non riceve alcuna prop di persistence integrity.

`useMarketReactionEvidence(...)` conserva soltanto:

```txt
payload.latest.marketReactionEvidence
```

Non conserva lo snapshot Evidence completo, la top-level `integrity`, le source integrity o `dataQuality.persistenceComplete` come stato separato.

`MarketReactionsPage.jsx` riceve quindi il solo sottoblocco Market Reactions.

### Nomi reali di `serverStatus`

Per il `409` SofaScore il codice e il test restituiscono:

```txt
partial_persistence
oppure
recovery_failed
```

Non:

```txt
persistence_integrity
```

### Valutazione

Il backend blocca già l’uso cross-source e inserisce reason dentro Market Reactions, quindi non è dimostrato che la pagina promuova evidenza proibita.

È però falsa la descrizione di una pipeline frontend generale capace di:

- mostrare l’integrity per sorgente;
- costruire un persistence view state;
- distinguere la degradazione nelle card;
- consumare lo snapshot Evidence completo.

### Azione futura

Definire un solo contratto UI:

```txt
hook
→ integrity normalizzata

App
→ inoltro esplicito

view model
→ persistence state separato

componenti
→ rendering informativo
→ nessun merge con health o Source Identity
```

Oppure ridurre la documentazione al comportamento realmente presente, se non si vuole introdurre questa UI.

---

## DOC-019 — Hardening Python descritto in modo più forte del comportamento pubblico

**Stato:** `CONFERMATO`
**Priorità:** alta

I documenti Python dichiarano che diagnostica e superfici pubbliche non espongono path locali o dati sensibili derivati dagli URL.

Sono emersi tre confini non rispettati completamente.

### Path della network capture

`summarize_network_capture(...)` include:

```txt
dump_dir
```

come percorso locale.

Il risultato passa attraverso:

```txt
scrape_betfair
→ processor Node
→ /api/betfair/odds
```

senza un serializer pubblico che rimuova il campo.

### Filename della cache

La cache redige il contenuto JSON, ma la chiave del file deriva dalla URL normalizzata:

```txt
URL
→ sostituzione caratteri non alfanumerici
→ filename
```

`normalize_betfair_url(...)` rimuove soltanto alcune query note. Altri valori di query possono quindi essere leggibili nel filename.

### Errori pubblici

Le route Match Analyze e Betfair Odds possono restituire:

```txt
error.message
```

direttamente al client.

Lo scraper SofaScore costruisce alcuni errori tramite `str(error)`.

### Correzione documentale

Finché il codice non viene irrobustito, il documento deve distinguere:

```txt
contenuti diagnostici redatti
≠
tutte le superfici pubbliche prive di path o dettagli runtime
```

Dopo la correzione del codice, il contratto forte potrà essere ripristinato.

---

## 13.3 Frontend — rilievi documentali collegati

### Sessione e Start fallito

Il documento dichiara intenzionalmente che, in caso di Start fallito:

```txt
shell nascosta
→ input preservati
→ configurazione confermata non cancellata
```

Non descrive però l’effetto derivato:

```txt
confirmedUrl ancora valorizzato
→ useDashboardViewModel mantiene loadMatch
→ useBetfairJson resta attivo
→ useMarketReactionEvidence resta attivo
```

La nuova documentazione dovrà separare:

```txt
input correnti da preservare
≠
sessione confermata che autorizza polling
```

### Polling e lifecycle

Il documento descrive correttamente `setTimeout`, ma non documenta l’assenza di cancellazione delle richieste in flight per SofaScore e Betfair.

Evidence e Source Identity possiedono già:

```txt
sessionId
requestId
AbortController
stale response guard
```

e devono essere usati come modello del contratto desiderato.

### Metodi Source Identity legacy

`useMarketReactionEvidence(...)` esporta ancora:

```txt
confirmSourceIdentity
revokeSourceIdentityConfirmation
```

Il flusso globale usa invece `useSourceIdentityGateUi(...)`.

`SourceIdentityControls.jsx` è già indicato come legacy non montato.

La documentazione deve evitare di presentare due authority concorrenti e classificare esplicitamente questi metodi durante il cleanup.

### Copy mojibake

Le stringhe:

```txt
ModalitÃ 
âEUR”
```

sono presenti nel sorgente e vengono renderizzate direttamente.

Non sono un problema di terminale o visualizzazione GitHub: appartengono ai file frontend correnti.

---

## 13.4 Aree coerenti da preservare

### Porte dinamiche frontend/backend

Il contratto relativo `/api` è corretto:

```txt
launcher seleziona backend
→ VITE_BACKEND_TARGET usa la porta scelta
→ Vite proxy /api inoltra al backend effettivo
```

Non introdurre host assoluti nei client frontend.

### Source Identity UI

Il polling gate usa:

```txt
session ID
request ID
AbortController
una sola fetch per sessione
```

La conferma e il mismatch sono posseduti da `useSourceIdentityGateUi(...)`.

Questo confine è coerente e costituisce un riferimento per gli altri hook.

### Money Flow UI

Sono coerenti:

```txt
selectionId come identità
→ 20 slot condivisi
→ volume abbinato neutro
→ nessuna barra per punti invalidi
→ base tecnica minima 100
```

### Match Context

Il frontend:

- inoltra `localContext`;
- valida numeri e finestra;
- non decodifica point-by-point;
- non crea fallback numerici;
- non trasforma differenze in segnali.

### Wrapper e launcher

I tre wrapper root sono sottili.

Il launcher:

- seleziona porte senza kill-by-port;
- configura Vite con backend effettivo;
- preserva CDP esterno;
- termina soltanto processi owned.

### Graph URL

Sono coerenti:

```txt
https obbligatorio
graphs.betfair.it
marketId / selectionId / 0
no credenziali o porta
no fallback per nome
duplicato riservato dopo mapping
skip delle URL successive salvo auth_suspected terminale
```

---

## Esito B4

```txt
frontend e Python verificati
→ contratti coerenti preservati
→ pipeline integrity falsa classificata
→ race sessione e failure Start registrate
→ hardening diagnostico incompleto registrato
→ nessuna modifica a docs/ o al codice
```

Prossima fase:

```txt
B5 — Operations e roadmap
```

---

## 14. Checkpoint B5 — Operations e roadmap

### Perimetro

Verificati:

```txt
operations/01-local-runtime.mdx
operations/02-live-tracking-control.mdx
operations/03-betfair-diagnostics.mdx
operations/04-validation-and-rollback.mdx
operations/05-retention-and-cleanup.mdx
operations/06-source-identity-live-verification.mdx
operations/07-betfair-live-validation.mdx

roadmap/01-current-state.mdx
roadmap/02-replay-and-backtesting.mdx
roadmap/03-market-reactions-journal.mdx
```

Confrontati con launcher, server, tracking, process registry, commit journal, cleanup runtime, test cleanup e rilievi frontend/Python di B4.

I test sono stati letti ma non eseguiti.

## Esito sintetico

| Documento | Esito |
| --- | --- |
| Runtime locale | Coerente, ma troppo vicino a un documento architetturale |
| Controllo tracking | Runbook coerente |
| Diagnostica Betfair | Sequenza utile; hardening pubblico descritto troppo forte |
| Validation e rollback | Documento monolitico e duplicato |
| Retention e cleanup | Allow-list corretta; path e offline check da correggere |
| Source Identity live | Checklist e risultati storici mescolati |
| Betfair live validation | Report storico trasparente, da archiviare |
| Current State | Non più affidabile |
| Replay/backtesting | `FUTURA`, non implementata |
| Market Reactions Journal | `FUTURA`, non implementata |

---

## DOC-020 — Percorso journal documentato senza punto iniziale

**Stato:** `CONFERMATO`
**Priorità:** alta documentale

Il codice usa:

```txt
backend/match_history/.pending_commits/
```

Retention e Current State usano anche:

```txt
backend/match_history/pending_commits/
```

Validation/rollback usa invece la forma corretta.

Un operatore può cercare il journal nella directory sbagliata, costruire backup incompleti o credere che non esistano commit pending.

Correzione: usare ovunque il percorso con `.pending_commits`.

---

## DOC-021 — Validation/rollback e runbook troppo estesi

**Stato:** `CONFERMATO`
**Priorità:** alta

`operations/04-validation-and-rollback.mdx` contiene metodo generale, matrici test, collaudi storici, contratti di modulo, smoke test, validazione live e rollback.

La stessa informazione vive quindi nei documenti owner, nei runbook, nel Current State e nei report live.

Esempio:

```txt
node --check backend/src/sofa/matchHistory/commitJournal.js
```

controlla ormai una facade di re-export, mentre la logica reale vive sotto `commitJournal/`.

Struttura proposta:

```txt
operations/validation-method.md
→ metodo generale e rollback

reference/test-matrix.md
→ test canonici per modulo
→ idealmente verificato automaticamente

documenti owner
→ test più vicini

archive/validations/
→ collaudi e output storici
```

---

## DOC-022 — Current State non aggiornato rispetto a B4

**Stato:** `CONFERMATO`
**Priorità:** alta

Il Current State dichiara completa la pipeline frontend di integrity e la degradazione UI.

B4 ha verificato:

```txt
useMatchPolling conserva integrity
→ App la scarta

useBetfairJson conserva integrity
→ App la scarta

useDashboardViewModel non riceve integrity

BetfairDepthCard non riceve persistence state

useMarketReactionEvidence conserva solo marketReactionEvidence
```

Dichiara inoltre l’hardening diagnostico sostanzialmente completo, mentre B4 ha registrato:

```txt
SECURITY-001
SECURITY-002
SECURITY-003
PYTHON-001
```

La lista delle priorità non include i difetti B4 né `CLEANUP-002`.

Il nuovo Current State deve derivare dai registri e distinguere implementato/verificato, implementato con limiti, bug, validazioni aperte, decisioni e futuro.

---

## DOC-023 — Collaudi storici mescolati ai runbook

**Stato:** `CONFERMATO`
**Priorità:** media-alta

Nei runbook sono mescolati:

```txt
collaudo 9A-R2B
collaudo 9B
osservazioni Source Identity
validazione Betfair 2026-07-04
sequenze Stop/login
note TopBar
```

`operations/07-betfair-live-validation.mdx` è un report storico.

`operations/06-source-identity-live-verification.mdx` combina procedura aperta, risultati osservati e note UX.

Struttura proposta:

```txt
operations/source-identity-live-check.md
→ procedura corrente

archive/validations/<data>-<tema>.md
→ data
→ SHA
→ ambiente
→ passi
→ risultati
→ limiti
→ artefatti
```

Questo rafforza `IMPL-004`.

---

## Runbook da preservare

Il controllo tracking distingue correttamente gate live, Stop globale, `scope=tracking` e shutdown completo.

La diagnostica Betfair separa correttamente health, freshness, integrity, Graph auth, runtime error e Money Flow. Va corretta la garanzia forte sulle superfici pubbliche collegandola ai rilievi B4.

Il report Betfair del 2026-07-04 dichiara chiaramente casi osservati, casi non osservati, riuso dell’eventId, assenza del payload post-fix e assenza del test automatico `status-only`.

---

## Roadmap future

### Replay e backtesting

Classificazione:

```txt
FUTURA
NON IMPLEMENTATA
```

Principi validi: timeline canoniche, nessun fetch live, nessun browser, niente informazione futura, epoch al cursore, versione algoritmo e Source Identity storica esplicita.

### Market Reactions Journal

Classificazione:

```txt
FUTURA
NON IMPLEMENTATA
```

Principi validi: nessuna copia completa a ogni polling, dedupe stabile, update materiale, `causalityClaimed:false`, route lazy/read-only e timeline immutate.

Entrambi devono restare fuori dal contesto predefinito che descrive il sistema corrente.

---

## Esito B5

```txt
operations e roadmap verificate
→ path journal errato confermato
→ Current State da riscrivere
→ validation matrix da separare
→ collaudi da archiviare
→ future roadmap correttamente classificate
→ nessuna modifica a docs/ o codice
```

Prossima fase:

```txt
B6 — Controlli trasversali
```

---

## 15. Checkpoint B6 — controlli trasversali e chiusura dell’audit

### 15.1 Perimetro

Controlli eseguiti:

```txt
indice canonico e target
→ riferimenti fra owner
→ percorsi filesystem citati
→ test citati
→ materiale legacy
→ futuro vs corrente
→ coerenza Todo/registri
→ classificazione delle implementazioni di supporto
```

Baseline:

```txt
SHA verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

### 15.2 Link e navigazione

Tutti i target elencati direttamente in `docs/tennis-decision-ui/index.mdx` sono stati aperti durante i blocchi B1–B5.

Esito:

```txt
nessun link rotto confermato nell’indice canonico
```

Questo non equivale a una scansione completa di tutti i link interni.

Restano aperti link fra singoli documenti, anchor, materiali legacy e collegamenti che cambieranno durante la conversione `.mdx` → `.md`.

Conclusione:

```txt
IMPL-001
→ necessario prima della migrazione documentale
```

Il README root collega ancora `index.mdx`; è corretto nello stato corrente e dovrà cambiare insieme alla migrazione.

### 15.3 Materiale legacy

L’indice dichiara esplicitamente non canonici:

```txt
chapters/
sections/
```

Non è emersa una ragione per usarli come fonte dello stato corrente.

Regola:

```txt
non eliminarli durante l’audit
→ verificare consumer e contenuti durante la migrazione
→ archiviare o rimuovere solo dopo link check e manifest
```

I documenti Replay e Market Reactions Journal sono invece proposte future esplicite, non implementazioni abbandonate.

---

## WORKFLOW-002 — Todo e registro analitico non erano allineati

**Stato:** `COMPLETATO NEL CHECKPOINT B6`
**Priorità:** alta per il metodo

Il confronto locale dei registri B5 ha rilevato:

```txt
TEST-001
→ presente nei registri analitici
→ assente dall’intera Todo
```

Il BLOCCO E conteneva soltanto una parte dei rilievi. Mancavano, fra gli altri:

```txt
DOC-014…DOC-019
RUNTIME-002
SOFA-001
TEST-001
EVIDENCE-001
FRONTEND-001…FRONTEND-004
CLEANUP-001
SECURITY-001…SECURITY-003
PYTHON-001
TEST-002
```

Impatto:

- rischio di dimenticare rilievi durante la preparazione delle task;
- priorità incomplete;
- impossibilità di usare la Todo come vista sintetica unica.

Correzione:

```txt
BLOCCO E ricostruito
→ TEST-001 aggiunto
→ tutti gli ID analitici riportati
→ stati sintetici uniformati
```

Prevenzione:

```txt
IMPL-005
→ classificata necessaria
```

---

## WORKFLOW-003 — Prefissi usati ma non dichiarati nel metodo

**Stato:** `COMPLETATO NEL CHECKPOINT B6`
**Priorità:** media

Il metodo dichiarava i prefissi stabili, ma B4 ha introdotto:

```txt
SECURITY-
PYTHON-
```

senza aggiornare la tabella.

Correzione:

```txt
SECURITY-
→ redazione, superfici pubbliche e dati sensibili

PYTHON-
→ concorrenza e comportamento interno dei package Python
```

Gli ID esistenti non sono stati rinumerati.

---

## 15.4 Test e validazioni

L’audit distingue definitivamente:

```txt
file test presente
≠ test eseguito nel checkpoint
≠ collaudo live
≠ prova archiviata
```

Non è stato confermato un test citato con percorso sicuramente inesistente nei documenti owner analizzati.

Sono però confermati:

- `TEST-001`: manca il test dedicato al tick Betfair `status-only`;
- `TEST-002`: mancano test lifecycle per polling e cambio sessione;
- `TEST-003`: manca un inventario/test runner canonico;
- `PYTHON-001`: il percorso capture asincrono non ha una verifica deterministica completa.

Conclusione:

```txt
IMPL-003
→ necessaria
```

---

## 15.5 Classificazione finale delle correzioni documentali

### Correzioni documentali indipendenti dal codice

```txt
DOC-002
DOC-004
DOC-005
DOC-006
DOC-008
DOC-010
DOC-011
DOC-014
DOC-015
DOC-016
DOC-017
DOC-020
DOC-021
DOC-023
```

### Documenti che devono attendere decisioni o correzioni codice

```txt
DOC-003
→ chiarire GET/POST/DELETE mantenendo il comportamento reale

DOC-009
→ dipende da CODE-003

DOC-012
→ dipende da CODE-001

DOC-013
→ dipende da CODE-002

DOC-018
→ dipende da FRONTEND-002

DOC-019
→ dipende da SECURITY-001/002/003 e PYTHON-001

DOC-022
→ Current State dopo il primo batch di correzioni
```

### Documenti da archiviare o separare

```txt
validazioni Betfair live
collaudi launcher
osservazioni Source Identity
```

Non devono essere cancellati: vanno spostati in un archivio con data e SHA.

### Documenti futuri da preservare

```txt
Replay e backtesting
Market Reactions Journal
```

Devono restare esclusi dalla descrizione dello stato corrente.

---

## 15.6 Struttura documentale risultante

```txt
index e current state sintetico

architecture
→ confini e flussi trasversali

api
→ contratto HTTP

modules
→ owner del comportamento

operations
→ procedure correnti

reference
→ mappe e matrice test

archive/validations
→ prove storiche

roadmap
→ soltanto futuro esplicito
```

Ogni regola dettagliata deve avere un solo owner.

---

## 15.7 Esito B6

```txt
audit documentazione B1–B6
→ completato

audit codice statico per settori
→ completato

suite test
→ non rieseguite

documentazione canonica e codice
→ non modificati

Todo e registri
→ riallineati

prossimo blocco
→ ricontrollo task dichiarate completate
```

---

## 16. Decisioni documentali e materiali di processo

### 16.1 `context-selection.mdx`

Il documento corrente conserva principi utili:

- minimo contesto sufficiente;
- file modificabili e consultabili separati;
- owner del modulo;
- massimo tre tentativi;
- esclusione di dati sensibili;
- test mirati;
- report post-task.

Non deve essere convertito uno-a-uno.

La nuova struttura deve separare:

```txt
ruoli e flusso
→ implementazioni/07-workflow-esecutivo.md

istruzioni per chat e AI
→ implementazioni/08-linee-guida-chat-e-ai.md

documentazione canonica futura
→ file .md dedicati, dopo la migrazione
```

Sono superate come regole generali:

- obbligo di usare Repomix per ogni esecuzione;
- divieto assoluto di leggere test invariati quando la diagnosi richiede il test;
- template unico valido per qualunque esecutore;
- assunzione che l’esecutore possa sempre modificare localmente.

### 16.2 `docs/_work`

Materiali individuati nelle copie disponibili:

```txt
01-documentation-impact-request.md
change-brief.md
percorsi.txt
```

Classificazione:

| Materiale | Classificazione | Decisione |
| --- | --- | --- |
| documentation impact request | `DUPLICATA ALTROVE` | assorbire nel prompt e nel report della task |
| change brief | `DUPLICATA ALTROVE` | conservarne i campi utili nel workflow |
| percorsi.txt | `SUPERATA` | sostituito da GitHub read-only, repository map e documenti owner |

Campi utili da preservare:

- obiettivo;
- file modificati;
- comportamento cambiato;
- contratti coinvolti;
- test e risultati;
- impatto documentale;
- documenti da aggiornare;
- link da verificare;
- fuori scope.

Non ricreare `_work` come procedura obbligatoria.

### 16.3 Formato dei documenti

Decisione definitiva:

```txt
estensione .md
→ Markdown ordinario
→ titoli, sezioni, tabelle, blocchi di codice e link relativi
→ ordine tramite prefissi numerici e indice esplicito
```

Non usare per default:

- `export const meta`;
- import o componenti JSX;
- sintassi MDX;
- frontmatter YAML.

Il frontmatter potrà essere introdotto soltanto se verrà dimostrato un consumer tecnico reale che ne ha bisogno.

### 16.4 Collaudi

I collaudi non devono essere mescolati ai documenti owner.

Struttura futura approvata:

```txt
docs/validations/
├── README.md
└── YYYY-MM-DD-<area>-<sha-breve>.md
```

Ogni report deve indicare:

- data;
- SHA;
- ambiente;
- passaggi;
- risultato atteso e reale;
- finding;
- matrice;
- limiti;
- stato finale.

### 16.5 Promemoria UI non prioritari

Sono registrati come backlog futuro, non come parte del checkpoint corrente:

- piccole correzioni e rimozioni UI;
- revisione responsive di form, sidebar, dashboard, card e modali.
