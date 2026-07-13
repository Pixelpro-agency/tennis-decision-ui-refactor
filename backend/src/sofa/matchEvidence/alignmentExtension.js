import { ageSec } from './time.js';
import { buildLastSofaMarkerAlignment, buildLastBetfairMoveAlignment, computeMarketReactionOrder } from '../marketFlowEvidence.js';
import { buildTemporalAlignment } from '../temporalAlignmentEvidence.js';

export function buildAlignmentExtension({ sofaEvidence, marketEvidence, betfairTick, now, allSofaTicks, allBetfairTicks }) {
    const eventMarkers = sofaEvidence?.eventMarkers || [];
    const lastSofaMarkerRaw = buildLastSofaMarkerAlignment(eventMarkers, null);

    let lastSofaMarker = lastSofaMarkerRaw;
    if (lastSofaMarkerRaw.available && lastSofaMarkerRaw.timestamp) {
        const age = ageSec(lastSofaMarkerRaw.timestamp, now);
        lastSofaMarker = { ...lastSofaMarkerRaw, ageSec: age !== null ? Math.round(age) : null };
    }

    const summary = marketEvidence?.marketFlowSummary;
    const dominantRunnerName = summary?.dominantRunner?.name || null;
    const dominantSelectionId = summary?.dominantRunner?.selectionId ?? null;

    const runners = marketEvidence?.runners || [];
    const dominantRunnerObj = runners.find(r => {
        if (dominantSelectionId != null && r.selectionId === dominantSelectionId) return true;
        if (dominantRunnerName && r.name === dominantRunnerName) return true;
        return false;
    }) || null;

    const dominantForAlignment = dominantRunnerObj
        ? { name: dominantRunnerObj.name, selectionId: dominantRunnerObj.selectionId ?? null, flowEvidence: dominantRunnerObj.flowEvidence }
        : null;

    const lastBetfairMoveRaw = buildLastBetfairMoveAlignment(dominantForAlignment, betfairTick);
    let lastBetfairMove = lastBetfairMoveRaw;
    if (lastBetfairMoveRaw.available && lastBetfairMoveRaw.timestamp) {
        const age = ageSec(lastBetfairMoveRaw.timestamp, now);
        lastBetfairMove = { ...lastBetfairMoveRaw, ageSec: age !== null ? Math.round(age) : null };
    }

    const sofaMarkerTs = lastSofaMarker.available ? lastSofaMarker.timestamp : null;
    const betfairMoveTs = lastBetfairMove.available ? lastBetfairMove.timestamp : null;
    const { eventMarketGapSec, marketReactionOrder } = computeMarketReactionOrder(sofaMarkerTs, betfairMoveTs);

    const temporal = buildTemporalAlignment({
        sofaTicks: Array.isArray(allSofaTicks) ? allSofaTicks : [],
        betfairTicks: Array.isArray(allBetfairTicks) ? allBetfairTicks : [],
        now
    });

    return {
        lastSofaMarker,
        lastBetfairMove,
        eventMarketGapSec,
        marketReactionOrder,
        temporal
    };
}
