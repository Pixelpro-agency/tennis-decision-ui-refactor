# Convenzioni della documentazione

## Scopo

Questo documento definisce come scrivere, collocare, aggiornare e verificare la documentazione tecnica di Tennis Decision UI.

La documentazione deve spiegare responsabilità, confini, contratti, invarianti, stato reale e verifica. Non deve diventare una copia integrale del codice né una raccolta di funzionalità future.

## Radici documentali

| Percorso | Ruolo |
| --- | --- |
| `docs/tennis-decision-ui/` | Documentazione tecnica canonica e corrente |
| `docs/validations/` | Collaudi e verifiche storiche con data, SHA, ambiente e limiti |
| `docs/archive/` | Registro delle fonti consolidate; eventuali materiali successivi non canonici |
| `implementazioni/` | Audit, proposte e decisioni; non sostituisce gli owner tecnici |

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

| Area | Responsabilità |
| --- | --- |
| `architecture/` | Confini e flussi trasversali, senza duplicare i moduli |
| `api/` | Contratti HTTP realmente esposti |
| `modules/` | Responsabilità e invarianti dei moduli |
| `operations/` | Procedure operative correnti |
| `ai/` | Contesto AI e convenzioni documentali |
| `reference/` | Mappe e riferimenti di orientamento |
| `roadmap/` | Solo stato corrente e priorità approvate; non specifiche speculative |

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

| Stato | Significato |
| --- | --- |
| `Implementato` | Codice e comportamento esistono |
| `Implementato, da validare` | Codice presente ma mancano verifiche reali rilevanti |
| `Deprecato` | Codice o documento ancora presente ma non deve essere esteso |
| `Legacy` | Conservato soltanto per confronto o migrazione |
| `Storico` | Risultato di una verifica passata, non contratto corrente |

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

Quando una capacità manca, descrivere il limite corrente senza presentare la soluzione approvata come già disponibile.

Esempio:

```txt
Stato corrente: lo Start restituisce eventId e non una trackingSessionId.
```

Non scrivere:

```txt
Lo Start restituisce trackingSessionId.
```

finché il codice non lo implementa.

## Documentazione e codice nella stessa task

Quando una task modifica un comportamento osservabile, aggiornare nello stesso scope i documenti owner coinvolti, se già migrati.

Aggiornamento obbligatorio quando cambia:

- endpoint, payload o status;
- CLI o JSON su stdout;
- ownership di processi o sessioni;
- persistenza o recovery;
- Source Identity o Evidence;
- polling e stato frontend;
- percorso canonico;
- test o procedura di verifica rilevante.

Se l'owner non è ancora migrato, registrare l'impatto documentale e finalizzarlo insieme al relativo batch comportamentale.

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

Il gate deve restare verde: target, anchor e riferimenti legacy `.mdx` non sono ammessi nella documentazione attiva.

Il checker è read-only: segnala file, riga, target e tipo di problema, ma non riscrive i documenti.

## Validazioni storiche

Un report di collaudo deve stare in `docs/validations/` e contenere almeno:

- data;
- SHA verificato;
- ambiente;
- precondizioni;
- passaggi;
- risultato;
- finding;
- limiti;
- stato finale.

Un report storico non viene usato come prova che lo stesso comportamento passa sullo SHA corrente.

## Materiale deprecato e archivio

`docs/archive/` non è un deposito permanente. Una fonte storica separata viene mantenuta soltanto quando contiene evidenza o requisiti unici non ancora assorbiti.

Un file deve essere eliminato quando:

- il contenuto unico è stato trasferito nel relativo owner, registro o validation;
- nessun link o consumer lo usa;
- la provenienza resta descritta nel registro dell'archivio;
- il controllo finale è positivo.

Non mantenere due owner concorrenti, prompt esecutivi superati o copie integrali di backlog già consolidati.

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

## Migrazione MDX → Markdown

Procedura per una modifica documentale:

```txt
leggere owner e codice interessato
→ aggiornare il file .md completo
→ verificare contenuto e link
→ eseguire i checker e il profilo offline pertinente
→ pubblicare soltanto con working tree coerente
```

Non esiste un workspace di migrazione permanente né una seconda documentazione canonica.

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
[ ] Impatto sugli altri documenti dichiarato.
```

## Documenti collegati

- [Indice della documentazione](../index.md)
- [Selezione del contesto per AI](./01-context-selection.md)
- [Mappa del repository](../reference/01-repository-map.md)
