# Tennis Decision UI — Metodo, stati e regole della revisione

> Registro operativo non canonico. La documentazione tecnica corrente resta in `docs/`.

## 1. Scopo

Questo documento è il registro analitico della revisione tecnica e documentale di **Tennis Decision UI**.

Contiene esclusivamente:

- rilievi emersi dal confronto fra repository e documentazione;
- motivazioni delle modifiche proposte;
- elementi da mantenere, eliminare, riscrivere, spostare o ricontrollare;
- verifiche ancora necessarie;
- dipendenze fra le analisi;
- decisioni richieste all’utente;
- criteri di chiusura;
- candidati per task esecutive future;
- implementazioni utili da valutare dopo l’audit.

Non è:

- la documentazione tecnica canonica del progetto;
- una cronologia completa dei prompt già eseguiti;
- un sostituto dei documenti in `docs/tennis-decision-ui/`;
- una raccolta indistinta di idee;
- un’autorizzazione automatica a modificare il codice;
- una prova che una task sia davvero completata senza verifica sul repository;
- una lista di modifiche da eseguire tutte insieme.

La Todo operativa collegata è:

```txt
todo-list-tennis-decision-ui.md
```

La Todo mostra lo stato sintetico. Questo documento conserva motivazioni, evidenze, rischi, dipendenze e criteri di chiusura.

---

## 2. Baseline del repository

Stato iniziale verificato:

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch canonico: main
SHA iniziale esaminato: ae9766dde97de08425d65cf62fe929aece3ba6a2
SHA checkpoint audit B1–B6: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Commit checkpoint: docs: modularize project revision registers
```

La revisione parte da questo SHA. Ogni aggiornamento futuro deve indicare esplicitamente:

```txt
SHA precedente
→ SHA nuovo esaminato
→ file o aree cambiate
→ rilievi da riconfermare
```

Non assumere che un rilievo resti valido dopo modifiche sostanziali al repository.

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

---

## 4. Stati dei rilievi

Ogni rilievo usa uno dei seguenti stati:

| Stato | Significato |
| --- | --- |
| `DA VERIFICARE` | Osservazione preliminare non ancora dimostrata |
| `IN VERIFICA` | Controllo in corso su codice, test e documenti |
| `CONFERMATO` | Discrepanza o necessità dimostrata |
| `DA DECIDERE` | Esistono più soluzioni ragionevoli o serve una scelta dell’utente |
| `APPROVATO` | L’utente ha approvato l’azione proposta |
| `PRONTO PER TASK` | Perimetro, file, test e criteri sono definiti |
| `IN ESECUZIONE` | Una task separata è stata avviata |
| `COMPLETATO` | Modifica verificata e chiusa |
| `SCARTATO` | Il rilievo non richiede più azione |
| `RINVIATO` | Valido, ma non prioritario |
| `FUTURO` | Dipende da fasi non ancora disponibili |

---

## 5. Classificazione dei rilievi

Prefissi stabili:

| Prefisso | Categoria |
| --- | --- |
| `DOC-` | Errori, duplicazioni, obsolescenza o struttura documentale |
| `CODE-` | Difetti o incoerenze nel codice |
| `DATA-` | Provenance, timestamp, identità e qualità dei dati acquisiti |
| `TEST-` | Copertura, test non eseguiti, test mancanti o test obsoleti |
| `RUNTIME-` | Launcher, processi, porte, CDP, lifecycle e shutdown |
| `SOFA-` | Acquisizione e tracking SofaScore |
| `BETFAIR-` | Acquisizione, health, Graph URL, ladder e lifecycle Betfair |
| `STORAGE-` | History, timeline, journal, recovery e integrity |
| `EVIDENCE-` | Match Evidence, Source Identity e Market Reactions |
| `FRONTEND-` | Shell, polling, view model e componenti |
| `SCRAPER-` | Package Python, CLI e compatibilità wrapper |
| `PYTHON-` | Concorrenza, task asincrone e comportamento interno dei package Python |
| `SECURITY-` | Redazione, superfici pubbliche, path locali e dati potenzialmente sensibili |
| `CLEANUP-` | File legacy, codice morto, duplicazioni e materiali non canonici |
| `WORKFLOW-` | Metodo operativo, ruoli, prompt, Git e revisione |
| `IMPL-` | Implementazione utile individuata durante l’audit |
| `FUTURE-` | Evoluzione non ancora autorizzata o dipendente da altre fasi |

Gli ID non devono essere rinumerati. Se un rilievo viene scartato, il suo ID resta riservato.

---

## 6. Scheda standard di ogni rilievo

Ogni voce dettagliata deve contenere:

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


### 7.4 Formato dei nuovi documenti tecnici

Decisione dell’utente:

```txt
tutti i nuovi documenti tecnici devono usare estensione .md
non creare nuovi documenti .mdx
```

La futura riscrittura della documentazione deve quindi:

- produrre file Markdown con estensione `.md`;
- sostituire le funzionalità specifiche MDX con sintassi Markdown compatibile;
- non copiare automaticamente `export const meta`, JSX, import o componenti MDX dentro file `.md`;
- verificare prima il loader, il generatore o il sistema che legge `docs/`;
- definire una forma equivalente per metadata, ordine, titolo e navigazione;
- aggiornare tutti i link interni da `.mdx` a `.md`;
- evitare che la vecchia versione `.mdx` e la nuova `.md` restino entrambe canoniche;
- mantenere temporaneamente il vecchio file soltanto durante la verifica della sostituzione;
- eliminare il vecchio `.mdx` solo dopo avere verificato contenuto, link e compatibilità.

Questa è una decisione di formato già approvata, ma la modalità tecnica di migrazione deve essere verificata sul repository prima della conversione di massa.

### 7.5 Trattamento delle fonti storiche

`docs/archive/README.md` conserva soltanto una mappa di provenienza. Backlog,
prompt e planning separati non restano nel repository dopo che i requisiti
unici sono stati assorbiti nei registri o nelle validations.

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

Quando verrà analizzata, ogni voce di `docs/planning` dovrà essere classificata come:

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

Per la riscrittura della documentazione canonica, la modalità preferita è:

```txt
file completo sostitutivo
→ download
→ inserimento manuale dell’utente
→ verifica
→ eliminazione del vecchio file
```

Evitare, quando possibile:

- patch parziali molto grandi;
- comandi terminale che modificano decine di documenti;
- sostituzioni regex non revisionate;
- rinomina automatica di massa senza conversione della sintassi;
- richieste esecutive che devono ricostruire il contenuto completo da frammenti.

Per una singola area, l’assistente deve poter produrre:

```txt
nuovi file .md completi
+ manifest di migrazione
+ elenco file .mdx da rimuovere dopo verifica
+ elenco link aggiornati
+ checklist di controllo
```

Per più file o una directory completa, la consegna consigliata è un archivio ZIP che preserva la struttura:

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

Questa modalità riduce gli errori rispetto a una patch terminale, ma richiede comunque una revisione del contenuto completo e dei link prima della rimozione dei vecchi `.mdx`.

---

## 7.7 Coerenza obbligatoria dei registri

Il checkpoint B6 ha dimostrato che un rilievo può essere presente nel registro analitico ma mancare dalla vista sintetica.

Regola aggiuntiva:

```txt
ogni ID dettagliato
→ compare nella Todo
→ compare nel BLOCCO E dei rilievi
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
ID nel registro documentazione
∪ ID nel registro codice
→ uguali agli ID sintetici della Todo

prefissi usati
→ sottoinsieme dei prefissi dichiarati

stato COMPLETATO
→ non può convivere con una Todo ancora DA VERIFICARE

ID DA DECIDERE
→ deve comparire anche nel registro decisioni quando la scelta diventa operativa
```

Il controllo automatico è implementato da `IMPL-005` e deve essere eseguito prima di ogni pacchetto di checkpoint. Un esito non verde blocca la chiusura del checkpoint finché i finding non sono classificati o corretti.

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
