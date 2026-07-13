import assert from 'node:assert/strict';
import {
    GRID_SIZE,
    alignToGrid,
    buildSharedGrid,
    computeFlowWom,
    getDisplayMatchedVolume,
    toNumber
} from './betfairMoneyFlow.js';

assert.equal(GRID_SIZE, 20);
assert.equal(toNumber('12.5'), 12.5);
assert.equal(toNumber('not-a-number'), 0);
assert.equal(toNumber(null), 0);
assert.equal(toNumber(undefined, 7), 7);

assert.equal(
    getDisplayMatchedVolume({
        matchedVolume: 125.5,
        validForDisplay: true
    }),
    125.5
);
assert.equal(
    getDisplayMatchedVolume({
        matchedVolume: 0,
        validForDisplay: true
    }),
    0
);
assert.equal(
    getDisplayMatchedVolume({
        matchedVolume: 12,
        invalidVolume: true,
        validForDisplay: false
    }),
    0
);
assert.equal(
    getDisplayMatchedVolume({
        matchedVolume: 12,
        anomaly: true,
        validForDisplay: true
    }),
    0
);
assert.equal(
    getDisplayMatchedVolume({
        matchedVolume: 12,
        emptySlot: true,
        validForDisplay: true
    }),
    0
);
assert.equal(
    getDisplayMatchedVolume({
        matchedVolume: Number.POSITIVE_INFINITY,
        validForDisplay: true
    }),
    0
);

const shortGrid = buildSharedGrid([
    [
        { timestamp: '2026-06-24T10:00:00.000Z' },
        { timestamp: '2026-06-24T10:02:00.000Z' }
    ],
    [
        { timestamp: '2026-06-24T10:01:00.000Z' },
        { timestamp: '2026-06-24T10:02:00.000Z' }
    ]
]);

assert.equal(shortGrid.length, GRID_SIZE);
assert.equal(shortGrid[17].timestamp, '2026-06-24T10:00:00.000Z');
assert.equal(shortGrid[18].timestamp, '2026-06-24T10:01:00.000Z');
assert.equal(shortGrid[19].timestamp, '2026-06-24T10:02:00.000Z');

const crossDayGrid = buildSharedGrid([
    [
        { timestamp: '2026-06-25T10:00:00.000Z' },
        { timestamp: '2026-06-24T10:00:00.000Z' }
    ]
]);

assert.equal(crossDayGrid[18].timestamp, '2026-06-24T10:00:00.000Z');
assert.equal(crossDayGrid[19].timestamp, '2026-06-25T10:00:00.000Z');

const longHistory = Array.from(
    { length: 22 },
    (_, index) => ({
        timestamp: `2026-06-24T10:${String(index).padStart(2, '0')}:00.000Z`
    })
);

const limitedGrid = buildSharedGrid([longHistory]);
assert.equal(limitedGrid.length, GRID_SIZE);
assert.equal(limitedGrid[0].timestamp, '2026-06-24T10:02:00.000Z');
assert.equal(limitedGrid[19].timestamp, '2026-06-24T10:21:00.000Z');

const alignedHistory = alignToGrid(shortGrid, [
    {
        timestamp: '2026-06-24T10:01:00.000Z',
        matchedVolume: 25,
        validForDisplay: true
    }
]);

assert.equal(alignedHistory.length, GRID_SIZE);
assert.equal(alignedHistory[0].emptySlot, true);
assert.equal(alignedHistory[0].matchedVolume, 0);
assert.equal(alignedHistory[17].timestamp, '2026-06-24T10:00:00.000Z');
assert.equal(alignedHistory[18].matchedVolume, 25);
assert.equal(alignedHistory[19].timestamp, '2026-06-24T10:02:00.000Z');

const flowState = computeFlowWom([
    { back: 60, lay: 40, unclassified: 5, suppressedVolume: 2 },
    { back: 20, lay: 80, unclassified: 3, suppressedVolume: 9 }
]);

assert.equal(flowState.backSum, 80);
assert.equal(flowState.laySum, 120);
assert.equal(flowState.unclassifiedSum, 14);
assert.equal(flowState.classifiedTotal, 200);
assert.equal(flowState.wom, 0.4);

console.log('betfairMoneyFlow matchedVolume utility tests passed');
