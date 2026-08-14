> **Parte 2 di 7 — Runtime, sessioni e Betfair**
> Secondo audit — Punti 2 e 3: tracking, Start/Stop, generazioni, callback tardive, lifecycle Betfair, Graph, diagnostica, concorrenza e cleanup.
> [Indice](../03-audit-codice.md) · [Parte 1](01-rilievi-iniziali.md) · [Parte 3](03-storage-recovery.md)

# Runtime, sessioni e Betfair

Questo file mantiene il percorso stabile della Parte 2 e instrada ai due audit snapshot separati per responsabilità.

## Moduli

- [Punto 2 — Session Authority, Start/Stop, generation e callback tardive](02-runtime-sessioni-betfair/01-session-authority-start-stop.md)
  - Baseline: `dda406c4a07ae4a1debfcab39db346e47c33c419`
- [Punto 3 — Betfair Lifecycle / Control Plane](02-runtime-sessioni-betfair/02-betfair-lifecycle-control-plane.md)
  - Baseline: `cf249ad669347fb06dc69d876d68af591a7f5639`

Il Punto 2 possiede il record storico relativo a tracking session authority, Start/Stop, generation, Source Identity e lifecycle frontend collegato. Il Punto 3 possiede il record storico relativo a lifecycle Betfair, Graph, diagnostica, control plane, dati, capture, cache, retention e cleanup.

## Autorità temporale

Punto 2 e Punto 3 restano audit snapshot sulle baseline dichiarate nei rispettivi moduli. `COMPLETATO E APPROVATO` qualifica l’esecuzione e l’approvazione dell’audit, non l’implementazione automatica dei target.

Le indicazioni di `Stato corrente` riportate nei singoli finding prevalgono, per il comportamento attuale, sulle qualificazioni storiche del relativo finding. Priorità, decisioni e ordine tecnico restano quelli del checkpoint e non costituiscono istruzioni operative correnti.

Il contenuto integrale dei due audit è mantenuto nei rispettivi child; il facade non duplica owner card, test gap, decisioni o sintesi IMPL.
