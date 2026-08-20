## 16. Decisioni documentali e materiali di processo

> **Checkpoint storico:** le sezioni 16–17 conservano decisioni e inventari relativi alla precedente riorganizzazione e classificazione dei materiali documentali. Le formulazioni al futuro, le classificazioni e gli stati riportati nelle tabelle appartengono a quel checkpoint e non costituiscono backlog o authority corrente.
>

### 16.1 Collaudi

Al checkpoint fu approvata la separazione dei collaudi dai documenti owner.

La struttura allora prevista per l’area dedicata alle validazioni storiche era:

```txt
README.md
YYYY-MM-DD-<area>-<sha-breve>.md
```

I campi indicati al checkpoint comprendevano:

- data;
- SHA;
- ambiente;
- passaggi;
- risultato atteso e reale;
- finding;
- matrice;
- limiti;
- stato finale.

### 16.2 Promemoria UI non prioritari

Al checkpoint erano stati registrati come backlog futuro:

- piccole correzioni e rimozioni UI;
- revisione responsive di form, sidebar, dashboard, card e modali.

Queste voci restano parte della fotografia storica del processo.

Non devono essere usate da questo documento per dedurre:

- priorità corrente;
- stato corrente delle relative task;
- implementazione già presente;
- nuovo lavoro da aprire.

Per lo stato operativo corrente prevalgono la Todo e le schede owner pertinenti.

---

## 17. Audit storico dei materiali locali non canonici

### 17.1 Backlog operativo da sintetizzare — fotografia storica

Il backlog da 9756 righe conteneva nove task storiche.

La tabella seguente conserva **lo stato registrato al checkpoint**, non lo stato corrente:

| Task                       | Stato al checkpoint                                     | Destinazione allora prevista |
| -------------------------- | ------------------------------------------------------- | ---------------------------- |
| 1 — sicurezza diagnostica  | realizzata, D17 riaperta parzialmente                   | D17, SECURITY e IMPL-007     |
| 2 — launcher               | realizzata con limiti                                   | D9 e validation future       |
| 3 — retention              | realizzata con limiti                                   | D18, CLEANUP-002 e IMPL-011  |
| 4 — fixture/replay         | ancora valida                                           | nuova IMPL-012               |
| 5 — strategie/segnali      | sostituita come UI live; principi ancora validi offline | ampliare IMPL-010            |
| 6 — integrity/recovery     | realizzata                                              | D12–D15 e archivio           |
| 7 — concorrenza/sessioni   | ancora valida e urgente                                 | ampliare IMPL-006            |
| 8 — baseline/observability | ancora valida                                           | nuova IMPL-013               |
| 9 — ottimizzazione Betfair | futura e condizionata                                   | nuova IMPL-014               |

Interpretazione obbligatoria:

```txt
"Stato al checkpoint"
≠ stato corrente della Todo
≠ prova di implementazione sullo stato corrente
≠ task da riaprire automaticamente
```

Per lo stato corrente usare `todo-list-tennis-decision-ui.md` e le relative schede owner.

### 17.2 Informazioni raccolte per il consolidamento

Dal prompt di navigazione erano stati estratti principi come:

- non dividere file solo perché lunghi;
- separare per responsabilità, stato, side effect e contratto;
- conservare facade e entry point pubblici;
- distinguere funzioni pure, adapter, stato e orchestrazione;
- test unitari, integrazione, sicurezza e recovery separati;
- helper locali al modulo;
- runner generale privo di logica di dominio;
- pacchetto minimo di contesto;
- futura test map `.md`.

Dal backlog erano state estratte idee e requisiti come:

- schema fixture versionato;
- cursore storico senza dati futuri;
- tie-breaker deterministico;
- acquisition identity dei Graph;
- generation/session/command identity;
- controllo stale immediatamente prima dell'effetto mutante;
- baseline p50/p95 e richieste remote;
- ottimizzazione una fase per volta;
- feature flag e rollback;
- versione, provenance e reason per gli studi strategici offline;
- invariante single-writer della persistenza.

Questa sezione registra la provenienza concettuale del consolidamento.

Non prova che ogni voce sia oggi implementata: alcune possono essere state realizzate, modificate, rinviate o superate. Lo stato tecnico corrente appartiene al codice, ai test e agli owner pertinenti.

### 17.3 Guardrail del checkpoint

Nel checkpoint erano stati registrati questi divieti:

- non togliere intere cartelle da `.gitignore`;
- non pubblicare automaticamente i planning originali;
- non copiare il backlog nella Todo;
- non trasformare ogni scenario del backlog in una task;
- non usare i prompt storici per modificare il codice corrente;
- non eliminare il report Source Identity prima di averne estratto la prova live;
- non iniziare l'ottimizzazione Betfair prima di session isolation, fixture e baseline.

Le voci legate a passaggi ormai conclusi restano come storia del processo e non come gate operativo perpetuo.

Restano invece valide, per interpretare questo record, due regole generali:

1. prompt, backlog e report storici non sono authority del comportamento corrente;
2. una classificazione storica di cleanup non autorizza la rimozione di materiali correnti.

Per il materiale non canonico preservato prevalgono le convenzioni correnti: non viene eliminato tramite cleanup generico e una rimozione richiede una task esplicita con lista esatta dei file.