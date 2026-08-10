# Report documentale — `docs/validations/betfair-live-validation-2026-07-04.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-040
Sequenza audit: 40/72
Documento analizzato: betfair-live-validation-2026-07-04.md
Percorso documento: docs/validations/betfair-live-validation-2026-07-04.md
Percorso report: Report documentale/40 - betfair-live-validation-2026-07-04.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: 1ded7f42998e9719570286dbb743fc003598db3d
Dimensione documento: 138 righe
Tipo: osservazione live manuale storica
Data dichiarata: 4 luglio 2026
SHA della sessione storica: non registrato
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
fonte storica originale:
docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx

snapshot storico:
repomix-task2-documentazione.md

docs/validations/README.md

docs/tennis-decision-ui/modules/betfair/01-scraper-lifecycle.md
docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md
docs/tennis-decision-ui/operations/03-betfair-diagnostics.md
docs/tennis-decision-ui/roadmap/01-current-state.md

report 027 — Graph URL
report 034 — Betfair diagnostics
report 035 — validation and rollback
report 038 — current state
report 039 — validations README
```

Sono stati inoltre richiamati i finding già aperti:

```text
BETFAIR-DIAG-002
BETFAIR-DIAG-003
BETFAIR-DIAG-008
GRAPH-URL-*
VALID-ROLL-001
VALID-ROLL-004
VALID-ROLL-006
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003
CURRENT-STATE-003
```

GitHub non è stato modificato.

La mappa cumulativa e il JSON dell’audit non vengono aggiornati con questo report.

Il checkpoint corrente resta:

```text
038–042
```

e verrà consolidato soltanto dopo il report 042.

---

# Esito sintetico

```text
Fedeltà come report storico:                ALTA
Trasparenza dei limiti:                     ALTA
Separazione observed vs not executed:       BUONA
Generalizzazione oltre la sessione:         CONTENUTA
Privacy dei dati live:                      BUONA
Coerenza con fonte originale:               MEDIO-ALTA
Provenance della migrazione:                ERRATA
Completezza della migrazione:               PARZIALE
Completezza tabella Interpretazione:        PARZIALE
Coerenza con owner correnti:                BUONA come storico, non come PASS corrente
Modularizzazione:                           NON necessaria

Nuovi finding:                              3
Nuove task tecniche runtime:                0
Finding esistenti richiamati:               numerosi, non duplicati
Riscrittura completa:                       NO
Revisione mirata:                           SÌ
Nuovi documenti canonici proposti:          nessuno
Priorità complessiva:                       MEDIO-ALTA
```

La conclusione centrale è:

```text
QUESTO REPORT STORICO È SOSTANZIALMENTE VALIDO.

NON VA RISCRITTO
PER FARLO COINCIDERE CON IL CODICE DI OGGI.

VA CORRETTA SOLTANTO:
- la provenance della migrazione;
- la fedeltà rispetto alla fonte originale;
- la completezza della classificazione finale.
```

L’audit documentale precedente aveva già classificato:

```text
Validazione live Betfair
→ report storico valido con limiti espliciti
→ conservato nelle validations
```

Questa classificazione resta corretta.

---

# 1. Il documento dichiara correttamente di non essere una specifica futura

## Esito: confermato

Il documento dice:

```text
Non è una specifica del comportamento futuro.
```

Questa frase è fondamentale.

La sessione del 4 luglio dimostra soltanto ciò che venne osservato in quelle sessioni.

Non dimostra automaticamente:

```text
comportamento corrente
invariante futura
PASS automatico
funzionamento su altro match
funzionamento su altra working tree
```

La separazione è coerente con:

```text
docs/validations/README.md
```

e va preservata.

---

# 2. L’assenza dello SHA storico è trattata correttamente

## Esito: confermato

La testata dice:

```text
SHA
→ Non registrato nel documento sorgente
```

Questo è il comportamento corretto.

Non bisogna cercare di ricostruire retroattivamente lo SHA usando:

```text
date dei commit
date della chat
file timestamp
commit successivi
```

perché nessuno di questi dimostrerebbe quale working tree fosse realmente in esecuzione durante la sessione.

## Decisione

Preservare:

```text
non registrato
```

finché non esiste una prova primaria.

Questo è coerente con:

```text
VALID-INDEX-002
VALID-ROLL-001
```

---

# 3. Sessione A — Graph URL disponibili: osservazioni storiche coerenti

La sessione registra:

```text
Sofa Connected
Source Identity recording/canonical/aligned
Betfair health green
graphHealth ok
2 Graph URL tentate e riuscite
ladderSource graph_url
selectionId stabile
seq 29 → 30 → 31
matchedVolume positivo
grafico visibile
```

La fonte originale registrava la stessa classe di osservazioni.

Non risultano trasformazioni che invertano il significato della sessione.

## Aspetto positivo della migrazione

La fonte originale diceva:

```text
grafico Volume abbinato nel tempo
visibile e coerente
```

La versione migrata dice soltanto:

```text
visibile
```

Questa riduzione è prudente.

Non perde un fatto fondamentale e evita di trasformare:

```text
coerente
```

in una valutazione tecnica più forte di quanto l’artifact possa dimostrare oggi.

## Privacy

Sono esclusi:

```text
nomi giocatori
URL Graph completi
```

Corretto.

---

# 4. Sessione B — assenza Graph URL: il limite è descritto bene

La sessione registra:

```text
tracking ancora attivo
graphHealth unavailable
reason no_graph_urls_provided
Betfair yellow / STALE
ladderSource book_depth
matchedVolume possibile
nessuno stop inatteso
nessuna regressione seq osservata
```

Questa sessione ha un valore importante:

```text
assenza Graph URL
≠
stop automatico del tracking
```

ma soltanto nella sessione osservata.

Il documento non generalizza questa osservazione come contratto universale.

Corretto.

---

# 5. Il tick Money Flow anomalo è descritto come osservazione, non come algoritmo futuro

La sessione registra:

```text
market_delta_raw_computed_mismatch
matchedVolume 0
validForDisplay false
invalidVolume true
anomaly true
```

e:

```text
point soppresso
senza fermare il tracking
```

Questa è una descrizione storica concreta.

L’implementazione corrente possiede test per casi raw/computed mismatch, ma ciò non trasforma retroattivamente la sessione live in un test automatico.

## Decisione

Preservare la separazione:

```text
osservazione live del 4 luglio
≠
test corrente della funzione
```

---

# 6. Sessione C — logout e recovery: il documento è prudente su un punto essenziale

La sessione registra:

```text
logout Betfair
→ tick status-only
→ graphHealth auth_suspected
→ health red / ALERT
→ popup e audio
→ login ripristinato
→ ritorno a Connected
```

Subito dopo specifica:

```text
non è stato archiviato
un payload /latest post-fix

non risultava
un test automatico PASS dedicato
al tick status-only
```

Questa limitazione è fondamentale.

## Owner corrente

La documentazione tecnica corrente continua a conservare la stessa distinzione:

```text
logout Graph
→ live observed

payload /latest post-fix
→ non archiviato

test automatico dedicato status-only
→ non presente nell’evidenza storica
```

Quindi la validation non sta inventando una prova che non esiste.

---

# 7. Il ritorno a Connected storico non chiude `BETFAIR-DIAG-002`

## Esito: NON è una contraddizione

Il report 034 ha aperto:

```text
BETFAIR-DIAG-002
→ auth recovery hysteresis / clear authority
```

perché il codice corrente usa memoria degli ultimi tick e un singolo sample sano non garantisce necessariamente il clear immediato dell’alert.

Il fatto storico:

```text
Sessione C
→ login ripristinato
→ ritorno a Connected osservato
```

non contraddice quel finding.

Può essere vero che:

```text
in quella sessione
→ dopo sufficienti tick/tempo
→ Connected è tornato
```

senza che sia definito il contratto generale di clear.

## Regola

Non modificare l’artifact storico per adeguarlo a `BETFAIR-DIAG-002`.

Nel documento owner corrente deve restare aperta la semantica generale.

Nel report storico deve restare:

```text
ritorno a Connected osservato
```

come evento di quella sessione.

---

# 8. Il mercato realmente finished è correttamente classificato non eseguito

La validation dice:

```text
mercato Betfair realmente concluso
→ non verificato
```

e nella tabella:

```text
Mercato finished reale
→ non eseguito
```

Questo è particolarmente importante alla luce dei finding correnti:

```text
BETFAIR-SCRAPER-006
SOFA-LIVE-007
BETFAIR-DIAG-003
```

sull’authority di:

```text
hasFinished
```

## Decisione

Non aggiornare retroattivamente la validation con:

```text
finished testato
```

solo perché oggi esistono test o logiche implementate.

La sessione live reale resta:

```text
non eseguita
```

per quel caso.

---

# 9. URL Graph malformate e mismatch `marketId` sono correttamente dichiarati non verificati nei Limiti

Il documento elenca:

```text
Graph URL malformate
mismatch marketId
```

tra i casi non verificati.

Questo è coerente con i finding Graph URL successivi:

```text
GRAPH-URL-001
GRAPH-URL-002
GRAPH-URL-004
GRAPH-URL-005
```

che richiedono confini e test più forti.

La validation storica non deve essere “aggiornata” con i test futuri.

---

# 10. Errore API/rete reale è correttamente non verificato

Anche:

```text
errore API o rete reale
```

resta non osservato.

Questo impedisce di usare:

```text
Sessione B senza Graph URL
```

come prova di:

```text
network failure handling
```

Sono scenari diversi.

Corretto.

---

# 11. Il riuso dello stesso `eventId` fra A e B è un limite importante e correttamente dichiarato

Il documento dice:

```text
A e B
→ stesso eventId

seq
timeline
scala grafico
→ non completamente isolate
```

Questa è una limitazione metodologica reale.

È ancora più significativa alla luce dei finding successivi su:

```text
tracking session authority
restart isolation
current session vs persisted data
generation guard
```

## Importante

Non bisogna reinterpretare retroattivamente:

```text
A/B
→ due sessioni isolate
```

perché il documento stesso dice il contrario.

## Decisione

Preservare integralmente questo limite.

---

# 12. Il caso SofaScore buffering è correttamente degradato da prova a semplice osservazione riferita

Il documento dice:

```text
SofaScore 404 durante buffering
→ riferito come risolto
→ nessun artifact allegato
→ non evidenza archiviata
```

Questa è esattamente la distinzione che:

```text
VALID-INDEX-001
CURRENT-STATE-003
```

vogliono rendere sistematica.

## Decisione

Non trasformarlo in:

```text
live_observed
```

nella tabella.

---

# 13. Il problema più evidente della testata è `Sorgente migrata`

## Esito: NUOVO FINDING

La testata corrente dice:

```text
Sorgente migrata
→ docs/validations/betfair-live-validation-2026-07-04.md
```

Questo è il path del documento corrente stesso.

Quindi:

```text
source
→ destination
```

è rappresentato come:

```text
destination
→ destination
```

e non fornisce alcuna provenance.

## Fonte storica reale individuata

Lo snapshot documentale precedente contiene:

```text
docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx
```

con titolo:

```text
Validazione live Betfair — Task 2
```

e stato:

```text
Completata con rilievi documentati — 2026-07-04
```

Il corpo contiene esattamente le sessioni:

```text
A Graph URL
B no Graph URL
C logout/recovery
```

che sono state poi migrate nel file corrente.

L’audit B5 aveva inoltre classificato:

```text
operations/07-betfair-live-validation.mdx
→ report storico
→ da conservare come validation
```

## Conclusione

La provenance corretta deve riferirsi alla fonte storica originale, non al file destinazione.

---

# 14. `BETFAIR-VAL-001` — correggere la provenance della migrazione

**Priorità:** high  
**Tipo:** historical source provenance

## Problema

Attuale:

```text
Sorgente migrata:
docs/validations/betfair-live-validation-2026-07-04.md
```

è self-reference.

## Fonte documentata

```text
docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx
```

## Azione

Correggere il metadata con una formula equivalente a:

```text
Sorgente storica migrata:
docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx
```

Se si vuole registrare anche il passaggio intermedio:

```text
destinazione corrente:
docs/validations/betfair-live-validation-2026-07-04.md
```

come campo distinto.

## Non fare

Non inventare:

```text
SHA della sessione live
commit di creazione originale
ambiente
```

se non registrati.

## Verification

```text
source path
→ esiste nello snapshot storico
→ contiene la validation Task 2
→ destination corrente ne deriva realmente
```

---

# 15. La migrazione non ha preservato tutte le osservazioni della fonte

## Esito: NUOVO FINDING

Il file corrente è più breve e più sintetico dell’originale.

La sintesi non è di per sé un errore.

Il problema nasce quando viene rimossa una **osservazione storica positiva unica**.

## Caso principale

La fonte originale contiene:

```text
La verifica seguente è osservata:

/json = 200
→ Sofa: Connected
```

Il file migrato corrente non contiene questa osservazione.

Contiene soltanto il caso successivo:

```text
SofaScore 404 durante Source Identity buffering
→ riferito come risolto
→ non evidenza archiviata
```

Quindi la migrazione ha perso una distinzione storica:

```text
/json = 200 → Sofa Connected
→ osservato

buffering 404 → Sofa In attesa
→ riferito ma non archiviato
```

Nel documento corrente resta soltanto il secondo caso.

## Altre semplificazioni

La fonte originale registra anche:

```text
Graph URL:
2 tentate
2 riuscite
0 fallite
```

mentre la migrazione riduce a:

```text
2 fornite, tentate e riuscite
```

Questo non cambia sostanzialmente il risultato.

La fonte originale registra:

```text
Betfair yellow / STALE
→ non red
→ non technical error
```

mentre la migrazione conserva soltanto:

```text
yellow / STALE
```

È una perdita di dettaglio, ma non necessariamente materiale.

La fonte originale registra:

```text
tick status-only persistito
```

mentre la migrazione usa:

```text
tick status-only
```

Questa riduzione è invece prudente, dato che non è archiviato il payload post-fix.

## Criterio

La migrazione storica può:

```text
rimuovere duplicazioni
normalizzare layout
ridurre wording troppo forte
redigere dati sensibili
```

ma non dovrebbe rimuovere silenziosamente:

```text
una osservazione unica
```

senza registrare la scelta.

---

# 16. `BETFAIR-VAL-002` — verificare e preservare la fedeltà storica della migrazione

**Priorità:** high  
**Tipo:** historical migration fidelity

## Azione

Confrontare:

```text
operations/07-betfair-live-validation.mdx
vs
docs/validations/betfair-live-validation-2026-07-04.md
```

e classificare ogni differenza:

```text
layout-only
privacy redaction
safe wording reduction
duplicate removal
material evidence omission
```

## Caso da ripristinare o annotare

```text
/json = 200
→ Sofa: Connected
→ osservato
```

deve essere:

```text
A.
ripristinato come osservazione storica
```

oppure:

```text
B.
esplicitamente registrato come omesso
con motivazione documentata
```

se esiste una ragione valida.

## Non fare

Non ripristinare automaticamente ogni parola dell’MDX.

Esempio:

```text
“grafico coerente”
```

può restare ridotto a:

```text
“grafico visibile”
```

perché è una normalizzazione prudente.

## Criterio di chiusura

Nessuna osservazione unica del documento sorgente viene persa senza classificazione.

---

# 17. La tabella finale non riporta `mismatch marketId`

## Esito: NUOVO FINDING

Nei Limiti è scritto:

```text
Non sono stati verificati:
- login già scaduto
- Graph URL malformate
- mismatch marketId
- errore API/rete
- mercato realmente concluso
```

La tabella `Interpretazione` contiene:

```text
Login già scaduto
Graph URL malformate
Errore rete/API reale
Mercato finished reale
```

ma manca:

```text
Mismatch marketId
```

## Effetto

Il body corretto dice:

```text
non eseguito
```

ma il riepilogo strutturato finale non lo mostra.

Un consumer che leggesse soltanto la tabella potrebbe concludere che il caso:

```text
marketId mismatch
```

non appartiene al perimetro dichiarato o non sia uno scenario aperto.

## Relazione con Graph URL audit

Il caso è oggi ancora importante.

I report Graph URL hanno evidenziato che:

```text
missing/invalid upstream identity
≠
true mismatch
```

e richiedono test fail-closed.

La validation storica deve quindi conservare chiaramente:

```text
marketId mismatch
→ non eseguito live
```

---

# 18. `BETFAIR-VAL-003` — completare la tabella Interpretazione

**Priorità:** medium  
**Tipo:** historical scenario summary completeness

## Azione

Aggiungere:

```text
| Mismatch `marketId` | non eseguito |
```

nella tabella finale.

## Regola generale

Ogni scenario esplicitamente elencato sotto:

```text
Non sono stati verificati
```

deve essere rappresentato anche nella sintesi finale se la tabella pretende di riassumere il perimetro.

## Non fare

Non trasformare:

```text
not executed
```

in:

```text
failed
blocked
passed
```

---

# 19. Sessione C: direct UI evidence vs internal state va coordinata con `VALID-INDEX-001/002`

## Esito: finding esistente, NON nuovo

Il blocco:

```text
tick status-only
graphHealth auth_suspected
health red
popup/audio
Connected
```

mescola due piani:

### Osservabile direttamente in UI

```text
red / ALERT
popup
audio
Connected
```

### Stato tecnico interno

```text
status-only
graphHealth auth_suspected
```

Il documento dichiara correttamente:

```text
payload /latest non archiviato
```

Quindi oggi non abbiamo un artifact persistito che consenta di ri-ispezionare il payload di quella sessione.

## Decisione

Non creare:

```text
BETFAIR-VAL-004
```

perché questa distinzione è già coperta dalla governance introdotta in:

```text
VALID-INDEX-001
VALID-INDEX-002
BETFAIR-DIAG-008
```

Durante la futura revisione dell’artifact:

```text
UI directly observed
vs
technical state reported during run
```

può essere reso esplicito senza cambiare il risultato storico.

---

# 20. Non trasformare `status-only` storico in prova del contratto corrente

Anche se l’owner corrente descrive:

```text
tick status-only
```

la prova live storica resta limitata.

Il fatto che:

```text
codice corrente
test corrente
owner corrente
```

possano supportare oggi lo stesso concetto non cambia il livello probatorio dell’artifact del 4 luglio.

## Regola

```text
historical validation
→ prova della run storica

current tests
→ prova della working tree testata

owner doc
→ contratto corrente dichiarato
```

I tre piani non devono essere fusi.

---

# 21. La validation non deve essere aggiornata con il nuovo finished authority bug

## Esito: importante

Il report 034 ha aperto:

```text
BETFAIR-DIAG-003
→ hasFinished authority
```

La validation del 4 luglio dice già:

```text
mercato realmente finished
→ non eseguito
```

Questo è sufficiente.

Non bisogna aggiungere dentro l’artifact storico una spiegazione del bug scoperto ad agosto come se fosse parte della sessione del 4 luglio.

## Dove va il problema corrente

```text
owner Betfair
runbook diagnostics
Current State
registri audit
```

non:

```text
historical result body
```

---

# 22. La validation non deve essere aggiornata con l’auth hysteresis corrente

Stessa regola.

Il ritorno a Connected:

```text
live_observed
```

resta.

Il fatto che il contratto generale di recovery sia oggi aperto:

```text
BETFAIR-DIAG-002
```

resta nell’owner corrente.

Non aggiungere al report storico:

```text
“oggi il clear potrebbe richiedere 3 tick”
```

perché non faceva parte dell’osservazione storica.

---

# 23. La validation non dimostra isolamento sessione

Il documento stesso dice:

```text
A/B same eventId
→ seq/timeline/chart scale non isolate
```

Quindi non può essere usato per chiudere:

```text
tracking session authority
generation isolation
restart isolation
cross-session contamination
```

Owner correnti:

```text
SOFA-LIVE-001
LIVE-CTRL-001
LIVE-CTRL-006
IMPL-006
```

## Decisione

Nessun nuovo finding.

La limitazione è già correttamente scritta nell’artifact.

---

# 24. La validation non dimostra source identity pending reale

Non è il suo scopo.

La Sessione A registra:

```text
recording / canonical / aligned
```

Questo non dimostra:

```text
pending reale
manual confirmation
decline
bootstrap failure
```

Questi scenari appartengono alla validation Source Identity che verrà auditata nel report 042.

Non ampliare il perimetro Betfair.

---

# 25. La privacy/redaction storica è buona

Il documento non conserva:

```text
nomi giocatori
URL Graph completi
cookie
token
header Authorization
payload completi
```

Questo è corretto.

Non emergono segreti nel testo corrente.

## Coordinamento futuro

`VALID-INDEX-002` può rendere la policy generale più esplicita.

Non serve una task Betfair specifica.

---

# 26. La sezione owner correnti introduce una tensione con l’immutabilità storica

## Esito: nota, non nuovo finding

Il documento termina con:

```text
Documenti owner correnti
```

che punta alla documentazione attuale.

Dal punto di vista della navigazione è utile.

Dal punto di vista dell’evidenza immutabile crea una tensione:

```text
historical artifact
→ dovrebbe restare stabile

current owner links
→ possono cambiare nel tempo
```

Questo problema va risolto a livello della policy:

```text
VALID-INDEX-003
```

non creando una task specifica Betfair.

Possibili modelli futuri:

```text
A.
artifact storico contiene solo source-at-time references

B.
sezione current navigation dichiarata non-evidentiary

C.
indice validations possiede i current-owner links
```

La scelta non va anticipata in questo report.

---

# 27. La sorgente migrata è storicamente recuperabile

Questo è importante.

Non siamo davanti a un caso in cui la fonte originale è perduta.

La fonte originale è presente nello snapshot storico dell’audit e mostra:

```text
path
titolo
stato
sessioni
limiti
collegamenti
```

Quindi `BETFAIR-VAL-001/002` possono essere corretti senza inventare nulla.

---

# 28. Aspetti della fonte originale che NON devono essere automaticamente ripristinati

Il confronto storico non significa:

```text
copy/paste integrale del vecchio MDX
```

Non vanno ripristinati automaticamente:

```text
metadata JS export const meta
link .mdx obsoleti
titolo Task 2 se la nuova tassonomia lo ha reso storico
terminologia troppo forte
duplicazioni
nomi/URL sensibili
```

Il target è:

```text
preservare evidenza
non preservare accidentalmente la vecchia architettura documentale
```

---

# 29. Aspetti della fonte originale che devono essere preservati semanticamente

```text
data 2026-07-04
manual live validation
sessione A
sessione B
sessione C
Graph URL sì/no
seq osservate
Money Flow
status-only observation
red/alert
recovery Connected
console observations
same-eventId limitation
not-executed scenarios
/json=200 → Sofa Connected observation
buffering case only reported / no artifact
```

I path owner e il layout possono invece essere aggiornati o separati dalla parte evidentiary.

---

# 30. Finding esistenti da NON duplicare

## `VALID-INDEX-001`

Possiede:

```text
historical evidence taxonomy
```

Applicabile a:

```text
live_observed
not_executed
historically_reported
```

---

## `VALID-INDEX-002`

Possiede:

```text
metadata conformance
missing / not archived semantics
```

Applicabile qui a:

```text
ambiente
azioni
artifact
SHA
```

---

## `VALID-INDEX-003`

Possiede:

```text
run identity
immutable historical artifact lifecycle
```

---

## `BETFAIR-DIAG-002`

Possiede:

```text
auth recovery / clear authority corrente
```

---

## `BETFAIR-DIAG-003`

Possiede:

```text
finished authority corrente
```

---

## `BETFAIR-DIAG-008`

Possiede:

```text
verification/provenance matrix Betfair
```

---

## `GRAPH-URL-*`

Possiedono:

```text
malformed
market identity
duplicate selection
live validation matrix
```

---

## `VALID-ROLL-001`

Possiede:

```text
exact working-tree provenance per nuove run
```

---

# 31. Nuovi finding

## `BETFAIR-VAL-001`

```text
Migration source provenance self-reference
```

**Priorità:** high

Correggere:

```text
Sorgente migrata
```

dal path destinazione al path storico reale:

```text
docs/tennis-decision-ui/operations/07-betfair-live-validation.mdx
```

senza inventare SHA/ambiente.

---

## `BETFAIR-VAL-002`

```text
Historical migration fidelity
```

**Priorità:** high

Confrontare source vs migrated artifact e non perdere osservazioni uniche.

Caso concreto:

```text
/json = 200
→ Sofa: Connected
→ osservato
```

presente nella fonte e assente nel file corrente.

---

## `BETFAIR-VAL-003`

```text
Interpretation table completeness
```

**Priorità:** medium

Aggiungere:

```text
Mismatch marketId
→ non eseguito
```

alla tabella finale.

---

# 32. Correzioni documentali consigliate

## Testata

Correggere:

```text
Sorgente migrata
```

e aggiungere, se utile:

```text
Destinazione corrente
```

come campo separato.

---

## Metadata

Applicare `VALID-INDEX-002` senza inventare:

```text
Ambiente:
non registrato

Artefatti disponibili:
payload /latest post-fix non archiviato
altri artifact: non registrato
```

soltanto se la policy finale usa questi campi.

---

## Sessione A/B/C

Non riscrivere i risultati.

Aggiungere soltanto le qualificazioni necessarie.

---

## Evidenza persa

Ripristinare o annotare:

```text
/json = 200
→ Sofa: Connected
→ osservato
```

come fatto storico.

---

## Interpretazione

Aggiungere:

```text
| Mismatch `marketId` | non eseguito |
```

---

## Navigation owner

Coordinare con `VALID-INDEX-003`.

Non è necessario risolverlo ora dentro questo artifact.

---

# 33. Modularizzazione

## Dimensione

```text
138 righe
```

## Responsabilità

Una sola:

```text
registrare una validation live Betfair storica del 4 luglio 2026
```

Le tre sessioni appartengono alla stessa campagna di validazione.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
betfair-session-a.md
betfair-session-b.md
betfair-session-c.md
```

La separazione ridurrebbe il contesto necessario a capire:

```text
same eventId
Graph vs no Graph
logout/recovery
```

---

# 34. Verification matrix proposta per la revisione dell’artifact

## A. Source provenance

```text
Sorgente migrata
→ operations/07-betfair-live-validation.mdx
```

---

## B. SHA

```text
unknown
→ non registrato
```

---

## C. Session A

Preservare:

```text
Graph URLs available
health green
seq 29/30/31
matchedVolume
graph visible
```

---

## D. Session B

Preservare:

```text
no graph URLs
yellow/stale
book_depth
tracking active
mismatch point suppressed
```

---

## E. Session C UI

Preservare:

```text
red/ALERT
popup/audio
return Connected
```

---

## F. Session C payload

Qualificare:

```text
status-only/auth_suspected
→ no archived /latest post-fix
```

---

## G. Same eventId

Deve restare:

```text
not isolated
```

---

## H. Login expired at start

```text
not_executed
```

---

## I. Malformed Graph URL

```text
not_executed
```

---

## J. marketId mismatch

```text
not_executed
```

e presente anche nella tabella.

---

## K. API/network real error

```text
not_executed
```

---

## L. Real finished market

```text
not_executed
```

---

## M. `/json=200 → Sofa Connected`

Confrontare la fonte.

Se non esiste una ragione documentata per l’omissione:

```text
restore as historical observation
```

---

## N. Buffering 404

```text
historically reported
no archived evidence
```

non `live_observed`.

---

## O. Current auth hysteresis

Non inserirla nel body storico.

---

## P. Current finished authority bug

Non inserirlo nel body storico.

---

## Q. Privacy

Nessun ripristino di:

```text
player names
Graph URLs
secrets
```

---

# 35. Ordine consigliato

```text
1. BETFAIR-VAL-001
   → provenance sorgente

2. BETFAIR-VAL-002
   → confronto fidelity source/destination

3. BETFAIR-VAL-003
   → tabella interpretation

4. applicare policy VALID-INDEX-001/002/003

5. non cambiare il significato delle sessioni osservate

6. link checker

7. nessuna nuova run retroattiva

8. eventuali nuove validation future
   → nuovi artifact separati
```

---

# 36. Decisione finale

```text
betfair-live-validation-2026-07-04.md:

REPORT STORICO SOSTANZIALMENTE AFFIDABILE.

L’AUDIT PRECEDENTE CHE LO CLASSIFICAVA
“VALIDO CON LIMITI ESPLICITI”
RESTA CORRETTO.

PUNTI FORTI:
- data reale dichiarata
- SHA mancante dichiarato “non registrato”
- live observation distinta da test automatico
- Graph vs no Graph distinti
- logout/recovery distinto da login scaduto all’avvio
- same-eventId reuse dichiarato
- malformed/mismatch/network/finished dichiarati non verificati
- buffering Sofa non promosso a evidenza archiviata
- dati sensibili non riportati

NUOVI PROBLEMI:
BETFAIR-VAL-001
→ source migration metadata self-referential

BETFAIR-VAL-002
→ migration fidelity incompleta
→ osservazione /json=200 → Sofa Connected persa

BETFAIR-VAL-003
→ mismatch marketId manca dalla tabella Interpretazione

NON MODIFICARE RETROATTIVAMENTE:
- auth recovery per adeguarlo al codice corrente
- finished semantics
- Graph URL logic
- Money Flow algorithm

Quei problemi appartengono agli owner correnti.

Riscrittura completa:
NO

Revisione mirata:
SÌ

Modularizzazione:
NO

Nuovi documenti:
NO

Priorità:
MEDIO-ALTA
```

---

# 37. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-040

Documento:
docs/validations/betfair-live-validation-2026-07-04.md

Nuovi Change ID:
BETFAIR-VAL-001
BETFAIR-VAL-002
BETFAIR-VAL-003

Finding esistenti richiamati:
BETFAIR-DIAG-002
BETFAIR-DIAG-003
BETFAIR-DIAG-008
GRAPH-URL-*
VALID-ROLL-001
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003
CURRENT-STATE-003

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 38. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 40
Da analizzare: 32
Avanzamento: 55,56%

Blocco 038–042:
[✓] 038 roadmap/01-current-state.md
[✓] 039 docs/validations/README.md
[✓] 040 docs/validations/betfair-live-validation-2026-07-04.md
[ ] 041 docs/validations/documentation-migration-finalization-2026-08-03.md
[ ] 042 docs/validations/source-identity-live-verification.md
```

Il prossimo documento canonico è:

```text
docs/validations/documentation-migration-finalization-2026-08-03.md
```

La mappa e il ledger cumulativi non vengono aggiornati prima del report 042.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `BETFAIR-VAL-001…003`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
