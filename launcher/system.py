"""
Read-only system helpers for the launcher.

Invariants:
- No process kill by port.
- All network checks use short, bounded timeouts.
- No infinite loops.
"""

import json
import socket
import threading
import time
import urllib.request

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def log(prefix, message):
    print(f"[{prefix}] {message}", flush=True)


# ---------------------------------------------------------------------------
# Output streaming
# ---------------------------------------------------------------------------

def reader_thread(proc, prefix):
    try:
        for raw in iter(proc.stdout.readline, b""):
            text = raw.decode("utf-8", errors="replace").rstrip()
            if text:
                log(prefix, text)
    except Exception:
        pass


def start_reader_thread(proc, prefix):
    t = threading.Thread(target=reader_thread, args=(proc, prefix), daemon=True)
    t.start()
    return t


# ---------------------------------------------------------------------------
# Port probing (read-only)
# ---------------------------------------------------------------------------

def is_port_free(port: int, host: str = "127.0.0.1") -> bool:
    """Return True when nothing is bound to host:port."""
    try:
        with socket.create_connection((host, port), timeout=0.3):
            return False          # something answered → port is taken
    except (ConnectionRefusedError, OSError):
        return True               # refused or timed out → port is free


def find_free_port(preferred: int, host: str = "127.0.0.1", max_attempts: int = 20) -> int | None:
    """
    Return the first free port starting from preferred.
    Returns None after max_attempts consecutive occupied ports.
    """
    for offset in range(max_attempts):
        candidate = preferred + offset
        if is_port_free(candidate, host):
            return candidate
    return None


# ---------------------------------------------------------------------------
# HTTP health check
# ---------------------------------------------------------------------------

def check_http_health(url: str, timeout: float = 2.0) -> tuple[bool, object]:
    """
    GET url and return (True, parsed_json_or_body) on success.
    Returns (False, error_string) on any failure.
    """
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            if body.strip().startswith("{"):
                return True, json.loads(body)
            return True, body
    except Exception as exc:
        return False, str(exc)


def wait_for_service(url: str, prefix: str, timeout: float, validator=None) -> tuple[bool, object]:
    """
    Poll url every 0.5 s until timeout.
    validator(data) → bool controls acceptance; None means any 200 is ok.
    """
    deadline = time.time() + timeout
    last_error = None
    while time.time() < deadline:
        ok, data = check_http_health(url, timeout=2.0)
        if ok:
            if validator is None or validator(data):
                return True, data
            last_error = f"validator failed: {data}"
        else:
            last_error = data
        time.sleep(0.5)
    return False, last_error


# ---------------------------------------------------------------------------
# CDP check
# ---------------------------------------------------------------------------

def check_cdp_endpoint(port: int, host: str = "127.0.0.1", timeout: float = 2.0) -> tuple[bool, dict]:
    """
    Return (True, json_data) when the CDP /json/version endpoint is reachable
    and carries a webSocketDebuggerUrl.
    """
    url = f"http://{host}:{port}/json/version"
    ok, data = check_http_health(url, timeout=timeout)
    if ok and isinstance(data, dict) and data.get("webSocketDebuggerUrl"):
        return True, data
    return False, {}


# ---------------------------------------------------------------------------
# Backend identity check
# ---------------------------------------------------------------------------

def check_backend_identity(url: str, timeout: float = 2.0) -> tuple[bool, dict]:
    """
    Return (True, health_json) when url is a Tennis Decision UI backend.
    Criteria: ok==True and project=='tennis-decision-ui'.
    """
    ok, data = check_http_health(url, timeout=timeout)
    if not ok or not isinstance(data, dict):
        return False, {}
    if data.get("ok") is True and data.get("project") == "tennis-decision-ui":
        return True, data
    return False, data
