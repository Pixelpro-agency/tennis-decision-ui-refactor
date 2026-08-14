> **Parte 7 di 7 — Post-audit e migrazione documentale**
> Controllo finale post-audit, migrazione documentale, implementazione iniziale e validazione storica di IMPL-028, chiusura archive e closeout di IMPL-015.
> [Indice](../03-audit-codice.md) · [Parte 6](06-validazione-e-test.md) · [Indice](../03-audit-codice.md)

## 23. Controllo finale post-audit e avvio della migrazione documentale

**Baseline storica del controllo originale:** `275008a5cd6451f24c6895068639ee3055395986`  
**Checkpoint storico dei registri:** `eef267aab3c138395a5ca3d644a942190c5360e8`  
**Stato del controllo storico:** `COMPLETATO E APPROVATO`

### Scopo

Questo modulo chiude la sequenza `audit-codice` come record di post-audit, migrazione documentale e closeout, senza sostituire gli owner tecnici delle aree richiamate.

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

Le idee future possono restare nei registri o nell’archivio storico, ma un documento canonico non deve presentarle come comportamento implementato.

### DOC-033 — Documentazione canonica che anticipava contratti non implementati

**Classificazione storica:** `BUG DOCUMENTALE CONFERMATO`  
**Esito storico:** `POLICY DI CORREZIONE APPROVATA E APPLICATA ALLA MIGRAZIONE`

Nel checkpoint alcuni documenti owner descrivevano come già collegati o completi comportamenti che il codice non possedeva ancora, in particolare:

```txt
session authority frontend
polling protetto da response tardive
persistence integrity UI completa
Market Reactions eligibility e availability uniformi
storage contract verificato esteso
```

#### Criterio editoriale preservato

La documentazione canonica descrive soltanto stati supportati dalle relative authority:

```txt
implementato
implementato con limiti espliciti
validato
validazione aperta
deprecato ma ancora presente
```

Le voci soltanto approvate o pianificate restano nei registri fino alla relativa implementazione. Gli stati storici devono restare qualificati temporalmente e non essere convertiti in prova corrente.

### WORKFLOW-005 — Migrazione documentale per batch

**Classificazione storica:** `WORKFLOW APPROVATO`  
**Stato al checkpoint iniziale:** `BATCH 0 PREPARATO`  
**Esito storico successivo:** `IMPL-032 COMPLETATA`

La migrazione non era prevista come rinomina massiva.

Ogni batch doveva includere:

```txt
SHA base
file completi
mapping vecchio → nuovo
owner e stato
link da aggiornare
controlli eseguiti
limiti
rollback
```

Prima della consegna erano richiesti:

1. completezza dell’inventario;
2. assenza di informazioni tecniche uniche perse;
3. coerenza col codice corrente;
4. distinzione fra corrente, storico, deprecato e futuro;
5. link relativi;
6. assenza di duplicati canonici;
7. nessuna cancellazione anticipata.

La migrazione canonica finale risulta storicamente chiusa tramite `IMPL-032`; il workflow resta documentato come parte del processo storico di migrazione.

### TEST-076…079 — Controlli della migrazione

I controlli storicamente associati alla migrazione erano:

```txt
TEST-076
→ tutti i documenti indicizzati inventariati una sola volta

TEST-077
→ mapping univoco .mdx → .md e nessun duplicato canonico

TEST-078
→ link dei file migrati validi e nessun riferimento a path rimossi

TEST-079
→ stato corrente/deprecato/storico/futuro coerente con codice e registri
```

`TEST-076` fu eseguito nel Batch 0 sui quaranta documenti allora elencati dall’indice canonico.

`TEST-077…079` avevano uno stato intermedio `CONFERMATO` nel Batch 0 e risultano successivamente registrati come `COMPLETATO`. I due momenti non sono stati fusi retroattivamente: lo stato intermedio resta parte della cronologia, mentre la completion successiva ne rappresenta l’esito storico finale.

Il manifest del runner include, tra le entry abilitate, il registry consistency checker e il link checker Markdown/MDX. La loro presenza nel manifest descrive la configurazione del runner e non costituisce da sola un nuovo risultato di esecuzione.

### Confini storici del Batch 0

Il Batch 0 produceva soltanto:

```txt
aggiornamento dei registri
inventario documenti
manifest di migrazione
owner matrix
link report
piano dei batch
checklist di validazione
```

Non sostituiva, rinominava o eliminava alcun documento canonico in quella fase.

---

## 24. Schede owner dei controlli di migrazione documentale

Le righe sintetiche `TEST-076…079` erano già presenti nella Todo e il controllo di coerenza aveva confermato l’assenza, in quel momento, delle corrispondenti schede owner singole.

Le schede seguenti conservarono il significato dei test senza rinumerarli.

### TEST-076 — Inventario univoco dei documenti canonici

**Stato storico finale registrato:** `COMPLETATO`  
**Area:** migrazione documentale

Verifica che tutti i documenti indicizzati siano inventariati una sola volta. Il controllo fu eseguito nel Batch 0 sui quaranta documenti dell’indice canonico allora corrente.

### TEST-077 — Mapping univoco MDX → Markdown

**Stato storico finale registrato:** `COMPLETATO`  
**Stato al Batch 0:** `CONFERMATO`; da ripetere durante i batch allora futuri.  
**Area:** migrazione documentale

Verifica, per ogni batch, che ogni sostituzione abbia un solo mapping, che il nuovo owner sia identificato e che la sovrapposizione temporanea `.mdx`/`.md` non venga presentata come doppia fonte canonica.

### TEST-078 — Link relativi dei file migrati

**Stato storico finale registrato:** `COMPLETATO`  
**Stato al Batch 0:** `CONFERMATO`; da ripetere durante i batch allora futuri.  
**Area:** migrazione documentale

Verifica che i link relativi risolvano sulla working tree combinata e distingue target mancanti, anchor mancanti o non verificabili e riferimenti `.mdx` ammessi soltanto durante la transizione.

`scripts/validation/test-manifest.json` registra `scripts/check_documentation_links.py --forbid-mdx-links` come controllo documentale abilitato nei profili `fast` e `full-offline`. La presenza dell’entry descrive la configurazione del runner e non costituisce da sola un PASS.

### TEST-079 — Coerenza fra corrente, deprecato, storico e futuro

**Stato storico finale registrato:** `COMPLETATO`  
**Stato al Batch 0:** `CONFERMATO`; da ripetere durante i batch allora futuri.  
**Area:** migrazione documentale

Verifica che gli owner canonici descrivano il codice corrente, che le validazioni storiche non diventino prove correnti, che i componenti deprecati restino espliciti finché esistono e che il planning futuro non sia presentato come implementato.

---

## 24.1 Implementazione iniziale di IMPL-028

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

## 25. Chiusura archive e completamento IMPL-015

### Archive closeout storico

**Baseline archive storica:** `2697f66ea8e17a9e35481299cb47ec402558df55`

Nel closeout originale furono controllati tutti i 64 Markdown della superficie documentale allora pubblicata e, separatamente, i due ODT presenti in `docs/archive/planning/legacy/`.

L’esito registrato fu:

```txt
owner canonici → mantenuti
validations con evidenza → mantenute
registri e audit di lavoro → mantenuti
8 Markdown archive duplicati → consolidati e rimossi
2 ODT → letti, requisiti unici consolidati e rimossi
archive → solo registro fonte/destinazione
```

Furono corrette anche due dichiarazioni allora obsolete: il runner canonico era disponibile e `IMPL-032` risultava completata. La pulizia non modificava il codice runtime.

Questi conteggi e questa disposizione dell’archive sono una fotografia storica della baseline `2697f66…` e non costituiscono la policy archive corrente.

### Esito storico di IMPL-015

Il closeout registrava:

```txt
Prompt 1 e Fix 1:
ac0361ef720831173619636b8ce0057348282fa4

Prompt 2 e Fix 1:
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

Nessuna task successiva risulta selezionata nel closeout.
