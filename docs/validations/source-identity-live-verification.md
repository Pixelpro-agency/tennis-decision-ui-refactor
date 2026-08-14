# Verifica live Source Identity

## Metadati

| Campo            | Valore                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Tipo             | Osservazione live manuale storica                                                              |
| Periodo          | Osservazioni consolidate fino al 4 luglio 2026                                                 |
| SHA              | Non registrato nel documento sorgente                                                          |
| Sorgente migrata | `docs/tennis-decision-ui/operations/06-source-identity-live-verification.mdx`                  |
| Stato            | Parziale: alcuni flussi osservati; pending reale, conferma e decline non verificati end-to-end |

## Scopo

Registrare ciò che è stato osservato nel browser durante la campagna storica relativa a Source Identity e alla relativa UI.

Questo documento non definisce il contratto corrente del gate, della persistenza o della session shell. Il comportamento corrente appartiene ai documenti owner elencati in fondo. Le verifiche sul codice successive alla campagna non modificano retroattivamente lo stato probatorio delle osservazioni qui registrate.

## Classificazione delle evidenze

| Stato                   | Significato                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `live_observed`         | Comportamento osservato direttamente durante la campagna live                        |
| `historically_reported` | Comportamento riferito, ma privo di screenshot, payload o log archiviati sufficienti |
| `not_executed`          | Scenario non eseguito end-to-end durante la campagna live                            |

## Osservazioni confermate

### Collecting → recording

È stato osservato:

```txt
shell immediata
→ indicatore Source Identity grigio
→ recording / aligned
→ indicatore verde
→ toast verde temporaneo
→ dashboard dopo dashboardContentReady + dashboardData
```

La dashboard non è stata sbloccata direttamente dal solo stato `recording/aligned`.

### Mismatch

È stato osservato:

```txt
mismatch
→ toast rosso
→ ritorno al form
→ campi preservati
```

### Correzione e nuovo Start

Nella stessa sessione browser è stato osservato:

```txt
mismatch
→ correzione dei link
→ nuovo Start
→ collecting
→ aligned
→ dashboard normale
```

Il toast mismatch precedente non è rimasto nella nuova sessione. Nel restart il toast verde non è stato osservato, mentre indicatore verde e registrazione sono stati confermati.

### Stato con timeline disponibile

Il 4 luglio 2026 sono stati osservati:

```txt
Source Identity recording / canonical / aligned
TopBar Sofa: Connected
GET /api/match/:eventId/json → 200
```

## Osservazioni riferite ma non archiviate

È stato riferito che durante buffering, con timeline SofaScore non ancora disponibile, la TopBar mostrava `Sofa: In attesa`.

L'assenza di errori di polling e l'eventuale risposta `404` non furono verificate. Non sono stati archiviati screenshot, payload o log sufficienti; il caso resta `historically_reported` e non viene presentato come evidenza riproducibile.

## Scenari non verificati

### Pending reale e conferma

Non è stata osservata una sessione reale completa con:

```txt
phase=pending
→ nomi reali nella modale
→ conferma manuale
→ bootstrap riuscito
→ recording/aligned
→ dashboard
```

Non sono stati verificati live neppure:

- pending prodotto da fonti plausibilmente correlate;
- assenza della modale su runner estraneo e mismatch;
- assenza di URL, `marketId` e `selectionId` nella modale;
- toast verde una sola volta per transizione;
- bootstrap fallito che lascia il gate pending con errore sicuro.

Il fatto che il progetto contenga oggi logiche e test relativi a questi comportamenti non costituisce evidenza live per questa campagna storica.

### Decline

Non è stato osservato end-to-end:

```txt
pending
→ decline
→ stop globale
→ ritorno al form
→ campi preservati
→ nessun toast mismatch
```

## Limite cross-source registrato

Il documento sorgente registrava il bootstrap cross-source come non transazionale:

```txt
commit SofaScore riuscito
→ commit Betfair fallito
→ gate torna pending
→ tick SofaScore non rollbackato
```

Questo limite era riportato come contratto corrente della sorgente storica, non come evento riprodotto durante la stessa campagna live. Non viene quindi classificato come `live_observed`.

## Interpretazione

| Caso                                                                 | Stato della campagna                                                 |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| collecting → recording                                               | `live_observed`                                                      |
| mismatch → form                                                      | `live_observed`                                                      |
| correzione → nuovo Start → aligned                                   | `live_observed`                                                      |
| TopBar Connected con timeline e `GET /api/match/:eventId/json → 200` | `live_observed`                                                      |
| buffering → In attesa                                                | `historically_reported`                                              |
| pending reale → confirm                                              | `not_executed`                                                       |
| pending reale → decline                                              | `not_executed`                                                       |
| pending plausibile                                                   | `not_executed`                                                       |
| mismatch senza modale                                                | `not_executed`                                                       |
| privacy della modale                                                 | `not_executed`                                                       |
| toast singolo per transizione                                        | `not_executed`                                                       |
| bootstrap failure con ritorno a pending                              | `not_executed`                                                       |
| limite cross-source non transazionale                                | contratto storicamente registrato; non osservato live nella campagna |

## Limiti della campagna

- La working tree esatta della sessione live non è registrata.
- Alcune osservazioni manuali non dispongono di screenshot, payload o log archiviati.
- Le verifiche statiche e automatiche successive restano separate dalle osservazioni live storiche.
- Una futura campagna live deve essere registrata in un artifact separato, senza aggiornare retroattivamente gli esiti di questa campagna.

## Documenti owner correnti

- [Source Identity](../tennis-decision-ui/modules/evidence/02-source-identity.md)
- [Sessione e shell frontend](../tennis-decision-ui/modules/frontend/01-session-shell.md)
- [Polling e view model](../tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md)
- [Controllo tracking live](../tennis-decision-ui/operations/02-live-tracking-control.md)
