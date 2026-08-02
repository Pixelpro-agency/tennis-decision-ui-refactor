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

    def test_prompt8_control_and_truncation(self):
        value = "safe\n[Admin] token=SECRET\x1b[31m" + "x" * 2000
        redacted = redact_text(value)
        self.assertNotIn("SECRET", redacted)
        self.assertNotIn("\n", redacted)
        self.assertNotIn("\x1b", redacted)
        self.assertLessEqual(len(redacted), 1000)
        self.assertTrue(redacted.endswith("<truncated>"))

    def test_prompt8_log_event_uses_stderr_not_stdout(self):
        import contextlib
        import io
        stdout = io.StringIO()
        stderr = io.StringIO()
        original_log_file = config.LOG_FILE
        with tempfile.TemporaryDirectory() as temporary_directory:
            config.LOG_FILE = Path(temporary_directory) / "betfair.log"
            try:
                with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
                    config.log_event("betfair_cli", "scraper_start", mode="cdp", count=2)
            finally:
                config.LOG_FILE = original_log_file
        self.assertEqual(stdout.getvalue(), "")
        self.assertIn("event=scraper_start", stderr.getvalue())
        self.assertNotIn("http://", stderr.getvalue())

class Prompt8RRedactionTest(unittest.TestCase):
    def assert_text_redacted(self, value, forbidden):
        redacted = redact_text(value)
        self.assertIn("<REDACTED>", redacted)
        for marker in forbidden:
            self.assertNotIn(marker, redacted)

    def test_rg1_authorization_basic(self):
        self.assert_text_redacted(
            "Authorization: Basic dXNlcjpwYXNz",
            ("Basic", "dXNlcjpwYXNz"),
        )

    def test_rg2_authorization_digest(self):
        self.assert_text_redacted(
            'Authorization: Digest username="u", response="secret"',
            ("Digest", "username", "response", "secret"),
        )

    def test_rg3_rg4_cookie_headers(self):
        self.assert_text_redacted(
            "Cookie: foo=bar; sessionid=abcdef; pref=hello",
            ("foo=bar", "abcdef", "pref=hello"),
        )
        self.assert_text_redacted(
            "Set-Cookie: sid=abc; Path=/; HttpOnly",
            ("sid=abc", "Path=", "HttpOnly"),
        )

    def test_rg5_rg6_quoted_json_values(self):
        value = (
            '{"token":"abc","Authorization":"Basic hidden",'
            '"Cookie":"sid=xyz","safe":"value"}'
        )
        redacted = redact_text(value)
        for marker in ('"abc"', "Basic hidden", "sid=xyz"):
            self.assertNotIn(marker, redacted)
        self.assertIn('"safe":"value"', redacted)

    def test_rg7_rg10_windows_unc_and_posix_paths(self):
        cases = (
            ("C:/Users/Utente/Profile", ("Utente",)),
            (r"C:\Users\Utente\Profile", ("Utente",)),
            (r"\\server\share\folder", ("server", "share")),
            (r"\\?\C:\Users\Utente\Profile", ("Utente",)),
            ("/workspace/project/.env", ("workspace",)),
            ("/usr/local/bin/python", ("usr/local",)),
            ("/app/runtime/file", ("app/runtime",)),
            ("/root/.config", ("root/.config",)),
        )
        for value, forbidden in cases:
            with self.subTest(value=value):
                self.assert_text_redacted(value, forbidden)

    def test_rg11_rg12_finite_and_non_finite_log_fields(self):
        import contextlib
        import io

        stderr = io.StringIO()
        original_log_file = config.LOG_FILE
        with tempfile.TemporaryDirectory() as temporary_directory:
            config.LOG_FILE = Path(temporary_directory) / "betfair.log"
            try:
                with contextlib.redirect_stderr(stderr):
                    config.log_event(
                        "betfair_cli",
                        "finite_numbers",
                        port=3001,
                        attempt=1.5,
                        count=0,
                        requested=float("nan"),
                        graceful=float("inf"),
                        remaining=float("-inf"),
                    )
            finally:
                config.LOG_FILE = original_log_file
        line = stderr.getvalue()
        self.assertIn("port=3001", line)
        self.assertIn("attempt=1.5", line)
        self.assertIn("count=0", line)
        self.assertNotIn("requested=", line)
        self.assertNotIn("graceful=", line)
        self.assertNotIn("remaining=", line)


class Prompt8R2RedactionTest(unittest.TestCase):
    def assert_no_value(self, redacted, *values):
        for value in values:
            self.assertNotIn(value, redacted)

    def test_pr1_authorization_followed_by_event(self):
        redacted = redact_text("Authorization: Basic abc event=1")
        self.assertEqual(redacted, "Authorization: <REDACTED> event=1")

    def test_pr2_complete_digest_followed_by_event(self):
        redacted = redact_text(
            'Authorization: Digest username="u", realm="r", '
            'response="secret" event=1'
        )
        self.assertEqual(redacted, "Authorization: <REDACTED> event=1")
        self.assert_no_value(
            redacted,
            "Digest",
            "username",
            "realm",
            "response",
            "secret",
        )

    def test_pr3_cookie_followed_by_sensitive_key(self):
        redacted = redact_text(
            "cookie: first-secret api_key=second-secret"
        )
        self.assertEqual(
            redacted,
            "cookie: <REDACTED> api_key=<REDACTED>",
        )

    def test_pr4_multiple_cookies_are_one_header_value(self):
        redacted = redact_text(
            "Cookie: foo=bar; sessionid=abcdef; pref=hello"
        )
        self.assertEqual(redacted, "Cookie: <REDACTED>")
        self.assert_no_value(redacted, "foo=bar", "abcdef", "pref=hello")

    def test_pr5_set_cookie_attributes_are_redacted(self):
        redacted = redact_text(
            "Set-Cookie: sid=abc; Path=/; HttpOnly; "
            "Secure; SameSite=Lax"
        )
        self.assertEqual(redacted, "Set-Cookie: <REDACTED>")
        self.assert_no_value(
            redacted,
            "sid=abc",
            "Path=",
            "HttpOnly",
            "Secure",
            "SameSite",
        )

    def test_pr6_x_application_followed_by_event(self):
        redacted = redact_text("x-application: secret event=1")
        self.assertEqual(redacted, "x-application: <REDACTED> event=1")

    def test_pr7_multiple_header_lines_are_independent(self):
        redacted = redact_text(
            "Authorization: Basic abc\n"
            "Cookie: sid=xyz\n"
            "x-application: hidden status=ready"
        )
        self.assertIn("Authorization: <REDACTED>", redacted)
        self.assertIn("Cookie: <REDACTED>", redacted)
        self.assertIn(
            "x-application: <REDACTED> status=ready",
            redacted,
        )
        self.assert_no_value(redacted, "Basic abc", "sid=xyz", "hidden")

    def test_pr8_json_safe_fields_are_preserved(self):
        redacted = redact_text(
            '{"token":"abc","safe":"value","event":"1"}'
        )
        parsed = json.loads(redacted)
        self.assertEqual(parsed["token"], "<REDACTED>")
        self.assertEqual(parsed["safe"], "value")
        self.assertEqual(parsed["event"], "1")

    def test_pr9_url_safe_query_is_preserved(self):
        redacted = redact_text(
            "request https://example.test/path"
            "?token=abc&eventIds=123"
        )
        self.assertNotIn("abc", redacted)
        self.assertIn("token=<REDACTED>", redacted)
        self.assertIn("eventIds=123", redacted)

    def test_pr10_path_redaction_regressions(self):
        cases = (
            r"C:\Users\Utente\Profile",
            "C:/Users/Utente/Profile",
            r"\\server\share\folder",
            "/workspace/project/.env",
            "/usr/local/bin/python",
            "/app/runtime/file",
            "/root/.config",
        )
        for value in cases:
            with self.subTest(value=value):
                redacted = redact_text(value)
                self.assertIn("<REDACTED>", redacted)
                self.assertNotEqual(redacted, value)

    def test_previous_free_text_regression_is_preserved(self):
        redacted = redact_text(
            "received Bearer bearer-secret "
            "authorization=auth-secret "
            "cookie: cookie-secret "
            "api_key=app-secret"
        )
        self.assertIn("Bearer <REDACTED>", redacted)
        self.assertIn("authorization=<REDACTED>", redacted)
        self.assertIn("cookie: <REDACTED>", redacted)
        self.assertIn("api_key=<REDACTED>", redacted)
        self.assert_no_value(
            redacted,
            "bearer-secret",
            "auth-secret",
            "cookie-secret",
            "app-secret",
        )


if __name__ == "__main__":
    unittest.main()
