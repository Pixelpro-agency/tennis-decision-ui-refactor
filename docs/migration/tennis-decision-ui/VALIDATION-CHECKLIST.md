# Checklist di validazione della migrazione

## Prima di scrivere un batch

- [ ] SHA base verificato.
- [ ] Working tree pulita o diff nota.
- [ ] File vecchi letti integralmente.
- [ ] Code owner e test pertinenti ricontrollati.
- [ ] Finding e decisioni applicabili identificati.
- [ ] Contenuti unici da preservare elencati.
- [ ] Stato corrente distinto da approvato, futuro, storico e deprecato.

## Prima della consegna

- [ ] File completi, non frammenti.
- [ ] Nessun `export const meta` nei nuovi `.md`.
- [ ] Titoli e ordine presenti nell’indice.
- [ ] Owner unico per documento.
- [ ] Nessuna funzionalità assente presentata come implementata.
- [ ] Nessun contenuto tecnico importante perso.
- [ ] Link relativi dei file del batch verificati.
- [ ] Nessun link a un file eliminato.
- [ ] Nessun duplicato canonico non dichiarato.
- [ ] Diff controllata.
- [ ] Fence Markdown bilanciati.
- [ ] Encoding UTF-8 verificato.
- [ ] ZIP verificato con test di integrità.
- [ ] SHA-256 del pacchetto calcolato.
- [ ] Limiti e controlli non eseguiti dichiarati.
- [ ] Rollback documentato.

## Prima di eliminare un `.mdx`

- [ ] Sostituto `.md` completo presente.
- [ ] Indice aggiornato.
- [ ] README e link in ingresso aggiornati.
- [ ] Nessun riferimento `.mdx` residuo.
- [ ] `TEST-077`, `TEST-078` e `TEST-079` superati.
- [ ] Contenuto unico assorbito o archiviato.
- [ ] Revisione dell’utente completata.

## Chiusura del Batch 0

- [x] 40 documenti indicizzati verificati.
- [x] README verificato.
- [x] Manifest creato.
- [x] Owner matrix creata.
- [x] Link report creato.
- [x] Nessuna sostituzione.
- [x] Nessuna cancellazione.
- [x] Decisione DEC-025 registrata.
- [x] IMPL-032 registrata.
