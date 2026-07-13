export const PRICE_MOVE_THRESHOLD = 0.01;

const INVALID_MONEY_FLOW_REASONS = new Set([
    'matched_total_decreased',
    'runner_delta_exceeds_market_delta',
    'classified_volume_exceeds_runner_delta',
    'runner_delta_raw_computed_mismatch',
    'market_delta_raw_computed_mismatch'
]);

export function isInvalidMoneyFlowReason(reason) {
    return reason != null && INVALID_MONEY_FLOW_REASONS.has(reason);
}

export const BETFAIR_LOOKBACK_MAX = 20;

export function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export function ageSec(ts, now) {
    const d = parseTs(ts);
    if (!d) return null;
    return Math.max(0, (now.getTime() - d.getTime()) / 1000);
}

export function roundN(v, n) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
}

export function extractRunnerPrice(runner) {
    if (!runner) return { price: null, source: 'unavailable' };
    const ltp = typeof runner.lastTradedPrice === 'number' && runner.lastTradedPrice > 0
        ? runner.lastTradedPrice : null;
    if (ltp !== null) return { price: ltp, source: 'ltp' };

    const bb = typeof runner.bestBack === 'number' && runner.bestBack > 0 ? runner.bestBack : null;
    const bl = typeof runner.bestLay === 'number' && runner.bestLay > 0 ? runner.bestLay : null;
    if (bb !== null && bl !== null) return { price: roundN((bb + bl) / 2, 3), source: 'mid' };
    if (bb !== null) return { price: bb, source: 'book_back' };
    if (bl !== null) return { price: bl, source: 'book_lay' };
    return { price: null, source: 'unavailable' };
}

export function isBookTradable(runner) {
    if (!runner) return false;
    const bb = typeof runner.bestBack === 'number' ? runner.bestBack : null;
    const bl = typeof runner.bestLay === 'number' ? runner.bestLay : null;
    return bb !== null && bl !== null && bb > 0 && bl > 0 && bl > bb;
}
