import asyncio

from playwright.async_api import async_playwright
from playwright_stealth import Stealth

from .config import PROFILE_DIR, log
from .urls import extract_event_id_from_url

NAVIGATION_TIMEOUT_MS = 30000
ENDPOINT_TIMEOUT_MS = 15000
CHALLENGE_TIMEOUT_SECONDS = 60
WHOLE_SCRAPE_TIMEOUT_SECONDS = 105


def error_result(code, message, status=None):
    error = {"code": code, "message": message}
    if status is not None:
        error["status"] = status
    return {"ok": False, "error": error}


async def _run_scrape(urls, headless=True):
    results = {}

    async with async_playwright() as playwright:
        context = await playwright.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={
                "width": 1280,
                "height": 720,
            },
            args=[
                "--disable-blink-features=AutomationControlled",
            ],
        )

        page = (
            context.pages[0]
            if context.pages
            else await context.new_page()
        )

        await Stealth().apply_stealth_async(page)

        event_id = None

        for url in urls:
            event_id = extract_event_id_from_url(url)

            if event_id:
                break

        if not event_id:
            await context.close()
            return {
                url: {
                    **error_result("invalid_event_id", "SofaScore event ID unavailable"),
                }
                for url in urls
            }, False

        match_url = f"https://www.sofascore.com/event/{event_id}"

        log(
            f"[Scraper] Navigating to: {match_url} "
            f"(headless={headless})"
        )

        try:
            response = await page.goto(
                match_url,
                wait_until="domcontentloaded",
                timeout=NAVIGATION_TIMEOUT_MS,
            )

            page_title = await page.title()

            is_cf_page = (
                "Just a moment" in page_title
                or "Attention Required" in page_title
            )

            is_403 = response and response.status == 403
            is_blocked = is_cf_page or is_403

            if is_blocked:
                status = response.status if response else "???"

                log(
                    f"[Scraper] Block detected! "
                    f"Title: {page_title}, Status: {status}"
                )

                if headless:
                    await context.close()
                    return None, True

                log(
                    "[Scraper] Waiting for manual solve "
                    "(max 60s)..."
                )

                challenge_resolved = False
                for _ in range(CHALLENGE_TIMEOUT_SECONDS):
                    await asyncio.sleep(1)

                    title = await page.title()

                    if (
                        "Just a moment" not in title
                        and "Sofa" in title
                    ):
                        challenge_resolved = True
                        break

                if not challenge_resolved:
                    unresolved = {
                        url: error_result(
                            "challenge_unresolved",
                            "SofaScore challenge unresolved",
                        )
                        for url in urls
                    }
                    await context.close()
                    return unresolved, False

            await asyncio.sleep(2)

            log(
                f"[Scraper] Fetching {len(urls)} APIs "
                "from page context..."
            )

            for url in urls:
                try:
                    fetch_js = """
                    async ({url, timeoutMs}) => {
                        const controller = new AbortController();
                        const timer = setTimeout(() => controller.abort(), timeoutMs);
                        try {
                            const response = await fetch(url, {
                                "signal": controller.signal,
                                "headers": {
                                    "accept": "application/json, text/plain, */*",
                                    "x-requested-with": "XMLHttpRequest"
                                }
                            });

                            if (response.ok) {
                                return await response.json();
                            }

                            return {
                                "ok": false,
                                "error": {
                                    "code": "http_error",
                                    "message": "SofaScore endpoint request failed",
                                    "status": response.status
                                }
                            };
                        } catch (error) {
                            return {
                                "ok": false,
                                "error": {
                                    "code": error && error.name === "AbortError"
                                        ? "endpoint_timeout"
                                        : "endpoint_fetch_failed",
                                    "message": error && error.name === "AbortError"
                                        ? "SofaScore endpoint timed out"
                                        : "SofaScore endpoint fetch failed"
                                }
                            };
                        } finally {
                            clearTimeout(timer);
                        }
                    }
                    """

                    api_result = await page.evaluate(fetch_js, {
                        "url": url,
                        "timeoutMs": ENDPOINT_TIMEOUT_MS,
                    })
                    results[url] = api_result

                except Exception as error:
                    log("[Scraper] Endpoint evaluation failed")
                    results[url] = error_result(
                        "endpoint_evaluation_failed",
                        "SofaScore endpoint evaluation failed",
                    )

        except Exception as error:
            log(f"[Scraper] Fatal: {error}")

            results = {
                url: error_result("browser_failure", "SofaScore browser failure")
                for url in urls
            }

        await context.close()

        return results, False


async def run_scrape(urls, headless=True):
    try:
        return await asyncio.wait_for(
            _run_scrape(urls, headless=headless),
            timeout=WHOLE_SCRAPE_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        return {
            url: error_result("scrape_timeout", "SofaScore scrape timed out")
            for url in urls
        }, False
