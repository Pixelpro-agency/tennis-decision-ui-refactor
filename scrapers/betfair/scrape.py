import asyncio

from playwright.async_api import async_playwright
from playwright_stealth import Stealth

from .browser_session import (
    detect_betfair_event_status,
    detect_logged_in,
    open_browser_session,
)
from .config import log
from .graph_url import (
    build_selection_map,
    parse_direct_ladder_url,
    validate_ladder_mapping,
)
from .ladder import extract_ladder_from_url
from .market_api import fetch_market_data_api
from .network_capture import (
    ensure_network_dump_dir,
    install_network_capture,
    summarize_network_capture,
)
from .diagnostic_redaction import redact_text, redact_url, redact_value
from .parsing import extract_event_id


def add_graph_failure(graph_diagnostics, url, reason, text=None):
    if len(graph_diagnostics["failures"]) >= 5:
        return

    item = {
        "url": redact_url(str(url))[:200],
        "reason": reason,
    }

    if text:
        item["text"] = redact_text(str(text))[:200]

    graph_diagnostics["failures"].append(item)


async def close_ladder_page(page, main_page):
    if not page or page == main_page:
        return

    try:
        await page.close()
    except Exception as error:
        log(f"[Browser] ladder page close warning: {error}")


async def scrape_betfair(
    url,
    mode="persistent",
    profile_dir=None,
    cdp_url=None,
    ladder_urls=None,
    network_capture=True,
):
    ladder_urls = ladder_urls or []

    results = {
        "runners": [],
        "market_info": {},
    }

    graph_diagnostics = {
        "graphUrlsProvided": len(ladder_urls),
        "graphUrlsAttempted": 0,
        "graphUrlsSucceeded": 0,
        "graphUrlsFailed": 0,
        "graphRowsTotal": 0,
        "authSuspected": False,
        "loggedInHeuristic": None,
        "skippedBecauseFinished": False,
        "failures": [],
    }

    collector = {
        "enabled": network_capture,
        "responses": [],
        "saved": [],
        "json_payloads": [],
        "errors": [],
    }

    dump_dir = ensure_network_dump_dir() if network_capture else ""
    collector["dump_dir"] = str(dump_dir)

    async with async_playwright() as playwright:
        context, page, should_close_context = await open_browser_session(
            playwright,
            mode,
            profile_dir,
            cdp_url,
        )

        try:
            await Stealth().apply_stealth_async(page)

            if network_capture:
                install_network_capture(page, collector, dump_dir)

            log(f"[Browser] Navigating to {url}")

            await page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=60000,
            )

            await asyncio.sleep(2 + (1 if not ladder_urls else 0))

            logged_in = await detect_logged_in(page)
            graph_diagnostics["loggedInHeuristic"] = logged_in

            log(f"[Browser] Logged in heuristic: {logged_in}")

            if not logged_in:
                log("[Browser] WARNING: user may not be logged in. Data may be missing.")

            event_status = await detect_betfair_event_status(page)
            results["event_status"] = event_status

            log(
                f"[Browser] Event status: "
                f"hasFinished={event_status['hasFinished']} "
                f"source={event_status['source']}"
            )

            if event_status["hasFinished"]:
                log(
                    "[Browser] Betfair event finished detected "
                    f"via {event_status['source']}"
                )

            event_id = extract_event_id(url)

            if not event_id:
                raise Exception("Could not extract event ID from URL")

            try:
                api_results = await fetch_market_data_api(page, event_id)

                results["runners"] = api_results.get("runners", [])
                results["market_info"] = api_results.get("market_info", {})

                log(f"[Browser] Found {len(results['runners'])} runners")

            except Exception as error:
                log(f"[Browser] API fetch failed: {error}")
                results["api_error"] = redact_text(str(error))

            selection_map = build_selection_map(
                results.get("runners", [])
            )
            market_info = results.get("market_info", {})
            expected_market_id = (
                market_info.get("market_id")
                if isinstance(market_info, dict)
                else None
            )
            seen_selection_ids = set()

            if event_status.get("hasFinished"):
                log("[Browser] Event finished; skipping ladder/graph URLs")
                graph_diagnostics["skippedBecauseFinished"] = True

            elif ladder_urls:
                log(
                    "[Browser] Direct graph URLs provided; "
                    "skipping UI graph clicks"
                )

                for ladder_url in ladder_urls:
                    graph_diagnostics["graphUrlsAttempted"] += 1

                    parsed_url = parse_direct_ladder_url(ladder_url)
                    mapping_result = validate_ladder_mapping(
                        parsed_url,
                        expected_market_id,
                        selection_map,
                        seen_selection_ids,
                    )

                    if not mapping_result["ok"]:
                        graph_diagnostics["graphUrlsFailed"] += 1

                        add_graph_failure(
                            graph_diagnostics,
                            ladder_url,
                            mapping_result["reason"],
                        )

                        log(
                            "[Browser] Skipping graph URL "
                            f"{ladder_url}: {mapping_result['reason']}"
                        )

                        continue

                    selection_id = mapping_result["selection_id"]
                    runner = mapping_result["runner"]
                    seen_selection_ids.add(selection_id)
                    ladder_page = None

                    try:
                        ladder_page = await context.new_page()

                        if network_capture:
                            install_network_capture(
                                ladder_page,
                                collector,
                                dump_dir,
                            )

                        ladder_result = await extract_ladder_from_url(
                            ladder_page,
                            ladder_url,
                        )

                        if (
                            isinstance(ladder_result, dict)
                            and "login_required" in ladder_result
                        ):
                            results["diagnostics"] = redact_value(
                                ladder_result["login_required"]
                            )

                            graph_diagnostics["authSuspected"] = True
                            graph_diagnostics["graphUrlsFailed"] += 1

                            add_graph_failure(
                                graph_diagnostics,
                                ladder_url,
                                "auth_suspected",
                                ladder_result["login_required"].get(
                                    "graphLoginRequiredText",
                                    "",
                                ),
                            )

                            log(
                                "[Browser] Login required detected "
                                f"on graph URL: {ladder_url}"
                            )

                            break

                        ladder_rows = (
                            ladder_result.get("ladder", [])
                            if isinstance(ladder_result, dict)
                            else ladder_result
                        )

                        if ladder_rows:
                            runner["ladder"] = ladder_rows
                            runner["ladder_source"] = "graph_url"

                            graph_diagnostics["graphUrlsSucceeded"] += 1
                            graph_diagnostics["graphRowsTotal"] += len(
                                ladder_rows
                            )

                            log(
                                f"[Browser] Assigned ladder to "
                                f"{runner['name']} "
                                f"({len(ladder_rows)} rows)"
                            )

                        else:
                            graph_diagnostics["graphUrlsFailed"] += 1

                            if (
                                isinstance(ladder_result, dict)
                                and ladder_result.get("error_reason")
                            ):
                                add_graph_failure(
                                    graph_diagnostics,
                                    ladder_url,
                                    ladder_result["error_reason"],
                                    ladder_result.get("error_text", ""),
                                )
                            else:
                                add_graph_failure(
                                    graph_diagnostics,
                                    ladder_url,
                                    "no_ladder_rows",
                                )

                            log(
                                "[Browser] No ladder rows extracted "
                                f"from {ladder_url}; network capture "
                                "may still contain useful data"
                            )

                    except Exception as error:
                        graph_diagnostics["graphUrlsFailed"] += 1

                        add_graph_failure(
                            graph_diagnostics,
                            ladder_url,
                            "temporary_error",
                            error,
                        )

                        log(
                            f"[Browser] Ladder URL error "
                            f"{ladder_url}: {error}"
                        )

                    finally:
                        await close_ladder_page(ladder_page, page)

            else:
                log(
                    "[Browser] No direct ladder URLs provided; "
                    "skipping fragile UI graph clicks"
                )

        except Exception as error:
            log(f"[Browser] ERROR: {error}")
            results["error"] = redact_text(str(error))

        finally:
            if should_close_context:
                log("[Browser] Closing persistent context")
                await context.close()
            else:
                log("[Browser] Leaving CDP context open")

    results["network_capture"] = summarize_network_capture(collector)
    results["graph_diagnostics"] = graph_diagnostics

    if not isinstance(results.get("runners"), list):
        results["runners"] = []

    if not isinstance(results.get("market_info"), dict):
        results["market_info"] = {}

    return results


async def open_login_window(
    url,
    mode="persistent",
    profile_dir=None,
    cdp_url=None,
):
    async with async_playwright() as playwright:
        context, page, should_close_context = await open_browser_session(
            playwright,
            mode,
            profile_dir,
            cdp_url,
        )

        try:
            log(f"[LoginWindow] Navigating to {url}")

            await page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=60000,
            )

            await asyncio.sleep(1)

            try:
                await page.add_style_tag(
                    content="""
                    #onetrust-consent-sdk,
                    #onetrust-banner-sdk,
                    .onetrust-pc-dark-filter,
                    [class*="onetrust"],
                    .ot-sdk-container,
                    .ot-sdk-row,
                    #onetrust-style {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                    }

                    body,
                    html {
                        overflow: auto !important;
                    }
                    """
                )

                await page.evaluate(
                    """() => {
                        [
                            'onetrust-consent-sdk',
                            'onetrust-banner-sdk',
                            'onetrust-style'
                        ].forEach((id) => {
                            const element = document.getElementById(id);

                            if (element) {
                                element.remove();
                            }
                        });

                        document
                            .querySelectorAll(
                                '.onetrust-pc-dark-filter, [class*="onetrust"]'
                            )
                            .forEach((element) => element.remove());
                    }"""
                )

            except Exception as error:
                log(f"[LoginWindow] Banner cleanup warning: {error}")

            log(
                "[LoginWindow] Window ready. "
                "Log in and close the browser when done."
            )

            while context.pages:
                await asyncio.sleep(1)

        finally:
            if should_close_context:
                await context.close()
