"""
Unit tests for the Tennis Decision UI launcher.

Standard library only. Network calls use in-process HTTP servers.
Subprocess calls are mocked where needed.
"""

import json
import os
import subprocess
import sys
import tempfile
import threading
import shutil
import textwrap
import time
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from unittest.mock import MagicMock, patch, call

# ---------------------------------------------------------------------------
# Ensure the project root is on sys.path
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


# ---------------------------------------------------------------------------
# Tiny in-process HTTP server helper
# ---------------------------------------------------------------------------

class _Handler(BaseHTTPRequestHandler):
    response_body = b"{}"
    response_code = 200

    def do_GET(self):
        self.send_response(self.response_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(self.__class__.response_body)

    def log_message(self, *args):
        pass


def _make_handler(body: bytes, code: int = 200):
    class H(_Handler):
        pass
    H.response_body = body
    H.response_code = code
    return H


def _start_server(port: int, body: bytes, code: int = 200):
    server = HTTPServer(("127.0.0.1", port), _make_handler(body, code))
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    server._test_thread = t
    return server


def _stop_server(server):
    """Fully release in-process HTTP server sockets and their worker threads."""
    server.shutdown()
    server.server_close()
    thread = getattr(server, "_test_thread", None)
    if thread is not None:
        thread.join(timeout=2.0)


def _find_free_port(start=19000):
    import socket
    for p in range(start, start + 300):
        try:
            with socket.socket() as s:
                s.bind(("127.0.0.1", p))
                return p
        except OSError:
            pass
    raise RuntimeError("No free port found")


# ---------------------------------------------------------------------------
# Session patching context
# ---------------------------------------------------------------------------

class _SessionPatch:
    """Context manager: redirect session module to a temp dir."""
    def __init__(self):
        from launcher import session
        self._session = session
        self._tmpdir = None
        self._saved = {}

    def __enter__(self):
        import tempfile
        self._tmpdir = tempfile.mkdtemp()
        s = self._session
        self._saved = {
            "_RUNTIME_DIR": s._RUNTIME_DIR,
            "_LOCK_FILE": s._LOCK_FILE,
            "_MANIFEST_FILE": s._MANIFEST_FILE,
        }
        s._RUNTIME_DIR = Path(self._tmpdir)
        s._LOCK_FILE = Path(self._tmpdir) / "launcher.lock"
        s._MANIFEST_FILE = Path(self._tmpdir) / "manifest.json"
        return s

    def __exit__(self, *args):
        s = self._session
        for k, v in self._saved.items():
            setattr(s, k, v)
        import shutil
        shutil.rmtree(self._tmpdir, ignore_errors=True)


# ===========================================================================
# Original tests 1-10 (preserved and tightened)
# ===========================================================================

class TestPortFree(unittest.TestCase):

    def test_free_port_detected(self):
        from launcher.system import is_port_free
        port = _find_free_port(19100)
        self.assertTrue(is_port_free(port))

    def test_find_free_port_returns_preferred_when_free(self):
        from launcher.system import find_free_port
        port = _find_free_port(19110)
        self.assertEqual(find_free_port(port), port)


class TestBackendIdentityReuse(unittest.TestCase):

    def test_tennis_decision_identity_accepted(self):
        from launcher.system import check_backend_identity
        port = _find_free_port(19200)
        body = json.dumps({
            "ok": True, "project": "tennis-decision-ui",
            "instanceId": "abc-123", "pid": 999,
        }).encode()
        srv = _start_server(port, body)
        try:
            ok, data = check_backend_identity(f"http://127.0.0.1:{port}/api/health", timeout=3.0)
            self.assertTrue(ok)
            self.assertEqual(data.get("project"), "tennis-decision-ui")
        finally:
            _stop_server(srv)


class TestForeignListenerNoKill(unittest.TestCase):

    def test_foreign_service_not_identified_as_tennis(self):
        from launcher.system import check_backend_identity
        port = _find_free_port(19300)
        body = json.dumps({"ok": True, "service": "other"}).encode()
        srv = _start_server(port, body)
        try:
            ok, _ = check_backend_identity(f"http://127.0.0.1:{port}/api/health", timeout=3.0)
            self.assertFalse(ok)
        finally:
            _stop_server(srv)

    def test_find_free_port_skips_occupied(self):
        import socket
        from launcher.system import find_free_port
        port = _find_free_port(19400)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("127.0.0.1", port))
        s.listen(1)
        try:
            result = find_free_port(port)
            self.assertIsNotNone(result)
            self.assertGreater(result, port)
        finally:
            s.close()


class TestCDPReuse(unittest.TestCase):

    def test_cdp_valid_endpoint_accepted(self):
        from launcher.system import check_cdp_endpoint
        port = _find_free_port(19500)
        body = json.dumps({
            "Browser": "Chrome/120",
            "webSocketDebuggerUrl": f"ws://127.0.0.1:{port}/devtools/browser/abc",
        }).encode()
        srv = _start_server(port, body)
        try:
            ok, data = check_cdp_endpoint(port, timeout=3.0)
            self.assertTrue(ok)
            self.assertIn("webSocketDebuggerUrl", data)
        finally:
            _stop_server(srv)


class TestNonCDPNoKill(unittest.TestCase):

    def test_non_cdp_response_rejected(self):
        from launcher.system import check_cdp_endpoint
        port = _find_free_port(19600)
        body = json.dumps({"ok": True}).encode()
        srv = _start_server(port, body)
        try:
            ok, _ = check_cdp_endpoint(port, timeout=3.0)
            self.assertFalse(ok)
        finally:
            _stop_server(srv)


class TestManifestReuseSession(unittest.TestCase):

    def test_reusable_manifest_with_live_backend_frontend(self):
        """A manifest pointing to live backend+frontend is reusable."""
        bp = _find_free_port(19700)
        fp = _find_free_port(bp + 1)

        backend_body = json.dumps({
            "ok": True, "project": "tennis-decision-ui",
            "instanceId": "inst-1", "pid": 42,
        }).encode()
        frontend_body = b"<html></html>"

        bsrv = _start_server(bp, backend_body)

        class FrontendHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(frontend_body)
            def log_message(self, *args): pass

        fsrv = HTTPServer(("127.0.0.1", fp), FrontendHandler)
        ft = threading.Thread(target=fsrv.serve_forever, daemon=True)
        ft.start()
        fsrv._test_thread = ft

        try:
            with _SessionPatch() as session:
                manifest = session._empty_manifest(os.getpid())
                manifest["backendBaseUrl"] = f"http://127.0.0.1:{bp}"
                manifest["backendHealthUrl"] = f"http://127.0.0.1:{bp}/api/health"
                manifest["backendInstanceId"] = "inst-1"
                manifest["frontendUrl"] = f"http://127.0.0.1:{fp}"
                session.write_manifest(manifest)

                loaded = session.read_manifest()
                self.assertTrue(session.is_manifest_reusable(loaded))
        finally:
            _stop_server(bsrv)
            _stop_server(fsrv)


class TestStaleManifestRecovery(unittest.TestCase):

    def test_stale_manifest_with_dead_backend_not_reusable(self):
        port = _find_free_port(19800)  # nothing listening here
        with _SessionPatch() as session:
            manifest = session._empty_manifest(999999999)
            manifest["backendHealthUrl"] = f"http://127.0.0.1:{port}/api/health"
            manifest["frontendUrl"] = f"http://127.0.0.1:{port + 1}"
            manifest["backendInstanceId"] = "x"
            session.write_manifest(manifest)
            loaded = session.read_manifest()
            self.assertFalse(session.is_manifest_reusable(loaded))

    def test_stale_lock_reclaimed(self):
        with _SessionPatch() as session:
            session._LOCK_FILE.write_text("999999999")
            self.assertTrue(session.reclaim_stale_lock())
            self.assertFalse(session._LOCK_FILE.exists())


class TestShutdownOwnsOnly(unittest.TestCase):

    def test_only_owned_proc_terminated(self):
        from launcher import services

        terminated = []

        class FakeProc:
            def __init__(self, pid):
                self.pid = pid
            def poll(self): return None
            def terminate(self): terminated.append(self.pid)
            def send_signal(self, sig): terminated.append(self.pid)
            def wait(self, timeout=None): return 0
            def kill(self): pass

        owned = FakeProc(1001)
        not_owned = FakeProc(1002)

        orig = list(services._owned_entries)
        services._owned_entries.clear()
        services._owned_entries.append({"role": "backend", "proc": owned, "pid": 1001, "started_at": time.time()})

        try:
            services.shutdown_owned()
            self.assertIn(1001, terminated)
            self.assertNotIn(1002, terminated)
        finally:
            services._owned_entries.clear()
            services._owned_entries.extend(orig)


class TestViteConfigDynamic(unittest.TestCase):

    def test_vite_config_env_vars(self):
        vite_config = _PROJECT_ROOT / "frontend" / "vite.config.js"
        self.assertTrue(vite_config.exists())
        content = vite_config.read_text(encoding="utf-8")
        self.assertIn("VITE_BACKEND_TARGET", content)
        self.assertIn("VITE_FRONTEND_PORT", content)
        self.assertNotIn("'http://localhost:3001'", content)


class TestNoKillByPort(unittest.TestCase):

    def _src(self, *parts):
        return (_PROJECT_ROOT / Path(*parts)).read_text(encoding="utf-8")

    def test_system_py_clean(self):
        src = self._src("launcher", "system.py")
        self.assertNotIn("taskkill", src.lower())
        self.assertNotIn("Stop-Process", src)
        self.assertNotIn("kill_listening_port", src)

    def test_services_py_no_port_kill(self):
        src = self._src("launcher", "services.py")
        self.assertNotIn("Stop-Process", src)
        # taskkill IS present — only in _force_kill_tree which targets a
        # known owned PID, not a port. Verify it is never called with a port.
        self.assertNotIn("netstat", src.lower())

    def test_app_py_clean(self):
        src = self._src("launcher", "app.py")
        self.assertNotIn("taskkill", src.lower())
        self.assertNotIn("Stop-Process", src)

    def test_backend_ps1_clean(self):
        src = self._src("scripts", "start-backend-dev.ps1")
        self.assertNotIn("Stop-Process", src)
        self.assertNotIn("taskkill", src.lower())
        self.assertNotIn("netstat", src.lower())

    def test_cdp_ps1_clean(self):
        src = self._src("scripts", "start-cdp-dev.ps1")
        self.assertNotIn("Stop-Process", src)
        self.assertNotIn("taskkill", src.lower())
        self.assertNotIn("netstat", src.lower())


# ===========================================================================
# New tests F1-F10
# ===========================================================================

class TestBackendHealthNoProjectMarker(unittest.TestCase):
    """F1: backend health {ok:true} without project marker → rejected, proc cleaned up."""

    def test_health_without_project_rejected(self):
        """
        Simulate wait_for_service returning (False, ...) — which is what happens
        when the validator (requiring project=='tennis-decision-ui') rejects the
        response. Verify the proc is terminated and removed from owned.
        """
        from launcher import services

        terminated_pids = []

        class FakeProc:
            pid = 12399
            def poll(self): return None
            def terminate(self): terminated_pids.append(self.pid)
            def wait(self, timeout=None): return 0
            def kill(self): pass

        orig = list(services._owned_entries)
        services._owned_entries.clear()
        fake_proc = FakeProc()

        def fake_start(p):
            services._owned_entries.append({
                "role": "backend", "proc": fake_proc, "pid": fake_proc.pid, "started_at": time.time()
            })
            return fake_proc

        call_count = [0]
        def fake_is_free(p):
            # First call: port is free (we start backend). Subsequent calls: occupied.
            if call_count[0] == 0:
                call_count[0] += 1
                return True
            return False

        # wait_for_service returns failure — simulates validator rejecting {ok:true, no project}
        with patch.object(services, "_start_node_backend", side_effect=fake_start), \
             patch.object(services, "is_port_free", side_effect=fake_is_free), \
             patch.object(services, "find_free_port", return_value=None), \
             patch("launcher.services.wait_for_service",
                   return_value=(False, "validator failed: no project marker")):
            manifest = {"ownedPids": [], "ownership": {}}
            ok, _ = services.resolve_backend(manifest)

        self.assertFalse(ok)
        self.assertIn(12399, terminated_pids, "Proc must be terminated on validator failure")
        self.assertFalse(any(e["pid"] == 12399 for e in services._owned_entries),
                         "Failed proc must be removed from owned")

        services._owned_entries.clear()
        services._owned_entries.extend(orig)


class TestBackendHealthWrongPid(unittest.TestCase):
    """F2: health marker correct but pid != proc.pid → rejected."""

    def test_wrong_pid_rejected(self):
        from launcher import services

        terminated_pids = []

        class FakeProc:
            pid = 11111
            def poll(self): return None
            def terminate(self): terminated_pids.append(self.pid)
            def wait(self, timeout=None): return 0
            def kill(self): pass

        orig = list(services._owned_entries)
        services._owned_entries.clear()
        fake_proc = FakeProc()

        with patch.object(services, "_start_node_backend", return_value=fake_proc), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "find_free_port", return_value=None):
            services._owned_entries.append({
                "role": "backend", "proc": fake_proc, "pid": 11111, "started_at": time.time()
            })
            # pid in response is different from proc.pid
            with patch("launcher.services.wait_for_service",
                       return_value=(True, {
                           "ok": True, "project": "tennis-decision-ui",
                           "instanceId": "abc", "pid": 99999,  # mismatch
                       })):
                manifest = {"ownedPids": [], "ownership": {}}
                ok, _ = services.resolve_backend(manifest)

        self.assertFalse(ok)
        self.assertIn(11111, terminated_pids)

        services._owned_entries.clear()
        services._owned_entries.extend(orig)


class TestBackendFailedFirstAttemptRetries(unittest.TestCase):
    """F3: backend fails first attempt → cleanup owned, second attempt succeeds."""

    def test_retry_after_first_failure(self):
        from launcher import services

        terminated = []
        call_count = [0]

        class FakeProc:
            def __init__(self, n):
                self.pid = 20000 + n
            def poll(self): return None
            def terminate(self): terminated.append(self.pid)
            def wait(self, timeout=None): return 0
            def kill(self): pass

        procs = [FakeProc(0), FakeProc(1)]

        def fake_start(port):
            n = call_count[0]
            call_count[0] += 1
            services._owned_entries.append({
                "role": "backend", "proc": procs[n], "pid": procs[n].pid, "started_at": time.time()
            })
            return procs[n]

        def fake_wait(url, prefix, timeout, validator=None):
            if "3001" in url:
                return False, "timeout"
            # Second port succeeds
            return True, {
                "ok": True, "project": "tennis-decision-ui",
                "instanceId": "inst-ok", "pid": procs[1].pid,
            }

        orig = list(services._owned_entries)
        services._owned_entries.clear()

        with patch.object(services, "_start_node_backend", side_effect=fake_start), \
             patch.object(services, "is_port_free", return_value=True), \
             patch("launcher.services.wait_for_service", side_effect=fake_wait):
            manifest = {"ownedPids": [], "ownership": {}}
            ok, url = services.resolve_backend(manifest)

        self.assertTrue(ok)
        # First proc must have been terminated (failed)
        self.assertIn(20000, terminated)
        # Second proc must NOT be terminated
        self.assertNotIn(20001, terminated)
        # Only second proc should remain in owned entries
        self.assertEqual(len(services._owned_entries), 1)
        self.assertEqual(services._owned_entries[0]["pid"], 20001)

        services._owned_entries.clear()
        services._owned_entries.extend(orig)


class TestManifestLauncherAliveBackendDown(unittest.TestCase):
    """F4: manifest with live launcher PID but backend unreachable → not reusable."""

    def test_manifest_backend_down_not_reusable(self):
        port = _find_free_port(20200)  # nothing listening
        with _SessionPatch() as session:
            manifest = session._empty_manifest(os.getpid())
            manifest["backendHealthUrl"] = f"http://127.0.0.1:{port}/api/health"
            manifest["backendBaseUrl"] = f"http://127.0.0.1:{port}"
            manifest["frontendUrl"] = f"http://127.0.0.1:{port + 1}"
            manifest["backendInstanceId"] = "x"
            session.write_manifest(manifest)
            loaded = session.read_manifest()
            self.assertFalse(session.is_manifest_reusable(loaded))


class TestManifestInstanceIdMismatch(unittest.TestCase):
    """F5: manifest instance ID differs from backend → not reusable."""

    def test_instance_id_mismatch_not_reusable(self):
        bp = _find_free_port(20300)
        body = json.dumps({
            "ok": True, "project": "tennis-decision-ui",
            "instanceId": "real-id", "pid": 42,
        }).encode()
        srv = _start_server(bp, body)
        try:
            with _SessionPatch() as session:
                manifest = session._empty_manifest(os.getpid())
                manifest["backendHealthUrl"] = f"http://127.0.0.1:{bp}/api/health"
                manifest["backendBaseUrl"] = f"http://127.0.0.1:{bp}"
                manifest["backendInstanceId"] = "wrong-id"  # mismatch
                manifest["frontendUrl"] = f"http://127.0.0.1:{bp + 1}"
                session.write_manifest(manifest)
                loaded = session.read_manifest()
                self.assertFalse(session.is_manifest_reusable(loaded))
        finally:
            _stop_server(srv)


class TestManifestDeadLauncherValidServices(unittest.TestCase):
    """F6: dead launcher PID but backend + frontend alive → reusable (no ownership)."""

    def test_dead_launcher_live_services_reusable(self):
        bp = _find_free_port(20400)
        fp = _find_free_port(bp + 1)

        body = json.dumps({
            "ok": True, "project": "tennis-decision-ui",
            "instanceId": "inst-ok", "pid": 42,
        }).encode()
        bsrv = _start_server(bp, body)

        class FHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"ok")
            def log_message(self, *args): pass

        fsrv = HTTPServer(("127.0.0.1", fp), FHandler)
        ft = threading.Thread(target=fsrv.serve_forever, daemon=True)
        ft.start()
        fsrv._test_thread = ft

        try:
            with _SessionPatch() as session:
                manifest = session._empty_manifest(999999999)  # dead launcher PID
                manifest["backendHealthUrl"] = f"http://127.0.0.1:{bp}/api/health"
                manifest["backendBaseUrl"] = f"http://127.0.0.1:{bp}"
                manifest["backendInstanceId"] = "inst-ok"
                manifest["frontendUrl"] = f"http://127.0.0.1:{fp}"
                session.write_manifest(manifest)
                loaded = session.read_manifest()
                # is_manifest_reusable must not care about launcher PID
                self.assertTrue(session.is_manifest_reusable(loaded))
        finally:
            _stop_server(bsrv)
            _stop_server(fsrv)


class TestCDPUnavailableDoesNotBlock(unittest.TestCase):
    """F7: CDP unavailable → backend/frontend not delayed 15s, VITE_CDP_URL not set to 9222."""

    def test_cdp_unavailable_returns_empty_quickly(self):
        from launcher import services

        # Patch check_cdp_endpoint and is_port_free and find_free_port and _start_chrome_cdp
        with patch("launcher.services.check_cdp_endpoint", return_value=(False, {})), \
             patch("launcher.services.is_port_free", return_value=False), \
             patch("launcher.services.find_free_port", return_value=None):
            manifest = {}
            start = time.time()
            url = services.resolve_cdp(manifest)
            elapsed = time.time() - start

        # Must return empty string (not a false 9222 URL)
        self.assertEqual(url, "")
        # Must return quickly (well under 15 seconds)
        self.assertLess(elapsed, 5.0, f"CDP resolution took {elapsed:.1f}s — too slow")

    def test_cdp_url_empty_not_9222_when_unavailable(self):
        from launcher import services
        with patch("launcher.services.check_cdp_endpoint", return_value=(False, {})), \
             patch("launcher.services.is_port_free", return_value=False), \
             patch("launcher.services.find_free_port", return_value=None):
            manifest = {}
            url = services.resolve_cdp(manifest)
        # Must be empty, not a hardcoded fallback
        self.assertNotEqual(url, "http://127.0.0.1:9222")


class TestViteDirectLaunch(unittest.TestCase):
    """Vite must run through its local Node entry point, not a shell wrapper."""

    def setUp(self):
        from launcher import services
        self.services = services
        self.original_owned = list(services._owned_entries)
        services._owned_entries.clear()

    def tearDown(self):
        self.services._owned_entries.clear()
        self.services._owned_entries.extend(self.original_owned)

    def test_start_vite_uses_node_local_cli_and_ipv4_host(self):
        services = self.services

        class FakeProc:
            pid = 58001
            stdout = None

        fake_proc = FakeProc()
        with patch.object(services, "_vite_cli_path", return_value="/repo/frontend/node_modules/vite/bin/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=True), \
             patch.object(services.subprocess, "Popen", return_value=fake_proc) as popen, \
             patch.object(services, "start_reader_thread"):
            proc = services._start_vite_frontend(5173, 3001, "")

        self.assertIs(proc, fake_proc)
        command = popen.call_args.args[0]
        kwargs = popen.call_args.kwargs
        normalized_cli = command[1].replace("\\", "/")
        self.assertEqual(command[0], "node")
        self.assertTrue(normalized_cli.endswith("node_modules/vite/bin/vite.js"))
        self.assertEqual(
            command[2:],
            ["--host", "127.0.0.1", "--port", "5173", "--strictPort"],
        )
        self.assertIs(kwargs["shell"], False)
        self.assertIs(kwargs["stdin"], subprocess.DEVNULL)
        self.assertEqual(kwargs["env"]["VITE_BACKEND_TARGET"], "http://127.0.0.1:3001")
        self.assertEqual(kwargs["env"]["VITE_FRONTEND_PORT"], "5173")

    def test_start_vite_command_contains_no_wrapper_or_batch_executable(self):
        services = self.services

        class FakeProc:
            pid = 58002
            stdout = None

        with patch.object(services, "_vite_cli_path", return_value="/repo/frontend/node_modules/vite/bin/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=True), \
             patch.object(services.subprocess, "Popen", return_value=FakeProc()) as popen, \
             patch.object(services, "start_reader_thread"):
            services._start_vite_frontend(5174, 3001, "")

        command_text = " ".join(popen.call_args.args[0]).lower()
        self.assertNotIn("npm", command_text)
        self.assertNotIn(".cmd", command_text)
        self.assertNotIn(".bat", command_text)

    def test_missing_vite_cli_fails_once_without_spawning_or_retrying(self):
        services = self.services
        logs = []
        manifest = {"ownedPids": [], "ownership": {}}

        with patch.object(services, "_vite_cli_path", return_value="/missing/node_modules/vite/bin/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=False), \
             patch.object(services, "is_port_free") as is_free, \
             patch.object(services, "_start_vite_frontend") as start_vite, \
             patch.object(services.subprocess, "Popen") as popen, \
             patch.object(services, "log", side_effect=lambda prefix, message: logs.append(message)):
            ok, url = services.resolve_frontend(manifest, 3001, "")

        self.assertFalse(ok)
        self.assertEqual(url, "")
        self.assertIn("frontend action=failed reason=vite-cli-missing", logs)
        is_free.assert_not_called()
        start_vite.assert_not_called()
        popen.assert_not_called()
        self.assertFalse(services._owned_entries)

    def test_resolve_frontend_uses_ipv4_url_for_readiness_and_manifest(self):
        services = self.services
        started = []
        manifest = {"ownedPids": [], "ownership": {}}

        class FakeProc:
            pid = 58003
            def poll(self): return None
            def wait(self, timeout=None): return 0
            def terminate(self): raise AssertionError("ready Vite must not be cleaned up")

        proc = FakeProc()

        def fake_start(port, backend_port, cdp_url):
            started.append(port)
            services._register_owned_proc(proc, "frontend")
            return proc

        with patch.object(services, "_vite_cli_path", return_value="/repo/frontend/node_modules/vite/bin/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=True), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_vite_frontend", side_effect=fake_start), \
             patch.object(services, "wait_for_service", return_value=(True, {})) as wait:
            ok, url = services.resolve_frontend(manifest, 3001, "")

        expected_url = f"http://127.0.0.1:{started[0]}"
        self.assertTrue(ok)
        self.assertEqual(url, expected_url)
        self.assertEqual(manifest["frontendUrl"], expected_url)
        wait.assert_called_once_with(
            expected_url,
            "Launcher",
            timeout=services._MAX_FRONTEND_WAIT,
        )
        self.assertEqual(len(services._owned_entries), 1)
        self.assertIs(services._owned_entries[0]["proc"], proc)


class TestShutdownGracefulThenTreeKill(unittest.TestCase):
    """F9: shutdown sends clean signal first, tree-kill only on timeout."""

    def test_graceful_signal_sent_before_kill(self):
        from launcher import services
        import sys

        signal_sent = []
        killed = []

        class FakeProc:
            pid = 55555
            def poll(self): return None
            def send_signal(self, sig): signal_sent.append(sig)
            def terminate(self): signal_sent.append("SIGTERM")
            def wait(self, timeout=None):
                raise subprocess.TimeoutExpired(cmd="x", timeout=timeout)
            def kill(self): killed.append(self.pid)

        orig = list(services._owned_entries)
        services._owned_entries.clear()
        fp = FakeProc()
        services._owned_entries.append({"role": "backend", "proc": fp, "pid": 55555, "started_at": time.time()})

        # Mock _force_kill_tree to verify it's called with the owned PID
        force_killed = []
        with patch.object(services, "_force_kill_tree", side_effect=lambda pid: force_killed.append(pid)):
            services.shutdown_owned()

        # A signal must have been sent (either CTRL_BREAK_EVENT or SIGTERM)
        self.assertTrue(len(signal_sent) > 0, "No clean signal sent before kill")
        # Force kill must have been called on the owned PID
        self.assertIn(55555, force_killed)

        services._owned_entries.clear()
        services._owned_entries.extend(orig)


class TestShutdownNoReuseNoCDP(unittest.TestCase):
    """F10: reused processes and CDP are never in shutdown list."""

    def test_reused_proc_not_in_shutdown(self):
        from launcher import services

        terminated = []

        class FakeOwned:
            pid = 77001
            def poll(self): return None
            def send_signal(self, s): terminated.append(self.pid)
            def terminate(self): terminated.append(self.pid)
            def wait(self, timeout=None): return 0
            def kill(self): pass

        class FakeReused:
            pid = 77002

        orig = list(services._owned_entries)
        services._owned_entries.clear()
        owned = FakeOwned()
        services._owned_entries.append({"role": "backend", "proc": owned, "pid": 77001, "started_at": time.time()})
        # FakeReused is NOT in _owned_entries

        services.shutdown_owned()

        self.assertIn(77001, terminated)
        self.assertNotIn(77002, terminated)

        services._owned_entries.clear()
        services._owned_entries.extend(orig)


# ===========================================================================
# Task A final regression coverage
# ===========================================================================


def _write_node_file(root: Path, relative: str, content: str):
    target = root / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def _run_node_module_test(files: dict[str, str], script: str):
    """Run a small ESM fixture without requiring the full frontend checkout."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write_node_file(root, "package.json", '{"type":"module"}\n')
        for relative, content in files.items():
            _write_node_file(root, relative, content)
        _write_node_file(root, "test.mjs", script)
        result = subprocess.run(
            ["node", "test.mjs"],
            cwd=root,
            text=True,
            capture_output=True,
            timeout=15,
        )
        if result.returncode:
            raise AssertionError(
                "Node fixture failed:\n"
                f"stdout:\n{result.stdout}\n"
                f"stderr:\n{result.stderr}"
            )


class TestTaskAFinalFixes(unittest.TestCase):

    def setUp(self):
        from launcher import services
        self.services = services
        self.original_owned = list(services._owned_entries)
        services._owned_entries.clear()

    def tearDown(self):
        self.services._owned_entries.clear()
        self.services._owned_entries.extend(self.original_owned)

    def test_alternative_cdp_candidate_is_returned_without_waiting_for_ready(self):
        """A1: an alternate CDP candidate survives launch even while Chrome starts."""
        services = self.services
        alternative = services.PREFERRED_CDP_PORT + 7
        manifest = {}

        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "find_free_port", return_value=alternative), \
             patch.object(services, "_start_chrome_cdp", return_value=True) as launch:
            started = time.monotonic()
            url = services.resolve_cdp(manifest)
            elapsed = time.monotonic() - started

        self.assertEqual(url, f"http://127.0.0.1:{alternative}")
        self.assertEqual(manifest["cdpUrl"], url)
        self.assertEqual(manifest["cdpStatus"], "starting")
        launch.assert_called_once_with(alternative)
        self.assertLess(elapsed, 1.0, "CDP startup must not block backend/frontend")

    def test_cdp_without_any_free_port_is_unavailable(self):
        """A2: no reusable CDP and no free candidate produces an explicit unavailable manifest."""
        services = self.services
        manifest = {}
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "find_free_port", return_value=None):
            self.assertEqual(services.resolve_cdp(manifest), "")
        self.assertEqual(manifest["cdpUrl"], "")
        self.assertEqual(manifest["cdpStatus"], "unavailable")

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for JavaScript regression fixtures")
    def test_preflight_empty_cdp_skips_api_and_returns_null(self):
        """B1: cdpUrl === '' must not issue a test API request or fall back to 9222."""
        hook = (_PROJECT_ROOT / "frontend/src/hooks/usePreflightChecks.js").read_text(encoding="utf-8")
        _run_node_module_test({
            "frontend/src/hooks/usePreflightChecks.js": hook,
            "frontend/src/utils/preflight.js": """
                export const stats = { calls: 0 };
                export function parseGraphUrls() { return []; }
                export async function safeFetchJson() {
                  stats.calls += 1;
                  return { data: { ok: true } };
                }
            """,
        }, """
            import assert from 'node:assert/strict';
            import { usePreflightChecks } from './frontend/src/hooks/usePreflightChecks.js';
            import { stats } from './frontend/src/utils/preflight.js';

            let checks = {};
            const hook = usePreflightChecks({
              apiBase: 'http://api', cdpUrl: '', matchUrl: '', betfairUrl: '',
              betfairGraphUrls: '', betfairMode: 'cdp',
              setChecks: (updater) => { checks = updater(checks); }
            });
            const result = await hook.testCdp();
            assert.equal(result, null);
            assert.equal(stats.calls, 0);
            assert.deepEqual(checks.cdp, {
              status: 'error',
              message: 'CDP non disponibile: usa modalità Persistent oppure attendi l’avvio di Chrome.'
            });
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for JavaScript regression fixtures")
    def test_cdp_login_and_track_fail_before_fetch_when_url_empty(self):
        """B2: client CDP requests reject clearly instead of silently using port 9222."""
        live_api = (_PROJECT_ROOT / "frontend/src/services/liveSessionApi.js").read_text(encoding="utf-8")
        _run_node_module_test({
            "frontend/src/services/liveSessionApi.js": live_api,
        }, """
            import assert from 'node:assert/strict';
            import { openBetfairLoginWindow, startMatchTracking } from './frontend/src/services/liveSessionApi.js';

            let calls = 0;
            globalThis.fetch = async () => { calls += 1; throw new Error('fetch should not run'); };
            const expected = 'CDP non disponibile. Seleziona Profilo Persistent o attendi Chrome.';

            await assert.rejects(
              openBetfairLoginWindow({ url: 'https://example.test', mode: 'cdp', cdpUrl: '' }),
              (error) => error.message === expected
            );
            await assert.rejects(
              startMatchTracking({ sofaUrl: 'https://example.test', betfairUrl: '', betfairGraphUrls: '', betfairMode: 'cdp', chromeProfilePath: '', cdpUrl: '' }),
              (error) => error.message === expected
            );
            assert.equal(calls, 0);
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for JavaScript regression fixtures")
    def test_track_route_rejects_missing_cdp_url(self):
        """B3: the backend route returns HTTP 400 and never invokes the tracker."""
        tracking = (_PROJECT_ROOT / "backend/src/routes/match/trackingResponses.js").read_text(encoding="utf-8")
        _run_node_module_test({
            "backend/src/routes/match/trackingResponses.js": tracking,
            "backend/src/sofa/extractEventId.js": "export function extractEventId() { return 'default'; }\n",
            "backend/src/sofa/matchTracker.js": "export function trackMatch() {} export function untrackMatch() {} export function stopAllMatchTrackers() {}\n",
            "backend/src/sofa/betfairFetch.js": "export function terminateActiveBetfairScrapers() {}\n",
        }, """
            import assert from 'node:assert/strict';
            import { buildTrackMatchResponse } from './backend/src/routes/match/trackingResponses.js';

            let tracked = 0;
            const result = buildTrackMatchResponse(
              { sofaUrl: 'https://example.test/match', betfairMode: 'cdp', cdpUrl: '' },
              { extractEventId: () => '123', trackMatch: () => { tracked += 1; } }
            );
            assert.equal(result.httpStatus, 400);
            assert.equal(result.body.error, 'CDP non disponibile. Seleziona Profilo Persistent o attendi Chrome.');
            assert.equal(tracked, 0);
        """)

    def test_failed_owned_backend_uses_clean_signal_then_tree_kill_and_removes_ownership(self):
        """C: startup-failure cleanup must reuse the owned shutdown path."""
        services = self.services
        order = []

        class FakeProc:
            pid = 61001
            def poll(self): return None
            def wait(self, timeout=None):
                raise subprocess.TimeoutExpired(cmd="backend", timeout=timeout)
            def terminate(self): order.append("terminate")

        proc = FakeProc()
        services._owned_entries.append({
            "role": "backend", "proc": proc, "pid": proc.pid, "started_at": time.time()
        })
        with patch.object(services, "_send_clean_signal", side_effect=lambda entry: order.append("signal")), \
             patch.object(services, "_force_kill_tree", side_effect=lambda pid: order.append(f"kill:{pid}")):
            services._terminate_and_remove(proc)

        self.assertEqual(order, ["signal", f"kill:{proc.pid}"])
        self.assertFalse(services._owned_entries)

    @unittest.skipIf(sys.platform == "win32", "POSIX process-session behaviour")
    def test_posix_owned_processes_request_dedicated_session(self):
        """C: POSIX-owned children must be in a separate session/process group."""
        kwargs = self.services._popen_kwargs_for_owned()
        self.assertTrue(kwargs.get("start_new_session"))

    def test_failed_vite_retry_uses_a_new_port(self):
        """D: retries never reuse a Vite port that has already been attempted."""
        services = self.services
        started_ports = []
        terminated = []

        class FakeProc:
            def __init__(self, pid): self.pid = pid
            def poll(self): return None
            def wait(self, timeout=None): return 0
            def terminate(self): terminated.append(self.pid)

        procs = [FakeProc(62001), FakeProc(62002)]

        def fake_start(port, backend_port, cdp_url):
            started_ports.append(port)
            proc = procs[len(started_ports) - 1]
            services._register_owned_proc(proc, "frontend")
            return proc

        manifest = {"ownedPids": [], "ownership": {}}
        with patch.object(services, "_vite_cli_path", return_value="/repo/frontend/node_modules/vite/bin/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=True), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_vite_frontend", side_effect=fake_start), \
             patch.object(services, "wait_for_service", side_effect=[(False, "timeout"), (True, {})]):
            ok, url = services.resolve_frontend(manifest, services.PREFERRED_BACKEND_PORT, "")

        self.assertTrue(ok)
        self.assertEqual(len(started_ports), 2)
        self.assertNotEqual(started_ports[0], started_ports[1])
        self.assertIn(62001, terminated)
        self.assertEqual(url, f"http://127.0.0.1:{started_ports[1]}")

    def test_manifest_without_instance_id_is_not_reusable(self):
        """E: an otherwise healthy manifest cannot omit backendInstanceId."""
        from launcher import session
        manifest = session._empty_manifest(os.getpid())
        manifest.update({
            "backendBaseUrl": "http://127.0.0.1:3010",
            "backendHealthUrl": "http://127.0.0.1:3010/api/health",
            "frontendUrl": "http://127.0.0.1:5173",
            "backendInstanceId": "",
        })
        with patch.object(session, "check_backend_identity") as identity:
            self.assertFalse(session.is_manifest_reusable(manifest))
        identity.assert_not_called()

    def test_manifest_with_incoherent_base_and_health_urls_is_not_reusable(self):
        """E: backend base and health endpoints must identify the same service."""
        from launcher import session
        manifest = session._empty_manifest(os.getpid())
        manifest.update({
            "backendBaseUrl": "http://127.0.0.1:3010",
            "backendHealthUrl": "http://127.0.0.1:3011/api/health",
            "frontendUrl": "http://127.0.0.1:5173",
            "backendInstanceId": "instance-a",
        })
        with patch.object(session, "check_backend_identity") as identity:
            self.assertFalse(session.is_manifest_reusable(manifest))
        identity.assert_not_called()


if __name__ == "__main__":
    unittest.main()
