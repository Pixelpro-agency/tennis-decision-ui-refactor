import {
    computeLatestScoreChange,
    computeLatestRelevantSofaMarker,
    computeLatestBetfairMove,
    computeReactionWindows,
    checkBookTradable,
    buildTemporalAlignment
} from '../temporalAlignmentEvidence.js';
import {
    createAssertionSuite,
    NOW,
    makeSofaTick,
    makeBetfairTick
} from './temporalAlignmentEvidenceTestFixtures.mjs';

const { assert, finish } = createAssertionSuite('temporalAlignmentEvidence/betfairMove.test');

console.log('\n=== Test 3: latestBetfairMove — suppressed volume ===');
{
    const ticks = [
        makeBetfairTick('2026-06-19T12:09:00.000Z', 'Runner', 2.00, 1.98, 2.02, 1000, 0, 0, 'neutral', 0, 0, 'confirmed', 1),
        makeBetfairTick('2026-06-19T12:09:10.000Z', 'Runner', 1.90, 1.89, 1.92, 1100, 80, 20, 'backing', 100, 100, 'confirmed', 2),
        makeBetfairTick('2026-06-19T12:09:20.000Z', 'Runner', 1.90, 1.89, 1.92, 1200, 0, 0, 'neutral', 100, 100, 'suppressed', 3)
    ];

    const result = computeLatestBetfairMove(ticks, NOW);

    assert('latestBetfairMove available', result.available);
    assert('volumeDetected = true', result.volumeDetected, String(result.volumeDetected));
    assert('flowAmbiguous = true when suppressed', result.flowAmbiguous, String(result.flowAmbiguous));
    assert('directionReliable = false when suppressed', !result.directionReliable, String(result.directionReliable));
    assert('directionAttributed != back/lay when suppressed', result.directionAttributed === 'none' || result.directionAttributed === 'mixed', result.directionAttributed);
}

console.log('\n=== Test 4: checkBookTradable ===');
assert('bookTradable = false when bestBack = 0', !checkBookTradable({ bestBack: 0, bestLay: 1.06 }));
assert('bookTradable = false when bestLay = 0', !checkBookTradable({ bestBack: 13, bestLay: 0 }));
assert('bookTradable = true when bestBack=1.50 bestLay=1.52', checkBookTradable({ bestBack: 1.50, bestLay: 1.52 }));
assert('bookTradable = false when bestLay <= bestBack', !checkBookTradable({ bestBack: 1.52, bestLay: 1.50 }));
assert('bookTradable = false when null', !checkBookTradable(null));
assert('bookTradable = false when both zero', !checkBookTradable({ bestBack: 0, bestLay: 0 }));

console.log('\n=== Test 9: TotalMatched Gate — caso sano Paul ===');
{
    const ticks = [
        {
            timestamp: '2026-06-19T12:09:00.000Z',
            data: {
                seq: 1,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 1000 },
                runners: [{
                    name: 'Paul',
                    selectionId: 1,
                    lastTradedPrice: 1.21,
                    bestBack: 1.20,
                    bestLay: 1.22,
                    matchedTotal: 1000,
                    ladderSource: 'graph',
                    ladder: [{ price: 1.21, traded: 10 }],
                    moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
                }]
            }
        },
        {
            timestamp: '2026-06-19T12:09:10.000Z',
            data: {
                seq: 2,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 1030 },
                runners: [{
                    name: 'Paul',
                    selectionId: 1,
                    lastTradedPrice: 1.19,
                    bestBack: 1.18,
                    bestLay: 1.20,
                    matchedTotal: 1030,
                    ladderSource: 'graph',
                    ladder: [{ price: 1.19, traded: 10 }],
                    moneyFlow: { back: 30, lay: 0, trend: 'backing', runnerDelta: 30, marketDelta: 30, confidence: 'confirmed', reason: null }
                }]
            }
        }
    ];

    const result = computeLatestBetfairMove(ticks, NOW);

    assert('9: available', result.available);
    assert('9: validVolume = true', result.validVolume === true, String(result.validVolume));
    assert('9: invalidVolume = false', result.invalidVolume === false, String(result.invalidVolume));
    assert('9: anomaly = false', result.anomaly === false, String(result.anomaly));
    assert('9: invalidReason = null', result.invalidReason === null, String(result.invalidReason));
    assert('9: volumeDetected = true', result.volumeDetected === true, String(result.volumeDetected));
    assert('9: classifiedVolume = 30', result.classifiedVolume === 30, String(result.classifiedVolume));
    assert('9: directionAttributed = back', result.directionAttributed === 'back', result.directionAttributed);
    assert('9: directionReliable = true', result.directionReliable === true, String(result.directionReliable));
    assert('9: flowAmbiguous = false', result.flowAmbiguous === false, String(result.flowAmbiguous));
    assert('9: runner = Paul', result.runner === 'Paul', String(result.runner));
}

console.log('\n=== Test 10: TotalMatched Gate — matched_total_decreased ===');
{
    const ticks = [
        {
            timestamp: '2026-06-19T12:09:00.000Z',
            data: {
                seq: 1,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 5000 },
                runners: [{
                    name: 'ArFery',
                    selectionId: 1,
                    lastTradedPrice: 2.00,
                    bestBack: 1.99,
                    bestLay: 2.01,
                    matchedTotal: 5000,
                    ladderSource: 'graph',
                    ladder: [{ price: 2.00, traded: 10 }],
                    moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
                }]
            }
        },
        {
            timestamp: '2026-06-19T12:09:10.000Z',
            data: {
                seq: 2,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 5880 },
                runners: [{
                    name: 'ArFery',
                    selectionId: 1,
                    lastTradedPrice: 1.95,
                    bestBack: 1.94,
                    bestLay: 1.96,
                    matchedTotal: 4994,
                    ladderSource: 'graph',
                    ladder: [{ price: 1.95, traded: 10 }],
                    moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: -12006, marketDelta: 880, confidence: 'suppressed', reason: 'matched_total_decreased' }
                }]
            }
        }
    ];

    const result = computeLatestBetfairMove(ticks, NOW);

    assert('10: available', result.available);
    assert('10: validVolume = false', result.validVolume === false, String(result.validVolume));
    assert('10: invalidVolume = true', result.invalidVolume === true, String(result.invalidVolume));
    assert('10: anomaly = true', result.anomaly === true, String(result.anomaly));
    assert('10: invalidReason = matched_total_decreased', result.invalidReason === 'matched_total_decreased', String(result.invalidReason));
    assert('10: classifiedVolume = 0', result.classifiedVolume === 0, String(result.classifiedVolume));
    assert('10: unclassifiedVolume = 0', result.unclassifiedVolume === 0, String(result.unclassifiedVolume));
    assert('10: suppressedVolume = 0', result.suppressedVolume === 0, String(result.suppressedVolume));
    assert('10: volumeDetected = false', result.volumeDetected === false, String(result.volumeDetected));
    assert('10: directionAttributed = none', result.directionAttributed === 'none', result.directionAttributed);
    assert('10: directionReliable = false', result.directionReliable === false, String(result.directionReliable));
}

console.log('\n=== Test 11: TotalMatched Gate — runner_delta_exceeds_market_delta (Cerundolo) ===');
{
    const ticks = [
        {
            timestamp: '2026-06-19T12:09:00.000Z',
            data: {
                seq: 1,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 10000 },
                runners: [{
                    name: 'Cerundolo',
                    selectionId: 1,
                    lastTradedPrice: 3.00,
                    bestBack: 2.98,
                    bestLay: 3.02,
                    matchedTotal: 10000,
                    ladderSource: 'graph',
                    ladder: [{ price: 3.00, traded: 10 }],
                    moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
                }]
            }
        },
        {
            timestamp: '2026-06-19T12:09:10.000Z',
            data: {
                seq: 2,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 10880 },
                runners: [{
                    name: 'Cerundolo',
                    selectionId: 1,
                    lastTradedPrice: 2.90,
                    bestBack: 2.88,
                    bestLay: 2.92,
                    matchedTotal: 22886,
                    ladderSource: 'graph',
                    ladder: [{ price: 2.90, traded: 10 }],
                    moneyFlow: { back: 206, lay: 0, trend: 'backing', runnerDelta: 12886, marketDelta: 880, confidence: 'suppressed', reason: 'runner_delta_exceeds_market_delta' }
                }]
            }
        }
    ];

    const result = computeLatestBetfairMove(ticks, NOW);

    assert('11: available', result.available);
    assert('11: validVolume = false', result.validVolume === false, String(result.validVolume));
    assert('11: invalidVolume = true', result.invalidVolume === true, String(result.invalidVolume));
    assert('11: anomaly = true', result.anomaly === true, String(result.anomaly));
    assert('11: invalidReason = runner_delta_exceeds_market_delta', result.invalidReason === 'runner_delta_exceeds_market_delta', String(result.invalidReason));
    assert('11: classifiedVolume = 0', result.classifiedVolume === 0, String(result.classifiedVolume));
    assert('11: unclassifiedVolume = 0', result.unclassifiedVolume === 0, String(result.unclassifiedVolume));
    assert('11: suppressedVolume = 0', result.suppressedVolume === 0, String(result.suppressedVolume));
    assert('11: volumeDetected = false', result.volumeDetected === false, String(result.volumeDetected));
}

console.log('\n=== Test 12: volume anomalo senza price move non deve vincere ===');
{
    const ticks = [
        {
            timestamp: '2026-06-19T12:09:00.000Z',
            data: {
                seq: 1,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 10000 },
                runners: [
                    {
                        name: 'RunnerA',
                        selectionId: 1,
                        lastTradedPrice: 2.00,
                        bestBack: 1.99,
                        bestLay: 2.01,
                        matchedTotal: 10000,
                        ladderSource: 'graph',
                        ladder: [{ price: 2.00, traded: 10 }],
                        moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
                    },
                    {
                        name: 'RunnerB',
                        selectionId: 2,
                        lastTradedPrice: 1.50,
                        bestBack: 1.49,
                        bestLay: 1.51,
                        matchedTotal: 5000,
                        ladderSource: 'graph',
                        ladder: [{ price: 1.50, traded: 10 }],
                        moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
                    }
                ]
            }
        },
        {
            timestamp: '2026-06-19T12:09:10.000Z',
            data: {
                seq: 2,
                graphHealth: { status: 'ok' },
                market: { totalMatched: 10100 },
                runners: [
                    {
                        name: 'RunnerA',
                        selectionId: 1,
                        lastTradedPrice: 2.00, 
                        bestBack: 1.99,
                        bestLay: 2.01,
                        matchedTotal: 25000,  
                        ladderSource: 'graph',
                        ladder: [{ price: 2.00, traded: 10 }],
                        moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 15000, marketDelta: 100, confidence: 'suppressed', reason: 'runner_delta_exceeds_market_delta' }
                    },
                    {
                        name: 'RunnerB',
                        selectionId: 2,
                        lastTradedPrice: 1.48, 
                        bestBack: 1.47,
                        bestLay: 1.49,
                        matchedTotal: 5010,
                        ladderSource: 'graph',
                        ladder: [{ price: 1.48, traded: 10 }],
                        moneyFlow: { back: 10, lay: 0, trend: 'backing', runnerDelta: 10, marketDelta: 100, confidence: 'confirmed', reason: null }
                    }
                ]
            }
        }
    ];

    const result = computeLatestBetfairMove(ticks, NOW);

    assert('12: available', result.available);
    assert('12: runner = RunnerB (not anomalous RunnerA)', result.runner === 'RunnerB',
        `runner = ${result.runner}`);
    assert('12: validVolume = true for RunnerB', result.validVolume === true, String(result.validVolume));
    assert('12: anomaly = false for RunnerB', result.anomaly === false, String(result.anomaly));
}

console.log('\n=== Test 14: matchEvidence dataQuality moneyFlowReliable ===');
{

    const INVALID_REASONS = [
        'matched_total_decreased',
        'runner_delta_exceeds_market_delta',
        'classified_volume_exceeds_runner_delta',
        'runner_delta_raw_computed_mismatch',
        'market_delta_raw_computed_mismatch'
    ];

    for (const reason of INVALID_REASONS) {
        const ticks = [
            {
                timestamp: '2026-06-19T12:09:00.000Z',
                data: {
                    seq: 1,
                    graphHealth: { status: 'ok' },
                    market: { totalMatched: 10000 },
                    runners: [{
                        name: 'Runner',
                        selectionId: 1,
                        lastTradedPrice: 2.00,
                        bestBack: 1.99,
                        bestLay: 2.01,
                        matchedTotal: 10000,
                        ladderSource: 'graph',
                        ladder: [{ price: 2.00, traded: 10 }],
                        moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
                    }]
                }
            },
            {
                timestamp: '2026-06-19T12:09:10.000Z',
                data: {
                    seq: 2,
                    graphHealth: { status: 'ok' },
                    market: { totalMatched: 10100 },
                    runners: [{
                        name: 'Runner',
                        selectionId: 1,
                        lastTradedPrice: 1.80,
                        bestBack: 1.79,
                        bestLay: 1.81,
                        matchedTotal: 25000,
                        ladderSource: 'graph',
                        ladder: [{ price: 1.80, traded: 10 }],
                        moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 15000, marketDelta: 100, confidence: 'suppressed', reason }
                    }]
                }
            }
        ];

        const result = computeLatestBetfairMove(ticks, NOW);
        assert(`14: reason "${reason}" → invalidVolume=true`,
            result.invalidVolume === true,
            `invalidVolume=${result.invalidVolume} invalidReason=${result.invalidReason}`);
    }

    {
        const ticks = [
            {
                timestamp: '2026-06-19T12:09:00.000Z',
                data: {
                    seq: 1,
                    graphHealth: { status: 'ok' },
                    market: { totalMatched: 1000 },
                    runners: [{
                        name: 'Paul',
                        selectionId: 1,
                        lastTradedPrice: 1.21,
                        bestBack: 1.20,
                        bestLay: 1.22,
                        matchedTotal: 1000,
                        ladderSource: 'graph',
                        ladder: [{ price: 1.21, traded: 10 }],
                        moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 0, marketDelta: 0, confidence: 'confirmed', reason: null }
                    }]
                }
            },
            {
                timestamp: '2026-06-19T12:09:10.000Z',
                data: {
                    seq: 2,
                    graphHealth: { status: 'ok' },
                    market: { totalMatched: 1030 },
                    runners: [{
                        name: 'Paul',
                        selectionId: 1,
                        lastTradedPrice: 1.19,
                        bestBack: 1.18,
                        bestLay: 1.20,
                        matchedTotal: 1030,
                        ladderSource: 'graph',
                        ladder: [{ price: 1.19, traded: 10 }],
                        moneyFlow: { back: 30, lay: 0, trend: 'backing', runnerDelta: 30, marketDelta: 30, confidence: 'confirmed', reason: null }
                    }]
                }
            }
        ];

        const result = computeLatestBetfairMove(ticks, NOW);
        assert('14: reason null → validVolume=true', result.validVolume === true,
            `validVolume=${result.validVolume} invalidReason=${result.invalidReason}`);
        assert('14: reason null → moneyFlowReliable path (classifiedVolume=30)',
            result.classifiedVolume === 30, String(result.classifiedVolume));
    }
}

finish();
