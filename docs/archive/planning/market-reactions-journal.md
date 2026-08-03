# Market Reactions Journal — planning archiviato

> **Documento non canonico. Funzionalità non implementata.**
>
> Conservato dalla precedente roadmap durante il Batch 2. Non prova l'esistenza di file, route, persistenza o UI storica.

## Intento storico

La proposta prevedeva un registro derivato delle osservazioni Market Reactions prodotte durante il live:

```txt
timeline canoniche
→ Market Reactions live
→ journal derivato
→ consultazione storica
→ replay o export
```

Le timeline sarebbero rimaste la fonte primaria per i ricalcoli. Il journal avrebbe conservato soltanto ciò che il sistema aveva osservato durante la sessione live.

## Eventi materiali proposti

Un record sarebbe stato creato o aggiornato soltanto per:

1. creazione di una nuova osservazione;
2. aggiornamento materiale di una finestra;
3. chiusura di una finestra;
4. risultato finale;
5. indisponibilità o cambiamento Source Identity su un'osservazione già identificata;
6. cambiamento materiale del summary.

Polling invariati non avrebbero creato nuovi record. Pending o mismatch senza una chiave stabile non avrebbero generato un record autonomo.

## Lifecycle proposto

```txt
created
→ in_progress
→ completed | insufficient_data | not_available
```

`completed` avrebbe indicato soltanto la chiusura delle finestre, non una causalità dimostrata.

## Identità proposta

La chiave di deduplicazione avrebbe incluso almeno:

```txt
eventId
sourceType
source timestamp
source sequence o equivalente
market epoch signature
```

`sourceType` avrebbe distinto `market_led` e `field_led`.

## Struttura minima proposta

```json
{
  "journalId": "stable-id",
  "eventId": "<eventId>",
  "sourceType": "field_led",
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>",
  "status": "completed",
  "sourceIdentity": {
    "status": "aligned",
    "epochSignature": "<signature>"
  },
  "sourceEvent": {},
  "observationWindows": [],
  "summary": {},
  "reasons": [],
  "interpretation": "temporal_proximity_only",
  "causalityClaimed": false
}
```

Il record non avrebbe contenuto timeline complete, payload browser, segreti, copie integrali dello snapshot, deduzioni causali o segnali operativi.

## Persistenza proposta

Il percorso non era stato deciso. La proposta richiedeva separazione da timeline, conferme Source Identity e dump diagnostici, con scrittura atomica e deduplicazione controllata.

## Route e frontend proposti

Era stata ipotizzata, senza implementazione, la route:

```txt
GET /api/evidence/:eventId/market-reactions/history
```

La lettura avrebbe dovuto essere lazy, paginabile o limitata e read-only: nessun tracking, fetch live, browser, ricalcolo completo o nuova scrittura.

La vista storica avrebbe dovuto:

- essere caricata soltanto su richiesta;
- mostrare lifecycle, finestre, quality e reasons;
- distinguere live e storico;
- mantenere `causalityClaimed:false`;
- non creare un secondo polling live;
- non ricostruire Evidence nel browser.

## Invarianti proposte

Il journal non avrebbe dovuto:

- modificare timeline o history;
- sostituire il replay;
- aggirare Source Identity;
- rendere validi dati assenti o stale;
- dedurre intenzione o causalità;
- diventare una strategia;
- salvare dump o segreti.

## Verifiche previste

```txt
stessa osservazione → un record
nessun record per polling invariato
chiusura finestra → update materiale
pending/mismatch con chiave → not_available con reason
pending/mismatch senza chiave → nessun record
timeline immutate
nessun fetch live nella lettura storica
nessun duplicato dopo riavvio
causalityClaimed sempre false
```

## Stato alla data di archiviazione

Non esistevano journal, route o UI storica. I requisiti utili restano nei registri e dovranno essere rivalutati soltanto quando inizierà una task di implementazione reale.

## Documenti correnti

- [Stato corrente](../../tennis-decision-ui/roadmap/01-current-state.md)
- [Market Reactions](../../tennis-decision-ui/modules/evidence/04-market-reactions.md)
- [Match Evidence Snapshot](../../tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md)
