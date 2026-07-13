# Tennis Decision UI

Applicazione locale per raccogliere dati live di tennis, integrare informazioni
SofaScore e Betfair e presentare evidenze operative in una UI React.

## Stack

- Frontend: React, Vite, Tailwind CSS e Recharts.
- Backend: Node.js, Express e API HTTP locali.
- Runtime e scraper: Python, Chrome CDP e PowerShell su Windows.

## Requisiti

- Python disponibile nel terminale.
- Una versione LTS recente di Node.js e npm.
- Google Chrome e PowerShell per il runtime locale completo.

## Installazione

Dalla root del progetto, in PowerShell:

```powershell
Copy-Item .env.example .env
npm install --prefix backend
npm install --prefix frontend
python avvio.py
```

Il launcher avvia il backend e il frontend, riutilizzando quando possibile i
servizi locali gia validi. Le porte preferite sono `3001` per il backend,
`3000` per il frontend e `9222` per Chrome CDP.

## Configurazione

Le variabili supportate sono documentate in `.env.example`:

- `MOONSHOT_API_KEY`
- `BETFAIR_APP_KEY`

Il file `.env` contiene valori locali e non deve essere versionato.

## Comandi utili

```powershell
# Backend in sviluppo
npm --prefix backend run dev

# Frontend in sviluppo
npm --prefix frontend run dev

# Build frontend
npm --prefix frontend run build
```

## Struttura

- `backend/`: API, tracking live, integrazione Betfair e persistenza.
- `frontend/`: interfaccia React.
- `launcher/`: coordinamento del runtime locale.
- `scrapers/`: scraper Python per SofaScore e Betfair.
- `scripts/`: strumenti di avvio, diagnostica e pulizia.
- `docs/tennis-decision-ui/`: documentazione tecnica canonica.

## Dati locali

Cronologia delle partite, cache, profili del browser, log, diagnostica, build e
credenziali sono esclusi da Git. Questi file possono restare sul computer senza
entrare nei commit.

Per architettura, API e procedure operative, consulta
[`docs/tennis-decision-ui/index.mdx`](docs/tennis-decision-ui/index.mdx).
