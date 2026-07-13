import assert from 'node:assert/strict';
import {
    persistSofaTrackingSample,
    updateSofa,
    normalizeSofaCommitResult
} from '../trackerUpdate.js';
import {
    fakePayload,
    snapshot,
    localContext,
    completeSofaSuccessEnvelope,
    createDependencies
} from './trackerUpdateTestFixtures.mjs';

for (const action of ['bootstrapped', 'buffered', 'blocked']) {
    let persistCount = 0;

    const result = await updateSofa(`event-test-${action}`, {}, createDependencies({
        observeSofaSourceIdentitySample: () => ({ action }),
        persistSofaTrackingSample: () => {
            persistCount += 1;
            return { ok: true, status: 'written' };
        }
    }));

    assert.equal(persistCount, 0);
    assert.equal(result.ok, true);
    assert.equal(result.operation, 'sofa_commit');
    assert.equal(result.source, 'sofa');
    assert.equal(result.eventId, `event-test-${action}`);
    assert.equal(result.status, 'unchanged');
    assert.equal(result.reason, null);
    assert.equal(result.failedDocument, null);
    assert.equal(result.commitId, null);
    assert.deepEqual(result.documents, {
        history: { ok: null, status: null, file: null, reason: null },
        timeline: { ok: null, status: null, file: null, reason: null }
    });
    assert.deepEqual(result.warnings, [`source_identity_gate:${action}`]);
    assert.equal(normalizeSofaCommitResult(result, `event-test-${action}`), result);
}

for (const action of ['persist-current', 'no-gate']) {
    let observedSample = null;
    let persisted = null;

    await updateSofa('event-test', {}, createDependencies({
        observeSofaSourceIdentitySample: (eventId, sample) => {
            assert.equal(eventId, 'event-test');
            observedSample = sample;
            return { action };
        },
        persistSofaTrackingSample: (
            eventId,
            receivedSnapshot,
            tournamentName,
            dateStr,
            timelineData
        ) => {
            persisted = {
                eventId,
                receivedSnapshot,
                tournamentName,
                dateStr,
                timelineData
            };
            return { ok: true, status: 'written' };
        }
    }));

    assert.deepEqual(Object.keys(observedSample).sort(), [
        'dateStr',
        'snapshot',
        'tournamentName'
    ]);

    assert.equal(observedSample.snapshot, snapshot);
    assert.equal(persisted.eventId, 'event-test');
    assert.equal(persisted.receivedSnapshot, snapshot);
    assert.equal(persisted.tournamentName, 'Fake Open');
    assert.equal(persisted.dateStr, '2024-06-27');

    assert.deepEqual(persisted.timelineData, {
        snapshot,
        localContext
    });
    assert.equal(persisted.timelineData.localContext.recent.available, true);
    assert.deepEqual(
        persisted.timelineData.localContext.recent.window.games,
        [
            { set: 2, game: 7 },
            { set: 2, game: 8 },
            { set: 2, game: 9 }
        ]
    );
}

{
    const commitResult = {
        ok: false,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: 'event-preserved-failure',
        commitId: 'commit-preserved',
        status: 'partial',
        reason: 'persistence_incomplete',
        failedDocument: 'timeline',
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-preserved-failure.json', reason: null },
            timeline: { ok: false, status: 'failed', file: null, reason: 'write_failed' }
        },
        warnings: []
    };

    const result = await updateSofa('event-preserved-failure', {}, createDependencies({
        observeSofaSourceIdentitySample: () => ({ action: 'persist-current' }),
        persistSofaTrackingSample: () => commitResult
    }));

    assert.equal(result, commitResult);
    assert.equal(result.ok, false);
    assert.equal(result.commitId, 'commit-preserved');
    assert.equal(result.failedDocument, 'timeline');
}

{
    let observedPersistenceData = null;
    let persistCount = 0;

    await updateSofa('event-context-forward', {}, createDependencies({
        observeSofaSourceIdentitySample: (eventId, sample, persistenceData) => {
            assert.equal(eventId, 'event-context-forward');
            assert.equal(sample.snapshot, snapshot);
            observedPersistenceData = persistenceData;
            return { action: 'persist-current' };
        },
        persistSofaTrackingSample: (
            eventId,
            receivedSnapshot,
            tournamentName,
            dateStr,
            timelineData
        ) => {
            persistCount++;
            assert.equal(eventId, 'event-context-forward');
            assert.equal(receivedSnapshot, snapshot);
            assert.equal(tournamentName, 'Fake Open');
            assert.equal(dateStr, '2024-06-27');
            assert.deepEqual(timelineData, { snapshot, localContext });
            return { ok: true };
        }
    }));

    assert.deepEqual(observedPersistenceData, { localContext });
    assert.equal(persistCount, 1);
}

console.log('trackerUpdate/gateRouting.test: OK');
