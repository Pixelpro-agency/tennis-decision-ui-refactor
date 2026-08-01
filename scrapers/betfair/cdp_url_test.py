import os
import unittest
from unittest.mock import AsyncMock

os.environ.setdefault("BETFAIR_APP_KEY", "test-key")

from scrapers.betfair.cdp_url import (
    normalize_cdp_base_url,
    require_cdp_base_url,
)
from scrapers.betfair.cli import parse_args, validate_browser_args
from scrapers.betfair.browser_session import open_browser_session


class Prompt6CdpContractTests(unittest.IsolatedAsyncioTestCase):
    def test_p40_parser_has_no_default_cdp_url(self):
        args = parse_args(["https://www.betfair.it/example"])
        self.assertEqual(args.cdp_url, "")

    def test_p41_cdp_mode_requires_url(self):
        args = parse_args([
            "https://www.betfair.it/example",
            "--mode",
            "cdp",
        ])
        with self.assertRaisesRegex(ValueError, "cdp_url_required"):
            validate_browser_args(args)

    def test_p42_invalid_cdp_url_is_rejected(self):
        self.assertIsNone(
            normalize_cdp_base_url("http://example.com:9224")
        )
        self.assertIsNone(
            normalize_cdp_base_url("http://127.0.0.1")
        )
        with self.assertRaisesRegex(ValueError, "cdp_url_invalid"):
            require_cdp_base_url("http://example.com:9224")

    async def test_p43_alternative_url_reaches_playwright_exactly(self):
        browser = type("Browser", (), {})()
        context = type("Context", (), {})()
        page = type(
            "Page",
            (),
            {"url": "https://www.betfair.it/example"},
        )()
        context.pages = [page]
        browser.contexts = [context]
        chromium = type("Chromium", (), {})()
        chromium.connect_over_cdp = AsyncMock(return_value=browser)
        playwright = type("Playwright", (), {"chromium": chromium})()

        returned_context, returned_page, should_close = (
            await open_browser_session(
                playwright,
                "cdp",
                None,
                " http://127.0.0.1:9224/ ",
            )
        )

        chromium.connect_over_cdp.assert_awaited_once_with(
            "http://127.0.0.1:9224"
        )
        self.assertIs(returned_context, context)
        self.assertIs(returned_page, page)
        self.assertFalse(should_close)

    def test_p44_persistent_does_not_require_cdp(self):
        args = parse_args([
            "https://www.betfair.it/example",
            "--mode",
            "persistent",
        ])
        self.assertEqual(validate_browser_args(args), "")

    def test_p45_login_only_cdp_still_requires_url(self):
        args = parse_args([
            "https://www.betfair.it/example",
            "--mode",
            "cdp",
            "--login-only",
        ])
        with self.assertRaisesRegex(ValueError, "cdp_url_required"):
            validate_browser_args(args)


if __name__ == "__main__":
    unittest.main()
