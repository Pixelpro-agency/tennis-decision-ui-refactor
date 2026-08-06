# Retention e pulizia dati

## Stato

**Implementato, da validare.**

La utility standalone di retention cache runtime è implementata e verificata in dry-run.

Il percorso distruttivo:

```txt
--apply --offline-confirmed
```

non è ancora validato operativamente su cache reali.

La prima validazione apply deve avvenire in una sessione offline dedicata, con launcher lock assente e porte runtime libere.

La retention automatica periodica non è implementata:

```txt
nessun cron
nessun job schedulato
nessun avvio automatico dal launcher
nessun cleanup periodico
```

Commit journal, `.pending_commits/` e `.writer_authority/` non sono cache runtime e non rientrano nella utility.

## Scopo

Questo documento classifica gli artefatti locali e definisce cosa conservare, cosa escludere dai backup e cosa può essere pulito solo con una procedura project-owned.

La retention non è recovery, non ripara commit incompleti e non deve cancellare sidecar journalizzati o record authority per forzare uno stato pulito.

## Match Evidence non è uno store persistito

Il Match Evidence Snapshot corrente è una vista read-only derivata da timeline canoniche, stato Source Identity applicabile e persistence integrity.

```txt
timeline SofaScore + timeline Betfair
→ builder Evidence
→ snapshot restituito dall’API
```

Non esiste un archivio canonico autonomo di file Evidence da sottoporre a retention.

Quindi:

```txt
Evidence runtime
→ non è una directory da pulire
→ non è un file da includere automaticamente nei backup
→ non è un artefatto persistito da cancellare
```

Per rendere riproducibile o auditabile uno snapshot Evidence occorre preservare gli input e le prove pertinenti:

```txt
timeline
history quando necessaria
journal richiesto da recovery o audit
conferme Source Identity
validazioni storiche o export esplicitamente creati
```

Eventuali export o journal Evidence futuri dovranno avere un owner e una policy dedicati quando saranno realmente implementati.

## Classificazione

| Categoria                      | Percorsi tipici                                  | Policy                                                                                         |
| ------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Dati canonici                  | `backend/match_history/`                         | Non cancellare automaticamente                                                                 |
| Journal di commit              | `backend/match_history/.pending_commits/`        | Non cancellare con retention; gestito solo da writer/recovery                                  |
| Writer authority               | `backend/match_history/.writer_authority/`       | Sidecar process-level; non cache; non modificare manualmente                                   |
| Conferme operatore             | `backend/source_identity_confirmations.json`     | Non cancellare automaticamente                                                                 |
| Cache SofaScore                | `backend/scraper_cache/`                         | Rigenerabile; pulibile solo dalla utility allow-list                                           |
| Cache Betfair                  | `backend/betfair_cache/`                         | Rigenerabile; redatta in lettura/scrittura; pulibile solo dalla utility                         |
| Dump diagnostici               | `backend/betfair_network_dump/`                  | Solo diagnostica esplicita; non inclusi nella utility cache                                    |
| Log tecnici                    | `backend/*_debug.log`, `backend/*_scraper.log`   | Rotazione futura; non cancellare durante incidente aperto                                      |
| Warning legacy                 | stato `legacyWarning` del commit Betfair         | Osservabile; non invalida commit riuscito e non autorizza cleanup retroattivo                  |
| Build e dipendenze             | `frontend/dist/`, `node_modules/`                | Rigenerabili; non includere nel backup                                                         |
| Profilo browser                | profilo locale Chrome                            | Sensibile; non pulire automaticamente                                                          |
| Credenziali                    | cookie, token, `.env`, password                  | Non salvare, non condividere, non includere nei backup                                         |
| Match Evidence Snapshot runtime| nessun percorso canonico autonomo                | Derivato; preservare gli input, non inventare una retention per uno store inesistente          |

## Modalità normale

In modalità normale il progetto conserva:

```txt
timeline canoniche
history aggregata
commit journal necessari a recovery
writer authority necessaria all’esclusione del backend writer
conferme Source Identity
configurazione necessaria
log tecnici essenziali
```

Un journal pending non è cache sporca: rappresenta un commit incompleto o recuperabile.

Un record `.writer_authority/` non è cache sporca: rappresenta l’owner della storage identity oppure un residuo da classificare come `active`, `unknown`, `reclaimed` o `already_owned`.

Il live tracking normale non attiva network capture e non crea nuovi file in:

```txt
backend/betfair_network_dump/
```

Non deve salvare automaticamente HTML, asset, media, cache browser, cookie, token, header di autorizzazione o profili browser.

## Journal, writer authority, recovery e cleanup legacy

Il commit journal è un sidecar tecnico del commit canonico.

```txt
commit canonico completo
→ rimozione journal completata
→ eventuale cleanup legacy consentito
```

La writer authority è distinta:

```txt
backend bootstrap
→ acquire writer authority
→ recovery e runtime
→ shutdown con tracker drain
→ release authority
```

Non è un dato canonico, un commit journal, una cache o un input Evidence.

Un record residuo viene recuperato soltanto quando il processo owner è positivamente morto. Owner vivo o identità non verificabile producono fail-closed.

Non risolvere un avvio bloccato cancellando `.writer_authority/`.

Il cleanup legacy Betfair può avvenire solo dopo commit canonico riuscito e rimozione journal completata.

`legacyWarning`:

```txt
resta osservabile
→ non invalida il commit riuscito
→ non diventa partial_persistence
→ non autorizza cleanup manuale retroattivo
```

La retention non deve mai eseguire:

```txt
repair journal
rimozione journal pending
rimozione o modifica writer authority
forzatura recovery_failed
cleanup legacy pre-commit
normalizzazione history o timeline
ricostruzione o persistenza artificiale di Evidence
```

## Modalità diagnostica

La diagnostica deve essere esplicita.

Nel percorso HTTP deprecato:

```txt
GET /api/betfair/odds?networkCapture=true
```

la capture può essere abilitata opt-in. Il live tracking non la abilita.

Il CLI Python diretto abilita la capture salvo `--no-network-capture`; non usarlo senza valutare il rischio di dump.

La redazione diagnostica è implementata su log, errori, dump, output scraper, cache Betfair e bridge Node/Python.

La redazione non rende i dump una fonte canonica e non autorizza la condivisione di payload reali.

Restano distinti:

```txt
redazione diagnostica
→ implementata

retention cache runtime
→ utility standalone implementata e verificata in dry-run

retention dump/log
→ policy documentata, non inclusa nella utility cache

journal e recovery
→ non sono retention cache

writer authority
→ non è retention cache

Evidence runtime
→ vista derivata, non store persistito

rotazione automatica
→ non implementata
```

Ogni dump utile deve essere collegabile a evento, mercato, timestamp e causa diagnostica.

Gli stati `partial_persistence` e `recovery_failed` possono essere osservati, ma non autorizzano cancellazioni manuali.

Gli stati authority `active` e `unknown` non autorizzano la rimozione del record.

## Retention cache runtime offline

Utility:

```txt
scripts/cleanup_runtime_cache.py
```

Può selezionare esclusivamente:

```txt
backend/betfair_cache
backend/scraper_cache
```

Il comportamento predefinito è dry-run.

L’azione reale richiede entrambi:

```txt
--apply
--offline-confirmed
```

Policy:

```txt
--max-age-days
--max-files
--max-total-bytes
```

Soglia operativa iniziale verificata:

```txt
--max-age-days 7
```

La utility considera solo file `.json` regolari nelle directory allow-list.

Sono esclusi:

```txt
directory
symlink
file non JSON
percorsi fuori allow-list
timeline
history
Source Identity
commit journal
.pending_commits
.writer_authority
recovery metadata
legacyWarning
dump diagnostici
log runtime
profili browser
launcher lock
manifest
file temporanei
```

Non esiste una directory Evidence da aggiungere all’allow-list o all’exclusion list: lo snapshot è derivato a runtime.

I controlli di sicurezza bloccano l’apply in presenza di launcher lock o porte backend/frontend occupate su loopback IPv4 o IPv6.

Un errore di verifica resta fail-closed.

L’output JSON include:

```txt
cache selezionate
policy
file scansionati
candidati
file saltati
errori
rimozioni
```

La policy riguarda la conservazione su disco delle cache rigenerabili. Non modifica i TTL applicativi.

## Invarianti

La retention non deve:

- cancellare history o timeline per liberare spazio;
- cancellare commit journal o `.pending_commits/`;
- cancellare, modificare o recuperare manualmente `.writer_authority/`;
- cancellare conferme Source Identity;
- cancellare input o validation necessari a ricostruire e verificare Evidence;
- trattare lo snapshot Evidence come un file canonico autonomo;
- cancellare il profilo Chrome;
- chiudere Chrome CDP;
- eseguire recovery o repair;
- trasformare `partial_persistence` o `recovery_failed` in cleanup;
- trasformare `active` o `unknown` in rimozione authority;
- cancellare log necessari a un incidente aperto;
- includere credenziali nei dump;
- usare dump come fonte primaria per algoritmi;
- interrompere tracking se il cleanup fallisce.

Un cleanup fallito su cache rigenerabili non modifica:

```txt
marketState
runner baseline
history
timeline
Source Identity
journal pending
writer authority
output Evidence derivato
```

## Backup

Un backup utile include:

```txt
codice sorgente
documentazione
configurazioni non sensibili
history e timeline necessarie
commit journal necessari a recovery o audit locale
conferme Source Identity quando necessarie
validazioni storiche e export esplicitamente prodotti
```

Il backup non deve includere automaticamente:

```txt
node_modules
frontend/dist
cache browser
cache runtime
dump diagnostici scaduti
profilo Chrome
cookie
token
password
.env
file temporanei
```

Non esiste un file Match Evidence Snapshot canonico da copiare. Per riprodurre Evidence preservare gli input canonici e il codice della stessa baseline.

Se il backup riguarda uno stato locale incompleto, preservare la coerenza fra:

```txt
history
timeline
.pending_commits
conferme applicabili
validazioni collegate
```

La writer authority è effimera e process-owned. Non deve essere copiata fra working copy per attribuire ownership a un processo diverso.

Non copiare solo una parte degli artefatti canonici per poi usarla come base completa.

## Pulizia controllata

Per le sole cache runtime:

```txt
python scripts/cleanup_runtime_cache.py --cache betfair --cache sofa --max-age-days 7
```

Il dry-run è il comportamento ordinario.

Non usare `--apply --offline-confirmed` finché non viene autorizzata una sessione offline dedicata.

Prima di un apply verificare:

```txt
tracking fermo
launcher lock assente
porte backend/frontend libere
percorso allow-list
solo file .json regolari
nessun journal coinvolto
nessuna writer authority coinvolta
nessun incidente aperto sulle cache
```

La utility non deve essere estesa a:

```txt
backend/match_history
backend/match_history/.pending_commits
backend/match_history/.writer_authority
backend/source_identity_confirmations.json
backend/betfair_network_dump
profili browser
log di incidente aperto
```

Non aggiungere un percorso Evidence inesistente.

## Validazioni aperte

Già verificato:

```txt
test unitari utility
py_compile
dry-run su cache runtime
nessuna rimozione reale
```

Vincoli di regressione:

```txt
.pending_commits esclusa
journal esclusi
.writer_authority esclusa
partial_persistence non risolto tramite cleanup
recovery_failed non risolto tramite cleanup
authority active/unknown non risolta tramite cleanup
legacyWarning preservato
Evidence trattata come output derivato, non come store
```

Resta da validare:

```txt
primo apply controllato
→ sessione offline
→ lock assente
→ porte libere
→ cache reali
→ output JSON registrato
```

Decisioni aperte:

```txt
chi può eseguire l’utility
retention manuale o pianificata futura
soglie max-files o max-total-bytes
rollback specifico dopo apply reale
```

Il rollback delle cache rigenerabili consiste nel lasciare che il fetch successivo ricrei i file.

Non applicare questa regola a timeline, history, conferme, journal, authority, validazioni o dump di incidente.

## Documenti collegati

- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
- [Match Evidence Snapshot](../modules/evidence/01-match-evidence-snapshot.md)
- [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
- [Scraper Betfair](../modules/python/03-betfair-scraper.md)
- [Diagnostica Betfair](./03-betfair-diagnostics.md)
- [Validazione e rollback](./04-validation-and-rollback.md)
- [Selezione del contesto per AI](../ai/01-context-selection.md)
- [Mappa del repository](../reference/01-repository-map.md)
