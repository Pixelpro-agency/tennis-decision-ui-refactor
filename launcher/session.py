"""
Session lock and manifest management.

The manifest lives under launcher/.runtime/ and records what this
launcher instance owns so shutdown never touches external processes.
"""

from __future__ import annotations

import ctypes
import json
import os
import sys
import tempfile
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from .config import (
    PREFERRED_BACKEND_PORT,
    PREFERRED_CDP_PORT,
    PREFERRED_FRONTEND_PORT,
)
from .system import check_backend_identity, check_frontend_identity

_SCHEMA_VERSION = 2
_LOCK_SCHEMA_VERSION = 2
_PROJECT_MARKER = "tennis-decision-ui"
_RUNTIME_DIR = Path(__file__).resolve().parent / ".runtime"
_LOCK_FILE = _RUNTIME_DIR / "launcher.lock"
_COORDINATION_FILE = _RUNTIME_DIR / "launcher.lock.guard"
_MANIFEST_FILE = _RUNTIME_DIR / "manifest.json"
_COORDINATION_TIMEOUT = 2.0
_COORDINATION_RETRY = 0.05
_SESSION_STATUSES = frozenset({"starting", "ready", "stopping", "stopped", "failed"})
_SERVICE_STATUSES = frozenset({"pending", "starting", "ready", "failed", "unavailable"})
_OWNERSHIP_VALUES = frozenset({"owned", "reused", "external", "unknown"})
_SERVICE_ROLES = ("backend", "frontend", "cdp")


def _ensure_runtime_dir():
    _RUNTIME_DIR.mkdir(parents=True, exist_ok=True)


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _normalize_executable(value):
    if not isinstance(value, str) or not value.strip():
        return None
    return os.path.normcase(os.path.normpath(value.strip()))


# ---------------------------------------------------------------------------
# Read-only process identity
# ---------------------------------------------------------------------------

def _probe_windows_process(pid: int) -> dict:
    from ctypes import wintypes

    PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    ERROR_INVALID_PARAMETER = 87

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.GetProcessTimes.argtypes = [
        wintypes.HANDLE,
        ctypes.POINTER(wintypes.FILETIME),
        ctypes.POINTER(wintypes.FILETIME),
        ctypes.POINTER(wintypes.FILETIME),
        ctypes.POINTER(wintypes.FILETIME),
    ]
    kernel32.GetProcessTimes.restype = wintypes.BOOL
    kernel32.QueryFullProcessImageNameW.argtypes = [
        wintypes.HANDLE,
        wintypes.DWORD,
        wintypes.LPWSTR,
        ctypes.POINTER(wintypes.DWORD),
    ]
    kernel32.QueryFullProcessImageNameW.restype = wintypes.BOOL
    kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel32.CloseHandle.restype = wintypes.BOOL

    handle = kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not handle:
        error = ctypes.get_last_error()
        if error == ERROR_INVALID_PARAMETER:
            return {"state": "dead", "reason": "pid_not_found", "identity": None}
        return {
            "state": "unknown",
            "reason": f"open_process_failed_{error}",
            "identity": None,
        }

    try:
        creation = wintypes.FILETIME()
        exit_time = wintypes.FILETIME()
        kernel_time = wintypes.FILETIME()
        user_time = wintypes.FILETIME()
        if not kernel32.GetProcessTimes(
            handle,
            ctypes.byref(creation),
            ctypes.byref(exit_time),
            ctypes.byref(kernel_time),
            ctypes.byref(user_time),
        ):
            error = ctypes.get_last_error()
            return {
                "state": "unknown",
                "reason": f"get_process_times_failed_{error}",
                "identity": None,
            }

        created = (creation.dwHighDateTime << 32) | creation.dwLowDateTime
        executable = None
        buffer = ctypes.create_unicode_buffer(32768)
        size = wintypes.DWORD(len(buffer))
        if kernel32.QueryFullProcessImageNameW(
            handle, 0, buffer, ctypes.byref(size)
        ):
            executable = buffer.value

        return {
            "state": "alive",
            "reason": "identity_verified",
            "identity": {
                "startFingerprint": f"windows-filetime:{created}",
                "executable": executable,
            },
        }
    finally:
        kernel32.CloseHandle(handle)


def _probe_linux_process(pid: int) -> dict:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return {"state": "dead", "reason": "pid_not_found", "identity": None}
    except PermissionError:
        return {
            "state": "unknown",
            "reason": "process_permission_denied",
            "identity": None,
        }
    except OSError:
        return {
            "state": "unknown",
            "reason": "process_probe_failed",
            "identity": None,
        }

    stat_path = Path(f"/proc/{pid}/stat")
    if not stat_path.exists():
        return {
            "state": "unknown",
            "reason": "process_identity_unavailable",
            "identity": None,
        }

    try:
        stat_text = stat_path.read_text(encoding="utf-8")
        closing = stat_text.rfind(")")
        if closing < 0:
            raise ValueError("malformed proc stat")
        fields_after_name = stat_text[closing + 2 :].split()
        start_ticks = fields_after_name[19]
        executable = None
        try:
            executable = os.readlink(f"/proc/{pid}/exe")
        except OSError:
            pass
        return {
            "state": "alive",
            "reason": "identity_verified",
            "identity": {
                "startFingerprint": f"linux-startticks:{start_ticks}",
                "executable": executable,
            },
        }
    except (OSError, ValueError, IndexError):
        return {
            "state": "unknown",
            "reason": "process_identity_unavailable",
            "identity": None,
        }


def probe_process_identity(pid: int) -> dict:
    """Return a read-only process identity result suitable for lock checks."""
    if type(pid) is not int or pid <= 0:
        return {"state": "unknown", "reason": "invalid_pid", "identity": None}
    if sys.platform == "win32":
        return _probe_windows_process(pid)
    if sys.platform.startswith("linux"):
        return _probe_linux_process(pid)

    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return {"state": "dead", "reason": "pid_not_found", "identity": None}
    except (PermissionError, OSError):
        return {
            "state": "unknown",
            "reason": "process_identity_unavailable",
            "identity": None,
        }
    return {
        "state": "unknown",
        "reason": "process_identity_unavailable",
        "identity": None,
    }


def create_launcher_session_identity(process_probe=probe_process_identity) -> dict:
    """Create one immutable launcher identity for the current execution."""
    pid = os.getpid()
    probe = process_probe(pid)
    identity = probe.get("identity") if isinstance(probe, dict) else None
    if not isinstance(identity, dict):
        identity = {"startFingerprint": None, "executable": None}
    else:
        identity = {
            "startFingerprint": identity.get("startFingerprint"),
            "executable": identity.get("executable"),
        }
    return {
        "sessionId": str(uuid.uuid4()),
        "pid": pid,
        "createdAt": _utc_timestamp(),
        "processIdentity": identity,
    }


# ---------------------------------------------------------------------------
# Cross-process coordination
# ---------------------------------------------------------------------------

def _try_lock_guard(handle) -> bool:
    handle.seek(0)
    if sys.platform == "win32":
        import msvcrt

        try:
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            return True
        except OSError:
            return False

    import fcntl

    try:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except BlockingIOError:
        return False


def _unlock_guard(handle):
    handle.seek(0)
    if sys.platform == "win32":
        import msvcrt

        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        return

    import fcntl

    fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


@contextmanager
def _coordination_guard(timeout: float = _COORDINATION_TIMEOUT):
    """OS advisory lock; the OS releases it automatically after process exit."""
    _ensure_runtime_dir()
    handle = open(_COORDINATION_FILE, "a+b", buffering=0)
    acquired = False
    try:
        handle.seek(0, os.SEEK_END)
        if handle.tell() == 0:
            handle.write(b"\0")
            handle.flush()
            os.fsync(handle.fileno())
        deadline = time.monotonic() + max(0.0, timeout)
        while True:
            if _try_lock_guard(handle):
                acquired = True
                break
            if time.monotonic() >= deadline:
                raise TimeoutError("coordination_timeout")
            time.sleep(_COORDINATION_RETRY)
        yield
    finally:
        if acquired:
            try:
                _unlock_guard(handle)
            except OSError:
                pass
        handle.close()


# ---------------------------------------------------------------------------
# Lock document and classification
# ---------------------------------------------------------------------------

def _lock_record(session_identity: dict) -> dict:
    return {
        "schema": _LOCK_SCHEMA_VERSION,
        "project": _PROJECT_MARKER,
        "sessionId": session_identity["sessionId"],
        "pid": session_identity["pid"],
        "createdAt": session_identity["createdAt"],
        "processIdentity": {
            "startFingerprint": session_identity.get("processIdentity", {}).get(
                "startFingerprint"
            ),
            "executable": session_identity.get("processIdentity", {}).get(
                "executable"
            ),
        },
    }


def _valid_lock_record(record) -> bool:
    if not isinstance(record, dict):
        return False
    if record.get("schema") != _LOCK_SCHEMA_VERSION:
        return False
    if record.get("project") != _PROJECT_MARKER:
        return False
    if not isinstance(record.get("sessionId"), str) or not record["sessionId"]:
        return False
    if type(record.get("pid")) is not int or record["pid"] <= 0:
        return False
    if not isinstance(record.get("createdAt"), str) or not record["createdAt"]:
        return False
    identity = record.get("processIdentity")
    return isinstance(identity, dict) and "startFingerprint" in identity


def _manifest_matches_lock(manifest, record: dict) -> bool:
    """Compare a lock with manifest schema 2 or the Prompt 1 schema 1."""
    if manifest is None:
        return True
    if not isinstance(manifest, dict):
        return False

    schema = manifest.get("schema")
    if schema == _SCHEMA_VERSION:
        session = manifest.get("session")
        if not isinstance(session, dict):
            return False
        manifest_session_id = session.get("sessionId")
        manifest_pid = session.get("launcherPid")
        manifest_identity = session.get("processIdentity")
    elif schema == 1:
        # Transitional compatibility only for an already-running Prompt 1
        # launcher. Schema 1 is never reusable as an application session.
        manifest_session_id = manifest.get("launcherSessionId")
        manifest_pid = manifest.get("launcherPid")
        manifest_identity = manifest.get("launcherProcessIdentity")
    else:
        return False

    if manifest_session_id != record.get("sessionId"):
        return False
    if manifest_pid != record.get("pid"):
        return False
    if not isinstance(manifest_identity, dict):
        return False
    return manifest_identity.get("startFingerprint") == record.get(
        "processIdentity", {}
    ).get("startFingerprint")


def classify_lock_text(
    text: str,
    manifest=None,
    process_probe=probe_process_identity,
) -> dict:
    """Classify an existing lock as active, stale, or unknown."""
    stripped = text.strip()
    if not stripped:
        return {"state": "unknown", "reason": "empty_lock", "record": None}

    if stripped.isdigit():
        pid = int(stripped)
        probe = process_probe(pid)
        if probe.get("state") == "dead":
            return {"state": "stale", "reason": "legacy_dead_pid", "record": None}
        return {
            "state": "unknown",
            "reason": "legacy_live_or_unverifiable_pid",
            "record": None,
        }

    try:
        record = json.loads(stripped)
    except json.JSONDecodeError:
        return {"state": "unknown", "reason": "malformed_json", "record": None}

    if not _valid_lock_record(record):
        return {
            "state": "unknown",
            "reason": "unsupported_or_invalid_lock",
            "record": record if isinstance(record, dict) else None,
        }

    probe = process_probe(record["pid"])
    probe_state = probe.get("state")
    if probe_state == "dead":
        return {"state": "stale", "reason": "dead_pid", "record": record}
    if probe_state != "alive":
        return {
            "state": "unknown",
            "reason": probe.get("reason") or "process_identity_unavailable",
            "record": record,
        }

    observed = probe.get("identity")
    expected = record.get("processIdentity")
    if not isinstance(observed, dict):
        return {
            "state": "unknown",
            "reason": "process_identity_unavailable",
            "record": record,
        }
    expected_fingerprint = expected.get("startFingerprint")
    observed_fingerprint = observed.get("startFingerprint")
    if not expected_fingerprint or not observed_fingerprint:
        return {
            "state": "unknown",
            "reason": "process_identity_unavailable",
            "record": record,
        }
    if expected_fingerprint != observed_fingerprint:
        return {"state": "stale", "reason": "pid_recycled", "record": record}

    expected_executable = _normalize_executable(expected.get("executable"))
    observed_executable = _normalize_executable(observed.get("executable"))
    if (
        expected_executable
        and observed_executable
        and expected_executable != observed_executable
    ):
        return {
            "state": "unknown",
            "reason": "process_executable_mismatch",
            "record": record,
        }

    if not _manifest_matches_lock(manifest, record):
        return {
            "state": "unknown",
            "reason": "manifest_lock_mismatch",
            "record": record,
        }

    return {"state": "active", "reason": "owner_verified", "record": record}


def classify_existing_lock(manifest=None, process_probe=probe_process_identity) -> dict:
    if not _LOCK_FILE.exists():
        return {"state": "absent", "reason": "lock_absent", "record": None}
    try:
        text = _LOCK_FILE.read_text(encoding="utf-8")
    except OSError:
        return {"state": "unknown", "reason": "lock_read_failed", "record": None}
    return classify_lock_text(text, manifest=manifest, process_probe=process_probe)


def _write_lock_exclusive(record: dict) -> dict:
    payload = json.dumps(record, sort_keys=True, separators=(",", ":")).encode("utf-8")
    fd = None
    created = False
    success = False
    try:
        fd = os.open(
            str(_LOCK_FILE),
            os.O_CREAT | os.O_EXCL | os.O_WRONLY,
            0o600,
        )
        created = True
        written = 0
        while written < len(payload):
            count = os.write(fd, payload[written:])
            if count <= 0:
                raise OSError("short_lock_write")
            written += count
        os.fsync(fd)
        success = True
        return {"ok": True, "reason": "lock_written"}
    except FileExistsError:
        return {"ok": False, "reason": "lock_already_exists"}
    except OSError:
        return {"ok": False, "reason": "lock_write_failed"}
    finally:
        if fd is not None:
            try:
                os.close(fd)
            except OSError:
                pass
        if created and not success:
            try:
                _LOCK_FILE.unlink(missing_ok=True)
            except OSError:
                pass


def acquire_or_recover_lock(
    session_identity: dict,
    manifest=None,
    process_probe=probe_process_identity,
    coordination_timeout: float = _COORDINATION_TIMEOUT,
) -> dict:
    """Acquire a new lock or reclaim a positively stale lock under one guard."""
    record = _lock_record(session_identity)
    try:
        with _coordination_guard(coordination_timeout):
            if not _LOCK_FILE.exists():
                write_result = _write_lock_exclusive(record)
                if write_result["ok"]:
                    return {
                        "acquired": True,
                        "state": "acquired",
                        "reason": "lock_created",
                    }
                return {
                    "acquired": False,
                    "state": "failed",
                    "reason": write_result["reason"],
                }

            classification = classify_existing_lock(
                manifest=manifest,
                process_probe=process_probe,
            )
            if classification["state"] == "active":
                return {
                    "acquired": False,
                    "state": "active",
                    "reason": classification["reason"],
                }
            if classification["state"] == "unknown":
                return {
                    "acquired": False,
                    "state": "unknown",
                    "reason": classification["reason"],
                }
            if classification["state"] != "stale":
                return {
                    "acquired": False,
                    "state": "failed",
                    "reason": "unexpected_lock_state",
                }

            try:
                _LOCK_FILE.unlink()
            except OSError:
                return {
                    "acquired": False,
                    "state": "failed",
                    "reason": "stale_lock_remove_failed",
                }

            write_result = _write_lock_exclusive(record)
            if write_result["ok"]:
                return {
                    "acquired": True,
                    "state": "reclaimed",
                    "reason": classification["reason"],
                }
            return {
                "acquired": False,
                "state": "failed",
                "reason": write_result["reason"],
            }
    except TimeoutError:
        return {
            "acquired": False,
            "state": "busy",
            "reason": "coordination_timeout",
        }
    except OSError:
        return {
            "acquired": False,
            "state": "failed",
            "reason": "coordination_failed",
        }


def _same_owner(record: dict, session_identity: dict) -> bool:
    if not _valid_lock_record(record):
        return False
    if record.get("sessionId") != session_identity.get("sessionId"):
        return False
    if record.get("pid") != session_identity.get("pid"):
        return False
    expected = record.get("processIdentity", {})
    current = session_identity.get("processIdentity", {})
    expected_fp = expected.get("startFingerprint")
    current_fp = current.get("startFingerprint")
    if expected_fp is not None or current_fp is not None:
        if expected_fp != current_fp:
            return False
    return True


def release_lock(
    session_identity: dict,
    coordination_timeout: float = _COORDINATION_TIMEOUT,
) -> dict:
    """Remove only the lock owned by session_identity; idempotent if absent."""
    try:
        with _coordination_guard(coordination_timeout):
            if not _LOCK_FILE.exists():
                return {"released": True, "state": "absent", "reason": "lock_absent"}
            try:
                record = json.loads(_LOCK_FILE.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                return {
                    "released": False,
                    "state": "unknown",
                    "reason": "lock_unverifiable",
                }
            if not _same_owner(record, session_identity):
                return {
                    "released": False,
                    "state": "not_owner",
                    "reason": "not_owner",
                }
            try:
                _LOCK_FILE.unlink()
            except OSError:
                return {
                    "released": False,
                    "state": "failed",
                    "reason": "owner_remove_failed",
                }
            return {
                "released": True,
                "state": "released",
                "reason": "owner_removed",
            }
    except TimeoutError:
        return {
            "released": False,
            "state": "busy",
            "reason": "coordination_timeout",
        }
    except OSError:
        return {
            "released": False,
            "state": "failed",
            "reason": "coordination_failed",
        }


# ---------------------------------------------------------------------------
# Manifest helpers
# ---------------------------------------------------------------------------

def _initial_service(role: str) -> dict:
    if role == "backend":
        return {
            "status": "pending",
            "ownership": "unknown",
            "requestedPort": PREFERRED_BACKEND_PORT,
            "selectedPort": None,
            "pid": None,
            "baseUrl": None,
            "healthUrl": None,
            "instanceId": None,
            "startedAt": None,
            "resolvedAt": None,
            "source": "none",
            "reason": "not_resolved",
        }
    if role == "frontend":
        return {
            "status": "pending",
            "ownership": "unknown",
            "requestedPort": PREFERRED_FRONTEND_PORT,
            "selectedPort": None,
            "pid": None,
            "url": None,
            "instanceId": None,
            "startedAt": None,
            "resolvedAt": None,
            "backendTarget": None,
            "source": "none",
            "reason": "not_resolved",
        }
    if role == "cdp":
        return {
            "status": "pending",
            "ownership": "unknown",
            "requestedPort": PREFERRED_CDP_PORT,
            "selectedPort": None,
            "pid": None,
            "url": "",
            "startedAt": None,
            "resolvedAt": None,
            "source": "none",
            "reason": "not_resolved",
        }
    raise ValueError(f"unknown service role: {role}")


_MISSING_SESSION_IDENTITY = object()


def _empty_manifest(launcher_pid, session_identity=_MISSING_SESSION_IDENTITY):
    if type(launcher_pid) is not int or launcher_pid <= 0:
        raise ValueError("launcher_pid must be a positive integer")
    if not isinstance(session_identity, dict):
        raise ValueError("session_identity is required and must be a dictionary")

    identity = session_identity
    session_id = identity.get("sessionId")
    identity_pid = identity.get("pid")
    created_at = identity.get("createdAt")
    process_identity = identity.get("processIdentity")

    if not isinstance(session_id, str) or not session_id.strip():
        raise ValueError("session_identity.sessionId must be a non-empty string")
    if type(identity_pid) is not int or identity_pid <= 0:
        raise ValueError("session_identity.pid must be a positive integer")
    if identity_pid != launcher_pid:
        raise ValueError("launcher_pid does not match session identity")
    if not isinstance(created_at, str) or not created_at.strip():
        raise ValueError("session_identity.createdAt must be a non-empty string")
    if not isinstance(process_identity, dict):
        raise ValueError("session_identity.processIdentity must be a dictionary")
    if "startFingerprint" not in process_identity or "executable" not in process_identity:
        raise ValueError("session_identity.processIdentity is incomplete")
    for field in ("startFingerprint", "executable"):
        value = process_identity.get(field)
        if value is not None and not isinstance(value, str):
            raise ValueError(
                f"session_identity.processIdentity.{field} must be a string or null"
            )

    return {
        "schema": _SCHEMA_VERSION,
        "project": _PROJECT_MARKER,
        "session": {
            "sessionId": identity.get("sessionId"),
            "launcherPid": identity.get("pid"),
            "processIdentity": {
                "startFingerprint": process_identity.get("startFingerprint"),
                "executable": process_identity.get("executable"),
            },
            "startedAt": identity.get("createdAt"),
            "status": "starting",
            "reason": "startup_in_progress",
        },
        "services": {
            role: _initial_service(role)
            for role in _SERVICE_ROLES
        },
    }


def _valid_positive_int(value) -> bool:
    return type(value) is int and value > 0


def _valid_optional_text(value) -> bool:
    return value is None or (isinstance(value, str) and bool(value.strip()))


def _url_port(value):
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return urlparse(value).port
    except ValueError:
        return None


def _normalise_local_http_base(value):
    if not isinstance(value, str) or not value.strip():
        return None
    normalised = value.rstrip("/")
    try:
        parsed = urlparse(normalised)
        port = parsed.port
    except ValueError:
        return None
    if parsed.scheme != "http":
        return None
    if parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        return None
    if type(port) is not int or port <= 0:
        return None
    if parsed.username is not None or parsed.password is not None:
        return None
    if parsed.query or parsed.fragment:
        return None
    if parsed.path not in {"", "/"}:
        return None
    return normalised


def _validate_service(role: str, service) -> str | None:
    if role not in _SERVICE_ROLES:
        return "unknown_service_role"
    if not isinstance(service, dict):
        return f"{role}_missing"

    status = service.get("status")
    ownership = service.get("ownership")
    if status not in _SERVICE_STATUSES:
        return f"{role}_invalid_status"
    if ownership not in _OWNERSHIP_VALUES:
        return f"{role}_invalid_ownership"

    requested_port = service.get("requestedPort")
    selected_port = service.get("selectedPort")
    if not _valid_positive_int(requested_port):
        return f"{role}_invalid_requested_port"
    if selected_port is not None and not _valid_positive_int(selected_port):
        return f"{role}_invalid_selected_port"

    pid = service.get("pid")
    if pid is not None and not _valid_positive_int(pid):
        return f"{role}_invalid_pid"
    if ownership == "owned" and not _valid_positive_int(pid):
        return f"{role}_owned_without_pid"

    if status != "pending":
        resolved_at = service.get("resolvedAt")
        if not isinstance(resolved_at, str) or not resolved_at.strip():
            return f"{role}_missing_resolved_at"

    source = service.get("source")
    reason = service.get("reason")
    if not isinstance(source, str) or not source:
        return f"{role}_invalid_source"
    if not isinstance(reason, str) or not reason:
        return f"{role}_invalid_reason"

    if role == "backend":
        base_url = service.get("baseUrl")
        health_url = service.get("healthUrl")
        instance_id = service.get("instanceId")
        if status == "ready":
            if ownership == "unknown":
                return "backend_ready_unknown_ownership"
            if not _valid_positive_int(selected_port):
                return "backend_ready_without_port"
            if not _valid_positive_int(pid):
                return "backend_ready_without_pid"
            if not all(
                isinstance(value, str) and value.strip()
                for value in (base_url, health_url, instance_id)
            ):
                return "backend_ready_missing_identity"
            if health_url != f"{base_url.rstrip('/')}/api/health":
                return "backend_incoherent_health_url"
        if base_url and selected_port is not None and _url_port(base_url) != selected_port:
            return "backend_url_port_mismatch"
        if health_url and selected_port is not None and _url_port(health_url) != selected_port:
            return "backend_health_port_mismatch"
        if not _valid_optional_text(service.get("startedAt")):
            return "backend_invalid_started_at"

    elif role == "frontend":
        url = service.get("url")
        instance_id = service.get("instanceId")
        started_at = service.get("startedAt")
        backend_target = service.get("backendTarget")
        if status == "ready":
            if ownership not in {"owned", "reused"}:
                return "frontend_ready_invalid_ownership"
            if not _valid_positive_int(selected_port):
                return "frontend_ready_without_port"
            if not _valid_positive_int(pid):
                return "frontend_ready_without_pid"
            if _normalise_local_http_base(url) is None:
                return "frontend_ready_invalid_url"
            if not isinstance(instance_id, str) or not instance_id.strip():
                return "frontend_ready_without_instance_id"
            if not isinstance(started_at, str) or not started_at.strip():
                return "frontend_ready_without_started_at"
            if _normalise_local_http_base(backend_target) is None:
                return "frontend_ready_invalid_backend_target"
        if url is not None and _normalise_local_http_base(url) is None:
            return "frontend_invalid_url"
        if url and selected_port is not None and _url_port(url) != selected_port:
            return "frontend_url_port_mismatch"
        if not _valid_optional_text(instance_id):
            return "frontend_invalid_instance_id"
        if not _valid_optional_text(started_at):
            return "frontend_invalid_started_at"
        if backend_target is not None and _normalise_local_http_base(backend_target) is None:
            return "frontend_invalid_backend_target"
        if status in {"failed", "unavailable"} and (
            instance_id is not None or started_at is not None
        ):
            return "frontend_failed_identity_must_be_null"

    else:
        if ownership == "owned":
            return "cdp_cannot_be_owned"
        if pid is not None:
            return "cdp_cannot_have_pid"
        url = service.get("url")
        if status in {"ready", "starting"}:
            if not _valid_positive_int(selected_port):
                return "cdp_resolved_without_port"
            if not isinstance(url, str) or not url.strip():
                return "cdp_resolved_without_url"
        if status == "unavailable":
            if url != "":
                return "cdp_unavailable_url_must_be_empty"
            if selected_port is not None:
                return "cdp_unavailable_port_must_be_null"
        if url and selected_port is not None and _url_port(url) != selected_port:
            return "cdp_url_port_mismatch"
        if not _valid_optional_text(service.get("startedAt")):
            return "cdp_invalid_started_at"

    return None


def validate_manifest_schema(manifest) -> dict:
    if not isinstance(manifest, dict):
        return {"valid": False, "reason": "manifest_not_object"}
    if manifest.get("schema") != _SCHEMA_VERSION:
        return {"valid": False, "reason": "unsupported_schema"}
    if manifest.get("project") != _PROJECT_MARKER:
        return {"valid": False, "reason": "invalid_project"}

    session = manifest.get("session")
    if not isinstance(session, dict):
        return {"valid": False, "reason": "session_missing"}
    if not isinstance(session.get("sessionId"), str) or not session["sessionId"]:
        return {"valid": False, "reason": "invalid_session_id"}
    if not _valid_positive_int(session.get("launcherPid")):
        return {"valid": False, "reason": "invalid_launcher_pid"}
    if not isinstance(session.get("processIdentity"), dict):
        return {"valid": False, "reason": "invalid_process_identity"}
    if "startFingerprint" not in session["processIdentity"]:
        return {"valid": False, "reason": "missing_start_fingerprint"}
    if not isinstance(session.get("startedAt"), str) or not session["startedAt"]:
        return {"valid": False, "reason": "invalid_session_started_at"}
    if session.get("status") not in _SESSION_STATUSES:
        return {"valid": False, "reason": "invalid_session_status"}
    if not isinstance(session.get("reason"), str) or not session["reason"]:
        return {"valid": False, "reason": "invalid_session_reason"}

    services = manifest.get("services")
    if not isinstance(services, dict):
        return {"valid": False, "reason": "services_missing"}
    for role in _SERVICE_ROLES:
        reason = _validate_service(role, services.get(role))
        if reason:
            return {"valid": False, "reason": reason}

    if session.get("status") == "ready":
        backend = services["backend"]
        frontend = services["frontend"]
        if backend.get("status") == "ready" and frontend.get("status") == "ready":
            backend_base = _normalise_local_http_base(backend.get("baseUrl"))
            frontend_target = _normalise_local_http_base(
                frontend.get("backendTarget")
            )
            if backend_base is None or frontend_target != backend_base:
                return {
                    "valid": False,
                    "reason": "frontend_backend_target_mismatch",
                }
    return {"valid": True, "reason": "valid"}


def _service_block(manifest: dict, role: str) -> dict:
    if role not in _SERVICE_ROLES:
        raise ValueError(f"unknown service role: {role}")
    services = manifest.get("services")
    if not isinstance(services, dict) or not isinstance(services.get(role), dict):
        raise ValueError(f"manifest missing service: {role}")
    return services[role]


def manifest_set_session_status(manifest: dict, status: str, reason: str):
    if status not in _SESSION_STATUSES:
        raise ValueError(f"invalid session status: {status}")
    if not isinstance(reason, str) or not reason:
        raise ValueError("session reason must be non-empty")
    session = manifest.get("session")
    if not isinstance(session, dict):
        raise ValueError("manifest missing session")
    session["status"] = status
    session["reason"] = reason


def _update_service(manifest: dict, role: str, **updates):
    current = _service_block(manifest, role)
    updated = dict(current)
    updated.update(updates)

    if updated.get("status") != "pending":
        updated["resolvedAt"] = updates.get("resolvedAt") or _utc_timestamp()

    reason = _validate_service(role, updated)
    if reason:
        raise ValueError(reason)
    manifest["services"][role] = updated


def manifest_set_backend(
    manifest: dict,
    *,
    status: str,
    ownership: str,
    selected_port: int | None,
    pid: int | None,
    base_url: str | None,
    health_url: str | None,
    instance_id: str | None,
    started_at=None,
    source: str,
    reason: str,
):
    if status in {"failed", "unavailable"}:
        selected_port = None
        pid = None
        base_url = None
        health_url = None
        instance_id = None
        started_at = None
        ownership = "unknown"
    _update_service(
        manifest,
        "backend",
        status=status,
        ownership=ownership,
        selectedPort=selected_port,
        pid=pid,
        baseUrl=base_url,
        healthUrl=health_url,
        instanceId=instance_id,
        startedAt=started_at,
        source=source,
        reason=reason,
    )


def manifest_set_frontend(
    manifest: dict,
    *,
    status: str,
    ownership: str,
    selected_port: int | None,
    pid: int | None,
    url: str | None,
    instance_id: str | None,
    started_at: str | None,
    backend_target: str | None,
    source: str,
    reason: str,
):
    if isinstance(backend_target, str):
        backend_target = backend_target.rstrip("/")
    if status in {"failed", "unavailable"}:
        selected_port = None
        pid = None
        url = None
        instance_id = None
        started_at = None
        ownership = "unknown"
    _update_service(
        manifest,
        "frontend",
        status=status,
        ownership=ownership,
        selectedPort=selected_port,
        pid=pid,
        url=url,
        instanceId=instance_id,
        startedAt=started_at,
        backendTarget=backend_target,
        source=source,
        reason=reason,
    )


def manifest_set_cdp(
    manifest: dict,
    *,
    status: str,
    ownership: str,
    selected_port: int | None,
    url: str,
    source: str,
    reason: str,
):
    if ownership == "owned":
        raise ValueError("cdp_cannot_be_owned")
    if status == "unavailable":
        selected_port = None
        url = ""
        ownership = "unknown"
    _update_service(
        manifest,
        "cdp",
        status=status,
        ownership=ownership,
        selectedPort=selected_port,
        pid=None,
        url=url,
        startedAt=None,
        source=source,
        reason=reason,
    )


def write_manifest(data: dict):
    """Atomic write: temp file in same dir, then replace."""
    _ensure_runtime_dir()
    tmp = None
    try:
        fd, tmp = tempfile.mkstemp(dir=str(_RUNTIME_DIR), suffix=".tmp")
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        Path(tmp).replace(_MANIFEST_FILE)
    except OSError:
        if tmp:
            try:
                Path(tmp).unlink(missing_ok=True)
            except OSError:
                pass


def read_manifest() -> dict | None:
    if not _MANIFEST_FILE.exists():
        return None
    try:
        return json.loads(_MANIFEST_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def _manifest_owner_matches(manifest: dict, session_identity: dict) -> bool:
    session = manifest.get("session")
    if not isinstance(session, dict):
        return False
    if session.get("sessionId") != session_identity.get("sessionId"):
        return False
    if session.get("launcherPid") != session_identity.get("pid"):
        return False
    return True


def remove_manifest(session_identity: dict) -> dict:
    """Remove only the current session's schema-2 manifest."""
    if not _MANIFEST_FILE.exists():
        return {"removed": True, "state": "absent", "reason": "manifest_absent"}
    try:
        manifest = json.loads(_MANIFEST_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"removed": False, "state": "unknown", "reason": "manifest_corrupt"}
    except OSError:
        return {"removed": False, "state": "failed", "reason": "manifest_read_failed"}

    if not isinstance(manifest, dict) or manifest.get("schema") != _SCHEMA_VERSION:
        return {
            "removed": False,
            "state": "unknown",
            "reason": "unsupported_manifest_schema",
        }
    if not _manifest_owner_matches(manifest, session_identity):
        return {"removed": False, "state": "not_owner", "reason": "not_owner"}
    try:
        _MANIFEST_FILE.unlink()
    except OSError:
        return {
            "removed": False,
            "state": "failed",
            "reason": "owner_remove_failed",
        }
    return {"removed": True, "state": "removed", "reason": "owner_removed"}


def is_manifest_reusable(manifest: dict) -> bool:
    """Return True only for a complete schema-2 identity-validated session."""
    validation = validate_manifest_schema(manifest)
    if not validation["valid"]:
        return False

    session = manifest["session"]
    services = manifest["services"]
    backend = services["backend"]
    frontend = services["frontend"]
    if session.get("status") != "ready":
        return False
    if backend.get("status") != "ready" or frontend.get("status") != "ready":
        return False

    base_url = backend.get("baseUrl")
    health_url = backend.get("healthUrl")
    frontend_url = frontend.get("url")
    recorded_instance = backend.get("instanceId")
    recorded_pid = backend.get("pid")
    if health_url != f"{base_url.rstrip('/')}/api/health":
        return False

    ok, data = check_backend_identity(health_url, timeout=2.0)
    if not ok or not isinstance(data, dict):
        return False
    if data.get("project") != _PROJECT_MARKER:
        return False
    if data.get("instanceId") != recorded_instance:
        return False
    if data.get("pid") != recorded_pid:
        return False

    frontend_instance = frontend.get("instanceId")
    frontend_pid = frontend.get("pid")
    frontend_port = frontend.get("selectedPort")
    frontend_target = frontend.get("backendTarget")
    ok2, frontend_data = check_frontend_identity(
        frontend_url,
        timeout=2.0,
        expected_backend_target=base_url,
        expected_pid=frontend_pid,
    )
    if not ok2 or not isinstance(frontend_data, dict):
        return False
    if frontend_data.get("instanceId") != frontend_instance:
        return False
    if frontend_data.get("pid") != frontend_pid:
        return False
    if frontend_data.get("frontendPort") != frontend_port:
        return False
    if frontend_data.get("backendTarget") != frontend_target:
        return False
    if frontend_data.get("backendTarget") != base_url.rstrip("/"):
        return False
    return True


def get_owned_pids(manifest: dict) -> list[int]:
    services = manifest.get("services") if isinstance(manifest, dict) else None
    if not isinstance(services, dict):
        return []
    result = []
    for role in ("backend", "frontend"):
        service = services.get(role)
        if (
            isinstance(service, dict)
            and service.get("ownership") == "owned"
            and _valid_positive_int(service.get("pid"))
        ):
            result.append(service["pid"])
    return result
