import os
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
DEFAULT_CDP_URL = "http://127.0.0.1:9222"
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


def log(message):
    redacted_message = redact_text(str(message))
    line = f"[{datetime.now().isoformat()}] {redacted_message}"

    sys.stderr.write(line + "\n")
    sys.stderr.flush()

    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with LOG_FILE.open("a", encoding="utf-8") as file:
            file.write(line + "\n")
    except Exception as error:
        redacted_error = redact_text(str(error))
        sys.stderr.write(
            f"[Logger] Failed to write log file: {redacted_error}\n"
        )
