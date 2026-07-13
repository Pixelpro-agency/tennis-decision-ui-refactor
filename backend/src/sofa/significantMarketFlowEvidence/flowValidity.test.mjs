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

const { assert, finish } = createAssertionSuite('significantMarketFlowEvidence/flowValidity.test');

console.log('\n=== Test 8: volume invalidato da reason ===');
{
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 25000,
            mfBack: 0, mfLay: 0, runnerDelta: 15000, marketDelta: 100,
            mfReason: 'runner_delta_exceeds_market_delta', mfConfidence: 'suppressed'
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('8: significantFlows empty (invalidated)', r.significantFlows.length === 0,
        `length=${r.significantFlows.length}`);
    assert('8: invalidFlowCount >= 1', r.summary.invalidFlowCount >= 1,
        `invalidFlowCount=${r.summary.invalidFlowCount}`);
                                                                                             
    const runner = ticks[0].data.runners[0];
    const extracted = extractRunnerFlowAmount(runner, ticks[0].data);
    assert('8: anomaly true on extracted candidate (via reason)',
        extracted.mfReason === 'runner_delta_exceeds_market_delta');
}

console.log('\n=== Test 9: volume ambiguo ===');
{
                                                                                     
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 11000, mfBack: 0, mfLay: 0, runnerDelta: 1000, marketDelta: 1000
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('9: flow enters significantFlows (1000 >= 600)', r.significantFlows.length >= 1,
        `length=${r.significantFlows.length}`);
    if (r.significantFlows.length >= 1) {
        const f = r.significantFlows[0];
        assert('9: flowAmbiguous true', f.flowAmbiguous === true, String(f.flowAmbiguous));
        assert('9: directionAttributed false', f.directionAttributed === false, String(f.directionAttributed));
    }
}

console.log('\n=== Test 10: volume classificato back ===');
{
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10800, mfBack: 800, mfLay: 0, mfTrend: 'backing', runnerDelta: 800, marketDelta: 800
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('10: flow enters significantFlows', r.significantFlows.length >= 1);
    if (r.significantFlows.length >= 1) {
        const f = r.significantFlows[0];
        assert('10: direction back', f.direction === 'back', f.direction);
        assert('10: directionAttributed true', f.directionAttributed === true, String(f.directionAttributed));
    }
}

console.log('\n=== Test 11: volume classificato lay ===');
{
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10800, mfBack: 0, mfLay: 800, mfTrend: 'laying', runnerDelta: 800, marketDelta: 800
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('11: flow enters significantFlows', r.significantFlows.length >= 1);
    if (r.significantFlows.length >= 1) {
        const f = r.significantFlows[0];
        assert('11: direction lay', f.direction === 'lay', f.direction);
        assert('11: directionAttributed true', f.directionAttributed === true, String(f.directionAttributed));
    }
}

console.log('\n=== Test 12: runnerPriceRole ===');
{
                                                              
                                                       
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 20000, [
            {
                name: 'RunnerA', selectionId: 1, ltp: 1.50, bestBack: 1.49, bestLay: 1.51,
                matchedTotal: 12000, mfBack: 800, mfLay: 0, mfTrend: 'backing', runnerDelta: 800, marketDelta: 1400
            },
            {
                name: 'RunnerB', selectionId: 2, ltp: 3.00, bestBack: 2.98, bestLay: 3.02,
                matchedTotal: 8000, mfBack: 600, mfLay: 0, mfTrend: 'backing', runnerDelta: 600, marketDelta: 1400
            }
        ], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    const flowA = r.significantFlows.find(f => f.runner === 'RunnerA');
    const flowB = r.significantFlows.find(f => f.runner === 'RunnerB');

    assert('12: RunnerA (ltp=1.50) = shorter_priced_runner',
        flowA?.runnerPriceRole === 'shorter_priced_runner',
        `runnerA role = ${flowA?.runnerPriceRole}`);
    assert('12: RunnerB (ltp=3.00) = longer_priced_runner',
        flowB?.runnerPriceRole === 'longer_priced_runner',
        `runnerB role = ${flowB?.runnerPriceRole}`);
}

console.log('\n=== Test 13: bookTradable ===');
{
                                
    const ticks1 = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10800, mfBack: 800, mfLay: 0, runnerDelta: 800, marketDelta: 800
        }], 1)
    ];
    const r1 = buildSignificantMarketFlowEvidence({ betfairTicks: ticks1, now: NOW, config: { baselineLookbackTicks: 0 } });
    if (r1.significantFlows.length >= 1) {
        assert('13: bookTradable true when bestLay > bestBack', r1.significantFlows[0].bookTradable === true,
            String(r1.significantFlows[0].bookTradable));
    }

                                  
    const ticks2 = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 2.05, bestLay: 2.01,
            matchedTotal: 10800, mfBack: 800, mfLay: 0, runnerDelta: 800, marketDelta: 800
        }], 1)
    ];
    const r2 = buildSignificantMarketFlowEvidence({ betfairTicks: ticks2, now: NOW, config: { baselineLookbackTicks: 0 } });
    if (r2.significantFlows.length >= 1) {
        assert('13: bookTradable false when bestLay <= bestBack', r2.significantFlows[0].bookTradable === false,
            String(r2.significantFlows[0].bookTradable));
    }
}

console.log('\n=== Test 14: causalityClaimed sempre false ===');
{
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 12500, mfBack: 2500, mfLay: 0, mfTrend: 'backing', runnerDelta: 2500, marketDelta: 2500
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('14: has significantFlows', r.significantFlows.length >= 1);
    const allFalse = r.significantFlows.every(f => f.causalityClaimed === false);
    const allCorrectInterp = r.significantFlows.every(f => f.interpretation === 'exchange_activity_observed');
    assert('14: causalityClaimed false on every flow', allFalse);
    assert('14: interpretation exchange_activity_observed on every flow', allCorrectInterp);
}

console.log('\n=== Test 21: runnerDelta > marketDelta senza reason ===');
{
                                                                                      
                                                                   
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 11000, mfBack: 0, mfLay: 0, runnerDelta: 1000, marketDelta: 100,
            mfReason: null
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('21: not in significantFlows (invalidated by delta check)', r.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length === 0,
        `single_tick flows: ${r.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length}`);
    assert('21: invalidFlowCount >= 1', r.summary.invalidFlowCount >= 1, `invalidFlowCount=${r.summary.invalidFlowCount}`);
    assert('21: summary reasons include invalidation', r.summary.reasons.some(x => x.includes('invalidated')),
        JSON.stringify(r.summary.reasons));
}

console.log('\n=== Test 22: marketDelta negativo ===');
{
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10100, mfBack: 0, mfLay: 0, runnerDelta: 100, marketDelta: -10,
            mfReason: null
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('22: not in significantFlows (marketDelta < 0)', r.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length === 0,
        `single_tick flows: ${r.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length}`);
    assert('22: invalidFlowCount >= 1', r.summary.invalidFlowCount >= 1, `invalidFlowCount=${r.summary.invalidFlowCount}`);
}

console.log('\n=== Test 23: mixed non attribuisce direzione ===');
{
                                          
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 11000, mfBack: 500, mfLay: 500, mfTrend: 'neutral', runnerDelta: 1000, marketDelta: 1000
        }], 1)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    assert('23: flow enters significantFlows (1000 >= 600)', r.significantFlows.length >= 1, `length=${r.significantFlows.length}`);
    const f = r.significantFlows.find(s => s.sourceType === 'single_tick_flow');
    assert('23: direction = mixed', f?.direction === 'mixed', `direction=${f?.direction}`);
    assert('23: directionAttributed = false', f?.directionAttributed === false, `directionAttributed=${f?.directionAttributed}`);
    assert('23: flowAmbiguous = true', f?.flowAmbiguous === true, `flowAmbiguous=${f?.flowAmbiguous}`);
}

console.log('\n=== Test 26: config tolerance rispettata ===');
{
                                                                                                  
    const ticksA = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10100, mfBack: 80, mfLay: 0, runnerDelta: 100.02, marketDelta: 100,
            mfReason: null
        }], 1)
    ];
    const rA = buildSignificantMarketFlowEvidence({
        betfairTicks: ticksA, now: NOW,
        config: { baselineLookbackTicks: 0, tolerance: 0.01 }
    });
    assert('26A: invalidated with tolerance=0.01 (100.02 > 100.01)', rA.summary.invalidFlowCount >= 1,
        `invalidFlowCount=${rA.summary.invalidFlowCount}`);
    assert('26A: no single_tick_flow with tolerance=0.01',
        rA.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length === 0,
        `single_tick flows: ${rA.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length}`);

                                                                                                                      
                                                     
                                                                                
                                                                                         
                                                  
    const ticksB = [
        makeTick('2026-06-19T12:09:00.000Z', 100000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 100700, mfBack: 700, mfLay: 0, runnerDelta: 700.02, marketDelta: 700,
            mfReason: null
        }], 1)
    ];
                                                    
    const rB_strict = buildSignificantMarketFlowEvidence({
        betfairTicks: ticksB, now: NOW,
        config: { baselineLookbackTicks: 0, tolerance: 0.01 }
    });
    assert('26B strict: invalidated with tolerance=0.01 (700.02 > 700.01)',
        rB_strict.summary.invalidFlowCount >= 1,
        `invalidFlowCount=${rB_strict.summary.invalidFlowCount}`);

                                                                        
    const rB_loose = buildSignificantMarketFlowEvidence({
        betfairTicks: ticksB, now: NOW,
        config: { baselineLookbackTicks: 0, tolerance: 0.05 }
    });
    assert('26B loose: NOT invalidated with tolerance=0.05 (700.02 <= 700.05)',
        rB_loose.summary.invalidFlowCount === 0,
        `invalidFlowCount=${rB_loose.summary.invalidFlowCount}`);
    assert('26B loose: enters significantFlows',
        rB_loose.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length >= 1,
        `single_tick flows: ${rB_loose.significantFlows.filter(f => f.sourceType === 'single_tick_flow').length}`);
}

finish();
