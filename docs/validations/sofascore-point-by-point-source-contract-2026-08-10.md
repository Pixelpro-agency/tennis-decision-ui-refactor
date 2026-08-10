# Validazione source contract SofaScore point-by-point — 2026-08-10

## Ambito e riproducibilità

Questa validazione usa esclusivamente la fixture sanitizzata versionata:

```text
backend/src/sofa/fixtures/pointByPoint.verified.fixture.mjs
```

Esecuzione:

```powershell
node backend/src/sofa/pointByPoint.test.mjs
node backend/src/sofa/localContext.test.mjs
node backend/src/sofa/buildSofaAnalysis.test.mjs
```

Non contiene URL, cookie, token o payload live raw.

## Proprietà confermate dalla fixture

- set e game sono rappresentati da interi positivi;
- i punti ordinari usano `0`, `15`, `30`, `40` e `A`;
- lo stato registrato rappresenta il punteggio dopo il punto;
- il winning point può essere inferito dalla transizione terminale;
- deuce e advantage sono rappresentati;
- il tie-break numerico osservato non appartiene al decoder ordinario e resta unsupported;
- array assente, game vuoto o transizione ambigua devono produrre unavailable.

## Proprietà non dimostrate

La fixture non dimostra:

- che l’ultima coppia `(set, game)` sia sempre il game corrente;
- che il game corrente sia sempre presente;
- ordinamento e unicità garantiti dal provider in ogni risposta;
- comportamento live durante cambio set;
- freshness o allineamento temporale rispetto agli altri endpoint.

Per questo il runtime valida ordine e unicità e richiede un’identità corrente esplicita prima di escludere un game. In assenza di tale evidenza restituisce `current_game_identity_unavailable` e `excludedCurrentGame=false`.

## Limite

Questo artefatto documenta ciò che è riproducibile dalla fixture disponibile. Un futuro collaudo live sanitizzato potrà aggiungere evidenza, ma non deve modificare il decoder finché il nuovo contratto non è archiviato e coperto da test.
