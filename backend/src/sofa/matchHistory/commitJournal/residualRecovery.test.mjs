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
    const completedRecord = makeRecord({
        commitId: 'commit-completed-residual',
        eventId: 'event-completed-residual',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-residual',
        eventId: 'event-completed-residual',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');
    fake.seed(`history-${completedRecord.commitId}.json`, '{}');
    fake.seed(`timeline-${completedRecord.commitId}.json`, '{}');

    const result = store.createPendingCommit(nextRecord);
    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const nextFile = journalFile(journalDir, nextRecord.commitId);
    const nextPending = store.getPendingCommit(nextRecord.commitId);

    assert(
        'T31-completed-residual-is-cleaned-before-new-create',
        result.ok === true &&
            result.status === 'created' &&
            result.file === nextFile &&
            store.getPendingCommit(completedRecord.commitId) === null &&
            fake.calls.unlink.includes(residualFile) &&
            nextPending?.documents.history.completed === false &&
            nextPending?.documents.timeline.completed === false
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const completedRecord = makeRecord({
        commitId: 'commit-residual-cleanup-failure',
        eventId: 'event-residual-cleanup-failure',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-cleanup-failure',
        eventId: 'event-residual-cleanup-failure',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');
    fake.seed(`history-${completedRecord.commitId}.json`, '{}');
    fake.seed(`timeline-${completedRecord.commitId}.json`, '{}');

    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const originalUnlink = fake.fs.unlinkSync;
    fake.fs.unlinkSync = file => {
        if (file === residualFile) {
            throw new Error('cleanup failure');
        }
        return originalUnlink(file);
    };

    const result = store.createPendingCommit(nextRecord);
    fake.fs.unlinkSync = originalUnlink;

    assert(
        'T32-completed-residual-cleanup-failure-blocks-new-create',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'write_failed' &&
            store.getPendingCommit(completedRecord.commitId) !== null &&
            store.getPendingCommit(nextRecord.commitId) === null &&
            fake.files.has(residualFile)
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-completed-residual-cycle',
        eventId: 'event-completed-residual-cycle',
        source: 'sofa'
    });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'history');
    store.markDocumentComplete(record.commitId, 'timeline');

    const found = store.findCompletedCommit({
        eventId: record.eventId,
        source: record.source
    });
    const first = store.removeCompletedCommit(found.commitId);
    const second = store.removeCompletedCommit(found.commitId);

    assert(
        'T38-completed-residual-remove-cycle',
        first.ok === true &&
            first.status === 'removed' &&
            store.getPendingCommit(record.commitId) === null &&
            second.ok === true &&
            second.status === 'unchanged'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-incomplete',
        eventId: 'event-incomplete'
    });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'history');
    store.markDocumentComplete(record.commitId, 'timeline');

    const file = journalFile(journalDir, record.commitId);
    const result = store.markDocumentIncomplete(record.commitId, 'history');
    const persisted = JSON.parse(fake.files.get(file));

    assert(
        'T47-mark-document-incomplete-history',
        result.ok === true &&
            result.operation === 'journal' &&
            result.status === 'updated' &&
            persisted.documents.history.completed === false &&
            persisted.documents.timeline.completed === true &&
            persisted.status === 'pending' &&
            persisted.reason === null
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-incomplete-idempotent',
        eventId: 'event-incomplete-idempotent'
    });
    store.createPendingCommit(record);

    const result = store.markDocumentIncomplete(record.commitId, 'history');

    assert(
        'T48-mark-document-incomplete-idempotent',
        result.ok === true &&
            result.operation === 'journal' &&
            result.status === 'unchanged'
    );
}

{
    const { store } = createFixture();

    assert(
        'T49-mark-document-incomplete-invalid-commit-id',
        store.markDocumentIncomplete('', 'history').ok === false &&
            store.markDocumentIncomplete('', 'history').reason === 'invalid_commit_id'
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({ commitId: 'commit-incomplete-invalid-doc' });
    store.createPendingCommit(record);

    assert(
        'T50-mark-document-incomplete-invalid-document',
        store.markDocumentIncomplete('commit-incomplete-invalid-doc', 'invalid').ok === false &&
            store.markDocumentIncomplete('commit-incomplete-invalid-doc', 'invalid').reason === 'invalid_document'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-incomplete-payload-preserved',
        eventId: 'event-incomplete-payload-preserved',
        historyPayload: { document: { eventId: 'event-incomplete-payload-preserved' }, metadata: { tournament: 'Roland Garros' } },
        timelinePayload: { document: { eventId: 'event-incomplete-payload-preserved' }, metadata: { tournament: 'Roland Garros' } }
    });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'history');
    store.markDocumentComplete(record.commitId, 'timeline');

    const file = journalFile(journalDir, record.commitId);
    const before = JSON.parse(fake.files.get(file));
    const result = store.markDocumentIncomplete(record.commitId, 'history');
    const after = JSON.parse(fake.files.get(file));

    assert(
        'T51-mark-document-incomplete-preserves-payload-target-source',
        result.ok === true &&
            after.documents.history.target === before.documents.history.target &&
            after.documents.history.payload.document.eventId === before.documents.history.payload.document.eventId &&
            after.eventId === before.eventId &&
            after.source === before.source &&
            after.documents.history.completed === false
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-incomplete-write-fail',
        eventId: 'event-incomplete-write-fail'
    });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'history');
    store.markDocumentComplete(record.commitId, 'timeline');

    const file = journalFile(journalDir, record.commitId);
    const before = fake.files.get(file);
    const originalRename = fake.fs.renameSync;

    fake.fs.renameSync = () => {
        throw new Error('rename failure');
    };

    const result = store.markDocumentIncomplete(record.commitId, 'history');
    fake.fs.renameSync = originalRename;

    assert(
        'T52-mark-document-incomplete-write-failure-preserves-journal',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'write_failed' &&
            fake.files.get(file) === before &&
            countFiles(fake, fileName => fileName.endsWith('.tmp')) === 0
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const completedRecord = makeRecord({
        commitId: 'commit-residual-history-missing',
        eventId: 'event-residual-history-missing',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-history-missing',
        eventId: 'event-residual-history-missing',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');
    fake.seed(`timeline-${completedRecord.commitId}.json`, '{}');

    const result = store.createPendingCommit(nextRecord);
    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const residual = store.getPendingCommit(completedRecord.commitId);
    const integrity = store.getPersistenceIntegrityStatus(
        completedRecord.eventId,
        completedRecord.source
    );

    assert(
        'T53-completed-residual-history-missing-blocks-create',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'pending_exists' &&
            fake.files.has(residualFile) &&
            residual?.documents.history.completed === false &&
            residual?.documents.timeline.completed === true &&
            integrity.status === 'partial_persistence' &&
            integrity.affectedDocuments.length === 1 &&
            integrity.affectedDocuments[0] === 'history'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const completedRecord = makeRecord({
        commitId: 'commit-residual-timeline-missing',
        eventId: 'event-residual-timeline-missing',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-timeline-missing',
        eventId: 'event-residual-timeline-missing',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');
    fake.seed(`history-${completedRecord.commitId}.json`, '{}');

    const result = store.createPendingCommit(nextRecord);
    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const residual = store.getPendingCommit(completedRecord.commitId);
    const integrity = store.getPersistenceIntegrityStatus(
        completedRecord.eventId,
        completedRecord.source
    );

    assert(
        'T54-completed-residual-timeline-missing-blocks-create',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'pending_exists' &&
            fake.files.has(residualFile) &&
            residual?.documents.history.completed === true &&
            residual?.documents.timeline.completed === false &&
            integrity.status === 'partial_persistence' &&
            integrity.affectedDocuments.length === 1 &&
            integrity.affectedDocuments[0] === 'timeline'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const completedRecord = makeRecord({
        commitId: 'commit-residual-both-missing',
        eventId: 'event-residual-both-missing',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-both-missing',
        eventId: 'event-residual-both-missing',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');

    const result = store.createPendingCommit(nextRecord);
    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const residual = store.getPendingCommit(completedRecord.commitId);
    const integrity = store.getPersistenceIntegrityStatus(
        completedRecord.eventId,
        completedRecord.source
    );

    assert(
        'T55-completed-residual-both-missing-blocks-create',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'pending_exists' &&
            fake.files.has(residualFile) &&
            residual?.documents.history.completed === false &&
            residual?.documents.timeline.completed === false &&
            integrity.status === 'partial_persistence' &&
            integrity.affectedDocuments.length === 2 &&
            integrity.affectedDocuments.includes('history') &&
            integrity.affectedDocuments.includes('timeline')
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const completedRecord = makeRecord({
        commitId: 'commit-residual-invalid-json',
        eventId: 'event-residual-invalid-json',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-invalid-json',
        eventId: 'event-residual-invalid-json',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');
    fake.seed(`history-${completedRecord.commitId}.json`, '{}');
    fake.seed(`timeline-${completedRecord.commitId}.json`, '{not-json');

    const result = store.createPendingCommit(nextRecord);
    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const residual = store.getPendingCommit(completedRecord.commitId);

    assert(
        'T56-completed-residual-invalid-json-blocks-create',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'pending_exists' &&
            fake.files.has(residualFile) &&
            residual?.documents.history.completed === true &&
            residual?.documents.timeline.completed === false
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const completedRecord = makeRecord({
        commitId: 'commit-residual-reopen-fail',
        eventId: 'event-residual-reopen-fail',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-reopen-fail',
        eventId: 'event-residual-reopen-fail',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');

    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const before = fake.files.get(residualFile);
    const originalRename = fake.fs.renameSync;
    fake.fs.renameSync = () => {
        throw new Error('rename failure');
    };

    const result = store.createPendingCommit(nextRecord);
    fake.fs.renameSync = originalRename;

    assert(
        'T57-completed-residual-reopen-failure-preserves-journal',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'write_failed' &&
            fake.files.has(residualFile) &&
            fake.files.get(residualFile) === before &&
            store.getPendingCommit(nextRecord.commitId) === null
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const completedRecord = makeRecord({
        commitId: 'commit-residual-recovery-failed',
        eventId: 'event-residual-recovery-failed',
        source: 'sofa'
    });
    const nextRecord = makeRecord({
        commitId: 'commit-after-recovery-failed',
        eventId: 'event-residual-recovery-failed',
        source: 'sofa'
    });

    store.createPendingCommit(completedRecord);
    store.markRecoveryFailed(completedRecord.commitId, 'history_write_failed');
    store.markDocumentComplete(completedRecord.commitId, 'history');
    store.markDocumentComplete(completedRecord.commitId, 'timeline');

    const result = store.createPendingCommit(nextRecord);
    const residualFile = journalFile(journalDir, completedRecord.commitId);
    const residual = store.getPendingCommit(completedRecord.commitId);
    const integrity = store.getPersistenceIntegrityStatus(
        completedRecord.eventId,
        completedRecord.source
    );

    assert(
        'T58-completed-residual-recovery-failed-target-missing',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'pending_exists' &&
            fake.files.has(residualFile) &&
            residual?.status === 'recovery_failed' &&
            residual?.documents.history.completed === false &&
            residual?.documents.timeline.completed === false &&
            integrity.status === 'recovery_failed' &&
            integrity.affectedDocuments.includes('history') &&
            integrity.affectedDocuments.includes('timeline')
    );
}

finish('commitJournal/residual');
