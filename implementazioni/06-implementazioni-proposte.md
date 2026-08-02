# Tennis Decision UI — Implementazioni utili da valutare

> Queste voci non sono requisiti approvati. Diventano task soltanto dopo audit e decisione dell’utente.

## 13. Implementazioni utili da valutare dopo l’audit

Registro iniziale, non ancora approvato:

### IMPL-001 — Controllo automatico dei link MDX

**Stato:** `DA VERIFICARE`

Possibile utilità:

- rilevare link relativi rotti;
- evitare riferimenti a file rimossi;
- validare l’indice.

Da decidere:

- script Node o Python;
- esecuzione manuale o test;
- scope dei documenti legacy.

### IMPL-002 — Inventario automatico degli endpoint

**Stato:** `DA VERIFICARE`

Possibile utilità:

- confrontare router montati e documenti API;
- rilevare endpoint non documentati;
- rilevare documenti che citano route inesistenti.

Vincolo:

- non sostituire il controllo semantico dei payload.

### IMPL-003 — Matrice test ↔ modulo ↔ documento

**Stato:** `DA VERIFICARE`

Possibile utilità:

- sapere quali contratti sono coperti;
- distinguere test presenti, eseguiti e live;
- evitare di citare test non più esistenti.

### IMPL-004 — Archivio separato dei collaudi storici

**Stato:** `DA DECIDERE`

Possibile utilità:

- alleggerire la roadmap;
- conservare le prove;
- evitare perdita di memoria storica.

Rischio:

- creare un secondo sistema documentale troppo pesante.

### IMPL-005 — Controllo di coerenza Todo ↔ registro analitico

**Stato:** `DA VERIFICARE`

Possibile utilità:

- rilevare ID presenti in un file e assenti nell’altro;
- verificare stati incompatibili;
- mantenere conteggi coerenti.

Non deve:

- modificare automaticamente decisioni o priorità.

---
