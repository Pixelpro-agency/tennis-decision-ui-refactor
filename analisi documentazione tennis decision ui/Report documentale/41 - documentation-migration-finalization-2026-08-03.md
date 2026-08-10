# Report documentale — `docs/validations/documentation-migration-finalization-2026-08-03.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-041
Sequenza audit: 41/72
Documento analizzato: documentation-migration-finalization-2026-08-03.md
Percorso documento: docs/validations/documentation-migration-finalization-2026-08-03.md
Percorso report: Report documentale/41 - documentation-migration-finalization-2026-08-03.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 2c03992d5802b2dfbb7814a9146c9a7a3f37fb89
Dimensione documento: 129 righe
Tipo: record storico di finalizzazione e verifica della migrazione documentale
Data/campagna dichiarata: 3–4 agosto 2026
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
commit finale migrazione:
2697f66ea8e17a9e35481299cb47ec402558df55
docs: finalize canonical documentation migration

commit cleanup archive:
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
docs: remove consolidated legacy archive

commit di riallineamento archive:
d4f7bea0f1ff06bbdd422389499f9c170734aae1
docs: align archive cleanup records

versione del record al commit 2697f66...
versione del record al commit 3de08ca...
versione corrente al commit 4c5f43b...

artefatto di validazione del pacchetto:
tennis-decision-ui-documentation-finalization-validation.md

script di riallineamento documentale:
td-realign-documentation-before-impl015.py

scripts/check_documentation_links.py

registri storici:
TEST-076
TEST-077
TEST-078
TEST-079
IMPL-032

report audit:
035 — validation and rollback
038 — current state
039 — validations README
040 — Betfair historical validation
```

GitHub non è stato modificato.

La mappa cumulativa e il JSON dell’audit non vengono aggiornati con questo report.

Il checkpoint resta:

```text
038–042
```

e verrà consolidato soltanto dopo il report 042.

---

# Esito sintetico

```text
Coerenza storica generale:                  ALTA
Cronologia commit 3–4 agosto:               ALTA
Coerenza dei conteggi principali:           ALTA
Provenance della pubblicazione:             BUONA
Separazione package-copy vs repository:     BUONA
Trasparenza dei limiti del pacchetto:       ALTA
Coerenza cleanup archive storico:           ALTA
Strength della prova di content fidelity:   INSUFFICIENTE per il claim esatto
Riferimenti storici oggi non più esistenti: ACCETTABILI se letti come storici
Conformità metadata validation:              PARZIALE, già coperta da VALID-INDEX-002
Working-tree provenance:                    PARZIALE, già coperta da VALID-ROLL-001
Modularizzazione:                           NON necessaria

Nuovi finding:                              1
Nuove task runtime:                         0
Finding esistenti richiamati:               VALID-ROLL-001,
                                             VALID-INDEX-002,
                                             VALID-INDEX-003,
                                             TEST-076..079,
                                             IMPL-032
Riscrittura completa:                       NO
Revisione mirata:                           SÌ
Nuovi documenti canonici proposti:          nessuno
Priorità complessiva:                       ALTA
```

La conclusione centrale è:

```text
IL RECORD È STORICAMENTE SOLIDO.

NON VA RISCRITTO
COME STATO CORRENTE DEL REPOSITORY.

LA CRONOLOGIA DEI DUE COMMIT PRINCIPALI
È REALE E COERENTE.

IL PROBLEMA NUOVO È UNO SOLO:

un confronto di dimensione 0,998–1,001
può provare assenza di troncamenti sostanziali,
ma non può da solo provare che
“ciascun nuovo file conserva il corpo del sorgente
con sole modifiche metadata/path”.
```

Questa distinzione è importante perché il documento è esso stesso un artifact di validation.

Il suo livello di prova non deve essere più forte della verifica realmente eseguita.

---

# 1. Il commit di finalizzazione dichiarato esiste ed è coerente

Il record corrente dichiara:

```text
2697f66ea8e17a9e35481299cb47ec402558df55
docs: finalize canonical documentation migration
```

La verifica Git conferma:

```text
SHA:
2697f66ea8e17a9e35481299cb47ec402558df55

message:
docs: finalize canonical documentation migration
```

Il commit contiene realmente:

```text
rimozione dei vecchi .mdx
creazione/aggiornamento dei .md
creazione di docs/validations/
rimozione workspace migration
rimozione report temporanei
aggiornamento README e registri
```

Non emerge un errore di identificazione del commit.

---

# 2. Il commit di cleanup archive dichiarato esiste ed è coerente

Il record dichiara:

```text
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
docs: remove consolidated legacy archive
```

La verifica Git conferma:

```text
SHA:
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196

message:
docs: remove consolidated legacy archive
```

Il confronto:

```text
2697f66...
→
3de08ca...
```

mostra:

```text
ahead_by: 1
```

quindi il cleanup è effettivamente il follow-up immediato del commit di migrazione.

Questo rende la cronologia:

```text
migrazione finale
→ cleanup delle fonti archive consolidate
```

corretta.

---

# 3. Le dieci fonti del cleanup sono realmente riconoscibili nel diff

Il commit `3de08ca...` rimuove:

```text
8 file Markdown
+
2 ODT
=
10 fonti
```

fra cui:

```text
brief Source Identity
prompt navigazione/modularizzazione
backlog operativo 4 luglio
pacchetto Task 6
report Task 6
pacchetto launcher/Task 2
Replay e backtesting
Market Reactions Journal
Idee Future.odt
Idee Per Stream API Betfair.odt
```

Questo coincide con la formulazione:

```text
le dieci fonti conservate inizialmente
sotto docs/archive/
```

Il conteggio è quindi supportato.

---

# 4. `docs/archive/README.md` era realmente presente al checkpoint storico

Il record dice, nel follow-up del 4 agosto:

```text
docs/archive/README.md
conserva la mappa fonte → destinazione
```

Sul commit corrente quel file non esiste più.

Questo aveva prodotto correttamente:

```text
CURRENT-STATE-002
```

nel report 038, perché il Current State lo presentava come authority corrente.

Qui però il contesto è diverso.

Il commit `3de08ca...` mostra realmente:

```text
docs/archive/README.md
→ Registro delle fonti consolidate
→ tabella fonte rimossa / contenuto utile conservato in
```

Quindi:

```text
nel follow-up storico del 4 agosto
→ la frase era vera
```

## Decisione

NON aprire:

```text
MIGRATION-VAL-xxx stale archive README
```

Il record storico non va aggiornato per fingere che il file non sia mai esistito.

Al massimo, durante una revisione editoriale, può essere qualificato:

```text
Al checkpoint 3de08ca...
docs/archive/README.md conservava...
```

per impedire una lettura “current state”.

Non è una nuova task.

---

# 5. La successiva rimozione di `docs/archive/README.md` non invalida la validation del 4 agosto

Fra:

```text
3de08ca...
e
4c5f43b...
```

la repository ha subito ulteriori cambiamenti documentali.

Tra questi:

```text
docs/archive/README.md
→ rimosso successivamente
```

e sono stati aggiunti altri materiali non canonici in archive.

Questo non rende falso il record del 4 agosto.

La regola corretta è:

```text
historical validation
→ descrive il checkpoint verificato

current owner/current state
→ descrive la repository attuale
```

Non devono essere sincronizzati retroattivamente.

---

# 6. La frase finale su `IMPL-015` è storica, non una roadmap corrente

Il record termina:

```text
La fase documentale è chiusa.
Il prossimo lavoro tecnico è IMPL-015
— writer authority esclusiva per match_history.
```

Successivamente `IMPL-015` è stata implementata.

Quindi oggi:

```text
IMPL-015
≠ prossimo lavoro
```

ma al checkpoint della migrazione:

```text
IMPL-015
→ era effettivamente il passo tecnico successivo
```

La storia Git successiva contiene i commit legati a quella implementazione.

## Decisione

Non aggiornare il record storico in:

```text
“il prossimo lavoro è X corrente”
```

Sarebbe una riscrittura della storia.

Se serve chiarezza:

```text
Al checkpoint del 4 agosto,
il passo tecnico successivo era IMPL-015.
```

Nessuna nuova task.

---

# 7. Il pacchetto finale conferma il passaggio `40 .mdx → 0 .mdx`

L’artefatto:

```text
tennis-decision-ui-documentation-finalization-validation.md
```

registra:

```text
file .mdx iniziali: 40
file .mdx finali:   0
```

e:

```text
MDX residui: 0
```

Il record corrente dichiara:

```text
40 file .mdx rimossi dalla documentazione canonica
```

Questa parte è coerente.

---

# 8. La scomposizione `28 + 8 + 2 + 2 = 40` è internamente coerente

Il record corrente dice:

```text
28 owner residui convertiti strutturalmente in .md
8 owner già riscritti mantenuti
2 collaudi storici mantenuti in docs/validations/
2 specifiche future spostate fuori dall’indice e poi consolidate
```

Somma:

```text
28 + 8 + 2 + 2 = 40
```

Il pacchetto di validazione registra:

```text
28 owner convertiti strutturalmente
12 destinazioni già preparate e mantenute
36 documenti canonici .md finali
```

La relazione è compatibile con:

```text
28 converted
+
8 canonical owner already prepared
=
36 canonical .md

restanti 4
=
2 validation storiche
+
2 future/noncanonical
```

Quindi non emerge un errore aritmetico del record.

---

# 9. Il termine “8 owner già riscritti” è più preciso del generico “12 destinazioni già preparate”

Il pacchetto parla di:

```text
12 destinazioni già preparate e mantenute
```

Il record finale separa:

```text
8 owner
2 validations
2 future specs
```

Questa è una riclassificazione più informativa.

Non va considerata una contraddizione.

---

# 10. Il pacchetto di validazione aveva una propria identità verificabile

L’artefatto esterno registra:

```text
tennis-decision-ui-documentation-finalization.zip

SHA-256:
29b17bb14335bf127a3a3c8df3440037c6e426a6c850863b41445ec1fc89fc95

payload:
57 file

aggiunti:
37

modificati:
20

eliminati inventariati:
61
```

Questa è provenance utile.

Il record canonico finale non conserva il nome e l’hash del pacchetto.

## Decisione

Non aprire un nuovo finding specifico.

Questo rientra nella governance già aperta:

```text
VALID-INDEX-002
→ metadata/artifact conformance
```

Quando quella policy verrà applicata, il record potrebbe aggiungere:

```text
artifact package
artifact SHA-256
```

senza cambiare l’esito storico.

---

# 11. La differenza “4 validation oltre README” richiede riconciliazione, ma non una nuova owner task

Il pacchetto di validazione registra:

```text
validazioni finali:
4 file oltre al README
```

Il commit di migrazione visibile nel repository rende chiaramente identificabili:

```text
source-identity-live-verification.md
betfair-live-validation-2026-07-04.md
documentation-migration-finalization-2026-08-03.md
```

come artifact correnti della nuova struttura.

L’eventuale quarto artifact del pacchetto non è identificato dal record corrente.

## Stato

```text
provenance incompleta
```

non:

```text
contraddizione dimostrata
```

perché il pacchetto può avere incluso un artifact di validation/consegna non destinato alla tree finale.

## Ownership

Questo è un caso concreto di:

```text
VALID-INDEX-002
```

che deve rendere espliciti:

```text
artifact disponibile
artifact non archiviato
artifact di delivery
artifact canonico validation
```

Non creo:

```text
MIGRATION-VAL-002
```

solo per questo conteggio.

---

# 12. I conteggi dei checker del pacchetto e del follow-up non sono direttamente confrontabili senza scope

Il pacchetto registra:

```text
Documentation links:
60 file
376 link
0 errori
0 warning

Registry:
239 owner
214 Todo rows
```

Il follow-up registra:

```text
Markdown residui:
56

Link strict:
56 file
365 link
0 errori
0 warning

Registry:
240 owner
214 righe
```

A prima vista:

```text
60 → 56
376 → 365
239 → 240
```

potrebbe sembrare una discrepanza.

Non lo è necessariamente.

---

# 13. Il passaggio `60 file → 56 file` è coerente con lo scope del link checker

Il checker:

```text
scripts/check_documentation_links.py
```

esclude per default i percorsi che contengono:

```text
legacy
```

quando:

```text
include_legacy = false
```

Fra i file Markdown rimossi dal cleanup:

```text
4
```

erano sotto:

```text
docs/archive/planning/legacy/
```

e quindi non partecipavano già al conteggio standard del checker.

Gli altri quattro Markdown rimossi erano invece in percorsi normalmente scansionati.

Quindi:

```text
60
-
4 file counted
=
56
```

è coerente.

## Decisione

Nessun finding sui conteggi `60 → 56`.

---

# 14. `376 → 365` link è compatibile con la rimozione di documenti counted

La rimozione di quattro file Markdown precedentemente inclusi nello scan può naturalmente ridurre anche:

```text
numero totale di link
```

Il risultato:

```text
56 file
365 link
0 errors
0 warnings
```

non contraddice:

```text
60 file
376 link
0 errors
0 warnings
```

del pacchetto precedente.

Non serve una task.

---

# 15. `239 owner → 240 owner` non è automaticamente una regressione

Il registry checker del pacchetto registra:

```text
239 owner
214 Todo rows
```

Il follow-up registra:

```text
240 owner
214 Todo rows
```

Fra i due checkpoint sono avvenute modifiche ai registri e al materiale consolidato.

Un incremento di un owner ID non è, da solo:

```text
duplicazione
errore
regressione
```

Il dato importante è:

```text
0 errori
0 warning
```

in entrambe le verifiche.

## Decisione

Nessun finding basato sul solo incremento numerico.

---

# 16. La cronologia del `full-offline` è documentata in modo credibile

Alla versione iniziale del record, sul commit:

```text
2697f66...
```

era scritto:

```text
full-offline
→ era già verde prima della chiusura
→ deve essere rieseguito dopo l’applicazione
```

Quindi il primo documento NON dichiarava:

```text
post-migration full-offline verified
```

senza averlo eseguito.

Questa prudenza va riconosciuta.

---

# 17. Anche al commit `3de08ca...` la rerun era ancora dichiarata necessaria

La versione del record sul commit cleanup continua a dire:

```text
deve essere rieseguito
dopo l'applicazione del pacchetto finale
```

Quindi nemmeno il cleanup ha trasformato automaticamente:

```text
pre-migration green
```

in:

```text
post-migration PASS.
```

Corretto.

---

# 18. Il blocco di verifica reale viene aggiunto in un passaggio successivo

Lo script:

```text
td-realign-documentation-before-impl015.py
```

parte da:

```text
EXPECTED_HEAD =
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
```

e verifica:

```text
HEAD esatto
target files esistenti
nessuna modifica staged sui tre target
nessuna modifica unstaged sui tre target
```

Poi modifica tre file:

```text
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
docs/validations/documentation-migration-finalization-2026-08-03.md
```

e infine esegue realmente:

```text
check_documentation_links.py --forbid-mdx-links
check_registry_consistency.py
validation/run.mjs full-offline
git diff --check
```

## Conseguenza

Il blocco:

```text
STRICT_LINKS=0
REGISTRY=0
FULL_OFFLINE=0
```

non è stato semplicemente inventato come testo.

Esiste uno script che esegue quei controlli dopo la modifica documentale.

Questo rafforza la provenance.

---

# 19. Ma `HEAD=3de08ca` non identifica la working tree esatta verificata

Questo è un punto metodologico importante.

Lo script:

```text
parte da HEAD 3de08ca
→ modifica tre file
→ esegue i checker
```

Quindi durante i checker:

```text
HEAD resta 3de08ca
```

ma:

```text
working tree
≠ contenuto del commit 3de08ca
```

Il record dice correttamente:

```text
working tree reale
```

e non:

```text
commit 3de08ca verificato integralmente dopo le modifiche
```

Tuttavia, la provenance futura deve continuare a distinguere:

```text
HEAD SHA
vs
dirty working tree content
```

## Ownership

Questo è esattamente:

```text
VALID-ROLL-001
```

già aperto.

Non creo una nuova task.

---

# 20. `LOCAL=REMOTE=3de08ca` è una prova distinta dal PASS dei checker

Il blocco finale contiene:

```text
LOCAL=3de08ca...
REMOTE=3de08ca...
PUSH_CLEANUP_VERIFICATO=1

LINKS=0
REGISTRY=0
FULL_OFFLINE=0
DIFF_CHECK=0
```

Questi dati non devono essere letti come un singolo atomo.

Sono due famiglie diverse:

```text
A.
repository ref / publish state

B.
working-tree validation state
```

e, come visto, lo script di riallineamento modifica i documenti prima di lanciare i checker.

## Decisione

Coordinare la futura normalizzazione con:

```text
VALID-ROLL-001
VALID-INDEX-002
```

senza duplicare ownership.

---

# 21. Il record separa correttamente il pacchetto documentale dal repository applicativo completo

Il documento dice:

```text
l'archivio usato per costruire il pacchetto finale
conteneva documentazione, registri e script

ma non:
backend
frontend
launcher
scraper
```

L’artefatto del pacchetto conferma lo stesso limite.

Questo è un punto forte.

Impedisce di interpretare:

```text
checker green sulla copia finale
```

come:

```text
intero prodotto applicativo verificato.
```

---

# 22. La rerun `full-offline` sulla repository reale chiude soltanto quel gate, non ogni tipo di validazione

Anche dopo:

```text
FULL_OFFLINE=0
```

non deriva automaticamente:

```text
validazione live
browser reale
scraper reali
rete esterna
backend permanente
```

Questa distinzione è già governata da:

```text
VALID-ROLL-002
VALID-ROLL-003
VALID-ROLL-004
```

e non va duplicata qui.

Il record non afferma il contrario.

---

# 23. Il problema principale: il confronto dimensionale viene presentato come prova semantica troppo forte

Il record corrente dice:

```text
Il confronto dimensionale dei 28 owner convertiti
ha confermato che ciascun nuovo file conserva
il corpo del sorgente,
con variazioni limitate alla rimozione del blocco metadata
e all'aggiornamento dei percorsi.
```

Questa frase contiene un claim forte:

```text
exact/near-exact body preservation
+
classification of all differences
```

Il source artifact del pacchetto registra invece una verifica più limitata.

---

# 24. Cosa dice realmente l’artefatto primario

Il validation artifact dice:

```text
I 28 owner convertiti
hanno rapporto dimensionale
fra 0,998 e 1,001
rispetto al corpo MDX originario
dopo rimozione dei metadata,
confermando l'assenza
di troncamenti sostanziali.
```

Questo supporta:

```text
dimensione molto simile
→ nessun troncamento macroscopico rilevato
```

Non supporta da solo:

```text
ogni frase preservata
ogni paragrafo preservato
ogni tabella preservata
nessuna modifica semantica
tutte le differenze limitate a metadata/path
```

Due testi possono avere la stessa dimensione e contenuti diversi.

---

# 25. La differenza fra “nessun troncamento sostanziale” e “corpo preservato” è materiale

Esempio astratto:

```text
source:
1000 byte

destination:
1000 byte
```

non implica:

```text
source == destination
```

nemmeno dopo aver tolto metadata.

Può esistere:

```text
sostituzione di un paragrafo
rimozione + aggiunta equivalente
cambio di wording semantico
perdita di una riga + nuova riga di pari dimensione
```

senza cambiare significativamente la lunghezza.

Quindi il current wording aumenta il livello di prova rispetto all’evidenza disponibile.

---

# 26. TEST-077 non equivale automaticamente a content identity

`TEST-077` è descritto come:

```text
mapping univoco .mdx → .md
nessun duplicato canonico
```

e verifica che:

```text
ogni sostituzione abbia un solo mapping
il nuovo owner sia identificato
la sovrapposizione temporanea
non diventi doppia fonte canonica
```

Non è definito come:

```text
byte-for-byte body equality test.
```

Quindi non è corretto usare implicitamente `TEST-077` per colmare il gap.

---

# 27. TEST-078 verifica i link, non la preservazione completa del testo

`TEST-078` riguarda:

```text
link relativi validi
riferimenti a path rimossi
target/anchor
```

Non prova:

```text
content identity.
```

---

# 28. TEST-079 verifica la classificazione semantica generale, non ogni riga migrata

`TEST-079` governa:

```text
corrente
deprecato
storico
futuro
```

e impedisce promozioni errate.

È importante.

Ma non è una prova:

```text
source body
=
destination body
al netto delle sole trasformazioni ammesse.
```

---

# 29. IMPL-032 richiede preservazione del contenuto, ma il record deve citare la prova concreta

`IMPL-032` definisce una pipeline verificabile:

```text
inventario
manifest
owner matrix
batch
file completi
verifica contenuti e link
sostituzione
eliminazione .mdx
```

e include come criterio:

```text
nessuna informazione unica persa
```

Questa è la policy corretta.

Il punto del report 041 è diverso:

```text
quale evidenza concreta
dimostra che il criterio sia stato soddisfatto
per i 28 file?
```

Il solo rapporto dimensionale non basta.

---

# 30. `MIGRATION-VAL-001` — allineare il claim alla strength reale dell’evidenza

**Priorità:** high  
**Tipo:** migration fidelity evidence strength

## Problema

Il record trasforma:

```text
dimension ratio 0,998–1,001
→ nessun troncamento sostanziale
```

in:

```text
corpo del sorgente conservato
→ sole differenze metadata/path
```

senza mostrare nel record una verifica normalizzata source→destination che supporti questo secondo claim.

## Correzione minima

Sostituire la frase corrente con una formula equivalente a:

```text
Il confronto dimensionale dei 28 owner convertiti
ha rilevato rapporti fra 0,998 e 1,001
rispetto ai corpi MDX dopo rimozione dei metadata,
senza indicazioni di troncamenti sostanziali.
```

Questa frase è direttamente supportata dall’artefatto primario.

## Se si vuole mantenere il claim forte

Serve una verifica più forte.

Per ciascun mapping:

```text
source .mdx storico
→ rimuovere metadata JS previsti
→ normalizzare soltanto trasformazioni approvate
→ classificare update dei link/path
→ confrontare il testo rimanente
→ nessuna differenza non classificata
```

Output minimo:

```text
source
destination
source commit/blob
destination commit/blob
approved transforms
unclassified diffs
result
```

## Possibile criterio

```text
unclassified diffs = 0
```

per poter dichiarare:

```text
body preserved except approved transformations.
```

## Coordinamento

Non creare un secondo sistema di migrazione.

Riutilizzare:

```text
IMPL-032
TEST-076
TEST-077
TEST-078
TEST-079
```

e aggiungere soltanto, se necessario, una verifica di fidelity/content normalization coerente con quella pipeline.

## Criterio di chiusura

Una delle due condizioni:

```text
A.
claim documentale ridotto
al livello realmente provato

oppure

B.
claim forte mantenuto
con diff normalizzato per-file verificabile.
```

---

# 31. Questo finding è documentale/probatorio, non un bug runtime

`MIGRATION-VAL-001` non richiede modifiche in:

```text
backend
frontend
launcher
scrapers
```

Non riguarda:

```text
funzionalità tennis
storage runtime
Source Identity
Betfair
tracking
```

Riguarda soltanto:

```text
quanto forte può essere la conclusione
di una historical validation artifact.
```

---

# 32. Il finding non riapre la migrazione `.mdx → .md`

È importante non interpretare:

```text
MIGRATION-VAL-001
```

come:

```text
la migrazione è fallita
```

Le evidenze supportano ancora:

```text
40 .mdx → 0
mapping eseguito
link strict green
registry green
owner count coerente
no substantial truncation detected
package round-trip green
```

Il finding dice soltanto:

```text
non dichiarare più
di ciò che la verifica dimostra.
```

---

# 33. Non è necessaria una nuova migrazione dei 40 file

Nessuna evidenza emersa richiede:

```text
ripristinare .mdx
rifare Batch 0
ricreare docs/migration/
ripristinare archive legacy
```

Se si sceglie la soluzione A:

```text
correzione wording
```

è sufficiente.

Se si sceglie la soluzione B:

```text
verifica read-only source→destination da Git history
```

senza cambiare i documenti correnti salvo eventuali discrepanze reali.

---

# 34. L’artefatto package-level andrebbe collegato meglio, ma è già coperto da `VALID-INDEX-002`

Il source validation esterno contiene informazioni preziose:

```text
ZIP name
SHA-256
payload counts
round-trip installer
dimension ratio
package-copy limits
```

Il record corrente non linka questo artifact.

## Esito

Non nuovo finding.

`VALID-INDEX-002` deve stabilire per ogni validation:

```text
artefatti disponibili
non archiviati
non registrati
```

Durante quella revisione:

```text
tennis-decision-ui-documentation-finalization-validation.md
```

può essere registrato come source artifact storico, se viene mantenuto/accessibile.

---

# 35. L’identità della campagna 3–4 agosto è chiara anche se il filename contiene solo il 3 agosto

Il filename:

```text
documentation-migration-finalization-2026-08-03.md
```

e il titolo:

```text
Chiusura ... — 3 agosto 2026
```

contengono poi:

```text
Follow-up — 4 agosto
Verifica pubblicazione — 4 agosto
```

Non è necessariamente un errore.

È una singola campagna di finalizzazione con follow-up immediato.

## Ownership

Questo rientra in:

```text
VALID-INDEX-003
```

che deve definire quando:

```text
follow-up same campaign
→ stesso artifact

new independent run
→ nuovo artifact.
```

Non serve una task specifica.

---

# 36. La modifica append-only del record è coerente con la campagna

La storia del file mostra:

```text
fase 1:
record pre-gate

fase 2:
cleanup archive aggiunto

fase 3:
post-application verification
+ remote publication
```

Questo è un uso ragionevole di un unico campaign artifact.

Non è una riscrittura retroattiva del risultato in senso scorretto, perché le sezioni successive sono datate e documentano eventi successivi della stessa chiusura.

---

# 37. Tuttavia, la policy futura deve distinguere append di campagna e rerun indipendente

Come già stabilito in:

```text
VALID-INDEX-003
```

non bisogna usare questo caso come precedente per:

```text
continuare ad aggiungere validation future
nel file 2026-08-03
```

La campagna è chiusa.

Una nuova migrazione documentale indipendente richiede:

```text
nuovo artifact.
```

---

# 38. Il record non deve incorporare lo stato corrente di `docs/archive/`

Il cleanup del 4 agosto è storia.

Materiali aggiunti successivamente in:

```text
docs/archive/
```

non devono essere retro-inseriti in questo record.

Il commit `d4f7bea...` aveva già chiarito nei registri che:

```text
materiali aggiunti successivamente
non appartengono a quel cleanup.
```

Questa separazione è corretta.

---

# 39. Il record non deve incorporare lo stato corrente di IMPL-015

Stessa regola.

Il file non va aggiornato con:

```text
IMPL-015 completed
```

perché ciò appartiene:

```text
registri correnti
Current State
artifact IMPL-015
```

non alla chiusura documentale del 3–4 agosto.

---

# 40. Aspetti corretti da preservare

```text
1. La migrazione è dichiarata documentale, non applicativa.
2. Gli owner tecnici restano fuori da questo artifact.
3. 40 .mdx rimossi è supportato.
4. 28 owner convertiti è supportato.
5. 8 owner già preparati è coerente con i 36 owner .md finali.
6. 2 historical validations sono separate dagli owner.
7. 2 future specs non vengono presentate come implementate.
8. export const meta eliminato dagli owner canonici.
9. workspace migration rimosso.
10. report temporanei di consegna rimossi.
11. archive sources inizialmente mantenute sono descritte.
12. cleanup successivo delle 10 fonti è supportato dal commit.
13. source→destination README esisteva realmente al checkpoint.
14. link strict green è supportato.
15. registry green è supportato.
16. 29 checker tests sono supportati dal package artifact.
17. 19 validation runner tests sono supportati dal package artifact.
18. MDX residui 0 è supportato.
19. package source incompleto rispetto al runtime è dichiarato.
20. full-offline inizialmente richiesto e poi registrato come eseguito.
21. migration commit SHA è corretto.
22. cleanup commit SHA è corretto.
23. il cleanup è il commit immediatamente successivo alla finalizzazione.
24. il record non finge che la validation storica sia owner tecnico.
25. IMPL-015 è presentata come passo successivo al checkpoint, non come parte della migrazione.
```

---

# 41. Aspetti da non reinterpretare

Non trasformare:

```text
0 errori link
→ documentazione semanticamente perfetta
```

Non trasformare:

```text
registry 0 errors
→ ogni owner tecnicamente corretto
```

Non trasformare:

```text
FULL_OFFLINE=0
→ live validated
```

Non trasformare:

```text
dimension ratio ~1
→ exact content identity
```

Non trasformare:

```text
LOCAL=REMOTE
→ dirty working tree uguale a remote commit
```

Non trasformare:

```text
archive README esisteva
→ esiste ancora oggi
```

---

# 42. Finding esistenti da NON duplicare

## `VALID-ROLL-001`

Possiede:

```text
HEAD SHA
≠
exact working-tree identity
```

Applicabile al passaggio:

```text
HEAD 3de08
→ tre file modificati
→ checker eseguiti
```

---

## `VALID-INDEX-002`

Possiede:

```text
metadata conformance
artifact availability
missing/not archived semantics
```

Applicabile a:

```text
package ZIP
package validation report
environment
exact commands
working-tree provenance
```

---

## `VALID-INDEX-003`

Possiede:

```text
run identity
campaign/follow-up lifecycle
immutabilità storica
```

Applicabile alla campagna:

```text
3 agosto
+ follow-up 4 agosto.
```

---

## `TEST-076`

Possiede:

```text
inventario univoco
dei documenti canonici
```

---

## `TEST-077`

Possiede:

```text
mapping univoco MDX→MD
e no doppio owner canonico
```

---

## `TEST-078`

Possiede:

```text
link relativi
dei file migrati
```

---

## `TEST-079`

Possiede:

```text
corrente/deprecato/storico/futuro
```

---

## `IMPL-032`

Possiede:

```text
pipeline generale
di migrazione documentale
```

`MIGRATION-VAL-001` non la sostituisce.

Riguarda esclusivamente:

```text
strength della prova dichiarata
nel record di chiusura.
```

---

# 43. Nuovo finding

## `MIGRATION-VAL-001`

**Titolo:** Allineare il claim di content preservation alla prova realmente eseguita  
**Priorità:** high  
**Tipo:** `migration_fidelity_evidence_strength`

### Problema

Current record:

```text
confronto dimensionale
→ ciascun file conserva il corpo del sorgente
→ differenze solo metadata/path
```

Primary package artifact:

```text
dimension ratio 0,998–1,001
→ assenza di troncamenti sostanziali
```

La seconda evidenza non basta a provare la prima conclusione.

### Azione minima

Ridurre il wording al claim supportato.

### Azione forte opzionale

Se serve provare exact normalized preservation:

```text
normalized source-to-destination diff
per ogni mapping
```

con trasformazioni consentite esplicite.

### Dipendenze

```text
IMPL-032
TEST-076
TEST-077
TEST-078
TEST-079
VALID-INDEX-002
```

### Criterio di chiusura

```text
claim strength
≤
evidence strength
```

per ogni frase di conclusione della validation.

---

# 44. Nessun nuovo finding sul path archive

Motivo:

```text
storicamente corretto
al commit 3de08.
```

`CURRENT-STATE-002` resta il finding per i documenti che lo presentano come authority corrente.

---

# 45. Nessun nuovo finding su IMPL-015

Motivo:

```text
storicamente corretto come “prossimo passo”.
```

La sua successiva implementazione non altera il record precedente.

---

# 46. Nessun nuovo finding su `FULL_OFFLINE=0`

Motivo:

```text
esiste un passaggio documentale specifico
che modifica il record
e poi esegue realmente
il full-offline.
```

I limiti di exact provenance sono già `VALID-ROLL-001`.

---

# 47. Nessun nuovo finding sui conteggi 60→56

Motivo:

```text
scope checker verificato
+
legacy escluso di default
+
4 file counted effettivamente rimossi
=
differenza coerente.
```

---

# 48. Nessun nuovo finding su 239→240 owner

Motivo:

```text
registri modificati fra i checkpoint
+
entrambi i checker terminano con 0 error/0 warning.
```

Il numero da solo non dimostra un bug.

---

# 49. Nessun nuovo finding sulle 4 validation del pacchetto

Motivo:

```text
inventory/provenance ambiguity
```

ma non è identificato con certezza quale fosse il quarto artifact.

La governance dei metadata/artifact è già:

```text
VALID-INDEX-002.
```

Prima di aprire una nuova task servirebbe una prova che il conteggio sia sbagliato, non soltanto incompleto nel record.

---

# 50. Revisione documentale consigliata

## A. Frase content-preservation

Sostituire il claim forte con:

```text
Il confronto dimensionale dei 28 owner convertiti
ha rilevato rapporti 0,998–1,001
rispetto ai corpi MDX dopo rimozione dei metadata,
senza evidenze di troncamenti sostanziali.
```

---

## B. Package artifact

Quando si applica `VALID-INDEX-002`, aggiungere:

```text
Artifact package validation:
tennis-decision-ui-documentation-finalization-validation.md

Package:
tennis-decision-ui-documentation-finalization.zip

SHA-256:
29b17bb14335bf127a3a3c8df3440037c6e426a6c850863b41445ec1fc89fc95
```

solo se questi artifact restano effettivamente disponibili.

---

## C. Historical archive wording

Opzionale:

```text
Al checkpoint del cleanup 3de08ca,
docs/archive/README.md conservava...
```

Non necessario per correggere una falsità storica.

Serve soltanto per evitare letture current-state.

---

## D. IMPL-015 wording

Opzionale:

```text
Al checkpoint del 4 agosto,
il passo tecnico successivo era IMPL-015.
```

Non cambiare il significato.

---

## E. Working-tree provenance

Applicare il futuro contratto:

```text
VALID-ROLL-001
```

senza alterare retroattivamente dati non registrati.

---

# 51. Verification matrix proposta

## A. Commit migration

```text
2697f66...
→ exists
→ expected message
```

---

## B. Commit cleanup

```text
3de08ca...
→ exists
→ expected message
```

---

## C. Commit adjacency

```text
2697f66
→ one commit
→ 3de08ca
```

---

## D. 40 MDX

```text
package:
40 → 0
```

---

## E. 28 converted

```text
package:
28
```

---

## F. 8 prepared owners

```text
28 + 8 = 36 canonical .md owner
```

---

## G. 2 validations

Verificare mapping storico:

```text
operations/06
→ Source Identity validation

operations/07
→ Betfair validation
```

---

## H. 2 future specs

Verificare:

```text
replay/backtesting
Market Reactions Journal
```

non presentati come implementati.

---

## I. 10 cleanup sources

```text
8 Markdown
+
2 ODT
=
10
```

---

## J. Archive README at checkpoint

```text
exists at 3de08ca
```

---

## K. Archive README current

Non usarlo per invalidare il punto J.

---

## L. Link checker scope

Confermare:

```text
legacy excluded by default
```

---

## M. Package link count

```text
60 files
376 links
0/0
```

---

## N. Follow-up count

```text
56 files
365 links
0/0
```

---

## O. Registry package

```text
239 owner
214 rows
0/0
```

---

## P. Registry follow-up

```text
240 owner
214 rows
0/0
```

---

## Q. Package tests

```text
Python 29
validation runner 19
```

---

## R. MDX residue

```text
0
```

---

## S. Metadata residue

```text
export const meta
→ 0 negli owner canonici
```

---

## T. Package source boundary

```text
backend/frontend/launcher/scrapers
→ not included in package source
```

---

## U. Real repo rerun

```text
full-offline
→ exit 0
```

---

## V. Working tree

Non inferire:

```text
HEAD
=
validated content
```

quando esistono modifiche locali.

---

## W. Content fidelity

Se si mantiene il claim forte:

```text
normalized diff per file
→ zero unclassified differences
```

---

## X. Dimension-only fallback

Se non esiste normalized diff:

```text
claim
→ no substantial truncation detected
```

---

## Y. Package validation count

Se viene normalizzato il metadata:

```text
identificare i 4 artifact
oppure scrivere “non registrato”
```

senza inferire.

---

# 52. Modularizzazione

## Dimensione

```text
129 righe
```

## Responsabilità

Il documento racconta una singola campagna:

```text
preparazione/finalizzazione
→ cleanup immediato
→ gate working tree
→ verifica pubblicazione
```

Il follow-up del 4 agosto appartiene direttamente alla stessa chiusura.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

Non creare:

```text
migration-package-validation.md
archive-cleanup-validation.md
remote-publish-validation.md
```

come nuovi owner canonici soltanto per dividere il documento.

Gli artifact tecnici esterni possono essere linkati come evidence, non trasformati in una seconda gerarchia documentale.

---

# 53. Ordine consigliato

```text
1. MIGRATION-VAL-001
   → correggere strength del claim

2. VALID-INDEX-002
   → normalizzare artifact/provenance metadata

3. VALID-ROLL-001
   → exact working-tree identity per future run

4. VALID-INDEX-003
   → campaign/rerun lifecycle

5. preservare i due commit storici
   senza aggiornarli a “current”

6. non ricreare docs/archive/README.md
   per questo artifact

7. non riscrivere IMPL-015
   come stato corrente

8. checker documentali

9. nessuna modifica runtime
```

---

# 54. Decisione finale

```text
documentation-migration-finalization-2026-08-03.md:

REPORT STORICO SOLIDO.

CRONOLOGIA:
CONFERMATA.

COMMIT:
2697f66... → corretto
3de08ca... → corretto

CLEANUP:
10 fonti → supportato dal diff.

COUNTS:
40 MDX → 0 → supportato.
28 converted → supportato.
8 owner già preparati → coerente.
2 historical validations → coerente.
2 future specs → coerente.

CHECKER:
conteggi 60→56 coerenti con exclude legacy.

FULL-OFFLINE:
prima richiesto,
poi realmente eseguito e registrato.

ARCHIVE README:
oggi assente,
ma storicamente presente al checkpoint.
NON è un errore di questo artifact.

IMPL-015:
oggi non è “prossima”,
ma lo era al checkpoint.
NON è un errore storico.

NUOVO PROBLEMA:
MIGRATION-VAL-001 — HIGH

dimension ratio
non equivale a exact content preservation.

Correzione:
ridurre il claim
oppure produrre normalized source→destination diff.

Riscrittura completa:
NO

Revisione mirata:
SÌ

Modularizzazione:
NO

Nuovi file canonici:
nessuno

Priorità:
ALTA
```

La regola probatoria da preservare è:

```text
historical validation
→ può dire soltanto
ciò che la prova conservata supporta.

Dimension similarity
→ no substantial truncation.

Normalized content comparison
→ può supportare
content preservation.

Non scambiare i due livelli.
```

---

# 55. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-041

Documento:
docs/validations/documentation-migration-finalization-2026-08-03.md

Nuovi Change ID:
MIGRATION-VAL-001

Finding esistenti richiamati:
VALID-ROLL-001
VALID-INDEX-002
VALID-INDEX-003
TEST-076
TEST-077
TEST-078
TEST-079
IMPL-032

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 56. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 41
Da analizzare: 31
Avanzamento: 56,94%

Blocco 038–042:
[✓] 038 roadmap/01-current-state.md
[✓] 039 docs/validations/README.md
[✓] 040 docs/validations/betfair-live-validation-2026-07-04.md
[✓] 041 docs/validations/documentation-migration-finalization-2026-08-03.md
[ ] 042 docs/validations/source-identity-live-verification.md
```

Il prossimo documento canonico è:

```text
docs/validations/source-identity-live-verification.md
```

Dopo il report 042:

```text
→ consolidare mappa
→ consolidare JSON ledger
→ aggiornare contatori e blocco 038–042.
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `MIGRATION-VAL-001`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
