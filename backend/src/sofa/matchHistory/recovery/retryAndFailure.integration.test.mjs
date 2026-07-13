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

await test('T03-betfair-pending-single-document', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-betfair' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'betfair-commit-1', betfair: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-betfair' },
            timeline: [{
                timestamp: '2026-07-07T12:00:00.000Z',
                elapsedSeconds: 0,
                data: {
                    source: 'betfair',
                    seq: 5,
                    commitId: 'betfair-commit-1',
                    runners: []
                }
            }]
        };

        fixture.writeJournal('betfair-commit-1', makeRecord({
            commitId: 'betfair-commit-1',
            eventId: 'event-betfair',
            source: 'betfair',
            historyCompleted: true,
            timelineCompleted: false,
            historyDocument,
            timelineDocument
        }));

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 1);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 1);
        assert.equal(fixture.timelineWrites[0].commitId, 'betfair-commit-1');
        assert.equal(fixture.timelineWrites[0].source, 'betfair');
        assert.deepEqual(fixture.timelineWrites[0].document, timelineDocument);
        assert.equal(fixture.timelineWrites[0].target, '/timeline/betfair_event-betfair.json');
        assert.equal(fixture.timelineWrites[0].document.timeline[0].data.seq, 5);
        assert.equal(countJournalFiles(fixture), 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T06-writer-failure-is-retryable', async () => {
    const fixture = createFixture();
    try {
        fixture.dependencies.writeHistoryDocument = (eventId, document, metadata, target, commitId) => {
            fixture.historyWrites.push({ eventId, document, metadata, target, commitId });
            return { ok: false, status: 'failed', file: null, reason: 'disk_full' };
        };

        fixture.writeJournal('writer-fail-1', makeRecord({
            commitId: 'writer-fail-1',
            eventId: 'event-writer-fail',
            source: 'sofa',
            historyCompleted: false,
            timelineCompleted: true,
            historyDocument: { metadata: { eventId: 'event-writer-fail' }, history: [] },
            timelineDocument: { metadata: { eventId: 'event-writer-fail' }, timeline: [] }
        }));

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 1);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 0);

        const record = fixture.journalStore.getPendingCommit('writer-fail-1');
        assert.equal(record.status, 'pending');
        assert.equal(record.documents.history.completed, false);
    } finally {
        fixture.cleanup();
    }
});

await test('T08-already-recovery-failed', async () => {
    const fixture = createFixture();
    try {
        fixture.writeJournal('already-failed-1', makeRecord({
            commitId: 'already-failed-1',
            eventId: 'event-already-failed',
            source: 'sofa',
            status: 'recovery_failed',
            reason: 'history_write_failed',
            historyCompleted: false,
            timelineCompleted: false,
            historyDocument: { metadata: { eventId: 'event-already-failed' }, history: [] },
            timelineDocument: { metadata: { eventId: 'event-already-failed' }, timeline: [] }
        }));

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(summary.alreadyRecoveryFailed, 1);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const outcome = summary.outcomes[0];
        assert.equal(outcome.category, 'already_recovery_failed');
        assert.equal(outcome.reason, 'history_write_failed');
    } finally {
        fixture.cleanup();
    }
});

await test('T10-consecutive-recovery-is-idempotent', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-idempotent' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'idempotent-1', sofa: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-idempotent' },
            timeline: [{
                timestamp: '2026-07-07T12:00:00.000Z',
                elapsedSeconds: 0,
                data: { source: 'sofa', seq: 1, commitId: 'idempotent-1' }
            }]
        };

        fixture.writeJournal('idempotent-1', makeRecord({
            commitId: 'idempotent-1',
            eventId: 'event-idempotent',
            source: 'sofa',
            historyCompleted: false,
            timelineCompleted: false,
            historyDocument,
            timelineDocument
        }));

        const first = await runPendingCommitRecovery(fixture.dependencies);
        assert.equal(first.recovered, 1);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 1);
        assert.equal(countJournalFiles(fixture), 0);

        const firstHistory = fixture.historyWrites[0].document;
        const firstTimeline = fixture.timelineWrites[0].document;

        const second = await runPendingCommitRecovery(fixture.dependencies);
        assert.equal(second.scanned, 0);
        assert.equal(second.recovered, 0);
        assert.equal(second.cleaned, 0);
        assert.equal(second.retryablePending, 0);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 1);
        assert.deepEqual(fixture.historyWrites[0].document, firstHistory);
        assert.deepEqual(fixture.timelineWrites[0].document, firstTimeline);
    } finally {
        fixture.cleanup();
    }
});

await test('T14-mark-recovery-failed-write-failure-is-retryable', async () => {
    const fixture = createFixture();
    try {
        const originalMark = fixture.journalStore.markRecoveryFailed.bind(fixture.journalStore);
        fixture.journalStore.markRecoveryFailed = function (commitId, reason) {
            if (commitId === 'mark-fail-1') {
                return { ok: false, status: 'failed', reason: 'write_failed' };
            }
            return originalMark(commitId, reason);
        };

        fixture.writeJournal('mark-fail-1', {
            version: 1,
            commitId: 'mark-fail-1',
            eventId: 'event-mark-fail',
            source: 'sofa',
            createdAt: new Date().toISOString(),
            status: 'pending',
            reason: null,
            documents: {
                history: {
                    target: '',
                    payload: { document: { metadata: {} }, metadata: {} },
                    completed: false
                },
                timeline: {
                    target: '/timeline/sofa_event-mark-fail.json',
                    payload: { document: { metadata: {} }, metadata: {} },
                    completed: true
                }
            }
        });

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 1);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(summary.alreadyRecoveryFailed, 0);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const raw = JSON.parse(fs.readFileSync(fixture.journalFile('mark-fail-1'), 'utf8'));
        assert.equal(raw.status, 'pending');
    } finally {
        fixture.cleanup();
    }
});

await test('T15-recovery-failed-valid-record-is-already-failed', async () => {
    const fixture = createFixture();
    try {
        fixture.writeJournal('valid-failed-1', makeRecord({
            commitId: 'valid-failed-1',
            eventId: 'event-valid-failed',
            source: 'sofa',
            status: 'recovery_failed',
            reason: 'history_write_failed',
            historyCompleted: false,
            timelineCompleted: false,
            historyDocument: { metadata: { eventId: 'event-valid-failed' }, history: [] },
            timelineDocument: { metadata: { eventId: 'event-valid-failed' }, timeline: [] }
        }));

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(summary.recoveryFailed, 0);
        assert.equal(summary.alreadyRecoveryFailed, 1);
        assert.equal(fixture.historyWrites.length, 0);
        assert.equal(fixture.timelineWrites.length, 0);

        const outcome = summary.outcomes[0];
        assert.equal(outcome.category, 'already_recovery_failed');
        assert.equal(outcome.reason, 'history_write_failed');
    } finally {
        fixture.cleanup();
    }
});

await test('T20-completed-both-targets-missing', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-missing-both' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'missing-both-1', sofa: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-missing-both' },
            timeline: [{
                timestamp: '2026-07-07T12:00:00.000Z',
                elapsedSeconds: 0,
                data: { source: 'sofa', seq: 1, commitId: 'missing-both-1' }
            }]
        };

        fixture.writeJournal('missing-both-1', makeRecord({
            commitId: 'missing-both-1',
            eventId: 'event-missing-both',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument,
            timelineDocument
        }));

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 1);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 0);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(fixture.timelineWrites.length, 1);
        assert.deepEqual(fixture.historyWrites[0].document, historyDocument);
        assert.deepEqual(fixture.timelineWrites[0].document, timelineDocument);
        assert.equal(countJournalFiles(fixture), 0);
    } finally {
        fixture.cleanup();
    }
});

await test('T22-completed-missing-repair-fails', async () => {
    const fixture = createFixture();
    try {
        const historyDocument = {
            metadata: { eventId: 'event-repair-fail' },
            history: [{ timestamp: '2026-07-07T12:00:00.000Z', commitId: 'repair-fail-1', sofa: {} }]
        };
        const timelineDocument = {
            metadata: { eventId: 'event-repair-fail' },
            timeline: []
        };

        fixture.writeJournal('repair-fail-1', makeRecord({
            commitId: 'repair-fail-1',
            eventId: 'event-repair-fail',
            source: 'sofa',
            historyCompleted: true,
            timelineCompleted: true,
            historyDocument,
            timelineDocument
        }));

        fixture.dependencies.writeHistoryDocument = (eventId, document, metadata, target, commitId) => {
            fixture.historyWrites.push({ eventId, document, metadata, target, commitId });
            return { ok: false, status: 'failed', file: null, reason: 'disk_full' };
        };

        const summary = await runPendingCommitRecovery(fixture.dependencies);

        assert.equal(summary.ok, true);
        assert.equal(summary.scanned, 1);
        assert.equal(summary.recovered, 0);
        assert.equal(summary.cleaned, 0);
        assert.equal(summary.retryablePending, 1);
        assert.equal(fixture.historyWrites.length, 1);
        assert.equal(countJournalFiles(fixture), 1);

        const record = fixture.journalStore.getPendingCommit('repair-fail-1');
        assert.equal(record.documents.history.completed, false);
        assert.equal(record.documents.timeline.completed, false);

        const outcome = summary.outcomes[0];
        assert.equal(outcome.category, 'retryable_pending');
        assert.equal(outcome.failedDocument, 'history');
    } finally {
        fixture.cleanup();
    }
});

finish('recovery/retry');
