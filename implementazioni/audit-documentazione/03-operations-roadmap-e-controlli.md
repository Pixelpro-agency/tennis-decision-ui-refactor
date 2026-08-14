## Nota di lettura

Questo documento è la facade stabile del record storico dei checkpoint B5 e B6. Percorsi, stati, finding, priorità e classificazioni conservati nei due checkpoint descrivono il progetto nel momento delle rispettive verifiche e non costituiscono un inventario corrente.

Dopo la migrazione documentale:

- l’indice canonico è `docs/tennis-decision-ui/index.md` e gli owner canonici usano `.md`;
- le validazioni storiche sono separate sotto `docs/validations/` e non sono owner del comportamento runtime corrente;
- il journal dei commit pending usa `backend/match_history/.pending_commits/`;
- esiste il runner locale `scripts/validation/run.mjs`; il manifest non copre ancora ogni test legacy e i profili persistence, benchmark e live non sono implementati;
- replay offline canonico, backtesting e Market Reactions Journal persistito restano non implementati; le specifiche storiche ancora utili sono conservate nei registri correnti.

I due checkpoint restano invariati come provenance storica, compresi i riferimenti `.mdx`, la distinzione fra test letti ed eseguiti e la baseline dichiarata in B6.

## Checkpoint

- [B5 — Operations e roadmap](./03-operations-roadmap-e-controlli/01-operations-roadmap-b5.md)
- [B6 — Controlli trasversali e chiusura dell’audit](./03-operations-roadmap-e-controlli/02-controlli-trasversali-b6.md)
