# Report documentale — `docs/tennis-decision-ui/api/03-evidence.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-007
Sequenza audit: 07/72
Documento analizzato: 03-evidence.md
Percorso documento: docs/tennis-decision-ui/api/03-evidence.md
Percorso report: Report documentale/07 - 03-evidence.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
Dimensione documento: 589 righe
Ruolo dichiarato: contratto HTTP del router Evidence
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/routes/evidence.js`;
- `backend/src/routes/evidence/evidenceResponses.js`;
- `backend/src/sofa/matchEvidence.js`;
- `backend/src/sofa/matchEvidence/latestMatchEvidence.js`;
- `backend/src/sofa/matchEvidence/evidenceBuilder.js`;
- `backend/src/sofa/matchEvidence/dataQuality.js`;
- `backend/src/sofa/matchEvidence/noTradeReasons.js`;
- `backend/src/sofa/matchEvidence/sourceIdentityConfirmation.js`;
- `backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js`;
- `backend/src/sofa/sourceIdentityGate.js`;
- `backend/src/sofa/sourceIdentityGate/status.js`;
- `backend/src/sofa/sourceIdentityGate/manualConfirmation.js`;
- `backend/src/sofa/timelineStore.js`;
- i test route, Evidence, Source Identity e bootstrap disponibili nel commit;
- gli owner documentali:
  - `modules/evidence/01-match-evidence-snapshot.md`;
  - `modules/evidence/02-source-identity.md`;
  - `modules/evidence/03-quality-flow-and-alignment.md`;
  - `modules/evidence/04-market-reactions.md`.

I due file mappa non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale con il progetto: MEDIO-ALTA
Endpoint mancanti dalla tabella: 0
Endpoint documentati ma non presenti: 0
Contratti o esempi non coerenti col codice: 3
Omissioni rilevanti del contratto pubblico: 5
Rischi di sicurezza o classificazione errori: 3
Modifiche proposte: 10
Necessità di riscrittura completa: SÌ
Necessità di modularizzazione: SÌ
```

Il documento censisce correttamente i tre endpoint:

```text
GET    /api/evidence/:eventId/latest
POST   /api/evidence/:eventId/source-identity/confirm
DELETE /api/evidence/:eventId/source-identity/confirm
```

Sono sostanzialmente corretti:

- la separazione fra lettura Evidence e persistenza canonica;
- l’assenza di recovery e scritture journal nella route;
- la forma aggregata di `integrity`;
- la priorità `recovery_failed → partial_persistence → no_known_partial`;
- `persistenceComplete`;
- la sospensione dell’uso cross-source;
- la preservazione della freshness tecnica;
- la conferma gate-aware;
- il fallback basato sulle timeline;
- la revoca contestuale;
- l’idempotenza della revoca senza record applicabile.

Le criticità principali sono:

1. gli esempi usano `commit_incomplete`, ma il producer aggregato usa `pending_commit`;
2. `sofaTimelineFound` e `betfairTimelineFound` indicano la presenza di entry, non la semplice esistenza del file;
3. missing, file illeggibile e JSON invalido vengono collassati allo stesso risultato;
4. il `500` latest espone `details` con il messaggio raw;
5. errori di persistenza o bootstrap del gate vengono classificati come `400` di validazione;
6. la conferma gate-aware viene salvata prima del bootstrap e può restare persistita dopo un bootstrap fallito;
7. un errore di lettura del confirmation store durante latest viene trattato silenziosamente come assenza di conferma;
8. la validazione `eventId` è soltanto trim/non-vuoto, pur alimentando lookup filesystem;
9. la sezione Verifica usa percorsi monolitici non più presenti e non copre l’intero router;
10. il documento duplica estensivamente responsabilità già possedute dai moduli Evidence.

---

# 1. Scopo, struttura e superficie HTTP

## Esito: coerente

Il router è correttamente identificato:

```text
backend/src/routes/evidence.js
```

La tabella degli endpoint corrisponde alle route registrate.

La struttura dei moduli principali è sostanzialmente corretta:

```text
evidence.js
latestMatchEvidence.js
evidenceBuilder.js
dataQuality.js
noTradeReasons.js
matchHistory.js
```

Il documento distingue correttamente:

```text
lettura latest
→ read-only rispetto a timeline, history e journal

conferma/revoca
→ scrivono soltanto il confirmation store
```

La frase iniziale:

```text
Non crea tick, non modifica history o timeline, non avvia tracking o
scraper, non esegue recovery e non scrive journal.
```

è corretta per tutte le route.

Va però precisato che POST e DELETE possono modificare:

```text
source_identity_confirmations.json
```

Questa precisazione deve comparire già nello scopo, non soltanto nelle sezioni successive.

La modifica può essere inclusa in `EVIDENCE-API-010`.

---

# 2. Validazione `eventId`

## Esito: coerente col codice, ma insufficiente come confine

Il documento descrive correttamente il comportamento attuale:

```text
stringa
→ trim
→ non vuota
```

Il response builder restituisce:

```http
HTTP 400
```

```json
{
  "ok": false,
  "error": "Missing or invalid eventId"
}
```

La validazione avviene prima delle letture specifiche della route.

Il problema è che il valore validato viene poi passato a:

```text
loadTimeline('sofa', eventId)
loadTimeline('betfair', eventId)
```

`timelineStore` usa `eventId` nella discovery e nella costruzione del nome del file.

Il contratto corrente non rifiuta:

- separatori di percorso;
- caratteri di controllo;
- sequenze di traversal;
- valori eccessivamente lunghi;
- formati estranei agli ID supportati dal progetto.

Non è dimostrato dal solo documento che un client possa ottenere contenuti arbitrari, ma il confine è più permissivo del necessario e alimenta direttamente operazioni filesystem.

## Finding `EVIDENCE-API-001` — validazione `eventId` da centralizzare e restringere

**Priorità:** alta  
**Tipo:** hardening input/filesystem

### Modifica consigliata

Creare o usare un validator canonico condiviso fra:

```text
API Match
API Betfair
API Evidence
storage reader
```

Il validator deve almeno:

- accettare soltanto il formato esplicitamente supportato;
- rifiutare `/`, `\`, caratteri di controllo e segmenti di traversal;
- applicare una lunghezza massima;
- preservare gli ID sintetici necessari ai test solo se approvati;
- produrre un errore pubblico bounded.

Non fissare nel documento una regex definitiva prima di verificare tutti i consumer e le fixture.

### Aggiornamento documentale

Sostituire la formula:

```text
stringa non vuota dopo trim
```

con il contratto effettivamente approvato dopo la modifica.

Se il runtime non viene ancora cambiato, dichiarare esplicitamente il limite corrente.

---

# 3. Flusso latest Evidence

## Esito: concetto corretto, ordine descritto in modo semplificato

Il documento mostra:

```text
lettura integrity Sofa
→ lettura integrity Betfair
→ buildLatestMatchEvidence
```

Nel codice pubblico la route chiama:

```js
buildLatestMatchEvidence(eventId)
```

e il builder:

1. carica le timeline;
2. legge integrity Sofa e Betfair;
3. costruisce lo stato Source Identity;
4. legge eventualmente la conferma persistita;
5. costruisce Evidence.

Non è necessario documentare l’ordine interno come se la route leggesse direttamente integrity.

### Correzione editoriale

Usare:

```text
eventId valido
→ buildLatestMatchEvidence(eventId)
→ lettura timeline e integrity tramite adapter interni
→ costruzione dello snapshot
→ risposta HTTP
```

Questa correzione può essere inclusa in `EVIDENCE-API-010`.

---

# 4. Integrity aggregata

## Esito: struttura corretta, esempio errato

La forma pubblica è corretta:

```text
status
reason
affectedSources
sources.sofa
sources.betfair
```

La normalizzazione è corretta:

- status ammessi;
- source filtrata;
- documenti ammessi;
- priorità di recovery;
- input malformati degradati a `no_known_partial`.

Il documento usa però:

```json
{
  "status": "partial_persistence",
  "reason": "commit_incomplete"
}
```

Il builder aggregato usa:

```js
status = 'partial_persistence'
reason = 'pending_commit'
```

quando esiste un conflitto senza `recovery_failed`.

## Finding `EVIDENCE-API-002` — reason `commit_incomplete` non canonica

**Priorità:** alta  
**Tipo:** payload pubblico errato

### Modifica richiesta

Sostituire in tutti gli esempi:

```diff
-"reason": "commit_incomplete"
+"reason": "pending_commit"
```

Definire:

```text
status aggregato partial_persistence
→ reason aggregata pending_commit

status aggregato recovery_failed
→ reason aggregata recovery_failed
```

Le reason source-specific restano nei blocchi:

```text
integrity.sources.sofa.reason
integrity.sources.betfair.reason
```

e possono contenere la reason normalizzata dal rispettivo adapter.

---

# 5. Significato di `sources.*TimelineFound`

## Esito: descrizione non precisa

Il documento afferma:

```text
sources indica la presenza delle timeline persistite
```

Il codice usa:

```js
function hasTimelineEntries(timeline) {
    return !!(
        timeline &&
        Array.isArray(timeline.timeline) &&
        timeline.timeline.length > 0
    );
}
```

Quindi:

```text
file timeline presente con timeline:[]
→ TimelineFound:false
```

Il flag non prova la presenza fisica del documento.

Indica che il loader ha restituito una timeline con almeno una entry.

Lo stesso criterio governa:

```text
state.missing
sources.sofaTimelineFound
sources.betfairTimelineFound
```

## Finding `EVIDENCE-API-003` — flag “found” descritti come presenza del file

**Priorità:** media  
**Tipo:** semantica del payload

### Modifica richiesta

Sostituire:

```text
presenza delle timeline persistite
```

con:

```text
presenza di almeno una entry leggibile nella timeline caricata
```

Aggiungere una matrice:

| Stato del documento | `TimelineFound` |
| --- | --- |
| file assente | `false` |
| file illeggibile o JSON invalido | `false` |
| timeline mancante/non-array, normalizzata a `[]` | `false` |
| timeline vuota | `false` |
| almeno una entry | `true` |

Valutare in futuro nomi più espliciti:

```text
sofaTimelineHasEntries
betfairTimelineHasEntries
```

La rinomina cambierebbe il contratto frontend e richiede verifica dei consumer.

---

# 6. Missing e failure di lettura

## Esito: condizioni tecniche collassate

`loadTimeline` restituisce `null` quando:

- il file non esiste;
- la discovery fallisce;
- la lettura fallisce;
- il JSON è invalido.

Evidence non riceve un read result strutturato.

Il comportamento può quindi essere:

```text
entrambe le letture → null
→ 404 No timeline data found for this event
```

anche quando il problema è un errore di lettura o parsing.

Se una sola fonte è leggibile e contiene entry, latest può comunque costruire un `200`.

## Finding `EVIDENCE-API-004` — `404` e reason non distinguono missing da corruzione

**Priorità:** alta  
**Tipo:** semantica degli errori

### Correzione documentale minima

Sostituire:

```text
nessuna timeline
```

con:

```text
nessuna timeline con entry leggibili restituita dai loader
```

Dichiarare:

```text
nel codice corrente missing, discovery failure, read failure e JSON
invalido possono essere collassati a null
```

### Correzione tecnica futura

Introdurre un risultato strutturato condiviso:

```text
found
missing
invalid_json
read_failed
discovery_failed
```

Evidence deve poi decidere esplicitamente:

- quando restituire `404`;
- quando restituire `500`;
- come combinare failure di una fonte e successo dell’altra;
- come preservare `integrity`;
- quali reason pubbliche bounded esporre.

La modifica deve essere coordinata con:

```text
MATCH-API-005
BETFAIR-API-004
```

---

# 7. Status HTTP latest e risposta `404`

## Esito: status principali corretti, esempio incompleto

Il contratto storico è corretto:

```text
400 input invalido
404 nessuna fonte con entry
500 eccezione del builder
200 snapshot costruito
```

È corretto che Evidence non introduca:

```text
409 persistence_integrity
```

e che il `404` possa includere `integrity`.

L’esempio `404` non mostra però tutti i campi effettivi:

```text
eventId
reasons
```

La route restituisce:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "error": "No timeline data found for this event",
  "reasons": [],
  "integrity": {}
}
```

Le reason sono normalmente valorizzate quando entrambe le fonti non hanno entry.

### Modifica richiesta

Correggere l’esempio insieme a `EVIDENCE-API-002`, `003` e `004`.

---

# 8. Errore interno latest

## Esito: confine di redazione contraddittorio

In caso di eccezione, la route restituisce:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "error": "Failed to build match evidence snapshot",
  "details": "<error.message>"
}
```

Il documento lo riconosce, ma successivamente afferma che il router non espone:

```text
path filesystem
dettagli interni
```

La garanzia non è implementata.

`error.message` può contenere:

- path locali;
- dettagli del confirmation store;
- messaggi filesystem;
- dettagli di dipendenze;
- valori non destinati al frontend.

## Finding `EVIDENCE-API-005` — `details` raw incompatibile con i confini dichiarati

**Priorità:** alta  
**Tipo:** redazione del contratto pubblico

### Modifica tecnica consigliata

Rimuovere `details` dal body pubblico.

Usare un payload bounded:

```json
{
  "ok": false,
  "eventId": "<eventId>",
  "code": "evidence_build_failed",
  "error": "Failed to build match evidence snapshot"
}
```

Il dettaglio interno deve essere registrato tramite logging redatto e reason code.

### Test richiesti

Aggiungere casi con eccezioni contenenti:

- path Windows;
- path POSIX;
- URL;
- token;
- stack;
- oggetti non `Error`.

Il body non deve contenerli.

---

# 9. Lettura della conferma durante latest

## Esito: failure silenziosa

Quando Source Identity automatica è `pending`, latest prova a leggere una conferma applicabile.

Il codice:

```js
const lookup = findApplicableSourceIdentityConfirmation(context);
return lookup.ok ? lookup.confirmation : null;
```

e in caso di eccezione:

```js
return null;
```

Quindi:

```text
store assente e vuoto
store corrotto
read failure
errore inatteso
```

possono essere trattati nello stesso modo dal latest builder:

```text
nessuna conferma applicabile
```

Lo snapshot può restare `pending` senza indicare che la conferma non è stata letta.

## Finding `EVIDENCE-API-006` — confirmation store failure nascosta nel latest

**Priorità:** media  
**Tipo:** osservabilità e fail-closed

### Decisione richiesta

Scegliere esplicitamente fra:

### Opzione A — fail closed visibile

Aggiungere un indicatore bounded:

```text
confirmationStoreStatus:
- ok
- unavailable
```

oppure una reason data quality.

### Opzione B — errore HTTP

Restituire `500` quando il confirmation store non è leggibile.

### Opzione C — comportamento corrente documentato

Continuare a trattare il failure come assenza di conferma, dichiarandolo chiaramente.

L’opzione corrente è fail-closed rispetto all’allineamento, ma non è osservabile.

Non esporre path o dettagli del file.

---

# 10. Conferma gate-aware: mapping degli errori

## Esito: errori server classificati come validazione client

`buildManualConfirmationValidationResponse` assegna:

```text
confirmation_context_incomplete
→ 422

automatic_identity_not_pending
→ 409

qualsiasi altro codice
→ 400
```

`confirmGateSession` può restituire:

```text
confirmation_text_invalid
selected_pairs_invalid
invalid_phase
session_not_found
persistence_failed
bootstrap_persistence_failed
```

Quindi:

```text
persistence_failed
bootstrap_persistence_failed
session_not_found dopo una race
```

vengono trasformati in:

```http
HTTP 400
```

```json
{
  "error": "Source identity confirmation is invalid"
}
```

Questo presenta una failure server come errore dell’utente.

## Finding `EVIDENCE-API-007` — persistence e bootstrap failure mappate a `400`

**Priorità:** alta  
**Tipo:** classificazione HTTP

### Modifica consigliata

Definire una mappa esplicita:

| Codice interno | HTTP consigliato | Codice pubblico |
| --- | ---: | --- |
| `confirmation_text_invalid` | `400` | `confirmation_text_invalid` o messaggio bounded |
| `selected_pairs_invalid` | `400` | `selected_pairs_invalid` |
| `confirmation_context_incomplete` | `422` | `confirmation_context_incomplete` |
| `automatic_identity_not_pending` | `409` | `automatic_identity_not_pending` |
| `invalid_phase` | `409` o `400` deciso esplicitamente | `confirmation_phase_invalid` |
| `session_not_found` dopo status positivo | `409` | `confirmation_session_changed` |
| `persistence_failed` | `500` | `confirmation_persistence_failed` |
| `bootstrap_persistence_failed` | `500` | `confirmation_bootstrap_failed` |

I messaggi devono restare bounded.

Il frontend deve distinguere:

```text
correggere input
ritentare dopo cambio stato
errore server
```

---

# 11. Persistenza prima del bootstrap

## Esito: sequenza non transazionale con possibile divergenza

Nel gate la sequenza è:

```text
validate
→ upsertSourceIdentityConfirmation
→ applyManualConfirmation
→ onOpenRecording
```

Se il bootstrap fallisce:

```text
phase → pending
error → Bootstrap persistence failed
HTTP corrente → 400 generico
```

Il record di conferma è già stato scritto e non viene revocato.

`buildLatestMatchEvidenceFromTimelines`, quando l’identità automatica è ancora `pending`, può trovare quel record e applicarlo allo snapshot Evidence.

### Inferenza supportata dal codice

È quindi possibile una divergenza:

```text
gate live
→ pending + bootstrap failure

confirmation store
→ record applicabile presente

latest Evidence su timeline persistite
→ Source Identity effective aligned
```

La possibilità dipende dal contesto persistito rimasto applicabile, ma il codice non esegue rollback del record dopo il failure.

Il documento dice correttamente che il bootstrap non è transazionale, ma non esplicita questa conseguenza.

## Finding `EVIDENCE-API-008` — conferma persistita prima della riuscita del bootstrap

**Priorità:** alta  
**Tipo:** consistenza Source Identity

### Decisione tecnica richiesta

Definire la semantica desiderata:

### Strategia 1 — transazione logica

- preparare il record;
- eseguire bootstrap;
- persistere la conferma soltanto dopo bootstrap riuscito;
- gestire il caso in cui la persistenza finale fallisca.

### Strategia 2 — rollback compensativo

- persistere;
- eseguire bootstrap;
- revocare il record se bootstrap fallisce;
- verificare l’esito del rollback.

### Strategia 3 — stato esplicito

Persistenza della conferma con stato:

```text
pending_bootstrap
active
failed
```

Solo `active` è applicabile da latest.

La soluzione deve impedire che gate live e Evidence effective comunichino stati incompatibili senza una reason esplicita.

### Test richiesti

```text
conferma valida + bootstrap fallito
→ record non applicabile

latest dopo bootstrap fallito
→ non diventa aligned

retry autorizzato
→ comportamento definito

rollback fallito
→ failure bounded e osservabile
```

---

# 12. Fallback senza gate

## Esito: contratto sostanzialmente corretto

Il fallback richiede:

- timeline Sofa con entry;
- timeline Betfair con entry;
- identità automatica `pending`;
- context completo;
- due coppie uno-a-uno;
- frase esatta.

Sono corretti gli status principali:

```text
404 timeline/context base assente
409 automatic identity non pending
422 context incompleto
400 mapping o frase
500 store non scrivibile
200 conferma
```

### Precisione necessaria

La formula:

```text
gate assente o non leggibile
```

non è precisa.

Il gate status è in memoria.

Il fallback viene usato quando:

```text
getSourceIdentityGateStatus(eventId)
→ null oppure ok:false
```

Nello stato corrente questo significa principalmente:

```text
nessuna sessione
eventId invalido, già escluso dalla route
```

Non esiste una lettura file del gate che possa essere “non leggibile”.

Correggere la terminologia insieme a `EVIDENCE-API-010`.

---

# 13. Revoca

## Esito: coerente

La revoca:

- non è gate-aware;
- ricostruisce il contesto dalle timeline persistite;
- trova soltanto la conferma applicabile;
- è idempotente se non trova un record;
- non modifica timeline, history, journal o integrity.

Gli status documentati corrispondono alla route.

### Limite da dichiarare

La route richiede entrambe le fonti con entry prima di verificare il confirmation store.

Quindi un record ancora presente può non essere revocabile tramite API se il contesto timeline non è più ricostruibile.

Il documento lo suggerisce con il `404`, ma deve esplicitare:

```text
DELETE non è una cancellazione amministrativa per fingerprint;
è una revoca contestuale del record applicabile al contesto corrente.
```

Questa precisione può essere inclusa in `EVIDENCE-API-010`.

---

# 14. Data quality e degradazione cross-source

## Esito: coerente col codice, ma duplicato rispetto agli owner

Sono corretti:

```text
no_known_partial
→ persistenceComplete true

partial_persistence/recovery_failed
→ persistenceComplete false
```

È corretta la reason standard:

```text
Persistence incomplete: canonical cross-source evidence unavailable
```

È corretta la separazione fra:

```text
freshness tecnica
e
usabilità canonica cross-source
```

È corretto che il builder:

- azzeri il Betfair tick attribuito;
- azzeri lookback e tick downstream;
- renda Market Reactions unavailable;
- mantenga `causalityClaimed:false`;
- preservi Source Identity effective;
- mantenga la qualità tecnica calcolata sul tick Betfair originale.

Il problema è documentale: queste sezioni duplicano quasi integralmente:

```text
modules/evidence/01-match-evidence-snapshot.md
modules/evidence/03-quality-flow-and-alignment.md
modules/evidence/04-market-reactions.md
```

L’API deve descrivere:

- dove appaiono i campi;
- status HTTP;
- shape pubblica;
- invarianti osservabili.

Gli algoritmi e le reason complete devono restare negli owner di modulo.

Questa correzione appartiene a `EVIDENCE-API-010`.

---

# 15. Source Identity nel documento API

## Esito: contratto HTTP utile, lifecycle duplicato

La sezione POST/DELETE è necessaria nell’API.

Il documento replica però:

- fasi del gate;
- semantica del bootstrap;
- contesto e fingerprint;
- applicabilità del record;
- comportamento su cambio epoch;
- stato live.

Queste responsabilità appartengono già a:

```text
modules/evidence/02-source-identity.md
```

Il documento API deve mantenere:

- endpoint;
- body;
- response;
- status;
- error code;
- precondizioni HTTP;
- link all’owner algoritmico.

Non deve diventare un secondo owner del lifecycle Source Identity.

---

# 16. Verifica e test

## Esito: percorsi obsoleti e copertura route insufficiente

Il documento elenca:

```text
sofa/matchEvidence/latestMatchEvidence.test.mjs
sofa/matchEvidence/evidenceBuilder.test.mjs
```

Questi due percorsi monolitici non risultano presenti al commit analizzato.

Sono presenti test modulari, fra cui:

```text
sofa/matchEvidence/latestMatchEvidence/manualConfirmation.test.mjs
sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
sofa/sourceIdentityGate/bootstrapFailures.test.mjs
```

Restano presenti anche:

```text
sofa/matchEvidence/dataQuality.test.mjs
sofa/matchEvidence/noTradeReasons.test.mjs
sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
```

Il test route corrente copre:

- eventId invalido;
- gate collecting;
- gate mismatch.

Non dimostra direttamente l’intero contratto HTTP descritto nel documento:

- latest `200`;
- latest `404`;
- latest `500` redatto;
- conferma fallback `200/400/409/422/500`;
- persistence/bootstrap failure gate-aware;
- revoke `200/404/500`;
- confirmation store corrupt;
- race fra status gate e conferma;
- rollback o stato della conferma dopo bootstrap fallito.

## Finding `EVIDENCE-API-009` — sezione Verifica non allineata e route coverage parziale

**Priorità:** alta  
**Tipo:** verificabilità del contratto

### Modifica richiesta

Sostituire i percorsi monolitici con i test modulari realmente presenti.

Aggiungere syntax check:

```bash
node --check routes/evidence.js
node --check routes/evidence/evidenceResponses.js
node --check sofa/matchEvidence/latestMatchEvidence.js
node --check sofa/matchEvidence/evidenceBuilder.js
node --check sofa/sourceIdentityGate/manualConfirmation.js
```

Ampliare i test route con dependency injection o con response builder separati.

### Nota strutturale

`evidence.js` importa direttamente dipendenze concrete, rendendo più difficile isolare route success, 404 e failure.

Valutare l’estrazione di response builder per:

```text
latest
fallback confirmation
revoke
```

senza spostare logica algoritmica nella route.

---

# 17. Lunghezza, compiti e integrità del contesto

## Valutazione

```text
Righe: 589
Endpoint: 3
Responsabilità HTTP principali: 2
Owner algoritmici duplicati: almeno 4
Contesto minimo comune: medio-basso
Rischio di divergenza documentale: alto
Suddivisione per sola lunghezza: no
Modularizzazione per responsabilità: sì
```

Il documento contiene due contratti HTTP separabili:

## Responsabilità A — latest Evidence

```text
GET latest
wrapper
status
integrity
sources
missing
data quality osservabile
degradazione cross-source osservabile
```

## Responsabilità B — conferma e revoca

```text
POST confirm
gate-aware
fallback
validation
persistence
bootstrap
DELETE revoke
confirmation store
```

Inoltre replica dettagli già posseduti dai moduli Evidence.

---

# 18. Modularizzazione consigliata

## Struttura proposta

```text
docs/tennis-decision-ui/api/
├── 03-evidence.md
└── evidence/
    ├── 01-latest-snapshot.md
    └── 02-source-identity-confirmation.md
```

## `api/03-evidence.md`

Deve restare come facade:

- scopo;
- mount;
- tabella completa degli endpoint;
- validazione comune;
- principi di sicurezza;
- link ai due contratti specifici;
- matrice sintetica degli status;
- matrice sintetica dei test.

Target consigliato:

```text
circa 100–160 righe
```

## `api/evidence/01-latest-snapshot.md`

Owner del contratto HTTP:

- `GET latest`;
- wrapper `ok/eventId/latest/sources/integrity`;
- `200/404/500`;
- semantica dei flag;
- reason aggregate;
- redazione;
- confirmation store status osservabile;
- link agli owner algoritmici.

Non deve duplicare la costruzione completa di:

- dataQuality;
- alignment;
- Market Reactions;
- Source Identity algorithm.

## `api/evidence/02-source-identity-confirmation.md`

Owner del contratto HTTP:

- POST conferma;
- DELETE revoca;
- body;
- status;
- code;
- gate-aware/fallback;
- failure persistence/bootstrap;
- idempotenza;
- confini del confirmation store;
- link a `modules/evidence/02-source-identity.md`.

## Contenuto da lasciare agli owner esistenti

```text
algoritmo snapshot
→ modules/evidence/01-match-evidence-snapshot.md

Source Identity e bootstrap
→ modules/evidence/02-source-identity.md

qualità e alignment
→ modules/evidence/03-quality-flow-and-alignment.md

Market Reactions
→ modules/evidence/04-market-reactions.md
```

Non creare nuovi documenti che replichino questi algoritmi.

---

# Riferimenti per le mappe

```text
Report ID: TDUI-DOC-REPORT-007
Percorso report: Report documentale/07 - 03-evidence.md
Documento: docs/tennis-decision-ui/api/03-evidence.md
Change ID: EVIDENCE-API-001
Change ID: EVIDENCE-API-002
Change ID: EVIDENCE-API-003
Change ID: EVIDENCE-API-004
Change ID: EVIDENCE-API-005
Change ID: EVIDENCE-API-006
Change ID: EVIDENCE-API-007
Change ID: EVIDENCE-API-008
Change ID: EVIDENCE-API-009
Change ID: EVIDENCE-API-010
Suddivisione richiesta: sì
Nuovi file proposti:
- docs/tennis-decision-ui/api/evidence/01-latest-snapshot.md
- docs/tennis-decision-ui/api/evidence/02-source-identity-confirmation.md
```

I due file mappa dovranno registrare in futuro:

- riferimento al report;
- dieci task con checkbox;
- stato di modularizzazione;
- due nuovi file proposti.

Non sono stati aggiornati durante questa analisi.

---

# Modifiche proposte

## `EVIDENCE-API-001` — rafforzare la validazione `eventId`

**Priorità:** alta

**Azione:**

- definire un validator canonico;
- rifiutare separatori, traversal, controlli e lunghezze non ammesse;
- coordinare API e storage;
- aggiornare test e documentazione.

**File potenzialmente coinvolti:**

```text
backend/src/routes/evidence/evidenceResponses.js
backend/src/sofa/timelineStore.js
validator condiviso
test route e storage
docs/tennis-decision-ui/api/03-evidence.md
```

---

## `EVIDENCE-API-002` — correggere `integrity.reason`

**Priorità:** alta

**Azione:**

- sostituire `commit_incomplete` con `pending_commit`;
- distinguere reason aggregata e reason per fonte;
- correggere gli esempi `404` e successo.

**File principale:**

```text
docs/tennis-decision-ui/api/03-evidence.md
```

---

## `EVIDENCE-API-003` — correggere la semantica dei flag timeline

**Priorità:** media

**Azione:**

- dichiarare che i flag richiedono almeno una entry;
- distinguere presenza del file e disponibilità di entry;
- valutare una rinomina pubblica soltanto dopo verifica frontend.

**File principale:**

```text
docs/tennis-decision-ui/api/03-evidence.md
```

---

## `EVIDENCE-API-004` — distinguere missing e failure di lettura

**Priorità:** alta

**Azione:**

- documentare il collasso corrente;
- introdurre eventualmente read result strutturati;
- coordinare Match, Betfair ed Evidence;
- preservare integrity e reason bounded.

**File potenzialmente coinvolti:**

```text
backend/src/sofa/timelineStore.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/routes/evidence.js
frontend consumer
test
documenti API
```

---

## `EVIDENCE-API-005` — rimuovere `details` raw

**Priorità:** alta

**Azione:**

- rimuovere `err.message` dal body;
- aggiungere code pubblico bounded;
- usare logging redatto;
- testare path, URL, token e stack.

**File coinvolti:**

```text
backend/src/routes/evidence.js
backend/src/routes/evidence/evidenceRoute.test.mjs
docs/tennis-decision-ui/api/03-evidence.md
```

---

## `EVIDENCE-API-006` — rendere osservabile il confirmation store failure

**Priorità:** media

**Azione:**

- decidere fail-closed visibile, 500 o comportamento corrente documentato;
- non confondere store corrotto e conferma assente;
- non esporre path o dettagli interni.

**File potenzialmente coinvolti:**

```text
backend/src/sofa/matchEvidence/latestMatchEvidence.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js
test latest Evidence
docs/tennis-decision-ui/api/03-evidence.md
```

---

## `EVIDENCE-API-007` — correggere il mapping degli errori gate

**Priorità:** alta

**Azione:**

- distinguere input, conflitto, race e failure server;
- mappare persistence/bootstrap failure a `500`;
- restituire code pubblici bounded;
- aggiornare frontend e test.

**File coinvolti:**

```text
backend/src/routes/evidence/evidenceResponses.js
backend/src/routes/evidence.js
backend/src/routes/evidence/evidenceResponses.test.mjs
backend/src/routes/evidence/evidenceRoute.test.mjs
docs/tennis-decision-ui/api/03-evidence.md
```

---

## `EVIDENCE-API-008` — rendere coerente conferma e bootstrap

**Priorità:** alta

**Azione:**

- scegliere transazione logica, rollback o stato della conferma;
- impedire l’applicazione del record dopo bootstrap fallito;
- definire retry e failure;
- aggiungere test latest + gate.

**File coinvolti:**

```text
backend/src/sofa/sourceIdentityGate/manualConfirmation.js
backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js
backend/src/sofa/matchEvidence/latestMatchEvidence.js
test Source Identity e bootstrap
documenti owner
```

---

## `EVIDENCE-API-009` — aggiornare test e verificabilità

**Priorità:** alta

**Azione:**

- rimuovere percorsi test monolitici assenti;
- usare test modulari reali;
- coprire tutti gli status delle tre route;
- estrarre response builder dove utile;
- aggiungere syntax check.

**File coinvolti:**

```text
docs/tennis-decision-ui/api/03-evidence.md
backend/src/routes/evidence.js
backend/src/routes/evidence/evidenceResponses.js
test route e modulari
```

---

## `EVIDENCE-API-010` — modularizzare e rimuovere duplicazioni owner

**Priorità:** alta

**Azione:**

- mantenere `03-evidence.md` come facade;
- creare due documenti API specifici;
- lasciare algoritmi e lifecycle ai quattro owner Evidence esistenti;
- aggiornare indice e link;
- precisare scritture del confirmation store, fallback e revoca contestuale.

**File coinvolti:**

```text
docs/tennis-decision-ui/api/03-evidence.md
docs/tennis-decision-ui/api/evidence/01-latest-snapshot.md
docs/tennis-decision-ui/api/evidence/02-source-identity-confirmation.md
docs/tennis-decision-ui/index.md
documenti collegati
```

---

# Ordine consigliato di applicazione

```text
1. decidere il contratto di conferma dopo bootstrap failure;
2. correggere mapping persistence/bootstrap failure;
3. rimuovere details raw;
4. decidere la validazione canonica eventId;
5. decidere missing/read failure;
6. decidere osservabilità del confirmation store;
7. correggere integrity reason e flag timeline;
8. creare la struttura api/evidence/;
9. riscrivere i due owner API;
10. ridurre 03-evidence.md a facade;
11. aggiornare test, indice e link;
12. eseguire checker e suite backend.
```

Le correzioni puramente documentali immediate sono:

```text
EVIDENCE-API-002
EVIDENCE-API-003
parte di EVIDENCE-API-010
```

Le modifiche con impatto runtime sono:

```text
EVIDENCE-API-001
EVIDENCE-API-004
EVIDENCE-API-005
EVIDENCE-API-006
EVIDENCE-API-007
EVIDENCE-API-008
```

`EVIDENCE-API-009` e `010` devono essere coordinate con le modifiche runtime per evitare di riscrivere più volte lo stesso contratto.

---

# Controlli previsti dopo un’eventuale modifica

## Dalla root

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs backend
git diff --check
git diff --name-status
```

## Dalla cartella `backend/src`

```bash
node --check routes/evidence.js
node --check routes/evidence/evidenceResponses.js
node --check sofa/matchEvidence/latestMatchEvidence.js
node --check sofa/matchEvidence/evidenceBuilder.js
node --check sofa/matchEvidence/sourceIdentityConfirmation.js
node --check sofa/matchEvidence/sourceIdentityConfirmationStore.js
node --check sofa/sourceIdentityGate/manualConfirmation.js

node routes/evidence/evidenceResponses.test.mjs
node routes/evidence/evidenceRoute.test.mjs
node sofa/matchEvidence/dataQuality.test.mjs
node sofa/matchEvidence/noTradeReasons.test.mjs
node sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
node sofa/matchEvidence/latestMatchEvidence/manualConfirmation.test.mjs
node sofa/matchEvidence/evidenceBuilder/sourceIdentityGate.test.mjs
node sofa/sourceIdentityGate/bootstrapFailures.test.mjs
```

Aggiungere o aggiornare test per:

```text
latest 200/404/500
details raw assenti
store confirmation corrotto
persistence_failed
bootstrap_persistence_failed
session race
rollback o stato confirmation
eventId con separatori/traversal
missing vs invalid_json/read_failed
revoke completo
```

---

# Decisione finale

```text
03-evidence.md: CONTRATTO UTILE MA DA RISCRIVERE E MODULARIZZARE
Endpoint censiti: completi
Coerenza generale: medio-alta
Integrity reason: da correggere
Semantica timeline flags: da correggere
Missing/read failure: da distinguere o documentare
Errore latest: dettagli raw da rimuovere
Error mapping gate: da correggere
Conferma/bootstrap: consistenza da decidere
Confirmation store failure: non osservabile
Verifica: percorsi e coverage da aggiornare
Riscrittura completa: consigliata
Suddivisione: consigliata per responsabilità
Priorità documentale e tecnica: alta
```

Il file non deve essere diviso soltanto perché ha 589 righe.

La divisione è giustificata perché contiene due contratti HTTP distinti:

```text
latest Evidence
conferma e revoca Source Identity
```

e replica dettagli già posseduti da quattro documenti di modulo.

La soluzione consigliata mantiene `03-evidence.md` come facade, crea due owner API mirati e lascia algoritmi, quality, Source Identity e Market Reactions ai rispettivi owner esistenti.
