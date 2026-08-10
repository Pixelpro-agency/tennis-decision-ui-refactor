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

Gli stati si applicano al singolo scenario, non necessariamente all'intero documento:

| Stato | Significato |
| --- | --- |
| `live_observed` | comportamento osservato in un ambiente live identificato |
| `passed` | verifica eseguita con esito positivo |
| `failed` | verifica eseguita con esito negativo |
| `blocked` | verifica avviata ma impedita da un prerequisito dichiarato |
| `not_executed` | scenario non eseguito |
| `not_applicable` | scenario non applicabile al perimetro dichiarato |
| `historically_reported` | informazione presente nella fonte storica, priva di prova archiviata sufficiente |

`non registrato` indica un metadato assente nella fonte. `non archiviato` indica che l'osservazione è riferita ma manca un artefatto conservato. Nessuno dei due valori va ricostruito per inferenza.

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
run identity
```

Quando il documento sorgente non registrava un dato, scrivere `non registrato` senza ricostruirlo per inferenza.

La run identity è immutabile. Una riesecuzione produce un nuovo record o un nuovo artifact con data e identificatore stabili; non sovrascrive retroattivamente l'evidenza precedente.

## Documenti migrati

- [Verifica live Source Identity](./source-identity-live-verification.md)
- [Validazione live Betfair — 2026-07-04](./betfair-live-validation-2026-07-04.md)

## Verifiche di hardening

- [Commit journal hardening — 10 agosto 2026](./commit-journal-hardening-2026-08-10.md)
- [Local runtime hardening — 10 agosto 2026](./local-runtime-hardening-2026-08-10.md)

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
