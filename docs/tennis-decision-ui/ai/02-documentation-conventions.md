# Convenzioni della documentazione

## Scopo

Questo documento definisce come scrivere, collocare, aggiornare e verificare la documentazione tecnica di Tennis Decision UI.

La documentazione deve spiegare responsabilità, confini, contratti, invarianti, stato reale e verifica. Non deve diventare una copia integrale del codice né una raccolta di funzionalità future.

## Radici documentali

| Percorso                   | Ruolo                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/tennis-decision-ui/` | Documentazione tecnica canonica e corrente                                                                                                                  |
| `docs/validations/`        | Collaudi e verifiche storiche con baseline, ambiente, risultati osservati e limiti                                                                          |
| `docs/archive/`            | Radice non canonica per materiali storici, planning, brief o fonti future esplicitamente preservati; può essere vuota o assente e non prova implementazione |
| `implementazioni/`         | Audit, proposte e decisioni; non sostituisce gli owner tecnici                                                                                              |

Una specifica futura non implementata non appartiene all'indice canonico. I requisiti futuri restano nei registri e vengono trasformati in documentazione owner soltanto insieme all'implementazione.

## Formato

I documenti canonici usano Markdown ordinario:

```txt
01-nome-chiaro.md
02-nome-chiaro.md
```

Regole:

- estensione `.md`;
- nessun `export const meta`;
- nessun frontmatter predefinito;
- numerazione locale alla cartella;
- nome in kebab-case;
- un titolo H1 umano nel contenuto;
- niente file generici come `misc.md`, `notes.md` o `todo.md`;
- ordine e navigazione definiti dall'indice e dal nome del file.

## Aree canoniche

| Area            | Responsabilità                                                       |
| --------------- | -------------------------------------------------------------------- |
| `architecture/` | Confini e flussi trasversali, senza duplicare i moduli               |
| `api/`          | Contratti HTTP realmente esposti                                     |
| `modules/`      | Responsabilità e invarianti dei moduli                               |
| `operations/`   | Procedure operative correnti                                         |
| `ai/`           | Contesto AI e convenzioni documentali                                |
| `reference/`    | Mappe e riferimenti di orientamento                                  |
| `roadmap/`      | Solo stato corrente e priorità approvate; non specifiche speculative |

## Un owner per responsabilità

Ogni contratto ha un solo documento owner.

Un altro documento può:

- riassumere il confine;
- collegare l'owner;
- descrivere il proprio consumer;

ma non deve duplicare il contratto completo.

Dividere un file quando cambia almeno uno tra:

- ownership;
- contratto;
- modulo;
- stato o durata della responsabilità;
- side effect;
- verifica richiesta;
- contesto minimo necessario.

Non dividere un documento soltanto perché è lungo.

## Dimensione e struttura

Target normale: circa 200–600 parole.

Sono ammesse eccezioni per:

- contratti API con più endpoint;
- runbook operativi;
- schemi dati;
- matrici di verifica.

Quando un file supera circa 700–900 parole, verificare se contiene più responsabilità.

Struttura consigliata, quando utile:

```txt
# Titolo

## Scopo
## Stato
## Responsabilità o flusso
## Contratti o invarianti
## Confini
## Verifica
## Documenti collegati
```

Non tutte le sezioni sono obbligatorie.

## Stati consentiti

| Stato                       | Significato                                                  |
| --------------------------- | ------------------------------------------------------------ |
| `Implementato`              | Codice e comportamento esistono                              |
| `Implementato, da validare` | Codice presente ma mancano verifiche reali rilevanti         |
| `Deprecato`                 | Codice o documento ancora presente ma non deve essere esteso |
| `Legacy`                    | Conservato soltanto per confronto o migrazione               |
| `Storico`                   | Risultato di una verifica passata, non contratto corrente    |

Non usare `Implementato` per una decisione, una proposta o un contratto non presente nel codice.

Le funzioni future non vengono descritte come owner canonici. Restano nei registri finché non sono implementate.

## Fatti tecnici

Documentare soltanto elementi verificati nel codice o in un test eseguito sullo stesso stato:

- percorsi;
- endpoint e metodi;
- payload e status HTTP;
- argomenti CLI;
- ownership;
- comportamento di persistenza;
- invarianti;
- limiti.

Quando una capacità manca, descrivere il limite corrente senza presentare una soluzione approvata come già disponibile.

Esempio:

```txt
Stato corrente: la retention delle cache runtime è disponibile come utility standalone; non esiste una retention automatica periodica.
```

Non scrivere:

```txt
La retention delle cache runtime viene eseguita automaticamente.
```

finché codice e configurazione non implementano quel comportamento.

## Documentazione e codice nella stessa task

Quando una task modifica un comportamento osservabile, aggiornare nello stesso scope i documenti owner coinvolti, quando esistono.

Aggiornamento obbligatorio quando cambia:

- endpoint, payload o status;
- CLI o JSON su stdout;
- ownership di processi o sessioni;
- persistenza o recovery;
- Source Identity o Evidence;
- polling e stato frontend;
- percorso canonico;
- test o procedura di verifica rilevante.

Se non esiste ancora un documento owner canonico per il comportamento modificato, registrare l'impatto documentale e decidere esplicitamente se crearne uno nella stessa task. Non creare un owner canonico per funzionalità future non ancora implementate.

## Link

Usare link relativi verso il documento owner più specifico.

I link interni devono puntare soltanto a documenti `.md` esistenti. I riferimenti storici a vecchi percorsi possono restare nei registri di audit, ma non come link canonici attivi.

Prima di chiudere una modifica verificare:

```txt
percorso relativo corretto
→ destinazione esistente
→ nessun link a un duplicato superato
→ nessun riferimento a directory legacy inesistenti
→ nessun link circolare privo di utilità
```

Il controllo ricorsivo disponibile è:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
```

Il gate deve restare verde: target mancanti, anchor mancanti o non verificabili e riferimenti legacy `.mdx` non sono ammessi nella documentazione attiva.

Il checker è read-only: segnala file, riga, target e tipo di problema, ma non riscrive i documenti.

## Validazioni storiche

Le validazioni storiche stanno in `docs/validations/` e restano separate dai documenti owner del comportamento corrente.

Ogni nuova validazione deve indicare almeno:

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

Quando un dato non è stato registrato dalla fonte, non deve essere ricostruito per inferenza.

Una validazione storica non viene usata come prova che lo stesso comportamento passi sulla baseline corrente.

## Materiale non canonico e archivio

`docs/archive/` è una radice non canonica per materiali storici, planning, brief o fonti future che l'utente ha deciso di preservare per uso successivo.

Può essere vuota o assente e non deve essere creata o popolata soltanto per soddisfare una descrizione documentale.

Il contenuto archive:

- non è documentazione tecnica canonica;
- non è un documento owner;
- non prova che una funzione sia implementata;
- non sostituisce registri, codice, test o validazioni;
- non viene incluso nelle pulizie documentali automatiche o generiche;
- non viene eliminato sulla sola base di duplicazione, età o assenza di link.

Una rimozione da `docs/archive/` richiede una task esplicita, una lista esatta dei file coinvolti e una decisione dell'utente. Le utility di cleanup runtime non operano sulla documentazione.

## Segreti e dati locali

Non inserire nella documentazione:

- cookie, token, password o API key;
- percorsi personali non necessari;
- profili browser;
- header sensibili;
- dump di rete;
- payload reali con dati sensibili;
- history, timeline o journal reali.

Usare placeholder:

```txt
<eventId>
<betfair-url>
<profile-dir>
<cdp-url>
```

## Coerenza dei registri

Prima di un checkpoint dei registri eseguire:

```bash
python scripts/check_registry_consistency.py
```

Il controllo confronta Blocchi E/F e schede owner, prefissi, stati strettamente incompatibili, SHA sintetici, ultimi ID, range, ultimo Punto e prossimo passo. Non rinumera o modifica alcun file.

## Procedura per modifiche documentali

Questa sezione descrive il passaggio documentale. Ruoli, modalità operative, tentativi, artefatti di consegna, revisione e criteri di chiusura appartengono al workflow esecutivo e al relativo documento sugli artefatti.

Procedura per una modifica documentale:

```txt
leggere owner e codice interessato
→ aggiornare il file .md completo
→ verificare contenuto e link
→ eseguire i checker e il profilo offline pertinente
→ applicare revisione e chiusura secondo il workflow esecutivo
→ pubblicare soltanto con working tree coerente
```

La migrazione MDX → Markdown è conclusa. La sola documentazione tecnica canonica corrente è sotto `docs/tennis-decision-ui/` e usa Markdown ordinario `.md`. Non creare una seconda radice documentale canonica.

## Checklist di chiusura

```txt
[ ] Percorso e nome corretti.
[ ] Markdown ordinario senza meta JavaScript.
[ ] Una responsabilità e un owner chiaro.
[ ] Stato coerente con il codice.
[ ] Nessuna funzione futura descritta come presente.
[ ] Endpoint, percorsi e comandi verificati.
[ ] Link relativi risolti.
[ ] Nessun duplicato di contratto.
[ ] Nessun segreto o dato runtime sensibile.
[ ] Validazioni storiche separate dagli owner.
[ ] Materiale archive non trattato come owner o target di cleanup generico.
[ ] Impatto sugli altri documenti dichiarato.
```

## Documenti collegati

- [Indice della documentazione](../index.md)
- [Selezione del contesto per AI](./01-context-selection.md)
- [Diagnosi e modularizzazione](./04-diagnosi-e-modularizzazione.md)
- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
- [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md)
- [Mappa del repository](../reference/01-repository-map.md)
- [Retention e pulizia dati](../operations/05-retention-and-cleanup.md)
- [Validazioni storiche](../../validations/README.md)
