# Selezione del contesto e linee guida per AI

## Scopo

Questo documento definisce il contesto minimo e le regole operative da inserire nei prompt destinati a chat o AI che lavorano su Tennis Decision UI.

Il ciclo esecutivo completo, la distinzione tra `fileModificati.md` e report e i criteri di chiusura sono definiti in [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md).

Questo documento non sostituisce:

- codice;
- test;
- documentazione tecnica owner;
- decisioni dell’utente;
- workflow esecutivo completo.

## 1. Prima di iniziare

Verificare:

```txt
repository
branch
SHA
obiettivo
modalità
scope
file modificabili
file consultabili
file esclusi
controllo mirato
```

Repository ordinaria:

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

Non cambiare ruolo durante la stessa esecuzione.

Uso sintetico:

| Modalità | Uso |
| --- | --- |
| `CHAT_ANALISI` | Analisi, delimitazione, preparazione prompt e revisione |
| `CHAT_ESECUTORE` | Consegna deterministica tramite chat browser, poi report dopo gli artefatti locali |
| `DESKTOP_ESECUTORE` | Modifica locale, controlli, `fileModificati.md` e report separato |
| `DESKTOP_COLLAUDATORE` | Collaudo indipendente senza modifiche |

## 3. Gerarchia delle fonti

```txt
decisione utente recente
→ stato locale autorizzato e fileModificati.md
→ test sullo stesso stato
→ codice corrente
→ documento owner
→ registri
→ planning e report storici
```

Quando le fonti divergono, non inventare una sintesi.

## 4. Selezione minima del contesto

Includere soltanto:

1. obiettivo concreto;
2. file modificabili;
3. file consultabili;
4. file esclusi;
5. documento owner;
6. contratto condiviso soltanto se attraversato;
7. test o controllo mirato;
8. decisioni utente pertinenti;
9. procedura per `fileModificati.md`;
10. formato e momento del report finale.

Non caricare automaticamente:

- repository completo;
- Repomix globale;
- history o timeline reali;
- cache;
- dump;
- profili browser;
- `.env`;
- credenziali;
- report storici non pertinenti;
- tutti i documenti canonici.

## 5. Informazioni obbligatorie del prompt

Ogni prompt deve indicare:

```txt
ID e titolo
modalità
obiettivo unico
repository / root / branch / SHA
file modificabili
file consultabili
file esclusi
documento owner
comportamento richiesto
contratti da preservare
controlli
massimo tre tentativi
criterio di successo
criterio di stop
impatto documentale
metodo unico di consegna
generazione obbligatoria di fileModificati.md
momento del report finale
commit: no
push: no
```

Un file consultabile non diventa modificabile.

Un file non elencato tra quelli modificabili resta fuori scope.

## 6. Regola obbligatoria su `fileModificati.md`

Ogni prompt che può creare o modificare file deve stabilire:

```txt
fileModificati.md
→ obbligatorio
→ generato sulla copia locale
→ contiene tutti e soli i file creati o modificati dalla task
→ contiene il contenuto completo dei file
→ non contiene il report
→ non viene committato
```

Il prompt deve riportare il comando o il meccanismo esatto di generazione.

Comando ordinario:

```powershell
$repomixInclude = 'percorso/file1,percorso/file2'
npx.cmd --yes repomix@latest -o fileModificati.md --style markdown --include "$repomixInclude"
```

Se i file cambiano durante un tentativo successivo, `fileModificati.md` deve essere rigenerato.

Non accettare come sostituti:

- elenco dei file;
- manifest della consegna;
- riepilogo della chat;
- contenuti ricostruiti dal repository remoto;
- output parziali.

## 7. Regola obbligatoria sul report

Il report è una risposta separata dell’Esecutore.

Non viene inserito dentro `fileModificati.md`.

Per `DESKTOP_ESECUTORE`:

```txt
modifiche locali
→ controlli
→ fileModificati.md
→ report finale separato
```

Per `CHAT_ESECUTORE`:

```txt
consegna iniziale senza report finale
→ applicazione locale
→ controlli
→ fileModificati.md
→ restituzione degli output reali alla Chat Esecutore
→ report finale separato
```

La Chat Esecutore non può produrre il report finale prima di avere ricevuto e letto:

```txt
fileModificati.md
+
output ed exit code reali
```

La prima risposta della Chat Esecutore è una consegna pronta per applicazione, non un report conclusivo.

## 8. CHAT_ESECUTORE

La Chat Esecutore legge GitHub ma non modifica la copia locale.

Deve scegliere un solo metodo di consegna:

```txt
file completi
ZIP
script patch Python
comandi mirati
patch piccola
```

La consegna iniziale deve includere:

- SHA base;
- manifest dei file previsti;
- istruzioni di applicazione;
- controlli;
- risultato atteso;
- rollback;
- limiti;
- procedura per generare `fileModificati.md`;
- divieto di commit e push.

La consegna iniziale non deve includere:

- dichiarazione di task completata;
- dichiarazione di test locali superati;
- report finale;
- `fileModificati.md` presentato come proveniente dalla working tree;
- approvazione del risultato.

Dopo l’applicazione, la Chat Esecutore riceve `fileModificati.md` e gli output reali, li legge integralmente e produce il report separato.

## 9. DESKTOP_ESECUTORE

Deve:

- iniziare subito;
- verificare branch, SHA e status;
- modificare solo i file autorizzati;
- eseguire i controlli;
- fare massimo tre tentativi;
- creare o sovrascrivere `fileModificati.md`;
- restituire `fileModificati.md`;
- produrre il report finale separato;
- non fare commit o push;
- non approvare il proprio lavoro.

Può fare una sola domanda soltanto davanti a un blocco tecnico oggettivo.

## 10. DESKTOP_COLLAUDATORE

Deve:

- usare interazioni reali;
- non modificare file;
- non forzare stato tramite DOM o console;
- registrare finding;
- distinguere difetto e limitazione strumentale;
- fermarsi dopo una perdita critica;
- fare massimo tre tentativi;
- produrre una matrice `PASS / FAIL / BLOCCATO`;
- non creare o aggiornare `fileModificati.md`;
- non fare commit o push.

## 11. Contenuto minimo del report Esecutore

Il report separato deve contenere:

- ID e modalità;
- SHA base;
- file letti;
- file creati;
- file modificati;
- file eliminati;
- riepilogo;
- comandi ed exit code reali;
- test e risultati reali;
- tentativi;
- warning e limiti;
- working tree o stato locale fornito;
- impatto documentale;
- commit: no;
- push: no;
- stato per revisione.

Il report non sostituisce `fileModificati.md`.

`fileModificati.md` non sostituisce il report.

## 12. Decisioni mancanti

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

## 13. Confini tecnici permanenti

- non ricostruire Evidence nel frontend;
- non dedurre causalità;
- non usare dump come input algoritmico;
- non modificare timeline per risolvere Source Identity;
- non trattare health come persistence;
- non trattare il nome runner come identità Betfair quando è richiesto `selectionId`;
- non introdurre un nuovo blocco di Start per un problema interno a Market Reactions;
- non terminare processi in base alla sola porta;
- non modificare wrapper root per un refactor interno non collegato.

## 14. Navigazione del codice

Ordine preferito:

1. indice o repository map;
2. documento owner;
3. file target;
4. import indispensabili;
5. consumer diretti se il contratto cambia;
6. test più vicino;
7. fixture o helper locale.

Non leggere automaticamente test fratelli o intere directory.

## 15. Diagnosi e modularizzazione

Prima di proporre una divisione identificare:

- responsabilità primaria;
- export pubblici;
- input e output;
- stato e durata;
- side effect;
- dipendenze;
- consumer;
- test;
- confine naturale.

Classificare il file come:

```txt
facade/orchestratore
logica pura
adapter I/O
persistenza
stato runtime
fixture/helper
test unitario
test integrazione
test sicurezza/recovery
```

Regole:

- lasciare nel file principale facade, composizione o entry point;
- estrarre funzioni pure;
- separare filesystem, rete, processi, clock e log;
- separare stato runtime e policy;
- usare dependency injection quando riduce I/O reale nei test;
- evitare cartelle intermedie senza owner chiaro;
- non rompere export pubblici prima della migrazione dei consumer.

## 16. Template minimo

```txt
ID e titolo:
Modalità:
Obiettivo:
Repository / root / branch / SHA:

File modificabili:
- ...

File consultabili:
- ...

File esclusi:
- ...

Documento owner:
- ...

Contratti da preservare:
- ...

Controlli:
- ...

Massimo tre tentativi:
- sì

Metodo unico di consegna:
- ...

fileModificati.md:
- obbligatorio;
- comando o meccanismo esatto;
- tutti e soli i file creati o modificati;
- contenuto completo;
- non contiene il report;
- non viene committato.

Sequenza del report:
- consegna iniziale senza report finale;
- applicazione e controlli locali;
- ricezione e lettura di fileModificati.md;
- report finale separato.

Criterio di successo:
- ...

Criterio di stop:
- ...

Impatto documentale:
- ...

Commit:
- no

Push:
- no
```

## 17. Checklist

```txt
[ ] Un solo obiettivo verificabile.
[ ] Branch e SHA base dichiarati.
[ ] File modificabili, consultabili ed esclusi separati.
[ ] Documento owner individuato.
[ ] Contratti condivisi inclusi soltanto se attraversati.
[ ] Controllo mirato reale e ripetibile.
[ ] Massimo tre tentativi esplicitato.
[ ] Metodo unico di consegna.
[ ] fileModificati.md obbligatorio.
[ ] Elenco esatto dei file da includere.
[ ] fileModificati.md separato dal report.
[ ] Report finale vietato nella consegna iniziale della Chat Esecutore.
[ ] Report prodotto solo dopo fileModificati.md e output reali.
[ ] Nessun dato sensibile incluso.
[ ] Impatto documentale dichiarato.
[ ] Commit e push riservati all’utente.
```

## Documenti collegati

- [Workflow esecutivo e criteri di chiusura](./03-workflow-esecutivo.md)
- [Convenzioni della documentazione](./02-documentation-conventions.md)
- [Mappa del repository](../reference/01-repository-map.md)
