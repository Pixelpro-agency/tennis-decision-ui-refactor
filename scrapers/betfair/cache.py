import json
import re
import time

from .config import CACHE_DIR, log
from .diagnostic_redaction import redact_value
from .parsing import normalize_betfair_url

CACHE_TTL_SECONDS = 4


def get_cache_key(url):
    normalizedUrl = normalize_betfair_url(url) or ""
    return re.sub(r"[^a-zA-Z0-9]", "_", normalizedUrl)[:100]


def get_cached_result(url):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    cachePath = CACHE_DIR / f"{get_cache_key(url)}.json"

    if not cachePath.exists():
        return None

    if time.time() - cachePath.stat().st_mtime >= CACHE_TTL_SECONDS:
        return None

    try:
        with cachePath.open("r", encoding="utf-8") as file:
            return redact_value(json.load(file))
    except Exception as error:
        log(f"[Cache] Failed to read cache: {error}")
        return None


def set_cached_result(url, results):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    cachePath = CACHE_DIR / f"{get_cache_key(url)}.json"

    try:
        with cachePath.open("w", encoding="utf-8") as file:
            json.dump(redact_value(results), file)
    except Exception as error:
        log(f"[Cache] Failed to write cache: {error}")
