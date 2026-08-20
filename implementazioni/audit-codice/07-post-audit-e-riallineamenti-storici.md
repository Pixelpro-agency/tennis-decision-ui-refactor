> **Parte 7 di 7 — Post-audit e riallineamenti storici**
> Controllo finale post-audit, implementazione iniziale e validazione storica di IMPL-028 e closeout di IMPL-015.
> [Indice](../03-audit-codice.md) · [Parte 6](06-validazione-e-test.md)

## 23. Controllo finale post-audit e riallineamenti storici

**Baseline storica del controllo originale:** `275008a5cd6451f24c6895068639ee3055395986`  
**Checkpoint storico dei registri:** `eef267aab3c138395a5ca3d644a942190c5360e8`  
**Stato del controllo storico:** `COMPLETATO E APPROVATO`

### Scopo

Questo modulo chiude la sequenza `audit-codice` come record di post-audit e closeout storici, senza sostituire gli owner tecnici delle aree richiamate.

Il controllo trasversale originale aveva seguito il percorso:

```txt
acquisizione SofaScore / Betfair
→ scheduler e processi Python
→ Source Identity Gate
→ commit history/timeline
→ journal e recovery
→ API read-only
→ Evidence e Market Reactions
→ polling e presentazione frontend
→ test e documentazione
```

Quel controllo non aveva eseguito suite o collaudi live: aveva confrontato codice, documenti owner, test presenti e decisioni approvate nel checkpoint di allora.


### Esito storico di completezza

Nel controllo originale non era emersa una nuova area critica della raccolta dati dimenticata dai Punti 1–7.

I gap principali allora registrati riguardavano:

```txt
writer authority
session authority
Betfair runtime authority
local control-plane
storage/recovery verificati
provenance temporale
eligibility Evidence
polling session-scoped
integrity UI
runner e fixture
```

Questa è una fotografia storica del checkpoint, non una lista dello stato corrente.

La distinzione che resta obbligatoria è:

```txt
decisione o contratto approvato nei registri
≠
comportamento realmente implementato nel prodotto
```

### Stato successivo rispetto al checkpoint originale

| Area                           | Stato successivo rispetto al checkpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writer authority backend-owned | `backend/src/server.js` crea e acquisisce la writer authority prima della recovery e prima del listener. Un’acquisizione non positiva blocca il bootstrap. `backend/src/runtime/matchHistoryWriterAuthority.js` blocca owner attivi o non verificabili e recupera soltanto record classificati stale, compresi PID positivamente morti o riciclati. La writer authority non è quindi più una funzionalità non implementata.                                                                                                                        |
| Recovery bootstrap             | Dopo l’acquisizione della writer authority, `runPendingCommitRecovery()` viene eseguita prima del `listen`; una recovery fatal blocca il listener. I record completati vengono verificati contro i target e, se un target manca o non è JSON valido, il documento viene riaperto nel journal e sottoposto a repair. Il vecchio gap “writer authority prima della recovery” risulta quindi superato dal comportamento implementato.                                                                                                                 |
| Lifecycle di shutdown          | Lo shutdown imposta il terminal tracker barrier, drena le operazioni tracker e rilascia la writer authority soltanto dopo drain positivo; se il drain fallisce, l’authority viene mantenuta.                                                                                                                                                                                                                                                                                                                                                       |
| `trackingSessionId`            | Il backend genera un `trackingSessionId`, lo conserva nel tracker e lo restituisce da `/api/match/track`. Gli update SofaScore/Betfair ricevono un controllo `isTrackingSessionCurrent`; il frontend richiede il token dalla risposta di Start e lo conserva nello stato della sessione. La voce storica “`trackingSessionId` non implementato end-to-end” non descrive quindi più l’intero stato tecnico.                                                                                                                                         |
| Autorità dei comandi live      | `stopMatchTracking()` invia ancora soltanto `eventId`; `/api/match/stop` non richiede `trackingSessionId` o `commandId` e lo scope restituito è `all-live-tracking`. La risposta espone `ok`, `stopped` e il dettaglio `pythonCleanup`. La session authority dei comandi resta quindi incompleta end-to-end.                                                                                                                                                                                                                                       |
| Runner di validazione          | `scripts/validation/run.mjs` e `scripts/validation/test-manifest.json` sono presenti. I profili `fast`, `backend`, `frontend`, `python` e `full-offline` risultano abilitati nel manifest; `persistence`, `benchmark` e `live` risultano disabilitati e pianificati. Il runner esegue le entry selezionate serialmente e separa esito test (`0`/`1`) da errore di configurazione (`2`). `IMPL-028` non è quindi più soltanto una previsione documentale; le esecuzioni PASS riportate più avanti restano evidence storica del relativo checkpoint. |

### Snapshot storico delle funzionalità non implementate al checkpoint originale

Nel checkpoint del controllo originale erano riportati come non implementati:

- `trackingSessionId` e `commandId` end-to-end;
- writer authority backend-owned prima della recovery;
- scraper Betfair legato alla sessione logica;
- Stop con esito completo/parziale;
- canonical document contract con revision/head/digest;
- polling frontend con abort e generation guard uniformi;
- UI persistence locale e globale;
- eligibility e provenance complete delle Market Reactions;
- runner canonico di validazione.

Questa lista viene conservata esclusivamente per mantenere la cronologia. Non deve essere usata come descrizione corrente: writer authority e runner sono oggi implementati; `trackingSessionId` è presente in una parte sostanziale del flusso, mentre l’autorità dei comandi resta incompleta.

### Decisione storica sulle nuove funzionalità

Nel closeout originale era stata approvata la regola di non aprire nuove funzionalità prima della stabilizzazione del nucleo.

L’ordine registrato era:

```txt
struttura documentale
→ validazione minima ripetibile
→ autorità runtime e storage
→ frontend ed Evidence
→ baseline e replay
→ nuova analisi funzionale
```

Questa sequenza resta una decisione storica del checkpoint e non rappresenta una roadmap corrente.

## 24. Implementazione iniziale di IMPL-028

**Data storica:** `2026-08-03`  
**Stato iniziale registrato:** `IMPLEMENTATA, DA VALIDARE SULLA WORKING TREE LOCALE`  
**Stato storico finale del checkpoint:** `IMPLEMENTATA E VALIDATA LOCALMENTE`

### Perimetro storico

Fu introdotta la prima versione del runner locale a manifest senza modificare runtime, tracker, scraper o contratti applicativi.

```txt
scripts/validation/test-manifest.json
scripts/validation/run.mjs
scripts/validation/support/
scripts/validation/run.test.mjs
scripts/validation/manifest-schema.json
scripts/validation/result-schema.json
```

Questi elementi risultano ancora presenti.

### Comportamento del runner

Il runner corrente:

```txt
riceve un profilo esplicito
→ carica e valida il manifest
→ seleziona le entry abilitate
→ risolve i path prima dell'esecuzione
→ esegue le entry serialmente
→ limita l'output per stream
→ può produrre un result artifact sotto test-results/
→ restituisce 0 per run passed, 1 per run failed, 2 per errori di configurazione/uso
```

L’esecuzione live richiede anche `--allow-live`, ma il profilo `live` nel manifest corrente è disabilitato. Il manifest mantiene inoltre disabilitati `persistence` e `benchmark`.

### Manifest del runner

I profili abilitati sono:

```txt
fast
backend
frontend
python
full-offline
```

Le entry abilitate corrispondono ancora ai conteggi del checkpoint post-correzione:

```txt
fast → 6
backend → 4
frontend → 5
python → 5
full-offline → 17
```

`backend-commit-id` resta catalogata ma disabilitata: il manifest la qualifica come debito noto della sandbox del test, perché `commitId.test.mjs` può scrivere `virtual-commit-id-journal` sotto `process.cwd()` senza cleanup garantito.

I profili non abilitati sono:

```txt
persistence → planned
benchmark → planned
live → planned
```

La loro presenza nel manifest non equivale a implementazione o validazione.

### Evidence storica di validazione

Nel checkpoint furono registrate le seguenti verifiche del pacchetto:

```txt
node --check sui file .mjs
JSON parse dei tre file JSON
17 test runner passati
0 falliti
```

In una repository sintetica furono inoltre registrati:

```txt
fast → 6/6
backend → 6/6
frontend → 5/5
python → 5/5
full-offline → 19/19
```

Quella prova validava infrastruttura, selezione e artifact della versione allora preparata; non equivaleva all’esecuzione dei test applicativi reali.

### Correzione post-validazione locale del manifest

Il preflight reale sulla working tree Windows rilevò due `pathChecks` inesistenti per journal e recovery. Tutti i profili restituirono exit code `2` prima di avviare child process, confermando il comportamento fail-closed del runner.

Le entry `backend-commit-journal` e `backend-recovery` furono rimosse dal manifest. Non era disponibile evidence di test sostitutivi con quei contratti nel percorso allora corrente; la copertura non venne conteggiata come PASS o skip. I conteggi corretti divennero `backend 4` e `full-offline 17`.

### Esito storico finale sulla working tree reale

Dopo la correzione del manifest e l’hotfix Windows per l’invocazione di `npm.cmd`, nel checkpoint furono registrati i cinque profili eseguibili come PASS:

```txt
fast → PASS
backend → PASS
frontend → PASS
python → PASS
full-offline → PASS
```

Questo esito è evidence locale storica di `IMPL-028` e non costituisce una validazione live.

Restano non abilitati i profili `persistence`, `benchmark` e `live`.

---

## 25. Completamento IMPL-015

### Esito storico di IMPL-015

Commit storici:

```txt
ac0361ef720831173619636b8ce0057348282fa4
f86ac267919ca13859c98db7015362f26176ba36
```

Il risultato storico dichiarato era:

```txt
writer authority backend-owned
→ acquisizione prima della recovery
→ active e unknown bloccanti
→ reclaim soltanto su owner positivamente morto
→ listener readiness
→ release nei failure path
→ terminal tracker barrier
→ tracker drain
→ authority retained se il drain fallisce
```

### Stato implementato di IMPL-015

Il comportamento implementato comprende:

1. `backend/src/runtime/matchHistoryWriterAuthority.js` identifica l’owner tramite `backendInstanceId`, PID, fingerprint di avvio processo, repository identity e storage identity.
2. Record `active` appartenenti a un altro backend bloccano l’acquisizione; record `unknown` bloccano senza essere cancellati.
3. Il reclaim è limitato a record classificati stale, inclusi PID non trovati e PID riciclati con fingerprint diverso.
4. `backend/src/server.js` acquisisce l’authority prima della recovery; se l’acquisizione non riesce, recovery e listener non partono.
5. Recovery fatal, eccezioni di recovery, errori di listen e failure di bootstrap rilasciano l’authority tramite i relativi failure path.
6. In shutdown il server drena le operazioni tracker prima di rilasciare l’authority. Se il drain non è positivo, l’authority resta retained.
7. `backend/src/sofa/matchHistory/recovery.js` verifica i target di record completati e riapre i documenti mancanti o non validi prima del repair, invece di assumere che il solo stato del journal equivalga a persistenza completa.

I test automatici associati codificano gli stessi contratti: `matchHistoryWriterAuthority.test.mjs` copre, tra gli altri casi, secondo writer live bloccato, reclaim di owner morto/PID riciclato e blocco fail-closed su stato unknown; `server.test.mjs` copre ordine `acquire → recovery → listen`, bootstrap bloccato senza authority, due bootstrap concorrenti sullo stesso storage e ordinamento drain/release.

I conteggi registrati nel closeout storico sono:

```txt
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
falliti: 0
```

### Limite di validazione live

Nel closeout storico risultava non eseguito:

```txt
collaudo manuale con due backend reali concorrenti
→ non eseguito
```


### RUNTIME-002 nel contesto di questo closeout

Nel report storico `RUNTIME-002` risultava aperta. Quel dato resta una qualificazione del checkpoint, non viene assunto come stato corrente del registro.

Sul piano tecnico, la situazione successiva è più avanzata ma non completa:

```txt
trackingSessionId
→ generato dal backend allo Start
→ conservato nel tracker
→ restituito da /api/match/track
→ richiesto dal frontend come condizione di Start riuscito
→ usato nelle guardie interne isTrackingSessionCurrent

comandi Stop
→ request con eventId
→ nessun trackingSessionId nel comando
→ nessun commandId
→ scope all-live-tracking
```

Il perimetro tecnico resta quindi parziale: `trackingSessionId` è implementato per Start, bootstrap UI e guardie interne, mentre Stop non è session-scoped e non usa `commandId`. Lo stato della task `RUNTIME-002` appartiene al relativo owner/registro.

`RUNTIME-003`, `DOC-024` e `TEST-004` risultavano chiusi nel closeout storico da `IMPL-015`; anche questa relazione viene conservata come informazione storica e non usata per riscrivere retroattivamente i registri.