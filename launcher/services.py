"""
Service lifecycle management.

Rules enforced here:
- No kill by port.
- Reuse an existing service only if it passes identity validation.
- Own only what we start; never own a reused process.
- Max 5 port attempts per service.
- Bounded waits everywhere.
"""

import json
import os
import signal
import subprocess
import sys
import time
import webbrowser
from urllib.parse import urlparse

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
    check_frontend_identity,
    find_free_port,
    frontend_identity_url,
    is_port_free,
    log,
    start_reader_thread,
    validate_frontend_identity,
    wait_for_service,
)

_MAX_PORT_ATTEMPTS = 5
_MAX_BACKEND_WAIT = 20     # seconds
_MAX_FRONTEND_WAIT = 30    # seconds
_FRONTEND_IDENTITY_TIMEOUT = 2.0
_SHUTDOWN_GRACE = 5        # seconds before fallback tree-kill
_FAILED_PROCESS_GRACE = 3  # seconds before fallback tree-kill for a failed startup
_FORCE_KILL_CONFIRM_GRACE = 2  # bounded confirmation after escalation

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

_CDP_DISCOVERY_TIMEOUT = 0.2
_CDP_HELPER_TIMEOUT = 5.0
_CDP_HELPER_RESPONSE_CODES = {
    "already_ready": (True, 0),
    "launch_requested": (True, 0),
    "port_occupied": (False, 2),
    "chrome_not_found": (False, 3),
    "launch_failed": (False, 4),
    "input_invalid": (False, 5),
}


def _cdp_helper_result(
    state: str,
    port: int,
    *,
    ok: bool = False,
    return_code=None,
) -> dict:
    return {
        "ok": ok,
        "state": state,
        "port": port,
        "returnCode": return_code,
    }


def _start_chrome_cdp(port: int) -> dict:
    """Run the bounded PowerShell helper and validate its JSON contract."""
    command = [
        "powershell.exe",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy", "Bypass",
        "-File", CDP_SCRIPT,
        "-Port", str(port),
    ]
    try:
        completed = subprocess.run(
            command,
            cwd=ROOT,
            shell=False,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=_CDP_HELPER_TIMEOUT,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return _cdp_helper_result("helper_timeout", port)
    except OSError:
        return _cdp_helper_result("helper_spawn_failed", port)

    invalid = _cdp_helper_result(
        "helper_invalid_response",
        port,
        return_code=completed.returncode,
    )
    try:
        payload = json.loads(completed.stdout.strip())
    except (AttributeError, json.JSONDecodeError):
        return invalid

    if not isinstance(payload, dict):
        return invalid
    if not set(payload).issubset({"ok", "state", "port", "reason"}):
        return invalid
    ok = payload.get("ok")
    state = payload.get("state")
    reported_port = payload.get("port")
    reason = payload.get("reason")
    if type(ok) is not bool:
        return invalid
    if state not in _CDP_HELPER_RESPONSE_CODES:
        return invalid
    if type(reported_port) is not int or reported_port != port:
        return invalid
    if reason is not None and (not isinstance(reason, str) or not reason):
        return invalid

    expected_ok, expected_code = _CDP_HELPER_RESPONSE_CODES[state]
    if ok is not expected_ok or completed.returncode != expected_code:
        return invalid
    return _cdp_helper_result(
        state,
        port,
        ok=ok,
        return_code=completed.returncode,
    )


def _set_cdp_unavailable(manifest: dict, reason: str) -> str:
    log("Launcher", f"cdp action=unavailable reason={reason.replace('_', '-')}")
    manifest_set_cdp(
        manifest,
        status="unavailable",
        ownership="unknown",
        selected_port=None,
        url="",
        source="none",
        reason=reason,
    )
    return ""


def _set_cdp_reused(manifest: dict, port: int, preferred: int) -> str:
    url = f"http://127.0.0.1:{port}"
    log("Launcher", f"cdp action=reuse port={port}")
    manifest_set_cdp(
        manifest,
        status="ready",
        ownership="reused",
        selected_port=port,
        url=url,
        source="existing_endpoint",
        reason=(
            "reused_preferred_endpoint"
            if port == preferred
            else "reused_fallback_endpoint"
        ),
    )
    return url


def _set_cdp_helper_result(
    manifest: dict,
    port: int,
    preferred: int,
    *,
    ready: bool,
) -> str:
    url = f"http://127.0.0.1:{port}"
    status = "ready" if ready else "starting"
    reason = (
        (
            "helper_ready_preferred_endpoint"
            if port == preferred
            else "helper_ready_fallback_endpoint"
        )
        if ready
        else (
            "launch_requested_preferred_port"
            if port == preferred
            else "launch_requested_fallback_port"
        )
    )
    manifest_set_cdp(
        manifest,
        status=status,
        ownership="external",
        selected_port=port,
        url=url,
        source="chrome_helper",
        reason=reason,
    )
    log(
        "Launcher",
        f"cdp action={'ready' if ready else 'starting'} "
        f"port={port} source=chrome-helper",
    )
    return url


# ---------------------------------------------------------------------------
# Public: CDP — bounded discovery and non-blocking helper
# ---------------------------------------------------------------------------

def resolve_cdp(manifest: dict) -> str:
    """Resolve a local CDP conservatively without owning Chrome or its helper."""
    preferred = PREFERRED_CDP_PORT
    candidates = [
        port
        for port in range(preferred, preferred + _MAX_PORT_ATTEMPTS)
        if 1 <= port <= 65535
    ]
    free_ports = []

    # Complete read-only discovery precedes every launch request.
    for port in candidates:
        ok, _ = check_cdp_endpoint(port, timeout=_CDP_DISCOVERY_TIMEOUT)
        if ok:
            return _set_cdp_reused(manifest, port, preferred)
        if is_port_free(port):
            free_ports.append(port)
        else:
            log("Launcher", f"cdp action=skip port={port} reason=foreign-listener")

    if not free_ports:
        return _set_cdp_unavailable(manifest, "no_free_port")

    for port in free_ports:
        log("Launcher", f"cdp action=helper-request port={port}")
        result = _start_chrome_cdp(port)
        state = result.get("state") if isinstance(result, dict) else None

        if (
            (state == "already_ready" and result.get("ok") is True)
            or (state == "port_occupied" and result.get("ok") is False)
        ):
            ok, _ = check_cdp_endpoint(port, timeout=_CDP_DISCOVERY_TIMEOUT)
            if ok:
                return _set_cdp_reused(manifest, port, preferred)
            # The candidate was lost to a foreign listener or an unconfirmed
            # endpoint. Continue only with ports previously observed as free.
            continue

        if state == "launch_requested" and result.get("ok") is True:
            ready, _ = check_cdp_endpoint(
                port,
                timeout=_CDP_DISCOVERY_TIMEOUT,
            )
            return _set_cdp_helper_result(
                manifest,
                port,
                preferred,
                ready=ready,
            )

        if state in {
            "chrome_not_found",
            "launch_failed",
            "input_invalid",
            "helper_spawn_failed",
            "helper_timeout",
            "helper_invalid_response",
        }:
            return _set_cdp_unavailable(manifest, state)

        # Defensive handling for a malformed in-process fake or future helper
        # state: ambiguity must never propagate a candidate URL.
        return _set_cdp_unavailable(manifest, "helper_invalid_response")

    return _set_cdp_unavailable(manifest, "no_free_port")

# ---------------------------------------------------------------------------
# Public: Backend
# ---------------------------------------------------------------------------

def resolve_backend(manifest: dict) -> tuple[bool, str]:
    """
    Resolve the backend without changing port selection, identity validation,
    retry count, or ownership registry semantics.
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
                    isinstance(d, dict)
                    and d.get("ok") is True
                    and d.get("project") == "tennis-decision-ui"
                    and bool(d.get("instanceId"))
                ),
            )

            if ok and isinstance(data, dict):
                reported_pid = data.get("pid")
                if reported_pid != proc.pid:
                    log(
                        "Launcher",
                        "backend action=start-failed "
                        f"port={port} reason=pid-mismatch "
                        f"reported={reported_pid} expected={proc.pid}",
                    )
                    _terminate_and_remove(proc)
                    continue

                started_at = data.get("startedAt")
                if not isinstance(started_at, str) or not started_at.strip():
                    started_at = None
                manifest_set_backend(
                    manifest,
                    status="ready",
                    ownership="owned",
                    selected_port=port,
                    pid=proc.pid,
                    base_url=base_url,
                    health_url=health_url,
                    instance_id=data.get("instanceId"),
                    started_at=started_at,
                    source="launcher",
                    reason=(
                        "started_preferred_port"
                        if port == preferred
                        else "started_fallback_port"
                    ),
                )
                log("Launcher", f"backend action=start port={port}")
                return True, base_url

            log("Launcher", f"backend action=start-failed port={port} error={data}")
            _terminate_and_remove(proc)
            continue

        ok, data = check_backend_identity(health_url)
        if ok and isinstance(data, dict):
            reported_pid = data.get("pid")
            instance_id = data.get("instanceId")
            if (
                type(reported_pid) is int
                and reported_pid > 0
                and isinstance(instance_id, str)
                and instance_id.strip()
            ):
                started_at = data.get("startedAt")
                if not isinstance(started_at, str) or not started_at.strip():
                    started_at = None
                log("Launcher", "backend_reuse", service="backend", port=port, ownership="reused")
                manifest_set_backend(
                    manifest,
                    status="ready",
                    ownership="reused",
                    selected_port=port,
                    pid=reported_pid,
                    base_url=base_url,
                    health_url=health_url,
                    instance_id=instance_id,
                    started_at=started_at,
                    source="existing_health",
                    reason=(
                        "reused_preferred_port"
                        if port == preferred
                        else "reused_fallback_port"
                    ),
                )
                return True, base_url

        log(
            "Launcher",
            f"backend action=fallback-port port={port + 1} "
            "reason=foreign-occupant",
        )

    log("Launcher", "backend action=failed reason=max-attempts")
    manifest_set_backend(
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

# ---------------------------------------------------------------------------
# Public: Frontend
# ---------------------------------------------------------------------------

def resolve_frontend(manifest: dict, backend_port: int, cdp_url: str) -> tuple[bool, str]:
    """
    Reuse only a complete frontend identity bound to the selected backend.
    If no reusable frontend exists, start and validate at most five owned Vite
    processes on distinct free ports. Discovery of occupied ports is read-only.
    """
    backend_target = f"http://127.0.0.1:{backend_port}"
    preferred = PREFERRED_FRONTEND_PORT
    candidates = [
        candidate
        for candidate in range(
            preferred,
            preferred + (_MAX_PORT_ATTEMPTS * 5),
        )
        if candidate != backend_port
    ]
    free_candidates = []

    # Read-only discovery comes first so reuse remains possible even when the
    # local Vite CLI is unavailable.
    for candidate in candidates:
        frontend_url = f"http://127.0.0.1:{candidate}"
        if is_port_free(candidate):
            free_candidates.append(candidate)
            continue

        ok, identity = check_frontend_identity(
            frontend_url,
            timeout=_FRONTEND_IDENTITY_TIMEOUT,
            expected_backend_target=backend_target,
        )
        if ok:
            log("Launcher", f"frontend action=reuse port={candidate}")
            manifest_set_frontend(
                manifest,
                status="ready",
                ownership="reused",
                selected_port=candidate,
                pid=identity["pid"],
                url=frontend_url,
                instance_id=identity["instanceId"],
                started_at=identity["startedAt"],
                backend_target=identity["backendTarget"],
                source="existing_identity",
                reason=(
                    "reused_preferred_port"
                    if candidate == preferred
                    else "reused_fallback_port"
                ),
            )
            return True, frontend_url

        # A second read-only probe without the expected target is used only to
        # distinguish a valid frontend bound to another backend from a foreign
        # HTTP service. It never grants ownership or authorises termination.
        base_ok, base_identity = check_frontend_identity(
            frontend_url,
            timeout=_FRONTEND_IDENTITY_TIMEOUT,
        )
        mismatch = (
            base_ok
            and base_identity.get("backendTarget") != backend_target
        )
        log(
            "Launcher",
            f"frontend action=skip port={candidate} reason="
            f"{'backend-target-mismatch' if mismatch else 'foreign-identity'}",
        )

    if not free_candidates:
        log("Launcher", "frontend action=failed reason=no-free-port")
        manifest_set_frontend(
            manifest,
            status="failed",
            ownership="unknown",
            selected_port=None,
            pid=None,
            url=None,
            instance_id=None,
            started_at=None,
            backend_target=backend_target,
            source="launcher",
            reason="no_free_port",
        )
        return False, ""

    launch_attempts = 0
    for port in free_candidates:
        if launch_attempts >= _MAX_PORT_ATTEMPTS:
            break
        launch_attempts += 1

        if port != preferred:
            log("Launcher", f"frontend action=fallback-port port={port}")

        try:
            proc = _start_vite_frontend(port, backend_port, cdp_url)
        except FileNotFoundError:
            log("Launcher", "frontend action=failed reason=vite-cli-missing")
            manifest_set_frontend(
                manifest,
                status="failed",
                ownership="unknown",
                selected_port=None,
                pid=None,
                url=None,
                instance_id=None,
                started_at=None,
                backend_target=backend_target,
                source="launcher",
                reason="vite_cli_missing",
            )
            return False, ""

        log("Launcher", f"frontend action=start port={port}")
        frontend_url = f"http://127.0.0.1:{port}"
        identity_url = frontend_identity_url(frontend_url)

        ok, identity = wait_for_service(
            identity_url,
            "Launcher",
            timeout=_MAX_FRONTEND_WAIT,
            validator=lambda data, current_url=frontend_url, current_pid=proc.pid: (
                validate_frontend_identity(
                    data,
                    current_url,
                    expected_backend_target=backend_target,
                    expected_pid=current_pid,
                )
            ),
        )

        if ok and isinstance(identity, dict) and proc.poll() is None:
            manifest_set_frontend(
                manifest,
                status="ready",
                ownership="owned",
                selected_port=port,
                pid=proc.pid,
                url=frontend_url,
                instance_id=identity["instanceId"],
                started_at=identity["startedAt"],
                backend_target=identity["backendTarget"].rstrip("/"),
                source="launcher",
                reason=(
                    "started_preferred_port"
                    if port == preferred
                    else "started_fallback_port"
                ),
            )
            return True, frontend_url

        reason = "proc-exited" if ok else "identity-mismatch"
        log(
            "Launcher",
            f"frontend action=start-failed port={port} reason={reason}",
        )
        _terminate_and_remove(proc)

    log("Launcher", "frontend action=failed reason=max-attempts")
    manifest_set_frontend(
        manifest,
        status="failed",
        ownership="unknown",
        selected_port=None,
        pid=None,
        url=None,
        instance_id=None,
        started_at=None,
        backend_target=backend_target,
        source="launcher",
        reason="max_attempts",
    )
    return False, ""

# ---------------------------------------------------------------------------
# Owned-entry proof and structured shutdown
# ---------------------------------------------------------------------------

def _owned_entry_for_proc(proc: subprocess.Popen) -> dict | None:
    return next(
        (
            entry
            for entry in _owned_entries
            if isinstance(entry, dict) and entry.get("proc") is proc
        ),
        None,
    )


def _owned_entry_for_pid(pid: int) -> dict | None:
    return next(
        (
            entry
            for entry in _owned_entries
            if isinstance(entry, dict) and entry.get("pid") == pid
        ),
        None,
    )


def _entry_registration(entry: dict) -> tuple[bool, str]:
    if not isinstance(entry, dict):
        return False, "entry_not_object"
    if entry.get("role") not in {"backend", "frontend"}:
        return False, "invalid_owned_role"
    proc = entry.get("proc")
    pid = entry.get("pid")
    if type(pid) is not int or pid <= 0:
        return False, "invalid_owned_pid"
    if proc is None:
        return False, "missing_owned_process"
    try:
        if proc.pid != pid:
            return False, "owned_pid_mismatch"
    except Exception:
        return False, "owned_pid_unreadable"
    if not any(candidate is entry for candidate in _owned_entries):
        return False, "entry_not_registered"
    return True, "entry_registered"


def _remove_registered_entry(entry: dict) -> bool:
    for index, candidate in enumerate(_owned_entries):
        if candidate is entry:
            try:
                del _owned_entries[index]
                return True
            except Exception:
                return False
    return False


def _safe_poll(proc) -> tuple[str, str]:
    try:
        return (
            ("exited", "poll_confirmed_exit")
            if proc.poll() is not None
            else ("running", "poll_confirmed_running")
        )
    except Exception:
        return "unknown", "poll_failed"


def _wait_for_confirmed_exit(entry: dict, timeout: float) -> tuple[bool, str]:
    proc = entry["proc"]
    try:
        proc.wait(timeout=timeout)
        return True, "wait_confirmed_exit"
    except subprocess.TimeoutExpired:
        return False, "wait_timeout"
    except Exception:
        state, _ = _safe_poll(proc)
        if state == "exited":
            return True, "poll_confirmed_after_wait_error"
        return False, "wait_failed"


def _entry_result(
    entry: dict,
    *,
    state: str,
    clean_signal: str = "not_needed",
    force_kill: str = "not_needed",
    reason: str,
) -> dict:
    role = entry.get("role") if isinstance(entry, dict) else None
    pid = entry.get("pid") if isinstance(entry, dict) else None
    return {
        "role": role,
        "pid": pid,
        "state": state,
        "cleanSignal": clean_signal,
        "forceKill": force_kill,
        "reason": reason,
    }


def _send_clean_signal(entry: dict) -> dict:
    """Request a clean stop only for the exact currently registered entry."""
    registered, reason = _entry_registration(entry)
    if not registered:
        return {"ok": False, "status": "failed", "reason": reason}

    proc = entry["proc"]
    state, _ = _safe_poll(proc)
    if state == "exited":
        return {"ok": True, "status": "not_needed", "reason": "already_exited"}

    try:
        if sys.platform == "win32":
            ctrl_break = getattr(signal, "CTRL_BREAK_EVENT")
            proc.send_signal(ctrl_break)
            return {"ok": True, "status": "sent", "reason": "ctrl_break_sent"}

        try:
            pgid = os.getpgid(entry["pid"])
        except Exception:
            pgid = None

        if pgid == entry["pid"]:
            os.killpg(pgid, signal.SIGTERM)
            return {"ok": True, "status": "sent", "reason": "group_sigterm_sent"}

        proc.terminate()
        return {
            "ok": True,
            "status": "sent",
            "reason": (
                "root_sigterm_sent_non_dedicated_group"
                if pgid is not None
                else "root_sigterm_sent_group_unavailable"
            ),
        }
    except Exception:
        return {"ok": False, "status": "failed", "reason": "clean_signal_failed"}


def _force_kill_tree(entry: dict) -> dict:
    """Escalate only the exact entry still proven owned, then confirm exit."""
    registered, reason = _entry_registration(entry)
    if not registered:
        return {
            "ok": False,
            "state": "not_registered",
            "forceKill": "not_needed",
            "reason": reason,
        }

    proc = entry["proc"]
    state, _ = _safe_poll(proc)
    if state == "exited":
        return {
            "ok": True,
            "state": "already_exited",
            "forceKill": "not_needed",
            "reason": "exited_before_escalation",
        }

    if sys.platform == "win32":
        try:
            completed = subprocess.run(
                ["taskkill", "/PID", str(entry["pid"]), "/T", "/F"],
                capture_output=True,
                check=False,
                timeout=5,
            )
        except Exception:
            return {
                "ok": False,
                "state": "failed",
                "forceKill": "failed",
                "reason": "taskkill_execution_failed",
            }
        if completed.returncode != 0:
            return {
                "ok": False,
                "state": "failed",
                "forceKill": "failed",
                "reason": "taskkill_nonzero_exit",
            }
    else:
        try:
            try:
                pgid = os.getpgid(entry["pid"])
            except Exception:
                pgid = None
            if pgid == entry["pid"]:
                os.killpg(pgid, signal.SIGKILL)
            else:
                proc.kill()
        except Exception:
            return {
                "ok": False,
                "state": "failed",
                "forceKill": "failed",
                "reason": "force_kill_signal_failed",
            }

    confirmed, confirm_reason = _wait_for_confirmed_exit(
        entry,
        _FORCE_KILL_CONFIRM_GRACE,
    )
    if not confirmed:
        return {
            "ok": False,
            "state": "failed",
            "forceKill": "requested",
            "reason": f"force_kill_not_confirmed:{confirm_reason}",
        }
    return {
        "ok": True,
        "state": "force_killed",
        "forceKill": "requested",
        "reason": "force_kill_confirmed",
    }


def _stop_owned_entry(entry: dict, grace: float) -> dict:
    """Stop one owned entry without allowing its errors to escape."""
    registered, reason = _entry_registration(entry)
    if not registered:
        return _entry_result(entry, state="not_registered", reason=reason)

    proc = entry["proc"]
    poll_state, poll_reason = _safe_poll(proc)
    if poll_state == "exited":
        if _remove_registered_entry(entry):
            return _entry_result(
                entry,
                state="already_exited",
                reason="process_already_exited",
            )
        return _entry_result(
            entry,
            state="failed",
            reason="registry_remove_failed_after_exit",
        )

    signal_result = _send_clean_signal(entry)
    clean_signal = signal_result.get("status", "failed")

    confirmed, wait_reason = _wait_for_confirmed_exit(entry, grace)
    if confirmed:
        if _remove_registered_entry(entry):
            return _entry_result(
                entry,
                state="stopped_gracefully",
                clean_signal=clean_signal,
                reason=(
                    "graceful_exit_confirmed"
                    if signal_result.get("ok")
                    else "exit_confirmed_after_clean_signal_failure"
                ),
            )
        return _entry_result(
            entry,
            state="failed",
            clean_signal=clean_signal,
            reason="registry_remove_failed_after_graceful_exit",
        )

    force_result = _force_kill_tree(entry)
    force_state = force_result.get("state")
    force_kill = force_result.get("forceKill", "failed")
    if force_result.get("ok") and force_state in {"force_killed", "already_exited"}:
        if _remove_registered_entry(entry):
            return _entry_result(
                entry,
                state=force_state,
                clean_signal=clean_signal,
                force_kill=force_kill,
                reason=force_result.get("reason", "force_exit_confirmed"),
            )
        return _entry_result(
            entry,
            state="failed",
            clean_signal=clean_signal,
            force_kill=force_kill,
            reason="registry_remove_failed_after_force_exit",
        )

    return _entry_result(
        entry,
        state=("not_registered" if force_state == "not_registered" else "failed"),
        clean_signal=clean_signal,
        force_kill=force_kill,
        reason=force_result.get("reason", f"shutdown_failed:{poll_reason}:{wait_reason}"),
    )


# ---------------------------------------------------------------------------
# Internal: clean termination of a single failed proc
# ---------------------------------------------------------------------------

def _terminate_and_remove(proc: subprocess.Popen) -> dict:
    """Use the same safe path for a failed startup process."""
    entry = _owned_entry_for_proc(proc)
    if entry is None:
        return _entry_result(
            {"role": None, "pid": getattr(proc, "pid", None)},
            state="not_registered",
            reason="entry_not_registered",
        )
    try:
        return _stop_owned_entry(entry, _FAILED_PROCESS_GRACE)
    except Exception:
        return _entry_result(
            entry,
            state="failed",
            reason="startup_cleanup_exception",
        )


# ---------------------------------------------------------------------------
# Public: Browser
# ---------------------------------------------------------------------------

def open_browser(url: str):
    try:
        port = urlparse(url).port
    except (TypeError, ValueError):
        port = None
    log("Launcher", "browser_open", service="frontend", port=port)
    webbrowser.open(url)


# ---------------------------------------------------------------------------
# Public: Shutdown (owned processes only)
# ---------------------------------------------------------------------------

def shutdown_owned() -> dict:
    """Stop a snapshot of owned entries and return a complete summary."""
    try:
        log("Launcher", "shutdown action=owned-processes-only")
    except Exception:
        pass
    entries = list(_owned_entries)
    if not entries:
        return {
            "ok": True,
            "state": "already_empty",
            "attempted": 0,
            "stopped": 0,
            "failed": 0,
            "entries": [],
        }

    results = []
    for entry in entries:
        try:
            result = _stop_owned_entry(entry, _SHUTDOWN_GRACE)
        except Exception:
            result = _entry_result(
                entry,
                state="failed",
                reason="entry_shutdown_exception",
            )
        results.append(result)
        try:
            log(
                "Launcher",
                "shutdown "
                f"role={result.get('role')} "
                f"pid={result.get('pid')} "
                f"state={result.get('state')}",
            )
        except Exception:
            pass

    stopped_states = {"already_exited", "stopped_gracefully", "force_killed"}
    stopped = sum(1 for result in results if result.get("state") in stopped_states)
    failed = len(results) - stopped
    return {
        "ok": failed == 0,
        "state": "completed" if failed == 0 else "partial_failure",
        "attempted": len(results),
        "stopped": stopped,
        "failed": failed,
        "entries": results,
    }
