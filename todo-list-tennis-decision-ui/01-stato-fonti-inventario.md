> [Todo operativa](../todo-list-tennis-decision-ui.md)

# BLOCCO A — Stato corrente, fonti e inventario **2/3 COMPLETA**

## A1 — Fonti operative **COMPLETA**

- [x] [Indice root](../implementazioni-tennis-decision-ui.md)
- [x] [Indice dei registri](../implementazioni/README.md)
- [x] [Metodo e stati](../implementazioni/00-metodo-e-stati.md)
- [x] [Decisioni dell’utente](../implementazioni/99-decisioni-utente.md)
- [x] [Documentazione canonica](../docs/tennis-decision-ui/index.md)
- [x] [Validazioni](../docs/validations/)

## A2 — Inventario tecnico e copertura

- [x] A1 — Repository e branch canonico identificati
- [x] A2 — Entry point pubblico `avvio.py`
- [x] A3 — Orchestrazione `launcher/app.py`
- [x] A4 — Router backend correnti verificati nel bootstrap: Match, Betfair, Test/Preflight, Evidence
- [x] A5 — Bootstrap corrente: writer authority acquisita prima della recovery; recovery prima del listener
- [x] A6 — Registry processi Python
- [x] A7 — Composizione frontend e hook live
- [-] A13 — Inventario test — **PARZIALE; IL VALIDATION MANIFEST FORNISCE UN INVENTARIO MACHINE-READABLE DEI CONTROLLI REGISTRATI, MA `IMPL-003` RESTA APERTA PER LA MATRICE COMPLETA TEST ↔ OWNER ↔ DOCUMENTO E L'ULTIMO ESITO PER AREA**
- [-] A14 — Inventario documenti canonici — **PARZIALE; INDICE CANONICO E STRUTTURA CORRENTE SONO PRESENTI, MA NON RISULTA UN INVENTARIO ESAUSTIVO E MACHINE-CHECKABLE DEGLI OWNER DOCUMENTALI**
- [-] A15 — Legacy e file generati — **PARZIALE; LE PRINCIPALI CATEGORIE RUNTIME, GENERATE, CACHE E SENSIBILI SONO CLASSIFICATE NELLA REPOSITORY MAP, MA NON RISULTA UN INVENTARIO ESAUSTIVO DI TUTTI I FILE LEGACY E GENERATI**
- [-] A16 — Matrice codice ↔ documentazione — **PARZIALE; REPOSITORY MAP, OWNER DOCUMENTALI E METADATA DEL VALIDATION MANIFEST FORNISCONO COLLEGAMENTI MIRATI, MA NON ESISTE ANCORA UNA MATRICE ESAUSTIVA CODICE ↔ OWNER ↔ TEST ↔ DOCUMENTO**

## A3 — Struttura dei registri **COMPLETA**

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 6 moduli
- [x] ID globali mantenuti senza rinumerazione
- [x] `scripts/check_registry_consistency.py` usa i Blocchi E/F come superfici sintetiche canoniche
- [x] `todo-list-tennis-decision-ui.md` è l’unico entry point operativo della Todo; i Blocchi top-level correnti vivono nei rispettivi child Markdown