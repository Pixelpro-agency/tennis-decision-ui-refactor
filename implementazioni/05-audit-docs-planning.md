# Tennis Decision UI — Audit e pulizia delle fonti documentali locali

## Scopo

Questo registro chiude la classificazione dei materiali ricevuti fuori dalla
documentazione canonica e documenta la loro rimozione dopo consolidamento.

Baseline remota verificata:

```txt
2697f66ea8e17a9e35481299cb47ec402558df55
```

## Perimetro controllato

Sono stati riletti integralmente e confrontati con documenti canonici,
`implementazioni/`, Todo e test:

- brief Source Identity;
- prompt di navigazione e modularizzazione;
- backlog operativo del 4 luglio 2026;
- pacchetto e report Task 6;
- pacchetto launcher Task 2;
- planning replay/backtesting;
- planning Market Reactions Journal;
- `Idee Future.odt`;
- `Idee Per Stream API Betfair.odt`.

Prima della pulizia il repository documentale conteneva 64 file Markdown. Gli
otto Markdown archiviati e i due ODT non erano owner correnti.

## Esito per gruppo

| Fonte | Esito del confronto | Destinazione del contenuto utile | Decisione |
| --- | --- | --- | --- |
| Brief Source Identity | comportamento e verifiche già presenti | owner Source Identity/frontend e validation live | rimosso |
| Prompt navigazione/modularizzazione | regole già consolidate | context selection, workflow, linee guida AI, `IMPL-003` | rimosso |
| Backlog operativo | task completate o schede IMPL già presenti | audit codice, task completate, `IMPL-010`, `IMPL-012…015` | rimosso |
| Pacchetto/report Task 6 | contratti finali e finding già normalizzati | owner storage, task completate e registri | rimosso |
| Pacchetto launcher Task 2 | implementazione corrente e scenari aperti già tracciati | owner runtime, task completate e Todo | rimosso |
| Replay/backtesting | requisiti già coperti; output minimo integrato | `IMPL-012` e `IMPL-010` | rimosso |
| Market Reactions Journal | estensione futura non implementata | addendum futuro di `IMPL-023` | rimosso |
| Idee future | requisiti unici sintetizzati senza promuoverli a stato corrente | `IMPL-010`, `IMPL-012`, `IMPL-018`, `IMPL-023` | ODT rimosso |
| Stream API Betfair | ipotesi futura di attribuzione, da calibrare | addendum futuro di `IMPL-018` | ODT rimosso |

## Requisiti unici preservati

Sono stati conservati nei registri:

- Strategy Lab offline, versionato e riproducibile;
- Value Hypothesis ed External Evidence disabilitate fino a calibrazione e
  provenance verificabile;
- confronto descrittivo fra attività runner recente e cumulativa, senza
  trasformarlo in segnale;
- Stream API con `EX_TRADED`, offerte, timestamp, volume ambiguo e confidence;
- journal derivato Market Reactions soltanto per cambiamenti materiali;
- nessun fetch live durante replay, nessuna informazione futura, nessuna
  causalità o raccomandazione automatica.

## File Markdown mantenuti

Restano perché hanno un ruolo distinto:

- owner tecnici sotto `docs/tennis-decision-ui/`;
- evidenze sotto `docs/validations/`;
- registri e audit sotto `implementazioni/`;
- README di navigazione;
- README del runner;
- `docs/archive/README.md` come sola mappa delle fonti rimosse.

Non sono stati rimossi audit cumulativi o decisioni necessarie al lavoro futuro.

## Stato

```txt
LETTURA COMPLETA
CONSOLIDAMENTO COMPLETATO
PULIZIA FISICA COMPLETATA
LINK, REGISTRI E TEST DEL PACCHETTO VALIDATI
```

## Prossimo passo tecnico

```txt
IMPL-015 — writer authority esclusiva per match_history
```
