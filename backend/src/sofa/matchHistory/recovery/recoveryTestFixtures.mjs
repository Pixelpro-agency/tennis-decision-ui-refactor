import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createCommitJournalStore } from '../commitJournal.js';
import { runPendingCommitRecovery } from '../recovery.js';
import { repairSofaCommitFromJournal } from '../sofaUpdates.js';
import { repairBetfairCommitFromJournal } from '../../betfair/processor.js';

let passed = 0;
let failed = 0;
let fixtureNumber = 0;

export async function test(name, callback) {
    try {
        await callback();
        passed += 1;
        console.log(`  PASS [${name}]`);
    } catch (error) {
        failed += 1;
        console.error(`  FAIL [${name}]`);
        console.error(error);
    }
}

export function makeTempRoot() {
    fixtureNumber += 1;
    return path.join(
        os.tmpdir(),
        `recovery-test-${process.pid}-${fixtureNumber}-${Date.now()}`
    );
}

export function createFixture() {
    const root = makeTempRoot();
    const historyDir = path.join(root, 'match_history');
    const journalDir = path.join(historyDir, '.pending_commits');

    fs.mkdirSync(journalDir, { recursive: true });

    const journalStore = createCommitJournalStore({
        fs,
        path,
        journalDir,
        logError: () => {}
    });

    const historyWrites = [];
    const timelineWrites = [];
    const verifiedTargets = new Set();

    const writeHistoryDocument = (eventId, document, metadata, target, commitId) => {
        historyWrites.push({ eventId, document, metadata, target, commitId });
        return { ok: true, status: 'written', file: target, commitId };
    };

    const writeTimelineDocument = (source, eventId, document, metadata, target, commitId) => {
        timelineWrites.push({ source, eventId, document, metadata, target, commitId });
        return { ok: true, status: 'written', file: target, commitId };
    };

    const verifyDocumentTarget = target => ({
        ok: verifiedTargets.has(target),
        reason: verifiedTargets.has(target) ? null : 'missing'
    });

    const dependencies = {
        journalStore,
        writeHistoryDocument,
        writeTimelineDocument,
        verifyDocumentTarget
    };

    function journalFile(commitId) {
        return path.join(journalDir, `${commitId}.json`);
    }

    function writeJournal(commitId, record) {
        fs.writeFileSync(journalFile(commitId), JSON.stringify(record, null, 2), 'utf8');
    }

    return {
        root,
        journalDir,
        journalStore,
        dependencies,
        historyWrites,
        timelineWrites,
        verifiedTargets,
        journalFile,
        writeJournal,
        cleanup() {
            try {
                fs.rmSync(root, { recursive: true, force: true });
            } catch (_) {
            }
        }
    };
}

export function makeRecord({
    commitId = 'commit-a',
    eventId = 'event-a',
    source = 'sofa',
    status = 'pending',
    reason = null,
    historyCompleted = false,
    timelineCompleted = false,
    historyDocument = { metadata: { eventId: 'event-a' }, history: [] },
    timelineDocument = { metadata: { eventId: 'event-a' }, timeline: [] }
} = {}) {
    return {
        version: 1,
        commitId,
        eventId,
        source,
        createdAt: new Date().toISOString(),
        status,
        reason,
        documents: {
            history: {
                target: `/history/${eventId}.json`,
                payload: {
                    document: historyDocument,
                    metadata: historyDocument.metadata
                },
                completed: historyCompleted
            },
            timeline: {
                target: `/timeline/${source}_${eventId}.json`,
                payload: {
                    document: timelineDocument,
                    metadata: timelineDocument.metadata
                },
                completed: timelineCompleted
            }
        }
    };
}

export function countJournalFiles(fixture) {
    try {
        return fs.readdirSync(fixture.journalDir)
            .filter(name => name.endsWith('.json'))
            .length;
    } catch (_) {
        return 0;
    }
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        throw new Error(`${failed} ${scope} assertions failed`);
    }
}
