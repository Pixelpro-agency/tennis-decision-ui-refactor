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

## DEC-020 — Hardening e autorità Betfair del Punto 3

**Stato:** approvata integralmente.

1. rimuovere `GET /api/betfair/odds` e il codice esclusivo, senza sostituto provvisorio, preservando `/latest`, `/json`, quote, book, ladder, Graph e Betfair health raccolti dal tracking;
2. creare `IMPL-016`, autorità globale dei comandi Betfair;
3. creare `IMPL-017`, confine locale delle API di controllo;
4. usare un validatore Betfair unico in preflight, Start, login e future diagnostiche;
5. rendere il preflight Graph identico al contratto runtime;
6. derivare il probe CDP dalla runtime identity della sessione e non dalla query di `/latest`;
7. creare `IMPL-018`, acquisition envelope e provenance temporale;
8. eliminare il fallback sintetico `marketTotalMatched / runnerCount`;
9. rendere la network capture tracked, bounded, drenata e cancellabile;
10. disabilitare sempre la cache nel tracking; future diagnostiche usano hash, runtime identity, Graph fingerprint e schema version;
11. rimuovere dal default i flag Chromium indebolenti, salvo necessità dimostrata e configurata;
12. applicare `IMPL-011` prima di un cleanup `apply` reale e introdurre policy separate per cache, log runtime e network dump.

### Confine della rimozione `/odds`

La rimozione non elimina:

- quote correnti presenti nei tick del tracking;
- book back/lay;
- ladder;
- last traded price;
- volumi realmente forniti;
- dashboard Betfair;
- API read-only `latest` e `json`.

Non viene creato ora un polling quote alternativo ogni 5–10 secondi. Un futuro flusso ad alta frequenza sarà valutato con le Stream API Betfair.

### Confine del volume runner

Viene eliminata soltanto la stima inventata:

```txt
marketTotalMatched / numeroRunner
```

Quando il volume runner manca:

```txt
null/unavailable
→ nessuna stima
→ calcoli dipendenti soppressi con reason
```

I valori reali di mercato, runner, Graph e quote restano invariati.

## DEC-021 — Autorità storage e recovery verificata del Punto 4

**Stato:** approvata integralmente.

1. qualsiasi pending che coinvolge la shared history blocca nuovi commit SofaScore e Betfair dello stesso evento;
2. la shared history viene preservata per ora; non viene trasformata immediatamente in read model derivato;
3. ogni documento marcato complete viene verificato anche quando l’altro documento è ancora pending;
4. documenti e journal introducono schema, revision, head commit, expected base revision e digest;
5. un journal invalido non attribuibile produce modalità read-only `integrity_unknown` e blocca i writer;
6. l’endpoint shared history espone integrity aggregata SofaScore, Betfair, journal globale e document read status;
7. `latestSofaState` e `latestBetfairState` avanzano soltanto dopo commit riuscito e vengono ricostruiti al bootstrap;
8. missing, invalid JSON, invalid schema, I/O failure e ambiguity diventano stati distinti;
9. eventId canonico numerico e target confinement sono regole dello Storage;
10. più file dello stesso evento producono `ambiguous_storage` e nessuna scelta automatica;
11. nessun cambio immediato del formato full-document prima della baseline `IMPL-013`;
12. i writer raw non journalizzati vengono rimossi o resi interni dopo l’inventario finale dei consumer;
13. le conferme Source Identity restano in uno store separato e atomico, sotto la backend writer authority;
14. la recovery registra i tentativi, applica escalation esplicita a `recovery_failed` e consente rearm manuale verificato.

### Confini

La decisione non autorizza ancora:

- conversione automatica di tutti i file legacy;
- eliminazione della shared history;
- database embedded;
- NDJSON o segmentazione;
- fsync obbligatorio su ogni tick;
- cancellazione automatica dei journal invalidi;
- writer secondario read-only separato;
- recovery avviata dopo il listen.

### Autorità risultanti

```txt
IMPL-015
→ backend writer authority per repository

IMPL-006
→ session authority della callback live

IMPL-016
→ Betfair runtime command authority

IMPL-019
→ event persistence authority

IMPL-020
→ identità e verifica dei documenti

IMPL-021
→ stato globale e policy recovery
```

### Ordine approvato

```txt
writer authority
→ event persistence authority
→ canonical document contract
→ verified recovery
→ recovery control plane
→ UI persistence
→ baseline storage
→ eventuale evoluzione formato
```

