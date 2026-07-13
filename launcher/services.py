"""
Service lifecycle management.

Rules enforced here:
- No kill by port.
- Reuse an existing service only if it passes identity validation.
- Own only what we start; never own a reused process.
- Max 5 port attempts per service.
- Bounded waits everywhere.
"""

import os
import signal
import subprocess
import sys
import time
import webbrowser

from .config import (
    CDP_SCRIPT,
    FRONTEND_DIR,
    PREFERRED_BACKEND_PORT,
    PREFERRED_CDP_PORT,
    PREFERRED_FRONTEND_PORT,
    ROOT,
)
from .session import (
    manifest_set_backend,
    manifest_set_cdp,
    manifest_set_frontend,
)
from .system import (
    check_backend_identity,
    check_cdp_endpoint,
    check_http_health,
    find_free_port,
    is_port_free,
    log,
    start_reader_thread,
    wait_for_service,
)

_MAX_PORT_ATTEMPTS = 5
_MAX_BACKEND_WAIT = 20     # seconds
_MAX_FRONTEND_WAIT = 30    # seconds
_SHUTDOWN_GRACE = 5        # seconds before fallback tree-kill
_FAILED_PROCESS_GRACE = 3  # seconds before fallback tree-kill for a failed startup

# Each entry: {"role": str, "proc": Popen, "pid": int, "started_at": float}
_owned_entries: list[dict] = []

# Expose list of Popen objects for legacy test access
class _OwnedProcsProxy:
    """Proxy that exposes _owned_entries as a list of Popen for tests."""
    def __len__(self):
        return len(_owned_entries)
    def __iter__(self):
        return (e["proc"] for e in _owned_entries)
    def append(self, proc):
        pass  # ignore direct appends; use _register_owned_proc
    def clear(self):
        _owned_entries.clear()
    def extend(self, procs):
        pass

_owned_procs = _OwnedProcsProxy()


def _register_owned_proc(proc: subprocess.Popen, role: str):
    _owned_entries.append({
        "role": role,
        "proc": proc,
        "pid": proc.pid,
        "started_at": time.time(),
    })


def _remove_owned_entry(proc: subprocess.Popen):
    """Remove a specific proc from the owned list (e.g. after startup failure)."""
    global _owned_entries
    _owned_entries = [e for e in _owned_entries if e["proc"] is not proc]


# ---------------------------------------------------------------------------
# Windows process group flags
# ---------------------------------------------------------------------------

def _popen_kwargs_for_owned() -> dict:
    """Create an isolated process group/session for every owned process."""
    kwargs = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        # Each owned process becomes leader of a dedicated session/process group.
        # This makes group signalling safe: the launcher is never in this group.
        kwargs["start_new_session"] = True
    return kwargs


# ---------------------------------------------------------------------------
# Internal: start Node backend
# ---------------------------------------------------------------------------

def _start_node_backend(port: int) -> subprocess.Popen:
    backend_src = os.path.join(ROOT, "backend", "src")
    env = os.environ.copy()
    env["PORT"] = str(port)
    proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=backend_src,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        **_popen_kwargs_for_owned(),
    )
    _register_owned_proc(proc, "backend")
    start_reader_thread(proc, "Backend")
    return proc


# ---------------------------------------------------------------------------
# Internal: start Vite frontend directly through the local Node CLI
# ---------------------------------------------------------------------------

def _vite_cli_path() -> str:
    """Return the absolute path of the project-local Vite Node entry point."""
    return os.path.abspath(
        os.path.join(FRONTEND_DIR, "node_modules", "vite", "bin", "vite.js")
    )


def _start_vite_frontend(port: int, backend_port: int, cdp_url: str) -> subprocess.Popen:
    vite_cli = _vite_cli_path()
    if not os.path.isfile(vite_cli):
        raise FileNotFoundError(vite_cli)

    env = os.environ.copy()
    env["VITE_FRONTEND_PORT"] = str(port)
    env["VITE_BACKEND_TARGET"] = f"http://127.0.0.1:{backend_port}"
    env["VITE_CDP_URL"] = cdp_url  # may be empty string — that is intentional
    proc = subprocess.Popen(
        [
            "node",
            vite_cli,
            "--host", "127.0.0.1",
            "--port", str(port),
            "--strictPort",
        ],
        cwd=FRONTEND_DIR,
        shell=False,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        **_popen_kwargs_for_owned(),
    )
    _register_owned_proc(proc, "frontend")
    start_reader_thread(proc, "Frontend")
    return proc


# ---------------------------------------------------------------------------
# Internal: launch Chrome for CDP (never owned)
# ---------------------------------------------------------------------------

def _start_chrome_cdp(port: int) -> bool:
    """Launch the dedicated Chrome helper without taking ownership of Chrome."""
    try:
        proc = subprocess.Popen(
            [
                "powershell.exe",
                "-ExecutionPolicy", "Bypass",
                "-File", CDP_SCRIPT,
                "-Port", str(port),
            ],
            cwd=ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
        )
        start_reader_thread(proc, "CDP")
        # Chrome is never added to _owned_entries.
        return True
    except Exception as exc:
        log("Launcher", f"cdp chrome-launch error: {exc}")
        return False


# ---------------------------------------------------------------------------
# Public: CDP — non-blocking
# ---------------------------------------------------------------------------

def resolve_cdp(manifest: dict) -> str:
    """
    Reuse a valid preferred CDP endpoint, otherwise launch dedicated Chrome on
    the preferred free port (or the first alternative free port).  Launching
    Chrome is deliberately non-blocking: the candidate URL is passed through
    immediately so preflight can verify it once Chrome is ready.
    """
    preferred = PREFERRED_CDP_PORT

    # Keep the initial probe bounded so backend/frontend startup is not delayed.
    ok, _ = check_cdp_endpoint(preferred, timeout=0.3)
    if ok:
        url = f"http://127.0.0.1:{preferred}"
        log("Launcher", f"cdp action=reuse url={url}")
        manifest_set_cdp(manifest, url, "reuse")
        return url

    if is_port_free(preferred):
        cdp_port = preferred
    else:
        cdp_port = find_free_port(preferred + 1, max_attempts=_MAX_PORT_ATTEMPTS)
        if cdp_port is None:
            log("Launcher", "cdp action=unavailable reason=no-free-port")
            manifest_set_cdp(manifest, "", "unavailable")
            return ""

    if not _start_chrome_cdp(cdp_port):
        manifest_set_cdp(manifest, "", "unavailable")
        return ""

    # Do not wait for Chrome.  The selected candidate must survive startup so
    # the frontend/backed preflight can check that exact endpoint later.
    url = f"http://127.0.0.1:{cdp_port}"
    manifest_set_cdp(manifest, url, "starting")
    log("Launcher", f"cdp action=starting url={url}")
    return url


# ---------------------------------------------------------------------------
# Public: Backend
# ---------------------------------------------------------------------------

def resolve_backend(manifest: dict) -> tuple[bool, str]:
    """
    Returns (success, backend_base_url).

    For each candidate port:
    - If free: start Node, wait for health, validate identity + PID match.
      On failure: remove proc from owned, try next port.
    - If occupied by valid Tennis Decision backend: reuse (not owned).
    - Otherwise: try next port (no kill).
    """
    preferred = PREFERRED_BACKEND_PORT

    for attempt in range(_MAX_PORT_ATTEMPTS):
        port = preferred + attempt
        health_url = f"http://127.0.0.1:{port}/api/health"
        base_url = f"http://127.0.0.1:{port}"

        if is_port_free(port):
            proc = _start_node_backend(port)
            log("Launcher", f"backend action=start port={port}")

            ok, data = wait_for_service(
                health_url,
                "Launcher",
                timeout=_MAX_BACKEND_WAIT,
                validator=lambda d: (
                    isinstance(d, dict) and
                    d.get("ok") is True and
                    d.get("project") == "tennis-decision-ui" and
                    bool(d.get("instanceId"))
                ),
            )

            if ok and isinstance(data, dict):
                reported_pid = data.get("pid")
                if reported_pid != proc.pid:
                    log("Launcher", f"backend action=start-failed port={port} reason=pid-mismatch reported={reported_pid} expected={proc.pid}")
                    _terminate_and_remove(proc)
                    continue

                instance_id = data.get("instanceId")
                manifest_set_backend(manifest, base_url, health_url, instance_id, proc.pid, owned=True)
                log("Launcher", f"backend action=start port={port}")
                return True, base_url
            else:
                log("Launcher", f"backend action=start-failed port={port} error={data}")
                _terminate_and_remove(proc)
                continue

        # Port occupied — check if it is our backend
        ok, data = check_backend_identity(health_url)
        if ok:
            instance_id = data.get("instanceId")
            log("Launcher", f"backend action=reuse url={health_url}")
            manifest_set_backend(manifest, base_url, health_url, instance_id, None, owned=False)
            return True, base_url

        log("Launcher", f"backend action=fallback-port port={port + 1} reason=foreign-occupant")

    log("Launcher", "backend action=failed reason=max-attempts")
    return False, ""


# ---------------------------------------------------------------------------
# Public: Frontend
# ---------------------------------------------------------------------------

def resolve_frontend(manifest: dict, backend_port: int, cdp_url: str) -> tuple[bool, str]:
    """
    Start Vite on at most five distinct ports.  A failed Vite process is
    cleaned up before another untried port is selected; backend and frontend
    ports never collide.
    """
    vite_cli = _vite_cli_path()
    if not os.path.isfile(vite_cli):
        log("Launcher", "frontend action=failed reason=vite-cli-missing")
        return False, ""

    preferred = PREFERRED_FRONTEND_PORT
    tried_ports: set[int] = set()

    for _ in range(_MAX_PORT_ATTEMPTS):
        port = None
        # Search a bounded range while explicitly excluding all previously
        # attempted ports and the active backend port.
        for candidate in range(preferred, preferred + (_MAX_PORT_ATTEMPTS * 5)):
            if candidate in tried_ports or candidate == backend_port:
                continue
            if is_port_free(candidate):
                port = candidate
                break

        if port is None:
            log("Launcher", "frontend action=failed reason=no-free-port")
            return False, ""

        if port != preferred:
            log("Launcher", f"frontend action=fallback-port port={port}")
        tried_ports.add(port)

        try:
            proc = _start_vite_frontend(port, backend_port, cdp_url)
        except FileNotFoundError:
            # The local CLI can disappear only between the preflight check and
            # spawn; this is a configuration failure, not a port retry.
            log("Launcher", "frontend action=failed reason=vite-cli-missing")
            return False, ""

        log("Launcher", f"frontend action=start port={port}")
        frontend_url = f"http://127.0.0.1:{port}"

        ok, _ = wait_for_service(frontend_url, "Launcher", timeout=_MAX_FRONTEND_WAIT)

        if ok and proc.poll() is None:
            manifest_set_frontend(manifest, frontend_url, proc.pid, owned=True)
            return True, frontend_url

        reason = "proc-exited" if ok else "timeout"
        log("Launcher", f"frontend action=start-failed port={port} reason={reason}")
        _terminate_and_remove(proc)

    log("Launcher", "frontend action=failed reason=max-attempts")
    return False, ""


# ---------------------------------------------------------------------------
# Internal: clean termination of a single failed proc
# ---------------------------------------------------------------------------

def _owned_entry_for_proc(proc: subprocess.Popen) -> dict | None:
    return next((entry for entry in _owned_entries if entry["proc"] is proc), None)


def _owned_entry_for_pid(pid: int) -> dict | None:
    return next((entry for entry in _owned_entries if entry["pid"] == pid), None)


def _wait_or_force_kill(entry: dict, timeout: float):
    """Wait for an owned process and tree-kill only its registered root PID."""
    proc = entry["proc"]
    try:
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        _force_kill_tree(entry["pid"])
    except OSError:
        pass


def _stop_owned_entry(entry: dict, grace: float):
    """Use the same signal/wait/tree-kill path for shutdown and startup failure."""
    _send_clean_signal(entry)
    _wait_or_force_kill(entry, grace)
    _remove_owned_entry(entry["proc"])


# ---------------------------------------------------------------------------
# Internal: clean termination of a single failed proc
# ---------------------------------------------------------------------------

def _terminate_and_remove(proc: subprocess.Popen):
    """Clean up only a process registered as owned by this launcher."""
    entry = _owned_entry_for_proc(proc)
    if entry is None:
        return
    _stop_owned_entry(entry, _FAILED_PROCESS_GRACE)


# ---------------------------------------------------------------------------
# Public: Browser
# ---------------------------------------------------------------------------

def open_browser(url: str):
    log("Launcher", f"browser action=open url={url}")
    webbrowser.open(url)


# ---------------------------------------------------------------------------
# Public: Shutdown (owned processes only)
# ---------------------------------------------------------------------------

def _send_clean_signal(entry: dict):
    """Send a clean signal without ever signalling the launcher's own group."""
    proc = entry["proc"]
    try:
        if proc.poll() is not None:
            return
        if sys.platform == "win32":
            # Each owned Windows process uses CREATE_NEW_PROCESS_GROUP.
            proc.send_signal(signal.CTRL_BREAK_EVENT)
            return

        # start_new_session makes the child PID the dedicated group leader.
        pgid = os.getpgid(entry["pid"])
        if pgid == entry["pid"]:
            os.killpg(pgid, signal.SIGTERM)
            return

        # Do not use killpg when the group cannot be proven dedicated.
        log("Launcher", f"shutdown action=direct-sigterm pid={entry['pid']} reason=non-dedicated-group")
        proc.terminate()
    except OSError:
        # A direct signal affects only this owned process if the process group
        # is already gone or cannot be inspected (for example in test doubles).
        try:
            if proc.poll() is None:
                proc.terminate()
        except OSError:
            pass


def shutdown_owned():
    """
    Terminate only processes registered as owned by this session.  Every entry
    uses the same graceful-signal, bounded-wait, owned-tree-kill path.
    """
    log("Launcher", "shutdown action=owned-processes-only")
    entries = list(_owned_entries)
    for entry in entries:
        _stop_owned_entry(entry, _SHUTDOWN_GRACE)


def _force_kill_tree(pid: int):
    """Force-kill only the tree rooted at a currently registered owned PID."""
    if _owned_entry_for_pid(pid) is None:
        return

    if sys.platform == "win32":
        try:
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True,
                check=False,
                timeout=5,
            )
        except Exception:
            pass
        return

    try:
        pgid = os.getpgid(pid)
        if pgid != pid:
            log("Launcher", f"shutdown action=skip-tree-kill pid={pid} reason=non-dedicated-group")
            return
        os.killpg(pgid, signal.SIGKILL)
    except OSError:
        pass
