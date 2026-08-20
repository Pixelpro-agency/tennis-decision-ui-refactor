# Tennis Decision UI — Piano generale dell’audit

> Questo file definisce ordine, aree e output delle analisi. I rilievi dettagliati vivono nei file tematici.

> **Autorità temporale:** questo documento conserva il piano originario e gli snapshot storici dell'audit. Lo stato operativo corrente vive nella Todo, nell'audit tecnico e nel root registry. Una fase indicata qui come futura o differita può essere stata completata successivamente.

“Audit completato” significa che l'attività è stata eseguita nel perimetro dichiarato. Non implica automaticamente copertura esaustiva, checklist interamente verde, chiusura di tutti i finding, esecuzione di ogni test o completamento dei collaudi live.

## 8. Piano generale delle analisi

### BLOCCO A — Baseline e inventario

Obiettivo:

- confermare repository, branch e SHA;
- mappare root e directory principali;
- distinguere file canonici, runtime, legacy e generati;
- identificare entrypoint pubblici e reali;
- mappare router, endpoint e processi;
- mappare documenti owner.

Output:

- inventario iniziale;
- lista delle aree;
- matrice preliminare codice ↔ documentazione;
- rilevamento di percorsi mancanti o non canonici.

### BLOCCO B — Audit della documentazione

Controllare:

- documentazione canonica corrente e relativi documenti owner;
- collegamenti relativi;
- documenti legacy;
- duplicazioni;
- contratti ripetuti;
- cronologia eccessiva;
- affermazioni non più vere;
- test citati ma assenti o non più pertinenti;
- funzionalità implementate ma non documentate;
- funzionalità future descritte come presenti.

### BLOCCO C — Audit del codice per settore

Settori:

1. root ed entrypoint;
2. launcher e lifecycle locale;
3. server backend e bootstrap;
4. router Match;
5. router Betfair;
6. router Evidence;
7. router Strategy;
8. router Preflight e Runtime Health;
9. registry dei processi Python e logging;
10. tracking SofaScore;
11. tracking e lifecycle Betfair;
12. Source Identity Gate;
13. history, timeline e commit journal;
14. recovery e persistence integrity;
15. Evidence e Market Reactions;
16. frontend shell e stato sessione;
17. polling e view model;
18. UI Source Identity e Betfair;
19. scraper Python SofaScore;
20. scraper Python Betfair;
21. script operativi e cleanup;
22. test automatici;
23. file legacy, duplicati e candidati cleanup.

Per ogni settore:

```txt
file owner
→ dipendenze
→ contratti pubblici
→ side effect
→ test
→ documenti owner
→ discrepanze
→ rilievi
```

### BLOCCO D — Ricontrollo delle task dichiarate completate

Obiettivo:

- verificare sul repository attuale le task considerate concluse;
- distinguere implementazione, test automatici e validazione live;
- individuare regressioni o documentazione storica non più corrispondente;
- non riaprire task concluse senza una discrepanza concreta.

Aree già da ricontrollare:

- Source Identity Task 1;
- Money Flow Task 2A–2F;
- runtime launcher e process lifecycle;
- Task 3a stop globale;
- Task 4 timeline store;
- Task 6 journal, recovery e integrity;
- frontend Source Identity;
- Context locale V1;
- hardening diagnostica Betfair;
- retention cache runtime.

### BLOCCO E — Implementazioni utili da considerare

Questa fase arriva soltanto dopo l’audit.

Classificare ogni proposta come:

```txt
necessaria
consigliata
opzionale
hardening
automazione
qualità
manutenibilità
futura
da non fare
```

Non introdurre implementazioni soltanto perché tecnicamente interessanti.

Valutare almeno:

- controlli automatici di coerenza documentazione ↔ file;
- validazione dei link documentali;
- inventario endpoint;
- test dei contratti pubblici;
- audit dei file legacy;
- automazioni di controllo senza side effect;
- riduzione delle duplicazioni documentali;
- separazione fra stato corrente e storico delle validazioni;
- strumenti per aggiornare Todo e registro senza divergenze.

## 8.1 Stato dopo il checkpoint B6

Baseline dell’audit concluso:

```txt
SHA verificato
→ b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

Stato:

```txt
BLOCCO A — baseline e inventario
→ completato nel perimetro necessario

BLOCCO B — documentazione canonica
→ B1–B6 completati

BLOCCO C — audit codice
→ prima analisi statica per tutti i settori completata
→ test presenti letti
→ suite non eseguite

BLOCCO D — ricontrollo task completate
→ prossimo blocco

BLOCCO E — implementazioni utili
→ classificate, non ancora eseguite
```

Il completamento dell’audit B1–B6 significa:

- documenti owner confrontati con il codice;
- discrepanze principali registrate;
- bug, gap di test e decisioni separati;
- roadmap future distinte dallo stato corrente;
- registri riallineati.

Non significa:

- che i test siano stati eseguiti nuovamente;
- che le task dichiarate completate siano tutte riconfermate;
- che i bug siano già corretti;

Ordine successivo:

```txt
ricontrollo task completate
→ decisioni utente strettamente necessarie
→ raggruppamento dei rilievi in task esecutive
→ correzioni codice prioritarie
```

---

## 8.2 Stato dopo il ricontrollo D1–D18

Baseline invariata:

```txt
SHA verificato
→ b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

Esito:

```txt
D1–D18
→ completati

CONFERMATA
→ 9

CONFERMATA CON LIMITI
→ 7

DA RIAPRIRE
→ D14 persistence integrity frontend/cross-layer
→ D17 diagnostica Betfair hardening pubblico/capture
```

Il ricontrollo ha inoltre registrato strutture o procedure assenti:

```txt
IMPL-006 — autorità della sessione live
IMPL-007 — serializer pubblico diagnostica/errori
IMPL-008 — harness offline persistence/recovery
IMPL-009 — adapter frontend persistence integrity
```

Queste voci non sono automaticamente approvate come implementazione.

Ordine successivo:

```txt
decisioni utente strettamente necessarie
→ raggruppamento dei rilievi in task
→ correzioni prioritarie
```

Il ricontrollo D1–D18 non ha eseguito suite, collaudi live o modifiche al prodotto.