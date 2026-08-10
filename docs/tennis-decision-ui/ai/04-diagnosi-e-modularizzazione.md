# Diagnosi e modularizzazione

## Scopo

Questo documento definisce come diagnosticare una responsabilità tecnica e valutare la divisione di un file o di un modulo. Non autorizza modifiche e non sostituisce il documento owner del dominio, il codice corrente o il [workflow esecutivo](./03-workflow-esecutivo.md).

## 1. Evidenze iniziali

Prima di proporre una correzione o un’estrazione, identificare:

- sintomo osservato;
- comportamento atteso e comportamento corrente;
- condizioni di riproduzione;
- owner del comportamento;
- input e output;
- stato coinvolto e sua durata;
- side effect;
- dipendenze;
- consumer diretti;
- test esistenti e gap di copertura.

Separare sempre fatti verificati, inferenze e decisioni ancora mancanti.

## 2. Mappa della responsabilità

Per ogni file o modulo annotare:

| Campo                   | Domanda                                            |
| ----------------------- | -------------------------------------------------- |
| Responsabilità primaria | Quale risultato possiede?                          |
| API pubblica            | Quali export o contratti espone?                   |
| Stato                   | Quale stato conserva e per quanto tempo?           |
| I/O                     | Quali filesystem, rete, processi, clock o log usa? |
| Dipendenze              | Da quali owner dipende?                            |
| Consumer                | Chi usa il contratto?                              |
| Verifica                | Qual è il test più vicino?                         |

## 3. Classificazione

Classificare le responsabilità osservate come:

```txt
facade o orchestratore
logica pura
adapter I/O
persistenza
stato runtime
policy
fixture o helper
test unitario
test di integrazione
test di sicurezza o recovery
```

La classificazione descrive il codice esistente; non implica automaticamente una nuova cartella o un nuovo modulo.

## 4. Quando dividere

La divisione è giustificata quando esiste almeno un confine stabile e verificabile, per esempio:

- responsabilità indipendenti con owner diversi;
- logica pura mescolata a I/O che impedisce test mirati;
- stato runtime mescolato a policy o persistenza;
- consumer che richiedono contratti distinti;
- lifecycle differenti nello stesso file;
- modifiche ricorrenti che coinvolgono porzioni non correlate.

La sola lunghezza del file non basta. Non dividere quando l’estrazione crea passaggi intermedi senza owner, duplica contratti o nasconde un lifecycle che deve restare leggibile end-to-end.

## 5. Regole di estrazione

- lasciare nel file principale la facade, la composizione o l’entry point;
- estrarre funzioni pure lungo confini di input e output espliciti;
- isolare filesystem, rete, processi, clock e log dietro adapter riconoscibili;
- separare stato runtime, policy e persistenza quando hanno lifecycle diversi;
- usare dependency injection quando rende i test deterministici e riduce I/O reale;
- preservare gli export pubblici finché i consumer non sono migrati;
- evitare cartelle generiche o livelli intermedi senza owner chiaro;
- aggiornare documenti owner, link e test insieme al nuovo confine.

## 6. Verifica della proposta

Prima di approvare una modularizzazione, verificare:

```txt
[ ] Ogni modulo proposto ha una responsabilità nominabile.
[ ] Input, output e side effect sono espliciti.
[ ] L’owner di ogni contratto è unico.
[ ] Gli export pubblici e i consumer sono censiti.
[ ] Il lifecycle rimane leggibile.
[ ] Esiste una strategia di test per ogni confine.
[ ] Non sono state inventate directory prive di ownership.
[ ] La proposta distingue stato corrente e target.
```

## Documenti collegati

- [Selezione del contesto per AI](./01-context-selection.md)
- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
- [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Mappa del repository](../reference/01-repository-map.md)
