# Report documentale — `docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md`

## Identificazione

```text
Report ID: TDUI-DOC-REPORT-016
Sequenza audit: 16/72
Documento analizzato: 01-match-evidence-snapshot.md
Percorso documento: docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md
Percorso report: Report documentale/16 - 01-match-evidence-snapshot.md
Commit analizzato: 4c5f43b007149f3210c27d7565357a447a3a6ef4
SHA documento: a52d9d3c4fa269ccd845484cda4413ef65b3344b
Dimensione documento: 422 righe
Ruolo dichiarato: owner del Match Evidence Snapshot read-only
Stato report: completato
```

Il documento è stato confrontato con:

- `backend/src/sofa/matchEvidence.js`;
- `backend/src/sofa/matchEvidence/latestMatchEvidence.js`;
- `backend/src/sofa/matchEvidence/evidenceBuilder.js`;
- `backend/src/sofa/matchEvidence/dataQuality.js`;
- `backend/src/sofa/matchEvidence/noTradeReasons.js`;
- `backend/src/sofa/matchEvidence/sofaEvidence.js`;
- `backend/src/sofa/matchEvidence/marketEvidence.js`;
- `backend/src/sofa/matchEvidence/timeline.js`;
- `backend/src/sofa/matchEvidence/sourceIdentity.js`;
- `backend/src/sofa/matchEvidence/sourceIdentity/builder.js`;
- `backend/src/sofa/matchEvidence/sourceIdentity/marketEpoch.js`;
- `backend/src/sofa/matchEvidence/sourceIdentityConfirmation.js`;
- `backend/src/sofa/matchEvidence/sourceIdentityConfirmationStore.js`;
- `backend/src/sofa/betfairHealth.js`;
- `backend/src/sofa/betfairHealth/tickQuality.js`;
- `backend/src/sofa/marketReactionEvidence.js`;
- `backend/src/sofa/significantMarketFlowEvidence.js`;
- `backend/src/sofa/significantMarketFlow/candidates.js`;
- `backend/src/sofa/significantMarketFlow/runnerFlow.js`;
- `backend/src/sofa/timelineStore.js`;
- `backend/src/sofa/matchHistory.js`;
- `backend/src/routes/evidence.js`;
- test correnti di `dataQuality`, `noTradeReasons`, `sofaEvidence`, Source Identity epoch e confirmation store;
- i finding già registrati nei report API Evidence e Data Lifecycle.

La mappa Markdown e il JSON incrementale non sono stati modificati.

---

# Esito sintetico

```text
Coerenza generale: ALTA
Read-only boundary del builder: sostanzialmente corretta
Cross-source gating Source Identity: corretto
Persistence integrity gating: corretto
Active Betfair epoch: concetto corretto
Manual confirmation context binding: robusto
Canonicalità degli input timeline: non sufficientemente verificata
Betfair-only behavior: codice e documento divergono
Timeline missing vs read failure: non distinguibili
Confirmation-store read failure: fail-closed ma silenzioso
Confirmation-before-bootstrap: può divergere dal gate live
metadata.updatedAt: semantica ambigua
Verification section: contiene comandi verso test inesistenti
API redaction: non coerente con la promessa documentale
Modifiche proposte: 9
Necessità di riscrittura completa: NO
Necessità di revisione mirata: SÌ
Necessità di modularizzazione: NO
Nuovi documenti canonici proposti: nessuno
```

Il documento descrive bene la filosofia di Evidence:

```text
timeline persistite
→ interpretazione read-only
→ nessuna recovery
→ nessun nuovo dato canonico
→ nessun segnale operativo
→ nessuna causalità dichiarata
```

Sono inoltre corretti:

- `valueHypothesis.enabled:false`;
- Trade on Tennis come placeholder;
- `causalityClaimed:false`;
- separazione fra freshness e persistence integrity;
- degradazione cross-source su `pending`, `mismatch`, `partial_persistence`, `recovery_failed`;
- preservazione della Source Identity effective quando la persistence è incompleta;
- uso dell’active Betfair market epoch;
- conferma manuale vincolata a event, epoch, market, selection IDs e mapping;
- Evidence non owner di journal/recovery;
- Sofa Evidence senza Momentum.

Le criticità principali riguardano **cosa il loader considera realmente una timeline valida** e **come rende osservabili gli errori di lettura**.

---

# 1. “Timeline trovata” non equivale a timeline canonica valida

## Esito: contratto più forte del codice

Il documento parte da:

```text
timeline canoniche già persistite
```

e descrive Evidence come consumer di timeline affidabili.

Nel loader corrente:

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
timeline found
=
array non vuoto
```

Non vengono verificati:

- `source`;
- shape minima del tick;
- `seq` Betfair;
- event identity;
- timestamp;
- runners canonici;
- compatibilità della entry con il file source-specific.

## SofaScore

`getLatestSofaTick()` cerca correttamente l’ultima entry:

```text
data.source === "sofa"
```

ma, se non ne trova nessuna, esegue:

```js
return entries[entries.length - 1] || null;
```

Quindi un file SofaScore non vuoto che contenga soltanto entry di source diversa può comunque produrre:

```text
sofaFound:true
sofaTick:<ultima entry non-Sofa>
```

Il downstream può quindi trattare una entry non canonica come Sofa Evidence.

## Betfair

L’active epoch usa:

```text
marketId + selectionIds
```

oppure:

```text
marketKey + runner names normalizzati
```

come firma.

`buildBetfairIdentitySignature()` non richiede:

```text
data.source === "betfair"
seq canonico
```

La `activeBetfairTick` usata per data quality viene successivamente filtrata da `getLatestValidBetfairTick`, che richiede source Betfair e seq numerico.

Ma la Source Identity automatica usa:

```text
activeBetfairEpoch.lastTick
```

direttamente.

È quindi possibile, in presenza di una entry non canonica ma firmabile, avere:

```text
Source Identity costruita dal tick
ma
activeBetfairTick = null
```

Questa è una differenza di authority fra due parti dello stesso snapshot.

## Finding `EVID-SNAPSHOT-001` — introdurre una canonical input boundary esplicita

**Priorità:** alta  
**Tipo:** canonical data boundary

### Modifica richiesta

Prima di dichiarare:

```text
sofaFound
betfairFound
active epoch
```

definire un criterio canonico minimo per ciascuna source.

### SofaScore

Almeno:

```text
entry object
data object
data.source === sofa
```

Se non esiste una entry Sofa valida:

```text
sofaFound:false
sofaTick:null
```

Nessun fallback verso una entry di altra source.

### Betfair

Prima della selezione epoch stabilire se la timeline deve essere filtrata a:

```text
source === betfair
seq finito
runners array
```

oppure definire esplicitamente un’altra view canonica condivisa.

Il progetto possiede già una nozione di canonical Betfair view in altri owner; evitare una terza definizione incompatibile.

### Test

Aggiungere casi:

```text
Sofa timeline con sola entry source=betfair
Betfair timeline con entry firmabile ma source errata
Betfair seq mancante
Betfair seq NaN/Infinity
entry legacy finale
```

Il risultato deve essere fail-closed rispetto all’attribuzione cross-source.

---

# 2. Il codice supporta Betfair-only, il documento dice il contrario

## Esito: divergenza diretta

Il documento dichiara:

```text
Snapshot Sofa-only
→ supportato
```

e poi:

```text
Se manca anche una timeline SofaScore leggibile,
il loader non può produrre uno snapshot Evidence completo.
```

Il codice corrente usa invece:

```js
if (!sofaFound && !betfairFound) {
    return { missing:true, ... };
}
```

Quindi il loader fallisce come `missing` soltanto quando:

```text
Sofa assente
+
Betfair assente
```

Se esiste Betfair ma non Sofa:

```text
sofaFound:false
betfairFound:true
missing:false
```

e viene costruito:

```text
Evidence ok:true
```

con:

- `sofaEvidence` vuota;
- Source Identity `pending`;
- market attribution bloccata;
- dataQuality con Sofa mancante;
- noTrade reasons.

Il comportamento sembra intenzionalmente degradato e fail-closed, non un crash accidentale.

## Finding `EVID-SNAPSHOT-002` — decidere e documentare il contratto Betfair-only

**Priorità:** alta  
**Tipo:** snapshot availability contract

### Opzione coerente con il codice corrente

Documentare:

```text
Sofa-only
→ snapshot degradato supportato

Betfair-only
→ snapshot degradato supportato

entrambe assenti
→ missing
```

specificando che:

```text
Betfair-only
→ nessuna Sofa Evidence
→ Source Identity pending
→ nessun uso cross-source
→ noTrade reasons
```

### Se invece il prodotto richiede SofaScore obbligatoria

Cambiare il codice e i test:

```text
sofaFound:false
→ missing:true / 404
```

Non lasciare codice e owner con contratti differenti.

---

# 3. Missing, malformed e unreadable timeline vengono collassati

## Esito: limite importante già emerso a livello API

`loadTimeline()`:

- cerca il file;
- se non esiste ritorna `null`;
- se il JSON è invalido ritorna `null`;
- se la lettura fallisce ritorna `null`;
- se il filesystem lookup fallisce può tornare `null`.

Quindi Evidence non distingue:

```text
file assente
file illeggibile
JSON corrotto
errore filesystem
```

Il documento usa formule come:

```text
timeline mancante
timeline leggibile
```

senza rendere esplicito questo limite.

Inoltre:

```text
sources.sofaTimelineFound
sources.betfairTimelineFound
```

non rappresentano realmente:

```text
file esistente
```

ma:

```text
loadTimeline restituisce una timeline con almeno una entry
```

## Finding `EVID-SNAPSHOT-003` — allineare il documento alla read-result semantics

**Priorità:** alta  
**Tipo:** read observability

### Coordinamento

Questa correzione dipende dalla task API già registrata:

```text
EVIDENCE-API-004
```

Non creare un secondo meccanismo di lettura esclusivo di Evidence.

### Stato corrente da documentare

Finché il reader non cambia:

```text
missing
può includere assenza o failure di lettura
```

### Target

Usare un risultato strutturato, per esempio:

```text
found
missing
read_failed
invalid_json
invalid_shape
```

o una shape equivalente condivisa con gli owner storage/API.

Evidence deve degradare in modo osservabile senza tentare recovery.

---

# 4. Confirmation store failure: fail-closed ma invisibile

## Esito: comportamento sicuro ma non osservabile

Quando automatic Source Identity è:

```text
pending
```

Evidence prova a leggere una confirmation persistita.

`getPersistedConfirmation()` esegue:

```js
try {
    const lookup = findApplicableSourceIdentityConfirmation(context);
    return lookup.ok ? lookup.confirmation : null;
} catch (_) {
    return null;
}
```

Quindi:

```text
store assente
→ null

nessuna confirmation applicabile
→ null

store corrotto
→ null

errore lettura
→ null

exception
→ null
```

Tutti questi casi diventano indistinguibili nello snapshot.

Il comportamento è fail-closed:

```text
nessuna confirmation
→ Source Identity resta pending
```

ma l’operatore non può sapere se:

```text
non esiste una conferma
oppure
la conferma non è stata letta
```

## Finding `EVID-SNAPSHOT-004` — rendere osservabile il fallimento del confirmation store

**Priorità:** alta  
**Tipo:** read-only observability

### Coordinamento

Riutilizzare:

```text
EVIDENCE-API-006
```

come task runtime owner.

### Contratto snapshot consigliato

Non applicare mai una confirmation se la lettura non è affidabile.

Ma aggiungere una reason bounded, per esempio:

```text
Source identity confirmation store unavailable
```

oppure un blocco diagnostico non sensibile.

### Non esporre

- path file;
- stack;
- JSON raw;
- contenuto archive;
- fingerprint non necessario;
- dettagli filesystem.

---

# 5. Confirmation persistita può divergere dal gate live dopo bootstrap fallito

## Esito: gap cross-layer critico

Il documento distingue correttamente:

```text
gate live
da
Source Identity effective nello snapshot
```

ma non registra il gap più importante del percorso manual confirmation.

Nel lifecycle corrente la confirmation può essere persistita prima che il bootstrap recording abbia avuto successo.

Se il bootstrap fallisce:

```text
gate live
→ può tornare pending

confirmation store
→ record resta persistito
```

Evidence non legge il gate live.

Ricostruisce il contesto dalle timeline e, se la confirmation è ancora applicabile, può trasformare:

```text
automatic pending
→ effective aligned
```

Questo può riabilitare:

```text
crossSourceAllowed
```

nello snapshot anche quando il gate live non ha completato con successo il bootstrap.

Il documento contiene già la frase generale:

```text
snapshot e gate live sono authority diverse
```

ma non espone questa specifica divergenza corrente.

## Finding `EVID-SNAPSHOT-005` — documentare e risolvere confirmation-before-bootstrap

**Priorità:** critica  
**Tipo:** live/persisted authority consistency

### Coordinamento obbligatorio

Non duplicare l’implementazione.

Usare le task già registrate:

```text
EVIDENCE-API-008
DATA-LIFE-004
```

### Nel documento corrente

Aggiungere temporaneamente:

```text
Una confirmation persistita può oggi sopravvivere a un bootstrap
fallito; Evidence può quindi ricostruire un effective aligned mentre
il gate live è tornato pending.

Questo è un gap noto e non deve essere interpretato come prova che il
gate live sia recording.
```

### Target

Una sola soluzione owner, per esempio:

- persist-after-bootstrap;
- rollback compensativo;
- stato confirmation `pending_bootstrap / active / failed`.

Il documento snapshot non deve scegliere autonomamente quale implementare.

---

# 6. `metadata.updatedAt` è tempo di costruzione, non tempo dell’ultimo dato

## Esito: naming ambiguo

`evidenceBuilder.js` crea:

```js
metadata: {
    ...
    updatedAt: now.toISOString()
}
```

Quindi:

```text
metadata.updatedAt
```

è il timestamp di costruzione dello snapshot.

Non è:

- timestamp dell’ultimo Sofa tick;
- timestamp dell’ultimo Betfair tick;
- timestamp dell’ultimo commit;
- updatedAt del file timeline;
- timestamp della Source Identity;
- timestamp dell’ultimo dato cross-source valido.

Il documento definisce `metadata` come:

```text
Event ID, giocatori e timestamp di aggiornamento
```

che può essere letto come freshness del dato.

## Finding `EVID-SNAPSHOT-006` — chiarire il timestamp di snapshot

**Priorità:** media  
**Tipo:** temporal semantics

### Soluzione minima

Documentare:

```text
metadata.updatedAt
→ momento in cui Evidence è stata costruita
```

### Soluzione più chiara

Valutare un nome/additive field:

```text
computedAt
```

mantenendo `updatedAt` per compatibilità se già consumato.

La freshness delle fonti resta nei campi `dataQuality` / alignment e non deve essere inferita da `metadata.updatedAt`.

---

# 7. La sezione Verifica punta a due test inesistenti

## Esito: contratto di verifica non eseguibile integralmente

Il documento prescrive:

```text
node sofa/matchEvidence/latestMatchEvidence.test.mjs
node sofa/matchEvidence/evidenceBuilder.test.mjs
```

Sul commit auditato entrambi i path risultano assenti.

Esistono invece, fra gli altri:

```text
sofa/matchEvidence/dataQuality.test.mjs
sofa/matchEvidence/noTradeReasons.test.mjs
sofa/matchEvidence/sofaEvidence.test.mjs
sofa/matchEvidence/sourceIdentity/marketEpoch.test.mjs
sofa/matchEvidence/sourceIdentityConfirmation.test.mjs
```

Quindi la sezione di verifica sovrastima la presenza di una coverage diretta del composer principale.

## Gap particolarmente importanti

Manca una prova diretta documentata per:

```text
Sofa-only end-to-end
Betfair-only end-to-end
both missing
persistence incomplete + pending
persistence incomplete + mismatch
confirmation store read failure
wrong-source timeline entry
active epoch + noncanonical final tick
metadata.updatedAt semantics
input timeline immutability
```

## Finding `EVID-SNAPSHOT-007` — riallineare e completare la verification matrix

**Priorità:** alta  
**Tipo:** test contract

### Modifica immediata

Rimuovere dalla lista i comandi inesistenti oppure creare davvero i test se devono essere gli owner principali.

### Raccomandazione

Creare/ristabilire test dedicati equivalenti a:

```text
latestMatchEvidence.test.mjs
evidenceBuilder.test.mjs
```

perché il composer principale merita una coverage diretta.

### Integrare i test esistenti

Citare anche:

```text
sourceIdentity/marketEpoch.test.mjs
sourceIdentityConfirmation.test.mjs
```

quando il documento pretende di verificare epoch e confirmation context.

### Regola

Non riportare `PASS` se il comando non è presente o non è stato eseguito sul checkpoint corrente.

---

# 8. La promessa di non esporre dettagli filesystem non è rispettata dalla route

## Esito: boundary snapshot/API non allineato

Il documento afferma che Evidence non espone:

```text
stack trace
dettagli filesystem
path filesystem
```

Il builder dello snapshot non inserisce intenzionalmente questi dati nel payload Evidence.

La route API però, se `buildLatestMatchEvidence()` lancia un errore, restituisce:

```js
{
  error: 'Failed to build match evidence snapshot',
  details: err?.message || String(err)
}
```

Quindi un errore originato da filesystem, parser o dependency interna può propagare un messaggio raw nel body HTTP.

Questo problema è già stato registrato nell’audit API.

## Finding `EVID-SNAPSHOT-008` — allineare il boundary pubblico alla promessa di redazione

**Priorità:** alta  
**Tipo:** public error boundary

### Coordinamento

Riutilizzare:

```text
EVIDENCE-API-005
```

per la modifica runtime.

### Documento

Distinguere:

```text
snapshot domain payload
da
HTTP error envelope
```

e dichiarare che entrambi devono rispettare redazione bounded.

### Target

Errori pubblici:

```text
reason/code statico
nessun path
nessuna stack
nessun raw message interno
```

Log server-side separato e redatto.

---

# 9. Il documento è troppo vicino agli owner specialistici, ma non va diviso

## Esito: duplicazione moderata

Con 422 righe, il documento replica molti dettagli già posseduti da:

- Source Identity;
- Data Quality;
- Market Reactions;
- storage integrity;
- API Evidence;
- Data Lifecycle.

Le sezioni più verbose sono:

```text
Persistence integrity
persistenceComplete
degradazione cross-source
Source Identity effective
Sofa-only
verification dettagliata
```

Questi argomenti sono pertinenti allo snapshot, ma il livello di dettaglio rischia di creare owner concorrenti.

## Finding `EVID-SNAPSHOT-009` — mantenere il facade snapshot e ridurre duplicazioni

**Priorità:** media  
**Tipo:** document ownership

### Mantenere qui

- input dello snapshot;
- ordine di composizione;
- blocchi output;
- regole di gating;
- read-only boundary;
- current limitations;
- link agli owner.

### Rinviare agli owner

- algoritmo completo Source Identity;
- formato confirmation fingerprint;
- dettaglio Graph/Money Flow reliability;
- algoritmi Market Reactions;
- dettagli journal/recovery;
- contratti HTTP completi.

### Non creare nuovi documenti

Il documento deve restare il punto unico che spiega:

```text
come i pezzi vengono composti in Evidence
```

---

# 10. Active Betfair market epoch

## Esito: concetto corretto

La funzione seleziona la porzione finale contigua che condivide la stessa firma.

La firma primaria è:

```text
marketId
+
selectionIds ordinati
```

Il fallback è:

```text
marketKey
+
runner names normalizzati
```

Un tick senza identity sufficiente può interrompere l’epoch.

I test Source Identity correnti verificano:

- cambio market ID;
- fallback marketKey+runners;
- unsigned boundary;
- unsigned final tick.

Il documento può mantenere il concetto.

La correzione richiesta è soltanto il boundary canonico di `EVID-SNAPSHOT-001`.

---

# 11. Manual confirmation context

## Esito: robusto

Il fingerprint include:

```text
eventId
epochSignature
marketId
selectionIds
normalized Sofa players
normalized Betfair runners
selectedPairs
```

L’applicabilità richiede corrispondenza esatta del contesto.

Quindi è corretta la regola:

```text
confirmation applicabile
→ soltanto event/epoch/market/mapping compatibili
```

Il problema non è la qualità del fingerprint.

Il problema è il momento in cui la confirmation diventa persistita rispetto al bootstrap live, trattato in `EVID-SNAPSHOT-005`.

---

# 12. Cross-source gating

## Esito: coerente

Il builder applica:

```text
crossSourceAllowed
=
sourceIdentity.status === aligned
AND
no persistence conflict
```

Se falso:

```text
scopedBetfairTick
→ null

lookback
→ []

allBetfairTicks
→ []

Market Reaction Sofa ticks
→ []

Market Reaction Betfair ticks
→ []
```

È importante notare che vengono sospesi anche i Sofa ticks passati a Market Reactions quando il cross-source contract non è autorizzato.

Questo impedisce di produrre una pseudo Market Reaction solo field-side sotto identity/persistence conflict.

La documentazione può mantenere la formulazione corrente.

---

# 13. Data Quality resta raw-source aware

## Esito: coerente

Anche quando:

```text
crossSourceAllowed:false
```

`buildDataQuality()` riceve:

```text
betfairTick
```

non scoped.

Quindi:

```text
Betfair fresco
ma non attribuibile
```

può restare:

```text
betfairRecent:true
```

Il documento descrive correttamente questa scelta.

La qualità dettagliata di Money Flow e ladder appartiene al documento owner dedicato e non viene ridefinita in questo report.

---

# 14. Persistence integrity

## Esito: sostanzialmente coerente

L’aggregazione applica:

```text
recovery_failed
> partial_persistence
> no_known_partial
```

In presenza di conflitto:

```text
affectedSources
→ compilato

cross-source
→ bloccato

persistenceComplete
→ false
```

La Source Identity effective non viene riscritta.

Questa è una scelta corretta.

### Limite non trattato qui come nuova task

Lo storage e lo snapshot normalizzano status sconosciuti verso:

```text
no_known_partial
```

La robustezza forward-compatible di questo comportamento va verificata durante l’audit dell’owner storage, per evitare di duplicare la responsabilità in Evidence.

---

# 15. Read-only boundary

## Esito: corretto nel domain builder

`buildLatestMatchEvidence()`:

- legge timeline;
- legge integrity;
- può leggere confirmation store;
- costruisce oggetti;
- non chiama recovery;
- non scrive timeline/history/journal;
- non avvia scraper;
- non apre browser;
- non fa fetch live.

Quindi il core Evidence è realmente read-only rispetto ai dati canonici.

Restano separati:

- read error semantics;
- confirmation store observability;
- HTTP error redaction.

---

# 16. Sofa Evidence e Momentum

## Esito: coerente

`buildSofaEvidence()` non espone un campo Momentum.

Restano:

- score;
- server;
- game phase;
- set phase;
- point state;
- pressure;
- performance drop;
- recovery run;
- service/return pressure;
- event markers;
- pressure window.

Il test `sofaEvidence.test.mjs` verifica anche l’assenza esplicita del campo Momentum.

Questa parte può restare.

---

# 17. Placeholder strategici

## Esito: coerente

`valueHypothesis` resta:

```text
enabled:false
```

con valori null.

`externalEvidence.tradeOnTennis` resta:

```text
available:false
```

e senza dati simulati.

Non vengono prodotte:

- fair odds;
- win probability;
- value gap attivo;
- direzione trade operativa.

Questa parte è coerente con la filosofia del progetto.

---

# 18. Modularizzazione

## Valutazione

```text
Righe: 422
Responsabilità primaria: 1
Ruolo: composer/facade Evidence Snapshot
Sottotemi: molti ma dipendenti dalla stessa composizione
Owner specialistici esterni: sì
Duplicazione: moderata
Necessità di nuovi owner: no
Rischio di split: frammentazione del percorso end-to-end
Suddivisione richiesta: no
```

Il documento non deve essere diviso in:

```text
snapshot-integrity.md
snapshot-source-identity.md
snapshot-market-reactions.md
```

perché quegli owner esistono già.

Il problema non è la lunghezza in sé.

Il problema è il livello di dettaglio duplicato.

## Decisione

```text
modularization_reviewed: true
split_required: false
proposed_files: []
```

---

# Riferimenti per la mappa e il JSON incrementale

```text
Report ID: TDUI-DOC-REPORT-016
Percorso report: Report documentale/16 - 01-match-evidence-snapshot.md
Documento: docs/tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md
Change ID: EVID-SNAPSHOT-001
Change ID: EVID-SNAPSHOT-002
Change ID: EVID-SNAPSHOT-003
Change ID: EVID-SNAPSHOT-004
Change ID: EVID-SNAPSHOT-005
Change ID: EVID-SNAPSHOT-006
Change ID: EVID-SNAPSHOT-007
Change ID: EVID-SNAPSHOT-008
Change ID: EVID-SNAPSHOT-009
Suddivisione richiesta: no
Nuovi file canonici proposti: nessuno
```

I file di mappa non sono stati modificati durante questa analisi.

---

# Modifiche proposte

## `EVID-SNAPSHOT-001` — canonical input boundary

**Priorità:** high

**Azione:**

- non considerare “found” una timeline soltanto perché non vuota;
- eliminare fallback Sofa verso entry di source diversa;
- definire una view Betfair canonica condivisa prima dell’epoch;
- mantenere Source Identity e dataQuality sulla stessa authority di tick;
- testare legacy/wrong-source/non-finite seq.

---

## `EVID-SNAPSHOT-002` — Betfair-only contract

**Priorità:** high

**Azione:**

- documentare il comportamento Betfair-only corrente;
- oppure rendere Sofa obbligatoria nel codice;
- evitare la frase attuale che contraddice il loader;
- aggiungere test specifico.

---

## `EVID-SNAPSHOT-003` — timeline read semantics

**Priorità:** high

**Azione:**

- coordinare con `EVIDENCE-API-004`;
- distinguere missing da read/parse failure;
- chiarire la semantica di `sources.*TimelineFound`;
- nessuna recovery automatica da Evidence.

---

## `EVID-SNAPSHOT-004` — confirmation store observability

**Priorità:** high

**Azione:**

- coordinare con `EVIDENCE-API-006`;
- mantenere fail-closed;
- rendere osservabile store unavailable/corrupt;
- non esporre dettagli filesystem.

---

## `EVID-SNAPSHOT-005` — confirmation/bootstrap consistency

**Priorità:** critical

**Azione:**

- coordinare `EVIDENCE-API-008` e `DATA-LIFE-004`;
- documentare il gap corrente;
- impedire in target che una confirmation non attivata dal bootstrap abiliti cross-source Evidence;
- non duplicare la soluzione owner.

---

## `EVID-SNAPSHOT-006` — snapshot timestamp semantics

**Priorità:** medium

**Azione:**

- definire `metadata.updatedAt` come compute time;
- valutare `computedAt` additivo;
- non usarlo come freshness source.

---

## `EVID-SNAPSHOT-007` — verification contract

**Priorità:** high

**Azione:**

- correggere i due comandi verso test inesistenti;
- creare/ripristinare test diretti del composer se desiderato;
- includere market epoch e confirmation tests reali;
- coprire Sofa-only, Betfair-only, malformed inputs, integrity e immutabilità.

---

## `EVID-SNAPSHOT-008` — public error redaction

**Priorità:** high

**Azione:**

- coordinare con `EVIDENCE-API-005`;
- distinguere domain snapshot e HTTP envelope;
- eliminare raw `err.message` dal body pubblico;
- preservare soltanto reason/code bounded.

---

## `EVID-SNAPSHOT-009` — ownership documentale

**Priorità:** medium

**Azione:**

- mantenere il documento unico;
- ridurre dettagli duplicati di Source Identity, storage e Market Reactions;
- mantenere composizione, gating, read-only boundary e limiti correnti;
- nessun nuovo documento canonico.

---

# Ordine consigliato di applicazione

```text
1. EVID-SNAPSHOT-001 — canonical input boundary
2. EVIDENCE-API-004 / EVID-SNAPSHOT-003 — read semantics
3. EVIDENCE-API-008 + DATA-LIFE-004 / EVID-SNAPSHOT-005
4. EVIDENCE-API-006 / EVID-SNAPSHOT-004
5. EVIDENCE-API-005 / EVID-SNAPSHOT-008
6. EVID-SNAPSHOT-002 — Betfair-only contract
7. EVID-SNAPSHOT-007 — test composer
8. EVID-SNAPSHOT-006 — timestamp semantics
9. EVID-SNAPSHOT-009 — riduzione duplicazioni
10. revisione mirata del documento
11. checker documentali
12. aggiornamento cumulativo di mappa e ledger al checkpoint previsto
```

---

# Verifica prevista dopo un’eventuale modifica

## Canonical source input

Testare:

```text
Sofa file con entry Sofa valida
→ found

Sofa file non vuoto senza entry Sofa
→ not found / invalid source
→ nessun fallback

Betfair final entry source errata
→ non active canonical tick

Betfair seq NaN/Infinity/missing
→ non canonical
```

## Availability

```text
Sofa + Betfair
→ full/degraded secondo gate e quality

Sofa-only
→ ok:true degradato

Betfair-only
→ comportamento scelto e testato

nessuna timeline
→ missing:true
```

## Read failures

```text
file assente
file illeggibile
JSON corrotto
shape invalida
```

devono essere distinguibili secondo il nuovo reader contract.

## Confirmation

```text
store assente
→ no confirmation, no failure

store corrotto
→ fail-closed + reason osservabile

confirmation non applicabile
→ pending

confirmation applicabile
→ aligned effective

bootstrap fallito
→ confirmation non deve autorizzare cross-source nel target finale
```

## Integrity

```text
no_known_partial
→ persistenceComplete true

partial_persistence
→ false

recovery_failed
→ false

conflict + pending/mismatch
→ entrambe le reason preservate
```

## Epoch

```text
market A
→ market B
→ solo final epoch B

unsigned boundary
→ historical epoch esclusa

unsigned final tick
→ no active signed epoch
```

## Metadata

```text
metadata.updatedAt/computedAt
→ build time

source freshness
→ campi separati
```

## HTTP boundary

Forzare un errore interno con messaggio sensibile:

```text
route
→ errore pubblico statico/bounded
→ nessun path
→ nessuna stack
→ nessun raw message
```

## Test owner

Usare test realmente presenti e aggiungere coverage diretta per il composer.

## Documentazione

```bash
python scripts/check_documentation_links.py --forbid-mdx-links
python scripts/check_registry_consistency.py
node scripts/validation/run.mjs fast
git diff --check
git diff --name-status
```

Questi controlli non sono stati eseguiti durante la presente analisi.

---

# Decisione finale

```text
01-match-evidence-snapshot.md: OWNER SOLIDO, MA INPUT/ERROR BOUNDARY DA RAFFORZARE

Read-only composition: corretta
Source Identity gating: corretto
Persistence gating: corretto
Market epoch concept: corretto
Confirmation fingerprint: robusto
Sofa-only: supportato
Betfair-only: supportato dal codice ma non dal documento
Both missing: missing
Timeline found semantics: troppo permissiva
Sofa wrong-source fallback: presente
Betfair Source Identity e valid tick authority: non perfettamente coincidenti
Read failure vs missing: collassati
Confirmation read error: silenzioso
Confirmation-before-bootstrap: gap critico già noto
metadata.updatedAt: compute time ambiguo
Verification: due test indicati non esistono
HTTP raw error details: incompatibili con la promessa di redazione
Riscrittura completa: no
Modularizzazione: no
Nuovi documenti canonici: nessuno
Priorità complessiva: alta
```

Il documento deve restare un unico owner del composer Evidence.

La correzione principale è rendere vera la premessa:

```text
“timeline canonica”
```

prima che Evidence costruisca:

```text
Source Identity
dataQuality
marketEvidence
Market Reactions
```

e rendere osservabile la differenza fra:

```text
dato assente
dato illeggibile
dato non canonico
dato disponibile ma non attribuibile
```
