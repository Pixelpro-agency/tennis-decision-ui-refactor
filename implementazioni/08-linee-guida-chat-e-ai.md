# Tennis Decision UI — Linee guida per chat e AI

## Scopo

Guida operativa per qualunque chat o AI che lavori sul progetto.

Non sostituisce:

- codice;
- test;
- documentazione tecnica owner;
- decisioni dell’utente;
- workflow completo.

## 1. Prima di iniziare

Verificare:

```txt
repository
branch
SHA
obiettivo
modalità
scope
working tree, se disponibile
```

Repository:

```txt
Pixelpro-agency/tennis-decision-ui-refactor
```

Branch ordinario:

```txt
main
```

## 2. Ruoli disponibili

```txt
CHAT_ANALISI
CHAT_ESECUTORE
DESKTOP_ESECUTORE
DESKTOP_COLLAUDATORE
```

Non cambiare ruolo durante la stessa task.

## 3. Selezione minima del contesto

Includere soltanto:

1. obiettivo concreto;
2. file modificabili;
3. file consultabili;
4. documento owner;
5. contratto condiviso soltanto se attraversato;
6. test o controllo mirato;
7. decisioni utente pertinenti.

Non caricare automaticamente:

- repository completo;
- Repomix globale;
- history/timeline reali;
- cache;
- dump;
- profili browser;
- `.env`;
- credenziali;
- report storici non pertinenti;
- tutti i documenti canonici.

## 4. Gerarchia delle fonti

```txt
decisione utente recente
→ stato locale autorizzato
→ test sullo stesso stato
→ codice corrente
→ documento owner
→ registri
→ planning/report storici
```

Quando le fonti divergono, non inventare una sintesi.

## 5. Confini tecnici permanenti

- non ricostruire Evidence nel frontend;
- non dedurre causalità;
- non usare dump come input algoritmico;
- non modificare timeline per risolvere Source Identity;
- non trattare health come persistence;
- non trattare il nome runner come identità Betfair quando è richiesto `selectionId`;
- non introdurre un nuovo blocco di Start per un problema interno a Market Reactions;
- non terminare processi in base alla sola porta;
- non modificare wrapper root per un refactor interno non collegato.

## 6. CHAT_ESECUTORE

La Chat Esecutore legge GitHub ma non modifica la copia locale.

Deve scegliere una consegna:

```txt
file completi
ZIP
script patch Python
comandi Git Bash
patch piccola
```

Deve produrre:

- manifest dei file;
- istruzioni di applicazione;
- controlli;
- rollback;
- limiti;
- nessuna dichiarazione falsa di test locale eseguito.

Non deve fornire contemporaneamente più metodi concorrenti senza necessità.

## 7. DESKTOP_ESECUTORE

Deve:

- iniziare subito;
- verificare branch/SHA/status;
- modificare solo i file autorizzati;
- eseguire i controlli;
- fare massimo tre tentativi;
- creare `fileModificati.md`;
- non fare commit/push;
- non approvare il proprio lavoro.

Può fare una sola domanda soltanto davanti a un blocco tecnico oggettivo.

## 8. DESKTOP_COLLAUDATORE

Deve:

- usare interazioni reali;
- non modificare file;
- non forzare stato tramite DOM o console;
- registrare finding;
- distinguere difetto e limitazione strumentale;
- fermarsi dopo una perdita critica;
- fare massimo tre tentativi;
- produrre matrice `PASS / FAIL / BLOCCATO`.

## 9. Report Esecutore

Minimo:

- ID e modalità;
- SHA base;
- file letti/modificati/creati/eliminati;
- riepilogo;
- comandi ed exit code;
- tentativi;
- warning;
- working tree;
- commit: no;
- push: no;
- stato per revisione.

## 10. Report Collaudatore

Minimo:

- ambiente;
- stato iniziale;
- passaggi;
- atteso/reale;
- console;
- reload/persistenza;
- finding;
- matrice;
- limiti;
- stato finale.

## 11. Decisioni mancanti

Fermarsi e chiedere all’utente quando una scelta cambia:

- comportamento;
- dati;
- persistenza;
- UI;
- risultato;
- scope di rimozione;
- compatibilità.

Non chiedere per:

- informazioni recuperabili;
- metodi tecnici equivalenti;
- controlli necessari;
- nomi temporanei;
- dettagli già decisi.

## 12. Git

Nessuna chat o Desktop esegue commit/push.

L’utente pubblica su `main` soltanto dopo la revisione della Chat Analisi.
