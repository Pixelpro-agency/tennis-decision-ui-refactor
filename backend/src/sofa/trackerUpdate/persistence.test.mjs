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

{
    const incomingTimelineData = { snapshot };
    const originalTimelineData = structuredClone(incomingTimelineData);
    const builtContext = {
        version: 1,
        available: true,
        id: 'built-context'
    };
    let persisted = null;

    const result = persistSofaTrackingSample(
        'event-bootstrap',
        snapshot,
        'Bootstrap Open',
        '2026-06-29',
        incomingTimelineData,
        {
            buildLocalContext: receivedSnapshot => {
                assert.equal(receivedSnapshot, snapshot);
                return builtContext;
            },
            addSofaUpdate: (
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
                return completeSofaSuccessEnvelope('event-bootstrap');
            }
        }
    );

    assert.equal(result?.ok, true);
    assert.equal(result?.operation, 'sofa_commit');
    assert.equal(result?.source, 'sofa');
    assert.equal(result?.eventId, 'event-bootstrap');
    assert.equal(result?.status, 'complete');
    assert.equal(result?.reason, null);
    assert.equal(result?.failedDocument, null);
    assert.deepEqual(Object.keys(result?.documents || {}).sort(), ['history', 'timeline']);
    assert.deepEqual(result?.warnings, []);
    assert.deepEqual(incomingTimelineData, originalTimelineData);
    assert.equal(persisted.eventId, 'event-bootstrap');
    assert.equal(persisted.receivedSnapshot, snapshot);
    assert.equal(persisted.tournamentName, 'Bootstrap Open');
    assert.equal(persisted.dateStr, '2026-06-29');
    assert.deepEqual(persisted.timelineData, {
        snapshot,
        localContext: builtContext
    });
}

{
    const existingContext = {
        version: 1,
        available: true,
        id: 'existing-context'
    };
    let buildCount = 0;
    let persisted = null;

    persistSofaTrackingSample(
        'event-existing',
        snapshot,
        'Existing Open',
        '2026-06-29',
        {
            snapshot,
            localContext: existingContext
        },
        {
            buildLocalContext: () => {
                buildCount += 1;
                throw new Error('must not build when context is provided');
            },
            addSofaUpdate: (
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
                return completeSofaSuccessEnvelope('event-existing');
            }
        }
    );

    assert.equal(buildCount, 0);
    assert.equal(persisted.timelineData.localContext, existingContext);
    assert.equal(persisted.timelineData.snapshot, snapshot);
}

{
    const builtContext = {
        version: 1,
        available: false,
        id: 'null-timeline-context'
    };
    let persisted = null;

    persistSofaTrackingSample(
        'event-null',
        snapshot,
        'Null Open',
        '2026-06-29',
        null,
        {
            buildLocalContext: receivedSnapshot => {
                assert.equal(receivedSnapshot, snapshot);
                return builtContext;
            },
            addSofaUpdate: (
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
                return completeSofaSuccessEnvelope('event-null');
            }
        }
    );

    assert.equal(persisted.timelineData.snapshot, snapshot);
    assert.equal(persisted.timelineData.localContext, builtContext);
}

{
    const result = persistSofaTrackingSample(
        'event-undefined-updater',
        snapshot,
        'Failure Open',
        '2026-06-29',
        {},
        {
            buildLocalContext: () => ({ available: true }),
            addSofaUpdate: () => undefined
        }
    );

    assert.equal(result.ok, false);
    assert.equal(result.operation, 'sofa_commit');
    assert.equal(result.source, 'sofa');
    assert.equal(result.eventId, 'event-undefined-updater');
    assert.equal(result.commitId, null);
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'persistence_incomplete');
    assert.equal(result.failedDocument, null);
    assert.deepEqual(Object.keys(result.documents).sort(), ['history', 'timeline']);
    assert.deepEqual(result.warnings, []);
}

{
    const commitResult = {
        ok: false,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: 'event-full-result',
        commitId: 'commit-full-result',
        status: 'partial',
        reason: 'persistence_incomplete',
        failedDocument: 'timeline',
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-full-result.json', reason: null },
            timeline: { ok: false, status: 'failed', file: null, reason: 'write_failed' }
        },
        warnings: []
    };

    const result = persistSofaTrackingSample(
        'event-full-result',
        snapshot,
        'Full Result Open',
        '2026-06-29',
        {},
        {
            buildLocalContext: () => ({ available: true }),
            addSofaUpdate: () => commitResult
        }
    );

    assert.equal(result, commitResult);
}

console.log('trackerUpdate/persistence.test: OK');
