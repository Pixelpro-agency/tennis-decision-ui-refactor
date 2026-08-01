import argparse
import asyncio
import json

from .cache import get_cached_result, set_cached_result
from .cdp_url import require_cdp_base_url
from .config import log_event
from .parsing import normalize_betfair_url


def parse_args(argv=None):
    parser = argparse.ArgumentParser()

    parser.add_argument("url")

    parser.add_argument(
        "--mode",
        default="persistent",
        choices=["persistent", "cdp"],
        help="Browser mode: persistent profile or existing Chrome CDP",
    )

    parser.add_argument(
        "--profile-dir",
        default="",
        help="Chrome profile directory",
    )

    parser.add_argument(
        "--cdp-url",
        default="",
        help="CDP endpoint URL",
    )

    parser.add_argument(
        "--ladder-urls",
        default="",
        help="Comma-separated ladder or graph URLs",
    )

    parser.add_argument(
        "--no-network-capture",
        action="store_true",
        help="Disable browser-level network capture",
    )

    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Ignore cache for this run",
    )

    parser.add_argument(
        "--login-only",
        action="store_true",
        help="Open browser for login and keep it open",
    )

    return parser.parse_args(argv)


def validate_browser_args(args):
    if args.mode == "cdp":
        args.cdp_url = require_cdp_base_url(args.cdp_url)
        return args.cdp_url

    args.cdp_url = ""
    return ""


def main():
    args = parse_args()

    try:
        validate_browser_args(args)
    except ValueError as error:
        raise SystemExit(str(error)) from None

    from .scrape import open_login_window, scrape_betfair

    url = normalize_betfair_url(args.url)
    ladder_urls = [
        value.strip()
        for value in args.ladder_urls.split(",")
        if value.strip()
    ]

    network_capture = not args.no_network_capture

    log_event(
        "betfair_cli",
        "scraper_start",
        mode=args.mode,
        hasBetfairUrl=bool(url),
        graphUrlCount=len(ladder_urls),
        status="network_capture" if network_capture else "no_network_capture",
    )

    if not args.no_cache and not args.login_only:
        cached = get_cached_result(url)

        if cached:
            log_event("betfair_cli", "cache_hit", status="cached")
            print(json.dumps(cached))
            return

    if args.login_only:
        asyncio.run(
            open_login_window(
                url,
                args.mode,
                args.profile_dir or None,
                args.cdp_url or None,
            )
        )
        return

    results = asyncio.run(
        scrape_betfair(
            url,
            mode=args.mode,
            profile_dir=args.profile_dir or None,
            cdp_url=args.cdp_url or None,
            ladder_urls=ladder_urls,
            network_capture=network_capture,
        )
    )

    if not args.no_cache:
        set_cached_result(url, results)

    print(json.dumps(results))


module_name_key = "_" * 2 + "name" + "_" * 2
main_module_name = "_" * 2 + "main" + "_" * 2

if globals().get(module_name_key) == main_module_name:
    main()
