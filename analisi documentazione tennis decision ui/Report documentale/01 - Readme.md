# Report documentale — `README.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-001
Sequenza audit: 01/72
Documento analizzato: README.md
Percorso documento: README.md
Percorso report: Report documentale/01 - Readme.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 116 righe
Ruolo: punto di ingresso generale del progetto
Stato report: completato
```

Il README descrive finalità, stack, requisiti, installazione, avvio, validazione, struttura del repository, dati sensibili e documentazione di riferimento.

## Esito sintetico

```text
Coerenza generale con il progetto: ALTA
Contraddizioni bloccanti: 0
Informazioni obsolete accertate: 0
Correzioni consigliate: 2
Migliorie editoriali facoltative: 1
Necessità di suddivisione: NO
```

Il documento è utilizzabile nello stato attuale. Non richiede una riscrittura strutturale.

---

## 1. Descrizione del progetto

### Esito: coerente

Il README presenta il sistema come applicazione locale che:

* raccoglie dati SofaScore e Betfair;
* normalizza e persiste dati;
* costruisce Evidence;
* presenta informazioni in una UI;
* non deve essere interpretata come sistema di previsione o autorizzazione al trade.

Questa impostazione coincide con la documentazione owner di Market Reactions, che esclude esplicitamente segnali operativi, raccomandazioni, previsioni e causalità dimostrata e mantiene `causalityClaimed:false`.

**Modifiche necessarie:** nessuna.

---

## 2. Stack tecnologico

### Esito: coerente

Il README dichiara:

```text
Frontend: React, Vite, Tailwind CSS, Recharts
Backend: Node.js, Express
Runtime e scraper: Python, Chrome CDP, PowerShell
```

I manifest confermano:

* React, React DOM, Recharts, Vite e Tailwind nel frontend;
* Express, CORS, dotenv e node-fetch nel backend.

**Modifiche necessarie:** nessuna.

L’omissione di librerie secondarie, come `lucide-react`, è corretta: il README non deve diventare una copia completa dei manifest.

---

## 3. Requisiti

### Esito: sostanzialmente coerente, ma impreciso

Il README richiede:

```text
una versione LTS recente di Node.js e npm
```

La frase non è falsa, ma non definisce un contratto riproducibile:

* né `backend/package.json` né `frontend/package.json` dichiarano un campo `engines`;
* il lockfile frontend mostra che Vite 5 richiede Node.js `^18.0.0 || >=20.0.0`; altre dipendenze correnti richiedono almeno Node.js 18.

### Finding `README-001` — requisito Node non sufficientemente deterministico

**Gravità:** bassa
**Tipo:** manutenibilità documentale

La parola “recente” cambia significato nel tempo e non permette di sapere quale versione sia realmente supportata e verificata dal progetto.

### Modifica consigliata

Prima scelta tecnica:

1. stabilire quale versione Node viene ufficialmente usata;
2. aggiungere `engines.node` nei due `package.json`;
3. riportare nel README lo stesso requisito.

Fino a quella decisione, sostituire:

```text
- una versione LTS recente di Node.js e npm;
```

con:

```text
- una release LTS supportata di Node.js con npm; la versione ufficialmente supportata deve restare allineata ai manifest del backend e del frontend;
```

Questa formulazione elimina l’ambiguità senza inventare una versione non ancora dichiarata dal repository.

---

## 4. Installazione e file `.env`

### Esito: coerente

I comandi:

```powershell
Copy-Item .env.example .env
npm install --prefix backend
npm install --prefix frontend
```

sono compatibili con la struttura del progetto:

* backend e frontend hanno manifest indipendenti;
* non è necessario un `package.json` nella root;
* `.env.example` contiene `MOONSHOT_API_KEY` e `BETFAIR_APP_KEY`;
* lo scraper Betfair cerca `BETFAIR_APP_KEY` nell’ambiente oppure nel file `.env` della root.

L’uso di `npm install` è valido.

L’eventuale sostituzione con `npm ci` migliorerebbe la riproducibilità delle installazioni pulite, ma non rappresenta una correzione obbligatoria e cambierebbe il workflow attuale. Non la consiglio in questa task.

---

## 5. Avvio e porte

### Esito: pienamente coerente

Il README indica come porte preferite:

```text
Chrome CDP: 9222
Backend:    3001
Frontend:   3000
```

Sono esattamente i valori configurati nel launcher.

È corretta anche la precisazione secondo cui le porte non sono riservate:

* il launcher prova più porte;
* riusa soltanto servizi con identità verificata;
* non termina processi in base alla sola porta;
* possiede e arresta soltanto i processi avviati direttamente.

Anche Vite usa `3000` come fallback e `3001` come target backend predefinito.

**Modifiche necessarie:** nessuna.

---

## 6. Comandi di validazione

### Esito: coerente

I profili elencati nel README corrispondono al manifest:

```text
fast
backend
frontend
python
full-offline
```

Questi profili risultano implementati e abilitati.

Sono invece correttamente descritti come pianificati e non eseguibili:

```text
persistence
benchmark
live
```

Il manifest contiene per ciascuno stato, abilitazione e motivo. I checker documentali appartengono effettivamente ai profili `fast` e `full-offline` e sono dichiarati read-only.

Il runner:

* legge il manifest;
* seleziona le entry del profilo;
* le esegue in processi separati;
* applica limiti e timeout;
* genera un artefatto sotto `test-results/`;
* rifiuta i profili disabilitati invece di considerarli superati.

### Miglioria editoriale `README-STYLE-001`

La frase:

```text
salva un risultato JSON bounded sotto test-results/
```

mescola italiano e inglese senza necessità.

Sostituire con:

```text
salva sotto `test-results/` un risultato JSON con output limitato.
```

**Gravità:** puramente editoriale.

---

## 7. Struttura del repository

### Esito: coerente

Le responsabilità assegnate alle directory principali sono compatibili con il progetto:

| Percorso                   | Valutazione |
| -------------------------- | ----------- |
| `backend/`                 | corretta    |
| `frontend/`                | corretta    |
| `launcher/`                | corretta    |
| `scrapers/`                | corretta    |
| `scripts/`                 | corretta    |
| `docs/tennis-decision-ui/` | corretta    |
| `docs/validations/`        | corretta    |
| `docs/archive/`            | corretta    |

La distinzione tra documentazione canonica, validazioni storiche e materiale archive coincide con l’indice canonico.

La descrizione di `docs/archive/` è già risolta e non richiede ulteriori modifiche o discussioni.

---

## 8. Dati locali e sensibili

### Esito: corretto, con un percorso ambiguo

Il README elenca:

```text
backend/match_history/ e .pending_commits/
```

Il problema è che `.pending_commits/` non è una directory autonoma nella root: si trova dentro `backend/match_history/`.

Gli owner storage definiscono infatti:

```text
backend/match_history/.pending_commits/
backend/match_history/.writer_authority/
```

Anche `.writer_authority/` è un sidecar locale che non deve essere trattato come normale sorgente o artefatto business.

### Finding `README-002` — percorso `.pending_commits/` incompleto

**Gravità:** bassa
**Tipo:** precisione del percorso

La formulazione attuale può far pensare che esista:

```text
<root>/.pending_commits/
```

mentre il percorso corretto è:

```text
backend/match_history/.pending_commits/
```

### Modifica consigliata

Sostituire:

```text
- `backend/match_history/` e `.pending_commits/`, salvo task espliciti di storage o recovery.
```

con:

```text
- `backend/match_history/`, inclusi i sidecar `.pending_commits/` e `.writer_authority/`, salvo task espliciti di storage o recovery.
```

Questa è la correzione più concreta rilevata nel README.

---

## 9. Collegamenti documentali

### Esito: coerente

Il README indirizza correttamente a:

```text
docs/tennis-decision-ui/index.md
docs/tennis-decision-ui/roadmap/01-current-state.md
```

L’indice si dichiara effettivamente fonte canonica della documentazione tecnica e rimanda agli owner, ai registri e allo stato corrente.

La frase finale che vieta di usare il README come registro di task, decisioni e finding è appropriata: impedisce che il punto d’ingresso diventi un secondo registro operativo.

**Modifiche necessarie:** nessuna.

---

## 10. Lunghezza e integrità del contesto

Il file termina alla riga 116.

### Valutazione

```text
File troppo lungo: no
Rischio di perdita del contesto: basso
Suddivisione consigliata: no
```

Il README contiene soltanto informazioni introduttive e rimanda correttamente ai documenti owner per i dettagli.

Dividerlo produrrebbe effetti negativi:

* frammenterebbe il punto di ingresso;
* duplicherebbe la navigazione già disponibile nell’indice canonico;
* renderebbe meno immediata l’installazione;
* aumenterebbe il rischio di divergenza tra più file introduttivi.

### Regola consigliata per il futuro

Mantenere il README come documento unico. Qualora iniziasse a includere contratti API, dettagli di storage, lifecycle completi o procedure diagnostiche estese, spostare quei blocchi negli owner esistenti invece di creare più README.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-001
Percorso report: Report documentale/01 - Readme.md
Documento: README.md
Change ID: README-001
Change ID: README-002
Change ID: README-STYLE-001
Suddivisione richiesta: no
```

I due file mappa devono conservare soltanto questi riferimenti e la sintesi delle modifiche. Il contenuto completo dell’analisi resta esclusivamente in questo file.

---

# Modifiche proposte

## Correzioni consigliate

### 1. Requisito Node

```diff
-- una versione LTS recente di Node.js e npm;
+- una release LTS supportata di Node.js con npm; la versione ufficialmente supportata deve restare allineata ai manifest del backend e del frontend;
```

La soluzione definitiva resta dichiarare `engines.node` nei manifest.

### 2. Percorsi di persistenza locale

```diff
-- `backend/match_history/` e `.pending_commits/`, salvo task espliciti di storage o recovery.
+- `backend/match_history/`, inclusi i sidecar `.pending_commits/` e `.writer_authority/`, salvo task espliciti di storage o recovery.
```

## Miglioria editoriale facoltativa

```diff
- salva un risultato JSON bounded sotto `test-results/`.
+ salva sotto `test-results/` un risultato JSON con output limitato.
```

---

# Decisione finale

```text
README.md: APPROVATO CON CORREZIONI MINORI
Riscrittura completa: non necessaria
Suddivisione: non necessaria
Modifica urgente: nessuna
Correzioni consigliate: 2
Miglioria editoriale: 1
```

Il documento è sostanzialmente affidabile e coerente con il progetto. Le modifiche proposte migliorano precisione e riproducibilità senza cambiarne struttura, filosofia o funzione.
