import assert from 'node:assert/strict';
import { buildBetfairSessionHealth } from './betfairHealth.js';

let passed = 0;
let failed = 0;

function runTest(name, callback) {
    try {
        callback();
        console.log(`PASS ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error);
        failed += 1;
    }
}

function makeTick({
    timestamp,
    seq,
    usableLadder = true,
    runnerDelta = 0,
    graphStatus = 'ok'
}) {
    return {
        timestamp,
        data: {
            source: 'betfair',
            seq,
            market: { totalMatched: 100 },
            runners: [{
                ladder: usableLadder
                    ? [{ price: 2, back: 10, lay: 0, traded: 0 }]
                    : [],
                moneyFlow: { runnerDelta }
            }],
            diagnostics: {
                hasLadder: usableLadder,
                ladderRows: usableLadder ? 1 : 0,
                networkCaptureSummary: { errors_count: 0 }
            },
            graphHealth: { status: graphStatus },
            event_status: { hasFinished: false }
        }
    };
}

function healthFor(timeline, runtime, now) {
    return buildBetfairSessionHealth({
        betfairTimeline: timeline ? { timeline } : null,
        runtime,
        now: new Date(now)
    });
}

console.log('\n=== betfairHealth.test.mjs ===\n');

runTest('60 second canonical tick is stale even with graph health available', () => {
    const health = healthFor(
        [makeTick({
            timestamp: '2026-07-01T12:00:00.000Z',
            seq: 1
        })],
        null,
        '2026-07-01T12:01:00.000Z'
    );

    assert.equal(health.metrics.latestBetfairAgeSec, 60);
    assert.equal(health.status, 'yellow');
    assert.equal(health.label, 'STALE');
});

runTest('recent canonical tick with old ladder is degraded for ladder only', () => {
    const health = healthFor(
        [
            makeTick({
                timestamp: '2026-07-01T12:00:00.000Z',
                seq: 1,
                usableLadder: true
            }),
            makeTick({
                timestamp: '2026-07-01T12:00:55.000Z',
                seq: 2,
                usableLadder: false
            })
        ],
        null,
        '2026-07-01T12:01:00.000Z'
    );

    assert.equal(health.metrics.latestBetfairAgeSec, 5);
    assert.equal(health.metrics.latestUsableLadderAgeSec, 60);
    assert.equal(health.status, 'yellow');
    assert.match(health.message, /ladder stale/);
    assert.doesNotMatch(health.message, /canonical tick is delayed/);
});

runTest('recent successful scrape does not make an old canonical tick fresh', () => {
    const runtime = {
        lastScrapeAttemptAt: '2026-07-01T12:00:58.000Z',
        lastSuccessfulScrapeAt: '2026-07-01T12:00:57.000Z',
        lastTechnicalErrorAt: null,
        lastTechnicalErrorReason: null
    };

    const health = healthFor(
        [makeTick({
            timestamp: '2026-07-01T12:00:00.000Z',
            seq: 1
        })],
        runtime,
        '2026-07-01T12:01:00.000Z'
    );

    assert.equal(health.timestamps.lastSuccessfulScrapeAt, runtime.lastSuccessfulScrapeAt);
    assert.equal(health.metrics.latestBetfairAgeSec, 60);
    assert.equal(health.status, 'yellow');
});

runTest('missing timeline with active technical error is yellow retry-active', () => {
    const runtime = {
        lastScrapeAttemptAt: '2026-07-01T12:01:00.000Z',
        lastSuccessfulScrapeAt: null,
        lastTechnicalErrorAt: '2026-07-01T12:00:59.000Z',
        lastTechnicalErrorReason: 'fetch_error: DNS lookup failed'
    };

    const health = healthFor(null, runtime, '2026-07-01T12:01:00.000Z');

    assert.equal(health.status, 'yellow');
    assert.equal(health.label, 'DEGRADED');
    assert.equal(health.alert, false);
    assert.equal(health.metrics.technicalErrorActive, true);
    assert.match(health.message, /retry active/);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} betfairHealth assertions failed`);
}
