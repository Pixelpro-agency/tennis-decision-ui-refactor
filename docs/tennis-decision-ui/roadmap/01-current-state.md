# Stato corrente del progetto

## Scopo

Questo documento fotografa ciò che esiste nel codice alla baseline indicata e distingue base implementata, limiti correnti, componenti rimossi o legacy, validazioni storiche e funzioni non presenti.

Non contiene la progettazione delle soluzioni future. Finding, priorità e implementazioni approvate ma non ancora presenti restano nei registri cumulativi.

## Baseline e autorità temporale

| Piano                              | Baseline                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Codice/runtime di riferimento      | commit `12b344ea96e71b2bdaa6931c98419ce925b5c228`                                                  |
| Struttura documentale di confronto | commit `4c5f43b007149f3210c27d7565357a447a3a6ef4`, usato soltanto per forma, ordine e granularità  |
| Evidenze storiche                  | esclusivamente gli artifact indicizzati in `docs/validations/`, con i rispettivi metadata e limiti |

Le affermazioni sul comportamento corrente sono riferite al commit di codice indicato. Le validazioni storiche dimostrano soltanto ciò che è stato osservato nella specifica esecuzione documentata e non equivalgono a una riesecuzione sulla baseline corrente.

## Base implementata

| Area                  | Stato corrente                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime locale        | Launcher Python con lock operativo, riconoscimento dei servizi, porte preferite, ownership selettiva e shutdown dei processi owned                               |
| Backend               | Express con router Match, Betfair, Evidence, Preflight e Runtime Health; confine HTTP locale; writer authority acquisita in `startServer()` prima della recovery |
| SofaScore             | Acquisizione Python, normalizzazione Node, point-by-point supportato e `localContext` descrittivo                                                                |
| Betfair               | Modalità persistent/CDP, Graph URL, quote, ladder, health, lifecycle dei processi, Money Flow non direzionale e diagnostica redatta                              |
| Tracking              | Scheduler separato SofaScore/Betfair, Source Identity Gate, stop globale, registro delle operazioni attive, terminal tracker barrier e tracker drain             |
| Persistenza           | Timeline, history aggregata, atomic write per file, commit journal, writer authority esclusiva, recovery bootstrap e integrity read-only                         |
| Evidence              | Snapshot read-only, qualità, Source Identity effective, no-trade reasons e Market Reactions senza causalità dichiarata                                           |
| Frontend              | Form, shell dashboard, polling dati, stato Source Identity, health Betfair, Money Flow, contesto punti e Market Reactions                                        |
| Sicurezza dati        | `.env` locale, chiave Betfair fuori dal codice, redazione diagnostica e cache/dump esclusi dalle fonti canoniche                                                 |
| Tooling e validazione | Checker documentali read-only e runner locale a manifest con profili offline, timeout, process isolation e artifact JSON con output limitato                     |

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
- il frontend mostra stato, attesa, modale e mismatch.

### Persistenza

- history e timeline restano documenti canonici distinti;
- il journal rende osservabile un commit incompleto;
- `startServer()` acquisisce la writer authority prima di eseguire la recovery;
- la recovery viene eseguita prima dell'apertura del listener;
- un secondo backend sulla stessa storage identity viene bloccato prima di recovery e listener;
- un owner positivamente morto può essere recuperato;
- un owner vivo (`active`) o un'identità non verificabile (`unknown`) bloccano l'avvio in modalità fail-closed;
- il listener viene considerato pronto soltanto dopo l'effettivo evento di readiness;
- le letture Match e Betfair possono restituire `409 persistence_integrity` quando manca un documento coinvolto in una persistenza parziale o in una recovery fallita;
- Evidence espone l'integrità delle fonti e sospende l'evidenza canonica cross-source quando la persistenza è incompleta;
- le route read-only non eseguono recovery.

### Shutdown e tracker drain

- le operazioni SofaScore e Betfair capaci di raggiungere la persistenza sono registrate nel processo;
- lo shutdown attiva una terminal tracker barrier che impedisce nuovi Start e nuovi update;
- lo stop ordinario del tracking resta riutilizzabile e non rilascia la writer authority;
- gli update già avviati vengono drenati fino a registro vuoto;
- il cleanup dei processi Python viene avviato prima di attendere il completamento del drain;
- la writer authority viene rilasciata soltanto dopo drain positivo e listener chiuso;
- drain fallito o force timeout conservano il record di authority per il successivo recupero stale/dead;
- segnali ripetuti condividono la stessa shutdown promise e non duplicano drain o release.

### Evidence

- i confronti cross-source richiedono Source Identity allineata;
- una persistenza incompleta sospende l'uso cross-source;
- `causalityClaimed` resta `false`;
- Market Reactions descrive prossimità temporale, non intenzione o causalità.

## Limiti correnti confermati

### Autorità runtime e sessione

- Start restituisce un `trackingSessionId`, propagato a tracker, callback, Source Identity Gate, conferma e bootstrap frontend;
- timeline, history e parte della provenance persistita restano correlate principalmente tramite `eventId`;
- i poller frontend principali usano generation locale, abort e stale-response guard; questa protezione non rende session-scoped i documenti persistiti;
- lo Stop può avere cleanup parziale senza una semantica top-level completa;
- il lifecycle Betfair confronta anche la session authority, ma la provenance persistita end-to-end resta incompleta.

La writer authority protegge la storage identity a livello di processo backend. È distinta dalla session authority runtime e non completa da sola la provenance end-to-end prevista dai registri.

### Confine locale

- il backend effettua il bind predefinito su `127.0.0.1` e applica un controllo locale a `Host` e `Origin`;
- CORS resta configurato in modo riflessivo dopo il controllo locale e non costituisce una policy di autenticazione o autorizzazione.

### Persistenza

- la shared history non possiede ancora un'autorità event-scoped cross-source completa;
- il journal non contiene revision, document head e digest verificabili;
- esiste un validator `eventId` canonico usato da API e writer principali, mentre recovery e alcuni moduli journal/storage mantengono controlli locali meno uniformi;
- non esiste una transazione unica fra commit SofaScore e Betfair;
- i documenti vengono riscritti integralmente.

### Evidence e provenance

- le Market Reactions non applicano ancora un contratto completo di provenance temporale, skew di acquisizione, copertura runner e comparabilità delle fonti prezzo;
- la disponibilità corrente dipende soprattutto da Source Identity, timeline e persistence integrity.

### Frontend

- lo stato della sessione è distribuito fra più hook e flag;
- la sessione viene promossa soltanto dopo uno Start backend riuscito con `trackingSessionId` valido;
- bootstrap e conferma Source Identity sono vincolati alla sessione corrente;
- Match, Betfair, Evidence e Source Identity usano cleanup, abort o generation locali, senza un unico controller condiviso;
- Stop disattiva i consumer live; dati persistiti e last-known restano presentati come non correnti;
- persistence integrity è esposta nelle viste principali senza accesso frontend diretto allo storage.

### Cleanup e retention

- `scripts/cleanup_runtime_cache.py` opera soltanto sulle cache esplicitamente consentite;
- il comportamento predefinito è dry-run;
- la rimozione reale richiede `--apply` e `--offline-confirmed` e viene bloccata se il lock del launcher esiste o se le porte runtime controllate risultano occupate;
- non esiste una retention automatica periodica.

### Validazione

- esistono checker separati per link documentali e coerenza dei registri;
- `scripts/validation/run.mjs` fornisce profili `fast`, `backend`, `frontend`, `python` e `full-offline` definiti dal manifest;
- il manifest registra una superficie verificata, non necessariamente ogni test legacy;
- backend e frontend non espongono uno script `test` aggregato nei rispettivi package;
- il comando lint frontend non è assunto come gate corrente;
- esistono test React e di lifecycle per hook, polling, stale response, Stop/Resume e componenti principali, ma non un harness end-to-end generale;
- i profili persistence, benchmark e live non sono abilitati dal runner;
- manca un ledger storico completo e una misura di coverage affidabile;
- la presenza di un file test non equivale a esecuzione o PASS sulla baseline corrente.

## Componenti rimossi o legacy

API/UI Strategy e la route Betfair `/odds` non sono presenti. Gli endpoint Match di debug, analyze, snapshot o untrack ancora esposti sono superfici legacy e non costituiscono la base per nuove funzionalità documentate in questo stato corrente.

## Validazioni storiche

Gli artifact indicizzati in `docs/validations/` registrano, con i rispettivi limiti:

- la transizione Source Identity `collecting` → `recording`;
- il mismatch con ritorno al form;
- un nuovo Start dopo la correzione dei link;
- Source Identity aligned con timeline disponibile;
- sessioni Betfair con Graph URL e senza Graph URL;
- soppressione di un volume anomalo;
- logout Graph, alert e ritorno a Connected.

Il pending reale con conferma o decline non è stato osservato end-to-end negli artifact Source Identity. Per Betfair non risultano osservati, fra gli altri, login già scaduto all'avvio, Graph URL malformate, mismatch `marketId`, errore rete/API reale e mercato realmente concluso.

Launcher, Stop e lifecycle ordinario possono essere descritti da documentazione o test, ma non vanno presentati come validazioni live senza uno specifico artifact indicizzato. Nessuna osservazione storica equivale a una riesecuzione automatica sul commit corrente.

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

Le specifiche storiche di replay e Journal sono consolidate nei registri (`IMPL-010`, `IMPL-012` e `IMPL-023`). Le copie sotto `docs/archive/` e il relativo README non sono presenti nella baseline; i registri correnti costituiscono la provenance documentale disponibile. Queste specifiche restano non implementate e non sono owner attivi.

## Fonti per le task aperte

Per le task aperte usare la [Todo cumulativa](../../../todo-list-tennis-decision-ui.md). I dettagli tecnici sono nell'[Audit](../../../implementazioni/03-audit-codice.md); le strutture approvate ma assenti sono nelle [Implementazioni proposte](../../../implementazioni/06-implementazioni-proposte.md), mentre le scelte vincolanti sono nelle [Decisioni dell'utente](../../../implementazioni/99-decisioni-utente.md).

Questi registri orientano le task. Il presente documento resta limitato allo stato reale della baseline.

## Documenti collegati

- [Indice](../index.md)
- [Confini del sistema](../architecture/01-system-boundaries.md)
- [Ciclo di vita dei dati](../architecture/02-data-lifecycle.md)
- [Validazione e rollback](../operations/04-validation-and-rollback.md)
- [Validazioni storiche](../../validations/README.md)
