# Validazione e rollback

## Scopo

Questo runbook definisce come verificare una modifica e come annullarla senza confondere test presenti, test eseguiti, build, osservazioni live e stato della persistenza.

Il repository dispone di un runner locale canonico basato su manifest per la superficie offline già registrata. I test legacy restano processi separati: il runner non li importa nello stesso processo e non li riscrive.

Il manifest iniziale non equivale ancora a una mappa completa di ogni test presente. L'espansione test ↔ owner ↔ documento appartiene a `IMPL-003`; il ledger storico degli esiti appartiene a `IMPL-031`.

## Semantica dei risultati

Usare stati distinti:

| Stato | Significato |
| --- | --- |
| `planned` | Controllo richiesto ma non ancora implementato |
| `implemented` | Test o controllo presente nel repository |
| `executed` | Comando eseguito sulla working tree corrente |
| `passed` | Esecuzione conclusa con esito positivo |
| `failed` | Esecuzione conclusa con errore |
| `blocked` | Non eseguibile per dipendenza o ambiente mancante |
| `live_observed` | Comportamento osservato manualmente in una sessione specifica |
| `not_applicable` | Controllo non pertinente alla modifica |

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
→ verifica live soltanto se il comportamento dipende da browser o fonte reale
→ report
```

Non eseguire l'intero progetto per una modifica locale quando non esiste una ragione di confine.

## Scelta dei controlli

| Area modificata | Controllo minimo corrente |
| --- | --- |
| Modulo Node puro | `node --check <file>` quando applicabile e test `*.test.mjs` vicino |
| Router Express | Test response/route e, per contratti critici, HTTP reale su porta dinamica |
| Persistenza | Test writer, journal, recovery, processor della fonte e route read-only coinvolta |
| Betfair | Test processor/lifecycle/health/read model e test Python del modulo modificato |
| Frontend utility | Test Node puro della utility |
| Frontend integrato | Test disponibili, `npm --prefix frontend run build` e controllo browser mirato |
| Python | `py_compile` o `compileall`, import mirato e `unittest` esistente |
| Launcher | `launcher.tests.test_launcher` e scenario operativo soltanto quando necessario |
| Documentazione | Markdown, link relativi, percorsi reali, owner, stato corrente e assenza di segreti |

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

| Profilo | Stato | Regola |
| --- | --- | --- |
| `fast` | implementato | nessun browser, credenziale, rete esterna o tracking |
| `backend` | implementato | test backend offline registrati |
| `frontend` | implementato | test Node registrati e build Vite |
| `python` | implementato | compileall e unittest enumerati esplicitamente |
| `full-offline` | implementato | tutte le entry offline abilitate, in serie |
| `persistence` | pianificato | dipende da IMPL-008 |
| `benchmark` | pianificato | dipende da IMPL-013 |
| `live` | pianificato | mai implicito o incluso per default |

Un profilo pianificato restituisce exit code `2`. Non viene contato come test saltato o passato.

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

| Codice | Significato |
| ---: | --- |
| `0` | tutte le entry selezionate sono passate |
| `1` | almeno una entry è fallita o è andata in timeout |
| `2` | errore d'uso, manifest/path non valido o profilo non eseguibile |

Un path mancante è un errore di configurazione rilevato prima di avviare la suite.

### Esecuzione mirata fuori profilo

Il runner non impedisce un controllo singolo durante una task stretta. Quando serve un solo test, è ancora valido eseguirlo direttamente e registrare il comando nel report:

```bash
node backend/src/sofa/matchTracker.test.mjs
node frontend/src/hooks/useMatchPolling.test.mjs
python -m unittest -v scrapers.betfair.graph_url_test
npm --prefix frontend run build
```

Il comando diretto non aggiorna il result artifact del runner e non deve essere presentato come esecuzione dell'intero profilo.

### Documentazione e registri

I checker restano eseguibili direttamente:

```bash
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py
```

Sono inoltre inclusi nei profili `fast` e `full-offline`.

La migrazione è conclusa. Il gate documentale usa sempre:

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
```

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

Usare directory temporanee e fixture controllate. Non manipolare manualmente history, timeline o journal reali per simulare un test.

Un `409 persistence_integrity` verifica la lettura pubblica di uno stato già noto; non dimostra che la recovery funzioni.

Nel manifest iniziale non sono presenti entry dedicate a `commitJournal.test.mjs` e `recovery.test.mjs`, perché tali file non esistono nella working tree verificata. Il runner non deve puntare a percorsi storici o dedotti. La copertura specifica di journal e recovery resta da ricostruire tramite inventario reale e harness isolato.

## Source Identity

Per modifiche al gate o alla conferma:

- testare campioni allineati, pending, mismatch e non applicabili;
- verificare che campioni Betfair tecnicamente invalidi non aggiornino il gate;
- verificare che una conferma accetti soltanto il contesto previsto;
- usare store e dipendenze fake nei test;
- non usare il file runtime delle conferme come fixture;
- verificare che timeline storiche restino immutate.

Le verifiche pending reali richiedono una sessione live e devono essere archiviate come `live_observed`, non come PASS automatico.

## Betfair e Money Flow

Verificare in base al modulo:

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

La verifica corrente può coprire utility pure e build, ma manca un harness completo di lifecycle React.

Per modifiche a sessione o polling, il controllo manuale deve distinguere:

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

Finché non esiste un harness con fake timer e StrictMode, dichiarare chiaramente il limite.

## Documentazione

Per ogni batch documentale verificare:

- file previsti e nessun file estraneo;
- UTF-8;
- un H1 per documento;
- fence bilanciate;
- link relativi risolvibili nella working tree combinata;
- nessun `export const meta` nei nuovi `.md`;
- nessun segreto o path personale;
- nessuna funzione futura descritta come implementata;
- nessun file `.mdx` o link legacy nella documentazione attiva;
- indice, manifest e owner coerenti.

## Report minimo

Il report finale deve indicare:

- baseline o working tree verificata;
- file modificati;
- comandi eseguiti;
- esito e codice di uscita;
- numero di test passati quando disponibile;
- controlli non eseguiti;
- limiti dell'ambiente;
- eventuali osservazioni live con data e contesto;
- percorso dell'artefatto JSON quando è stato usato il runner;
- limiti dichiarati dal profilo e dal manifest.

Non trasformare un controllo non eseguito in PASS. Un artefatto di un profilo non prova i test disabilitati o non ancora catalogati.

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
- cleanup delle cache per nascondere un errore di persistenza;
- kill per porta;
- reset indiscriminato di modifiche preesistenti;
- modifica dei test per rendere verde una regressione non compresa.

## Validazioni storiche

I collaudi manuali sono conservati in [docs/validations](../../validations/README.md). Dimostrano soltanto ciò che è stato osservato nel contesto registrato.

## Stato dell'infrastruttura

Sono implementati:

- controllo ricorsivo dei link Markdown/MDX;
- controllo di coerenza Todo ↔ registri;
- test Python mirati delle due utility.

Manifest delle suite, runner canonico, sandbox condivisa, harness frontend e result ledger sono approvati nei registri ma non ancora implementati. Questo documento non li presenta come strumenti disponibili.

## Documenti collegati

- [Stato corrente](../roadmap/01-current-state.md)
- [Selezione del contesto per AI](../ai/01-context-selection.md)
- [Convenzioni documentazione](../ai/02-documentation-conventions.md)
- [Validazioni storiche](../../validations/README.md)
