import unittest
from unittest.mock import AsyncMock, patch

from .scrape import scrape_betfair


class FakePage:
    def __init__(self):
        self.close = AsyncMock()
        self.goto = AsyncMock()


class FakeContext:
    def __init__(self):
        self.pages_created = []

    async def new_page(self):
        page = FakePage()
        self.pages_created.append(page)
        return page


class PlaywrightManager:
    async def __aenter__(self):
        return object()

    async def __aexit__(self, *args):
        return False


class GraphLoopIntegrationTest(unittest.IsolatedAsyncioTestCase):
    async def run_scrape(self, ladder_urls, ladder_results, finished=False):
        context = FakeContext()
        main_page = FakePage()
        runners = [
            {"name": "A", "selectionId": 101},
            {"name": "B", "selectionId": 202},
        ]
        with (
            patch("scrapers.betfair.scrape.async_playwright", return_value=PlaywrightManager()),
            patch("scrapers.betfair.scrape.open_browser_session", new=AsyncMock(return_value=(context, main_page, False))),
            patch("scrapers.betfair.scrape.Stealth.apply_stealth_async", new=AsyncMock()),
            patch("scrapers.betfair.scrape.detect_logged_in", new=AsyncMock(return_value=True)),
            patch("scrapers.betfair.scrape.detect_betfair_event_status", new=AsyncMock(return_value={"hasFinished": finished, "statusText": None, "source": None})),
            patch("scrapers.betfair.scrape.extract_event_id", return_value="event-1"),
            patch("scrapers.betfair.scrape.fetch_market_data_api", new=AsyncMock(return_value={"runners": runners, "market_info": {"market_id": "1.2"}})),
            patch("scrapers.betfair.scrape.extract_ladder_from_url", new=AsyncMock(side_effect=ladder_results)) as extract,
            patch("scrapers.betfair.scrape.asyncio.sleep", new=AsyncMock()),
        ):
            result = await scrape_betfair(
                "https://www.betfair.it/exchange/plus/tennis/market/1.2",
                ladder_urls=ladder_urls,
                network_capture=False,
            )
        return result, context, extract

    async def test_mixed_list_skips_invalid_reserves_duplicate_and_assigns(self):
        urls = [
            "https://graphs.betfair.it/1.2/101/0?source=input",
            "https://example.test/invalid",
            "https://graphs.betfair.it/1.2/101/0",
            "https://graphs.betfair.it/1.2/202/0",
        ]
        result, context, extract = await self.run_scrape(
            urls,
            [
                {"ladder": [{"price": "2.0"}]},
                {"ladder": [], "error_reason": "no_ladder_rows"},
            ],
        )
        diagnostics = result["graph_diagnostics"]
        self.assertEqual(diagnostics["graphUrlsAttempted"], 4)
        self.assertEqual(diagnostics["graphUrlsSucceeded"], 1)
        self.assertEqual(diagnostics["graphUrlsFailed"], 3)
        self.assertEqual(len(context.pages_created), 2)
        self.assertEqual(result["runners"][0]["ladder_source"], "graph_url")
        self.assertNotIn("ladder", result["runners"][1])
        self.assertEqual(
            extract.await_args_list[0].args[1],
            "https://graphs.betfair.it/1.2/101/0",
        )

    async def test_authoritative_finished_skips_all_graph_pages(self):
        result, context, extract = await self.run_scrape(
            ["https://graphs.betfair.it/1.2/101/0"], [], finished=True
        )
        self.assertTrue(result["graph_diagnostics"]["skippedBecauseFinished"])
        self.assertEqual(result["graph_diagnostics"]["graphUrlsAttempted"], 0)
        self.assertEqual(context.pages_created, [])
        extract.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
