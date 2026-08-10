# Report documentale — `docs/tennis-decision-ui/operations/05-retention-and-cleanup.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-036
Sequenza audit: 36/72
Documento analizzato: 05-retention-and-cleanup.md
Percorso documento: docs/tennis-decision-ui/operations/05-retention-and-cleanup.md
Percorso report: Report documentale/36 - 05-retention-and-cleanup.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 67c53d4d538b6d1a495d93e23f94c0c4ffd7a408
Ruolo dichiarato: classificazione artefatti locali, retention cache, backup e pulizia controllata
Stato report: completato
```

Il documento è stato confrontato con:

- `scripts/cleanup_runtime_cache.py`;
- `scripts/cleanup_runtime_cache_test.py`;
- `launcher/config.py`;
- `launcher/services.py`;
- `launcher/session.py`;
- `scrapers/sofa/cache.py`;
- `scrapers/sofa/config.py`;
- `scrapers/betfair/cache.py`;
- `scrapers/betfair/config.py`;
- `docs/tennis-decision-ui/reference/01-repository-map.md`;
- i change brief della Task 3 retention;
- `CLEANUP-002`;
- `CLEANUP-003`;
- `SECURITY-002`;
- `IMPL-011`;
- `TEST-018`;
- i requisiti `TEST-065`, `TEST-066`, `TEST-067`;
- i finding di persistence, runtime e diagnostica già aperti.

GitHub non è stato modificato.

La mappa Markdown di continuazione e il JSON incrementale non vengono aggiornati con questo report. Il checkpoint cumulativo resta dopo il report 037.

---

# Esito sintetico

```text
Coerenza generale:                         ALTA
Classificazione cache/canonico:            ALTA
Allow-list utility:                        ALTA
Dry-run:                                   ALTA
Stato di validazione dichiarato:           CORRETTO
Apply reale:                               NON AUTORIZZABILE COME VALIDATO
Offline safety corrente:                   INCOMPLETA, finding già noto
Policy max-age:                            COERENTE
Policy max-files/max-total-bytes:          SEMANTICA NON ESPLICITATA
Unlink race / metadata recheck:             INCOMPLETO, già CLEANUP-002 / IMPL-011
Semantica failure durante apply:            INCOMPLETA
Backup consistency:                        NON OPERAZIONALIZZATA
Dump/log retention:                        APERTA, già CLEANUP-003
Cache filename privacy/provenance:          APERTA, già SECURITY-002
Evidence derived-store semantics:          CORRETTA
Writer authority exclusions:               CORRETTE

Nuovi finding:                              3
Finding esistenti da rendere più espliciti: 4
Riscrittura completa:                       NO
Revisione mirata:                           SÌ
Modularizzazione:                           NO
Nuovi documenti canonici:                   nessuno
Priorità complessiva:                       ALTA
```

Il documento è molto più solido rispetto alle versioni storiche.

In particolare sono corretti e vanno preservati:

```text
cache
≠
history/timeline
≠
journal
≠
writer authority
≠
Evidence derivata
```

e:

```text
retention
≠
recovery
≠
repair
≠
cleanup manuale della persistence
```

La criticità non è l’allow-list.

La criticità è il passaggio:

```text
dry-run prudente
→ apply realmente esclusivo e verificabile
```

che oggi non esiste ancora.

---

# 1. Il documento deve rendere `IMPL-011` un prerequisito esplicito del primo apply reale

## Esito: finding già esistente, ma runbook ancora troppo permissivo

Il documento dice correttamente:

```text
--apply --offline-confirmed
→ non ancora validato operativamente
```

e richiede:

```text
sessione offline
launcher lock assente
porte runtime libere
```

Il problema è che il backlog tecnico ha già stabilito una precondizione più forte.

Il finding corrente è:

```text
CLEANUP-002
→ Apply offline privo di maintenance authority e porte effettive
```

e la decisione approvata è:

```text
implementare IMPL-011
prima di un apply reale validato
```

Il runbook invece continua a formulare il primo apply come:

```text
non usare finché non viene autorizzata una sessione offline dedicata
```

Questa frase può essere interpretata come:

```text
utente conferma offline
+ 3000/3001 libere
+ lock launcher assente
→ apply consentito
```

Non è più la governance approvata.

## Stato reale della utility

`check_apply_session_safety()` verifica soltanto:

```text
launcher/.runtime/launcher.lock esiste?
porta 3000 occupata?
porta 3001 occupata?
```

Non legge il manifest runtime e non acquisisce un lock di manutenzione.

## Stato reale del launcher

Il launcher non è vincolato alle sole porte preferite.

Backend:

```text
preferred 3001
→ fallback fino a 3005
```

Frontend:

```text
preferred 3000
→ discovery su più porte alternative
→ può riusare o avviare su porta diversa
```

Quindi:

```text
3000 libera
3001 libera
```

non dimostra:

```text
nessun backend Tennis Decision attivo
nessun frontend Tennis Decision attivo
nessun writer attivo
nessun processo che può ricreare cache
```

## Writer authority

La utility non consulta:

```text
backend/match_history/.writer_authority/
```

e non prova che non esista un backend writer valido.

È corretto che retention non modifichi `.writer_authority/`.

Ma l’assenza di manipolazione non equivale a:

```text
assenza di writer concorrente
```

## Race

Anche quando:

```text
lock launcher assente
porte preferite libere
```

la utility non possiede un lock esclusivo che impedisca:

```text
nuovo launcher
nuovo backend
nuovo scraper
nuova scrittura cache
```

fra il controllo e l’unlink.

## Decisione documentale

Il testo deve diventare inequivocabile:

```text
STATO ATTUALE:

dry-run
→ consentito

apply reale
→ NON considerato autorizzabile/validabile
→ finché IMPL-011 non è implementata
→ e TEST-018 non verifica il nuovo contratto
```

Non è sufficiente:

```text
--offline-confirmed
```

per trasformare il percorso attuale in maintenance-safe.

## Dipendenza esistente

Non creare un nuovo finding tecnico.

Owner già presenti:

```text
CLEANUP-002
IMPL-011
TEST-018
```

---

# 2. `IMPL-011` copre anche il recheck file che oggi è insufficiente

## Esito: finding già esistente da riportare con maggiore precisione

Durante lo scan la utility memorizza:

```text
path
size
mtime
```

Prima della cancellazione esegue però soltanto:

```text
lstat
→ regular file?
→ non symlink?
```

Non confronta con il record originario:

```text
file identity
size
mtime
```

Quindi la sequenza corrente può essere:

```text
scan old.json
→ candidato
→ file viene sostituito con un nuovo regular old.json
→ pre-unlink check: regular file = sì
→ unlink
```

Il file cancellato può non essere quello effettivamente nominato durante lo scan.

Questo è già esplicitamente registrato dentro `CLEANUP-002` e `IMPL-011`.

Il contratto approvato per `IMPL-011` richiede:

```text
file identity
+ size
+ mtime
→ confrontati immediatamente prima dell’unlink
```

e:

```text
file cambiato
→ skip
→ reason strutturata
```

## Decisione

Non creare una nuova task.

Il documento deve però evitare di far sembrare sufficiente:

```text
solo file .json regolari
```

per la sicurezza dell’apply.

È vero per lo scan.

Non è ancora sufficiente come prova di:

```text
same-file-before-delete
```

---

# 3. `--max-files` e `--max-total-bytes` sono per-cache, non globali

## Esito: nuovo gap documentale

Il documento elenca:

```text
--max-age-days
--max-files
--max-total-bytes
```

ma non specifica il dominio su cui vengono applicate.

Il codice è chiaro.

`_select_candidates()` itera:

```text
for cache_name, records in records_by_cache.items()
```

e applica ogni policy separatamente al relativo `records`.

Quindi:

```text
--cache betfair
--cache sofa
--max-files 100
```

non significa:

```text
massimo 100 JSON complessivi
```

Significa:

```text
massimo 100 JSON Betfair
+
massimo 100 JSON Sofa
```

analogamente:

```text
--max-total-bytes 100000000
```

è applicato separatamente a ciascuna cache selezionata.

## `--max-age-days`

Anche la soglia temporale viene valutata per ogni cache, ma la semantica è naturalmente equivalente a una condizione per-file e quindi crea meno ambiguità.

## Perché conta

Un operatore può usare:

```text
--cache betfair
--cache sofa
--max-total-bytes X
```

pensando di imporre:

```text
budget disco complessivo X
```

mentre il limite effettivo può arrivare fino a:

```text
circa X per Betfair
+
circa X per Sofa
```

## Finding `RETENTION-001` — scope per-cache delle policy di cap

**Priorità:** medium  
**Tipo:** retention policy semantics

### Correzione minima documentale

Aggiungere:

```text
Le policy vengono valutate indipendentemente
per ogni cache selezionata.

--max-files N
→ fino a N file eleggibili per cache

--max-total-bytes N
→ fino a N byte eleggibili per cache

non:
→ N complessivi fra tutte le cache
```

### Decisione futura facoltativa

Se serve un budget globale:

```text
global-max-files
global-max-total-bytes
```

o semantica equivalente devono essere introdotti esplicitamente.

Non cambiare silenziosamente il significato dei flag esistenti.

### Verification

Fixture:

```text
Betfair: 3 file
Sofa: 3 file
--max-files 2
```

Atteso corrente:

```text
1 candidato Betfair
1 candidato Sofa
2 candidati complessivi
```

Non:

```text
4 candidati
per ridurre il totale globale a 2
```

---

# 4. Un apply fallito può aver già eliminato file

## Esito: nuovo gap operativo importante

Il documento dice correttamente che un cleanup fallito non deve modificare:

```text
history
timeline
Source Identity
journal
authority
Evidence
```

Questo è vero rispetto alle aree canoniche escluse.

Ma manca una semantica fondamentale sullo stesso set di cache.

## Comportamento reale

Nel loop di apply:

```text
candidate 1
→ unlink

candidate 2
→ unlink fallisce
→ error registrato
→ CONTINUA

candidate 3
→ unlink
```

La suite contiene un test esplicito:

```text
failing.json
→ unlink error

removable.json
→ viene comunque eliminato
```

Quindi l’utility è intenzionalmente:

```text
best-effort per-file
```

non:

```text
all-or-nothing
```

## Exit code

A fine esecuzione:

```text
errors non vuoto
→ exit 1
```

ma il report può contemporaneamente contenere:

```text
removed: [ ... ]
recoveredBytes > 0
errors: [ ... ]
```

Quindi:

```text
exit code 1
≠
nessun file eliminato
```

## Perché è importante

Un operatore potrebbe vedere:

```text
comando fallito
```

e assumere:

```text
nessuna modifica applicata
```

Questa assunzione è falsa.

## Rollback

La frase:

```text
il rollback delle cache consiste nel lasciare che il fetch successivo le ricrei
```

è corretta come recovery funzionale.

Ma non è un rollback transazionale.

Dopo la prima rimozione riuscita:

```text
contenuto precedente
→ non viene ripristinato dalla utility
```

La cache futura potrà essere rigenerata, ma:

```text
identico file precedente
≠
garantito
```

## Finding `RETENTION-002` — partial destructive outcome esplicito

**Priorità:** high  
**Tipo:** destructive CLI result semantics

### Documento

Formalizzare:

```text
apply
→ cancellazioni indipendenti per file
→ un errore non annulla cancellazioni già riuscite
→ il comando può uscire 1 con removed non vuoto
```

### Report da leggere obbligatoriamente

Dopo ogni apply:

```text
blocked
blockReasons
removed
recoveredBytes
skipped
errors
```

non soltanto l’exit code.

### Miglioria strutturale possibile

Aggiungere al report uno stato esplicito, per esempio:

```text
completed
blocked
partial
failed_before_removal
```

o equivalente.

Non è obbligatorio cambiare subito l’algoritmo in transazionale.

Per cache rigenerabili il best-effort può essere una scelta valida, ma deve essere dichiarata.

### Verification

Caso:

```text
A eliminato
B unlink error
C eliminato
```

Atteso:

```text
exit 1
removed=[A,C]
errors=[B]
recoveredBytes=sum(A,C)
```

e la documentazione deve chiamarlo:

```text
partial apply
```

non:

```text
nessuna modifica perché il comando è fallito
```

---

# 5. Il report JSON può contenere filename derivati dalle URL

## Esito: conseguenza di `SECURITY-002`, non nuovo finding

Il documento richiede per il primo apply futuro:

```text
output JSON registrato
```

Il report della retention include per i candidati:

```text
path
```

La cache Betfair corrente costruisce il filename da:

```text
URL normalizzata
→ caratteri non alfanumerici sostituiti
→ troncamento a 100
```

Quindi il path può incorporare frammenti dell’identità originata dalla URL.

Questo è già registrato come:

```text
SECURITY-002
→ cache filename e identità inadeguati
```

con decisione:

```text
nessun frammento URL nel filename
→ futura identità hash/versionata
```

## Conseguenza per retention

Fino alla chiusura di `SECURITY-002`:

```text
retention JSON report
→ artefatto locale potenzialmente sensibile
→ non assumere che i path siano anonimizzati
→ non condividere automaticamente
```

La redazione del contenuto cache non risolve il nome del file.

## Decisione

Non creare un altro SECURITY finding.

Agganciare il runbook a:

```text
SECURITY-002
```

quando parla di:

```text
output JSON registrato
backup
artefatti di validazione
```

---

# 6. `dump diagnostici scaduti` non ha ancora una definizione eseguibile

## Esito: conseguenza di `CLEANUP-003`, non nuovo finding

Il backup esclude automaticamente:

```text
dump diagnostici scaduti
```

ma oggi non esiste una policy implementata che definisca:

```text
scaduto
```

per:

```text
backend/betfair_network_dump/
```

Il finding esistente è:

```text
CLEANUP-003
→ log e network dump senza retention distinta
```

Decisione approvata:

```text
cache
→ retention ordinaria

network dump
→ opt-in + retention breve

runtime log
→ rotazione per size/count
```

Finché tale policy non esiste, il termine:

```text
scaduto
```

è descrittivo, non machine-checkable.

## Correzione documentale

Preferire:

```text
dump diagnostici non richiesti dal backup
e non necessari a un incidente/audit aperto
```

oppure:

```text
dump selezionati da una futura policy dedicata
```

senza far sembrare già esistente una scadenza automatica.

## Decisione

Non creare un nuovo finding.

Owner:

```text
CLEANUP-003
```

---

# 7. Il backup richiede coerenza multi-file ma il documento non definisce come ottenerla

## Esito: nuovo gap operativo

La sezione Backup contiene una regola corretta:

```text
history
timeline
.pending_commits
conferme applicabili
validazioni collegate
→ preservare coerenza
```

e vieta:

```text
copiare soltanto una parte
→ trattarla come base completa
```

Il problema è che il documento non definisce un punto di snapshot.

## Storage mutabile

Durante il runtime:

```text
history
timeline
journal
Source Identity confirmation
```

possono cambiare in momenti differenti.

Il commit journal serve a rendere osservabile e recuperabile la persistence applicativa.

Non rende automaticamente atomica una copia filesystem esterna.

## Writer authority

La writer authority garantisce:

```text
un backend writer per storage identity
```

Non garantisce:

```text
un backup reader vede tutti i file nello stesso istante logico
```

## Stop Live Tracking

Lo Stop Live ferma/draina il tracking, ma:

```text
backend resta attivo
writer authority resta acquisita
nuovo Start può essere richiesto
```

Quindi non equivale da solo a una maintenance snapshot lock.

## Shutdown completo

Un backend completamente chiuso dopo tracker drain fornisce una situazione molto più stabile.

Ma senza una maintenance authority condivisa un nuovo processo può teoricamente partire mentre viene eseguita una copia lunga.

## Conseguenza

La frase:

```text
preservare la coerenza
```

è corretta come obiettivo, ma non è ancora una procedura verificabile.

## Finding `RETENTION-003` — consistent backup snapshot boundary

**Priorità:** high  
**Tipo:** backup / persistence snapshot consistency

### Obiettivo

Definire per backup destinati a:

```text
restore
audit
ripresa di stato incompleto
```

una procedura che renda esplicito:

```text
quando la persistence è quiescente
chi impedisce nuove scritture
come viene acquisito il set di file
come viene verificato il set copiato
```

### Opzioni tecniche da valutare

Non scegliere automaticamente una soluzione in questo report.

Possibili direzioni:

```text
A.
maintenance authority project-owned
→ storage quiescente
→ backup
→ release

B.
export/snapshot project-owned
→ legge e valida target/journal
→ produce package coerente

C.
backend completamente spento
+ lock di maintenance che impedisce restart
→ copia
```

### Non fare

Non usare:

```text
copia live arbitraria
```

come se fosse un backup coerente soltanto perché:

```text
ogni singolo JSON è valido
```

### Relazione con `IMPL-011`

`IMPL-011` può essere un building block naturale perché introduce:

```text
maintenance lock project-owned
```

ma il suo scope approvato corrente è cleanup offline.

Non estenderlo implicitamente.

Serve una decisione esplicita:

```text
maintenance authority unica anche per backup
```

oppure:

```text
backup snapshot authority separata
```

### Verification minima futura

Scenario:

```text
history copiato
→ writer completa timeline
→ timeline copiata
```

Il backup non deve essere dichiarato:

```text
coerente
```

senza una prova di snapshot boundary.

---

# 8. Stato e validazione della utility sono documentati correttamente

## Esito: confermato

Il documento dice:

```text
Implementato, da validare
```

e separa:

```text
test unitari
py_compile
dry-run reale
```

da:

```text
apply reale
```

La validazione storica della Task 3 conferma:

```text
18 test eseguiti
17 passati
1 saltato
```

Lo skip riguardava la creazione di symlink nell’ambiente Windows.

Inoltre:

```text
py_compile
→ PASS
```

e:

```text
dry-run reale
→ 50 file
→ 1.548.868 byte
→ 32 candidati Sofa
→ 0 rimossi
→ 0 errori
```

Quindi la formulazione:

```text
utility implementata e verificata in dry-run
apply reale non validato
```

è corretta.

Non va promossa a:

```text
retention completamente validata
```

finché non cambia il contratto di authority.

---

# 9. La allow-list è realmente rigida

## Esito: confermato

La CLI accetta esclusivamente:

```text
--cache betfair
--cache sofa
```

mappati a:

```text
backend/betfair_cache
backend/scraper_cache
```

Non espone una opzione:

```text
--directory arbitraria
```

Il test verifica anche che un parametro non supportato:

```text
--directory
```

venga rifiutato.

L’API interna `run_cleanup()` accetta `project_root` soltanto come injection point di test, mentre il caller CLI usa `PROJECT_ROOT`.

La classificazione documentale è quindi corretta:

```text
utility cache allow-list
≠
cleanup filesystem generico
```

Preservare questa proprietà.

---

# 10. No recursion, symlink e non-JSON: corretti

## Esito: confermato

La scansione usa:

```text
os.scandir(cache_dir)
```

senza ricorsione.

Esclude:

```text
cache root symlink
entry symlink
directory
non-regular
non-.json
```

I test verificano:

```text
directory skip
non-json skip
symlink skip quando supportato dall’ambiente
```

La formulazione del documento è corretta.

---

# 11. Il documento protegge correttamente journal e writer authority

## Esito: confermato

La versione corrente ha corretto il vecchio path journal:

```text
backend/match_history/.pending_commits/
```

e distingue:

```text
.pending_commits
→ commit/recovery sidecar

.writer_authority
→ process ownership sidecar
```

Entrambi sono fuori dall’allow-list.

Sono inoltre vietati:

```text
manual delete
manual repair
cleanup per sbloccare backend
cleanup per eliminare partial_persistence
cleanup per eliminare recovery_failed
```

Questa parte deve restare invariata.

L’authority residua è correttamente descritta come recuperabile soltanto quando l’owner è positivamente morto.

---

# 12. Evidence come vista derivata è documentata correttamente

## Esito: confermato

Il documento evita di inventare:

```text
backend/evidence/
```

o altro store persistito inesistente.

Definisce:

```text
Sofa timeline
+ Betfair timeline
+ Source Identity
+ persistence integrity
→ Evidence snapshot
```

La retention deve quindi operare sugli input reali, non su un immaginario store Evidence.

Corretto anche:

```text
eventuale export Evidence futuro
→ owner e policy soltanto quando realmente implementato
```

---

# 13. Le cache applicative hanno TTL molto più corti della retention su disco

## Esito: distinzione corretta

Sofa cache:

```text
CACHE_TTL_SECONDS = 5
```

Betfair cache:

```text
CACHE_TTL_SECONDS = 4
```

La retention verificata:

```text
--max-age-days 7
```

non altera questi TTL.

Quindi:

```text
cache non più usabile applicativamente
≠
file immediatamente cancellato dal disco
```

Il documento lo dice correttamente:

```text
retention su disco
≠
TTL applicativo
```

Preservare.

---

# 14. L’output strutturato è utile, ma non è ancora un validation artifact forte

## Esito: limite da documentare

Il report utility contiene:

```text
mode
selectedCaches
policies
blocked
blockReasons
scanned
candidates
removed
skipped
recoveredBytes
errors
```

È utile per verificare una singola esecuzione.

Ma non contiene nativamente:

```text
repository SHA
versione utility
working-tree provenance
host/environment identity
runtime manifest identity
maintenance authority identity
start/completed timestamp espliciti della run
```

Il documento dice:

```text
output JSON registrato
```

per il primo apply futuro.

Questo è corretto come evidenza minima, ma non va confuso con:

```text
validation artifact completo
```

## Relazione con report 035

Il finding `VALID-ROLL-001` ha già registrato il problema generale della provenance delle validazioni.

Non creare un duplicato.

Quando il primo apply verrà realmente autorizzato, l’artefatto dovrà essere accompagnato da:

```text
baseline
versione del codice
stato di maintenance
comando/policy
risultato
limiti
```

secondo la policy generale delle validazioni.

---

# Finding esistenti da NON duplicare

## `CLEANUP-002`

```text
apply offline
→ manca maintenance authority
→ mancano porte effettive
→ manca service identity
→ manca writer-aware exclusion
→ manca same-file metadata comparison
```

Resta aperto.

---

## `IMPL-011`

Owner tecnico approvato per:

```text
maintenance lock
runtime manifest
porte effettive
service identities
recheck identity/size/mtime
structured changed-before-removal reason
```

Resta necessario prima di un apply reale validato.

---

## `TEST-018`

Deve verificare:

```text
porte effettive
authority
recheck metadata
policy separate
```

Non risulta chiuso.

---

## `CLEANUP-003`

Owner per:

```text
network dump retention
runtime log rotation
```

Non estendere la cache utility a dump/log per “chiudere più in fretta” il finding.

---

## `SECURITY-002`

Owner per:

```text
cache filename identity
URL fragments
collisioni
mode/runtime/Graph context
```

La retention deve soltanto riconoscere che il proprio report può ereditare quei filename.

---

## `TEST-065 / TEST-066 / TEST-067`

Restano relativi all’infrastruttura di test/sandbox generale:

```text
cleanup sandbox
runtime dirs protected
fixture contract
```

Non confonderli con il cleanup operativo delle cache.

---

# Nuovi finding

## `RETENTION-001` — scope per-cache di `max-files` e `max-total-bytes`

**Priorità:** medium

### Problema

I flag sono documentati senza specificare che vengono valutati per ciascuna cache selezionata.

### Correzione

Documentare la semantica attuale.

### Non fare

Non cambiare la CLI in global-cap senza decisione e migrazione esplicita.

---

## `RETENTION-002` — apply parziale con exit code non-zero

**Priorità:** high

### Problema

Un errore su un candidato non ferma le altre cancellazioni.

```text
exit 1
≠
zero removals
```

### Correzione

Documentare il best-effort per-file e obbligare la lettura di `removed/errors/recoveredBytes`.

### Possibile miglioramento

Stato strutturato `partial` o equivalente.

---

## `RETENTION-003` — backup snapshot consistency

**Priorità:** high

### Problema

Il runbook richiede coerenza fra più artefatti ma non definisce una snapshot boundary capace di garantirla.

### Correzione

Definire una procedura project-owned per backup di restore/audit.

### Dipendenza possibile

`IMPL-011` può diventare building block soltanto dopo decisione esplicita sul suo scope.

---

# Aspetti corretti da mantenere

```text
1. dry-run default
2. apply richiede due flag
3. allow-list fissa
4. no arbitrary directory
5. no recursion
6. symlink esclusi
7. solo JSON regulari
8. journal escluso
9. writer authority esclusa
10. Source Identity esclusa
11. Evidence non trattata come store
12. dump/log fuori utility cache
13. profile Chrome escluso
14. nessun kill Chrome
15. nessun recovery
16. nessun repair
17. no cleanup partial_persistence
18. no cleanup recovery_failed
19. TTL applicativi invariati
20. automatic retention non implementata
21. real apply non dichiarato validato
22. backup non include credenziali
23. writer authority non viene copiata come ownership
```

---

# Modularizzazione

## Valutazione

Il documento tratta:

```text
artifact classification
cache retention
diagnostic retention boundaries
backup
controlled cleanup
validation state
```

Sono argomenti differenti ma condividono una stessa domanda:

```text
quale artefatto locale può essere conservato,
copiato o cancellato,
e con quale authority?
```

Questa coesione è ancora sufficiente.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare ora:

```text
backup.md
cache-cleanup.md
dump-retention.md
```

Soltanto se `RETENTION-003` porterà a una vera procedura di snapshot/restore sostanziale potrà avere senso un owner dedicato.

Per ora il runbook corrente resta l’owner corretto.

---

# Correzioni documentali consigliate

## Correzione 1 — stato apply

Sostituire la semantica:

```text
primo apply
→ sessione offline dedicata
```

con:

```text
primo apply reale
→ bloccato come percorso validato
finché:
CLEANUP-002 non è risolto
IMPL-011 non è implementata
TEST-018 non è passato
```

---

## Correzione 2 — porte

Non scrivere genericamente:

```text
porte backend/frontend libere
```

come se la utility verificasse le porte realmente selezionate.

Scrivere:

```text
implementazione corrente:
→ controlla soltanto 3000 e 3001

contratto richiesto prima dell’apply reale:
→ porte effettive dal runtime manifest
→ service identity
→ maintenance authority
```

---

## Correzione 3 — policy per cache

Aggiungere:

```text
max-files e max-total-bytes
sono applicati separatamente
a ogni cache selezionata
```

---

## Correzione 4 — partial apply

Aggiungere:

```text
un exit code 1 può accompagnare
rimozioni già eseguite

verificare sempre:
removed
errors
recoveredBytes
```

---

## Correzione 5 — report JSON

Aggiungere:

```text
i path nei report possono riflettere
filename cache derivati dalla URL
finché SECURITY-002 resta aperto

→ artefatto locale
→ non condividere automaticamente
```

---

## Correzione 6 — dump "scaduti"

Non usare `scaduto` come stato implementato prima di `CLEANUP-003`.

---

## Correzione 7 — backup

Aggiungere:

```text
la coerenza multi-file è un requisito,
non una proprietà automatica della copia filesystem

backup restore/audit
→ richiede snapshot boundary project-owned
```

---

# Ordine consigliato

```text
1. Correggere immediatamente il runbook
   → apply non autorizzabile come validato prima di IMPL-011/TEST-018

2. IMPL-011
   → maintenance authority

3. TEST-018
   → porte effettive + authority + metadata recheck

4. RETENTION-002
   → rendere esplicita la semantica partial apply

5. RETENTION-001
   → chiarire scope per-cache delle policy

6. SECURITY-002
   → filename hash/provenance per cache future

7. CLEANUP-003
   → policy separate log/dump

8. RETENTION-003
   → decidere snapshot boundary per backup

9. Solo dopo 1–4 almeno
   → pianificare una validazione reale controllata dell’apply

10. aggiornare documentazione e validation artifact

11. checker documentali

12. aggiornamento cumulativo mappa/ledger dopo report 037
```

La priorità operativa più importante è:

```text
NON eseguire il primo apply reale
basandosi soltanto su:
--offline-confirmed
+ lock launcher assente
+ 3000/3001 libere
```

perché il progetto ha già approvato un contratto di manutenzione più forte.

---

# Verification matrix proposta

## A. Dry-run baseline

```text
--cache betfair
--cache sofa
--max-age-days 7
```

Atteso:

```text
removed=[]
filesystem invariato
candidate report coerente
```

---

## B. Apply senza conferma

```text
--apply
senza --offline-confirmed
```

Atteso:

```text
blocked=true
zero scan
zero candidate
zero removal
exit 2
```

Preservare.

---

## C. Preferred port occupied

```text
3000 occupied
```

Atteso corrente:

```text
blocked
```

Preservare.

---

## D. Fallback backend attivo

Scenario launcher:

```text
3001 foreign
backend Tennis Decision attivo su 3002
3000 libero
3001 successivamente libero o non indicativo
launcher lock assente/stale scenario controllato
```

Target dopo `IMPL-011`:

```text
apply blocked
via runtime/service identity
```

La utility corrente non dimostra questa proprietà.

---

## E. Fallback frontend attivo

Frontend Tennis Decision:

```text
porta alternativa
```

Target:

```text
apply blocked
```

senza hard-code del solo `3000`.

---

## F. Writer authority attiva

```text
backend writer vivo
.writer_authority valida
```

Target:

```text
apply blocked
```

Non cancellare l’authority.

---

## G. Authority unknown

```text
owner non verificabile
```

Target:

```text
fail-closed
```

Non reinterpretare `unknown` come offline.

---

## H. Race launcher

```text
safety check completato
→ prima del primo unlink
→ altro processo prova ad acquisire runtime
```

Target dopo maintenance authority:

```text
uno dei due è bloccato in modo deterministico
```

---

## I. File replacement race

Scan:

```text
old.json
identity A
size X
mtime T
```

Prima unlink:

```text
old.json
identity B
```

Target:

```text
skip
reason=changed_before_removal o equivalente strutturato
zero unlink
```

---

## J. File size/mtime change

Stessa path.

Target:

```text
skip
```

secondo il contratto approvato IMPL-011.

---

## K. Max files per cache

```text
Betfair 3
Sofa 3
--max-files 2
```

Atteso corrente:

```text
1 Betfair candidate
1 Sofa candidate
```

---

## L. Max total bytes per cache

```text
Betfair > X
Sofa > X
--max-total-bytes X
```

Atteso:

```text
ogni cache viene ridotta verso X indipendentemente
```

Non budget globale.

---

## M. Partial apply

```text
A unlink OK
B unlink ERROR
C unlink OK
```

Atteso corrente:

```text
exit 1
removed=[A,C]
errors=[B]
recoveredBytes=A+C
```

Documentazione:

```text
partial destructive outcome
```

---

## N. All unlink fail

Atteso:

```text
removed=[]
errors>0
exit 1
```

Distinguere dal caso M.

---

## O. Blocked vs failed

Blocked:

```text
zero unlink
exit 3
```

Failure durante apply:

```text
può avere unlink precedenti
exit 1
```

Questa distinzione deve essere esplicita nel runbook.

---

## P. Symlink

Preservare:

```text
symlink
→ skip
```

Su Windows, eseguire quando l’ambiente consente la fixture.

---

## Q. Cache root symlink

Target:

```text
skip entire cache root
zero recursion
```

---

## R. Non-JSON

```text
note.txt
directory
special file
```

Atteso:

```text
skip
```

---

## S. Security filename

Cache Betfair con URL sintetica.

Verificare prima di SECURITY-002:

```text
report path
→ può riflettere key URL-derived
```

Dopo SECURITY-002:

```text
nessun frammento URL semanticamente utile
```

---

## T. Dump retention

Finché CLEANUP-003 non è implementata:

```text
betfair_network_dump
→ mai incluso nella cache utility
```

Preservare.

---

## U. Log retention

Finché CLEANUP-003 non è implementata:

```text
betfair_scraper.log
→ nessuna cancellazione automatica
```

---

## V. Backup durante writer activity

Simulare logicamente:

```text
copy history
→ canonical commit completa timeline
→ copy timeline
```

Il risultato non deve essere qualificato automaticamente:

```text
coherent snapshot
```

---

## W. Backup quiescente

Dopo futura snapshot authority:

```text
writes blocked
→ set copiato
→ integrity verificata
→ release
```

Target:

```text
backup identificabile e coerente
```

---

## X. Evidence

Verificare che nessuna task aggiunga:

```text
backend/evidence/
```

all’allow-list se non esiste uno store reale.

---

## Y. Journal

```text
.pending_commits
```

deve rimanere sempre fuori dalla utility.

---

## Z. Writer authority

```text
.writer_authority
```

deve rimanere sempre fuori dalla utility e fuori dai backup usati per trasferire ownership.

---

# Riferimenti per la futura mappa/ledger

```text
Report ID: TDUI-DOC-REPORT-036
Percorso report: Report documentale/36 - 05-retention-and-cleanup.md
Documento: docs/tennis-decision-ui/operations/05-retention-and-cleanup.md

Nuovi Change ID:
RETENTION-001
RETENTION-002
RETENTION-003

Finding esistenti richiamati:
CLEANUP-002
CLEANUP-003
SECURITY-002
IMPL-011
TEST-018
VALID-ROLL-001

Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

---

# Decisione finale

```text
05-retention-and-cleanup.md:

DOCUMENTO SOSTANZIALMENTE CORRETTO
NELLA CLASSIFICAZIONE DEGLI ARTEFATTI
E NELLA FILOSOFIA DI SICUREZZA.

NON RISCRIVERE.

CORREGGERE IN MODO MIRATO.

Punti forti:
- allow-list realmente rigida
- dry-run realmente default
- no directory arbitraria
- no recursion
- symlink esclusi
- solo JSON regolari
- journal escluso
- writer authority esclusa
- Source Identity esclusa
- Evidence correttamente derivata
- TTL separati dalla retention disco
- dump/log separati dalle cache
- real apply correttamente non dichiarato validato
- backup esclude credenziali e profile browser

Problema operativo principale:
il documento lascia ancora intendere che
una futura autorizzazione manuale offline
possa bastare per il primo apply.

La governance approvata dice invece:

CLEANUP-002
→ IMPL-011
→ TEST-018
→ solo dopo considerare validabile un apply reale.

Nuovi gap:
RETENTION-001
→ max-files/max-total-bytes sono per-cache

RETENTION-002
→ exit 1 può avere già prodotto removals

RETENTION-003
→ backup multi-file coerente richiesto ma snapshot boundary assente

Dipendenze non nuove:
CLEANUP-003
→ retention separata dump/log

SECURITY-002
→ filename cache URL-derived

IMPL-011
→ maintenance authority e metadata identity

Riscrittura completa: no
Modularizzazione: no
Nuovi file: no
Priorità: alta
```

La regola operativa che deve emergere senza ambiguità è:

```text
DRY-RUN
→ oggi utilizzabile

APPLY REALE
→ non considerare pronto
→ non eseguire come validazione definitiva
→ prima chiudere IMPL-011 / TEST-018
```

e, quando l’apply verrà introdotto davvero:

```text
exit 0
→ esecuzione senza errori

exit 3
→ blocked prima delle rimozioni

exit 1
→ errore
→ POTREBBERO ESSERCI GIÀ RIMOZIONI
→ leggere sempre removed/errors/recoveredBytes
```

---

# Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 36
Da analizzare: 36
Avanzamento: 50,00%

Blocco corrente 033–037:
[✓] 033 operations/02-live-tracking-control.md
[✓] 034 operations/03-betfair-diagnostics.md
[✓] 035 operations/04-validation-and-rollback.md
[✓] 036 operations/05-retention-and-cleanup.md
[ ] 037 reference/01-repository-map.md
```

Il prossimo documento canonico è:

```text
docs/tennis-decision-ui/reference/01-repository-map.md
```

Dopo il report 037 dovrà essere eseguito il checkpoint cumulativo previsto per il blocco 033–037.

---

# Stato di applicazione

```text
RETENTION-001 → completata
RETENTION-002 → completata
RETENTION-003 → aperta: snapshot boundary project-owned non ancora definita
```

Il runbook dichiara ora che `max-files` e `max-total-bytes` sono applicati per cache e che un exit code `1` può accompagnare rimozioni già concluse, imponendo la lettura di `removed`, `errors` e `recoveredBytes`. La coerenza multi-file del backup resta qualificata come requisito non ancora implementato. Nessuna modifica al codice è stata eseguita durante questa applicazione documentale.
