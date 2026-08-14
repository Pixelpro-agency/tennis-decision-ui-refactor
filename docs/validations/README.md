# Validazioni storiche

Questa cartella conserva osservazioni manuali, collaudi e verifiche eseguite in un ambiente e in un momento specifici.

I file qui presenti sono evidenze storiche. Non sono documenti owner del comportamento corrente e non sostituiscono il codice, i test automatici, i runbook operativi o una nuova esecuzione sulla baseline corrente.

## Interpretazione

Una validazione storica può dimostrare soltanto:

- cosa è stato eseguito o osservato;
- in quale data o periodo;
- su quale baseline o SHA, quando registrato;
- in quale ambiente;
- con quali azioni, risultati, limiti e artefatti disponibili.

Non dimostra automaticamente che lo stesso comportamento sia ancora valido sul commit corrente.

La presenza di un test nel repository non prova che sia stato eseguito. Un esito storico non equivale a un PASS corrente. Un'osservazione live non equivale a un test automatico.

## Stati

Gli stati di scenario descrivono i singoli casi verificati. Lo stato complessivo di un documento deve riassumere il perimetro della run senza sostituire gli stati dei singoli scenari.

| Stato di scenario       | Significato                                                                      |
| ----------------------- | -------------------------------------------------------------------------------- |
| `live_observed`         | comportamento osservato manualmente in un ambiente live identificato             |
| `passed`                | verifica eseguita con esito positivo                                             |
| `failed`                | verifica eseguita con esito negativo                                             |
| `blocked`               | verifica avviata ma impedita da un prerequisito dichiarato                       |
| `not_executed`          | scenario previsto nel perimetro ma non eseguito                                  |
| `not_applicable`        | scenario non pertinente al perimetro dichiarato                                  |
| `historically_reported` | informazione presente nella fonte storica, priva di prova archiviata sufficiente |

`live_observed` e `passed` non sono intercambiabili: il primo qualifica un'osservazione manuale live, il secondo una verifica eseguita con esito positivo nel contesto dichiarato.

I qualificatori relativi alle informazioni mancanti restano distinti dagli stati:

| Qualificatore     | Significato                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| `non registrato`  | il metadato non era presente nella fonte                                |
| `non archiviato`  | l'osservazione è riferita, ma non è disponibile un artefatto conservato |
| `non applicabile` | il metadato non è pertinente alla run o allo scenario                   |

Un dato assente non deve essere ricostruito per inferenza.

## Metadati richiesti

Ogni nuova validazione deve indicare:

```txt
data o periodo
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

Quando un documento sorgente non registrava un dato, scrivere `non registrato`. Quando il dato non è pertinente, scrivere `non applicabile`. Se un'osservazione è riferita ma la relativa prova non è stata conservata, indicarla come `non archiviato` e non promuoverla a evidenza riproducibile.

La run identity è stabile e immutabile. Una riesecuzione produce un nuovo record o un nuovo artifact con data e identificatore propri; non sovrascrive né modifica retroattivamente l'evidenza precedente.

## Indice degli artifact

### Osservazioni live migrate

- [Verifica live Source Identity](./source-identity-live-verification.md)
- [Validazione live Betfair — 4 luglio 2026](./betfair-live-validation-2026-07-04.md)

### Verifiche offline e di hardening

- [Commit journal hardening — 10 agosto 2026](./commit-journal-hardening-2026-08-10.md)
- [Local runtime hardening — 10 agosto 2026](./local-runtime-hardening-2026-08-10.md)
- [Source contract SofaScore point-by-point — 10 agosto 2026](./sofascore-point-by-point-source-contract-2026-08-10.md)

### Migrazione documentale

- [Chiusura della migrazione documentale — 3 agosto 2026](./documentation-migration-finalization-2026-08-03.md)

L'indice elenca soltanto artifact presenti nella cartella. Un'osservazione priva di artifact non deve essere aggiunta come validation eseguita e non richiede la creazione di un placeholder.

## Regole di conservazione

- non usare una validazione storica come specifica del comportamento futuro o come owner del comportamento corrente;
- non modificare un risultato storico per allinearlo al codice successivo;
- aggiungere un nuovo artifact quando il comportamento viene rieseguito;
- mantenere distinti lo stato complessivo del documento, gli stati dei singoli scenari e i qualificatori dei metadata mancanti;
- non presentare `live_observed` come equivalente a un PASS automatico;
- non usare la presenza di test automatici come prova della loro esecuzione;
- non usare un artifact storico come prova riferita al commit corrente senza una nuova esecuzione su quella baseline;
- non duplicare in questo README lo schema o la cronologia del result ledger;
- conservare il contesto ambientale necessario a interpretare l'evidenza, senza includere segreti, URL completi, cookie, token, identificatori sensibili, path personali o payload diagnostici raw non necessari.

## Documenti collegati

- [Validazione e rollback](../tennis-decision-ui/operations/04-validation-and-rollback.md) — workflow corrente, runner, provenance e rollback.
- [Stato corrente](../tennis-decision-ui/roadmap/01-current-state.md) — riepilogo corrente del progetto; non sostituisce gli artifact storici.
