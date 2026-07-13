import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createCommitJournalStore } from '../commitJournal.js';
import { runPendingCommitRecovery } from '../recovery.js';
import { repairSofaCommitFromJournal } from '../sofaUpdates.js';
import { repairBetfairCommitFromJournal } from '../../betfair/processor.js';
import {
    countJournalFiles,
    createFixture,
    finish,
    makeRecord,
    makeTempRoot,
    test
} from './recoveryTestFixtures.mjs';

await test('T04-completed-residual-cleanup', async () => {
    const fixture = createFixture();
    try {
        fixture.writeJournal('completed-commit-1', makeRecord({
            commitId: 'completed-commit-1',
            eventId: 'event-completed',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument: { metadata: { eventId: 'event-completed' }, history: [] },
            timelineDocument: { metadata: { eventId: 'event-completed' }, timeline: [] }
        }));

        fixture.verifiedTargets.add('/history/event-completed.json');
        fixture.verifiedTargets.add('/timeline/sofa_event-completed.json');

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 1);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);
        assert.equal(countJournalFiles(fixture), 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T07-cleanup-failure-is-retryable', async () => {
    const fixture = createFixture();
    try {
        const originalRemove = fixture.journalStore.removeCompletedCommit.bind(fixture.journalStore);
        fixture.journalStore.removeCompletedCommit = function (commitId) {
            if (commitId === 'cleanup-fail-1') {
                return { ok: false, status: 'failed', reason: 'write_failed' };
            }
            return originalRemove(commitId);
        };

        fixture.writeJournal('cleanup-fail-1', makeRecord({
            commitId: 'cleanup-fail-1',
            eventId: 'event-cleanup-fail',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument: { metadata: { eventId: 'event-cleanup-fail' }, history: [] },
            timelineDocument: { metadata: { eventId: 'event-cleanup-fail' }, timeline: [] }
        }));

        fixture.verifiedTargets.add('/history/event-cleanup-fail.json');
        fixture.verifiedTargets.add('/timeline/sofa_event-cleanup-fail.json');

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 1);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const record = fixture.journalStore.getPendingCommit('cleanup-fail-1');
        assert.equal(record.documents.history.completed, true);
        assert.equal(record.documents.timeline.completed, true);
    } finally {
        fixture.cleanup();
    }
});

await test('T18-completed-history-target-missing', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-missing-history' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'missing-history-1', sofa: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-missing-history' },
            timeline: []
        };

        fixture.writeJournal('missing-history-1', makeRecord({
            commitId: 'missing-history-1',
            eventId: 'event-missing-history',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument,
            timelineDocument
        }));

        fixture.verifiedTargets.add('/timeline/sofa_event-missing-history.json');

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 1);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 0);
        assert.deepEqual(fixture.historyWrites[0].document, historyDocument);
        assert.equal(fixture.historyWrites[0].target, '/history/event-missing-history.json');
        assert.equal(countJournalFiles(fixture), 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T19-completed-timeline-target-missing', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-missing-timeline' },
            history: []
        };
        const timelineDocument = {
            metadata: { eventId: 'event-missing-timeline' },
            timeline: [{
                timestamp: '2026-07-07T12:00:00.000Z',
                elapsedSeconds: 0,
                data: { source: 'sofa', seq: 1, commitId: 'missing-timeline-1' }
            }]
        };

        fixture.writeJournal('missing-timeline-1', makeRecord({
            commitId: 'missing-timeline-1',
            eventId: 'event-missing-timeline',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument,
            timelineDocument
        }));

        fixture.verifiedTargets.add('/history/event-missing-timeline.json');

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 1);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 1);
        assert.deepEqual(fixture.timelineWrites[0].document, timelineDocument);
        assert.equal(fixture.timelineWrites[0].target, '/timeline/sofa_event-missing-timeline.json');
        assert.equal(countJournalFiles(fixture), 0);
    } finally {
        fixture.cleanup();
    }
});

finish('recovery/targets');
