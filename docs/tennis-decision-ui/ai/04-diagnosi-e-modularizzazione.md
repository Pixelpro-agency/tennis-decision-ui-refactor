# Diagnosi e modularizzazione

## Scopo

Questo documento definisce il metodo per diagnosticare responsabilità e confini nel codice esistente e per valutare se una divisione di file o moduli abbia un confine stabile e verificabile.

La diagnosi descrive lo stato corrente; una proposta di modularizzazione descrive un possibile target. Questo documento non autorizza modifiche, non prescrive un refactoring e non sostituisce il codice corrente, il documento owner del dominio o il [workflow esecutivo](./03-workflow-esecutivo.md).

## 1. Diagnosi del codice corrente

Prima di valutare una separazione, ricostruire la responsabilità reale del file o del modulo osservato.

Identificare soltanto ciò che è verificabile nel codice corrente:

- responsabilità primaria;
- owner del comportamento o del contratto;
- facade o entry point, quando presenti;
- export e contratti esposti;
- input;
- output;
- stato conservato e relativo lifecycle;
- side effect;
- dipendenze;
- consumer diretti;
- test associati e contesto necessario per verificarlo.

Separare sempre:

```txt
fatti verificati nel codice corrente
inferenze necessarie alla diagnosi
decisioni appartenenti a un eventuale target
```

Una decisione di modularizzazione non deve essere presentata come caratteristica già implementata.

## 2. Mappa della responsabilità

Per ogni file o modulo rilevante, annotare almeno:

| Campo                   | Domanda                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Responsabilità primaria | Quale risultato possiede?                                                                   |
| Owner                   | Quale componente o documento possiede il comportamento o il contratto?                      |
| Facade / entry point    | Esiste un punto pubblico di composizione o ingresso da preservare nella lettura end-to-end? |
| Export / contratti      | Quali funzioni, classi, oggetti o altri contratti espone?                                   |
| Input                   | Quali dati, dipendenze o segnali riceve?                                                    |
| Output                  | Quali valori, envelope, eventi o mutazioni produce?                                         |
| Stato                   | Quale stato conserva e per quanto tempo?                                                    |
| Side effect             | Quali filesystem, rete, processi, clock, log o altre operazioni esterne coinvolge?          |
| Dipendenze              | Da quali moduli o owner dipende?                                                            |
| Consumer                | Chi usa direttamente gli export o i contratti?                                              |
| Test                    | Qual è il test più vicino e quale contesto richiede?                                        |

La mappa descrive il codice corrente. Non deve contenere moduli, directory, contratti o dipendenze esistenti soltanto nel target proposto.

## 3. Classificazione

Quando utile alla diagnosi, classificare le responsabilità osservate in base al ruolo che svolgono realmente, per esempio:

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

La classificazione serve a rendere leggibili i confini esistenti. Non impone una nuova cartella, un nuovo modulo o una corrispondenza uno-a-uno fra categoria e file.

## 4. Quando valutare una divisione

La sola lunghezza del file non giustifica una divisione.

Una separazione merita valutazione quando cambia almeno uno dei confini seguenti:

- responsabilità;
- owner;
- export o contratto;
- input o output;
- stato o lifecycle;
- side effect;
- dipendenza;
- consumer;
- tipo di test;
- contesto minimo necessario per comprendere o verificare la responsabilità.

Sono segnali utili, per esempio:

- responsabilità indipendenti con owner distinti;
- logica pura e I/O che richiedono contesti di verifica differenti;
- stato runtime, policy o persistenza con lifecycle differenti;
- consumer che dipendono da contratti separabili;
- side effect concentrabili dietro un confine esplicito;
- test che possono verificare una responsabilità senza caricare il contesto dell’altra.

Non dividere quando l’estrazione crea passaggi intermedi senza owner, duplica contratti, rende opachi input e output o spezza un lifecycle che deve restare leggibile end-to-end.

## 5. Criteri per un confine proposto

Una proposta di modularizzazione deve rendere esplicito il confine che intende introdurre senza confonderlo con lo stato corrente.

Valutare in particolare se la proposta:

- lascia riconoscibile la facade, la composizione o l’entry point pubblico quando il relativo contratto deve restare stabile;
- assegna a ogni componente proposto una responsabilità nominabile;
- definisce input e output del confine;
- rende riconoscibili i side effect e gli eventuali adapter I/O;
- separa stato runtime, policy e persistenza soltanto quando i loro lifecycle sono realmente distinti;
- usa dependency injection soltanto quando il confine risultante rende le dipendenze esplicite o consente test deterministici senza I/O reale non necessario;
- censisce gli export pubblici e i consumer che dipendono dal contratto;
- evita cartelle, helper o livelli intermedi privi di ownership chiara;
- identifica quali test verificano il confine proposto;
- dichiara eventuali effetti su documenti owner e link senza eseguire qui la modifica.

La proposta può prevedere la preservazione di facade ed entry point durante un’eventuale migrazione, ma l’ordine di esecuzione, i file modificabili e i criteri di chiusura appartengono al workflow della task.

## 6. Verifica della proposta

Prima di considerare strutturalmente definita una modularizzazione, verificare:

```txt
[ ] Stato corrente e target proposto sono distinti.
[ ] Ogni modulo proposto ha una responsabilità nominabile.
[ ] L'owner di ogni contratto è identificabile e non duplicato.
[ ] Input, output e side effect sono espliciti.
[ ] Facade ed entry point sono censiti quando fanno parte del contratto osservabile.
[ ] Export pubblici e consumer diretti sono censiti.
[ ] Stato e lifecycle restano leggibili.
[ ] Dipendenze e confini di dependency injection sono espliciti quando pertinenti.
[ ] Esiste una strategia di test per ogni confine.
[ ] Il contesto minimo necessario per comprendere e verificare ogni responsabilità è identificabile.
[ ] Non sono state inventate directory o astrazioni prive di ownership.
[ ] La divisione non è motivata soltanto dalla lunghezza del file.
```

Questa verifica qualifica la proposta dal punto di vista strutturale. L’autorizzazione a implementarla, il metodo di consegna e la chiusura della task appartengono agli owner del workflow e degli artefatti esecutivi.

## Documenti collegati

- [Selezione del contesto per AI](./01-context-selection.md)
- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
- [Artefatti esecutivi e revisione](./05-artefatti-esecutivi.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Mappa del repository](../reference/01-repository-map.md)
