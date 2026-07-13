import path from 'node:path';
import fsDefault from 'node:fs';
import os from 'node:os';
import { createHistoryStorage } from '../storage.js';
import { createCommitJournalStore } from '../commitJournal.js';
import {
    assert,
    countFiles,
    createFakeFs,
    createFixture,
    finish,
    journalFile,
    makeRecord
} from './commitJournalTestFixtures.mjs';

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({ commitId: 'commit-create', eventId: 'event-create' });
    const result = store.createPendingCommit(record);
    const file = journalFile(journalDir, record.commitId);
    const persisted = JSON.parse(fake.files.get(file));

    assert(
        'T01-create-pending-commit',
        result.ok === true &&
            result.operation === 'journal' &&
            result.eventId === 'event-create' &&
            result.source === 'sofa' &&
            result.commitId === 'commit-create' &&
            result.status === 'created' &&
            result.reason === null &&
            result.file === file &&
            persisted.version === 1 &&
            persisted.status === 'pending' &&
            persisted.reason === null &&
            persisted.createdAt === '2026-07-05T12:00:00.000Z' &&
            persisted.documents.history.completed === false &&
            persisted.documents.timeline.completed === false &&
            countFiles(fake, fileName => fileName.endsWith('.tmp')) === 0
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({ commitId: 'commit-rename', eventId: 'event-rename' });
    store.createPendingCommit(record);

    const file = journalFile(journalDir, record.commitId);
    const before = fake.files.get(file);
    const originalRename = fake.fs.renameSync;

    fake.fs.renameSync = () => {
        throw new Error('rename failure');
    };

    const result = store.markDocumentComplete(record.commitId, 'history');
    fake.fs.renameSync = originalRename;

    assert(
        'T02-rename-failure-preserves-existing-journal',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'write_failed' &&
            fake.files.get(file) === before &&
            countFiles(fake, fileName => fileName.endsWith('.tmp')) === 0
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({ commitId: 'commit-same', eventId: 'event-same' });
    const first = store.createPendingCommit(record);
    const file = journalFile(journalDir, record.commitId);
    const before = fake.files.get(file);
    const second = store.createPendingCommit(record);

    assert(
        'T03-same-commit-and-record-is-unchanged',
        first.status === 'created' &&
            second.ok === true &&
            second.status === 'unchanged' &&
            second.file === file &&
            fake.files.get(file) === before &&
            countFiles(fake, fileName => fileName.endsWith('.json')) === 1 &&
            fake.calls.write.length === 1
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const firstRecord = makeRecord({
        commitId: 'commit-first',
        eventId: 'event-conflict',
        source: 'betfair'
    });
    const first = store.createPendingCommit(firstRecord);
    const file = journalFile(journalDir, firstRecord.commitId);
    const before = fake.files.get(file);

    const second = store.createPendingCommit(makeRecord({
        commitId: 'commit-second',
        eventId: 'event-conflict',
        source: 'betfair'
    }));

    assert(
        'T04-different-commit-same-event-source-is-blocked',
        first.status === 'created' &&
            second.ok === false &&
            second.status === 'failed' &&
            second.reason === 'pending_exists' &&
            fake.files.get(file) === before &&
            countFiles(fake, fileName => fileName.endsWith('.json')) === 1
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({ commitId: 'commit-documents', eventId: 'event-documents' });
    store.createPendingCommit(record);

    const tooEarly = store.removeCompletedCommit(record.commitId);
    const history = store.markDocumentComplete(record.commitId, 'history');
    const afterHistory = store.getPendingCommit(record.commitId);
    const timeline = store.markDocumentComplete(record.commitId, 'timeline');
    const afterTimeline = store.getPendingCommit(record.commitId);
    const repeated = store.markDocumentComplete(record.commitId, 'timeline');
    const invalidDocument = store.markDocumentComplete(record.commitId, 'invalid');

    assert(
        'T05-mark-history-complete-preserves-timeline',
        history.ok === true &&
            history.status === 'updated' &&
            afterHistory.documents.history.completed === true &&
            afterHistory.documents.timeline.completed === false
    );

    assert(
        'T06-mark-timeline-complete-preserves-history',
        timeline.ok === true &&
            timeline.status === 'updated' &&
            afterTimeline.documents.history.completed === true &&
            afterTimeline.documents.timeline.completed === true
    );

    assert(
        'T07-repeated-document-mark-is-unchanged',
        repeated.ok === true &&
            repeated.status === 'unchanged'
    );

    assert(
        'T08-invalid-document-is-rejected',
        invalidDocument.ok === false &&
            invalidDocument.status === 'failed' &&
            invalidDocument.reason === 'invalid_document'
    );

    assert(
        'T09-remove-before-both-documents-complete-is-blocked',
        tooEarly.ok === false &&
            tooEarly.status === 'failed' &&
            tooEarly.reason === 'not_completed'
    );
}

{
    const { journalDir, store } = createFixture();
    const record = makeRecord({ commitId: 'commit-remove', eventId: 'event-remove' });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'history');
    store.markDocumentComplete(record.commitId, 'timeline');

    const removed = store.removeCompletedCommit(record.commitId);
    const repeated = store.removeCompletedCommit(record.commitId);

    assert(
        'T10-remove-after-both-documents-complete',
        removed.ok === true &&
            removed.status === 'removed' &&
            removed.file === journalFile(journalDir, record.commitId) &&
            store.getPendingCommit(record.commitId) === null
    );

    assert(
        'T11-repeat-remove-is-unchanged',
        repeated.ok === true &&
            repeated.status === 'unchanged' &&
            repeated.reason === null
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-recovery',
        eventId: 'event-recovery',
        source: 'betfair',
        historyPayload: { nested: { value: 1 } },
        timelinePayload: { nested: { value: 2 } }
    });
    store.createPendingCommit(record);

    const before = store.getPendingCommit(record.commitId);
    const result = store.markRecoveryFailed(record.commitId, 'timeline_write_failed');
    const after = store.getPendingCommit(record.commitId);

    assert(
        'T12-mark-recovery-failed-preserves-record',
        result.ok === true &&
            result.status === 'updated' &&
            after.status === 'recovery_failed' &&
            after.reason === 'timeline_write_failed' &&
            JSON.stringify(after.documents) === JSON.stringify(before.documents)
    );
}

{
    const { fake, store } = createFixture();
    const result = store.createPendingCommit(makeRecord({
        commitId: 'commit-canonical-payload',
        eventId: 'event-canonical-payload',
        historyPayload: {
            rows: [
                { player: 'A', scores: [1, 2] },
                { player: 'B', scores: [3, 4] }
            ],
            context: {
                flags: [true, false],
                details: { round: 1 }
            }
        },
        timelinePayload: {
            entries: [
                { score: [15, 0] },
                { score: [30, 0] }
            ]
        }
    }));

    assert(
        'T21-canonical-nested-payload-is-created',
        result.ok === true &&
            result.operation === 'journal' &&
            result.status === 'created' &&
            result.reason === null &&
            countFiles(fake, fileName => fileName.endsWith('.json')) === 1
    );
}

{
    const states = [[true, false], [false, true], [true, true]];

    for (const [index, [historyCompleted, timelineCompleted]] of states.entries()) {
        const { fake, store } = createFixture();
        const result = store.createPendingCommit(makeRecord({
            commitId: `commit-initial-state-${index}`,
            eventId: `event-initial-state-${index}`,
            historyCompleted,
            timelineCompleted
        }));

        assert(
            `T22-initial-completed-${index + 1}-is-rejected`,
            result.ok === false &&
                result.operation === 'journal' &&
                result.status === 'failed' &&
                result.reason === 'invalid_record' &&
                countFiles(fake, fileName => fileName.endsWith('.json')) === 0
        );
    }
}

{
    const { fake, journalDir, store } = createFixture();
    const result = store.createPendingCommit(makeRecord({
        commitId: 'commit-safe-url',
        eventId: 'event-safe-url',
        source: 'betfair',
        historyPayload: {
            diagnostics: {
                url: 'https://api.example.test/data?eventId=123&round=1'
            }
        }
    }));

    assert(
        'T41-normal-url-with-safe-query-is-accepted',
        result.ok === true &&
            result.status === 'created' &&
            countFiles(fake, fileName => fileName.endsWith('.json')) === 1
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const file = journalFile(journalDir, 'commit-unknown-status');
    fake.dirs.add(journalDir);
    fake.seed(file, JSON.stringify({
        version: 1,
        commitId: 'commit-unknown-status',
        eventId: 'event-unknown-status',
        source: 'sofa',
        createdAt: '2026-07-05T12:00:00.000Z',
        status: 'unknown',
        reason: null,
        documents: {
            history: {
                target: 'history-commit-unknown-status.json',
                payload: { kind: 'history' },
                completed: true
            },
            timeline: {
                target: 'timeline-commit-unknown-status.json',
                payload: { kind: 'timeline' },
                completed: true
            }
        }
    }));

    const scan = store.scanRecoveryCandidates();

    assert(
        'T43-unknown-status-is-invalid-record',
        scan.ok === true &&
            scan.fatal === false &&
            scan.records.length === 0 &&
            scan.invalidRecords.length === 1 &&
            scan.invalidEntries.length === 0 &&
            scan.invalidRecords[0].commitId === 'commit-unknown-status' &&
            scan.invalidRecords[0].eventId === 'event-unknown-status' &&
            scan.invalidRecords[0].source === 'sofa' &&
            scan.invalidRecords[0].category === 'invalid_journal_structure' &&
            scan.invalidRecords[0].alreadyRecoveryFailed === false
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const file = journalFile(journalDir, 'commit-raw-invalid');
    fake.dirs.add(journalDir);
    fake.seed(file, JSON.stringify({
        version: 1,
        commitId: 'commit-raw-invalid',
        eventId: 'event-raw-invalid',
        source: 'sofa',
        createdAt: '2026-07-05T12:00:00.000Z',
        status: 'pending',
        reason: null,
        documents: {
            history: {
                target: '',
                payload: { kind: 'history' },
                completed: false
            },
            timeline: {
                target: 'timeline-commit-raw-invalid.json',
                payload: { kind: 'timeline' },
                completed: true
            }
        }
    }));

    const first = store.markRecoveryFailed('commit-raw-invalid', 'invalid_journal_structure');
    const rawAfterFirst = JSON.parse(fake.files.get(file));
    const second = store.markRecoveryFailed('commit-raw-invalid', 'invalid_journal_structure');

    assert(
        'T44-raw-invalid-mark-recovery-failed',
        first.ok === true &&
            first.status === 'updated' &&
            rawAfterFirst.status === 'recovery_failed' &&
            rawAfterFirst.reason === 'invalid_journal_structure' &&
            second.ok === true &&
            second.status === 'unchanged'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const file = path.join(journalDir, 'mismatched-filename.json');
    fake.dirs.add(journalDir);
    fake.seed(file, JSON.stringify({
        version: 1,
        commitId: 'commit-filename-mismatch',
        eventId: 'event-filename-mismatch',
        source: 'sofa',
        createdAt: '2026-07-05T12:00:00.000Z',
        status: 'pending',
        reason: null,
        documents: {
            history: {
                target: 'history.json',
                payload: { kind: 'history' },
                completed: false
            },
            timeline: {
                target: 'timeline.json',
                payload: { kind: 'timeline' },
                completed: false
            }
        }
    }));

    const scan = store.scanRecoveryCandidates();

    assert(
        'T46-filename-mismatch-is-invalid-entry',
        scan.ok === true &&
            scan.records.length === 0 &&
            scan.invalidRecords.length === 0 &&
            scan.invalidEntries.length === 1 &&
            scan.invalidEntries[0].category === 'invalid_journal' &&
            scan.invalidEntries[0].reason === 'invalid_journal'
    );
}

finish('commitJournal/lifecycle');
