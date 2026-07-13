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
    const { store } = createFixture();
    const integrity = store.getPersistenceIntegrityStatus('event-none');

    assert(
        'T13-integrity-without-journal',
        integrity.status === 'no_known_partial' &&
            integrity.reason === null &&
            integrity.source === null &&
            integrity.commitId === null &&
            JSON.stringify(integrity.affectedDocuments) === '[]'
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-partial',
        eventId: 'event-partial',
        source: 'sofa'
    });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'timeline');

    const integrity = store.getPersistenceIntegrityStatus('event-partial', 'sofa');

    assert(
        'T14-integrity-pending-history-incomplete',
        integrity.status === 'partial_persistence' &&
            integrity.reason === 'pending_commit' &&
            integrity.source === 'sofa' &&
            integrity.commitId === 'commit-partial' &&
            JSON.stringify(integrity.affectedDocuments) === '["history"]'
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-failed-integrity',
        eventId: 'event-failed-integrity',
        source: 'betfair'
    });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'timeline');
    store.markRecoveryFailed(record.commitId, 'history_write_failed');

    const integrity = store.getPersistenceIntegrityStatus('event-failed-integrity');

    assert(
        'T15-integrity-recovery-failed',
        integrity.status === 'recovery_failed' &&
            integrity.reason === 'history_write_failed' &&
            integrity.source === 'betfair' &&
            integrity.commitId === 'commit-failed-integrity' &&
            JSON.stringify(integrity.affectedDocuments) === '["history"]'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const invalidFile = path.join(journalDir, 'broken.json');
    fake.dirs.add(journalDir);
    fake.seed(invalidFile, '{not-json');

    const listed = store.listPendingCommits();
    const integrity = store.getPersistenceIntegrityStatus('event-invalid');

    assert(
        'T16-invalid-journal-is-observable-without-inventing-integrity',
        listed.ok === false &&
            listed.records.length === 0 &&
            listed.reason === 'invalid_journal' &&
            listed.invalid.length === 1 &&
            listed.invalid[0].file === invalidFile &&
            listed.invalid[0].reason === 'invalid_journal' &&
            integrity.status === 'no_known_partial' &&
            integrity.commitId === null
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const sofaRecord = makeRecord({
        commitId: 'z-pending',
        eventId: 'event-order',
        source: 'sofa'
    });
    const betfairRecord = makeRecord({
        commitId: 'a-pending',
        eventId: 'event-order',
        source: 'betfair'
    });

    store.createPendingCommit(sofaRecord);
    store.createPendingCommit(betfairRecord);

    const originalReaddir = fake.fs.readdirSync;
    let reversed = false;

    fake.fs.readdirSync = dir => {
        if (dir !== journalDir) {
            return originalReaddir(dir);
        }

        reversed = !reversed;
        const names = Array.from(fake.files.keys())
            .filter(file => path.dirname(file) === dir)
            .map(file => path.basename(file))
            .sort();

        return reversed ? names.reverse() : names;
    };

    const tieFirst = store.getPersistenceIntegrityStatus('event-order');
    const tieSecond = store.getPersistenceIntegrityStatus('event-order');

    store.markRecoveryFailed('z-pending', 'recovery_io_failed');

    const failedFirst = store.getPersistenceIntegrityStatus('event-order');
    const failedSecond = store.getPersistenceIntegrityStatus('event-order');

    fake.fs.readdirSync = originalReaddir;

    assert(
        'T18-integrity-selection-is-independent-of-readdir-order',
        tieFirst.commitId === 'a-pending' &&
            tieSecond.commitId === 'a-pending' &&
            failedFirst.commitId === 'z-pending' &&
            failedSecond.commitId === 'z-pending' &&
            failedFirst.status === 'recovery_failed' &&
            failedSecond.status === 'recovery_failed'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const noWriteCalls = () =>
        fake.calls.mkdir.length === 0 &&
        fake.calls.write.length === 0 &&
        fake.calls.rename.length === 0 &&
        fake.calls.unlink.length === 0;

    assert(
        'T23-factory-without-journal-dir-has-no-side-effects',
        fake.dirs.has(journalDir) === false &&
            fake.calls.mkdir.length === 0
    );

    const integrity = store.getPersistenceIntegrityStatus('event-read-only', 'sofa');

    assert(
        'T24-integrity-without-journal-dir-is-read-only',
        integrity.status === 'no_known_partial' &&
            integrity.reason === null &&
            integrity.source === 'sofa' &&
            integrity.commitId === null &&
            JSON.stringify(integrity.affectedDocuments) === '[]' &&
            noWriteCalls()
    );

    const listed = store.listPendingCommits();

    assert(
        'T25-list-without-journal-dir-is-read-only',
        listed.ok === true &&
            listed.records.length === 0 &&
            listed.invalid.length === 0 &&
            listed.reason === null &&
            noWriteCalls()
    );

    const found = store.findPendingCommit({
        eventId: 'event-read-only',
        source: 'sofa'
    });

    assert(
        'T26-find-without-journal-dir-is-read-only',
        found === null &&
            noWriteCalls()
    );

    const loaded = store.getPendingCommit('commit-read-only');

    assert(
        'T27-get-without-journal-dir-is-read-only',
        loaded === null &&
            noWriteCalls()
    );

    const created = store.createPendingCommit(makeRecord({
        commitId: 'commit-read-only',
        eventId: 'event-read-only'
    }));

    assert(
        'T28-create-is-the-only-operation-that-creates-journal-dir',
        fake.dirs.has(journalDir) === true &&
            fake.calls.mkdir.length === 1 &&
            created.ok === true &&
            created.status === 'created'
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-recovery-cleanup',
        eventId: 'event-recovery-cleanup'
    });

    const created = store.createPendingCommit(record);
    const history = store.markDocumentComplete(record.commitId, 'history');
    const failed = store.markRecoveryFailed(record.commitId, 'history_write_failed');
    const timeline = store.markDocumentComplete(record.commitId, 'timeline');
    const integrity = store.getPersistenceIntegrityStatus(
        record.eventId,
        record.source
    );
    const removed = store.removeCompletedCommit(record.commitId);

    assert(
        'T29-recovery-failed-completed-record-is-removable',
        created.status === 'created' &&
            history.status === 'updated' &&
            failed.status === 'updated' &&
            timeline.status === 'updated' &&
            integrity.status === 'no_known_partial' &&
            integrity.reason === null &&
            removed.ok === true &&
            removed.status === 'removed' &&
            store.getPendingCommit(record.commitId) === null
    );
}

{
    const { store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-complete-recovery-guard',
        eventId: 'event-complete-recovery-guard'
    });

    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'history');
    store.markDocumentComplete(record.commitId, 'timeline');

    const before = store.getPendingCommit(record.commitId);
    const recovery = store.markRecoveryFailed(record.commitId, 'history_write_failed');
    const after = store.getPendingCommit(record.commitId);
    const integrity = store.getPersistenceIntegrityStatus(
        record.eventId,
        record.source
    );
    const removed = store.removeCompletedCommit(record.commitId);

    assert(
        'T30-completed-record-is-not-converted-to-recovery-failed',
        recovery.ok === true &&
            recovery.status === 'unchanged' &&
            before.status === 'pending' &&
            after.status === 'pending' &&
            JSON.stringify(after) === JSON.stringify(before) &&
            integrity.status === 'no_known_partial' &&
            removed.status === 'removed'
    );
}

{
    const { fake, journalDir, store } = createFixture();
    const record = makeRecord({
        commitId: 'commit-find-completed',
        eventId: 'event-find-completed',
        source: 'sofa'
    });
    store.createPendingCommit(record);
    store.markDocumentComplete(record.commitId, 'history');
    store.markDocumentComplete(record.commitId, 'timeline');

    const callsBefore = {
        write: fake.calls.write.length,
        rename: fake.calls.rename.length,
        unlink: fake.calls.unlink.length
    };

    const found = store.findCompletedCommit({
        eventId: record.eventId,
        source: record.source
    });

    const noNewWriteCalls = () =>
        fake.calls.write.length === callsBefore.write &&
        fake.calls.rename.length === callsBefore.rename &&
        fake.calls.unlink.length === callsBefore.unlink;

    assert(
        'T36-findCompletedCommit-returns-only-completed-record',
        found !== null &&
            found.commitId === record.commitId &&
            found.eventId === record.eventId &&
            found.source === record.source &&
            found.documents.history.completed === true &&
            found.documents.timeline.completed === true &&
            Object.isFrozen(found) === true &&
            noNewWriteCalls()
    );

    const missing = store.findCompletedCommit({
        eventId: 'event-missing',
        source: 'sofa'
    });

    assert(
        'T37-findCompletedCommit-returns-null-when-missing',
        missing === null &&
            noNewWriteCalls()
    );
}

{
    const tmpDir = path.join(
        os.tmpdir(),
        `commit-journal-realfs-${process.pid}-${Date.now()}`
    );
    const journalDir = path.join(tmpDir, '.pending_commits');

    try {
        const firstStore = createCommitJournalStore({
            journalDir,
            getNow: () => new Date('2026-07-05T12:00:00.000Z'),
            getNowMs: () => 123456,
            processId: 91,
            logError: () => {}
        });
        const record = makeRecord({
            commitId: 'commit-realfs',
            eventId: 'event-realfs',
            source: 'sofa'
        });

        const created = firstStore.createPendingCommit(record);
        const beforeComplete = firstStore.findCompletedCommit({
            eventId: record.eventId,
            source: record.source
        });
        firstStore.markDocumentComplete(record.commitId, 'history');
        firstStore.markDocumentComplete(record.commitId, 'timeline');

        const secondStore = createCommitJournalStore({
            journalDir,
            getNow: () => new Date('2026-07-05T12:00:00.000Z'),
            getNowMs: () => 123456,
            processId: 91,
            logError: () => {}
        });
        const afterComplete = secondStore.findCompletedCommit({
            eventId: record.eventId,
            source: record.source
        });
        const removed = secondStore.removeCompletedCommit(record.commitId);

        const thirdStore = createCommitJournalStore({
            journalDir,
            getNow: () => new Date('2026-07-05T12:00:00.000Z'),
            getNowMs: () => 123456,
            processId: 91,
            logError: () => {}
        });
        const afterRemove = thirdStore.findCompletedCommit({
            eventId: record.eventId,
            source: record.source
        });

        const tmpFiles = fsDefault.readdirSync(tmpDir, { recursive: true });
        const hasTmp = Array.isArray(tmpFiles) &&
            tmpFiles.some(name => String(name).endsWith('.tmp'));

        assert(
            'T42-real-filesystem-lifecycle-is-deterministic',
            created.ok === true &&
                created.status === 'created' &&
                beforeComplete === null &&
                afterComplete !== null &&
                afterComplete.commitId === record.commitId &&
                removed.ok === true &&
                removed.status === 'removed' &&
                afterRemove === null &&
                hasTmp === false
        );
    } finally {
        try {
            fsDefault.rmSync(tmpDir, { recursive: true, force: true });
        } catch (_) {
        }
    }
}

finish('commitJournal/integrity');
