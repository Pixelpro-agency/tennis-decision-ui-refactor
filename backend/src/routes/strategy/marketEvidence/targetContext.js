import {
    namesMatch,
    findMatchingRunner,
    toNum,
    hasUsablePrice,
    hasUsableLadder,
    hasUsableMoneyFlow,
    findLatestUsableRunnerTick
} from '../helpers.js';

export function buildTargetContext({
    snapshot,
    firstTickEntry,
    lastTickEntry,
    window,
    validTicks
}) {
    const firstTick = firstTickEntry.data;
    const lastTick = lastTickEntry.data;
    const warnings = [];

    const homeName = snapshot.players.home.name;
    const awayName = snapshot.players.away.name;

    let targetRole = null;
    let targetSofaName = null;

    if (snapshot.score.sets && snapshot.score.sets.length > 0) {
        const set1 = snapshot.score.sets[0];

        if (set1.home > set1.away && set1.home >= 6) {
            targetRole = 'FIRST_SET_WINNER';
            targetSofaName = homeName;
        }
        else if (set1.away > set1.home && set1.away >= 6) {
            targetRole = 'FIRST_SET_WINNER';
            targetSofaName = awayName;
        }
    }

    if (!targetRole && Array.isArray(lastTick.runners) && lastTick.runners.length >= 2) {
        const sorted = [...lastTick.runners]
            .map((runner) => ({
                ...runner,
                price: toNum(
                    runner.lastTradedPrice,
                    toNum(runner.bestLay, toNum(runner.bestBack, Infinity))
                )
            }))
            .sort((left, right) => left.price - right.price);

        const favourite = sorted[0];

        if (favourite) {
            targetRole = 'MARKET_FAVOURITE_FALLBACK';

            if (namesMatch(homeName, favourite.name)) {
                targetSofaName = homeName;
            }
            else if (namesMatch(awayName, favourite.name)) {
                targetSofaName = awayName;
            }
            else {
                targetSofaName = favourite.name;
            }
        }
    }

    const targetRunnerLast = findMatchingRunner(targetSofaName, lastTick.runners);

    if (!targetRunnerLast) {
        warnings.push(`Could not match SofaScore name "${targetSofaName}" to Betfair runners`);

        return {
            available: false,
            reason: 'RUNNER_MATCH_NOT_FOUND',
            latestTickSeq: lastTick.seq ?? null,
            warnings
        };
    }

    const latestPrice = findLatestUsableRunnerTick(window, targetSofaName, hasUsablePrice);
    const latestLadder = findLatestUsableRunnerTick(window, targetSofaName, hasUsableLadder);
    const latestMoneyFlow = findLatestUsableRunnerTick(window, targetSofaName, hasUsableMoneyFlow);

    const usingStalePrice = !latestPrice || latestPrice.tick !== lastTickEntry;
    const usingStaleLadder = !latestLadder || latestLadder.tick !== lastTickEntry;
    const usingStaleMoneyFlow = !latestMoneyFlow || latestMoneyFlow.tick !== lastTickEntry;

    const priceRunner = latestPrice?.runner || targetRunnerLast;
    const ladderRunner = latestLadder?.runner || targetRunnerLast;
    const moneyFlowRunner = latestMoneyFlow?.runner || targetRunnerLast;
    const firstTargetRunner = findMatchingRunner(targetSofaName, firstTick.runners);

    const hasLadder = hasUsableLadder(ladderRunner);
    const hasMoneyFlow = hasUsableMoneyFlow(moneyFlowRunner);
    const hasPrices = hasUsablePrice(priceRunner);

    if (!hasPrices) {
        warnings.push('Missing price data for target runner');
    }

    if (usingStalePrice) {
        warnings.push('Latest Betfair tick is empty/finished; using last usable price tick.');
    }

    if (usingStaleLadder) {
        warnings.push('Latest ladder unavailable; using last usable ladder tick.');
    }

    if (usingStaleMoneyFlow) {
        warnings.push('Latest money flow unavailable; using last usable moneyflow tick.');
    }

    if (validTicks.length < 5) {
        warnings.push(`Only ${validTicks.length} valid Betfair ticks available; market evidence is low confidence.`);
    }

    return {
        available: true,
        warnings,
        targetRole,
        targetSofaName,
        latestPrice,
        latestLadder,
        latestMoneyFlow,
        usingStalePrice,
        usingStaleLadder,
        usingStaleMoneyFlow,
        priceRunner,
        ladderRunner,
        moneyFlowRunner,
        firstTargetRunner,
        hasLadder,
        hasMoneyFlow,
        hasPrices
    };
}
