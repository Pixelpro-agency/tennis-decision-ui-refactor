export function isGraphCompatibleLadderSource(source) {
    return source === 'graph_url' || source === 'graph';
}

export function normalizeSelectionId(selectionId) {
    return selectionId === null || selectionId === undefined
        ? null
        : String(selectionId);
}

export function getRunnerIdentity(runner, index) {
    return {
        selectionId: normalizeSelectionId(runner?.selectionId),
        name: runner?.name ?? null,
        index
    };
}

export function getRunnerMatchedValue(runner, matchedTotalFromGraph) {
    if (typeof matchedTotalFromGraph === 'number' && matchedTotalFromGraph > 0) return matchedTotalFromGraph;
    if (typeof runner?.totalMatchedOnSelection === 'number' && runner.totalMatchedOnSelection > 0) return runner.totalMatchedOnSelection;
    if (typeof runner?.matchedTotal === 'number' && runner.matchedTotal > 0) return runner.matchedTotal;
    return null;
}

export function buildSuppressedMoneyFlow(reason, extra = {}) {
    return {
        back: 0,
        lay: 0,
        trend: 'neutral',
        confidence: 'suppressed',
        reason,
        marketDelta: extra.marketDelta ?? undefined,
        runnerDelta: extra.runnerDelta ?? undefined,
        ladderTradedDelta: extra.ladderTradedDelta ?? undefined
    };
}

export function findPreviousRunner(previousRunners, currentRunner) {
    if (!Array.isArray(previousRunners) || previousRunners.length === 0) return null;

    const currentSelectionId = normalizeSelectionId(currentRunner?.selectionId);
    if (currentSelectionId === null) return null;

    return previousRunners.find(previousRunner =>
        normalizeSelectionId(previousRunner?.selectionId) === currentSelectionId
    ) || null;
}

export function calculateValidatedMoneyFlow(opts) {
    const {
        currentLadderSource,
        previousLadderSource,
        currentLadder,
        previousLadder,
        currentMarketTotal,
        previousMarketTotal,
        currentRunnerMatched,
        previousRunnerMatched,
        lastTradedPrice,
        midPrice
    } = opts;

    const FLOW_TOLERANCE_ABS = 1;
    const FLOW_TOLERANCE_PCT = 0.05;

    if (!isGraphCompatibleLadderSource(currentLadderSource)) {
        return buildSuppressedMoneyFlow('current_ladder_not_graph', {
            marketDelta: typeof currentMarketTotal === 'number' && typeof previousMarketTotal === 'number'
                ? currentMarketTotal - previousMarketTotal : undefined
        });
    }

    if (!isGraphCompatibleLadderSource(previousLadderSource)) {
        const reason = isGraphCompatibleLadderSource(currentLadderSource)
            ? 'graph_recovered_after_non_graph'
            : 'previous_ladder_not_graph';
        return buildSuppressedMoneyFlow(reason, {
            marketDelta: typeof currentMarketTotal === 'number' && typeof previousMarketTotal === 'number'
                ? currentMarketTotal - previousMarketTotal : undefined
        });
    }

    if (!Array.isArray(currentLadder) || currentLadder.length === 0) {
        return buildSuppressedMoneyFlow('current_ladder_not_graph');
    }
    if (!Array.isArray(previousLadder) || previousLadder.length === 0) {
        return buildSuppressedMoneyFlow('previous_ladder_not_graph');
    }

    if (typeof currentMarketTotal !== 'number' || !Number.isFinite(currentMarketTotal)) {
        return buildSuppressedMoneyFlow('market_matched_unavailable');
    }
    if (typeof previousMarketTotal !== 'number' || !Number.isFinite(previousMarketTotal)) {
        return buildSuppressedMoneyFlow('market_matched_unavailable');
    }

    const marketDelta = currentMarketTotal - previousMarketTotal;

    if (marketDelta < 0) {
        return buildSuppressedMoneyFlow('matched_total_decreased', { marketDelta });
    }
    if (marketDelta === 0) {
        return buildSuppressedMoneyFlow('no_total_matched_delta', { marketDelta });
    }

    if (currentRunnerMatched == null || !Number.isFinite(currentRunnerMatched)) {
        return buildSuppressedMoneyFlow('runner_matched_unavailable', { marketDelta });
    }
    if (previousRunnerMatched == null || !Number.isFinite(previousRunnerMatched)) {
        return buildSuppressedMoneyFlow('runner_matched_unavailable', { marketDelta });
    }

    const runnerDelta = currentRunnerMatched - previousRunnerMatched;

    if (runnerDelta < 0) {
        return buildSuppressedMoneyFlow('matched_total_decreased', { marketDelta, runnerDelta });
    }
    if (runnerDelta === 0) {
        return buildSuppressedMoneyFlow('runner_matched_unchanged', { marketDelta, runnerDelta });
    }

    const runnerVsMarketTolerance = Math.max(FLOW_TOLERANCE_ABS, marketDelta * FLOW_TOLERANCE_PCT);
    if (runnerDelta > marketDelta + runnerVsMarketTolerance) {
        return buildSuppressedMoneyFlow('runner_delta_exceeds_market_delta', { marketDelta, runnerDelta });
    }

    const prevMap = new Map((previousLadder || []).map(r => [r.price, r]));
    let tradedBack = 0;
    let tradedLay = 0;
    let ladderTradedDelta = 0;

    const refPrice = lastTradedPrice > 0 ? lastTradedPrice : (midPrice > 0 ? midPrice : 0);

    currentLadder.forEach(row => {
        const prevRow = prevMap.get(row.price);
        const deltaTraded = Math.max(0, row.traded - (prevRow?.traded || 0));
        if (deltaTraded > 0) {
            ladderTradedDelta += deltaTraded;
            if (refPrice > 0) {
                if (row.price <= refPrice) {
                    tradedBack += deltaTraded;
                } else {
                    tradedLay += deltaTraded;
                }
            }
        }
    });

    if (ladderTradedDelta === 0) {
        return buildSuppressedMoneyFlow('runner_matched_unchanged', { marketDelta, runnerDelta, ladderTradedDelta: 0 });
    }

    const tolerance = Math.max(FLOW_TOLERANCE_ABS, runnerDelta * FLOW_TOLERANCE_PCT);
    if (ladderTradedDelta > runnerDelta + tolerance) {
        return buildSuppressedMoneyFlow('flow_exceeds_runner_delta', { marketDelta, runnerDelta, ladderTradedDelta });
    }

    let back = tradedBack;
    let lay = tradedLay;
    const rawTotal = back + lay;
    if (rawTotal > runnerDelta && rawTotal > 0) {
        const scale = runnerDelta / rawTotal;
        back = back * scale;
        lay = lay * scale;
    }

    back = parseFloat(back.toFixed(2));
    lay = parseFloat(lay.toFixed(2));

    let trend = 'neutral';
    if (back > lay * 1.5) trend = 'backing';
    else if (lay > back * 1.5) trend = 'laying';

    return {
        back,
        lay,
        trend,
        confidence: 'confirmed',
        reason: null,
        marketDelta,
        runnerDelta,
        ladderTradedDelta: parseFloat(ladderTradedDelta.toFixed(2))
    };
}
