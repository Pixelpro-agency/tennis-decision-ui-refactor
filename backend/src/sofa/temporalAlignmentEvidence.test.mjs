import assert from 'node:assert/strict';
import { computeMarketReactionOrder } from './marketFlowEvidence.js';
import { buildTemporalAlignment, computeReactionWindows } from './temporalAlignmentEvidence.js';
import {
    NOW,
    makeBetfairTick,
    makeSofaTick
} from './temporalAlignmentEvidence/temporalAlignmentEvidenceTestFixtures.mjs';

const sofaTicks = [
    makeSofaTick('2026-06-19T12:09:00.000Z', '15-15', 2, 3, 0, 0, 'inprogress', 'away', 1),
    makeSofaTick('2026-06-19T12:09:20.000Z', '40-30', 2, 3, 0, 0, 'inprogress', 'away', 2)
];
const betfairTicks = [
    makeBetfairTick('2026-06-19T12:09:05.000Z', 'Runner', 2, 1.98, 2.02, 1000, 0, 0, 'neutral', 0, 0, 'confirmed', 1),
    makeBetfairTick('2026-06-19T12:09:40.000Z', 'Runner', 1.9, 1.89, 1.92, 1100, 80, 0, 'backing', 80, 100, 'confirmed', 2)
];

const healthyQuality = {
    sofaRecent: true,
    betfairRecent: true,
    graphHealth: 'ok',
    ladderReliable: true,
    marketTradable: true
};

const reliable = buildTemporalAlignment({
    sofaTicks,
    betfairTicks,
    now: NOW,
    dataQuality: healthyQuality
});
assert.equal(reliable.available, true);
assert.equal(reliable.reliable, true);
assert.deepEqual(reliable.reliabilityReasons, []);

const stale = buildTemporalAlignment({
    sofaTicks,
    betfairTicks,
    now: NOW,
    dataQuality: { ...healthyQuality, betfairRecent: false }
});
assert.equal(stale.available, true);
assert.equal(stale.reliable, false);
assert.ok(stale.reliabilityReasons.includes('Betfair tick is not recent'));

const snapshotOrder = computeMarketReactionOrder(
    '2026-06-19T12:09:00.000Z',
    '2026-06-19T12:09:20.000Z'
);
const lookbackWindow = computeReactionWindows(
    { available: true, stateFirstSeenAt: '2026-06-19T12:09:00.000Z' },
    { available: true, timestamp: '2026-06-19T12:09:20.000Z' }
);
assert.equal(snapshotOrder.marketReactionOrder, 'market_after_sofa');
assert.equal(lookbackWindow.relation, 'same_window');
assert.equal(lookbackWindow.windowSec, 30);

console.log('temporalAlignmentEvidence.test: 9 assertions passed');
