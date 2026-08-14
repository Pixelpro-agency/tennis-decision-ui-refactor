> **Facade:** [01-utility-e-autorita-base.md](../01-utility-e-autorita-base.md)
> **Registro principale:** [06-implementazioni-proposte.md](../../06-implementazioni-proposte.md)
> **Perimetro:** IMPL-001…005
> **Parte precedente:** [facade](../01-utility-e-autorita-base.md)
> **Parte successiva:** [Authority, boundary e supporto](02-autorita-boundary-e-supporto.md)

# Tennis Decision UI — Utility e controlli

> Questo child possiede le schede `IMPL-001…005`. Conserva il checkpoint B1–B6, il problema originario delle singole voci, lo stato corrente quando pertinente e i closeout esistenti. L’ordine §13.1 è storico e non costituisce una coda operativa corrente.

## 13. Esito della classificazione dopo B6

Le classificazioni e le decisioni conservate in questa sezione appartengono al checkpoint B1–B6. Dove una voce ha avuto una materializzazione successiva, il documento distingue il target originario dall’implementazione oggi presente nel progetto.

Baseline storica del checkpoint B1–B6:

```txt
SHA verificato: b277bd9b7373dfd8702e65446c88bab7a0f64dcc
Audit documentazione/codice B1–B6: completato in lettura
```

### IMPL-001 — Controllo automatico dei link Markdown/MDX

**Classificazione storica:** `NECESSARIA PRIMA DELLA MIGRAZIONE DOCUMENTALE`
**Stato del registro:** `IMPLEMENTATA E VERIFICATA`

**Problema originario al checkpoint B6:** `Manca però un controllo globale ripetibile` per link relativi, target spostati o rimossi, anchor locali, riferimenti `.mdx` durante la migrazione e materiali legacy esclusi intenzionalmente.

#### Stato attuale

Il progetto contiene `scripts/check_documentation_links.py`.

Il checker è read-only e:

- scansiona sorgenti `.md` e `.mdx`;
- non riscrive i file;
- riporta file sorgente, riga e target;
- distingue `target_missing`, `anchor_missing` e `anchor_unverifiable`;
- tratta i link `.mdx` come warning oppure come errore con `--forbid-mdx-links`;
- esclude per default directory di build/runtime e materiali `legacy`, salvo opzione esplicita;
- può produrre output testuale o JSON.

`scripts/validation/test-manifest.json` registra inoltre `documentation-link-check` nei profili `fast` e `full-offline`, con `--forbid-mdx-links`.

Il closeout storico della voce resta quindi coerente con il comportamento attuale.

### IMPL-002 — Inventario automatico degli endpoint

**Classificazione storica:** `CONSIGLIATA`
**Stato del registro:** `NON COMPLETATA`

La proposta serve a confrontare router montati ed endpoint documentati, rilevare route legacy ancora raggiungibili e fornire una base ripetibile per il controllo della documentazione API.

Non deve sostituire la verifica semantica di payload, status, side effect, persistenza, errori o redazione.

#### Stato attuale

Non risulta un closeout della voce né una base sufficiente per promuoverla a capacità completata. Il suo stato storico resta quindi aperto.

La priorità registrata in origine era successiva alle correzioni runtime/frontend ad alta priorità e precedente alla riscrittura finale dei documenti API; tale sequencing è conservato come contesto storico e non come coda operativa corrente.

### IMPL-003 — Matrice test ↔ modulo ↔ documento

**Classificazione storica:** `NECESSARIA`
**Stato del registro:** `NON COMPLETATA`

La voce nasce per mantenere distinta la relazione fra aree, owner, test automatici, build/check, collaudi live e ultimo esito osservato.

Output storico minimo:

| Area | Owner | Test automatici | Build/check | Live | Ultimo esito |
| ---- | ----- | --------------- | ----------- | ---- | ------------ |

La matrice non deve dichiarare `PASS` senza un output corrente.

#### Stato attuale

Il progetto contiene una struttura di validation più evoluta rispetto al problema originario:

- `scripts/validation/test-manifest.json` registra profili, entry, owner, area, command, path check, timeout, serial group e requisito live;
- `scripts/validation/run.mjs` seleziona le entry per profilo, le esegue serialmente, costruisce un risultato strutturato e può scrivere un artefatto sotto `test-results/`;
- i profili `fast`, `backend`, `frontend`, `python` e `full-offline` risultano definiti come implementati;
- `persistence`, `benchmark` e `live` risultano pianificati e disabilitati.

Questa infrastruttura non equivale automaticamente al closeout della matrice storica, perché il registro non dispone di un closeout specifico di `IMPL-003` e il manifest non va interpretato come prova di un ultimo `PASS` corrente. La voce resta pertanto non completata nel registro, pur avendo oggi una base machine-readable utile.

### IMPL-004 — Archivio separato dei collaudi storici

**Classificazione storica:** `CONSIGLIATA`
**Stato del registro:** `IMPLEMENTATA E COMPLETATA TRAMITE DEC-013`

La separazione fra documenti owner e collaudi storici è presente nella struttura corrente:

```txt
docs/validations/
├── README.md
└── report di validazione datati
```

La directory contiene l’indice `README.md` e più report di validazione dedicati. La precedente proposta:

```txt
docs/tennis-decision-ui/archive/validations/
```

resta superata e non deve essere ricreata.

Il closeout storico è quindi compatibile con la struttura corrente. I report di validation rimangono provenance di collaudo e non sostituiscono i contratti posseduti dal codice e dai documenti owner.

### IMPL-005 — Controllo di coerenza Todo ↔ registri

**Classificazione storica:** `NECESSARIA`
**Stato del registro:** `IMPLEMENTATA E VERIFICATA`

La voce nasceva da divergenze concrete fra Todo e registri: ID presenti solo da un lato, prefissi non dichiarati e possibili stati incompatibili.

#### Stato attuale

Il progetto contiene `scripts/check_registry_consistency.py`, checker read-only che:

- raccoglie le schede owner sotto `implementazioni/`;
- raccoglie le righe sintetiche canoniche della Todo;
- segnala owner duplicati e righe sintetiche duplicate;
- segnala owner senza riga sintetica e righe sintetiche senza owner;
- verifica i prefissi canonici dichiarati;
- rileva incompatibilità strette fra stati;
- non rinumera ID e non modifica i registri.

`scripts/validation/test-manifest.json` registra `documentation-registry-consistency` nei profili `fast` e `full-offline`.

Il closeout storico resta coerente con il comportamento attuale.

## 13.1 Ordine consigliato — checkpoint storico

La sequenza seguente appartiene al checkpoint storico che generò queste voci. Non rappresenta la coda corrente delle attività, anche perché alcune voci risultano successivamente completate o parzialmente materializzate.

```txt
1. IMPL-005 — coerenza registri
2. IMPL-003 — matrice test
3. IMPL-001 — link checker prima della migrazione docs
4. IMPL-002 — inventario endpoint prima della riscrittura API
5. IMPL-004 — archivio collaudi completato in `docs/validations/`
```

## 13.2 Cosa non fare adesso

Non trasformare queste utility in un framework generale.

Devono restare:

- locali al repository;
- senza side effect sul runtime;
- eseguibili offline;
- semplici da leggere;
- coperte da test mirati;
- separate dalle feature live.

---

---
