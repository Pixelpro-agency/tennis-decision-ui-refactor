import asyncio
import json
import tempfile
import unittest
from pathlib import Path

from . import config
from .market_api import api_get
from .network_capture import handle_network_response
from .diagnostic_redaction import (
    redact_headers,
    redact_text,
    redact_url,
    redact_value,
)


SECRET_AK = "SECRET_AK_VALUE"
SECRET_COOKIE = "SECRET_COOKIE_VALUE"
SECRET_BEARER = "SECRET_BEARER_VALUE"
SECRET_APP_KEY = "SECRET_APP_KEY_VALUE"


class FakeNetworkResponse:
    url = (
        "https://ero.betfair.it/readonly/data"
        f"?_ak={SECRET_AK}&eventIds=123"
    )
    status = 200
    headers = {
        "content-type": "application/json",
        "Cookie": SECRET_COOKIE,
        "X-Api-Key": SECRET_AK,
        "X-Trace": "trace-value",
    }

    async def body(self):
        return json.dumps({
            "token": SECRET_BEARER,
            "nested": {
                "cookie": SECRET_COOKIE,
                "authorization": f"Bearer {SECRET_BEARER}",
                "marketId": "1.234567",
                "selectionId": 55,
                "runnerName": "Runner One",
                "price": 2.5,
                "volume": 150.0,
                "timestamp": "2026-07-04T10:00:00",
                "source": (
                    "https://ero.betfair.it/path"
                    f"?_ak={SECRET_AK}&eventIds=123"
                ),
            },
        }).encode("utf-8")


class FakeErrorResponse:
    status = 500

    async def text(self):
        return f"remote response with {SECRET_AK}"


class FakeRequest:
    def __init__(self, response):
        self.response = response

    async def get(self, _url):
        return self.response


class FakePage:
    def __init__(self, response):
        self.request = FakeRequest(response)


class DiagnosticRedactionTest(unittest.TestCase):
    def assert_no_markers(self, value):
        for marker in (
            SECRET_AK,
            SECRET_COOKIE,
            SECRET_BEARER,
            SECRET_APP_KEY,
        ):
            self.assertNotIn(marker, value)

    def test_redact_url_keeps_normal_parameters(self):
        value = (
            "https://ero.betfair.it/path"
            f"?_ak={SECRET_AK}&token={SECRET_BEARER}"
            "&eventIds=123#fragment"
        )

        redacted = redact_url(value)

        self.assertEqual(
            redacted,
            "https://ero.betfair.it/path"
            "?_ak=<REDACTED>&token=<REDACTED>"
            "&eventIds=123#fragment",
        )
        self.assert_no_markers(redacted)

    def test_redact_headers_is_case_insensitive(self):
        headers = {
            "Authorization": f"Bearer {SECRET_BEARER}",
            "COOKIE": SECRET_COOKIE,
            "x-api-key": SECRET_AK,
            "X-Application": SECRET_APP_KEY,
            "X-Application-Key": SECRET_APP_KEY,
            "Content-Type": "application/json",
            "X-Trace": "trace-value",
        }

        redacted = redact_headers(headers)

        self.assertEqual(redacted["Authorization"], "<REDACTED>")
        self.assertEqual(redacted["COOKIE"], "<REDACTED>")
        self.assertEqual(redacted["x-api-key"], "<REDACTED>")
        self.assertEqual(redacted["X-Application"], "<REDACTED>")
        self.assertEqual(redacted["X-Application-Key"], "<REDACTED>")
        self.assertEqual(redacted["Content-Type"], "application/json")
        self.assertEqual(redacted["X-Trace"], "trace-value")

    def test_redact_nested_json_preserves_business_data(self):
        payload = {
            "token": SECRET_BEARER,
            "details": {
                "Cookie": SECRET_COOKIE,
                "Authorization": f"Bearer {SECRET_BEARER}",
                "marketId": "1.234567",
                "selectionId": 55,
                "runnerName": "Runner One",
                "price": 2.5,
                "volume": 150.0,
                "timestamp": "2026-07-04T10:00:00",
                "url": (
                    "https://ero.betfair.it/path"
                    f"?_ak={SECRET_AK}&eventIds=123"
                ),
            },
            "items": [
                {"access_token": SECRET_BEARER, "eventId": "789"},
            ],
        }

        redacted = redact_value(payload)
        serialized = json.dumps(redacted, ensure_ascii=False)

        self.assert_no_markers(serialized)
        self.assertEqual(redacted["details"]["marketId"], "1.234567")
        self.assertEqual(redacted["details"]["selectionId"], 55)
        self.assertEqual(redacted["details"]["runnerName"], "Runner One")
        self.assertEqual(redacted["details"]["price"], 2.5)
        self.assertEqual(redacted["details"]["volume"], 150.0)
        self.assertEqual(
            redacted["details"]["url"],
            "https://ero.betfair.it/path"
            "?_ak=<REDACTED>&eventIds=123",
        )

    def test_redact_free_text(self):
        value = (
            "request https://ero.betfair.it/path"
            f"?_ak={SECRET_AK}&eventIds=123 "
            f"received Bearer {SECRET_BEARER} "
            f"authorization={SECRET_AK} "
            f"cookie: {SECRET_COOKIE} "
            f"api_key={SECRET_AK}"
        )

        redacted = redact_text(value)

        self.assert_no_markers(redacted)
        self.assertIn("eventIds=123", redacted)
        self.assertIn("Bearer <REDACTED>", redacted)
        self.assertIn("authorization=<REDACTED>", redacted)
        self.assertIn("cookie: <REDACTED>", redacted)
        self.assertIn("api_key=<REDACTED>", redacted)


    def test_redact_app_key_aliases_in_urls(self):
        cases = (
            (
                "appKey",
                f"https://example.test/?appKey={SECRET_APP_KEY}&event=1",
            ),
            (
                "app_key",
                f"https://example.test/?app_key={SECRET_APP_KEY}&event=1",
            ),
        )

        for label, value in cases:
            with self.subTest(label=label):
                redacted = redact_url(value)

                self.assertNotIn(SECRET_APP_KEY, redacted)
                self.assertIn("<REDACTED>", redacted)
                self.assertIn("event=1", redacted)

    def test_redact_app_key_aliases_and_jsonish_text(self):
        cases = (
            (
                "APP_KEY_equals",
                f"APP_KEY={SECRET_APP_KEY} market=winner",
                "market=winner",
            ),
            (
                "APP_KEY_colon",
                f"APP_KEY: {SECRET_APP_KEY} market=winner",
                "market=winner",
            ),
            (
                "BETFAIR_APP_KEY_equals",
                f"BETFAIR_APP_KEY={SECRET_APP_KEY} event=1",
                "event=1",
            ),
            (
                "token_colon",
                f"token: {SECRET_APP_KEY} event=1",
                "event=1",
            ),
            (
                "json_token",
                f'{{"token":"{SECRET_APP_KEY}","event":"1"}}',
                '"event":"1"',
            ),
            (
                "json_appKey",
                f'{{"appKey":"{SECRET_APP_KEY}","event":"1"}}',
                '"event":"1"',
            ),
        )

        for label, value, business_text in cases:
            with self.subTest(label=label):
                redacted = redact_text(value)

                self.assertNotIn(SECRET_APP_KEY, redacted)
                self.assertIn("<REDACTED>", redacted)
                self.assertIn(business_text, redacted)


    def test_redact_application_header_aliases_in_text(self):
        cases = (
            (
                "json_x_application",
                f'{{"x-application":"{SECRET_APP_KEY}","event":"1"}}',
                True,
            ),
            (
                "json_x_application_key",
                f'{{"x-application-key":"{SECRET_APP_KEY}","event":"1"}}',
                True,
            ),
            (
                "x_application_colon",
                f"x-application: {SECRET_APP_KEY} event=1",
                False,
            ),
            (
                "x_application_key_equals",
                f"x-application-key={SECRET_APP_KEY} event=1",
                False,
            ),
        )

        for label, value, is_json in cases:
            with self.subTest(label=label):
                redacted = redact_text(value)

                self.assertNotIn(SECRET_APP_KEY, redacted)
                self.assertIn("<REDACTED>", redacted)

                if is_json:
                    parsed = json.loads(redacted)
                    self.assertEqual(parsed["event"], "1")
                else:
                    self.assertIn("event=1", redacted)

    def test_log_file_contains_no_secret_markers(self):
        original_log_file = config.LOG_FILE

        with tempfile.TemporaryDirectory() as temporary_directory:
            config.LOG_FILE = Path(temporary_directory) / "betfair.log"

            try:
                config.log(
                    "diagnostic "
                    f"https://ero.betfair.it/path?_ak={SECRET_AK} "
                    f"Bearer {SECRET_BEARER} "
                    f"cookie: {SECRET_COOKIE}"
                )
                content = config.LOG_FILE.read_text(encoding="utf-8")
            finally:
                config.LOG_FILE = original_log_file

        self.assert_no_markers(content)
        self.assertIn("<REDACTED>", content)

    def test_network_dump_contains_no_secret_markers(self):
        collector = {
            "enabled": True,
            "responses": [],
            "errors": [],
            "json_payloads": [],
            "saved": [],
        }

        with tempfile.TemporaryDirectory() as temporary_directory:
            asyncio.run(
                handle_network_response(
                    FakeNetworkResponse(),
                    collector,
                    temporary_directory,
                )
            )

            contents = "\n".join(
                path.read_text(encoding="utf-8")
                for path in Path(temporary_directory).iterdir()
                if path.is_file()
            )

        self.assert_no_markers(contents)
        self.assert_no_markers(
            json.dumps(collector, ensure_ascii=False, default=str)
        )
        self.assertIn("marketId", contents)
        self.assertIn("eventIds=123", contents)

    def test_http_error_omits_remote_body(self):
        page = FakePage(FakeErrorResponse())

        async def run_request():
            with self.assertRaises(Exception) as context:
                await api_get(
                    page,
                    "https://ero.betfair.it/path"
                    f"?_ak={SECRET_AK}",
                )
            return str(context.exception)

        with tempfile.TemporaryDirectory() as temporary_directory:
            original_log_file = config.LOG_FILE
            config.LOG_FILE = Path(temporary_directory) / "betfair.log"

            try:
                message = asyncio.run(run_request())
            finally:
                config.LOG_FILE = original_log_file

        self.assertEqual(message, "API status 500")
        self.assertNotIn(SECRET_AK, message)


if __name__ == "__main__":
    unittest.main()
