import { PRICE_MOVE_THRESHOLD, BETFAIR_LOOKBACK_MAX, ageSec } from './betfairMove/primitives.js';
import { buildInvalidBetfairMoveResult, buildValidBetfairMoveResult } from './betfairMove/resultBuilders.js';
import { selectBestBetfairMoveCandidate } from './betfairMove/candidateSelection.js';

export function computeLatestBetfairMove(betfairTicks, now) {
    const empty = {
        available: false,
        timestamp: null,
        ageSec: null,
        seq: null,
        runner: null,
        selectionId: null,
        fromPrice: null,
        toPrice: null,
        priceSource: null,
        direction: 'unknown',
        priceDelta: null,
        priceDeltaPct: null,
        marketMatchedDelta: null,
        runnerMatchedDelta: null,
        classifiedVolume: 0,
        unclassifiedVolume: 0,
        suppressedVolume: 0,
        volumeDetected: false,
        directionAttributed: 'none',
        directionReliable: false,
        flowAmbiguous: true,
        validVolume: false,
        invalidVolume: false,
        anomaly: false,
        invalidReason: null,
        validationReasons: [],
        rawRunnerMatchedDelta: null,
        rawMarketMatchedDelta: null,
        graphHealth: null,
        ladderSource: null,
        bookTradable: false,
        confidence: 'low',
        reasons: ['Betfair timeline missing or empty']
    };

    if (!Array.isArray(betfairTicks) || betfairTicks.length < 2) {
        return empty;
    }

    const ticks = betfairTicks.slice(-BETFAIR_LOOKBACK_MAX);

    for (let i = ticks.length - 1; i >= 1; i--) {
        const cur = ticks[i];
        const prev = ticks[i - 1];        const selection = selectBestBetfairMoveCandidate(cur, prev);
        if (!selection) continue;

        const { marketMatchedDelta, bestCandidate } = selection;

        if (!bestCandidate) continue;

        const {
            curRunner, prevRunner, toPrice, fromPrice, priceDelta, priceSource,
            runnerMatchedDelta, mf,
            volumeInvalidated, volumeValidationReasons, mfReason, mfRunnerDelta, mfMarketDelta
        } = bestCandidate;

        const ts = cur.timestamp || cur.data?.timestamp || null;
        const age = ageSec(ts, now);

        const priceDeltaAbs = Math.abs(priceDelta ?? 0);
        const priceDirection = priceDelta === null ? 'unknown'
            : priceDeltaAbs <= PRICE_MOVE_THRESHOLD ? 'stable'
            : priceDelta < 0 ? 'shortening'
            : 'drifting';
        const resultContext = {
            cur,
            curRunner,
            toPrice,
            fromPrice,
            priceSource,
            priceDelta,
            priceDirection,
            timestamp: ts,
            age,
            runnerMatchedDelta,
            marketMatchedDelta,
            mf,
            mfReason,
            volumeValidationReasons
        };

        if (volumeInvalidated) {
            return buildInvalidBetfairMoveResult(resultContext);
        }

        return buildValidBetfairMoveResult(resultContext);
    }
    return {
        ...empty,
        reasons: ['No significant price move or volume detected in Betfair lookback']
    };
}
