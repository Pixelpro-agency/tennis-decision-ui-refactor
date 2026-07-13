import assert from 'node:assert/strict';
import {
    BETFAIR_STALE_AFTER_SEC,
    classifyBetfairSessionHealth
} from './statusClassification.js';

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

function run(overrides = {}) {
    const checks = {
        loginOk: true,
        graphUrlsOk: true,
        strategyDataOk: null
    };

    const input = {
        gh: { status: 'ok' },
        loginReqTick: null,
        finished: false,
        latestBetfairAgeSec: 5,
        latestUsableLadderAgeSec: 5,
        consecutiveNoLadderTicks: 0,
        cdpStatus: null,
        marketOk: true,
        ladderOk: true,
        networkErrorsRecent: 0,
        technicalErrorActive: false,
        lastTechnicalErrorReason: null,
        checks
    };

    Object.assign(input, overrides);

    return {
        result: classifyBetfairSessionHealth(input),
        checks
    };
}

console.log('\n=== statusClassification.test.mjs ===\n');

runTest('auth suspected remains red and alerting', () => {
    const { result, checks } = run({
        gh: { status: 'auth_suspected' }
    });

    assert.equal(result.status, 'red');
    assert.equal(result.alert, true);
    assert.equal(checks.loginOk, false);
    assert.equal(checks.graphUrlsOk, false);
    assert.equal(checks.strategyDataOk, false);
});

runTest('bad graph URL remains yellow without alert', () => {
    const { result, checks } = run({
        gh: { status: 'bad_graph_url' }
    });

    assert.equal(result.status, 'yellow');
    assert.equal(result.alert, false);
    assert.equal(checks.graphUrlsOk, false);
});

runTest('healthy sample is green', () => {
    const { result, checks } = run();

    assert.equal(result.status, 'green');
    assert.equal(result.label, 'OK');
    assert.equal(checks.strategyDataOk, true);
});

runTest('unknown graph state remains neutral without a yellow condition', () => {
    const { result, checks } = run({
        gh: { status: 'unknown' }
    });

    assert.equal(result.status, 'unknown');
    assert.equal(result.severity, 'neutral');
    assert.equal(checks.strategyDataOk, false);
});

runTest('45 seconds is not stale for age alone', () => {
    const { result, checks } = run({
        latestBetfairAgeSec: BETFAIR_STALE_AFTER_SEC,
        latestUsableLadderAgeSec: BETFAIR_STALE_AFTER_SEC
    });

    assert.equal(BETFAIR_STALE_AFTER_SEC, 45);
    assert.equal(result.status, 'green');
    assert.equal(checks.loginOk, true);
});

runTest('46 seconds is yellow stale', () => {
    const { result } = run({
        latestBetfairAgeSec: BETFAIR_STALE_AFTER_SEC + 1,
        latestUsableLadderAgeSec: BETFAIR_STALE_AFTER_SEC + 1
    });

    assert.equal(result.status, 'yellow');
    assert.equal(result.label, 'STALE');
    assert.equal(result.alert, false);
});

runTest('active technical error is degraded yellow without alert', () => {
    const { result, checks } = run({
        technicalErrorActive: true,
        lastTechnicalErrorReason: 'fetch_error: DNS lookup failed'
    });

    assert.equal(result.status, 'yellow');
    assert.equal(result.label, 'DEGRADED');
    assert.equal(result.alert, false);
    assert.equal(checks.loginOk, true);
    assert.match(result.reasons.join(' '), /fetch_error: DNS lookup failed/);
});

runTest('auth suspected has priority over active technical error', () => {
    const { result, checks } = run({
        gh: { status: 'auth_suspected' },
        technicalErrorActive: true,
        lastTechnicalErrorReason: 'fetch_error: DNS lookup failed'
    });

    assert.equal(result.status, 'red');
    assert.equal(result.alert, true);
    assert.equal(checks.loginOk, false);
});

runTest('stale age alone never makes login false', () => {
    const { result, checks } = run({
        latestBetfairAgeSec: 60,
        latestUsableLadderAgeSec: 60
    });

    assert.equal(result.status, 'yellow');
    assert.equal(checks.loginOk, true);
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} statusClassification assertions failed`);
}
