import {
    persistBetfairProcessedResult
} from '../processor.js';
import { buildBetfairTimelineTick } from '../timeline.js';
import {
    createCheckSuite,
    createHarness,
    createSample
} from './processorTestHarness.mjs';

const { check, finish } = createCheckSuite('persistenceRecovery');

{
    let failFirstTimeline = true;
    const harness = createHarness({
        timelineWriter(_source, _eventId, _document, _metadata, target, commitId) {
            return failFirstTimeline
                ? { ok: false, file: null, commitId }
                : { ok: true, file: target, commitId };
        }
    });

    const first = persistBetfairProcessedResult(
        'repair-event',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const pending = harness.journalStore.records.get('commit-1');
    const seq = pending.documents.timeline.payload.document.timeline[0].data.seq;

    harness.dependencies.loadTimeline = () => {
        throw new Error('repair must not load or rebuild timeline');
    };
    failFirstTimeline = false;

    const recovered = persistBetfairProcessedResult(
        'repair-event',
        createSample(),
        'market-key',
        harness.dependencies
    );

    check(
        'duplicate-retry-repairs-from-journal-with-same-commit-and-seq',
        first.status === 'partial' &&
            recovered.ok === true &&
            recovered.status === 'recovered' &&
            recovered.commitId === 'commit-1' &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 2 &&
            seq === 1 &&
            harness.journalStore.records.size === 0
    );
}

{
    const harness = createHarness();
    harness.journalStore.records.set('commit-1', {
        commitId: 'commit-1',
        eventId: 'recovery-required',
        source: 'betfair',
        status: 'recovery_failed',
        documents: {
            history: {
                completed: false,
                target: harness.targets.history,
                payload: { document: { history: [] }, metadata: {} }
            },
            timeline: {
                completed: false,
                target: harness.targets.timeline,
                payload: { document: { timeline: [] }, metadata: {} }
            }
        }
    });

    const result = persistBetfairProcessedResult(
        'recovery-required',
        createSample(),
        'market-key',
        harness.dependencies
    );

    check(
        'recovery-failed-journal-blocks-all-new-writes',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'recovery_required' &&
            result.failedDocument === 'journal' &&
            harness.journalStore.calls.create === 0 &&
            harness.calls.historyWrites.length === 0 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    const harness = createHarness({
        timelineWriter: () => ({ ok: false, file: null })
    });
    const historyDocument = {
        metadata: { eventId: 'repair-partial', source: 'betfair' },
        history: [{
            timestamp: '2026-07-06T12:00:00.000Z',
            betfair: { totalMatched: 1000 }
        }]
    };
    const timelineDocument = {
        metadata: { eventId: 'repair-partial', source: 'betfair' },
        timeline: [{
            timestamp: '2026-07-06T12:00:00.000Z',
            elapsedSeconds: 37,
            data: {
                source: 'betfair',
                seq: 7,
                runners: [{ selectionId: '101', name: 'Player A' }]
            }
        }]
    };
    const originalHistory = structuredClone(historyDocument);
    const originalTimeline = structuredClone(timelineDocument);

    harness.journalStore.records.set('repair-partial-commit', {
        commitId: 'repair-partial-commit',
        eventId: 'repair-partial',
        source: 'betfair',
        status: 'pending',
        documents: {
            history: {
                completed: false,
                target: harness.targets.history,
                payload: {
                    document: historyDocument,
                    metadata: historyDocument.metadata
                }
            },
            timeline: {
                completed: false,
                target: harness.targets.timeline,
                payload: {
                    document: timelineDocument,
                    metadata: timelineDocument.metadata
                }
            }
        }
    });

    harness.dependencies.loadTimeline = () => {
        throw new Error('repair must not load or rebuild timeline');
    };
    harness.dependencies.prepareBetfairHistory = () => {
        throw new Error('repair must not prepare a new history row');
    };
    harness.dependencies.createCommitId = () => {
        throw new Error('repair must not create a new commit');
    };

    const result = persistBetfairProcessedResult(
        'repair-partial',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const pending = harness.journalStore.records.get('repair-partial-commit');

    check(
        'repair-history-success-then-timeline-failure-is-partial-without-rebuild',
        result.ok === false &&
            result.status === 'partial' &&
            result.reason === 'persistence_incomplete' &&
            result.failedDocument === 'timeline' &&
            harness.journalStore.calls.create === 0 &&
            JSON.stringify(harness.journalStore.calls.marks) === '["history"]' &&
            harness.journalStore.calls.remove === 0 &&
            harness.calls.prepareHistory === 0 &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 1 &&
            JSON.stringify(harness.calls.historyWrites[0].document) ===
                JSON.stringify(originalHistory) &&
            JSON.stringify(harness.calls.timelineWrites[0].document) ===
                JSON.stringify(originalTimeline) &&
            pending?.documents.history.completed === true &&
            pending?.documents.timeline.completed === false
    );
}

{
    let failTimeline = true;
    const harness = createHarness({
        timelineWriter(_source, _eventId, _document, _metadata, target, commitId) {
            return failTimeline
                ? { ok: false, file: null, commitId }
                : { ok: true, file: target, commitId };
        }
    });

    const first = persistBetfairProcessedResult(
        'timeline-retry-same-commit',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const pendingAfterFirst = structuredClone(harness.journalStore.records.get('commit-1'));

    harness.dependencies.loadTimeline = () => {
        throw new Error('retry must not load or rebuild timeline');
    };
    harness.dependencies.prepareBetfairHistory = () => {
        throw new Error('retry must not prepare a new history row');
    };
    harness.dependencies.createCommitId = () => {
        throw new Error('retry must not create a new commit');
    };
    failTimeline = false;

    const recovered = persistBetfairProcessedResult(
        'timeline-retry-same-commit',
        createSample(),
        'market-key',
        harness.dependencies
    );
    const timelineDocument = harness.calls.timelineWrites[1]?.document;

    check(
        'timeline-failure-retry-uses-same-commitId-and-single-tick',
        first.ok === false &&
            first.status === 'partial' &&
            recovered.ok === true &&
            recovered.status === 'recovered' &&
            recovered.commitId === 'commit-1' &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 2 &&
            pendingAfterFirst?.documents.history.completed === true &&
            pendingAfterFirst?.documents.timeline.completed === false &&
            timelineDocument?.timeline.length === 1 &&
            timelineDocument?.timeline[0]?.data?.commitId === 'commit-1'
    );
}

{
    const processed = createSample();
    const baseline = buildBetfairTimelineTick(processed, 'market-key', { timeline: [] });
    baseline.seq = 1;
    const harness = createHarness({
        existingTimeline: { timeline: [{ timestamp: baseline.timestamp, data: baseline }] }
    });
    harness.journalStore.records.set('residual-commit', {
        commitId: 'residual-commit',
        eventId: 'residual-duplicate',
        source: 'betfair',
        status: 'pending',
        documents: {
            history: {
                completed: true,
                target: harness.targets.history,
                payload: { document: { metadata: {}, history: [] }, metadata: {} }
            },
            timeline: {
                completed: true,
                target: harness.targets.timeline,
                payload: { document: { metadata: {}, timeline: [] }, metadata: {} }
            }
        }
    });

    const result = persistBetfairProcessedResult(
        'residual-duplicate',
        structuredClone(processed),
        'market-key',
        harness.dependencies
    );

    check(
        'completed-residual-is-cleaned-before-duplicate-unchanged',
        result.ok === true &&
            result.status === 'unchanged' &&
            result.reason === 'duplicate_tick' &&
            harness.journalStore.records.has('residual-commit') === false &&
            harness.journalStore.calls.create === 0 &&
            harness.calls.createCommitId === 0 &&
            harness.calls.historyWrites.length === 0 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    const harness = createHarness();
    harness.journalStore.records.set('residual-cleanup-failed', {
        commitId: 'residual-cleanup-failed',
        eventId: 'residual-cleanup-failed',
        source: 'betfair',
        status: 'pending',
        documents: {
            history: {
                completed: true,
                target: harness.targets.history,
                payload: { document: { metadata: {}, history: [] }, metadata: {} }
            },
            timeline: {
                completed: true,
                target: harness.targets.timeline,
                payload: { document: { metadata: {}, timeline: [] }, metadata: {} }
            }
        }
    });

    const originalRemove = harness.journalStore.removeCompletedCommit.bind(harness.journalStore);
    harness.journalStore.removeCompletedCommit = function (commitId) {
        if (commitId === 'residual-cleanup-failed') {
            return { ok: false, status: 'failed', reason: 'write_failed' };
        }
        return originalRemove(commitId);
    };

    const result = persistBetfairProcessedResult(
        'residual-cleanup-failed',
        createSample(),
        'market-key',
        harness.dependencies
    );

    check(
        'completed-residual-cleanup-failure-blocks-all-new-writes',
        result.ok === false &&
            result.status === 'failed' &&
            result.reason === 'journal_cleanup_failed' &&
            result.failedDocument === 'journal' &&
            result.commitId === 'residual-cleanup-failed' &&
            harness.journalStore.calls.create === 0 &&
            harness.calls.createCommitId === 0 &&
            harness.calls.historyWrites.length === 0 &&
            harness.calls.timelineWrites.length === 0
    );
}

{
    const historyDocument = {
        metadata: { eventId: 'repair-invalid-raw', source: 'betfair' },
        history: [{
            timestamp: '2026-07-06T12:00:00.000Z',
            betfair: { totalMatched: 1000 }
        }]
    };
    const timelineDocument = {
        metadata: { eventId: 'repair-invalid-raw', source: 'betfair' },
        timeline: [{
            timestamp: '2026-07-06T12:00:00.000Z',
            elapsedSeconds: 37,
            data: {
                source: 'betfair',
                seq: 7,
                runners: [{ selectionId: '101', name: 'Player A' }]
            }
        }]
    };
    const originalHistory = structuredClone(historyDocument);
    const originalTimeline = structuredClone(timelineDocument);

    const harness = createHarness();
    harness.journalStore.records.set('repair-invalid-raw-commit', {
        commitId: 'repair-invalid-raw-commit',
        eventId: 'repair-invalid-raw',
        source: 'betfair',
        status: 'pending',
        documents: {
            history: {
                completed: false,
                target: harness.targets.history,
                payload: {
                    document: historyDocument,
                    metadata: historyDocument.metadata
                }
            },
            timeline: {
                completed: false,
                target: harness.targets.timeline,
                payload: {
                    document: timelineDocument,
                    metadata: timelineDocument.metadata
                }
            }
        }
    });

    harness.dependencies.loadTimeline = () => {
        throw new Error('repair must not load or rebuild timeline');
    };
    harness.dependencies.prepareBetfairHistory = () => {
        throw new Error('repair must not prepare a new history row');
    };
    harness.dependencies.createCommitId = () => {
        throw new Error('repair must not create a new commit');
    };

    const result = persistBetfairProcessedResult(
        'repair-invalid-raw',
        { error: 'technical failure', runners: [], market_info: {}, event_status: { hasFinished: false } },
        'market-key',
        harness.dependencies
    );

    check(
        'pending-repair-with-technically-invalid-raw-uses-journal-only',
        result.ok === true &&
            result.status === 'recovered' &&
            result.commitId === 'repair-invalid-raw-commit' &&
            harness.journalStore.calls.create === 0 &&
            harness.calls.prepareHistory === 0 &&
            harness.calls.historyWrites.length === 1 &&
            harness.calls.timelineWrites.length === 1 &&
            JSON.stringify(harness.calls.historyWrites[0].document) ===
                JSON.stringify(originalHistory) &&
            JSON.stringify(harness.calls.timelineWrites[0].document) ===
                JSON.stringify(originalTimeline) &&
            harness.calls.historyWrites[0].document.timeline === undefined &&
            harness.journalStore.records.size === 0
    );
}

finish();
