import argparse
import asyncio
import json

from .cache import get_cached_result, set_cached_result
from .config import DEFAULT_CDP_URL, log
from .parsing import normalize_betfair_url
from .scrape import open_login_window, scrape_betfair


def parse_args():
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
        default=DEFAULT_CDP_URL,
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

    return parser.parse_args()


def main():
    args = parse_args()

    url = normalize_betfair_url(args.url)
    ladder_urls = [
        value.strip()
        for value in args.ladder_urls.split(",")
        if value.strip()
    ]

    network_capture = not args.no_network_capture

    log(
        f"[Main] mode={args.mode} "
        f"url={url} "
        f"network_capture={network_capture}"
    )

    if args.profile_dir:
        log(f"[Main] profile_dir={args.profile_dir}")

    if args.mode == "cdp":
        log(f"[Main] cdp_url={args.cdp_url}")

    if not args.no_cache and not args.login_only:
        cached = get_cached_result(url)

        if cached:
            log("[Main] Returning cached result")
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
