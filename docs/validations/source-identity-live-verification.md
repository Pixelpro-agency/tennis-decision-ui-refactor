# Verifica live Source Identity

## Metadati

| Campo | Valore |
| --- | --- |
| Tipo | Osservazione live manuale |
| Periodo | Osservazioni consolidate fino al 4 luglio 2026 |
| SHA | Non registrato nel documento sorgente |
| Sorgente migrata | `docs/validations/source-identity-live-verification.md` |
| Stato | Parziale: alcuni flussi osservati, pending reale non verificato |

## Scopo

Registrare ciò che è stato osservato nel browser per Source Identity e frontend. Questo documento non definisce il contratto del gate o della persistenza.

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
GET timeline SofaScore disponibile
```

## Osservazioni riferite ma non archiviate

È stato riferito che durante buffering, con timeline SofaScore non ancora disponibile, la TopBar mostrava `Sofa: In attesa` senza errore di polling. Non sono stati archiviati screenshot, payload o log sufficienti; il caso non viene presentato come evidenza riproducibile.

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

Da verificare anche:

- pending prodotto da fonti plausibilmente correlate;
- nessuna modale su runner estraneo e mismatch;
- assenza di URL, marketId e selectionId nella modale;
- toast verde una sola volta per transizione;
- bootstrap fallito che lascia il gate pending con errore sicuro.

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

## Limite noto osservabile

Il bootstrap cross-source non è transazionale:

```txt
commit SofaScore riuscito
→ commit Betfair fallito
→ gate torna pending
→ tick SofaScore non rollbackato
```

Il documento sorgente registrava questo limite come contratto corrente, non come evento live riprodotto nella stessa validazione.

## Interpretazione

Stato dei casi:

| Caso | Stato |
| --- | --- |
| collecting → recording | `live_observed` |
| mismatch → form | `live_observed` |
| correzione → nuovo Start → aligned | `live_observed` |
| TopBar Connected con timeline | `live_observed` |
| buffering → In attesa | osservazione riferita, artefatto non archiviato |
| pending reale → confirm | non eseguito |
| pending reale → decline | non eseguito |

## Documenti owner correnti

- [Source Identity](../tennis-decision-ui/modules/evidence/02-source-identity.md)
- [Sessione e shell frontend](../tennis-decision-ui/modules/frontend/01-session-shell.md)
- [Polling e view model](../tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md)
- [Controllo tracking live](../tennis-decision-ui/operations/02-live-tracking-control.md)
