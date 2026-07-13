import unittest

from .graph_url import (
    build_selection_map,
    parse_direct_ladder_url,
    validate_ladder_mapping,
)


class ParseDirectLadderUrlTest(unittest.TestCase):
    def test_valid_path_extracts_ids_as_strings(self):
        result = parse_direct_ladder_url(
            "https://graphs.betfair.it/1.259630216/20954982/0"
        )

        self.assertEqual(
            {
                "ok": True,
                "market_id": "1.259630216",
                "selection_id": "20954982",
            },
            result,
        )

    def test_valid_path_allows_query_fragment_and_trailing_slash(self):
        result = parse_direct_ladder_url(
            "https://graphs.betfair.it/1.259630216/20954982/0/"
            "?source=test#ladder"
        )

        self.assertTrue(result["ok"])
        self.assertEqual("1.259630216", result["market_id"])
        self.assertEqual("20954982", result["selection_id"])

    def test_invalid_scheme_host_path_and_view(self):
        invalid_urls = [
            "http://graphs.betfair.it/1.259630216/20954982/0",
            "https://graphs.example.it/1.259630216/20954982/0",
            "https://graphs.betfair.it/1.259630216/20954982",
            "https://graphs.betfair.it/1.259630216/20954982/1",
        ]

        for raw_url in invalid_urls:
            with self.subTest(raw_url=raw_url):
                self.assertEqual(
                    {
                        "ok": False,
                        "reason": "bad_graph_url_invalid",
                    },
                    parse_direct_ladder_url(raw_url),
                )

    def test_runner_chart_data_is_explicitly_unsupported(self):
        result = parse_direct_ladder_url(
            "https://graphs.betfair.it/runnerChartData"
            "?marketId=1.259630216&selectionId=20954982"
        )

        self.assertEqual(
            {
                "ok": False,
                "reason": "bad_graph_url_unsupported_endpoint",
            },
            result,
        )


class ValidateLadderMappingTest(unittest.TestCase):
    def setUp(self):
        self.runner = {
            "name": "Runner A",
            "selectionId": 20954982,
        }
        self.selection_map = build_selection_map([self.runner])
        self.parsed_url = parse_direct_ladder_url(
            "https://graphs.betfair.it/1.259630216/20954982/0"
        )

    def test_valid_mapping_resolves_api_runner(self):
        result = validate_ladder_mapping(
            self.parsed_url,
            "1.259630216",
            self.selection_map,
            set(),
        )

        self.assertTrue(result["ok"])
        self.assertEqual("20954982", result["selection_id"])
        self.assertIs(self.runner, result["runner"])

    def test_market_id_mismatch(self):
        result = validate_ladder_mapping(
            self.parsed_url,
            "1.111111111",
            self.selection_map,
            set(),
        )

        self.assertEqual(
            {
                "ok": False,
                "reason": "bad_graph_url_market_mismatch",
            },
            result,
        )

    def test_selection_id_not_found(self):
        result = validate_ladder_mapping(
            self.parsed_url,
            "1.259630216",
            {},
            set(),
        )

        self.assertEqual(
            {
                "ok": False,
                "reason": "bad_graph_url_selection_not_found",
            },
            result,
        )

    def test_duplicate_selection_id(self):
        result = validate_ladder_mapping(
            self.parsed_url,
            "1.259630216",
            self.selection_map,
            {"20954982"},
        )

        self.assertEqual(
            {
                "ok": False,
                "reason": "bad_graph_url_duplicate_selection",
            },
            result,
        )

    def test_selection_map_skips_none_selection_id(self):
        selection_map = build_selection_map(
            [
                {"name": "Missing selection", "selectionId": None},
                {"name": "Known selection", "selectionId": 20954982},
            ]
        )

        self.assertNotIn("None", selection_map)
        self.assertIn("20954982", selection_map)


if __name__ == "__main__":
    unittest.main()
