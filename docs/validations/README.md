# Validazioni storiche

Questa cartella conserva osservazioni manuali, collaudi e verifiche eseguite in un ambiente e in un momento specifici.

I file qui presenti non sono documenti owner del comportamento corrente e non sostituiscono codice, test automatici o runbook operativi.

## Interpretazione

Una validazione storica può dimostrare soltanto:

- cosa è stato eseguito o osservato;
- in quale data;
- su quale SHA, quando registrato;
- con quale ambiente;
- quali limiti e artefatti erano disponibili.

Non dimostra automaticamente che lo stesso comportamento sia ancora valido sul commit corrente.

## Metadati richiesti

Ogni nuova validazione deve indicare:

```txt
data
baseline o SHA
ambiente
scopo
comandi o azioni
risultati osservati
scenari non osservati
artefatti disponibili
limiti
```

Quando il documento sorgente non registrava un dato, scrivere `non registrato` senza ricostruirlo per inferenza.

## Documenti migrati

- [Verifica live Source Identity](./source-identity-live-verification.md)
- [Validazione live Betfair — 2026-07-04](./betfair-live-validation-2026-07-04.md)

## Regole

- non usare una validazione come specifica futura;
- non modificare il risultato storico per allinearlo al codice nuovo;
- aggiungere una nuova validazione quando il comportamento viene rieseguito;
- mantenere distinti `passed`, `live_observed`, `blocked` e `not executed`;
- non includere URL, cookie, token, nomi sensibili o payload completi non necessari.

## Documenti collegati

- [Validazione e rollback](../tennis-decision-ui/operations/04-validation-and-rollback.md)
- [Stato corrente](../tennis-decision-ui/roadmap/01-current-state.md)

## Migrazione documentale

- [Chiusura della migrazione documentale — 3 agosto 2026](./documentation-migration-finalization-2026-08-03.md)
