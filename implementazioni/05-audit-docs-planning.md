# Tennis Decision UI — Audit differito di `docs/planning`

## Scopo

`docs/planning` è una fonte storica e progettuale separata, non la fonte primaria dello stato corrente.

### 7.5 Trattamento di `docs/planning`

La directory:

```txt
docs/planning/
```

contiene materiali relativi a implementazioni vecchie, future o pianificate.

Non deve essere letta in blocco nella fase iniziale dell’audit, perché potrebbe:

- aumentare inutilmente il contesto;
- mescolare stato corrente, intenzioni passate e proposte future;
- indurre a considerare implementato ciò che era soltanto pianificato;
- riaprire task già concluse sulla base di specifiche superate;
- condizionare il confronto iniziale fra codice attuale e documentazione canonica.

Ordine approvato:

```txt
1. documentazione canonica corrente
2. codice corrente
3. test e collaudi
4. discrepanze rilevate
5. docs/planning come fonte storica e progettuale separata
```

Quando verrà analizzata, ogni voce di `docs/planning` dovrà essere classificata come:

```txt
SUPERATA
REALIZZATA
PARZIALMENTE REALIZZATA
ANCORA VALIDA
FUTURA
DA DECIDERE
DUPLICATA ALTROVE
NON PIÙ PERTINENTE
```

`docs/planning` non è fonte primaria dello stato attuale. Può essere usata per:

- recuperare requisiti utili non confluiti nella documentazione canonica;
- verificare task dichiarate completate;
- individuare implementazioni rimaste incompiute;
- distinguere decisioni abbandonate da evoluzioni ancora valide;
- preservare informazioni importanti prima di eventuale archiviazione o cleanup.

La lettura deve avvenire per gruppi tematici e non come caricamento indiscriminato dell’intera cartella.

## Procedura operativa

1. completare prima l’audit della documentazione canonica;
2. completare il confronto con il codice corrente;
3. inventariare `docs/planning`;
4. leggere i file per gruppi tematici;
5. collegare ogni piano all’area tecnica corrispondente;
6. confrontarlo con codice, test e documenti owner;
7. registrare il risultato nel registro analitico e nella Todo.

## Classificazioni ammesse

```txt
SUPERATA
REALIZZATA
PARZIALMENTE REALIZZATA
ANCORA VALIDA
FUTURA
DA DECIDERE
DUPLICATA ALTROVE
NON PIÙ PERTINENTE
```

## Criterio di chiusura

Ogni file planning deve avere una classificazione, un collegamento all’area tecnica e una decisione su mantenimento, archivio, riscrittura o eliminazione.
