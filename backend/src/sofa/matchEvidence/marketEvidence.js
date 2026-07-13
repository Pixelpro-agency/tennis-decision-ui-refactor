import { buildMarketFlowSummary } from '../marketFlowEvidence.js';
import { buildRunnerEvidence } from './runnerEvidence.js';

export function buildMarketEvidence(betfairTick, betfairRecent, graphHealthStatus, lookbackEntries) {
    if (!betfairTick || !betfairRecent) {
        return {
            runners: [],
            marketFlowSummary: {
                available: false,
                reliable: false,
                totalMarketMatchedDelta: null,
                runnersWithFlow: 0,
                runnersConfirmedByPrice: 0,
                bothRunnersSameRawDirection: false,
                dominantRunner: null,
                interpretation: 'unavailable',
                ambiguityReasons: []
            }
        };
    }
    const d = betfairTick.data || {};
    const rawRunners = Array.isArray(d.runners) ? d.runners : [];
    const lb = Array.isArray(lookbackEntries) ? lookbackEntries : [];

    const runners = rawRunners
        .map(r => buildRunnerEvidence(r, betfairRecent, graphHealthStatus, betfairTick, lb))
        .filter(Boolean);

    let totalMarketMatchedDelta = null;
    for (const r of runners) {
        if (r.flowEvidence?.available && r.flowEvidence?.marketMatchedDelta !== null) {
            totalMarketMatchedDelta = r.flowEvidence.marketMatchedDelta;
            break;
        }
    }

    const runnersForSummary = runners.map(r => ({
        name: r.name,
        selectionId: r.selectionId,
        flowEvidence: r.flowEvidence
    }));
    const marketFlowSummary = buildMarketFlowSummary(runnersForSummary, totalMarketMatchedDelta);

    return { runners, marketFlowSummary };
}


