import {
    buildSignificantMarketFlowEvidence,
    classifyAbsoluteFlowTier,
    classifyRelativeFlowTier,
    computeRecentMedianFlow,
    extractRunnerFlowAmount,
    computeMarketLiquiditySharePct
} from '../significantMarketFlowEvidence.js';
import {
    createAssertionSuite,
    NOW,
    makeTick
} from './significantMarketFlowEvidenceTestFixtures.mjs';

const { assert, finish } = createAssertionSuite('significantMarketFlowEvidence/liquidityAndSummary.test');

console.log('\n=== Test 18: liquidity ratio singolo ===');
{
                                                                                   
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 5000, mfBack: 1000, mfLay: 0, mfTrend: 'backing', runnerDelta: 1000, marketDelta: 1000
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('18: flow present', r.significantFlows.length >= 1);
    if (r.significantFlows.length >= 1) {
        const f = r.significantFlows[0];
        assert('18: marketLiquiditySharePct = 10', f.marketLiquiditySharePct === 10,
            `marketLiquiditySharePct=${f.marketLiquiditySharePct}`);
        assert('18: runnerLiquiditySharePct = 20', f.runnerLiquiditySharePct === 20,
            `runnerLiquiditySharePct=${f.runnerLiquiditySharePct}`);
    }
}

console.log('\n=== Test 20: latestSignificantFlow ===');
{
                                                                                     
    const ticks = [
        makeTick('2026-06-19T12:08:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10800, mfBack: 800, mfLay: 0, mfTrend: 'backing', runnerDelta: 800, marketDelta: 800
        }], 1),
        makeTick('2026-06-19T12:09:00.000Z', 10800, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 12500, mfBack: 1700, mfLay: 0, mfTrend: 'backing', runnerDelta: 1700, marketDelta: 1700
        }], 2)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('20: latestSignificantFlow not null', r.latestSignificantFlow !== null);
    if (r.latestSignificantFlow) {
        assert('20: latestSignificantFlow is the most recent (12:09)',
            r.latestSignificantFlow.timestamp === '2026-06-19T12:09:00.000Z',
            `timestamp=${r.latestSignificantFlow.timestamp}`);
    }
}

finish();
