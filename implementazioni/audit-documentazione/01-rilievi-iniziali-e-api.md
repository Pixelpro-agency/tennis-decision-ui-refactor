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
