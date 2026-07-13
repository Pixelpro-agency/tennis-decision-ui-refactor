from urllib.parse import urlsplit

from .config import DEFAULT_CDP_URL, DEFAULT_PERSISTENT_PROFILE, log


async def get_or_create_betfair_page(context):
    for page in context.pages:
        try:
            currentUrl = page.url
            if "betfair" in currentUrl.lower():
                log(f"[Browser] Reusing existing Betfair page: {currentUrl}")
                return page
        except Exception:
            continue

    log("[Browser] No existing Betfair page, creating new one")
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
    except Exception as error:
        log(f"[Browser] Login detection error: {error}")
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

    except Exception as error:
        log(f"[Browser] Event status detection error: {error}")

    return result


async def open_browser_session(playwright, mode, profile_dir, cdp_url):
    effectiveCdpUrl = cdp_url or DEFAULT_CDP_URL

    if mode == "cdp":
        log(f"[Browser] mode=cdp_existing_chrome cdp_url={effectiveCdpUrl}")

        try:
            browser = await playwright.chromium.connect_over_cdp(
                effectiveCdpUrl
            )
        except Exception as error:
            port = urlsplit(effectiveCdpUrl).port or 9222
            profile = profile_dir or DEFAULT_PERSISTENT_PROFILE

            raise Exception(
                f"Cannot connect to Chrome at {effectiveCdpUrl}. "
                f"Make sure Chrome was started with: "
                f'chrome.exe --remote-debugging-port={port} '
                f'--user-data-dir="{profile}"'
            ) from error

        if not browser.contexts:
            raise Exception("CDP browser has no contexts")

        context = browser.contexts[0]

        log(
            f"[Browser] CDP context found with "
            f"{len(context.pages)} page(s)"
        )

        page = await get_or_create_betfair_page(context)

        return context, page, False

    if mode == "persistent":
        profile = profile_dir or DEFAULT_PERSISTENT_PROFILE

        log(
            f"[Browser] mode=persistent_profile "
            f"profile_dir={profile} headless=False"
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
