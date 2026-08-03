# Confini del sistema

## Scopo

Questo documento descrive i confini effettivi fra frontend, API Express, dominio Node, persistenza, processi Python, launcher e fonti esterne.

Serve per stabilire dove deve vivere una modifica. Non sostituisce i documenti owner dei singoli moduli e non descrive come già presenti le strutture approvate ma non ancora implementate.

## Struttura corrente

```txt
utente
  ↓
frontend React / Vite
  ↓ HTTP /api
backend Express
  ├─ router HTTP
  ├─ tracking e dominio tennis
  ├─ Evidence read-only
  ├─ persistenza canonica
  └─ registry dei processi Python
       ↓
wrapper Python root
       ↓
scrapers/sofa + scrapers/betfair
       ↓
SofaScore, Betfair e Chrome CDP
```

Il runtime locale ha un percorso distinto:

```txt
python avvio.py
  ↓
launcher/
  ├─ individua o avvia Chrome CDP
  ├─ individua o avvia il backend
  └─ individua o avvia il frontend
```

## Ownership per livello

| Livello         | Owner corrente                                         | Responsabilità                                                | Non deve fare                                                      |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Frontend        | `frontend/`                                            | Input operatore, stato UI, polling HTTP, rendering            | Leggere filesystem o journal, avviare Python, ricostruire Evidence |
| Router HTTP     | `backend/src/routes/`                                  | Validazione richiesta, status e payload HTTP, delega          | Duplicare logica di dominio o persistenza                          |
| Tracking        | `backend/src/sofa/matchTracker.js` e moduli update     | Scheduler, concorrenza per evento, Source Identity Gate, stop | Gestire rendering o dettagli browser                               |
| Dominio         | `backend/src/sofa/`                                    | Normalizzazione, health, Evidence, flow e allineamento        | Dipendere da React o mutare contratti HTTP direttamente            |
| Persistenza     | `matchHistory.js`, `timelineStore.js`, `matchHistory/` | History, timeline, commit journal e recovery                  | Avviare scraper o produrre strategie                               |
| Runtime backend | `backend/src/runtime/`                                 | Registry, generation e terminazione dei figli Python          | Terminare processi non registrati o Chrome esterno                 |
| Scraper Python  | wrapper root e `scrapers/`                             | Acquisizione e diagnostica esterna                            | Possedere history, timeline, journal o decisioni UI                |
| Launcher        | `avvio.py`, `launcher/`, script di avvio               | Coordinare servizi locali identificati                        | Decidere regole di dominio o riparare la persistenza               |

## Confine HTTP

Il frontend comunica con il backend tramite `/api`.

I router sono il confine pubblico del progetto. Un refactor interno non deve cambiare metodo, endpoint, payload o status senza una modifica esplicita del contratto API owner.

Le superfici read-only possono leggere dati già persistiti e, quando previsto, uno stato runtime limitato. Non devono:

- avviare tracking o scraper;
- aprire browser;
- aggiungere tick;
- modificare history o timeline;
- eseguire recovery;
- scrivere conferme Source Identity.

Le operazioni di Start, Stop, login e conferma manuale sono invece mutanti e devono restare separate dalle letture.

## Ownership dei processi

Il progetto distingue tre livelli:

| Livello    | Comportamento corrente                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| Launcher   | Possiede soltanto backend e frontend avviati dalla sessione corrente; non termina servizi riusati o sconosciuti |
| Backend    | Registra e termina i propri figli Python tramite `pythonProcessRegistry.js`                                     |
| Chrome/CDP | Resta esterno all'ownership del launcher e del backend                                                          |

Ruoli Python pubblici correnti:

```txt
sofa_tracking
betfair_tracking
betfair_login
```

Il lifecycle Betfair deduplica le richieste per mercato e runtime identity. Questa deduplicazione non equivale a un'autorità end-to-end della sessione live.

## Confine della persistenza

History e timeline sono dati canonici distinti. Il commit journal coordina le scritture logiche e rende osservabili gli stati incompleti.

```txt
campione autorizzato
→ journal pending
→ history
→ timeline
→ completamento o stato incompleto osservabile
```

Evidence e frontend possono leggere lo stato `integrity`, ma non possiedono journal o recovery.

Il launcher dispone di un proprio lock operativo. Il backend non acquisisce ancora un lock esclusivo project-owned prima della recovery e del listener: l'audit considera quindi ancora aperta l'autorità esclusiva del writer della persistenza.

## Confine Source Identity

Il Source Identity Gate autorizza o blocca esclusivamente le nuove scritture del tracking coordinato.

Non deve:

- riscrivere dati storici;
- modificare tick già persistiti;
- usare URL o input frontend come prova dell'identità;
- trasformare una persistenza incompleta in mismatch.

Il gate corrente è identificato per `eventId`. Il progetto non possiede ancora un `trackingSessionId` propagato end-to-end; le callback tardive e l'autorità della sessione restano quindi un limite corrente documentato nell'audit.

## Confini di Evidence

Il Match Evidence Snapshot legge timeline e stato applicabile senza modificarli.

Non è:

- una strategia;
- una previsione;
- una fair odds;
- una prova di causalità;
- un punto di recovery;
- un writer della persistenza.

Market Reactions mantiene `causalityClaimed:false` e `interpretation: temporal_proximity_only`.

## Aree presenti ma deprecate

Il router e la UI Strategy sono ancora presenti nel codice corrente. Non devono essere estesi; verranno rimossi insieme ai relativi consumer in una task dedicata.

Sono inoltre ancora presenti endpoint legacy già individuati dall'audit. Finché il codice non viene modificato, i relativi documenti API devono descriverne onestamente l'esistenza.

## Regole durante un refactor

```txt
UI
→ router HTTP
→ servizio o modulo di dominio
→ persistenza oppure adattatore esterno
```

Non saltare livelli senza una ragione esplicita.

Prima di modificare un confine:

1. identificare owner del codice e owner documentale;
2. verificare contratti in ingresso e uscita;
3. includere soltanto i test del confine attraversato;
4. non dichiarare implementate strutture presenti soltanto nei registri;
5. aggiornare il documento owner nella stessa task che cambia il comportamento.

## Documenti collegati

- [Ciclo di vita dei dati](./02-data-lifecycle.md)
- [Mappa del repository](../reference/01-repository-map.md)
- [Selezione del contesto per AI](../ai/01-context-selection.md)
- [API Runtime Health](../api/06-runtime-health.md)
- [Runtime locale](../operations/01-local-runtime.md)
- [Stato corrente](../roadmap/01-current-state.md)
