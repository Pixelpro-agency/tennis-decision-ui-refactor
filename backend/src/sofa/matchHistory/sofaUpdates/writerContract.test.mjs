import assert from 'node:assert/strict';
import { createSofaUpdateHandler } from '../sofaUpdates.js';
import {
    clone,
    createHarness,
    createJournal,
    createSofaData,
    emptyDocuments,
    expectedResult,
    finish,
    numericBetfair,
    test
} from './sofaUpdatesTestFixtures.mjs';

test('T10-writer-success-with-wrong-target-is-persistence-failure', () => {
    const harness = createHarness({
        writeHistoryDocument: () => ({ ok: true, file: '/history/wrong.json' })
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        documents: {
            history: { ok: true, status: null, file: '/history/wrong.json', reason: null },
            timeline: { ok: null, status: null, file: null, reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 0);
    assert.equal(harness.journal.records.get('commit-1').documents.history.completed, false);
});

test("T22-timeline-writer-file-mismatch-keeps-pending-and-uses-original-payload", () => {
    let failTimeline = true;
    const harness = createHarness({
        writeTimelineDocument: (call, count) => (
            failTimeline
                ? { ok: true, status: 'written', file: '/timeline/wrong.json', commitId: call.commitId }
                : { ok: true, status: 'written', file: call.target, commitId: call.commitId }
        )
    });

    const first = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.equal(first.status, 'partial');
    assert.equal(first.failedDocument, 'timeline');
    assert.equal(first.documents.timeline.file, '/timeline/wrong.json');

    const pending = clone(harness.journal.records.get('commit-1'));
    assert.equal(pending.documents.timeline.completed, false);

    failTimeline = false;
    const resumed = harness.handler(
        'event-1',
        createSofaData({ score: { current: '9-9' } }),
        'Ignored',
        '2099-01-01'
    );

    assert.equal(resumed.status, 'complete');
    assert.equal(harness.timelineWrites.length, 2);
    assert.deepEqual(
        harness.timelineWrites[1].document,
        pending.documents.timeline.payload.document
    );
    assert.equal(harness.timelineWrites[1].target, pending.documents.timeline.target);
});

test("T23-writer-commitId-mismatch-blocks-document-completion", () => {
    const harness = createHarness({
        writeHistoryDocument: (call, count) => ({
            ok: true,
            status: 'written',
            file: call.target,
            commitId: 'wrong-commit-id'
        })
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: null, status: null, file: null, reason: null }
        }
    }));
    assert.equal(harness.journal.records.get('commit-1').documents.history.completed, false);
    assert.equal(harness.timelineWrites.length, 0);
});

test('T27-history-writer-undefined-is-failed-without-timeline', () => {
    const harness = createHarness({
        writeHistoryDocument: () => undefined
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        commitId: 'commit-1',
        status: 'failed',
        reason: 'persistence_incomplete',
        failedDocument: 'history',
        documents: {
            history: { ok: null, status: null, file: null, reason: null },
            timeline: { ok: null, status: null, file: null, reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 0);

    const pending = harness.journal.records.get('commit-1');
    assert.equal(pending.documents.history.completed, false);
    assert.equal(pending.documents.timeline.completed, false);
});

test('T28-timeline-writer-undefined-is-partial-with-pending', () => {
    const harness = createHarness({
        writeTimelineDocument: () => undefined
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        commitId: 'commit-1',
        status: 'partial',
        reason: 'persistence_incomplete',
        failedDocument: 'timeline',
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: null, status: null, file: null, reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);

    const pending = harness.journal.records.get('commit-1');
    assert.equal(pending.documents.history.completed, true);
    assert.equal(pending.documents.timeline.completed, false);
});

finish('sofaUpdates/writer');
