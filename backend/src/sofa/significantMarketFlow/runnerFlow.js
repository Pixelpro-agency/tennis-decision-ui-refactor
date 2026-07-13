import { DEFAULT_CONFIG } from './config.js';
import { roundN, safeNum } from './utils.js';
const INVALID_MONEY_FLOW_REASONS = new Set([
    'matched_total_decreased',
    'runner_delta_exceeds_market_delta',
    'classified_volume_exceeds_runner_delta',
    'runner_delta_raw_computed_mismatch',
    'market_delta_raw_computed_mismatch'
]);

export function extractRunnerFlowAmount(runner, tickData) {
    const mf = runner?.moneyFlow && typeof runner.moneyFlow === 'object' ? runner.moneyFlow : null;

    const back = mf && typeof mf.back === 'number' ? mf.back : 0;
    const lay = mf && typeof mf.lay === 'number' ? mf.lay : 0;
    const classifiedVolume = roundN(back + lay, 2) ?? 0;

    const unclassifiedRaw = mf && typeof mf.unclassified === 'number' ? mf.unclassified : 0;
    const suppressedVolume = mf && typeof mf.suppressedVolume === 'number' ? mf.suppressedVolume : 0;

    const mfRunnerDelta = safeNum(mf?.runnerDelta);
    const mfMarketDelta = safeNum(mf?.marketDelta);
    const mfReason = mf?.reason ?? null;

                                                                                    
    const runnerMatchedDelta = mfRunnerDelta;

                                                                                         
    const deltaExcess = runnerMatchedDelta !== null
        ? Math.max(0, runnerMatchedDelta - classifiedVolume)
        : 0;
    const unclassifiedVolume = Math.max(unclassifiedRaw, deltaExcess);

    const marketTotalMatched = safeNum(tickData?.market?.totalMatched);
    const marketMatchedDelta = mfMarketDelta;

                                                                                   
    const candidates = [
        classifiedVolume,
        unclassifiedVolume,
        suppressedVolume,
        runnerMatchedDelta !== null ? runnerMatchedDelta : 0
    ].filter(v => typeof v === 'number' && isFinite(v) && v >= 0);

    const observedFlowAmount = candidates.length > 0 ? Math.max(...candidates) : 0;

    return {
        observedFlowAmount: roundN(observedFlowAmount, 2) ?? 0,
        classifiedVolume,
        unclassifiedVolume: roundN(unclassifiedVolume, 2) ?? 0,
        suppressedVolume,
        runnerMatchedDelta,
        marketMatchedDelta,
        marketTotalMatched,
        back,
        lay,
        mfReason,
        mfRunnerDelta,
        mfMarketDelta
    };
}

export function computeMarketLiquiditySharePct(observedFlowAmount, marketTotalMatched, runnerMatchedTotal) {
    const mkPct = (typeof observedFlowAmount === 'number' && isFinite(observedFlowAmount) &&
        typeof marketTotalMatched === 'number' && marketTotalMatched > 0)
        ? roundN((observedFlowAmount / marketTotalMatched) * 100, 2)
        : null;

    const rnrPct = (typeof observedFlowAmount === 'number' && isFinite(observedFlowAmount) &&
        typeof runnerMatchedTotal === 'number' && runnerMatchedTotal > 0)
        ? roundN((observedFlowAmount / runnerMatchedTotal) * 100, 2)
        : null;

    return { marketLiquiditySharePct: mkPct, runnerLiquiditySharePct: rnrPct };
}

export function validateVolume(extractedFlow, tolerance) {
    const { mfReason, mfRunnerDelta, mfMarketDelta, runnerMatchedDelta } = extractedFlow;
    const tol = typeof tolerance === 'number' ? tolerance : DEFAULT_CONFIG.tolerance;

    const validationReasons = [];
    let volumeInvalidated = false;

    if (mfReason != null && INVALID_MONEY_FLOW_REASONS.has(mfReason)) {
        volumeInvalidated = true;
        validationReasons.push(`moneyFlow.reason invalidated: ${mfReason}`);
    }
    if (mfRunnerDelta !== null && mfRunnerDelta < 0) {
        volumeInvalidated = true;
        validationReasons.push('mf.runnerDelta < 0');
    }
    if (mfMarketDelta !== null && mfMarketDelta < 0) {
        volumeInvalidated = true;
        validationReasons.push('mf.marketDelta < 0');
    }
    if (runnerMatchedDelta !== null && runnerMatchedDelta < 0) {
        volumeInvalidated = true;
        validationReasons.push('runnerMatchedDelta < 0');
    }
                                                                                         
    if (
        runnerMatchedDelta !== null && mfMarketDelta !== null &&
        runnerMatchedDelta > mfMarketDelta + tol
    ) {
        volumeInvalidated = true;
        if (!validationReasons.some(r => r.includes('runner_delta_exceeds_market_delta'))) {
            validationReasons.push(`runnerMatchedDelta (${runnerMatchedDelta}) > marketDelta (${mfMarketDelta}) + tolerance (${tol})`);
        }
    }

    return { valid: !volumeInvalidated, validationReasons };
}

export function classifyDirection(back, lay, classifiedVolume, unclassifiedVolume) {
    let direction = 'none';
    let directionAttributed = false;

    if (classifiedVolume > 0) {
        if (back > 0 && lay > 0) {
            direction = 'mixed';
                                                      
            directionAttributed = false;
        } else if (back > lay && back > 0) {
            direction = 'back';
            directionAttributed = true;
        } else if (lay > back && lay > 0) {
            direction = 'lay';
            directionAttributed = true;
        }
    }

    const flowAmbiguous = !directionAttributed ||
        unclassifiedVolume > classifiedVolume ||
        direction === 'mixed';

    return { direction, directionAttributed, flowAmbiguous };
}

export function extractBestPrice(runner) {
    const ltp = safeNum(runner?.lastTradedPrice);
    if (ltp !== null && ltp > 0) return ltp;
    const bb = safeNum(runner?.bestBack);
    const bl = safeNum(runner?.bestLay);
    if (bb !== null && bl !== null && bb > 0 && bl > 0) return (bb + bl) / 2;
    if (bb !== null && bb > 0) return bb;
    if (bl !== null && bl > 0) return bl;
    return null;
}

export function classifyRunnerPriceRole(selectionId, allRunners) {
    if (!Array.isArray(allRunners) || allRunners.length < 2) return 'unknown';

    const prices = allRunners.map(r => ({
        selId: r?.selectionId ?? null,
        name: r?.name ?? null,
        price: extractBestPrice(r)
    })).filter(x => x.price !== null);

    if (prices.length < 2) return 'unknown';

    const minPrice = Math.min(...prices.map(p => p.price));
    const maxPrice = Math.max(...prices.map(p => p.price));

    const target = prices.find(p => p.selId === selectionId);
    if (!target) return 'unknown';

    if (target.price === minPrice) return 'shorter_priced_runner';
    if (target.price === maxPrice) return 'longer_priced_runner';
    return 'unknown';
}

export function computeBookTradable(runner) {
    const bb = safeNum(runner?.bestBack);
    const bl = safeNum(runner?.bestLay);
    return bb !== null && bl !== null && bb > 0 && bl > 0 && bl > bb;
}

export function extractGraphHealth(runner, tickData) {
    if (runner?.graphHealth?.status) return runner.graphHealth.status;
    if (tickData?.graphHealth?.status) return tickData.graphHealth.status;
    return 'unknown';
}

export function extractLadderSource(runner, tickData) {
    if (runner?.ladderSource != null) return runner.ladderSource;
    if (tickData?.graphHealth?.ladderSource != null) return tickData.graphHealth.ladderSource;
    return null;
}