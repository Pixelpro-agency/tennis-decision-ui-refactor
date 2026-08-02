from urllib.parse import urlsplit

from .cdp_url import require_cdp_base_url
from .config import DEFAULT_PERSISTENT_PROFILE, log_event


async def get_or_create_betfair_page(context):
    for page in context.pages:
        try:
            currentUrl = page.url
            if "betfair" in currentUrl.lower():
                log_event("betfair_browser", "betfair_page_reused", status="existing")
                return page
        except Exception:
            continue

    log_event("betfair_browser", "betfair_page_created", status="new")
    return await context.new_page()


async def detect_logged_in(page):
    try:
        body = await page.content()

        markers = (
            "account-bar",
            "my-account",
            "logout",
            "balance",
            "total-matched",
        )

        lowerBody = body.lower()

        for marker in markers:
            if marker in lowerBody:
                return True

        return False
    except Exception:
        log_event("betfair_browser", "login_detection_failed", reason="page_content_unavailable", level="warn")
        return False


async def detect_betfair_event_status(page):
    result = {
        "hasFinished": False,
        "statusText": None,
        "source": None,
    }

    try:
        finishedSpan = await page.query_selector("span.match-finished")

        if finishedSpan:
            text = await finishedSpan.inner_text()

            if text and any(
                word in text.lower()
                for word in ("finito", "finished", "terminato")
            ):
                result["hasFinished"] = True
                result["statusText"] = text.strip()
                result["source"] = "match-finished"
                return result

        header = await page.query_selector(".tennis-header.finished")

        if header:
            result["hasFinished"] = True
            result["statusText"] = "finished"
            result["source"] = "tennis-header.finished"
            return result

        selectors = (
            ".sports-header",
            ".tennis-header",
            ".inplay-info",
        )

        for selector in selectors:
            try:
                elements = await page.query_selector_all(selector)

                for element in elements:
                    try:
                        text = await element.inner_text()

                        if text and any(
                            word in text.lower()
                            for word in ("finito", "finished", "terminato")
                        ):
                            result["hasFinished"] = True
                            result["statusText"] = text.strip()[:200]
                            result["source"] = f"{selector}:visible-text"
                            return result
                    except Exception:
                        continue
            except Exception:
                continue

    except Exception:
        log_event("betfair_browser", "event_status_detection_failed", reason="page_content_unavailable", level="warn")

    return result


async def open_browser_session(playwright, mode, profile_dir, cdp_url):
    if mode == "cdp":
        effectiveCdpUrl = require_cdp_base_url(cdp_url)
        log_event("betfair_browser", "browser_session_open", mode="cdp")

        try:
            browser = await playwright.chromium.connect_over_cdp(
                effectiveCdpUrl
            )
        except Exception as error:
            log_event("betfair_browser", "cdp_connect_failed", reason="connection_failed", level="error")
            raise Exception("Cannot connect to Chrome CDP") from error

        if not browser.contexts:
            raise Exception("CDP browser has no contexts")

        context = browser.contexts[0]

        log_event(
            "betfair_browser",
            "cdp_context_ready",
            count=len(context.pages),
        )

        page = await get_or_create_betfair_page(context)

        return context, page, False

    if mode == "persistent":
        profile = profile_dir or DEFAULT_PERSISTENT_PROFILE

        log_event(
            "betfair_browser",
            "browser_session_open",
            mode="persistent",
        )

        context = await playwright.chromium.launch_persistent_context(
            profile,
            headless=False,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            viewport={
                "width": 1280,
                "height": 800,
            },
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--ignore-certificate-errors",
            ],
        )

        page = (
            context.pages[0]
            if context.pages
            else await context.new_page()
        )

        return context, page, True

    raise Exception(f"Unknown browser mode: {mode}")
