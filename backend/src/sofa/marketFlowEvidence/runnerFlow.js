import { computePriceMove, findRunner, getMarketTotal, isReliableEntry, isReliableLadderSource, roundN } from './runnerFlow/primitives.js';

export function buildRunnerFlowEvidence(currentRunner, currentEntry, lookbackEntries, betfairRecent, graphHealthStatus) {
    const unavailable = {
        available: false,
        reliable: false,
        runnerMatchedDelta: null,
        marketMatchedDelta: null,
        tradedVolumeDelta: null,
        moneyFlowBack: null,
        moneyFlowLay: null,
        rawTrend: 'unknown',
        priceMove: {
            available: false,
            fromPrice: null,
            toPrice: null,
            direction: 'unknown',
            delta: null,
            pct: null
        },
        confirmedByPrice: false,
        interpretation: 'unavailable',
        directionConfidence: 'low',
        ambiguityReasons: []
    };

    if (!currentRunner || !betfairRecent) return unavailable;

    const selectionId = currentRunner.selectionId ?? null;
    const runnerName = currentRunner.name || null;

    const currentReliable =
        graphHealthStatus === 'ok' &&
        isReliableLadderSource(currentRunner.ladderSource);

    if (!currentReliable) {
        const reasons = [];
        if (graphHealthStatus !== 'ok') reasons.push(`Graph health is ${graphHealthStatus}; flow not reliable`);
        else reasons.push('Ladder source is not reliable for flow evidence');
        return { ...unavailable, interpretation: graphHealthStatus !== 'ok' ? 'graph_not_ok' : 'ladder_not_reliable', ambiguityReasons: reasons };
    }

    let previousEntry = null;
    for (let i = lookbackEntries.length - 1; i >= 0; i--) {
        if (isReliableEntry(lookbackEntries[i], selectionId, runnerName)) {
            previousEntry = lookbackEntries[i];
            break;
        }
    }

    const rawMf = currentRunner.moneyFlow && typeof currentRunner.moneyFlow === 'object'
        ? currentRunner.moneyFlow
        : null;

    const moneyFlowBack = rawMf && typeof rawMf.back === 'number' ? rawMf.back : null;
    const moneyFlowLay = rawMf && typeof rawMf.lay === 'number' ? rawMf.lay : null;
    const rawTrend = rawMf?.trend || 'unknown';

    let runnerMatchedDelta = rawMf && typeof rawMf.runnerDelta === 'number' ? rawMf.runnerDelta : null;
    let marketMatchedDelta = rawMf && typeof rawMf.marketDelta === 'number' ? rawMf.marketDelta : null;

    if (runnerMatchedDelta === null && previousEntry) {
        const prevRunner = findRunner(previousEntry, selectionId, runnerName);
        const prevMatchedTotal = typeof prevRunner?.matchedTotal === 'number' ? prevRunner.matchedTotal : null;
        const currMatchedTotal = typeof currentRunner.matchedTotal === 'number' ? currentRunner.matchedTotal : null;
        if (prevMatchedTotal !== null && currMatchedTotal !== null) {
            runnerMatchedDelta = roundN(currMatchedTotal - prevMatchedTotal, 2);
        }
    }
    if (marketMatchedDelta === null && previousEntry) {
        const prevMarketTotal = getMarketTotal(previousEntry);
        const currMarketTotal = getMarketTotal(currentEntry);
        if (prevMarketTotal !== null && currMarketTotal !== null) {
            marketMatchedDelta = roundN(currMarketTotal - prevMarketTotal, 2);
        }
    }

    let tradedVolumeDelta = rawMf && typeof rawMf.ladderTradedDelta === 'number' ? rawMf.ladderTradedDelta : null;

    const ambiguityReasons = [];

    if (runnerMatchedDelta !== null && runnerMatchedDelta < 0) {
        ambiguityReasons.push('Negative matched delta; unreliable previous/current pair');
        runnerMatchedDelta = null;
    }
    if (marketMatchedDelta !== null && marketMatchedDelta < 0) {
        marketMatchedDelta = null;
    }


    const backAmt = moneyFlowBack ?? 0;
    const layAmt = moneyFlowLay ?? 0;
    const classifiedVolume = roundN(backAmt + layAmt, 2) ?? 0;
    const effectiveDelta = runnerMatchedDelta ?? 0;
    const rawUnclassified = Math.max(0, effectiveDelta - classifiedVolume);
    const unclassifiedVolume = roundN(rawUnclassified, 2);
    const mfConfidence = rawMf?.confidence || null;
    const mfReason = rawMf?.reason || null;
    const isSuppressed = mfConfidence === 'suppressed';
    const suppressedVolume = (isSuppressed || (rawTrend === 'neutral' && effectiveDelta > 0))
        ? roundN(Math.max(unclassifiedVolume, effectiveDelta > classifiedVolume ? effectiveDelta - classifiedVolume : 0), 2)
        : roundN(unclassifiedVolume, 2);
    const volumeDetected = effectiveDelta > 0 || classifiedVolume > 0;
    const directionAttributed = classifiedVolume > 0 && rawTrend !== 'neutral' && rawTrend !== 'unknown';
    const suppressedReason = mfReason;

    const hasVolume = moneyFlowBack !== null || moneyFlowLay !== null || runnerMatchedDelta !== null;
    if (!hasVolume) {
        return {
            ...unavailable,
            available: true, reliable: true, rawTrend: 'unknown',
            classifiedVolume: 0, unclassifiedVolume: 0, suppressedVolume: 0,
            volumeDetected: false, directionAttributed: false, directionReliable: false,
            suppressedReason: null,
            interpretation: 'no_recent_flow', ambiguityReasons
        };
    }

    if (backAmt === 0 && layAmt === 0 && (runnerMatchedDelta === null || runnerMatchedDelta === 0)) {
        return {
            ...unavailable,
            available: true, reliable: true,
            runnerMatchedDelta: runnerMatchedDelta ?? 0,
            marketMatchedDelta,
            tradedVolumeDelta,
            moneyFlowBack: 0,
            moneyFlowLay: 0,
            rawTrend: 'neutral',
            classifiedVolume: 0, unclassifiedVolume: 0, suppressedVolume: 0,
            volumeDetected: false, directionAttributed: false, directionReliable: false,
            suppressedReason,
            interpretation: 'no_recent_flow',
            directionConfidence: 'low',
            ambiguityReasons
        };
    }

    if (backAmt === 0 && layAmt === 0 && effectiveDelta > 0) {
        const interp = isSuppressed ? 'suppressed_matched_volume' : 'unclassified_matched_volume';
        ambiguityReasons.push(`Matched volume detected (${effectiveDelta.toFixed(0)}) but back/lay not attributed; reason: ${suppressedReason || 'unknown'}`);
        return {
            available: true, reliable: true,
            runnerMatchedDelta,
            marketMatchedDelta,
            tradedVolumeDelta,
            moneyFlowBack: 0,
            moneyFlowLay: 0,
            rawTrend: 'neutral',
            priceMove: { available: false, fromPrice: null, toPrice: null, direction: 'unknown', delta: null, pct: null },
            confirmedByPrice: false,
            interpretation: interp,
            directionConfidence: 'low',
            classifiedVolume: 0,
            unclassifiedVolume,
            suppressedVolume,
            volumeDetected: true,
            directionAttributed: false,
            directionReliable: false,
            suppressedReason,
            ambiguityReasons
        };
    }

    let priceMove = { available: false, fromPrice: null, toPrice: null, direction: 'unknown', delta: null, pct: null };
    if (previousEntry) {
        const prevRunner = findRunner(previousEntry, selectionId, runnerName);
        priceMove = computePriceMove(currentRunner, prevRunner);
    } else {
        ambiguityReasons.push('No previous reliable Betfair tick for price comparison');
    }

    let confirmedByPrice = false;
    let interpretation = 'ambiguous_exchange_flow';

    const effectiveTrend = rawTrend !== 'unknown' ? rawTrend
        : (backAmt > layAmt ? 'backing' : (layAmt > backAmt ? 'laying' : 'neutral'));

    if (priceMove.direction === 'unknown') {
        interpretation = 'ambiguous_exchange_flow';
        ambiguityReasons.push('Exchange flow is ambiguous; matched volume does not reveal trader intent');
    } else if (priceMove.direction === 'stable') {
        interpretation = 'volume_without_price_move';
    } else if (effectiveTrend === 'backing') {
        if (priceMove.direction === 'shortening') {
            confirmedByPrice = true;
            interpretation = 'volume_with_price_shortening';
        } else if (priceMove.direction === 'drifting') {
            confirmedByPrice = false;
            interpretation = 'volume_direction_conflict';
            ambiguityReasons.push('Price move does not confirm raw moneyFlow direction');
        }
    } else if (effectiveTrend === 'laying') {
        if (priceMove.direction === 'drifting') {
            confirmedByPrice = true;
            interpretation = 'volume_with_price_drifting';
        } else if (priceMove.direction === 'shortening') {
            confirmedByPrice = false;
            interpretation = 'volume_direction_conflict';
            ambiguityReasons.push('Price move does not confirm raw moneyFlow direction');
        }
    } else if (effectiveTrend === 'neutral') {
        interpretation = 'unclassified_matched_volume';
    }

    let directionConfidence = 'low';
    if (confirmedByPrice && priceMove.available) {
        directionConfidence = 'medium';
    }

    const bb = typeof currentRunner.bestBack === 'number' ? currentRunner.bestBack : null;
    const bl = typeof currentRunner.bestLay === 'number' ? currentRunner.bestLay : null;
    const bookTradable = bb !== null && bl !== null && bl > bb;
    if (!bookTradable && (interpretation === 'volume_with_price_shortening' || interpretation === 'volume_with_price_drifting')) {
        ambiguityReasons.push('Large volume detected but book spread is poor or not tradable');
        directionConfidence = 'low';
        interpretation = 'book_not_tradable';
        confirmedByPrice = false;
    }

    if (unclassifiedVolume > 0 && unclassifiedVolume >= classifiedVolume * 0.5) {
        ambiguityReasons.push(`Partial volume unclassified: ${unclassifiedVolume.toFixed(0)} not attributed to back/lay`);
    }

    return {
        available: true,
        reliable: true,
        runnerMatchedDelta,
        marketMatchedDelta,
        tradedVolumeDelta,
        moneyFlowBack,
        moneyFlowLay,
        rawTrend: effectiveTrend,
        priceMove,
        confirmedByPrice,
        interpretation,
        directionConfidence,
        classifiedVolume,
        unclassifiedVolume,
        suppressedVolume,
        volumeDetected,
        directionAttributed,
        directionReliable: confirmedByPrice,
        suppressedReason,
        ambiguityReasons
    };
}
