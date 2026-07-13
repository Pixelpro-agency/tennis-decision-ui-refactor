import assert from 'node:assert/strict';
import { createSofaUpdateHandler } from '../sofaUpdates.js';

export function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function createSofaData(overrides = {}) {
    return {
        eventId: 'event-1',
        url: 'https://example.test/sofa',
        players: {
            home: { name: 'Home' },
            away: { name: 'Away' }
        },
        score: { current: '1-0' },
        serving: 'home',
        stats: {
            match: [{ name: 'Aces', home: 2, away: 1 }]
        },
        status: { type: 'inprogress' },
        surface: 'Clay',
        ...overrides
    };
}

export function createJournal(options = {}) {
    const records = new Map();
    const calls = {
        created: [],
        marked: [],
        removed: []
    };

    const isIncomplete = record =>
        record.status === 'recovery_failed' ||
        record.documents.history.completed !== true ||
        record.documents.timeline.completed !== true;

    return {
        records,
        calls,
        createPendingCommit(candidate) {
            calls.created.push(clone(candidate));
            const override = options.createPendingCommit?.(candidate, calls, records);
            if (override) return override;

            records.set(candidate.commitId, {
                ...clone(candidate),
                status: 'pending'
            });
            return {
                ok: true,
                operation: 'journal',
                status: 'created',
                reason: null
            };
        },
        getPendingCommit(commitId) {
            const record = records.get(commitId);
            return record ? clone(record) : null;
        },
        findPendingCommit({ eventId, source }) {
            for (const record of records.values()) {
                if (record.eventId === eventId &&
                    record.source === source &&
                    isIncomplete(record)) {
                    return clone(record);
                }
            }
            return null;
        },
        findCompletedCommit({ eventId, source }) {
            for (const record of records.values()) {
                if (record.eventId === eventId &&
                    record.source === source &&
                    record.documents.history.completed === true &&
                    record.documents.timeline.completed === true) {
                    return clone(record);
                }
            }
            return null;
        },
        markDocumentComplete(commitId, documentName) {
            calls.marked.push({ commitId, documentName });
            const override = options.markDocumentComplete?.(commitId, documentName, calls, records);
            if (override) return override;

            const record = records.get(commitId);
            if (!record) return { ok: false, status: 'failed', reason: 'not_found' };
            record.documents[documentName].completed = true;
            return {
                ok: true,
                operation: 'journal',
                status: 'updated',
                reason: null
            };
        },
        removeCompletedCommit(commitId) {
            calls.removed.push(commitId);
            const override = options.removeCompletedCommit?.(commitId, calls, records);
            if (override) return override;

            records.delete(commitId);
            return {
                ok: true,
                operation: 'journal',
                status: 'removed',
                reason: null
            };
        }
    };
}

export function createHarness(options = {}) {
    const historyDocuments = new Map();
    const timelineDocuments = new Map();
    const historyWrites = [];
    const timelineWrites = [];
    const latestSofaState = options.latestSofaState || new Map();
    const latestBetfairState = options.latestBetfairState || new Map();
    const journal = options.journal || createJournal(options.journalOptions);
    let nextCommit = 0;

    const writeHistoryDocument = (eventId, document, metadata, target, commitId) => {
        const call = {
            eventId,
            document: clone(document),
            metadata: clone(metadata),
            target,
            commitId
        };
        historyWrites.push(call);
        const result = options.writeHistoryDocument
            ? options.writeHistoryDocument(call, historyWrites.length)
            : { ok: true, status: 'written', file: target, commitId };

        if (result?.ok === true && result.file === target) {
            historyDocuments.set(eventId, clone(document));
        }
        return result;
    };

    const writeTimelineDocument = (source, eventId, document, metadata, target, commitId) => {
        const call = {
            source,
            eventId,
            document: clone(document),
            metadata: clone(metadata),
            target,
            commitId
        };
        timelineWrites.push(call);
        const result = options.writeTimelineDocument
            ? options.writeTimelineDocument(call, timelineWrites.length)
            : { ok: true, status: 'written', file: target, commitId };

        if (result?.ok === true && result.file === target) {
            timelineDocuments.set(`${source}:${eventId}`, clone(document));
        }
        return result;
    };

    const handler = createSofaUpdateHandler({
        latestSofaState,
        latestBetfairState,
        loadHistory: eventId => {
            const document = historyDocuments.get(eventId);
            return document ? clone(document) : null;
        },
        loadHistoryResult: options.loadHistoryResult || (eventId => {
            const document = historyDocuments.get(eventId);
            return {
                ok: true,
                operation: 'history_read',
                eventId,
                status: document ? 'found' : 'missing',
                reason: null,
                history: document ? clone(document) : null,
                file: document ? `/history/${eventId}.json` : null
            };
        }),
        resolveHistoryFile: eventId => `/history/${eventId}.json`,
        writeHistoryDocument,
        loadTimeline: (source, eventId) => {
            const document = timelineDocuments.get(`${source}:${eventId}`);
            return document ? clone(document) : null;
        },
        getTimelineFile: (source, eventId) => `/timeline/${source}_${eventId}.json`,
        writeTimelineDocument,
        journalStore: journal,
        createCommitId: () => `commit-${++nextCommit}`,
        getNow: () => new Date('2026-06-22T12:34:56.000Z')
    });

    return {
        handler,
        journal,
        historyDocuments,
        timelineDocuments,
        historyWrites,
        timelineWrites,
        latestBetfairState,
        setLatestBetfair(eventId, state) {
            latestBetfairState.set(eventId, state);
        }
    };
}

export function emptyDocuments() {
    return {
        history: { ok: null, status: null, file: null, reason: null },
        timeline: { ok: null, status: null, file: null, reason: null }
    };
}

export function expectedResult(overrides = {}) {
    return {
        ok: false,
        operation: 'sofa_commit',
        source: 'sofa',
        eventId: 'event-1',
        commitId: 'commit-1',
        status: 'failed',
        reason: 'persistence_incomplete',
        failedDocument: 'history',
        documents: emptyDocuments(),
        warnings: [],
        ...overrides
    };
}

let passed = 0;

export function test(name, callback) {
    callback();
    passed += 1;
    console.log(`  PASS [${name}]`);
}

export function finish(scope = 'modular test') {
    console.log(`${scope}: ${passed} assertions passed`);
}

export function numericBetfair(totalMatched) {
    return {
        market_info: { total_matched: totalMatched },
        runners: [{ name: "Home", wom: "back", moneyFlow: { back: 12, lay: 4 } }]
    };
}
