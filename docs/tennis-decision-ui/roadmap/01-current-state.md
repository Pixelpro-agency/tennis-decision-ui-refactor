# Stato corrente del progetto

## Scopo

Questo documento fotografa ciò che esiste oggi nel codice e distingue base implementata, limiti correnti, validazioni storiche e componenti deprecati.

Non contiene la progettazione delle soluzioni future. Finding, priorità e implementazioni approvate ma non ancora presenti restano nei registri cumulativi.

**Baseline tecnica:** codice verificato sul commit `f86ac267919ca13859c98db7015362f26176ba36`.

## Base implementata

| Area                  | Stato corrente                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime locale        | Launcher Python con lock operativo, riconoscimento dei servizi, porte preferite, ownership selettiva e shutdown dei processi owned                        |
| Backend               | Express con router Match, Betfair, Evidence, Strategy, Preflight e Runtime Health; writer authority acquisita in `startServer()` prima della recovery     |
| SofaScore             | Acquisizione Python, normalizzazione Node, point-by-point supportato e `localContext` descrittivo                                                         |
| Betfair               | Modalità persistent/CDP, Graph URL, quote, ladder, health, lifecycle dei processi, Money Flow non direzionale e diagnostica redatta                       |
| Tracking              | Scheduler separato SofaScore/Betfair, Source Identity Gate, stop globale, registro delle operazioni attive, terminal tracker barrier e tracker drain      |
| Persistenza           | Timeline, history aggregata, atomic write per file, commit journal, writer authority esclusiva, recovery bootstrap e integrity read-only                  |
| Evidence              | Snapshot read-only, qualità, Source Identity effective, no-trade reasons e Market Reactions senza causalità dichiarata                                    |
| Frontend              | Form, shell dashboard, polling dati, stato Source Identity, health Betfair, Money Flow, contesto punti e Market Reactions                                 |
| Sicurezza dati        | `.env` locale, chiave Betfair fuori dal codice, redazione diagnostica e cache/dump esclusi dalle fonti canoniche                                          |
| Tooling e validazione | Checker documentali read-only e runner locale a manifest con profili offline, timeout, process isolation e artefatti JSON bounded                         |

## Comportamenti importanti già presenti

### Betfair

- un errore tecnico non equivale a mercato concluso;
- il polling continua dopo errori tecnici ordinari;
- deduplicazione e regressioni proteggono timeline e baseline;
- `selectionId` è l'identità primaria del runner;
- il Money Flow visualizzato è volume abbinato non direzionale;
- il logout Graph esplicito può produrre un tick `status-only` limitato;
- network capture è disabilitata nel tracking ordinario.

### Source Identity

- `collecting` e `pending` bloccano le nuove scritture canoniche;
- `recording` abilita bootstrap e persistenza;
- `mismatch` blocca il campione e ferma il tracking coordinato;
- la conferma manuale è separata dalle timeline;
- il frontend mostra status, attesa, modale e mismatch.

### Persistenza

- history e timeline restano documenti canonici distinti;
- il journal rende osservabile un commit incompleto;
- `startServer()` crea e acquisisce la writer authority prima della recovery;
- la recovery parte soltanto dopo l'acquisizione della writer authority e prima dell'apertura del listener;
- un secondo backend sulla stessa storage identity viene bloccato prima di recovery e listener;
- un owner positivamente morto può essere recuperato;
- un owner vivo (`active`) o un'identità non verificabile (`unknown`) bloccano l'avvio in modalità fail-closed;
- il listener viene considerato pronto soltanto dopo la readiness reale;
- Match e Betfair possono restituire `409 persistence_integrity`;
- Evidence può esporre `persistenceComplete:false`;
- le route read-only non eseguono recovery.

### Shutdown e tracker drain

- le operazioni SofaScore e Betfair capaci di raggiungere la persistenza sono registrate process-local;
- lo shutdown attiva una terminal tracker barrier che impedisce nuovi Start e nuovi update;
- lo stop ordinario del tracking resta riutilizzabile e non rilascia l'authority;
- gli update già avviati vengono drenati fino a registro vuoto;
- il cleanup Python viene avviato prima di attendere il completamento del drain;
- la writer authority viene rilasciata soltanto dopo drain positivo e listener chiuso;
- drain fallito o force timeout conservano il record authority per il recupero stale/dead successivo;
- segnali ripetuti condividono la stessa shutdown promise e non duplicano drain, release o exit.

### Evidence

- i confronti cross-source richiedono Source Identity allineata;
- una persistenza incompleta sospende l'uso cross-source;
- `causalityClaimed` resta `false`;
- Market Reactions descrive prossimità temporale, non intenzione o causalità.

## Limiti correnti confermati

### Autorità runtime e sessione

- Start non restituisce ancora un `trackingSessionId` end-to-end;
- tracker, gate e conferme sono correlati principalmente tramite `eventId`;
- callback e risposte tardive non hanno una generation guard uniforme;
- lo Stop può avere cleanup parziale senza una semantica top-level completa;
- il lifecycle Betfair è deduplicato per mercato e runtime identity, non per sessione logica globale.

La writer authority di IMPL-015 protegge la storage identity a livello di processo backend. Non costituisce la session authority end-to-end prevista da IMPL-006.

### Confine locale

- il server usa ancora un confine HTTP locale non completamente irrigidito;
- CORS e binding non rappresentano ancora una control-plane policy esplicita.

### Persistenza

- la shared history non possiede ancora un'autorità event-scoped cross-source completa;
- il journal non contiene revision, document head e digest verificabili;
- `eventId` è validato in modo permissivo;
- non esiste una transazione unica fra commit SofaScore e Betfair;
- i documenti vengono riscritti integralmente.

### Evidence e provenance

- le Market Reactions non applicano ancora un contratto completo di provenance temporale, skew di acquisizione, copertura runner e comparabilità delle fonti prezzo;
- la disponibilità corrente dipende soprattutto da Source Identity, timeline e persistence integrity.

### Frontend

- lo stato della sessione è distribuito fra più hook e flag;
- la shell e il bootstrap vengono attivati prima della conferma definitiva dello Start backend;
- i poller non usano una cancellazione e un'identità richiesta uniformi;
- Stop sospende esplicitamente SofaScore ma non coordina tutti i poller nello stesso controller;
- la UI persistence integrity non è ancora completa in tutte le viste.

### Validazione

- esistono checker separati per link documentali e coerenza dei registri;
- `scripts/validation/run.mjs` fornisce profili `fast`, `backend`, `frontend`, `python` e `full-offline`;
- il manifest iniziale registra una superficie verificata, non ancora ogni test legacy;
- backend e frontend non espongono uno script `test` aggregato nei rispettivi package;
- il comando lint frontend non è utilizzabile come gate corrente;
- manca un harness React per lifecycle degli hook e StrictMode;
- i profili persistence, benchmark e live non sono implementati;
- manca ancora il ledger storico completo e una coverage affidabile;
- la presenza di un file test non equivale a esecuzione o PASS sul commit corrente.

Per IMPL-015 sono stati eseguiti e superati i test automatici pubblicati:

```txt
writer authority
→ 26 passati
→ 0 falliti

matchTracker
→ 10 passati
→ 0 falliti

server
→ 30 passati
→ 0 falliti
```

Questi test includono l'esclusione deterministica di un secondo bootstrap sulla stessa storage identity prima di recovery e listener. Non è stato eseguito un collaudo manuale con due backend reali concorrenti; il test con due authority e filesystem temporaneo non viene presentato come prova live.

## Componenti deprecati ma ancora presenti

- API e UI Strategy;
- endpoint Match di debug e untrack già individuati;
- endpoint Betfair `/odds`;
- documentazione canonica Markdown, con validazioni e planning separati.

Finché il codice esiste, la documentazione API corrente deve descriverlo. Non deve però essere esteso con nuove funzionalità.

## Validazioni storiche

Sono state osservate manualmente:

- transizione Source Identity collecting → recording;
- mismatch e ritorno al form;
- restart dopo correzione dei link;
- Betfair con Graph URL e senza Graph URL;
- logout Graph, alert e ritorno a Connected;
- launcher, Stop e lifecycle ordinario in sessioni dedicate.

Queste osservazioni appartengono a `docs/validations/`. Non equivalgono a una riesecuzione automatica sul commit corrente e non coprono gli scenari esplicitamente dichiarati come non osservati.

## Funzioni non presenti

Non sono implementati:

- replay offline canonico;
- backtesting;
- Market Reactions Journal persistito;
- nuove strategie validate;
- Stream API Betfair;
- retention automatica periodica;
- CI deterministica;
- profili persistence, benchmark e live del runner.

Le specifiche storiche di replay e Journal sono conservate sotto `docs/archive/planning/` esclusivamente per tracciabilità e non sono owner attivi.

## Fonti per le task aperte

Le decisioni e le strutture approvate ma non implementate si trovano in:

Per le task aperte usare la [Todo cumulativa](../../../todo-list-tennis-decision-ui.md). I dettagli tecnici sono nell'[Audit](../../../implementazioni/03-audit-codice.md); le strutture approvate ma assenti sono nelle [Implementazioni proposte](../../../implementazioni/06-implementazioni-proposte.md), mentre le scelte vincolanti sono nelle [Decisioni dell'utente](../../../implementazioni/99-decisioni-utente.md).

Questi registri orientano le task. Il presente documento resta invece limitato allo stato reale.

## Documenti collegati

- [Indice](../index.md)
- [Confini del sistema](../architecture/01-system-boundaries.md)
- [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
- [Validazione e rollback](../operations/04-validation-and-rollback.md)
- [Validazioni storiche](../../validations/README.md)
