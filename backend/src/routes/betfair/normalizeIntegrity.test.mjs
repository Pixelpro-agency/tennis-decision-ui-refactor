import assert from 'node:assert/strict';

import {
    buildLatestBetfairPayload,
    buildBetfairJsonResponse,
    normalizeIntegrity
} from './latestPayload.js';

import {
    betfairTimeline,
    jsonTimeline,
    latestTick,
    runtime200,
    runtime404,
    sofaTimeline,
    validTicks
} from './latestPayloadTestFixtures.mjs';

// T10: integrity raw null/undefined/malata
assert.equal(normalizeIntegrity(null).status, 'no_known_partial');
assert.equal(normalizeIntegrity(undefined).status, 'no_known_partial');
assert.equal(normalizeIntegrity({ status: 'invalid' }).status, 'no_known_partial');
assert.deepEqual(normalizeIntegrity({}).affectedDocuments, []);

// T12: source strict e affectedDocuments filtrati
assert.equal(normalizeIntegrity({ source: 'sofa' }).source, null, 'betfair integrity rejects sofa source');
assert.equal(
    normalizeIntegrity({ source: 'betfair' }).source,
    'betfair',
    'betfair integrity keeps betfair source'
);
assert.deepEqual(
    normalizeIntegrity({ affectedDocuments: ['history', 'timeline', 'secret', 'other'] }).affectedDocuments,
    ['history', 'timeline'],
    'betfair integrity filters affectedDocuments'
);
assert.deepEqual(
    normalizeIntegrity({ affectedDocuments: 'not-array' }).affectedDocuments,
    [],
    'betfair integrity non-array affectedDocuments defaults to empty array'
);

const strictLatest = await buildLatestBetfairPayload({
    eventId: 'latest-strict',
    dependencies: {
        now: new Date('2026-06-24T11:00:00.000Z'),
        checkCdpStatus: async () => true,
        loadTimeline: source => source === 'betfair' ? betfairTimeline : sofaTimeline,
        getBetfairTrackingRuntime: () => runtime200,
        buildBetfairSessionHealth: () => ({ status: 'healthy' }),
        getLatestValidBetfairTick: () => latestTick,
        getValidBetfairTicks: () => validTicks,
        buildMoneyFlowHistorySeries: () => ({ series: [] }),
        getMatchPersistenceIntegrity: () => ({
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: 'sofa',
            commitId: 'strict-commit',
            affectedDocuments: ['history', 'timeline', 'secret', 'other']
        })
    }
});

assert.equal(strictLatest.httpStatus, 200);
assert.equal(strictLatest.body.integrity.source, null, '/latest rejects sofa source');
assert.deepEqual(
    strictLatest.body.integrity.affectedDocuments,
    ['history', 'timeline'],
    '/latest filters affectedDocuments'
);

const strictJson = buildBetfairJsonResponse(
    'json-strict',
    {
        loadTimeline: source => source === 'betfair' ? jsonTimeline : null,
        getMatchPersistenceIntegrity: () => ({
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: 'sofa',
            commitId: 'strict-json-commit',
            affectedDocuments: ['history', 'timeline', 'other']
        })
    }
);

assert.equal(strictJson.httpStatus, 200);
assert.equal(strictJson.body.integrity.source, null, '/json rejects sofa source');
assert.deepEqual(
    strictJson.body.integrity.affectedDocuments,
    ['history', 'timeline'],
    '/json filters affectedDocuments'
);

// T11: documento/timeline con integrity preesistente
const timelineWithIntegrity = {
    updatedAt: '2026-06-24T10:22:00.000Z',
    metadata: { eventId: 'integrity-event' },
    timeline: [],
    integrity: { status: 'old', source: 'betfair' }
};

const jsonOverwritten = buildBetfairJsonResponse(
    'integrity-overwrite',
    {
        loadTimeline: source => source === 'betfair' ? timelineWithIntegrity : null,
        getMatchPersistenceIntegrity: () => ({
            status: 'recovery_failed',
            reason: 'recovery_failed',
            source: 'betfair',
            commitId: 'betfair-commit-7',
            affectedDocuments: ['timeline']
        })
    }
);

assert.equal(jsonOverwritten.httpStatus, 200);
assert.equal(jsonOverwritten.body.integrity.status, 'recovery_failed');
assert.equal(timelineWithIntegrity.integrity.status, 'old');

console.log('Betfair integrity normalization contract tests passed');
