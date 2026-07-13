import { normalizeMoney } from './numbers.js';
import {
    isGraphCompatibleLadderSource,
    normalizeSelectionId
} from './moneyFlow.js';
import {
    findLastAlgorithmicTick,
    getNextBetfairSeq,
    isDuplicateBetfairTick,
    isRegressiveBetfairTick
} from './timeline/state.js';

export {
    findLastAlgorithmicTick,
    getNextBetfairSeq,
    isDuplicateBetfairTick,
    isRegressiveBetfairTick
};

function cloneCanonicalRunners(runners) {
    return (runners || []).map(runner => ({
        ...runner,
        bookBack: Array.isArray(runner.bookBack)
            ? runner.bookBack.map(level => ({ ...level }))
            : [],
        bookLay: Array.isArray(runner.bookLay)
            ? runner.bookLay.map(level => ({ ...level }))
            : [],
        ladder: Array.isArray(runner.ladder)
            ? runner.ladder.map(row => ({ ...row }))
            : [],
        moneyFlow: {
            back: 0,
            lay: 0,
            trend: 'neutral',
            confidence: 'suppressed',
            reason: 'graph_login_required'
        }
    }));
}

export function buildBetfairTimelineTick(processedResult, marketKey, existingTimeline = null) {
    const now = new Date();
    const marketInfo = processedResult.market_info || {};
    const networkCapture = processedResult.network_capture || {};
    const graphDiag = processedResult.graph_diagnostics || {};
    const marketTotalMatched = normalizeMoney(marketInfo.total_matched);

    const runners = (processedResult.runners || []).map(runner => {
        const back = Array.isArray(runner.back) ? runner.back : [];
        const lay = Array.isArray(runner.lay) ? runner.lay : [];
        const ladder = Array.isArray(runner.ladder) ? runner.ladder : [];

        const bestBack = back[0] || {};
        const bestLay = lay[0] || {};

        const bookBack = back.slice(0, 3).map(item => ({
            price: parseFloat(item.price) || 0,
            size: normalizeMoney(item.vol)
        })).filter(item => item.price > 0);

        const bookLay = lay.slice(0, 3).map(item => ({
            price: parseFloat(item.price) || 0,
            size: normalizeMoney(item.vol)
        })).filter(item => item.price > 0);

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
            bookBack,
            bookLay,
            wom: typeof runner.wom === 'number' ? runner.wom : 0.5,
            moneyFlow: runner.moneyFlow && typeof runner.moneyFlow === 'object'
                ? {
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
                }
                : {
                    back: 0,
                    lay: 0,
                    trend: 'neutral',
                    confidence: 'suppressed',
                    reason: 'no_previous_state'
                },
            ladderSource: runner.ladderSource || 'none',
            ladder: ladder.map(row => ({
                price: typeof row.price === 'number' ? row.price : parseFloat(row.price) || 0,
                back: typeof row.back === 'number' ? row.back : normalizeMoney(row.back_available),
                lay: typeof row.lay === 'number' ? row.lay : normalizeMoney(row.lay_available),
                traded: typeof row.traded === 'number' ? row.traded : normalizeMoney(row.traded)
            }))
        };
    });

    const ladderRows = runners.reduce(
        (sum, runner) => sum + (Array.isArray(runner.ladder) ? runner.ladder.length : 0),
        0
    );

    const eventStatus = processedResult.event_status || { hasFinished: false };
    const graphUrlsProvided = graphDiag.graphUrlsProvided || 0;
    const graphUrlsAttempted = graphDiag.graphUrlsAttempted || 0;
    const graphUrlsSucceeded = graphDiag.graphUrlsSucceeded || 0;
    const graphUrlsFailed = graphDiag.graphUrlsFailed || 0;
    const graphRowsTotal = graphDiag.graphRowsTotal || 0;
    const authSuspectedRaw = !!graphDiag.authSuspected ||
        !!processedResult.diagnostics?.graphLoginRequired;
    const failures = Array.isArray(graphDiag.failures) ? graphDiag.failures : [];

    const baseQuotesAvailable = runners.some(runner =>
        runner.bestBack > 0 || runner.bestLay > 0
    );

    let anyUsableLadder = false;
    let anyUsableGraphLadder = false;
    let graphLadderRunners = 0;
    let bookLadderRunners = 0;
    let graphLadderRows = 0;

    for (const runner of runners) {
        if (!Array.isArray(runner.ladder) || runner.ladder.length === 0) continue;

        const hasUsableRow = runner.ladder.some(row =>
            typeof row.price === 'number' &&
            (
                (typeof row.back === 'number' && row.back > 0) ||
                (typeof row.lay === 'number' && row.lay > 0) ||
                (typeof row.traded === 'number' && row.traded > 0)
            )
        );

        if (!hasUsableRow) continue;

        anyUsableLadder = true;

        if (isGraphCompatibleLadderSource(runner.ladderSource)) {
            anyUsableGraphLadder = true;
            graphLadderRunners++;
            graphLadderRows += runner.ladder.length;
        } else if (runner.ladderSource === 'book_depth' || runner.ladderSource === 'book') {
            bookLadderRunners++;
        }
    }

    let overallLadderSource = 'none';
    if (graphLadderRunners > 0 && bookLadderRunners > 0) {
        overallLadderSource = 'mixed';
    } else if (graphLadderRunners > 0) {
        overallLadderSource = 'graph';
    } else if (bookLadderRunners > 0) {
        overallLadderSource = 'book';
    }

    let graphHealthStatus = 'unknown';
    let graphHealthAvailable = false;
    let graphHealthReason = null;

    if (eventStatus.hasFinished === true) {
        graphHealthStatus = 'finished';
        graphHealthReason = 'market_finished';
    } else if (authSuspectedRaw) {
        graphHealthStatus = 'auth_suspected';
        graphHealthReason = 'graph_login_required';
    } else if (graphUrlsProvided === 0) {
        graphHealthStatus = 'unavailable';
        graphHealthReason = 'no_graph_urls_provided';
    } else if (
        graphUrlsSucceeded > 0 &&
        graphUrlsSucceeded >= graphUrlsProvided &&
        graphRowsTotal > 0
    ) {
        graphHealthStatus = 'ok';
        graphHealthAvailable = true;
    } else if (graphUrlsSucceeded > 0 && graphUrlsFailed > 0) {
        graphHealthStatus = anyUsableGraphLadder ? 'stale' : 'temporary_error';
        graphHealthAvailable = anyUsableGraphLadder;
        graphHealthReason = 'partial_graph_success';
    } else if (failures.some(failure =>
        failure &&
        (
            String(failure.reason || '').includes('bad_graph_url') ||
            String(failure.reason || '').includes('selection_not_found')
        )
    )) {
        graphHealthStatus = 'bad_graph_url';
        graphHealthReason = 'graph_url_selection_mismatch';
    } else if (graphUrlsAttempted > 0 && graphRowsTotal === 0 && graphUrlsFailed > 0) {
        graphHealthStatus = 'temporary_error';
        graphHealthReason = 'graph_fetch_failed';
    } else if (!runners.length || (marketTotalMatched <= 0 && !baseQuotesAvailable)) {
        graphHealthStatus = 'unavailable';
        graphHealthReason = 'empty_or_thin_market';
    }

    const previousTick = findLastAlgorithmicTick(existingTimeline);
    const preserveLastCanonicalSnapshot = (
        previousTick !== null &&
        processedResult.diagnostics?.graphLoginRequired === true &&
        graphRowsTotal === 0 &&
        processedResult.timelineIntegrity?.accepted === false
    );

    const statusLadderRows = preserveLastCanonicalSnapshot ? 0 : ladderRows;
    const statusGraphLadderRows = preserveLastCanonicalSnapshot ? 0 : graphLadderRows;
    const statusHasUsableLadder = preserveLastCanonicalSnapshot
        ? false
        : anyUsableLadder;
    const statusHasUsableGraphLadder = preserveLastCanonicalSnapshot
        ? false
        : anyUsableGraphLadder;
    const statusBaseQuotesAvailable = preserveLastCanonicalSnapshot
        ? false
        : baseQuotesAvailable;
    const statusLadderSource = preserveLastCanonicalSnapshot
        ? 'none'
        : overallLadderSource;

    const previousGraphHealth = previousTick?.graphHealth || null;

    let lastOkAt;
    let lastFailAt;
    let consecutiveFailures;
    let staleSeconds;

    if (graphHealthStatus === 'ok') {
        lastOkAt = now.toISOString();
        lastFailAt = previousGraphHealth?.lastFailAt || null;
        consecutiveFailures = 0;
        staleSeconds = 0;
    } else if (graphHealthStatus === 'finished') {
        lastOkAt = previousGraphHealth?.lastOkAt || null;
        lastFailAt = previousGraphHealth?.lastFailAt || null;
        consecutiveFailures = previousGraphHealth?.consecutiveFailures || 0;
        staleSeconds = previousGraphHealth?.lastOkAt
            ? Math.round((now.getTime() - new Date(previousGraphHealth.lastOkAt).getTime()) / 1000)
            : null;
    } else {
        lastOkAt = previousGraphHealth?.lastOkAt || null;
        lastFailAt = now.toISOString();
        consecutiveFailures = (previousGraphHealth?.consecutiveFailures || 0) + 1;
        staleSeconds = lastOkAt
            ? Math.round((now.getTime() - new Date(lastOkAt).getTime()) / 1000)
            : null;
    }

    const graphHealth = {
        available: graphHealthAvailable,
        status: graphHealthStatus,
        lastOkAt,
        lastFailAt,
        consecutiveFailures,
        authSuspected: authSuspectedRaw,
        staleSeconds,
        reason: graphHealthReason,
        graphUrlsProvided,
        graphUrlsAttempted,
        graphUrlsSucceeded,
        graphUrlsFailed,
        ladderRows: statusLadderRows,
        graphLadderRows: statusGraphLadderRows,
        hasUsableLadder: statusHasUsableLadder,
        hasUsableGraphLadder: statusHasUsableGraphLadder,
        baseQuotesAvailable: statusBaseQuotesAvailable,
        ladderSource: statusLadderSource
    };

    const canonicalMarket = preserveLastCanonicalSnapshot
        ? { ...(previousTick.market || {}) }
        : {
            marketId: marketInfo.market_id || '',
            totalMatched: marketTotalMatched
        };
    const canonicalRunners = preserveLastCanonicalSnapshot
        ? cloneCanonicalRunners(previousTick.runners)
        : runners;
    const canonicalEventStatus = preserveLastCanonicalSnapshot
        ? { ...(previousTick.event_status || eventStatus) }
        : eventStatus;

    return {
        source: 'betfair',
        timestamp: now.toISOString(),
        ts: now.getTime(),
        marketKey,
        market: canonicalMarket,
        runners: canonicalRunners,
        event_status: canonicalEventStatus,
        graphHealth,
        diagnostics: {
            hasLadder: statusLadderRows > 0,
            ladderRows: statusLadderRows,
            hasUsableLadder: statusHasUsableLadder,
            hasUsableGraphLadder: statusHasUsableGraphLadder,
            ladderSource: statusLadderSource,
            graphHealthStatus,
            graphUrlsProvided,
            graphUrlsSucceeded,
            graphUrlsFailed,
            networkCaptureSummary: {
                enabled: !!networkCapture.enabled,
                response_count: networkCapture.response_count || 0,
                json_count: networkCapture.json_count || 0,
                errors_count: networkCapture.errors_count || 0,
                candidates_count: Array.isArray(networkCapture.candidates)
                    ? networkCapture.candidates.length
                    : 0
            },
            graphLoginRequired: !!processedResult.diagnostics?.graphLoginRequired,
            statusOnlyGraphLogin: preserveLastCanonicalSnapshot,
            graphLoginRequiredUrl: processedResult.diagnostics?.graphLoginRequiredUrl ?? null,
            graphLoginRequiredReason: processedResult.diagnostics?.graphLoginRequiredReason ?? null,
            graphLoginRequiredText: processedResult.diagnostics?.graphLoginRequiredText ?? null
        }
    };
}
