# Tennis Decision UI — Audit e pulizia delle fonti documentali locali

> **Closeout storico:** questo file descrive il checkpoint conclusivo dell’audit, del consolidamento e della pulizia delle fonti planning e locali. La baseline usata per il confronto finale è `2697f66ea8e17a9e35481299cb47ec402558df55`; il commit `3de08ca09ac7cf3d64533b2e72b8f61d1d32f196` applica e registra il cleanup, ma non sostituisce la baseline del confronto.

> Gli stati, le destinazioni e il prossimo passo riportati di seguito appartengono a quel checkpoint. Lo stato operativo corrente vive nella Todo, negli owner IMPL e nel registro root; le decisioni correnti sulla precedente area `docs/archive/` vivono in `DEC-026` e `DEC-027`.

## Scopo

Questo registro chiude la classificazione dei materiali ricevuti fuori dalla documentazione canonica e documenta la loro rimozione dopo il consolidamento dei contenuti utili.

Non è una roadmap, non possiede la policy corrente di archiviazione e non determina lo stato corrente delle implementazioni.

Baseline remota verificata per il confronto:

```txt
2697f66ea8e17a9e35481299cb47ec402558df55
```

Commit di cleanup e registrazione del closeout:

```txt
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
```

## Perimetro controllato

Nel checkpoint sono stati riletti integralmente e confrontati con i documenti canonici, i registri sotto `implementazioni/`, la Todo e i test pertinenti:

- brief Source Identity;
- prompt di navigazione e modularizzazione;
- backlog operativo del 4 luglio 2026;
- pacchetto e report Task 6;
- pacchetto launcher Task 2;
- planning replay/backtesting;
- planning Market Reactions Journal;
- `Idee Future.odt`;
- `Idee Per Stream API Betfair.odt`.

Prima della pulizia, la copia documentale esaminata conteneva 64 file Markdown. Gli otto Markdown archiviati e i due ODT non erano owner correnti. Questi numeri descrivono il perimetro del checkpoint, non un inventario del repository attuale.

## Esito per gruppo

| Fonte                               | Esito del confronto al checkpoint                               | Destinazione del contenuto utile                          | Decisione   |
| ----------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- | ----------- |
| Brief Source Identity               | comportamento e verifiche già presenti                          | owner Source Identity/frontend e validation live          | rimosso     |
| Prompt navigazione/modularizzazione | regole già consolidate                                          | context selection, workflow, linee guida AI, `IMPL-003`   | rimosso     |
| Backlog operativo                   | task completate o schede IMPL già presenti                      | audit codice, task completate, `IMPL-010`, `IMPL-012…015` | rimosso     |
| Pacchetto/report Task 6             | contratti finali e finding già normalizzati                     | owner storage, task completate e registri                 | rimosso     |
| Pacchetto launcher Task 2           | implementazione osservata e scenari aperti già tracciati        | owner runtime, task completate e Todo                     | rimosso     |
| Replay/backtesting                  | requisiti già coperti dai registri; output minimo integrato     | `IMPL-012` e `IMPL-010`                                   | rimosso     |
| Market Reactions Journal            | estensione futura non implementata                              | addendum futuro di `IMPL-023`                             | rimosso     |
| Idee future                         | requisiti unici sintetizzati senza promuoverli a stato corrente | `IMPL-010`, `IMPL-012`, `IMPL-018`, `IMPL-023`            | ODT rimosso |
| Stream API Betfair                  | ipotesi futura di attribuzione, da calibrare                    | addendum futuro di `IMPL-018`                             | ODT rimosso |

## Requisiti unici preservati

Nel checkpoint, i seguenti requisiti sono stati conservati nei registri come direzioni future o vincoli, non come funzionalità implementate:

- Strategy Lab offline, versionato e riproducibile;
- Value Hypothesis ed External Evidence disabilitate fino a calibrazione e provenance verificabile;
- confronto descrittivo fra attività runner recente e cumulativa, senza trasformarlo in segnale;
- Stream API con `EX_TRADED`, offerte, timestamp, volume ambiguo e confidence;
- journal derivato Market Reactions soltanto per cambiamenti materiali;
- nessun fetch live durante replay, nessuna informazione futura, nessuna causalità o raccomandazione automatica.

Il loro eventuale stato successivo deve essere verificato negli owner IMPL e nella Todo correnti.

## Destinazioni documentali al checkpoint

Al termine del consolidamento, i ruoli distinti erano ripartiti fra:

- owner tecnici sotto `docs/tennis-decision-ui/`;
- evidenze sotto `docs/validations/`;
- registri e audit sotto `implementazioni/`;
- README di navigazione;
- README del runner;
- `docs/archive/README.md`, inizialmente mantenuto come mappa delle fonti rimosse.

Successivamente, `DEC-027` ha consolidato quella mappa nel record di migrazione e nei registri owner e ha registrato la rimozione anche del README e della directory vuota. Questo closeout non è quindi l’owner di una policy archive corrente e non richiede la ricreazione di `docs/archive/`.

Non furono rimossi audit cumulativi, validation utili o decisioni necessarie al lavoro successivo.

## Stato del checkpoint

```txt
LETTURA COMPLETA
CONSOLIDAMENTO COMPLETATO
PULIZIA FISICA COMPLETATA
LINK, REGISTRI E TEST DEL PACCHETTO VALIDATI
```

La validation associata documenta anche controlli eseguiti sulla working tree reale; non va interpretata come prova generale che ogni test o collaudo del repository sia stato eseguito.

## Prossimo passo registrato al checkpoint

```txt
IMPL-015 — writer authority esclusiva per match_history
```

Questo era il prossimo passo al momento del cleanup. Non rappresenta il prossimo passo corrente: per quello prevalgono la Todo, gli owner IMPL e il registro root.
