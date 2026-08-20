> [Todo operativa](../todo-list-tennis-decision-ui.md)

# BLOCCO I — Preparazione delle task esecutive

> Checklist riutilizzabile per ogni nuova task esecutiva.  
> Le caselle non rappresentano lo stato globale del progetto: vengono spuntate soltanto durante la preparazione della singola task selezionata e si considerano nuovamente vuote per la task successiva.

## Preparazione della task

Per ogni task selezionata devono essere definiti:

- [ ] problema dimostrato
- [ ] obiettivo
- [ ] comportamento da preservare
- [ ] file modificabili
- [ ] file consultabili
- [ ] fuori scope
- [ ] dipendenze
- [ ] esecutore previsto — Chat Esecutore oppure Desktop Esecutore
- [ ] collaudo indipendente richiesto o non applicabile
- [ ] test automatici
- [ ] eventuale collaudo live
- [ ] massimo tre tentativi ragionati
- [ ] report finale obbligatorio con file, comandi, test, esiti e limiti
- [ ] criteri di successo
- [ ] criteri di stop
- [ ] impatto documentale
- [ ] decisioni utente già risolte
- [ ] eventuale `fileModificati.md` richiesto soltanto se previsto dal flusso Chat Esecutore o Desktop Esecutore

## Regole permanenti di esecuzione

- Chat Analisi prepara il perimetro, verifica le evidenze e definisce la task esecutiva.
- Chat Esecutore o Desktop Esecutore esegue esclusivamente il perimetro assegnato.
- Quando è richiesto un collaudo indipendente, Desktop Collaudatore resta separato dall’esecutore.
- Un PASS può essere dichiarato soltanto sulla base di output verificabile relativo alla verifica eseguita.
- I report non devono contenere credenziali, token, cookie, segreti, payload sensibili o altri dati riservati.
- `fileModificati.md` non è un artefatto obbligatorio generale: viene richiesto soltanto nei flussi Chat Esecutore o Desktop Esecutore che lo prevedono.
- Commit e push restano riservati all’utente, salvo diversa autorizzazione esplicita.