import json
import hashlib
import time

from .config import CACHE_DIR, log
from .diagnostic_redaction import redact_value
from .parsing import normalize_betfair_url

CACHE_TTL_SECONDS = 4


def get_cache_key(url, request_identity=None):
    normalizedUrl = normalize_betfair_url(url) or ""
    identity = {
        "url": normalizedUrl,
        "request": request_identity or {},
        "schema": 2,
    }
    encoded = json.dumps(
        identity,
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def get_cached_result(url, request_identity=None):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    cachePath = CACHE_DIR / f"{get_cache_key(url, request_identity)}.json"

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


def is_cacheable_result(results):
    if not isinstance(results, dict):
        return False
    if results.get("error") or results.get("api_error"):
        return False
    if results.get("event_status", {}).get("hasFinished") is True:
        return False
    runners = results.get("runners")
    market_info = results.get("market_info")
    return bool(isinstance(runners, list) and runners) and bool(
        isinstance(market_info, dict) and market_info
    )


def set_cached_result(url, results, request_identity=None):
    if not is_cacheable_result(results):
        return False

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    cachePath = CACHE_DIR / f"{get_cache_key(url, request_identity)}.json"

    try:
        with cachePath.open("w", encoding="utf-8") as file:
            json.dump(redact_value(results), file)
        return True
    except Exception as error:
        log(f"[Cache] Failed to write cache: {error}")
        return False
