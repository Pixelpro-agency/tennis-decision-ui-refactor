import json
import tempfile
import unittest
from pathlib import Path

from . import cache


SECRET = "CACHE_AUDIT_SECRET_VALUE"


class CacheRedactionTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.original_cache_dir = cache.CACHE_DIR
        self.cache_dir = Path(self.temporary_directory.name)
        cache.CACHE_DIR = self.cache_dir

    def tearDown(self):
        cache.CACHE_DIR = self.original_cache_dir
        self.temporary_directory.cleanup()

    def cache_path_for(self, url):
        return self.cache_dir / f"{cache.get_cache_key(url)}.json"

    def test_write_redacts_sensitive_diagnostics_in_temporary_cache(self):
        url = "https://example.test/market?event=1"
        payload = {
            "diagnostics": {
                "token": SECRET,
                "url": f"https://example.test/?appKey={SECRET}&event=1",
            },
            "runners": [{"name": "Runner One", "price": 2.5}],
        }

        cache.set_cached_result(url, payload)

        cache_path = self.cache_path_for(url)
        self.assertTrue(cache_path.exists())
        self.assertTrue(str(cache_path).startswith(str(self.cache_dir)))

        written_content = cache_path.read_text(encoding="utf-8")
        written_payload = json.loads(written_content)

        self.assertNotIn(SECRET, written_content)
        self.assertIn("<REDACTED>", written_content)
        self.assertEqual(written_payload["runners"][0]["name"], "Runner One")
        self.assertEqual(written_payload["runners"][0]["price"], 2.5)
        self.assertEqual(
            written_payload["diagnostics"]["url"],
            "https://example.test/?appKey=<REDACTED>&event=1",
        )

    def test_legacy_cache_is_redacted_when_read_without_rewriting(self):
        url = "https://example.test/legacy?event=2"
        cache_path = self.cache_path_for(url)
        cache_path.parent.mkdir(parents=True, exist_ok=True)

        legacy_payload = {
            "error": f"token: {SECRET}",
            "diagnostics": {
                "BETFAIR_APP_KEY": SECRET,
                "marketId": "1.234567",
            },
            "runners": [{"name": "Legacy Runner", "volume": 125.0}],
        }
        cache_path.write_text(
            json.dumps(legacy_payload),
            encoding="utf-8",
        )

        cached = cache.get_cached_result(url)
        serialized = json.dumps(cached, ensure_ascii=False)

        self.assertNotIn(SECRET, serialized)
        self.assertIn("<REDACTED>", serialized)
        self.assertEqual(cached["diagnostics"]["marketId"], "1.234567")
        self.assertEqual(cached["runners"][0]["name"], "Legacy Runner")
        self.assertEqual(cached["runners"][0]["volume"], 125.0)


if __name__ == "__main__":
    unittest.main()
