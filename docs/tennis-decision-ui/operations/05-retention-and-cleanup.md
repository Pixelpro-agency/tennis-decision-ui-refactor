# Retention e pulizia dati

## Stato

**Implementato, da validare.**

La utility standalone di retention cache runtime è implementata e verificata in dry-run.

Il percorso distruttivo:

```txt
--apply --offline-confirmed
```

non è ancora validato operativamente su cache reali.

La prima validazione apply deve avvenire in una sessione offline dedicata, con lock assente e porte runtime libere.

La retention automatica periodica non è implementata:

```txt
nessun cron
nessun job schedulato
nessun avvio automatico dal launcher
nessun cleanup periodico
```

La policy su commit journal, sidecar di recovery e `pending_commits` è documentata come vincolo di sicurezza: questi artefatti non sono cache runtime e non rientrano nella utility di retention.

## Scopo

Questo documento classifica gli artefatti locali e definisce cosa conservare, cosa escludere dai backup e cosa potrà essere pulito solo con una procedura project-owned.

La retention non è un meccanismo di recovery, non ripara commit incompleti e non deve cancellare sidecar journalizzati per forzare uno stato pulito.

## Classificazione

| Categoria             | Percorsi tipici                                | Policy                                                                                         |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Dati canonici         | `backend/match_history/`                       | Non cancellare automaticamente                                                                 |
| Journal di commit     | `backend/match_history/pending_commits/`       | Non cancellare con retention; gestito solo dal writer/recovery owner                           |
| Conferme operatore    | `backend/source_identity_confirmations.json`   | Non cancellare automaticamente                                                                 |
| Cache SofaScore       | `backend/scraper_cache/`                       | Rigenerabile; pulibile solo dalla utility allow-list in dry-run o apply offline confermato     |
| Cache Betfair         | `backend/betfair_cache/`                       | Rigenerabile; redatta in lettura/scrittura; pulibile solo dalla utility allow-list             |
| Dump diagnostici      | `backend/betfair_network_dump/`                | Consentiti solo in diagnostica esplicita; contenuti redatti; non inclusi nella utility cache   |
| Log tecnici           | `backend/*_debug.log`, `backend/*_scraper.log` | Rotazione futura, non cancellare durante incidente aperto                                      |
| Warning legacy        | stato `legacyWarning` del commit Betfair       | Osservabile; non invalida commit canonico riuscito e non autorizza cleanup manuale retroattivo |
| Build e dipendenze    | `frontend/dist/`, `node_modules/`              | Rigenerabili, non includere nel backup                                                         |
| Profilo browser       | profilo locale Chrome                          | Sensibile, non pulire automaticamente                                                          |
| Credenziali           | cookie, token, `.env`, password                | Non salvare, non condividere, non includere nei backup                                         |

## Modalità normale

In modalità normale il progetto deve conservare solo:

```txt
timeline canoniche
history aggregata
commit journal necessari a recovery
conferme Source Identity
configurazione necessaria
log tecnici essenziali
```

Un journal pending o una directory `pending_commits` presente sul disco non è una cache sporca: rappresenta uno stato di commit incompleto o recuperabile.

Il live tracking normale non attiva network capture e non crea nuovi file in:

```txt
backend/betfair_network_dump/
```

Non deve salvare automaticamente:

```txt
HTML completo
asset statici
font
immagini
CSS
JavaScript
media
cache browser
copie duplicate
cookie
token
authorization header
profili browser
```

## Journal, recovery e cleanup legacy

Il commit journal è un sidecar tecnico del commit canonico.

Può esistere temporaneamente quando un commit logico non è stato completato o quando il sistema deve rendere osservabile uno stato incompleto.

```txt
commit canonico completo
→ rimozione journal completata
→ eventuale cleanup legacy consentito
```

Il cleanup legacy Betfair può avvenire solo dopo commit canonico riuscito e rimozione journal completata.

Un fallimento del cleanup legacy deve restare osservabile tramite `legacyWarning`.

`legacyWarning` non invalida un commit canonico già riuscito, non trasforma il commit in `partial_persistence` e non deve essere documentato come errore del commit.

La retention non deve mai eseguire:

```txt
repair journal
rimozione journal pending
forzatura recovery_failed
cleanup legacy Betfair pre-commit
normalizzazione di history o timeline
ricostruzione di Evidence
```

Queste responsabilità appartengono al writer canonico e al percorso di recovery documentato.

## Modalità diagnostica

La diagnostica deve essere esplicita.

Nel percorso HTTP dell’applicazione, la capture diagnostica viene abilitata tramite:

```txt
GET /api/betfair/odds?networkCapture=true
```

Il live tracking Betfair non la abilita.

Il CLI Python `betfair_scraper.py`, invocato direttamente, abilita invece la capture per default salvo `--no-network-capture`. Non usarlo per una diagnosi senza valutare esplicitamente il rischio di creare dump.

La redazione dei contenuti diagnostici Betfair è implementata sui percorsi di log, errori, network dump, output scraper, cache Betfair e bridge Node/Python.

La redazione non rende i dump una fonte canonica e non autorizza la condivisione di payload reali.

Restano distinti:

```txt
redazione diagnostica
→ implementata

retention cache runtime
→ utility standalone implementata e verificata in dry-run

retention dump/log
→ policy documentata, non inclusa nella utility cache

commit journal e recovery
→ non sono retention cache

rotazione automatica periodica
→ non implementata
```

Ogni dump utile deve essere collegabile a:

```txt
evento
mercato
timestamp
causa diagnostica
```

Gli stati:

```txt
partial_persistence
recovery_failed
```

possono essere osservati dalla diagnostica e dalle API read-only, ma non autorizzano cancellazioni manuali di journal, history o timeline.

## Retention cache runtime offline

La utility standalone è:

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

Policy supportate:

```txt
--max-age-days
--max-files
--max-total-bytes
```

La soglia operativa iniziale verificata è:

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
Evidence
Source Identity
commit journal
pending_commits
recovery metadata
legacyWarning
dump diagnostici
log runtime
profili browser
lock
manifest
file temporanei
```

I controlli di sicurezza bloccano l’apply in presenza di segnali di sessione attiva, inclusi lock launcher e porte backend/frontend occupate su loopback IPv4 o IPv6.

Un errore di verifica deve restare fail-closed.

L’output è JSON strutturato e deve includere:

```txt
cache selezionate
policy
file scansionati
candidati
file saltati
errori
rimozioni
```

La policy riguarda esclusivamente la conservazione su disco delle cache rigenerabili. Non modifica i TTL applicativi.

## Invarianti

La retention non deve:

* cancellare history o timeline per liberare spazio;
* cancellare commit journal o `pending_commits`;
* cancellare conferme Source Identity;
* cancellare Evidence utile a audit o replay;
* cancellare il profilo Chrome;
* chiudere Chrome CDP;
* eseguire recovery o repair;
* trasformare `partial_persistence` o `recovery_failed` in cleanup manuale;
* cancellare log necessari a un incidente aperto;
* includere credenziali nei dump;
* usare dump come fonte primaria per algoritmi;
* interrompere tracking se il cleanup fallisce.

Un cleanup fallito su cache rigenerabili non deve modificare:

```txt
marketState
runner baseline
history
timeline
Evidence
Source Identity
journal pending
```

## Backup

Un backup utile include:

```txt
codice sorgente
documentazione
configurazioni non sensibili
history e timeline necessarie
commit journal necessari a recovery o audit locale
evidenze utili a audit o replay
```

Un backup non deve includere automaticamente:

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
file .env
file temporanei
```

Se un backup viene usato per audit o ripresa di uno stato locale incompleto, deve preservare la coerenza fra:

```txt
history
timeline
pending_commits
Evidence collegate
```

Non copiare solo una parte di questi artefatti per poi usarla come base canonica.

## Pulizia controllata

Non usare comandi di cancellazione generici.

Per le sole cache runtime Betfair e SofaScore, la utility project-owned deve essere usata prima in dry-run.

```txt
python scripts/cleanup_runtime_cache.py --cache betfair --cache sofa --max-age-days 7
```

Il dry-run deve essere il comportamento ordinario di verifica.

Non usare `--apply --offline-confirmed` finché non viene autorizzata e registrata una sessione offline dedicata.

Prima di qualunque apply futuro verificare:

```txt
tracking fermo
lock launcher assente
porte backend/frontend runtime libere
percorso incluso nell’allow-list
solo file .json regolari
nessun journal pending coinvolto
nessun incidente diagnostico aperto sulle cache interessate
```

La utility non deve essere estesa a:

```txt
backend/match_history
backend/match_history/pending_commits
backend/source_identity_confirmations.json
backend/betfair_network_dump
profili browser
log di incidente aperto
```

Questo documento non deve contenere comandi distruttivi generici su directory.

## Validazioni aperte

Già verificato:

```txt
test unitari utility
py_compile
dry-run su cache runtime
nessuna rimozione reale
```

Da verificare come vincolo esplicito di regressione:

```txt
pending_commits escluso dalla utility
commit journal esclusi dalla utility
partial_persistence non risolto tramite cleanup
recovery_failed non risolto tramite cleanup
legacyWarning preservato come warning osservabile
```

Resta da validare:

```txt
primo apply controllato
→ sessione offline dedicata
→ lock assente
→ porte runtime libere
→ cache reali
→ output JSON registrato
```

Decisioni ancora aperte:

```txt
chi può eseguire l’utility
se la retention resterà manuale o sarà pianificata in futuro
se introdurre soglie operative per max-files o max-total-bytes
se documentare un rollback specifico dopo apply reale
```

Il rollback ordinario per cache rigenerabili consiste nel lasciare che il successivo fetch ricrei i file necessari.

Non applicare questa regola a:

```txt
timeline
history
Evidence
conferme Source Identity
commit journal
pending_commits
dump utili a un incidente aperto
profili browser
```

## Documenti collegati

* [Timeline e history](../modules/storage/01-timelines-and-history.md)
* [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
* [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
* [Scraper Betfair](../modules/python/03-betfair-scraper.md)
* [Diagnostica Betfair](./03-betfair-diagnostics.md)
* [Validazione e rollback](./04-validation-and-rollback.md)
* [Selezione del contesto per API AI](../ai/01-context-selection.md)
* [Mappa del repository](../reference/01-repository-map.md)
