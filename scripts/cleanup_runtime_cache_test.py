from __future__ import annotations

import os
import tempfile
import unittest
from unittest import mock
import socket
from pathlib import Path

from scripts import cleanup_runtime_cache as cleanup


class CleanupRuntimeCacheTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.now = 2_000_000_000.0

        for relative_dir in cleanup.CACHE_RELATIVE_DIRS.values():
            (self.root / relative_dir).mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def cache_dir(self, cache_name: str) -> Path:
        return self.root / cleanup.CACHE_RELATIVE_DIRS[cache_name]

    def add_file(
        self,
        cache_name: str,
        filename: str,
        payload: bytes,
        age_days: float = 0.0,
        age_seconds_extra: float = 0.0,
    ) -> Path:
        path = self.cache_dir(cache_name) / filename
        path.write_bytes(payload)
        timestamp = (
            self.now
            - (age_days * cleanup._SECONDS_PER_DAY)
            - age_seconds_extra
        )
        os.utime(str(path), (timestamp, timestamp))
        return path

    def run_utility(
        self,
        selected_caches=("betfair",),
        max_age_days=None,
        max_files=None,
        max_total_bytes=None,
        apply=False,
        offline_confirmed=False,
        session_checker=None,
        unlinker=None,
    ):
        policies = cleanup.RetentionPolicies(
            max_age_days=max_age_days,
            max_files=max_files,
            max_total_bytes=max_total_bytes,
        )
        return cleanup.run_cleanup(
            selected_caches=selected_caches,
            policies=policies,
            apply=apply,
            offline_confirmed=offline_confirmed,
            project_root=self.root,
            now_epoch=self.now,
            session_checker=session_checker or (lambda _root: []),
            unlinker=unlinker,
        )

    def candidate_paths(self, report):
        return {item["path"] for item in report["candidates"]}

    def test_dry_run_does_not_modify_files(self) -> None:
        path = self.add_file("betfair", "old.json", b"123")

        report = self.run_utility(max_files=0)

        self.assertEqual(report["mode"], "dry-run")
        self.assertTrue(path.exists())
        self.assertEqual(report["removed"], [])
        self.assertEqual(
            self.candidate_paths(report),
            {"backend/betfair_cache/old.json"},
        )

    def test_max_age_selects_old_file(self) -> None:
        old_path = self.add_file("betfair", "old.json", b"old", age_days=8)
        fresh_path = self.add_file("betfair", "fresh.json", b"fresh", age_days=1)

        report = self.run_utility(max_age_days=7)

        self.assertEqual(
            self.candidate_paths(report),
            {"backend/betfair_cache/old.json"},
        )
        self.assertTrue(old_path.exists())
        self.assertTrue(fresh_path.exists())
        self.assertEqual(report["candidates"][0]["reasons"], ["max_age"])

    def test_max_files_selects_oldest_needed(self) -> None:
        self.add_file("betfair", "oldest.json", b"1", age_days=3)
        self.add_file("betfair", "middle.json", b"2", age_days=2)
        self.add_file("betfair", "newest.json", b"3", age_days=1)

        report = self.run_utility(max_files=1)

        self.assertEqual(
            self.candidate_paths(report),
            {
                "backend/betfair_cache/oldest.json",
                "backend/betfair_cache/middle.json",
            },
        )

    def test_max_total_bytes_selects_oldest_needed(self) -> None:
        self.add_file("betfair", "oldest.json", b"12345", age_days=3)
        self.add_file("betfair", "middle.json", b"1234", age_days=2)
        self.add_file("betfair", "newest.json", b"123", age_days=1)

        report = self.run_utility(max_total_bytes=6)

        self.assertEqual(
            self.candidate_paths(report),
            {
                "backend/betfair_cache/oldest.json",
                "backend/betfair_cache/middle.json",
            },
        )

    def test_multiple_policies_keep_one_candidate_with_all_reasons(self) -> None:
        self.add_file("betfair", "old.json", b"old", age_days=8)
        self.add_file("betfair", "fresh.json", b"fresh", age_days=1)

        report = self.run_utility(max_age_days=7, max_files=1)

        self.assertEqual(len(report["candidates"]), 1)
        candidate = report["candidates"][0]
        self.assertEqual(candidate["path"], "backend/betfair_cache/old.json")
        self.assertEqual(candidate["reasons"], ["max_age", "max_files"])

    def test_apply_without_offline_confirmation_blocks_without_scanning_or_changes(self) -> None:
        path = self.add_file("betfair", "old.json", b"old")

        report = self.run_utility(
            max_files=0,
            apply=True,
            offline_confirmed=False,
            session_checker=lambda _root: self.fail("must not check session"),
        )

        self.assertTrue(report["blocked"])
        self.assertEqual(report["blockReasons"], ["offline_confirmation_required"])
        self.assertEqual(report["scanned"], {"files": 0, "bytes": 0})
        self.assertEqual(report["candidates"], [])
        self.assertTrue(path.exists())
        self.assertTrue(
            any(str(item).startswith("usage:") for item in report["errors"])
        )

    def test_active_session_blocks_apply_without_changes(self) -> None:
        path = self.add_file("betfair", "old.json", b"old")

        report = self.run_utility(
            max_files=0,
            apply=True,
            offline_confirmed=True,
            session_checker=lambda _root: ["launcher_lock_exists"],
        )

        self.assertTrue(report["blocked"])
        self.assertEqual(report["blockReasons"], ["launcher_lock_exists"])
        self.assertEqual(report["removed"], [])
        self.assertTrue(path.exists())

    def test_removal_error_does_not_stop_other_removals(self) -> None:
        failing = self.add_file("betfair", "failing.json", b"1234", age_days=2)
        removable = self.add_file("betfair", "removable.json", b"123", age_days=1)

        def flaky_unlink(path: Path) -> None:
            if path.name == "failing.json":
                raise OSError("simulated removal failure")
            path.unlink()

        report = self.run_utility(
            max_files=0,
            apply=True,
            offline_confirmed=True,
            unlinker=flaky_unlink,
        )

        self.assertTrue(failing.exists())
        self.assertFalse(removable.exists())
        self.assertEqual(
            [item["path"] for item in report["removed"]],
            ["backend/betfair_cache/removable.json"],
        )
        self.assertEqual(report["recoveredBytes"], 3)
        self.assertTrue(
            any("remove failed for backend/betfair_cache/failing.json" in item
                for item in report["errors"])
        )

    def test_directories_and_non_json_files_are_skipped(self) -> None:
        nested_dir = self.cache_dir("betfair") / "nested"
        nested_dir.mkdir()
        text_file = self.cache_dir("betfair") / "note.txt"
        text_file.write_text("metadata only", encoding="utf-8")
        self.add_file("betfair", "eligible.json", b"1")

        report = self.run_utility(max_files=0)

        skipped = {(item["path"], item["reason"]) for item in report["skipped"]}
        self.assertIn(("backend/betfair_cache/nested", "directory"), skipped)
        self.assertIn(("backend/betfair_cache/note.txt", "non_json"), skipped)
        self.assertEqual(
            self.candidate_paths(report),
            {"backend/betfair_cache/eligible.json"},
        )

    def test_symlink_is_skipped_and_never_selected(self) -> None:
        target = self.add_file("betfair", "target.json", b"target")
        link = self.cache_dir("betfair") / "link.json"

        try:
            link.symlink_to(target)
        except (NotImplementedError, OSError) as exc:
            self.skipTest("symlink creation unavailable: {0}".format(type(exc).__name__))

        report = self.run_utility(max_files=0)

        skipped = {(item["path"], item["reason"]) for item in report["skipped"]}
        self.assertIn(("backend/betfair_cache/link.json", "symlink"), skipped)
        self.assertNotIn("backend/betfair_cache/link.json", self.candidate_paths(report))
        self.assertTrue(link.is_symlink())

    def test_arbitrary_directory_cannot_be_selected(self) -> None:
        with self.assertRaises(cleanup.UsageError):
            cleanup.parse_cli_args(
                [
                    "--cache",
                    "betfair",
                    "--max-files",
                    "0",
                    "--directory",
                    str(self.root),
                ]
            )

        with self.assertRaises(ValueError):
            cleanup.run_cleanup(
                selected_caches=["../outside"],
                policies=cleanup.RetentionPolicies(max_files=0),
                project_root=self.root,
            )


    def test_ipv4_ipv6_refused_means_not_occupied(self) -> None:
        ipv6 = 10
        with mock.patch.object(cleanup.socket, "AF_INET6", ipv6, create=True):
            with mock.patch.object(
                cleanup,
                "_probe_loopback_endpoint",
                side_effect=[False, False],
            ) as probe:
                self.assertFalse(cleanup._port_is_occupied(3000))

        self.assertEqual(
            [(call.args[0], call.args[1]) for call in probe.call_args_list],
            [(socket.AF_INET, 3000), (ipv6, 3000)],
        )

    def test_ipv6_occupied_means_occupied(self) -> None:
        ipv6 = 10
        with mock.patch.object(cleanup.socket, "AF_INET6", ipv6, create=True):
            with mock.patch.object(
                cleanup,
                "_probe_loopback_endpoint",
                side_effect=[False, True],
            ):
                self.assertTrue(cleanup._port_is_occupied(3001))

    def test_ipv6_unavailable_ipv4_refused_means_not_occupied(self) -> None:
        ipv6 = 10
        with mock.patch.object(cleanup.socket, "AF_INET6", ipv6, create=True):
            with mock.patch.object(
                cleanup,
                "_probe_loopback_endpoint",
                side_effect=[False, None],
            ):
                self.assertFalse(cleanup._port_is_occupied(3000))

    def test_unexpected_probe_error_fails_closed(self) -> None:
        with mock.patch.object(
            cleanup,
            "_probe_loopback_endpoint",
            side_effect=RuntimeError("simulated probe error"),
        ):
            with self.assertRaises(RuntimeError):
                cleanup._port_is_occupied(3000)

    def test_session_safety_reports_launcher_lock(self) -> None:
        lock = self.root / "launcher" / ".runtime" / "launcher.lock"
        lock.parent.mkdir(parents=True, exist_ok=True)
        lock.write_text("not-read", encoding="utf-8")

        self.assertEqual(
            cleanup.check_apply_session_safety(
                self.root,
                port_probe=lambda _port: False,
            ),
            ["launcher_lock_exists"],
        )

    def test_session_safety_reports_port_3000_occupied(self) -> None:
        self.assertEqual(
            cleanup.check_apply_session_safety(
                self.root,
                port_probe=lambda port: port == 3000,
            ),
            ["port_3000_occupied"],
        )

    def test_session_safety_reports_port_3001_check_failed(self) -> None:
        def probe(port: int) -> bool:
            if port == 3001:
                raise RuntimeError("simulated probe error")
            return False

        self.assertEqual(
            cleanup.check_apply_session_safety(self.root, port_probe=probe),
            ["port_3001_check_failed"],
        )


if __name__ == "__main__":
    unittest.main()
