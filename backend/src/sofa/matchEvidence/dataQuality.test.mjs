import { buildDataQuality } from './dataQuality.js';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

const PERSISTENCE_INCOMPLETE_REASON = 'Persistence incomplete: canonical cross-source evidence unavailable';

const now = new Date('2026-06-21T00:00:00.000Z');
const empty = buildDataQuality({ sofaTick: null, betfairTick: null, alignment: null, now });
assert(empty.sofaLive === false, 'empty sofa live');
assert(empty.sofaRecent === false, 'empty sofa recent');
assert(empty.betfairRecent === false, 'empty betfair recent');
assert(empty.persistenceComplete === true, 'empty integrity defaults to persistence complete');
assert(empty.reasons.includes('SofaScore timeline missing'), 'empty sofa reason');
assert(empty.reasons.includes('Betfair timeline missing'), 'empty betfair reason');

const healthy = buildDataQuality({
    sofaTick: { timestamp: now.toISOString(), data: { status: 'inprogress' } },
    betfairTick: {
        timestamp: now.toISOString(),
        data: { graphHealth: { status: 'ok' }, runners: [{
            ladderSource: 'graph', ladder: [{ traded: 10 }],
            moneyFlow: { back: 10, lay: 0, runnerDelta: 10, marketDelta: 20, reason: null },
            bestBack: 1.5, bestLay: 1.52
        }] }
    },
    alignment: null,
    now
});
assert(healthy.sofaLive === true, 'healthy sofa live');
assert(healthy.ladderReliable === true, 'healthy ladder');
assert(healthy.moneyFlowReliable === true, 'healthy money flow');
assert(healthy.marketTradable === true, 'healthy tradable');
assert(healthy.persistenceComplete === true, 'healthy persistence complete');

const invalidFlow = buildDataQuality({
    sofaTick: { timestamp: now.toISOString(), data: { status: 'finished' } },
    betfairTick: {
        timestamp: now.toISOString(),
        data: { graphHealth: { status: 'ok' }, runners: [{
            ladderSource: 'graph', ladder: [{ traded: 10 }],
            moneyFlow: { back: 0, lay: 0, runnerDelta: -1, marketDelta: 20, reason: 'matched_total_decreased' },
            bestBack: 1.5, bestLay: 1.52
        }] }
    },
    alignment: null,
    now
});
assert(invalidFlow.sofaLive === false, 'finished sofa');
assert(invalidFlow.moneyFlowReliable === false, 'invalid money flow');
assert(invalidFlow.reasons.includes('Money flow invalidated by TotalMatched gate'), 'invalid money flow reason');

const freshWithPartial = buildDataQuality({
    sofaTick: { timestamp: now.toISOString(), data: { status: 'inprogress' } },
    betfairTick: {
        timestamp: now.toISOString(),
        data: { graphHealth: { status: 'ok' }, runners: [{
            ladderSource: 'graph', ladder: [{ traded: 10 }],
            moneyFlow: { back: 10, lay: 0, runnerDelta: 10, marketDelta: 20, reason: null },
            bestBack: 1.5, bestLay: 1.52
        }] }
    },
    alignment: null,
    now,
    integrity: {
        status: 'partial_persistence',
        reason: 'pending_commit',
        affectedSources: ['betfair'],
        sources: {}
    }
});
assert(freshWithPartial.betfairRecent === true, 'fresh Betfair remains recent with partial persistence');
assert(freshWithPartial.persistenceComplete === false, 'partial persistence sets persistenceComplete false');
assert(freshWithPartial.reasons.includes(PERSISTENCE_INCOMPLETE_REASON), 'partial persistence reason in dataQuality');

const recoveryIntegrity = buildDataQuality({
    sofaTick: null,
    betfairTick: null,
    alignment: null,
    now,
    integrity: {
        status: 'recovery_failed',
        reason: 'recovery_failed',
        affectedSources: ['sofa'],
        sources: {}
    }
});
assert(recoveryIntegrity.persistenceComplete === false, 'recovery failed sets persistenceComplete false');

const missingNoJournal = buildDataQuality({
    sofaTick: null,
    betfairTick: null,
    alignment: null,
    now,
    integrity: { status: 'no_known_partial', reason: null, affectedSources: [], sources: {} }
});
assert(missingNoJournal.persistenceComplete === true, 'no_known_partial keeps persistence complete');
assert(!missingNoJournal.reasons.includes(PERSISTENCE_INCOMPLETE_REASON), 'no_known_partial has no persistence reason');

console.log('matchEvidence dataQuality: 17 assertions passed');
