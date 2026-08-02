# Tennis Decision UI — Audit dei materiali locali in `docs/`

## Scopo

Questo registro classifica tutti i file ricevuti fuori dalla documentazione canonica `docs/tennis-decision-ui/`.

Baseline del codice e dei documenti canonici usata per il confronto:

```txt
3b5fcd9437469c71e887e42d77ac5065adbe1071
```

Nessun file locale è stato cancellato, rinominato o pubblicato.

## Inventario

```txt
Prompt/
→ Navigazione del repository e modularizzazione di codice e test.txt

_work/
→ 01-documentation-impact-request.md
→ change-brief.md

legacy/briefs/
→ task-1b-source-identity-frontend-closure-brief.md

percorsi.txt

planning/
→ 04-07-2026 backlog-operativo.md
→ 05-07-2026 - Task 6 - Pacchetto prompt esecutivi.md
→ 05-07-2026 - Task 6 - Report di verifica.md
→ 14-07-2026 - Task 2 - Pacchetto prompt esecutivi.md
```

Totale:

```txt
9 file
```

## Decisione per file

### 1. Prompt di navigazione e modularizzazione

**Classificazione:** `SINTETIZZARE + DEPRECARE`

Da conservare nei registri:

- contesto minimo;
- navigazione per owner;
- separazione per responsabilità e side effect;
- facade pubblica stabile;
- dependency injection;
- test separati per tipo;
- fixture locali;
- runner generale senza logica di dominio;
- test map.

Destinazioni:

```txt
08-linee-guida-chat-e-ai.md
06-implementazioni-proposte.md → IMPL-003
```

Dopo l’assorbimento non deve restare un secondo prompt generale concorrente.

### 2. `_work/01-documentation-impact-request.md`

**Classificazione:** `DEPRECARE`

Il file era utile quando la chat non poteva leggere il repository.

I suoi campi sono ora coperti da:

- scope della task;
- file consultabili;
- impatto documentale;
- link;
- documenti invariati;
- decisioni mancanti.

Può essere rimosso senza archivio.

### 3. `_work/change-brief.md`

**Classificazione:** `SINTETIZZARE + DEPRECARE`

Campi da preservare nei report:

```txt
obiettivo
file modificati
modifiche funzionali
contratti
test
impatto documentale
dubbi/limiti
```

Può essere rimosso dopo l’assorbimento.

### 4. Brief Source Identity legacy

**Classificazione:** `ARCHIVIARE TEMPORANEAMENTE`

Contiene:

- verifiche live reali;
- casi pending ancora aperti;
- dettaglio UX;
- simulazione successivamente rimossa.

Azione:

```txt
estrarre prove live
→ creare validation con data e SHA
→ segnalare la simulazione come superata
→ eliminare il brief duplicato
```

Non deve tornare documento canonico.

### 5. `percorsi.txt`

**Classificazione:** `DEPRECARE DOPO MIGRAZIONE`

È una mappa manuale e ormai divergente:

- usa `.mdx`;
- include Strategy;
- duplica index e repository map;
- richiede manutenzione manuale.

Fino alla migrazione non va aggiornato. Dopo il nuovo indice `.md` può essere rimosso.

### 6. Backlog operativo 04-07-2026

**Classificazione:** `SINTETIZZARE + ARCHIVIARE`

Non deve restare planning attivo.

Contenuti assorbiti:

```txt
Task 4 → IMPL-012
Task 5 → IMPL-010
Task 7 → IMPL-006
Task 8 → IMPL-013
Task 9 → IMPL-014
single-writer Task 6 → IMPL-015
```

Le sezioni completate 1, 2, 3 e 6 restano cronologia.

### 7. Pacchetto prompt Task 6

**Classificazione:** `ARCHIVIARE`

È un documento di esecuzione, non una specifica corrente.

Molti P0/P1/P2 descrivono problemi risolti dai passaggi successivi.

L’unico punto da mantenere come assunzione esplicita è il modello single-writer di `match_history`, registrato in IMPL-015.

### 8. Report di verifica Task 6

**Classificazione:** `ARCHIVIARE COME VALIDAZIONE INTERMEDIA`

Il report è utile perché distingue:

- verificato;
- non verificato;
- failure path;
- limiti della snapshot.

Non descrive lo stato finale della Task 6 e contiene finding poi corretti.

Destinazione futura:

```txt
docs/validations/
→ report intermedio
→ data e SHA
→ nota di superseded
```

### 9. Pacchetto prompt Task 2

**Classificazione:** `ARCHIVIARE`

Il launcher corrente è stato riconfermato con limiti in D9.

Dal pacchetto restano utili soltanto gli scenari di validazione non ancora osservati:

- porte alternative reali;
- servizi esterni sulle porte preferite;
- CDP alternativo reale;
- force-kill owned;
- login-only;
- segnali Windows.

Questi scenari appartengono a un futuro collaudo, non a planning attivo.

## Ordine futuro risultante

Dopo la nuova lettura del codice:

```txt
1. autorità sessione live e risposte tardive — IMPL-006
2. boundary diagnostica pubblico — IMPL-007
3. persistence frontend — IMPL-009
4. fixture/replay offline — IMPL-012
5. baseline end-to-end — IMPL-013
6. ottimizzazione Betfair condizionata — IMPL-014
7. toolkit strategie offline — IMPL-010
```

In parallelo, quando necessario:

```txt
IMPL-003 — test runner e test map
IMPL-008 — harness recovery
IMPL-011 — maintenance authority
IMPL-015 — single-writer invariant
```

## Piano di pulizia locale proposto

### Deprecare ed eliminare dopo revisione

```txt
Prompt/Navigazione del repository e modularizzazione di codice e test.txt
_work/01-documentation-impact-request.md
_work/change-brief.md
```

### Eliminare dopo migrazione `.md`

```txt
percorsi.txt
```

### Trasformare in validation e poi rimuovere il duplicato

```txt
legacy/briefs/task-1b-source-identity-frontend-closure-brief.md
planning/05-07-2026 - Task 6 - Report di verifica.md
```

### Archiviare come storia di esecuzione

```txt
planning/04-07-2026 backlog-operativo.md
planning/05-07-2026 - Task 6 - Pacchetto prompt esecutivi.md
planning/14-07-2026 - Task 2 - Pacchetto prompt esecutivi.md
```

## Stato

```txt
LETTURA COMPLETATA
CLASSIFICAZIONE COMPLETATA
ASSORBIMENTO NEI REGISTRI COMPLETATO
PULIZIA FISICA NON ESEGUITA
```
