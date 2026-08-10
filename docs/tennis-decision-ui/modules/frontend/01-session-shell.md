# Sessione e shell frontend

## Scopo

Questo modulo descrive il lifecycle frontend che collega il form iniziale, lo Start backend, i poller live, la shell dashboard, Source Identity e lo Stop.

## Ownership

| Area                                      | Owner                                               |
| ----------------------------------------- | --------------------------------------------------- |
| Composizione della sessione e delle viste | `frontend/src/App.jsx`                              |
| Input e configurazione confermata         | `frontend/src/hooks/useAnalysisSessionState.js`     |
| Start, Stop e ritorno al form             | `frontend/src/hooks/useLiveTrackingActions.js`      |
| Bootstrap session-bound della dashboard   | `frontend/src/hooks/useDashboardBootstrapState.js`  |
| Gate Source Identity live                 | `frontend/src/hooks/useSourceIdentityGateStatus.js` |
| Lifecycle UI Source Identity              | `frontend/src/hooks/useSourceIdentityGateUi.js`     |
| Contratti HTTP espliciti                  | `frontend/src/services/liveSessionApi.js`           |
| Stato read-only della persistenza         | `frontend/src/utils/persistenceViewState.js`        |
| Form e shell                              | `StartAnalysisPanel.jsx`, `DashboardWorkspace.jsx`  |

## Stati distinti

Il frontend mantiene separati:

1. gli input correnti del form;
2. la shell visibile durante lo Start;
3. la configurazione confermata dopo lo Start;
4. l'autorità della sessione backend;
5. la disponibilità dei dati della dashboard.

```txt
input utente
→ richiesta POST /api/match/track
→ risposta ok con trackingSessionId
→ configurazione confirmed
→ sessionActive = true
→ poller abilitati
→ bootstrap della sessione corrente
```

La presenza di un URL non equivale a una sessione attiva. `sessionActive` è l'autorità comune usata per consegnare evento e URL ai poller.

## Input e configurazione confermata

Gli input modificabili sono:

```txt
matchUrl
betfairUrl
betfairGraphUrls
betfairMode
chromeProfilePath
cdpUrl
```

La configurazione confermata viene applicata soltanto dopo che `startMatchTracking()` restituisce un `trackingSessionId` valido. Se la richiesta fallisce o non restituisce l'autorità di sessione:

- la configurazione confermata viene pulita;
- `sessionActive` torna `false`;
- il `trackingSessionId` viene rimosso;
- il bootstrap viene annullato;
- la shell si chiude;
- il form mostra un errore statico e sicuro;
- nessun poller di sessione viene attivato.

Gli input correnti restano disponibili per correggere la configurazione e riprovare.

## Preflight

`PreflightChecks` è diagnostica advisory. Non autorizza e non blocca automaticamente il pulsante Start.

```txt
preflight
→ informazioni diagnostiche
→ decisione esplicita dell'utente
→ Start
```

## Start transazionale

`useLiveTrackingActions.handleSearch()`:

1. normalizza il percorso del profilo e costruisce il payload;
2. apre la shell nello stato di attesa;
3. revoca qualsiasi autorità locale precedente;
4. invia la richiesta di Start;
5. richiede `trackingSessionId` nella risposta positiva;
6. applica la configurazione confermata;
7. attiva la sessione e avvia il bootstrap associato a quell'ID.

L'errore restituito alla UI usa un messaggio statico. Il codice diagnostico bounded viene conservato e inviato al logger tramite allow-list.

## Autorità dei poller

`App.jsx` passa URL ed evento ai poller soltanto quando `sessionActive` è vero:

```txt
sessionActive = false
→ URL/evento vuoti
→ stato locale azzerato
→ nessun timer

sessionActive = true
→ URL/evento confirmed
→ polling SofaScore, Betfair, Evidence e Source Identity
```

`useMatchPolling` e `useBetfairJson` non schedulano timer quando mancano i rispettivi identificatori. I dettagli su cancellazione, generazioni di richiesta e risposte stale appartengono al documento [Polling e view model](./02-live-polling-and-view-model.md).

## Bootstrap della dashboard

Il bootstrap è legato al `trackingSessionId` corrente. Può completarsi soltanto quando:

```txt
sessionActive = true
trackingSessionId presente
bootstrapSessionId = trackingSessionId
reset dei dati osservato
backendData nuovo presente
```

Un payload rimasto in memoria da una sessione precedente non può sbloccare direttamente il nuovo bootstrap: prima è obbligatorio osservare il reset e l'autorità deve coincidere.

`dashboardContentReady` non sostituisce il gate Source Identity. I due stati hanno responsabilità diverse:

- bootstrap: disponibilità dei dati della sessione corrente;
- Source Identity: stato live di allineamento SofaScore/Betfair.

## Contratti delle azioni

Start, Login e Stop espongono risultati bounded. I messaggi mostrati non derivano da `error.message` arbitrari restituiti dal server.

```txt
success → { ok: true, ... }
failure → { ok: false, code, error statico }
```

`stopMatchTracking()` usa parsing JSON safe e considera riuscita soltanto una risposta HTTP positiva con `payload.ok === true`.

## Source Identity

La UI usa come authority lo status restituito da:

```txt
GET /api/match/:eventId/source-identity-status
```

Non ricostruisce il gate dai file Evidence. Lo status controlla waiting screen, indicatore, toast, modale pending e transizione mismatch.

### Conferma

La conferma invia:

```txt
selectedPairs
confirmationText
trackingSessionId
```

Una risposta positiva al POST non è sufficiente. La modale si chiude soltanto quando il refresh live restituisce:

```txt
phase = recording
sourceIdentity.status = aligned
trackingSessionId = sessione confermata
```

Se il refresh è nullo, pending, in errore o appartiene a un'altra sessione, la modale resta aperta e mostra un errore bounded.

### Rifiuto

Il rifiuto attende il risultato dello Stop. La modale non viene chiusa preventivamente:

- successo: poller fermati, autorità revocata, configurazione pulita e ritorno al form;
- fallimento: modale aperta e messaggio sicuro.

### Mismatch

Quando il gate entra in `mismatch`:

```txt
toast rosso
→ stop polling SofaScore
→ clearConfirmedSession()
→ sessionActive = false
→ trackingSessionId = null
→ reset bootstrap
→ ritorno al form
```

## Profilo Chrome

Il modello corrente usa un solo campo: `chromeProfilePath` è il percorso completo fornito dall'utente. `buildProfilePath()` lo normalizza con `trim()`.

I precedenti stati `chromeProfileName` e `confirmedChromeProfileName` sono stati rimossi perché non partecipavano al payload né al lifecycle.

## Persistence view state

`buildPersistenceViewState()` combina in modo read-only sessione, readiness, errori e integrity già restituita dagli hook. Gli stati sono:

```txt
inactive
waiting
current
degraded
error
```

La shell mostra un avviso comune per `degraded` ed `error`. Non legge journal, file o directory di storage e non esegue recovery.

## Stop

`Stop Live Tracking` arresta la sessione live senza cancellare timeline o history persistite.

Lo Stop riuscito:

- ferma il polling SofaScore;
- imposta `sessionActive` a `false`;
- rimuove il `trackingSessionId`;
- conserva i dati persistiti lato backend;
- restituisce un risultato strutturato alla UI.

Il ritorno al form pulisce inoltre la configurazione confermata e il bootstrap.

## Riferimenti implementativi

| Responsabilità                 | File                                               |
| ------------------------------ | -------------------------------------------------- |
| composizione della shell       | `frontend/src/App.jsx`                             |
| stato input/confirmed/tracking | `frontend/src/hooks/useAnalysisSessionState.js`    |
| Start e Stop                   | `frontend/src/hooks/useLiveTrackingActions.js`     |
| bootstrap dashboard            | `frontend/src/hooks/useDashboardBootstrapState.js` |
| Source Identity UI             | `frontend/src/hooks/useSourceIdentityGateUi.js`    |
| chiamate di sessione           | `frontend/src/services/liveSessionApi.js`          |
| pannello iniziale              | `frontend/src/components/StartAnalysisPanel.jsx`   |
| workspace                      | `frontend/src/components/DashboardWorkspace.jsx`   |

### Macchina a stati della sessione

```text
editing
→ preflight
→ start_pending
→ tracking_confirmed
→ dashboard_bootstrap
→ dashboard_active

qualunque failure prima di tracking_confirmed
→ rollback stato confermato
→ stop poller della sessione candidata
→ form con errore bounded
```

Uno Start transazionale conserva distinti:

```text
input corrente
confirmed input
trackingSessionId backend
shell visibile
dashboard pronta
```

La presenza di dati persistiti precedenti non prova che la nuova sessione sia partita. I poller diventano autorevoli soltanto dopo il successo di `/track` e restano legati al `trackingSessionId` restituito.

### Azioni e risultato atteso

| Azione           | Successo                                     | Failure                                  |
| ---------------- | -------------------------------------------- | ---------------------------------------- |
| Start            | sessione confermata e poller autorizzati     | rollback e errore UI                     |
| Stop             | tracking fermato, dati persistiti preservati | stato coerente e failure visibile        |
| Confirm identity | gate aggiornato e bootstrap verificato       | nessuna falsa conferma locale            |
| Decline identity | stop completato prima di chiudere il flusso  | modale/stato non anticipano il risultato |

### Contratti di test

```text
frontend/src/utils/analysisSessionState.test.mjs
frontend/src/utils/liveSessionRequests.test.mjs
```

I test devono coprire anche il lifecycle degli hook: start fallito, cambio sessione, teardown poller, mismatch e Stop parziale.

## Test

Copertura diretta:

```txt
frontend/src/hooks/useLiveTrackingActions.test.mjs
frontend/src/hooks/useDashboardBootstrapState.test.mjs
frontend/src/hooks/useSourceIdentityGateUi.test.mjs
frontend/src/utils/persistenceViewState.test.mjs
```

Le suite verificano autorità Start, assenza di session ID, isolamento del bootstrap, session mismatch nella conferma e classificazione dello stato di persistenza. Le procedure live storiche appartengono ai documenti in `docs/validations/`, non a questo owner di modulo.

Verifica automatica:

```bash
node --test <tutti i file frontend/src/**/*.test.mjs>
npm.cmd run build
python scripts/check_documentation_links.py
python scripts/check_registry_consistency.py
```

Il comando `npm.cmd run lint` non è una verifica disponibile finché il progetto non contiene una configurazione ESLint: lo script termina prima di analizzare i sorgenti.

## Documenti collegati

- [Polling e view model](./02-live-polling-and-view-model.md)
- [UI Betfair e Market Reactions](./03-betfair-and-market-reactions-ui.md)
- [Source Identity](../evidence/02-source-identity.md)
- [API Match](../../api/01-match.md)
- [API Evidence](../../api/03-evidence.md)
- [API Preflight](../../api/04-preflight.md)
- [Verifica live Source Identity](../../../validations/source-identity-live-verification.md)
