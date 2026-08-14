## 16. Decisioni documentali e materiali di processo

> **Checkpoint storico:** le sezioni 16–17 conservano le decisioni e gli inventari che hanno preparato la migrazione documentale. Le formulazioni al futuro, le classificazioni e gli stati riportati nelle tabelle appartengono a quel checkpoint e non costituiscono backlog o authority corrente.
>
> **Esito successivo:** la documentazione canonica corrente è sotto `docs/tennis-decision-ui/`, le validazioni storiche sono sotto `docs/validations/` e `docs/archive/` esiste come area non canonica separata. I vecchi percorsi `docs/_work`, `docs/planning`, `docs/percorsi.txt` e le destinazioni proposte `implementazioni/07-workflow-esecutivo.md` e `implementazioni/08-linee-guida-chat-e-ai.md` non descrivono la struttura corrente.
>
> `DEC-026`, `DEC-027` e `docs/validations/documentation-migration-finalization-2026-08-03.md` restano record della fase di migrazione e del relativo cleanup. In particolare, `DEC-027` non va usata per negare l'esistenza corrente di `docs/archive/`: nella struttura corrente la directory esiste di nuovo ed è regolata dalle convenzioni documentali correnti.

### 16.1 `context-selection.mdx`

Al checkpoint il documento conservava principi ritenuti utili:

- minimo contesto sufficiente;
- file modificabili e consultabili separati;
- owner del modulo;
- massimo tre tentativi;
- esclusione di dati sensibili;
- test mirati;
- report post-task.

La decisione storica era di non convertirlo uno-a-uno.

La separazione proposta al checkpoint era:

```txt
ruoli e flusso
→ implementazioni/07-workflow-esecutivo.md

istruzioni per chat e AI
→ implementazioni/08-linee-guida-chat-e-ai.md

documentazione canonica futura
→ file .md dedicati, dopo la migrazione
```

Erano già considerate superate come regole generali:

- obbligo di usare Repomix per ogni esecuzione;
- divieto assoluto di leggere test invariati quando la diagnosi richiede il test;
- template unico valido per qualunque esecutore;
- assunzione che l'esecutore possa sempre modificare localmente.

#### Esito successivo

La separazione concettuale è stata mantenuta, ma non nei due percorsi `implementazioni/07` e `implementazioni/08` proposti al checkpoint.

Gli owner correnti pertinenti sono:

```txt
selezione del contesto
→ docs/tennis-decision-ui/ai/01-context-selection.md

convenzioni documentali
→ docs/tennis-decision-ui/ai/02-documentation-conventions.md

ruoli, lifecycle, massimo tre tentativi e criteri di chiusura
→ docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
```

Il record storico conserva quindi il motivo della separazione, mentre le regole operative correnti appartengono agli owner sopra indicati.

### 16.2 `docs/_work`

Al checkpoint erano state individuate copie locali o temporanee riconducibili a:

```txt
01-documentation-impact-request.md
change-brief.md
percorsi.txt
```

Classificazione al checkpoint:

| Materiale                    | Classificazione al checkpoint | Decisione al checkpoint                                                              |
| ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| documentation impact request | `DUPLICATA ALTROVE`           | assorbire nel prompt e nel report della task                                         |
| change brief                 | `DUPLICATA ALTROVE`           | conservarne i campi utili nel workflow                                               |
| percorsi.txt                 | `SUPERATA`                    | sostituire la mappa manuale con navigazione GitHub, repository map e documenti owner |

Campi ritenuti utili da preservare:

- obiettivo;
- file modificati;
- comportamento cambiato;
- contratti coinvolti;
- test e risultati;
- impatto documentale;
- documenti da aggiornare;
- link da verificare;
- fuori scope.

La decisione era di non ricreare `_work` come procedura obbligatoria.

#### Esito successivo

Nel tree `docs/` della struttura corrente non sono presenti `docs/_work`, `docs/planning` o `docs/percorsi.txt`.

I concetti utili relativi a scope, file, controlli, report e impatto documentale sono oggi distribuiti negli owner AI, in particolare:

- `docs/tennis-decision-ui/ai/01-context-selection.md`;
- `docs/tennis-decision-ui/ai/02-documentation-conventions.md`;
- `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`.

L'assenza dei vecchi path è quindi un esito della migrazione, non un'istruzione a ricrearli.

### 16.3 Formato dei documenti

Decisione al checkpoint:

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

Il checkpoint lasciava aperta la possibilità di introdurre frontmatter soltanto in presenza di un consumer tecnico reale.

#### Esito successivo

La convenzione è diventata corrente.

`docs/tennis-decision-ui/ai/02-documentation-conventions.md` stabilisce per la documentazione canonica:

- estensione `.md`;
- Markdown ordinario;
- nessun `export const meta`;
- nessun frontmatter predefinito;
- ordine e navigazione tramite struttura, indice e nomi dei file.

La migrazione MDX → Markdown è registrata come conclusa. Questo documento conserva la decisione originaria, ma non è l'owner corrente delle convenzioni.

### 16.4 Collaudi

Al checkpoint fu approvata la separazione dei collaudi dai documenti owner.

La struttura allora prevista era:

```txt
docs/validations/
├── README.md
└── YYYY-MM-DD-<area>-<sha-breve>.md
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

#### Esito successivo

`docs/validations/` esiste nella struttura corrente ed è una radice documentale distinta.

`docs/validations/README.md` definisce oggi le validazioni come evidenze storiche legate a una specifica esecuzione e richiede metadati quali:

- data;
- baseline o SHA;
- ambiente;
- scopo;
- comandi o azioni;
- risultati osservati;
- scenari non osservati;
- artefatti disponibili;
- limiti;
- run identity.

Il pattern di nome file ipotizzato al checkpoint non va interpretato come regola corrente rigida: l'owner attuale è `docs/validations/README.md`.

### 16.5 Promemoria UI non prioritari

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

## 17. Audit storico dei materiali locali in `docs/` fuori da `tennis-decision-ui`

### 17.1 Inventario ricevuto al checkpoint

L'inventario ricostruito al checkpoint comprendeva nove materiali:

| Percorso storico                                                            | Righe | SHA-256                                                            |
| --------------------------------------------------------------------------- | ----: | ------------------------------------------------------------------ |
| `Prompt/Navigazione del repository e modularizzazione di codice e test.txt` | 295   | `d8b0438c0941dadfee4d8087866b4e465d63ad66c5bbf5d8a873c732c76c483e` |
| `_work/01-documentation-impact-request.md`                                  | 70    | `e8c6442fb5897156a2159f5dfb5d4300cfd93307bfb039f0cced9fbf889425bf` |
| `_work/change-brief.md`                                                     | 58    | `3b31feab5f01ab9f62f7fe829a5700559a9870348b179810c0fc359ab2cc6bec` |
| `legacy/briefs/task-1b-source-identity-frontend-closure-brief.md`           | 113   | `7a5dd0c6fa68344bee6f3e71c1b397cfd0259943986cf8771f4e47aa44fb0336` |
| `percorsi.txt`                                                              | 230   | `a56b16483b55c505877de5f4c6e23d6623aff659a9887bbcff7043619325d009` |
| `planning/04-07-2026 backlog-operativo.md`                                  | 9756  | `05eeb9e3ab59864b80a3bdedf4c8153c785a3c3b3b70179476e41298e5e54033` |
| `planning/05-07-2026 - Task 6 - Pacchetto prompt esecutivi.md`              | 5654  | `c23c135e939f3e46ba94ac2407fde8dd72ce71abf467e4862b40cc0c61465f32` |
| `planning/05-07-2026 - Task 6 - Report di verifica.md`                      | 572   | `71730af1835f18e0b986f12f9dfac1974fbbfbd9cfc3ff2a1ae1aee5aa0a8b9a` |
| `planning/14-07-2026 - Task 2 - Pacchetto prompt esecutivi.md`              | 744   | `1f05c68b4bd524c62417b90a089ea6f4261068ed7d8a04cdb8a1f98c0e12b01d` |

Correzione dell'inventario precedente:

```txt
numero reale dei file
→ 9
```

I percorsi della tabella sono storici. Non rappresentano l'inventario corrente di `docs/`.

### 17.2 Classificazione al checkpoint

| File                                       | Classificazione al checkpoint            | Azione prevista al checkpoint                                                                     |
| ------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Prompt navigazione/modularizzazione        | `SINTETIZZARE + DEPRECARE`               | assorbire in guida AI e matrice test; poi rimuovere dalla cartella attiva                         |
| `_work/01-documentation-impact-request.md` | `DEPRECARE`                              | assorbire i campi nel workflow; nessun valore storico autonomo                                    |
| `_work/change-brief.md`                    | `SINTETIZZARE + DEPRECARE`               | mantenere i campi nel report task; poi rimuovere                                                  |
| Brief Source Identity legacy               | `ARCHIVIARE TEMPORANEAMENTE`             | trasferire le prove live in una validation con data/SHA; poi eliminare il duplicato               |
| `percorsi.txt`                             | `DEPRECARE DOPO MIGRAZIONE`              | non usare come mappa corrente; eliminare dopo il nuovo indice `.md`                               |
| backlog operativo 04-07                    | `SINTETIZZARE + ARCHIVIARE`              | assorbire task future nei registri; conservare soltanto come piano storico durante la transizione |
| pacchetto prompt Task 6                    | `ARCHIVIARE`                             | non usarlo come contratto corrente                                                                |
| report Task 6                              | `ARCHIVIARE COME VALIDAZIONE INTERMEDIA` | conservare l'evidenza utile senza promuovere i finding storici a stato corrente                   |
| pacchetto prompt Task 2                    | `ARCHIVIARE`                             | usare i registri sintetici come riferimento corrente, non il pacchetto operativo                  |

Queste classificazioni spiegano la decisione presa allora. Non sono azioni ancora aperte automaticamente.

### 17.3 Materiali deprecabili al checkpoint

Erano stati classificati come rimovibili dalla superficie di lavoro, dopo il checkpoint e una verifica locale finale:

```txt
_work/01-documentation-impact-request.md
_work/change-brief.md
Prompt/Navigazione del repository e modularizzazione di codice e test.txt
```

Motivazioni registrate:

- il metodo doveva essere incorporato nei registri e negli owner;
- le versioni locali avrebbero introdotto un secondo workflow concorrente;
- contenevano riferimenti `.mdx` e assunzioni precedenti al nuovo assetto documentale;
- non costituivano evidenza storica di una modifica al prodotto.

#### Esito successivo

Nel stato corrente i relativi path storici non esistono più sotto `docs/`.

Il metodo corrente vive negli owner AI; non va quindi ripristinata una seconda procedura sotto `_work` o `Prompt/`.

### 17.4 Materiale da mantenere soltanto fino alla migrazione

Al checkpoint:

```txt
percorsi.txt
```

era considerato una copia manuale e transitoria della struttura canonica, con riferimenti destinati a cambiare:

- `.mdx`;
- Strategy;
- mappa dei documenti;
- vecchia selezione del contesto.

La decisione era di non ampliarlo e di rimuoverlo dopo la disponibilità di un indice Markdown e della repository map.

#### Esito successivo

`docs/percorsi.txt` non è presente nel tree `docs/` della struttura corrente.

La documentazione corrente usa gli indici e `docs/tennis-decision-ui/reference/01-repository-map.md` come riferimenti di navigazione. Il file storico non deve essere ricreato.

### 17.5 Materiali da archiviare durante la transizione

Al checkpoint erano stati classificati per archivio:

```txt
legacy/briefs/task-1b-source-identity-frontend-closure-brief.md
planning/05-07-2026 - Task 6 - Pacchetto prompt esecutivi.md
planning/05-07-2026 - Task 6 - Report di verifica.md
planning/14-07-2026 - Task 2 - Pacchetto prompt esecutivi.md
```

La motivazione era conservare temporaneamente il valore storico senza usarlo come contratto corrente.

In particolare:

- il brief Source Identity conteneva osservazioni live utili ma anche elementi successivamente rimossi;
- i pacchetti prompt descrivevano la costruzione delle task, non il comportamento corrente;
- il report Task 6 rappresentava una verifica intermedia e non doveva descrivere il codice corrente.

#### Esito successivo

Il closeout della migrazione registra l'estrazione del contenuto ancora utile verso registri, owner e validations e la successiva rimozione delle copie legacy separate.

Nel tree corrente non esistono più i vecchi top-level `legacy/` e `planning/` sotto `docs/`.

Questo esito non significa che `docs/archive/` sia oggi vuota o inesistente: nella struttura corrente `docs/archive/` è presente con un diverso insieme di path ed è definita dalle convenzioni correnti come area non canonica preservata intenzionalmente. I materiali attuali di `docs/archive/` non devono essere riclassificati o rimossi sulla base delle decisioni storiche di questa sezione.

### 17.6 Backlog operativo da sintetizzare — fotografia storica

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

### 17.7 Informazioni raccolte per il consolidamento

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

### 17.8 Guardrail del checkpoint

Durante la fase di migrazione erano stati registrati questi divieti:

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

Per `docs/archive/` prevalgono le convenzioni correnti: il contenuto non canonico preservato non viene eliminato tramite cleanup generico e una rimozione richiede una task esplicita con lista esatta dei file.

### 17.9 Esito della migrazione documentale

Il rapporto tra checkpoint storico ed esito successivo può essere riassunto così:

| Tema                              | Decisione/proposta al checkpoint                                    | Esito corrente                                                                 |
| --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| selezione del contesto            | non convertire `context-selection.mdx` uno-a-uno                    | owner corrente in `docs/tennis-decision-ui/ai/01-context-selection.md`         |
| workflow                          | separare ruoli e flusso                                             | owner corrente in `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`        |
| convenzioni                       | Markdown ordinario `.md`                                            | owner corrente in `docs/tennis-decision-ui/ai/02-documentation-conventions.md` |
| `implementazioni/07` e `08`       | destinazioni proposte                                               | non presenti nella struttura corrente                                          |
| `docs/_work`                      | deprecare dopo assorbimento                                         | non presente nel tree `docs/`                                                  |
| `docs/percorsi.txt`               | mantenere solo fino alla nuova mappa                                | non presente nel tree `docs/`                                                  |
| `docs/planning`                   | materiale transitorio/storico                                       | non presente nel tree `docs/`                                                  |
| validations                       | struttura futura approvata                                          | `docs/validations/` presente con README e record storici                       |
| materiali legacy della migrazione | archiviare temporaneamente, consolidare, poi rimuovere              | copie separate non presenti nei vecchi path                                    |
| `docs/archive/`                   | usata durante il cleanup come area temporanea per fonti consolidate | oggi presente come radice non canonica separata, con policy corrente propria   |

Questa matrice chiude la catena documentale delle sezioni 16–17:

```txt
decisioni di processo
→ classificazione dei materiali
→ migrazione e consolidamento
→ cleanup delle copie storiche
→ owner e radici documentali correnti separati dal record storico
```

Il documento resta quindi un record di processo e classificazione. Non sostituisce la Todo, gli owner tecnici, gli owner AI, le validations o la struttura reale del repository.
