import {
    PRICE_MOVE_THRESHOLD,
    isInvalidMoneyFlowReason,
    roundN,
    extractRunnerPrice
} from './primitives.js';

export function selectBestBetfairMoveCandidate(cur, prev) {
    if (!cur || !prev) return null;

    const curData = cur.data || {};
    const prevData = prev.data || {};
    const curRunners = Array.isArray(curData.runners) ? curData.runners : [];
    const prevRunners = Array.isArray(prevData.runners) ? prevData.runners : [];

    const marketMatchedDelta = (() => {
        const curMt = curData.market?.totalMatched;
        const prevMt = prevData.market?.totalMatched;
        if (typeof curMt === 'number' && typeof prevMt === 'number') {
            const d = curMt - prevMt;
            return d >= 0 ? roundN(d, 2) : null;
        }
        return null;
    })();

    let bestCandidate = null;
    let bestScore = -Infinity;

    for (const curRunner of curRunners) {
        if (!curRunner) continue;

        const selId = curRunner.selectionId ?? null;
        const prevRunner = selId != null
            ? prevRunners.find(r => r && r.selectionId === selId)
            : prevRunners.find(r => r && r.name === curRunner.name);
        if (!prevRunner) continue;

        const { price: toPrice, source: priceSource } = extractRunnerPrice(curRunner);
        const { price: fromPrice } = extractRunnerPrice(prevRunner);

        let priceDelta = null;
        let priceSignificant = false;
        if (toPrice !== null && fromPrice !== null) {
            priceDelta = roundN(toPrice - fromPrice, 4);
            priceSignificant = Math.abs(priceDelta) > PRICE_MOVE_THRESHOLD;
        }

        const mf = curRunner.moneyFlow && typeof curRunner.moneyFlow === 'object'
            ? curRunner.moneyFlow : null;

        let runnerMatchedDelta = mf && typeof mf.runnerDelta === 'number' ? mf.runnerDelta : null;
        if (runnerMatchedDelta === null) {
            const curMt = typeof curRunner.matchedTotal === 'number' ? curRunner.matchedTotal : null;
            const prevMt = typeof prevRunner.matchedTotal === 'number' ? prevRunner.matchedTotal : null;
            if (curMt !== null && prevMt !== null && curMt >= prevMt) {
                runnerMatchedDelta = roundN(curMt - prevMt, 2);
            }
        }

        const mfReason = mf?.reason ?? null;
        const mfRunnerDelta = mf && typeof mf.runnerDelta === 'number' ? mf.runnerDelta : null;
        const mfMarketDelta = mf && typeof mf.marketDelta === 'number' ? mf.marketDelta : null;
        const tolerance = Math.max(1, Math.abs(mfMarketDelta ?? marketMatchedDelta ?? 0) * 0.05);

        const volumeValidationReasons = [];
        let volumeInvalidated = false;

        if (isInvalidMoneyFlowReason(mfReason)) {
            volumeInvalidated = true;
            volumeValidationReasons.push(`moneyFlow.reason invalidated: ${mfReason}`);
        }
        if (mfRunnerDelta !== null && mfRunnerDelta < 0) {
            volumeInvalidated = true;
            volumeValidationReasons.push('mf.runnerDelta < 0');
        }
        if (mfMarketDelta !== null && mfMarketDelta < 0) {
            volumeInvalidated = true;
            volumeValidationReasons.push('mf.marketDelta < 0');
        }
        if (runnerMatchedDelta !== null && runnerMatchedDelta < 0) {
            volumeInvalidated = true;
            volumeValidationReasons.push('runnerMatchedDelta < 0');
        }
        if (marketMatchedDelta !== null && marketMatchedDelta < 0) {
            volumeInvalidated = true;
            volumeValidationReasons.push('marketMatchedDelta < 0');
        }
        if (
            runnerMatchedDelta !== null &&
            marketMatchedDelta !== null &&
            runnerMatchedDelta > marketMatchedDelta + tolerance
        ) {
            volumeInvalidated = true;
            volumeValidationReasons.push(`runnerMatchedDelta (${runnerMatchedDelta}) > marketMatchedDelta (${marketMatchedDelta}) + tolerance (${roundN(tolerance, 2)})`);
        }

        const validVolume = !volumeInvalidated;
        const volumeScore = validVolume ? (runnerMatchedDelta ?? 0) : 0;
        const priceScore = Math.abs(priceDelta ?? 0) * 100;
        const score = priceScore + volumeScore;

        const volumeSignificant = (runnerMatchedDelta !== null && runnerMatchedDelta > 0) ||
            (marketMatchedDelta !== null && marketMatchedDelta > 0);

        if (!priceSignificant && !volumeSignificant) continue;
        if (!priceSignificant && volumeInvalidated) continue;

        if (score > bestScore) {
            bestScore = score;
            bestCandidate = {
                curRunner,
                prevRunner,
                toPrice,
                fromPrice,
                priceDelta,
                priceSource,
                runnerMatchedDelta,
                mf,
                volumeInvalidated,
                volumeValidationReasons,
                mfReason,
                mfRunnerDelta,
                mfMarketDelta
            };
        }
    }

    return bestCandidate ? { marketMatchedDelta, bestCandidate } : null;
}
