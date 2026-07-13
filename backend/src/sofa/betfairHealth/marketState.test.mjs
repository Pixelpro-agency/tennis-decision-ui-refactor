import {
    isMarketOk,
    isFinished,
    inferSofaLive
} from './marketState.js';

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
    if (actual === expected) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]: expected ${expected}, received ${actual}`);
        failed++;
    }
}

console.log('\n=== marketState.test.mjs ===\n');

const validMarket = {
    event_status: { hasFinished: false },
    market: { totalMatched: 100 },
    runners: [{}]
};

assert('T01-market-null', isMarketOk(null), false);
assert('T02-market-no-runners', isMarketOk({
    market: { totalMatched: 100 },
    runners: []
}), false);
assert('T03-market-zero-matched', isMarketOk({
    market: { totalMatched: 0 },
    runners: [{}]
}), false);
assert('T04-market-finished', isMarketOk({
    event_status: { hasFinished: true },
    market: { totalMatched: 100 },
    runners: [{}]
}), false);
assert('T05-market-valid', isMarketOk(validMarket), true);

assert('T06-finished-true', isFinished({
    event_status: { hasFinished: true }
}), true);
assert('T07-finished-false', isFinished({
    event_status: { hasFinished: false }
}), false);
assert('T08-finished-null', isFinished(null), false);

const now = new Date('2026-06-22T12:00:30.000Z');

assert('T09-sofa-missing', inferSofaLive(null, now), null);
assert('T10-sofa-invalid-timestamp', inferSofaLive([{
    timestamp: 'invalid',
    data: { status: 'live' }
}], now), null);
assert('T11-sofa-live-array', inferSofaLive([{
    timestamp: '2026-06-22T12:00:25.000Z',
    data: { status: 'live' }
}], now), true);
assert('T12-sofa-live-wrapper', inferSofaLive({
    timeline: [{
        timestamp: '2026-06-22T12:00:25.000Z',
        data: { status: 'live' }
    }]
}, now), true);
assert('T13-sofa-stale', inferSofaLive([{
    timestamp: '2026-06-22T12:00:00.000Z',
    data: { status: 'live' }
}], now), false);
assert('T14-sofa-finished-string', inferSofaLive([{
    timestamp: '2026-06-22T12:00:25.000Z',
    data: { status: 'finished' }
}], now), false);
assert('T15-sofa-finished-object', inferSofaLive([{
    timestamp: '2026-06-22T12:00:25.000Z',
    data: { status: { completed: true } }
}], now), false);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
    throw new Error(`${failed} marketState assertions failed`);
}
