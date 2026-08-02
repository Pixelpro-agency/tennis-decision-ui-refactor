# Tennis Decision UI — Todo list e stato della revisione

## Scopo

Questa Todo è la mappa operativa sintetica della revisione di **Tennis Decision UI**.

Il dettaglio completo è modulare:

- [Indice root](./implementazioni-tennis-decision-ui.md)
- [Indice dei moduli](./implementazioni/README.md)

I rilievi dettagliati vivono nei file tematici della cartella `implementazioni/`.

La Todo:

- mostra cosa è stato controllato;
- mostra cosa manca;
- indica il punto corrente;
- collega i rilievi tramite ID stabili;
- distingue verifica, decisione, task ed esecuzione;
- non sostituisce codice, test o documentazione tecnica;
- non contiene tutte le motivazioni;
- non autorizza modifiche automatiche.

---

## Baseline

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
SHA esaminato: ae9766dde97de08425d65cf62fe929aece3ba6a2
```

- [x] Accesso alla repository verificato
- [x] Branch canonico verificato
- [x] SHA iniziale verificato
- [x] Prima scansione architetturale
- [x] Metodo a due file approvato
- [ ] Seconda analisi approfondita della documentazione canonica
- [ ] Verifica migrazione documentale `.mdx` → `.md`
- [ ] Audit completo del codice
- [ ] Ricontrollo delle task completate
- [ ] Integrazione completa del metodo dell’altro progetto
- [ ] Valutazione delle implementazioni utili
- [ ] Definizione della prima task esecutiva

---

## Legenda

```txt
[x] completato
[ ] aperto
[-] parziale o in verifica
[?] decisione richiesta
[~] rinviato o futuro
```

Stati testuali:

```txt
DA VERIFICARE
IN VERIFICA
CONFERMATO
DA DECIDERE
APPROVATO
PRONTO PER TASK
IN ESECUZIONE
COMPLETATO
SCARTATO
RINVIATO
FUTURO
```

---

## Percorso operativo immediato

> - [x] Creazione del registro analitico
> - [x] Creazione della Todo
> - [ ] Audit documentazione — **PROSSIMA FASE**
> - [ ] Audit codice per settori
> - [ ] Ricontrollo task dichiarate completate
> - [ ] Integrazione workflow dell’altro progetto
> - [ ] Inventario implementazioni consigliate
> - [ ] Selezione della prima task esecutiva
> - [ ] Revisione delle modifiche
> - [ ] Collaudo indipendente, quando necessario
> - [ ] Commit e push eseguiti dall’utente

---

# BLOCCO A — Baseline e inventario

- [x] A1 — Repository, branch e SHA
- [x] A2 — Entry point pubblico `avvio.py`
- [x] A3 — Orchestrazione reale in `launcher/app.py`
- [x] A4 — Router backend montati
- [x] A5 — Recovery prima di `listen`
- [x] A6 — Registry processi Python individuato
- [x] A7 — Composizione frontend iniziale individuata
- [ ] A8 — Inventario completo root
- [ ] A9 — Inventario completo directory backend
- [ ] A10 — Inventario completo directory frontend
- [ ] A11 — Inventario completo package Python
- [ ] A12 — Inventario script operativi
- [ ] A13 — Inventario test
- [ ] A14 — Inventario documenti canonici
- [ ] A15 — Inventario legacy e file generati
- [ ] A16 — Matrice iniziale codice ↔ documentazione

---


# BLOCCO B0 — Regole documentali approvate

- [x] Nuovi documenti tecnici soltanto in formato `.md`
- [x] Non creare nuovi documenti `.mdx`
- [ ] Verificare il loader o generatore della documentazione
- [ ] Definire il formato dei metadata nei file `.md`
- [ ] Convertire eventuale sintassi MDX
- [ ] Aggiornare link `.mdx` → `.md`
- [ ] Evitare duplicati canonici `.mdx` e `.md`
- [ ] Eliminare i vecchi `.mdx` soltanto dopo verifica completa
- [x] Differire la lettura completa di `docs/planning`
- [ ] Analizzare `docs/planning` dopo documentazione canonica e codice
- [ ] Classificare ogni file planning
- [ ] Recuperare requisiti ancora validi
- [ ] Separare storico, futuro e stato corrente

# BLOCCO B — Audit documentazione

## B1 — Ingresso e orientamento

- [ ] README root
- [ ] `docs/tennis-decision-ui/index.mdx`
- [ ] repository map
- [ ] system boundaries
- [ ] data lifecycle
- [ ] link e frontmatter

## B2 — API

- [ ] API Match
- [ ] API Betfair
- [-] API Evidence — rilievo iniziale `DOC-003`
- [ ] API Strategy
- [ ] API Preflight
- [ ] API Runtime Health

## B3 — Moduli

- [ ] Tracking SofaScore
- [ ] Local context e point-by-point
- [ ] Timeline e history
- [ ] Commit journal e recovery
- [ ] Lifecycle Betfair
- [ ] Validità tecnica Betfair
- [ ] Match Evidence Snapshot
- [ ] Source Identity
- [ ] Qualità, flow e alignment
- [ ] Market Reactions

## B4 — Frontend e Python

- [ ] Session shell
- [ ] Polling e view model
- [ ] UI Betfair e Market Reactions
- [ ] Match Context UI
- [ ] Entry point e runtime Python
- [ ] Scraper SofaScore
- [ ] Scraper Betfair
- [ ] Graph URL

## B5 — Operations e roadmap

- [ ] Runtime locale
- [ ] Controllo tracking
- [ ] Diagnostica Betfair
- [ ] Validation e rollback
- [ ] Retention e cleanup
- [ ] Validazione live Source Identity
- [ ] Validazione live Betfair
- [-] Current State — rilievo iniziale `DOC-001`
- [ ] Replay e backtesting
- [ ] Market Reactions Journal

## B6 — Controlli trasversali

- [ ] Documenti owner
- [ ] Duplicazioni
- [ ] Contraddizioni
- [ ] Percorsi errati
- [ ] Link rotti
- [ ] Test citati ma assenti
- [ ] Funzioni implementate non documentate
- [ ] Funzioni future descritte come presenti
- [ ] Cronologia da spostare
- [ ] Materiale legacy

---

# BLOCCO C — Audit codice per settori

## C1 — Root e launcher

- [ ] Wrapper root
- [ ] Config launcher
- [ ] Lock
- [ ] Manifest
- [ ] Riuso servizi
- [ ] Porte alternative
- [ ] CDP
- [ ] Ownership
- [ ] Shutdown
- [ ] Test launcher

## C2 — Server e runtime backend

- [ ] Bootstrap server
- [ ] Recovery iniziale
- [ ] Health
- [ ] Shutdown backend
- [ ] Registry Python
- [ ] Runtime logger
- [ ] Redazione dati
- [ ] Test runtime

## C3 — Router Match

- [ ] Endpoint inventariati
- [ ] Tracking
- [ ] Untrack
- [ ] Stop globale
- [ ] Analisi
- [ ] History
- [ ] Timeline
- [ ] Source Identity status
- [ ] Integrity
- [ ] Test

## C4 — Router Betfair

- [ ] Latest
- [ ] JSON
- [ ] Odds
- [ ] Login window
- [ ] Log
- [ ] CDP
- [ ] Runtime conflict
- [ ] Integrity
- [ ] Test

## C5 — Router Evidence

- [ ] Latest read-only
- [ ] Conferma gate-aware
- [ ] Fallback persistito
- [ ] Revoca
- [ ] Side effect
- [ ] Errori
- [ ] Test
- [-] Allineamento documentale `DOC-003`

## C6 — Strategy e Preflight

- [-] Strategy legacy `CODE-001`
- [ ] Consumer frontend Strategy
- [ ] Market Evidence
- [ ] Preflight CDP
- [ ] Preflight Sofa URL
- [ ] Preflight Betfair URL
- [ ] Preflight Graph URL
- [ ] Test

## C7 — SofaScore

- [ ] Scheduler
- [ ] Update Sofa
- [ ] Normalizzazione
- [ ] Point-by-point
- [ ] Local Context
- [ ] History
- [ ] Timeline
- [ ] Gate
- [ ] Stop e mismatch
- [ ] Test

## C8 — Betfair

- [ ] Fetch
- [ ] Scraper lifecycle
- [ ] Processor
- [ ] Timeline
- [ ] Ladder
- [ ] Graph health
- [ ] Matched volume
- [ ] Cache
- [ ] Runtime health
- [ ] Login-only
- [ ] Test

## C9 — Storage e recovery

- [ ] History storage
- [ ] Timeline store
- [ ] Commit ID
- [ ] Journal store
- [ ] Atomic write
- [ ] Recovery bootstrap
- [ ] Repair Sofa
- [ ] Repair Betfair
- [ ] Integrity
- [ ] Failure mode
- [ ] Test

## C10 — Evidence e Source Identity

- [ ] Match Evidence builder
- [ ] Data quality
- [ ] No-trade reasons
- [ ] Name matching
- [ ] Confirmation store
- [ ] Effective identity
- [ ] Market Reactions
- [ ] Causality claim
- [ ] Degradazione persistence incomplete
- [ ] Test

## C11 — Frontend

- [ ] App composition
- [ ] Session state
- [ ] Preflight
- [ ] Start tracking
- [ ] Stop tracking
- [ ] Bootstrap dashboard
- [ ] Sofa polling
- [ ] Betfair polling
- [ ] Evidence polling
- [ ] Source Identity UI
- [ ] Betfair health
- [ ] View model
- [ ] Money Flow
- [ ] Match Context
- [ ] Market Reactions
- [ ] Strategy UI
- [ ] Build
- [ ] Lint
- [ ] Test

## C12 — Python e script

- [ ] SofaScore CLI
- [ ] SofaScore browser
- [ ] Betfair CLI
- [ ] Persistent profile
- [ ] CDP mode
- [ ] Graph URL
- [ ] Network capture
- [ ] Diagnostic redaction
- [ ] Cache
- [ ] Wrapper root
- [ ] Cleanup runtime cache
- [ ] PowerShell
- [ ] Test Python

## C13 — Cleanup

- [ ] File legacy
- [ ] Codice morto
- [ ] File duplicati
- [ ] Test obsoleti
- [ ] Script non usati
- [ ] Documenti non canonici
- [ ] Import non usati
- [ ] Componenti non raggiungibili
- [ ] Route non consumate
- [ ] Log o debug superati

---

# BLOCCO D — Ricontrollo task completate

- [ ] D1 — Source Identity Task 1A
- [ ] D2 — Source Identity frontend Task 1B
- [ ] D3 — Money Flow 2A
- [ ] D4 — Money Flow 2B
- [ ] D5 — Money Flow 2C
- [ ] D6 — Money Flow 2D
- [ ] D7 — Money Flow 2E
- [ ] D8 — Validazione live Betfair 2F
- [-] D9 — Runtime launcher Task 2 — **NON RIAPRIRE SENZA DISCREPANZA; `RUNTIME-001`**
- [ ] D10 — Stop globale Task 3a
- [ ] D11 — Timeline store Task 4
- [ ] D12 — Commit journal Task 6
- [ ] D13 — Recovery
- [ ] D14 — Persistence integrity
- [ ] D15 — Evidence degradation
- [ ] D16 — Context locale V1
- [ ] D17 — Diagnostica Betfair
- [ ] D18 — Retention cache runtime

Esiti consentiti:

- [ ] confermata
- [ ] confermata con limiti
- [ ] documentazione da correggere
- [ ] test da aggiornare
- [ ] da riaprire
- [ ] non verificabile

---

# BLOCCO E — Rilievi iniziali

- [-] `DOC-001` — Roadmap troppo storica — **CONFERMATO; decisione su archivio ancora aperta**
- [ ] `DOC-002` — Repository map troppo estesa — **DA VERIFICARE**
- [-] `DOC-003` — Evidence read-only/mutante — **CONFERMATO**
- [x] `RUNTIME-001` — Non riaprire runtime Task 2 senza discrepanza — **REGOLA APPROVATA**
- [ ] `CODE-001` — Strategy legacy — **DA VERIFICARE E DECIDERE**

---


# BLOCCO F0 — Audit differito di `docs/planning`

- [x] Cartella identificata come fonte non canonica dello stato corrente
- [x] Lettura indiscriminata rinviata
- [ ] Inventario file
- [ ] Raggruppamento per area tecnica
- [ ] Confronto con codice attuale
- [ ] Confronto con task dichiarate completate
- [ ] Classificazione `SUPERATA`
- [ ] Classificazione `REALIZZATA`
- [ ] Classificazione `PARZIALMENTE REALIZZATA`
- [ ] Classificazione `ANCORA VALIDA`
- [ ] Classificazione `FUTURA`
- [ ] Classificazione `DA DECIDERE`
- [ ] Classificazione `DUPLICATA ALTROVE`
- [ ] Classificazione `NON PIÙ PERTINENTE`
- [ ] Decisione su mantenimento, archivio, riscrittura o eliminazione

# BLOCCO F — Implementazioni utili

- [ ] `IMPL-001` — Check link MDX
- [ ] `IMPL-002` — Inventario endpoint
- [ ] `IMPL-003` — Matrice test ↔ modulo ↔ documento
- [?] `IMPL-004` — Archivio collaudi storici
- [ ] `IMPL-005` — Check coerenza Todo ↔ registro
- [ ] Inventario di altre implementazioni emerse
- [ ] Classificazione necessaria/consigliata/opzionale/futura
- [ ] Decisione utente
- [ ] Task separate

---

# BLOCCO G — Workflow dell’altro progetto

- [x] Modello `implementazioni.md` acquisito
- [x] Modello `todo-list.md` acquisito
- [ ] Analisi ruoli Chat Analisi / Desktop
- [ ] Regole prompt esecutivi
- [ ] Formato report
- [ ] Artefatto `fileModificati.md`
- [ ] Esecutore vs collaudatore
- [ ] Revisione locale
- [ ] Workflow Git
- [ ] Branch, commit, push e PR
- [ ] Adattamento specifico a Tennis Decision UI
- [ ] Decisioni utente sulle differenze
- [ ] Documentazione finale del workflow

---

# BLOCCO H — Modularizzazione futura

- [x] Possibilità di cartella root `implementazioni/` approvata
- [x] Soglia di modularizzazione raggiunta
- [x] Indice root preparato
- [x] Cartella `implementazioni/` preparata
- [x] Registro diviso per responsabilità
- [x] ID globali mantenuti
- [x] Collegamenti principali della Todo aggiornati
- [ ] Verificare nel repository i link relativi
- [ ] Verificare assenza di duplicazioni dopo inserimento
- [ ] Eliminare la precedente versione monolitica soltanto tramite sostituzione controllata

Soglie indicative:

```txt
oltre 1.500–2.000 righe
oppure oltre 100 rilievi
oppure rilettura troppo costosa
```

---

# BLOCCO H1 — Consegna dei documenti riscritti

- [x] Metodo preferito: file completi scaricabili
- [x] Inserimento nel repository eseguito dall’utente
- [ ] Definire frontmatter `.md`
- [ ] Preparare manifest vecchio percorso → nuovo percorso
- [ ] Preparare elenco `.mdx` da eliminare dopo verifica
- [ ] Preparare elenco link aggiornati
- [ ] Consegnare ZIP per batch numerosi
- [ ] Verificare struttura dello ZIP
- [ ] Verificare contenuto completo
- [ ] Verificare link
- [ ] Rimuovere vecchi `.mdx` solo alla fine

# BLOCCO I — Preparazione delle task esecutive

Per ogni rilievo approvato:

- [ ] problema dimostrato
- [ ] obiettivo
- [ ] comportamento da preservare
- [ ] file modificabili
- [ ] file consultabili
- [ ] fuori scope
- [ ] dipendenze
- [ ] test
- [ ] massimo tre tentativi
- [ ] report obbligatorio
- [ ] criteri di successo
- [ ] criteri di stop
- [ ] collaudo separato, se necessario
- [ ] impatto documentale
- [ ] decisioni utente risolte

---

# BLOCCO J — Chiusura complessiva

- [ ] Audit documentazione completato
- [ ] Audit codice completato
- [ ] Task completate ricontrollate
- [ ] Rilievi classificati
- [ ] Decisioni utente registrate
- [ ] Implementazioni utili classificate
- [ ] Cleanup classificato
- [ ] Workflow consolidato
- [ ] Todo coerente con registro
- [ ] Prima serie di task esecutive completata
- [ ] Documentazione canonica aggiornata
- [ ] Collaudi necessari conclusi
- [ ] Stato finale verificato sul nuovo SHA

---

## Prossimo punto

```txt
Audit approfondito della documentazione canonica
→ verifica tecnica `.mdx` → `.md`
→ aggiornamento dei rilievi DOC
→ audit del codice settore per settore
→ audit differito di `docs/planning`
```
