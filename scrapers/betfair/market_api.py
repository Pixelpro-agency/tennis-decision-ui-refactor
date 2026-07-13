from .config import APP_KEY, log
from .parsing import format_eur


async def api_get(page, url):
    log(f"[API] GET {url}")

    response = await page.request.get(url)

    if response.status >= 400:
        raise Exception(f"API status {response.status}")

    return await response.json()


async def fetch_market_data_api(page, event_id):
    byeventUrl = (
        f"https://ero.betfair.it/www/sports/exchange/readonly/v1/byevent"
        f"?_ak={APP_KEY}&currencyCode=EUR&eventIds={event_id}&locale=it"
        f"&rollupLimit=10&rollupModel=STAKE"
        f"&types=MARKET_STATE,EVENT,MARKET_DESCRIPTION"
    )

    byevent = await api_get(page, byeventUrl)

    marketId = None
    marketTotal = 0

    for eventType in byevent.get("eventTypes", []):
        for eventNode in eventType.get("eventNodes", []):
            for market in eventNode.get("marketNodes", []):
                description = market.get("description", {})

                if description.get("marketType") == "MATCH_ODDS":
                    marketId = market.get("marketId")
                    marketTotal = market.get("state", {}).get(
                        "totalMatched",
                        0,
                    )
                    break

            if marketId:
                break

        if marketId:
            break

    if not marketId:
        raise Exception("MATCH_ODDS marketId not found")

    bymarketUrl = (
        f"https://ero.betfair.it/www/sports/exchange/readonly/v1/bymarket"
        f"?_ak={APP_KEY}&alt=json&currencyCode=EUR&locale=it"
        f"&marketIds={marketId}&rollupLimit=10&rollupModel=STAKE"
        f"&types=MARKET_STATE,MARKET_RATES,MARKET_DESCRIPTION,EVENT,"
        f"RUNNER_DESCRIPTION,RUNNER_STATE,"
        f"RUNNER_EXCHANGE_PRICES_BEST,RUNNER_METADATA"
    )

    bymarket = await api_get(page, bymarketUrl)

    runners = []

    for eventType in bymarket.get("eventTypes", []):
        for eventNode in eventType.get("eventNodes", []):
            for market in eventNode.get("marketNodes", []):
                marketTotal = market.get("state", {}).get(
                    "totalMatched",
                    marketTotal,
                )

                for runner in market.get("runners", []):
                    exchange = runner.get("exchange", {})
                    state = runner.get("state", {})
                    description = runner.get("description", {})

                    availableToBack = exchange.get(
                        "availableToBack",
                        [],
                    )

                    availableToLay = exchange.get(
                        "availableToLay",
                        [],
                    )

                    selectionId = runner.get("selectionId")

                    runners.append({
                        "name": description.get(
                            "runnerName",
                            f"Runner {selectionId}",
                        ),
                        "selectionId": selectionId,
                        "back": [
                            {
                                "price": str(row["price"]),
                                "vol": str(row["size"]),
                            }
                            for row in availableToBack
                        ],
                        "lay": [
                            {
                                "price": str(row["price"]),
                                "vol": str(row["size"]),
                            }
                            for row in availableToLay
                        ],
                        "ladder": [],
                        "state": state,
                        "exchange": exchange,
                        "market_graph": {
                            "runnerMatchedVolume": format_eur(
                                state.get("totalMatched", 0)
                            ),
                            "marketTotalMatched": format_eur(
                                marketTotal
                            ),
                            "lastTradedPrice": state.get(
                                "lastPriceTraded"
                            ),
                        },
                    })

    return {
        "runners": runners,
        "market_info": {
            "total_matched": format_eur(marketTotal),
            "market_id": marketId,
        },
    }
