import re
from urllib.parse import urlsplit


_MARKET_ID_RE = re.compile(r"^\d+\.\d+$")
_SELECTION_ID_RE = re.compile(r"^\d+$")


def _failure(reason):
    return {
        "ok": False,
        "reason": reason,
    }


def parse_direct_ladder_url(raw_url):
    """Parse only direct Betfair graph ladder URLs."""

    if not isinstance(raw_url, str) or not raw_url:
        return _failure("bad_graph_url_invalid")

    try:
        parsed = urlsplit(raw_url)
        port = parsed.port
    except ValueError:
        return _failure("bad_graph_url_invalid")

    if (
        parsed.scheme != "https"
        or parsed.hostname != "graphs.betfair.it"
        or parsed.username is not None
        or parsed.password is not None
        or port is not None
    ):
        return _failure("bad_graph_url_invalid")

    endpoint = parsed.path.lstrip("/").split("/", 1)[0]
    if endpoint == "runnerChartData":
        return _failure("bad_graph_url_unsupported_endpoint")

    path = parsed.path
    if path.endswith("/"):
        path = path[:-1]

    segments = path.split("/")

    if len(segments) != 4 or segments[0] != "":
        return _failure("bad_graph_url_invalid")

    market_id, selection_id, view = segments[1:]

    if (
        view != "0"
        or not _MARKET_ID_RE.fullmatch(market_id)
        or not _SELECTION_ID_RE.fullmatch(selection_id)
    ):
        return _failure("bad_graph_url_invalid")

    return {
        "ok": True,
        "market_id": market_id,
        "selection_id": selection_id,
    }


def build_selection_map(runners):
    """Return runners keyed by non-null API selectionId values."""

    selection_map = {}

    for runner in runners or []:
        if not isinstance(runner, dict):
            continue

        selection_id = runner.get("selectionId")

        if selection_id is not None:
            selection_map[str(selection_id)] = runner

    return selection_map


def validate_ladder_mapping(
    parsed_url,
    expected_market_id,
    selection_map,
    seen_selection_ids,
):
    """Validate a parsed graph URL and resolve its API runner."""

    if not isinstance(parsed_url, dict) or not parsed_url.get("ok"):
        reason = (
            parsed_url.get("reason", "bad_graph_url_invalid")
            if isinstance(parsed_url, dict)
            else "bad_graph_url_invalid"
        )
        return _failure(reason)

    market_id = parsed_url.get("market_id")
    selection_id = parsed_url.get("selection_id")

    if not isinstance(market_id, str) or not isinstance(selection_id, str):
        return _failure("bad_graph_url_invalid")

    if market_id != str(expected_market_id):
        return _failure("bad_graph_url_market_mismatch")

    runner = (
        selection_map.get(selection_id)
        if isinstance(selection_map, dict)
        else None
    )

    if runner is None:
        return _failure("bad_graph_url_selection_not_found")

    if selection_id in (seen_selection_ids or set()):
        return _failure("bad_graph_url_duplicate_selection")

    return {
        "ok": True,
        "market_id": market_id,
        "selection_id": selection_id,
        "runner": runner,
    }
