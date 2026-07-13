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

test('T04-history-failure-leaves-journal-and-skips-timeline', () => {
    const harness = createHarness({
        writeHistoryDocument: () => ({ ok: false, file: null })
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        documents: {
            history: { ok: false, status: null, file: null, reason: null },
            timeline: { ok: null, status: null, file: null, reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 0);

    const pending = harness.journal.records.get('commit-1');
    assert.equal(pending.documents.history.completed, false);
    assert.equal(pending.documents.timeline.completed, false);
});

test('T05-timeline-failure-resumes-exact-journal-payload-without-history-rewrite', () => {
    let failTimeline = true;
    const harness = createHarness({
        writeTimelineDocument: (call, count) => (
            failTimeline
                ? { ok: false, file: null }
                : { ok: true, status: 'written', file: call.target, commitId: call.commitId }
        )
    });
    const firstSnapshot = createSofaData();
    const firstContext = { recent: { available: true }, marker: 'opaque-context' };

    const first = harness.handler(
        'event-1',
        firstSnapshot,
        'Tournament',
        '2026-06-22',
        { snapshot: firstSnapshot, localContext: firstContext }
    );

    assert.deepEqual(first, expectedResult({
        status: 'partial',
        failedDocument: 'timeline',
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: false, status: null, file: null, reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);

    const pending = clone(harness.journal.records.get('commit-1'));
    assert.equal(pending.documents.history.completed, true);
    assert.equal(pending.documents.timeline.completed, false);
    assert.equal(pending.commitId, 'commit-1');
    assert.equal(pending.documents.history.payload.document.history[0].commitId, 'commit-1');
    assert.equal(pending.documents.timeline.payload.document.timeline[0].data.commitId, 'commit-1');

    failTimeline = false;
    const resumed = harness.handler(
        'event-1',
        createSofaData({ score: { current: '9-9' } }),
        'Different tournament must not be used',
        '2099-01-01',
        { snapshot: { changed: true }, localContext: { changed: true } }
    );

    assert.deepEqual(resumed, expectedResult({
        ok: true,
        status: 'complete',
        reason: null,
        failedDocument: null,
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 2);
    assert.equal(harness.timelineWrites[1].commitId, 'commit-1');
    assert.deepEqual(
        harness.timelineWrites[1].document,
        pending.documents.timeline.payload.document
    );
    assert.deepEqual(
        harness.timelineWrites[1].metadata,
        pending.documents.timeline.payload.metadata
    );
    assert.equal(harness.timelineWrites[1].target, pending.documents.timeline.target);
    assert.equal(harness.journal.records.size, 0);
});

test('T07-cleanup-failure-keeps-complete-journal-for-explicit-residual-handling', () => {
    const harness = createHarness({
        journalOptions: {
            removeCompletedCommit: () => ({
                ok: false,
                status: 'failed',
                reason: 'write_failed'
            })
        }
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        status: 'failed',
        reason: 'journal_cleanup_failed',
        failedDocument: 'journal',
        documents: {
            history: { ok: true, status: 'written', file: '/history/event-1.json', reason: null },
            timeline: { ok: true, status: 'written', file: '/timeline/sofa_event-1.json', reason: null }
        }
    }));
    const residual = harness.journal.records.get('commit-1');
    assert.equal(residual.documents.history.completed, true);
    assert.equal(residual.documents.timeline.completed, true);
});

test('T08-recovery-failed-journal-never-recomputes-or-writes', () => {
    const journal = createJournal();
    journal.records.set('recovery-1', {
        commitId: 'recovery-1',
        eventId: 'event-1',
        source: 'sofa',
        status: 'recovery_failed',
        documents: {
            history: {
                target: '/history/event-1.json',
                payload: { document: { metadata: {}, history: [] }, metadata: {} },
                completed: false
            },
            timeline: {
                target: '/timeline/sofa_event-1.json',
                payload: { document: { metadata: {}, timeline: [] }, metadata: {} },
                completed: false
            }
        }
    });
    const harness = createHarness({ journal });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        commitId: 'recovery-1',
        status: 'failed',
        reason: 'recovery_required',
        failedDocument: 'journal'
    }));
    assert.equal(harness.historyWrites.length, 0);
    assert.equal(harness.timelineWrites.length, 0);
});

test('T09-journal-create-failure-is-normalized-to-contract-reason', () => {
    const harness = createHarness({
        journalOptions: {
            createPendingCommit: () => ({
                ok: false,
                status: 'failed',
                reason: 'pending_exists'
            })
        }
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        status: 'failed',
        reason: 'journal_write_failed',
        failedDocument: 'journal'
    }));
    assert.equal(harness.historyWrites.length, 0);
    assert.equal(harness.timelineWrites.length, 0);
});

test("T20-timeline-failure-retry-keeps-same-commitId", () => {
    let failTimeline = true;
    const harness = createHarness({
        writeTimelineDocument: (call, count) => (
            failTimeline
                ? { ok: false, file: null }
                : { ok: true, status: 'written', file: call.target, commitId: call.commitId }
        )
    });

    const first = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.equal(first.commitId, 'commit-1');
    assert.equal(first.status, 'partial');
    assert.equal(harness.historyWrites[0].commitId, 'commit-1');

    failTimeline = false;
    const resumed = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.equal(resumed.commitId, 'commit-1');
    assert.equal(resumed.status, 'complete');
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 2);
    assert.equal(harness.timelineWrites[1].commitId, 'commit-1');
    assert.equal(
        harness.historyDocuments.get('event-1').history.length,
        1
    );
    assert.equal(
        harness.timelineDocuments.get('sofa:event-1').timeline.length,
        1
    );
});

test("T21-history-mark-failure-retry-rewrites-history-and-keeps-commitId", () => {
    let failHistoryMark = true;
    const harness = createHarness({
        journalOptions: {
            markDocumentComplete: (commitId, documentName) => {
                if (documentName === 'history' && failHistoryMark) {
                    return { ok: false, status: 'failed', reason: 'write_failed' };
                }
                const record = harness.journal.records.get(commitId);
                if (!record) return { ok: false, status: 'failed', reason: 'not_found' };
                record.documents[documentName].completed = true;
                return { ok: true, operation: 'journal', status: 'updated', reason: null };
            }
        }
    });

    const first = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.equal(first.commitId, 'commit-1');
    assert.equal(first.status, 'partial');
    assert.equal(first.failedDocument, 'journal');
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 0);
    assert.equal(harness.journal.records.get('commit-1').documents.history.completed, false);

    failHistoryMark = false;
    const resumed = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.equal(resumed.commitId, 'commit-1');
    assert.equal(resumed.status, 'complete');
    assert.equal(harness.historyWrites.length, 2);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.historyWrites[0].commitId, 'commit-1');
    assert.equal(harness.historyWrites[1].commitId, 'commit-1');
    assert.equal(harness.timelineWrites[0].commitId, 'commit-1');
    assert.equal(harness.journal.records.size, 0);
});

test('T25-completed-residual-is-cleaned-before-duplicate-unchanged', () => {
    const harness = createHarness();
    const snapshot = createSofaData();

    const first = harness.handler(
        'event-1',
        snapshot,
        'Tournament',
        '2026-06-22'
    );
    assert.equal(first.status, 'complete');

    harness.journal.records.set('residual-1', {
        commitId: 'residual-1',
        eventId: 'event-1',
        source: 'sofa',
        status: 'pending',
        documents: {
            history: {
                target: '/history/event-1.json',
                payload: { document: harness.historyDocuments.get('event-1'), metadata: {} },
                completed: true
            },
            timeline: {
                target: '/timeline/sofa_event-1.json',
                payload: { document: harness.timelineDocuments.get('sofa:event-1'), metadata: {} },
                completed: true
            }
        }
    });

    const result = harness.handler(
        'event-1',
        snapshot,
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        ok: true,
        commitId: null,
        status: 'unchanged',
        reason: null,
        failedDocument: null
    }));
    assert.equal(harness.historyWrites.length, 1);
    assert.equal(harness.timelineWrites.length, 1);
    assert.equal(harness.journal.calls.removed.includes('residual-1'), true);
    assert.equal(harness.journal.records.has('residual-1'), false);
    assert.equal(harness.journal.calls.created.length, 1);
});

test('T26-completed-residual-cleanup-failure-blocks-all-writes', () => {
    const harness = createHarness({
        journalOptions: {
            removeCompletedCommit: (commitId, calls, records) => {
                if (commitId === 'residual-2') {
                    return { ok: false, status: 'failed', reason: 'write_failed' };
                }
                return null;
            }
        }
    });
    harness.journal.records.set('residual-2', {
        commitId: 'residual-2',
        eventId: 'event-1',
        source: 'sofa',
        status: 'pending',
        documents: {
            history: {
                target: '/history/event-1.json',
                payload: { document: { metadata: {}, history: [] }, metadata: {} },
                completed: true
            },
            timeline: {
                target: '/timeline/sofa_event-1.json',
                payload: { document: { metadata: {}, timeline: [] }, metadata: {} },
                completed: true
            }
        }
    });

    const result = harness.handler(
        'event-1',
        createSofaData(),
        'Tournament',
        '2026-06-22'
    );

    assert.deepEqual(result, expectedResult({
        commitId: 'residual-2',
        status: 'failed',
        reason: 'journal_cleanup_failed',
        failedDocument: 'journal',
        documents: emptyDocuments()
    }));
    assert.equal(harness.historyWrites.length, 0);
    assert.equal(harness.timelineWrites.length, 0);
    assert.equal(harness.journal.calls.created.length, 0);
    assert.equal(harness.journal.records.has('residual-2'), true);
});

finish('sofaUpdates/recovery');
