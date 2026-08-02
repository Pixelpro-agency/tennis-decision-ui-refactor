# Tennis Decision UI — Audit di `docs/planning` e materiali storici

## Scopo

`docs/planning` è una fonte storica e progettuale separata. Non prevale sul codice, sui test correnti o sui documenti owner.

Baseline usata:

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
SHA GitHub verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
```

## Limite della fonte

I percorsi planning e `_work` esaminati non risultano risolvibili come file tracciati sullo SHA GitHub corrente tramite il connettore.

La classificazione è quindi basata su:

- copie testuali disponibili nella libreria della conversazione;
- inventari terminale precedenti;
- brief e report forniti dall’utente;
- confronto già concluso con codice, test e documentazione canonica.

Non è stata eseguita alcuna eliminazione, rinomina o modifica dei file planning locali.

## Esclusioni decise dall’utente

I seguenti file non sono stati letti e non sono classificati:

```txt
docs.rar
idee future.odt
idee per stream api betfair.odt
```

Stato:

```txt
ESCLUSI PER DECISIONE UTENTE
```

Nessuna conclusione di questo audit deriva dal loro contenuto.

## Classificazioni

### 1. Pacchetto prompt esecutivi Task 6

Materiale:

```txt
05-07-2026 - Task 6 - Pacchetto prompt esecutivi.md
```

Classificazione:

```txt
REALIZZATA
DUPLICATA ALTROVE
STORICA
```

Motivo:

- descrive l’ordine dei prompt 6.1–6.x;
- gran parte del contenuto è confluita nel codice e nei documenti owner;
- contiene istruzioni operative e path legati allo stato dell’epoca;
- non deve essere usato come contratto corrente.

Decisione:

```txt
archiviare
→ non mantenere nel planning attivo
→ preservare soltanto come cronologia della Task 6
```

### 2. Report di verifica Task 6

Materiale:

```txt
05-07-2026 - Task 6 - Report di verifica.md
```

Classificazione:

```txt
REALIZZATA
STORICA
PARZIALMENTE SUPERATA DAL CODICE SUCCESSIVO
```

Il report è utile perché distingue risultati, limiti e questioni aperte. Alcune mancanze indicate sono state risolte dai prompt successivi e dal recovery consolidato.

Decisione:

```txt
spostare nel futuro archivio docs/validations/
→ mantenere data e SHA
→ conservare una sola copia canonica
→ eliminare duplicati numerati dopo confronto hash/contenuto
```

### 3. Brief Source Identity Task 1A e 1B

Materiali rappresentativi:

```txt
task-1a-source-identity-backend-brief.md
task-1b-source-identity-frontend-closure-brief.md
```

Classificazione:

```txt
REALIZZATA
DUPLICATA ALTROVE
CON LIMITI LIVE ANCORA APERTI
```

Da preservare nell’archivio:

- nascita del gate;
- bootstrap;
- sessione `pending`;
- verifiche live eseguite;
- casi pending/decline ancora non osservati.

Non devono restare owner del comportamento corrente.

Owner correnti:

- codice;
- documenti Source Identity;
- registro D1/D2;
- futuro report di validazione live.

### 4. Brief Money Flow 2A–2F

Materiali disponibili:

```txt
Brief 2B
Brief 2C
Brief 2D
Brief pre2-F
e relative copie
```

Classificazione:

```txt
REALIZZATA
DUPLICATA ALTROVE
2F CON LIMITI DI VALIDAZIONE LIVE
```

Decisione:

- archiviare i brief di implementazione;
- conservare il report live più completo;
- non usarli come specifica del Money Flow corrente;
- mantenere aperto `TEST-001`.

### 5. Journal e recovery

Materiali rappresentativi:

```txt
Change brief — Task 6.2 Journal dei commit e stato di integrità interno
Change brief — Task 6.5 recovery bootstrap journal
```

Classificazione:

```txt
REALIZZATA
STORICA
DUPLICATA NEI DOCUMENTI OWNER
```

Da preservare:

- decisione recovery prima di `listen`;
- errori per-file non fatali;
- limiti single-process/cross-process;
- test e collaudi mancanti.

Le procedure correnti appartengono ai documenti Storage/recovery e al registro D12/D13.

### 6. Diagnostica Betfair

Materiali:

```txt
Change brief — Task 1A hardening diagnostica e configurazione Betfair
Change brief — Task 1B hardening esteso della diagnostica Betfair
```

Classificazione:

```txt
PARZIALMENTE REALIZZATA
ANCORA VALIDA COME STORIA
```

Motivo:

il core di redazione e configurazione è stato implementato, ma D17 ha riaperto il solo perimetro:

- path pubblico `dump_dir`;
- filename cache derivato dall’URL;
- errori HTTP raw;
- task capture non attese.

Decisione:

```txt
mantenere fino alla chiusura D17
→ poi archiviare come validazione storica
```

### 7. Retention cache

Materiale:

```txt
Change brief — Task 3 retention cache offline
```

Classificazione:

```txt
PARZIALMENTE REALIZZATA
ANCORA VALIDA
```

Sono confermati utility, allow-list, dry-run e test.

Restano aperti:

- apply reale;
- porte alternative;
- authority di manutenzione;
- recheck metadata prima della cancellazione.

Decisione:

```txt
mantenere come materiale di riferimento fino alla chiusura CLEANUP-002 / IMPL-011
→ poi archiviare
```

### 8. `docs/_work`

Materiali:

```txt
01-documentation-impact-request.md
change-brief.md
percorsi.txt
```

Classificazione:

```txt
SUPERATA COME PROCEDURA ORDINARIA
DUPLICATA ALTROVE
```

Le informazioni utili sono state assorbite in:

- workflow esecutivo;
- linee guida chat/AI;
- template di report;
- repository map;
- documenti owner;
- registri di audit.

Non ricreare `_work` sul branch corrente.

## Esito complessivo

```txt
planning accessibile
→ classificato per gruppi

materiali completati
→ archivio storico o validations

materiali parziali
→ restano fino alla chiusura dei rilievi collegati

materiali di processo
→ assorbiti nel nuovo workflow

tre file esclusi
→ non letti e non classificati
```

## Operazioni non autorizzate in questo checkpoint

- cancellare planning locale;
- aggiungere planning al commit;
- rinominare file storici;
- creare `docs/validations/`;
- migrare documentazione canonica;
- eliminare duplicati senza confronto locale.

## Criterio di chiusura

L’audit planning è sufficiente per procedere al checkpoint dei registri.

L’eventuale cleanup fisico richiederà un task locale separato con:

- inventario reale della cartella;
- `git status`;
- file tracciati e non tracciati;
- confronto duplicati;
- lista esatta di mantenimento, archivio ed eliminazione.
