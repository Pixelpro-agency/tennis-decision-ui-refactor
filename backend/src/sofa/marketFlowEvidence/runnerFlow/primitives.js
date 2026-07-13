const RELIABLE_GH_STATUSES = new Set(['ok']);

const RELIABLE_LADDER_SOURCES = new Set(['graph', 'mixed', 'graph_url']);

const STABLE_PRICE_DELTA = 0.01;

export function roundN(v, n) {
    if (typeof v !== 'number' || !isFinite(v)) return null;
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
}

export function isReliableLadderSource(source) {
    return RELIABLE_LADDER_SOURCES.has(source);
}

export function getMarketTotal(entry) {
    const v = entry?.data?.market?.totalMatched;
    return typeof v === 'number' && isFinite(v) ? v : null;
}

export function findRunner(entry, selectionId, name) {
    const runners = entry?.data?.runners;
    if (!Array.isArray(runners)) return null;
    if (selectionId != null) {
        const byId = runners.find(r => r && r.selectionId === selectionId);
        if (byId) return byId;
    }
    if (name) {
        return runners.find(r => r && r.name === name) || null;
    }
    return null;
}

export function extractPrice(runner) {
    if (!runner) return { price: null, source: 'unavailable' };

    const ltp = typeof runner.lastTradedPrice === 'number' && runner.lastTradedPrice > 0
        ? runner.lastTradedPrice
        : null;
    if (ltp !== null) return { price: ltp, source: 'ltp' };

    const bb = typeof runner.bestBack === 'number' && runner.bestBack > 0 ? runner.bestBack : null;
    const bl = typeof runner.bestLay === 'number' && runner.bestLay > 0 ? runner.bestLay : null;
    if (bb !== null && bl !== null) {
        const mid = roundN((bb + bl) / 2, 3);
        return { price: mid, source: 'mid' };
    }
    if (bb !== null) return { price: bb, source: 'book_back' };
    if (bl !== null) return { price: bl, source: 'book_lay' };
    return { price: null, source: 'unavailable' };
}

export function isReliableEntry(entry, selectionId, name) {
    const ghStatus = entry?.data?.graphHealth?.status;
    if (!RELIABLE_GH_STATUSES.has(ghStatus)) return false;
    const runner = findRunner(entry, selectionId, name);
    if (!runner) return false;
    return isReliableLadderSource(runner.ladderSource);
}


export function computePriceMove(currentRunner, previousRunner) {
    const unavailable = {
        available: false,
        fromPrice: null,
        toPrice: null,
        direction: 'unknown',
        delta: null,
        pct: null,
        source: 'unavailable'
    };

    if (!currentRunner || !previousRunner) return unavailable;

    const { price: toPrice, source: toSrc } = extractPrice(currentRunner);
    const { price: fromPrice, source: fromSrc } = extractPrice(previousRunner);

    if (toPrice === null || fromPrice === null) return unavailable;

    const delta = roundN(toPrice - fromPrice, 4);
    const pct = fromPrice !== 0 ? roundN(((toPrice - fromPrice) / fromPrice) * 100, 2) : null;

    let direction;
    if (Math.abs(delta) <= STABLE_PRICE_DELTA) {
        direction = 'stable';
    } else if (delta < 0) {
        direction = 'shortening';
    } else {
        direction = 'drifting';  
    }

    const source = toSrc === fromSrc ? toSrc : `${fromSrc}→${toSrc}`;

    return { available: true, fromPrice, toPrice, direction, delta, pct, source };
}

