# Log diagnostico Betfair

## Endpoint

```text
GET /api/betfair/log
```

La route espone in sola lettura una vista limitata della coda del log runtime Betfair. È montata sotto `/api/betfair` e legge il file runtime fisso `backend/betfair_scraper.log`; la richiesta non può scegliere un file diverso né modificare i limiti di lettura.

La risposta imposta sempre:

```text
Cache-Control: no-store
```

Il codice HTTP restituito dalla route è sempre `200`. L'esito della lettura è rappresentato dal campo applicativo `status`.

## Contratto di risposta

```json
{
  "lines": [],
  "status": "ok"
}
```

| Campo    | Tipo       | Significato                                                                |
| -------- | ---------- | -------------------------------------------------------------------------- |
| `lines`  | `string[]` | Righe non vuote restituite dalla coda del log, già sottoposte a redazione. |
| `status` | `string`   | Esito applicativo della lettura: `ok`, `not_found` oppure `read_failed`.   |

| `status`      | `lines`          | Significato                                            |
| ------------- | ---------------- | ------------------------------------------------------ |
| `ok`          | da 0 a 200 righe | Lettura completata.                                    |
| `not_found`   | `[]`             | Il file di log non è presente.                         |
| `read_failed` | `[]`             | La lettura non è stata completata per un altro errore. |

La risposta non espone il percorso filesystem del file né errori raw.

## Lettura bounded e redazione

La route chiama il reader con i limiti:

```text
maxLines: 200
maxLineLength: 1000
```

Il reader:

- legge soltanto la coda del file, fino a un massimo di 512 KiB;
- se la lettura parte nel mezzo del file, scarta la prima riga potenzialmente parziale;
- elimina le righe vuote;
- mantiene al massimo le ultime 200 righe;
- limita ogni riga a un massimo di 1.000 caratteri;
- applica nuovamente la redazione dei contenuti sensibili prima di restituire le righe.

La redazione copre, tra gli altri, URL, percorsi locali, header di autorizzazione e cookie, chiavi applicative, token e altri valori sensibili gestiti dal runtime logger.

## Confini

Nel CODE AUTHORITY il router Betfair non registra più la precedente route `GET /api/betfair/odds`. Questo documento possiede quindi soltanto il contratto HTTP di `GET /api/betfair/log` e non deve essere ricombinato con una superficie `/odds` non più presente.

Acquisizione Betfair, persistenza, lifecycle dello scraper, login window e diagnostica operativa restano fuori dallo scope di questo documento e sono descritti dai rispettivi owner.

## Verifica

Dalla cartella `backend/src`:

```text
node --check routes/betfair.js
node --check runtime/runtimeLogger.js
node runtime/runtimeLogger.test.mjs
```

Il test `runtime/runtimeLogger.test.mjs` copre, tra gli altri, gli esiti `not_found` e `read_failed`, il limite di 200 righe, la lunghezza massima delle righe e la redazione applicata dal reader bounded.

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Lifecycle scraper Betfair](../../modules/betfair/01-scraper-lifecycle.md)
- [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
