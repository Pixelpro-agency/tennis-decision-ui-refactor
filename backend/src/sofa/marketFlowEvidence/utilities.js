const MAX_LOOKBACK_TICKS = 10;

export function computeSpreadQuality(bestBack, bestLay) {
    const bb = typeof bestBack === 'number' && bestBack > 0 ? bestBack : null;
    const bl = typeof bestLay === 'number' && bestLay > 0 ? bestLay : null;

    if (bb === null || bl === null || bl <= bb) return 'unknown';

    const spread = bl - bb;
    const mid = (bb + bl) / 2;

    if (mid === 0) return 'unknown';
    const relSpread = spread / mid;

    if (relSpread <= 0.015) return 'good';
    if (relSpread <= 0.05) return 'medium';
    return 'poor';
}

export function extractLookbackEntries(betfairTimeline) {
    if (!betfairTimeline || !Array.isArray(betfairTimeline.timeline)) return [];
    const tl = betfairTimeline.timeline;
    if (tl.length < 2) return [];
    return tl.slice(Math.max(0, tl.length - 1 - MAX_LOOKBACK_TICKS), tl.length - 1);
}
