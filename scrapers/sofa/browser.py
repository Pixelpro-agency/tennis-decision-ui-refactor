import asyncio

from playwright.async_api import async_playwright
from playwright_stealth import Stealth

from .config import PROFILE_DIR, log
from .urls import extract_event_id_from_url


async def run_scrape(urls, headless=True):
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
                    "error": "No event ID",
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
                timeout=30000,
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

                for _ in range(60):
                    await asyncio.sleep(1)

                    title = await page.title()

                    if (
                        "Just a moment" not in title
                        and "Sofa" in title
                    ):
                        break

            await asyncio.sleep(2)

            log(
                f"[Scraper] Fetching {len(urls)} APIs "
                "from page context..."
            )

            for url in urls:
                try:
                    fetch_js = """
                    async (url) => {
                        try {
                            const response = await fetch(url, {
                                "headers": {
                                    "accept": "application/json, text/plain, */*",
                                    "x-requested-with": "XMLHttpRequest"
                                }
                            });

                            if (response.ok) {
                                return await response.json();
                            }

                            return {
                                "error": "HTTP " + response.status,
                                "status": response.status
                            };
                        } catch (error) {
                            return {
                                "error": error.message
                            };
                        }
                    }
                    """

                    api_result = await page.evaluate(fetch_js, url)
                    results[url] = api_result

                except Exception as error:
                    results[url] = {
                        "error": str(error),
                    }

        except Exception as error:
            log(f"[Scraper] Fatal: {error}")

            results = {
                url: {
                    "error": str(error),
                }
                for url in urls
            }

        await context.close()

        return results, False
