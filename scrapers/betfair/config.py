import os
import math
import re
import sys
from datetime import datetime
from pathlib import Path

from .diagnostic_redaction import redact_text

fileName = "_" * 2 + "file" + "_" * 2
PROJECT_ROOT = Path(globals()[fileName]).resolve().parents[2]
def _read_betfair_app_key_from_env_file(env_file):
    try:
        lines = Path(env_file).read_text(
            encoding="utf-8-sig"
        ).splitlines()
    except OSError:
        return None

    for raw_line in lines:
        line = raw_line.strip()

        if not line or line.startswith("#"):
            continue

        if line.startswith("export"):
            remainder = line[len("export"):]

            if remainder and remainder[0].isspace():
                line = remainder.lstrip()

        key, separator, value = line.partition("=")

        if separator != "=" or key.strip() != "BETFAIR_APP_KEY":
            continue

        value = value.strip()

        if (
            len(value) >= 2
            and value[0] == value[-1]
            and value[0] in ("'", '"')
        ):
            value = value[1:-1]

        return value

    return None


def resolve_betfair_app_key(environ=None, env_file=None):
    if environ is None:
        environ = os.environ

    environment_value = environ.get("BETFAIR_APP_KEY")

    if (
        environment_value is not None
        and environment_value.strip()
    ):
        return environment_value

    if env_file is None:
        env_file = PROJECT_ROOT / ".env"

    value = _read_betfair_app_key_from_env_file(env_file)

    if value is not None and value.strip():
        return value

    raise RuntimeError("BETFAIR_APP_KEY is required")


APP_KEY = resolve_betfair_app_key()
DEFAULT_PERSISTENT_PROFILE = r"C:\BetfairChromeProfile"

CACHE_DIR = PROJECT_ROOT / "backend" / "betfair_cache"
LOG_FILE = PROJECT_ROOT / "backend" / "betfair_scraper.log"
NETWORK_DUMP_DIR = PROJECT_ROOT / "backend" / "betfair_network_dump"

BETFAIR_HOSTS = {
    "www.betfair.it",
    "ero.betfair.it",
    "graphs.betfair.it",
    "scan-inbf.betfair.it",
    "lbr.betfair.it",
    "ips.betfair.it",
    "ssc.betfair.it",
    "smd.betfair.it",
    "usp.betfair.it",
    "apieds.betfair.it",
}

EXCLUDED_HOSTS = {
    "google.com",
    "www.google.com",
    "google-analytics.com",
    "www.google-analytics.com",
    "doubleclick.net",
    "www.doubleclick.net",
    "snapchat.com",
    "www.snapchat.com",
    "qualtrics.com",
    "www.qualtrics.com",
    "adservice.google.com",
}

INTERESTING_PATH_KEYWORDS = (
    "readonly",
    "byevent",
    "bymarket",
    "graph",
    "market",
    "runner",
    "price",
    "history",
    "traded",
    "ladder",
    "chart",
)


_LOG_LEVELS = {"debug", "info", "warn", "error"}
_LOG_FIELDS = (
    "eventId", "role", "state", "status", "reason", "mode", "source",
    "scope", "service", "ownership", "pid", "port", "attempt", "count",
    "requested", "graceful", "forceKilled", "alreadyExited", "remaining",
    "active", "stopping", "graphUrlCount", "hasBetfairUrl", "ok", "code",
    "text",
)


def _runtime_text(value, limit=800):
    text = redact_text(str(value))
    text = re.sub(r"\x1b\[[0-?]*[ -/]*[@-~]", "", text)
    text = re.sub(r"[\x00-\x1f\x7f-\x9f]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\b(?:https?|wss?)://[^\s\"'<>]+", "<REDACTED>", text, flags=re.I)
    text = re.sub(r"\b[A-Za-z]:\\(?:[^\s\"'<>]+\\)*[^\s\"'<>]*", "<REDACTED>", text)
    if len(text) > limit:
        suffix = "<truncated>"
        text = text[: max(0, limit - len(suffix))] + suffix
    return text


def _log_code(value, fallback):
    value = re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")
    return value if re.fullmatch(r"[a-z][a-z0-9_]*", value or "") else fallback


def _write_log_line(line):
    sys.stderr.write(line + "\n")
    sys.stderr.flush()
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with LOG_FILE.open("a", encoding="utf-8") as file:
            file.write(line + "\n")
    except Exception:
        sys.stderr.write("level=error component=betfair_logger event=log_write_failed\n")
        sys.stderr.flush()


def log_event(component, event, level="info", **fields):
    level = level if level in _LOG_LEVELS else "info"
    parts = [
        f"[{datetime.now().isoformat()}]",
        f"level={level}",
        f"component={_log_code(component, 'betfair_scraper')}",
        f"event={_log_code(event, 'runtime_event')}",
    ]
    for key in _LOG_FIELDS:
        if key not in fields:
            continue
        value = fields[key]
        is_finite_number = (
            isinstance(value, (int, float))
            and not isinstance(value, bool)
            and math.isfinite(value)
        )
        if value is None or isinstance(value, (str, bool)) or is_finite_number:
            parts.append(f"{key}={_runtime_text(value, 160)}")
    _write_log_line(_runtime_text(" ".join(parts), 1000))


def log(message):
    log_event("betfair_scraper", "legacy_message", text=_runtime_text(message))
