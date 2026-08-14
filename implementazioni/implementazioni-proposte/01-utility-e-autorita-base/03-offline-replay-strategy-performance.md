> **Facade:** [01-utility-e-autorita-base.md](../01-utility-e-autorita-base.md)
> **Registro principale:** [06-implementazioni-proposte.md](../../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-010/012/013/014
> **Parte precedente:** [Authority, boundary e supporto](02-autorita-boundary-e-supporto.md)
> **Parte successiva:** [Runtime e acquisizione Betfair](../02-runtime-betfair.md)

# Tennis Decision UI — Offline, replay, strategy e performance

> Questo child possiede le schede `IMPL-010`, `IMPL-012`, `IMPL-013` e `IMPL-014`, insieme alla pipeline cross-source e ai requisiti derivati che appartengono allo stesso responsibility boundary. Le voci future restano future e le voci aperte non sono promosse a completate.

## 15. Implementazioni emerse dalle decisioni finali — area offline e strategy

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

### Contratti da preservare dal backlog strategico

Il toolkit deve restare offline e versionato.

Ogni studio deve poter dichiarare:

```txt
studyId
version
conditionSetVersion
input provenance
reason code
status
```

Livelli consentiti inizialmente:

```txt
A — osservazione descrittiva
B — condizioni e motivi di blocco
```

Non introdurre nei primi livelli:

- probabilità;
- fair odds;
- raccomandazioni;
- automazione;
- interpretazioni certe del Money Flow.

La stessa fixture deve poter confrontare due versioni e produrre una differenza esplicita.

Una modalità shadow può calcolare una versione candidata senza mostrarla nella dashboard live e senza modificare la persistenza canonica.

### Requisiti futuri consolidati dalle fonti rimosse

Strategy Lab resta un'estensione offline di `IMPL-010` e dipende da
`IMPL-012`. Input ammessi: timeline canoniche persistite, metadata e qualità,
Source Identity storicamente applicabile, Evidence ricostruita e configurazione
versionata. Sono vietati fetch live, browser, scraper, cache, dump, credenziali
e informazione successiva al cursore.

Output minimo futuro:

```txt
eventId
algorithmVersion
configuration
inputRange
processedTicks / skippedTicks
dataQualitySummary
sourceIdentitySummary
evidenceSnapshots
strategyResult
reasons
startedAt / completedAt
```

`valueHypothesis` ed `externalEvidence` restano disabilitati finché non esistono baseline riproducibile, modello o contratto sorgente versionato, validazione su dati separati, timestamp e policy stale. Fonte assente o invalida produce `null` e reason: nessun fallback inventato, nessuna fair odds certa e nessuna raccomandazione.

Le viste future di attività runner recente/cumulativa, rotazione, price drift, compressione, marker Sofa v2, snapshot derivati e grafico campo/mercato restano descrittive. Devono usare dati confrontabili, conservare volume ambiguo, mostrare qualità/reason e mantenere `causalityClaimed:false`.

## 16. Implementazioni assorbite dal backlog operativo storico

### IMPL-012 — Fixture versionate e replay offline deterministico

**Classificazione:** `NECESSARIA PRIMA DI BACKTESTING E STUDI STRATEGICI`
**Stato del registro:** `NON COMPLETATA`
**Priorità storica:** dopo isolamento sessione e contratti pubblici prioritari

#### Stato attuale

Il manifest di validation non registra un profilo replay dedicato e non fornisce un closeout di `IMPL-012`. Le entry offline esistenti non devono essere assimilate a un replay canonico temporale. La voce resta aperta.

### Problema storico

Molti casi importanti dipendono ancora da una partita live, Chrome, CDP, login e disponibilità del mercato.

Manca una base comune per riprodurre:

- Source Identity pending/mismatch;
- epoch Betfair;
- tick fuori ordine;
- timestamp coincidenti;
- Graph invariati ma acquisiti nuovamente;
- un solo Graph aggiornato;
- Graph disallineati;
- response tardive;
- partial persistence;
- recovery failed;
- Evidence degradate.

### Responsabilità minima

```txt
schema fixture versionato
→ fixture corte e anonimizzate
→ validator

runner offline
→ ordine deterministico
→ tie-breaker esplicito
→ cursore storico
→ nessun dato futuro
→ epoch al cursore
→ policy Source Identity storica
→ freshness e Graph skew
→ Evidence e reason
```

Fonti consentite:

- fixture equivalenti alle timeline canoniche;
- copie anonimizzate e ridotte;
- timeline canoniche lette in sola lettura.

Fonti vietate:

- cache;
- dump;
- browser;
- fetch live;
- stato runtime corrente.

### Relazione con IMPL-008

`IMPL-008` resta specializzato su journal e recovery.

`IMPL-012` è più ampio e copre il dominio temporale, Source Identity, Graph e Evidence.

I due harness possono condividere utility pure, ma non devono diventare un unico mega-runner.

### Output minimo consolidato

```txt
eventId
algorithmVersion / configuration
inputRange
processedTicks / skippedTicks
dataQualitySummary
sourceIdentitySummary
evidenceSnapshots
reasons
startedAt / completedAt
```

Una conferma Source Identity corrente non valida retroattivamente tick storici
incompatibili. Il replay usa la policy applicabile a fingerprint, epoch e
intervallo, non lo stato runtime presente.

### Criterio di prontezza

- policy storica Source Identity decisa;
- tie-breaker temporale deciso;
- schema fixture definito;
- builder live riutilizzabili senza I/O;
- output reason stabile.

---

### Estensione approvata — pipeline cross-source e dataset derivati

Questa sezione resta un **target futuro approvato** del registro e non descrive una pipeline già presente nel runtime corrente.

La seconda fase del progetto utilizzerà le timeline canoniche prodotte durante il live per costruire una rappresentazione allineata di campo e mercato.

La pipeline approvata è:

```txt
timeline SofaScore canonica
+
timeline Betfair canonica
→ allineamento cross-source deterministico
→ dataset combinato versionato
├─ grafico campo/mercato
└─ dataset filtrato per replay e backtesting
```

Il grafico è un consumer del dataset combinato. Non è una fonte dati e non deve essere usato come autorità per produrre l’export destinato al backtesting.

Il dataset cross-source deve conservare almeno:

```txt
datasetId
schemaVersion
eventId
source timeline revision/digest
source tick ID e sequence
acquiredAt e recordedAt
tracking session/epoch, quando disponibili
Source Identity applicabile
selectionId Betfair
fieldStateId derivato
alignmentPolicyVersion
skew temporale
alignment status
data quality
reason
generatedAt
```

L’allineamento temporale deve essere causale:

```txt
tick Betfair
→ ultimo stato SofaScore disponibile in precedenza
→ nessuna informazione successiva al cursore
```

Stati minimi dell’allineamento:

```txt
exact
bounded_previous
stale
unmatched
```

Il dataset filtrato per backtesting deve dichiarare:

```txt
datasetVersion
featureSetVersion
transformVersion
filter configuration
input range
input digests
processed / skipped / unmatched
quality summary
reasons
```

Le timeline live restano la fonte primaria. Il dataset combinato e quello di backtesting sono artefatti derivati e non modificano i documenti canonici di origine.

La cancellazione dei file live non è autorizzata come comportamento ordinario. Una futura procedura di archiviazione o eliminazione potrà essere valutata soltanto dopo:

```txt
export deterministico completato
→ digest e provenance registrati
→ schema e trasformazione versionati
→ dataset validato
→ assenza di integrity pending o recovery failure
→ policy di retention esplicitamente approvata
```

Nella prima fase operativa è preferibile conservare o comprimere le timeline originali, perché la loro eliminazione impedisce di derivare nuove feature o verificare trasformazioni precedenti.

### IMPL-013 — Baseline end-to-end di prestazioni, freshness e osservabilità

**Classificazione:** `NECESSARIA PRIMA DI QUALUNQUE OTTIMIZZAZIONE BETFAIR`
**Stato del registro:** `NON COMPLETATA`
**Priorità storica:** dopo IMPL-006 e IMPL-012

#### Stato attuale

`scripts/validation/test-manifest.json` definisce il profilo `benchmark` con `enabled: false` e `status: planned`, indicando esplicitamente la dipendenza da `IMPL-013`. Non risulta quindi una baseline prestazionale canonica già implementata.

### Obiettivo storico

Misurare senza ottimizzare:

```txt
scheduler
→ Python
→ Playwright
→ CDP
→ pagina mercato
→ Graph 1 / Graph 2
→ parsing
→ bridge Node/Python
→ persistenza
→ API
→ frontend
```

### Metriche minime

Per fase:

- durata;
- stato;
- reason;
- righe;
- request count;
- acquisition timestamp;
- freshness;
- Graph skew;
- payload size.

Per sessione:

- p50/p95;
- tick validi/rifiutati;
- timeout/retry;
- partial/recovery;
- CPU/memoria;
- crescita file;
- processi e pagine residue.

### Vincoli

- log strutturali e redatti;
- nessun payload completo;
- nessuna URL sensibile;
- nessun aumento del traffico;
- nessuna modifica ai timeout;
- nessuna nuova cache;
- nessun worker persistente;
- nessuna ottimizzazione nello stesso task.

### Output

```txt
baseline locale
→ JSONL o report strutturato
→ cold start vs steady state
→ p50 / p95
→ colli di bottiglia osservati
→ nessuna conclusione inventata
```

---

### IMPL-014 — Ottimizzazione prudente e reversibile dello scraper Betfair

**Classificazione:** `FUTURA E CONDIZIONATA`
**Stato del registro:** `FUTURA E NON PRONTA`
**Dipendenze storiche:** IMPL-006, IMPL-012 e IMPL-013

### Regola

Ogni fase segue:

```txt
baseline
→ singola modifica
→ test
→ benchmark
→ traffico remoto
→ freshness
→ keep / rollback / needs_more_data
```

### Ordine candidato

1. parsing DOM aggregato;
2. attese basate su condizioni reali;
3. worker Python persistente backend-owned;
4. riuso verificato delle pagine Graph;
5. misurazione e classificazione Graph skew;
6. riduzione delle navigazioni della pagina principale;
7. persistenza più efficiente solo se collo di bottiglia;
8. concorrenza Graph limitata soltanto come ultima opzione.

### Invarianti

- un solo match;
- un solo comando Betfair mutante;
- Chrome non owned;
- Source Identity invariata;
- stessa timeline canonica;
- vecchio DOM non è una nuova acquisizione;
- un solo Graph aggiornato non si combina con il precedente;
- nessun retry aggressivo;
- nessun aumento automatico della frequenza;
- feature flag o rollback per ogni fase.

---
