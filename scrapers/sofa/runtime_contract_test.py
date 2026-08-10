import asyncio
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from scrapers.sofa import cache, cli
from scrapers.sofa.browser import (
    ENDPOINT_TIMEOUT_MS,
    WHOLE_SCRAPE_TIMEOUT_SECONDS,
    error_result,
)
from scrapers.sofa.urls import (
    build_sofascore_api_urls,
    normalize_input_urls,
)


class SofaRuntimeContractTests(unittest.TestCase):
    def test_single_match_url_expands_to_canonical_endpoints(self):
        urls = normalize_input_urls([
            "https://www.sofascore.com/player-a-player-b#id:16402319"
        ])
        self.assertEqual(urls, build_sofascore_api_urls("16402319"))

    def test_foreign_host_and_unsafe_components_are_rejected(self):
        for value in (
            "https://evil.test/api/v1/event/123",
            "http://www.sofascore.com/api/v1/event/123",
            "https://user:pass@www.sofascore.com/api/v1/event/123",
            "https://www.sofascore.com/api/v1/event/123?token=secret",
        ):
            with self.subTest(value=value), self.assertRaises(ValueError):
                normalize_input_urls([value])

    def test_mixed_events_and_multiple_match_urls_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "mixed_event_ids"):
            normalize_input_urls([
                "https://www.sofascore.com/api/v1/event/123",
                "https://www.sofascore.com/api/v1/event/456/statistics",
            ])
        with self.assertRaisesRegex(ValueError, "mixed_or_multiple_match_urls"):
            normalize_input_urls([
                "https://www.sofascore.com/a#id:123",
                "https://www.sofascore.com/b#id:123",
            ])

    def test_cache_key_is_opaque_collision_resistant_and_ordered(self):
        first = cache.get_cache_key(["https://www.sofascore.com/api/v1/event/123"])
        second = cache.get_cache_key(["https://www.sofascore.com/api/v1/event/124"])
        reversed_key = cache.get_cache_key(["b", "a"])
        ordered_key = cache.get_cache_key(["a", "b"])
        self.assertEqual(len(first), 64)
        self.assertNotEqual(first, second)
        self.assertNotEqual(reversed_key, ordered_key)
        self.assertNotIn("123", first)

    def test_only_success_results_are_cached(self):
        with tempfile.TemporaryDirectory() as directory, \
             patch.object(cache, "CACHE_DIR", Path(directory)):
            urls = ["https://www.sofascore.com/api/v1/event/123"]
            self.assertFalse(cache.set_cached_result(urls, {
                urls[0]: error_result("http_error", "failed", 403),
            }))
            self.assertIsNone(cache.get_cached_result(urls))
            self.assertTrue(cache.set_cached_result(urls, {
                urls[0]: {"event": {"id": 123}},
            }))
            self.assertEqual(cache.get_cached_result(urls)[urls[0]]["event"]["id"], 123)

    def test_error_schema_and_timeout_hierarchy_are_bounded(self):
        self.assertEqual(error_result("challenge_unresolved", "SofaScore challenge unresolved"), {
            "ok": False,
            "error": {
                "code": "challenge_unresolved",
                "message": "SofaScore challenge unresolved",
            },
        })
        self.assertLess(ENDPOINT_TIMEOUT_MS, WHOLE_SCRAPE_TIMEOUT_SECONDS * 1000)
        self.assertLess(WHOLE_SCRAPE_TIMEOUT_SECONDS, 120)

    def test_invalid_cli_input_is_json_and_nonzero(self):
        output = io.StringIO()
        with redirect_stdout(output), self.assertRaises(SystemExit):
            asyncio.run(cli.main(["https://evil.test/api/v1/event/123"]))
        payload = json.loads(output.getvalue())
        self.assertFalse(payload["ok"])
        self.assertEqual(payload["error"]["code"], "invalid_sofascore_url")


if __name__ == "__main__":
    unittest.main()
