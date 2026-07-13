import { buildInvalidBetfairMoveResult, buildValidBetfairMoveResult } from './resultBuilders.js';

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

function context(overrides = {}) {
    return {
        cur: {
            data: {
                seq: 7,
                graphHealth: { status: 'ok' }
            }
        },
        curRunner: {
            name: 'Runner',
            selectionId: 3,
            bestBack: 1.89,
            bestLay: 1.91,
            ladderSource: 'graph'
        },
        toPrice: 1.90,
        fromPrice: 2.00,
        priceSource: 'ltp',
        priceDelta: -0.1,
        priceDirection: 'shortening',
        timestamp: '2026-06-19T12:09:10.000Z',
        age: 50,
        runnerMatchedDelta: 30,
        marketMatchedDelta: 30,
        mf: { back: 30, lay: 0, trend: 'backing', confidence: 'confirmed' },
        mfReason: null,
        volumeValidationReasons: [],
        ...overrides
    };
}

console.log('\n=== resultBuilders.test.mjs ===\n');

{
    const result = buildInvalidBetfairMoveResult(context({
        curRunner: {
            name: 'Invalid',
            selectionId: 1,
            bestBack: 2.01,
            bestLay: 1.99,
            ladderSource: 'graph'
        },
        mfReason: 'matched_total_decreased',
        volumeValidationReasons: ['moneyFlow.reason invalidated: matched_total_decreased'],
        runnerMatchedDelta: -10,
        marketMatchedDelta: 20
    }));

    assert('T01-available', result.available === true);
    assert('T01-invalid-volume', result.invalidVolume === true && result.validVolume === false);
    assert('T01-anomaly', result.anomaly === true);
    assert('T01-zeroed-volume', result.classifiedVolume === 0 && result.unclassifiedVolume === 0 && result.suppressedVolume === 0);
    assert('T01-raw-deltas', result.rawRunnerMatchedDelta === -10 && result.rawMarketMatchedDelta === 20);
    assert('T01-reason', result.invalidReason === 'matched_total_decreased');
    assert('T01-not-tradable', result.bookTradable === false);
    assert('T01-gate-reason', result.reasons.includes('Volume invalidated by TotalMatched gate'));
}

{
    const result = buildValidBetfairMoveResult(context());

    assert('T02-available', result.available === true);
    assert('T02-valid-volume', result.validVolume === true && result.invalidVolume === false && result.anomaly === false);
    assert('T02-volume-breakdown', result.classifiedVolume === 30 && result.unclassifiedVolume === 0 && result.suppressedVolume === 0);
    assert('T02-attribution', result.directionAttributed === 'back' && result.directionReliable === true);
    assert('T02-flow', result.flowAmbiguous === false);
    assert('T02-confidence-medium', result.confidence === 'medium', result.confidence);
    assert('T02-book', result.bookTradable === true);
}

{
    const result = buildValidBetfairMoveResult(context({
        priceDelta: -0.2,
        mf: { back: 30, lay: 0, trend: 'backing', confidence: 'confirmed' }
    }));

    assert('T03-confidence-high', result.confidence === 'high', result.confidence);
}

{
    const result = buildValidBetfairMoveResult(context({
        mf: { back: 0, lay: 0, trend: 'neutral', confidence: 'suppressed' }
    }));

    assert('T04-suppressed-ambiguous', result.flowAmbiguous === true && result.directionReliable === false);
    assert('T04-suppressed-volume', result.suppressedVolume === 30, String(result.suppressedVolume));
    assert('T04-suppressed-reason', result.reasons.some(reason => reason.includes('suppressed')));
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
