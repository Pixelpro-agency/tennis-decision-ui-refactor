import { buildAlignmentExtension } from './alignmentExtension.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const now = new Date('2026-06-21T00:00:00.000Z');
const result = buildAlignmentExtension({
    sofaEvidence: { eventMarkers: [] },
    marketEvidence: { marketFlowSummary: { dominantRunner: null }, runners: [] },
    betfairTick: null,
    now,
    allSofaTicks: [],
    allBetfairTicks: []
});
assert(result && typeof result === 'object', 'output');
assert(result.lastSofaMarker && result.lastSofaMarker.available === false, 'empty Sofa marker');
assert(result.lastBetfairMove && result.lastBetfairMove.available === false, 'empty Betfair move');
assert(result.eventMarketGapSec === null, 'missing timestamp gap');
assert(result.marketReactionOrder === 'unknown', 'missing timestamp order');
assert(result.temporal && Array.isArray(result.temporal.warnings), 'temporal block');
assert(result.latestSnapshotMarkerOrder?.windowSec === 10, 'snapshot order contract is named');
assert(result.temporalLookbackReactionWindow?.windowSec === 30, 'lookback window contract is named');
console.log('matchEvidence alignment extension: 8 assertions passed');
