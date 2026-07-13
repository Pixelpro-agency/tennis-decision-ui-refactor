import path from 'node:path';
import { createHistoryStorage } from '../storage.js';
import {
    addSofaUpdate,
    addBetfairUpdate,
    getHistoryFile,
    loadHistory,
    loadHistoryResult,
    saveHistory
} from '../../matchHistory.js';
import {
    assert,
    captureErrors,
    createFakeFs,
    createStorage,
    finish
} from './storageTestFixtures.mjs';

{
    const historyDir = path.join(process.cwd(), 'virtual-history-i');
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            renameSync() {
                throw new Error('rename failure');
            }
        }
    });

    const storage = createStorage(fake, historyDir);
    const result = captureErrors(() => storage.saveHistory('event-7', { history: [] }, {
        tournament: 'Cup',
        players: {
            home: 'A',
            away: 'B'
        }
    }));

    assert(
        'T10-rename-error-returns-failed-result-without-false-success',
        result.value?.ok === false &&
            result.value.operation === 'history' &&
            result.value.status === 'failed' &&
            result.value.reason === 'write_failed' &&
            result.value.file === null &&
            fake.calls.unlink.length === 1 &&
            !Array.from(fake.files.keys()).some(file => file.endsWith('.tmp')) &&
            result.messages.some(message => message.includes('Error saving history file') && message.includes('rename failure'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-direct-target');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);
    const metadata = {
        date: '2026-06-22',
        tournament: 'Direct Open',
        players: {
            home: 'Home',
            away: 'Away'
        }
    };
    const target = storage.resolveHistoryFile('event-direct', metadata);
    const writeResult = storage.writeHistoryDocument(
        'event-direct',
        { metadata: { direct: true }, history: [{ id: 1 }] },
        metadata,
        target
    );
    const writesAfterCanonicalTarget = fake.calls.write.length;
    const rejectedResult = storage.writeHistoryDocument(
        'event-direct',
        { metadata: { direct: false }, history: [{ id: 2 }] },
        metadata,
        path.join(historyDir, 'wrong_event-direct.json')
    );

    assert(
        'T15-direct-writer-persists-only-canonical-target',
        typeof storage.resolveHistoryFile === 'function' &&
            typeof storage.writeHistoryDocument === 'function' &&
            writeResult?.ok === true &&
            writeResult.file === target &&
            JSON.parse(fake.files.get(target)).metadata.direct === true
    );

    assert(
        'T16-direct-writer-rejects-noncanonical-target',
        rejectedResult?.ok === false &&
            rejectedResult.reason === 'write_failed' &&
            rejectedResult.file === null &&
            fake.calls.write.length === writesAfterCanonicalTarget
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-commit-id');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    const result = storage.writeHistoryDocument('event-cid', { history: [] }, {
        tournament: 'Cup',
        players: { home: 'A', away: 'B' }
    });

    assert(
        'T23-writer-without-commitId-has-null',
        result?.ok === true &&
            result.commitId === null
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-commit-id-passed');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    const result = storage.writeHistoryDocument('event-cid-passed', { history: [] }, {
        tournament: 'Cup',
        players: { home: 'A', away: 'B' }
    }, null, 'sofa-abc-123');

    assert(
        'T24-writer-with-commitId-returns-same-commitId',
        result?.ok === true &&
            result.commitId === 'sofa-abc-123'
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-commit-id-fail');
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            renameSync() {
                throw new Error('rename failure');
            }
        }
    });
    const storage = createStorage(fake, historyDir);

    const result = captureErrors(() => storage.writeHistoryDocument('event-cid-fail', { history: [] }, {
        tournament: 'Cup',
        players: { home: 'A', away: 'B' }
    }, null, 'sofa-fail-123'));

    assert(
        'T25-writer-failure-preserves-commitId',
        result.value?.ok === false &&
            result.value.status === 'failed' &&
            result.value.commitId === 'sofa-fail-123'
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-save-no-commitId');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    const result = storage.saveHistory('event-save-no-cid', { history: [] }, {
        tournament: 'Cup',
        players: { home: 'A', away: 'B' }
    });

    assert(
        'T26-saveHistory-without-commitId-has-null',
        result?.ok === true &&
            result.commitId === null
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-save-with-commitId');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    const result = storage.saveHistory('event-save-cid', { history: [] }, {
        tournament: 'Cup',
        players: { home: 'A', away: 'B' }
    }, 'sofa-save-123');

    assert(
        'T27-saveHistory-with-commitId-returns-same-commitId',
        result?.ok === true &&
            result.commitId === 'sofa-save-123'
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-save-fail-commitId');
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            renameSync() {
                throw new Error('rename failure');
            }
        }
    });
    const storage = createStorage(fake, historyDir);

    const result = captureErrors(() => storage.saveHistory('event-save-fail-cid', { history: [] }, {
        tournament: 'Cup',
        players: { home: 'A', away: 'B' }
    }, 'sofa-fail-123'));

    assert(
        'T28-saveHistory-failure-preserves-commitId',
        result.value?.ok === false &&
            result.value.status === 'failed' &&
            result.value.commitId === 'sofa-fail-123'
    );
}

finish('storage/writer');
