# Ciclo di vita dei dati

## Scopo

Questo documento descrive come i dati correnti attraversano bootstrap, acquisizione, normalizzazione, Source Identity, persistenza, lettura ed Evidence.

Non definisce strategie, segnali operativi, previsioni o causalità fra eventi di campo e mercato.

## Flusso corrente

```txt
bootstrap backend
  ↓
creazione e acquisizione writer authority
  ↓
recovery dei commit pending
  ↓
listener readiness e registrazione shutdown
  ↓
acquisizione SofaScore e Betfair separata
  ↓
normalizzazione e classificazione tecnica
  ↓
Source Identity Gate quando Betfair è presente
  ├─ collecting / pending → buffering
  ├─ recording → persistenza autorizzata
  ├─ mismatch → persistenza bloccata e stop
  └─ not-applicable → persistenza SofaScore senza Betfair
  ↓
commit journalizzato per fonte
  ↓
history aggregata + timeline sorgente
  ↓
integrity read-only
  ↓
API latest / Evidence
  ↓
frontend
```

Prima della recovery e della prima scrittura canonica deve già esistere un owner esclusivo della storage identity. `startServer()` acquisisce la writer authority backend-owned; un secondo backend sulla stessa repository/storage identity viene bloccato prima di recovery, listener, tracking e scritture canoniche.

## Acquisizione

| Fonte     | Percorso                                   | Dati prodotti                                                       |
| --------- | ------------------------------------------ | ------------------------------------------------------------------- |
| SofaScore | `scraper.py` → `scrapers/sofa/`            | Evento, punteggio, statistiche e point-by-point disponibili         |
| Betfair   | `betfair_scraper.py` → `scrapers/betfair/` | Mercato, runner, quote, ladder, volumi, health e diagnostica sicura |

SofaScore e Betfair hanno polling e failure mode indipendenti. Un problema Betfair non deve impedire la raccolta SofaScore.

Cache, dump di rete, log e profili browser non sono fonti canoniche e non devono sostituire un dato mancante.

## Normalizzazione SofaScore

Il backend combina gli endpoint SofaScore disponibili e costruisce uno snapshot coerente.

```txt
payload evento + statistiche + point-by-point
→ normalizeSnapshot
→ localContext descrittivo
→ campione SofaScore
```

Valori mancanti o non supportati restano `null` o indisponibili. Non vengono inventati fallback numerici.

## Classificazione Betfair

Il percorso Betfair distingue:

```txt
errore tecnico
≠ mercato concluso
≠ campione canonico persistibile
```

Flusso:

```txt
output scraper
→ classificazione tecnica
→ normalizzazione runner e mercato
→ Source Identity Gate
→ commit canonico
→ conferma dello stato runtime
```

Un errore tecnico ordinario non marca il mercato come concluso. Un campione non utilizzabile può partecipare esclusivamente al repair di un journal già pendente tramite `repairOnly`; non crea un nuovo tick, una nuova riga history o un nuovo baseline di mercato.

Lo stato runtime Betfair viene confermato soltanto dopo un commit canonico riuscito o recuperato.

## Source Identity Gate

Quando la sessione include Betfair, il gate conserva l'ultimo campione valido per fonte e decide se le nuove scritture sono autorizzate.

| Fase             | Effetto corrente                                                          |
| ---------------- | ------------------------------------------------------------------------- |
| `collecting`     | Attesa di campioni validi confrontabili; nessuna nuova scrittura canonica |
| `pending`        | Identità plausibile ma non risolta; nessuna nuova scrittura canonica      |
| `recording`      | Bootstrap dei campioni bufferizzati e persistenza successiva              |
| `mismatch`       | Campione causale bloccato, stop del tracking coordinato                   |
| `not-applicable` | SofaScore può essere persistito senza Betfair                             |

Un payload Betfair tecnicamente inutilizzabile non aggiorna candidate o fase del gate.

Il bootstrap cross-source avviene nell'ordine SofaScore → Betfair, ma non è una transazione filesystem unica. Se il primo commit riesce e il secondo fallisce, il primo non viene rollbackato.

Il gate corrente e i tracker sono correlati principalmente tramite `eventId`. Non esiste ancora un identificatore di sessione propagato a callback, scraper, conferme e poller; questo limite non va confuso con la writer authority di processo già implementata.

## Persistenza canonica

Percorso locale:

```txt
backend/match_history/
```

Artefatti principali:

| Artefatto            | Ruolo                                                    |
| -------------------- | -------------------------------------------------------- |
| Timeline SofaScore   | Sequenza dei tick canonici di campo                      |
| Timeline Betfair     | Sequenza dei tick canonici di mercato                    |
| History aggregata    | Vista compatta combinata del match                       |
| `.pending_commits/`  | Sidecar tecnico dei commit logici incompleti             |
| `.writer_authority/` | Sidecar tecnico dell'ownership esclusiva della storage identity |

Il commit journal crea un record pending prima delle scritture, marca i documenti completati e permette recovery deterministica al bootstrap del backend.

La directory `.writer_authority/` non contiene dati canonici e non sostituisce journal, history o timeline. Il relativo record è posseduto dal bootstrap backend, non dai singoli writer business.

Gli stati pubblici correnti sono:

```txt
no_known_partial
partial_persistence
recovery_failed
```

`partial_persistence` e `recovery_failed` descrivono la persistenza. Non sono health Betfair, Source Identity mismatch, freshness stale o errore frontend.

### Limiti correnti della persistenza

Il sistema possiede atomic write per singolo file, commit journal, recovery e writer authority backend-owned prima della recovery e del listener. Restano però limiti registrati:

- history condivisa fra fonti senza un'autorità event-scoped completa;
- record journal senza revision, head e digest verificabili;
- validazione `eventId` ancora permissiva;
- nessuna singola transazione cross-source;
- riscrittura del documento completo per ogni commit.

Questi limiti sono stato corrente, non descrizioni di soluzioni future.

## Operazioni tracker e shutdown

Le Promise tracker capaci di raggiungere la persistenza vengono registrate process-local in `activeTrackerOperations`. Il registro comprende almeno:

```txt
update SofaScore iniziale
update SofaScore dello scheduler
update Betfair dello scheduler
```

La rimozione di un match da `trackedMatches` o la cancellazione dello scheduler non equivalgono al completamento di un'operazione già avviata.

Durante lo shutdown:

```txt
server.close richiesto
→ terminal tracker barrier attivata
→ nessuna nuova operazione ammessa
→ tracker e scheduler fermati
→ tracker drain avviato
→ processi Python terminati
→ update Node già avviati attesi fino a registro vuoto
→ listener chiuso
→ release writer authority
→ exit
```

La writer authority viene rilasciata soltanto quando il drain è verificato con esito positivo e il listener è chiuso. Se il drain fallisce, restituisce un risultato invalido o non è verificabile, il comportamento è fail-closed: l'authority resta registrata e il processo termina. Il backend successivo può recuperarla soltanto dopo avere verificato positivamente la morte dell'owner.

Il force timeout non dichiara completato il drain e non rilascia anticipatamente l'authority.

## Eccezione status-only Graph

Un campione regressivo resta normalmente escluso. Esiste un'eccezione stretta quando il logout Graph è rilevato esplicitamente e non sono disponibili nuove ladder Graph.

```txt
ultimo tick canonico
+ graphLoginRequired=true
+ nessuna ladder Graph valida
→ tick Betfair status-only
```

Il tick conserva mercato e runner dell'ultimo stato canonico e aggiorna soltanto lo stato tecnico necessario a mostrare `auth_suspected`. Non adotta quote, volumi, ladder o Money Flow regressivi e non aggiorna il baseline canonico.

## Letture

Le API di lettura consumano dati già persistiti.

```txt
timeline/history
→ response builder
→ payload HTTP
```

Possono aggiungere `integrity` in modo read-only. Non devono eseguire recovery o scrivere journal.

Eccezioni limitate:

- `GET /api/betfair/:eventId/latest` può leggere runtime Betfair in memoria per calcolare health;
- `GET /api/match/:eventId/source-identity-status` legge lo stato del gate in memoria.

Entrambe restano letture e non autorizzano scritture.

## Match Evidence Snapshot

Evidence combina timeline, Source Identity applicabile e integrity.

Può esporre:

- dati SofaScore e Betfair;
- health e qualità;
- allineamento temporale;
- flow e ladder;
- no-trade reasons;
- Market Reactions descrittive.

Quando Source Identity non è allineata o la persistenza cross-source è incompleta, i confronti cross-source vengono sospesi o degradati.

Evidence non legge il gate live per ricostruire il passato, non modifica timeline e non prova causalità.

## Frontend

Il frontend consuma API Match, Betfair, Evidence e status Source Identity.

Il codice corrente ha poller distinti e stato sessione distribuito. Non esistono ancora AbortController e generation guard uniformi per tutte le richieste, né uno stop frontend coordinato di tutti i poller. Le risposte tardive restano quindi un limite corrente.

## Dati che non entrano nel flusso canonico

Non usare come sostituti delle timeline:

- dump browser o network capture;
- cache runtime;
- log testuali;
- snapshot latest isolati;
- dati simulati presentati come live;
- input URL come prova dell'identità;
- valori numerici inventati.

## Documenti collegati

- [Confini del sistema](./01-system-boundaries.md)
- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
- [Tracking live](../modules/sofa/01-live-tracking.md)
- [Validità tecnica Betfair](../modules/betfair/02-technical-sample-validity.md)
- [Match Evidence Snapshot](../modules/evidence/01-match-evidence-snapshot.md)
- [Stato corrente](../roadmap/01-current-state.md)
