# Tennis Decision UI — Registro operativo della revisione

## Scopo

Questo file è il punto di ingresso corrente per la revisione tecnica e documentale di **Tennis Decision UI**.

Serve a:

- indicare la baseline verificata;
- collegare la Todo sintetica ai registri analitici;
- distinguere il lavoro completato dalle implementazioni ancora aperte;
- orientare la preparazione delle prossime task;
- evitare che note di migrazione o cronologie operative diventino documentazione permanente.

Non sostituisce il codice, i test, i documenti tecnici canonici o i collaudi.

## Baseline verificata

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch canonico: main
SHA codice verificato: aefc0ba5894d8fca60e5811088fede3ebbfde98a
SHA base del recupero documentale: 8f936d1a3686b775e967e375576f52f19da461a5
Commit di applicazione del recupero: 2ebe7e8ad0935bf0195679452d2e54e1de4d63dc
Data del recupero documentale: 2026-08-06
Nota: 8f936d1 è la base del recupero; 2ebe7e8 è il commit che lo applica. Il codice applicativo verificato resta aefc0ba.
```

Il recupero documentale è stato pubblicato nel commit `2ebe7e8`.

## Fonti correnti

### Stato operativo

- [Todo list corrente](./todo-list-tennis-decision-ui.md)
- [Indice dei registri analitici](./implementazioni/README.md)
- [Metodo, stati e regole](./implementazioni/00-metodo-e-stati.md)
- [Piano generale dell’audit](./implementazioni/01-piano-generale-audit.md)
- [Decisioni dell’utente](./implementazioni/99-decisioni-utente.md)

### Registri analitici

- [Audit della documentazione](./implementazioni/02-audit-documentazione.md) — 4 moduli;
- [Audit del codice](./implementazioni/03-audit-codice.md) — 7 moduli;
- [Ricontrollo delle task completate](./implementazioni/04-task-completate.md);
- [Audit dei materiali planning](./implementazioni/05-audit-docs-planning.md);
- [Implementazioni proposte](./implementazioni/06-implementazioni-proposte.md) — 7 moduli.

### Documentazione tecnica

- [Indice canonico](./docs/tennis-decision-ui/index.md)
- [Validazioni correnti](./docs/validations/)
- `docs/archive/` — materiali storici o futuri non canonici conservati intenzionalmente per uso successivo.

La documentazione canonica descrive il comportamento reale. I registri contengono finding, decisioni, limiti, task approvate e lavoro futuro. `docs/archive/` non è un owner tecnico e il suo contenuto non attesta che una funzione sia implementata.

## Stato complessivo

### Audit e revisione

```txt
Audit documentazione B1–B6
→ completato

Audit statico del codice
→ completato

Punto 7 completato
→ secondo audit Punti 1–7 concluso e approvato

Ricontrollo D1–D18
→ completato

Decisioni di prodotto, cleanup e workflow
→ registrate
```

### Documentazione e registri

```txt
Migrazione .mdx → .md
→ completata
→ 40 file legacy sostituiti e rimossi
→ link strict verificati

Fonti duplicate
→ contenuti utili assorbiti nei registri o nelle validations
→ copie ridondanti rimosse

Modularizzazione
→ 02-audit-documentazione.md: 4 moduli
→ 03-audit-codice.md: 7 moduli
→ 06-implementazioni-proposte.md: 7 moduli
→ percorsi indice stabili
→ owner ID preservati
```

### Implementazioni concluse

- `IMPL-001` — link checker;
- `IMPL-005` — coerenza Todo ↔ registri e scansione ricorsiva;
- `IMPL-015` — writer authority esclusiva `match_history`;
- `IMPL-028` — manifest e runner canonico di validazione;
- `IMPL-032` — migrazione documentale per batch.

Le decisioni più recenti sintetizzate includono `DEC-025` e `DEC-026`.

## Risultati dell’ultimo controllo

```txt
registry checker tests
→ 18 PASS

nested registry tests
→ 2 PASS

registry consistency
→ 240 owner ID
→ 214 righe Todo
→ 0 errori
→ 0 warning

documentation links
→ 72 file
→ 428 link
→ 0 errori
→ 0 warning

validation fast
→ 6 PASS
→ 0 failure
→ 0 timeout

git diff --check
→ PASS
```

## Limiti ancora aperti

- nessuna nuova task tecnica è stata ancora selezionata;
- la prima serie di task esecutive non è conclusa;
- vari test richiesti risultano ancora mancanti;
- il collaudo manuale con due backend reali concorrenti non risulta eseguito;
- `SOFA-001` richiede ancora una verifica live;
- restano aperte le aree session authority, Betfair authority, storage/recovery, Evidence provenance, frontend session-scoped e fixture/harness.

## Priorità da cui scegliere la prossima task

1. session authority end-to-end, Start/Stop e polling session-scoped;
2. autorità globale Betfair e local control plane;
3. storage event-scoped, document contract e recovery verificata;
4. provenance temporale, eligibility e Market Reactions;
5. fixture, sandbox, frontend harness e result ledger;
6. hardening diagnostico, retention e cleanup offline.

L’ordine definitivo deve essere deciso prima di preparare il prompt esecutivo.

## Regole di manutenzione

- ogni ID owner vive in una sola scheda dettagliata;
- la Todo contiene una sola riga sintetica per ogni ID owner;
- gli indici non duplicano le schede;
- una voce approvata non viene descritta come implementata;
- una funzione futura non diventa documentazione canonica;
- lo storico delle revisioni è affidato ai commit Git;
- i materiali non canonici dichiarati utili dall’utente possono essere conservati in `docs/archive/`;
- `docs/archive/` non viene trattato come owner corrente né incluso nelle pulizie automatiche o generiche;
- non conservare artefatti temporanei di migrazione fuori dagli spazi intenzionalmente preservati dopo la verifica finale;
- conservare checker, test e validations che servono al controllo corrente;
- dopo modifiche ai registri eseguire registry checker, link checker, profilo `fast` e `git diff --check`.

## Prossimo passo

Prossimo passo: DA SELEZIONARE.
