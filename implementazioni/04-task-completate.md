# Tennis Decision UI — Ricontrollo delle task considerate completate

> Ogni task deve essere riconfermata sul repository corrente distinguendo implementazione, test automatici e collaudo live.

## 12. Ricontrollo delle task considerate completate

Per ogni task:

```txt
contratto dichiarato
→ file effettivi
→ test automatici
→ eventuale collaudo live
→ documentazione owner
→ limiti ancora aperti
→ stato reale
```

Esiti possibili:

| Esito | Significato |
| --- | --- |
| `CONFERMATA` | Implementazione e prove coerenti |
| `CONFERMATA CON LIMITI` | Corretta, ma con validazioni ancora aperte |
| `DOCUMENTAZIONE DA CORREGGERE` | Codice corretto, testo non allineato |
| `TEST DA AGGIORNARE` | Implementazione plausibile, copertura insufficiente o obsoleta |
| `DA RIAPRIRE` | Discrepanza concreta nel comportamento attuale |
| `NON VERIFICABILE` | Mancano dati, ambiente o evidenze sufficienti |

Non usare `DA RIAPRIRE` per un semplice hardening futuro.

---
