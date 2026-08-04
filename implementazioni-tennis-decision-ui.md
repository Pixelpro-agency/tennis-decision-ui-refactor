# Tennis Decision UI — Revisione, implementazioni e controlli residui

## Scopo

Questo file è l’indice breve del registro modulare della revisione tecnica e documentale.

Non è:

- documentazione tecnica canonica;
- cronologia completa dei prompt;
- autorizzazione automatica a modificare il progetto;
- sostituto del codice, dei test o dei collaudi.

## Baseline

```txt
Repository: Pixelpro-agency/tennis-decision-ui-refactor
Branch canonico: main
SHA iniziale esaminato: ae9766dde97de08425d65cf62fe929aece3ba6a2
SHA codice verificato: 275008a5cd6451f24c6895068639ee3055395986
SHA checkpoint registri e avvio migrazione: eef267aab3c138395a5ca3d644a942190c5360e8
```

## Registri

- [Todo list e stato operativo](./todo-list-tennis-decision-ui.md)
- [Indice dei moduli analitici](./implementazioni/README.md)
- [Metodo, stati e regole](./implementazioni/00-metodo-e-stati.md)
- [Piano generale dell’audit](./implementazioni/01-piano-generale-audit.md)
- [Audit documentazione](./implementazioni/02-audit-documentazione.md)
- [Audit codice](./implementazioni/03-audit-codice.md)
- [Ricontrollo task completate](./implementazioni/04-task-completate.md)
- [Audit di docs/planning](./implementazioni/05-audit-docs-planning.md)
- [Implementazioni proposte](./implementazioni/06-implementazioni-proposte.md)
- [Workflow esecutivo](./implementazioni/07-workflow-esecutivo.md)
- [Linee guida per chat e AI](./implementazioni/08-linee-guida-chat-e-ai.md)
- [Decisioni dell’utente](./implementazioni/99-decisioni-utente.md)

## Regole di utilizzo

```txt
Todo
→ stato sintetico e punto corrente

modulo tematico
→ motivazioni, evidenze, rischi e criteri

codice, test e documenti owner
→ fonti tecniche effettive
```

Non duplicare rilievi completi in questo indice.

## Punto corrente

```txt
audit documentazione e codice B1–B6
→ completato

ricontrollo task D1–D18
→ completato

decisioni di prodotto e cleanup
→ completate

workflow multi-esecutore
→ definito

nove materiali locali fuori dalla documentazione canonica
→ letti integralmente
→ classificati
→ contenuti utili assorbiti nei registri
→ nessuna eliminazione eseguita

checkpoint corrente
→ Punti 1–7 registrati
→ audit tecnico completo
→ controllo finale post-audit completato
→ riscrittura documentale per batch approvata
→ Batch 0: inventario e manifest di migrazione
→ Batch 1 e Batch 2: documentazione strutturale approvata
→ Batch finale: 40 `.mdx` rimossi, link strict verde e workspace eliminato
→ IMPL-001 e IMPL-005: utility read-only implementate e verificate
→ 29 owner duplicati normalizzati; registry checker verde
```

Dopo la pubblicazione del checkpoint:

```txt
checkpoint audit materiali locali
→ pubblicazione
→ nuova lettura approfondita del codice
→ Punto 1 completato
→ writer authority approvata
→ Punto 2 completato
→ session authority approvata
→ Punto 3 completato
→ hardening e autorità Betfair approvati
→ Punto 4 completato
→ autorità persistence per evento e recovery verificata approvate
→ Punto 5 completato
→ eligibility, provenance temporale e semantica Market Reactions approvate
→ Punto 6 completato
→ session controller, polling session-scoped e integrity UI approvati
→ Punto 7 completato
→ runner, fixture, test map, result ledger e baseline approvati
→ controllo finale della raccolta dati e della robustezza completato
→ nessuna nuova area critica dimenticata rispetto ai Punti 1–7
→ DEC-025: documentazione canonica solo sullo stato reale
→ IMPL-032: migrazione documentale per batch con manifest e controlli
→ IMPL-028 implementata e validata sulla working tree reale
→ manifest corretto senza inventare test sostitutivi
→ profili fast/backend/frontend/python/full-offline verdi, incluso hotfix Windows per npm.cmd
→ precisione
→ robustezza
→ utilità
→ strutture mancanti
→ preparazione delle task esecutive prioritarie
```


## Fase documentale post-audit

```txt
Batch 0
→ registrazione delle decisioni
→ inventario dei documenti indicizzati
→ manifest vecchio percorso → nuovo percorso
→ owner matrix
→ link report
→ sostituzioni e cancellazioni .mdx completate nel batch finale

Batch 1 e 2
→ fondazione, architettura, stato corrente e validations preparati
→ fonti archive consolidate nei registri e copie ridondanti rimosse

Controlli read-only
→ link checker ricorsivo implementato
→ registry consistency checker implementato
→ finding strutturali da normalizzare prima del runner

Batch successivi
→ file .md completi
→ contenuti verificati sul codice corrente
→ futuro escluso dalla documentazione canonica finché non implementato
→ rimozione .mdx completata dopo verifica dei link e assenza di duplicati
```

Prossimo passo: IMPL-015 — writer authority esclusiva per `match_history`.
