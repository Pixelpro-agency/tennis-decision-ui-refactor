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

**Stato:** `DA VERIFICARE`  
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

**Cosa controllare ancora**

- sovrapposizione riga per riga con i documenti owner;
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

**Cosa controllare ancora**

- side effect esatti del fallback;
- comportamento in errore durante bootstrap;
- contratti HTTP e test relativi;
- eventuali formulazioni analoghe in altri documenti.

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
