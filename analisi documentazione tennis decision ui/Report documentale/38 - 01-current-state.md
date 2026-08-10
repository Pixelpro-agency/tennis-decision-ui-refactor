# Report documentale — `docs/tennis-decision-ui/roadmap/01-current-state.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-038
Sequenza audit: 38/72
Documento analizzato: 01-current-state.md
Percorso documento: docs/tennis-decision-ui/roadmap/01-current-state.md
Percorso report: Report documentale/38 - 01-current-state.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Baseline tecnica dichiarata dal documento: f86ac267919ca13859c98db7015362f26176ba36
SHA documento: 310e2c72c8264c572e71d32546acceddef24011f
Dimensione documento: 199 righe
Ruolo dichiarato: fotografia dello stato reale corrente del progetto
Stato report: completato
```

Il documento è stato confrontato con:

```text
commit corrente main
compare f86ac267... → 4c5f43b...
docs/validations/README.md
docs/validations/source-identity-live-verification.md
docs/validations/betfair-live-validation-2026-07-04.md
docs/validations/documentation-migration-finalization-2026-08-03.md

implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md

report audit 023–037
ledger cumulativo dell’audit corrente

owner già verificati per:
runtime locale
tracking live
localContext/PBP
storage
journal/recovery
Betfair
frontend
validation runner
retention/cleanup
repository map
```

GitHub non è stato modificato.

La mappa cumulativa e il JSON dell’audit **non vengono aggiornati con questo report**.

Il nuovo checkpoint sarà:

```text
038
039
040
041
042
```

e verrà consolidato soltanto dopo il report 042, secondo la regola corrente di aggiornamento ogni cinque documenti.

---

# Esito sintetico

```text
Coerenza come fotografia generale:         MEDIO-ALTA
Coerenza della base implementata:           ALTA ma troppo sintetica in alcuni domini
Coerenza dei limiti correnti:               PARZIALE
Coerenza con audit 023–037:                 PARZIALE
Baseline runtime dichiarata:                TECNICAMENTE ANCORA RAPPRESENTATIVA
Baseline documentale:                       NON ESPLICITATA
Provenance delle validazioni live:          PARZIALE
Riferimenti documentali correnti:           1 riferimento stale confermato
Separazione current/history/future:          BUONA come struttura
Duplicazione contratti owner:               ANCORA PRESENTE
Modularizzazione:                           NON necessaria

Nuovi finding:                              3
Finding esistenti ancora applicabili:       DOC-001, DOC-022
Nuove implementazioni runtime duplicate:    0
Riscrittura completa:                       NO
Revisione mirata sostanziale:               SÌ
Nuovi documenti canonici proposti:          nessuno
Priorità complessiva:                       ALTA
```

Il documento corrente è molto migliore della vecchia roadmap storica.

Ha già corretto diversi problemi dell’audit precedente:

```text
non è più organizzato per Task 1A / 2A / 6 / collaudo 9B
separa base implementata
separa limiti
separa deprecato
separa validazioni storiche
separa funzioni non presenti
rimanda ai registri per il futuro
```

Quindi:

```text
DOC-001
→ sostanzialmente migliorato
→ non ancora completamente chiudibile
```

e:

```text
DOC-022
→ parzialmente corretto
→ NON chiudibile
```

perché la fotografia corrente non ha ancora assorbito i limiti tecnici emersi nei report 023–037 e continua a formulare alcune aree in modo più forte di quanto il codice e l’audit consentano.

La correzione, però, non deve produrre una seconda Todo dentro il Current State.

Il documento deve restare:

```text
vista sintetica dello stato
+
link agli owner
```

non:

```text
copia di tutti i 296 finding conosciuti.
```

---

# 1. La baseline tecnica `f86ac267...` non è obsoleta rispetto al codice applicativo

## Esito: precisazione importante

Il documento dichiara:

```text
Baseline tecnica:
f86ac267919ca13859c98db7015362f26176ba36
```

Il commit corrente analizzato è:

```text
4c5f43b007149f3210c27d7565357a447a3a6ef4
```

Il confronto Git fra i due commit restituisce:

```text
17 commit successivi
```

ma non mostra modifiche applicative in:

```text
backend/
frontend/
launcher/
scrapers/
```

La differenza è costituita soprattutto da:

```text
documentazione
registri modularizzati
Todo/indici
checker/manifest di supporto documentale
```

Quindi non sarebbe corretto scrivere nel report:

```text
baseline tecnica f86
→ codice runtime sicuramente vecchio
```

Il codice applicativo descritto dal documento resta, per quanto verificato, tecnicamente rappresentato dalla baseline `f86ac267...`.

## Problema reale

Il problema è un altro:

```text
code baseline
≠
document baseline
```

Il Current State vive oggi sul commit:

```text
4c5f43b...
```

ed è stato modificato dopo `f86ac267...`.

Nel frattempo sono cambiati:

```text
documenti owner
registri
archive policy
validation docs
Current State stesso
```

Il documento però espone un solo SHA chiamato:

```text
Baseline tecnica
```

senza chiarire:

```text
baseline del codice runtime
vs
commit su cui la fotografia documentale è stata verificata
```

Questo diventa un problema concreto perché alcune affermazioni puramente documentali sono già divergenze rispetto a `main`.

Il caso più evidente è `docs/archive/README.md`, analizzato nel finding successivo.

---

# 2. `CURRENT-STATE-001` — distinguere baseline runtime e baseline documentale

**Priorità:** high  
**Tipo:** current-state provenance / baseline semantics

## Problema

Un documento che dichiara:

```text
ciò che esiste oggi
```

non può usare un singolo SHA ambiguo quando:

```text
runtime code
→ ancora invariato dalla baseline tecnica

documentazione / registri / validation inventory
→ cambiati dopo quella baseline
```

## Contratto consigliato

Usare una forma equivalente a:

```text
Runtime/code baseline:
f86ac267919ca13859c98db7015362f26176ba36

Current repository/document review:
4c5f43b007149f3210c27d7565357a447a3a6ef4

Application code changes between the two:
none observed in backend/frontend/launcher/scrapers
```

oppure aggiornare completamente la fotografia su `4c5f43b...` e conservare `f86...` soltanto come nota di provenance dell’ultimo intervento tecnico.

## Non fare

Non scrivere semplicemente:

```text
Baseline: 4c5f43b...
```

senza spiegare che gli ultimi commit sono documentali.

Allo stesso modo non lasciare:

```text
f86...
```

come se descrivesse anche lo stato corrente di:

```text
docs/
registri
archive
validation inventory
```

## Verification

Per ogni aggiornamento del Current State:

```text
1. identificare commit corrente
2. confrontarlo con runtime/code baseline
3. classificare:
   - application code changed
   - docs/registry only
   - tooling changed
4. registrare la baseline effettivamente usata
```

---

# 3. `DOC-022` è stato corretto solo parzialmente

## Finding esistente — NON duplicare

L’audit documentale precedente aveva registrato:

```text
DOC-022 — Current State non aggiornato rispetto a B4
```

con criterio:

```text
distinguere:
implemented
verified
implemented with limits
bug
validation open
future
```

La versione corrente ha corretto una parte importante del vecchio problema.

### Vecchio problema frontend

Il vecchio Current State dichiarava sostanzialmente completa la UI integrity.

La versione corrente ora dice correttamente:

```text
la UI persistence integrity
non è ancora completa in tutte le viste
```

Questa correzione va mantenuta.

### Vecchio problema diagnostico

Il vecchio audit aveva già segnalato che l’hardening diagnostico era dichiarato troppo forte.

La versione corrente continua però a scrivere nella tabella:

```text
Betfair
→ diagnostica redatta

Sicurezza dati
→ redazione diagnostica
```

come proprietà generali.

I report successivi hanno invece confermato ancora owner aperti su:

```text
SOFA-LIVE-006
BETFAIR-SCRAPER-003
BETFAIR-DIAG-004
BETFAIR-DIAG-008
FRONT-BETFAIR-007
```

fra cui:

```text
output diagnostici pubblici da allow-listare
log Python globale non session-scoped
path locali/capture envelope
runtime reason da rendere bounded/redacted
```

Quindi:

```text
redaction esistente in alcune superfici
≠
diagnostica end-to-end completamente redatta
```

## Decisione

Non creare:

```text
CURRENT-STATE-xxx implement redaction
```

L’implementazione appartiene già ai finding owner.

Nel Current State basta correggere la rappresentazione.

Esempio:

```text
diagnostic redaction presente su superfici specifiche
→ hardening end-to-end ancora aperto
```

con link all’owner, non copia di tutti i dettagli.

---

# 4. La tabella “Base implementata” usa un solo livello di stato per aree con limiti molto diversi

## Esito: rientra in `DOC-022`, NON nuovo finding

La tabella iniziale mette nello stesso livello:

```text
Runtime locale
Backend
SofaScore
Betfair
Tracking
Persistenza
Evidence
Frontend
Sicurezza
Tooling
```

Tutte sotto:

```text
Base implementata
```

Formalmente non è falso:

```text
quelle aree esistono realmente
```

Il problema è che alcune righe usano wording che può essere letto come:

```text
contratto consolidato
```

quando l’audit corrente ha trovato gap critical/high.

## Esempi

### Runtime locale

La base esiste.

Ma sono ancora aperti:

```text
LOCAL-RUNTIME-001
→ backend reuse working-copy aware

LOCAL-RUNTIME-002
→ discovery prima dello spawn

LOCAL-RUNTIME-003
→ CLI outcome

LOCAL-RUNTIME-004
→ CDP provenance

LOCAL-RUNTIME-005
→ browser handoff

LOCAL-RUNTIME-007
→ verification
```

Il Current State possiede un paragrafo “Confine locale”, ma non rende visibile questa classe di limiti.

### SofaScore

Scrive:

```text
point-by-point supportato
localContext descrittivo
```

L’algoritmo esiste.

Ma l’audit ha registrato:

```text
LOCAL-PBP-001
→ current game authority

LOCAL-PBP-002
→ set/game identity

LOCAL-PBP-003
→ pointsTotal source contract

LOCAL-PBP-004
→ dataQuality semantics

LOCAL-PBP-005
→ /analyze writer authority

LOCAL-PBP-007
→ provider validation
```

Quindi la formulazione più precisa è:

```text
PBP/localContext implementati
→ provider/source-contract validation ancora incompleta
```

### Betfair

La base esiste.

Ma i report successivi hanno aperto limiti su:

```text
finished authority
auth recovery hysteresis
health taxonomy
log provenance
capture activation per entrypoint
legacy /odds mutating boundary
integrity degraded
```

### Tracking

Il documento riconosce:

```text
session authority assente
Stop cleanup parziale
```

ma non rende visibili:

```text
Start acknowledgement non authoritative
mismatch physical cleanup
finished authority
Stop retry after remaining
current-live vs persisted authority
```

### Persistenza

La sezione limiti usa problemi più generali:

```text
shared history authority
revision/digest
eventId permissivo
no transaction cross-source
full rewrite
```

ma i report storage/journal hanno individuato rischi più diretti:

```text
canonical read fail-open
ambiguous target discovery
observed/prepared state leakage
Betfair history identity semantics
completed residual blind cleanup
semantic target verification
unreadable journal → no_known_partial
recovery_failed lifecycle
```

### Validation runner

La tabella dice:

```text
profili offline
timeout
process isolation
artifact JSON bounded
```

L’implementazione esiste.

Ma il report 035 ha dimostrato che:

```text
fast/full-offline
→ non sono capability sandbox

child
→ eredita process.env

timeout
→ prova il child diretto
→ non garantisce process-tree drain

full-offline
→ non ha closure invariant completa

artifact
→ non identifica la working tree esatta pre/post
```

## Decisione

Non creare sette nuove task roadmap.

Il root issue è già:

```text
DOC-022
```

La revisione del Current State deve consumare gli owner, non duplicarli.

---

# 5. `mismatch → ferma il tracking coordinato` è più forte di quanto il codice provi

## Esito: dipendenza esistente, NON nuovo finding

Il documento dice:

```text
mismatch
→ blocca il campione
→ ferma il tracking coordinato
```

Come descrizione logica è comprensibile.

Ma i report Tracking hanno verificato:

```text
mismatch
→ stop tracker logici
→ invalidate generation
→ terminate Betfair active
```

senza dimostrare la terminazione fisica completa dell’eventuale child SofaScore in-flight.

Owner già aperti:

```text
SOFA-LIVE-001
SOFA-LIVE-004
LIVE-CTRL-006
SOURCE-ID-002
IMPL-006
```

## Correzione Current State

Usare una forma equivalente a:

```text
mismatch
→ blocca il campione
→ arresta il tracking logico
→ avvia il cleanup coordinato
→ la completa session isolation/physical cleanup resta aperta
```

Non creare una task runtime nuova in questo report.

---

# 6. `hasFinished`/finished authority manca dai limiti sintetici Betfair

## Esito: owner esistente, NON nuovo finding

Il Current State dice correttamente:

```text
errore tecnico
≠
mercato concluso
```

Ma non informa il lettore che:

```text
hasFinished ricevuto
≠
finished authoritative garantito
```

finché il producer non viene hardenizzato.

Owner:

```text
BETFAIR-SCRAPER-006
SOFA-LIVE-007
BETFAIR-DIAG-003
```

Questa è una delle limitazioni più importanti perché un falso finished può fermare tracking.

## Decisione

Aggiungere una sola riga sintetica nei limiti Betfair/Tracking.

Non copiare l’intero classifier.

---

# 7. La sezione Persistenza non riflette i failure mode più critici emersi dopo B5

## Esito: `DOC-022` da aggiornare, non nuova implementazione

La sezione attuale elenca:

```text
shared history authority
revision/document head/digest
eventId permissivo
no transaction Sofa/Betfair
full rewrite
```

Tutti temi reali.

Ma oggi non sono necessariamente i failure mode più urgenti.

L’audit Storage/Journal ha identificato con priorità critical:

```text
STORAGE-TH-001
→ unreadable/invalid canonical document
   non deve diventare missing/empty e poi essere sovrascritto

STORAGE-TH-003
→ prepared/uncommitted state
   non deve contaminare writer successivi

JOURNAL-REC-001
→ completed residual cleanup blind

JOURNAL-REC-002
→ completed target semantic verification

JOURNAL-REC-003
→ typed repair payload binding

JOURNAL-REC-004
→ unreadable journal
   non deve diventare no_known_partial
```

Un documento chiamato:

```text
Stato corrente del progetto
```

deve rendere visibili almeno i **limiti critical attivi**.

Non serve elencare tutte le task.

Una forma adeguata:

```text
Persistenza implementata con journal/recovery/integrity,
ma restano aperti failure mode critical
su read fail-closed, target verification,
prepared-vs-committed state e unreadable journal.
```

Poi link agli owner.

---

# 8. La sezione Validazione non incorpora i finding 035

## Esito: `DOC-022` da aggiornare

La sezione corrente è già prudente su:

```text
manifest non completo
no aggregate test script
lint non gate
no React harness
profili persistence/benchmark/live assenti
ledger incompleto
file test ≠ PASS
```

Questa parte è buona.

Ma dopo il report 035 devono essere aggiunte le distinzioni:

```text
offline profile
≠
security sandbox

requires metadata
≠
capability enforcement

child timeout
≠
whole process tree drain

HEAD SHA
≠
exact dirty working tree

counts.passed
→ manifest entries
→ non assertion count

full-offline
→ aggregate corrente
→ completeness invariant ancora da rendere machine-checkable
```

Owner esistenti:

```text
VALID-ROLL-001
VALID-ROLL-002
VALID-ROLL-003
VALID-ROLL-004
VALID-ROLL-005
VALID-ROLL-007
```

## Correzione della tabella iniziale

In particolare:

```text
process isolation
```

deve essere qualificato.

Formulazione consigliata:

```text
entry execution in child process
+ timeout bounded
```

e non:

```text
process isolation
```

se questa frase viene interpretata come garanzia dell’intero process tree/capability boundary.

---

# 9. Il Current State omette lo stato della retention manuale realmente implementata

## Esito: aggiornamento `DOC-022`, NON nuovo finding

La sezione “Funzioni non presenti” dice:

```text
retention automatica periodica
→ non implementata
```

Corretto.

Ma il documento non rende visibile che esiste già:

```text
scripts/cleanup_runtime_cache.py
```

con:

```text
allow-list cache
dry-run default
policy max-age/max-files/max-bytes
test automatici
dry-run reale eseguito
```

e che:

```text
apply reale
→ non è ancora considerato maintenance-safe/validato
→ CLEANUP-002 / IMPL-011 / TEST-018
```

Il rischio del wording corrente è:

```text
retention automatica non implementata
→ lettore può dedurre che non esista alcun tooling retention
```

oppure il contrario:

```text
runbook retention esiste
→ lettore può dedurre che apply sia pronto
```

Entrambe le deduzioni sono sbagliate.

## Forma sintetica consigliata

```text
Retention:
→ cleanup cache manuale/dry-run implementato
→ apply reale non ancora validato con maintenance authority
→ scheduling automatico non implementato
```

Non aggiungere nel Current State tutti i flag CLI.

---

# 10. Il riferimento a `docs/archive/README.md` è stale sul commit corrente

## Esito: NUOVO FINDING

Il documento dice:

```text
docs/archive/README.md
conserva soltanto la mappa di provenienza delle fonti rimosse
```

Sul commit analizzato:

```text
4c5f43b...
```

il path:

```text
docs/archive/README.md
```

restituisce:

```text
404 Not Found
```

Il confronto fra:

```text
f86ac267...
→
4c5f43b...
```

mostra inoltre:

```text
docs/archive/README.md
status: removed
```

Quindi questa non è un’interpretazione.

È una reference concreta non più esistente.

## Perché il normale link checker può non intercettarla

Nel Current State il path è scritto come:

```text
`docs/archive/README.md`
```

non come link Markdown.

Un checker di link relativi può quindi non trattarlo come target navigabile.

Questo rafforza il finding generale:

```text
VALID-ROLL-006
→ documentation verification coverage
```

ma la correzione del Current State è nuova e specifica.

---

# 11. `CURRENT-STATE-002` — rimuovere il riferimento al README archive inesistente

**Priorità:** medium  
**Tipo:** stale documentation reference / archive provenance

## Azione

Determinare l’owner reale attuale della provenance delle fonti consolidate.

Possibili authority da verificare:

```text
registri IMPL/DEC correnti
validation di migrazione documentale
commit Git storici
root recovery metadata
```

Poi sostituire la frase:

```text
docs/archive/README.md conserva...
```

con il riferimento realmente esistente.

## Non fare

Non ricreare automaticamente:

```text
docs/archive/README.md
```

solo perché il Current State lo cita.

La rimozione del file può essere intenzionale e successiva alla migrazione.

## Verification

```text
target citato
→ esiste sul commit corrente
→ contiene davvero la provenance dichiarata
```

Se la provenance esiste soltanto nella storia Git:

```text
dirlo esplicitamente
```

senza inventare un file corrente.

---

# 12. La sezione Validazioni storiche contiene affermazioni ben supportate

## Esito: parzialmente confermato

Il Current State elenca:

```text
collecting → recording
mismatch → ritorno al form
restart dopo correzione link
Betfair Graph URL / no Graph URL
logout Graph / alert / recovery
```

Questi casi trovano effettivo supporto nei due artifact domain-specific.

## Source Identity validation

Il file:

```text
docs/validations/source-identity-live-verification.md
```

registra:

```text
collecting → recording
mismatch → form
correzione → nuovo Start → aligned
TopBar Connected con timeline
```

e distingue correttamente:

```text
pending reale → non eseguito
decline → non eseguito
buffering → riferito ma non archiviato
```

## Betfair validation

Il file:

```text
docs/validations/betfair-live-validation-2026-07-04.md
```

registra:

```text
Graph URL valide
nessuna Graph URL
volume anomalo soppresso
logout Graph e alert
recovery dopo login
```

e dichiara i casi non eseguiti.

Questa parte del Current State è quindi ben impostata.

---

# 13. `launcher, Stop e lifecycle ordinario in sessioni dedicate` non ha un artifact corrispondente nell’indice validation corrente

## Esito: NUOVO FINDING

Il Current State aggiunge:

```text
launcher, Stop e lifecycle ordinario
in sessioni dedicate
```

e subito dopo dice:

```text
Queste osservazioni appartengono a docs/validations/
```

Il problema è che l’indice:

```text
docs/validations/README.md
```

elenca come validation domain migrate:

```text
Source Identity
Betfair — 2026-07-04
```

oltre alla validation della migrazione documentale.

Non esiste nell’indice corrente un artifact dedicato:

```text
launcher live validation
Stop live validation
runtime lifecycle validation
```

## Verifica nei due artifact domain

### Source Identity

Contiene:

```text
mismatch
new Start
collecting/aligned
frontend state
```

ma non costituisce un collaudo del launcher.

### Betfair

Contiene:

```text
tracking attivo
Graph
logout/recovery
```

ma non registra un collaudo completo:

```text
launcher
Stop globale
process cleanup
no respawn
shutdown lifecycle
```

## Relazione con finding esistenti

Il problema specifico è già emerso per singoli runbook:

```text
LOCAL-RUNTIME-006
→ runtime validation provenance

LIVE-CTRL-007
→ Stop/9B validation provenance
```

Questi restano gli owner delle evidenze di dominio.

Il nuovo problema qui è l’aggregatore Current State:

```text
afferma che l’osservazione è archiviata
quando l’indice validation corrente non la espone.
```

Questa responsabilità è distinta.

---

# 14. `CURRENT-STATE-003` — validation inventory deve essere artifact-backed

**Priorità:** high  
**Tipo:** historical validation aggregation / provenance

## Contratto

Ogni voce sotto:

```text
Validazioni storiche
```

deve essere una delle seguenti:

```text
A.
live_observed
→ link a artifact effettivo

B.
historically reported
→ provenance incompleta
→ non registrato dove mancano SHA/data/artefatti

C.
not executed / not observed
```

Non deve esistere una categoria implicita:

```text
“ricordo che era stato collaudato”
→ presentato come appartenente a docs/validations/
```

## Correzione per launcher/Stop

Fino a quando non esiste un artifact reale:

```text
launcher/Stop/lifecycle
→ non presentarlo come validation archiviata
```

oppure:

```text
osservazione storica riferita
→ artifact non presente
→ metadata non registrati
```

## Coordinamento

Non creare un secondo collaudo.

Quando si chiudono:

```text
LOCAL-RUNTIME-006
LIVE-CTRL-007
```

il Current State deve consumare quegli artifact.

---

# 15. I pass-count IMPL-015 sono ancora inline nel Current State

## Esito: finding esistente, NON nuovo

Il documento contiene:

```text
writer authority
→ 26 passati

matchTracker
→ 10 passati

server
→ 30 passati
```

e distingue correttamente:

```text
automatic test
≠
live validation
```

La distinzione semantica è buona.

Il problema è l’ownership dei conteggi.

È già stato censito in:

```text
LOCAL-RUNTIME-006
JOURNAL-REC-009
VALID-ROLL-004
```

e nella policy validation generale.

## Correzione consigliata

Nel Current State:

```text
IMPL-015
→ test automatici specifici eseguiti storicamente
```

con link all’artifact.

I conteggi puntuali devono stare nell’evidenza di validation, non nella fotografia permanente se non vengono rigenerati automaticamente.

## Non duplicare

Nessuna nuova task.

---

# 16. La lista “Componenti deprecati ma ancora presenti” è coerente come snapshot

## Esito: confermato

Il documento identifica:

```text
API/UI Strategy
Match debug/untrack
Betfair /odds
```

come codice ancora presente ma da non estendere.

Questa è la semantica corretta:

```text
deprecated
≠
removed
```

Il report Betfair Diagnostics ha ulteriormente chiarito che:

```text
/odds
→ legacy
→ potenzialmente mutante
```

quindi il Current State potrebbe aggiungere:

```text
legacy mutating surface
```

senza duplicare l’intero finding `BETFAIR-DIAG-006`.

---

# 17. La lista “Funzioni non presenti” è generalmente coerente

## Esito: confermato con una precisazione

Sono correttamente classificate non implementate:

```text
replay offline canonico
backtesting
Market Reactions Journal persistito
nuove strategie validate
Stream API Betfair
retention automatica periodica
CI deterministica
persistence/benchmark/live runner profiles
```

Non è emersa evidenza nel codice corrente che renda queste voci false.

## Precisazione retention

Come già indicato:

```text
automatic retention
→ assente

manual cache cleanup/dry-run
→ presente
```

Questa distinzione deve essere visibile.

---

# 18. Il riferimento alle specifiche future nei registri è concettualmente corretto

## Esito: confermato

Il documento non presenta:

```text
IMPL-010
IMPL-012
IMPL-023
```

come funzionalità runtime.

Dice correttamente che sono state consolidate nei registri.

Il problema è soltanto la frase successiva sul README archive inesistente.

Quindi:

```text
future spec ownership
→ corretta

archive README reference
→ stale
```

---

# 19. La sezione “Fonti per le task aperte” ha un’intestazione sospesa

## Esito: piccolo difetto editoriale, nessuna task separata

Il documento contiene:

```text
Le decisioni e le strutture approvate ma non implementate si trovano in:

Per le task aperte usare...
```

Dopo i due punti non segue una lista.

Non è un problema di contratto.

Durante la revisione:

```text
rimuovere la prima frase
```

oppure trasformare il seguito in una lista:

```text
Todo
Audit
Implementazioni proposte
Decisioni utente
```

Nessun Change ID dedicato necessario.

---

# 20. `DOC-001` è migliorato ma non completamente chiudibile

## Finding esistente — ownership documentale

`DOC-001` chiedeva di trasformare la roadmap da diario storico a vista corrente.

Questo è quasi completamente avvenuto.

Non esistono più sezioni:

```text
Task 1A
Task 2E
Task 6
collaudo 9A
prompt X
```

La struttura attuale è buona.

## Residuo

Il documento continua però a duplicare diversi contratti owner:

### Persistenza

```text
esatto ordine writer authority/recovery/listener
active/unknown fail closed
release sequence
```

### Shutdown

Otto bullet descrivono:

```text
terminal barrier
drain
Python cleanup order
authority release
repeated signals
```

### Validation

Conteggi puntuali IMPL-015.

Questi dettagli aumentano il costo di mantenimento del Current State.

## Forma target

Il documento dovrebbe essere più vicino a:

```text
Area
Stato
Limite principale
Verifica
Owner
```

con approfondimento soltanto per:

```text
invarianti trasversali che cambiano l’interpretazione dello stato
```

Non va diviso.

Va accorciato e reso più machine-checkable semanticamente.

---

# 21. Stato consigliato per le aree principali

Questa tabella non è una proposta di nuovi stati runtime.

È una struttura documentale consigliata.

| Area | Stato sintetico corretto oggi | Limite da rendere visibile |
| --- | --- | --- |
| Runtime locale | implementato con limiti | identity/reuse/CLI/CDP provenance |
| Backend | implementato | local control-plane hardening aperto |
| SofaScore | implementato con source-contract gaps | PBP/current-game/pointsTotal validation |
| Betfair | implementato con limiti critici | finished authority, diagnostics, cache/capture |
| Tracking | implementato con session authority incompleta | Start/Stop/mismatch/restart semantics |
| Persistenza | implementata con failure mode critical aperti | read fail-closed, prepared/committed, journal verification |
| Evidence | implementata read-only | provenance/comparability incompleta |
| Frontend | implementato con lifecycle gaps | session/polling/integrity UI |
| Sicurezza dati | hardening parziale | diagnostic/public output boundaries aperti |
| Validation | runner offline implementato, isolation parziale | no capability sandbox/process-tree guarantee |
| Retention | manual dry-run implementato | apply real non validato; automatic schedule assente |

La tabella target deve rimandare agli owner.

Non deve diventare una seconda Todo.

---

# 22. Dipendenze già aperte da non duplicare

## Roadmap/documentation

```text
DOC-001
DOC-022
```

## Runtime/Tracking

```text
LOCAL-RUNTIME-001..007
SOFA-LIVE-001..009
LIVE-CTRL-001..007
IMPL-006
```

## SofaScore / local context

```text
LOCAL-PBP-001..008
```

## Betfair

```text
BETFAIR-SCRAPER-001..010
BETFAIR-DIAG-001..008
GRAPH-URL-*
SOFA-LIVE-007
```

## Storage

```text
STORAGE-TH-001..009
JOURNAL-REC-001..010
```

## Validation

```text
VALID-ROLL-001..007
IMPL-003
IMPL-008
IMPL-029
IMPL-030
IMPL-031
TEST-065..075
```

## Retention

```text
CLEANUP-002
CLEANUP-003
SECURITY-002
IMPL-011
TEST-018
RETENTION-001
RETENTION-002
RETENTION-003
```

## Frontend

I finding frontend già registrati restano owner delle modifiche applicative.

Il Current State deve soltanto rappresentarne correttamente l’esistenza.

---

# 23. Nuovi finding

## `CURRENT-STATE-001` — dual baseline / provenance

**Priorità:** high  
**Tipo:** current state provenance

### Problema

```text
runtime baseline
≠
document/repository baseline
```

non viene dichiarato.

### Azione

Registrare:

```text
code/runtime baseline
current document/repository review commit
eventuale delta applicativo fra i due
```

### Criterio di chiusura

Un lettore può sapere:

```text
su quale codice si basa la fotografia
e
su quale stato documentale è stata verificata.
```

---

## `CURRENT-STATE-002` — stale `docs/archive/README.md`

**Priorità:** medium  
**Tipo:** stale reference / provenance owner

### Problema

Il documento attribuisce una responsabilità a un file assente sul commit corrente.

### Azione

Identificare l’owner reale attuale della provenance delle fonti consolidate.

Non ricreare il file senza decisione.

### Criterio di chiusura

Nessuna affermazione del Current State rimanda implicitamente a un path inesistente.

---

## `CURRENT-STATE-003` — historical validation inventory artifact-backed

**Priorità:** high  
**Tipo:** validation provenance aggregation

### Problema

Il Current State presenta:

```text
launcher / Stop / lifecycle
```

come osservazioni appartenenti a `docs/validations/`, ma l’indice corrente non contiene un artifact corrispondente.

### Azione

Per ogni validazione elencata:

```text
link a artifact
oppure
historically reported / non registrato
oppure
not executed
```

### Criterio di chiusura

La roadmap non aumenta mai il livello di prova rispetto all’artifact originale.

---

# 24. Modifiche documentali senza nuovo Change ID

Queste correzioni rientrano in `DOC-001` / `DOC-022`.

## Base table

Qualificare:

```text
diagnostica redatta
process isolation
point-by-point supportato
tracking coordinato
```

con i limiti realmente aperti.

## Limiti runtime

Aggiungere almeno:

```text
working-copy-aware reuse
CLI outcome
```

senza duplicare il runbook.

## Limiti SofaScore

Aggiungere:

```text
PBP/localContext source-contract validation incompleta
```

## Limiti Betfair

Aggiungere:

```text
finished authority
diagnostic/log/capture boundary
```

## Limiti Tracking

Aggiungere:

```text
Start acknowledgement
mismatch physical cleanup
restart/session isolation
```

## Limiti storage

Sostituire parte dei problemi troppo generici con i failure mode critical realmente aperti.

## Limiti validation

Aggiungere:

```text
offline intended ≠ sandbox
process child ≠ tree drain
HEAD ≠ exact working tree
```

## Retention

Aggiungere stato tripartito:

```text
manual dry-run implemented
real apply not validated
automatic periodic retention absent
```

## Pass count

Spostare/rimandare a artifact.

## Owner detail

Ridurre la sequenza esatta di shutdown e persistence ai soli invarianti necessari.

---

# 25. Aspetti corretti da preservare

```text
1. Current State non è più una cronologia task-by-task.
2. Future implementation resta nei registri.
3. Base implementata è separata dai limiti.
4. Deprecated è distinto da removed.
5. Historical validation è distinta da current automatic PASS.
6. Funzioni non presenti sono dichiarate esplicitamente.
7. Source Identity session authority mancante è visibile.
8. Stop cleanup parziale è visibile.
9. UI integrity incompleta è visibile.
10. Market Reactions provenance incompleta è visibile.
11. No replay/backtesting è dichiarato.
12. No Betfair Stream API è dichiarato.
13. No automatic retention è dichiarato.
14. No persistence/benchmark/live runner profile è dichiarato.
15. Market Reactions resta non-causale.
16. Evidence cross-source è sospesa su persistence incomplete.
17. Strategy è deprecata, non rimossa.
18. /odds è classificata legacy/deprecata.
19. Historical validation non viene chiamata current PASS.
20. Registri sono usati per task future, non come prova di implementazione.
```

---

# 26. Modularizzazione

## Dimensione

```text
199 righe
```

La lunghezza non è un problema.

Anzi, il documento dovrebbe probabilmente diventare leggermente più corto dopo la rimozione dei dettagli owner.

## Responsabilità

Il file ha una sola responsabilità:

```text
fotografia sintetica dello stato corrente
```

Le sezioni:

```text
base
behaviors
limits
deprecated
historical validations
not present
task sources
```

sono tutte componenti naturali della stessa vista.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
current-runtime.md
current-storage.md
current-validation.md
```

Gli approfondimenti esistono già nei documenti owner.

---

# 27. Verification matrix proposta per il Current State

## A. Baseline code vs current commit

```text
current commit
→ compare code baseline
```

Classificare:

```text
application code delta
docs-only delta
tooling delta
```

---

## B. Base table claim → owner

Per ogni riga:

```text
Runtime
Backend
Sofa
Betfair
Tracking
Storage
Evidence
Frontend
Security
Validation
```

verificare almeno un owner reale.

---

## C. Base table claim → open critical/high

Se un’area ha finding critical/high aperti:

```text
non deve apparire come “complete”
```

senza qualificazione.

---

## D. Runtime limitations

Verificare che:

```text
LOCAL-RUNTIME-001..007
```

siano rappresentati per categoria, non copiati uno per uno.

---

## E. SofaScore limitations

Verificare almeno:

```text
PBP source contract
current game authority
/analyze writer authority
```

come classe di limite.

---

## F. Betfair limitations

Verificare almeno:

```text
finished authority
health/auth recovery semantics
diagnostic/capture/log boundary
```

---

## G. Tracking limitations

Verificare:

```text
session authority
Start acknowledgement
Stop partial
mismatch cleanup
restart isolation
```

---

## H. Storage limitations

Verificare che il Current State non ometta:

```text
read fail-closed
prepared vs committed
journal target verification
integrity unreadable
```

quando queste task sono ancora critical.

---

## I. Validation runner wording

Reject:

```text
offline = sandbox
```

Reject:

```text
process isolation = descendants guaranteed gone
```

Accept:

```text
manifest-declared offline profiles
child execution
bounded timeout/output
known isolation limitations
```

---

## J. Retention

Verificare la tripartizione:

```text
manual dry-run
real apply
automatic periodic
```

---

## K. Historical Source Identity

Ogni caso `live_observed` deve essere presente nell’artifact Source Identity.

---

## L. Historical Betfair

Ogni caso `live_observed` deve essere presente nell’artifact Betfair.

---

## M. Launcher/Stop

Se nessun artifact esiste:

```text
non classificare come archived validation
```

---

## N. Archive provenance path

Ogni path citato come authority corrente deve:

```text
esistere
```

oppure essere esplicitamente:

```text
historical Git path
```

---

## O. Deprecated surfaces

Verificare che:

```text
Strategy
untrack/debug
/odds
```

esistano ancora prima di chiamarle “presenti”.

---

## P. Not implemented list

Per ogni voce:

```text
search implementation
→ nessun owner runtime attivo
```

---

## Q. Pass-count

Se mantenuto:

```text
deve avere artifact + baseline
```

Altrimenti rimuovere il numero.

---

## R. DOC-001 ownership

Verificare che il Current State non contenga:

```text
procedure completa
payload completo
test matrix completa
shutdown algorithm completo
```

---

## S. DOC-022 freshness

Prima di ogni pubblicazione:

```text
Todo/ledger audit
→ critical/high open
→ Current State class-level limit
```

Non serve riportare tutte le task.

---

# 28. Ordine consigliato di applicazione

```text
1. CURRENT-STATE-002
   → eliminare subito il riferimento archive inesistente

2. CURRENT-STATE-003
   → rendere artifact-backed la sezione validazioni storiche

3. CURRENT-STATE-001
   → dual baseline/provenance

4. DOC-022
   → refresh dei limiti usando audit 023–037

5. DOC-001
   → ridurre duplicazione owner e pass-count inline

6. link/registry/documentation checks

7. validare i link e i path testuali rilevanti

8. non modificare codice runtime durante questa revisione documentale
```

---

# 29. Decisione finale

```text
01-current-state.md:

STRUTTURA BUONA.
MOLTO MIGLIORATO RISPETTO ALLA ROADMAP STORICA.

NON RISCRIVERE DA ZERO.
NON DIVIDERE.

MA NON È ANCORA AFFIDABILE
COME FOTOGRAFIA COMPLETA DEI LIMITI CORRENTI.

DOC-001:
→ quasi risolto
→ residua duplicazione di lifecycle/test detail

DOC-022:
→ parzialmente risolto
→ deve restare aperto
→ i report 023–037 hanno introdotto limiti critical/high
   non ancora riflessi nella roadmap

Nuovi finding:
CURRENT-STATE-001
→ baseline runtime e document baseline da distinguere

CURRENT-STATE-002
→ docs/archive/README.md non esiste più

CURRENT-STATE-003
→ launcher/Stop/lifecycle non risultano
   supportati da un artifact docs/validations corrente

Nessuna nuova task tecnica duplicata.

Modularizzazione:
NO

Nuovi file:
NO

Priorità:
ALTA
```

La regola che deve governare questo documento è:

```text
Current State
→ non deve contenere ogni finding
→ ma non deve nascondere classi di rischio critical/high
→ non deve alzare il livello di prova
→ non deve citare owner/path non più esistenti
→ deve separare runtime baseline da document provenance
```

---

# 30. Riferimenti per il futuro aggiornamento della mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-038

Documento:
docs/tennis-decision-ui/roadmap/01-current-state.md

Nuovi Change ID:
CURRENT-STATE-001
CURRENT-STATE-002
CURRENT-STATE-003

Finding esistenti richiamati:
DOC-001
DOC-022
LOCAL-RUNTIME-*
SOFA-LIVE-*
LIVE-CTRL-*
LOCAL-PBP-*
BETFAIR-SCRAPER-*
BETFAIR-DIAG-*
STORAGE-TH-*
JOURNAL-REC-*
VALID-ROLL-*
RETENTION-*
CLEANUP-002
CLEANUP-003

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 31. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 38
Da analizzare: 34
Avanzamento: 52,78%

Nuovo blocco 038–042:
[✓] 038 roadmap/01-current-state.md
[ ] 039 docs/validations/README.md
[ ] 040 docs/validations/betfair-live-validation-2026-07-04.md
[ ] 041 docs/validations/documentation-migration-finalization-2026-08-03.md
[ ] 042 docs/validations/source-identity-live-verification.md
```

Il prossimo documento canonico è:

```text
docs/validations/README.md
```

La mappa e il ledger cumulativi non vengono aggiornati prima del report 042.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `CURRENT-STATE-001…003`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
