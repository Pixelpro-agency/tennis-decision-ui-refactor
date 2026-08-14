# Retention e pulizia dati

## Stato

La retention delle cache runtime è implementata come utility standalone:

```txt
scripts/cleanup_runtime_cache.py
```

Il comportamento predefinito è il dry-run. La rimozione reale richiede entrambe le opzioni:

```txt
--apply --offline-confirmed
```

La utility è standalone e non pianifica autonomamente esecuzioni periodiche.

## Scopo

Questo runbook descrive:

- quali cache runtime possono essere selezionate;
- quali policy determinano i candidati;
- quali controlli precedono un apply;
- come interpretare output ed exit code;
- i confini fra retention delle cache e dati non governati dalla utility;
- i requisiti minimi per backup e pulizia controllata.

La utility è allow-list-only: non accetta una directory arbitraria e non deve essere usata come strumento generico di cancellazione.

## Classificazione degli artefatti

| Categoria                     | Percorso o esempio                           | Trattamento                                           |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Cache SofaScore               | `backend/scraper_cache/`                     | Rigenerabile; selezionabile come `--cache sofa`       |
| Cache Betfair                 | `backend/betfair_cache/`                     | Rigenerabile; selezionabile come `--cache betfair`    |
| Dati canonici                 | `backend/match_history/`                     | Fuori allow-list; non cancellare con questa utility   |
| Commit journal                | `backend/match_history/.pending_commits/`    | Fuori allow-list; appartiene a commit e recovery      |
| Writer authority              | `backend/match_history/.writer_authority/`   | Fuori allow-list; non è una cache runtime             |
| Conferme Source Identity      | `backend/source_identity_confirmations.json` | Fuori allow-list                                      |
| Dump diagnostici              | `backend/betfair_network_dump/`              | Fuori allow-list; richiede una policy separata        |
| Log runtime                   | per esempio `backend/betfair_scraper.log`    | Fuori allow-list; richiede una policy separata        |
| Profilo browser e credenziali | profilo Chrome, cookie, token, `.env`        | Non pulire o copiare mediante questa procedura        |
| Build e dipendenze            | `frontend/dist/`, `node_modules/`            | Rigenerabili, ma non governate dalla utility          |
| Evidence derivata             | nessun percorso selezionabile                | Non aggiungere un percorso artificiale all’allow-list |

L’esclusione delle categorie non-cache deriva dal confine positivo della utility: i soli root selezionabili sono `backend/betfair_cache` e `backend/scraper_cache`.

## Cache applicativa e retention su disco

Le cache applicative hanno una propria validità temporale in lettura:

| Cache     | TTL applicativo                    |
| --------- | ---------------------------------: |
| SofaScore | 5 secondi                          |
| Betfair   | 4 secondi                          |

Il TTL decide se un file può essere riutilizzato dall’applicazione. Non elimina il file dal disco.

La retention opera invece sui metadati dei file presenti nelle directory allow-list. Non legge il contenuto JSON e non modifica i TTL applicativi.

## Selezione delle cache e delle policy

Almeno una cache è obbligatoria:

```txt
--cache betfair
--cache sofa
```

L’opzione può essere ripetuta; selezioni duplicate vengono deduplicate mantenendo l’ordine.

È obbligatoria almeno una policy:

```txt
--max-age-days N
--max-files N
--max-total-bytes N
```

I valori devono essere interi maggiori o uguali a zero.

Le policy operano così:

| Policy              | Criterio                                                             |
| ------------------- | -------------------------------------------------------------------- |
| `--max-age-days`    | seleziona i file con `mtime` strettamente precedente alla soglia     |
| `--max-files`       | seleziona i file più vecchi necessari a rientrare nel numero massimo |
| `--max-total-bytes` | seleziona i file più vecchi necessari a rientrare nel limite di byte |

`--max-files` e `--max-total-bytes` sono valutati separatamente per ciascuna cache selezionata. Non formano un limite globale condiviso fra SofaScore e Betfair.

Quando più policy selezionano lo stesso file, il candidato compare una sola volta e conserva tutte le motivazioni applicabili.

Esempio di dry-run basato sull’età:

```txt
python scripts/cleanup_runtime_cache.py --cache betfair --cache sofa --max-age-days 7
```

Il valore `7` è un parametro esplicito dell’esempio, non un default incorporato nella utility.

## Ambito della scansione

Per ogni cache selezionata la utility esamina soltanto le entry dirette della directory; non ricorre nelle sottodirectory.

Sono eleggibili esclusivamente file:

```txt
regolari
non symlink
con suffisso .json
```

Sono registrati come `skipped`, secondo il caso:

```txt
directory cache assente
directory cache rappresentata da symlink
percorso cache non-directory
directory figlia
symlink
file non regolare
file non JSON
file cambiato prima della rimozione
```

Errori di accesso o di lettura dei metadati vengono registrati in `errors`.

## Dry-run

Il dry-run è la modalità ordinaria e non rimuove file:

```txt
python scripts/cleanup_runtime_cache.py --cache betfair --cache sofa --max-age-days 7
```

La utility:

1. valida cache e policy;
2. scandisce soltanto le directory allow-list selezionate;
3. costruisce l’elenco dei candidati;
4. restituisce il report JSON;
5. lascia `removed` vuoto.

Prima di qualsiasi apply, eseguire e conservare il dry-run con le stesse cache e policy previste per la rimozione.

## Apply offline

L’apply richiede:

```txt
python scripts/cleanup_runtime_cache.py \
  --cache betfair \
  --cache sofa \
  --max-age-days 7 \
  --apply \
  --offline-confirmed
```

Se `--apply` è presente senza `--offline-confirmed`, l’esecuzione viene bloccata prima della scansione, della selezione dei candidati e dei controlli di sessione.

Dopo la scansione e prima di rimuovere file, la utility verifica automaticamente:

- assenza di `launcher/.runtime/launcher.lock`;
- porta `3000` non occupata su loopback IPv4 e, quando disponibile, IPv6;
- porta `3001` non occupata su loopback IPv4 e, quando disponibile, IPv6.

Un errore nel controllo del lock o di una porta produce un motivo di blocco. La presenza di qualunque motivo imposta `blocked: true` e impedisce tutte le rimozioni.

La utility non verifica direttamente lo stato semantico del tracking, l’esistenza di un incidente aperto o la coerenza di un backup. Prima dell’apply l’operatore deve quindi confermare separatamente:

```txt
tracking fermo
nessun incidente che richieda le cache come prova
dry-run riesaminato
cache e policy corrette
output conservabile in modo sicuro
```

## Semantica dell’apply

Immediatamente prima di ogni rimozione, il candidato viene ricontrollato. Se non è più un file regolare non-symlink, non viene rimosso e compare in `skipped` con motivo `changed_before_removal`.

Le rimozioni sono best-effort per singolo file:

```txt
errore su un candidato
→ errore registrato
→ candidati successivi ancora tentati
→ rimozioni precedenti non annullate
```

Di conseguenza un apply può terminare con errori e avere comunque già rimosso alcuni file. Non esiste rollback transazionale della cancellazione.

Per le sole cache rigenerabili, il recupero funzionale consiste nel lasciare che una richiesta successiva ricrei i file. Questa regola non si applica a dati canonici, journal, writer authority, conferme, dump o altri artefatti fuori allow-list.

## Output JSON

Il report contiene almeno:

| Campo            | Significato                                      |
| ---------------- | ------------------------------------------------ |
| `mode`           | `dry-run` oppure `apply`                         |
| `selectedCaches` | cache richieste dopo la deduplicazione           |
| `policies`       | valori `maxAgeDays`, `maxFiles`, `maxTotalBytes` |
| `blocked`        | indica che l’apply non può procedere             |
| `blockReasons`   | motivi del blocco                                |
| `scanned.files`  | numero di file eleggibili scanditi               |
| `scanned.bytes`  | byte complessivi dei file eleggibili             |
| `candidates`     | file selezionati con byte, `mtime` e motivazioni |
| `removed`        | candidati effettivamente rimossi                 |
| `skipped`        | percorsi non elaborati con motivo                |
| `recoveredBytes` | somma dei byte dei file rimossi                  |
| `errors`         | errori di uso, metadati o rimozione              |

Leggere sempre insieme:

```txt
blocked
blockReasons
removed
recoveredBytes
skipped
errors
```

Il solo numero di candidati non dimostra quante rimozioni siano avvenute.

## Exit code

| Codice | Significato                                                                            |
| -----: | -------------------------------------------------------------------------------------- |
| `0`    | esecuzione completata senza blocchi o errori                                           |
| `1`    | esecuzione completata con errori; in apply possono esserci rimozioni già riuscite      |
| `2`    | errore d’uso, compresi cache o policy mancanti e `--apply` senza `--offline-confirmed` |
| `3`    | apply bloccato dai controlli di sessione dopo una richiesta valida                     |

L’exit code deve essere interpretato insieme al report JSON. In particolare, il codice `1` non implica che nessun file sia stato rimosso.

## Confini con recovery, repair e persistence

La retention delle cache non deve essere usata per:

- cancellare history o timeline;
- rimuovere journal pending;
- modificare `.writer_authority/`;
- cancellare conferme Source Identity;
- risolvere stati `partial_persistence` o `recovery_failed`;
- eseguire recovery o repair;
- normalizzare o ricostruire dati canonici;
- creare, persistere o cancellare artificialmente uno store Evidence;
- estendere l’allow-list in base al solo nome di una directory.

Un problema della persistence deve essere gestito dall’owner della persistence e del recovery, non dalla utility di retention.

## Dump diagnostici e log

Dump e log non sono inclusi nella utility. La loro eventuale conservazione o rimozione richiede una policy separata che consideri almeno:

```txt
incidente ancora aperto
contenuto sensibile
redazione
provenienza
periodo di conservazione
responsabile della rimozione
```

La presenza di redazione non trasforma un dump in fonte canonica e non autorizza automaticamente la condivisione o la cancellazione.

## Backup

La utility non crea backup.

Un backup destinato a restore o audit deve distinguere almeno:

```txt
codice e documentazione
configurazioni non sensibili
history e timeline necessarie
journal necessari a recovery o audit
conferme applicabili
validazioni o export esplicitamente prodotti
```

Non includere automaticamente:

```txt
node_modules
frontend/dist
cache runtime
cache browser
dump diagnostici scaduti
profilo Chrome
cookie
token
password
.env
file temporanei
```

La validità JSON dei singoli file non dimostra la coerenza dell’insieme. In assenza di una snapshot boundary project-owned verificata, una copia multi-file deve essere dichiarata best-effort e non snapshot coerente.

Non copiare un record di writer authority per attribuire ownership a un processo o a una working copy differente.

## Checklist operativa

### Prima del dry-run

- selezionare soltanto `betfair`, `sofa` o entrambe;
- definire almeno una policy;
- verificare che i limiti siano intenzionali;
- scegliere una destinazione sicura per il report JSON.

### Prima dell’apply

- rieseguire il dry-run con gli stessi parametri;
- controllare `candidates`, `skipped` ed `errors`;
- fermare il tracking;
- verificare che non servano cache per un incidente aperto;
- verificare l’assenza del launcher lock;
- verificare che le porte `3000` e `3001` siano libere;
- aggiungere sia `--apply` sia `--offline-confirmed`.

### Dopo l’apply

- leggere l’exit code;
- controllare `blocked` e `blockReasons`;
- controllare `removed`, `recoveredBytes`, `skipped` ed `errors`;
- non assumere atomicità in presenza di errori;
- conservare il report secondo la policy operativa applicabile;
- lasciare che le cache mancanti vengano rigenerate dal normale fetch.

## Stato della validazione

Verificato mediante test unitari:

```txt
dry-run senza modifiche
selezione max-age
selezione max-files
selezione max-total-bytes
combinazione delle motivazioni
blocco senza conferma offline
blocco con sessione attiva simulata
prosecuzione best-effort dopo errore di rimozione
esclusione di directory, symlink e file non JSON
rifiuto di directory arbitrarie
controlli IPv4 e IPv6
fail-closed sugli errori di verifica
```

Non dimostrato dai file di codice e test consultati:

```txt
dry-run sulle cache reali della working copy
primo apply controllato sulle cache reali
snapshot coerente multi-file per backup o audit
retention automatica di cache, dump o log
```

## Documenti collegati

- [Timeline e history](../modules/storage/01-timelines-and-history.md)
- [Commit journal e recovery](../modules/storage/02-commit-journal-and-recovery.md)
- [Match Evidence Snapshot](../modules/evidence/01-match-evidence-snapshot.md)
- [Lifecycle scraper Betfair](../modules/betfair/01-scraper-lifecycle.md)
- [Scraper Betfair](../modules/python/03-betfair-scraper.md)
- [Diagnostica Betfair](./03-betfair-diagnostics.md)
- [Validazione e rollback](./04-validation-and-rollback.md)
- [Mappa del repository](../reference/01-repository-map.md)
