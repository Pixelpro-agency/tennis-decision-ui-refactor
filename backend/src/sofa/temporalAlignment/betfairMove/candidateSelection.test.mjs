import { selectBestBetfairMoveCandidate } from './candidateSelection.js';

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

function tick(totalMatched, runners) {
    return {
        data: {
            market: { totalMatched },
            runners
        }
    };
}

function runner({
    name,
    selectionId,
    lastTradedPrice,
    bestBack,
    bestLay,
    matchedTotal,
    moneyFlow
}) {
    return {
        name,
        selectionId,
        lastTradedPrice,
        bestBack,
        bestLay,
        matchedTotal,
        moneyFlow
    };
}

console.log('\n=== candidateSelection.test.mjs ===\n');

{
    assert('T01-null-current', selectBestBetfairMoveCandidate(null, {}) === null);
    assert('T01-null-previous', selectBestBetfairMoveCandidate({}, null) === null);
}

{
    const previous = tick(1000, [
        runner({ name: 'Alpha', selectionId: 1, lastTradedPrice: 2.00, bestBack: 1.99, bestLay: 2.01, matchedTotal: 500 }),
        runner({ name: 'Beta', selectionId: 2, lastTradedPrice: 3.00, bestBack: 2.99, bestLay: 3.01, matchedTotal: 500 })
    ]);
    const current = tick(1100, [
        runner({
            name: 'Alpha',
            selectionId: 1,
            lastTradedPrice: 1.90,
            bestBack: 1.89,
            bestLay: 1.91,
            matchedTotal: 580,
            moneyFlow: { back: 80, lay: 0, runnerDelta: 80, marketDelta: 100, confidence: 'confirmed', reason: null }
        }),
        runner({
            name: 'Beta',
            selectionId: 2,
            lastTradedPrice: 2.98,
            bestBack: 2.97,
            bestLay: 2.99,
            matchedTotal: 520,
            moneyFlow: { back: 20, lay: 0, runnerDelta: 20, marketDelta: 100, confidence: 'confirmed', reason: null }
        })
    ]);

    const result = selectBestBetfairMoveCandidate(current, previous);
    assert('T02-result', result !== null);
    assert('T02-market-delta', result?.marketMatchedDelta === 100, String(result?.marketMatchedDelta));
    assert('T02-best-runner', result?.bestCandidate.curRunner.name === 'Alpha', result?.bestCandidate.curRunner.name);
    assert('T02-price-delta', result?.bestCandidate.priceDelta === -0.1, String(result?.bestCandidate.priceDelta));
    assert('T02-valid-volume', result?.bestCandidate.volumeInvalidated === false, String(result?.bestCandidate.volumeInvalidated));
}

{
    const previous = tick(1000, [
        runner({ name: 'ByName', selectionId: null, lastTradedPrice: 2.00, bestBack: 1.99, bestLay: 2.01, matchedTotal: 500 })
    ]);
    const current = tick(1030, [
        runner({
            name: 'ByName',
            selectionId: null,
            lastTradedPrice: 1.95,
            bestBack: 1.94,
            bestLay: 1.96,
            matchedTotal: 530,
            moneyFlow: { back: 30, lay: 0, runnerDelta: 30, marketDelta: 30, confidence: 'confirmed', reason: null }
        })
    ]);

    const result = selectBestBetfairMoveCandidate(current, previous);
    assert('T03-name-fallback', result?.bestCandidate.curRunner.name === 'ByName', result?.bestCandidate.curRunner.name);
    assert('T03-name-fallback-delta', result?.bestCandidate.runnerMatchedDelta === 30, String(result?.bestCandidate.runnerMatchedDelta));
}

{
    const previous = tick(1000, [
        runner({ name: 'InvalidButPrice', selectionId: 1, lastTradedPrice: 2.00, bestBack: 1.99, bestLay: 2.01, matchedTotal: 500 })
    ]);
    const current = tick(1100, [
        runner({
            name: 'InvalidButPrice',
            selectionId: 1,
            lastTradedPrice: 1.80,
            bestBack: 1.79,
            bestLay: 1.81,
            matchedTotal: 600,
            moneyFlow: { back: 0, lay: 0, runnerDelta: -10, marketDelta: 100, confidence: 'suppressed', reason: 'matched_total_decreased' }
        })
    ]);

    const result = selectBestBetfairMoveCandidate(current, previous);
    assert('T04-price-candidate-kept', result?.bestCandidate.curRunner.name === 'InvalidButPrice', result?.bestCandidate.curRunner.name);
    assert('T04-volume-invalidated', result?.bestCandidate.volumeInvalidated === true, String(result?.bestCandidate.volumeInvalidated));
    assert('T04-invalid-reason', result?.bestCandidate.mfReason === 'matched_total_decreased', result?.bestCandidate.mfReason);
}

{
    const previous = tick(1000, [
        runner({ name: 'InvalidOnly', selectionId: 1, lastTradedPrice: 2.00, bestBack: 1.99, bestLay: 2.01, matchedTotal: 500 }),
        runner({ name: 'ValidMove', selectionId: 2, lastTradedPrice: 1.50, bestBack: 1.49, bestLay: 1.51, matchedTotal: 500 })
    ]);
    const current = tick(1100, [
        runner({
            name: 'InvalidOnly',
            selectionId: 1,
            lastTradedPrice: 2.00,
            bestBack: 1.99,
            bestLay: 2.01,
            matchedTotal: 600,
            moneyFlow: { back: 0, lay: 0, runnerDelta: -10, marketDelta: 100, confidence: 'suppressed', reason: 'matched_total_decreased' }
        }),
        runner({
            name: 'ValidMove',
            selectionId: 2,
            lastTradedPrice: 1.40,
            bestBack: 1.39,
            bestLay: 1.41,
            matchedTotal: 520,
            moneyFlow: { back: 20, lay: 0, runnerDelta: 20, marketDelta: 100, confidence: 'confirmed', reason: null }
        })
    ]);

    const result = selectBestBetfairMoveCandidate(current, previous);
    assert('T05-invalid-no-price-rejected', result?.bestCandidate.curRunner.name === 'ValidMove', result?.bestCandidate.curRunner.name);
    assert('T05-valid-candidate', result?.bestCandidate.volumeInvalidated === false, String(result?.bestCandidate.volumeInvalidated));
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
