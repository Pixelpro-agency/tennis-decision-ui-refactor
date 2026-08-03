# Replay e backtesting — planning archiviato

> **Documento non canonico. Funzionalità non implementata.**
>
> Conservato dalla precedente roadmap durante il Batch 2. Non prova l'esistenza di moduli, endpoint, CLI o dataset di replay.

## Intento storico

La proposta prevedeva una ricostruzione offline deterministica basata sulle timeline canoniche persistite:

```txt
timeline SofaScore + timeline Betfair
→ stream ordinato
→ Evidence ricostruita tick per tick
→ confronto versioni, analisi o export
```

## Input proposti

- timeline SofaScore;
- timeline Betfair;
- metadata evento e timestamp;
- versione e configurazione dell'algoritmo;
- contesto Source Identity storico applicabile.

Non erano considerati input primari:

- snapshot latest;
- history aggregata come sostituto delle timeline;
- dump di rete;
- cache o log;
- fetch live;
- browser.

## Invarianti proposte

Il replay avrebbe dovuto:

- leggere senza modificare i dati persistiti;
- ordinare i tick con timestamp e tie-breaker documentato;
- ricostruire Evidence senza chiamate esterne;
- calcolare l'epoch Betfair al cursore storico, senza informazione futura;
- rispettare Source Identity e dati mancanti;
- registrare versione e configurazione;
- produrre lo stesso risultato sullo stesso input.

Non avrebbe dovuto:

- aprire Chrome;
- avviare scraper;
- scrivere tick o history;
- usare dump browser come fonte algoritmica;
- dedurre causalità;
- trasformare osservazioni in segnali operativi.

## Sequenza proposta

```txt
selezione evento
→ caricamento timeline canoniche
→ validazione metadata e timestamp
→ costruzione stream ordinato
→ ricostruzione snapshot progressivi
→ calcolo Evidence con versione fissata
→ raccolta risultati
→ export o confronto
```

## Output proposti

```txt
eventId
algorithmVersion
configuration
inputRange
processedTicks
skippedTicks
dataQualitySummary
sourceIdentitySummary
evidenceSnapshots
reasons
startedAt
completedAt
```

L'output avrebbe distinto dato assente, stale, tick invalido, epoch esclusa, identity non allineata e calcolo riuscito.

## Source Identity storica

La proposta richiedeva una policy esplicita per collegare eventuali conferme a fingerprint, epoch e intervallo temporale. Una conferma corrente non avrebbe dovuto validare retroattivamente tick storici incompatibili.

## Backtesting

Il backtesting era subordinato a un replay affidabile e a:

- dataset riproducibile;
- regole di ingresso e uscita esplicite;
- nessuna informazione futura;
- costi e limiti definiti;
- risultati separati per versione;
- audit dei casi esclusi.

Non avrebbe dovuto usare dati simulati presentati come live, volume ambiguo direzionale, causalità presunta o feature non validate.

## Verifiche previste

```txt
nessun fetch live
nessun browser
timeline immutate
stesso input → stesso risultato
tick disordinati gestiti esplicitamente
epoch diverse non confrontate
identity pending blocca cross-source
tick invalidi esclusi con reason
versione registrata
```

## Stato alla data di archiviazione

Non esistevano moduli, endpoint, CLI o runner di replay. I requisiti utili restano nei registri e dovranno essere rivalutati quando l'implementazione verrà realmente avviata.

## Documenti correnti

- [Stato corrente](../../tennis-decision-ui/roadmap/01-current-state.md)
- [Timeline e history](../../tennis-decision-ui/modules/storage/01-timelines-and-history.md)
- [Match Evidence Snapshot](../../tennis-decision-ui/modules/evidence/01-match-evidence-snapshot.md)
