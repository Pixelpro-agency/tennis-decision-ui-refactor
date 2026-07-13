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

const { assert, finish } = createAssertionSuite('temporalAlignmentEvidence/builder.test');

console.log('\n=== Test 6: buildTemporalAlignment integration ===');
{
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '15-15', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:10.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 2),
        makeSofaTick('2026-06-19T12:09:20.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 3),
        makeSofaTick('2026-06-19T12:09:30.000Z', '40-30', 2, 3, 0, 0, 'inprogress', 'away', 4)
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:09:05.000Z', 'Runner', 2.00, 1.98, 2.02, 1000, 0, 0, 'neutral', 0, 0, 'confirmed', 1),
        makeBetfairTick('2026-06-19T12:09:40.000Z', 'Runner', 1.90, 1.89, 1.92, 1100, 80, 0, 'backing', 80, 100, 'confirmed', 2)
    ];

    const result = buildTemporalAlignment({ sofaTicks, betfairTicks, now: NOW });

    assert('temporal block has latestScoreChange', result.latestScoreChange !== undefined);
    assert('temporal block has latestRelevantSofaMarker', result.latestRelevantSofaMarker !== undefined);
    assert('temporal block has latestBetfairMove', result.latestBetfairMove !== undefined);
    assert('temporal block has reactionWindows', result.reactionWindows !== undefined);
    assert('temporal block has warnings array', Array.isArray(result.warnings));
    assert('causalityClaimed = false in reactionWindows', result.reactionWindows.causalityClaimed === false);
    assert('latestScoreChange toScore = 40-30', result.latestScoreChange.toScore?.point === '40-30',
        result.latestScoreChange.toScore?.point ?? 'unavailable');
}

console.log('\n=== Test 7: empty / missing timelines ===');
{
    const result = buildTemporalAlignment({ sofaTicks: [], betfairTicks: [], now: NOW });
    assert('No throw on empty arrays', true);
    assert('temporal.warnings includes Sofa unavailable',
        result.warnings.some(w => w.toLowerCase().includes('sofa')));
    assert('temporal.warnings includes Betfair unavailable',
        result.warnings.some(w => w.toLowerCase().includes('betfair')));
    assert('reactionWindows.relation = unknown', result.reactionWindows.relation === 'unknown');
    assert('latestScoreChange.available = false', !result.latestScoreChange.available);
    assert('latestBetfairMove.available = false', !result.latestBetfairMove.available);
}

console.log('\n=== Test 8: warning semantics ===');

{
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:10.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 2)
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:09:00.000Z', 'Runner', 2.00, 1.98, 2.02, 1000, 0, 0, 'neutral', 0, 0, 'confirmed', 1),
        makeBetfairTick('2026-06-19T12:09:10.000Z', 'Runner', 1.85, 1.84, 1.87, 1000, 0, 0, 'neutral', 0, 0, 'confirmed', 2)
    ];
    const result = buildTemporalAlignment({ sofaTicks, betfairTicks, now: NOW });
    const hasVolWarning = result.warnings.includes('Market price moved, but volume confirmation is missing');
    const hasFieldUnclear = result.warnings.includes('Market moved, but field evidence unclear');
    assert('8a: "Market price moved, but volume confirmation is missing" when volumeDetected=false', hasVolWarning,
        JSON.stringify(result.warnings));
    assert('8a: "Market moved, but field evidence unclear" absent when Sofa marker present', !hasFieldUnclear,
        JSON.stringify(result.warnings));
}

{
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '15-15', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:10.000Z', '15-15', 2, 3, 0, 0, 'inprogress', 'away', 2)
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:09:00.000Z', 'Runner', 2.00, 1.98, 2.02, 1000, 0, 0, 'neutral', 0, 0, 'confirmed', 1),
        makeBetfairTick('2026-06-19T12:09:10.000Z', 'Runner', 1.85, 1.84, 1.87, 1000, 80, 0, 'backing', 80, 100, 'confirmed', 2)
    ];
    const result = buildTemporalAlignment({ sofaTicks, betfairTicks, now: NOW });
    const hasFieldUnclear = result.warnings.includes('Market moved, but field evidence unclear');
    assert('8b: "Market moved, but field evidence unclear" when Betfair moves but no Sofa marker', hasFieldUnclear,
        JSON.stringify(result.warnings));
}

{
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:10.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 2)
    ];
    const betfairTicks = [
        makeBetfairTick('2026-06-19T12:09:00.000Z', 'Runner', 2.00, 1.98, 2.02, 1000, 0, 0, 'neutral', 0, 0, 'confirmed', 1),
        makeBetfairTick('2026-06-19T12:09:10.000Z', 'Runner', 1.85, 1.84, 1.87, 1100, 80, 0, 'backing', 80, 100, 'confirmed', 2)
    ];
    const result = buildTemporalAlignment({ sofaTicks, betfairTicks, now: NOW });
    assert('8c: no volume-missing warning when volume present',
        !result.warnings.includes('Market price moved, but volume confirmation is missing'),
        JSON.stringify(result.warnings));
    assert('8c: no field-unclear warning when Sofa marker present',
        !result.warnings.includes('Market moved, but field evidence unclear'),
        JSON.stringify(result.warnings));
}

{
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '15-15', 2, 3, 0, 0, 'inprogress', 'away', 1)
    ];
    const result = buildTemporalAlignment({ sofaTicks, betfairTicks: [], now: NOW });
    assert('8d: no "field evidence unclear" when Betfair is unavailable',
        !result.warnings.includes('Market moved, but field evidence unclear'),
        JSON.stringify(result.warnings));
}

console.log('\n=== Test 13: warning invalidVolume ===');
{
    const sofaTicks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:10.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 2)
    ];
    const betfairTicks = [
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
                    moneyFlow: { back: 0, lay: 0, trend: 'neutral', runnerDelta: 15000, marketDelta: 100, confidence: 'suppressed', reason: 'runner_delta_exceeds_market_delta' }
                }]
            }
        }
    ];

    const result = buildTemporalAlignment({ sofaTicks, betfairTicks, now: NOW });

    assert('13: latestBetfairMove.invalidVolume = true',
        result.latestBetfairMove.invalidVolume === true,
        String(result.latestBetfairMove.invalidVolume));
    assert('13: warning includes "invalidated by TotalMatched gate"',
        result.warnings.some(w => w.includes('invalidated by TotalMatched gate')),
        JSON.stringify(result.warnings));
    assert('13: warning includes "volume confirmation is invalid"',
        result.warnings.some(w => w.includes('volume confirmation is invalid')),
        JSON.stringify(result.warnings));
}

finish();
