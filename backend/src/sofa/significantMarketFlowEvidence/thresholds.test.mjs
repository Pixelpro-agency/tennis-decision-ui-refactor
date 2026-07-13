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

const { assert, finish } = createAssertionSuite('significantMarketFlowEvidence/thresholds.test');

console.log('\n=== Test 1: input vuoto ===');
{
    const r = buildSignificantMarketFlowEvidence();
    assert('1: available false', r.available === false, String(r.available));
    assert('1: significantFlows []', Array.isArray(r.significantFlows) && r.significantFlows.length === 0);
    assert('1: latestSignificantFlow null', r.latestSignificantFlow === null);
    assert('1: largeFlowDetected false', r.summary.largeFlowDetected === false);
    assert('1: reasons include "No Betfair ticks available"',
        r.summary.reasons.some(x => x.includes('No Betfair ticks available')),
        JSON.stringify(r.summary.reasons));
}

console.log('\n=== Test 2: volume sotto soglia (200) ===');
{
                                                                                           
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10200, mfBack: 200, mfLay: 0, runnerDelta: 200, marketDelta: 200
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW });
    assert('2: available true (ticks provided)', r.available === true);
    assert('2: absoluteFlowTier none for 200', classifyAbsoluteFlowTier(200) === 'none');
    assert('2: significantFlows empty (no baseline for relative)', r.significantFlows.length === 0,
        `length=${r.significantFlows.length}`);
}

console.log('\n=== Test 3: volume notable (600) ===');
{
                                                                   
                                                                      
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10600, mfBack: 600, mfLay: 0, runnerDelta: 600, marketDelta: 600
        }], 1)
    ];
                                                              
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('3: absoluteFlowTier notable for 600', classifyAbsoluteFlowTier(600) === 'notable');
    assert('3: flow enters significantFlows', r.significantFlows.length >= 1, `length=${r.significantFlows.length}`);
    if (r.significantFlows.length >= 1) {
        assert('3: absoluteFlowTier = notable', r.significantFlows[0].absoluteFlowTier === 'notable',
            r.significantFlows[0].absoluteFlowTier);
    }
}

console.log('\n=== Test 4: volume strong (1200) ===');
{
    assert('4: classifyAbsoluteFlowTier 1200 = strong', classifyAbsoluteFlowTier(1200) === 'strong');
    assert('4: classifyAbsoluteFlowTier 1199 = notable', classifyAbsoluteFlowTier(1199) === 'notable');
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 11200, mfBack: 1200, mfLay: 0, runnerDelta: 1200, marketDelta: 1200
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('4: flow enters significantFlows', r.significantFlows.length >= 1);
    if (r.significantFlows.length >= 1) {
        assert('4: absoluteFlowTier = strong', r.significantFlows[0].absoluteFlowTier === 'strong',
            r.significantFlows[0].absoluteFlowTier);
    }
}

console.log('\n=== Test 5: volume very_strong (2500) ===');
{
    assert('5: classifyAbsoluteFlowTier 2500 = very_strong', classifyAbsoluteFlowTier(2500) === 'very_strong');
    assert('5: classifyAbsoluteFlowTier 2499 = strong', classifyAbsoluteFlowTier(2499) === 'strong');
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 50000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 52500, mfBack: 2500, mfLay: 0, runnerDelta: 2500, marketDelta: 2500
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('5: flow enters significantFlows', r.significantFlows.length >= 1);
    if (r.significantFlows.length >= 1) {
        assert('5: absoluteFlowTier = very_strong', r.significantFlows[0].absoluteFlowTier === 'very_strong',
            r.significantFlows[0].absoluteFlowTier);
    }
}

console.log('\n=== Test 6: volume extreme (5000) ===');
{
    assert('6: classifyAbsoluteFlowTier 5000 = extreme', classifyAbsoluteFlowTier(5000) === 'extreme');
    assert('6: classifyAbsoluteFlowTier 4999 = very_strong', classifyAbsoluteFlowTier(4999) === 'very_strong');
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 100000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 105000, mfBack: 5000, mfLay: 0, runnerDelta: 5000, marketDelta: 5000
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('6: flow enters significantFlows', r.significantFlows.length >= 1);
    if (r.significantFlows.length >= 1) {
        assert('6: absoluteFlowTier = extreme', r.significantFlows[0].absoluteFlowTier === 'extreme',
            r.significantFlows[0].absoluteFlowTier);
    }
}

console.log('\n=== Test 7: volume relativo anomalo ===');
{
                                                                               
                                                                                
    const baselineTicks = Array.from({ length: 13 }, (_, i) =>
        makeTick(
            `2026-06-19T12:0${Math.floor(i / 10)}:${String(i % 60).padStart(2, '0')}.000Z`,
            10000 + i * 100,
            [{
                name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
                matchedTotal: 10100 + i * 100, mfBack: 100, mfLay: 0, runnerDelta: 100, marketDelta: 100
            }],
            i + 1
        )
    );

                                                                   
    const recentTick = makeTick('2026-06-19T12:09:50.000Z', 20000, [{
        name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
        matchedTotal: 20700, mfBack: 700, mfLay: 0, runnerDelta: 700, marketDelta: 700
    }], 14);

    const allTicks = [...baselineTicks, recentTick];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: allTicks, now: NOW });

                                                 
    const multiplier = 700 / 100;
    assert('7: relativeFlowTier unusual for multiplier 7',
        classifyRelativeFlowTier(multiplier) === 'unusual',
        `tier=${classifyRelativeFlowTier(multiplier)} multiplier=${multiplier}`);

                                                                                     
    assert('7: significantFlows has at least one entry', r.significantFlows.length >= 1,
        `length=${r.significantFlows.length}`);
                                                                           
    const singleFlow = r.significantFlows.find(
        f => f.sourceType === 'single_tick_flow' && f.timestamp === '2026-06-19T12:09:50.000Z'
    );
    assert('7: single_tick_flow for recent tick present', singleFlow != null,
        `flows: ${r.significantFlows.map(f => `${f.sourceType}@${f.timestamp}`).join(', ')}`);
    if (singleFlow) {
        assert('7: relativeFlowMultiplier approx 7', singleFlow.relativeFlowMultiplier !== null &&
            singleFlow.relativeFlowMultiplier >= 6 && singleFlow.relativeFlowMultiplier <= 8,
            `multiplier=${singleFlow.relativeFlowMultiplier}`);
        assert('7: relativeFlowTier unusual or extreme',
            singleFlow.relativeFlowTier === 'unusual' || singleFlow.relativeFlowTier === 'extreme',
            `tier=${singleFlow.relativeFlowTier}`);
    }
}

finish();
