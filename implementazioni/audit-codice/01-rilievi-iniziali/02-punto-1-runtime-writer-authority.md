> **Parte 1B di 7 — Punto 1: runtime e writer authority**
> Secondo audit del Punto 1 su entry point, launcher e autorità runtime, seguito dall’esito storico di IMPL-015.
> [Indice](../../03-audit-codice.md) · [Facade Parte 1](../01-rilievi-iniziali.md) · [Parte 1A](01-checkpoint-b3-b6.md) · [Parte 2](../02-runtime-sessioni-betfair.md)

# Tennis Decision UI — Punto 1: runtime e writer authority

## 16. Secondo audit del codice — Punto 1: entry point, launcher e autorità runtime

**Baseline:** `dda406c4a07ae4a1debfcab39db346e47c33c419`

### Esito launcher

Restano confermati:

- wrapper `avvio.py` sottile;
- launcher lock prima del riuso;
- classificazione conservativa del lock;
- fingerprint del processo contro PID riciclati;
- massimo cinque porte candidate;
- riuso soltanto dopo verifica identità;
- ownership limitata a backend/frontend avviati;
- Chrome/CDP non owned;
- nessun kill-by-port;
- shutdown idempotente;
- recovery prima di `listen`.

Non è stata trovata una ragione per riaprire il lifecycle del launcher.

### RUNTIME-003 — Gli avvii manuali aggirano l’autorità del launcher

**Stato:** `COMPLETATO SU f86ac26`
**Priorità:** alta
**Area:** backend bootstrap e persistenza canonica

Percorsi pubblici:

```txt
node backend/src/server.js
npm start
npm run dev
scripts/start-backend-dev.ps1
```

prima di IMPL-015 entravano in `startServer()` senza acquisire il launcher lock e senza acquisire una writer authority specifica.

Il rischio storico era che due backend potessero vivere su porte differenti e condividere:

```txt
backend/match_history
backend/match_history/.pending_commits
```

Il problema non è il contenuto parziale del singolo file: le scritture atomiche lo proteggono. Il problema è la concorrenza logica tra due processi con:

- recovery separate;
- mappe runtime separate;
- journal osservati in momenti differenti;
- commit distinti;
- rinomina concorrente sullo stesso target;
- tracking e processi Python separati.

### DOC-024 — Ownership del processo e autorità sulla persistenza sono concetti distinti

**Stato:** `COMPLETATO DAL RIALLINEAMENTO DOCUMENTALE IMPL-015`

La documentazione runtime descrive correttamente:

```txt
launcher
→ ownership dei processi avviati
```

ma prima del riallineamento IMPL-015 non formalizzava:

```txt
backend writer authority
→ diritto esclusivo di recovery e scrittura canonica
```

Il riallineamento IMPL-015 esplicita ora che:

```txt
process ownership
≠
persistence authority
```

### TEST-004 — Esclusione tra due backend writer

**Stato:** `IMPLEMENTATO E PASSATO`

Scenario minimo:

```txt
backend A
→ acquisisce writer authority

backend B
→ tenta startup
→ non esegue recovery
→ non apre la porta
→ restituisce/logga reason strutturata

backend A termina
→ authority rilasciata

backend C
→ può acquisire authority e avviarsi
```

I test implementati coprono anche:

- lock stale positivamente verificato;
- lock non verificabile fail-closed;
- import del server senza acquisizione;
- failure durante recovery;
- shutdown e rilascio idempotente.

### Decisione implementata

```txt
un solo backend writer per repository/storage identity
→ writer authority esclusiva backend-owned
→ acquisita prima di recovery e listener readiness
→ secondo backend bloccato
→ launcher lock mantenuto separato
```

Non sono stati introdotti:

- multi-writer;
- backend secondario read-only;
- lock basato soltanto sulla porta;
- kill del writer esistente;
- riuso del launcher lock come writer authority.

### Esito implementazione IMPL-015

```txt
Prompt 1
→ modulo matchHistoryWriterAuthority
→ repository identity e storage identity
→ classificazione owner active / dead / unknown
→ acquire e release serializzati

Prompt 2
→ authority creata in startServer()
→ acquire prima della recovery
→ listener readiness reale
→ release nei failure path del bootstrap
→ integrazione nello shutdown

Fix 1
→ registro process-local delle operazioni tracker
→ terminal tracker barrier
→ tracker drain prima del release
→ authority retained su drain failure
→ force timeout senza release anticipato
```

File implementati e verificati:

```txt
backend/src/runtime/matchHistoryWriterAuthority.js
backend/src/runtime/matchHistoryWriterAuthority.test.mjs
backend/src/server.js
backend/src/server.test.mjs
backend/src/sofa/matchTracker.js
backend/src/sofa/matchTracker.test.mjs
```

Commit:

```txt
ac0361ef720831173619636b8ce0057348282fa4
f86ac267919ca13859c98db7015362f26176ba36
```

Test automatici:

```txt
writer authority: 26 passati
matchTracker: 10 passati
server: 30 passati
falliti: 0
```

Limite verificato:

```txt
collaudo manuale con due backend reali concorrenti
→ non eseguito
```

RUNTIME-002 e gli altri finding della session authority restano invariati.

---
