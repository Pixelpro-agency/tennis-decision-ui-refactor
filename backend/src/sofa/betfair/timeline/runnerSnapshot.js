import { normalizeMoney } from '../numbers.js';
import { normalizeSelectionId } from '../moneyFlow.js';

function buildBookSide(levels) {
    return levels.slice(0, 3).map(item => ({
        price: parseFloat(item.price) || 0,
        size: normalizeMoney(item.vol)
    })).filter(item => item.price > 0);
}

function buildMoneyFlowSnapshot(runner) {
    if (runner.moneyFlow && typeof runner.moneyFlow === 'object') {
        return {
            back: typeof runner.moneyFlow.back === 'number' ? runner.moneyFlow.back : 0,
            lay: typeof runner.moneyFlow.lay === 'number' ? runner.moneyFlow.lay : 0,
            trend: runner.moneyFlow.trend || 'neutral',
            confidence: runner.moneyFlow.confidence || 'suppressed',
            reason: runner.moneyFlow.reason ?? null,
            ...(typeof runner.moneyFlow.marketDelta === 'number'
                ? { marketDelta: runner.moneyFlow.marketDelta }
                : {}),
            ...(typeof runner.moneyFlow.runnerDelta === 'number'
                ? { runnerDelta: runner.moneyFlow.runnerDelta }
                : {}),
            ...(typeof runner.moneyFlow.ladderTradedDelta === 'number'
                ? { ladderTradedDelta: runner.moneyFlow.ladderTradedDelta }
                : {})
        };
    }

    return {
        back: 0,
        lay: 0,
        trend: 'neutral',
        confidence: 'suppressed',
        reason: 'no_previous_state'
    };
}

function buildLadderSnapshot(ladder) {
    return ladder.map(row => ({
        price: typeof row.price === 'number' ? row.price : parseFloat(row.price) || 0,
        back: typeof row.back === 'number' ? row.back : normalizeMoney(row.back_available),
        lay: typeof row.lay === 'number' ? row.lay : normalizeMoney(row.lay_available),
        traded: typeof row.traded === 'number' ? row.traded : normalizeMoney(row.traded)
    }));
}

export function buildCanonicalRunners(processedRunners) {
    return (processedRunners || []).map(runner => {
        const back = Array.isArray(runner.back) ? runner.back : [];
        const lay = Array.isArray(runner.lay) ? runner.lay : [];
        const ladder = Array.isArray(runner.ladder) ? runner.ladder : [];

        const bestBack = back[0] || {};
        const bestLay = lay[0] || {};

        return {
            name: runner.name,
            selectionId: normalizeSelectionId(runner.selectionId),
            lastTradedPrice: parseFloat(runner.state?.lastPriceTraded) ||
                parseFloat(runner.market_graph?.lastTradedPrice) ||
                0,
            matchedTotal: typeof runner.matchedTotal === 'number' ? runner.matchedTotal : 0,
            totalMatchedOnSelection: typeof runner.totalMatchedOnSelection === 'number'
                ? runner.totalMatchedOnSelection
                : 0,
            bestBack: parseFloat(bestBack.price) || 0,
            bestBackSize: normalizeMoney(bestBack.vol),
            bestLay: parseFloat(bestLay.price) || 0,
            bestLaySize: normalizeMoney(bestLay.vol),
            bookBack: buildBookSide(back),
            bookLay: buildBookSide(lay),
            wom: typeof runner.wom === 'number' ? runner.wom : 0.5,
            moneyFlow: buildMoneyFlowSnapshot(runner),
            ladderSource: runner.ladderSource || 'none',
            ladder: buildLadderSnapshot(ladder)
        };
    });
}
