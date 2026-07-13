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

const { assert, finish } = createAssertionSuite('temporalAlignmentEvidence/sofaMarkers.test');

console.log('\n=== Test 1: latestScoreChange ===');
{
    const ticks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '15-15', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:10.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 2),
        makeSofaTick('2026-06-19T12:09:20.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 3),
        makeSofaTick('2026-06-19T12:09:30.000Z', '40-30', 2, 3, 0, 0, 'inprogress', 'away', 4)
    ];

    const result = computeLatestScoreChange(ticks, NOW);

    assert('latestScoreChange available', result.available);
    assert('latestScoreChange toScore point = 40-30', result.toScore?.point === '40-30', JSON.stringify(result.toScore));
    assert('latestScoreChange fromScore point = 30-30', result.fromScore?.point === '30-30', JSON.stringify(result.fromScore));
    assert('latestScoreChange changedFields includes point', result.changedFields.includes('point'), JSON.stringify(result.changedFields));
    assert('latestScoreChange scoreType = point', result.scoreType === 'point', result.scoreType);
    assert('latestScoreChange seq = 4', result.seq === 4, String(result.seq));
}

{
    const ticks = [
        makeSofaTick('2026-06-19T12:09:00.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:10.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 2),
        makeSofaTick('2026-06-19T12:09:20.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 3)
    ];
    const result = computeLatestScoreChange(ticks, NOW);
    assert('No change in repeated-identical ticks', !result.available, 'Should not detect change when score is always same');
}

console.log('\n=== Test 2: latestRelevantSofaMarker — stateFirstSeenAt ===');
{
    const ticks = [
        makeSofaTick('2026-06-19T12:00:00.000Z', '15-15', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:00:10.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 2),
        makeSofaTick('2026-06-19T12:00:20.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 3),
        makeSofaTick('2026-06-19T12:00:30.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 4)
    ];

    const result = computeLatestRelevantSofaMarker(ticks, NOW);

    assert('THIRTY_ALL detected', result.available && result.type === 'THIRTY_ALL', result.type ?? 'unavailable');
    assert('stateFirstSeenAt = 12:00:10', result.stateFirstSeenAt === '2026-06-19T12:00:10.000Z', result.stateFirstSeenAt);
    assert('latestSeenAt = 12:00:30', result.latestSeenAt === '2026-06-19T12:00:30.000Z', result.latestSeenAt);
    assert('seqFirst = 2', result.seqFirst === 2, String(result.seqFirst));
    assert('seqLatest = 4', result.seqLatest === 4, String(result.seqLatest));
}

{
    const ticks = [
        makeSofaTick('2026-06-19T12:09:19.000Z', '40-30', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:09:29.000Z', '40-30', 2, 3, 0, 0, 'inprogress', 'away', 2)
    ];
    const result = computeLatestRelevantSofaMarker(ticks, NOW);
    assert('BREAK_POINT detected when receiver at 40', result.available && result.type === 'BREAK_POINT', result.type ?? 'unavailable');
    assert('playerUnderPressure = AwayPlayer (server)', result.playerUnderPressure === 'AwayPlayer', result.playerUnderPressure);
}

{
    const ticks = [
        makeSofaTick('2026-06-19T12:00:00.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 1),
        makeSofaTick('2026-06-19T12:00:10.000Z', '40-30', 2, 3, 0, 0, 'inprogress', 'away', 2),
        makeSofaTick('2026-06-19T12:00:20.000Z', '30-30', 2, 3, 0, 0, 'inprogress', 'away', 3) 
    ];
    const result = computeLatestRelevantSofaMarker(ticks, NOW);
    assert('New THIRTY_ALL state after break: stateFirstSeenAt = 12:00:20',
        result.stateFirstSeenAt === '2026-06-19T12:00:20.000Z',
        result.stateFirstSeenAt);
}

finish();
