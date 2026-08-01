from urllib.parse import urlsplit

_LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}


def normalize_cdp_base_url(value):
    if value is None:
        return ""

    if not isinstance(value, str):
        return None

    normalized = value.strip().rstrip("/")

    if not normalized:
        return ""

    try:
        parsed = urlsplit(normalized)
        port = parsed.port
    except (TypeError, ValueError):
        return None

    if (
        parsed.scheme != "http"
        or parsed.username is not None
        or parsed.password is not None
        or parsed.hostname not in _LOCAL_HOSTS
        or port is None
        or not (1 <= port <= 65535)
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
    ):
        return None

    return normalized


def require_cdp_base_url(value):
    normalized = normalize_cdp_base_url(value)

    if normalized == "":
        raise ValueError("cdp_url_required")

    if normalized is None:
        raise ValueError("cdp_url_invalid")

    return normalized
