# Log diagnostico Betfair

## Endpoint

```text
GET /api/betfair/log
```

La route restituisce al massimo 200 righe del log runtime, limita ogni riga a 1.000 caratteri e imposta `Cache-Control: no-store`. La risposta espone soltanto:

```json
{
  "lines": [],
  "status": "ok"
}
```

Se la lettura fallisce, `lines` resta un array vuoto e `status` descrive l'esito senza includere percorsi o errori raw.

La precedente route mutante `GET /api/betfair/odds` è stata rimossa. Acquisizione e persistenza Betfair appartengono esclusivamente al tracking canonico.

## Verifica

Dalla cartella `backend/src`:

```text
node --check routes/betfair.js
node --check routes/betfair/logReader.js
```

Non esiste ancora un test HTTP dedicato alla route `/api/betfair/log`; i controlli sopra verificano soltanto la sintassi dei moduli coinvolti.

## Documenti collegati

- [API Betfair](../02-betfair.md)
- [Lifecycle scraper Betfair](../../modules/betfair/01-scraper-lifecycle.md)
- [Diagnostica Betfair](../../operations/03-betfair-diagnostics.md)
