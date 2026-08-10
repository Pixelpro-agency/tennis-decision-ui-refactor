# Report documentale — `scripts/validation/README.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-071
Sequenza audit: 71/72
Documento analizzato: scripts/validation/README.md
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch: main
HEAD verificato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Confronto HEAD: main identico a 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: dc1d7789d7da8835c122735c122b20af81c5d839
Dimensione documento: 134 righe
Tipo: README operativo del validation runner locale
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
scripts/validation/run.mjs
scripts/validation/run.test.mjs
scripts/validation/test-manifest.json
scripts/validation/support/manifest.mjs
scripts/validation/support/process-runner.mjs
scripts/validation/support/result.mjs
scripts/validation/support/redaction.mjs
scripts/validation/support/paths.mjs
.gitignore

backend/src/sofa/matchHistory/commitJournal.test.mjs
backend/src/sofa/matchHistory/recovery.test.mjs

todo-list-tennis-decision-ui.md
implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
```

Sono stati inoltre verificati:

```text
.github/workflows/
→ assente sul current repository

commitJournal.test.mjs
→ path indicato dal README ancora assente

recovery.test.mjs
→ path indicato dal README ancora assente
```

Sono stati coordinati, senza duplicarli:

```text
IMPL-003
IMPL-008
IMPL-013
IMPL-028
IMPL-029
IMPL-030
IMPL-031

TEST-060…075

AUDIT-CODE-P7-001
AUDIT-CODE-POST-001
IMPL-VALIDATION-001
IMPL-VALIDATION-002
```

GitHub non è stato modificato.

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 072: NON analizzato
```

---

# 1. Esito sintetico

```text
README ↔ run.mjs:
ALTA COERENZA

README ↔ manifest:
ALTA COERENZA

README ↔ result artifact:
ALTA COERENZA

README ↔ redaction:
ALTA COERENZA

README ↔ .gitignore:
COERENTE

README ↔ current persistence inventory:
COERENTE

README ↔ planned profiles:
COERENTE

README ↔ IMPL-031 boundary:
COERENTE

README ↔ absence CI:
COERENTE

Nuovo bug runtime:
1

Nuovo finding documentazione/runner:
1 owner condiviso

Nuove task:
1

Priorità:
ALTA

Split:
NON necessario
```

Conclusione:

```text
IL README 071
È UNO DEI DOCUMENTI
PIÙ ALLINEATI AL CODICE
DELL'INTERO AUDIT.

SONO CORRETTI:

- comandi CLI;
- profili;
- exit code;
- serialità;
- child process separati;
- timeout;
- shell:false;
- allow-list eseguibili;
- path preflight;
- artifact sotto test-results/;
- output 65.536 byte;
- redaction;
- working tree state;
- profili planned;
- persistence inventory;
- nessuna CI;
- confine IMPL-003 / IMPL-031.

IL PROBLEMA È UNO SOLO:

IL README AFFERMA COME
PROPRIETÀ GENERALE:

“non avvia implicitamente
browser, login o tracking”

MA IL RUNNER GARANTISCE
QUESTA PROPRIETÀ
SOLO PARZIALMENTE.

OGGI:

fast
→ vieta esplicitamente
  browser
  credentials
  external-network
  tracking

full-offline
→ vieta soltanto
  entry liveRequired:true

backend/frontend/python
→ non applicano
  un capability gate analogo

--allow-live
→ viene richiesto
  quando il PROFILO è live
  o il PROFILO stesso
  ha liveRequired

NON VIENE CONTROLLATO
DOPO LA SELEZIONE
SE UNA ENTRY
È liveRequired O RICHIEDE
CAPACITÀ LIVE-SENSITIVE.

IL MANIFEST CORRENTE
È SICURO PER CONFIGURAZIONE:

- live è planned/disabled;
- non risultano entry live abilitate;
- i profili correnti non contengono
  entry live-sensitive.

QUINDI:

NESSUN LIVE ACCIDENTALE
È STATO OSSERVATO.

MA LA SAFETY PROPERTY
NON È UN'INVARIANTE
DEL RUNNER.

UNA FUTURA ENTRY:

profiles:
  backend
  live

liveRequired: true

POTREBBE ESSERE SELEZIONATA
DA backend SENZA --allow-live.

ALLO STESSO MODO,
UNA ENTRY full-offline
CON:

requires:
  external-network

MA liveRequired:false

NON VIENE BLOCCATA
DAL CONTROLLO full-offline.

SERVE:

VALID-RUNNER-001
→ capability/live consent gate
  applicato alle entry selezionate
  e documentazione riallineata.

TEST-073 NON VA RIAPERTO:
PROVA CORRETTAMENTE
IL SOLO PROFILO fast.

IMPL-028 NON VA
RISCRITTA DA ZERO:
IL RUNNER ESISTENTE
VA HARDENIZZATO.
```

---

# 2. Scopo del README

Il documento dichiara:

```text
manifest eseguibile
+
runner locale di validazione.
```

Il ruolo è corretto.

Non è:

```text
test map completa
result ledger storico
fixture catalog
frontend DOM harness
CI definition.
```

Questi confini
sono correttamente separati.

---

# 3. Pipeline descritta

README:

```text
legge manifest
→ valida
→ seleziona profilo
→ child separati
→ timeout
→ bounded/redacted output
→ JSON artifact.
```

Il flusso corrisponde
alla struttura corrente
di `run.mjs`.

---

# 4. Serialità

Il README dice:

```text
prima versione
intenzionalmente seriale.
```

Current runner:

```text
for ogni resolved entry
→ await runEntry(...)
→ poi entry successiva.
```

Quindi:

```text
SERIALE
```

è corretto.

---

# 5. Child process separato

Ogni entry passa a:

```text
runEntry(...)
```

che usa:

```text
spawn(...)
shell:false.
```

Quindi il contratto
è corretto.

---

# 6. Windows wrapper

`process-runner.mjs`
gestisce `.cmd/.bat`
via:

```text
ComSpec
/d /s /c
```

senza abilitare
`shell:true`.

Il README
non sovraspecifica
questo dettaglio,
ma il contratto
`shell:false`
resta sostanzialmente corretto.

---

# 7. Timeout

Ogni entry
possiede:

```text
timeoutSec
```

e `runEntry`
usa:

```text
SIGTERM
→ grace bounded
→ SIGKILL/taskkill.
```

Quindi:

```text
timeout espliciti
```

è supportato.

---

# 8. Comandi README

Sono presenti e supportati:

```text
fast
backend
frontend
python
full-offline

--list
--no-write
--json.
```

Nessun comando stale rilevato.

---

# 9. Opzioni non documentate come comandi principali

`run.mjs`
supporta anche:

```text
--manifest
--repo-root
--output
--allow-live
--max-output-bytes
--help.
```

Il README non è obbligato
a documentare ogni flag,
ma `--allow-live`
è importante
per il finding safety.

---

# 10. Profili implementati

README:

```text
fast
backend
frontend
python
full-offline
```

come implementati.

Manifest corrente:

```text
enabled:true
status:implemented.
```

Coerente.

---

# 11. Profili pianificati

README:

```text
persistence
benchmark
live
```

come pianificati.

Manifest:

```text
enabled:false
status:planned.
```

Coerente.

---

# 12. Persistence dependency

README:

```text
persistence
→ IMPL-008.
```

Manifest reason:

```text
dipende da IMPL-008
e sandbox persistence.
```

Coerente.

---

# 13. Benchmark dependency

README:

```text
benchmark
→ IMPL-013.
```

Manifest:

```text
dipende da IMPL-013.
```

Coerente.

---

# 14. Live profile

README:

```text
planned
non incluso per default
richiederà consenso esplicito.
```

Manifest:

```text
enabled:false
liveRequired:true.
```

Current default live
non è eseguibile.

---

# 15. Planned profile exit code

README:

```text
planned
→ exit code 2
→ non skipped/pass.
```

`run.mjs`:

```text
profile disabled
→ throw configuration error
→ return 2.
```

Self-test dedicato
verifica questa semantica.

Coerente.

---

# 16. Exit code 0

README:

```text
0
→ tutte selected pass.
```

Current:

```text
runResult.status === passed
→ 0.
```

Corretto.

---

# 17. Exit code 1

README:

```text
1
→ failure o timeout.
```

Current result:

```text
failed > 0
or
timedOut > 0
→ status failed
→ exit 1.
```

Corretto.

---

# 18. Exit code 2

README:

```text
usage
manifest invalid
missing path
blocked profile.
```

Current catch
di configuration/usage
ritorna:

```text
2.
```

Corretto.

---

# 19. Missing path prima del child

`validateManifest(...)`
verifica:

```text
cwd
pathChecks
fixtures
```

prima di:

```text
resolvedEntries
runEntry.
```

Self-test:

```text
missing path
→ exit 2
→ marker child non creato.
```

Claim corretto.

---

# 20. Nota importante: validation è manifest-wide

Il current validator
controlla i path
delle entry del manifest
prima della selezione runtime.

Questo è coerente
con il README,
che descrive:

```text
valida manifest
→ seleziona profilo.
```

Non è un finding.

---

# 21. Manifest entry fields

README elenca:

```text
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
enabled.
```

`ENTRY_FIELDS`
contiene gli stessi campi.

Coerente.

---

# 22. `pathChecks` e `requires`

README
li descrive come campi aggiuntivi.

Il validator
accetta entrambi
come array opzionali.

Coerente.

---

# 23. Command allow-list

README:

```text
solo eseguibili espliciti.
```

Validator:

```text
ALLOWED_COMMANDS
```

con:

```text
NODE
PYTHON
NPM
node/python/python3/py/npm/npm.cmd.
```

Comandi shell arbitrari
sono rifiutati.

Coerente.

---

# 24. `shell:false`

`runEntry`
usa:

```text
shell:false.
```

Coerente.

---

# 25. Placeholder portabili

README:

```text
${NODE}
${PYTHON}
${NPM}.
```

`expandCommand(...)`
li implementa.

Coerente.

---

# 26. Inventario persistence

README:

```text
commitJournal.test.mjs
recovery.test.mjs
non esistono
nella working tree verificata
il 3 agosto 2026.
```

---

# 27. Verifica current dei due path

Current `main`:

```text
backend/src/sofa/matchHistory/commitJournal.test.mjs
→ 404

backend/src/sofa/matchHistory/recovery.test.mjs
→ 404
```

Repository search
non ha trovato
i filename.

Quindi la nota
non è diventata stale.

---

# 28. La data 3 agosto va preservata

La frase:

```text
working tree verificata
il 3 agosto 2026
```

è provenance.

Non trasformarla
in:

```text
test non sono mai esistiti.
```

---

# 29. Non dedurre path test dai moduli

La regola README:

```text
non sostituire
con path dedotti
dai nomi modulo
```

è corretta
e importante.

---

# 30. Relazione con IMPL-003/008

README:

```text
aggiungere suite
solo dopo inventario reale
o test reali sandboxed.
```

Questo boundary
resta coerente.

---

# 31. Artifact path

README:

```text
test-results/<timestamp>-<sha>-<profile>.json.
```

`defaultArtifactRelativePath`
produce precisamente
questa struttura.

Coerente.

---

# 32. Safe artifact root

`safeArtifactPath`
impone:

```text
repository-relative
sotto test-results/
```

e blocca:

```text
path traversal
absolute path
symlink root.
```

README
non overclama.

---

# 33. `.gitignore`

Current:

```text
test-results/
```

è ignorato.

Claim corretto.

---

# 34. Default output cap

README:

```text
65.536 byte
per stream e comando.
```

`run.mjs` default:

```text
65536.
```

Corretto.

---

# 35. Override bounded

CLI consente:

```text
1024…1048576.
```

Quindi:

```text
override bounded
```

è corretto.

---

# 36. Redaction repository root

`redaction.mjs`
sostituisce:

```text
repoRoot
→ <repo>.
```

Corretto.

---

# 37. Redaction home

```text
homedir
→ <home>.
```

Corretto.

---

# 38. Redaction temp

```text
tmpdir
→ <tmp>.
```

Corretto.

---

# 39. Redaction URL

HTTP(S) URL:

```text
→ <url>.
```

Corretto.

---

# 40. Marker sensibili

Redaction copre
pattern:

```text
Bearer
authorization
cookie
set-cookie
api_key
app_key
token
password.
```

Quindi il claim
è supportato.

---

# 41. Working tree state

Artifact registra:

```text
repositorySha
workingTreeStatus
changedPathCount.
```

Status:

```text
clean
dirty
unavailable.
```

README corretto.

---

# 42. Dirty working tree non è failure

`buildRunResult`
usa per status
solo:

```text
failed
timedOut.
```

Working tree
è contesto.

Claim corretto.

---

# 43. First-version limits

README:

```text
serial
manifest limitato
no coverage
no browser/live
no persistence/benchmark
no React interaction harness
no CI.
```

Sono coerenti
con la superficie verificata.

---

# 44. CI

Current repository:

```text
.github/workflows/
→ non presente.
```

Nessun workflow
emerso dalla search.

Claim:

```text
nessuna CI
```

resta supportato.

---

# 45. IMPL-003 boundary

README dice:

```text
espansione completa
test ↔ owner ↔ documento
→ IMPL-003.
```

Coerente
con il registry corrente.

---

# 46. IMPL-031 boundary

README dice:

```text
ledger storico
e ultimi esiti
→ IMPL-031.
```

Questo è particolarmente
corretto dopo report 069:

```text
v1 run artifact
→ IMPL-028

historical/result ledger
→ IMPL-031.
```

Non necessita correzione.

---

# 47. Safety claim globale

La frase critica è:

```text
non avvia implicitamente
browser, login o tracking.
```

Letta come descrizione
del manifest corrente,
è vera.

Letta come
invariante del runner,
non è garantita.

---

# 48. Guard `--allow-live` corrente

`run.mjs` verifica:

```text
if profile === live
OR profileDefinition.liveRequired
→ richiede --allow-live.
```

Quindi il consenso
è profile-scoped.

---

# 49. Non verifica le entry selezionate

Dopo:

```text
selected = selectEntries(manifest, profile)
```

non esiste un controllo:

```text
selected.some(entry.liveRequired)
```

prima dell'esecuzione.

---

# 50. Conseguenza teorica riproducibile dal contratto manifest

Una entry valida:

```text
profiles:
  - backend
  - live

liveRequired: true
```

soddisfa la regola:

```text
liveRequired
→ profiles include live.
```

---

# 51. Se eseguita tramite `backend`

Selected profile:

```text
backend.
```

`profileDefinition.liveRequired`
del backend
non è impostato.

Quindi:

```text
--allow-live
non viene richiesto.
```

La entry
può essere selezionata
perché include `backend`.

---

# 52. Il manifest validator non vieta questa combinazione

La regola corrente
è soltanto:

```text
if entry.liveRequired
→ profiles includes live.
```

Non:

```text
if entry.liveRequired
→ profiles must be only live

or

any profile selecting it
requires consent.
```

---

# 53. Fast profile ha una protezione più forte

Per:

```text
fast
```

il validator vieta:

```text
liveRequired
browser
credentials
external-network
tracking.
```

Quindi TEST-073
resta valido.

---

# 54. Full-offline ha una protezione più debole

Per:

```text
full-offline
```

il validator vieta
soltanto:

```text
entry.liveRequired.
```

Non verifica:

```text
requires:
browser
credentials
external-network
tracking.
```

---

# 55. Possibile configurazione errata full-offline

Una entry:

```text
profiles:
  - full-offline

liveRequired: false

requires:
  - external-network
```

non viene bloccata
dalla regola full-offline.

---

# 56. `backend/frontend/python` non hanno capability gate

Non esiste
un controllo specifico
sulle capability
per questi profili.

---

# 57. Current default manifest non sfrutta il buco

Questo è fondamentale.

Nel manifest corrente:

```text
live
→ disabled/planned

persistence
→ disabled/planned

benchmark
→ disabled/planned.
```

Non è stata osservata
una entry live
attualmente eseguita
da profili offline.

---

# 58. Quindi il finding non afferma un incidente current

Non dire:

```text
il runner sta aprendo
browser o tracking.
```

Evidence non lo supporta.

Dire:

```text
il runner non rende
la proprietà offline
fail-closed a livello
di entry/capability.
```

---

# 59. Perché è importante prima di implementare `live`

Il README
dichiara già:

```text
live richiederà consenso esplicito.
```

Prima di abilitare
entry live future,
il consent boundary
deve essere strutturale.

---

# 60. Perché non basta il nome del profilo

Una entry
può avere più profili.

La safety
deve seguire:

```text
l'entry/capability selezionata
```

non soltanto:

```text
il nome del profilo CLI.
```

---

# 61. VALID-RUNNER-001 — capability-aware live/offline safety gate

**Priorità:** HIGH  
**Tipo:** validation runner safety / documentation contract

## Root issue

README:

```text
non avvia implicitamente
browser, login o tracking.
```

Current implementation:

```text
fast
→ fail-closed sulle capability

altri profili
→ safety dipende
  dalla corretta classificazione manuale
  delle entry.
```

---

# 62. Azione tecnica richiesta

Prima di eseguire
le selected entries,
calcolare:

```text
selected capabilities
selected liveRequired state.
```

---

# 63. Invariante minima

Qualunque entry
con:

```text
liveRequired:true
```

non deve mai essere eseguita
senza consenso live esplicito,
indipendentemente
dal profilo usato
per selezionarla.

---

# 64. Capability sensibili

Almeno:

```text
browser
credentials
external-network
tracking
```

devono avere
una policy esplicita.

---

# 65. Full-offline

Deve essere
fail-closed rispetto
alle capability offline vietate.

Quindi:

```text
requires external-network
+
profile full-offline
→ configuration error
→ zero child process.
```

---

# 66. Backend/frontend/python

Definire esplicitamente
se sono:

```text
offline profiles
```

oppure possono includere
capability live.

Il README oggi
li descrive
come test offline/locali.

La scelta
deve essere enforceable.

---

# 67. Opzione conservativa

Possibile policy:

```text
ogni profilo != live
→ vieta entry liveRequired
→ vieta capability live-sensitive

live
→ richiede --allow-live.
```

Ma l'implementazione
può scegliere
un modello equivalente
purché fail-closed.

---

# 68. Opzione più generale

In alternativa:

```text
qualsiasi selected entry
liveRequired
→ richiede --allow-live

qualsiasi selected capability
sensitive
→ richiede policy esplicita
  e/o profilo consentito.
```

Il report
non impone
la forma interna.

---

# 69. Self-test richiesto 1

Scenario:

```text
profile backend
entry profiles:
  backend
  live
liveRequired:true
no --allow-live
```

Atteso:

```text
exit 2
zero child execution.
```

---

# 70. Self-test richiesto 2

Scenario:

```text
profile full-offline
requires:
  external-network
liveRequired:false
```

Atteso:

```text
manifest/profile rejected
zero child execution.
```

---

# 71. Self-test richiesto 3

Scenario live
in fixture isolata:

```text
live profile enabled
entry liveRequired:true
```

Senza:

```text
--allow-live
→ reject.
```

Con:

```text
--allow-live
→ può eseguire
  soltanto nella fixture
  controllata del self-test.
```

Nessun browser/rete reale
nel self-test.

---

# 72. README dopo fix

Può mantenere:

```text
non avvia implicitamente
browser, login o tracking
```

soltanto se
la property diventa
un’invariante enforceable.

---

# 73. README prima del fix

Se il codice
non viene corretto
nella stessa task,
la frase deve essere
ridotta a:

```text
Il manifest corrente
non contiene entry abilitate
che avviano implicitamente
browser, login o tracking.
```

Ma la soluzione preferibile
è hardenizzare il runner.

---

# 74. TEST-073 — non riaprire

TEST-073:

```text
fast non avvia
browser/rete/tracking.
```

Il self-test
verifica davvero:

```text
external-network
forbidden in fast.
```

Quindi:

```text
TEST-073
→ resta COMPLETATO.
```

---

# 75. Nuovo test owner

Non inventare
un nuovo TEST-ID
durante la sola audit
se la policy del progetto
richiede prima
una decisione registry.

La task:

```text
VALID-RUNNER-001
```

deve specificare
che serve coverage dedicata
al nuovo invariant.

L’eventuale TEST-ID
va aggiunto
nel normale workflow
di registrazione,
non improvvisato
nel codice.

---

# 76. IMPL-028 — non riaprire come “mai implementata”

IMPL-028
ha realmente consegnato:

```text
runner
manifest
profili
result artifact
self-test.
```

Il finding è:

```text
hardening successivo
di una safety invariant.
```

---

# 77. Stato completion IMPL-028

Possibili modalità
di registrazione futura:

```text
IMPL-028
→ completed historical implementation

VALID-RUNNER-001
→ follow-up current hardening.
```

Evitare
di cancellare provenance
della completion originaria.

---

# 78. IMPL-031 — non coinvolta nel root issue

Il result ledger
non causa
il live-consent gap.

Non duplicare
IMPL-VALIDATION-001.

---

# 79. IMPL-029 — non coinvolta

Fixture/sandbox
non possiedono
il live gate generale.

---

# 80. IMPL-030 — non coinvolta direttamente

Frontend interaction harness
è offline.

Quando implementata,
dovrà rispettare
la policy capabilities,
ma non è il root owner.

---

# 81. Dedupe con TEST-073

Confine:

```text
TEST-073
→ fast profile safety

VALID-RUNNER-001
→ selected-entry capability safety
  cross-profile.
```

Non duplicati.

---

# 82. Dedupe con TEST-064

TEST-064:

```text
Python discovery esplicita.
```

Non correlato.

---

# 83. Dedupe con TEST-061

TEST-061:

```text
path/preflight safety.
```

Non correlato
al live consent.

---

# 84. Dedupe con TEST-062/063

```text
process isolation
timeout.
```

Non correlati.

---

# 85. Dedupe con IMPL-VALIDATION-001

IMPL-VALIDATION-001:

```text
028 ↔ 031
result artifact ownership.
```

VALID-RUNNER-001:

```text
runtime capability gate.
```

Root issue distinta.

---

# 86. Acceptance criteria — VALID-RUNNER-001

```text
[ ] selected entry liveRequired inspected before spawn
[ ] liveRequired cannot execute silently through backend
[ ] liveRequired cannot execute silently through frontend
[ ] liveRequired cannot execute silently through python
[ ] liveRequired cannot execute silently through full-offline
[ ] full-offline rejects browser capability
[ ] full-offline rejects credentials capability
[ ] full-offline rejects external-network capability
[ ] full-offline rejects tracking capability
[ ] fast behavior remains unchanged
[ ] TEST-073 remains green
[ ] live fixture without --allow-live rejected
[ ] live fixture with explicit consent behaves as designed
[ ] zero real browser/network in self-test
[ ] README wording matches enforced invariant
[ ] current manifest behavior unchanged for valid offline entries
[ ] planned profiles remain exit 2
[ ] result artifact semantics unchanged
[ ] no code/docs mutation unrelated to runner safety
```

---

# 87. Severity

```text
HIGH
```

Non `CRITICAL`
perché:

```text
current live profile is disabled
current default manifest
does not expose a reproduced
live execution path.
```

Ma alta perché
è un fail-closed boundary
prima dell’abilitazione futura
di live capabilities.

---

# 88. Modularizzazione — valutazione

Dimensione:

```text
134 righe.
```

Il documento
ha una sola responsabilità:

```text
come usare
il validation runner locale.
```

---

# 89. Sezioni coese

```text
scope
commands
profiles
exit codes
manifest
persistence inventory
artifacts
limits.
```

Tutte servono
allo stesso consumer.

---

# 90. Split non necessario

Separare:

```text
CLI
manifest
artifacts
```

in file distinti
renderebbe più difficile
l’uso operativo
senza ridurre
un contesto problematico.

---

# 91. Mandatory modularization review

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 92. Aspetti corretti da preservare

```text
1. serial execution v1;
2. child process isolation;
3. shell:false;
4. executable allow-list;
5. portable placeholders;
6. explicit timeout;
7. exit 0/1/2;
8. missing path before spawn;
9. planned profile ≠ skipped/pass;
10. default profiles;
11. persistence/benchmark/live planned;
12. fast capability restrictions;
13. exact persistence inventory provenance;
14. no guessed test paths;
15. test-results artifact root;
16. Git ignore;
17. 65.536 byte cap;
18. bounded override;
19. path/URL/secret redaction;
20. repository SHA;
21. dirty state as context;
22. no coverage claim;
23. no React harness claim;
24. no CI claim;
25. IMPL-003 boundary;
26. IMPL-031 boundary.
```

---

# 93. Non-finding — persistence inventory

La nota
è ancora corretta
sul current HEAD.

Non aprire:

```text
stale test path.
```

---

# 94. Non-finding — README non elenca ogni CLI flag

Non è necessario
trasformarlo
in duplicato di `--help`.

Il finding
riguarda la semantica safety,
non la completezza
dell’elenco opzioni.

---

# 95. Non-finding — dirty working tree

README correttamente
non equipara:

```text
dirty
→ failure.
```

Questo resta coerente
con la policy provenance.

---

# 96. Non-finding — no CI

La CI
resta realmente assente.

Non aprire
una task CI automatica:
non è richiesta
da questo documento.

---

# 97. Non-finding — planned persistence

L’assenza
del profilo persistence
è già ownerizzata
da IMPL-008/029.

Non duplicare.

---

# 98. Non-finding — planned benchmark

È ownerizzata
da IMPL-013.

Non duplicare.

---

# 99. Non-finding — frontend interaction harness

È ownerizzato
da IMPL-030.

Non duplicare.

---

# 100. Non-finding — historical result ledger

È ownerizzato
da IMPL-031.

Non duplicare.

---

# 101. Verifica futura dopo fix

Minimo:

```text
node scripts/validation/run.test.mjs
node scripts/validation/run.mjs fast
python scripts/check_registry_consistency.py
python scripts/check_documentation_links.py --forbid-mdx-links
git diff --check
```

---

# 102. Non serve live reale

I test del consent gate
devono usare:

```text
temp repository
fake local child
marker file
synthetic manifest.
```

Non:

```text
browser reale
Betfair
SofaScore
login
tracking.
```

---

# 103. Nuovi finding

```text
VALID-RUNNER-001
```

---

# 104. Nuovi task code/runtime

```text
1
```

È un hardening
del validation runner.

---

# 105. Nuove task documentali separate

```text
0
```

Il README
va riallineato
nella stessa task
perché il claim safety
è parte dello stesso contratto.

---

# 106. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

---

# 107. Decisione finale

```text
scripts/validation/README.md:

ROLE:
README OPERATIVO
SOSTANZIALMENTE ACCURATO

DIMENSIONE:
134 RIGHE

COMMANDS:
COERENTI

PROFILES:
COERENTI

EXIT CODES:
COERENTI

MANIFEST:
COERENTE

PERSISTENCE INVENTORY:
ANCORA CORRETTO

ARTIFACT:
COERENTE

REDACTION:
COERENTE

CI STATUS:
COERENTE

IMPL-003 BOUNDARY:
COERENTE

IMPL-031 BOUNDARY:
COERENTE

PROBLEMA:
LIVE/OFFLINE SAFETY
NON FAIL-CLOSED
A LIVELLO ENTRY/CAPABILITY

CURRENT LIVE INCIDENT:
NON OSSERVATO

NEW CHANGE ID:
VALID-RUNNER-001

PRIORITÀ:
HIGH

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ

MODULARIZZAZIONE:
NO
```

---

# 108. Stato audit dopo report 071

```text
Documenti Markdown totali: 72
Analizzati: 71
Da analizzare: 1
Avanzamento: 98,61%
```

Sequenza:

```text
[✓] 069 implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
[✓] 070 implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md
[✓] 071 scripts/validation/README.md
[ ] 072 todo-list-tennis-decision-ui.md
```

---

# 109. Contatori task

Ultimo consolidamento richiesto:

```text
fino al report 067:
345
```

Dopo:

```text
068 → +1
069 → +2
070 → +1
071 → +1
```

Totale provvisorio:

```text
350
```

Non ancora consolidate
dopo l’ultimo aggiornamento:

```text
IMPL-FRONTEND-001
IMPL-VALIDATION-001
IMPL-VALIDATION-002
IMPL-DOCNORM-001
VALID-RUNNER-001
```

---

# 110. Stato mappa / JSON

```text
mappa Markdown
→ NON MODIFICATA

ledger JSON
→ NON MODIFICATO
```

---

# 111. Prossimo documento — non analizzato

```text
072
todo-list-tennis-decision-ui.md
```

È l’ultimo
Markdown dell’inventario corrente.

---

# 112. Stop operativo

```text
report 071:
COMPLETATO

nuovo Change ID:
VALID-RUNNER-001

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 072:
NON ANALIZZATO
```
