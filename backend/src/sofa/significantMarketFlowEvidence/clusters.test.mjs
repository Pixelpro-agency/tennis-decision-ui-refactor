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

const { assert, finish } = createAssertionSuite('significantMarketFlowEvidence/clusters.test');

console.log('\n=== Test 15: cluster di 3 tick sotto soglia ===');
{
                                                                          
                                                                   
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10300, mfBack: 300, mfLay: 0, mfTrend: 'backing', runnerDelta: 300, marketDelta: 300
        }], 1),
        makeTick('2026-06-19T12:09:05.000Z', 10300, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10550, mfBack: 250, mfLay: 0, mfTrend: 'backing', runnerDelta: 250, marketDelta: 250
        }], 2),
        makeTick('2026-06-19T12:09:10.000Z', 10550, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 11050, mfBack: 500, mfLay: 0, mfTrend: 'backing', runnerDelta: 500, marketDelta: 500
        }], 3)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });

    const cluster = r.significantFlows.find(f => f.sourceType === 'flow_cluster');
    assert('15: cluster present in significantFlows', cluster != null,
        `flows: ${r.significantFlows.map(f => f.sourceType).join(',')}`);
    if (cluster) {
        assert('15: clusterTotalAmount = 1050', cluster.clusterTotalAmount === 1050,
            `clusterTotalAmount=${cluster.clusterTotalAmount}`);
        assert('15: sourceType flow_cluster', cluster.sourceType === 'flow_cluster');
        assert('15: clusterSize >= 2', cluster.clusterSize >= 2, `clusterSize=${cluster.clusterSize}`);
        assert('15: causalityClaimed false on cluster', cluster.causalityClaimed === false);
    }
}

console.log('\n=== Test 16: cluster non valido se runner diverso ===');
{
                                                                    
                                                                           
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [
            { name: 'RunnerA', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01, matchedTotal: 10300, mfBack: 300, mfLay: 0, runnerDelta: 300, marketDelta: 300 },
            { name: 'RunnerB', selectionId: 2, ltp: 3.0, bestBack: 2.98, bestLay: 3.02, matchedTotal: 5000, mfBack: 0, mfLay: 0, runnerDelta: 0, marketDelta: 300 }
        ], 1),
        makeTick('2026-06-19T12:09:05.000Z', 10300, [
            { name: 'RunnerA', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01, matchedTotal: 10300, mfBack: 0, mfLay: 0, runnerDelta: 0, marketDelta: 250 },
            { name: 'RunnerB', selectionId: 2, ltp: 3.0, bestBack: 2.98, bestLay: 3.02, matchedTotal: 5250, mfBack: 250, mfLay: 0, runnerDelta: 250, marketDelta: 250 }
        ], 2),
        makeTick('2026-06-19T12:09:10.000Z', 10550, [
            { name: 'RunnerA', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01, matchedTotal: 11050, mfBack: 500, mfLay: 0, runnerDelta: 500, marketDelta: 500 },
            { name: 'RunnerB', selectionId: 2, ltp: 3.0, bestBack: 2.98, bestLay: 3.02, matchedTotal: 5250, mfBack: 0, mfLay: 0, runnerDelta: 0, marketDelta: 500 }
        ], 3)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });

                                                  
    const mixedClusters = r.significantFlows.filter(f =>
        f.sourceType === 'flow_cluster' && f.clusterTotalAmount === 1050
    );
    assert('16: no cluster totalling 1050 from mixed runners', mixedClusters.length === 0,
        `found clusters: ${JSON.stringify(mixedClusters.map(c => ({ r: c.runner, amt: c.clusterTotalAmount })))}`);
}

console.log('\n=== Test 17: cluster non deve sommare volume invalidato ===');
{
                                                                                 
                                                         
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10300, mfBack: 300, mfLay: 0, runnerDelta: 300, marketDelta: 300
        }], 1),
        makeTick('2026-06-19T12:09:05.000Z', 10300, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 20000,
            mfBack: 0, mfLay: 0, runnerDelta: 9700, marketDelta: 300,
            mfReason: 'runner_delta_exceeds_market_delta', mfConfidence: 'suppressed'
        }], 2),
        makeTick('2026-06-19T12:09:10.000Z', 10600, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 20200, mfBack: 200, mfLay: 0, runnerDelta: 200, marketDelta: 200
        }], 3)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });

    const clusterWith900 = r.significantFlows.filter(f =>
        f.sourceType === 'flow_cluster' && (f.clusterTotalAmount ?? 0) >= 600
    );
    assert('17: no cluster >= 600 when valid total is only 500',
        clusterWith900.length === 0,
        `found: ${JSON.stringify(clusterWith900.map(c => c.clusterTotalAmount))}`);
    assert('17: invalidFlowCount includes invalidated tick', r.summary.invalidFlowCount >= 1,
        `invalidFlowCount=${r.summary.invalidFlowCount}`);
}

console.log('\n=== Test 19: liquidity ratio cluster ===');
{
                                                                    
                                                                      
                                              
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 20300, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 5250, mfBack: 350, mfLay: 0, runnerDelta: 350, marketDelta: 350
        }], 1),
        makeTick('2026-06-19T12:09:05.000Z', 20650, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 5250, mfBack: 350, mfLay: 0, runnerDelta: 350, marketDelta: 350
        }], 2),
        makeTick('2026-06-19T12:09:10.000Z', 21000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 5250, mfBack: 350, mfLay: 0, runnerDelta: 350, marketDelta: 350
        }], 3)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    const cluster = r.significantFlows.find(f => f.sourceType === 'flow_cluster');
    assert('19: cluster present', cluster != null,
        `flows: ${r.significantFlows.map(f => `${f.sourceType}:${f.observedFlowAmount}`).join(', ')}`);
    if (cluster) {
        assert('19: clusterTotalAmount = 1050', cluster.clusterTotalAmount === 1050,
            `clusterTotalAmount=${cluster.clusterTotalAmount}`);
                                 
        assert('19: clusterMarketLiquiditySharePct = 5',
            cluster.clusterMarketLiquiditySharePct === 5,
            `clusterMarketLiquiditySharePct=${cluster.clusterMarketLiquiditySharePct}`);
                                 
        assert('19: clusterRunnerLiquiditySharePct = 20',
            cluster.clusterRunnerLiquiditySharePct === 20,
            `clusterRunnerLiquiditySharePct=${cluster.clusterRunnerLiquiditySharePct}`);
    }
}

console.log('\n=== Test 24: cluster interrotto da tick zero ===');
{
                                                                    
                                                               
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10300, mfBack: 300, mfLay: 0, runnerDelta: 300, marketDelta: 300
        }], 1),
        makeTick('2026-06-19T12:09:05.000Z', 10300, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10300, mfBack: 0, mfLay: 0, runnerDelta: 0, marketDelta: 0
        }], 2),
        makeTick('2026-06-19T12:09:10.000Z', 10800, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 11300, mfBack: 500, mfLay: 0, runnerDelta: 500, marketDelta: 500
        }], 3)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    const clusterWith800 = r.significantFlows.filter(f =>
        f.sourceType === 'flow_cluster' && (f.clusterTotalAmount ?? 0) >= 700
    );
    assert('24: no cluster >= 700 spanning tick-zero gap', clusterWith800.length === 0,
        `found: ${JSON.stringify(clusterWith800.map(c => c.clusterTotalAmount))}`);

                                                                              
    const ticks2 = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10300, mfBack: 300, mfLay: 0, runnerDelta: 300, marketDelta: 300
        }], 1),
        makeTick('2026-06-19T12:09:05.000Z', 10300, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 11100, mfBack: 800, mfLay: 0, runnerDelta: 800, marketDelta: 800
        }], 2)
    ];
    const r2 = buildSignificantMarketFlowEvidence({ betfairTicks: ticks2, now: NOW, config: { baselineLookbackTicks: 0 } });
    const cluster1100 = r2.significantFlows.find(f => f.sourceType === 'flow_cluster' && f.clusterTotalAmount === 1100);
    assert('24: consecutive 300+800 creates flow_cluster with 1100', cluster1100 != null,
        `flows: ${r2.significantFlows.map(f => `${f.sourceType}:${f.observedFlowAmount}`).join(', ')}`);
    if (cluster1100) {
        assert('24: clusterSize = 2', cluster1100.clusterSize === 2, `clusterSize=${cluster1100.clusterSize}`);
        assert('24: clusterTotalAmount = 1100', cluster1100.clusterTotalAmount === 1100, `clusterTotalAmount=${cluster1100.clusterTotalAmount}`);
    }
}

console.log('\n=== Test 25: cluster mixed direction non attribuita ===');
{
                                                                             
    const ticks = [
        makeTick('2026-06-19T12:09:00.000Z', 10000, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10300, mfBack: 300, mfLay: 0, mfTrend: 'backing', runnerDelta: 300, marketDelta: 300
        }], 1),
        makeTick('2026-06-19T12:09:05.000Z', 10300, [{
            name: 'Runner', selectionId: 1, ltp: 2.0, bestBack: 1.99, bestLay: 2.01,
            matchedTotal: 10650, mfBack: 0, mfLay: 350, mfTrend: 'laying', runnerDelta: 350, marketDelta: 350
        }], 2)
    ];
    const r = buildSignificantMarketFlowEvidence({ betfairTicks: ticks, now: NOW, config: { baselineLookbackTicks: 0 } });
    const cluster = r.significantFlows.find(f => f.sourceType === 'flow_cluster');
    assert('25: cluster with 650 present', cluster != null && cluster.clusterTotalAmount === 650,
        `cluster: ${cluster ? cluster.clusterTotalAmount : 'missing'}`);
    if (cluster) {
        assert('25: direction = mixed', cluster.direction === 'mixed', `direction=${cluster.direction}`);
        assert('25: directionAttributed = false', cluster.directionAttributed === false, `directionAttributed=${cluster.directionAttributed}`);
        assert('25: flowAmbiguous = true', cluster.flowAmbiguous === true, `flowAmbiguous=${cluster.flowAmbiguous}`);
    }
}

finish();
