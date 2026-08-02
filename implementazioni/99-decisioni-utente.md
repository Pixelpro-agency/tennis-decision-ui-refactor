# Tennis Decision UI — Decisioni strutturali dell’utente

## Scopo

Conserva soltanto decisioni che influenzano più aree, task o documenti.

## DEC-001 — Registro modulare

**Stato:** approvata.

```txt
Todo sintetica
+ registri tematici in implementazioni/
```

## DEC-002 — Audit prima delle modifiche

**Stato:** approvata.

```txt
documentazione e codice
→ classificazione
→ decisioni
→ task esecutive
```

## DEC-003 — Git sotto controllo dell’utente

**Stato:** approvata.

Commit e push vengono eseguiti materialmente soltanto dall’utente dopo revisione.

## DEC-004 — Documentazione tecnica in Markdown

**Stato:** approvata.

```txt
nuovi documenti: .md
non creare nuovi .mdx
```

Usare Markdown ordinario. Non usare frontmatter per default.

## DEC-005 — Planning come fonte separata

**Stato:** approvata ed eseguita sui materiali accessibili.

Planning e report storici non prevalgono sul codice corrente.

## DEC-006 — Consegna con file completi

**Stato:** approvata.

Preferire file completi o ZIP con manifest. Patch/script/comandi sono ammessi quando più adatti.

## DEC-007 — Metadata dei nuovi `.md`

**Stato:** approvata.

```txt
nessun export const meta
nessun JSX/MDX
nessun frontmatter predefinito
ordine tramite nomi numerici e indice
```

Introdurre frontmatter soltanto se un consumer tecnico reale lo richiede.

## DEC-008 — Rimozione Strategy

**Stato:** approvata.

Rimuovere le tre card Strategy e il relativo runtime/polling/backend esclusivo.

Preservare:

- Market Reactions;
- Field → Market;
- Market → Field;
- Evidence;
- Source Identity.

Le strategie future verranno studiate con strumenti autonomi offline (`IMPL-010`).

## DEC-009 — Rimozione `debug-last`

**Stato:** approvata come decisione tecnica.

Rimuovere la route e il codice senza producer. Non ripristinare un contenitore debug generico.

## DEC-010 — `selectionId` nel ramo Field → Market

**Stato:** approvata.

`selectionId` è obbligatorio per confrontare lo stesso runner nel ramo Field → Market.

Questa decisione:

- non cambia Source Identity;
- non confronta i due URL;
- non aggiunge blocchi a Start;
- non impedisce l’ingresso nel frontend;
- non cambia pending/mismatch/recording.

Quando manca l’ID degrada soltanto quel ramo Evidence con reason esplicita.

## DEC-011 — Una sola authority Source Identity

**Stato:** approvata.

```txt
useSourceIdentityGateUi
→ unica authority globale frontend
```

Rimuovere authority e controlli legacy concorrenti nel ramo Market Reactions.

## DEC-012 — Visibilità persistence

**Stato:** approvata.

```txt
stati locali nelle card
+
indicatore globale in fondo alla sidebar
+
modale di controllo complessivo
```

TopBar principalmente dedicata a SofaScore e Betfair.

## DEC-013 — Collaudi separati

**Stato:** approvata.

I collaudi approfonditi restano separati dai documenti owner e confluiscono in `docs/validations/`.

## DEC-014 — Cleanup offline robusto

**Stato:** approvata come direzione tecnica.

Usare:

- authority/lock project-owned;
- manifest e porte effettive;
- identificazione positiva dei servizi;
- fail-closed;
- recheck metadata;
- nessun kill-by-port.

## DEC-015 — Esclusioni planning

**Stato:** approvata.

Non leggere né classificare:

```txt
docs.rar
idee future.odt
idee per stream api betfair.odt
```

## DEC-016 — Quattro ruoli operativi

**Stato:** approvata.

```txt
Chat Analisi
Chat Esecutore
Desktop Esecutore
Desktop Collaudatore
```

La Chat Esecutore legge GitHub in sola lettura e consegna file, ZIP, patch Python o comandi da applicare.

## DEC-017 — UI minore e responsive

**Stato:** rinviata.

Registrare in Todo:

- piccole correzioni/rimozioni UI;
- responsive completo.

Non ampliare con questi lavori le prime task di robustezza.



## DEC-018 — Un solo backend writer

**Stato:** approvata.

```txt
un solo backend writer per repository
→ writer authority esclusiva backend-owned
→ acquisizione prima di recovery e listen
→ secondo backend bloccato
```

Il lock launcher resta separato e continua a proteggere l’orchestratore.

Non introdurre per ora:

- multi-writer;
- backend secondario read-only;
- kill-by-port;
- autorità dedotta dalla sola porta.


## DEC-019 — Autorità end-to-end della sessione live

**Stato:** approvata.

1. `trackingSessionId` distinta da `eventId`;
2. ogni nuovo Start invalida atomicamente il precedente;
3. Stop e mismatch condividono un cleanup completo SofaScore/Betfair;
4. `/api/match/untrack` e il relativo codice legacy vengono rimossi;
5. cleanup fisico parziale non viene mostrato come Stop completo;
6. tutti i poller frontend usano token, request ID, abort e guard;
7. Stop Live Tracking sospende tutti i poller e conserva gli ultimi dati in modalità statica;
8. la conferma Source Identity include `trackingSessionId` e rifiuta richieste stale;
9. un solo comando Start può essere corrente.

```txt
trackingSessionId
→ sessione logica

commandId
→ operazione asincrona

eventId
→ partita
```

La sessione precedente viene invalidata prima del cleanup e prima della creazione della successiva.
