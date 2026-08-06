# Tennis Decision UI — Frontend, sessione live e polling

> **Registro principale:** [06-implementazioni-proposte.md](../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-025…027
> **Righe originali:** 2456–3054
> **Parte precedente:** [Evidence, provenance e confronti temporali](04-evidence-provenance.md)
> **Parte successiva:** [Validazione, fixture e test harness](06-validazione-e-fixture.md)

<!-- BEGIN ORIGINAL CONTENT -->
## 20. Implementazioni approvate dal Punto 6

### IMPL-025 — Frontend live-session controller

**Classificazione:** `NECESSARIA`
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-006`, contratti Start/Stop backend, Source Identity Gate

### Problema

Il frontend distribuisce l’autorità della sessione fra booleani e stati indipendenti:

```txt
confirmedUrl
sessionShellVisible
trackingStopped
dashboardContentReady
polling flags
activeView
stop status
Source Identity phase
```

Questi valori possono produrre combinazioni incompatibili.

### Responsabilità

Creare un owner unico della sessione frontend.

Stati minimi:

```txt
idle
starting
collecting
pending_confirmation
live
stopping
stopped_static
stop_partial
mismatch
integrity_degraded
error
```

Dati minimi:

```txt
trackingSessionId
startCommandId
stopCommandId
confirmCommandId
eventId
requestedConfig
acceptedConfig
currentSnapshot
lastVerifiedSnapshot
snapshotMode
startError
stopResult
```

`snapshotMode` usa almeno:

```txt
none
live
frozen
degraded
```

### Start

```txt
utente invia Start
→ crea commandId
→ state = starting
→ nessun poller live
→ attende risposta backend
```

Risposta accettata:

```txt
eventId
trackingSessionId
accepted config
→ state = collecting/live secondo gate
→ abilita poller session-scoped
```

Risposta stale:

```txt
commandId non corrente
→ nessun effetto
```

Fallimento o risposta ambigua:

```txt
invalida command
→ abort poller/request transitorie
→ clear accepted session
→ cleanup compensativo se necessario
→ preserva input del form
→ errore Start visibile
```

### Stop

```txt
state = stopping
→ invalida logicamente la sessione live
→ disabilita tutti i poller
→ invia Stop con session/command identity
```

Stop completo:

```txt
state = stopped_static
snapshotMode = frozen
ultimo snapshot verificato preservato
```

Stop parziale:

```txt
state = stop_partial
snapshotMode = degraded o frozen
summary cleanup visibile
```

### EventId

Dopo Start, l’eventId canonico del frontend è quello restituito dal backend.

Il parser URL resta utile soltanto per:

- preflight;
- presentazione dell’input;
- diagnostica locale;

ma non diventa authority della sessione accettata.

### Consumer

```txt
App.jsx
StartAnalysisPanel.jsx
DashboardWorkspace.jsx
Sidebar.jsx
TopBar.jsx
OverviewDashboard.jsx
Source Identity UI
poller live
Betfair health alerts
```

I componenti ricevono uno stato già derivato e non ricostruiscono `live` dalla presenza dei dati.

### Test minimi

```txt
TEST-044
TEST-045
TEST-048
TEST-049
TEST-051
TEST-056
```

### Fuori scope

- responsive completo;
- redesign visuale;
- strategie;
- recovery frontend;
- calcoli Evidence;
- modifica delle timeline canoniche.

---

### IMPL-026 — Polling runtime session-scoped

**Classificazione:** `NECESSARIA`
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA`
**Priorità:** critica
**Dipendenze:** `IMPL-006`, `IMPL-025`

### Problema

I poller SofaScore e Betfair implementano lifecycle differente da Gate ed Evidence e non proteggono:

- cambio sessione;
- response tardive;
- response fuori ordine;
- cleanup durante fetch;
- StrictMode;
- disabilitazione completa dopo Stop.

### Contratto comune

Ogni poller usa una primitive condivisa con:

```txt
enabled
sessionKey
requestId monotono
AbortController
single active request
disposed flag
poll timeout
schedule-after-response
retain policy
expected HTTP classifier
```

`sessionKey` deve includere almeno:

```txt
trackingSessionId
endpoint purpose
```

### Invarianti

```txt
enabled:false
→ abort request
→ clear timeout
→ nessuna riprogrammazione

sessionKey cambia
→ vecchia response ignorata

requestId non corrente
→ nessun setState

cleanup durante fetch
→ finally non programma nuovo timeout

StrictMode remount
→ una sola catena corrente
```

### Policy per source

#### SofaScore

Abilitato quando:

```txt
sessione accettata
+ stato live/collecting/pending compatibile
```

#### Betfair

Abilitato quando:

```txt
sessione accettata
+ Betfair configurato
+ sessione live
```

#### Source Identity Gate

Abilitato quando:

```txt
sessione live
+ Betfair configurato
```

#### Evidence

Abilitato quando:

```txt
sessione live
+ activeView = market-reactions
```

All’ingresso nella vista esegue un fetch immediato.

#### Stopped static

```txt
nessun poller abilitato
```

### Retain policy

La primitive non decide autonomamente se cancellare dati.

Ogni consumer dichiara:

```txt
clear_on_new_session
retain_last_verified_on_stop
mark_degraded_on_integrity
```

### Errori previsti

La classificazione HTTP resta endpoint-specifica:

- Sofa 404 waiting;
- Sofa/Betfair 409 persistence;
- Evidence 404 neutral con reasons;
- Gate 404 status assente;
- errori tecnici separati.

La primitive gestisce lifecycle, non semantica del payload.

### Test minimi

```txt
TEST-046
TEST-047
TEST-048
TEST-057
TEST-058
```

---

### IMPL-027 — Market Reactions frontend view model

**Classificazione:** `NECESSARIA`
**Stato:** `STRUTTURA COMPLETAMENTE ASSENTE; APPROVATA`
**Priorità:** alta
**Dipendenze:** `IMPL-023`, `IMPL-024`, `IMPL-009`

### Problema

Le card leggono direttamente un payload backend evolutivo e:

- considerano disponibile qualsiasi oggetto truthy;
- usano nomi campo non corrispondenti al contratto;
- confondono unavailable e not observed;
- non distinguono provisional e final;
- non ricevono il contesto integrity completo.

### Input

```txt
Match Evidence Snapshot
marketReactionEvidence
dataQuality
integrity
sources
branch state IMPL-023
```

### Output

```txt
pageState
marketLedCard
fieldLedCard
availability
sourceEventAvailability
observationDetected
provisional
windowState
quality
reasons
causalityLabel
```

### Mapping source event Market → Field

Consumare esplicitamente:

```txt
runner
selectionId
observedFlowAmount
absoluteFlowTier
interpretation
timestamp
```

### Mapping Field → Market

Consumare esplicitamente:

```txt
sourceFieldEvent
marketActivityObserved
runnerPriceChangeObserved
runnerVolumeChangeObserved
qualifiedMarketObservation
price source comparability
coverage
```

### Stati UI distinti

```txt
unavailable
available_not_observed
observed_provisional
observed_final
degraded
stale
integrity_blocked
```

`available:false` non viene promosso in base alla presenza dell’oggetto.

Una finestra unavailable o aperta non usa la label `not observed` come se fosse una conclusione finale.

### Causalità

Il view model deve preservare:

```txt
causalityClaimed:false
interpretation: temporal_proximity_only
```

Non deve produrre:

- segnale;
- previsione;
- raccomandazione;
- causa certa;
- intenzione del mercato.

### Test minimi

```txt
TEST-054
TEST-055
```

---

## 20.1 Estensioni di implementazioni esistenti

### Estensione di IMPL-006 — Session authority end-to-end

Aggiungere il contratto frontend definitivo:

```txt
Start response
→ eventId + trackingSessionId
→ unica identità accettata

Stop/Confirm
→ commandId + trackingSessionId

response stale
→ nessun effetto
```

Lo stato richiesto e lo stato accettato restano distinti.

### Estensione di IMPL-009 — Persistence integrity frontend

Input:

```txt
Sofa integrity
Betfair integrity
Evidence integrity
recovery control plane
session state
```

Output:

```txt
status globale
status locale per source/card
affectedSources
affectedDocuments
reason pubblica bounded
isBlockingCrossSource
snapshotMode
```

Consumer:

```txt
TopBar o stato globale
sidebar indicator
persistence modal
BetfairDepthCard
Overview/Match status
MarketReactionsPage
```

La UI non mostra:

- path;
- payload journal;
- commit internals;
- stack;
- target filesystem.

### Estensione Source Identity status pubblico

Aggiungere campi opachi:

```txt
trackingSessionId
sourceIdentityContextId
sourceIdentityRevision
```

Servono a legare modale e conferma al contesto reale senza esporre dettagli sensibili.

### Estensione Preflight

Ogni check conserva:

```txt
inputFingerprint
requestId
checkedAt
status
```

Cambio input:

```txt
risultato precedente → stale/idle
```

Response vecchia:

```txt
fingerprint/requestId non correnti
→ ignorata
```

### Cleanup già approvato

Rimuovere in task separata:

```txt
LayTheWinner
BancaServizio
Superbreak
menu Strategy
route/client esclusivi
SourceIdentityControls legacy
confirm/revoke legacy in useMarketReactionEvidence
```

Prima della rimozione inventariare i consumer condivisi e preservare integralmente Market Reactions.

### Correzioni separate

```txt
FRONTEND-004
→ mojibake e copy

FRONTEND-012
→ responsive completo
```

Non unirle alla task session/polling.

## 20.2 Ordine approvato

```txt
IMPL-006
→ contratto backend/session authority

IMPL-025
→ frontend live-session controller

IMPL-026
→ polling runtime session-scoped

IMPL-009
→ persistence integrity UI

IMPL-027
→ Market Reactions frontend view model

TEST-044…058
→ cleanup Strategy e Source Identity legacy
→ FRONTEND-004 piccole correzioni
→ FRONTEND-012 responsive + TEST-059
→ Punto 7 test e strutture mancanti
```


---

<!-- END ORIGINAL CONTENT -->
