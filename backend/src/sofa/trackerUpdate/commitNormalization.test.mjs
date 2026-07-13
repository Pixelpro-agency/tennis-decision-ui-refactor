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
    const result = normalizeSofaCommitResult(
        { ok: false, operation: 'sofa_commit', source: 'sofa' },
        'event-incomplete-false'
    );

    assert.equal(result.ok, false);
    assert.equal(result.operation, 'sofa_commit');
    assert.equal(result.source, 'sofa');
    assert.equal(result.eventId, 'event-incomplete-false');
    assert.equal(result.commitId, null);
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'persistence_incomplete');
    assert.equal(result.failedDocument, null);
    assert.deepEqual(Object.keys(result.documents).sort(), ['history', 'timeline']);
    assert.deepEqual(result.warnings, []);
}

{
    const result = normalizeSofaCommitResult(
        { ok: true, operation: 'sofa_commit', source: 'sofa' },
        'event-incomplete-true'
    );

    assert.equal(result.ok, false);
    assert.equal(result.operation, 'sofa_commit');
    assert.equal(result.source, 'sofa');
    assert.equal(result.eventId, 'event-incomplete-true');
    assert.equal(result.commitId, null);
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'persistence_incomplete');
    assert.equal(result.failedDocument, null);
    assert.deepEqual(Object.keys(result.documents).sort(), ['history', 'timeline']);
    assert.deepEqual(result.warnings, []);
}

{
    const commitResult = {
        ok: true,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: 'event-complete',
        commitId: 'sofa-complete-123',
        status: 'complete',
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-complete.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-complete.json', reason: null }
        },
        warnings: ['warn-1']
    };

    const result = normalizeSofaCommitResult(commitResult, 'event-complete');

    assert.equal(result, commitResult);
    assert.equal(result.commitId, 'sofa-complete-123');
    assert.deepEqual(result.documents, commitResult.documents);
    assert.deepEqual(result.warnings, ['warn-1']);
}

{
    const commitResult = {
        ok: true,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: null,
        commitId: 'sofa-complete-123',
        status: 'complete',
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-null.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-null.json', reason: null }
        },
        warnings: []
    };

    const result = normalizeSofaCommitResult(commitResult, 'event-expected');

    assert.equal(result.ok, false);
    assert.equal(result.eventId, 'event-expected');
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'persistence_incomplete');
    assert.equal(result.failedDocument, null);
    assert.deepEqual(result.warnings, []);
}

{
    const commitResult = {
        ok: true,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: 'event-diverso',
        commitId: 'sofa-complete-123',
        status: 'complete',
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-diverso.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-diverso.json', reason: null }
        },
        warnings: []
    };

    const result = normalizeSofaCommitResult(commitResult, 'event-atteso');

    assert.equal(result.ok, false);
    assert.equal(result.eventId, 'event-atteso');
    assert.equal(result.status, 'failed');
    assert.equal(result.reason, 'persistence_incomplete');
    assert.equal(result.failedDocument, null);
    assert.deepEqual(result.warnings, []);
}

console.log('trackerUpdate/commitNormalization.test: OK');
