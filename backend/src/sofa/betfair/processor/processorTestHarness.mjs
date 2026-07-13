import assert from 'node:assert/strict';

export function createCheckSuite(scope) {
    let passed = 0;
    let failed = 0;

    function check(label, condition) {
        try {
            assert.equal(condition, true);
            console.log(`PASS ${label}`);
            passed += 1;
        } catch {
            console.error(`FAIL ${label}`);
            failed += 1;
        }
    }

    function finish() {
        console.log(`${scope}: ${passed} passed, ${failed} failed`);
        if (failed > 0) {
            throw new Error(`${failed} ${scope} assertions failed`);
        }
    }

    return { check, finish };
}

export function createSample({
    marketTotal = 1000,
    firstMatched = 400,
    secondMatched = 300,
    firstTraded = 120,
    secondTraded = 90
} = {}) {
    return {
        market_info: {
            market_id: '1.2020',
            total_matched: marketTotal
        },
        event_status: { hasFinished: false },
        diagnostics: {},
        graph_diagnostics: {},
        runners: [
            {
                name: 'Player A',
                selectionId: '101',
                back: [{ price: 1.5, vol: 120 }],
                lay: [{ price: 1.52, vol: 150 }],
                ladder: [{ price: 1.5, back_available: 120, lay_available: 0, traded: firstTraded }],
                state: { lastPriceTraded: 1.5, totalMatched: firstMatched },
                matchedTotal: firstMatched,
                totalMatchedOnSelection: firstMatched,
                moneyFlow: { back: 10, lay: 5, trend: 'back', confidence: 'high' }
            },
            {
                name: 'Player B',
                selectionId: '102',
                back: [{ price: 2.5, vol: 80 }],
                lay: [{ price: 2.55, vol: 100 }],
                ladder: [{ price: 2.5, back_available: 80, lay_available: 0, traded: secondTraded }],
                state: { lastPriceTraded: 2.5, totalMatched: secondMatched },
                matchedTotal: secondMatched,
                totalMatchedOnSelection: secondMatched,
                moneyFlow: { back: 3, lay: 7, trend: 'lay', confidence: 'high' }
            }
        ]
    };
}

export function createMemoryJournal(hooks = {}) {
    const records = new Map();
    const calls = { create: 0, marks: [], remove: 0 };

    const store = {
        records,
        calls,
        createPendingCommit(record) {
            calls.create += 1;
            if (hooks.createPendingCommit) {
                return hooks.createPendingCommit(record, records);
            }
            records.set(record.commitId, structuredClone({
                ...record,
                status: 'pending'
            }));
            return { ok: true, status: 'created' };
        },
        findPendingCommit({ eventId, source }) {
            return [...records.values()].find(record =>
                record.eventId === eventId &&
                record.source === source &&
                (record.status === 'pending' || record.status === 'recovery_failed') &&
                (
                    record.documents.history.completed !== true ||
                    record.documents.timeline.completed !== true
                )
            ) || null;
        },
        findCompletedCommit({ eventId, source }) {
            return [...records.values()].find(record =>
                record.eventId === eventId &&
                record.source === source &&
                record.documents.history.completed === true &&
                record.documents.timeline.completed === true
            ) || null;
        },
        getPendingCommit(commitId) {
            return records.get(commitId) || null;
        },
        markDocumentComplete(commitId, documentName) {
            calls.marks.push(documentName);
            if (hooks.markDocumentComplete) {
                return hooks.markDocumentComplete(commitId, documentName, records);
            }
            const record = records.get(commitId);
            if (!record) return { ok: false, status: 'failed' };
            record.documents[documentName].completed = true;
            return { ok: true, status: 'updated' };
        },
        removeCompletedCommit(commitId) {
            calls.remove += 1;
            if (hooks.removeCompletedCommit) {
                return hooks.removeCompletedCommit(commitId, records);
            }
            records.delete(commitId);
            return { ok: true, status: 'removed' };
        }
    };

    return store;
}

export function createHarness({
    existingTimeline = null,
    journalHooks = {},
    historyWriter = null,
    timelineWriter = null,
    prepareBetfairHistoryFn = null
} = {}) {
    const journalStore = createMemoryJournal(journalHooks);
    const calls = {
        loadTimeline: 0,
        prepareHistory: 0,
        historyWrites: [],
        timelineWrites: [],
        cleanup: 0,
        createCommitId: 0
    };
    const targets = {
        history: '/canonical/history_event.json',
        timeline: '/canonical/betfair_event.json'
    };

    const dependencies = {
        logDebug: () => {},
        loadTimeline() {
            calls.loadTimeline += 1;
            return existingTimeline && structuredClone(existingTimeline);
        },
        prepareBetfairHistory(eventId, processed, marketUrl, options = {}) {
            calls.prepareHistory += 1;

            if (prepareBetfairHistoryFn) {
                return prepareBetfairHistoryFn(
                    eventId,
                    processed,
                    marketUrl,
                    options
                );
            }

            const metadata = {
                eventId,
                date: '2026-07-06',
                tournament: 'Test',
                players: { home: 'Player A', away: 'Player B' },
                sofaUrl: '',
                betfairUrl: marketUrl
            };
            const row = options.append === false
                ? null
                : {
                    timestamp: '2026-07-06T12:00:00.000Z',
                    sofa: null,
                    betfair: {
                        totalMatched: processed.market_info.total_matched,
                        runners: processed.runners.map(runner => ({
                            name: runner.name,
                            moneyFlow: runner.moneyFlow
                        }))
                    },
                    commitId: options.commitId || null
                };
            const document = {
                metadata,
                history: options.append === false ? [] : [row]
            };
            return {
                ok: true,
                operation: 'history_prepare',
                source: 'betfair',
                eventId,
                status: 'prepared',
                reason: null,
                document,
                metadata,
                row: document.history[0] || null
            };
        },
        resolveHistoryFile() {
            return targets.history;
        },
        getTimelineFile() {
            return targets.timeline;
        },
        writeHistoryDocument(eventId, document, metadata, target, commitId) {
            calls.historyWrites.push({ eventId, document, metadata, target, commitId });
            return historyWriter
                ? historyWriter(eventId, document, metadata, target, commitId)
                : { ok: true, file: target, commitId };
        },
        writeTimelineDocument(source, eventId, document, metadata, target, commitId) {
            calls.timelineWrites.push({ source, eventId, document, metadata, target, commitId });
            return timelineWriter
                ? timelineWriter(source, eventId, document, metadata, target, commitId)
                : { ok: true, file: target, commitId };
        },
        journalStore,
        createCommitId: () => {
            calls.createCommitId += 1;
            return 'commit-1';
        }
    };

    return { dependencies, journalStore, calls, targets };
}
