from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "check_documentation_links.py"
SPEC = importlib.util.spec_from_file_location("check_documentation_links", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class DocumentationLinkCheckerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write(self, relative: str, content: str) -> Path:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def test_valid_relative_link_and_anchor(self) -> None:
        self.write("README.md", "[Owner](docs/owner.md#stato-corrente)\n")
        self.write("docs/owner.md", "# Owner\n\n## Stato corrente\n")
        report = MODULE.check_links(self.root)
        self.assertEqual(report["errors"], 0)
        self.assertEqual(report["scannedLinks"], 1)

    def test_missing_target_reports_source_line_and_target(self) -> None:
        self.write("README.md", "prima\n[Missing](docs/missing.md)\n")
        report = MODULE.check_links(self.root)
        finding = report["findings"][0]
        self.assertEqual(finding["code"], "target_missing")
        self.assertEqual(finding["source"], "README.md")
        self.assertEqual(finding["line"], 2)
        self.assertEqual(finding["target"], "docs/missing.md")

    def test_missing_anchor_is_distinct(self) -> None:
        self.write("README.md", "[Owner](docs/owner.md#assente)\n")
        self.write("docs/owner.md", "# Owner\n")
        report = MODULE.check_links(self.root)
        self.assertEqual(report["findings"][0]["code"], "anchor_missing")

    def test_anchor_on_non_markdown_is_unverifiable(self) -> None:
        self.write("README.md", "[Data](data.json#field)\n")
        self.write("data.json", "{}")
        report = MODULE.check_links(self.root)
        self.assertEqual(report["findings"][0]["code"], "anchor_unverifiable")

    def test_mdx_link_is_warning_or_error_by_policy(self) -> None:
        self.write("README.md", "[Legacy](docs/legacy.mdx)\n")
        self.write("docs/legacy.mdx", "# Legacy\n")
        warning_report = MODULE.check_links(self.root)
        error_report = MODULE.check_links(self.root, forbid_mdx_links=True)
        self.assertEqual(warning_report["warnings"], 1)
        self.assertEqual(warning_report["errors"], 0)
        self.assertEqual(error_report["errors"], 1)

    def test_links_inside_fenced_code_are_ignored(self) -> None:
        self.write("README.md", "```md\n[Fake](missing.md)\n```\n")
        report = MODULE.check_links(self.root)
        self.assertEqual(report["scannedLinks"], 0)
        self.assertEqual(report["errors"], 0)

    def test_external_links_are_ignored(self) -> None:
        self.write("README.md", "[Web](https://example.com/missing#x)\n")
        report = MODULE.check_links(self.root)
        self.assertEqual(report["errors"], 0)

    def test_reference_definition_is_checked(self) -> None:
        self.write("README.md", "[owner]: docs/owner.md\n")
        report = MODULE.check_links(self.root)
        self.assertEqual(report["findings"][0]["code"], "target_missing")

    def test_legacy_directory_is_excluded_by_default(self) -> None:
        self.write("legacy/old.md", "[Missing](nowhere.md)\n")
        default_report = MODULE.check_links(self.root)
        included_report = MODULE.check_links(self.root, include_legacy=True)
        self.assertEqual(default_report["scannedFiles"], 0)
        self.assertEqual(included_report["errors"], 1)

    def test_duplicate_headings_receive_github_style_suffix(self) -> None:
        self.write("README.md", "[Second](owner.md#sezione-1)\n")
        self.write("owner.md", "# Owner\n\n## Sezione\n\n## Sezione\n")
        report = MODULE.check_links(self.root)
        self.assertEqual(report["errors"], 0)

    def test_cli_json_and_exit_code(self) -> None:
        self.write("README.md", "[Missing](missing.md)\n")
        result = subprocess.run(
            [sys.executable, str(SCRIPT), "--root", str(self.root), "--format", "json"],
            check=False,
            capture_output=True,
            text=True,
        )
        payload = json.loads(result.stdout)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(payload["errors"], 1)
        self.assertTrue(payload["readOnly"])


if __name__ == "__main__":
    unittest.main()
