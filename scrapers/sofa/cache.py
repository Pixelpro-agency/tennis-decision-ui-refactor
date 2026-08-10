import hashlib
import json
import time

from .config import CACHE_DIR, CACHE_TTL_SECONDS


def get_cache_key(urls):
    serialized = json.dumps(list(urls), ensure_ascii=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def get_cache_path(urls):
    return CACHE_DIR / f"{get_cache_key(urls)}.json"


def is_cacheable_result(results):
    return bool(results) and all(
        isinstance(value, dict) and not value.get("error")
        for value in results.values()
    )


def get_cached_result(urls):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = get_cache_path(urls)
    if not cache_path.exists() or time.time() - cache_path.stat().st_mtime >= CACHE_TTL_SECONDS:
        return None
    try:
        with cache_path.open("r", encoding="utf-8") as file:
            result = json.load(file)
        return result if is_cacheable_result(result) else None
    except Exception:
        return None


def set_cached_result(urls, results):
    if not is_cacheable_result(results):
        return False
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        with get_cache_path(urls).open("w", encoding="utf-8") as file:
            json.dump(results, file)
        return True
    except Exception:
        return False
