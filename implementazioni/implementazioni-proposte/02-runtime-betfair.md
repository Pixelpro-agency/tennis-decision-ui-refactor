# Tennis Decision UI — Runtime e acquisizione Betfair

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-016…018
> **Righe originali:** 1129–1373
> **Parte precedente:** [Utility e autorità di base](01-utility-e-autorita-base.md)
> **Parte successiva:** [Storage, documenti canonici e recovery](03-storage-recovery.md)

<!-- BEGIN ORIGINAL CONTENT -->
## 17. Implementazioni approvate dal Punto 3

### IMPL-016 — Betfair runtime command authority

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-006`, lifecycle Python, login-window, tracking Betfair

### Problema

Le autorità attuali sono separate:

```txt
loginWindowLifecycle.active
scraperLifecycle.activeScrapers per URL key
trackingSessionId futura
```

Non esiste un arbitro globale che stabilisca quale comando Betfair possa usare browser, profilo e mercato.

### Contratto minimo

```txt
betfairCommandId
trackingSessionId o null
kind: login | tracking | diagnostics
state: requested | active | stopping | completed | failed
runtimeIdentity
canonicalMarketIdentity
owner
createdAt
```

### Regole

- un solo comando Betfair mutante globale;
- stessa URL key non è sufficiente come identità;
- mercato canonico distinto dalla URL testuale;
- login e tracking richiedono handoff esplicito;
- diagnostica futura sempre non persistente;
- nessun riuso di Promise fra sessioni;
- invalidazione logica prima del cleanup fisico;
- failure/unknown fail-closed;
- nessun kill-by-port.

### Relazione con IMPL-006

`IMPL-006` decide se una callback appartiene alla sessione live.

`IMPL-016` decide quale comando Betfair possiede il runtime browser/scraper.

Le due autorità sono coordinate ma non fuse.

### Test minimi

```txt
TEST-012
+ tracking A vs login concorrente
+ tracking A vs diagnostics
+ handoff login → tracking
+ command stale non rilascia owner nuovo
+ runtime unknown blocca
```

---

### IMPL-017 — Local control-plane boundary

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** critica
**Dipendenze:** bootstrap backend, launcher, inventario endpoint `IMPL-002`

### Problema

Il backend locale espone route mutanti e diagnostiche con CORS aperto e senza bind loopback esplicito nel codice.

### Contratto minimo

```txt
listen host: 127.0.0.1
allowed origins: frontend locale risolto dal launcher
allowed hosts: loopback e porta backend effettiva
mutations: POST JSON
reads: GET senza side effect
```

### Route da classificare

```txt
control plane
→ Start
→ Stop
→ login-window
→ confirm/revoke Source Identity
→ future maintenance/diagnostics

data plane read-only
→ latest
→ json
→ health
→ evidence read-only
```

### Vincoli

- nessuna mutazione tramite GET;
- CORS wildcard vietato per il control plane;
- Origin assente gestita esplicitamente per CLI/test locali;
- nessuna fiducia basata soltanto sul browser;
- nessun indirizzo non loopback;
- test con Host/Origin non ammessi;
- compatibilità con porte alternative del launcher.

### Test minimi

- bind loopback;
- origine frontend ammessa;
- origine esterna rifiutata;
- Host non locale rifiutato;
- GET mutante assente;
- porte alternative consentite tramite manifest/runtime.

---

### IMPL-018 — Betfair acquisition envelope e provenance

**Classificazione:** `NECESSARIA`
**Stato:** `CONFERMATA E APPROVATA`
**Priorità:** alta
**Dipendenze:** processor Betfair, timeline canonica, health, `IMPL-012`, `IMPL-013`

### Problema

API mercato e Graph runner vengono acquisiti in istanti diversi ma fusi in un tick con un solo timestamp di registrazione.

Il sistema non può distinguere:

- dato acquisito;
- dato registrato;
- dato sintetico;
- skew fra runner;
- scrape lento ma appena persistito.

### Envelope minimo

```txt
schemaVersion
scrapeId
trackingSessionId
commandId
startedAt
completedAt
marketApiAcquiredAt
graphAcquisitions:
  selectionId
  acquiredAt
  completedAt
  status
  rowCount
recordedAt
maxGraphSkewMs
```

### Provenance runner

```txt
matchedTotal
matchedValueSource:
  api_runner
  graph_runner
  unavailable
```

È vietata la sorgente sintetica `market_total_divided_by_runner_count`.

### Freshness

```txt
acquiredAt
→ freshness del dato

recordedAt
→ osservabilità della pipeline
```

Un Graph skew oltre soglia produce:

```txt
Money Flow suppressed/degraded
reason: graph_acquisition_skew
```

### Relazioni

```txt
IMPL-012
→ fixture versionate con skew e dati mancanti

IMPL-013
→ durata per fase e ritardo acquired→recorded

IMPL-014
→ nessuna ottimizzazione prima della baseline
```

### Estensione futura — Stream API e attribuzione del volume

Una futura integrazione Stream API deve conservare per runner e update almeno:

```txt
selectionId
acquiredAt
EX_TRADED per quota
EX_ALL_OFFERS back/lay
lastTradedPrice
totalMatched / deltaTraded
```

L'aumento di `traded` prova volume abbinato; il solo movimento del prezzo senza
incremento traded è liquidità/cancellazione e non pressione direzionale.
L'attribuzione eventuale usa stati espliciti:

```txt
back_attributed | lay_attributed | ambiguous
confidence: high | medium | low
policyVersion
reasons
```

Prezzo, consumo del book e imbalance possono contribuire soltanto come evidenze
pesate. Nessun punteggio numerico è approvato finché non viene calibrato e
versionato con fixture. Segnali misti o multi-quota restano `ambiguous`; non
forzare il volume in Back/Lay.

### Test minimi

```txt
TEST-016
TEST-017
```

---

<!-- END ORIGINAL CONTENT -->
