import re
from urllib.parse import urlsplit

from .config import log

ALLOWED_HOSTS = frozenset({"sofascore.com", "www.sofascore.com"})
API_SUFFIXES = ("", "/statistics", "/point-by-point")
API_PATH_RE = re.compile(r"^/api/v1/event/(\d+)(/statistics|/point-by-point)?$")


def clean_url(value):
    return "" if value is None else str(value).strip().strip("<>").strip()


def _parsed_authorized_url(value):
    try:
        parsed = urlsplit(clean_url(value))
        port = parsed.port
    except ValueError:
        return None
    if (parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS
            or port not in (None, 443) or parsed.username is not None
            or parsed.password is not None or parsed.query):
        return None
    return parsed


def extract_event_id_from_url(url):
    parsed = _parsed_authorized_url(url)
    if parsed is None:
        return None
    api_match = API_PATH_RE.fullmatch(parsed.path.rstrip("/"))
    if api_match and not parsed.fragment:
        return api_match.group(1)
    fragment_match = re.fullmatch(r"id:(\d+)", parsed.fragment)
    if fragment_match and not parsed.path.startswith("/api/"):
        return fragment_match.group(1)
    event_match = re.fullmatch(r"/event/(\d+)/?", parsed.path)
    return event_match.group(1) if event_match and not parsed.fragment else None


def is_sofascore_api_url(url):
    parsed = _parsed_authorized_url(url)
    return bool(parsed and not parsed.fragment and API_PATH_RE.fullmatch(parsed.path.rstrip("/")))


def build_sofascore_api_urls(event_id):
    value = str(event_id)
    if not value.isdigit():
        raise ValueError("invalid_event_id")
    return [f"https://www.sofascore.com/api/v1/event/{value}{suffix}" for suffix in API_SUFFIXES]


def normalize_input_urls(raw_urls):
    cleaned = [clean_url(value) for value in raw_urls if clean_url(value)]
    if not cleaned:
        return []
    api_flags = [is_sofascore_api_url(url) for url in cleaned]
    if len(cleaned) == 1 and not api_flags[0]:
        event_id = extract_event_id_from_url(cleaned[0])
        if not event_id:
            raise ValueError("invalid_sofascore_url")
        log(f"[Scraper] Expanded SofaScore match URL to API endpoints event_id={event_id}")
        return build_sofascore_api_urls(event_id)
    if not all(api_flags):
        raise ValueError("mixed_or_multiple_match_urls")
    event_ids = {extract_event_id_from_url(url) for url in cleaned}
    if None in event_ids or len(event_ids) != 1:
        raise ValueError("mixed_event_ids")
    canonical = []
    for url in cleaned:
        parsed = urlsplit(url)
        normalized = f"https://www.sofascore.com{parsed.path.rstrip('/')}"
        if normalized not in canonical:
            canonical.append(normalized)
    return canonical
