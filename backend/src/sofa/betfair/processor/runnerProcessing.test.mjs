import assert from 'node:assert/strict';
import { processBetfairRunnerState } from './runnerProcessing.js';

let passed = 0;
let failed = 0;

function test(name, run) {
    try {
        run();
        console.log(`PASS ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`FAIL ${name}`);
        console.error(error.stack || error.message);
        failed += 1;
    }
}

function buildRaw({
    name = 'Runner A',
    selectionId = 11,
    includeSelectionId = true,
    marketTotal = 1000,
    matchedTotal = 100,
    traded = 20
} = {}) {
    const runner = {
        name,
        ladder_source: 'graph_url',
        ladder: [{
            price: '2',
            back_available: '100',
            lay_available: '40',
            traded: String(traded)
        }],
        back: [{ price: '2', vol: '100' }],
        lay: [{ price: '2.02', vol: '40' }],
        state: {
            lastPriceTraded: '2',
            totalMatched: matchedTotal
        },
        matchedTotal,
        totalMatchedOnSelection: matchedTotal,
        market_graph: {}
    };

    if (includeSelectionId) {
        runner.selectionId = selectionId;
    }

    return {
        market_info: {
            total_matched: String(marketTotal)
        },
        runners: [runner]
    };
}

test('same selectionId with renamed runner continues money flow', () => {
    const marketState = new Map();

    processBetfairRunnerState({
        key: 'same-id',
        raw: buildRaw({
            name: 'Old Player Name',
            selectionId: 11,
            marketTotal: 1000,
            matchedTotal: 100,
            traded: 20
        }),
        marketState
    });

    const renamedRaw = buildRaw({
        name: 'New Player Name',
        selectionId: '11',
        marketTotal: 1100,
        matchedTotal: 120,
        traded: 40
    });

    processBetfairRunnerState({
        key: 'same-id',
        raw: renamedRaw,
        marketState
    });

    assert.equal(renamedRaw.runners[0].selectionId, '11');
    assert.equal(renamedRaw.runners[0].moneyFlow.reason, null);
    assert.equal(renamedRaw.runners[0].moneyFlow.confidence, 'confirmed');
    assert.equal(marketState.get('same-id').runners[0].name, 'New Player Name');
    assert.equal(marketState.get('same-id').runners[0].selectionId, '11');
});

test('different selectionId with same name does not inherit runner baseline', () => {
    const marketState = new Map();

    processBetfairRunnerState({
        key: 'different-id',
        raw: buildRaw({
            name: 'Same Name',
            selectionId: 11,
            marketTotal: 1000,
            matchedTotal: 100,
            traded: 20
        }),
        marketState
    });

    const changedIdentityRaw = buildRaw({
        name: 'Same Name',
        selectionId: 22,
        marketTotal: 1100,
        matchedTotal: 250,
        traded: 60
    });

    processBetfairRunnerState({
        key: 'different-id',
        raw: changedIdentityRaw,
        marketState
    });

    assert.equal(changedIdentityRaw.runners[0].moneyFlow.reason, 'previous_runner_not_found');
    assert.equal(changedIdentityRaw.runners[0].ladderFlow[0].backDelta, 0);
    assert.equal(changedIdentityRaw.runners[0].ladderFlow[0].layDelta, 0);
    assert.equal(marketState.get('different-id').runners[0].selectionId, '22');
    assert.equal(marketState.get('different-id').runners[0].matchedTotal, 250);
});

test('missing selectionId with same name does not inherit runner baseline', () => {
    const marketState = new Map();

    processBetfairRunnerState({
        key: 'missing-id',
        raw: buildRaw({
            name: 'Same Name',
            selectionId: '11',
            marketTotal: 1000,
            matchedTotal: 100,
            traded: 20
        }),
        marketState
    });

    const missingIdRaw = buildRaw({
        name: 'Same Name',
        includeSelectionId: false,
        marketTotal: 1100,
        matchedTotal: 250,
        traded: 60
    });

    processBetfairRunnerState({
        key: 'missing-id',
        raw: missingIdRaw,
        marketState
    });

    assert.equal(missingIdRaw.runners[0].moneyFlow.reason, 'previous_runner_not_found');
    assert.equal(missingIdRaw.runners[0].ladderFlow[0].backDelta, 0);
    assert.equal(missingIdRaw.runners[0].ladderFlow[0].layDelta, 0);
    assert.equal(missingIdRaw.runners[0].matchedTotal, 250);
    assert.equal(missingIdRaw.runners[0].totalMatchedOnSelection, 250);
    assert.equal(missingIdRaw.runners[0].ladder[0].traded, 60);
    assert.equal(marketState.get('missing-id').runners[0].selectionId, null);
    assert.equal(marketState.get('missing-id').runners[0].matchedTotal, 250);
    assert.equal(marketState.get('missing-id').runners[0].ladder[0].traded, 60);
});

test('regressive sample is rejected and leaves marketState unchanged', () => {
    const marketState = new Map();

    processBetfairRunnerState({
        key: 'regressive',
        raw: buildRaw({
            selectionId: 11,
            marketTotal: 1000,
            matchedTotal: 100,
            traded: 20
        }),
        marketState
    });

    const baseline = JSON.stringify(marketState.get('regressive'));
    const regressiveRaw = buildRaw({
        selectionId: 11,
        marketTotal: 990,
        matchedTotal: 90,
        traded: 10
    });

    processBetfairRunnerState({
        key: 'regressive',
        raw: regressiveRaw,
        marketState
    });

    assert.equal(regressiveRaw.timelineIntegrity.accepted, false);
    assert.equal(regressiveRaw.timelineIntegrity.reason, 'regressive_sample');
    assert.ok(regressiveRaw.timelineIntegrity.reasons.includes('market_total_matched_decreased'));
    assert.equal(JSON.stringify(marketState.get('regressive')), baseline);
    assert.equal(regressiveRaw.technicalFailure, undefined);
});

console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
}
