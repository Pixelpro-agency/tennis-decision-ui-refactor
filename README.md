# Tennis Decision UI

Applicazione locale per raccogliere, persistere e visualizzare dati live di tennis provenienti da SofaScore e Betfair.

Il progetto separa acquisizione, normalizzazione, persistenza canonica, Evidence e interfaccia. Gli output correnti sono dati tecnici ed evidenze descrittive: non devono essere interpretati come causalità dimostrata, previsione, fair odds o autorizzazione al trade.

## Stack

- **Frontend:** React, Vite, Tailwind CSS e Recharts.
- **Backend:** Node.js, Express e API HTTP locali.
- **Runtime e scraper:** Python, Chrome CDP e PowerShell su Windows.

## Requisiti

- Python disponibile nel terminale;
- una versione LTS recente di Node.js e npm;
- Google Chrome e PowerShell per il runtime locale completo.

## Installazione

Dalla root del progetto, in PowerShell:

```powershell
Copy-Item .env.example .env
npm install --prefix backend
npm install --prefix frontend
```

Inserire in `.env` soltanto valori locali. Il file non deve essere versionato.

Le variabili attualmente previste sono documentate in `.env.example`.

## Avvio ordinario

```powershell
python avvio.py
```

Il launcher coordina Chrome CDP, backend e frontend. Le porte preferite sono:

| Servizio | Porta preferita |
| --- | ---: |
| Chrome CDP | `9222` |
| Backend Express | `3001` |
| Frontend Vite | `3000` |

Le porte sono preferite, non riservate: il launcher può riusare servizi identificati o scegliere porte alternative senza terminare processi in base alla sola porta.

## Comandi utili

```powershell
# Backend in sviluppo
npm --prefix backend run dev

# Frontend in sviluppo
npm --prefix frontend run dev

# Build frontend
npm --prefix frontend run build

# Coerenza dei registri
python scripts/check_registry_consistency.py

# Link Markdown/MDX
python scripts/check_documentation_links.py

# Profilo rapido offline
node scripts/validation/run.mjs fast

# Profili separati
node scripts/validation/run.mjs backend
node scripts/validation/run.mjs frontend
node scripts/validation/run.mjs python

# Tutti i controlli offline abilitati
node scripts/validation/run.mjs full-offline
```

Il runner legge `scripts/validation/test-manifest.json`, esegue ogni entry in un child process separato, applica timeout e salva un risultato JSON bounded sotto `test-results/`. I checker documentali restano read-only e fanno parte dei profili `fast` e `full-offline`.

I profili `persistence`, `benchmark` e `live` sono riconosciuti ma non ancora eseguibili. Un profilo pianificato non viene dichiarato `skipped` o `passed`.

## Struttura principale

| Percorso | Responsabilità |
| --- | --- |
| `backend/` | API, tracking live, normalizzazione, persistenza, recovery ed Evidence |
| `frontend/` | Dashboard React, polling e presentazione degli stati live |
| `launcher/` | Coordinamento del runtime locale |
| `scrapers/` | Implementazione Python per SofaScore e Betfair |
| `scripts/` | Avvio, diagnostica, manutenzione e runner di validazione locale |
| `docs/tennis-decision-ui/` | Documentazione tecnica canonica corrente |
| `docs/validations/` | Validazioni e collaudi storici separati dagli owner tecnici |
| `docs/archive/` | Materiale non canonico conservato per tracciabilità |

## Dati locali e sensibili

History, timeline, journal, cache, profili browser, dump di rete, log, lock runtime, build e credenziali non devono essere trattati come normale materiale sorgente.

Non condividere o versionare:

- `.env` e chiavi locali;
- cookie, token o credenziali;
- profili browser;
- dump diagnostici non necessari;
- `backend/match_history/` e `.pending_commits/`, salvo task espliciti di storage o recovery.

## Documentazione

L'indice canonico è:

[Documentazione tecnica Tennis Decision UI](docs/tennis-decision-ui/index.md)

La documentazione canonica usa Markdown ordinario `.md`. Collaudi storici e materiale non canonico restano separati rispettivamente in `docs/validations/` e `docs/archive/`.

Per lo stato reale del progetto consultare [Stato corrente](docs/tennis-decision-ui/roadmap/01-current-state.md). Per task, decisioni e finding dell'audit usare i registri dedicati, non il README.
