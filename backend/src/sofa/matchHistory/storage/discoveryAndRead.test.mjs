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
    const historyDir = path.join(process.cwd(), 'virtual-history-a');
    const fake = createFakeFs();
    createStorage(fake, historyDir);

    assert(
        'T01-creates-missing-directory',
        fake.dirs.has(historyDir) &&
            fake.calls.mkdir.length === 1 &&
            fake.calls.mkdir[0] === historyDir
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-b');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    const result = storage.saveHistory('', { history: [] });

    assert(
        'T02-invalid-event-returns-failed-result',
        result?.ok === false &&
            result.operation === 'history' &&
            result.source === null &&
            result.eventId === '' &&
            result.status === 'failed' &&
            result.reason === 'invalid_event_id' &&
            result.file === null &&
            storage.getHistoryFile('') === null &&
            storage.loadHistory('') === null &&
            fake.calls.write.length === 0 &&
            fake.calls.readdir.length === 0
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-c');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    const writeResult = storage.saveHistory('event-1', { metadata: { ok: true }, history: [] }, {
        date: '2026-01-02',
        tournament: 'Open / Rome',
        players: {
            home: 'Home Player',
            away: 'Away&Player'
        }
    });

    const historyFile = storage.getHistoryFile('event-1');
    const saved = JSON.parse(fake.files.get(historyFile));

    assert(
        'T03-builds-sanitized-filename',
        historyFile.endsWith('2026-01-02_Open___Rome_Home_Player_vs_Away_Player_event-1.json')
    );

    assert(
        'T04-writes-json-atomically-with-structured-result',
        writeResult?.ok === true &&
            writeResult.operation === 'history' &&
            writeResult.source === null &&
            writeResult.eventId === 'event-1' &&
            writeResult.status === 'written' &&
            writeResult.reason === null &&
            writeResult.file === historyFile &&
            saved.metadata.ok === true &&
            fake.calls.write.length === 1 &&
            fake.calls.rename.length === 1 &&
            !Array.from(fake.files.keys()).some(file => file.endsWith('.tmp'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-d');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const existing = path.join(historyDir, 'custom_event-2.json');

    fake.seed(existing, JSON.stringify({ metadata: { old: true }, history: [] }));

    const storage = createStorage(fake, historyDir);

    storage.saveHistory('event-2', { metadata: { updated: true }, history: [{ id: 1 }] }, {
        tournament: 'Ignored',
        players: {
            home: 'Ignored',
            away: 'Ignored'
        }
    });

    assert(
        'T05-reuses-existing-file',
        storage.getHistoryFile('event-2') === existing &&
            fake.files.size === 1 &&
            JSON.parse(fake.files.get(existing)).metadata.updated === true
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-e');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    storage.saveHistory('event-3', { history: [] }, {
        tournament: 'Cup',
        players: {
            home: 'A',
            away: 'B'
        }
    });

    const historyFile = storage.getHistoryFile('event-3');

    assert(
        'T06-uses-clock-default-date',
        historyFile.endsWith('2026-06-22_Cup_A_vs_B_event-3.json')
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-f');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const malformed = path.join(historyDir, 'bad_event-4.json');

    fake.seed(malformed, '{bad-json');

    const storage = createStorage(fake, historyDir);
    const result = captureErrors(() => storage.loadHistory('event-4'));

    assert(
        'T07-malformed-json-is-safe',
        result.value === null &&
            result.messages.some(message => message.includes('Error loading history file'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-g');
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            readFileSync() {
                throw new Error('read failure');
            }
        }
    });

    const target = path.join(historyDir, 'read_event-5.json');
    fake.seed(target, '{"history":[]}');

    const storage = createStorage(fake, historyDir);
    const result = captureErrors(() => storage.loadHistory('event-5'));

    assert(
        'T08-read-error-is-safe',
        result.value === null &&
            result.messages.some(message => message.includes('Error loading history file') && message.includes('read failure'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-h');
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            readdirSync() {
                throw new Error('directory failure');
            }
        }
    });

    const storage = createStorage(fake, historyDir);
    const result = captureErrors(() => storage.getHistoryFile('event-6'));

    assert(
        'T09-directory-error-is-safe',
        result.value === null &&
            result.messages.some(message => message.includes('Error finding history file') && message.includes('directory failure'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-j');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    assert(
        'T11-storage-contract',
        typeof storage.getHistoryFile === 'function' &&
            typeof storage.loadHistory === 'function' &&
            typeof storage.loadHistoryResult === 'function' &&
            typeof storage.saveHistory === 'function'
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-discovery');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const expected = path.join(historyDir, '2026-01-01_Open_Home_vs_Away_event-8.json');

    fake.seed(expected, '{"history":[]}');
    fake.seed(path.join(historyDir, 'sofa_2026-01-01_Open_Home_vs_Away_event-8.json'), '{"timeline":[]}');
    fake.seed(path.join(historyDir, 'betfair_2026-01-01_Open_Home_vs_Away_event-8.json'), '{"timeline":[]}');
    fake.seed(path.join(historyDir, '.2026-01-01_Open_Home_vs_Away_event-8.json.91.123.tmp'), '{"history":[]}');

    const storage = createStorage(fake, historyDir);

    assert(
        'T11-discovery-excludes-sofa-betfair-and-tmp',
        storage.getHistoryFile('event-8') === expected
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-order');
    let reversed = false;
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            readdirSync() {
                reversed = !reversed;
                return reversed
                    ? ['z_event-9.json', 'a_event-9.json']
                    : ['a_event-9.json', 'z_event-9.json'];
            }
        }
    });
    const storage = createStorage(fake, historyDir);
    const expected = path.join(historyDir, 'a_event-9.json');

    assert(
        'T12-discovery-is-stable-across-readdir-order',
        storage.getHistoryFile('event-9') === expected &&
            storage.getHistoryFile('event-9') === expected
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-prefix');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const event1234 = path.join(historyDir, '2026-01-01_Open_Home_vs_Away_1234.json');
    fake.seed(event1234, '{"history":[]}');

    const storage = createStorage(fake, historyDir);

    assert(
        'T13-discovery-does-not-match-event-id-prefix',
        storage.getHistoryFile('123') === null &&
            storage.getHistoryFile('1234') === event1234
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-result-missing');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);

    const result = storage.loadHistoryResult('missing-event');

    assert(
        'T17-loadHistoryResult-missing',
        result?.ok === true &&
            result.operation === 'history_read' &&
            result.eventId === 'missing-event' &&
            result.status === 'missing' &&
            result.reason === null &&
            result.history === null &&
            result.file === null &&
            storage.loadHistory('missing-event') === null
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-result-found');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);
    const historyFile = path.join(historyDir, '2026-01-01_Open_Home_vs_Away_found-event.json');
    const document = { metadata: { eventId: 'found-event' }, history: [{ id: 1 }] };

    fake.seed(historyFile, JSON.stringify(document));

    const result = storage.loadHistoryResult('found-event');

    assert(
        'T18-loadHistoryResult-found',
        result?.ok === true &&
            result.operation === 'history_read' &&
            result.eventId === 'found-event' &&
            result.status === 'found' &&
            result.reason === null &&
            JSON.stringify(result.history) === JSON.stringify(document) &&
            result.file === historyFile &&
            JSON.stringify(storage.loadHistory('found-event')) === JSON.stringify(document)
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-result-invalid-json');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const storage = createStorage(fake, historyDir);
    const historyFile = path.join(historyDir, 'bad_invalid-event.json');

    fake.seed(historyFile, '{bad-json');

    const result = captureErrors(() => storage.loadHistoryResult('invalid-event'));

    assert(
        'T19-loadHistoryResult-invalid-json',
        result.value?.ok === false &&
            result.value.operation === 'history_read' &&
            result.value.eventId === 'invalid-event' &&
            result.value.status === 'failed' &&
            result.value.reason === 'invalid_json' &&
            result.value.file === historyFile &&
            result.value.history === null &&
            storage.loadHistory('invalid-event') === null &&
            result.messages.some(message => message.includes('Error loading history file'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-result-read-failed');
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            readFileSync() {
                throw new Error('read failure');
            }
        }
    });
    const historyFile = path.join(historyDir, 'read_read-event.json');
    fake.seed(historyFile, '{"history":[]}');

    const storage = createStorage(fake, historyDir);
    const result = captureErrors(() => storage.loadHistoryResult('read-event'));

    assert(
        'T20-loadHistoryResult-read-failed',
        result.value?.ok === false &&
            result.value.operation === 'history_read' &&
            result.value.eventId === 'read-event' &&
            result.value.status === 'failed' &&
            result.value.reason === 'read_failed' &&
            result.value.file === historyFile &&
            result.value.history === null &&
            storage.loadHistory('read-event') === null &&
            result.messages.some(message => message.includes('Error loading history file') && message.includes('read failure'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-result-discovery-failed');
    const fake = createFakeFs({
        initialDirs: [historyDir],
        hooks: {
            readdirSync() {
                throw new Error('directory failure');
            }
        }
    });

    const storage = createStorage(fake, historyDir);
    const result = captureErrors(() => storage.loadHistoryResult('discovery-event'));

    assert(
        'T21-loadHistoryResult-discovery-failed',
        result.value?.ok === false &&
            result.value.operation === 'history_read' &&
            result.value.eventId === 'discovery-event' &&
            result.value.status === 'failed' &&
            result.value.reason === 'discovery_failed' &&
            result.value.file === null &&
            result.value.history === null &&
            result.messages.some(message => message.includes('Error finding history file') && message.includes('directory failure'))
    );
}

{
    const historyDir = path.join(process.cwd(), 'virtual-history-result-discovery');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const expected = path.join(historyDir, '2026-01-01_Open_Home_vs_Away_event-discovery.json');

    fake.seed(expected, '{"history":[]}');
    fake.seed(path.join(historyDir, 'sofa_2026-01-01_Open_Home_vs_Away_event-discovery.json'), '{"timeline":[]}');
    fake.seed(path.join(historyDir, 'betfair_2026-01-01_Open_Home_vs_Away_event-discovery.json'), '{"timeline":[]}');
    fake.seed(path.join(historyDir, '.2026-01-01_Open_Home_vs_Away_event-discovery.json.91.123.tmp'), '{"history":[]}');

    const storage = createStorage(fake, historyDir);
    const result = storage.loadHistoryResult('event-discovery');

    assert(
        'T22-loadHistoryResult-discovery-excludes-sofa-betfair-and-tmp',
        result?.ok === true &&
            result.status === 'found' &&
            result.file === expected
    );
}

finish('storage/discovery');
