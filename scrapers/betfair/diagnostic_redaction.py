"""Pure helpers for redacting diagnostic output."""

import re
from collections.abc import Mapping
from urllib.parse import unquote_plus, urlsplit, urlunsplit


REDACTED = "<REDACTED>"

SENSITIVE_KEYS = frozenset({
    "_ak",
    "api_key",
    "apikey",
    "appkey",
    "app_key",
    "app-key",
    "betfair_app_key",
    "x-api-key",
    "authorization",
    "token",
    "access_token",
    "refresh_token",
    "id_token",
    "cookie",
    "session",
    "sid",
    "password",
    "secret",
    "csrf",
    "xsrf",
})

SENSITIVE_HEADER_NAMES = frozenset({
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-application",
    "x-application-key",
    "x-auth-token",
    "x-csrf-token",
})


def _build_pattern(values):
    return "|".join(
        re.escape(item)
        for item in sorted(values, key=len, reverse=True)
    )


_SENSITIVE_KEY_PATTERN = _build_pattern(SENSITIVE_KEYS)
_SENSITIVE_HEADER_PATTERN = _build_pattern(SENSITIVE_HEADER_NAMES)
_SENSITIVE_TEXT_NAME_PATTERN = _build_pattern(
    SENSITIVE_KEYS | SENSITIVE_HEADER_NAMES
)

_URL_PATTERN = re.compile(
    r"https?://[^\s<>'\"`]+",
    re.IGNORECASE,
)

_BEARER_PATTERN = re.compile(
    r"\bBearer\s+(?!<REDACTED>)[A-Za-z0-9._~+/=-]+",
    re.IGNORECASE,
)

_TEXT_HEADER_PATTERN = re.compile(
    r"(?P<prefix>(?<![\w-])(?:"
    + _SENSITIVE_HEADER_PATTERN
    + r")\s*:\s*)(?P<value>.*?)(?="
    r"\s+(?:(?:"
    + _SENSITIVE_TEXT_NAME_PATTERN
    + r")\s*(?:=|:)|(?:[A-Za-z_][\w.-]*)\s*=)|[\r\n]|$)",
    re.IGNORECASE,
)

_TEXT_PAIR_PATTERN = re.compile(
    r"(?P<prefix>(?<![\w-])(?P<key_quote>[\"']?)(?:"
    + _SENSITIVE_TEXT_NAME_PATTERN
    + r")(?P=key_quote)\s*(?:=|:)\s*)"
    r"(?P<value>"
    r"\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|"
    r"[^\s&;,\]\[{}()]+)",
    re.IGNORECASE,
)


def _is_sensitive_key(key):
    return str(key).strip().lower() in SENSITIVE_KEYS


def _is_sensitive_header_name(key):
    return str(key).strip().lower() in SENSITIVE_HEADER_NAMES


def _is_sensitive_mapping_key(key):
    return _is_sensitive_key(key) or _is_sensitive_header_name(key)


def _redact_captured_value(value):
    if (
        len(value) >= 2
        and value[0] == value[-1]
        and value[0] in {"'", '"'}
    ):
        return f"{value[0]}{REDACTED}{value[-1]}"

    return REDACTED


def _redact_text_match(match):
    return match.group("prefix") + _redact_captured_value(
        match.group("value")
    )


def _redact_key_value_pairs(value):
    return _TEXT_PAIR_PATTERN.sub(_redact_text_match, value)


def _redact_query(query):
    parts = re.split(r"([&;])", query)

    for index in range(0, len(parts), 2):
        part = parts[index]

        if not part:
            continue

        key, separator, _value = part.partition("=")

        if separator and _is_sensitive_key(unquote_plus(key)):
            parts[index] = f"{key}{separator}{REDACTED}"

    return "".join(parts)


def redact_url(value):
    """Redact sensitive query parameter values in an HTTP or HTTPS URL."""
    if not isinstance(value, str):
        return value

    try:
        parsed = urlsplit(value)
    except ValueError:
        return _redact_key_value_pairs(value)

    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        return _redact_key_value_pairs(value)

    return urlunsplit((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        _redact_query(parsed.query),
        parsed.fragment,
    ))


def redact_headers(headers):
    """Return a redacted copy of a header mapping."""
    if not isinstance(headers, Mapping):
        return headers

    return {
        key: (
            REDACTED
            if _is_sensitive_mapping_key(key)
            else redact_value(value)
        )
        for key, value in headers.items()
    }


def redact_value(value, key=None):
    """Redact sensitive values from nested JSON-compatible data."""
    if key is not None and _is_sensitive_mapping_key(key):
        return REDACTED

    if isinstance(value, Mapping):
        return {
            item_key: redact_value(item_value, key=item_key)
            for item_key, item_value in value.items()
        }

    if isinstance(value, list):
        return [redact_value(item) for item in value]

    if isinstance(value, str):
        return redact_text(value)

    return value


def redact_text(value):
    """Redact recognizable sensitive values from free-form text."""
    if not isinstance(value, str):
        return value

    redacted = _URL_PATTERN.sub(
        lambda match: redact_url(match.group(0)),
        value,
    )

    redacted = _BEARER_PATTERN.sub(
        f"Bearer {REDACTED}",
        redacted,
    )

    redacted = _TEXT_HEADER_PATTERN.sub(
        _redact_text_match,
        redacted,
    )

    return _redact_key_value_pairs(redacted)


__all__ = [
    "redact_headers",
    "redact_text",
    "redact_url",
    "redact_value",
]
