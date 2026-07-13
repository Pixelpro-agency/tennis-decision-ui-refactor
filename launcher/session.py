"""
Session lock and manifest management.

The manifest lives under launcher/.runtime/ and records what this
launcher instance owns so shutdown never touches external processes.
"""

import json
import os
import tempfile
import time
from pathlib import Path

from .system import check_backend_identity, check_http_health

_SCHEMA_VERSION = 1
_RUNTIME_DIR = Path(__file__).resolve().parent / ".runtime"
_LOCK_FILE = _RUNTIME_DIR / "launcher.lock"
_MANIFEST_FILE = _RUNTIME_DIR / "manifest.json"


def _ensure_runtime_dir():
    _RUNTIME_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Lock helpers
# ---------------------------------------------------------------------------

def acquire_lock():
    """
    Create the lock file exclusively.
    Returns True on success, False if another live process holds it.
    """
    _ensure_runtime_dir()
    try:
        fd = os.open(str(_LOCK_FILE), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(os.getpid()).encode())
        os.close(fd)
        return True
    except FileExistsError:
        return False
    except OSError:
        return False


def release_lock():
    """Remove the lock file; idempotent."""
    try:
        _LOCK_FILE.unlink(missing_ok=True)
    except OSError:
        pass


def lock_held_by_live_pid():
    """
    Return True when the lock file exists and the recorded PID is still
    running.
    """
    if not _LOCK_FILE.exists():
        return False
    try:
        pid = int(_LOCK_FILE.read_text().strip())
        os.kill(pid, 0)
        return True
    except (ValueError, OSError):
        return False


def reclaim_stale_lock():
    """
    If the lock file's PID is dead, remove it so we can re-acquire.
    Returns True if reclaimed or already absent.
    """
    if not _LOCK_FILE.exists():
        return True
    if not lock_held_by_live_pid():
        try:
            _LOCK_FILE.unlink(missing_ok=True)
        except OSError:
            pass
        return True
    return False


# ---------------------------------------------------------------------------
# Manifest helpers
# ---------------------------------------------------------------------------

def _empty_manifest(launcher_pid):
    return {
        "schema": _SCHEMA_VERSION,
        "launcherPid": launcher_pid,
        "startedAt": time.time(),
        "status": "starting",
        "backendBaseUrl": None,   # e.g. http://127.0.0.1:3001
        "backendHealthUrl": None, # e.g. http://127.0.0.1:3001/api/health
        "frontendUrl": None,
        "cdpUrl": "",
        "cdpStatus": "unavailable",
        "backendInstanceId": None,
        "ownedPids": [],
        "ownership": {},
    }


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


def remove_manifest():
    try:
        _MANIFEST_FILE.unlink(missing_ok=True)
    except OSError:
        pass


def is_manifest_reusable(manifest: dict) -> bool:
    """Return True only for a complete, identity-validated reusable session."""
    if not manifest or manifest.get("schema") != _SCHEMA_VERSION:
        return False

    base_url = manifest.get("backendBaseUrl")
    health_url = manifest.get("backendHealthUrl")
    frontend_url = manifest.get("frontendUrl")
    recorded_instance = manifest.get("backendInstanceId")

    if not all(isinstance(value, str) and value.strip() for value in (
        base_url, health_url, frontend_url, recorded_instance
    )):
        return False

    # The health endpoint must be derived from the recorded base URL, not from
    # a different backend instance on another host or port.
    normalized_base = base_url.rstrip("/")
    if health_url != f"{normalized_base}/api/health":
        return False

    ok, data = check_backend_identity(health_url, timeout=2.0)
    if not ok or not isinstance(data, dict):
        return False
    if data.get("project") != "tennis-decision-ui":
        return False
    if data.get("instanceId") != recorded_instance:
        return False

    reported_pid = data.get("pid")
    if type(reported_pid) is not int or reported_pid <= 0:
        return False

    ok2, _ = check_http_health(frontend_url, timeout=2.0)
    return ok2


def manifest_set_backend(manifest: dict, base_url: str, health_url: str,
                         instance_id: str | None, pid: int | None, owned: bool):
    manifest["backendBaseUrl"] = base_url
    manifest["backendHealthUrl"] = health_url
    manifest["backendInstanceId"] = instance_id
    if owned and pid:
        _register_owned(manifest, pid, "backend")


def manifest_set_frontend(manifest: dict, url: str, pid: int | None, owned: bool):
    manifest["frontendUrl"] = url
    if owned and pid:
        _register_owned(manifest, pid, "frontend")


def manifest_set_cdp(manifest: dict, url: str, status: str | None = None):
    manifest["cdpUrl"] = url or ""
    manifest["cdpStatus"] = status or ("reuse" if url else "unavailable")
    # CDP is never owned by the launcher.


def _register_owned(manifest: dict, pid: int, role: str):
    if pid not in manifest["ownedPids"]:
        manifest["ownedPids"].append(pid)
    manifest["ownership"][str(pid)] = role


def get_owned_pids(manifest: dict) -> list[int]:
    return list(manifest.get("ownedPids", []))
