# Report documentale — `implementazioni/audit-codice/01-rilievi-iniziali.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-053
Sequenza audit: 53/72
Documento analizzato: 01-rilievi-iniziali.md
Percorso documento: implementazioni/audit-codice/01-rilievi-iniziali.md
Percorso report: Report documentale/53 - 01-rilievi-iniziali.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: ca9a7aa78c501a8ea07886738c179616116be6cf
Dimensione documento: 1619 righe
Tipo: modulo owner dell’audit codice — rilievi iniziali B3–B6 + secondo audit Punto 1 + chiusura IMPL-015
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
implementazioni/03-audit-codice.md
todo-list-tennis-decision-ui.md
implementazioni/00-metodo-e-stati.md
implementazioni/99-decisioni-utente.md

implementazioni/audit-codice/02-runtime-sessioni-betfair.md
implementazioni/audit-codice/03-storage-recovery.md
implementazioni/audit-codice/06-validazione-e-test.md
implementazioni/audit-codice/07-post-audit-e-migrazione.md
```

Cronologia Git rilevante:

```text
aefc0ba5894d8fca60e5811088fede3ebbfde98a
→ modularizzazione iniziale del monolite

4c5f43b007149f3210c27d7565357a447a3a6ef4
→ HEAD corrente
```

Fra `aefc0ba` e `4c5f43b` il file è stato modificato solo marginalmente:

```text
+2 righe
-5 righe
```

La struttura e il contenuto sostanziale del modulo restano quelli della modularizzazione.

Sono stati richiamati, senza duplicarli:

```text
PLAN-AUDIT-001
PLAN-AUDIT-003
METHOD-EVIDENCE-001
METHOD-LIFECYCLE-001
METHOD-SCHEMA-001

TASK-RECHECK-001
TASK-RECHECK-002

LOCAL-RUNTIME-001…007
PY-RUNTIME-001…010
SOFA-LIVE-001…009
GRAPH-URL-001…007
LOCAL-PBP-001…008
STORAGE-TH-001…009
JOURNAL-REC-001…010
```

GitHub non è stato modificato.

La nuova mappa/JSON di continuazione 048 non viene aggiornata con questo singolo report. Il prossimo consolidamento resta previsto dopo il blocco 053–057, salvo istruzione diversa dell’utente.

---

# Esito sintetico

```text
Valore storico del modulo:                         ALTO
Owner ID principali:                               COERENTI con Todo
RUNTIME-003 / DOC-024 / TEST-004:                  CHIUSURE COERENTI
Limite live due backend reali:                     CORRETTAMENTE ESPLICITO
RUNTIME-002:                                       CORRETTAMENTE ancora aperto
SOFA-001:                                          CORRETTAMENTE da verificare live
Decisioni Strategy/debug/selectionId/SI:           PRESENTI e approvate

Checkpoint B3–B6 vs stato corrente:                AMBIGUITÀ REALE
Sezione 15.1 "Decisioni prima della task":          STALE se letta come current
CODE-004 nella priorità corrente:                  STALE rispetto a "ASSORBITO"
Sintesi Storage/Graph/test iniziali:                STORICHE, poi superseded
Boundary temporale globale del modulo:             INSUFFICIENTE

Responsabilità contenute:                          2 macro-responsabilità distinte
Dimensione:                                        1619 righe
Split per responsabilità:                          SÌ

Nuovi finding:                                     2
Nuove task runtime:                                0
Nuove task documentali:                            2
Riscrittura completa:                              NO
Revisione mirata:                                  SÌ
Modularizzazione:                                  SÌ, raccomandata
Priorità complessiva:                              MEDIO-ALTA
```

La conclusione centrale è:

```text
IL CONTENUTO TECNICO NON VA RISCRITTO
COME SE I CHECKPOINT B3–B6
FOSSERO STATI "SBAGLIATI".

IL PROBLEMA È CHE IL FILE
MESCOLA NELLO STESSO SPAZIO:

1. snapshot storici B3–B6;
2. decisioni successivamente approvate;
3. secondo audit Punto 1;
4. chiusura reale IMPL-015.

ALCUNE SINTESI STORICHE
SONO QUINDI IN CONTRASTO
CON STATI SUCCESSIVI PRESENTI
NELLO STESSO FILE E NELLA TODO.

SERVE:
- boundary temporale esplicito;
- supersession pointer;
- separazione delle due macro-responsabilità.
```

---

# 1. Il modulo è correttamente la Parte 1 di 7

Header corrente:

```text
Parte 1 di 7
— Rilievi iniziali e Punto 1
```

Perimetro dichiarato:

```text
Rilievi iniziali B3–B6
decisioni UI
priorità
secondo audit Punto 1
entry point
launcher
autorità runtime
```

Il facade `03-audit-codice.md`
conferma questa responsabilità.

---

# 2. La navigazione corrente è corretta

Header:

```text
Indice
Parte 2
```

Non è più presente
il doppio link `Indice`
che esisteva nella prima versione modularizzata.

Nessun finding navigation locale.

---

# 3. Il file è temporalmente eterogeneo

Nel medesimo documento convivono almeno:

```text
rilievi iniziali
→ B3

checkpoint
→ B4

checkpoint
→ B5

checkpoint
→ B6

secondo audit Punto 1
→ baseline dda406c4

implementazione IMPL-015
→ commit ac0361e / f86ac26
```

Questi non sono lo stesso momento
del progetto.

---

# 4. Alcune sezioni dichiarano esplicitamente la natura storica

Esempi positivi:

```text
Checkpoint storico del primo audit
```

e:

```text
Passo successivo previsto
al checkpoint B4 (storico)
```

Queste formulazioni riducono
il rischio di interpretare
la checklist come backlog corrente.

---

# 5. Il boundary storico non è però applicato in modo uniforme

Non esiste in testa al file
una regola globale del tipo:

```text
B3–B6
→ snapshot storici immutabili

owner state corrente
→ Todo / schede attuali

Punto 1
→ audit successivo su baseline dichiarata

IMPL-015
→ esito di implementazione successivo
```

Quindi un lettore che apre
direttamente la Parte 1
deve ricostruire da solo
la sequenza temporale.

---

# 6. La Todo possiede invece una nota temporale esplicita

La Todo corrente chiarisce:

```text
Le checklist B1–B6
descrivono il checkpoint
dell’audit documentale.

Gli stati owner correnti
restano nei Blocchi E/F
e nei registri analitici.
```

e per il codice:

```text
Le checklist C1–C13
conservano gli stati osservati
durante l’audit.

Le voci aperte o parziali
non vengono promosse
senza nuova verifica.
```

Il modulo dovrebbe applicare
la stessa chiarezza localmente.

---

# 7. La prima contraddizione interna è CODE-001

All’inizio del modulo:

```text
CODE-001
Stato:
APPROVATO
```

Decisione dell’utente:

```text
rimuovere
le tre card Strategy
e il runtime esclusivo
```

Market Reactions vengono preservate.

---

# 8. La sezione 15.1 torna però a chiedere la stessa decisione

Più avanti:

```text
Decisioni prima della task

CODE-001
→ Strategy resta o viene rimossa?
```

Questa domanda
non è più current.

Storicamente può descrivere
il momento precedente alla decisione.

Ma il file non lo marca
in modo sufficiente in quella sezione.

---

# 9. CODE-003 presenta lo stesso problema

Owner iniziale:

```text
CODE-003
→ rimozione debug-last
→ APPROVATO
```

Sezione 15.1:

```text
CODE-003
→ debug-last va ripristinato o eliminato?
```

La decisione è già stata presa:

```text
eliminato.
```

---

# 10. EVIDENCE-001 presenta lo stesso problema

Il file contiene:

```text
Decisione iniziale collegata a EVIDENCE-001

selectionId obbligatorio
solo nel confronto runner Field → Market

Stato:
APPROVATO
```

e definisce anche
il confine UX/runtime.

---

# 11. Ma 15.1 torna a presentarlo come decisione aperta

```text
EVIDENCE-001
→ selectionId obbligatorio
  o fallback nome degradato?
```

Questa alternativa
è stata successivamente risolta.

La Todo corrente dice:

```text
DEC-010 APPROVATA;
IMPLEMENTAZIONE MANCANTE.
```

Quindi oggi:

```text
decisione
→ chiusa

implementazione
→ aperta.
```

---

# 12. CLEANUP-001 segue lo stesso pattern

Owner:

```text
CLEANUP-001
→ unica authority Source Identity globale
→ APPROVATO
```

Decisione:

```text
useSourceIdentityGateUi
→ unica authority frontend.
```

---

# 13. 15.1 lo ripresenta come domanda

```text
CLEANUP-001
→ authority frontend legacy
  da rimuovere?
```

La Todo corrente è già:

```text
RIMOZIONE APPROVATA;
AUTHORITY GLOBALE UNICA.
```

---

# 14. Il problema non è che la sezione storica vada cancellata

Se la sezione 15.1
descrive realmente il momento B6,
la domanda storica è legittima.

La correzione deve essere:

```text
Al checkpoint B6
queste decisioni erano ancora aperte.

Stato successivo:
CODE-001 → DEC-008 approvata
CODE-003 → DEC-009 approvata
EVIDENCE-001 → DEC-010 approvata
CLEANUP-001 → DEC-011 approvata
```

Non:

```text
cancellare la cronologia.
```

---

# 15. CODE-004 è un altro esempio di stale summary

Owner:

```text
CODE-004
Stato:
ASSORBITO DA CODE-001
```

e dice:

```text
nessuna task autonoma.
```

---

# 16. Ma la priorità 4 include ancora CODE-004

Sezione 15.1:

```text
Priorità 4 — difetti circoscritti

CODE-002
CODE-004
FRONTEND-004
CLEANUP-002
CODE-005
```

Come snapshot storico
può essere mantenuto.

Come priorità current:
non è corretto.

---

# 17. Anche TEST-003 dimostra la stratificazione temporale

Nel checkpoint B6:

```text
Nessun inventario
o comando test canonico
```

e:

```text
TEST-003
→ gap confermato.
```

Oggi la Todo dice:

```text
TEST-003
→ RUNNER IMPLEMENTATO;
  MATRICE COMPLETA ANCORA APERTA.
```

Quindi il testo storico
non va aggiornato
come se il gap non fosse mai esistito.

Va marcato:

```text
checkpoint B6.
```

---

# 18. La chiusura TEST-004 invece è current e ben qualificata

Sezione Punto 1:

```text
TEST-004
→ IMPLEMENTATO E PASSATO
```

con scenario:

```text
backend A writer
backend B bloccato
backend A termina
backend C acquisisce
```

e coperture:

```text
stale lock
unknown fail-closed
import server
recovery failure
shutdown/release
```

Questo è un buon esempio
di update successivo esplicito.

---

# 19. RUNTIME-003 è anch’esso ben qualificato

Stato:

```text
COMPLETATO SU f86ac26
```

Problema storico:

```text
avvii manuali
→ potevano aggirare
  authority launcher/persistence.
```

Poi:

```text
IMPL-015
→ writer authority backend-owned
→ acquire prima di recovery/listen.
```

La Todo corrente conferma:

```text
RUNTIME-003
→ COMPLETATO.
```

Nessuna riapertura.

---

# 20. DOC-024 è coerente

Stato:

```text
COMPLETATO
DAL RIALLINEAMENTO DOCUMENTALE IMPL-015
```

Distinzione:

```text
process ownership
≠
persistence authority.
```

La Todo corrente
lo mantiene completato.

Nessun finding.

---

# 21. L’esito IMPL-015 è dettagliato e verificabile

Il modulo registra:

```text
writer authority: 26 pass
matchTracker: 10 pass
server: 30 pass
falliti: 0
```

e i file modificati.

Queste stesse evidenze
sono coerenti con
il post-audit Parte 7.

---

# 22. Il limite live è correttamente preservato

Il file dice:

```text
collaudo manuale
con due backend reali concorrenti
→ non eseguito.
```

Il root corrente
mantiene lo stesso limite.

Quindi:

```text
IMPLEMENTATO E PASSATO
```

non viene trasformato
in:

```text
VALIDATO LIVE.
```

Questo è corretto.

---

# 23. RUNTIME-002 resta correttamente aperto

Il modulo lo classifica:

```text
CONFERMATO E AMPLIATO
PRIORITÀ CRITICA
```

La Todo corrente:

```text
RUNTIME-002
→ CONFERMATO;
  PRIORITÀ CRITICA.
```

Nessuna divergenza.

---

# 24. Il file stesso chiarisce che IMPL-015 non chiude RUNTIME-002

In coda:

```text
RUNTIME-002
e gli altri finding
della session authority
restano invariati.
```

Questa separazione è corretta.

---

# 25. SOFA-001 resta correttamente una validation question

Stato:

```text
DA VERIFICARE
```

con richiesta live su:

```text
durante game
subito dopo chiusura
tra due game
inizio set
tie-break.
```

La Todo corrente mantiene:

```text
DA VERIFICARE LIVE.
```

Non promuovere a bug.

---

# 26. TEST-001 resta correttamente gap

Il file identifica
l’assenza di copertura dedicata
per il tick Betfair `status-only`.

La Todo corrente:

```text
TEST-001
→ MANCANTE.
```

Coerente.

---

# 27. TEST-002 resta correttamente gap

Il file richiede test lifecycle su:

```text
A → B
response A tardiva
AbortController
unmount
polling stop
Start fallito
bootstrap.
```

Todo:

```text
TEST-002
→ MANCANTE.
```

Coerente.

---

# 28. FRONTEND-001…004 sono allineati

Modulo:

```text
FRONTEND-001
→ response tardive
→ critica

FRONTEND-002
→ integrity scartata
→ critica

FRONTEND-003
→ Start fallito lascia polling
→ critica

FRONTEND-004
→ mojibake
→ media
```

Todo corrente
mantiene gli stessi finding aperti.

Nessuna nuova task tecnica.

---

# 29. SECURITY-001…003 sono allineati

Modulo:

```text
SECURITY-001
→ network_capture.dump_dir pubblico

SECURITY-002
→ cache filename URL-derived

SECURITY-003
→ raw HTTP error detail
```

Todo corrente
li mantiene aperti.

Nessun drift owner.

---

# 30. PYTHON-001 è allineato

Modulo:

```text
task network capture
non tracciate né attese.
```

Todo:

```text
PYTHON-001
→ CONFERMATO.
```

Nessuna divergenza.

---

# 31. CLEANUP-002 è allineato

Modulo:

```text
offline check
limitato a lock
e porte preferite.
```

Todo:

```text
CLEANUP-002
→ CONFERMATO.
```

Nessuna riapertura.

---

# 32. CODE-002 è allineato

Modulo:

```text
validatore Betfair
non condiviso
Preflight/login/tracking.
```

Todo:

```text
CODE-002
→ CONFERMATO;
  VALIDATORE UNICO APPROVATO.
```

Decisione successiva
non equivale a implementazione.

Corretto.

---

# 33. CODE-005 è allineato

Modulo:

```text
lint esposto
ma configurazione assente.
```

Todo:

```text
CODE-005
→ CONFERMATO;
  CORREZIONE GRADUALE APPROVATA.
```

Nessuna falsa chiusura.

---

# 34. RUNTIME-001 resta una regola valida

Owner:

```text
Non riaprire la Task 2 runtime
senza discrepanza concreta.
```

Criteri:

```text
comportamento contrario
test significativo fallito
doc che maschera difetto
ownership/shutdown non sicuri
regressione riproducibile.
```

Questa regola non afferma:

```text
launcher perfetto per sempre.
```

Dice:

```text
serve evidenza per riaprire.
```

---

# 35. Gli audit successivi possono quindi soddisfare il criterio di RUNTIME-001

Il nostro audit documentale/codice successivo
ha registrato finding launcher più specifici:

```text
LOCAL-RUNTIME-001…007
PY-RUNTIME-*
```

Questi non rendono
RUNTIME-001 errata.

Sono precisamente
il tipo di evidenza
che la regola richiede.

Non aprire:

```text
RUNTIME-001-BUG.
```

---

# 36. La frase “non è stata trovata una ragione per riaprire” è però storica

Nel secondo audit Punto 1:

```text
Baseline:
dda406c4...
```

e:

```text
Non è stata trovata
una ragione per riaprire
il lifecycle del launcher.
```

Questa conclusione
vale per:

```text
quell’audit
quella baseline
quella profondità di controllo.
```

Non è current forever.

---

# 37. Il boundary baseline aiuta, ma non basta per il modulo intero

La baseline `dda406c4`
è visibile soltanto
nella sezione Punto 1.

Le sezioni B3–B6
hanno altra storia
e sono lette prima.

Quindi il documento
richiede una mappa temporale
più evidente.

---

# 38. Le sintesi B3 possono essere state superseded

Esempio:

```text
Storage/recovery
→ contratti principali coerenti
```

è una fotografia B3.

Audit successivi
hanno aperto:

```text
STORAGE-001…012
```

nella Todo corrente.

Quindi la frase
non può essere usata
come current state.

---

# 39. Questo non rende B3 “sbagliato”

La corretta interpretazione è:

```text
al checkpoint B3
con il perimetro allora verificato
→ non era emersa quella classe di difetto

audit successivo
→ nuove evidenze
→ nuovi finding.
```

La storia va preservata.

---

# 40. Il problema è la lack of supersession pointer

Un lettore del modulo
dovrebbe poter vedere subito:

```text
B3–B6
→ storico

per stato corrente:
Todo + owner successivi

per sessioni/Betfair:
Parte 2

per Storage:
Parte 3

per Evidence:
Parte 4

per frontend:
Parte 5

per test:
Parte 6

per post-audit:
Parte 7.
```

---

# 41. `AUDIT-CODE-P1-001` — esplicitare snapshot storici e supersession

**Priorità:** high  
**Tipo:** historical checkpoint / temporal authority

## Problema

Il modulo contiene:

```text
owner aggiornati
+
checkpoint B3–B6
+
priorità storiche
+
domande decisionali storiche
+
Punto 1 successivo
+
chiusura IMPL-015.
```

Alcune sezioni storiche
sono ormai superate
da decisioni o finding successivi,
ma restano formulate
come domande/priorità
senza un marker locale uniforme.

## Azione

Aggiungere in testa
una mappa temporale equivalente a:

```text
B3–B6
→ snapshot storico;
  non rappresenta il backlog corrente

Secondo audit Punto 1
→ baseline dda406c4

IMPL-015
→ update di implementazione successivo

Stato corrente degli ID
→ Todo + owner correnti
```

Aggiungere pointer di supersession
alle sezioni più ambigue.

In particolare:

```text
§15.1 Decisioni prima della task
→ etichettare "al checkpoint B6"

CODE-001
→ successivamente DEC-008

CODE-003
→ successivamente DEC-009

EVIDENCE-001
→ successivamente DEC-010

CLEANUP-001
→ successivamente DEC-011

CODE-004
→ successivamente assorbito da CODE-001.
```

Non modificare retroattivamente
il contenuto storico
come se quelle domande
non fossero mai esistite.

## Criterio di chiusura

Un lettore non può confondere:

```text
priorità/decisioni B6
```

con:

```text
current backlog.
```

---

# 42. Coordinamento con PLAN-AUDIT-003

`PLAN-AUDIT-003`
possiede:

```text
activity completion
vs exhaustive coverage.
```

`AUDIT-CODE-P1-001`
possiede invece:

```text
temporal authority
delle sezioni interne
di questa Parte 1.
```

Non sono duplicati.

---

# 43. Coordinamento con TASK-RECHECK-001

`TASK-RECHECK-001`
riguarda:

```text
D1–D18
historical recheck
vs current overlay.
```

Qui il problema è:

```text
B3–B6 + Punto 1
dentro audit-codice/01.
```

Responsabilità diversa.

---

# 44. Coordinamento con METHOD-LIFECYCLE-001

Il metodo generale
deve passare a steady-state.

Questo modulo
richiede però una correzione
specifica di:

```text
checkpoint history
supersession pointer
decision block stale.
```

Non duplicare
la riscrittura generale del metodo.

---

# 45. Il modulo supera la soglia guida di modularizzazione

Dimensione:

```text
1619 righe.
```

La Todo conserva
come soglia guida:

```text
oltre 1.500–2.000 righe
oppure
oltre 100 rilievi
oppure
rilettura troppo costosa.
```

Il file supera
il margine inferiore
della soglia.

Ma la sola lunghezza
non basta.

---

# 46. Qui esistono anche due responsabilità reali distinte

## Responsabilità A

```text
rilievi iniziali B3–B6
cross-domain

runtime
frontend
security
Python
cleanup
test
decisioni
priorità.
```

## Responsabilità B

```text
secondo audit Punto 1

entry point
launcher
writer authority
RUNTIME-003
DOC-024
TEST-004
IMPL-015.
```

Questa è una separazione
semantica, non cosmetica.

---

# 47. Il contesto minimo necessario è diverso

Per leggere B3–B6
servono:

```text
frontend
Betfair
Evidence
security
cleanup
test.
```

Per leggere Punto 1
servono soprattutto:

```text
launcher
server bootstrap
writer authority
matchTracker drain.
```

Caricare entrambe le parti
per una singola task
aumenta il contesto
senza aumentare la precisione.

---

# 48. Lo split può preservare il percorso stabile

Non è necessario
rinumerare tutte le Parti 1–7.

Soluzione consigliata:

```text
implementazioni/audit-codice/01-rilievi-iniziali.md
→ resta facade stabile
```

e introduce due child:

```text
implementazioni/audit-codice/01-rilievi-iniziali/
├── 01-checkpoint-b3-b6.md
└── 02-punto-1-runtime-writer-authority.md
```

---

# 49. Contenuto del child storico

`01-checkpoint-b3-b6.md`:

```text
RUNTIME-001
CODE-001…005
RUNTIME-002
SOFA-001
TEST-001…003
decisione EVIDENCE-001
FRONTEND-001…004
CLEANUP-001/002
SECURITY-001…003
PYTHON-001
checklist e priorità B3–B6
decisione UI persistence.
```

Con banner:

```text
snapshot storico
→ current state in Todo/owner.
```

---

# 50. Contenuto del child Punto 1

`02-punto-1-runtime-writer-authority.md`:

```text
Secondo audit Punto 1
baseline dda406c4

RUNTIME-003
DOC-024
TEST-004

decisione writer authority
IMPL-015 implementation result
commit
test
limite live.
```

Questo blocco
ha una responsabilità tecnica
molto più coesa.

---

# 51. Il facade 01 resta compatibile con Parte 2

`02-runtime-sessioni-betfair.md`
può continuare a linkare:

```text
../01-rilievi-iniziali.md
```

senza cambiare
la numerazione Parte 1/Parte 2.

Il facade 01
offre poi i due child.

---

# 52. `AUDIT-CODE-P1-002` — dividere Parte 1 per responsabilità

**Priorità:** medium-high  
**Tipo:** modularization / context boundary

## Problema

Il file da 1619 righe
contiene due macro-responsabilità
con contesti tecnici distinti.

## Azione

Trasformare:

```text
01-rilievi-iniziali.md
```

in facade breve
e spostare il contenuto
nei due child proposti.

## Vincoli

```text
nessun ID rinumerato
nessuna owner card duplicata
nessuna perdita di testo storico
nessuna modifica degli stati
nessuna modifica del codice
nessun cambio della Todo
finché il contenuto non è ricomposto/verificato
```

## Verification

```text
concatenazione logica
→ contenuto completo preservato

registry checker
→ zero duplicate owner

link checker
→ zero errori

fast
→ PASS

git diff --check
→ PASS.
```

---

# 53. Proposed files

```text
implementazioni/audit-codice/01-rilievi-iniziali/
├── 01-checkpoint-b3-b6.md
└── 02-punto-1-runtime-writer-authority.md
```

Il file esistente:

```text
implementazioni/audit-codice/01-rilievi-iniziali.md
```

resta:

```text
facade stabile.
```

---

# 54. Nessun nuovo documento canonico

I proposed files
sono sotto:

```text
implementazioni/
```

quindi:

```text
registri non canonici.
```

La conta canonica 72
non cambia finché
la ristrutturazione non viene realmente eseguita
e il nuovo inventario non viene deciso.

---

# 55. Non aprire nuove task tecniche sui finding esistenti

Non creare:

```text
RUNTIME-002bis
FRONTEND-001bis
SECURITY-001bis
CLEANUP-002bis
SOFA-001bis
```

Le owner card esistono già.

---

# 56. Non riaprire RUNTIME-003

Current evidence:

```text
writer authority
→ implementata

TEST-004
→ passato

manual two-backend live
→ non eseguito.
```

Questo è:

```text
implemented + offline tested
≠ live validated.
```

Non è motivo
per riaprire la correzione
senza nuova discrepanza.

---

# 57. Non promuovere il limite live a failure

Il collaudo manuale
non eseguito
rimane:

```text
validation gap.
```

Non:

```text
runtime bug dimostrato.
```

---

# 58. Non chiudere SOFA-001

Il file è prudente:

```text
DA VERIFICARE.
```

Il nostro report 029
ha anche mostrato
che current-game authority
richiede evidenza più forte.

Quindi:

```text
resta aperto.
```

---

# 59. Non chiudere TEST-001/002

Sono ancora:

```text
MANCANTI
```

nella Todo corrente.

Nessuna evidence
in questo audit
per promuoverli.

---

# 60. TEST-003 richiede solo un pointer di supersession nel blocco storico

Non modificare
lo stato corrente da qui.

Todo:

```text
runner implementato
matrice completa ancora aperta.
```

Il blocco B6
può restare:

```text
al checkpoint mancava
un comando canonico.
```

---

# 61. Le sezioni “Aree B4 coerenti da preservare” devono essere lette come snapshot

Esempi:

```text
Proxy dinamico
Source Identity UI
Money Flow
Match Context
Wrapper Python
Graph URL.
```

Alcune di queste aree
sono state riesaminate
più profondamente in seguito.

Quindi non devono
fungere da certification current.

---

# 62. Non serve aggiornare ogni bullet storico con tutti i finding successivi

Sarebbe troppo rumoroso.

Meglio un banner generale
e pochi pointer di supersession
nei punti realmente ambigui.

---

# 63. La sezione “Stato dopo B3” può restare

È utile come storia:

```text
SofaScore
Betfair
Storage/recovery
Evidence/Source Identity
```

Basta etichettarla:

```text
snapshot B3.
```

---

# 64. La sezione “Stato dopo B4” può restare

Stessa regola:

```text
historical checkpoint
not current status.
```

---

# 65. La sezione “Stato dopo B5” può restare

Non va trasformata
nella roadmap corrente.

---

# 66. La sezione “Priorità tecniche dopo l’audit” è il punto più rischioso

Il titolo:

```text
Priorità tecniche dopo l’audit
```

può sembrare current.

Oggi però:

```text
CODE-004
→ assorbito

decisioni CODE-001/003
EVIDENCE-001/CLEANUP-001
→ già risolte

nuove famiglie di finding
→ emerse successivamente.
```

Quindi questa sezione
deve essere rinominata o annotata:

```text
Priorità tecniche al checkpoint B6.
```

---

# 67. La decisione UI persistence è già stata assorbita in DEC-012

Il blocco:

```text
stato locale
+
sidebar
+
modale
```

corrisponde alla decisione:

```text
DEC-012.
```

Non è necessario
rimuoverlo dalla storia.

È utile aggiungere:

```text
successivamente formalizzato
in DEC-012.
```

---

# 68. Le decisioni CODE-001/003/EVIDENCE-001/CLEANUP-001 sono già formalizzate

Mapping:

```text
CODE-001
→ DEC-008

CODE-003
→ DEC-009

EVIDENCE-001
→ DEC-010

CLEANUP-001
→ DEC-011

UI persistence
→ DEC-012.
```

Questi pointer
sono sufficienti.

---

# 69. Non trasformare Parte 1 in un decision log

I pointer servono
a evitare ambiguità.

Il contenuto completo DEC
resta in:

```text
99-decisioni-utente.md.
```

---

# 70. Non trasformare Parte 1 in una Todo corrente

La Todo resta
la vista sintetica unica.

Il facade 01
dopo lo split
deve indicare:

```text
per current status
→ Todo.
```

Non ricopiare
tutti gli stati correnti.

---

# 71. Non trasformare Parte 1 in un changelog Git

Conservare solo
le provenance tecnicamente necessarie:

```text
baseline dda406c4
commit IMPL-015
test counts
live limit.
```

La storia completa
resta in Git.

---

# 72. Aspetti corretti da preservare integralmente

```text
1. RUNTIME-001 come regola evidence-based;
2. CODE-001 rimozione Strategy approvata;
3. Market Reactions preservate;
4. CODE-003 rimozione debug-last;
5. CODE-004 assorbito da CODE-001;
6. CODE-002 validatore Betfair gap;
7. RUNTIME-002 critical;
8. SOFA-001 da verificare live;
9. TEST-001 gap;
10. DEC selectionId bounded a Field → Market;
11. FRONTEND-001…004;
12. CLEANUP-001 unica authority Source Identity;
13. SECURITY-001…003;
14. PYTHON-001;
15. TEST-002;
16. CLEANUP-002;
17. CODE-005;
18. decisione UI persistence;
19. RUNTIME-003 completion;
20. DOC-024 completion;
21. TEST-004 passed;
22. IMPL-015 file/commit/test evidence;
23. limite manual two-backend non eseguito;
24. RUNTIME-002 ancora aperto dopo IMPL-015.
```

---

# 73. Aspetti da correggere

```text
AUDIT-CODE-P1-001 — HIGH
→ snapshot B3–B6
  e current authority
  non sufficientemente separati
→ §15.1 contiene decisioni
  ormai risolte
→ priorità CODE-004 stale
→ aggiungere supersession pointers

AUDIT-CODE-P1-002 — MEDIUM-HIGH
→ 1619 righe
→ due responsabilità reali
→ split con facade stabile
```

---

# 74. Finding esistenti da NON duplicare

## PLAN-AUDIT-003

Possiede:

```text
audit completed
≠
exhaustive coverage.
```

---

## METHOD-EVIDENCE-001

Possiede:

```text
implemented
offline tested
live validated
provenance.
```

---

## TASK-RECHECK-001/002

Possiedono:

```text
D1–D18 historical/current reconciliation.
```

---

## LOCAL-RUNTIME-*

Possiedono:

```text
nuove discrepanze launcher/runtime
emerse nel nostro audit successivo.
```

`AUDIT-CODE-P1-001`
non le reimplementa.

---

## SOFA-LIVE-*

Possiedono:

```text
session/tracking lifecycle
del modulo Sofa live.
```

---

## GRAPH-URL-*

Possiedono:

```text
hardening Graph URL
emerso nel report 027.
```

---

## LOCAL-PBP-*

Possiedono:

```text
current-game authority
e contract PBP.
```

---

## STORAGE-TH-* / JOURNAL-REC-*

Possiedono:

```text
storage e recovery
emersi negli audit successivi.
```

---

# 75. Verification matrix — AUDIT-CODE-P1-001

```text
[ ] banner temporale globale
[ ] B3–B6 dichiarati snapshot storici
[ ] current status pointer → Todo
[ ] §15.1 rinominata/annotata checkpoint B6
[ ] CODE-001 → DEC-008
[ ] CODE-003 → DEC-009
[ ] EVIDENCE-001 → DEC-010
[ ] CLEANUP-001 → DEC-011
[ ] UI persistence → DEC-012
[ ] CODE-004 storico/assorbito chiarito
[ ] nessun owner state cambiato
[ ] nessuna cronologia cancellata
```

---

# 76. Verification matrix — AUDIT-CODE-P1-002

```text
[ ] 01-rilievi-iniziali.md resta path stabile
[ ] facade breve
[ ] child B3–B6 creato
[ ] child Punto 1 creato
[ ] tutti gli ID preservati
[ ] nessuna owner card duplicata
[ ] nessuna sezione persa
[ ] link Parte 2 invariato
[ ] registry checker PASS
[ ] link checker PASS
[ ] fast PASS
[ ] git diff --check PASS
```

---

# 77. Modularizzazione obbligatoria

```text
modularization_reviewed: true
split_required: true
proposed_files:
  - implementazioni/audit-codice/01-rilievi-iniziali/01-checkpoint-b3-b6.md
  - implementazioni/audit-codice/01-rilievi-iniziali/02-punto-1-runtime-writer-authority.md
```

Il file esistente:

```text
implementazioni/audit-codice/01-rilievi-iniziali.md
```

resta come facade.

---

# 78. Perché lo split è necessario

Non perché:

```text
1619 righe
```

da sole siano vietate.

Ma perché:

```text
checkpoint cross-domain storico
≠
audit launcher/writer authority
```

e i due blocchi richiedono
contesti di lettura differenti.

La dimensione
rafforza una separazione
già giustificata semanticamente.

---

# 79. Ordine consigliato

```text
1. AUDIT-CODE-P1-001
   → chiarire temporal authority

2. AUDIT-CODE-P1-002
   → split preservando path stabile

3. verificare owner uniqueness

4. registry checker

5. link checker

6. fast

7. git diff --check
```

È possibile eseguire
1 e 2 nella stessa task documentale
soltanto se il prompt mantiene
due acceptance criteria separati.

Nel ledger restano comunque
due Change ID distinti
perché sono due responsabilità:
semantica temporale
e struttura/modularizzazione.

---

# 80. Decisione finale

```text
implementazioni/audit-codice/01-rilievi-iniziali.md:

CONTENUTO:
UTILE E SOSTANZIALMENTE COERENTE

OWNER PRINCIPALI:
ALLINEATI ALLA TODO

NUOVI BUG RUNTIME:
0

NUOVI BUG TECNICI:
0

PROBLEMA 1:
AUDIT-CODE-P1-001 — HIGH

→ B3–B6 storici
  mescolati a stati/decisioni successivi

→ §15.1 torna a chiedere
  decisioni già approvate

→ CODE-004 appare ancora
  in una priorità storica
  pur essendo assorbito

→ serve boundary temporale
  e supersession pointers

PROBLEMA 2:
AUDIT-CODE-P1-002 — MEDIUM-HIGH

→ 1619 righe
→ due macro-responsabilità
→ context cost elevato

SPLIT:
SÌ

FACADE STABILE:
implementazioni/audit-codice/01-rilievi-iniziali.md

CHILD PROPOSTI:
01-checkpoint-b3-b6.md
02-punto-1-runtime-writer-authority.md

RISCRITTURA COMPLETA:
NO

NUOVI FILE CANONICI:
NO

PRIORITÀ COMPLESSIVA:
MEDIO-ALTA
```

---

# 81. Stato audit dopo report 053

```text
Documenti Markdown totali: 72
Analizzati: 53
Da analizzare: 19
Avanzamento: 73,61%

Blocco 053–057:
[✓] 053 implementazioni/audit-codice/01-rilievi-iniziali.md
[ ] 054 implementazioni/audit-codice/02-runtime-sessioni-betfair.md
[ ] 055 implementazioni/audit-codice/03-storage-recovery.md
[ ] 056 implementazioni/audit-codice/04-evidence-market-reactions.md
[ ] 057 implementazioni/audit-codice/05-frontend-session-shell.md
```

Nuove task non ancora consolidate:

```text
053
→ 2
```

Contatori provvisori:

```text
task note fino al report 052:
326

nuove report 053:
2

task complessive note provvisorie:
328
```

La mappa/JSON `continuazione-048`
non viene aggiornata
finché non si chiude il blocco 053–057,
salvo diversa istruzione esplicita.

---

# 82. Prossimo documento

```text
054
implementazioni/audit-codice/02-runtime-sessioni-betfair.md
```

Non analizzato in questo report.

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `AUDIT-CODE-P1-001`.
- Task ancora aperte: `AUDIT-CODE-P1-002`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
