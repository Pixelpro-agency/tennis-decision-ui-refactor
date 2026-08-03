from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "check_registry_consistency.py"
SPEC = importlib.util.spec_from_file_location("check_registry_consistency", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class RegistryConsistencyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "implementazioni").mkdir()
        self.write(
            "implementazioni/00-metodo-e-stati.md",
            "| `DOC-` | docs |\n| `IMPL-` | implementation |\n| `TEST-` | tests |\n",
        )
        self.write("implementazioni-tennis-decision-ui.md", "# Index\n")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write(self, relative: str, content: str) -> Path:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def todo(self, rows: str) -> None:
        self.write(
            "todo-list-tennis-decision-ui.md",
            "# Todo\n\n# BLOCCO E — Rilievi registrati\n\n" + rows + "\n",
        )

    def owner(self, content: str) -> None:
        self.write("implementazioni/03-audit-codice.md", content)

    def codes(self, report: dict[str, object]) -> set[str]:
        return {item["code"] for item in report["findings"]}

    def test_matching_owner_and_todo_row_pass(self) -> None:
        self.owner("### DOC-001 — Titolo\n\n**Stato:** `CONFERMATO`\n")
        self.todo("- [ ] `DOC-001` — Titolo — **CONFERMATO**")
        report = MODULE.check_registries(self.root)
        self.assertEqual(report["errors"], 0)

    def test_owner_without_todo_row(self) -> None:
        self.owner("### DOC-001 — Titolo\n\n**Stato:** `CONFERMATO`\n")
        self.todo("")
        report = MODULE.check_registries(self.root)
        self.assertIn("owner_without_synthetic_row", self.codes(report))

    def test_todo_row_without_owner(self) -> None:
        self.owner("# Audit\n")
        self.todo("- [ ] `DOC-001` — Titolo — **CONFERMATO**")
        report = MODULE.check_registries(self.root)
        self.assertIn("synthetic_row_without_owner", self.codes(report))

    def test_duplicate_owner_card(self) -> None:
        self.owner(
            "### DOC-001 — Uno\n\n**Stato:** `CONFERMATO`\n\n"
            "### DOC-001 — Due\n\n**Stato:** `CONFERMATO`\n"
        )
        self.todo("- [ ] `DOC-001` — Titolo — **CONFERMATO**")
        report = MODULE.check_registries(self.root)
        self.assertIn("duplicate_owner_card", self.codes(report))

    def test_duplicate_synthetic_row(self) -> None:
        self.owner("### DOC-001 — Uno\n\n**Stato:** `CONFERMATO`\n")
        self.todo(
            "- [ ] `DOC-001` — Uno — **CONFERMATO**\n"
            "- [ ] `DOC-001` — Due — **CONFERMATO**"
        )
        report = MODULE.check_registries(self.root)
        self.assertIn("duplicate_synthetic_row", self.codes(report))

    def test_unknown_prefix(self) -> None:
        self.owner("### DATA-001 — Uno\n\n**Stato:** `CONFERMATO`\n")
        self.todo("- [ ] `DATA-001` — Uno — **CONFERMATO**")
        report = MODULE.check_registries(self.root)
        self.assertIn("unknown_prefix", self.codes(report))

    def test_sha_256_in_prose_is_not_a_registry_prefix(self) -> None:
        self.owner("### DOC-001 — Uno\n\n**Stato:** `CONFERMATO`\n")
        self.todo("- [ ] `DOC-001` — Uno — **CONFERMATO**")
        self.write(
            "implementazioni/02-audit-documentazione.md",
            "Checksum del pacchetto: SHA-256.\n",
        )
        report = MODULE.check_registries(self.root)
        self.assertNotIn("unknown_prefix", self.codes(report))
        self.assertEqual(report["errors"], 0)

    def test_decisions_are_excluded_from_owner_todo_parity(self) -> None:
        self.write(
            "implementazioni/99-decisioni-utente.md",
            "## DEC-001 — Decisione\n\n**Stato:** approvata.\n",
        )
        self.owner("# Audit\n")
        self.todo("")
        report = MODULE.check_registries(self.root)
        self.assertNotIn("owner_without_synthetic_row", self.codes(report))
        self.assertNotIn("unknown_prefix", self.codes(report))

    def test_status_completed_vs_missing_is_incompatible(self) -> None:
        self.owner("### TEST-001 — Test\n\n**Stato:** `COMPLETATO`\n")
        self.todo("- [ ] `TEST-001` — Test — **MANCANTE**")
        report = MODULE.check_registries(self.root)
        self.assertIn("incompatible_status", self.codes(report))

    def test_approval_and_missing_are_not_treated_as_contradiction(self) -> None:
        self.owner("### IMPL-001 — Utility\n\n**Stato:** `APPROVATO`\n")
        self.todo("- [ ] `IMPL-001` — Utility — **MANCANTE**")
        report = MODULE.check_registries(self.root)
        self.assertNotIn("incompatible_status", self.codes(report))

    def test_references_before_block_e_are_not_synthetic_rows(self) -> None:
        self.owner("### DOC-001 — Titolo\n\n**Stato:** `CONFERMATO`\n")
        self.write(
            "todo-list-tennis-decision-ui.md",
            "# Todo\n\n- [x] summary (`DOC-001`)\n\n"
            "# BLOCCO E — Rilievi registrati\n\n"
            "- [ ] `DOC-001` — Titolo — **CONFERMATO**\n",
        )
        report = MODULE.check_registries(self.root)
        self.assertEqual(report["syntheticRows"], 1)
        self.assertNotIn("duplicate_synthetic_row", self.codes(report))

    def test_block_f_rows_are_canonical(self) -> None:
        self.owner("# Audit\n")
        self.write(
            "implementazioni/06-implementazioni-proposte.md",
            "### IMPL-001 — Utility\n\n**Stato:** `CONFERMATO`\n",
        )
        self.write(
            "todo-list-tennis-decision-ui.md",
            "# Todo\n\n# BLOCCO F — Implementazioni utili\n\n"
            "- [x] `IMPL-001` — Utility — **NECESSARIA**\n",
        )
        report = MODULE.check_registries(self.root)
        self.assertEqual(report["errors"], 0)

    def test_sha_baseline_mismatch(self) -> None:
        self.owner("### DOC-001 — Titolo\n\n**Stato:** `CONFERMATO`\n")
        self.todo("- [ ] `DOC-001` — Titolo — **CONFERMATO**")
        self.write(
            "implementazioni-tennis-decision-ui.md",
            "# Index\nSHA codice verificato: aaaaaaa\n",
        )
        todo_path = self.root / "todo-list-tennis-decision-ui.md"
        todo_path.write_text(
            todo_path.read_text(encoding="utf-8") + "\nSHA codice verificato: bbbbbbb\n",
            encoding="utf-8",
        )
        report = MODULE.check_registries(self.root)
        self.assertIn("sha_baseline_mismatch", self.codes(report))

    def test_range_and_latest_id_mismatch(self) -> None:
        self.owner("### TEST-002 — Due\n\n**Stato:** `CONFERMATO`\n")
        self.todo("- [ ] `TEST-001` — Uno — **CONFERMATO**")
        self.write(
            "implementazioni-tennis-decision-ui.md",
            "# Index\nTEST-001…001\n",
        )
        report = MODULE.check_registries(self.root)
        codes = self.codes(report)
        self.assertIn("synthetic_range_mismatch", codes)
        self.assertIn("latest_id_mismatch", codes)

    def test_latest_decision_must_be_summarized(self) -> None:
        self.owner("# Audit\n")
        self.todo("")
        self.write(
            "implementazioni/99-decisioni-utente.md",
            "## DEC-003 — Decisione\n\n**Stato:** approvata.\n",
        )
        report = MODULE.check_registries(self.root)
        self.assertIn("latest_decision_not_summarized", self.codes(report))


    def test_last_point_mismatch(self) -> None:
        self.owner(
            "## Secondo audit — Punto 7\n\n"
            "### DOC-001 — Titolo\n\n**Stato:** `CONFERMATO`\n"
        )
        self.todo("- [ ] `DOC-001` — Titolo — **CONFERMATO**")
        self.write(
            "implementazioni-tennis-decision-ui.md",
            "# Index\n→ Punto 6 completato\n",
        )
        report = MODULE.check_registries(self.root)
        self.assertIn("last_point_mismatch", self.codes(report))

    def test_next_step_mismatch(self) -> None:
        self.owner("### DOC-001 — Titolo\n\n**Stato:** `CONFERMATO`\n")
        self.write(
            "implementazioni-tennis-decision-ui.md",
            "# Index\n→ prossimo passo: IMPL-001 poi IMPL-028\n",
        )
        self.write(
            "todo-list-tennis-decision-ui.md",
            "# Todo\n\n# BLOCCO E — Rilievi registrati\n\n"
            "- [ ] `DOC-001` — Titolo — **CONFERMATO**\n\n"
            "## Prossimo punto\n\n```txt\nIMPL-005\n```\n",
        )
        report = MODULE.check_registries(self.root)
        self.assertIn("next_step_mismatch", self.codes(report))

    def test_cli_json_and_nonzero_exit(self) -> None:
        self.owner("# Audit\n")
        self.todo("- [ ] `DOC-001` — Missing — **CONFERMATO**")
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--root", str(self.root), "--format", "json"],
            check=False,
            capture_output=True,
            text=True,
        )
        payload = json.loads(result.stdout)
        self.assertEqual(result.returncode, 1)
        self.assertGreater(payload["errors"], 0)
        self.assertTrue(payload["readOnly"])


if __name__ == "__main__":
    unittest.main()
