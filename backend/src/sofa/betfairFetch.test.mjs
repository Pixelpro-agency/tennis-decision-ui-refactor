import assert from 'node:assert/strict';
import {
    isCanonicalBetfairCommitResult,
    selectRestoredRunnerState,
    restoreMarketStateFromHistory,
    cleanupLegacyBetfairTimeline,
    persistBetfairTrackingSample
} from './betfairFetch.js';
import {
    processBetfairRunnerState,
    commitPendingBetfairRunnerState,
    discardPendingBetfairRunnerState
} from './betfair/processor/runnerProcessing.js';

const stateRunners = [
    {
        selectionId: '101',
        name: 'Old Name',
        matchedTotal: 120,
        ladder: [{ price: 2, traded: 50 }]
    },
    {
        selectionId: '202',
        name: 'Same Name',
        matchedTotal: 220,
        ladder: [{ price: 3, traded: 70 }]
    },
    {
        selectionId: null,
        name: 'No Id Runner',
        matchedTotal: 10
    }
];

const sameIdRenamed = selectRestoredRunnerState(
    { selectionId: 101, name: 'New Name' },
    stateRunners
);
assert.equal(sameIdRenamed?.selectionId, '101');
assert.equal(sameIdRenamed?.matchedTotal, 120);

const differentIdSameName = selectRestoredRunnerState(
    { selectionId: '303', name: 'Same Name' },
    stateRunners
);
assert.equal(differentIdSameName, null);

const missingIdWithNoIdStateSameName = selectRestoredRunnerState(
    { name: 'No Id Runner' },
    stateRunners
);
assert.equal(missingIdWithNoIdStateSameName, null);

const missingIdWithIdentifiedStateSameName = selectRestoredRunnerState(
    { name: 'Same Name' },
    stateRunners
);
assert.equal(missingIdWithIdentifiedStateSameName, null);

assert.equal(
    isCanonicalBetfairCommitResult({
        ok: true,
        status: 'complete',
        legacyWarning: { code: 'legacy_cleanup_failed' }
    }),
    true
);
assert.equal(
    isCanonicalBetfairCommitResult({
        ok: true,
        status: 'recovered',
        legacyWarning: { code: 'legacy_write_failed' }
    }),
    true
);
assert.equal(
    isCanonicalBetfairCommitResult({
        ok: true,
        status: 'unchanged',
        legacyWarning: null
    }),
    false
);
assert.equal(
    isCanonicalBetfairCommitResult({
        ok: 'true',
        status: 'complete'
    }),
    false
);

{
    const stateRunners = [
        { selectionId: '101', name: 'Old Name', ladder: [{ price: 2, traded: 50 }] },
        { selectionId: '202', name: 'Same Name', ladder: [{ price: 3, traded: 70 }] }
    ];

    const restored = restoreMarketStateFromHistory('market-key', {
        history: [{
            betfair: {
                market_info: { total_matched: 1000 },
                runners: [
                    { name: 'New Name', selectionId: 101, moneyFlow: { back: 10 } },
                    { name: 'Same Name', selectionId: 202, moneyFlow: { back: 5 } }
                ]
            },
            latestBetfairState: { runners: stateRunners }
        }]
    });

    assert.equal(restored?.runners?.length, 2);
    assert.equal(restored?.runners?.[0]?.selectionId, '101');
    assert.deepEqual(restored?.runners?.[0]?.ladder, [{ price: 2, traded: 50 }]);
    assert.equal(restored?.runners?.[1]?.selectionId, '202');
}

{
    const historyObj = {
        history: [{
            betfair: {
                market_info: { total_matched: 2000 },
                runners: [
                    {
                        name: 'Player A',
                        selectionId: '101',
                        ladder: [{ price: 1.5, traded: 50 }],
                        ladderSource: 'book_depth',
                        matchedTotal: 400,
                        totalMatchedOnSelection: 400,
                        moneyFlow: { back: 12 }
                    }
                ]
            },
            latestBetfairState: {
                runners: [
                    {
                        name: 'Player A',
                        selectionId: '101',
                        ladder: [{ price: 1.55, traded: 60 }],
                        ladderSource: 'graph',
                        matchedTotal: 410,
                        totalMatchedOnSelection: 410,
                        lastTradedPrice: 1.52
                    }
                ]
            }
        }]
    };

    const restored = restoreMarketStateFromHistory('market-key', historyObj);
    const runner = restored?.runners?.[0];

    assert.equal(runner?.selectionId, '101');
    assert.deepEqual(runner?.ladder, [{ price: 1.55, traded: 60 }]);
    assert.equal(runner?.ladderSource, 'graph');
    assert.equal(runner?.matchedTotal, 400);
    assert.equal(runner?.totalMatchedOnSelection, 400);
    assert.equal(runner?.lastTradedPrice, 1.52);
}

{
    let writtenDocument = null;

    const result = cleanupLegacyBetfairTimeline('event-cleanup', {
        loadTimeline: () => ({
            metadata: { eventId: 'event-cleanup' },
            latest: { data: { source: 'legacy' } },
            timeline: [
                { timestamp: '2020-01-01T00:00:00.000Z', data: { source: 'legacy', seq: 1, runners: [] } },
                { timestamp: '2026-07-06T12:00:00.000Z', data: { source: 'betfair', seq: 5, runners: [{ selectionId: '101' }] } }
            ]
        }),
        writeTimelineDocument: (_source, _eventId, document) => {
            writtenDocument = document;
            return { ok: true, file: '/timeline/betfair_event-cleanup.json' };
        }
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 'cleaned');
    assert.equal(writtenDocument?.latest, undefined);
    assert.equal(writtenDocument?.timeline.length, 1);
    assert.equal(writtenDocument?.timeline[0]?.data?.source, 'betfair');
}

{
    let writtenDocument = null;

    const result = cleanupLegacyBetfairTimeline('event-cleanup-non-finite', {
        loadTimeline: () => ({
            metadata: { eventId: 'event-cleanup-non-finite' },
            latest: { data: { source: 'legacy' } },
            timeline: [
                { timestamp: '2026-07-06T11:50:00.000Z', data: { source: 'betfair', seq: NaN, runners: [{ selectionId: '101' }] } },
                { timestamp: '2026-07-06T12:00:00.000Z', data: { source: 'betfair', seq: 5, runners: [{ selectionId: '101' }] } }
            ]
        }),
        writeTimelineDocument: (_source, _eventId, document) => {
            writtenDocument = document;
            return { ok: true, file: '/timeline/betfair_event-cleanup-non-finite.json' };
        }
    });

    assert.equal(result.ok, true);
    assert.equal(result.status, 'cleaned');
    assert.equal(writtenDocument?.latest, undefined);
    assert.equal(writtenDocument?.timeline.length, 1);
    assert.equal(writtenDocument?.timeline[0]?.data?.seq, 5);
}

{
    const restored = restoreMarketStateFromHistory('market-key', {
        history: [{
            betfair: {
                market_info: { total_matched: 1000 },
                runners: [
                    {
                        name: 'Player A',
                        selectionId: '101',
                        ladder: [{ price: 1.5, traded: 50 }],
                        ladderSource: 'book_depth',
                        matchedTotal: 400,
                        totalMatchedOnSelection: 400,
                        lastTradedPrice: 1.55
                    }
                ]
            },
            latestBetfairState: {
                runners: [
                    {
                        name: 'Player A',
                        selectionId: '101',
                        ladder: [{ price: 1.55, traded: 60 }],
                        ladderSource: 'graph',
                        matchedTotal: 410,
                        totalMatchedOnSelection: 410
                    }
                ]
            }
        }]
    });

    assert.equal(restored?.runners?.[0]?.lastTradedPrice, 1.55);
}

function createMemoryJournal(hooks = {}) {
    const records = new Map();

    return {
        records,
        calls: { create: 0, marks: [], remove: 0 },
        createPendingCommit(record) {
            this.calls.create += 1;
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
                (record.status === 'pending' || record.status === 'recovery_failed')
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
            this.calls.marks.push(documentName);
            if (hooks.markDocumentComplete) {
                return hooks.markDocumentComplete(commitId, documentName, records);
            }
            const record = records.get(commitId);
            if (!record) return { ok: false, status: 'failed' };
            record.documents[documentName].completed = true;
            return { ok: true, status: 'updated' };
        },
        removeCompletedCommit(commitId) {
            this.calls.remove += 1;
            if (hooks.removeCompletedCommit) {
                return hooks.removeCompletedCommit(commitId, records);
            }
            records.delete(commitId);
            return { ok: true, status: 'removed' };
        }
    };
}

function createValidProcessedResult() {
    return {
        market_info: {
            market_id: '1.2020',
            total_matched: 1000
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
                ladder: [{ price: 1.5, back_available: 120, lay_available: 0, traded: 120 }],
                state: { lastPriceTraded: 1.5, totalMatched: 400 },
                matchedTotal: 400,
                totalMatchedOnSelection: 400,
                moneyFlow: { back: 10, lay: 5, trend: 'back', confidence: 'high' }
            },
            {
                name: 'Player B',
                selectionId: '102',
                back: [{ price: 2.5, vol: 80 }],
                lay: [{ price: 2.55, vol: 100 }],
                ladder: [{ price: 2.5, back_available: 80, lay_available: 0, traded: 90 }],
                state: { lastPriceTraded: 2.5, totalMatched: 300 },
                matchedTotal: 300,
                totalMatchedOnSelection: 300,
                moneyFlow: { back: 3, lay: 7, trend: 'lay', confidence: 'high' }
            }
        ]
    };
}

{
    const eventId = 'event-repair-only-recovered';
    const key = 'market-repair-only-recovered';
    const marketState = new Map();
    const raw = createValidProcessedResult();
    processBetfairRunnerState({ key, raw, marketState, deferMarketStateCommit: true });

    const journalStore = createMemoryJournal();
    journalStore.records.set('repair-only-commit', {
        commitId: 'repair-only-commit',
        eventId,
        source: 'betfair',
        status: 'pending',
        documents: {
            history: {
                completed: false,
                target: '/history/event.json',
                payload: {
                    document: { metadata: { eventId, source: 'betfair' }, history: [] },
                    metadata: { eventId, source: 'betfair' }
                }
            },
            timeline: {
                completed: false,
                target: '/timeline/betfair_event.json',
                payload: {
                    document: { metadata: { eventId, source: 'betfair' }, timeline: [] },
                    metadata: { eventId, source: 'betfair' }
                }
            }
        }
    });

    const result = persistBetfairTrackingSample(
        eventId,
        raw,
        key,
        {
            repairOnly: true,
            logDebug: () => {},
            cleanupLegacyBetfairTimeline: () => {},
            journalStore,
            resolveHistoryFile: () => '/history/event.json',
            getTimelineFile: () => '/timeline/betfair_event.json',
            writeHistoryDocument: () => ({ ok: true, file: '/history/event.json', commitId: 'repair-only-commit' }),
            writeTimelineDocument: () => ({ ok: true, file: '/timeline/betfair_event.json', commitId: 'repair-only-commit' }),
            loadTimeline: () => null,
            prepareBetfairHistory: () => {
                throw new Error('prepare must not be called in repairOnly');
            },
            createCommitId: () => {
                throw new Error('createCommitId must not be called in repairOnly');
            }
        }
    );

    const stillPending = commitPendingBetfairRunnerState({ key, raw, marketState });

    assert.equal(result?.ok, true);
    assert.equal(result?.status, 'recovered');
    assert.equal(result?.commitId, 'repair-only-commit');
    assert.equal(journalStore.records.size, 0);
    assert.equal(stillPending, true, 'runner state must not have been committed during repairOnly');
}

{
    const eventId = 'event-repair-only-unchanged';
    const key = 'market-repair-only-unchanged';
    const marketState = new Map();
    const raw = createValidProcessedResult();
    processBetfairRunnerState({ key, raw, marketState, deferMarketStateCommit: true });

    const journalStore = createMemoryJournal();

    const result = persistBetfairTrackingSample(
        eventId,
        raw,
        key,
        {
            repairOnly: true,
            logDebug: () => {},
            cleanupLegacyBetfairTimeline: () => {},
            journalStore,
            resolveHistoryFile: () => '/history/event.json',
            getTimelineFile: () => '/timeline/betfair_event.json',
            writeHistoryDocument: () => ({ ok: true, file: '/history/event.json', commitId: 'commit-1' }),
            writeTimelineDocument: () => ({ ok: true, file: '/timeline/betfair_event.json', commitId: 'commit-1' }),
            loadTimeline: () => null,
            prepareBetfairHistory: () => {
                throw new Error('prepare must not be called in repairOnly without pending');
            },
            createCommitId: () => {
                throw new Error('createCommitId must not be called in repairOnly without pending');
            }
        }
    );

    const stillPending = commitPendingBetfairRunnerState({ key, raw, marketState });

    assert.equal(result?.ok, true);
    assert.equal(result?.status, 'unchanged');
    assert.equal(journalStore.records.size, 0);
    assert.equal(stillPending, true, 'runner state must not have been committed or discarded during repairOnly');
}

{
    let persistCalls = 0;
    let commitCalls = 0;
    let discardCalls = 0;
    const marketState = new Map();
    const processed = { ok: true };

    const result = persistBetfairTrackingSample(
        'event-repair-only-override',
        processed,
        'market-url',
        {
            repairOnly: true,
            persistBetfairProcessedResultFn: (eventId, pr, key, options) => {
                persistCalls++;
                assert.equal(eventId, 'event-repair-only-override');
                assert.equal(pr, processed);
                assert.equal(options.repairOnly, true);
                return { ok: true, status: 'recovered', commitId: 'recovered-override' };
            },
            commitPendingBetfairRunnerStateFn: () => { commitCalls += 1; },
            discardPendingBetfairRunnerStateFn: () => { discardCalls += 1; },
            marketState
        }
    );

    assert.equal(result?.ok, true);
    assert.equal(result?.status, 'recovered');
    assert.equal(result?.commitId, 'recovered-override');
    assert.equal(persistCalls, 1);
    assert.equal(commitCalls, 0);
    assert.equal(discardCalls, 0);
    assert.equal(marketState.size, 0);
}

{
    let persistCalls = 0;
    let commitCalls = 0;
    let discardCalls = 0;
    const marketState = new Map();
    const processed = { ok: true };

    const result = persistBetfairTrackingSample(
        'event-repair-only-unchanged-override',
        processed,
        'market-url',
        {
            repairOnly: true,
            persistBetfairProcessedResultFn: (eventId, pr, key, options) => {
                persistCalls++;
                assert.equal(options.repairOnly, true);
                return { ok: true, status: 'unchanged' };
            },
            commitPendingBetfairRunnerStateFn: () => { commitCalls += 1; },
            discardPendingBetfairRunnerStateFn: () => { discardCalls += 1; },
            marketState
        }
    );

    assert.equal(result?.ok, true);
    assert.equal(result?.status, 'unchanged');
    assert.equal(persistCalls, 1);
    assert.equal(commitCalls, 0);
    assert.equal(discardCalls, 0);
    assert.equal(marketState.size, 0);
}

console.log('betfairFetch strict restore identity and canonical-commit tests passed');
