> **Parte 7 di 7 — Post-audit e migrazione documentale**
> Controllo finale post-audit, schede di migrazione, implementazione iniziale IMPL-028, chiusura archive e completamento IMPL-015.
> [Indice](../03-audit-codice.md) · [Parte 6](06-validazione-e-test.md) · [Indice](../03-audit-codice.md)

<!-- AUDIT-CODE-ORIGINAL-START source-lines=6279-6663 sha256=de9e2acb06d73ef478a29a3e7d0edcbc6b6ef4aacbdb0bce57fb48ccdbfc55a9 -->
## 23. Controllo finale post-audit e avvio della migrazione documentale

**Baseline del codice verificato:** `275008a5cd6451f24c6895068639ee3055395986`
**Checkpoint dei registri:** `eef267aab3c138395a5ca3d644a942190c5360e8`
**Stato:** `COMPLETATO E APPROVATO`

### Scopo

Dopo i Punti 1–7 è stato eseguito un controllo trasversale finale sul percorso:

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

Il controllo non ha eseguito suite o collaudi live. Ha confrontato codice corrente, documenti owner, test presenti e decisioni approvate.

### Esito di completezza

Non è emersa una nuova area critica della raccolta dati dimenticata dai Punti 1–7.

Sono già registrati i gap principali relativi a:

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

La distinzione obbligatoria è:

```txt
decisione o contratto approvato nei registri
≠
comportamento già implementato nel prodotto
```

Esempi ancora non implementati al checkpoint:

- `trackingSessionId` e `commandId` end-to-end;
- writer authority backend-owned prima della recovery;
- scraper Betfair legato alla sessione logica;
- Stop con esito completo/parziale;
- canonical document contract con revision/head/digest;
- polling frontend con abort e generation guard uniformi;
- UI persistence locale e globale;
- eligibility e provenance complete delle Market Reactions;
- runner canonico di validazione.

### Decisione sulle nuove funzionalità

Non aprire nuove funzionalità prima della stabilizzazione del nucleo.

Ordine:

```txt
struttura documentale
→ validazione minima ripetibile
→ autorità runtime e storage
→ frontend ed Evidence
→ baseline e replay
→ nuova analisi funzionale
```

Le idee future possono restare nei registri o in archivio storico, ma non devono essere presentate come stato corrente della documentazione canonica.

### DOC-033 — Documentazione canonica che anticipa contratti non implementati

**Classificazione:** `BUG DOCUMENTALE CONFERMATO`
**Stato:** `POLICY DI CORREZIONE APPROVATA`
**Priorità:** critica per la riscrittura

Alcuni documenti owner descrivono come già collegati o completi comportamenti che il codice non possiede ancora, in particolare:

```txt
session authority frontend
polling protetto da response tardive
persistence integrity UI completa
Market Reactions eligibility e availability uniformi
storage contract verificato esteso
```

#### Policy approvata

La documentazione canonica nuova descrive soltanto:

```txt
implementato
implementato con limiti espliciti
validato
validazione aperta
deprecato ma ancora presente
```

Le voci soltanto approvate o pianificate restano nei registri fino alla relativa implementazione.

### WORKFLOW-005 — Migrazione documentale per batch

**Classificazione:** `WORKFLOW APPROVATO`
**Stato storico del checkpoint:** `BATCH 0 PREPARATO`; `IMPL-032` è stata completata nel checkpoint documentale successivo.

La migrazione non viene eseguita con una rinomina massiva.

Ogni batch deve includere:

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

Prima della consegna verificare:

1. completezza dell’inventario;
2. assenza di informazioni tecniche uniche perse;
3. coerenza col codice corrente;
4. distinzione fra corrente, storico, deprecato e futuro;
5. link relativi;
6. assenza di duplicati canonici;
7. nessuna cancellazione anticipata.

### TEST-076…079 — Controlli della migrazione

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

`TEST-076` è stato eseguito nel Batch 0 sui quaranta documenti elencati dall’indice canonico.

`TEST-077…079` devono essere ripetuti per ogni batch e prima della rimozione finale dei `.mdx`.

### Confini del Batch 0

Il Batch 0 produce soltanto:

```txt
aggiornamento dei registri
inventario documenti
manifest di migrazione
owner matrix
link report
piano dei batch
checklist di validazione
```

Non sostituisce, rinomina o elimina alcun documento canonico.

---

## 24. Schede owner dei controlli di migrazione documentale

Le righe sintetiche `TEST-076…079` erano già presenti nella Todo e il controllo
di coerenza ha confermato l'assenza delle corrispondenti schede owner singole.
Le schede seguenti completano il registro senza rinumerare o cambiare il
significato dei test.

### TEST-076 — Inventario univoco dei documenti canonici

**Stato:** `COMPLETATO`
**Area:** migrazione documentale

Verifica che tutti i documenti indicizzati siano inventariati una sola volta.
Il controllo è stato eseguito nel Batch 0 sui quaranta documenti dell'indice
canonico allora corrente.

### TEST-077 — Mapping univoco MDX → Markdown

**Stato:** `CONFERMATO`
**Area:** migrazione documentale

Verifica, per ogni batch, che ogni sostituzione abbia un solo mapping, che il
nuovo owner sia identificato e che la sovrapposizione temporanea `.mdx`/`.md`
non venga presentata come doppia fonte canonica.

### TEST-078 — Link relativi dei file migrati

**Stato:** `CONFERMATO`
**Area:** migrazione documentale

Verifica che i link relativi risolvano sulla working tree combinata e distingue
target mancanti, anchor mancanti o non verificabili e riferimenti `.mdx` ancora
ammessi soltanto durante la transizione. `scripts/check_documentation_links.py`
fornisce ora il controllo ricorsivo read-only.

### TEST-079 — Coerenza fra corrente, deprecato, storico e futuro

**Stato:** `CONFERMATO`
**Area:** migrazione documentale

Verifica che gli owner canonici descrivano il codice corrente, che le
validazioni storiche non diventino prove correnti, che i componenti deprecati
restino espliciti finché esistono e che il planning futuro non sia presentato
come implementato.

---

## 24.1 Implementazione iniziale di IMPL-028

**Data:** `2026-08-03`
**Stato:** `IMPLEMENTATA, DA VALIDARE SULLA WORKING TREE LOCALE`

### Perimetro

È stata introdotta la prima versione del runner locale a manifest senza modificare runtime, tracker, scraper o contratti applicativi.

```txt
scripts/validation/test-manifest.json
scripts/validation/run.mjs
scripts/validation/support/
scripts/validation/run.test.mjs
manifest-schema.json
result-schema.json
```

### Comportamento implementato

```txt
profilo esplicito
→ preflight dell'intero manifest
→ selezione entry abilitate
→ esecuzione seriale in child process separati
→ timeout per entry
→ output redatto e bounded
→ exit code 0 / 1 / 2
→ result artifact atomico sotto test-results/
```

Il profilo `fast` rifiuta entry che dichiarano browser, credenziali, rete esterna o tracking. `full-offline` non accetta entry live.

### Manifest iniziale

Sono registrati:

- checker documentali;
- test del runner;
- test backend selezionati e verificati nel Punto 7;
- test frontend Node selezionati e build;
- compileall Python;
- moduli unittest Python enumerati esplicitamente.

`commitId.test.mjs` è catalogato ma disabilitato finché non usa una sandbox temporanea con cleanup garantito. Non viene nascosto come PASS o skip ordinario.

### Limiti dichiarati

- esecuzione interamente seriale;
- mappa dei test non ancora completa (`IMPL-003`);
- artifact corrente senza ledger storico (`IMPL-031`);
- nessun harness persistence (`IMPL-008`);
- nessun benchmark (`IMPL-013`);
- nessun frontend interaction harness (`IMPL-030`);
- nessun browser, login, tracking o test live;
- nessuna CI.

### Verifica del pacchetto

```txt
node --check sui file .mjs
JSON parse dei tre file JSON
17 test runner passati
0 falliti
```

Il manifest e i cinque profili offline sono stati inoltre eseguiti su una repository sintetica che riproduce path, comandi e package boundary senza contenere il codice applicativo:

```txt
fast → 6/6
backend → 6/6
frontend → 5/5
python → 5/5
full-offline → 19/19
```

Questa prova valida infrastruttura, selezione e artifact; non equivale all'esecuzione dei test applicativi reali. Non è stato possibile eseguire i profili backend/frontend/python completi sul codice reale nell'ambiente di preparazione perché non contiene la working tree applicativa. La validazione operativa deve essere eseguita sulla copia locale dell'utente e il risultato non va anticipato.

### Correzione post-validazione locale del manifest

Il preflight reale sulla working tree Windows ha rilevato due `pathChecks` inesistenti per journal e recovery. Tutti i profili hanno restituito exit code `2` prima di avviare child process, confermando il comportamento fail-closed del runner.

Le entry `backend-commit-journal` e `backend-recovery` sono state rimosse dal manifest. Non esiste evidenza di test sostitutivi con quei contratti nel percorso corrente; la copertura resta aperta e non viene conteggiata come PASS o skip. I conteggi corretti sono `backend 4` e `full-offline 17`.

### Esito finale post-correzione sulla working tree reale

Dopo la correzione del manifest e l'hotfix Windows per l'invocazione di `npm.cmd`, i cinque profili eseguibili sono stati rieseguiti sulla working tree reale:

```txt
fast → PASS
backend → PASS
frontend → PASS
python → PASS
full-offline → PASS
```

Questo esito chiude la validazione locale di `IMPL-028`. Restano non implementati i profili `persistence`, `benchmark` e `live`; la mappa completa test ↔ owner ↔ documento resta `IMPL-003`.

## 25. Chiusura archive e completamento IMPL-015

**Baseline archive:** `2697f66ea8e17a9e35481299cb47ec402558df55`

Sono stati controllati tutti i 64 Markdown della superficie documentale pubblicata e, separatamente, i due ODT presenti in `docs/archive/planning/legacy/`.

Esito archive:

```txt
owner canonici → mantenuti
validations con evidenza → mantenute
registri e audit di lavoro → mantenuti
8 Markdown archive duplicati → consolidati e rimossi
2 ODT → letti, requisiti unici consolidati e rimossi
archive → solo registro fonte/destinazione
```

Sono state corrette anche due dichiarazioni obsolete: il runner canonico è disponibile e `IMPL-032` è completata. La pulizia non cambia codice runtime.

### Esito implementazione IMPL-015

```txt
Prompt 1 e Fix 1:
ac0361ef720831173619636b8ce0057348282fa4

Prompt 2 e Fix 1:
f86ac267919ca13859c98db7015362f26176ba36
```

Risultato:

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

Test automatici:

```txt
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
falliti: 0
```

Limite:

```txt
collaudo manuale con due backend reali concorrenti
→ non eseguito
```

`RUNTIME-003`, `DOC-024` e `TEST-004` sono chiusi da IMPL-015. `RUNTIME-002` e gli altri finding della session authority restano aperti e non vengono assorbiti.

Nessuna task successiva viene selezionata da questo riallineamento.
<!-- AUDIT-CODE-ORIGINAL-END -->
