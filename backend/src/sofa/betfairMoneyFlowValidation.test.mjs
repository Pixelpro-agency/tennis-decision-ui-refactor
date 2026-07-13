
import assert from 'node:assert/strict';
import { calculateValidatedMoneyFlow, buildSuppressedMoneyFlow } from './betfairFetch.js';
import {
    buildMoneyFlowHistoryPoint,
    validateMoneyFlowPoint
} from '../routes/betfair/moneyFlowHistory.js';

const GRID_SIZE = 20;
function buildSharedGrid(histories) {
    const seen = new Set();
    const allTs = [];
    for (const hist of Object.values(histories)) {
        for (const pt of hist) {
            if (pt.timestamp && !seen.has(pt.timestamp)) {
                seen.add(pt.timestamp);
                allTs.push(pt.timestamp);
            }
        }
    }
    allTs.sort((a, b) => a.localeCompare(b));
    const realTs = allTs.slice(-GRID_SIZE);
    const pad = GRID_SIZE - realTs.length;
    const empty = Array.from({ length: pad }, (_, k) => ({ key: `__empty_${k}`, timestamp: '' }));
    return [...empty, ...realTs.map(ts => ({ key: ts, timestamp: ts }))];
}
function alignToGrid(grid, runnerHistory) {
    const byTs = new Map();
    for (const pt of (runnerHistory || [])) {
        if (pt.timestamp) byTs.set(pt.timestamp, pt);
    }
    return grid.map(slot => {
        if (!slot.timestamp) {
            return { timestamp: '', back: 0, lay: 0, unclassified: 0, suppressedVolume: 0,
                classifiedVolume: 0, emptySlot: true, invalidVolume: false, anomaly: false, validForDisplay: false };
        }
        return byTs.get(slot.timestamp) || {
            timestamp: slot.timestamp, back: 0, lay: 0, unclassified: 0,
            suppressedVolume: 0, classifiedVolume: 0,
            emptySlot: true, invalidVolume: false, anomaly: false, validForDisplay: false
        };
    });
}


let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(`    ${err.message}`);
        failed++;
    }
}


console.log('\n[Backend] validateMoneyFlowPoint — anomaly detection\n');

test('Test 1: matched_total_decreased → invalidVolume, zero back/lay/unclassified', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 880,
        computedMarketDelta: 880,
        rawRunnerDelta: -12006,
        computedRunnerDelta: -12006,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: 'matched_total_decreased'
    });
    assert.equal(v.validForDisplay, false, 'validForDisplay must be false');
    assert.equal(v.invalidVolume, true, 'invalidVolume must be true');
    assert.equal(v.anomaly, true, 'anomaly must be true');
    assert.equal(v.reason, 'matched_total_decreased');
});

test('Test 2: runnerDelta > marketDelta → runner_delta_exceeds_market_delta', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 880,
        computedMarketDelta: 880,
        rawRunnerDelta: 12886,
        computedRunnerDelta: 12886,
        classifiedVolume: 206,
        ladderTradedDelta: null,
        reason: null
    });
    assert.equal(v.validForDisplay, false, 'validForDisplay must be false');
    assert.equal(v.invalidVolume, true, 'invalidVolume must be true');
    assert.equal(v.anomaly, true, 'anomaly must be true');
    assert.equal(v.reason, 'runner_delta_exceeds_market_delta');
});

test('Test 3: valid suppressed volume (runnerDelta=778, marketDelta=790, back=0, lay=0)', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 790,
        computedMarketDelta: 790,
        rawRunnerDelta: 778,
        computedRunnerDelta: 778,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: 'runner_matched_unchanged'
    });
    assert.equal(v.validForDisplay, true, 'validForDisplay must be true for valid suppressed volume');
    assert.equal(v.invalidVolume, false);
    assert.equal(v.anomaly, false);
});

test('Test 4: classifiedVolume/back/lay mismatch does not invalidate dashboard volume', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 500,
        computedMarketDelta: 500,
        rawRunnerDelta: 100,
        computedRunnerDelta: 100,
        classifiedVolume: 999,
        back: 600,
        lay: 399,
        ladderTradedDelta: null,
        reason: null
    });

    assert.equal(v.validForDisplay, true);
    assert.equal(v.invalidVolume, false);
    assert.equal(v.anomaly, false);

    const point = buildMoneyFlowHistoryPoint({
        previousTick: {
            timestamp: '2026-06-24T14:00:00.000Z',
            data: {
                seq: 1,
                market: { totalMatched: 1000 },
                runners: [{ selectionId: 101, matchedTotal: 100 }]
            }
        },
        tick: {
            timestamp: '2026-06-24T14:00:05.000Z',
            data: {
                seq: 2,
                market: { totalMatched: 1100 },
                graphHealth: { status: 'ok' }
            }
        },
        runner: {
            selectionId: 101,
            matchedTotal: 200,
            ladderSource: 'graph_url',
            moneyFlow: {
                runnerDelta: 100,
                marketDelta: 100,
                back: 600,
                lay: 399
            }
        }
    });

    assert.equal(point.matchedVolume, 100);
    assert.equal(point.validForDisplay, true);
    assert.equal(point.invalidVolume, false);
});

test('Test 5: rawMarketDelta < 0 (market decreased) → anomaly', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: -80,
        computedMarketDelta: -80,
        rawRunnerDelta: null,
        computedRunnerDelta: null,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: 'matched_total_decreased'
    });
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.anomaly, true);
});

test('Test 6: computedRunnerDelta < 0 (from matchedTotal diff) → anomaly', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 100,
        computedMarketDelta: 100,
        rawRunnerDelta: null,
        computedRunnerDelta: -500,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: null
    });
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.anomaly, true);
});

test('Test 7: normal valid tick → validForDisplay=true', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 500,
        computedMarketDelta: 500,
        rawRunnerDelta: 280,
        computedRunnerDelta: 280,
        classifiedVolume: 250,
        ladderTradedDelta: 260,
        reason: null
    });
    assert.equal(v.validForDisplay, true);
    assert.equal(v.invalidVolume, false);
    assert.equal(v.anomaly, false);
});


console.log('\n[Backend] calculateValidatedMoneyFlow — runner_delta_exceeds_market_delta\n');

const stubLadder = [{ price: 1.5, back: 100, lay: 80, traded: 1000 }];
const stubOpts = {
    currentLadderSource: 'graph_url',
    previousLadderSource: 'graph_url',
    currentLadder: stubLadder,
    previousLadder: [{ price: 1.5, back: 100, lay: 80, traded: 900 }],
    lastTradedPrice: 1.5,
    midPrice: 1.5
};

test('Test 8: marketDelta < 0 → matched_total_decreased', () => {
    const mf = calculateValidatedMoneyFlow({
        ...stubOpts,
        currentMarketTotal: 39062,
        previousMarketTotal: 39142, 
        currentRunnerMatched: 19531,
        previousRunnerMatched: 19531
    });
    assert.equal(mf.reason, 'matched_total_decreased');
    assert.equal(mf.back, 0);
    assert.equal(mf.lay, 0);
    assert.equal(mf.confidence, 'suppressed');
});

test('Test 9: runnerDelta < 0 → matched_total_decreased', () => {
    const mf = calculateValidatedMoneyFlow({
        ...stubOpts,
        currentMarketTotal: 39942,
        previousMarketTotal: 39062, 
        currentRunnerMatched: 7525,
        previousRunnerMatched: 19531 
    });
    assert.equal(mf.reason, 'matched_total_decreased');
    assert.equal(mf.back, 0);
    assert.equal(mf.lay, 0);
    assert.equal(mf.confidence, 'suppressed');
    assert.equal(mf.runnerDelta, -12006);
});

test('Test 10: runnerDelta(12886) > marketDelta(880) → runner_delta_exceeds_market_delta', () => {
    const mf = calculateValidatedMoneyFlow({
        ...stubOpts,
        currentMarketTotal: 39942,
        previousMarketTotal: 39062, 
        currentRunnerMatched: 32417,
        previousRunnerMatched: 19531 
    });
    assert.equal(mf.reason, 'runner_delta_exceeds_market_delta');
    assert.equal(mf.back, 0);
    assert.equal(mf.lay, 0);
    assert.equal(mf.confidence, 'suppressed');
});

test('Test 11: valid matching tick → confidence confirmed', () => {
    const mf = calculateValidatedMoneyFlow({
        ...stubOpts,
        currentMarketTotal: 40400,
        previousMarketTotal: 39942, 
        currentRunnerMatched: 19700,
        previousRunnerMatched: 19531,
        currentLadder: [{ price: 1.5, back: 100, lay: 80, traded: 1080 }],
        previousLadder: [{ price: 1.5, back: 100, lay: 80, traded: 1000 }]
    });
    assert.notEqual(mf.reason, 'matched_total_decreased');
    assert.notEqual(mf.reason, 'runner_delta_exceeds_market_delta');
    assert.equal(mf.confidence, 'confirmed');
});


console.log('\n[Frontend] buildSharedGrid / alignToGrid\n');

test('Frontend Test 1: always 20 slots — 6 + 15 timestamps', () => {
    const histA = Array.from({ length: 6 }, (_, i) => ({ timestamp: `10:0${i}:00` }));
    const histB = Array.from({ length: 15 }, (_, i) => ({ timestamp: `10:1${i}:00` }));
    const grid = buildSharedGrid({ A: histA, B: histB });
    assert.equal(grid.length, GRID_SIZE, `grid.length must be ${GRID_SIZE}`);
    const alignedA = alignToGrid(grid, histA);
    const alignedB = alignToGrid(grid, histB);
    assert.equal(alignedA.length, GRID_SIZE, 'alignedA must be 20');
    assert.equal(alignedB.length, GRID_SIZE, 'alignedB must be 20');
});

test('Frontend Test 2: empty slots padded at front', () => {
    const hist = [{ timestamp: '10:00:01' }, { timestamp: '10:00:02' }, { timestamp: '10:00:03' }];
    const grid = buildSharedGrid({ A: hist });
    assert.equal(grid.length, GRID_SIZE);
    const emptyCount = grid.filter(s => s.timestamp === '').length;
    assert.equal(emptyCount, GRID_SIZE - 3, `Must have ${GRID_SIZE - 3} empty slots`);
});

test('Frontend Test 3: timestamps sorted chronologically by localeCompare', () => {
    const hist = [
        { timestamp: '10:00:03' },
        { timestamp: '10:00:01' },
        { timestamp: '10:00:02' }
    ];
    const grid = buildSharedGrid({ A: hist });
    const realSlots = grid.filter(s => s.timestamp !== '');
    assert.equal(realSlots[0].timestamp, '10:00:01');
    assert.equal(realSlots[1].timestamp, '10:00:02');
    assert.equal(realSlots[2].timestamp, '10:00:03');
});

test('Frontend Test 4: anomaly point does not affect scale', () => {
    const hist = [
        { timestamp: '10:00:01', back: 200, lay: 0, unclassified: 0, suppressedVolume: 0, invalidVolume: true, anomaly: true, validForDisplay: false, rawRunnerMatchedDelta: 12886 },
        { timestamp: '10:00:02', back: 300, lay: 100, unclassified: 0, suppressedVolume: 0, invalidVolume: false, anomaly: false, validForDisplay: true }
    ];
    const grid = buildSharedGrid({ A: hist });
    const aligned = alignToGrid(grid, hist);
    let maxVal = 100;
    for (const pt of aligned) {
        if (pt.invalidVolume || pt.anomaly || pt.validForDisplay === false || pt.emptySlot) continue;
        maxVal = Math.max(maxVal, pt.back || 0, pt.lay || 0, pt.unclassified || 0, pt.suppressedVolume || 0);
    }
    assert.equal(maxVal, 300, 'Scale must be 300, not 12886 from the anomalous point');
});

test('Frontend Test 5: both runners always get exactly 20 aligned slots', () => {
    const histA = Array.from({ length: 12 }, (_, i) => ({ timestamp: `10:0${String(i).padStart(2,'0')}:00` }));
    const histB = Array.from({ length: 20 }, (_, i) => ({ timestamp: `10:0${String(i).padStart(2,'0')}:00` }));
    const grid = buildSharedGrid({ A: histA, B: histB });
    assert.equal(grid.length, GRID_SIZE);
    assert.equal(alignToGrid(grid, histA).length, GRID_SIZE);
    assert.equal(alignToGrid(grid, histB).length, GRID_SIZE);
});

test('Frontend Test 6: missing real slot gets emptySlot:true, not anomaly', () => {
    const histA = [{ timestamp: '10:00:01', back: 100, lay: 0, unclassified: 0, suppressedVolume: 0, invalidVolume: false, anomaly: false, validForDisplay: true }];
    const histB = [{ timestamp: '10:00:01', back: 50, lay: 0, unclassified: 0, suppressedVolume: 0, invalidVolume: false, anomaly: false, validForDisplay: true },
                   { timestamp: '10:00:02', back: 80, lay: 0, unclassified: 0, suppressedVolume: 0, invalidVolume: false, anomaly: false, validForDisplay: true }];
    const grid = buildSharedGrid({ A: histA, B: histB });
    const alignedA = alignToGrid(grid, histA);
    const missingSlot = alignedA.find(s => s.timestamp === '10:00:02');
    assert.ok(missingSlot, '10:00:02 slot must exist in aligned A');
    assert.equal(missingSlot.emptySlot, true, 'Missing real slot must have emptySlot:true');
    assert.equal(missingSlot.anomaly, false, 'Missing real slot must NOT be anomaly:true');
    assert.equal(missingSlot.invalidVolume, false, 'Missing real slot must NOT be invalidVolume:true');
    assert.equal(missingSlot.back, 0);
});

console.log('\n[Backend] validateMoneyFlowPoint — raw vs computed mismatch\n');

test('Test 12: runner raw/computed mismatch > 10% → runner_delta_raw_computed_mismatch', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 600,
        computedMarketDelta: 600,
        rawRunnerDelta: 500,
        computedRunnerDelta: 100,
        classifiedVolume: 50,
        ladderTradedDelta: null,
        reason: null
    });
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.reason, 'runner_delta_raw_computed_mismatch');
});

test('Test 13: market raw/computed mismatch > 10% → market_delta_raw_computed_mismatch', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 600,
        computedMarketDelta: 100,
        rawRunnerDelta: 200,
        computedRunnerDelta: 200,
        classifiedVolume: 100,
        ladderTradedDelta: null,
        reason: null
    });
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.reason, 'market_delta_raw_computed_mismatch');
});

test('Test 14: raw/computed within 10% tolerance → valid', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 400,
        computedMarketDelta: 402,
        rawRunnerDelta: 200,
        computedRunnerDelta: 195,
        classifiedVolume: 180,
        ladderTradedDelta: null,
        reason: null
    });
    assert.equal(v.validForDisplay, true);
    assert.equal(v.invalidVolume, false);
});

test('Test 15: mismatch check skipped when one side is null', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 400,
        computedMarketDelta: null,
        rawRunnerDelta: 200,
        computedRunnerDelta: null,
        classifiedVolume: 180,
        ladderTradedDelta: null,
        reason: null
    });
    assert.equal(v.validForDisplay, true);
    assert.equal(v.invalidVolume, false);
});



test('Test 16: raw=0 and computed>0 runner delta mismatch is invalid', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 20,
        computedMarketDelta: 20,
        rawRunnerDelta: 0,
        computedRunnerDelta: 20,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: null
    });

    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.anomaly, true);
    assert.equal(v.reason, 'runner_delta_raw_computed_mismatch');
});

test('Test 17: missing or non-graph ladder does not invalidate coherent dashboard volume', () => {
    const previousTick = {
        timestamp: '2026-06-24T20:00:00.000Z',
        data: {
            seq: 1,
            market: { totalMatched: 1000 },
            runners: [{ selectionId: 101, matchedTotal: 100 }]
        }
    };

    for (const ladderSource of [null, 'api']) {
        const point = buildMoneyFlowHistoryPoint({
            previousTick,
            tick: {
                timestamp: '2026-06-24T20:00:05.000Z',
                data: {
                    seq: 2,
                    market: { totalMatched: 1100 },
                    graphHealth: { status: 'ok' }
                }
            },
            runner: {
                selectionId: 101,
                matchedTotal: 200,
                ladderSource,
                moneyFlow: {
                    runnerDelta: 100,
                    marketDelta: 100,
                    back: 0,
                    lay: 0
                }
            }
        });

        assert.equal(point.matchedVolume, 100);
        assert.equal(point.validForDisplay, true);
        assert.equal(point.invalidVolume, false);
        assert.equal(point.anomaly, false);
    }
});


test('Test 18: rawRunnerDelta=0, computedRunnerDelta=1 → runner mismatch', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 1,
        computedMarketDelta: 1,
        rawRunnerDelta: 0,
        computedRunnerDelta: 1,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: null
    });

    assert.equal(v.reason, 'runner_delta_raw_computed_mismatch');
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.anomaly, true);
});

test('Test 19: rawRunnerDelta=1, computedRunnerDelta=0 → runner mismatch', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 1,
        computedMarketDelta: 1,
        rawRunnerDelta: 1,
        computedRunnerDelta: 0,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: null
    });

    assert.equal(v.reason, 'runner_delta_raw_computed_mismatch');
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.anomaly, true);
});

test('Test 20: rawMarketDelta=0, computedMarketDelta=1 → market mismatch', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 0,
        computedMarketDelta: 1,
        rawRunnerDelta: 1,
        computedRunnerDelta: 1,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: null
    });

    assert.equal(v.reason, 'market_delta_raw_computed_mismatch');
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.anomaly, true);
});

test('Test 21: rawMarketDelta=1, computedMarketDelta=0 → market mismatch', () => {
    const v = validateMoneyFlowPoint({
        rawMarketDelta: 1,
        computedMarketDelta: 0,
        rawRunnerDelta: 1,
        computedRunnerDelta: 1,
        classifiedVolume: 0,
        ladderTradedDelta: null,
        reason: null
    });

    assert.equal(v.reason, 'market_delta_raw_computed_mismatch');
    assert.equal(v.validForDisplay, false);
    assert.equal(v.invalidVolume, true);
    assert.equal(v.anomaly, true);
});

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('\nSome tests failed.');
    process.exit(1);
} else {
    console.log('\nAll tests passed.');
}
