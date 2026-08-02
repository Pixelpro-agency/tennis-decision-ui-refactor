"""
Read-only system helpers for the launcher.

Invariants:
- No process kill by port.
- All network checks use short, bounded timeouts.
- No infinite loops.
"""

import json
import math
import re
import socket
import threading
import time
import urllib.request
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

_MAX_LOG_TEXT = 800
_REDACTED = "<redacted>"
_ALLOWED_LOG_FIELDS = (
    "eventId", "role", "state", "status", "reason", "mode", "source",
    "scope", "service", "ownership", "pid", "port", "attempt", "count",
    "requested", "graceful", "forceKilled", "alreadyExited", "remaining",
    "active", "stopping", "graphUrlCount", "hasBetfairUrl", "ok", "code",
    "text",
)


def _normalise_log_code(value, fallback="legacy_message"):
    text = re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower()).strip("_")
    return text if re.fullmatch(r"[a-z][a-z0-9_]*", text or "") else fallback


def sanitize_runtime_text(value, max_length=_MAX_LOG_TEXT):
    try:
        text = str(value if value is not None else "")
    except Exception:
        text = ""
    text = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", text)
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\b(?:https?|wss?)://[^\s\"'<>]+", _REDACTED, text, flags=re.I)

    json_pattern = re.compile(
        r'''(["'])(Authorization|Proxy-Authorization|Cookie|Set-Cookie|'''
        r'''BETFAIR_APP_KEY|APP_KEY|app_key|token|access_token|refresh_token|'''
        r'''session|password|secret)\1\s*:\s*'''
        r'''(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,}\]]+)''',
        re.I,
    )
    text = json_pattern.sub(
        lambda match: (
            f"{match.group(1)}{match.group(2)}{match.group(1)}:"
            f"{match.group(1)}{_REDACTED}{match.group(1)}"
        ),
        text,
    )
    text = re.sub(
        r"\b(Authorization|Proxy-Authorization|Cookie|Set-Cookie)\s*:\s*.*$",
        lambda match: match.group(1) + ": " + _REDACTED,
        text,
        flags=re.I,
    )
    text = re.sub(
        r"\b(BETFAIR_APP_KEY|APP_KEY|app_key|token|access_token|refresh_token|session|password|secret)"
        r"\s*[:=]\s*(?:\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|[^\s,;}\]]+)",
        lambda match: match.group(1) + "=" + _REDACTED,
        text,
        flags=re.I,
    )
    text = re.sub(r"\bBearer\s+[^\s,;]+", "Bearer " + _REDACTED, text, flags=re.I)

    text = re.sub(r"\\\\\?\\[A-Za-z]:[\\/][^\s\"'<>]*", _REDACTED, text)
    text = re.sub(r"\\\\[^\\/\s\"'<>]+[\\/][^\\/\s\"'<>]+(?:[\\/][^\s\"'<>]*)*", _REDACTED, text)
    text = re.sub(r"\b[A-Za-z]:[\\/][^\s\"'<>]*", _REDACTED, text)
    text = re.sub(
        r"(^|[\s=(,:])/(?!/)(?:[A-Za-z0-9._~+-]+(?:/[A-Za-z0-9._~+-]+)*)",
        lambda match: match.group(1) + _REDACTED,
        text,
    )
    if len(text) > max_length:
        suffix = "<truncated>"
        text = text[: max(0, max_length - len(suffix))] + suffix
    return text

def sanitize_child_output(value):
    if isinstance(value, bytes):
        value = value.decode("utf-8", errors="replace")
    return sanitize_runtime_text(value)


def _parse_legacy_event(message):
    text = sanitize_runtime_text(message)
    match = re.match(r"^(?P<service>[a-zA-Z0-9_-]+)\s+action=(?P<action>[a-zA-Z0-9_-]+)(?P<rest>.*)$", text)
    if not match:
        return "legacy_message", {"text": text}
    fields = {}
    for key, value in re.findall(r"([A-Za-z][A-Za-z0-9]*)=([^\s]+)", match.group("rest")):
        if key not in _ALLOWED_LOG_FIELDS:
            continue
        if key in {"pid", "port", "attempt", "count", "requested", "graceful", "forceKilled", "alreadyExited", "remaining", "active", "stopping", "graphUrlCount"}:
            try:
                fields[key] = int(value)
            except ValueError:
                continue
        elif key in {"hasBetfairUrl", "ok"}:
            fields[key] = value.lower() == "true"
        else:
            fields[key] = value
    return _normalise_log_code(f"{match.group('service')}_{match.group('action')}", "legacy_message"), fields


def log(prefix, event, **fields):
    try:
        if fields:
            event_code = _normalise_log_code(event)
            safe_fields = fields
        else:
            event_code, safe_fields = _parse_legacy_event(event)
        parts = [f"[{sanitize_runtime_text(prefix, 40)}]", f"event={event_code}"]
        for key in _ALLOWED_LOG_FIELDS:
            if key not in safe_fields:
                continue
            value = safe_fields[key]
            is_finite_number = (
                isinstance(value, (int, float))
                and not isinstance(value, bool)
                and math.isfinite(value)
            )
            if value is None or isinstance(value, (str, bool)) or is_finite_number:
                parts.append(f"{key}={sanitize_runtime_text(value, 160)}")
        print(" ".join(parts), flush=True)
    except Exception:
        try:
            print("[Launcher] event=logger_failure", flush=True)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Output streaming
# ---------------------------------------------------------------------------

def reader_thread(proc, prefix):
    try:
        for raw in iter(proc.stdout.readline, b""):
            text = sanitize_child_output(raw)
            if text:
                log(prefix, "child_output", text=text)
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

def validate_cdp_version(data, expected_port: int) -> bool:
    """Validate a local Chromium /json/version WebSocket endpoint."""
    if type(expected_port) is not int or not 1 <= expected_port <= 65535:
        return False
    if not isinstance(data, dict):
        return False

    websocket_url = data.get("webSocketDebuggerUrl")
    if not isinstance(websocket_url, str) or not websocket_url.strip():
        return False

    try:
        parsed = urlparse(websocket_url)
        port = parsed.port
    except ValueError:
        return False

    if parsed.scheme not in {"ws", "wss"}:
        return False
    if parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        return False
    if type(port) is not int or port != expected_port:
        return False
    if parsed.username is not None or parsed.password is not None:
        return False
    if parsed.query or parsed.fragment:
        return False

    prefix = "/devtools/browser/"
    if not parsed.path.startswith(prefix):
        return False
    browser_id = parsed.path[len(prefix):]
    if not browser_id or "/" in browser_id:
        return False
    return True


def check_cdp_endpoint(
    port: int,
    host: str = "127.0.0.1",
    timeout: float = 2.0,
) -> tuple[bool, dict]:
    """Probe /json/version once and return only a strongly validated CDP."""
    if type(port) is not int or not 1 <= port <= 65535:
        return False, {}
    url = f"http://{host}:{port}/json/version"
    ok, data = check_http_health(url, timeout=timeout)
    if ok and validate_cdp_version(data, port):
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


# ---------------------------------------------------------------------------
# Frontend identity check
# ---------------------------------------------------------------------------

def _normalise_http_base(value: str) -> str | None:
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


def frontend_identity_url(frontend_url: str) -> str:
    """Build the launcher identity endpoint for a local frontend base URL."""
    base = _normalise_http_base(frontend_url)
    if base is None:
        raise ValueError("frontend URL must be local HTTP with an explicit port")
    return f"{base}/__launcher/health"


def validate_frontend_identity(
    data,
    frontend_url: str,
    expected_backend_target: str | None = None,
    expected_pid: int | None = None,
) -> bool:
    """Validate a complete frontend identity against its observed endpoint."""
    try:
        frontend_base = _normalise_http_base(frontend_url)
        frontend_port = urlparse(frontend_base).port if frontend_base else None
    except ValueError:
        frontend_port = None
    if frontend_base is None or type(frontend_port) is not int:
        return False
    if not isinstance(data, dict):
        return False
    if data.get("ok") is not True:
        return False
    if data.get("project") != "tennis-decision-ui":
        return False
    if data.get("service") != "frontend":
        return False
    if not isinstance(data.get("instanceId"), str) or not data["instanceId"].strip():
        return False
    if type(data.get("pid")) is not int or data["pid"] <= 0:
        return False
    if not isinstance(data.get("startedAt"), str) or not data["startedAt"].strip():
        return False
    if type(data.get("frontendPort")) is not int or data["frontendPort"] <= 0:
        return False
    if data["frontendPort"] != frontend_port:
        return False

    backend_target = _normalise_http_base(data.get("backendTarget"))
    if backend_target is None:
        return False
    if expected_backend_target is not None:
        expected_target = _normalise_http_base(expected_backend_target)
        if expected_target is None or backend_target != expected_target:
            return False
    if expected_pid is not None:
        if type(expected_pid) is not int or expected_pid <= 0:
            return False
        if data["pid"] != expected_pid:
            return False
    return True


def check_frontend_identity(
    frontend_url: str,
    timeout: float = 2.0,
    expected_backend_target: str | None = None,
    expected_pid: int | None = None,
) -> tuple[bool, dict]:
    """Probe and validate the local Vite launcher identity endpoint once."""
    try:
        identity_url = frontend_identity_url(frontend_url)
    except ValueError:
        return False, {}
    ok, data = check_http_health(identity_url, timeout=timeout)
    if not ok or not validate_frontend_identity(
        data,
        frontend_url,
        expected_backend_target=expected_backend_target,
        expected_pid=expected_pid,
    ):
        return False, {}
    result = dict(data)
    result["backendTarget"] = result["backendTarget"].rstrip("/")
    return True, result
