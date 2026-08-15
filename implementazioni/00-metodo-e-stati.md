# Tennis Decision UI — Metodo, stati e regole della revisione

> Registro operativo non canonico. La documentazione tecnica corrente resta in `docs/`.

## 1. Scopo

Questo documento definisce il metodo operativo della revisione tecnica e documentale di **Tennis Decision UI** e il vocabolario condiviso dai registri dell'area `implementazioni/`.

Possiede:

- gerarchia delle fonti e delle prove;
- distinzione fra lifecycle del workflow, stato dell'implementazione e verifiche;
- vocabolario degli stati e dei prefissi;
- schema minimo dei diversi tipi di record;
- regole operative della revisione;
- regole di ownership e coerenza dei registri;
- confini e limiti del controllo automatico.

Le schede dettagliate dei rilievi, delle implementazioni e delle decisioni appartengono ai rispettivi file owner sotto `implementazioni/`. Questo documento ne stabilisce il metodo, ma non ne duplica il contenuto.

Non è:

- la documentazione tecnica canonica del progetto;
- una cronologia completa dei prompt già eseguiti;
- un sostituto dei documenti in `docs/tennis-decision-ui/`;
- una raccolta indistinta di idee;
- un’autorizzazione automatica a modificare il codice;
- una prova che una task sia davvero completata senza verifica sul repository;
- una lista di modifiche da eseguire tutte insieme.

La Todo operativa collegata è organizzata come:

```txt
todo-list-tennis-decision-ui.md
→ facade operativa unica

todo-list-tennis-decision-ui/*.md
→ moduli della Todo per Blocco top-level
```

La facade è l’unico entry point operativo, ma non è l’unico file fisico. I moduli mostrano lo stato sintetico senza duplicare le rispettive authority. Motivazioni, evidenze, rischi, dipendenze e criteri di chiusura restano nelle singole schede owner.

Il processo è ora in steady state Markdown. Coesistenza MDX, conversione di massa e cleanup della migrazione sono fasi storiche concluse; restano operative la separazione storico/corrente, la verifica semantica, i link strict e la coerenza dei registri.

---

## 2. Baseline e autorità temporale

Baseline storiche della revisione:

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch canonico: main
SHA iniziale esaminato: ae9766dde97de08425d65cf62fe929aece3ba6a2
SHA checkpoint audit B1–B6: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Commit checkpoint: docs: modularize project revision registers
```

Questi SHA descrivono l'avvio e un checkpoint storico dell'audit; non sono automaticamente l'autorità tecnica di una verifica successiva.

Ogni aggiornamento deve indicare esplicitamente:

```txt
SHA precedente
→ SHA nuovo esaminato
→ file o aree cambiate
→ rilievi da riconfermare
```

Lo SHA nuovo esaminato è l'autorità temporale della singola verifica. Non assumere che un rilievo resti valido dopo modifiche sostanziali al repository e non usare uno SHA storico come prova dello stato corrente.

---

## 3. Fonti e gerarchia delle prove

Ordine di attendibilità:

1. codice effettivamente presente sul branch canonico;
2. test automatici presenti e realmente eseguibili;
3. collaudi live documentati con evidenza sufficiente;
4. documentazione tecnica owner del modulo;
5. roadmap, brief, note di task e report storici;
6. inferenze da nomi di file o descrizioni generiche.

Regole:

- il codice prevale sulla documentazione quando i due divergono;
- un test presente ma non eseguito non equivale a una validazione corrente;
- un report storico non prova che il comportamento esista ancora;
- una task dichiarata completata deve essere ricontrollata sullo stato attuale;
- un dubbio non deve essere promosso a errore senza evidenza;
- una proposta utile non deve essere confusa con un requisito approvato;
- le decisioni strutturali o di prodotto appartengono all’utente.

La gerarchia non comprime dimensioni indipendenti in un solo stato. Per ogni claim rilevante registrare separatamente:

```txt
workflow lifecycle      → planned / approved / in execution / completed
implementation state   → absent / partial / implemented
offline verification   → not executed / passed / failed / blocked
live verification      → not applicable / not executed / live_observed
provenance              → baseline, data, ambiente e artifact; oppure non registrato
```

Una task può quindi essere implementata ma non verificata live, oppure avere evidenza storica positiva senza essere confermata sulla working tree corrente.

---

## 4. Stati dei rilievi

Ogni rilievo usa uno dei seguenti stati:

| Stato             | Significato                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `DA VERIFICARE`   | Osservazione preliminare non ancora dimostrata                    |
| `IN VERIFICA`     | Controllo in corso su codice, test e documenti                    |
| `CONFERMATO`      | Discrepanza o necessità dimostrata                                |
| `DA DECIDERE`     | Esistono più soluzioni ragionevoli o serve una scelta dell’utente |
| `APPROVATO`       | L’utente ha approvato l’azione proposta                           |
| `PRONTO PER TASK` | Perimetro, file, test e criteri sono definiti                     |
| `IN ESECUZIONE`   | Una task separata è stata avviata                                 |
| `COMPLETATO`      | Modifica verificata e chiusa                                      |
| `SCARTATO`        | Il rilievo non richiede più azione                                |
| `RINVIATO`        | Valido, ma non prioritario                                        |
| `FUTURO`          | Dipende da fasi non ancora disponibili                            |

---

## 5. Classificazione dei rilievi

Prefissi stabili:

| Prefisso    | Categoria                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| `DOC-`      | Errori, duplicazioni, obsolescenza o struttura documentale                  |
| `CODE-`     | Difetti o incoerenze nel codice                                             |
| `DATA-`     | Provenance, timestamp, identità e qualità dei dati acquisiti                |
| `TEST-`     | Copertura, test non eseguiti, test mancanti o test obsoleti                 |
| `RUNTIME-`  | Launcher, processi, porte, CDP, lifecycle e shutdown                        |
| `SOFA-`     | Acquisizione e tracking SofaScore                                           |
| `BETFAIR-`  | Acquisizione, health, Graph URL, ladder e lifecycle Betfair                 |
| `STORAGE-`  | History, timeline, journal, recovery e integrity                            |
| `EVIDENCE-` | Match Evidence, Source Identity e Market Reactions                          |
| `FRONTEND-` | Shell, polling, view model e componenti                                     |
| `SCRAPER-`  | Package Python, CLI e compatibilità wrapper                                 |
| `PYTHON-`   | Concorrenza, task asincrone e comportamento interno dei package Python      |
| `SECURITY-` | Redazione, superfici pubbliche, path locali e dati potenzialmente sensibili |
| `CLEANUP-`  | File legacy, codice morto, duplicazioni e materiali non canonici            |
| `WORKFLOW-` | Metodo operativo, ruoli, prompt, Git e revisione                            |
| `IMPL-`     | Implementazione utile individuata durante l’audit                           |
| `FUTURE-`   | Evoluzione non ancora autorizzata o dipendente da altre fasi                |

Gli ID non devono essere rinumerati. Se un rilievo viene scartato, il suo ID resta riservato.

---

## 6. Schema minimo dei record

Le schede storiche conservano la propria forma. Per nuovi record si applica un minimo realistico per tipo:

| Tipo                                            | Campi minimi                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `DOC-*`, `WORKFLOW-*`, `CODE-*` e altri finding | ID, titolo, stato, priorità, evidenza, azione, verifica e criterio di chiusura |
| `IMPL-*`                                        | ID, stato, obiettivo, dipendenze, perimetro, test e criterio di chiusura       |
| `TEST-*`                                        | ID, stato, contratto verificato, comando/harness, risultato o limite           |
| `DEC-*`                                         | ID, stato, decisione, conseguenze e riferimenti superseded                     |

I campi estesi seguenti restano consigliati quando utili, ma non sono imposti retroattivamente a ogni scheda storica:

```txt
ID
Titolo
Stato
Classificazione
Priorità
Area
Fonte o evidenza
Codice coinvolto
Documenti coinvolti
Osservazione
Motivo
Impatto
Cosa mantenere
Cosa eliminare
Cosa riscrivere
Cosa spostare
Cosa controllare ancora
Rischi
Alternative
Decisione richiesta
Dipendenze
Azione proposta
Test o controlli necessari
Criterio di chiusura
```

Quando un campo non è applicabile, indicare `non applicabile` invece di ometterlo.

---

## 7. Regole operative della revisione

### 7.1 Separazione delle fasi

La revisione procede così:

```txt
orientamento
→ inventario
→ confronto documentazione → codice
→ confronto codice → documentazione
→ classificazione dei rilievi
→ decisioni dell’utente
→ task esecutive separate
→ revisione delle modifiche
→ eventuale collaudo indipendente
→ pubblicazione Git eseguita dall’utente
```

### 7.2 Regole minime

- una sola area o task verificabile per volta;
- nessun refactor fuori scope;
- nessuna modifica automatica durante l’audit;
- massimo tre tentativi ragionati per ogni prompt esecutivo;
- file modificabili e file consultabili separati;
- test tecnici mirati;
- report finale obbligatorio;
- nessun commit o push eseguito dall’esecutore;
- commit e push effettuati dall’utente dopo revisione;
- branch e pull request soltanto quando approvati;
- non dichiarare una task completata soltanto perché esiste un file o un test;
- non modificare flussi funzionanti senza una ragione dimostrata;
- non inventare payload, dati live, risultati o copertura;
- non trasformare una validazione mancante in un difetto certo;
- non confondere codice legacy ancora usato con codice morto.

### 7.3 Decisioni dell’utente

Quando emergono:

- ambiguità;
- più soluzioni tecnicamente valide;
- trade-off strutturali;
- scelte di prodotto;
- differenze fra il metodo di Tennis Decision UI e quello dell’altro progetto;

la revisione deve:

1. esporre il dubbio con precisione;
2. descrivere le alternative;
3. mostrare conseguenze e rischi;
4. formulare domande mirate;
5. attendere l’indicazione strutturale e decisionale dell’utente.

Non scegliere arbitrariamente.


### 7.4 Formato corrente dei documenti tecnici

Decisione dell’utente:

```txt
tutti i nuovi documenti tecnici devono usare estensione .md
non creare nuovi documenti .mdx
```

La migrazione è conclusa. Per nuovi documenti o modifiche correnti:

- produrre file Markdown con estensione `.md`;
- sostituire le funzionalità specifiche MDX con sintassi Markdown compatibile;
- non copiare automaticamente `export const meta`, JSX, import o componenti MDX dentro file `.md`;
- verificare prima il loader, il generatore o il sistema che legge `docs/`;
- preservare metadata, ordine, titolo e navigazione nella forma Markdown adottata dal progetto;
- mantenere i link interni coerenti con i percorsi effettivi;
- evitare copie canoniche parallele dello stesso documento;
- non reintrodurre una copia `.mdx` parallela;
- trattare le istruzioni di coesistenza e conversione di massa come procedura storica, non come flusso ordinario.

La decisione di formato è applicata; ogni nuova migrazione eccezionale richiede un perimetro separato.

### 7.5 Trattamento delle fonti storiche

La mappa di provenienza è stata assorbita nel closeout della migrazione e nei registri. `docs/archive/README.md` e la directory archive non sono presenti nello stato corrente; una futura archive richiede una decisione nuova (`DEC-027`).

Regola:

```txt
fonte storica
→ confronto con codice e registri
→ assorbimento dei contenuti unici
→ controllo link
→ rimozione della copia
```

Le fonti storiche non devono essere lette in blocco nella fase iniziale di una
task, né considerate prova di comportamento corrente. Un report con evidenza
irripetibile può restare in `docs/validations/`; un backlog duplicato no.

Ordine approvato:

```txt
1. documentazione canonica corrente
2. codice corrente
3. test e collaudi
4. discrepanze rilevate
5. docs/planning come fonte storica e progettuale separata
```

Quando una fonte di `docs/planning` viene riesaminata, ogni voce pertinente deve essere classificata come:

```txt
SUPERATA
REALIZZATA
PARZIALMENTE REALIZZATA
ANCORA VALIDA
FUTURA
DA DECIDERE
DUPLICATA ALTROVE
NON PIÙ PERTINENTE
```

`docs/planning` non è fonte primaria dello stato attuale. Può essere usata per:

- recuperare requisiti utili non confluiti nella documentazione canonica;
- verificare task dichiarate completate;
- individuare implementazioni rimaste incompiute;
- distinguere decisioni abbandonate da evoluzioni ancora valide;
- preservare informazioni importanti prima di eventuale archiviazione o cleanup.

La lettura deve avvenire per gruppi tematici e non come caricamento indiscriminato dell’intera cartella.


### 7.6 Modalità di riscrittura e consegna dei documenti

Per la riscrittura di un documento, la modalità preferita è:

```txt
file completo sostitutivo
→ download
→ inserimento manuale dell’utente
→ verifica
→ eventuale sostituzione o rimozione del vecchio file soltanto dopo il controllo
```

Evitare, quando possibile:

- patch parziali molto grandi;
- comandi terminale che modificano decine di documenti;
- sostituzioni regex non revisionate;
- rinomina automatica di massa senza conversione della sintassi;
- richieste esecutive che devono ricostruire il contenuto completo da frammenti.

Per una singola area, la consegna deve includere soltanto gli artefatti richiesti dal perimetro:

```txt
file .md completi
+ elenco dei percorsi interessati, se necessario
+ link da aggiornare, se presenti
+ controlli eseguiti e limiti
```

Un manifest di migrazione e un archivio che preserva la struttura sono richiesti soltanto quando il perimetro comprende più file o una directory completa. Non appartengono alla consegna ordinaria di un singolo documento.

Esempio per una migrazione multi-file:

```txt
docs-tennis-decision-ui-md/
├── MIGRATION-MANIFEST.md
└── docs/
    └── tennis-decision-ui/
        └── <struttura finale .md>
```

Il manifest deve indicare per ogni file:

```txt
percorso precedente
→ percorso nuovo
→ azione: sostituire / riscrivere / spostare / archiviare / eliminare
→ documenti collegati da aggiornare
→ verifica necessaria
```

L’utente resta responsabile dell’inserimento nel repository e delle operazioni Git.

Questa modalità richiede comunque una revisione del contenuto completo e dei link prima di sostituire o rimuovere file esistenti.

---

### 7.7 Coerenza obbligatoria dei registri

Il checkpoint B6 ha dimostrato che un rilievo può essere presente nel registro analitico ma mancare dalla vista sintetica.

Regola aggiuntiva:

```txt
ogni ID dettagliato soggetto a parity
→ compare una sola volta nei moduli della Todo
→ compare nel BLOCCO E, `todo-list-tennis-decision-ui/06-rilievi-registrati.md`, se è un finding
→ compare nel BLOCCO F, `todo-list-tennis-decision-ui/07-implementazioni-utili.md`, se è un'implementazione
→ usa un prefisso dichiarato
→ mantiene lo stesso stato sostanziale
```

Non è necessario duplicare la scheda completa nella Todo. È però obbligatoria una riga sintetica con:

```txt
ID
→ titolo breve
→ stato
→ eventuale decisione o task ancora necessaria
```

Controlli minimi di checkpoint:

```txt
owner card ricorsive in implementazioni/**/*.md
escluse le decisioni DEC-*
→ uguali agli ID sintetici nei file canonici `06-rilievi-registrati.md` e `07-implementazioni-utili.md`

prefissi usati
→ sottoinsieme dei prefissi dichiarati

stato COMPLETATO
→ non può convivere con una Todo ancora DA VERIFICARE

ultima decisione DEC-*
→ deve essere richiamata nei registri sintetici root o Todo
```

Il controllo automatico è implementato da `IMPL-005` e deve essere eseguito prima di ogni pacchetto di checkpoint. Un esito con errori blocca la chiusura del checkpoint finché le incoerenze non sono classificate o corrette; gli eventuali warning restano distinti dagli errori.

Contratto effettivo del checker corrente:

- `todo-list-tennis-decision-ui.md` è la facade operativa unica e `todo-list-tennis-decision-ui/*.md` contiene i moduli della Todo;
- `todo-list-tennis-decision-ui/06-rilievi-registrati.md` è l’authority sintetica dei finding e `todo-list-tennis-decision-ui/07-implementazioni-utili.md` è l’authority sintetica delle `IMPL-*`;
- discovery ricorsiva delle owner card in `implementazioni/**/*.md` mediante heading Markdown con ID e titolo;
- confronto di parità fra owner card e righe sintetiche lette dai due percorsi canonici espliciti, indipendentemente dal testo completo degli heading;
- esclusione delle decisioni `DEC-*` dalla parity dei finding;
- rilevazione di duplicati owner e righe sintetiche duplicate;
- controllo dei prefissi usati nelle identità canoniche rispetto ai prefissi dichiarati in questo documento;
- vocabolario di stati riconosciuto e controllo delle contraddizioni sostanziali esplicitamente codificate;
- controlli sui metadata sintetici implementati: coerenza degli SHA esposti, range, ultimo ID `TEST-*` e `IMPL-*`, ultima decisione riassunta, ultimo Punto e prossimo passo;
- output testuale o JSON, comportamento read-only e codice di ritorno non zero in presenza di errori; `scripts/check_registry_consistency.py` non modifica facade, moduli o registri.

Il checker non prova la correttezza semantica del codice o dei documenti, non esegue le task, non valida ogni campo dello schema esteso, non pretende l'identità letterale di tutti gli stati e non sostituisce link checker, test o audit manuale.

### 7.8 Owner canonico, note e addendum

Ogni ID può avere una sola scheda owner riconoscibile dalla forma:

```txt
### <identificatore> — Titolo
```

Una scoperta iniziale, un ampliamento successivo o un riferimento trasversale non deve creare un secondo owner. Deve usare una forma esplicita che conservi l’ID senza replicare il pattern owner:

```txt
### Nota iniziale collegata a <identificatore> — Titolo
### Estensione intermedia collegata a <identificatore> — Titolo
### Riferimento audit a <identificatore> — Titolo
### Estensione approvata di <identificatore> — Titolo
```

Regole:

- la scheda owner conserva stato corrente, contratto completo e criterio di chiusura;
- note e addendum preservano evidenze, cronologia e motivazioni senza diventare owner paralleli;
- nessun ID viene rinumerato o riutilizzato;
- la normalizzazione non elimina contenuti sostanziali; modifica soltanto ownership e navigazione;
- `scripts/check_registry_consistency.py` deve restituire zero `duplicate_owner_card` prima della pubblicazione.

---
