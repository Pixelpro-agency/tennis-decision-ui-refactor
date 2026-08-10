import asyncio
import unittest
from unittest.mock import patch

from .browser_session import detect_betfair_event_status, open_browser_session
from .cli import SCRAPE_TIMEOUT_SECONDS
from .ladder import extract_ladder_from_url
from .network_capture import (
    MAX_COLLECTOR_ITEMS,
    append_bounded,
    drain_network_capture,
    summarize_network_capture,
)


class Element:
    def __init__(self, text):
        self.text = text

    async def inner_text(self):
        return self.text


class Page:
    def __init__(self, single=None, groups=None):
        self.single = single or {}
        self.groups = groups or {}

    async def query_selector(self, selector):
        return self.single.get(selector)

    async def query_selector_all(self, selector):
        return self.groups.get(selector, [])


class BetfairRuntimeContractTest(unittest.IsolatedAsyncioTestCase):
    async def test_structural_finished_marker_is_authoritative(self):
        result = await detect_betfair_event_status(Page(
            single={".tennis-header.finished": Element("done")}
        ))
        self.assertTrue(result["hasFinished"])
        self.assertFalse(result["weakFinishedHint"])

    async def test_visible_text_is_only_a_weak_hint(self):
        result = await detect_betfair_event_status(Page(
            groups={".sports-header": [Element("Set finished")]} 
        ))
        self.assertFalse(result["hasFinished"])
        self.assertTrue(result["weakFinishedHint"])

    async def test_capture_drain_waits_for_owned_tasks(self):
        completed = []

        async def work():
            await asyncio.sleep(0)
            completed.append(True)

        task = asyncio.create_task(work())
        collector = {"tasks": {task}}
        await drain_network_capture(collector)
        self.assertEqual(completed, [True])

    def test_public_capture_summary_has_no_local_dump_path(self):
        summary = summarize_network_capture({
            "enabled": True,
            "dump_dir": "C:/private/profile/dumps",
        })
        self.assertNotIn("dump_dir", summary)

    def test_collector_is_bounded(self):
        collector = {}
        for index in range(MAX_COLLECTOR_ITEMS + 5):
            append_bounded(collector, "responses", index)
        self.assertEqual(len(collector["responses"]), MAX_COLLECTOR_ITEMS)
        self.assertTrue(collector["collector_truncated"])

    def test_python_timeout_exceeds_navigation_budget(self):
        self.assertGreater(SCRAPE_TIMEOUT_SECONDS, 60)

    async def test_security_challenge_has_distinct_reason(self):
        class ChallengePage:
            async def goto(self, *args, **kwargs):
                return None

            async def content(self):
                return "<html>Just a moment</html>"

        with patch("scrapers.betfair.ladder.asyncio.sleep", return_value=None):
            result = await extract_ladder_from_url(
                ChallengePage(), "https://www.betfair.it/graph/1"
            )
        self.assertEqual(result["error_reason"], "security_challenge")

    async def test_persistent_browser_uses_no_weakening_flags(self):
        captured = {}

        class Context:
            pages = [object()]

        class Chromium:
            async def launch_persistent_context(self, profile, **kwargs):
                captured.update(kwargs)
                return Context()

        class Playwright:
            chromium = Chromium()

        await open_browser_session(Playwright(), "persistent", "profile", None)
        flags = captured["args"]
        self.assertNotIn("--no-sandbox", flags)
        self.assertNotIn("--disable-setuid-sandbox", flags)
        self.assertNotIn("--ignore-certificate-errors", flags)


if __name__ == "__main__":
    unittest.main()
