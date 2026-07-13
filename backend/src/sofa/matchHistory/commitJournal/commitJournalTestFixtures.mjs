import path from 'node:path';
import fsDefault from 'node:fs';
import os from 'node:os';
import { createHistoryStorage } from '../storage.js';
import { createCommitJournalStore } from '../commitJournal.js';

let passed = 0;
let failed = 0;
let fixtureNumber = 0;

export function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  PASS [${label}]`);
        passed++;
    } else {
        console.error(`  FAIL [${label}]${detail ? `: ${detail}` : ''}`);
        failed++;
    }
}

export function createFakeFs({ initialDirs = [] } = {}) {
    const files = new Map();
    const dirs = new Set(initialDirs);
    const calls = {
        mkdir: [],
        readdir: [],
        read: [],
        write: [],
        rename: [],
        unlink: []
    };

    const fs = {
        existsSync(target) {
            return dirs.has(target) || files.has(target);
        },
        mkdirSync(target) {
            calls.mkdir.push(target);
            dirs.add(target);
        },
        readdirSync(dir) {
            calls.readdir.push(dir);

            return Array.from(files.keys())
                .filter(file => path.dirname(file) === dir)
                .map(file => path.basename(file));
        },
        readFileSync(file) {
            calls.read.push(file);

            if (!files.has(file)) {
                throw new Error('missing file');
            }

            return files.get(file);
        },
        writeFileSync(file, content) {
            calls.write.push(file);
            files.set(file, content);
        },
        renameSync(from, to) {
            calls.rename.push({ from, to });

            if (!files.has(from)) {
                throw new Error('missing temp file');
            }

            files.set(to, files.get(from));
            files.delete(from);
        },
        unlinkSync(file) {
            calls.unlink.push(file);
            files.delete(file);
        }
    };

    return {
        fs,
        files,
        dirs,
        calls,
        seed(file, content) {
            files.set(file, content);
        }
    };
}

export function createFixture(options = {}) {
    fixtureNumber++;

    const root = path.join(
        process.cwd(),
        'virtual-commit-journal',
        `fixture-${process.pid}-${fixtureNumber}`
    );
    const historyDir = path.join(root, 'match_history');
    const journalDir = path.join(historyDir, '.pending_commits');
    const fake = createFakeFs({ initialDirs: [historyDir] });
    const store = createCommitJournalStore({
        fs: fake.fs,
        path,
        journalDir,
        getNow: options.getNow || (() => new Date('2026-07-05T12:00:00.000Z')),
        getNowMs: options.getNowMs || (() => 123456),
        processId: 91,
        logError: () => {}
    });

    return { fake, historyDir, journalDir, store };
}

export function makeRecord({
    commitId = 'commit-a',
    eventId = 'event-a',
    source = 'sofa',
    historyCompleted = false,
    timelineCompleted = false,
    historyPayload = { kind: 'history' },
    timelinePayload = { kind: 'timeline' }
} = {}) {
    return {
        commitId,
        eventId,
        source,
        documents: {
            history: {
                target: `history-${commitId}.json`,
                payload: historyPayload,
                completed: historyCompleted
            },
            timeline: {
                target: `timeline-${commitId}.json`,
                payload: timelinePayload,
                completed: timelineCompleted
            }
        }
    };
}

export function journalFile(journalDir, commitId) {
    return path.join(journalDir, `${commitId}.json`);
}

export function countFiles(fake, predicate) {
    return Array.from(fake.files.keys()).filter(predicate).length;
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        throw new Error(`${failed} ${scope} assertions failed`);
    }
}
