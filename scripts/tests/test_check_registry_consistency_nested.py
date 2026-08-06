#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import tempfile
import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts" / "check_registry_consistency.py"


def load_checker():
    spec = importlib.util.spec_from_file_location("registry_checker_nested_test", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("impossibile caricare il registry checker")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class NestedRegistryDiscoveryTest(unittest.TestCase):
    def test_owner_card_is_discovered_in_nested_directory(self):
        checker = load_checker()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            nested = root / "implementazioni" / "audit-codice"
            nested.mkdir(parents=True)
            (nested / "part.md").write_text(
                "### CODE-001 — Scheda annidata\n\n**Stato:** `CONFERMATO`\n",
                encoding="utf-8",
            )
            owners = checker.collect_owner_cards(root)
            self.assertIn("CODE-001", owners)
            self.assertEqual(owners["CODE-001"][0].file, "implementazioni/audit-codice/part.md")

    def test_latest_point_is_collected_from_audit_parts(self):
        checker = load_checker()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            impl = root / "implementazioni"
            nested = impl / "audit-codice"
            nested.mkdir(parents=True)
            (root / "todo-list-tennis-decision-ui.md").write_text("Prossimo passo: DA SELEZIONARE.\n", encoding="utf-8")
            (root / "implementazioni-tennis-decision-ui.md").write_text("Prossimo passo: DA SELEZIONARE.\n", encoding="utf-8")
            (nested / "part.md").write_text("## 22. Secondo audit del codice — Punto 7: Test\n", encoding="utf-8")
            metadata = checker.collect_summary_metadata(root, {}, {})
            self.assertEqual(metadata["auditPoint"], 7)


if __name__ == "__main__":
    unittest.main()
