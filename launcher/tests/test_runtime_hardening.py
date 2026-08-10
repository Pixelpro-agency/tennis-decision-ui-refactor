import asyncio
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from contextlib import redirect_stdout
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from launcher import app, services, session
from scrapers.sofa.config import log as sofa_log
from scrapers.sofa import cli as sofa_cli
from scrapers.betfair import cli as betfair_cli


class RuntimeHardeningTests(unittest.TestCase):
    def test_backend_identity_is_working_copy_aware(self):
        payload = {
            "ok": True,
            "project": "tennis-decision-ui",
            "instanceId": "backend-a",
            "repositoryIdentity": services._EXPECTED_REPOSITORY_IDENTITY,
            "storageIdentity": services._EXPECTED_STORAGE_IDENTITY,
        }
        self.assertTrue(services._is_expected_backend(payload))
        payload["storageIdentity"] = "sha256:" + ("0" * 64)
        self.assertFalse(services._is_expected_backend(payload))

    def test_browser_failure_is_non_throwing_and_observable(self):
        with patch.object(services.webbrowser, "open", side_effect=OSError("no browser")), \
             patch.object(services, "log") as logger:
            self.assertFalse(services.open_browser("http://127.0.0.1:3000"))
        self.assertTrue(any(call.args[1] == "browser_result" for call in logger.call_args_list))

    def test_launcher_lock_failure_returns_nonzero(self):
        with patch.object(app, "read_manifest", return_value=None), \
             patch.object(app, "create_launcher_session_identity", return_value={"pid": 1}), \
             patch.object(app, "acquire_or_recover_lock", return_value={"acquired": False, "state": "active", "reason": "blocked"}):
            self.assertNotEqual(app.main(), 0)

    def test_sofa_diagnostics_are_bounded_and_redacted(self):
        output = io.StringIO()
        with redirect_stderr(output):
            sofa_log(
                "Fatal token=secret https://example.test/path?token=hidden "
                + "x" * 5000
            )
        text = output.getvalue()
        self.assertNotIn("secret", text)
        self.assertNotIn("hidden", text)
        self.assertLessEqual(len(text), 2050)

    def test_manifest_failure_is_observable(self):
        with tempfile.TemporaryDirectory() as directory, \
             patch.object(session, "_RUNTIME_DIR", Path(directory)), \
             patch.object(session.tempfile, "mkstemp", side_effect=OSError("denied")):
            with self.assertRaises(OSError):
                session.write_manifest({"schemaVersion": 2})
            with patch.object(app, "write_manifest", side_effect=OSError("denied")):
                self.assertFalse(app._safe_write_manifest({"schemaVersion": 2}))

    def test_manifest_replace_failure_is_observable_and_temp_is_cleaned(self):
        with tempfile.TemporaryDirectory() as directory, \
             patch.object(session, "_RUNTIME_DIR", Path(directory)), \
             patch.object(session, "_MANIFEST_FILE", Path(directory) / "manifest.json"), \
             patch.object(Path, "replace", side_effect=OSError("replace denied")):
            with self.assertRaises(OSError):
                session.write_manifest({"schemaVersion": 2})
            self.assertEqual(list(Path(directory).glob("*.tmp")), [])

    def test_cdp_delayed_ready_is_reconciled(self):
        manifest = session._empty_manifest(12345, {
            "pid": 12345,
            "sessionId": "runtime-hardening",
            "createdAt": "2026-08-10T00:00:00Z",
            "processIdentity": {
                "startFingerprint": "test",
                "executable": "python",
            },
        })
        probes = [(False, {})] * services._MAX_PORT_ATTEMPTS + [
            (False, {}),
            (True, {}),
        ]
        with patch.object(services, "check_cdp_endpoint", side_effect=probes), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_chrome_cdp", return_value={
                 "ok": True,
                 "state": "launch_requested",
                 "port": 9222,
             }):
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, "http://127.0.0.1:9222")
        self.assertEqual(manifest["services"]["cdp"]["status"], "ready")

    def test_launcher_shutdown_budget_exceeds_backend_budget(self):
        self.assertGreater(services._SHUTDOWN_GRACE, 6)

    def test_sofa_invalid_input_uses_json_stdout_and_nonzero_exit(self):
        output = io.StringIO()
        with redirect_stdout(output), self.assertRaises(SystemExit):
            asyncio.run(sofa_cli.main([]))
        self.assertEqual(json.loads(output.getvalue()), {
            "ok": False,
            "error": {
                "code": "missing_urls",
                "message": "No SofaScore URLs provided",
            },
        })

    def test_betfair_login_only_has_no_json_result(self):
        called = []

        async def open_login_window(*args):
            called.append(args)

        fake_scrape = SimpleNamespace(
            open_login_window=open_login_window,
            scrape_betfair=lambda *args, **kwargs: None,
        )
        args = SimpleNamespace(
            url="https://www.betfair.it/exchange/plus/tennis/market/1.2",
            mode="persistent",
            profile_dir="",
            cdp_url="",
            ladder_urls="",
            no_network_capture=True,
            no_cache=True,
            login_only=True,
        )
        output = io.StringIO()
        with patch.object(betfair_cli, "parse_args", return_value=args), \
             patch.object(betfair_cli, "normalize_betfair_url", return_value=args.url), \
             patch.dict(sys.modules, {"scrapers.betfair.scrape": fake_scrape}), \
             redirect_stdout(output):
            betfair_cli.main()
        self.assertEqual(output.getvalue(), "")
        self.assertEqual(len(called), 1)


if __name__ == "__main__":
    unittest.main()
