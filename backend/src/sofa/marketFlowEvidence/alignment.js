function parseTs(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

export function buildLastSofaMarkerAlignment(eventMarkers, sofaTick) {
    const empty = { available: false, type: null, timestamp: null, ageSec: null, seq: null, playerUnderPressure: null, confidence: 'low' };

    if (!Array.isArray(eventMarkers) || eventMarkers.length === 0) return empty;

    const priority = ['BREAK_POINT', 'DEUCE', 'THIRTY_ALL', 'GAME_POINT', 'PRESSURE_POINT'];
    let chosen = null;
    for (const p of priority) {
        chosen = eventMarkers.find(m => m.type === p);
        if (chosen) break;
    }
    if (!chosen) chosen = eventMarkers[0];

    const ts = chosen.timestamp || sofaTick?.timestamp || null;
    return {
        available: true,
        type: chosen.type,
        timestamp: ts,
        ageSec: null,
        seq: chosen.seq ?? null,
        playerUnderPressure: chosen.playerUnderPressure || null,
        confidence: chosen.confidence || 'low'
    };
}

export function buildLastBetfairMoveAlignment(dominantRunner, betfairTick) {
    const empty = { available: false, timestamp: null, ageSec: null, runner: null, selectionId: null, direction: 'unknown', fromPrice: null, toPrice: null, delta: null, confirmedByPrice: false, confidence: 'low' };

    if (!dominantRunner || !dominantRunner.flowEvidence?.priceMove?.available) return empty;

    const fe = dominantRunner.flowEvidence;
    const pm = fe.priceMove;
    const ts = betfairTick?.timestamp || betfairTick?.data?.timestamp || null;

    return {
        available: true,
        timestamp: ts,
        ageSec: null,
        runner: dominantRunner.name || null,
        selectionId: dominantRunner.selectionId ?? null,
        direction: pm.direction || 'unknown',
        fromPrice: pm.fromPrice,
        toPrice: pm.toPrice,
        delta: pm.delta,
        confirmedByPrice: fe.confirmedByPrice,
        confidence: fe.directionConfidence || 'low'
    };
}

export function computeMarketReactionOrder(sofaTs, betfairTs) {
    const SAME_WINDOW_SEC = 10;
    const empty = { eventMarketGapSec: null, marketReactionOrder: 'unknown' };

    const st = parseTs(sofaTs);
    const bt = parseTs(betfairTs);
    if (!st || !bt) return empty;

    const gapSec = Math.round((bt.getTime() - st.getTime()) / 1000);
    let order;
    if (Math.abs(gapSec) <= SAME_WINDOW_SEC) {
        order = 'same_window';
    } else if (gapSec > 0) {
        order = 'market_after_sofa';
    } else {
        order = 'market_before_sofa';
    }

    return { eventMarketGapSec: gapSec, marketReactionOrder: order };
}
