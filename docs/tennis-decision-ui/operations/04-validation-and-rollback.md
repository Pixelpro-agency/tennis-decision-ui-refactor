# Validazione e rollback

## Scopo

Questo runbook definisce come verificare una modifica e come annullarla senza confondere test presenti, test eseguiti, build, osservazioni live e stato della persistenza.

Il repository dispone di un runner locale canonico basato su manifest per la superficie offline già registrata. I test legacy restano processi separati: il runner non li importa nello stesso processo e non li riscrive.

Il manifest iniziale non equivale ancora a una mappa completa di ogni test presente. L’espansione test ↔ owner ↔ documento appartiene a `IMPL-003`; il ledger storico degli esiti appartiene a `IMPL-031`.

## Semantica dei risultati

| Stato            | Significato                                                   |
| ---------------- | ------------------------------------------------------------- |
| `planned`        | Controllo richiesto ma non ancora implementato                |
| `implemented`    | Test o controllo presente nel repository                      |
| `executed`       | Comando eseguito sulla working tree corrente                  |
| `passed`         | Esecuzione conclusa con esito positivo                        |
| `failed`         | Esecuzione conclusa con errore                                |
| `blocked`        | Non eseguibile per dipendenza o ambiente mancante             |
| `live_observed`  | Comportamento osservato manualmente in una sessione specifica |
| `not_applicable` | Controllo non pertinente alla modifica                        |

Regole:

```txt
file presente ≠ test eseguito
esecuzione storica ≠ PASS corrente
build verde ≠ UI verificata
osservazione live ≠ test automatico
status HTTP corretto ≠ recovery verificata
```

## Sequenza minima

```txt
modifica
→ controllo sintattico o statico mirato
→ test più vicino
→ test del confine attraversato
→ build o smoke test quando necessario
→ verifica live soltanto se dipende da browser o fonte reale
→ report
```

Non eseguire l’intero progetto per una modifica locale quando non esiste una ragione di confine.

## Scelta dei controlli

| Area modificata    | Controllo minimo corrente                                                           |
| ------------------ | ----------------------------------------------------------------------------------- |
| Modulo Node puro   | `node --check <file>` quando applicabile e test `*.test.mjs` vicino                 |
| Router Express     | Test response/route e, per contratti critici, HTTP reale su porta dinamica          |
| Persistenza        | Test writer, journal, recovery, processor e route read-only coinvolta               |
| Betfair            | Test processor, lifecycle, health, read model e Python                              |
| Frontend utility   | Test Node puro della utility                                                        |
| Frontend integrato | Test disponibili, build Vite e controllo browser mirato                             |
| Python             | `py_compile` o `compileall`, import mirato e `unittest` esistente                   |
| Launcher           | `launcher.tests.test_launcher` e scenario operativo quando necessario               |
| Documentazione     | Markdown, link, owner, stato corrente, UTF-8 e assenza di segreti                   |

## Runner canonico

Manifest e comando:

```txt
scripts/validation/test-manifest.json
scripts/validation/run.mjs
```

Dalla root:

```bash
node scripts/validation/run.mjs fast
node scripts/validation/run.mjs backend
node scripts/validation/run.mjs frontend
node scripts/validation/run.mjs python
node scripts/validation/run.mjs full-offline
```

Elenco senza esecuzione:

```bash
node scripts/validation/run.mjs --list
```

Profili correnti:

| Profilo        | Stato        | Regola                                               |
| -------------- | ------------ | ---------------------------------------------------- |
| `fast`         | implementato | nessun browser, credenziale, rete esterna o tracking |
| `backend`      | implementato | test backend offline registrati                      |
| `frontend`     | implementato | test Node registrati e build Vite                    |
| `python`       | implementato | compileall e unittest enumerati esplicitamente       |
| `full-offline` | implementato | tutte le entry offline abilitate, in serie           |
| `persistence`  | pianificato  | dipende da IMPL-008                                  |
| `benchmark`    | pianificato  | dipende da IMPL-013                                  |
| `live`         | pianificato  | mai implicito o incluso per default                  |

Un profilo pianificato restituisce exit code `2`. Non viene contato come saltato o passato.

Il runner esegue:

```txt
preflight completo
→ child process separato per entry
→ timeout esplicito
→ stdout/stderr redatti e limitati
→ exit code normalizzato
→ artefatto test-results/<timestamp>-<sha>-<profile>.json
```

Codici di uscita:

| Codice | Significato                                                     |
| -----: | --------------------------------------------------------------- |
| `0`    | tutte le entry selezionate sono passate                         |
| `1`    | almeno una entry è fallita o è andata in timeout                |
| `2`    | errore d’uso, manifest/path non valido o profilo non eseguibile |

Un path mancante è un errore di configurazione rilevato prima di avviare la suite.

### Esecuzione mirata fuori profilo

Un controllo singolo resta valido durante una task stretta:

```bash
node backend/src/sofa/matchTracker.test.mjs
node frontend/src/hooks/useMatchPolling.test.mjs
python -m unittest -v scrapers.betfair.graph_url_test
npm --prefix frontend run build
```

Il comando diretto non aggiorna l’artefatto del runner e non prova l’intero profilo.

### Documentazione e registri

Checker diretti:

```bash
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
```

Il manifest del runner usa lo stesso gate strict per il link checker:

```txt
${PYTHON}
scripts/check_documentation_links.py
--forbid-mdx-links
```

Quindi i profili `fast` e `full-offline` devono fallire anche in presenza di riferimenti legacy `.mdx`, non soltanto per target o anchor mancanti.

I checker non correggono automaticamente file, ID o link.

## Persistenza e recovery

Per modifiche a writer, journal o recovery verificare almeno:

```txt
pending creato prima dei target
→ history completata / timeline completata
→ partial osservabile su failure
→ recovery usa payload e target journalizzati
→ nessun nuovo commitId durante repair
→ nessun tick o row aggiuntivo durante repair
→ completed residual verificato prima della rimozione
→ invalid journal gestito senza scritture arbitrarie
→ route read-only senza side effect
```

Usare directory temporanee e fixture controllate. Non manipolare manualmente history, timeline o journal reali.

Un `409 persistence_integrity` verifica la lettura pubblica di uno stato già noto; non dimostra che la recovery funzioni.

### Test modulari reali

I vecchi file monolitici:

```txt
backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs
```

non esistono nella tree corrente e non devono essere indicati nei runbook o nei documenti API.

La copertura è modularizzata, con test presenti quali:

```txt
backend/src/sofa/matchHistory/commitJournal/lifecycle.test.mjs
backend/src/sofa/matchHistory/commitJournal/integrityStatus.test.mjs
backend/src/sofa/matchHistory/commitJournal/payloadSafety.test.mjs
backend/src/sofa/matchHistory/commitJournal/residualRecovery.test.mjs
backend/src/sofa/matchHistory/commitJournal/filesystem.integration.test.mjs
backend/src/sofa/matchHistory/recovery/basicRecovery.integration.test.mjs
backend/src/sofa/matchHistory/recovery/completedTargetVerification.integration.test.mjs
backend/src/sofa/matchHistory/recovery/invalidJournal.integration.test.mjs
backend/src/sofa/matchHistory/recovery/retryAndFailure.integration.test.mjs
```

La presenza di questi test significa:

```txt
copertura modulare presente
≠
inventario completo nel manifest
≠
profilo persistence implementato
≠
PASS sul commit corrente
```

Il manifest iniziale non registra ancora tutta la superficie journal/recovery. La ricostruzione dell’inventario e l’harness isolato restano aperti sotto `IMPL-003`, `IMPL-008` e `IMPL-029`.

Non descrivere quindi la copertura come assente; descrivere come incompleta la sua catalogazione e orchestrazione canonica.

## Source Identity

Per modifiche al gate o alla conferma:

- testare aligned, pending, mismatch e not-applicable;
- verificare che campioni Betfair tecnicamente invalidi non aggiornino il gate;
- verificare che una conferma accetti soltanto il contesto previsto;
- usare store e dipendenze fake;
- non usare il file runtime delle conferme come fixture;
- verificare che timeline storiche restino immutate.

Le verifiche pending reali richiedono una sessione live e devono essere archiviate come `live_observed`.

## Betfair e Money Flow

Verificare:

- errore tecnico senza `finished`;
- `hasFinished` esplicito;
- deduplicazione e regressioni;
- continuità per `selectionId`;
- ladder Graph e fallback book depth;
- health unknown, degraded e alert;
- volumi anomali soppressi;
- tick `status-only` limitato al logout Graph esplicito;
- assenza di network capture nel tracking ordinario.

Una sessione live passata non copre automaticamente URL malformate, errore rete reale, mercato concluso o login inizialmente scaduto.

## Frontend

La verifica corrente copre utility pure e build, ma manca un harness completo di lifecycle React.

Per sessione o polling distinguere:

```txt
Start richiesto
Start accettato o fallito
shell visibile
poller attivi
Stop richiesto
poller fermati
response tardiva ignorata o applicata
nuova sessione
```

### Persistence integrity frontend

Stato reale da verificare:

```txt
useMatchPolling
→ conserva integrity
→ serverStatus partial_persistence | recovery_failed

useBetfairJson
→ conserva integrity

App.jsx e useDashboardViewModel
→ non propagano ancora integrity

useMarketReactionEvidence
→ conserva solo marketReactionEvidence
→ non conserva wrapper integrity/sources
```

Non dichiarare implementata una UI persistence completa finché non esistono wiring e test React dedicati.

## Documentazione

Per ogni batch documentale verificare:

- file previsti e nessun file estraneo;
- UTF-8;
- un H1 per documento;
- fence bilanciate;
- link relativi risolvibili;
- nessun `export const meta` nei `.md`;
- nessun segreto o path personale;
- nessuna funzione futura descritta come implementata;
- nessun `.mdx` o link legacy nella documentazione attiva;
- indice, manifest e owner coerenti.

Comando obbligatorio:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
```

## Report minimo

Il report finale deve indicare:

- baseline o working tree verificata;
- file modificati;
- comandi eseguiti;
- esito e exit code;
- numero di test passati quando disponibile;
- controlli non eseguiti;
- limiti dell’ambiente;
- osservazioni live con data e contesto;
- percorso dell’artefatto JSON quando usato;
- limiti del profilo e del manifest.

Non trasformare un controllo non eseguito in PASS. Un artefatto di profilo non prova test disabilitati o non catalogati.

## Rollback

Il rollback deve essere selettivo e limitato ai file della task.

```txt
identificare i file della task
→ ripristinare soltanto quei file
→ rieseguire il controllo mirato
→ verificare che dati runtime e servizi esterni non siano stati toccati
```

Non usare come rollback:

- cancellazione cieca di `backend/match_history/`;
- rimozione manuale di `.pending_commits/`;
- cleanup cache per nascondere un errore di persistenza;
- kill per porta;
- reset indiscriminato di modifiche preesistenti;
- modifica dei test per rendere verde una regressione non compresa.

## Validazioni storiche

I collaudi manuali sono conservati in [docs/validations](../../validations/README.md). Dimostrano soltanto ciò che è stato osservato nel contesto registrato.

## Stato dell’infrastruttura

Sono implementati e configurati:

- manifest in `scripts/validation/test-manifest.json`;
- runner in `scripts/validation/run.mjs`;
- profili offline `fast`, `backend`, `frontend`, `python` e `full-offline`;
- child process separato, preflight path, timeout bounded e output redatto;
- artefatto JSON per l’esecuzione corrente;
- link checker strict con `--forbid-mdx-links` nei profili documentali;
- controllo coerenza Todo ↔ registri;
- test mirati del runner e dei checker.

La configurazione strict introdotta nel branch deve ancora essere rieseguita tramite il profilo `fast` o `full-offline` sullo stesso commit. Fino a un output reale positivo, il wiring corrente non va dichiarato validato localmente.

Restano aperti:

- inventario completo test ↔ owner ↔ documento (`IMPL-003`);
- sandbox e harness persistence (`IMPL-008`, `IMPL-029`);
- registrazione completa nel manifest dei test modulari journal/recovery;
- frontend interaction harness con StrictMode e fake timer (`IMPL-030`);
- ledger storico fra più esecuzioni (`IMPL-031`);
- profili `persistence`, `benchmark` e `live`.

La presenza dell’artefatto JSON della singola esecuzione non equivale al ledger storico.

## Documenti collegati

- [Stato corrente](../roadmap/01-current-state.md)
- [Selezione del contesto per AI](../ai/01-context-selection.md)
- [Convenzioni documentazione](../ai/02-documentation-conventions.md)
- [Validazioni storiche](../../validations/README.md)
