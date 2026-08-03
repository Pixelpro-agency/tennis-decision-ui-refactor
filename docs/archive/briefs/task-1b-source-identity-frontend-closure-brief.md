> Archivio storico — non canonico e non operativo.
>
> Questo brief contiene riferimenti superati, inclusa la simulazione frontend
> `sourceIdentitySimulation=pending-once`, rimossa dal progetto.
>
> Per il comportamento corrente consultare:
> - `../../tennis-decision-ui/modules/evidence/02-source-identity.md`
> - `../../tennis-decision-ui/modules/frontend/01-session-shell.md`
> - `../../tennis-decision-ui/modules/frontend/02-live-polling-and-view-model.md`
> - `../../validations/source-identity-live-verification.md`

# Task 1B — Source Identity frontend globale

## Stato

**Implementato, da validare su un caso reale `pending`.**

La Task 1B è chiusa come implementazione: il frontend usa il gate Source Identity globale, la shell compare subito dopo Start e i flussi verificati live funzionano.

La validazione differita del caso `pending` reale resta tracciata nel registro dedicato. Non richiede modifiche ulteriori al codice finché non si presenta una coppia di fonti che il backend classifica realmente come `pending`.

## Funzionalità introdotte

- Shell dashboard visibile subito dopo Start, anche quando non esiste ancora `dashboardData`.
- Polling centralizzato dello status Source Identity tramite:

  ```txt
  GET /api/match/:eventId/source-identity-status
  ```

- Semaforo Source Identity nella sidebar, sopra il semaforo Betfair.
- Stati UI per `collecting`, `pending`, `recording/aligned`, `mismatch`, `not-applicable`, errore bootstrap e tracking fermo.
- Waiting screen durante bootstrap e pending, senza Overview, card Betfair o Market Reactions.
- Modale globale pending con soli nomi SofaScore e runner Betfair, mapping uno-a-uno e frase di conferma obbligatoria.
- Toast verde per la transizione a `recording/aligned`.
- Toast rosso persistente per `mismatch`, con ritorno automatico al form e campi preservati.
- Reset selettivo della sola sessione confermata: gli input del form restano disponibili per correggere e riavviare.
- Simulazione locale solo sviluppo per il percorso UI `pending → conferma → recording`, attivabile soltanto con:

  ```txt
  ?sourceIdentitySimulation=pending-once
  ```

## Confini

- Lo stato globale Source Identity deriva soltanto dall’endpoint status backend.
- Evidence e Market Reactions restano separati dal semaforo globale.
- Il frontend non deduce mapping, mismatch o stato dai link.
- La simulazione pending non esegue il POST reale di conferma e non scrive cache o persistenza.

## Verifiche live completate

- `collecting → recording/aligned` automatico:
  shell immediata, semaforo grigio, semaforo verde, dashboard reale e toast verde iniziale.

- `mismatch`:
  toast rosso, ritorno al form e campi URL preservati.

- `mismatch → correzione link → nuovo Start → collecting → aligned` nella stessa sessione browser:
  il toast rosso scompare al nuovo Start, il semaforo torna grigio e poi verde, la registrazione riparte.

Nota: nel restart dopo mismatch non è stato osservato il toast verde, ma semaforo verde e avvio della registrazione sono stati confermati. È un dettaglio UX non bloccante.

## Verifiche differite

Restano da verificare quando il backend produrrà un vero `phase=pending`:

- comparsa della modale con nomi reali;
- invio reale della conferma manuale;
- transizione reale `pending → recording/aligned`;
- decline pending con stop, ritorno al form e assenza del toast mismatch.

La simulazione UI può essere eseguita soltanto partendo da una partita che raggiunge davvero `recording/aligned`; non forza un mismatch reale a diventare pending.

Le coppie disponibili durante il test hanno restituito mismatch dal backend. La simulazione resta quindi non verificata live.

## Registro di verifica live

Il registro canonico è:

```txt
docs/validations/source-identity-live-verification.md
```

## Limite noto fuori scope

Il bootstrap cross-source non è transazionale.

Se la persistenza SofaScore riesce e quella Betfair fallisce subito dopo, il gate torna `pending` con errore sintetico, ma il tick SofaScore già scritto non viene rollbackato.

## File principali Task 1B

```txt
frontend/src/App.jsx
frontend/src/hooks/useSourceIdentityGateStatus.js
frontend/src/hooks/useSourceIdentityPendingSimulation.js
frontend/src/services/liveSessionApi.js
frontend/src/hooks/useAnalysisSessionState.js
frontend/src/components/DashboardWorkspace.jsx
frontend/src/components/Sidebar.jsx
frontend/src/components/SourceIdentityGateIndicator.jsx
frontend/src/components/SourceIdentityGateToast.jsx
frontend/src/components/SourceIdentityGateWaitingScreen.jsx
frontend/src/components/marketReactions/SourceIdentityConfirmationModal.jsx
frontend/src/utils/sourceIdentityGatePresentation.js
frontend/src/utils/sourceIdentityGatePresentation.test.mjs
```

## Chiusura

La Task 1B è chiusa come sviluppo e integrazione frontend.

Il runbook live resta il punto unico per la verifica opportunistica di `pending` reale.
