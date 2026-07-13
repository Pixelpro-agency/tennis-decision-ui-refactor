import re
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

PRIMARY_GRAPH_LOGIN_TEXT = (
    "devi effettuare l'accesso per visualizzare il grafico del mercato"
)


def normalize_betfair_url(url):
    if not url:
        return url

    parsed = urlsplit(url)
    query = parse_qs(parsed.query, keep_blank_values=False)

    for key in list(query.keys()):
        if key.lower() in ("loginstatus", "ott", "m", "ref", "pid"):
            del query[key]

    cleanedQuery = urlencode(sorted(query.items()), doseq=True)

    return urlunsplit((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        cleanedQuery,
        parsed.fragment,
    ))


def extract_event_id(url):
    match = re.search(r"(\d{5,})(?:[^\d]|$)", url)
    return match.group(1) if match else None


def format_eur(value):
    try:
        number = float(value)

        if number >= 1000:
            return f"EUR {number:,.0f}"

        return f"EUR {number:,.2f}"
    except Exception:
        return str(value)


def parse_popup_price(text):
    if not text:
        return None

    normalized = (
        text.strip()
        .replace("€", "")
        .replace("EUR", "")
        .replace("\u00a0", " ")
        .replace(" ", "")
        .replace(",", ".")
    )

    if normalized in ("", "-"):
        return None

    try:
        return float(normalized)
    except Exception:
        return None


def parse_popup_money(text):
    if not text:
        return 0

    normalized = (
        text.strip()
        .replace("€", "")
        .replace("EUR", "")
        .replace("\u00a0", " ")
        .replace(" ", "")
    )

    if normalized in ("", "-"):
        return 0

    if "," in normalized:
        normalized = normalized.replace(".", "").replace(",", ".")

    try:
        return float(normalized)
    except Exception:
        return 0


def normalize_text(value):
    return " ".join((value or "").lower().replace("’", "'").split())


def is_graph_login_required_text(text):
    normalized = normalize_text(text)

    if PRIMARY_GRAPH_LOGIN_TEXT in normalized:
        return True

    patterns = (
        "devi effettuare l'accesso",
        "devi effettuare l accesso",
        "devi loggarti",
        "non sei loggato",
        "accesso per visualizzare il grafico",
        "visualizzare il grafico del mercato",
        "login required",
        "please log in",
        "you need to log in",
        "session expired",
        "not logged in",
        "authentication required",
    )

    return any(pattern in normalized for pattern in patterns)


def is_graph_login_required_fallback(text, has_rows):
    if has_rows:
        return False

    normalized = normalize_text(text)

    if 0 < len(normalized) < 1500:
        keywords = ("accesso", "login", "grafico", "mercato")
        return any(keyword in normalized for keyword in keywords)

    return False


def sanitize_filename(value, max_len=140):
    if not value:
        return "unknown"

    cleaned = re.sub(r"[^\w\-_.]", "_", str(value)).strip("._")
    cleaned = re.sub(r"_+", "_", cleaned)

    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len]

    return cleaned or "unknown"
