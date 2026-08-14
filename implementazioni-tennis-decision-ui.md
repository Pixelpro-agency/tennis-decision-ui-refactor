# Tennis Decision UI — Registro operativo della revisione

## Scopo

Questo file è il punto di ingresso corrente per la revisione tecnica e documentale di **Tennis Decision UI**.

Serve a:

- dichiarare le baseline usate per la revisione;
- collegare la Todo sintetica ai registri analitici;
- distinguere attività concluse, decisioni approvate, lavoro ancora aperto e risultati di verifica;
- orientare la selezione della prossima task;
- evitare che note di migrazione, artifact di una singola run o cronologie operative diventino documentazione permanente.

Non sostituisce il codice, i test, la documentazione tecnica canonica, la Todo, le schede owner, il decision log o le validation.

## Baseline della revisione

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch canonico: main
Code authority: 12b344ea96e71b2bdaa6931c98419ce925b5c228
Documentation structure baseline: 4c5f43b007149f3210c27d7565357a447a3a6ef4
```

Il **Code authority** è l’autorità per codice, test, script, configurazioni e comportamento implementato.

La **Documentation structure baseline** è usata soltanto per recuperare forma, ordine, granularità e convenzioni del registro. Non costituisce autorità tecnica e non descrive automaticamente lo stato corrente.

Gli SHA storici riportati nei registri collegati conservano il significato assegnato dalle rispettive schede. Non vengono promossi da questo indice a baseline corrente né usati per attribuire una provenienza non verificata a registri o artifact di validazione.

## Fonti correnti

### Stato operativo

- [Todo list corrente](./todo-list-tennis-decision-ui.md)
- [Indice dei registri analitici](./implementazioni/README.md)
- [Metodo, stati e regole](./implementazioni/00-metodo-e-stati.md)
- [Piano generale dell’audit](./implementazioni/01-piano-generale-audit.md)
- [Decisioni dell’utente](./implementazioni/99-decisioni-utente.md)

### Registri analitici

- [Audit della documentazione](./implementazioni/02-audit-documentazione.md) — indice di 4 moduli;
- [Audit del codice](./implementazioni/03-audit-codice.md) — indice di 7 moduli;
- [Ricontrollo delle task completate](./implementazioni/04-task-completate.md);
- [Audit dei materiali planning](./implementazioni/05-audit-docs-planning.md);
- [Implementazioni proposte](./implementazioni/06-implementazioni-proposte.md) — indice di 7 moduli.

### Documentazione tecnica e validation

- [Indice canonico](./docs/tennis-decision-ui/index.md)
- [Validazioni correnti](./docs/validations/)

La documentazione canonica descrive il comportamento reale. I registri possiedono finding, decisioni, limiti, task approvate e lavoro futuro. Le validation conservano prove riferite a run identificate e non diventano, da sole, autorità permanente sullo stato corrente.

`docs/archive/` non è presente nella baseline corrente. Le fonti utili sono state consolidate e le copie rimosse secondo `DEC-026`; `DEC-027` chiarisce che la mappa di provenienza è stata assorbita nel record di migrazione e nei registri owner e che la directory non deve essere ricreata automaticamente.

## Stato complessivo

### Audit e revisione

```txt
Audit documentazione B1–B6
→ completato nel perimetro registrato

Audit statico del codice
→ completato nel perimetro registrato

Secondo audit Punti 1–7
→ concluso e approvato

Ricontrollo D1–D18
→ checkpoint storico completato

Decisioni di prodotto, cleanup e workflow
→ registrate nel decision log
```

Gli esiti storici non descrivono automaticamente il comportamento di commit successivi. Per lo stato operativo prevalgono la Todo e le schede owner; per il comportamento implementato prevalgono codice e test della code authority.

### Documentazione e registri

```txt
Migrazione .mdx → .md
→ completata strutturalmente
→ documenti canonici finali in Markdown ordinario
→ file legacy sostituiti e rimossi dopo i controlli previsti

Allineamento semantico
→ attività distinta dalla migrazione strutturale
→ ogni documento resta verificabile contro il codice corrente

Fonti duplicate
→ contenuti utili assorbiti negli owner, nei registri o nelle validation
→ copie ridondanti rimosse

Modularizzazione
→ audit documentazione: 4 moduli
→ audit codice: 7 moduli
→ implementazioni proposte: 7 moduli
→ file root mantenuti come indici stabili
→ documento corrente mantenuto come entry point unico e compatto
```

### Implementazioni concluse

- `IMPL-001` — checker read-only dei link documentali;
- `IMPL-004` — separazione delle evidenze storiche utili in `docs/validations/`;
- `IMPL-005` — checker read-only di coerenza Todo ↔ registri, esteso ai metadata sintetici;
- `IMPL-015` — autorità esclusiva del writer di `match_history`, con test automatici; il collaudo live multi-processo resta distinto;
- `IMPL-028` — manifest e runner canonico di validazione locale, validati per i profili effettivamente configurati;
- `IMPL-032` — pipeline di migrazione documentale per batch e normalizzazione dei registri.

Le decisioni documentali correnti includono `DEC-025`, `DEC-026` e il chiarimento superseding `DEC-027`.

## Verifiche registrate

I registri collegati riportano un checkpoint con checker dei registri, checker dei link, profilo di validazione `fast` e `git diff --check` positivi. Conteggi, data, SHA e artifact di quella esecuzione appartengono alla relativa run e non vengono duplicati qui come garanzia corrente.

Prima di chiudere un nuovo checkpoint documentale devono essere eseguiti i controlli prescritti da [Metodo, stati e regole](./implementazioni/00-metodo-e-stati.md) e deve essere conservato un esito riferibile alla run effettiva.

## Limiti ancora aperti

- nessuna nuova task tecnica è selezionata automaticamente da questo indice;
- la prima serie di task esecutive non è conclusa;
- varie coperture e strutture di test restano approvate ma non implementate;
- il collaudo manuale con due backend reali concorrenti non risulta eseguito;
- `SOFA-001` richiede ancora una verifica live;
- restano aperte le aree session authority, Betfair authority, storage/recovery, Evidence provenance, frontend session-scoped e fixture/harness;
- la provenienza di una baseline validata dei registri e di un eventuale artifact associato non è dichiarata come risolta senza una fonte verificata.

## Aree per la prossima task

1. session authority end-to-end, Start/Stop e polling session-scoped;
2. autorità globale Betfair e local control plane;
3. storage event-scoped, document contract e recovery verificata;
4. provenance temporale, eligibility e Market Reactions;
5. fixture, sandbox, frontend harness e result ledger;
6. hardening diagnostico, retention e cleanup offline.

L’elenco orienta la scelta ma non assegna automaticamente priorità esecutiva. L’ordine definitivo deve essere deciso nella Todo e nelle schede owner prima di preparare un prompt operativo.

## Regole di manutenzione

- ogni ID owner vive in una sola scheda dettagliata;
- la Todo mantiene una sola riga sintetica per ogni ID owner;
- gli indici collegano le schede senza duplicarle;
- policy, attività concluse, decisioni approvate e risultati di verifica restano categorie distinte;
- una voce approvata non viene descritta come implementata;
- una funzione futura non diventa documentazione canonica;
- la conclusione strutturale della migrazione non prova l’allineamento semantico di ogni documento;
- lo storico delle revisioni è affidato ai commit Git;
- una futura area archive richiede una nuova decisione esplicita e non viene ricreata per inerzia;
- i materiali non canonici utili devono avere owner o destinazione dichiarati e non costituiscono prova di implementazione;
- gli artifact di validazione dichiarano almeno run, baseline, data, ambiente ed esito, oppure restano esplicitamente non attribuiti;
- non conservare artefatti temporanei di migrazione fuori dagli spazi intenzionalmente preservati dopo la verifica finale;
- conservare checker, test e validation utili al controllo corrente;
- dopo modifiche ai registri eseguire registry checker, link checker, il profilo `fast` applicabile e `git diff --check`.

## Prossimo passo

Prossimo passo: DA SELEZIONARE.
