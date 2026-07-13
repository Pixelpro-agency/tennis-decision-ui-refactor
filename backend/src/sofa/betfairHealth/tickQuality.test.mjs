import {
    getValidBetfairTicks,
    getLatestValidBetfairTick,
    parseTimestamp,
    hasUsableLadder,
    getLatestUsableLadderTick,
    countConsecutiveNoLadderTicks,
    countUsableRunners,
    sumRecentNetworkErrors,
    countRecentTicks,
    ageInSeconds
} from './tickQuality.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

function makeTick(seq, timestamp, data = {}) {
    return {
        timestamp,
        data: {
            source: 'betfair',
            seq,
            diagnostics: {
                hasLadder: true,
                ladderRows: 1,
                networkCaptureSummary: { errors_count: 0 }
            },
            runners: [{
                ladder: [{ price: 1.9, back: 100, lay: 0, traded: 0 }]
            }],
            ...data
        }
    };
}

function noLadderTick(seq, timestamp, errors = 0) {
    return makeTick(seq, timestamp, {
        diagnostics: {
            hasLadder: false,
            ladderRows: 0,
            networkCaptureSummary: { errors_count: errors }
        },
        runners: []
    });
}

console.log('\n=== tickQuality.test.mjs ===\n');

{
    const validA = makeTick(1, '2026-06-22T12:00:00.000Z');
    const validB = makeTick(2, '2026-06-22T12:00:10.000Z');
    const timeline = {
        timeline: [
            validA,
            { timestamp: validA.timestamp, data: { source: 'sofa', seq: 3 } },
            { timestamp: validA.timestamp, data: { source: 'betfair', seq: '4' } },
            null,
            validB
        ]
    };

    const valid = getValidBetfairTicks(timeline);
    assert('T01-valid-tick-filter', valid.length === 2 && valid[0] === validA && valid[1] === validB);
    assert('T02-array-timeline', getValidBetfairTicks([validA]).length === 1);
    assert('T03-invalid-timeline', getValidBetfairTicks(null).length === 0);
    assert('T04-latest-valid', getLatestValidBetfairTick(timeline) === validB);
    assert('T05-latest-empty', getLatestValidBetfairTick([]) === null);
}

{
    const usable = makeTick(1, '2026-06-22T12:00:00.000Z');
    const emptyRows = makeTick(2, '2026-06-22T12:00:10.000Z', {
        diagnostics: { hasLadder: true, ladderRows: 1 },
        runners: [{ ladder: [{ price: 1.9, back: 0, lay: 0, traded: 0 }] }]
    });
    const missing = noLadderTick(3, '2026-06-22T12:00:20.000Z');

    assert('T06-usable-ladder', hasUsableLadder(usable.data) === true);
    assert('T07-empty-ladder-row', hasUsableLadder(emptyRows.data) === false);
    assert('T08-missing-ladder', hasUsableLadder(missing.data) === false);
    assert('T09-latest-usable', getLatestUsableLadderTick([usable, missing]) === usable);
    assert('T10-no-usable-tick', getLatestUsableLadderTick([missing]) === null);
}

{
    const usable = makeTick(1, '2026-06-22T12:00:00.000Z');
    const missingA = noLadderTick(2, '2026-06-22T12:00:10.000Z');
    const missingB = noLadderTick(3, '2026-06-22T12:00:20.000Z');

    assert('T11-consecutive-no-ladder', countConsecutiveNoLadderTicks([usable, missingA, missingB]) === 2);
    assert('T12-consecutive-with-latest-usable', countConsecutiveNoLadderTicks([missingA, usable]) === 0);

    const multiRunner = makeTick(4, '2026-06-22T12:00:30.000Z', {
        runners: [
            { ladder: [{ price: 1.9, back: 100 }] },
            { ladder: [{ price: 2.1, lay: 50 }] },
            { ladder: [{ price: 2.3, traded: 30 }] },
            { ladder: [{ price: 2.5, back: 0, lay: 0, traded: 0 }] }
        ]
    });

    assert('T13-usable-runner-count', countUsableRunners(multiRunner.data) === 3);
    assert('T14-usable-runner-invalid', countUsableRunners(null) === 0);
}

{
    const ticks = [
        noLadderTick(1, '2026-06-22T11:59:00.000Z', 9),
        noLadderTick(2, '2026-06-22T12:00:20.000Z', 1),
        noLadderTick(3, '2026-06-22T12:00:40.000Z', 2),
        noLadderTick(4, '2026-06-22T12:00:55.000Z', 3)
    ];
    const now = new Date('2026-06-22T12:01:00.000Z');

    assert('T15-recent-network-errors', sumRecentNetworkErrors(ticks) === 6);
    assert('T16-recent-tick-count', countRecentTicks(ticks, now, 45) === 3);
    assert('T17-invalid-timestamp-excluded', countRecentTicks([makeTick(5, 'invalid')], now, 60) === 0);
}

{
    assert('T18-parse-valid', parseTimestamp('2026-06-22T12:00:00.000Z') instanceof Date);
    assert('T19-parse-invalid', parseTimestamp('invalid') === null);
    assert('T20-age-clamped', ageInSeconds('2026-06-22T12:01:30.000Z', new Date('2026-06-22T12:01:00.000Z')) === 0);
    assert('T21-age-invalid', ageInSeconds('invalid', new Date()) === null);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) {
    throw new Error(`${failed} tickQuality assertions failed`);
}

console.log('\n=== Runtime volume checks ===\n');

{
    const { hasValidRunnerDelta, getLatestValidVolumeTick } = await import('./tickQuality.js');

    const validZeroDelta = {
        data: {
            runners: [{ moneyFlow: { runnerDelta: 0 } }]
        }
    };

    const invalidNegativeDelta = {
        data: {
            runners: [{ moneyFlow: { runnerDelta: -1 } }]
        }
    };

    const invalidMissingDelta = {
        data: {
            runners: [{}]
        }
    };

    if (!hasValidRunnerDelta(validZeroDelta.data)) {
        throw new Error('runnerDelta zero must be valid');
    }

    if (hasValidRunnerDelta(invalidNegativeDelta.data)) {
        throw new Error('negative runnerDelta must be invalid');
    }

    if (hasValidRunnerDelta(invalidMissingDelta.data)) {
        throw new Error('missing runnerDelta must be invalid');
    }

    const latest = getLatestValidVolumeTick([
        { timestamp: '2026-07-01T12:00:00.000Z', ...validZeroDelta },
        { timestamp: '2026-07-01T12:00:01.000Z', ...invalidNegativeDelta },
        { timestamp: '2026-07-01T12:00:02.000Z', ...invalidMissingDelta }
    ]);

    if (latest?.timestamp !== '2026-07-01T12:00:00.000Z') {
        throw new Error('latest valid volume tick must accept zero runnerDelta');
    }

    console.log('PASS runtime volume checks');
}
