import json
import re
import time

from .config import CACHE_DIR, CACHE_TTL_SECONDS


def get_cache_key(urls):
    return re.sub(
        r"[^a-zA-Z0-9]",
        "_",
        "".join(urls),
    )[:100]


def get_cache_path(urls):
    return CACHE_DIR / f"{get_cache_key(urls)}.json"


def get_cached_result(urls):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    cache_path = get_cache_path(urls)

    if not cache_path.exists():
        return None

    if time.time() - cache_path.stat().st_mtime >= CACHE_TTL_SECONDS:
        return None

    try:
        with cache_path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except Exception:
        return None


def set_cached_result(urls, results):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    cache_path = get_cache_path(urls)

    try:
        with cache_path.open("w", encoding="utf-8") as file:
            json.dump(results, file)
    except Exception:
        pass
