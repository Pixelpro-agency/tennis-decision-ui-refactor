#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import subprocess
import sys
import zipfile
from pathlib import Path

EXPECTED_HEAD = "3de08ca09ac7cf3d64533b2e72b8f61d1d32f196"
TARGETS = [
    Path("implementazioni-tennis-decision-ui.md"),
    Path("todo-list-tennis-decision-ui.md"),
    Path("docs/validations/documentation-migration-finalization-2026-08-03.md"),
]


def run(args: list[str], cwd: Path, *, capture: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=cwd,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


def read_exact(path: Path) -> tuple[str, str]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        text = handle.read()
    newline = "\r\n" if "\r\n" in text else "\n"
    return text, newline


def write_exact(path: Path, text: str) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(text)


def adapt(value: str, newline: str) -> str:
    return value.replace("\n", newline)


def replace_once(text: str, old: str, new: str, *, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: attesa 1 occorrenza, trovate {count}")
    return text.replace(old, new, 1)


def main() -> int:
    repo = Path.cwd().resolve()

    head_result = run(["git", "rev-parse", "HEAD"], repo, capture=True)
    if head_result.returncode != 0:
        print("ERRORE: impossibile leggere HEAD.")
        print(head_result.stderr)
        return 2

    head = head_result.stdout.strip()
    if head != EXPECTED_HEAD:
        print(f"ERRORE: HEAD inatteso: {head}")
        print(f"Atteso: {EXPECTED_HEAD}")
        return 2

    missing = [str(path) for path in TARGETS if not (repo / path).is_file()]
    if missing:
        print("ERRORE: file mancanti:")
        for item in missing:
            print(item)
        return 2

    for mode in ([], ["--cached"]):
        check = run(
            ["git", "diff", *mode, "--quiet", "--", *(str(path) for path in TARGETS)],
            repo,
        )
        if check.returncode != 0:
            kind = "staged" if mode else "non staged"
            print(f"ERRORE: uno dei tre file contiene modifiche locali {kind}.")
            print("Nessun file è stato modificato.")
            return 2

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = Path.home() / "Desktop" / f"td-docs-realignment-backup-{stamp}.zip"
    with zipfile.ZipFile(backup, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for relative in TARGETS:
            archive.write(repo / relative, relative.as_posix())

    index_path = repo / TARGETS[0]
    index_text, index_nl = read_exact(index_path)

    old_index_block = adapt(
        """nove materiali locali fuori dalla documentazione canonica
→ letti integralmente
→ classificati
→ contenuti utili assorbiti nei registri
→ nessuna eliminazione eseguita""",
        index_nl,
    )
    new_index_block = adapt(
        """dieci fonti storiche fuori dalla documentazione canonica
→ lette integralmente
→ classificate
→ contenuti utili assorbiti nei registri e nelle validations
→ copie duplicate rimosse
→ `docs/archive/` ridotto al solo registro fonte → destinazione""",
        index_nl,
    )
    index_text = replace_once(
        index_text,
        old_index_block,
        new_index_block,
        label="implementazioni-tennis-decision-ui.md / fonti storiche",
    )

    old_index_tail = adapt(
        """→ IMPL-001 e IMPL-005: utility read-only implementate e verificate
→ 29 owner duplicati normalizzati; registry checker verde""",
        index_nl,
    )
    new_index_tail = adapt(
        """→ IMPL-001 e IMPL-005: utility read-only implementate e verificate
→ 29 owner duplicati normalizzati; registry checker verde
→ migrazione finale pubblicata: `2697f66ea8e17a9e35481299cb47ec402558df55`
→ cleanup archive pubblicato: `3de08ca09ac7cf3d64533b2e72b8f61d1d32f196`
→ prossimo passo tecnico: `IMPL-015`""",
        index_nl,
    )
    index_text = replace_once(
        index_text,
        old_index_tail,
        new_index_tail,
        label="implementazioni-tennis-decision-ui.md / checkpoint",
    )
    write_exact(index_path, index_text)

    todo_path = repo / TARGETS[1]
    todo_text, todo_nl = read_exact(todo_path)

    replacements = [
        (
            "> - [x] Audit dei materiali locali `docs/` fuori dalla documentazione canonica — **9 FILE CLASSIFICATI**",
            "> - [x] Audit delle fonti storiche fuori dalla documentazione canonica — **10 FONTI CLASSIFICATE, CONSOLIDATE E RIMOSSE**",
            "todo / conteggio fonti",
        ),
        (
            """> - [ ] Applicazione e push del Batch 0
> - [ ] Riscrittura Batch 1 strutturale
> - [ ] Revisione delle modifiche
> - [ ] Collaudo indipendente, quando necessario
> - [ ] Commit e push eseguiti dall’utente""",
            """> - [x] Applicazione e push del Batch 0 e dei batch documentali successivi
> - [x] Riscrittura strutturale completata
> - [x] Revisione delle modifiche completata
> - [x] Collaudo documentale indipendente completato
> - [x] Commit e push eseguiti dall’utente; SHA remoto verificato""",
            "todo / percorso operativo",
        ),
        (
            "Baseline remota del cleanup documentale: 2697f66ea8e17a9e35481299cb47ec402558df55",
            """Commit migrazione documentale finale: 2697f66ea8e17a9e35481299cb47ec402558df55
Commit cleanup archive pubblicato: 3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
Verifica push cleanup: LOCAL = REMOTE""",
            "todo / baseline",
        ),
        (
            "- [x] Materiale legacy — non canonico, rimozione differita",
            "- [x] Materiale legacy — contenuti unici consolidati e copie duplicate rimosse; `docs/archive/README.md` conserva la mappa fonte/destinazione",
            "todo / materiale legacy",
        ),
    ]

    for old, new, label in replacements:
        todo_text = replace_once(
            todo_text,
            adapt(old, todo_nl),
            adapt(new, todo_nl),
            label=label,
        )
    write_exact(todo_path, todo_text)

    validation_path = repo / TARGETS[2]
    validation_text, validation_nl = read_exact(validation_path)

    old_limit = adapt(
        """Il profilo `full-offline` era già verde sulla working tree reale prima della chiusura documentale. Deve essere rieseguito dopo l'applicazione del pacchetto finale per confermare lo stesso risultato sul repository completo.""",
        validation_nl,
    )
    new_limit = adapt(
        """Il profilo `full-offline` è stato rieseguito sulla working tree reale dopo la migrazione e dopo il cleanup dell'archivio. Entrambe le esecuzioni hanno restituito exit code `0`.""",
        validation_nl,
    )
    validation_text = replace_once(
        validation_text,
        old_limit,
        new_limit,
        label="validation / limite full-offline",
    )

    validation_text = replace_once(
        validation_text,
        adapt("Risultato richiesto:", validation_nl),
        adapt("Risultato verificato sulla working tree reale:", validation_nl),
        label="validation / risultato verificato",
    )

    marker = "## Verifica della pubblicazione remota — 4 agosto 2026"
    if marker in validation_text:
        raise RuntimeError("validation: blocco di pubblicazione remota già presente")

    append_block = adapt(
        """

## Verifica della pubblicazione remota — 4 agosto 2026

La migrazione documentale finale è stata pubblicata con:

```text
2697f66ea8e17a9e35481299cb47ec402558df55
docs: finalize canonical documentation migration
```

Il cleanup delle fonti archive consolidate è stato pubblicato con:

```text
3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
docs: remove consolidated legacy archive
```

Verifica conclusiva del cleanup:

```text
LOCAL=3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
REMOTE=3de08ca09ac7cf3d64533b2e72b8f61d1d32f196
PUSH_CLEANUP_VERIFICATO=1

LINKS=0
REGISTRY=0
FULL_OFFLINE=0
DIFF_CHECK=0
```

La fase documentale è chiusa. Il prossimo lavoro tecnico è `IMPL-015` —
writer authority esclusiva per `match_history`.
""",
        validation_nl,
    )
    validation_text = validation_text.rstrip("\r\n") + append_block
    write_exact(validation_path, validation_text)

    print(f"BACKUP={backup}")
    print("FILE_MODIFICATI=3")

    checks = [
        ([sys.executable, "scripts/check_documentation_links.py", "--forbid-mdx-links"], "LINKS"),
        ([sys.executable, "scripts/check_registry_consistency.py"], "REGISTRY"),
        (["node", "scripts/validation/run.mjs", "full-offline"], "FULL_OFFLINE"),
        (["git", "diff", "--check"], "DIFF_CHECK"),
    ]

    results: dict[str, int] = {}
    for command, name in checks:
        completed = run(command, repo)
        results[name] = completed.returncode

    print("\n=== DIFF DEI TRE FILE ===")
    run(["git", "diff", "--stat", "--", *(str(path) for path in TARGETS)], repo)
    run(["git", "diff", "--", *(str(path) for path in TARGETS)], repo)

    print("\n=== RISULTATO ===")
    print(" ".join(f"{name}={code}" for name, code in results.items()))

    return 0 if all(code == 0 for code in results.values()) else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"ERRORE: {exc}")
        print("Nessun commit o push è stato eseguito.")
        raise SystemExit(2)
