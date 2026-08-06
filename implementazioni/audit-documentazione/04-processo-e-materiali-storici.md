## 16. Decisioni documentali e materiali di processo

### 16.1 `context-selection.mdx`

Il documento corrente conserva principi utili:

- minimo contesto sufficiente;
- file modificabili e consultabili separati;
- owner del modulo;
- massimo tre tentativi;
- esclusione di dati sensibili;
- test mirati;
- report post-task.

Non deve essere convertito uno-a-uno.

La nuova struttura deve separare:

```txt
ruoli e flusso
→ implementazioni/07-workflow-esecutivo.md

istruzioni per chat e AI
→ implementazioni/08-linee-guida-chat-e-ai.md

documentazione canonica futura
→ file .md dedicati, dopo la migrazione
```

Sono superate come regole generali:

- obbligo di usare Repomix per ogni esecuzione;
- divieto assoluto di leggere test invariati quando la diagnosi richiede il test;
- template unico valido per qualunque esecutore;
- assunzione che l’esecutore possa sempre modificare localmente.

### 16.2 `docs/_work`

Materiali individuati nelle copie disponibili:

```txt
01-documentation-impact-request.md
change-brief.md
percorsi.txt
```

Classificazione:

| Materiale | Classificazione | Decisione |
| --- | --- | --- |
| documentation impact request | `DUPLICATA ALTROVE` | assorbire nel prompt e nel report della task |
| change brief | `DUPLICATA ALTROVE` | conservarne i campi utili nel workflow |
| percorsi.txt | `SUPERATA` | sostituito da GitHub read-only, repository map e documenti owner |

Campi utili da preservare:

- obiettivo;
- file modificati;
- comportamento cambiato;
- contratti coinvolti;
- test e risultati;
- impatto documentale;
- documenti da aggiornare;
- link da verificare;
- fuori scope.

Non ricreare `_work` come procedura obbligatoria.

### 16.3 Formato dei documenti

Decisione definitiva:

```txt
estensione .md
→ Markdown ordinario
→ titoli, sezioni, tabelle, blocchi di codice e link relativi
→ ordine tramite prefissi numerici e indice esplicito
```

Non usare per default:

- `export const meta`;
- import o componenti JSX;
- sintassi MDX;
- frontmatter YAML.

Il frontmatter potrà essere introdotto soltanto se verrà dimostrato un consumer tecnico reale che ne ha bisogno.

### 16.4 Collaudi

I collaudi non devono essere mescolati ai documenti owner.

Struttura futura approvata:

```txt
docs/validations/
├── README.md
└── YYYY-MM-DD-<area>-<sha-breve>.md
```

Ogni report deve indicare:

- data;
- SHA;
- ambiente;
- passaggi;
- risultato atteso e reale;
- finding;
- matrice;
- limiti;
- stato finale.

### 16.5 Promemoria UI non prioritari

Sono registrati come backlog futuro, non come parte del checkpoint corrente:

- piccole correzioni e rimozioni UI;
- revisione responsive di form, sidebar, dashboard, card e modali.

---

## 17. Audit completo dei materiali locali in `docs/` fuori da `tennis-decision-ui`

### 17.1 Inventario ricevuto

| Percorso | Righe | SHA-256 |
| --- | ---: | --- |
| `Prompt/Navigazione del repository e modularizzazione di codice e test.txt` | 295 | `d8b0438c0941dadfee4d8087866b4e465d63ad66c5bbf5d8a873c732c76c483e` |
| `_work/01-documentation-impact-request.md` | 70 | `e8c6442fb5897156a2159f5dfb5d4300cfd93307bfb039f0cced9fbf889425bf` |
| `_work/change-brief.md` | 58 | `3b31feab5f01ab9f62f7fe829a5700559a9870348b179810c0fc359ab2cc6bec` |
| `legacy/briefs/task-1b-source-identity-frontend-closure-brief.md` | 113 | `7a5dd0c6fa68344bee6f3e71c1b397cfd0259943986cf8771f4e47aa44fb0336` |
| `percorsi.txt` | 230 | `a56b16483b55c505877de5f4c6e23d6623aff659a9887bbcff7043619325d009` |
| `planning/04-07-2026 backlog-operativo.md` | 9756 | `05eeb9e3ab59864b80a3bdedf4c8153c785a3c3b3b70179476e41298e5e54033` |
| `planning/05-07-2026 - Task 6 - Pacchetto prompt esecutivi.md` | 5654 | `c23c135e939f3e46ba94ac2407fde8dd72ce71abf467e4862b40cc0c61465f32` |
| `planning/05-07-2026 - Task 6 - Report di verifica.md` | 572 | `71730af1835f18e0b986f12f9dfac1974fbbfbd9cfc3ff2a1ae1aee5aa0a8b9a` |
| `planning/14-07-2026 - Task 2 - Pacchetto prompt esecutivi.md` | 744 | `1f05c68b4bd524c62417b90a089ea6f4261068ed7d8a04cdb8a1f98c0e12b01d` |

Correzione dell’inventario precedente:

```txt
numero reale dei file
→ 9
```

### 17.2 Classificazione definitiva

| File | Classificazione | Azione consigliata |
| --- | --- | --- |
| Prompt navigazione/modularizzazione | `SINTETIZZARE + DEPRECARE` | assorbire in guida AI e matrice test; poi rimuovere dalla cartella attiva |
| `_work/01-documentation-impact-request.md` | `DEPRECARE` | campi assorbiti nel workflow; nessun valore storico autonomo |
| `_work/change-brief.md` | `SINTETIZZARE + DEPRECARE` | mantenere i campi nel report task; poi rimuovere |
| Brief Source Identity legacy | `ARCHIVIARE TEMPORANEAMENTE` | trasferire le prove live in un report validation con data/SHA; poi eliminare il duplicato |
| `percorsi.txt` | `DEPRECARE DOPO MIGRAZIONE` | non usare come mappa corrente; eliminare dopo il nuovo indice `.md` |
| backlog operativo 04-07 | `SINTETIZZARE + ARCHIVIARE` | assorbire task future nei registri; conservare solo come piano storico |
| pacchetto prompt Task 6 | `ARCHIVIARE` | non usarlo come contratto corrente |
| report Task 6 | `ARCHIVIARE COME VALIDAZIONE INTERMEDIA` | conservare con nota che molti finding furono risolti successivamente |
| pacchetto prompt Task 2 | `ARCHIVIARE` | D9 resta l’autorità sintetica sullo stato attuale |

### 17.3 Materiali deprecabili

Possono essere rimossi dalla cartella di lavoro dopo il checkpoint e dopo una verifica locale finale:

```txt
_work/01-documentation-impact-request.md
_work/change-brief.md
Prompt/Navigazione del repository e modularizzazione di codice e test.txt
```

Motivo:

- il metodo è stato incorporato nei registri;
- le versioni locali introducono un secondo workflow concorrente;
- contengono riferimenti `.mdx` e assunzioni precedenti al collegamento GitHub;
- non costituiscono evidenza storica di una modifica al prodotto.

### 17.4 Materiali da mantenere soltanto fino alla migrazione

```txt
percorsi.txt
```

Il file è una copia manuale della struttura canonica e contiene riferimenti destinati a cambiare:

- `.mdx`;
- Strategy;
- mappa dei documenti attuale;
- vecchia selezione del contesto.

Non deve essere ampliato.

Dopo la creazione del nuovo indice `.md` e del repository map aggiornato può essere eliminato senza archivio separato.

### 17.5 Materiali da archiviare

```txt
legacy/briefs/task-1b-source-identity-frontend-closure-brief.md
planning/05-07-2026 - Task 6 - Pacchetto prompt esecutivi.md
planning/05-07-2026 - Task 6 - Report di verifica.md
planning/14-07-2026 - Task 2 - Pacchetto prompt esecutivi.md
```

Il brief Source Identity contiene prove live ancora utili, ma include anche la simulazione rimossa. Deve essere trasformato in un report validation, non mantenuto come brief operativo.

I due pacchetti prompt descrivono la costruzione delle task, non lo stato corrente.

Il report Task 6 documenta verifiche intermedie reali e va conservato con etichetta:

```txt
VALIDAZIONE INTERMEDIA
→ finding successivamente risolti
→ non usare per descrivere il codice corrente
```

### 17.6 Backlog operativo da sintetizzare

Il backlog da 9756 righe contiene nove task storiche.

Classificazione per task:

| Task | Stato attuale | Destinazione |
| --- | --- | --- |
| 1 — sicurezza diagnostica | realizzata, D17 riaperta parzialmente | D17, SECURITY e IMPL-007 |
| 2 — launcher | realizzata con limiti | D9 e validation future |
| 3 — retention | realizzata con limiti | D18, CLEANUP-002 e IMPL-011 |
| 4 — fixture/replay | ancora valida | nuova IMPL-012 |
| 5 — strategie/segnali | sostituita come UI live; principi ancora validi offline | ampliare IMPL-010 |
| 6 — integrity/recovery | realizzata | D12–D15 e archivio |
| 7 — concorrenza/sessioni | ancora valida e urgente | ampliare IMPL-006 |
| 8 — baseline/observability | ancora valida | nuova IMPL-013 |
| 9 — ottimizzazione Betfair | futura e condizionata | nuova IMPL-014 |

### 17.7 Informazioni assorbite nei registri

Dal prompt di navigazione:

- non dividere file solo perché lunghi;
- separare per responsabilità, stato, side effect e contratto;
- conservare facade e entry point pubblici;
- distinguere funzioni pure, adapter, stato e orchestrazione;
- test unitari, integrazione, sicurezza e recovery separati;
- helper locali al modulo;
- runner generale privo di logica di dominio;
- pacchetto minimo di contesto;
- futura test map `.md`.

Dal backlog:

- schema fixture versionato;
- cursore storico senza dati futuri;
- tie-breaker deterministico;
- acquisition identity dei Graph;
- generation/session/command identity;
- controllo stale immediatamente prima dell’effetto mutante;
- baseline p50/p95 e richieste remote;
- ottimizzazione una fase per volta;
- feature flag e rollback;
- versione, provenance e reason per gli studi strategici offline;
- invariante single-writer della persistenza.

### 17.8 Cosa non fare

- non togliere intere cartelle da `.gitignore`;
- non pubblicare automaticamente i planning originali;
- non copiare il backlog nella Todo;
- non trasformare ogni scenario del backlog in una task;
- non usare i prompt storici per modificare il codice corrente;
- non eliminare il report Source Identity prima di averne estratto la prova live;
- non iniziare l’ottimizzazione Betfair prima di session isolation, fixture e baseline.
