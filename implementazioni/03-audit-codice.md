# Tennis Decision UI — Audit del codice

> Contiene i rilievi tecnici iniziali e la mappa di controllo settore per settore.

### RUNTIME-001 — Non riaprire la Task 2 runtime senza una discrepanza concreta

**Stato:** `CONFERMATO`  
**Priorità:** regola di controllo  
**Area:** launcher e process lifecycle

**Codice già orientato:**

```txt
avvio.py
launcher/app.py
backend/src/server.js
backend/src/runtime/pythonProcessRegistry.js
```

**Osservazione**

La prima scansione conferma:

- lock prima del percorso di riuso;
- ownership distinta tra processi owned e reused;
- Chrome/CDP fuori dall’ownership;
- registry backend-wide dei figli Python;
- scope `tracking`, `login` e `all`;
- shutdown bounded;
- snapshot pubblico ridotto.

**Azione**

La task non deve essere riaperta soltanto perché esistono scenari live ancora non osservati.

**Cosa controllare ancora**

- test automatici;
- corrispondenza completa con i documenti owner;
- scenari live aperti;
- regressioni introdotte da modifiche successive.

**Criterio di riapertura**

Riaprire soltanto in presenza di:

- comportamento attuale contrario al contratto;
- test fallito significativo;
- documentazione che maschera un difetto reale;
- ownership o shutdown non sicuri;
- regressione riproducibile.

---

### CODE-001 — Strategy legacy da classificare definitivamente

**Stato:** `DA VERIFICARE`  
**Priorità:** bassa o media  
**Area:** Strategy

**Codice coinvolto:**

```txt
backend/src/routes/strategy.js
backend/src/routes/strategy/
frontend/src/components/LayTheWinner.jsx
frontend/src/components/strategy/
```

**Documento coinvolto:**

```txt
docs/tennis-decision-ui/api/04-strategy.mdx
```

**Osservazione**

La strategia è dichiarata indisponibile e legacy, ma la route continua a eseguire analisi SofaScore, leggere la timeline Betfair, costruire un view model e produrre logging.

**Alternative da verificare**

1. funzionalità supportata ma intenzionalmente disabilitata;
2. contenitore ancora utile per Market Evidence;
3. codice legacy da isolare;
4. codice e UI da rimuovere;
5. base futura da conservare ma escludere dal runtime ordinario.

**Cosa controllare ancora**

- consumer frontend;
- chiamate effettive;
- test;
- dati prodotti;
- dipendenze da Market Evidence;
- costo e side effect della route;
- decisione dell’utente sulla funzione.

**Decisione richiesta**

Dopo la verifica, l’utente deve indicare il ruolo futuro della Strategy.

---

## 11. Aree da ricontrollare nel codice

### Root e runtime locale

- [ ] `avvio.py`;
- [ ] `scraper.py`;
- [ ] `betfair_scraper.py`;
- [ ] `launcher/`;
- [ ] `scripts/`;
- [ ] configurazione environment;
- [ ] compatibilità Windows;
- [ ] porte preferite e alternative;
- [ ] lock e manifest;
- [ ] ownership;
- [ ] shutdown.

### Backend

- [ ] `server.js`;
- [ ] `routes/match.js`;
- [ ] `routes/betfair.js`;
- [ ] `routes/evidence.js`;
- [ ] `routes/strategy.js`;
- [ ] `routes/test.js`;
- [ ] moduli puri delle route;
- [ ] runtime registry;
- [ ] runtime logger;
- [ ] SofaScore;
- [ ] Betfair;
- [ ] Source Identity;
- [ ] history;
- [ ] timeline;
- [ ] journal;
- [ ] recovery;
- [ ] Evidence;
- [ ] Market Reactions;
- [ ] Strategy;
- [ ] test.

### Frontend

- [ ] `App.jsx`;
- [ ] session state;
- [ ] preflight;
- [ ] start e stop;
- [ ] bootstrap dashboard;
- [ ] polling SofaScore;
- [ ] polling Betfair;
- [ ] polling Evidence;
- [ ] Source Identity UI;
- [ ] Betfair health;
- [ ] dashboard view model;
- [ ] Money Flow;
- [ ] Match Context;
- [ ] Market Reactions;
- [ ] Strategy UI;
- [ ] componenti placeholder;
- [ ] test puri;
- [ ] build e lint.

### Python e scraper

- [ ] package SofaScore;
- [ ] package Betfair;
- [ ] CLI;
- [ ] CDP;
- [ ] persistent profile;
- [ ] Graph URL;
- [ ] network capture;
- [ ] redazione diagnostica;
- [ ] cache;
- [ ] output JSON;
- [ ] wrapper root;
- [ ] test Python.

---
