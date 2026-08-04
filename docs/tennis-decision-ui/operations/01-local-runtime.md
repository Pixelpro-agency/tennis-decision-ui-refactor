# Runtime locale

## Scopo

Questo documento descrive avvio, riuso e shutdown locale dello stack:

```txt
Chrome CDP
→ backend Express
→ frontend Vite
```

Il runtime locale è il contenitore operativo dello stack di sviluppo. Non è owner di tracking, scraper, Source Identity, contratti HTTP, journal di persistenza o algoritmi di recovery.

Il launcher può avviare e coordinare backend e frontend, ma non crea dati canonici, non ripara journal, non cancella sidecar e non modifica history o timeline.

## Stato

**Implementato.**

Il collaudo runtime finale ha validato avvio, blocco della seconda invocazione con lock attivo, shutdown, riavvio e preservazione CDP.

La correzione finale impone:

```txt
prima istanza con lock attivo
→ seconda invocazione bloccata
→ nessun session_reuse
→ nessun browser_open

lock assente o positivamente stale
+ manifest e servizi riusabili
→ lock acquisito o reclaimed
→ riuso della sessione
→ rilascio del lock della nuova invocazione
```

Lock, manifest e identità della prima sessione restano invariati; la seconda invocazione non apre il browser e non avvia nuovi servizi.

Restano **Implementato, da validare live**:

```txt
backend preferito occupato da un processo esterno
frontend preferito occupato da un processo esterno
CDP reale su una porta diversa da 9222
fallback force-kill realmente necessario
```

Questi casi sono coperti da test automatici, ma non vengono dichiarati validati live.

## Prerequisiti

* Python disponibile nel terminale.
* Node.js disponibile.
* Dipendenze frontend installate, inclusa la CLI Vite locale.
* PowerShell e Chrome disponibili per l’eventuale avvio di Chrome dedicato.
* Per flussi Betfair che richiedono la chiave applicativa, `BETFAIR_APP_KEY` deve essere disponibile dall’ambiente o dal file `.env` locale nella root del repository.
* Nessun cookie, token, password o percorso personale incluso nella documentazione.

Il file `.env` è locale e non deve essere condiviso, allegato o versionato.

La documentazione può citare il nome della variabile `BETFAIR_APP_KEY`, ma non deve contenere valori reali.

## Invariante runtime locale

Per una singola working copy locale deve esistere una sola istanza backend canonica responsabile dei flussi di scrittura.

```txt
una working copy locale
→ un backend Tennis Decision UI valido
→ un writer logico dei file canonici
→ tracker, scraper e processor coordinati dal backend
```

Il launcher non deve usare fallback porte per creare intenzionalmente una seconda istanza backend Tennis Decision UI che scrive sulla stessa working copy.

Il riuso è ammesso solo quando il backend esistente supera la verifica di health e identità Tennis Decision UI.

Un processo esterno che occupa una porta preferita non viene chiuso. In quel caso il launcher può scegliere una porta alternativa, ma non deve assumere che il processo esterno sia parte del runtime Tennis Decision UI.

## Avvio normale

Dalla root del repository:

```txt
python avvio.py
```

Sequenza:

```txt
avvio.py
→ acquisizione o recupero conservativo del lock
→ eventuale verifica sessione riusabile
→ manifest runtime iniziale
→ risoluzione CDP
→ backend
→ frontend Vite
→ manifest pronto
→ apertura browser
```

Il launcher apre il browser usando l’URL frontend effettivamente scelto.

Il launcher non legge né ripara i journal pending. Il backend esegue `runPendingCommitRecovery(...)` nel proprio bootstrap, prima di `listen`; un esito fatal impedisce l’ascolto. Gli esiti non fatali restano osservabili dai documenti owner della persistenza e dalle superfici read-only.

## Servizi e porte

| Servizio        | Porta preferita | URL o verifica                          |
| --------------- | --------------- | --------------------------------------- |
| Chrome CDP      | `9222`          | `http://127.0.0.1:<porta>/json/version` |
| Backend Express | `3001`          | `http://127.0.0.1:<porta>/api/health`   |
| Frontend Vite   | `3000`          | `http://127.0.0.1:<porta>`              |

Il backend legge la porta da `process.env.PORT`; il default è `3001`.

Il frontend usa API relative:

```txt
/api
```

Vite riceve il backend scelto tramite `VITE_BACKEND_TARGET` e l’URL CDP effettivo tramite `VITE_CDP_URL`.

Vite viene avviato direttamente tramite Node e CLI Vite locale, con bind e readiness su:

```txt
127.0.0.1
```

Se la CLI Vite locale non è disponibile, il launcher fallisce senza avviare tentativi inutili su porte diverse.

## Riuso e fallback porte

Le porte indicate sono preferite, non riservate.

Quando una porta preferita è occupata da un processo non riconosciuto, il launcher seleziona una porta alternativa senza chiudere processi esterni.

Un backend esistente viene riusato soltanto dopo verifica health e identità Tennis Decision UI.

Il riuso della sessione richiede prima che la nuova invocazione abbia acquisito o positivamente recuperato il lock. Un lock attivo o non verificabile blocca la seconda invocazione prima della verifica del manifest.

Dopo il lock, il riuso richiede:

```txt
backend raggiungibile
→ project corretto
→ instanceId coerente
→ frontend raggiungibile
```

Lock e manifest runtime sono effimeri.

Il manifest registra stato, endpoint, instance ID, CDP e ownership della sessione.

L'ownership `owned` è assegnata soltanto a backend e frontend avviati dal launcher. Un backend riusato può comparire nel manifest, ma non è owned.

Il manifest non è una fonte canonica per history, timeline, journal, Evidence o Source Identity.

## CDP

La porta `9222` è la porta preferita del launcher, non un fallback applicativo.

La discovery valuta al massimo cinque porte candidate: quella preferita e le quattro immediatamente successive, senza interrogare un sesto candidato.

```txt
endpoint CDP locale valido già disponibile
→ reused

porta libera selezionata
→ helper Chrome richiesto
→ external
→ non owned
→ non chiuso dal launcher
```

La risoluzione verifica un endpoint browser reale. Un listener non CDP viene lasciato intatto. Se la risoluzione fallisce:

```txt
cdpUrl = ""
```

Nessun componente inventa `http://127.0.0.1:9222`. La URL scelta viene propagata esattamente a frontend, backend e scraper.

## Tracker, scraper e processor

Il runtime locale non è il lifecycle owner dei tracker applicativi.

```txt
launcher
→ backend Express
→ route applicative
→ tracker / scraper / processor
```

Il launcher deve limitarsi a rendere disponibile backend e frontend.

Non deve:

* avviare tracker live autonomamente;
* forzare fetch SofaScore o Betfair;
* invocare recovery journal;
* creare tick timeline;
* creare row history;
* mutare `marketState`;
* confermare baseline Betfair;
* creare Evidence snapshot.

Gli scraper e i processor sono governati dai rispettivi documenti owner. Il runtime locale può ospitare il backend che li richiama, ma non ne ridefinisce il contratto.

## Persistenza incompleta e runtime

Uno stato di persistenza incompleta non è, da solo, un errore del runtime locale.

```txt
partial_persistence
recovery_failed
```

sono distinti da:

```txt
backend non raggiungibile
frontend non raggiungibile
CDP non disponibile
Graph health degradato
freshness stale
runtime scraper fallito
```

Le superfici applicative possono esporre `integrity` o `persistenceComplete:false`, ma il launcher non interpreta questi stati come motivo per cancellare file, riparare journal o riavviare processi.

La recovery appartiene al contratto storage e ai processor owner. Le route read-only non eseguono repair e il frontend non legge journal.

## Shutdown

Con `Ctrl+C`, il launcher tenta prima un arresto pulito dei soli processi owned.

Dopo un’attesa limitata, il fallback sul process tree può agire soltanto su un PID owned registrato.

Non vengono terminati:

```txt
processi riusati
Chrome/CDP
processi esterni che occupano una porta preferita
tracker o scraper non-owned
```

Non vengono cancellati:

```txt
history
timeline
journal sidecar
Evidence snapshot
conferme Source Identity
dump diagnostici
cache senza policy esplicita
```

Non usare cleanup basati su:

```txt
netstat
Stop-Process
taskkill per porta
```

Il cleanup operativo di file legacy, dump o cache appartiene ai documenti di retention e validazione, non al launcher locale.

## Diagnostica rapida

| Sintomo                                    | Controllo                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| CDP non disponibile                        | Attendere Chrome dedicato oppure usare modalità Persistent.                               |
| Backend non disponibile                    | Verificare `/api/health` sull’URL effettivo scelto.                                       |
| Frontend non disponibile                   | Verificare che le dipendenze frontend e la CLI Vite locale siano disponibili.             |
| Chiamate API dal browser falliscono        | Verificare `VITE_BACKEND_TARGET` e il proxy `/api`.                                       |
| Browser non apre il frontend previsto      | Verificare l’URL frontend effettivo nel manifest runtime.                                 |
| `persistence_integrity` da API read-only   | Non trattarlo come errore launcher; consultare storage, API ed Evidence.                  |
| `persistenceComplete:false` in Evidence    | Non riavviare runtime automaticamente; verificare journal e recovery nei documenti owner. |
| Graph health o freshness Betfair degradati | Non confonderli con `partial_persistence` o `recovery_failed`.                            |

## Lock e manifest canonici

Gli artefatti effimeri vivono sotto:

```txt
launcher/.runtime/
├── launcher.lock
├── launcher.lock.guard
└── manifest.json
```

La directory è ignorata da Git. Il guard usa un lock advisory del sistema operativo; lock e manifest sono UTF-8 e condividono la stessa identità di sessione.

Lock schema 2:

```js
{
  schema: 2,
  project: "tennis-decision-ui",
  sessionId,
  pid,
  createdAt,
  processIdentity: {
    startFingerprint,
    executable
  }
}
```

Manifest schema 2:

```js
{
  schema: 2,
  project: "tennis-decision-ui",
  session: {
    sessionId,
    launcherPid,
    processIdentity: {
      startFingerprint,
      executable
    },
    startedAt,
    status,
    reason
  },
  services: {
    backend: {},
    frontend: {},
    cdp: {}
  }
}
```

Valori ammessi:

```txt
session.status
→ starting | ready | stopping | stopped | failed

service.status
→ pending | starting | ready | failed | unavailable

ownership
→ owned | reused | external | unknown
```

I servizi registrano, secondo il ruolo, `requestedPort`, `selectedPort`, `pid`, URL o health URL, `instanceId`, `startedAt`, `resolvedAt`, `source` e `reason`. Il frontend registra anche `backendTarget`. CDP non può avere ownership `owned` né un PID.

Un lock positivamente stale può essere recuperato. Uno stato attivo o non verificabile non viene rimosso in modo aggressivo.

## Riuso della sessione

Una sessione è riusabile soltanto dopo che la nuova invocazione ha acquisito un lock assente o ha recuperato un lock positivamente stale, e quando manifest schema 2 e identità dei servizi sono coerenti.

```txt
manifest reusable
+ backend identity valida
+ frontend identity valida
→ session_reuse
→ apertura del frontend esistente
→ nessun nuovo backend o frontend
→ seconda invocazione terminata autonomamente
→ rilascio del lock acquisito dalla seconda invocazione
```

L’evento `browser_open` sul frontend esistente è corretto nel solo fast path successivo all'acquisizione o al recupero del lock: riapre l’interfaccia senza acquisire ownership sui servizi già attivi. Se il lock appartiene a un launcher attivo, la seconda invocazione viene invece bloccata prima di `session_reuse` e non apre il browser.

## Ownership runtime

```txt
owned
→ processo avviato dalla sessione corrente e terminabile dal launcher

reused
→ servizio Tennis Decision UI verificato ma non posseduto

external
→ servizio esterno riconosciuto e non terminabile

unknown
→ ownership non dimostrata
```

Il launcher registra come owned soltanto backend e frontend che ha avviato. Il backend registra separatamente i propri figli Python. Chrome/CDP resta sempre `reused`, `external` o `unknown`.

## Processi Python backend-owned

Il launcher avvia o riusa il backend; non mantiene un registry concorrente degli scraper.

```txt
launcher
→ backend Express
→ backend/src/runtime/pythonProcessRegistry.js
→ figli Python registrati
```

Lo snapshot pubblico è disponibile tramite [API Runtime Health](../api/06-runtime-health.md). I lifecycle completi restano nei documenti SofaScore e Betfair.

## Verifica

Verificare almeno:

```txt
avvio normale
→ backend pronto
→ frontend pronto
→ browser aperto sull’URL frontend effettivo

riuso backend valido
→ identità Tennis Decision UI confermata
→ nessun nuovo backend duplicato

porta preferita occupata da processo esterno
→ fallback porta
→ processo esterno non terminato

CDP assente
→ backend e frontend restano avviabili
→ CDP non viene inventato su 9222

shutdown Ctrl+C
→ solo processi owned terminati
→ Chrome/CDP non terminato
→ file canonici e journal non cancellati

journal pending preesistente
→ launcher non lo legge né lo modifica
→ backend bootstrap esegue recovery prima di listen
→ esito osservabile tramite API/Evidence/storage owner
```

## Documenti collegati


* [API Runtime Health](../api/06-runtime-health.md)
* [Confini del sistema](../architecture/01-system-boundaries.md)
* [Entry point e runtime Python](../modules/python/01-entrypoints-and-runtime.md)
* [Tracking live](../modules/sofa/01-live-tracking.md)
* [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
* [Timeline e history](../modules/storage/01-timelines-and-history.md)
* [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
* [API Preflight](../api/05-preflight.md)
* [API Match](../api/01-match.md)
* [API Betfair](../api/02-betfair.md)
* [API Evidence](../api/03-evidence.md)
* [Diagnostica Betfair](./03-betfair-diagnostics.md)
* [Validazione e rollback](./04-validation-and-rollback.md)
* [Retention e cleanup](./05-retention-and-cleanup.md)
* [Mappa del repository](../reference/01-repository-map.md)

## Quando leggerlo

Leggere questo documento prima di:

* avviare `python avvio.py`;
* modificare `avvio.py`, `launcher/` o `scripts/`;
* modificare porte, proxy Vite, startup o shutdown;
* diagnosticare CDP, backend o frontend locale;
* distinguere un errore runtime locale da `partial_persistence` o `recovery_failed`;
* decidere se un processo locale può essere terminato dal launcher.
