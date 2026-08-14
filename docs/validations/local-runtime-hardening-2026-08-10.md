# Local runtime hardening — verifica 10 agosto 2026

## Metadati

| Campo     | Valore                                          |
| --------- | ----------------------------------------------- |
| Data      | 10 agosto 2026                                  |
| Tipo      | Verifica automatica offline                     |
| SHA       | Non registrato; nessuna operazione Git eseguita |
| Perimetro | `LOCAL-RUNTIME-001…007`                         |
| Stato     | Completata con limiti documentati               |

## Scopo

Verificare identity working-copy/storage, discovery backend prima dello spawn, esito CLI, provenienza CDP, browser best-effort, ownership e binding frontend/backend.

## Esecuzione

```powershell
python -m unittest launcher.tests.test_launcher -q
python -m unittest launcher.tests.test_runtime_hardening -q
node backend/src/server.test.mjs
```

## Esito

- launcher: 237 test passati e 1 skipped;
- runtime hardening: 10 test passati;
- backend server: 32 test passati.

I casi interessati includono health incompleta, working copy differente, riuso coerente, discovery-before-spawn, browser failure non bloccante e assenza di ownership sui processi reused.

## Limiti

Non è stato eseguito un collaudo live con due working copy reali, browser interattivo o collisioni fra processi esterni reali.

## Documenti collegati

- [Runtime locale](../tennis-decision-ui/operations/01-local-runtime.md)
- [Entry point e runtime Python](../tennis-decision-ui/modules/python/01-entrypoints-and-runtime.md)
- [Writer authority](../tennis-decision-ui/modules/storage/05-writer-authority.md)
- [Controllo tracking live](../tennis-decision-ui/operations/02-live-tracking-control.md)
- [Indice delle validazioni](./README.md)
