import re

from .config import log


def clean_url(value):
    if value is None:
        return ""

    return str(value).strip().strip("<>").strip()


def extract_event_id_from_url(url):
    url = clean_url(url)

    patterns = (
        r"#id:(\d+)",
        r"[?&]id=(\d+)",
        r"/api/v1/event/(\d+)",
        r"/event/(\d+)",
    )

    for pattern in patterns:
        match = re.search(pattern, url)

        if match:
            return match.group(1)

    return None


def is_sofascore_api_url(url):
    url = clean_url(url)
    return "/api/v1/event/" in url


def build_sofascore_api_urls(event_id):
    return [
        f"https://www.sofascore.com/api/v1/event/{event_id}",
        f"https://www.sofascore.com/api/v1/event/{event_id}/statistics",
        f"https://www.sofascore.com/api/v1/event/{event_id}/point-by-point",
    ]


def normalize_input_urls(raw_urls):
    cleaned = [clean_url(value) for value in raw_urls if clean_url(value)]

    if len(cleaned) == 1 and not is_sofascore_api_url(cleaned[0]):
        event_id = extract_event_id_from_url(cleaned[0])

        if event_id:
            log(
                f"[Scraper] Expanded SofaScore match URL "
                f"to API endpoints event_id={event_id}"
            )

            return build_sofascore_api_urls(event_id)

    return cleaned
