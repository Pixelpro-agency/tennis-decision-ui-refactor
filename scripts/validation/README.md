# Runner di validazione locale

## Scopo

Questa directory contiene il manifest eseguibile e il runner locale di validazione di Tennis Decision UI.

Il runner:

```txt
legge test-manifest.json
→ valida schema, ID, profili, path e comandi
→ seleziona un profilo
→ esegue ogni entry in un child process separato
→ applica timeout espliciti
→ limita e redige stdout/stderr
→ produce un artefatto JSON sotto test-results/
```

La prima versione è intenzionalmente seriale. Non modifica codice, registri o documentazione e non avvia implicitamente browser, login o tracking.

## Comandi

Dalla root del repository:

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

Esecuzione senza artefatto:

```bash
node scripts/validation/run.mjs fast --no-write
```

Output JSON completo anche sul terminale:

```bash
node scripts/validation/run.mjs fast --json
```

## Profili

| Profilo | Stato | Contenuto |
| --- | --- | --- |
| `fast` | implementato | checker documentali, test del runner e controlli puri selezionati |
| `backend` | implementato | test backend offline registrati nel manifest |
| `frontend` | implementato | test Node frontend registrati e build Vite |
| `python` | implementato | compileall e moduli unittest enumerati esplicitamente |
| `full-offline` | implementato | tutte le entry offline abilitate |
| `persistence` | pianificato | dipende dal sandbox/harness IMPL-008 |
| `benchmark` | pianificato | dipende dalle baseline IMPL-013 |
| `live` | pianificato | non viene mai incluso per default e richiederà consenso esplicito |

Un profilo pianificato restituisce exit code `2`; non viene contato come `skipped` o `passed`.

## Exit code

| Codice | Significato |
| ---: | --- |
| `0` | tutte le entry selezionate sono passate |
| `1` | almeno una entry è fallita o ha superato il timeout |
| `2` | errore d'uso, manifest non valido, path mancante o profilo bloccato |

Un path mancante è un errore di configurazione e viene rilevato prima di avviare qualunque child process.

## Manifest

Ogni entry dichiara almeno:

```txt
id
label
area
owner
requirementIds
command
cwd
type
profiles
timeoutSec
serialGroup
fixtures
mutatesFilesystem
liveRequired
enabled
```

`command` è un array di argomenti e viene eseguito con `shell:false`. Sono ammessi soltanto gli eseguibili espliciti del runner. Placeholder portabili:

```txt
${NODE}
${PYTHON}
${NPM}
```

`pathChecks` elenca file o directory che devono esistere prima della suite. `requires` dichiara capacità vietate nel profilo `fast`, fra cui browser, credenziali, rete esterna e tracking.

### Inventario corrente della persistenza

Il manifest non registra comandi per `commitJournal.test.mjs` o `recovery.test.mjs`: questi percorsi non esistono nella working tree verificata il 3 agosto 2026. Non sostituirli con path dedotti dai nomi dei moduli. Le suite journal/recovery potranno essere aggiunte soltanto dopo un inventario reale (`IMPL-003`) o dopo l'introduzione di test effettivi con sandbox controllata (`IMPL-008`).

## Artefatti

Il risultato predefinito viene scritto in:

```txt
test-results/<timestamp>-<sha>-<profile>.json
```

`test-results/` è ignorata da Git. Ogni stream è limitato a 65.536 byte per comando salvo override bounded; root repository, home, directory temporanea, URL e marker sensibili vengono redatti.

L'artefatto include lo SHA osservato e lo stato `clean`, `dirty` o `unavailable` della working tree. Non dichiara una working tree sporca come failure: la registra come contesto.

## Limiti della prima versione

- esecuzione interamente seriale;
- manifest iniziale limitato alla superficie verificata durante il Punto 7 e ai checker introdotti successivamente;
- nessuna coverage;
- nessun browser o test live;
- nessun harness persistence o benchmark;
- nessun frontend interaction harness React;
- nessuna CI.

L'espansione completa test ↔ owner ↔ documento appartiene a IMPL-003. Il ledger storico e la gestione degli ultimi esiti appartengono a IMPL-031.
