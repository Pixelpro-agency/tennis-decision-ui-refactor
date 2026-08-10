import asyncio
import json
import sys

from .browser import run_scrape
from .cache import get_cached_result, set_cached_result
from .config import log
from .urls import normalize_input_urls


async def main(raw_urls=None):
    if raw_urls is None:
        raw_urls = sys.argv[1:]

    if not raw_urls:
        print(json.dumps({
            "ok": False,
            "error": {
                "code": "missing_urls",
                "message": "No SofaScore URLs provided",
            },
        }))
        raise SystemExit(1)

    try:
        urls = normalize_input_urls(raw_urls)
    except ValueError as error:
        print(json.dumps({
            "ok": False,
            "error": {
                "code": str(error),
                "message": "Invalid SofaScore input",
            },
        }))
        raise SystemExit(1) from None

    if not urls:
        print(json.dumps({
            "ok": False,
            "error": {
                "code": "invalid_urls",
                "message": "No valid SofaScore URLs provided",
            },
        }))
        raise SystemExit(1)

    cached = get_cached_result(urls)

    if cached:
        log("[Scraper] Using 5s cache")
        sys.stdout.write(json.dumps(cached))
        sys.stdout.flush()
        return

    results, needs_headed = await run_scrape(
        urls,
        headless=True,
    )

    if needs_headed:
        log("[Scraper] Relaunching in HEADED mode...")

        results, _ = await run_scrape(
            urls,
            headless=False,
        )

    if results:
        set_cached_result(urls, results)
        sys.stdout.write(json.dumps(results))
    else:
        sys.stdout.write(json.dumps({
            url: {
                "ok": False,
                "error": {
                    "code": "scraper_failure",
                    "message": "SofaScore scraper failure",
                },
            }
            for url in urls
        }))

    sys.stdout.flush()


module_name = "_" * 2 + "name" + "_" * 2
main_module_name = "_" * 2 + "main" + "_" * 2

if globals().get(module_name) == main_module_name:
    asyncio.run(main())
