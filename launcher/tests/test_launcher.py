"""
Unit tests for the Tennis Decision UI launcher.

Standard library only. Network calls use in-process HTTP servers.
Subprocess calls are mocked where needed.
"""

import ast
import copy
from contextlib import ExitStack
import json
import os
import re
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


def _frontend_identity(
    frontend_port,
    backend_port,
    *,
    instance_id="frontend-instance",
    pid=54321,
    started_at="2026-01-01T00:00:00Z",
):
    return {
        "ok": True,
        "project": "tennis-decision-ui",
        "service": "frontend",
        "instanceId": instance_id,
        "pid": pid,
        "startedAt": started_at,
        "frontendPort": frontend_port,
        "backendTarget": f"http://127.0.0.1:{backend_port}",
    }


def _start_frontend_identity_server(
    frontend_port,
    backend_port,
    *,
    instance_id="frontend-instance",
    pid=54321,
    started_at="2026-01-01T00:00:00Z",
):
    identity = _frontend_identity(
        frontend_port,
        backend_port,
        instance_id=instance_id,
        pid=pid,
        started_at=started_at,
    )

    class FrontendIdentityHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path.split("?", 1)[0] == "/__launcher/health":
                body = json.dumps(identity).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)
                return
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"<html></html>")

        def log_message(self, *args):
            pass

    server = HTTPServer(("127.0.0.1", frontend_port), FrontendIdentityHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    server._test_thread = thread
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
            "_COORDINATION_FILE": s._COORDINATION_FILE,
            "_MANIFEST_FILE": s._MANIFEST_FILE,
        }
        s._RUNTIME_DIR = Path(self._tmpdir)
        s._LOCK_FILE = Path(self._tmpdir) / "launcher.lock"
        s._COORDINATION_FILE = Path(self._tmpdir) / "launcher.lock.guard"
        s._MANIFEST_FILE = Path(self._tmpdir) / "manifest.json"
        return s

    def __exit__(self, *args):
        s = self._session
        for k, v in self._saved.items():
            setattr(s, k, v)
        import shutil
        shutil.rmtree(self._tmpdir, ignore_errors=True)


def _launcher_identity_for_manifest(
    session_id="manifest-test",
    pid=None,
    fingerprint="manifest-fingerprint",
):
    return {
        "sessionId": session_id,
        "pid": pid or os.getpid(),
        "createdAt": "2026-01-01T00:00:00Z",
        "processIdentity": {
            "startFingerprint": fingerprint,
            "executable": sys.executable,
        },
    }


def _new_runtime_manifest(session_id="manifest-test", pid=None):
    from launcher import session
    identity = _launcher_identity_for_manifest(session_id, pid=pid)
    return session._empty_manifest(identity["pid"], identity)


def _ready_runtime_manifest(
    backend_port,
    frontend_port,
    *,
    backend_pid=42,
    backend_instance="inst-1",
    frontend_pid=54321,
    frontend_instance="frontend-instance",
    frontend_started_at="2026-01-01T00:00:00Z",
    frontend_ownership="owned",
    launcher_pid=None,
    session_id="ready-manifest",
):
    from launcher import session
    identity = _launcher_identity_for_manifest(
        session_id,
        pid=launcher_pid or os.getpid(),
    )
    manifest = session._empty_manifest(identity["pid"], identity)
    session.manifest_set_backend(
        manifest,
        status="ready",
        ownership="reused",
        selected_port=backend_port,
        pid=backend_pid,
        base_url=f"http://127.0.0.1:{backend_port}",
        health_url=f"http://127.0.0.1:{backend_port}/api/health",
        instance_id=backend_instance,
        started_at=None,
        source="existing_health",
        reason="reused_preferred_port",
    )
    session.manifest_set_frontend(
        manifest,
        status="ready",
        ownership=frontend_ownership,
        selected_port=frontend_port,
        pid=frontend_pid,
        url=f"http://127.0.0.1:{frontend_port}",
        instance_id=frontend_instance,
        started_at=frontend_started_at,
        backend_target=f"http://127.0.0.1:{backend_port}",
        source=("launcher" if frontend_ownership == "owned" else "existing_identity"),
        reason=(
            "started_preferred_port"
            if frontend_ownership == "owned"
            else "reused_preferred_port"
        ),
    )
    session.manifest_set_session_status(manifest, "ready", "services_ready")
    return manifest


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
        bsrv = _start_server(bp, backend_body)
        fsrv = _start_frontend_identity_server(fp, bp)

        try:
            with _SessionPatch() as session:
                manifest = _ready_runtime_manifest(
                    bp,
                    fp,
                    backend_pid=42,
                    backend_instance="inst-1",
                )
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
            manifest = _ready_runtime_manifest(
                port,
                port + 1,
                backend_pid=999999999,
                backend_instance="x",
                launcher_pid=999999999,
            )
            session.write_manifest(manifest)
            loaded = session.read_manifest()
            self.assertFalse(session.is_manifest_reusable(loaded))

    def test_stale_lock_reclaimed(self):
        with _SessionPatch() as session:
            session._LOCK_FILE.write_text("999999999", encoding="utf-8")
            identity = {
                "sessionId": "legacy-recovery",
                "pid": os.getpid(),
                "createdAt": "2026-01-01T00:00:00Z",
                "processIdentity": {
                    "startFingerprint": "test-fingerprint",
                    "executable": "python",
                },
            }
            result = session.acquire_or_recover_lock(
                identity,
                process_probe=lambda pid: {
                    "state": "dead", "reason": "pid_not_found", "identity": None,
                },
            )
            self.assertTrue(result["acquired"])
            self.assertEqual(result["state"], "reclaimed")
            self.assertEqual(
                json.loads(session._LOCK_FILE.read_text(encoding="utf-8"))["schema"],
                2,
            )


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
            # Task 2 attempt 2: Windows FakeProc supports send_signal.
            def send_signal(self, sig): terminated_pids.append(self.pid)
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
            manifest = _new_runtime_manifest()
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
            def send_signal(self, sig): terminated_pids.append(self.pid)
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
                manifest = _new_runtime_manifest()
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
            def send_signal(self, sig): terminated.append(self.pid)
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
            manifest = _new_runtime_manifest()
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
            manifest = _ready_runtime_manifest(
                port,
                port + 1,
                backend_pid=42,
                backend_instance="x",
            )
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
                manifest = _ready_runtime_manifest(
                    bp,
                    bp + 1,
                    backend_pid=42,
                    backend_instance="wrong-id",
                )
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

        fsrv = _start_frontend_identity_server(fp, bp)

        try:
            with _SessionPatch() as session:
                manifest = _ready_runtime_manifest(
                    bp,
                    fp,
                    backend_pid=42,
                    backend_instance="inst-ok",
                    launcher_pid=999999999,
                )
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

        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})) as probe, \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "_start_chrome_cdp") as helper:
            manifest = _new_runtime_manifest()
            url = services.resolve_cdp(manifest)

        self.assertEqual(url, "")
        self.assertEqual(probe.call_count, services._MAX_PORT_ATTEMPTS)
        helper.assert_not_called()

    def test_cdp_url_empty_not_9222_when_unavailable(self):
        from launcher import services

        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=False):
            manifest = _new_runtime_manifest()
            url = services.resolve_cdp(manifest)

        self.assertEqual(url, "")
        self.assertEqual(manifest["services"]["cdp"]["url"], "")


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
        manifest = _new_runtime_manifest()

        with patch.object(services, "is_port_free", return_value=True) as is_free, \
             patch.object(services, "_start_vite_frontend", side_effect=FileNotFoundError("vite")) as start_vite, \
             patch.object(services.subprocess, "Popen") as popen, \
             patch.object(services, "log", side_effect=lambda prefix, message: logs.append(message)):
            ok, url = services.resolve_frontend(manifest, 3001, "")

        self.assertFalse(ok)
        self.assertEqual(url, "")
        self.assertIn("frontend action=failed reason=vite-cli-missing", logs)
        self.assertGreater(is_free.call_count, 0)
        start_vite.assert_called_once()
        popen.assert_not_called()
        self.assertFalse(services._owned_entries)

    def test_resolve_frontend_uses_ipv4_url_for_readiness_and_manifest(self):
        services = self.services
        started = []
        manifest = _new_runtime_manifest()

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

        def fake_wait(url, prefix, timeout, validator=None):
            identity = _frontend_identity(
                started[0],
                3001,
                instance_id="vite-direct",
                pid=proc.pid,
            )
            self.assertTrue(validator(identity))
            return True, identity

        with patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_vite_frontend", side_effect=fake_start), \
             patch.object(services, "wait_for_service", side_effect=fake_wait) as wait:
            ok, url = services.resolve_frontend(manifest, 3001, "")

        expected_url = f"http://127.0.0.1:{started[0]}"
        self.assertTrue(ok)
        self.assertEqual(url, expected_url)
        self.assertEqual(manifest["services"]["frontend"]["url"], expected_url)
        self.assertEqual(
            wait.call_args.args[0],
            f"{expected_url}/__launcher/health",
        )
        self.assertEqual(wait.call_args.args[1], "Launcher")
        self.assertEqual(
            wait.call_args.kwargs["timeout"],
            services._MAX_FRONTEND_WAIT,
        )
        self.assertTrue(callable(wait.call_args.kwargs["validator"]))
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
        with patch.object(services, "_force_kill_tree", side_effect=lambda entry: (
            force_killed.append(entry["pid"]) or {
                "ok": True, "state": "force_killed",
                "forceKill": "requested", "reason": "test_force_confirmed",
            }
        )):
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
        """A1: an alternate CDP launch remains non-blocking after one immediate probe."""
        services = self.services
        alternative = services.PREFERRED_CDP_PORT + 1
        manifest = _new_runtime_manifest()

        def free(port):
            return port == alternative

        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})) as probe, \
             patch.object(services, "is_port_free", side_effect=free), \
             patch.object(services, "_start_chrome_cdp", return_value={
                 "ok": True,
                 "state": "launch_requested",
                 "port": alternative,
                 "returnCode": 0,
             }) as launch:
            url = services.resolve_cdp(manifest)

        self.assertEqual(url, f"http://127.0.0.1:{alternative}")
        self.assertEqual(manifest["services"]["cdp"]["url"], url)
        self.assertEqual(manifest["services"]["cdp"]["status"], "starting")
        launch.assert_called_once_with(alternative)
        self.assertEqual(probe.call_count, services._MAX_PORT_ATTEMPTS + 1)

    def test_cdp_without_any_free_port_is_unavailable(self):
        """A2: no reusable CDP and no free candidate is explicitly unavailable."""
        services = self.services
        manifest = _new_runtime_manifest()
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "_start_chrome_cdp") as helper:
            self.assertEqual(services.resolve_cdp(manifest), "")
        self.assertEqual(manifest["services"]["cdp"]["url"], "")
        self.assertEqual(manifest["services"]["cdp"]["status"], "unavailable")
        helper.assert_not_called()

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for JavaScript regression fixtures")
    def test_preflight_empty_cdp_skips_api_and_returns_null(self):
        """B1: cdpUrl === '' must not issue a test API request or fall back to 9222."""
        hook = (_PROJECT_ROOT / "frontend/src/hooks/usePreflightChecks.js").read_text(encoding="utf-8")
        cdp_url = (_PROJECT_ROOT / "frontend/src/utils/cdpUrl.js").read_text(encoding="utf-8")
        runtime_log = (_PROJECT_ROOT / "frontend/src/utils/runtimeLog.js").read_text(encoding="utf-8")
        _run_node_module_test({
            "frontend/src/hooks/usePreflightChecks.js": hook,
            "frontend/src/utils/cdpUrl.js": cdp_url,
            "frontend/src/utils/runtimeLog.js": runtime_log,
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
        cdp_url = (_PROJECT_ROOT / "frontend/src/utils/cdpUrl.js").read_text(encoding="utf-8")
        _run_node_module_test({
            "frontend/src/services/liveSessionApi.js": live_api,
            "frontend/src/utils/cdpUrl.js": cdp_url,
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
        cdp_url = (_PROJECT_ROOT / "backend/src/utils/cdpUrl.js").read_text(encoding="utf-8")
        _run_node_module_test({
            "backend/src/routes/match/trackingResponses.js": tracking,
            "backend/src/utils/cdpUrl.js": cdp_url,
            "backend/src/sofa/extractEventId.js": "export function extractEventId() { return 'default'; }\n",
            "backend/src/sofa/matchTracker.js": "export function trackMatch() {} export function untrackMatch() {} export function stopAllMatchTrackers() {}\n",
            "backend/src/sofa/betfairFetch.js": "export function getBetfairScraperRuntimeConflict() { return null; }\n",
            "backend/src/runtime/pythonProcessRegistry.js": "export async function terminatePythonProcesses() { return { ok: true, scope: 'tracking', requested: 0, graceful: 0, forceKilled: 0, alreadyExited: 0, remaining: 0, errors: [] }; }\n",
            "backend/src/runtime/runtimeLogger.js": "export const runtimeLog = { info() {}, error() {}, warn() {}, debug() {} };\n",
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
        with patch.object(services, "_send_clean_signal", side_effect=lambda entry: (
            order.append("signal") or {
                "ok": True, "status": "sent", "reason": "test_signal",
            }
        )), \
             patch.object(services, "_force_kill_tree", side_effect=lambda entry: (
                 order.append(f"kill:{entry['pid']}") or {
                     "ok": True, "state": "force_killed",
                     "forceKill": "requested", "reason": "test_force_confirmed",
                 }
             )):
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
            def send_signal(self, sig): terminated.append(self.pid)
            def wait(self, timeout=None): return 0
            def terminate(self): terminated.append(self.pid)

        procs = [FakeProc(62001), FakeProc(62002)]

        def fake_start(port, backend_port, cdp_url):
            started_ports.append(port)
            proc = procs[len(started_ports) - 1]
            services._register_owned_proc(proc, "frontend")
            return proc

        def fake_wait(url, prefix, timeout, validator=None):
            if len(started_ports) == 1:
                return False, "timeout"
            identity = _frontend_identity(
                started_ports[-1],
                services.PREFERRED_BACKEND_PORT,
                instance_id="retry-ok",
                pid=procs[1].pid,
            )
            self.assertTrue(validator(identity))
            return True, identity

        manifest = _new_runtime_manifest()
        with patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_vite_frontend", side_effect=fake_start), \
             patch.object(services, "wait_for_service", side_effect=fake_wait):
            ok, url = services.resolve_frontend(
                manifest,
                services.PREFERRED_BACKEND_PORT,
                "",
            )

        self.assertTrue(ok)
        self.assertEqual(len(started_ports), 2)
        self.assertNotEqual(started_ports[0], started_ports[1])
        self.assertIn(62001, terminated)
        self.assertEqual(url, f"http://127.0.0.1:{started_ports[1]}")

    def test_manifest_without_instance_id_is_not_reusable(self):
        """E: an otherwise healthy manifest cannot omit backendInstanceId."""
        from launcher import session
        manifest = _ready_runtime_manifest(
            3010,
            5173,
            backend_pid=42,
            backend_instance="instance-a",
        )
        manifest["services"]["backend"]["instanceId"] = ""
        with patch.object(session, "check_backend_identity") as identity:
            self.assertFalse(session.is_manifest_reusable(manifest))
        identity.assert_not_called()

    def test_manifest_with_incoherent_base_and_health_urls_is_not_reusable(self):
        """E: backend base and health endpoints must identify the same service."""
        from launcher import session
        manifest = _ready_runtime_manifest(
            3010,
            5173,
            backend_pid=42,
            backend_instance="instance-a",
        )
        manifest["services"]["backend"]["healthUrl"] = (
            "http://127.0.0.1:3011/api/health"
        )
        with patch.object(session, "check_backend_identity") as identity:
            self.assertFalse(session.is_manifest_reusable(manifest))
        identity.assert_not_called()


# ===========================================================================
# Task 2 Prompt 1 — atomic launcher lock and session identity
# ===========================================================================


def _task2_identity(session_id="session-a", pid=12345, fingerprint="fingerprint-a", executable="python"):
    return {
        "sessionId": session_id,
        "pid": pid,
        "createdAt": "2026-01-01T00:00:00Z",
        "processIdentity": {
            "startFingerprint": fingerprint,
            "executable": executable,
        },
    }


def _task2_alive_probe(fingerprint="fingerprint-a", executable="python"):
    return lambda pid: {
        "state": "alive",
        "reason": "identity_verified",
        "identity": {
            "startFingerprint": fingerprint,
            "executable": executable,
        },
    }


class TestLauncherAtomicSessionLock(unittest.TestCase):

    def test_t1_lock_is_versioned_json_for_current_session(self):
        with _SessionPatch() as session:
            identity = _task2_identity()
            result = session.acquire_or_recover_lock(
                identity,
                process_probe=_task2_alive_probe(),
            )
            self.assertTrue(result["acquired"])
            document = json.loads(session._LOCK_FILE.read_text(encoding="utf-8"))
            self.assertEqual(document["schema"], 2)
            self.assertEqual(document["project"], "tennis-decision-ui")
            self.assertEqual(document["sessionId"], identity["sessionId"])
            self.assertEqual(document["pid"], identity["pid"])
            self.assertEqual(document["createdAt"], identity["createdAt"])
            self.assertEqual(document["processIdentity"], identity["processIdentity"])

    def test_t2_verified_active_lock_rejects_second_session_without_change(self):
        with _SessionPatch() as session:
            owner = _task2_identity("owner")
            self.assertTrue(session.acquire_or_recover_lock(
                owner,
                process_probe=_task2_alive_probe(),
            )["acquired"])
            manifest = session._empty_manifest(owner["pid"], owner)
            before = session._LOCK_FILE.read_bytes()
            result = session.acquire_or_recover_lock(
                _task2_identity("contender", pid=12346),
                manifest=manifest,
                process_probe=_task2_alive_probe(),
            )
            self.assertFalse(result["acquired"])
            self.assertEqual(result["state"], "active")
            self.assertEqual(session._LOCK_FILE.read_bytes(), before)

    def test_t3_dead_pid_lock_is_reclaimed(self):
        with _SessionPatch() as session:
            old = _task2_identity("old")
            session._LOCK_FILE.write_text(
                json.dumps(session._lock_record(old)),
                encoding="utf-8",
            )
            result = session.acquire_or_recover_lock(
                _task2_identity("new", pid=12346),
                process_probe=lambda pid: {
                    "state": "dead", "reason": "pid_not_found", "identity": None,
                },
            )
            self.assertTrue(result["acquired"])
            self.assertEqual(result["state"], "reclaimed")
            self.assertEqual(
                json.loads(session._LOCK_FILE.read_text(encoding="utf-8"))["sessionId"],
                "new",
            )

    def test_t4_recycled_pid_is_stale_when_fingerprint_differs(self):
        with _SessionPatch() as session:
            old = _task2_identity("old", fingerprint="old-fingerprint")
            session._LOCK_FILE.write_text(
                json.dumps(session._lock_record(old)),
                encoding="utf-8",
            )
            result = session.acquire_or_recover_lock(
                _task2_identity("new", pid=12346, fingerprint="new-fingerprint"),
                process_probe=_task2_alive_probe("new-fingerprint"),
            )
            self.assertTrue(result["acquired"])
            self.assertEqual(result["state"], "reclaimed")
            self.assertEqual(result["reason"], "pid_recycled")

    def test_t5_unverifiable_identity_is_unknown_and_not_removed(self):
        with _SessionPatch() as session:
            old = _task2_identity("old")
            session._LOCK_FILE.write_text(
                json.dumps(session._lock_record(old)),
                encoding="utf-8",
            )
            before = session._LOCK_FILE.read_bytes()
            result = session.acquire_or_recover_lock(
                _task2_identity("new", pid=12346),
                process_probe=lambda pid: {
                    "state": "unknown",
                    "reason": "process_identity_unavailable",
                    "identity": None,
                },
            )
            self.assertEqual(result["state"], "unknown")
            self.assertEqual(session._LOCK_FILE.read_bytes(), before)

    def test_t6_corrupt_lock_is_unknown_and_preserved(self):
        with _SessionPatch() as session:
            session._LOCK_FILE.write_text("{not-json", encoding="utf-8")
            result = session.acquire_or_recover_lock(
                _task2_identity(),
                process_probe=_task2_alive_probe(),
            )
            self.assertEqual(result["state"], "unknown")
            self.assertEqual(session._LOCK_FILE.read_text(encoding="utf-8"), "{not-json")

    def test_t7_dead_legacy_pid_lock_is_migrated(self):
        with _SessionPatch() as session:
            session._LOCK_FILE.write_text("999999999", encoding="utf-8")
            result = session.acquire_or_recover_lock(
                _task2_identity(),
                process_probe=lambda pid: {
                    "state": "dead", "reason": "pid_not_found", "identity": None,
                },
            )
            self.assertTrue(result["acquired"])
            self.assertEqual(
                json.loads(session._LOCK_FILE.read_text(encoding="utf-8"))["schema"],
                2,
            )

    def test_t8_live_legacy_pid_lock_is_unknown_and_preserved(self):
        with _SessionPatch() as session:
            value = str(os.getpid())
            session._LOCK_FILE.write_text(value, encoding="utf-8")
            result = session.acquire_or_recover_lock(
                _task2_identity(),
                process_probe=_task2_alive_probe(),
            )
            self.assertEqual(result["state"], "unknown")
            self.assertEqual(session._LOCK_FILE.read_text(encoding="utf-8"), value)

    def test_t9_owner_release_is_idempotent(self):
        with _SessionPatch() as session:
            owner = _task2_identity()
            session.acquire_or_recover_lock(
                owner,
                process_probe=_task2_alive_probe(),
            )
            first = session.release_lock(owner)
            second = session.release_lock(owner)
            self.assertTrue(first["released"])
            self.assertEqual(first["reason"], "owner_removed")
            self.assertTrue(second["released"])
            self.assertEqual(second["state"], "absent")

    def test_t10_non_owner_release_does_not_remove_lock(self):
        with _SessionPatch() as session:
            owner = _task2_identity("owner")
            session.acquire_or_recover_lock(
                owner,
                process_probe=_task2_alive_probe(),
            )
            result = session.release_lock(_task2_identity("other"))
            self.assertEqual(result["state"], "not_owner")
            self.assertTrue(session._LOCK_FILE.exists())

    def test_t11_manifest_and_lock_share_minimal_launcher_identity(self):
        with _SessionPatch() as session:
            identity = _task2_identity()
            session.acquire_or_recover_lock(
                identity,
                process_probe=_task2_alive_probe(),
            )
            manifest = session._empty_manifest(identity["pid"], identity)
            lock = json.loads(session._LOCK_FILE.read_text(encoding="utf-8"))
            self.assertEqual(
                manifest["session"]["sessionId"],
                lock["sessionId"],
            )
            self.assertEqual(
                manifest["session"]["launcherPid"],
                lock["pid"],
            )
            self.assertEqual(
                manifest["session"]["processIdentity"],
                lock["processIdentity"],
            )
            self.assertIn("services", manifest)
            self.assertNotIn("backendBaseUrl", manifest)
            self.assertNotIn("frontendUrl", manifest)
            self.assertNotIn("ownedPids", manifest)
            self.assertNotIn("ownership", manifest)

    def test_t12_manifest_mismatch_is_unknown_and_not_reclaimed(self):
        with _SessionPatch() as session:
            owner = _task2_identity("owner")
            session.acquire_or_recover_lock(
                owner,
                process_probe=_task2_alive_probe(),
            )
            manifest = session._empty_manifest(owner["pid"], owner)
            manifest["session"]["sessionId"] = "different-session"
            result = session.acquire_or_recover_lock(
                _task2_identity("contender", pid=12346),
                manifest=manifest,
                process_probe=_task2_alive_probe(),
            )
            self.assertEqual(result["state"], "unknown")
            self.assertEqual(result["reason"], "manifest_lock_mismatch")
            self.assertEqual(
                json.loads(session._LOCK_FILE.read_text(encoding="utf-8"))["sessionId"],
                "owner",
            )

    def _run_cross_process_contenders(self, stale=False, count=4):
        with _SessionPatch() as session:
            if stale:
                session._LOCK_FILE.write_text("999999999", encoding="utf-8")
            start_file = session._RUNTIME_DIR / "start.flag"
            code = r"""
import json
import sys
import time
from pathlib import Path
from launcher import session
root = Path(sys.argv[1])
start_file = Path(sys.argv[2])
session._RUNTIME_DIR = root
session._LOCK_FILE = root / "launcher.lock"
session._COORDINATION_FILE = root / "launcher.lock.guard"
session._MANIFEST_FILE = root / "manifest.json"
deadline = time.monotonic() + 10
while not start_file.exists():
    if time.monotonic() >= deadline:
        raise SystemExit("start barrier timeout")
    time.sleep(0.02)
identity = session.create_launcher_session_identity()
result = session.acquire_or_recover_lock(identity)
print(json.dumps({"result": result, "identity": identity}), flush=True)
if result.get("acquired"):
    time.sleep(1.5)
"""
            processes = [
                subprocess.Popen(
                    [sys.executable, "-c", code, str(session._RUNTIME_DIR), str(start_file)],
                    cwd=_PROJECT_ROOT,
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                for _ in range(count)
            ]
            time.sleep(0.2)
            start_file.write_text("go", encoding="utf-8")
            outputs = []
            for process in processes:
                stdout, stderr = process.communicate(timeout=15)
                self.assertEqual(process.returncode, 0, stderr)
                outputs.append(json.loads(stdout.strip()))
            winners = [item for item in outputs if item["result"].get("acquired")]
            self.assertEqual(len(winners), 1, outputs)
            final_lock = json.loads(session._LOCK_FILE.read_text(encoding="utf-8"))
            self.assertEqual(final_lock["sessionId"], winners[0]["identity"]["sessionId"])

    def test_t13_cross_process_contention_on_absent_lock_has_one_winner(self):
        self._run_cross_process_contenders(stale=False)

    def test_t14_cross_process_stale_recovery_has_one_winner(self):
        self._run_cross_process_contenders(stale=True)

    def test_t15_guard_is_released_after_holder_crash(self):
        with _SessionPatch() as session:
            code = r"""
import os
import sys
from pathlib import Path
from launcher import session
root = Path(sys.argv[1])
session._RUNTIME_DIR = root
session._LOCK_FILE = root / "launcher.lock"
session._COORDINATION_FILE = root / "launcher.lock.guard"
session._MANIFEST_FILE = root / "manifest.json"
with session._coordination_guard(1.0):
    os._exit(0)
"""
            completed = subprocess.run(
                [sys.executable, "-c", code, str(session._RUNTIME_DIR)],
                cwd=_PROJECT_ROOT,
                timeout=10,
            )
            self.assertEqual(completed.returncode, 0)
            result = session.acquire_or_recover_lock(
                session.create_launcher_session_identity()
            )
            self.assertTrue(result["acquired"], result)

    def test_t16_write_failure_leaves_no_partial_lock_and_can_retry(self):
        with _SessionPatch() as session:
            real_write = os.write

            def broken_write(fd, data):
                real_write(fd, data[:2])
                raise OSError("simulated write failure")

            with patch.object(session.os, "write", side_effect=broken_write):
                failed = session.acquire_or_recover_lock(
                    _task2_identity(),
                    process_probe=_task2_alive_probe(),
                )
            self.assertEqual(failed["state"], "failed")
            self.assertFalse(session._LOCK_FILE.exists())
            retry = session.acquire_or_recover_lock(
                _task2_identity("retry"),
                process_probe=_task2_alive_probe(),
            )
            self.assertTrue(retry["acquired"])

    def test_t17_main_uses_one_session_identity_and_blocks_active_or_unknown(self):
        from launcher import app

        identity = _task2_identity("main-session", pid=321, fingerprint="main-fp")
        written = []
        with patch.object(app, "read_manifest", return_value=None), \
             patch.object(app, "is_manifest_reusable", return_value=False), \
             patch.object(app, "create_launcher_session_identity", return_value=identity), \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": True, "state": "acquired", "reason": "lock_created",
             }), \
             patch.object(app, "write_manifest", side_effect=lambda value: written.append(copy.deepcopy(value))), \
             patch.object(app, "resolve_cdp", return_value=""), \
             patch.object(app, "resolve_backend", return_value=(True, "http://127.0.0.1:3001")), \
             patch.object(app, "resolve_frontend", return_value=(True, "http://127.0.0.1:3000")), \
             patch.object(app, "open_browser"), \
             patch.object(app, "shutdown_owned", return_value={
                 "ok": True, "state": "already_empty", "attempted": 0,
                 "stopped": 0, "failed": 0, "entries": [],
             }), \
             patch.object(app, "remove_manifest", return_value={
                 "removed": True, "state": "removed", "reason": "owner_removed",
             }) as remove, \
             patch.object(app, "release_lock", return_value={
                 "released": True, "state": "released", "reason": "owner_removed",
             }) as release, \
             patch.object(app._StopController, "wait", side_effect=KeyboardInterrupt):
            app.main()
        self.assertTrue(written)
        self.assertEqual(
            written[0]["session"]["sessionId"], identity["sessionId"]
        )
        self.assertEqual(
            written[0]["session"]["launcherPid"], identity["pid"]
        )
        remove.assert_called_once_with(identity)
        release.assert_called_once_with(identity)

        for state in ("active", "unknown"):
            with patch.object(app, "read_manifest", return_value=None), \
                 patch.object(app, "is_manifest_reusable", return_value=False), \
                 patch.object(app, "create_launcher_session_identity", return_value=identity), \
                 patch.object(app, "acquire_or_recover_lock", return_value={
                     "acquired": False, "state": state, "reason": "blocked",
                 }), \
                 patch.object(app, "resolve_cdp") as resolve_cdp:
                app.main()
            resolve_cdp.assert_not_called()

# ===========================================================================
# Task 2 Prompt 2 — canonical runtime manifest and explicit ownership
# ===========================================================================

class TestCanonicalRuntimeManifest(unittest.TestCase):

    def setUp(self):
        from launcher import services
        self.services = services
        self.original_owned = list(services._owned_entries)
        services._owned_entries.clear()

    def tearDown(self):
        self.services._owned_entries.clear()
        self.services._owned_entries.extend(self.original_owned)

    def test_m1_initial_schema_is_canonical(self):
        from launcher import session
        identity = _launcher_identity_for_manifest("m1", pid=321)
        manifest = session._empty_manifest(identity["pid"], identity)

        self.assertEqual(manifest["schema"], 2)
        self.assertEqual(manifest["project"], "tennis-decision-ui")
        self.assertEqual(manifest["session"]["sessionId"], identity["sessionId"])
        self.assertEqual(manifest["session"]["launcherPid"], identity["pid"])
        self.assertEqual(
            manifest["session"]["processIdentity"],
            identity["processIdentity"],
        )
        self.assertEqual(manifest["session"]["startedAt"], identity["createdAt"])
        self.assertEqual(manifest["session"]["status"], "starting")
        self.assertEqual(manifest["session"]["reason"], "startup_in_progress")
        self.assertEqual(
            manifest["services"]["backend"]["requestedPort"],
            3001,
        )
        self.assertEqual(
            manifest["services"]["frontend"]["requestedPort"],
            3000,
        )
        self.assertEqual(manifest["services"]["cdp"]["requestedPort"], 9222)
        for role in ("backend", "frontend", "cdp"):
            self.assertEqual(manifest["services"][role]["status"], "pending")
            self.assertEqual(manifest["services"][role]["ownership"], "unknown")
        for legacy in (
            "launcherPid",
            "launcherSessionId",
            "launcherProcessIdentity",
            "startedAt",
            "status",
            "backendBaseUrl",
            "backendHealthUrl",
            "backendInstanceId",
            "frontendUrl",
            "cdpUrl",
            "cdpStatus",
            "ownedPids",
            "ownership",
        ):
            self.assertNotIn(legacy, manifest)
        self.assertTrue(session.validate_manifest_schema(manifest)["valid"])

    def test_m1b_manifest_requires_existing_session_identity(self):
        from launcher import session

        with self.assertRaises(ValueError):
            session._empty_manifest(321)
        with self.assertRaises(ValueError):
            session._empty_manifest(321, None)
        with self.assertRaises(ValueError):
            session._empty_manifest(321, {})

        mismatched = _launcher_identity_for_manifest("m1b", pid=322)
        with self.assertRaises(ValueError):
            session._empty_manifest(321, mismatched)

    def test_m2_unknown_status_and_ownership_are_rejected(self):
        from launcher import session

        manifest = _new_runtime_manifest("m2-status")
        manifest["services"]["backend"]["status"] = "mystery"
        self.assertFalse(session.validate_manifest_schema(manifest)["valid"])

        manifest = _new_runtime_manifest("m2-ownership")
        manifest["services"]["frontend"]["ownership"] = "mine"
        self.assertFalse(session.validate_manifest_schema(manifest)["valid"])

        with self.assertRaises(ValueError):
            session.manifest_set_session_status(manifest, "invalid_status", "invalid")

    def test_m3_backend_owned_is_explicit_and_registered(self):
        services = self.services
        manifest = _new_runtime_manifest("m3")

        class FakeProc:
            pid = 71001
            def poll(self): return None
            def send_signal(self, sig): pass
            def terminate(self): pass
            def wait(self, timeout=None): return 0
            def kill(self): pass

        proc = FakeProc()

        def fake_start(port):
            services._register_owned_proc(proc, "backend")
            return proc

        with patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_node_backend", side_effect=fake_start), \
             patch.object(services, "wait_for_service", return_value=(
                 True,
                 {
                     "ok": True,
                     "project": "tennis-decision-ui",
                     "instanceId": "backend-owned",
                     "pid": proc.pid,
                     "startedAt": "2026-01-01T00:00:01Z",
                 },
             )):
            ok, url = services.resolve_backend(manifest)

        backend = manifest["services"]["backend"]
        self.assertTrue(ok)
        self.assertEqual(url, "http://127.0.0.1:3001")
        self.assertEqual(backend["status"], "ready")
        self.assertEqual(backend["ownership"], "owned")
        self.assertEqual(backend["requestedPort"], 3001)
        self.assertEqual(backend["selectedPort"], 3001)
        self.assertEqual(backend["pid"], proc.pid)
        self.assertEqual(backend["baseUrl"], url)
        self.assertEqual(backend["healthUrl"], f"{url}/api/health")
        self.assertEqual(backend["instanceId"], "backend-owned")
        self.assertEqual(backend["source"], "launcher")
        self.assertEqual(backend["reason"], "started_preferred_port")
        self.assertTrue(backend["resolvedAt"])
        self.assertEqual(len(services._owned_entries), 1)
        self.assertEqual(services._owned_entries[0]["pid"], proc.pid)

    def test_m4_backend_reused_keeps_health_pid_without_ownership(self):
        services = self.services
        manifest = _new_runtime_manifest("m4")
        with patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "check_backend_identity", return_value=(
                 True,
                 {
                     "ok": True,
                     "project": "tennis-decision-ui",
                     "instanceId": "backend-reused",
                     "pid": 72001,
                     "startedAt": "2026-01-01T00:00:02Z",
                 },
             )):
            ok, url = services.resolve_backend(manifest)

        backend = manifest["services"]["backend"]
        self.assertTrue(ok)
        self.assertEqual(backend["ownership"], "reused")
        self.assertEqual(backend["pid"], 72001)
        self.assertEqual(backend["selectedPort"], 3001)
        self.assertEqual(backend["baseUrl"], url)
        self.assertEqual(backend["instanceId"], "backend-reused")
        self.assertEqual(backend["source"], "existing_health")
        self.assertEqual(backend["reason"], "reused_preferred_port")
        self.assertFalse(services._owned_entries)

    def test_m5_backend_failure_clears_transient_identity(self):
        services = self.services
        manifest = _new_runtime_manifest("m5")
        with patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "check_backend_identity", return_value=(False, {})):
            ok, url = services.resolve_backend(manifest)

        backend = manifest["services"]["backend"]
        self.assertFalse(ok)
        self.assertEqual(url, "")
        self.assertEqual(backend["status"], "failed")
        self.assertEqual(backend["ownership"], "unknown")
        self.assertIsNone(backend["selectedPort"])
        self.assertIsNone(backend["pid"])
        self.assertIsNone(backend["baseUrl"])
        self.assertIsNone(backend["healthUrl"])
        self.assertIsNone(backend["instanceId"])
        self.assertEqual(backend["source"], "launcher")
        self.assertEqual(backend["reason"], "max_attempts")

    def test_m6_frontend_owned_records_backend_target(self):
        services = self.services
        manifest = _new_runtime_manifest("m6")

        class FakeProc:
            pid = 73001
            def poll(self): return None
            def send_signal(self, sig): pass
            def terminate(self): pass
            def wait(self, timeout=None): return 0
            def kill(self): pass

        proc = FakeProc()

        def fake_start(port, backend_port, cdp_url):
            services._register_owned_proc(proc, "frontend")
            return proc

        identity = _frontend_identity(
            3000,
            3001,
            instance_id="m6-frontend",
            pid=proc.pid,
        )
        with patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_vite_frontend", side_effect=fake_start), \
             patch.object(services, "wait_for_service", return_value=(True, identity)):
            ok, url = services.resolve_frontend(manifest, 3001, "")

        frontend = manifest["services"]["frontend"]
        self.assertTrue(ok)
        self.assertEqual(frontend["status"], "ready")
        self.assertEqual(frontend["ownership"], "owned")
        self.assertEqual(frontend["selectedPort"], 3000)
        self.assertEqual(frontend["pid"], proc.pid)
        self.assertEqual(frontend["url"], url)
        self.assertEqual(frontend["instanceId"], "m6-frontend")
        self.assertEqual(frontend["startedAt"], identity["startedAt"])
        self.assertEqual(frontend["backendTarget"], "http://127.0.0.1:3001")
        self.assertEqual(frontend["source"], "launcher")
        self.assertEqual(frontend["reason"], "started_preferred_port")

    def test_m7_frontend_failure_reasons_are_canonical(self):
        services = self.services

        manifest = _new_runtime_manifest("m7-cli")
        with patch.object(services, "_vite_cli_path", return_value="/missing/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=False):
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertFalse(ok)
        self.assertEqual(
            manifest["services"]["frontend"]["reason"],
            "vite_cli_missing",
        )

        manifest = _new_runtime_manifest("m7-port")
        with patch.object(services, "_vite_cli_path", return_value="/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=True), \
             patch.object(services, "is_port_free", return_value=False):
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertFalse(ok)
        self.assertEqual(
            manifest["services"]["frontend"]["reason"],
            "no_free_port",
        )

        class FakeProc:
            def __init__(self, pid):
                self.pid = pid
            def poll(self): return None
            def send_signal(self, sig): pass
            def terminate(self): pass
            def wait(self, timeout=None): return 0
            def kill(self): pass

        counter = [0]
        def fake_start(port, backend_port, cdp_url):
            counter[0] += 1
            proc = FakeProc(74000 + counter[0])
            services._register_owned_proc(proc, "frontend")
            return proc

        services._owned_entries.clear()
        manifest = _new_runtime_manifest("m7-attempts")
        with patch.object(services, "_vite_cli_path", return_value="/vite.js"), \
             patch.object(services.os.path, "isfile", return_value=True), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_vite_frontend", side_effect=fake_start), \
             patch.object(services, "wait_for_service", return_value=(False, "timeout")):
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertFalse(ok)
        self.assertEqual(
            manifest["services"]["frontend"]["reason"],
            "max_attempts",
        )
        self.assertFalse(services._owned_entries)

    def test_m8_cdp_reused_is_ready_without_pid(self):
        services = self.services
        manifest = _new_runtime_manifest("m8")
        with patch.object(services, "check_cdp_endpoint", return_value=(True, {})):
            url = services.resolve_cdp(manifest)

        cdp = manifest["services"]["cdp"]
        self.assertEqual(url, "http://127.0.0.1:9222")
        self.assertEqual(cdp["status"], "ready")
        self.assertEqual(cdp["ownership"], "reused")
        self.assertEqual(cdp["selectedPort"], 9222)
        self.assertIsNone(cdp["pid"])
        self.assertEqual(cdp["source"], "existing_endpoint")
        self.assertEqual(cdp["reason"], "reused_preferred_endpoint")

    def test_m9_cdp_helper_is_external_and_starting(self):
        services = self.services
        manifest = _new_runtime_manifest("m9")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_chrome_cdp", return_value={
                 "ok": True,
                 "state": "launch_requested",
                 "port": 9222,
                 "returnCode": 0,
             }):
            url = services.resolve_cdp(manifest)

        cdp = manifest["services"]["cdp"]
        self.assertEqual(cdp["status"], "starting")
        self.assertEqual(cdp["ownership"], "external")
        self.assertEqual(cdp["selectedPort"], 9222)
        self.assertIsNone(cdp["pid"])
        self.assertEqual(cdp["url"], url)
        self.assertEqual(cdp["source"], "chrome_helper")
        self.assertEqual(cdp["reason"], "launch_requested_preferred_port")

    def test_m10_cdp_unavailable_has_empty_url(self):
        services = self.services

        manifest = _new_runtime_manifest("m10-no-port")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=False):
            self.assertEqual(services.resolve_cdp(manifest), "")
        cdp = manifest["services"]["cdp"]
        self.assertEqual(cdp["status"], "unavailable")
        self.assertEqual(cdp["ownership"], "unknown")
        self.assertIsNone(cdp["selectedPort"])
        self.assertEqual(cdp["url"], "")
        self.assertEqual(cdp["reason"], "no_free_port")

        manifest = _new_runtime_manifest("m10-helper")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_chrome_cdp", return_value={
                 "ok": False,
                 "state": "chrome_not_found",
                 "port": 9222,
                 "returnCode": 3,
             }):
            self.assertEqual(services.resolve_cdp(manifest), "")
        self.assertEqual(
            manifest["services"]["cdp"]["reason"],
            "chrome_not_found",
        )

    def test_m11_cdp_cannot_be_owned_or_have_pid(self):
        from launcher import session

        manifest = _new_runtime_manifest("m11-owned")
        with self.assertRaises(ValueError):
            session.manifest_set_cdp(
                manifest,
                status="ready",
                ownership="owned",
                selected_port=9222,
                url="http://127.0.0.1:9222",
                source="existing_endpoint",
                reason="invalid",
            )

        manifest = _new_runtime_manifest("m11-pid")
        manifest["services"]["cdp"]["pid"] = 99
        self.assertFalse(session.validate_manifest_schema(manifest)["valid"])

    def test_m12_schema2_manifest_is_reusable_with_valid_services(self):
        from launcher import session
        bp = _find_free_port(20500)
        fp = _find_free_port(bp + 1)
        backend = _start_server(
            bp,
            json.dumps({
                "ok": True,
                "project": "tennis-decision-ui",
                "instanceId": "m12",
                "pid": 75001,
            }).encode(),
        )
        frontend = _start_frontend_identity_server(fp, bp)
        try:
            manifest = _ready_runtime_manifest(
                bp,
                fp,
                backend_pid=75001,
                backend_instance="m12",
            )
            self.assertTrue(session.is_manifest_reusable(manifest))
        finally:
            _stop_server(backend)
            _stop_server(frontend)

    def test_m13_backend_pid_mismatch_is_not_reusable(self):
        from launcher import session
        bp = _find_free_port(20600)
        fp = _find_free_port(bp + 1)
        backend = _start_server(
            bp,
            json.dumps({
                "ok": True,
                "project": "tennis-decision-ui",
                "instanceId": "m13",
                "pid": 76002,
            }).encode(),
        )
        frontend = _start_frontend_identity_server(fp, bp)
        try:
            manifest = _ready_runtime_manifest(
                bp,
                fp,
                backend_pid=76001,
                backend_instance="m13",
            )
            self.assertFalse(session.is_manifest_reusable(manifest))
        finally:
            _stop_server(backend)
            _stop_server(frontend)

    def test_m14_schema1_manifest_is_not_reusable(self):
        from launcher import session
        legacy = {
            "schema": 1,
            "launcherPid": os.getpid(),
            "launcherSessionId": "legacy",
            "launcherProcessIdentity": {"startFingerprint": "legacy"},
            "status": "ready",
            "backendBaseUrl": "http://127.0.0.1:3001",
            "backendHealthUrl": "http://127.0.0.1:3001/api/health",
            "backendInstanceId": "legacy",
            "frontendUrl": "http://127.0.0.1:3000",
        }
        self.assertFalse(session.is_manifest_reusable(legacy))

    def test_m15_dead_launcher_does_not_block_reuse(self):
        from launcher import session
        bp = _find_free_port(20700)
        fp = _find_free_port(bp + 1)
        backend = _start_server(
            bp,
            json.dumps({
                "ok": True,
                "project": "tennis-decision-ui",
                "instanceId": "m15",
                "pid": 77001,
            }).encode(),
        )
        frontend = _start_frontend_identity_server(fp, bp)
        try:
            manifest = _ready_runtime_manifest(
                bp,
                fp,
                backend_pid=77001,
                backend_instance="m15",
                launcher_pid=999999999,
            )
            self.assertTrue(session.is_manifest_reusable(manifest))
        finally:
            _stop_server(backend)
            _stop_server(frontend)

    def test_m16_schema2_lock_and_manifest_are_active_when_coherent(self):
        from launcher import session
        identity = _task2_identity("m16", pid=78001, fingerprint="m16-fp")
        manifest = session._empty_manifest(identity["pid"], identity)
        result = session.classify_lock_text(
            json.dumps(session._lock_record(identity)),
            manifest=manifest,
            process_probe=_task2_alive_probe("m16-fp"),
        )
        self.assertEqual(result["state"], "active")

    def test_m17_schema2_lock_manifest_mismatch_is_unknown(self):
        from launcher import session
        identity = _task2_identity("m17", pid=78002, fingerprint="m17-fp")
        manifest = session._empty_manifest(identity["pid"], identity)
        manifest["session"]["sessionId"] = "different"
        result = session.classify_lock_text(
            json.dumps(session._lock_record(identity)),
            manifest=manifest,
            process_probe=_task2_alive_probe("m17-fp"),
        )
        self.assertEqual(result["state"], "unknown")
        self.assertEqual(result["reason"], "manifest_lock_mismatch")

    def test_m18_prompt1_manifest_identity_is_transitionally_recognized(self):
        from launcher import session
        identity = _task2_identity("m18", pid=78003, fingerprint="m18-fp")
        legacy = {
            "schema": 1,
            "launcherSessionId": identity["sessionId"],
            "launcherPid": identity["pid"],
            "launcherProcessIdentity": identity["processIdentity"],
        }
        result = session.classify_lock_text(
            json.dumps(session._lock_record(identity)),
            manifest=legacy,
            process_probe=_task2_alive_probe("m18-fp"),
        )
        self.assertEqual(result["state"], "active")

    def test_m19_owner_removes_own_manifest(self):
        with _SessionPatch() as session:
            identity = _task2_identity("m19", pid=79001)
            session.write_manifest(session._empty_manifest(identity["pid"], identity))
            result = session.remove_manifest(identity)
            self.assertTrue(result["removed"])
            self.assertEqual(result["state"], "removed")
            self.assertFalse(session._MANIFEST_FILE.exists())

    def test_m20_non_owner_cannot_remove_manifest(self):
        with _SessionPatch() as session:
            owner = _task2_identity("m20-owner", pid=79002)
            session.write_manifest(session._empty_manifest(owner["pid"], owner))
            result = session.remove_manifest(
                _task2_identity("m20-other", pid=79003)
            )
            self.assertFalse(result["removed"])
            self.assertEqual(result["state"], "not_owner")
            self.assertTrue(session._MANIFEST_FILE.exists())

    def test_m21_manifest_removal_is_idempotent_when_absent(self):
        with _SessionPatch() as session:
            result = session.remove_manifest(_task2_identity("m21", pid=79004))
            self.assertTrue(result["removed"])
            self.assertEqual(result["state"], "absent")

    def test_m22_corrupt_manifest_is_preserved_and_not_reusable(self):
        with _SessionPatch() as session:
            session._MANIFEST_FILE.write_text("{broken", encoding="utf-8")
            identity = _task2_identity("m22", pid=79005)
            result = session.remove_manifest(identity)
            self.assertFalse(result["removed"])
            self.assertEqual(result["state"], "unknown")
            self.assertTrue(session._MANIFEST_FILE.exists())
            self.assertFalse(session.is_manifest_reusable({"schema": 2}))

    def test_m23_app_persists_each_partial_state_in_order(self):
        from launcher import app, session
        identity = _task2_identity("m23", pid=80001, fingerprint="m23-fp")
        written = []

        def resolve_cdp(manifest):
            session.manifest_set_cdp(
                manifest,
                status="starting",
                ownership="external",
                selected_port=9222,
                url="http://127.0.0.1:9222",
                source="chrome_helper",
                reason="launch_requested_preferred_port",
            )
            return "http://127.0.0.1:9222"

        def resolve_backend(manifest):
            session.manifest_set_backend(
                manifest,
                status="ready",
                ownership="owned",
                selected_port=3001,
                pid=81001,
                base_url="http://127.0.0.1:3001",
                health_url="http://127.0.0.1:3001/api/health",
                instance_id="m23-backend",
                started_at=None,
                source="launcher",
                reason="started_preferred_port",
            )
            return True, "http://127.0.0.1:3001"

        def resolve_frontend(manifest, backend_port, cdp_url):
            session.manifest_set_frontend(
                manifest,
                status="ready",
                ownership="owned",
                selected_port=3000,
                pid=81002,
                url="http://127.0.0.1:3000",
                instance_id="m23-frontend",
                started_at="2026-01-01T00:00:00Z",
                backend_target="http://127.0.0.1:3001",
                source="launcher",
                reason="started_preferred_port",
            )
            return True, "http://127.0.0.1:3000"

        with patch.object(app, "read_manifest", return_value=None), \
             patch.object(app, "is_manifest_reusable", return_value=False), \
             patch.object(app, "create_launcher_session_identity", return_value=identity), \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": True, "state": "acquired", "reason": "lock_created",
             }), \
             patch.object(app, "write_manifest", side_effect=lambda value: written.append(copy.deepcopy(value))), \
             patch.object(app, "resolve_cdp", side_effect=resolve_cdp), \
             patch.object(app, "resolve_backend", side_effect=resolve_backend), \
             patch.object(app, "resolve_frontend", side_effect=resolve_frontend), \
             patch.object(app, "open_browser"), \
             patch.object(app, "shutdown_owned", return_value={
                 "ok": True, "state": "already_empty", "attempted": 0,
                 "stopped": 0, "failed": 0, "entries": [],
             }), \
             patch.object(app, "remove_manifest", return_value={
                 "removed": True, "state": "removed", "reason": "owner_removed",
             }), \
             patch.object(app, "release_lock", return_value={
                 "released": True, "state": "released", "reason": "owner_removed",
             }), \
             patch.object(app._StopController, "wait", side_effect=KeyboardInterrupt):
            app.main()

        self.assertEqual(len(written), 7)
        self.assertEqual(written[0]["session"]["status"], "starting")
        self.assertEqual(written[0]["services"]["cdp"]["status"], "pending")
        self.assertEqual(written[1]["services"]["cdp"]["status"], "starting")
        self.assertEqual(written[2]["services"]["backend"]["status"], "ready")
        self.assertEqual(written[3]["services"]["frontend"]["status"], "ready")
        self.assertEqual(written[4]["session"]["status"], "ready")
        self.assertEqual(written[4]["session"]["reason"], "services_ready")
        self.assertEqual(written[5]["session"]["status"], "stopping")
        self.assertEqual(written[5]["session"]["reason"], "shutdown_keyboard_interrupt")
        self.assertEqual(written[6]["session"]["status"], "stopped")
        self.assertEqual(written[6]["session"]["reason"], "shutdown_complete")

    def test_m24_backend_failure_is_persisted_before_cleanup(self):
        from launcher import app, session
        identity = _task2_identity("m24", pid=80002, fingerprint="m24-fp")
        written = []

        def resolve_backend(manifest):
            session.manifest_set_backend(
                manifest,
                status="failed",
                ownership="unknown",
                selected_port=None,
                pid=None,
                base_url=None,
                health_url=None,
                instance_id=None,
                started_at=None,
                source="launcher",
                reason="max_attempts",
            )
            return False, ""

        with patch.object(app, "read_manifest", return_value=None), \
             patch.object(app, "is_manifest_reusable", return_value=False), \
             patch.object(app, "create_launcher_session_identity", return_value=identity), \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": True, "state": "acquired", "reason": "lock_created",
             }), \
             patch.object(app, "write_manifest", side_effect=lambda value: written.append(copy.deepcopy(value))), \
             patch.object(app, "resolve_cdp", return_value=""), \
             patch.object(app, "resolve_backend", side_effect=resolve_backend), \
             patch.object(app, "resolve_frontend") as frontend, \
             patch.object(app, "shutdown_owned", return_value={
                 "ok": True, "state": "already_empty", "attempted": 0,
                 "stopped": 0, "failed": 0, "entries": [],
             }), \
             patch.object(app, "remove_manifest", return_value={
                 "removed": True, "state": "removed", "reason": "owner_removed",
             }), \
             patch.object(app, "release_lock", return_value={
                 "released": True, "state": "released", "reason": "owner_removed",
             }):
            app.main()

        frontend.assert_not_called()
        self.assertEqual(written[-1]["services"]["backend"]["status"], "failed")
        self.assertEqual(written[-1]["session"]["status"], "failed")
        self.assertEqual(written[-1]["session"]["reason"], "backend_failed")

    def test_m25_frontend_failure_is_persisted_before_cleanup(self):
        from launcher import app, session
        identity = _task2_identity("m25", pid=80003, fingerprint="m25-fp")
        written = []

        def resolve_backend(manifest):
            session.manifest_set_backend(
                manifest,
                status="ready",
                ownership="owned",
                selected_port=3001,
                pid=82001,
                base_url="http://127.0.0.1:3001",
                health_url="http://127.0.0.1:3001/api/health",
                instance_id="m25-backend",
                started_at=None,
                source="launcher",
                reason="started_preferred_port",
            )
            return True, "http://127.0.0.1:3001"

        def resolve_frontend(manifest, backend_port, cdp_url):
            session.manifest_set_frontend(
                manifest,
                status="failed",
                ownership="unknown",
                selected_port=None,
                pid=None,
                url=None,
                instance_id=None,
                started_at=None,
                backend_target="http://127.0.0.1:3001",
                source="launcher",
                reason="max_attempts",
            )
            return False, ""

        with patch.object(app, "read_manifest", return_value=None), \
             patch.object(app, "is_manifest_reusable", return_value=False), \
             patch.object(app, "create_launcher_session_identity", return_value=identity), \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": True, "state": "acquired", "reason": "lock_created",
             }), \
             patch.object(app, "write_manifest", side_effect=lambda value: written.append(copy.deepcopy(value))), \
             patch.object(app, "resolve_cdp", return_value=""), \
             patch.object(app, "resolve_backend", side_effect=resolve_backend), \
             patch.object(app, "resolve_frontend", side_effect=resolve_frontend), \
             patch.object(app, "shutdown_owned", return_value={
                 "ok": True, "state": "already_empty", "attempted": 0,
                 "stopped": 0, "failed": 0, "entries": [],
             }), \
             patch.object(app, "remove_manifest", return_value={
                 "removed": True, "state": "removed", "reason": "owner_removed",
             }), \
             patch.object(app, "release_lock", return_value={
                 "released": True, "state": "released", "reason": "owner_removed",
             }):
            app.main()

        self.assertEqual(written[-1]["services"]["frontend"]["status"], "failed")
        self.assertEqual(written[-1]["session"]["status"], "failed")
        self.assertEqual(written[-1]["session"]["reason"], "frontend_failed")

    def test_m26_cleanup_receives_the_single_launcher_identity(self):
        from launcher import app
        identity = _task2_identity("m26", pid=80004, fingerprint="m26-fp")
        with patch.object(app, "read_manifest", return_value=None), \
             patch.object(app, "is_manifest_reusable", return_value=False), \
             patch.object(app, "create_launcher_session_identity", return_value=identity) as create, \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": True, "state": "acquired", "reason": "lock_created",
             }), \
             patch.object(app, "write_manifest"), \
             patch.object(app, "resolve_cdp", return_value=""), \
             patch.object(app, "resolve_backend", return_value=(False, "")), \
             patch.object(app, "shutdown_owned", return_value={
                 "ok": True, "state": "already_empty", "attempted": 0,
                 "stopped": 0, "failed": 0, "entries": [],
             }), \
             patch.object(app, "remove_manifest", return_value={
                 "removed": True, "state": "removed", "reason": "owner_removed",
             }) as remove, \
             patch.object(app, "release_lock", return_value={
                 "released": True, "state": "released", "reason": "owner_removed",
             }) as release:
            app.main()

        create.assert_called_once_with()
        remove.assert_called_once_with(identity)
        release.assert_called_once_with(identity)

    def test_m27_prompt1_lock_regression_tests_remain_present(self):
        names = {
            name
            for name in dir(TestLauncherAtomicSessionLock)
            if name.startswith("test_t")
        }
        expected = {f"test_t{number}_" for number in range(1, 18)}
        for prefix in expected:
            self.assertTrue(
                any(name.startswith(prefix) for name in names),
                prefix,
            )
        self.assertTrue(
            hasattr(
                TestLauncherAtomicSessionLock,
                "test_t13_cross_process_contention_on_absent_lock_has_one_winner",
            )
        )
        self.assertTrue(
            hasattr(
                TestLauncherAtomicSessionLock,
                "test_t14_cross_process_stale_recovery_has_one_winner",
            )
        )


if __name__ == "__main__":
    unittest.main()

# ===========================================================================
# Task 2 Prompt 3 — signal convergence and idempotent owned shutdown
# ===========================================================================


def _shutdown_summary(ok=True, state=None, attempted=0, stopped=0, failed=0, entries=None):
    return {
        "ok": ok,
        "state": state or ("completed" if ok else "partial_failure"),
        "attempted": attempted,
        "stopped": stopped,
        "failed": failed,
        "entries": list(entries or []),
    }


class TestSignalAndIdempotentShutdown(unittest.TestCase):

    def setUp(self):
        from launcher import services
        self.services = services
        self.original_owned = list(services._owned_entries)
        services._owned_entries.clear()

    def tearDown(self):
        self.services._owned_entries.clear()
        self.services._owned_entries.extend(self.original_owned)

    def _register(self, proc, role="backend"):
        entry = {
            "role": role,
            "proc": proc,
            "pid": proc.pid,
            "started_at": time.time(),
        }
        self.services._owned_entries.append(entry)
        return entry

    def _run_app(
        self,
        *,
        install_action=None,
        cdp_action=None,
        backend_action=None,
        frontend_action=None,
        wait_action=None,
        shutdown_result=None,
    ):
        from launcher import app

        identity = _task2_identity("prompt3-app", pid=83001, fingerprint="prompt3-fp")
        written = []
        holder = {}

        def install(controller):
            holder["controller"] = controller
            if install_action is not None:
                install_action(controller)
            return {}

        if wait_action is None:
            def wait_action(controller, timeout):
                controller.request("sigint")
                return True

        with ExitStack() as stack:
            stack.enter_context(patch.object(app, "read_manifest", return_value=None))
            stack.enter_context(patch.object(app, "is_manifest_reusable", return_value=False))
            stack.enter_context(patch.object(app, "create_launcher_session_identity", return_value=identity))
            stack.enter_context(patch.object(app, "acquire_or_recover_lock", return_value={
                "acquired": True, "state": "acquired", "reason": "lock_created",
            }))
            stack.enter_context(patch.object(app, "_install_signal_handlers", side_effect=install))
            restore = stack.enter_context(patch.object(app, "_restore_signal_handlers"))
            stack.enter_context(patch.object(
                app,
                "write_manifest",
                side_effect=lambda value: written.append(copy.deepcopy(value)),
            ))
            cdp = stack.enter_context(patch.object(
                app,
                "resolve_cdp",
                side_effect=cdp_action,
                return_value="",
            ))
            backend = stack.enter_context(patch.object(
                app,
                "resolve_backend",
                side_effect=backend_action,
                return_value=(True, "http://127.0.0.1:3001"),
            ))
            frontend = stack.enter_context(patch.object(
                app,
                "resolve_frontend",
                side_effect=frontend_action,
                return_value=(True, "http://127.0.0.1:3000"),
            ))
            browser = stack.enter_context(patch.object(app, "open_browser"))
            shutdown = stack.enter_context(patch.object(
                app,
                "shutdown_owned",
                return_value=(shutdown_result or _shutdown_summary(
                    ok=True,
                    state="already_empty",
                )),
            ))
            remove = stack.enter_context(patch.object(app, "remove_manifest", return_value={
                "removed": True, "state": "removed", "reason": "owner_removed",
            }))
            release = stack.enter_context(patch.object(app, "release_lock", return_value={
                "released": True, "state": "released", "reason": "owner_removed",
            }))
            stack.enter_context(patch.object(
                app._StopController,
                "wait",
                autospec=True,
                side_effect=wait_action,
            ))
            app.main()

        return {
            "identity": identity,
            "written": written,
            "holder": holder,
            "cdp": cdp,
            "backend": backend,
            "frontend": frontend,
            "browser": browser,
            "shutdown": shutdown,
            "remove": remove,
            "release": release,
            "restore": restore,
        }

    def test_s1_stopping_and_stopped_are_session_only_states(self):
        from launcher import session
        manifest = _new_runtime_manifest("s1")
        session.manifest_set_session_status(manifest, "stopping", "shutdown_sigint")
        self.assertTrue(session.validate_manifest_schema(manifest)["valid"])
        session.manifest_set_session_status(manifest, "stopped", "shutdown_complete")
        self.assertTrue(session.validate_manifest_schema(manifest)["valid"])
        manifest["services"]["backend"]["status"] = "stopping"
        self.assertFalse(session.validate_manifest_schema(manifest)["valid"])

    def test_s2_supported_signals_are_registered(self):
        from launcher import app
        controller = app._StopController()
        installed_calls = []
        with patch.object(app.signal, "getsignal", return_value=app.signal.SIG_DFL), \
             patch.object(app.signal, "signal", side_effect=lambda sig, handler: installed_calls.append((sig, handler))):
            installed = app._install_signal_handlers(controller)
        expected = {app.signal.SIGINT, app.signal.SIGTERM}
        self.assertTrue(expected.issubset(set(installed)))
        self.assertTrue(expected.issubset({item[0] for item in installed_calls}))

    def test_s3_sigbreak_is_not_registered_on_unsupported_platforms(self):
        from launcher import app
        with patch.object(app.sys, "platform", "linux"):
            signals = {signum for signum, _ in app._supported_signal_reasons()}
        self.assertNotIn(getattr(app.signal, "SIGBREAK", object()), signals)

    def test_s4_first_signal_wins(self):
        from launcher import app
        controller = app._StopController()
        handlers = {}
        with patch.object(app.signal, "getsignal", return_value=app.signal.SIG_DFL), \
             patch.object(app.signal, "signal", side_effect=lambda sig, handler: handlers.setdefault(sig, handler)):
            app._install_signal_handlers(controller)
        handlers[app.signal.SIGTERM](app.signal.SIGTERM, None)
        handlers[app.signal.SIGINT](app.signal.SIGINT, None)
        self.assertTrue(controller.requested)
        self.assertEqual(controller.reason, "sigterm")

    def test_s5_previous_handlers_are_restored(self):
        from launcher import app
        calls = []
        previous = {
            app.signal.SIGINT: app.signal.SIG_IGN,
            app.signal.SIGTERM: app.signal.SIG_DFL,
        }
        with patch.object(app.signal, "signal", side_effect=lambda sig, handler: calls.append((sig, handler))):
            app._restore_signal_handlers(previous)
        self.assertEqual(calls, list(previous.items()))

    def test_s6_keyboard_interrupt_uses_common_shutdown_reason(self):
        result = self._run_app(
            wait_action=lambda controller, timeout: (_ for _ in ()).throw(KeyboardInterrupt()),
        )
        reasons = [item["session"]["reason"] for item in result["written"]]
        self.assertIn("shutdown_keyboard_interrupt", reasons)
        self.assertEqual(reasons[-1], "shutdown_complete")
        result["shutdown"].assert_called_once_with()

    def test_s7_sigint_persists_stopping_then_stopped(self):
        result = self._run_app(install_action=lambda controller: controller.request("sigint"))
        statuses = [item["session"]["status"] for item in result["written"]]
        reasons = [item["session"]["reason"] for item in result["written"]]
        self.assertEqual(statuses[-2:], ["stopping", "stopped"])
        self.assertEqual(reasons[-2:], ["shutdown_sigint", "shutdown_complete"])

    def test_s8_sigterm_uses_same_cleanup(self):
        result = self._run_app(install_action=lambda controller: controller.request("sigterm"))
        self.assertEqual(result["written"][-2]["session"]["reason"], "shutdown_sigterm")
        result["shutdown"].assert_called_once_with()

    def test_s9_sigbreak_windows_reason_is_supported(self):
        from launcher import app
        with patch.object(app.sys, "platform", "win32"), \
             patch.object(app.signal, "SIGBREAK", 21, create=True):
            supported = dict(app._supported_signal_reasons())
        self.assertEqual(supported[21], "sigbreak")
        result = self._run_app(install_action=lambda controller: controller.request("sigbreak"))
        self.assertEqual(result["written"][-2]["session"]["reason"], "shutdown_sigbreak")

    def test_s10_stop_after_cdp_prevents_backend_frontend_and_browser(self):
        holder = {}
        def install(controller): holder["controller"] = controller
        def cdp(manifest):
            holder["controller"].request("sigterm")
            return ""
        result = self._run_app(install_action=install, cdp_action=cdp)
        result["backend"].assert_not_called()
        result["frontend"].assert_not_called()
        result["browser"].assert_not_called()

    def test_s11_stop_after_backend_prevents_frontend_and_cleans_owned(self):
        holder = {}
        def install(controller): holder["controller"] = controller
        def backend(manifest):
            holder["controller"].request("sigterm")
            return True, "http://127.0.0.1:3001"
        result = self._run_app(install_action=install, backend_action=backend)
        result["frontend"].assert_not_called()
        result["shutdown"].assert_called_once_with()

    def test_s12_stop_after_frontend_prevents_browser(self):
        holder = {}
        def install(controller): holder["controller"] = controller
        def frontend(manifest, backend_port, cdp_url):
            holder["controller"].request("sigint")
            return True, "http://127.0.0.1:3000"
        result = self._run_app(install_action=install, frontend_action=frontend)
        result["browser"].assert_not_called()
        result["shutdown"].assert_called_once_with()

    def test_s13_controller_wait_delegates_to_event_without_busy_loop(self):
        from launcher import app
        controller = app._StopController()
        with patch.object(controller._event, "wait", return_value=True) as wait:
            self.assertTrue(controller.wait(0.25))
        wait.assert_called_once_with(timeout=0.25)
        source = (_PROJECT_ROOT / "launcher/app.py").read_text(encoding="utf-8")
        self.assertIn("while not controller.wait(timeout=1.0)", source)
        self.assertNotIn("while True:\n            time.sleep", source)

    def test_s14_ready_stopping_stopped_write_order(self):
        result = self._run_app()
        states = [item["session"]["status"] for item in result["written"]]
        ready_index = states.index("ready")
        self.assertEqual(states[ready_index:ready_index + 3], ["ready", "stopping", "stopped"])

    def test_s15_partial_shutdown_sets_manifest_failure(self):
        result = self._run_app(shutdown_result=_shutdown_summary(
            ok=False,
            attempted=1,
            stopped=0,
            failed=1,
        ))
        self.assertEqual(result["written"][-1]["session"]["status"], "failed")
        self.assertEqual(
            result["written"][-1]["session"]["reason"],
            "shutdown_partial_failure",
        )

    def test_s16_startup_failure_is_not_overwritten_by_stopped(self):
        result = self._run_app(backend_action=lambda manifest: (False, ""))
        reasons = [item["session"]["reason"] for item in result["written"]]
        self.assertIn("backend_failed", reasons)
        self.assertNotIn("shutdown_complete", reasons)

    def test_s17_launcher_exception_cleans_up_and_propagates(self):
        from launcher import app
        identity = _task2_identity("s17", pid=83017, fingerprint="s17-fp")
        written = []
        original = RuntimeError("boom")
        with patch.object(app, "read_manifest", return_value=None), \
             patch.object(app, "is_manifest_reusable", return_value=False), \
             patch.object(app, "create_launcher_session_identity", return_value=identity), \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": True, "state": "acquired", "reason": "lock_created",
             }), \
             patch.object(app, "_install_signal_handlers", return_value={app.signal.SIGINT: app.signal.SIG_DFL}), \
             patch.object(app, "_restore_signal_handlers") as restore, \
             patch.object(app, "write_manifest", side_effect=lambda value: written.append(copy.deepcopy(value))), \
             patch.object(app, "resolve_cdp", side_effect=original), \
             patch.object(app, "shutdown_owned", return_value=_shutdown_summary(ok=True, state="already_empty")) as shutdown, \
             patch.object(app, "remove_manifest", return_value={"removed": True, "state": "removed", "reason": "owner_removed"}) as remove, \
             patch.object(app, "release_lock", return_value={"released": True, "state": "released", "reason": "owner_removed"}) as release:
            with self.assertRaisesRegex(RuntimeError, "boom"):
                app.main()
        self.assertEqual(written[-1]["session"]["reason"], "launcher_exception")
        shutdown.assert_called_once_with()
        remove.assert_called_once_with(identity)
        release.assert_called_once_with(identity)
        restore.assert_called_once()

    def test_s18_already_exited_entry_needs_no_signal(self):
        services = self.services
        class Proc:
            pid = 84018
            def poll(self): return 0
            def send_signal(self, sig): raise AssertionError("no signal")
        proc = Proc()
        self._register(proc)
        result = services.shutdown_owned()
        self.assertTrue(result["ok"])
        self.assertEqual(result["entries"][0]["state"], "already_exited")
        self.assertFalse(services._owned_entries)

    def test_s19_graceful_shutdown_avoids_force_kill(self):
        services = self.services
        class Proc:
            pid = 84019
            def poll(self): return None
            def terminate(self): pass
            def wait(self, timeout=None): return 0
        proc = Proc()
        self._register(proc)
        with patch.object(services, "_force_kill_tree") as force:
            result = services.shutdown_owned()
        self.assertEqual(result["entries"][0]["state"], "stopped_gracefully")
        force.assert_not_called()
        self.assertFalse(services._owned_entries)

    def test_s20_windows_timeout_escalates_exact_owned_pid(self):
        services = self.services
        calls = []
        class Proc:
            pid = 84020
            def __init__(self): self.waits = 0
            def poll(self): return None
            def send_signal(self, sig): calls.append(("signal", sig))
            def wait(self, timeout=None):
                self.waits += 1
                if self.waits == 1:
                    raise subprocess.TimeoutExpired("proc", timeout)
                return 0
        proc = Proc()
        self._register(proc)
        completed = type("Completed", (), {"returncode": 0})()
        with patch.object(services.sys, "platform", "win32"), \
             patch.object(services.signal, "CTRL_BREAK_EVENT", 123, create=True), \
             patch.object(services.subprocess, "run", return_value=completed) as run:
            result = services.shutdown_owned()
        self.assertEqual(result["entries"][0]["state"], "force_killed")
        self.assertEqual(run.call_args.args[0], ["taskkill", "/PID", "84020", "/T", "/F"])
        self.assertEqual(calls, [("signal", 123)])

    def test_s21_taskkill_nonzero_is_partial_failure_and_retained(self):
        services = self.services
        class Proc:
            pid = 84021
            def poll(self): return None
            def send_signal(self, sig): pass
            def wait(self, timeout=None): raise subprocess.TimeoutExpired("proc", timeout)
        proc = Proc()
        entry = self._register(proc)
        completed = type("Completed", (), {"returncode": 1})()
        with patch.object(services.sys, "platform", "win32"), \
             patch.object(services.signal, "CTRL_BREAK_EVENT", 123, create=True), \
             patch.object(services.subprocess, "run", return_value=completed):
            result = services.shutdown_owned()
        self.assertEqual(result["state"], "partial_failure")
        self.assertEqual(result["entries"][0]["reason"], "taskkill_nonzero_exit")
        self.assertIn(entry, services._owned_entries)

    def test_s22_unconfirmed_taskkill_does_not_remove_entry(self):
        services = self.services
        class Proc:
            pid = 84022
            def poll(self): return None
            def send_signal(self, sig): pass
            def wait(self, timeout=None): raise subprocess.TimeoutExpired("proc", timeout)
        proc = Proc()
        entry = self._register(proc)
        completed = type("Completed", (), {"returncode": 0})()
        with patch.object(services.sys, "platform", "win32"), \
             patch.object(services.signal, "CTRL_BREAK_EVENT", 123, create=True), \
             patch.object(services.subprocess, "run", return_value=completed):
            result = services.shutdown_owned()
        self.assertEqual(result["state"], "partial_failure")
        self.assertIn("not_confirmed", result["entries"][0]["reason"])
        self.assertIn(entry, services._owned_entries)

    def test_s23_unregistered_entry_cannot_be_force_killed(self):
        services = self.services
        class Proc:
            pid = 84023
            def poll(self): return None
            def kill(self): raise AssertionError("no kill")
        entry = {"role": "backend", "proc": Proc(), "pid": 84023, "started_at": time.time()}
        with patch.object(services.subprocess, "run") as run, \
             patch.object(services.os, "killpg", create=True) as killpg:
            result = services._force_kill_tree(entry)
        self.assertEqual(result["state"], "not_registered")
        run.assert_not_called()
        killpg.assert_not_called()

    def test_s24_first_entry_error_does_not_block_second(self):
        services = self.services
        class Proc:
            def __init__(self, pid): self.pid = pid
        first = self._register(Proc(84024), "backend")
        second = self._register(Proc(84025), "frontend")
        success = services._entry_result(second, state="already_exited", reason="done")
        with patch.object(services, "_stop_owned_entry", side_effect=[RuntimeError("first"), success]) as stop:
            result = services.shutdown_owned()
        self.assertEqual(stop.call_count, 2)
        self.assertEqual(result["attempted"], 2)
        self.assertEqual(result["state"], "partial_failure")
        self.assertEqual(result["entries"][1]["pid"], second["pid"])
        self.assertIn(first, services._owned_entries)

    def test_s25_wait_error_is_structured_and_global_loop_survives(self):
        services = self.services
        class Proc:
            pid = 84026
            def poll(self): return None
            def terminate(self): pass
            def wait(self, timeout=None): raise RuntimeError("wait error")
            def kill(self): raise RuntimeError("kill error")
        self._register(Proc())
        result = services.shutdown_owned()
        self.assertFalse(result["ok"])
        self.assertEqual(result["entries"][0]["state"], "failed")

    def test_s26_failed_entry_remains_and_second_call_retries_it(self):
        services = self.services
        class Proc:
            pid = 84027
            def __init__(self): self.succeed = False
            def poll(self): return None
            def terminate(self): pass
            def wait(self, timeout=None):
                if self.succeed:
                    return 0
                raise subprocess.TimeoutExpired("proc", timeout)
            def kill(self): raise RuntimeError("cannot kill")
        proc = Proc()
        entry = self._register(proc)
        first = services.shutdown_owned()
        self.assertEqual(first["state"], "partial_failure")
        self.assertIn(entry, services._owned_entries)
        proc.succeed = True
        second = services.shutdown_owned()
        self.assertEqual(second["state"], "completed")
        self.assertFalse(services._owned_entries)

    def test_s27_second_call_after_success_is_already_empty(self):
        services = self.services
        class Proc:
            pid = 84028
            def poll(self): return 0
        self._register(Proc())
        self.assertEqual(services.shutdown_owned()["state"], "completed")
        second = services.shutdown_owned()
        self.assertEqual(second, {
            "ok": True,
            "state": "already_empty",
            "attempted": 0,
            "stopped": 0,
            "failed": 0,
            "entries": [],
        })

    def test_s28_reused_backend_is_never_signalled(self):
        services = self.services
        manifest = _new_runtime_manifest("s28")
        manifest["services"]["backend"]["ownership"] = "reused"
        class Reused:
            pid = 84029
            def send_signal(self, sig): raise AssertionError("reused signalled")
        reused = Reused()
        self.assertNotIn(reused, [entry.get("proc") for entry in services._owned_entries])
        self.assertEqual(services.shutdown_owned()["state"], "already_empty")

    def test_s29_cdp_external_or_reused_is_never_in_shutdown(self):
        services = self.services
        class CdpProc:
            pid = 84029
            def poll(self): return None
            def send_signal(self, sig): raise AssertionError("CDP signalled")
            def kill(self): raise AssertionError("CDP killed")
        for ownership in ("external", "reused"):
            manifest = _new_runtime_manifest(f"s29-{ownership}")
            manifest["services"]["cdp"]["ownership"] = ownership
            entry = {
                "role": "cdp",
                "proc": CdpProc(),
                "pid": 84029,
                "started_at": time.time(),
            }
            services._owned_entries.append(entry)
            result = services.shutdown_owned()
            self.assertEqual(result["entries"][0]["state"], "not_registered")
            self.assertEqual(result["entries"][0]["reason"], "invalid_owned_role")
            self.assertIn(entry, services._owned_entries)
            services._owned_entries.clear()

    def test_s30_terminate_and_remove_uses_same_safe_path(self):
        services = self.services
        class Proc:
            pid = 84030
            def poll(self): return None
            def terminate(self): pass
            def wait(self, timeout=None): return 0
        proc = Proc()
        self._register(proc)
        result = services._terminate_and_remove(proc)
        self.assertEqual(result["state"], "stopped_gracefully")
        self.assertFalse(services._owned_entries)
        other = Proc()
        other.pid = 84031
        self.assertEqual(services._terminate_and_remove(other)["state"], "not_registered")

    def test_s31_cleanup_keeps_manifest_and_lock_owner_identity(self):
        result = self._run_app()
        result["remove"].assert_called_once_with(result["identity"])
        result["release"].assert_called_once_with(result["identity"])

    def test_s32_no_shutdown_path_uses_ports_for_kill(self):
        source = (_PROJECT_ROOT / "launcher/services.py").read_text(encoding="utf-8")
        self.assertNotIn("netstat", source.lower())
        self.assertNotIn("Stop-Process", source)
        self.assertNotIn("kill_listening_port", source)
        self.assertIn('["taskkill", "/PID", str(entry["pid"]), "/T", "/F"]', source)

    def test_s33_prompt1_and_prompt2_regressions_remain_present(self):
        t_names = {name for name in dir(TestLauncherAtomicSessionLock) if name.startswith("test_t")}
        for number in range(1, 18):
            self.assertTrue(any(name.startswith(f"test_t{number}_") for name in t_names))
        self.assertTrue(hasattr(TestCanonicalRuntimeManifest, "test_m1b_manifest_requires_existing_session_identity"))
        for number in range(1, 28):
            self.assertTrue(any(
                name.startswith(f"test_m{number}_")
                for name in dir(TestCanonicalRuntimeManifest)
            ), f"M{number}")

    def test_s34_acquired_session_enters_cleanup_try_immediately(self):
        source = (_PROJECT_ROOT / "launcher/app.py").read_text(encoding="utf-8")
        module = ast.parse(source)
        main_node = next(
            node
            for node in module.body
            if isinstance(node, ast.FunctionDef) and node.name == "main"
        )

        lock_index = next(
            index
            for index, statement in enumerate(main_node.body)
            if isinstance(statement, ast.Assign)
            and any(
                isinstance(target, ast.Name) and target.id == "lock_result"
                for target in statement.targets
            )
        )
        guard = main_node.body[lock_index + 1]
        self.assertIsInstance(guard, ast.If)
        self.assertIsInstance(guard.test, ast.UnaryOp)
        self.assertIsInstance(guard.test.op, ast.Not)
        self.assertIsInstance(guard.test.operand, ast.Call)
        self.assertIsInstance(guard.test.operand.func, ast.Attribute)
        self.assertEqual(guard.test.operand.func.attr, "get")
        self.assertIsInstance(guard.test.operand.func.value, ast.Name)
        self.assertEqual(guard.test.operand.func.value.id, "lock_result")
        self.assertTrue(any(isinstance(node, ast.Return) for node in guard.body))
        self.assertIsInstance(main_node.body[lock_index + 2], ast.Try)

        prepared = set()
        for statement in main_node.body[:lock_index]:
            if isinstance(statement, ast.Assign):
                for target in statement.targets:
                    if isinstance(target, ast.Name):
                        prepared.add(target.id)
            elif isinstance(statement, ast.AnnAssign) and isinstance(statement.target, ast.Name):
                prepared.add(statement.target.id)
        self.assertTrue({
            "controller",
            "manifest",
            "installed_handlers",
            "preserve_failure_state",
        }.issubset(prepared))

    def test_s35_reentrant_stop_request_does_not_deadlock(self):
        from launcher import app

        controller = app._StopController()
        observed = {}

        class ReentrantEvent(threading.Event):
            def set(self):
                observed["second"] = controller.request("sigterm")
                super().set()

        controller._event = ReentrantEvent()

        def first_request():
            observed["first"] = controller.request("sigint")

        worker = threading.Thread(target=first_request, daemon=True)
        worker.start()
        worker.join(timeout=0.5)

        self.assertFalse(worker.is_alive(), "reentrant request deadlocked")
        self.assertTrue(observed.get("first"))
        self.assertIs(observed.get("second"), False)
        self.assertEqual(controller.reason, "sigint")
        self.assertTrue(controller.requested)


# ===========================================================================
# Task 2 Prompt 4 — verifiable Vite frontend identity and safe reuse
# ===========================================================================


def _run_vite_identity_fixture(assertions: str):
    vite_config = (_PROJECT_ROOT / "frontend/vite.config.js").read_text(
        encoding="utf-8"
    )
    _run_node_module_test({
        "frontend/vite.config.js": vite_config,
        "node_modules/vite/package.json": json.dumps({
            "name": "vite",
            "type": "module",
            "exports": "./index.js",
        }),
        "node_modules/vite/index.js": (
            "export function defineConfig(value) { return value; }\n"
        ),
        "node_modules/@vitejs/plugin-react/package.json": json.dumps({
            "name": "@vitejs/plugin-react",
            "type": "module",
            "exports": "./index.js",
        }),
        "node_modules/@vitejs/plugin-react/index.js": (
            "export default function react() { return { name: 'react' }; }\n"
        ),
    }, f"""
        import assert from 'node:assert/strict';

        process.env.VITE_FRONTEND_PORT = '3100';
        process.env.VITE_BACKEND_TARGET = 'http://127.0.0.1:4100/';
        process.env.VITE_CDP_URL = 'http://127.0.0.1:9222';
        process.env.BETFAIR_TOKEN = 'forbidden';

        const module = await import('./frontend/vite.config.js');
        const config = module.default({{ mode: 'test' }});
        const plugin = config.plugins.find(
          (candidate) => candidate.name === 'tennis-decision-ui-launcher-identity'
        );
        assert.ok(plugin);

        let middleware = null;
        plugin.configureServer({{
          middlewares: {{ use(fn) {{ middleware = fn; }} }}
        }});
        assert.equal(typeof middleware, 'function');

        function invoke(url, method = 'GET') {{
          return new Promise((resolve, reject) => {{
            const headers = {{}};
            let settled = false;
            const finish = (value) => {{
              if (!settled) {{
                settled = true;
                resolve(value);
              }}
            }};
            const response = {{
              statusCode: 0,
              setHeader(name, value) {{ headers[name.toLowerCase()] = value; }},
              end(body = '') {{
                finish({{
                  statusCode: this.statusCode,
                  headers,
                  body: String(body ?? ''),
                  nextCalled: false,
                }});
              }},
            }};
            try {{
              middleware({{ url, method }}, response, () => finish({{
                statusCode: response.statusCode,
                headers,
                body: '',
                nextCalled: true,
              }}));
            }} catch (error) {{
              reject(error);
            }}
          }});
        }}

        {assertions}
    """)


class TestFrontendRuntimeIdentity(unittest.TestCase):

    def setUp(self):
        from launcher import services
        self.services = services
        self.original_owned = list(services._owned_entries)
        services._owned_entries.clear()

    def tearDown(self):
        self.services._owned_entries.clear()
        self.services._owned_entries.extend(self.original_owned)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for Vite identity fixtures")
    def test_v1_vite_endpoint_returns_complete_payload(self):
        _run_vite_identity_fixture("""
            const result = await invoke('/__launcher/health');
            assert.equal(result.statusCode, 200);
            const payload = JSON.parse(result.body);
            assert.deepEqual(Object.keys(payload).sort(), [
              'backendTarget', 'frontendPort', 'instanceId', 'ok',
              'pid', 'project', 'service', 'startedAt'
            ]);
            assert.equal(payload.ok, true);
            assert.equal(payload.project, 'tennis-decision-ui');
            assert.equal(payload.service, 'frontend');
            assert.equal(typeof payload.instanceId, 'string');
            assert.ok(payload.instanceId.length > 0);
            assert.equal(payload.pid, process.pid);
            assert.ok(!Number.isNaN(Date.parse(payload.startedAt)));
            assert.equal(payload.frontendPort, 3100);
            assert.equal(payload.backendTarget, 'http://127.0.0.1:4100');
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for Vite identity fixtures")
    def test_v2_vite_identity_is_stable_between_requests(self):
        _run_vite_identity_fixture("""
            const first = JSON.parse((await invoke('/__launcher/health')).body);
            const second = JSON.parse((await invoke('/__launcher/health')).body);
            assert.deepEqual(second, first);
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for Vite identity fixtures")
    def test_v3_query_string_keeps_same_identity(self):
        _run_vite_identity_fixture("""
            const first = JSON.parse((await invoke('/__launcher/health')).body);
            const queried = JSON.parse((await invoke('/__launcher/health?probe=1')).body);
            assert.deepEqual(queried, first);
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for Vite identity fixtures")
    def test_v4_foreign_paths_call_next(self):
        _run_vite_identity_fixture("""
            const result = await invoke('/other');
            assert.equal(result.nextCalled, true);
            assert.equal(result.body, '');
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for Vite identity fixtures")
    def test_v5_non_get_identity_method_returns_405(self):
        _run_vite_identity_fixture("""
            const result = await invoke('/__launcher/health', 'POST');
            assert.equal(result.statusCode, 405);
            assert.equal(result.headers.allow, 'GET');
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for Vite identity fixtures")
    def test_v6_identity_headers_disable_cache(self):
        _run_vite_identity_fixture("""
            const result = await invoke('/__launcher/health');
            assert.ok(result.headers['content-type'].startsWith('application/json'));
            assert.equal(result.headers['cache-control'], 'no-store');
        """)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for Vite identity fixtures")
    def test_v7_identity_payload_excludes_forbidden_data(self):
        _run_vite_identity_fixture("""
            const payload = JSON.parse((await invoke('/__launcher/health')).body);
            const forbidden = [
              'cdp', 'profile', 'betfair', 'sofa', 'cookie', 'token',
              'env', 'command', 'cwd'
            ];
            for (const key of Object.keys(payload)) {
              const lower = key.toLowerCase();
              assert.equal(forbidden.some((item) => lower.includes(item)), false);
            }
            assert.equal('VITE_CDP_URL' in payload, false);
            assert.equal('BETFAIR_TOKEN' in payload, false);
        """)

    def test_v8_python_frontend_identity_probe_accepts_complete_identity(self):
        from launcher import system
        data = _frontend_identity(3000, 3001, instance_id="v8", pid=88008)
        with patch.object(system, "check_http_health", return_value=(True, data)) as probe:
            ok, identity = system.check_frontend_identity(
                "http://127.0.0.1:3000/",
                expected_backend_target="http://127.0.0.1:3001/",
                expected_pid=88008,
            )
        self.assertTrue(ok)
        self.assertEqual(identity["instanceId"], "v8")
        self.assertEqual(identity["backendTarget"], "http://127.0.0.1:3001")
        probe.assert_called_once_with(
            "http://127.0.0.1:3000/__launcher/health",
            timeout=2.0,
        )

    def test_v9_generic_http_server_is_rejected(self):
        from launcher import system
        for value in ("<html>ok</html>", {"ok": True}):
            with self.subTest(value=value), patch.object(
                system,
                "check_http_health",
                return_value=(True, value),
            ):
                self.assertEqual(
                    system.check_frontend_identity("http://127.0.0.1:3000"),
                    (False, {}),
                )

    def test_v10_wrong_project_or_service_is_rejected(self):
        from launcher.system import validate_frontend_identity
        for field, value in (("project", "other"), ("service", "backend")):
            identity = _frontend_identity(3000, 3001)
            identity[field] = value
            with self.subTest(field=field):
                self.assertFalse(validate_frontend_identity(
                    identity,
                    "http://127.0.0.1:3000",
                ))

    def test_v11_missing_identity_fields_are_rejected(self):
        from launcher.system import validate_frontend_identity
        for field in ("instanceId", "pid", "startedAt", "frontendPort", "backendTarget"):
            identity = _frontend_identity(3000, 3001)
            del identity[field]
            with self.subTest(field=field):
                self.assertFalse(validate_frontend_identity(
                    identity,
                    "http://127.0.0.1:3000",
                ))

    def test_v12_invalid_identity_types_are_rejected(self):
        from launcher.system import validate_frontend_identity
        invalid = (
            ("pid", True),
            ("pid", 0),
            ("frontendPort", True),
            ("frontendPort", 0),
            ("instanceId", ""),
            ("startedAt", ""),
        )
        for field, value in invalid:
            identity = _frontend_identity(3000, 3001)
            identity[field] = value
            with self.subTest(field=field, value=value):
                self.assertFalse(validate_frontend_identity(
                    identity,
                    "http://127.0.0.1:3000",
                ))

    def test_v13_declared_frontend_port_must_match_url(self):
        from launcher.system import validate_frontend_identity
        identity = _frontend_identity(3001, 3002)
        self.assertFalse(validate_frontend_identity(
            identity,
            "http://127.0.0.1:3000",
        ))

    def test_v14_expected_backend_target_must_match(self):
        from launcher.system import validate_frontend_identity
        identity = _frontend_identity(3000, 3002)
        self.assertFalse(validate_frontend_identity(
            identity,
            "http://127.0.0.1:3000",
            expected_backend_target="http://127.0.0.1:3001",
        ))

    def test_v15_preferred_frontend_is_reused_without_ownership(self):
        services = self.services
        manifest = _new_runtime_manifest("v15")
        identity = _frontend_identity(3000, 3001, instance_id="v15", pid=8815)
        with patch.object(services, "is_port_free", side_effect=lambda port: port != 3000), \
             patch.object(services, "check_frontend_identity", return_value=(True, identity)), \
             patch.object(services, "_start_vite_frontend") as start:
            ok, url = services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        self.assertEqual(url, "http://127.0.0.1:3000")
        frontend = manifest["services"]["frontend"]
        self.assertEqual(frontend["ownership"], "reused")
        self.assertEqual(frontend["instanceId"], "v15")
        self.assertEqual(frontend["pid"], 8815)
        self.assertFalse(services._owned_entries)
        start.assert_not_called()

    def test_v16_fallback_frontend_is_reused_after_foreign_preferred(self):
        services = self.services
        manifest = _new_runtime_manifest("v16")
        valid = _frontend_identity(3002, 3001, instance_id="v16", pid=8816)

        def free(port):
            return port not in {3000, 3002}

        def probe(url, **kwargs):
            if url.endswith(":3002") and kwargs.get("expected_backend_target"):
                return True, valid
            return False, {}

        with patch.object(services, "is_port_free", side_effect=free), \
             patch.object(services, "check_frontend_identity", side_effect=probe), \
             patch.object(services, "_start_vite_frontend") as start:
            ok, url = services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        self.assertEqual(url, "http://127.0.0.1:3002")
        self.assertEqual(
            manifest["services"]["frontend"]["reason"],
            "reused_fallback_port",
        )
        start.assert_not_called()

    def test_v17_wrong_backend_frontend_is_skipped_without_termination(self):
        services = self.services
        manifest = _new_runtime_manifest("v17")
        wrong = _frontend_identity(3000, 3999, instance_id="wrong", pid=8817)
        correct = _frontend_identity(3002, 3001, instance_id="correct", pid=8818)

        def probe(url, **kwargs):
            expected = kwargs.get("expected_backend_target")
            if url.endswith(":3000"):
                return ((False, {}) if expected else (True, wrong))
            if url.endswith(":3002") and expected:
                return True, correct
            return False, {}

        with patch.object(services, "is_port_free", side_effect=lambda port: port not in {3000, 3002}), \
             patch.object(services, "check_frontend_identity", side_effect=probe), \
             patch.object(services, "_terminate_and_remove") as terminate:
            ok, url = services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        self.assertEqual(url, "http://127.0.0.1:3002")
        terminate.assert_not_called()
        self.assertFalse(services._owned_entries)

    def test_v18_generic_server_is_skipped_without_ownership(self):
        services = self.services
        manifest = _new_runtime_manifest("v18")
        correct = _frontend_identity(3002, 3001, instance_id="v18", pid=8818)

        def probe(url, **kwargs):
            if url.endswith(":3002") and kwargs.get("expected_backend_target"):
                return True, correct
            return False, {}

        with patch.object(services, "is_port_free", side_effect=lambda port: port not in {3000, 3002}), \
             patch.object(services, "check_frontend_identity", side_effect=probe), \
             patch.object(services, "_terminate_and_remove") as terminate:
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        terminate.assert_not_called()
        self.assertFalse(services._owned_entries)

    def test_v19_reuse_succeeds_without_local_vite_cli(self):
        services = self.services
        manifest = _new_runtime_manifest("v19")
        identity = _frontend_identity(3000, 3001, instance_id="v19", pid=8819)
        with patch.object(services, "is_port_free", side_effect=lambda port: port != 3000), \
             patch.object(services, "check_frontend_identity", return_value=(True, identity)), \
             patch.object(services, "_vite_cli_path", side_effect=AssertionError("CLI inspected")), \
             patch.object(services, "_start_vite_frontend") as start:
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        start.assert_not_called()

    def _run_owned_frontend(self, identity, *, wait_ok=True):
        services = self.services
        manifest = _new_runtime_manifest(identity["instanceId"])

        class Proc:
            pid = identity["pid"]
            def poll(self): return None
            def wait(self, timeout=None): return 0
            def terminate(self): pass
            def send_signal(self, signal_value): pass

        proc = Proc()

        def start(port, backend_port, cdp_url):
            services._register_owned_proc(proc, "frontend")
            return proc

        def wait(url, prefix, timeout, validator=None):
            accepted = validator(identity) if validator else True
            return (wait_ok and accepted), (identity if wait_ok and accepted else "invalid")

        patches = (
            patch.object(services, "is_port_free", return_value=True),
            patch.object(services, "_start_vite_frontend", side_effect=start),
            patch.object(services, "wait_for_service", side_effect=wait),
        )
        return manifest, proc, patches

    def test_v20_new_vite_waits_on_identity_endpoint(self):
        identity = _frontend_identity(3000, 3001, instance_id="v20", pid=8820)
        manifest, _, patches = self._run_owned_frontend(identity)
        with patches[0], patches[1], patches[2] as wait:
            ok, _ = self.services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        self.assertEqual(
            wait.call_args.args[0],
            "http://127.0.0.1:3000/__launcher/health",
        )
        self.assertTrue(callable(wait.call_args.kwargs["validator"]))

    def test_v21_new_vite_records_verified_identity(self):
        identity = _frontend_identity(3000, 3001, instance_id="v21", pid=8821)
        manifest, proc, patches = self._run_owned_frontend(identity)
        with patches[0], patches[1], patches[2]:
            ok, _ = self.services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        frontend = manifest["services"]["frontend"]
        self.assertEqual(frontend["ownership"], "owned")
        self.assertEqual(frontend["pid"], proc.pid)
        self.assertEqual(frontend["instanceId"], "v21")
        self.assertEqual(frontend["startedAt"], identity["startedAt"])
        self.assertEqual(frontend["backendTarget"], "http://127.0.0.1:3001")

    def _assert_owned_identity_rejected(self, identity):
        services = self.services
        manifest = _new_runtime_manifest("invalid-owned")

        class Proc:
            pid = 8822
            def poll(self): return None

        proc = Proc()
        def start(port, backend_port, cdp_url):
            services._register_owned_proc(proc, "frontend")
            return proc
        def free(port):
            return port == 3000
        def wait(url, prefix, timeout, validator=None):
            return validator(identity), identity

        with patch.object(services, "is_port_free", side_effect=free), \
             patch.object(services, "check_frontend_identity", return_value=(False, {})), \
             patch.object(services, "_start_vite_frontend", side_effect=start), \
             patch.object(services, "wait_for_service", side_effect=wait), \
             patch.object(services, "_terminate_and_remove", return_value={"state": "failed"}) as terminate:
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertFalse(ok)
        terminate.assert_called_once_with(proc)
        frontend = manifest["services"]["frontend"]
        self.assertIsNone(frontend["instanceId"])
        self.assertIsNone(frontend["startedAt"])
        self.assertIsNone(frontend["pid"])
        self.assertIsNone(frontend["url"])

    def test_v22_new_vite_pid_mismatch_is_cleaned(self):
        identity = _frontend_identity(3000, 3001, pid=8823)
        self._assert_owned_identity_rejected(identity)

    def test_v23_new_vite_port_mismatch_is_cleaned(self):
        identity = _frontend_identity(3002, 3001, pid=8822)
        self._assert_owned_identity_rejected(identity)

    def test_v24_new_vite_backend_target_mismatch_is_cleaned(self):
        identity = _frontend_identity(3000, 3999, pid=8822)
        self._assert_owned_identity_rejected(identity)

    def test_v25_missing_identity_endpoint_is_not_readiness(self):
        identity = {"ok": True}
        self._assert_owned_identity_rejected(identity)

    def test_v26_ready_manifest_requires_complete_frontend_identity(self):
        from launcher import session
        for field in ("instanceId", "startedAt", "backendTarget"):
            manifest = _ready_runtime_manifest(3001, 3000)
            manifest["services"]["frontend"][field] = None
            with self.subTest(field=field):
                self.assertFalse(session.validate_manifest_schema(manifest)["valid"])

    def test_v27_frontend_failure_clears_identity_fields(self):
        from launcher import session
        manifest = _ready_runtime_manifest(3001, 3000)
        session.manifest_set_frontend(
            manifest,
            status="failed",
            ownership="owned",
            selected_port=3000,
            pid=54321,
            url="http://127.0.0.1:3000",
            instance_id="old",
            started_at="2026-01-01T00:00:00Z",
            backend_target="http://127.0.0.1:3001",
            source="launcher",
            reason="max_attempts",
        )
        frontend = manifest["services"]["frontend"]
        for field in ("instanceId", "startedAt", "pid", "url", "selectedPort"):
            self.assertIsNone(frontend[field])
        self.assertEqual(frontend["ownership"], "unknown")

    def _session_reuse_result(self, mutate=None, frontend_ok=True):
        from launcher import session
        manifest = _ready_runtime_manifest(
            3001,
            3000,
            backend_pid=89001,
            backend_instance="backend-reuse",
            frontend_pid=89002,
            frontend_instance="frontend-reuse",
            frontend_ownership="reused",
            launcher_pid=999999999,
        )
        if mutate:
            mutate(manifest)
        backend_data = {
            "ok": True,
            "project": "tennis-decision-ui",
            "instanceId": "backend-reuse",
            "pid": 89001,
        }
        frontend_data = _frontend_identity(
            manifest["services"]["frontend"].get("selectedPort") or 3000,
            3001,
            instance_id="frontend-reuse",
            pid=89002,
        )
        with patch.object(session, "check_backend_identity", return_value=(True, backend_data)), \
             patch.object(
                 session,
                 "check_frontend_identity",
                 return_value=((True, frontend_data) if frontend_ok else (False, {})),
             ):
            return session.is_manifest_reusable(manifest)

    def test_v28_session_reuse_accepts_coherent_frontend_identity(self):
        self.assertTrue(self._session_reuse_result())

    def test_v29_session_reuse_rejects_frontend_instance_mismatch(self):
        self.assertFalse(self._session_reuse_result(
            lambda manifest: manifest["services"]["frontend"].update(
                instanceId="different"
            )
        ))

    def test_v30_session_reuse_rejects_frontend_pid_mismatch(self):
        self.assertFalse(self._session_reuse_result(
            lambda manifest: manifest["services"]["frontend"].update(pid=89003)
        ))

    def test_v31_session_reuse_rejects_backend_target_mismatch(self):
        self.assertFalse(self._session_reuse_result(
            lambda manifest: manifest["services"]["frontend"].update(
                backendTarget="http://127.0.0.1:3999"
            )
        ))

    def test_v32_session_reuse_rejects_frontend_port_mismatch(self):
        self.assertFalse(self._session_reuse_result(
            lambda manifest: manifest["services"]["frontend"].update(
                selectedPort=3002
            )
        ))

    def test_v33_session_reuse_rejects_generic_frontend(self):
        self.assertFalse(self._session_reuse_result(frontend_ok=False))

    def test_v34_dead_previous_launcher_does_not_block_valid_reuse(self):
        self.assertTrue(self._session_reuse_result())

    def test_v35_reused_frontend_is_never_shutdown_owned(self):
        services = self.services
        manifest = _new_runtime_manifest("v35")
        identity = _frontend_identity(3000, 3001, instance_id="v35", pid=8935)
        with patch.object(services, "is_port_free", side_effect=lambda port: port != 3000), \
             patch.object(services, "check_frontend_identity", return_value=(True, identity)):
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertTrue(ok)
        self.assertEqual(manifest["services"]["frontend"]["pid"], 8935)
        self.assertFalse(services._owned_entries)
        self.assertEqual(services.shutdown_owned()["state"], "already_empty")

    def test_v36_backend_port_is_excluded_from_frontend_candidates(self):
        services = self.services
        manifest = _new_runtime_manifest("v36")
        seen = []
        identity = _frontend_identity(3001, 3000, instance_id="v36", pid=8936)
        def free(port):
            seen.append(port)
            return port != 3001
        with patch.object(services, "is_port_free", side_effect=free), \
             patch.object(services, "check_frontend_identity", return_value=(True, identity)), \
             patch.object(services, "_start_vite_frontend") as start:
            ok, url = services.resolve_frontend(manifest, 3000, "")
        self.assertTrue(ok)
        self.assertEqual(url, "http://127.0.0.1:3001")
        self.assertNotIn(3000, seen)
        start.assert_not_called()

    def test_v37_owned_vite_process_count_is_bounded_to_five(self):
        services = self.services
        manifest = _new_runtime_manifest("v37")
        started = []

        class Proc:
            def __init__(self, pid): self.pid = pid
            def poll(self): return None

        def start(port, backend_port, cdp_url):
            proc = Proc(90000 + len(started))
            started.append((port, proc))
            services._register_owned_proc(proc, "frontend")
            return proc

        with patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_vite_frontend", side_effect=start), \
             patch.object(services, "wait_for_service", return_value=(False, "invalid")), \
             patch.object(services, "_terminate_and_remove", return_value={"state": "failed"}):
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertFalse(ok)
        self.assertEqual(len(started), services._MAX_PORT_ATTEMPTS)
        self.assertEqual(len({port for port, _ in started}), len(started))

    def test_v38_discovery_never_kills_external_processes(self):
        services = self.services
        manifest = _new_runtime_manifest("v38")
        with patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "check_frontend_identity", return_value=(False, {})), \
             patch.object(services, "_terminate_and_remove") as terminate, \
             patch.object(services, "_force_kill_tree") as force, \
             patch.object(services.subprocess, "run") as run, \
             patch.object(services.os, "killpg", create=True) as killpg:
            ok, _ = services.resolve_frontend(manifest, 3001, "")
        self.assertFalse(ok)
        terminate.assert_not_called()
        force.assert_not_called()
        run.assert_not_called()
        killpg.assert_not_called()
        self.assertFalse(services._owned_entries)

    def test_v39_prompt1_prompt2_prompt3_regressions_remain_present(self):
        self.assertTrue(hasattr(
            TestSignalAndIdempotentShutdown,
            "test_s35_reentrant_stop_request_does_not_deadlock",
        ))
        self.assertTrue(hasattr(
            TestCanonicalRuntimeManifest,
            "test_m1b_manifest_requires_existing_session_identity",
        ))
        for number in range(1, 18):
            self.assertTrue(any(
                name.startswith(f"test_t{number}_")
                for name in dir(TestLauncherAtomicSessionLock)
            ))
        source = (_PROJECT_ROOT / "launcher/app.py").read_text(encoding="utf-8")
        self.assertIn("class _StopController", source)


# ===========================================================================
# Task 2 Prompt 5 — deterministic CDP discovery and Chrome helper
# ===========================================================================


class TestDeterministicCDPDiscovery(unittest.TestCase):

    def setUp(self):
        from launcher import services
        self.services = services
        self.original_owned = list(services._owned_entries)
        services._owned_entries.clear()

    def tearDown(self):
        self.services._owned_entries.clear()
        self.services._owned_entries.extend(self.original_owned)

    @staticmethod
    def _helper_result(state, port=9222):
        mapping = {
            "already_ready": (True, 0),
            "launch_requested": (True, 0),
            "port_occupied": (False, 2),
            "chrome_not_found": (False, 3),
            "launch_failed": (False, 4),
            "input_invalid": (False, 5),
            "helper_timeout": (False, None),
            "helper_invalid_response": (False, None),
            "helper_spawn_failed": (False, None),
        }
        ok, return_code = mapping[state]
        return {
            "ok": ok,
            "state": state,
            "port": port,
            "returnCode": return_code,
        }

    @staticmethod
    def _completed(payload, return_code):
        return subprocess.CompletedProcess(
            args=["powershell.exe"],
            returncode=return_code,
            stdout=json.dumps(payload),
            stderr="",
        )

    def test_cd1_validate_cdp_version_accepts_ipv4_browser_endpoint(self):
        from launcher.system import validate_cdp_version
        data = {
            "webSocketDebuggerUrl": (
                "ws://127.0.0.1:9222/devtools/browser/abc"
            )
        }
        self.assertTrue(validate_cdp_version(data, 9222))

    def test_cd2_validate_cdp_version_accepts_localhost(self):
        from launcher.system import validate_cdp_version
        data = {
            "webSocketDebuggerUrl": (
                "ws://localhost:9222/devtools/browser/abc"
            )
        }
        self.assertTrue(validate_cdp_version(data, 9222))

    def test_cd3_validate_cdp_version_rejects_wrong_schema(self):
        from launcher.system import validate_cdp_version
        for value in (
            "http://127.0.0.1:9222/devtools/browser/abc",
            "not-a-url",
        ):
            with self.subTest(value=value):
                self.assertFalse(validate_cdp_version(
                    {"webSocketDebuggerUrl": value},
                    9222,
                ))

    def test_cd4_validate_cdp_version_rejects_remote_host(self):
        from launcher.system import validate_cdp_version
        self.assertFalse(validate_cdp_version({
            "webSocketDebuggerUrl": (
                "ws://example.com:9222/devtools/browser/abc"
            )
        }, 9222))

    def test_cd5_validate_cdp_version_rejects_wrong_port(self):
        from launcher.system import validate_cdp_version
        self.assertFalse(validate_cdp_version({
            "webSocketDebuggerUrl": (
                "ws://127.0.0.1:9999/devtools/browser/abc"
            )
        }, 9222))
        self.assertFalse(validate_cdp_version({
            "webSocketDebuggerUrl": (
                "ws://127.0.0.1:9222/devtools/browser/abc"
            )
        }, True))

    def test_cd6_validate_cdp_version_rejects_page_path(self):
        from launcher.system import validate_cdp_version
        self.assertFalse(validate_cdp_version({
            "webSocketDebuggerUrl": (
                "ws://127.0.0.1:9222/devtools/page/abc"
            )
        }, 9222))

    def test_cd7_validate_cdp_version_rejects_empty_browser_id(self):
        from launcher.system import validate_cdp_version
        self.assertFalse(validate_cdp_version({
            "webSocketDebuggerUrl": (
                "ws://127.0.0.1:9222/devtools/browser/"
            )
        }, 9222))

    def test_cd8_check_cdp_endpoint_rejects_foreign_bodies(self):
        from launcher import system
        for body in (
            "<html></html>",
            [],
            "plain text",
            {"ok": True},
        ):
            with self.subTest(body=body), patch.object(
                system,
                "check_http_health",
                return_value=(True, body),
            ):
                self.assertEqual(system.check_cdp_endpoint(9222), (False, {}))

    def test_cd9_preferred_cdp_is_reused_without_helper(self):
        services = self.services
        manifest = _new_runtime_manifest("cd9")
        with patch.object(
            services,
            "check_cdp_endpoint",
            return_value=(True, {"webSocketDebuggerUrl": "valid"}),
        ), patch.object(services, "_start_chrome_cdp") as helper:
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, "http://127.0.0.1:9222")
        self.assertEqual(
            manifest["services"]["cdp"]["reason"],
            "reused_preferred_endpoint",
        )
        helper.assert_not_called()

    def test_cd10_fallback_cdp_is_reused(self):
        services = self.services
        manifest = _new_runtime_manifest("cd10")
        fallback = services.PREFERRED_CDP_PORT + 2

        def probe(port, timeout):
            return ((True, {}) if port == fallback else (False, {}))

        with patch.object(services, "check_cdp_endpoint", side_effect=probe), \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "_start_chrome_cdp") as helper:
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, f"http://127.0.0.1:{fallback}")
        self.assertEqual(
            manifest["services"]["cdp"]["reason"],
            "reused_fallback_endpoint",
        )
        helper.assert_not_called()

    def test_cd11_complete_discovery_reuses_before_launch(self):
        services = self.services
        manifest = _new_runtime_manifest("cd11")
        fallback = services.PREFERRED_CDP_PORT + 2

        def probe(port, timeout):
            return ((True, {}) if port == fallback else (False, {}))

        def free(port):
            return port == services.PREFERRED_CDP_PORT

        with patch.object(services, "check_cdp_endpoint", side_effect=probe), \
             patch.object(services, "is_port_free", side_effect=free), \
             patch.object(services, "_start_chrome_cdp") as helper:
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, f"http://127.0.0.1:{fallback}")
        helper.assert_not_called()

    def test_cd12_lowest_valid_cdp_wins(self):
        services = self.services
        manifest = _new_runtime_manifest("cd12")
        valid = {
            services.PREFERRED_CDP_PORT + 1,
            services.PREFERRED_CDP_PORT + 2,
        }

        def probe(port, timeout):
            return ((True, {}) if port in valid else (False, {}))

        with patch.object(services, "check_cdp_endpoint", side_effect=probe), \
             patch.object(services, "is_port_free", return_value=False):
            url = services.resolve_cdp(manifest)
        self.assertEqual(
            url,
            f"http://127.0.0.1:{services.PREFERRED_CDP_PORT + 1}",
        )

    def test_cd13_foreign_listener_is_left_untouched(self):
        services = self.services
        manifest = _new_runtime_manifest("cd13")
        fallback = services.PREFERRED_CDP_PORT + 1

        def probe(port, timeout):
            return ((True, {}) if port == fallback else (False, {}))

        with patch.object(services, "check_cdp_endpoint", side_effect=probe), \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "_terminate_and_remove") as terminate, \
             patch.object(services, "_force_kill_tree") as force:
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, f"http://127.0.0.1:{fallback}")
        terminate.assert_not_called()
        force.assert_not_called()

    def test_cd14_first_free_port_is_selected_deterministically(self):
        services = self.services
        manifest = _new_runtime_manifest("cd14")
        selected = services.PREFERRED_CDP_PORT + 1

        def free(port):
            return port in {selected, selected + 2}

        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", side_effect=free), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result(
                     "launch_requested",
                     selected,
                 ),
             ) as helper:
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, f"http://127.0.0.1:{selected}")
        helper.assert_called_once_with(selected)

    def test_cd15_discovery_interval_is_bounded(self):
        services = self.services
        manifest = _new_runtime_manifest("cd15")
        seen = []

        def probe(port, timeout):
            seen.append(port)
            return False, {}

        with patch.object(services, "check_cdp_endpoint", side_effect=probe), \
             patch.object(services, "is_port_free", return_value=False):
            self.assertEqual(services.resolve_cdp(manifest), "")
        self.assertEqual(
            seen,
            list(range(
                services.PREFERRED_CDP_PORT,
                services.PREFERRED_CDP_PORT + services._MAX_PORT_ATTEMPTS,
            )),
        )

    def test_cd16_no_candidate_produces_empty_unavailable(self):
        services = self.services
        manifest = _new_runtime_manifest("cd16")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "_start_chrome_cdp") as helper:
            url = services.resolve_cdp(manifest)
        cdp = manifest["services"]["cdp"]
        self.assertEqual(url, "")
        self.assertEqual(cdp["status"], "unavailable")
        self.assertEqual(cdp["reason"], "no_free_port")
        helper.assert_not_called()

    def test_cd17_helper_command_uses_exact_port_and_flags(self):
        services = self.services
        payload = {"ok": True, "state": "launch_requested", "port": 9224}
        completed = self._completed(payload, 0)
        with patch.object(services.subprocess, "run", return_value=completed) as run:
            result = services._start_chrome_cdp(9224)
        command = run.call_args.args[0]
        self.assertEqual(command, [
            "powershell.exe",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy", "Bypass",
            "-File", services.CDP_SCRIPT,
            "-Port", "9224",
        ])
        self.assertEqual(result["state"], "launch_requested")

    def test_cd18_helper_runs_without_shell(self):
        services = self.services
        completed = self._completed({
            "ok": True,
            "state": "launch_requested",
            "port": 9222,
        }, 0)
        with patch.object(services.subprocess, "run", return_value=completed) as run:
            services._start_chrome_cdp(9222)
        kwargs = run.call_args.kwargs
        self.assertIs(kwargs["shell"], False)
        self.assertEqual(kwargs["cwd"], services.ROOT)
        self.assertIs(kwargs["stdin"], subprocess.DEVNULL)
        self.assertIs(kwargs["stdout"], subprocess.PIPE)
        self.assertIs(kwargs["stderr"], subprocess.PIPE)
        self.assertEqual(kwargs["timeout"], services._CDP_HELPER_TIMEOUT)

    def test_cd19_helper_is_never_registered_owned(self):
        services = self.services
        completed = self._completed({
            "ok": True,
            "state": "launch_requested",
            "port": 9222,
        }, 0)
        with patch.object(services.subprocess, "run", return_value=completed), \
             patch.object(services, "_register_owned_proc") as register:
            services._start_chrome_cdp(9222)
        register.assert_not_called()
        self.assertFalse(services._owned_entries)

    def test_cd20_helper_accepts_launch_requested(self):
        services = self.services
        completed = self._completed({
            "ok": True,
            "state": "launch_requested",
            "port": 9222,
        }, 0)
        with patch.object(services.subprocess, "run", return_value=completed):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result, self._helper_result("launch_requested"))

    def test_cd21_helper_accepts_already_ready(self):
        services = self.services
        completed = self._completed({
            "ok": True,
            "state": "already_ready",
            "port": 9222,
        }, 0)
        with patch.object(services.subprocess, "run", return_value=completed):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result, self._helper_result("already_ready"))

    def test_cd22_helper_accepts_port_occupied_failure(self):
        services = self.services
        completed = self._completed({
            "ok": False,
            "state": "port_occupied",
            "port": 9222,
        }, 2)
        with patch.object(services.subprocess, "run", return_value=completed):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result, self._helper_result("port_occupied"))

    def test_cd23_helper_reports_chrome_not_found(self):
        services = self.services
        completed = self._completed({
            "ok": False,
            "state": "chrome_not_found",
            "port": 9222,
        }, 3)
        with patch.object(services.subprocess, "run", return_value=completed):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result, self._helper_result("chrome_not_found"))

    def test_cd24_helper_rejects_malformed_json(self):
        services = self.services
        completed = subprocess.CompletedProcess(
            args=[], returncode=0, stdout="not-json", stderr="secret"
        )
        with patch.object(services.subprocess, "run", return_value=completed):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result["state"], "helper_invalid_response")
        self.assertFalse(result["ok"])

    def test_cd25_helper_rejects_wrong_reported_port(self):
        services = self.services
        completed = self._completed({
            "ok": True,
            "state": "launch_requested",
            "port": 9223,
        }, 0)
        with patch.object(services.subprocess, "run", return_value=completed):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result["state"], "helper_invalid_response")

    def test_cd26_helper_rejects_exit_json_inconsistency(self):
        services = self.services
        cases = [
            ({"ok": False, "state": "launch_requested", "port": 9222}, 0),
            ({"ok": True, "state": "launch_requested", "port": 9222}, 4),
        ]
        for payload, return_code in cases:
            with self.subTest(payload=payload, return_code=return_code), \
                 patch.object(
                     services.subprocess,
                     "run",
                     return_value=self._completed(payload, return_code),
                 ):
                result = services._start_chrome_cdp(9222)
                self.assertEqual(result["state"], "helper_invalid_response")

    def test_cd27_helper_rejects_unknown_state(self):
        services = self.services
        completed = self._completed({
            "ok": True,
            "state": "mystery",
            "port": 9222,
        }, 0)
        with patch.object(services.subprocess, "run", return_value=completed):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result["state"], "helper_invalid_response")

    def test_cd28_helper_timeout_stops_resolution(self):
        services = self.services
        with patch.object(
            services.subprocess,
            "run",
            side_effect=subprocess.TimeoutExpired("powershell", 5),
        ):
            self.assertEqual(
                services._start_chrome_cdp(9222)["state"],
                "helper_timeout",
            )

        manifest = _new_runtime_manifest("cd28")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("helper_timeout"),
             ) as helper:
            self.assertEqual(services.resolve_cdp(manifest), "")
        helper.assert_called_once_with(9222)
        self.assertEqual(
            manifest["services"]["cdp"]["reason"],
            "helper_timeout",
        )

    def test_cd29_helper_spawn_failure_is_structured(self):
        services = self.services
        with patch.object(services.subprocess, "run", side_effect=OSError("no ps")):
            result = services._start_chrome_cdp(9222)
        self.assertEqual(result["state"], "helper_spawn_failed")
        self.assertIsNone(result["returnCode"])

    def test_cd30_already_ready_race_requires_valid_reprobe(self):
        services = self.services
        manifest = _new_runtime_manifest("cd30")
        probes = [(False, {})] * services._MAX_PORT_ATTEMPTS + [(True, {})]
        with patch.object(services, "check_cdp_endpoint", side_effect=probes), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("already_ready"),
             ):
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, "http://127.0.0.1:9222")
        cdp = manifest["services"]["cdp"]
        self.assertEqual(cdp["status"], "ready")
        self.assertEqual(cdp["ownership"], "reused")

    def test_cd31_port_occupied_race_can_become_reusable_cdp(self):
        services = self.services
        manifest = _new_runtime_manifest("cd31")
        probes = [(False, {})] * services._MAX_PORT_ATTEMPTS + [(True, {})]
        with patch.object(services, "check_cdp_endpoint", side_effect=probes), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("port_occupied"),
             ):
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, "http://127.0.0.1:9222")
        self.assertEqual(
            manifest["services"]["cdp"]["ownership"],
            "reused",
        )

    def test_cd32_foreign_port_race_continues_to_next_free_candidate(self):
        services = self.services
        manifest = _new_runtime_manifest("cd32")
        probes = [(False, {})] * 8
        helper_results = [
            self._helper_result("port_occupied", 9222),
            self._helper_result("launch_requested", 9223),
        ]
        with patch.object(services, "check_cdp_endpoint", side_effect=probes), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(services, "_start_chrome_cdp", side_effect=helper_results) as helper, \
             patch.object(services, "_terminate_and_remove") as terminate:
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, "http://127.0.0.1:9223")
        self.assertEqual(helper.call_args_list, [call(9222), call(9223)])
        terminate.assert_not_called()

    def test_cd33_launch_requested_ready_immediately_is_external_ready(self):
        services = self.services
        manifest = _new_runtime_manifest("cd33")
        probes = [(False, {})] * services._MAX_PORT_ATTEMPTS + [(True, {})]
        with patch.object(services, "check_cdp_endpoint", side_effect=probes), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("launch_requested"),
             ):
            services.resolve_cdp(manifest)
        cdp = manifest["services"]["cdp"]
        self.assertEqual(cdp["status"], "ready")
        self.assertEqual(cdp["ownership"], "external")
        self.assertEqual(cdp["reason"], "helper_ready_preferred_endpoint")

    def test_cd34_launch_requested_not_ready_is_external_starting(self):
        services = self.services
        manifest = _new_runtime_manifest("cd34")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("launch_requested"),
             ):
            url = services.resolve_cdp(manifest)
        cdp = manifest["services"]["cdp"]
        self.assertEqual(cdp["status"], "starting")
        self.assertEqual(cdp["ownership"], "external")
        self.assertEqual(url, "http://127.0.0.1:9222")

    def test_cd35_launch_requested_never_starts_second_helper(self):
        services = self.services
        manifest = _new_runtime_manifest("cd35")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("launch_requested"),
             ) as helper:
            services.resolve_cdp(manifest)
        helper.assert_called_once_with(9222)

    def test_cd36_certain_helper_failure_is_unavailable(self):
        services = self.services
        for state in ("chrome_not_found", "launch_failed", "helper_spawn_failed"):
            manifest = _new_runtime_manifest(f"cd36-{state}")
            with self.subTest(state=state), \
                 patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
                 patch.object(services, "is_port_free", return_value=True), \
                 patch.object(
                     services,
                     "_start_chrome_cdp",
                     return_value=self._helper_result(state),
                 ) as helper:
                self.assertEqual(services.resolve_cdp(manifest), "")
                helper.assert_called_once_with(9222)
                self.assertEqual(
                    manifest["services"]["cdp"]["reason"],
                    state,
                )

    def test_cd37_ambiguous_helper_failure_is_conservative(self):
        services = self.services
        for state in ("helper_timeout", "helper_invalid_response"):
            manifest = _new_runtime_manifest(f"cd37-{state}")
            with self.subTest(state=state), \
                 patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
                 patch.object(services, "is_port_free", return_value=True), \
                 patch.object(
                     services,
                     "_start_chrome_cdp",
                     return_value=self._helper_result(state),
                 ) as helper, \
                 patch.object(services, "_terminate_and_remove") as terminate:
                self.assertEqual(services.resolve_cdp(manifest), "")
                helper.assert_called_once_with(9222)
                terminate.assert_not_called()

    def test_cd38_manifest_cdp_invariants_hold_for_all_outcomes(self):
        services = self.services
        manifests = []

        reused = _new_runtime_manifest("cd38-reused")
        with patch.object(services, "check_cdp_endpoint", return_value=(True, {})):
            services.resolve_cdp(reused)
        manifests.append(reused)

        ready = _new_runtime_manifest("cd38-ready")
        with patch.object(
            services,
            "check_cdp_endpoint",
            side_effect=[(False, {})] * services._MAX_PORT_ATTEMPTS + [(True, {})],
        ), patch.object(services, "is_port_free", return_value=True), patch.object(
            services,
            "_start_chrome_cdp",
            return_value=self._helper_result("launch_requested"),
        ):
            services.resolve_cdp(ready)
        manifests.append(ready)

        starting = _new_runtime_manifest("cd38-starting")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("launch_requested"),
             ):
            services.resolve_cdp(starting)
        manifests.append(starting)

        unavailable = _new_runtime_manifest("cd38-unavailable")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=False):
            services.resolve_cdp(unavailable)
        manifests.append(unavailable)

        for manifest in manifests:
            cdp = manifest["services"]["cdp"]
            self.assertIsNone(cdp["pid"])
            self.assertNotEqual(cdp["ownership"], "owned")

    def test_cd39_script_preserves_parameters_and_defaults(self):
        script = (_PROJECT_ROOT / "scripts/start-cdp-dev.ps1").read_text(
            encoding="utf-8"
        )
        self.assertIn("[int]$Port = 9222", script)
        self.assertIn(
            '[string]$ChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"',
            script,
        )
        self.assertIn('[string]$ProfileDir = "C:\\BetfairChromeProfile"', script)
        self.assertIn(
            '[string]$StartUrl = "https://www.betfair.it/exchange/plus/it/"',
            script,
        )

    def test_cd40_script_json_contains_only_authorized_fields(self):
        script = (_PROJECT_ROOT / "scripts/start-cdp-dev.ps1").read_text(
            encoding="utf-8"
        )
        match = re.search(
            r"\$payload\s*=\s*\[ordered\]@\{(.*?)\n\s*\}",
            script,
            re.DOTALL,
        )
        self.assertIsNotNone(match)
        keys = set(re.findall(r"^\s*(\w+)\s*=", match.group(1), re.MULTILINE))
        self.assertEqual(keys, {"ok", "state", "port"})

    def test_cd41_script_probes_endpoint_before_start_process(self):
        script = (_PROJECT_ROOT / "scripts/start-cdp-dev.ps1").read_text(
            encoding="utf-8"
        )
        self.assertLess(
            script.index("if (Test-CdpEndpoint -CandidatePort $Port)"),
            script.index("Start-Process"),
        )
        self.assertIn("/json/version", script)

    def test_cd42_script_port_occupied_path_exits_before_launch(self):
        script = (_PROJECT_ROOT / "scripts/start-cdp-dev.ps1").read_text(
            encoding="utf-8"
        )
        start = script.index("if (Test-TcpPortOccupied -CandidatePort $Port)")
        end = script.index("$chromeAvailable = $false", start)
        block = script[start:end]
        self.assertIn("'port_occupied'", block)
        self.assertIn("-ExitCode 2", block)
        self.assertNotIn("Start-Process", block)

    def test_cd43_script_passes_exact_chrome_arguments(self):
        script = (_PROJECT_ROOT / "scripts/start-cdp-dev.ps1").read_text(
            encoding="utf-8"
        )
        self.assertIn("--remote-debugging-port=$Port", script)
        self.assertIn("--user-data-dir=", script)
        self.assertIn("--new-window", script)
        self.assertIn("$StartUrl", script)

    def test_cd44_script_contains_no_process_kill_or_system_scan(self):
        script = (_PROJECT_ROOT / "scripts/start-cdp-dev.ps1").read_text(
            encoding="utf-8"
        ).lower()
        for forbidden in (
            "stop-process",
            "taskkill",
            "get-nettcpconnection",
            "netstat",
            "terminateprocess",
            "get-process",
            "get-ciminstance",
            "get-wmiobject",
        ):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, script)

    def test_cd45_helper_logs_and_json_exclude_sensitive_data(self):
        services_source = (_PROJECT_ROOT / "launcher/services.py").read_text(
            encoding="utf-8"
        )
        tree = ast.parse(services_source)
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            if isinstance(node.func, ast.Name) and node.func.id == "log":
                rendered = ast.unparse(node).lower()
                self.assertNotIn("completed.stdout", rendered)
                self.assertNotIn("completed.stderr", rendered)

        script = (_PROJECT_ROOT / "scripts/start-cdp-dev.ps1").read_text(
            encoding="utf-8"
        )
        payload_block = script[
            script.index("$payload = [ordered]@{"):
            script.index("Write-Output", script.index("$payload = [ordered]@{"))
        ]
        for forbidden in ("ChromePath", "ProfileDir", "StartUrl", "PID"):
            self.assertNotIn(forbidden, payload_block)

    def test_cd46_failed_resolution_never_falls_back_to_9222(self):
        services = self.services
        manifest = _new_runtime_manifest("cd46")
        with patch.object(services, "check_cdp_endpoint", return_value=(False, {})), \
             patch.object(services, "is_port_free", return_value=True), \
             patch.object(
                 services,
                 "_start_chrome_cdp",
                 return_value=self._helper_result("helper_invalid_response"),
             ):
            url = services.resolve_cdp(manifest)
        self.assertEqual(url, "")
        self.assertEqual(manifest["services"]["cdp"]["url"], "")

    def test_cd47_existing_manifest_cdp_states_remain_valid(self):
        from launcher import session
        cases = (
            ("ready", "reused", 9222, "http://127.0.0.1:9222"),
            ("ready", "external", 9223, "http://127.0.0.1:9223"),
            ("starting", "external", 9224, "http://127.0.0.1:9224"),
            ("unavailable", "unknown", None, ""),
        )
        for status, ownership, port, url in cases:
            with self.subTest(status=status, ownership=ownership):
                manifest = _new_runtime_manifest(f"cd47-{status}-{ownership}")
                session.manifest_set_cdp(
                    manifest,
                    status=status,
                    ownership=ownership,
                    selected_port=port,
                    url=url,
                    source=("none" if status == "unavailable" else "test"),
                    reason="test_reason",
                )
                self.assertTrue(session.validate_manifest_schema(manifest)["valid"])

    def test_cd48_prompt1_to_prompt4_regressions_remain_present(self):
        self.assertTrue(hasattr(
            TestSignalAndIdempotentShutdown,
            "test_s35_reentrant_stop_request_does_not_deadlock",
        ))
        self.assertTrue(hasattr(
            TestFrontendRuntimeIdentity,
            "test_v39_prompt1_prompt2_prompt3_regressions_remain_present",
        ))
        self.assertTrue(hasattr(
            TestCanonicalRuntimeManifest,
            "test_m1b_manifest_requires_existing_session_identity",
        ))
        for number in range(1, 18):
            self.assertTrue(any(
                name.startswith(f"test_t{number}_")
                for name in dir(TestLauncherAtomicSessionLock)
            ))

class TestExactCdpPropagation(unittest.TestCase):
    """Prompt 6 contracts P1, P2, P46, P47 and P48."""

    def test_p1_launcher_propagates_alternative_cdp_exactly(self):
        source = (
            _PROJECT_ROOT / "launcher" / "services.py"
        ).read_text(encoding="utf-8")
        self.assertIn('env["VITE_CDP_URL"] = cdp_url', source)

    def test_p2_launcher_propagates_empty_cdp_without_fallback(self):
        source = (
            _PROJECT_ROOT / "launcher" / "services.py"
        ).read_text(encoding="utf-8")
        self.assertNotRegex(
            source,
            r'VITE_CDP_URL"\]\s*=\s*cdp_url\s+or\s+',
        )

    def test_p46_runtime_files_contain_no_implicit_9222_fallback(self):
        paths = (
            "frontend/src/hooks/useAnalysisSessionState.js",
            "frontend/src/hooks/usePreflightChecks.js",
            "frontend/src/utils/analysisSessionState.js",
            "frontend/src/utils/liveSessionRequests.js",
            "frontend/src/services/liveSessionApi.js",
            "backend/src/routes/test.js",
            "backend/src/routes/betfair.js",
            "backend/src/routes/betfair/loginWindow.js",
            "backend/src/routes/match/trackingResponses.js",
            "backend/src/sofa/betfairFetch.js",
            "backend/src/sofa/betfair/scraperLifecycle/runner.js",
            "scrapers/betfair/cli.py",
            "scrapers/betfair/config.py",
            "scrapers/betfair/browser_session.py",
        )
        forbidden = (
            "DEFAULT_CDP_URL",
            "http://127.0.0.1:9222",
        )
        for relative in paths:
            source = (_PROJECT_ROOT / relative).read_text(
                encoding="utf-8-sig"
            )
            for token in forbidden:
                self.assertNotIn(
                    token,
                    source,
                    msg=f"{relative} contains runtime fallback {token}",
                )

    def test_p47_prompt5_resolver_contract_remains_present(self):
        self.assertTrue(hasattr(
            TestDeterministicCDPDiscovery,
            "test_cd46_failed_resolution_never_falls_back_to_9222",
        ))
        self.assertTrue(hasattr(
            TestDeterministicCDPDiscovery,
            "test_cd48_prompt1_to_prompt4_regressions_remain_present",
        ))

    def test_p48_prompt1_to_prompt5_regressions_remain_present(self):
        self.assertTrue(hasattr(
            TestSignalAndIdempotentShutdown,
            "test_s35_reentrant_stop_request_does_not_deadlock",
        ))
        self.assertTrue(hasattr(
            TestFrontendRuntimeIdentity,
            "test_v39_prompt1_prompt2_prompt3_regressions_remain_present",
        ))
        self.assertTrue(hasattr(
            TestDeterministicCDPDiscovery,
            "test_cd48_prompt1_to_prompt4_regressions_remain_present",
        ))

class TestBackendPythonProcessOwnership(unittest.TestCase):
    """Prompt 7 structural contracts L50-L54."""

    def test_l50_python_spawn_exists_only_in_backend_registry(self):
        backend_root = _PROJECT_ROOT / "backend" / "src"
        registry_path = "runtime/pythonProcessRegistry.js"
        patterns = (
            "spawn('python'",
            'spawn("python"',
            "spawnProcess('python'",
            'spawnProcess("python"',
        )
        matches = []
        child_process_imports = []
        for path in backend_root.rglob("*.js"):
            if path.name.endswith(".test.js"):
                continue
            source = path.read_text(encoding="utf-8-sig")
            relative = path.relative_to(backend_root).as_posix()
            if any(pattern in source for pattern in patterns):
                matches.append(relative)
            if (
                "from 'child_process'" in source
                or 'from "child_process"' in source
                or "require('child_process')" in source
                or 'require("child_process")' in source
            ):
                child_process_imports.append(relative)
        self.assertEqual(matches, [registry_path])
        self.assertEqual(child_process_imports, [registry_path])

    def test_l51_new_backend_lifecycle_has_no_external_kill_scan(self):
        paths = (
            "backend/src/runtime/pythonProcessRegistry.js",
            "backend/src/sofa/directFetch.js",
            "backend/src/sofa/betfair/scraperLifecycle/runner.js",
            "backend/src/routes/betfair/loginWindowLifecycle.js",
            "backend/src/server.js",
        )
        forbidden = (
            "taskkill",
            "Stop-Process",
            "netstat",
            "Get-Process",
            "Get-NetTCPConnection",
        )
        for relative in paths:
            source = (_PROJECT_ROOT / relative).read_text(encoding="utf-8-sig")
            for token in forbidden:
                self.assertNotIn(token, source, msg=f"{relative}: {token}")

    def test_l52_registry_roles_exclude_chrome_and_cdp(self):
        source = (
            _PROJECT_ROOT / "backend/src/runtime/pythonProcessRegistry.js"
        ).read_text(encoding="utf-8-sig")
        self.assertIn("SOFA_TRACKING: 'sofa_tracking'", source)
        self.assertIn("BETFAIR_TRACKING: 'betfair_tracking'", source)
        self.assertIn("BETFAIR_LOGIN: 'betfair_login'", source)
        self.assertNotRegex(source, r"[A-Z_]+:\s*['\"](?:chrome|cdp)['\"]")

    def test_l53_prompt6_contracts_remain_present(self):
        for number in (1, 2, 46, 47, 48):
            self.assertTrue(any(
                name.startswith(f"test_p{number}_")
                for name in dir(TestExactCdpPropagation)
            ))

    def test_l43_login_hook_returns_api_result(self):
        source = (
            _PROJECT_ROOT / "frontend/src/hooks/useBetfairLoginAction.js"
        ).read_text(encoding="utf-8-sig")
        self.assertIn(
            "return await openBetfairLoginWindow(loginRequest)",
            source,
        )
        self.assertNotIn("if (!loginRequest)", source)

    def test_l54_prompt1_to_prompt5_regressions_remain_present(self):
        self.assertTrue(hasattr(
            TestSignalAndIdempotentShutdown,
            "test_s35_reentrant_stop_request_does_not_deadlock",
        ))
        self.assertTrue(hasattr(
            TestFrontendRuntimeIdentity,
            "test_v39_prompt1_prompt2_prompt3_regressions_remain_present",
        ))
        self.assertTrue(hasattr(
            TestDeterministicCDPDiscovery,
            "test_cd48_prompt1_to_prompt4_regressions_remain_present",
        ))

class TestPrompt7RCorrections(unittest.TestCase):
    """Prompt 7R structural regressions R16-R17."""

    def test_r16_registry_distinguishes_spawn_and_process_error(self):
        source = (
            _PROJECT_ROOT / "backend/src/runtime/pythonProcessRegistry.js"
        ).read_text(encoding="utf-8-sig")
        self.assertIn("spawnReady", source)
        self.assertIn("spawnState: 'spawn_pending'", source)
        self.assertIn("code: 'python_spawn_failed'", source)
        self.assertIn("entry.processErrorCode = 'process_error'", source)
        self.assertNotIn(
            "proc.once('error', () => markComplete('error'))",
            source,
        )

    def test_r16_login_waits_for_spawn_confirmation(self):
        source = (
            _PROJECT_ROOT
            / "backend/src/routes/betfair/loginWindowLifecycle.js"
        ).read_text(encoding="utf-8-sig")
        self.assertIn("waitForSpawnReady(", source)
        self.assertIn("const startResult = await startPromise", source)
        self.assertIn("login_spawn_failed", source)
        self.assertIn("state: 'spawn_pending'", source)

    def test_r16_sofa_uses_physical_completion_barrier(self):
        source = (
            _PROJECT_ROOT / "backend/src/sofa/directFetch.js"
        ).read_text(encoding="utf-8-sig")
        self.assertIn("const resultPromise = new Promise", source)
        self.assertIn("const requestBarrier = currentBarrier.then", source)
        self.assertIn(
            "await Promise.resolve(handle.completion)",
            source,
        )
        self.assertIn("scraper_timeout", source)
        self.assertIn("scraper_cancelled", source)

    def test_r16_mismatch_invalidates_tracking_generation(self):
        registry = (
            _PROJECT_ROOT / "backend/src/runtime/pythonProcessRegistry.js"
        ).read_text(encoding="utf-8-sig")
        tracker = (
            _PROJECT_ROOT / "backend/src/sofa/matchTracker.js"
        ).read_text(encoding="utf-8-sig")
        self.assertIn(
            "export const invalidatePythonGeneration",
            registry,
        )
        self.assertIn(
            "invalidateGenerationFn('tracking')",
            tracker,
        )
        self.assertIn(
            "terminateBetfairScrapersFn",
            tracker,
        )
        self.assertNotIn(
            "invalidateGenerationFn('login')",
            tracker,
        )

    def test_r17_prompt7_and_prompt1_to_prompt6_regressions_remain(self):
        for name in (
            "test_l50_python_spawn_exists_only_in_backend_registry",
            "test_l51_new_backend_lifecycle_has_no_external_kill_scan",
            "test_l52_registry_roles_exclude_chrome_and_cdp",
            "test_l53_prompt6_contracts_remain_present",
            "test_l54_prompt1_to_prompt5_regressions_remain_present",
        ):
            self.assertTrue(hasattr(
                TestBackendPythonProcessOwnership,
                name,
            ))
        self.assertTrue(hasattr(
            TestSignalAndIdempotentShutdown,
            "test_s35_reentrant_stop_request_does_not_deadlock",
        ))
        self.assertTrue(hasattr(
            TestFrontendRuntimeIdentity,
            "test_v39_prompt1_prompt2_prompt3_regressions_remain_present",
        ))
        self.assertTrue(hasattr(
            TestDeterministicCDPDiscovery,
            "test_cd48_prompt1_to_prompt4_regressions_remain_present",
        ))
        self.assertTrue(hasattr(
            TestExactCdpPropagation,
            "test_p48_prompt1_to_prompt5_regressions_remain_present",
        ))


class TestFinalLauncherLockRegression(unittest.TestCase):
    """Regressioni finali per il collaudo live del secondo launcher."""

    def test_q1_active_launcher_blocks_reusable_fast_path(self):
        from launcher import app

        existing = {
            "services": {
                "frontend": {
                    "url": "http://127.0.0.1:3000",
                    "selectedPort": 3000,
                }
            }
        }
        identity = {
            "sessionId": "q1-second-launcher",
            "pid": 99101,
            "createdAt": "2026-08-02T00:00:00Z",
            "processIdentity": {
                "startFingerprint": "q1-fingerprint",
                "executable": "python",
            },
        }

        with patch.object(app, "read_manifest", return_value=existing), \
             patch.object(app, "create_launcher_session_identity", return_value=identity), \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": False,
                 "state": "active",
                 "reason": "owner_verified",
             }) as acquire, \
             patch.object(app, "is_manifest_reusable", return_value=True) as reusable, \
             patch.object(app, "open_browser") as browser, \
             patch.object(app, "resolve_cdp") as resolve_cdp:
            app.main()

        acquire.assert_called_once_with(identity, manifest=existing)
        reusable.assert_not_called()
        browser.assert_not_called()
        resolve_cdp.assert_not_called()

    def test_q2_reclaimed_lock_allows_dead_launcher_service_reuse(self):
        from launcher import app

        existing = {
            "services": {
                "frontend": {
                    "url": "http://127.0.0.1:3000",
                    "selectedPort": 3000,
                }
            }
        }
        identity = {
            "sessionId": "q2-reclaimed",
            "pid": 99102,
            "createdAt": "2026-08-02T00:00:00Z",
            "processIdentity": {
                "startFingerprint": "q2-fingerprint",
                "executable": "python",
            },
        }

        with patch.object(app, "read_manifest", return_value=existing), \
             patch.object(app, "create_launcher_session_identity", return_value=identity), \
             patch.object(app, "acquire_or_recover_lock", return_value={
                 "acquired": True,
                 "state": "reclaimed",
                 "reason": "dead_pid",
             }), \
             patch.object(app, "is_manifest_reusable", return_value=True), \
             patch.object(app, "open_browser") as browser, \
             patch.object(app, "_install_signal_handlers") as install_handlers, \
             patch.object(app, "resolve_cdp") as resolve_cdp, \
             patch.object(app, "shutdown_owned", return_value={
                 "ok": True,
                 "state": "already_empty",
                 "attempted": 0,
                 "stopped": 0,
                 "failed": 0,
                 "entries": [],
             }), \
             patch.object(app, "remove_manifest", return_value={
                 "removed": False,
                 "state": "not_owner",
                 "reason": "not_owner",
             }) as remove_manifest, \
             patch.object(app, "release_lock", return_value={
                 "released": True,
                 "state": "released",
                 "reason": "owner_removed",
             }) as release_lock:
            app.main()

        browser.assert_called_once_with("http://127.0.0.1:3000")
        install_handlers.assert_not_called()
        resolve_cdp.assert_not_called()
        remove_manifest.assert_called_once_with(identity)
        release_lock.assert_called_once_with(identity)

    def test_q3_cdp_candidate_count_matches_max_attempts(self):
        from launcher import services

        manifest = _new_runtime_manifest("q3")
        seen = []

        def probe(port, timeout=None):
            seen.append(port)
            return False, {}

        with patch.object(services, "check_cdp_endpoint", side_effect=probe), \
             patch.object(services, "is_port_free", return_value=False), \
             patch.object(services, "_start_chrome_cdp") as helper:
            self.assertEqual(services.resolve_cdp(manifest), "")

        self.assertEqual(len(seen), services._MAX_PORT_ATTEMPTS)
        self.assertEqual(
            seen,
            list(range(
                services.PREFERRED_CDP_PORT,
                services.PREFERRED_CDP_PORT + services._MAX_PORT_ATTEMPTS,
            )),
        )
        helper.assert_not_called()

class TestStructuredRuntimeLogging(unittest.TestCase):
    """Prompt 8 logging contracts G22-G32/G39-G40/G48-G50."""

    def test_g22_legacy_launcher_log_is_redacted(self):
        from launcher.system import log
        with patch("builtins.print") as output:
            log("Launcher", "Authorization: Bearer secret https://host/path")
        line = output.call_args.args[0]
        self.assertIn("event=legacy_message", line)
        self.assertNotIn("secret", line)
        self.assertNotIn("https://", line)

    def test_g23_structured_launcher_log_preserves_safe_fields(self):
        from launcher.system import log
        with patch("builtins.print") as output:
            log("Launcher", "backend_ready", port=3001, ownership="owned")
        line = output.call_args.args[0]
        self.assertIn("event=backend_ready", line)
        self.assertIn("port=3001", line)
        self.assertIn("ownership=owned", line)

    def test_g24_g27_child_output_is_single_line_and_redacted(self):
        from launcher.system import sanitize_child_output
        line = sanitize_child_output(
            b"https://host/path\\nC:\\Users\\Utente\\Profile "
            b"token=secret\\x1b[31m"
        )
        self.assertNotIn("https://", line)
        self.assertNotIn("Utente", line)
        self.assertNotIn("secret", line)
        self.assertNotIn("\\n", line)
        self.assertNotIn("\\x1b", line)

    def test_g28_g29_launcher_runtime_does_not_log_urls(self):
        services = (_PROJECT_ROOT / "launcher/services.py").read_text(encoding="utf-8-sig")
        app = (_PROJECT_ROOT / "launcher/app.py").read_text(encoding="utf-8-sig")
        self.assertIn('"browser_open"', services)
        self.assertIn('"backend_reuse"', services)
        self.assertIn('"session_reuse"', app)
        self.assertNotIn('browser action=open url=', services)
        self.assertNotIn('session action=reuse url=', app)

    def test_g30_g32_backend_control_plane_uses_shared_logger(self):
        paths = (
            "backend/src/server.js",
            "backend/src/routes/match/trackingResponses.js",
            "backend/src/runtime/pythonProcessRegistry.js",
            "backend/src/sofa/directFetch.js",
            "backend/src/sofa/betfairFetch.js",
        )
        for relative in paths:
            source = (_PROJECT_ROOT / relative).read_text(encoding="utf-8-sig")
            self.assertIn("runtimeLogger.js", source, msg=relative)
            self.assertNotRegex(source, r"console\.error\([^\n]*,\s*error")
        logger = (_PROJECT_ROOT / "backend/src/runtime/runtimeLogger.js").read_text(encoding="utf-8-sig")
        registry = (_PROJECT_ROOT / "backend/src/runtime/pythonProcessRegistry.js").read_text(encoding="utf-8-sig")
        betfair_fetch = (_PROJECT_ROOT / "backend/src/sofa/betfairFetch.js").read_text(encoding="utf-8-sig")
        self.assertIn("FIELD_ALLOWLIST", logger)
        self.assertIn("readBoundedRuntimeLog", logger)
        self.assertIn("python_spawn_requested", registry)
        self.assertIn("python_terminate_complete", registry)
        self.assertNotIn("appendFileSync", betfair_fetch)
        self.assertNotIn("betfair_debug.log", betfair_fetch)

    def test_g39_g40_frontend_has_no_raw_error_console(self):
        paths = (
            "frontend/src/hooks/useBetfairLoginAction.js",
            "frontend/src/hooks/useLiveTrackingActions.js",
            "frontend/src/App.jsx",
        )
        for relative in paths:
            source = (_PROJECT_ROOT / relative).read_text(encoding="utf-8-sig")
            self.assertNotRegex(source, r"console\.error\([^\n]*error")
            self.assertNotRegex(source, r"console\.(?:log|warn|error)\([^\n]*(?:cdpUrl|profileDir|https?://)")

    def test_g48_no_retention_or_rotation_added(self):
        paths = (
            "backend/src/runtime/runtimeLogger.js",
            "launcher/system.py",
            "scrapers/betfair/config.py",
        )
        forbidden = ("rotate", "retention", "unlink(", "rmSync", "truncateSync")
        for relative in paths:
            source = (_PROJECT_ROOT / relative).read_text(encoding="utf-8-sig")
            for token in forbidden:
                self.assertNotIn(token, source, msg=f"{relative}: {token}")

    def test_g49_g50_prompt7r_and_prior_regressions_remain(self):
        self.assertTrue(hasattr(TestPrompt7RCorrections, "test_r17_prompt7_and_prompt1_to_prompt6_regressions_remain"))
        self.assertTrue(hasattr(TestBackendPythonProcessOwnership, "test_l54_prompt1_to_prompt5_regressions_remain_present"))

class TestPrompt8RCorrections(unittest.TestCase):
    def test_rg1_rg10_complete_redaction(self):
        from launcher.system import sanitize_runtime_text
        cases = (
            ("Authorization: Basic dXNlcjpwYXNz", ("dXNlcjpwYXNz",)),
            ('Authorization: Digest username="u", response="secret"', ("username", "response", "secret")),
            ("Cookie: foo=bar; sessionid=abcdef; pref=hello", ("foo=bar", "abcdef", "pref=hello")),
            ("Set-Cookie: sid=abc; Path=/; HttpOnly", ("sid=abc", "Path=", "HttpOnly")),
            ('{"token":"abc","Authorization":"Basic hidden","safe":"value"}', ('"abc"', "Basic hidden")),
            ("C:/Users/Utente/Profile", ("Utente",)),
            (r"C:\Users\Utente\Profile", ("Utente",)),
            (r"\\server\share\folder", ("server",)),
            ("/workspace/project/.env", ("workspace",)),
            ("/usr/local/bin/python /app/runtime/file /root/.config", ("usr/local", "app/runtime", "root/.config")),
        )
        for value, forbidden in cases:
            with self.subTest(value=value):
                result = sanitize_runtime_text(value)
                self.assertIn("<redacted>", result.lower())
                for marker in forbidden:
                    self.assertNotIn(marker, result)

    def test_rg11_rg12_non_finite_fields_are_omitted(self):
        from launcher.system import log
        with patch("builtins.print") as output:
            log(
                "Launcher",
                "finite_numbers",
                port=3001,
                attempt=1.5,
                count=0,
                requested=float("nan"),
                graceful=float("inf"),
                remaining=float("-inf"),
            )
        line = output.call_args.args[0]
        self.assertIn("port=3001", line)
        self.assertIn("attempt=1.5", line)
        self.assertIn("count=0", line)
        self.assertNotIn("requested=", line)
        self.assertNotIn("graceful=", line)
        self.assertNotIn("remaining=", line)
