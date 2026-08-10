# Report documentale — `docs/tennis-decision-ui/ai/02-documentation-conventions.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-003
Sequenza audit: 03/72
Documento analizzato: 02-documentation-conventions.md
Percorso documento: docs/tennis-decision-ui/ai/02-documentation-conventions.md
Percorso report: Report documentale/03 - 02-documentation-conventions.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 285 righe
Ruolo dichiarato: convenzioni della documentazione tecnica
Stato report: completato
```

Il documento è stato confrontato con:

- `README.md`;
- `docs/tennis-decision-ui/index.md`;
- `docs/tennis-decision-ui/ai/01-context-selection.md`;
- `docs/tennis-decision-ui/ai/03-workflow-esecutivo.md`;
- `docs/tennis-decision-ui/reference/01-repository-map.md`;
- `docs/tennis-decision-ui/operations/05-retention-and-cleanup.md`;
- `docs/validations/documentation-migration-finalization-2026-08-03.md`;
- `implementazioni/99-decisioni-utente.md`;
- `scripts/check_documentation_links.py`;
- `scripts/check_registry_consistency.py`.

I due file mappa non sono stati modificati.

---

## Esito sintetico

```text
Coerenza generale con il progetto: MEDIO-ALTA
Contraddizioni bloccanti per il runtime: 0
Contraddizioni con la policy documentale corrente: 1
Formulazioni transitorie obsolete: 2
Descrizioni dei checker non coerenti con il codice: 0
Link errati rilevati nel documento: 0
Correzioni consigliate: 4
Necessità di riscrittura completa: NO
Necessità di suddivisione: NO
```

Il documento svolge correttamente il ruolo di owner delle convenzioni documentali e può restare un file unico.

La modifica più importante riguarda `docs/archive/`: il testo conserva la politica precedente di consolidamento e rimozione, mentre la policy corrente pubblicata nei documenti root stabilisce che l’archive resta nel repository come area non canonica preservata e non soggetta a pulizie automatiche o generiche.

Le altre modifiche riguardano formule rimaste dalla migrazione MDX, già conclusa e pubblicata.

---

# 1. Scopo e responsabilità

## Esito: coerente

Lo scopo è definito correttamente:

```text
scrivere
collocare
aggiornare
verificare
la documentazione tecnica
```

È corretta anche la regola secondo cui la documentazione deve spiegare:

- responsabilità;
- confini;
- contratti;
- invarianti;
- stato reale;
- modalità di verifica.

Il divieto di trasformare la documentazione in una copia integrale del codice o in una raccolta di funzionalità future è coerente con l’indice canonico e con le decisioni documentali del progetto.

**Modifiche necessarie:** nessuna.

---

# 2. Radici documentali

## Esito: quasi coerente

Le quattro radici sono correttamente distinte:

| Percorso | Ruolo generale |
| --- | --- |
| `docs/tennis-decision-ui/` | documentazione tecnica canonica |
| `docs/validations/` | verifiche e collaudi storici |
| `docs/archive/` | materiale non canonico |
| `implementazioni/` | audit, proposte e decisioni |

Le prime, seconde e quarte definizioni sono coerenti con il progetto.

La descrizione corrente di `docs/archive/` è invece troppo legata alla precedente fase di consolidamento:

```text
Registro delle fonti consolidate; eventuali materiali successivi non canonici
```

Questa frase non dichiara chiaramente che:

- il contenuto archive è preservato quando l’utente lo ritiene utile;
- non è un owner tecnico;
- non dimostra implementazione;
- non viene eliminato dalle pulizie automatiche o generiche.

### Finding `DOC-CONV-001` — ruolo di `docs/archive/` non allineato alla policy corrente

**Gravità:** alta  
**Tipo:** policy documentale

### Sostituzione consigliata nella tabella

```diff
-| `docs/archive/` | Registro delle fonti consolidate; eventuali materiali successivi non canonici |
+| `docs/archive/` | Materiali storici, planning, brief o fonti future non canoniche conservati per uso successivo; non è un owner tecnico e non prova implementazione |
```

La formulazione deve restare coerente con `README.md` e `docs/tennis-decision-ui/index.md`.

---

# 3. Formato dei documenti canonici

## Esito: coerente

Le regole risultano allineate alle decisioni del progetto:

```text
estensione .md
nessun export const meta
nessun frontmatter predefinito
numerazione locale
nome in kebab-case
un titolo H1 umano
ordine tramite indice e nome
```

La regola non impedisce correttamente file root con funzione diversa, come:

```text
README.md
todo-list-tennis-decision-ui.md
implementazioni-tennis-decision-ui.md
```

perché la sezione è riferita ai documenti canonici organizzati sotto la relativa radice.

**Modifiche necessarie:** nessuna.

---

# 4. Aree canoniche

## Esito: coerente

Le aree descritte corrispondono alla struttura del repository:

- `architecture/`;
- `api/`;
- `modules/`;
- `operations/`;
- `ai/`;
- `reference/`;
- `roadmap/`.

La separazione delle responsabilità è chiara e non presenta directory inesistenti.

**Modifiche necessarie:** nessuna.

---

# 5. Un owner per responsabilità

## Esito: pienamente coerente

La regola:

```text
ogni contratto ha un solo documento owner
```

è centrale e coerente con l’indice, con il workflow e con l’analisi del documento precedente.

Sono corretti anche i criteri per dividere un documento:

- ownership;
- contratto;
- modulo;
- stato o durata;
- side effect;
- verifica;
- contesto minimo.

La frase:

```text
Non dividere un documento soltanto perché è lungo.
```

è appropriata.

Questa stessa regola giustifica la ristrutturazione proposta per `01-context-selection.md`, ma non impone di dividere il presente documento.

**Modifiche necessarie:** nessuna.

---

# 6. Dimensione e struttura

## Esito: coerente

Il documento dichiara:

```text
target normale: circa 200–600 parole
verifica delle responsabilità oltre circa 700–900 parole
```

Questa è una soglia di revisione, non un limite automatico.

Il file analizzato ha 285 righe ed è significativamente più lungo del target normale, ma tutte le sezioni appartengono alla stessa responsabilità:

```text
convenzioni della documentazione
```

Le sezioni su formato, ownership, fatti tecnici, link, validazioni, sicurezza e checker sono parti naturali dello stesso owner.

### Valutazione sulla suddivisione

```text
File lungo: SÌ
Più owner concorrenti: NO
Cambio di modulo: NO
Cambio di contratto: NO
Rischio di frammentazione se diviso: MEDIO
Suddivisione richiesta: NO
```

La soluzione corretta non è creare nuovi file, ma:

- eliminare le formulazioni obsolete;
- aggiornare la sezione archive;
- mantenere un unico documento owner.

---

# 7. Stati consentiti

## Esito: coerente

Gli stati:

```text
Implementato
Implementato, da validare
Deprecato
Legacy
Storico
```

sono definiti chiaramente.

È corretta la distinzione fra:

- comportamento presente;
- comportamento presente ma non validato;
- codice deprecato;
- materiale legacy;
- verifica storica.

La regola che vieta di usare `Implementato` per proposte o decisioni non presenti nel codice è coerente con l’intera documentazione canonica.

**Modifiche necessarie:** nessuna.

---

# 8. Fatti tecnici

## Esito: coerente

Il documento richiede che percorsi, endpoint, payload, argomenti CLI, ownership, persistenza, invarianti e limiti siano verificati nel codice o in test eseguiti sullo stesso stato.

L’esempio relativo a:

```text
eventId
trackingSessionId
```

è coerente con il principio secondo cui una decisione futura non deve essere descritta come già implementata.

Non è necessario trasformare l’esempio in un contratto permanente. La sua funzione è mostrare il modo corretto di documentare un limite corrente.

**Modifiche necessarie:** nessuna.

---

# 9. Documentazione e codice nella stessa task

## Esito: regola corretta, terminologia transitoria obsoleta

È corretta la regola che richiede di aggiornare nello stesso scope i documenti owner quando cambia un comportamento osservabile.

L’elenco dei cambiamenti che richiedono aggiornamento è coerente:

- endpoint;
- payload;
- CLI;
- ownership;
- persistenza;
- recovery;
- Source Identity;
- Evidence;
- polling;
- stato frontend;
- percorsi canonici;
- test o procedure rilevanti.

Il paragrafo finale usa però una condizione ormai superata:

```text
Se l'owner non è ancora migrato
```

La migrazione MDX → Markdown è conclusa e tutti gli owner canonici correnti usano `.md`.

### Finding `DOC-CONV-002` — condizione “owner non ancora migrato” obsoleta

**Gravità:** media  
**Tipo:** terminologia transitoria

### Testo da sostituire

```text
Se l'owner non è ancora migrato, registrare l'impatto documentale e
finalizzarlo insieme al relativo batch comportamentale.
```

### Sostituzione consigliata

```text
Se non esiste ancora un documento owner canonico per il comportamento
modificato, registrare l’impatto documentale e decidere esplicitamente
se crearne uno nella stessa task. Non creare un owner canonico per
funzionalità future non ancora implementate.
```

Questa formulazione descrive lo stato corrente senza ripristinare il concetto di batch di migrazione.

---

# 10. Link

## Esito: coerente con il checker

Il comando documentato è corretto:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
```

Il checker effettivamente:

- è read-only;
- scansiona Markdown e MDX;
- esclude le directory runtime dichiarate;
- individua link inline e reference link;
- verifica target;
- verifica anchor;
- segnala link `.mdx`;
- riporta file, riga, target e tipo di finding;
- non riscrive documenti.

La descrizione:

```text
target
anchor
riferimenti legacy .mdx
```

è quindi coerente con il codice.

### Limite correttamente implicito

Il checker valida la struttura dei collegamenti, non la correttezza semantica del contenuto collegato.

Non serve aggiungere questa precisazione, salvo si voglia rendere il contratto ancora più esplicito.

**Modifiche necessarie:** nessuna.

---

# 11. Validazioni storiche

## Esito: coerente

La collocazione sotto:

```text
docs/validations/
```

è corretta.

Sono appropriati i campi minimi richiesti:

- data;
- SHA;
- ambiente;
- precondizioni;
- passaggi;
- risultato;
- finding;
- limiti;
- stato finale.

È corretta anche la regola:

```text
un report storico non prova lo stesso comportamento sullo SHA corrente
```

Il documento storico di chiusura della migrazione deve restare storico anche se descrive una precedente politica archive. Non deve essere riscritto per simulare che quella fase non sia avvenuta.

**Modifiche necessarie:** nessuna.

---

# 12. Materiale deprecato e archivio

## Esito: non coerente con la policy corrente

La sezione attuale afferma:

```text
docs/archive/ non è un deposito permanente
```

e introduce una regola generale secondo cui un file deve essere eliminato dopo il trasferimento del contenuto unico.

Questa era la politica usata durante il consolidamento del 2026-08-04, ma non è più la policy corrente.

La decisione successiva dell’utente, già recepita nei documenti root, stabilisce:

```text
docs/archive resta nel repository
non è documentazione canonica
non è owner tecnico
non prova implementazione
non viene eliminato automaticamente
non è un target di pulizie generiche
```

### Finding `DOC-CONV-003` — sezione archive da sostituire integralmente

**Gravità:** alta  
**Tipo:** contraddizione con decisione utente corrente

### Sezione attuale da eliminare

```markdown
## Materiale deprecato e archivio

`docs/archive/` non è un deposito permanente. Una fonte storica separata
viene mantenuta soltanto quando contiene evidenza o requisiti unici non
ancora assorbiti.

Un file deve essere eliminato quando:

- il contenuto unico è stato trasferito nel relativo owner, registro o validation;
- nessun link o consumer lo usa;
- la provenienza resta descritta nel registro dell'archivio;
- il controllo finale è positivo.

Non mantenere due owner concorrenti, prompt esecutivi superati o copie
integrali di backlog già consolidati.
```

### Sezione sostitutiva consigliata

```markdown
## Materiale non canonico e archivio

`docs/archive/` conserva materiali storici, planning, brief o fonti future
non canoniche che l’utente ha deciso di mantenere per uso successivo.

Il contenuto archive:

- non è documentazione tecnica canonica;
- non è un documento owner;
- non prova che una funzione sia implementata;
- non sostituisce i registri, il codice, i test o le validazioni;
- non viene incluso nelle pulizie documentali automatiche o generiche;
- non viene eliminato sulla sola base di duplicazione, età o assenza di link.

Una rimozione da `docs/archive/` richiede una task esplicita, una lista
esatta dei file coinvolti e una decisione dell’utente. Le utility di
cleanup runtime non operano sulla documentazione.
```

### Nota sulle fonti storiche

Il report:

```text
docs/validations/documentation-migration-finalization-2026-08-03.md
```

descrive correttamente il cleanup avvenuto nel 2026 e deve restare invariato come evidenza storica.

La modifica riguarda la policy corrente, non la riscrittura della storia del repository.

---

# 13. Segreti e dati locali

## Esito: coerente

Le esclusioni sono appropriate:

- cookie;
- token;
- password;
- API key;
- percorsi personali non necessari;
- profili browser;
- header sensibili;
- dump di rete;
- payload reali sensibili;
- history, timeline e journal reali.

Sono appropriati anche i placeholder:

```text
<eventId>
<betfair-url>
<profile-dir>
<cdp-url>
```

Il documento è coerente con README, repository map e runbook di retention.

**Modifiche necessarie:** nessuna.

---

# 14. Coerenza dei registri

## Esito: coerente con il checker

Il comando:

```bash
python scripts/check_registry_consistency.py
```

è corretto.

La descrizione del controllo è sostanzialmente esatta. Il checker verifica:

- parità fra schede owner e righe sintetiche dei Blocchi E/F;
- duplicati;
- prefissi dichiarati;
- stati strettamente incompatibili;
- SHA sintetici;
- range;
- ultimo ID `TEST` e `IMPL`;
- ultima decisione sintetizzata;
- ultimo Punto;
- prossimo passo.

Il checker è read-only e non rinumera o modifica file.

**Modifiche necessarie:** nessuna.

---

# 15. Migrazione MDX → Markdown

## Esito: procedura utile, titolo e framing obsoleti

Il flusso operativo descritto è ancora valido:

```text
leggere owner e codice
→ aggiornare il file completo
→ verificare contenuto e link
→ eseguire checker e profilo offline
→ pubblicare con working tree coerente
```

Il titolo:

```text
Migrazione MDX → Markdown
```

non descrive più lo stato corrente.

La migrazione è stata chiusa e pubblicata il 3–4 agosto 2026. Non esiste più una fase di migrazione attiva.

### Finding `DOC-CONV-004` — rinominare la sezione di migrazione

**Gravità:** media  
**Tipo:** stato documentale obsoleto

### Sostituzione consigliata

```diff
-## Migrazione MDX → Markdown
+## Procedura per modifiche documentali
```

Sostituire il testo finale:

```text
Non esiste un workspace di migrazione permanente né una seconda
documentazione canonica.
```

con:

```text
La migrazione MDX → Markdown è conclusa. La sola documentazione tecnica
canonica corrente è sotto `docs/tennis-decision-ui/` e usa Markdown
ordinario `.md`. Non creare una seconda radice documentale canonica.
```

La procedura centrale può rimanere invariata.

---

# 16. Checklist di chiusura

## Esito: coerente

La checklist copre correttamente:

- percorso e nome;
- formato Markdown;
- ownership;
- stato;
- funzioni future;
- fatti verificati;
- link;
- duplicati;
- segreti;
- separazione delle validazioni;
- impatto documentale.

### Aggiunta consigliata

Dopo l’aggiornamento della policy archive, aggiungere:

```text
[ ] Materiale archive non trattato come owner o target di cleanup generico.
```

Questa aggiunta fa parte di `DOC-CONV-003` e non richiede un ulteriore change ID.

---

# 17. Documenti collegati

## Esito: link esistenti e validi

Sono presenti:

- indice;
- selezione del contesto AI;
- repository map.

I link sono corretti.

### Miglioria collegata consigliata

Aggiungere:

```markdown
- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
```

Motivo:

- il workflow stabilisce quando aggiornare la documentazione;
- definisce impatto documentale, report e criteri di chiusura;
- è un documento direttamente complementare alle convenzioni.

Questa aggiunta può essere applicata insieme a `DOC-CONV-004`, senza un change ID autonomo.

---

# 18. Coerenza con `docs/archive/`

## Stato corrente rilevato

Il repository presenta due livelli distinti:

### Policy corrente

Descritta in:

```text
README.md
docs/tennis-decision-ui/index.md
```

Regola:

```text
archive preservato
→ non canonico
→ non owner
→ non prova implementazione
→ escluso da cleanup automatico o generico
```

### Evidenza storica

Descritta in:

```text
docs/validations/documentation-migration-finalization-2026-08-03.md
implementazioni/99-decisioni-utente.md — DEC-026
```

Questi documenti registrano il consolidamento e la rimozione effettuati in una fase precedente.

### Interpretazione corretta

```text
evidenza storica
≠
policy corrente
```

La convenzione tecnica corrente deve seguire la decisione utente più recente e i documenti root pubblicati.

I record storici non devono essere cancellati o riscritti retroattivamente.

Quando verrà analizzato `implementazioni/99-decisioni-utente.md`, sarà opportuno verificare se `DEC-026` debba essere marcata come superata dalla decisione successiva. Questa osservazione non autorizza modifiche in questa task.

---

# 19. Lunghezza e integrità del contesto

## Valutazione

```text
Righe: 285
Documento sopra il target normale: SÌ
Responsabilità primaria unica: SÌ
Sezioni fuori owner: NO
Duplicazioni estese di altri contratti: NO
Rischio di perdita del contesto: MEDIO-BASSO
Suddivisione consigliata: NO
```

Il documento è lungo perché raccoglie l’intero contratto delle convenzioni documentali.

Dividerlo in file distinti per:

```text
formato
link
validazioni
segreti
checker
archive
```

creerebbe una policy frammentata e renderebbe più difficile verificare una modifica documentale con un solo contesto.

### Azione consigliata

Mantenere il documento unico e ridurlo solo attraverso:

- eliminazione delle formule di migrazione superate;
- sostituzione della vecchia policy archive;
- rimozione di eventuali ripetizioni future.

### Condizione futura per una divisione

Valutare una divisione soltanto se viene introdotto un contratto autonomo con:

- owner diverso;
- toolchain distinta;
- stato indipendente;
- verifica separata;
- contesto non necessario alle normali modifiche documentali.

Questa condizione non è presente oggi.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-003
Percorso report: Report documentale/03 - 02-documentation-conventions.md
Documento: docs/tennis-decision-ui/ai/02-documentation-conventions.md
Change ID: DOC-CONV-001
Change ID: DOC-CONV-002
Change ID: DOC-CONV-003
Change ID: DOC-CONV-004
Suddivisione richiesta: no
Nuovo file proposto: nessuno
```

I due file mappa dovranno conservare in futuro soltanto questi riferimenti e una sintesi delle modifiche.

Non sono stati aggiornati durante questa analisi.

---

# Modifiche proposte

## `DOC-CONV-001` — aggiornare il ruolo di `docs/archive/`

**Priorità:** alta

**Azione:**

- aggiornare la tabella delle radici documentali;
- dichiarare archive come area non canonica preservata;
- esplicitare che non è owner e non prova implementazione.

**File principale coinvolto:**

```text
docs/tennis-decision-ui/ai/02-documentation-conventions.md
```

---

## `DOC-CONV-002` — eliminare la condizione “owner non ancora migrato”

**Priorità:** media

**Azione:**

- sostituire la formulazione transitoria;
- descrivere il caso corrente in cui un owner canonico non esiste;
- non creare owner per funzioni future non implementate.

**File principale coinvolto:**

```text
docs/tennis-decision-ui/ai/02-documentation-conventions.md
```

---

## `DOC-CONV-003` — sostituire integralmente la policy archive precedente

**Priorità:** alta

**Azione:**

- eliminare la regola generale di rimozione;
- registrare la policy di preservazione corrente;
- escludere archive dalle pulizie automatiche o generiche;
- richiedere task esplicita e lista esatta per eventuali rimozioni;
- aggiungere il controllo archive nella checklist.

**File principale coinvolto:**

```text
docs/tennis-decision-ui/ai/02-documentation-conventions.md
```

**Documenti storici da non modificare per questa ragione:**

```text
docs/validations/documentation-migration-finalization-2026-08-03.md
```

---

## `DOC-CONV-004` — aggiornare la sezione MDX e i collegamenti

**Priorità:** media

**Azione:**

- rinominare la sezione in `Procedura per modifiche documentali`;
- dichiarare conclusa la migrazione MDX;
- mantenere una sola radice canonica;
- aggiungere il link a `03-workflow-esecutivo.md`.

**File principale coinvolto:**

```text
docs/tennis-decision-ui/ai/02-documentation-conventions.md
```

---

# Ordine consigliato di applicazione

```text
1. aggiornare la tabella delle radici;
2. sostituire la sezione archive;
3. correggere la formula sull’owner non migrato;
4. rinominare la sezione MDX;
5. aggiornare checklist e documenti collegati;
6. verificare i link;
7. eseguire i checker documentali;
8. verificare che docs/archive non sia stato modificato.
```

---

# Controlli previsti dopo un’eventuale modifica

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git status --short -- docs/archive
```

Risultato atteso:

```text
link checker: PASS
registry checker: PASS
validation fast: PASS
git diff --check: nessun output
docs/archive: nessuna modifica
```

Questi risultati non sono dichiarati eseguiti in questo report.

---

# Decisione finale

```text
02-documentation-conventions.md: APPROVATO CON CORREZIONI DI POLICY
Coerenza tecnica dei checker: confermata
Policy archive: da aggiornare
Terminologia della migrazione: da aggiornare
Riscrittura completa: non necessaria
Suddivisione: non necessaria
Modifica urgente per il runtime: nessuna
Priorità documentale: alta per DOC-CONV-001 e DOC-CONV-003
```

Il file può restare l’unico owner delle convenzioni documentali.

Non deve essere suddiviso, ma deve smettere di presentare la precedente politica di rimozione dell’archive come regola corrente.

La correzione deve preservare la distinzione fra:

```text
record storico del cleanup già avvenuto
e
policy corrente di conservazione dell’archive
```
