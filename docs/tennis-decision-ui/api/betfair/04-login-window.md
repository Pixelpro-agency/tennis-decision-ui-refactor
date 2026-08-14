# API Betfair — login window

## Endpoint

```txt
POST /api/betfair/login-window
```

La route appartiene al router Betfair montato su `/api/betfair` e richiede nel body JSON i campi opzionali:

```txt
url
mode
profileDir
cdpUrl
```

Un target `url` non vuoto è necessario per avviare l'apertura della finestra; quando `mode` è `"cdp"`, è inoltre richiesta una `cdpUrl` valida. Un target assente o vuoto non produce errore: la route risponde `no_target` senza avviare alcun processo.

## Contratto HTTP

| Caso                         | HTTP  | Body pubblico                                                                                              |
| ---------------------------- | ----: | ---------------------------------------------------------------------------------------------------------- |
| Target vuoto                 | `200` | `{ ok: true, status: "no_target", opened: false, reused: false }`                                          |
| URL Betfair non valida       | `400` | `{ ok: false, code: "betfair_url_invalid", error: "Invalid Betfair URL" }`                                 |
| CDP assente                  | `400` | `{ ok: false, code: "cdp_url_required", error: "CDP URL required" }`                                       |
| CDP non valida               | `400` | `{ ok: false, code: "cdp_url_invalid", error: "Invalid CDP URL" }`                                         |
| Scraper assente              | `500` | `{ ok: false, code: "scraper_not_found", error: "Betfair scraper not available" }`                         |
| Primo avvio compatibile      | `200` | `{ ok: true, status: "started", opened: true, reused: false }`                                             |
| Login compatibile già attivo | `200` | `{ ok: true, status: "already_active", opened: true, reused: true }`                                       |
| Runtime incompatibile        | `409` | `{ ok: false, code: "login_runtime_conflict", error: "An incompatible login session is already active." }` |
| Spawn fallito                | `500` | `{ ok: false, code: "login_spawn_failed", error: "Unable to open Betfair login window." }`                 |

`started` viene restituito soltanto dopo che il processo Python ha completato con successo `spawnReady`.

Un `HTTP 200` con `started` o `already_active` conferma l'avvio o il riuso del processo login, non che l'utente abbia completato il login Betfair.

## Target URL Betfair

Il campo `url` viene normalizzato e validato prima dello spawn.

Un valore `undefined`, `null` o una stringa vuota dopo `trim()` viene trattato come target vuoto e produce `no_target`.

Per essere accettato, un target non vuoto deve:

- essere una stringa;
- usare `https:`;
- avere host esattamente tra `betfair.it`, `www.betfair.it`, `betfair.com` e `www.betfair.com`;
- non contenere username o password nella URL;
- non usare una porta esplicita.

La login window non richiede che il target contenga un event ID.

Il target normalizzato viene passato al processo Python, ma non partecipa alla runtime identity usata per deduplicare le richieste login.

## Mode, `profileDir` e `cdpUrl`

La route normalizza `mode` con questa regola:

```txt
mode === "cdp" → "cdp"
qualsiasi altro valore → "persistent"
```

Non esiste quindi un errore `mode_invalid` per questo endpoint.

### Modalità `persistent`

In modalità `persistent`:

- `profileDir` viene accettata soltanto se è una stringa;
- il valore viene normalizzato con `trim()`;
- un valore non stringa o vuoto diventa `""`;
- `cdpUrl` non partecipa alla runtime identity e non viene aggiunta agli argomenti Python.

La runtime identity è:

```txt
mode + profileDir
```

### Modalità `cdp`

In modalità `cdp`, `cdpUrl` è obbligatoria e viene normalizzata prima dello spawn.

Una `cdpUrl` valida deve:

- usare `http:`;
- puntare a `127.0.0.1`, `localhost` oppure `::1`;
- includere una porta esplicita compresa fra `1` e `65535`;
- non contenere username o password;
- non contenere query string o fragment;
- non contenere un path diverso da `/`.

Gli slash finali vengono rimossi durante la normalizzazione.

La runtime identity è:

```txt
mode + cdpUrl normalizzata
```

`profileDir` non partecipa alla runtime identity CDP.

## Argomenti del processo Python

La login window usa lo scraper Betfair in modalità `--login-only`.

La base degli argomenti è:

```txt
<scraperPath>
<url normalizzata>
--login-only
--mode
<persistent|cdp>
```

In modalità `persistent`, una `profileDir` non vuota aggiunge:

```txt
--profile-dir
<profileDir normalizzata>
```

In modalità `cdp` vengono aggiunti sempre:

```txt
--cdp-url
<cdpUrl normalizzata>
```

Se il file `betfair_scraper.py` non esiste nel percorso atteso, la route risponde `scraper_not_found` prima di tentare lo spawn.

## Runtime identity e deduplica

La deduplica considera esclusivamente la runtime identity:

```txt
persistent → mode + profileDir
cdp        → mode + cdpUrl
```

Il target URL non fa parte dell'identità.

Di conseguenza, due richieste con target Betfair differenti ma con la stessa runtime identity sono compatibili e possono condividere la stessa login window.

Quando esiste già una login compatibile:

```txt
nessun secondo spawn
→ attesa dell'eventuale startPromise già in corso
→ already_active dopo spawnReady riuscito
```

Il riuso vale anche quando il primo processo è ancora nello stato di spawn pending.

Se lo spawn condiviso fallisce, la richiesta compatibile in attesa non riceve `already_active`: termina anch'essa con `login_spawn_failed`.

Quando esiste già una login con runtime identity incompatibile:

```txt
nessun secondo spawn
nessun kill
nessun restart
→ HTTP 409 login_runtime_conflict
```

## Lifecycle di `spawnReady`

Per un nuovo login il lifecycle:

1. acquisisce la generation dello scope `login`;
2. registra lo spawn del processo Python con ruolo `betfair_login`;
3. conserva lo stato locale come `spawn_pending`;
4. attende `spawnReady` fino al timeout configurato, pari di default a `5000 ms`;
5. passa allo stato attivo soltanto se `spawnReady` restituisce esito positivo;
6. restituisce `started` al chiamante;
7. rimuove la login attiva quando la completion del processo termina.

Un errore di spawn sincrono, un `spawnReady` negativo o il timeout vengono esposti al contratto HTTP come `login_spawn_failed`.

Quando `spawnReady` termina con esito negativo prima del timeout, lo stato attivo viene rimosso e una richiesta successiva può tentare un nuovo avvio.

In caso di timeout il lifecycle richiede la terminazione dell'esecuzione registrata prima di restituire il fallimento; la cleanup dello stato attivo resta collegata alla completion del processo.

Un errore del processo successivo a uno spawn già riuscito non viene riclassificato come errore di spawn e non rimuove da solo l'ownership della login; la sessione resta posseduta fino alla completion o alla terminazione del processo.

## Ownership del processo

Il figlio Python della login usa il ruolo:

```txt
betfair_login
```

Questo ruolo è distinto da:

```txt
sofa_tracking
betfair_tracking
```

Il registry assegna `betfair_login` allo scope/generation `login`, separato dallo scope/generation `tracking`.

Lo spawn della login usa inoltre:

```txt
detached: false
windowsHide: false
stdio: ignore / pipe / pipe
metadata.logicalKey: betfair_login
```

La login window possiede quindi un processo separato dal tracking e la sua deduplica è gestita dal lifecycle specifico della login, non dal target URL.

## Confini

Questo endpoint:

- apre o riusa esclusivamente il processo login Betfair;
- non dichiara completato il login dell'utente;
- non usa il target URL come chiave di deduplica;
- non crea un secondo processo quando una runtime identity compatibile è già attiva;
- non sostituisce o riavvia automaticamente una runtime incompatibile;
- non introduce un valore `mode_invalid`;
- non possiede i contratti `/latest`, `/json`, `/odds`, `/log` o Money Flow.

## Verifica

I test specifici del contratto login sono:

```txt
backend/src/routes/betfair/loginWindow.test.mjs
backend/src/routes/betfair/loginWindowLifecycle.test.mjs
```

Coprono in particolare:

- validazione e normalizzazione `cdpUrl`;
- normalizzazione `profileDir`;
- costruzione e confronto della runtime identity;
- riuso di una richiesta compatibile mentre lo spawn è pending;
- conflitto di runtime senza secondo spawn;
- `started` solo dopo `spawnReady` positivo;
- fallimento di spawn e possibilità di retry;
- cleanup alla completion;
- mantenimento dell'ownership dopo un errore post-spawn;
- ruolo `betfair_login` distinto dai ruoli tracking;
- mapping HTTP di `login_spawn_failed`.

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Runtime locale](../../operations/01-local-runtime.md)
- [Lifecycle scraper Betfair](../../modules/betfair/01-scraper-lifecycle.md)
