import { normalizeMoney } from './numbers.js';
import {
    findLastAlgorithmicTick,
    getNextBetfairSeq,
    isDuplicateBetfairTick,
    isRegressiveBetfairTick
} from './timeline/state.js';
import { buildCanonicalRunners } from './timeline/runnerSnapshot.js';
import { summarizeCanonicalLadders } from './timeline/ladderSummary.js';
import {
    buildGraphHealth,
    buildNetworkCaptureSummary,
    readGraphDiagnostics
} from './timeline/graphHealth.js';
import {
    applyStatusOnlySummary,
    cloneCanonicalRunnersForStatusOnly,
    shouldPreserveLastCanonicalSnapshot
} from './timeline/statusOnlySnapshot.js';

export {
    findLastAlgorithmicTick,
    getNextBetfairSeq,
    isDuplicateBetfairTick,
    isRegressiveBetfairTick
};

export function buildBetfairTimelineTick(processedResult, marketKey, existingTimeline = null) {
    const now = new Date();
    const marketInfo = processedResult.market_info || {};
    const networkCapture = processedResult.network_capture || {};
    const marketTotalMatched = normalizeMoney(marketInfo.total_matched);
    const runners = buildCanonicalRunners(processedResult.runners);
    const ladderSummary = summarizeCanonicalLadders(runners);
    const eventStatus = processedResult.event_status || { hasFinished: false };
    const graphDiagnostics = readGraphDiagnostics(processedResult);
    const previousTick = findLastAlgorithmicTick(existingTimeline);
    const preserveLastCanonicalSnapshot = shouldPreserveLastCanonicalSnapshot({
        previousTick,
        processedResult,
        graphRowsTotal: graphDiagnostics.graphRowsTotal
    });
    const statusSummary = applyStatusOnlySummary(
        ladderSummary,
        preserveLastCanonicalSnapshot
    );
    const graphHealth = buildGraphHealth({
        now,
        eventStatus,
        graphDiagnostics,
        ladderSummary,
        statusSummary,
        runners,
        marketTotalMatched,
        previousTick
    });

    const canonicalMarket = preserveLastCanonicalSnapshot
        ? { ...(previousTick.market || {}) }
        : {
            marketId: marketInfo.market_id || '',
            totalMatched: marketTotalMatched
        };
    const canonicalRunners = preserveLastCanonicalSnapshot
        ? cloneCanonicalRunnersForStatusOnly(previousTick.runners)
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
            hasLadder: statusSummary.ladderRows > 0,
            ladderRows: statusSummary.ladderRows,
            hasUsableLadder: statusSummary.hasUsableLadder,
            hasUsableGraphLadder: statusSummary.hasUsableGraphLadder,
            ladderSource: statusSummary.ladderSource,
            graphHealthStatus: graphHealth.status,
            graphUrlsProvided: graphDiagnostics.graphUrlsProvided,
            graphUrlsSucceeded: graphDiagnostics.graphUrlsSucceeded,
            graphUrlsFailed: graphDiagnostics.graphUrlsFailed,
            networkCaptureSummary: buildNetworkCaptureSummary(networkCapture),
            graphLoginRequired: !!processedResult.diagnostics?.graphLoginRequired,
            statusOnlyGraphLogin: preserveLastCanonicalSnapshot,
            graphLoginRequiredUrl: processedResult.diagnostics?.graphLoginRequiredUrl ?? null,
            graphLoginRequiredReason: processedResult.diagnostics?.graphLoginRequiredReason ?? null,
            graphLoginRequiredText: processedResult.diagnostics?.graphLoginRequiredText ?? null
        }
    };
}
