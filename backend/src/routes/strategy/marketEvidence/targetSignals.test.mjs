import assert from 'node:assert/strict';
import { buildTargetSignals } from './targetSignals.js';

function runner(overrides = {}) {
    return {
        name: 'Target Runner',
        matchedTotal: 0,
        ladder: [],
        wom: 0.5,
        moneyFlow: { trend: 'neutral' },
        ...overrides
    };
}

function tick(matchedTotal) {
    return {
        data: {
            runners: [runner({ matchedTotal })]
        }
    };
}

function build(overrides = {}) {
    const warnings = [];
    const firstTargetRunner = overrides.firstTargetRunner || runner({
        lastTradedPrice: 2,
        matchedTotal: 10
    });
    const priceRunner = overrides.priceRunner || runner({
        lastTradedPrice: 1.9,
        matchedTotal: 30
    });
    const ladderRunner = overrides.ladderRunner || priceRunner;
    const moneyFlowRunner = overrides.moneyFlowRunner || runner({
        wom: 0.7,
        moneyFlow: { trend: 'backing' }
    });

    const result = buildTargetSignals({
        warnings,
        targetSofaName: 'Target Runner',
        priceRunner,
        ladderRunner,
        moneyFlowRunner,
        firstTargetRunner,
        hasMoneyFlow: overrides.hasMoneyFlow ?? true,
        hasPrices: overrides.hasPrices ?? true,
        window: overrides.window || [tick(10), tick(20), tick(30)]
    });

    return { result, warnings };
}

const ltp = build({
    ladderRunner: runner({
        ladder: [{ back: 30, lay: 10 }, { back: 20, lay: 10 }, { back: 10, lay: 10 }]
    })
});
assert.ok(Math.abs(ltp.result.priceDelta + 0.1) < 1e-10, 'LTP price delta');
assert.equal(ltp.result.priceUsedForDelta, 'lastTradedPrice', 'LTP source');
assert.equal(ltp.result.lastMatchedTotal, 30, 'last matched total');
assert.equal(ltp.result.matchedDelta, 20, 'matched delta');
assert.equal(ltp.result.backTop3, 60, 'top-3 back liquidity');
assert.equal(ltp.result.liquidityLabel, 'back-heavy', 'top-3 liquidity label');
assert.equal(ltp.result.pressureSide, 'back', 'positive pressure side');

const fallback = build({
    firstTargetRunner: runner({ bestLay: 2.2, matchedTotal: 10 }),
    priceRunner: runner({ bestLay: 2, matchedTotal: 10 })
});
assert.ok(Math.abs(fallback.result.priceDelta + 0.2) < 1e-10, 'fallback price delta');
assert.equal(fallback.result.priceUsedForDelta, 'bestLay/bestBack fallback', 'fallback source');
assert.deepEqual(
    fallback.warnings,
    ['LTP missing, priceDelta computed from bestLay/bestBack fallback'],
    'fallback warning'
);

const noPrice = build({
    firstTargetRunner: runner({ matchedTotal: 10 }),
    priceRunner: runner({ matchedTotal: 10 })
});
assert.equal(noPrice.result.priceDelta, 0, 'no-price delta default');
assert.deepEqual(
    noPrice.warnings,
    ['Unable to compute priceDelta: no price data'],
    'no-price warning'
);

const insufficientVolume = build({
    window: [tick(10)]
});
assert.deepEqual(
    insufficientVolume.result.volumeAcceleration,
    { value: 0, label: 'flat' },
    'insufficient volume'
);

const emptyLadder = build({
    ladderRunner: runner({ ladder: [] })
});
assert.equal(emptyLadder.result.liquidityTotal, 0, 'empty ladder total');
assert.equal(emptyLadder.result.imbalance, 0, 'empty ladder imbalance');
assert.equal(emptyLadder.result.liquidityLabel, 'unavailable', 'empty ladder label');

const weakMoneyFlow = build({
    hasMoneyFlow: false
});
assert.equal(weakMoneyFlow.result.pressureSide, 'neutral', 'missing money flow side');
assert.equal(weakMoneyFlow.result.pressureLabel, 'market data weak', 'missing money flow label');

const negative = build({
    firstTargetRunner: runner({ lastTradedPrice: 2, matchedTotal: 10 }),
    priceRunner: runner({ lastTradedPrice: 2.1, matchedTotal: 10 }),
    moneyFlowRunner: runner({ wom: 0.3, moneyFlow: { trend: 'laying' } })
});
assert.equal(negative.result.pressureSide, 'lay', 'negative pressure side');
assert.equal(negative.result.pressureScore, -70, 'negative pressure score');

const neutral = build({
    firstTargetRunner: runner({ lastTradedPrice: 2, matchedTotal: 10 }),
    priceRunner: runner({ lastTradedPrice: 2, matchedTotal: 10 }),
    moneyFlowRunner: runner({ wom: 0.5, moneyFlow: { trend: 'neutral' } })
});
assert.equal(neutral.result.pressureSide, 'neutral', 'neutral pressure side');
assert.equal(neutral.result.pressureScore, 0, 'neutral pressure score');
assert.equal(neutral.result.pressureLabel, 'mixed market pressure', 'neutral pressure label');

console.log('targetSignals: 24 assertions passed');