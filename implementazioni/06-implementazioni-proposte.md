# Tennis Decision UI — Implementazioni utili da valutare

> Queste voci non modificano il prodotto. Sono strumenti di controllo emersi dall’audit B1–B6 e diventano task soltanto dopo una decisione sul loro ordine.

## 13. Esito della classificazione dopo B6

Baseline:

```txt
SHA verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Audit documentazione/codice B1–B6: completato in lettura
```

### IMPL-001 — Controllo automatico dei link Markdown/MDX

**Classificazione:** `NECESSARIA PRIMA DELLA MIGRAZIONE DOCUMENTALE`
**Stato:** `CONFERMATO`

L’indice canonico corrente è stato percorso durante l’audit e non è stato confermato alcun target mancante fra i collegamenti elencati direttamente.

Manca però un controllo globale ripetibile per:

- link relativi tra documenti;
- link `.mdx` da convertire in `.md`;
- target rimossi o spostati;
- anchor locali;
- collegamenti dei registri modulari;
- esclusione controllata dei materiali legacy.

Vincoli:

```txt
read-only
→ nessuna riscrittura automatica
→ output con file sorgente, riga e target
→ supporto temporaneo .mdx e .md
→ errore distinto per target assente e anchor non verificabile
```

Dipendenza:

```txt
prima della rimozione dei vecchi .mdx
```

### IMPL-002 — Inventario automatico degli endpoint

**Classificazione:** `CONSIGLIATA`
**Stato:** `CONFERMATO`

Utilità:

- confrontare router montati ed endpoint documentati;
- rilevare route legacy ancora raggiungibili;
- rilevare documenti che citano route inesistenti;
- produrre una base per la riscrittura dei documenti API.

Non deve sostituire il controllo semantico di payload, status, side effect, persistenza, errori e redazione.

Priorità:

```txt
dopo le correzioni runtime/frontend ad alta priorità
→ prima della riscrittura finale dei documenti API
```

### IMPL-003 — Matrice test ↔ modulo ↔ documento

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO`

L’audit ha verificato che:

- backend e frontend non espongono un comando `test` canonico;
- i test sono eseguiti come file singoli;
- il runbook Validation copia manualmente elenchi molto lunghi;
- alcuni controlli statici puntano a facade e non all’implementazione reale;
- test presenti, test eseguiti e collaudi live devono restare distinti.

Output minimo:

| Area | Owner | Test automatici | Build/check | Live | Ultimo esito |
| --- | --- | --- | --- | --- | --- |

La matrice non deve dichiarare `PASS` senza un output corrente.

### IMPL-004 — Archivio separato dei collaudi storici

**Classificazione:** `CONSIGLIATA`
**Stato:** `CONFERMATO, STRUTTURA DA APPROVARE`

Motivo:

- roadmap e runbook contengono collaudi 9A-R2B, 9B e report live;
- procedure correnti e osservazioni storiche sono mescolate;
- un report storico non deve essere interpretato come prova corrente.

Struttura minima proposta:

```txt
docs/tennis-decision-ui/archive/validations/
└── YYYY-MM-DD-<area>.md
```

Ogni report deve indicare data, SHA, ambiente, passi, risultati, limiti e artefatti disponibili.

Rischio da evitare:

- creare un secondo sistema documentale troppo pesante.

### IMPL-005 — Controllo di coerenza Todo ↔ registri

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO`

B6 ha rilevato concretamente:

- `TEST-001` presente nei registri ma assente dalla Todo;
- numerosi rilievi B3/B4 assenti dal BLOCCO E;
- prefissi `SECURITY-` e `PYTHON-` usati ma non dichiarati nel metodo.

Il controllo deve verificare:

```txt
insieme degli ID
stati incompatibili
prefissi sconosciuti
ID duplicati
ID dettagliati senza riga sintetica
righe sintetiche senza scheda owner
```

Non deve cambiare automaticamente priorità, risolvere decisioni, rinumerare ID o modificare i registri senza revisione.

## 13.1 Ordine consigliato

```txt
1. IMPL-005 — coerenza registri
2. IMPL-003 — matrice test
3. IMPL-001 — link checker prima della migrazione docs
4. IMPL-002 — inventario endpoint prima della riscrittura API
5. IMPL-004 — archivio collaudi durante la nuova struttura docs
```

## 13.2 Cosa non fare adesso

Non trasformare queste utility in un framework generale.

Devono restare:

- locali al repository;
- senza side effect sul runtime;
- eseguibili offline;
- semplici da leggere;
- coperte da test mirati;
- separate dalle feature live.

---

---

## 14. Strutture e procedure assenti emerse da D1–D18

Queste voci sono state registrate su richiesta esplicita durante il ricontrollo delle task completate.

Non sono feature approvate e non devono essere implementate automaticamente.

### IMPL-006 — Autorità della sessione live

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO COME STRUTTURA ASSENTE`

### Problema

Backend e frontend hanno più meccanismi locali:

```txt
generation Python
trackedMatches
Source Identity Gate
sessionId Evidence
requestId Source Identity
timeout SofaScore
timeout Betfair
dashboard bootstrap
```

Non esiste però una singola autorità di sessione che consenta a ogni callback asincrona di verificare:

```txt
questa risposta appartiene ancora alla sessione attiva?
```

### Evidenza collegata

```txt
RUNTIME-002
FRONTEND-001
FRONTEND-003
TEST-002
```

### Responsabilità minima proposta

```txt
session token immutabile
→ creato a ogni Start
→ invalidato su nuovo Start, Stop, mismatch e failure Start
→ verificato prima di observe, persist e setState
```

Il token non deve sostituire `eventId`, generation processi o Source Identity. Deve rappresentare l’autorità della sessione utente.

### Rischio da evitare

Creare due token non coordinati, uno backend e uno frontend, senza contratto comune.

---

### IMPL-007 — Boundary pubblico per diagnostica ed errori

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO COME STRUTTURA ASSENTE`

### Problema

Esistono utility di redazione, ma non esiste un serializer pubblico unico e allow-list che delimiti ciò che può attraversare le route HTTP.

### Evidenza collegata

```txt
SECURITY-001
SECURITY-002
SECURITY-003
DOC-019
D17
```

### Responsabilità minima proposta

```txt
errore interno
→ code pubblico stabile
→ messaggio pubblico bounded
→ dettagli completi soltanto nel log interno redatto

network_capture interna
→ contatori allow-list
→ nessun dump_dir
→ nessun path
→ nessun payload raw
```

### Vincoli

- nessuna redazione regex come unica barriera;
- nessun pass-through di oggetti Python;
- nessun path locale;
- nessuna URL completa;
- test route-level obbligatori.

---

### IMPL-008 — Harness offline per persistence e recovery

**Classificazione:** `CONSIGLIATA`
**Stato:** `CONFERMATO COME PROCEDURA ASSENTE`

### Problema

Esistono test unitari e integration test, ma non una procedura unica e ripetibile che costruisca fixture controllate per:

```txt
commit completo
partial history
partial timeline
target completed mancante
journal invalido identificabile
recovery riuscita
recovery_failed
```

senza toccare `backend/match_history/` reale.

### Evidenza collegata

```txt
D13
D14
IMPL-003
DOC-021
```

### Responsabilità minima proposta

```txt
directory temporanea
→ writer fake controllati
→ journal isolato
→ bootstrap recovery reale
→ chiamate read-only reali
→ report JSON
→ zero accesso a dati runtime
```

### Utilità

- collaudo deterministico;
- regressioni journal/recovery;
- verifica `409`;
- Evidence degradation;
- preparazione della documentazione operativa.

Non deve diventare un endpoint runtime.

---

### IMPL-009 — Adapter frontend per persistence integrity

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATO COME STRUTTURA ASSENTE`

### Problema

Gli hook raccolgono porzioni di integrity, ma non esiste un adapter centrale che costruisca uno stato frontend coerente.

### Evidenza collegata

```txt
FRONTEND-002
DOC-018
DOC-022
D14
```

### Responsabilità minima proposta

Input:

```txt
Sofa integrity
Betfair integrity
Evidence integrity
serverStatus
```

Output separato:

```txt
status
affectedSources
affectedDocuments
reason
isBlockingCrossSource
```

### Vincoli

Non deve:

- eseguire recovery;
- fondere persistence con health;
- fondere persistence con Source Identity;
- inventare una source;
- trasformare `409` in errore generico;
- duplicare la logica backend.

### Consumer minimi

```txt
TopBar o stato globale
BetfairDepthCard
MarketReactionsPage
eventuale pannello diagnostico
```

---

## 14.1 Ordine aggiornato delle implementazioni di supporto

```txt
1. IMPL-005 — coerenza registri
2. IMPL-006 — autorità sessione live
3. IMPL-007 — boundary diagnostica pubblico
4. IMPL-009 — adapter persistence frontend
5. IMPL-003 — matrice test
6. IMPL-008 — harness persistence/recovery
7. IMPL-001 — link checker prima migrazione docs
8. IMPL-002 — inventario endpoint
9. IMPL-004 — archivio collaudi
```

L’ordine definitivo dipende dal raggruppamento delle task e dalle decisioni dell’utente.

---

## 15. Implementazioni emerse dalle decisioni finali

### IMPL-009 — Estensione approvata: persistence locale e pannello globale

La struttura proposta deve produrre:

```txt
adapter persistence unico
→ stato locale per ogni card/settore
→ stato sintetico globale
→ indicatore in fondo alla sidebar
→ modale di controllo dettagliata
```

Il pannello non deve sostituire i messaggi locali e non deve fondere:

- health;
- freshness;
- Source Identity;
- persistence integrity;
- runtime state.

Stato:

```txt
NECESSARIA
DA PROGETTARE PRIMA DELLA TASK FRONTEND
```

### IMPL-010 — Toolkit autonomo per studio delle strategie

**Stato:** `FUTURO`
**Priorità:** dopo robustezza, replay e backtesting

Obiettivo:

creare funzioni e metodi per studiare strategie fuori dal runtime live principale.

Confini:

```txt
timeline canoniche / replay
→ input

analisi autonoma
→ output descrittivi e confrontabili

dashboard live
→ nessuna card Strategy attiva

Market Reactions
→ preservate come Evidence, non convertite in strategia
```

Il toolkit futuro può includere:

- dataset derivati versionati;
- replay deterministico;
- confronto fra ipotesi;
- pesi configurabili;
- metriche di performance;
- report offline;
- nessuna autorizzazione automatica al trade.

Non riusare direttamente la vecchia Strategy UI come base obbligatoria.

### IMPL-011 — Authority di manutenzione per cleanup offline

**Stato:** `NECESSARIA`
**Priorità:** prima di validare un apply reale

Struttura proposta:

```txt
maintenance lock project-owned
+ manifest runtime
+ porte effettive
+ identità dei servizi
+ recheck metadata file
```

Requisiti:

1. lock esclusivo condiviso con il launcher;
2. fail-closed quando un writer riconosciuto è attivo;
3. controllo delle porte selezionate realmente;
4. nessun kill-by-port;
5. confronto di file identity, size e mtime prima di `unlink`;
6. reason strutturata quando il file cambia dopo lo scan.

Questa struttura non esiste oggi e non deve essere simulata con un controllo generico dei processi.

## 15.1 Backlog UI non prioritario

```txt
[ ] piccole correzioni e rimozioni UI
[ ] responsive form/sidebar/dashboard/card/modali
```

Il backlog UI resta separato dalle task di isolamento sessione, hardening e persistence.
