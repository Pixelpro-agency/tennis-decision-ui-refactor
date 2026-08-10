# Report documentale — `implementazioni/audit-documentazione/02-moduli-frontend-python.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-061
Sequenza audit: 61/72
Documento analizzato: 02-moduli-frontend-python.md
Percorso documento: implementazioni/audit-documentazione/02-moduli-frontend-python.md
Percorso report: Report documentale/61 - 02-moduli-frontend-python.md
Commit repository analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Git blob SHA documento: 27e8fbb012fac628af1150852b3fcb61eea89618
Dimensione documento: 742 righe
Tipo: modulo owner dell’audit documentale — checkpoint B3 moduli + B4 frontend/Python
Baseline dichiarata B3: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Baseline B4: stesso contesto di audit documentale pre-migrazione
Stato report audit: completato
```

Il documento è stato confrontato con:

```text
todo-list-tennis-decision-ui.md
implementazioni/02-audit-documentazione.md

docs/tennis-decision-ui/modules/sofa/01-live-tracking.md
docs/tennis-decision-ui/modules/betfair/02-technical-sample-validity.md
docs/tennis-decision-ui/modules/storage/01-timelines-and-history.md
docs/tennis-decision-ui/modules/evidence/04-market-reactions.md
docs/tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md
docs/tennis-decision-ui/modules/frontend/03-betfair-and-market-reactions-ui.md
docs/tennis-decision-ui/modules/python/02-sofascore-scraper.md
docs/tennis-decision-ui/modules/python/03-betfair-scraper.md

backend/src/sofa/betfair/trackerUpdate.js
backend/src/sofa/matchHistory.js
backend/src/routes/betfair/oddsResponse.js
scrapers/betfair/network_capture.py
scrapers/betfair/scrape.py
```

Sono stati inoltre coordinati, senza duplicarli:

```text
DOC-014
DOC-015
DOC-016
DOC-017
DOC-018
DOC-019

FRONTEND-001
FRONTEND-002
FRONTEND-003
FRONTEND-004

SECURITY-001
SECURITY-002
SECURITY-003

SOFA-001
TEST-001

DOC-AUDIT-IDX-001
DOC-AUDIT-P12-001
DOC-AUDIT-P12-002
CURRENT-STATE-*
ROOT-REG-*
WORKFLOW-005
IMPL-032
```

GitHub non è stato modificato.

Per mantenere il workflow concordato:

```text
mappa Markdown: NON aggiornata
ledger JSON: NON aggiornato
documento 062: NON analizzato
```

---

# Esito sintetico

```text
Valore storico del modulo:                         ALTO
Checkpoint B3:                                     CHIARO
Checkpoint B4:                                     CHIARO
Test letti/non eseguiti:                           ESPLICITO
Migrazione canonica successiva:                    COMPLETATA

DOC-014:                                           ANCORA ATTIVO
DOC-015:                                           ANCORA ATTIVO
DOC-016:                                           ANCORA ATTIVO, PARZIALMENTE MIGLIORATO
DOC-017:                                           ANCORA ATTIVO
DOC-018:                                           RISOLTO LATO DOCUMENTAZIONE
DOC-019:                                           ANCORA ATTIVO

Underlying runtime/code per DOC-018:
FRONTEND-002:                                      ANCORA APERTO

Underlying runtime/code per DOC-019:
SECURITY-001:                                      ANCORA APERTO
SECURITY-002:                                      ANCORA APERTO
SECURITY-003:                                      ANCORA APERTO

Todo corrente:
DOC-014…019:                                       tutti ancora CONFERMATO

Problema di lifecycle owner:                       SÌ
Problema tecnico nuovo:                            NO
Nuovi bug runtime:                                 0
Nuovi bug Python:                                  0
Nuovi bug frontend:                                0
Nuovi finding documentali:                         2
Nuove task:                                        2

Responsabilità nel file:                           2 checkpoint distinti
Dimensione:                                        742 righe
Split:                                             SÌ
Riscrittura completa contenuto storico:            NO
Revisione mirata:                                  SÌ
Priorità complessiva:                              ALTA
```

Conclusione:

```text
IL MODULO 061 RESTA
UN BUON RECORD STORICO
DEI CHECKPOINT B3 E B4.

LA MAGGIOR PARTE DEI FINDING
DOC-014…019 È ANCORA REALE.

NON VA QUINDI APPLICATA
UNA CHIUSURA MASSIVA.

C'È PERÒ UN DRIFT
POST-MIGRAZIONE CONCRETO:

DOC-018
È STATO RISOLTO
LATO DOCUMENTAZIONE.

I DOCUMENTI FRONTEND CORRENTI
DICONO ESPLICITAMENTE
CHE IL WIRING INTEGRITY
È PARZIALE E CHE APP/VIEW MODEL/UI
NON LO PROPAGANO ANCORA.

IL BUG FRONTEND SOTTOSTANTE
RESTA FRONTEND-002.

GLI ALTRI OWNER RESTANO APERTI:

DOC-014
→ LIVE TRACKING CONTINUA
  A DESCRIVERE MALE L'ORDINE
  CLASSIFICAZIONE/KEY;

DOC-015
→ DUPLICAZIONI OWNER
  ANCORA PRESENTI;

DOC-016
→ STORAGE MIGLIORATO,
  MA addBetfairUpdate NON È ANCORA
  ESPLICITAMENTE CLASSIFICATA
  COME COMPATIBILITY PREPARE-ONLY;

DOC-017
→ MARKET REACTIONS CONTINUA
  A DIRE DI CONSUMARE
  SNAPSHOT EVIDENCE GIÀ COSTRUITI;

DOC-019
→ HARDENING PUBBLICO
  ANCORA PIÙ FORTE DEL CODICE.

SERVONO DUE TASK:

DOC-AUDIT-B34-001
→ reconciliation storico/current;

DOC-AUDIT-B34-002
→ split B3 / B4
  con facade stabile.
```

---

# 1. Struttura del documento

Il file contiene:

```text
§12
Checkpoint B3
— documenti owner dei moduli

§13
Checkpoint B4
— Frontend e Python
```

Sono due audit block reali.

---

# 2. Checkpoint B3 — perimetro

B3 comprende:

```text
SofaScore tracking
Local Context / PBP

Betfair lifecycle
Betfair technical validity

Storage timeline/history
Storage journal/recovery

Evidence Snapshot
Source Identity
quality/flow/alignment
Market Reactions.
```

---

# 3. Checkpoint B4 — perimetro

B4 comprende:

```text
frontend session shell
polling/view model
Betfair UI
Market Reactions UI
Match Context UI

Python entrypoints/runtime
SofaScore scraper
Betfair scraper
Graph URL.
```

---

# 4. Test B3/B4 — provenance corretta

Entrambi i checkpoint dichiarano:

```text
test letti
ma non eseguiti.
```

Quindi:

```text
test file presente
≠
PASS sul checkpoint.
```

Corretto.

---

# 5. Percorsi `.mdx` sono storici

B3/B4 elencano:

```text
*.mdx
```

perché descrivono
il repository prima
della migrazione canonica.

Non devono essere
trattati come broken link current
se qualificati come provenance storica.

---

# 6. La migrazione successiva non invalida il checkpoint

I finding originari
restano validi come:

```text
osservazione sullo SHA b277...
```

La domanda dell’audit corrente è:

```text
quali finding
sono ancora current?
```

---

# 7. Parent facade corrente

`implementazioni/02-audit-documentazione.md`
mappa questo child come:

```text
Moduli, frontend e Python
→ Sezioni 12–13
→ DOC-014…019.
```

Il mapping è corretto.

---

# 8. DOC-014 — root issue originaria

Finding:

```text
documentazione:
fetch
→ classificazione tecnica
→ tracking key
→ gate
→ persistenza

codice:
fetch
→ hasFinished
→ getBetfairTrackingKey
→ classifyBetfairTechnicalSample.
```

---

# 9. Current code conferma ancora l’ordine reale

`trackerUpdate.js` esegue:

```text
hasFinished
→ const key = getKeyFn(...)
→ classifyBetfairTechnicalSample(result)
```

Quindi:

```text
key
prima della classification.
```

---

# 10. `getBetfairTrackingKey` resta pure transformation

Il finding non dimostra
un bug runtime
da solo.

La root resta:

```text
discrepanza documentale.
```

---

# 11. Il current documento Technical Sample è migliorato

`02-technical-sample-validity.md`
dice:

```text
trackerUpdate valuta
prima il mercato concluso,
poi la validità tecnica.
```

Non insiste
sulla tracking key.

Questa parte
è più prudente.

---

# 12. Ma il current Tracking Live conserva ancora il claim errato

`01-live-tracking.md` mostra:

```text
fetchBetfairData
→ hasFinished
→ classificazione tecnica
→ campione valido
→ tracking key
```

e afferma:

```text
Un campione tecnico
non deve chiamare
getBetfairTrackingKey.
```

Il codice lo chiama
prima di sapere
se il sample è usable.

---

# 13. DOC-014 quindi NON è risolto

Current outcome:

```text
CONFERMATO.
```

Non creare
un nuovo finding.

---

# 14. DOC-014 — intervento minimo ancora valido

Opzioni:

```text
A
correggere il current Tracking Live
per mostrare la key pura
prima della classificazione;

oppure

B
spostare realmente la key
dopo classify nel codice.
```

La scelta documentale minima
resta A,
finché non esiste
motivo tecnico per B.

---

# 15. Non trasformare DOC-014 in bug operativo

Il fatto che la key
venga calcolata prima
non implica:

```text
gate mutato
baseline mutato
persistence mutata.
```

Restare nel dominio documentale.

---

# 16. DOC-015 — duplicazione contratti owner

Finding originario:

```text
tracking live
lifecycle Betfair
storage
Evidence
ripetono contratti trasversali.
```

---

# 17. La migrazione ha migliorato l’ownership

Current docs usano più spesso:

```text
owner dedicato
link
precondizione
confine.
```

Questo è un miglioramento reale.

---

# 18. Ma Tracking Live resta molto cross-domain

Current Tracking Live include:

```text
scheduler
active operations
writer authority implications
Python generation
Source Identity Gate
Sofa persistence
Betfair technical validity
Betfair persistence
mismatch
shutdown/drain.
```

---

# 19. Storage resta anch’esso molto cross-domain

Current Timeline/History include:

```text
writer authority
Source Identity Gate
Betfair technical validity
status-only Graph
journal ordering
recovery
runtime state exclusions.
```

---

# 20. Quindi DOC-015 resta attivo

La root issue:

```text
same detailed contract
in multiple owner docs
```

non è stata eliminata
completamente.

Current outcome:

```text
CONFERMATO
ma migliorato.
```

---

# 21. Non duplicare DOC-015

Non creare:

```text
DOC-034
```

per le stesse
duplicazioni residue.

---

# 22. DOC-016 — due sottoproblemi originari

A:

```text
addBetfairUpdate
presentata come API writer
ma runtime reale
= compatibility facade prepare-only.
```

B:

```text
formula read-only troppo forte
sulla creazione directory.
```

---

# 23. Current Storage ha corretto parte B

Il current documento
usa formule bounded:

```text
route/request read-only
→ nessuna scrittura canonica

call site storage
→ possono assicurare
precondizioni o directory.
```

Non sostiene più
in modo generale:

```text
il modulo non crea mai directory.
```

Questa parte
è sostanzialmente migliorata.

---

# 24. Current Storage però continua a elencare `addBetfairUpdate` fra le API pubbliche

Elenco:

```text
getHistoryFile
loadHistory
saveHistory
addSofaUpdate
addBetfairUpdate.
```

---

# 25. Il documento indica correttamente che il processor possiede il commit Betfair

Più avanti dice:

```text
processor Betfair
→ owner della classificazione

processor persistence.js
→ facade pubblica del commit Betfair.
```

Questo riduce l’ambiguità.

---

# 26. Manca però ancora la formula esplicita richiesta dal finding

Il current documento
non dice chiaramente:

```text
addBetfairUpdate
→ compatibility facade
→ prepare-only
→ non è il canonical commit writer.
```

---

# 27. Il codice corrente lo dichiara invece esplicitamente

`matchHistory.js`:

```text
Compatibility façade:
it now prepares a document only.

processor owns
the sole journalized canonical write.
```

Questa è la formula
che la documentazione
dovrebbe riflettere.

---

# 28. DOC-016 current outcome

```text
PARZIALMENTE MIGLIORATO
MA ANCORA CONFERMATO.
```

Non chiuderlo.

---

# 29. DOC-017 — root issue originaria

Finding:

```text
Market Reactions
non consuma
uno snapshot Evidence
già costruito.

Viene costruito
durante Evidence builder
da array scoped.
```

---

# 30. Current Market Reactions conserva la formulazione problematica

Il documento corrente dice:

```text
Il modulo consuma solo
snapshot Evidence già costruiti.
```

---

# 31. Current doc aggiunge anche una seconda formula analoga

Dice:

```text
Market Reactions riceve
dal Match Evidence Snapshot
input già scoped.
```

Questa formula
resta semanticamente ambigua
rispetto alla pipeline reale.

---

# 32. La pipeline reale resta quella del finding

```text
latestMatchEvidence
→ buildEvidenceFromTicks
→ scoping
→ buildMarketReactionEvidence({
     sofaTicks,
     betfairTicks,
     now
   })
→ inserimento risultato
  nello snapshot finale.
```

---

# 33. DOC-017 resta quindi attivo

Current outcome:

```text
CONFERMATO.
```

---

# 34. Correzione target DOC-017

Usare:

```text
Evidence builder
→ seleziona/scopa i tick
→ Market Reactions
  riceve array scoped
→ costruisce i rami
→ il risultato entra
  nello snapshot Evidence finale.
```

---

# 35. Non cambiare il confine I/O di Market Reactions

Il modulo resta:

```text
puro rispetto a
journal
recovery
tracking
persistence
browser.
```

Il problema è solo
la forma dell’input descritta.

---

# 36. DOC-018 — root issue originaria

Finding:

```text
documentazione frontend
descriveva integrity end-to-end
come già collegata

ma App/view model/UI
non la propagavano.
```

---

# 37. Current Polling/View Model è stato corretto

Il documento corrente apre con:

```text
le API Match e Betfair
espongono integrity

wiring frontend corrente
è solo parziale.
```

---

# 38. Current Polling doc descrive esattamente il limite Sofa

Per `useMatchPolling`:

```text
integrity
→ conservata dall’hook.
```

Non dice
che è già visibile
nella UI globale.

---

# 39. Current Polling doc descrive esattamente il limite Betfair

Dice:

```text
useBetfairJson
→ espone integrity

App.jsx
→ non la destruttura
→ non la passa
  a useDashboardViewModel
  o BetfairDepthCard.
```

---

# 40. Current Polling doc corregge anche `serverStatus`

Checkpoint B4 criticava:

```text
persistence_integrity.
```

Current doc dice:

```text
partial_persistence
recovery_failed

persistence_integrity
non è usato come serverStatus.
```

Corretto.

---

# 41. Current Evidence hook documentation è bounded

Dice:

```text
useMarketReactionEvidence
→ salva solo
  latest.marketReactionEvidence

non espone:
integrity top-level
sources
persistenceComplete
snapshot completo.
```

Questa è la realtà corrente.

---

# 42. Current Betfair/Market Reactions UI è anch’essa corretta

Apre con:

```text
wiring UI corrente
è incompleto.
```

e specifica:

```text
BetfairDepthCard
non riceve integrity

MarketReactionsPage
non riceve integrity top-level.
```

---

# 43. DOC-018 ha quindi soddisfatto il proprio criterio documentale

La descrizione falsa
della pipeline end-to-end
non è più presente.

---

# 44. FRONTEND-002 resta però aperto

Il codice non è stato
reso integrity-aware
end-to-end.

Quindi:

```text
DOC-018
→ resolved documentation

FRONTEND-002
→ runtime/UI implementation gap
  still open.
```

---

# 45. Non tenere DOC-018 aperto come proxy di FRONTEND-002

Questo violerebbe:

```text
un owner per root issue.
```

La Todo dovrebbe
riflettere la separazione.

---

# 46. DOC-019 — root issue originaria

Finding:

```text
hardening Python
descritto più forte
del comportamento pubblico.
```

Tre manifestazioni:

```text
network capture path
cache URL-derived filename
raw error details.
```

---

# 47. Current Python Betfair continua a usare formulazioni forti

Il doc dice:

```text
I campi diagnostici restituiti
dallo scraper vengono redatti
prima dell’esposizione
al backend Node.
```

---

# 48. Network capture summary corrente contiene ancora `dump_dir`

`summarize_network_capture(...)` restituisce:

```text
dump_dir:
str(collector.get("dump_dir", ""))
```

Questo è un path locale.

---

# 49. Il summary viene inserito nel risultato scraper

`scrape_betfair(...)`:

```text
results["network_capture"]
=
summarize_network_capture(collector)
```

Quindi il path
entra nel payload Python.

---

# 50. `/api/betfair/odds` serializza il risultato

`oddsResponse.js`:

```text
fetchBetfairData(...)
→ serializePayload(data)
→ HTTP 200.
```

Non applica
un serializer pubblico
che elimini `dump_dir`.

---

# 51. Quindi il confine pubblico resta realmente incompleto

Almeno nel percorso
con network capture attiva:

```text
local dump path
→ Python result
→ Node data
→ /odds serialized response.
```

Questo conferma
DOC-019 / SECURITY-001.

---

# 52. Gli errori `/odds` continuano a esporre details

Failure path:

```text
{
  error: "Failed to fetch Betfair data",
  details: error.message
}
```

Quindi un messaggio interno
può ancora attraversare
il boundary pubblico.

---

# 53. DOC-019 resta attivo

Current outcome:

```text
CONFERMATO.
```

Non chiuderlo
perché alcuni helper
redigono URL/header/body.

---

# 54. Diagnostic redaction è reale ma non completa il boundary

È corretto documentare:

```text
URL redatte
header redatti
payload redatti
testo redatto.
```

Ma non:

```text
tutte le superfici pubbliche
sono prive di path/details.
```

---

# 55. SECURITY-001 resta owner del network capture public boundary

Non aprire
un nuovo SECURITY ID.

---

# 56. SECURITY-002 resta owner della cache identity/key

Il report 061
non deve duplicare
la cache filename issue.

---

# 57. SECURITY-003 resta owner degli error details pubblici

Non aprire
un nuovo error-redaction finding.

---

# 58. Mapping current proposto per DOC-014…019

```text
DOC-014
→ CONFERMATO

DOC-015
→ CONFERMATO
  / MIGLIORATO PARZIALMENTE

DOC-016
→ CONFERMATO
  / MIGLIORATO PARZIALMENTE

DOC-017
→ CONFERMATO

DOC-018
→ RISOLTO LATO DOCUMENTAZIONE
  / FRONTEND-002 ANCORA APERTO

DOC-019
→ CONFERMATO.
```

---

# 59. Todo corrente non rappresenta questa distinzione

Todo:

```text
DOC-014 → CONFERMATO
DOC-015 → CONFERMATO
DOC-016 → CONFERMATO
DOC-017 → CONFERMATO
DOC-018 → CONFERMATO
DOC-019 → CONFERMATO.
```

L’unico drift certo
di lifecycle è:

```text
DOC-018.
```

---

# 60. B3/B4 restano però checkpoint storici

Le chiusure:

```text
nessuna modifica a docs/
o al codice
```

sono corrette
per il momento dell’audit.

Oggi non devono essere
lette come current state.

---

# 61. Serve un boundary temporale esplicito

Il child dovrebbe dichiarare:

```text
§12–13
→ checkpoint B3/B4 storici

current owner state
→ Todo + overlay nel child.
```

---

# 62. DOC-AUDIT-B34-001 — reconciliation B3/B4 post-migrazione

**Priorità:** high  
**Tipo:** owner lifecycle / historical-current reconciliation

## Problema

Il file contiene
owner card del checkpoint
e gli esiti B3/B4,
ma non registra in modo uniforme
l’effetto della successiva
riscrittura canonica.

Il caso dimostrato è:

```text
DOC-018
→ checkpoint = CONFERMATO

current frontend docs
→ descrizione corretta
  del wiring parziale

underlying FRONTEND-002
→ ancora aperto.
```

## Azione

Aggiungere in testa:

```text
B3/B4 = checkpoint storici.

Gli stati correnti
sono reconciliati
senza cancellare
l’osservazione originaria.
```

Aggiornare almeno:

```text
DOC-018:
stato al checkpoint
→ CONFERMATO

stato corrente
→ RISOLTO LATO DOCUMENTAZIONE

implementation gap
→ FRONTEND-002 aperto.
```

Conservare:

```text
DOC-014 → open
DOC-015 → open
DOC-016 → open/partial
DOC-017 → open
DOC-019 → open.
```

Annotare gli esiti B3/B4:

```text
"nessuna modifica"
→ stato del checkpoint,
non current state.
```

---

# 63. Acceptance criteria — B34-001

```text
[ ] banner checkpoint storico B3/B4
[ ] baseline b277 preservata
[ ] test read/not-run qualifier preservato
[ ] DOC-014 resta open
[ ] DOC-015 resta open
[ ] DOC-016 resta open/partial
[ ] DOC-017 resta open
[ ] DOC-018 current = resolved documentation
[ ] FRONTEND-002 resta open
[ ] DOC-019 resta open
[ ] SECURITY-001/002/003 non duplicati
[ ] B3 "no docs/code changes" marcato storico
[ ] B4 "no docs/code changes" marcato storico
[ ] Todo reconciliata con owner current state
[ ] nessun current PASS inventato
[ ] nessun live validation inventata
```

---

# 64. Non includere DOC-014 nella chiusura

Il current Tracking Live
conserva ancora
la discrepanza.

---

# 65. Non includere DOC-015 nella chiusura

Le duplicazioni
sono ancora osservabili.

---

# 66. Non includere DOC-016 nella chiusura

La metà directory/read-only
è migliorata.

La classificazione
`addBetfairUpdate` prepare-only
non è ancora esplicita.

---

# 67. Non includere DOC-017 nella chiusura

Il current Market Reactions
usa ancora:

```text
snapshot Evidence già costruiti.
```

---

# 68. Non includere DOC-019 nella chiusura

`dump_dir`
e `details`
sono evidence corrente.

---

# 69. Non riaprire FRONTEND-002 dentro DOC-018

Usare una formula:

```text
DOC-018
resolved documentation

see FRONTEND-002
for implementation gap.
```

---

# 70. Modularizzazione — dimensione

Il file ha:

```text
742 righe.
```

La lunghezza
è nella fascia
in cui va valutata
la responsabilità.

---

# 71. Esistono due responsibility boundary nette

B3:

```text
owner modules
Sofa/Betfair/Storage/Evidence.
```

B4:

```text
Frontend/Python.
```

---

# 72. I contesti minimi sono differenti

Per B3 servono:

```text
matchTracker
Betfair processor
storage
journal
Evidence builder
Source Identity.
```

Per B4 servono:

```text
React hooks/components
launcher
Python packages
public route boundaries.
```

---

# 73. Mantenere tutto in un file aumenta il context load

Per verificare DOC-014…017
non servono:

```text
frontend component
Python cache
network capture.
```

Per DOC-018/019
non serve
l’intero journal/recovery.

---

# 74. Split consigliato per responsabilità

Path corrente:

```text
implementazioni/audit-documentazione/02-moduli-frontend-python.md
```

resta facade stabile.

Child proposti:

```text
implementazioni/audit-documentazione/02-moduli-frontend-python/
├── 01-moduli-owner-b3.md
└── 02-frontend-python-b4.md
```

---

# 75. Child B3

Contiene:

```text
§12
DOC-014
DOC-015
DOC-016
DOC-017
verifiche no discrepancy
EVIDENCE-001 deferred
Esito B3.
```

---

# 76. Child B4

Contiene:

```text
§13
DOC-018
DOC-019
frontend linked findings
coherent areas
Esito B4.
```

---

# 77. DOC-AUDIT-B34-002 — split B3 / B4

**Priorità:** medium-high  
**Tipo:** modularization / context boundary

## Azione

Trasformare:

```text
02-moduli-frontend-python.md
```

in facade breve
e creare i due child.

---

# 78. Acceptance criteria — B34-002

```text
[ ] current facade path preserved
[ ] parent 02-audit-documentazione link unchanged
[ ] B3 moved intact
[ ] B4 moved intact
[ ] DOC-014…019 IDs unchanged
[ ] no duplicate owner cards
[ ] EVIDENCE-001 note preserved
[ ] SOFA-001 note preserved
[ ] TEST-001 note preserved
[ ] current overlay B34-001 preserved
[ ] navigation clear
[ ] registry checker PASS
[ ] link checker PASS
[ ] validation fast PASS
[ ] git diff --check PASS
```

---

# 79. Mandatory modularization review

```text
modularization_reviewed: true
split_required: true
proposed_files:
  - implementazioni/audit-documentazione/02-moduli-frontend-python/01-moduli-owner-b3.md
  - implementazioni/audit-documentazione/02-moduli-frontend-python/02-frontend-python-b4.md
```

Il file:

```text
implementazioni/audit-documentazione/02-moduli-frontend-python.md
```

resta facade.

---

# 80. Non cambia il totale canonico

I file proposti
vivono sotto:

```text
implementazioni/
```

Sono registry modules,
non documentazione tecnica canonica.

---

# 81. Current evidence — DOC-014

Document:

```text
modules/sofa/01-live-tracking.md
```

continua a dire:

```text
technical sample
→ no getBetfairTrackingKey.
```

Code:

```text
key = getKeyFn(...)
→ classify...
```

Finding open.

---

# 82. Current evidence — DOC-015

Tracking Live e Storage
mantengono molte
cross-domain invariants.

Finding open.

---

# 83. Current evidence — DOC-016

Code:

```text
addBetfairUpdate
→ compatibility facade
→ prepareBetfairHistory.
```

Docs:

```text
API pubblica:
addBetfairUpdate
```

senza formula prepare-only
esplicita.

Finding open/partial.

---

# 84. Current evidence — DOC-017

Market Reactions:

```text
consuma snapshot Evidence
già costruiti.
```

Finding open.

---

# 85. Current evidence — DOC-018

Polling/View Model:

```text
wiring corrente
solo parziale.
```

Betfair/UI:

```text
integrity non ricevuta
come prop dedicata.
```

Finding documentale resolved.

---

# 86. Current evidence — DOC-019

Python doc:

```text
campi diagnostici
redatti prima backend.
```

Code:

```text
network_capture.dump_dir
→ local path.
```

Finding open.

---

# 87. B4 frontend findings non diventano nuovi DOC-ID

Il child contiene anche:

```text
Start failure
polling lifecycle
Source Identity legacy
mojibake.
```

Queste root issue
sono già:

```text
FRONTEND-003
FRONTEND-001/005
CLEANUP-001
FRONTEND-004.
```

Non duplicare.

---

# 88. B4 Python findings non diventano nuovi SECURITY-ID

Già:

```text
SECURITY-001
SECURITY-002
SECURITY-003.
```

---

# 89. SOFA-001 resta live-only

B3 dice:

```text
ultimo game PBP
→ resta da validare live.
```

Todo corrente
mantiene:

```text
SOFA-001
→ DA VERIFICARE LIVE.
```

Nessun drift.

---

# 90. TEST-001 resta aperto

B3 dice:

```text
status-only
→ test dedicato ancora aperto.
```

Todo:

```text
TEST-001
→ MANCANTE.
```

Coerente.

---

# 91. EVIDENCE-001 decisione non va risolta dentro questo file

Il checkpoint presentava:

```text
A selectionId mandatory
B name fallback degraded.
```

La decisione successiva
è già:

```text
DEC-010
→ selectionId obbligatorio
→ implementation missing.
```

Questa supersession
è già owned nei registri
e non richiede
un nuovo decision finding qui.

---

# 92. Se si tocca la sezione EVIDENCE-001, aggiungere solo pointer

Possibile nota:

```text
Decisione successiva:
DEC-010 approvata.

Implementazione:
ancora EVIDENCE-001 open.
```

Non riaprire
la domanda A/B.

---

# 93. Coordinamento con report 053

`AUDIT-CODE-P1-001`
possiede supersession
nel diverso audit-codice
`01-rilievi-iniziali`.

Non duplicarlo.

---

# 94. Coordinamento con report 060

`DOC-AUDIT-P12-001`
possiede B1/B2.

`DOC-AUDIT-B34-001`
possiede B3/B4.

Boundary chiaro.

---

# 95. Coordinamento con DOC-AUDIT-IDX-001

Index problem:

```text
facade 02 sembra globale
ma è storico B1–B6.
```

Child problem:

```text
stati current
dei finding specifici.
```

Non duplicati.

---

# 96. Coordinamento con WORKFLOW-005

La migrazione
è completata.

Non riaprirla.

---

# 97. Coordinamento con IMPL-032

La migrazione `.mdx → .md`
è già completed.

I nuovi task
sono registry cleanup,
non migration implementation.

---

# 98. Non usare P12/B34 reconciliation per riscrivere il codice

Queste task
devono modificare:

```text
registri/documentazione audit
```

non:

```text
trackerUpdate
frontend hooks
network capture.
```

Gli owner tecnici
restano separati.

---

# 99. Non chiudere un DOC perché il codice è ancora sbagliato se la documentazione è stata corretta

Esempio:

```text
DOC-018
→ docs accurate
FRONTEND-002
→ code/UI gap open.
```

Owner lifecycle indipendenti.

---

# 100. Non tenere un DOC aperto soltanto come reminder del bug code

Questo crea:

```text
double ownership.
```

La Todo deve indicare
l’owner tecnico corretto.

---

# 101. Non chiudere un DOC se il documento continua a fare l’overclaim

Esempi:

```text
DOC-014
DOC-017
DOC-019.
```

Questi restano
documentary mismatches current.

---

# 102. DOC-015 richiede una futura riduzione, non una perdita di invarianti

Quando si riduce
la duplicazione:

```text
owner detail
→ resta nel modulo owner

consumer doc
→ breve precondition
→ link.
```

Non eliminare
l’invariante dal progetto.

---

# 103. DOC-016 richiede precisione sulla facade legacy

Formula raccomandata:

```text
addBetfairUpdate(...)
→ compatibility facade
→ prepara soltanto
  il documento history
→ non esegue
  il canonical Betfair commit.

Canonical commit:
processor/persistence.js.
```

---

# 104. DOC-017 richiede precisione sull’input, non un cambio architetturale

Non modificare
Market Reactions per farla
consumare davvero
uno snapshot completo
solo per allinearsi
alla vecchia documentazione.

Correggere il documento.

---

# 105. DOC-019 richiede boundary reale prima di strong claim

Finché esistono:

```text
dump_dir
raw-ish error details
cache key concern
```

la doc deve usare
claim bounded.

---

# 106. Stato finale owner proposto

```text
DOC-014
checkpoint: CONFERMATO
current: CONFERMATO

DOC-015
checkpoint: CONFERMATO
current: CONFERMATO / partially improved

DOC-016
checkpoint: CONFERMATO
current: CONFERMATO / partially improved

DOC-017
checkpoint: CONFERMATO
current: CONFERMATO

DOC-018
checkpoint: CONFERMATO
current: RISOLTO LATO DOCUMENTAZIONE
implementation owner: FRONTEND-002 open

DOC-019
checkpoint: CONFERMATO
current: CONFERMATO.
```

---

# 107. Nuovi finding

```text
DOC-AUDIT-B34-001
DOC-AUDIT-B34-002
```

---

# 108. Nuove task runtime

```text
0
```

---

# 109. Nuove task documentali

```text
2
```

---

# 110. Riscrittura

```text
full_rewrite_required: false
targeted_revision_required: true
```

---

# 111. Mandatory modularization block

```text
modularization_reviewed: true
split_required: true
proposed_files:
  - implementazioni/audit-documentazione/02-moduli-frontend-python/01-moduli-owner-b3.md
  - implementazioni/audit-documentazione/02-moduli-frontend-python/02-frontend-python-b4.md
```

---

# 112. Decisione finale

```text
implementazioni/audit-documentazione/02-moduli-frontend-python.md:

ROLE:
VALIDO COME RECORD B3/B4

BASELINE:
ESPLICITA

TEST:
LETTI, NON ESEGUITI

CURRENT DOC-014:
APERTO

CURRENT DOC-015:
APERTO

CURRENT DOC-016:
APERTO / PARZIALMENTE MIGLIORATO

CURRENT DOC-017:
APERTO

CURRENT DOC-018:
RISOLTO LATO DOCUMENTAZIONE

CURRENT DOC-019:
APERTO

FRONTEND-002:
APERTO

SECURITY-001/002/003:
APERTI

NUOVI BUG:
0

NUOVI FINDING:
2

CHANGE ID:
DOC-AUDIT-B34-001
DOC-AUDIT-B34-002

RISCRITTURA COMPLETA:
NO

REVISIONE MIRATA:
SÌ

MODULARIZZAZIONE:
SÌ
```

---

# 113. Stato audit dopo report 061

```text
Documenti Markdown totali: 72
Analizzati: 61
Da analizzare: 11
Avanzamento: 84,72%
```

Sequenza corrente:

```text
[✓] 058 implementazioni/audit-codice/06-validazione-e-test.md
[✓] 059 implementazioni/audit-codice/07-post-audit-e-migrazione.md
[✓] 060 implementazioni/audit-documentazione/01-rilievi-iniziali-e-api.md
[✓] 061 implementazioni/audit-documentazione/02-moduli-frontend-python.md
[ ] 062 implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md
```

Nuove task non ancora consolidate:

```text
058 → 1
059 → 1
060 → 2
061 → 2

totale non consolidato:
6
```

Contatori:

```text
task note consolidate fino al report 057:
330

report 058:
+1

report 059:
+1

report 060:
+2

report 061:
+2

task complessive note provvisorie:
336
```

---

# 114. Stato mappa / JSON

```text
mappa-file-markdown-repository-continuazione-048.md
→ NON MODIFICATA

modifiche-audit-markdown-continuazione-048.json
→ NON MODIFICATO
```

Change ID non ancora consolidati:

```text
AUDIT-CODE-P7-001
AUDIT-CODE-POST-001
DOC-AUDIT-P12-001
DOC-AUDIT-P12-002
DOC-AUDIT-B34-001
DOC-AUDIT-B34-002
```

---

# 115. Prossimo documento — NON ANALIZZATO

```text
062
implementazioni/audit-documentazione/03-operations-roadmap-e-controlli.md
```

In questa esecuzione:

```text
NON aperto
NON analizzato
NON anticipato.
```

---

# 116. Stop operativo

```text
report 061:
COMPLETATO

nuovi Change ID:
DOC-AUDIT-B34-001
DOC-AUDIT-B34-002

ZIP:
CREATO

mappa:
NON TOCCATA

JSON:
NON TOCCATO

documento 062:
NON ANALIZZATO
```

## Esito applicazione e verifica semantica

- Task completate in questa revisione: `DOC-AUDIT-B34-001`.
- Task ancora aperte: `DOC-AUDIT-B34-002`.
- Stato determinato sul contenuto corrente e sugli owner collegati; gli snapshot storici non sono stati riscritti retroattivamente.
