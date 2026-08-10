# Report documentale — `implementazioni/06-implementazioni-proposte.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-050
Sequenza audit: 50/72
Documento analizzato: 06-implementazioni-proposte.md
Percorso documento: implementazioni/06-implementazioni-proposte.md
Percorso report: Report documentale/50 - 06-implementazioni-proposte.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 32a0413f2aaba94fa9cd7757175bb23db6191687
Dimensione documento: 41 righe
Tipo: facade / indice corrente delle schede IMPL-001…032
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
implementazioni-tennis-decision-ui.md
todo-list-tennis-decision-ui.md
implementazioni/README.md
implementazioni/99-decisioni-utente.md

implementazioni/implementazioni-proposte/01-utility-e-autorita-base.md
implementazioni/implementazioni-proposte/02-runtime-betfair.md
implementazioni/implementazioni-proposte/03-storage-recovery.md
implementazioni/implementazioni-proposte/04-evidence-provenance.md
implementazioni/implementazioni-proposte/05-frontend-session-polling.md
implementazioni/implementazioni-proposte/06-validazione-e-fixture.md
implementazioni/implementazioni-proposte/07-documentazione-e-normalizzazione.md

docs/validations/README.md

commit di modularizzazione:
aefc0ba5894d8fca60e5811088fede3ebbfde98a

commit di riallineamento del facade:
8f936d1a3686b775e967e375576f52f19da461a5

commit corrente:
4c5f43b007149f3210c27d7565357a447a3a6ef4
```

Sono stati richiamati, senza duplicarli:

```text
ROOT-REG-001
ROOT-REG-003

METHOD-REG-001
METHOD-SCHEMA-001

DOC-AUDIT-IDX-001

VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003

IMPL-005
```

GitHub non è stato modificato.

La mappa cumulativa e il ledger JSON restano invariati.

Questo è il terzo report del blocco:

```text
048–052
```

Il consolidamento cumulativo avverrà dopo il report 052.

---

# Esito sintetico

```text
Ruolo come facade IMPL:                         CORRETTO
Dimensione del facade:                          OTTIMA
Sette moduli:                                   CONFERMATI
Range IMPL-001…032:                             COMPLETI
Owner card nel facade:                          NESSUNA
Owner uniqueness:                               COERENTE
ID rinumerati:                                  NO
Future IMPL-010 / IMPL-014:                     COERENTI
Approvate non promosse a implementate:          COERENTE
Nessuna task avviata automaticamente:           COERENTE

Lista "Completate":                             INCOMPLETA
IMPL-004 owner:                                 COMPLETATA
IMPL-004 Todo:                                  COMPLETATA
IMPL-004 facade:                                OMESSA
IMPL-004 root summary:                          OMESSA
docs/validations structure:                     PRESENTE
DEC-013:                                        ANCORA APPROVATA

Nuovi finding:                                  1
Nuove task runtime:                             0
Riscrittura completa:                           NO
Revisione mirata:                               SÌ
Modularizzazione:                               NON necessaria
Nuovi documenti canonici proposti:              nessuno
Priorità complessiva:                           ALTA
```

La conclusione centrale è:

```text
LA STRUTTURA MODULARE È CORRETTA.

IL FACADE NON HA PROBLEMI
DI RANGE, OWNERSHIP O NAVIGAZIONE.

ESISTE PERÒ UNA DIVERGENZA
NELLO STATO SINTETICO CORRENTE:

owner IMPL-004
→ IMPLEMENTATA E COMPLETATA TRAMITE DEC-013

Todo
→ COMPLETATA

docs/validations/
→ struttura realmente presente

ma:

06-implementazioni-proposte.md
→ IMPL-004 assente dalla lista "Completate"

implementazioni-tennis-decision-ui.md
→ IMPL-004 assente dalla lista
  "Implementazioni concluse".
```

Quindi oggi esistono:

```text
6 IMPL concluse
```

e non:

```text
5.
```

Il set coerente è:

```text
IMPL-001
IMPL-004
IMPL-005
IMPL-015
IMPL-028
IMPL-032
```

---

# 1. Il facade corrente è realmente leggero

Il file contiene soltanto:

```text
titolo
descrizione ruolo
tabella 7 moduli
stato sintetico
regole minime.
```

Non contiene:

```text
schede owner complete
contratti tecnici duplicati
test
payload
cronologia estesa.
```

Questa è la forma corretta.

---

# 2. Il facade dichiara correttamente di essere un indice corrente

Testo:

```text
Questo file è l’indice corrente
delle schede IMPL-*.

Le schede complete
vivono nei moduli tematici.
```

Questa authority è appropriata:

```text
facade
→ navigazione e sintesi

moduli
→ owner card

Todo
→ stato sintetico globale.
```

---

# 3. I sette moduli esistono

La struttura corrente è:

```text
01-utility-e-autorita-base.md
02-runtime-betfair.md
03-storage-recovery.md
04-evidence-provenance.md
05-frontend-session-polling.md
06-validazione-e-fixture.md
07-documentazione-e-normalizzazione.md
```

Non risulta:

```text
ottavo modulo non indicizzato
modulo duplicato
range IMPL non raggiungibile.
```

---

# 4. I range coprono IMPL-001…032 senza buchi

Mappa corrente:

```text
IMPL-001…015
IMPL-016…018
IMPL-019…021
IMPL-022…024
IMPL-025…027
IMPL-028…031
IMPL-032
```

Unione:

```text
001…032
```

senza:

```text
gap
overlap owner
rinumerazione.
```

---

# 5. I moduli stessi dichiarano lo stesso perimetro

Verificato:

```text
02-runtime-betfair
→ IMPL-016…018

03-storage-recovery
→ IMPL-019…021

04-evidence-provenance
→ IMPL-022…024

05-frontend-session-polling
→ IMPL-025…027

06-validazione-e-fixture
→ IMPL-028…031

07-documentazione-e-normalizzazione
→ IMPL-032 e checkpoint successivi.
```

Quindi la tabella del facade
è sostanzialmente corretta.

---

# 6. `IMPL-032 e checkpoint successivi` nel modulo 07 non crea un nuovo range owner

Il modulo 07 contiene:

```text
IMPL-032
+
checkpoint successivi
```

ma il facade usa:

```text
IMPL-032
```

come intervallo degli owner.

Questa differenza è corretta:

```text
checkpoint
≠
nuova scheda IMPL.
```

Nessun finding.

---

# 7. Il facade non duplica owner card

Non sono presenti heading:

```text
### IMPL-...
```

nel facade.

Quindi:

```text
06-implementazioni-proposte.md
≠
secondo owner.
```

La regola:

```text
ogni scheda owner
vive in un solo modulo
```

è rispettata.

---

# 8. La modularizzazione originaria preservava il monolite

Al commit:

```text
aefc0ba
```

il facade registrava:

```text
sorgente precedente:
4088 righe
83098 byte
blob 1b0260...

sette moduli
→ ricomposizione del contenuto originario.
```

Questa provenance
è storica e disponibile in Git.

---

# 9. Il facade corrente ha correttamente eliminato i dettagli di migrazione

Al commit:

```text
8f936d1
```

il facade è stato semplificato
alla forma corrente.

Sono stati rimossi:

```text
byte
line count
source blob
marker BEGIN/END
istruzioni di ricomposizione.
```

Questo è appropriato
per un indice corrente.

Non serve ripristinare
la telemetria della modularizzazione.

---

# 10. Il problema nasce proprio nell’aggiunta dello stato sintetico corrente

Il facade originario post-modularizzazione
non conteneva:

```text
Completate:
...
```

La versione introdotta a:

```text
8f936d1
```

aggiunge la sintesi:

```text
Completate:

IMPL-001
IMPL-005
IMPL-015
IMPL-028
IMPL-032.
```

È qui che:

```text
IMPL-004
```

viene omessa.

---

# 11. L’omissione non deriva da una declassificazione di IMPL-004

Il modulo owner corrente dice:

```text
### IMPL-004 — Archivio separato dei collaudi storici

Classificazione:
CONSIGLIATA

Stato:
IMPLEMENTATA E COMPLETATA TRAMITE DEC-013
```

Quindi:

```text
owner state
→ completed.
```

---

# 12. L’owner spiega anche perché la task è considerata completata

La separazione corrente è:

```text
docs/validations/
├── README.md
└── report di validazione datati
```

e l’owner dichiara:

```text
la proposta storica
docs/tennis-decision-ui/archive/validations/
→ superata
→ non ricreare.
```

Questo è un contratto chiaro.

---

# 13. DEC-013 è ancora approvata

Decision log corrente:

```text
DEC-013 — Collaudi separati

Stato:
approvata

I collaudi approfonditi
restano separati dai documenti owner
e confluiscono in docs/validations/.
```

Non esiste nel decision log corrente
una supersession esplicita di DEC-013.

---

# 14. La policy archive successiva non supersede DEC-013

La nuova policy su:

```text
docs/archive/
```

riguarda:

```text
materiali storici/futuri non canonici.
```

DEC-013 riguarda invece:

```text
collaudi / validation evidence
→ docs/validations/.
```

I due spazi hanno responsabilità diverse.

Quindi:

```text
ROOT-REG-001
```

non rende IMPL-004 incompleta.

---

# 15. `docs/validations/README.md` conferma che la struttura esiste ancora

Il README corrente dice:

```text
Validazioni storiche

questa cartella conserva
osservazioni manuali,
collaudi e verifiche
eseguite in un ambiente
e in un momento specifici.
```

Inoltre:

```text
non sono documenti owner
del comportamento corrente.
```

Questo è esattamente
il boundary richiesto da IMPL-004.

---

# 16. I finding del report 039 non annullano IMPL-004

Il report 039 ha aperto:

```text
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003
```

su:

```text
taxonomy
metadata
run identity
immutabilità degli artifact.
```

Questi sono hardening
della validation evidence.

Non dimostrano che:

```text
separazione owner / validations
```

sia assente.

Quindi IMPL-004
resta completata
nel proprio scope.

---

# 17. La Todo corrente è esplicita

BLOCCO F:

```text
IMPL-004
— Archivio collaudi storici
— COMPLETATA;
  EVIDENZE CORRENTI IN docs/validations/
```

Non è una formulazione ambigua.

Todo:

```text
completed.
```

---

# 18. Nello stesso BLOCCO F le altre cinque completate coincidono col facade

Todo:

```text
IMPL-001
→ IMPLEMENTATA

IMPL-005
→ IMPLEMENTATA E VERIFICATA

IMPL-015
→ COMPLETATA

IMPL-028
→ IMPLEMENTATA E VALIDATA

IMPL-032
→ COMPLETATA.
```

Il facade include tutte queste.

Manca soltanto:

```text
IMPL-004.
```

---

# 19. Non risultano altre IMPL completate omesse

Il controllo della Todo `IMPL-001…032`
non mostra altre voci
con stato sintetico equivalente a:

```text
IMPLEMENTATA
COMPLETATA
IMPLEMENTATA E VERIFICATA
IMPLEMENTATA E VALIDATA
```

oltre a:

```text
001
004
005
015
028
032.
```

Quindi il finding è circoscritto.

---

# 20. IMPL-010 e IMPL-014 sono correttamente separate

Todo:

```text
IMPL-010
→ FUTURO

IMPL-014
→ FUTURO.
```

Facade:

```text
Future o condizionate:

IMPL-010
IMPL-014.
```

La sintesi non li promuove
a task corrente.

Nessun finding.

---

# 21. IMPL-014 è effettivamente condizionata

Il suo significato storico
è:

```text
ottimizzazione Betfair
→ soltanto dopo baseline
→ misurata
→ reversibile.
```

Quindi il gruppo:

```text
future o condizionate
```

è semanticamente accettabile.

---

# 22. IMPL-006 e IMPL-016…031 non vengono promosse a implementate

Esempi:

```text
IMPL-006
→ APPROVATA; PRIORITÀ CRITICA

IMPL-016
→ CONFERMATA E APPROVATA

IMPL-019
→ CONFERMATA E APPROVATA

IMPL-022
→ STRUTTURA COMPLETAMENTE ASSENTE
  + Decisione approvata

IMPL-025
→ STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA

IMPL-029…031
→ approvate.
```

Il facade non le inserisce
fra le completate.

Questo è corretto.

---

# 23. La regola “approvazione ≠ implementazione” è quindi rispettata

Facade:

```text
una classificazione
o approvazione
non equivale a implementazione.
```

Il suo stato sintetico
rispetta questa regola
per tutte le IMPL controllate,
salvo l’omissione della 004
già effettivamente completata.

---

# 24. `IMPL-028` è correttamente considerata completata

Owner:

```text
IMPLEMENTATA E VALIDATA LOCALMENTE
```

Todo:

```text
IMPLEMENTATA E VALIDATA
```

Facade:

```text
Completate
→ IMPL-028.
```

Nessuna overpromotion.

---

# 25. `IMPL-032` è correttamente considerata completata

Owner:

```text
IMPLEMENTATA E COMPLETATA.
```

Todo:

```text
COMPLETATA.
```

Facade:

```text
Completate
→ IMPL-032.
```

Coerente.

---

# 26. `IMPL-001` può legittimamente stare nella lista completate

Owner:

```text
IMPLEMENTATA E VERIFICATA.
```

Todo:

```text
IMPLEMENTATA.
```

Facade:

```text
Completate
→ IMPL-001.
```

Il livello di dettaglio
della Todo è più sintetico,
ma non contraddittorio.

---

# 27. `IMPL-005` può legittimamente stare nella lista completate

Owner:

```text
IMPLEMENTATA E VERIFICATA.
```

Facade:

```text
Completate.
```

Nessuna discrepanza
sul lifecycle principale.

---

# 28. `IMPL-015` è correttamente conclusa

Root corrente,
Todo e owner
la trattano come:

```text
completata.
```

Non riaprire
la writer authority base
soltanto perché audit storage successivi
hanno trovato nuovi problemi
a livelli event/recovery differenti.

Questa regola resta valida.

---

# 29. L’omissione di IMPL-004 compare anche nel root registry

`implementazioni-tennis-decision-ui.md`
ha:

```text
Implementazioni concluse

IMPL-001
IMPL-005
IMPL-015
IMPL-028
IMPL-032.
```

Manca anch’esso:

```text
IMPL-004.
```

---

# 30. Root e facade sono quindi coerenti fra loro ma entrambi incompleti

Questo è importante:

```text
root = facade
```

non basta a dimostrare:

```text
root/facade = owner/Todo.
```

Il report 043
aveva correttamente osservato
la parità fra le due liste,
ma il confronto più profondo
del report 050 mostra ora
che entrambe hanno copiato
la stessa omissione.

---

# 31. Il registry checker verde non intercetta questa divergenza

Il checker verifica:

```text
owner card
Todo row
duplicati
prefissi
contraddizioni strette
metadata sintetici previsti
```

ma la lista libera:

```text
"Completate:"
```

del facade
non è un owner card
e non è la riga canonica Todo.

Quindi:

```text
checker PASS
```

può coesistere con:

```text
facade summary incompleto.
```

Questo è coerente col finding:

```text
METHOD-REG-001.
```

---

# 32. Non riaprire IMPL-005

Il problema NON è:

```text
IMPL-005 non funziona.
```

Il checker esegue
il contratto machine-checkable
attualmente implementato.

Il problema è:

```text
una sintesi manuale
fuori dal contratto del checker
ha driftato.
```

Non creare un secondo checker
senza decisione.

---

# 33. `IMPL-IDX-001` — riallineare il riepilogo delle implementazioni concluse

**Priorità:** high  
**Tipo:** implementation registry summary divergence

## Problema

Authority dettagliate:

```text
IMPL-004 owner
→ IMPLEMENTATA E COMPLETATA TRAMITE DEC-013

Todo
→ COMPLETATA
```

Evidenza strutturale:

```text
docs/validations/
→ presente
→ separata dagli owner
```

Decisione:

```text
DEC-013
→ approvata
```

Ma sintesi correnti:

```text
06-implementazioni-proposte.md
→ omette IMPL-004

implementazioni-tennis-decision-ui.md
→ omette IMPL-004.
```

---

# 34. Stato corretto minimo dopo il fix

Lista completate del facade:

```text
IMPL-001
IMPL-004
IMPL-005
IMPL-015
IMPL-028
IMPL-032
```

Conteggio:

```text
6.
```

---

# 35. Root registry da riallineare nello stesso task

La stessa task deve aggiornare
il consumer root:

```text
Implementazioni concluse
```

aggiungendo:

```text
IMPL-004
— separazione collaudi storici
  in docs/validations/.
```

Non aprire un secondo:

```text
ROOT-REG-004.
```

La root divergence
è una manifestazione
dello stesso stato sintetico errato.

---

# 36. La Todo non richiede correzione su IMPL-004

Todo corrente:

```text
corretta.
```

Non modificarne lo stato
se non per eventuali
formattazioni collegate.

---

# 37. L’owner IMPL-004 non richiede correzione sul lifecycle

Owner corrente:

```text
corretto.
```

I report 039–042
possono aggiungere hardening
alle validations,
ma non annullano:

```text
IMPL-004 complete.
```

---

# 38. DEC-013 non richiede modifica per questo finding

Decisione:

```text
approvata
```

e ancora coerente
con la struttura corrente.

Nessuna supersession necessaria.

---

# 39. Prevenzione consigliata: ridurre la duplicazione dello stato

Il drift nasce perché
lo stesso lifecycle viene ripetuto in:

```text
owner
Todo
facade IMPL
root.
```

Authority consigliata:

```text
owner
→ dettaglio

Todo
→ stato sintetico globale

facade/root
→ orientamento derivato.
```

---

# 40. Due soluzioni accettabili per facade/root

## Soluzione A — mantenere la lista

Se si vuole mantenere:

```text
Completate:
...
```

deve essere verificata
contro Todo/owner
a ogni aggiornamento sostanziale.

## Soluzione B — ridurre lo stato duplicato

Facade:

```text
Per lo stato corrente
di ogni IMPL vedere la Todo.

Implementazioni concluse principali:
...
```

oppure nessuna lista completa,
se il root/Todo già la forniscono.

La decisione deve preservare
l’utilità di orientamento.

---

# 41. Non introdurre automaticamente una nuova automazione nel checker

È possibile in futuro
rendere machine-checkable
la lista completate,
ma non è necessario
per chiudere il finding.

Se si estende il checker:

```text
coordinare METHOD-REG-001
```

e definire prima
un formato strutturato stabile.

---

# 42. Non usare parsing fragile del testo libero

Da evitare:

```text
regex su qualsiasi frase
"Completate:"
del repository.
```

Se si automatizza,
meglio usare:

```text
marker esplicito
schema stabile
oppure derivazione dalla Todo.
```

---

# 43. La correzione non cambia alcuna implementazione runtime

`IMPL-IDX-001` è:

```text
registry/documentation only.
```

Non deve:

```text
modificare backend
modificare frontend
modificare Python
eseguire una IMPL
cambiare priorità
approvare nuove task.
```

---

# 44. Non modificare gli stati delle IMPL approvate

Il fix non deve trasformare:

```text
IMPL-006
IMPL-016…027
IMPL-029…031
```

in:

```text
implementate.
```

Serve soltanto
aggiungere la 004
già completata.

---

# 45. Non trasformare IMPL-010/014 in task attive

Restano:

```text
FUTURO
```

secondo Todo/owner.

Il finding non cambia
la selezione della prossima task.

---

# 46. Il prossimo passo resta `DA SELEZIONARE`

Correggere il numero
delle implementazioni concluse
non implica:

```text
selezionare automaticamente
IMPL-006
o altra task.
```

La regola del root
resta valida.

---

# 47. Il facade non deve diventare un secondo decision log

Non aggiungere:

```text
DEC-013 completa
DEC-018...
DEC-019...
```

come tabella completa.

Basta eventualmente:

```text
IMPL-004
→ completata via DEC-013
```

in una riga sintetica.

Il decision log
resta owner delle decisioni.

---

# 48. Il facade non deve diventare un secondo validation index

Non aggiungere:

```text
lista dei report docs/validations
artifact
SHA
run.
```

La prova minima per lo stato
rimane nell’owner IMPL-004
e nel validation index.

---

# 49. Non aprire una task su `docs/validations` da questo report

I problemi del validation index
sono già:

```text
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003.
```

Nessun duplicato.

---

# 50. Il nome `Implementazioni proposte` può restare

Anche se alcune IMPL
sono completate,
il registro raccoglie:

```text
proposte storiche
approvate
future
implementate.
```

Rinominare il file
romperebbe percorsi stabili
senza un beneficio dimostrato.

Nessun finding sul titolo.

---

# 51. Il facade non deve essere diviso

Dimensione:

```text
41 righe.
```

Responsabilità:

```text
un solo indice
per IMPL-001…032.
```

Uno split ulteriore sarebbe
controproducente.

---

# 52. Modularizzazione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# 53. Aspetti corretti da preservare integralmente

```text
1. facade di 41 righe;
2. sette moduli;
3. IMPL-001…032 senza gap;
4. owner completi nei moduli;
5. ID globali non rinumerati;
6. nessuna owner card nel facade;
7. utility/base 001…015;
8. Betfair runtime 016…018;
9. storage 019…021;
10. Evidence 022…024;
11. frontend 025…027;
12. validation 028…031;
13. docs 032;
14. approvazione != implementazione;
15. nessuna task automatica;
16. IMPL-010 futuro;
17. IMPL-014 futuro/condizionato;
18. IMPL-001 completata;
19. IMPL-005 completata;
20. IMPL-015 completata;
21. IMPL-028 completata;
22. IMPL-032 completata;
23. registry/link/fast/diff gate;
24. history affidata a Git.
```

---

# 54. Aspetto da correggere

```text
IMPL-IDX-001 — HIGH

→ IMPL-004
  completata in owner
  completata in Todo
  supportata da DEC-013
  supportata da docs/validations/

→ ma omessa da:
  06-implementazioni-proposte.md
  implementazioni-tennis-decision-ui.md
```

---

# 55. Finding esistenti da NON duplicare

## `METHOD-REG-001`

Possiede:

```text
contratto generale
del registry checker.
```

`IMPL-IDX-001` possiede:

```text
specifica divergenza
della summary IMPL.
```

---

## `ROOT-REG-003`

Possiede:

```text
policy vs factual state
e migration semantic fidelity
nel root.
```

Non possiede:

```text
omissione IMPL-004
dalla completed list.
```

Il root viene aggiornato
come consumer di `IMPL-IDX-001`.

---

## `VALID-INDEX-001…003`

Possiedono:

```text
semantica e metadata
delle validation evidence.
```

Non annullano
il completamento strutturale
di IMPL-004.

---

## `ROOT-REG-001`

Possiede:

```text
policy docs/archive.
```

Non riguarda:

```text
docs/validations
come separazione dei collaudi.
```

---

# 56. Nuovo finding

## `IMPL-IDX-001`

**Titolo:** Riconciliare la lista delle IMPL concluse con owner e Todo  
**Priorità:** high  
**Tipo:** implementation registry summary divergence

### Evidenza

```text
Owner IMPL-004:
IMPLEMENTATA E COMPLETATA TRAMITE DEC-013

Todo:
COMPLETATA;
EVIDENZE CORRENTI IN docs/validations/

DEC-013:
approvata

docs/validations:
presente e separata dagli owner

Facade:
IMPL-004 assente da Completate

Root:
IMPL-004 assente da Implementazioni concluse.
```

### Azione

1. aggiungere `IMPL-004`
   alla lista completate del facade;

2. aggiungere `IMPL-004`
   alla lista conclusa del root;

3. lasciare invariato
   lo stato owner/Todo;

4. non modificare DEC-013;

5. non cambiare
   gli stati delle IMPL ancora aperte;

6. valutare,
   insieme a `METHOD-REG-001`,
   se ridurre o automatizzare
   le summary duplicate.

### Criterio di chiusura

Le tre viste:

```text
owner
Todo
facade/root
```

concordano almeno sul set:

```text
001
004
005
015
028
032
```

come implementazioni concluse.

---

# 57. Verification matrix proposta

## A. Facade range

```text
001…032
→ nessun gap.
```

---

## B. Module links

Tutti e sette
devono risolvere.

---

## C. IMPL-001

```text
owner implemented
Todo implemented
facade completed.
```

---

## D. IMPL-004

Dopo fix:

```text
owner completed
Todo completed
facade completed
root completed.
```

---

## E. IMPL-005

Coerenza invariata.

---

## F. IMPL-015

Coerenza invariata.

---

## G. IMPL-028

Coerenza invariata.

---

## H. IMPL-032

Coerenza invariata.

---

## I. IMPL-010

Restare:

```text
FUTURO.
```

---

## J. IMPL-014

Restare:

```text
FUTURO.
```

---

## K. Approved but absent

Campione:

```text
IMPL-022
IMPL-025
```

non deve comparire
fra completate.

---

## L. DEC-013

Restare:

```text
approvata.
```

---

## M. docs/validations

Restare:

```text
validation evidence
≠ owner tecnico.
```

---

## N. Registry checker

Dopo modifica:

```text
0 errori
0 warning.
```

---

## O. Link checker

Eseguire.

---

## P. Fast

Eseguire.

---

## Q. git diff --check

Eseguire.

---

# 58. Ordine consigliato

```text
1. IMPL-IDX-001
   → aggiungere IMPL-004 al facade

2. aggiornare root
   nello stesso task

3. non toccare Todo/owner
   salvo controllo finale

4. non modificare DEC-013

5. non cambiare next step

6. registry checker

7. link checker

8. fast

9. git diff --check
```

---

# 59. Decisione finale

```text
implementazioni/06-implementazioni-proposte.md:

FACADE:
BUONO

MODULARIZZAZIONE:
CORRETTA

SETTE MODULI:
CONFERMATI

RANGE:
IMPL-001…032
→ COMPLETO

OWNER DUPLICATI NEL FACADE:
NESSUNO

FUTURE:
IMPL-010
IMPL-014
→ COERENTI

APPROVATE NON IMPLEMENTATE:
NON PROMOSSE
→ CORRETTO

NUOVO PROBLEMA:

IMPL-IDX-001 — HIGH

IMPL-004:
owner → COMPLETATA
Todo → COMPLETATA
DEC-013 → APPROVATA
docs/validations → PRESENTE

ma:

facade → OMESSA
root → OMESSA

SET CORRETTO DELLE IMPL CONCLUSE:

IMPL-001
IMPL-004
IMPL-005
IMPL-015
IMPL-028
IMPL-032

totale:
6

Nuove task runtime:
0

Riscrittura completa:
NO

Revisione mirata:
SÌ

Modularizzazione:
NO

Nuovi file:
NO

Priorità:
ALTA
```

Regola da preservare:

```text
la Todo e le owner card
restano l’autorità dello stato;

un facade può sintetizzarle,
ma una sintesi manuale
non deve diventare
una seconda verità divergente.
```

---

# 60. Riferimenti per il futuro aggiornamento mappa/ledger

```text
Report ID:
TDUI-DOC-REPORT-050

Documento:
implementazioni/06-implementazioni-proposte.md

Nuovi Change ID:
IMPL-IDX-001

Finding esistenti richiamati:
ROOT-REG-001
ROOT-REG-003
METHOD-REG-001
METHOD-SCHEMA-001
DOC-AUDIT-IDX-001
VALID-INDEX-001
VALID-INDEX-002
VALID-INDEX-003
IMPL-005

Suddivisione richiesta:
no

Nuovi file canonici proposti:
nessuno
```

---

# 61. Stato audit dopo questo report

```text
Documenti canonici totali: 72
Analizzati: 50
Da analizzare: 22
Avanzamento: 69,44%

Blocco 048–052:
[✓] 048 implementazioni/04-task-completate.md
[✓] 049 implementazioni/05-audit-docs-planning.md
[✓] 050 implementazioni/06-implementazioni-proposte.md
[ ] 051 implementazioni/99-decisioni-utente.md
[ ] 052 implementazioni/README.md
```

Nuove task non ancora consolidate:

```text
048
→ 2

049
→ 2

050
→ 1

blocco 048–050
→ 5
```

Contatori provvisori:

```text
task precedenti non duplicate: 181
task continuazione consolidate fino a 047: 139
task nuove 048–050: 5
task complessive note provvisorie: 325
```

Il prossimo documento canonico è:

```text
implementazioni/99-decisioni-utente.md
```

La mappa e il ledger cumulativi restano invariati fino al report 052.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `IMPL-IDX-001`.
- Task ancora aperte: `nessuna`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
