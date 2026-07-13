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
    const { fake, historyDir, journalDir, store } = createFixture();
    const eventId = 'event-sidecar';
    const record = makeRecord({
        commitId: 'commit-sidecar',
        eventId
    });
    const result = store.createPendingCommit(record);

    const storage = createHistoryStorage({
        fs: fake.fs,
        path,
        historyDir,
        getNow: () => new Date('2026-07-05T12:00:00.000Z'),
        getNowMs: () => 123456,
        processId: 91
    });

    assert(
        'T19-sidecar-is-not-discovered-as-history',
        result.ok === true &&
            result.file === journalFile(journalDir, record.commitId) &&
            path.dirname(result.file) === journalDir &&
            storage.getHistoryFile(eventId) === null
    );
}

finish('commitJournal/filesystem');
