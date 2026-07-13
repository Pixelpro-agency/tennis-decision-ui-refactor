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

const { assert, finish } = createAssertionSuite('temporalAlignmentEvidence/reactionWindows.test');

console.log('\n=== Test 5: reactionWindows ===');
{
    const sofaMk = { available: true, stateFirstSeenAt: '2026-06-19T12:09:00.000Z' };
    const betMv = { available: true, timestamp: '2026-06-19T12:09:10.000Z' };
    const rw = computeReactionWindows(sofaMk, betMv);
    assert('same_window when gap=10s', rw.relation === 'same_window', rw.relation);
    assert('causalityClaimed always false', rw.causalityClaimed === false);
    assert('interpretation = temporal_proximity_only', rw.interpretation === 'temporal_proximity_only');
}
{
    const sofaMk = { available: true, stateFirstSeenAt: '2026-06-19T12:09:00.000Z' };
    const betMv = { available: true, timestamp: '2026-06-19T12:10:00.000Z' };
    const rw = computeReactionWindows(sofaMk, betMv);
    assert('sofa_before_betfair when gap=60s', rw.relation === 'sofa_before_betfair', rw.relation);
}
{
    const sofaMk = { available: true, stateFirstSeenAt: '2026-06-19T12:10:00.000Z' };
    const betMv = { available: true, timestamp: '2026-06-19T12:09:00.000Z' };
    const rw = computeReactionWindows(sofaMk, betMv);
    assert('betfair_before_sofa when gap=-60s', rw.relation === 'betfair_before_sofa', rw.relation);
}
{
    const sofaMk = { available: true, stateFirstSeenAt: '2026-06-19T12:09:00.000Z' };
    const betMv = { available: false };
    const rw = computeReactionWindows(sofaMk, betMv);
    assert('unknown when Betfair missing', rw.relation === 'unknown', rw.relation);
}
{
    const sofaMk = { available: false };
    const betMv = { available: true, timestamp: '2026-06-19T12:09:00.000Z' };
    const rw = computeReactionWindows(sofaMk, betMv);
    assert('unknown when Sofa missing', rw.relation === 'unknown', rw.relation);
}

finish();
