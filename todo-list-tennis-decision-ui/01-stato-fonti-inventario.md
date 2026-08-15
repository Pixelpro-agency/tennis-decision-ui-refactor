> [Todo operativa](../todo-list-tennis-decision-ui.md)

# BLOCCO A — Stato corrente, fonti e inventario **3/4 COMPLETA**

## A1 — Fonti operative **COMPLETA**

- [x] [Indice root](../implementazioni-tennis-decision-ui.md)
- [x] [Indice dei registri](../implementazioni/README.md)
- [x] [Metodo e stati](../implementazioni/00-metodo-e-stati.md)
- [x] [Decisioni dell’utente](../implementazioni/99-decisioni-utente.md)
- [x] [Documentazione canonica](../docs/tennis-decision-ui/index.md)
- [x] [Validazioni](../docs/validations/)
- [x] `docs/archive/` — **PRESENTE; materiale non canonico, da non usare come prova di implementazione**

## A2 — Inventario tecnico e copertura

- [x] A1 — Repository e branch canonico identificati
- [x] A2 — Entry point pubblico `avvio.py` già inventariato nel checkpoint
- [x] A3 — Orchestrazione `launcher/app.py` già inventariata nel checkpoint
- [x] A4 — Router backend correnti verificati nel bootstrap: Match, Betfair, Test/Preflight, Evidence
- [x] A5 — Bootstrap corrente: writer authority acquisita prima della recovery; recovery prima del listener
- [x] A6 — Registry processi Python già individuato
- [x] A7 — Composizione frontend e hook live individuati
- [ ] A8 — Inventario completo root — **NON COMPLETO**
- [ ] A9 — Inventario completo directory backend — **NON RICOSTRUITO**
- [ ] A10 — Inventario completo directory frontend — **NON RICOSTRUITO**
- [ ] A11 — Inventario completo package Python — **NON RICOSTRUITO**
- [ ] A12 — Inventario completo script operativi — **NON RICOSTRUITO**
- [-] A13 — Inventario test — **MANIFEST CANONICO PRESENTE, MA LA MATRICE COMPLETA TEST ↔ OWNER ↔ DOCUMENTO RESTA APERTA**
- [-] A14 — Inventario documenti canonici — **INDICE E STRUTTURA CORRENTI PRESENTI; IL VECCHIO CONTEGGIO “40” NON VIENE RIUTILIZZATO COME DATO CORRENTE**
- [-] A15 — Legacy e file generati — **SEPARAZIONE CORRENTE FRA `docs/tennis-decision-ui/`, `docs/validations/` E `docs/archive/` VERIFICATA**
- [-] A16 — Matrice codice ↔ documentazione — **PARZIALE; NON COMPLETA**

## A3 — Struttura dei registri **COMPLETA**

- [x] Audit documentazione suddiviso in 4 moduli
- [x] Audit codice suddiviso in 7 moduli
- [x] Implementazioni proposte suddivise in 7 moduli
- [x] ID globali mantenuti nei registri
- [x] `scripts/check_registry_consistency.py` continua a usare i Blocchi E/F come righe sintetiche canoniche
- [x] La Todo mantiene un unico entry point operativo in `todo-list-tennis-decision-ui.md`; i Blocchi top-level sono modularizzati in child Markdown dedicati
- [x] Nessuno split aggiuntivo introdotto per sola dimensione

## A4 — Regole documentali correnti **COMPLETA**

- [x] Documentazione tecnica canonica in Markdown ordinario
- [x] Nessun nuovo documento `.mdx` richiesto dalla struttura corrente
- [x] Stato corrente, storico, futuro e validation devono restare distinti
- [x] La documentazione canonica deve descrivere soltanto comportamento supportato dal codice corrente
- [x] Decisioni approvate ma non implementate restano nei registri
- [x] Le validations sono evidenze datate e non sostituiscono l’autorità del codice
- [x] `docs/archive/` è non canonico e non costituisce prova di implementazione
- [x] Cronologia e provenance restano affidate a Git e alle validation datate, non a stati inventati nella Todo

---


