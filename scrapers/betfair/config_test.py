import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch


with patch.dict(
    os.environ,
    {"BETFAIR_APP_KEY": "TEST_BOOTSTRAP_KEY"},
    clear=False,
):
    from .config import resolve_betfair_app_key


class ConfigResolutionTest(unittest.TestCase):
    def write_env(self, directory, content):
        path = Path(directory) / ".env"
        path.write_text(content, encoding="utf-8")
        return path

    def test_environment_value_precedes_file(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "BETFAIR_APP_KEY=FILE_TEST_KEY\n",
            )

            value = resolve_betfair_app_key(
                {"BETFAIR_APP_KEY": "ENV_TEST_KEY"},
                env_file,
            )

        self.assertEqual(value, "ENV_TEST_KEY")

    def test_file_value_is_used_as_fallback(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "BETFAIR_APP_KEY=FILE_TEST_KEY\n",
            )

            value = resolve_betfair_app_key({}, env_file)

        self.assertEqual(value, "FILE_TEST_KEY")

    def test_export_syntax_is_supported(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "export BETFAIR_APP_KEY=FILE_TEST_KEY\n",
            )

            value = resolve_betfair_app_key({}, env_file)

        self.assertEqual(value, "FILE_TEST_KEY")

    def test_quoted_value_is_supported(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                'BETFAIR_APP_KEY="FILE_TEST_KEY"\n',
            )

            value = resolve_betfair_app_key({}, env_file)

        self.assertEqual(value, "FILE_TEST_KEY")

    def test_missing_key_has_static_error(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "# no Betfair key here\nOTHER_KEY=value\n",
            )

            with self.assertRaises(RuntimeError) as context:
                resolve_betfair_app_key({}, env_file)

        self.assertEqual(
            str(context.exception),
            "BETFAIR_APP_KEY is required",
        )
        self.assertNotIn("ENV_TEST_KEY", str(context.exception))
        self.assertNotIn("FILE_TEST_KEY", str(context.exception))

    def test_resolution_does_not_print_values(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "BETFAIR_APP_KEY=FILE_TEST_KEY\n",
            )
            stdout = StringIO()
            stderr = StringIO()

            with redirect_stdout(stdout), redirect_stderr(stderr):
                value = resolve_betfair_app_key({}, env_file)

        self.assertEqual(value, "FILE_TEST_KEY")
        self.assertEqual(stdout.getvalue(), "")
        self.assertEqual(stderr.getvalue(), "")

    def test_empty_environment_falls_back_to_file(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "BETFAIR_APP_KEY=FILE_TEST_KEY\n",
            )

            value = resolve_betfair_app_key(
                {"BETFAIR_APP_KEY": ""},
                env_file,
            )

        self.assertEqual(value, "FILE_TEST_KEY")

    def test_whitespace_environment_falls_back_to_file(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "BETFAIR_APP_KEY=FILE_TEST_KEY\n",
            )

            value = resolve_betfair_app_key(
                {"BETFAIR_APP_KEY": "   \t  "},
                env_file,
            )

        self.assertEqual(value, "FILE_TEST_KEY")

    def test_empty_file_value_has_static_error(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "BETFAIR_APP_KEY=\n",
            )

            with self.assertRaises(RuntimeError) as context:
                resolve_betfair_app_key({}, env_file)

        self.assertEqual(
            str(context.exception),
            "BETFAIR_APP_KEY is required",
        )

    def test_quoted_empty_file_value_has_static_error(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                'BETFAIR_APP_KEY=""\n',
            )

            with self.assertRaises(RuntimeError) as context:
                resolve_betfair_app_key({}, env_file)

        self.assertEqual(
            str(context.exception),
            "BETFAIR_APP_KEY is required",
        )

    def test_quoted_whitespace_file_value_has_static_error(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = self.write_env(
                directory,
                "BETFAIR_APP_KEY='   '\n",
            )

            with self.assertRaises(RuntimeError) as context:
                resolve_betfair_app_key({}, env_file)

        self.assertEqual(
            str(context.exception),
            "BETFAIR_APP_KEY is required",
        )


if __name__ == "__main__":
    unittest.main()
