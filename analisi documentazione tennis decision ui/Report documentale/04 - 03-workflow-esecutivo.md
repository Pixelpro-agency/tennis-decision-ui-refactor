# Report documentale — `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-004
Sequenza audit: 04/72
Documento analizzato: 03-workflow-esecutivo.md
Percorso documento: docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
Percorso report: Report documentale/04 - 03-workflow-esecutivo.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 484 righe
Ruolo dichiarato: workflow esecutivo permanente e criteri di chiusura
Stato report: completato
```

Il documento è stato confrontato con:

- `docs/tennis-decision-ui/ai/01-context-selection.md`;
- `docs/tennis-decision-ui/ai/02-documentation-conventions.md`;
- `docs/tennis-decision-ui/index.md`;
- `docs/tennis-decision-ui/reference/01-repository-map.md`;
- `implementazioni/00-metodo-e-stati.md`;
- `implementazioni/99-decisioni-utente.md`;
- `.gitignore`;
- la struttura corrente del repository;
- le decisioni già registrate sui quattro ruoli, sulla consegna di file completi, sui collaudi separati e sul controllo Git da parte dell’utente.

I due file mappa non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale con il progetto: ALTA NEI PRINCIPI
Contraddizioni operative interne: 2
Rischi di riproducibilità: 1
Gap di integrità del contesto: 1
Gap di verifica Git locale: 1
Informazioni tecniche false accertate: 0
Correzioni consigliate: 6
Necessità di riscrittura completa: SÌ
Necessità di modularizzazione: SÌ
Numero di responsabilità principali rilevate: 3
```

Il documento contiene principi corretti e coerenti con il metodo di lavoro dell’utente, ma non dovrebbe restare nella forma attuale.

La lunghezza non è il motivo sufficiente per dividerlo. La modularizzazione è consigliata perché il file combina tre contratti distinti:

```text
A. orchestrazione del workflow e dei ruoli
B. formato e lifecycle degli artefatti esecutivi
C. criteri tecnici di diagnosi e modularizzazione del codice
```

Questi blocchi:

- hanno contesti minimi differenti;
- vengono usati in momenti differenti;
- cambiano con frequenze differenti;
- hanno rischi e verifiche differenti;
- possono avere owner separati senza frammentare il workflow.

---

# 1. Scopo e principi

## Esito: coerente

I principi iniziali sono allineati alle decisioni del progetto:

- una task per volta;
- scope minimo verificabile;
- nessun refactor opportunistico;
- ruoli separati;
- massimo tre tentativi;
- artefatto locale per le task che modificano file;
- report separato;
- revisione prima del commit;
- commit e push eseguiti dall’utente.

La precisazione:

```text
fileModificati.md obbligatorio per ogni task che crea o modifica file
```

è corretta e più precisa della formulazione universale presente in `01-context-selection.md`.

**Modifiche necessarie:** nessuna ai principi iniziali.

---

# 2. Ruoli

## Esito: coerente

I quattro ruoli corrispondono alla decisione dell’utente:

```text
CHAT_ANALISI
CHAT_ESECUTORE
DESKTOP_ESECUTORE
DESKTOP_COLLAUDATORE
```

I confini sono corretti:

- Chat Analisi delimita e revisiona;
- Chat Esecutore prepara una consegna senza fingere di avere modificato la copia locale;
- Desktop Esecutore applica modifiche e controlli sulla copia locale;
- Desktop Collaudatore resta read-only e produce risultati indipendenti.

È corretta anche la regola:

```text
un fix dopo un collaudo fallito richiede una nuova esecuzione autorizzata
```

Questa impedisce che il Collaudatore diventi Esecutore durante lo stesso prompt.

### Limite

La descrizione dei ruoli è già replicata in `01-context-selection.md`. La correzione deve essere applicata nel documento precedente, lasciando questo file come owner principale del workflow.

**Modifiche necessarie in questo file:** nessuna sulla sostanza dei ruoli.

---

# 3. Scelta della modalità

## Esito: coerente

La matrice di scelta è chiara:

```text
modifica locale complessa o diagnosi runtime
→ DESKTOP_ESECUTORE

consegna deterministica tramite browser
→ CHAT_ESECUTORE

collaudo browser indipendente
→ DESKTOP_COLLAUDATORE

analisi, delimitazione o revisione
→ CHAT_ANALISI
```

Il principio di una sola modalità per task è coerente con il metodo dell’utente.

### Chiarimento consigliato

Una task complessiva può attraversare più fasi, purché ogni fase sia una nuova esecuzione con modalità dichiarata:

```text
CHAT_ANALISI
→ CHAT_ESECUTORE o DESKTOP_ESECUTORE
→ CHAT_ANALISI
→ eventuale DESKTOP_COLLAUDATORE
→ CHAT_ANALISI
→ pubblicazione dell’utente
```

Questo chiarimento evita di interpretare “una sola modalità” come divieto di una sequenza multi-ruolo fra prompt separati.

Può essere inserito senza change ID autonomo all’interno di `WF-DOC-001`.

---

# 4. Gerarchia delle fonti

## Esito: coerente

La gerarchia è allineata al progetto:

1. decisione utente più recente;
2. stato locale autorizzato;
3. test sullo stesso stato;
4. codice canonico;
5. documentazione owner;
6. registri;
7. planning e report storici;
8. conversazioni e pacchetti precedenti.

È corretta la presenza di:

```text
fileModificati.md
+
output reali
+
SHA base
```

come rappresentazione dello stato locale.

### Osservazione

Per task che non modificano file, lo stato locale non può essere rappresentato da `fileModificati.md`. Deve essere rappresentato dagli artefatti pertinenti:

```text
SHA
working tree
output dei controlli
screenshot o matrice di collaudo
git diff o stato locale
```

Questo punto è parte della correzione condizionale descritta in `WF-DOC-001`.

---

# 5. Requisiti obbligatori del prompt

## Esito: contraddizione interna

La sezione dichiara:

```text
Ogni prompt esecutivo deve indicare:
```

e include sempre:

- metodo unico di consegna;
- procedura obbligatoria per creare `fileModificati.md`;
- momento del report finale.

Nello stesso documento il Desktop Collaudatore:

```text
non modifica codice o documentazione
non crea o modifica fileModificati.md
```

Le due regole sono incompatibili quando “prompt esecutivo” include il collaudo.

Sono incompatibili anche con:

- analisi read-only;
- task di sola verifica;
- task che non producono modifiche;
- task di sola cancellazione, nelle quali non esiste contenuto finale da includere in `fileModificati.md`.

## Finding `WF-DOC-001` — requisiti universali incompatibili con le modalità read-only

**Gravità:** alta  
**Tipo:** contraddizione operativa

### Modifica consigliata

Sostituire l’introduzione con:

```markdown
## Requisiti del prompt per modalità

Ogni prompt deve dichiarare i campi comuni pertinenti alla modalità.

### Campi comuni

- ID e titolo;
- modalità;
- obiettivo unico;
- repository, root, branch e SHA;
- file modificabili;
- file consultabili;
- file esclusi;
- comportamento o verifica richiesta;
- contratti da preservare;
- controlli;
- criterio di successo;
- criterio di stop;
- impatto documentale;
- commit: no;
- push: no.

### Campi per task che creano o modificano file

- massimo tre tentativi;
- metodo unico di consegna;
- procedura per creare o rigenerare `fileModificati.md`;
- rollback;
- momento del report finale.

### Campi per task read-only o di collaudo

- precondizioni;
- interazioni o controlli reali;
- evidenze da raccogliere;
- matrice `PASS / FAIL / BLOCCATO`;
- criterio di perdita critica;
- `fileModificati.md`: non previsto.
```

Aggiungere:

```text
Una sequenza completa può usare modalità diverse in prompt distinti.
La modalità non cambia durante la stessa esecuzione.
```

---

# 6. Massimo tre tentativi

## Esito: coerente

La regola dei tre tentativi è definita correttamente:

1. partire dall’errore reale;
2. formulare una causa;
3. applicare la correzione minima;
4. ripetere il controllo pertinente.

È corretto fermarsi dopo il terzo fallimento e non ampliare lo scope.

È corretta anche la condizione:

```text
produrre fileModificati.md se sono stati modificati file
```

Il testo evita già di imporre l’artefatto quando nessun file è stato toccato.

**Modifiche necessarie:** nessuna.

---

# 7. Contratto di `fileModificati.md`

## Esito: utile e coerente, ma troppo integrato nel workflow principale

La funzione è definita chiaramente:

```text
artefatto tecnico della copia locale
≠
report della task
```

Sono corretti:

- inclusione di tutti e soli i file toccati;
- contenuto completo;
- esclusione di report, test, warning e dati runtime;
- rigenerazione dopo modifiche successive;
- divieto di commit;
- impossibilità di sostituirlo con un elenco ricostruito dal remoto.

Queste regole costituiscono però un contratto autonomo, più dettagliato del workflow generale.

### Responsabilità distinta

Il blocco comprende:

- schema dell’artefatto;
- contenuto ammesso;
- contenuto vietato;
- comando di generazione;
- lifecycle;
- rapporto con il report;
- rapporto con le cancellazioni.

Questo contenuto può essere consultato e aggiornato indipendentemente da ruoli, collaudi e pubblicazione Git.

La sezione deve quindi essere spostata in un owner dedicato, come indicato in `WF-DOC-005`.

---

# 8. Comando Repomix

## Esito: non deterministico

Il comando corrente usa:

```powershell
npx.cmd --yes repomix@latest
```

La parola:

```text
@latest
```

rende la procedura variabile nel tempo.

Una task eseguita oggi e una task eseguita successivamente possono usare versioni differenti, con:

- formato di output differente;
- opzioni modificate;
- comportamento di sicurezza differente;
- dipendenze differenti;
- possibile necessità di rete;
- impossibilità di riprodurre esattamente il processo.

Questo contrasta con i principi dichiarati di:

- consegna deterministica;
- controlli ripetibili;
- artefatto affidabile;
- massimo tre tentativi basati sullo stesso metodo.

## Finding `WF-DOC-002` — `repomix@latest` non riproducibile

**Gravità:** alta  
**Tipo:** riproducibilità degli artefatti

### Modifica consigliata

Non inventare nel documento una versione non ancora approvata.

Sostituire il comando con una delle due strategie:

### Strategia preferita

Definire una versione approvata e dichiararla esplicitamente:

```powershell
$repomixVersion = '<versione-approvata>'
npx.cmd --yes "repomix@$repomixVersion" ...
```

La versione deve essere aggiornata intenzionalmente e verificata.

### Strategia project-owned

Creare uno script locale:

```text
scripts/build_file_modificati.py
```

oppure:

```text
scripts/build-file-modificati.mjs
```

Lo script deve:

- ricevere una lista esatta di file;
- rifiutare directory e pattern generici;
- includere contenuto completo;
- produrre un manifest;
- fallire se un file richiesto manca;
- non includere segreti o runtime;
- supportare segmentazione bounded.

La seconda strategia richiede una task tecnica separata e non deve essere presentata come già implementata.

---

# 9. Integrità del contesto e dimensione dell’artefatto

## Esito: gap operativo

Il documento richiede un unico:

```text
fileModificati.md
```

contenente il testo completo di tutti i file toccati.

Non definisce:

- dimensione massima;
- numero massimo di file;
- strategia di segmentazione;
- manifest per più segmenti;
- comportamento quando un file è troppo grande;
- verifica che nessun contenuto sia stato troncato;
- criterio per impedire la perdita di contesto durante la revisione.

Per task piccole il contratto funziona.

Per task che toccano molti file o file molto lunghi, un singolo artefatto può:

- superare il contesto disponibile;
- essere troncato dal mezzo di trasferimento;
- impedire una revisione integrale reale;
- rendere falsa la dichiarazione “letto integralmente”;
- mescolare responsabilità non più verificabili in un’unica revisione.

## Finding `WF-DOC-003` — manca una policy bounded e segmentata

**Gravità:** alta  
**Tipo:** integrità del contesto

### Modifica consigliata

Preservare il principio:

```text
tutti e soli i file toccati
+
contenuto completo
```

ma consentire un pacchetto segmentato:

```text
fileModificati/
├── manifest.json
├── 01.md
├── 02.md
└── ...
```

Il manifest deve indicare:

```text
percorso originale
segmento
ordine
byte
righe
SHA-256 del contenuto
stato: completo
```

Regole:

- nessun file può essere troncato;
- un singolo file resta intero quando possibile;
- se un singolo file è troppo grande, dividerlo in intervalli di righe dichiarati;
- la Chat Analisi deve confermare di avere letto tutti i segmenti;
- il report deve indicare eventuali limiti;
- un pacchetto segmentato non cambia lo scope della task;
- il pacchetto non viene committato.

### Decisione richiesta

La policy precisa di segmentazione deve essere approvata dall’utente prima dell’implementazione.

Il problema e il requisito sono dimostrati; la soglia numerica non deve essere inventata.

---

# 10. Task di sola cancellazione

## Esito: evidenza insufficiente

Il documento dichiara correttamente che i file eliminati non devono essere ricostruiti artificialmente dentro `fileModificati.md`.

Li rimanda però genericamente a:

```text
report finale
+
output locali
```

Non specifica quale evidenza minima debba essere fornita.

Una task di sola cancellazione può quindi arrivare alla Chat Analisi senza:

- contenuto finale da leggere;
- diff della cancellazione;
- lista machine-readable;
- prova che i soli file autorizzati siano stati eliminati.

## Finding `WF-DOC-004` — manca un contratto verificabile per le cancellazioni

**Gravità:** media  
**Tipo:** integrità dello scope

### Modifica consigliata

Per ogni cancellazione richiedere almeno:

```bash
git diff --name-status
git status --short
```

e, quando necessario:

```bash
git diff -- <percorso>
```

Il report deve distinguere:

```text
file creati
file modificati
file eliminati
file rinominati
```

Una task di sola cancellazione non richiede un falso `fileModificati.md`, ma richiede:

```text
manifest delle cancellazioni
+
output Git reale
+
conferma dello scope
```

Questa eccezione deve essere dichiarata nelle sezioni:

- requisiti del prompt;
- revisione;
- criteri `PRONTO PER TASK`;
- criteri di chiusura.

---

# 11. Ciclo `CHAT_ESECUTORE`

## Esito: coerente

Le tre fasi sono ben distinte:

```text
consegna
→ applicazione locale
→ report finale
```

È corretto vietare alla Chat Esecutore di:

- dichiarare completata la task prima dell’applicazione;
- dichiarare controlli locali non eseguiti;
- inventare `fileModificati.md`;
- produrre anticipatamente il report finale.

La presenza di un `DELIVERY-MANIFEST` è coerente con le decisioni dell’utente.

### Ownership

Il ciclo completo è strettamente collegato al contratto degli artefatti esecutivi.

Le sezioni:

```text
6. fileModificati.md
7. CHAT_ESECUTORE
8. report finale
```

devono essere spostate insieme nello stesso documento owner, evitando di separare artificialmente elementi che formano un solo contratto.

---

# 12. Report finale dell’Esecutore

## Esito: coerente

Il contenuto minimo è completo e appropriato:

- modalità;
- SHA;
- stato iniziale;
- file letti e toccati;
- riepilogo;
- comandi ed exit code;
- test;
- tentativi;
- warning;
- working tree;
- impatto documentale;
- assenza di commit e push;
- stato per revisione.

Sono corretti i divieti:

- niente PASS inventati;
- niente working tree dichiarata pulita senza verifica;
- niente auto-approvazione.

### Modifica collegata

Il report deve aggiungere un campo esplicito:

```text
Artefatto di revisione:
- fileModificati.md singolo;
- pacchetto segmentato;
- non applicabile, task read-only;
- non applicabile, sola cancellazione con manifest Git.
```

Questa modifica fa parte di `WF-DOC-003` e `WF-DOC-004`.

---

# 13. Revisione della Chat Analisi

## Esito: formulazione troppo assoluta

Il documento afferma:

```text
La Chat Analisi deve ricevere entrambi:
fileModificati.md
+
report finale
```

e:

```text
non approva senza avere letto integralmente fileModificati.md
```

Questa regola è corretta per task che creano o modificano file.

Non è applicabile a:

- collaudi read-only;
- analisi senza modifiche;
- task di sola cancellazione;
- task bloccate prima di modificare file.

Questa è la seconda contraddizione interna del documento.

## Finding `WF-DOC-005` — revisione non condizionata al tipo di task

**Gravità:** alta  
**Tipo:** contraddizione operativa

### Modifica consigliata

Sostituire la regola assoluta con una matrice:

| Tipo di task | Artefatti richiesti alla revisione |
| --- | --- |
| Crea o modifica file | `fileModificati.md` o pacchetto segmentato + report + output |
| Elimina file | manifest cancellazioni + output Git + report |
| Collaudo read-only | matrice `PASS / FAIL / BLOCCATO` + evidenze + limiti |
| Analisi read-only | report di analisi + fonti consultate |
| Task bloccata senza modifiche | errore, output, tentativi e criterio di stop |

Aggiungere:

```text
La Chat Analisi non approva senza avere letto integralmente tutti gli
artefatti applicabili alla modalità e allo stato finale della task.
```

Questa formulazione preserva il rigore senza richiedere un file inesistente.

---

# 14. Collaudi

## Esito: coerente, ma criterio da rendere esplicito nelle task

È corretta la separazione del collaudo quando cambiano:

- UX;
- polling;
- lifecycle;
- persistenza;
- route;
- dati osservabili;
- browser o CDP;
- runtime.

È corretta anche la collocazione dei report storici in `docs/validations/`.

### Modifica consigliata

Nei criteri `PRONTO PER TASK` non richiedere sempre un collaudo definito come attività positiva.

Richiedere invece:

```text
collaudo:
- richiesto, con perimetro e criteri;
- non richiesto, con motivazione;
- bloccato, con precondizione mancante.
```

Questa modifica rientra in `WF-DOC-006`.

---

# 15. Git e GitHub

## Esito: coerente nei ruoli, incompleto nei controlli finali

È coerente che:

- Chat e Desktop non eseguano commit o push;
- l’utente pubblichi dopo revisione;
- branch e PR siano eccezioni approvate;
- `git diff --check` non sostituisca la revisione.

Il flusso finale include:

```text
rimozione fileModificati.md
→ git diff --check
→ staging
→ commit
→ push
→ verifica SHA
```

Manca però un controllo esplicito del perimetro prima dello staging.

`git diff --check` non mostra:

- file untracked;
- file eliminati fuori scope;
- file aggiunti accidentalmente;
- presenza residua di `fileModificati.md`;
- stato di sincronizzazione del branch.

Il file `.gitignore` corrente non contiene una regola dedicata a:

```text
fileModificati.md
```

Il documento afferma che non deve essere committato, ma la protezione è soltanto procedurale.

## Finding `WF-DOC-006` — gate Git finale incompleto

**Gravità:** media  
**Tipo:** sicurezza della pubblicazione

### Modifica consigliata

Espandere il flusso finale:

```bash
rm o Remove-Item fileModificati.md
git status --short
git diff --name-status
git diff --check
git diff --stat
```

Prima del commit verificare:

```text
tutti e soli i file approvati
nessun fileModificati.md
nessun report locale temporaneo
nessun file runtime o sensibile
nessuna modifica in docs/archive salvo task esplicita
```

### Protezione aggiuntiva consigliata

Aggiungere a `.gitignore` una regola exact-root:

```gitignore
/fileModificati.md
```

Se viene introdotto il pacchetto segmentato:

```gitignore
/fileModificati/
```

Questa modifica riguarda `.gitignore` oltre al documento e deve essere applicata soltanto in una task autorizzata.

---

# 16. Criteri `PRONTO PER TASK`

## Esito: troppo universali

La sezione richiede sempre:

- collaudo;
- generazione di `fileModificati.md`;
- sequenza del report finale.

Questi campi devono essere presenti, ma possono essere:

```text
richiesto
non richiesto
non applicabile
bloccato
```

Il problema non è chiedere una decisione sul campo; è assumere sempre la stessa procedura.

### Modifica consigliata

Usare:

```markdown
Una voce diventa `PRONTO PER TASK` quando sono definiti:

- problema;
- decisioni;
- scope;
- file;
- controlli;
- rischi;
- criteri;
- modalità;
- impatto documentale;
- artefatti di revisione applicabili;
- collaudo richiesto o motivatamente non richiesto;
- criterio di stop;
- sequenza di revisione e pubblicazione.
```

Questa modifica rientra in `WF-DOC-001` e `WF-DOC-005`.

---

# 17. Criteri di chiusura

## Esito: valido per task pubblicate, ma non classificato per fase

Il documento definisce una task chiusa soltanto dopo:

- controlli;
- revisione;
- eventuale collaudo;
- aggiornamento documentale;
- commit;
- push;
- verifica SHA remoto.

Questa definizione è coerente con il workflow completo dell’utente.

Manca però una distinzione terminologica fra:

```text
esecuzione conclusa
pronta per revisione
approvata per pubblicazione
pubblicata
chiusa
```

Senza questa distinzione, un Esecutore potrebbe usare impropriamente la parola “completata” prima della pubblicazione oppure una scheda potrebbe essere marcata `COMPLETATO` mentre il push è ancora pendente.

### Modifica consigliata

Aggiungere gli stati di fase del workflow:

```text
ESEGUITA
→ modifiche e controlli locali conclusi

PRONTA PER REVISIONE
→ artefatti completi disponibili

APPROVATA PER PUBBLICAZIONE
→ revisione e collaudo richiesto positivi

PUBBLICATA
→ commit e push eseguiti

CHIUSA
→ SHA remoto verificato e registri coerenti
```

Questi non devono necessariamente diventare nuovi stati canonici dei registri.

Possono essere usati come:

```text
fase del workflow
```

mantenendo lo stato di registro `COMPLETATO` soltanto dopo la chiusura effettiva.

Questa modifica può essere applicata insieme a `WF-DOC-006`.

---

# 18. Impatto documentale

## Esito: coerente

Il report finale deve dichiarare:

- modifiche funzionali;
- contratti;
- owner da aggiornare;
- documenti invariati;
- link;
- nuovi documenti;
- limiti.

È corretto escludere queste informazioni da `fileModificati.md`.

### Aggiunta consigliata

Aggiungere:

```text
documenti proposti da modularizzare o accorpare
```

per rendere permanente il controllo richiesto dall’utente durante questa revisione.

Questa aggiunta può essere applicata in `WF-DOC-005`, senza nuovo change ID.

---

# 19. Sezione “Modularizzazione”

## Esito: fuori owner

La sezione definisce criteri tecnici per dividere file applicativi:

- responsabilità;
- contratto;
- stato;
- side effect;
- dipendenza;
- owner;
- test;
- contesto minimo;
- facade;
- entry point.

Questa materia non riguarda il lifecycle esecutivo della task.

Appartiene al documento già proposto nell’analisi di `01-context-selection.md`:

```text
docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md
```

### Azione

Spostare integralmente la sezione nel nuovo owner.

Nel workflow conservare soltanto:

```markdown
## Diagnosi e modularizzazione

Quando una task richiede una diagnosi strutturale o la divisione di file,
applicare:

- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)

La modularizzazione non deve ampliare lo scope della task senza una
decisione esplicita.
```

Questa azione è inclusa in `WF-DOC-005`.

---

# 20. Valutazione della modularizzazione del documento

## Esito: modularizzazione consigliata

### Responsabilità A — workflow e ruoli

Deve restare in:

```text
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
```

Contenuti:

- scopo;
- principi;
- ruoli;
- scelta della modalità;
- gerarchia delle fonti;
- tre tentativi;
- revisione;
- collaudi;
- Git;
- readiness;
- fasi di chiusura;
- impatto documentale;
- link agli owner collegati.

### Responsabilità B — artefatti esecutivi

Creare:

```text
docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md
```

Contenuti:

- campi dei prompt che modificano file;
- `DELIVERY-MANIFEST`;
- `fileModificati.md`;
- eventuale pacchetto segmentato;
- generazione deterministica;
- task di cancellazione;
- ciclo `CHAT_ESECUTORE`;
- schema del report finale;
- artefatti richiesti alla revisione;
- esclusione da Git.

### Responsabilità C — diagnosi e modularizzazione

Creare, come già proposto nel report precedente:

```text
docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md
```

Contenuti:

- responsabilità primaria;
- export;
- input/output;
- stato;
- side effect;
- dipendenze;
- consumer;
- test;
- confini di estrazione;
- facade;
- entry point;
- dependency injection;
- criteri di separazione.

### Perché usare `04` e `05`

La numerazione proposta mantiene la sequenza:

```text
01 contesto
02 convenzioni
03 workflow
04 diagnosi e modularizzazione
05 artefatti esecutivi
```

Non creare un secondo file con numero `04`.

---

# 21. Dimensione e integrità del contesto

## Valutazione

```text
Righe: 484
Target normale superato: SÌ
Responsabilità principali: 3
Contratti consultabili separatamente: SÌ
Rischio di divergenza interna: MEDIO-ALTO
Rischio di perdita del contesto: ALTO
Suddivisione per sola lunghezza: NO
Modularizzazione per compito e owner: SÌ
```

Il documento non deve essere spezzato in parti arbitrarie come:

```text
parte-1
parte-2
parte-3
```

La divisione deve seguire i contratti individuati.

### Risultato atteso

```text
03-workflow-esecutivo.md
→ owner del lifecycle e dei ruoli

04-diagnosi-e-modularizzazione.md
→ owner della diagnosi strutturale

05-artefatti-esecutivi.md
→ owner di consegna, fileModificati e report
```

Questa struttura riduce il contesto necessario:

- una task read-only non deve caricare il contratto Repomix;
- una task di consegna non deve caricare tutta la diagnosi tecnica;
- una diagnosi di modularizzazione non deve caricare il lifecycle Git completo;
- il workflow generale resta leggibile e stabile.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-004
Percorso report: Report documentale/04 - 03-workflow-esecutivo.md
Documento: docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
Change ID: WF-DOC-001
Change ID: WF-DOC-002
Change ID: WF-DOC-003
Change ID: WF-DOC-004
Change ID: WF-DOC-005
Change ID: WF-DOC-006
Suddivisione richiesta: sì
Nuovo file già proposto: docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md
Nuovo file proposto: docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md
```

I due file mappa dovranno conservare in futuro:

- riferimento al report;
- sei task con checkbox;
- stato della suddivisione;
- nuovi file proposti;

Non sono stati aggiornati durante questa analisi.

---

# Modifiche proposte

## `WF-DOC-001` — rendere i requisiti condizionali alla modalità

**Priorità:** alta

**Azione:**

- separare campi comuni, task mutative e task read-only;
- non richiedere `fileModificati.md` al Collaudatore;
- chiarire che una sequenza può usare più modalità in prompt distinti;
- aggiornare criteri `PRONTO PER TASK`.

**File principale:**

```text
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
```

---

## `WF-DOC-002` — eliminare `repomix@latest`

**Priorità:** alta

**Azione:**

- usare una versione approvata e dichiarata;
- oppure introdurre in una task separata un generatore project-owned;
- non inventare la versione nel documento prima della decisione.

**File coinvolti:**

```text
docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md
eventuale script project-owned
```

---

## `WF-DOC-003` — introdurre artefatti bounded e segmentati

**Priorità:** alta

**Azione:**

- definire pacchetto segmentato con manifest;
- preservare contenuto completo e ordine;
- registrare byte, righe e digest;
- impedire troncamenti;
- richiedere revisione di tutti i segmenti;
- stabilire le soglie soltanto dopo decisione dell’utente.

**File coinvolto:**

```text
docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md
```

---

## `WF-DOC-004` — definire l’evidenza delle cancellazioni

**Priorità:** media

**Azione:**

- richiedere manifest delle cancellazioni;
- richiedere output Git reale;
- distinguere creazioni, modifiche, cancellazioni e rinomine;
- non creare un falso `fileModificati.md` per una task di sola cancellazione.

**File coinvolti:**

```text
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md
```

---

## `WF-DOC-005` — modularizzare il documento per owner

**Priorità:** alta

**Azione:**

- mantenere workflow e ruoli in `03-workflow-esecutivo.md`;
- spostare diagnosi e modularizzazione in `04-diagnosi-e-modularizzazione.md`;
- spostare artefatti, Chat Esecutore e report in `05-artefatti-esecutivi.md`;
- aggiornare `index.md`, `01-context-selection.md`, `02-documentation-conventions.md` e i link collegati;
- aggiungere al report finale il controllo di modularizzazione documentale.

**File coinvolti:**

```text
docs/tennis-decision-ui/ai/01-context-selection.md
docs/tennis-decision-ui/ai/02-documentation-conventions.md
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
docs/tennis-decision-ui/ai/04-diagnosi-e-modularizzazione.md
docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md
docs/tennis-decision-ui/index.md
```

---

## `WF-DOC-006` — completare revisione, fasi di chiusura e gate Git

**Priorità:** media

**Azione:**

- rendere gli artefatti di revisione condizionali;
- distinguere eseguita, pronta per revisione, approvata, pubblicata e chiusa;
- aggiungere `git status --short`, `git diff --name-status` e `git diff --stat`;
- verificare l’assenza di file locali temporanei;
- aggiungere `/fileModificati.md` a `.gitignore`;
- aggiungere `/fileModificati/` se viene approvata la segmentazione;
- richiedere che il collaudo sia dichiarato richiesto, non richiesto o bloccato.

**File coinvolti:**

```text
docs/tennis-decision-ui/ai/03-workflow-esecutivo.md
docs/tennis-decision-ui/ai/05-artefatti-esecutivi.md
.gitignore
```

---

# Ordine consigliato di applicazione

```text
1. approvare la struttura 03 / 04 / 05;
2. decidere il contratto bounded e la strategia Repomix;
3. creare 04-diagnosi-e-modularizzazione.md;
4. creare 05-artefatti-esecutivi.md;
5. riscrivere 03-workflow-esecutivo.md come owner del lifecycle;
6. aggiornare 01-context-selection.md;
7. aggiornare 02-documentation-conventions.md;
8. aggiornare index.md e i link;
9. aggiornare .gitignore;
10. eseguire checker e validazione fast.
```

Le modifiche dei report `002`, `003` e `004` attraversano gli stessi documenti AI.

Non devono essere applicate come patch indipendenti non coordinate.

È preferibile una singola task documentale strutturale con:

- file completi;
- manifest;
- controllo dei link;
- controllo dei registri;
- verifica che `docs/archive/` resti invariato.

---

# Controlli previsti dopo un’eventuale modifica

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
git diff --stat
git status --short
git status --short -- docs/archive
```

Risultato atteso:

```text
link checker: PASS
registry checker: PASS
validation fast: PASS
git diff --check: nessun output
fileModificati.md: non presente o ignorato
docs/archive: nessuna modifica
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
03-workflow-esecutivo.md: APPROVATO NEI PRINCIPI, DA MODULARIZZARE
Coerenza con le decisioni dell’utente: alta
Contraddizioni operative: da correggere
Riproducibilità di Repomix: da correggere
Integrità del contesto: policy mancante
Contratto cancellazioni: incompleto
Gate Git: da completare
Riscrittura completa: consigliata
Suddivisione: consigliata per compito e owner
Priorità documentale: alta
```

Il documento è l’owner corretto del workflow generale, ma non deve continuare a contenere anche:

- il contratto dettagliato degli artefatti esecutivi;
- la procedura tool-specific di generazione;
- i criteri tecnici di modularizzazione del codice.

La struttura consigliata è:

```text
03-workflow-esecutivo.md
04-diagnosi-e-modularizzazione.md
05-artefatti-esecutivi.md
```

La divisione protegge l’integrità del contesto e riduce la probabilità che una modifica al generatore degli artefatti alteri accidentalmente il contratto generale dei ruoli e della chiusura.
