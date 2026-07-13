import assert from 'node:assert/strict';

import {
    buildLatestBetfairPayload
} from './latestPayload.js';

import {
    betfairTimeline,
    latestTick,
    runtime200,
    runtime404,
    sofaTimeline,
    validTicks
} from './latestPayloadTestFixtures.mjs';

// T1: /latest timeline presente + partial_persistence noto
let latestIntegrityEventId = null;
let latestIntegritySource = null;

const latestPartial = await buildLatestBetfairPayload({
    eventId: 'latest-partial',
    dependencies: {
        now: new Date('2026-06-24T11:00:00.000Z'),
        checkCdpStatus: async () => true,
        loadTimeline: source => source === 'betfair' ? betfairTimeline : sofaTimeline,
        getBetfairTrackingRuntime: () => runtime200,
        buildBetfairSessionHealth: () => ({ status: 'healthy', baseline: true }),
        getLatestValidBetfairTick: () => latestTick,
        getValidBetfairTicks: () => validTicks,
        buildMoneyFlowHistorySeries: () => ({ series: [] }),
        getMatchPersistenceIntegrity: (eventId, source) => {
            latestIntegrityEventId = eventId;
            latestIntegritySource = source;
            return {
                status: 'partial_persistence',
                reason: 'pending_commit',
                source: 'betfair',
                commitId: 'betfair-commit-1',
                affectedDocuments: ['history']
            };
        }
    }
});

assert.equal(latestPartial.httpStatus, 200);
assert.equal(latestPartial.body.health.status, 'healthy');
assert.equal(latestPartial.body.health.baseline, true);
assert.equal(latestPartial.body.integrity.status, 'partial_persistence');
assert.equal(latestPartial.body.integrity.commitId, 'betfair-commit-1');
assert.equal(latestPartial.body.latestTimestamp, latestTick.timestamp);
assert.deepEqual(latestPartial.body.moneyFlowHistory, { series: [] });
assert.equal(latestIntegrityEventId, 'latest-partial');
assert.equal(latestIntegritySource, 'betfair');

// T2: /latest timeline presente + recovery_failed noto
const latestFailed = await buildLatestBetfairPayload({
    eventId: 'latest-failed',
    dependencies: {
        now: new Date('2026-06-24T11:00:00.000Z'),
        checkCdpStatus: async () => true,
        loadTimeline: source => source === 'betfair' ? betfairTimeline : sofaTimeline,
        getBetfairTrackingRuntime: () => runtime200,
        buildBetfairSessionHealth: () => ({ status: 'degraded', baseline: true }),
        getLatestValidBetfairTick: () => latestTick,
        getValidBetfairTicks: () => validTicks,
        buildMoneyFlowHistorySeries: () => ({ series: [] }),
        getMatchPersistenceIntegrity: () => ({
            status: 'recovery_failed',
            reason: 'recovery_failed',
            source: 'betfair',
            commitId: 'betfair-commit-2',
            affectedDocuments: ['history', 'timeline']
        })
    }
});

assert.equal(latestFailed.httpStatus, 200);
assert.equal(latestFailed.body.health.status, 'degraded');
assert.equal(latestFailed.body.health.baseline, true);
assert.equal(latestFailed.body.integrity.status, 'recovery_failed');
assert.equal(latestFailed.body.integrity.commitId, 'betfair-commit-2');

// T3: /latest timeline assente + no_known_partial
const latestMissingNone = await buildLatestBetfairPayload({
    eventId: 'latest-missing-none',
    dependencies: {
        now: new Date('2026-06-24T11:00:00.000Z'),
        checkCdpStatus: async () => null,
        loadTimeline: source => source === 'sofa' ? sofaTimeline : null,
        getBetfairTrackingRuntime: () => runtime404,
        buildBetfairSessionHealth: () => ({ status: 'unknown', baseline: true }),
        getMatchPersistenceIntegrity: () => ({
            status: 'no_known_partial',
            reason: null,
            source: 'betfair',
            commitId: null,
            affectedDocuments: []
        })
    }
});

assert.equal(latestMissingNone.httpStatus, 404);
assert.equal(latestMissingNone.body.ok, false);
assert.equal(
    latestMissingNone.body.error,
    'Betfair JSON timeline not found for this event'
);
assert.equal(latestMissingNone.body.health.status, 'unknown');
assert.equal(
    Object.prototype.hasOwnProperty.call(latestMissingNone.body, 'integrity'),
    false
);

// T4: /latest timeline assente + partial_persistence noto
const latestMissingPartial = await buildLatestBetfairPayload({
    eventId: 'latest-missing-partial',
    dependencies: {
        now: new Date('2026-06-24T11:00:00.000Z'),
        checkCdpStatus: async () => null,
        loadTimeline: source => source === 'sofa' ? sofaTimeline : null,
        getBetfairTrackingRuntime: () => runtime404,
        buildBetfairSessionHealth: () => ({ status: 'unknown', baseline: true }),
        getMatchPersistenceIntegrity: () => ({
            status: 'partial_persistence',
            reason: 'pending_commit',
            source: 'betfair',
            commitId: 'betfair-commit-3',
            affectedDocuments: ['timeline']
        })
    }
});

assert.equal(latestMissingPartial.httpStatus, 409);
assert.equal(latestMissingPartial.body.error, 'persistence_integrity');
assert.equal(latestMissingPartial.body.health.status, 'unknown');
assert.equal(latestMissingPartial.body.health.baseline, true);
assert.equal(latestMissingPartial.body.integrity.status, 'partial_persistence');

// T5: /latest timeline assente + recovery_failed noto
const latestMissingFailed = await buildLatestBetfairPayload({
    eventId: 'latest-missing-failed',
    dependencies: {
        now: new Date('2026-06-24T11:00:00.000Z'),
        checkCdpStatus: async () => null,
        loadTimeline: source => source === 'sofa' ? sofaTimeline : null,
        getBetfairTrackingRuntime: () => runtime404,
        buildBetfairSessionHealth: () => ({ status: 'unknown', baseline: true }),
        getMatchPersistenceIntegrity: () => ({
            status: 'recovery_failed',
            reason: 'recovery_failed',
            source: 'betfair',
            commitId: 'betfair-commit-4',
            affectedDocuments: ['history', 'timeline']
        })
    }
});

assert.equal(latestMissingFailed.httpStatus, 409);
assert.equal(latestMissingFailed.body.error, 'persistence_integrity');
assert.equal(latestMissingFailed.body.health.status, 'unknown');
assert.equal(latestMissingFailed.body.integrity.status, 'recovery_failed');

