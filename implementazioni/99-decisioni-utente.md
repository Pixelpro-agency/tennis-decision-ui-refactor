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


## DEC-022 — Evidence e Market Reactions verificati del Punto 5

**Stato:** approvata integralmente.

1. i tick `status-only` restano nella timeline per health e diagnostica, ma non generano nuovi Significant Flow, cluster, source event o Market Reaction;
2. Market Reactions usa una eligibility tecnica esplicita oltre a Source Identity e persistence integrity;
3. applicare `DEC-010`: nessun fallback sul nome nel ramo Field → Market quando manca `selectionId`;
4. estendere `selectionId` obbligatorio a tutti i confronti temporali dello stesso runner Betfair;
5. separare attività matched generale, variazione prezzo/volume del runner e osservazione qualificata;
6. un marker già presente prima del source market event non viene classificato come nuovo evento successivo;
7. separare età delle fonti, source skew, pipeline delay e gap baseline/first-post;
8. un timestamp futuro produce clock-skew/degradazione e non viene clampato a freshness zero;
9. conservare e confrontare la sorgente del prezzo;
10. introdurre un limite massimo versionato per la distanza baseline→anchor;
11. la qualità globale espone copertura esplicita dei due runner e non diventa completa con un solo runner affidabile;
12. Significant Flow usa una baseline runner-specific per `selectionId` e, separatamente, una baseline di mercato;
13. i cluster usano un gap temporale massimo, provenance dei tick, `selectionId` obbligatorio e nessun doppio conteggio;
14. le soglie Significant Flow correnti restano provvisorie, versionate, non calibrate e non operative fino al Punto 7;
15. separare `computed`, `inputAvailable`, `sourceEventAvailable`, `observationAvailable`, `observationDetected`, `provisional` e `stale`;
16. mantenere invariati `causalityClaimed:false` e `interpretation: temporal_proximity_only`.

### Confini

La decisione non introduce:

- strategie;
- segnali operativi;
- fair odds;
- suggerimenti di trade;
- attribuzione di intenzione ai trader;
- causalità dichiarata;
- nuovi blocchi a Start;
- nuove condizioni del Source Identity Gate;
- recovery o scritture dal builder Evidence;
- rimozione dei tick diagnostici dalla timeline.

### Strutture approvate

```txt
IMPL-022
→ Evidence temporal provenance and alignment policy

IMPL-023
→ Market Reaction eligibility e branch state

IMPL-024
→ Runner temporal identity e price comparability
```

### Relazioni

```txt
IMPL-018
→ produce acquisition provenance Betfair

IMPL-022
→ interpreta timestamp, freshness, skew e finestre

IMPL-024
→ rende affidabili identità runner e confronti prezzo

IMPL-023
→ decide eligibility e stato dei rami Market Reactions

IMPL-012/013
→ fixture, replay, baseline e calibrazione futura
```

### Ordine approvato

```txt
IMPL-018
→ IMPL-022
→ IMPL-024
→ IMPL-023
→ TEST-031…043
→ Punto 6 Frontend
→ Punto 7 test e strutture mancanti
→ definizione delle task esecutive prioritarie
```




## DEC-023 — Frontend session-scoped e UI integrity del Punto 6

**Stato:** approvata integralmente.

1. implementare il lato frontend della session authority approvata in `IMPL-006` attraverso `IMPL-025`;
2. dopo Start, `eventId` e `trackingSessionId` restituiti dal backend sono le uniche authority della sessione accettata;
3. la shell può mostrare lo stato `starting`, ma nessun poller live parte prima dell’accettazione backend;
4. Start fallito o ambiguo invalida il comando, cancella la sessione accettata, ferma le richieste transitorie e usa cleanup compensativo quando necessario;
5. tutti i poller live adottano il runtime session-scoped di `IMPL-026` con request ID, abort, disposed guard e nessuna riprogrammazione dopo cleanup;
6. Stop completo sospende SofaScore, Betfair, Evidence e Source Identity Gate, ferma gli alert live e conserva l’ultimo snapshot come `frozen`;
7. Stop con cleanup parziale viene mostrato come parziale e non come completato;
8. il polling Betfair parte soltanto quando la sessione accettata contiene una configurazione Betfair;
9. il polling Evidence parte soltanto quando la vista Market Reactions viene realmente consumata e fa un refresh immediato all’ingresso;
10. `IMPL-009` viene implementata con stato persistence locale per i consumer, indicatore globale nella sidebar e modale dettagliata bounded;
11. durante una degradazione integrity l’ultimo dato può restare visibile, ma deve essere marcato `last_verified`, `frozen` o `degraded` e non apparire live corrente;
12. TopBar, sidebar, card e badge derivano lo stato live dalla state machine e non dalla semplice presenza di dati;
13. lo status Source Identity espone un context ID opaco e la modale pending è legata a `trackingSessionId + sourceIdentityContextId`;
14. l’authority Source Identity legacy in Market Reactions viene rimossa dopo l’ultimo inventario dei consumer;
15. `IMPL-027` diventa l’adapter presentazionale unico delle card Market Reactions e deve rispettare `available`, provisional, quality, reasons e assenza di causalità;
16. ogni risultato Preflight è legato al fingerprint dell’input e viene invalidato quando l’input cambia;
17. le viste Strategy `Lay the Winner`, `Banca Servizio` e `Superbreak` vengono rimosse senza investirvi correzioni, preservando Market Reactions;
18. mojibake e piccole correzioni UI restano una task autonoma;
19. il responsive completo resta una task separata dopo le correzioni di robustezza, secondo `DEC-017`.

### Confini

La decisione non introduce:

- strategie;
- segnali operativi;
- recovery client-side;
- scritture frontend nelle timeline;
- riclassificazione autonoma della Betfair health;
- ricostruzione della Source Identity;
- calcolo Evidence nel browser;
- redesign responsive dentro la task sessione;
- correzione delle viste Strategy destinate alla rimozione.

### Strutture approvate

```txt
IMPL-025
→ Frontend live-session controller

IMPL-026
→ Polling runtime session-scoped

IMPL-027
→ Market Reactions frontend view model
```

### Strutture esistenti da completare

```txt
IMPL-006
→ session authority end-to-end

IMPL-009
→ adapter persistence e UI locale/globale

IMPL-023
→ branch state Market Reactions consumato dalla UI
```

### Ordine approvato

```txt
IMPL-006
→ IMPL-025
→ IMPL-026
→ IMPL-009
→ IMPL-027
→ TEST-044…058
→ cleanup legacy
→ correzioni minori
→ responsive + TEST-059
→ Punto 7
```


## DEC-024 — Sistema di validazione, fixture e baseline del Punto 7

**Stato:** approvata integralmente.

1. creare `IMPL-028` come prima struttura infrastrutturale del Punto 7;
2. non riscrivere in massa i test esistenti prima di introdurre il runner;
3. eseguire inizialmente ogni test legacy in un child process separato;
4. usare un manifest esplicito come unica lista eseguibile dei controlli;
5. mantenere Node `assert` o `node:test` per backend e utility nuove;
6. mantenere Python `unittest` e standardizzare gradualmente i nomi dei file;
7. introdurre Vitest, jsdom e React Testing Library per i lifecycle frontend;
8. escludere test live, browser reale, login e tracking dal profilo predefinito;
9. applicare timeout e serial group alle entry che condividono filesystem, porte o global state;
10. obbligare ogni test che scrive a usare una sandbox temporanea e a non toccare le directory runtime reali;
11. estendere `IMPL-003` come test map machine-checkable alimentata dal manifest;
12. distinguere sempre `planned`, `implemented`, `executed`, `passed`, `failed`, `blocked` e `live_observed`;
13. creare fixture condivise soltanto per contratti riusati e lasciare locali le factory piccole;
14. integrare `IMPL-008`, `IMPL-012` e `IMPL-013` come profili separati, senza fonderli in un mega-harness;
15. produrre attraverso `IMPL-031` un result artifact JSON bounded e redatto per ogni profilo;
16. mantenere `fileModificati.md` e il report umano dell’esecutore come output obbligatori quando previsti dal workflow;
17. non introdurre CI prima che il runner locale e il manifest siano deterministici;
18. non rendere il full lint un gate prima di avere una configurazione eseguibile e una baseline pulita;
19. estendere `IMPL-005` per verificare SHA, range ID e stato sintetico dei cinque registri.

### Confini

La decisione non introduce:

- browser o login automatici nei test offline;
- credenziali in CI;
- tracking live nel profilo predefinito;
- scritture nelle directory runtime reali;
- una migrazione massiva immediata dei test;
- una percentuale di coverage inventata;
- un unico mega-runner che incorpora fixture, replay, persistence e benchmark;
- sostituzione del report umano con un JSON;
- PASS automatici per TEST-ID soltanto documentati;
- full lint obbligatorio sul codice legacy non classificato.

### Strutture approvate

```txt
IMPL-028
→ manifest e runner canonico di validazione

IMPL-029
→ fixture catalog e sandbox condivisa

IMPL-030
→ frontend interaction test harness

IMPL-031
→ validation result ledger e artefatti JSON
```

### Strutture esistenti da estendere

```txt
IMPL-003
→ test map machine-checkable

IMPL-005
→ coerenza completa dei registri

IMPL-008
→ profilo persistence/recovery

IMPL-012
→ fixture e replay versionati

IMPL-013
→ benchmark e baseline ripetibili
```

### Ordine approvato

```txt
IMPL-005
→ IMPL-028
→ IMPL-029
→ IMPL-030
→ IMPL-003
→ IMPL-031
→ IMPL-008
→ IMPL-012
→ IMPL-013
→ TEST-060…075
→ eventuale CI offline
→ raggruppamento e priorità delle task Punti 1–7
```

