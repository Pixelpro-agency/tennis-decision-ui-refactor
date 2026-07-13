import {
    PRICE_MOVE_THRESHOLD,
    BETFAIR_LOOKBACK_MAX,
    isInvalidMoneyFlowReason,
    parseTs,
    ageSec,
    roundN,
    extractRunnerPrice,
    isBookTradable
} from './primitives.js';

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

console.log('\n=== primitives.test.mjs ===\n');

{
    assert('T01-price-threshold', PRICE_MOVE_THRESHOLD === 0.01);
    assert('T01-lookback-max', BETFAIR_LOOKBACK_MAX === 20);
}

{
    assert('T02-invalid-reason-known', isInvalidMoneyFlowReason('matched_total_decreased') === true);
    assert('T02-invalid-reason-unknown', isInvalidMoneyFlowReason('other') === false);
    assert('T02-invalid-reason-null', isInvalidMoneyFlowReason(null) === false);
}

{
    const now = new Date('2026-06-19T12:10:00.000Z');
    assert('T03-parse-valid', parseTs('2026-06-19T12:09:30.000Z')?.toISOString() === '2026-06-19T12:09:30.000Z');
    assert('T03-parse-invalid', parseTs('invalid') === null);
    assert('T03-age', ageSec('2026-06-19T12:09:30.000Z', now) === 30);
    assert('T03-age-future-clamped', ageSec('2026-06-19T12:10:30.000Z', now) === 0);
}

{
    assert('T04-round', roundN(1.23456, 3) === 1.235);
    assert('T04-round-invalid', roundN(Number.NaN, 2) === null);
}

{
    const ltp = extractRunnerPrice({ lastTradedPrice: 1.91, bestBack: 1.90, bestLay: 1.92 });
    const mid = extractRunnerPrice({ bestBack: 1.90, bestLay: 1.92 });
    const back = extractRunnerPrice({ bestBack: 1.90 });
    const lay = extractRunnerPrice({ bestLay: 1.92 });
    const unavailable = extractRunnerPrice(null);
    assert('T05-ltp', ltp.price === 1.91 && ltp.source === 'ltp', JSON.stringify(ltp));
    assert('T05-mid', mid.price === 1.91 && mid.source === 'mid', JSON.stringify(mid));
    assert('T05-back', back.price === 1.90 && back.source === 'book_back', JSON.stringify(back));
    assert('T05-lay', lay.price === 1.92 && lay.source === 'book_lay', JSON.stringify(lay));
    assert('T05-unavailable', unavailable.price === null && unavailable.source === 'unavailable', JSON.stringify(unavailable));
}

{
    assert('T06-tradable', isBookTradable({ bestBack: 1.90, bestLay: 1.92 }) === true);
    assert('T06-closed-spread', isBookTradable({ bestBack: 1.92, bestLay: 1.90 }) === false);
    assert('T06-zero-price', isBookTradable({ bestBack: 0, bestLay: 1.92 }) === false);
    assert('T06-null', isBookTradable(null) === false);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
