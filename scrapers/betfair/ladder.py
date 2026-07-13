import asyncio

from .config import log
from .parsing import (
    is_graph_login_required_fallback,
    is_graph_login_required_text,
    parse_popup_price,
)


async def extract_ladder_from_url(page, ladder_url):
    try:
        log(f"[Ladder] Navigating to {ladder_url}")

        await page.goto(
            ladder_url,
            wait_until="domcontentloaded",
            timeout=45000,
        )

        await asyncio.sleep(3)

        html = await page.content()

        blockedMarkers = (
            "Just a moment",
            "challenge-platform",
            "security check",
        )

        if any(marker.lower() in html.lower() for marker in blockedMarkers):
            log(f"[Ladder] Blocked by Cloudflare/security: {ladder_url}")
            return {"ladder": []}

        bodyText = ""

        try:
            bodyText = await page.locator("body").inner_text()
        except Exception:
            try:
                bodyText = await page.evaluate("document.body.innerText")
            except Exception as error:
                log(f"[Ladder] Inner text extraction failed: {error}")

        rowSelectors = (
            '[data-testid="ladder-values"] tr',
            '[data-testid="ladder-body"] tr',
            "table tbody tr",
            ".ladder tbody tr",
        )

        rows = []

        for selector in rowSelectors:
            rows = await page.query_selector_all(selector)

            if rows:
                log(
                    f"[Ladder] Found {len(rows)} rows "
                    f"with selector {selector}"
                )
                break

        if is_graph_login_required_text(bodyText):
            log(f"[Ladder] Login required matched via text: {ladder_url}")

            return {
                "ladder": [],
                "login_required": {
                    "graphLoginRequired": True,
                    "graphLoginRequiredUrl": ladder_url,
                    "graphLoginRequiredReason": "primary_text_match",
                    "graphLoginRequiredText": bodyText[:200],
                },
            }

        if is_graph_login_required_fallback(bodyText, len(rows) > 0):
            log(f"[Ladder] Login required fallback: {ladder_url}")

            return {
                "ladder": [],
                "login_required": {
                    "graphLoginRequired": True,
                    "graphLoginRequiredUrl": ladder_url,
                    "graphLoginRequiredReason": (
                        "fallback_short_page_keywords"
                    ),
                    "graphLoginRequiredText": bodyText[:200],
                },
            }

        ladderRows = []

        for row in rows:
            cells = await row.query_selector_all("td")

            if len(cells) < 4:
                continue

            priceText = await cells[0].inner_text()
            backText = await cells[1].inner_text()
            layText = await cells[2].inner_text()
            tradedText = await cells[3].inner_text()

            price = parse_popup_price(priceText)

            if price is None:
                continue

            ladderRows.append({
                "price": str(price),
                "back_available": backText.strip(),
                "lay_available": layText.strip(),
                "traded": tradedText.strip(),
            })

        log(f"[Ladder] Extracted {len(ladderRows)} rows from {ladder_url}")

        return {"ladder": ladderRows}

    except Exception as error:
        log(f"[Ladder] Error extracting {ladder_url}: {error}")

        return {
            "ladder": [],
            "error_reason": "temporary_error",
            "error_text": str(error)[:200],
        }
